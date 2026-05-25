-- 044: 精細模式訂單加「工程師接案時間」欄位（W1 ops backstop）
--
-- 用途：因為標準方案賣「真人工程師 24h 協助開發完工」，需要可見化工程師接案狀態
-- 給客戶看（dashboard 顯示「等待接案 / 工程師處理中 / 已交付」3 狀態）。
--
-- 為什麼用 timestamp 不用 enum：
-- 1. 一個 timestamp 即可推出 3 狀態（NULL / 有值 / 配合 delivered_at），不用維護 enum 升級
-- 2. 欄位語意自然："何時被接的"，比 status='engineer_assigned' 直覺
-- 3. 將來想加「engineer_email」也獨立加，互不耦合
--
-- 工程師如何「接案」：W1 階段直接 SQL UPDATE。W2 再做 admin endpoint：
--   UPDATE precision_orders SET engineer_contacted_at = NOW() WHERE id = '<order-id>';

ALTER TABLE precision_orders
  ADD COLUMN IF NOT EXISTS engineer_contacted_at TIMESTAMPTZ;

COMMENT ON COLUMN precision_orders.engineer_contacted_at IS
  '真人工程師首次聯絡客戶的時間。NULL=尚未接案 / 有值=處理中。dashboard 用此推「工程師狀態」badge';

-- 監控 index：抓「付款超過 24h 還沒接案」的逾期訂單（給 cron / dashboard alert 用）
CREATE INDEX IF NOT EXISTS idx_precision_orders_unacknowledged
  ON precision_orders (created_at)
  WHERE status = 'paid' AND engineer_contacted_at IS NULL;
