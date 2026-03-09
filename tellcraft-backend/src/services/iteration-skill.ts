// ============================================================
// 迭代修改 + 回滾 Skill（從 orchestrator.ts 抽出）
// ============================================================

import { Server as SocketIOServer } from 'socket.io'
import Redis from 'ioredis'
import * as db from '../db/client'
import { createLogger } from '../lib/logger'

const logger = createLogger('iteration-skill')
import type { FlowState } from '../types/flow-state'
import { sendMessage, saveFlowState, getFlowState, generatedCodeToFileRows, deductCredits, makeStreamingCallback } from '../workers/orchestrator-utils'
import { CREDIT_COSTS } from '../config/plans'
import { refineCode, generateTailwindConfig, GeneratedComponent, buildStreamingHandler } from './uiux-generation'
import { listProjectDeployments, rollbackToDeployment, toVercelSlug } from './deployer'

const MAX_ITERATIONS_PER_SESSION = 50

// ============================================================
// 內部 Helper
// ============================================================

/**
 * 從 FlowState 或 project_files 取得當前代碼
 */
async function resolveCurrentCode(state: FlowState): Promise<{
  pages: GeneratedComponent[]
  components: GeneratedComponent[]
  styles: string
} | null> {
  if (state.uiuxGeneratedCode) {
    return state.uiuxGeneratedCode
  }

  if (state.projectId) {
    const projectFiles = await db.getProjectFiles(state.projectId, 'uiux')
    if (projectFiles.length > 0) {
      const pages: GeneratedComponent[] = []
      const components: GeneratedComponent[] = []
      let styles = ''
      for (const f of projectFiles) {
        if (f.file_type === 'page') {
          pages.push({ path: f.file_path, content: f.content, description: f.description || '' })
        } else if (f.file_type === 'component') {
          components.push({ path: f.file_path, content: f.content, description: f.description || '' })
        } else if (f.file_type === 'style') {
          styles = f.content
        }
      }
      return { pages, components, styles }
    }
  }

  return null
}

/**
 * 記錄迭代歷史摘要
 */
function recordIterationHistory(
  state: FlowState,
  feedback: string,
  filesChanged: string[]
) {
  if (!state.iterationHistory) {
    state.iterationHistory = []
  }
  state.iterationHistory.push({
    timestamp: Date.now(),
    feedback,
    filesChanged,
  })
  // 最多保留 20 條歷史
  if (state.iterationHistory.length > 20) {
    state.iterationHistory = state.iterationHistory.slice(-20)
  }
}

// ============================================================
// 迭代修改
// ============================================================

