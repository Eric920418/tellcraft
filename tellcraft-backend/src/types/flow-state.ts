// ============================================================
// FlowState 型別定義（從 orchestrator.ts 抽出）
// ============================================================

import type { DesignVariant, DesignBrief, DesignTier, DesignSystem, GeneratedComponent, VariantConcept } from '../services/uiux-generation'
import type { SpecIssue } from '../services/spec-discovery'
import type { QualityReport } from '../services/quality-gate'
import type { DeployPreCheckResult, DeploymentRecord } from '../services/deployer'
import type { UIRequirementsSpec } from '../services/bdd-to-ui-spec'
import type { ESKnowledgeMap } from '../services/event-storming'
import type { ReferenceAnalysis } from '../services/reference-analyzer'
import type { ImpactAnalysis } from '../services/change-management'
import type { RegistrantInfo } from '../schemas/domain'
import type { ImageLibrary } from '../services/image-library-service'
import type Redis from 'ioredis'
import type { Server as SocketIOServer } from 'socket.io'
import type { Emitter } from '@socket.io/redis-emitter'

/** Socket.io Server 或 Redis Emitter — Worker 進程用 Emitter，HTTP 進程用 Server */
export type IoEmitter = SocketIOServer | Emitter<Record<string, any>>

// ============================================================
// Phase Handler Context（Phase 1-1 拆分用）
// ============================================================

