/**
 * Skill Telemetry 週報腳本
 *
 * 用法：
 *   cd tellcraft-backend
 *   pnpm tsx src/scripts/telemetry-weekly-report.ts              # 預設 7 天
 *   pnpm tsx src/scripts/telemetry-weekly-report.ts --days=1     # 自訂天數
 *   pnpm tsx src/scripts/telemetry-weekly-report.ts --json       # 輸出 JSON 而非 markdown
 *
 * 輸出：markdown 到 stdout，供人工審閱後決定哪些 pattern 要回灌 prompt。
 * 嚴格禁止自動回灌 prompt（會炸 prompt cache 命中率，CLAUDE.md 已警告）。
 */

import { aggregateWeeklyReport, type WeeklyReport } from '../services/skill-telemetry'
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
        // 去換行、限 80 字
        samples.push(fb.replace(/\s+/g, ' ').slice(0, 80))
      }
    }
  }
  return samples.slice(0, 3)
}

function formatTopPatterns(report: WeeklyReport): string {
  if (report.topPatterns.length === 0) {
    return '_（無資料）_\n'
  }

  // 按 skill_name + event_type 分組
  const grouped = new Map<string, typeof report.topPatterns>()
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
      sections.push('| pattern_key | count | avg/day | avg_rounds | feedback samples |')
      sections.push('|---|---|---|---|---|')
      for (const row of rows) {
        const samples = extractFeedbackSamples(row.sample_payloads || [])
        const samplesCell = samples.length > 0
          ? samples.map(s => `"${s}"`).join(' · ')
          : '_(無)_'
        sections.push(
          `| \`${row.pattern_key}\` | ${row.count} | ${perDay(row.count)} | ${row.avg_fix_rounds} | ${samplesCell} |`
        )
      }
    } else {
      sections.push('| pattern_key | count | avg/day | avg_rounds |')
      sections.push('|---|---|---|---|')
      for (const row of rows) {
        sections.push(
          `| \`${row.pattern_key}\` | ${row.count} | ${perDay(row.count)} | ${row.avg_fix_rounds} |`
        )
      }
    }
    sections.push('')
  }

  return sections.join('\n')
}

function formatEscalations(report: WeeklyReport): string {
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

function formatActionItems(report: WeeklyReport): string {
  // 自動從 top patterns 挑出高頻項目給人工 review
  const items: string[] = []
  const threshold = Math.max(10, Math.floor(report.windowDays * 5))

  for (const row of report.topPatterns.slice(0, 10)) {
    if (row.count < threshold) continue
    const perDay = (row.count / report.windowDays).toFixed(1)
    let hint = ''
    if (row.skill_name === 'deployer' && row.event_type === 'sanitize_fix') {
      hint = '→ 檢查對應 skill 的 system prompt 是否已明確規範'
    } else if (row.skill_name === 'quality_gate' && row.event_type === 'qg_rule_fix') {
      hint = '→ 檢查 uiux-generation.ts 的 system prompt 是否有明確禁止'
    } else if (row.skill_name === 'quality_gate' && row.event_type === 'qg_llm_fallback') {
      hint = '→ LLM fallback 是最高成本修復，優先調查'
    } else if (row.skill_name === 'iteration') {
      hint = '→ 用戶「完成後」仍要改 = 首次生成缺漏，檢視 feedback samples 找 pattern'
    }
    items.push(`- [ ] \`${row.skill_name}/${row.event_type}/${row.pattern_key}\` — ${row.count} 次 (${perDay}/day) ${hint}`)
  }

  if (items.length === 0) {
    return '_（無高頻 pattern，保持觀察）_\n'
  }
  return items.join('\n') + '\n'
}

function renderMarkdown(report: WeeklyReport): string {
  const date = new Date().toISOString().slice(0, 10)
  return `# Skill Telemetry Weekly Report — ${date}

- Window: **${report.windowDays} days**
- Total events: **${report.totalEvents}**
- Generated at: ${report.generatedAt}

---

## Top Patterns

${formatTopPatterns(report)}

---

## Action Items (manual review)

> 規則：count >= max(10, days*5) 才列出。人工決定是否回灌對應 service 的 system prompt，禁止自動回灌。

${formatActionItems(report)}

---

## Escalations (fix_rounds >= 3)

${formatEscalations(report)}

---

_Generated by \`telemetry-weekly-report.ts\`_
`
}

async function main() {
  const { days, json } = parseArgs()

  try {
    const report = await aggregateWeeklyReport(days)

    if (json) {
      process.stdout.write(JSON.stringify(report, null, 2) + '\n')
    } else {
      process.stdout.write(renderMarkdown(report))
    }
  } catch (err) {
    console.error('週報生成失敗：', err)
    process.exit(1)
  } finally {
    await closePool().catch(() => {})
  }
}

main()
