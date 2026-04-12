-- 030_add_prompt_changes.sql
-- Prompt Change 註冊表 — 追蹤每次「人工回灌 prompt」或「轉為 sanitize/QG 規則」的動作
-- 搭配 skill_telemetry 形成閉環：注入前基線 → 注入後效應 → 汰換決策
-- 設計意圖：
--   action_type 區分三條修復路徑（prompt_fewshot / sanitize_rule / qg_rule）
--   retired_at IS NULL = 活躍，非 NULL = 已汰換
--   baseline_count = 注入時該 pattern 的近 7 天觸發數，用來算 reduction %

CREATE TABLE IF NOT EXISTS prompt_changes (
  id SERIAL PRIMARY KEY,
  pattern_key TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_file TEXT NOT NULL,
  description TEXT,
  commit_hash TEXT,
  baseline_count INT NOT NULL DEFAULT 0,
  injected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 查詢某 pattern 的所有變更歷史
CREATE INDEX IF NOT EXISTS idx_prompt_changes_pattern
  ON prompt_changes (pattern_key, skill_name);

-- 快速列出活躍的變更（partial index）
CREATE INDEX IF NOT EXISTS idx_prompt_changes_active
  ON prompt_changes (retired_at) WHERE retired_at IS NULL;
