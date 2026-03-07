// ============================================================
// UIUX Phase Handlers
// Design Discovery, Variants, Code Pipeline, Template
// 從 orchestrator.ts 提取
// ============================================================

import { Server as SocketIOServer } from 'socket.io'
import Redis from 'ioredis'
import * as db from '../../db/client'
import type { FlowState } from '../../types/flow-state'
import {
  generateDesignVariants, synthesizeVariants, extractVariantConcept,
  generateStructure, generateAnimations, generateRwd,
  generateTailwindConfig, generateDesignBrief, adjustDesignBrief,
  DesignBrief, TemplateData, GeneratedComponent, VariantConcept,
  ensureResponsiveClasses,
} from '../../services/uiux-generation'
import { translateBddToUISpec, buildUISpecSummary } from '../../services/bdd-to-ui-spec'
import { runQualityGate, autoFixCriticalIssues } from '../../services/quality-gate'
import { getBddSession, updateBddSession } from '../../services/bdd-session'
import { analyzeReference } from '../../services/reference-analyzer'
import { executeIteration, executeUndoIteration } from '../../services/iteration-skill'
import { semanticGateway } from '../../services/semantic-gateway'
import { detectFastModeIntent, getFaqReply, answerWithSonnet } from '../../services/customer-service'
import { sendMessage, saveFlowState, getFlowState, deleteFlowState, makeStreamingCallback, generatedCodeToFileRows, deductCredits } from '../orchestrator-utils'
import { CREDIT_COSTS } from '../../config/plans'
import {
  hasDeployIntent, hasRejectDeployIntent, hasUndoIntent,
  hasChangeIntent, hasRollbackSpecIntent,
  DESIGN_BRIEF_LIMITS,
} from '../intent-helpers'
import { createLogger } from '../../lib/logger'

// Lazy imports to avoid circular dependencies
const getDeployerSkill = () => import('./deploy-phases').then(m => m.executeDeployerSkill)
const getSpecChangeHandler = () => import('./bdd-phases').then(m => m.handleSpecChange)

const logger = createLogger('uiux-phases')

// ============================================================
// UIUX Phase Routing Handlers (called from phase-router.ts)
// ============================================================

export async function handleUiuxCodeGenerating(
  conversationId: string, state: FlowState, redis: Redis, io: SocketIOServer
) {
    const GENERATION_TIMEOUT_MS = 10 * 60 * 1000
    const startedAt = state.uiuxCodeGenerationStartedAt || 0
    const elapsed = Date.now() - startedAt

    const isTimedOut = startedAt === 0 || elapsed > GENERATION_TIMEOUT_MS

    if (isTimedOut) {
      logger.warn({ elapsed: startedAt === 0 ? 'legacy' : Math.round(elapsed / 1000) + 's' }, '代碼生成超時，偵測到中斷，自動恢復')

      // 檢查是否有已存檔的代碼可以恢復
      const hasCode = state.uiuxGeneratedCode &&
        (state.uiuxGeneratedCode.pages.length > 0 || state.uiuxGeneratedCode.components.length > 0)
      const resumePhase = state.uiuxCodePhase || 'structure'

      if (hasCode && resumePhase !== 'structure' && resumePhase !== 'complete') {
        // 有中途存檔且未完成 → 自動恢復管線（從中斷點繼續）
        logger.info({ resumePhase }, '從階段自動恢復管線')
        state.uiuxCodeGenerationStartedAt = Date.now()
        state.waitingForReply = false
        await saveFlowState(redis, conversationId, state)

        // 直接呼叫管線，它會根據 uiuxCodePhase 跳過已完成的階段
        await executeFullCodePipeline(conversationId, state, redis, io)
      } else if (hasCode && resumePhase === 'complete') {
        // 所有階段都完成了但沒走到最後收尾 → 直接進入 uiux_complete
        logger.info('代碼已全部生成，進入完成狀態')
        state.phase = 'uiux_complete'
        state.uiuxCodePhase = 'complete'
        state.uiuxCodeGenerationStartedAt = undefined
        state.waitingForReply = false
        await saveFlowState(redis, conversationId, state)

        await sendMessage(conversationId, io, {
          content: '代碼生成已恢復完成！\n\n你可以：\n- 輸入「**部署**」部署上線\n- 或描述想調整的地方，我來修改',
          stage: 'uiux_complete',
        })
      } else {
        // 沒有存檔 → 回到變體選擇重新生成
        state.phase = 'uiux_variant_selection'
        state.uiuxCodePhase = undefined
        state.uiuxCodeGenerationStartedAt = undefined
        state.waitingForReply = true
        await saveFlowState(redis, conversationId, state)

        await sendMessage(conversationId, io, {
          content: '代碼生成被中斷了（可能因為伺服器重啟）。請重新選擇設計方案以繼續。\n\n例如輸入「選擇 E」重新開始。',
          stage: 'uiux_variants_ready',
        })
      }
      return
    }

    await sendMessage(conversationId, io, {
      content: '正在生成中，請稍候...',
      stage: 'info',
    })
    return
}

export async function handleUiuxIterating(
  conversationId: string, state: FlowState, redis: Redis, io: SocketIOServer
) {
    const ITERATION_TIMEOUT_MS = 5 * 60 * 1000
    const iterStartedAt = state.uiuxCodeGenerationStartedAt || 0
    if (iterStartedAt > 0 && Date.now() - iterStartedAt > ITERATION_TIMEOUT_MS) {
      logger.warn('迭代修改超時，自動恢復到 uiux_complete')
      state.phase = 'uiux_complete'
      state.uiuxCodeGenerationStartedAt = undefined
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: '修改中斷了，請重新描述你想調整的內容。',
        stage: 'uiux_complete',
      })
      return
    }
    await sendMessage(conversationId, io, {
      content: '正在修改設計中，請稍候...',
      stage: 'info',
    })
    return
}

export async function handleFastGenerating(
  conversationId: string, state: FlowState, redis: Redis, io: SocketIOServer
) {
    const FAST_BUILD_TIMEOUT_MS = 20 * 60 * 1000
    const startedAt = state.uiuxCodeGenerationStartedAt || 0
    if (startedAt === 0 || Date.now() - startedAt > FAST_BUILD_TIMEOUT_MS) {
      logger.warn('Fast Build 超時，嘗試恢復')
      const hasCode = state.uiuxGeneratedCode &&
        (state.uiuxGeneratedCode.pages.length > 0 || state.uiuxGeneratedCode.components.length > 0)
      if (hasCode) {
        state.phase = 'uiux_complete'
        state.uiuxCodePhase = 'complete'
        state.uiuxCodeGenerationStartedAt = undefined
        state.waitingForReply = false
        await saveFlowState(redis, conversationId, state)
        const pageCount = state.uiuxGeneratedCode!.pages.length
        const compCount = state.uiuxGeneratedCode!.components.length
        const twConfig = state.uiuxDesignSystem ? generateTailwindConfig(state.uiuxDesignSystem) : ''
        await sendMessage(conversationId, io, {
          content: `快速生成中斷了，但已恢復之前的進度（${pageCount} 個頁面、${compCount} 個組件）。\n\n你可以：\n- 輸入「**部署**」部署現有代碼\n- 或描述想調整的地方`,
          stage: 'uiux_complete',
          layoutHint: 'split',
          richContent: {
            type: 'code_preview',
            data: {
              pages: state.uiuxGeneratedCode!.pages,
              components: state.uiuxGeneratedCode!.components,
              styles: state.uiuxGeneratedCode!.styles,
              tailwindConfig: twConfig,
              currentPhase: 'complete',
            } as Record<string, unknown>,
          },
          quickReplies: [
            { label: '部署上線', value: '部署', style: 'primary' },
          ],
        })
      } else {
        state.phase = 'idle'
        state.uiuxCodeGenerationStartedAt = undefined
        await saveFlowState(redis, conversationId, state)
        await sendMessage(conversationId, io, {
          content: '快速生成中斷了，請重新描述你想要什麼樣的網站。',
          stage: 'error',
        })
      }
      return
    }
    await sendMessage(conversationId, io, {
      content: '正在生成中，請稍候... 預計 5 分鐘完成。',
      stage: 'info',
    })
    return
}

export interface UiuxContinueFlowData {
  projectId: string
  conversationId: string
  userId: string
  taskId?: string
  message: string
  locale?: 'zh' | 'en'
  imageUrls?: string[]
}

