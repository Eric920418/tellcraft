/**
 * 視覺技法庫
 * 結構化的設計技法集合，按 tier 和類別組織
 * 每次生成時隨機注入 2-3 個技法，增加視覺多樣性
 */

import type { DesignTier } from './uiux-generation'

export interface DesignTechnique {
  name: string
  category: 'layout' | 'surface' | 'typography' | 'interaction'
  tier: 'both' | 'creative' | 'functional'
  description: string
  codeHint: string
  insteadOf?: string
}

// ============================================================
// Layout 技法
// ============================================================

const LAYOUT_TECHNIQUES: DesignTechnique[] = [
  {
    name: 'Bento Grid',
    category: 'layout',
    tier: 'both',
    description: '不等大小的網格，用卡片面積突出重要內容',
    codeHint: 'CSS Grid: grid-cols-4 + col-span-2 row-span-2 的大卡片混搭 1x1 小卡片',
    insteadOf: '等大小 card grid',
  },
  {
    name: 'Editorial Split',
    category: 'layout',
    tier: 'creative',
    description: '左右不對稱分割（60/40 或 70/30），文圖交錯排列',
    codeHint: 'grid-cols-[3fr_2fr] 或 grid-cols-[7fr_3fr]，交替段落用 order-first/order-last 翻轉',
    insteadOf: '對稱兩欄佈局',
  },
  {
    name: 'Asymmetric Cards',
    category: 'layout',
    tier: 'both',
    description: '高度和寬度不同的卡片混搭，打破矩陣感',
    codeHint: 'CSS Grid auto-rows-[200px] + 部分卡片 row-span-2，或用 Masonry-like staggered heights',
    insteadOf: '同尺寸卡片矩陣',
  },
  {
    name: 'Sidebar + Detail Panel',
    category: 'layout',
    tier: 'functional',
    description: '左側列表/導航 + 右側詳情面板（Linear/Notion 風格）',
    codeHint: 'grid-cols-[280px_1fr]，左側 overflow-y-auto 固定高度，右側隨選擇切換內容',
    insteadOf: 'sidebar + card grid',
  },
  {
    name: 'Full-bleed Hero + Content',
    category: 'layout',
    tier: 'creative',
    description: '全寬段落與窄內容交替，建立視覺節奏',
    codeHint: '全寬段落用 -mx-[calc(50vw-50%)] 突破容器，內容段用 max-w-4xl mx-auto',
    insteadOf: '統一寬度的內容區',
  },
  {
    name: 'Timeline / Flow Layout',
    category: 'layout',
    tier: 'both',
    description: '時間軸或步驟驅動的佈局，用線條串聯內容',
    codeHint: 'relative + before:absolute before:left-1/2 before:h-full before:w-px before:bg-border 做中軸線',
    insteadOf: '線性列表',
  },
  {
    name: 'Magazine Grid',
    category: 'layout',
    tier: 'creative',
    description: '雜誌式混合排版：大圖+標題+小卡片+引言穿插',
    codeHint: 'grid-cols-6 配合不同 col-span（feature 佔 4col，sidebar 佔 2col），pullquote 用 col-span-full',
    insteadOf: '普通 blog grid',
  },
  {
    name: 'Command Center',
    category: 'layout',
    tier: 'functional',
    description: '指揮中心式 dashboard：頂部命令列 + 左側 nav + 主區域（Linear 風格）',
    codeHint: 'grid-rows-[48px_1fr] grid-cols-[240px_1fr]，頂部 col-span-full 做搜尋+breadcrumb',
    insteadOf: '表格為主的 dashboard',
  },
  {
    name: 'Overlay Cards',
    category: 'layout',
    tier: 'creative',
    description: '卡片局部重疊增加視覺張力',
    codeHint: '-mt-8 或 -ml-4 配合 relative z-10/z-20 讓卡片交疊，hover 時 z-30 提到最上層',
    insteadOf: '平鋪排列',
  },
  {
    name: 'Sticky Scroll Sections',
    category: 'layout',
    tier: 'creative',
    description: '固定左側標題/圖片 + 右側內容滾動切換',
    codeHint: '左欄 sticky top-24，右欄正常滾動。每個 section 用 min-h-screen 或 scroll-snap-align',
    insteadOf: '普通滾動頁面',
  },
]

