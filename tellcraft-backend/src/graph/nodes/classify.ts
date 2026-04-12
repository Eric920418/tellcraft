/**
 * Classify Node — 意圖分類
 *
 * 職責：
 * 1. 如果已有進行中的 flow → 同步 FlowState 到 LangGraph state → 跳到 phase_router
 * 2. 如果 idle → 偵測特殊 token → 執行意圖分類 → 設定 skillIntent
 */
import type { TellcraftStateType } from '../state'
import { getFlowState } from '../../workers/orchestrator-utils'
import { getRedis } from '../context'

const SPECIAL_TOKENS = [
  '__new_project__',
  '__go_back__',
  '__retry__',
  '__retry_fast_build__',
  '__continue_fast_build__',
  '__finish_fast_build__',
  '__resume_fast_build_pipeline__',
  '__continue_fast_build_after_deploy__',
  '__connect_database__',
  '__verify_backend__',
  '__deploy_with_risk__',
  '__confirm_risky_deploy__',
  '__cancel_risky_deploy__',
  '__cancel_domain__',
  '__retry_clone__',
  '__auto_repair_preview__',
] as const

export async function classifyNode(
  state: TellcraftStateType
): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()

  // 偵測特殊 token
  const token = SPECIAL_TOKENS.find(t => state.message.includes(t)) ?? ''

  // 讀取現有 FlowState
  const flowState = await getFlowState(redis, state.conversationId)

  // 如果已有進行中的 flow → 直接跳到 phase_router
  if (flowState && flowState.phase && flowState.phase !== 'idle') {
    return {
      phase: flowState.phase,
      waitingForReply: flowState.waitingForReply ?? false,
      fastBuildStage: (flowState as unknown as Record<string, unknown>).fastBuildStage as string ?? '',
      specialToken: token,
      skillIntent: 'continue_flow',
    }
  }

  // idle 狀態 → 執行意圖分類
  // 暫時用簡單規則分類（之後可替換為 LLM classifier）
  let intent = 'meta'

  if (token === '__new_project__') {
    intent = 'end'
  } else if (state.mode === 'fast') {
    intent = 'fast'
  } else if (state.mode === 'clone' || state.imageUrls.length > 0) {
    intent = 'clone'
  } else if (state.message.includes('部署') || state.message.includes('deploy')) {
    intent = 'deploy'
  } else if (state.message.includes('域名') || state.message.includes('domain')) {
    intent = 'domain'
  } else {
    // 預設走 BDD spec flow
    intent = 'bdd'
  }

  return {
    skillIntent: intent,
    specialToken: token,
    phase: 'idle',
  }
}
