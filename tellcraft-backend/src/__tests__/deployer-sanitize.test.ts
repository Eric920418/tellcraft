import { describe, it, expect } from 'vitest'
import { sanitizeCodeForDeploy, toVercelSlug, wrapInNextJs, applyImageLibraryToDeployCode } from '../services/deployer'
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
