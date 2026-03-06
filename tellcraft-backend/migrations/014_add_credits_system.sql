-- 014: Credit 加權配額系統
-- 新增 credits_used_this_period 欄位，從 message_count_this_period 遷移數據
-- 舊欄位 message_count_this_period 保留（DEPRECATED，雙寫過渡期）

ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_used_this_period INT NOT NULL DEFAULT 0;

-- 遷移現有數據：將已累計的 message_count 作為初始 credit 使用量
UPDATE users SET credits_used_this_period = message_count_this_period
  WHERE credits_used_this_period = 0 AND message_count_this_period > 0;

COMMENT ON COLUMN users.message_count_this_period IS 'DEPRECATED: 請使用 credits_used_this_period';
COMMENT ON COLUMN users.credits_used_this_period IS '本期已使用的 Credit 數量';

-- 新增訂閱週期起始時間（用於月重置）
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW();
