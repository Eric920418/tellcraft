-- 045: Content Model Manifest — generate-time 從 schema 確定性衍生的「內容型別清單」
-- 設計選擇：單個 JSONB 欄位（仿 038 cms_slots）。manifest 結構演化不需要 migration。
-- NULL = 尚未衍生（ENABLE_CONTENT_MODEL flag 關閉，或舊專案）。
-- operation 平面（站長自助營運 UI）消費此欄位，與 structure 平面（BDD→schema→Coder）的橋樑。
ALTER TABLE projects ADD COLUMN IF NOT EXISTS content_model JSONB;
