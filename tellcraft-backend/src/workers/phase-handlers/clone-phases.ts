/**
 * Clone Skill Phase Handler
 * 網站復刻：URL → 分析 → 逐 section Sonnet Vision 生成 → 合併 → QG → 預覽
 */

import type Redis from 'ioredis'
import type { Server as SocketIOServer } from 'socket.io'
import type { FlowState } from '../../types/flow-state'
import { sendMessage, saveFlowState } from '../orchestrator-utils'
import { extractPageForClone, generateSectionCode, assembleSections, toSectionMetas } from '../../services/web-clone-service'
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

export async function executeCloneSkill(params: {
  projectId: string
  conversationId: string
  userId: string
  url: string
  locale?: 'zh' | 'en'
  redis: Redis
  io: SocketIOServer
}): Promise<void> {
  const { projectId, conversationId, userId, url, locale, redis, io } = params
  const isChinese = locale === 'zh' || /[\u4e00-\u9fff]/.test(url) === false // URL 本身不含中文，用 locale

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
    cloneAnalyzingStartedAt: Date.now(),
    locale,
  }
  await saveFlowState(redis, conversationId, state)

  await sendMessage(conversationId, io, {
    content: isChinese
      ? `正在分析 **${url}** 的設計結構...`
      : `Analyzing design structure of **${url}**...`,
    stage: 'clone_analyzing',
    richContent: {
      type: 'clone_progress' as const,
      data: { phase: 'analyzing', totalSections: 0, completedSections: 0, estimatedSecondsRemaining: 120 },
    },
  })

  // 提取頁面數據
  let analysis
  try {
    analysis = await extractPageForClone(url)
  } catch (err) {
    logger.error({ error: String(err).slice(0, 300), url }, 'Clone 分析失敗')
    state.phase = 'clone_analyzing' // 保持 phase 讓 recovery 處理
    await saveFlowState(redis, conversationId, state)
    await sendMessage(conversationId, io, {
      content: isChinese
        ? `無法分析此網站，可能是網站阻擋了自動化訪問或連線超時。\n請嘗試其他網址。`
        : `Unable to analyze this website. It may block automated access or the connection timed out.\nPlease try another URL.`,
      stage: 'clone_analyzing',
    })
    // 清理 phase 讓用戶可以重新操作
    state.phase = 'clone_analyzing'
    state.waitingForReply = true
    await saveFlowState(redis, conversationId, state)
    return
  }

  if (analysis.sections.length === 0) {
    await sendMessage(conversationId, io, {
      content: isChinese
        ? '未偵測到有效的頁面區塊，此網站可能使用了特殊的渲染技術。請嘗試其他網址。'
        : 'No valid sections detected. This website may use special rendering techniques. Please try another URL.',
      stage: 'clone_analyzing',
    })
    state.phase = 'clone_analyzing'
    state.waitingForReply = true
    await saveFlowState(redis, conversationId, state)
    return
  }

  // ── Phase 2: 逐 section 生成 ──

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
    stage: 'clone_generating',
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
  const trackingContext = { userId, conversationId }

  const generatePromises = analysis.sections.map(async (section) => {
    await semaphore.acquire()
    try {
      const result = await generateSectionCode(section, analysis.designSystem, trackingContext)
      if (result) {
        sectionCodes.push({ ...result, index: section.index })

        // 更新進度
        state.cloneCompletedSections = (state.cloneCompletedSections || 0) + 1
        const meta = state.cloneSections?.find(m => m.index === section.index)
        if (meta) meta.status = 'completed'
        await saveFlowState(redis, conversationId, state)

        // 即時推送預覽（累積已完成的 section）
        const completedCodes = sectionCodes.sort((a, b) => a.index - b.index)
        const partial = assembleSections(completedCodes, analysis.designSystem, analysis.title)
        await sendMessage(conversationId, io, {
          content: '',
          stage: 'clone_generating',
          richContent: {
            type: 'code_preview',
            data: { pages: partial.pages, components: partial.components, styles: partial.styles },
          },
          layoutHint: 'split',
        })

        // 進度更新
        await sendMessage(conversationId, io, {
          content: '',
          stage: 'clone_generating',
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

  // ── Phase 3: 合併 + 完成 ──

  if (sectionCodes.length === 0) {
    await sendMessage(conversationId, io, {
      content: isChinese
        ? '所有區塊生成失敗，請嘗試其他網址或重試。'
        : 'All sections failed to generate. Please try another URL or retry.',
      stage: 'clone_generating',
    })
    state.phase = 'clone_generating'
    state.waitingForReply = true
    await saveFlowState(redis, conversationId, state)
    return
  }

  // 按 index 排序合併
  const sortedCodes = sectionCodes.sort((a, b) => a.index - b.index)
  const merged = assembleSections(sortedCodes, analysis.designSystem, analysis.title)

  // 保存生成代碼到 FlowState（複用 UIUX 結構 — GeneratedComponent 需 content+description）
  const toComponent = (p: { path: string; code: string }) => ({
    path: p.path,
    content: p.code,
    description: p.path.split('/').pop() || p.path,
  })
  state.uiuxGeneratedCode = {
    pages: merged.pages.map(toComponent),
    components: merged.components.map(toComponent),
    styles: merged.styles,
  }

  // 轉為 uiux_complete 複用迭代/部署
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
      data: { pages: merged.pages, components: merged.components, styles: merged.styles },
    },
    layoutHint: 'split',
  })

  const successCount = sectionCodes.length
  const failCount = analysis.sections.length - successCount

  await sendMessage(conversationId, io, {
    content: isChinese
      ? `復刻完成！成功還原 **${successCount}/${analysis.sections.length}** 個區塊。${failCount > 0 ? `（${failCount} 個區塊生成失敗）` : ''}\n\n你可以：\n- 描述修改需求（例如「把第二個 section 的背景改成深色」）\n- 直接部署上線`
      : `Clone complete! Successfully reconstructed **${successCount}/${analysis.sections.length}** sections.${failCount > 0 ? ` (${failCount} sections failed)` : ''}\n\nYou can:\n- Describe modifications (e.g. "change the second section background to dark")\n- Deploy directly`,
    stage: 'uiux_complete',
    quickReplies: [
      { label: isChinese ? '部署上線' : 'Deploy', value: isChinese ? '部署' : 'Deploy', style: 'primary' as const },
      { label: isChinese ? '新專案' : 'New Project', value: '__new_project__' },
    ],
  })

  logger.info({
    conversationId, url,
    totalSections: analysis.sections.length,
    successSections: successCount,
    failedSections: failCount,
  }, 'Clone 完成')
}
