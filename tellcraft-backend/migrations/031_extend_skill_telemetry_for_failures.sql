-- 031_extend_skill_telemetry_for_failures.sql
-- Failure Telemetry Expansion — 從 success-only 升級為 success+failure 雙軌追蹤
-- 向後相容：既有 row 自動 outcome='success'，所有新欄位 NULL-able 或有 default
-- 搭配 skill-telemetry.ts v2 閉環（prompt_changes + WoW delta + 汰換），不破壞既有週報

ALTER TABLE skill_telemetry
  ADD COLUMN IF NOT EXISTS outcome TEXT NOT NULL DEFAULT 'success',
  ADD COLUMN IF NOT EXISTS root_cause_category TEXT,
  ADD COLUMN IF NOT EXISTS phase TEXT,
  ADD COLUMN IF NOT EXISTS error_type TEXT,
  ADD COLUMN IF NOT EXISTS recovered BOOLEAN;

-- CHECK 約束限制 outcome 合法值（既有 row 全為 'success'，不會違反）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'skill_telemetry_outcome_check'
  ) THEN
    ALTER TABLE skill_telemetry
      ADD CONSTRAINT skill_telemetry_outcome_check
      CHECK (outcome IN ('success', 'failed', 'repaired', 'timeout', 'blocked'));
  END IF;
END
$$;

-- 查失敗率用的 partial index（只含非 success row，寫入不影響效能）
CREATE INDEX IF NOT EXISTS idx_skill_telemetry_outcome
  ON skill_telemetry (outcome, skill_name, created_at DESC)
  WHERE outcome != 'success';

-- 查 phase 分佈用的 partial index
CREATE INDEX IF NOT EXISTS idx_skill_telemetry_phase
  ON skill_telemetry (phase, created_at DESC)
  WHERE phase IS NOT NULL;

-- 查 root cause 分佈用的 partial index
CREATE INDEX IF NOT EXISTS idx_skill_telemetry_root_cause
  ON skill_telemetry (root_cause_category, created_at DESC)
  WHERE root_cause_category IS NOT NULL;
