/**
 * LangGraph State 定義 — Tellcraft Orchestrator
 *
 * 設計原則：Pointer State Pattern
 * - State 只存路由需要的輕量 metadata（~1KB）
 * - 大資料存在 Redis + PostgreSQL（現有機制）
 * - Node 內部用 getFlowState(redis, conversationId) 讀完整 state
 */
import { Annotation } from '@langchain/langgraph'

// Last-write-wins reducer（簡單覆蓋）
const lastValue = <T>(_a: T, b: T) => b

export const TellcraftState = Annotation.Root({
  // ── 路由 context ──
  conversationId: Annotation<string>({
    value: lastValue,
    default: () => '',
  }),
  projectId: Annotation<string>({
    value: lastValue,
    default: () => '',
  }),
  userId: Annotation<string>({
    value: lastValue,
    default: () => '',
  }),

  // ── 當前用戶輸入 ──
  message: Annotation<string>({
    value: lastValue,
    default: () => '',
  }),
  imageUrls: Annotation<string[]>({
    value: lastValue,
    default: () => [],
  }),
  mode: Annotation<string>({
    value: lastValue,
    default: () => 'fine',
  }),
  locale: Annotation<string>({
    value: lastValue,
    default: () => 'zh',
  }),

  // ── Phase 路由 ──
  phase: Annotation<string>({
    value: lastValue,
    default: () => 'idle',
  }),
  waitingForReply: Annotation<boolean>({
    value: lastValue,
    default: () => false,
  }),
  fastBuildStage: Annotation<string>({
    value: lastValue,
    default: () => '',
  }),

  // ── 路由決策 ──
  skillIntent: Annotation<string>({
    value: lastValue,
    default: () => '',
  }),

  // ── 錯誤 ──
  error: Annotation<string | null>({
    value: lastValue,
    default: () => null,
  }),

  // ── 特殊 token ──
  specialToken: Annotation<string>({
    value: lastValue,
    default: () => '',
  }),

  // ── Subgraph 路由用 ──
  coderStage: Annotation<string>({
    value: lastValue,
    default: () => '',
  }),
  // 'idle' | 'red_phase_done' | 'blocked' | 'alignment_done' | 'generated' | 'test_passed' | 'test_failed' | 'fixed'

  domainSource: Annotation<string>({
    value: lastValue,
    default: () => '',
  }),
  // 'purchase' | 'own' | 'confirmed' | ''

  testRound: Annotation<number>({
    value: lastValue,
    default: () => 0,
  }),
  // Coder fix loop 當前輪次

  bddStage: Annotation<string>({
    value: lastValue,
    default: () => '',
  }),
  // BDD subgraph 內部路由

  uiuxStage: Annotation<string>({
    value: lastValue,
    default: () => '',
  }),
  // UIUX subgraph 內部路由
})

export type TellcraftStateType = typeof TellcraftState.State
