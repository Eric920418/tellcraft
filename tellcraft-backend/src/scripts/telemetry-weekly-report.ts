/**
 * Skill Telemetry 週報腳本 v2
 *
 * 用法：
 *   cd tellcraft-backend
 *   pnpm tsx src/scripts/telemetry-weekly-report.ts              # 預設 7 天
 *   pnpm tsx src/scripts/telemetry-weekly-report.ts --days=1     # 自訂天數
 *   pnpm tsx src/scripts/telemetry-weekly-report.ts --json       # 輸出 JSON 而非 markdown
 *
 * v2 新增：
 *   - Week-over-week delta（↑/↓ 對照）
 *   - Prompt change 效應追蹤（注入前基線 vs 最新觸發數）
 *   - 汰換候選（連續 4 週 < 5 次）
 *   - Direction A 候選（高頻 + 可轉 code rule）
 *
 * 嚴格禁止自動回灌 prompt（會炸 prompt cache 命中率，CLAUDE.md 已警告）。
 */

import {
  aggregateWeeklyReportWithDelta,
  aggregateFailureOverview,
  measurePromptChangeEffects,
  getActivePromptChanges,
  findDirectionACandidates,
  type WeeklyReportWithDelta,
  type PromptChangeEffect,
  type DirectionACandidate,
  type WeeklyReportRow,
  type FailureOverviewRow,
  type FailureByPhaseRow,
  type RootCauseRow,
  type RecoveryRow,
} from '../services/skill-telemetry'
import { closePool } from '../db/client'

function parseArgs(): { days: number; json: boolean } {
  let days = 7
  let json = false
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--days=')) {
      const n = Number(arg.slice('--days='.length))
      if (!Number.isNaN(n) && n > 0) days = n
    } else if (arg === '--json') {
      json = true
    }
  }
  return { days, json }
}

function extractFeedbackSamples(payloads: unknown[]): string[] {
  const samples: string[] = []
  for (const p of payloads) {
    if (p && typeof p === 'object' && 'feedback' in p) {
      const fb = (p as { feedback?: unknown }).feedback
      if (typeof fb === 'string' && fb.trim()) {
        samples.push(fb.replace(/\s+/g, ' ').slice(0, 80))
      }
    }
  }
  return samples.slice(0, 3)
}

// ============================================================
// Delta 格式化
// ============================================================

function formatDelta(deltaPct: number | null): string {
  if (deltaPct === null) return 'NEW'
  if (deltaPct <= -50) return `↓↓ ${deltaPct.toFixed(1)}%`
  if (deltaPct < 0) return `↓ ${deltaPct.toFixed(1)}%`
  if (deltaPct === 0) return '→ 0%'
  if (deltaPct <= 50) return `↑ +${deltaPct.toFixed(1)}%`
  return `↑↑ +${deltaPct.toFixed(1)}%`
}

// ============================================================
// Status 欄（來自 prompt_changes）
// ============================================================

function buildStatusMap(effects: PromptChangeEffect[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const e of effects) {
    const key = `${e.change.pattern_key}|${e.change.skill_name}`
    const date = e.change.injected_at.slice(5, 10) // MM-DD
    const action = e.change.action_type
    if (e.retirementCandidate) {
      map.set(key, `🎓 ${action} (${date}) 畢業候選`)
    } else if (e.reductionPct < 10 && e.weeksActive >= 2) {
      map.set(key, `⚠️ ${action} (${date}) 無效`)
    } else if (e.reductionPct >= 50) {
      map.set(key, `✅ ${action} (${date}) ↓${e.reductionPct.toFixed(0)}%`)
    } else {
      map.set(key, `🔧 ${action} (${date})`)
    }
  }
  return map
}

// ============================================================
// Top Patterns（含 delta + status）
// ============================================================

