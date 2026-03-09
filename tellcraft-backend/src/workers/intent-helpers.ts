// ============================================================
// Intent Helpers + 常數
// 從 orchestrator.ts 抽出的意圖判斷函數與常數
// ============================================================

import type { FlowState } from '../types/flow-state'
import type { QualityStrictness } from '../services/prefilter'

// PRD Discovery 限制（預設值，實際由 computeDiscoveryLimits 動態調整）
export const PRD_DISCOVERY_LIMITS = {
  MAX_ROUNDS: 10,
  MAX_TOTAL_QUESTIONS: 50,
  QUESTIONS_PER_ROUND: 5,
}

// Design Brief 確認限制
export const DESIGN_BRIEF_LIMITS = {
  MAX_ROUNDS: 3,
}

// Spec Discovery 限制
export const SPEC_DISCOVERY_LIMITS = {
  MAX_ROUNDS: 2,
  MAX_TOTAL_QUESTIONS: 10,
  QUESTIONS_PER_ROUND: 5,
}

// Fast Mode 限制
export const FAST_MODE_MAX_MESSAGE_LENGTH = 1500

// ── 回退映射表：當前 phase → 回退目標 phase ──
export const PHASE_BACKTRACK_MAP: Record<string, string> = {
  'uiux_design_clarify':       'uiux_design_preference',
  'uiux_template_selection':   'uiux_design_preference',
  'uiux_design_brief_confirm': 'uiux_design_preference',
  'uiux_variant_selection':    'uiux_design_brief_confirm',
}

// ── Phase 中文標籤 ──
export const PHASE_LABELS: Record<string, string> = {
  'uiux_design_preference':    '設計偏好選擇',
  'uiux_design_clarify':       '設計問卷',
  'uiux_template_selection':   '模板選擇',
  'uiux_design_brief_confirm': '設計方向確認',
  'uiux_variant_selection':    '方案選擇',
}

// ============================================================
// Meta Intent 模板回覆（零 LLM Token 成本）
// ============================================================

export const META_RESPONSES: Record<string, string> = {
  onboarding: `👋 歡迎使用 Tellcraft！

我可以幫你：
• **設計網站** — 描述你想要的產品，我會引導你完成從構思到上線的全流程
• **部署上線** — 設計完成後一鍵部署到網路

試試看告訴我：「我想做一個餐廳官網」或「幫我設計一個作品集網站」`,

  chitchat: `我是 Tellcraft 的 AI 開發助手，專門幫你把想法變成真正的網站。😊

有什麼產品或網站想法嗎？告訴我你想建立什麼，我們就開始吧！`,

  abuse: `⚠️ 此類訊息無法處理。Tellcraft 專門用於產品開發，請正常使用。

如果您有建站需求，試試：「我想做一個餐廳官網」、「幫我設計一個作品集網站」

持續發送無意義訊息可能會被暫時限制使用。`,

  unknown: `我不太確定您想做什麼。您可以試試：

• 描述想建立的產品：「我想做一個線上課程平台」
• 設計網站介面：「幫我設計一個餐廳官網」
• 部署已完成的專案：「部署上線」`,

  clarification_needed: `我不太確定您想做什麼。您可以試試：

• 描述想建立的產品：「我想做一個線上課程平台」
• 設計網站介面：「幫我設計一個餐廳官網」
• 部署已完成的專案：「部署上線」`,
}

// ============================================================
// 意圖判斷 helper
// ============================================================

export function hasDeployIntent(msg: string): boolean {
  const kw = ['部署', '部屬', 'deploy', '上線', '發布', '再部署', '重新部署']
  const negation = ['不要', '不想', '不用', '別', '不需要', '取消', '先不', '暫時不', "don't", 'dont', 'not', 'cancel', 'no']
  const ex = ['改', '換', '調整', '修改', '更新', '加', '刪', '移除']
  const hasKw = kw.some(k => msg.includes(k))
  if (!hasKw) return false
  if (negation.some(n => msg.includes(n))) return false
  if (ex.some(k => msg.includes(k))) return false
  return true
}

export function hasRejectDeployIntent(msg: string): boolean {
  const deployKw = ['部署', '部屬', 'deploy', '上線', '發布']
  const negation = ['不要', '不想', '不用', '別', '不需要', '先不', '暫時不', "don't", 'dont', 'not yet', 'no']
  return deployKw.some(k => msg.includes(k)) && negation.some(n => msg.includes(n))
}

