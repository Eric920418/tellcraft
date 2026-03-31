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
| **預覽** | WebContainers（@webcontainer/api） | 瀏覽器內完整 Node.js + Next.js dev server |
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
  └─ BDD 完成後自動觸發（失敗時用戶說「連上資料庫」自動重試）
     schema.sql → Neon API → 建 DB + 套 Schema + RLS（同步 < 10s）
  │
  ▼
②b Feature Dry-Run（已完成 — SDD RED Phase）
  └─ Neon DB 建好後自動觸發
     用真實 DB 執行 Feature entity_setup → 驗證 entity/column/VAR 格式
     失敗 → LLM 修復 Feature → 重跑（最多 2 輪）
  │
  ▼
③ UIUX / Fast Build Skill（已完成）
  └─ 設計 → 生成前端代碼 → WebContainers 即時預覽
  │
  ▼
④ Coder Skill Stage A（✅ 已完成 — Per-SubOp 生成 + Code Template 模板化）
  ├─ 讀取 BDD 產出（actionsYml + schemaSql + entityMapping + features_content）
  ├─ 生成 lib/db.ts（Neon 連接，零 LLM）
  ├─ Per-SubOp 生成：Feature 按 When 步驟拆分子操作 → 每個子操作精準 Handler 選擇
  │   ├─ 已知 pattern（aggregate/create/update/delete/query_list/query_single/toggle/restore/export/cascade）→ Code Template 模板化
  │   │   └─ LLM 只提取 JSON 槽位（表名/欄位/條件）→ 模板保證 SQL 正確（COALESCE/GROUP BY/camelCase/_c()）
  │   └─ 未知 pattern → free-form LLM 生成（fallback），validateActionResponses 零 LLM 後置修正
  ├─ 零 LLM 機械組裝：import 去重 + helper 提升 + _stepSummary dispatch 排序
  ├─ 生成 app/actions/*.ts（Server Actions，零 LLM 機械映射）
  ├─ 生成 app/api/*/route.ts（API Routes，零 LLM）
  └─ 改寫 UIUX 組件（useState mock → Server Action 調用）
  │
  ▼
④b Coder Skill Stage B（✅ 已完成 — 自動觸發，逐 Feature 精準驗證）
  ├─ **Feature Alignment Gate**（阻斷式閘門，6 項深度對齊檢查 + LLM 自動修復，2 輪修不好阻塞 pipeline）
  ├─ RED Phase Layer 1: 11 個靜態檢查（零 LLM ~2ms）— Feature×actionsYml + Feature×Schema DataTable 深度對齊
  ├─ RED Phase Layer 2: StubHttpAdapter(501) + 真實 Neon DB 全場景驗證
  ├─ RED Phase Layer 2.5: RoutingStubAdapter（in-process Express 真實路由匹配，404 捕捉路由定義錯誤）
  ├─ BDD execution key 注入 Coder prompt（response field 名稱對齊）
  ├─ Template slot extraction 重試機制（失敗注入錯誤訊息重試，減少 free-form LLM fallback）
  ├─ _stepSummary dispatch 用 `===` 精確匹配（取代 `includes()`，防止子字串碰撞）
  ├─ Schema-aware deleted_at（softDeleteColumn optional，只有 Schema 有才加條件）
  ├─ 錯誤根因分類器（零 LLM）：VAR 解析失敗跳過代碼修復、auth 問題直接移除、SQL/dispatch/field 精準分流
  ├─ E2E 測試（/tmp Next.js dev + Puppeteer，含 backendFiles + JSX 截斷偵測）
  ├─ SpecFormula 逐 Feature 精準驗證（每 Feature 獨立 3 輪修復 → 多輪回歸修復 + scenario-level 智能跳過）
  ├─ Per-SubOp 精準修復：偵測組裝式代碼 → 只修失敗的子操作函數（不影響已通過的）
  ├─ 測試完成後重發 code_preview（含修復後代碼 + neonConnectionString）→ WebContainer 即時更新
  └─ 雙層完成驗證：測試全通過→部署(primary)；測試有失敗→重試(primary)+帶風險部署(secondary)+二次確認
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
| `coder` | 後端代碼生成 + 逐 Feature SpecFormula 精準驗證（每 Feature 3 輪修復 + 全量回歸） | Sonnet | ✅ 完成 |
| `domain-manager` | 域名管理：列出已有域名 / 引導購買或綁定 | — | ✅ 完成 |
| `domain-purchase` | 域名購買：RDAP → Porkbun → Cloudflare DNS → Vercel 綁定 | — | ✅ 完成 |
| `domain-dns` | 自有域名 DNS 綁定 + Cloudflare DNS CRUD | — | ✅ 完成 |
| `clone` | 網站復刻：URL 模式（Puppeteer 提取→逐 section Sonnet Vision 生成）/ 圖片模式（最多 5 張截圖→逐圖生成 page）/ 混合模式（URL+圖片參考）→ QG → 迭代/部署 | Haiku（圖片分析）+ Sonnet（生成） | ✅ 完成 |

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
    ↓ 10 層驗證防禦：
       L1-L2: VAR 對齊快檢 + Schema-aware 靜態分析（entity/column/VAR 流）
       L3-L4: ISA Format Lint（E001-E010）+ Validate（E011-E013 VAR 對齊 + 空 DataTable）
       L5: LLM 格式修復（最多 3 輪）
       L6: Feature Dry-Run（真實 Neon DB entity_setup + 2 輪修復）

