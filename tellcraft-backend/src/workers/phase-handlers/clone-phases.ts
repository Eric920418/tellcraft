/**
 * Clone Skill Phase Handler
 * 網站復刻：URL / 圖片 / URL+圖片 → 分析 → 生成 → QG → 預覽
 *
 * 三種模式：
 * - url:        有 URL 無圖片 → Puppeteer 提取 → 逐 section 生成
 * - hybrid:     有 URL + 圖片 → Puppeteer 提取 + 圖片 Vision 分析注入參考
 * - image_only: 無 URL + 有圖片 → 每張圖生成一個完整 page
 */

import type Redis from 'ioredis'
import type { Server as SocketIOServer } from 'socket.io'
import type { FlowState } from '../../types/flow-state'
import type { GeneratedCode } from '../../types/flow-state'
import { sendMessage, saveFlowState } from '../orchestrator-utils'
import {
  extractPageForClone, generateSectionCode, assembleSections, toSectionMetas,
  analyzeCloneImages, generatePageFromImage, assembleImagePages, mergeImageDesignSystems,
  type CloneImageAnalysis,
} from '../../services/web-clone-service'
import { runQualityGate, autoFixCriticalIssuesRuleBased, autoFixCriticalIssues } from '../../services/quality-gate'
import { createLogger } from '../../lib/logger'

const logger = createLogger('clone-phases')

// Semaphore 控制並行 Sonnet Vision 數量
class Semaphore {
  private queue: Array<() => void> = []
  private running = 0
  constructor(private max: number) {}
  async acquire(): Promise<void> {
    if (this.running < this.max) { this.running++; return }
    return new Promise(resolve => this.queue.push(resolve))
  }
  release(): void {
    this.running--
    const next = this.queue.shift()
    if (next) { this.running++; next() }
  }
}

const CLONE_QG_MAX_ATTEMPTS = 2

export async function executeCloneSkill(params: {
  projectId: string
  conversationId: string
  userId: string
  url?: string
  imageUrls?: string[]
  locale?: 'zh' | 'en'
  redis: Redis
  io: SocketIOServer
}): Promise<void> {
  const { projectId, conversationId, userId, url, imageUrls, locale, redis, io } = params
  const isChinese = locale === 'zh' || /[\u4e00-\u9fff\u3400-\u4dbf]/.test(url || '')

  // 分流：url / hybrid / image_only
  if (url) {
    const inputMode = (imageUrls && imageUrls.length > 0) ? 'hybrid' : 'url'
    await hybridCloneFlow({ projectId, conversationId, userId, url, imageUrls, inputMode, locale, isChinese, redis, io })
  } else if (imageUrls && imageUrls.length > 0) {
    await imageOnlyCloneFlow({ projectId, conversationId, userId, imageUrls, locale, isChinese, redis, io })
  } else {
    // 不應到達（orchestrator 已攔截），但防禦性處理
    await sendMessage(conversationId, io, {
      content: isChinese ? '請輸入網址或上傳截圖。' : 'Please enter a URL or upload screenshots.',
      stage: 'clone_analyzing' as const,
    })
  }
}

// ============================================================
// Hybrid / URL Mode
// ============================================================

