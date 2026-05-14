-- 037: 修補 schema drift — projects.resend_api_key/email_from/custom_domain 缺失
--
-- 事件：2026-05-14 bb0d1081 部署失敗：column "resend_api_key" does not exist
--      033_add_email_config.sql 在 _migrations 表標記已執行，但 prod projects table
--      實際沒這幾個 column（DB 被 restore / 手動操作後 column 沒回來但 _migrations
--      還保留執行紀錄 → idempotent 033 不會重跑）
--
-- 修補：用全新 migration 號 (037) 補加 column，IF NOT EXISTS 安全冪等
--      不動 _migrations 既有紀錄，這條 migration 會被 migrate.sh 視為新項自動跑
ALTER TABLE projects ADD COLUMN IF NOT EXISTS resend_api_key TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS email_from TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS custom_domain TEXT;
