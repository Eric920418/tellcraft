# 釐清問題

Project 的 status 欄位有五種狀態（draft | generating | testing | deployed | failed），但狀態轉換規則未定義。哪些轉換是合法的？

# 定位

ERM：`projects` 實體的 `status` 屬性（VARCHAR(20)）

# 決議

**選項 D：以上皆是（線性 + 回退 + 重試）**

合法的狀態轉換：
```
draft → generating（開始生成）
generating → testing（生成完成，進入測試）
testing → deployed（測試通過，部署）
deployed → generating（迭代修改）
failed → generating（重試）

任何狀態 → failed（發生錯誤）
```

# 影響範圍

- `projects` 表的狀態機設計
- 前端 UI 的狀態顯示與操作按鈕
- 迭代修改功能的觸發條件
- 錯誤處理與重試機制

# 解決日期

2026-01-22
