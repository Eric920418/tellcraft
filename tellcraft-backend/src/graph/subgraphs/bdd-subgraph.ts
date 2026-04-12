/**
 * BDD Skill Subgraph — 需求釐清 + BDD 規格產出
 *
 * Graph 結構（每個 node 最多 1 個 interrupt）：
 *   START → entry → afterEntry?
 *     ├─ es_init_wait (interrupt) → es_explore_wait (interrupt, loop) → prd_clarify_wait
 *     ├─ prd_clarify_wait (interrupt, loop) → prd_next_round → formulation
 *     ├─ formulation → draft_review_wait (interrupt) → spec_discovery
 *     ├─ spec_discovery → prd_clarify_wait (reuse for spec_clarify) → complete_spec
 *     ├─ spec_change_wait (interrupt, sidecar) → END
 *     └─ spec_rollback_wait (interrupt, sidecar) → END
 *
 * 所有 interrupt node 委派給現有 handler 函數（0 業務邏輯改動）。
 */
import { StateGraph, START, END, interrupt } from '@langchain/langgraph'
import { TellcraftState, type TellcraftStateType } from '../state'
import { getRedis, getIo } from '../context'
import { getFlowState } from '../../workers/orchestrator-utils'
import * as db from '../../db/client'
import {
  executeBddSpecSkill,
  handleESInitReply,
  handleESExploreReply,
  handleBddWaitingForReply,
  handleFormulationDraftReview,
  handleSpecChangeConfirm,
  handleSpecRollbackSelect,
  completeSpecPhase,
} from '../../workers/phase-handlers/bdd-phases'
import { createLogger } from '../../lib/logger'

const logger = createLogger('bdd-subgraph')

// ============================================================
// Node 1: entry — 初始化 or 分派到進行中的 phase
// ============================================================

async function entryNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const flowState = await getFlowState(redis, state.conversationId)

  // Sidecar 分派
  if (flowState?.phase === 'spec_change_confirm') return { bddStage: 'spec_change' }
  if (flowState?.phase === 'spec_rollback_select') return { bddStage: 'spec_rollback' }
  if (flowState?.phase === 'spec_change_analyzing') return { bddStage: 'spec_change' }

  // ── waitingForReply + fresh invoke → 直接處理用戶回覆 ──
  // Entry node 只在 fresh invoke 時執行（resume 直接跳到 interrupt node）。
  // 若 checkpoint 遺失（重啟/清理），waitingForReply=true 時需直接處理回覆。
  if (flowState?.waitingForReply && state.message) {
    const p = flowState.phase
    if (p === 'es_init') {
      await handleESInitReply(state.conversationId, flowState, state.message, redis, io)
      const u = await getFlowState(redis, state.conversationId)
      if (u?.phase === 'es_explore') return { bddStage: 'es_explore' }
      if (u?.phase === 'prd_clarify') return { bddStage: 'prd_clarify' }
      return { bddStage: u?.phase ?? 'error' }
    }
    if (p === 'es_explore') {
      await handleESExploreReply(state.conversationId, flowState, state.message, redis, io)
      const u = await getFlowState(redis, state.conversationId)
      if (u?.phase === 'es_explore' && u.waitingForReply) return { bddStage: 'es_explore' }
      if (u?.phase === 'prd_clarify') return { bddStage: 'prd_clarify' }
      return { bddStage: u?.phase ?? 'error' }
    }
    if (p === 'prd_clarify' || p === 'spec_clarify') {
      await handleBddWaitingForReply(state.conversationId, flowState, state.message, redis, io)
      const u = await getFlowState(redis, state.conversationId)
      if (u?.phase === 'prd_clarify' && u.waitingForReply) return { bddStage: 'prd_clarify' }
      if (u?.phase === 'spec_clarify' && u.waitingForReply) return { bddStage: 'prd_clarify' }
      if (u?.phase === 'prd_clarify' && !u.waitingForReply) return { bddStage: 'prd_discovery' }
      if (u?.phase === 'formulation') return { bddStage: 'formulation' }
      if (u?.phase === 'spec_completed' || u?.phase === 'uiux_design_preference') return { bddStage: 'complete' }
      return { bddStage: u?.phase ?? 'error' }
    }
    if (p === 'formulation_draft_review') {
      await handleFormulationDraftReview(state.conversationId, flowState, state.message, redis, io)
      const u = await getFlowState(redis, state.conversationId)
      if (u?.phase === 'spec_discovery') return { bddStage: 'spec_discovery' }
      if (u?.phase === 'formulation') return { bddStage: 'formulation' }
      if (u?.phase === 'spec_completed' || u?.phase === 'uiux_design_preference') return { bddStage: 'complete' }
      return { bddStage: u?.phase ?? 'error' }
    }
  }

  // 非 waitingForReply 的進行中 phase（stale recovery 場景）
  if (flowState?.phase === 'prd_discovery' || flowState?.phase === 'formulation' ||
      flowState?.phase === 'spec_discovery') {
    return { bddStage: flowState.phase }
  }

  // 新 BDD flow — 先建 task 取得真正的 UUID
  const taskId = await db.createTask({ projectId: state.projectId, userId: state.userId, goal: state.message, status: 'planning' })
  if (!taskId) throw new Error('創建任務失敗')
  await db.updateTask(taskId, { status: 'executing', plan: { skill: 'bdd-spec' } })

  await executeBddSpecSkill({
    taskId, projectId: state.projectId, conversationId: state.conversationId,
    userId: state.userId, message: state.message,
    locale: (state.locale || 'zh') as 'zh' | 'en', redis, io,
  })

  const updated = await getFlowState(redis, state.conversationId)
  if (updated?.phase === 'es_init') return { bddStage: 'es_init' }
  if (updated?.phase === 'prd_clarify') return { bddStage: 'prd_clarify' }
  if (updated?.phase === 'prd_discovery') return { bddStage: 'prd_discovery' }
  return { bddStage: 'error' }
}

