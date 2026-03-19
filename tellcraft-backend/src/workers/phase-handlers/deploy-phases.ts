// ============================================================
// Deploy Phase Handlers
// 從 orchestrator.ts 提取
// ============================================================

import { Server as SocketIOServer } from 'socket.io'
import Redis from 'ioredis'
import * as db from '../../db/client'
import type { FlowState } from '../../types/flow-state'
import type { GeneratedComponent } from '../../services/uiux-generation'
import { prepareDeployment, executeDeployment, type SiteMetadata } from '../../services/deployer'
import { sendMessage, saveFlowState, getFlowState, deductCredits, snapshotCodeToGeneration } from '../orchestrator-utils'
import { CREDIT_COSTS } from '../../config/plans'
import { createLogger } from '../../lib/logger'
import { buildPostDeployFastBuildQuickReplies, getRemainingFastBuildPages } from './fast-build-phases'

const logger = createLogger('deploy-phases')

export interface DeployerSkillInput {
  taskId: string
  projectId: string
  conversationId: string
  userId: string
  message: string
  redis: Redis
  io: SocketIOServer
}

export async function executeDeployerSkill(input: DeployerSkillInput) {
  const { projectId, conversationId, userId, redis, io } = input

  await sendMessage(conversationId, io, {
    content: '收到！正在檢查部署條件...',
    stage: 'deployer_checking',
    progress: { current: 0, total: 3, step: '檢查部署條件' },
  })

  // 執行部署前檢查
  const preCheck = await prepareDeployment(projectId, userId)

  if (!preCheck.ready) {
    await sendMessage(conversationId, io, {
      content: `無法部署：${preCheck.error}`,
      stage: 'deployer_error',
    })
    return
  }

  // 取得流程狀態
  let state = await getFlowState(redis, conversationId)
  if (!state) {
    state = {
      phase: 'deployer_deploying',
      currentRound: 0,
      questionIndex: 0,
      batchCount: 0,
      waitingForReply: false,
      totalQuestionsAsked: 0,
      deployerPreCheck: preCheck,
      userId,
    }
  } else {
    state.deployerPreCheck = preCheck
    if (!state.userId) state.userId = userId
  }
  await saveFlowState(redis, conversationId, state)

  // 用戶已明確要求部署，直接執行不再二次確認
  await handleDeployExecute(conversationId, state, projectId, redis, io)
}

