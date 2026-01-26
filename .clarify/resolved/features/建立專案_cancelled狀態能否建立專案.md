# 釐清問題

用戶訂閱狀態為 `cancelled`（超過 30 天暫停期）時，能否建立新專案？

# 定位

Feature：建立專案
Rule：前置 - 用戶訂閱狀態必須為 active

# 決議

**選項 A：不能，cancelled 用戶完全無法使用平台**

- cancelled 狀態的用戶無法執行任何操作
- 需重新訂閱才能使用
- 建立專案.feature 需新增 Example 覆蓋此情境

# 解決日期

2026-01-22
