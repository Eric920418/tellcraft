/**
 * UIUX Skill Node — 包裝 UIUX Phase Handlers
 * UIUX 不從 idle 啟動（必須先完成 BDD），所以只走 routePhase。
 */
import type { TellcraftStateType } from '../state'
import { getRedis, getIo } from '../context'
import { getFlowState } from '../../workers/orchestrator-utils'
import { routePhase } from '../../workers/phase-router'

export async function uiuxSkillNode(
  state: TellcraftStateType
): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const flowState = await getFlowState(redis, state.conversationId)
  if (!flowState) return { error: 'FlowState not found' }

  await routePhase(
    { projectId: state.projectId, conversationId: state.conversationId, userId: state.userId, message: state.message, locale: (state.locale || 'zh') as 'zh' | 'en', imageUrls: state.imageUrls },
    flowState, state.message.trim(), redis, io
  )

  const updated = await getFlowState(redis, state.conversationId)
  return { phase: updated?.phase ?? 'idle', waitingForReply: updated?.waitingForReply ?? false }
}
