/**
 * M6 整合驗證測試
 * 驗證 M2（Auth）、M3（Admin Panel）、M4（Upload）的模板生成邏輯
 * 使用 Learn 專案風格的 schema 作為 fixture
 */
import { describe, it, expect } from 'vitest'
import { detectAuthInSchema, generateAuthSystem, injectSessionProvider } from '../services/coder-auth-templates'
import { generateAdminPanel, parseColumnDefinitions } from '../services/coder-admin-templates'
import { deriveContentModel } from '../services/content-model/manifest'
import { generateRbacFiles } from '../services/coder-auth-rbac-templates'
import { generateCommerceFiles } from '../services/coder-commerce-templates'
import { detectImageColumnsInSchema, generateUploadFiles } from '../services/coder-upload-templates'

// ============================================================
// Fixture：模擬 Learn 專案的 PostgreSQL Schema
// ============================================================

const LEARN_SCHEMA = `
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  cover_image TEXT,
  published BOOLEAN DEFAULT false,
  category_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  speaker VARCHAR(100),
  event_date TIMESTAMPTZ,
  location VARCHAR(200),
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gallery_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  cover_photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`

const LEARN_ENTITY_MAPPING = `entity_to_table_mapping:
  - 用戶: users
  - 文章: posts
  - 分類: categories
  - 活動: events
  - 相簿: gallery_albums
`

const NO_AUTH_SCHEMA = `
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`

const NO_AUTH_MAPPING = `entity_to_table_mapping:
  - 商品: products
  - 訂單: orders
`

const NO_IMAGE_SCHEMA = `
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`

// ============================================================
// M2: Auth Generator
// ============================================================

describe('Auth Generator (M2)', () => {
  describe('detectAuthInSchema', () => {
    it('users + password → true', () => {
      expect(detectAuthInSchema(LEARN_SCHEMA)).toBe(true)
    })

    it('users 無 password → false', () => {
      const schema = `CREATE TABLE users (id UUID PRIMARY KEY, email TEXT NOT NULL, name TEXT);`
      expect(detectAuthInSchema(schema)).toBe(false)
    })

    it('無 users 表 → false', () => {
      expect(detectAuthInSchema(NO_AUTH_SCHEMA)).toBe(false)
    })

    it('password_hash 也觸發', () => {
      const schema = `CREATE TABLE users (id UUID PRIMARY KEY, email TEXT, password_hash TEXT);`
      expect(detectAuthInSchema(schema)).toBe(true)
    })
  })

  describe('generateAuthSystem', () => {
    it('有 auth → 7 個檔案', () => {
      const files = generateAuthSystem(LEARN_SCHEMA)
      expect(files).not.toBeNull()
      expect(files).toHaveLength(7)

      const paths = files!.map(f => f.path)
      expect(paths).toContain('auth.ts')
      expect(paths).toContain('app/api/auth/[...nextauth]/route.ts')
      expect(paths).toContain('app/(auth)/admin/login/page.tsx')
      expect(paths).toContain('app/admin/layout.tsx')
      expect(paths).toContain('lib/auth-check.ts')
      expect(paths).toContain('app/providers.tsx')
      expect(paths).toContain('types/next-auth.d.ts')
    })

    it('有 role → auth.ts 含 token.role', () => {
      const files = generateAuthSystem(LEARN_SCHEMA)!
      const authTs = files.find(f => f.path === 'auth.ts')!
      expect(authTs.content).toContain('token.role')
      expect(authTs.content).toContain("role: user.role || 'user'")
    })

    it('無 role → auth.ts 不含 token.role', () => {
      const schema = `CREATE TABLE users (id UUID PRIMARY KEY, email TEXT, password TEXT);`
      const files = generateAuthSystem(schema)!
      const authTs = files.find(f => f.path === 'auth.ts')!
      expect(authTs.content).not.toContain('token.role')
    })

    it('無 auth schema → null', () => {
      expect(generateAuthSystem(NO_AUTH_SCHEMA)).toBeNull()
    })

    it('auth.ts 含 bcrypt + neon import', () => {
      const files = generateAuthSystem(LEARN_SCHEMA)!
      const authTs = files.find(f => f.path === 'auth.ts')!
      expect(authTs.content).toContain("import bcrypt from 'bcryptjs'")
      expect(authTs.content).toContain("import { neon } from '@neondatabase/serverless'")
    })

    it('login page 是 use client', () => {
      const files = generateAuthSystem(LEARN_SCHEMA)!
      const login = files.find(f => f.path.includes('login'))!
      expect(login.content).toContain("'use client'")
      expect(login.content).toContain('signIn')
    })

    it('admin layout 有 auth check + role check', () => {
      const files = generateAuthSystem(LEARN_SCHEMA)!
      const layout = files.find(f => f.path === 'app/admin/layout.tsx')!
      expect(layout.content).toContain("import { auth } from '@/auth'")
      expect(layout.content).toContain("redirect('/admin/login')")
      expect(layout.content).toContain("role !== 'admin'")
    })
  })

  describe('injectSessionProvider', () => {
    it('注入 Providers + import', () => {
      const layout = `import type { Metadata } from 'next'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}`
      const result = injectSessionProvider(layout)
      expect(result).toContain("import { Providers } from '@/app/providers'")
      expect(result).toContain('<Providers>')
      expect(result).toContain('</Providers>')
    })

    it('已有 Providers → 不重複注入', () => {
      const layout = `import { Providers } from '@/app/providers'
export default function Layout({ children }) {
  return <html><body><Providers>{children}</Providers></body></html>
}`
      expect(injectSessionProvider(layout)).toBe(layout)
    })
  })
})

