// ============================================================
// 共用確認語意偵測
// 三層匹配：否定詞排除 → 短詞精確 → 長片語 includes
// ============================================================

/** 轉折/否定詞 — 含任一即非純確認（中 + 英） */
const NEGATION_WORDS = [
  // 中文
  '但', '不過', '可是', '然而', '只是',
  '少了', '缺了', '漏了', '多了', '錯了',
  '想改', '想加', '想刪', '想換', '改一下', '修改', '調整',
  '不對', '不行', '不好', '不是',
]

/** 英文轉折/修改詞 — 用 word boundary regex 匹配（避免 "button" 誤殺） */
const NEGATION_PATTERNS = [
  /\bbut\b/, /\bhowever\b/, /\balthough\b/, /\bexcept\b/,
  /\bmissing\b/, /\bchange\b/, /\bmodify\b/, /\badd\b/, /\bremove\b/, /\bdelete\b/,
  /\bwrong\b/, /\bincorrect\b/, /\bfix\b/, /\bupdate\b/,
]

/** 短詞 — 僅在去標點後 ≤ 6 字元時匹配（防「sure, but add a role」誤判） */
const SHORT_CONFIRMS = [
  // 中文
  '好', '好的', '是', '對', '行', '嗯', '恩',
  // 英文
  'y', 'ok', 'yes', 'yep', 'yea', 'yeah', 'sure', 'fine', 'good', 'great',
]

/** 長片語 — 任意長度訊息 includes 即匹配（中 + 英） */
const LONG_CONFIRMS = [
  // 中文
  '確認', '沒問題', '沒錯', '正確', '可以',
  '是的', '對的', '好的', '沒有問題', '看起來沒問題',
  '就這樣', '繼續',
  // 英文
  'confirm', 'correct', 'no problem', 'no issue', 'looks good', 'lgtm',
  'sounds good', 'all good', 'go ahead', 'proceed', 'perfect',
  'exactly', 'absolutely', 'approved', "that's right", "that's correct",
]

/** 剝除尾部中英文標點 */
function stripPunctuation(s: string): string {
  return s.replace(/[。！？!?，,、.~～…]+$/g, '')
}

/**
 * 判斷用戶訊息是否為「確認」意圖。
 *
 * 策略：
 * 1. 否定詞防護：含轉折/修改詞 → false
 * 2. 短詞精確：去標點後 ≤ 6 字元且完全匹配 → true
 * 3. 長片語 includes：訊息含確認片語 → true
 */
export function isConfirmation(message: string): boolean {
  const trimmed = message.trim()
  if (!trimmed) return false

  const lower = trimmed.toLowerCase()

  // Layer 1: 否定詞排除（中文 includes + 英文 word boundary regex）
  if (NEGATION_WORDS.some(w => lower.includes(w))) {
    return false
  }
  if (NEGATION_PATTERNS.some(re => re.test(lower))) {
    return false
  }

  // Layer 2: 短詞精確匹配（去標點後 ≤ 6 字元，涵蓋 great/yeah 等）
  const stripped = stripPunctuation(lower)
  if (stripped.length <= 6 && SHORT_CONFIRMS.includes(stripped)) {
    return true
  }

  // Layer 3: 長片語 includes
  if (LONG_CONFIRMS.some(phrase => lower.includes(phrase))) {
    return true
  }

  return false
}