export function hasRollbackIntent(msg: string): boolean {
  if (msg.includes('還原修改')) return false
  return ['回滾', 'rollback', '回到上一版', '還原'].some(k => msg.includes(k))
}

export function hasUndoIntent(msg: string): boolean {
  return ['撤銷', 'undo', '復原', '上一步', '還原修改'].some(k => msg.includes(k))
}

export function hasGoBackIntent(msg: string): boolean {
  if (msg.includes('返回修改') || msg.includes('回去修改')) return false
  const keywords = ['返回', '回去', '上一步', '重新選擇', '重選', '重來', '回到上一步', 'go back']
  return keywords.some(k => msg.includes(k))
}

export function hasChangeIntent(msg: string): boolean {
  const keywords = ['修改規格', '新增功能', '刪除功能', '變更需求', '調整規格', '改需求', '修改需求', '增加功能', '移除功能', '改規格']
  return keywords.some(k => msg.includes(k))
}

export function hasRollbackSpecIntent(msg: string): boolean {
  const keywords = ['撤銷變更', '回滾規格', '恢復規格', '取消變更', '還原規格']
  return keywords.some(k => msg.includes(k))
}

// ============================================================
// Discovery 限制計算
// ============================================================

export function computeDiscoveryLimits(requirements: string, hasEsDocument?: boolean): { maxRounds: number; maxTotalQuestions: number } {
  const len = requirements.length
  const bulletCount = (requirements.match(/^[\s]*[-•*\d.]+/gm) || []).length
  const featureKeywords = (requirements.match(/功能|模組|頁面|API|角色|報表|通知|權限|流程/g) || []).length

  if (len < 100 && bulletCount < 3 && featureKeywords < 2) {
    return { maxRounds: 3, maxTotalQuestions: 15 }
  }
  if (len < 300 && bulletCount < 5 && featureKeywords < 4) {
    return { maxRounds: 4, maxTotalQuestions: 25 }
  }
  if (len < 800 || (bulletCount < 10 && featureKeywords < 8)) {
    return { maxRounds: 6, maxTotalQuestions: 30 }
  }
  if (hasEsDocument || len >= 1500 || featureKeywords >= 12) {
    return { maxRounds: 8, maxTotalQuestions: 35 }
  }
  return { maxRounds: 6, maxTotalQuestions: 30 }
}

export function getDiscoveryLimits(state: FlowState) {
  return {
    MAX_ROUNDS: state.discoveryLimits?.maxRounds ?? PRD_DISCOVERY_LIMITS.MAX_ROUNDS,
    MAX_TOTAL_QUESTIONS: state.discoveryLimits?.maxTotalQuestions ?? PRD_DISCOVERY_LIMITS.MAX_TOTAL_QUESTIONS,
    QUESTIONS_PER_ROUND: PRD_DISCOVERY_LIMITS.QUESTIONS_PER_ROUND,
  }
}

// ============================================================
// Quality Strictness
// ============================================================

export function getPhaseQualityMessage(phase: string, locale?: 'zh' | 'en'): string | null {
  const isZh = locale !== 'en'
  switch (phase) {
    case 'prd_clarify':
    case 'spec_clarify':
    case 'es_explore':
      return isZh
        ? '請回答問題，或輸入「跳過」跳過這個問題。'
        : 'Please answer the question, or type "skip" to skip.'
    case 'uiux_design_preference':
    case 'uiux_design_clarify':
      return isZh
        ? '請描述您的設計偏好。'
        : 'Please describe your design preference.'
    case 'uiux_design_brief_confirm':
      return isZh
        ? '請確認設計方向，或描述您想調整的地方。'
        : 'Please confirm the design direction, or describe adjustments.'
    default:
      return null
  }
}

export function getPhaseStrictness(phase: string): QualityStrictness | 'skip' {
  switch (phase) {
    case 'prd_clarify':
    case 'spec_clarify':
      return 'strict'
    case 'uiux_design_preference':
    case 'uiux_design_clarify':
    case 'uiux_design_brief_confirm':
      return 'normal'
    case 'uiux_complete':
    case 'deployer_complete':
    case 'deployer_failed':
      return 'lenient'
    default:
      return 'skip'
  }
}

