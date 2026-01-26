-- AI-Genesis Platform Schema
-- 基於 PRD v24.1 + 28 項釐清決議（14 PRD + 7 Spec + 7 Orchestrator）
-- 生成日期：2026-01-23

-- ============================================================
-- ENUM 類型定義
-- ============================================================

-- 專案狀態（決議 #1：線性 + 回退 + 重試）
-- 合法轉換：draft→generating→testing→deployed, deployed→generating, failed→generating, 任何→failed
CREATE TYPE project_status AS ENUM (
    'draft',        -- 草稿，尚未開始生成
    'generating',   -- 正在生成程式碼
    'testing',      -- 測試中
    'deployed',     -- 已部署上線
    'failed'        -- 失敗
);

-- 用戶方案
CREATE TYPE user_plan AS ENUM (
    'free',         -- 免費試用：14天、1站點、50次對話/月
    'creator',      -- 創作者：NT$500/月、1站點、200次對話/月
    'pro',          -- 專業：NT$1500/月、3站點、1000次對話/月
    'business'      -- 商務：NT$4500/月、10站點、無限對話
);

-- 生成狀態
CREATE TYPE generation_status AS ENUM (
    'pending',      -- 等待中
    'running',      -- 執行中
    'success',      -- 成功
    'failed'        -- 失敗
);

-- 部署狀態
CREATE TYPE deployment_status AS ENUM (
    'pending',      -- 等待中
    'deploying',    -- 部署中
    'success',      -- 成功
    'failed'        -- 失敗
);

-- 訂閱狀態（決議 #8：取消後 30 天暫停期）
CREATE TYPE subscription_status AS ENUM (
    'active',       -- 正常使用中
    'suspended',    -- 暫停（取消後 30 天內）
    'cancelled'     -- 已取消（超過 30 天）
);

-- ============================================================
-- Orchestrator ENUM 類型（決議 #22-28）
-- ============================================================

-- 任務狀態
CREATE TYPE task_status AS ENUM (
    'planning',         -- 規劃中（LLM 生成計劃）
    'pending_approval', -- 等待用戶確認計劃
    'executing',        -- 執行中
    'waiting_approval', -- 等待人工審核（某步驟需確認）
    'completed',        -- 完成
    'failed',           -- 失敗
    'cancelled'         -- 取消（用戶取消或超時）
);

-- 任務步驟狀態
CREATE TYPE task_step_status AS ENUM (
    'pending',          -- 等待執行
    'running',          -- 執行中
    'success',          -- 成功
    'failed',           -- 失敗
    'skipped',          -- 跳過
    'waiting_approval'  -- 等待人工審核
);

-- 技能狀態
CREATE TYPE skill_status AS ENUM (
    'enabled',          -- 啟用
    'disabled',         -- 停用
    'deprecated'        -- 棄用
);

-- 成本等級
CREATE TYPE cost_level AS ENUM (
    'low',              -- 低成本
    'medium',           -- 中等成本
    'high'              -- 高成本
);

-- 通知類型
CREATE TYPE notification_type AS ENUM (
    'task_completed',       -- 任務完成
    'task_failed',          -- 任務失敗
    'task_needs_approval',  -- 需要審核
    'task_timeout_warning', -- 超時警告
    'task_cancelled'        -- 任務取消
);

-- ============================================================
-- 資料表定義
-- ============================================================

-- 用戶（平台用戶，非其客戶）
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email VARCHAR(255) NOT NULL UNIQUE COMMENT '用戶 Email',
    name VARCHAR(100) COMMENT '用戶名稱',
    plan user_plan NOT NULL DEFAULT 'free' COMMENT '訂閱方案',
    subscription_status subscription_status NOT NULL DEFAULT 'active' COMMENT '訂閱狀態',
    cancelled_at TIMESTAMPTZ COMMENT '取消訂閱時間（用於計算 30 天暫停期）',
    message_count_this_period INT NOT NULL DEFAULT 0 COMMENT '本週期對話次數（決議 #7：每則用戶訊息 = 1 次）',
    subscription_period_start DATE NOT NULL DEFAULT CURRENT_DATE COMMENT '訂閱週期起始日（決議：對話次數按週期重置，Free 用戶以註冊日期為準）',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) COMMENT '平台用戶';