export async function handleUiuxMixedPhaseRouting(
  data: UiuxContinueFlowData,
  state: FlowState,
  trimmedMsg: string,
  message: string,
  redis: Redis,
  io: SocketIOServer
) {
  const { conversationId, projectId, userId } = data

  // 全形字母轉半形
  const normalizedMsg = message.replace(/[Ａ-Ｚａ-ｚ]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
  )

    if (state.phase === 'spec_completed' && hasChangeIntent(trimmedMsg)) {
      await handleSpecChange(conversationId, state, trimmedMsg, redis, io)
      return
    }

    // ── spec_completed：查看變更歷史 ──
    if (state.phase === 'spec_completed' && trimmedMsg.includes('變更歷史')) {
      const session = await getBddSession({ sessionId: state.sessionId! })
      if (!session.success || !session.data) {
        await sendMessage(conversationId, io, { content: '規格資料已過期，請開始新的對話。', stage: 'error' })
        return
      }
      const history = session.data.changeHistory || []
      if (history.length === 0) {
        await sendMessage(conversationId, io, { content: '目前沒有變更歷史。', stage: 'info' })
      } else {
        let text = `**變更歷史**（${history.length} 筆）\n\n`
        history.forEach((entry, i) => {
          const time = new Date(entry.timestamp).toLocaleString('zh-TW')
          text += `**${i + 1}.** [${entry.changeType}] ${entry.description}\n   ${time} | 影響：${entry.affectedLayers.join(', ')}\n\n`
        })
        text += '_輸入「撤銷變更」可回滾到某個版本_'
        await sendMessage(conversationId, io, { content: text, stage: 'info' })
      }
      return
    }

    // ── spec_completed：撤銷變更（回滾規格）──
    if (state.phase === 'spec_completed' && hasRollbackSpecIntent(trimmedMsg)) {
      const session = await getBddSession({ sessionId: state.sessionId! })
      if (!session.success || !session.data) {
        await sendMessage(conversationId, io, { content: '規格資料已過期，無法回滾。', stage: 'error' })
        return
      }
      const history = session.data.changeHistory || []
      if (history.length === 0) {
        await sendMessage(conversationId, io, { content: '目前沒有變更歷史可回滾。', stage: 'info' })
        return
      }
      let text = `**選擇要回滾到的版本**\n\n回滾會還原該筆變更及其之後的所有變更。\n\n`
      history.forEach((entry, i) => {
        const time = new Date(entry.timestamp).toLocaleString('zh-TW')
        text += `**${i + 1}.** [${entry.changeType}] ${entry.description}\n   ${time}\n\n`
      })
      text += '_輸入編號（如「1」）選擇要回滾的變更，或輸入「取消」放棄。_'
      state.phase = 'spec_rollback_select'
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: text,
        stage: 'spec_rollback_select',
        quickReplies: [
          ...history.map((_, i) => ({ label: `回滾 #${i + 1}`, value: String(i + 1), style: 'ghost' as const })),
          { label: '取消', value: '取消', style: 'ghost' as const },
        ],
      })
      return
    }

    // 檢查是否是模板選擇訊息
    if (message.includes('我選擇') && message.includes('模板')) {
      try {
        await handleTemplateSelection(conversationId, state, message, redis, io)
      } catch (err) {
        await handlePhaseError(conversationId, state, err, redis, io)
      }
      return
    }

    // 檢查是否是變體選擇訊息（支援多種自然語言表達，含全形）
    if (
      normalizedMsg.includes('選擇變體') ||
      normalizedMsg.includes('合併') ||
      normalizedMsg.match(/選擇?\s*[A-E]/i) ||
      normalizedMsg.match(/我要\s*[A-E]/i) ||
      normalizedMsg.match(/我選\s*[A-E]/i) ||
      normalizedMsg.match(/^[A-E]$/i)
    ) {
      try {
        await handleVariantSelection(conversationId, state, normalizedMsg, redis, io)
      } catch (err) {
        await handlePhaseError(conversationId, state, err, redis, io)
      }
      return
    }

    // variant_selection 階段：任何包含 A-E 的訊息都嘗試路由
    if (state.phase === 'uiux_variant_selection' && normalizedMsg.match(/[A-E]/i)) {
      try {
        await handleVariantSelection(conversationId, state, normalizedMsg, redis, io)
      } catch (err) {
        await handlePhaseError(conversationId, state, err, redis, io)
      }
      return
    }

    // 檢查是否是確認使用模板
    if (message.includes('確認使用')) {
      await handleConfirmTemplate(conversationId, state, redis, io)
      return
    }

    // 管線跑完後的確認/重做（管線執行中 waitingForReply=false，不會觸發）
    if (state.uiuxCodePhase && state.waitingForReply && (
      message.includes('繼續') ||
      message.includes('下一步') ||
      message.includes('好') ||
      message.includes('可以') ||
      message === 'Y' ||
      message === 'y'
    )) {
      await handleCodePhaseConfirm(conversationId, state, redis, io)
      return
    }

    if (state.uiuxCodePhase && state.waitingForReply && (
      message.includes('重新生成') ||
      message.includes('重做')
    )) {
      await handleCodePhaseRedo(conversationId, state, redis, io)
      return
    }

    // ── UIUX 完成後檢查是否要部署、撤銷或迭代修改 ──
    if (state.phase === 'uiux_complete') {
      const trimmed = message.trim()
      if (hasDeployIntent(trimmed)) {
        await executeDeployerSkill({
          taskId: state.taskId || '',
          projectId: data.projectId,
          conversationId,
          userId,
          message,
          redis,
          io,
        })
        return
      }
      // 拒絕部署（「我不要部署」「先不上線」）→ 確認並提示其他選項
      if (hasRejectDeployIntent(trimmed)) {
        const isChinese = /[\u4e00-\u9fff]/.test(trimmed)
        const qr: { label: string; value: string; style: 'primary' | 'ghost' }[] = [
          { label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' },
        ]
        if (state.uiuxPreIterationCode) {
          qr.push({ label: isChinese ? '撤銷修改' : 'Undo', value: '撤銷', style: 'ghost' })
        }
        await sendMessage(conversationId, io, {
          content: isChinese
            ? '好的，暫時不部署。您可以繼續修改設計，或隨時點擊「部署上線」。'
            : 'Got it, not deploying for now. You can continue modifying the design, or click "Deploy" whenever ready.',
          stage: 'uiux_complete',
          quickReplies: qr,
        })
        return
      }
      if (hasUndoIntent(trimmed)) {
        await executeUndoIteration({ conversationId, projectId: data.projectId, redis, io })
        return
      }

      // 問候/問題/閒聊攔截 — 在 semanticGateway 前
      const intentCheck2 = detectFastModeIntent(trimmed)
      if (intentCheck2.match) {
        const isChinese = /[\u4e00-\u9fff]/.test(trimmed) || state.locale === 'zh'
        if (intentCheck2.type === 'question') {
          const faqResult = getFaqReply(trimmed, state.locale)
          const qr = [
            { label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' as const },
            { label: isChinese ? '開始新專案' : 'New Project', value: '__new_project__', style: 'ghost' as const },
          ]
          if (faqResult) {
            await sendMessage(conversationId, io, {
              content: faqResult.reply,
              stage: 'customer_service',
              quickReplies: qr,
            })
          } else {
            const sonnetReply = await answerWithSonnet(trimmed, { conversationId, locale: state.locale })
            await sendMessage(conversationId, io, {
              content: sonnetReply,
              stage: 'customer_service',
              quickReplies: qr,
            })
          }
          return
        }
        await sendMessage(conversationId, io, {
          content: isChinese
            ? '嗨！您的設計已經完成了。您可以：\n- 描述修改需求來調整設計\n- 點擊「部署上線」發布網站\n- 點擊「開始新專案」重新開始'
            : 'Hi! Your design is ready. You can:\n- Describe changes to adjust the design\n- Click "Deploy" to publish your site\n- Click "New Project" to start fresh',
          stage: 'info',
          quickReplies: [
            { label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' as const },
            { label: isChinese ? '開始新專案' : 'New Project', value: '__new_project__', style: 'ghost' as const },
          ],
        })
        return
      }

      // 有生成代碼 → semanticGateway 判斷是否為有效修改請求
      if (state.uiuxGeneratedCode && state.uiuxCodePhase === 'complete') {
        const gwResult2 = await semanticGateway({
          phase: 'iteration',
          userMessage: trimmed,
          conversationId,
          userId,
          locale: data.locale || state.locale,
        }, state)
        if (!gwResult2.accept) {
          state.semanticRejectCount = (state.semanticRejectCount || 0) + 1
          await saveFlowState(redis, conversationId, state)
          const qr: { label: string; value: string; style: 'primary' | 'ghost' }[] = [
            { label: '部署上線', value: '部署', style: 'primary' },
          ]
          if (state.uiuxPreIterationCode) {
            qr.push({ label: '撤銷修改', value: '撤銷', style: 'ghost' })
          }
          await sendMessage(conversationId, io, {
            content: gwResult2.guidanceMessage || '請描述您想修改的設計內容。',
            stage: 'info',
            quickReplies: qr,
          })
          return
        }
        state.semanticRejectCount = 0
        await saveFlowState(redis, conversationId, state)
        await executeIteration({ conversationId, projectId: data.projectId, userId, userFeedback: message, redis, io, imageUrls: data.imageUrls })
        return
      }
    }

    // ── UIUX 階段 catch-all ──
    // 如果到這裡還沒 return，表示訊息無法識別
    // 絕對不能讓它洩漏到下方的 BDD processUserReply
    logger.info({ phase: state.phase, message }, 'UIUX 階段未匹配的訊息')
    if (state.phase === 'uiux_variant_selection') {
      const vrIds = (state.uiuxVariants || []).map(v => ({
        label: `選擇 ${v.id}`,
        value: `選擇 ${v.id}`,
        style: 'ghost' as const,
      }))
      await sendMessage(conversationId, io, {
        content: '請選擇您喜歡的設計方向。\n\n- 輸入「選擇 A」直接使用某個方案\n- 輸入「合併 A+C」組合多個方案的特點',
        stage: 'info',
        quickReplies: vrIds.length > 0 ? vrIds : [
          { label: '選擇 A', value: '選擇 A', style: 'ghost' as const },
          { label: '選擇 B', value: '選擇 B', style: 'ghost' as const },
          { label: '選擇 C', value: '選擇 C', style: 'ghost' as const },
          { label: '選擇 D', value: '選擇 D', style: 'ghost' as const },
          { label: '選擇 E', value: '選擇 E', style: 'ghost' as const },
        ],
      })
    } else if (state.phase === 'uiux_template_selection') {
      await sendMessage(conversationId, io, {
        content: '請選擇一個模板，或描述您想要的設計風格。',
        stage: 'info',
      })
    } else if (state.phase === 'uiux_complete' && (!state.uiuxGeneratedCode || state.uiuxCodePhase !== 'complete')) {
      // 異常狀態：uiux_complete 但無代碼（例如 structure 失敗後殘留）
      logger.warn('uiux_complete 但無生成代碼，重置為 idle')
      state.phase = 'idle'
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: '目前沒有已生成的設計，請描述你想要什麼樣的網站，我來幫你生成。',
        stage: 'info',
      })
    }
    return
  }
}

// ============================================================
// UIUX Core Functions
// ============================================================

export async function handleTemplateSelection(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: SocketIOServer
) {
  // 從訊息中提取模板 ID
  // 訊息格式：「我選擇「xxx」這個模板」
  const templateMatch = message.match(/我選擇「([^」]+)」/)
  if (!templateMatch) {
    await sendMessage(conversationId, io, {
      content: '無法識別您選擇的模板，請重新選擇。',
      stage: 'error',
    })
    return
  }

  const templateIdOrName = templateMatch[1]
  logger.info(`用戶選擇模板: ${templateIdOrName}`)

  // 查詢模板
  const templateResult = await db.queryOne<{
    id: string
    name: string
    slug: string
    category: string
    description: string
    design_defaults: unknown
    page_structure: unknown
  }>(
    `SELECT id, name, slug, category, description, design_defaults, page_structure
     FROM templates
     WHERE id::text = $1 OR slug = $1 OR name = $1`,
    [templateIdOrName]
  )

  if (!templateResult) {
    await sendMessage(conversationId, io, {
      content: '找不到該模板，請重新選擇。',
      stage: 'error',
    })
    return
  }

  const template: TemplateData = {
    id: templateResult.id,
    name: templateResult.name,
    slug: templateResult.slug,
    category: templateResult.category,
    description: templateResult.description,
    designDefaults: templateResult.design_defaults as TemplateData['designDefaults'],
    pageStructure: templateResult.page_structure as TemplateData['pageStructure'],
  }

  // 讀取用戶在 PreviewPanel 中的 template overrides
  if (state.projectId) {
    const overridesResult = await db.queryOne<{ template_overrides: Record<string, Record<string, string>> | null }>(
      `SELECT template_overrides FROM projects WHERE id = $1`,
      [state.projectId]
    )
    if (overridesResult?.template_overrides && Object.keys(overridesResult.template_overrides).length > 0) {
      state.templateOverrides = overridesResult.template_overrides
      await saveFlowState(redis, conversationId, state)
      logger.info(`載入 template overrides: ${Object.keys(overridesResult.template_overrides).length} 個元素`)
    }
  }

  // 進入 Design Brief 確認環節
  await startDesignBriefConfirm(conversationId, state, template, 'template', redis, io)
}

