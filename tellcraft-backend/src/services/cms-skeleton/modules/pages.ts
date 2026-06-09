// ============================================================
// CMS Skeleton Module: Pages（Day-2 自助營運層 A1）
//
// 站長自助管理的「靜態頁面」內容型別（about / terms / faq 這類）。
//   - pages 表（status draft/published 工作流 + slug + body）
//   - 公開面：list_published_pages
//   - 管理面：generateAdminPanel + A1 operation UI 增強
//
// ship-dark：detect() gate ENABLE_CONTENT_MODEL。keywords 保守（避免「page」泛詞誤啟用）。
// ============================================================
import type { SkeletonModuleDefinition } from '../module-types'
import { hasFeatureWithKeyword } from '../module-types'
import { registerModule } from '../modules-registry'
import { getEnv } from '../../../lib/env'

const PAGE_KEYWORDS = ['static_page', 'cms_page', 'manage_pages', 'about_page', 'content_page', '頁面管理', '靜態頁']

const pagesModule: SkeletonModuleDefinition = {
  id: 'pages',
  displayName: 'Static Pages',
  description: '站長自助管理靜態頁面 + 草稿/發布工作流（pages 內容型別）',

  ddl: `CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);`,

  entityMapping: {
    Page: 'pages',
  },

  canonicalFeatures: [
    {
      name: 'List Published Pages',
      actionName: 'list_published_pages',
      method: 'GET',
      path: '/api/pages',
    },
  ],

  locked: [
    'status workflow (draft / published)',
    'public list 只回 status = published',
    'soft delete via deleted_at',
  ],

  slots: {},

  detect(input) {
    if (!getEnv().ENABLE_CONTENT_MODEL) {
      return { matched: false, score: 0, rule: 'pagesModule(disabled)' }
    }
    const k = hasFeatureWithKeyword(input.features ?? [], PAGE_KEYWORDS)
    return {
      matched: k.matched,
      score: 15,
      rule: 'pagesModule',
      evidence: k.evidence.slice(0, 3).join(', '),
    }
  },

  generateFeatures() {
    return [
      {
        name: 'List Published Pages',
        actionName: 'list_published_pages',
        skeletonModule: 'pages',
        content: `# Action: list_published_pages
# [GET] /api/pages
# Summary: List published pages (public)

Feature: List Published Pages
  公開列出已發布的靜態頁面；草稿不外露

  Background:
    Given 現在時間為 "2026-01-01T12:00:00Z"
    And 準備一個Page, with table:
      | >Page1.id | title  | slug   | body         | status    |
      | $notnull  | About  | about  | About us...  | published |

  Example: Public sees only published pages
    When (No Actor) List Published Pages, call table:
      | _query |
      |        |
    Then List Published Pages(200)回應, with JSON:
      [
        { "title": "About", "slug": "about", "status": "published" }
      ]
`,
      },
    ]
  },

  generateServerActions() {
    return [
      {
        actionName: 'list_published_pages',
        filePath: 'lib/actions/list-published-pages.ts',
        fnName: 'listPublishedPages',
        content: `import { sql } from '@/lib/db'

function _c(row: any): any {
  if (!row) return row
  const r: any = {}
  for (const [k, v] of Object.entries(row)) {
    r[k.replace(/_([a-z])/g, (_: any, c: string) => c.toUpperCase())] = v
  }
  return r
}

export async function listPublishedPages(_input: any): Promise<any> {
  const rows = await sql\`
    SELECT id, title, slug, body, status, published_at, created_at
    FROM pages
    WHERE status = 'published' AND deleted_at IS NULL
    ORDER BY title ASC
  \`
  const result = Array.from(rows).map(_c)
  ;(result as any).__status = 200
  return result
}
`,
      },
    ]
  },
}

registerModule(pagesModule)

export default pagesModule
