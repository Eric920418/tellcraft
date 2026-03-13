-- 023: Supabase Provisioning 支援
-- projects 表已有 supabase_org_id / supabase_project_id / supabase_url / supabase_anon_key (migration 001)
-- 只需新增 service_role_key（後端 API 可能需要）

ALTER TABLE projects ADD COLUMN IF NOT EXISTS supabase_service_role_key TEXT;

-- Quota 查詢索引：快速計算用戶已建立的 Supabase 專案數量
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_supabase
  ON projects (user_id) WHERE supabase_project_id IS NOT NULL;
