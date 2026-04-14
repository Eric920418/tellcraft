-- 033: Email 設定欄位
-- 為 Coder Skill 生成的客戶 app 提供 Resend 發信能力
-- 策略：客戶自備 API key（不代管），Deployer 注入 Vercel env

ALTER TABLE projects ADD COLUMN IF NOT EXISTS resend_api_key TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS email_from TEXT;
