/**
 * 組合模式庫（Composition Patterns）
 * Section-level 的佈局組合指令，告訴 LLM「hero 怎麼排」「content section 怎麼組合」
 *
 * 層級關係：
 * - design-moods.ts：atmosphere-level（整體色調/陰影/字體風格）
 * - composition-patterns.ts：section-level（hero/content/data/shell 怎麼組合）
 * - design-techniques.ts：element-level（怎麼 style 一張卡片/一個標題）
 *
 * 根據 page-type + tier + productType + mood 選 2-3 個注入 generateStructure
 */

import type { DesignTier } from './uiux-generation'

// ============================================================
// Types
// ============================================================

export type PatternCategory = 'hero' | 'content' | 'data' | 'shell'

export interface CompositionPattern {
  id: string
  name: string
  category: PatternCategory
  tier: 'both' | 'creative' | 'functional'
  description: string              // LLM 能理解的視覺描述（1-2 句）
  applicableScenes: string[]       // 適用場景（landing/dashboard/portfolio...）
  tailwindHint: string             // Tailwind 實作提示（2-4 行，可直接用）
  moodAffinity?: string[]          // 與哪些 mood 搭配好（加分）
  incompatibleWith?: string[]      // 互斥 pattern ID
}

// ============================================================
// 20 個 Composition Patterns
// ============================================================

// --- Hero 類（4 個）---

const HERO_PATTERNS: CompositionPattern[] = [
  {
    id: 'split-hero',
    name: 'Split Hero',
    category: 'hero',
    tier: 'both',
    description: '左右分割 60/40，一側文字一側視覺元素（圖片/插圖/3D）',
    applicableScenes: ['landing', 'portfolio', 'agency', 'saas', 'corporate'],
    tailwindHint: `grid grid-cols-[3fr_2fr] min-h-[80vh] items-center gap-12
左側：max-w-xl space-y-6（標題 + 副標 + CTA group）
右側：relative overflow-hidden rounded-2xl（視覺容器）`,
    moodAffinity: ['organic-warm', 'neo-corporate'],
    incompatibleWith: ['fullbleed-hero', 'animated-text-hero', 'minimal-hero'],
  },
  {
    id: 'fullbleed-hero',
    name: 'Fullbleed Hero',
    category: 'hero',
    tier: 'creative',
    description: '全屏背景媒體 + 居中疊加文字，min-h-screen 沉浸式開場',
    applicableScenes: ['landing', 'event', 'restaurant', 'travel', 'creative'],
    tailwindHint: `relative min-h-screen flex items-center justify-center overflow-hidden
背景層：absolute inset-0 bg-cover bg-center + after:absolute after:inset-0 after:bg-black/40
內容層：relative z-10 text-center text-white max-w-3xl space-y-8`,
    moodAffinity: ['glassmorphic-dark', 'playful-pop'],
    incompatibleWith: ['split-hero', 'animated-text-hero', 'minimal-hero'],
  },
  {
    id: 'animated-text-hero',
    name: 'Animated Text Hero',
    category: 'hero',
    tier: 'creative',
    description: '超大字體為核心視覺，文字本身是 hero 的焦點，不依賴圖片',
    applicableScenes: ['portfolio', 'agency', 'creative', 'event', 'music'],
    tailwindHint: `min-h-screen flex flex-col justify-center px-8 md:px-20
主標題：text-[clamp(3rem,8vw,8rem)] font-bold leading-[0.9] tracking-tighter
副資訊：mt-12 flex gap-8 text-lg text-muted-foreground`,
    moodAffinity: ['brutalist'],
    incompatibleWith: ['split-hero', 'fullbleed-hero', 'minimal-hero'],
  },
  {
    id: 'minimal-hero',
    name: 'Minimal Hero',
    category: 'hero',
    tier: 'both',
    description: '極簡文字 hero，大量留白，小副標 + 單一 CTA，克制優雅',
    applicableScenes: ['saas', 'blog', 'tool', 'corporate', 'finance'],
    tailwindHint: `py-32 md:py-48 text-center max-w-2xl mx-auto space-y-6
標題：text-4xl md:text-5xl font-semibold tracking-tight
副標：text-lg text-muted-foreground max-w-md mx-auto
CTA：mt-8 inline-flex（單一按鈕，不要按鈕群組）`,
    moodAffinity: ['editorial-clean', 'luxury-minimal'],
    incompatibleWith: ['split-hero', 'fullbleed-hero', 'animated-text-hero'],
  },
]

