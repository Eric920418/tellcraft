-- 027: Dashboard 效能索引
-- 複合索引加速用戶儀表板「最近專案」排序（LATERAL JOIN + ORDER BY updated_at DESC）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_updated
  ON projects(user_id, updated_at DESC);
