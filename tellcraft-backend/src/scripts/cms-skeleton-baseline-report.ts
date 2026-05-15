/**
 * CMS Skeleton Baseline Report — Phase 1 Week 4
 *
 * 對比「命中 CMS shape 的 conversations（套用 skeleton）」vs「非 CMS shape conversations」的：
 *   - 平均 LLM call 數 / 平均 cost / 平均完成時間
 *
 * 用法：
 *   pnpm tsx src/scripts/cms-skeleton-baseline-report.ts                # 預設 30 天
 *   pnpm tsx src/scripts/cms-skeleton-baseline-report.ts --days=14
 *   pnpm tsx src/scripts/cms-skeleton-baseline-report.ts --json
 *
 * 限制：
 *   - 「一次過率」需要從 FlowState 或 generation 表抽取，本初版不算 — 等量化標準確定再加
 *   - 只覆蓋過去 N 天且有 LLM 用量的 conversations，沒部署的會被列入
 *   - skeleton 組與非 skeleton 組可能 size 不對等，個位數樣本參考意義有限
 */
import * as db from '../db/client'
import { closePool } from '../db/client'

interface CohortStats {
  conversationCount: number
  llmCallCount: number
  totalCostUsd: number
  avgCallsPerConversation: number
  avgCostPerConversation: number
  avgDurationMinutes: number | null
}

