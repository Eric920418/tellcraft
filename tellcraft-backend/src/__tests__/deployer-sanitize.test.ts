import { describe, it, expect } from 'vitest'
import {
  sanitizeCodeForDeploy,
  toVercelSlug,
  wrapInNextJs,
  applyImageLibraryToDeployCode,
  deriveSmokeTestPaths,
  scanProcessEnvReferences,
  extractReferencedTables,
  checkPageActionContract,
} from '../services/deployer'
import { buildPicsumFallbackLibrary, type ImageLibrary } from '../services/image-library-service'

// Helper：建立最小 GeneratedCode
function makeCode(overrides: {
  pages?: Array<{ path: string; content: string; description: string }>
  components?: Array<{ path: string; content: string; description: string }>
  styles?: string
} = {}) {
  return {
    pages: overrides.pages || [],
    components: overrides.components || [],
    styles: overrides.styles || '',
  }
}

function makeFile(path: string, content: string) {
  return { path, content, description: '' }
}

// ============================================================
// Fix 1: framer-motion → motion/react
// ============================================================

describe('Fix 1: framer-motion → motion/react', () => {
  it('應該把 framer-motion import 改成 motion/react', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `'use client'\nimport { motion } from 'framer-motion'\nexport default function Page() { return <motion.div /> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.pages[0].content).toContain("from 'motion/react'")
    expect(result.code.pages[0].content).not.toContain('framer-motion')
    expect(result.fixes.some(f => f.includes('framer-motion'))).toBe(true)
  })

  it('已經是 motion/react 不應修改', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `'use client'\nimport { motion } from 'motion/react'\nexport default function Page() { return <motion.div /> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.fixes.some(f => f.includes('framer-motion'))).toBe(false)
  })

  it('雙引號 import 也應修復', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `'use client'\nimport { motion } from "framer-motion"\nexport default function Page() { return <div /> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.pages[0].content).toContain("from 'motion/react'")
  })
})

// ============================================================
// Fix 2: 缺少 'use client'
// ============================================================

describe('Fix 2: 自動加入 use client', () => {
  it('使用 useState 但沒有 use client → 自動加入', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', 'import { useState } from "react"\nexport default function Page() { const [x, setX] = useState(0); return <div /> }')],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.pages[0].content).toMatch(/^'use client'/)
    expect(result.fixes.some(f => f.includes('use client'))).toBe(true)
  })

  it('使用 motion/react → 自動加入 use client', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `import { motion } from 'motion/react'\nexport default function Page() { return <motion.div /> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.pages[0].content).toMatch(/^'use client'/)
  })

  it('已有 use client → 不重複添加', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `'use client'\nimport { useState } from "react"\nexport default function Page() { return <div /> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    const matches = result.code.pages[0].content.match(/'use client'/g) || []
    expect(matches.length).toBe(1)
  })

  it('無 hooks 也無 motion → 不加 use client', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', 'export default function Page() { return <div>Hello</div> }')],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.pages[0].content).not.toContain('use client')
  })
})

// ============================================================
// Fix 3: motion spread props
// ============================================================

describe('Fix 3: motion spread props 類型衝突修復', () => {
  it('motion.* 上的 {...props} → {...safeMotionProps(props)}', () => {
    const code = makeCode({
      components: [makeFile('components/Card.tsx', `'use client'\nimport { motion } from 'motion/react'\nexport function Card(props: any) { return <motion.div {...props}>card</motion.div> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.components[0].content).toContain('safeMotionProps(props)')
    expect(result.code.components[0].content).toContain("import { safeMotionProps }")
    expect(result.injectedFiles.some(f => f.file.includes('motion-safe-props'))).toBe(true)
  })

  it('無 motion.* → 不注入 helper', () => {
    const code = makeCode({
      components: [makeFile('components/Card.tsx', `'use client'\nexport function Card() { return <div>card</div> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.injectedFiles.some(f => f.file.includes('motion-safe-props'))).toBe(false)
  })

  it('motion.div 無 spread → 不修改', () => {
    const code = makeCode({
      components: [makeFile('components/Card.tsx', `'use client'\nimport { motion } from 'motion/react'\nexport function Card() { return <motion.div className="test">card</motion.div> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.components[0].content).not.toContain('safeMotionProps')
  })
})

// ============================================================
// Fix 4: Google Fonts link 移除
// ============================================================

describe('Fix 4: Google Fonts link 移除', () => {
  it('應該移除 Google Fonts <link> JSX', () => {
    const code = makeCode({
      pages: [makeFile('app/layout.tsx', `export default function Layout({ children }: any) { return <html><head><link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet" /></head><body>{children}</body></html> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.pages[0].content).not.toContain('fonts.googleapis.com')
    expect(result.fixes.some(f => f.includes('Google Fonts'))).toBe(true)
  })

  it('無 Google Fonts → 不修改', () => {
    const code = makeCode({
      pages: [makeFile('app/layout.tsx', 'export default function Layout({ children }: any) { return <html><body>{children}</body></html> }')],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.fixes.some(f => f.includes('Google Fonts <link>'))).toBe(false)
  })

  it('CSS 中的 @import Google Fonts 也應移除', () => {
    const code = makeCode({
      styles: `@import url('https://fonts.googleapis.com/css2?family=Inter');\n.main { color: red; }`,
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.styles).not.toContain('fonts.googleapis.com')
    expect(result.code.styles).toContain('.main { color: red; }')
  })
})

// ============================================================
// Fix 4.5: 非 variable font 的 axes 參數移除
// ============================================================

describe('Fix 4.5: next/font 非 variable font axes 參數移除', () => {
  it('Playfair_Display 含 axes → 應移除 axes（中間位置）', () => {
    const code = makeCode({
      pages: [makeFile(
        'app/layout.tsx',
        `import { Playfair_Display } from 'next/font/google'\nconst playfair = Playfair_Display({ subsets: ['latin'], axes: ['opsz'], display: 'swap' })\nexport default function Layout({ children }: any) { return <html className={playfair.className}><body>{children}</body></html> }`
      )],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.pages[0].content).not.toMatch(/axes\s*:/)
    expect(result.code.pages[0].content).toContain("subsets: ['latin']")
    expect(result.code.pages[0].content).toContain("display: 'swap'")
    expect(result.fixes.some(f => f.includes('axes') && f.includes('Playfair_Display'))).toBe(true)
  })

  it('Lora 含 axes → 應移除（結尾位置，雙引號）', () => {
    const code = makeCode({
      pages: [makeFile(
        'app/layout.tsx',
        `import { Lora } from "next/font/google"\nconst lora = Lora({ subsets: ["latin"], display: "swap", axes: ["opsz"] })`
      )],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.pages[0].content).not.toMatch(/axes\s*:/)
    expect(result.code.pages[0].content).toContain('subsets: ["latin"]')
  })

  it('Merriweather 只有 axes → 移除後應剩空物件', () => {
    const code = makeCode({
      pages: [makeFile(
        'app/layout.tsx',
        `const merri = Merriweather({ axes: ['opsz'] })`
      )],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.pages[0].content).not.toMatch(/axes\s*:/)
    expect(result.fixes.some(f => f.includes('Merriweather'))).toBe(true)
  })

  it('多行 axes（格式化代碼）也應移除', () => {
    const code = makeCode({
      pages: [makeFile(
        'app/layout.tsx',
        `const instrument = Instrument_Serif({\n  subsets: ['latin'],\n  axes: ['opsz'],\n  display: 'swap',\n  weight: '400'\n})`
      )],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.pages[0].content).not.toMatch(/axes\s*:/)
    expect(result.code.pages[0].content).toContain("weight: '400'")
    expect(result.code.pages[0].content).toContain("subsets: ['latin']")
  })

  it('axes 多值 → 整個移除', () => {
    const code = makeCode({
      pages: [makeFile(
        'app/layout.tsx',
        `const x = Playfair_Display({ subsets: ['latin'], axes: ['opsz', 'wght', 'wdth'] })`
      )],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.pages[0].content).not.toMatch(/axes\s*:/)
    expect(result.code.pages[0].content).not.toContain('opsz')
    expect(result.code.pages[0].content).not.toContain('wght')
  })

  it('variable font（Inter）帶 axes → 不應修改', () => {
    const code = makeCode({
      pages: [makeFile(
        'app/layout.tsx',
        `const inter = Inter({ subsets: ['latin'], axes: ['opsz'], display: 'swap' })`
      )],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.pages[0].content).toContain("axes: ['opsz']")
    expect(result.fixes.some(f => f.includes('移除非 variable font'))).toBe(false)
  })

  it('variable font（Plus_Jakarta_Sans）帶 axes → 不應修改', () => {
    const code = makeCode({
      pages: [makeFile(
        'app/layout.tsx',
        `const pjs = Plus_Jakarta_Sans({ subsets: ['latin'], axes: ['wght'] })`
      )],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.pages[0].content).toContain('axes:')
  })

  it('同一檔案多個非 variable font → 全部清理', () => {
    const code = makeCode({
      pages: [makeFile(
        'app/layout.tsx',
        `const p = Playfair_Display({ subsets: ['latin'], axes: ['opsz'] })\nconst l = Lora({ axes: ['opsz'], subsets: ['latin'] })`
      )],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.pages[0].content).not.toMatch(/axes\s*:/)
    const fixMsg = result.fixes.find(f => f.includes('axes'))
    expect(fixMsg).toBeDefined()
    expect(fixMsg).toContain('Playfair_Display')
    expect(fixMsg).toContain('Lora')
  })

  it('非 variable font 但無 axes → 不應修改', () => {
    const code = makeCode({
      pages: [makeFile(
        'app/layout.tsx',
        `const p = Playfair_Display({ subsets: ['latin'], display: 'swap' })`
      )],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.pages[0].content).toContain("display: 'swap'")
    expect(result.fixes.some(f => f.includes('axes'))).toBe(false)
  })
})

// ============================================================
// Fix 5: Tailwind v4 CSS
// ============================================================

describe('Fix 5: Tailwind v4 CSS 清理', () => {
  it('應該移除 @import "tailwindcss"', () => {
    const code = makeCode({
      styles: `@import "tailwindcss";\n.main { color: red; }`,
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.styles).not.toContain('@import "tailwindcss"')
    expect(result.code.styles).toContain('.main { color: red; }')
  })

  it('應該把 @theme {} 轉為 :root {}', () => {
    const code = makeCode({
      styles: `@theme {\n  --color-primary: #3b82f6;\n}`,
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.styles).toContain(':root')
    expect(result.code.styles).toContain('--color-primary: #3b82f6')
    expect(result.code.styles).not.toContain('@theme')
  })

  it('應該移除 @custom-variant', () => {
    const code = makeCode({
      styles: `@custom-variant dark { &:where(.dark, .dark *) { color: white; } }\n.main { color: red; }`,
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.styles).not.toContain('@custom-variant')
    expect(result.code.styles).toContain('.main { color: red; }')
  })

  it('應該把 @apply font-custom 轉為 CSS font-family', () => {
    const code = makeCode({
      styles: `.heading { @apply font-display; }`,
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.styles).toContain('font-family: var(--font-display, inherit)')
    expect(result.code.styles).not.toContain('@apply font-display')
  })
})

// ============================================================
// Fix 6: Next.js 15 async params
// ============================================================

describe('Fix 6: Next.js 15 async params', () => {
  it('應該把同步 params 轉為 Promise 類型', () => {
    const code = makeCode({
      pages: [makeFile('app/[id]/page.tsx', `export default function Page({ params }: { params: { id: string } }) {\n  return <div>{params.id}</div>\n}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.pages[0].content).toContain('Promise<{ id: string }>')
    expect(result.code.pages[0].content).toContain('async function')
  })

  it('已經是 Promise 類型不應修改', () => {
    const original = `export default async function Page({ params }: { params: Promise<{ id: string }> }) {\n  const { id } = await params\n  return <div>{id}</div>\n}`
    const code = makeCode({
      pages: [makeFile('app/[id]/page.tsx', original)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.pages[0].content).toBe(original)
  })

  it('非 page/layout 檔案不應被修改', () => {
    const original = `export default function Card({ params }: { params: { id: string } }) {\n  return <div>{params.id}</div>\n}`
    const code = makeCode({
      components: [makeFile('components/Card.tsx', original)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.components[0].content).toBe(original)
  })
})

// ============================================================
// Fix 7: useSearchParams Suspense
// ============================================================

describe('Fix 7: useSearchParams Suspense boundary', () => {
  it('page 中的 useSearchParams → 拆分為 Client + Server Component', () => {
    // 用子路徑 page 測試（根路徑 page.tsx 因正則不匹配 /page.tsx 會生成非 HomeClient 名稱）
    const code = makeCode({
      pages: [makeFile('app/search/page.tsx', `'use client'\nimport { useSearchParams } from 'next/navigation'\nexport default function SearchPage() {\n  const params = useSearchParams()\n  return <div>{params.get('q')}</div>\n}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    // page 應該變成 Server Component（包含 Suspense）
    expect(result.code.pages[0].content).toContain('Suspense')
    expect(result.code.pages[0].content).toContain('SearchClient')
    // 應該新增 Client 組件
    const clientComp = result.code.components.find(c => c.path.includes('SearchClient'))
    expect(clientComp).toBeDefined()
    expect(clientComp!.content).toContain('useSearchParams')
    expect(clientComp!.content).toContain("'use client'")
    expect(result.fixes.some(f => f.includes('useSearchParams Suspense'))).toBe(true)
  })

  it('子路徑 page 應該用正確的組件名', () => {
    const code = makeCode({
      pages: [makeFile('app/dashboard/page.tsx', `'use client'\nimport { useSearchParams } from 'next/navigation'\nexport default function Dashboard() {\n  const params = useSearchParams()\n  return <div>Dashboard</div>\n}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.pages[0].content).toContain('DashboardClient')
  })

  it('無 useSearchParams 不應觸發拆分', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `'use client'\nimport { useState } from 'react'\nexport default function Page() { return <div /> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.pages[0].content).not.toContain('Suspense')
    expect(result.fixes.some(f => f.includes('useSearchParams'))).toBe(false)
  })

  it('component 中的 useSearchParams 不應觸發拆分', () => {
    const code = makeCode({
      components: [makeFile('components/Search.tsx', `'use client'\nimport { useSearchParams } from 'next/navigation'\nexport function Search() { const p = useSearchParams(); return <div /> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    // components 不是 pages，不會觸發 Fix 7
    expect(result.fixes.some(f => f.includes('useSearchParams'))).toBe(false)
  })
})

// ============================================================
// Broken imports → stub 生成
// ============================================================

describe('Broken imports → stub 生成', () => {
  it('引用不存在的 @/ 路徑 → 生成 stub 組件', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `import Header from '@/components/Header'\nexport default function Page() { return <Header /> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    const stub = result.code.components.find(c => c.path.includes('Header'))
    expect(stub).toBeDefined()
    expect(stub!.content).toContain('export default function Header')
    expect(result.fixes.some(f => f.includes('broken import') && f.includes('Header'))).toBe(true)
  })

  it('named imports → 生成 named export stub', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `import { Button, Input } from '@/components/ui'\nexport default function Page() { return <><Button /><Input /></> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    const stub = result.code.components.find(c => c.path.includes('ui'))
    expect(stub).toBeDefined()
    expect(stub!.content).toContain('export function Button')
    expect(stub!.content).toContain('export function Input')
  })

  it('引用存在的檔案 → 不生成 stub', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `import Header from '@/components/Header'\nexport default function Page() { return <Header /> }`)],
      components: [makeFile('components/Header.tsx', `export default function Header() { return <header>H</header> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    // components 裡只有原始的 Header，不應有多餘 stub
    expect(result.code.components.length).toBe(1)
    expect(result.fixes.some(f => f.includes('broken import'))).toBe(false)
  })

  it('小寫 import → 生成 const export（非組件）', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `import { cn } from '@/lib/utils'\nexport default function Page() { return <div className={cn('a','b')} /> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    const stub = result.code.components.find(c => c.path.includes('utils'))
    expect(stub).toBeDefined()
    expect(stub!.content).toContain('export const cn')
  })

  it('相對路徑 import 也應處理', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `import Footer from './Footer'\nexport default function Page() { return <Footer /> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    const stub = result.code.components.find(c => c.path.includes('Footer'))
    expect(stub).toBeDefined()
  })
})

// ============================================================
// 依賴掃描
// ============================================================

describe('依賴掃描', () => {
  it('應該偵測 lucide-react', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `import { Search } from 'lucide-react'\nexport default function Page() { return <Search /> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.extraDependencies['lucide-react']).toBeDefined()
  })

  it('應該偵測 @radix-ui 子套件', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `import * as Dialog from '@radix-ui/react-dialog'\nexport default function Page() { return <Dialog.Root /> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.extraDependencies['@radix-ui/react-dialog']).toBeDefined()
  })

  it('應該偵測 recharts', () => {
    const code = makeCode({
      components: [makeFile('components/Chart.tsx', `import { LineChart, Line } from 'recharts'\nexport function Chart() { return <LineChart><Line /></LineChart> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.extraDependencies['recharts']).toBeDefined()
  })

  it('base deps（react/next/motion）不應重複加', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `import React from 'react'\nimport { motion } from 'motion/react'\nexport default function Page() { return <motion.div /> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.extraDependencies['react']).toBeUndefined()
    expect(result.extraDependencies['motion']).toBeUndefined()
  })

  it('L34: 偵測 dynamic import — `await import(\'@vercel/blob\')`（bb0d1081 案例）', () => {
    const code = makeCode({
      pages: [makeFile('app/api/upload/route.ts', `export async function POST() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    return put('x', null as any, { access: 'public' })
  }
}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.extraDependencies['@vercel/blob']).toBeDefined()
    expect(result.extraDependencies['@vercel/blob']).toBe('^0.20.0')
  })

  it('L34: 偵測 dynamic import `import(\'pkg\').then(...)` 寫法', () => {
    const code = makeCode({
      pages: [makeFile('app/api/x/route.ts', `export async function GET() {
  return import('jsonwebtoken').then(jwt => jwt.sign({}, 'secret'))
}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.extraDependencies['jsonwebtoken']).toBeDefined()
  })

  it('未知 @radix-ui 套件使用通用 fallback 版本', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `import * as Foo from '@radix-ui/react-foo'\nexport default function Page() { return <Foo.Root /> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.extraDependencies['@radix-ui/react-foo']).toBe('^1.1.0')
  })
})

// ============================================================
// toVercelSlug
// ============================================================

describe('toVercelSlug', () => {
  it('英文名稱正常轉換', () => {
    expect(toVercelSlug('My Cool Project')).toBe('my-cool-project')
  })

  it('中文名稱 → 用 projectId', () => {
    expect(toVercelSlug('我的專案', 'abc12345-6789-0000-1111-222233334444')).toBe('tc-abc12345')
  })

  it('中文名稱無 projectId → fallback', () => {
    expect(toVercelSlug('我的專案')).toBe('tellcraft-project')
  })

  it('特殊字元應該被替換', () => {
    expect(toVercelSlug('Project!@#$%Test')).toBe('project-test')
  })

  it('長名稱應該被截斷到 30 字', () => {
    const long = 'a'.repeat(50)
    expect(toVercelSlug(long).length).toBeLessThanOrEqual(30)
  })

  it('多個連字號應該合併', () => {
    expect(toVercelSlug('a---b---c')).toBe('a-b-c')
  })

  it('頭尾連字號應該移除', () => {
    expect(toVercelSlug('-hello-world-')).toBe('hello-world')
  })
})

// ============================================================
// Fix 8: root layout 缺少 <html>/<body>
// ============================================================

describe('Fix 8: root layout 缺少 html/body', () => {
  it('Fragment wrapper 應被替換為 html+body', () => {
    const code = makeCode({
      components: [makeFile('app/layout.tsx', `import Header from './Header'
import Footer from './Footer'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    const layout = result.code.components[0].content
    expect(layout).toContain('<html lang="zh-TW">')
    expect(layout).toContain('<body>')
    expect(layout).toContain('</body>')
    expect(layout).toContain('</html>')
    expect(layout).not.toContain('<>')
    expect(layout).not.toContain('</>')
    expect(result.fixes.some(f => f.includes('html') || f.includes('body'))).toBe(true)
  })

  it('已有 html+body 的 layout 不應被修改', () => {
    const original = `export default function Layout({ children }: any) { return <html><body>{children}</body></html> }`
    const code = makeCode({
      pages: [makeFile('app/layout.tsx', original)],
    })
    const result = sanitizeCodeForDeploy(code)
    const layout = result.code.pages[0].content
    expect(layout).toContain('<html>')
    expect(layout).toContain('<body>')
    expect(result.fixes.every(f => !f.includes('自動補上'))).toBe(true)
  })

  it('有 html 但沒 body 應只補 body', () => {
    const code = makeCode({
      components: [makeFile('app/layout.tsx', `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <Header />
      {children}
    </html>
  )
}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    const layout = result.code.components[0].content
    expect(layout).toContain('<body>')
    expect(layout).toContain('</body>')
    expect(result.fixes.some(f => f.includes('<body>'))).toBe(true)
  })

  it('div wrapper 應被替換為 html+body', () => {
    const code = makeCode({
      components: [makeFile('app/layout.tsx', `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    const layout = result.code.components[0].content
    expect(layout).toContain('<html lang="zh-TW">')
    expect(layout).toContain('<body>')
    expect(layout).not.toMatch(/<div className="min-h-screen">/)
  })

  // 路徑變體：漏掉 app/ 前綴
  it('路徑變體：layout.tsx (無 app/ 前綴) 也應被修復', () => {
    const code = makeCode({
      components: [makeFile('layout.tsx', `export default function RootLayout({ children }: any) {
  return (
    <>
      {children}
    </>
  )
}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.components[0].content).toContain('<html lang="zh-TW">')
    expect(result.code.components[0].content).toContain('<body>')
  })

  // 路徑變體：components/app/layout.tsx（LLM 經常放錯）
  it('路徑變體：components/app/layout.tsx 也應被修復', () => {
    const code = makeCode({
      components: [makeFile('components/app/layout.tsx', `export default function RootLayout({ children }: any) {
  return (
    <div>
      {children}
    </div>
  )
}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.components[0].content).toContain('<html lang="zh-TW">')
    expect(result.code.components[0].content).toContain('<body>')
  })

  // 路徑變體：route group
  it('路徑變體：app/(site)/layout.tsx route group 也應被修復', () => {
    const code = makeCode({
      components: [makeFile('app/(site)/layout.tsx', `export default function RootLayout({ children }: any) {
  return (
    <>
      {children}
    </>
  )
}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.components[0].content).toContain('<html lang="zh-TW">')
  })

  // 路徑變體：i18n layout 不應被當 root layout 修改
  it('路徑變體：app/[locale]/layout.tsx (i18n) 不應被修改', () => {
    const original = `export default function LocaleLayout({ children }: any) {
  return <div>{children}</div>
}`
    const code = makeCode({
      components: [makeFile('app/[locale]/layout.tsx', original)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.components[0].content).not.toContain('<html')
    expect(result.code.components[0].content).not.toContain('<body>')
  })

  // 無括號 return
  it('無括號 return <main> 應被修復', () => {
    const code = makeCode({
      components: [makeFile('app/layout.tsx', `export default function RootLayout({ children }: any) {
  return <main className="min-h-screen">{children}</main>
}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    const layout = result.code.components[0].content
    expect(layout).toContain('<html lang="zh-TW">')
    expect(layout).toContain('<body>')
    expect(layout).toContain('<main')
  })

  // 有 html 無 body（多行換行版）
  it('多行 html 標籤但缺 body 應補上', () => {
    const code = makeCode({
      components: [makeFile('app/layout.tsx', `export default function RootLayout({ children }: any) {
  return (
    <html
      lang="zh-TW"
    >
      {children}
    </html>
  )
}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    const layout = result.code.components[0].content
    expect(layout).toContain('<body>')
    expect(layout).toContain('</body>')
  })
})

// ============================================================
// wrapInNextJs — root layout 路徑變體歸位
// ============================================================

describe('wrapInNextJs: root layout 路徑變體歸位', () => {
  it('components 含 app/layout.tsx → 被識別為 custom layout，不塞預設版', () => {
    const code = {
      pages: [],
      components: [makeFile('app/layout.tsx', `export default function RootLayout({children}:any){return <html><body>{children}</body></html>}`)],
      styles: '',
    }
    const files = wrapInNextJs(code, 'test-proj', '', {})
    const layouts = files.filter(f => f.file === 'app/layout.tsx')
    expect(layouts).toHaveLength(1)
    expect(layouts[0].data).toContain('<html><body>')
    // 不應有預設版（預設版帶 "Built with Tellcraft"）
    expect(layouts[0].data).not.toContain('Built with Tellcraft')
  })

  it('components 含 layout.tsx (無 app/ 前綴) → 應強制歸位到 app/layout.tsx', () => {
    const code = {
      pages: [],
      components: [makeFile('layout.tsx', `export default function RootLayout({children}:any){return <html><body>{children}</body></html>}`)],
      styles: '',
    }
    const files = wrapInNextJs(code, 'test-proj', '', {})
    // 用戶 layout 應該在 app/layout.tsx 而不是根目錄 layout.tsx
    const rootLayouts = files.filter(f => f.file === 'layout.tsx')
    expect(rootLayouts).toHaveLength(0)
    const appLayouts = files.filter(f => f.file === 'app/layout.tsx')
    expect(appLayouts).toHaveLength(1)
    expect(appLayouts[0].data).toContain('<html><body>')
    // 不應產生預設 layout（覆蓋用戶版）
    expect(appLayouts[0].data).not.toContain('Built with Tellcraft')
  })

  it('components 含 components/app/layout.tsx → 應歸位到 app/layout.tsx', () => {
    const code = {
      pages: [],
      components: [makeFile('components/app/layout.tsx', `export default function RootLayout({children}:any){return <html lang="zh-TW"><body>{children}</body></html>}`)],
      styles: '',
    }
    const files = wrapInNextJs(code, 'test-proj', '', {})
    const appLayouts = files.filter(f => f.file === 'app/layout.tsx')
    expect(appLayouts).toHaveLength(1)
    expect(appLayouts[0].data).toContain('lang="zh-TW"')
  })

  it('完全沒 layout → 塞預設 app/layout.tsx', () => {
    const code = {
      pages: [makeFile('app/page.tsx', 'export default function Page(){return <div>Hi</div>}')],
      components: [],
      styles: '',
    }
    const files = wrapInNextJs(code, 'my-site', '', {})
    const layouts = files.filter(f => f.file === 'app/layout.tsx')
    expect(layouts).toHaveLength(1)
    expect(layouts[0].data).toContain('my-site')
    expect(layouts[0].data).toContain('Built with Tellcraft')
  })
})

// ============================================================
// Coder Skill 後端依賴偵測
// ============================================================

describe('Coder Skill 後端依賴偵測', () => {
  it('應該偵測 bcryptjs 和 jsonwebtoken 為 extraDependencies', () => {
    const code = makeCode({
      components: [makeFile('lib/actions/manage-auth.ts',
        `import { hash, compare } from 'bcryptjs'\nimport jwt from 'jsonwebtoken'\nexport async function manageAuth() {}`
      )],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.extraDependencies['bcryptjs']).toBeDefined()
    expect(result.extraDependencies['jsonwebtoken']).toBeDefined()
  })

  it('不應該對 use server 檔案加入 use client', () => {
    const code = makeCode({
      components: [makeFile('app/actions/auth.ts',
        `'use server'\n\nimport { manageAuth } from '@/lib/actions/manage-auth'\n\nexport async function manageAuthAction(input: any) { return manageAuth(input) }`
      )],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.code.components[0].content).toMatch(/^'use server'/)
    expect(result.code.components[0].content).not.toContain("'use client'")
  })
})

// ============================================================
// Fix 9: Image Library 白名單校驗 + ImageCredits 注入
// ============================================================

function makeUnsplashLibrary(): ImageLibrary {
  return {
    productType: 'restaurant',
    generatedAt: Date.now(),
    source: 'unsplash',
    hero: [
      {
        url: 'https://images.unsplash.com/photo-ABC123?w=1280&h=720&fit=crop',
        rawUrl: 'https://images.unsplash.com/photo-ABC123',
        width: 1280, height: 720,
        alt: 'restaurant interior', category: 'hero',
        photographer: {
          name: 'Alice Wang',
          profileUrl: 'https://unsplash.com/@alice?utm_source=tellcraft&utm_medium=referral',
        },
        sourceId: 'ABC123',
        downloadLocation: 'https://api.unsplash.com/photos/ABC123/download',
      },
    ],
    product: [
      {
        url: 'https://images.unsplash.com/photo-DEF456?w=800&h=600&fit=crop',
        rawUrl: 'https://images.unsplash.com/photo-DEF456',
        width: 800, height: 600,
        alt: 'plated dish', category: 'product',
        photographer: {
          name: 'Bob Chen',
          profileUrl: 'https://unsplash.com/@bob?utm_source=tellcraft&utm_medium=referral',
        },
        sourceId: 'DEF456',
        downloadLocation: 'https://api.unsplash.com/photos/DEF456/download',
      },
    ],
    team: [], background: [], lifestyle: [], detail: [],
  }
}

describe('Fix 9: Image whitelist', () => {
  it('合法 Unsplash URL（白名單內）→ 不動', () => {
    const lib = makeUnsplashLibrary()
    const code = makeCode({
      pages: [makeFile('app/page.tsx',
        `export default function Page() { return <img src="https://images.unsplash.com/photo-ABC123?w=1280&h=720&fit=crop" alt="hero" /> }`)],
    })
    const result = applyImageLibraryToDeployCode(code, lib)
    expect(result.code.pages[0].content).toContain('photo-ABC123')
    expect(result.fixes.some(f => f.includes('whitelist 替換'))).toBe(false)
  })

  it('偽造 Unsplash URL（非白名單）→ 替換為同分類白名單第一張', () => {
    const lib = makeUnsplashLibrary()
    const code = makeCode({
      pages: [makeFile('app/page.tsx',
        `export default function Page() { return <img src="https://images.unsplash.com/photo-FAKE999" className="hero" alt="x" /> }`)],
    })
    const result = applyImageLibraryToDeployCode(code, lib)
    expect(result.code.pages[0].content).toContain('photo-ABC123')
    expect(result.code.pages[0].content).not.toContain('photo-FAKE999')
    expect(result.fixes.some(f => f.includes('whitelist 替換'))).toBe(true)
  })

  it('picsum URL → 不動（只攔 Unsplash）', () => {
    const lib = makeUnsplashLibrary()
    const code = makeCode({
      pages: [makeFile('app/page.tsx',
        `export default function Page() { return <img src="https://picsum.photos/seed/x/800/600" alt="x" /> }`)],
    })
    const result = applyImageLibraryToDeployCode(code, lib)
    expect(result.code.pages[0].content).toContain('picsum.photos')
  })

  it('library=null → 不做任何事（合法與偽造 URL 都保留）', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx',
        `<img src="https://images.unsplash.com/photo-XXX" />`)],
    })
    const result = applyImageLibraryToDeployCode(code, null)
    expect(result.fixes).toHaveLength(0)
    expect(result.injectedFile).toBeNull()
  })

  it('picsum fallback library → 不生成 ImageCredits', () => {
    const lib = buildPicsumFallbackLibrary('restaurant')
    const code = makeCode({
      pages: [makeFile('app/page.tsx',
        `<img src="${lib.hero[0].url}" alt="x" />`)],
    })
    const result = applyImageLibraryToDeployCode(code, lib)
    expect(result.injectedFile).toBeNull()
  })

  it('代碼使用 Unsplash 圖 → 生成 ImageCredits 並含 photographer', () => {
    const lib = makeUnsplashLibrary()
    const code = makeCode({
      pages: [makeFile('app/page.tsx',
        `<img src="https://images.unsplash.com/photo-ABC123?w=1280" /><img src="https://images.unsplash.com/photo-DEF456?w=800" />`)],
    })
    const result = applyImageLibraryToDeployCode(code, lib)
    expect(result.injectedFile).not.toBeNull()
    expect(result.injectedFile!.file).toBe('components/ImageCredits.tsx')
    expect(result.injectedFile!.data).toContain('Alice Wang')
    expect(result.injectedFile!.data).toContain('Bob Chen')
    expect(result.injectedFile!.data).toContain('utm_source=tellcraft')
    expect(result.downloadLocations.length).toBeGreaterThan(0)
  })

  it('只使用部分圖 → ImageCredits 只列 used photographer', () => {
    const lib = makeUnsplashLibrary()
    const code = makeCode({
      pages: [makeFile('app/page.tsx',
        `<img src="https://images.unsplash.com/photo-ABC123?w=1280" />`)],
    })
    const result = applyImageLibraryToDeployCode(code, lib)
    expect(result.injectedFile!.data).toContain('Alice Wang')
    expect(result.injectedFile!.data).not.toContain('Bob Chen')
  })
})

// ============================================================
// wrapInNextJs：ImageCredits 注入到 layout
// ============================================================

describe('wrapInNextJs: ImageCredits 注入 layout', () => {
  it('無 ImageCredits injectedFile → layout 保持乾淨', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `export default function Page() { return <div>hi</div> }`)],
    })
    const files = wrapInNextJs(code, 'test-app', '', undefined, [])
    const layout = files.find(f => f.file === 'app/layout.tsx')!
    expect(layout.data).not.toContain('ImageCredits')
  })

  it('ImageCredits injectedFile 存在 → layout 自動 import + 渲染 <ImageCredits />', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `export default function Page() { return <div>hi</div> }`)],
    })
    const injected = [{
      file: 'components/ImageCredits.tsx',
      data: `export default function ImageCredits() { return <div>credits</div> }`,
    }]
    const files = wrapInNextJs(code, 'test-app', '', undefined, injected)
    const layout = files.find(f => f.file === 'app/layout.tsx')!
    expect(layout.data).toContain(`import ImageCredits from '@/components/ImageCredits'`)
    expect(layout.data).toContain('<ImageCredits />')
    expect(layout.data).toContain('</body>')
    // ImageCredits 應在 </body> 前
    const creditsIdx = layout.data.indexOf('<ImageCredits />')
    const bodyCloseIdx = layout.data.indexOf('</body>')
    expect(creditsIdx).toBeGreaterThan(0)
    expect(creditsIdx).toBeLessThan(bodyCloseIdx)
  })
})

// ============================================================
// next.config.ts: remotePatterns 三個 host
// ============================================================

describe('next.config.ts remotePatterns', () => {
  it('允許 picsum.photos / images.unsplash.com / placehold.co', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `export default function Page() { return <div /> }`)],
    })
    const files = wrapInNextJs(code, 'test-app', '', undefined, [])
    const config = files.find(f => f.file === 'next.config.ts')!
    expect(config.data).toContain(`hostname: 'picsum.photos'`)
    expect(config.data).toContain(`hostname: 'images.unsplash.com'`)
    expect(config.data).toContain(`hostname: 'placehold.co'`)
  })
})

// ============================================================
// Fix 2.8: 重複 className attribute 合併
// ============================================================

describe('Fix 2.8: duplicate className attribute', () => {
  it('合併同一 button 上的兩個 className', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `'use client'
export default function Page() {
  return (
    <button className="focus-visible:ring-2"
      onClick={() => {}}
      className="flex-1 rounded-lg"
    >
      點我
    </button>
  )
}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    const fixed = result.code.pages[0].content
    // 應該合併成單一 className，包含兩邊的 class
    expect(fixed).toContain('focus-visible:ring-2 flex-1 rounded-lg')
    // 不應該再有兩個 className=
    const classNameCount = (fixed.match(/className="/g) || []).length
    expect(classNameCount).toBe(1)
    // 修復記錄應該被加入
    expect(result.fixes.some(f => f.includes('重複的 className'))).toBe(true)
  })

  it('處理三個 className 出現在同一個 tag（多輪迭代）', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `'use client'
export default function Page() {
  return <div className="a" id="x" className="b" data-x="1" className="c">x</div>
}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    const fixed = result.code.pages[0].content
    expect(fixed).toMatch(/className="a b c"/)
    const classNameCount = (fixed.match(/className="/g) || []).length
    expect(classNameCount).toBe(1)
  })

  it('單一 className 不被誤改', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `'use client'
export default function Page() {
  return <div className="a b c">x</div>
}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    const fixed = result.code.pages[0].content
    expect(fixed).toContain('className="a b c"')
    expect(result.fixes.some(f => f.includes('重複的 className'))).toBe(false)
  })

  it('多行展開的 button 也能正確合併', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `'use client'
export default function Page() {
  return (
    <button className="focus-visible:ring-2 focus-visible:ring-offset-2"
      onClick={() => {}}
      aria-label="編輯"
      className="flex-1 rounded-lg cursor-pointer"
      style={{ minHeight: 44 }}
    >
      編輯
    </button>
  )
}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    const fixed = result.code.pages[0].content
    expect(fixed).toContain('focus-visible:ring-2 focus-visible:ring-offset-2 flex-1 rounded-lg cursor-pointer')
    const classNameCount = (fixed.match(/className="/g) || []).length
    expect(classNameCount).toBe(1)
    // 其他 attributes 應該保留
    expect(fixed).toContain('aria-label="編輯"')
    expect(fixed).toContain('onClick={() => {}}')
  })

  it('後端檔案不處理（lib/actions/...）', () => {
    // backend 檔通常沒 className，但若 LLM 生成奇怪內容也不該被改
    const code = makeCode({
      pages: [makeFile('lib/actions/foo.ts', `'use server'\nexport async function foo() { return { className: 'a className: b' } }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    // sanitize 不應該動 lib/ 檔案（即便這個 case 已經是無關 JSX 場景）
    expect(result.fixes.some(f => f.includes('lib/actions/foo.ts: 合併'))).toBe(false)
  })
})

// ============================================================
// A: deriveSmokeTestPaths — 從 file 列表推導 smoke test 路徑
// ============================================================

describe('A: deriveSmokeTestPaths', () => {
  function vf(file: string) {
    return { file, data: '' }
  }

  it('一定包含根頁 /', () => {
    const paths = deriveSmokeTestPaths([vf('app/page.tsx')])
    expect(paths).toContain('/')
  })

  it('掃出所有 admin/* 子頁', () => {
    const paths = deriveSmokeTestPaths([
      vf('app/page.tsx'),
      vf('app/admin/services/page.tsx'),
      vf('app/admin/hero-section/page.tsx'),
      vf('app/admin/login/page.tsx'),
    ])
    expect(paths).toContain('/')
    expect(paths).toContain('/admin/services')
    expect(paths).toContain('/admin/hero-section')
    expect(paths).toContain('/admin/login')
  })

  it('route group (auth) 在 URL 上不出現', () => {
    const paths = deriveSmokeTestPaths([
      vf('app/page.tsx'),
      vf('app/(auth)/admin/login/page.tsx'),
    ])
    expect(paths).toContain('/admin/login')
    expect(paths.some(p => p.includes('(auth)'))).toBe(false)
  })

  it('dynamic 段 [id] 跳過（無真實值無法打）', () => {
    const paths = deriveSmokeTestPaths([
      vf('app/page.tsx'),
      vf('app/admin/services/[id]/page.tsx'),
      vf('app/admin/services/page.tsx'),
    ])
    expect(paths).toContain('/admin/services')
    expect(paths.some(p => p.includes('[id]'))).toBe(false)
  })

  it('i18n locale prefix 自動補 /zh', () => {
    const paths = deriveSmokeTestPaths([
      vf('app/[locale]/page.tsx'),
      vf('app/[locale]/admin/services/page.tsx'),
    ])
    expect(paths).toContain('/zh/')
    expect(paths).toContain('/zh/admin/services')
  })

  it('admin/login 排到清單末尾（靜態頁優先級最低）', () => {
    const paths = deriveSmokeTestPaths([
      vf('app/page.tsx'),
      vf('app/admin/login/page.tsx'),
      vf('app/admin/services/page.tsx'),
    ])
    const idxLogin = paths.indexOf('/admin/login')
    const idxServices = paths.indexOf('/admin/services')
    expect(idxServices).toBeLessThan(idxLogin)
  })

  it('上限 12 條', () => {
    const files = Array.from({ length: 30 }, (_, i) => vf(`app/admin/page-${i}/page.tsx`))
    files.unshift(vf('app/page.tsx'))
    const paths = deriveSmokeTestPaths(files)
    expect(paths.length).toBeLessThanOrEqual(12)
  })
})

// ============================================================
// B: scanProcessEnvReferences — env 引用掃描
// ============================================================

describe('B: scanProcessEnvReferences', () => {
  function vf(file: string, data: string) {
    return { file, data }
  }

  it('掃出 lib/ 內所有 process.env.X 引用', () => {
    const files = [
      vf('lib/db.ts', `if (!process.env.DATABASE_URL) throw new Error('x')`),
      vf('lib/email.ts', `const key = process.env.RESEND_API_KEY`),
    ]
    const report = scanProcessEnvReferences(files, new Set())
    expect(report.referenced).toContain('DATABASE_URL')
    expect(report.referenced).toContain('RESEND_API_KEY')
  })

  it('區別 missing vs injected', () => {
    const files = [
      vf('lib/db.ts', `process.env.DATABASE_URL`),
      vf('lib/payment.ts', `process.env.STRIPE_SECRET_KEY`),
    ]
    const report = scanProcessEnvReferences(files, new Set(['DATABASE_URL']))
    expect(report.missing).toEqual(['STRIPE_SECRET_KEY'])
    expect(report.missingCritical).toEqual([])
  })

  it('DATABASE_URL 缺失 → missingCritical', () => {
    const files = [vf('lib/db.ts', `process.env.DATABASE_URL`)]
    const report = scanProcessEnvReferences(files, new Set())
    expect(report.missingCritical).toContain('DATABASE_URL')
  })

  it('Vercel 自動提供的 env (NODE_ENV / VERCEL_URL) 不算 missing', () => {
    const files = [
      vf('lib/foo.ts', `if (process.env.NODE_ENV === 'production') console.log(process.env.VERCEL_URL)`),
    ]
    const report = scanProcessEnvReferences(files, new Set())
    expect(report.missing).not.toContain('NODE_ENV')
    expect(report.missing).not.toContain('VERCEL_URL')
  })

  it('支援 process.env["KEY"] bracket 寫法', () => {
    const files = [vf('lib/foo.ts', `const x = process.env['MY_API_KEY']`)]
    const report = scanProcessEnvReferences(files, new Set())
    expect(report.referenced).toContain('MY_API_KEY')
  })

  it('Tellcraft 內部 env (NEON_API_KEY 等) 不報 missing', () => {
    // 客戶 app 不該 reference 這些；若 LLM 誤生成不該因此 fail
    const files = [vf('lib/foo.ts', `const t = process.env.NEON_API_KEY`)]
    const report = scanProcessEnvReferences(files, new Set())
    expect(report.missing).not.toContain('NEON_API_KEY')
  })

  it('L36: JWT_SECRET 是客戶 app 合法 env（admin login 簽 token 用）', () => {
    // 之前誤列入 TELLCRAFT_INTERNAL 導致 deployer skip 注入 → admin login throw
    // 現在應被視為合法 reference，且 deployer 自動注入到 Vercel
    const files = [vf('lib/actions/admin-login.ts', `const jwtSecret = process.env.JWT_SECRET`)]
    const report = scanProcessEnvReferences(files, new Set())
    expect(report.referenced).toContain('JWT_SECRET')
    expect(report.missing).toContain('JWT_SECRET')
  })

  it('只掃 runtime 路徑（lib/, app/）', () => {
    const files = [
      vf('scripts/build.ts', `process.env.SCRIPT_ONLY_KEY`),  // 不算
      vf('lib/db.ts', `process.env.DATABASE_URL`),
    ]
    const report = scanProcessEnvReferences(files, new Set())
    expect(report.referenced).not.toContain('SCRIPT_ONLY_KEY')
    expect(report.referenced).toContain('DATABASE_URL')
  })
})

// ============================================================
// C: page.tsx 跨界 import server-only 模組
// ============================================================

describe('C: page 跨界 import server-only', () => {
  it('page.tsx import @/lib/actions/foo → 自動改寫成 @/app/actions/foo', () => {
    const code = makeCode({
      pages: [makeFile('app/admin/services/page.tsx', `'use client'
import { useState, useEffect } from 'react'
import { getServicesSection } from '@/lib/actions/get-services-section'
export default function Page() {
  return <div>x</div>
}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    const fixed = result.code.pages[0].content
    expect(fixed).toContain(`from '@/app/actions/get-services-section'`)
    expect(fixed).not.toContain(`from '@/lib/actions/get-services-section'`)
    // 函數名要加 Action 後綴
    expect(fixed).toContain('getServicesSectionAction')
    expect(result.fixes.some(f => f.includes('Server Component 防護'))).toBe(true)
  })

  it('page.tsx 直接 import @/lib/db → 警告', () => {
    const code = makeCode({
      pages: [makeFile('app/admin/dashboard/page.tsx', `import { sql } from '@/lib/db'
export default async function Page() {
  const rows = await sql\`SELECT 1\`
  return <div>{rows.length}</div>
}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.fixes.some(f => f.includes('直接 import @/lib/db'))).toBe(true)
  })

  it('正常 page.tsx import @/app/actions/* 不觸發改寫', () => {
    const code = makeCode({
      pages: [makeFile('app/admin/services/page.tsx', `'use client'
import { getServicesSectionAction } from '@/app/actions/_services_section'
export default function Page() { return <div>x</div> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.fixes.some(f => f.includes('Server Component 防護'))).toBe(false)
  })

  it('非 page.tsx 檔案不觸發（component 可以直接用 lib/actions）', () => {
    const code = makeCode({
      components: [makeFile('components/Foo.tsx', `import { foo } from '@/lib/actions/foo'\nexport default function Foo() {}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.fixes.some(f => f.includes('Server Component 防護'))).toBe(false)
  })
})

// ============================================================
// E: extractReferencedTables — schema 對照前置抽表
// ============================================================

describe('E: extractReferencedTables', () => {
  function vf(file: string, data: string) {
    return { file, data }
  }

  it('抽出 lib/actions/*.ts 內所有 FROM <table>', () => {
    const files = [
      vf('lib/actions/get-hero.ts', `await sql\`SELECT * FROM hero_section LIMIT 1\``),
      vf('lib/actions/list-items.ts', `await sql\`SELECT id FROM service_items WHERE x = \${y}\``),
    ]
    const tables = extractReferencedTables(files)
    expect(tables).toContain('hero_section')
    expect(tables).toContain('service_items')
  })

  it('包含 INSERT INTO 與 UPDATE 表名', () => {
    const files = [
      vf('lib/actions/create.ts', `await sql\`INSERT INTO contact_inquiries (id) VALUES ($1)\``),
      vf('lib/actions/update.ts', `await sql\`UPDATE pricing_section SET title = $1\``),
    ]
    const tables = extractReferencedTables(files)
    expect(tables).toContain('contact_inquiries')
    expect(tables).toContain('pricing_section')
  })

  it('忽略 pg_* / information_schema 系統表', () => {
    const files = [
      vf('lib/actions/admin.ts', `await sql\`SELECT * FROM pg_tables WHERE schemaname = 'public'\``),
    ]
    const tables = extractReferencedTables(files)
    expect(tables).not.toContain('pg_tables')
  })

  it('忽略 SQL 關鍵字（VALUES / SELECT / WHERE）誤抓', () => {
    const files = [
      vf('lib/actions/x.ts', `await sql\`INSERT INTO foo VALUES ($1, $2)\``),
    ]
    const tables = extractReferencedTables(files)
    expect(tables).toContain('foo')
    expect(tables).not.toContain('values')
    expect(tables).not.toContain('select')
  })

  it('lib/db.ts 與 client component 不掃（只掃 actions/api routes）', () => {
    const files = [
      vf('lib/db.ts', `sql\`FROM dummy_table\``),
      vf('app/page.tsx', `sql\`FROM should_not_appear\``),
      vf('lib/actions/foo.ts', `sql\`FROM real_table\``),
    ]
    const tables = extractReferencedTables(files)
    expect(tables).toEqual(['real_table'])
  })

  it('去重相同表名', () => {
    const files = [
      vf('lib/actions/get.ts', `sql\`FROM hero_section\``),
      vf('lib/actions/update.ts', `sql\`UPDATE hero_section SET ...\``),
    ]
    const tables = extractReferencedTables(files)
    expect(tables.filter(t => t === 'hero_section').length).toBe(1)
  })

  it('L35: 不抓字串字面值如 _stepSummary 中的「Update Page Section」(bb0d1081 case)', () => {
    // 真實 Coder 生成的 route.ts pattern：呼叫 Server Action 帶 _stepSummary
    // 之前 regex 在這段 string literal 上撞到 `UPDATE Page` / `Update Site` 等
    // 誤判 deployer 報「Neon 缺表 page/site/pricing」假錯誤（bb0d1081 案例）
    const files = [
      vf('app/api/update_page_section/route.ts', `
import { updatePageSection } from '@/lib/actions/update-page-section'
export async function PUT(req) {
  const body = await req.json()
  const result = await updatePageSection({ _stepSummary: 'Update Page Section', ...body })
  return NextResponse.json(result)
}`),
      vf('app/api/update_site_setting/route.ts', `
  await updateSiteSetting({ _stepSummary: 'Update Site Setting', ...body })`),
      vf('app/api/update_pricing_plan/route.ts', `
  await updatePricingPlan({ _stepSummary: 'Update Pricing Plan', ...body })`),
    ]
    const tables = extractReferencedTables(files)
    expect(tables).not.toContain('page')
    expect(tables).not.toContain('site')
    expect(tables).not.toContain('pricing')
    expect(tables).toEqual([])  // 沒任何 sql template，應該返回空
  })

  it('L35: sql template 內仍正確抓 + 字串字面值不干擾', () => {
    const files = [
      vf('lib/actions/update-page.ts', `
export async function updatePageSection(input: any) {
  const stepSummary = 'Update Page Section'  // 這應該被忽略
  await sql\`UPDATE page_sections SET title = \${input.title}\`  // 這應該抓到 page_sections
}`),
    ]
    const tables = extractReferencedTables(files)
    expect(tables).toContain('page_sections')
    expect(tables).not.toContain('page')
  })
})

// ============================================================
// H: dedupeRedundantWhereClauses — lib/actions SQL 重複 WHERE 兜底
// ============================================================

describe('H: lib/actions SQL 重複 WHERE 兜底掃描', () => {
  it('移除同欄位 = 比較的重複 AND 條件', () => {
    const buggyCode = `import { sql } from '@/lib/db'
export async function listServiceItems(input: any) {
  const servicesSectionId = input.servicesSectionId
  const rows = await sql\`
    SELECT * FROM service_items
    WHERE services_section_id = \${servicesSectionId}
      AND services_section_id = \${input.servicesSectionId}
    ORDER BY sort_order ASC
  \`
  return rows
}`
    const code = makeCode({
      pages: [makeFile('lib/actions/list-service-items.ts', buggyCode)],
    })
    const result = sanitizeCodeForDeploy(code)
    const fixed = result.code.pages[0].content
    // 應該只剩一個 services_section_id 條件
    const sscount = (fixed.match(/services_section_id\s*=/g) || []).length
    expect(sscount).toBe(1)
    expect(result.fixes.some(f => f.includes('重複的 WHERE'))).toBe(true)
  })

  it('保留不同欄位的多條件 AND', () => {
    const cleanCode = `import { sql } from '@/lib/db'
export async function listFiltered(input: any) {
  const rows = await sql\`
    SELECT * FROM items
    WHERE user_id = \${input.userId}
      AND status = \${input.status}
  \`
  return rows
}`
    const code = makeCode({
      pages: [makeFile('lib/actions/list-filtered.ts', cleanCode)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.fixes.some(f => f.includes('重複的 WHERE'))).toBe(false)
    // user_id 與 status 都應該保留
    const fixed = result.code.pages[0].content
    expect(fixed).toMatch(/user_id\s*=/)
    expect(fixed).toMatch(/status\s*=/)
  })

  it('不影響非 lib/actions 檔案', () => {
    const code = makeCode({
      pages: [makeFile('app/page.tsx', `'use client'\nconst x = 'WHERE col = \${1} AND col = \${2}'\nexport default function Page() { return <div /> }`)],
    })
    const result = sanitizeCodeForDeploy(code)
    expect(result.fixes.some(f => f.includes('重複的 WHERE'))).toBe(false)
  })

  it('多個 sql block 各自獨立去重', () => {
    const code = makeCode({
      pages: [makeFile('lib/actions/multi.ts', `import { sql } from '@/lib/db'
export async function multi(input: any) {
  const a = await sql\`SELECT * FROM t WHERE id = \${input.id} AND id = \${input.id}\`
  const b = await sql\`SELECT * FROM u WHERE foo = \${input.foo} AND foo = \${input.foo}\`
  return { a, b }
}`)],
    })
    const result = sanitizeCodeForDeploy(code)
    const fixed = result.code.pages[0].content
    // 兩個 sql block 各自有重複，應該各被去一次
    expect(result.fixes.filter(f => f.includes('重複的 WHERE')).length).toBeGreaterThanOrEqual(1)
    // 第一個 sql：id 只剩一個
    const block1Match = fixed.match(/SELECT \* FROM t[^`]*/)
    expect(block1Match![0].match(/id\s*=/g)!.length).toBe(1)
  })
})

// ============================================================
// K: checkPageActionContract — page → action 參數契約
// ============================================================

describe('K: checkPageActionContract', () => {
  function vf(file: string, data: string) {
    return { file, data }
  }

  it('偵測 page 呼叫 xxxAction({}) 但 action 需要 input.id', () => {
    const files = [
      vf('lib/actions/get-order.ts', `
export async function getOrder(input: any) {
  const id = input.id
  if (!id) throw new Error('missing id')
  return { __status: 200 }
}`),
      vf('app/admin/orders/page.tsx', `'use client'
import { getOrderAction } from '@/app/actions/_order'
useEffect(() => {
  getOrderAction({})
}, [])`),
    ]
    const result = checkPageActionContract(files)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toContain('getOrderAction')
    expect(result.warnings[0]).toContain('id')
  })

  it('正確傳完所有 required keys 不警告', () => {
    const files = [
      vf('lib/actions/get-order.ts', `
export async function getOrder(input: any) {
  const id = input.id
  return { id }
}`),
      vf('app/admin/orders/page.tsx', `'use client'
useEffect(() => {
  getOrderAction({ id: '123', _stepSummary: 'Get Order' })
}, [])`),
    ]
    const result = checkPageActionContract(files)
    expect(result.warnings).toEqual([])
  })

  it('忽略 _stepSummary / userId（會自動注入）', () => {
    const files = [
      vf('lib/actions/list-items.ts', `
export async function listItems(input: any) {
  if (!input._stepSummary) return null
  if (!input.userId) return null
  return { items: [] }
}`),
      vf('app/admin/items/page.tsx', `useEffect(() => { listItemsAction({}) })`),
    ]
    const result = checkPageActionContract(files)
    // _stepSummary 與 userId 應自動排除，無警告
    expect(result.warnings).toEqual([])
  })

  it('保守 skip：spread 與 conditional 參數', () => {
    const files = [
      vf('lib/actions/update.ts', `
export async function update(input: any) {
  const id = input.id
  const title = input.title
  return { id, title }
}`),
      vf('app/admin/page.tsx', `useEffect(() => {
  updateAction({ ...form })
})`),
    ]
    const result = checkPageActionContract(files)
    // spread 無法分析，保守不警告
    expect(result.warnings).toEqual([])
  })

  it('多個 required keys 都列出', () => {
    const files = [
      vf('lib/actions/create.ts', `
export async function create(input: any) {
  const a = input.fieldA
  const b = input.fieldB
  const c = input.fieldC
  return { a, b, c }
}`),
      vf('app/admin/new/page.tsx', `createAction({ fieldA: 'x' })`),
    ]
    const result = checkPageActionContract(files)
    expect(result.warnings.length).toBe(1)
    expect(result.warnings[0]).toContain('fieldB')
    expect(result.warnings[0]).toContain('fieldC')
    expect(result.warnings[0]).not.toMatch(/fieldA(?=[^\w])/)  // fieldA 已傳，不該在 missing 裡
  })
})

