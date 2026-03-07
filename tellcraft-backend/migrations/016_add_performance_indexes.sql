-- Phase 4-E2: 效能索引
-- 執行方式: psql "$DATABASE_URL" -f tellcraft-backend/migrations/016_add_performance_indexes.sql

-- Dashboard stats：對話按專案+更新時間排序
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_project_updated
  ON conversations(project_id, updated_at DESC);

-- Dashboard stats：部署按專案+狀態篩選
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deployments_project_status
  ON deployments(project_id, status);

-- Messages 按對話+時間排序（高頻查詢）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_created
  ON messages(conversation_id, created_at DESC);

-- LLM 用量按日期+模型聚合
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_llm_usage_date_model
  ON llm_usage(created_at DESC, model);
