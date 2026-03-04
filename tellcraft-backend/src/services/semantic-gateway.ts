// ============================================================
// 統一 Sonnet 語義閘門
// 取代 analyzeAnswerRelevance() + validateDesignAnswer()
// 用 Sonnet 語義理解取代填鴨式 keyword arrays
// ============================================================

import * as db from '../db/client'
import type { FlowState } from '../types/flow-state'

// ── 型別定義 ──

export type SemanticVerdict =
  | 'valid' | 'ambiguous' | 'off_topic'
  | 'seeking_help' | 'evasive' | 'content_policy'

export interface SemanticGatewayInput {
  phase: 'bdd_clarify' | 'design_clarify' | 'iteration'
  userMessage: string
  question?: string               // BDD: 當前問題文字
  questionOptions?: string         // BDD: 格式化後的選項列表
  designQuestion?: { key: string; question: string; hint: string }  // Design: 當前設計問題
  conversationId: string
  userId?: string
  locale?: 'zh' | 'en'
}

export interface SemanticGatewayResult {
  verdict: SemanticVerdict
  accept: boolean
  guidanceMessage?: string        // Sonnet 直接生成（非 valid 時）
}

// ── 核心逃避信號（極小集，只覆蓋零容忍的硬逃避）──
const CORE_EVASIVE = [
  '不要管', '別管', '不關你', '管好你', '不想說', '不想回答', '不告訴',
  'none of your business', 'leave me alone', 'go away',
]

// ── 實質內容檢測 ──

