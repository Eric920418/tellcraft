# 釐清問題

PRD 提到「迭代式釐清（2-5+ 輪）」，但 AI 如何判斷「所有問題已釐清」？終止條件是什麼？

# 定位

Feature：需求釐清（Phase 1）
PRD Section 3.2：sdd.os BDD Spec Skill 的迭代終止條件

# 決議

**選項 A：連續 N 輪 Discovery 未發現新問題，N = 2**

終止條件：
- 連續執行 2 輪 Discovery 階段
- 兩輪都未發現新的歧義或遺漏
- 即可判定為「充分釐清」，進入 Formulation 階段

注意：用戶無法手動跳過釐清流程，必須由 AI 判定終止。

# 影響範圍

- sdd.os BDD Spec Skill 的流程控制邏輯
- `.clarify/overview.md` 需追蹤「連續無新問題輪數」
- 用戶體驗：無強制終止手段，確保規格品質

# 解決日期

2026-01-22
