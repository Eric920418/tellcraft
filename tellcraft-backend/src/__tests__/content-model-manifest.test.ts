import { describe, it, expect } from 'vitest'
import { deriveContentModel } from '../services/content-model/manifest'

describe('Content Model — deriveContentModel', () => {
  it('衍生 bespoke 內容型別並偵測 draft_publish + schedule + media + taxonomy', () => {
    const schema = `
CREATE TABLE categories (
  id VARCHAR PRIMARY KEY,
  name VARCHAR(120) NOT NULL
);
CREATE TABLE products (
  id VARCHAR PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  cover_image VARCHAR(512),
  category_id VARCHAR REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);`
    const m = deriveContentModel(schema, '商品: products\n分類: categories')
    expect(m.version).toBe(1)
    const product = m.contentTypes.find(t => t.tableName === 'products')!
    expect(product).toBeTruthy()
    expect(product.source).toBe('bespoke')
    expect(product.entityName).toBe('商品')
    expect(product.displayColumn).toBe('title')
    expect(product.capabilities).toEqual(expect.arrayContaining(['draft_publish', 'schedule', 'media']))
    expect(product.statusColumn).toBe('status')
    expect(product.publishedAtColumn).toBe('published_at')
    expect(product.bodyColumn).toBe('body')
    expect(product.mediaColumns).toContain('cover_image')
    expect(product.taxonomies).toContain('categories')
  })

  it('支援 CREATE TABLE IF NOT EXISTS（skeleton / content 模組語法不被 parseCreateTables 丟掉）', () => {
    const schema = `CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft'
);`
    const m = deriveContentModel(schema, '')
    const post = m.contentTypes.find(t => t.tableName === 'posts')
    expect(post).toBeTruthy()
    expect(post!.source).toBe('content_module') // posts ∈ CONTENT_MODULE_TABLES
    expect(post!.capabilities).toContain('draft_publish')
  })

  it('偵測 media_uploads 為 mediaTable，且不列為 content type', () => {
    const schema = `CREATE TABLE articles (
  id VARCHAR PRIMARY KEY,
  headline VARCHAR(200)
);
CREATE TABLE IF NOT EXISTS media_uploads (
  id UUID PRIMARY KEY,
  file_name VARCHAR(256) NOT NULL
);`
    const m = deriveContentModel(schema, '')
    expect(m.mediaTable).toBe('media_uploads')
    expect(m.contentTypes.find(t => t.tableName === 'media_uploads')).toBeUndefined()
    expect(m.contentTypes.find(t => t.tableName === 'articles')).toBeTruthy()
  })

  it('排除系統 / 認證 / skeleton 技術表，只留真正的內容表', () => {
    const schema = `CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR(255)
);
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY,
  username VARCHAR(64)
);
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY,
  setting_key VARCHAR(128)
);
CREATE TABLE posts (
  id VARCHAR PRIMARY KEY,
  title VARCHAR(200)
);`
    const names = deriveContentModel(schema, '').contentTypes.map(t => t.tableName)
    expect(names).toContain('posts')
    expect(names).not.toContain('users')
    expect(names).not.toContain('admins')
    expect(names).not.toContain('site_settings')
  })

  it('displayColumn 優先序：title > name', () => {
    const schema = `CREATE TABLE widgets (
  id VARCHAR PRIMARY KEY,
  name VARCHAR(100),
  title VARCHAR(100)
);`
    expect(deriveContentModel(schema, '').contentTypes[0].displayColumn).toBe('title')
  })

  it('無工作流欄位的純資料表 → capabilities 空陣列', () => {
    const schema = `CREATE TABLE tags (
  id VARCHAR PRIMARY KEY,
  label VARCHAR(80) NOT NULL
);`
    const tags = deriveContentModel(schema, '').contentTypes.find(t => t.tableName === 'tags')!
    expect(tags.capabilities).toEqual([])
    expect(tags.displayColumn).toBe('label')
  })

  it('content_versions 表存在 → draft_publish 內容型別獲得 version 能力（A3）', () => {
    const schema = `CREATE TABLE posts (id UUID PRIMARY KEY, title VARCHAR(200), status VARCHAR(20) DEFAULT 'draft');
CREATE TABLE IF NOT EXISTS content_versions (id UUID PRIMARY KEY, content_table VARCHAR(64), content_id UUID, snapshot JSONB);`
    expect(deriveContentModel(schema, '文章: posts').contentTypes.find(t => t.tableName === 'posts')!.capabilities).toContain('version')
  })

  it('無 content_versions → 無 version 能力', () => {
    const schema = `CREATE TABLE posts (id UUID PRIMARY KEY, title VARCHAR(200), status VARCHAR(20) DEFAULT 'draft');`
    expect(deriveContentModel(schema, '文章: posts').contentTypes.find(t => t.tableName === 'posts')!.capabilities).not.toContain('version')
  })

  it('fail-soft：空 / 壞 schema 回空 manifest（不 throw）', () => {
    expect(deriveContentModel('', '')).toEqual({ version: 1, contentTypes: [], mediaTable: null })
    expect(() => deriveContentModel('not sql at all {{{', '')).not.toThrow()
    expect(deriveContentModel('garbage input', '').contentTypes).toEqual([])
  })
})
