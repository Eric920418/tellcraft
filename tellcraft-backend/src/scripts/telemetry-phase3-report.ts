// ============================================================
// Phase 3 Telemetry Report (L31.J/K/L + L31.I cost guardrail)
//
// 一行跑看 Phase 3 多層攔截 + 智慧分流的真實效果：
//   pnpm tsx src/scripts/telemetry-phase3-report.ts [--days=N] [--json]
//
// 關鍵指標（治本成功標誌）：
//   - 平均 alignment gate cost：目標 < $1（治本前 c9cefcc6 = $8.62）
//   - cost_guardrail_breach 觸發率：目標 < 5%
//   - spec_first_repair_success / attempt：目標 > 60%
//   - Coder root cause 分佈：BDD-side vs Code-side
// ============================================================

import { Client } from 'pg'

interface Args {
  days: number
  json: boolean
}

function parseArgs(): Args {
  let days = 7
  let json = false
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--days=')) days = parseInt(arg.split('=')[1], 10) || 7
    if (arg === '--json') json = true
  }
  return { days, json }
}

interface Phase3Report {
  windowDays: number
  totalConversations: number
  alignmentGate: {
    avgCostUsd: number
    p95CostUsd: number
    maxCostUsd: number
    costBreachCount: number
    costBreachRate: number  // 0-1
  }
  specFirstRepair: {
    attemptCount: number
    successCount: number
    successRate: number
    avgFixCostUsd: number | null
  }
  coderRootCauseDistribution: Array<{
    rootCause: string
    count: number
    isBddSide: boolean
  }>
  preCoderStub: {
    runCount: number
    passedAfterFixCount: number
    blockedCount: number
  }
  dryRunThenDb: {
    estimatedTriggerCount: number  // 從 fix_rounds > 0 估算（dry-run sanitize_fix events）
  }
}

const BDD_SIDE_ROOT_CAUSES = new Set([
  'var_resolution', 'spec_inconsistency', 'api_summary_mismatch',
  'step_parsing', 'fk_constraint', 'entity_setup',
])