/**
 * 處理變體選擇
 * 用戶選擇或合併變體後，啟動三階段生成流程
 */
export async function handleVariantSelection(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: SocketIOServer
) {
  // 解析用戶選擇
  // 支援格式：「選擇 A」、「選擇變體 A」、「我要 E」、「我選 B」、「A」、「合併 A+C」、「合併 A 和 C」
  let selectedIds: string[] = []

  const singleMatch = message.match(/(?:選擇\s*變體?|我要|我選|選)\s*([A-E])/i)
    || message.match(/^([A-E])$/i)
  const mergeMatch = message.match(/合併\s*([A-E])\s*[+和與]\s*([A-E])/i)
  const multiMergeMatch = message.match(/合併\s*([A-E](?:\s*[+和與,]\s*[A-E])+)/i)

  if (singleMatch) {
    selectedIds = [singleMatch[1].toUpperCase()]
  } else if (mergeMatch) {
    selectedIds = [mergeMatch[1].toUpperCase(), mergeMatch[2].toUpperCase()]
  } else if (multiMergeMatch) {
    const ids = multiMergeMatch[1].match(/[A-E]/gi)
    if (ids) {
      selectedIds = ids.map(id => id.toUpperCase())
    }
  } else {
    // 最後嘗試：從訊息中提取任何 A-E 字母
    const anyMatch = message.match(/[A-E]/i)
    if (anyMatch) {
      selectedIds = [anyMatch[0].toUpperCase()]
    }
  }

  if (selectedIds.length === 0) {
    await sendMessage(conversationId, io, {
      content: '無法識別您的選擇。請輸入「選擇 A」或「合併 A+C」格式。',
      stage: 'error',
    })
    return
  }

  logger.info(`用戶選擇變體: ${selectedIds.join(', ')}`)

  // 取得 BDD Session
  if (!state.sessionId) {
    logger.error('缺少 sessionId')
    await sendMessage(conversationId, io, {
      content: '設計資訊已過期，請重新開始一個新對話。',
      stage: 'error',
      quickReplies: [{ label: '開始新專案', value: '__new_project__', style: 'primary' }],
    })
    await deleteFlowState(redis, conversationId)
    return
  }

  const session = await getBddSession({ sessionId: state.sessionId })
  if (!session.success || !session.data) {
    logger.error('無法取得 BDD Session')
    await sendMessage(conversationId, io, {
      content: '無法取得設計資料，請重新開始。',
      stage: 'error',
      quickReplies: [{ label: '開始新專案', value: '__new_project__', style: 'primary' }],
    })
    await deleteFlowState(redis, conversationId)
    return
  }

  // 取得變體
  const variants = session.data.designVariants || state.uiuxVariants
  if (!variants || variants.length === 0) {
    await sendMessage(conversationId, io, {
      content: '找不到設計變體，請重新選擇模板。',
      stage: 'error',
    })
    return
  }

  // 驗證選擇的變體 ID
  const validIds = ['A', 'B', 'C', 'D', 'E']
  const invalidIds = selectedIds.filter(id => !validIds.includes(id))
  if (invalidIds.length > 0) {
    await sendMessage(conversationId, io, {
      content: `無效的變體 ID: ${invalidIds.join(', ')}。請選擇 A-E 之間的變體。`,
      stage: 'error',
    })
    return
  }

  // 合併變體生成最終 Design System
  const finalDesignSystem = synthesizeVariants(selectedIds, variants)

  // 提取選中 variant 的創意概念
  const variantConcept = extractVariantConcept(selectedIds, variants)
  state.uiuxVariantConcept = variantConcept
  logger.info(`變體創意概念: ${variantConcept.name}${variantConcept.signatureElement ? ` (Signature: ${variantConcept.signatureElement})` : ''}`)

  // 保存到 BDD Session
  await updateBddSession({
    sessionId: state.sessionId,
    updates: {
      selectedVariantIds: selectedIds,
      finalDesignSystem: finalDesignSystem,
      currentPhase: 'uiux_code_generation',
    },
  })

  // 更新狀態，開始完整生成管線
  state.phase = 'uiux_code_generation'
  state.uiuxDesignSystem = finalDesignSystem
  state.uiuxCodePhase = 'structure'
  state.waitingForReply = false
  state.uiuxCodeGenerationStartedAt = Date.now()
  await saveFlowState(redis, conversationId, state)

  // 一氣呵成：Structure → Animation → RWD → Quality Gate
  await executeFullCodePipeline(conversationId, state, redis, io)
}

// ============================================================
// 快速建站 Skill
// ============================================================


export async function executeFullCodePipeline(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const { sessionId, uiuxDesignSystem } = state

  if (!sessionId || !uiuxDesignSystem) {
    logger.error('Pipeline 缺少必要的狀態數據')
    return
  }

  const { template: dbTemplate, bddSpec, originalRequirements } = await getTemplateAndBddSpec(sessionId)
  const template = state.uiuxPreparedTemplate || dbTemplate
  const pages = template.pageStructure.pages || ['home']
  const twConfig = generateTailwindConfig(uiuxDesignSystem)

  // ===== Resume 支援：根據 uiuxCodePhase 跳過已完成階段 =====
  const PHASE_ORDER: Record<string, number> = { structure: 0, animation: 1, rwd: 2, quality_gate: 3, complete: 4 }
  const resumePhase = state.uiuxCodePhase || 'structure'
  const resumeIndex = PHASE_ORDER[resumePhase] ?? 0
  let currentCode = state.uiuxGeneratedCode || { pages: [], components: [], styles: '' }

  if (resumeIndex > 0 && (currentCode.pages.length > 0 || currentCode.components.length > 0)) {
    const pageCount = currentCode.pages.length
    const compCount = currentCode.components.length
    logger.info(`Pipeline 從 ${resumePhase} 階段恢復（已有 ${pageCount} 頁 ${compCount} 組件）`)
    await sendMessage(conversationId, io, {
      content: `正在從中斷點恢復生成（已完成 ${pageCount} 個頁面），繼續處理中...`,
      stage: 'uiux_pipeline_progress',
      progress: { current: resumeIndex, total: 3, step: '恢復生成' },
    })
  } else {
    await sendMessage(conversationId, io, {
      content: '正在生成設計中，請稍候...',
      stage: 'uiux_pipeline_progress',
      progress: { current: 1, total: 3, step: '生成中' },
    })
  }

  // ===== BDD→UI 翻譯（有快取跳過）=====
  let uiSpec = state.uiuxUISpec
  if (!uiSpec && bddSpec) {
    logger.info('Pipeline 開始 BDD→UI 翻譯...')
    const translateResult = await translateBddToUISpec(bddSpec, originalRequirements, { userId: state.userId, conversationId })
    if (translateResult.success && translateResult.spec) {
      uiSpec = translateResult.spec
      state.uiuxUISpec = uiSpec
      await saveFlowState(redis, conversationId, state)
      logger.info(`BDD→UI 翻譯完成: ${uiSpec.pages.length} 頁面`)
    } else {
      logger.warn({ err: translateResult.error }, 'BDD→UI 翻譯失敗，嘗試從原始需求生成...')
      if (originalRequirements) {
        const fallbackResult = await translateBddToUISpec('', originalRequirements, { userId: state.userId, conversationId })
        if (fallbackResult.success && fallbackResult.spec) {
          uiSpec = fallbackResult.spec
          state.uiuxUISpec = uiSpec
          await saveFlowState(redis, conversationId, state)
          logger.info(`原始需求→UI 翻譯完成: ${uiSpec.pages.length} 頁面`)
        } else {
          logger.warn('原始需求→UI 翻譯也失敗，降級用原始 bddSpec')
        }
      }
    }
  }

  // ===== 階段 1/3：結構（尚未完成時才執行）=====
  if (resumeIndex <= 0) {
    const structureResult = await generateStructure(
      uiuxDesignSystem,
      pages,
      template,
      bddSpec,
      state.uiuxDesignTier,
      {
        originalRequirements,
        designIdeas: state.uiuxDesignIdeas,
        designBrief: state.uiuxDesignBrief,
        uiSpec,
        variantConcept: state.uiuxVariantConcept,
        templateOverrides: state.templateOverrides,
        referenceAnalysis: state.uiuxReferenceAnalysis,
      },
      { userId: state.userId, conversationId, purpose: 'uiux_structure' },
      makeStreamingCallback(conversationId, io, redis, 'structure', twConfig)
    )

    if (!structureResult.success) {
      logger.error({ err: structureResult.error }, 'Pipeline 結構生成失敗')
      state.phase = 'uiux_variant_selection'
      state.uiuxCodePhase = undefined
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: `生成失敗：${structureResult.error}\n\n請重新選擇變體，或輸入「重試」再試一次。`,
        stage: 'error',
      })
      return
    }

    currentCode = {
      pages: structureResult.pages || [],
      components: structureResult.components || [],
      styles: structureResult.styles || '',
    }

    // ── Structure 中途存檔（防止後續階段中斷丟失進度）──
    state.uiuxGeneratedCode = currentCode
    state.uiuxStructureCode = currentCode
    state.uiuxCodePhase = 'animation'
    state.uiuxCodeGenerationStartedAt = Date.now() // 重設超時計時器
    await saveFlowState(redis, conversationId, state)
    await updateBddSession({
      sessionId,
      updates: {
        generatedPages: currentCode.pages,
        generatedComponents: currentCode.components,
        generatedStyles: currentCode.styles,
      },
    })
    if (state.projectId) {
      await db.upsertProjectFiles(state.projectId, 'uiux',
        generatedCodeToFileRows(currentCode, state.uiuxDesignSystem))
    }
  }

  // UISpec 摘要（Animation + RWD 共用）
  const pipelineUiSpecSummary = state.uiuxUISpec ? buildUISpecSummary(state.uiuxUISpec) : undefined

  // ===== 階段 2/3：動畫（animation 尚未完成時才執行）=====
  if (resumeIndex <= 1) {
    const animationResult = await generateAnimations(
      uiuxDesignSystem,
      currentCode,
      state.uiuxDesignTier,
      { userId: state.userId, conversationId, purpose: 'uiux_animation' },
      makeStreamingCallback(conversationId, io, redis, 'animation', twConfig),
      state.uiuxVariantConcept,
      pipelineUiSpecSummary
    )

    if (animationResult.success) {
      currentCode = {
        pages: animationResult.pages || currentCode.pages,
        components: animationResult.components || currentCode.components,
        styles: animationResult.styles || currentCode.styles,
      }
    } else {
      logger.warn({ err: animationResult.error }, 'Pipeline 動畫生成失敗，使用結構代碼繼續')
    }

    // ── Animation 中途存檔 ──
    state.uiuxGeneratedCode = currentCode
    state.uiuxAnimationCode = currentCode
    state.uiuxCodePhase = 'rwd'
    state.uiuxCodeGenerationStartedAt = Date.now() // 重設超時計時器
    await saveFlowState(redis, conversationId, state)
    await updateBddSession({
      sessionId,
      updates: {
        generatedPages: currentCode.pages,
        generatedComponents: currentCode.components,
        generatedStyles: currentCode.styles,
      },
    })
    if (state.projectId) {
      await db.upsertProjectFiles(state.projectId, 'uiux',
        generatedCodeToFileRows(currentCode, state.uiuxDesignSystem))
    }
  }

  // ===== 階段 3/3：響應式 =====
  const rwdResult = await generateRwd(
    uiuxDesignSystem,
    currentCode,
    state.uiuxDesignTier,
    { userId: state.userId, conversationId, purpose: 'uiux_rwd' },
    makeStreamingCallback(conversationId, io, redis, 'rwd', twConfig),
    state.uiuxVariantConcept,
    pipelineUiSpecSummary
  )

  if (rwdResult.success) {
    currentCode = {
      pages: rwdResult.pages || currentCode.pages,
      components: rwdResult.components || currentCode.components,
      styles: rwdResult.styles || currentCode.styles,
    }
  } else {
    logger.warn({ err: rwdResult.error }, 'Pipeline RWD 生成失敗，使用動畫代碼繼續')
  }

  // ===== Quality Gate（靜默執行）=====
  const MAX_FIX_ATTEMPTS = 3
  let report = runQualityGate(currentCode, state.uiuxDesignTier)
  let totalAutoFixed = 0

  for (let attempt = 0; attempt < MAX_FIX_ATTEMPTS && !report.passed; attempt++) {
    const criticalIssues = [
      ...report.categories.a11y.issues,
      ...report.categories.performance.issues,
      ...report.categories.code_quality.issues,
    ].filter(i => i.severity === 'critical')

    if (criticalIssues.length === 0) break

    logger.info(`Pipeline QG 修復 ${attempt + 1}/${MAX_FIX_ATTEMPTS}`)

    const fixedCode = await autoFixCriticalIssues(currentCode, criticalIssues, { userId: state.userId, conversationId })
    if (!fixedCode) break

    totalAutoFixed += criticalIssues.length
    currentCode = fixedCode
    report = runQualityGate(currentCode, state.uiuxDesignTier)
  }

  report.summary.autoFixed = totalAutoFixed

  // ===== 保存最終結果 =====
  state.uiuxGeneratedCode = currentCode
  state.uiuxQualityReport = report
  state.uiuxCodePhase = 'complete'
  state.phase = 'uiux_complete'
  state.waitingForReply = false
  await saveFlowState(redis, conversationId, state)

  // Credit 扣除：UIUX 完整管線額外成本（base 已在入口扣除）
  if (state.userId) {
    await deductCredits(state.userId, CREDIT_COSTS.UIUX_PIPELINE - CREDIT_COSTS.BASE_MESSAGE)
  }

  await updateBddSession({
    sessionId,
    updates: {
      generatedPages: currentCode.pages,
      generatedComponents: currentCode.components,
      generatedStyles: currentCode.styles,
      currentPhase: 'uiux_complete',
    },
  })

  if (state.projectId) {
    await db.upsertProjectFiles(state.projectId, 'uiux',
      generatedCodeToFileRows(currentCode, state.uiuxDesignSystem))
  }

  // ===== 清除 streaming preview =====
  await redis.del(`streaming:preview:${conversationId}`).catch(() => {})

  // ===== 最終完成訊息 =====
  const tailwindConfig = generateTailwindConfig(uiuxDesignSystem)
  const finalPageCount = currentCode.pages.length
  const finalComponentCount = currentCode.components.length

  await sendMessage(conversationId, io, {
    content: `設計完成！共 ${finalPageCount} 個頁面、${finalComponentCount} 個組件。輸入「**部署**」即可上線。`,
    stage: 'uiux_generation_complete',
    progress: { current: 3, total: 3, step: '完成' },
    layoutHint: 'split',
    richContent: {
      type: 'code_preview',
      data: {
        pages: currentCode.pages,
        components: currentCode.components,
        styles: currentCode.styles,
        tailwindConfig,
        currentPhase: 'complete',
      } as Record<string, unknown>,
    },
    quickReplies: [
      { label: '部署上線', value: '部署', style: 'primary' },
    ],
  })

  logger.info(`Pipeline 完成: ${finalPageCount} pages, ${finalComponentCount} components, QG passed=${report.passed}`)
}

