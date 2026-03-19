// ============================================================
// BDD Phase Handlers
// ES, PRD Discovery, Clarify, Formulation, Spec Completion
// 從 orchestrator.ts 提取
// ============================================================

import { Server as SocketIOServer } from 'socket.io'
import Redis from 'ioredis'
import * as db from '../../db/client'
import type { FlowState } from '../../types/flow-state'
import type { ClassificationResult } from '../../services/classifier'
import {
  createBddSession, getBddSession, updateBddSession,
  addClarifyItems, answerClarifyItem, confirmBatch,
  revertAnswer, revertResolvedItem, ClarifyItem,
} from '../../services/bdd-session'
import { runPrdDiscovery } from '../../services/prd-discovery'
import { generateDecisionSummary, deduplicateQuestions, generatePartialSpecContext } from '../../services/clarify-dedup'
import { runFormulation, fixMultipleFeatures, generateDraftBatch, GeneratedFeature, FeatureFixInput, FormulationCheckpoint } from '../../services/formulation'
import { runSpecDiscovery, specIssuesToClarifyItems } from '../../services/spec-discovery'
import {
  shouldRunEventStorming, initEventStorming, handleInitConfirm,
  exploreNextItem, handleESAnswer, generateESDocument,
} from '../../services/event-storming'
import type { ESKnowledgeMap } from '../../services/event-storming'
import { generateActionsYml } from '../../services/actions-design'
import { generateIsaConfig } from '../../services/isa-config'
import { validateAndFixFeatures } from '../../services/feature-validation'
import { analyzeChangeImpact, executeChange, verifyConsistency, rollbackChange } from '../../services/change-management'
import { matchTemplates } from '../../services/template-matcher'
import { deriveSchemaFromBdd } from '../../services/schema-derivation'
import { checkDbQuota, provisionNeonDatabase } from '../../services/neon-service'
import { checkInputQuality } from '../../services/prefilter'
import { sendMessage, saveFlowState, getFlowState, deleteFlowState, deductCredits } from '../orchestrator-utils'
import { CREDIT_COSTS } from '../../config/plans'
import { sanitizeClarifyForDisplay, sanitizeForDisplay } from '../../utils/white-text-sanitizer'
import { semanticGateway } from '../../services/semantic-gateway'
import { createLogger } from '../../lib/logger'
import {
  computeDiscoveryLimits, getDiscoveryLimits,
  PRD_DISCOVERY_LIMITS, SPEC_DISCOVERY_LIMITS,
  PHASE_BACKTRACK_MAP, PHASE_LABELS,
} from '../intent-helpers'

const logger = createLogger('bdd-phases')

export async function resendDesignPreference(conversationId: string, state: FlowState, io: SocketIOServer) {
  const matchedCount = state.matchedTemplateIds?.length || 0
  if (matchedCount > 0) {
    await sendMessage(conversationId, io, {
      content: `已返回重新選擇。\n\n你對產品的外觀有什麼想法嗎？\n\n**A.** 我有一些想法，想跟你討論\n\n**B.** 沒有特別的想法，給我看看模板（${matchedCount} 個推薦）`,
      stage: 'uiux_design_preference',
      quickReplies: [
        { label: '我有想法，想跟你討論', value: 'A', style: 'primary' },
        { label: `使用模板（${matchedCount}個推薦）`, value: 'B', style: 'secondary' },
      ],
    })
  } else {
    await sendMessage(conversationId, io, {
      content: `已返回。讓我們重新討論你想要的設計風格吧！`,
      stage: 'uiux_design_preference',
      quickReplies: [
        { label: '開始設計', value: 'A', style: 'primary' },
      ],
    })
  }
}

export async function resendDesignBriefConfirm(conversationId: string, state: FlowState, io: SocketIOServer) {
  if (!state.uiuxDesignBrief) {
    // brief 不存在（不應發生），降級回偏好選擇
    state.phase = 'uiux_design_preference'
    await resendDesignPreference(conversationId, state, io)
    return
  }
  const brief = state.uiuxDesignBrief
  const tierLabel = brief.recommendedTier === 'creative' ? '創意型' : '功能型'
  await sendMessage(conversationId, io, {
    content: `已返回設計方向確認。\n\n**設計模式**：${tierLabel}\n**風格定位**：${brief.styleSummary}\n**色彩方向**：${brief.colorDirection}\n**佈局建議**：${brief.layoutSuggestion}\n\n確認這個方向開始生成？或告訴我想調整的部分。`,
    stage: 'uiux_design_brief_confirm',
    quickReplies: [
      { label: '確認，開始生成', value: '確認', style: 'primary' },
      { label: '我想調整', value: '我想調整', style: 'secondary' },
      { label: '← 重新選擇設計方向', value: '__go_back__', style: 'ghost' },
    ],
  })
}

export async function handleGoBack(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
): Promise<boolean> {
  const targetPhase = PHASE_BACKTRACK_MAP[state.phase]
  if (!targetPhase) return false

  logger.info({ from: state.phase, to: targetPhase }, '回退')

  // 根據目標 phase 清理下游欄位
  if (targetPhase === 'uiux_design_preference') {
    state.uiuxDesignClarifyStep = undefined
    state.uiuxDesignIdeas = undefined
    state.uiuxDesignBrief = undefined
    state.uiuxDesignBriefRound = undefined
    state.uiuxDesignBriefHistory = undefined
    state.uiuxDesignTier = undefined
    state.uiuxPreparedTemplate = undefined
    state.uiuxVariants = undefined
    state.uiuxVariantConcept = undefined
    state.uiuxTemplateId = undefined
  } else if (targetPhase === 'uiux_design_brief_confirm') {
    // 保留 brief，只清除變體
    state.uiuxVariants = undefined
    state.uiuxVariantConcept = undefined
  }

  state.phase = targetPhase
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  // 重新發送目標 phase 的選項消息
  if (targetPhase === 'uiux_design_preference') {
    await resendDesignPreference(conversationId, state, io)
  } else if (targetPhase === 'uiux_design_brief_confirm') {
    await resendDesignBriefConfirm(conversationId, state, io)
  }

  return true
}

// ============================================================
// BDD Phase Routing Handlers (called from phase-router.ts)
// ============================================================

export async function handleFormulationDraftReview(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: SocketIOServer
) {
  // autoAdopt 模式下自動確認草稿
  if (state.autoAdoptMode) {
    await autoAdoptPostFormulation(conversationId, state, redis, io)
    return
  }

  const trimmed = message.trim()
  const isConfirm = trimmed === '確認' || trimmed.includes('確認') || trimmed.includes('繼續') || trimmed === 'Y' || trimmed === 'y'

  if (isConfirm) {
    await sendMessage(conversationId, io, {
      content: '草稿已確認！正在進行品質檢查...',
      stage: 'formulation_complete',
      progress: { current: 3, total: 4, step: '品質檢查' },
    })

    const session = await getBddSession({ sessionId: state.sessionId! })
    const features = (session.data?.featuresContent || []).map(
      (f: { name: string; actionName?: string; content: string }) => ({
        name: f.name,
        actionName: f.actionName || '',
        content: f.content,
      })
    )
    const schemaSql = session.data?.schemaSqlContent || ''
    const entityMapping = session.data?.entityMappingContent || ''

    state.phase = 'spec_discovery'
    state.formulationDraftUncertainItems = undefined
    await saveFlowState(redis, conversationId, state)

    await startSpecDiscovery(conversationId, state, features, schemaSql, entityMapping, redis, io)
  } else {
    await sendMessage(conversationId, io, {
      content: '正在根據你的反饋修改草稿...',
      stage: 'formulation_start',
    })

    const session = await getBddSession({ sessionId: state.sessionId! })
    const existingFeatures = (session.data?.featuresContent || []) as Array<{ name: string; actionName: string; content: string }>

    const fixInputs: FeatureFixInput[] = existingFeatures.map(f => ({
      name: f.name,
      actionName: f.actionName || '',
      content: f.content,
      issues: [trimmed],
    }))

    const fixResult = await fixMultipleFeatures(
      fixInputs,
      session.data?.resolvedItems || [],
      session.data?.schemaSqlContent || '',
      session.data?.entityMappingContent || '',
      { conversationId }
    )

    if (fixResult.success && fixResult.fixedFeatures) {
      await updateBddSession({
        sessionId: state.sessionId!,
        updates: { featuresContent: fixResult.fixedFeatures },
      })

      const featureNames = fixResult.fixedFeatures.map(f => `- ${f.name} (${f.actionName})`).join('\n')
      await sendMessage(conversationId, io, {
        content: `草稿已修改！\n\n${featureNames}\n\n請確認是否符合預期，或繼續提出修改意見。`,
        stage: 'formulation_complete',
        quickReplies: [
          { label: '確認草稿，繼續', value: '確認', style: 'primary' as const },
          { label: '需要調整', value: '調整', style: 'ghost' as const },
        ],
      })
    } else {
      await sendMessage(conversationId, io, {
        content: `修改失敗：${fixResult.error}\n\n請重新描述修改意見，或輸入「確認」跳過修改繼續流程。`,
        stage: 'error',
        quickReplies: [
          { label: '確認草稿，繼續', value: '確認', style: 'primary' as const },
        ],
      })
    }
  }
}

export async function handleSpecRollbackSelect(
  conversationId: string, state: FlowState, message: string, redis: Redis, io: SocketIOServer
) {
    const trimmed = message.trim()
    if (trimmed === '取消' || trimmed.includes('取消')) {
      state.phase = 'spec_completed'
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: '已取消回滾。',
        stage: 'spec_complete',
      })
      return
    }

    const indexMatch = trimmed.match(/^(\d+)$/)
    if (indexMatch) {
      const chosenIndex = parseInt(indexMatch[1], 10) - 1
      const session = await getBddSession({ sessionId: state.sessionId! })
      if (!session.success || !session.data) {
        state.phase = 'spec_completed'
        await saveFlowState(redis, conversationId, state)
        await sendMessage(conversationId, io, { content: '規格資料已過期，已返回完成狀態。', stage: 'error' })
        return
      }
      const history = session.data.changeHistory || []
      if (chosenIndex < 0 || chosenIndex >= history.length) {
        await sendMessage(conversationId, io, {
          content: `⚠️ 無效的編號，請輸入 1-${history.length} 之間的數字。`,
          stage: 'error',
        })
        return
      }

      const entry = history[chosenIndex]
      await sendMessage(conversationId, io, {
        content: `正在回滾變更「${entry.description}」及其之後的所有變更...`,
        stage: 'spec_validating',
      })

      const result = await rollbackChange(state.sessionId!, entry.id)
      if (!result.success) {
        await sendMessage(conversationId, io, {
          content: `回滾失敗：${result.error}`,
          stage: 'error',
        })
        state.phase = 'spec_completed'
        await saveFlowState(redis, conversationId, state)
        return
      }

      const rolledBackCount = history.length - chosenIndex
      state.phase = 'spec_completed'
      // BDD 規格已回滾 → 清除 UIUX 翻譯快取，強制重新翻譯
      state.uiuxUISpec = undefined
      await saveFlowState(redis, conversationId, state)

      await sendMessage(conversationId, io, {
        content: `規格已回滾！已還原 ${rolledBackCount} 筆變更。\n\n- ${result.rolledBackSpecs?.features.length || 0} 個 Feature Files\n\n你可以繼續進行 UI/UX 設計，或描述其他需要修改的地方。`,
        stage: 'spec_complete',
      })
      return
    }

    await sendMessage(conversationId, io, {
      content: '請輸入要回滾的變更編號（如「1」），或輸入「取消」放棄。',
      stage: 'info',
    })
    return
}