// ============================================================
// isDesignFeedback（僅用於 Fast Mode 入口）
// ============================================================

export interface DesignFeedbackCheck {
  valid: boolean
  rejectReason?: 'gibberish' | 'greeting' | 'chitchat' | 'too_short' | 'abuse'
  guideMessage?: string
}

export function checkFastModeMessageLength(msg: string): {
  valid: boolean
  currentLength: number
  maxLength: number
} {
  const currentLength = msg.trim().length
  return {
    valid: currentLength <= FAST_MODE_MAX_MESSAGE_LENGTH,
    currentLength,
    maxLength: FAST_MODE_MAX_MESSAGE_LENGTH,
  }
}

export function isDesignFeedback(msg: string): DesignFeedbackCheck {
  const trimmed = msg.trim()
  const lower = trimmed.toLowerCase()
  const isChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(trimmed)

  const guide = {
    tooShort: isChinese
      ? '請描述您想要修改的內容，例如：\n- 「把標題改成紅色」\n- 「字體放大一點」\n- 「加一個搜尋功能」'
      : 'Please describe what you\'d like to change, e.g.:\n- "Make the title red"\n- "Increase the font size"\n- "Add a search feature"',
    gibberish: isChinese
      ? '看起來這不是設計修改的描述。請告訴我您想調整什麼，例如：\n- 「把標題改大」\n- 「換一個背景顏色」'
      : 'This doesn\'t look like a design change request. Please tell me what to adjust, e.g.:\n- "Make the title bigger"\n- "Change the background color"',
    greeting: isChinese
      ? '目前設計已完成！如果想要修改，請描述具體調整，例如：\n- 「標題字體換成粗體」\n- 「加一個聯絡表單」\n\n或者您可以選擇「部署上線」。'
      : 'The design is ready! To make changes, describe what to adjust, e.g.:\n- "Make the title bold"\n- "Add a contact form"\n\nOr you can deploy it.',
    chitchat: isChinese
      ? '我是設計助手，目前專注在幫您完善設計。請告訴我需要修改什麼，例如：\n- 「按鈕太小，放大一點」\n- 「整體配色換成藍色系」'
      : 'I\'m your design assistant, focused on refining your design. Please tell me what to change, e.g.:\n- "The buttons are too small"\n- "Switch to a blue color scheme"',
  }

  const designSignals = [
    '改', '換', '加', '刪', '移除', '調整', '修改', '更新', '增加', '替換', '縮小', '放大', '移動', '對齊', '置中', '隱藏', '顯示',
    '顏色', '色', '字體', '字號', '字型', '大小', '尺寸', '間距', '邊距', '圓角', '陰影', '透明', '粗細', '寬', '高',
    '標題', '按鈕', '圖片', '背景', '邊框', '文字', '連結', '導航', '選單', '頁尾', '頁首', '卡片', '表格', '表單', '輸入',
    '風格', '排版', '佈局', '動畫', '效果', '樣式', '響應式', '手機版', '深色', '淺色',
    '功能', '搜尋', '篩選', '分頁', '彈窗', '下拉', '滾動', '切換', '展開', '摺疊',
    '太大', '太小', '太粗', '太細', '太淡', '太深', '太亮', '太暗', '太窄', '太寬', '太擠', '太鬆', '太醜', '太花',
    '跑版', '壞了', '跑掉', '不見了', '消失', '重疊', '遮住', '偏了', '歪了', '沒對齊', '破版',
    '不好看', '不對', '不行', '不夠',
  ]
  const designSignalsEn = [
    'change', 'modify', 'update', 'add', 'remove', 'delete', 'replace', 'move', 'resize', 'align', 'center', 'hide', 'show', 'fix', 'adjust', 'make', 'set', 'swap', 'switch', 'increase', 'decrease', 'enlarge', 'shrink', 'reduce',
    'color', 'colour', 'font', 'size', 'spacing', 'margin', 'padding', 'border', 'radius', 'shadow', 'opacity', 'weight', 'width', 'height', 'gap',
    'header', 'footer', 'button', 'background', 'image', 'icon', 'nav', 'menu', 'title', 'heading', 'text', 'section', 'card', 'table', 'form', 'input', 'link', 'sidebar', 'modal', 'logo', 'banner', 'hero', 'carousel', 'slider', 'dropdown', 'tooltip', 'badge', 'avatar', 'tab', 'accordion', 'breadcrumb', 'pagination', 'dialog', 'popup', 'overlay', 'divider', 'list',
    'style', 'layout', 'animation', 'theme', 'responsive', 'mobile', 'dark mode', 'light mode', 'gradient', 'hover', 'transition', 'grid', 'flex', 'rwd',
    'feature', 'search', 'filter', 'sort', 'scroll', 'toggle', 'expand', 'collapse', 'login', 'signup', 'contact',
    'too big', 'too small', 'too large', 'too wide', 'too narrow', 'too dark', 'too light', 'too bright', 'too thin', 'too thick', 'too bold', 'too cramped', 'too crowded', 'too ugly',
    'broken', 'misaligned', 'overlapping', 'missing', 'disappeared', 'cropped', 'cut off', 'not aligned', 'off-center', 'wrong',
    'bigger', 'smaller', 'larger', 'wider', 'narrower', 'darker', 'lighter', 'brighter', 'bolder', 'thinner',
  ]

  const hasDesignSignal = designSignals.some(k => trimmed.includes(k))
    || designSignalsEn.some(k => lower.includes(k))

  if (trimmed.length <= 2 && !hasDesignSignal) {
    return { valid: false, rejectReason: 'too_short', guideMessage: guide.tooShort }
  }
  if (hasDesignSignal) return { valid: true }
  if (/^\d+$/.test(trimmed)) return { valid: false, rejectReason: 'gibberish', guideMessage: guide.gibberish }
  if (/^[^\w\u4e00-\u9fff\u3400-\u4dbf]+$/.test(trimmed)) return { valid: false, rejectReason: 'gibberish', guideMessage: guide.gibberish }
  if (/^(.)\1{2,}$/.test(trimmed)) return { valid: false, rejectReason: 'gibberish', guideMessage: guide.gibberish }
  if (/^[a-zA-Z]{4,}$/.test(trimmed) && !/[aeiouAEIOU]/.test(trimmed)) return { valid: false, rejectReason: 'gibberish', guideMessage: guide.gibberish }

  const greetings = [
    /^(嗨|你好|哈囉|嘿)$/, /^(好|好的|收到|了解|知道了|嗯|喔|哦|是的|對|沒問題)$/, /^(謝謝|感謝|3q)$/,
    /^(hello|hi|hey|yo|sup|howdy)$/i, /^(ok|okay|sure|yep|yup|yeah|yes|no|nope|nah|alright|right|got it|noted|understood|roger)$/i,
    /^(thanks|thank you|thx|ty|cheers)$/i, /^(nice|cool|great|awesome|good|perfect|sweet|neat|wonderful|amazing|excellent|fantastic|brilliant|lovely|wow)$/i,
    /^(lol|lmao|rofl|heh|hehe|haha|hahaha|lmfao)$/i,
  ]
  if (greetings.some(r => r.test(trimmed))) return { valid: false, rejectReason: 'greeting', guideMessage: guide.greeting }

  const chitchatZh = ['天氣', '幾點', '你是誰', '你叫什麼', '講笑話', '說笑話', '幾歲', '吃什麼', '吃飯', '早安', '午安', '晚安', '掰掰', '再見', '無聊', '好無聊', '你好嗎', '在嗎', '在不在']
  const chitchatEn = ['weather', 'what time', 'who are you', 'what are you', 'tell me a joke', 'tell a joke', 'how old', "what's your name", 'good morning', 'good afternoon', 'good evening', 'good night', 'goodbye', 'bye bye', 'see you', 'see ya', 'take care', "i'm bored", 'bored', 'how are you', "what's up", 'wassup', 'sup', 'are you there', 'anyone there', 'can you hear me', 'testing', 'what can you do', 'help me', 'who made you']
  if (
    chitchatZh.some(k => trimmed.includes(k)) || chitchatEn.some(k => lower.includes(k))
    || /^[哈呵嘻哼嗯啊喔]{2,}$/.test(trimmed) || /^(ha){2,}h?$/i.test(trimmed) || /^bye$/i.test(trimmed)
  ) {
    return { valid: false, rejectReason: 'chitchat', guideMessage: guide.chitchat }
  }

  if (trimmed.length >= 8) return { valid: true }
  return { valid: true }
}
