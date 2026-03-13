-- Neon Database Provisioning 欄位
ALTER TABLE projects ADD COLUMN IF NOT EXISTS neon_project_id TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS neon_connection_string TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS neon_host TEXT;

-- 查詢用戶已建立的 Neon DB 數量（配額檢查）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_neon
  ON projects (user_id) WHERE neon_project_id IS NOT NULL;