export interface PhaseContext {
  conversationId: string
  projectId: string
  userId: string
  message: string
  state: FlowState
  redis: Redis
  io: IoEmitter
  locale?: 'zh' | 'en'
  imageUrls?: string[]
}

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
  uiuxDesignSystemHash?: string // freezeDesignSystem 計算的穩定 hash（cache key + 回滾驗證 + telemetry）
  uiuxDesignSystemSource?: 'user_designed' | 'vendored_designmd' | 'vendored_modified' | 'iteration_modified' | 'imported_design_md' | 'open_design_md' | 'rolled_back'
  // Phase 1: open-design 差集風格命中時記錄 styleKey，design_choice_recorded telemetry 用於 Phase 1.5 監控切片
  uiuxOpenDesignStyleKey?: string
  uiuxDesignTokenOverride?: boolean // 用戶按下「強制覆寫」跳過 design-token-compliance critical 檢查
  uiuxCodePhase?: 'structure' | 'animation' | 'rwd' | 'quality_gate' | 'complete' // 當前代碼生成階段
  uiuxGeneratedCode?: GeneratedCode // 已生成的代碼（跨階段保留）
  uiuxStructureCode?: GeneratedCode // Structure 階段快照（供 redo 時回溯）
  uiuxAnimationCode?: GeneratedCode // Animation 階段快照（供 redo 時回溯）
  // 設計釐清
  uiuxDesignClarifyStep?: number // 當前釐清步驟（1-4）
  uiuxDesignIdeas?: Array<{ step: string; answer: string }> // 用戶的設計想法
  uiuxReferenceAnalysis?: ReferenceAnalysis // 參考網站分析結果（截圖 + Vision）
  uiuxReferenceImageUrls?: string[]  // 用戶上傳的參考圖片 URL
  // Design Brief 確認
  uiuxDesignBriefRound?: number
  uiuxDesignBrief?: DesignBrief
  uiuxDesignBriefHistory?: Array<{ role: 'assistant' | 'user'; content: string }>
  uiuxPreparedTemplate?: import('../services/uiux-generation').TemplateData
  // Design Tier（功能型 vs 創意型）
  uiuxDesignTier?: DesignTier
  // Design Mood（設計情緒預設）
  uiuxDesignMood?: string
  // Unsplash 圖片庫（供 sanitize 校驗 + ImageCredits 注入用）
  uiuxImageLibrary?: ImageLibrary
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
  lastIterationFeedback?: string       // 上次迭代反饋（供重試）
  lastIterationImageUrls?: string[]    // 上次迭代圖片（供重試）
  // T10: 迭代閉環評估
  lastIterationQualityReport?: QualityReport  // 上輪迭代後的 QG 報告，下輪用來 diff 是否真的改善
  iterationFailedToImproveCount?: number      // 連續沒改善次數（≥ 2 提供逃離選項）
  // 精細模式訂單綁定（從前端 /pay/success 跳回 chat 帶 ?orderId= → handleProcessMessage 寫入）
  // 用途：deploy 完成寫 projects.id 後 → UPDATE precision_orders SET project_id；iteration-skill 查訂單配額
  precisionOrderId?: string
  // T6: 漸進可中斷生成
  uiuxAbortRequested?: boolean         // 用戶要求中止生成（state 鏡像 Redis flag，UI 顯示用）
  uiuxPartialCode?: GeneratedCode      // 中止時保存的 partial 結果
  // 回滾
  rollbackDeployments?: DeploymentRecord[]  // 可選的回滾版本列表
  // BDD→UI 翻譯結果快取
  uiuxUISpec?: UIRequirementsSpec
  // 選中 variant 的創意概念
  uiuxVariantConcept?: VariantConcept
  // 自動採用 AI 建議（BDD 釐清專用，completeSpecPhase 末尾清除）
  autoAdoptMode?: boolean
  // 快速模式
  // phase: 'fast_generating'（生成中）
  fastMode?: boolean
  fastModeProductType?: string
  fastModeOriginalMessage?: string  // 原始描述（供迭代時提供上下文）
  fastModeExpandedPrompt?: string   // Haiku 擴展後的完整描述（供 generateStructure + 迭代上下文）
  fastModeLayoutMode?: 'app' | 'website'
  fastModeTemplateStyleHint?: string
  fastModeInteractionHint?: string
  fastModeFirstBatchPages?: string[]
  fastModeCacheKey?: string
  // 增量交互式生成
  fastBuildStage?: 'generating' | 'awaiting_continue' | 'complete'
  fastBuildAllPages?: string[]         // inferPages+mergePages 的完整頁面列表
  fastBuildCompletedPages?: string[]   // 已完成 pipeline 的頁面
  fastBuildCurrentBatchIndex?: number  // 當前批次（0=首頁, 1=剩餘）
  fastBuildPendingFinish?: boolean     // 用戶在生成中點「就這樣部署」→ 批次完成後直接完成不暫停
  // 智能模板匹配
  matchedTemplateIds?: string[] // 匹配的模板 ID（分數排序）
  displayedTemplates?: { id: string; name: string }[] // showTemplatePicker 展示順序（供自然語言選擇）
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
  // 消息來源（LINE Bot、Telegram Bot 或 Web）
  messageSource?: 'line' | 'telegram' | 'web'
  // 統一語義閘門：連續拒絕計數（BDD ≥2 強制 accept；Design ≥2 顯示跳過）
  semanticRejectCount?: number
  // 自動修復計數（每個代碼版本最多 1 次，iteration 成功後重置）
  autoRepairCount?: number
  // PRD Discovery 開始時間（超時偵測）
  prdDiscoveryStartedAt?: number
  // 用戶語言偏好（從第一條訊息偵測，供品質閘門等非 LLM 功能使用正確語言回覆）
  locale?: 'zh' | 'en'
  // Domain Skill 專用
  domainId?: string
  domainName?: string
  domainSource?: 'purchased' | 'own'
  domainCompletedSteps?: string[]
  domainCloudflareZoneId?: string
  domainPrice?: string
  domainProjectId?: string
  domainVercelProjectId?: string
  domainRegistrationStartedAt?: number
  domainRegistrant?: RegistrantInfo
  // Database Provisioning（provider-agnostic）
  dbProvisionStatus?: 'completed' | 'failed' | 'skipped' | 'quota_exceeded'
  dbDerivedSchema?: { displaySummary: string; entityCount: number }
  // L27.B: 配額耗盡時記錄 — UI 顯示 + Coder 按鈕路由用
  dbQuotaInfo?: { current: number; limit: number; plan: string }
  // Coder Skill 專用
  coderGenerationStartedAt?: number       // 超時偵測
  coderCompleted?: boolean                // 標記已完成（deployer/quickReply 可識別）
  coderPreRewriteCode?: GeneratedCode     // 改寫前快照（供撤銷/失敗恢復）
  // RED Phase（SDD 靜態規格驗證，Coder 生成前執行）
  coderRedPhasePassed?: boolean           // RED Phase 是否通過（errors=0）
  coderRedPhaseIssueCount?: number        // 發現的問題數量
  coderRedPhaseFixRounds?: number         // LLM 修復輪數（0=一次通過）
  // Coder Testing（SpecFormula 紅綠燈）
  coderTestPassed?: boolean               // 測試是否全部通過
  coderTestAttempts?: number              // 本次 invoke 累計測試嘗試次數（用戶按 retry 開新 invoke 時會重置）
  coderTestStartedAt?: number             // 超時偵測
  coderTestFailedScenarios?: number       // 失敗場景數（供部署風險提示）
  coderTestFeatureCount?: number          // 本次 invoke 測試的 Feature 總數（拆解 attemptsDetail 用）
  coderTestRegressionRounds?: number      // 本次 invoke Phase 2 全量回歸跑了幾輪
  deployedWithFailingTests?: boolean      // 是否帶風險部署（測試未全通過即部署）
  // Clone Skill（網站復刻）
  cloneMode?: boolean
  cloneSourceUrl?: string
  cloneSections?: CloneSectionMeta[]
  cloneTotalSections?: number
  cloneCompletedSections?: number
  cloneDesignSystem?: {
    colors: import('../services/reference-analyzer').ExtractedColors
    typography: import('../services/reference-analyzer').ExtractedTypography
    layout: import('../services/reference-analyzer').ExtractedLayout
    tokens?: import('../services/clone/design-token-extractor').CloneDesignTokens
  }
  cloneAnalyzingStartedAt?: number        // 超時偵測
  cloneGeneratingStartedAt?: number       // 超時偵測
  // Clone 圖片模式擴充
  cloneImageUrls?: string[]               // 用戶上傳的圖片 URL
  cloneInputMode?: 'url' | 'hybrid' | 'image_only'
  cloneImageAnalyses?: Array<{
    imageUrl: string
    pageTitle?: string
    status: 'pending' | 'analyzed' | 'generated' | 'failed'
  }>
  cloneFailedReason?: string              // 失敗原因（供 clone_failed 顯示）
}

export interface CloneSectionMeta {
  index: number
  type: 'header' | 'footer' | 'content'
  tag: string
  componentName: string
  estimatedHeight: number
  status: 'pending' | 'generating' | 'completed' | 'failed'
}
