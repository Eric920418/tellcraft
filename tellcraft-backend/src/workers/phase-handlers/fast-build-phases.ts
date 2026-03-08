// ============================================================
// Fast Build Phase Handler
// 從 orchestrator.ts 提取
// ============================================================

import { Server as SocketIOServer } from 'socket.io'
import Redis from 'ioredis'
import * as db from '../../db/client'
import type { FlowState } from '../../types/flow-state'
import {
  generateStructure, generateAnimations, generateRwd,
  generateTailwindConfig, ensureResponsiveClasses,
  VariantConcept, GeneratedComponent,
} from '../../services/uiux-generation'
import { runQualityGate, autoFixCriticalIssues } from '../../services/quality-gate'
import {
  detectDesignTier, inferProductType, inferPages,
  buildDefaultDesignSystem, buildMinimalTemplate,
  inferInteractionHint, getTemplateStyleHint, inferLayoutMode,
  generateFastConcept, expandBriefPrompt,
  mergePages,
} from '../../services/fast-build-generation'
import { buildUISpecSummary } from '../../services/bdd-to-ui-spec'
import { sendMessage, saveFlowState, getFlowState, deleteFlowState, makeStreamingCallback, generatedCodeToFileRows, deductCredits } from '../orchestrator-utils'
import { CREDIT_COSTS } from '../../config/plans'
import { recommendMoods } from '../../services/design-moods'
import { createLogger } from '../../lib/logger'

const logger = createLogger('fast-build-phases')

