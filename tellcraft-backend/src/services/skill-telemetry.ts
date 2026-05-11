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
