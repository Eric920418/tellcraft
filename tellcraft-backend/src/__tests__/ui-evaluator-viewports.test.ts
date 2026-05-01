import { describe, it, expect } from 'vitest'
import {
  shouldRunMobileViewport,
  shouldRunDarkViewport,
  selectViewports,
  buildViewportNote,
} from '../services/ui-evaluator'
import type { GeneratedCode } from '../types/flow-state'

const lightCode: GeneratedCode = {
  pages: [{ path: 'app/page.tsx', content: 'export default function P() { return <div className="bg-white text-black">Hi</div> }', description: '' }],
  components: [],
  styles: '',
}

const darkCode: GeneratedCode = {
  pages: [{ path: 'app/page.tsx', content: 'export default function P() { return <div className="bg-white dark:bg-slate-900 text-black dark:text-white">Hi</div> }', description: '' }],
  components: [],
  styles: '',
}

const darkInComponent: GeneratedCode = {
  pages: [{ path: 'app/page.tsx', content: 'export default function P() { return <div>Hi</div> }', description: '' }],
  components: [{ path: 'components/Card.tsx', content: '<div className="dark:border-white/10">x</div>', description: '' }],
  styles: '',
}

describe('shouldRunMobileViewport', () => {
  it('true when tier=creative', () => {
    expect(shouldRunMobileViewport('creative', undefined)).toBe(true)
  })

  it('true when productType is mobile-heavy', () => {
    expect(shouldRunMobileViewport('functional', 'restaurant')).toBe(true)
    expect(shouldRunMobileViewport('functional', 'portfolio')).toBe(true)
    expect(shouldRunMobileViewport('functional', 'landing')).toBe(true)
    expect(shouldRunMobileViewport('functional', 'fitness')).toBe(true)
    expect(shouldRunMobileViewport('functional', 'salon')).toBe(true)
  })

  it('false for desktop-heavy productType + functional tier', () => {
    expect(shouldRunMobileViewport('functional', 'dashboard')).toBe(false)
    expect(shouldRunMobileViewport('functional', 'saas')).toBe(false)
    expect(shouldRunMobileViewport('functional', undefined)).toBe(false)
  })

  it('case-insensitive on productType', () => {
    expect(shouldRunMobileViewport('functional', 'RESTAURANT')).toBe(true)
  })
})

describe('shouldRunDarkViewport', () => {
  it('false when no dark: classes anywhere', () => {
    expect(shouldRunDarkViewport(lightCode)).toBe(false)
  })

  it('true when dark: in pages', () => {
    expect(shouldRunDarkViewport(darkCode)).toBe(true)
  })

  it('true when dark: in components only', () => {
    expect(shouldRunDarkViewport(darkInComponent)).toBe(true)
  })

  it('false when "dark" appears as plain word but not as className modifier', () => {
    const c: GeneratedCode = {
      pages: [{ path: 'app/page.tsx', content: '<p>I love dark chocolate</p>', description: '' }],
      components: [],
      styles: '',
    }
    expect(shouldRunDarkViewport(c)).toBe(false)
  })
})

describe('selectViewports', () => {
  it('always includes desktop-light', () => {
    const list = selectViewports(lightCode, 'functional', 'dashboard')
    expect(list[0].key).toBe('desktop-light')
    expect(list).toHaveLength(1)
  })

  it('adds mobile-light for creative tier', () => {
    const list = selectViewports(lightCode, 'creative', 'saas')
    expect(list.map(v => v.key)).toEqual(['desktop-light', 'mobile-light'])
  })

  it('adds desktop-dark when code uses dark: classes', () => {
    const list = selectViewports(darkCode, 'functional', 'dashboard')
    expect(list.map(v => v.key)).toEqual(['desktop-light', 'desktop-dark'])
  })

  it('all 3 viewports for creative + dark code', () => {
    const list = selectViewports(darkCode, 'creative', 'portfolio')
    expect(list.map(v => v.key)).toEqual(['desktop-light', 'mobile-light', 'desktop-dark'])
  })

  it('viewport configs have sensible dimensions', () => {
    const list = selectViewports(darkCode, 'creative', 'portfolio')
    const desktop = list.find(v => v.key === 'desktop-light')
    const mobile = list.find(v => v.key === 'mobile-light')
    const dark = list.find(v => v.key === 'desktop-dark')
    expect(desktop?.width).toBe(1280)
    expect(mobile?.width).toBe(375)
    expect(mobile?.isMobile).toBe(true)
    expect(dark?.prefersDark).toBe(true)
  })
})

describe('buildViewportNote', () => {
  it('returns empty for desktop-light', () => {
    expect(buildViewportNote('desktop-light')).toBe('')
  })

  it('mobile note mentions mobile-specific issues', () => {
    const note = buildViewportNote('mobile-light')
    expect(note).toContain('MOBILE')
    expect(note).toContain('horizontal scroll')
    expect(note).toContain('觸控')
  })

  it('dark note mentions dark-specific issues', () => {
    const note = buildViewportNote('desktop-dark')
    expect(note).toContain('DESKTOP-DARK')
    expect(note).toContain('對比度')
    expect(note).toContain('dark variant')
  })
})
