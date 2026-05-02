/**
 * Design System Sync (Phase G)
 *
 * 修補設計缺口：用戶 tier='design-system-token' 或 'mixed' 迭代「主色改紅」後，
 * refineCode 改了 .tsx + globals.css 代碼，但 state.uiuxDesignSystem 物件**沒同步更新**。
 * 導致：
 *   - design-token-compliance 用舊 DS 色族驗證新代碼 → 誤觸發
 *   - DS snapshot 寫進 DB 是過期狀態 → rollback 不一致
 *   - design-system-freeze hash 不更新
 *
 * 雙軌同步策略：
 *   B（主要）— LLM 結構化 patch：refineCode 後額外呼叫 Sonnet callStructured，
 *               讓 LLM 報告 DesignSystem 哪些欄位變了，merge 回 state
 *   A（補強）— 代碼反向驗證：掃改後代碼用 regex + tailwind-color-resolver 抽實際色號，
 *               不一致時用代碼覆寫 LLM patch（代碼是真理）
 *
 * fail-soft：任何步驟失敗（LLM 超時 / patch schema 錯誤 / 解析失敗）→ 返回 null，
 * 呼叫端保留舊 state.uiuxDesignSystem（baseline 行為，等同 SYNC_DESIGN_SYSTEM_AFTER_ITERATION=false）
 */

import { z } from 'zod'
import type { DesignSystem, GeneratedComponent } from './uiux-generation'
import { callStructured } from '../lib/structured-output'
import { MODEL, buildCacheableSystem } from '../lib/anthropic'
import { computeDesignSystemHash } from './design-system-freeze'
import { extractColorTokens } from './design-token-compliance'
import { resolveColor } from './tailwind-color-resolver'
import { createLogger } from '../lib/logger'
import { recordTelemetry } from './skill-telemetry'
import type { TelemetryTrackingContext } from './skill-telemetry'

const logger = createLogger('design-system-sync')

// ============================================================
// LLM patch schema（Phase B 方案）
// ============================================================

/**
 * LLM 報告的 DesignSystem 變更：只列**真的改了的欄位**，沒改的欄位 omit。
 *
 * 設計選擇：不要求 LLM 輸出完整 DesignSystem（避免 hallucinate 重新生成所有欄位 +
 * 4K+ token 浪費），只取增量 patch。
 */
const DesignSystemPatchSchema = z.object({
  colorPalette: z.object({
    primary: z.string().optional().describe('hex 色號，如 #ef4444'),
    secondary: z.string().optional(),
    accent: z.string().optional(),
    background: z.string().optional(),
    foreground: z.string().optional(),
    muted: z.string().optional(),
    border: z.string().optional(),
  }).optional().describe('只列代碼真的改了的色，沒改的省略'),
  typography: z.object({
    fontFamily: z.string().optional().describe('如 Inter, system-ui'),
  }).optional(),
  cssVariables: z.string().optional().describe('如果 globals.css 的 :root 變數改了，貼新版 cssVariables 字串；沒改省略'),
  changeNotes: z.string().describe('一句話描述本次 DS 改了什麼，例如「主色從紫改紅，foreground 不變」；沒改任何 DS 欄位輸出 "no-design-system-change"'),
})

export type DesignSystemPatch = z.infer<typeof DesignSystemPatchSchema>

// ============================================================
// 公開 API
// ============================================================

export interface SyncDesignSystemArgs {
  baseDesignSystem: DesignSystem
  /** refineCode 改後代碼（pages + components + styles） */
  modifiedCode: {
    pages: GeneratedComponent[]
    components: GeneratedComponent[]
    styles: string
  }
  /** iteration tier — design-system-token / mixed 才會呼叫此函數，code-override 不會 */
  tier: 'design-system-token' | 'code-override' | 'mixed'
  trackingContext?: TelemetryTrackingContext
}

export interface SyncResult {
  /** merge 後的新 DesignSystem，如果 LLM 確認沒改 DS 則回原 base */
  designSystem: DesignSystem
  /** 新 hash（永遠重算，即使 DS 沒變） */
  hash: string
  /** LLM 是否報告有實質 DS 變更 */
  hasChanges: boolean
  /** A 方案救援次數（LLM 漏報 → 代碼掃描補上的色號數） */
  driftCount: number
}