-- 專案（用戶建立的網站專案）
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL COMMENT '專案名稱',
    description TEXT COMMENT '專案描述',
    status project_status NOT NULL DEFAULT 'draft' COMMENT '專案狀態（決議 #1）',

    -- Supabase 資訊（決議 #2：建在平台帳號下）
    supabase_org_id VARCHAR(100) COMMENT '所屬 Supabase Organization（決議 #5：支援備用 Org）',
    supabase_project_id VARCHAR(100) COMMENT 'Supabase Project ID',
    supabase_url TEXT COMMENT 'Supabase URL',
    supabase_anon_key TEXT COMMENT 'Supabase Anon Key',

    -- Vercel 資訊
    vercel_project_id VARCHAR(100) COMMENT 'Vercel Project ID',
    vercel_url TEXT COMMENT 'Vercel URL',

    -- 網域
    custom_domain VARCHAR(255) COMMENT '自訂網域',
    domain_status VARCHAR(20) COMMENT '網域狀態',

    -- 資源移轉（決議 #12：自助移轉）
    is_transferred BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已移轉到用戶自有帳號',
    transferred_at TIMESTAMPTZ COMMENT '移轉時間',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, name)
) COMMENT '網站專案';

-- 對話記錄
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    messages JSONB NOT NULL DEFAULT '[]' COMMENT '對話訊息陣列',
    spec_complete BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'BDD Spec 是否已完成（決議：連續 2 輪無新問題）',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) COMMENT '對話記錄';

-- 生成記錄（決議 #9：永久保留所有版本，決議 #26：關聯 skill_execution）
CREATE TABLE generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    skill_execution_id UUID COMMENT '關聯的技能執行記錄（決議 #26）',

    -- 輸入
    requirement_spec JSONB COMMENT '需求規格（sdd.os BDD Spec Skill 輸出）',
    technical_design JSONB COMMENT '技術設計',

    -- 輸出（決議 #9：永久保留）
    generated_code_url TEXT COMMENT '生成程式碼 URL（R2/Storage）',
    test_results JSONB COMMENT '測試結果',

    -- 狀態（決議 #4：最多 3 次自癒，失敗後人工介入）
    status generation_status NOT NULL DEFAULT 'pending' COMMENT '生成狀態',
    attempt_count INT NOT NULL DEFAULT 0 COMMENT '嘗試次數（最多 3 次）',
    error_message TEXT COMMENT '錯誤訊息',

    -- 備份（決議 #6：破壞性變更前自動備份）
    backup_sql_url TEXT COMMENT '資料備份 URL（破壞性變更前）',
    backup_created_at TIMESTAMPTZ COMMENT '備份時間',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) COMMENT '生成記錄';

-- 部署記錄（決議 #26：關聯 skill_execution）
CREATE TABLE deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    generation_id UUID REFERENCES generations(id),
    skill_execution_id UUID COMMENT '關聯的技能執行記錄（決議 #26）',

    vercel_deployment_id VARCHAR(100) COMMENT 'Vercel Deployment ID',
    url TEXT COMMENT '部署 URL',
    status deployment_status NOT NULL DEFAULT 'pending' COMMENT '部署狀態',
    waiting_for_capacity BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否等待 Org 配額（決議：通知營運團隊手動處理）',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) COMMENT '部署記錄';

