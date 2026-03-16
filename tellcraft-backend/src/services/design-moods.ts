/**
 * 設計情緒系統（Design Mood System）
 * 8 個設計情緒預設 + 規則式推薦 + prompt 注入 getter
 *
 * Mood 通過 prompt 注入工作，不擴展 DesignSystem TypeScript 介面
 * 優先級：variantConcept > mood > tier constraints > generic rules
 */

import type { DesignTier } from './uiux-generation'

// ============================================================
// Types
// ============================================================

export interface DesignMood {
  id: string
  name: string                    // 中文名
  nameEn: string                  // 英文名
  description: string             // 一句話描述（供 Brief 展示）
  compatibleTiers: DesignTier[]
  promptBlock: string             // 200-300 字視覺指引（注入 Structure/Variant）
  animationHint: string           // 50-100 字動畫風格
  rwdHint: string                 // 30-50 字 RWD 風格
  feelingKeywords: string[]       // 匹配用戶「感覺」的關鍵詞
  productTypeAffinity: string[]   // 高親和度產品類型
}

// ============================================================
// 8 個 Mood 預設
// ============================================================

export const DESIGN_MOODS: Record<string, DesignMood> = {
  'glassmorphic-dark': {
    id: 'glassmorphic-dark',
    name: '玻璃暗色',
    nameEn: 'Glassmorphic Dark',
    description: '透明毛玻璃卡片、霓虹邊框、深色漸層背景，科幻氛圍',
    compatibleTiers: ['creative'],
    promptBlock: `## Surface Treatment
- 卡片使用半透明背景（bg-white/5 或 bg-white/10）配合 backdrop-blur-xl
- 邊框用極細的白色半透明線（border border-white/10）或漸層邊框（bg-gradient-to-r 包裹）
- 禁止實心白色或淺灰色卡片背景

## Color Usage
- 主背景使用深色漸層（from-slate-950 via-slate-900 to-slate-950）
- 強調色用霓虹調（cyan-400, violet-400, emerald-400），作為 glow 和邊框色
- 文字用 slate-100（主文字）和 slate-400（次要文字），禁止純黑文字

## Shadow & Depth
- 卡片不使用傳統陰影，改用強調色 glow（shadow-[0_0_15px_rgba(34,211,238,0.15)]）
- 層次通過透明度區分（前景 bg-white/10 → 中景 bg-white/5 → 背景純色）
- 分隔線用漸層淡出（from-transparent via-white/20 to-transparent）

## Typography
- 標題用幾何無襯線體（Space Grotesk, Inter），weight 600-700
- 大標題可用漸層文字（bg-gradient-to-r bg-clip-text text-transparent）
- 等寬字體用於數據展示區域

## Spacing & Rhythm
- 大量留白（py-24, gap-8），讓毛玻璃效果有呼吸空間
- 內容區域寬度適中（max-w-6xl），不要過密

## Signature Hints
- 至少一處使用漸層邊框的 hero 卡片
- 背景可加微弱的網格線或光點動畫作為裝飾
- 按鈕使用漸層背景 + hover 時 glow 擴散`,
    animationHint: `動畫風格：流暢、帶光感。入場用 opacity + scale(0.95→1) + blur(4px→0)。
hover 時卡片邊框 glow 強度增加。背景可加緩慢漂移的光斑（translateX 迴圈）。
所有 transition 用 ease-out 0.3s-0.5s，不要 bounce。`,
    rwdHint: `移動端保留深色背景和毛玻璃效果，適當降低 blur 值（blur-lg→blur-md）以保持效能。觸控目標加大到 48px。`,
    feelingKeywords: ['玻璃', '毛玻璃', '透明', '霓虹', '暗色', '科技', '未來', '酷', 'glass', 'neon', 'dark', 'futuristic', 'cyber', '賽博', '科幻', 'cool'],
    productTypeAffinity: ['tech', 'saas', 'agency', 'developer', 'creative'],
  },

  'brutalist': {
    id: 'brutalist',
    name: '粗獷主義',
    nameEn: 'Brutalist',
    description: '粗邊框、零圓角、極限黑白對比、等寬字體，反設計的設計',
    compatibleTiers: ['creative'],
    promptBlock: `## Surface Treatment
- 卡片使用粗邊框（border-2 或 border-4 border-black）
- 圓角一律 rounded-none，禁止任何圓角
- 背景用純色塊（black, white, 或單一強調色的純色）

## Color Usage
- 主色調為黑白（bg-black text-white 或 bg-white text-black）
- 最多一個強調色（如 yellow-400 或 red-500），大面積使用而非點綴
- 禁止漸層、禁止半透明、禁止灰色過渡（只用 black/white/強調色）

## Shadow & Depth
- 使用 offset shadow（shadow-[4px_4px_0_black]）模擬印刷品偏移效果
- 禁止柔和陰影（shadow-lg 等），只用硬邊陰影
- hover 時陰影位移變化（shadow-[2px_2px_0] → shadow-[6px_6px_0]）

## Typography
- 標題用超大字號（text-6xl 或更大），weight 900（black）
- 正文用等寬字體（DM Mono, Space Mono, JetBrains Mono）
- 文字可大小混搭，標題和正文的 scale 差異要極端（4:1 以上）

## Spacing & Rhythm
- 網格感強烈，用明顯的分割線（border-b-2 border-black）
- 間距可以不均勻，刻意打破規律感
- 內容區域可佔滿全寬（不需要 max-w 約束）

## Signature Hints
- 至少一處使用旋轉文字（-rotate-3 或 rotate-2）
- 按鈕用方形（rounded-none）+ 粗邊框 + 大寫字母
- 游標可自訂為十字或其他非常規形狀（cursor-crosshair）`,
    animationHint: `動畫風格：硬切、突變。禁止平滑 ease 過渡。入場用 clip-path 裁切或 translateY 瞬移。
hover 用 scale(1.02) + shadow 位移變化，transition-duration 極短（100-150ms）。
可加打字機效果（逐字顯示）。`,
    rwdHint: `移動端保持粗邊框和零圓角。字體大小可適當縮小但仍要保持極端 scale 差異。觸控目標用粗邊框強調。`,
    feelingKeywords: ['粗獷', '工業', '硬派', '反叛', '大膽', '原始', 'brutalist', 'brutal', 'raw', 'punk', 'bold', 'edgy', '前衛', '實驗'],
    productTypeAffinity: ['creative', 'agency', 'event', 'music'],
  },

  'organic-warm': {
    id: 'organic-warm',
    name: '有機暖調',
    nameEn: 'Organic Warm',
    description: '大圓角、土色調、柔和光影、自然材質感，溫暖人文',
    compatibleTiers: ['creative', 'functional'],
    promptBlock: `## Surface Treatment
- 卡片使用大圓角（rounded-2xl 或 rounded-3xl）
- 邊框極淡或無邊框，依靠微弱陰影區分層次
- 可加微弱紋理背景（CSS noise 或 subtle pattern）

## Color Usage
- 主色調為暖土色（amber, orange 低飽和變體：amber-50, orange-100 作為背景）
- 強調色用深暖色（amber-700, stone-800）而非高飽和色
- 背景用米白（stone-50, amber-50）而非純白或灰白

## Shadow & Depth
- 使用溫暖色調的陰影（shadow-amber-100/50 或自訂暖灰陰影）
- 陰影柔和且擴散（shadow-xl，不用硬邊）
- 層次通過微弱色差區分（stone-50 → stone-100 → stone-200）

## Typography
- 標題用書法感/人文襯線體（Cormorant Garamond, Libre Baskerville, Lora）
- 正文用溫暖的無襯線體（Plus Jakarta Sans, DM Sans）
- 文字 weight 偏輕（300-500），避免過粗

## Spacing & Rhythm
- 慷慨的間距（py-20, gap-10），營造悠閒氛圍
- 內容區域適中（max-w-5xl），不要過寬
- 元素排列流暢自然，可用 flexbox wrap 而非嚴格 grid

## Signature Hints
- 至少一處使用有機形狀的裝飾（CSS blob 或 rounded-full 元素）
- 圖片使用大圓角（rounded-2xl）而非方形
- 可加手寫風或自然素材的裝飾性插圖佔位`,
    animationHint: `動畫風格：緩慢、柔和。入場用 opacity + translateY(10px)，duration 0.5-0.8s，ease [0.22,1,0.36,1]。
hover 用微弱的 scale(1.01) 和陰影加深。滾動驅動的視差效果可適度使用。
禁止快速彈跳或機械感動畫。`,
    rwdHint: `移動端保持大圓角和暖色調。間距可適度壓縮但仍保持寬鬆感。圖片維持圓角裁切。`,
    feelingKeywords: ['溫暖', '自然', '有機', '手工', '人文', '木質', '舒適', '放鬆', 'warm', 'organic', 'natural', 'cozy', 'earthy', 'handcraft', '田園', '森林', '樸實'],
    productTypeAffinity: ['restaurant', 'cafe', 'salon', 'nonprofit', 'travel', 'blog'],
  },

  'editorial-clean': {
    id: 'editorial-clean',
    name: '社論美學',
    nameEn: 'Editorial Clean',
    description: '超大留白、serif 標題、嚴格網格、黑白加一色，雜誌級排版',
    compatibleTiers: ['creative', 'functional'],
    promptBlock: `## Surface Treatment
- 極少使用卡片容器，內容直接放在留白空間中
- 如需分隔，用極細分割線（border-b border-stone-200）
- 背景純白或極淡暖白（#FAFAF8 或 stone-50）

## Color Usage
- 主色調為黑白（text-stone-900 on bg-white）
- 最多一個強調色，僅用於超連結和重點標記（下劃線、色塊標記）
- 禁止彩色背景區塊，所有色彩克制使用

## Shadow & Depth
- 禁止卡片陰影（完全不用 shadow-*）
- 層次通過留白大小和字體層級區分
- 圖片可加極淡邊框（border border-stone-100）

## Typography
- 標題使用大號 serif 體（Instrument Serif, Playfair Display, Fraunces）
- 正文用清晰的 sans-serif（Inter, DM Sans），weight 400
- 標題字號極大（text-5xl 到 text-7xl），行高緊湊（leading-tight）
- 段落文字寬度限制（max-w-prose 或 max-w-2xl）

## Spacing & Rhythm
- 超大留白（py-32, gap-16），每個區塊之間有明顯呼吸
- 嚴格的垂直節奏（一致的 margin/padding 倍數）
- 內容左對齊或居中，不要三欄以上的密集網格

## Signature Hints
- 至少一處使用超大 serif 標題（text-7xl+）作為視覺焦點
- 文字和圖片的比例關係要講究（Golden Ratio 或 Rule of Thirds）
- 可用全幅圖片 + 下方小字標注的雜誌排版`,
    animationHint: `動畫風格：優雅、克制。入場只用 opacity（0→1），duration 0.6-1s。
禁止 scale 和 translateY 入場動畫。hover 只用 color transition 和 underline 變化。
滾動時內容淡入即可，不要花哨的位移效果。`,
    rwdHint: `移動端保持大量留白和 serif 標題。字號適當縮小但仍保持層級對比。單欄佈局，段落寬度自適應。`,
    feelingKeywords: ['雜誌', '社論', '排版', '留白', '極簡', '優雅', '文藝', '高級', 'editorial', 'magazine', 'minimal', 'clean', 'elegant', 'typography', 'serif', '簡約', '文青'],
    productTypeAffinity: ['blog', 'portfolio', 'creative', 'agency', 'nonprofit'],
  },

  'neo-corporate': {
    id: 'neo-corporate',
    name: '新商務',
    nameEn: 'Neo Corporate',
    description: '微漸層、幾何圖案、冷色調系統化配色、資料視覺化友好',
    compatibleTiers: ['functional'],
    promptBlock: `## Surface Treatment
- 卡片使用小圓角（rounded-lg）和極淡邊框（border border-slate-200）
- 背景用純白或極淡灰（slate-50），區塊用 slate-100 區分
- 表格/數據區域用細線分隔（divide-y divide-slate-100）

## Color Usage
- 主色調為冷色系（blue-600, indigo-600, slate-700）
- 背景用白/灰/藍灰三層（white → slate-50 → slate-100）
- 數據可視化色彩：blue-500, emerald-500, amber-500, rose-500（語義化）
- 微漸層只用於 CTA 按鈕（from-blue-600 to-indigo-600）

## Shadow & Depth
- 卡片用極淡陰影（shadow-sm）加邊框
- hover 時陰影微增（shadow-sm → shadow-md）
- 避免深色或彩色陰影

## Typography
- 標題和正文統一用 geometric sans-serif（Space Grotesk, DM Sans）
- weight 分佈：標題 600，正文 400，標籤 500
- 數據用 tabular-nums 等寬數字

## Spacing & Rhythm
- 緊湊但有秩序的間距（py-12, gap-6）
- 嚴格的 8px grid 對齊
- 側邊欄 + 主內容區域的經典佈局

## Signature Hints
- 至少一處使用數據卡片（數字 + 趨勢箭頭 + 小圖表）
- 表格或列表要有清晰的 header 和 striped rows
- 狀態標籤使用 badge 樣式（rounded-full px-3 py-1 text-xs）`,
    animationHint: `動畫風格：精確、功能性。入場用 opacity + translateY(8px)，duration 0.2-0.3s。
數字變化用 counter 動畫。進度條用寬度 transition。
hover 只用陰影和邊框色變化，禁止 scale。`,
    rwdHint: `移動端側邊欄折疊為底部導航或抽屜。數據卡片堆疊為垂直列表。表格用橫向滾動而非壓縮。`,
    feelingKeywords: ['商務', '企業', '專業', '系統', '效率', '數據', '管理', '後台', 'corporate', 'business', 'professional', 'dashboard', 'enterprise', 'clean', '正式'],
    productTypeAffinity: ['dashboard', 'saas', 'finance', 'corporate', 'legal', 'healthcare'],
  },

  'playful-pop': {
    id: 'playful-pop',
    name: '活潑流行',
    nameEn: 'Playful Pop',
    description: '高飽和色彩、大圓角、彈性動畫、趣味插圖風，活力四射',
    compatibleTiers: ['creative'],
    promptBlock: `## Surface Treatment
- 卡片使用超大圓角（rounded-3xl）和彩色背景
- 邊框可用彩色粗線（border-2 border-purple-400）
- 可用點狀或波浪裝飾作為分隔

## Color Usage
- 大膽的多色搭配（purple-500, pink-500, yellow-400, emerald-400）
- 背景可用彩色（不限於白/灰），如 purple-50, pink-50
- 漸層大膽使用（from-purple-500 via-pink-500 to-orange-400）
- 文字在深色背景上用白色，淺色背景上用對應深色

## Shadow & Depth
- 使用彩色陰影（shadow-purple-200/50, shadow-pink-200/50）
- 可用大尺度的 offset shadow 增加趣味（shadow-[6px_6px_0_theme(colors.purple.400)]）
- 層次通過色彩飽和度差異區分

## Typography
- 標題用圓潤的幾何體（Bricolage Grotesque, Plus Jakarta Sans）weight 700-800
- 可混搭手寫風字體作為裝飾性文字
- 字號對比明顯（大標題 text-5xl，正文 text-base）

## Spacing & Rhythm
- 寬鬆間距（py-16, gap-8），元素之間有跳動感
- 網格可不對稱，元素可有輕微旋轉（rotate-1, -rotate-2）
- 卡片大小可混搭

## Signature Hints
- 至少一處使用彩色漸層背景的 hero 區域
- 按鈕圓潤飽滿（rounded-full px-8 py-4）
- 可用 emoji 或 icon 作為裝飾性元素
- 背景加彩色幾何形狀裝飾（圓形、方形散佈）`,
    animationHint: `動畫風格：彈性、活潑。入場用 spring 動畫（stiffness 300, damping 20）。
hover 用 scale(1.05) + rotate(2deg) + 彩色陰影擴散。
可加搖擺（rotate oscillation）或彈跳（bounce）效果。整體感覺有趣不嚴肅。`,
    rwdHint: `移動端保持彩色和大圓角。裝飾性元素可隱藏以節省空間。按鈕保持飽滿圓潤觸控友好。`,
    feelingKeywords: ['活潑', '可愛', '有趣', '鮮豔', '年輕', '繽紛', '趣味', 'playful', 'fun', 'colorful', 'vibrant', 'pop', 'cute', 'lively', '歡樂', '童趣'],
    productTypeAffinity: ['education', 'event', 'ecommerce', 'fitness'],
  },

  'luxury-minimal': {
    id: 'luxury-minimal',
    name: '奢華極簡',
    nameEn: 'Luxury Minimal',
    description: '超大字體、金色/啞色調、極致留白、serif + sans 混搭，高端質感',
    compatibleTiers: ['creative'],
    promptBlock: `## Surface Treatment
- 幾乎不使用卡片容器，內容浮在大量留白中
- 如需容器，用極細邊框（border border-stone-200）或無邊框
- 背景用奶油白（#F5F0EB）或極淡的暖灰

## Color Usage
- 主色調為黑 + 米白 + 金/啞金（amber-600 或自訂 #B8860B）
- 金色僅用於細節點綴（分隔線、icon、hover 下劃線）
- 禁止彩色背景塊，所有色彩極度克制
- 文字用接近黑的深棕（stone-900）

## Shadow & Depth
- 禁止明顯陰影
- 層次通過字體大小和留白區分
- 圖片可加極淡的暖色 overlay

## Typography
- 標題用優雅的 serif（Cormorant Garamond, Instrument Serif）weight 300-400
- 正文用精緻的 sans-serif（Plus Jakarta Sans, DM Sans）weight 300
- 標題字號極大（text-6xl 到 text-8xl），字母間距加寬（tracking-wider）
- 大量使用大寫字母（uppercase tracking-[0.2em]）

## Spacing & Rhythm
- 極致留白（py-40, gap-20），奢侈地使用空間
- 每個畫面只有 1-2 個視覺焦點
- 水平留白也要充足（px-20 或更多）

## Signature Hints
- hero 區域使用超大 serif 字體（text-8xl+）
- 至少一處使用金色細線作為裝飾分隔
- 導航極簡（文字 only，大寫，tracking-widest）
- 按鈕用細邊框（border border-stone-900）不填充背景`,
    animationHint: `動畫風格：緩慢、精緻。入場用 opacity（0→1）duration 0.8-1.2s。
滾動時內容以極慢速度淡入。hover 只用下劃線展開或文字顏色微變。
禁止任何突然或花哨的動畫。整體感覺沉穩、有份量。`,
    rwdHint: `移動端保持極致留白和大字號。字號可按比例縮小但仍要突出。金色裝飾線保留但寬度可調整。`,
    feelingKeywords: ['奢華', '高端', '精品', '極簡', '金色', '高級', '質感', 'luxury', 'premium', 'minimal', 'gold', 'elegant', 'upscale', 'sophisticated', '低調', '名牌', '頂級'],
    productTypeAffinity: ['salon', 'realestate', 'travel', 'retail', 'corporate'],
  },

  'tech-dark': {
    id: 'tech-dark',
    name: '科技暗黑',
    nameEn: 'Tech Dark',
    description: '暗色模式、等寬字體、終端綠/藍、代碼美學，工程師風格',
    compatibleTiers: ['creative', 'functional'],
    promptBlock: `## Surface Treatment
- 卡片使用暗色背景（bg-slate-800/50 或 bg-gray-900）+ 極淡邊框（border-slate-700）
- 圓角適中（rounded-lg），不要太大也不要零
- 可用虛線邊框（border-dashed）表示可互動區域

## Color Usage
- 主背景深色（bg-slate-950 或 bg-gray-950）
- 強調色用終端色系（green-400, cyan-400, blue-400）
- 文字用 slate-300（主文字）和 slate-500（次要文字）
- 代碼片段背景用稍淺的暗色（bg-slate-800）

## Shadow & Depth
- 禁止傳統陰影，用邊框和背景色差區分層次
- 可用極微弱的內發光（ring-1 ring-slate-700）
- 選中/active 狀態用強調色邊框（ring-2 ring-green-400/50）

## Typography
- 標題用幾何無襯線（Space Grotesk, DM Sans）weight 500-600
- 數據和代碼用等寬字體（DM Mono, JetBrains Mono）
- 可混合使用 monospace 和 sans-serif
- 文字不要太大，保持技術文檔的緊湊感

## Spacing & Rhythm
- 緊湊有序（py-12, gap-4），像終端或 IDE 的密度
- 明確的網格系統，元素對齊精確
- sidebar + main 或 header + tabs + content 的結構化佈局

## Signature Hints
- 至少一處使用等寬字體顯示代碼或數據
- 狀態指示器使用小圓點（w-2 h-2 rounded-full bg-green-400）
- 可加 terminal-style 的命令列裝飾（$ prompt）
- 按鈕風格簡潔（bg-transparent border border-slate-600 hover:border-green-400）`,
    animationHint: `動畫風格：精準、機械。入場用 opacity + translateY(4px)，duration 0.15-0.25s。
可加打字機效果和游標閃爍。狀態變化用 border-color transition。
hover 只變邊框色和文字色，禁止 scale 和位移。整體感覺高效、精確。`,
    rwdHint: `移動端保持暗色主題和等寬字體。sidebar 折疊為底部導航。數據表格用卡片化呈現。`,
    feelingKeywords: ['科技', '暗色', '程式', '工程', '終端', '代碼', '黑客', '開發者', 'tech', 'dark', 'terminal', 'code', 'developer', 'hacker', 'engineering', 'matrix', '極客'],
    productTypeAffinity: ['developer', 'tech', 'saas', 'dashboard', 'agency'],
  },
}