/**
 * tier='design-system-token' 或 'mixed' 迭代後呼叫此函數同步 state.uiuxDesignSystem。
 * 失敗（LLM error / parse fail）→ 返回 null，呼叫端保留舊 DS。
 */
export async function syncDesignSystemAfterIteration(
  args: SyncDesignSystemArgs,
): Promise<SyncResult | null> {
  const { baseDesignSystem, modifiedCode, tier, trackingContext } = args

  // B 方案：LLM 結構化 patch
  const patchResult = await fetchPatchFromLlm(baseDesignSystem, modifiedCode, tier, trackingContext)
  if (!patchResult) return null  // LLM 失敗，呼叫端保留舊 DS

  const patch = patchResult
  let merged = mergePatch(baseDesignSystem, patch)
  let hasChanges = patch.changeNotes !== 'no-design-system-change' && patch.changeNotes.length > 0

  // A 方案：代碼反向驗證 — 掃實際色號 vs LLM patch 是否一致
  const driftCount = verifyAndPatchFromCode(merged, modifiedCode)
  if (driftCount > 0) {
    hasChanges = true
    logger.warn({ driftCount, llmReported: patch.changeNotes }, 'Phase G LLM patch drift — A 方案救援')
    recordTelemetry({
      skillName: 'iteration',
      eventType: 'iteration',
      patternKey: `phase_g_patch_drift:${driftCount}`,
      payload: { driftCount, llmReported: patch.changeNotes, source: 'phase_g_sync' },
      userId: trackingContext?.userId || null,
      conversationId: trackingContext?.conversationId || null,
    }).catch(() => {})
  }

  return {
    designSystem: merged,
    hash: computeDesignSystemHash(merged),
    hasChanges,
    driftCount,
  }
}

// ============================================================
// B 方案實作 — LLM callStructured
// ============================================================

async function fetchPatchFromLlm(
  base: DesignSystem,
  code: SyncDesignSystemArgs['modifiedCode'],
  tier: 'design-system-token' | 'code-override' | 'mixed',
  trackingContext?: TelemetryTrackingContext,
): Promise<DesignSystemPatch | null> {
  // 限制給 LLM 看的代碼量：取前 5 個 page + 5 個 component + 完整 styles（最多 ~15K 字符）
  const codeSnippet = [
    ...code.pages.slice(0, 5).map(p => `\`\`\`tsx:${p.path}\n${p.content.slice(0, 2000)}\n\`\`\``),
    ...code.components.slice(0, 5).map(c => `\`\`\`tsx:${c.path}\n${c.content.slice(0, 1500)}\n\`\`\``),
    code.styles ? `\`\`\`css:globals.css\n${code.styles.slice(0, 3000)}\n\`\`\`` : '',
  ].filter(Boolean).join('\n\n')

  const staticSystem = `你是一位設計系統審計員。用戶剛迭代修改了一個網站，你要從修改後的代碼**反推**新的 DesignSystem 欄位。

## 規則
1. **只列真的變了的欄位**，沒變的欄位省略（不要重複輸出 base 值）
2. 色號用 hex（#xxxxxx），不要用 Tailwind class 名
3. 從 globals.css :root { } 直接讀 CSS variables 變更
4. className 中的 hover:/focus: 不算主色變化
5. 如果代碼裡完全沒看到 DesignSystem 變更（只改了文案、佈局、動畫等）→ changeNotes 輸出「no-design-system-change」

## 為什麼要做這個審計
用戶下指令時 tier=${tier}，意圖層面屬於設計系統層或混合修改。系統需要從代碼反推新 DS 物件，
讓 design-token-compliance 用新 DS 驗證新代碼，避免誤觸發違反 critical。`

  const dynamicSystem = `## 原 DesignSystem（base）
\`\`\`json
${JSON.stringify({
  colorPalette: base.colorPalette,
  typography: base.typography,
  cssVariables: base.cssVariables.slice(0, 500),  // 截斷，避免 prompt 太長
}, null, 2)}
\`\`\``

  const userMessage = `## 修改後的代碼
${codeSnippet}

請輸出 DesignSystemPatch（只列變更的欄位）。`

  const result = await callStructured({
    schema: DesignSystemPatchSchema,
    model: MODEL.SONNET,
    system: buildCacheableSystem(staticSystem, dynamicSystem),
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 1500,
    temperature: 0.1,
    purpose: 'phase_g_design_system_sync',
    trackingContext: {
      userId: trackingContext?.userId ?? undefined,
      conversationId: trackingContext?.conversationId ?? undefined,
    },
  })

  if (!result.success) {
    logger.warn({ error: result.error }, 'Phase G LLM patch 失敗（fail-soft）')
    return null
  }
  return result.data
}