export async function handleSpecChangeConfirm(
  conversationId: string, state: FlowState, message: string, redis: Redis, io: SocketIOServer
) {
    const trimmed = message.trim()
    const isConfirm = trimmed === '確認' || trimmed.includes('確認') || trimmed.includes('執行') || trimmed === 'Y' || trimmed === 'y'
    const isCancel = trimmed === '取消' || trimmed.includes('取消') || trimmed === 'N' || trimmed === 'n'

    if (isCancel) {
      state.phase = 'spec_completed'
      state.changeImpact = undefined
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: '已取消變更。你可以繼續進行 UI/UX 設計，或描述其他需要修改的地方。',
        stage: 'spec_complete',
      })
      return
    }

    if (isConfirm && state.changeImpact) {
      await sendMessage(conversationId, io, {
        content: '正在執行變更...',
        stage: 'spec_validating',
      })

      // 取得現有規格
      const session = await getBddSession({ sessionId: state.sessionId! })
      if (!session.success || !session.data) {
        await sendMessage(conversationId, io, {
          content: '無法取得規格資料，請重試。',
          stage: 'error',
        })
        state.phase = 'spec_completed'
        state.changeImpact = undefined
        await saveFlowState(redis, conversationId, state)
        return
      }

      const existingSpecs = {
        esDocument: session.data.esDocumentContent,
        features: (session.data.featuresContent || []) as GeneratedFeature[],
        schemaSql: session.data.schemaSqlContent || '',
        entityMapping: session.data.entityMappingContent || '',
        actionsYml: session.data.actionsYmlContent,
      }

      const changeResult = await executeChange(
        state.changeImpact,
        state.changeImpact.description,
        existingSpecs,
        { conversationId }
      )

      if (!changeResult.success || !changeResult.updatedSpecs) {
        await sendMessage(conversationId, io, {
          content: `變更執行失敗：${changeResult.error}\n\n規格保持不變。`,
          stage: 'error',
        })
        state.phase = 'spec_completed'
        state.changeImpact = undefined
        await saveFlowState(redis, conversationId, state)
        return
      }

      // 一致性驗證
      const updatedFeatures = changeResult.updatedSpecs.features || existingSpecs.features
      const updatedSchemaSql = changeResult.updatedSpecs.schemaSql || existingSpecs.schemaSql
      const updatedEntityMapping = changeResult.updatedSpecs.entityMapping || existingSpecs.entityMapping

      const consistency = verifyConsistency({
        features: updatedFeatures,
        schemaSql: updatedSchemaSql,
        entityMapping: updatedEntityMapping,
        actionsYml: existingSpecs.actionsYml || undefined,
      })

      // 記錄變更歷史（變更前快照）
      const affectedLayersList: string[] = []
      if (state.changeImpact.affectedLayers.features?.length) {
        affectedLayersList.push(...state.changeImpact.affectedLayers.features.map(f => `features:${f}`))
      }
      if (state.changeImpact.affectedLayers.schema?.length) {
        affectedLayersList.push(...state.changeImpact.affectedLayers.schema.map(s => `schema:${s}`))
      }
      if (state.changeImpact.affectedLayers.actions?.length) {
        affectedLayersList.push(...state.changeImpact.affectedLayers.actions.map(a => `actions:${a}`))
      }

      const historyEntry: import('../../services/bdd-session').ChangeHistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        description: state.changeImpact.description,
        changeType: state.changeImpact.changeType,
        affectedLayers: affectedLayersList,
        previousSnapshot: {
          features: existingSpecs.features as import('../../services/bdd-session').FeatureFile[],
          schemaSql: existingSpecs.schemaSql,
          entityMapping: existingSpecs.entityMapping,
          actionsYml: existingSpecs.actionsYml || undefined,
          isaConfig: session.data.isaConfigContent || undefined,
        },
      }

      const existingHistory = session.data.changeHistory || []
      const updatedHistory = [...existingHistory, historyEntry]

      // 更新 DB
      const dbUpdates: Record<string, unknown> = {}
      if (changeResult.updatedSpecs.features) dbUpdates.featuresContent = changeResult.updatedSpecs.features
      if (changeResult.updatedSpecs.schemaSql) dbUpdates.schemaSqlContent = changeResult.updatedSpecs.schemaSql
      if (changeResult.updatedSpecs.entityMapping) dbUpdates.entityMappingContent = changeResult.updatedSpecs.entityMapping
      dbUpdates.changeHistory = updatedHistory

      if (Object.keys(dbUpdates).length > 0) {
        await updateBddSession({
          sessionId: state.sessionId!,
          updates: dbUpdates,
        })
      }

      // 重新生成 Actions + ISA（如影響到）
      const trackingContext = { conversationId }
      if (state.changeImpact.affectedLayers.actions?.length || state.changeImpact.affectedLayers.isa) {
        const actionsResult = await generateActionsYml(
          { features: updatedFeatures, schemaSql: updatedSchemaSql, entityMapping: updatedEntityMapping },
          trackingContext
        )
        if (actionsResult.success && actionsResult.actionsYml) {
          const changeUpdates: Record<string, string> = { actionsYmlContent: actionsResult.actionsYml }
          if (actionsResult.openApiSpec) {
            changeUpdates.openApiSpecContent = actionsResult.openApiSpec
          }
          await updateBddSession({
            sessionId: state.sessionId!,
            updates: changeUpdates,
          })
        }

        const isaResult = generateIsaConfig({
          features: updatedFeatures,
          entityMapping: updatedEntityMapping,
          actionsYml: actionsResult.actionsYml || '',
        })
        if (isaResult.success && isaResult.isaConfigYml) {
          await updateBddSession({
            sessionId: state.sessionId!,
            updates: { isaConfigContent: isaResult.isaConfigYml },
          })
        }
      }

      let resultMsg = `規格變更完成！\n\n- ${updatedFeatures.length} 個 Feature Files`
      if (changeResult.updatedSpecs.schemaSql) resultMsg += '\n- Schema 已更新'
      if (!consistency.passed) {
        resultMsg += `\n\n⚠️ 一致性檢查發現 ${consistency.issues.length} 個問題：\n${consistency.issues.map(i => `- ${i}`).join('\n')}`
      }
      resultMsg += '\n\n你可以繼續進行 UI/UX 設計，或描述更多修改。'

      state.phase = 'spec_completed'
      state.changeImpact = undefined
      // BDD 規格已變更 → 清除 UIUX 翻譯快取，強制下次重新翻譯
      state.uiuxUISpec = undefined
      await saveFlowState(redis, conversationId, state)

      await sendMessage(conversationId, io, {
        content: resultMsg,
        stage: 'spec_complete',
      })
    } else {
      await sendMessage(conversationId, io, {
        content: '請輸入「確認」執行變更，或「取消」放棄。',
        stage: 'info',
        quickReplies: [
          { label: '確認執行', value: '確認', style: 'primary' as const },
          { label: '取消', value: '取消', style: 'ghost' as const },
        ],
      })
    }
    return
}

export async function handleSpecChangeAnalyzing(conversationId: string, io: SocketIOServer) {
  await sendMessage(conversationId, io, {
    content: '正在分析變更影響，請稍候...',
    stage: 'info',
  })
}

export async function handlePrdDiscoveryGenerating(
  conversationId: string, state: FlowState, redis: Redis, io: SocketIOServer
) {
    const PRD_DISCOVERY_TIMEOUT_MS = 5 * 60 * 1000 // 5 分鐘
    const startedAt = state.prdDiscoveryStartedAt || 0
    const isTimedOut = startedAt === 0 || (Date.now() - startedAt > PRD_DISCOVERY_TIMEOUT_MS)
    if (isTimedOut) {
      logger.warn({ startedAt }, 'PRD Discovery 超時或無時間戳，刪除 FlowState 讓用戶重新開始')
      await deleteFlowState(redis, conversationId)
      const isChinese = state.locale !== 'en'
      await sendMessage(conversationId, io, {
        content: isChinese
          ? '需求分析中斷了，請重新描述您的需求。'
          : 'Requirements analysis was interrupted. Please describe your requirements again.',
        stage: 'error',
        quickReplies: [
          { label: isChinese ? '重新開始' : 'Start Over', value: '__new_project__', style: 'primary' as const },
        ],
      })
    } else {
      const isChinese = state.locale !== 'en'
      await sendMessage(conversationId, io, {
        content: isChinese ? '正在分析需求，請稍候...' : 'Analyzing requirements, please wait...',
        stage: 'info',
      })
    }
    return
}

export async function handleFormulationGenerating(
  conversationId: string, state: FlowState, redis: Redis, io: SocketIOServer
) {
    const FORMULATION_TIMEOUT_MS = 15 * 60 * 1000 // 15 分鐘
    const startedAt = state.formulationStartedAt || 0
    // startedAt === 0 代表舊對話（沒有此欄位），視為已超時（肯定沒有活躍的生成任務）
    const isTimedOut = startedAt === 0 || (Date.now() - startedAt > FORMULATION_TIMEOUT_MS)
    if (isTimedOut) {
      logger.warn({ startedAt }, 'Formulation 超時或無時間戳，嘗試恢復')
      const hasCheckpoint = state.formulationSchemaSql && state.formulationIdentifiedFeatures && state.formulationIdentifiedFeatures.length > 0
      if (hasCheckpoint) {
        logger.info({ completed: state.formulationCompletedNames?.length || 0, total: state.formulationTotalExpected || '?' }, '從 checkpoint 恢復 Formulation')
        await sendMessage(conversationId, io, {
          content: `規格生成中斷了，正在從上次進度恢復（已完成 ${state.formulationCompletedNames?.length || 0}/${state.formulationTotalExpected || '?'} 個功能）...`,
          stage: 'formulation_start',
        })
        await resumeFormulation(conversationId, state, redis, io)
      } else {
        logger.info('無 checkpoint，重新開始 Formulation')
        await sendMessage(conversationId, io, {
          content: '規格生成中斷了，正在重新開始...',
          stage: 'formulation_start',
        })
        await restartFormulation(conversationId, state, redis, io)
      }
    } else {
      await sendMessage(conversationId, io, {
        content: '正在產出規格文件，請稍候...',
        stage: 'info',
      })
    }
    return
}

export async function handleSpecDiscoveryGenerating(
  conversationId: string, state: FlowState, redis: Redis, io: SocketIOServer
) {
    const SPEC_DISCOVERY_TIMEOUT_MS = 5 * 60 * 1000 // 5 分鐘
    const startedAt = state.formulationStartedAt || 0 // 複用同一個時間戳
    // startedAt === 0 代表舊對話，視為已超時
    const isTimedOut = startedAt === 0 || (Date.now() - startedAt > SPEC_DISCOVERY_TIMEOUT_MS)
    if (isTimedOut) {
      logger.warn('Spec Discovery 超時或無時間戳，視為完成並進入下一階段')
      await sendMessage(conversationId, io, {
        content: '品質檢查超時，已略過。進入下一階段...',
        stage: 'spec_discovery_complete',
      })
      await completeSpecPhase(conversationId, state, redis, io)
    } else {
      await sendMessage(conversationId, io, {
        content: '正在進行品質檢查，請稍候...',
        stage: 'info',
      })
    }
    return
}

export async function handleBddWaitingForReply(
  conversationId: string, state: FlowState, message: string, redis: Redis, io: SocketIOServer
) {
  if (!state.waitingForReply) {
    logger.warn({ phase: state.phase }, '流程不在等待回覆狀態')
    await sendMessage(conversationId, io, {
      content: '系統正在處理中，請稍候再試。',
      stage: 'info',
    })
    return false
  }

  if (!state.sessionId) {
    logger.warn('缺少 sessionId')
    await sendMessage(conversationId, io, {
      content: '對話狀態異常，請開始新的對話。',
      stage: 'error',
    })
    return false
  }

  const session = await getBddSession({ sessionId: state.sessionId })
  if (!session.success || !session.data) {
    logger.warn('Session 不存在')
    await sendMessage(conversationId, io, {
      content: '規格資料已過期，請開始新的對話。',
      stage: 'error',
    })
    return false
  }

  await processUserReply({
    conversationId,
    userId: state.userId || '',
    message,
    state,
    session: session.data,
    redis,
    io,
  })
  return true
}


// ============================================================
// ES, BDD Discovery, Clarify, Formulation, Spec Functions
// ============================================================

export async function handleESInitReply(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: SocketIOServer
) {
  const trimmed = message.trim()
  const trackingContext = { userId: state.userId, conversationId }

  // 跳過 ES
  if (trimmed === '__skip_es__') {
    await skipESAndStartDiscovery(conversationId, state, redis, io)
    return
  }

  if (!state.esKnowledgeMap) {
    logger.error('ES init reply 但沒有 esKnowledgeMap')
    await skipESAndStartDiscovery(conversationId, state, redis, io)
    return
  }

  const confirmResult = handleInitConfirm(trimmed, state.esKnowledgeMap)

  if (confirmResult.type === 'batch_complete') {
    // 用戶確認，開始 DFS 探索
    state.phase = 'es_explore'
    state.esKnowledgeMap = confirmResult.knowledgeMap
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: confirmResult.content,
      stage: 'es_explore',
    })

    // 開始探索第一個項目
    const exploreResult = await exploreNextItem(state.esKnowledgeMap, trackingContext)
    state.esKnowledgeMap = exploreResult.knowledgeMap
    await saveFlowState(redis, conversationId, state)

    if (exploreResult.type === 'all_complete') {
      await handleESComplete(conversationId, state, exploreResult, redis, io)
    } else {
      await sendMessage(conversationId, io, {
        content: exploreResult.content,
        stage: 'es_explore',
        quickReplies: exploreResult.quickReplies,
      })
    }
  } else {
    // 用戶有修改意見，讓 LLM 重新分析
    await sendMessage(conversationId, io, {
      content: '好的，讓我根據你的反饋重新調整清單...',
      stage: 'es_init',
    })

    const session = await getBddSession({ sessionId: state.sessionId! })
    const originalRequirements = session?.data?.originalRequirements || ''

    const reInitResult = await initEventStorming(
      `${originalRequirements}\n\n用戶補充/修正：${trimmed}`,
      trackingContext
    )

    if (reInitResult.success && reInitResult.knowledgeMap && reInitResult.displayText) {
      state.esKnowledgeMap = reInitResult.knowledgeMap
      state.waitingForReply = true
      await saveFlowState(redis, conversationId, state)

      await sendMessage(conversationId, io, {
        content: reInitResult.displayText,
        stage: 'es_init',
        quickReplies: [
          { label: '確認', value: '確認', style: 'primary' },
          { label: '跳過 ES，直接釐清', value: '__skip_es__', style: 'ghost' },
        ],
      })
    } else {
      logger.warn('ES 重新初始化失敗，跳過 ES')
      await skipESAndStartDiscovery(conversationId, state, redis, io)
    }
  }
}

/**
 * DFS 探索中處理用戶回答
 */
export async function handleESExploreReply(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: SocketIOServer
) {
  const trimmed = message.trim()
  const trackingContext = { userId: state.userId, conversationId }

  // 跳過 ES
  if (trimmed === '__skip_es__') {
    await skipESAndStartDiscovery(conversationId, state, redis, io)
    return
  }

  if (!state.esKnowledgeMap) {
    logger.error('ES explore reply 但沒有 esKnowledgeMap')
    await skipESAndStartDiscovery(conversationId, state, redis, io)
    return
  }

  const answerResult = await handleESAnswer(trimmed, state.esKnowledgeMap, trackingContext)
  state.esKnowledgeMap = answerResult.knowledgeMap
  await saveFlowState(redis, conversationId, state)

  if (answerResult.type === 'all_complete') {
    await handleESComplete(conversationId, state, answerResult, redis, io)
  } else if (answerResult.type === 'batch_complete') {
    // 當前項目完成，繼續探索下一個
    const nextResult = await exploreNextItem(state.esKnowledgeMap, trackingContext)
    state.esKnowledgeMap = nextResult.knowledgeMap
    await saveFlowState(redis, conversationId, state)

    if (nextResult.type === 'all_complete') {
      await handleESComplete(conversationId, state, nextResult, redis, io)
    } else {
      await sendMessage(conversationId, io, {
        content: nextResult.content,
        stage: 'es_explore',
        quickReplies: nextResult.quickReplies,
      })
    }
  } else {
    // proposal / question / sub_question — 繼續等待回答
    await sendMessage(conversationId, io, {
      content: answerResult.content,
      stage: 'es_explore',
      quickReplies: answerResult.quickReplies,
    })
  }
}

