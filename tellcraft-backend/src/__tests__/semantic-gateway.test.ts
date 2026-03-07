import { describe, it, expect } from 'vitest'
import {
  quickFilter,
  hasSubstantiveContent,
  checkQuestionAnswerRelevance,
  type SemanticGatewayInput,
} from '../services/semantic-gateway'

// Helper：建立 quickFilter 輸入
function makeInput(overrides: Partial<SemanticGatewayInput>): SemanticGatewayInput {
  return {
    phase: 'bdd_clarify',
    userMessage: '',
    conversationId: 'test-conv-1',
    locale: 'zh',
    ...overrides,
  }
}

// ============================================================
// BDD clarify 選項匹配
// ============================================================

describe('quickFilter: BDD clarify 選項匹配', () => {
  const questionOptions = 'A. 信用卡\nB. 超商付款\nC. 銀行轉帳'

  it('單選 A → accept', () => {
    const result = quickFilter(makeInput({
      userMessage: 'A',
      questionOptions,
    }))
    expect(result?.accept).toBe(true)
  })

  it('多選 A+B → accept', () => {
    const result = quickFilter(makeInput({
      userMessage: 'A+B',
      questionOptions,
    }))
    expect(result?.accept).toBe(true)
  })

  it('中文連接 A和C → accept', () => {
    const result = quickFilter(makeInput({
      userMessage: 'A和C',
      questionOptions,
    }))
    expect(result?.accept).toBe(true)
  })

  it('小寫 a → accept', () => {
    const result = quickFilter(makeInput({
      userMessage: 'a',
      questionOptions,
    }))
    expect(result?.accept).toBe(true)
  })

  it('不存在的選項 D → reject', () => {
    const result = quickFilter(makeInput({
      userMessage: 'D',
      questionOptions,
    }))
    expect(result?.accept).toBe(false)
    expect(result?.guidanceMessage).toContain('不存在')
  })

  it('部分不存在 A和D → reject', () => {
    const result = quickFilter(makeInput({
      userMessage: 'A和D',
      questionOptions,
    }))
    expect(result?.accept).toBe(false)
  })
})

// ============================================================
// BDD clarify 中文 ≥2 字
// ============================================================

describe('quickFilter: BDD clarify 中文放行', () => {
  it('中文 ≥2 字有實質 → accept', () => {
    const result = quickFilter(makeInput({
      userMessage: '需要登入功能',
    }))
    expect(result?.accept).toBe(true)
  })

  it('中文 2 字 → accept', () => {
    const result = quickFilter(makeInput({
      userMessage: '可以',
    }))
    expect(result?.accept).toBe(true)
  })

  it('中文 1 字 → null（送 Sonnet）或 reject', () => {
    const result = quickFilter(makeInput({
      userMessage: '好',
    }))
    // 1 字中文沒有特殊放行路徑，走到最後 return null 或被 hasSubstantiveContent 攔截
    // 「好」含中文但 length=1 < 2，走不到 ≥2 字放行；length=1 < 5 走不到英文路徑；最後 return null
    expect(result).toBeNull()
  })

  it('帶問題上下文的中文回答 → 檢查相關性', () => {
    const result = quickFilter(makeInput({
      userMessage: '需要三種付款方式',
      question: '需要支援哪些付款方式？',
    }))
    expect(result?.accept).toBe(true)
  })

  it('evasive 中文（隨便）帶問題 → null（送 Sonnet）', () => {
    const result = quickFilter(makeInput({
      userMessage: '隨便都可以',
      question: '需要支援哪些付款方式？',
    }))
    // 「隨便」「都可以」是 BDD_EVASIVE_SIGNALS → checkQuestionAnswerRelevance 返回 evasive → null
    expect(result).toBeNull()
  })
})

// ============================================================
// BDD clarify 垃圾輸入
// ============================================================