// ============================================================
// Surface 技法
// ============================================================

const SURFACE_TECHNIQUES: DesignTechnique[] = [
  {
    name: 'Subtle Grain',
    category: 'surface',
    tier: 'both',
    description: '微噪點紋理增加表面質感，避免純色平板感',
    codeHint: 'after:absolute after:inset-0 after:bg-[url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence baseFrequency=\'0.65\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E")] after:pointer-events-none',
    insteadOf: '純色平面背景',
  },
  {
    name: 'Gradient Mesh Background',
    category: 'surface',
    tier: 'creative',
    description: '柔和的多色網格漸層背景，增加深度和氛圍',
    codeHint: '多個 radial-gradient 疊加：bg-[radial-gradient(at_30%_20%,var(--color-accent)/0.15,transparent_50%),radial-gradient(at_70%_60%,var(--color-primary)/0.1,transparent_50%)]',
    insteadOf: '純色或單一線性漸層背景',
  },
  {
    name: 'Glass Card',
    category: 'surface',
    tier: 'creative',
    description: '毛玻璃卡片效果，增加層次感',
    codeHint: 'backdrop-blur-xl bg-white/70 border border-white/20 shadow-lg shadow-black/5',
    insteadOf: '實色卡片',
  },
  {
    name: 'Dot Grid Pattern',
    category: 'surface',
    tier: 'both',
    description: '規則小圓點背景，增加技術感和結構感',
    codeHint: 'bg-[radial-gradient(circle,var(--color-border)_1px,transparent_1px)] bg-[size:20px_20px]',
    insteadOf: '純色背景',
  },
  {
    name: 'Layered Shadows',
    category: 'surface',
    tier: 'both',
    description: '多層微陰影增加立體深度，比單一 shadow 更精緻',
    codeHint: 'shadow-sm ring-1 ring-black/5 或 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(0,0,0,0.06)]',
    insteadOf: '單一 drop-shadow',
  },
  {
    name: 'Subtle Border Glow',
    category: 'surface',
    tier: 'creative',
    description: 'hover 時邊框微發光，增加互動質感',
    codeHint: 'hover:shadow-[0_0_0_1px_var(--color-accent)/0.3,0_0_15px_var(--color-accent)/0.1] transition-shadow',
    insteadOf: '普通 hover border 變色',
  },
  {
    name: 'Color Block Sections',
    category: 'surface',
    tier: 'creative',
    description: '交替色塊區分段落，建立視覺節奏',
    codeHint: '奇數段 bg-background，偶數段 bg-muted/50 或 bg-primary/5',
    insteadOf: '統一白色背景',
  },
  {
    name: 'Inset Shadow Cards',
    category: 'surface',
    tier: 'functional',
    description: '內凹陰影 + 細邊框，比外陰影更內斂',
    codeHint: 'shadow-inner ring-1 ring-black/5 bg-muted/30',
    insteadOf: '外陰影卡片',
  },
]

// ============================================================
// Typography 技法
// ============================================================

