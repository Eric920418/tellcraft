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
  findSuspiciousRefineShrinks,
  type RefinePatchSet,
  type DesignSystem,
} from '../services/uiux-generation'
import { autoFixCriticalIssuesRuleBased, runQualityGate } from '../services/quality-gate'
import {
  enforceFastBuildLayoutGuards,
  expandBriefPrompt,
  pickFirstBatchPages,
  shouldExpandBriefPrompt,
} from '../services/fast-build-generation'
import {
  buildPostDeployFastBuildQuickReplies,
  getRemainingFastBuildPages,
  runFastBuildBatchAudit,
} from '../workers/phase-handlers/fast-build-phases'

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

  it('should skip brief expansion when prompt already has page/detail signals', () => {
    expect(
      shouldExpandBriefPrompt(
        '首頁要有 Hero、功能介紹、FAQ 和聯繫表單，價格方案放第二屏，CTA 用立即預約。',
        ['首頁', '功能介紹', 'FAQ', '聯繫']
      )
    ).toBe(false)
  })

  it('should pick homepage plus conversion page for complex website fast build', () => {
    expect(
      pickFirstBatchPages('saas', 'website', ['首頁', '功能介紹', '價格方案', 'FAQ', '聯繫'])
    ).toEqual(['首頁', '價格方案'])
  })

  it('should return all pages when count <= 4 for app-like fast build', () => {
    // ≤4 頁時直接全批返回，不再只選核心頁
    expect(
      pickFirstBatchPages('tool', 'app', ['介紹', '主頁面', '設定'])
    ).toEqual(['介紹', '主頁面', '設定'])
  })

  it('should add hard layout guards for app and website modes', () => {
    const appGuard = enforceFastBuildLayoutGuards('tool', 'app', '原始需求')
    const websiteGuard = enforceFastBuildLayoutGuards('landing', 'website')

    expect(appGuard).toContain('Do NOT generate marketing hero sections')
    expect(appGuard).toContain('原始需求')
    expect(websiteGuard).toContain('Do NOT generate app-shell layouts')
  })

  it('should detect suspicious refine shrink for truncated large files', () => {
    const baseCode = {
      pages: [],
      components: [{
        path: 'components/NeuralCanvas.tsx',
        description: 'canvas',
        content: Array.from({ length: 421 }, (_, index) => `line-${index + 1}`).join('\n'),
      }],
      styles: '',
    }
    const patches: RefinePatchSet = {
      modifiedPages: new Map(),
      modifiedComponents: new Map([
        ['components/NeuralCanvas.tsx', Array.from({ length: 189 }, (_, index) => `line-${index + 1}`).join('\n')],
      ]),
      modifiedStyles: '',
    }

    expect(findSuspiciousRefineShrinks(baseCode, patches)).toEqual([
      {
        path: 'components/NeuralCanvas.tsx',
        originalLines: 421,
        newLines: 189,
      },
    ])
  })

  it('should compute remaining fast-build pages after partial deploy', () => {
    expect(getRemainingFastBuildPages({
      fastMode: true,
      fastBuildAllPages: ['首頁', '價格方案', '聯繫'],
      fastBuildCompletedPages: ['首頁'],
    })).toEqual(['價格方案', '聯繫'])
  })

  it('should include continue quick reply after deploy when pages remain', () => {
    expect(buildPostDeployFastBuildQuickReplies({
      fastMode: true,
      fastBuildAllPages: ['首頁', '價格方案', '聯繫'],
      fastBuildCompletedPages: ['首頁'],
      locale: 'zh',
    }, { includeDeploy: true, includeRollback: true })).toEqual([
      { label: '繼續生成（2 頁）', value: '__continue_fast_build_after_deploy__', style: 'primary' },
      { label: '部署上線', value: '部署', style: 'secondary' },
      { label: '回滾版本', value: '回滾', style: 'ghost' },
    ])
  })

  it('should fail batch audit when app layout contains marketing sections', () => {
    const result = runFastBuildBatchAudit({
      layoutMode: 'app',
      productType: 'tool',
      targetPages: ['主頁面'],
      originalRequirements: '做一個文字轉換工具',
      batchCode: {
        pages: [{
          path: 'app/page.tsx',
          description: 'tool',
          content: '<main><section><h1>Hero</h1><p>Testimonials</p><div>Pricing</div></section></main>',
        }],
        components: [],
        styles: '',
      },
    })

    expect(result.passed).toBe(false)
    expect(result.severity).toBe('critical')
    expect(result.issues.join(' ')).toContain('marketing hero')
  })

  it('should fail batch audit when website layout looks like app shell', () => {
    const result = runFastBuildBatchAudit({
      layoutMode: 'website',
      productType: 'landing',
      targetPages: ['首頁'],
      originalRequirements: '做一個品牌官網',
      batchCode: {
        pages: [{
          path: 'app/page.tsx',
          description: 'landing',
          content: '<div className="min-h-screen flex"><aside className="sidebar border-r" /><main><h1>Welcome</h1><p>Command palette</p></main></div>',
        }],
        components: [],
        styles: '',
      },
    })

    expect(result.passed).toBe(false)
    expect(result.severity).toBe('critical')
    expect(result.issues.join(' ')).toContain('sidebar/app shell')
  })

  it('should request fallback when target page count is missing', () => {
    const result = runFastBuildBatchAudit({
      layoutMode: 'website',
      productType: 'saas',
      targetPages: ['首頁', '價格方案'],
      originalRequirements: '做一個 saas 官網',
      batchCode: {
        pages: [{
          path: 'app/page.tsx',
          description: 'home',
          content: '<main><section>Home</section></main>',
        }],
        components: [],
        styles: '',
      },
    })

    expect(result.passed).toBe(false)
    expect(result.shouldRunLlmFallback).toBe(true)
    expect(result.issues.join(' ')).toContain('missing target pages')
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

describe('fast-build prompt expansion cache', () => {
  it('should reuse cached expanded prompt for the same brief', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ text: '首頁包含 Hero 主視覺、產品特色模組與立即預約 CTA；課表頁說明課程分類、教練資訊與預約流程；聯繫頁提供表單、電話、營業時間與地圖資訊。' }],
        usage: { input_tokens: 10, output_tokens: 20 },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const first = await expandBriefPrompt('做一個健身官網', 'fitness', ['首頁', '課表', '聯繫'])
    const second = await expandBriefPrompt('做一個健身官網', 'fitness', ['首頁', '課表', '聯繫'])

    expect(first).toBeTruthy()
    expect(second).toBe(first)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
