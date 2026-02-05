-- Migration: Add version management fields to generations table
-- Date: 2026-02-05
-- Description: 支援專案版本管理功能

-- Step 1: 新增欄位
ALTER TABLE generations ADD COLUMN IF NOT EXISTS version_number INT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS version_label VARCHAR(100);
ALTER TABLE generations ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id);
ALTER TABLE generations ADD COLUMN IF NOT EXISTS change_summary TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS schema_snapshot TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS features_snapshot JSONB;

-- Step 2: 為現有記錄填充版本號
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at) as rn
  FROM generations
  WHERE version_number IS NULL
)
UPDATE generations g SET version_number = n.rn
FROM numbered n WHERE g.id = n.id;

-- Step 3: 設置默認值（新記錄自動填充）
ALTER TABLE generations ALTER COLUMN version_number SET DEFAULT 1;

-- Step 4: 確保非 NULL（填充後）
UPDATE generations SET version_number = 1 WHERE version_number IS NULL;
ALTER TABLE generations ALTER COLUMN version_number SET NOT NULL;

-- Step 5: 創建索引
CREATE INDEX IF NOT EXISTS idx_generations_project_version ON generations(project_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_generations_conversation_id ON generations(conversation_id);

-- Done!