function formatTopPatterns(
  report: WeeklyReportWithDelta,
  statusMap: Map<string, string>
): string {
  if (report.topPatterns.length === 0) {
    return '_（無資料）_\n'
  }

  const deltaMap = new Map<string, number | null>()
  for (const d of report.deltas) {
    deltaMap.set(`${d.skill_name}|${d.event_type}|${d.pattern_key}`, d.delta_pct)
  }

  const grouped = new Map<string, WeeklyReportRow[]>()
  for (const row of report.topPatterns) {
    const key = `${row.skill_name} / ${row.event_type}`
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(row)
  }

  const perDay = (count: number) => (count / report.windowDays).toFixed(1)
  const sections: string[] = []

  for (const [groupKey, rows] of grouped) {
    sections.push(`### ${groupKey}`)
    sections.push('')
    const isIteration = groupKey.includes('iteration')

    if (isIteration) {
      sections.push('| pattern_key | count | Δ vs prev | avg/day | rounds | status | feedback samples |')
      sections.push('|---|---|---|---|---|---|---|')
      for (const row of rows) {
        const delta = deltaMap.get(`${row.skill_name}|${row.event_type}|${row.pattern_key}`)
        const status = statusMap.get(`${row.pattern_key}|${row.skill_name}`) || '—'
        const samples = extractFeedbackSamples(row.sample_payloads || [])
        const samplesCell = samples.length > 0
          ? samples.map(s => `"${s}"`).join(' · ')
          : '_(無)_'
        sections.push(
          `| \`${row.pattern_key}\` | ${row.count} | ${formatDelta(delta ?? null)} | ${perDay(row.count)} | ${row.avg_fix_rounds} | ${status} | ${samplesCell} |`
        )
      }
    } else {
      sections.push('| pattern_key | count | Δ vs prev | avg/day | rounds | status |')
      sections.push('|---|---|---|---|---|---|')
      for (const row of rows) {
        const delta = deltaMap.get(`${row.skill_name}|${row.event_type}|${row.pattern_key}`)
        const status = statusMap.get(`${row.pattern_key}|${row.skill_name}`) || '—'
        sections.push(
          `| \`${row.pattern_key}\` | ${row.count} | ${formatDelta(delta ?? null)} | ${perDay(row.count)} | ${row.avg_fix_rounds} | ${status} |`
        )
      }
    }
    sections.push('')
  }

  return sections.join('\n')
}

// ============================================================
// Prompt Change 效應追蹤
// ============================================================

function formatEffectTracking(effects: PromptChangeEffect[]): string {
  if (effects.length === 0) {
    return '_（無已註冊的 prompt changes）_\n'
  }

  const lines = [
    '| pattern | action | target | 注入日 | 基線 | 本週 | 效應 | weeks | 建議 |',
    '|---|---|---|---|---|---|---|---|---|',
  ]

  for (const e of effects) {
    const date = e.change.injected_at.slice(0, 10)
    const reductionStr = e.change.baseline_count > 0
      ? `${e.reductionPct > 0 ? '↓' : '↑'} ${Math.abs(e.reductionPct).toFixed(1)}%`
      : '_(no baseline)_'

    let suggestion = ''
    if (e.retirementCandidate) {
      suggestion = '🎓 畢業候選，考慮 retire'
    } else if (e.reductionPct >= 80) {
      suggestion = '✅ 保留'
    } else if (e.reductionPct >= 50) {
      suggestion = '✅ 有效'
    } else if (e.reductionPct < 10 && e.weeksActive >= 2) {
      if (e.change.action_type === 'prompt_fewshot') {
        suggestion = '⚠️ 無效，轉 Direction A'
      } else {
        suggestion = '⚠️ 效果不佳，檢查規則'
      }
    } else {
      suggestion = '🔍 觀察中'
    }

    lines.push(
      `| \`${e.change.pattern_key}\` | ${e.change.action_type} | ${e.change.target_file} | ${date} | ${e.change.baseline_count} | ${e.currentWeeklyCount} | ${reductionStr} | ${e.weeksActive}w | ${suggestion} |`
    )
  }

  return lines.join('\n') + '\n'
}

// ============================================================
// 汰換候選
// ============================================================

function formatRetirementCandidates(effects: PromptChangeEffect[]): string {
  const candidates = effects.filter(e => e.retirementCandidate)
  if (candidates.length === 0) {
    return '_（無汰換候選）_\n'
  }
  const lines: string[] = []
  for (const e of candidates) {
    const date = e.change.injected_at.slice(5, 10)
    lines.push(
      `- [ ] \`${e.change.pattern_key}\` (${e.change.action_type}, ${date}, id=${e.change.id}) — 本週 ${e.currentWeeklyCount} 次，活躍 ${e.weeksActive} 週 → 考慮 \`--retire ${e.change.id}\``
    )
  }
  return lines.join('\n') + '\n'
}

// ============================================================
// Direction A 候選
// ============================================================

