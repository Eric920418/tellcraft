/**
 * M6 整合驗證測試
 * 驗證 M2（Auth）、M3（Admin Panel）、M4（Upload）的模板生成邏輯
 * 使用 Learn 專案風格的 schema 作為 fixture
 */
import { describe, it, expect } from 'vitest'
import { detectAuthInSchema, generateAuthSystem, injectSessionProvider } from '../services/coder-auth-templates'
import { generateAdminPanel, parseColumnDefinitions } from '../services/coder-admin-templates'
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
