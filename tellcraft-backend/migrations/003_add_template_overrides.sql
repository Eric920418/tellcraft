-- Migration: Add template_overrides column to projects
-- 專案級模板客製化：存儲用戶對模板元素的編輯

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS template_overrides JSONB DEFAULT '{}';

-- 添加索引以便查詢
CREATE INDEX IF NOT EXISTS idx_projects_template_overrides ON projects USING gin(template_overrides);

-- 注釋
COMMENT ON COLUMN projects.template_overrides IS '模板元素的客製化覆蓋，格式: {"element-id": {"text": "...", "color": "#..."}}';