function formatDirectionACandidates(candidates: DirectionACandidate[]): string {
  if (candidates.length === 0) {
    return '_（無 Direction A 候選）_\n'
  }
  const lines: string[] = []
  for (const c of candidates) {
    lines.push(
      `- [ ] \`${c.pattern_key}\` (${c.event_type}, ${c.count}/week) — ${c.reason}`
    )
  }
  return lines.join('\n') + '\n'
}

// ============================================================
// Action Items
// ============================================================

function formatActionItems(report: WeeklyReportWithDelta, statusMap: Map<string, string>): string {
  const items: string[] = []
  const threshold = Math.max(10, Math.floor(report.windowDays * 5))

  for (const row of report.topPatterns.slice(0, 10)) {
    if (row.count < threshold) continue
    // 已有活躍 prompt change → 跳過（效應追蹤區段已處理）
    if (statusMap.has(`${row.pattern_key}|${row.skill_name}`)) continue

    const perDay = (row.count / report.windowDays).toFixed(1)
    let hint = ''
    if (row.skill_name === 'deployer' && row.event_type === 'sanitize_fix') {
      hint = '→ Direction A: 檢查能否同步到 QG rule-based'
    } else if (row.skill_name === 'quality_gate' && row.event_type === 'qg_rule_fix') {
      hint = '→ 檢查 uiux-generation.ts system prompt 是否已明確禁止'
    } else if (row.skill_name === 'quality_gate' && row.event_type === 'qg_llm_fallback') {
      hint = '→ LLM fallback 最高成本修復，優先調查'
    } else if (row.skill_name === 'iteration') {
      hint = '→ 用戶「完成後」仍要改 = 首次生成缺漏，檢視 feedback'
    }
    items.push(`- [ ] \`${row.skill_name}/${row.event_type}/${row.pattern_key}\` — ${row.count} 次 (${perDay}/day) ${hint}`)
  }

  if (items.length === 0) {
    return '_（無新高頻 pattern，保持觀察）_\n'
  }
  return items.join('\n') + '\n'
}

// ============================================================
// Failure Overview (v3)
// ============================================================

function formatFailureOverview(
  byOutcome: FailureOverviewRow[],
  byPhase: FailureByPhaseRow[],
): string {
  if (byOutcome.length === 0) {
    return '_（無 failure 資料，所有事件均為 success）_\n'
  }

  const sections: string[] = []

  sections.push('### By Outcome × Skill')
  sections.push('')
  sections.push('| outcome | skill | count |')
  sections.push('|---|---|---|')
  for (const row of byOutcome) {
    sections.push(`| ${row.outcome} | ${row.skill_name} | ${row.count} |`)
  }
  sections.push('')

  if (byPhase.length > 0) {
    sections.push('### By Phase')
    sections.push('')
    sections.push('| phase | count | avg_fix_rounds |')
    sections.push('|---|---|---|')
    for (const row of byPhase) {
      sections.push(`| ${row.phase} | ${row.count} | ${row.avg_fix_rounds} |`)
    }
    sections.push('')
  }

  return sections.join('\n')
}

function formatTopRootCauses(rootCauses: RootCauseRow[]): string {
  if (rootCauses.length === 0) {
    return '_（無 root_cause_category 資料）_\n'
  }
  const lines = [
    '| root_cause | count |',
    '|---|---|',
  ]
  for (const row of rootCauses) {
    lines.push(`| \`${row.root_cause_category}\` | ${row.count} |`)
  }
  return lines.join('\n') + '\n'
}

function formatRecoveryStats(stats: RecoveryRow[]): string {
  if (stats.length === 0) {
    return '_（無 timeout/recovery 資料）_\n'
  }
  const lines = [
    '| phase | total timeouts | recovered | recovery rate |',
    '|---|---|---|---|',
  ]
  for (const row of stats) {
    lines.push(`| ${row.phase} | ${row.total} | ${row.recovered_count} | ${row.recovery_rate}% |`)
  }
  return lines.join('\n') + '\n'
}

// ============================================================
// Escalations
// ============================================================

function formatEscalations(report: WeeklyReportWithDelta): string {
  if (report.escalations.length === 0) {
    return '_（無 fix_rounds >= 3 的個案）_\n'
  }
  const lines = [
    '| conversation_id | skill / event | pattern | fix_rounds | when |',
    '|---|---|---|---|---|',
  ]
  for (const e of report.escalations) {
    const convShort = e.conversation_id ? e.conversation_id.slice(0, 8) : '_(null)_'
    lines.push(
      `| \`${convShort}\` | ${e.skill_name} / ${e.event_type} | \`${e.pattern_key}\` | ${e.fix_rounds} | ${e.created_at.slice(0, 19)} |`
    )
  }
  return lines.join('\n') + '\n'
}

