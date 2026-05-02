/**
 * DesignSystemSchema — DESIGN.md 對齊的設計系統結構，
 * awesome-design-md / Vision 分析 / 上傳圖片分析 三種來源共用同一份契約。
 *
 * 設計原則：
 *   - 大量 .optional()：不同來源結構深度不同，下游 prompt 必須容忍 partial。
 *   - 不做 strict mode：DESIGN.md 是人類維護的 markdown，未來可能新增段落，schema 寬鬆容錯。
 *   - 不嵌入 LLM 行為（哪些欄位要填、temperature 等）— 純資料契約。
 *   - 與 reference-analyzer 既有 colorPalette/typography 欄位「不重疊」：
 *     舊欄位保留 backward-compat（5 個下游消費點漸進遷移），
 *     新欄位放這裡，由 design-md-parser 與 callStructured Vision 路徑共同產出。
 */

import { z } from 'zod'

// ============================================================
// Sub-schemas
// ============================================================

export const DesignColorEntrySchema = z.object({
  name: z.string(),               // e.g. "Stripe Purple", "Deep Navy"
  value: z.string(),              // hex or rgba()
  role: z.string().optional(),    // e.g. "Primary brand color, CTA backgrounds"
})

export const DesignColorPaletteSchema = z.object({
  primary: z.array(DesignColorEntrySchema).optional(),
  brand: z.array(DesignColorEntrySchema).optional(),
  accent: z.array(DesignColorEntrySchema).optional(),
  neutral: z.array(DesignColorEntrySchema).optional(),
  surface: z.array(DesignColorEntrySchema).optional(),
  border: z.array(DesignColorEntrySchema).optional(),
  shadow: z.array(DesignColorEntrySchema).optional(),
  // unrecognized sections fall here so we don't lose data
  other: z.array(DesignColorEntrySchema).optional(),
})

export const DesignTypographyRowSchema = z.object({
  role: z.string(),               // "Display Hero", "Body", "Button"
  font: z.string().optional(),
  size: z.string().optional(),    // "56px (3.50rem)"
  weight: z.string().optional(),
  lineHeight: z.string().optional(),
  letterSpacing: z.string().optional(),
  features: z.string().optional(), // OpenType features e.g. "ss01"
  notes: z.string().optional(),
})

export const DesignTypographySchema = z.object({
  primaryFont: z.string().optional(),
  monoFont: z.string().optional(),
  fontFallbacks: z.array(z.string()).optional(),
  hierarchy: z.array(DesignTypographyRowSchema).optional(),
  principles: z.array(z.string()).optional(),
})

export const DesignComponentSpecSchema = z.object({
  name: z.string(),               // "Primary Purple"
  kind: z.string().optional(),    // "button", "card", "input"
  description: z.string().optional(),
  // Properties 用 Record 而非固定欄位 — 不同組件屬性差異大，
  // 例如 button 有 padding/radius/hover，card 有 border/shadow。
  properties: z.record(z.string(), z.string()).optional(),
})

export const DesignComponentsSchema = z.object({
  buttons: z.array(DesignComponentSpecSchema).optional(),
  cards: z.array(DesignComponentSpecSchema).optional(),
  inputs: z.array(DesignComponentSpecSchema).optional(),
  badges: z.array(DesignComponentSpecSchema).optional(),
  navigation: z.array(DesignComponentSpecSchema).optional(),
  other: z.array(DesignComponentSpecSchema).optional(),
})

export const DesignSpacingSchema = z.object({
  unit: z.string().optional(),    // "8px base"
  scale: z.array(z.string()).optional(), // ["8px", "16px", "24px", ...]
  borderRadius: z.array(z.string()).optional(),
})

export const DesignMotionSchema = z.object({
  philosophy: z.string().optional(),
  easings: z.array(z.string()).optional(),
  durations: z.array(z.string()).optional(),
})

export const DesignVisualThemeSchema = z.object({
  atmosphere: z.string().optional(),  // 一段描述網站整體氛圍的文字
  keyCharacteristics: z.array(z.string()).optional(),
})

// ============================================================
// Top-level
// ============================================================

export const DesignSystemSchema = z.object({
  metadata: z.object({
    source: z.enum(['vendored_designmd', 'vision', 'uploaded_image', 'merged']),
    brandKey: z.string().optional(),    // 'stripe', 'linear.app', ...
    url: z.string().optional(),
    generatedAt: z.number(),            // epoch ms
  }),
  visualTheme: DesignVisualThemeSchema.optional(),
  colorPalette: DesignColorPaletteSchema.optional(),
  typography: DesignTypographySchema.optional(),
  components: DesignComponentsSchema.optional(),
  spacing: DesignSpacingSchema.optional(),
  motion: DesignMotionSchema.optional(),
  // 保留原始 markdown 一份，下游需要 verbatim 注入時不必重新 render
  rawMarkdown: z.string().optional(),
})

// ============================================================
// Type exports (for non-Zod consumers)
// ============================================================

export type DesignColorEntry = z.infer<typeof DesignColorEntrySchema>
export type DesignColorPalette = z.infer<typeof DesignColorPaletteSchema>
export type DesignTypographyRow = z.infer<typeof DesignTypographyRowSchema>
export type DesignTypography = z.infer<typeof DesignTypographySchema>
export type DesignComponentSpec = z.infer<typeof DesignComponentSpecSchema>
export type DesignComponents = z.infer<typeof DesignComponentsSchema>
export type DesignSpacing = z.infer<typeof DesignSpacingSchema>
export type DesignMotion = z.infer<typeof DesignMotionSchema>
export type DesignVisualTheme = z.infer<typeof DesignVisualThemeSchema>
export type DesignSystem = z.infer<typeof DesignSystemSchema>
