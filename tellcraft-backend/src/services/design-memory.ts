/**
 * Design Memory — 跨 session 的使用者設計偏好記憶
 *
 * 動機：每個專案重做 Discovery 問答對老用戶不友善。此模組記錄用戶歷史
 * 挑選的色板/mood/字體/拒絕的 pattern，下次來自動參考。
 *
 * 設計原則：
 * 1. 寫入 fire-and-forget — 任何 DB 失敗都不阻塞生成 pipeline
 * 2. 讀取 fail-open — 錯誤回傳 null，呼叫端視為「無記憶 = 新用戶」
 * 3. 不存 PII — brand_tone 是設計語彙不是個人資料
 * 4. 樣本上限 — preferred_palettes 最多 5 筆（FIFO），TEXT[] 上限 20 元素去重
 */

import * as db from '../db/client'
import { createLogger } from '../lib/logger'
import type { DesignSystem } from './uiux-generation'

const logger = createLogger('design-memory')

const PALETTE_HISTORY_MAX = 5
const ARRAY_HISTORY_MAX = 20

// ============================================================
// 型別
// ============================================================

export interface BrandTone {
  keywords: string[]   // 用戶 brief 出現的核心語彙（professional / warm / minimal...）
  avoid: string[]      // 明確拒絕的詞（no purple / 不要可愛...）
}

export interface StoredPalette {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  capturedAt: number   // Unix ms
}

export interface DesignMemory {
  userId: string
  brandTone: BrandTone | null
  preferredPalettes: StoredPalette[]
  preferredMoods: string[]
  preferredTiers: string[]
  rejectedPatterns: string[]
  signatureKeywords: string[]
  fontsUsed: string[]
  sampleCount: number
  updatedAt: Date
}

interface DesignMemoryRow {
  user_id: string
  brand_tone: BrandTone | null
  preferred_palettes: StoredPalette[] | null
  preferred_moods: string[] | null
  preferred_tiers: string[] | null
  rejected_patterns: string[] | null
  signature_keywords: string[] | null
  fonts_used: string[] | null
  sample_count: number
  updated_at: Date
}

// ============================================================
// 讀取
// ============================================================

/** 讀取使用者的設計記憶。錯誤時回 null（fail-open）。 */
export async function getDesignMemory(userId: string): Promise<DesignMemory | null> {
  if (!userId) return null
  try {
    const row = await db.queryOne<DesignMemoryRow>(
      `SELECT user_id, brand_tone, preferred_palettes, preferred_moods, preferred_tiers,
              rejected_patterns, signature_keywords, fonts_used, sample_count, updated_at
         FROM design_memory WHERE user_id = $1`,
      [userId],
    )
    if (!row) return null
    return {
      userId: row.user_id,
      brandTone: row.brand_tone,
      preferredPalettes: row.preferred_palettes ?? [],
      preferredMoods: row.preferred_moods ?? [],
      preferredTiers: row.preferred_tiers ?? [],
      rejectedPatterns: row.rejected_patterns ?? [],
      signatureKeywords: row.signature_keywords ?? [],
      fontsUsed: row.fonts_used ?? [],
      sampleCount: row.sample_count,
      updatedAt: row.updated_at,
    }
  } catch (err) {
    logger.warn({ err: String(err).slice(0, 200), userId }, 'getDesignMemory 失敗（fail-open）')
    return null
  }
}

// ============================================================
// 寫入：UPSERT helper
// ============================================================

function dedupTail<T>(existing: T[], incoming: T[], max: number): T[] {
  const seen = new Set<string>()
  const merged: T[] = []
  // 新進來的優先（放在尾部代表「最近」）
  for (const item of [...existing, ...incoming]) {
    const key = typeof item === 'string' ? item : JSON.stringify(item)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(item)
  }
  return merged.slice(-max)
}

interface UpdateInput {
  userId: string
  brandTone?: Partial<BrandTone>
  palette?: StoredPalette        // 單筆插入到 history（FIFO max 5）
  moodId?: string
  tier?: string
  rejectedPatternId?: string
  signatureKeywords?: string[]
  fontFamily?: string
  incrementSample?: boolean
}

/**
 * 合併寫入。fire-and-forget：呼叫端應 .catch(() => {}) 不阻塞 pipeline。
 *
 * 策略：先讀現有 → memory-side merge → upsert。沒原子性但設計記憶
 * 不需要強一致性（最後寫入的 win 即可）。
 */
