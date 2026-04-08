/**
 * Skill Telemetry — 自我強化迴圈 v1
 *
 * 從已經在「擦屁股」的修復點收集失敗訊號，供每週 markdown 報告人工回灌 prompt。
 *
 * 設計原則：
 * 1. Fire-and-forget — 任何寫入失敗都不能中斷生成 pipeline
 * 2. 零 LLM — 所有 pattern 分類用 regex
 * 3. Payload 上限 4KB — 避免巨大 blob 拖慢 DB
 * 4. 人工回灌 — 禁止自動改 prompt，週報 → 手工決策 → 手改 system prompt
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

export type EventType =
  | 'sanitize_fix'
  | 'qg_rule_fix'
  | 'qg_llm_fallback'
  | 'iteration'

export type TelemetrySeverity = 'critical' | 'warning' | 'info'

export interface TelemetryEvent {
  skillName: SkillName
  eventType: EventType
  patternKey: string
  severity?: TelemetrySeverity
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
         (skill_name, event_type, pattern_key, severity, user_id, conversation_id, project_id, payload, fix_rounds)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
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
      ]
    )
  } catch (err) {
    logger.warn({ err, event: { ...event, payload: undefined } }, 'telemetry insert failed')
  }
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
  [/Next\.js 15 async params/, 'next15-async-params'],
  [/useSearchParams Suspense/, 'search-params-suspense'],
  [/broken import.*→ 生成 stub/, 'broken-import-stub'],
  [/named import.*不存在/, 'named-import-missing'],
  [/未知依賴/, 'unknown-dependency'],
  [/自動補充 .* 個第三方依賴/, 'auto-add-dependency'],
  [/補上缺失的 <body>/, 'missing-body-tag'],
  [/補上缺失的.*標籤/, 'missing-html-tags'],
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
