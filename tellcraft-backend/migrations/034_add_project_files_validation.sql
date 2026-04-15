-- 034: project_files 加入 validation_status + LKG (Last Known Good)
--
-- 預覽零錯誤架構的資料層：
-- - validation_status：當前版本的驗證狀態（'passed' / 'failed' / 'unknown'）
-- - last_validated_at：最後通過 preview-gate 的時間戳
-- - last_validated_content：最後可用版本快照（LKG），新代碼 fail 時永不被覆蓋
--
-- 查詢策略：前端首次載入 / F5 / 切 conversation 時優先讀 last_validated_content，
-- 保證客戶永遠不會重新載入到壞代碼。

ALTER TABLE project_files
  ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20) NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_validated_content TEXT;

CREATE INDEX IF NOT EXISTS idx_project_files_validated
  ON project_files(project_id, validation_status)
  WHERE validation_status = 'passed';

COMMENT ON COLUMN project_files.validation_status IS
  'preview-gate 驗證狀態：passed=已通過 esbuild syntax 驗證；failed=當前 content 驗證失敗但 last_validated_content 仍保留；unknown=尚未驗證（legacy）';

COMMENT ON COLUMN project_files.last_validated_content IS
  'Last Known Good 快照：僅在 validation_status=passed 時同步更新。failed 時保留舊值，作為前端 fallback。';
