import { describe, it, expect } from 'vitest'
import { computeNavDepths, deriveStructureIssues, type StructureProbe } from '../services/ui-evaluator'

function probe(route: string, links: string[], extras: Partial<StructureProbe> = {}): StructureProbe {
  return {
    route,
    links,
    ctaCount: 0,
    overlayCount: 0,
    maxOverlapRatio: 0,
    blockedCta: null,
    blockingOverlay: null,
    ...extras,
  }
}

describe('P5 computeNavDepths (BFS)', () => {
  it('首頁 hop=0', () => {
    const depths = computeNavDepths([probe('/', ['/about', '/pricing'])])
    expect(depths.get('/')).toBe(0)
  })

  it('首頁直連 hop=1', () => {
    const depths = computeNavDepths([
      probe('/', ['/about', '/pricing']),
      probe('/about', []),
      probe('/pricing', []),
    ])
    expect(depths.get('/about')).toBe(1)
    expect(depths.get('/pricing')).toBe(1)
  })

  it('間接路徑 / → /about → /team → /member（hop=3）', () => {
    const depths = computeNavDepths([
      probe('/', ['/about']),
      probe('/about', ['/team']),
      probe('/team', ['/member']),
      probe('/member', []),
    ])
    expect(depths.get('/about')).toBe(1)
    expect(depths.get('/team')).toBe(2)
    expect(depths.get('/member')).toBe(3)
  })

  it('多條路徑取最短', () => {
    const depths = computeNavDepths([
      probe('/', ['/a', '/c']),
      probe('/a', ['/b']),
      probe('/b', []),
      probe('/c', ['/b']),  // 也通到 /b
    ])
    expect(depths.get('/b')).toBe(2)  // / → /a → /b 或 / → /c → /b
  })

  it('沒首頁 → 回空 map', () => {
    const depths = computeNavDepths([probe('/about', []), probe('/team', [])])
    expect(depths.size).toBe(0)
  })

  it('無法到達的 route 不在 depths 中', () => {
    const depths = computeNavDepths([
      probe('/', ['/a']),
      probe('/a', []),
      probe('/orphan', []),
    ])
    expect(depths.has('/orphan')).toBe(false)
  })
})

describe('P5 deriveStructureIssues', () => {
  it('合理 nav 結構（hop ≤ 2）→ 無 issue', () => {
    const issues = deriveStructureIssues([
      probe('/', ['/about', '/pricing']),
      probe('/about', []),
      probe('/pricing', []),
    ])
    expect(issues.filter(i => i.description.includes('導覽深度'))).toHaveLength(0)
  })

  it('hop=3 的頁面 → warning', () => {
    const issues = deriveStructureIssues([
      probe('/', ['/about']),
      probe('/about', ['/team']),
      probe('/team', ['/member']),
      probe('/member', []),
    ])
    const navIssue = issues.find(i => i.route === '/member')
    expect(navIssue).toBeDefined()
    expect(navIssue?.severity).toBe('warning')
    expect(navIssue?.description).toContain('3 次點擊')
  })

  it('CTA 被 overlay 蓋 60% → critical', () => {
    const issues = deriveStructureIssues([
      probe('/', [], {
        maxOverlapRatio: 0.6,
        blockedCta: { tag: 'button', text: '立即購買' },
        blockingOverlay: { zIndex: 100, text: 'Cookie 同意' },
      }),
    ])
    const ctaIssue = issues.find(i => i.description.includes('遮蓋'))
    expect(ctaIssue).toBeDefined()
    expect(ctaIssue?.severity).toBe('critical')
    expect(ctaIssue?.description).toContain('立即購買')
    expect(ctaIssue?.description).toContain('60%')
  })

  it('CTA 被遮 30%（< 50% 閾值）→ 不報', () => {
    const issues = deriveStructureIssues([
      probe('/', [], {
        maxOverlapRatio: 0.3,
        blockedCta: { tag: 'button', text: 'CTA' },
        blockingOverlay: { zIndex: 60, text: 'banner' },
      }),
    ])
    expect(issues.filter(i => i.description.includes('遮蓋'))).toHaveLength(0)
  })

  it('首頁 (/) 即使無連結 hop=0 → 不報', () => {
    const issues = deriveStructureIssues([probe('/', [])])
    expect(issues).toHaveLength(0)
  })

  it('issue category 都是 task_failed', () => {
    const issues = deriveStructureIssues([
      probe('/', ['/a']),
      probe('/a', ['/b']),
      probe('/b', ['/c']),
      probe('/c', [], {
        maxOverlapRatio: 0.7,
        blockedCta: { tag: 'a', text: 'Sign up' },
        blockingOverlay: { zIndex: 999, text: 'modal' },
      }),
    ])
    expect(issues.length).toBeGreaterThan(0)
    expect(issues.every(i => i.category === 'task_failed')).toBe(true)
  })
})