// ============================================================
// 推薦邏輯
// ============================================================

interface MoodScore {
  id: string
  score: number
}

/**
 * 規則式推薦 1-3 個 mood ID
 * 三層加權：feeling 關鍵詞(50) + 產品類型親和(30) + tier 過濾(必要條件)
 * 無匹配（分數太低）→ 回傳空陣列
 */
export function recommendMoods(
  feeling: string,
  productType: string,
  tier: DesignTier
): string[] {
  const input = feeling.toLowerCase()
  const scores: MoodScore[] = []

  for (const mood of Object.values(DESIGN_MOODS)) {
    // Tier 過濾（必要條件）
    if (!mood.compatibleTiers.includes(tier)) continue

    let score = 0

    // Layer 1: Feeling 關鍵詞匹配（權重 50）
    let feelingMatches = 0
    for (const kw of mood.feelingKeywords) {
      if (input.includes(kw.toLowerCase())) {
        feelingMatches++
      }
    }
    if (feelingMatches > 0) {
      score += Math.min(feelingMatches * 15, 50)
    }

    // Layer 2: 產品類型親和（權重 30）
    if (mood.productTypeAffinity.includes(productType)) {
      score += 30
    }

    if (score > 0) {
      scores.push({ id: mood.id, score })
    }
  }

  // 排序取前 3
  scores.sort((a, b) => b.score - a.score)

  // 門檻：至少 15 分（避免過低分推薦）
  const MIN_SCORE = 15
  return scores
    .filter(s => s.score >= MIN_SCORE)
    .slice(0, 3)
    .map(s => s.id)
}

