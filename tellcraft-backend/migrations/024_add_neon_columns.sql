-- 024: Supabase → Neon 遷移
-- Supabase provisioning 從未上線 production，所有欄位皆 NULL，直接清除

-- 1. 移除舊 Supabase 欄位（001 + 023 建的）
ALTER TABLE projects DROP COLUMN IF EXISTS supabase_org_id;
ALTER TABLE projects DROP COLUMN IF EXISTS supabase_project_id;
ALTER TABLE projects DROP COLUMN IF EXISTS supabase_url;
ALTER TABLE projects DROP COLUMN IF EXISTS supabase_anon_key;
ALTER TABLE projects DROP COLUMN IF EXISTS supabase_service_role_key;

-- 2. 移除舊索引（023 建的）
DROP INDEX CONCURRENTLY IF EXISTS idx_projects_user_supabase;

-- 3. 新增 Neon 欄位
ALTER TABLE projects ADD COLUMN IF NOT EXISTS neon_project_id TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS neon_connection_string TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS neon_host TEXT;

-- 4. Neon quota 查詢索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_neon
  ON projects (user_id) WHERE neon_project_id IS NOT NULL;
