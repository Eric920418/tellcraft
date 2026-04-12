/**
 * Fast Build Skill Subgraph — 快速建站
 *
 * Graph 結構：
 *   START → execute → afterExecute?
 *     ├─ complete → END
 *     ├─ awaiting_continue ──interrupt──→ afterContinue?
 *     │                                    ├─ continue → resume → afterResume（loop）
 *     │                                    ├─ finish → END
 *     │                                    └─ other → END
 *     └─ failed ──interrupt──→ afterFailed?
 *                                ├─ retry → execute（loop）
 *                                └─ cancel → END
 *
 * execute node 呼叫完整的 executeFastBuildSkill（concept + pipeline），
 * batch_decision 用 interrupt() 在多頁場景等用戶選擇繼續/完成。
 */
import { StateGraph, START, END, interrupt } from '@langchain/langgraph'
import { TellcraftState, type TellcraftStateType } from '../state'
import { getRedis, getIo } from '../context'
import * as db from '../../db/client'
import { sendMessage, saveFlowState, getFlowState } from '../../workers/orchestrator-utils'
import { executeFastBuildSkill, resumeFastBuildPipeline, getRemainingFastBuildPages } from '../../workers/phase-handlers/fast-build-phases'
import { createLogger } from '../../lib/logger'

const logger = createLogger('fast-build-subgraph')

// ── Node 1: execute — 完整 fast build pipeline ──

async function executeNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()

  // 先建 task 取得真正的 UUID
  const taskId = await db.createTask({ projectId: state.projectId, userId: state.userId, goal: state.message, status: 'planning' })
  if (!taskId) throw new Error('創建任務失敗')
  await db.updateTask(taskId, { status: 'executing', plan: { skill: 'fast-build' } })

  await executeFastBuildSkill({
    taskId,
    projectId: state.projectId,
    conversationId: state.conversationId,
    userId: state.userId,
    message: state.message,
    locale: (state.locale || 'zh') as 'zh' | 'en',
    imageUrls: state.imageUrls,
    redis, io,
  })

  const updated = await getFlowState(redis, state.conversationId)
  const stage = (updated as unknown as Record<string, unknown>)?.fastBuildStage as string ?? ''
  const phase = updated?.phase ?? 'idle'

  return {
    phase,
    fastBuildStage: stage,
    waitingForReply: updated?.waitingForReply ?? false,
  }
}

// ── Node 2: batch_decision — 多頁暫停等用戶選擇（interrupt）──

async function batchDecisionNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const { conversationId } = state

  const flowState = await getFlowState(redis, conversationId)
  if (!flowState) return { fastBuildStage: 'complete' }

  const remaining = getRemainingFastBuildPages(flowState)

  // executeFastBuildSkill 內部已發送了暫停訊息和 quickReplies
  // FlowState 已設定 waitingForReply = true

  // ── interrupt：等用戶選擇繼續/完成 ──
  const reply: string = interrupt({
    type: 'fast_build_batch',
    remainingPages: remaining,
    remainingCount: remaining.length,
  })

  if (reply === '__continue_fast_build__') {
    return { fastBuildStage: 'continue' }
  }
  if (reply === '__finish_fast_build__') {
    flowState.fastBuildPendingFinish = true
    flowState.phase = 'uiux_complete'
    ;(flowState as unknown as Record<string, unknown>).fastBuildStage = 'complete'
    flowState.waitingForReply = false
    await saveFlowState(redis, conversationId, flowState)

    const isChinese = state.locale !== 'en'
    await sendMessage(conversationId, io, {
      content: isChinese ? '已完成生成！您可以直接部署或修改設計。' : 'Generation complete! Deploy or iterate.',
      stage: 'uiux_complete',
      quickReplies: [
        { label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' as const },
        { label: isChinese ? '開始新專案' : 'New Project', value: '__new_project__', style: 'ghost' as const },
      ],
    })
    return { fastBuildStage: 'finish', phase: 'uiux_complete' }
  }
  // 其他輸入（可能是迭代請求）→ 結束
  return { fastBuildStage: 'other' }
}

// ── Node 3: resume — 繼續生成剩餘頁面 ──

async function resumeNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const { conversationId, projectId, userId } = state

  const flowState = await getFlowState(redis, conversationId)
  if (!flowState) return { fastBuildStage: 'complete', phase: 'uiux_complete' }

  await resumeFastBuildPipeline({
    state: flowState,
    projectId,
    conversationId,
    userId,
    redis, io,
  })

  const updated = await getFlowState(redis, conversationId)
  const stage = (updated as unknown as Record<string, unknown>)?.fastBuildStage as string ?? ''

  return {
    phase: updated?.phase ?? 'idle',
    fastBuildStage: stage,
    waitingForReply: updated?.waitingForReply ?? false,
  }
}

// ── Node 4: failed — 錯誤處理 + interrupt ──

async function failedNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const { conversationId } = state
  const isChinese = state.locale !== 'en'

  const flowState = await getFlowState(redis, conversationId)

  // executeFastBuildSkill 內部已發送了失敗訊息
  if (flowState) {
    flowState.phase = 'fast_generating'
    flowState.waitingForReply = true
    await saveFlowState(redis, conversationId, flowState)
  }

  // ── interrupt：等用戶重試/取消 ──
  const reply: string = interrupt({ type: 'fast_build_failed' })

  if (reply === '__retry_fast_build__' || /重試|retry/i.test(reply)) {
    return { fastBuildStage: 'retry' }
  }

  return { fastBuildStage: 'cancel' }
}

// ── Edge routing ──

function afterExecute(state: TellcraftStateType): string {
  if (state.fastBuildStage === 'awaiting_continue') return 'batch_decision'
  if (state.phase === 'fast_generating' && state.waitingForReply) return 'failed'  // 結構生成失敗
  return 'end'  // uiux_complete
}

function afterBatchDecision(state: TellcraftStateType): string {
  if (state.fastBuildStage === 'continue') return 'resume'
  return 'end'  // finish 或其他
}

function afterResume(state: TellcraftStateType): string {
  if (state.fastBuildStage === 'awaiting_continue') return 'batch_decision'  // 仍有更多頁
  return 'end'  // 完成
}

function afterFailed(state: TellcraftStateType): string {
  if (state.fastBuildStage === 'retry') return 'execute'  // retry loop
  return 'end'
}

// ── Build ──

export function buildFastBuildSubgraph() {
  return new StateGraph(TellcraftState)
    .addNode('execute', executeNode)
    .addNode('batch_decision', batchDecisionNode)  // interrupt
    .addNode('resume', resumeNode)
    .addNode('failed', failedNode)                  // interrupt

    .addEdge(START, 'execute')
    .addConditionalEdges('execute', afterExecute, {
      batch_decision: 'batch_decision',
      failed: 'failed',
      end: END,
    })
    .addConditionalEdges('batch_decision', afterBatchDecision, {
      resume: 'resume',
      end: END,
    })
    .addConditionalEdges('resume', afterResume, {
      batch_decision: 'batch_decision',  // loop for more batches
      end: END,
    })
    .addConditionalEdges('failed', afterFailed, {
      execute: 'execute',  // retry loop
      end: END,
    })
    .compile()
}
