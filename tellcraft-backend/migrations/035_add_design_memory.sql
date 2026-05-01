-- 035: design_memory — 跨 session 持久化使用者設計偏好
--
-- 動機：每個專案從零開始重做 Discovery 問答，老用戶第二次來還要重填一次。
-- 此表記錄用戶歷史挑選的色板/mood/字體/拒絕的 pattern，用於：
--   - generateDesignBrief 的 AI 顧問建議參考
--   - generateDesignVariants 至少 1 個變體繼承用戶常用色
--   - Discovery Path A 的 inferDesignDefaultsFromIdeas 預設值
--
-- 寫入永遠 fire-and-forget，讀取失敗 fail-open（無記憶等於新用戶）。

CREATE TABLE design_memory (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    brand_tone JSONB,                        -- {keywords: string[], avoid: string[]}
    preferred_palettes JSONB,                -- ColorPalette[]（最多 5 筆，新到舊）
    preferred_moods TEXT[] DEFAULT '{}',     -- moodId 累積
    preferred_tiers TEXT[] DEFAULT '{}',     -- 'functional' / 'creative' 出現紀錄
    rejected_patterns TEXT[] DEFAULT '{}',   -- iteration 明確拒絕的 pattern id
    signature_keywords TEXT[] DEFAULT '{}',  -- domainKeywords 累積（去重）
    fonts_used TEXT[] DEFAULT '{}',          -- 過往字體選擇
    sample_count INT NOT NULL DEFAULT 0,     -- 累積過幾次完成的 brief
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE design_memory IS
    '使用者層級的設計偏好記憶。寫入 fire-and-forget，讀取失敗 fail-open。';

COMMENT ON COLUMN design_memory.preferred_palettes IS
    'JSONB 陣列，每筆是完整 ColorPalette（primary/secondary/accent/...）。最新的 5 筆。';

COMMENT ON COLUMN design_memory.rejected_patterns IS
    '使用者在 iteration 中明確拒絕的 pattern id（如 fullbleed-hero）。生成時應降權。';
