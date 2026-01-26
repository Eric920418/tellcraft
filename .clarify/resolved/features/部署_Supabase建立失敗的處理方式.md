# 釐清問題

Supabase Management API 有配額限制，如果建立 Project 失敗（配額用盡或 API 錯誤），如何處理？

# 定位

Feature：自動部署（Phase 6）
PRD Section 4.1：Supabase Project 建立

# 決議

**選項 C：使用備用的 Supabase Organization 帳號**

處理流程：
1. 平台預先準備多個 Supabase Organization 帳號
2. 主帳號配額用盡時，自動切換到備用帳號
3. 對用戶透明，無需等待或介入
4. 營運團隊監控各帳號配額，適時申請擴充

營運需求：
- 至少準備 2-3 個備用 Organization
- 設定配額告警（80% 時通知）
- 定期檢視各帳號的 Project 分佈

# 影響範圍

- 部署引擎需支援多帳號切換
- 需儲存 Project 對應的 Organization ID
- 營運成本增加（多帳號管理）
- 提高系統可用性

# 解決日期

2026-01-22
