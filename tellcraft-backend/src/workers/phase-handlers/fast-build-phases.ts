// ============================================================
// Fast Build Phase Handler
// 從 orchestrator.ts 提取
// ============================================================

import Redis from 'ioredis'
import * as db from '../../db/client'
import { sanitizeForPreview } from '../../services/code-verify'
import type { FlowState, GeneratedCode, IoEmitter } from '../../types/flow-state'
import {
  generateStructure, generateAnimations, generateRwd, generateAnimationsAndRwd,
  generateTailwindConfig, ensureResponsiveClasses,
  VariantConcept, GeneratedComponent,
} from '../../services/uiux-generation'
import { runQualityGate, autoFixCriticalIssues, autoFixCriticalIssuesRuleBased } from '../../services/quality-gate'
import { evaluateUi, type UiEvaluationIssue } from '../../services/ui-evaluator'
import type { QualityIssue } from '../../services/quality-gate'
import {
  detectDesignTier, inferProductType, inferPages,
  buildDefaultDesignSystem, buildMinimalTemplate,
  inferInteractionHint, getTemplateStyleHint, inferLayoutMode,
  generateFastConcept, expandBriefPrompt,
  buildFastModeCacheKey, pickFirstBatchPages, enforceFastBuildLayoutGuards,
  mergePages,
} from '../../services/fast-build-generation'
import { buildUISpecSummary } from '../../services/bdd-to-ui-spec'
import { sendMessage, saveFlowState, saveFlowStateLight, getFlowState, deleteFlowState, makeStreamingCallback, generatedCodeToFileRows, deductCredits, touchFlowActivity, snapshotCodeToGeneration } from '../orchestrator-utils'
import { CREDIT_COSTS } from '../../config/plans'
import { recommendMoods } from '../../services/design-moods'
import { analyzeUploadedImage, type ReferenceAnalysis } from '../../services/reference-analyzer'
import { z } from 'zod'
import { getEnv } from '../../lib/env'
import { MODEL } from '../../lib/anthropic'
import { callStructured } from '../../lib/structured-output'
import { createLogger } from '../../lib/logger'

const logger = createLogger('fast-build-phases')

type QuickReply = { label: string; value: string; style: 'primary' | 'secondary' | 'ghost' }
export type BatchAuditSeverity = 'none' | 'warning' | 'critical'
export interface BatchAuditResult {
  passed: boolean
  severity: BatchAuditSeverity
  issues: string[]
  shouldRunLlmFallback: boolean
}

function formatFastBuildBatchLabel(pages: string[], locale: 'zh' | 'en'): string {
  if (pages.length === 0) {
    return locale === 'zh' ? '本批頁面' : 'current batch'
  }

  if (pages.length === 1) {
    return pages[0] || (locale === 'zh' ? '本批頁面' : 'current batch')
  }

  return locale === 'zh'
    ? `本批頁面（${pages.join('、')}）`
    : `batch (${pages.join(', ')})`
}

function hasCodeTargets(code: GeneratedCode): boolean {
  return code.pages.length + code.components.length > 0
}

const APP_MARKETING_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  // 注意：flattenBatchText 已預先移除 data-animate="..." 值，避免 "hero-entrance" 等動畫名誤觸發
  { pattern: /\bhero\b|主視覺|hero section/i, label: 'marketing hero' },
  { pattern: /testimonial|testimonials|用戶見證|客戶評價/i, label: 'testimonials' },
  { pattern: /pricing|price plan|價格方案|方案比較/i, label: 'pricing table' },
  { pattern: /newsletter|subscribe|訂閱電子報/i, label: 'newsletter CTA' },
  { pattern: /brand story|our story|品牌故事/i, label: 'brand story' },
]

const WEBSITE_APP_SHELL_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /<aside\b|sidebar|side-nav|border-r|min-h-screen[^`'"]{0,120}flex/i, label: 'sidebar/app shell' },
  { pattern: /command palette|command menu|快捷指令|命令中心/i, label: 'command center' },
  { pattern: /admin table|data table|儀表板|dashboard card|analytics/i, label: 'admin/dashboard framing' },
]

const PAGE_INTENT_RULES: Array<{ pattern: RegExp; requiredSignals: RegExp[]; label: string }> = [
  { pattern: /價格|pricing|plans?/i, requiredSignals: [/pricing|price|monthly|annual|方案|月付|年付/i], label: 'pricing intent' },
  { pattern: /訂房|booking|預約|reservation|掛號/i, requiredSignals: [/booking|reservation|appointment|預約|掛號|入住|日期/i], label: 'booking intent' },
  { pattern: /dashboard|儀表板|主頁面/i, requiredSignals: [/dashboard|chart|table|metric|統計|資料|useState/i], label: 'dashboard/tool intent' },
  { pattern: /商品|products?/i, requiredSignals: [/product|商品|price|加入購物車|cart/i], label: 'product intent' },
]

function flattenBatchText(code: GeneratedCode): string {
  return [...code.pages, ...code.components]
    .map(file => `${file.path}\n${file.content}`)
    .join('\n')
    // 移除 data-animate 屬性值，避免 "hero-entrance" 等動畫名觸發行銷 pattern 誤判
    .replace(/data-animate="[^"]*"/g, '')
    .toLowerCase()
}

function buildBatchManifest(code: GeneratedCode): string {
  return [
    ...code.pages.map(page => `page:${page.path}`),
    ...code.components.map(component => `component:${component.path}`),
  ].join('\n')
}

function buildBatchContentExcerpt(code: GeneratedCode, maxCharsPerFile = 1200): string {
  return [...code.pages, ...code.components]
    .map(file => `## ${file.path}\n${file.content.slice(0, maxCharsPerFile)}`)
    .join('\n\n')
}

