-- 009: 移除未使用的 audit_logs 表
-- 該表從未有任何寫入，前端頁面和 API 已一併刪除

DROP TABLE IF EXISTS audit_logs;
