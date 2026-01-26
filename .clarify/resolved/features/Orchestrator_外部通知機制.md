# 釐清問題

任務完成/失敗時，如何通知用戶或外部系統？

# 定位

Feature：任務管理
缺少定義：通知機制

# 決議

**選項 D：Webhook + 內建通知都支援**

- 內建通知：
  - Email 通知（任務完成/失敗/需審核）
  - 站內通知（即時推送）
- Webhook：
  - 用戶可配置回調 URL
  - 支援的事件：task.completed, task.failed, task.needs_approval
  - 包含重試機制（失敗重試 3 次）
- 需新增：
  - user_webhooks 表（儲存用戶配置的 webhook）
  - notifications 表（站內通知記錄）

# 解決日期

2026-01-23
