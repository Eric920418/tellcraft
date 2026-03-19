-- 025: 新增 code_snapshot 欄位
-- 用於存儲每個版本/部署的完整代碼快照，支援舊版本代碼下載

ALTER TABLE generations ADD COLUMN IF NOT EXISTS code_snapshot JSONB;
COMMENT ON COLUMN generations.code_snapshot IS '代碼快照：[{filePath, content, skillSource, fileType}]';

ALTER TABLE deployments ADD COLUMN IF NOT EXISTS code_snapshot JSONB;
COMMENT ON COLUMN deployments.code_snapshot IS '部署時代碼快照：[{filePath, content, skillSource, fileType}]';
