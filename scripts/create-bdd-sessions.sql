-- ============================================================
-- BDD Sessions 資料表
-- 用於追蹤 BDD 釐清會話狀態
-- 執行方式: 複製到 Supabase Dashboard > SQL Editor 執行
-- ============================================================

-- BDD Session 狀態表
CREATE TABLE IF NOT EXISTS bdd_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,

  -- 當前階段
  -- prd_discovery: PRD 發現階段
  -- prd_clarify: PRD 釐清階段
  -- formulation: 規格產出階段
  -- spec_discovery: 規格發現階段
  -- spec_clarify: 規格釐清階段
  -- actions_design: Actions 設計階段
  -- isa_config: ISA 配置階段
  -- completed: 已完成
  current_phase TEXT NOT NULL DEFAULT 'prd_discovery' CHECK (
    current_phase IN (
      'prd_discovery',
      'prd_clarify',
      'formulation',
      'spec_discovery',
      'spec_clarify',
      'actions_design',
      'isa_config',
      'completed'
    )
  ),

  -- 當前輪次
  current_round INT NOT NULL DEFAULT 1,

  -- 當前問題索引（在 clarify 階段使用）
  current_question_index INT NOT NULL DEFAULT 0,

  -- 統計
  total_discovered INT NOT NULL DEFAULT 0,       -- 總發現問題數
  total_resolved INT NOT NULL DEFAULT 0,         -- 已解決問題數
  consecutive_empty_rounds INT NOT NULL DEFAULT 0, -- 連續空輪數（用於終止條件）

  -- 釐清項目狀態 (JSONB)
  -- 格式: [{ id, question, category, priority, status, answer?, options? }]
  -- status: pending | reviewing | confirmed | resolved | skipped | deferred
  clarify_items JSONB NOT NULL DEFAULT '[]',

  -- 暫存區項目（待確認）
  staging_items JSONB NOT NULL DEFAULT '[]',

  -- 已解決項目
  resolved_items JSONB NOT NULL DEFAULT '[]',

  -- 原始需求（用於後續 Discovery）
  original_requirements TEXT,

  -- 專案背景
  project_context TEXT,

  -- 規格產出路徑
  schema_sql_path TEXT,           -- spec/data/schema.sql
  entity_mapping_path TEXT,       -- spec/data/entity_to_table_mapping.yml
  features_dir TEXT,              -- spec/features/
  actions_yml_path TEXT,          -- spec/actions/actions.yml
  isa_config_path TEXT,           -- isa_codegen.yml

  -- 產出的規格內容 (JSONB)
  -- 直接存儲規格內容，便於前端顯示和後續處理
  schema_sql_content TEXT,
  entity_mapping_content TEXT,
  features_content JSONB DEFAULT '[]',  -- [{ name, content }]
  actions_yml_content TEXT,
  isa_config_content TEXT,

  -- 驗證結果
  validation_result JSONB,  -- { passed, errors[], warnings[] }

  -- 時間戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 為常用查詢創建索引
CREATE INDEX IF NOT EXISTS idx_bdd_sessions_project_id
  ON bdd_sessions(project_id);

CREATE INDEX IF NOT EXISTS idx_bdd_sessions_conversation_id
  ON bdd_sessions(conversation_id);

CREATE INDEX IF NOT EXISTS idx_bdd_sessions_task_id
  ON bdd_sessions(task_id);

CREATE INDEX IF NOT EXISTS idx_bdd_sessions_phase
  ON bdd_sessions(current_phase);

-- 創建 updated_at 自動更新觸發器
CREATE OR REPLACE FUNCTION update_bdd_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bdd_sessions_updated_at ON bdd_sessions;
CREATE TRIGGER trigger_bdd_sessions_updated_at
  BEFORE UPDATE ON bdd_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_bdd_sessions_updated_at();

-- 添加 RLS 策略
ALTER TABLE bdd_sessions ENABLE ROW LEVEL SECURITY;

-- 允許認證用戶訪問自己專案的 BDD Sessions
CREATE POLICY "Users can access own project bdd_sessions" ON bdd_sessions
  FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- 允許 service_role 完全訪問
CREATE POLICY "Service role has full access to bdd_sessions" ON bdd_sessions
  FOR ALL
  USING (auth.role() = 'service_role');

-- 驗證表創建成功
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'bdd_sessions'
ORDER BY ordinal_position;
