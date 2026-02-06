-- Migration: Add project_files table
-- 獨立存儲各 Skill 生成的代碼檔案，支援多 Skill 來源（uiux/code/merge）

CREATE TABLE IF NOT EXISTS project_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    skill_source VARCHAR(20) NOT NULL DEFAULT 'uiux',
    file_path VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    file_type VARCHAR(20) NOT NULL DEFAULT 'component',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- UPSERT key：同一專案同一 Skill 同一路徑只保留一份
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_files_upsert
    ON project_files(project_id, skill_source, file_path);

-- 按專案查詢
CREATE INDEX IF NOT EXISTS idx_project_files_project_id
    ON project_files(project_id);

COMMENT ON TABLE project_files IS '各 Skill 生成的代碼檔案。skill_source: uiux/code/merge，file_type: page/component/style/config';
