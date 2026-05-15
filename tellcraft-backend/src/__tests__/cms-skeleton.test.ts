import { describe, it, expect } from 'vitest'
import {
  detectCmsShape,
  getCmsSkeletonDdl,
  getCmsSkeletonManifest,
  generateSkeletonFeatures,
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