/**
 * 階段 1：生成結構（保留供獨立調用）
 */
async function executeCodePhaseStructure(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const { sessionId, uiuxDesignSystem } = state

  if (!sessionId || !uiuxDesignSystem) {
    logger.error('缺少必要的狀態數據')
    return
  }

  // 發送生成中訊息
  await sendMessage(conversationId, io, {
    content: `**階段 1/3：結構生成**\n\n正在生成頁面結構和基礎樣式（桌面版）...`,
    stage: 'uiux_structure_generating',
    progress: { current: 1, total: 3, step: '生成結構' },
  })

  // 取得模板和 BDD 規格
  const { template: dbTemplate, bddSpec, originalRequirements } = await getTemplateAndBddSpec(sessionId)

  // 優先使用 FlowState 中的 uiuxPreparedTemplate（包含用戶的設計偏好和正確的頁面結構）
  const template = state.uiuxPreparedTemplate || dbTemplate

  // BDD→UI 翻譯（有快取跳過）
  let structUISpec = state.uiuxUISpec
  if (!structUISpec && bddSpec) {
    const translateResult = await translateBddToUISpec(bddSpec, originalRequirements, { userId: state.userId, conversationId })
    if (translateResult.success && translateResult.spec) {
      structUISpec = translateResult.spec
      state.uiuxUISpec = structUISpec
      await saveFlowState(redis, conversationId, state)
    }
  }

  // 生成結構
  const pages = template.pageStructure.pages || ['home']
  const twCfg = generateTailwindConfig(uiuxDesignSystem)
  const structureResult = await generateStructure(
    uiuxDesignSystem,
    pages,
    template,
    bddSpec,
    state.uiuxDesignTier,
    {
      originalRequirements,
      designIdeas: state.uiuxDesignIdeas,
      designBrief: state.uiuxDesignBrief,
      uiSpec: structUISpec,
      variantConcept: state.uiuxVariantConcept,
      referenceAnalysis: state.uiuxReferenceAnalysis,
    },
    { userId: state.userId, conversationId, purpose: 'uiux_structure' },
    makeStreamingCallback(conversationId, io, redis, 'structure', twCfg)
  )

  if (!structureResult.success) {
    logger.error({ err: structureResult.error }, '結構生成失敗')
    await sendMessage(conversationId, io, {
      content: `結構生成失敗：${structureResult.error}。請稍後再試。`,
      stage: 'error',
    })
    return
  }

  // 保存生成結果
  const generatedCode = {
    pages: structureResult.pages || [],
    components: structureResult.components || [],
    styles: structureResult.styles || '',
  }

  state.uiuxGeneratedCode = generatedCode
  state.uiuxStructureCode = generatedCode  // 保存快照供 redo 時回溯
  state.uiuxCodePhase = 'structure'
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  // 保存到 BDD Session
  await updateBddSession({
    sessionId,
    updates: {
      generatedPages: generatedCode.pages,
      generatedComponents: generatedCode.components,
      generatedStyles: generatedCode.styles,
    },
  })

  // 同步寫入 project_files（獨立存儲）
  if (state.projectId) {
    await db.upsertProjectFiles(state.projectId, 'uiux',
      generatedCodeToFileRows(generatedCode, state.uiuxDesignSystem))
  }

  // 清除 streaming preview
  await redis.del(`streaming:preview:${conversationId}`).catch(() => {})

  // 發送完成訊息，等待用戶確認
  const pageCount = generatedCode.pages.length
  const componentCount = generatedCode.components.length

  await sendMessage(conversationId, io, {
    content: `**階段 1/3 完成：結構**\n\n已生成：\n- ${pageCount} 個頁面\n- ${componentCount} 個組件\n- 全域樣式\n\n這是靜態的桌面版結構，請在預覽面板查看。\n\n---\n\n✅ **繼續** - 添加動畫效果\n🔄 **重新生成** - 重做這個階段`,
    stage: 'uiux_structure_complete',
    progress: { current: 1, total: 3, step: '結構完成' },
    layoutHint: 'split',
    richContent: {
      type: 'code_preview',
      data: {
        pages: generatedCode.pages,
        components: generatedCode.components,
        styles: generatedCode.styles,
        tailwindConfig: generateTailwindConfig(uiuxDesignSystem),
        currentPhase: 'structure',
      } as Record<string, unknown>,
    },
  })

  logger.info(`結構生成完成: ${pageCount} pages, ${componentCount} components`)
}

/**
 * 階段 2：添加動畫
 */