// ============================================================
// Markdown 組裝
// ============================================================

function renderMarkdown(
  report: WeeklyReportWithDelta,
  effects: PromptChangeEffect[],
  directionA: DirectionACandidate[],
  failureData?: { byOutcome: FailureOverviewRow[]; byPhase: FailureByPhaseRow[]; topRootCauses: RootCauseRow[]; recoveryStats: RecoveryRow[] }
): string {
  const date = new Date().toISOString().slice(0, 10)
  const statusMap = buildStatusMap(effects)
  const totalDelta = report.previousPeriodTotal > 0
    ? ((report.totalEvents - report.previousPeriodTotal) / report.previousPeriodTotal * 100).toFixed(1)
    : 'N/A'

  return `# Skill Telemetry Weekly Report — ${date}

- Window: **${report.windowDays} days**
- Total events: **${report.totalEvents}** (prev: ${report.previousPeriodTotal}, Δ ${totalDelta}%)
- Active prompt changes: **${effects.length}**
- Generated at: ${report.generatedAt}

---

## Top Patterns (with Δ vs previous period)

${formatTopPatterns(report, statusMap)}

---

## Prompt Change 效應追蹤

> 每條已註冊的 prompt change（prompt_fewshot / sanitize_rule / qg_rule）的注入前基線 vs 最新 7 天觸發數。
> reduction < 10% 且活躍 >= 2 週 → 標記無效。currentWeeklyCount < 5 且活躍 >= 4 週 → 畢業候選。

${formatEffectTracking(effects)}

---

## 汰換候選（畢業）

> 連續 4 週 < 5 次觸發 = 問題已解決或極少發生。考慮移除 few-shot / 規則以控制 prompt 膨脹。
> 執行汰換：\`pnpm tsx src/scripts/register-prompt-change.ts --retire <id>\`

${formatRetirementCandidates(effects)}

---

## Direction A 候選（轉 code rule）

> 高頻 pattern + 已有 regex 能修（在 SANITIZE_PATTERN_MAP 中）→ 轉為 deterministic code rule 比教 LLM 更穩。
> 常見場景：pattern 在 deployer sanitize 已有修復，但 QG 路徑沒有 → 同步到 QG rule-based。

${formatDirectionACandidates(directionA)}

---

## Action Items (未註冊的高頻 pattern)

> count >= max(10, days*5) 且無活躍 prompt change 的 pattern。
> 三條路：(A) 寫 sanitize/QG 規則  (B) 回灌 prompt few-shot  (C) 觀察

${formatActionItems(report, statusMap)}

---

## Escalations (fix_rounds >= 3)

${formatEscalations(report)}

---

## Failure Overview

> outcome != 'success' 的事件分佈。包含 failed / blocked / timeout / repaired。

${failureData ? formatFailureOverview(failureData.byOutcome, failureData.byPhase) : '_（跳過 — 使用 --no-failure 或 schema 尚未升級）_\n'}

---

## Top Root Causes

> root_cause_category 分佈（來自 Coder classifyFailureRootCause 8 類 + Orchestrator classifyPhaseError）。

${failureData ? formatTopRootCauses(failureData.topRootCauses) : '_（無資料）_\n'}

---

## Recovery Success Rate

> FlowState 超時偵測 → 自動恢復的成功率，按 phase 拆分。

${failureData ? formatRecoveryStats(failureData.recoveryStats) : '_（無資料）_\n'}

---

_Generated by \`telemetry-weekly-report.ts\` v3_
`
}

// ============================================================
// Main
// ============================================================

async function main() {
  const { days, json } = parseArgs()

  try {
    const [report, effects, activeChanges, failureData] = await Promise.all([
      aggregateWeeklyReportWithDelta(days),
      measurePromptChangeEffects(),
      getActivePromptChanges(),
      aggregateFailureOverview(days).catch(() => undefined),
    ])

    const directionA = findDirectionACandidates(report.topPatterns, activeChanges)

    if (json) {
      process.stdout.write(JSON.stringify({ report, effects, directionA, failureData }, null, 2) + '\n')
    } else {
      process.stdout.write(renderMarkdown(report, effects, directionA, failureData))
    }
  } catch (err) {
    console.error('週報生成失敗：', err)
    process.exit(1)
  } finally {
    await closePool().catch(() => {})
  }
}

main()