/**
 * ES 全部完成，保存文檔並銜接 PRD Discovery
 */
export async function handleESComplete(
  conversationId: string,
  state: FlowState,
  result: { esDocument?: string; content: string; knowledgeMap: ESKnowledgeMap },
  redis: Redis,
  io: SocketIOServer
) {
  const esDocument = result.esDocument || generateESDocument(result.knowledgeMap)

  // 保存 ES 文檔到 BDD Session
  if (state.sessionId) {
    await updateBddSession({
      sessionId: state.sessionId,
      updates: { esDocumentContent: esDocument },
    }).catch(err => logger.error({ err }, '保存 ES 文檔失敗'))
  }

  await sendMessage(conversationId, io, {
    content: result.content,
    stage: 'es_explore',
  })

  // 銜接 Phase 1: PRD Discovery（將 ES 文檔作為補充輸入）
  await startPrdDiscoveryWithES(conversationId, state, esDocument, redis, io)
}

/**
 * 跳過 ES，直接進入 PRD Discovery
 */
export async function skipESAndStartDiscovery(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  // 如果有部分 ES 結果，生成文檔保存
  let esDocument: string | undefined
  if (state.esKnowledgeMap) {
    esDocument = generateESDocument(state.esKnowledgeMap)
    if (state.sessionId) {
      await updateBddSession({
        sessionId: state.sessionId,
        updates: { esDocumentContent: esDocument },
      }).catch(err => logger.error({ err }, '保存部分 ES 文檔失敗'))
    }
  }

  await sendMessage(conversationId, io, {
    content: '好的，跳過 Event Storming，直接進入需求釐清。',
    stage: 'info',
  })

  await startPrdDiscoveryWithES(conversationId, state, esDocument, redis, io)
}

/**
 * 啟動 PRD Discovery（可選帶 ES 文檔）
 */
export async function startPrdDiscoveryWithES(
  conversationId: string,
  state: FlowState,
  esDocument: string | undefined,
  redis: Redis,
  io: SocketIOServer
) {
  const session = await getBddSession({ sessionId: state.sessionId! })
  const originalRequirements = session?.data?.originalRequirements || ''
  const trackingContext = { userId: state.userId, conversationId }

  // 組合需求：原始需求 + ES 文檔
  const enrichedRequirements = esDocument
    ? `${originalRequirements}\n\n---\n## Event Storming 分析結果\n${esDocument}`
    : originalRequirements

  // 有 ES 文檔時重新計算動態上限（複雜度更高）
  if (esDocument && !state.discoveryLimits) {
    state.discoveryLimits = computeDiscoveryLimits(originalRequirements, true)
    logger.info({ maxRounds: state.discoveryLimits.maxRounds, maxQuestions: state.discoveryLimits.maxTotalQuestions }, 'ES 後重算 Discovery 上限')
  }

  state.phase = 'prd_discovery'
  state.prdDiscoveryStartedAt = Date.now()
  state.esKnowledgeMap = undefined // 清除 ES 狀態節省 Redis 空間
  await saveFlowState(redis, conversationId, state)

  await sendMessage(conversationId, io, {
    content: '正在分析需求細節...',
    stage: 'init_progress',
    progress: { current: 2, total: 3, step: '分析需求細節' },
  })

  logger.info({ hasEsDocument: !!esDocument }, '調用 PRD Discovery')
  const discoveryResult = await runPrdDiscovery(enrichedRequirements, trackingContext, undefined, undefined, esDocument || undefined)

  if (!discoveryResult.success || !discoveryResult.items) {
    logger.error({ err: discoveryResult.error }, 'PRD Discovery 失敗')
    // 刪除 FlowState，讓用戶重新輸入時走 handleProcessMessage 重新開始
    await deleteFlowState(redis, conversationId)
    await sendMessage(conversationId, io, {
      content: `分析需求時發生問題：${discoveryResult.error || '未知錯誤'}。請重新描述您的需求。`,
      stage: 'error',
    })
    return
  }

  const discoveryItems: ClarifyItem[] = discoveryResult.items
  logger.info({ count: discoveryItems.length }, 'PRD Discovery 生成釐清問題')

  await addClarifyItems({ sessionId: state.sessionId!, items: discoveryItems })
  await updateBddSession({ sessionId: state.sessionId!, updates: { currentPhase: 'prd_clarify' } })

  if (discoveryItems.length > 0) {
    await sendMessage(conversationId, io, {
      content: '我有一些問題需要跟您確認，讓我們開始吧！',
      stage: 'prd_discovery_complete',
    })

    await sendClarifyQuestion(conversationId, io, discoveryItems[0], 0, discoveryItems.length, {
      answered: 0,
      totalQuestions: discoveryItems.length,
      round: 1,
      maxRounds: getDiscoveryLimits(state).MAX_ROUNDS,
    })

    state.phase = 'prd_clarify'
    state.waitingForReply = true
    state.currentItemId = discoveryItems[0].id
    await saveFlowState(redis, conversationId, state)
  } else {
    await sendMessage(conversationId, io, {
      content: '需求很清楚，正在產出規格...',
      stage: 'prd_discovery_complete',
    })
  }
}

// ============================================================
// BDD Spec Skill
// ============================================================

export interface BddSpecSkillInput {
  taskId: string
  projectId: string
  conversationId: string
  userId: string
  message: string
  locale?: 'zh' | 'en'
  extractedEntities?: ClassificationResult['extractedEntities']
  redis: Redis
  io: SocketIOServer
}

export async function executeBddSpecSkill(input: BddSpecSkillInput) {
  const { taskId, projectId, conversationId, userId, message, locale, redis, io } = input

  // 取得專案背景
  const project = await db.getProject(projectId)
  const projectContext = project?.description || project?.name || undefined

  // 創建 BDD Session
  const sessionResult = await createBddSession({
    projectId,
    conversationId,
    taskId,
    originalRequirements: message,
    projectContext,
  })

  if (!sessionResult.success || !sessionResult.data) {
    throw new Error(sessionResult.error || '創建 BDD Session 失敗')
  }

  const sessionId = sessionResult.data.sessionId

  // 根據需求複雜度動態計算 Discovery 上限
  const discoveryLimits = computeDiscoveryLimits(message)
  logger.info({ maxRounds: discoveryLimits.maxRounds, maxQuestions: discoveryLimits.maxTotalQuestions, msgLength: message.length }, 'Discovery 動態上限')

  // 初始化流程狀態
  const state: FlowState = {
    phase: 'prd_discovery',
    projectId,
    currentRound: 1,
    questionIndex: 0,
    batchCount: 0,
    sessionId,
    taskId,
    waitingForReply: false,
    totalQuestionsAsked: 0,
    userId,
    discoveryLimits,
    prdDiscoveryStartedAt: Date.now(),
    locale: locale || (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(message) ? 'zh' : 'en'),
  }

  await saveFlowState(redis, conversationId, state)

  // ── Phase 0: Event Storming 偵測 ──
  try {
    const esCheck = await shouldRunEventStorming(message, { userId, conversationId })
    logger.info({ needed: esCheck.needed, reasoning: esCheck.reasoning }, 'Event Storming 偵測')

    if (esCheck.needed) {
      await sendMessage(conversationId, io, {
        content: '你的需求看起來比較複雜，讓我先用 Event Storming 來梳理整體結構。',
        stage: 'es_init',
        progress: { current: 1, total: 3, step: '分析系統結構' },
      })

      const esResult = await initEventStorming(message, { userId, conversationId })

      if (esResult.success && esResult.knowledgeMap && esResult.displayText) {
        state.phase = 'es_init'
        state.esKnowledgeMap = esResult.knowledgeMap
        state.waitingForReply = true
        await saveFlowState(redis, conversationId, state)

        await sendMessage(conversationId, io, {
          content: esResult.displayText,
          stage: 'es_init',
          quickReplies: [
            { label: '確認', value: '確認', style: 'primary' },
            { label: '跳過 ES，直接釐清', value: '__skip_es__', style: 'ghost' },
          ],
        })
        return // 等待用戶確認初始清單
      } else {
        logger.warn({ err: esResult.error }, 'Event Storming 初始化失敗，跳過 ES')
        // 降級：繼續原有流程
      }
    }
  } catch (esError) {
    logger.warn({ err: esError }, 'Event Storming 偵測異常，跳過')
    // 降級：繼續原有流程
  }

  // Phase 1.1: PRD Discovery
  await sendMessage(conversationId, io, {
    content: '收到！讓我先了解一下你的需求，稍後會有幾個問題想確認。',
    stage: 'init_progress',
    progress: { current: 2, total: 3, step: '分析需求細節' },
  })

  // 調用 LLM 進行 PRD Discovery（動態生成釐清問題）
  logger.info({ msg: message.slice(0, 100) }, '調用 PRD Discovery 分析需求')
  const discoveryResult = await runPrdDiscovery(message, { userId, conversationId })

  if (!discoveryResult.success || !discoveryResult.items) {
    logger.error({ err: discoveryResult.error }, 'PRD Discovery 失敗')
    // 刪除 FlowState，讓用戶重新輸入時走 handleProcessMessage 重新開始
    await deleteFlowState(redis, conversationId)
    await sendMessage(conversationId, io, {
      content: `分析需求時發生問題：${discoveryResult.error || '未知錯誤'}。請重新描述您的需求。`,
      stage: 'error',
    })
    return
  }

  const discoveryItems: ClarifyItem[] = discoveryResult.items
  logger.info({ count: discoveryItems.length }, 'PRD Discovery 生成釐清問題')

  // 添加釐清項目
  await addClarifyItems({ sessionId, items: discoveryItems })

  // 更新階段
  await updateBddSession({
    sessionId,
    updates: { currentPhase: 'prd_clarify' },
  })

  // 發送第一個問題
  if (discoveryItems.length > 0) {
    await sendMessage(conversationId, io, {
      content: `我有一些問題需要跟您確認，讓我們開始吧！`,
      stage: 'prd_discovery_complete',
    })

    await sendClarifyQuestion(conversationId, io, discoveryItems[0], 0, discoveryItems.length, {
      answered: 0,
      totalQuestions: discoveryItems.length,
      round: 1,
      maxRounds: getDiscoveryLimits(state).MAX_ROUNDS,
    })

    // 更新狀態為等待回覆
    state.phase = 'prd_clarify'
    state.waitingForReply = true
    state.currentItemId = discoveryItems[0].id
    await saveFlowState(redis, conversationId, state)
  } else {
    // 沒有需要釐清的問題
    await sendMessage(conversationId, io, {
      content: '需求很清楚，正在產出規格...',
      stage: 'prd_discovery_complete',
    })
    // 進入 Formulation 階段...
  }
}

// ============================================================
// 處理用戶回覆
// ============================================================

export interface ProcessReplyInput {
  conversationId: string
  userId: string
  message: string
  state: FlowState
  session: {
    id: string
    clarifyItems: ClarifyItem[]
    stagingItems: ClarifyItem[]
    resolvedItems: ClarifyItem[]
  }
  redis: Redis
  io: SocketIOServer
}