// --- Content 類（7 個）---

const CONTENT_PATTERNS: CompositionPattern[] = [
  {
    id: 'bento-content',
    name: 'Bento Content',
    category: 'content',
    tier: 'both',
    description: '不等大小的內容方格拼貼，大小卡片混搭突出層級',
    applicableScenes: ['landing', 'portfolio', 'dashboard', 'saas'],
    tailwindHint: `grid grid-cols-4 gap-4 auto-rows-[180px]
大卡片：col-span-2 row-span-2（feature 區）
中卡片：col-span-2 row-span-1
小卡片：col-span-1 row-span-1`,
    moodAffinity: ['playful-pop'],
  },
  {
    id: 'feature-alternation',
    name: 'Feature Alternation',
    category: 'content',
    tier: 'both',
    description: '圖文左右交替排列（zigzag），每個 feature 獨佔一個視口段落',
    applicableScenes: ['landing', 'saas', 'product', 'corporate'],
    tailwindHint: `space-y-24 md:space-y-32
每段：grid grid-cols-2 gap-16 items-center
奇數段：文字在左、視覺在右
偶數段：order-last 讓視覺在左、文字在右`,
    moodAffinity: ['organic-warm'],
  },
  {
    id: 'sticky-storytelling',
    name: 'Sticky Storytelling',
    category: 'content',
    tier: 'creative',
    description: '左欄 sticky 圖片/視覺 + 右欄長內容隨滾動切換，敘事感強',
    applicableScenes: ['landing', 'portfolio', 'case-study', 'creative'],
    tailwindHint: `grid grid-cols-[1fr_1fr] gap-16
左欄：sticky top-24 self-start h-[calc(100vh-6rem)]（固定視覺）
右欄：space-y-[50vh]（每個內容塊用大間距觸發切換感）`,
    moodAffinity: ['editorial-clean', 'luxury-minimal'],
    incompatibleWith: ['horizontal-scroll'],
  },
  {
    id: 'horizontal-scroll',
    name: 'Horizontal Scroll',
    category: 'content',
    tier: 'creative',
    description: '橫向滾動展示卡片/案例，打破垂直滾動的預期',
    applicableScenes: ['portfolio', 'gallery', 'event', 'creative'],
    tailwindHint: `overflow-x-auto snap-x snap-mandatory flex gap-6 px-8 -mx-8
每張卡片：snap-center flex-shrink-0 w-[80vw] md:w-[45vw]
隱藏滾動條：scrollbar-hide（或 [&::-webkit-scrollbar]:hidden）`,
    moodAffinity: ['playful-pop'],
    incompatibleWith: ['sticky-storytelling'],
  },
  {
    id: 'timeline-flow',
    name: 'Timeline Flow',
    category: 'content',
    tier: 'both',
    description: '垂直時間軸串連內容塊，左右交錯排列，適合流程/歷程展示',
    applicableScenes: ['landing', 'event', 'blog', 'corporate'],
    tailwindHint: `relative before:absolute before:left-1/2 before:top-0 before:h-full before:w-px before:bg-border
每個節點：grid grid-cols-2 gap-8
奇數：justify-items-end pr-12（右邊留出軸線空間）
偶數：col-start-2 pl-12
圓點：absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary`,
  },
  {
    id: 'masonry-grid',
    name: 'Masonry Grid',
    category: 'content',
    tier: 'creative',
    description: '瀑布流不等高卡片排列，Pinterest/Dribbble 風格的視覺展示',
    applicableScenes: ['portfolio', 'gallery', 'blog', 'creative'],
    tailwindHint: `columns-2 md:columns-3 gap-4 space-y-4
每張卡片：break-inside-avoid rounded-xl overflow-hidden
高度自然：不設固定高度，內容決定卡片高度`,
    moodAffinity: ['brutalist'],
  },
  {
    id: 'magazine-layout',
    name: 'Magazine Layout',
    category: 'content',
    tier: 'creative',
    description: '雜誌混排：大圖 feature + 小卡片群 + 引言 pullquote 穿插',
    applicableScenes: ['blog', 'portfolio', 'creative', 'event'],
    tailwindHint: `grid grid-cols-6 gap-6
Feature：col-span-4 row-span-2（大圖 + 標題覆蓋）
Side：col-span-2 space-y-6（2-3 個小卡片堆疊）
Pullquote：col-span-full py-12 text-center text-2xl italic border-y`,
    moodAffinity: ['editorial-clean', 'brutalist'],
  },
]