// ============================================================
// M3: Admin Panel Generator
// ============================================================

describe('Admin Panel Generator (M3)', () => {
  describe('parseColumnDefinitions', () => {
    it('解析 VARCHAR(255) NOT NULL', () => {
      const cols = parseColumnDefinitions(['title VARCHAR(255) NOT NULL'])
      expect(cols).toHaveLength(1)
      expect(cols[0].name).toBe('title')
      expect(cols[0].type).toBe('VARCHAR')
      expect(cols[0].nullable).toBe(false)
      expect(cols[0].maxLength).toBe(255)
    })

    it('解析 FK REFERENCES', () => {
      const cols = parseColumnDefinitions(['category_id UUID REFERENCES categories(id)'])
      expect(cols).toHaveLength(1)
      expect(cols[0].isForeignKey).toBe(true)
      expect(cols[0].referencesTable).toBe('categories')
      expect(cols[0].referencesColumn).toBe('id')
    })

    it('解析 BOOLEAN DEFAULT', () => {
      const cols = parseColumnDefinitions(['published BOOLEAN DEFAULT false'])
      expect(cols).toHaveLength(1)
      expect(cols[0].type).toBe('BOOLEAN')
      expect(cols[0].defaultValue).toBe('false')
    })

    it('解析 PRIMARY KEY', () => {
      const cols = parseColumnDefinitions(['id UUID PRIMARY KEY DEFAULT gen_random_uuid()'])
      expect(cols).toHaveLength(1)
      expect(cols[0].isPrimaryKey).toBe(true)
    })

    it('跳過 CONSTRAINT 行', () => {
      const cols = parseColumnDefinitions([
        'id UUID PRIMARY KEY',
        'CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)',
        'UNIQUE (email)',
      ])
      expect(cols).toHaveLength(1)
      expect(cols[0].name).toBe('id')
    })

    it('解析 DECIMAL(10,2)', () => {
      const cols = parseColumnDefinitions(['price DECIMAL(10,2) NOT NULL'])
      expect(cols).toHaveLength(1)
      expect(cols[0].type).toBe('DECIMAL')
      expect(cols[0].nullable).toBe(false)
    })
  })

  describe('generateAdminPanel', () => {
    it('5 表 schema → 過濾 users → 4 entity CRUD', () => {
      const files = generateAdminPanel(LEARN_SCHEMA, LEARN_ENTITY_MAPPING, true)
      // 不應有 users 相關的 admin 頁面
      const userFiles = files.filter(f => f.path.includes('admin/users'))
      expect(userFiles).toHaveLength(0)

      // 應有 posts, categories, events, gallery-albums
      expect(files.some(f => f.path.includes('admin/posts/page.tsx'))).toBe(true)
      expect(files.some(f => f.path.includes('admin/categories/page.tsx'))).toBe(true)
      expect(files.some(f => f.path.includes('admin/events/page.tsx'))).toBe(true)
      expect(files.some(f => f.path.includes('admin/gallery-albums/page.tsx'))).toBe(true)
    })

    it('檔案數正確：6 共用 + 4×4 entity = 22', () => {
      const files = generateAdminPanel(LEARN_SCHEMA, LEARN_ENTITY_MAPPING, true)
      // 6 共用：Sidebar + AdminHeader + FormField + DeleteButton + SubmitButton + Dashboard
      // 4 entity × 4 files (list + edit + queries + actions) = 16
      expect(files).toHaveLength(22)
    })

    it('auth=true → actions 含 requireAdmin', () => {
      const files = generateAdminPanel(LEARN_SCHEMA, LEARN_ENTITY_MAPPING, true)
      const postsAction = files.find(f => f.path === 'lib/admin-actions/posts.ts')!
      expect(postsAction.content).toContain('requireAdmin')
    })

    it('auth=false → actions 不含 requireAdmin', () => {
      const files = generateAdminPanel(NO_AUTH_SCHEMA, NO_AUTH_MAPPING, false)
      const productsAction = files.find(f => f.path === 'lib/admin-actions/products.ts')!
      expect(productsAction.content).not.toContain('requireAdmin')
    })

    it('FK column → select type in edit page', () => {
      const files = generateAdminPanel(LEARN_SCHEMA, LEARN_ENTITY_MAPPING, true)
      const postsEdit = files.find(f => f.path === 'app/admin/posts/[id]/page.tsx')!
      expect(postsEdit.content).toContain('type="select"')
      expect(postsEdit.content).toContain('getCategoriesForSelect')
    })

    it('image column → ImageUpload in edit page', () => {
      const files = generateAdminPanel(LEARN_SCHEMA, LEARN_ENTITY_MAPPING, true)
      const postsEdit = files.find(f => f.path === 'app/admin/posts/[id]/page.tsx')!
      expect(postsEdit.content).toContain('ImageUpload')
      expect(postsEdit.content).toContain('cover_image')
    })

    it('auth=false → AdminHeader 無 signOut', () => {
      const files = generateAdminPanel(NO_AUTH_SCHEMA, NO_AUTH_MAPPING, false)
      const header = files.find(f => f.path === 'components/admin/AdminHeader.tsx')!
      expect(header.content).not.toContain('signOut')
      expect(header.content).not.toContain('next-auth')
    })

    it('auth=true → AdminHeader 有 signOut', () => {
      const files = generateAdminPanel(LEARN_SCHEMA, LEARN_ENTITY_MAPPING, true)
      const header = files.find(f => f.path === 'components/admin/AdminHeader.tsx')!
      expect(header.content).toContain('signOut')
    })

    it('Dashboard 有所有 entity 連結', () => {
      const files = generateAdminPanel(LEARN_SCHEMA, LEARN_ENTITY_MAPPING, true)
      const dashboard = files.find(f => f.path === 'app/admin/page.tsx')!
      expect(dashboard.content).toContain('/admin/posts')
      expect(dashboard.content).toContain('/admin/categories')
      expect(dashboard.content).toContain('/admin/events')
      expect(dashboard.content).toContain('/admin/gallery-albums')
      // 不應有 users
      expect(dashboard.content).not.toContain('/admin/users')
    })

    it('列表頁有 delete + 編輯連結', () => {
      const files = generateAdminPanel(LEARN_SCHEMA, LEARN_ENTITY_MAPPING, true)
      const list = files.find(f => f.path === 'app/admin/posts/page.tsx')!
      expect(list.content).toContain('DeleteButton')
      expect(list.content).toContain('編輯')
      expect(list.content).toContain('新增')
    })

    it('query file 有 getAll + getById + getForSelect', () => {
      const files = generateAdminPanel(LEARN_SCHEMA, LEARN_ENTITY_MAPPING, true)
      const queries = files.find(f => f.path === 'lib/admin-queries/posts.ts')!
      expect(queries.content).toContain('getAllPosts')
      expect(queries.content).toContain('getPostsById')
      expect(queries.content).toContain('getPostsForSelect')
    })
  })
})