export async function executeFastBuildSkill(params: {
  taskId: string
  projectId: string
  conversationId: string
  userId: string
  message: string
  locale?: 'zh' | 'en'
  redis: Redis
  io: SocketIOServer
}) {
  const { taskId, projectId, conversationId, userId, message, locale, redis, io } = params

  try {
  // ── 推斷設計參數（零 LLM 成本）──
  let tier = detectDesignTier(message)
  const productType = inferProductType(message)
  const pages = inferPages(message, productType)
  let designSystem = buildDefaultDesignSystem(tier, productType)
  const template = buildMinimalTemplate(message, productType)

  const layoutMode = inferLayoutMode(productType, message)
  logger.info(`tier=${tier}, type=${productType}, layout=${layoutMode}, pages=[${pages.join(',')}]`)

  // ── 模板風格提示（降級跳過，不影響主流程）──
  let templateStyleHint: string | null = null
  try {
    templateStyleHint = await getTemplateStyleHint(message, productType)
    if (templateStyleHint) logger.info('匹配到模板風格提示')
  } catch (e) {
    logger.warn({ err: e }, '模板風格提示查詢失敗，降級跳過')
  }

  // ── 順序執行：先概念生成（取 suggestedPages）→ 合併頁面 → Prompt 擴展 ──
  let variantConcept: VariantConcept | undefined
  let expandedPrompt: string | null = null
  let finalPages = pages
  {
    const palette = designSystem.colorPalette as { primary?: string } | undefined
    const concept = await generateFastConcept(
      message, productType, tier, palette?.primary || '#6366f1',
      { userId, conversationId }
    ).catch(() => null)

    if (concept) {
      variantConcept = {
        name: concept.name,
        description: concept.vibe,
        keyFeatures: concept.keyFeatures,
        signatureElement: concept.signatureElement,
        previewDescription: concept.vibe,
        sourceVariantIds: [],
      }
      logger.info(`概念生成成功: "${concept.name}" (suggested tier: ${concept.suggestedTier || 'N/A'}, suggestedPages: ${concept.suggestedPages?.join(',') || 'N/A'})`)

      // Tier 智能修正（Haiku 判斷 vs 規則不一致時以 Haiku 為準）
      if (concept.suggestedTier && concept.suggestedTier !== tier) {
        logger.info(`Tier 修正: ${tier} → ${concept.suggestedTier}`)
        tier = concept.suggestedTier
        designSystem = buildDefaultDesignSystem(tier, productType)
      }

      // 合併頁面（DEFAULT_PAGES + Haiku suggestedPages）
      finalPages = mergePages(pages, concept.suggestedPages)
      if (finalPages.length !== pages.length) {
        logger.info(`頁面合併: ${pages.length} → ${finalPages.length} [${finalPages.join(',')}]`)
      }
    }

    expandedPrompt = await expandBriefPrompt(message, productType, finalPages, { userId, conversationId })
      .catch(() => null)

    if (expandedPrompt) {
      logger.info(`Prompt 擴展成功（${expandedPrompt.length} 字）`)
    }
  }

  // ── 推薦 Mood ──
  const recommendedMoodIds = recommendMoods(message, productType, tier)
  const moodId = recommendedMoodIds[0] || undefined

  // ── 設定 FlowState ──
  const state: FlowState = {
    phase: 'fast_generating',
    projectId,
    currentRound: 0,
    questionIndex: 0,
    batchCount: 0,
    taskId,
    waitingForReply: false,
    totalQuestionsAsked: 0,
    uiuxDesignSystem: designSystem,
    uiuxDesignTier: tier,
    uiuxCodePhase: 'structure',
    uiuxCodeGenerationStartedAt: Date.now(),
    fastMode: true,
    fastModeProductType: productType,
    locale: locale || (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(message) ? 'zh' : 'en'),
    fastModeLayoutMode: layoutMode,
    fastModeOriginalMessage: message,
    fastModeExpandedPrompt: expandedPrompt || undefined,
    uiuxVariantConcept: variantConcept,
    uiuxDesignMood: moodId,
    userId,
  }
  await saveFlowState(redis, conversationId, state)

  const isChinese = state.locale === 'zh'
  const buildTargetLabel = layoutMode === 'app'
    ? (isChinese ? '應用' : 'app')
    : (isChinese ? '網站' : 'website')

  // ── 發送進度消息（含預估時間）──
  await sendMessage(conversationId, io, {
    content: isChinese
      ? `正在快速生成您的${buildTargetLabel}...${variantConcept ? `\n設計概念：**${variantConcept.name}** — ${variantConcept.description}` : ''}`
      : `Quickly generating your ${buildTargetLabel}...${variantConcept ? `\nDesign concept: **${variantConcept.name}** — ${variantConcept.description}` : ''}`,
    stage: 'fast_generating',
    progress: { current: 1, total: 3, step: isChinese ? '生成結構' : 'Generating structure' },
    richContent: {
      type: 'fast_build_progress' as const,
      data: { phase: 'structure', progress: { current: 1, total: 3, step: isChinese ? '生成結構' : 'Generating structure' }, estimatedSecondsRemaining: 240 } as unknown as Record<string, unknown>,
    },
  })

  const twConfig = generateTailwindConfig(designSystem)

  // ===== 階段 1/3：結構 =====
  const interactionHint = inferInteractionHint(productType)
  const structureResult = await generateStructure(
    designSystem,
    finalPages,
    template,
    undefined, // 無 bddSpec
    tier,
    {
      originalRequirements: expandedPrompt || message,
      variantConcept,
      interactionHint,
      templateStyleHint: templateStyleHint || undefined,
      layoutMode,
      moodId,
    },
    { userId, conversationId, purpose: 'fast-build-structure' },
    makeStreamingCallback(conversationId, io, redis, 'structure', twConfig)
  )

  if (!structureResult.success) {
    logger.error({ err: structureResult.error }, '結構生成失敗')
    // 保留 FlowState 以供重試（只清除生成時間戳）
    state.phase = 'fast_generating'
    state.uiuxCodeGenerationStartedAt = undefined
    state.waitingForReply = true
    await saveFlowState(redis, conversationId, state)
    await sendMessage(conversationId, io, {
      content: isChinese
        ? `生成失敗：${structureResult.error}\n\n你可以點「重試」使用相同描述再試一次。`
        : `Generation failed: ${structureResult.error}\n\nClick "Retry" to try again with the same description.`,
      stage: 'error',
      quickReplies: [
        { label: isChinese ? '重試' : 'Retry', value: '__retry_fast_build__', style: 'primary' as const },
      ],
    })
    return
  }

  let currentCode = {
    pages: structureResult.pages || [],
    components: structureResult.components || [],
    styles: structureResult.styles || '',
  }

  // ── Structure 中途存檔 ──
  state.uiuxGeneratedCode = currentCode
  state.uiuxStructureCode = currentCode
  state.uiuxCodePhase = 'animation'
  state.uiuxCodeGenerationStartedAt = Date.now() // 重設超時計時器
  await saveFlowState(redis, conversationId, state)
  if (projectId) {
    await db.upsertProjectFiles(projectId, 'uiux',
      generatedCodeToFileRows(currentCode, designSystem))
  }

  // ===== 階段 2/3：動畫 =====
  await sendMessage(conversationId, io, {
    content: isChinese ? '結構生成完成，正在添加動畫效果...' : 'Structure done, adding animations...',
    stage: 'fast_generating',
    progress: { current: 2, total: 3, step: isChinese ? '添加動畫' : 'Adding animations' },
    richContent: {
      type: 'fast_build_progress' as const,
      data: { phase: 'animation', progress: { current: 2, total: 3, step: isChinese ? '添加動畫' : 'Adding animations' }, estimatedSecondsRemaining: 120 } as unknown as Record<string, unknown>,
    },
  })

  const fastUiSpecSummary = state.uiuxUISpec ? buildUISpecSummary(state.uiuxUISpec)
    : (interactionHint ? `產品互動概覽：\n${interactionHint}` : undefined)
  const animationResult = await generateAnimations(
    designSystem,
    currentCode,
    tier,
    { userId, conversationId, purpose: 'fast-build-animation' },
    makeStreamingCallback(conversationId, io, redis, 'animation', twConfig),
    variantConcept, // 注入創意概念
    fastUiSpecSummary,
    moodId,
  )

  if (animationResult.success) {
    currentCode = {
      pages: animationResult.pages || currentCode.pages,
      components: animationResult.components || currentCode.components,
      styles: animationResult.styles || currentCode.styles,
    }
  } else {
    logger.warn({ err: animationResult.error }, '動畫生成失敗，使用結構代碼繼續')
  }

  // ── Animation 中途存檔 ──
  state.uiuxGeneratedCode = currentCode
  state.uiuxAnimationCode = currentCode
  state.uiuxCodePhase = 'rwd'
  state.uiuxCodeGenerationStartedAt = Date.now() // 重設超時計時器
  await saveFlowState(redis, conversationId, state)
  if (projectId) {
    await db.upsertProjectFiles(projectId, 'uiux',
      generatedCodeToFileRows(currentCode, designSystem))
  }

  // ===== 階段 3/3：響應式 =====
  await sendMessage(conversationId, io, {
    content: isChinese ? '動畫添加完成，正在優化響應式佈局...' : 'Animations done, optimizing responsive layout...',
    stage: 'fast_generating',
    progress: { current: 3, total: 3, step: isChinese ? '響應式優化' : 'Responsive optimization' },
    richContent: {
      type: 'fast_build_progress' as const,
      data: { phase: 'rwd', progress: { current: 3, total: 3, step: isChinese ? '響應式優化' : 'Responsive optimization' }, estimatedSecondsRemaining: 60 } as unknown as Record<string, unknown>,
    },
  })
  const rwdResult = await generateRwd(
    designSystem,
    currentCode,
    tier,
    { userId, conversationId, purpose: 'fast-build-rwd' },
    makeStreamingCallback(conversationId, io, redis, 'rwd', twConfig),
    variantConcept, // 注入創意概念
    fastUiSpecSummary,
    layoutMode,
    moodId,
  )

  if (rwdResult.success) {
    currentCode = {
      pages: rwdResult.pages || currentCode.pages,
      components: rwdResult.components || currentCode.components,
      styles: rwdResult.styles || currentCode.styles,
    }
  } else {
    logger.warn({ err: rwdResult.error }, 'RWD 生成失敗，套用 ensureResponsiveClasses')
    const fixed = ensureResponsiveClasses(currentCode.pages, currentCode.components)
    currentCode.pages = fixed.pages
    currentCode.components = fixed.components
  }

  // ===== Quality Gate（靜態檢查 + 最多 2 輪 LLM 修復）=====
  let report = runQualityGate(currentCode, tier)
  logger.info(`QG: passed=${report.passed}, critical=${report.summary.critical}, warning=${report.summary.warning}`)

  const FAST_QG_MAX_ATTEMPTS = 2
  for (let attempt = 0; attempt < FAST_QG_MAX_ATTEMPTS && !report.passed; attempt++) {
    const criticalIssues = [
      ...report.categories.a11y.issues,
      ...report.categories.performance.issues,
      ...report.categories.code_quality.issues,
    ].filter(i => i.severity === 'critical')
    if (criticalIssues.length === 0) break

    logger.info(`QG 第 ${attempt + 1} 輪修復：${criticalIssues.length} 個 critical`)
    try {
      const fixed = await autoFixCriticalIssues(currentCode, criticalIssues, { userId, conversationId })
      if (!fixed) break
      currentCode = fixed
      report = runQualityGate(currentCode, tier)
      logger.info(`QG 修復後: passed=${report.passed}, critical=${report.summary.critical}`)
    } catch (qgErr) {
      logger.warn({ err: qgErr }, 'QG 修復失敗，跳過')
      break
    }
  }

  // ===== 保存最終結果 =====
  state.uiuxGeneratedCode = currentCode
  state.uiuxQualityReport = report
  state.uiuxCodePhase = 'complete'
  state.phase = 'uiux_complete'
  state.waitingForReply = false
  state.uiuxCodeGenerationStartedAt = undefined
  await saveFlowState(redis, conversationId, state)

  // Credit 扣除：Fast Build 額外成本（base 已在入口扣除）
  await deductCredits(userId, CREDIT_COSTS.FAST_BUILD - CREDIT_COSTS.BASE_MESSAGE)

  if (projectId) {
    await db.upsertProjectFiles(projectId, 'uiux',
      generatedCodeToFileRows(currentCode, designSystem))
  }

  // ===== 清除 streaming preview =====
  await redis.del(`streaming:preview:${conversationId}`).catch(() => {})

  // ===== 完成訊息 =====
  const finalPageCount = currentCode.pages.length
  const finalComponentCount = currentCode.components.length

  const qgText = report.passed && report.summary.warning === 0
    ? ''
    : report.passed
      ? (isChinese ? `\n品質檢查通過（${report.summary.warning} 個建議項）。` : `\nQuality check passed (${report.summary.warning} suggestions).`)
      : (isChinese ? `\n品質檢查：${report.summary.critical} 個問題、${report.summary.warning} 個建議。` : `\nQuality check: ${report.summary.critical} issues, ${report.summary.warning} suggestions.`)

  const conceptNote = variantConcept
    ? (isChinese ? `\n設計概念：**${variantConcept.name}**` : `\nDesign concept: **${variantConcept.name}**`)
    : ''

  await sendMessage(conversationId, io, {
    content: isChinese
      ? `快速生成完成！共 ${finalPageCount} 個頁面、${finalComponentCount} 個組件。${conceptNote}${qgText}\n\n你可以：\n- 直接說想修改的地方，AI 會幫你調整\n- 輸入「**部署**」即可上線`
      : `Generation complete! ${finalPageCount} pages, ${finalComponentCount} components.${conceptNote}${qgText}\n\nYou can:\n- Describe changes and AI will adjust\n- Type "**deploy**" to go live`,
    stage: 'uiux_generation_complete',
    progress: { current: 3, total: 3, step: isChinese ? '完成' : 'Done' },
    layoutHint: 'split',
    richContent: {
      type: 'code_preview',
      data: {
        pages: currentCode.pages,
        components: currentCode.components,
        styles: currentCode.styles,
        tailwindConfig: twConfig,
        currentPhase: 'complete',
      } as Record<string, unknown>,
    },
    quickReplies: [
      { label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' },
    ],
  })

  await db.updateTask(taskId, { status: 'completed' })
  logger.info(`完成: ${finalPageCount} pages, ${finalComponentCount} components`)

  } catch (err) {
    logger.error({ err: err }, '未預期錯誤')
    const errLocale = locale || 'zh'
    const errIsChinese = errLocale === 'zh'
    // 嘗試恢復 FlowState
    try {
      const recoveryState = await getFlowState(redis, conversationId)
      if (recoveryState) {
        const hasCode = recoveryState.uiuxGeneratedCode &&
          (recoveryState.uiuxGeneratedCode.pages.length > 0 || recoveryState.uiuxGeneratedCode.components.length > 0)
        if (hasCode) {
          recoveryState.phase = 'uiux_complete'
          recoveryState.uiuxCodeGenerationStartedAt = undefined
          recoveryState.uiuxCodePhase = 'complete'
          await saveFlowState(redis, conversationId, recoveryState)
        } else {
          recoveryState.uiuxCodeGenerationStartedAt = undefined
          recoveryState.waitingForReply = true
          await saveFlowState(redis, conversationId, recoveryState)
        }
      }
    } catch (recoveryErr) {
      logger.error({ err: recoveryErr }, '恢復 FlowState 也失敗')
    }
    await sendMessage(conversationId, io, {
      content: errIsChinese
        ? `生成過程中出現錯誤：${err instanceof Error ? err.message : '未知錯誤'}\n\n你可以點「重試」再試一次。`
        : `Error during generation: ${err instanceof Error ? err.message : 'Unknown error'}\n\nClick "Retry" to try again.`,
      stage: 'error',
      quickReplies: [
        { label: errIsChinese ? '重試' : 'Retry', value: '__retry_fast_build__', style: 'primary' as const },
      ],
    }).catch(msgErr => {
      logger.error({ err: msgErr }, '發送錯誤訊息失敗')
    })
    await db.updateTask(taskId, { status: 'failed' }).catch(() => {})
    // 不再 throw → 阻止 BullMQ 重試
  }
}

/**
 * 完整代碼生成管線：Structure → Animation → RWD → Quality Gate
 * 一氣呵成，中間只發進度訊息，不等用戶確認
 */
