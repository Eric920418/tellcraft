import { describe, it, expect } from 'vitest'
import {
  parseIterationIntent,
  selectFilesByIntent,
  describeIntentForPrompt,
} from '../services/iteration-intent'
import type { GeneratedComponent } from '../services/uiux-generation'

const sampleCode = {
  pages: [
    { path: 'app/layout.tsx',  content: 'export default function Layout() {}', description: '' },
    { path: 'app/page.tsx',    content: '<HeroSection /><Features />', description: '' },
    { path: 'app/about/page.tsx', content: '<AboutContent />', description: '' },
  ] as GeneratedComponent[],
  components: [
    { path: 'components/Hero.tsx',    content: 'export function HeroSection() { return <h1>Welcome</h1> }', description: '' },
    { path: 'components/Footer.tsx',  content: 'export function Footer() { return <footer>©</footer> }', description: '' },
    { path: 'components/Card.tsx',    content: 'export function Card() {}', description: '' },
  ] as GeneratedComponent[],
  styles: ':root { --primary: #3b82f6; }',
}

// ============================================================
// parseIterationIntent
// ============================================================

describe('parseIterationIntent', () => {
  it('returns null for empty / whitespace', () => {
    expect(parseIterationIntent('')).toBeNull()
    expect(parseIterationIntent('   ')).toBeNull()
  })

  it('detects scope=section + target=hero + action=replace', () => {
    const intent = parseIterationIntent('把 hero 改成左右分割')
    expect(intent?.scope).toBe('section')
    expect(intent?.targets).toContain('hero')
    expect(intent?.action).toBe('replace')
  })

  it('detects scope=palette with paletteHint', () => {
    const intent = parseIterationIntent('顏色暖一點')
    expect(intent?.scope).toBe('palette')
    expect(intent?.paletteHint).toBe('warmer')
  })

  it('detects hex color in palette feedback', () => {
    const intent = parseIterationIntent('主色改成 #FF5733')
    expect(intent?.scope).toBe('palette')
    expect(intent?.paletteHint).toContain('#FF5733')
  })

  // ── Fix #1: 具體色名（紫/藍/綠/purple/blue）必須進 palette branch ──
  // 否則 style-lock 會把 LLM 改好的 primary 色 regex 還原回原值（卡死合理修改）
  it('「把 hero 改紫色」→ scope=palette + hint=purple（不會被 style-lock 還原）', () => {
    const intent = parseIterationIntent('把 hero 改紫色')
    expect(intent?.scope).toBe('palette')
    expect(intent?.paletteHint).toContain('purple')
  })

  it('「換成藍色」→ scope=palette + hint=blue', () => {
    const intent = parseIterationIntent('換成藍色')
    expect(intent?.scope).toBe('palette')
    expect(intent?.paletteHint).toContain('blue')
  })

  it('英文「make it more purple」→ scope=palette + hint=purple', () => {
    const intent = parseIterationIntent('make the hero more purple')
    expect(intent?.scope).toBe('palette')
    expect(intent?.paletteHint).toContain('purple')
  })

  it('「換成綠色，暖一點」→ palette + 抽象 hint(warmer) + 具體 hint(green) 共存', () => {
    const intent = parseIterationIntent('換成綠色，暖一點')
    expect(intent?.scope).toBe('palette')
    expect(intent?.paletteHint).toContain('warmer')
    expect(intent?.paletteHint).toContain('green')
  })

  it('避免誤觸：「畫藍圖」「紅利方案」不進 palette（沒 +色 +的）', () => {
    const blueprintIntent = parseIterationIntent('畫藍圖規劃下一階段')
    expect(blueprintIntent?.scope).not.toBe('palette')

    const bonusIntent = parseIterationIntent('加一個紅利方案 section')
    expect(bonusIntent?.scope).not.toBe('palette')
  })

  it('英文 word boundary：「red」是色但「redirect」不是', () => {
    const colorIntent = parseIterationIntent('change accent to red')
    expect(colorIntent?.scope).toBe('palette')

    const redirectIntent = parseIterationIntent('add a redirect to /home')
    expect(redirectIntent?.scope).not.toBe('palette')
  })

  it('detects scope=typography', () => {
    const intent = parseIterationIntent('把字體換成襯線體')
    expect(intent?.scope).toBe('typography')
    expect(intent?.action).toBe('replace')
  })

  it('detects scope=animation', () => {
    const intent = parseIterationIntent('hover 動畫太誇張，調慢一點')
    expect(intent?.scope).toBe('animation')
  })

  it('detects multiple section targets', () => {
    const intent = parseIterationIntent('hero 跟 footer 都要加 cursor-pointer')
    expect(intent?.targets).toEqual(expect.arrayContaining(['hero', 'footer']))
  })

  it('action=remove for "移除"', () => {
    const intent = parseIterationIntent('移除頁尾的 newsletter')
    expect(intent?.action).toBe('remove')
    expect(intent?.targets).toContain('footer')
  })

  it('action=add for "加上"', () => {
    const intent = parseIterationIntent('在 hero 下方加上見證區塊')
    expect(intent?.action).toBe('add')
    expect(intent?.targets).toEqual(expect.arrayContaining(['hero', 'testimonial']))
  })

  it('boosts confidence with explicit "只" prefix', () => {
    const a = parseIterationIntent('hero 改大一點')
    const b = parseIterationIntent('只把 hero 改大一點')
    expect((b?.confidence ?? 0)).toBeGreaterThan((a?.confidence ?? 0))
  })

  it('returns null for too-vague feedback (low confidence)', () => {
    expect(parseIterationIntent('改好看一點')).toBeNull()
    expect(parseIterationIntent('變漂亮')).toBeNull()
  })

  it('truncates rawFeedback to 200 chars', () => {
    const long = '把 hero 改成左右分割，' + 'a'.repeat(300)
    const intent = parseIterationIntent(long)
    expect(intent?.rawFeedback.endsWith('...')).toBe(true)
    expect(intent?.rawFeedback.length).toBeLessThanOrEqual(203)
  })
})

