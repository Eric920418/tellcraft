/**
 * Tellcraft Main Graph — LangGraph StateGraph 定義
 *
 * 架構：
 * - classify → 意圖分類（idle 時）或 phase 同步（進行中）
 * - phase_router → 根據 phase 路由到具體 skill
 * - skill subgraphs → 每個 skill 是獨立的 StateGraph 子圖
 * - complete → graph 結束，等用戶下一個訊息
 *
 * 每個用戶訊息 = 一次 graph invocation。
 * 長時運行的 flow 靠 FlowState（Redis + PostgreSQL）跨 invocation 保持狀態。
 */
import { StateGraph, START, END } from '@langchain/langgraph'
import type { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import { TellcraftState, type TellcraftStateType } from './state'

// Node imports
import { classifyNode } from './nodes/classify'
import { phaseRouterNode } from './nodes/phase-router'
import { completeNode } from './nodes/complete'

// Subgraph imports
import { buildBddSubgraph } from './subgraphs/bdd-subgraph'
import { buildUiuxSubgraph } from './subgraphs/uiux-subgraph'
import { buildFastBuildSubgraph } from './subgraphs/fast-build-subgraph'
import { buildCoderSubgraph } from './subgraphs/coder-subgraph'
import { buildDeployerSubgraph } from './subgraphs/deployer-subgraph'
import { buildDomainSubgraph } from './subgraphs/domain-subgraph'
import { buildCloneSubgraph } from './subgraphs/clone-subgraph'

// ── Edge routing functions ──

function routeByIntent(state: TellcraftStateType): string {
  // 特殊 token 處理
  if (state.specialToken === '__new_project__') return 'end'

  // 已有進行中的 flow → phase_router
  if (state.skillIntent === 'continue_flow') return 'continue_flow'

  // 根據意圖路由
  const intent = state.skillIntent
  if (intent === 'bdd') return 'bdd'
  if (intent === 'uiux') return 'uiux'
  if (intent === 'fast') return 'fast'
  if (intent === 'coder') return 'coder'
  if (intent === 'deploy') return 'deploy'
  if (intent === 'domain') return 'domain'
  if (intent === 'clone') return 'clone'

  return 'meta'
}

function routeByPhase(state: TellcraftStateType): string {
  const phase = state.phase

  // BDD phases
  if (
    phase.startsWith('es_') ||
    phase.startsWith('prd_') ||
    phase.startsWith('spec_') ||
    phase === 'formulation' ||
    phase === 'formulation_draft_review'
  ) return 'bdd'

  // UIUX phases
  if (phase.startsWith('uiux_') || phase === 'spec_completed') return 'uiux'

  // Fast Build
  if (phase === 'fast_generating') return 'fast'

  // Coder
  if (phase.startsWith('coder_')) return 'coder'

  // Deployer
  if (phase.startsWith('deployer_')) return 'deploy'

  // Domain
  if (phase.startsWith('domain_')) return 'domain'

  // Clone
  if (phase.startsWith('clone_')) return 'clone'

  return 'complete'
}

function afterSkill(_state: TellcraftStateType): string {
  // Skill 執行後，graph 結束。
  // 用戶的下一個訊息會重新觸發 graph（從 classify 開始）。
  return 'end'
}

// ── Graph Builder ──

export function buildMainGraph(checkpointer?: PostgresSaver) {
  const builder = new StateGraph(TellcraftState)
    // ── Nodes ──
    .addNode('classify', classifyNode)
    .addNode('phase_router', phaseRouterNode)
    .addNode('bdd_skill', buildBddSubgraph())
    .addNode('uiux_skill', buildUiuxSubgraph())
    .addNode('fast_build', buildFastBuildSubgraph())
    .addNode('coder_skill', buildCoderSubgraph())
    .addNode('deployer', buildDeployerSubgraph())
    .addNode('domain_skill', buildDomainSubgraph())
    .addNode('clone_skill', buildCloneSubgraph())
    .addNode('complete', completeNode)

    // ── Entry edge ──
    .addEdge(START, 'classify')

    // ── Classify → Skill routing ──
    .addConditionalEdges('classify', routeByIntent, {
      bdd: 'bdd_skill',
      uiux: 'uiux_skill',
      fast: 'fast_build',
      coder: 'coder_skill',
      deploy: 'deployer',
      domain: 'domain_skill',
      clone: 'clone_skill',
      continue_flow: 'phase_router',
      meta: 'complete',
      end: END,
    })

    // ── Phase router → Skill routing ──
    .addConditionalEdges('phase_router', routeByPhase, {
      bdd: 'bdd_skill',
      uiux: 'uiux_skill',
      fast: 'fast_build',
      coder: 'coder_skill',
      deploy: 'deployer',
      domain: 'domain_skill',
      clone: 'clone_skill',
      complete: 'complete',
    })

    // ── Skill → End ──
    .addConditionalEdges('bdd_skill', afterSkill, { end: END })
    .addConditionalEdges('uiux_skill', afterSkill, { end: END })
    .addConditionalEdges('fast_build', afterSkill, { end: END })
    .addConditionalEdges('coder_skill', afterSkill, { end: END })
    .addConditionalEdges('deployer', afterSkill, { end: END })
    .addConditionalEdges('domain_skill', afterSkill, { end: END })
    .addConditionalEdges('clone_skill', afterSkill, { end: END })

    // ── Complete → End ──
    .addEdge('complete', END)

  return checkpointer ? builder.compile({ checkpointer }) : builder.compile()
}
