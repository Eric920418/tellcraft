# 釐清問題

Task（任務）與現有的 Project（專案）是什麼關係？

# 定位

Feature：任務管理
缺少定義：Task 與 Project 的關聯

# 決議

**選項 A：Task 屬於 Project**

- 一個 Project 可以有多個 Task
- Task 類型包括：建立專案、迭代修改、SEO 優化、UI/UX 優化等
- tasks 表需要 project_id 外鍵
- 第一個 Task（建立專案）會同時建立 Project 記錄

# 解決日期

2026-01-23
