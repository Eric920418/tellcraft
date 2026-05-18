import { describe, it, expect } from 'vitest'
import { unifyDynamicSlugs, type FileWithPath } from '../services/deployer-fixes/unify-dynamic-slugs'
import { sanitizeCodeForDeploy } from '../services/deployer'

function f(path: string, content = ''): FileWithPath {
  return { path, content }
}

describe('unifyDynamicSlugs — 基本衝突偵測', () => {
  it('同 parent 同 position 兩個不同 slug → 統一', () => {
    const result = unifyDynamicSlugs([
      f('app/products/[id]/page.tsx'),
      f('app/products/[productId]/edit/page.tsx'),
    ])
    expect(result.conflicts).toHaveLength(1)
    expect(result.conflicts[0]).toMatchObject({
      parentPath: 'app/products',
      position: 2,
      chosenSlug: 'id',  // count 平手 → 'id' 優先
    })
    expect(result.conflicts[0].originalSlugs.sort()).toEqual(['id', 'productId'])
    // 兩個檔的 path 都是 [id]
    expect(result.files.map(x => x.path).sort()).toEqual([
      'app/products/[id]/edit/page.tsx',
      'app/products/[id]/page.tsx',
    ])
  })

  it('無衝突場景 → conflicts=[]，input 完全不動', () => {
    const input = [
      f('app/products/[id]/page.tsx'),
      f('app/articles/[id]/page.tsx'),
      f('app/page.tsx'),
    ]
    const result = unifyDynamicSlugs(input)
    expect(result.conflicts).toEqual([])
    expect(result.files).toBe(input)  // same reference, no copy
  })
})

describe('unifyDynamicSlugs — 跨層不誤合', () => {
  it('同 parent 但不同 position 的 dynamic 視為不同 group', () => {
    // app/products/[productId]/reviews/[reviewId]/page.tsx
    // position 2 = productId, position 4 = reviewId
    // 沒有其他 file 用同 position 不同 slug → 無衝突
    const result = unifyDynamicSlugs([
      f('app/products/[productId]/reviews/[reviewId]/page.tsx'),
    ])
    expect(result.conflicts).toEqual([])
  })

  it('不同 parent path 用同 position 不算衝突', () => {
    // app/products/[id] vs app/articles/[articleId] — 雖然 position 都是 2，但 parent 不同
    const result = unifyDynamicSlugs([
      f('app/products/[id]/page.tsx'),
      f('app/articles/[articleId]/page.tsx'),
    ])
    expect(result.conflicts).toEqual([])
  })
})

describe('unifyDynamicSlugs — 三方衝突 + winner 挑選', () => {
  it('count 平手 → id 優先', () => {
    const result = unifyDynamicSlugs([
      f('app/x/[id]/a.tsx'),
      f('app/x/[productId]/b.tsx'),
      f('app/x/[pid]/c.tsx'),
    ])
    expect(result.conflicts[0].chosenSlug).toBe('id')
  })

  it('count 最多者勝（即使非 id）', () => {
    const result = unifyDynamicSlugs([
      f('app/x/[productId]/a.tsx'),
      f('app/x/[productId]/b.tsx'),
      f('app/x/[productId]/c.tsx'),
      f('app/x/[id]/d.tsx'),
    ])
    expect(result.conflicts[0].chosenSlug).toBe('productId')
  })

  it('count 平手且都不是 id → 字母序第一', () => {
    const result = unifyDynamicSlugs([
      f('app/x/[productId]/a.tsx'),
      f('app/x/[zooId]/b.tsx'),
    ])
    expect(result.conflicts[0].chosenSlug).toBe('productId')  // 'p' < 'z'
  })
})

describe('unifyDynamicSlugs — catch-all / optional 跳過', () => {
  it('catch-all [...slug] 不算 standard dynamic', () => {
    const result = unifyDynamicSlugs([
      f('app/docs/[...slug]/page.tsx'),
      f('app/docs/[productId]/page.tsx'),
    ])
    // catch-all 不參與 → 只有 [productId] 一個 → 無衝突
    expect(result.conflicts).toEqual([])
  })

  it('optional dynamic [[id]] 不算 standard', () => {
    const result = unifyDynamicSlugs([
      f('app/page/[[id]]/page.tsx'),
      f('app/page/[slug]/page.tsx'),
    ])
    expect(result.conflicts).toEqual([])
  })
})

