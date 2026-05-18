/**
 * Skill Telemetry — 自我強化迴圈 v2
 *
 * v1: 收集失敗訊號 → 週報 → 人工回灌
 * v2: + Week-over-week delta（對照組）
 *     + Prompt change 註冊表（追蹤每次介入的效應）
 *     + 汰換候選標記（防止 prompt 堆疊膨脹）
 *     + Direction A 候選標記（高頻 pattern 轉 deterministic code 規則）
 *
 * 設計原則：
 * 1. Fire-and-forget — 任何寫入失敗都不能中斷生成 pipeline
 * 2. 零 LLM — 所有 pattern 分類用 regex
 * 3. Payload 上限 4KB — 避免巨大 blob 拖慢 DB
 * 4. 人工回灌 — 禁止自動改 prompt，週報 → 手工決策 → 手改 system prompt
 * 5. 閉環量化 — 每次介入必須註冊，下週量化效應，無效 → 汰換或轉路徑
 */

import * as db from '../db/client'
import { createLogger } from '../lib/logger'

const logger = createLogger('skill-telemetry')

const PAYLOAD_MAX_BYTES = 4096
const FEEDBACK_MAX_CHARS = 500

// ============================================================
// 型別
// ============================================================

export type SkillName =
  | 'deployer'
  | 'quality_gate'
  | 'iteration'
  | 'uiux'
  | 'coder'
  | 'orchestrator'
  | 'red_phase'
  | 'feature_gate'
  | 'prefilter'
  | 'syntax_validator'
  | 'flowstate_recovery'
  | 'budget_guard'  // L31.M: per-conversation budget cap
  | 'actions_design'  // actions.yml 生成 + 修復
  | 'cms_skeleton'  // Phase 1 Week 4: CMS skeleton 採用 / partial regen

export type EventType =
  | 'sanitize_fix'
  | 'qg_rule_fix'
  | 'qg_llm_fallback'
  | 'iteration'
  | 'phase_failure'
  | 'phase_timeout_recovered'
  | 'coder_test_fail'
  | 'coder_test_fix_success'
  | 'coder_test_fix_give_up'
  | 'deployer_layer_trigger'
  | 'red_validation_fail'
  | 'alignment_blocked'
  | 'alignment_fixed'
  | 'prefilter_reject'
  | 'prefilter_antiloop'
  | 'syntax_repair'
  | 'preview_gate'
  | 'variant_diversity'
  | 'spec_first_repair_attempt'   // L31.J Phase 3a: fixFailingSpec 觸發
  | 'spec_first_repair_success'   // L31.J Phase 3a: fixFailingSpec 成功
  | 'conversation_budget_exceeded' // L31.M: per-conversation budget cap 觸發
  | 'fix_convergence_failed'       // L31.O: fix loop 連續兩輪錯誤指紋一致 → LLM 修不動
  | 'cross_loop_fix_skipped'       // R2: 跨 loop cache hit，skip LLM 修補
  | 'qg_high_retry_count'          // Tier A4: UIUX QG 進到 3+ 輪修復（high signal 給週報追蹤）
  | 'unique_constraint_deduped'    // Tier B2: BDD 多 row 同 unique column 衝突自動 dedup
  | 'cms_skeleton_injected'        // Phase 1 Week 4: formulation 命中 CMS shape 自動補 canonical features
  | 'cms_skeleton_actions_short_circuit'  // Phase 1 Week 4: coder skeleton actions 跳 LLM render
  | 'cms_skeleton_partial_regen'   // Phase 1 Week 4: user 觸發 /cms-slots/regen 端點
  // 設計審美閉環 v2（Phase 0）— ENABLE_DESIGN_TELEMETRY_V2 gate
  | 'design_quality_snapshot'      // QG 完成寫，payload: {overallScore, dimensionScores, mood, tier, dsHash, dsSource, variantConceptName, ...}
  | 'iteration_score_delta'        // 迭代完成寫，payload: {prevScore, newScore, delta, tier, scope, ...}
  | 'iteration_aesthetic_complaint'  // 用戶迭代輸入含美感投訴詞（regex 零 LLM）即記
  | 'design_choice_recorded'       // variant 選定即寫，固化「這次用了哪些 mood/tier/variantConcept」
  // R8 observer：incrementalFirstBatch LLM 漏生 Header/Footer 元件導致 ship 出去沒 nav（2026-05-17 incident）
  | 'first_batch_missing_nav'      // first batch 完成後 deterministic scan layout.tsx 無 nav marker 即記
  // R9 observer：按鈕對比度 deployer auto-swap 觸發頻率（2026-05-17 incident，4 層架構驗證）
  | 'contrast_auto_swapped'        // Layer 3 swap 成功（ratio 從 < 4.5 → ≥ 4.5）
  | 'contrast_auto_swap_unsafe'    // swap 後仍 < 4.5（fallback ring 後續處理）
  | 'contrast_qg_residual'         // Layer 4 QG 觸發 = Layer 3 漏網（high signal）
  // R10 治本：preview-deploy 失敗 100% 自動修復（2026-05-18 incident，6 層架構驗證）
  | 'preview_auto_fix_attempted'        // L3+L4 進入：fixBuildErrors 開始
  | 'preview_auto_fix_round_success'    // 某輪 LLM 修復後重 deploy 成功
  | 'preview_auto_fix_give_up'          // L3+L4 N 輪用盡仍 failed → 觸發 L5
  | 'preview_heavy_fallback_triggered'  // L5 verifyBuildLocally 啟動
  | 'preview_heavy_fallback_success'    // L5 修復後 quickPreviewDeploy 成功
  | 'preview_user_manual_retry'         // 用戶按 retry 按鈕（L6 UX 兜底）
  // R11 治本：Chrome Extension MV3 編輯器（2026-05-18 commit 8）
  | 'extension_installed'              // chrome.runtime.onInstalled (first install 或 update)
  | 'extension_auth_exchanged'         // scoped JWT 換成功（首次 + 50min renew）
  | 'extension_preview_verified'       // verify-preview pass（host 屬該 conversation）
  | 'extension_element_selected'       // 用戶 click 元素 (5s debounce 避免高頻噪音)
  | 'extension_update_applied'         // /apply-update 成功（含 reason: 'text-unique' / 'style-only'）
  | 'extension_apply_failed'           // /apply-update 失敗（含 reason: 'text-not-unique' / 'invalid-op' / ...）