// ============================================================
// A1: Admin Panel operation UI（草稿/發布工作流，manifest 驅動）
// ============================================================

describe('Admin Panel — operation UI workflow (A1)', () => {
  const BLOG_SCHEMA = `CREATE TABLE users (id UUID PRIMARY KEY, email VARCHAR(255));
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`
  const BLOG_MAPPING = '文章: posts'
  const cm = deriveContentModel(BLOG_SCHEMA, BLOG_MAPPING)

  it('manifest 正確識別 posts 為 draft_publish + schedule 工作流', () => {
    const posts = cm.contentTypes.find(t => t.tableName === 'posts')!
    expect(posts.capabilities).toEqual(expect.arrayContaining(['draft_publish', 'schedule']))
    expect(posts.statusColumn).toBe('status')
  })

  it('ship-dark：無 contentModel → posts 走基本列表（無分頁/發布按鈕）', () => {
    const files = generateAdminPanel(BLOG_SCHEMA, BLOG_MAPPING, true)
    const list = files.find(f => f.path === 'app/admin/posts/page.tsx')!
    expect(list.content).not.toContain('const TABS')
    expect(list.content).not.toContain('取消發布')
    const action = files.find(f => f.path === 'lib/admin-actions/posts.ts')!
    expect(action.content).not.toContain('publishPosts')
  })

  it('有 contentModel → posts 列表頁 workflow-aware（分頁 + 發布/取消發布 + 狀態 badge + 排程）', () => {
    const files = generateAdminPanel(BLOG_SCHEMA, BLOG_MAPPING, true, undefined, cm)
    const list = files.find(f => f.path === 'app/admin/posts/page.tsx')!
    expect(list.content).toContain('const TABS')
    expect(list.content).toContain('statusBadgeClass')
    expect(list.content).toContain('取消發布')
    expect(list.content).toContain('publishPosts')
    expect(list.content).toContain('已排程') // scheduled_for 存在 → hasSchedule
  })

  it('有 contentModel → posts 編輯頁 status 渲染成下拉選單', () => {
    const files = generateAdminPanel(BLOG_SCHEMA, BLOG_MAPPING, true, undefined, cm)
    const edit = files.find(f => f.path === 'app/admin/posts/[id]/page.tsx')!
    expect(edit.content).toContain('name="status" type="select"')
    expect(edit.content).toContain('草稿')
    expect(edit.content).toContain('已發布')
  })

  it('有 contentModel → posts action 含 publish/unpublish（只動存在欄位 + COALESCE published_at）', () => {
    const files = generateAdminPanel(BLOG_SCHEMA, BLOG_MAPPING, true, undefined, cm)
    const action = files.find(f => f.path === 'lib/admin-actions/posts.ts')!
    expect(action.content).toContain('export async function publishPosts')
    expect(action.content).toContain('export async function unpublishPosts')
    expect(action.content).toContain("status = 'published'")
    expect(action.content).toContain('COALESCE(published_at, NOW())')
    expect(action.content).toContain('updated_at = NOW()')
  })

  it('非工作流表（無 status 欄位）→ 即使有 contentModel 仍走基本列表', () => {
    const schema = `CREATE TABLE tags (id UUID PRIMARY KEY, label VARCHAR(80) NOT NULL);`
    const cm2 = deriveContentModel(schema, '標籤: tags')
    const files = generateAdminPanel(schema, '標籤: tags', false, undefined, cm2)
    const list = files.find(f => f.path === 'app/admin/tags/page.tsx')!
    expect(list.content).not.toContain('const TABS')
  })
})

