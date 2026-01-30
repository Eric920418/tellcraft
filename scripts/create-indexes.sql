-- ============================================================
-- Tellcraft 資料庫索引優化
-- 執行方式: 複製到 Supabase Dashboard > SQL Editor 執行
-- ============================================================

-- 1. 加速 conversations 按 project_id 和 updated_at 查詢
-- 用於: getConversationMessages, getUserConversations
CREATE INDEX IF NOT EXISTS idx_conversations_project_updated
  ON conversations(project_id, updated_at DESC);

-- 2. 加速用戶專案查詢
-- 用於: getUserStats, getUserProjects
CREATE INDEX IF NOT EXISTS idx_projects_user_id
  ON projects(user_id);

-- 3. 加速部署狀態查詢
-- 用於: getUserStats, getAdminStats
CREATE INDEX IF NOT EXISTS idx_deployments_project_status
  ON deployments(project_id, status);

-- 4. 加速 LLM 用量時間查詢
-- 用於: getLLMUsageStats, getAdminStats
CREATE INDEX IF NOT EXISTS idx_llm_usage_created
  ON llm_usage(created_at DESC);

-- 5. 加速用戶 LLM 用量查詢
-- 用於: getUserDetail
CREATE INDEX IF NOT EXISTS idx_llm_usage_user_created
  ON llm_usage(user_id, created_at DESC);

-- 6. 加速任務查詢
-- 用於: getConversationMessages 查詢活躍任務
CREATE INDEX IF NOT EXISTS idx_tasks_project_status
  ON tasks(project_id, status);

-- 驗證索引是否創建成功
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