describe('quickFilter: BDD clarify 垃圾拒絕', () => {
  it('純數字 → reject', () => {
    const result = quickFilter(makeInput({
      userMessage: '12345',
    }))
    expect(result?.accept).toBe(false)
  })

  it('重複字元（非選項字母）→ reject', () => {
    // 'aaaa' 會被選項匹配（a ∈ [A-Da-d]），改用非選項字母
    const result = quickFilter(makeInput({
      userMessage: 'xxxx',
    }))
    expect(result?.accept).toBe(false)
  })

  it('純符號 → reject', () => {
    const result = quickFilter(makeInput({
      userMessage: '!@#$%',
    }))
    expect(result?.accept).toBe(false)
  })

  it('__skip__ → accept', () => {
    const result = quickFilter(makeInput({
      userMessage: '__skip__',
    }))
    expect(result?.accept).toBe(true)
  })

  it('硬逃避（不要管）→ null（送 Sonnet 生成引導訊息）', () => {
    const result = quickFilter(makeInput({
      userMessage: '不要管這個',
    }))
    expect(result).toBeNull()
  })
})

// ============================================================
// Iteration 設計關鍵詞
// ============================================================

describe('quickFilter: Iteration 設計關鍵詞', () => {
  it.each([
    '改一下顏色',
    '把標題放大',
    '換個背景',
    '加搜尋功能',
    '按鈕太小',
    '跑版了',
    '不好看',
    'change the font size',
    'make the header bigger',
    'add a search feature',
    'fix the broken layout',
    'too dark',
  ])('設計關鍵詞應該 accept: "%s"', (msg) => {
    const result = quickFilter(makeInput({
      phase: 'iteration',
      userMessage: msg,
    }))
    expect(result?.accept).toBe(true)
  })

  it('無實質內容 → reject', () => {
    const result = quickFilter(makeInput({
      phase: 'iteration',
      userMessage: '12345',
    }))
    expect(result?.accept).toBe(false)
  })

  it('≥8 字有實質但無設計關鍵詞 → accept', () => {
    const result = quickFilter(makeInput({
      phase: 'iteration',
      userMessage: '這個網站的整體感覺需要調整',
    }))
    // 「調整」是設計關鍵詞
    expect(result?.accept).toBe(true)
  })

  it('≥8 字有實質 → accept（零 LLM）', () => {
    const result = quickFilter(makeInput({
      phase: 'iteration',
      userMessage: 'looks ok', // 8 字（含空格）→ ≥8 放行
    }))
    // 'looks ok' 正好 8 字，有實質 → accept
    expect(result?.accept).toBe(true)
  })

  it('3-7 字無設計關鍵詞 → null（送 Sonnet）', () => {
    const result = quickFilter(makeInput({
      phase: 'iteration',
      userMessage: 'not bad',  // 7 字 < 8
    }))
    expect(result).toBeNull()
  })
})

// ============================================================
// Design clarify
// ============================================================

describe('quickFilter: Design clarify', () => {
  it('URL → accept', () => {
    const result = quickFilter(makeInput({
      phase: 'design_clarify',
      userMessage: 'https://dribbble.com/shots/12345',
    }))
    expect(result?.accept).toBe(true)
  })

  it('中文 ≥2 字 → accept', () => {
    const result = quickFilter(makeInput({
      phase: 'design_clarify',
      userMessage: '暗色',
    }))
    expect(result?.accept).toBe(true)
  })

  it('英文 ≥5 字有實質 → accept', () => {
    const result = quickFilter(makeInput({
      phase: 'design_clarify',
      userMessage: 'clean minimal design',
    }))
    expect(result?.accept).toBe(true)
  })

  it('極短英文 → null（送 Sonnet）', () => {
    const result = quickFilter(makeInput({
      phase: 'design_clarify',
      userMessage: 'yes',
    }))
    // 3 字英文 < 5 且 < 20，沒有中文 → null
    expect(result).toBeNull()
  })
})

// ============================================================
// hasSubstantiveContent
// ============================================================