// ============================================================
// A3: 媒體庫（manifest.mediaTable 驅動 + 上傳 fail-soft 記錄）
// ============================================================

describe('Admin Panel — 媒體庫 (A3)', () => {
  const MEDIA_SCHEMA = `CREATE TABLE posts (id UUID PRIMARY KEY, title VARCHAR(200), cover_image VARCHAR(512));
CREATE TABLE IF NOT EXISTS media_uploads (id UUID PRIMARY KEY, file_name VARCHAR(256) NOT NULL, file_path TEXT NOT NULL, mime_type VARCHAR(128), file_size BIGINT, created_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ);`
  const cm = deriveContentModel(MEDIA_SCHEMA, '文章: posts')

  it('manifest 偵測 media_uploads 為 mediaTable', () => {
    expect(cm.mediaTable).toBe('media_uploads')
  })

  it('有 mediaTable → 生成 /admin/media 頁 + 查詢 + 刪除 + 側欄連結；media_uploads 不生通用 CRUD', () => {
    const files = generateAdminPanel(MEDIA_SCHEMA, '文章: posts', true, undefined, cm)
    expect(files.some(f => f.path === 'app/admin/media/page.tsx')).toBe(true)
    expect(files.some(f => f.path === 'lib/admin-queries/media.ts')).toBe(true)
    expect(files.some(f => f.path === 'lib/admin-actions/media.ts')).toBe(true)
    expect(files.find(f => f.path.includes('Sidebar'))!.content).toContain('/admin/media')
    expect(files.some(f => f.path === 'app/admin/media-uploads/page.tsx')).toBe(false)
  })

  it('ship-dark：無 contentModel → 不生媒體庫', () => {
    const files = generateAdminPanel(MEDIA_SCHEMA, '文章: posts', true)
    expect(files.some(f => f.path === 'app/admin/media/page.tsx')).toBe(false)
    expect(files.find(f => f.path.includes('Sidebar'))!.content).not.toContain('/admin/media')
  })

  it('媒體刪除為 soft delete（deleted_at）', () => {
    const files = generateAdminPanel(MEDIA_SCHEMA, '文章: posts', true, undefined, cm)
    expect(files.find(f => f.path === 'lib/admin-actions/media.ts')!.content).toContain('deleted_at = NOW()')
  })

  it('schema 含 media_uploads → upload API fail-soft 記錄進 media_uploads', () => {
    const api = generateUploadFiles(MEDIA_SCHEMA)!.find(f => f.path.includes('route.ts'))!
    expect(api.content).toContain('INSERT INTO media_uploads')
    expect(api.content).toContain('recordMedia')
  })

  it('schema 無 media_uploads → upload API 用原版（不含記錄，行為不變）', () => {
    const api = generateUploadFiles(LEARN_SCHEMA)!.find(f => f.path.includes('route.ts'))!
    expect(api.content).not.toContain('INSERT INTO media_uploads')
  })
})

