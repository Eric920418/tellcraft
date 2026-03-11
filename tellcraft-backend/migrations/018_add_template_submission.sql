-- 018: 模板提交功能 - 新增用戶提交和審核相關欄位
-- 用戶可以將已完成的專案上傳為模板，管理員審核後公開

ALTER TABLE templates ADD COLUMN IF NOT EXISTS source_project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) NOT NULL DEFAULT 'approved';
-- review_status: pending | approved | rejected
-- 現有模板預設 approved，用戶提交的設為 pending

ALTER TABLE templates ADD COLUMN IF NOT EXISTS review_reason TEXT;
-- 管理員審核拒絕時的原因

CREATE INDEX IF NOT EXISTS idx_templates_submitted_by ON templates(submitted_by);
CREATE INDEX IF NOT EXISTS idx_templates_source_project ON templates(source_project_id);
CREATE INDEX IF NOT EXISTS idx_templates_review_status ON templates(review_status);
