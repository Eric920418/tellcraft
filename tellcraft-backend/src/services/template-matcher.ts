/**
 * 智能模板匹配服務
 * 三層評分（0-100 分），零 LLM 成本 — 全部規則式
 *
 * Layer 1: 關鍵詞匹配（40 分）— 需求描述 vs industry[] + use_cases[] + tags[]
 * Layer 2: Category 匹配（30 分）— inferProductType → category 映射
 * Layer 3: UISpec 匹配（30 分）— 頁面/元件重疊度（可選）
 */

import { query } from '../db/client'
import { inferProductType } from './fast-build-generation'
import type { UIRequirementsSpec } from './bdd-to-ui-spec'

// ============================================================
// Types
// ============================================================

export interface TemplateMatchResult {
  templateId: string
  score: number          // 0-100
  matchReasons: string[] // 顯示用，如 "行業匹配：餐廳"
}

interface DBTemplate {
  id: string
  slug: string
  category: string
  tags: string[]
  industry: string[]
  use_cases: string[]
  component_types: string[]
}

// ============================================================
// 關鍵詞矩陣
// ============================================================

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  restaurant: ['餐廳', '餐飲', '美食', '菜單', 'menu', 'restaurant', '小吃', '火鍋', '壽司', '拉麵'],
  cafe: ['咖啡', 'cafe', 'coffee', '甜點', '烘焙', '麵包', 'bakery'],
  fitness: ['健身', '瑜伽', 'gym', 'fitness', '運動', '健身房', '訓練'],
  education: ['教育', '課程', '學校', '培訓', 'course', '補習', '線上學習', '教學'],
  healthcare: ['醫療', '診所', '健康', '牙醫', 'clinic', '醫院', '保健'],
  realestate: ['房地產', '租屋', '房屋', '物業', '不動產', '仲介'],
  travel: ['旅遊', '民宿', '飯店', 'hotel', '旅行', '住宿', '觀光'],
  agency: ['代理', '工作室', 'agency', '顧問', '行銷', '廣告'],
  tech: ['科技', 'startup', '新創', 'app', '軟體', 'saas', '平台', '工具'],
  corporate: ['企業', '公司', '集團', 'corporate', '法人'],
  ecommerce: ['電商', '商店', '購物', 'shop', 'store', 'ecommerce', '網購', '商品'],
  developer: ['開發者', 'developer', 'api', '工程師', '程式'],
  creative: ['設計師', '攝影', '藝術', '創意', '作品集', 'portfolio', '插畫'],
  nonprofit: ['非營利', '公益', 'ngo', '慈善', '志工'],
  salon: ['美容', '美髮', '沙龍', 'salon', 'spa', '美甲'],
  legal: ['律師', '法律', '事務所', 'law', '法務'],
  finance: ['金融', '會計', '財務', '保險', 'finance', '理財'],
  event: ['活動', '婚禮', '會議', 'event', '展覽', '工作坊', '派對'],
  blog: ['部落格', 'blog', '文章', '寫作', '內容'],
  dashboard: ['後台', '管理', 'dashboard', 'admin', '控制台', '面板'],
  retail: ['零售', '門市', '實體店', '百貨'],
}

const USE_CASE_KEYWORDS: Record<string, string[]> = {
  'landing-page': ['官網', 'landing', '品牌', '介紹', '展示', '首頁'],
  'online-store': ['網路商店', '線上商店', '購物', '結帳', '商品'],
  'dashboard': ['後台', '管理系統', '控制台', '數據分析', '報表'],
  'portfolio': ['作品集', '展示', '個人網站', '履歷'],
  'blog': ['部落格', '文章', '寫作', '新聞'],
  'booking': ['預約', '訂位', '預訂', '排程'],
  'corporate-website': ['企業官網', '公司網站', '服務介紹'],
  'product-launch': ['產品上線', '發布', '推廣', '上架'],
  'brand-showcase': ['品牌展示', '形象官網', '品牌故事'],
  'service-showcase': ['服務展示', '服務介紹', '解決方案'],
  'data-visualization': ['數據視覺化', '圖表', '報表', '分析'],
}

// productType → category 映射表
const PRODUCT_TYPE_TO_CATEGORY: Record<string, string> = {
  restaurant: 'landing',
  cafe: 'landing',
  portfolio: 'portfolio',
  blog: 'blog',
  dashboard: 'dashboard',
  saas: 'saas',
  ecommerce: 'ecommerce',
  landing: 'landing',
  event: 'event',
  personal: 'portfolio',
}

// ============================================================
// Core Matching
// ============================================================

/**
 * 智能模板匹配
 * @returns 過濾 score >= 20，降序，上限 8 個
 */