export async function executeIteration(input: {
  conversationId: string
  projectId: string
  userId: string
  userFeedback: string
  redis: Redis
  io: SocketIOServer
  imageUrls?: string[]
}): Promise<void> {
  const { conversationId, projectId, userId, userFeedback, redis, io } = input
  const state = await getFlowState(redis, conversationId)
  if (!state) {
    await sendMessage(conversationId, io, {
      content: '找不到流程狀態，請重新開始。',
      stage: 'error',
    })
    return
  }

  // 0. 安全閥：迭代次數上限
  if ((state.iterationCount || 0) >= MAX_ITERATIONS_PER_SESSION) {
    const isChinese = state.locale !== 'en'
    await sendMessage(conversationId, io, {
      content: isChinese
        ? `已達到單次對話的迭代上限（${MAX_ITERATIONS_PER_SESSION} 次）。建議部署目前版本或開始新專案。`
        : `Reached iteration limit (${MAX_ITERATIONS_PER_SESSION}). Please deploy or start a new project.`,
      stage: 'info',
      quickReplies: [
        { label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' as const },
        { label: isChinese ? '開始新專案' : 'New Project', value: '__new_project__', style: 'ghost' as const },
      ],
    })
    return
  }

  // 1. 設定 iterating phase 防止並行訊息 + 保存反饋供重試
  state.phase = 'uiux_iterating'
  state.uiuxCodeGenerationStartedAt = Date.now()
  state.lastIterationFeedback = userFeedback
  state.lastIterationImageUrls = input.imageUrls
  await saveFlowState(redis, conversationId, state)

  // 保留原有快照，失敗/異常時恢復
  const previousSnapshot = state.uiuxPreIterationCode

  try {
    await sendMessage(conversationId, io, {
      content: '正在根據您的建議修改設計...',
      stage: 'uiux_iterating',
      progress: { current: 1, total: 2, step: '修改中' },
    })

    // 2. 取得現有代碼
    const currentCode = await resolveCurrentCode(state)

    if (!currentCode) {
      await sendMessage(conversationId, io, {
        content: '找不到可修改的代碼，請先完成設計生成。',
        stage: 'error',
      })
      state.phase = 'uiux_complete'
      state.uiuxCodeGenerationStartedAt = undefined
      await saveFlowState(redis, conversationId, state)
      return
    }

    // 2.5 建構 streaming callback（迭代時即時預覽）
    const tailwindConfig = state.uiuxDesignSystem
      ? generateTailwindConfig(state.uiuxDesignSystem)
      : ''
    const streamingCallback = buildStreamingHandler(
      makeStreamingCallback(conversationId, io, redis, 'iteration', tailwindConfig)
    )

    // 3. 呼叫 refineCode（快照延後到成功後才覆蓋）
    // Fast Build 擴展 prompt 注入為產品上下文，讓 LLM 理解網站全貌
    let enrichedFeedback = userFeedback
    if (state.fastMode && state.fastModeExpandedPrompt) {
      enrichedFeedback = `${userFeedback}\n\n[產品完整描述（用於理解上下文，不是修改指令）]\n${state.fastModeExpandedPrompt}`
    }

    const result = await refineCode(
      currentCode,
      enrichedFeedback,
      {
        designSystem: state.uiuxDesignSystem,
        designTier: state.uiuxDesignTier,
        designBrief: state.uiuxDesignBrief,
        variantConcept: state.uiuxVariantConcept,
        moodId: state.uiuxDesignMood,
      },
      { userId: state.userId || userId, conversationId, purpose: 'uiux_refine' },
      input.imageUrls,
      streamingCallback
    )

    // 清理 streaming preview key（無論成功/失敗）
    await redis.del(`streaming:preview:${conversationId}`).catch(() => {})

    if (!result.success || !result.pages) {
      // 區分「無法理解」和「系統錯誤」
      const isNoChange = result.error && !result.error.includes('未知錯誤') && !result.error.includes('無法修改')
      await sendMessage(conversationId, io, {
        content: isNoChange
          ? `${result.error}`
          : `修改失敗：${result.error || '未知錯誤，請稍後重試。'}`,
        stage: isNoChange ? 'info' : 'error',
        quickReplies: isNoChange
          ? [{ label: '部署上線', value: '部署', style: 'primary' as const }]
          : [
              { label: '重試修改', value: '__retry_iteration__', style: 'primary' as const },
              { label: '部署上線', value: '部署', style: 'secondary' as const },
            ],
      })
      // 恢復之前的快照（沒有實際改動，不應覆蓋有效快照）
      state.uiuxPreIterationCode = previousSnapshot
      state.phase = 'uiux_complete'
      state.uiuxCodeGenerationStartedAt = undefined
      await saveFlowState(redis, conversationId, state)
      return
    }

    // 4. refineCode 成功，保存迭代前快照（此時才安全覆蓋）
    state.uiuxPreIterationCode = JSON.parse(JSON.stringify(currentCode))

    // 5. 更新代碼
    const updatedCode = {
      pages: result.pages,
      components: result.components || currentCode.components,
      styles: result.styles || currentCode.styles,
    }
    state.uiuxGeneratedCode = updatedCode
    state.iterationCount = (state.iterationCount || 0) + 1
    state.lastIterationFeedback = undefined
    state.lastIterationImageUrls = undefined
    state.autoRepairCount = 0  // 新代碼版本，重置 auto-repair 計數

    // 6. 記錄迭代歷史
    const changedFiles = result.pages.map(p => p.path)
    if (result.components) {
      changedFiles.push(...result.components.map(c => c.path))
    }
    recordIterationHistory(state, userFeedback, changedFiles)

    // 7. 保存到 project_files
    const pid = state.projectId || projectId
    if (pid) {
      await db.upsertProjectFiles(pid, 'uiux',
        generatedCodeToFileRows(updatedCode, state.uiuxDesignSystem))
    }

    // 8. 發送預覽（tailwindConfig 已在上方計算）
    // quickReplies：有迭代前快照時顯示撤銷按鈕
    const quickReplies: { label: string; value: string; style?: 'primary' | 'secondary' | 'ghost' }[] = [
      { label: '部署上線', value: '部署', style: 'primary' },
    ]
    if (state.uiuxPreIterationCode) {
      quickReplies.push({ label: '撤銷修改', value: '撤銷', style: 'ghost' })
    }

    await sendMessage(conversationId, io, {
      content: `**設計已更新！** (第 ${state.iterationCount} 次迭代)\n\n請在預覽面板查看修改效果。\n\n---\n\n輸入「**部署**」重新上線，或繼續提供修改建議。`,
      stage: 'uiux_iteration_complete',
      layoutHint: 'split',
      richContent: {
        type: 'code_preview',
        data: {
          pages: updatedCode.pages,
          components: updatedCode.components,
          styles: updatedCode.styles,
          tailwindConfig,
          currentPhase: 'complete',
        } as Record<string, unknown>,
      },
      quickReplies,
    })

    // 9. Credit 扣除：迭代修改額外成本（base 已在 handleContinueFlow 入口扣除）
    await deductCredits(userId, CREDIT_COSTS.ITERATION - CREDIT_COSTS.BASE_MESSAGE)

    // 10. 回到 uiux_complete 等待下一步
    state.phase = 'uiux_complete'
    state.uiuxCodePhase = 'complete'
    state.waitingForReply = false
    state.uiuxCodeGenerationStartedAt = undefined
    await saveFlowState(redis, conversationId, state)
  } catch (err) {
    logger.error({ err }, 'executeIteration 異常')
    await redis.del(`streaming:preview:${conversationId}`).catch(() => {})
    state.phase = 'uiux_complete'
    state.uiuxCodeGenerationStartedAt = undefined
    state.uiuxPreIterationCode = previousSnapshot
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: `修改過程發生異常：${err instanceof Error ? err.message : String(err)}\n\n請稍後再試，或嘗試其他描述方式。`,
      stage: 'error',
      quickReplies: [
        { label: '重試修改', value: '__retry_iteration__', style: 'primary' as const },
      ],
    })
  }
}

