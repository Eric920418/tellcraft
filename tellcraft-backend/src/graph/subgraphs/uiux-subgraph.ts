/**
 * UIUX Skill Subgraph — 前端介面設計
 *
 * Graph 結構（每個 node 最多 1 個 interrupt）：
 *   START → entry → afterEntry?
 *     ├─ preference_wait (interrupt) → clarify_wait / template_wait
 *     ├─ clarify_wait (interrupt, 4-step loop) → brief_confirm_wait
 *     ├─ brief_confirm_wait (interrupt, adjust loop max 3) → variant_wait
 *     ├─ template_wait (interrupt) → brief_confirm_wait
 *     ├─ variant_wait (interrupt) → code_pipeline
 *     ├─ code_pipeline → complete → END
 *     ├─ mixed_routing → 任一 wait node / code_pipeline / END
 *     └─ END
 *
 * 所有 interrupt node 委派給現有 handler 函數（0 業務邏輯改動）。
 */
import { StateGraph, START, END, interrupt } from '@langchain/langgraph'
import { TellcraftState, type TellcraftStateType } from '../state'
import { getRedis, getIo } from '../context'
import { getFlowState } from '../../workers/orchestrator-utils'
import {
  handleDesignPreferenceReply,
  handleDesignClarifyReply,
  handleDesignBriefReply,
  handleTemplateSelection,
  handleVariantSelection,
  executeFullCodePipeline,
  handleUiuxCodeGenerating,
  handleUiuxIterating,
  handleUiuxMixedPhaseRouting,
} from '../../workers/phase-handlers/uiux-phases'
import { routePhase } from '../../workers/phase-router'
import { createLogger } from '../../lib/logger'

const logger = createLogger('uiux-subgraph')

// ── Helper：FlowState phase → uiuxStage ──

function phaseToStage(phase: string | undefined): string {
  if (!phase) return 'end'
  if (phase === 'uiux_design_preference') return 'preference'
  if (phase === 'uiux_design_clarify') return 'clarify'
  if (phase === 'uiux_design_brief_confirm') return 'brief_confirm'
  if (phase === 'uiux_template_selection') return 'template'
  if (phase === 'uiux_variant_selection' || phase === 'uiux_generating_variants') return 'variant'
  if (phase === 'uiux_code_generation' || phase === 'uiux_quality_gate') return 'code_pipeline'
  if (phase === 'spec_completed' || phase === 'uiux_complete') return 'mixed'
  return 'end'
}

// ============================================================
// Node 1: entry — 讀 FlowState phase 分派
// ============================================================

async function entryNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const flowState = await getFlowState(redis, state.conversationId)
  if (!flowState) return { uiuxStage: 'error' }

  const phase = flowState.phase

  // Stale/timeout recovery（code generation 或 iteration 進行中）
  if ((phase === 'uiux_code_generation' || phase === 'uiux_quality_gate') && !flowState.waitingForReply) {
    await handleUiuxCodeGenerating(state.conversationId, flowState, redis, io)
    const u = await getFlowState(redis, state.conversationId)
    return { uiuxStage: phaseToStage(u?.phase) }
  }
  if (phase === 'uiux_iterating') {
    await handleUiuxIterating(state.conversationId, flowState, redis, io)
    const u = await getFlowState(redis, state.conversationId)
    return { uiuxStage: phaseToStage(u?.phase) }
  }

  // 直接路由到對應 wait node
  return { uiuxStage: phaseToStage(phase) }
}

// ============================================================
// Node 2: preference_wait — 設計偏好（interrupt）
// ============================================================

async function preferenceWaitNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()

  const reply: string = interrupt({ type: 'uiux_preference' })

  const flowState = await getFlowState(redis, state.conversationId)
  if (!flowState) return { uiuxStage: 'error' }

  await handleDesignPreferenceReply(state.conversationId, flowState, reply, redis, io)

  const updated = await getFlowState(redis, state.conversationId)
  return { uiuxStage: phaseToStage(updated?.phase) }
}

// ============================================================
// Node 3: clarify_wait — 4-step 設計探索（interrupt, graph edge loop）
// ============================================================

async function clarifyWaitNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()

  const reply: string = interrupt({ type: 'uiux_clarify' })

  const flowState = await getFlowState(redis, state.conversationId)
  if (!flowState) return { uiuxStage: 'error' }

  await handleDesignClarifyReply(state.conversationId, flowState, reply, redis, io, state.imageUrls)

  const updated = await getFlowState(redis, state.conversationId)
  if (!updated) return { uiuxStage: 'error' }

  // 仍在 clarify（下一步）→ loop
  if (updated.phase === 'uiux_design_clarify' && updated.waitingForReply) return { uiuxStage: 'clarify' }

  return { uiuxStage: phaseToStage(updated.phase) }
}

