-- 007: BDD Session 變更歷史追蹤
-- 記錄每次 spec_change_confirm 執行的變更，供回滾使用

ALTER TABLE bdd_sessions ADD COLUMN IF NOT EXISTS change_history JSONB DEFAULT '[]';

COMMENT ON COLUMN bdd_sessions.change_history IS '變更歷史：[{id, timestamp, description, changeType, affectedLayers, previousSnapshot}]';