export async function processUserReply(input: ProcessReplyInput) {
  const { conversationId, message, state, session, redis, io } = input

  const userMessage = message.trim()

  // 自動採用 AI 建議
  if (userMessage === '__auto_adopt_all__') {
    state.autoAdoptMode = true
    await saveFlowState(redis, conversationId, state)
    await sendMessage(conversationId, io, {
      content: '已啟動自動模式！AI 將自動採用最佳建議完成所有釐清問題...',
      stage: 'auto_adopt_progress',
    })
    try {
      await autoAdoptAllPendingQuestions(conversationId, state, redis, io)
    } catch (err) {
      logger.error({ err }, '自動模式異常，降級手動')
      state.autoAdoptMode = false
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: `自動模式遇到錯誤，已切回手動模式。請繼續回答問題。`,
        stage: 'error',
      })
    }
    return
  }

  // 處理特殊指令
  if (userMessage === '跳過' || userMessage.toLowerCase() === 'skip') {
    // 跳過當前問題
    if (state.currentItemId) {
      const item = session.clarifyItems.find(i => i.id === state.currentItemId)
      if (item) {
        item.status = 'skipped'
        await updateBddSession({
          sessionId: session.id,
          updates: {
            clarifyItems: session.clarifyItems.filter(i => i.id !== state.currentItemId),
            resolvedItems: [...session.resolvedItems, { ...item, status: 'skipped' }],
          },
        })
      }
    }
    state.questionIndex++
    await continueToNextQuestion(conversationId, state, session, redis, io)
    return
  }

  if (userMessage === '完成釐清' || userMessage.toLowerCase() === 'done') {
    await confirmBatch({ sessionId: session.id })
    await completeClärifyPhase(conversationId, state, redis, io)
    return
  }

  // 處理回上一題
  if (userMessage === '__go_back__') {
    const stagingItems = session.stagingItems || []
    if (stagingItems.length > 0) {
      // 回退最後一個已回答的問題
      const lastItem = stagingItems[stagingItems.length - 1]
      await revertAnswer({ sessionId: session.id, itemId: lastItem.id })
      await sendMessage(conversationId, io, {
        content: `好的，讓我們重新回答上一個問題：`,
        stage: 'clarify_revert',
      })
      await sendClarifyQuestion(conversationId, io, lastItem, stagingItems.length - 1, stagingItems.length)
      state.currentItemId = lastItem.id
      state.waitingForReply = true
      await saveFlowState(redis, conversationId, state)
    } else {
      await sendMessage(conversationId, io, {
        content: '目前沒有可以返回的問題。',
        stage: 'info',
      })
    }
    return
  }

  // 處理批量確認回覆
  if (userMessage.toUpperCase() === 'Y' || userMessage === '確認' || userMessage === '確認全部') {
    // 用戶確認批次
    await confirmBatch({ sessionId: session.id })
    await sendMessage(conversationId, io, {
      content: '✅ 已確認！讓我們繼續...',
      stage: 'batch_confirmed',
    })
    // 繼續下一個問題或進入下一輪
    await continueToNextQuestion(conversationId, state, session, redis, io)
    return
  }

  // 處理「反悔/重答」已確認問題
  const revertMatch = userMessage.match(/^(?:反悔|重答)\s*(.+)$/i)
  if (revertMatch) {
    const keyword = revertMatch[1].trim()
    // 搜尋 resolved + staging 中匹配關鍵字的項目
    const allItems = [...(session.resolvedItems || []), ...(session.stagingItems || [])]
    const matchedItem = allItems.find(item =>
      (item.whiteTextQuestion || item.question).includes(keyword) ||
      item.question.includes(keyword)
    )
    if (matchedItem) {
      const isResolved = (session.resolvedItems || []).some(i => i.id === matchedItem.id)
      if (isResolved) {
        await revertResolvedItem({ sessionId: session.id, itemId: matchedItem.id })
      } else {
        await revertAnswer({ sessionId: session.id, itemId: matchedItem.id })
      }
      await sendMessage(conversationId, io, {
        content: `好的，讓我們重新回答這個問題：`,
        stage: 'clarify_revert',
      })
      await sendClarifyQuestion(conversationId, io, { ...matchedItem, status: 'pending', answer: undefined }, 0, 1)
      state.currentItemId = matchedItem.id
      state.waitingForReply = true
      await saveFlowState(redis, conversationId, state)
      return
    } else {
      await sendMessage(conversationId, io, {
        content: `找不到包含「${keyword}」的問題。請嘗試更精確的關鍵字。`,
        stage: 'error',
      })
      return
    }
  }

  // 處理「修改 N」指令
  const modifyMatch = userMessage.match(/^修改\s*(\d+)$/i)
  if (modifyMatch) {
    const itemIndex = parseInt(modifyMatch[1], 10) - 1
    const stagingItems = session.stagingItems || []

    if (itemIndex >= 0 && itemIndex < stagingItems.length) {
      const itemToRevert = stagingItems[itemIndex]
      await revertAnswer({ sessionId: session.id, itemId: itemToRevert.id })

      // 重新發送該問題
      await sendMessage(conversationId, io, {
        content: `好的，讓我們重新回答第 ${modifyMatch[1]} 題：`,
        stage: 'clarify_revert',
      })
      await sendClarifyQuestion(conversationId, io, itemToRevert, itemIndex, stagingItems.length)

      state.currentItemId = itemToRevert.id
      state.waitingForReply = true
      await saveFlowState(redis, conversationId, state)
      return
    } else {
      await sendMessage(conversationId, io, {
        content: `⚠️ 無效的題號。請輸入 1-${stagingItems.length} 之間的數字。`,
        stage: 'error',
      })
      return
    }
  }

  // 驗證並記錄答案
  if (state.currentItemId) {
    const currentItem = session.clarifyItems.find(i => i.id === state.currentItemId)
    if (currentItem) {
      // ── 提案模式回覆處理 ──
      if (userMessage === '__accept_proposal__' || userMessage === '同意') {
        if (currentItem.mode === 'propose' && currentItem.proposedAnswer) {
          // 自動填入 proposedAnswer 作為答案
          await answerClarifyItem({
            sessionId: session.id,
            itemId: currentItem.id,
            answer: currentItem.proposedAnswer,
          })
          // 繼續流程（跳過下方驗證）
          state.questionIndex++
          state.batchCount++
          const BATCH_SIZE = 5
          if (state.batchCount >= BATCH_SIZE) {
            await sendBatchConfirmation(conversationId, state, redis, io)
            return
          }
          await continueToNextQuestion(conversationId, state, session, redis, io)
          return
        }
      }

      if (userMessage === '__reject_proposal__' || userMessage === '不同意') {
        if (currentItem.mode === 'propose') {
          // 切換為 ask 模式，重新發送問題
          await sendMessage(conversationId, io, {
            content: '好的，請告訴我您的看法，或從以下選項中選擇：',
            stage: 'clarify_question',
          })
          // 以 ask 模式重發
          await sendClarifyQuestion(conversationId, io, { ...currentItem, mode: 'ask' }, state.questionIndex, session.clarifyItems.length + session.stagingItems.length + session.resolvedItems.length)
          return
        }
      }

      const validation = validateAnswer(currentItem, userMessage)

      if (!validation.valid) {
        // 重新發送帶 quickReplies 的問題（避免按鈕消失）
        await sendMessage(conversationId, io, {
          content: `⚠️ ${validation.errorMessage}\n\n請重新回答上面的問題。`,
          stage: 'clarify_question',
        })
        await sendClarifyQuestion(conversationId, io, currentItem, state.questionIndex,
          session.clarifyItems.length + session.stagingItems.length + session.resolvedItems.length)
        return
      }

      // ── 語義閘門：自由文字回答是否明確 ──
      const isOptionAnswer = /^[A-Da-d]\.?\s*$/.test(userMessage.trim())
      if (!isOptionAnswer) {
        const isZh = state.locale !== 'en'

        // 超短輸入防護（≤3 字元非中文非有意義短詞 → 直接拒絕，不浪費 Sonnet）
        const shortInput = userMessage.trim()
        if (shortInput.length <= 3 && !/[\u4e00-\u9fff\u3400-\u4dbf]/.test(shortInput) && !/^(yes|no|ok|all|n\/a)$/i.test(shortInput)) {
          await sendMessage(conversationId, io, {
            content: isZh
              ? '我不太確定您的意思。請選擇一個選項（如 A、B、C），或用完整句子描述您的想法。'
              : 'I\'m not sure what you mean. Please select an option (e.g. A, B, C) or describe your thoughts in a complete sentence.',
            stage: 'clarify_question',
          })
          return
        }

        // 品質前置檢查（攔截亂碼，不讓 quickFilter 放行垃圾）
        const qualityCheck = checkInputQuality(userMessage.trim(), 'strict', state.locale)
        if (qualityCheck.quality !== 'valid') {
          await sendMessage(conversationId, io, {
            content: isZh
              ? '我不太確定您的意思。請選擇一個選項（如 A、B、C、D），或用完整句子描述您的想法。'
              : 'I\'m not sure what you mean. Please select an option (e.g. A, B, C, D) or describe your thoughts in a complete sentence.',
            stage: 'clarify_question',
          })
          return
        }

        const questionText = currentItem.whiteTextQuestion || currentItem.question
        const optionsText = currentItem.options && currentItem.options.length > 0
          ? currentItem.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i)
              const label = typeof opt === 'string' ? opt : opt.label
              return `${letter}. ${label}`
            }).join('\n')
          : undefined

        const gatewayResult = await semanticGateway({
          phase: 'bdd_clarify',
          userMessage,
          question: questionText,
          questionOptions: optionsText,
          conversationId,
          userId: state.userId,
          locale: state.locale,
        }, state)

        if (!gatewayResult.accept) {
          state.semanticRejectCount = (state.semanticRejectCount || 0) + 1
          await saveFlowState(redis, conversationId, state)
          await sendMessage(conversationId, io, {
            content: gatewayResult.guidanceMessage || '請更明確地回答這個問題。',
            stage: 'clarify_question',
          })
          return
        }
      }
      // 重置拒絕計數
      state.semanticRejectCount = 0

      // 記錄答案
      await answerClarifyItem({
        sessionId: session.id,
        itemId: currentItem.id,
        answer: validation.normalizedAnswer || userMessage,
      })
    }
  }

  state.questionIndex++
  state.batchCount++

  // 檢查是否需要批量確認
  const BATCH_SIZE = 5
  if (state.batchCount >= BATCH_SIZE) {
    await sendBatchConfirmation(conversationId, state, redis, io)
    return
  }

  await continueToNextQuestion(conversationId, state, session, redis, io)
}

// ============================================================
// 輔助函數
// ============================================================

// ============================================================
// 自動採用 AI 建議
// ============================================================

/**
 * 從 ClarifyItem 自動推斷最佳答案
 * propose 模式 → proposedAnswer
 * ask 模式 → 找「（建議）」選項，沒有就選 A
 * 沒有選項也沒有 proposedAnswer → 跳過
 */
function autoAdoptAnswer(item: ClarifyItem): string {
  if (item.mode === 'propose' && item.proposedAnswer) {
    return item.proposedAnswer
  }
  if (item.options && item.options.length > 0) {
    const opts = item.options.map(opt =>
      typeof opt === 'string' ? opt : (opt.description || opt.label || '')
    )
    const idx = opts.findIndex(o => o.includes('（建議）'))
    return String.fromCharCode(65 + (idx >= 0 ? idx : 0))
  }
  return '__skip__'
}

/**
 * 自動回答所有 BDD 問題直到釐清完成
 * 處理 prd_clarify 和 spec_clarify 兩種 phase
 * 安全閥：MAX_ITERATIONS = 200
 */
async function autoAdoptAllPendingQuestions(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const MAX_ITERATIONS = 200
  let iteration = 0

  while (iteration < MAX_ITERATIONS) {
    iteration++

    const session = await getBddSession({ sessionId: state.sessionId! })
    if (!session.success || !session.data) {
      logger.error('無法取得 BDD Session，中止自動模式')
      state.autoAdoptMode = false
      await saveFlowState(redis, conversationId, state)
      break
    }

    const pending = session.data.clarifyItems.filter((i: ClarifyItem) => i.status === 'pending')

    if (pending.length === 0) {
      // 本輪問完 → confirmBatch
      if (session.data.stagingItems.length > 0) {
        await confirmBatch({ sessionId: state.sessionId! })
      }
      state.batchCount = 0

      // ── spec_clarify：委託 completeSpecClarifyPhase 修復 + 判斷是否再跑一輪 ──
      if (state.phase === 'spec_clarify') {
        await completeSpecClarifyPhase(conversationId, state, redis, io)
        // completeSpecClarifyPhase 可能又進入 spec_clarify（新一輪問題）
        if (state.phase === 'spec_clarify' && state.autoAdoptMode) {
          continue
        }
        return // 已到 uiux_design_preference 或其他終態
      }

      // ── prd_clarify：檢查終止條件，生成下一輪 ──
      const resolvedItems = session.data.resolvedItems || []
      const pendingClarifyItems = session.data.clarifyItems || []
      const allExistingItems = [...resolvedItems, ...pendingClarifyItems]
      const totalAnswered = resolvedItems.length

      const limits = getDiscoveryLimits(state)
      if (state.currentRound >= limits.MAX_ROUNDS || totalAnswered >= limits.MAX_TOTAL_QUESTIONS) {
        logger.info(`達到終止條件 (輪數: ${state.currentRound}/${limits.MAX_ROUNDS}, 問題數: ${totalAnswered}/${limits.MAX_TOTAL_QUESTIONS})`)
        await finishClarifyAndStartFormulation(conversationId, state, redis, io)
        await autoAdoptPostFormulation(conversationId, state, redis, io)
        return
      }

      // 生成下一輪問題（複製 completeClärifyPhase 核心邏輯）
      logger.info(`開始第 ${state.currentRound + 1} 輪 PRD Discovery`)
      await sendMessage(conversationId, io, {
        content: `自動釐清中... 第 ${state.currentRound + 1} 輪`,
        stage: 'auto_adopt_progress',
      })

      const originalRequirements = session.data.originalRequirements || ''
      const decisionSummary = resolvedItems.length >= 5
        ? await generateDecisionSummary(resolvedItems, { conversationId })
        : null

      if (resolvedItems.length >= 5 && !state.partialSpecContext) {
        const partialContext = await generatePartialSpecContext(
          originalRequirements, resolvedItems, { conversationId }
        )
        if (partialContext) {
          state.partialSpecContext = partialContext
        }
      }

      const esDocumentContent = session.data.esDocumentContent || undefined
      const discoveryResult = await runPrdDiscovery(
        originalRequirements, { conversationId },
        allExistingItems, decisionSummary, esDocumentContent,
        state.partialSpecContext
      )

      let newItems = discoveryResult.items || []
      if (newItems.length > 0 && allExistingItems.length > 0) {
        newItems = await deduplicateQuestions(newItems, allExistingItems, { conversationId })
      }

      if (!discoveryResult.success || newItems.length === 0) {
        state.consecutiveEmptyRounds = (state.consecutiveEmptyRounds || 0) + 1
        if (state.consecutiveEmptyRounds >= 2) {
          logger.info(`連續 ${state.consecutiveEmptyRounds} 輪無新問題，進入 Formulation`)
          await finishClarifyAndStartFormulation(conversationId, state, redis, io)
          await autoAdoptPostFormulation(conversationId, state, redis, io)
          return
        }
        state.currentRound++
        await saveFlowState(redis, conversationId, state)
        continue
      }

      // 有新問題
      state.consecutiveEmptyRounds = 0
      await addClarifyItems({ sessionId: state.sessionId!, items: newItems })
      state.currentRound++
      state.totalQuestionsAsked += newItems.length
      state.batchCount = 0
      await saveFlowState(redis, conversationId, state)
      continue
    }

    // ── 回答第一個 pending item ──
    const item = pending[0]
    const answer = autoAdoptAnswer(item)

    if (answer === '__skip__') {
      await updateBddSession({
        sessionId: session.data.id,
        updates: {
          clarifyItems: session.data.clarifyItems.filter((i: ClarifyItem) => i.id !== item.id),
          resolvedItems: [...session.data.resolvedItems, { ...item, status: 'skipped' as const }],
        },
      })
    } else if (item.mode === 'propose' && item.proposedAnswer) {
      await answerClarifyItem({
        sessionId: session.data.id,
        itemId: item.id,
        answer: item.proposedAnswer,
      })
    } else {
      const optIndex = answer.charCodeAt(0) - 65
      const opts = (item.options || []).map(opt =>
        typeof opt === 'string' ? opt : (opt.description || opt.label || '')
      )
      const actualAnswer = opts[optIndex] || answer
      await answerClarifyItem({
        sessionId: session.data.id,
        itemId: item.id,
        answer: actualAnswer,
      })
    }

    state.questionIndex = (state.questionIndex || 0) + 1
    state.batchCount = (state.batchCount || 0) + 1

    // 每 5 題發進度消息
    if (iteration % 5 === 0) {
      const totalDone = session.data.resolvedItems.length + session.data.stagingItems.length + 1
      await sendMessage(conversationId, io, {
        content: `自動採用 AI 建議中... 已完成 ${totalDone} 題`,
        stage: 'auto_adopt_progress',
      })
    }

    await saveFlowState(redis, conversationId, state)
  }

  if (iteration >= MAX_ITERATIONS) {
    logger.error(`達到安全閥上限 ${MAX_ITERATIONS}，中止`)
    state.autoAdoptMode = false
    await saveFlowState(redis, conversationId, state)
    await sendMessage(conversationId, io, {
      content: '自動模式已超過安全上限，已切回手動模式。請繼續回答問題。',
      stage: 'info',
    })
  }
}