async function hybridCloneFlow(params: {
  projectId: string; conversationId: string; userId: string
  url: string; imageUrls?: string[]; inputMode: 'url' | 'hybrid'
  locale?: 'zh' | 'en'; isChinese: boolean; redis: Redis; io: SocketIOServer
}): Promise<void> {
  const { projectId, conversationId, userId, url, imageUrls, inputMode, locale, isChinese, redis, io } = params

  // ── Phase 1: 分析 ──
  const state: FlowState = {
    phase: 'clone_analyzing',
    projectId,
    userId,
    currentRound: 0,
    questionIndex: 0,
    batchCount: 0,
    totalQuestionsAsked: 0,
    waitingForReply: false,
    cloneMode: true,
    cloneSourceUrl: url,
    cloneInputMode: inputMode,
    cloneImageUrls: imageUrls,
    cloneAnalyzingStartedAt: Date.now(),
    locale,
  }
  await saveFlowState(redis, conversationId, state)

  await sendMessage(conversationId, io, {
    content: isChinese
      ? `正在分析 **${url}** 的設計結構...${inputMode === 'hybrid' ? `（同時分析 ${imageUrls!.length} 張參考圖片）` : ''}`
      : `Analyzing design structure of **${url}**...${inputMode === 'hybrid' ? ` (also analyzing ${imageUrls!.length} reference images)` : ''}`,
    stage: 'clone_analyzing' as const,
    richContent: {
      type: 'clone_progress' as const,
      data: { phase: 'analyzing', totalSections: 0, completedSections: 0, estimatedSecondsRemaining: 120 },
    },
  })

  // 並行：Puppeteer 提取 + 圖片分析（如有）
  let analysis
  let imageAnalyses: CloneImageAnalysis[] | undefined
  const trackingContext = { userId, conversationId }

  try {
    const promises: [Promise<Awaited<ReturnType<typeof extractPageForClone>>>, Promise<CloneImageAnalysis[]>?] = [
      extractPageForClone(url),
    ]
    if (inputMode === 'hybrid' && imageUrls?.length) {
      promises.push(analyzeCloneImages(imageUrls, trackingContext))
    }

    const results = await Promise.allSettled(promises)

    if (results[0].status === 'rejected') throw results[0].reason
    analysis = results[0].value

    if (results[1]?.status === 'fulfilled') {
      imageAnalyses = results[1].value
    }
  } catch (err) {
    logger.error({ error: String(err).slice(0, 300), url }, 'Clone 分析失敗')
    await transitionToFailed(state, conversationId, redis, io, isChinese,
      isChinese
        ? '無法分析此網站，可能是網站阻擋了自動化訪問或連線超時。'
        : 'Unable to analyze this website. It may block automated access or the connection timed out.',
      String(err).slice(0, 200),
    )
    return
  }

  if (analysis.sections.length === 0) {
    await transitionToFailed(state, conversationId, redis, io, isChinese,
      isChinese
        ? '未偵測到有效的頁面區塊，此網站可能使用了特殊的渲染技術。'
        : 'No valid sections detected. This website may use special rendering techniques.',
      'No sections detected',
    )
    return
  }

  // ── Phase 2: 逐 section 生成 ──
  const referenceHint = imageAnalyses?.length
    ? imageAnalyses.map(a => `參考圖片色彩: ${a.designHints.colors.join(', ')}; 風格: ${a.designHints.fontStyle}; 佈局: ${a.designHints.layoutDescription}`).join('\n')
    : undefined

  const sectionMetas = toSectionMetas(analysis.sections)
  state.phase = 'clone_generating'
  state.cloneSections = sectionMetas
  state.cloneTotalSections = analysis.sections.length
  state.cloneCompletedSections = 0
  state.cloneDesignSystem = analysis.designSystem
  state.cloneGeneratingStartedAt = Date.now()
  await saveFlowState(redis, conversationId, state)

  await sendMessage(conversationId, io, {
    content: isChinese
      ? `分析完成！偵測到 **${analysis.sections.length} 個區塊**，開始逐區塊復刻...`
      : `Analysis complete! Detected **${analysis.sections.length} sections**, starting reconstruction...`,
    stage: 'clone_generating' as const,
    richContent: {
      type: 'clone_progress' as const,
      data: {
        phase: 'generating',
        totalSections: analysis.sections.length,
        completedSections: 0,
        estimatedSecondsRemaining: analysis.sections.length * 15,
      },
    },
  })

  // 逐 section 並行生成（Semaphore=2）
  const semaphore = new Semaphore(2)
  const sectionCodes: Array<{ componentName: string; code: string; index: number }> = []

  const generatePromises = analysis.sections.map(async (section) => {
    await semaphore.acquire()
    try {
      const result = await generateSectionCode(section, analysis.designSystem, trackingContext, referenceHint)
      if (result) {
        sectionCodes.push({ ...result, index: section.index })

        // 更新進度
        state.cloneCompletedSections = (state.cloneCompletedSections || 0) + 1
        const meta = state.cloneSections?.find(m => m.index === section.index)
        if (meta) meta.status = 'completed'
        await saveFlowState(redis, conversationId, state)

        // 即時推送預覽
        const completedCodes = sectionCodes.sort((a, b) => a.index - b.index)
        const partial = assembleSections(completedCodes, analysis.designSystem, analysis.title)
        await sendMessage(conversationId, io, {
          content: '',
          stage: 'clone_generating' as const,
          richContent: {
            type: 'code_preview',
            data: { pages: partial.pages, components: partial.components, styles: partial.styles },
          },
          layoutHint: 'split',
        })

        // 進度更新
        await sendMessage(conversationId, io, {
          content: '',
          stage: 'clone_generating' as const,
          richContent: {
            type: 'clone_progress' as const,
            data: {
              phase: 'generating',
              totalSections: analysis.sections.length,
              completedSections: state.cloneCompletedSections,
              currentSectionName: section.componentName,
              estimatedSecondsRemaining: Math.max(0, (analysis.sections.length - state.cloneCompletedSections) * 15),
            },
          },
        })
      } else {
        const meta = state.cloneSections?.find(m => m.index === section.index)
        if (meta) meta.status = 'failed'
        await saveFlowState(redis, conversationId, state)
        logger.warn({ section: section.index }, 'Section 生成失敗，跳過')
      }
    } finally {
      semaphore.release()
    }
  })

  await Promise.all(generatePromises)

  // ── Phase 3: 合併 + QG + 完成 ──
  if (sectionCodes.length === 0) {
    await transitionToFailed(state, conversationId, redis, io, isChinese,
      isChinese ? '所有區塊生成失敗，請嘗試其他網址或重試。' : 'All sections failed to generate. Please try another URL or retry.',
      'All sections failed',
    )
    return
  }

  const sortedCodes = sectionCodes.sort((a, b) => a.index - b.index)
  const merged = assembleSections(sortedCodes, analysis.designSystem, analysis.title)

  await finalizeMergedCode(merged, state, conversationId, userId, redis, io, isChinese,
    analysis.sections.length, sectionCodes.length,
  )
}