// ============================================================
// Node 2: es_init_wait — ES 初始確認（interrupt）
// ============================================================

async function esInitWaitNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()

  const reply: string = interrupt({ type: 'es_init' })

  const flowState = await getFlowState(redis, state.conversationId)
  if (!flowState) return { bddStage: 'error' }

  await handleESInitReply(state.conversationId, flowState, reply, redis, io)

  const updated = await getFlowState(redis, state.conversationId)
  if (!updated) return { bddStage: 'error' }

  if (updated.phase === 'es_explore' && updated.waitingForReply) return { bddStage: 'es_explore' }
  if (updated.phase === 'prd_clarify') return { bddStage: 'prd_clarify' }
  if (updated.phase === 'prd_discovery') return { bddStage: 'prd_discovery' }
  if (updated.phase === 'es_init') return { bddStage: 'es_init' }  // user feedback → re-init

  return { bddStage: updated.phase }
}

// ============================================================
// Node 3: es_explore_wait — ES DFS 探索（interrupt, loop）
// ============================================================

async function esExploreWaitNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()

  const reply: string = interrupt({ type: 'es_explore' })

  const flowState = await getFlowState(redis, state.conversationId)
  if (!flowState) return { bddStage: 'error' }

  await handleESExploreReply(state.conversationId, flowState, reply, redis, io)

  const updated = await getFlowState(redis, state.conversationId)
  if (!updated) return { bddStage: 'error' }

  if (updated.phase === 'es_explore' && updated.waitingForReply) return { bddStage: 'es_explore_loop' }
  if (updated.phase === 'prd_clarify') return { bddStage: 'prd_clarify' }
  if (updated.phase === 'prd_discovery') return { bddStage: 'prd_discovery' }

  return { bddStage: updated.phase }
}

// ============================================================
// Node 4: prd_clarify_wait — 核心釐清 loop（interrupt）
// 統一處理 prd_clarify + spec_clarify + batch_confirm
// ============================================================

async function prdClarifyWaitNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()

  // question 已由 entry / prd_next_round / processUserReply 送出
  const reply: string = interrupt({ type: 'bdd_clarify' })

  const flowState = await getFlowState(redis, state.conversationId)
  if (!flowState) return { bddStage: 'error' }

  // 委派給現有 handler（processUserReply 處理所有分支）
  await handleBddWaitingForReply(state.conversationId, flowState, reply, redis, io)

  const updated = await getFlowState(redis, state.conversationId)
  if (!updated) return { bddStage: 'error' }

  // 仍在 clarify（下一題 or batch confirm）→ loop
  if ((updated.phase === 'prd_clarify' || updated.phase === 'spec_clarify') && updated.waitingForReply) {
    return { bddStage: 'clarify_loop' }
  }
  // 需要下一輪 PRD discovery（waitingForReply=false 表示需要生成新問題）
  if (updated.phase === 'prd_clarify' && !updated.waitingForReply) {
    return { bddStage: 'next_round' }
  }
  // 進入 formulation
  if (updated.phase === 'formulation' || updated.phase === 'formulation_draft_review') {
    return { bddStage: 'formulation' }
  }
  // 進入 spec discovery
  if (updated.phase === 'spec_discovery') return { bddStage: 'spec_discovery' }
  // BDD 完成
  if (updated.phase === 'uiux_design_preference' || updated.phase === 'spec_completed') {
    return { bddStage: 'complete' }
  }

  return { bddStage: updated.phase }
}