// ============================================================
// Node 4: brief_confirm_wait — Design Brief 確認/調整（interrupt, max 3 輪 loop）
// ============================================================

async function briefConfirmWaitNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()

  const reply: string = interrupt({ type: 'uiux_brief_confirm' })

  const flowState = await getFlowState(redis, state.conversationId)
  if (!flowState) return { uiuxStage: 'error' }

  await handleDesignBriefReply(state.conversationId, flowState, reply, redis, io)

  const updated = await getFlowState(redis, state.conversationId)
  if (!updated) return { uiuxStage: 'error' }

  // brief adjust loop
  if (updated.phase === 'uiux_design_brief_confirm' && updated.waitingForReply) return { uiuxStage: 'brief_confirm' }

  return { uiuxStage: phaseToStage(updated.phase) }
}

// ============================================================
// Node 5: template_wait — 模板選擇（interrupt）
// ============================================================

async function templateWaitNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()

  const reply: string = interrupt({ type: 'uiux_template' })

  const flowState = await getFlowState(redis, state.conversationId)
  if (!flowState) return { uiuxStage: 'error' }

  // 委派給 routePhase（內部會分派到 handleTemplateSelection 或 handleTemplateNaturalSelection）
  await routePhase(
    { conversationId: state.conversationId, projectId: state.projectId,
      userId: state.userId, message: reply,
      locale: (state.locale || 'zh') as 'zh' | 'en', imageUrls: state.imageUrls },
    flowState, reply.trim(), redis, io
  )

  const updated = await getFlowState(redis, state.conversationId)
  return { uiuxStage: phaseToStage(updated?.phase) }
}

// ============================================================
// Node 6: variant_wait — Variant 選擇（interrupt）
// ============================================================

async function variantWaitNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()

  const reply: string = interrupt({ type: 'uiux_variant' })

  const flowState = await getFlowState(redis, state.conversationId)
  if (!flowState) return { uiuxStage: 'error' }

  await handleVariantSelection(state.conversationId, flowState, reply, redis, io)

  const updated = await getFlowState(redis, state.conversationId)
  if (!updated) return { uiuxStage: 'error' }

  // invalid selection → loop
  if (updated.phase === 'uiux_variant_selection' && updated.waitingForReply) return { uiuxStage: 'variant' }

  return { uiuxStage: phaseToStage(updated.phase) }
}

// ============================================================
// Node 7: code_pipeline — Structure → Animation → RWD → QG（無 interrupt）
// ============================================================

async function codePipelineNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const flowState = await getFlowState(redis, state.conversationId)
  if (!flowState) return { uiuxStage: 'error' }

  // executeFullCodePipeline 內部有 heartbeat + checkpoint callback
  // 簽名：(conversationId, state, redis, io)
  await executeFullCodePipeline(state.conversationId, flowState, redis, io)

  const updated = await getFlowState(redis, state.conversationId)
  return { uiuxStage: phaseToStage(updated?.phase), phase: updated?.phase ?? 'uiux_complete' }
}

// ============================================================
// Node 8: mixed_routing — spec_completed / uiux_complete 多方向分派
// ============================================================

async function mixedRoutingNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const flowState = await getFlowState(redis, state.conversationId)
  if (!flowState) return { uiuxStage: 'end' }

  await handleUiuxMixedPhaseRouting(
    {
      conversationId: state.conversationId, projectId: state.projectId,
      userId: state.userId, message: state.message,
      locale: (state.locale || 'zh') as 'zh' | 'en', imageUrls: state.imageUrls,
    },
    flowState, state.message.trim(), state.message, redis, io
  )

  const updated = await getFlowState(redis, state.conversationId)
  return { uiuxStage: phaseToStage(updated?.phase) }
}

// ============================================================
// ============================================================
// Edge routing
// ============================================================

function afterEntry(state: TellcraftStateType): string {
  const s = state.uiuxStage
  if (s === 'preference') return 'preference_wait'
  if (s === 'clarify') return 'clarify_wait'
  if (s === 'brief_confirm') return 'brief_confirm_wait'
  if (s === 'template') return 'template_wait'
  if (s === 'variant') return 'variant_wait'
  if (s === 'code_pipeline') return 'code_pipeline'
  if (s === 'mixed') return 'mixed_routing'
  return 'end'
}

function afterPreference(state: TellcraftStateType): string {
  const s = state.uiuxStage
  if (s === 'clarify') return 'clarify_wait'
  if (s === 'template') return 'template_wait'
  if (s === 'preference') return 'preference_wait'  // loop
  return 'end'
}

function afterClarify(state: TellcraftStateType): string {
  const s = state.uiuxStage
  if (s === 'clarify') return 'clarify_wait'  // 4-step loop
  if (s === 'brief_confirm') return 'brief_confirm_wait'
  if (s === 'preference') return 'preference_wait'  // go_back
  return 'end'
}

