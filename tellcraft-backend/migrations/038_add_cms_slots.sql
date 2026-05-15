-- 038: CMS Skeleton Slots — 客戶可調整的 skeleton 配置（logo / theme / canonical password 等）
-- 設計選擇：單個 JSONB 欄位，避免每 slot 一欄。manifest.json 演化不需要 migration。
-- NULL = 完全用 manifest default。寫入時只存「跟 default 不同的值」即可，但 API merge 邏輯不依賴此假設。
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cms_slots JSONB;