describe('Admin Panel — 排程發布 cron (A3)', () => {
  const SCHED_SCHEMA = `CREATE TABLE posts (id UUID PRIMARY KEY, title VARCHAR(200), status VARCHAR(20) DEFAULT 'draft', published_at TIMESTAMPTZ, scheduled_for TIMESTAMPTZ);`
  const cm = deriveContentModel(SCHED_SCHEMA, '文章: posts')

  it('schedule 能力 → 生成 cron route 把到期排程翻成已發布', () => {
    const files = generateAdminPanel(SCHED_SCHEMA, '文章: posts', true, undefined, cm)
    const cron = files.find(f => f.path === 'app/api/cron/publish-scheduled/route.ts')!
    expect(cron).toBeTruthy()
    expect(cron.content).toContain("status = 'published'")
    expect(cron.content).toContain('scheduled_for <= NOW()')
    expect(cron.content).toContain('CRON_SECRET') // 有 Bearer 驗證
  })

  it('無 schedule 能力（無 scheduled_for）→ 不生 cron route', () => {
    const noSched = `CREATE TABLE posts (id UUID PRIMARY KEY, title VARCHAR(200), status VARCHAR(20) DEFAULT 'draft');`
    const files = generateAdminPanel(noSched, '文章: posts', true, undefined, deriveContentModel(noSched, '文章: posts'))
    expect(files.some(f => f.path.includes('cron/publish-scheduled'))).toBe(false)
  })

  it('ship-dark：無 contentModel → 不生 cron route', () => {
    const files = generateAdminPanel(SCHED_SCHEMA, '文章: posts', true)
    expect(files.some(f => f.path.includes('cron/publish-scheduled'))).toBe(false)
  })
})