function hasSubstantiveContent(text: string): boolean {
  // 純數字 + 符號（如 "0.0.0.0.0.0", "123456", "!@#$%"）
  if (/^[\d\s.!?,;:@#$%^&*()_+=\-[\]{}|\\/<>~`'"…。，！？、；：「」『』（）【】]+$/.test(text)) return false

  // 重複子模式（如 "0.0.0.0", "哈哈哈哈", "AAABBBCCC"）
  // 提取去除標點/空格的核心部分
  const core = text.replace(/[\s.,!?;:。，！？、；：]+/g, '')
  if (core.length >= 3) {
    for (let patLen = 1; patLen <= 4; patLen++) {
      if (core.length < patLen * 3) continue
      const pat = core.slice(0, patLen)
      const repeated = pat.repeat(Math.ceil(core.length / patLen)).slice(0, core.length)
      if (repeated === core) return false
    }
  }

  // 純拉丁字母無母音且不在白名單（如 "BBBCCCAAA" 的字母部分 — 但 "BBBCCCAAA" 有母音 A，所以要更嚴格）
  const latinPart = text.replace(/[^a-zA-Z]/g, '')
  if (latinPart.length >= 4) {
    // unique chars ratio 過低 → 重複填充（如 "BBBCCCAAA" unique=3, ratio=3/9=0.33）
    const uniqueChars = new Set(latinPart.toLowerCase()).size
    if (uniqueChars / latinPart.length < 0.4) return false
  }

  // 至少包含中文字或英文單詞
  const hasChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text)
  const hasEnglishWords = text.split(/\s+/).filter(w => /^[a-zA-Z]{2,}$/.test(w)).length >= 1
  return hasChinese || hasEnglishWords
}

// ── 零 LLM 短路 ──

function quickFilter(input: SemanticGatewayInput): SemanticGatewayResult | null {
  const trimmed = input.userMessage.trim()
  const lower = trimmed.toLowerCase()

  // __skip__ → 放行
  if (trimmed === '__skip__') return { verdict: 'valid', accept: true }

  // 硬逃避信號 → 送 Sonnet 生成引導訊息
  if (CORE_EVASIVE.some(s => lower.includes(s))) return null

  // BDD 選項回答 A-D（完整匹配，如 "A" "B." "c"）→ 放行
  if (input.phase === 'bdd_clarify' && /^[A-Da-d]\.?\s*$/.test(trimmed)) {
    return { verdict: 'valid', accept: true }
  }

  // BDD 釐清：先用 hasSubstantiveContent 過濾明顯垃圾，其餘送 Sonnet
  if (input.phase === 'bdd_clarify') {
    if (!hasSubstantiveContent(trimmed)) {
      const isZh = input.locale !== 'en'
      return {
        verdict: 'off_topic',
        accept: false,
        guidanceMessage: isZh
          ? '請輸入有意義的文字來回答問題。'
          : 'Please provide a meaningful answer to the question.',
      }
    }
    // 廢話文（結構正確中文但零實質）只有 LLM 能判斷
    return null
  }

  // ── Iteration（迭代修改）──
  if (input.phase === 'iteration') {
    // 設計關鍵詞（從 isDesignFeedback 精簡移植）→ accept（零 LLM）
    const ITER_DESIGN_SIGNALS_ZH = [
      '改', '換', '加', '刪', '移除', '調整', '修改', '更新', '增加', '替換', '縮小', '放大',
      '顏色', '色', '字體', '大小', '間距', '圓角', '陰影', '透明', '粗細',
      '標題', '按鈕', '圖片', '背景', '邊框', '文字', '連結', '導航', '選單', '卡片', '表格', '表單',
      '風格', '排版', '佈局', '動畫', '樣式', '響應式', '手機版', '深色', '淺色',
      '功能', '搜尋', '篩選', '彈窗', '下拉', '滾動', '切換',
      '太大', '太小', '太粗', '太細', '太淡', '太深', '太亮', '太暗', '太窄', '太寬', '太醜',
      '跑版', '壞了', '不見了', '消失', '重疊', '偏了', '不好看', '不對', '不行', '不夠',
    ]
    const ITER_DESIGN_SIGNALS_EN = [
      'change', 'modify', 'update', 'add', 'remove', 'delete', 'replace', 'move', 'resize', 'align',
      'color', 'colour', 'font', 'size', 'spacing', 'margin', 'padding', 'border', 'radius', 'shadow',
      'header', 'footer', 'button', 'background', 'image', 'icon', 'nav', 'menu', 'title', 'text', 'card', 'form',
      'style', 'layout', 'animation', 'theme', 'responsive', 'mobile', 'dark mode', 'gradient', 'hover',
      'feature', 'search', 'filter', 'scroll', 'toggle',
      'too big', 'too small', 'too dark', 'too light', 'too narrow', 'too wide', 'too ugly',
      'broken', 'misaligned', 'overlapping', 'missing', 'wrong',
      'bigger', 'smaller', 'larger', 'wider', 'darker', 'lighter', 'bolder',
      'make', 'set', 'fix', 'adjust', 'increase', 'decrease',
    ]
    const hasDesignKw = ITER_DESIGN_SIGNALS_ZH.some(k => trimmed.includes(k))
      || ITER_DESIGN_SIGNALS_EN.some(k => lower.includes(k))
    if (hasDesignKw) return { verdict: 'valid', accept: true }

    // 無實質內容 → 零 LLM reject
    if (!hasSubstantiveContent(trimmed)) {
      const isZh = input.locale !== 'en'
      return {
        verdict: 'off_topic',
        accept: false,
        guidanceMessage: isZh
          ? '請描述您想要修改的內容，例如：「把標題改成紅色」「字體放大一點」「加一個搜尋功能」'
          : 'Please describe what you\'d like to change, e.g. "Make the title red", "Increase font size", "Add a search feature"',
      }
    }

    // ≥8 字 + 有實質內容 → accept（零 LLM）
    if (trimmed.length >= 8) return { verdict: 'valid', accept: true }

    // 3-7 字無設計關鍵詞 → 送 Sonnet（模糊地帶）
    return null
  }

  // ── 以下只有 Design clarify ──

  // URL → 放行（設計參考常提供網址）
  if (/https?:\/\/\S+/.test(trimmed)) {
    return { verdict: 'valid', accept: true }
  }

  // 中文答案 ≥2 字即可（中文一字一詞，如「黑白」「簡潔」「暖色」）
  const hasChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(trimmed)
  if (hasChinese && trimmed.length >= 2) {
    return { verdict: 'valid', accept: true }
  }

  // 有實質內容的長回答 → 放行
  if (trimmed.length >= 20 && !trimmed.includes('?') && !trimmed.includes('？') && hasSubstantiveContent(trimmed)) {
    return { verdict: 'valid', accept: true }
  }

  // Design 問卷：≥5 字 + 有實質內容 → 放行
  if (trimmed.length >= 5 && hasSubstantiveContent(trimmed)) {
    return { verdict: 'valid', accept: true }
  }

  return null  // → 送 Sonnet
}

// ── Sonnet 語義判斷 ──

function buildPrompt(input: SemanticGatewayInput): string {
  const lang = input.locale === 'en' ? 'English' : '繁體中文'

  const phaseContext = input.phase === 'bdd_clarify'
    ? `你在 BDD 需求釐清階段。用戶正在回答軟體需求的釐清問題。
當前問題：${input.question || '（未提供）'}
${input.questionOptions ? `選項：\n${input.questionOptions}` : ''}`
    : input.phase === 'iteration'
    ? `你在 UI/UX 迭代修改階段。用戶正在對已生成的網頁設計提出修改意見。
判斷標準：「設計師看到這句話，能不能直接執行？」`
    : `你在 UI/UX 設計問卷階段。用戶正在回答設計偏好問題。
當前問題：${input.designQuestion?.question || '（未提供）'}
提示：${input.designQuestion?.hint || '（未提供）'}`

  const strictnessNote = input.phase === 'bdd_clarify'
    ? `- BDD 釐清需要明確回答。「看情況」「都可以」是 ambiguous。
- 有條件的回答（如「如果...就...」）也是 ambiguous，需要用戶給出明確選擇。
- 注意「廢話文」：大量引經據典、哲學格言、但不包含任何具體的需求描述或決策。如果回答中充滿「不能不說非常重大」「深深地想到」「浮想聯翩」這類空洞措辭卻沒有實質回答問題，判定為 off_topic。
- 回答必須包含跟問題相關的具體信息（如：功能選擇、數量、規則、流程等），不是「看起來很長但什麼都沒說」。`
    : input.phase === 'iteration'
    ? `- valid：有明確修改方向的回饋（「字大一點」「換個顏色」「加搜尋功能」「把 header 改成固定」）
- ambiguous：方向不明，無法直接執行（「改好一點」「變漂亮」「再改改」— 哪裡？怎麼改？）
- off_topic：與網頁設計無關（「幫我寫 Java」「今天天氣」「算數學」）
- seeking_help / evasive：「你好」「謝謝」「ok」「怎麼改」這類非修改指令`
    : `- 設計問卷容忍更寬鬆。「都可以」「簡約就好」在這裡是 valid。
- 只要回答跟設計/風格/顏色/感覺有關，就是 valid。
- 極短但有設計含義的詞（如「暗色」「圓角」「Apple 風」）也是 valid。`

  return `你是輸入品質閘門。判斷用戶的回答在當前語境下是否有效。

${phaseContext}

## 判斷規則

${strictnessNote}

- 用戶在求助/不理解問題 → seeking_help
- 用戶逃避/拒絕回答/敷衍（如「隨便」「你決定」「算了」）→ evasive
- 用戶完全離題（跟問題無關的內容）→ off_topic
- 用戶回答含糊不清、有條件、無法作為設計/開發依據 → ambiguous
- 涉及違法/色情/仇恨/隱私 → content_policy
- 用戶的回答明確且可作為下一步依據 → valid

## 回覆格式

只回覆 JSON（不要加其他文字）：
- valid：{"verdict":"valid"}
- 其他：{"verdict":"<type>","guidance":"用 ${lang} 寫的引導訊息，一到兩句話，溫和友善，幫助用戶回答這個問題"}

guidance 的規則：
- seeking_help：用更簡單的語言重新解釋問題
- ambiguous：追問用戶，要求更具體的回答
- evasive：溫和鼓勵，說明為什麼需要這個資訊
- off_topic：引導回到當前問題
- content_policy：禮貌拒絕，說明無法處理此類內容`
}

export async function semanticGateway(
  input: SemanticGatewayInput,
  state: FlowState,
): Promise<SemanticGatewayResult> {
  // ── 零 LLM 短路 ──
  const quick = quickFilter(input)
  if (quick) return quick

  // ── Anti-loop：連續被拒 N 次 → 強制 accept ──
  const rejectCount = state.semanticRejectCount || 0
  const antiLoopThreshold = input.phase === 'iteration' ? 2 : 3
  if (rejectCount >= antiLoopThreshold) {
    return { verdict: 'valid', accept: true }
  }

  // ── Sonnet 語義判斷 ──
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { verdict: 'valid', accept: true }
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6-20250514',
        max_tokens: 200,
        system: buildPrompt(input),
        messages: [{ role: 'user', content: input.userMessage }],
      }),
    })

    if (!resp.ok) {
      console.warn(`[SemanticGateway] Sonnet API 錯誤 ${resp.status}，降級拒絕`)
      const isZh = input.locale !== 'en'
      return {
        verdict: 'off_topic',
        accept: false,
        guidanceMessage: isZh
          ? '系統暫時無法處理您的回答，請再輸入一次。'
          : 'System temporarily unavailable. Please try again.',
      }
    }

    const data = await resp.json() as {
      content?: Array<{ text?: string }>
      usage?: { input_tokens?: number; output_tokens?: number }
    }

    // 記錄 LLM 使用量
    if (data.usage) {
      const inputTokens = data.usage.input_tokens || 0
      const outputTokens = data.usage.output_tokens || 0
      const cost = (inputTokens * 3 + outputTokens * 15) / 1_000_000
      db.recordLlmUsage({
        model: 'claude-sonnet-4-6-20250514',
        inputTokens,
        outputTokens,
        costUsd: cost,
        purpose: 'semantic_gateway',
        conversationId: input.conversationId,
      }).catch(err => console.error('[SemanticGateway] 記錄使用量失敗:', err))
    }

    const text = data.content?.[0]?.text?.trim()
    if (!text) {
      console.warn('[SemanticGateway] 空回應，降級拒絕')
      const isZh = input.locale !== 'en'
      return {
        verdict: 'off_topic',
        accept: false,
        guidanceMessage: isZh
          ? '系統暫時無法處理您的回答，請再輸入一次。'
          : 'System temporarily unavailable. Please try again.',
      }
    }

    // 解析 JSON（容許 markdown code block 包裹）
    const jsonStr = text.replace(/^```json?\s*/, '').replace(/\s*```$/, '')
    const result = JSON.parse(jsonStr) as {
      verdict?: SemanticVerdict
      guidance?: string
    }

    if (!result.verdict || result.verdict === 'valid') {
      return { verdict: 'valid', accept: true }
    }

    return {
      verdict: result.verdict,
      accept: false,
      guidanceMessage: result.guidance,
    }
  } catch (err) {
    console.warn('[SemanticGateway] 分析失敗，降級拒絕:', err)
    const isZh = input.locale !== 'en'
    return {
      verdict: 'off_topic',
      accept: false,
      guidanceMessage: isZh
        ? '系統暫時無法處理您的回答，請再輸入一次。'
        : 'System temporarily unavailable. Please try again.',
    }
  }
}