Phase 3: Spec Discovery + Clarify
    ↓ S1-S6 品質審查（規則完整性/Example 覆蓋/邊界條件/格式/跨 Feature 一致/Schema 對應）
    ↓ 最多 2 輪 / 10 題，超額時按嚴重度截斷（不跳過）

白話化管線（PRD/Spec Clarify 共用）：
    LLM 生成 → whiteTextQuestion + whiteTextOptions（prompt 約束）
    → sendClarifyQuestion 前 sanitizeClarifyForDisplay()（規則式清洗，white-text-sanitizer.ts）
    → 前端展示純白話文字
    → DB 保留原始技術 question/options（供 Formulation 消費）

Phase 4: Actions Design → actions.yml（Sonnet LLM，三層防禦：autoCorrectSummaries 零 LLM 修正 + 動態 maxTokens 防截斷 + generateMissingActions targeted 補齊）
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
- **版本代碼下載 API**：`GET /api/project/:id/versions/:versionNumber/download-code`（從 `generations.code_snapshot` JSONB 讀取指定版本的代碼快照打包 ZIP）
- **前端 Route**：`/api/projects/[id]/download-code`（binary 透傳，不走 vps proxy，避免 JSON 解析損壞 binary）
- **版本下載前端 Route**：`/api/projects/[id]/versions/[versionNumber]/download-code`
- **UI**：Dashboard 專案列表每列加下載按鈕，免費方案 `opacity:0.4` + `cursor:not-allowed` + title 提示升級
- **版本下載 UI**：VersionHistory 組件每個有 `code_snapshot` 的版本顯示「下載代碼」按鈕
- **代碼快照**：`snapshotCodeToGeneration()` 在 UIUX/FastBuild/Coder/部署/迭代完成時自動快照 `project_files` 到 `generations.code_snapshot`（JSONB），失敗不阻塞主流程。舊版本無快照不顯示下載按鈕

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
| **部署** | sanitize 7 類預檢（含 'use server' 保護 + 未知依賴警告）、本地 build 驗證（3 輪 LLM 修復）、Vercel 部署、版本回滾 |
| **迭代** | 對話內迭代修改、撤銷上一步、部署歷史回滾、迭代歷史追蹤、重複抱怨偵測+策略升級、視覺診斷指引 |
| **預覽** | WebContainers 完整 Next.js 預覽（Server Actions + DB 連線）、HMR 增量更新、裝置切換、編輯模式、圖片上傳、Pre-boot + Pre-install 載入優化、生成期間禁止渲染（UIUX/Coder 生成時只顯示等待動畫）、路由衝突去重（strip route groups 防 parallel pages 錯誤） |
| **動畫** | BDD 需求藍圖面板（即時 Q&A 歷史視覺化）、3D 工廠流水線（Fast Build）、Remotion 驅動 |
| **認證** | Google/LINE OAuth、JWT 雙軌（localStorage + Cookie）、訪客→帳號合併、帳號綁定（雙登入）、auth 頁面 i18n（next-intl） |
| **儀表板** | 用戶統計、專案管理、版本歷史、管理員面板、LLM 用量追蹤（統一 PRICING + trackLlmUsage）、即時系統日誌監控（Socket.io tail -F）、Dashboard 元件 i18n（next-intl） |
| **可觀察性** | Sentry 前端錯誤追蹤（@sentry/nextjs，error boundary + replay + tunnel）、消息列表虛擬化（@tanstack/react-virtual，100+ 條 DOM < 30）、ChatMessageItem React.memo |
| **測試** | 關鍵路徑單元測試 241 條（intent-helpers/log-parser/deployer-sanitize/semantic-gateway），Vitest |
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
│   ├── webcontainer-utils.ts  # WebContainer 檔案轉換
│   └── webcontainer-cache.ts  # WebContainer deps 快取
├── hooks/
│   ├── useAuth.ts        # JWT 認證
│   ├── useChatScroll.ts  # 聊天滾動邏輯（auto-scroll/MutationObserver）
│   ├── useCodePreviewEditor.ts # 代碼預覽編輯模式（選取/修改/undo/localStorage）
│   ├── useChatPolling.ts # 消息輪詢（智慧退避 3s-15s）
│   ├── useChatSession.ts # 會話初始化 + 對話切換
│   ├── useLoginPrompt.ts # 登入提示觸發邏輯
│   ├── useWebContainerPreloader.ts # WebContainer 預載（生成時 pre-boot + pre-install）
│   ├── useAdminLogs.ts   # 管理員日誌串流 (Socket.io)
│   └── useLocalePath.ts  # locale-aware window.location.href
├── components/
│   ├── uiux/             # UIUX 元件（WebContainerPreview/PreviewPanel/TemplatePicker）
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
│   │       ├── fast-build-phases.ts  # 快速建站（一句話 → 跳過 BDD → 生成）
│   │       ├── coder-phases.ts      # Coder Skill（BDD→後端代碼→SpecFormula 驗證）
│   │       └── domain-phases.ts     # 域名全流程（搜尋/購買/綁定/DNS）
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
│   ├── __tests__/               # 單元測試（Vitest，241 條用例）
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
├── migrations/           # DB 遷移（001-024）
│   └── 024_add_neon_columns.sql  # 最新：Neon provisioning 欄位
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

