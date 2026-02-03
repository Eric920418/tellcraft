-- 添加 OAuth provider 欄位到 users 表
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
