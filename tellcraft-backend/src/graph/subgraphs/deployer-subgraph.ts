/**
 * Deployer Skill Subgraph — 完全自動化（無 interrupt）
 *
 * Graph 結構：
 *   START → prepare → deploy → END
 *
 * prepare: 檢查部署條件（prepareDeployment）
 * deploy: 五層防禦 + Vercel 部署（executeDeployment）
 *
 * 部署後的互動（迭代/回滾/域名）由 main graph 層級處理。
 */
import { StateGraph, START, END } from '@langchain/langgraph'
import { TellcraftState, type TellcraftStateType } from '../state'
import { getRedis, getIo } from '../context'
import * as db from '../../db/client'
import { getFlowState } from '../../workers/orchestrator-utils'
import { executeDeployerSkill } from '../../workers/phase-handlers/deploy-phases'
import { routePhase } from '../../workers/phase-router'
import { createLogger } from '../../lib/logger'

const logger = createLogger('deployer-subgraph')

// ── Node: deploy ──
// 呼叫現有的 executeDeployerSkill 或 routePhase
async function deployNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const flowState = await getFlowState(redis, state.conversationId)

  if (!flowState || !flowState.phase.startsWith('deployer_')) {
    // 新的部署 → 先建 task 取得真正的 UUID
    const taskId = await db.createTask({ projectId: state.projectId, userId: state.userId, goal: state.message, status: 'planning' })
    if (!taskId) throw new Error('創建任務失敗')
    await db.updateTask(taskId, { status: 'executing', plan: { skill: 'deployer' } })

    await executeDeployerSkill({
      taskId,
      projectId: state.projectId,
      conversationId: state.conversationId,
      userId: state.userId,
      message: state.message,
      redis, io,
    })
  } else {
    // 進行中的部署 flow → routePhase
    await routePhase(
      { projectId: state.projectId, conversationId: state.conversationId, userId: state.userId, message: state.message, locale: (state.locale || 'zh') as 'zh' | 'en', imageUrls: state.imageUrls },
      flowState, state.message.trim(), redis, io
    )
  }

  const updated = await getFlowState(redis, state.conversationId)
  return {
    phase: updated?.phase ?? 'idle',
    waitingForReply: updated?.waitingForReply ?? false,
  }
}

// ── Build ──
export function buildDeployerSubgraph() {
  return new StateGraph(TellcraftState)
    .addNode('deploy', deployNode)
    .addEdge(START, 'deploy')
    .addEdge('deploy', END)
    .compile()
}