// ============================================================
// patch merge — 把 LLM 輸出 patch 合併進 base
// ============================================================

export function mergePatch(base: DesignSystem, patch: DesignSystemPatch): DesignSystem {
  const merged: DesignSystem = {
    ...base,
    colorPalette: { ...base.colorPalette },
    typography: { ...base.typography },
  }

  if (patch.colorPalette) {
    for (const [key, value] of Object.entries(patch.colorPalette)) {
      if (value && /^#[0-9a-f]{3,8}$/i.test(value)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(merged.colorPalette as any)[key] = value
      }
    }
  }

  if (patch.typography?.fontFamily) {
    merged.typography = { ...merged.typography, fontFamily: patch.typography.fontFamily }
  }

  if (patch.cssVariables && patch.cssVariables.includes(':root')) {
    merged.cssVariables = patch.cssVariables
  }

  return merged
}

// ============================================================
// A 方案實作 — 代碼反向驗證
// ============================================================

/**
 * 掃 modifiedCode 的 className 抽實際使用色號 → 跟 merged DS 比對。
 * 不一致時直接覆寫 merged.colorPalette（代碼是真理），返回 drift 數量。
 *
 * 簡化邏輯：只看 className 裡明顯的 primary/foreground/background 候選色族
 * - bg-* 出現最多次的非 white/black 色族 → primary
 * - text-* 出現最多次的深色族 → foreground
 * - bg-white / bg-slate-50 等 → background
 */
function verifyAndPatchFromCode(
  merged: DesignSystem,
  code: SyncDesignSystemArgs['modifiedCode'],
): number {
  const allFiles = [
    ...code.pages.map(p => p.content),
    ...code.components.map(c => c.content),
  ]
  const tokenCounts = new Map<string, number>()
  for (const content of allFiles) {
    const tokens = extractColorTokens(content)
    for (const t of tokens) {
      // 只關心 bg-* 和 text-* 的 keys（key 是 'red-500' / 'foreground' 等）
      if (t.raw.startsWith('bg-') || t.raw.startsWith('text-')) {
        tokenCounts.set(t.key, (tokenCounts.get(t.key) || 0) + 1)
      }
    }
  }

  // 找出現最多次的 Tailwind 色族（排除 alias 與通用色）
  let topPrimary: { key: string; count: number; hex: string } | null = null
  for (const [key, count] of tokenCounts.entries()) {
    if (['white', 'black', 'transparent', 'current', 'inherit'].includes(key)) continue
    if (!key.match(/^[a-z]+-\d+$/)) continue  // 跳過自訂 alias
    const hex = resolveColor(`bg-${key}`)
    if (!hex) continue
    if (!topPrimary || count > topPrimary.count) {
      topPrimary = { key, count, hex }
    }
  }

  let drift = 0
  if (topPrimary && merged.colorPalette.primary !== topPrimary.hex) {
    // LLM 漏報主色變更 — 用代碼實際色覆寫
    logger.info({
      llmPrimary: merged.colorPalette.primary,
      codePrimary: topPrimary.hex,
      codeKey: topPrimary.key,
      occurrences: topPrimary.count,
    }, 'A 方案救援：覆寫 LLM 漏報的主色')
    merged.colorPalette.primary = topPrimary.hex
    drift++
  }

  return drift
}