export function runFastBuildBatchAudit(input: {
  layoutMode: 'app' | 'website'
  productType: string
  targetPages: string[]
  originalRequirements: string
  batchCode: GeneratedCode
}): BatchAuditResult {
  const issues: string[] = []
  let shouldRunLlmFallback = false
  const text = flattenBatchText(input.batchCode)

  if (input.batchCode.pages.length < input.targetPages.length) {
    issues.push(`missing target pages (${input.batchCode.pages.length}/${input.targetPages.length})`)
    shouldRunLlmFallback = true
  }

  if (input.layoutMode === 'app') {
    for (const rule of APP_MARKETING_PATTERNS) {
      if (rule.pattern.test(text)) {
        issues.push(`app layout contains ${rule.label}`)
      }
    }
  } else {
    const appShellHits = WEBSITE_APP_SHELL_PATTERNS.filter(rule => rule.pattern.test(text))
    if (appShellHits.length >= 2) {
      issues.push(...appShellHits.map(hit => `website layout contains ${hit.label}`))
    } else if (appShellHits.length === 1) {
      shouldRunLlmFallback = true
    }
  }

  for (const targetPage of input.targetPages) {
    for (const rule of PAGE_INTENT_RULES) {
      if (!rule.pattern.test(targetPage)) continue
      if (!rule.requiredSignals.some(signal => signal.test(text))) {
        issues.push(`target page "${targetPage}" is missing ${rule.label}`)
        shouldRunLlmFallback = true
      }
    }
  }

  // 「drifted」只在 contains 問題還沒出現時才補充（避免三重計算同一根因）
  const hasContainsIssue = issues.some(i => i.startsWith('app layout contains'))
  if (!hasContainsIssue && input.layoutMode === 'app') {
    // 排除：原始需求本身就提到行銷元素（中英文同義詞都要查）
    const requirementsHasMarketing = /(hero|主視覺|pricing|testimonial|用戶見證|newsletter|訂閱電子報|brand story|品牌故事)/i.test(input.originalRequirements)
    if (!requirementsHasMarketing && /hero|主視覺|pricing|testimonial|newsletter|brand story/i.test(text)) {
      issues.push('app batch drifted toward marketing-only structure')
    }
  }

  const severity: BatchAuditSeverity =
    issues.length === 0 ? 'none' : issues.some(issue => /contains|drifted|missing target pages/.test(issue)) ? 'critical' : 'warning'

  return {
    passed: severity !== 'critical',
    severity,
    issues,
    shouldRunLlmFallback: severity === 'critical' && shouldRunLlmFallback,
  }
}

export function getRemainingFastBuildPages(state: Pick<FlowState, 'fastMode' | 'fastBuildAllPages' | 'fastBuildCompletedPages'>): string[] {
  if (!state.fastMode) return []
  const completed = new Set(state.fastBuildCompletedPages || [])
  return (state.fastBuildAllPages || []).filter(page => !completed.has(page))
}

export function buildPostDeployFastBuildQuickReplies(
  state: Pick<FlowState, 'fastMode' | 'fastBuildAllPages' | 'fastBuildCompletedPages' | 'locale'>,
  options?: { includeDeploy?: boolean; includeRollback?: boolean; includeNewProject?: boolean },
): QuickReply[] {
  const isChinese = state.locale === 'zh'
  const quickReplies: QuickReply[] = []
  const remainingPages = getRemainingFastBuildPages(state)

  if (remainingPages.length > 0) {
    quickReplies.push({
      label: isChinese ? `繼續生成（${remainingPages.length} 頁）` : `Continue (${remainingPages.length} pages)`,
      value: '__continue_fast_build_after_deploy__',
      style: 'primary',
    })
  }

  if (options?.includeDeploy) {
    quickReplies.push({
      label: isChinese ? '部署上線' : 'Deploy',
      value: '部署',
      style: remainingPages.length > 0 ? 'secondary' : 'primary',
    })
  }

  if (options?.includeRollback) {
    quickReplies.push({
      label: isChinese ? '回滾版本' : 'Rollback',
      value: '回滾',
      style: 'ghost',
    })
  }

  if (options?.includeNewProject) {
    quickReplies.push({
      label: isChinese ? '開始新專案' : 'New Project',
      value: '__new_project__',
      style: 'ghost',
    })
  }

  // 上傳到模板庫
  quickReplies.push({
    label: isChinese ? '上傳到模板庫' : 'Upload as Template',
    value: '__upload_template__',
    style: 'ghost',
  })

  return quickReplies
}

async function runFastBuildBatchAuditLlmFallback(input: {
  layoutMode: 'app' | 'website'
  productType: string
  targetPages: string[]
  originalRequirements: string
  batchCode: GeneratedCode
  issues: string[]
  userId: string
  conversationId: string
}): Promise<BatchAuditResult | null> {
  const systemPrompt = `你是一位嚴格的前端產出審核員。你的任務是判斷「這一批生成的頁面是否偏離原始需求」。

規則：
- 只判斷是否偏題，不要修 code。
- 偏題的情況包括：app/tool 生成成 marketing 官網、website 生成成 admin/app shell、目標頁面意圖明顯缺失。
- 如果只是文案細節不同，但頁面方向正確，判定 passed=true。
- 嚴格輸出 JSON：{"passed":boolean,"severity":"warning|critical","issues":["..."]}`

  const userMessage = `## Original Requirements
${input.originalRequirements}

## Product Context
- productType: ${input.productType}
- layoutMode: ${input.layoutMode}
- targetPages: ${input.targetPages.join(', ')}

## Rule-based Findings
${input.issues.map((issue, index) => `${index + 1}. ${issue}`).join('\n')}

## Batch Manifest
${buildBatchManifest(input.batchCode)}

## Batch Excerpts
${buildBatchContentExcerpt(input.batchCode)}

請只判斷是否偏離需求，輸出 JSON。`

  const BatchAuditSchema = z.object({
    passed: z.boolean(),
    severity: z.enum(['none', 'warning', 'critical']),
    issues: z.array(z.string()),
  })

  const result = await callStructured({
    schema: BatchAuditSchema,
    model: MODEL.SONNET,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 1200,
    temperature: 0,
    purpose: 'fast_build_batch_audit',
    trackingContext: { userId: input.userId, conversationId: input.conversationId },
  })

  if (!result.success) {
    logger.warn({ error: result.error }, 'fast build batch audit fallback 失敗')
    return null
  }

  return {
    passed: result.data.passed,
    severity: result.data.severity,
    issues: result.data.issues.length > 0 ? result.data.issues : input.issues,
    shouldRunLlmFallback: false,
  }
}

// 檢查 pipeline 是否應該中止（用戶已按「完成/部署」，phase 被外部改掉）
async function isPipelineAborted(redis: Redis, conversationId: string): Promise<boolean> {
  const fresh = await getFlowState(redis, conversationId)
  if (!fresh || fresh.phase !== 'fast_generating') {
    logger.warn({ phase: fresh?.phase, conversationId }, 'Pipeline phase changed externally, aborting QG')
    return true
  }
  return false
}