// ============================================================
// Image-Only Mode
// ============================================================

async function imageOnlyCloneFlow(params: {
  projectId: string; conversationId: string; userId: string
  imageUrls: string[]
  locale?: 'zh' | 'en'; isChinese: boolean; redis: Redis; io: SocketIOServer
}): Promise<void> {
  const { projectId, conversationId, userId, imageUrls, locale, isChinese, redis, io } = params
  const trackingContext = { userId, conversationId }

  // ── Phase 1: 分析圖片 ──
  const state: FlowState = {
    phase: 'clone_analyzing',
    projectId,
    userId,
    currentRound: 0,
    questionIndex: 0,
    batchCount: 0,
    totalQuestionsAsked: 0,
    waitingForReply: false,
    cloneMode: true,
    cloneInputMode: 'image_only',
    cloneImageUrls: imageUrls,
    cloneImageAnalyses: imageUrls.map(url => ({ imageUrl: url, status: 'pending' as const })),
    cloneAnalyzingStartedAt: Date.now(),
    locale,
  }
  await saveFlowState(redis, conversationId, state)

  await sendMessage(conversationId, io, {
    content: isChinese
      ? `正在分析 **${imageUrls.length} 張截圖**...`
      : `Analyzing **${imageUrls.length} screenshots**...`,
    stage: 'clone_analyzing' as const,
    richContent: {
      type: 'clone_progress' as const,
      data: { phase: 'analyzing_images', totalImages: imageUrls.length, completedImages: 0, estimatedSecondsRemaining: imageUrls.length * 10 },
    },
  })

  let analyses: CloneImageAnalysis[]
  try {
    analyses = await analyzeCloneImages(imageUrls, trackingContext)

    // 更新分析狀態
    if (state.cloneImageAnalyses) {
      for (let i = 0; i < analyses.length; i++) {
        const a = state.cloneImageAnalyses[i]
        if (a) {
          a.status = analyses[i].sectionDescriptions.length > 0 ? 'analyzed' : 'failed'
          a.pageTitle = analyses[i].pageTitle
        }
      }
    }
    await saveFlowState(redis, conversationId, state)
  } catch (err) {
    logger.error({ error: String(err).slice(0, 300) }, 'Clone 圖片分析失敗')
    await transitionToFailed(state, conversationId, redis, io, isChinese,
      isChinese ? '圖片分析失敗，請確認圖片可正常存取後重試。' : 'Image analysis failed. Please check the images and retry.',
      String(err).slice(0, 200),
    )
    return
  }

  // ── Phase 2: 逐圖生成 page ──
  const designSystem = mergeImageDesignSystems(analyses)

  state.phase = 'clone_generating'
  state.cloneTotalSections = imageUrls.length
  state.cloneCompletedSections = 0
  state.cloneDesignSystem = designSystem
  state.cloneGeneratingStartedAt = Date.now()
  await saveFlowState(redis, conversationId, state)

  await sendMessage(conversationId, io, {
    content: isChinese
      ? `分析完成！開始從 **${imageUrls.length} 張截圖**生成頁面...`
      : `Analysis complete! Generating pages from **${imageUrls.length} screenshots**...`,
    stage: 'clone_generating' as const,
    richContent: {
      type: 'clone_progress' as const,
      data: {
        phase: 'generating',
        totalSections: imageUrls.length,
        completedSections: 0,
        estimatedSecondsRemaining: imageUrls.length * 30,
      },
    },
  })

  const semaphore = new Semaphore(2)
  const pageResults: Array<{ index: number; result: NonNullable<Awaited<ReturnType<typeof generatePageFromImage>>> }> = []

  const generatePromises = analyses.map(async (analysis, index) => {
    await semaphore.acquire()
    try {
      const result = await generatePageFromImage(analysis.imageUrl, analysis, index, trackingContext)
      if (result) {
        pageResults.push({ index, result })

        // 更新進度
        state.cloneCompletedSections = (state.cloneCompletedSections || 0) + 1
        if (state.cloneImageAnalyses?.[index]) {
          state.cloneImageAnalyses[index].status = 'generated'
        }
        await saveFlowState(redis, conversationId, state)

        // 即時預覽
        const sortedPages = pageResults.sort((a, b) => a.index - b.index).map(p => p.result)
        const partial = assembleImagePages(sortedPages, designSystem, analyses[0]?.pageTitle)
        await sendMessage(conversationId, io, {
          content: '',
          stage: 'clone_generating' as const,
          richContent: {
            type: 'code_preview',
            data: { pages: partial.pages, components: partial.components, styles: partial.styles },
          },
          layoutHint: 'split',
        })

        await sendMessage(conversationId, io, {
          content: '',
          stage: 'clone_generating' as const,
          richContent: {
            type: 'clone_progress' as const,
            data: {
              phase: 'generating',
              totalSections: imageUrls.length,
              completedSections: state.cloneCompletedSections,
              estimatedSecondsRemaining: Math.max(0, (imageUrls.length - state.cloneCompletedSections) * 30),
            },
          },
        })
      } else {
        if (state.cloneImageAnalyses?.[index]) {
          state.cloneImageAnalyses[index].status = 'failed'
        }
        await saveFlowState(redis, conversationId, state)
        logger.warn({ index }, '圖片頁面生成失敗，跳過')
      }
    } finally {
      semaphore.release()
    }
  })

  await Promise.all(generatePromises)

  // ── Phase 3: 合併 + QG + 完成 ──
  if (pageResults.length === 0) {
    await transitionToFailed(state, conversationId, redis, io, isChinese,
      isChinese ? '所有頁面生成失敗，請嘗試其他截圖或重試。' : 'All pages failed to generate. Please try other screenshots or retry.',
      'All image pages failed',
    )
    return
  }

  const sortedPages = pageResults.sort((a, b) => a.index - b.index).map(p => p.result)
  const merged = assembleImagePages(sortedPages, designSystem, analyses[0]?.pageTitle)

  await finalizeMergedCode(merged, state, conversationId, userId, redis, io, isChinese,
    imageUrls.length, pageResults.length,
  )
}

