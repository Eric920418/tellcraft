# Tellcraft

> **用對話打造你的軟體產品** | [tellcraft.com](https://tellcraft.com)

Tellcraft 是一個 AI 驅動的自動化開發平台。用戶只需描述需求，AI 會自動釐清細節、生成程式碼、部署上線。

## 核心理念

```
描述需求 → AI 釐清 → 確認規格 → 自動生成 → 一鍵部署
```

## 當前開發進度

- **狀態**：✅ Phase 1-9 + Server Actions + Inngest Orchestrator + 前端 Chat 串接 + 認證系統 + 訪客體驗改善 + 儀表板系統 + BDD Spec 完整修復
- **釐清項目**：28 項全部解決
- **Server Actions**：30+ 已實作
- **詳情**：[`.clarify/overview.md`](.clarify/overview.md)

### 效能優化（2026-01-31）

**第二輪：Server Component 重構**

Dashboard 從 Client Component 改為 Server Component，消除瀑布式載入：

| 變更 | 說明 |
|------|------|
| `dashboard/layout.tsx` | 改為 Server Component，server 端直接查詢用戶資料 |
| `dashboard/page.tsx` | 改為 Server Component，server 端並行查詢所有資料 |
| `DashboardShell.tsx` | 新增 Client Component，處理 Sidebar 和互動 |
| `DashboardContent.tsx` | 新增 Client Component，處理動畫和 UI |

**效果**：原本需要 2 次瀑布式載入（layout → page），現在 server 端一次完成。

---

**第一輪：查詢優化**

| 問題 | 位置 | 修復方式 | 改善 |
|------|------|---------|------|
| Middleware 每次查 DB | `middleware.ts` | is_admin 用 cookie 快取 5 分鐘 | -500ms |
| Admin N+1 查詢 | `admin.ts:listAllUsers` | 批量查詢 user_id → 記憶體計數 | -1.5s |
| 序列 await 迴圈 | `index.ts:migrateAnonymousAccount` | Promise.all 並行處理 | -800ms |
| Layout 瀑布式請求 | `dashboard/layout.tsx` | getCurrentUser 直接返回 isAdmin | -150ms |
| select('*') 計數 | 多處 | 改用 select('id') | -200ms |

### 釐清流程簡化（2026-01-31）

將無限迭代改為最多 2 輪，用戶體驗大幅改善：

**舊流程**（問題：無限循環、不可預期）：
```
Discovery → 問5題 → 問完 → Re-discovery → 問5題 → ... → 連續2輪沒新問題 → 結束
```

**新流程**（改善：可預期、最多3輪）：
```
第一輪 Discovery（一次產出所有問題）
    ↓
告知用戶「總共 N 題」
    ↓
每5題確認一次，顯示進度 (5/30)
    ↓
全部答完 → 分析是否有遺漏
    ↓
├─ 0 題 → 進入 Formulation
├─ 1-10 題 → 第二輪 → 進入 Formulation
└─ >10 題 → 第二輪 → 答完 → 再分析 → 第三輪（最後）→ 進入 Formulation
```

| 改善項目 | 說明 |
|----------|------|
| **問題總數可見** | 一開始告知用戶「總共 N 題」|
| **進度顯示** | 每題顯示 (5/30) 進度 |
| **動態輪數** | 第二輪 ≤10 題結束；>10 題進入第三輪 |
| **第三輪保險** | 複雜需求有第三輪兜底，但絕對封頂 |
| **語意去重** | 每輪都過濾重複問題 |

### 最新修復（2026-01-31）

修復 BDD Spec Skill 的多項問題：

| 修復項目 | 描述 |
|----------|------|
| **Phase 3 Spec Clarify** | 實現完整迭代釐清循環，不再跳過 |
| **真實驗證腳本** | 使用 `validateFeatureContent()` 函數驗證 Feature 格式 |
| **自癒機制** | 修復後真正重新驗證，不再假設通過 |
| **反悔機制** | 「修改 N」指令調用 `revertAnswer` 將項目移回待處理 |

### Token 優化（2026-01-31）

優化 LLM Token 使用效率：

| 優化項目 | 節省估算 | 說明 |
|----------|----------|------|
| **批量 Feature 修復** | ~2500-5000 tokens/次 | 原本逐個 Feature 調用 LLM，改為一次批量修復 |
| **語意去重過濾** | 節省重複問答 token | Discovery 後用 Haiku 過濾語意重複問題，避免浪費 token 問相同問題 |
| **刪除死代碼** | 維護成本 | 移除 `processAnswer`、`translateToWhiteText`、`generateSpecSummary` |

**LLM 函數變更**（`app/lib/llm.ts`）：
- ✅ 新增 `fixMultipleFeatures()` - 一次 LLM 調用批量修復多個 Feature
- ✅ 新增 `filterDuplicateQuestions()` - 用 Haiku 判斷語意相似度過濾重複問題
- ❌ 刪除 `processAnswer()` - 未使用
- ❌ 刪除 `translateToWhiteText()` - 未使用
- ❌ 刪除 `generateSpecSummary()` - 未使用

**現有 LLM 函數**：
- `validateFeatureContent()` - 驗證單個 Feature 內容（本地 Regex，不調用 LLM）
- `validateMultipleFeatures()` - 批量驗證多個 Feature（本地 Regex，不調用 LLM）

### UX 改進（2026-01-31）

| 改進項目 | 說明 |
|----------|------|
| **完成訊息措辭** | 不再要求用戶輸入「生成程式碼」，改為直接確認「這樣對嗎？」|
| **Markdown 渲染** | 聊天介面支援 Markdown 格式美化（表格、粗體、列表等）|
| **釐清摘要格式化** | 決策記錄分段顯示，每題用分隔線隔開，Q/A 用粗體標記 |
| **問題格式簡化** | 釐清問題只顯示問題和選項，移除進度/優先級/定位等冗餘資訊 |
| **自動恢復對話** | 重開網頁時自動恢復最近對話，無需手動選擇 |
| **問題去重** | `addClarifyItems` 加入正規化去重，避免語意相似問題重複出現 |
| **語意去重** | Discovery 後用 Claude Haiku 過濾語意重複問題（`filterDuplicateQuestions`）|
| **確認檢查點格式** | 改用列表格式，完整顯示問題和答案（含選項描述）|

**新增套件**：
- `react-markdown` - Markdown 渲染
- `remark-gfm` - GitHub Flavored Markdown（表格、刪除線等）

**新增 LLM 函數**：
- `generateClarifySummary()` - 生成格式化的釐清摘要（資料模型、功能規格、決策記錄）

**驗證規則**：
- E001: 缺少 Action 註解
- E002: 缺少 Summary 註解
- E003: 缺少 Feature 宣告
- E004: Summary 與 Feature 名稱不一致
- E005: Rule 缺少前置/後置標註
- E006: When 步驟格式錯誤（應為 `{summary}, call table:`）
- E007: Then 步驟格式錯誤
- E008: 沒有 Example

### 認證系統

支援 Google 和 LINE OAuth 登入，使用 `@supabase/ssr` 實現 SSR 友善的 session 管理：

```
登入頁 → Google/LINE OAuth → Supabase Auth → Session Cookie → 受保護路由
```

**架構**：
- `app/lib/supabase/client.ts` - Browser client（前端）
- `app/lib/supabase/server.ts` - Server client（Server Actions）
- `proxy.ts` - Session refresh + 路由保護
- `app/auth/login/page.tsx` - 登入頁面（卡片式設計）
- `app/auth/callback/route.ts` - OAuth callback（PKCE）
- `app/api/auth/line/` - LINE OAuth 自訂流程

**新增 Server Actions**：
- `initializeSessionFromAuth` - 從認證 session 初始化（已登入用戶，支援帳號合併）
- `getCurrentUser` - 取得當前認證用戶
- `signOut` - 登出
- `getUserConversations` - 獲取用戶所有對話列表（用於歷史對話選擇器）
- `migrateAnonymousAccount` - 遷移匿名帳號資料到認證帳號

**環境變數**：
```bash
# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # LINE 備選方案

# LINE OAuth
LINE_CHANNEL_ID=xxx
LINE_CHANNEL_SECRET=xxx

# App URL
NEXT_PUBLIC_APP_URL=https://tellcraft.com
```

**Supabase Dashboard 配置**：
1. Authentication > Providers > 啟用 Google
2. 配置 Google Cloud Console 的 Client ID/Secret
3. Site URL: `https://tellcraft.com`
4. Redirect URLs: `https://tellcraft.com/auth/callback`

### 前端 Chat 串接 Inngest

用戶在首頁輸入需求後，真正觸發 `bdd-spec` skill，實現完整的多輪對話流程：

```
用戶輸入 → initializeSession（匿名用戶）
    → sendMessageAndTrigger → triggerUserRequest
    → Inngest Orchestrator → bdd-spec skill
    → AI 回覆寫入 DB → 前端輪詢取得
    → 用戶回覆 → triggerUserReply → Inngest 恢復
```

**專案創建邏輯**（2026-01-31 修復）：

| 最近專案狀態 | 行為 |
|-------------|------|
| `draft` / `generating` | 複用現有專案（進行中的工作可繼續）|
| `deployed` / `testing` / `failed` | 創建新專案（已完成的不覆蓋）|
| 無專案 | 創建新專案 |

**對話恢復邏輯**（2026-01-31 修復）：

| 情況 | 行為 |
|------|------|
| 有未完成對話（`spec_complete=false`）| 自動恢復最近的未完成對話 |
| 只有已完成對話 | 創建新對話 |
| 無對話 | 創建新對話 |

這樣確保用戶重新整理頁面時，能自動恢復未完成的對話。

**專案提醒橫幅**（2026-01-31 新增）：

用戶回到首頁時，顯示提醒橫幅：

| 情況 | 提醒類型 | 顏色 | 訊息 |
|------|----------|------|------|
| 有 draft/generating 專案 + 未完成對話 | `in_progress` | 藍色 | 「你有一個專案正在進行中，點擊繼續」|
| 專案 deployed（24h 內）| `completed` | 綠色 | 「你的專案已上線！點擊查看」|
| 專案 failed（24h 內）| `failed` | 紅色 | 「你的專案生成失敗，點擊重試」|

- 使用 `sessionStorage` 記錄關閉狀態（關閉瀏覽器後重置）
- 支援匿名用戶和已登入用戶

**Chat 相關 Server Actions**：
- `initializeSession` - 創建或獲取匿名用戶的會話（訪客模式，支援恢復指定對話）
- `initializeSessionFromAuth` - 從認證 session 初始化（已登入用戶，支援帳號合併）
- `sendMessageAndTrigger` - 發送消息並觸發 Inngest
- `replyToConversation` - 多輪對話時用戶回覆
- `getConversationMessages` - 獲取對話消息（用於輪詢）
- `getUserConversations` - 獲取用戶所有對話列表（用於歷史對話選擇器）
- `migrateAnonymousAccount` - 遷移匿名帳號資料到認證帳號
- `getCurrentUser` - 取得當前認證用戶
- `signOut` - 登出

### 訪客體驗改善

實現訪客對話持久化和帳號合併功能：

**功能特點**：
1. **對話恢復** - 訪客關閉瀏覽器後重新訪問，可選擇繼續之前的對話或開始新對話
2. **Cookie 備份** - 防止 localStorage 被清除時遺失 anonymousId
3. **帳號合併** - 訪客登入後自動將專案和對話遷移到認證帳號
4. **登入提示** - 在適當時機（對話 3 輪後、生成中、部署成功後）提示登入

**相關檔案**：
- `app/api/session/route.ts` - Cookie 備份 anonymousId
- `app/components/ConversationPicker.tsx` - 歷史對話選擇器
- `app/components/LoginPrompt.tsx` - 登入提示（subtle/emphasized 兩種版本）
- `app/auth/post-login/page.tsx` - 登入後帳號合併處理

**流程**：
```
訪客流程：
訪客創建對話 → 關閉瀏覽器 → 重新訪問
    → 顯示對話選擇器 → 「繼續之前的對話」或「開始新對話」

帳號合併流程：
訪客創建專案 → 點擊登入 → OAuth → post-login 頁面
    → migrateAnonymousAccount → 專案/對話遷移 → 跳轉首頁
```

**登入提示觸發時機**：
| 時機 | 版本 | 文案 |
|------|------|------|
| 對話 3 輪後 | subtle（頂部橫幅）| 登入後可隨時恢復這個對話 |
| 生成程式碼中 | subtle | 登入後可在任何裝置查看生成進度 |
| 部署成功後 | emphasized（彈窗）| 你的網站已上線，登入以管理和更新 |

**拒絕後 24 小時內不再提示**

### 儀表板系統

完整的用戶和管理員儀表板系統：

**用戶儀表板**（`/dashboard`）：
- 個人統計（專案數、對話數、部署數、訊息配額）
- 我的專案列表（搜尋、篩選、分頁）
- 專案詳情（對話歷史、部署記錄、生成記錄）
- 對話列表（按時間排序）

**管理員儀表板**（`/dashboard/admin`）：
- 平台總覽統計（用戶、專案、對話、部署、7 天活躍用戶）
- 用戶管理（列表、搜尋、排序、設定管理員權限）
- 用戶詳情（專案、對話、LLM 成本）
- LLM 用量統計（按日/週/月/模型/對話分組、成本追蹤，預設查詢最近 30 天）
- 審計日誌（操作記錄、篩選）

**Supabase 流量優化**（2025-01）：
- 輪詢機制：智慧退避（3-15秒），有新消息重置為 3 秒
- 輪詢停止：對話完成（spec_complete）後自動停止輪詢
- `getConversationMessages`：先檢查 `updated_at`，無更新時跳過載入 messages
- `getProjectDetail`：並行查詢對話、部署、生成記錄（3 次串行 → 1 次並行）
- `getAdminStats`：使用 `select('id')` 取代 `select('*')` 減少流量
- `getUserStats`：合併重複查詢，並行執行減少往返
- `getUserConversations`：使用 JOIN 減少 2 次查詢為 1 次
- `listAllConversations`：使用 JOIN 減少 3 次查詢為 1 次
- `listAllUsers`：並行計數查詢取代返回所有 projects
- `getLLMUsageStats`：預設只查詢最近 30 天
- Admin Users 頁面：搜尋 debounce（300ms）
- Admin Usage 頁面：圖表數據使用 useMemo 快取

**建議的資料庫索引**（在 Supabase SQL Editor 執行）：
```sql
-- 加速 conversations 查詢
CREATE INDEX IF NOT EXISTS idx_conversations_project_updated
  ON conversations(project_id, updated_at DESC);

-- 加速用戶統計
CREATE INDEX IF NOT EXISTS idx_projects_user_id
  ON projects(user_id);

CREATE INDEX IF NOT EXISTS idx_deployments_project_status
  ON deployments(project_id, status);

-- 加速 LLM 使用查詢
CREATE INDEX IF NOT EXISTS idx_llm_usage_created
  ON llm_usage(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_llm_usage_user_created
  ON llm_usage(user_id, created_at DESC);
```

**路由結構**：
```
/dashboard                    # 用戶首頁
/dashboard/projects           # 我的專案
/dashboard/projects/[id]      # 專案詳情
/dashboard/conversations      # 我的對話
/dashboard/admin              # 管理員總覽（需 is_admin）
/dashboard/admin/users        # 用戶管理
/dashboard/admin/users/[id]   # 用戶詳情
/dashboard/admin/usage        # LLM 用量統計
/dashboard/admin/logs         # 審計日誌
```

**權限控制**：
- Middleware 攔截未登入訪問 `/dashboard`
- Middleware 攔截非管理員訪問 `/dashboard/admin`
- Server Actions 使用 `requireAdmin()` 二次驗證

**資料庫變更**：
```sql
-- users 表新增欄位
is_admin BOOLEAN DEFAULT FALSE

-- 新增審計日誌表
CREATE TABLE audit_logs (
  id, user_id, action, entity_type, entity_id, metadata, created_at
)

-- 新增 LLM 用量追蹤表
CREATE TABLE llm_usage (
  id, user_id, conversation_id, model, input_tokens, output_tokens, cost_usd, purpose, created_at
)

-- 管理員 RLS 策略（可查看所有資料）
```

**新增 Server Actions**：
- 管理員 Actions（`app/actions/admin.ts`）：
  - `getAdminStats` - 總覽統計
  - `listAllUsers` - 用戶列表（分頁、搜尋、排序）
  - `listAllProjects` - 專案列表
  - `listAllConversations` - 對話列表
  - `getUserDetail` - 用戶詳情
  - `getLLMUsageStats` - LLM 用量統計
  - `getAuditLogs` - 審計日誌查詢
  - `setUserAdmin` - 設定管理員權限
  - `logAuditEvent` - 記錄審計日誌
- 用戶 Actions（`app/actions/index.ts` 新增）：
  - `getUserStats` - 個人統計
  - `getUserProjects` - 我的專案列表
  - `getProjectDetail` - 專案詳情

**UI 元件**（`app/components/dashboard/`）：
- `Sidebar.tsx` - 側邊導航（根據 is_admin 顯示管理選項）
- `StatsCard.tsx` - 統計卡片（數字 + 趨勢）
- `DataTable.tsx` - 資料表格（分頁、排序、搜尋）
- `Chart.tsx` - 圖表元件（BarChart、LineChart、ProgressBar、DonutChart）
- `DateRangePicker.tsx` - 日期範圍選擇器

## 技術棧

| 服務 | 用途 | 狀態 |
|------|------|------|
| Next.js 16 | Server Actions + Turbopack | ✅ |
| React 19.2 | UI 框架 | ✅ |
| Framer Motion | 動畫效果 | ✅ |
| next-themes | 深色/淺色模式 | ✅ |
| @supabase/ssr | SSR 認證 | ✅ |
| Inngest | 事件驅動任務編排（大腦）| ✅ |
| Modal | sdd.os 執行環境（手腳）| ⏳ 待整合 |
| sdd.os | 規格驅動開發、TDD 迭代 | ⏳ 待整合 |
| Supabase | 資料庫 + Storage + Auth | ✅ |
| Vercel | 網站部署 + 用戶專案部署 | ✅ |
| Cloudflare | DNS 託管 | ✅ |
| Porkbun | 網域購買 | ⏳ Mock |

## 首頁設計

極簡風格的互動式首頁，兩種使用路徑：

### 路徑 A：直接輸入
```
Hero 輸入框 → 輸入需求 → 平滑過渡至聊天模式 → 對話開發流程
```

### 路徑 B：了解產品
```
Hero → 往下滾動 → 產品介紹（SEO 友好）→ Testimonials → CTA
```

### 動態效果（reactbits 風格）
- `AnimatedThemeToggler` - 左上角深色/淺色模式切換器（支援 system 預設）
- `TextType` - 主視覺標題打字機效果
- `SplitText` (GSAP) - 文字逐字淡入 + 模糊消散
- `RotatingText` - 使用場景標題輪播動畫
- `GlareHover` - 卡片 hover 光澤掃過效果
- `CardSwap` (GSAP) - 3D 卡片堆疊輪播動畫
- `BlurRevealText` - 滾動觸發的模糊揭示動畫
- `AnimatedCounter` - 數字滾動計數器
- `ScrollIndicator` - 呼吸式向下滾動提示
- FAQ 手風琴展開動畫

### SEO 內容區塊
| 區塊 | SEO 價值 | 內容 |
|------|----------|------|
| Use Cases | 長尾關鍵字 | 4 種使用場景（新創/電商/接案/中小企業）|
| How It Works | 流程說明 | 5 步驟完整開發流程 |
| Stats | 信任指標 | 4 項關鍵數據 |
| Comparison | 比較表格 | 傳統開發 vs Tellcraft 6 項對比 |
| FAQ | Google 精選摘要 | 8 個常見問題（手風琴式）|
| Testimonials | 社會證明 | 3 則用戶評價輪播 |
| Footer | 網站結構 | 完整導航連結 |
- 訊息氣泡進場動畫、打字指示器脈衝動畫

## 規格產出

| 產出 | 路徑 |
|------|------|
| SQL Schema | `spec/data/schema.sql` |
| Entity Mapping | `spec/data/entity_to_table_mapping.yml` |
| Feature Files (14) | `spec/features/*.feature` |
| Actions 定義 | `spec/actions/actions.yml` |
| ISA 配置 | `isa_codegen.yml` |

### Feature Files 清單

#### 核心功能（8 個）

| Feature | Server Action | 關聯決議 |
|---------|---------------|----------|
| 建立專案 | createProject | - |
| 發送訊息 | sendMessage | #7 對話計費 |
| 生成程式碼 | generateCode | #4 自癒機制 |
| 部署專案 | deployProject | #5 備用 Org |
| 迭代修改 | updateProject | #1 狀態轉換, #6 破壞性變更 |
| 取消訂閱 | cancelSubscription | #8 暫停期, #14 暫停頁 |
| 導出資料 | exportData | #13 SQL dump |
| 移轉資源 | transferResources | #12 自助移轉 |

#### Orchestrator 功能（6 個）

| Feature | Server Action | 關聯決議 |
|---------|---------------|----------|
| 建立任務 | createTask | #22 Task 屬於 Project |
| 確認計劃 | confirmTaskPlan | #24 超時處理 |
| 取消任務 | cancelTask | #23 保留已完成步驟, #28 通知 |
| 重試任務 | retryTask | #23 從失敗點重試 |
| 註冊技能 | registerSkill | #26 skill_executions 總表 |
| 配置Webhook | configureWebhook | #28 Webhook + 內建通知 |

### Orchestrator 架構決議

| # | 決議 | 選項 |
|---|------|------|
| 22 | Task 與 Project 關係 | Task 屬於 Project |
| 23 | 執行失敗回滾策略 | 不回滾，保留已完成步驟 |
| 24 | 人工審核超時處理 | 超時提醒 + 延長等待 + 自動取消 |
| 25 | 並行執行支援 | 不支援，依序執行 |
| 26 | skill_executions 與現有表 | 總表 + 細節表 1:1 關聯 |
| 27 | 任務優先級 | plan + task_type 混合 |
| 28 | 外部通知機制 | Webhook + 內建通知 |

### Skill 整合狀態

| Skill | 狀態 | 說明 |
|-------|------|------|
| `bdd-spec` | ✅ 完成 | 完整 5 階段流程：PRD Discovery/Clarify → Formulation → Spec Discovery/Clarify → Actions Design → ISA Config |
| `coder` | ⏳ 開發中 | 後端 API 生成，待開發完成後與 uiux 並行執行 |
| `uiux` | 🧪 可測試 | 4 階段前端設計流程 + LLM 程式碼生成 + Supabase Storage 儲存（目前單獨執行） |
| `deployer` | ✅ 完成 | 整合 Vercel Deployments API，部署後自動詢問網域設定 |
| `domain-manager` | ✅ 完成 | 網域管理入口，支援三種選擇 |
| `domain-purchase` | ✅ 完成 | Porkbun 網域註冊 |
| `domain-dns` | ✅ 完成 | Cloudflare Zone + Vercel 綁定 |

### BDD Spec Skill 完整流程

BDD Spec Skill 實現完整的 5 階段規格產出流程，使用 `bdd_sessions` 資料表追蹤會話狀態：

```
Phase 1: PRD Discovery + Clarify
    ↓ 使用 A1-A6, B1-B5, C1-C2, D1-D2 檢查清單掃描
    ↓ 每次問一題（白話翻譯）
    ↓ 每 5 題批量確認（支援反悔修改）
    ↓ 連續 2 輪無新問題後進入下一階段

Phase 2: Formulation
    ↓ 產出 schema.sql + entity_to_table_mapping.yml
    ↓ 產出 feature files（sdd.os ISA Gherkin 格式）
    ↓ 執行驗證腳本（lint + validate）
    ↓ 自癒機制（最多 3 次修復）

Phase 3: Spec Discovery + Clarify
    ↓ 對產出的 Feature Files 再次 Discovery
    ↓ 檢查規則完整性、Example 覆蓋度、邊界條件

Phase 4: Actions Design
    ↓ 產出 spec/actions/actions.yml

Phase 5: ISA Config
    ↓ 產出 isa_codegen.yml
```

**bdd_sessions 資料表**（`scripts/create-bdd-sessions.sql`）：
```sql
-- 核心欄位
current_phase TEXT     -- prd_discovery, prd_clarify, formulation, spec_discovery, spec_clarify, actions_design, isa_config, completed
current_round INT      -- 當前輪次
consecutive_empty_rounds INT  -- 連續空輪數（終止條件）

-- 釐清項目狀態
clarify_items JSONB    -- 待處理項目 [{ id, question, category, priority, status }]
staging_items JSONB    -- 暫存區（待確認）
resolved_items JSONB   -- 已解決

-- 規格內容
schema_sql_content TEXT
entity_mapping_content TEXT
features_content JSONB  -- [{ name, content }]
actions_yml_content TEXT
isa_config_content TEXT
```

**檢查清單**：
| 類別 | 檢查項目 |
|------|----------|
| A1-A6 | 領域與資料模型（Entity 定義、屬性完整性、關聯性、約束條件、命名規範、擴展性）|
| B1-B5 | 功能模型（CRUD 完整性、業務規則、狀態轉換、權限控制、錯誤處理）|
| C1-C2 | 術語一致性（專有名詞定義、跨功能一致性）|
| D1-D2 | 品質檢查（效能考量、安全性）|

**相關 Server Actions**（`app/actions/index.ts`）：
- `createBddSession` - 創建 BDD 會話
- `getBddSession` - 獲取會話狀態
- `updateBddSession` - 更新會話
- `answerClarifyItem` - 回答釐清項目
- `confirmBatch` - 批量確認
- `revertAnswer` - 反悔修改
- `skipClarifyItem` - 跳過項目
- `addClarifyItems` - 新增發現項目
- `getCurrentClarifyItem` - 獲取當前待處理項目
- `getBddSessionProgress` - 獲取進度統計

**相關 LLM 函數**（`app/lib/llm.ts`）：
- `runPrdDiscovery` - PRD Discovery（使用檢查清單）
- `translateToWhiteText` - 白話翻譯
- `generateSchemaSql` - 產出 SQL Schema
- `generateFeatureFiles` - 產出 Feature Files
- `runSpecDiscovery` - Spec Discovery
- `generateActionsYml` - 產出 Actions 規格
- `generateIsaConfig` - 產出 ISA 配置
- `fixFeatureFormat` - 自癒修復
- `validateFeatureContent` - 驗證 Feature 格式（E001-E008）
- `validateMultipleFeatures` - 批量驗證

**UIUX LLM 函數**（`app/lib/llm.ts`）：
- `generatePageComponent` - 生成頁面元件
- `generateUiComponent` - 生成 UI 元件（Button, Card, Input 等）
- `generateLayoutComponent` - 生成 Layout 元件（Header, Footer, Sidebar）
- `generateGlobalStyles` - 生成全域樣式
- `generateFullFrontend` - 批量生成完整前端

### UIUX 模板系統（2026-02-01）

實現模板引導式設計流程，包含分屏佈局和互動預覽：

```
用戶確認 BDD Spec → 進入 UIUX 階段 → 分屏佈局
┌────────────────┬─────────────────────────────┐
│   聊天區塊     │      預覽面板               │
│   (30% 寬)     │      (70% 寬)               │
│                │                             │
│  [模板選擇]    │   [模板預覽/iframe]         │
│  [AI 引導]     │   [設備切換 D/T/M]          │
│                │   [互動編輯器]              │
└────────────────┴─────────────────────────────┘
```

**核心元件**（`app/components/uiux/`）：
- `SplitLayout.tsx` - 可拖曳分屏佈局（30%/70%）
- `PreviewPanel.tsx` - 預覽面板 + iframe + 設備切換
- `DeviceSwitcher.tsx` - 設備切換器（desktop/tablet/mobile）
- `TemplatePicker.tsx` - 模板選擇器（網格 + 分類）
- `TemplateCard.tsx` - 模板卡片（預覽圖 + 標籤）
- `InteractivePreview.tsx` - 互動預覽（postMessage 通訊）
- `PropertyEditor.tsx` - 屬性編輯器（文字/顏色/間距）
- `UiuxChatSection.tsx` - UIUX 階段聊天介面

**訊息結構擴展**：
```typescript
interface Message {
  // 現有欄位
  layoutHint?: 'default' | 'split' | 'full_preview'
  richContent?: {
    type: 'template_picker' | 'design_preview' | 'code_preview'
    data: Record<string, unknown>
  }
}
```

**模板資料**（`app/lib/templates.ts`）：
- 5 個初始模板：saas-minimal, saas-pro, landing-startup, landing-corporate, ecommerce-modern
- 分類：saas, landing, ecommerce, content
- Server Actions：`getTemplates()`, `getTemplateById()`, `getRecommendedTemplates()`

**iframe 互動協議**（`public/scripts/interactive-preview.js`）：
```typescript
// 父視窗 → iframe
iframe.postMessage({ type: 'ENABLE_SELECTION_MODE' }, '*')
iframe.postMessage({ type: 'UPDATE_ELEMENT', elementId, changes }, '*')

// iframe → 父視窗
window.parent.postMessage({ type: 'ELEMENT_SELECTED', element }, '*')
window.parent.postMessage({ type: 'STYLES_UPDATED', elementId }, '*')
```

**資料庫變更**（`spec/data/schema.sql`）：
```sql
CREATE TYPE template_category AS ENUM ('saas', 'landing', 'ecommerce', 'content');
CREATE TABLE templates (
  id, name, slug, category, description, thumbnail_url, preview_image_url,
  tags, design_defaults, page_structure, is_active, is_featured, sort_order
);
```

### UIUX Skill 完整流程

UI/UX Skill 實現完整的 4 階段前端介面開發流程：

```
bdd-spec（規格確定）
         ↓
       uiux（前端）    ← 目前只執行這個
         ↓
     deployer

# TODO: coder 開發完成後改為並行執行：
# bdd-spec → [coder + uiux 並行] → deployer
```

**4 階段流程**：

```
Phase 1: Design Discovery
    ↓ 多輪問答釐清設計偏好
    ↓ 產品類型、視覺風格、配色、Dark Mode

Phase 2: Design Lab
    ↓ 生成 5 個設計變體（不同設計軸）
    ↓ 用戶選擇或合併變體

Phase 3: Implementation
    ↓ 產出 Next.js + Tailwind CSS 程式碼
    ↓ SSR 優先、RWD、motion/react

Phase 4: Quality Gate
    ↓ 無障礙檢查（WCAG 2.2 AA）
    ↓ 效能檢查（只動畫 transform/opacity）
    ↓ SEO 檢查（Metadata、Open Graph）
    ↓ 自癒機制（最多 3 次修復）
```

**設計變體的 5 個設計軸**：
- **A: Hierarchy Focus** - 重新結構化內容層級
- **B: Layout Model** - 不同佈局方式（card vs list vs table）
- **C: Density** - 密度變化（compact vs spacious）
- **D: Interaction** - 互動模式（modal vs inline vs drawer）
- **E: Expressive** - 品牌表達方向

**相關檔案**：
- `uiux-skill/skill.md` - Skill 定義
- `uiux-skill/instructions/` - 4 階段執行指南
- `uiux-skill/rules/baseline-ui.md` - UI 技術約束
- `app/actions/storage.ts` - Supabase Storage 整合

**儲存架構**：
```
UIUX 產出程式碼
      ↓
打包成 JSON（code-package.json）
      ↓
上傳到 Supabase Storage（generations bucket）
      ↓
URL 存入 generations.generated_code_url
      ↓
部署時下載 → 部署到 Vercel
```

### Domain Skills（拆分降低風險）

| Skill | 功能 | 觸發詞 |
|-------|------|--------|
| `domain-manager` | 入口，詢問用戶選擇 | 網域、domain、自訂網址 |
| `domain-purchase` | 購買網域（Porkbun 註冊） | 買網域、購買網域 |
| `domain-dns` | 設定 DNS + 綁定 Vercel | 設定 DNS、自有網域 |

```
用戶：「設定網域」
    ↓
domain-manager（入口）
    ↓
┌─────────────────────────────────────┐
│  1. 免費網域 → 直接完成             │
│  2. 購買網域 → domain-purchase      │
│  3. 自有網域 → domain-dns           │
└─────────────────────────────────────┘

購買網域流程（domain-purchase）：
查詢可用性 → 收集 Registrant 資訊 → Porkbun 註冊 → 完成
    ↓
「輸入『設定 DNS』來完成設定」

DNS 設定流程（domain-dns）：
建立 Cloudflare Zone → 更新 Nameserver → 設定 DNS 記錄 → 綁定 Vercel → 完成
```

**相關 API**：
- `porkbun.ts` - 網域購買/查詢 API
- `cloudflare.ts` - DNS 管理 API
- `domain.ts` - 網域工作流程整合

**待完成**：
- [ ] Modal 整合（sdd.os 執行環境）
- [ ] Supabase Storage 版本管理
- [x] Vercel Deployments API 整合（`deployProjectFromDb` 橋接真正的 Vercel/Supabase API）
- [x] Domain Manager Skill（獨立於部署的網域管理）
- [ ] 完整測試覆蓋
- [x] Porkbun API 串接（網域購買功能待付款整合）
- [x] BDD Spec 整合真正 LLM（Claude API）

## 系統架構

### 整體架構：Inngest 是大腦，Modal 是手腳

```
┌─────────────────────────────────────────────────────────────┐
│              用戶請求（tellcraft.com / Vercel）              │
└─────────────────────────┬───────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Inngest（大腦）                           │
│  - 接收用戶請求                                              │
│  - 任務排隊 + 優先級                                         │
│  - 狀態追蹤                                                  │
│  - 等待用戶確認（waitForEvent）                              │
│  - 錯誤重試                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Intent    │→ │   Skill     │→ │  Workflow   │         │
│  │ Classifier  │  │  Registry   │  │  Executor   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────┬───────────────────────────────────┘
                          ↓ 觸發
┌─────────────────────────────────────────────────────────────┐
│                    Modal（手腳）                             │
│  - 執行 sdd.os（規格驅動開發）                               │
│  - TDD 迭代循環（測試 → 實作 → 測試）                        │
│  - 生成程式碼                                                │
│  - 長時間運行（最多 30 分鐘）                                │
└─────────────────────────┬───────────────────────────────────┘
                          ↓ 完成後回報
┌─────────────────────────────────────────────────────────────┐
│                 Inngest（繼續編排）                          │
│  - 存到 Supabase Storage                                    │
│  - 呼叫 Vercel Deployments API 部署                         │
│  - 通知用戶完成                                              │
└─────────────────────────┬───────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   Server Actions（18 個）                    │
│  createProject · sendMessage · generateCode · deployProject │
│  updateProject · cancelSubscription · exportData · ...      │
│  initializeSession · sendMessageAndTrigger · replyToConv... │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                        外部服務                              │
│       Vercel · Supabase · Cloudflare · Modal · sdd.os       │
└─────────────────────────────────────────────────────────────┘
```

### 為什麼這樣分工？

| 元件 | 職責 | 原因 |
|------|------|------|
| **Inngest** | 任務編排、狀態追蹤、等待事件 | 免費額度 25,000 runs/月，擅長編排 |
| **Modal** | 執行 sdd.os、TDD 迭代 | 按秒計費，支援長時間運行 |
| **Vercel** | 前端 + API + 用戶專案部署 | Serverless，自動擴展 |
| **Supabase** | 資料庫 + Storage | 統一存儲，便宜 |

### 並發處理策略

當 100 個用戶同時開發時：

```typescript
// Inngest 自動排隊 + 並發控制
inngest.createFunction(
  {
    id: 'handle-user-request',
    concurrency: {
      limit: 50,  // 同時最多處理 50 個請求
    },
  },
  // ...
)
```

- **Inngest**：自動排隊、優先級調度（付費用戶優先）
- **Modal**：按需啟動 Worker，閒置不花錢
- **LLM API**：多 Key 輪換分散 rate limit

### 多租戶架構（Multi-Tenant SaaS）

每個用戶的專案都有獨立的 Supabase + Vercel，但都在 Tellcraft 組織下：

```
Tellcraft 組織
│
├── 主 Supabase（tellcraft 平台本身）
│   ├── users, projects, conversations...（平台資料）
│   └── generations bucket（暫存生成的程式碼，50MB 限制）
│
├── 用戶 A 的 Supabase Project（動態建立）
│   └── 用戶 A 的業務資料（訂單、用戶、產品...）
├── 用戶 B 的 Supabase Project
│   └── 用戶 B 的業務資料
└── ...

Tellcraft Vercel Team
├── tellcraft.com（平台本身）
├── 用戶 A 的 Vercel Project（動態建立）
│   └── 綁定用戶 A 的 Supabase
├── 用戶 B 的 Vercel Project
│   └── 綁定用戶 B 的 Supabase
└── ...
```

### 程式碼生成與部署流程

```
UIUX Skill 生成程式碼
      ↓
暫存到 generations bucket（主 Supabase Storage）
路徑：/{projectId}/{generationId}/code-package.json
      ↓
部署時：
  1. 用 Supabase Management API 建立用戶專屬 Project（如果還沒有）
  2. 用 Vercel API 建立用戶專屬 Project（如果還沒有）
  3. 從 generations 拉程式碼 → Vercel Deployments API 部署
  4. 設定環境變數（用戶 Supabase URL + Key）
      ↓
完成後：generations 暫存檔可保留 7 天後清理
```

### 為什麼用 Supabase Storage 而非 Git

| 面向 | Git | Supabase Storage |
|------|-----|------------------|
| 管理 100 用戶 | ❌ 100 個 repo 很亂 | ✅ 一個 bucket + 路徑分離 |
| Rate Limit | ❌ GitHub API 有限制 | ✅ 無限制 |
| 費用 | ❌ Private repo 要錢 | ✅ 便宜 |
| 版本控制 | ✅ 原生支援 | ⚠️ 用 generationId 追蹤 |

### 部署方式：Vercel Deployments API

不需要 Git，直接用 API 部署：

```typescript
const response = await fetch('https://api.vercel.com/v13/deployments', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
  },
  body: JSON.stringify({
    name: 'user-project-123',
    files: [
      { file: 'pages/index.tsx', data: btoa(generatedCode) },
      { file: 'package.json', data: btoa(packageJson) },
    ],
    projectSettings: { framework: 'nextjs' },
  }),
})
```

## Inngest 配置

### 部署設定

| 項目 | 值 |
|------|-----|
| 平台 | Vercel |
| Endpoint | `https://tellcraft.com/api/inngest` |
| App ID | `tellcraft` |
| Integration | Vercel Integration（自動注入環境變數）|

### 環境變數（Vercel）

```bash
INNGEST_EVENT_KEY=xxx      # 從 Inngest Dashboard 取得
INNGEST_SIGNING_KEY=xxx    # 從 Inngest Dashboard 取得
```

### Vercel Integration 設定

1. 啟用 Inngest Vercel Integration
2. 設定 Custom Production Domain：`tellcraft.com`
3. 關閉 Vercel Deployment Protection（否則 Inngest 無法同步）

### 驗證 Inngest 連線

```bash
curl https://tellcraft.com/api/inngest
# 應返回：
# {
#   "has_event_key": true,
#   "has_signing_key": true,
#   "function_count": 1
# }
```

## 舊架構（參考）

```
┌─────────────────────────────────────────────────────────────┐
│                    Inngest Orchestrator                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Intent    │→ │   Skill     │→ │  Workflow   │         │
│  │ Classifier  │  │  Registry   │  │  Executor   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 執行流程

```
用戶：「幫我建一個訂單管理系統」
  ↓
┌─────────────────────────────────────────┐
│ Inngest: Intent Classification          │
│ → 識別為 bdd-spec Skill                 │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Inngest: 多輪對話釐清需求               │
│ → waitForEvent（最長 24 小時）          │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Inngest: 規格確認                       │
│ → 生成 BDD Feature Files + Schema       │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Modal: 執行 sdd.os                      │
│ → TDD 迭代（測試 → 實作 → 測試）        │
│ → 自癒機制，最多 3 次                   │
│ → 完成後回報 Inngest                    │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ Inngest: 存儲 + 部署                    │
│ → 存到 Supabase Storage                 │
│ → Vercel Deployments API 部署           │
│ → 通知用戶                              │
└─────────────────────────────────────────┘
  ↓
用戶收到：https://user-project.vercel.app
```

## 快速開始

```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev

# 另開終端，啟動 Inngest Dev Server
npx inngest-cli@latest dev
```

- 應用：http://localhost:3000
- Inngest Dashboard：http://localhost:8288
- 測試頁面：http://localhost:3000/test

## 專案結構

```
app/
├── actions/           # Server Actions（API 封裝）
│   ├── index.ts       # 核心 + Chat + Auth Actions
│   └── admin.ts       # 管理員 Actions
├── inngest/           # Orchestrator（任務編排）
├── lib/
│   └── supabase/      # Supabase clients（client.ts, server.ts）
├── components/        # UI 元件
│   ├── dashboard/     # 儀表板元件
│   │   ├── Sidebar.tsx
│   │   ├── StatsCard.tsx
│   │   ├── DataTable.tsx
│   │   ├── Chart.tsx
│   │   └── DateRangePicker.tsx
│   ├── ConversationPicker.tsx  # 歷史對話選擇器
│   ├── LoginPrompt.tsx         # 登入提示
│   └── ...                     # 其他動效元件
├── dashboard/         # 儀表板頁面
│   ├── layout.tsx     # 共用版面（側邊欄）
│   ├── page.tsx       # 用戶首頁
│   ├── projects/      # 專案管理
│   ├── conversations/ # 對話列表
│   └── admin/         # 管理員頁面
│       ├── page.tsx   # 管理員總覽
│       ├── users/     # 用戶管理
│       ├── usage/     # LLM 用量
│       └── logs/      # 審計日誌
├── auth/
│   ├── login/         # 登入頁面
│   ├── callback/      # OAuth callback
│   └── post-login/    # 登入後帳號合併處理
├── api/
│   ├── auth/line/     # LINE OAuth 路由
│   ├── inngest/       # Inngest webhook endpoint
│   └── session/       # Session Cookie 備份
└── test/              # 測試頁面

middleware.ts     # Session refresh + 路由保護 + 管理員權限

spec/
├── data/              # Schema + Entity Mapping
├── features/          # BDD Feature Files (14)
└── actions/           # Actions 定義

bdd-spec/              # BDD Skill 定義
├── skill.md           # Skill 元數據
├── instructions/      # 5 階段執行指南
├── rules/             # 格式規範
└── scripts/           # 驗證腳本

uiux-skill/            # UI/UX Skill 定義
├── skill.md           # Skill 元數據
├── instructions/      # 4 階段執行指南
│   ├── 01-design-discovery.md
│   ├── 02-design-lab.md
│   ├── 03-implementation.md
│   └── 04-quality-gate.md
├── rules/             # UI 規範
│   └── baseline-ui.md
└── resources/         # 模板和範例

prompts/               # BDD Skill（Claude Code 用）
```

## 相關文件

- [釐清狀態](.clarify/overview.md)
- [BDD Skill](prompts/skill.md)
- [格式規範](prompts/rules/formulation-rules.md)
