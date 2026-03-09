import { describe, expect, it, vi } from 'vitest'

vi.mock('../lib/env', () => ({
  getEnv: () => ({
    DATABASE_URL: 'postgresql://test',
    JWT_SECRET: 'test-secret',
    ANTHROPIC_API_KEY: 'test-key',
    VPS_API_URL: 'http://localhost:3100',
    REDIS_URL: 'redis://localhost:6379',
    NODE_ENV: 'test',
    PORT: 3100,
    LOG_LEVEL: 'info',
    LLM_MAX_CONCURRENT: 3,
    STAGE: 'test',
    UPLOAD_DIR: '/tmp',
    VERCEL_TOKEN: 'test',
    LINE_CHANNEL_ACCESS_TOKEN: '',
    LINE_CHANNEL_SECRET: '',
    LINE_NOTIFY_TOKEN: '',
    LIFF_ID: '',
    CHROMIUM_PATH: '',
    DB_POOL_MAX: 15,
    FLOWSTATE_RECOVERY_ENABLED: false,
    CONVERSATION_LOCK_ENABLED: false,
  }),
}))

vi.mock('pg', () => {
  class Pool {
    query = vi.fn().mockResolvedValue({ rows: [] })
    connect = vi.fn()
    on = vi.fn()
    end = vi.fn()
  }
  return { Pool }
})
import {
  buildAdaptiveStructureBatches,
  buildCompactDesignPrompt,
  buildDesignSystemPrompt,
  type DesignSystem,
} from '../services/uiux-generation'
import { autoFixCriticalIssuesRuleBased, runQualityGate } from '../services/quality-gate'

const MOCK_DESIGN_SYSTEM: DesignSystem = {
  cssVariables: ':root { --color-primary: #2563eb; }',
  tailwindExtend: {
    colors: { primary: '#2563eb' },
    fontFamily: { sans: ['DM Sans', 'system-ui', 'sans-serif'] },
  },
  typography: {
    fontFamily: 'DM Sans, system-ui, sans-serif',
    scale: { base: '1rem', lg: '1.125rem' },
  },
  colorPalette: {
    primary: '#2563eb',
    secondary: '#0f172a',
    accent: '#f59e0b',
    background: '#f8fafc',
    foreground: '#0f172a',
    muted: '#e2e8f0',
    border: '#cbd5e1',
    surface1: '#f8fafc',
    surface2: '#ffffff',
    surface3: '#f1f5f9',
  },
  spacing: {
    unit: 4,
    scale: { sm: '0.5rem', md: '1rem', lg: '1.5rem' },
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
  },
  shadows: {
    strategy: 'subtle-shadows',
    values: { sm: '0 1px 2px rgba(0,0,0,0.05)' },
  },
  animationPersonality: 'smooth',
}

describe('uiux optimization helpers', () => {
  it('compact design prompt should be shorter than full prompt', () => {
    const compact = buildCompactDesignPrompt(MOCK_DESIGN_SYSTEM)
    const full = buildDesignSystemPrompt(MOCK_DESIGN_SYSTEM)

    expect(compact).toContain('Design System 摘要')
    expect(compact.length).toBeLessThan(full.length)
    expect(compact).toContain(MOCK_DESIGN_SYSTEM.colorPalette.primary)
  })

  it('adaptive structure batches should split large contexts', () => {
    const batches = buildAdaptiveStructureBatches(
      ['首頁', '功能介紹', '價格方案', 'FAQ', '聯繫'],
      { contextChars: 40000, profile: 'balanced' }
    )

    expect(batches.length).toBeGreaterThan(1)
    expect(batches.flat()).toEqual(['首頁', '功能介紹', '價格方案', 'FAQ', '聯繫'])
  })
})

describe('quality gate rule-based autofix', () => {
  it('should fix motion import, focus-visible, form labels, and tailwind v4 syntax before LLM', () => {
    const code = {
      pages: [{
        path: 'app/page.tsx',
        description: 'home',
        content: `import { motion } from 'framer-motion'

export default function Page() {
  return (
    <main>
      <button className="rounded-md px-4 py-2">
        <svg />
      </button>
      <input placeholder="Email" />
      <motion.div />
    </main>
  )
}`,
      }],
      components: [],
      styles: '@tailwind base;\n@tailwind components;\n@tailwind utilities;',
    }

    const report = runQualityGate(code)
    const criticalIssues = [
      ...report.categories.a11y.issues,
      ...report.categories.performance.issues,
      ...report.categories.code_quality.issues,
    ].filter(issue => issue.severity === 'critical')

    const fixed = autoFixCriticalIssuesRuleBased(code, criticalIssues)

    expect(fixed).not.toBeNull()
    expect(fixed?.pages[0].content).toContain("from 'motion/react'")
    expect(fixed?.pages[0].content).toContain('focus-visible:ring-2')
    expect(fixed?.pages[0].content).toContain('aria-label="Email"')
    expect(fixed?.styles).toContain('@import "tailwindcss"')
    expect(fixed?.styles).not.toContain('@tailwind')
  })
})