export async function updateDesignMemory(input: UpdateInput): Promise<void> {
  if (!input.userId) return

  const existing = await getDesignMemory(input.userId)

  // 合併 brand_tone（陣列 union）
  let brandTone: BrandTone | null = existing?.brandTone ?? null
  if (input.brandTone) {
    brandTone = {
      keywords: dedupTail(existing?.brandTone?.keywords ?? [], input.brandTone.keywords ?? [], ARRAY_HISTORY_MAX),
      avoid: dedupTail(existing?.brandTone?.avoid ?? [], input.brandTone.avoid ?? [], ARRAY_HISTORY_MAX),
    }
  }

  // 合併 palette history（FIFO，最多 5）
  let palettes = existing?.preferredPalettes ?? []
  if (input.palette) {
    palettes = dedupTail(palettes, [input.palette], PALETTE_HISTORY_MAX)
  }

  const moods = input.moodId
    ? dedupTail(existing?.preferredMoods ?? [], [input.moodId], ARRAY_HISTORY_MAX)
    : existing?.preferredMoods ?? []

  const tiers = input.tier
    ? dedupTail(existing?.preferredTiers ?? [], [input.tier], ARRAY_HISTORY_MAX)
    : existing?.preferredTiers ?? []

  const rejected = input.rejectedPatternId
    ? dedupTail(existing?.rejectedPatterns ?? [], [input.rejectedPatternId], ARRAY_HISTORY_MAX)
    : existing?.rejectedPatterns ?? []

  const sigKws = input.signatureKeywords?.length
    ? dedupTail(existing?.signatureKeywords ?? [], input.signatureKeywords, ARRAY_HISTORY_MAX)
    : existing?.signatureKeywords ?? []

  const fonts = input.fontFamily
    ? dedupTail(existing?.fontsUsed ?? [], [input.fontFamily], ARRAY_HISTORY_MAX)
    : existing?.fontsUsed ?? []

  const sampleCount = (existing?.sampleCount ?? 0) + (input.incrementSample ? 1 : 0)

  try {
    await db.query(
      `INSERT INTO design_memory
         (user_id, brand_tone, preferred_palettes, preferred_moods, preferred_tiers,
          rejected_patterns, signature_keywords, fonts_used, sample_count, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         brand_tone = EXCLUDED.brand_tone,
         preferred_palettes = EXCLUDED.preferred_palettes,
         preferred_moods = EXCLUDED.preferred_moods,
         preferred_tiers = EXCLUDED.preferred_tiers,
         rejected_patterns = EXCLUDED.rejected_patterns,
         signature_keywords = EXCLUDED.signature_keywords,
         fonts_used = EXCLUDED.fonts_used,
         sample_count = EXCLUDED.sample_count,
         updated_at = NOW()`,
      [
        input.userId,
        brandTone ? JSON.stringify(brandTone) : null,
        JSON.stringify(palettes),
        moods,
        tiers,
        rejected,
        sigKws,
        fonts,
        sampleCount,
      ],
    )
  } catch (err) {
    logger.warn({ err: String(err).slice(0, 200), userId: input.userId }, 'updateDesignMemory 失敗（fire-and-forget）')
  }
}

// ============================================================
// 萃取 helper（從 DesignSystem / brief 抽出要存的欄位）
// ============================================================

export function extractPaletteFromDesignSystem(ds: DesignSystem): StoredPalette {
  const cp = ds.colorPalette
  return {
    primary: cp.primary,
    secondary: cp.secondary,
    accent: cp.accent,
    background: cp.background,
    foreground: cp.foreground,
    capturedAt: Date.now(),
  }
}

/** 從 typography.fontFamily 抽出主字體名（"DM Sans, system-ui" → "DM Sans"）。 */
export function extractFontFamily(ds: DesignSystem): string | null {
  const ff = ds.typography?.fontFamily
  if (!ff) return null
  const first = ff.split(',')[0].trim().replace(/^["']|["']$/g, '')
  return first || null
}

// ============================================================
// Prompt 注入：把記憶格式化為「用戶歷史偏好」block
// ============================================================

/**
 * 格式化為 Brief 階段注入的 prompt 段落。
 * 沒有記憶或樣本不足（< 1）→ 回空字串（不污染 prompt cache）。
 */
export function formatMemoryForBriefPrompt(memory: DesignMemory | null): string {
  if (!memory || memory.sampleCount < 1) return ''

  const lines: string[] = []
  if (memory.brandTone?.keywords.length) {
    lines.push(`- 過往語彙：${memory.brandTone.keywords.slice(-5).join('、')}`)
  }
  if (memory.brandTone?.avoid.length) {
    lines.push(`- 明確避免：${memory.brandTone.avoid.slice(-5).join('、')}`)
  }
  if (memory.preferredPalettes.length) {
    const recent = memory.preferredPalettes.slice(-3).map(p => p.primary).join('、')
    lines.push(`- 過往主色：${recent}`)
  }
  if (memory.preferredMoods.length) {
    lines.push(`- 過往 mood：${memory.preferredMoods.slice(-3).join('、')}`)
  }
  if (memory.fontsUsed.length) {
    lines.push(`- 過往字體：${memory.fontsUsed.slice(-3).join('、')}`)
  }
  if (memory.signatureKeywords.length) {
    lines.push(`- 領域關鍵詞：${memory.signatureKeywords.slice(-5).join('、')}`)
  }
  if (memory.rejectedPatterns.length) {
    lines.push(`- 已拒絕的 pattern（請避免）：${memory.rejectedPatterns.slice(-5).join('、')}`)
  }

  if (lines.length === 0) return ''

  return `## 用戶歷史偏好（已完成 ${memory.sampleCount} 個專案 — 參考但不照搬）
${lines.join('\n')}

策略：當這次需求與過往一致時，優先沿用上述偏好（讓老用戶感受到延續性）；
當這次需求明顯不同時（例如過去做 portfolio 這次做 dashboard），以本次需求為主，
不要硬塞舊色板。`
}

/**
 * 格式化為 Variant 生成階段注入的 prompt 段落。
 * 與 brief 版本不同：強調「至少 1 個變體繼承家族色」。
 */
export function formatMemoryForVariantPrompt(memory: DesignMemory | null): string {
  if (!memory || memory.preferredPalettes.length === 0) return ''

  const recent = memory.preferredPalettes[memory.preferredPalettes.length - 1]
  return `## 用戶家族色板提示（過往專案沿用）
- 主色：${recent.primary}
- 副色：${recent.secondary}
- 強調：${recent.accent}

至少 1 個變體（建議 Variant A 或 E）的 colorPalette.primary 應接近此主色（HSL hue 差 < 30），
讓老用戶有「品牌延續感」。其他 4 個變體可自由探索差異化。`
}