function afterBriefConfirm(state: TellcraftStateType): string {
  const s = state.uiuxStage
  if (s === 'variant') return 'variant_wait'  // confirmed → variants
  if (s === 'brief_confirm') return 'brief_confirm_wait'  // adjust loop
  if (s === 'template') return 'template_wait'
  if (s === 'preference') return 'preference_wait'  // go_back
  if (s === 'code_pipeline') return 'code_pipeline'
  return 'end'
}

function afterTemplate(state: TellcraftStateType): string {
  const s = state.uiuxStage
  if (s === 'brief_confirm') return 'brief_confirm_wait'
  if (s === 'preference') return 'preference_wait'  // go_back
  if (s === 'template') return 'template_wait'  // invalid → loop
  return 'end'
}

function afterVariant(state: TellcraftStateType): string {
  const s = state.uiuxStage
  if (s === 'code_pipeline') return 'code_pipeline'
  if (s === 'variant') return 'variant_wait'  // invalid → loop
  if (s === 'brief_confirm') return 'brief_confirm_wait'  // go_back
  return 'end'
}

function afterPipeline(state: TellcraftStateType): string {
  const s = state.uiuxStage
  if (s === 'mixed') return 'mixed_routing'  // complete
  if (s === 'variant') return 'variant_wait'  // pipeline failed
  return 'end'
}

function afterMixed(state: TellcraftStateType): string {
  const s = state.uiuxStage
  if (s === 'preference') return 'preference_wait'
  if (s === 'clarify') return 'clarify_wait'
  if (s === 'brief_confirm') return 'brief_confirm_wait'
  if (s === 'template') return 'template_wait'
  if (s === 'variant') return 'variant_wait'
  if (s === 'code_pipeline') return 'code_pipeline'
  return 'end'
}

// ============================================================
// Build
// ============================================================

export function buildUiuxSubgraph() {
  return new StateGraph(TellcraftState)
    .addNode('entry', entryNode)
    .addNode('preference_wait', preferenceWaitNode)        // interrupt
    .addNode('clarify_wait', clarifyWaitNode)              // interrupt (4-step loop)
    .addNode('brief_confirm_wait', briefConfirmWaitNode)   // interrupt (adjust loop)
    .addNode('template_wait', templateWaitNode)            // interrupt
    .addNode('variant_wait', variantWaitNode)              // interrupt
    .addNode('code_pipeline', codePipelineNode)
    .addNode('mixed_routing', mixedRoutingNode)
    .addEdge(START, 'entry')
    .addConditionalEdges('entry', afterEntry, {
      preference_wait: 'preference_wait',
      clarify_wait: 'clarify_wait',
      brief_confirm_wait: 'brief_confirm_wait',
      template_wait: 'template_wait',
      variant_wait: 'variant_wait',
      code_pipeline: 'code_pipeline',
      mixed_routing: 'mixed_routing',
      end: END,
    })
    .addConditionalEdges('preference_wait', afterPreference, {
      clarify_wait: 'clarify_wait',
      template_wait: 'template_wait',
      preference_wait: 'preference_wait',
      end: END,
    })
    .addConditionalEdges('clarify_wait', afterClarify, {
      clarify_wait: 'clarify_wait',           // 4-step loop
      brief_confirm_wait: 'brief_confirm_wait',
      preference_wait: 'preference_wait',     // go_back
      end: END,
    })
    .addConditionalEdges('brief_confirm_wait', afterBriefConfirm, {
      variant_wait: 'variant_wait',
      brief_confirm_wait: 'brief_confirm_wait', // adjust loop
      template_wait: 'template_wait',
      preference_wait: 'preference_wait',
      code_pipeline: 'code_pipeline',
      end: END,
    })
    .addConditionalEdges('template_wait', afterTemplate, {
      brief_confirm_wait: 'brief_confirm_wait',
      preference_wait: 'preference_wait',
      template_wait: 'template_wait',
      end: END,
    })
    .addConditionalEdges('variant_wait', afterVariant, {
      code_pipeline: 'code_pipeline',
      variant_wait: 'variant_wait',            // invalid → loop
      brief_confirm_wait: 'brief_confirm_wait',
      end: END,
    })
    .addConditionalEdges('code_pipeline', afterPipeline, {
      mixed_routing: 'mixed_routing',
      variant_wait: 'variant_wait',
      end: END,
    })
    .addConditionalEdges('mixed_routing', afterMixed, {
      preference_wait: 'preference_wait',
      clarify_wait: 'clarify_wait',
      brief_confirm_wait: 'brief_confirm_wait',
      template_wait: 'template_wait',
      variant_wait: 'variant_wait',
      code_pipeline: 'code_pipeline',
      end: END,
    })
    .compile()
}