// ============================================================
// selectFilesByIntent
// ============================================================

describe('selectFilesByIntent', () => {
  it('returns full code when intent is null', () => {
    const out = selectFilesByIntent(sampleCode, null)
    expect(out).toBe(sampleCode)
  })

  it('returns full code for low-confidence intent', () => {
    const out = selectFilesByIntent(sampleCode, {
      scope: 'section', action: 'tweak', targets: ['hero'],
      rawFeedback: '', confidence: 0.5,
    })
    expect(out.pages).toEqual(sampleCode.pages)
    expect(out.components).toEqual(sampleCode.components)
  })

  it('filters by section keyword (high confidence)', () => {
    const out = selectFilesByIntent(sampleCode, {
      scope: 'section', action: 'replace', targets: ['hero'],
      rawFeedback: '', confidence: 0.9,
    })
    // hero 應留下，footer 應移除
    const componentPaths = out.components.map(c => c.path)
    expect(componentPaths).toContain('components/Hero.tsx')
    expect(componentPaths).not.toContain('components/Footer.tsx')
  })

  it('always retains layout.tsx', () => {
    const out = selectFilesByIntent(sampleCode, {
      scope: 'section', action: 'replace', targets: ['footer'],
      rawFeedback: '', confidence: 0.9,
    })
    expect(out.pages.some(p => p.path === 'app/layout.tsx')).toBe(true)
  })

  it('falls back to full code when filter result empty', () => {
    const out = selectFilesByIntent(sampleCode, {
      scope: 'section', action: 'replace', targets: ['nonexistent_section'],
      rawFeedback: '', confidence: 0.9,
    })
    // layout.tsx 仍會被加進來，但 components 會空 → 降級全部
    // 邏輯：filteredPages 只剩 layout（因 layout 自動加入），components 空 → 降級
    expect(out).toBe(sampleCode)
  })

  it('palette scope keeps full code (色彩通常跨檔)', () => {
    const out = selectFilesByIntent(sampleCode, {
      scope: 'palette', action: 'tweak', targets: [],
      paletteHint: 'warmer', rawFeedback: '', confidence: 0.9,
    })
    expect(out.pages).toEqual(sampleCode.pages)
    expect(out.components).toEqual(sampleCode.components)
  })

  it('whole scope returns full code untouched', () => {
    const out = selectFilesByIntent(sampleCode, {
      scope: 'whole', action: 'tweak', targets: [],
      rawFeedback: '', confidence: 0.9,
    })
    expect(out).toBe(sampleCode)
  })
})

// ============================================================
// describeIntentForPrompt
// ============================================================

describe('describeIntentForPrompt', () => {
  it('returns empty for null intent', () => {
    expect(describeIntentForPrompt(null)).toBe('')
  })

  it('formats scope/action/targets', () => {
    const out = describeIntentForPrompt({
      scope: 'section', action: 'replace', targets: ['hero', 'cta'],
      rawFeedback: '', confidence: 0.85,
    })
    expect(out).toContain('scope=section')
    expect(out).toContain('action=replace')
    expect(out).toContain('hero, cta')
    expect(out).toContain('信心 0.85')
  })

  it('includes paletteHint when present', () => {
    const out = describeIntentForPrompt({
      scope: 'palette', action: 'tweak', targets: [],
      paletteHint: '#FF5733', rawFeedback: '', confidence: 0.8,
    })
    expect(out).toContain('paletteHint=#FF5733')
  })
})
