/**
 * Design Clarify — 動態軸線追蹤（T2）
 *
 * 既有 Path A 是固定 4 步問答（feeling → reference → color → layout）。
 * 當用戶第 1 步就把 4 個軸都答完，後 3 步顯得 AI 沒在聽。
 *
 * 本模組純函數提供軸線涵蓋偵測 + 下一步決策，由 phase handler 呼叫。
 */

export type ClarifyAxis = 'feeling' | 'reference' | 'color' | 'layout'

export const CLARIFY_AXES: ClarifyAxis[] = ['feeling', 'reference', 'color', 'layout']

interface AxisDetector {
  axis: ClarifyAxis
  patterns: RegExp[]
}

// 各軸線的偵測 pattern。寬鬆但不貪心 — 寧可漏報讓系統多問，不要誤報跳過用戶想表達的軸線。
const AXIS_DETECTORS: AxisDetector[] = [
  {
    axis: 'feeling',
    patterns: [
      // 形容詞型：專業/活潑/簡約/溫暖/輕鬆/嚴肅/...
      /專業|可靠|活潑|有趣|簡約|現代|溫暖|親切|輕鬆|嚴肅|冷靜|可愛|大膽|低調|奢華|質感|科技|未來/,
      /\b(professional|playful|minimal|modern|warm|friendly|serious|elegant|luxury|bold|clean|fresh|calm|trustworthy|innovative|sleek|sophisticated|cozy)\b/i,
    ],
  },
  {
    axis: 'reference',
    patterns: [
      // URL（http/https/明顯網域）
      /https?:\/\/\S+/i,
      /\b[\w-]+\.(com|app|io|co|dev|net|org|tw|jp|uk|de|fr)\b/i,
      // 知名品牌/產品名（中英）
      /(notion|stripe|linear|vercel|airbnb|figma|apple|google|netflix|spotify|amazon|tesla|github|slack|discord|shopify|squarespace|webflow|wix|framer|ramp|arc|cron|raycast)/i,
      /(蘋果|谷歌|臉書|推特|微軟|小米|淘寶|京東|蝦皮|momo|樂天|誠品|博客來)/,
      // 「像 X」「參考 Y」「類似 Z」明示語
      /(?:像|類似|參考|仿照|模仿|借鏡|like|similar to|inspired by|reference)\s*[\w一-鿿]{2,}/i,
    ],
  },
  {
    axis: 'color',
    patterns: [
      // 中文色彩詞
      /(藍|綠|紅|紫|黃|橙|粉|黑|白|灰|金|銀|棕|米|青|靛)色?(?:系|調)?/,
      // 英文色彩詞
      /\b(blue|red|green|purple|violet|yellow|orange|pink|black|white|gray|grey|gold|silver|brown|beige|navy|teal|cyan|magenta|warm|cool|dark|light|pastel|monochrome|colorful)\b/i,
      // hex code
      /#[0-9a-f]{3}(?:[0-9a-f]{3})?\b/i,
      // 「色調 / 配色 / 主色 / 暖色 / 冷色」
      /色調|配色|主色|品牌色|色板|暖色|冷色|單色/,
    ],
  },
  {
    axis: 'layout',
    patterns: [
      // 中文佈局詞
      /(簡潔|留白|密集|寬鬆|擁擠|對稱|不對稱|滿版|全屏|沉浸)/,
      /(卡片式|列表式|網格|grid|表格|時間軸|時間線|分割|分欄|兩欄|三欄|單欄|sidebar|側邊欄|頂部導航|漢堡選單|hero)/i,
      /佈局|排版|版面|結構/,
      // 英文佈局詞
      /\b(card|list|grid|table|timeline|split|column|sidebar|hero|fullscreen|spacious|compact|dense|asymmetric|symmetric)\b/i,
    ],
  },
]

/**
 * 從一段文字偵測涵蓋了哪些軸線。
 * 寬鬆策略：任一 pattern 命中即視為涵蓋。
 */
export function extractCoveredAxes(text: string): Set<ClarifyAxis> {
  const covered = new Set<ClarifyAxis>()
  if (!text || text.trim().length < 2) return covered

  for (const detector of AXIS_DETECTORS) {
    if (detector.patterns.some(p => p.test(text))) {
      covered.add(detector.axis)
    }
  }
  return covered
}

/**
 * 結合「明確回答的軸線」+「文字偵測涵蓋」算出總涵蓋集。
 *
 * 明確回答：ideas[].step 等於 axis key 且答案非空 → 視為涵蓋
 * 文字偵測：所有 answer 串接後跑 extractCoveredAxes
 */