// ============================================================
// 共用：QG + 完成 + 錯誤處理
// ============================================================

/**
 * 合併後代碼 → QG → uiux_complete
 */
async function finalizeMergedCode(
  merged: { pages: Array<{ path: string; code: string }>; components: Array<{ path: string; code: string }>; styles: string },
  state: FlowState,
  conversationId: string,
  userId: string,
  redis: Redis,
  io: SocketIOServer,
  isChinese: boolean,
  totalCount: number,
  successCount: number,
): Promise<void> {
  const toComponent = (p: { path: string; code: string }) => ({
    path: p.path,
    content: p.code,
    description: p.path.split('/').pop() || p.path,
  })

  let currentCode: GeneratedCode = {
    pages: merged.pages.map(toComponent),
    components: merged.components.map(toComponent),
    styles: merged.styles,
  }

  // ── Quality Gate（inline，靜默執行）──
  try {
    let report = runQualityGate(currentCode)
    logger.info(`Clone QG: passed=${report.passed}, critical=${report.summary.critical}, warning=${report.summary.warning}`)

    for (let attempt = 0; attempt < CLONE_QG_MAX_ATTEMPTS && !report.passed; attempt++) {
      const criticalIssues = [
        ...report.categories.a11y.issues,
        ...report.categories.performance.issues,
        ...report.categories.code_quality.issues,
      ].filter(i => i.severity === 'critical')

      if (criticalIssues.length === 0) break

      // 先嘗試規則修復
      const ruleFixed = autoFixCriticalIssuesRuleBased(currentCode, criticalIssues)
      if (ruleFixed) {
        currentCode = ruleFixed
        report = runQualityGate(currentCode)
        const remaining = [
          ...report.categories.a11y.issues,
          ...report.categories.performance.issues,
          ...report.categories.code_quality.issues,
        ].filter(i => i.severity === 'critical')
        if (remaining.length === 0) break
      }

      // LLM 修復
      try {
        const fixed = await autoFixCriticalIssues(currentCode, criticalIssues, { userId, conversationId })
        if (!fixed) break
        currentCode = fixed
        report = runQualityGate(currentCode)
        logger.info(`Clone QG 修復後: passed=${report.passed}, critical=${report.summary.critical}`)
      } catch (qgErr) {
        logger.warn({ err: qgErr }, 'Clone QG 修復失敗，跳過')
        break
      }
    }
  } catch (qgErr) {
    logger.warn({ err: qgErr }, 'Clone QG 執行失敗，跳過')
  }

  // ── 保存 + 轉 uiux_complete ──
  state.uiuxGeneratedCode = currentCode
  state.phase = 'uiux_complete'
  state.waitingForReply = true
  state.uiuxCodePhase = 'complete'
  await saveFlowState(redis, conversationId, state)

  // 最終預覽推送
  await sendMessage(conversationId, io, {
    content: '',
    stage: 'uiux_complete',
    richContent: {
      type: 'code_preview',
      data: {
        pages: currentCode.pages.map(p => ({ path: p.path, code: p.content })),
        components: currentCode.components.map(c => ({ path: c.path, code: c.content })),
        styles: currentCode.styles,
      },
    },
    layoutHint: 'split',
  })

  const failCount = totalCount - successCount
  const isImageMode = state.cloneInputMode === 'image_only'
  const unitLabel = isImageMode ? (isChinese ? '頁面' : 'pages') : (isChinese ? '區塊' : 'sections')

  await sendMessage(conversationId, io, {
    content: isChinese
      ? `復刻完成！成功還原 **${successCount}/${totalCount}** 個${unitLabel}。${failCount > 0 ? `（${failCount} 個${unitLabel}生成失敗）` : ''}\n\n你可以：\n- 描述修改需求（例如「把背景改成深色」）\n- 直接部署上線`
      : `Clone complete! Successfully reconstructed **${successCount}/${totalCount}** ${unitLabel}.${failCount > 0 ? ` (${failCount} ${unitLabel} failed)` : ''}\n\nYou can:\n- Describe modifications\n- Deploy directly`,
    stage: 'uiux_complete',
    quickReplies: [
      { label: isChinese ? '部署上線' : 'Deploy', value: isChinese ? '部署' : 'Deploy', style: 'primary' as const },
      { label: isChinese ? '新專案' : 'New Project', value: '__new_project__' },
    ],
  })

  logger.info({
    conversationId,
    inputMode: state.cloneInputMode,
    url: state.cloneSourceUrl,
    totalCount,
    successCount,
    failCount,
  }, 'Clone 完成')
}

/**
 * 統一錯誤處理：轉入 clone_failed phase
 */
async function transitionToFailed(
  state: FlowState,
  conversationId: string,
  redis: Redis,
  io: SocketIOServer,
  isChinese: boolean,
  userMessage: string,
  reason: string,
): Promise<void> {
  state.phase = 'clone_failed'
  state.waitingForReply = true
  state.cloneFailedReason = reason
  await saveFlowState(redis, conversationId, state)

  await sendMessage(conversationId, io, {
    content: userMessage,
    stage: 'clone_failed' as const,
    quickReplies: [
      { label: isChinese ? '重試' : 'Retry', value: '__retry_clone__', style: 'primary' as const },
      { label: isChinese ? '新專案' : 'New Project', value: '__new_project__' },
    ],
  })
}
