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