/**
 * autoAdopt 完成 PRD Clarify 後，處理後續 Formulation → Spec Discovery → Spec Clarify
 * finishClarifyAndStartFormulation 同步執行完畢後，state.phase 可能是：
 * - formulation_draft_review（草稿需確認）
 * - spec_clarify（Spec Discovery 發現問題）
 * - uiux_design_preference（全部完成）
 * - spec_clarify（Formulation 失敗，回退）
 */
async function autoAdoptPostFormulation(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  if (!state.autoAdoptMode) return

  // 草稿審閱 → 自動確認
  if (state.phase === 'formulation_draft_review') {
    await sendMessage(conversationId, io, {
      content: '自動確認規格草稿...',
      stage: 'auto_adopt_progress',
    })

    const session = await getBddSession({ sessionId: state.sessionId! })
    if (!session.success || !session.data) {
      state.autoAdoptMode = false
      await saveFlowState(redis, conversationId, state)
      return
    }

    const features = (session.data.featuresContent || []).map(
      (f: { name: string; actionName?: string; content: string }) => ({
        name: f.name,
        actionName: f.actionName || '',
        content: f.content,
      })
    )
    const schemaSql = session.data.schemaSqlContent || ''
    const entityMapping = session.data.entityMappingContent || ''

    state.phase = 'spec_discovery'
    state.formulationDraftUncertainItems = undefined
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: '草稿已確認！正在進行品質檢查...',
      stage: 'formulation_complete',
    })
    await startSpecDiscovery(conversationId, state, features, schemaSql, entityMapping, redis, io)

    // startSpecDiscovery 後 state.phase 可能是 spec_clarify 或 uiux_design_preference
    if (state.phase === 'spec_clarify' && state.autoAdoptMode) {
      await autoAdoptAllPendingQuestions(conversationId, state, redis, io)
    }
    return
  }

  // Spec Clarify → 自動回答
  if (state.phase === 'spec_clarify' && state.waitingForReply) {
    await autoAdoptAllPendingQuestions(conversationId, state, redis, io)
    return
  }

  // 其他情況（uiux_design_preference 等）→ autoAdoptMode 已在 completeSpecPhase 中清除
}

export async function sendClarifyQuestion(
  conversationId: string,
  io: SocketIOServer,
  item: ClarifyItem,
  index: number,
  total: number,
  globalProgress?: { answered: number; totalQuestions: number; round: number; maxRounds: number }
) {
  // ── 規則式白話清洗（展示層，不影響 DB 存儲）──
  const rawQuestion = item.whiteTextQuestion || item.question
  const rawOptions = (item.whiteTextOptions && item.whiteTextOptions.length > 0
    ? item.whiteTextOptions
    : (item.options || []).map(opt => typeof opt === 'string' ? opt : (opt.description || opt.label || ''))
  )
  const sanitized = sanitizeClarifyForDisplay(rawQuestion, rawOptions)

  let text = `（${index + 1}/${total}）\n\n${sanitized.question}`

  // ── 提案模式（propose）：AI 直接建議答案，用戶只需確認/否決 ──
  if (item.mode === 'propose' && item.proposedAnswer) {
    text += `\n\n**AI 建議**：${sanitizeForDisplay(item.proposedAnswer)}`
    if (item.confidence === 'high') {
      text += '\n\n_（高信心建議，同意請直接確認）_'
    }

    const quickReplies: { label: string; value: string; style?: 'primary' | 'secondary' | 'ghost' }[] = [
      { label: '同意', value: '__accept_proposal__', style: 'primary' },
      { label: '不同意', value: '__reject_proposal__', style: 'ghost' },
    ]

    // 計算建築進度
    const buildingProgress = globalProgress ? {
      current: globalProgress.answered + 1,
      total: globalProgress.totalQuestions,
      round: globalProgress.round,
      maxRounds: globalProgress.maxRounds,
    } : undefined

    await sendMessage(conversationId, io, {
      content: text,
      stage: 'clarify_question',
      quickReplies,
      richContent: buildingProgress ? {
        type: 'building_progress' as const,
        data: buildingProgress as unknown as Record<string, unknown>,
      } : undefined,
    })
    return
  }

  // ── 普通問答模式（ask）──
  // 使用白話清洗後的選項展示
  const displayOptions = sanitized.options

  // 檢測是否有「（建議）」選項
  let hasProposal = false
  if (displayOptions.length > 0) {
    hasProposal = displayOptions.some(opt => opt.includes('（建議）'))
  }

  if (hasProposal) {
    text += '\n\n_以下有一個建議選項，若您同意可直接確認：_\n\n'
  } else {
    text += '\n\n'
  }

  if (displayOptions.length > 0) {
    text += displayOptions.map((opt, j) => {
      const match = opt.match(/^([A-Z])\.\s*(.*)$/)
      if (match) {
        const isProposal = match[2].includes('（建議）')
        const display = isProposal ? `${match[2]}  ✅` : match[2]
        return `**${match[1]}.** ${display}`
      }
      return `**${String.fromCharCode(65 + j)}.** ${opt}`
    }).join('\n\n')
    text += '\n\n_（或直接輸入您的答案）_'
  }

  // 構建 quick replies（也基於白話選項）
  const quickReplies: { label: string; value: string; style?: 'primary' | 'secondary' | 'ghost' }[] = []
  if (displayOptions.length > 0) {
    displayOptions.forEach((opt, j) => {
      const letter = String.fromCharCode(65 + j)
      const match = opt.match(/^([A-Z])\.\s*(.*)$/)
      const label = match ? `${match[1]}. ${match[2]}` : `${letter}. ${opt}`
      const optStr = match ? match[2] : opt
      const isProposal = optStr.includes('（建議）')
      quickReplies.push({ label, value: letter, style: isProposal ? 'primary' : 'ghost' })
    })
  }

  // 計算建築進度（用於 3D 蓋房子動畫）
  const buildingProgress = globalProgress ? {
    current: globalProgress.answered + 1,
    total: globalProgress.totalQuestions,
    round: globalProgress.round,
    maxRounds: globalProgress.maxRounds,
  } : undefined

  await sendMessage(conversationId, io, {
    content: text,
    stage: 'clarify_question',
    quickReplies,
    richContent: buildingProgress ? {
      type: 'building_progress' as const,
      data: buildingProgress as unknown as Record<string, unknown>,
    } : undefined,
  })
}

async function continueToNextQuestion(
  conversationId: string,
  state: FlowState,
  session: { clarifyItems: ClarifyItem[]; stagingItems: ClarifyItem[]; resolvedItems: ClarifyItem[] },
  redis: Redis,
  io: SocketIOServer
) {
  // 重新取得 session 以獲得最新的 clarifyItems
  const updatedSession = await getBddSession({ sessionId: state.sessionId! })
  if (!updatedSession.success || !updatedSession.data) {
    return
  }

  const pendingItems = updatedSession.data.clarifyItems.filter(i => i.status === 'pending')

  if (pendingItems.length === 0) {
    // 本輪問完，確認並進入下一階段
    await confirmBatch({ sessionId: state.sessionId! })

    // 根據當前階段決定下一步
    if (state.phase === 'spec_clarify') {
      await completeSpecClarifyPhase(conversationId, state, redis, io)
    } else {
      await completeClärifyPhase(conversationId, state, redis, io)
    }
    return
  }

  // 發送下一個問題
  const total = updatedSession.data.clarifyItems.length + updatedSession.data.stagingItems.length + updatedSession.data.resolvedItems.length
  const current = updatedSession.data.resolvedItems.length + updatedSession.data.stagingItems.length + 1
  const resolvedCount = updatedSession.data.resolvedItems.length + updatedSession.data.stagingItems.length

  const nextItem = pendingItems[0]
  await sendClarifyQuestion(conversationId, io, nextItem, current - 1, total, {
    answered: resolvedCount,
    totalQuestions: total,
    round: state.currentRound || 1,
    maxRounds: getDiscoveryLimits(state).MAX_ROUNDS,
  })

  state.currentItemId = nextItem.id
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)
}

async function sendBatchConfirmation(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const session = await getBddSession({ sessionId: state.sessionId! })
  if (!session.success || !session.data) {
    return
  }

  const stagingItems = session.data.stagingItems
  if (stagingItems.length === 0) {
    return
  }

  let confirmText = `📋 **釐清確認檢查點**\n\n以下 ${stagingItems.length} 題已回答完成，請確認是否正確：\n\n`

  stagingItems.forEach((item, i) => {
    const question = item.whiteTextQuestion || item.question
    const answer = getFullAnswer(item)
    confirmText += `**${i + 1}. ${question}**\n\n→ ${answer}\n\n`
  })

  confirmText += `---\n\n請選擇：\n\n`
  confirmText += `- **確認全部 (Y)** - 確認以上答案並繼續\n\n`
  confirmText += `- **修改第 N 題** - 例如輸入「修改 3」重新回答`

  await sendMessage(conversationId, io, {
    content: confirmText,
    stage: 'batch_confirm',
    quickReplies: [
      { label: '確認全部 (Y)', value: 'Y', style: 'primary' },
    ],
  })

  state.waitingForReply = true
  state.batchCount = 0
  await saveFlowState(redis, conversationId, state)
}

async function completeClärifyPhase(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  // 取得 session 和已回答的問題
  const session = await getBddSession({ sessionId: state.sessionId! })
  if (!session.success || !session.data) {
    logger.error('無法取得 BDD Session')
    return
  }

  const resolvedItems = session.data.resolvedItems || []
  const pendingClarifyItems = session.data.clarifyItems || []
  const allExistingItems = [...resolvedItems, ...pendingClarifyItems]
  const totalAnswered = resolvedItems.length

  // 檢查是否達到終止條件
  const limits = getDiscoveryLimits(state)
  const shouldStop =
    state.currentRound >= limits.MAX_ROUNDS ||
    totalAnswered >= limits.MAX_TOTAL_QUESTIONS

  if (shouldStop) {
    logger.info(`達到終止條件 (輪數: ${state.currentRound}/${limits.MAX_ROUNDS}, 問題數: ${totalAnswered}/${limits.MAX_TOTAL_QUESTIONS})，進入 Formulation`)
    await finishClarifyAndStartFormulation(conversationId, state, redis, io)
    return
  }

  // 嘗試生成更多問題（多輪 PRD Discovery）
  logger.info(`開始第 ${state.currentRound + 1} 輪 PRD Discovery`)

  await sendMessage(conversationId, io, {
    content: `好的，讓我根據您的回答再確認一些細節...`,
    stage: 'prd_discovery_continue',
    progress: { current: state.currentRound + 1, total: limits.MAX_ROUNDS, step: `第 ${state.currentRound + 1} 輪釐清` },
  })

  // 取得原始需求
  const originalRequirements = session.data.originalRequirements || ''

  // ① 分析回答
  await sendMessage(conversationId, io, {
    content: '正在分析你的回答，整理已決策的方向...',
    stage: 'prd_discovery_analyzing',
  })

  // L2：生成 Decision Summary（>= 5 題才值得摘要）
  const decisionSummary = resolvedItems.length >= 5
    ? await generateDecisionSummary(resolvedItems, { conversationId })
    : null

  // ② 生成 Partial Spec Context（>= 5 題才值得摘要）
  if (resolvedItems.length >= 5 && !state.partialSpecContext) {
    const partialContext = await generatePartialSpecContext(
      originalRequirements,
      resolvedItems,
      { conversationId }
    )
    if (partialContext) {
      state.partialSpecContext = partialContext
      await saveFlowState(redis, conversationId, state)
    }
  }

  // ③ 準備問題
  await sendMessage(conversationId, io, {
    content: '根據已知資訊，準備下一批需要確認的細節...',
    stage: 'prd_discovery_generating',
  })

  // 調用 LLM 生成更多問題，傳入已回答+待答的問題避免重複
  const esDocumentContent = session.data.esDocumentContent || undefined
  const discoveryResult = await runPrdDiscovery(
    originalRequirements,
    { conversationId },
    allExistingItems,
    decisionSummary,
    esDocumentContent,
    state.partialSpecContext
  )

  // ── 連續空輪終止邏輯（規格要求連續兩輪無新問題才終止）──
  let newItems = discoveryResult.items || []

  // 去重檢查（有結果時）
  if (newItems.length > 0) {
    await sendMessage(conversationId, io, {
      content: '檢查問題是否重複...',
      stage: 'prd_discovery_deduping',
    })
    if (allExistingItems.length > 0) {
      newItems = await deduplicateQuestions(newItems, allExistingItems, { conversationId })
    }
  }

  if (!discoveryResult.success || newItems.length === 0) {
    // 本輪無新問題（或去重後為空）
    state.consecutiveEmptyRounds = (state.consecutiveEmptyRounds || 0) + 1

    if (state.consecutiveEmptyRounds >= 2) {
      // 連續兩輪空 → 正式終止
      logger.info(`連續 ${state.consecutiveEmptyRounds} 輪無新問題，進入 Formulation`)
      await sendMessage(conversationId, io, {
        content: `需求已經足夠清楚了！`,
        stage: 'prd_discovery_complete',
      })
      await finishClarifyAndStartFormulation(conversationId, state, redis, io)
      return
    }

    // 第一輪空 → 再跑一輪確認
    logger.info(`第 ${state.currentRound + 1} 輪無新問題（第 ${state.consecutiveEmptyRounds} 次），再確認一輪`)
    state.currentRound++
    await saveFlowState(redis, conversationId, state)
    await sendMessage(conversationId, io, {
      content: '本輪沒有發現新問題，再進行一輪確認...',
      stage: 'prd_discovery_continue',
    })
    // 遞歸再跑一輪 Discovery
    await completeClärifyPhase(conversationId, state, redis, io)
    return
  }

  // 有新問題 → 重置空輪計數器
  state.consecutiveEmptyRounds = 0

  logger.info(`第 ${state.currentRound + 1} 輪生成 ${newItems.length} 個新問題（去重後）`)

  // 添加新問題到 session
  await addClarifyItems({ sessionId: state.sessionId!, items: newItems })

  // 更新狀態
  state.currentRound++
  state.totalQuestionsAsked += newItems.length
  state.batchCount = 0

  // 發送第一個新問題
  const totalQuestions = totalAnswered + newItems.length
  await sendClarifyQuestion(conversationId, io, newItems[0], totalAnswered, totalQuestions, {
    answered: totalAnswered,
    totalQuestions,
    round: state.currentRound,
    maxRounds: getDiscoveryLimits(state).MAX_ROUNDS,
  })

  state.currentItemId = newItems[0].id
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)
}

