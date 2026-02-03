-- Tellcraft VPS Schema
-- 簡化版本，移除 Supabase 專用功能（RLS、auth.users 等）
-- 認證由 API 層處理

-- ============================================================
-- ENUM 類型定義
-- ============================================================

CREATE TYPE project_status AS ENUM (
    'draft',
    'generating',
    'testing',
    'deployed',
    'failed'
);

CREATE TYPE user_plan AS ENUM (
    'free',
    'creator',
    'pro',
    'business'
);

CREATE TYPE generation_status AS ENUM (
    'pending',
    'running',
    'success',
    'failed'
);

CREATE TYPE deployment_status AS ENUM (
    'pending',
    'deploying',
    'success',
    'failed'
);

CREATE TYPE subscription_status AS ENUM (
    'active',
    'suspended',
    'cancelled'
);

CREATE TYPE task_status AS ENUM (
    'planning',
    'pending_approval',
    'executing',
    'waiting_approval',
    'completed',
    'failed',
    'cancelled'
);

CREATE TYPE task_step_status AS ENUM (
    'pending',
    'running',
    'success',
    'failed',
    'skipped',
    'waiting_approval'
);

CREATE TYPE template_category AS ENUM (
    'saas',
    'landing',
    'ecommerce',
    'content'
);

-- ============================================================
-- 核心資料表
-- ============================================================

-- 用戶（Supabase Auth ID 作為主鍵）
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100),
    plan user_plan NOT NULL DEFAULT 'free',
    subscription_status subscription_status NOT NULL DEFAULT 'active',
    cancelled_at TIMESTAMPTZ,
    message_count_this_period INT NOT NULL DEFAULT 0,
    subscription_period_start DATE NOT NULL DEFAULT CURRENT_DATE,
    anonymous_user_id UUID,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 專案
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status project_status NOT NULL DEFAULT 'draft',

    supabase_org_id VARCHAR(100),
    supabase_project_id VARCHAR(100),
    supabase_url TEXT,
    supabase_anon_key TEXT,

    vercel_project_id VARCHAR(100),
    vercel_url TEXT,

    custom_domain VARCHAR(255),
    domain_status VARCHAR(20),

    is_transferred BOOLEAN NOT NULL DEFAULT FALSE,
    transferred_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, name)
);

-- 對話記錄
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    messages JSONB NOT NULL DEFAULT '[]',
    spec_complete BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 任務
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    goal TEXT NOT NULL,
    plan JSONB,

    status task_status NOT NULL DEFAULT 'planning',
    current_step INT,
    failed_step INT,

    calculated_priority INT NOT NULL DEFAULT 0,

    approval_requested_at TIMESTAMPTZ,
    approval_reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,

    total_tokens_used INT NOT NULL DEFAULT 0,
    estimated_cost_usd DECIMAL(10, 4) NOT NULL DEFAULT 0,

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 生成記錄
CREATE TABLE generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    skill_execution_id UUID,

    requirement_spec JSONB,
    technical_design JSONB,

    generated_code_url TEXT,
    test_results JSONB,

    status generation_status NOT NULL DEFAULT 'pending',
    attempt_count INT NOT NULL DEFAULT 0,
    error_message TEXT,

    backup_sql_url TEXT,
    backup_created_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 部署記錄
CREATE TABLE deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    generation_id UUID REFERENCES generations(id),
    skill_execution_id UUID,

    vercel_deployment_id VARCHAR(100),
    url TEXT,
    status deployment_status NOT NULL DEFAULT 'pending',
    waiting_for_capacity BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BDD Sessions（多輪對話狀態）
CREATE TABLE bdd_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    current_phase VARCHAR(50) NOT NULL DEFAULT 'discovery',
    clarify_items JSONB NOT NULL DEFAULT '[]',
    confirmed_batches JSONB NOT NULL DEFAULT '[]',
    generated_spec JSONB,

    discovery_complete BOOLEAN NOT NULL DEFAULT FALSE,
    formulation_complete BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LLM 用量追蹤
CREATE TABLE llm_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    model VARCHAR(50) NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    cost_usd DECIMAL(10, 6),
    purpose VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 審計日誌
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- UIUX 模板
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    category template_category NOT NULL,
    description TEXT NOT NULL,

    thumbnail_url TEXT,
    preview_image_url TEXT,

    tags TEXT[] NOT NULL DEFAULT '{}',
    design_defaults JSONB NOT NULL DEFAULT '{}',
    page_structure JSONB NOT NULL DEFAULT '{"pages": [], "components": []}',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 索引
-- ============================================================

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_conversations_project_id ON conversations(project_id);
CREATE INDEX idx_generations_project_id ON generations(project_id);
CREATE INDEX idx_deployments_project_id ON deployments(project_id);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_anonymous_user_id ON users(anonymous_user_id);
CREATE INDEX idx_users_is_admin ON users(is_admin);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);

CREATE INDEX idx_bdd_sessions_conversation_id ON bdd_sessions(conversation_id);
CREATE INDEX idx_bdd_sessions_project_id ON bdd_sessions(project_id);

CREATE INDEX idx_llm_usage_user_id ON llm_usage(user_id);
CREATE INDEX idx_llm_usage_conversation_id ON llm_usage(conversation_id);
CREATE INDEX idx_llm_usage_created_at ON llm_usage(created_at DESC);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_is_active ON templates(is_active);
CREATE INDEX idx_templates_is_featured ON templates(is_featured);
