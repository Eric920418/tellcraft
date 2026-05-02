import { describe, expect, it } from 'vitest'
import { evaluateReadability, detectLanguage } from '../services/ui-evaluator'

describe('detectLanguage', () => {
  it('detects pure Chinese as zh', () => {
    expect(detectLanguage('我們提供最好的服務給每一位客戶')).toBe('zh')
  })

  it('detects pure English as en', () => {
    expect(detectLanguage('We provide the best service to every customer')).toBe('en')
  })

  it('detects English with technical terms as en', () => {
    expect(detectLanguage('Build powerful APIs with our SDK and TypeScript support')).toBe('en')
  })

  it('detects Chinese with English brand name as zh (CJK majority)', () => {
    expect(detectLanguage('用 Tellcraft 打造你的網站')).toBe('zh')
  })

  it('handles empty/whitespace as en (default)', () => {
    expect(detectLanguage('')).toBe('en')
    expect(detectLanguage('   ')).toBe('en')
  })
})

describe('evaluateReadability — English Flesch-Kincaid', () => {
  it('flags very high grade level (PhD-style writing) as critical', () => {
    // 拗口長句 + 多音節詞 → 高 FKGL
    const phdText = 'The aforementioned methodology demonstrates substantial efficacy in optimizing the multidimensional parameters governing the orchestration of distributed computational architectures, particularly when subjected to high-throughput concurrent workloads requiring deterministic latency guarantees.'
    const issue = evaluateReadability(phdText, 'body')
    expect(issue?.severity).toBe('critical')
    expect(issue?.description).toContain('readability/fkgl')
  })

  it('passes simple readable English (low grade)', () => {
    // 短句 + 常用詞 → 低 FKGL
    const simpleText = 'Build your website fast. Pick a template. Add content. Done. We handle the rest. No code needed. It works on phones too.'
    const issue = evaluateReadability(simpleText, 'body')
    // 簡單英文不該觸發
    expect(issue).toBeNull()
  })

  it('skips short text (<50 chars) to avoid FKGL distortion', () => {
    const issue = evaluateReadability('Click me to start.', 'cta')
    expect(issue).toBeNull()
  })
})

describe('evaluateReadability — Chinese length rules', () => {
  it('flags Chinese hero >30 chars as warning', () => {
    const longHero = '我們致力於為每一位客戶提供最優質卓越的服務體驗讓您的事業更上一層樓'
    const issue = evaluateReadability(longHero, 'hero')
    expect(issue?.severity).toBe('warning')
    expect(issue?.description).toContain('readability/zh-length')
    expect(issue?.description).toContain('Hero')
  })

  it('passes Chinese hero <=30 chars', () => {
    const okHero = '打造你的網站，零代碼上線'
    expect(evaluateReadability(okHero, 'hero')).toBeNull()
  })

  it('flags Chinese CTA >12 chars as warning', () => {
    const longCta = '立即前往註冊頁面開始試用我們的服務'
    const issue = evaluateReadability(longCta, 'cta')
    expect(issue?.severity).toBe('warning')
    expect(issue?.description).toContain('CTA')
  })

  it('passes Chinese CTA <=12 chars', () => {
    expect(evaluateReadability('立即試用', 'cta')).toBeNull()
    expect(evaluateReadability('了解更多', 'cta')).toBeNull()
  })

  it('handles empty string', () => {
    expect(evaluateReadability('', 'hero')).toBeNull()
    expect(evaluateReadability('   ', 'cta')).toBeNull()
  })
})

describe('evaluateReadability — language detection integration', () => {
  it('routes Chinese hero to length rules (not FKGL)', () => {
    // 30+ 字中文 — 應走中文 rule，FKGL 不會跑
    const text = '一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二三四五'
    const issue = evaluateReadability(text, 'hero')
    expect(issue?.description).toContain('zh-length')
  })

  it('routes English hero to FKGL (not zh-length)', () => {
    const text = 'The quintessential paradigm of contemporary digital transformation necessitates a multidisciplinary approach.'
    const issue = evaluateReadability(text, 'body')
    if (issue) {
      // 英文 issue 應該是 fkgl 規則
      expect(issue.description).toContain('readability/fkgl')
      expect(issue.description).not.toContain('zh-length')
    }
  })
})
