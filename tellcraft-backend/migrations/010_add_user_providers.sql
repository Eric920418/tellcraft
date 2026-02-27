-- 010_add_user_providers.sql
-- 帳號綁定系統：支援同一用戶綁定多個 OAuth Provider（Google + LINE）

CREATE TABLE IF NOT EXISTS user_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,       -- 'google' | 'line'
    provider_id VARCHAR(255) NOT NULL,   -- OAuth provider 的用戶 ID
    email VARCHAR(255),
    name VARCHAR(100),
    avatar_url TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider, provider_id),       -- 同一 OAuth 帳號只能屬於一個用戶
    UNIQUE(user_id, provider)            -- 同一用戶同一 provider 只能綁一次
);

CREATE INDEX IF NOT EXISTS idx_user_providers_user_id ON user_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_providers_provider ON user_providers(provider, provider_id);

-- 遷移現有資料（不刪除舊欄位，向後相容）
INSERT INTO user_providers (user_id, provider, provider_id, email, name, avatar_url, is_primary)
SELECT id, provider, provider_id, email, name, avatar_url, TRUE
FROM users WHERE provider IS NOT NULL AND provider_id IS NOT NULL
ON CONFLICT (provider, provider_id) DO NOTHING;