### P0：Coder Skill Stage A — 後端代碼生成（✅ 已完成，Per-SubOp + Code Template）

從 BDD 產出生成後端邏輯，把 mock 前端改寫為連接 Neon DB 的完整應用。

**Per-SubOp 生成架構**（2026-03-27）：
- Feature 按 When 步驟的 `_stepSummary` 拆分子操作（建立/編輯/刪除/查詢/聚合 等）
- 每個子操作用 `inferOperationType()` 推斷操作類型 → 精準注入 1 個 Handler（非全部 5 個混打）
- 多操作 Feature（如 manage_todo）→ 並行生成各子操作 → `composeActionFunction()` 零 LLM 機械組裝
- 單操作 Feature（如 get_monthly_summary）→ 直接用精準 Handler 生成
- Unicode-aware 正則（`ID_PATTERN`）支援中文函數名

**Code Template 模板化**（2026-03-27）：
- 已知 SQL pattern 不讓 LLM 自由發揮，改用 LLM 提取 JSON 槽位 → Zod 驗證 → 模板渲染確定性代碼
- 7 個模板：`aggregate`（SUM/COALESCE/GROUP BY）、`export`（SELECT+ORDER BY）、`cascade`（transaction+FK 更新）、`create`（INSERT+RETURNING）、`update`（UPDATE+RETURNING）、`delete`（軟刪除）、`query_list`（SELECT+WHERE）
- `buildScopeClause()` 自動處理有/無 scope 欄位（fallback user_id）
- `INLINE_SNAKE_TO_CAMEL`（`_c` 函數）內嵌在每個模板中，不可被 composition helper 提取器拔走
- Slot 提取失敗 → 自動 fallback 到 free-form LLM（向後相容）
- `CODER_PER_SUBOP=false` 環境變數可一鍵關閉

### P0b：Coder Skill Stage B — SpecFormula 驗證（✅ 已完成）

生成 API Routes + SpecFormula 紅綠燈自動驗證循環。

**Per-SubOp 精準修復**（2026-03-27）：偵測組裝式代碼（`handle*` 子函數）→ 只修失敗的子操作 → 不影響已通過的。esbuild 語法驗證 + 不通過則回退原碼。