// ============================================================
// 撤銷上一次迭代
// ============================================================

export async function executeUndoIteration(input: {
  conversationId: string
  projectId: string
  redis: Redis
  io: SocketIOServer
}): Promise<void> {
  const { conversationId, projectId, redis, io } = input
  const state = await getFlowState(redis, conversationId)
  if (!state) {
    await sendMessage(conversationId, io, {
      content: '找不到流程狀態，請重新開始。',
      stage: 'error',
    })
    return
  }

  if (!state.uiuxPreIterationCode) {
    await sendMessage(conversationId, io, {
      content: '沒有可撤銷的修改記錄。',
      stage: 'info',
      quickReplies: [
        { label: '部署上線', value: '部署', style: 'primary' },
      ],
    })
    return
  }

  try {
    // 恢復代碼
    state.uiuxGeneratedCode = state.uiuxPreIterationCode
    state.uiuxPreIterationCode = undefined // 只能撤銷一步
    state.iterationCount = Math.max(0, (state.iterationCount || 1) - 1)
    state.iterationHistory?.pop()
    state.phase = 'uiux_complete'
    state.uiuxCodePhase = 'complete'

    // 同步到 project_files
    const pid = state.projectId || projectId
    if (pid && state.uiuxGeneratedCode) {
      await db.upsertProjectFiles(pid, 'uiux',
        generatedCodeToFileRows(state.uiuxGeneratedCode, state.uiuxDesignSystem))
    }

    await saveFlowState(redis, conversationId, state)

    // 發送預覽
    const tailwindConfig = state.uiuxDesignSystem
      ? generateTailwindConfig(state.uiuxDesignSystem)
      : ''

    await sendMessage(conversationId, io, {
      content: `**已撤銷上一次修改。**\n\n預覽已恢復到修改前的版本。\n\n---\n\n輸入「**部署**」上線，或繼續提供修改建議。`,
      stage: 'uiux_iteration_complete',
      layoutHint: 'split',
      richContent: {
        type: 'code_preview',
        data: {
          pages: state.uiuxGeneratedCode.pages,
          components: state.uiuxGeneratedCode.components,
          styles: state.uiuxGeneratedCode.styles,
          tailwindConfig,
          currentPhase: 'complete',
        } as Record<string, unknown>,
      },
      quickReplies: [
        { label: '部署上線', value: '部署', style: 'primary' },
      ],
    })
  } catch (err) {
    logger.error({ err }, 'executeUndoIteration 異常')
    await sendMessage(conversationId, io, {
      content: `撤銷操作異常：${err instanceof Error ? err.message : String(err)}`,
      stage: 'error',
    })
  }
}

