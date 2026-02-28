-- 012: Add language preference to users table
-- NULL = 未手動設定（用 cookie/Accept-Language），'zh'/'en' = 明確偏好
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT NULL;
