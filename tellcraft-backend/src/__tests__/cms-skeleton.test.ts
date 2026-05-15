import { describe, it, expect } from 'vitest'
import {
  detectCmsShape,
  getCmsSkeletonDdl,
  getCmsSkeletonManifest,
  generateSkeletonFeatures,
  generateSkeletonServerActions,
  isSkeletonActionName,
  getSkeletonFeatureMeta,
  CMS_SKELETON_ENTITY_MAPPING,
  CMS_SKELETON_VERSION,
} from '../services/cms-skeleton'

describe('CMS Skeleton — manifest', () => {
  it('manifest 版本號可讀', () => {
    expect(CMS_SKELETON_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('manifest 含 4 個 modules（admin_auth / soft_delete / pagination / admin_panel_layout）', () => {
    const m = getCmsSkeletonManifest()
    expect(Object.keys(m.modules).sort()).toEqual([
      'admin_auth', 'admin_panel_layout', 'pagination', 'soft_delete',
    ])
  })

  it('admin_auth 的 canonical_test_username/password 是 admin/admin123', () => {
    const m = getCmsSkeletonManifest()
    expect(m.modules.admin_auth.slots.canonical_test_username.default).toBe('admin')
    expect(m.modules.admin_auth.slots.canonical_test_password.default).toBe('admin123')
  })

  it('manifest 含 5 個 canonical_features', () => {
    const m = getCmsSkeletonManifest()
    expect(m.canonical_features.length).toBe(5)
    const names = m.canonical_features.map(f => f.name)
    expect(names).toContain('Admin Login')
    expect(names).toContain('Get Site Settings')
  })
})

describe('CMS Skeleton — detectCmsShape', () => {
  it('純 admin login + site settings 命中 (50 分 < 60，不到 threshold)', () => {
    const result = detectCmsShape({
      features: [
        { name: 'Admin Login', actionName: 'admin_login' },
        { name: 'Get Site Settings', actionName: 'get_site_settings' },
      ],
    })
    expect(result.score).toBe(50)  // 30 + 20
    expect(result.isCmsShape).toBe(false)  // 未到 60
  })

  it('admin login + 3 CRUD entities + site settings → 80 分 isCmsShape=true', () => {
    const result = detectCmsShape({
      features: [
        { name: 'Admin Login', actionName: 'admin_login' },
        { name: 'List FAQs', actionName: 'list_faqs' },
        { name: 'Create FAQ', actionName: 'create_faq' },
        { name: 'List Pricing Plans', actionName: 'list_pricing_plans' },
        { name: 'Create Pricing Plan', actionName: 'create_pricing_plan' },
        { name: 'List Testimonials', actionName: 'list_testimonials' },
        { name: 'Update Testimonial', actionName: 'update_testimonial' },
        { name: 'Get Site Settings', actionName: 'get_site_settings' },
      ],
    })
    expect(result.score).toBe(80)
    expect(result.isCmsShape).toBe(true)
    expect(result.reasons.length).toBe(3)
  })

  it('純 landing page（無 admin）→ score 低不命中', () => {
    const result = detectCmsShape({
      features: [
        { name: 'Submit Inquiry', actionName: 'submit_inquiry' },
      ],
    })
    expect(result.score).toBeLessThan(60)
    expect(result.isCmsShape).toBe(false)
  })

  it('bb0d1081 場景（AC Cleaning CMS）期望 isCmsShape=true', () => {
    // bb0d1081 真實 features 子集
    const result = detectCmsShape({
      features: [
        { name: 'Admin Login', actionName: 'admin_login' },
        { name: 'List FAQs', actionName: 'list_faqs' },
        { name: 'Create FAQ', actionName: 'create_faq' },
        { name: 'Update FAQ', actionName: 'update_faq' },
        { name: 'Delete FAQ', actionName: 'delete_faq' },
        { name: 'List Pricing Plans', actionName: 'list_pricing_plans' },
        { name: 'Create Pricing Plan', actionName: 'create_pricing_plan' },
        { name: 'Update Pricing Plan', actionName: 'update_pricing_plan' },
        { name: 'List Testimonials', actionName: 'list_testimonials' },
        { name: 'Create Testimonial', actionName: 'create_testimonial' },
        { name: 'Get Site Settings', actionName: 'get_site_settings' },
      ],
    })
    expect(result.isCmsShape).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(80)
  })

  it('upload action 加 20 分', () => {
    const result = detectCmsShape({
      features: [
        { name: 'Upload Image', actionName: 'upload_image' },
      ],
    })
    expect(result.reasons.some(r => r.rule === 'uploadAction')).toBe(true)
  })

  it('reasons 包含命中規則的 evidence', () => {
    const result = detectCmsShape({
      features: [{ name: 'Admin Login', actionName: 'admin_login' }],
    })
    expect(result.reasons.length).toBe(1)
    expect(result.reasons[0].rule).toBe('adminLoginFeature')
    expect(result.reasons[0].evidence).toContain('Admin Login')
  })

  it('CRUD detection 跨 plural / singular', () => {
    const result = detectCmsShape({
      features: [
        { name: 'list_products', actionName: 'list_products' },
        { name: 'create_product', actionName: 'create_product' },
        { name: 'update_product', actionName: 'update_product' },
        { name: 'list_orders', actionName: 'list_orders' },
        { name: 'create_order', actionName: 'create_order' },
        { name: 'list_categories', actionName: 'list_categories' },
        { name: 'create_category', actionName: 'create_category' },
      ],
    })
    // 3 entities 各 ≥2 verbs（product/order/category）→ 命中 crudPairs
    expect(result.reasons.some(r => r.rule === 'crudPairs')).toBe(true)
  })
})

describe('CMS Skeleton — getCmsSkeletonDdl', () => {
  it('預設輸出 admins + site_settings 兩表', () => {
    const ddl = getCmsSkeletonDdl()
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS admins')
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS site_settings')
    expect(ddl).not.toContain('media_uploads')
  })

  it('可選 media_uploads', () => {
    const ddl = getCmsSkeletonDdl(['admins', 'media_uploads'])
    expect(ddl).toContain('admins')
    expect(ddl).toContain('media_uploads')
  })

  it('admins 表含必要欄位（id/username/password_hash/role/deleted_at）', () => {
    const ddl = getCmsSkeletonDdl(['admins'])
    expect(ddl).toMatch(/id UUID PRIMARY KEY/)
    expect(ddl).toMatch(/username VARCHAR.*NOT NULL UNIQUE/)
    expect(ddl).toMatch(/password_hash TEXT NOT NULL/)
    expect(ddl).toMatch(/role VARCHAR/)
    expect(ddl).toMatch(/deleted_at TIMESTAMPTZ/)
  })

  it('entity mapping 對應 plural table names', () => {
    expect(CMS_SKELETON_ENTITY_MAPPING.Admin).toBe('admins')
    expect(CMS_SKELETON_ENTITY_MAPPING.SiteSetting).toBe('site_settings')
  })
})

describe('CMS Skeleton — generateSkeletonFeatures', () => {
  it('回傳 5 個 features', () => {
    const features = generateSkeletonFeatures()
    expect(features.length).toBe(5)
  })

  it('Admin Login 的 BDD 用 admin/admin123（manifest 預設）', () => {
    const features = generateSkeletonFeatures()
    const login = features.find(f => f.name === 'Admin Login')!
    expect(login.content).toContain('| admin |')  // entity_setup row 含 username=admin
    expect(login.content).toContain('admin123')   // password 出現多次（setup + scenario）
    expect(login.content).toContain('Feature: Admin Login')
    expect(login.content).toContain('# [POST] /api/admin/login')
  })

  it('可傳入自訂 username/password（slot override）', () => {
    const features = generateSkeletonFeatures({ username: 'superuser', password: 'sup3r!' })
    const login = features.find(f => f.name === 'Admin Login')!
    expect(login.content).toContain('superuser')
    expect(login.content).toContain('sup3r!')
    // 不該再出現預設 admin123 在 setup row
    expect(login.content).not.toMatch(/\|\s*admin\s*\|\s*admin123\s*\|/)
  })

  it('每個 feature 對應 skeletonModule', () => {
    const features = generateSkeletonFeatures()
    const modules = new Set(features.map(f => f.skeletonModule))
    expect(modules.has('admin_auth')).toBe(true)
    expect(modules.has('site_settings')).toBe(true)
  })

  it('content 是合法 BDD format（含 Feature: / Background: / Example:）', () => {
    const features = generateSkeletonFeatures()
    for (const f of features) {
      expect(f.content).toMatch(/Feature:\s+/)
      expect(f.content).toMatch(/Example:\s+/)
      expect(f.content).toMatch(/^#\s*Action:\s+\w+/m)
    }
  })

  it('Admin Login 含「Missing password 操作失敗」negative scenario', () => {
    const features = generateSkeletonFeatures()
    const login = features.find(f => f.name === 'Admin Login')!
    expect(login.content).toContain('Missing password causes failure')
    expect(login.content).toContain('Then 操作失敗')
  })
})

describe('CMS Skeleton — generateSkeletonServerActions (Week 2)', () => {
  it('回傳 5 個 Server Action files', () => {
    const actions = generateSkeletonServerActions()
    expect(actions.length).toBe(5)
    const names = actions.map(a => a.actionName).sort()
    expect(names).toEqual([
      'admin_login', 'admin_logout', 'get_site_settings',
      'list_admins', 'update_admin_profile',
    ])
  })

  it('admin_login Server Action 含 bcrypt + JWT + DB query', () => {
    const actions = generateSkeletonServerActions()
    const login = actions.find(a => a.actionName === 'admin_login')!
    expect(login.filePath).toBe('lib/actions/admin-login.ts')
    expect(login.fnName).toBe('adminLogin')
    expect(login.content).toContain("import bcrypt from 'bcryptjs'")
    expect(login.content).toContain("import jwt from 'jsonwebtoken'")
    expect(login.content).toContain('bcrypt.compare')
    expect(login.content).toContain('jwt.sign')
    expect(login.content).toContain('FROM admins')
    expect(login.content).toContain('deleted_at IS NULL')
    expect(login.content).toContain('__status: 200')
    expect(login.content).toContain('JWT_SECRET is not configured')
  })

  it('每個 Server Action 都用 sql tagged template + soft-delete 感知（如適用）', () => {
    const actions = generateSkeletonServerActions()
    for (const a of actions) {
      // logout 例外（無 DB query）
      if (a.actionName === 'admin_logout') continue
      expect(a.content).toMatch(/sql`/)
    }
    // 涉及 admins 表的 SELECT 都要 deleted_at filter
    const adminQueries = actions.filter(a =>
      a.actionName === 'admin_login' || a.actionName === 'list_admins' || a.actionName === 'update_admin_profile'
    )
    for (const a of adminQueries) {
      expect(a.content).toContain('deleted_at IS NULL')
    }
  })

  it('canonical password 用 manifest 預設', () => {
    const actions = generateSkeletonServerActions()
    const login = actions.find(a => a.actionName === 'admin_login')!
    // expiresIn 從 slot 預設
    expect(login.content).toContain("'7d'")
  })

  it('支援 jwtExpiresIn slot override', () => {
    const actions = generateSkeletonServerActions({ jwtExpiresIn: '30d' })
    const login = actions.find(a => a.actionName === 'admin_login')!
    expect(login.content).toContain("'30d'")
    expect(login.content).not.toContain("'7d'")
  })
})

describe('CMS Skeleton — injectCmsSkeletonFeaturesIfApplicable (formulation hook)', () => {
  const loadHook = async () => {
    const mod = await import('../services/formulation')
    return mod.injectCmsSkeletonFeaturesIfApplicable
  }

  const cmsFeatures = [
    { name: 'Admin Login', actionName: 'admin_login', content: '功能: Admin Login\n' },
    { name: 'List Faqs', actionName: 'list_faqs', content: '功能: List Faqs\n' },
    { name: 'Create Faq', actionName: 'create_faq', content: '功能: Create Faq\n' },
    { name: 'Update Faq', actionName: 'update_faq', content: '功能: Update Faq\n' },
    { name: 'Delete Faq', actionName: 'delete_faq', content: '功能: Delete Faq\n' },
    { name: 'List Pricing Plans', actionName: 'list_pricing_plans', content: '功能: List Pricing Plans\n' },
    { name: 'Create Pricing Plan', actionName: 'create_pricing_plan', content: '功能: Create Pricing Plan\n' },
    { name: 'Update Pricing Plan', actionName: 'update_pricing_plan', content: '功能: Update Pricing Plan\n' },
    { name: 'Delete Pricing Plan', actionName: 'delete_pricing_plan', content: '功能: Delete Pricing Plan\n' },
    { name: 'List Testimonials', actionName: 'list_testimonials', content: '功能: List Testimonials\n' },
    { name: 'Create Testimonial', actionName: 'create_testimonial', content: '功能: Create Testimonial\n' },
    { name: 'Get Site Settings', actionName: 'get_site_settings', content: '功能: Get Site Settings\n' },
  ]
  const cmsSchema = `
CREATE TABLE faqs (id SERIAL PRIMARY KEY, question TEXT);
CREATE TABLE pricing_plans (id SERIAL PRIMARY KEY, name TEXT);
CREATE TABLE testimonials (id SERIAL PRIMARY KEY, content TEXT);
`.trim()
  const cmsMapping = `entity_mapping:\n  Faq: faqs\n  PricingPlan: pricing_plans\n  Testimonial: testimonials`

  it('非 CMS shape 維持原樣（短路 detect）', async () => {
    const hook = await loadHook()
    const features = [
      { name: 'Calculate Tax', actionName: 'calculate_tax', content: '功能: Calculate Tax\n' },
    ]
    const result = await hook(features, 'CREATE TABLE t1 (id INT);', 'entity_mapping:\n  T1: t1')
    expect(result.features.length).toBe(features.length)
  })

  it('CMS shape 注入 missing skeleton features', async () => {
    const hook = await loadHook()
    const result = await hook(cmsFeatures, cmsSchema, cmsMapping)
    const names = result.features.map(f => f.actionName)
    expect(names).toContain('admin_logout')
    expect(names).toContain('list_admins')
    expect(names).toContain('update_admin_profile')
    expect(names.filter(n => n === 'admin_login').length).toBe(1)
    expect(names.filter(n => n === 'get_site_settings').length).toBe(1)
  })

  it('CMS shape append DDL 與 entity_mapping（IF NOT EXISTS 安全）', async () => {
    const hook = await loadHook()
    const result = await hook(cmsFeatures, cmsSchema, cmsMapping)
    expect(result.schemaSql).toContain('CREATE TABLE IF NOT EXISTS admins')
    expect(result.schemaSql).toContain('CREATE TABLE IF NOT EXISTS site_settings')
    expect(result.entityMapping).toMatch(/^\s*Admin:\s+admins/m)
    expect(result.entityMapping).toMatch(/^\s*SiteSetting:\s+site_settings/m)
  })

  it('idempotent：跑兩次結果跟跑一次完全等價', async () => {
    const hook = await loadHook()
    const once = await hook(cmsFeatures, cmsSchema, cmsMapping)
    const twice = await hook(once.features, once.schemaSql, once.entityMapping)

    expect(twice.features.length).toBe(once.features.length)
    expect(twice.schemaSql).toBe(once.schemaSql)
    expect(twice.entityMapping).toBe(once.entityMapping)
    const adminsTableCount = (twice.schemaSql.match(/CREATE TABLE IF NOT EXISTS admins/g) || []).length
    expect(adminsTableCount).toBe(1)
    const adminMapCount = (twice.entityMapping.match(/^\s*Admin:\s+admins/gm) || []).length
    expect(adminMapCount).toBe(1)
  })
})

describe('CMS Skeleton — isSkeletonActionName / getSkeletonFeatureMeta', () => {
  it('isSkeletonActionName 正確識別 5 個 canonical', () => {
    expect(isSkeletonActionName('admin_login')).toBe(true)
    expect(isSkeletonActionName('admin_logout')).toBe(true)
    expect(isSkeletonActionName('list_admins')).toBe(true)
    expect(isSkeletonActionName('update_admin_profile')).toBe(true)
    expect(isSkeletonActionName('get_site_settings')).toBe(true)
  })

  it('非 skeleton actionName 回 false', () => {
    expect(isSkeletonActionName('create_faq')).toBe(false)
    expect(isSkeletonActionName('list_pricing_plans')).toBe(false)
    expect(isSkeletonActionName('update_site_setting')).toBe(false)  // 注意是 site_setting 單數，非 skeleton
  })

  it('getSkeletonFeatureMeta 回 method/path', () => {
    expect(getSkeletonFeatureMeta('admin_login')).toEqual({ method: 'POST', path: '/api/admin/login' })
    expect(getSkeletonFeatureMeta('list_admins')).toEqual({ method: 'GET', path: '/api/admin/admins' })
    expect(getSkeletonFeatureMeta('update_admin_profile')).toEqual({ method: 'PUT', path: '/api/admin/profile' })
  })

  it('非 skeleton actionName 回 null', () => {
    expect(getSkeletonFeatureMeta('create_faq')).toBeNull()
  })
})
