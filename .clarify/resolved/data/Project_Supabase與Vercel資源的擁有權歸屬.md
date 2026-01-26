# 釐清問題

用戶的 Supabase Project 和 Vercel Project 是建在平台的帳號下，還是用戶自己的帳號？用戶是否能完全擁有這些資源？

# 定位

ERM：`projects` 實體的 `supabase_project_id`、`vercel_project_id` 屬性

# 決議

**選項 A：全部建在平台帳號下，用戶付費後可申請移轉**

- 所有資源預設建在 AI-Genesis 平台的 Supabase Organization / Vercel Team 下
- 用戶付費訂閱後，可申請將資源移轉到自己的帳號
- 移轉後平台不再管理該資源

# 影響範圍

- 部署引擎使用平台統一的 API 認證
- 需設計「資源移轉」功能
- 取消訂閱時資源仍在平台帳號下（需另定處理策略）
- 計費模式：平台代付 Supabase/Vercel 費用

# 解決日期

2026-01-22