**SpecFormula VAR 系統全面修復**（2026-03-28）：解決 Coder Skill 26/44 場景失敗的根因 — 五層錯誤疊加修復：
- **Layer 1**：`extractAndStoreVariables` 同時存 executionKey 別名（`>lists.id` + `<listId` → 也存 `"listId"` → uuid）
- **Layer 2**：`ScenarioContext.get()` 支援數字後綴（`List1.id` → `listId`）+ 複數表名（`lists.id` → `listId`）
- **Layer 3**：`entity-setup`/`entity-non-existence-validate` fail-closed 防護（$variable null 時 throw 而非用字面字串）
- **Layer 4**：`api-call` $variable null fail-closed（所有參數類型，取代靜默 console.warn）
- **Layer 5**：`response-validate` 欄位不匹配時附帶 HTTP 回應（status + body），修復 LLM 能看到 400 錯誤根因
- **FIX_SYSTEM_PROMPT** 加 HTTP 診斷 + VAR 錯誤指引（教修復 LLM 識別框架錯誤 vs 代碼錯誤）
- **formulation.ts** 明確 `>contextKey` 命名規則：禁用表名（`>lists.id` ❌），必須用概念名（`>List1.id` ✅）
- **Handler 模板全面修復**：QUERY_LIST_HANDLER 加 snake_to_camel 轉換；DELETE_HANDLER/CASCADE_HANDLER 改為條件式（Schema 有 deleted_at → soft delete，沒有 → hard delete）；AGGREGATE_HANDLER 移除 deleted_at 硬編碼；COLUMN_ALIAS_HANDLER 移除 deleted_at 範例；Troubleshooting Guide 改為條件式規則；BASE_PROMPT + FIX_SYSTEM_PROMPT 加 deleted_at 防護
- **多行 Array 回應驗證**：`data-table-response-validate.ts` 從只驗 `rows[0]` 升級為逐行對齊 array 元素驗證（多行 DataTable 的每行對應 array 中的一個元素）；自動跳過 `index` 位置標記欄位
- **formulation.ts** 加規則：禁止 `index` 欄位 + Then summary 必須與 When 完全一致 + 多行 Array 格式說明
- **specformula-runner.ts** status code mismatch 資訊注入 step error（降級重試後失敗時附帶「預期 201 實際 400」上下文）；`ensureFkReferencesExist` FK 引用失敗改 throw（不再靜默跳過）

**WebContainer 預覽修復**（2026-03-27）：測試完成後重發 `code_preview` + `neonConnectionString`（修復後代碼），不再顯示修復前的舊版本。

### P1：BDD 格式遷移到 ISA SpecFormula 標準（✅ 在 P0b 開發中已完成）

Feature File 輸出格式從 Tellcraft 舊格式升級到 SpecFormula 標準（instructions/rules/scripts/formulation 全部更新）。

### P2：部署 Pipeline 擴展（✅ 大部分已完成）

後端代碼**部署在同一個 Vercel Next.js app**（API Routes + Server Actions 隨前端一起部署）。`@neondatabase/serverless` 冷啟動 <100ms，`DATABASE_URL` 自動注入。

- [x] `prepareDeployment` 合併 uiux + coder 兩個 skill_source（coder 優先覆蓋同路徑）
- [x] `BASE_DEPS` 含 `@neondatabase/serverless`，`KNOWN_PACKAGES` 含 `bcryptjs`/`jsonwebtoken`（Coder 常用）
- [x] `sanitizeCodeForDeploy` 'use server' 保護 + 未知依賴警告
- [ ] 部署後 E2E 連通驗證（CRUD → Neon DB → 回應正確）

### P3：其他待辦

- [ ] i18n Phase 3：VPS 後端錯誤訊息 error code 化 + LLM prompts i18n + Remotion 動畫標籤
- [ ] `sdd.os/` 上游同步機制（SpecFormula Java 更新時，同步到 TS 版）

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

# 6. Redis 生產配置（BullMQ 必要）
redis-cli CONFIG SET appendonly yes            # AOF 持久化
redis-cli CONFIG SET appendfsync everysec
redis-cli CONFIG SET maxmemory 512mb           # 防 OOM
redis-cli CONFIG SET maxmemory-policy noeviction  # BullMQ 要求
redis-cli CONFIG SET save ""                   # 禁用 RDB（AOF 已足夠）
redis-cli CONFIG REWRITE                       # 寫回配置檔
# 驗證：redis-cli INFO persistence | grep aof_enabled → 應為 1

# 7. 上傳目錄（圖片上傳功能）
mkdir -p /var/www/uploads/tellcraft