const TYPOGRAPHY_TECHNIQUES: DesignTechnique[] = [
  {
    name: 'Oversized Hero Text',
    category: 'typography',
    tier: 'creative',
    description: '超大標題文字建立視覺衝擊力',
    codeHint: 'text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9]',
    insteadOf: '普通大小的標題',
  },
  {
    name: 'Mixed Weight Headers',
    category: 'typography',
    tier: 'both',
    description: '同一標題中用不同 weight 建立對比',
    codeHint: '<h1><span className="font-light">We build</span> <span className="font-bold">better products</span></h1>',
    insteadOf: '統一 weight 的標題',
  },
  {
    name: 'Display + Body Contrast',
    category: 'typography',
    tier: 'both',
    description: '標題用 serif/display 字體，正文用 sans，字體族對比增加層次',
    codeHint: '標題 font-display（serif/display font），正文 font-sans，建立視覺張力',
    insteadOf: '全站只用一種字體',
  },
  {
    name: 'Monospace Accents',
    category: 'typography',
    tier: 'functional',
    description: '數據、標籤、代碼使用 mono 字體突出',
    codeHint: 'font-mono text-sm tracking-wide uppercase — 用於標籤、數據值、badge',
    insteadOf: '全部用 sans-serif',
  },
  {
    name: 'Large Number Display',
    category: 'typography',
    tier: 'functional',
    description: '關鍵數字用超大字號呈現，一眼抓住重點',
    codeHint: 'text-5xl font-bold tabular-nums tracking-tight — metric 數字獨立一行',
    insteadOf: '數字和標籤同樣大小',
  },
  {
    name: 'Gradient Text',
    category: 'typography',
    tier: 'creative',
    description: '漸層文字效果，適合 hero 區域標題',
    codeHint: 'bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent',
    insteadOf: '純色標題',
  },
]

// ============================================================
// Interaction 技法
// ============================================================

const INTERACTION_TECHNIQUES: DesignTechnique[] = [
  {
    name: 'Card Hover Lift',
    category: 'interaction',
    tier: 'both',
    description: 'hover 時卡片微提升 + 陰影加深',
    codeHint: 'hover:-translate-y-1 hover:shadow-lg transition-all duration-200',
    insteadOf: '純色變化 hover',
  },
  {
    name: 'Reveal on Scroll',
    category: 'interaction',
    tier: 'creative',
    description: '滾動時元素漸入，建立敘事感',
    codeHint: '<motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>',
    insteadOf: '所有元素同時出現',
  },
  {
    name: 'Stagger Grid Items',
    category: 'interaction',
    tier: 'creative',
    description: 'grid 子元素依序入場，建立節奏感',
    codeHint: '{items.map((item, i) => <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} />)}',
    insteadOf: '所有 grid 項目同時出現',
  },
  {
    name: 'Inline Expand',
    category: 'interaction',
    tier: 'functional',
    description: '點擊行內展開詳情，不彈 Modal',
    codeHint: '<AnimatePresence>{expanded && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>}</AnimatePresence>',
    insteadOf: '所有詳情都彈 Modal',
  },
  {
    name: 'Tab + Panel Transition',
    category: 'interaction',
    tier: 'both',
    description: '切換 tab 時 panel 內容滑入/淡入',
    codeHint: '<AnimatePresence mode="wait"><motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>',
    insteadOf: '硬切換 tab 內容',
  },
  {
    name: 'Hover Info Card',
    category: 'interaction',
    tier: 'functional',
    description: 'hover 時浮出 mini 資訊卡，無需點擊',
    codeHint: 'group/item relative → group-hover/item:opacity-100 absolute top-full mt-2 的 tooltip card',
    insteadOf: '需要點擊才能看詳情',
  },
]

// ============================================================
// 所有技法合集
// ============================================================

const ALL_TECHNIQUES: DesignTechnique[] = [
  ...LAYOUT_TECHNIQUES,
  ...SURFACE_TECHNIQUES,
  ...TYPOGRAPHY_TECHNIQUES,
  ...INTERACTION_TECHNIQUES,
]