export type TelemetrySeverity = 'critical' | 'warning' | 'info'
export type TelemetryOutcome = 'success' | 'failed' | 'repaired' | 'timeout' | 'blocked'

export interface TelemetryEvent {
  skillName: SkillName
  eventType: EventType
  patternKey: string
  severity?: TelemetrySeverity
  outcome?: TelemetryOutcome
  rootCauseCategory?: string | null
  phase?: string | null
  errorType?: string | null
  recovered?: boolean | null
  userId?: string | null
  conversationId?: string | null
  projectId?: string | null
  payload?: Record<string, unknown>
  fixRounds?: number
}

export interface TelemetryTrackingContext {
  userId?: string | null
  conversationId?: string | null
  projectId?: string | null
}

export interface WeeklyReportRow {
  skill_name: string
  event_type: string
  pattern_key: string
  count: number
  avg_fix_rounds: number
  sample_conversation_ids: string[]
  sample_payloads: unknown[]
}

export interface WeeklyReport {
  generatedAt: string
  windowDays: number
  totalEvents: number
  topPatterns: WeeklyReportRow[]
  escalations: Array<{
    conversation_id: string | null
    skill_name: string
    event_type: string
    pattern_key: string
    fix_rounds: number
    created_at: string
  }>
}

// ============================================================
// Payload sanitize
// ============================================================

function clampPayload(payload: Record<string, unknown> | undefined): Record<string, unknown> | null {
  if (!payload) return null
  try {
    const serialized = JSON.stringify(payload)
    if (serialized.length <= PAYLOAD_MAX_BYTES) return payload
    // 簡單截斷策略：把最大的字串欄位截短
    const truncated: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(payload)) {
      if (typeof v === 'string' && v.length > 200) {
        truncated[k] = v.slice(0, 200) + '...[truncated]'
      } else {
        truncated[k] = v
      }
    }
    const retrySerialized = JSON.stringify(truncated)
    if (retrySerialized.length <= PAYLOAD_MAX_BYTES) return truncated
    // 實在過大，丟棄詳細欄位
    return { _truncated: true, _originalKeys: Object.keys(payload) }
  } catch {
    return { _serialize_failed: true }
  }
}

/** 給呼叫端用：把任意字串截斷到 500 字 */
export function truncateFeedback(text: string | undefined | null): string {
  if (!text) return ''
  return text.length > FEEDBACK_MAX_CHARS ? text.slice(0, FEEDBACK_MAX_CHARS) : text
}

// ============================================================
// 寫入
// ============================================================

/**
 * Fire-and-forget 單筆紀錄。
 * 絕對不拋錯、絕對不 block 呼叫端。
 */