async function executeCodePhaseAnimation(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const { sessionId, uiuxDesignSystem, uiuxGeneratedCode } = state

  if (!sessionId || !uiuxDesignSystem || !uiuxGeneratedCode) {
    logger.error('缺少必要的狀態數據')
    return
  }

  // 發送生成中訊息
  await sendMessage(conversationId, io, {
    content: `**階段 2/3：動畫增強**\n\n正在添加動畫效果（入場動畫、hover 效果、狀態轉換）...`,
    stage: 'uiux_animation_generating',
    progress: { current: 2, total: 3, step: '添加動畫' },
  })

  // 生成動畫
  const animTwCfg = generateTailwindConfig(uiuxDesignSystem)
  const stepUiSpecSummary = state.uiuxUISpec ? buildUISpecSummary(state.uiuxUISpec) : undefined
  const animationResult = await generateAnimations(
    uiuxDesignSystem,
    uiuxGeneratedCode,
    state.uiuxDesignTier,
    { userId: state.userId, conversationId, purpose: 'uiux_animation' },
    makeStreamingCallback(conversationId, io, redis, 'animation', animTwCfg),
    state.uiuxVariantConcept,
    stepUiSpecSummary
  )

  if (!animationResult.success) {
    logger.error({ err: animationResult.error }, '動畫生成失敗')
    await sendMessage(conversationId, io, {
      content: `動畫生成失敗：${animationResult.error}。您可以選擇繼續或重試。`,
      stage: 'error',
    })
    return
  }

  // 更新生成結果
  const generatedCode = {
    pages: animationResult.pages || uiuxGeneratedCode.pages,
    components: animationResult.components || uiuxGeneratedCode.components,
    styles: animationResult.styles || uiuxGeneratedCode.styles,
  }

  state.uiuxGeneratedCode = generatedCode
  state.uiuxAnimationCode = generatedCode  // 保存快照供 redo 時回溯
  state.uiuxCodePhase = 'animation'
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  // 保存到 BDD Session
  await updateBddSession({
    sessionId,
    updates: {
      generatedPages: generatedCode.pages,
      generatedComponents: generatedCode.components,
      generatedStyles: generatedCode.styles,
    },
  })

  // 同步寫入 project_files（獨立存儲）
  if (state.projectId) {
    await db.upsertProjectFiles(state.projectId, 'uiux',
      generatedCodeToFileRows(generatedCode, state.uiuxDesignSystem))
  }

  // 清除 streaming preview
  await redis.del(`streaming:preview:${conversationId}`).catch(() => {})

  // 發送完成訊息
  await sendMessage(conversationId, io, {
    content: `**階段 2/3 完成：動畫**\n\n已添加：\n- 頁面入場動畫\n- 按鈕 hover/tap 效果\n- 卡片懸浮效果\n- Loading 動畫\n\n請在預覽面板查看動畫效果。\n\n---\n\n✅ **繼續** - 添加響應式設計\n🔄 **重新生成** - 重做動畫`,
    stage: 'uiux_animation_complete',
    progress: { current: 2, total: 3, step: '動畫完成' },
    layoutHint: 'split',
    richContent: {
      type: 'code_preview',
      data: {
        pages: generatedCode.pages,
        components: generatedCode.components,
        styles: generatedCode.styles,
        tailwindConfig: generateTailwindConfig(uiuxDesignSystem),
        currentPhase: 'animation',
      } as Record<string, unknown>,
    },
  })

  logger.info('動畫生成完成')
}

/**
 * 階段 3：添加響應式設計
 */
async function executeCodePhaseRwd(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const { sessionId, uiuxDesignSystem, uiuxGeneratedCode } = state

  if (!sessionId || !uiuxDesignSystem || !uiuxGeneratedCode) {
    logger.error('缺少必要的狀態數據')
    return
  }

  // 發送生成中訊息
  await sendMessage(conversationId, io, {
    content: `**階段 3/3：響應式設計**\n\n正在添加響應式佈局（移動端適配、漢堡選單、觸控優化）...`,
    stage: 'uiux_rwd_generating',
    progress: { current: 3, total: 3, step: '響應式設計' },
  })

  // 生成響應式設計
  const rwdTwCfg = generateTailwindConfig(uiuxDesignSystem)
  const rwdStepUiSpecSummary = state.uiuxUISpec ? buildUISpecSummary(state.uiuxUISpec) : undefined
  const rwdResult = await generateRwd(
    uiuxDesignSystem,
    uiuxGeneratedCode,
    state.uiuxDesignTier,
    { userId: state.userId, conversationId, purpose: 'uiux_rwd' },
    makeStreamingCallback(conversationId, io, redis, 'rwd', rwdTwCfg),
    state.uiuxVariantConcept,
    rwdStepUiSpecSummary
  )

  if (!rwdResult.success) {
    logger.error({ err: rwdResult.error }, '響應式設計生成失敗')
    await sendMessage(conversationId, io, {
      content: `響應式設計生成失敗：${rwdResult.error}。您可以選擇完成或重試。`,
      stage: 'error',
    })
    return
  }

  // 更新生成結果
  const generatedCode = {
    pages: rwdResult.pages || uiuxGeneratedCode.pages,
    components: rwdResult.components || uiuxGeneratedCode.components,
    styles: rwdResult.styles || uiuxGeneratedCode.styles,
  }

  state.uiuxGeneratedCode = generatedCode
  state.uiuxCodePhase = 'quality_gate'
  state.phase = 'uiux_quality_gate'
  state.waitingForReply = false
  await saveFlowState(redis, conversationId, state)

  logger.info('RWD 完成，觸發 Quality Gate')

  // 觸發 Quality Gate
  await executeQualityGate(conversationId, state, redis, io)
}

/**
 * Quality Gate：自動品質檢查 + 修復
 */
export async function executeQualityGate(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const { sessionId, uiuxDesignSystem, uiuxGeneratedCode } = state

  if (!sessionId || !uiuxDesignSystem || !uiuxGeneratedCode) {
    logger.error('Quality Gate 缺少必要的狀態數據')
    return
  }

  // 發送品質檢查進度訊息
  await sendMessage(conversationId, io, {
    content: '**品質檢查中...**\n\n正在檢查 A11y / Performance / SEO / Code Quality...',
    stage: 'uiux_quality_gate_running',
    progress: { current: 3, total: 3, step: '品質檢查' },
  })

  const MAX_FIX_ATTEMPTS = 3
  let currentCode = { ...uiuxGeneratedCode }
  let report = runQualityGate(currentCode, state.uiuxDesignTier)
  let totalAutoFixed = 0

  // 自動修復循環
  for (let attempt = 0; attempt < MAX_FIX_ATTEMPTS && !report.passed; attempt++) {
    const criticalIssues = [
      ...report.categories.a11y.issues,
      ...report.categories.performance.issues,
      ...report.categories.code_quality.issues,
    ].filter(i => i.severity === 'critical')

    if (criticalIssues.length === 0) break

    logger.info(`Quality Gate 修復嘗試 ${attempt + 1}/${MAX_FIX_ATTEMPTS}，${criticalIssues.length} 個 critical issues`)

    await sendMessage(conversationId, io, {
      content: `發現 ${criticalIssues.length} 個 critical 問題，正在自動修復（第 ${attempt + 1} 輪）...`,
      stage: 'uiux_quality_gate_fixing',
    })

    const fixedCode = await autoFixCriticalIssues(currentCode, criticalIssues, { userId: state.userId, conversationId })
    if (!fixedCode) {
      logger.error('Quality Gate autoFix 失敗')
      break
    }

    totalAutoFixed += criticalIssues.length
    currentCode = fixedCode
    report = runQualityGate(currentCode, state.uiuxDesignTier)
  }

  // 更新 autoFixed 計數
  report.summary.autoFixed = totalAutoFixed

  // 更新代碼和報告到 state
  state.uiuxGeneratedCode = currentCode
  state.uiuxQualityReport = report
  state.uiuxCodePhase = 'complete'
  state.phase = 'uiux_complete'
  await saveFlowState(redis, conversationId, state)

  // 保存最終結果到 BDD Session
  await updateBddSession({
    sessionId,
    updates: {
      generatedPages: currentCode.pages,
      generatedComponents: currentCode.components,
      generatedStyles: currentCode.styles,
      currentPhase: 'uiux_complete',
    },
  })

  // 同步寫入 project_files（獨立存儲）
  if (state.projectId) {
    await db.upsertProjectFiles(state.projectId, 'uiux',
      generatedCodeToFileRows(currentCode, state.uiuxDesignSystem))
  }

  // 發送品質報告
  const passedText = report.passed ? '通過' : '未通過'
  const fixedText = totalAutoFixed > 0 ? `\n已自動修復 ${totalAutoFixed} 個問題。` : ''

  await sendMessage(conversationId, io, {
    content: `**品質檢查${passedText}**\n\n共發現 ${report.summary.total} 個問題（Critical: ${report.summary.critical} / Warning: ${report.summary.warning} / Info: ${report.summary.info}）${fixedText}`,
    stage: 'uiux_quality_gate_complete',
    richContent: {
      type: 'quality_gate_report',
      data: report as unknown as Record<string, unknown>,
    },
  })

  // 生成 Tailwind 配置
  const tailwindConfig = generateTailwindConfig(uiuxDesignSystem)

  // 發送最終完成訊息
  const pageCount = currentCode.pages.length
  const componentCount = currentCode.components.length

  await sendMessage(conversationId, io, {
    content: `**程式碼生成完成！**\n\n已生成：\n- ${pageCount} 個頁面（含響應式）\n- ${componentCount} 個組件（含動畫）\n- 全域樣式 (globals.css)\n- Tailwind 配置\n\n品質檢查${report.passed ? '通過' : '完成'}${totalAutoFixed > 0 ? `，已自動修復 ${totalAutoFixed} 個問題` : ''}\n\n---\n\n🚀 輸入「**部署**」即可將網站部署上線`,
    stage: 'uiux_generation_complete',
    progress: { current: 3, total: 3, step: '完成' },
    layoutHint: 'split',
    richContent: {
      type: 'code_preview',
      data: {
        pages: currentCode.pages,
        components: currentCode.components,
        styles: currentCode.styles,
        tailwindConfig,
        currentPhase: 'complete',
      } as Record<string, unknown>,
    },
  })

  logger.info(`Quality Gate 完成: passed=${report.passed}, issues=${report.summary.total}, autoFixed=${totalAutoFixed}`)
}

/**
 * 處理階段確認（繼續到下一階段）
 */
export async function handleCodePhaseConfirm(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const { uiuxCodePhase } = state

  logger.info(`確認當前階段: ${uiuxCodePhase}`)

  switch (uiuxCodePhase) {
    case 'structure':
      // 繼續到動畫階段
      await executeCodePhaseAnimation(conversationId, state, redis, io)
      break
    case 'animation':
      // 繼續到響應式階段
      await executeCodePhaseRwd(conversationId, state, redis, io)
      break
    case 'complete':
      // 已經完成
      await sendMessage(conversationId, io, {
        content: '程式碼生成已完成。您可以在預覽面板查看和複製代碼。',
        stage: 'uiux_complete',
      })
      break
    default:
      await sendMessage(conversationId, io, {
        content: '當前沒有進行中的生成階段。',
        stage: 'error',
      })
  }
}

/**
 * 處理階段重做
 */
export async function handleCodePhaseRedo(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const { uiuxCodePhase } = state

  logger.info(`重做當前階段: ${uiuxCodePhase}`)

  // 恢復上一階段的代碼快照，確保 redo 是在乾淨的基礎上重做
  if (uiuxCodePhase === 'animation' && state.uiuxStructureCode) {
    state.uiuxGeneratedCode = state.uiuxStructureCode
  }

  switch (uiuxCodePhase) {
    case 'structure':
      await executeCodePhaseStructure(conversationId, state, redis, io)
      break
    case 'animation':
      await executeCodePhaseAnimation(conversationId, state, redis, io)
      break
    default:
      await sendMessage(conversationId, io, {
        content: '當前沒有可重做的階段。',
        stage: 'error',
      })
  }
}

