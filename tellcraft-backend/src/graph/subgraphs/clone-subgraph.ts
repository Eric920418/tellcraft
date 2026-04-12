/**
 * Clone Skill Subgraph — 網站復刻
 *
 * Graph 結構：
 *   START → execute → afterExecute?
 *     ├─ complete → END
 *     └─ failed ──interrupt──→ afterFailed?
 *                                ├─ retry → execute（loop）
 *                                └─ cancel → END
 *
 * execute node 呼叫完整的 executeCloneSkill（analyze + generate + QG 緊密耦合），
 * 只有 failed 用 interrupt() 暫停等用戶選擇重試/取消。
 */
import { StateGraph, START, END, interrupt } from '@langchain/langgraph'
import { TellcraftState, type TellcraftStateType } from '../state'
import { getRedis, getIo } from '../context'
import { sendMessage, saveFlowState, getFlowState } from '../../workers/orchestrator-utils'
import { executeCloneSkill } from '../../workers/phase-handlers/clone-phases'
import { createLogger } from '../../lib/logger'

const logger = createLogger('clone-subgraph')

// ── Node 1: execute — 完整的 clone 流程 ──

async function executeNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()

  // ── clone_failed 後 fresh invoke → 從 FlowState 取回原始 URL ──
  // 用戶回覆 "重試" 或 __retry_clone__，state.message 不是 URL
  const flowState = await getFlowState(redis, state.conversationId)
  let cloneUrl = state.message
  let cloneImageUrls = state.imageUrls

  if (flowState?.phase === 'clone_failed' && flowState.waitingForReply) {
    const reply = state.message.trim()
    // 取消
    if (/取消|cancel|放棄/i.test(reply) || reply === '__cancel_domain__') {
      return { phase: 'idle' }
    }
    // 用戶貼了新 URL → 用新 URL
    if (/https?:\/\//.test(reply)) {
      cloneUrl = reply
    } else {
      // 重試 → 用 FlowState 中的原始 URL
      const originalUrl = (flowState as unknown as Record<string, unknown>).cloneSourceUrl as string
      if (originalUrl) cloneUrl = originalUrl
    }
    // 重置 phase
    flowState.phase = 'clone_analyzing'
    flowState.waitingForReply = false
    await saveFlowState(redis, state.conversationId, flowState)
  }

  await executeCloneSkill({
    projectId: state.projectId,
    conversationId: state.conversationId,
    userId: state.userId,
    url: cloneUrl,
    imageUrls: cloneImageUrls,
    locale: (state.locale || 'zh') as 'zh' | 'en',
    redis, io,
  })

  // 讀取結果：executeCloneSkill 內部設定 phase
  const updated = await getFlowState(redis, state.conversationId)
  const phase = updated?.phase ?? 'idle'

  if (phase === 'clone_failed') {
    return { phase: 'clone_failed' }
  }
  // clone_analyzing / clone_generating 中途不會到這裡（它們是同步執行的）
  // 成功 → uiux_complete
  return { phase }
}

// ── Node 2: failed — 錯誤處理 + interrupt ──

async function failedNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const { conversationId } = state
  const isChinese = state.locale !== 'en'

  const flowState = await getFlowState(redis, conversationId)
  const reason = (flowState as unknown as Record<string, unknown>)?.cloneFailedReason as string || '未知錯誤'

  // executeCloneSkill 內部的 transitionToFailed 已經發送了錯誤訊息
  // 但為確保 FlowState 正確，再次設定
  if (flowState) {
    flowState.phase = 'clone_failed'
    flowState.waitingForReply = true
    await saveFlowState(redis, conversationId, flowState)
  }

  // ── interrupt：等用戶選擇重試/取消 ──
  const reply: string = interrupt({ type: 'clone_failed', reason })

  const updated = await getFlowState(redis, state.conversationId)

  if (reply === '__retry_clone__' || /重試|retry/i.test(reply)) {
    return { phase: 'clone_analyzing' }  // 固定值，不從 FlowState 讀（已被設為 clone_failed）
  }

  // 檢查是否貼了新 URL 或新圖片
  const hasUrl = /https?:\/\//.test(reply)
  if (hasUrl) {
    return { phase: 'clone_analyzing', message: reply }
  }

  return { phase: 'idle' }
}

// ── Edge routing ──

function afterExecute(state: TellcraftStateType): string {
  if (state.phase === 'clone_failed') return 'failed'
  return 'end'  // uiux_complete or other
}

function afterFailed(state: TellcraftStateType): string {
  if (state.phase === 'clone_analyzing') return 'execute'  // retry loop
  return 'end'
}

// ── Build ──

export function buildCloneSubgraph() {
  return new StateGraph(TellcraftState)
    .addNode('execute', executeNode)
    .addNode('failed', failedNode)        // interrupt

    .addEdge(START, 'execute')
    .addConditionalEdges('execute', afterExecute, {
      failed: 'failed',
      end: END,
    })
    .addConditionalEdges('failed', afterFailed, {
      execute: 'execute',  // retry loop
      end: END,
    })
    .compile()
}
