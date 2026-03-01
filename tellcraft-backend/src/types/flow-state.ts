// ============================================================
// FlowState 型別定義（從 orchestrator.ts 抽出）
// ============================================================

import type { DesignVariant, DesignBrief, DesignTier, DesignSystem, GeneratedComponent, VariantConcept } from '../services/uiux-generation'
import type { SpecIssue } from '../services/spec-discovery'
import type { QualityReport } from '../services/quality-gate'
import type { DeployPreCheckResult, DeploymentRecord } from '../services/deployer'
import type { UIRequirementsSpec } from '../services/bdd-to-ui-spec'
import type { ESKnowledgeMap } from '../services/event-storming'
import type { ImpactAnalysis } from '../services/change-management'

// ============================================================
// 迭代歷史
// ============================================================

export interface IterationHistoryEntry {
  timestamp: number
  feedback: string       // 用戶原始反饋
  filesChanged: string[] // 被修改的檔案路徑
}

// ============================================================
// Generated Code 結構（被多處引用）
// ============================================================

export interface GeneratedCode {
  pages: GeneratedComponent[]
  components: GeneratedComponent[]
  styles: string
}

// ============================================================
// FlowState
// ============================================================

export interface FlowState {
  phase: string
  projectId?: string           // 關聯的專案 ID（用於 project_files 寫入）
  currentRound: number
  questionIndex: number
  batchCount: number
  sessionId?: string
  taskId?: string
  waitingForReply: boolean
  currentItemId?: string
  totalQuestionsAsked: number  // 累計已問問題數
  // Spec Discovery 專用
  specRound?: number           // Spec Discovery 輪數
  specTotalQuestions?: number  // Spec Discovery 累計問題數
  specIssues?: SpecIssue[]     // 當前輪次發現的問題（用於修復）
  // UIUX 專用
  uiuxTemplateId?: string      // 用戶選擇的模板 ID
  uiuxVariants?: DesignVariant[] // 生成的 5 個設計變體
  uiuxDesignSystem?: DesignSystem // 最終合併的 Design System
  uiuxCodePhase?: 'structure' | 'animation' | 'rwd' | 'quality_gate' | 'complete' // 當前代碼生成階段
  uiuxGeneratedCode?: GeneratedCode // 已生成的代碼（跨階段保留）
  uiuxStructureCode?: GeneratedCode // Structure 階段快照（供 redo 時回溯）
  uiuxAnimationCode?: GeneratedCode // Animation 階段快照（供 redo 時回溯）
  // 設計釐清
  uiuxDesignClarifyStep?: number // 當前釐清步驟（1-4）
  uiuxDesignIdeas?: Array<{ step: string; answer: string }> // 用戶的設計想法
  // Design Brief 確認
  uiuxDesignBriefRound?: number
  uiuxDesignBrief?: DesignBrief
  uiuxDesignBriefHistory?: Array<{ role: 'assistant' | 'user'; content: string }>
  uiuxPreparedTemplate?: import('../services/uiux-generation').TemplateData
  // Design Tier（功能型 vs 創意型）
  uiuxDesignTier?: DesignTier
  // Quality Gate 報告
  uiuxQualityReport?: QualityReport
  // Deployer 專用
  deployerPreCheck?: DeployPreCheckResult
  // 代碼生成時間戳（用於死鎖偵測）
  uiuxCodeGenerationStartedAt?: number // Date.now() 開始生成的時間
  // 對話內迭代
  iterationCount?: number              // 迭代次數
  uiuxPreIterationCode?: GeneratedCode // 迭代前快照（供撤銷）
  iterationHistory?: IterationHistoryEntry[] // 迭代歷史摘要
  // 回滾
  rollbackDeployments?: DeploymentRecord[]  // 可選的回滾版本列表
  // BDD→UI 翻譯結果快取
  uiuxUISpec?: UIRequirementsSpec
  // 選中 variant 的創意概念
  uiuxVariantConcept?: VariantConcept
  // 快速模式
  // phase: 'fast_need_more_info'（描述太短，等待補充）、'fast_generating'（生成中）
  fastMode?: boolean
  fastModeProductType?: string
  fastModeOriginalMessage?: string  // 原始描述（供迭代時提供上下文）
  fastModeLayoutMode?: 'app' | 'website'
  // 智能模板匹配
  matchedTemplateIds?: string[] // 匹配的模板 ID（分數排序）
  // 模板編輯覆蓋（用戶在 PreviewPanel 中的自訂修改）
  templateOverrides?: Record<string, Record<string, string>>
  // 用戶 ID（供內部函數取得 trackingContext）
  userId?: string
  // 回退機制
  lastStablePhase?: string     // 上一個穩定決策點的 phase（用於錯誤恢復）
  // Event Storming（Phase 0）
  esKnowledgeMap?: ESKnowledgeMap  // ES 知識地圖
  // Clarify 批次整合
  partialSpecContext?: string      // 部分規格摘要（注入後續 Discovery）
  // Draft Batch Mode
  formulationDraftUncertainItems?: string[]  // 草稿中不確定的項目
  // Formulation 斷點續傳
  formulationStartedAt?: number                 // 開始時間（超時偵測）
  formulationSchemaSql?: string                 // Step 1 結果
  formulationEntityMapping?: string             // Step 1 結果
  formulationIdentifiedFeatures?: import('../services/formulation').FeatureInfo[] // Step 2 結果
  formulationCompletedNames?: string[]          // 已完成的 actionName 列表
  formulationTotalExpected?: number             // 預期總數
  // Change Management
  changeImpact?: ImpactAnalysis   // 變更影響分析結果
  // 連續空輪計數（連續兩輪無新問題才終止 Discovery）
  consecutiveEmptyRounds?: number
  // 動態 Discovery 上限（根據需求複雜度自動調整）
  discoveryLimits?: { maxRounds: number; maxTotalQuestions: number }
  // 消息來源（LINE Bot 或 Web）
  messageSource?: 'line' | 'web'
  // 釐清階段語義分析：連續拒絕計數（防死循環，第 3 次強制 accept）
  answerRejectCount?: number
}
