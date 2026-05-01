/**
 * Industry Priors (T3)
 *
 * template-matcher.ts 已有 21 個行業關鍵詞表，但只用來「選模板」。生成階段沒
 * 利用 — 餐廳和健身房用同一套 prompt，行業差異全靠 LLM 訓練資料偶然召回。
 *
 * 本模組為每個高頻行業提供一段 prior（150-200 字），覆蓋：
 *   - 視覺慣例（色彩 / 質感 / 字體傾向）
 *   - 必備 section（用戶會期待出現的內容區塊）
 *   - AI slop 警告（這個行業特別容易做出的爛設計）
 *
 * 注入點（皆為 dynamic 區，不污染 prompt cache）：
 *   - generateStructure：dynamic block
 *   - generateDesignVariants：在「設計原則」前
 *   - generateDesignBrief：systemPrompt 中段
 */

export interface IndustryPrior {
  id: string
  visualConventions: string   // 視覺慣例（色彩/質感/字體）
  expectedSections: string[]  // 用戶期待看到的 section
  aiSlopWarnings: string[]    // 這個行業特別容易踩的雷
}

const PRIORS: Record<string, IndustryPrior> = {
  restaurant: {
    id: 'restaurant',
    visualConventions: `主色偏暖（番茄紅、咖啡棕、奶油白、橄欖綠、芥末黃），背景常見木質/紙質紋理。
字體傾向有手感的襯線體（Lora / Playfair）或溫暖的無襯線（Recoleta / DM Sans）做標題，不要 Inter / Roboto。
食物攝影是主視覺，留白要夠讓圖片呼吸。卡片角度可帶點手寫感（圓角不要太機械化）。`,
    expectedSections: ['Menu / 菜單', 'Hours / 營業時間', 'Location / 地址 + 地圖', 'About / 主廚故事', 'Reservation / 訂位 CTA'],
    aiSlopWarnings: [
      '禁止 SaaS 風格的乾淨 sidebar + dashboard 佈局',
      '禁止 sans-serif 黑體大標（缺乏溫度）',
      '禁止紫色或冷色調主色（食慾殺手）',
      '禁止單調的 card grid 排所有菜色，菜色排版要有層次（招牌大、配菜小）',
    ],
  },
  fitness: {
    id: 'fitness',
    visualConventions: `主色高對比（黑底螢光綠/橙紅/檸檬黃，或全白配紅黑強調）。
字體粗壯有力（無襯線體 800-900 weight，或工業風 condensed sans）。
動態切割佈局（斜線、不對稱、運動軌跡感）。圖片偏向動作瞬間定格、肌肉特寫。
按鈕要硬派（zero radius 或銳角，全大寫文字）。`,
    expectedSections: ['Plans / 方案', 'Classes / 課表', 'Trainers / 教練', 'Schedule / 預約系統', 'Transformation / 學員成果'],
    aiSlopWarnings: [
      '禁止柔和漸層（健身要硬派，不要 SaaS 那種冷靜）',
      '禁止圓角過大（rounded-3xl 配健身像化妝品）',
      '禁止淺灰系（要黑要白，灰色稀釋強度）',
    ],
  },
  saas: {
    id: 'saas',
    visualConventions: `主色乾淨偏冷（indigo / slate / 藍紫，或中性灰 + 一個品牌強調色）。
字體無襯線、現代精準（Inter / DM Sans / Geist / Söhne）。
大量留白、subtle shadow、細邊框。Hero 常見 product screenshot 或抽象幾何圖形。
按鈕 padding 適中，圓角 rounded-md（中性偏現代）。`,
    expectedSections: ['Hero with product demo', 'Features / 功能列表', 'Integrations / 串接 logo grid', 'Pricing / 方案比較', 'Testimonials / 客戶證言', 'FAQ', 'Footer with sitemap'],
    aiSlopWarnings: [
      '禁止紫色漸層 hero（最典型的 AI slop SaaS 樣子）',
      '禁止過度 glow / neon 邊框（裝飾過頭）',
      '禁止滿版背景動畫（分散注意力）',
      '禁止 5 個都用 Inter 做主字體（缺乏個性）',
    ],
  },
  portfolio: {
    id: 'portfolio',
    visualConventions: `主色看設計師個性：極簡黑白、暖米色 + 棕、或大膽撞色。
字體有強烈個性（Editorial 襯線如 Fraunces / GT Sectra，或藝術感無襯線如 PP Neue Montreal）。
作品圖片是主角，UI 要退讓。常見：超大標題、不對稱排版、滿版圖、滾動敘事。
留白量大方，section 間切換有戲劇性（背景色變、字體大小跳躍）。`,
    expectedSections: ['Hero with name + role', 'Selected Works / 精選作品 (大圖優先)', 'About / 個人簡介', 'Process / 工作方式', 'Contact / 聯絡方式 (大字)'],
    aiSlopWarnings: [
      '禁止 SaaS 風格的 sidebar + card grid（看起來像作品集模板）',
      '禁止 6 張等大作品縮圖矩陣（缺乏層次，無法突出代表作）',
      '禁止 Hero 用 Stock photo（個人作品集要有人格化開場）',
      '禁止整齊到 boring 的對齊（個性需要刻意打破網格）',
    ],
  },
  ecommerce: {
    id: 'ecommerce',
    visualConventions: `主色看品牌：精品偏黑/米/燙金，快時尚偏鮮豔，B2B 偏冷靜。
字體常見現代無襯線（Söhne / DM Sans）+ 襯線標題（Editorial）混搭，建立精緻感。
產品圖最大、最清楚（白底或統一場景背景）。價格要醒目（不要藏起來）。
CTA「加入購物車」必須在 above-the-fold，色彩搶眼但不破壞整體調性。`,
    expectedSections: ['Hero with featured product / collection', 'Product Grid / 商品列表', 'Filters / 篩選 (側邊或頂部)', 'Cart drawer / 購物車', 'Trust signals / 信任標記 (退貨保證/評價)', 'Newsletter / 電子報訂閱'],
    aiSlopWarnings: [
      '禁止過度炫的動畫干擾選購流程（每次 hover 大幅縮放）',
      '禁止小字價格 + 微弱 CTA（電商 80% 流量是來買的，要醒目）',
      '禁止全 emoji 當分類 icon（看起來像國中生作品）',
      '禁止滿屏 sale tag 喊大特價（除非真的快時尚定位）',
    ],
  },
}