export async function handleDeployExecute(
  conversationId: string,
  state: FlowState,
  projectId: string,
  redis: Redis,
  io: SocketIOServer
) {
  const preCheck = state.deployerPreCheck

  if (!preCheck?.code) {
    await sendMessage(conversationId, io, {
      content: '部署資料遺失，請重新嘗試。',
      stage: 'deployer_error',
    })
    return
  }

  // 前置檢查：project 是否還存在（防止 stale FlowState 操作已刪除的資料）
  const projectExists = await db.getProject(projectId)
  if (!projectExists) {
    logger.warn({ projectId, conversationId }, '部署取消：project 已不存在')
    return
  }

  state.phase = 'deployer_deploying'
  state.waitingForReply = false
  state.uiuxCodeGenerationStartedAt = Date.now()
  await saveFlowState(redis, conversationId, state)

  await sendMessage(conversationId, io, {
    content: '開始部署...',
    stage: 'deployer_deploying',
    richContent: {
      type: 'deploy_progress',
      data: {
        percent: 0,
        step: '準備中...',
      } as Record<string, unknown>,
    },
  })

  // 構建 site metadata（降級優先順序：uiuxUISpec → project DB → fastModeOriginalMessage）
  let siteMetadata: SiteMetadata | undefined
  try {
    let metaTitle = state.uiuxUISpec?.productName || ''
    let metaDesc = state.uiuxUISpec?.productSummary || ''

    if (!metaTitle || !metaDesc) {
      const project = await db.getProject(projectId)
      if (!metaTitle && project?.name) metaTitle = project.name
      if (!metaDesc && project?.description) metaDesc = project.description
    }

    if (!metaDesc && state.fastModeOriginalMessage) {
      metaDesc = state.fastModeOriginalMessage
        .replace(/[\n\r]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .slice(0, 160)
    }

    if (metaTitle) {
      siteMetadata = {
        title: metaTitle.replace(/[\n\r]+/g, ' ').trim().slice(0, 100),
        description: (metaDesc || metaTitle).replace(/[\n\r]+/g, ' ').trim().slice(0, 300),
      }
      logger.info(`Site metadata: title="${metaTitle}", desc="${(metaDesc || metaTitle).slice(0, 50)}"`)
    }
  } catch (e) {
    logger.warn({ err: e }, '構建 siteMetadata 失敗，跳過')
  }

  // 執行部署，帶進度回調（try/catch 防止 state 卡死在 deployer_deploying）
  let result: { success: boolean; deploymentUrl?: string; vercelDeploymentId?: string; error?: string; deployedCode?: unknown }
  try {
    result = await executeDeployment(
      projectId,
      preCheck.code,
      preCheck.tailwindConfig || '',
      async (progress) => {
        // 進度只透過 Socket.io 即時推送，不寫入對話訊息（避免洗版）
        io?.emit(`deploy:progress:${conversationId}`, {
          percent: progress.percent,
          step: progress.step,
        })
      },
      {
        extraDependencies: preCheck.extraDependencies,
        injectedFiles: preCheck.injectedFiles,
        siteMetadata,
      },
      { userId: state.userId, conversationId },
    )
  } catch (err) {
    logger.error({ err: err }, 'handleDeployExecute 異常')
    result = { success: false, error: `部署過程異常：${err instanceof Error ? err.message : String(err)}` }
  }

  if (result.success) {
    // 同步 build 修復後的代碼到 FlowState（確保預覽和部署一致）
    if (result.deployedCode) {
      const deployedCode = result.deployedCode as {
        pages: GeneratedComponent[]
        components: GeneratedComponent[]
        styles: string
      }
      state.uiuxGeneratedCode = deployedCode
      logger.info(`已同步 build 修復後代碼到 FlowState（pages: ${deployedCode.pages?.length}, components: ${deployedCode.components?.length}）`)
    }

    state.deployerPreCheck = undefined
    state.phase = 'deployer_complete'
    await saveFlowState(redis, conversationId, state)

    // 快照代碼到 generation（部署後的代碼可能經過 build 修復，是最終確認版本）
    const deployProjectId = state.projectId || projectId
    if (deployProjectId) {
      await snapshotCodeToGeneration(deployProjectId, {
        changeSummary: '部署成功',
        conversationId,
      })
    }

    // Credit 扣除：Deploy 額外成本
    if (state.userId) {
      await deductCredits(state.userId, CREDIT_COSTS.DEPLOY - CREDIT_COSTS.BASE_MESSAGE)
    }

    // 如果代碼被修復過，更新 code_preview 到 DB（重新打開對話時才能看到修復後的版本）
    if (result.deployedCode) {
      const deployedCode = result.deployedCode as { pages: unknown[]; components: unknown[]; styles: string }
      await sendMessage(conversationId, io, {
        content: '',
        stage: 'deployer_code_sync',
        layoutHint: 'split',
        richContent: {
          type: 'code_preview',
          data: {
            pages: deployedCode.pages,
            components: deployedCode.components,
            styles: deployedCode.styles,
            tailwindConfig: preCheck.tailwindConfig || '',
            currentPhase: 'complete',
          } as Record<string, unknown>,
        },
      })
    }

    const remainingPages = getRemainingFastBuildPages(state)
    const continuationNote = remainingPages.length > 0
      ? `\n\n目前是先上線已完成頁面；若要補完其餘頁面，可點「繼續生成（${remainingPages.length} 頁）」回到生成流程。`
      : ''

    // 查詢 Neon DB 資訊（如有）
    let dbNote = ''
    try {
      const dbRow = await db.query<{ neon_host: string }>(
        'SELECT neon_host FROM projects WHERE id = $1 AND neon_host IS NOT NULL',
        [projectId]
      )
      if (dbRow.rows[0]) {
        dbNote = `\n\n**資料庫已就緒**\n- Host: \`${dbRow.rows[0].neon_host}\``
      }
    } catch {
      // 查詢失敗不影響部署成功訊息
    }

    await sendMessage(conversationId, io, {
      content: `**部署成功！**\n\n您的網站已上線：${result.deploymentUrl}${dbNote}\n\n---\n\n直接輸入修改建議即可迭代設計（如「把標題改大」「換個配色」）\n輸入「**回滾**」可恢復到之前的版本${continuationNote}`,
      stage: 'deployer_complete',
      richContent: {
        type: 'deploy_result',
        data: {
          deploymentUrl: result.deploymentUrl,
          vercelDeploymentId: result.vercelDeploymentId,
          success: true,
        } as Record<string, unknown>,
      },
      quickReplies: buildPostDeployFastBuildQuickReplies(state, { includeDeploy: true, includeRollback: true }),
    })
  } else {
    state.phase = 'deployer_failed'
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: `**部署失敗**\n\n${result.error}\n\n輸入「**部署**」可重新嘗試，或「**返回修改**」回到設計修改。`,
      stage: 'deployer_error',
      richContent: {
        type: 'deploy_result',
        data: {
          error: result.error,
          success: false,
        } as Record<string, unknown>,
      },
      quickReplies: [
        { label: '重試部署', value: '部署', style: 'primary' },
        { label: '返回修改', value: '返回修改', style: 'secondary' },
      ],
    })
  }
}

