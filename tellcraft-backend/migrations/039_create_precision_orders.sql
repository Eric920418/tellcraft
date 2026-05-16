-- 039: 精細模式（Precision Mode）一次性付費訂單表
-- 對應 plan: /Users/eric/.claude/plans/strip-golden-seal.md
--
-- 商業設計：$299/$599/$999 一次性購買，限 N 次迭代，可選加購（託管月費/維護訂閱/模塊/買斷）
-- 與訂閱制（users.plan creator/pro/business）並存。precision_orders 是另一條收入支線。
--
-- status 狀態機：
--   pending → 用戶剛建立 checkout session，還沒付款
--   paid    → Stripe webhook 確認付款成功
--   in_progress → 進入 BDD/UIUX/Coder pipeline
--   delivered   → Deploy 成功，warranty_until/refund_deadline 寫入
--   refunded    → 退款，project 凍結但保留資料（不覆寫不刪除）
--   cancelled   → 用戶在 Stripe Checkout 取消，cancellation_reason 收集原因
--   failed      → Pipeline 失敗無法交付（自動退款或人工介入）

CREATE TABLE IF NOT EXISTS precision_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- 商品資訊
  tier VARCHAR(32) NOT NULL,  -- 'starter_299' | 'standard_599' | 'pro_999'
  amount_cents INT NOT NULL,  -- 含加購總額（cents，USD 計，乘 100）
  currency VARCHAR(8) NOT NULL DEFAULT 'usd',
  base_amount_cents INT NOT NULL,  -- 不含加購的檔位本價
  addons JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{type:'hosting'|'maintenance'|'module', id, price_cents}, ...]

  -- 狀態
  status VARCHAR(16) NOT NULL DEFAULT 'pending',

  -- Stripe 關聯
  stripe_customer_id VARCHAR(64),
  stripe_payment_intent_id VARCHAR(128),
  stripe_checkout_session_id VARCHAR(256) UNIQUE,  -- success polling 用，UNIQUE 防重複建單

  -- 迭代額度
  iterations_total INT NOT NULL,  -- 該訂單初始迭代額度（starter=3 / standard=8 / pro=15）
  iterations_used INT NOT NULL DEFAULT 0,

  -- 保固 / 退款窗口
  warranty_until TIMESTAMPTZ,         -- delivered 後 90 天
  refund_deadline TIMESTAMPTZ,        -- paid 後 14 天無條件退款
  delivered_at TIMESTAMPTZ,
  exported_buyout BOOLEAN NOT NULL DEFAULT false,

  -- LLM 成本上限（保護單訂單不被 cost 蝕本，超過強制凍結 + 告警）
  llm_cost_cap_usd NUMERIC(10, 2),    -- starter=50 / standard=120 / pro=200
  llm_cost_used_usd NUMERIC(10, 4) NOT NULL DEFAULT 0,

  -- 取消原因（cancel 頁 radio 收集，分析定價/轉換問題用）
  cancellation_reason VARCHAR(64),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT precision_orders_status_check CHECK (
    status IN ('pending', 'paid', 'in_progress', 'delivered', 'refunded', 'cancelled', 'failed')
  ),
  CONSTRAINT precision_orders_tier_check CHECK (
    tier IN ('starter_299', 'standard_599', 'pro_999')
  ),
  CONSTRAINT precision_orders_iterations_check CHECK (iterations_used <= iterations_total)
);

-- 查詢索引
CREATE INDEX IF NOT EXISTS idx_precision_orders_user ON precision_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_precision_orders_project ON precision_orders(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_precision_orders_status ON precision_orders(status) WHERE status IN ('pending', 'paid', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_precision_orders_stripe_session ON precision_orders(stripe_checkout_session_id);

-- updated_at 自動維護（沿用 projects 表慣例）
CREATE OR REPLACE FUNCTION update_precision_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_precision_orders_updated_at ON precision_orders;
CREATE TRIGGER trg_precision_orders_updated_at
  BEFORE UPDATE ON precision_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_precision_orders_updated_at();

-- users 加 stripe_customer_id（之後託管月費/維護訂閱也用同一個 customer）
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(64) UNIQUE;

COMMENT ON TABLE precision_orders IS '精細模式一次性付費訂單，與 users.plan 訂閱制並存';
COMMENT ON COLUMN precision_orders.tier IS '檔位：starter_299 (Landing 單頁 3 次迭代) / standard_599 (3-5 頁中型站 8 次) / pro_999 (後台+DB SaaS 15 次)';
COMMENT ON COLUMN precision_orders.addons IS '加購項目：託管月費/維護訂閱/模塊 (blog/auth/ecommerce/forms)/買斷';
COMMENT ON COLUMN precision_orders.llm_cost_cap_usd IS '單訂單 LLM 成本上限，超過 freeze pipeline 防虧錢';
COMMENT ON COLUMN precision_orders.exported_buyout IS 'true=已付買斷費，可下載代碼自部署';