export function getCoveredAxes(
  ideas: Array<{ step: string; answer: string }>,
): Set<ClarifyAxis> {
  const covered = new Set<ClarifyAxis>()

  // 1. 明確標記為某軸的回答（即使內容模糊也算回答過）
  for (const idea of ideas) {
    if (CLARIFY_AXES.includes(idea.step as ClarifyAxis) && idea.answer.trim().length >= 2) {
      covered.add(idea.step as ClarifyAxis)
    }
  }

  // 2. 文字偵測（initial / feeling / 其他都會被掃）
  const allText = ideas.map(i => i.answer).join(' ')
  for (const axis of extractCoveredAxes(allText)) {
    covered.add(axis)
  }

  return covered
}

/**
 * 給定 ideas（含每個 idea 的 step + answer），回傳下一個應該問的軸線。
 * 全部已涵蓋 → null（呼叫端應進入 completeDesignClarify 或補充追問）。
 */
export function pickNextClarifyAxis(
  ideas: Array<{ step: string; answer: string }>,
): ClarifyAxis | null {
  const covered = getCoveredAxes(ideas)
  for (const axis of CLARIFY_AXES) {
    if (!covered.has(axis)) return axis
  }
  return null
}

// ============================================================
// 補充追問池（power user 給的初始描述很完整時，給 1-2 個深度追問）
// ============================================================

interface SupplementaryQuestion {
  key: string
  question: string
  hint: string
}

const SUPPLEMENTARY_POOL: SupplementaryQuestion[] = [
  {
    key: 'brand_personality',
    question: '這個產品讓你想到哪個品牌的風格？',
    hint: '例如：像 Linear 那樣冷靜精準、像 Notion 那樣親切實用、像 Apple 那樣極簡優雅...',
  },
  {
    key: 'usage_context',
    question: '主要使用情境是行動裝置還是桌面為主？',
    hint: '例如：用戶大多在通勤滑手機、辦公室專心使用桌機、公司平板巡檢...',
  },
  {
    key: 'core_emphasis',
    question: '視覺上你更想強調品牌個性，還是功能效率？',
    hint: '個性 = 表現力強、有記憶點；效率 = 直接、可掃讀、不裝飾',
  },
  {
    key: 'audience',
    question: '主要使用者是誰？他們對美感的期待是什麼？',
    hint: '例如：B2B 採購主管偏好穩重；年輕設計師期待新鮮；長輩需要清楚易讀...',
  },
  {
    key: 'mood_avoid',
    question: '有沒有什麼風格是你絕對不想要的？',
    hint: '例如：不要太陽春、不要紫色漸層、不要 cyber 那種、不要太可愛...',
  },
  {
    key: 'first_screen',
    question: '用戶第一眼打開時，最希望他注意到什麼？',
    hint: '例如：產品 demo 影片、清楚的價格、信任感（客戶 logo）、有趣的標語...',
  },
  {
    key: 'differentiator',
    question: '同類產品裡你最不想被誤認成誰？',
    hint: '例如：「不要像一般 SaaS 那樣冰冷」「不要看起來像中國電商」「不要像作品集模板」',
  },
  {
    key: 'density',
    question: '你期待用戶停留多久？頁面節奏應該快還是慢？',
    hint: '快 = 一目了然、快速決策；慢 = 引導探索、有故事感',
  },
  {
    key: 'typography',
    question: '對字體有偏好嗎？',
    hint: '例如：襯線更有質感、無襯線更現代、等寬字偏技術感、手寫字偏溫暖...',
  },
  {
    key: 'must_have',
    question: '有沒有什麼設計元素是「一定要有」的？',
    hint: '例如：必須有暗色模式、必須有大圖 hero、必須留出 logo 區、必須能放展示影片...',
  },
]

/**
 * 從補充池抽 1 個追問。
 * - 排除 ideas 已含的 key
 * - deterministic by ideas 數量（同樣 ideas 抽到同一題，避免來回問）
 */
export function pickSupplementaryQuestion(
  ideas: Array<{ step: string; answer: string }>,
): SupplementaryQuestion | null {
  const seen = new Set(ideas.map(i => i.step))
  const candidates = SUPPLEMENTARY_POOL.filter(q => !seen.has(q.key))
  if (candidates.length === 0) return null
  // deterministic：用 ideas 數量做 index，避免重複抽到同一題
  const idx = Math.min(ideas.length, candidates.length - 1)
  return candidates[idx]
}

/**
 * 是否該觸發補充追問。
 * 規則：4 軸都已涵蓋 + ideas.length <= 1（user 用一句話回答了所有事）
 *      → 給 1 個深度追問補抓細節
 */
export function shouldAskSupplementary(
  ideas: Array<{ step: string; answer: string }>,
): boolean {
  if (ideas.length > 1) return false
  if (ideas.length === 0) return false
  const covered = getCoveredAxes(ideas)
  return CLARIFY_AXES.every(a => covered.has(a))
}

export type { SupplementaryQuestion }