-- Supabase Organization 配額追蹤（決議 #5：備用 Org 切換）
CREATE TABLE supabase_organizations (
    id VARCHAR(100) PRIMARY KEY COMMENT 'Supabase Organization ID',
    name VARCHAR(100) NOT NULL COMMENT 'Organization 名稱',
    project_count INT NOT NULL DEFAULT 0 COMMENT '目前 Project 數量',
    max_projects INT NOT NULL DEFAULT 100 COMMENT '最大 Project 數量',
    is_primary BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否為主要 Org',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) COMMENT 'Supabase Organization 配額追蹤（決議 #5）';

-- ============================================================
-- Orchestrator 資料表（決議 #22-28）
-- ============================================================

-- 技能登錄（Skill Registry）
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE COMMENT '技能名稱（如 bdd-spec, code-generation）',
    display_name VARCHAR(100) NOT NULL COMMENT '顯示名稱（如 需求釐清）',
    description TEXT NOT NULL COMMENT '技能描述（用於 embedding 檢索）',
    description_embedding VECTOR(1536) COMMENT '描述的 embedding 向量（pgvector）',

    input_schema JSONB NOT NULL COMMENT '輸入參數 JSON Schema',
    output_schema JSONB NOT NULL COMMENT '輸出格式 JSON Schema',

    auth_scope VARCHAR(50)[] COMMENT '需要的權限範圍',
    min_plan user_plan NOT NULL DEFAULT 'free' COMMENT '最低需要的方案',
    cost_level cost_level NOT NULL DEFAULT 'medium' COMMENT '預估成本等級',
    priority INT NOT NULL DEFAULT 0 COMMENT '任務類型優先級（決議 #27）',
    timeout_ms INT NOT NULL DEFAULT 300000 COMMENT '超時時間（毫秒）',

    version VARCHAR(20) NOT NULL DEFAULT '1.0.0' COMMENT '版本號',
    status skill_status NOT NULL DEFAULT 'enabled' COMMENT '技能狀態',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) COMMENT '技能登錄中心';

-- 任務（決議 #22：Task 屬於 Project）
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE COMMENT '所屬專案（決議 #22）',
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    goal TEXT NOT NULL COMMENT '用戶原始目標描述',
    plan JSONB COMMENT '執行計劃（步驟列表）',

    status task_status NOT NULL DEFAULT 'planning' COMMENT '任務狀態',
    current_step INT COMMENT '當前執行步驟',
    failed_step INT COMMENT '失敗的步驟（決議 #23：可從失敗點重試）',

    -- 優先級（決議 #27：plan + task_type 混合）
    calculated_priority INT NOT NULL DEFAULT 0 COMMENT '計算後的優先級',

    -- 超時處理（決議 #24）
    approval_requested_at TIMESTAMPTZ COMMENT '請求審核的時間',
    approval_reminder_sent BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已發送提醒',

    -- 成本追蹤
    total_tokens_used INT NOT NULL DEFAULT 0 COMMENT '總 token 使用量',
    estimated_cost_usd DECIMAL(10, 4) NOT NULL DEFAULT 0 COMMENT '預估成本（美元）',

    started_at TIMESTAMPTZ COMMENT '開始執行時間',
    completed_at TIMESTAMPTZ COMMENT '完成時間',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) COMMENT '任務（決議 #22：屬於 Project）';

-- 任務步驟
CREATE TABLE task_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

    step_number INT NOT NULL COMMENT '步驟編號',
    skill_id UUID NOT NULL REFERENCES skills(id),

    input JSONB NOT NULL COMMENT '步驟輸入參數',
    output JSONB COMMENT '步驟輸出結果',

    status task_step_status NOT NULL DEFAULT 'pending' COMMENT '步驟狀態',
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否需要人工審核',

    retry_count INT NOT NULL DEFAULT 0 COMMENT '重試次數',
    error_message TEXT COMMENT '錯誤訊息',

    started_at TIMESTAMPTZ COMMENT '開始時間',
    completed_at TIMESTAMPTZ COMMENT '完成時間',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) COMMENT '任務步驟';