# 8. 啟動服務
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

### BullMQ 生產配置

**Redis 4 連線分離架構**（`index.ts`）：

| 連線 | 用途 | maxRetriesPerRequest |
|------|------|---------------------|
| `workerRedis` | BullMQ Worker（阻塞命令） | `null` |
| `queueRedis` | BullMQ Queue 生產者（`enableOfflineQueue: false`） | `null` |
| `eventsRedis` | QueueEvents 監聽 | `null` |
| `generalRedis` | FlowState/lock/cache/rate-limit/auth | `3`（快速失敗） |

**Worker 配置**（`orchestrator.ts`）：
- `concurrency`: env `WORKER_CONCURRENCY`（預設 8）
- `lockDuration`: 120s（預設 30s，LLM event loop jitter 安全餘量）
- `stalledInterval`: 120s（配合 FlowState recovery 2min 頻率）
- `maxStalledCount`: 2
- Job ID 去重：`msg:${conversationId}:${messageId}`

**Redis Server 必要設定**：
- `appendonly yes` + `appendfsync everysec`（AOF 持久化）
- `maxmemory 512mb` + `maxmemory-policy noeviction`（BullMQ 要求）

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

### 近期更新（2026-03-13 ~ 2026-03-25）

- **RED Phase 三層驗證 + 回歸保護 + 雙層完成驗證**（03-26）：(1) Layer 1 從 8→11 個靜態檢查，新增 Schema DataTable 深度對齊（Check 9 Column Coverage + Check 10 NOT NULL Completeness + Check 11 FK Reference Validity）；(2) 新增 Layer 2.5 RoutingStubAdapter — in-process Express 真實路由匹配（匹配→501，不匹配→404），透過 SupertestAdapter 做零啟動成本的 HTTP 驗證；(3) Stage B Phase 2 全量回歸從「修一次」升級為最多 2 輪智能修復迴圈，失敗集合相同自動跳過；(4) 雙層完成驗證：測試全通過→部署(primary)，測試有失敗→重試(primary)+帶風險部署(secondary)+二次確認閘門

- **WebContainer 載入優化**（03-19）：Pre-boot + Pre-install 機制 — 代碼生成期間自動預啟 WebContainer 並安裝 BASE_DEPS（next/react/tailwindcss 等 7 個核心包），生成完成時 node_modules 已就位，只需增量安裝額外依賴。`useWebContainerPreloader` 監聽生成階段觸發（`fast_generating`/`uiux_code_generation`/`uiux_variant_selection` 等），module-level singleton 跨對話復用。`writeFilesToContainer()` 逐檔寫入替代 `mount()`（後者會清除整個 fs 包括 node_modules）。預期首次預覽載入從 ~60s 降到 ~10-15s

- **Coder Skill 完整性修復**（03-19）：(1) cookies() try-catch 修復 WebContainer WASM 的 AsyncLocalStorage 不完整問題；(2) SpecFormula BDD 規格驗證改為自動觸發（不再需要用戶手動點按鈕）；(3) E2E 測試停止隱藏失敗（softFail 機制，通知用戶但不阻塞）；(4) LLM prompt 加強 DELETE/UPDATE ID 參數驗證；(5) deployer sanitizeCodeForDeploy 防禦性加固（跳過後端檔案的 React 修復）

