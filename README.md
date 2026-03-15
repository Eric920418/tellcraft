# Tellcraft

> **用對話打造你的軟體產品** | [tellcraft.com](https://tellcraft.com)

Tellcraft 是一個 AI 驅動的 **SDD（Specification-Driven Development）自動化開發平台**。用戶只需描述需求，AI 自動釐清細節、產出可執行規格、生成前後端程式碼、自動驗證業務邏輯、部署上線。

```
描述需求 → AI 釐清 → BDD 規格 → 建資料庫 → 生成代碼 → 自動驗證 → 一鍵部署
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

# 測試
pnpm test:ci              # 前端（Vitest + jsdom）
cd tellcraft-backend && pnpm test:ci  # 後端（Vitest）

# Lint
pnpm lint                 # 前端（ESLint）
cd tellcraft-backend && pnpm lint     # 後端（ESLint）

# BDD 規格驗證
npx ts-node bdd-spec/scripts/lint-gherkin-format.ts spec/features/
npx ts-node bdd-spec/scripts/validate-feature.ts spec/features/
```

### SEO 配置

| 項目 | 檔案 | 說明 |
|------|------|------|
| i18n Proxy | `proxy.ts` | next-intl proxy（Next.js 16 取代 middleware），攔截無 locale 前綴的請求 rewrite 到 `app/[locale]/`（`/` = en、`/zh` = 中文，瀏覽器語言自動偵測）。排除 `api/`、`_next/`、`monitoring`、`uploads/`、靜態檔案 |
| 安全 Headers | `vercel.json` | `X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy` |
| robots.txt | `app/robots.ts` | 允許公開頁面，禁止 dashboard/auth/api/test/liff |
| sitemap.xml | `app/sitemap.ts` | 公開頁面 + hreflang（en/zh-TW） |
| manifest.json | `app/manifest.ts` | PWA manifest（standalone） |
| favicon.ico | `app/favicon.ico` | 從 icon.png 轉換（16/32/48px） |
| Metadata | `app/[locale]/layout.tsx` | metadataBase + title template + OG + Twitter Card + canonical + keywords |
| noindex | `app/[locale]/{dashboard,auth,test,liff}/layout.tsx` | 非公開路由 noindex/nofollow |
| JSON-LD | `app/[locale]/page.tsx` | Organization + WebSite + SoftwareApplication + FAQPage |
| Breadcrumb | `app/[locale]/templates/TemplatesPage.tsx` | BreadcrumbList（Home → Templates） |
| 字體 | `app/[locale]/layout.tsx` | next/font（Noto Sans TC + IBM Plex Mono），消除 render-blocking |
| 結構化資料工具 | `app/lib/structured-data.ts` | JSON-LD schema 生成函數 |

### 環境變數

**前端**（`.env.local`）：
`VPS_API_URL` `NEXT_PUBLIC_VPS_API_URL` `NEXT_PUBLIC_VPS_WS_URL` `NEXT_PUBLIC_UPLOAD_BASE_URL` `NEXT_PUBLIC_SUPABASE_URL` `NEXT_PUBLIC_SUPABASE_ANON_KEY` `NEXT_PUBLIC_LIFF_ID` `NEXT_PUBLIC_SENTRY_DSN` `SENTRY_ORG` `SENTRY_PROJECT` `SENTRY_AUTH_TOKEN`

**後端**（`tellcraft-backend/.env`）：
`DATABASE_URL` `REDIS_URL` `JWT_SECRET` `ANTHROPIC_API_KEY` `GOOGLE_CLIENT_ID` `GOOGLE_CLIENT_SECRET` `LINE_CHANNEL_ID` `LINE_CHANNEL_SECRET` `LINE_BOT_CHANNEL_SECRET` `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` `LIFF_ID` `UPLOAD_DIR` `UPLOAD_BASE_URL` `SOCKET_VERBOSE_LOG` `NEON_API_KEY` `NEON_DEFAULT_REGION`

> `UPLOAD_BASE_URL` 必填（例如 `https://api.tellcraft.com/uploads/tellcraft`），未設定時 `/api/upload/image` 會回傳 `UPLOAD_BASE_URL_MISSING`。

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

## SDD Pipeline（全棧自動開發）

客戶描述需求後，平台自動完成**規格 → 資料庫 → 前端 → 後端 → 驗證 → 部署**全流程：

```
客戶：「我要做一個寵物預約系統」
  │
  ▼
① BDD Skill（已完成）
  ├─ 產出：Feature Files（可執行規格）
  ├─ 產出：API Spec（OpenAPI YAML）
  ├─ 產出：schema.sql + entity_to_table_mapping.yml
  └─ 產出：isa.yml（SpecFormula 配置）
  │
  ▼
② Neon DB Provision（已完成）
  └─ BDD 完成後自動觸發
     schema.sql → Neon API → 建 DB + 套 Schema + RLS（同步 < 10s）
  │
  ▼
③ UIUX / Fast Build Skill（已完成）
  └─ 設計 → 生成前端代碼 → Sandpack 即時預覽
  │
  ▼
④ Coder Skill Stage A（✅ 已完成 — 純生成）
  ├─ 讀取 BDD 產出（actionsYml + schemaSql + entityMapping）
  ├─ 生成 lib/db.ts（Neon 連接，零 LLM）
  ├─ 生成 lib/actions/*.ts（純邏輯函數，LLM 逐 action）
  ├─ 生成 app/actions/*.ts（Server Actions，零 LLM 機械映射）
  └─ 改寫 UIUX 組件（useState mock → Server Action 調用）
  │
  ▼
④b Coder Skill Stage B（❌ 未實作）
  ├─ 生成 API Routes（app/api/*/route.ts）
  └─ SpecFormula 自動跑 Feature Files 驗證（紅燈修、綠燈過）
  │
  ▼
⑤ Deployer（已完成）
  └─ 前端+後端 → 同一個 Vercel Next.js 部署（自動注入 DATABASE_URL）
```

### sdd.os 與 SpecFormula 的關係

```
sdd.os/specformula-java/        ← Java Reference Implementation（上游原版，只讀參考）
        │ 移植
        ▼
tellcraft-backend/src/lib/specformula/   ← TS 移植版（27 檔 ~3800 行，已能跑）
        │ 被調用
        ▼
Coder Skill Stage B                      ← 生成 API Routes 後，調用 SpecFormula 自動驗證
```

- **SpecFormula** 是 SDD 的核心驗證引擎：讀取 Feature Files → 打 HTTP API → 查 DB 驗證狀態
- TS 版已通過 217 單元測試 + 2 E2E 場景（entity_setup → api_call → response_validate → entity_validate）
- API Spec 已擴充到 4 檔 19 operations（conversation/session/project/bdd）

### 為什麼需要 Coder Skill（不能只靠 Supabase PostgREST）

Supabase PostgREST 只能做 CRUD + RLS，**搞不定**：
- 第三方 API 串接（金流、寄信、SMS、OAuth）
- 複雜業務邏輯（價格計算、庫存扣減、狀態機）
- 排程任務 / 背景工作 / Webhook
- 任何需要「先做 A，根據結果再做 B」的流程

## Skill 系統

| Skill | 用途 | LLM | 狀態 |
|-------|------|-----|------|
| `bdd-spec` | 需求釐清 + BDD 規格產出（ES → Discovery → Formulation → Actions → ISA） | Sonnet | ✅ 完成 |
| `uiux` | 前端介面設計（Design Discovery → Design Lab → Implementation） | Sonnet | ✅ 完成 |
| `fast-build` | 一句話快速建站，Haiku 概念生成 + Tier 智能修正 + Sonnet 三階段生成 | Haiku ×1 + Sonnet ×3 | ✅ 完成 |
| `quality-gate` | UIUX RWD 完成後自動觸發，靜態檢查 + LLM 自動修復 | Haiku | ✅ 完成 |
| `deployer` | 代碼 → sanitize → 本地 build 驗證 → Vercel 部署 → 回滾 | Haiku（修復） | ✅ 完成 |
| `iteration` | 迭代修改 + 撤銷上一步 + 版本回滾 | Sonnet | ✅ 完成 |
| `db-provision` | BDD 完成後自動建 Neon DB + 套用 Schema（同步 < 10s） | — | ✅ 完成 |
| `coder` | 後端代碼生成 + SpecFormula 自動驗證（紅綠燈循環） | Sonnet | ❌ **未實作** |
| `domain-manager` | 域名管理：列出已有域名 / 引導購買或綁定 | — | ✅ 完成 |
| `domain-purchase` | 域名購買：RDAP → Porkbun → Cloudflare DNS → Vercel 綁定 | — | ✅ 完成 |
| `domain-dns` | 自有域名 DNS 綁定 + Cloudflare DNS CRUD | — | ✅ 完成 |

### 內部服務層

| Service | LLM | 調用者 | 職責 |
|---------|-----|--------|------|
| `classifier.ts` | Haiku | 每條新訊息 | 意圖分類（長文預過濾 ≥60字 → 規則式 → LLM + 後驗證覆寫）+ Content Policy 審查（contentFlag） |
| `prefilter.ts` | 無 / Haiku | 每條訊息（最先）+ Fast Mode | 空訊息/長度/Injection(28 regex)/品質閘門(亂碼+髒話+垃圾)/Rate Limit + `checkBuildRelevance()` 語義相關性 + Content Policy |
| `semantic-gateway.ts` | Sonnet | BDD 釐清 + 設計問卷 + 迭代修改 | 統一語義閘門：quickFilter 零 LLM 短路（BDD 中文 ≥2/英文 ≥5 + Design 中文/URL + Iteration 關鍵詞，~90%+ 放行）+ Sonnet 語義判斷（verdict + 引導訊息生成）。BDD/Design API 錯誤 fail-open，Iteration fail-closed |
| `bdd-to-ui-spec.ts` | Haiku | UIUX Pipeline | BDD Feature Files + actionsYml → UIRequirementsSpec（Haiku 翻譯 + `enrichEntitiesFromActionsYml` 零 LLM 後處理：types→entity field type/required，input.properties→action field type，前置（參數）rules→validation）|
| `prd-discovery.ts` | Sonnet | bdd-spec | PRD 需求發掘（多輪） |
| `clarify-dedup.ts` | Haiku ×2 | bdd-spec | Decision Summary + 語意去重 |
| `spec-discovery.ts` | Sonnet | bdd-spec | 規格品質檢查（S1-S6） |
| `formulation.ts` | Sonnet ×5 | bdd-spec | Schema + Features + EntityMapping + Actions + ISA |
| `event-storming.ts` | Haiku | bdd-spec | Event Storming DFS 探索 |
| `fast-build-generation.ts` | 無 | fast-build | 規則式 tier/產品/DesignSystem（零 LLM） |
| `template-matcher.ts` | 無 | orchestrator | 三層評分匹配（零 LLM） |
| `design-moods.ts` | 無 | uiux-phases / fast-build | 8 個設計情緒預設 + `recommendMoods()` 規則推薦 + prompt 注入 getter |
| `customer-service.ts` | 無 / Sonnet | fast mode + handleContinueFlow | 客服問答：意圖偵測（greeting/question/chitchat/help）+ FAQ 零 LLM 匹配（9 主題）+ Sonnet 開放問答 |
| `line-notify.ts` | 無 | orchestrator-utils | LINE 推播通知（stage 白名單過濾） |
| `telegram-notify.ts` | 無 | orchestrator-utils | Telegram 里程碑推播通知（stage 白名單，非 Bot 對話才推） |
| `telegram-full-push.ts` | 無 | orchestrator-utils | Telegram Bot 全量翻譯推送（Telegram 來源的對話） |
| `telegram-bot-handler.ts` | 無 | index.ts | Telegram Bot 業務邏輯（/start/文字/Callback Query，`initTelegramBotHandler` 注入） |
| `telegram-message-translator.ts` | 無 | telegram-full-push | sendMessage → Telegram MarkdownV2 + Inline Keyboard 翻譯層 |

### 兩種模式

**精細模式（Fine）**：BDD 完成 → [Neon DB 同步建立（付費用戶，從 BDD Entity 推導 Schema）] → 模板匹配 → Discovery（Step 2 可上傳參考截圖，Vision 分析注入後續流程）→ Brief 確認 → 5 變體 → Structure → Animation → RWD → QG → 部署（自動注入 DATABASE_URL）

**精細模式 + 自動採用**：PRD Clarify 第一題出現「全部自動採用 AI 建議」按鈕 → 自動回答所有 BDD 問題（propose→proposedAnswer / ask→建議選項或 A）→ 自動確認草稿 → 自動回答 Spec Clarify → 進入設計階段（手動）。BDD 互動從 7-11 次降到 1 次。`FlowState.autoAdoptMode` 在 `completeSpecPhase` 末尾清除，`autoAdoptAllPendingQuestions` 有 MAX_ITERATIONS=200 安全閥。

**快速模式（Fast）**：一句話描述（可附參考圖片）→ 規則式推斷（tier/產品類型/配色/佈局）→ 上傳圖片 Vision 分析（如有）→ Haiku 概念生成（含頁面推理 suggestedPages, 2-4 頁，注入參考分析）→ `mergePages()` 合併預設+建議頁面（上限 4 頁）→ Prompt 擴展 → Structure（精簡 prompt，跳過 techniques/patterns/moodCode，注入 referenceAnalysis）→ Animation → RWD → 靜態 QG。所有類型上限 3-4 頁，4 頁以內單批完成（無暫停確認）。

## BDD Spec 流程

```
Phase 0: Event Storming（可選，複雜需求自動啟動）
    ↓ DFS 探索 → Commands/ReadModels/Actors/Aggregates/Rules

Phase 1: PRD Discovery + Clarify（多輪動態釐清）
    ↓ 檢查清單掃描：A1-A6（領域模型）、B1-B5（功能模型）、C1-C2（術語一致）、D1-D2（品質）
    ↓ 每輪最多 5 題，每 5 題批量確認（支援反悔），動態上限 3-10 輪 / 15-50 題
    ↓ 三層去重：L1 Bug Fix + L2 Decision Summary(Haiku) + L3 Post-gen Dedup(Haiku)
    ↓ 可選「全部自動採用 AI 建議」（第一題按鈕，autoAdoptMode while 迴圈自動填答）

Phase 2: Formulation（需求驅動 + 智能分組）
    ↓ 同一實體 CRUD 合併為 1 個 Feature，狀態轉換/跨實體保持獨立
    ↓ 產出 schema.sql + entity_to_table_mapping.yml + feature files
    ↓ Checkpoint 每 3 個 feature 保存，中斷後可恢復（15 分鐘超時偵測）
    ↓ 驗證腳本（lint + validate）+ 自癒修復（最多 3 次）

Phase 3: Spec Discovery + Clarify
    ↓ S1-S6 品質審查（規則完整性/Example 覆蓋/邊界條件/格式/跨 Feature 一致/Schema 對應）
    ↓ 最多 2 輪 / 10 題，超額時按嚴重度截斷（不跳過）

白話化管線（PRD/Spec Clarify 共用）：
    LLM 生成 → whiteTextQuestion + whiteTextOptions（prompt 約束）
    → sendClarifyQuestion 前 sanitizeClarifyForDisplay()（規則式清洗，white-text-sanitizer.ts）
    → 前端展示純白話文字
    → DB 保留原始技術 question/options（供 Formulation 消費）

Phase 4: Actions Design → actions.yml（Sonnet LLM）
Phase 5: ISA Config → isa.yml（SpecFormula 標準，100% 規則式，零 LLM）
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
/dashboard/admin/logs               # 系統日誌（即時 VPS 日誌監控）
```

權限：Middleware 攔截未登入 `/dashboard` + 非管理員 `/dashboard/admin`，Server Actions `requireAdmin()` 二次驗證。

## 國際化（i18n）

### 架構

基於 `next-intl` v4，`localePrefix: 'as-needed'`，`localeDetection: true`。

**語言偵測優先順序**（proxy）：
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

## Credit 加權配額系統

以 Credit 加權計費取代「每條訊息 +1」，直接反映真實 API 成本。

### 操作成本

| 操作 | Credits | 原因 |
|------|---------|------|
| 聊天/釐清/BDD 回答 | 1 | 0-1 Haiku |
| Design Brief 生成 | 3 | 1-4 Sonnet |
| Design Variant 生成 | 2 | 1 Sonnet |
| BDD Formulation | 5 | 2-5 Sonnet |
| Fast Build 完整管線 | 8 | 2 Haiku（概念+擴展）+ 3 Sonnet + QG |
| Normal UIUX 完整管線 | 10 | 3-6 Sonnet + QG |
| 迭代修改 (refineCode) | 3 | 1 Sonnet (大 context) |
| 部署 | 2 | 0-7 Sonnet (平均低) |

### 方案配額

| 方案 | Credits/月 | 約等於 |
|------|-----------|--------|
| free | 30 | ~3 次 fast-build 或 ~30 次對話 |
| creator | 150 | ~15 次 fast-build |
| pro | 800 | ~80 次 fast-build |
| business | ∞ | 無限 |

### 扣除機制

- **入口扣除**：每條訊息（`handleProcessMessage` / `handleContinueFlow`）扣 1 credit (base)
- **操作扣除**：重操作完成後額外扣除（例如 Fast Build = 8 total = 1 base + 7 額外）
- **CAS 原子更新**：`WHERE credits_used + amount <= limit` 防競態超額
- **失敗仍扣**：LLM 已調用，成本已發生
- **月重置**：每小時掃描 `subscription_period_start + 1 month <= NOW()` 的用戶，重置為 0

### 付費限定功能

| 功能 | 說明 | 限制 |
|------|------|------|
| **代碼下載 (ZIP)** | 下載專案全部 `project_files` 打包為 ZIP | creator / pro / business |

- **API**：`GET /api/project/:id/download-code`（後端 archiver ZIP 串流）
- **前端 Route**：`/api/projects/[id]/download-code`（binary 透傳，不走 vps proxy，避免 JSON 解析損壞 binary）
- **UI**：Dashboard 專案列表每列加下載按鈕，免費方案 `opacity:0.4` + `cursor:not-allowed` + title 提示升級

### 核心檔案

- 常數唯一來源：`tellcraft-backend/src/config/plans.ts`
- 扣除函數：`tellcraft-backend/src/workers/orchestrator-utils.ts` (`deductCredits`)
- 月重置：`tellcraft-backend/src/services/credit-reset.ts`
- Migration：`tellcraft-backend/migrations/014_add_credits_system.sql`

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
| **UIUX 設計** | 雙軌 Discovery、Design Tier、5 變體、三階段生成、串流即時預覽、BDD→UI 翻譯（含 actionsYml 欄位精確注入）、Variant 概念注入 |
| **快速建站** | 26 種產品類型、22 套產業配色、Haiku 概念生成（設計靈魂）、Tier 智能修正、vague 攔截引導、失敗重試、進度預估、手機全屏預覽、App/Website 佈局模式、模板風格整合、智能模板匹配 |
| **品質** | Quality Gate 靜態檢查（含 SVG ID 碰撞偵測）、LLM 自動修復、RWD 響應式安全網、Tailwind v4→v3 轉換 |
| **部署** | sanitize 6 類預檢、本地 build 驗證（3 輪 LLM 修復）、Vercel 部署、版本回滾 |
| **迭代** | 對話內迭代修改、撤銷上一步、部署歷史回滾、迭代歷史追蹤、重複抱怨偵測+策略升級、視覺診斷指引 |
| **預覽** | Sandpack 真實 React 渲染、串流增量更新、裝置切換、編輯模式、圖片上傳 |
| **動畫** | BDD 需求藍圖面板（即時 Q&A 歷史視覺化）、3D 工廠流水線（Fast Build）、Remotion 驅動 |
| **認證** | Google/LINE OAuth、JWT 雙軌（localStorage + Cookie）、訪客→帳號合併、帳號綁定（雙登入）、auth 頁面 i18n（next-intl） |
| **儀表板** | 用戶統計、專案管理、版本歷史、管理員面板、LLM 用量追蹤（統一 PRICING + trackLlmUsage）、即時系統日誌監控（Socket.io tail -F）、Dashboard 元件 i18n（next-intl） |
| **可觀察性** | Sentry 前端錯誤追蹤（@sentry/nextjs，error boundary + replay + tunnel）、消息列表虛擬化（@tanstack/react-virtual，100+ 條 DOM < 30）、ChatMessageItem React.memo |
| **測試** | 關鍵路徑單元測試 239 條（intent-helpers/log-parser/deployer-sanitize/semantic-gateway），Vitest |
| **效能** | Redis 快取工具（`cached()` + `invalidateCache()`）、Dashboard admin stats 快取（5min TTL）、LATERAL JOIN 取代子查詢、GROUP BY 取代迴圈計數、複合索引（conversations/deployments/messages/llm_usage） |
| **i18n** | next-intl 多語系（zh/en）、UI 元件全量翻譯、Server Action 錯誤訊息 i18n（getTranslations）、lib 模組英文化、error code 機制、883 keys / 29 namespaces |
| **防護** | 三層防刷（前端冷卻 + API 限速 + Worker 鎖）、八層輸入防禦（含 Content Policy 語義審查 + Universal Input Quality Gate 亂碼/髒話/垃圾規則式攔截 + 設計問卷驗證）+ 違規冷卻升級（3→60s / 6→5min / 10→30min）、LLM 自動重試、Guest 限制（Fast Only + 一次使用 + 登入推薦） |
| **通知** | LINE 推播通知（BDD 完成/UIUX 生成完成/部署成功失敗），離線用戶也能收到；Telegram 同等里程碑通知 |
| **LINE Bot** | LINE 對話內完整 Fast Build 體驗（描述需求→生成→部署），Flex Message 卡片 + Quick Reply，客服問答（FAQ + Sonnet） |
| **Telegram Bot** | Telegram 對話內完整 Fast Build 體驗（描述需求→生成→部署），MarkdownV2 + Inline Keyboard；Login Widget 帳號綁定；里程碑通知 |
| **模板上傳** | 用戶提交專案為模板（preflight 自動檢查 + puppeteer 封面截圖 + 管理員審核），chatQuickReply + 專案管理入口 |
| **UX** | 對話回退、錯誤恢復、自動恢復對話、專案自動命名、Markdown 渲染、專案對話快捷入口（1-click）、專案置頂/取消置頂、Layout 黑屏防護（移除三層 opacity 動畫疊加 + 防 layout 抖動 + 預覽區 ErrorBoundary） |
| **穩定性** | FlowState 超時自動恢復（定時掃描 + LINE/Web 推送通知），伺服器重啟後自動恢復卡住的生成/部署任務 |
| **資料治理** | 訪客資料自動清理（5 天無活動過期），匿名帳號 + 已遷移空殼帳號定時清除，保護正在執行的 FlowState |

## 專案結構

```
app/
├── [locale]/             # i18n 路由群組（zh 預設 / en）
│   ├── page.tsx          # 主頁面（HomeContent 編排，~360 行）
│   ├── layout.tsx        # NextIntlClientProvider 注入
│   ├── dashboard/        # 儀表板頁面（/dashboard, /dashboard/admin）
│   ├── auth/             # 認證（login/callback/post-login）
│   ├── liff/             # LINE LIFF 入口
│   └── test/             # 開發測試工具
├── types/
│   └── chat.ts           # 共用型別（Message/SessionInfo/ConversationItem/COMMAND_KEYS）
├── actions/              # Server Actions
│   ├── index.ts          # 核心 Actions（對話/訊息/專案/BDD）
│   └── admin.ts          # 管理員 Actions
├── lib/
│   ├── vps-api.ts        # VPS HTTP 客戶端（~1900 行）
│   ├── llm.ts            # LLM 封裝（~2200 行）
│   ├── chat-utils.ts     # 聊天純函數（smoothEasing/STAGES/mapBackendStageToFrontend）
│   └── sandpack-utils.ts # Sandpack 預覽工具
├── hooks/
│   ├── useAuth.ts        # JWT 認證
│   ├── useChatScroll.ts  # 聊天滾動邏輯（auto-scroll/MutationObserver）
│   ├── useCodePreviewEditor.ts # 代碼預覽編輯模式（選取/修改/undo/localStorage）
│   ├── useChatPolling.ts # 消息輪詢（智慧退避 3s-15s）
│   ├── useChatSession.ts # 會話初始化 + 對話切換
│   ├── useLoginPrompt.ts # 登入提示觸發邏輯
│   ├── useAdminLogs.ts   # 管理員日誌串流 (Socket.io)
│   ├── useLocalePath.ts  # locale-aware window.location.href
│   └── useVpsWebSocket.ts # WebSocket
├── components/
│   ├── uiux/             # UIUX 元件（SandpackPreview/PreviewPanel/TemplatePicker）
│   ├── dashboard/        # 儀表板元件
│   ├── remotion/         # Remotion 動畫（fast-build/ + building-scene/）
│   ├── building-scene/   # 3D 場景入口（dynamic import）
│   ├── landing/          # Landing page 元件（15 個自包含組件）
│   │   ├── HeroSection.tsx      # Hero + 輸入 + 模式切換 + 最近專案
│   │   ├── UseCasesSection.tsx  # 用例展示
│   │   ├── HowItWorksSection.tsx # 流程說明
│   │   ├── StatsSection.tsx     # 統計計數器
│   │   ├── ComparisonSection.tsx # 功能比較表
│   │   ├── ShowcaseSection.tsx  # 作品展示
│   │   ├── FAQSection.tsx       # FAQ 區塊
│   │   ├── TestimonialSection.tsx # 推薦語
│   │   ├── CTASection.tsx       # CTA 區塊
│   │   ├── Footer.tsx           # 頁尾
│   │   └── index.ts             # Barrel re-export
│   ├── templates/         # 模板提交元件
│   │   └── TemplateSubmitModal.tsx # 模板上傳 Modal（preflight 檢查 + 表單 + 提交審核）
│   ├── chat/             # 對話相關元件
│   │   ├── ChatSection.tsx      # 對話組合容器（5 hooks + 核心邏輯，~994 行）
│   │   ├── ChatMessageList.tsx  # 消息列表（@tanstack/react-virtual 虛擬滾動）+ 輸入框
│   │   ├── ChatMessageItem.tsx  # 獨立消息組件（React.memo，從 ChatMessageList 抽出）
│   │   ├── ChatPreviewPanel.tsx # 右側預覽面板（BDD/FastBuild/CodePreview/Template）
│   │   └── MobilePreviewModal.tsx # 手機預覽 Modal
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
│   │   ├── orchestrator.ts       # Worker setup + handleProcessMessage + slim handleContinueFlow (~480 行)
│   │   ├── phase-router.ts       # Phase 路由分派（routePhase + deployer 子路由）
│   │   ├── intent-helpers.ts     # 意圖判斷 helper + 常數（hasDeployIntent 等）
│   │   ├── orchestrator-utils.ts # 共用函數（sendMessage/FlowState 等）
│   │   └── phase-handlers/
│   │       ├── bdd-phases.ts         # BDD 全流程（ES/Discovery/Clarify/Formulation/Spec）
│   │       ├── uiux-phases.ts        # UIUX 全流程（Discovery/Brief/Variant/CodePipeline）
│   │       ├── deploy-phases.ts      # 部署執行（prepareDeployment + executeDeployment）
│   │       └── fast-build-phases.ts  # 快速建站（一句話 → 跳過 BDD → 生成）
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
│   │   ├── telegram-notify.ts   # Telegram 里程碑推播通知（非 Bot 對話）
│   │   ├── telegram-full-push.ts # Telegram Bot 全量翻譯推送
│   │   ├── telegram-bot-handler.ts # Telegram Bot 業務邏輯（/start/文字/Callback）
│   │   ├── telegram-message-translator.ts # sendMessage → Telegram MarkdownV2+Keyboard
│   │   ├── customer-service.ts    # 客服問答（意圖偵測 + FAQ + Sonnet）
│   │   ├── classifier.ts         # 三層分類防禦
│   │   ├── bdd-to-ui-spec.ts     # BDD→UI 翻譯
│   │   ├── event-storming.ts     # Event Storming
│   │   ├── change-management.ts  # 需求變更管理
│   │   └── conversation-lock.ts  # 對話互斥鎖
│   ├── utils/
│   │   ├── log-parser.ts        # 日誌解析 + 敏感資訊遮罩（dashboard + Socket.io 共用）
│   │   ├── safe-parse-json.ts   # LLM JSON 安全解析（四層防禦，全後端共用）
│   │   └── is-confirmation.ts   # 確認語意偵測（三層：否定詞排除 → 短詞精確 → 長片語 includes）
│   ├── routes/                   # API 路由（conversation/project/session/bdd/templates/operations/auth/health/upload/line-bot/telegram-bot）
│   ├── __tests__/               # 單元測試（Vitest，239 條用例）
│   │   ├── intent-helpers.test.ts  # 意圖判斷純函數測試
│   │   ├── log-parser.test.ts      # 日誌解析/遮罩測試
│   │   ├── deployer-sanitize.test.ts # 部署預檢 7 層修復測試
│   │   └── semantic-gateway.test.ts  # 語義閘門零 LLM 短路測試
│   ├── lib/
│   │   ├── env.ts               # Zod 環境變數驗證，啟動時快速失敗
│   │   ├── anthropic.ts         # 統一 Anthropic Client + MODEL 常數 + PRICING + trackLlmUsage
│   │   ├── cache.ts             # 通用 Redis 快取（cached + invalidateCache）
│   │   ├── logger.ts            # Pino logger 工廠
│   │   └── specformula/         # SpecFormula TS（Java Reference Impl 移植，27 檔 ~3800 行）
│   │       ├── index.ts             # Public API 匯出
│   │       ├── context/             # ScenarioContext（per-scenario 狀態）
│   │       ├── helper/              # ISAFeatureArgumentResolver（VAR/CAS/TIME 三系統核心）
│   │       │                        # NamingConverter + TypeConverter
│   │       ├── http/                # HttpClientAdapter + TestRequest/Response + SupertestAdapter
│   │       ├── instruction/         # 7 個指令：TimeControl / EntitySetup / EntityValidate
│   │       │                        # EntityNonExistenceValidate / ApiCall
│   │       │                        # DataTableResponseValidate / JsonResponseValidate
│   │       ├── dialect/             # DatabaseDialect（PostgreSQL only）
│   │       ├── spec/                # ISA/API/DDL 讀取器 + Models
│   │       └── cucumber/            # Cucumber.js 整合（bootstrap + registerSteps + factory）
│   │
│   │   # SpecFormula 驗證（8 測試檔 217 案例 + E2E Cucumber 2 scenarios 9 steps）
│   │   # 執行：pnpm vitest run src/__tests__/specformula/
│   │   # E2E：TEST_DATABASE_URL=postgresql://localhost/test_db pnpm bdd
│   ├── schemas/                  # Zod API 請求 schema（conversation/session/operations/bdd/project/template-submit）
│   ├── db/client.ts              # PostgreSQL 客戶端
│   └── middleware/
│       ├── auth.ts              # JWT 認證中間件
│       └── validate.ts          # Zod 請求驗證中間件（validateBody/Query/Params）
├── migrations/           # DB 遷移（001-020）
│   └── 020_add_template_id_to_project_files.sql  # project_files.template_id，支援 seed 模板代碼
└── ecosystem.config.js   # PM2 配置

bdd-spec/                 # BDD Skill 定義（instructions/ + rules/ + scripts/）
uiux-skill/               # UIUX Skill 定義（instructions/ + rules/）
spec/                     # BDD 規格產出（features/ + data/ + actions/ + api/）
│   ├── api/              # OpenAPI Spec（4 檔 19 operations: conversation/session/project/bdd）
│   ├── data/             # schema.sql + entity_to_table_mapping.yml
│   └── isa.yml           # SpecFormula 配置（instruction patterns + data/api 路徑）
sdd.os/                   # SDD 上游 Reference Repo（git subtree，只讀參考）
│   ├── specformula-java/ # Java Reference Implementation（TS 移植的來源）
│   ├── specformula-python/  # Python 版（Placeholder）
│   ├── specformula-ts/      # TS 版（Placeholder，實作在 tellcraft-backend/src/lib/specformula/）
│   └── benchmark/           # 範例專案（guessing_game / todo_list / agent_hr_system）
```

## Roadmap（待實作）

### P0：Coder Skill Stage A — 後端代碼生成（✅ 已完成）

**Stage A 範圍**：純生成（不含 SpecFormula 驗證循環）。從 BDD 產出生成後端邏輯，把 mock 前端改寫為連接 Neon DB 的完整應用。

**觸發方式**：`uiux_complete` 時，若 BDD actionsYml 存在且 Neon DB 已就緒 → 顯示「接上資料庫」quickReply。也支援 Classifier 路由（`hasCoderIntent`）。Fast-build 模式不顯示（無 BDD 產出）。

**三層生成架構**：
```
Stage A 已完成：
├── lib/db.ts                          ← Neon 連接（固定模板，零 LLM）
├── lib/actions/<action>.ts            ← 純邏輯函數（LLM 逐 action，核心）
├── app/actions/<domain>.ts            ← Server Actions（零 LLM，按 entity 分組映射）
└── 改寫 UIUX 組件                      ← useState mock → Server Action 調用（LLM）

Stage B 待做：
└── app/api/<resource>/route.ts        ← API Routes（SpecFormula 測試用）
```

**核心檔案**：
| 檔案 | 說明 |
|------|------|
| `services/coder-generation.ts` (~500 行) | Pipeline 入口 + 7 個生成函數（parseActionsYml/generateActionFunction/generateServerActions/identifyMockDataComponents/rewriteComponentForServerActions） |
| `workers/phase-handlers/coder-phases.ts` (~200 行) | Phase handler：讀 BDD → 讀 UIUX → 執行 Pipeline → 保存 project_files(skill_source='coder') → 合併代碼 |
| `types/flow-state.ts` | 新增 `coderGenerationStartedAt` / `coderCompleted` / `coderPreRewriteCode` |

**四處同步**：`phase-router.ts`（coder_generating 攔截）+ `flowstate-recovery.ts`（15min 超時恢復）+ `intent-helpers.ts`（getPhaseStrictness: skip）+ `flow-state.ts`（3 個欄位）

**Deployer 整合**：`prepareDeployment()` 合併 uiux+coder 兩個 skill_source（coder 覆蓋同路徑），`BASE_DEPS` 已包含 `@neondatabase/serverless`

### P0b：Coder Skill Stage B — SpecFormula 驗證（✅ 已完成）

**核心目標**：生成 API Routes + SpecFormula 紅綠燈自動驗證循環。

- [x] ISA config 模板遷移到 sdd.os 標準 instruction_types（`entity_setup`/`api_call`/`entity_validate`/`entity_non_existence_validate`）
- [x] `isa-config.ts` instruction_type 映射 + config 結構更新到 sdd.os 格式
- [x] 生成 `app/api/<resource>/route.ts`（機械映射，零 LLM，複用 `lib/actions/*.ts`）
- [x] `UrlHttpAdapter`（native fetch）連接 Mini Express 測試伺服器
- [x] Feature File Direct Runner（`@cucumber/gherkin` 解析，不依賴 Cucumber.js runtime）
- [x] Mini Express Test Server（/tmp ~20MB，~3s 啟動，~50MB RAM，取代 Next.js build 500MB）
- [x] Neon DB 連線注入（`projects.neon_connection_string`）
- [x] SpecFormula 紅綠燈循環（測試 → LLM 修復 → 重測，最多 3 輪）
- [x] 測試結果結構化回饋（Feature/Scenario 通過/失敗明細）
- [x] `coder_testing` phase 狀態機（phase-router/flowstate-recovery/intent-helpers 四處同步）
- [x] 用戶觸發：Coder 完成後「驗證後端」quickReply（`__verify_backend__`）
- [x] `convertToOpenAPI()` 優化：優先使用 actionsYml 中的 method/path

### P1：BDD 格式遷移（ISA SpecFormula 標準）（✅ 在 P0b 開發中已完成）

BDD Skill 的 Feature File 輸出格式已從 Tellcraft 舊格式升級到 SpecFormula 標準：

- [x] `bdd-spec/instructions/03-formulation.md` — LLM prompt 格式說明改寫（Actor 前綴、status code 回應、VAR 系統）
- [x] `bdd-spec/rules/formulation-rules.md` — 語法規範同步
- [x] `bdd-spec/resources/templates/` + `examples/` — 範例改寫
- [x] `bdd-spec/scripts/lint-gherkin-format.ts` — ISA_PATTERNS regex 更新
- [x] `bdd-spec/scripts/validate-feature.ts` — E006/E007 格式檢查更新
- [x] `tellcraft-backend/src/services/formulation.ts` — LLM prompt 全面更新（至少 3 處）
- [x] `tellcraft-backend/src/services/isa-config.ts` — `buildInstructions()` 輸出格式改為 SpecFormula 標準

**端到端驗證（2026-03-15）**：三層格式一致性已確認 + DB 遷移 + Neon DB Provision 測試
- lint（8 種 ISA regex）+ validate（E001-E010）+ `generateIsaConfig()` + `matchStepToInstruction()` 全部對齊
- 模擬 Feature Files（3 檔 36 步驟）lint/validate/ISA Config/步驟匹配 100% 通過
- 真實 Podcast DB Feature Files（7 檔）已遷移至 ISA 格式：features_content（154 fixes）+ actions_yml_content（79 fixes）
- ISA Config 重新生成（`generateIsaConfig()`）：6 instructions、91 action_call + 41 entity_setup + 36 response_validate、覆蓋率 100%
- `schema-derivation.ts` 修復：支持 MySQL TABLE COMMENT / ENUM / DATETIME / REGEXP / 複合主鍵 / 分離 FK CONSTRAINT
- Neon DB Provision 端到端測試通過：建立 project（~2s）→ 7 張表 DDL 套用 → UUID/FK 驗證 → 測試插入成功
- Neon `aws-ap-northeast-1` 區域已移除，預設改為 `aws-ap-southeast-1`（env.ts + VPS .env）

### P2：部署 Pipeline 擴展（✅ 大部分已完成）

後端代碼**部署在同一個 Vercel Next.js app**（不需要額外 infra）：
- API Routes（`app/api/*`）和 Server Actions 都是 Next.js 內建，隨前端一起部署
- `@neondatabase/serverless` 專為 Vercel edge/serverless 設計，冷啟動 <100ms
- `DATABASE_URL` 由 Neon Provision Skill 自動注入 Vercel env vars

- [x] `deployer.ts` `prepareDeployment` 合併 `uiux` + `coder` 兩個 skill_source（coder 優先覆蓋同路徑）
- [x] `deployer.ts` `BASE_DEPS` 新增 `@neondatabase/serverless`
- [x] `project_files.skill_source` 新增 `'coder'` 值
- [ ] 部署後 E2E 連通驗證（CRUD 操作 → Neon DB → 回應正確）

### P3：其他待辦

- [ ] i18n Phase 3：VPS 後端錯誤訊息 error code 化 + LLM prompts i18n + Remotion 動畫標籤
- [ ] `sdd.os/` 上游同步機制（SpecFormula Java 更新時，同步到 TS 版）
- [x] ISA config 統一為 `api_call`（取代 `cucumberjs_server_action`，與 SpecFormula HTTP 測試對齊）— `isa-config.ts` L56

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
# 編輯 .env 填入 DATABASE_URL, REDIS_URL, JWT_SECRET, ANTHROPIC_API_KEY, UPLOAD_BASE_URL 等

# 4. 安裝依賴並 build
cd ~/tellcraft-repo/tellcraft-backend
pnpm install && pnpm build

# 5. 配置 Nginx
sudo cp nginx/tellcraft.conf /etc/nginx/sites-available/tellcraft
sudo ln -s /etc/nginx/sites-available/tellcraft /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 5.5 高併發 WebSocket（必做，否則容易在 ~700 連線附近出現 websocket error）
# /etc/nginx/nginx.conf：提高 worker 連線上限
sudo sed -i 's/worker_processes .*/worker_processes auto;/' /etc/nginx/nginx.conf
sudo sed -i 's/worker_connections .*/worker_connections 16384;/' /etc/nginx/nginx.conf

# 提高檔案描述符限制
echo '* soft nofile 200000' | sudo tee -a /etc/security/limits.conf
echo '* hard nofile 200000' | sudo tee -a /etc/security/limits.conf
echo 'fs.file-max = 400000' | sudo tee /etc/sysctl.d/99-tellcraft.conf
sudo sysctl --system

# 套用設定
sudo nginx -t && sudo systemctl restart nginx

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

# 並發監控（含 Socket 即時連線/峰值/錯誤分類）
curl http://54.238.4.117:8080/health/stats

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

### Phase 2：後端基礎設施統一（2026-03-07）

4 項後端技術債清理，提升開發體驗和生產可靠性：

1. **環境變數驗證**（`lib/env.ts`）：Zod 4 schema 三層分類（REQUIRED/OPTIONAL+預設/功能開關），啟動時 `validateEnv()` 快速失敗 + 明確錯誤訊息。index.ts/db/client.ts/middleware/auth.ts/routes/auth.ts 統一改用 `getEnv()` 取得型別安全的環境變數
2. **Anthropic Client 統一**（`lib/anthropic.ts`）：全 codebase 唯一的 `getAnthropicClient()` + `MODEL.SONNET`/`MODEL.HAIKU` 常數。消除 7 份重複 `getAnthropicClient()`、59 處硬編碼模型 ID。SDK 用戶（6 檔）改 import 單例；fetch 用戶（10 檔）改用 `getAnthropicHeaders()` + MODEL 常數
3. **Zod API 驗證**（`middleware/validate.ts` + `schemas/`）：`validateBody(schema)` 中間件工廠，高風險路由全覆蓋 — conversation（sendMessage/reply）、session（initialize）、operations（4 端點）、bdd（6 端點）、project（create/template-overrides），移除 ~100 行手動 `if (!req.body.xxx)` 驗證
4. **BullMQ DLQ**（`services/job-failure-handler.ts` + `migrations/013`）：`job_failures` 表持久化最終失敗、Socket.io 推送用戶錯誤消息+重試按鈕、FATAL log 觸發告警、`removeOnFail.age` 24h→7d

### Fast Build 單頁深度模式 + Animation 截斷修復（2026-03-14）

快速模式從多頁薄內容改為**單頁深度模式**，token 全部集中在首頁品質上：

- **頁面數限縮到 1**：`inferPages()` + `mergePages()` + `generateFastConcept()` 三層限制，只生成首頁
- **Section 豐富度指引**：`expandBriefPrompt` + Structure prompt 指引 5-8 個完整 Section（Hero→特色→功能→流程→數據→評價→CTA→Footer），Header 導航用 anchor link
- **Animation 截斷修復**：`generateAnimations` 首批 `maxContinuations` 從 `undefined` 改為 `fast ? 1 : 2`，防止無限續寫到 32768 截斷

### Fast Mode 設計創意提升（2026-03-14）

回填快速模式被砍掉的視覺錨點，讓生成結果從「能用」到「有辨識度」。淨 token 增量 ≤ 200：

- **精簡版 Techniques**：`formatTechniquesForPromptFast()` 只列 name + codeHint（一行），2 個技法 ~100 tokens（vs 完整版 3 個 ~400 tokens）
- **精簡版 Mood Code**：`getMoodCodeFragmentCompact()` 每個 mood 3 行核心 className 示範 ~40 tokens（vs 完整版 ~200 tokens），8 個 mood 全覆蓋
- **精選 Pattern**：快速模式從列出所有 pattern 名稱改為 `selectCompositionPatterns()` 精選 1 個 + skeleton 第一行 ~80 tokens
- **Temperature**：確認 `productContext.moodId` 在快速模式已正確傳遞，creative+mood 的 0.5 temperature 已生效

### Fast Mode Structure Prompt 瘦身（2026-03-14）

快速模式 `generateStructure()` system prompt 去重 + 場景感知，省 ~600-800 tokens（website 場景），不增加 LLM 調用：

- **`buildDesignSystemPromptFast()`**：移除和 CSS Variables 重複的顏色列表、typography scale JSON、間距 scale，精簡 shadows/gradients。CSS Variables 作為唯一顏色源
- **互動規則按 layoutMode 分支**：`layoutMode === 'website'` 使用 6 行 website 互動規則（CTA hover/表單 toast/FAQ 手風琴等），取代 28 行 CRUD 規則（create→Modal/delete→AlertDialog 等）。`layoutMode === 'app'` 和 normal UIUX 流程保留完整 CRUD 規則不變

### UIRequirementsSpec 結構化豐富 + actionsYml 注入（2026-03-13）

兩階段改進 BDD→UI 翻譯管線，讓 Sonnet 的 Structure 生成看到精確的欄位型別和驗證規則：

**階段 1：actionsYml 摘要注入 Haiku prompt**
- `summarizeActionsForUI()`（零 LLM）解析 actionsYml → 結構化文本注入 Haiku 翻譯 prompt
- systemPrompt 規則 13：Action 定義優先於 Feature File 推測
- `getTemplateAndBddSpec()` 擴展返回 `actionsYml` 欄位

**階段 2：UIRequirementsSpec 介面升級 + 零 LLM 後處理**
- **`UIEntityField` 介面**：entities.fields 從 `string[]` 升級為 `{ name, type?, required?, validation? }[]`
- **`enrichEntitiesFromActionsYml()`**（零 LLM）：Haiku 返回後用 actionsYml `types` 區塊精確覆寫 entity field type/required，用 `input.properties` 覆寫 action field type，用 `前置（參數）` rules 填充 validation
- **`formatUISpecForPrompt()` 豐富輸出**：Sonnet 看到 `orderNumber(string)*、amount(number)* [金額必須>0]` 而非 `orderNumber、amount`
- **Haiku JSON schema 更新**：entities 輸出改為 `{ name, type, required }` 物件格式
- **向下相容**：自動偵測 Redis 中舊格式 `string[]` 並正規化為 `UIEntityField[]`

### 迭代反饋循環修復（2026-03-13）

修復用戶反覆抱怨同一視覺問題（如「萬花筒花紋看不到」）但系統每次只做表層修改的問題。

- **迭代歷史注入**：`refineCode` 現在接收最近 3 次迭代歷史，讓 LLM 知道之前試過什麼、為什麼沒用
- **視覺診斷指引**：system prompt 新增 6 項排查清單（SVG ID 衝突、z-index、overflow、opacity、SSR 水合、條件渲染）
- **重複抱怨偵測**：`detectRepeatedComplaint()` 零 LLM 相似度比對（中文 bigram + 英文 word token + overlap coefficient ≥0.2），連續 ≥1 次相同抱怨即升級策略（強化排查指令 + temperature 0.2→0.4）+ 差異化成功訊息
- **SVG ID 碰撞檢查**：Quality Gate 新增 `checkIdUniqueness()`，掃描 components 中硬編碼的 SVG gradient/filter/clipPath ID，標記為 critical 由 Haiku 自動修復

### Seed 模板真實代碼（2026-03-12）

將後台 100 個 seed 模板轉換為與用戶投稿相同的格式——真實 React 代碼存入 DB，admin Sandpack 預覽走同一套 `loadPreviewFiles` 機制。

**核心方案**：`project_files` 加 `template_id UUID` 欄位 + `project_id` 改為允許 NULL。
- **Migration 020**：`project_files.template_id` + 唯一索引 + `chk_project_files_owner` 防同時 NULL
- **`seed-template-code-generator.ts`**：20 種 TemplateType 純 TS 代碼生成器（零 LLM），`detectType()` 以 category + tags 決定版型，輸出多檔案（page + components + style + config）
- **`GET /api/templates/:id/files`**：公開端點，回傳 template_id 關聯的 project_files
- **`getTemplateSeedFiles()`**：前端 vps-api.ts 新增函數
- **`loadPreviewFiles`**（admin/templates/page.tsx）：`sourceProjectId` 存在 → 走 project 路徑（用戶投稿）；否則先查 DB template_id files，無資料才 fallback 前端即時生成
- **`scripts/seed-template-files.ts`**：一次性腳本，連 DB 讀所有 seed 模板 → 生成代碼 → UPSERT

**VPS 執行順序**：
1. `psql "$DATABASE_URL" -f tellcraft-backend/migrations/020_add_template_id_to_project_files.sql`
2. 部署後端（`pnpm build && pm2 restart tellcraft-backend`）
3. `cd tellcraft-backend && DATABASE_URL="..." npx tsx scripts/seed-template-files.ts`

### Fast Build 效能優化（2026-03-09）

兩階段優化大幅降低 Fast Build 生成時間和 token 消耗：

**階段 1：砍頁數（最大收益）**
- **DEFAULT_PAGES 裁剪**：所有複雜類型上限 3-4 頁，只保留核心差異化頁面（ecommerce 7→4、saas 6→3、hotel 6→3 等），去掉通用頁（聯繫/FAQ/關於）
- **`mergePages()` 上限**：`maxPages` 7→4
- **`generateFastConcept` prompt**：suggestedPages 5-7→2-4 頁，驗證 `.slice(0,7)`→`.slice(0,4)`
- **`pickFirstBatchPages` 門檻**：`pages.length <= 1`→`<= 4`，4 頁以內一批完成（消除「繼續生成」暫停）

**階段 2：快速模式 Prompt 瘦身**
- **`generateStructure` fast 分支**：`generationProfile === 'fast'` 時跳過 techniques（~500-800 字）、patterns（~400-600 字）、moodCodeSection（~500-800 字）
- **3 個精簡函數**：`getCraftFoundationsFast()`（~150 字 vs 原 ~500 字）、`getStructureConstraintsFast(tier)`（~300 字 vs 原 ~800 字）、`getBaseRulesFast()`（~600 字 vs 原 ~1,800 字）
- **完整模式不受影響**：所有改動透過 `isFastMode` 分支隔離

**預期效果**：saas 130s→55s（-58%）、ecommerce 150s→60s（-60%）、Structure input tokens -40%、總 token -60%、消除用戶等待中斷

### Fast Build 頁面深度增強（2026-03-08）

（此版本已被上方效能優化取代）原先將複雜產品擴充到 5-7 頁，導致生成時間暴增。
- **`mergePages()` 工具函數**：DEFAULT_PAGES 為基底 + Haiku suggestedPages 補充，正規化去重
- **順序化執行**：先跑 concept → mergePages → 再跑 expandBriefPrompt
- **INTERACTION_HINTS 擴充**：補充各類型頁面的互動描述
- **測試**：`merge-pages.test.ts` 10 條（合併/去重/上限/空值降級/優先序）

### Fast Build 自動 Prompt 擴展（2026-03-06）

簡短描述（如「做一個咖啡廳網站」）自動擴展為完整網站需求，解決生成內容稀疏問題：
- **`expandBriefPrompt()`**（fast-build-generation.ts）：1 次 Haiku 將簡短描述擴展為 400-600 字完整內容需求（含具體區塊、示範文案、功能細節），中文 > 80 字 / 英文 > 40 詞自動跳過
- **順序執行**：先跑 `generateFastConcept`（取 suggestedPages）→ `mergePages` → 再跑 `expandBriefPrompt`（使用合併後的頁面列表）
- **注入 generateStructure**：`originalRequirements` 改用 `expandedPrompt || message`，Sonnet 生成時有足夠上下文
- **迭代上下文**：`executeIteration` 時注入擴展 prompt 為產品上下文（標註為理解用途，非修改指令）
- **FlowState 新欄位**：`fastModeExpandedPrompt`（存入 Redis，迭代/重試時可復用）
- **降級安全**：API 失敗/空回應/太短一律 return null，用原始描述繼續

### Fast Build 門面升級（2026-03-06）

5 項升級提升 Fast Build 設計品質與 UX：
1. **Haiku 概念生成**：+1 Haiku 調用生成 `FastConcept`（name/vibe/signatureElement/keyFeatures），注入 VariantConcept 驅動 Structure/Animation/RWD 三階段，設計獨特性大幅提升
2. **Tier 智能修正**：Haiku 同時判斷 `suggestedTier`，與規則不一致時以 Haiku 為準（解決「有設計感的 dashboard」誤判）
3. **Vague 輸入攔截**：`checkBuildRelevance` vague 分支拆開，回覆引導訊息 + quickReplies 範例（咖啡店/作品集/SaaS）
4. **失敗重試**：結構失敗/catch 附帶 `__retry_fast_build__` quickReply，handleContinueFlow 攔截後用 `fastModeOriginalMessage` 重新生成
5. **手機預覽 Modal**：< 768px 生成完成後顯示「查看預覽」按鈕，點擊展開全屏 SandpackPreview（含裝置切換 + 部署/修改按鈕）
6. **進度預估**：每階段推送 `estimatedSecondsRemaining`（240→120→60），前端顯示 `~X min`，最後 30s 顯示「即將完成」

### LINE Bot 客服問答功能（2026-03-06）

Fast mode 入口新增客服問答層，解決 LINE 用戶非建站輸入（問候/問題/閒聊）被錯誤引導的問題。

- **`customer-service.ts`**（新建）：`detectFastModeIntent()` 零 LLM 意圖分類（greeting/acknowledgment/question/help/chitchat）+ `getFaqReply()` 9 主題 FAQ 匹配 + `answerWithSonnet()` 開放問題 Sonnet 回答
- **問句排除邏輯**：帶建站強信號的問句（如「可以幫我做花店網站嗎？」）不被攔截，繼續走 fast build
- **9 個 FAQ 主題**：pricing/capability/limitations/howto/deployment/iteration/domain/support/about，中英雙語回覆 + 建站引導 quickReplies
- **handleContinueFlow 三處升級**：deployer_failed / deployer_complete / uiux_complete 的問候攔截 → `detectFastModeIntent()`，新增 question 分支（FAQ + Sonnet），不改變 FlowState
- **刪除 `isGreetingOrChitchat()`**：邏輯搬入 `detectFastModeIntent()`，新增 question/help 分類
- **stage `customer_service`**：LINE 正常推送（不在 SKIP_STAGES 中）

### UIUX Skill 全面修復（2026-03-07）

修復 2 個 Critical、3 個 High、4 個 Medium 問題。

- **C1 前端 richContent 渲染缺失**：`variant_picker`/`quality_gate_report`/`deploy_result`/`deployment_history` 四個 richContent type 後端有發送但前端未渲染。新增 4 個 dynamic import + 4 個渲染分支（`page.tsx`）
- **C2 deployer 異常路徑返回原始代碼**：`verifyBuildLocally` catch 區塊使用初始 `code`/`extraDependencies` 而非修復後的 `currentCode`/`currentExtraDeps`，部署時丟失所有 LLM 修復
- **H1 handleVariantSelection 早期 return 無反饋**：缺 sessionId/BDD Session 時靜默 return，用戶永遠不知道發生什麼。新增錯誤提示 + `__new_project__` quickReply + `deleteFlowState`
- **H2 proceedToVariantGeneration Path B 無降級**：Path B 變體生成失敗只顯示錯誤，改為降級回模板選擇。同時修復兩個缺 sessionId 的 early return
- **H3 adjustDesignBrief 丟失欄位**：`styleSummary`/`colorDirection`/`layoutSuggestion`/`referenceAnalysis` 缺 fallback，LLM 未返回時欄位為 undefined 覆蓋原值
- **M1 handleCodePhaseRedo 死代碼**：移除不可能觸發的 `case 'rwd'`（RWD 完成後 phase 直接設為 `quality_gate`）
- **M2 uiux_quality_gate 超時**：從 20 分鐘降至 10 分鐘（QG 通常秒級完成，新增獨立 `QUALITY_GATE_TIMEOUT_MS` 常數）
- **M3 ensureResponsiveClasses 冪等性**：單個 responsive class 就跳過整體注入，改為 ≥3 個才視為已處理

### 修復 LINE 完成對話問候語混亂引導（2026-03-06）

修復 LINE 用戶在專案完成後發送「嗨」等問候語，收到「請描述您想要修改的內容」迭代引導的問題。

- **根因**：`line_active_conversations` 映射在專案完成後不清除 → 問候語路由到舊對話 → `semanticGateway` 拒絕 → 回覆迭代引導
- **`isGreetingOrChitchat()`**（orchestrator.ts）：零 LLM 問候/閒聊/致謝偵測（精確正則匹配），在 `semanticGateway` 前攔截
- **三處攔截**：`uiux_complete`、`deployer_complete`、`deployer_failed` 的 `semanticGateway` 調用前插入，攔截後回覆友善上下文引導 + quickReplies（部署/新專案）
- **`__new_project__`**：`handleContinueFlow` 新增特殊值處理，清除 FlowState + LINE 映射 → 下次消息建新專案
- **`deleteLineActiveConversationByConversationId()`**（db/client.ts）：按 conversation_id 刪除 LINE 映射（Web 用戶幂等無害）

### 修復 Semantic Gateway 全面失效（2026-03-05）

修復客戶在 BDD 釐清和設計問卷階段所有正常回答都被拒絕的問題（「要後台管理系統」→「系統暫時無法處理您的回答」）。

- **根因 1（模型 404）**：`semantic-gateway.ts` 使用了不存在的模型 ID `claude-sonnet-4-6-20250514`（全 codebase 唯一），Anthropic API 返回 404 → fail-closed 拒絕所有送 Sonnet 的輸入。修正為 `claude-sonnet-4-6`
- **根因 2（BDD quickFilter 缺口）**：BDD clarify 的 quickFilter 只做 `hasSubstantiveContent` 過濾垃圾，通過後全部送 Sonnet。新增中文 ≥2 字 / 英文 ≥5 字有實質內容 → 零 LLM 直接 accept（只有 1-4 字短英文邊界案例才送 Sonnet）
- **根因 3（BDD fail-closed 不合理）**：BDD clarify 的 Sonnet API 錯誤全部 fail-closed。改為 fail-open（與 design_clarify 一致），因為到達 Sonnet 這步的 BDD 輸入已通過 `checkInputQuality(strict)` + `hasSubstantiveContent`，品質有保障。Iteration 保持 fail-closed

### Pipeline 需求失真修復（2026-03-05）

修復上游信號失真逐級放大問題：用戶提供 14 節超詳細展覽網站規格（Three.js 動畫、Scroll narrative、3D Gallery），只提到一句「要後台管理」，系統卻生成 44 個釐清問題（25+ 關於 CMS）、5 個全是 CMS 的設計變體、40% Admin 後台代碼。

**8 項修復**：
- **Fix 1（P0）PRD Discovery 需求權重感知**：`prd-discovery.ts` systemPrompt 新增需求權重分析 section（DETAILED/MENTIONED/IMPLIED 分類 + 問題分配正比於描述篇幅）
- **Fix 2（P0）Discovery 上限調降**：`computeDiscoveryLimits()` 最高 tier 50→35 題、40→30 題
- **Fix 3（P0）Variant 注入原始需求**：`generateDesignVariants()` 新增 `originalRequirements` 參數，prompt 頂部注入「用戶原始願景」section，BDD 規格改標為「功能清單 — 不代表設計優先級」
- **Fix 4（P0）Semantic Gateway 設計偏好降級放行**：`semantic-gateway.ts` 三處錯誤處理（API 錯誤/空回應/catch）對 `design_clarify` phase 改為降級放行（低風險輸入）
- **Fix 5（P1）Design Brief Fallback**：`buildFallbackBrief()` 從用戶設計偏好構建 fallback brief，Brief LLM 失敗時不再直接跳過（保留 tier 推斷）
- **Fix 6（P1）Structure Prompt 強化權重**：`productSection` 標籤改為「用戶的原始願景」+ 「代碼投入必須正比於用戶描述篇幅」
- **Fix 7（P1）Formulation Feature 權重**：`identifyFeatures()` systemPrompt 新增需求權重原則（附屬功能合併為 1 個 Feature）
- **Fix 8（P2）UISpec 翻譯 Retry**：BDD→UI 翻譯失敗後，用原始需求作為 fallback 再嘗試一次

### Universal Input Quality Gate（2026-03-04）

統一輸入品質閘門：純規則式（零 LLM）攔截亂碼/髒話/垃圾輸入，修復用戶發送 `AAAAAACCCCC`、`sssdsdsdasikwqherujqhweurhuweur`、辱罵內容暢通無阻的漏洞。

- **`prefilter.ts` 新增 `checkInputQuality()`**：`checkOffensive()`（~23 中英髒話 pattern）→ `checkGibberish()`（G1-G6 + G2b/G2c：同字元重複/短模式重複/去標點子模式重複/中文夾雜亂碼拉丁低 unique ratio/無母音/低 unique ratio/高子音密度/strict 短詞）→ `checkSpam()`（純數字/純數字符號/純符號）
- **`prefilterMessage()` 整合**：injection check 之後、rate limit 之前注入品質檢測，offensive 觸發違規累計
- **`handleContinueFlow` phase-aware gate**：go_back/retry 檢測後、phase 路由前二次攔截，`getPhaseStrictness()` 映射 strict/normal/lenient/skip，Redis anti-loop（3 次強制放行）
- **`semanticGateway` 前置檢查**：BDD 釐清調用 `checkInputQuality('strict')` 攔截亂碼，在 gateway 之前攔截。超短輸入（≤3 字元純拉丁）直接拒絕不送 Sonnet
- **`validateAnswer` regex 修正**：選項解析改為 `/^([A-Za-z])(?:[.:]\s*|\s+)(.+)/`（要求字母後有明確分隔符），防止 "agd" 被貪婪解析為「選 A 加備註 gd」
- **白名單**：~60 個技術縮寫（rwd/css/html/api/jwt...）不會被誤判為無母音亂碼
- **中英雙語 userMessage**：拒絕時顯示引導用語，不只是冷冰冰的錯誤
- **修復「不要部署」被當成迭代請求**：`hasDeployIntent()` 新增否定詞排除（不要/不想/別/先不...）+ `hasRejectDeployIntent()` 偵測拒絕部署意圖 → 回覆確認而非觸發迭代。`部屬` 加入 `部署` 的常見錯字別名。三個 phase（uiux_complete/deployer_complete/deployer_failed）均有處理

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

### 統一 Sonnet 語義閘門（2026-03-04）

`semanticGateway()`（`semantic-gateway.ts`）取代淺層函數（`analyzeAnswerRelevance` + `validateDesignAnswer` + keyword arrays），統一 BDD 釐清、設計問卷、迭代修改的輸入品質判斷。

- **quickFilter 零 LLM 短路**：`__skip__` / 選項 A-D → 直接 accept；BDD 釐清中文 ≥2 字直接 accept、英文 ≥5 字 + 有實質 → accept（短英文邊界才送 Sonnet）；Design 問卷 URL / 中文 ≥2 / 英文 ≥5 → accept；Iteration 設計關鍵詞 / ≥8 字有實質 → accept
- **Sonnet 語義判斷**（6 verdict）：valid / ambiguous / off_topic / seeking_help / evasive / content_policy，Sonnet 直接生成引導訊息（不再 code 硬寫模板）
- **階段差異化**：BDD 釐清較嚴格（「都可以」= ambiguous），設計問卷較寬鬆（「都可以」= valid），迭代修改以「設計師能否直接執行」為判斷基準（「改好一點」= ambiguous，「字大一點」= valid）
- **Anti-loop**：FlowState `semanticRejectCount`，BDD ≥3 次強制 accept；Iteration ≥2 次強制 accept（refineCode 有代碼上下文可兜底）；Design ≥2 次仍調 Sonnet 但一律顯示跳過按鈕
- **降級策略**：BDD + Design API 錯誤 / 空回應 / catch → **fail-open**（低風險，已通過 checkInputQuality + hasSubstantiveContent）；Iteration → **fail-closed**（需嚴格把關），配合 anti-loop 避免卡死
- **品質前置**：BDD 階段 `checkInputQuality('strict')` 攔截亂碼在 gateway 之前
- **迭代入口升級**：`deployer_failed` / `deployer_complete` / `uiux_complete` 三處 `isDesignFeedback()` → `semanticGateway({ phase: 'iteration' })`，`isDesignFeedback()` 僅保留給 fast mode 入口
- **`checkBuildRelevance` fail-closed**：API 錯誤 / 空回應 / JSON 解析失敗 / catch → 拒絕而非放行（保留無 API key 時的 fail-open）
- **成本**：Sonnet ~$0.003/次，但 quickFilter 放行率高，每個 session 預估 ~$0.01-0.03

### FlowState 超時自動恢復（2026-03-01，03-14 修復心跳）

伺服器重啟後，卡在「生成中」phase 的對話不再永久卡死。新增定時掃描（每 2 分鐘），主動偵測超時的 FlowState 並自動恢復 + 透過 `sendMessage()` 推送通知（Web Socket.io + LINE pushMessage）。

- **新增 `services/flowstate-recovery.ts`**：`scanAndRecoverStuckFlowStates()` 掃描所有 `flow:*` Redis keys，逐個檢查 phase + 超時
- **覆蓋 4 個 phase**：`fast_generating`(25min) / `uiux_iterating`(5min) / `uiux_code_generation`(20min) / `deployer_deploying`(10min)
- **恢復策略**：有代碼 → `uiux_complete`（保留進度）；無代碼 → 回到上一個穩定狀態；部署中斷 → `deployer_failed`
- **推送機制**：複用 `sendMessage()`，自動走 LINE/Web 管道（LINE 用戶也能收到恢復通知）
- **不掃描的 phase**：`formulation`（已有 checkpoint 恢復）、`spec_discovery`（已有超時跳過）、`waitingForReply=true` 的 phase
- **wiring**：`index.ts` 新增 `setInterval` 每 2 分鐘調用，與現有 `cleanupOrphanBuildDirs` 同模式
- **deployer 時間戳**：`orchestrator.ts` 進入 `deployer_deploying` 時設置 `uiuxCodeGenerationStartedAt`，供超時偵測使用
- **03-14 修復：post-processing 心跳**：streaming 結束後的 LLM 修復（fix_syntax/fix_truncated/repair_missing）現在透過 `callClaude` 的 `heartbeatFn` 每 30 秒刷新 Redis 活動心跳 + `onPartialCode` 步驟間刷新，避免 recovery 誤殺活躍 job。`FLOW_ACTIVITY_TTL_SECONDS` 60→180 秒。`repairMissingComponents` 禁止自動續寫（`maxContinuations: 0`）防止 4 次 8192-token 連續呼叫
- **03-14 修復：batch audit 誤判 + 頁面推斷**：`flattenBatchText` 預先移除 `data-animate="..."` 值避免 `hero-entrance` 觸發行銷 pattern；`inferPages` 新增英文頁面關鍵字（Dashboard/Users/Orders/Products/Analytics/Chat/Files/Settings 等 26 個）；`generateFastConcept` prompt 區分 app 型（不建議首頁/價格等行銷頁）vs 官網型（保留首頁+功能頁）

### 修復 Event Storming 確認語意辨識（2026-03-01）

`event-storming.ts` 的 `handleInitConfirm` 和 `handleESAnswer` 確認偵測邏輯有缺陷：缺少「沒錯」「對」「是的」等常見確認詞，且 `startsWith(k + ' ')` 要求空格分隔（中文不用空格），導致「沒問題啊」「好的繼續」全部匹配失敗，被當成修改反饋觸發 LLM 重新調整。

- **新增 `utils/is-confirmation.ts`**：三層匹配策略 — 否定詞防護（「但」「少了」「想改」等轉折詞直接排除）→ 短詞精確匹配（≤4 字元「好」「對」「嗯」等）→ 長片語 includes（「沒問題」「沒錯」「確認」「是的」等）
- **`event-storming.ts`**：L359 `handleInitConfirm` + L552 `handleESAnswer` 替換為 `isConfirmation()` 共用函數
- **注意**：新增確認詞或否定詞時統一修改 `is-confirmation.ts`，不要在各 handler 中 inline 判斷

### 快速模式輸入驗證修復（2026-03-01）

修復 Fast Mode 入口無輸入驗證的 bug：用戶輸入「111」「哈哈哈」等無意義文字時，系統直接啟動快速建站生成網站。

- **根因**：`handleProcessMessage` 的 `mode === 'fast'` 路徑直接呼叫 `executeFastBuildSkill()`，完全跳過意圖驗證
- **修復**：在 fast mode 入口加入 `isDesignFeedback()` 預驗證，攔截亂碼/問候/閒聊等無關輸入
- **九層防禦**：
  1. `prefilterMessage()`：冷卻期檢查 → 空訊息/超長 → injection（28 個 regex，含混合語言）+ 違規累計 → **品質閘門**（亂碼 G1-G6 + 髒話 ~23 pattern + 垃圾 2 規則）→ 頻率限制（30 秒 6 條），中英雙語
  2. `handleContinueFlow` phase-aware gate：`getPhaseStrictness()` strict/normal/lenient/skip 依 phase 動態調整，Redis anti-loop（3 次強制放行防卡死）
  3. `isDesignFeedback()`：fast mode 入口專用（亂碼/問候/閒聊/設計關鍵詞正向放行，僅零 LLM 粗篩）
  4. `classifyIntent()` **Content Policy**：Classifier prompt `contentFlag` 欄位（harmful/illegal/adult/hate/privacy），攔截不當需求（如「測驗有沒有得 XX 病」「做賭博網站」），正常醫療資訊網站放行
  5. `semanticGateway()`：**統一 Sonnet 語義閘門**（BDD 釐清 + 設計問卷 + 迭代修改共用），quickFilter 零 LLM 短路（設計關鍵詞/實質內容）→ Sonnet 六元判斷（valid/ambiguous/off_topic/seeking_help/evasive/content_policy），Sonnet 直接生成引導訊息。迭代階段 anti-loop ≥2 次強制放行
  6. `checkBuildRelevance()`：fast mode 語義相關性 + 具體性（強信號 ~80 詞直接放行 / 弱信號 Haiku 三元判斷）+ Content Policy，**fail-closed**（API 錯誤時拒絕而非放行）
  7. `classifyIntent()`：正常模式 Haiku 意圖分類（abuse 觸發 `recordAbuseViolation` 累計違規）
  8. `refineCode [NO_CHANGE]`：LLM 級別最後防線（迭代階段）
  9. **違規冷卻升級**：Redis `violation:{userId}` 計數器（24h TTL），3 次→60s / 6 次→5min / 10 次→30min 冷卻

### 統一 LLM JSON 解析防禦（2026-02-28）

全後端 13 個檔案統一使用 `safeParseJson`（`utils/safe-parse-json.ts`），修復 Haiku 模型偶爾用 4+ 反引號包裹 JSON 導致解析失敗的問題。

- **`safeParseJson` 增強**：四層防禦（code fence regex → 反引號清除 → 找首個 `{`/`[` → 清理尾隨逗號/控制字符）
- **12 個 service 替換**：`bdd-to-ui-spec`/`clarify-dedup`(×2)/`change-management`(×2)/`event-storming`/`classifier`/`spec-discovery`/`uiux-generation`(×3)/`prd-discovery`/`formulation`(×4) — 刪除各自的 regex 解析，改 import 共用函數
- **非 JSON code block regex**：`uiux-generation`(`parseGeneratedFiles`/`parseCompletedFileBlocks`)/`deployer`(`fixBuildErrors`/`parseLLMFixedFiles`)/`quality-gate`(`parseFixedFiles`) — `` ``` `` → `` `{3,} `` 支援 3+ 反引號
- **不改的部分**：`iteration-skill`(深複製)/`line-bot-handler`(Webhook)/Redis 讀取/`formulation` L564(Gherkin)/`actions-design`(YAML)

### i18n Phase 2：Error/Utility i18n（2026-02-28）

Server Action 錯誤訊息 + 工具模組國際化，+117 keys / 2 namespaces（`actionErrors` + `test`）。

- **Server Actions i18n**（原 9 檔，現存 2 檔）：`index.ts`/`templates.ts`，使用 `getTranslations('actionErrors')` from `next-intl/server`（`cloudflare.ts`/`porkbun.ts`/`domain.ts`/`vercel.ts` 等已遷移至 VPS 後端或刪除）
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

### Sandpack 多頁面路由（2026-03-06）

Sandpack 預覽支援多頁面導航。之前 Header 的 Link 按鈕點擊後會回到預覽首頁（因為 iframe 內無路由系統），現在用 hash-based routing 模擬 Next.js App Router。

**實作**（僅修改 `sandpack-utils.ts`）：
- **Router Context**：`SandpackRouterProvider` 監聽 `hashchange`，管理 `pathname` state
- **Link shim**：攔截內部連結點擊 → `location.hash = '#/about'`，外部連結/錨點放行
- **Navigation shim**：`usePathname()` 回傳當前路由（active link 高亮可用），`useRouter().push()` 更新 hash
- **Entry point**：多頁時自動生成路由表，import 所有頁面，根據 pathname 動態渲染
- **Layout 持久化**：Layout 包在 Router 外層，頁面切換時不重掛載
- 單頁應用（landing page）保持原有邏輯不受影響

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
- PropertyEditor 側邊欄（280px）：點擊元素後顯示屬性編輯器（文字/顏色/間距/圖片等即時編輯）；容器元素支援背景圖片上傳（backgroundImage/Size/Position/Repeat）
- 拖曳把手：選取元素四角顯示 resize handles，拖曳調整尺寸
- 批註系統：每個元素可添加修改說明，儲存時附加到訊息
- Undo/Redo（Cmd+Z / Cmd+Shift+Z）+ 儲存按鈕：將所有覆蓋彙整為訊息發送給 AI
- overrides/annotations localStorage 持久化（per conversation）
- 聊天附圖迭代：textarea 旁附件按鈕（最多 3 張），上傳後 URL 傳到後端 `refineCode`，Sonnet Vision 根據截圖 + 文字修改代碼。圖片 URL 同時注入系統提示和用戶訊息文字中，AI 可根據指令決定：直接嵌入圖片 URL 到代碼（作為 img/background），或觀察設計細節作為參考

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

### Classifier 防禦體系（2026-02-08，2026-03-04 重構）

- **Prefilter**（零 LLM）：冷卻期攔截 → injection 28 regex + 違規累計 → **品質閘門**（亂碼 6 規則 + 髒話 ~23 pattern + 垃圾 2 規則）→ Rate Limit 30s/6 條，中英雙語。**locale 由前端 `useLocale()` 貫穿到後端**：`page.tsx` → `vps-api.ts`（locale 參數）→ `conversation.ts`（透傳 job data）→ `orchestrator.ts`（prefilterMessage + FlowState 初始化），確保錯誤訊息語言與用戶 UI 語言一致
- **Content Policy**（Haiku）：Classifier prompt 新增 `contentFlag` 欄位，攔截 harmful/illegal/adult/hate/privacy 內容（如「測驗有沒有得愛滋病」「做賭博網站」），正常醫療/健康資訊網站放行
- **Phase-aware 品質閘門**：`handleContinueFlow` 內 phase 路由前二次攔截，嚴格度 strict/normal/lenient/skip 依 phase 調整，Redis anti-loop 計數器（連續 3 次垃圾強制放行防卡死）。`getPhaseQualityMessage()` 提供上下文感知的拒絕訊息（Q&A 階段引導選擇選項、設計階段引導描述偏好），取代 prefilter 的通用「做一個餐廳官網」訊息
- **統一 Sonnet 語義閘門**：`semanticGateway()`（`semantic-gateway.ts`）取代 `analyzeAnswerRelevance` + `validateDesignAnswer`，quickFilter 零 LLM 短路 ~80-90% → Sonnet 六元 verdict + 直接生成引導訊息，BDD/Design/Iteration 三階段共用但嚴格度差異化（iteration anti-loop ≥2 次放行）
- **違規升級**：Redis `violation:{userId}` 24h TTL，injection/abuse/offensive/contentPolicy 均累計，3 次→60s / 6 次→5min / 10 次→30min 冷卻
- **長文預過濾**（2026-03-06）：`prefilterLongRequirement()` — ≥60 字 + 需求關鍵詞 → 直接 `bdd-spec`，跳過 Haiku（省成本 + 防誤分類）。後驗證：Haiku 返回 meta-intent 但 ≥30 字含關鍵詞 → 覆寫為 `bdd-spec`（保留 contentFlag）。**根因**：Haiku 會把 500+ 字的詳細需求誤分類為 `onboarding`
- **正常模式**：Prefilter → **長文預過濾** → Classifier（Meta Intent + Content Policy + 後驗證）→ Skill Intent
- **快速模式**：Prefilter → `detectFastModeIntent()`（greeting/question/chitchat/help 攔截 + FAQ/Sonnet 回覆）→ `isDesignFeedback()` → `checkBuildRelevance()`（強信號 ~80 詞 / 弱信號 Haiku 三元：通過/模糊/不相關 + Content Policy，**fail-closed**）
- **迭代模式**：`semanticGateway({ phase: 'iteration' })` 取代 `isDesignFeedback()`（設計關鍵詞零 LLM 短路 ~80% + Sonnet 語義審核 ~20%）

### Phase 5-D：Prompt 架構重構 — 創意優先（2026-03-08）

- **systemPrompt 重排**：`generateStructure` 新順序 → 創作使命/設計使命（前 40%）→ mood → patterns → tier constraints → techniques → design system（技術 token）→ 任務定義 → data-animate 規格 → 合規規則（尾部）
- **新函數 `getTierCreativePhilosophy(tier)`**：creative「讓用戶第一眼就想截圖」/ functional「一秒就知道下一步」，取代開場句
- **新函數 `getBaseRules()`**：把 a11y/metadata/font/professional UI 規則抽成命名函數，統一移至 systemPrompt 尾部
- **新函數 `getDataAnimateSpec()`**：8 個 data-animate 值規格（fade-up/stagger-children/hero-entrance/reveal-on-scroll/count-up/slide-in-left-right/hover-lift/parallax）
- **`moodSection` 位置調整**：從 userMessage 移至 systemPrompt 第 2 個位置（primacy effect 優化）
- **`MOOD_CODE_FRAGMENTS`（design-moods.ts）**：8 個 mood 各 ~60-80 行 few-shot 代碼示範（card + hero + button），注入 userMessage 作為風格錨點
- **`getMoodCodeFragment(moodId)` / `getMoodById(moodId)`**：新 export
- **`generateAnimations` 新增段落**：`data-animate 意圖實作` — 找到所有 data-animate 元素，按對應表用 motion/react 實作後**移除屬性**
- **Temperature 調整**：generateStructure creative+mood `0.4→0.5`、creative `0.35→0.4`、functional `0.2→0.3`；generateDesignVariants creative `0.4→0.6`
- **測試**：33 條覆蓋 getMoodCodeFragment（8 個 mood / 未知 ID）、getTierCreativePhilosophy（截圖/一秒/差異）、getDataAnimateSpec（8 個值）、module 匯出驗證

### Phase 5-C：DesignSystem 2.0（2026-03-08）

- **DesignSystem 介面擴展**：新增 `shadows`（borders-only/subtle-shadows/layered-shadows）、`depth`（flat/subtle/elevated/glassmorphic + cardStyle）、`gradients`（primary/surface/accent）、`animationPersonality`（minimal/smooth/bouncy/dramatic/playful）、`layoutArchetype`（bento/editorial/dashboard/storytelling/app-shell）、`mood` 6 個 optional 欄位
- **`fast-build-generation.ts` 5 個純函數**（零 LLM）：`deriveShadows`（functional+dashboard/saas/tool → borders-only；creative+event/music/landing → layered-shadows+glow）/ `deriveDepth`（functional+dashboard/tool → flat；creative+portfolio → elevated+hover:shadow-lg）/ `deriveAnimationPersonality`（functional+dashboard → minimal；creative+portfolio/photography → dramatic；creative+event/music → bouncy）/ `deriveLayoutArchetype`（functional+dashboard → dashboard；creative+portfolio → editorial；creative+landing → storytelling）/ `deriveGradients`（functional → undefined；creative+landing/event/music → radial accent gradient）
- **`buildDesignSystemPrompt` 擴展**：新增陰影策略/卡片視覺深度/漸層規範/設計情緒基調四個條件渲染章節（無對應欄位時不渲染，向後相容）
- **`generateAnimations` 擴展**：moodId 優先，無 moodId 時降級用 `animationPersonality` → `getAnimationPersonalityHint()` 提供動畫指引
- **`generateStructure` 擴展**：`selectCompositionPatterns` 新增 `layoutArchetype` 參數傳遞
- **`synthesizeVariants` 擴展**：新增 `moodId?` 參數，expressive axis 合併 depth+shadows，layout axis 合併 layoutArchetype，最後設置 `result.mood`
- **`composition-patterns.ts` 擴展**：`selectCompositionPatterns` 新增 `layoutArchetypeHint?` 參數，對應 category 加 +20/+15 分（bento/editorial→content，dashboard→data，storytelling→hero+content，app-shell→shell）
- **`uiux-phases.ts` 更新**：`synthesizeVariants` 調用傳入 `state.uiuxDesignMood`
- **測試**：59 條覆蓋 deriveShadows/deriveDepth/deriveAnimationPersonality/deriveLayoutArchetype/deriveGradients/buildDesignSystemPrompt 向後相容/synthesizeVariants 新欄位合併/selectCompositionPatterns layoutArchetypeHint/buildDefaultDesignSystem 整合

### Phase 5-B：組合模式庫（2026-03-08）

- **`composition-patterns.ts`**（新建）：20 個 section-level 組合模式（Hero 4 + Content 7 + Data 5 + Shell 4），每個含具體 Tailwind 骨架
- **`selectCompositionPatterns(tier, productType, pages, moodId)`**：page-type 偵測（needsHero/needsData 保底）+ productType/mood 加權 + 互斥檢查，預設選 2 個
- **`generateStructure` 注入**：techniques 之後、組件規則之前注入 `formatPatternsForPrompt()`
- **`generateDesignVariants` 注入**：mood 之後、5 個設計軸之前注入 `listPatternsForVariants()` 供差異化
- **測試**：26 條覆蓋 tier 過濾/needsHero 保底/needsData 保底/mood 親和/互斥/數量限制/格式化

### 生成樣式品質升級（2026-03-08）

- **視覺技法庫**（`design-techniques.ts` 新建）：30 個結構化技法（Layout/Surface/Typography/Interaction），按 tier 和 productType 加權隨機選 3 個注入 Structure prompt
- **Prompt 重寫**：`getCraftFoundations()` 從禁止驅動 → 示範驅動（Instead of X → Try Y），新增 surface-1/2/3 表面分層指引
- **約束集具體化**：Creative tier 新增佈局選單（Bento Grid/Editorial Split/Sticky Scroll 等）；Functional tier 新增數據可視化替代方案表
- **VARIANT_AXES 具體化**：每個 axis 加入 3-5 個具體選項和靈感參考；新增強制差異化規則（3 種不同佈局 + 具體 signatureElement + 3 種不同字體）
- **設計系統升級**：`IndustryPalette` 新增 surface1/2/3/ring 欄位（24 個產業配色全部更新），`paletteToDesignSystem()` 輸出新色階
- **字體個性化**：portfolio/blog/agency/landing/event/music/salon/saas/dashboard/finance 更換更有辨識度的字體配對（Plus Jakarta Sans + Instrument Serif、Bricolage Grotesque 等）
- **deployer FONT_LOOKUP**：新增 14 個字體映射（Instrument Serif/Sans、Bricolage Grotesque、Libre Baskerville、Cormorant Garamond 等）
- **動畫約束**：`getAnimationConstraints()` 新增具體 motion/react 程式碼範例（入場/stagger/scroll reveal/card hover）
- **`buildDesignSystemPrompt()`**：新增 surface 色階顯示 + 顏色使用指引
- **`generateDesignVariants()`**：JSON schema 新增 surface1/2/3，新增簽名元素範例表

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