describe('Admin Panel — 內容版本 (A3)', () => {
  const VER_SCHEMA = `CREATE TABLE posts (id UUID PRIMARY KEY, title VARCHAR(200), body TEXT, status VARCHAR(20) DEFAULT 'draft', created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS content_versions (id UUID PRIMARY KEY, content_table VARCHAR(64) NOT NULL, content_id UUID NOT NULL, snapshot JSONB NOT NULL, created_at TIMESTAMPTZ);`
  const cm = deriveContentModel(VER_SCHEMA, '文章: posts')

  it('version 能力 → action 含 snapshot-on-update + restore', () => {
    const action = generateAdminPanel(VER_SCHEMA, '文章: posts', true, undefined, cm).find(f => f.path === 'lib/admin-actions/posts.ts')!
    expect(action.content).toContain('INSERT INTO content_versions')
    expect(action.content).toContain('restorePostsVersion')
  })

  it('version 能力 → query 含 getPostsVersions；編輯頁含版本歷史 + 還原按鈕', () => {
    const files = generateAdminPanel(VER_SCHEMA, '文章: posts', true, undefined, cm)
    expect(files.find(f => f.path === 'lib/admin-queries/posts.ts')!.content).toContain('getPostsVersions')
    const edit = files.find(f => f.path === 'app/admin/posts/[id]/page.tsx')!
    expect(edit.content).toContain('版本歷史')
    expect(edit.content).toContain('還原此版本')
  })

  it('ship-dark：無 content_versions → 不生版本程式碼', () => {
    const noVer = `CREATE TABLE posts (id UUID PRIMARY KEY, title VARCHAR(200), status VARCHAR(20) DEFAULT 'draft');`
    const action = generateAdminPanel(noVer, '文章: posts', true, undefined, deriveContentModel(noVer, '文章: posts')).find(f => f.path === 'lib/admin-actions/posts.ts')!
    expect(action.content).not.toContain('content_versions')
    expect(action.content).not.toContain('restorePostsVersion')
  })
})

describe('C-Auth — RBAC capability 層', () => {
  const SCHEMA = `CREATE TABLE posts (id UUID PRIMARY KEY, title VARCHAR(200), status VARCHAR(20) DEFAULT 'draft');`
  const cm = deriveContentModel(SCHEMA, '文章: posts')

  it('generateRbacFiles → lib/authz.ts requireCapability（admin superuser shortcut）', () => {
    const f = generateRbacFiles()[0]
    expect(f.path).toBe('lib/authz.ts')
    expect(f.content).toContain('export async function requireCapability')
    expect(f.content).toContain("role === 'admin'")
    expect(f.content).toContain('role_capabilities')
  })

  it('rbac on → workflow 內容動作用 requireCapability，不用 requireAdmin', () => {
    const action = generateAdminPanel(SCHEMA, '文章: posts', true, undefined, cm, true).find(f => f.path === 'lib/admin-actions/posts.ts')!
    expect(action.content).toContain("requireCapability('content.manage')")
    expect(action.content).not.toContain('requireAdmin')
  })

  it('ship-dark：rbac off → 維持 requireAdmin', () => {
    const action = generateAdminPanel(SCHEMA, '文章: posts', true, undefined, cm, false).find(f => f.path === 'lib/admin-actions/posts.ts')!
    expect(action.content).toContain('requireAdmin')
    expect(action.content).not.toContain('requireCapability')
  })

  it('INFRA 排除：content_versions / roles / role_capabilities 不生 CRUD 後台（posts 仍生）', () => {
    const schema = `CREATE TABLE posts (id UUID PRIMARY KEY, title VARCHAR(200));
CREATE TABLE IF NOT EXISTS content_versions (id UUID PRIMARY KEY, content_table VARCHAR(64), content_id UUID, snapshot JSONB);
CREATE TABLE IF NOT EXISTS roles (id UUID PRIMARY KEY, name VARCHAR(64));
CREATE TABLE IF NOT EXISTS role_capabilities (id UUID PRIMARY KEY, role_id UUID, capability_id UUID);`
    const files = generateAdminPanel(schema, '文章: posts', true, undefined, deriveContentModel(schema, '文章: posts'))
    expect(files.some(f => f.path.includes('admin/content-versions'))).toBe(false)
    expect(files.some(f => f.path.includes('admin/roles'))).toBe(false)
    expect(files.some(f => f.path.includes('admin/role-capabilities'))).toBe(false)
    expect(files.some(f => f.path === 'app/admin/posts/page.tsx')).toBe(true)
  })
})