// --- Data Display 類（5 個）---

const DATA_PATTERNS: CompositionPattern[] = [
  {
    id: 'dashboard-bento',
    name: 'Dashboard Bento',
    category: 'data',
    tier: 'functional',
    description: 'Hero metric 大區 + 小 stat 卡片行 + 圖表/表格區，數據一覽式',
    applicableScenes: ['dashboard', 'saas', 'analytics', 'finance'],
    tailwindHint: `space-y-6
Top：grid grid-cols-4 gap-4（4 個 stat 卡片）
Mid：grid grid-cols-[2fr_1fr] gap-6（主圖表 + 側邊清單）
Bottom：圖表/表格全寬`,
    moodAffinity: ['glassmorphic-dark', 'neo-corporate'],
  },
  {
    id: 'command-palette-nav',
    name: 'Command Palette Nav',
    category: 'data',
    tier: 'functional',
    description: '頂部搜尋/命令列為核心導航，Linear/Raycast 風格的效率優先',
    applicableScenes: ['dashboard', 'saas', 'tool', 'developer'],
    tailwindHint: `Cmd+K 觸發：fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[20vh]
搜尋框：w-full max-w-lg bg-popover rounded-xl shadow-2xl border
結果列表：max-h-[300px] overflow-y-auto divide-y
每行：px-4 py-3 flex items-center gap-3 hover:bg-accent cursor-pointer`,
    moodAffinity: ['tech-dark'],
  },
  {
    id: 'split-detail',
    name: 'Split Detail',
    category: 'data',
    tier: 'functional',
    description: '左側窄列表 + 右側寬詳情面板，Gmail/Linear 風格的主從佈局',
    applicableScenes: ['dashboard', 'crm', 'email', 'tool'],
    tailwindHint: `grid grid-cols-[320px_1fr] h-[calc(100vh-4rem)]
左側：border-r overflow-y-auto（項目列表，選中態 bg-accent）
右側：overflow-y-auto p-8（詳情內容，隨左側選擇切換）`,
    moodAffinity: ['neo-corporate', 'tech-dark'],
  },
  {
    id: 'kanban-board',
    name: 'Kanban Board',
    category: 'data',
    tier: 'functional',
    description: '多欄看板，每欄垂直滾動，Trello/Notion Board 風格',
    applicableScenes: ['dashboard', 'project', 'tool'],
    tailwindHint: `flex gap-4 overflow-x-auto h-[calc(100vh-8rem)] px-4
每欄：flex-shrink-0 w-72 bg-muted/30 rounded-xl p-3
欄標題：font-semibold text-sm mb-3 flex items-center justify-between
卡片列：space-y-2 overflow-y-auto flex-1`,
  },
  {
    id: 'data-dense-table',
    name: 'Data Dense Table',
    category: 'data',
    tier: 'functional',
    description: '增強表格：行內 sparkline、status badge、hover detail row',
    applicableScenes: ['dashboard', 'analytics', 'admin', 'finance'],
    tailwindHint: `w-full border rounded-lg overflow-hidden
Header：bg-muted/50 text-xs font-medium uppercase tracking-wider
Row：border-b hover:bg-muted/30 transition-colors
Cell 增強：inline-flex items-center gap-2（badge + text 或 sparkline + number）
Status badge：px-2 py-0.5 rounded-full text-xs font-medium`,
    moodAffinity: ['tech-dark'],
  },
]

// --- Shell 類（4 個）---