// ============================================================
// 查詢回滾歷史
// ============================================================

export async function executeRollbackQuery(input: {
  conversationId: string
  projectId: string
  redis: Redis
  io: SocketIOServer
}): Promise<void> {
  const { conversationId, projectId, redis, io } = input
  const state = await getFlowState(redis, conversationId)
  if (!state) {
    await sendMessage(conversationId, io, {
      content: '找不到流程狀態，請重新開始。',
      stage: 'error',
    })
    return
  }

  try {
    const pid = state.projectId || projectId

    // 查詢部署歷史
    const deployments = await listProjectDeployments(pid)

    if (deployments.length <= 1) {
      await sendMessage(conversationId, io, {
        content: '目前只有一個部署版本，無法回滾。',
        stage: 'info',
      })
      return
    }

    // 保存部署列表到 state，等待用戶選擇
    state.rollbackDeployments = deployments
    state.phase = 'deployer_rollback_select'
    await saveFlowState(redis, conversationId, state)

    // 格式化歷史列表
    const historyText = deployments.map((d, i) => {
      const date = new Date(d.created_at).toLocaleString('zh-TW')
      const label = i === 0 ? '（目前版本）' : ''
      return `${i + 1}. ${date} ${label}\n   ${d.url}`
    }).join('\n\n')

    await sendMessage(conversationId, io, {
      content: `**部署歷史**\n\n${historyText}\n\n---\n\n輸入版本編號回滾（如「2」表示回到第 2 個版本），或輸入「取消」。`,
      stage: 'deployer_rollback_select',
      richContent: {
        type: 'deployment_history',
        data: {
          deployments: deployments.map((d, i) => ({
            index: i + 1,
            id: d.id,
            vercelDeploymentId: d.vercel_deployment_id,
            url: d.url,
            createdAt: d.created_at,
            isCurrent: i === 0,
          })),
        } as Record<string, unknown>,
      },
    })
  } catch (err) {
    logger.error({ err }, 'executeRollbackQuery 異常')
    // 保持原 phase 不變（deployer_complete），讓用戶可重試
    await sendMessage(conversationId, io, {
      content: `查詢部署歷史失敗：${err instanceof Error ? err.message : String(err)}\n\n請稍後再試。`,
      stage: 'error',
    })
  }
}