// ============================================================
// Prompt Getter
// ============================================================

/** 取得視覺指引（注入 Structure/Variant prompt） */
export function getMoodPromptBlock(moodId: string): string {
  return DESIGN_MOODS[moodId]?.promptBlock || ''
}

/** 取得動畫指引 */
export function getMoodAnimationHint(moodId: string): string {
  return DESIGN_MOODS[moodId]?.animationHint || ''
}

/** 取得 RWD 指引 */
export function getMoodRwdHint(moodId: string): string {
  return DESIGN_MOODS[moodId]?.rwdHint || ''
}

/** 取得摘要（Brief 展示 / refine 上下文） */
export function getMoodSummary(moodId: string): string {
  const mood = DESIGN_MOODS[moodId]
  if (!mood) return ''
  return `${mood.name}（${mood.nameEn}）— ${mood.description}`
}

/** 可用 Mood 列表（可按 tier 過濾） */
export function listAvailableMoods(tier?: DesignTier): Array<{ id: string; name: string; nameEn: string; description: string }> {
  return Object.values(DESIGN_MOODS)
    .filter(m => !tier || m.compatibleTiers.includes(tier))
    .map(m => ({ id: m.id, name: m.name, nameEn: m.nameEn, description: m.description }))
}

// ============================================================
// Few-shot 風格錨點代碼片段
// ============================================================