const SHELL_PATTERNS: CompositionPattern[] = [
  {
    id: 'floating-nav',
    name: 'Floating Nav',
    category: 'shell',
    tier: 'creative',
    description: '浮動 glass 導航列，不貼頂部邊緣，有圓角和背景模糊',
    applicableScenes: ['landing', 'portfolio', 'creative', 'agency'],
    tailwindHint: `fixed top-4 left-1/2 -translate-x-1/2 z-50
nav：bg-background/80 backdrop-blur-xl rounded-full px-6 py-2 border shadow-lg
內部：flex items-center gap-6（logo + links + CTA）`,
    moodAffinity: ['glassmorphic-dark'],
    incompatibleWith: ['sidebar-canvas'],
  },
  {
    id: 'sidebar-canvas',
    name: 'Sidebar Canvas',
    category: 'shell',
    tier: 'functional',
    description: '左側窄工具列（icon-only 或 collapsible）+ 中央全幅畫布區',
    applicableScenes: ['tool', 'editor', 'dashboard', 'developer'],
    tailwindHint: `grid grid-cols-[60px_1fr] h-screen
工具列：bg-muted/50 border-r flex flex-col items-center py-4 gap-2
每個 icon：w-10 h-10 rounded-lg flex items-center justify-center hover:bg-accent
畫布：overflow-auto p-6`,
    moodAffinity: ['tech-dark'],
    incompatibleWith: ['floating-nav'],
  },
  {
    id: 'pricing-table',
    name: 'Pricing Table',
    category: 'shell',
    tier: 'both',
    description: '3 欄價格對比表，中間突出推薦方案，Landing Page 必備段落',
    applicableScenes: ['landing', 'saas', 'product'],
    tailwindHint: `grid grid-cols-3 gap-6 max-w-5xl mx-auto items-start
普通欄：border rounded-2xl p-8
推薦欄：border-2 border-primary rounded-2xl p-8 shadow-xl relative -mt-4 pb-12
推薦標：absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm`,
    moodAffinity: ['neo-corporate'],
  },
  {
    id: 'mega-footer',
    name: 'Mega Footer',
    category: 'shell',
    tier: 'both',
    description: '多欄 footer：品牌區 + 連結組 + newsletter + 社群 icon',
    applicableScenes: ['landing', 'corporate', 'saas', 'ecommerce'],
    tailwindHint: `bg-muted/30 border-t mt-24
內容：max-w-7xl mx-auto px-8 py-16 grid grid-cols-[2fr_1fr_1fr_1fr] gap-12
品牌欄：logo + 描述 + 社群 icon row
連結欄：space-y-3 text-sm text-muted-foreground
底部：border-t mt-12 pt-6 flex justify-between text-xs text-muted-foreground`,
    moodAffinity: ['organic-warm'],
  },
]

// ============================================================
// 所有 patterns 合集
// ============================================================

const ALL_PATTERNS: CompositionPattern[] = [
  ...HERO_PATTERNS,
  ...CONTENT_PATTERNS,
  ...DATA_PATTERNS,
  ...SHELL_PATTERNS,
]

export const COMPOSITION_PATTERNS: Record<string, CompositionPattern> = Object.fromEntries(
  ALL_PATTERNS.map(p => [p.id, p])
)

// ============================================================
// 選擇邏輯
// ============================================================

/**
 * 根據 tier + productType + pages + mood 選擇組合模式
 *
 * 選擇策略：
 * 1. Tier 過濾
 * 2. Page-type 偵測（needsHero / needsData）
 * 3. 保底（hero / data 至少各 1）
 * 4. 加權排序（productType × 2, mood × 1.5）
 * 5. 互斥檢查
 */
