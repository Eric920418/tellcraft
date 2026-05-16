-- 040: Stripe webhook event idempotency 紀錄
-- Stripe 會 retry 失敗的 webhook，同個 event.id 可能多次抵達。
-- 在處理前先 INSERT ... ON CONFLICT DO NOTHING，能拿到 row 才繼續處理；
-- 拿不到 row（重複）直接回 200 跳過，避免雙重退款 / 雙重升級配額。
--
-- 為什麼不用 Redis：webhook 是收入關鍵路徑，PG transaction 比 Redis 更可靠
-- （Redis flush / 重啟可能丟資料 → 同個 event 被處理兩次）。

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  -- Stripe event.id 是 evt_xxx 格式，全域唯一
  event_id VARCHAR(128) PRIMARY KEY,
  event_type VARCHAR(64) NOT NULL,
  -- 對應的精細模式訂單（若可從 event 解出）
  order_id UUID REFERENCES precision_orders(id) ON DELETE SET NULL,
  -- 處理結果：'processed' | 'skipped' | 'failed'
  status VARCHAR(16) NOT NULL DEFAULT 'processed',
  error_message TEXT,
  -- 完整 payload 保留 14 天（給 debug 用，超過自動清理）
  payload JSONB,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type ON stripe_webhook_events(event_type, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_order ON stripe_webhook_events(order_id) WHERE order_id IS NOT NULL;
-- 失敗 event 監控用（cron 抓最近失敗 retry 或告警）
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_failed ON stripe_webhook_events(received_at DESC) WHERE status = 'failed';

COMMENT ON TABLE stripe_webhook_events IS '已處理的 Stripe webhook event log，主鍵 PG UNIQUE 防重複處理';
COMMENT ON COLUMN stripe_webhook_events.status IS 'processed: 正常處理完 / skipped: 不關心的 event type / failed: 處理時報錯';