describe('C-Commerce — Stripe Checkout', () => {
  const SCHEMA = `CREATE TABLE products (id UUID PRIMARY KEY, name VARCHAR(200));
CREATE TABLE IF NOT EXISTS orders (id UUID PRIMARY KEY, status VARCHAR(20) DEFAULT 'pending', total_cents INTEGER, currency VARCHAR(8), customer_email VARCHAR(255), stripe_session_id VARCHAR(255), created_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS order_items (id UUID PRIMARY KEY, order_id UUID, product_name VARCHAR(255), unit_price_cents INTEGER, quantity INTEGER);`

  it('schema 含 orders → 生 checkout + webhook + 成功/取消頁', () => {
    const paths = generateCommerceFiles(SCHEMA)!.map(f => f.path)
    expect(paths).toContain('lib/actions/create-checkout-session.ts')
    expect(paths).toContain('app/api/webhooks/stripe/route.ts')
    expect(paths).toContain('app/checkout/success/page.tsx')
    expect(paths).toContain('app/checkout/cancel/page.tsx')
  })

  it('checkout 建 order + Stripe session + 無 key mock 模式', () => {
    const checkout = generateCommerceFiles(SCHEMA)!.find(f => f.path.includes('create-checkout'))!.content
    expect(checkout).toContain('INSERT INTO orders')
    expect(checkout).toContain('stripe.checkout.sessions.create')
    expect(checkout).toContain('STRIPE_SECRET_KEY')
    expect(checkout).toContain("status = 'paid'")
  })

  it('webhook 驗簽 + checkout.session.completed → 標記已付', () => {
    const webhook = generateCommerceFiles(SCHEMA)!.find(f => f.path.includes('webhooks/stripe'))!.content
    expect(webhook).toContain('constructEvent')
    expect(webhook).toContain('checkout.session.completed')
    expect(webhook).toContain("status = 'paid'")
  })

  it('無 orders 表 → 不生 commerce 檔', () => {
    expect(generateCommerceFiles('CREATE TABLE posts (id UUID PRIMARY KEY);')).toBeNull()
  })

  it('orders 生後台供站長管理訂單；order_items 排除', () => {
    const files = generateAdminPanel(SCHEMA, '商品: products', true, undefined, deriveContentModel(SCHEMA, '商品: products'))
    expect(files.some(f => f.path === 'app/admin/orders/page.tsx')).toBe(true)
    expect(files.some(f => f.path.includes('admin/order-items'))).toBe(false)
  })
})

// ============================================================
// M4: Upload Generator
// ============================================================