/**
 * 取得模板和 BDD 規格
 */
async function getTemplateAndBddSpec(sessionId: string): Promise<{
  template: TemplateData
  bddSpec: string
  originalRequirements: string
}> {
  const session = await getBddSession({ sessionId })
  if (!session.success || !session.data) {
    return {
      template: {
        id: 'default',
        name: 'Default',
        slug: 'default',
        category: 'general',
        description: '預設模板',
        designDefaults: {},
        pageStructure: { pages: ['home'], components: [] },
      },
      bddSpec: '',
      originalRequirements: '',
    }
  }

  let template: TemplateData = {
    id: 'default',
    name: 'Default',
    slug: 'default',
    category: 'general',
    description: '預設模板',
    designDefaults: {},
    pageStructure: { pages: ['home'], components: [] },
  }

  if (session.data.uiuxTemplateId) {
    const templateResult = await db.queryOne<{
      id: string
      name: string
      slug: string
      category: string
      description: string
      design_defaults: unknown
      page_structure: unknown
    }>(
      `SELECT id, name, slug, category, description, design_defaults, page_structure
       FROM templates WHERE id::text = $1`,
      [session.data.uiuxTemplateId]
    )

    if (templateResult) {
      template = {
        id: templateResult.id,
        name: templateResult.name,
        slug: templateResult.slug,
        category: templateResult.category,
        description: templateResult.description,
        designDefaults: templateResult.design_defaults as TemplateData['designDefaults'],
        pageStructure: templateResult.page_structure as TemplateData['pageStructure'],
      }
    }
  }

  const bddSpec = session.data.featuresContent
    ? session.data.featuresContent.map(f => f.content).join('\n\n---\n\n')
    : ''

  return { template, bddSpec, originalRequirements: session.data.originalRequirements || '' }
}

/**
 * 處理確認使用模板
 * 當用戶確認使用當前預覽的模板時
 */
export async function handleConfirmTemplate(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  // 如果已經有選擇的模板，直接進入變體生成
  if (state.uiuxTemplateId) {
    // 發送訊息讓用戶選擇變體
    await sendMessage(conversationId, io, {
      content: '請選擇您喜歡的設計方向，或輸入「選擇 A」直接使用該變體。',
      stage: 'uiux_prompt_variant_selection',
      quickReplies: [
        { label: '選擇 A', value: '選擇 A', style: 'ghost' },
        { label: '選擇 B', value: '選擇 B', style: 'ghost' },
        { label: '選擇 C', value: '選擇 C', style: 'ghost' },
        { label: '選擇 D', value: '選擇 D', style: 'ghost' },
        { label: '選擇 E', value: '選擇 E', style: 'ghost' },
      ],
    })
    return
  }

  await sendMessage(conversationId, io, {
    content: '請先選擇一個模板。',
    stage: 'uiux_prompt_template_selection',
  })
}

// ============================================================
// 設計偏好詢問與釐清
// ============================================================

/**
 * 處理設計偏好回覆
 * A = 有想法，進入設計釐清
 * B = 沒想法，顯示模板
 */
export async function handleDesignPreferenceReply(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: SocketIOServer
) {
  const trimmed = message.trim().toUpperCase()

  // 判斷用戶選擇
  const hasIdeas = trimmed === 'A' ||
    trimmed.startsWith('A.') ||
    message.includes('有想法') ||
    message.includes('想討論') ||
    message.includes('我想要')

  const noIdeas = trimmed === 'B' ||
    trimmed.startsWith('B.') ||
    message.includes('沒有') ||
    message.includes('看模板') ||
    message.includes('沒想法')

  if (hasIdeas) {
    // 進入設計釐清流程
    await startDesignClarify(conversationId, state, redis, io)
  } else if (noIdeas) {
    // 顯示模板選擇器
    await showTemplatePicker(conversationId, state, redis, io)
  } else {
    // 無法識別，視為有想法，把訊息當作第一個設計想法
    await startDesignClarifyWithInitialIdea(conversationId, state, message, redis, io)
  }
}

/**
 * 開始設計釐清流程
 */
async function startDesignClarify(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  await sendMessage(conversationId, io, {
    content: `很好！讓我來了解你的設計想法。\n\n首先，請告訴我：\n\n**你希望產品給用戶什麼樣的感覺？**\n\n_例如：專業可靠、活潑有趣、簡約現代、溫暖親切..._`,
    stage: 'uiux_design_clarify',
    quickReplies: [
      { label: '← 返回重選', value: '__go_back__', style: 'ghost' },
    ],
  })

  // 初始化設計釐清狀態
  state.phase = 'uiux_design_clarify'
  state.lastStablePhase = 'uiux_design_clarify'
  state.uiuxDesignClarifyStep = 1
  state.uiuxDesignIdeas = []
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)
}

/**
 * 開始設計釐清流程，帶有初始想法
 */
async function startDesignClarifyWithInitialIdea(
  conversationId: string,
  state: FlowState,
  initialIdea: string,
  redis: Redis,
  io: SocketIOServer
) {
  // 保存初始想法
  state.phase = 'uiux_design_clarify'
  state.uiuxDesignClarifyStep = 2
  state.uiuxDesignIdeas = [{ step: 'initial', answer: initialIdea }]

  await sendMessage(conversationId, io, {
    content: `收到！「${initialIdea}」\n\n接下來，請告訴我：\n\n**你有沒有喜歡的網站或 App 可以參考？**\n\n_可以提供名稱或網址，例如：Notion、Stripe、Apple..._`,
    stage: 'uiux_design_clarify',
    quickReplies: [
      { label: '← 返回重選', value: '__go_back__', style: 'ghost' },
    ],
  })

  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)
}


/**
 * 處理設計釐清回覆
 */
export async function handleDesignClarifyReply(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: SocketIOServer
) {
  const step = state.uiuxDesignClarifyStep || 1
  const ideas = state.uiuxDesignIdeas || []

  // 設計釐清問題序列
  const clarifyQuestions = [
    {
      step: 1,
      key: 'feeling',
      question: '你希望產品給用戶什麼樣的感覺？',
      hint: '例如：專業可靠、活潑有趣、簡約現代、溫暖親切...',
    },
    {
      step: 2,
      key: 'reference',
      question: '你有沒有喜歡的網站或 App 可以參考？',
      hint: '可以提供名稱或網址，例如：Notion、Stripe、Apple...',
    },
    {
      step: 3,
      key: 'color',
      question: '你對顏色有什麼偏好嗎？',
      hint: '例如：藍色系、暖色調、黑白灰、品牌色是 #FF5733...',
    },
    {
      step: 4,
      key: 'layout',
      question: '你偏好什麼樣的佈局風格？',
      hint: '例如：簡潔留白、內容密集、卡片式、列表式...',
    },
  ]

  // 驗證並保存當前回答
  const currentQuestion = clarifyQuestions.find(q => q.step === step)
  if (currentQuestion) {
    const trimmedMsg = message.trim()

    // __skip__ → 跳過此題，不保存答案
    if (trimmedMsg === '__skip__') {
      // 不保存，直接進入下一題
    } else {
      // 語義閘門驗證回答品質
      const gatewayResult = await semanticGateway({
        phase: 'design_clarify',
        userMessage: trimmedMsg,
        designQuestion: currentQuestion,
        conversationId,
        userId: state.userId,
        locale: state.locale,
      }, state)

      if (!gatewayResult.accept) {
        state.semanticRejectCount = (state.semanticRejectCount || 0) + 1
        state.waitingForReply = true
        await saveFlowState(redis, conversationId, state)
        await sendMessage(conversationId, io, {
          content: gatewayResult.guidanceMessage || '請重新回答。',
          stage: 'uiux_design_clarify',
          quickReplies: [
            { label: '跳過此題', value: '__skip__', style: 'ghost' },
            { label: '← 重來', value: '__go_back__', style: 'ghost' },
          ],
        })
        return
      }

      // 驗證通過，重置拒絕計數並保存答案
      state.semanticRejectCount = 0
      ideas.push({ step: currentQuestion.key, answer: trimmedMsg })
      state.uiuxDesignIdeas = ideas
    }
  }

  // 檢查是否還有下一個問題
  const nextQuestion = clarifyQuestions.find(q => q.step === step + 1)

  if (nextQuestion) {
    // 繼續下一個問題
    await sendMessage(conversationId, io, {
      content: `好的，收到！\n\n**${nextQuestion.question}**\n\n_${nextQuestion.hint}_`,
      stage: 'uiux_design_clarify',
      quickReplies: [
        { label: '跳過此題', value: '__skip__', style: 'ghost' },
        { label: '← 重來', value: '__go_back__', style: 'ghost' },
      ],
    })

    state.uiuxDesignClarifyStep = step + 1
    state.waitingForReply = true
    await saveFlowState(redis, conversationId, state)
  } else {
    // 釐清完成，生成設計方案
    await completeDesignClarify(conversationId, state, redis, io)
  }
}

/**
 * 完成設計釐清，基於用戶想法生成設計變體
 */
export async function completeDesignClarify(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const ideas = state.uiuxDesignIdeas || []

  // 整理用戶的設計想法
  const designBrief = ideas.map(i => `- ${i.step}: ${i.answer}`).join('\n')

  await sendMessage(conversationId, io, {
    content: `太好了！收到你的設計想法：\n\n${designBrief}\n\n讓我整理一下方向...`,
    stage: 'uiux_design_clarify_complete',
  })

  // 分析參考網站（如有 URL）
  const referenceIdea = ideas.find(i => i.step === 'reference')
  if (referenceIdea?.answer) {
    try {
      const { analyzeReference } = await import('../services/reference-analyzer')
      const analysis = await analyzeReference(referenceIdea.answer, {
        userId: state.userId,
        conversationId,
        purpose: 'reference_analysis',
      })
      state.uiuxReferenceAnalysis = analysis
      await saveFlowState(redis, conversationId, state)

      if (analysis.analysisSource === 'vision' && analysis.visionAnalysis) {
        await sendMessage(conversationId, io, {
          content: `已分析 **${analysis.metadata?.title || analysis.url}** 的設計風格，會融入後續方案。`,
          stage: 'uiux_design_clarify_complete',
        })
      } else if (analysis.analysisSource === 'metadata_only') {
        await sendMessage(conversationId, io, {
          content: `已取得 **${analysis.metadata?.title || analysis.url}** 的基本資訊。`,
          stage: 'uiux_design_clarify_complete',
        })
      }
    } catch (err) {
      logger.warn({ err: err }, '參考網站分析失敗，降級為純文字')
    }
  }

  // 取得 BDD Session
  if (!state.sessionId) {
    logger.error('缺少 sessionId')
    return
  }

  const session = await getBddSession({ sessionId: state.sessionId })
  if (!session.success || !session.data) {
    logger.error('無法取得 BDD Session')
    return
  }

  // 構建設計需求摘要
  // 創建一個虛擬模板，基於用戶的設計想法
  const customTemplate: TemplateData = {
    id: 'custom',
    name: 'Custom Design',
    slug: 'custom',
    category: inferCategoryFromIdeas(ideas),
    description: designBrief,
    designDefaults: inferDesignDefaultsFromIdeas(ideas),
    pageStructure: { pages: ['home', 'dashboard'], components: [] },
  }

  // 進入 Design Brief 確認環節
  await startDesignBriefConfirm(conversationId, state, customTemplate, 'ideas', redis, io)
}

