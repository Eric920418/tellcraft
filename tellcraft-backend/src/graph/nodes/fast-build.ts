/**
 * Fast Build Node — 包裝 Fast Build Phase Handlers
 */
import type { TellcraftStateType } from '../state'
import { getRedis, getIo } from '../context'
import { getFlowState } from '../../workers/orchestrator-utils'
import { executeFastBuildSkill } from '../../workers/phase-handlers/fast-build-phases'
import { routePhase } from '../../workers/phase-router'

export async function fastBuildNode(
  state: TellcraftStateType
): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const flowState = await getFlowState(redis, state.conversationId)

  if (!flowState || flowState.phase === 'idle') {
    await executeFastBuildSkill({
      taskId: '',
      projectId: state.projectId,
      conversationId: state.conversationId,
      userId: state.userId,
      message: state.message,
      locale: (state.locale || 'zh') as 'zh' | 'en',
      imageUrls: state.imageUrls,
      redis, io,
    })
  } else {
    await routePhase(
      { projectId: state.projectId, conversationId: state.conversationId, userId: state.userId, message: state.message, locale: (state.locale || 'zh') as 'zh' | 'en', imageUrls: state.imageUrls },
      flowState, state.message.trim(), redis, io
    )
  }

  const updated = await getFlowState(redis, state.conversationId)
  return {
    phase: updated?.phase ?? 'idle',
    waitingForReply: updated?.waitingForReply ?? false,
    fastBuildStage: (updated as unknown as Record<string, unknown>)?.fastBuildStage as string ?? '',
  }
}
