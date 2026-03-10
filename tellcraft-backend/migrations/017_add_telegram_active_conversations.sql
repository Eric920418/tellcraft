-- Migration 017: Telegram Bot 活躍對話映射表
-- 與 line_active_conversations 相同結構，telegram_user_id 為 BIGINT

CREATE TABLE IF NOT EXISTS telegram_active_conversations (
    telegram_user_id BIGINT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    mode VARCHAR(10) DEFAULT 'fast',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tg_active_conv_user ON telegram_active_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_tg_active_conv_conversation ON telegram_active_conversations(conversation_id);