// ============================================================
// Formulation 恢復函數
// ============================================================

async function resumeFormulation(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  try {
    // 從 FlowState 讀取 checkpoint
    const resumeFrom = {
      schemaSql: state.formulationSchemaSql!,
      entityMapping: state.formulationEntityMapping || '',
      identifiedFeatures: state.formulationIdentifiedFeatures!,
      completedNames: state.formulationCompletedNames || [],
    }

    // 重設開始時間
    state.formulationStartedAt = Date.now()
    await saveFlowState(redis, conversationId, state)

    // 取得 BDD Session
    const session = await getBddSession({ sessionId: state.sessionId! })
    if (!session.success || !session.data) {
      throw new Error('無法取得 BDD Session')
    }

    const allResolvedItems = [
      ...(session.data.stagingItems || []),
      ...(session.data.resolvedItems || []),
    ].filter(item => item.answer)

    // 構建 checkpoint callback
    const checkpointCallback = async (checkpoint: FormulationCheckpoint) => {
      state.formulationSchemaSql = checkpoint.schemaSql
      state.formulationEntityMapping = checkpoint.entityMapping
      state.formulationIdentifiedFeatures = checkpoint.identifiedFeatures
      state.formulationCompletedNames = checkpoint.completedNames
      state.formulationTotalExpected = checkpoint.totalExpected
      await saveFlowState(redis, conversationId, state)
    }

    const progressCallback = async (step: string, current: number, total: number, detail?: string) => {
      io.to(`conversation:${conversationId}`).emit('progress', {
        stage: 'formulation',
        step,
        current,
        total,
        detail,
      })
    }

    const result = await runFormulation(
      session.data.originalRequirements,
      allResolvedItems,
      session.data.projectContext || undefined,
      progressCallback,
      { conversationId },
      { onCheckpoint: checkpointCallback, resumeFrom }
    )

    if (!result.success) {
      throw new Error(result.error || '恢復 Formulation 失敗')
    }

    // 合併已存在的 features（checkpoint 中已完成的）+ 新生成的
    const existingFeatures = (session.data.featuresContent || []) as GeneratedFeature[]
    const existingNames = new Set(existingFeatures.map(f => f.actionName))
    const newFeatures = (result.features || []).filter(f => !existingNames.has(f.actionName))
    const allFeatures = [...existingFeatures, ...newFeatures]

    // 保存到 BDD Session
    await updateBddSession({
      sessionId: state.sessionId!,
      updates: {
        currentPhase: 'spec_discovery',
        schemaSqlContent: result.schemaSql || resumeFrom.schemaSql,
        entityMappingContent: result.entityMapping || resumeFrom.entityMapping,
        featuresContent: allFeatures,
      },
    })

    // 清理 formulation 暫存欄位
    state.formulationStartedAt = undefined
    state.formulationSchemaSql = undefined
    state.formulationEntityMapping = undefined
    state.formulationIdentifiedFeatures = undefined
    state.formulationCompletedNames = undefined
    state.formulationTotalExpected = undefined

    const featureCount = allFeatures.length
    await sendMessage(conversationId, io, {
      content: `規格恢復完成！\n\n已生成：\n- 資料庫 Schema\n- ${featureCount} 個功能規格 (Feature Files)\n\n正在進行品質檢查...`,
      stage: 'formulation_complete',
      progress: { current: 3, total: 4, step: '品質檢查' },
    })

    await startSpecDiscovery(
      conversationId, state, allFeatures,
      result.schemaSql || resumeFrom.schemaSql,
      result.entityMapping || resumeFrom.entityMapping,
      redis, io
    )
  } catch (error) {
    logger.error({ err: error }, 'resumeFormulation 失敗')
    // 回退到 spec_clarify，讓用戶可以重試
    state.phase = 'spec_clarify'
    state.waitingForReply = true
    state.formulationStartedAt = undefined
    state.formulationSchemaSql = undefined
    state.formulationEntityMapping = undefined
    state.formulationIdentifiedFeatures = undefined
    state.formulationCompletedNames = undefined
    state.formulationTotalExpected = undefined
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: `規格恢復失敗：${error instanceof Error ? error.message : '未知錯誤'}\n\n請輸入「重試」重新產出規格。`,
      stage: 'error',
    })
  }
}

async function restartFormulation(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  // 清理所有 formulation 暫存欄位
  state.formulationStartedAt = undefined
  state.formulationSchemaSql = undefined
  state.formulationEntityMapping = undefined
  state.formulationIdentifiedFeatures = undefined
  state.formulationCompletedNames = undefined
  state.formulationTotalExpected = undefined
  await saveFlowState(redis, conversationId, state)

  // 複用 finishClarifyAndStartFormulation 的邏輯
  await finishClarifyAndStartFormulation(conversationId, state, redis, io)
}

async function finishClarifyAndStartFormulation(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  await sendMessage(conversationId, io, {
    content: '釐清完成！正在產出規格文件...',
    stage: 'formulation_start',
  })

  state.phase = 'formulation'
  state.waitingForReply = false
  state.formulationStartedAt = Date.now()
  await saveFlowState(redis, conversationId, state)

  // 取得 BDD Session 資料
  if (!state.sessionId) {
    logger.error('缺少 sessionId，無法執行 Formulation')
    await sendMessage(conversationId, io, {
      content: '發生錯誤：缺少 Session 資料',
      stage: 'error',
    })
    return
  }

  const session = await getBddSession({ sessionId: state.sessionId })
  if (!session.success || !session.data) {
    logger.error('無法取得 BDD Session')
    await sendMessage(conversationId, io, {
      content: '發生錯誤：無法取得對話資料',
      stage: 'error',
    })
    return
  }

  // 合併所有已回答的項目
  const allResolvedItems = [
    ...(session.data.stagingItems || []),
    ...(session.data.resolvedItems || []),
  ].filter(item => item.answer)

  logger.info(`開始 Formulation，共 ${allResolvedItems.length} 個釐清項目`)

  // 如果有 ES 文檔，嘗試 Draft Batch Mode
  const esDocumentContent = session.data.esDocumentContent
  if (esDocumentContent) {
    logger.info('偵測到 ES 文檔，嘗試 Draft Batch 生成...')
    await sendMessage(conversationId, io, {
      content: '根據 Event Storming 分析結果，正在一次性生成規格草稿...',
      stage: 'formulation_start',
    })

    const draftResult = await generateDraftBatch(
      esDocumentContent,
      session.data.originalRequirements,
      allResolvedItems,
      session.data.projectContext || undefined,
      { conversationId }
    )

    if (draftResult.success && draftResult.features && draftResult.features.length > 0) {
      // 保存草稿到 session
      await updateBddSession({
        sessionId: state.sessionId!,
        updates: {
          currentPhase: 'formulation_draft_review',
          schemaSqlContent: draftResult.schemaSql,
          entityMappingContent: draftResult.entityMapping,
          featuresContent: draftResult.features,
        },
      })

      // 保存不確定項目
      if (draftResult.uncertainItems && draftResult.uncertainItems.length > 0) {
        state.formulationDraftUncertainItems = draftResult.uncertainItems
      }

      // 構建展示消息
      const featureNames = draftResult.features.map(f => `- ${f.name} (${f.actionName})`).join('\n')
      let draftMsg = `規格草稿已生成！\n\n**資料模型**：已建立 SQL Schema\n**功能規格**：${draftResult.features.length} 個 Feature Files\n${featureNames}`

      if (draftResult.uncertainItems && draftResult.uncertainItems.length > 0) {
        draftMsg += `\n\n**待澄清項目**：\n${draftResult.uncertainItems.map(item => `- ${item}`).join('\n')}`
      }

      draftMsg += '\n\n請確認草稿是否符合預期，或提出修改意見。'

      await sendMessage(conversationId, io, {
        content: draftMsg,
        stage: 'formulation_complete',
        quickReplies: [
          { label: '確認草稿，繼續', value: '確認', style: 'primary' as const },
          { label: '需要調整', value: '調整', style: 'ghost' as const },
        ],
      })

      state.phase = 'formulation_draft_review'
      state.waitingForReply = true
      await saveFlowState(redis, conversationId, state)
      return
    } else {
      logger.warn({ err: draftResult.error }, 'Draft Batch 失敗，fallback 到逐個生成')
      // fallback 到原有流程
    }
  }

  // 執行 Formulation（失敗自動重試 1 次）
  const formulationProgressCallback = async (step: string, current: number, total: number, detail?: string) => {
    io.to(`conversation:${conversationId}`).emit('progress', {
      stage: 'formulation',
      step,
      current,
      total,
      detail,
    })
  }

  // Checkpoint callback：每 3 個 feature 保存進度到 FlowState
  const checkpointCallback = async (checkpoint: FormulationCheckpoint) => {
    state.formulationSchemaSql = checkpoint.schemaSql
    state.formulationEntityMapping = checkpoint.entityMapping
    state.formulationIdentifiedFeatures = checkpoint.identifiedFeatures
    state.formulationCompletedNames = checkpoint.completedNames
    state.formulationTotalExpected = checkpoint.totalExpected
    await saveFlowState(redis, conversationId, state)
  }

  let result = await runFormulation(
    session.data.originalRequirements,
    allResolvedItems,
    session.data.projectContext || undefined,
    formulationProgressCallback,
    { conversationId },
    { onCheckpoint: checkpointCallback }
  )

  // LLM 偶發性回應格式錯誤時自動重試 1 次
  if (!result.success && result.error?.includes('無法解析 LLM 回應')) {
    logger.warn('Formulation 解析失敗，自動重試...')
    result = await runFormulation(
      session.data.originalRequirements,
      allResolvedItems,
      session.data.projectContext || undefined,
      formulationProgressCallback,
      { conversationId },
      { onCheckpoint: checkpointCallback }
    )
  }

  if (!result.success) {
    logger.error({ err: result.error }, 'Formulation 失敗')

    // 回退 phase 到 spec_clarify，讓用戶可以重試
    state.phase = 'spec_clarify'
    state.waitingForReply = true
    state.formulationStartedAt = undefined
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: `規格產出失敗：${result.error}\n\n請輸入「重試」重新產出規格，或繼續描述需求。`,
      stage: 'error',
    })

    // 更新任務狀態為失敗
    if (state.taskId) {
      await db.updateTask(state.taskId, { status: 'failed' })
    }
    return
  }

  // 清理 formulation 暫存欄位
  state.formulationStartedAt = undefined
  state.formulationSchemaSql = undefined
  state.formulationEntityMapping = undefined
  state.formulationIdentifiedFeatures = undefined
  state.formulationCompletedNames = undefined
  state.formulationTotalExpected = undefined

  // 保存生成的內容到 BDD Session（注意：這裡不設為 completed，因為還要進入 Spec Discovery）
  await updateBddSession({
    sessionId: state.sessionId,
    updates: {
      currentPhase: 'spec_discovery',
      schemaSqlContent: result.schemaSql,
      entityMappingContent: result.entityMapping,
      featuresContent: result.features,
    },
  })

  // 發送消息，提示進入 Spec Discovery
  const featureCount = result.features?.length || 0
  await sendMessage(conversationId, io, {
    content: `規格初稿完成！\n\n已生成：\n- 資料庫 Schema\n- ${featureCount} 個功能規格 (Feature Files)\n\n正在進行品質檢查...`,
    stage: 'formulation_complete',
    progress: { current: 3, total: 4, step: '品質檢查' },
  })

  logger.info('Formulation 完成，進入 Spec Discovery')

  // Credit 扣除：BDD Formulation 額外成本
  if (state.userId) {
    await deductCredits(state.userId, CREDIT_COSTS.BDD_FORMULATION - CREDIT_COSTS.BASE_MESSAGE)
  }

  // 進入 Spec Discovery 階段
  await startSpecDiscovery(conversationId, state, result.features || [], result.schemaSql || '', result.entityMapping || '', redis, io)
}