- **Sandpack → WebContainers 全面替換**（03-17）：預覽引擎從 Sandpack（瀏覽器端 React bundler）遷移到 WebContainers（瀏覽器端完整 Node.js），支援 Server Actions + Neon DB 連線。刪除 sandpack-utils.ts（1540 行）+ SandpackPreview.tsx（420 行）
- **預覽空白三修**（03-17）：(1) 預覽 `index.html` 補 `html,body,#root{height:100%}`，修復全屏 canvas/intro 組件父容器高度坍塌導致空白；(2) `customer-service.ts` 新增 `platform_issue` 意圖偵測，用戶回報「預覽空白/看不到頁面」時回覆操作指引而非誤跑 refineCode；(3) 手機版收到 `code_preview` 時自動彈出 `MobilePreviewModal`，不需手動點按鈕
- **AI 回覆打字機動畫**（03-17）：AI 對話文字逐字顯示（~2 秒跑完），polling 拿到完整訊息後前端 `ChatMessageItem` 內部動畫 + 閃爍游標，打字完成才顯示 quickReplies。後端 `answerWithSonnet` 改為 SDK streaming + `streamLlmMessage`（為未來 WSS 準備）
- **Coder Stage B 100%**（03-16）：91/91 scenarios 全過，Runner 修復歷程 0%→69%→100%（bcryptjs hash/FK 自動建立/UUID tolerance/array matching 等）
- **Deployer 防爆修復**（03-16）：KNOWN_PACKAGES +bcryptjs/jsonwebtoken、'use server' 保護、未知依賴警告
- **Fast Build 單頁深度**（03-14）：多頁→只做首頁 5-8 Section，Animation 截斷修復
- **Fast Mode 創意回填**（03-14）：精簡版 Techniques/Mood Code/Pattern 注入（淨 +200 tokens）
- **Fast Mode Prompt 瘦身**（03-14）：buildDesignSystemPromptFast + layoutMode 分支（省 600-800 tokens）
- **黑屏二修**（03-14）：消除三層 opacity 疊加 + layout 抖動 + ErrorBoundary
- **UIRequirementsSpec 升級**（03-13）：actionsYml 注入 + UIEntityField 結構化 + enrichEntitiesFromActionsYml 零 LLM 後處理
- **迭代反饋循環**（03-13）：歷史注入 + 視覺診斷指引 + detectRepeatedComplaint + SVG ID 碰撞檢查
- **Supabase→Neon 遷移**（03-13）：同步 <10s、砍掉 Redis 追蹤/polling，neon-service.ts 取代 supabase-service.ts

### 基礎設施與品質（2026-03-01 ~ 2026-03-12）

- **Seed 模板真實代碼**（03-12）：100 個 seed 模板→真實 React 代碼存 DB（migration 020 + seed-template-code-generator.ts 零 LLM）
- **Fast Build 效能優化**（03-09）：DEFAULT_PAGES 上限 3-4、mergePages 上限 4、Prompt 瘦身 3 個精簡函數。saas 130s→55s
- **Phase 5-D/C/B**（03-08）：Prompt 架構重構（創意優先）+ DesignSystem 2.0（shadows/depth/gradients/animationPersonality）+ 組合模式庫 20 個 + 視覺技法庫 30 個
- **後端基礎設施統一**（03-07）：env.ts Zod 驗證 + anthropic.ts 單例 + Zod middleware + BullMQ DLQ
- **UIUX 全面修復**（03-07）：2C+3H+4M（richContent 渲染缺失/deployer 異常路徑/variant 早期 return 等）
- **Sandpack 多頁路由**（03-06，已移除）：hash-based routing 模擬 App Router（已被 WebContainers 原生路由取代）
- **客服問答**（03-06）：customer-service.ts detectFastModeIntent + FAQ 9 主題 + Sonnet 開放問答
- **Fast Build 門面升級**（03-06）：Haiku 概念生成 + Tier 修正 + Vague 攔截 + 失敗重試 + 手機 Modal + 進度預估
- **Pipeline 失真修復**（03-05）：8 項（PRD 權重感知 + Discovery 上限調降 + Variant 注入原始需求 + Brief Fallback 等）
- **Semantic Gateway 修復**（03-05）：模型 ID 404 + BDD quickFilter 缺口 + fail-open 策略
- **Quality Gate + Prefilter**（03-04）：統一 Sonnet 語義閘門 + Universal Input Quality Gate（亂碼/髒話/垃圾）+ checkBuildRelevance fail-closed
- **FlowState 自動恢復**（03-01，03-14 修復心跳）：定時掃描 + 4 phase 超時偵測 + LINE/Web 推送 + heartbeatFn 防誤殺
- **ES 確認語意修復**（03-01）：is-confirmation.ts 三層匹配
- **Guest 限制**（03-03）：Fast Mode Only + 一次使用 + 雙重防繞過
- **專案快捷入口**（03-03）：Dashboard/首頁一鍵進入對話

### Coder Pipeline 可靠性提升（2026-03-31）

**Feature Alignment Gate（阻斷式閘門）**：
- **新服務 `feature-alignment-gate.ts`**：在 RED Phase 之後、代碼生成之前，執行 6 項深度對齊檢查 + LLM 自動修復（最多 2 輪），修不好則阻塞 pipeline 而非帶病生成
- **6 項檢查**：Summary 唯一性（子字串碰撞偵測）、Entity Setup Column Coverage、FK Reference 完整性、Response Field 命名一致性、VAR-System 對齊、Summary ↔ actionsYml 精確匹配

