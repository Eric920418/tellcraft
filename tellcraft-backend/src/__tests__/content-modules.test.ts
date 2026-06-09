import { describe, it, expect, vi, afterEach } from 'vitest'
import { getEnv } from '../lib/env'
import '../services/cms-skeleton/modules' // 確保 blog/pages 註冊
import { getModuleById, getAllModules, selectEnabledModules } from '../services/cms-skeleton'

// setup.ts 全域 mock getEnv() 回固定物件（不含 ENABLE_CONTENT_MODEL → undefined → ship-dark off）
const BASE_ENV = getEnv() as Record<string, unknown>
function withContentModel(enabled: boolean) {
  vi.mocked(getEnv).mockReturnValue({ ...BASE_ENV, ENABLE_CONTENT_MODEL: enabled } as never)
}
afterEach(() => {
  vi.mocked(getEnv).mockReturnValue(BASE_ENV as never)
})

describe('Content Modules — blog / pages（A1）', () => {
  it('blog / pages 已註冊', () => {
    const ids = getAllModules().map(m => m.id)
    expect(ids).toContain('blog')
    expect(ids).toContain('pages')
  })

  it('blog 模組 DDL 含工作流欄位（posts + status/published_at/scheduled_for/slug/body）', () => {
    const mod = getModuleById('blog')!
    expect(mod.displayName).toBe('Blog / Posts')
    expect(mod.entityMapping).toEqual({ Post: 'posts' })
    for (const frag of ['CREATE TABLE IF NOT EXISTS posts', 'status VARCHAR', 'published_at', 'scheduled_for', 'slug', 'body']) {
      expect(mod.ddl).toContain(frag)
    }
  })

  it('blog server action 跳 LLM 確定性產出（listPublishedPosts + 只回 published）', () => {
    const mod = getModuleById('blog')!
    const actions = mod.generateServerActions({})
    expect(actions.map(a => a.actionName)).toContain('list_published_posts')
    const list = actions.find(a => a.actionName === 'list_published_posts')!
    expect(list.filePath).toBe('lib/actions/list-published-posts.ts')
    expect(list.content).toContain('export async function listPublishedPosts')
    expect(list.content).toContain("status = 'published'")
    expect(list.content).toContain('deleted_at IS NULL')
  })

  it('blog list_published_posts 含 on-read 排程 fallback（到期排程即時公開，不等 cron）', () => {
    const list = getModuleById('blog')!.generateServerActions({}).find(a => a.actionName === 'list_published_posts')!
    expect(list.content).toContain("status = 'scheduled'")
    expect(list.content).toContain('scheduled_for <= NOW()')
  })

  it('pages 模組 DDL 含工作流欄位（pages + status/published_at）', () => {
    const mod = getModuleById('pages')!
    for (const frag of ['CREATE TABLE IF NOT EXISTS pages', 'status VARCHAR', 'published_at', 'slug']) {
      expect(mod.ddl).toContain(frag)
    }
  })

  it('ship-dark：ENABLE_CONTENT_MODEL off（預設）→ 即使有 blog 關鍵字也不啟用', () => {
    const blog = getModuleById('blog')!
    const pages = getModuleById('pages')!
    // 預設 mock 無 ENABLE_CONTENT_MODEL → falsy
    expect(blog.detect({ features: [{ name: 'Create Blog Post', actionName: 'create_blog_post' }] }).matched).toBe(false)
    expect(pages.detect({ features: [{ name: 'Manage Pages', actionName: 'manage_pages' }] }).matched).toBe(false)
    // selectEnabledModules 也不選它們
    const enabled = selectEnabledModules(getAllModules(), {
      features: [{ name: 'List Blog Posts', actionName: 'list_blog_posts' }],
    }).map(m => m.id)
    expect(enabled).not.toContain('blog')
  })

  it('flag-on：ENABLE_CONTENT_MODEL true → blog 關鍵字命中才啟用', () => {
    withContentModel(true)
    const blog = getModuleById('blog')!
    expect(blog.detect({ features: [{ name: 'Create Blog Post', actionName: 'create_blog_post' }] }).matched).toBe(true)
    // 無 blog 關鍵字 → 不啟用
    expect(blog.detect({ features: [{ name: 'List Products', actionName: 'list_products' }] }).matched).toBe(false)
    // selectEnabledModules 選到 blog
    const enabled = selectEnabledModules(getAllModules(), {
      features: [{ name: 'Publish Article', actionName: 'publish_article' }],
    }).map(m => m.id)
    expect(enabled).toContain('blog')
  })
})
