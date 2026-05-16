/**
 * 守 cleanTailwindV4Syntax + generateTailwindConfig 雙 bug 不再回歸。
 *
 * Incident 2026-05-17 root cause：
 *   1. cleanTailwindV4Syntax 砍 v4 @import 後不補 v3 directives，假設下游 assembleDeployFiles 會補
 *      → 但 sanitizeCodeForDeploy / iteration / UIUX 完成寫 DB 路徑沒走 assemble → DB 留下無 directive 的 globals.css
 *      → WebContainer preview 讀 LKG/content → Tailwind 完全 dead → 整個專案大爆版
 *   2. generateTailwindConfig 對 designSystem.borderRadius 用 string interpolation `'${val}'`
 *      → val=undefined 渲染成字串 'undefined' → override Tailwind 內建預設讓 rounded-* 全失效
 *
 * 反模式（CLAUDE.md 防雷）：sanitize/normalize 函數必須**自包含**，不能靠下游補修。
 */

import { describe, it, expect } from 'vitest'
import { cleanTailwindV4Syntax } from '../services/deployer'
import { generateTailwindConfig, type DesignSystem } from '../services/uiux-generation'

// ============================================================
// cleanTailwindV4Syntax — 自包含 + idempotent
// ============================================================

describe('cleanTailwindV4Syntax — 砍 v4 後必補 v3 directives', () => {
  it('純 v4 input（只有 @import "tailwindcss"）→ 補上 v3 三行 directives', () => {
    const v4Input = '@import "tailwindcss";\n\n:root { --color-primary: #000; }\n'
    const result = cleanTailwindV4Syntax(v4Input)
    expect(result).toContain('@tailwind base;')
    expect(result).toContain('@tailwind components;')
    expect(result).toContain('@tailwind utilities;')
    // v4 import 必須被砍
    expect(result).not.toMatch(/@import\s*["']tailwindcss["']/)
    // 用戶內容保留
    expect(result).toContain(':root { --color-primary: #000; }')
  })

  it('完全沒 directive 的 globals.css（incident 觸發點）→ 補上 v3 三行', () => {
    const noDirective = ':root {\n  --color-primary: #5C3D2E;\n}\nbody { color: var(--color-primary); }'
    const result = cleanTailwindV4Syntax(noDirective)
    expect(result).toContain('@tailwind base;')
    expect(result).toContain('@tailwind components;')
    expect(result).toContain('@tailwind utilities;')
    expect(result).toContain(':root')
    expect(result).toContain('--color-primary: #5C3D2E')
  })

  it('已有完整 v3 directives → 不重複 prepend（idempotent）', () => {
    const v3Complete = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody { margin: 0; }'
    const result = cleanTailwindV4Syntax(v3Complete)
    // 三行 directive 各只出現 1 次
    expect((result.match(/@tailwind base\s*;/g) || []).length).toBe(1)
    expect((result.match(/@tailwind components\s*;/g) || []).length).toBe(1)
    expect((result.match(/@tailwind utilities\s*;/g) || []).length).toBe(1)
    expect(result).toContain('body { margin: 0; }')
  })

  it('呼叫兩次結果一致（idempotent — 同個函數重複 sanitize 也安全）', () => {
    const input = '@import "tailwindcss";\n:root { --x: 1; }'
    const once = cleanTailwindV4Syntax(input)
    const twice = cleanTailwindV4Syntax(once)
    expect(twice).toBe(once)
  })

  it('只有 @tailwind base 缺 components/utilities → 補全', () => {
    const partial = '@tailwind base;\n\n:root { --c: red; }'
    const result = cleanTailwindV4Syntax(partial)
    expect(result).toContain('@tailwind base;')
    expect(result).toContain('@tailwind components;')
    expect(result).toContain('@tailwind utilities;')
  })

  it('@theme {} 區塊 → 轉成 :root {}', () => {
    const v4Theme = '@theme {\n  --color-brand: blue;\n}\nbody { margin: 0; }'
    const result = cleanTailwindV4Syntax(v4Theme)
    expect(result).not.toContain('@theme')
    expect(result).toContain(':root')
    expect(result).toContain('--color-brand: blue')
  })

  it('@utility/@variant 自訂語法 → 砍除', () => {
    const v4Custom = '@utility center { display: flex; }\n@variant hover-glow { box-shadow: 0 0 4px; }\nbody{margin:0;}'
    const result = cleanTailwindV4Syntax(v4Custom)
    expect(result).not.toContain('@utility')
    expect(result).not.toContain('@variant')
    expect(result).toContain('body')
  })

  it('@apply font-{非標準} → 轉成 CSS variable', () => {
    const v4Apply = '.heading { @apply font-display; }'
    const result = cleanTailwindV4Syntax(v4Apply)
    expect(result).toContain('font-family: var(--font-display')
  })

  it('@apply font-sans（標準）→ 保留', () => {
    const standard = '.body { @apply font-sans; }'
    const result = cleanTailwindV4Syntax(standard)
    expect(result).toContain('@apply font-sans;')
  })

  it('空字串 input → 仍輸出三行 directives（避免下游空 globals.css）', () => {
    const result = cleanTailwindV4Syntax('')
    expect(result).toContain('@tailwind base;')
    expect(result).toContain('@tailwind components;')
    expect(result).toContain('@tailwind utilities;')
  })
})

// ============================================================
// generateTailwindConfig — undefined fallback
// ============================================================

const MINIMAL_DS_OK: DesignSystem = {
  cssVariables: ':root { --c: blue; }',
  tailwindExtend: {},
  typography: { fontFamily: 'Inter, sans-serif', scale: {} },
  colorPalette: {
    primary: '#000', secondary: '#111', accent: '#222',
    background: '#fff', foreground: '#000', muted: '#888', border: '#ccc',
  },
  spacing: { unit: 4, scale: {} },
  borderRadius: { none: '0', sm: '2px', md: '4px', lg: '8px', full: '999px' },
}

describe('generateTailwindConfig — undefined 欄位 fallback（不能渲染 "undefined" 字串）', () => {
  it('完整 designSystem → 正常產出', () => {
    const config = generateTailwindConfig(MINIMAL_DS_OK)
    expect(config).toContain("none: '0'")
    expect(config).toContain("sm: '2px'")
    expect(config).toContain("primary: '#000'")
    // 不能出現字串 'undefined'
    expect(config).not.toMatch(/:\s*'undefined'/)
  })

  it('borderRadius 整個 undefined → 用 fallback 預設值（incident bug B 觸發點）', () => {
    const ds = { ...MINIMAL_DS_OK, borderRadius: undefined as unknown as DesignSystem['borderRadius'] }
    const config = generateTailwindConfig(ds)
    expect(config).not.toMatch(/:\s*'undefined'/)
    // fallback 值
    expect(config).toContain("none: '0'")
    expect(config).toContain("sm: '0.125rem'")
    expect(config).toContain("md: '0.375rem'")
    expect(config).toContain("lg: '0.5rem'")
    expect(config).toContain("full: '9999px'")
  })

  it('borderRadius 部分欄位 undefined → 對應欄位用 fallback', () => {
    const ds: DesignSystem = {
      ...MINIMAL_DS_OK,
      borderRadius: {
        none: '0', sm: '4px',
        md: undefined as unknown as string,
        lg: undefined as unknown as string,
        full: '9999px',
      },
    }
    const config = generateTailwindConfig(ds)
    expect(config).not.toMatch(/:\s*'undefined'/)
    expect(config).toContain("sm: '4px'")
    expect(config).toContain("md: '0.375rem'")  // fallback
    expect(config).toContain("lg: '0.5rem'")    // fallback
  })

  it('colorPalette 部分欄位 undefined → 對應欄位用 fallback', () => {
    const ds: DesignSystem = {
      ...MINIMAL_DS_OK,
      colorPalette: {
        primary: undefined as unknown as string,
        secondary: '#abc', accent: '#def',
        background: undefined as unknown as string,
        foreground: '#000', muted: '#888', border: '#ccc',
      },
    }
    const config = generateTailwindConfig(ds)
    expect(config).not.toMatch(/:\s*'undefined'/)
    expect(config).toContain("primary: '#2563eb'")    // fallback
    expect(config).toContain("secondary: '#abc'")
    expect(config).toContain("background: '#ffffff'") // fallback
  })

  it('輸出永遠是合法 tailwind.config.ts（不含 undefined / null / NaN 字串）', () => {
    const broken: DesignSystem = {
      cssVariables: '',
      tailwindExtend: {},
      typography: { fontFamily: '', scale: {} },
      colorPalette: {} as unknown as DesignSystem['colorPalette'],
      spacing: { unit: 4, scale: {} },
      borderRadius: {} as unknown as DesignSystem['borderRadius'],
    }
    const config = generateTailwindConfig(broken)
    expect(config).not.toMatch(/:\s*'undefined'/)
    expect(config).not.toMatch(/:\s*'null'/)
    expect(config).not.toMatch(/:\s*'NaN'/)
    expect(config).toContain('export default config')
  })
})