// ============================================================
// Design Brief 確認環節
// ============================================================

/** 從用戶設計偏好構建 fallback brief（Brief LLM 生成失敗時使用） */
function buildFallbackBrief(state: FlowState, productType: string): DesignBrief {
  const ideas = state.uiuxDesignIdeas || []
  const feeling = ideas.find(i => i.step === 'feeling')?.answer || ''
  const reference = ideas.find(i => i.step === 'reference')?.answer || ''
  const color = ideas.find(i => i.step === 'color')?.answer || ''
  const layout = ideas.find(i => i.step === 'layout')?.answer || ''

  const creativeKeywords = ['創意', '藝術', '大膽', '獨特', '極簡', '高端', '前衛', '時尚', 'creative', 'artistic', 'minimal']
  const isCreative = creativeKeywords.some(k => feeling.toLowerCase().includes(k))

  return {
    styleSummary: feeling || `${productType} 標準設計風格`,
    colorDirection: color || '根據產品類型自動選擇',
    layoutSuggestion: layout || '標準佈局',
    referenceAnalysis: reference || '無參考',
    professionalRecommendations: [],
    sourceType: state.uiuxDesignIdeas ? 'ideas' : 'template',
    recommendedTier: isCreative ? 'creative' : 'functional',
    tierReason: '根據用戶偏好自動推斷',
    domainKeywords: [],
    signature: '',
  }
}

/**
 * 啟動 Design Brief 確認
 * Path A 和 Path B 的匯流入口
 */
