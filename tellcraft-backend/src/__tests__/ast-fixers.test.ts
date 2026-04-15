// ============================================================
// AST Fixers Unit Tests
// 測試 src/lib/ast/fixers.ts 的 3 類 AST fixer
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  ensureReactHooksImports,
  fixNext15AsyncParams,
  splitPageForSuspense,
} from '../lib/ast/fixers'

describe('ensureReactHooksImports', () => {
  it('補齊 useState / useEffect 缺失 import', async () => {
    const code = `'use client'

export default function Dashboard() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    console.log(count)
  }, [count])
  return <div>{count}</div>
}
`
    const result = await ensureReactHooksImports(code, 'app/dashboard/page.tsx')
    expect(result).not.toBeNull()
    expect(result!.repaired).toBe(true)
    expect(result!.content).toMatch(/import\s*\{[^}]*useState[^}]*useEffect[^}]*\}\s*from\s*["']react["']/)
    expect(result!.detail).toContain('useState')
    expect(result!.detail).toContain('useEffect')
  })

  it('已有 react import → 補入缺失 hooks', async () => {
    const code = `'use client'
import { useState } from 'react'

export default function Dashboard() {
  const [c, setC] = useState(0)
  const ref = useRef(null)
  return <div ref={ref}>{c}</div>
}
`
    const result = await ensureReactHooksImports(code, 'app/dashboard/page.tsx')
    expect(result).not.toBeNull()
    expect(result!.repaired).toBe(true)
    expect(result!.content).toMatch(/import\s*\{[^}]*useState[^}]*useRef[^}]*\}\s*from\s*['"]react['"]/)
  })

  it('完整 hooks 已 import → no-op', async () => {
    const code = `'use client'
import { useState, useEffect } from 'react'

export default function X() {
  const [c] = useState(0)
  useEffect(() => {}, [])
  return <div>{c}</div>
}
`
    const result = await ensureReactHooksImports(code, 'app/x/page.tsx')
    expect(result).not.toBeNull()
    expect(result!.repaired).toBe(false)
  })

  it('沒使用任何 hook → no-op', async () => {
    const code = `export default function Static() { return <div>hi</div> }`
    const result = await ensureReactHooksImports(code, 'app/static/page.tsx')
    expect(result).not.toBeNull()
    expect(result!.repaired).toBe(false)
  })
})

describe('fixNext15AsyncParams', () => {
  it('將 params: { id: string } 包裝為 Promise + 加 async + 插入 await 解構', async () => {
    const code = `export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>
}
`
    const result = await fixNext15AsyncParams(code, 'app/users/[id]/page.tsx')
    expect(result).not.toBeNull()
    expect(result!.repaired).toBe(true)
    expect(result!.content).toMatch(/Promise<\{[^}]*id:\s*string/)
    expect(result!.content).toMatch(/async\s+function/)
    expect(result!.content).toContain('const { id } = await params')
  })

  it('已是 async function 不重複加 async', async () => {
    const code = `export default async function Page({ params }: { params: { slug: string } }) {
  return <div>{params.slug}</div>
}
`
    const result = await fixNext15AsyncParams(code, 'app/posts/[slug]/page.tsx')
    expect(result).not.toBeNull()
    expect(result!.repaired).toBe(true)
    const asyncCount = (result!.content.match(/async/g) || []).length
    expect(asyncCount).toBe(1)
  })

  it('已是 Promise<...> → no-op', async () => {
    const code = `export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <div>{id}</div>
}
`
    const result = await fixNext15AsyncParams(code, 'app/users/[id]/page.tsx')
    expect(result).not.toBeNull()
    expect(result!.repaired).toBe(false)
  })

  it('非 page/layout 檔案跳過', async () => {
    const code = `export function helper({ params }: { params: { id: string } }) {
  return params.id
}
`
    const result = await fixNext15AsyncParams(code, 'lib/helper.ts')
    expect(result).not.toBeNull()
    expect(result!.repaired).toBe(false)
  })
})

describe('splitPageForSuspense', () => {
  it('偵測到 useSearchParams 抽出 Client component', async () => {
    const code = `'use client'
import { useSearchParams } from 'next/navigation'

export default function Search() {
  const sp = useSearchParams()
  return <div>{sp.get('q')}</div>
}
`
    const result = await splitPageForSuspense(code, 'app/search/page.tsx')
    expect(result).not.toBeNull()
    expect(result!.clientComponentName).toBe('SearchClient')
    expect(result!.clientComponentPath).toBe('app/search/SearchClient.tsx')
    expect(result!.pageContent).toContain('<Suspense')
    expect(result!.pageContent).toContain('import SearchClient from \'./SearchClient\'')
    expect(result!.clientComponentContent).toContain("'use client'")
    expect(result!.clientComponentContent).toContain('SearchClient')
  })

  it('root page.tsx 推導為 HomeClient', async () => {
    const code = `'use client'
import { useSearchParams } from 'next/navigation'

export default function Home() {
  useSearchParams()
  return <div>home</div>
}
`
    const result = await splitPageForSuspense(code, 'app/page.tsx')
    expect(result).not.toBeNull()
    expect(result!.clientComponentName).toBe('HomeClient')
    expect(result!.clientComponentPath).toBe('app/HomeClient.tsx')
  })

  it('無 useSearchParams → 回 null', async () => {
    const code = `'use client'

export default function Page() {
  return <div>no search params</div>
}
`
    const result = await splitPageForSuspense(code, 'app/about/page.tsx')
    expect(result).toBeNull()
  })
})