describe('hasSubstantiveContent', () => {
  it('純數字 → false', () => {
    expect(hasSubstantiveContent('123456')).toBe(false)
  })

  it('純符號 → false', () => {
    expect(hasSubstantiveContent('!@#$%^&*()')).toBe(false)
  })

  it('重複模式 0.0.0.0 → false', () => {
    expect(hasSubstantiveContent('0.0.0.0.0.0')).toBe(false)
  })

  it('重複字元 aaaa → false', () => {
    expect(hasSubstantiveContent('aaaa')).toBe(false)
  })

  it('重複 2 字模式 abababab → false', () => {
    expect(hasSubstantiveContent('abababab')).toBe(false)
  })

  it('低 unique ratio 拉丁字母 BBBCCCAAA → false', () => {
    expect(hasSubstantiveContent('BBBCCCAAA')).toBe(false)
  })

  it('中文 → true', () => {
    expect(hasSubstantiveContent('你好')).toBe(true)
  })

  it('英文單詞 → true', () => {
    expect(hasSubstantiveContent('hello world')).toBe(true)
  })

  it('混合中英文 → true', () => {
    expect(hasSubstantiveContent('需要 login 功能')).toBe(true)
  })

  it('純 emoji → false（無中文也無英文單詞）', () => {
    // emoji 不含 CJK 或 latin words
    expect(hasSubstantiveContent('😀😀😀')).toBe(false)
  })

  it('空字串 → false', () => {
    expect(hasSubstantiveContent('')).toBe(false)
  })
})

// ============================================================
// checkQuestionAnswerRelevance
// ============================================================

describe('checkQuestionAnswerRelevance', () => {
  it('無問題上下文 → unknown', () => {
    expect(checkQuestionAnswerRelevance('任何回答', undefined)).toBe('unknown')
  })

  it('evasive 信號 → evasive', () => {
    expect(checkQuestionAnswerRelevance('隨便都可以', '需要幾種付款方式？')).toBe('evasive')
    expect(checkQuestionAnswerRelevance('whatever', 'How many payment methods?')).toBe('evasive')
    expect(checkQuestionAnswerRelevance('你決定就好', '選哪個方案？')).toBe('evasive')
  })

  it('中文錨點重疊 → relevant', () => {
    expect(checkQuestionAnswerRelevance('三種付款方式', '需要支援哪些付款方式？')).toBe('relevant')
  })

  it('英文錨點重疊 → relevant', () => {
    // 答案需包含問題中的非停用詞（>= 3 字母）
    expect(checkQuestionAnswerRelevance('we need payment by credit card', 'Which payment methods do you need?')).toBe('relevant')
  })

  it('含軟體/商業詞彙 → relevant', () => {
    expect(checkQuestionAnswerRelevance('需要登入功能', '有什麼想法？')).toBe('relevant')
  })

  it('離題信號 >=2 → suspicious', () => {
    expect(checkQuestionAnswerRelevance('今天天氣好熱想吃拉麵', '需要哪些功能模組？')).toBe('suspicious')
  })

  it('離題信號 < 2 → unknown（fail-open）', () => {
    expect(checkQuestionAnswerRelevance('something random', '需要哪些功能？')).toBe('unknown')
  })

  it('evasive 但有具體資訊 → evasive（Sonnet 會進一步判斷）', () => {
    // quickFilter 層面 checkQuestionAnswerRelevance 看到 evasive 信號就標記
    // Sonnet 會二次判斷 "不確定，但可能需要中英文" 是 valid
    expect(checkQuestionAnswerRelevance('不確定', '需要哪些語言？')).toBe('evasive')
  })

  it('問題帶選項 + 答案引用選項文字 → relevant', () => {
    expect(checkQuestionAnswerRelevance(
      '信用卡和超商付款',
      '需要支援哪些付款方式？',
      'A. 信用卡\nB. 超商付款\nC. 銀行轉帳',
    )).toBe('relevant')
  })
})
