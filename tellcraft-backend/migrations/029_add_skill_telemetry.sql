-- 029_add_skill_telemetry.sql
-- Skill Telemetry MVP — 從 Deployer sanitize / Quality Gate rule-based / Iteration refineCode
-- 這三個已經在「擦屁股」的修復點收集失敗訊號，供每週 markdown 報告人工回灌 prompt。
-- Fire-and-forget：任何寫入失敗都不得阻斷生成 pipeline。

CREATE TABLE IF NOT EXISTS skill_telemetry (
  id BIGSERIAL PRIMARY KEY,
  skill_name TEXT NOT NULL,           -- 'deployer' | 'quality_gate' | 'iteration' | 'uiux' | 'coder'
  event_type TEXT NOT NULL,           -- 'sanitize_fix' | 'qg_rule_fix' | 'qg_llm_fallback' | 'iteration'
  pattern_key TEXT NOT NULL,          -- 'motion-import' | 'use-client-missing' | 'scope:design' | ...
  severity TEXT,                      -- 'critical' | 'warning' | 'info' | NULL
  user_id UUID,
  conversation_id UUID,
  project_id UUID,
  payload JSONB,                      -- { file, rawLabel, feedback (前500字), previousPhase, ... }
  fix_rounds INT NOT NULL DEFAULT 1,  -- iteration repeatCount 或 LLM 修復輪數
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 週報主查詢：按 (skill, event, pattern) 聚合近 N 天
CREATE INDEX IF NOT EXISTS idx_skill_telemetry_week
  ON skill_telemetry (skill_name, event_type, pattern_key, created_at DESC);

-- 備查：時間範圍掃描
CREATE INDEX IF NOT EXISTS idx_skill_telemetry_created_at
  ON skill_telemetry (created_at DESC);
