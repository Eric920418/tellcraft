# 釐清問題

不同用戶、不同任務是否有優先級差異？

# 定位

Feature：任務排程
缺少定義：優先級機制

# 決議

**選項 D：用戶 plan + 任務類型混合優先級**

- 優先級計算公式：plan_priority + task_type_priority
- 用戶 plan 優先級：Business(40) > Pro(30) > Creator(20) > Free(10)
- 任務類型優先級：可配置（例如迭代修改 > 新建專案 > SEO 優化）
- 相同優先級時按 FIFO 排序
- skills 表需新增 priority 欄位
- tasks 表需新增 calculated_priority 欄位

# 解決日期

2026-01-23