export function selectCompositionPatterns(
  tier: DesignTier,
  productType: string,
  pages: string[],
  moodId?: string,
  count: number = 2,
  layoutArchetypeHint?: string
): CompositionPattern[] {
  const maxCount = Math.min(count, 3)

  // 1. Tier 過濾
  const eligible = ALL_PATTERNS.filter(
    p => p.tier === 'both' || p.tier === tier
  )

  // 2. Page-type 偵測
  const pageStr = pages.map(p => p.toLowerCase()).join(' ')
  const needsHero = /home|index|landing|page\.tsx/.test(pageStr) || pages.length <= 2
  const needsData = /dashboard|admin|analytics|settings/.test(pageStr)

  // 3. 加權計算
  interface WeightedPattern {
    pattern: CompositionPattern
    weight: number
  }

  const weighted: WeightedPattern[] = eligible.map(p => {
    let weight = 1

    // productType 在 applicableScenes → 加倍
    if (p.applicableScenes.includes(productType)) {
      weight *= 2
    }

    // moodId 在 moodAffinity → × 1.5
    if (moodId && p.moodAffinity?.includes(moodId)) {
      weight *= 1.5
    }

    // layoutArchetypeHint → 對應 category 加分
    if (layoutArchetypeHint) {
      const archetypeCategoryBonus: Record<string, { categories: PatternCategory[]; bonus: number }[]> = {
        bento:        [{ categories: ['content'], bonus: 20 }],
        editorial:    [{ categories: ['content'], bonus: 20 }],
        dashboard:    [{ categories: ['data'], bonus: 20 }],
        storytelling: [{ categories: ['hero'], bonus: 20 }, { categories: ['content'], bonus: 15 }],
        'app-shell':  [{ categories: ['shell'], bonus: 20 }],
      }
      const bonuses = archetypeCategoryBonus[layoutArchetypeHint]
      if (bonuses) {
        for (const { categories, bonus } of bonuses) {
          if (categories.includes(p.category)) {
            weight += bonus
          }
        }
      }
    }

    return { pattern: p, weight }
  })

  // 按權重降序排列
  weighted.sort((a, b) => b.weight - a.weight)

  const selected: CompositionPattern[] = []
  const selectedIds = new Set<string>()

  // 檢查互斥
  function isCompatible(p: CompositionPattern): boolean {
    if (selectedIds.has(p.id)) return false
    for (const sel of selected) {
      if (sel.incompatibleWith?.includes(p.id)) return false
      if (p.incompatibleWith?.includes(sel.id)) return false
    }
    return true
  }

  function pickOne(pool: WeightedPattern[]): boolean {
    for (const wp of pool) {
      if (isCompatible(wp.pattern)) {
        selected.push(wp.pattern)
        selectedIds.add(wp.pattern.id)
        return true
      }
    }
    return false
  }

  // 4. 保底：needsHero → 必選 1 hero
  if (needsHero) {
    const heroPool = weighted.filter(w => w.pattern.category === 'hero')
    pickOne(heroPool)
  }

  // 保底：needsData → 必選 1 data
  if (needsData) {
    const dataPool = weighted.filter(w => w.pattern.category === 'data')
    pickOne(dataPool)
  }

  // 5. 補到 maxCount
  const remaining = weighted.filter(w => !selectedIds.has(w.pattern.id))
  while (selected.length < maxCount && remaining.length > 0) {
    const candidate = remaining.shift()!
    if (isCompatible(candidate.pattern)) {
      selected.push(candidate.pattern)
      selectedIds.add(candidate.pattern.id)
    }
  }

  return selected
}

// ============================================================
// Prompt 格式化
// ============================================================

/**
 * 格式化 patterns 為 prompt 注入段落（注入 generateStructure）
 */
export function formatPatternsForPrompt(patterns: CompositionPattern[]): string {
  if (patterns.length === 0) return ''

  const lines = patterns.map((p, i) => {
    return `${i + 1}. **${p.name}**（${p.category}）：${p.description}
   Tailwind 骨架：
\`\`\`
${p.tailwindHint}
\`\`\``
  })

  return `## 頁面組合模式（Section-Level Layout — 必須採用）
以下組合模式定義了頁面各段落的排列方式。你必須在對應段落中使用這些佈局骨架：

${lines.join('\n\n')}

這些是結構骨架，不是最終代碼。根據實際內容調整細節，但整體佈局結構必須遵循。`
}

/**
 * 列出 tier 兼容的所有 patterns 摘要（注入 generateDesignVariants 供差異化）
 */
export function listPatternsForVariants(tier: DesignTier): string {
  const eligible = ALL_PATTERNS.filter(
    p => p.tier === 'both' || p.tier === tier
  )

  const byCategory = new Map<PatternCategory, CompositionPattern[]>()
  for (const p of eligible) {
    const list = byCategory.get(p.category) || []
    list.push(p)
    byCategory.set(p.category, list)
  }

  const sections: string[] = []
  for (const [cat, patterns] of byCategory) {
    const items = patterns.map(p => `  - ${p.name}：${p.description}`).join('\n')
    sections.push(`**${cat.charAt(0).toUpperCase() + cat.slice(1)}**\n${items}`)
  }

  return `## 可用的組合模式（供 signatureElement 差異化參考）
5 個變體應考慮使用不同的組合模式來實現佈局差異化：

${sections.join('\n\n')}`
}