function validateAnswer(
  item: ClarifyItem,
  answer: string
): { valid: boolean; normalizedAnswer?: string; errorMessage?: string } {
  if (!item.options || item.options.length === 0) {
    return { valid: true, normalizedAnswer: answer }
  }

  const trimmedAnswer = answer.trim()
  const upperAnswer = trimmedAnswer.toUpperCase()
  const validLetters = item.options.map((_, i) => String.fromCharCode(65 + i))

  // 單個字母
  if (/^[A-Za-z]$/.test(trimmedAnswer)) {
    if (validLetters.includes(upperAnswer)) {
      return { valid: true, normalizedAnswer: upperAnswer }
    }
    return {
      valid: false,
      errorMessage: `請輸入有效的選項（${validLetters.join('、')}）`,
    }
  }

  // 帶分隔符的格式（如 "A. xxx"、"B: xxx"、"C xxx"）— 必須有明確分隔
  const letterWithSep = trimmedAnswer.match(/^([A-Za-z])(?:[.:]\s*|\s+)(.+)/)
  if (letterWithSep) {
    const letter = letterWithSep[1].toUpperCase()
    const customText = letterWithSep[2]?.trim()
    if (validLetters.includes(letter)) {
      return { valid: true, normalizedAnswer: customText ? `${letter}: ${customText}` : letter }
    }
  }

  // 接受任何輸入作為自定義答案（語義檢查由後續 semanticGateway 處理）
  return { valid: true, normalizedAnswer: trimmedAnswer }
}


function getFullAnswer(item: ClarifyItem): string {
  const answer = item.answer || ''

  const customMatch = answer.match(/^([A-Da-d]):\s*(.+)$/)
  if (customMatch) {
    return `**${customMatch[1].toUpperCase()}.** ${customMatch[2]}`
  }

  if (/^[A-Da-d]$/.test(answer)) {
    const optionIndex = answer.toUpperCase().charCodeAt(0) - 65
    // 優先使用白話選項展示
    const displayOptions = item.whiteTextOptions && item.whiteTextOptions.length > 0
      ? item.whiteTextOptions
      : (item.options || []).map(opt => typeof opt === 'string' ? opt : (opt.description || opt.label || ''))

    if (displayOptions.length > optionIndex) {
      const opt = displayOptions[optionIndex]
      const match = opt.match(/^[A-Z]\.\s*(.*)$/)
      return `**${answer.toUpperCase()}.** ${match ? match[1] : opt}`
    }
  }

  return answer
}

// ============================================================
// Spec Discovery 相關函數
// ============================================================

/**
 * 啟動 Spec Discovery 階段
 * 調用 LLM 審查 Feature Files 品質，發現問題則進入 Spec Clarify
 */
async function startSpecDiscovery(
  conversationId: string,
  state: FlowState,
  features: GeneratedFeature[],
  schemaSql: string,
  entityMapping: string,
  redis: Redis,
  io: SocketIOServer
) {
  state.phase = 'spec_discovery'
  state.specRound = (state.specRound || 0) + 1
  state.waitingForReply = false
  await saveFlowState(redis, conversationId, state)

  // 取得 session
  const session = await getBddSession({ sessionId: state.sessionId! })
  if (!session.success || !session.data) {
    logger.error('無法取得 BDD Session')
    await sendMessage(conversationId, io, {
      content: '發生錯誤：無法取得對話資料',
      stage: 'error',
    })
    return
  }

  // 取得已有的 Spec 問題（避免重複）
  const existingSpecItems = (session.data.resolvedItems || []).filter(item =>
    item.checklistItem?.startsWith('S')
  )

  logger.info(`開始第 ${state.specRound} 輪 Spec Discovery`)

  // 調用 Spec Discovery LLM
  const discoveryResult = await runSpecDiscovery(
    features,
    schemaSql,
    entityMapping,
    existingSpecItems,
    { conversationId }  // 追蹤上下文
  )

  if (!discoveryResult.success) {
    logger.error({ err: discoveryResult.error }, 'Spec Discovery 失敗')
    // Spec Discovery 失敗時，直接完成（不阻塞用戶）
    await sendMessage(conversationId, io, {
      content: `品質檢查遇到問題：${discoveryResult.error}。已略過，規格已完成。`,
      stage: 'spec_discovery_error',
    })
    await completeSpecPhase(conversationId, state, redis, io)
    return
  }

  let issues = discoveryResult.issues || []
  logger.info(`Spec Discovery 發現 ${issues.length} 個問題`)

  // 沒有問題 → 直接完成
  if (issues.length === 0) {
    logger.info('Spec Discovery 沒有發現問題，規格品質良好')
    await sendMessage(conversationId, io, {
      content: '規格品質檢查通過！',
      stage: 'spec_discovery_complete',
    })
    await completeSpecPhase(conversationId, state, redis, io)
    return
  }

  // 有問題：計算剩餘配額，截斷到可呈現的數量
  const previousQuestions = state.specTotalQuestions || 0
  const remainingQuota = Math.max(SPEC_DISCOVERY_LIMITS.MAX_TOTAL_QUESTIONS - previousQuestions, SPEC_DISCOVERY_LIMITS.QUESTIONS_PER_ROUND)

  if (issues.length > remainingQuota) {
    logger.info(`問題數 ${issues.length} 超過剩餘配額 ${remainingQuota}，截斷至 ${remainingQuota} 個（按嚴重度排序）`)
    // 按 severity 排序：high > medium > low
    const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
    issues = [...issues]
      .sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9))
      .slice(0, remainingQuota)
  }

  const specTotalQuestions = previousQuestions + issues.length

  // 有問題需要確認，保存問題並進入 Spec Clarify
  state.specIssues = issues
  state.specTotalQuestions = specTotalQuestions

  // 將問題轉換為 ClarifyItem 並添加到 session
  const clarifyItems = specIssuesToClarifyItems(issues)
  await addClarifyItems({ sessionId: state.sessionId!, items: clarifyItems })

  // 更新階段
  await updateBddSession({
    sessionId: state.sessionId!,
    updates: { currentPhase: 'spec_clarify' },
  })

  // 發送消息
  await sendMessage(conversationId, io, {
    content: `品質檢查發現 ${issues.length} 個需要確認的問題，讓我們一起確認：`,
    stage: 'spec_discovery_complete',
  })

  // 發送第一個問題
  await sendClarifyQuestion(conversationId, io, clarifyItems[0], 0, clarifyItems.length)

  // 更新狀態
  state.phase = 'spec_clarify'
  state.questionIndex = 0
  state.batchCount = 0
  state.currentItemId = clarifyItems[0].id
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)
}

/**
 * 完成 Spec Clarify 階段
 * 根據用戶回答修復 Features，然後決定是否需要更多輪 Spec Discovery
 */
async function completeSpecClarifyPhase(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  // 取得 session
  const session = await getBddSession({ sessionId: state.sessionId! })
  if (!session.success || !session.data) {
    logger.error('無法取得 BDD Session')
    return
  }

  // 取得用戶的回答（這一輪的 spec 問題）
  const specAnswers = (session.data.resolvedItems || []).filter(item =>
    item.id?.startsWith('spec_') && item.status === 'answered'
  )

  if (specAnswers.length === 0) {
    // 沒有回答（可能用戶全部跳過），直接完成
    logger.info('Spec Clarify 沒有回答，直接完成')
    await completeSpecPhase(conversationId, state, redis, io)
    return
  }

  // 根據回答修復 Features
  await sendMessage(conversationId, io, {
    content: '正在根據您的回答修正規格...',
    stage: 'spec_fix_start',
  })

  await fixFeaturesAndComplete(conversationId, state, specAnswers, redis, io)
}

/**
 * 根據用戶回答修復 Features
 */
async function fixFeaturesAndComplete(
  conversationId: string,
  state: FlowState,
  specAnswers: ClarifyItem[],
  redis: Redis,
  io: SocketIOServer
) {
  // 取得 session
  const session = await getBddSession({ sessionId: state.sessionId! })
  if (!session.success || !session.data) {
    logger.error('無法取得 BDD Session')
    return
  }

  // 將 FeatureFile 轉換為 GeneratedFeature（過濾掉沒有 actionName 的）
  const features: GeneratedFeature[] = (session.data.featuresContent || [])
    .filter((f): f is GeneratedFeature => !!f.actionName)
    .map(f => ({ name: f.name, actionName: f.actionName!, content: f.content }))

  const schemaSql = session.data.schemaSqlContent || ''
  const entityMapping = session.data.entityMappingContent || ''

  // 將問題和回答整理成修復指令
  // 根據 specIssues 找出需要修復的 Features
  const specIssues = state.specIssues || []

  // 按 Feature 分組
  const featureIssuesMap = new Map<string, { issues: string[]; feature: GeneratedFeature }>()

  for (const issue of specIssues) {
    const answer = specAnswers.find(a => a.id === issue.id)
    if (!answer || !answer.answer) continue

    const feature = features.find(f => f.actionName === issue.actionName)
    if (!feature) continue

    if (!featureIssuesMap.has(issue.actionName)) {
      featureIssuesMap.set(issue.actionName, { issues: [], feature })
    }

    // 將問題和回答整合為修復指令
    const fixInstruction = `${issue.description}\n用戶回答: ${answer.answer}${issue.suggestedFix ? `\n建議修復: ${issue.suggestedFix}` : ''}`
    featureIssuesMap.get(issue.actionName)!.issues.push(fixInstruction)
  }

  // 如果沒有需要修復的 Feature，直接進入下一輪或完成
  if (featureIssuesMap.size === 0) {
    logger.info('沒有需要修復的 Feature')
    // 檢查是否需要更多輪 Spec Discovery
    if (state.specRound! < SPEC_DISCOVERY_LIMITS.MAX_ROUNDS) {
      await startSpecDiscovery(conversationId, state, features, schemaSql, entityMapping, redis, io)
    } else {
      await completeSpecPhase(conversationId, state, redis, io)
    }
    return
  }

  // 準備修復輸入
  const featuresToFix: FeatureFixInput[] = Array.from(featureIssuesMap.entries()).map(([actionName, data]) => ({
    name: data.feature.name,
    actionName,
    content: data.feature.content,
    issues: data.issues,
  }))

  // 取得所有 resolved items（包括 PRD 階段的）作為釐清決策
  const allResolvedItems = session.data.resolvedItems || []

  logger.info(`修復 ${featuresToFix.length} 個 Features`)

  // 調用修復函數
  const fixResult = await fixMultipleFeatures(
    featuresToFix,
    allResolvedItems,
    schemaSql,
    entityMapping,
    { conversationId }  // 追蹤上下文
  )

  if (!fixResult.success || !fixResult.fixedFeatures) {
    logger.error({ err: fixResult.error }, 'Feature 修復失敗')
    await sendMessage(conversationId, io, {
      content: `規格修正遇到問題：${fixResult.error}。已保留原始規格。`,
      stage: 'spec_fix_error',
    })
    await completeSpecPhase(conversationId, state, redis, io)
    return
  }

  // 更新 Features
  const updatedFeatures = features.map(f => {
    const fixed = fixResult.fixedFeatures!.find(ff => ff.actionName === f.actionName)
    return fixed || f
  })

  await updateBddSession({
    sessionId: state.sessionId!,
    updates: {
      featuresContent: updatedFeatures,
    },
  })

  await sendMessage(conversationId, io, {
    content: `已修正 ${fixResult.fixedFeatures.length} 個功能規格。`,
    stage: 'spec_fix_complete',
  })

  // 檢查是否需要更多輪 Spec Discovery
  if (state.specRound! < SPEC_DISCOVERY_LIMITS.MAX_ROUNDS) {
    await sendMessage(conversationId, io, {
      content: '正在進行第二輪品質檢查...',
      stage: 'spec_discovery_continue',
    })
    // 清除這一輪的 issues
    state.specIssues = undefined
    await startSpecDiscovery(conversationId, state, updatedFeatures, schemaSql, entityMapping, redis, io)
  } else {
    await completeSpecPhase(conversationId, state, redis, io)
  }
}

/**
 * 完成 Spec 階段，進入 UIUX 設計偏好詢問
 */
// ============================================================
// Change Management
// ============================================================

export async function handleSpecChange(
  conversationId: string,
  state: FlowState,
  changeDescription: string,
  redis: Redis,
  io: SocketIOServer
) {
  state.phase = 'spec_change_analyzing'
  await saveFlowState(redis, conversationId, state)

  await sendMessage(conversationId, io, {
    content: '正在分析變更影響...',
    stage: 'spec_validating',
  })

  // 取得現有規格
  const session = await getBddSession({ sessionId: state.sessionId! })
  if (!session.success || !session.data) {
    state.phase = 'spec_completed'
    await saveFlowState(redis, conversationId, state)
    await sendMessage(conversationId, io, {
      content: '無法取得規格資料，請重試。',
      stage: 'error',
    })
    return
  }

  const existingSpecs = {
    esDocument: session.data.esDocumentContent,
    features: (session.data.featuresContent || []) as GeneratedFeature[],
    schemaSql: session.data.schemaSqlContent || '',
    entityMapping: session.data.entityMappingContent || '',
    actionsYml: session.data.actionsYmlContent,
  }

  const impactResult = await analyzeChangeImpact(
    changeDescription,
    existingSpecs,
    { conversationId }
  )

  if (!impactResult.success || !impactResult.impact) {
    state.phase = 'spec_completed'
    await saveFlowState(redis, conversationId, state)
    await sendMessage(conversationId, io, {
      content: `無法分析變更影響：${impactResult.error}\n\n建議重新開始 BDD 流程，或嘗試更具體地描述變更。`,
      stage: 'error',
    })
    return
  }

  // 展示影響分析，等待確認
  state.phase = 'spec_change_confirm'
  state.changeImpact = impactResult.impact
  await saveFlowState(redis, conversationId, state)

  const affectedSummary: string[] = []
  if (impactResult.impact.affectedLayers.features?.length) {
    affectedSummary.push(`Feature Files: ${impactResult.impact.affectedLayers.features.join(', ')}`)
  }
  if (impactResult.impact.affectedLayers.schema?.length) {
    affectedSummary.push(`Schema Tables: ${impactResult.impact.affectedLayers.schema.join(', ')}`)
  }
  if (impactResult.impact.affectedLayers.actions?.length) {
    affectedSummary.push(`Actions: ${impactResult.impact.affectedLayers.actions.join(', ')}`)
  }

  await sendMessage(conversationId, io, {
    content: `**變更影響分析**\n\n${impactResult.impact.displayText}\n\n**受影響範圍**：\n${affectedSummary.map(s => `- ${s}`).join('\n')}\n\n確認要執行這個變更嗎？`,
    stage: 'spec_complete',
    quickReplies: [
      { label: '確認執行', value: '確認', style: 'primary' as const },
      { label: '取消', value: '取消', style: 'ghost' as const },
    ],
  })
}