export async function executeFastBuildSkill(params: {
  taskId: string
  projectId: string
  conversationId: string
  userId: string
  message: string
  locale?: 'zh' | 'en'
  imageUrls?: string[]
  redis: Redis
  io: IoEmitter
}) {
  const { taskId, projectId, conversationId, userId, message, locale, imageUrls, redis, io } = params

  try {
  // ── 推斷設計參數（零 LLM 成本）──
  let tier = detectDesignTier(message)
  const productType = inferProductType(message)
  const pages = inferPages(message, productType)
  let designSystem = buildDefaultDesignSystem(tier, productType)
  const template = buildMinimalTemplate(message, productType)

  const layoutMode = inferLayoutMode(productType, message)
  logger.info(`tier=${tier}, type=${productType}, layout=${layoutMode}, pages=[${pages.join(',')}]`)
  const interactionHint = inferInteractionHint(productType)

  // ── 模板風格提示（降級跳過，不影響主流程）──
  let templateStyleHint: string | null = null
  try {
    templateStyleHint = await getTemplateStyleHint(message, productType)
    if (templateStyleHint) logger.info('匹配到模板風格提示')
  } catch (e) {
    logger.warn({ err: e }, '模板風格提示查詢失敗，降級跳過')
  }

  // ── 分析上傳的參考圖片（如有）──
  let referenceAnalysis: ReferenceAnalysis | undefined
  if (imageUrls?.length) {
    referenceAnalysis = await analyzeUploadedImage(imageUrls[0], { userId, conversationId })
      .catch((err) => {
        logger.warn({ err }, '快速模式圖片分析失敗，降級跳過')
        return undefined
      })
    if (referenceAnalysis?.visionAnalysis) {
      logger.info('快速模式參考圖片分析成功')
    }
  }

  // ── 順序執行：先概念生成（取 suggestedPages）→ 合併頁面 → Prompt 擴展 ──
  let variantConcept: VariantConcept | undefined
  let expandedPrompt: string | null = null
  let finalPages = pages
  {
    const palette = designSystem.colorPalette as { primary?: string } | undefined
    const concept = await generateFastConcept(
      message, productType, tier, palette?.primary || '#6366f1',
      { userId, conversationId },
      referenceAnalysis
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
      finalPages = mergePages(pages, concept.suggestedPages, 1)
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
  const firstBatchPages = pickFirstBatchPages(productType, layoutMode, finalPages)
  const fastModeCacheKey = buildFastModeCacheKey(message, productType, finalPages, tier)

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
    fastModeTemplateStyleHint: templateStyleHint || undefined,
    fastModeInteractionHint: interactionHint || undefined,
    fastModeFirstBatchPages: firstBatchPages,
    fastModeCacheKey: fastModeCacheKey,
    uiuxVariantConcept: variantConcept,
    uiuxDesignMood: moodId,
    uiuxReferenceAnalysis: referenceAnalysis,
    uiuxReferenceImageUrls: imageUrls,
    userId,
    // 增量生成欄位
    fastBuildStage: 'generating',
    fastBuildAllPages: finalPages,
    fastBuildCompletedPages: [],
    fastBuildCurrentBatchIndex: 0,
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

  // ── 執行第 1 批 pipeline ──
  await runFastBuildPipeline({
    state,
    targetPages: firstBatchPages,
    conversationId,
    projectId,
    userId,
    redis,
    io,
  })

  await db.updateTask(taskId, { status: 'completed' })
  logger.info(`executeFastBuildSkill 完成（batch 0, ${firstBatchPages.length} pages）`)

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
    await db.updateTask(params.taskId, { status: 'failed' }).catch(() => {})
    // 不再 throw → 阻止 BullMQ 重試
  }
}

// ============================================================
// Pipeline：Structure → Animation → RWD → Quality Gate
// 可被首批和後續批次共用
// ============================================================

export async function runFastBuildPipeline(params: {
  state: FlowState
  targetPages: string[]
  conversationId: string
  projectId: string
  userId: string
  redis: Redis
  io: IoEmitter
}) {
  const { state, targetPages, conversationId, projectId, userId, redis, io } = params
  const isChinese = state.locale === 'zh'
  const designSystem = state.uiuxDesignSystem!
  const tier = state.uiuxDesignTier || 'functional'
  const variantConcept = state.uiuxVariantConcept
  const moodId = state.uiuxDesignMood
  const layoutMode = state.fastModeLayoutMode || 'website'
  const productType = state.fastModeProductType || 'landing'
  const expandedPrompt = state.fastModeExpandedPrompt || state.fastModeOriginalMessage || ''
  const interactionHint = state.fastModeInteractionHint || inferInteractionHint(productType)
  const layoutGuardPrompt = enforceFastBuildLayoutGuards(productType, layoutMode)
  const template = buildMinimalTemplate(expandedPrompt, productType)
  const twConfig = generateTailwindConfig(designSystem)
  const isLaterBatch = (state.fastBuildCurrentBatchIndex || 0) > 0
  const existingCode = isLaterBatch ? state.uiuxGeneratedCode : undefined
  const allPages = state.fastBuildAllPages || []
  const isIncrementalFirstBatch = !isLaterBatch && allPages.length > targetPages.length

  // 構建已有組件路徑摘要（第 2+ 批用）
  const existingComponentSummary = existingCode
    ? buildExistingComponentSummary(existingCode)
    : undefined

  // streaming callback：第 2+ 批需合併已有代碼
  const baseStreamingCallback = makeStreamingCallback(conversationId, io, redis, 'structure', twConfig)
  const structureStreamingCallback = existingCode
    ? (partial: { pages: GeneratedComponent[]; components: GeneratedComponent[]; styles: string }) =>
        baseStreamingCallback({
          pages: [...existingCode.pages, ...partial.pages],
          components: [...existingCode.components, ...partial.components],
          styles: existingCode.styles || partial.styles,
        })
    : baseStreamingCallback

  // 模板風格提示（降級跳過）
  let templateStyleHint: string | null = state.fastModeTemplateStyleHint || null
  if (!templateStyleHint && !isLaterBatch) {
    try {
      templateStyleHint = await getTemplateStyleHint(expandedPrompt, productType)
      if (templateStyleHint) {
        state.fastModeTemplateStyleHint = templateStyleHint
      }
    } catch { /* 降級跳過 */ }
  }

  const structureResult = await generateStructure(
    designSystem,
    targetPages,
    template,
    undefined, // 無 bddSpec
    tier,
    {
      originalRequirements: expandedPrompt,
      variantConcept,
      interactionHint: isLaterBatch ? undefined : interactionHint, // 後續批次不重複注入
      templateStyleHint: templateStyleHint || undefined,
      layoutGuardPrompt,
      layoutMode,
      referenceAnalysis: state.uiuxReferenceAnalysis,
      moodId,
      existingComponentSummary,
      incrementalFirstBatch: isIncrementalFirstBatch,
      generationProfile: 'fast',
    },
    { userId, conversationId, purpose: isLaterBatch ? 'fast-build-structure-batch' : 'fast-build-structure' },
    structureStreamingCallback,
    () => void touchFlowActivity(redis, conversationId),
    // Checkpoint：Structure 生成中途持久化到 FlowState，防止進程崩潰遺失代碼
    async (partial) => {
      const merged = isLaterBatch && existingCode
        ? mergeGeneratedCode(existingCode, { pages: partial.pages, components: partial.components, styles: partial.styles })
        : { pages: partial.pages, components: partial.components, styles: partial.styles }
      state.uiuxGeneratedCode = merged
      await saveFlowState(redis, conversationId, state)
      logger.info({ pages: merged.pages.length, components: merged.components.length }, 'Structure checkpoint saved')
    },
  )

  if (!structureResult.success) {
    logger.error({ err: structureResult.error, batch: state.fastBuildCurrentBatchIndex }, '結構生成失敗')
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

  let currentBatchCode: GeneratedCode = {
    pages: structureResult.pages || [],
    components: structureResult.components || [],
    styles: structureResult.styles || '',
  }

  let batchAudit = runFastBuildBatchAudit({
    layoutMode,
    productType,
    targetPages,
    originalRequirements: expandedPrompt,
    batchCode: currentBatchCode,
  })

  if (!batchAudit.passed && batchAudit.shouldRunLlmFallback) {
    const fallbackAudit = await runFastBuildBatchAuditLlmFallback({
      layoutMode,
      productType,
      targetPages,
      originalRequirements: expandedPrompt,
      batchCode: currentBatchCode,
      issues: batchAudit.issues,
      userId,
      conversationId,
    })
    if (fallbackAudit) {
      batchAudit = fallbackAudit
    }
  }

  logger.info({
    passed: batchAudit.passed,
    severity: batchAudit.severity,
    issues: batchAudit.issues,
    llmFallback: batchAudit.shouldRunLlmFallback,
    batch: state.fastBuildCurrentBatchIndex,
  }, 'fast build batch audit 完成')

  if (!batchAudit.passed) {
    logger.warn({ batchAudit, batch: state.fastBuildCurrentBatchIndex }, 'fast build batch audit 攔截本批生成')
    state.phase = 'fast_generating'
    state.uiuxCodeGenerationStartedAt = undefined
    state.waitingForReply = true
    await saveFlowState(redis, conversationId, state)
    await sendMessage(conversationId, io, {
      content: isChinese
        ? `本批頁面生成結果偏離原始需求，已中止後續動畫與響應式處理以避免浪費 token。\n\n問題：${batchAudit.issues.join('；')}\n\n你可以點「重試」重新生成，或調整描述後再試。`
        : `This batch drifted from the original requirements, so animation/RWD were stopped to avoid wasting tokens.\n\nIssues: ${batchAudit.issues.join('; ')}\n\nYou can retry or adjust the prompt and try again.`,
      stage: 'error',
      quickReplies: [
        { label: isChinese ? '重試' : 'Retry', value: '__retry_fast_build__', style: 'primary' as const },
      ],
    })
    return
  }

  let currentCode: GeneratedCode = currentBatchCode

  // 第 2+ 批：合併到已有代碼
  if (isLaterBatch && existingCode) {
    currentCode = mergeGeneratedCode(existingCode, currentCode)
  }

  // ── Structure 中途存檔 ──
  state.uiuxGeneratedCode = currentCode
  state.uiuxStructureCode = isLaterBatch ? state.uiuxStructureCode : currentCode
  state.uiuxCodePhase = 'animation'
  state.uiuxCodeGenerationStartedAt = Date.now()
  await saveFlowState(redis, conversationId, state)
  if (projectId) {
    await db.upsertProjectFiles(projectId, 'uiux',
      generatedCodeToFileRows(currentCode, designSystem))
  }

  const fastUiSpecSummary = state.uiuxUISpec ? buildUISpecSummary(state.uiuxUISpec)
    : (interactionHint ? `產品互動概覽：\n${interactionHint}` : undefined)

  // ===== 階段 2：動畫 + 響應式（合併模式 or 分離模式）=====
  const useMergedAnimRwd = getEnv().FAST_BUILD_MERGED_ANIM_RWD && !isLaterBatch

  if (useMergedAnimRwd) {
    // ── 合併模式：Animation + RWD 一次完成（省 1 次 Sonnet 往返）──
    await sendMessage(conversationId, io, {
      content: isChinese ? '結構生成完成，正在添加動畫和響應式...' : 'Structure done, adding animations and responsive design...',
      stage: 'fast_generating',
      progress: { current: 2, total: 2, step: isChinese ? '動畫 + 響應式' : 'Animations + RWD' },
      richContent: {
        type: 'fast_build_progress' as const,
        data: { phase: 'animation', progress: { current: 2, total: 2, step: isChinese ? '動畫 + 響應式' : 'Animations + RWD' }, estimatedSecondsRemaining: 90 } as unknown as Record<string, unknown>,
      },
    })

    const mergedStreamingCallback = makeStreamingCallback(conversationId, io, redis, 'animation', twConfig)

    const mergedResult = await generateAnimationsAndRwd(
      designSystem,
      currentCode,
      tier,
      { userId, conversationId, purpose: 'fast-build-animation-rwd-merged' },
      mergedStreamingCallback,
      variantConcept,
      fastUiSpecSummary,
      layoutMode,
      moodId,
      undefined,
      'fast',
    )

    if (mergedResult.success) {
      currentCode = {
        pages: mergedResult.pages || currentCode.pages,
        components: mergedResult.components || currentCode.components,
        styles: mergedResult.styles || currentCode.styles,
      }
    } else {
      logger.warn({ err: mergedResult.error }, 'Animation+RWD 合併生成失敗，套用 ensureResponsiveClasses')
      const fixed = ensureResponsiveClasses(currentCode.pages, currentCode.components)
      currentCode.pages = fixed.pages
      currentCode.components = fixed.components
    }

    // 存檔（合併模式統一存）
    state.uiuxGeneratedCode = currentCode
    state.uiuxAnimationCode = currentCode  // redo 回退用
    state.uiuxCodePhase = 'rwd'  // 標記已完成
    state.uiuxCodeGenerationStartedAt = Date.now()
    await saveFlowState(redis, conversationId, state)
    if (projectId) {
      await db.upsertProjectFiles(projectId, 'uiux',
        generatedCodeToFileRows(currentCode, designSystem))
    }
  } else {
    // ── 分離模式（預設）：Animation 和 RWD 分開 ──

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

    // 第 2+ 批：只傳新增檔案給 animation（減少 ~60% token）
    const animInput = (isLaterBatch && existingCode)
      ? buildIncrementalCode(currentCode, existingCode)
      : currentCode

    const animStreamingBase = makeStreamingCallback(conversationId, io, redis, 'animation', twConfig)
    const animStreamingCallback = (isLaterBatch && existingCode)
      ? (partial: { pages: GeneratedComponent[]; components: GeneratedComponent[]; styles: string }) => {
          // 合併：已有檔案（不變）+ partial 新增檔案
          const existingPagePaths = new Set(existingCode.pages.map(p => p.path))
          const existingCompPaths = new Set(existingCode.components.map(c => c.path))
          animStreamingBase({
            pages: [
              ...currentCode.pages.filter(p => existingPagePaths.has(p.path) || !partial.pages.some(pp => pp.path === p.path)),
              ...partial.pages,
            ],
            components: [
              ...currentCode.components.filter(c => existingCompPaths.has(c.path) || !partial.components.some(pc => pc.path === c.path)),
              ...partial.components,
            ],
            styles: currentCode.styles || partial.styles,
          })
        }
      : animStreamingBase

    if (hasCodeTargets(animInput)) {
      const animationResult = await generateAnimations(
        designSystem,
        animInput,
        tier,
        { userId, conversationId, purpose: isLaterBatch ? 'fast-build-animation-batch' : 'fast-build-animation' },
        animStreamingCallback,
        variantConcept,
        fastUiSpecSummary,
        moodId,
        isLaterBatch ? { maxTokens: calcIncrementalMaxTokens(animInput), maxContinuations: 1 } : undefined,
        'fast',
      )

      if (animationResult.success) {
        if (isLaterBatch && existingCode) {
          // 增量合併：只覆蓋新增檔案的動畫版本，保留已有檔案不變
          currentCode = mergeGeneratedCode(currentCode, {
            pages: animationResult.pages || [],
            components: animationResult.components || [],
            styles: animationResult.styles || currentCode.styles,
          })
        } else {
          currentCode = {
            pages: animationResult.pages || currentCode.pages,
            components: animationResult.components || currentCode.components,
            styles: animationResult.styles || currentCode.styles,
          }
        }
      } else {
        logger.warn({ err: animationResult.error }, '動畫生成失敗，使用結構代碼繼續')
      }
    } else {
      logger.info({ batch: state.fastBuildCurrentBatchIndex }, '動畫階段跳過：無新增檔案目標')
    }

    // ── Animation 中途存檔 ──
    state.uiuxGeneratedCode = currentCode
    state.uiuxAnimationCode = isLaterBatch ? state.uiuxAnimationCode : currentCode
    state.uiuxCodePhase = 'rwd'
    state.uiuxCodeGenerationStartedAt = Date.now()
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

    // 第 2+ 批：只傳新增檔案給 RWD
    const rwdInput = (isLaterBatch && existingCode)
      ? buildIncrementalCode(currentCode, existingCode)
      : currentCode

    const rwdStreamingBase = makeStreamingCallback(conversationId, io, redis, 'rwd', twConfig)
    const rwdStreamingCallback = (isLaterBatch && existingCode)
      ? (partial: { pages: GeneratedComponent[]; components: GeneratedComponent[]; styles: string }) => {
          const existingPagePaths = new Set(existingCode.pages.map(p => p.path))
          const existingCompPaths = new Set(existingCode.components.map(c => c.path))
          rwdStreamingBase({
            pages: [
              ...currentCode.pages.filter(p => existingPagePaths.has(p.path) || !partial.pages.some(pp => pp.path === p.path)),
              ...partial.pages,
            ],
            components: [
              ...currentCode.components.filter(c => existingCompPaths.has(c.path) || !partial.components.some(pc => pc.path === c.path)),
              ...partial.components,
            ],
            styles: currentCode.styles || partial.styles,
          })
        }
      : rwdStreamingBase

    if (hasCodeTargets(rwdInput)) {
      const rwdResult = await generateRwd(
        designSystem,
        rwdInput,
        tier,
        { userId, conversationId, purpose: isLaterBatch ? 'fast-build-rwd-batch' : 'fast-build-rwd' },
        rwdStreamingCallback,
        variantConcept,
        fastUiSpecSummary,
        layoutMode,
        moodId,
        isLaterBatch ? { maxTokens: calcIncrementalMaxTokens(rwdInput), maxContinuations: 1 } : undefined,
        'fast',
      )

      if (rwdResult.success) {
        if (isLaterBatch && existingCode) {
          currentCode = mergeGeneratedCode(currentCode, {
            pages: rwdResult.pages || [],
            components: rwdResult.components || [],
            styles: rwdResult.styles || currentCode.styles,
          })
        } else {
          currentCode = {
            pages: rwdResult.pages || currentCode.pages,
            components: rwdResult.components || currentCode.components,
            styles: rwdResult.styles || currentCode.styles,
          }
        }
      } else {
        logger.warn({ err: rwdResult.error }, 'RWD 生成失敗，套用 ensureResponsiveClasses')
        const fixed = ensureResponsiveClasses(currentCode.pages, currentCode.components)
        currentCode.pages = fixed.pages
        currentCode.components = fixed.components
      }
    } else {
      logger.info({ batch: state.fastBuildCurrentBatchIndex }, 'RWD 階段跳過：無新增檔案目標')
    }
  } // end of 分離模式

  // ===== Quality Gate（靜態檢查 + 最多 2 輪 LLM 修復）=====
  // 先確認用戶尚未按「完成/部署」讓 phase 被外部改掉
  if (await isPipelineAborted(redis, conversationId)) return

  let report = runQualityGate(currentCode, tier, state.uiuxDesignMood)
  logger.info(`QG: passed=${report.passed}, critical=${report.summary.critical}, warning=${report.summary.warning}`)

  const FAST_QG_MAX_ATTEMPTS = 2
  for (let attempt = 0; attempt < FAST_QG_MAX_ATTEMPTS && !report.passed; attempt++) {
    // 每輪修復前再確認是否被中止
    if (await isPipelineAborted(redis, conversationId)) return

    let criticalIssues = [
      ...report.categories.a11y.issues,
      ...report.categories.performance.issues,
      ...report.categories.code_quality.issues,
    ].filter(i => i.severity === 'critical')
    if (criticalIssues.length === 0) break

    logger.info(`QG 第 ${attempt + 1} 輪修復：${criticalIssues.length} 個 critical`)
    try {
      const qgTrackingContext = { userId, conversationId, projectId: state.projectId }
      const ruleFixed = autoFixCriticalIssuesRuleBased(currentCode, criticalIssues, qgTrackingContext)
      if (ruleFixed) {
        currentCode = ruleFixed
        report = runQualityGate(currentCode, tier, state.uiuxDesignMood)
        criticalIssues = [
          ...report.categories.a11y.issues,
          ...report.categories.performance.issues,
          ...report.categories.code_quality.issues,
        ].filter(i => i.severity === 'critical')
        if (criticalIssues.length === 0) break
      }

      const fixed = await autoFixCriticalIssues(currentCode, criticalIssues, qgTrackingContext)
      if (!fixed) break
      currentCode = fixed
      report = runQualityGate(currentCode, tier, state.uiuxDesignMood)
      logger.info(`QG 修復後: passed=${report.passed}, critical=${report.summary.critical}`)
    } catch (qgErr) {
      logger.warn({ err: qgErr }, 'QG 修復失敗，跳過')
      break
    }
  }

  // ===== 黑盒 Evaluator（PR1，1 輪，成本考量）=====
  // 只在最後一批執行（所有頁面都到齊才有意義）
  const candidateCompletedPages = [...(state.fastBuildCompletedPages || []), ...targetPages]
  const remainingAfterThis = allPages.filter(p => !candidateCompletedPages.includes(p))
  if (remainingAfterThis.length === 0 && getEnv().ENABLE_UI_EVALUATOR) {
    try {
      const evalResult = await evaluateUi({
        code: currentCode,
        tailwindConfig: generateTailwindConfig(designSystem),
        tier,
        trackingContext: { userId: state.userId ?? undefined, conversationId },
      })
      if (!evalResult.softFail && !evalResult.report.passed) {
        const evalIssues = evalResult.report.issues.filter(i => i.severity === 'critical')
        if (evalIssues.length > 0) {
          const qualityIssues: QualityIssue[] = evalIssues.map((i: UiEvaluationIssue, idx: number) => ({
            id: `eval-fast-${idx}`,
            category: 'code_quality',
            severity: 'critical',
            rule: `evaluator_${i.category}`,
            message: `[Evaluator] ${i.description}（路由 ${i.route}）`,
            file: i.route,
            suggestion: '請從使用者視角修復此問題',
          }))
          const evalFixed = await autoFixCriticalIssues(currentCode, qualityIssues, { userId: state.userId, conversationId, projectId: state.projectId })
          if (evalFixed) currentCode = evalFixed
        }
      }
    } catch (evalErr) {
      logger.warn({ err: evalErr }, 'Fast Build Evaluator 失敗，跳過')
    }
  }

  // ── 更新已完成頁面 ──
  const completedPages = [...(state.fastBuildCompletedPages || []), ...targetPages]
  state.fastBuildCompletedPages = completedPages
  state.uiuxGeneratedCode = currentCode
  state.uiuxQualityReport = report

  // ── 判斷是否還有剩餘頁面 ──
  const remainingPages = allPages.filter(p => !completedPages.includes(p))

  // 從 Redis 重讀 pendingFinish 旗標，防止 Worker 用舊 in-memory state 漏判
  const freshState = await getFlowState(redis, conversationId)
  const pendingFinish = state.fastBuildPendingFinish || freshState?.fastBuildPendingFinish
  if (pendingFinish) {
    state.fastBuildPendingFinish = true // 同步進 in-memory 以便後續邏輯一致
  }

  if (remainingPages.length > 0 && !pendingFinish) {
    // 有剩餘頁面 → 暫停，等用戶確認（除非用戶已要求直接完成）
    state.fastBuildStage = 'awaiting_continue'
    state.waitingForReply = true
    state.uiuxCodeGenerationStartedAt = undefined
    state.uiuxCodePhase = 'complete' // 當前批次完成
    await saveFlowState(redis, conversationId, state)

    if (projectId) {
      await db.upsertProjectFiles(projectId, 'uiux',
        generatedCodeToFileRows(currentCode, designSystem))
    }
    await redis.del(`streaming:preview:${conversationId}`).catch(() => {})

    const pageCount = currentCode.pages.length
    const compCount = currentCode.components.length
    const conceptNote = variantConcept
      ? (isChinese ? `\n設計概念：**${variantConcept.name}**` : `\nDesign concept: **${variantConcept.name}**`)
      : ''
    const qgText = report.passed && report.summary.warning === 0
      ? ''
      : report.passed
        ? (isChinese ? `\n品質檢查通過（${report.summary.warning} 個建議項）。` : `\nQuality check passed (${report.summary.warning} suggestions).`)
        : (isChinese ? `\n品質檢查：${report.summary.critical} 個問題、${report.summary.warning} 個建議。` : `\nQuality check: ${report.summary.critical} issues, ${report.summary.warning} suggestions.`)

    const remainingLabel = remainingPages.join(isChinese ? '、' : ', ')

    const completedLabel = formatFastBuildBatchLabel(targetPages, state.locale || 'zh')
    await sendMessage(conversationId, io, {
      content: isChinese
        ? `${completedLabel}生成完成！${pageCount} 個頁面、${compCount} 個組件。${conceptNote}${qgText}\n\n還有 ${remainingPages.length} 個頁面待生成：${remainingLabel}`
        : `${completedLabel} generated! ${pageCount} pages, ${compCount} components.${conceptNote}${qgText}\n\n${remainingPages.length} more page(s) to generate: ${remainingLabel}`,
      stage: 'fast_generating',
      layoutHint: 'split',
      richContent: {
        type: 'code_preview',
        data: {
          pages: currentCode.pages,
          components: currentCode.components,
          styles: currentCode.styles,
          tailwindConfig: twConfig,
          currentPhase: 'partial_complete',
        } as Record<string, unknown>,
      },
      quickReplies: [
        { label: isChinese ? `繼續生成（${remainingPages.length} 頁）` : `Continue (${remainingPages.length} pages)`, value: '__continue_fast_build__', style: 'primary' },
        { label: isChinese ? '就這樣，部署' : 'Deploy as-is', value: '__finish_fast_build__', style: 'secondary' },
      ],
    })

    // Credit 扣除：首批完成時先扣
    if ((state.fastBuildCurrentBatchIndex || 0) === 0) {
      await deductCredits(userId, CREDIT_COSTS.FAST_BUILD - CREDIT_COSTS.BASE_MESSAGE)
    }

    logger.info(`Pipeline batch ${state.fastBuildCurrentBatchIndex} 完成，暫停等待用戶（剩 ${remainingPages.length} 頁）`)
    return
  }

  // ── 所有頁面生成完成（包含 pendingFinish 提前結束）──
  state.uiuxCodePhase = 'complete'
  state.phase = 'uiux_complete'
  state.fastBuildStage = 'complete'
  state.waitingForReply = false
  state.uiuxCodeGenerationStartedAt = undefined
  state.fastBuildPendingFinish = undefined
  await saveFlowState(redis, conversationId, state)

  // Credit 扣除（≤1 頁的情況在這裡扣，>1 頁首批已扣）
  if ((state.fastBuildCurrentBatchIndex || 0) === 0) {
    await deductCredits(userId, CREDIT_COSTS.FAST_BUILD - CREDIT_COSTS.BASE_MESSAGE)
  }

  if (projectId) {
    await db.upsertProjectFiles(projectId, 'uiux',
      generatedCodeToFileRows(currentCode, designSystem))
    await snapshotCodeToGeneration(projectId, {
      changeSummary: '快速建站完成',
      conversationId,
    })
  }
  await redis.del(`streaming:preview:${conversationId}`).catch(() => {})

  await sendFastBuildCompleteMessage(conversationId, state, io, redis)
  logger.info(`Pipeline 全部完成: ${currentCode.pages.length} pages, ${currentCode.components.length} components`)
}

// ============================================================
// 完成訊息（供 pipeline 完成和 __finish_fast_build__ 共用）
// ============================================================

export async function sendFastBuildCompleteMessage(
  conversationId: string,
  state: FlowState,
  io: IoEmitter,
  redis: Redis,
) {
  const isChinese = state.locale === 'zh'
  const currentCode = state.uiuxGeneratedCode
  if (!currentCode) return

  const designSystem = state.uiuxDesignSystem
  const twConfig = designSystem ? generateTailwindConfig(designSystem) : ''
  const variantConcept = state.uiuxVariantConcept
  const report = state.uiuxQualityReport
  const remainingPages = getRemainingFastBuildPages(state)

  const finalPageCount = currentCode.pages.length
  const finalComponentCount = currentCode.components.length

  const qgText = !report
    ? ''
    : report.passed && report.summary.warning === 0
      ? ''
      : report.passed
        ? (isChinese ? `\n品質檢查通過（${report.summary.warning} 個建議項）。` : `\nQuality check passed (${report.summary.warning} suggestions).`)
        : (isChinese ? `\n品質檢查：${report.summary.critical} 個問題、${report.summary.warning} 個建議。` : `\nQuality check: ${report.summary.critical} issues, ${report.summary.warning} suggestions.`)

  const conceptNote = variantConcept
    ? (isChinese ? `\n設計概念：**${variantConcept.name}**` : `\nDesign concept: **${variantConcept.name}**`)
    : ''

  const continuationNote = remainingPages.length > 0
    ? (isChinese
        ? `\n\n目前先上線的是已完成頁面；還有 ${remainingPages.length} 個頁面可繼續生成：${remainingPages.join('、')}`
        : `\n\nThe currently deployed-ready set only includes completed pages; ${remainingPages.length} more page(s) can still be generated: ${remainingPages.join(', ')}`)
    : ''

  await sendMessage(conversationId, io, {
    content: isChinese
      ? `快速生成完成！共 ${finalPageCount} 個頁面、${finalComponentCount} 個組件。${conceptNote}${qgText}${continuationNote}\n\n你可以：\n- 直接說想修改的地方，AI 會幫你調整\n- 輸入「**部署**」即可上線`
      : `Generation complete! ${finalPageCount} pages, ${finalComponentCount} components.${conceptNote}${qgText}${continuationNote}\n\nYou can:\n- Describe changes and AI will adjust\n- Type "**deploy**" to go live`,
    stage: 'uiux_generation_complete',
    progress: { current: 3, total: 3, step: isChinese ? '完成' : 'Done' },
    layoutHint: 'split',
    richContent: {
      type: 'code_preview',
      data: (() => {
        const s = sanitizeForPreview({ pages: currentCode.pages, components: currentCode.components, styles: currentCode.styles })
        return { pages: s.code.pages, components: s.code.components, styles: s.code.styles, tailwindConfig: twConfig, currentPhase: 'complete' }
      })() as Record<string, unknown>,
    },
    quickReplies: buildPostDeployFastBuildQuickReplies(state, { includeDeploy: true }),
  })
}

// ============================================================
// 管線恢復：從中斷的階段跑剩餘管線
// ============================================================

export async function resumeFastBuildPipeline(params: {
  state: FlowState
  conversationId: string
  projectId: string
  userId: string
  redis: Redis
  io: IoEmitter
}) {
  const { state, conversationId, projectId, userId, redis, io } = params
  const isChinese = state.locale === 'zh'
  const designSystem = state.uiuxDesignSystem!
  const tier = state.uiuxDesignTier || 'functional'
  const variantConcept = state.uiuxVariantConcept
  const moodId = state.uiuxDesignMood
  const layoutMode = state.fastModeLayoutMode || 'website'
  const productType = state.fastModeProductType || 'landing'
  const twConfig = generateTailwindConfig(designSystem)
  const codePhase = state.uiuxCodePhase || 'structure'
  let currentCode = state.uiuxGeneratedCode!

  const interactionHint = state.fastModeInteractionHint || inferInteractionHint(productType)
  const fastUiSpecSummary = state.uiuxUISpec ? buildUISpecSummary(state.uiuxUISpec)
    : (interactionHint ? `產品互動概覽：\n${interactionHint}` : undefined)

  try {
    // ── 恢復 Animation（如果中斷在 animation 階段）──
    if (codePhase === 'animation') {
      await sendMessage(conversationId, io, {
        content: isChinese ? '正在恢復動畫生成...' : 'Resuming animation generation...',
        stage: 'fast_generating',
        progress: { current: 2, total: 3, step: isChinese ? '添加動畫' : 'Adding animations' },
        richContent: {
          type: 'fast_build_progress' as const,
          data: { phase: 'animation', progress: { current: 2, total: 3, step: isChinese ? '添加動畫' : 'Adding animations' }, estimatedSecondsRemaining: 120 } as unknown as Record<string, unknown>,
        },
      })

      const animStreamingCallback = makeStreamingCallback(conversationId, io, redis, 'animation', twConfig)
      const animationResult = await generateAnimations(
        designSystem,
        currentCode,
        tier,
        { userId, conversationId, purpose: 'fast-build-animation-resume' },
        animStreamingCallback,
      variantConcept,
      fastUiSpecSummary,
      moodId,
      undefined,
      'fast',
    )

      if (animationResult.success) {
        currentCode = {
          pages: animationResult.pages || currentCode.pages,
          components: animationResult.components || currentCode.components,
          styles: animationResult.styles || currentCode.styles,
        }
      } else {
        logger.warn({ err: animationResult.error }, '恢復 Animation 失敗，使用現有代碼繼續')
      }

      // Animation 存檔
      state.uiuxGeneratedCode = currentCode
      state.uiuxAnimationCode = currentCode
      state.uiuxCodePhase = 'rwd'
      state.uiuxCodeGenerationStartedAt = Date.now()
      await saveFlowState(redis, conversationId, state)
      if (projectId) {
        await db.upsertProjectFiles(projectId, 'uiux',
          generatedCodeToFileRows(currentCode, designSystem))
      }
    }

    // ── RWD（animation 恢復後或直接從 rwd 恢復）──
    await sendMessage(conversationId, io, {
      content: isChinese ? '正在優化響應式佈局...' : 'Optimizing responsive layout...',
      stage: 'fast_generating',
      progress: { current: 3, total: 3, step: isChinese ? '響應式優化' : 'Responsive optimization' },
      richContent: {
        type: 'fast_build_progress' as const,
        data: { phase: 'rwd', progress: { current: 3, total: 3, step: isChinese ? '響應式優化' : 'Responsive optimization' }, estimatedSecondsRemaining: 60 } as unknown as Record<string, unknown>,
      },
    })

    const rwdStreamingCallback = makeStreamingCallback(conversationId, io, redis, 'rwd', twConfig)
    const rwdResult = await generateRwd(
      designSystem,
      currentCode,
      tier,
      { userId, conversationId, purpose: 'fast-build-rwd-resume' },
      rwdStreamingCallback,
      variantConcept,
      fastUiSpecSummary,
      layoutMode,
      moodId,
      undefined,
      'fast',
    )

    if (rwdResult.success) {
      currentCode = {
        pages: rwdResult.pages || currentCode.pages,
        components: rwdResult.components || currentCode.components,
        styles: rwdResult.styles || currentCode.styles,
      }
    } else {
      logger.warn({ err: rwdResult.error }, '恢復 RWD 失敗，套用 ensureResponsiveClasses')
      const fixed = ensureResponsiveClasses(currentCode.pages, currentCode.components)
      currentCode.pages = fixed.pages
      currentCode.components = fixed.components
    }

    // ── Quality Gate ──
    if (await isPipelineAborted(redis, conversationId)) return

    let report = runQualityGate(currentCode, tier, state.uiuxDesignMood)
    logger.info(`恢復 QG: passed=${report.passed}, critical=${report.summary.critical}`)

    for (let attempt = 0; attempt < 2 && !report.passed; attempt++) {
      if (await isPipelineAborted(redis, conversationId)) return

      let criticalIssues = [
        ...report.categories.a11y.issues,
        ...report.categories.performance.issues,
        ...report.categories.code_quality.issues,
      ].filter(i => i.severity === 'critical')
      if (criticalIssues.length === 0) break

      try {
        const qgTrackingContextRecovery = { userId, conversationId, projectId: state.projectId }
        const ruleFixed = autoFixCriticalIssuesRuleBased(currentCode, criticalIssues, qgTrackingContextRecovery)
        if (ruleFixed) {
          currentCode = ruleFixed
          report = runQualityGate(currentCode, tier, state.uiuxDesignMood)
          criticalIssues = [
            ...report.categories.a11y.issues,
            ...report.categories.performance.issues,
            ...report.categories.code_quality.issues,
          ].filter(i => i.severity === 'critical')
          if (criticalIssues.length === 0) break
        }

        const fixed = await autoFixCriticalIssues(currentCode, criticalIssues, qgTrackingContextRecovery)
        if (!fixed) break
        currentCode = fixed
        report = runQualityGate(currentCode, tier, state.uiuxDesignMood)
      } catch (qgErr) {
        logger.warn({ err: qgErr }, '恢復 QG 修復失敗，跳過')
        break
      }
    }

    // ── 完成 ──
    state.uiuxGeneratedCode = currentCode
    state.uiuxQualityReport = report
    state.uiuxCodePhase = 'complete'
    state.phase = 'uiux_complete'
    state.fastBuildStage = 'complete'
    state.waitingForReply = false
    state.uiuxCodeGenerationStartedAt = undefined
    await saveFlowState(redis, conversationId, state)

    if (projectId) {
      await db.upsertProjectFiles(projectId, 'uiux',
        generatedCodeToFileRows(currentCode, designSystem))
    }
    await redis.del(`streaming:preview:${conversationId}`).catch(() => {})

    await sendFastBuildCompleteMessage(conversationId, state, io, redis)
    logger.info(`管線恢復完成: ${currentCode.pages.length} pages, ${currentCode.components.length} components`)
  } catch (err) {
    // 恢復失敗 → 保留已有代碼轉 uiux_complete
    logger.error({ err }, '管線恢復失敗，保留已有代碼')
    state.uiuxGeneratedCode = currentCode
    state.phase = 'uiux_complete'
    state.uiuxCodePhase = 'complete'
    state.waitingForReply = false
    state.uiuxCodeGenerationStartedAt = undefined
    await saveFlowState(redis, conversationId, state)

    if (projectId) {
      await db.upsertProjectFiles(projectId, 'uiux',
        generatedCodeToFileRows(currentCode, designSystem)).catch(() => {})
    }

    await sendFastBuildCompleteMessage(conversationId, state, io, redis)
  }
}

// ============================================================
// 純函數：合併已有代碼和新批次
// ============================================================

export function mergeGeneratedCode(existing: GeneratedCode, newBatch: GeneratedCode): GeneratedCode {
  // pages 按 path 去重（新批次覆蓋同路徑）
  const pageMap = new Map<string, GeneratedComponent>()
  for (const p of existing.pages) pageMap.set(p.path, p)
  for (const p of newBatch.pages) pageMap.set(p.path, p)

  // components 按 path 去重（新批次覆蓋同路徑）
  const compMap = new Map<string, GeneratedComponent>()
  for (const c of existing.components) compMap.set(c.path, c)
  for (const c of newBatch.components) compMap.set(c.path, c)

  return {
    pages: Array.from(pageMap.values()),
    components: Array.from(compMap.values()),
    styles: existing.styles || newBatch.styles, // 保留首批的 styles
  }
}

// ============================================================
// 純函數：構建已有組件路徑摘要（供 prompt 告訴 LLM 可 import）
// ============================================================

export function buildExistingComponentSummary(code: GeneratedCode): string {
  const paths: string[] = []
  for (const p of code.pages) paths.push(p.path)
  for (const c of code.components) paths.push(c.path)
  return paths.join('\n')
}

// ============================================================
// 純函數：構建增量代碼（只包含本批新增的檔案）
// 用於第 2+ 批 animation/rwd，避免重新處理第 1 批已完成的
// ============================================================

function buildIncrementalCode(
  currentBatchCode: GeneratedCode,
  existingCode: GeneratedCode,
): GeneratedCode {
  const existingPagePaths = new Set(existingCode.pages.map(p => p.path))
  const existingCompPaths = new Set(existingCode.components.map(c => c.path))

  return {
    pages: currentBatchCode.pages.filter(p => !existingPagePaths.has(p.path)),
    components: currentBatchCode.components.filter(c => !existingCompPaths.has(c.path)),
    styles: currentBatchCode.styles, // styles 傳入供參考但 LLM 不需重新輸出
  }
}

function calcIncrementalMaxTokens(code: GeneratedCode): number {
  const fileCount = code.pages.length + code.components.length
  // 每個檔案 ~4096 token 輸出，下限 8192，上限 32768
  return Math.min(32768, Math.max(8192, fileCount * 4096))
}
