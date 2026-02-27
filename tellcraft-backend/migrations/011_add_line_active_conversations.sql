-- LINE Bot 活躍對話映射表
-- 追蹤 LINE userId 對應的當前活躍 conversation

CREATE TABLE IF NOT EXISTS line_active_conversations (
    line_user_id VARCHAR(64) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    mode VARCHAR(10) DEFAULT 'fast',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_active_conv_user ON line_active_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_line_active_conv_conversation ON line_active_conversations(conversation_id);
