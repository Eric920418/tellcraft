-- Job Failures 持久化表
-- BullMQ 最終失敗（exhausted all retries）的 job 記錄

CREATE TABLE IF NOT EXISTS job_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT,
  job_name TEXT NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  error TEXT NOT NULL,
  job_data JSONB DEFAULT '{}',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_failures_created ON job_failures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_failures_conversation ON job_failures(conversation_id) WHERE conversation_id IS NOT NULL;