-- 技能執行記錄（決議 #26：總表，與 generations/deployments 1:1 關聯）
CREATE TABLE skill_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_step_id UUID REFERENCES task_steps(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id),
    user_id UUID NOT NULL REFERENCES users(id),

    input JSONB NOT NULL COMMENT '執行輸入',
    output JSONB COMMENT '執行輸出',

    status task_step_status NOT NULL DEFAULT 'pending' COMMENT '執行狀態',
    error_message TEXT COMMENT '錯誤訊息',

    -- 效能追蹤
    latency_ms INT COMMENT '執行延遲（毫秒）',
    tokens_used INT COMMENT 'Token 使用量',
    cost_usd DECIMAL(10, 4) COMMENT '成本（美元）',

    started_at TIMESTAMPTZ COMMENT '開始時間',
    completed_at TIMESTAMPTZ COMMENT '完成時間',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) COMMENT '技能執行記錄（決議 #26：總表）';

-- LLM 呼叫記錄（可觀測性）
CREATE TABLE llm_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_execution_id UUID REFERENCES skill_executions(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),

    model VARCHAR(50) NOT NULL COMMENT 'LLM 模型名稱',
    purpose VARCHAR(100) COMMENT '呼叫目的（如 planning, routing）',

    input_tokens INT NOT NULL COMMENT '輸入 token 數',
    output_tokens INT NOT NULL COMMENT '輸出 token 數',
    cost_usd DECIMAL(10, 6) NOT NULL COMMENT '成本（美元）',

    latency_ms INT NOT NULL COMMENT '延遲（毫秒）',

    -- 內容（可選，用於 replay）
    input_hash VARCHAR(64) COMMENT '輸入內容 hash（用於查詢，不存完整內容）',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) COMMENT 'LLM 呼叫記錄';

-- 用戶 Webhook 配置（決議 #28）
CREATE TABLE user_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    url TEXT NOT NULL COMMENT 'Webhook URL',
    events notification_type[] NOT NULL COMMENT '訂閱的事件類型',
    secret VARCHAR(64) COMMENT 'Webhook 簽名密鑰',

    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否啟用',
    last_triggered_at TIMESTAMPTZ COMMENT '最後觸發時間',
    failure_count INT NOT NULL DEFAULT 0 COMMENT '連續失敗次數',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) COMMENT '用戶 Webhook 配置（決議 #28）';

-- 站內通知（決議 #28）
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type notification_type NOT NULL COMMENT '通知類型',
    title VARCHAR(200) NOT NULL COMMENT '通知標題',
    content TEXT COMMENT '通知內容',

    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE COMMENT '關聯任務',

    is_read BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已讀',
    email_sent BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Email 是否已發送',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) COMMENT '站內通知（決議 #28）';

-- ============================================================
-- 索引
-- ============================================================

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_conversations_project_id ON conversations(project_id);
CREATE INDEX idx_generations_project_id ON generations(project_id);
CREATE INDEX idx_deployments_project_id ON deployments(project_id);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);

-- Orchestrator 索引
CREATE INDEX idx_skills_status ON skills(status);
CREATE INDEX idx_skills_name ON skills(name);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(calculated_priority DESC);
CREATE INDEX idx_task_steps_task_id ON task_steps(task_id);
CREATE INDEX idx_skill_executions_user_id ON skill_executions(user_id);
CREATE INDEX idx_skill_executions_skill_id ON skill_executions(skill_id);
CREATE INDEX idx_llm_calls_user_id ON llm_calls(user_id);
CREATE INDEX idx_llm_calls_task_id ON llm_calls(task_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);

-- ============================================================
-- RLS 政策
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

-- 用戶只能看到自己的資料
CREATE POLICY "users_own_data" ON users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "projects_own_data" ON projects
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "conversations_own_data" ON conversations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = conversations.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "generations_own_data" ON generations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = generations.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "deployments_own_data" ON deployments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = deployments.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Orchestrator RLS 政策
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_own_data" ON tasks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "task_steps_own_data" ON task_steps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tasks
            WHERE tasks.id = task_steps.task_id
            AND tasks.user_id = auth.uid()
        )
    );

CREATE POLICY "skill_executions_own_data" ON skill_executions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "llm_calls_own_data" ON llm_calls
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_webhooks_own_data" ON user_webhooks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "notifications_own_data" ON notifications
    FOR ALL USING (auth.uid() = user_id);
