-- 042: preview_deployments — Vercel preview iframe 替換 WebContainer 後的 deploy 記錄
--
-- 背景：替換 WebContainer in-browser preview → Vercel preview URL iframe。
-- 每個 conversation 在 phase 完成時 enqueue quickPreviewDeploy（lean 版 deploy，跳過 LLM fix）
-- → Vercel API target='preview' → 拿 immutable URL → 寫此表 → 前端 iframe src=URL。
--
-- 與既有 deployments 表分離：
--   - deployments：production 部署（promote 到 vercel_url alias，用於回滾）
--   - preview_deployments：每 phase 完成的 immutable preview URL，純展示用
--
-- code_hash dedup：同 conversation 連續 enqueue 同個 code → 短路回傳上次 URL（不發 Vercel call）
-- Trim trigger：每 conversation 保留最新 10 條，避免無限增長

CREATE TABLE IF NOT EXISTS preview_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  vercel_deployment_id text NOT NULL,
  url text NOT NULL,
  status text NOT NULL DEFAULT 'building' CHECK (status IN ('building', 'ready', 'failed')),
  code_hash text NOT NULL,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- 查詢：最近一次 preview / 按時序列出
CREATE INDEX IF NOT EXISTS idx_preview_deployments_conv_time
  ON preview_deployments(conversation_id, created_at DESC);

-- 查詢：code_hash dedup
CREATE INDEX IF NOT EXISTS idx_preview_deployments_conv_hash
  ON preview_deployments(conversation_id, code_hash);

-- Trim 觸發器：每 conversation 保留最新 10 條（避免無限增長）
CREATE OR REPLACE FUNCTION trim_preview_deployments() RETURNS trigger AS $$
BEGIN
  DELETE FROM preview_deployments
  WHERE conversation_id = NEW.conversation_id
    AND id NOT IN (
      SELECT id FROM preview_deployments
      WHERE conversation_id = NEW.conversation_id
      ORDER BY created_at DESC
      LIMIT 10
    );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trim_preview_deployments ON preview_deployments;
CREATE TRIGGER trg_trim_preview_deployments
  AFTER INSERT ON preview_deployments
  FOR EACH ROW EXECUTE FUNCTION trim_preview_deployments();
