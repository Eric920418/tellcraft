-- UIUX 生成邏輯重構 - 資料庫遷移
-- 在 bdd_sessions 表添加 UIUX 相關欄位

-- 1. 添加模板選擇欄位
ALTER TABLE bdd_sessions ADD COLUMN IF NOT EXISTS uiux_template_id UUID REFERENCES templates(id);

-- 2. 添加設計變體欄位（存儲 5 個設計變體）
ALTER TABLE bdd_sessions ADD COLUMN IF NOT EXISTS design_variants JSONB DEFAULT '[]';

-- 3. 添加用戶選擇的變體 ID
ALTER TABLE bdd_sessions ADD COLUMN IF NOT EXISTS selected_variant_ids TEXT[] DEFAULT '{}';

-- 4. 添加最終合併的 Design System
ALTER TABLE bdd_sessions ADD COLUMN IF NOT EXISTS final_design_system JSONB;

-- 5. 添加生成的頁面代碼
ALTER TABLE bdd_sessions ADD COLUMN IF NOT EXISTS generated_pages JSONB DEFAULT '[]';

-- 6. 添加生成的組件代碼
ALTER TABLE bdd_sessions ADD COLUMN IF NOT EXISTS generated_components JSONB DEFAULT '[]';

-- 7. 添加全域 CSS
ALTER TABLE bdd_sessions ADD COLUMN IF NOT EXISTS generated_styles TEXT;

-- 8. 添加索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_bdd_sessions_uiux_template ON bdd_sessions(uiux_template_id);

-- 欄位說明：
-- uiux_template_id: 用戶選擇的模板 UUID
-- design_variants: 5 個設計變體的 JSONB 數組
-- selected_variant_ids: 用戶選擇的變體 ID（如 ['A', 'C']）
-- final_design_system: 最終合併的 Design System（包含 CSS variables、tailwind extend 等）
-- generated_pages: 生成的頁面代碼 JSONB 數組
-- generated_components: 生成的組件代碼 JSONB 數組
-- generated_styles: 全域 CSS 字串
