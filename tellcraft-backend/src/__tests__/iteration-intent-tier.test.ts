import { describe, expect, it } from 'vitest'
import { parseIterationIntent } from '../services/iteration-intent'

describe('Phase C: parseIterationIntent tier classification', () => {
  it('classifies HEX color change as design-system-token', () => {
    const intent = parseIterationIntent('改成 #FF0000')
    expect(intent?.tier).toBe('design-system-token')
  })

  it('classifies "整個網站的主色" as design-system-token', () => {
    const intent = parseIterationIntent('整個網站的主色換成藍色')
    expect(intent?.tier).toBe('design-system-token')
  })

  it('classifies "Hero 加動畫" as code-override (section-specific, no token signal)', () => {
    const intent = parseIterationIntent('Hero 加上一個漸入動畫')
    expect(intent?.tier).toBe('code-override')
  })

  it('classifies "整體更暖一點，hero 加按鈕" as mixed', () => {
    const intent = parseIterationIntent('整體更暖一點，但 hero 區塊加一個按鈕')
    // hasTokenSignal (整體) + hasSectionSignal (hero) → mixed
    expect(intent?.tier).toBe('mixed')
  })

  it('classifies pure palette change without section as design-system-token', () => {
    const intent = parseIterationIntent('改成紫色')
    expect(intent?.tier).toBe('design-system-token')
  })

  it('classifies palette change with section as mixed', () => {
    const intent = parseIterationIntent('hero 區塊改成紫色')
    expect(intent?.tier).toBe('mixed')
  })

  it('classifies "字體換成 Inter" as design-system-token (typography only)', () => {
    const intent = parseIterationIntent('字體換成 Inter')
    expect(intent?.tier).toBe('design-system-token')
  })

  it('classifies "var(--color-primary)" reference as design-system-token', () => {
    const intent = parseIterationIntent('改成 var(--color-primary) 的色號')
    expect(intent?.tier).toBe('design-system-token')
  })

  it('returns null for unclear feedback (no tier classification)', () => {
    expect(parseIterationIntent('哈哈哈')).toBeNull()
    expect(parseIterationIntent('asdf')).toBeNull()
  })
})
