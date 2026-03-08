-- Orchestrator Stage 4 資料表
-- 基於 spec/data/schema.sql

-- ============================================================
-- ENUM 類型定義
-- ============================================================

DO $$ BEGIN
    CREATE TYPE skill_status AS ENUM ('enabled', 'disabled', 'deprecated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE cost_level AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('task_completed', 'task_failed', 'task_cancelled', 'approval_needed', 'approval_timeout');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 技能登錄（Skill Registry）
-- ============================================================

CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    
    -- NOTE: pgvector 尚未安裝，暫時不加 description_embedding
    -- description_embedding VECTOR(1536),

    input_schema JSONB NOT NULL DEFAULT '{}',
    output_schema JSONB NOT NULL DEFAULT '{}',

    auth_scope VARCHAR(50)[] DEFAULT '{}',
    min_plan user_plan NOT NULL DEFAULT 'free',
    cost_level cost_level NOT NULL DEFAULT 'medium',
    priority INT NOT NULL DEFAULT 0,
    timeout_ms INT NOT NULL DEFAULT 300000,

    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    status skill_status NOT NULL DEFAULT 'enabled',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 任務步驟（task_steps）
-- ============================================================

CREATE TABLE IF NOT EXISTS task_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

    step_number INT NOT NULL,
    skill_id UUID NOT NULL REFERENCES skills(id),

    input JSONB NOT NULL DEFAULT '{}',
    output JSONB,

    status task_step_status NOT NULL DEFAULT 'pending',
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,

    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT,

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 技能執行記錄（skill_executions）
-- ============================================================

CREATE TABLE IF NOT EXISTS skill_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_step_id UUID REFERENCES task_steps(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id),
    user_id UUID NOT NULL REFERENCES users(id),

    input JSONB NOT NULL DEFAULT '{}',
    output JSONB,

    status task_step_status NOT NULL DEFAULT 'pending',
    error_message TEXT,

    latency_ms INT,
    tokens_used INT,
    cost_usd DECIMAL(10, 4),

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LLM 呼叫記錄（llm_calls）
-- ============================================================

CREATE TABLE IF NOT EXISTS llm_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_execution_id UUID REFERENCES skill_executions(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),

    model VARCHAR(50) NOT NULL,
    purpose VARCHAR(100),

    input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,

    latency_ms INT NOT NULL DEFAULT 0,
    input_hash VARCHAR(64),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 通知（notifications）
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,

    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 索引
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_task_steps_task_id ON task_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_skill_executions_task_step_id ON skill_executions(task_step_id);
CREATE INDEX IF NOT EXISTS idx_llm_calls_task_id ON llm_calls(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