function parseArgs(): { days: number; json: boolean } {
  let days = 30
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

async function getSkeletonConversationIds(days: number): Promise<string[]> {
  const rows = await db.queryMany<{ conversation_id: string }>(
    `SELECT DISTINCT conversation_id::text as conversation_id
     FROM skill_telemetry
     WHERE created_at >= NOW() - ($1 || ' days')::interval
       AND skill_name = 'cms_skeleton'
       AND event_type = 'cms_skeleton_injected'
       AND conversation_id IS NOT NULL`,
    [String(days)]
  )
  return rows.map(r => r.conversation_id)
}

async function getCohortStats(days: number, conversationIds: string[] | null): Promise<CohortStats> {
  // conversationIds = null  → 「非 skeleton 組」（排除已知 skeleton ids，且該 conversation 不在 skeleton 集合）
  // conversationIds = [...] → 「skeleton 組」（限這些 ids）
  const isSkeleton = Array.isArray(conversationIds)

  const llmStats = isSkeleton
    ? await db.queryOne<{
        conv_count: number
        call_count: number
        total_cost: string
      }>(
        `SELECT
           COUNT(DISTINCT conversation_id)::int AS conv_count,
           COUNT(*)::int AS call_count,
           COALESCE(SUM(cost_usd), 0)::text AS total_cost
         FROM llm_usage
         WHERE created_at >= NOW() - ($1 || ' days')::interval
           AND conversation_id = ANY($2::uuid[])`,
        [String(days), conversationIds!]
      )
    : await db.queryOne<{
        conv_count: number
        call_count: number
        total_cost: string
      }>(
        `SELECT
           COUNT(DISTINCT lu.conversation_id)::int AS conv_count,
           COUNT(*)::int AS call_count,
           COALESCE(SUM(lu.cost_usd), 0)::text AS total_cost
         FROM llm_usage lu
         WHERE lu.created_at >= NOW() - ($1 || ' days')::interval
           AND lu.conversation_id IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM skill_telemetry st
             WHERE st.conversation_id = lu.conversation_id
               AND st.skill_name = 'cms_skeleton'
               AND st.event_type = 'cms_skeleton_injected'
           )`,
        [String(days)]
      )

  const durationStats = isSkeleton
    ? await db.queryOne<{ avg_duration_min: string | null }>(
        `SELECT ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60)::numeric, 1)::text AS avg_duration_min
         FROM conversations
         WHERE id = ANY($1::uuid[])
           AND created_at >= NOW() - ($2 || ' days')::interval`,
        [conversationIds!, String(days)]
      )
    : await db.queryOne<{ avg_duration_min: string | null }>(
        `SELECT ROUND(AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at)) / 60)::numeric, 1)::text AS avg_duration_min
         FROM conversations c
         WHERE c.created_at >= NOW() - ($1 || ' days')::interval
           AND NOT EXISTS (
             SELECT 1 FROM skill_telemetry st
             WHERE st.conversation_id = c.id
               AND st.skill_name = 'cms_skeleton'
               AND st.event_type = 'cms_skeleton_injected'
           )`,
        [String(days)]
      )

  const convCount = llmStats?.conv_count ?? 0
  const callCount = llmStats?.call_count ?? 0
  const totalCost = parseFloat(llmStats?.total_cost ?? '0')
  const avgDurationStr = durationStats?.avg_duration_min ?? null

  return {
    conversationCount: convCount,
    llmCallCount: callCount,
    totalCostUsd: totalCost,
    avgCallsPerConversation: convCount > 0 ? callCount / convCount : 0,
    avgCostPerConversation: convCount > 0 ? totalCost / convCount : 0,
    avgDurationMinutes: avgDurationStr === null ? null : parseFloat(avgDurationStr),
  }
}

function formatNumber(n: number, decimals = 2): string {
  return n.toFixed(decimals)
}

function formatDelta(skeleton: number, baseline: number): string {
  if (baseline === 0) return 'N/A'
  const delta = ((skeleton - baseline) / baseline) * 100
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${delta.toFixed(1)}%`
}

function renderMarkdown(days: number, skeleton: CohortStats, baseline: CohortStats): string {
  const date = new Date().toISOString().slice(0, 10)

  return `# CMS Skeleton Baseline Report — ${date}

- Window: **${days} days**
- Skeleton cohort: **${skeleton.conversationCount}** conversations
- Baseline (non-CMS) cohort: **${baseline.conversationCount}** conversations
- ${skeleton.conversationCount < 3 ? '⚠ Skeleton 樣本 < 3，下列數字僅供參考' : '✓ 樣本足夠'}

---

## 指標對比

| 指標 | Skeleton 組 | Baseline (非 CMS) | Δ (vs Baseline) |
|---|---|---|---|
| Conversations | ${skeleton.conversationCount} | ${baseline.conversationCount} | — |
| Total LLM calls | ${skeleton.llmCallCount} | ${baseline.llmCallCount} | — |
| Total cost (USD) | $${formatNumber(skeleton.totalCostUsd)} | $${formatNumber(baseline.totalCostUsd)} | — |
| **Avg LLM calls / conversation** | **${formatNumber(skeleton.avgCallsPerConversation, 1)}** | ${formatNumber(baseline.avgCallsPerConversation, 1)} | ${formatDelta(skeleton.avgCallsPerConversation, baseline.avgCallsPerConversation)} |
| **Avg cost / conversation** | **$${formatNumber(skeleton.avgCostPerConversation, 3)}** | $${formatNumber(baseline.avgCostPerConversation, 3)} | ${formatDelta(skeleton.avgCostPerConversation, baseline.avgCostPerConversation)} |
| Avg duration (min) | ${skeleton.avgDurationMinutes !== null ? formatNumber(skeleton.avgDurationMinutes, 1) : 'N/A'} | ${baseline.avgDurationMinutes !== null ? formatNumber(baseline.avgDurationMinutes, 1) : 'N/A'} | ${skeleton.avgDurationMinutes !== null && baseline.avgDurationMinutes !== null ? formatDelta(skeleton.avgDurationMinutes, baseline.avgDurationMinutes) : 'N/A'} |

---

## 解讀指引

- **Δ 越負越好** — skeleton 組應該 LLM call/cost/duration 都比 baseline 低
- 預期效果（plan 75-splendid-token.md）：avg calls -30~50%、avg cost -50~70%、duration -50~75%
- **如果 Δ 為正或趨近 0** —— skeleton 沒省到 token，要檢查：
  - 是否 BDD 階段 fix loop 反覆觸發（看 \`fix_convergence_failed\` 在週報 Top Patterns 中的計數）
  - 是否 Coder 重試多輪（看 \`coderTestAttempts\` 在 FlowState 中的分佈）
  - 是否 partial regen 寫的檔被後續 LLM step 覆寫
- **Baseline 樣本注意**：本報告 baseline 是「同期非 CMS shape」conversations。電商/Landing/SaaS 流量結構跟 CMS 不同，純比平均有偏差，理想的真實對比是「同一個 CMS prompt 跑兩次：一次套 skeleton 一次關掉」

---

_Generated by \`cms-skeleton-baseline-report.ts\`. Window ${days} days._
`
}

async function main() {
  const { days, json } = parseArgs()

  try {
    const skeletonIds = await getSkeletonConversationIds(days)

    const [skeleton, baseline] = await Promise.all([
      getCohortStats(days, skeletonIds),
      getCohortStats(days, null),
    ])

    if (json) {
      process.stdout.write(JSON.stringify({ windowDays: days, skeleton, baseline }, null, 2) + '\n')
    } else {
      process.stdout.write(renderMarkdown(days, skeleton, baseline))
    }
  } catch (err) {
    console.error('Baseline 報告生成失敗：', err)
    process.exit(1)
  } finally {
    await closePool().catch(() => {})
  }
}

main()
