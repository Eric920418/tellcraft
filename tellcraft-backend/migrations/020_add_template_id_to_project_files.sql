-- Migration 020: Add template_id to project_files
-- 讓 seed 模板的 React 代碼可以存在 project_files，無需對應 project 記錄

-- 1. 讓 project_id 允許 NULL（seed 模板的 files 無對應 project）
ALTER TABLE project_files ALTER COLUMN project_id DROP NOT NULL;

-- 2. 加 template_id 欄位（references templates，cascade delete）
ALTER TABLE project_files
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES templates(id) ON DELETE CASCADE;

-- 3. seed 模板的 unique index（template_id + skill_source + file_path）
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_files_template_upsert
  ON project_files(template_id, skill_source, file_path)
  WHERE template_id IS NOT NULL;

-- 4. 確保至少有一個 owner（project 或 template，不能同時為 NULL）
ALTER TABLE project_files
  ADD CONSTRAINT chk_project_files_owner
  CHECK (project_id IS NOT NULL OR template_id IS NOT NULL);

-- 5. template_id 查詢索引
CREATE INDEX IF NOT EXISTS idx_project_files_template_id
  ON project_files(template_id)
  WHERE template_id IS NOT NULL;
