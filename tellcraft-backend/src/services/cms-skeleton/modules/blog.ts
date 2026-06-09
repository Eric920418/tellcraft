// ============================================================
// CMS Skeleton Module: Blog（Day-2 自助營運層 A1）
//
// 站長部署後不碰 AI 就能寫文章、存草稿、發布的「內容型別」。
//   - posts 表（含 status draft/published/scheduled 工作流 + slug + body + 媒體）
//   - 公開面：list_published_posts（公開部落格列表）
//   - 管理面：由 generateAdminPanel（治本後 posts 會自動生後台）+ A1 operation UI 增強（狀態分頁 + 發布按鈕）負責
//
// ship-dark：detect() gate ENABLE_CONTENT_MODEL，flag off（預設）→ 永不啟用，零行為變化。
// detection：features 含 post / article / blog / news 關鍵字 + flag 開啟。
// ============================================================
import type { SkeletonModuleDefinition } from '../module-types'
import { hasFeatureWithKeyword } from '../module-types'
import { registerModule } from '../modules-registry'
import { getEnv } from '../../../lib/env'

const BLOG_KEYWORDS = ['blog', 'post', 'article', 'news', 'journal', '文章', '部落格', '貼文']

const blogModule: SkeletonModuleDefinition = {
  id: 'blog',
  displayName: 'Blog / Posts',
  description: '站長自助寫文章 + 草稿/發布工作流（posts 內容型別）',

  ddl: `CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL,
  excerpt VARCHAR(500),
  body TEXT NOT NULL DEFAULT '',
  cover_image VARCHAR(512),
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  author_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);`,

  entityMapping: {
    Post: 'posts',
  },

  canonicalFeatures: [
    {
      name: 'List Published Posts',
      actionName: 'list_published_posts',
      method: 'GET',
      path: '/api/posts',
    },
  ],

  locked: [
    'status workflow (draft / published / scheduled)',
    'public list 只回 status = published',
    'soft delete via deleted_at',
  ],

  slots: {
    posts_per_page: {
      type: 'number',
      default: 10,
      description: '公開部落格列表每頁文章數（operation UI 用）',
    },
  },

  detect(input) {
    // ship-dark：未開 ENABLE_CONTENT_MODEL → 永不啟用（與既有行為完全一致）
    if (!getEnv().ENABLE_CONTENT_MODEL) {
      return { matched: false, score: 0, rule: 'blogModule(disabled)' }
    }
    const k = hasFeatureWithKeyword(input.features ?? [], BLOG_KEYWORDS)
    return {
      matched: k.matched,
      score: 20,
      rule: 'blogModule',
      evidence: k.evidence.slice(0, 3).join(', '),
    }
  },

  generateFeatures() {
    return [
      {
        name: 'List Published Posts',
        actionName: 'list_published_posts',
        skeletonModule: 'blog',
        content: `# Action: list_published_posts
# [GET] /api/posts
# Summary: List published posts (public)

Feature: List Published Posts
  公開列出已發布的文章，按發布時間倒序；草稿不外露

  Background:
    Given 現在時間為 "2026-01-01T12:00:00Z"
    And 準備一個Post, with table:
      | >Post1.id | title       | slug        | body    | status    | published_at         |
      | $notnull  | First Post  | first-post  | Hello   | published | 2025-12-01T00:00:00Z |

  Example: Public sees only published posts
    When (No Actor) List Published Posts, call table:
      | _query |
      |        |
    Then List Published Posts(200)回應, with JSON:
      [
        { "title": "First Post", "slug": "first-post", "status": "published" }
      ]
`,
      },
    ]
  },

  generateServerActions() {
    return [
      {
        actionName: 'list_published_posts',
        filePath: 'lib/actions/list-published-posts.ts',
        fnName: 'listPublishedPosts',
        content: `import { sql } from '@/lib/db'

function _c(row: any): any {
  if (!row) return row
  const r: any = {}
  for (const [k, v] of Object.entries(row)) {
    r[k.replace(/_([a-z])/g, (_: any, c: string) => c.toUpperCase())] = v
  }
  return r
}

export async function listPublishedPosts(_input: any): Promise<any> {
  const rows = await sql\`
    SELECT id, title, slug, excerpt, cover_image, status, published_at, created_at
    FROM posts
    WHERE deleted_at IS NULL
      AND (status = 'published'
           OR (status = 'scheduled' AND scheduled_for IS NOT NULL AND scheduled_for <= NOW()))
    ORDER BY published_at DESC NULLS LAST, created_at DESC
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

registerModule(blogModule)

export default blogModule