// ============================================================
// 行業 alias 映射（template.category 或 productType 可能用不同詞）
// ============================================================

const INDUSTRY_ALIASES: Record<string, string> = {
  restaurant: 'restaurant',
  cafe: 'restaurant',
  bakery: 'restaurant',
  food: 'restaurant',
  fitness: 'fitness',
  gym: 'fitness',
  yoga: 'fitness',
  saas: 'saas',
  software: 'saas',
  tool: 'saas',
  platform: 'saas',
  developer: 'saas',
  portfolio: 'portfolio',
  personal: 'portfolio',
  creative: 'portfolio',
  agency: 'portfolio',  // agency 也適用 portfolio 的調性
  ecommerce: 'ecommerce',
  shop: 'ecommerce',
  store: 'ecommerce',
  retail: 'ecommerce',
}

/**
 * 根據 productType / category 找到對應的 prior。
 * 找不到回 null（呼叫端應當作沒 prior 處理，不要強塞 default）。
 */
export function getIndustryPrior(productType: string | undefined): IndustryPrior | null {
  if (!productType) return null
  const key = INDUSTRY_ALIASES[productType.toLowerCase()]
  if (!key) return null
  return PRIORS[key] || null
}

/**
 * 格式化為 prompt 注入段落。
 * 沒匹配到 → 回空字串（不污染 prompt）。
 */
export function formatIndustryPriorForPrompt(productType: string | undefined): string {
  const prior = getIndustryPrior(productType)
  if (!prior) return ''

  const sections = prior.expectedSections.map(s => `  - ${s}`).join('\n')
  const warnings = prior.aiSlopWarnings.map(w => `  - ${w}`).join('\n')

  return `## 行業視覺先驗（${prior.id}）

### 視覺慣例
${prior.visualConventions}

### 用戶期待的 section
${sections}

### 此行業特別要避免的 AI slop
${warnings}

這些是行業約定俗成的視覺語言，不是強制規則。如果 brief 明確要求反其道而行
（例如「我要做一個極簡的健身網站，反工業風」）→ 尊重 brief，但要做得有意識，
不能因為慣性就回到 SaaS 模板。`
}

/** 給測試 / debug 用 */
export function listSupportedIndustries(): string[] {
  return Object.keys(PRIORS)
}