describe('Upload Generator (M4)', () => {
  describe('detectImageColumnsInSchema', () => {
    it('cover_image → true', () => {
      expect(detectImageColumnsInSchema(LEARN_SCHEMA)).toBe(true)
    })

    it('無 image 欄位 → false', () => {
      const schema = `CREATE TABLE tasks (id UUID PRIMARY KEY, title TEXT, completed BOOLEAN);`
      expect(detectImageColumnsInSchema(schema)).toBe(false)
    })

    it('avatar → true', () => {
      const schema = `CREATE TABLE profiles (id UUID PRIMARY KEY, avatar VARCHAR(500));`
      expect(detectImageColumnsInSchema(schema)).toBe(true)
    })
  })

  describe('generateUploadFiles', () => {
    it('有 image 欄位 → 2 個檔案', () => {
      const files = generateUploadFiles(LEARN_SCHEMA)
      expect(files).not.toBeNull()
      expect(files).toHaveLength(2)
      expect(files!.some(f => f.path.includes('ImageUpload'))).toBe(true)
      expect(files!.some(f => f.path.includes('upload/route.ts'))).toBe(true)
    })

    it('upload API 含雙模式', () => {
      const files = generateUploadFiles(LEARN_SCHEMA)!
      const api = files.find(f => f.path.includes('route.ts'))!
      expect(api.content).toContain('BLOB_READ_WRITE_TOKEN')
      expect(api.content).toContain("'uploads'")  // local fallback path
    })

    it('ImageUpload 組件有拖放 + 預覽', () => {
      const files = generateUploadFiles(LEARN_SCHEMA)!
      const comp = files.find(f => f.path.includes('ImageUpload'))!
      expect(comp.content).toContain('onDrop')
      expect(comp.content).toContain('preview')
      expect(comp.content).toContain("'use client'")
    })

    it('無 image 欄位 → null', () => {
      const schema = `CREATE TABLE tasks (id UUID PRIMARY KEY, title TEXT);`
      expect(generateUploadFiles(schema)).toBeNull()
    })
  })
})

// ============================================================
// 整合測試：Full M2-M4 Flow
// ============================================================

describe('Integration: Full M2-M4 Flow', () => {
  it('Learn schema → auth + admin + upload 全觸發', () => {
    const authFiles = generateAuthSystem(LEARN_SCHEMA)
    const adminFiles = generateAdminPanel(LEARN_SCHEMA, LEARN_ENTITY_MAPPING, true)
    const uploadFiles = generateUploadFiles(LEARN_SCHEMA)

    expect(authFiles).not.toBeNull()
    expect(adminFiles.length).toBeGreaterThan(0)
    expect(uploadFiles).not.toBeNull()

    const totalFiles = authFiles!.length + adminFiles.length + uploadFiles!.length
    // 7 auth + 22 admin + 2 upload = 31
    expect(totalFiles).toBe(31)
  })

  it('無 auth schema → 只有 admin + upload', () => {
    // NO_AUTH_SCHEMA 有 product_id FK 但無 image → 無 upload
    const authFiles = generateAuthSystem(NO_AUTH_SCHEMA)
    const adminFiles = generateAdminPanel(NO_AUTH_SCHEMA, NO_AUTH_MAPPING, false)
    const uploadFiles = generateUploadFiles(NO_AUTH_SCHEMA)

    expect(authFiles).toBeNull()
    expect(adminFiles.length).toBeGreaterThan(0)
    expect(uploadFiles).toBeNull()
  })

  it('有 auth 無 image → auth + admin, 無 upload', () => {
    const noImageMapping = `entity_to_table_mapping:\n  - 用戶: users\n  - 任務: tasks`
    const authFiles = generateAuthSystem(NO_IMAGE_SCHEMA)
    const adminFiles = generateAdminPanel(NO_IMAGE_SCHEMA, noImageMapping, true)
    const uploadFiles = generateUploadFiles(NO_IMAGE_SCHEMA)

    expect(authFiles).not.toBeNull()
    expect(authFiles).toHaveLength(7)
    // admin: tasks only (users filtered), 6 共用 + 1×4 = 10
    expect(adminFiles).toHaveLength(10)
    expect(uploadFiles).toBeNull()
  })

  it('所有生成檔案路徑不重複', () => {
    const authFiles = generateAuthSystem(LEARN_SCHEMA)!
    const adminFiles = generateAdminPanel(LEARN_SCHEMA, LEARN_ENTITY_MAPPING, true)
    const uploadFiles = generateUploadFiles(LEARN_SCHEMA)!

    const allPaths = [...authFiles, ...adminFiles, ...uploadFiles].map(f => f.path)
    const unique = new Set(allPaths)
    expect(unique.size).toBe(allPaths.length)
  })
})
