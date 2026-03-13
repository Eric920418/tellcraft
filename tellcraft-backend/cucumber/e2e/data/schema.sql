-- SpecFormula E2E 驗證用測試 Schema
-- 完全獨立，不依賴 Supabase auth 或任何外部表

CREATE TABLE IF NOT EXISTS test_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    author VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
