/**
 * DesignSystem → DESIGN.md Markdown Renderer
 *
 * 把 uiux-generation 的 DesignSystem 物件渲染成 awesome-design-md 風格的 markdown 文件。
 * 用於 deployer 部署時把 DESIGN.md 寫進 project_files，給用戶下載 zip / git clone 後
 * 看見可審稿的設計系統交付文件。
 *
 * 為什麼用 awesome-design-md format（不是自創）：
 *   - awesome-design-md 是業界 70k stars 標準
 *   - 跨工具可攜（Claude Desktop / Cursor / Figma MCP / 其他 AI agent 都能讀）
 *   - 用戶把 Tellcraft 生成的網站搬出後，DESIGN.md 仍可被其他 AI 工具消費
 *
 * 對齊的 awesome-design-md sections（從 stripe DESIGN.md 看的標準）：
 *   1. Visual Theme & Atmosphere
 *   2. Color Palette & Roles
 *   3. Typography Rules
 *   4. Component Stylings（Tellcraft 的 DS 沒有此資訊，跳過）
 *   5. Layout Principles
 *   6. Depth & Elevation
 */

import type { DesignSystem } from './uiux-generation'
import { getMoodSummary } from './design-moods'

/**
 * 渲染主入口：DesignSystem → markdown 字符串
 * fail-soft：任何欄位缺失 skip 該段，不 throw
 */
export function renderTellcraftDesignSystemAsMarkdown(ds: DesignSystem): string {
  const sections: string[] = []

  // Header — 標明這是 Tellcraft 生成的設計系統文件
  sections.push(`# Design System

> 此文件由 Tellcraft 自動生成，描述本網站的完整設計系統規範。
> 格式對齊 [awesome-design-md](https://github.com/VoltAgent/awesome-design-md)，可被 Claude Desktop / Cursor / 其他 AI agent 直接消費。

`)

  // ## 1. Visual Theme
  sections.push(renderVisualTheme(ds))

  // ## 2. Colors
  sections.push(renderColors(ds))

  // ## 3. Typography
  sections.push(renderTypography(ds))

  // ## 4. Layout & Spacing
  sections.push(renderLayout(ds))

  // ## 5. Depth & Elevation
  if (ds.shadows || ds.depth) {
    sections.push(renderDepth(ds))
  }

  // ## 6. Gradients（如有）
  if (ds.gradients) {
    sections.push(renderGradients(ds))
  }

  // ## Appendix: CSS Variables（raw，方便 copy-paste）
  if (ds.cssVariables) {
    sections.push(renderCssVariablesAppendix(ds))
  }

  return sections.filter(Boolean).join('\n\n').trim() + '\n'
}

// ============================================================
// Section renderers
// ============================================================

function renderVisualTheme(ds: DesignSystem): string {
  const lines: string[] = ['## 1. Visual Theme & Atmosphere', '']

  const traits: string[] = []
  if (ds.mood) traits.push(`**情緒基調**：${getMoodSummary(ds.mood)}`)
  if (ds.animationPersonality) traits.push(`**動畫個性**：${ds.animationPersonality}（${describeAnimationPersonality(ds.animationPersonality)}）`)
  if (ds.layoutArchetype) traits.push(`**佈局原型**：${ds.layoutArchetype}（${describeLayoutArchetype(ds.layoutArchetype)}）`)
  if (ds.depth?.strategy) traits.push(`**深度策略**：${ds.depth.strategy}`)

  if (traits.length === 0) {
    lines.push('_本設計系統未指定特定視覺主題。_')
  } else {
    lines.push(...traits)
  }

  return lines.join('\n')
}

function renderColors(ds: DesignSystem): string {
  const cp = ds.colorPalette
  const lines: string[] = ['## 2. Color Palette & Roles', '']

  // Primary
  lines.push('### Primary')
  lines.push(`- **Primary** (\`${cp.primary}\`): 主色，用於 CTA / 主要按鈕 / 連結強調`)
  lines.push(`- **Secondary** (\`${cp.secondary}\`): 次要色，輔助 CTA / 次要強調`)
  lines.push(`- **Accent** (\`${cp.accent}\`): 強調色，用於 highlights / 特殊裝飾`)
  lines.push('')

  // Neutral
  lines.push('### Neutral & Surface')
  lines.push(`- **Background** (\`${cp.background}\`): 頁面底層背景`)
  lines.push(`- **Foreground** (\`${cp.foreground}\`): 主要文字色`)
  lines.push(`- **Muted** (\`${cp.muted}\`): 次要文字 / placeholder`)
  lines.push(`- **Border** (\`${cp.border}\`): 預設邊框色`)
  if (cp.surface1) lines.push(`- **Surface-1** (\`${cp.surface1}\`): 卡片底層`)
  if (cp.surface2) lines.push(`- **Surface-2** (\`${cp.surface2}\`): 卡片浮層`)
  if (cp.surface3) lines.push(`- **Surface-3** (\`${cp.surface3}\`): hover / active 狀態`)
  if (cp.ring) lines.push(`- **Ring** (\`${cp.ring}\`): focus ring`)
  lines.push('')

  // Semantic（如有）
  const semanticEntries: string[] = []
  if (cp.destructive) semanticEntries.push(`- **Destructive** (\`${cp.destructive}\`): 危險動作 / 刪除按鈕`)
  if (cp.success) semanticEntries.push(`- **Success** (\`${cp.success}\`): 成功狀態`)
  if (semanticEntries.length > 0) {
    lines.push('### Semantic')
    lines.push(...semanticEntries)
    lines.push('')
  }

  return lines.join('\n').trim()
}