// 產品類型 → 類別權重偏好
const PRODUCT_CATEGORY_WEIGHTS: Record<string, Partial<Record<DesignTechnique['category'], number>>> = {
  dashboard: { layout: 2, surface: 1, typography: 1.5, interaction: 1.5 },
  saas: { layout: 1.5, surface: 1, typography: 1, interaction: 1.5 },
  tool: { layout: 1.5, surface: 0.5, typography: 1, interaction: 2 },
  landing: { layout: 1.5, surface: 1.5, typography: 1.5, interaction: 1 },
  portfolio: { layout: 1.5, surface: 1.5, typography: 2, interaction: 1 },
  blog: { layout: 1, surface: 1, typography: 2, interaction: 0.5 },
  restaurant: { layout: 1, surface: 1.5, typography: 1.5, interaction: 1 },
  ecommerce: { layout: 1.5, surface: 1, typography: 1, interaction: 1.5 },
  event: { layout: 1, surface: 1.5, typography: 1.5, interaction: 1 },
}

/**
 * 根據 tier 和 productType 選擇技法
 * 每個類別至少 1 個，總共 count 個
 */
export function selectTechniques(
  tier: DesignTier,
  productType: string,
  count: number = 3
): DesignTechnique[] {
  // 1. 篩選 tier 相容的技法
  const eligible = ALL_TECHNIQUES.filter(
    t => t.tier === 'both' || t.tier === tier
  )

  // 2. 按類別分組
  const byCategory = new Map<DesignTechnique['category'], DesignTechnique[]>()
  for (const t of eligible) {
    const list = byCategory.get(t.category) || []
    list.push(t)
    byCategory.set(t.category, list)
  }

  // 3. 每個類別隨機選一個作為保底
  const selected: DesignTechnique[] = []
  const categories: DesignTechnique['category'][] = ['layout', 'surface', 'typography', 'interaction']

  for (const cat of categories) {
    const pool = byCategory.get(cat)
    if (!pool || pool.length === 0) continue
    const idx = Math.floor(Math.random() * pool.length)
    selected.push(pool[idx])
  }

  // 4. 補到 count 個（按產品類型權重加權隨機）
  const weights = PRODUCT_CATEGORY_WEIGHTS[productType] || {}
  const remaining = eligible.filter(t => !selected.includes(t))

  while (selected.length < count && remaining.length > 0) {
    // 加權隨機
    const weightedPool = remaining.map(t => ({
      technique: t,
      weight: weights[t.category] || 1,
    }))
    const totalWeight = weightedPool.reduce((s, w) => s + w.weight, 0)
    let r = Math.random() * totalWeight
    let picked: DesignTechnique | null = null

    for (const item of weightedPool) {
      r -= item.weight
      if (r <= 0) {
        picked = item.technique
        break
      }
    }

    if (!picked) picked = remaining[0]
    selected.push(picked)
    remaining.splice(remaining.indexOf(picked), 1)
  }

  return selected.slice(0, count)
}

/**
 * 快速模式：精簡版技法格式化（只列 name + codeHint，~50 tokens/個）
 */
export function formatTechniquesForPromptFast(techniques: DesignTechnique[]): string {
  if (techniques.length === 0) return ''
  const lines = techniques.map(t => `- **${t.name}**：\`${t.codeHint}\``)
  return `## 視覺技法（至少使用 1 個，讓設計有辨識度）
${lines.join('\n')}`
}

/**
 * 格式化技法為 prompt 注入段落
 */
export function formatTechniquesForPrompt(techniques: DesignTechnique[]): string {
  if (techniques.length === 0) return ''

  const lines = techniques.map((t, i) => {
    let line = `${i + 1}. **${t.name}**（${t.category}）：${t.description}\n   Code hint: \`${t.codeHint}\``
    if (t.insteadOf) {
      line += `\n   Instead of: ${t.insteadOf}`
    }
    return line
  })

  return `## 設計方向（本次生成的視覺技法）
你必須在生成中使用以下至少 ${Math.min(2, techniques.length)} 個視覺技法，讓設計有辨識度：

${lines.join('\n\n')}

不要只是在某個角落用一下就交差 — 技法要融入整體設計語言。`
}