export async function matchTemplates(input: {
  originalRequirements: string
  bddSpec?: string
  uiSpec?: UIRequirementsSpec
}): Promise<TemplateMatchResult[]> {
  const { originalRequirements, bddSpec, uiSpec } = input

  // 1. 從 DB 取所有活躍模板
  const templatesResult = await query<DBTemplate>(
    `SELECT id, slug, category, tags,
            COALESCE(industry, '{}') as industry,
            COALESCE(use_cases, '{}') as use_cases,
            COALESCE(component_types, '{}') as component_types
     FROM templates WHERE is_active = true`
  )

  if (templatesResult.rows.length === 0) return []

  // 2. 合併所有文字作為匹配源
  const fullText = [originalRequirements, bddSpec || ''].join(' ').toLowerCase()

  // 3. 推斷 productType 和 category
  const productType = inferProductType(originalRequirements)
  const inferredCategory = PRODUCT_TYPE_TO_CATEGORY[productType] || 'landing'

  // 4. 提取匹配到的 industry 和 use_case 標籤
  const matchedIndustries = extractMatches(fullText, INDUSTRY_KEYWORDS)
  const matchedUseCases = extractMatches(fullText, USE_CASE_KEYWORDS)

  // 5. 對每個模板評分
  const results: TemplateMatchResult[] = templatesResult.rows.map(template => {
    const reasons: string[] = []
    let score = 0

    // Layer 1: 關鍵詞匹配（最高 40 分）
    const keywordScore = scoreKeywords(template, matchedIndustries, matchedUseCases, fullText, reasons)
    score += Math.min(keywordScore, 40)

    // Layer 2: Category 匹配（最高 30 分）
    const categoryScore = scoreCategory(template, inferredCategory, productType, reasons)
    score += Math.min(categoryScore, 30)

    // Layer 3: UISpec 匹配（最高 30 分，可選）
    if (uiSpec) {
      const uiSpecScore = scoreUISpec(template, uiSpec, reasons)
      score += Math.min(uiSpecScore, 30)
    }

    return {
      templateId: template.id,
      score: Math.min(score, 100),
      matchReasons: reasons,
    }
  })

  // 6. 過濾 + 排序 + 截斷
  return results
    .filter(r => r.score >= 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
}

// ============================================================
// Layer 1: 關鍵詞匹配（0-40 分）
// ============================================================

function scoreKeywords(
  template: DBTemplate,
  matchedIndustries: string[],
  matchedUseCases: string[],
  fullText: string,
  reasons: string[]
): number {
  let score = 0

  // industry 重疊（每匹配一個 +10，最高 20）
  const industryOverlap = template.industry.filter(ind => matchedIndustries.includes(ind))
  if (industryOverlap.length > 0) {
    score += Math.min(industryOverlap.length * 10, 20)
    reasons.push(`行業匹配：${industryOverlap.join(', ')}`)
  }

  // use_cases 重疊（每匹配一個 +8，最高 12）
  const useCaseOverlap = template.use_cases.filter(uc => matchedUseCases.includes(uc))
  if (useCaseOverlap.length > 0) {
    score += Math.min(useCaseOverlap.length * 8, 12)
    reasons.push(`場景匹配：${useCaseOverlap.join(', ')}`)
  }

  // tags 直接文本匹配（每匹配一個 +4，最高 8）
  const tagMatches = template.tags.filter(tag => fullText.includes(tag.toLowerCase()))
  if (tagMatches.length > 0) {
    score += Math.min(tagMatches.length * 4, 8)
    reasons.push(`標籤匹配：${tagMatches.join(', ')}`)
  }

  return score
}

// ============================================================
// Layer 2: Category 匹配（0-30 分）
// ============================================================

function scoreCategory(
  template: DBTemplate,
  inferredCategory: string,
  productType: string,
  reasons: string[]
): number {
  // 完全匹配 category
  if (template.category === inferredCategory) {
    reasons.push(`類型匹配：${inferredCategory}`)
    return 30
  }

  // 近似匹配（如 portfolio ↔ landing 都是展示型）
  const similarCategories: Record<string, string[]> = {
    landing: ['portfolio', 'event'],
    portfolio: ['landing'],
    saas: ['dashboard'],
    dashboard: ['saas'],
    blog: ['content'],
    content: ['blog'],
  }

  if (similarCategories[inferredCategory]?.includes(template.category)) {
    reasons.push(`近似類型：${template.category}`)
    return 15
  }

  return 0
}

// ============================================================
// Layer 3: UISpec 匹配（0-30 分）
// ============================================================

function scoreUISpec(
  template: DBTemplate,
  uiSpec: UIRequirementsSpec,
  reasons: string[]
): number {
  if (!template.component_types.length) return 0

  // 從 UISpec 提取所有元件類型
  const specComponents: string[] = []
  if (uiSpec.pages) {
    for (const page of uiSpec.pages) {
      // 頁面名稱本身
      specComponents.push(page.name.toLowerCase())
      // 從 dataDisplays 提取元件類型（table, chart, cards 等）
      if (page.dataDisplays) {
        specComponents.push(...page.dataDisplays.map(d => d.type.toLowerCase()))
        specComponents.push(...page.dataDisplays.map(d => d.name.toLowerCase()))
      }
      // 從 actions 提取動作類型
      if (page.actions) {
        specComponents.push(...page.actions.map(a => a.name.toLowerCase()))
      }
    }
  }

  if (specComponents.length === 0) return 0

  // 計算 component_types 重疊度
  const overlap = template.component_types.filter(ct =>
    specComponents.some(sc => sc.includes(ct) || ct.includes(sc))
  )

  if (overlap.length === 0) return 0

  const overlapRatio = overlap.length / template.component_types.length
  const score = Math.round(overlapRatio * 30)

  if (score > 0) {
    reasons.push(`元件匹配：${overlap.slice(0, 3).join(', ')}`)
  }

  return score
}

// ============================================================
// 工具函數
// ============================================================

/**
 * 從文本中提取匹配的標籤
 */
function extractMatches(
  text: string,
  keywordMap: Record<string, string[]>
): string[] {
  const matched: string[] = []

  for (const [label, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(k => text.includes(k))) {
      matched.push(label)
    }
  }

  return matched
}