export async function recordTelemetry(event: TelemetryEvent): Promise<void> {
  try {
    const payload = clampPayload(event.payload)
    await db.query(
      `INSERT INTO skill_telemetry
         (skill_name, event_type, pattern_key, severity, user_id, conversation_id, project_id, payload, fix_rounds,
          outcome, root_cause_category, phase, error_type, recovered)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        event.skillName,
        event.eventType,
        event.patternKey,
        event.severity || null,
        event.userId || null,
        event.conversationId || null,
        event.projectId || null,
        payload ? JSON.stringify(payload) : null,
        event.fixRounds ?? 1,
        event.outcome || 'success',
        event.rootCauseCategory || null,
        event.phase || null,
        event.errorType || null,
        event.recovered ?? null,
      ]
    )
  } catch (err) {
    logger.warn({ err, event: { ...event, payload: undefined } }, 'telemetry insert failed')
  }
}

/**
 * Fire-and-forget failure 紀錄 — outcome 預設 'failed'，減少呼叫端漏填風險。
 */
export async function recordFailure(
  event: Omit<TelemetryEvent, 'outcome'> & { outcome?: 'failed' | 'blocked' | 'timeout' }
): Promise<void> {
  return recordTelemetry({ ...event, outcome: event.outcome || 'failed' })
}

/**
 * 批次紀錄 — 用在 deployer sanitize、QG rule-based 這種一次多筆的場景。
 * 內部逐筆呼叫 recordTelemetry，任何一筆失敗都不影響其他。
 */
export async function recordTelemetryBatch(events: TelemetryEvent[]): Promise<void> {
  if (events.length === 0) return
  // 不用 Promise.all 以免單筆失敗 reject 整個批次
  for (const ev of events) {
    await recordTelemetry(ev)
  }
}

// ============================================================
// Deployer sanitize 分類器
// ============================================================

/**
 * 不在 sanitizeCodeForDeploy 內部 15+ 個 fixes.push() 逐一埋點，而是在 caller 側
 * 用這個零 LLM 的 regex 分類器把自然語言 label 歸類成 stable pattern key。
 *
 * 規則對應 deployer.ts:308 sanitizeCodeForDeploy 的修復類型。
 */
const SANITIZE_PATTERN_MAP: Array<[RegExp, string]> = [
  [/framer-motion → motion\/react/, 'motion-import'],
  [/自動加入 'use client'/, 'use-client-missing'],
  [/補缺失 React hooks import/, 'missing-hooks-import'],
  [/補 optional chaining/, 'optional-chaining-bracket'],
  [/motion\.\* spread props/, 'motion-spread-conflict'],
  [/\?\? 與 \|\|\/&& 混用/, 'nullish-mixed-parens'],
  [/移除 Google Fonts <link>/, 'google-fonts-link-removal'],
  [/移除 Google Fonts @import/, 'google-fonts-import-removal'],
  [/移除非 variable font 的 axes 參數/, 'font-axes-removal'],
  [/Next\.js 15 async params/, 'next15-async-params'],
  [/useSearchParams Suspense/, 'search-params-suspense'],
  [/broken import.*→ 生成 stub/, 'broken-import-stub'],
  [/named import.*不存在/, 'named-import-missing'],
  [/未知依賴/, 'unknown-dependency'],
  [/自動補充 .* 個第三方依賴/, 'auto-add-dependency'],
  [/補上缺失的 <body>/, 'missing-body-tag'],
  [/補上缺失的.*標籤/, 'missing-html-tags'],
  [/偵測到缺失 <html>\/<body> 但無法自動修復/, 'root-layout-fix8-unreachable'],
  [/Tailwind v4 語法/, 'tailwind-v4-cleanup'],
  [/路徑正規化/, 'path-normalize'],
  [/圖片 URL 正規化/, 'upload-url-rewrite'],
  [/第 \d+ 次構建通過/, 'build-retry-success'],
  [/第 \d+ 次 AI 修復失敗/, 'build-retry-fail'],
  [/第 \d+ 次 AI 修復了/, 'build-retry-partial'],
  [/AI 新增依賴/, 'build-retry-new-dependency'],
  [/次 AI 修復都失敗，降級/, 'build-retry-give-up'],
  [/Build 失敗但無法解析錯誤類型/, 'build-unparseable'],
  [/npm install 失敗/, 'npm-install-fail'],
  [/移除無法安裝的依賴/, 'remove-bad-dependency'],
  [/構建驗證異常/, 'build-verify-exception'],
]

export function categorizeSanitizeFix(fixLabel: string): string {
  for (const [re, key] of SANITIZE_PATTERN_MAP) {
    if (re.test(fixLabel)) return key
  }
  return 'other'
}

/** 暴露給測試用 */
export function getSanitizePatternKeys(): string[] {
  return SANITIZE_PATTERN_MAP.map(([, key]) => key)
}

/**
 * 找出 SANITIZE_PATTERN_MAP 裡定義了、但 prompt_changes 表沒註冊的 pattern。
 *
 * 存在 = 開發者加了 sanitize rule 但忘了跑 register-prompt-change.ts。
 * 後果：週報無法追蹤這條規則的效應基線、無法做汰換決策。
 *
 * 用在週報頂部警示區塊 + pre-commit hook 檢測。
 * 純函數不碰 DB，由呼叫端注入 activeChanges 避免重複查詢。
 */
export function findUnregisteredSanitizePatterns(
  activeChanges: Array<{ pattern_key: string }>
): string[] {
  const registered = new Set(activeChanges.map(c => c.pattern_key))
  return getSanitizePatternKeys().filter(key => !registered.has(key))
}

// ============================================================
// Phase error 分類器（零 LLM）
// ============================================================

const PHASE_ERROR_MAP: Array<[RegExp, string]> = [
  [/timeout|timed?\s*out|ETIMEDOUT/i, 'timeout'],
  [/ECONNREFUSED|ECONNRESET|ENOTFOUND|socket hang up/i, 'network'],
  [/rate.?limit|429|overloaded|too many requests/i, 'rate_limit'],
  [/anthropic|claude|llm|model|max_tokens/i, 'llm_error'],
  [/ENOENT|EPERM|EACCES|no such file/i, 'filesystem'],
  [/pg|postgres|database|relation.*does not exist|column.*does not exist|duplicate key/i, 'db_error'],
  [/redis|WRONGTYPE|NOAUTH|CROSSSLOT/i, 'redis_error'],
  [/out of memory|heap|allocation failed/i, 'oom'],
]

export function classifyPhaseError(err: unknown): string {
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
  for (const [re, key] of PHASE_ERROR_MAP) {
    if (re.test(msg)) return key
  }
  return 'unknown'
}

export function getPhaseErrorPatternKeys(): string[] {
  return PHASE_ERROR_MAP.map(([, key]) => key)
}

// ============================================================
// 週報聚合
// ============================================================

export async function aggregateWeeklyReport(days = 7, topN = 20): Promise<WeeklyReport> {
  const generatedAt = new Date().toISOString()

  // Top patterns：按 (skill, event, pattern) group，帶樣本
  const topPatterns = await db.queryMany<WeeklyReportRow>(
    `SELECT
       skill_name,
       event_type,
       pattern_key,
       COUNT(*)::int as count,
       ROUND(AVG(fix_rounds)::numeric, 2)::float as avg_fix_rounds,
       (ARRAY_AGG(conversation_id::text ORDER BY created_at DESC) FILTER (WHERE conversation_id IS NOT NULL))[1:5] as sample_conversation_ids,
       (ARRAY_AGG(payload ORDER BY created_at DESC) FILTER (WHERE payload IS NOT NULL))[1:5] as sample_payloads
     FROM skill_telemetry
     WHERE created_at >= NOW() - ($1 || ' days')::interval
     GROUP BY skill_name, event_type, pattern_key
     ORDER BY count DESC
     LIMIT $2`,
    [String(days), topN]
  )

  // 升級事件：fix_rounds >= 3 的個案
  const escalations = await db.queryMany<{
    conversation_id: string | null
    skill_name: string
    event_type: string
    pattern_key: string
    fix_rounds: number
    created_at: string
  }>(
    `SELECT conversation_id::text as conversation_id,
            skill_name, event_type, pattern_key, fix_rounds,
            created_at::text as created_at
     FROM skill_telemetry
     WHERE created_at >= NOW() - ($1 || ' days')::interval
       AND fix_rounds >= 3
     ORDER BY fix_rounds DESC, created_at DESC
     LIMIT 20`,
    [String(days)]
  )

  const totalRow = await db.queryOne<{ total: number }>(
    `SELECT COUNT(*)::int as total
     FROM skill_telemetry
     WHERE created_at >= NOW() - ($1 || ' days')::interval`,
    [String(days)]
  )

  return {
    generatedAt,
    windowDays: days,
    totalEvents: totalRow?.total || 0,
    topPatterns: topPatterns || [],
    escalations: escalations || [],
  }
}

// ============================================================
// CMS Skeleton 採用度統計（Phase 1 Week 4）
// ============================================================

export interface CmsSkeletonStats {
  windowDays: number
  injectedConversations: number       // distinct conversation 命中 CMS shape
  shortCircuitEvents: number          // coder skeleton short-circuit 次數
  totalActionsSavedFromLlm: number    // skeleton 跳過的 action 總數（直接 = 省下的 LLM call）
  regenEvents: number                 // 用戶觸發 partial regen 次數
  regenUniqueProjects: number         // 觸發 regen 的 distinct project
  topInjectionScores: Array<{ score: number; count: number }>  // 命中 CMS shape 的 score 分佈
}

export async function aggregateCmsSkeletonStats(days = 7): Promise<CmsSkeletonStats> {
  const main = await db.queryOne<{
    injected_conversations: number
    short_circuit_events: number
    total_actions_saved: number
    regen_events: number
    regen_unique_projects: number
  }>(
    `SELECT
       COUNT(DISTINCT conversation_id)::int FILTER (WHERE event_type='cms_skeleton_injected') AS injected_conversations,
       COUNT(*)::int FILTER (WHERE event_type='cms_skeleton_actions_short_circuit') AS short_circuit_events,
       COALESCE(SUM((payload->>'skeletonCount')::int) FILTER (WHERE event_type='cms_skeleton_actions_short_circuit'), 0)::int AS total_actions_saved,
       COUNT(*)::int FILTER (WHERE event_type='cms_skeleton_partial_regen') AS regen_events,
       COUNT(DISTINCT project_id)::int FILTER (WHERE event_type='cms_skeleton_partial_regen') AS regen_unique_projects
     FROM skill_telemetry
     WHERE created_at >= NOW() - ($1 || ' days')::interval
       AND skill_name = 'cms_skeleton'`,
    [String(days)]
  )

  const scoreDist = await db.queryMany<{ score: number; count: number }>(
    `SELECT (payload->>'score')::int AS score, COUNT(*)::int AS count
     FROM skill_telemetry
     WHERE created_at >= NOW() - ($1 || ' days')::interval
       AND skill_name = 'cms_skeleton'
       AND event_type = 'cms_skeleton_injected'
     GROUP BY (payload->>'score')::int
     ORDER BY count DESC
     LIMIT 5`,
    [String(days)]
  )

  return {
    windowDays: days,
    injectedConversations: main?.injected_conversations ?? 0,
    shortCircuitEvents: main?.short_circuit_events ?? 0,
    totalActionsSavedFromLlm: main?.total_actions_saved ?? 0,
    regenEvents: main?.regen_events ?? 0,
    regenUniqueProjects: main?.regen_unique_projects ?? 0,
    topInjectionScores: scoreDist || [],
  }
}

// ============================================================
// 設計審美閉環 v2（Phase 0）
// ============================================================

/**
 * 用戶迭代輸入是否含「美感投訴」訊號（零 LLM regex）。
 * 命中即記 iteration_aesthetic_complaint 事件，讓週報能算每個 mood/dsSource 的投訴率。
 * 故意保守 — 寧可漏不可錯殺（誤殺會污染數據）。
 */
export const AESTHETIC_COMPLAINT_REGEX =
  /(醜|難看|不好看|很low|質感差|太陽春|沒設計感|很俗|土|配色爛|顏色難看|ugly|cheap|tacky|amateur|unprofessional)/i

export function detectAestheticComplaint(feedback: string): boolean {
  return AESTHETIC_COMPLAINT_REGEX.test(feedback)
}

export interface DesignEffectivenessRow {
  /** mood id（如 minimalist / glassmorphism）— null = 該事件沒記 mood */
  mood: string | null
  /** sample size — 數量太少不可信 */
  sampleSize: number
  /** 平均 overallScore（snapshot 事件）— 100 滿分 */
  avgScore: number | null
  /** 平均 delta — 正值 = 用戶迭代後分數上升（好）；負值 = 改壞 */
  avgScoreDelta: number | null
  /** 美感投訴次數 */
  complaintCount: number
}

export interface DesignEffectivenessReport {
  windowDays: number
  byMood: DesignEffectivenessRow[]
  bySource: Array<{
    dsSource: string | null
    snapshotCount: number
    avgScore: number | null
    complaintCount: number
  }>
  totalSnapshots: number
  totalIterationDeltas: number
  totalAestheticComplaints: number
}

/**
 * 聚合設計知識成效（Phase 0 MVP）：
 *  - 每個 mood 的 avgScore / avgScoreDelta / complaintCount → 找出「常被改壞」或「常被投訴」的 mood
 *  - 每個 dsSource（vendored / user_designed / iteration_modified 等）的成效
 *
 * 數據是「描述性」非「結論性」— 由 reviewer 看週報手動判斷該汰換哪個 mood/style。
 * 嚴禁自動回灌 prompt（CLAUDE.md 紅線）。
 */
export async function aggregateDesignEffectiveness(days = 7): Promise<DesignEffectivenessReport> {
  const byMood = await db.queryMany<{
    mood: string | null
    snapshot_count: number
    avg_score: number | null
    avg_delta: number | null
    complaint_count: number
  }>(
    `WITH snap AS (
       SELECT (payload->>'mood') AS mood,
              (payload->>'overallScore')::float AS score
       FROM skill_telemetry
       WHERE created_at >= NOW() - ($1 || ' days')::interval
         AND event_type = 'design_quality_snapshot'
     ),
     deltas AS (
       SELECT (payload->>'mood') AS mood,
              (payload->>'delta')::float AS delta
       FROM skill_telemetry
       WHERE created_at >= NOW() - ($1 || ' days')::interval
         AND event_type = 'iteration_score_delta'
     ),
     complaints AS (
       SELECT (payload->>'mood') AS mood, COUNT(*)::int AS cnt
       FROM skill_telemetry
       WHERE created_at >= NOW() - ($1 || ' days')::interval
         AND event_type = 'iteration_aesthetic_complaint'
       GROUP BY mood
     ),
     moods AS (
       SELECT mood FROM snap
       UNION SELECT mood FROM deltas
       UNION SELECT mood FROM complaints
     )
     SELECT m.mood,
            COUNT(s.score)::int AS snapshot_count,
            ROUND(AVG(s.score)::numeric, 1)::float AS avg_score,
            ROUND(AVG(d.delta)::numeric, 1)::float AS avg_delta,
            COALESCE(MAX(c.cnt), 0)::int AS complaint_count
     FROM moods m
     LEFT JOIN snap s ON s.mood IS NOT DISTINCT FROM m.mood
     LEFT JOIN deltas d ON d.mood IS NOT DISTINCT FROM m.mood
     LEFT JOIN complaints c ON c.mood IS NOT DISTINCT FROM m.mood
     GROUP BY m.mood
     ORDER BY complaint_count DESC, snapshot_count DESC
     LIMIT 20`,
    [String(days)]
  )

  const bySource = await db.queryMany<{
    ds_source: string | null
    snapshot_count: number
    avg_score: number | null
    complaint_count: number
  }>(
    `SELECT (payload->>'dsSource') AS ds_source,
            COUNT(*) FILTER (WHERE event_type='design_quality_snapshot')::int AS snapshot_count,
            ROUND(AVG((payload->>'overallScore')::float) FILTER (WHERE event_type='design_quality_snapshot')::numeric, 1)::float AS avg_score,
            COUNT(*) FILTER (WHERE event_type='iteration_aesthetic_complaint')::int AS complaint_count
     FROM skill_telemetry
     WHERE created_at >= NOW() - ($1 || ' days')::interval
       AND event_type IN ('design_quality_snapshot', 'iteration_aesthetic_complaint')
     GROUP BY ds_source
     ORDER BY snapshot_count DESC
     LIMIT 10`,
    [String(days)]
  )

  const totals = await db.queryOne<{ snap: number; delta: number; complaint: number }>(
    `SELECT
       COUNT(*) FILTER (WHERE event_type='design_quality_snapshot')::int AS snap,
       COUNT(*) FILTER (WHERE event_type='iteration_score_delta')::int AS delta,
       COUNT(*) FILTER (WHERE event_type='iteration_aesthetic_complaint')::int AS complaint
     FROM skill_telemetry
     WHERE created_at >= NOW() - ($1 || ' days')::interval
       AND event_type IN ('design_quality_snapshot','iteration_score_delta','iteration_aesthetic_complaint')`,
    [String(days)]
  )

  return {
    windowDays: days,
    byMood: (byMood || []).map(r => ({
      mood: r.mood,
      sampleSize: r.snapshot_count,
      avgScore: r.avg_score,
      avgScoreDelta: r.avg_delta,
      complaintCount: r.complaint_count,
    })),
    bySource: (bySource || []).map(r => ({
      dsSource: r.ds_source,
      snapshotCount: r.snapshot_count,
      avgScore: r.avg_score,
      complaintCount: r.complaint_count,
    })),
    totalSnapshots: totals?.snap ?? 0,
    totalIterationDeltas: totals?.delta ?? 0,
    totalAestheticComplaints: totals?.complaint ?? 0,
  }
}

// ============================================================
// v2: Week-over-week delta
// ============================================================

export interface DeltaRow {
  skill_name: string
  event_type: string
  pattern_key: string
  current_count: number
  previous_count: number
  /** 正 = 上升（壞），負 = 下降（好），null = 前一週不存在（新 pattern） */
  delta_pct: number | null
}

export interface WeeklyReportWithDelta extends WeeklyReport {
  previousPeriodTotal: number
  deltas: DeltaRow[]
}

/**
 * 同時查當前週和前一週，JS 側算 delta %。
 * 比起兩次呼叫 aggregateWeeklyReport，這個函數只多一個 SQL 查前一週 top patterns。
 */
export async function aggregateWeeklyReportWithDelta(days = 7, topN = 20): Promise<WeeklyReportWithDelta> {
  const current = await aggregateWeeklyReport(days, topN)

  // 前一週 patterns
  const prevPatterns = await db.queryMany<WeeklyReportRow>(
    `SELECT
       skill_name,
       event_type,
       pattern_key,
       COUNT(*)::int as count,
       ROUND(AVG(fix_rounds)::numeric, 2)::float as avg_fix_rounds,
       ARRAY[]::text[] as sample_conversation_ids,
       ARRAY[]::jsonb[] as sample_payloads
     FROM skill_telemetry
     WHERE created_at >= NOW() - ($1 || ' days')::interval * 2
       AND created_at < NOW() - ($1 || ' days')::interval
     GROUP BY skill_name, event_type, pattern_key
     ORDER BY count DESC
     LIMIT $2`,
    [String(days), topN * 2] // 寬一點以 cover 新出現的 pattern
  )

  const prevTotalRow = await db.queryOne<{ total: number }>(
    `SELECT COUNT(*)::int as total
     FROM skill_telemetry
     WHERE created_at >= NOW() - ($1 || ' days')::interval * 2
       AND created_at < NOW() - ($1 || ' days')::interval`,
    [String(days)]
  )

  // 建 lookup map: "skill|event|pattern" → prev count
  const prevMap = new Map<string, number>()
  for (const row of prevPatterns || []) {
    prevMap.set(`${row.skill_name}|${row.event_type}|${row.pattern_key}`, row.count)
  }

  // 為當前 top patterns 算 delta
  const deltas: DeltaRow[] = (current.topPatterns || []).map(row => {
    const key = `${row.skill_name}|${row.event_type}|${row.pattern_key}`
    const prev = prevMap.get(key)
    return {
      skill_name: row.skill_name,
      event_type: row.event_type,
      pattern_key: row.pattern_key,
      current_count: row.count,
      previous_count: prev ?? 0,
      delta_pct: prev != null && prev > 0
        ? Math.round(((row.count - prev) / prev) * 1000) / 10  // 一位小數
        : prev == null ? null : (row.count > 0 ? 100 : 0),  // prev=0 → 100% 上升
    }
  })

  return {
    ...current,
    previousPeriodTotal: prevTotalRow?.total || 0,
    deltas,
  }
}

// ============================================================
// v2: Prompt Change 註冊表
// ============================================================

export type PromptChangeActionType = 'prompt_fewshot' | 'sanitize_rule' | 'qg_rule'

export interface PromptChange {
  id: number
  pattern_key: string
  skill_name: string
  action_type: string
  target_file: string
  description: string | null
  commit_hash: string | null
  baseline_count: number
  injected_at: string
  retired_at: string | null
}

/**
 * 註冊一次人工介入動作。
 * 自動查 baseline_count = 該 pattern 近 7 天觸發數。
 */
export async function registerPromptChange(input: {
  patternKey: string
  skillName: string
  actionType: PromptChangeActionType
  targetFile: string
  description?: string
  commitHash?: string
}): Promise<PromptChange> {
  // 查 baseline：該 pattern 近 7 天觸發數
  const baselineRow = await db.queryOne<{ count: number }>(
    `SELECT COUNT(*)::int as count
     FROM skill_telemetry
     WHERE pattern_key = $1 AND skill_name = $2
       AND created_at >= NOW() - INTERVAL '7 days'`,
    [input.patternKey, input.skillName]
  )
  const baselineCount = baselineRow?.count || 0

  const result = await db.queryOne<PromptChange>(
    `INSERT INTO prompt_changes
       (pattern_key, skill_name, action_type, target_file, description, commit_hash, baseline_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, pattern_key, skill_name, action_type, target_file,
               description, commit_hash, baseline_count,
               injected_at::text as injected_at, retired_at::text as retired_at`,
    [
      input.patternKey,
      input.skillName,
      input.actionType,
      input.targetFile,
      input.description || null,
      input.commitHash || null,
      baselineCount,
    ]
  )

  if (!result) throw new Error('Failed to insert prompt_change')
  return result
}

/** Soft-delete：標記 retired_at，不刪行 */
export async function retirePromptChange(id: number): Promise<void> {
  await db.query(
    `UPDATE prompt_changes SET retired_at = NOW() WHERE id = $1`,
    [id]
  )
}

/** 列出所有活躍（未汰換）的 prompt changes */
export async function getActivePromptChanges(): Promise<PromptChange[]> {
  return db.queryMany<PromptChange>(
    `SELECT id, pattern_key, skill_name, action_type, target_file,
            description, commit_hash, baseline_count,
            injected_at::text as injected_at, retired_at::text as retired_at
     FROM prompt_changes
     WHERE retired_at IS NULL
     ORDER BY injected_at DESC`
  )
}

/** 列出所有 prompt changes（含已汰換） */
export async function getAllPromptChanges(): Promise<PromptChange[]> {
  return db.queryMany<PromptChange>(
    `SELECT id, pattern_key, skill_name, action_type, target_file,
            description, commit_hash, baseline_count,
            injected_at::text as injected_at, retired_at::text as retired_at
     FROM prompt_changes
     ORDER BY injected_at DESC`
  )
}

// ============================================================
// v2: 效應量化
// ============================================================

export interface PromptChangeEffect {
  change: PromptChange
  currentWeeklyCount: number
  reductionPct: number          // 正 = 下降（好），負 = 上升（壞）
  weeksActive: number
  retirementCandidate: boolean  // currentWeeklyCount < 5 且 weeksActive >= 4
}

/**
 * 量化每條活躍 prompt change 的效應：注入前基線 vs 最近 7 天觸發數
 */
export async function measurePromptChangeEffects(): Promise<PromptChangeEffect[]> {
  const active = await getActivePromptChanges()
  if (active.length === 0) return []

  const effects: PromptChangeEffect[] = []
  for (const change of active) {
    // 查該 pattern 最近 7 天觸發數
    const row = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*)::int as count
       FROM skill_telemetry
       WHERE pattern_key = $1 AND skill_name = $2
         AND created_at >= NOW() - INTERVAL '7 days'`,
      [change.pattern_key, change.skill_name]
    )
    const currentWeeklyCount = row?.count || 0

    const baseline = change.baseline_count
    const reductionPct = baseline > 0
      ? Math.round(((baseline - currentWeeklyCount) / baseline) * 1000) / 10
      : 0  // baseline 0 → 無法計算

    const injectedAt = new Date(change.injected_at)
    const weeksActive = Math.max(1, Math.round((Date.now() - injectedAt.getTime()) / (7 * 24 * 60 * 60 * 1000)))

    effects.push({
      change,
      currentWeeklyCount,
      reductionPct,
      weeksActive,
      retirementCandidate: currentWeeklyCount < 5 && weeksActive >= 4,
    })
  }

  return effects
}

// ============================================================
// v3: Failure 聚合查詢
// ============================================================

export interface FailureOverviewRow {
  outcome: string
  skill_name: string
  count: number
}

export interface FailureByPhaseRow {
  phase: string
  count: number
  avg_fix_rounds: number
}

export interface RootCauseRow {
  root_cause_category: string
  count: number
}

export interface RecoveryRow {
  phase: string
  total: number
  recovered_count: number
  recovery_rate: number
}

export async function aggregateFailureOverview(days = 7): Promise<{
  byOutcome: FailureOverviewRow[]
  byPhase: FailureByPhaseRow[]
  topRootCauses: RootCauseRow[]
  recoveryStats: RecoveryRow[]
}> {
  const [byOutcome, byPhase, topRootCauses, recoveryStats] = await Promise.all([
    db.queryMany<FailureOverviewRow>(
      `SELECT outcome, skill_name, COUNT(*)::int as count
       FROM skill_telemetry
       WHERE created_at >= NOW() - ($1 || ' days')::interval AND outcome != 'success'
       GROUP BY outcome, skill_name ORDER BY count DESC`,
      [String(days)]
    ),
    db.queryMany<FailureByPhaseRow>(
      `SELECT phase, COUNT(*)::int as count, ROUND(AVG(fix_rounds)::numeric, 2)::float as avg_fix_rounds
       FROM skill_telemetry
       WHERE created_at >= NOW() - ($1 || ' days')::interval AND outcome != 'success' AND phase IS NOT NULL
       GROUP BY phase ORDER BY count DESC LIMIT 20`,
      [String(days)]
    ),
    db.queryMany<RootCauseRow>(
      `SELECT root_cause_category, COUNT(*)::int as count
       FROM skill_telemetry
       WHERE created_at >= NOW() - ($1 || ' days')::interval AND root_cause_category IS NOT NULL
       GROUP BY root_cause_category ORDER BY count DESC LIMIT 10`,
      [String(days)]
    ),
    db.queryMany<RecoveryRow>(
      `SELECT phase,
              COUNT(*)::int as total,
              COUNT(*) FILTER (WHERE recovered = true)::int as recovered_count,
              ROUND(COUNT(*) FILTER (WHERE recovered = true)::numeric / NULLIF(COUNT(*), 0) * 100, 1)::float as recovery_rate
       FROM skill_telemetry
       WHERE created_at >= NOW() - ($1 || ' days')::interval AND outcome = 'timeout'
       GROUP BY phase ORDER BY total DESC`,
      [String(days)]
    ),
  ])

  return {
    byOutcome: byOutcome || [],
    byPhase: byPhase || [],
    topRootCauses: topRootCauses || [],
    recoveryStats: recoveryStats || [],
  }
}

// ============================================================
// v2: Direction A 候選偵測
// ============================================================

/** 判斷一個 pattern_key 是否「已有 sanitize regex 能修」→ 可以轉為 code rule */
export function isCodeFixablePattern(patternKey: string): boolean {
  return SANITIZE_PATTERN_MAP.some(([, key]) => key === patternKey)
}

export interface DirectionACandidate {
  pattern_key: string
  event_type: string   // 出現在哪個 event（通常是 qg_rule_fix）
  count: number
  reason: string       // 為什麼是 Direction A 候選
}

/**
 * 從 top patterns 中找出「高頻 + 可以用 regex 修 + 目前只在 QG 被抓但 deployer 已有修」的候選。
 * 這意味著 LLM 在兩個 pipeline stage 都犯同樣錯誤，但只有一處有 deterministic 修復。
 */
/**
 * Self-Learning Loop (Tier A2 sibling): 結構性失敗 pattern 高頻監控
 *
 * 跟 findDirectionACandidates 不同：這個函數**明確聚焦**在結構性失敗事件
 * （red_validation_fail / alignment_blocked / coder_test_fail / coder_test_fix_give_up），
 * threshold 較低（5 次/週）。目的是讓週報直接看到「LLM 仍解不掉、應變 deterministic 的高頻 pattern」。
 *
 * 用法：reviewer 看週報拿到候選 → 評估是否寫成新 deterministic fix 函數
 * （加進 deterministic-feature-fix.ts / deterministic-actions-fix.ts）→ 用
 * register-prompt-change.ts 記 audit。
 */
export interface StructuralFailureCandidate {
  pattern_key: string
  event_type: string
  count: number
  skill_name: string
  recommendation: string
}

export function findStructuralFailureCandidates(
  topPatterns: WeeklyReportRow[],
  threshold = 5
): StructuralFailureCandidate[] {
  const TARGET_EVENT_TYPES = new Set([
    'red_validation_fail',
    'alignment_blocked',
    'coder_test_fail',
    'coder_test_fix_give_up',
    'fix_convergence_failed',
    'qg_high_retry_count',  // Tier A4 加的
    'first_batch_missing_nav',  // R8 加：first batch LLM 漏生 Header/Footer 元件
    'contrast_qg_residual',  // R9 加：QG 觸發 = Layer 3 deployer auto-swap 漏網（high signal）
    'contrast_auto_swap_unsafe',  // R9 加：swap 後仍 unsafe（mid-saturation 色找不到 safe fg）
    'preview_auto_fix_give_up',  // R10 加：L3+L4 N 輪用盡仍失敗（high signal Layer 5 開了沒救到）
    'extension_apply_failed',  // R11 加：extension /apply-update 失敗（reason 含 text-not-unique / invalid-op）
  ])

  return topPatterns
    .filter(row => TARGET_EVENT_TYPES.has(row.event_type) && row.count >= threshold)
    .map(row => ({
      pattern_key: row.pattern_key,
      event_type: row.event_type,
      count: row.count,
      skill_name: row.skill_name,
      recommendation: row.event_type === 'fix_convergence_failed'
        ? `LLM 修 ≥2 輪指紋一致 — 寫 deterministic fix 取代 LLM repair`
        : row.event_type === 'qg_high_retry_count'
        ? `UIUX QG 多次失敗 — 考慮啟動 vendored designmd fallback`
        : row.event_type === 'coder_test_fail' || row.event_type === 'coder_test_fix_give_up'
        ? `Coder 業務邏輯重複失敗 — 看是否需要新 coder-handlers 模板`
        : row.event_type === 'first_batch_missing_nav'
        ? `LLM first batch 漏生 Header/Footer — prompt 已強化 (53afbecb)，若仍高頻則考慮 deterministic auto-inject fallback`
        : row.event_type === 'contrast_qg_residual'
        ? `Layer 3 deployer auto-swap 漏網（Layer 4 QG 才抓到）— 看 patternKey 解析 button 偵測 regex 缺哪類 pattern`
        : row.event_type === 'contrast_auto_swap_unsafe'
        ? `Mid-saturation color (e.g. bg-yellow-400) 找不到 ≥ 4.5 fg — 考慮 darken/lighten base 或加 ring fallback`
        : row.event_type === 'preview_auto_fix_give_up'
        ? `R10 L3+L4 LLM 修不動 — 分析 patternKey 看哪類 build error LLM 失敗最多，加 fixBuildErrors prompt few-shot 或補 deterministic fix`
        : row.event_type === 'extension_apply_failed'
        ? `R11 extension /apply-update 失敗 — 分析 patternKey: text-not-unique 高頻 → 升級 Babel AST patch (commit 8+) 處理重複字串；invalid-op 高頻 → 擴展 SAFE_STYLE_KEYS 白名單`
        : `規格驗證/對齊重複失敗 — 看是否需要新 deterministic feature fix`,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
}

export function findDirectionACandidates(
  topPatterns: WeeklyReportRow[],
  activeChanges: PromptChange[],
  threshold = 10
): DirectionACandidate[] {
  const activePatterns = new Set(activeChanges.map(c => `${c.pattern_key}|${c.skill_name}`))
  const candidates: DirectionACandidate[] = []

  for (const row of topPatterns) {
    if (row.count < threshold) continue
    // 已有活躍的 prompt change → 跳過
    if (activePatterns.has(`${row.pattern_key}|${row.skill_name}`)) continue

    if (isCodeFixablePattern(row.pattern_key) && row.event_type === 'qg_rule_fix') {
      candidates.push({
        pattern_key: row.pattern_key,
        event_type: row.event_type,
        count: row.count,
        reason: `已有 sanitize regex，但 QG 仍在觸發 → 同步到 QG rule-based`,
      })
    } else if (isCodeFixablePattern(row.pattern_key) && row.event_type !== 'sanitize_fix') {
      candidates.push({
        pattern_key: row.pattern_key,
        event_type: row.event_type,
        count: row.count,
        reason: `可用 regex 修但目前無 code rule 覆蓋此路徑`,
      })
    }
  }

  return candidates
}
