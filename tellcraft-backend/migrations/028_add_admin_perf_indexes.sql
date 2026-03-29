-- 028: Admin Dashboard 效能索引
-- 執行方式: psql "$DATABASE_URL" -f tellcraft-backend/migrations/028_add_admin_perf_indexes.sql

-- ILIKE 搜尋加速（admin/users 頁面的 email/name 搜尋）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_trgm
  ON users USING gin (email gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_name_trgm
  ON users USING gin (name gin_trgm_ops);

-- LLM 用量按 user_id 聚合加速（admin/users/:userId 的 SUM(cost_usd)）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_llm_usage_user_created
  ON llm_usage(user_id, created_at DESC);