**代碼生成確定性增強**：
- **Slot extraction 重試**：`extractSlots()` 第一次 JSON/Zod 失敗後注入錯誤訊息 + 上次輸出重試一次，大幅減少 free-form LLM fallback
- **`===` 精確匹配 dispatch**：`composeActionFunction` 和所有 prompt 從 `op.includes('xxx')` 改為 `op === 'xxx'`，徹底消除子字串碰撞。parser 向後相容兩種格式
- **Schema-aware `deleted_at`**：`softDeleteColumn` 從 `.default('deleted_at')` 改為 `.optional()`，slot extraction prompt 指示只有 Schema 有此欄位才填。template 條件生成 `AND deleted_at IS NULL`

**Fix Loop 收斂性增強**：
- **錯誤根因分類器**（零 LLM）：`classifyFailureRootCause()` 區分 dispatch/column/status/field/sql/auth/var/fk 8 類根因。VAR 解析失敗跳過代碼修復（Feature 問題）、auth 問題直接 `removeAuthChecks()`
- **Scenario-level 收斂偵測**：回歸修復的「無進展」偵測從 feature-level 升級為 `featureName::scenarioName` level，避免同 Feature 內不同 scenario 輪流失敗被誤判

### SpecFormula + Coder Pipeline 全鏈路修復（2026-03-29 ~ 2026-03-30）

**SpecFormula 測試引擎修復（14 個確定性修復）**：
- **Rule-level Background 解析**：`specformula-runner.ts` 的 `processGherkinFeature()` 忽略了 Gherkin Rule 內的 Background 步驟，導致 Rule-level entity_setup 不執行 → VAR 永遠存不進 ScenarioContext
- **`import { sql }` 安全網**：`coder-generation.ts` 的 `composeActionFunction()` + 單操作路徑，自動偵測代碼使用 `sql` 但沒 import 時注入 `import { sql } from '@/lib/db'`
- **entity_validate `>id` 容錯**：`entity-validate.ts` 的 `extractAndStoreVariables()` 當 data row 不是 `<executionKey` 格式時跳過而非 throw；`findActual()` PK 查詢加 `>` 前綴 fallback
- **bcrypt hash 防護**：`entity-setup.ts`/`api-call.ts`/`entity-non-existence-validate.ts`/`entity-validate.ts` 的 fail-closed 檢查從 `startsWith('$')` 改為 `/^\$[a-zA-Z]/`，避免 `$2b$10$...` bcrypt hash 被誤判為 VAR 引用
- **日期格式容錯**：`data-table-response-validate.ts` 加入日期前綴匹配（`"2099-12-31"` 匹配 `"2099-12-31T00:00:00.000Z"`）
- **`回應, with JSON:` 步驟匹配**：`specformula-runner.ts` 的 `matchStepToInstruction()` 加二輪容錯，自動將 `回應, with JSON:` 正規化為 `回應為, with JSON:`
- **entity_non_existence_validate soft-delete 感知**：`existsByPk()`/`existsByProbe()` 檢查 `deleted_at` 欄位，已軟刪除的記錄視為「不存在」
- **通用 response wrapper 偵測**：`validateActionResponses()` 加 Rule 1.5，偵測任何 `return { key: rows }` 模式（不限 `items`/`data`/`records`）自動拆為 bare Array

**Coder 代碼生成確定性模板擴充**：
- **3 個新模板**：`query_single`（SELECT WHERE id + 404 處理）、`toggle`（UPDATE SET field = NOT field）、`restore`（UPDATE SET deleted_at = NULL）— 搭配 Zod slot schema + render function
- **關鍵字修正**：`'切換'` 從 UPDATE → 獨立 TOGGLE 類型；`'取消'` 從 DELETE 移除避免「取消刪除=復原」誤判；新增 TOGGLE_KEYWORDS/RESTORE_KEYWORDS
- **QueryList filters 擴充**：`QueryListSlotSchema` 新增 `filters` 欄位支援動態 WHERE 條件（=, <, >, IS NULL 等）
- **列表 handler 參數防禦**：`QUERY_LIST_HANDLER` prompt 禁止 `if (!input.filter) throw`；`validateActionResponses` Rule 1.8 自動移除列表篩選參數的 throw

