/**
 * Clone Skill Node — 包裝 Clone Phase Handlers
 */
import type { TellcraftStateType } from '../state'
import { getRedis, getIo } from '../context'
import { getFlowState } from '../../workers/orchestrator-utils'
import { executeCloneSkill } from '../../workers/phase-handlers/clone-phases'
import { routePhase } from '../../workers/phase-router'

export async function cloneSkillNode(
  state: TellcraftStateType
): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const flowState = await getFlowState(redis, state.conversationId)

  if (!flowState || !flowState.phase.startsWith('clone_')) {
    await executeCloneSkill({
      projectId: state.projectId,
      conversationId: state.conversationId,
      userId: state.userId,
      url: state.message,
      imageUrls: state.imageUrls,
      locale: (state.locale || 'zh') as 'zh' | 'en',
      redis, io,
    })
  } else {
    await routePhase(
      { projectId: state.projectId, conversationId: state.conversationId, userId: state.userId, message: state.message, locale: (state.locale || 'zh') as 'zh' | 'en', imageUrls: state.imageUrls },
      flowState, state.message.trim(), redis, io
    )
  }

  const updated = await getFlowState(redis, state.conversationId)
  return { phase: updated?.phase ?? 'idle', waitingForReply: updated?.waitingForReply ?? false }
}