export async function completeSpecPhase(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  // 取得 session 資料（Phase 4/5 需要）
  const session = await getBddSession({ sessionId: state.sessionId! })
  const rawFeatures = session.data?.featuresContent || []
  // FeatureFile.actionName 是可選的，補上空字串
  const features: Array<{ name: string; actionName: string; content: string }> = rawFeatures.map(
    (f: { name: string; actionName?: string; content: string }) => ({
      name: f.name,
      actionName: f.actionName || '',
      content: f.content,
    })
  )
  const schemaSql: string = session.data?.schemaSqlContent || ''
  const entityMapping: string = session.data?.entityMappingContent || ''
  const featureCount = features.length

  // 構建 LLM tracking context
  const trackingContext = state.userId
    ? { userId: state.userId, conversationId }
    : undefined

  // ============================================================
  // Phase 4/5 自動執行（驗證 + Actions Design + ISA Config）
  // 全部包在 try/catch 中，任何異常都降級跳過，絕不阻塞 UIUX 流程
  // ============================================================
  let generatedActionsYml: string | null = null
  let generatedOpenApiSpec: string | null = null
  let generatedIsaConfig: string | null = null

  try {
    // Step 1/3: Feature 驗證 + 自動修復
    if (features.length > 0 && schemaSql) {
      await sendMessage(conversationId, io, {
        content: '正在驗證功能規格格式...',
        stage: 'spec_validating',
        progress: { current: 1, total: 3, step: '規格驗證' },
      })

      const resolvedItems = session.data?.resolvedItems || []
      const validationResult = await validateAndFixFeatures(
        features, schemaSql, entityMapping, resolvedItems, trackingContext
      )

      // 將 FeatureValidationResult 轉為 BddSession.validationResult 格式
      const dbValidationResult = {
        passed: validationResult.validationResult.lintPassed && validationResult.validationResult.validatePassed,
        errors: validationResult.validationResult.errors,
        warnings: [] as string[],
      }

      // 如有修復 → 更新 DB
      if (validationResult.fixRounds > 0) {
        await updateBddSession({
          sessionId: state.sessionId!,
          updates: {
            featuresContent: validationResult.fixedFeatures,
            validationResult: dbValidationResult,
          },
        })
        // 更新本地引用
        features.splice(0, features.length, ...validationResult.fixedFeatures)
        logger.info(`Feature 驗證修復完成，${validationResult.fixRounds} 輪`)
      } else {
        // 無需修復，只記錄驗證結果
        await updateBddSession({
          sessionId: state.sessionId!,
          updates: { validationResult: dbValidationResult },
        })
      }
    }

    // Step 2/3: Phase 4 Actions Design
    if (features.length > 0 && schemaSql) {
      await sendMessage(conversationId, io, {
        content: '正在設計 Server Actions 規格...',
        stage: 'spec_actions_design',
        progress: { current: 2, total: 3, step: 'Actions Design' },
      })

      const actionsResult = await generateActionsYml(
        { features, schemaSql, entityMapping },
        trackingContext
      )

      if (actionsResult.success && actionsResult.actionsYml) {
        generatedActionsYml = actionsResult.actionsYml
        generatedOpenApiSpec = actionsResult.openApiSpec || null
        const sessionUpdates: Record<string, string> = { actionsYmlContent: actionsResult.actionsYml }
        if (actionsResult.openApiSpec) {
          sessionUpdates.openApiSpecContent = actionsResult.openApiSpec
        }
        await updateBddSession({
          sessionId: state.sessionId!,
          updates: sessionUpdates,
        })
        logger.info('Actions Design 完成' + (actionsResult.openApiSpec ? ' (含 OpenAPI 3.0)' : ''))
      } else {
        logger.warn({ err: actionsResult.error }, 'Actions Design 失敗，降級跳過')
      }
    }

    // Step 3/3: Phase 5 ISA Config
    if (features.length > 0) {
      await sendMessage(conversationId, io, {
        content: '正在生成 ISA 配置...',
        stage: 'spec_isa_config',
        progress: { current: 3, total: 3, step: 'ISA Config' },
      })

      const isaResult = generateIsaConfig({
        features,
        entityMapping,
        actionsYml: generatedActionsYml || '',
      })

      if (isaResult.success && isaResult.isaConfigYml) {
        generatedIsaConfig = isaResult.isaConfigYml
        await updateBddSession({
          sessionId: state.sessionId!,
          updates: { isaConfigContent: isaResult.isaConfigYml },
        })
        logger.info('ISA Config 完成')
      } else {
        logger.warn({ err: isaResult.error }, 'ISA Config 失敗，降級跳過')
      }
    }
  } catch (err) {
    logger.error({ err: err }, 'Phase 4/5 自動執行異常，降級跳過')
  }

  // ============================================================
  // Neon Database Provisioning（同步，< 10s）
  // 從 BDD schemaSql 推導 DDL，同步建立 Neon project
  // 任何失敗都降級跳過，絕不阻塞 UIUX 流程
  // ============================================================
  try {
    const env = (await import('../../lib/env')).getEnv()
    if (schemaSql && state.userId && env.NEON_API_KEY) {
      const userRow = await db.query<{ plan: string }>(
        'SELECT plan FROM users WHERE id = $1',
        [state.userId]
      )
      const userPlan = userRow.rows[0]?.plan || 'free'
      const quota = await checkDbQuota(state.userId, userPlan)

      if (quota.allowed) {
        const derivedSchema = deriveSchemaFromBdd(schemaSql, entityMapping)

        if (derivedSchema.entityCount > 0) {
          const isZh = state.locale !== 'en'
          await sendMessage(conversationId, io, {
            content: isZh
              ? `正在為你建立資料庫...\n\n偵測到 ${derivedSchema.entityCount} 個資料表：\n${derivedSchema.displaySummary}`
              : `Setting up your database...\n\nDetected ${derivedSchema.entityCount} tables:\n${derivedSchema.displaySummary}`,
            stage: 'db_provisioning',
            richContent: {
              type: 'db_schema_preview',
              data: { entities: derivedSchema.entities, entityCount: derivedSchema.entityCount },
            },
          })

          // 同步執行（< 10s）
          const result = await provisionNeonDatabase({
            projectId: state.projectId!,
            projectName: `tc-${state.projectId!.slice(0, 8)}`,
            schema: derivedSchema,
            conversationId,
            io,
            locale: state.locale,
          })

          state.dbProvisionStatus = result ? 'completed' : 'failed'
          state.dbDerivedSchema = {
            displaySummary: derivedSchema.displaySummary,
            entityCount: derivedSchema.entityCount,
          }
          await saveFlowState(redis, conversationId, state)
        }
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Neon provisioning 失敗，降級跳過')
  }

  // ============================================================
  // Step 5/5: Feature Dry-Run（entity_setup 對真實 DB 驗證）
  // 在 Neon DB 建好後、spec_completed 之前執行
  // ============================================================
  try {
    if (features.length > 0 && state.dbProvisionStatus === 'completed' && state.projectId) {
      const neonRow = await db.query<{ neon_connection_string: string }>(
        'SELECT neon_connection_string FROM projects WHERE id = $1 AND neon_connection_string IS NOT NULL',
        [state.projectId]
      )
      if (neonRow.rows[0]?.neon_connection_string) {
        await sendMessage(conversationId, io, {
          content: '驗證 BDD 規格與資料庫一致性...',
          stage: 'spec_dry_run',
          progress: { current: 3, total: 3, step: '規格驗證' },
        })

        const { runFeatureDryRun } = await import('../../services/feature-dry-run')
        let dryRunResult = await runFeatureDryRun({
          features: features.map(f => ({ name: f.name, actionName: f.actionName, content: f.content })),
          schemaSql,
          entityMapping,
          neonConnectionString: neonRow.rows[0].neon_connection_string,
        })

        // Dry-run 失敗 → LLM 修復 → 重跑（最多 2 輪）
        if (!dryRunResult.passed) {
          for (let round = 0; round < 2; round++) {
            logger.info({ round: round + 1, failedCount: dryRunResult.failedFeatures.length }, 'Dry-run 失敗，嘗試修復...')
            const fixInput = dryRunResult.failedFeatures.map(f => ({
              name: f.name,
              actionName: features.find(feat => feat.name === f.name)?.actionName || '',
              content: features.find(feat => feat.name === f.name)?.content || '',
              issues: f.errors,
            }))

            const dryRunResolvedItems = session.data?.resolvedItems || []
            const fixResult = await fixMultipleFeatures(fixInput, dryRunResolvedItems, schemaSql, entityMapping, trackingContext)
            if (!fixResult.success || !fixResult.fixedFeatures) break

            // 更新 features 陣列
            for (const fixed of fixResult.fixedFeatures) {
              const idx = features.findIndex(f => f.name === fixed.name)
              if (idx >= 0) {
                features[idx] = { ...features[idx], content: fixed.content }
              }
            }

            // 重跑 dry-run
            dryRunResult = await runFeatureDryRun({
              features: features.map(f => ({ name: f.name, actionName: f.actionName, content: f.content })),
              schemaSql,
              entityMapping,
              neonConnectionString: neonRow.rows[0].neon_connection_string,
            })
            if (dryRunResult.passed) {
              // 修復成功，更新 DB 中的 features
              await updateBddSession({
                sessionId: state.sessionId!,
                updates: { featuresContent: features },
              })
              logger.info({ round: round + 1 }, 'Dry-run 修復後通過')
              break
            }
          }

          if (!dryRunResult.passed) {
            logger.warn({ failedCount: dryRunResult.failedFeatures.length, summary: dryRunResult.summary }, 'Feature dry-run 修復後仍有失敗')
          }
        }
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Feature dry-run 失敗，降級跳過')
  }

  // 更新 session 為 spec_completed
  await updateBddSession({
    sessionId: state.sessionId!,
    updates: {
      currentPhase: 'spec_completed',
    },
  })

  // 發送規格完成消息（列出實際產出物）
  const outputs: string[] = []
  if (schemaSql) outputs.push('資料庫 Schema')
  if (featureCount > 0) outputs.push(`${featureCount} 個功能規格 (Feature Files)`)
  if (generatedActionsYml) outputs.push('Server Actions 規格 (actions.yml)')
  if (generatedOpenApiSpec) outputs.push('OpenAPI 3.0 規格 (openapi.yml)')
  if (generatedIsaConfig) outputs.push('ISA 配置 (isa.yml)')

  await sendMessage(conversationId, io, {
    content: `規格產出完成！\n\n已生成：\n${outputs.map(o => `- ${o}`).join('\n')}\n\n你可以在專案詳情頁面查看完整規格。`,
    stage: 'spec_complete',
    progress: { current: 4, total: 4, step: '規格完成' },
  })

  // 更新對話為 spec_complete
  await db.query(
    'UPDATE conversations SET spec_complete = true, updated_at = NOW() WHERE id = $1',
    [conversationId]
  )

  // 完成 BDD Spec 任務
  if (state.taskId) {
    await db.updateTask(state.taskId, {
      status: 'completed',
      completed_at: new Date(),
    })
  }

  // 智能模板匹配：分析需求，判斷有無適合模板
  const originalRequirements = session.data?.originalRequirements || ''
  let bddSpec = ''
  if (session.data?.featuresContent) {
    bddSpec = session.data.featuresContent.map((f: { content?: string }) => f.content || '').join('\n')
  }

  let matchedCount = 0
  try {
    const matchResults = await matchTemplates({ originalRequirements, bddSpec })
    if (matchResults.length > 0) {
      state.matchedTemplateIds = matchResults.map(r => r.templateId)
      matchedCount = matchResults.length
      logger.info(`模板匹配完成：${matchedCount} 個匹配`)
    }
  } catch (err) {
    logger.warn({ err: err }, '模板匹配失敗，降級為無匹配')
  }

  // 根據匹配結果條件路由
  if (matchedCount > 0) {
    // 有匹配模板：顯示 A/B 兩個選項
    await sendMessage(conversationId, io, {
      content: `接下來是 UI/UX 設計階段。\n\n你對產品的外觀有什麼想法嗎？\n\n**A.** 我有一些想法，想跟你討論\n\n**B.** 沒有特別的想法，給我看看模板（${matchedCount} 個推薦）`,
      stage: 'uiux_design_preference',
      quickReplies: [
        { label: '我有想法，想跟你討論', value: 'A', style: 'primary' },
        { label: `使用模板（${matchedCount}個推薦）`, value: 'B', style: 'secondary' },
      ],
    })
  } else {
    // 無匹配模板：只顯示討論式設計
    await sendMessage(conversationId, io, {
      content: `接下來是 UI/UX 設計階段。\n\n讓我們一起討論你想要的設計風格吧！`,
      stage: 'uiux_design_preference',
      quickReplies: [
        { label: '開始設計', value: 'A', style: 'primary' },
      ],
    })
  }

  // 更新狀態為等待設計偏好回覆
  state.phase = 'uiux_design_preference'
  state.lastStablePhase = 'uiux_design_preference'
  state.autoAdoptMode = false  // BDD 完成，設計階段回到手動
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  logger.info(`Spec 階段完成，等待用戶設計偏好（匹配模板：${matchedCount} 個）`)
}

// ============================================================
// UIUX 處理函數
// ============================================================

/**
 * 處理模板選擇
 * 當用戶選擇模板後，生成 5 個設計變體
 */