async function generateReport(args: Args): Promise<Phase3Report> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL 環境變數未設')

  const pg = new Client({ connectionString: databaseUrl })
  await pg.connect()

  try {
    const windowSql = `created_at >= NOW() - INTERVAL '${args.days} days'`

    // 1. 總對話數（含至少一條 message）
    const totalConvsResult = await pg.query(
      `SELECT COUNT(DISTINCT conversation_id)::int AS count
       FROM llm_usage
       WHERE conversation_id IS NOT NULL AND ${windowSql}`
    )
    const totalConversations = Number(totalConvsResult.rows[0]?.count ?? 0)

    // 2. Alignment gate cost — 用 llm_usage 表查 purpose LIKE 'formulation_fix_features%'
    const alignmentCostResult = await pg.query(
      `SELECT
         AVG(per_conv_cost)::float AS avg_cost,
         PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY per_conv_cost)::float AS p95_cost,
         MAX(per_conv_cost)::float AS max_cost,
         COUNT(*)::int AS conv_count
       FROM (
         SELECT conversation_id, SUM(cost_usd)::float AS per_conv_cost
         FROM llm_usage
         WHERE purpose LIKE 'formulation_fix_features%'
           AND conversation_id IS NOT NULL
           AND ${windowSql}
         GROUP BY conversation_id
       ) AS sub`
    )
    const ag = alignmentCostResult.rows[0] || {}

    // 3. cost_guardrail_breach 觸發數（從 skill_telemetry）
    const breachResult = await pg.query(
      `SELECT COUNT(DISTINCT conversation_id)::int AS count
       FROM skill_telemetry
       WHERE pattern_key = 'cost_guardrail_breach' AND ${windowSql}`
    )
    const breachCount = Number(breachResult.rows[0]?.count ?? 0)

    // 4. spec_first_repair 觸發 / 成功（Phase 3a + 3b 共用 event）
    const specRepairResult = await pg.query(
      `SELECT
         event_type,
         COUNT(*)::int AS count
       FROM skill_telemetry
       WHERE event_type IN ('spec_first_repair_attempt', 'spec_first_repair_success')
         AND ${windowSql}
       GROUP BY event_type`
    )
    let attemptCount = 0
    let successCount = 0
    for (const row of specRepairResult.rows) {
      if (row.event_type === 'spec_first_repair_attempt') attemptCount = Number(row.count)
      if (row.event_type === 'spec_first_repair_success') successCount = Number(row.count)
    }

    // 5. Coder root cause 分佈（從 coder_test_fail events）
    const rootCauseResult = await pg.query(
      `SELECT pattern_key, COUNT(*)::int AS count
       FROM skill_telemetry
       WHERE event_type = 'coder_test_fail' AND ${windowSql}
       GROUP BY pattern_key
       ORDER BY count DESC`
    )
    const coderRootCauseDistribution = rootCauseResult.rows.map((r: { pattern_key: string; count: number }) => ({
      rootCause: r.pattern_key,
      count: Number(r.count),
      isBddSide: BDD_SIDE_ROOT_CAUSES.has(r.pattern_key),
    }))

    // 6. Pre-Coder Stub 通過 / 阻塞（Phase 3b）
    const preCoderResult = await pg.query(
      `SELECT pattern_key, COUNT(*)::int AS count
       FROM skill_telemetry
       WHERE event_type IN ('spec_first_repair_success', 'red_validation_fail')
         AND pattern_key IN ('pre_coder_passed_after_fix', 'pre_coder_blocked')
         AND ${windowSql}
       GROUP BY pattern_key`
    )
    let passedAfterFix = 0
    let blocked = 0
    for (const row of preCoderResult.rows) {
      if (row.pattern_key === 'pre_coder_passed_after_fix') passedAfterFix = Number(row.count)
      if (row.pattern_key === 'pre_coder_blocked') blocked = Number(row.count)
    }

    // 7. Phase 3c then-db validation — 估算（既有 alignment_fixed events 不分 phase，看 dry-run 修復數做 proxy）
    const dryRunResult = await pg.query(
      `SELECT COUNT(*)::int AS count
       FROM skill_telemetry
       WHERE skill_name IN ('feature_gate', 'red_phase')
         AND event_type = 'alignment_fixed'
         AND ${windowSql}`
    )
    const dryRunTriggerCount = Number(dryRunResult.rows[0]?.count ?? 0)

    return {
      windowDays: args.days,
      totalConversations,
      alignmentGate: {
        avgCostUsd: Number(ag.avg_cost ?? 0),
        p95CostUsd: Number(ag.p95_cost ?? 0),
        maxCostUsd: Number(ag.max_cost ?? 0),
        costBreachCount: breachCount,
        costBreachRate: totalConversations > 0 ? breachCount / totalConversations : 0,
      },
      specFirstRepair: {
        attemptCount,
        successCount,
        successRate: attemptCount > 0 ? successCount / attemptCount : 0,
        avgFixCostUsd: null,  // 細粒度 cost 需從 payload 取，暫不計
      },
      coderRootCauseDistribution,
      preCoderStub: {
        runCount: passedAfterFix + blocked,
        passedAfterFixCount: passedAfterFix,
        blockedCount: blocked,
      },
      dryRunThenDb: {
        estimatedTriggerCount: dryRunTriggerCount,
      },
    }
  } finally {
    await pg.end()
  }
}