**Coder 組件改寫強化**：
- **截斷 → diff 重試**：`rewriteComponentForServerActions()` 全文改寫截斷（JSX 標籤不平衡）後自動用 SEARCH/REPLACE diff 模式重試，不再靜默回退原始版本
- **token 估算提高**：`/3 + 2048` → `/2 + 4096`，最低 maxTokens 從 8192 提高到 16384
- **mock data 掃描 + 二次改寫**：`scanForRemainingMockData()` 零 LLM 掃描改寫結果是否仍有 mock import/硬編碼陣列 → `retryRewriteForMockData()` 用 diff 模式修復 → 二次掃描仍殘留則記入 `mockDataWarnings`
- **用戶通知**：`CoderOutput.mockDataWarnings` + 完成訊息附加 ⚠️ 警告，不再靜默吞掉改寫失敗
- **分支參數提取**：`extractInterfacesFromActionFile()` 額外提取每個 dispatch 分支的 `input.xxx` 參數引用，改寫 LLM 知道每個操作需要哪些參數
- **列表查詢指引**：`buildRewriteSystemPrompt()` 加強列表查詢指引，告知改寫 LLM 傳合理預設值

**BDD Feature 後置驗證**：
- **`sanitizeFeatureContent()`**：零 LLM 自動修正 — `回應, with JSON:` → `回應, with table:`、`回應為, with JSON:` → `回應, with table:`、entity_validate header `>id` → `id`
- **formulation prompt 強化**：明確禁止 entity_validate 使用 `>contextKey`；`>contextKey`/`<executionKey` 只用於 Given 準備和 Then 回應

### 核心功能建設（2026-02-24 ~ 2026-02-28）

- **LLM JSON 解析統一**（02-28）：safeParseJson 四層防禦，12 service 替換
- **i18n Phase 1+2**（02-28）：766→883 keys / 27→29 namespaces，Server Action error code 機制
- **LINE Bot 深度整合**（02-27）：Webhook+Handler+Translator+Full Push，完整 Fast Build 生命週期
- **帳號綁定**（02-27）：user_providers 表 + Google↔LINE 雙綁 + 解綁保護
- **LINE LIFF + 推播**（02-27）：Flex Message 卡片 + LIFF 深度連結 + Stage 配色
- **BDD 需求藍圖面板**（02-27）：純 React Q&A 歷史面板（取代 3D 鍛造場景）
- **Sandpack 串流防閃爍**（02-28，已移除）：providerKey 凍結 + 增量 updateFile + 輪詢去重（已被 WebContainers HMR 取代）
- **預覽編輯模式**（02-26，03-01 升級）：多選 toggle + PropertyEditor + Undo/Redo + 聊天附圖迭代
- **Classifier 防禦體系**（02-08，03-04 重構）：9 層防禦 + Content Policy + Phase-aware 品質閘門 + 違規升級
- **防刷三層防護**（02-26）：前端冷卻 + Redis Lua 限速 + Worker 對話鎖

### 早期功能建設（2026-01-31 ~ 2026-02-25）

- **BDD Skill 完整流程**（02-24~25）：ES Phase 0 + Discovery/Clarify/Formulation + Actions Design + ISA Config + 變更管理 + 回退/恢復
- **UIUX 生成重構**（02-05）：5 變體 + Design System + Structure→Animation→RWD 三階段
- **Fast Build**（02-09，02-25 升級）：一句話建站 + 25 產品類型 + 22 配色 + Tier 偵測 + App/Website 佈局
- **Quality Gate**（02-06）：A11y/Performance/Code Quality 靜態檢查 + Haiku 自動修復
- **即時預覽**（02-06~08，03-17 遷移至 WebContainers）：串流增量更新 + 裝置切換 + BDD→UI 翻譯 + VariantConcept
- **3D 動畫**（02-24~25）：BDD 低多邊形城堡 + Fast Build 3D 工廠流水線（Remotion + Three.js）
- **VPS 後端遷移**（02-03）：Vercel Serverless → Express + BullMQ + Socket.io
- **認證系統**：Google/LINE OAuth + JWT 雙軌 + 訪客帳號合併
- **儀表板**：用戶/管理員面板 + 專案管理 + LLM 用量追蹤
- **智能模板匹配**（02-15）：三層評分引擎（零 LLM）
- **迭代 Skill 拆分**（02-16）：iteration-skill.ts + 撤銷 + 回滾
- **PRD Discovery + Feature Files**（01-31）：多輪釐清 + 分批生成 + 語意去重 + Token 優化

</details>