export const MOOD_CODE_FRAGMENTS: Record<string, string> = {
  'glassmorphic-dark': `
// === Glassmorphic Dark 風格示範 ===
// 毛玻璃卡片
function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative backdrop-blur-xl bg-white/5 border border-white/10
                    rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b
                      from-white/5 to-transparent pointer-events-none" />
      {children}
    </div>
  )
}
// Hero 區塊
// <section className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950
//                     flex items-center justify-center">
//   <h1 className="text-7xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400
//                  bg-clip-text text-transparent">
//     Product Name
//   </h1>
// </section>
// 霓虹按鈕
// <button className="px-6 py-3 rounded-xl border border-cyan-400/30 bg-cyan-400/10
//                    text-cyan-400 hover:bg-cyan-400/20 hover:border-cyan-400/60
//                    transition-all cursor-pointer">
//   Get Started
// </button>`,

  'brutalist': `
// === Brutalist 風格示範 ===
// 粗邊框卡片
function BrutalistCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="border-4 border-black p-6 bg-white hover:bg-yellow-400
                    transition-colors cursor-pointer shadow-[4px_4px_0_black]">
      <h2 className="font-mono font-black text-2xl uppercase mb-3">{title}</h2>
      <p className="font-mono text-base">{content}</p>
    </div>
  )
}
// Hero 區塊
// <section className="min-h-screen bg-white border-b-8 border-black flex items-center px-16">
//   <div className="max-w-4xl">
//     <p className="font-mono text-sm uppercase tracking-widest mb-4">Est. 2026</p>
//     <h1 className="font-black text-8xl uppercase leading-none tracking-tighter">
//       MAKE<br/>THINGS<br/>HAPPEN
//     </h1>
//     <div className="mt-8 h-2 w-48 bg-black" />
//   </div>
// </section>
// CTA 按鈕
// <button className="border-4 border-black bg-black text-white font-mono font-black
//                    uppercase px-8 py-4 hover:bg-yellow-400 hover:text-black
//                    transition-colors cursor-pointer">
//   START NOW →
// </button>`,

  'organic-warm': `
// === Organic Warm 風格示範 ===
// 大圓角暖色卡片
function WarmCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 rounded-3xl p-8 shadow-xl shadow-amber-100/50
                    border border-amber-100 hover:shadow-2xl transition-shadow">
      {children}
    </div>
  )
}
// Hero 區塊
// <section className="min-h-screen bg-stone-50 flex items-center px-20 py-32">
//   <div className="max-w-5xl">
//     <h1 className="font-light text-6xl text-stone-800 leading-relaxed" style={{ fontFamily: 'Cormorant Garamond' }}>
//       Crafted with Care
//     </h1>
//     <p className="mt-8 text-xl text-stone-600 font-light max-w-xl leading-relaxed">
//       Handmade with love and natural ingredients.
//     </p>
//   </div>
// </section>
// CTA 按鈕
// <button className="px-10 py-4 rounded-full bg-amber-700 text-amber-50
//                    hover:bg-amber-800 transition-colors cursor-pointer font-medium">
//   Explore Collection
// </button>`,

  'editorial-clean': `
// === Editorial Clean 風格示範 ===
// 無框内容區塊
function EditorialSection({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <section className="py-32 border-t border-stone-200">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-6">{label}</p>
      <h2 className="text-6xl font-light text-stone-900 mb-12 max-w-2xl leading-tight" style={{ fontFamily: 'Instrument Serif' }}>
        {title}
      </h2>
      <div className="max-w-prose text-stone-600 leading-relaxed">{children}</div>
    </section>
  )
}
// Hero 區塊
// <section className="min-h-screen flex items-end px-20 pb-32">
//   <div>
//     <h1 className="text-8xl font-light leading-none text-stone-900" style={{ fontFamily: 'Instrument Serif' }}>
//       The Future<br/><em>of Design</em>
//     </h1>
//   </div>
// </section>
// CTA 按鈕（極簡文字型）
// <a className="text-stone-900 border-b border-stone-900 pb-0.5 hover:border-stone-400
//               transition-colors text-sm uppercase tracking-wider cursor-pointer">
//   Read More
// </a>`,

  'neo-corporate': `
// === Neo Corporate 風格示範 ===
// 數據卡片
function MetricCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm
                    hover:shadow-md transition-shadow">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-3xl font-semibold text-slate-900 tabular-nums">{value}</p>
      <p className="text-sm text-emerald-600 mt-1 font-medium">{trend}</p>
    </div>
  )
}
// App Shell
// <div className="min-h-screen bg-slate-50 flex">
//   <aside className="w-64 bg-white border-r border-slate-200 p-6">
//     <nav className="space-y-1">
//       <a className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium text-sm cursor-pointer">
//         Dashboard
//       </a>
//     </nav>
//   </aside>
//   <main id="main" className="flex-1 p-8">...</main>
// </div>
// CTA 按鈕
// <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white
//                    rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700
//                    transition-all cursor-pointer">
//   Get Started
// </button>`,

  'playful-pop': `
// === Playful Pop 風格示範 ===
// 彩色漸層卡片
function PopCard({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl p-6 bg-gradient-to-br from-purple-50 to-pink-50
                    border-2 border-purple-200 hover:border-purple-400
                    shadow-purple-100/50 shadow-lg hover:shadow-xl transition-all cursor-pointer
                    hover:-translate-y-1">
      <span className="text-3xl mb-4 block">{emoji}</span>
      <h3 className="font-bold text-xl text-purple-900 mb-2">{title}</h3>
      <div className="text-purple-700 text-sm">{children}</div>
    </div>
  )
}
// Hero 區塊
// <section className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400
//                     flex items-center justify-center text-white">
//   <div className="text-center">
//     <h1 className="text-7xl font-black mb-6">Let's Make Magic! ✨</h1>
//     <p className="text-2xl font-medium opacity-90">Something awesome awaits.</p>
//   </div>
// </section>
// CTA 按鈕
// <button className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500
//                    text-white font-bold text-lg hover:from-purple-600 hover:to-pink-600
//                    shadow-purple-300/50 shadow-xl hover:shadow-2xl transition-all cursor-pointer">
//   Get Started 🚀
// </button>`,

  'luxury-minimal': `
// === Luxury Minimal 風格示範 ===
// 奢華留白區塊
function LuxurySection({ eyebrow, headline, children }: { eyebrow: string; headline: string; children: React.ReactNode }) {
  return (
    <section className="py-40 px-20">
      <p className="text-xs uppercase tracking-[0.3em] text-amber-600 mb-8">{eyebrow}</p>
      <h2 className="text-7xl font-light tracking-wider text-stone-900 mb-16 max-w-3xl leading-none"
          style={{ fontFamily: 'Cormorant Garamond' }}>
        {headline}
      </h2>
      <div className="h-px w-16 bg-amber-600 mb-16" />
      <div className="text-stone-500 font-light leading-loose max-w-lg">{children}</div>
    </section>
  )
}
// Hero 區塊
// <section className="min-h-screen bg-[#F5F0EB] flex items-center px-20">
//   <div>
//     <p className="text-xs uppercase tracking-[0.4em] text-amber-600 mb-12">Est. MMXXIV</p>
//     <h1 className="text-8xl font-extralight text-stone-900 leading-none tracking-wide"
//         style={{ fontFamily: 'Cormorant Garamond' }}>
//       Beyond<br/>Ordinary
//     </h1>
//   </div>
// </section>
// CTA 按鈕（細邊框型）
// <button className="px-8 py-3 border border-stone-900 text-stone-900 text-xs
//                    uppercase tracking-[0.2em] hover:bg-stone-900 hover:text-white
//                    transition-colors cursor-pointer">
//   Discover More
// </button>`,

  'tech-dark': `
// === Tech Dark 風格示範 ===
// 終端風格卡片
function TerminalCard({ command, output }: { command: string; output: string }) {
  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-rose-500" />
        <div className="w-3 h-3 rounded-full bg-amber-500" />
        <div className="w-3 h-3 rounded-full bg-emerald-500" />
      </div>
      <p className="font-mono text-sm text-slate-400"><span className="text-green-400">$</span> {command}</p>
      <p className="font-mono text-sm text-slate-300 mt-2">{output}</p>
    </div>
  )
}
// App Header
// <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center gap-4">
//   <div className="flex items-center gap-2">
//     <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
//     <span className="font-mono text-sm text-slate-300">system online</span>
//   </div>
// </header>
// CTA 按鈕
// <button className="px-4 py-2 bg-transparent border border-slate-600 text-slate-300
//                    font-mono text-sm hover:border-green-400 hover:text-green-400
//                    transition-colors cursor-pointer rounded">
//   $ deploy --now
// </button>`,
}

