// ============================================================
// CMS Skeleton — canonical entity DDL
//
// 任何 CMS 都有的 3 張表：
//   admins         — 管理員（auth 流程依賴）
//   site_settings  — 全站設定 key-value
//   media_uploads  — 上傳的圖片/檔案 metadata
//
// 這些 DDL 是「永遠這樣」的技術骨架。客戶自己的 entity（FAQ / Pricing / Testimonial）
// 由 LLM 從 BDD 推導不在此範圍。
// ============================================================

export const CMS_SKELETON_DDL = {
  admins: `
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(128),
  role VARCHAR(32) NOT NULL DEFAULT 'admin',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username) WHERE deleted_at IS NULL;
`.trim(),

  site_settings: `
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(128) NOT NULL UNIQUE,
  setting_value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);
`.trim(),

  media_uploads: `
CREATE TABLE IF NOT EXISTS media_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(256) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(128),
  file_size BIGINT,
  uploaded_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_media_uploads_uploaded_by ON media_uploads(uploaded_by);
`.trim(),

  content_versions: `
CREATE TABLE IF NOT EXISTS content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_table VARCHAR(64) NOT NULL,
  content_id UUID NOT NULL,
  snapshot JSONB NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_content_versions_lookup ON content_versions(content_table, content_id, created_at DESC);
`.trim(),

  roles: `
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`.trim(),

  capabilities: `
CREATE TABLE IF NOT EXISTS capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(128) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`.trim(),

  role_capabilities: `
CREATE TABLE IF NOT EXISTS role_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL,
  capability_id UUID NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_role_capabilities ON role_capabilities(role_id, capability_id);
`.trim(),

  orders: `
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  total_cents INTEGER NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'usd',
  customer_email VARCHAR(255),
  stripe_session_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at DESC);
`.trim(),

  order_items: `
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
`.trim(),
} as const

export type SkeletonTable = keyof typeof CMS_SKELETON_DDL

/**
 * 整合輸出 — 給 schema-derivation 注入用
 */
export function getCmsSkeletonDdl(includeTables: SkeletonTable[] = ['admins', 'site_settings']): string {
  return includeTables.map(t => CMS_SKELETON_DDL[t]).join('\n\n')
}

/**
 * Entity → table mapping（給 BDD entity-mapping.yml 注入用）
 */
export const CMS_SKELETON_ENTITY_MAPPING: Record<string, string> = {
  Admin: 'admins',
  SiteSetting: 'site_settings',
  MediaUpload: 'media_uploads',
}