// ============================================================
// Node 5: prd_next_round — 生成下一輪 PRD 問題（無 interrupt）
// ============================================================

async function prdNextRoundNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const flowState = await getFlowState(redis, state.conversationId)
  if (!flowState) return { bddStage: 'error' }

  // completeClärifyPhase 內部會生成新問題或進入 formulation
  // 它透過 processUserReply 的 '完成釐清' 分支或 continueToNextQuestion 的 pending===0 觸發
  // 此時 FlowState.phase = 'prd_clarify' 但 waitingForReply = false
  // 表示需要更多 discovery → handler 已在之前呼叫中處理

  // 重新讀取 FlowState 確認最新狀態
  const updated = await getFlowState(redis, state.conversationId)
  if (!updated) return { bddStage: 'error' }

  if (updated.phase === 'prd_clarify' && updated.waitingForReply) return { bddStage: 'prd_clarify' }
  if (updated.phase === 'formulation' || updated.phase === 'formulation_draft_review') return { bddStage: 'formulation' }

  return { bddStage: updated.phase }
}

// ============================================================
// Node 6: formulation — 生成 Features（無 interrupt）
// ============================================================

async function formulationNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const flowState = await getFlowState(redis, state.conversationId)
  if (!flowState) return { bddStage: 'error' }

  // formulation phase 的生成由 finishClarifyAndStartFormulation 驅動
  // 如果 phase 已經是 formulation_draft_review，說明生成完成
  if (flowState.phase === 'formulation_draft_review' && flowState.waitingForReply) {
    return { bddStage: 'draft_review' }
  }
  // 如果 phase 是 spec_discovery，說明 formulation 完成（no draft mode）
  if (flowState.phase === 'spec_discovery') {
    return { bddStage: 'spec_discovery' }
  }
  // 如果 phase 是 spec_clarify，說明已進入 spec 修正
  if (flowState.phase === 'spec_clarify' && flowState.waitingForReply) {
    return { bddStage: 'prd_clarify' }  // reuse clarify loop
  }
  // 如果 phase 是 spec_completed 或 uiux_design_preference，BDD 完成
  if (flowState.phase === 'spec_completed' || flowState.phase === 'uiux_design_preference') {
    return { bddStage: 'complete' }
  }

  return { bddStage: flowState.phase }
}

// ============================================================
// Node 7: draft_review_wait — Formulation Draft 審閱（interrupt）
// ============================================================

async function draftReviewWaitNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()

  const reply: string = interrupt({ type: 'bdd_draft_review' })

  const flowState = await getFlowState(redis, state.conversationId)
  if (!flowState) return { bddStage: 'error' }

  await handleFormulationDraftReview(state.conversationId, flowState, reply, redis, io)

  const updated = await getFlowState(redis, state.conversationId)
  if (!updated) return { bddStage: 'error' }

  if (updated.phase === 'spec_discovery') return { bddStage: 'spec_discovery' }
  if (updated.phase === 'formulation') return { bddStage: 'formulation' }  // adjust → re-formulate
  if (updated.phase === 'formulation_draft_review') return { bddStage: 'draft_review' }  // loop
  if (updated.phase === 'spec_clarify' && updated.waitingForReply) return { bddStage: 'prd_clarify' }
  if (updated.phase === 'spec_completed' || updated.phase === 'uiux_design_preference') {
    return { bddStage: 'complete' }
  }

  return { bddStage: updated.phase }
}

// ============================================================
// Node 8: spec_discovery — Spec 審計（無 interrupt）
// ============================================================