function formatReport(report: Phase3Report): string {
  const lines: string[] = []
  lines.push(`\n# Phase 3 Telemetry Report (近 ${report.windowDays} 天)`)
  lines.push(`\n總對話數：${report.totalConversations}`)

  lines.push(`\n## L31.I Alignment Gate Cost Guardrail`)
  lines.push(`平均 cost：$${report.alignmentGate.avgCostUsd.toFixed(2)} ${report.alignmentGate.avgCostUsd < 1 ? '✅ 治本' : '⚠️  仍偏高'}`)
  lines.push(`P95 cost：$${report.alignmentGate.p95CostUsd.toFixed(2)}`)
  lines.push(`Max cost：$${report.alignmentGate.maxCostUsd.toFixed(2)}`)
  lines.push(`cost_guardrail_breach：${report.alignmentGate.costBreachCount} 對話（${(report.alignmentGate.costBreachRate * 100).toFixed(1)}%）${report.alignmentGate.costBreachRate < 0.05 ? '✅' : '⚠️ '}`)

  lines.push(`\n## L31.J/K Spec-First Repair (fixFailingSpec)`)
  lines.push(`觸發次數：${report.specFirstRepair.attemptCount}`)
  lines.push(`成功次數：${report.specFirstRepair.successCount}`)
  lines.push(`成功率：${(report.specFirstRepair.successRate * 100).toFixed(1)}% ${report.specFirstRepair.successRate > 0.6 ? '✅' : report.specFirstRepair.attemptCount > 0 ? '⚠️ ' : ''}`)

  lines.push(`\n## Coder Root Cause Distribution`)
  if (report.coderRootCauseDistribution.length === 0) {
    lines.push(`(無 coder_test_fail 事件)`)
  } else {
    const totalCoderFails = report.coderRootCauseDistribution.reduce((sum, r) => sum + r.count, 0)
    const bddSideCount = report.coderRootCauseDistribution.filter(r => r.isBddSide).reduce((sum, r) => sum + r.count, 0)
    lines.push(`總 Coder 失敗：${totalCoderFails}`)
    lines.push(`BDD-side rootCause：${bddSideCount}（${(bddSideCount / totalCoderFails * 100).toFixed(1)}%）— 這些應走 fixFailingSpec`)
    lines.push(`Code-side rootCause：${totalCoderFails - bddSideCount} — 走 fixFailingAction`)
    lines.push(`分佈：`)
    for (const r of report.coderRootCauseDistribution) {
      lines.push(`  ${r.isBddSide ? '🔸' : '🔹'} ${r.rootCause.padEnd(30)} ${r.count}`)
    }
  }

  lines.push(`\n## L31.K Pre-Coder Stub Validation (Phase 3b)`)
  lines.push(`執行：${report.preCoderStub.runCount}`)
  lines.push(`修復後通過：${report.preCoderStub.passedAfterFixCount}`)
  lines.push(`阻塞：${report.preCoderStub.blockedCount}`)

  lines.push(`\n## L31.L Dry-Run Then-DB Validation (Phase 3c)`)
  lines.push(`估計觸發數（從 alignment_fixed events）：${report.dryRunThenDb.estimatedTriggerCount}`)
  lines.push(`註：Phase 3c errors 被既有 caller fixMultipleFeatures 修復迴圈接走，跟其他 alignment 修復共用 event`)

  // 整體判定
  lines.push(`\n## 治本評估`)
  const isHealthy =
    report.alignmentGate.avgCostUsd < 1 &&
    report.alignmentGate.costBreachRate < 0.05 &&
    (report.specFirstRepair.attemptCount === 0 || report.specFirstRepair.successRate > 0.6)
  lines.push(isHealthy ? '✅ Phase 3 治本路徑運作良好 — 可繼續觀察或開 Phase 4' : '⚠️  指標仍偏高 — 建議：')
  if (!isHealthy) {
    if (report.alignmentGate.avgCostUsd >= 1) lines.push(`  - alignment cost 偏高 → 檢查 fixMultipleFeatures 是否仍在打地鼠`)
    if (report.alignmentGate.costBreachRate >= 0.05) lines.push(`  - guardrail 太常觸發 → 考慮調 env ALIGNMENT_GATE_MAX_COST_USD`)
    if (report.specFirstRepair.attemptCount > 0 && report.specFirstRepair.successRate <= 0.6) {
      lines.push(`  - fixFailingSpec 成功率低 → prompt 可能不夠精準（檢查 BDD_FIX_DIRECTION_HINTS）`)
    }
  }

  return lines.join('\n')
}

async function main() {
  const args = parseArgs()
  const report = await generateReport(args)
  if (args.json) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(formatReport(report))
  }
  process.exit(0)
}

main().catch(err => {
  console.error('Phase 3 report 失敗:', err)
  process.exit(1)
})