// ============================================================
// 處理回滾選擇
// ============================================================

export async function executeRollbackSelection(input: {
  conversationId: string
  projectId: string
  userMessage: string
  redis: Redis
  io: SocketIOServer
}): Promise<void> {
  const { conversationId, projectId, userMessage, redis, io } = input
  const state = await getFlowState(redis, conversationId)
  if (!state) {
    await sendMessage(conversationId, io, {
      content: '找不到流程狀態，請重新開始。',
      stage: 'error',
    })
    return
  }

  try {
    const cancelKeywords = ['取消', 'cancel', '算了']
    if (cancelKeywords.some(kw => userMessage.includes(kw))) {
      state.phase = 'deployer_complete'
      state.rollbackDeployments = undefined
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: '已取消回滾。',
        stage: 'info',
      })
      return
    }

    // 解析版本編號
    const numMatch = userMessage.match(/(\d+)/)
    if (!numMatch) {
      await sendMessage(conversationId, io, {
        content: '請輸入版本編號（如「2」），或輸入「取消」返回。',
        stage: 'info',
      })
      return
    }

    const index = parseInt(numMatch[1]) - 1
    const deployments = state.rollbackDeployments || []
    if (index < 0 || index >= deployments.length) {
      await sendMessage(conversationId, io, {
        content: `請輸入 1 到 ${deployments.length} 之間的版本編號，或輸入「取消」返回。`,
        stage: 'info',
      })
      return
    }

    if (index === 0) {
      await sendMessage(conversationId, io, {
        content: '版本 1 就是目前的版本，無需回滾。請選擇其他版本，或輸入「取消」返回。',
        stage: 'info',
      })
      return
    }

    const target = deployments[index]

    await sendMessage(conversationId, io, {
      content: `正在回滾到版本 ${index + 1}...`,
      stage: 'deployer_rolling_back',
      progress: { current: 1, total: 2, step: '回滾中' },
    })

    // 取得 project name（使用 deployer 的 toVercelSlug 確保一致）
    const project = await db.getProject(state.projectId || projectId)
    const projectName = toVercelSlug(project?.name || '', state.projectId || projectId)

    const result = await rollbackToDeployment(projectName, target.vercel_deployment_id)

    if (result.success) {
      // 記錄回滾到 DB
      await db.query(
        `INSERT INTO deployments (project_id, vercel_deployment_id, url, status)
         VALUES ($1, $2, $3, 'success')`,
        [state.projectId || projectId, target.vercel_deployment_id, target.url]
      )

      state.phase = 'deployer_complete'
      state.rollbackDeployments = undefined
      await saveFlowState(redis, conversationId, state)

      await sendMessage(conversationId, io, {
        content: `**回滾成功！**\n\n已恢復到版本 ${index + 1}：${target.url}\n\n---\n\n直接輸入修改建議即可迭代設計\n輸入「**回滾**」可再次查看部署歷史`,
        stage: 'deployer_complete',
        richContent: {
          type: 'deploy_result',
          data: {
            deploymentUrl: target.url,
            success: true,
          } as Record<string, unknown>,
        },
      })
    } else {
      state.phase = 'deployer_complete'
      state.rollbackDeployments = undefined
      await saveFlowState(redis, conversationId, state)

      await sendMessage(conversationId, io, {
        content: `**回滾失敗**\n\n${result.error}\n\n請稍後再試，或輸入修改建議直接修改設計。`,
        stage: 'deployer_error',
      })
    }
  } catch (err) {
    logger.error({ err }, 'executeRollbackSelection 異常')
    state.phase = 'deployer_complete'
    state.rollbackDeployments = undefined
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: `回滾操作異常：${err instanceof Error ? err.message : String(err)}\n\n請稍後再試。`,
      stage: 'error',
    })
  }
}