export async function startDesignBriefConfirm(
  conversationId: string,
  state: FlowState,
  template: TemplateData,
  sourceType: 'ideas' | 'template',
  redis: Redis,
  io: SocketIOServer
) {
  // 保存模板到 state
  state.uiuxPreparedTemplate = template

  // 發送分析中訊息
  await sendMessage(conversationId, io, {
    content: sourceType === 'ideas'
      ? '好的，讓我整理一下你的設計想法...'
      : `好的，讓我分析一下「${template.name}」模板的設計方向...`,
    stage: 'uiux_design_brief_generating',
  })

  // 取得 BDD Session
  if (!state.sessionId) {
    logger.error('缺少 sessionId')
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  const session = await getBddSession({ sessionId: state.sessionId })
  if (!session.success || !session.data) {
    logger.error('無法取得 BDD Session')
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  const bddSpec = session.data.featuresContent
    ? session.data.featuresContent.map(f => `- ${f.name}`).join('\n')
    : ''
  const productType = session.data.projectContext || '通用應用'

  // 呼叫 LLM 生成 Design Brief
  const briefResult = await generateDesignBrief(
    template,
    bddSpec,
    productType,
    sourceType === 'ideas' ? (state.uiuxDesignIdeas || null) : null,
    sourceType,
    { userId: state.userId, conversationId, purpose: 'uiux_brief' },
    state.uiuxReferenceAnalysis
  )

  if (!briefResult.success || !briefResult.brief) {
    // 降級：使用 fallback brief 而非完全跳過
    logger.warn({ err: briefResult.error }, 'Design Brief 生成失敗，使用 fallback brief')
    const fallbackBrief = buildFallbackBrief(state, productType)
    state.uiuxDesignBrief = fallbackBrief
    state.uiuxDesignTier = fallbackBrief.recommendedTier
    await saveFlowState(redis, conversationId, state)
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  // 保存 brief 到 state（含 tier）
  state.uiuxDesignBrief = briefResult.brief
  state.uiuxDesignTier = briefResult.brief.recommendedTier
  state.uiuxDesignBriefRound = 1
  state.uiuxDesignBriefHistory = [
    { role: 'assistant', content: briefResult.displayText || '' },
  ]
  state.phase = 'uiux_design_brief_confirm'
  state.lastStablePhase = 'uiux_design_brief_confirm'
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  // Credit 扣除：Design Brief 額外成本
  if (state.userId) {
    await deductCredits(state.userId, CREDIT_COSTS.DESIGN_BRIEF - CREDIT_COSTS.BASE_MESSAGE)
  }

  // 構建展示訊息
  const brief = briefResult.brief
  const tierLabel = brief.recommendedTier === 'creative' ? '創意型' : '功能型'
  const tierDesc = brief.recommendedTier === 'creative'
    ? '允許漸層背景、獨特字體、豐富動畫效果、大膽佈局'
    : '注重功能清晰度、保守配色、克制的動畫、標準佈局'

  const displayText = briefResult.displayText || `## 設計方向確認

**設計模式**：${tierLabel}（推薦）
_${brief.tierReason || tierDesc}_

根據你的${sourceType === 'ideas' ? '想法' : '選擇'}，我整理了以下方向：

**風格定位**：${brief.styleSummary}
**色彩方向**：${brief.colorDirection}
**佈局建議**：${brief.layoutSuggestion}
**參考分析**：${brief.referenceAnalysis}

**專業建議**：
${brief.professionalRecommendations.map(r => `- ${r}`).join('\n')}`

  await sendMessage(conversationId, io, {
    content: `${displayText}\n\n---\n\n如果沒有要調整的，我就開始生成設計方案了？\n也可以告訴我想調整的部分，例如：「顏色想暖一點」、「佈局改卡片式」、「我想要更有創意的設計」`,
    stage: 'uiux_design_brief_confirm',
    quickReplies: [
      { label: '確認，開始生成', value: '確認', style: 'primary' },
      { label: '我想調整', value: '我想調整', style: 'secondary' },
      { label: '← 重新選擇設計方向', value: '__go_back__', style: 'ghost' },
    ],
  })

  logger.info('Design Brief 已生成，等待用戶確認')
}

/**
 * 處理 Design Brief 確認回覆
 * 用戶可以確認、調整（最多 3 輪）
 */
export async function handleDesignBriefReply(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: SocketIOServer
) {
  const msg = message.trim().toLowerCase()

  // 判斷是否確認
  const confirmPatterns = /^(好|好的|可以|沒問題|確認|是|是的|對|嗯|ok|y|yes|沒有|就這樣|開始|proceed|go|沒有要調整|不用調整|直接開始|開始生成|不用了|可以了|很好|讚|棒|符合)$/i
  if (confirmPatterns.test(msg) || msg.includes('沒有要調整') || msg.includes('開始生成') || msg.includes('就這樣') || msg.includes('符合期待') || msg.includes('沒問題')) {
    logger.info('用戶確認 Design Brief，進入變體生成')
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  // 調整判斷
  const round = state.uiuxDesignBriefRound || 1
  if (round >= DESIGN_BRIEF_LIMITS.MAX_ROUNDS) {
    // 已達上限，自動 proceed
    logger.info('Design Brief 調整已達 3 輪上限，自動進入變體生成')
    await sendMessage(conversationId, io, {
      content: '已經調整了幾輪了，讓我根據目前的方向開始生成設計方案吧！',
      stage: 'uiux_design_brief_confirm',
    })
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  // 呼叫 LLM 調整 brief
  if (!state.uiuxDesignBrief || !state.uiuxPreparedTemplate) {
    logger.error('缺少 Design Brief 或模板資訊')
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  await sendMessage(conversationId, io, {
    content: '收到，讓我調整一下...',
    stage: 'uiux_design_brief_adjusting',
  })

  // 取得 productType
  let productType = '通用應用'
  if (state.sessionId) {
    const session = await getBddSession({ sessionId: state.sessionId })
    if (session.success && session.data) {
      productType = session.data.projectContext || '通用應用'
    }
  }

  // 更新對話歷史
  const history = state.uiuxDesignBriefHistory || []
  history.push({ role: 'user', content: message })

  const adjustResult = await adjustDesignBrief(
    state.uiuxDesignBrief,
    message,
    history,
    state.uiuxPreparedTemplate,
    productType,
    { userId: state.userId, conversationId, purpose: 'uiux_brief' }
  )

  if (!adjustResult.success || !adjustResult.brief) {
    logger.warn({ err: adjustResult.error }, '調整 Design Brief 失敗')
    await sendMessage(conversationId, io, {
      content: `調整時遇到問題，讓我直接用目前的方向開始生成吧。`,
      stage: 'uiux_design_brief_confirm',
    })
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  // 更新 state（含 tier 同步）
  state.uiuxDesignBrief = adjustResult.brief
  state.uiuxDesignTier = adjustResult.brief.recommendedTier
  state.uiuxDesignBriefRound = round + 1
  history.push({ role: 'assistant', content: adjustResult.displayText || '' })
  state.uiuxDesignBriefHistory = history
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  // 發送更新後的 brief
  const brief = adjustResult.brief
  const displayText = adjustResult.displayText || `## 設計方向（已更新）

**風格定位**：${brief.styleSummary}
**色彩方向**：${brief.colorDirection}
**佈局建議**：${brief.layoutSuggestion}
**參考分析**：${brief.referenceAnalysis}

**專業建議**：
${brief.professionalRecommendations.map(r => `- ${r}`).join('\n')}`

  const promptSuffix = round + 1 >= DESIGN_BRIEF_LIMITS.MAX_ROUNDS
    ? '\n\n已更新！接下來我就開始生成設計方案了。'
    : '\n\n已更新！還有要調整的嗎？沒有的話我就開始了！'

  await sendMessage(conversationId, io, {
    content: `${displayText}${promptSuffix}`,
    stage: 'uiux_design_brief_confirm',
    quickReplies: [
      { label: '確認，開始生成', value: '確認', style: 'primary' },
      { label: '← 重新選擇設計方向', value: '__go_back__', style: 'ghost' },
    ],
  })

  logger.info(`Design Brief 已調整（第 ${round + 1} 輪）`)
}

/**
 * 進入變體生成（公共邏輯）
 * Design Brief 確認後或降級時調用
 */
export async function proceedToVariantGeneration(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  const template = state.uiuxPreparedTemplate
  if (!template) {
    logger.error('proceedToVariantGeneration: 缺少 uiuxPreparedTemplate')
    await sendMessage(conversationId, io, {
      content: '發生錯誤：缺少模板資訊。請重新選擇設計方向。',
      stage: 'error',
    })
    return
  }

  // 將 Design Brief 注入模板 description（增強 prompt）
  if (state.uiuxDesignBrief) {
    const brief = state.uiuxDesignBrief
    const briefEnhancement = [
      `風格定位：${brief.styleSummary}`,
      `色彩方向：${brief.colorDirection}`,
      `佈局建議：${brief.layoutSuggestion}`,
      `參考分析：${brief.referenceAnalysis}`,
      ...brief.professionalRecommendations.map(r => `建議：${r}`),
      ...(brief.domainKeywords?.length ? [`Domain 關鍵概念：${brief.domainKeywords.join('、')}`] : []),
      ...(brief.signature ? [`Signature Element：${brief.signature}`] : []),
    ].join('\n')
    template.description = template.description
      ? `${template.description}\n\n## AI 設計顧問建議\n${briefEnhancement}`
      : `## AI 設計顧問建議\n${briefEnhancement}`
  }

  const sourceType = state.uiuxDesignBrief?.sourceType || 'template'

  // 發送生成中訊息
  await sendMessage(conversationId, io, {
    content: '設計方向已確認！接下來我會基於這個方向，生成 5 種不同風格的具體設計方案讓你挑選...',
    stage: 'uiux_variants_generating',
    progress: { current: 1, total: 3, step: '生成設計變體' },
  })

  // 取得 BDD Session
  if (!state.sessionId) {
    logger.error('proceedToVariantGeneration: 缺少 sessionId')
    await sendMessage(conversationId, io, {
      content: '設計資訊已過期，請重新開始。',
      stage: 'error',
      quickReplies: [{ label: '開始新專案', value: '__new_project__', style: 'primary' }],
    })
    await deleteFlowState(redis, conversationId)
    return
  }

  const session = await getBddSession({ sessionId: state.sessionId })
  if (!session.success || !session.data) {
    logger.error('proceedToVariantGeneration: 無法取得 BDD Session')
    await sendMessage(conversationId, io, {
      content: '無法取得設計資料，請重新開始。',
      stage: 'error',
      quickReplies: [{ label: '開始新專案', value: '__new_project__', style: 'primary' }],
    })
    await deleteFlowState(redis, conversationId)
    return
  }

  const bddSpec = session.data.featuresContent
    ? session.data.featuresContent.map(f => `- ${f.name}`).join('\n')
    : ''
  const productType = session.data.projectContext || '通用應用'
  const originalRequirements = session.data.originalRequirements || ''

  // 更新狀態
  state.phase = 'uiux_generating_variants'
  state.uiuxTemplateId = template.id
  await saveFlowState(redis, conversationId, state)

  // 更新 BDD Session（template.id = 'custom' 時不寫入 UUID 欄位）
  const sessionUpdates: Record<string, unknown> = {
    currentPhase: 'uiux_generating_variants',
  }
  if (template.id !== 'custom') {
    sessionUpdates.uiuxTemplateId = template.id
  }
  await updateBddSession({
    sessionId: state.sessionId,
    updates: sessionUpdates,
  })

  // 生成 5 個設計變體
  const variantsResult = await generateDesignVariants(
    template,
    bddSpec,
    productType,
    state.uiuxDesignTier,
    { userId: state.userId, conversationId, purpose: 'uiux_variants' },
    originalRequirements,
    state.uiuxReferenceAnalysis
  )

  if (!variantsResult.success || !variantsResult.variants) {
    logger.error({ err: variantsResult.error }, '生成設計變體失敗')
    if (sourceType === 'ideas') {
      // Path A fallback：切換到模板選擇
      await sendMessage(conversationId, io, {
        content: '生成設計方案時發生錯誤。讓我們改用模板開始。',
        stage: 'error',
      })
      await showTemplatePicker(conversationId, state, redis, io)
    } else {
      // Path B：降級回模板選擇
      await sendMessage(conversationId, io, {
        content: '生成設計方案時發生錯誤。讓我們重新選擇模板。',
        stage: 'error',
      })
      await showTemplatePicker(conversationId, state, redis, io)
    }
    return
  }

  const variants = variantsResult.variants
  logger.info(`成功生成 ${variants.length} 個設計變體`)

  // 保存變體到 BDD Session
  await updateBddSession({
    sessionId: state.sessionId,
    updates: {
      designVariants: variants,
      currentPhase: 'uiux_variant_selection',
    },
  })

  // 更新狀態
  state.phase = 'uiux_variant_selection'
  state.lastStablePhase = 'uiux_variant_selection'
  state.uiuxVariants = variants
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  // Credit 扣除：Design Variant 額外成本
  if (state.userId) {
    await deductCredits(state.userId, CREDIT_COSTS.DESIGN_VARIANT - CREDIT_COSTS.BASE_MESSAGE)
  }

  // 構建變體描述
  const variantDescriptions = variants.map(v =>
    `**${v.id}. ${v.name}**\n${v.description}\n關鍵特點：${v.keyFeatures.join('、')}`
  ).join('\n\n')

  const prefix = sourceType === 'ideas'
    ? '以下是 5 種不同的設計方案，都基於你確認的設計方向，但各有不同的切入角度'
    : '以下是 5 種不同的設計方案，各有不同的切入角度'

  // 發送變體選擇訊息
  const variantReplies: { label: string; value: string; style: 'primary' | 'secondary' | 'ghost' }[] = variants.map(v => ({
    label: `選擇 ${v.id}`,
    value: `選擇 ${v.id}`,
    style: 'ghost' as const,
  }))
  variantReplies.push({ label: '← 返回設計方向', value: '__go_back__', style: 'ghost' })
  await sendMessage(conversationId, io, {
    content: `${prefix}！\n\n${variantDescriptions}\n\n請選擇你喜歡的方向：\n- 輸入「選擇 A」直接使用某個方案\n- 輸入「合併 A+C」組合多個方案的特點`,
    stage: 'uiux_variants_ready',
    layoutHint: 'split',
    richContent: {
      type: 'variant_picker',
      data: {
        variants: variants,
        selectedIds: [],
        fromUserIdeas: sourceType === 'ideas',
      } as Record<string, unknown>,
    },
    quickReplies: variantReplies,
  })
}

/**
 * 顯示模板選擇器
 */
export async function showTemplatePicker(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: SocketIOServer
) {
  // 是否有智能匹配結果
  const hasMatchedIds = state.matchedTemplateIds && state.matchedTemplateIds.length > 0
  const filteredMode = hasMatchedIds

  let templatesResult
  if (hasMatchedIds) {
    // 只查詢匹配的模板，按匹配順序排列
    const ids = state.matchedTemplateIds!
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ')
    templatesResult = await db.query<{
      id: string
      name: string
      slug: string
      category: string
      description: string
      thumbnail_url: string
      preview_image_url: string | null
      tags: string[]
      design_defaults: unknown
      page_structure: unknown
      is_featured: boolean
      sort_order: number
    }>(`SELECT * FROM templates WHERE id::text IN (${placeholders}) AND is_active = true`, ids)

    // 按匹配順序排列（保持 matchedTemplateIds 的分數排序）
    const orderMap = new Map(ids.map((id, idx) => [id, idx]))
    templatesResult.rows.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99))
  } else {
    // fallback：全部模板
    templatesResult = await db.query<{
      id: string
      name: string
      slug: string
      category: string
      description: string
      thumbnail_url: string
      preview_image_url: string | null
      tags: string[]
      design_defaults: unknown
      page_structure: unknown
      is_featured: boolean
      sort_order: number
    }>('SELECT * FROM templates WHERE is_active = true ORDER BY sort_order ASC')
  }

  const templates = templatesResult.rows.map(row => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    previewImageUrl: row.preview_image_url,
    tags: row.tags,
    designDefaults: row.design_defaults,
    pageStructure: row.page_structure,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
  }))

  const recommendedIds = templates.filter(t => t.isFeatured).map(t => t.id)

  const content = filteredMode
    ? `根據你的需求，推薦了 ${templates.length} 個最合適的模板：`
    : '好的！請從下方選擇一個設計模板作為起點：'

  await sendMessage(conversationId, io, {
    content,
    stage: 'uiux_template_picker',
    layoutHint: 'split',
    richContent: {
      type: 'template_picker',
      data: {
        templates,
        recommendedIds,
        selectedTemplateId: null,
        filteredMode,
      },
    },
    quickReplies: [
      { label: '← 返回', value: '__go_back__', style: 'ghost' },
    ],
  })

  state.phase = 'uiux_template_selection'
  state.lastStablePhase = 'uiux_template_selection'
  state.waitingForReply = false
  await saveFlowState(redis, conversationId, state)
}

/**
 * 從用戶想法推斷類別
 */
function inferCategoryFromIdeas(ideas: Array<{ step: string; answer: string }>): string {
  const allText = ideas.map(i => i.answer).join(' ').toLowerCase()

  if (allText.includes('dashboard') || allText.includes('後台') || allText.includes('管理')) {
    return 'dashboard'
  }
  if (allText.includes('電商') || allText.includes('購物') || allText.includes('ecommerce')) {
    return 'ecommerce'
  }
  if (allText.includes('landing') || allText.includes('行銷') || allText.includes('宣傳')) {
    return 'landing'
  }
  if (allText.includes('saas') || allText.includes('工具') || allText.includes('平台')) {
    return 'saas'
  }

  return 'general'
}

/**
 * 從用戶想法推斷設計默認值
 */
function inferDesignDefaultsFromIdeas(ideas: Array<{ step: string; answer: string }>): TemplateData['designDefaults'] {
  const defaults: TemplateData['designDefaults'] = {}

  const colorIdea = ideas.find(i => i.step === 'color')
  if (colorIdea) {
    const answer = colorIdea.answer.toLowerCase()
    if (answer.includes('藍') || answer.includes('blue')) {
      defaults.colorScheme = 'blue'
    } else if (answer.includes('綠') || answer.includes('green')) {
      defaults.colorScheme = 'green'
    } else if (answer.includes('紅') || answer.includes('red')) {
      defaults.colorScheme = 'red'
    } else if (answer.includes('黑') || answer.includes('dark') || answer.includes('暗')) {
      defaults.colorScheme = 'dark'
    } else if (answer.includes('暖')) {
      defaults.colorScheme = 'warm'
    }
  }

  const layoutIdea = ideas.find(i => i.step === 'layout')
  if (layoutIdea) {
    const answer = layoutIdea.answer.toLowerCase()
    if (answer.includes('簡潔') || answer.includes('留白') || answer.includes('minimal')) {
      defaults.spacing = 'spacious'
    } else if (answer.includes('密集') || answer.includes('compact')) {
      defaults.spacing = 'compact'
    }
  }

  return defaults
}

// ============================================================
// Deployer Skill
// ============================================================