async function specDiscoveryNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const flowState = await getFlowState(redis, state.conversationId)
  if (!flowState) return { bddStage: 'error' }

  // spec_discovery 的邏輯由 startSpecDiscovery 驅動（已在 formulation 完成時呼叫）
  // 讀取 FlowState 判斷結果
  if (flowState.phase === 'spec_clarify' && flowState.waitingForReply) {
    return { bddStage: 'prd_clarify' }  // reuse clarify loop for spec issues
  }
  if (flowState.phase === 'spec_completed' || flowState.phase === 'uiux_design_preference') {
    return { bddStage: 'complete' }
  }

  return { bddStage: flowState.phase }
}

// ============================================================
// Node 9: complete_spec — BDD 完成（無 interrupt）
// ============================================================

async function completeSpecNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const flowState = await getFlowState(redis, state.conversationId)
  if (!flowState) return { bddStage: 'complete' }

  // 如果還沒執行 completeSpecPhase，執行它
  if (flowState.phase === 'spec_discovery' || flowState.phase === 'spec_clarify') {
    await completeSpecPhase(state.conversationId, flowState, redis, io)
  }

  const updated = await getFlowState(redis, state.conversationId)
  return { bddStage: 'complete', phase: updated?.phase ?? 'spec_completed' }
}

// ============================================================
// Node 10: spec_change_wait — Spec 變更確認（interrupt, sidecar）
// ============================================================

async function specChangeWaitNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()

  const reply: string = interrupt({ type: 'spec_change_confirm' })

  const flowState = await getFlowState(redis, state.conversationId)
  if (!flowState) return { bddStage: 'complete' }

  await handleSpecChangeConfirm(state.conversationId, flowState, reply, redis, io)

  const updated = await getFlowState(redis, state.conversationId)
  return { bddStage: 'complete', phase: updated?.phase ?? 'spec_completed' }
}

// ============================================================
// Node 11: spec_rollback_wait — Spec 回滾選擇（interrupt, sidecar）
// ============================================================

async function specRollbackWaitNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()

  const reply: string = interrupt({ type: 'spec_rollback_select' })

  const flowState = await getFlowState(redis, state.conversationId)
  if (!flowState) return { bddStage: 'complete' }

  await handleSpecRollbackSelect(state.conversationId, flowState, reply, redis, io)

  const updated = await getFlowState(redis, state.conversationId)
  return { bddStage: 'complete', phase: updated?.phase ?? 'spec_completed' }
}

// ============================================================
// Edge routing
// ============================================================

function afterEntry(state: TellcraftStateType): string {
  const s = state.bddStage
  if (s === 'es_init') return 'es_init_wait'
  if (s === 'es_explore') return 'es_explore_wait'
  if (s === 'prd_clarify') return 'prd_clarify_wait'
  if (s === 'prd_discovery') return 'prd_next_round'
  if (s === 'formulation' || s === 'formulation_draft_review') return 'formulation'
  if (s === 'draft_review') return 'draft_review_wait'
  if (s === 'spec_discovery') return 'spec_discovery'
  if (s === 'spec_change') return 'spec_change_wait'
  if (s === 'spec_rollback') return 'spec_rollback_wait'
  return 'end'
}

function afterEsInit(state: TellcraftStateType): string {
  const s = state.bddStage
  if (s === 'es_explore') return 'es_explore_wait'
  if (s === 'prd_clarify') return 'prd_clarify_wait'
  if (s === 'prd_discovery') return 'prd_next_round'
  if (s === 'es_init') return 'es_init_wait'  // re-init loop
  return 'end'
}

function afterEsExplore(state: TellcraftStateType): string {
  const s = state.bddStage
  if (s === 'es_explore_loop') return 'es_explore_wait'  // DFS loop
  if (s === 'prd_clarify') return 'prd_clarify_wait'
  if (s === 'prd_discovery') return 'prd_next_round'
  return 'end'
}

function afterClarify(state: TellcraftStateType): string {
  const s = state.bddStage
  if (s === 'clarify_loop') return 'prd_clarify_wait'  // next question loop
  if (s === 'next_round') return 'prd_next_round'
  if (s === 'formulation') return 'formulation'
  if (s === 'spec_discovery') return 'spec_discovery'
  if (s === 'complete') return 'complete_spec'
  return 'end'
}

function afterNextRound(state: TellcraftStateType): string {
  const s = state.bddStage
  if (s === 'prd_clarify') return 'prd_clarify_wait'  // new questions generated
  if (s === 'formulation') return 'formulation'
  return 'end'
}

