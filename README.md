# Tellcraft

> **用對話打造你的軟體產品** | [tellcraft.com](https://tellcraft.com)

Tellcraft 是一個 AI 驅動的自動化開發平台。用戶只需描述需求，AI 會自動釐清細節、生成程式碼、部署上線。

## 核心理念

```
描述需求 → AI 釐清 → 確認規格 → 自動生成 → 一鍵部署
```

## 當前開發進度

- **狀態**：✅ Phase 1-5 + Server Actions + Inngest Orchestrator + 前端 Chat 串接 + 認證系統完成
- **釐清項目**：28 項全部解決
- **Server Actions**：22/22 已實作並通過測試
- **詳情**：[`.clarify/overview.md`](.clarify/overview.md)

### 認證系統

支援 Google 和 LINE OAuth 登入，使用 `@supabase/ssr` 實現 SSR 友善的 session 管理：

```
登入頁 → Google/LINE OAuth → Supabase Auth → Session Cookie → 受保護路由
```

**架構**：
- `app/lib/supabase/client.ts` - Browser client（前端）
- `app/lib/supabase/server.ts` - Server client（Server Actions）
- `middleware.ts` - Session refresh + 路由保護
- `app/auth/login/page.tsx` - 登入頁面（卡片式設計）
- `app/auth/callback/route.ts` - OAuth callback（PKCE）
- `app/api/auth/line/` - LINE OAuth 自訂流程

**新增 Server Actions**：
- `initializeSessionFromAuth` - 從認證 session 初始化（已登入用戶）
- `getCurrentUser` - 取得當前認證用戶
- `signOut` - 登出

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

**Chat 相關 Server Actions**：
- `initializeSession` - 創建或獲取匿名用戶的會話（訪客模式）
- `initializeSessionFromAuth` - 從認證 session 初始化（已登入用戶）
- `sendMessageAndTrigger` - 發送消息並觸發 Inngest
- `replyToConversation` - 多輪對話時用戶回覆
- `getConversationMessages` - 獲取對話消息（用於輪詢）
- `getCurrentUser` - 取得當前認證用戶
- `signOut` - 登出

## 技術棧

| 服務 | 用途 | 狀態 |
|------|------|------|
| Next.js 15 | Server Actions | ✅ |
| React 19 | UI 框架 | ✅ |
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
| `bdd-spec` | ✅ 完成 | 整合真正 LLM（Claude API）進行需求釐清與規格產出 |
| `coder` | ⏳ Mock | 呼叫 generateCode，待 Modal + sdd.os 整合 |
| `deployer` | ✅ 完成 | 整合 Vercel Deployments API，部署後自動詢問網域設定 |
| `domain-manager` | ✅ 完成 | 網域管理入口，支援三種選擇 |
| `domain-purchase` | ✅ 完成 | Porkbun 網域註冊 |
| `domain-dns` | ✅ 完成 | Cloudflare Zone + Vercel 綁定 |

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
      limit: 10,  // 同時最多處理 10 個請求
    },
  },
  // ...
)
```

- **Inngest**：自動排隊、優先級調度（付費用戶優先）
- **Modal**：按需啟動 Worker，閒置不花錢
- **LLM API**：多 Key 輪換分散 rate limit

### 程式碼存儲：Supabase Storage

選擇 Supabase Storage 而非 Git 的原因：

| 面向 | Git | Supabase Storage |
|------|-----|------------------|
| 管理 100 用戶 | ❌ 100 個 repo 很亂 | ✅ 一個 bucket 搞定 |
| Rate Limit | ❌ GitHub API 有限制 | ✅ 無限制 |
| 費用 | ❌ Private repo 要錢 | ✅ 便宜 |
| 版本控制 | ✅ 原生支援 | ⚠️ 自建版本管理 |

```
/storage/projects/{projectId}/
  ├── v1/
  │   ├── src/
  │   ├── package.json
  │   └── ...
  ├── v2/
  └── current -> v2  (最新版本)
```

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
├── inngest/           # Orchestrator（任務編排）
├── lib/
│   └── supabase/      # Supabase clients（client.ts, server.ts）
├── auth/
│   ├── login/         # 登入頁面
│   └── callback/      # OAuth callback
├── api/auth/line/     # LINE OAuth 路由
└── test/              # 測試頁面

middleware.ts          # Session refresh + 路由保護

spec/
├── data/              # Schema + Entity Mapping
├── features/          # BDD Feature Files (14)
└── actions/           # Actions 定義

prompts/               # BDD Skill（Claude Code 用）
```

## 相關文件

- [釐清狀態](.clarify/overview.md)
- [BDD Skill](prompts/skill.md)
- [格式規範](prompts/rules/formulation-rules.md)