function renderTypography(ds: DesignSystem): string {
  const t = ds.typography
  const lines: string[] = ['## 3. Typography Rules', '']

  lines.push('### Font Family')
  lines.push(`- **Primary** (\`${t.fontFamily}\`): 主要字體，用於 body 與 headings`)
  const display = ds.tailwindExtend.fontFamily?.display
  if (Array.isArray(display) && display.length > 0) {
    lines.push(`- **Display** (\`${display[0]}\`): 標題 / 大字（使用 \`font-display\` utility）`)
  }
  const mono = ds.tailwindExtend.fontFamily?.mono
  if (Array.isArray(mono) && mono.length > 0) {
    lines.push(`- **Monospace** (\`${mono[0]}\`): 程式碼 / 等寬內容`)
  }
  lines.push('')

  lines.push('### Scale')
  if (Object.keys(t.scale).length === 0) {
    lines.push('_使用 Tailwind 預設 text-xs / sm / base / lg / xl / 2xl / 3xl / 4xl / 5xl / 6xl_')
  } else {
    lines.push('| Token | Size |')
    lines.push('|-------|------|')
    for (const [token, size] of Object.entries(t.scale)) {
      lines.push(`| \`${token}\` | ${size} |`)
    }
  }

  return lines.join('\n')
}

function renderLayout(ds: DesignSystem): string {
  const lines: string[] = ['## 4. Layout & Spacing', '']

  // Spacing
  lines.push('### Spacing System')
  lines.push(`- **Base Unit**: ${ds.spacing.unit}px`)
  if (Object.keys(ds.spacing.scale).length > 0) {
    lines.push('')
    lines.push('| Token | Value |')
    lines.push('|-------|-------|')
    for (const [token, value] of Object.entries(ds.spacing.scale)) {
      lines.push(`| \`${token}\` | ${value} |`)
    }
  }
  lines.push('')

  // Border Radius
  lines.push('### Border Radius Scale')
  lines.push(`- **none**: ${ds.borderRadius.none}`)
  lines.push(`- **sm**: ${ds.borderRadius.sm}`)
  lines.push(`- **md**: ${ds.borderRadius.md}`)
  lines.push(`- **lg**: ${ds.borderRadius.lg}`)
  lines.push(`- **full**: ${ds.borderRadius.full} _(圓形 / pill)_`)

  return lines.join('\n')
}

function renderDepth(ds: DesignSystem): string {
  const lines: string[] = ['## 5. Depth & Elevation', '']

  if (ds.shadows) {
    lines.push(`### Shadow Strategy: \`${ds.shadows.strategy}\``)
    if (ds.shadows.strategy === 'borders-only') {
      lines.push('_本設計系統用 border 建立層次，**禁止使用 shadow-***。_')
    } else if (ds.shadows.strategy === 'subtle-shadows') {
      lines.push('_低調單層陰影，強調懸浮感。_')
    } else if (ds.shadows.strategy === 'layered-shadows') {
      lines.push('_多層次陰影，sm → lg 建立深度。_')
    }
    lines.push('')

    const v = ds.shadows.values
    const shadowLines: string[] = []
    if (v.sm) shadowLines.push(`- **shadow-sm**: \`${v.sm}\``)
    if (v.md) shadowLines.push(`- **shadow-md**: \`${v.md}\``)
    if (v.lg) shadowLines.push(`- **shadow-lg**: \`${v.lg}\``)
    if (v.glow) shadowLines.push(`- **glow**: \`${v.glow}\``)
    if (shadowLines.length > 0) {
      lines.push('### Shadow Values')
      lines.push(...shadowLines)
      lines.push('')
    }
  }

  if (ds.depth) {
    lines.push(`### Card Depth: \`${ds.depth.strategy}\``)
    lines.push('')
    lines.push('統一卡片樣式：')
    lines.push('```')
    lines.push(ds.depth.cardStyle)
    lines.push('```')
  }

  return lines.join('\n').trim()
}

function renderGradients(ds: DesignSystem): string {
  const g = ds.gradients!
  const lines: string[] = ['## 6. Gradients', '']
  if (g.primary) lines.push(`- **Primary**: \`${g.primary}\``)
  if (g.surface) lines.push(`- **Surface**: \`${g.surface}\``)
  if (g.accent) lines.push(`- **Accent**: \`${g.accent}\``)
  return lines.join('\n')
}

function renderCssVariablesAppendix(ds: DesignSystem): string {
  return `## Appendix: CSS Variables (raw)

\`\`\`css
${ds.cssVariables.trim()}
\`\`\``
}

// ============================================================
// Helpers
// ============================================================

function describeAnimationPersonality(p: NonNullable<DesignSystem['animationPersonality']>): string {
  const map: Record<string, string> = {
    minimal: '克制，僅必要過場動畫',
    smooth: '流暢，標準 ease-in-out',
    bouncy: '彈性，spring physics',
    dramatic: '戲劇化，大幅度位移與時間',
    playful: '活潑，多向量混合動畫',
  }
  return map[p] ?? p
}

function describeLayoutArchetype(a: NonNullable<DesignSystem['layoutArchetype']>): string {
  const map: Record<string, string> = {
    bento: '網格混搭多 tile 大小',
    editorial: '雜誌式單欄重排印',
    dashboard: '資訊密度優先 multi-column',
    storytelling: '長頁式 scroll-driven',
    'app-shell': '應用主體 + 側邊欄',
  }
  return map[a] ?? a
}