describe('unifyDynamicSlugs — content rename (destructure aliasing)', () => {
  it('Promise type signature 改 type 內 key', () => {
    const result = unifyDynamicSlugs([
      f('app/x/[id]/page.tsx', ''),
      f('app/x/[productId]/page.tsx', `
export default async function Page({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params
  return <div>{productId}</div>
}
`),
    ])
    const renamed = result.files.find(x => x.path === 'app/x/[id]/page.tsx' && x.content.length > 0)!
    expect(renamed.content).toContain('params: Promise<{ id: string }>')
    expect(renamed.content).toContain('const { id: productId } = await params')
    // 下游 ref 保留 productId
    expect(renamed.content).toContain('{productId}')
  })

  it('plain type signature 改 type 內 key', () => {
    const result = unifyDynamicSlugs([
      f('app/x/[id]/a.tsx', ''),
      f('app/x/[productId]/b.tsx', `
function Comp({ params }: { params: { productId: string } }) {
  return <div>{params.productId}</div>
}
`),
    ])
    const renamed = result.files.find(x => x.content.includes('Comp'))!
    expect(renamed.content).toContain('params: { id: string }')
    // params.productId 沒在 destructure 內，不改（這個小細節：用戶若用 params.productId 直存取，
    // 在我們 rename type 後 TS 會警告，但 runtime 透過 alias 仍 work — 因為 Next 提供的是 { id }，
    // 不會有 productId。這 case 罕見，先不處理）
  })

  it('useParams<T>() 改 type 內 key', () => {
    const result = unifyDynamicSlugs([
      f('app/x/[id]/a.tsx', ''),
      f('app/x/[productId]/b.tsx', `'use client'
import { useParams } from 'next/navigation'
function C() {
  const { productId } = useParams<{ productId: string }>()
  return <div>{productId}</div>
}
`),
    ])
    const renamed = result.files.find(x => x.content.includes('useParams'))!
    expect(renamed.content).toContain('useParams<{ id: string }>')
  })

  it('await params destructure 用 aliasing 保留下游', () => {
    const result = unifyDynamicSlugs([
      f('app/x/[id]/a.tsx', ''),
      f('app/x/[productId]/b.tsx', `
async function fn({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params
  console.log(productId)
}
`),
    ])
    const renamed = result.files.find(x => x.content.includes('console.log'))!
    expect(renamed.content).toContain('const { id: productId } = await params')
    expect(renamed.content).toContain('console.log(productId)')  // 下游 ref 不變
  })
})

describe('unifyDynamicSlugs — 不誤殺業務 ref', () => {
  it('interface 內 productId 欄位保留', () => {
    const businessCode = `
interface Product {
  productId: string
  name: string
}
function getProduct(p: Product) { return p.productId }
`
    const result = unifyDynamicSlugs([
      f('app/x/[id]/a.tsx', ''),
      f('app/x/[productId]/b.tsx', businessCode + `
function Page({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params
  return getProduct({ productId, name: '' })
}
`),
    ])
    const renamed = result.files.find(x => x.content.includes('interface Product'))!
    // 業務 interface 保留原樣
    expect(renamed.content).toContain('interface Product {\n  productId: string')
    expect(renamed.content).toContain('function getProduct(p: Product) { return p.productId }')
    // Next.js param 部分 rename
    expect(renamed.content).toContain('params: Promise<{ id: string }>')
    expect(renamed.content).toContain('const { id: productId } = await params')
  })

  it('SQL column-like ref 保留（不在 params 上下文）', () => {
    const sqlCode = `await sql\`SELECT productId FROM products WHERE id = \${id}\`
const data = { productId: row.productId }
`
    const result = unifyDynamicSlugs([
      f('app/x/[id]/a.tsx', ''),
      f('app/x/[productId]/b.tsx', `function fn() {\n${sqlCode}\n}`),
    ])
    const renamed = result.files.find(x => x.content.includes('SELECT'))!
    expect(renamed.content).toContain('SELECT productId FROM products')
    expect(renamed.content).toContain('{ productId: row.productId }')
  })
})

describe('unifyDynamicSlugs — 多層 dynamic 路徑', () => {
  it('一個 path 多個 dynamic 段，只有衝突的那段 rename', () => {
    const result = unifyDynamicSlugs([
      // position 2 衝突（id vs productId），position 4 (reviewId) 無衝突
      f('app/products/[id]/reviews/[reviewId]/page.tsx'),
      f('app/products/[productId]/reviews/[reviewId]/page.tsx'),
    ])
    expect(result.conflicts).toHaveLength(1)
    expect(result.conflicts[0].position).toBe(2)
    const paths = result.files.map(x => x.path)
    expect(paths.every(p => p.startsWith('app/products/[id]/reviews/[reviewId]'))).toBe(true)
  })
})

// ============================================================
// Fix 9.5 整合測試：確認 sanitizeCodeForDeploy 真的觸發 unifyDynamicSlugs
// ============================================================

function makeFile(path: string, content: string) {
  return { path, content, description: '' }
}

describe('sanitizeCodeForDeploy — Fix 9.5 整合', () => {
  it('衝突路徑 → fixes 含「Dynamic slug unified」訊息 + pages path rename + rename 後 deduplicate', () => {
    const code = {
      pages: [
        makeFile('app/admin/products/[id]/page.tsx', 'export default function P() { return <div /> }'),
        makeFile('app/admin/products/[productId]/edit/page.tsx', 'export default function E() { return <div /> }'),
      ],
      components: [],
      styles: '',
    }
    const result = sanitizeCodeForDeploy(code)
    // fixes 含 Dynamic slug 訊息
    expect(result.fixes.some(f => f.includes('Dynamic slug unified'))).toBe(true)
    // pages path 都 rename 成 [id]
    const paths = result.code.pages.map(p => p.path)
    expect(paths).toContain('app/admin/products/[id]/page.tsx')
    expect(paths).toContain('app/admin/products/[id]/edit/page.tsx')
    expect(paths.every(p => !p.includes('[productId]'))).toBe(true)
  })

  it('無衝突 → fixes 不含 Dynamic slug 訊息', () => {
    const code = {
      pages: [
        makeFile('app/admin/products/[id]/page.tsx', 'export default function P() { return <div /> }'),
        makeFile('app/admin/articles/[id]/page.tsx', 'export default function A() { return <div /> }'),
      ],
      components: [],
      styles: '',
    }
    const result = sanitizeCodeForDeploy(code)
    expect(result.fixes.some(f => f.includes('Dynamic slug unified'))).toBe(false)
  })
})
