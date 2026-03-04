# Tellcraft

> **用對話打造你的軟體產品** | [tellcraft.com](https://tellcraft.com)

Tellcraft 是一個 AI 驅動的自動化開發平台。用戶只需描述需求，AI 會自動釐清細節、生成程式碼、部署上線。

```
描述需求 → AI 釐清 → 確認規格 → 自動生成 → 一鍵部署
```

## 技術棧

| 層級 | 技術 | 說明 |
|------|------|------|
| **前端** | Next.js 16 + React 19 | Vercel 部署，Turbopack |
| **後端** | Express + BullMQ + Socket.io | VPS 部署，PM2 管理 |
| **資料庫** | PostgreSQL（VPS 本地） | 低延遲，自主控制 |
| **佇列/狀態** | Redis | BullMQ 任務佇列 + 串流狀態 |
| **LLM** | Claude Sonnet / Haiku | Anthropic SDK |
| **動畫** | motion/react + Remotion | 需求藍圖面板 + 串流動畫 |
| **i18n** | next-intl v4 | 中/英雙語，`[locale]` 路由 |
| **樣式** | Tailwind CSS v4 | `@import "tailwindcss"` 語法 |
| **預覽** | Sandpack（@codesandbox） | 瀏覽器內真實 React 渲染 |
| **部署** | Vercel API | 代碼 → Next.js → Vercel 自動部署 |
| **CI/CD** | GitHub Actions | push main → VPS 自動部署 |

## 快速開始

```bash
# 前端（Vercel 上的 Next.js）
pnpm install
pnpm dev                  # http://localhost:3000

# 後端（VPS Express）
cd tellcraft-backend
pnpm install && pnpm dev  # http://localhost:3100

# 型別檢查
pnpm typecheck            # 前端
cd tellcraft-backend && pnpm typecheck  # 後端

# BDD 規格驗證
npx ts-node bdd-spec/scripts/lint-gherkin-format.ts spec/features/
npx ts-node bdd-spec/scripts/validate-feature.ts spec/features/
```

### 環境變數

**前端**（`.env.local`）：
`VPS_API_URL` `NEXT_PUBLIC_VPS_API_URL` `NEXT_PUBLIC_VPS_WS_URL` `NEXT_PUBLIC_SUPABASE_URL` `NEXT_PUBLIC_SUPABASE_ANON_KEY` `NEXT_PUBLIC_LIFF_ID`

**後端**（`tellcraft-backend/.env`）：
`DATABASE_URL` `REDIS_URL` `JWT_SECRET` `ANTHROPIC_API_KEY` `GOOGLE_CLIENT_ID` `GOOGLE_CLIENT_SECRET` `LINE_CHANNEL_ID` `LINE_CHANNEL_SECRET` `LINE_BOT_CHANNEL_SECRET` `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` `LIFF_ID` `UPLOAD_DIR` `UPLOAD_BASE_URL`

## 系統架構

```
┌─────────────────┐         ┌─────────────────────────────────────┐
│  Vercel (前端)   │────────>│  VPS Backend                        │
│  Next.js 16     │  HTTP   │  ├─ Express API (Port 3100)         │
│  tellcraft.com  │  WS     │  ├─ BullMQ Worker（任務編排）        │
└─────────────────┘         │  ├─ Socket.io（即時通訊）            │
                            │  ├─ PostgreSQL（資料庫）             │
                            │  └─ Redis（隊列 + 狀態）             │
                            └─────────────────────────────────────┘
```

- 前端**不直連資料庫**：`Server Actions → vps-api.ts → VPS Express → PostgreSQL`
- **為什麼用 VPS**：Vercel Serverless 超時 10-60s，無法處理長時間 LLM 任務
- 前端路徑別名 `@/*` 映射到 `./*`，後端無路徑別名
- 前後端 TypeScript 完全隔離（tsconfig 互相 exclude）

> 詳細架構文檔見 [CLAUDE.md](./CLAUDE.md)（核心模組、Phase 狀態機、Pipeline 流程、API 路由、防雷清單）

## Skill 系統

| Skill | 用途 | LLM | 狀態 |
|-------|------|-----|------|
| `bdd-spec` | 需求釐清 + BDD 規格產出（ES → Discovery → Formulation → Actions → ISA） | Sonnet | 完成 |
| `uiux` | 前端介面設計（Design Discovery → Design Lab → Implementation） | Sonnet | 完成 |
| `fast-build` | 一句話快速建站，跳過 BDD/Discovery，5 分鐘出結果 | Sonnet ×3 | 完成 |
| `quality-gate` | UIUX RWD 完成後自動觸發，靜態檢查 + LLM 自動修復 | Haiku | 完成 |
| `deployer` | 代碼 → sanitize → 本地 build 驗證 → Vercel 部署 → 回滾 | Haiku（修復） | 完成 |
| `iteration` | 迭代修改 + 撤銷上一步 + 版本回滾 | Sonnet | 完成 |
| `coder` | 後端代碼生成 | — | **未實作**，Registry 有定義 |
| `domain-manager` | 網域管理 | — | **前端獨立**，`app/actions/domain.ts` 未接入 Orchestrator |
| `domain-purchase` | 網域購買（Porkbun） | — | **前端獨立**，`app/actions/porkbun.ts` |
| `domain-dns` | DNS 管理（Cloudflare） | — | **前端獨立**，`app/actions/cloudflare.ts` |

### 內部服務層

| Service | LLM | 調用者 | 職責 |
|---------|-----|--------|------|
| `classifier.ts` | Haiku | 每條新訊息 | 意圖分類（規則式 + LLM） |
| `prefilter.ts` | 無 / Haiku | 每條訊息（最先）+ Fast Mode | 空訊息/長度/Injection(28 regex)/品質閘門(亂碼+髒話+垃圾)/Rate Limit + `checkBuildRelevance()` 語義相關性 |
| `bdd-to-ui-spec.ts` | Haiku | UIUX Pipeline | BDD Feature Files → UIRequirementsSpec |
| `prd-discovery.ts` | Sonnet | bdd-spec | PRD 需求發掘（多輪） |
| `clarify-dedup.ts` | Haiku ×2 | bdd-spec | Decision Summary + 語意去重 |
| `spec-discovery.ts` | Sonnet | bdd-spec | 規格品質檢查（S1-S6） |
| `formulation.ts` | Sonnet ×5 | bdd-spec | Schema + Features + EntityMapping + Actions + ISA |
| `event-storming.ts` | Haiku | bdd-spec | Event Storming DFS 探索 |
| `fast-build-generation.ts` | 無 | fast-build | 規則式 tier/產品/DesignSystem（零 LLM） |
| `template-matcher.ts` | 無 | orchestrator | 三層評分匹配（零 LLM） |
| `line-notify.ts` | 無 | orchestrator-utils | LINE 推播通知（stage 白名單過濾） |

### 兩種模式

**精細模式（Fine）**：BDD 完成 → 模板匹配 → Discovery → Brief 確認 → 5 變體 → Structure → Animation → RWD → QG

**快速模式（Fast）**：一句話描述 → 規則式推斷（tier/產品類型/配色/佈局） → Structure → Animation → RWD → 靜態 QG

## BDD Spec 流程

```
Phase 0: Event Storming（可選，複雜需求自動啟動）
    ↓ DFS 探索 → Commands/ReadModels/Actors/Aggregates/Rules

Phase 1: PRD Discovery + Clarify（多輪動態釐清）
    ↓ 檢查清單掃描：A1-A6（領域模型）、B1-B5（功能模型）、C1-C2（術語一致）、D1-D2（品質）
    ↓ 每輪最多 5 題，每 5 題批量確認（支援反悔），動態上限 3-10 輪 / 15-50 題
    ↓ 三層去重：L1 Bug Fix + L2 Decision Summary(Haiku) + L3 Post-gen Dedup(Haiku)

Phase 2: Formulation（需求驅動 + 智能分組）
    ↓ 同一實體 CRUD 合併為 1 個 Feature，狀態轉換/跨實體保持獨立
    ↓ 產出 schema.sql + entity_to_table_mapping.yml + feature files
    ↓ Checkpoint 每 3 個 feature 保存，中斷後可恢復（15 分鐘超時偵測）
    ↓ 驗證腳本（lint + validate）+ 自癒修復（最多 3 次）

Phase 3: Spec Discovery + Clarify
    ↓ S1-S6 品質審查（規則完整性/Example 覆蓋/邊界條件/格式/跨 Feature 一致/Schema 對應）
    ↓ 最多 2 輪 / 10 題，超額時按嚴重度截斷（不跳過）

Phase 4: Actions Design → actions.yml（Sonnet LLM）
Phase 5: ISA Config → isa_codegen.yml（100% 規則式，零 LLM）
Phase 6: Change Management（需求變更 → 影響分析 → 執行修改 → 一致性驗證）
```

**bdd_sessions 核心欄位**：
```
current_phase    -- prd_discovery / prd_clarify / formulation / spec_discovery / spec_clarify / actions_design / isa_config / completed
current_round    -- 當前輪次
clarify_items    -- JSONB，待處理 [{ id, question, whiteTextQuestion, category, priority, status, mode, proposedAnswer, technicalContext?, whiteTextOptions? }]
staging_items    -- JSONB，暫存區（待確認）
resolved_items   -- JSONB，已解決
schema_sql_content / entity_mapping_content / features_content / actions_yml_content / isa_config_content
es_document_content  -- Event Storming 知識地圖
change_history   -- JSONB，變更歷史追蹤
```

**ClarifyItem.technicalContext 結構**（JSONB 自動序列化，無需 DB migration）：
```
technicalContext: {
  entities: [{ name, tableName?, fields: [{ name, label, type?, constraints? }] }]
  relationships?: [{ from, to, type: '1:1'|'1:N'|'N:M', foreignKey?, description }]
  computations?: [{ target, formula, description }]
  stateTransitions?: [{ entity, field, from, to, trigger, description }]
  constraints?: [{ expression, description, scope: 'single_field'|'cross_field'|'cross_entity' }]
  impactedFeatures?: string[]
}
whiteTextOptions: string[]  -- 白話選項（展示用，與 options 並存）
```

## 認證系統

### OAuth 流程（以 Google 為例）

```
1. 用戶點擊「Google 登入」
2. → Vercel /api/auth/google（proxy）
3. → VPS /auth/google（設定 callbackHost）
4. → Google OAuth 授權頁
5. → Vercel /api/auth/google/callback（接收 code）
6. → VPS /auth/google/exchange（用 code 換 JWT）
7. → Vercel /auth/callback（存 token）
8. → 首頁（useAuth hook 驗證）
```

**為什麼用 Vercel Proxy**：Google OAuth 不允許 IP callback URI + HTTPS→HTTP Mixed Content 被瀏覽器阻擋。

### JWT 雙軌機制

| 儲存位置 | 用途 | 讀取者 |
|----------|------|--------|
| `localStorage` (`auth_token`) | 客戶端認證 | `useAuth()` hook |
| `Cookie` (`auth_token`, httpOnly) | 伺服器端認證 | Middleware + Server Components |

- 登入時**同時**設置 localStorage 和 Cookie
- `/api/auth/me` 偵測 DB 與 JWT 的 admin 狀態差異 → 自動返回刷新的 token
- 訪客→登入帳號合併：`/auth/post-login` → `migrateAnonymousAccount` → 專案/對話遷移

### 帳號綁定（雙登入系統）

用戶可同時綁定 Google 和 LINE 帳號，之後用任一方式都能登入同一帳戶。

**資料模型**：`user_providers` 表（`user_id` + `provider` + `provider_id`），`UNIQUE(provider, provider_id)` + `UNIQUE(user_id, provider)`

**綁定流程**：
```
Dashboard 帳號設定 → /api/auth/link/google（從 cookie 讀 JWT → 提取 userId）
  → VPS /auth/google?linkUserId=XXX（放入 HMAC 簽名的 state）
  → Google OAuth → Vercel callback → VPS exchange
  → 檢查 linkUserId → INSERT user_providers → redirect /dashboard/account?linked=google
```

**API 端點**：
| 端點 | 用途 |
|------|------|
| `GET /auth/providers` | 查詢已綁定的 providers |
| `POST /auth/preferences` | 更新語言偏好（`{ preferredLanguage: 'zh'|'en' }`） |
| `POST /auth/unlink/:provider` | 解除綁定（至少保留一個） |
| `GET /api/auth/link/google` | 前端 → 觸發 Google 綁定 OAuth |
| `GET /api/auth/link/line` | 前端 → 觸發 LINE 綁定 OAuth |

**Edge Cases**：OAuth 帳號已綁定其他用戶 → 409；解綁最後一個 → 400；LINE 綁 Google → email 升級

### OAuth Console 設定

**Google Cloud Console**：APIs & Services → Credentials → OAuth 2.0 → Redirect URI：`https://tellcraft.com/api/auth/google/callback`

**LINE Developers Console**：Channel → LINE Login Settings → Callback URL：`https://tellcraft.com/api/auth/line/callback`

**LINE Messaging API（Bot）設定**：
1. LINE Developers Console → 進入 **Messaging API Channel**
2. Webhook settings → Webhook URL：`https://tellcraft.com/api/line-webhook`
3. 啟用 **Use webhook**，關閉 **Auto-reply messages**
4. 複製 **Channel secret** → 填入後端 `LINE_BOT_CHANNEL_SECRET`
5. `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` 複用現有（同 Channel）

**LINE LIFF 設定**（LINE Login Channel → LIFF）：
1. Add LIFF App → Name: `Tellcraft`, Size: **Full**, Endpoint URL: `https://tellcraft.com/liff`
2. Scope: 勾選 `openid`、`profile`，Bot link feature: **On (Aggressive)**
3. 複製 LIFF ID（格式 `2006xxxxxx-xxxxxxxx`），填入前端 `NEXT_PUBLIC_LIFF_ID` + 後端 `LIFF_ID`

### 儀表板路由

```
/dashboard                          # 用戶首頁（統計/專案/對話）
/dashboard/projects                 # 我的專案
/dashboard/projects/[id]            # 專案詳情（對話歷史/部署記錄/版本）
/dashboard/conversations            # 我的對話
/dashboard/account                  # 帳號設定（綁定/解綁 OAuth）
/dashboard/admin                    # 管理員總覽（需 is_admin）
/dashboard/admin/users              # 用戶管理
/dashboard/admin/users/[id]         # 用戶詳情
/dashboard/admin/usage              # LLM 用量統計
/dashboard/admin/conversations/[id] # 對話檢視器（唯讀）
```

權限：Middleware 攔截未登入 `/dashboard` + 非管理員 `/dashboard/admin`，Server Actions `requireAdmin()` 二次驗證。

## 國際化（i18n）

### 架構

基於 `next-intl` v4，`localePrefix: 'as-needed'`，`localeDetection: true`。

**語言偵測優先順序**（middleware）：
1. URL locale prefix（最高，顯式導航）
2. `NEXT_LOCALE` cookie（持久化的手動選擇，1 年有效期）
3. `Accept-Language` header（瀏覽器語言自動偵測）
4. `defaultLocale: 'en'`（兜底）

**語言持久化**：
- 手動切換語言 → 設 `NEXT_LOCALE` cookie + 登入用戶 fire-and-forget 同步 DB（`users.preferred_language`）
- 登入後 → 從 DB 恢復語言偏好 → 設 cookie → 跳轉正確 locale 路徑
- Account 頁面可明確設定語言偏好（跨裝置同步）

```
URL 結構：
  / → en（預設，無前綴）
  /zh → 中文
  /dashboard → en
  /zh/dashboard → 中文
```

### 翻譯檔案

`messages/zh.json` 和 `messages/en.json`，883 keys，29 namespaces：

| Namespace | 範圍 | Keys |
|-----------|------|------|
| `hero`, `chat`, `preview`, `stage` | 主頁面 | ~86 |
| `comparison`, `showcase`, `faq`, `testimonial`, `cta`, `footer` | Landing 區塊 | ~93 |
| `dashboard` (含 `admin`, `usage`, `templates`, `account`) | 儀表板 | ~187 |
| `auth`, `login`, `liff` | 認證 | ~61 |
| `nav`, `common`, `errors` | 共用 | ~35 |
| `cssLabel`, `codePreview`, `command` | 編輯器 | ~41 |
| `uiux`, `deploy`, `conversationPicker` | 功能元件 | ~各 4-110 |
| `actionErrors` | Server Action 錯誤訊息 | 69 |
| `test` | 開發測試工具頁面 | 48 |

### 使用方式

```tsx
// Client Component
import { useTranslations } from 'next-intl'
const t = useTranslations('chat')
return <p>{t('sendButton')}</p>

// 帶參數
t('messageUsageDetail', { used: 10, limit: 100 })  // "10 / 100 則"

// locale-aware 導航
import { Link, useRouter } from '@/i18n/navigation'  // 自動加 locale 前綴
import { useLocalePath } from '@/app/hooks/useLocalePath'
window.location.href = localePath('/dashboard')       // 硬跳轉時用
```

### Phase 2 完成（Error/Utility i18n）

Server Action 錯誤訊息 + 工具模組中文字串國際化（+117 keys，2 namespaces）：

- **Server Actions**（9 檔）：`getTranslations('actionErrors')` from `next-intl/server`，~50 個中文字串 → `t()` 呼叫
- **後端 error code**：`'無管理員權限'` → `'ADMIN_REQUIRED'`，5 個 admin 頁面同步
- **lib 模組**：`vps-api.ts`（8 字串）+ `llm.ts`（9 字串）改英文（技術診斷性質）
- **test 頁面**：`useTranslations('test')`，48 個字串

### Phase 3 待辦

- VPS 後端返回的中文錯誤訊息 → error code 機制
- LLM prompts / Skill instructions i18n
- Remotion 動畫標籤（需通過 props 傳入 locale）

## BullMQ 任務模式

| 功能 | 實現方式 |
|------|----------|
| 執行步驟 | 直接 `await fn()` |
| 等待用戶回覆 | 保存 FlowState 到 Redis → Job 結束 → 用戶回覆時建新 Job → `handleContinueFlow` 恢復 |
| 任務觸發 | `queue.add('process-message', { conversationId, message, ... })` |
| 自動重試 | `attempts: 3` 配置 |
| 對話互斥 | `conversation-lock.ts` Redis `SET NX EX`（TTL 300s），同一對話同時只有 1 個 Job |

## 已完成功能

| 分類 | 功能 |
|------|------|
| **BDD 規格** | 5 階段釐清、Event Storming、提案模式、草稿批量、變更管理、規格回滾、Scenario Outline、OpenAPI 產出 |
| **UIUX 設計** | 雙軌 Discovery、Design Tier、5 變體、三階段生成、串流即時預覽、BDD→UI 翻譯、Variant 概念注入 |
| **快速建站** | 26 種產品類型、22 套產業配色、App/Website 佈局模式、模板風格整合、智能模板匹配 |
| **品質** | Quality Gate 靜態檢查、LLM 自動修復、RWD 響應式安全網、Tailwind v4→v3 轉換 |
| **部署** | sanitize 6 類預檢、本地 build 驗證（3 輪 LLM 修復）、Vercel 部署、版本回滾 |
| **迭代** | 對話內迭代修改、撤銷上一步、部署歷史回滾、迭代歷史追蹤 |
| **預覽** | Sandpack 真實 React 渲染、串流增量更新、裝置切換、編輯模式、圖片上傳 |
| **動畫** | BDD 需求藍圖面板（即時 Q&A 歷史視覺化）、3D 工廠流水線（Fast Build）、Remotion 驅動 |
| **認證** | Google/LINE OAuth、JWT 雙軌（localStorage + Cookie）、訪客→帳號合併、帳號綁定（雙登入）、auth 頁面 i18n（next-intl） |
| **儀表板** | 用戶統計、專案管理、版本歷史、管理員面板、LLM 用量追蹤、Dashboard 元件 i18n（next-intl） |
| **i18n** | next-intl 多語系（zh/en）、UI 元件全量翻譯、Server Action 錯誤訊息 i18n（getTranslations）、lib 模組英文化、error code 機制、883 keys / 29 namespaces |
| **防護** | 三層防刷（前端冷卻 + API 限速 + Worker 鎖）、七層輸入防禦（含 Universal Input Quality Gate 亂碼/髒話/垃圾規則式攔截）+ 違規冷卻升級（3→60s / 6→5min / 10→30min）、LLM 自動重試、Guest 限制（Fast Only + 一次使用 + 登入推薦） |
| **通知** | LINE 推播通知（BDD 完成/UIUX 生成完成/部署成功失敗），離線用戶也能收到 |
| **LINE Bot** | LINE 對話內完整 Fast Build 體驗（描述需求→生成→部署），Flex Message 卡片 + Quick Reply |
| **UX** | 對話回退、錯誤恢復、自動恢復對話、專案自動命名、Markdown 渲染、專案對話快捷入口（1-click） |
| **穩定性** | FlowState 超時自動恢復（定時掃描 + LINE/Web 推送通知），伺服器重啟後自動恢復卡住的生成/部署任務 |

## 專案結構

```
app/
├── [locale]/             # i18n 路由群組（zh 預設 / en）
│   ├── page.tsx          # 主頁面（對話 UI + 狀態管理，~4600 行）
│   ├── layout.tsx        # NextIntlClientProvider 注入
│   ├── dashboard/        # 儀表板頁面（/dashboard, /dashboard/admin）
│   ├── auth/             # 認證（login/callback/post-login）
│   ├── liff/             # LINE LIFF 入口
│   └── test/             # 開發測試工具
├── actions/              # Server Actions
│   ├── index.ts          # 核心 Actions（對話/訊息/專案/BDD）
│   └── admin.ts          # 管理員 Actions
├── lib/
│   ├── vps-api.ts        # VPS HTTP 客戶端（~1900 行）
│   ├── llm.ts            # LLM 封裝（~2200 行）
│   └── sandpack-utils.ts # Sandpack 預覽工具
├── hooks/
│   ├── useAuth.ts        # JWT 認證
│   ├── useLocalePath.ts  # locale-aware window.location.href
│   └── useVpsWebSocket.ts # WebSocket
├── components/
│   ├── uiux/             # UIUX 元件（SandpackPreview/PreviewPanel/TemplatePicker）
│   ├── dashboard/        # 儀表板元件
│   ├── remotion/         # Remotion 動畫（fast-build/ + building-scene/）
│   ├── building-scene/   # 3D 場景入口（dynamic import）
│   ├── LocaleSwitcher.tsx # 語言切換器（中/EN）
│   ├── BddAnimationPanel.tsx  # BDD 需求藍圖面板
│   └── FastBuildPlayer.tsx # 3D 工廠 Player
├── api/
│   ├── vps/[...path]/    # VPS Proxy（轉發到後端）
│   └── auth/             # OAuth 路由
│
├── i18n/                 # next-intl 基礎設施
│   ├── routing.ts        # locales: ['zh', 'en'], defaultLocale: 'zh'
│   ├── navigation.ts     # locale-aware Link/redirect/useRouter
│   └── request.ts        # getRequestConfig（Server Component 用）
└── messages/
    ├── zh.json           # 中文翻譯（883 keys，29 namespaces）
    └── en.json           # 英文翻譯（883 keys，同步）

tellcraft-backend/
├── src/
│   ├── index.ts          # Express + Socket.io + BullMQ 入口
│   ├── workers/
│   │   ├── orchestrator.ts       # 核心流程引擎（~3900 行）
│   │   └── orchestrator-utils.ts # 共用函數（sendMessage/FlowState 等）
│   ├── types/
│   │   └── flow-state.ts         # FlowState 介面（避免循環 import）
│   ├── services/
│   │   ├── uiux-generation.ts    # 設計生成核心
│   │   ├── quality-gate.ts       # 品質檢查 + 自動修復
│   │   ├── deployer.ts           # 部署流程
│   │   ├── iteration-skill.ts    # 迭代 + 撤銷 + 回滾
│   │   ├── fast-build-generation.ts # 快速模式（規則式，零 LLM）
│   │   ├── template-matcher.ts   # 智能模板匹配（零 LLM）
│   │   ├── line-notify.ts        # LINE 推播通知（Web 用戶，stage 白名單）
│   │   ├── line-full-push.ts    # LINE Bot 全量翻譯推送（LINE 來源的對話）
│   │   ├── line-bot-handler.ts  # LINE Bot 業務邏輯（Follow/Text/Postback）
│   │   ├── line-message-translator.ts # sendMessage → LINE Messages 翻譯
│   │   ├── classifier.ts         # 三層分類防禦
│   │   ├── bdd-to-ui-spec.ts     # BDD→UI 翻譯
│   │   ├── event-storming.ts     # Event Storming
│   │   ├── change-management.ts  # 需求變更管理
│   │   └── conversation-lock.ts  # 對話互斥鎖
│   ├── utils/
│   │   ├── safe-parse-json.ts   # LLM JSON 安全解析（四層防禦，全後端共用）
│   │   └── is-confirmation.ts   # 確認語意偵測（三層：否定詞排除 → 短詞精確 → 長片語 includes）
│   ├── routes/                   # API 路由（conversation/project/session/bdd/templates/operations/auth/health/upload/line-bot）
│   ├── db/client.ts              # PostgreSQL 客戶端
│   └── middleware/auth.ts        # JWT 認證中間件
├── migrations/           # DB 遷移（001-012）
└── ecosystem.config.js   # PM2 配置

bdd-spec/                 # BDD Skill 定義（instructions/ + rules/ + scripts/）
uiux-skill/               # UIUX Skill 定義（instructions/ + rules/）
spec/                     # BDD 規格產出（features/ + data/ + actions/）
```

## 部署

### CI/CD

- **前端**：push `main` → Vercel 自動偵測 Next.js 並部署
- **後端**：push `main` → GitHub Actions SSH 到 VPS → `pnpm install` → `pnpm build` → `pm2 restart`

### VPS 首次設定

```bash
# 1. SSH 到 VPS
ssh -i ~/Desktop/LightsailDefaultKey-ap-northeast-1.pem ubuntu@54.238.4.117

# 2. Clone repo
git clone git@github.com:Eric920418/tellcraft.git ~/tellcraft-repo

# 3. 配置環境變數
cp ~/tellcraft-repo/tellcraft-backend/.env.example ~/tellcraft-repo/tellcraft-backend/.env
# 編輯 .env 填入 DATABASE_URL, REDIS_URL, JWT_SECRET, ANTHROPIC_API_KEY 等

# 4. 安裝依賴並 build
cd ~/tellcraft-repo/tellcraft-backend
pnpm install && pnpm build

# 5. 配置 Nginx
sudo cp nginx/tellcraft.conf /etc/nginx/sites-available/tellcraft
sudo ln -s /etc/nginx/sites-available/tellcraft /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 6. 上傳目錄（圖片上傳功能）
mkdir -p /var/www/uploads/tellcraft

# 7. 啟動服務
pm2 start ecosystem.config.js
pm2 save
```

### VPS 日常部署

```bash
# 方法 1：SSH 到 VPS 後執行
cd ~/tellcraft-repo && git pull origin main
cd tellcraft-backend && pnpm install && pnpm build
pm2 restart tellcraft-backend

# 方法 2：本地直接執行（deploy.sh）
ssh -i ~/Desktop/LightsailDefaultKey-ap-northeast-1.pem ubuntu@54.238.4.117 '~/deploy.sh'
```

**deploy.sh**：
```bash
#!/bin/bash
set -e
cd ~/tellcraft-repo && git pull origin main
cd tellcraft-backend && pnpm install && pnpm build
pm2 restart tellcraft-backend
curl -s http://localhost:8080/health
```

### 驗證

```bash
# 健康檢查
curl http://54.238.4.117:8080/health
# 預期: {"status":"ok","services":{"database":"connected","redis":"connected"}}

# 即時日誌
pm2 logs tellcraft-backend --lines 100
pm2 status
# 日誌檔案：/var/log/tellcraft/out.log、/var/log/tellcraft/error.log
```

### DB Migration

```bash
# 在 VPS 上執行
psql "$DATABASE_URL" -f tellcraft-backend/migrations/xxx.sql
```

---

<details>
<summary><h2>開發更新紀錄（點擊展開）</h2></summary>

### Universal Input Quality Gate（2026-03-04）

統一輸入品質閘門：純規則式（零 LLM）攔截亂碼/髒話/垃圾輸入，修復用戶發送 `AAAAAACCCCC`、`sssdsdsdasikwqherujqhweurhuweur`、辱罵內容暢通無阻的漏洞。

- **`prefilter.ts` 新增 `checkInputQuality()`**：`checkOffensive()`（~23 中英髒話 pattern）→ `checkGibberish()`（G1-G6 六條規則：同字元重複/短模式重複/無母音/低 unique ratio/高子音密度/strict 短詞）→ `checkSpam()`（純數字/純符號）
- **`prefilterMessage()` 整合**：injection check 之後、rate limit 之前注入品質檢測，offensive 觸發違規累計
- **`handleContinueFlow` phase-aware gate**：go_back/retry 檢測後、phase 路由前二次攔截，`getPhaseStrictness()` 映射 strict/normal/lenient/skip，Redis anti-loop（3 次強制放行）
- **`analyzeAnswerRelevance` 前置檢查**：`checkInputQuality('strict')` 攔截亂碼，修復 `length >= 15` 快篩放行垃圾的漏洞
- **白名單**：~60 個技術縮寫（rwd/css/html/api/jwt...）不會被誤判為無母音亂碼
- **中英雙語 userMessage**：拒絕時顯示引導用語，不只是冷冰冰的錯誤

### 專案對話快捷入口（2026-03-03）

減少進入專案對話的點擊次數：Dashboard 首頁/專案列表一鍵進入對話，首頁為已登入用戶顯示最近專案快捷按鈕。

- **後端**：`GET /api/project` 和 `GET /api/dashboard/stats` 新增 `latestConversationId` 子查詢
- **Dashboard 專案列表**：每行新增 chat icon 按鈕，點擊直接跳轉到 `/?conversation={id}`（不影響行點擊進詳情）
- **Dashboard 首頁**：Recent Projects 每行新增 chat icon，一鍵進入對話
- **首頁 HeroSection**：已登入用戶輸入框下方顯示最近 3 個專案 pill 按鈕（status dot + name），點擊直接恢復對話
- **i18n**：新增 `hero.recentProjects`、`dashboard.enterConversation` 翻譯 key

### 未登入用戶限制（2026-03-03）

匿名（Guest）用戶功能限制，防止 LLM 成本失控：

- **Fast Mode Only**：Fine mode 按鈕加鎖，點擊跳轉登入頁
- **一次使用**：Fast build 完成後鎖定所有操作（發送/回覆），顯示 emphasized 登入 modal
- **雙重防繞過**：前端 localStorage + state 快速攔截，後端 DB 查詢不可繞過（`isAnonymousUser` + `hasGuestCompletedBuild`）
- **登入推薦強化**：進入聊天 subtle 提示、fast_generating 階段 subtle 提示、完成後 emphasized modal（不受 dismiss 限制）
- **後端 403**：`GUEST_FINE_LOCKED`（禁 fine mode）、`GUEST_LIMIT_REACHED`（已用完額度），前端統一捕獲顯示登入 modal

### BDD 釐清階段語義分析（2026-03-01）

精細模式需求釐清（spec_clarify）新增 `analyzeAnswerRelevance()`：用戶自由文字回答不再機械式接受，而是判斷是否明確回答了問題。

- **兩層策略**：規則式快篩（含糊信號詞 + 短回答問號偵測）→ Haiku 語義判斷（四元：accept/ambiguous/off_topic/seeking_help）
- **快篩放行**：>= 15 字無含糊信號直接 accept；選項題 A/B/C/D 跳過分析
- **非 accept 處理**：ambiguous → 追問要求明確答案；off_topic → 引導回問題；seeking_help → 用簡單語言重新解釋
- **防死循環**：FlowState `answerRejectCount` 連續 2 次拒絕後第 3 次強制 accept，accept 後重置
- **錯誤降級**：API 失敗 / JSON 解析失敗 → 降級為 accept（不阻塞流程）
- **成本**：每次分析約 $0.00036，預估觸發率 30%，每個 session ≈ $0.002

### FlowState 超時自動恢復（2026-03-01）

伺服器重啟後，卡在「生成中」phase 的對話不再永久卡死。新增定時掃描（每 2 分鐘），主動偵測超時的 FlowState 並自動恢復 + 透過 `sendMessage()` 推送通知（Web Socket.io + LINE pushMessage）。

- **新增 `services/flowstate-recovery.ts`**：`scanAndRecoverStuckFlowStates()` 掃描所有 `flow:*` Redis keys，逐個檢查 phase + 超時
- **覆蓋 4 個 phase**：`fast_generating`(5min) / `uiux_iterating`(5min) / `uiux_code_generation`(10min) / `deployer_deploying`(10min)
- **恢復策略**：有代碼 → `uiux_complete`（保留進度）；無代碼 → 回到上一個穩定狀態；部署中斷 → `deployer_failed`
- **推送機制**：複用 `sendMessage()`，自動走 LINE/Web 管道（LINE 用戶也能收到恢復通知）
- **不掃描的 phase**：`formulation`（已有 checkpoint 恢復）、`spec_discovery`（已有超時跳過）、`waitingForReply=true` 的 phase
- **wiring**：`index.ts` 新增 `setInterval` 每 2 分鐘調用，與現有 `cleanupOrphanBuildDirs` 同模式
- **deployer 時間戳**：`orchestrator.ts` 進入 `deployer_deploying` 時設置 `uiuxCodeGenerationStartedAt`，供超時偵測使用

### 修復 Event Storming 確認語意辨識（2026-03-01）

`event-storming.ts` 的 `handleInitConfirm` 和 `handleESAnswer` 確認偵測邏輯有缺陷：缺少「沒錯」「對」「是的」等常見確認詞，且 `startsWith(k + ' ')` 要求空格分隔（中文不用空格），導致「沒問題啊」「好的繼續」全部匹配失敗，被當成修改反饋觸發 LLM 重新調整。

- **新增 `utils/is-confirmation.ts`**：三層匹配策略 — 否定詞防護（「但」「少了」「想改」等轉折詞直接排除）→ 短詞精確匹配（≤4 字元「好」「對」「嗯」等）→ 長片語 includes（「沒問題」「沒錯」「確認」「是的」等）
- **`event-storming.ts`**：L359 `handleInitConfirm` + L552 `handleESAnswer` 替換為 `isConfirmation()` 共用函數
- **注意**：新增確認詞或否定詞時統一修改 `is-confirmation.ts`，不要在各 handler 中 inline 判斷

### 快速模式輸入驗證修復（2026-03-01）

修復 Fast Mode 入口無輸入驗證的 bug：用戶輸入「111」「哈哈哈」等無意義文字時，系統直接啟動快速建站生成網站。

- **根因**：`handleProcessMessage` 的 `mode === 'fast'` 路徑直接呼叫 `executeFastBuildSkill()`，完全跳過意圖驗證
- **修復**：在 fast mode 入口加入 `isDesignFeedback()` 預驗證，攔截亂碼/問候/閒聊等無關輸入
- **七層防禦**：
  1. `prefilterMessage()`：冷卻期檢查 → 空訊息/超長 → injection（28 個 regex，含混合語言）+ 違規累計 → **品質閘門**（亂碼 G1-G6 + 髒話 ~23 pattern + 垃圾 2 規則）→ 頻率限制（30 秒 6 條），中英雙語
  2. `handleContinueFlow` phase-aware gate：`getPhaseStrictness()` strict/normal/lenient/skip 依 phase 動態調整，Redis anti-loop（3 次強制放行防卡死）
  3. `isDesignFeedback()`：fast mode 入口 + 迭代階段專用（亂碼/問候/閒聊/設計關鍵詞正向放行）
  4. `analyzeAnswerRelevance()`：BDD 釐清階段自由文字語義分析（品質前置檢查 + 規則快篩 + Haiku 四元判斷），連續 2 次拒絕後強制 accept 防死循環
  5. `checkBuildRelevance()`：fast mode 語義相關性 + 具體性（強信號 ~80 詞直接放行 / 弱信號 Haiku 三元判斷），中英雙語
  6. `classifyIntent()`：正常模式 Haiku 意圖分類（abuse 觸發 `recordAbuseViolation` 累計違規）
  7. `refineCode [NO_CHANGE]`：LLM 級別最後防線（迭代階段）
  8. **違規冷卻升級**：Redis `violation:{userId}` 計數器（24h TTL），3 次→60s / 6 次→5min / 10 次→30min 冷卻

### 統一 LLM JSON 解析防禦（2026-02-28）

全後端 13 個檔案統一使用 `safeParseJson`（`utils/safe-parse-json.ts`），修復 Haiku 模型偶爾用 4+ 反引號包裹 JSON 導致解析失敗的問題。

- **`safeParseJson` 增強**：四層防禦（code fence regex → 反引號清除 → 找首個 `{`/`[` → 清理尾隨逗號/控制字符）
- **12 個 service 替換**：`bdd-to-ui-spec`/`clarify-dedup`(×2)/`change-management`(×2)/`event-storming`/`classifier`/`spec-discovery`/`uiux-generation`(×3)/`prd-discovery`/`formulation`(×4) — 刪除各自的 regex 解析，改 import 共用函數
- **非 JSON code block regex**：`uiux-generation`(`parseGeneratedFiles`/`parseCompletedFileBlocks`)/`deployer`(`fixBuildErrors`/`parseLLMFixedFiles`)/`quality-gate`(`parseFixedFiles`) — `` ``` `` → `` `{3,} `` 支援 3+ 反引號
- **不改的部分**：`iteration-skill`(深複製)/`line-bot-handler`(Webhook)/Redis 讀取/`formulation` L564(Gherkin)/`actions-design`(YAML)

### i18n Phase 2：Error/Utility i18n（2026-02-28）

Server Action 錯誤訊息 + 工具模組國際化，+117 keys / 2 namespaces（`actionErrors` + `test`）。

- **Server Actions i18n**（9 檔）：`index.ts`/`cloudflare.ts`/`supabase.ts`/`porkbun.ts`/`domain.ts`/`storage.ts`/`templates.ts`/`admin.ts`/`deploy.ts`，使用 `getTranslations('actionErrors')` from `next-intl/server`
- **error code 機制**：後端 `auth.ts` 返回 `'ADMIN_REQUIRED'`（取代中文 `'無管理員權限'`），5 個 admin 頁面同步更新比對值
- **lib 模組英文化**：`vps-api.ts`（8 字串）+ `llm.ts`（9 字串）中文 → 英文（技術診斷日誌）
- **test 頁面 i18n**：`useTranslations('test')`，48 個字串

### 前端 i18n 國際化 Phase 1（2026-02-28）

基於 `next-intl` v4 的完整前端國際化，中/英雙語支援（766 keys，27 namespaces）。

- **基礎設施**：`i18n/routing.ts` + `navigation.ts` + `request.ts`，`app/[locale]/` 路由群組，Middleware 合併（next-intl + JWT 認證）
- **翻譯檔**：`messages/zh.json` + `messages/en.json`，766 keys 完全對齊
- **主頁面**：page.tsx 全部 20+ 內部元件（HeroSection ~ Footer），ChatSection 6 個翻譯 hook
- **Landing 區塊**：UseCases/HowItWorks/Stats/Comparison/Showcase/FAQ/Testimonial/CTA/Footer
- **儀表板**：12 個 dashboard pages + 9 個 dashboard components（Sidebar/DashboardContent/DashboardShell/Chart/DataTable/StatsCard 等）
- **認證**：login/callback/post-login/liff，4 頁全量翻譯
- **UIUX 元件**：11 個（DeviceSwitcher/TemplateCard/QualityGateReport/TemplatePicker/VariantPicker/CodePreview/InteractivePreview/PreviewPanel/UiuxChatSection 等）
- **UI 元件**：LoginPrompt/ConversationPicker/ProjectReminder/QuickReplies/SpecGenerationView/BddAnimationPanel/BuildingPlayer + deployer 3 元件
- **模組級常數**：`INTERNAL_COMMAND_LABELS` → `COMMAND_KEYS` + `getCommandLabel()`，`CSS_LABELS` → `tCssLabel()` 動態查詢
- **locale-aware 導航**：`Link`/`redirect`/`useRouter` 替換為 `@/i18n/navigation`，`useLocalePath` hook 處理 `window.location.href`
- **LocaleSwitcher**：整合到主頁 header（landing + chat mode）
- **TypeScript 0 錯誤，ESLint 0 新增錯誤**

### LINE Bot 深度整合（2026-02-27）

LINE 對話內完成完整專案生命週期（描述需求 → AI 生成 → 部署上線），不需要打開網頁。

- **Webhook Proxy**：`app/api/line-webhook/route.ts` — 透傳 raw body + X-Line-Signature（現有 VPS proxy 會重序列化 body 導致簽名驗證失敗）
- **Event Router**：`routes/line-bot.ts` — 簽名驗證 + Follow/Message/Postback 事件分發
- **Bot Handler**：`services/line-bot-handler.ts` — 歡迎消息、文字→BullMQ、PostbackAction 路由、用戶自動註冊
- **Message Translator**：`services/line-message-translator.ts` — sendMessage 參數→LINE Messages 全量翻譯
  - code_preview → Flex Bubble + LIFF 預覽連結
  - deploy_result → 成功綠/失敗紅 Flex Bubble + 網站 URL
  - quality_gate_report → 摘要 Flex Bubble
  - template_picker → Flex Carousel（最多 12 個 + "更多" LIFF 連結）
  - variant_picker → Flex Carousel（方案 A-E + LIFF 對比連結）
  - deployment_history → Flex Carousel + 回滾 PostbackAction
  - 進度消息（fast_build_progress/building_progress）全部跳過
  - quickReplies → LINE Quick Reply（ghost 排最後，最多 13 個）
  - 長文本自動分割（段落邊界，最多 5 條）
- **Full Push**：`services/line-full-push.ts` — 查 `line_active_conversations` 表判斷是否 LINE 來源，是則翻譯推送
- **Migration**：`011_add_line_active_conversations.sql` — LINE userId → conversation 映射表
- **DB Client**：新增 `getLineActiveConversation` / `setLineActiveConversation` / `deleteLineActiveConversation` / `findUserByLineId`
- **FlowState**：新增 `messageSource?: 'line' | 'web'`
- **replyToken 策略**：Webhook 收到 → replyMessage（免費確認），Orchestrator 完成 → pushMessage（計費結果）
- **Fine 模式**：引導到 LIFF 網頁版（需要視覺交互）
- **環境變數**：新增 `LINE_BOT_CHANNEL_SECRET`（Messaging API Channel Secret，不同於 Login Channel 的 `LINE_CHANNEL_SECRET`）

### 帳號綁定（雙登入系統）（2026-02-27）

Google 用戶可綁定 LINE 帳號（反之亦然），之後用任一方式都能登入同一帳戶。

- **user_providers 表**：`(user_id, provider, provider_id)` 多 provider 存儲，UNIQUE 約束防衝突
- **findOrCreateUser 重構**：優先查 `user_providers` → 向後相容查 `users.provider` → email 匹配改為 INSERT（不覆蓋）
- **綁定流程**：Dashboard 帳號設定 → `/api/auth/link/{provider}` → VPS OAuth（state 帶 linkUserId）→ exchange 綁定模式
- **解綁保護**：至少保留一個 provider，LINE 綁 Google 時自動升級假 email
- **LINE Notify 改查**：`getLineUserIdByConversation` 改查 `user_providers` 表
- **Admin Dashboard**：用戶列表返回 `providers` 陣列（子查詢 `string_agg`）
- **帳號設定頁**：`/dashboard/account` — 已綁定列表 + 綁定按鈕 + 解綁 + toast 通知
- **Migration**：`010_add_user_providers.sql`，自動遷移現有 `users.provider` 資料

### LINE LIFF 整合 + 推播升級（2026-02-27）

LINE 推播通知升級為 **Flex Message 卡片 + LIFF 深度連結**，用戶點推播 → LINE 內直接打開正確對話（無需重新登入）。

- **LIFF 入口頁**：`app/liff/page.tsx` — `liff.init()` → `liff.getIDToken()` → 後端驗證 → JWT → 跳轉主頁面恢復對話
- **後端 LIFF 驗證**：`POST /auth/liff/verify` — LINE `/oauth2/v2.1/verify` 驗證 ID Token → `findOrCreateUser` → JWT
- **Flex Message 推播**：`line-notify.ts` 升級為卡片式推播（Header 標題+顏色 / Body 內容 / Footer 按鈕）
- **LIFF 深度連結**：按鈕 URL = `https://liff.line.me/{liffId}?conversationId=xxx`，LINE 內自動開啟 LIFF 頁面
- **降級機制**：`LIFF_ID` 未設定時，按鈕退回 `https://tellcraft.com/?conversation=xxx`
- **Stage 配色**：spec_complete 綠 / uiux_generation_complete 藍 / deployer_complete LINE 綠 / deployer_error 紅
- **環境變數**：前端 `NEXT_PUBLIC_LIFF_ID`、後端 `LIFF_ID`（同一個 LIFF App ID）

### LINE 推播通知（2026-02-27）

LINE 用戶在關鍵里程碑完成時收到 LINE 推播通知，離線用戶也能即時知道任務進度。

- **推播服務**：`line-notify.ts` 封裝 LINE Messaging API，模組級單例，未配置 token 時靜默跳過
- **Stage 白名單**：`spec_complete`（BDD 完成）、`uiux_generation_complete`（UIUX/Fast Build 完成）、`deployer_complete`（部署成功）、`deployer_error`（部署失敗）
- **觸發點**：`sendMessage()` 末尾 fire-and-forget 調用，不阻塞 WebSocket 推送
- **用戶查找**：`conversations → projects → users` 三表 JOIN，只查 `provider='line'` 的用戶
- **加好友機制**：LINE 授權 URL 加 `bot_prompt=aggressive`，登入時提示加好友（天然 opt-in）
- **前置條件**：需在 LINE Developers Console 建立 Messaging API Channel（與 Login Channel 同 Provider），設定 `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` 環境變數

### BDD 需求藍圖面板（2026-02-27）

BDD Q&A 動畫面板從 3D 鍛造車間場景改為**純 React 文字歷史紀錄面板**：

- **即時 Q&A 展示**：呼叫 `getBddSession` API 取得結構化資料，按分類（功能需求/資料模型/術語定義）自動分組
- **深色主題**：GitHub Dark 風格配色（#0D1117 背景 + monospace 字體），呈現「在建構規格」的意象
- **進度追蹤**：頂部進度條 + 輪次標籤（R{n}/{max}），底部 AI 工作狀態指示器
- **入場動畫**：分類區塊 slideDown + fadeIn，Q&A 條目 fadeIn + slideUp，最新條目橙色高亮
- **完成效果**：進度條滿格 + 綠色邊框光暈
- **可折疊分類**：點擊分類標題展開/收合，每個分類顯示已答題數
- **自動捲動**：新條目出現時自動捲動到底部
- **移除依賴**：不再使用 Remotion Player、Three.js、@react-three/postprocessing

### Sandpack 串流預覽防閃爍（2026-02-28）

修復精細模式 UIUX 三階段生成（Structure → Animation → RWD）期間 Sandpack 預覽面板不斷閃爍/白屏的問題。

**根因**：每次 1.5s 輪詢都觸發 `SandpackProvider` 完全重建（依賴 JSON 變化 → key 變化 → iframe 銷毀+重建）。

**三處修復**：
- `SandpackPreview.tsx`：streaming 期間凍結 `providerKey`（用 `useRef`），所有更新走 `SandpackFileUpdater.updateFile()` 增量路徑，streaming 結束後一次乾淨重建
- `page.tsx` 輪詢去重：`setStreamingPreview` 改用 functional update + 快速內容比較（phase + 檔案數 + content.length），內容不變時返回舊 reference 不觸發 re-render
- `page.tsx` 穩定數據源：新增 `codePreviewData` state + `stablePreviewData` useMemo，避免 `renderPreviewPanel` 每次 render 都搜索 messages 陣列 + 建立新 reference

### SandpackPreview 編輯模式（2026-02-26）

想法模式和快速模式生成的 SandpackPreview 現在也支援即時編輯（文字/顏色/間距/圖片），與模板模式 PreviewPanel 一致。

**核心機制**：
- 編輯橋接腳本（`SANDPACK_EDIT_BRIDGE`）作為 Sandpack 檔案（`/lib/edit-bridge.js`）注入
- `MutationObserver` + `setTimeout(300ms)` 延遲標記，observer 只監聽 `childList`（避免 attribute 死循環）
- `window.__tcEditBridgeInitialized` 防重複初始化
- `postMessage` 雙向通訊（`tc_setEditMode`/`tc_selectionChanged`/`tc_clearSelection`/`tc_toggleElement`）

**前端**：
- `SandpackPreview.tsx`：`editMode`/`onSelectionChanged` props，用 `setInterval(500ms)` + `querySelector('iframe')` 取得 Sandpack 管理的 iframe ref
- `page.tsx`：code_preview 工具列編輯模式按鈕，聊天框上方選取 chips UI
- 串流期間自動禁用編輯模式，切換對話時重置所有編輯狀態

**多選 + 聊天 + PropertyEditor 三者並存（2026-03-01）**：
- 編輯模式為**多選 toggle**：點擊元素追加/取消選取，每個選取元素左上角顯示編號徽章（1, 2, 3...）
- 選取元素以 chips 形式顯示在聊天輸入框上方，點 ✕ 可移除單個元素，「全部清除」清空選取
- 發送訊息時自動附加選取元素上下文（標籤名 + 文字摘要 + 關鍵樣式），AI 根據上下文修改源碼
- 發送後自動清空選取狀態
- PropertyEditor 側邊欄（280px）：點擊元素後顯示屬性編輯器（文字/顏色/間距/圖片等即時編輯）
- 拖曳把手：選取元素四角顯示 resize handles，拖曳調整尺寸
- 批註系統：每個元素可添加修改說明，儲存時附加到訊息
- Undo/Redo（Cmd+Z / Cmd+Shift+Z）+ 儲存按鈕：將所有覆蓋彙整為訊息發送給 AI
- overrides/annotations localStorage 持久化（per conversation）

### BDD 3D 動畫重設計（2026-02-26）

BDD Q&A 場景從「低多邊形城堡」重設計為「軟體介面鍛造」主題（已被 2026-02-27 "The Craft" 取代）。

### 防刷訊息：三層防護（2026-02-26）

1. 前端 2 秒冷卻
2. 後端 Redis Lua 限速（5 秒窗口 1 條/對話）
3. Worker 對話鎖（Redis `SET NX EX`，TTL 300s）

### 動畫大升級：城堡 + 工廠（2026-02-25）

- BDD Q&A：低多邊形城堡（65+ mesh），6 輪建造，藍圖→實體過渡
- Fast Build：3D 工廠流水線（~39 mesh），3 工位（Structure→Animation→RWD），streamingChunks 微進度

### Fast Build 品質升級（2026-02-25）

13 項修復：displayFont 動態輸出、產品類型中文標籤、模板風格過濾、產業配色 6 套、Creative 溫度調升、QG 2 輪修復等。

### Fast Build 佈局模式：App vs Website（2026-02-25）

`LayoutMode = 'app' | 'website'`：dashboard/tool → app（無 Header/Footer/Hero），其餘 → website。

### Fast Build 全面升級（2026-02-25）

產品類型 10→25、detectDesignTier 加權匹配、22 套產業配色、模板風格整合、QG 輕量 LLM 修復。

### BDD Skill 方法論升級（2026-02-25）

Scenario Outline、DataTable 命名慣例、Rule 四類子類型、跨產出物一致性驗證 8 項、OpenAPI 3.0 並行輸出。

### BDD→UIUX 翻譯品質升級（2026-02-25）

Action Types 擴展 6 種、UIRequirementsSpec 新增 userFlows/stateHints、翻譯失敗智能降級、Animation/RWD 互動上下文注入。

### BDD Skill P1-P3 補完（2026-02-25）

提案優先模式、單題反悔、連續空輪終止、ISA constraints 動態化、變更歷史追蹤、Rollback 支持。

### BDD Skill 差距補完（2026-02-24）

ES 一致性檢查、Formulation Rules 強化、Draft Batch Mode、Clarify 批次整合、Change Management。

### Phase 0 Event Storming（2026-02-24）

複雜業務需求自動 DFS 探索，產出 Commands/ReadModels/Actors/Aggregates/Rules 知識地圖。

### BDD Phase 4/5 後端補完（2026-02-24）

Actions Design（Sonnet LLM）+ ISA Config（100% 規則式）+ Feature Files 驗證整合。

### 對話回退 + 錯誤恢復（2026-02-24）

`PHASE_BACKTRACK_MAP` 4 條回退路徑、`handleGoBack()` 通用回退、5 個 phase handler 錯誤恢復。

### Fast Build 藍圖進度 + BDD Q&A 3D 動畫（2026-02-24）

Remotion 改造（取代 motion/react + GSAP），3D 工廠流水線 + 低多邊形城堡。

### 迭代 Skill 拆分 + 撤銷（2026-02-16）

`iteration-skill.ts` 獨立、orchestrator 瘦身 -549 行、撤銷功能、迭代歷史。

### 智能模板匹配（2026-02-15）

三層評分引擎（關鍵詞 40 + Category 30 + UISpec 30），零 LLM。template_category 4→8。

### Fast Mode 快速建站（2026-02-09）

一句話 → 跳過 BDD/Discovery → 3 階段自動生成 → ~5 分鐘預覽。

### BDD→UI 翻譯 + Variant 創意概念（2026-02-08）

`bdd-to-ui-spec.ts` 翻譯 + `VariantConcept` 概念注入全流程。

### 串流實時預覽（2026-02-08）

LLM 串流逐步解析 code block → Redis → HTTP 輪詢 → Sandpack 增量更新。

### Quality Gate 品質檢查（2026-02-06）

A11y/Performance/Code Quality 靜態檢查 + Haiku 自動修復（最多 3 輪）。

### Code Preview 即時渲染（2026-02-06）

Sandpack 取代 1105 行 regex 轉換器。支援 streaming 增量更新、裝置切換。

### Classifier 防禦體系（2026-02-08，2026-03-01 增強）

- **Prefilter**（零 LLM）：冷卻期攔截 → injection 28 regex + 違規累計 → **品質閘門**（亂碼 6 規則 + 髒話 ~23 pattern + 垃圾 2 規則）→ Rate Limit 30s/6 條，中英雙語
- **Phase-aware 品質閘門**：`handleContinueFlow` 內 phase 路由前二次攔截，嚴格度 strict/normal/lenient/skip 依 phase 調整，Redis anti-loop 計數器（連續 3 次垃圾強制放行防卡死）
- **analyzeAnswerRelevance 前置檢查**：BDD clarify 階段 `checkInputQuality('strict')` 攔截亂碼，避免 `length >= 15` 快篩放行垃圾
- **違規升級**：Redis `violation:{userId}` 24h TTL，injection/abuse/offensive 均累計，3 次→60s / 6 次→5min / 10 次→30min 冷卻
- **正常模式**：Prefilter → Classifier Meta Intent（abuse 觸發 `recordAbuseViolation`）→ Skill Intent
- **快速模式**：Prefilter → `isDesignFeedback()` → `checkBuildRelevance()`（強信號 ~80 詞 / 弱信號 Haiku 三元：通過/模糊/不相關）

### Design Tier（2026-02-06）

functional（dashboard/SaaS）vs creative（landing page），約束集切換。

### UIUX 生成重構（2026-02-05）

5 變體 + Design System + 三階段生成（Structure → Animation → RWD）。

### 模板預覽重新設計（2026-02-06）

5 個模板 HTML 重寫，每個有獨立色彩系統、Signature element、入場動畫。

### VPS 後端遷移（2026-02-03）

Vercel Serverless → VPS Express + BullMQ + Socket.io + PostgreSQL + Redis。

### 認證系統

Google/LINE OAuth、JWT 雙軌（localStorage + Cookie）、訪客帳號合併。

### 儀表板系統

用戶/管理員儀表板、專案管理、版本歷史、LLM 用量追蹤。

### 早期功能（2026-01-31）

多輪 PRD Discovery、Feature Files 分批生成、語意去重、Token 優化、首頁設計、訪客體驗。

</details>
