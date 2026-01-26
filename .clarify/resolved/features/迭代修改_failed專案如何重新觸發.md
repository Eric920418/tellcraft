# 釐清問題

決議說 failed 專案「需用戶修改需求後重新觸發」，但迭代修改.feature 只處理 deployed 狀態。failed 專案如何重新嘗試生成？

# 定位

Feature：迭代修改
缺少 Rule：前置 - failed 狀態專案也可觸發迭代修改

# 決議

**選項 A：迭代修改的前置條件改為「專案狀態為 deployed 或 failed」**

- 擴展迭代修改 Feature 的適用範圍
- failed 專案可透過迭代修改重新觸發生成流程
- 用戶修改需求後，專案狀態從 failed → generating
- 迭代修改.feature 需更新 Rule 並新增 Example

# 解決日期

2026-01-22
