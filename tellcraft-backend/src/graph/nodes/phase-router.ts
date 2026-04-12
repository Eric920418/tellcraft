/**
 * Phase Router Node — 根據 FlowState.phase 同步路由資訊
 *
 * 職責：讀取 Redis 中的 FlowState，將 phase/waitingForReply/fastBuildStage
 * 同步到 LangGraph state，讓 conditional edges 做正確路由。
 */
import type { TellcraftStateType } from '../state'
import { getFlowState } from '../../workers/orchestrator-utils'
import { getRedis } from '../context'

export async function phaseRouterNode(
  state: TellcraftStateType
): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const flowState = await getFlowState(redis, state.conversationId)

  if (!flowState) {
    return { phase: 'idle', error: 'FlowState not found' }
  }

  return {
    phase: flowState.phase ?? 'idle',
    waitingForReply: flowState.waitingForReply ?? false,
    fastBuildStage: (flowState as unknown as Record<string, unknown>).fastBuildStage as string ?? '',
  }
}
