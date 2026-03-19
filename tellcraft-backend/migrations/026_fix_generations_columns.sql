-- 026: 補齊 generations 表缺失欄位
-- snapshotCodeToGeneration 需要這些欄位但建表時未包含

ALTER TABLE generations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE generations ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS conversation_id UUID;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS change_summary TEXT;

-- version_number 索引（用於查詢最新版本）
CREATE INDEX IF NOT EXISTS idx_generations_version ON generations(project_id, version_number DESC);