export function getMoodCodeFragment(moodId: string): string {
  return MOOD_CODE_FRAGMENTS[moodId] || ''
}

// ============================================================
// 快速模式精簡版風格錨點（3 行核心 className，~40 tokens/個）
// ============================================================

const MOOD_CODE_COMPACT: Record<string, string> = {
  'glassmorphic-dark': `// 毛玻璃卡片：backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]
// 漸層文字：bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent
// 霓虹按鈕：border border-cyan-400/30 bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20`,

  'brutalist': `// 粗邊框卡片：border-4 border-black shadow-[4px_4px_0_black] hover:bg-yellow-400
// 超大字：font-black text-8xl uppercase leading-none tracking-tighter
// CTA：border-4 border-black bg-black text-white hover:bg-yellow-400 hover:text-black`,

  'organic-warm': `// 暖色卡片：bg-amber-50 rounded-3xl shadow-xl shadow-amber-100/50 border border-amber-100
// 標題：font-light text-6xl text-stone-800 leading-relaxed (Cormorant Garamond)
// CTA：rounded-full bg-amber-700 text-amber-50 hover:bg-amber-800`,

  'editorial-clean': `// 無框區塊：py-32 border-t border-stone-200，背景純白
// 大標題：text-7xl font-light text-stone-900 leading-tight (Instrument Serif)
// CTA：text-stone-900 border-b border-stone-900 text-sm uppercase tracking-wider`,

  'neo-corporate': `// 數據卡片：bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md
// 數字：text-3xl font-semibold tabular-nums text-slate-900
// CTA：bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg`,

  'playful-pop': `// 彩色卡片：rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200
// Hero：bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white
// CTA：rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold`,

  'luxury-minimal': `// 留白區塊：py-40 px-20，背景奶油白 bg-[#F5F0EB]
// 大標題：text-8xl font-extralight tracking-wide text-stone-900 (Cormorant Garamond)
// CTA：border border-stone-900 text-xs uppercase tracking-[0.2em] hover:bg-stone-900 hover:text-white`,

  'tech-dark': `// 終端卡片：bg-slate-900 rounded-lg border border-slate-700，三色圓點裝飾
// 代碼風：font-mono text-sm text-slate-300，$符號 text-green-400
// CTA：bg-transparent border border-slate-600 font-mono hover:border-green-400 hover:text-green-400`,
}

export function getMoodCodeFragmentCompact(moodId: string): string {
  return MOOD_CODE_COMPACT[moodId] || ''
}

export function getMoodById(moodId: string): DesignMood | undefined {
  return DESIGN_MOODS[moodId]
}
