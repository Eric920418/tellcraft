-- Phase E: 版本回滾整合 DesignSystem snapshot
-- 用戶回滾代碼時，DesignSystem 也要跟著回 — 否則拿到「舊代碼 + 新 DS」混搭
--
-- 設計選擇：欄位加在 generations 表（與既有 code_snapshot 平行），
-- 而非 project_files 表。原因：
--   1. snapshot 與 generation 版本是 1:1，不需要 per-file 粒度
--   2. project_files 已有 last_validated_content（migration 034），加更多欄位會讓 row 過大
--   3. 序列化時剝除 rawMarkdown（22KB → 1.5KB），JSONB 壓縮後更小

ALTER TABLE generations
  ADD COLUMN IF NOT EXISTS design_system_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS design_system_hash VARCHAR(16);

COMMENT ON COLUMN generations.design_system_snapshot IS
  'Phase E: 凍結的 DesignSystem 物件（uiux-generation DesignSystem 型別），rollback 時還原。
   序列化時剝除 rawMarkdown 省空間。';

COMMENT ON COLUMN generations.design_system_hash IS
  'Phase E: freezeDesignSystem 計算的 16 字元 hash，回滾後 audit 對得上即驗證 OK。';