function afterFormulation(state: TellcraftStateType): string {
  const s = state.bddStage
  if (s === 'draft_review') return 'draft_review_wait'
  if (s === 'spec_discovery') return 'spec_discovery'
  if (s === 'prd_clarify') return 'prd_clarify_wait'  // spec issues
  if (s === 'complete') return 'complete_spec'
  return 'end'
}

function afterDraftReview(state: TellcraftStateType): string {
  const s = state.bddStage
  if (s === 'spec_discovery') return 'spec_discovery'
  if (s === 'formulation') return 'formulation'  // adjust loop
  if (s === 'draft_review') return 'draft_review_wait'  // re-confirm
  if (s === 'prd_clarify') return 'prd_clarify_wait'
  if (s === 'complete') return 'complete_spec'
  return 'end'
}

function afterSpecDiscovery(state: TellcraftStateType): string {
  const s = state.bddStage
  if (s === 'prd_clarify') return 'prd_clarify_wait'  // spec issues → reuse clarify
  if (s === 'complete') return 'complete_spec'
  return 'complete_spec'
}

// ============================================================
// Build
// ============================================================

export function buildBddSubgraph() {
  return new StateGraph(TellcraftState)
    .addNode('entry', entryNode)
    .addNode('es_init_wait', esInitWaitNode)           // interrupt
    .addNode('es_explore_wait', esExploreWaitNode)     // interrupt
    .addNode('prd_clarify_wait', prdClarifyWaitNode)   // interrupt (unified clarify loop)
    .addNode('prd_next_round', prdNextRoundNode)
    .addNode('formulation', formulationNode)
    .addNode('draft_review_wait', draftReviewWaitNode) // interrupt
    .addNode('spec_discovery', specDiscoveryNode)
    .addNode('complete_spec', completeSpecNode)
    .addNode('spec_change_wait', specChangeWaitNode)   // interrupt (sidecar)
    .addNode('spec_rollback_wait', specRollbackWaitNode) // interrupt (sidecar)

    .addEdge(START, 'entry')
    .addConditionalEdges('entry', afterEntry, {
      es_init_wait: 'es_init_wait',
      es_explore_wait: 'es_explore_wait',
      prd_clarify_wait: 'prd_clarify_wait',
      prd_next_round: 'prd_next_round',
      formulation: 'formulation',
      draft_review_wait: 'draft_review_wait',
      spec_discovery: 'spec_discovery',
      spec_change_wait: 'spec_change_wait',
      spec_rollback_wait: 'spec_rollback_wait',
      end: END,
    })
    .addConditionalEdges('es_init_wait', afterEsInit, {
      es_explore_wait: 'es_explore_wait',
      prd_clarify_wait: 'prd_clarify_wait',
      prd_next_round: 'prd_next_round',
      es_init_wait: 'es_init_wait',
      end: END,
    })
    .addConditionalEdges('es_explore_wait', afterEsExplore, {
      es_explore_wait: 'es_explore_wait',  // DFS loop
      prd_clarify_wait: 'prd_clarify_wait',
      prd_next_round: 'prd_next_round',
      end: END,
    })
    .addConditionalEdges('prd_clarify_wait', afterClarify, {
      prd_clarify_wait: 'prd_clarify_wait', // question loop
      prd_next_round: 'prd_next_round',
      formulation: 'formulation',
      spec_discovery: 'spec_discovery',
      complete_spec: 'complete_spec',
      end: END,
    })
    .addConditionalEdges('prd_next_round', afterNextRound, {
      prd_clarify_wait: 'prd_clarify_wait',
      formulation: 'formulation',
      end: END,
    })
    .addConditionalEdges('formulation', afterFormulation, {
      draft_review_wait: 'draft_review_wait',
      spec_discovery: 'spec_discovery',
      prd_clarify_wait: 'prd_clarify_wait',
      complete_spec: 'complete_spec',
      end: END,
    })
    .addConditionalEdges('draft_review_wait', afterDraftReview, {
      spec_discovery: 'spec_discovery',
      formulation: 'formulation',      // adjust loop
      draft_review_wait: 'draft_review_wait',
      prd_clarify_wait: 'prd_clarify_wait',
      complete_spec: 'complete_spec',
      end: END,
    })
    .addConditionalEdges('spec_discovery', afterSpecDiscovery, {
      prd_clarify_wait: 'prd_clarify_wait', // spec issues
      complete_spec: 'complete_spec',
    })
    .addEdge('complete_spec', END)
    .addEdge('spec_change_wait', END)
    .addEdge('spec_rollback_wait', END)
    .compile()
}
