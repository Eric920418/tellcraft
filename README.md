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
| **後端** | Express + BullMQ + LangGraph + Socket.io | VPS 部署，PM2 管理（LangGraph 由 `USE_LANGGRAPH` feature flag 控制） |
| **資料庫** | PostgreSQL（VPS 本地） | 低延遲，自主控制 |
| **佇列/狀態** | Redis | BullMQ 任務佇列 + 串流狀態 |
| **LLM** | Claude Sonnet / Haiku | Anthropic SDK + Structured Outputs + Prompt Caching |
| **動畫** | framer-motion (v12+) + Remotion | 需求藍圖面板 + 串流動畫 |
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

# Skill Telemetry 週報（人工回灌 prompt 用，含 delta + 效應追蹤）
cd tellcraft-backend && pnpm tsx src/scripts/telemetry-weekly-report.ts              # 7 天 markdown
cd tellcraft-backend && pnpm tsx src/scripts/telemetry-weekly-report.ts --days=1     # 1 天
cd tellcraft-backend && pnpm tsx src/scripts/telemetry-weekly-report.ts --json       # JSON

# Prompt Change 註冊（改了 prompt 或加了 code rule 後執行）
cd tellcraft-backend && pnpm tsx src/scripts/register-prompt-change.ts --pattern <key> --skill <name> --action <type> --target <file>
cd tellcraft-backend && pnpm tsx src/scripts/register-prompt-change.ts --list        # 列出
cd tellcraft-backend && pnpm tsx src/scripts/register-prompt-change.ts --retire <id> # 汰換
```

### SEO + GEO 配置

**架構**：首頁 `page.tsx` 是 Server Component，JSON-LD 結構化資料和 SEO 文字內容在 SSR 階段渲染（爬蟲可直接抓取）。互動邏輯在 `HomeClient.tsx`（Client Component）中。

| 項目 | 檔案 | 說明 |
|------|------|------|
| i18n Proxy | `proxy.ts` | next-intl proxy（Next.js 16 取代 middleware），攔截無 locale 前綴的請求 rewrite 到 `app/[locale]/`（`/` = en、`/zh` = 中文，瀏覽器語言自動偵測）。排除 `api/`、`_next/`、`monitoring`、`uploads/`、靜態檔案 |
| 安全 Headers | `vercel.json` | `X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy`、`COOP/COEP`（WebContainers 需要） |
| robots.txt | `app/robots.ts` | 允許公開頁面 + **AI 爬蟲明確允許**（GPTBot、ChatGPT-User、ClaudeBot、PerplexityBot、Google-Extended），禁止 dashboard/auth/api/test/liff |
| sitemap.xml | `app/sitemap.ts` | 公開頁面 + hreflang（en/zh-TW），lastModified 用固定日期（非 `new Date()`） |
| manifest.json | `app/manifest.ts` | PWA manifest（standalone） |
| favicon.ico | `app/favicon.ico` | 從 icon.png 轉換（16/32/48px） |
| Metadata | `app/[locale]/layout.tsx` | metadataBase + title template + OG（動態生成 1200x630）+ Twitter Card + canonical + 長尾關鍵詞 |
| OG Image | `app/[locale]/opengraph-image.tsx` | 動態生成 1200x630 OG 圖片（Edge Runtime，含品牌色、tagline、locale 適配） |
| noindex | `app/[locale]/{dashboard,auth,test,liff}/layout.tsx` | 非公開路由 noindex/nofollow |
| JSON-LD | `app/[locale]/page.tsx`（Server Component） | Organization + WebSite + SoftwareApplication + FAQPage + **HowTo** + **Speakable** |
| Breadcrumb | `app/[locale]/templates/TemplatesPage.tsx` | BreadcrumbList（Home → Templates） |
| 字體 | `app/[locale]/layout.tsx` | next/font（Noto Sans TC + IBM Plex Mono），消除 render-blocking |
| 結構化資料工具 | `app/lib/structured-data.ts` | JSON-LD schema 生成函數（7 個 schema type） |
| **GEO: llms.txt** | `public/llms.txt` | AI 引擎專用站點說明（類似 robots.txt 但面向 LLM），描述產品功能、頁面、目標用戶 |
| **GEO: SSR 內容** | `app/[locale]/page.tsx` | Server-side 渲染 SEO 隱藏內容（h1、產品描述、HowItWorks 步驟、FAQ details/summary），確保爬蟲不需 JS 即可讀取 |

### 環境變數

**前端**（`.env.local`）：
`VPS_API_URL` `NEXT_PUBLIC_VPS_API_URL` `NEXT_PUBLIC_VPS_WS_URL` `NEXT_PUBLIC_UPLOAD_BASE_URL` `NEXT_PUBLIC_SUPABASE_URL` `NEXT_PUBLIC_SUPABASE_ANON_KEY` `NEXT_PUBLIC_LIFF_ID` `NEXT_PUBLIC_SENTRY_DSN` `SENTRY_ORG` `SENTRY_PROJECT` `SENTRY_AUTH_TOKEN`

**後端**（`tellcraft-backend/.env`）：
`DATABASE_URL` `REDIS_URL` `JWT_SECRET` `ANTHROPIC_API_KEY` `GOOGLE_CLIENT_ID` `GOOGLE_CLIENT_SECRET` `LINE_CHANNEL_ID` `LINE_CHANNEL_SECRET` `LINE_BOT_CHANNEL_SECRET` `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` `LIFF_ID` `UPLOAD_DIR` `UPLOAD_BASE_URL` `SOCKET_VERBOSE_LOG` `NEON_API_KEY` `NEON_DEFAULT_REGION` `UNSPLASH_ACCESS_KEY`

**Determinism over Prompt flags**（預設全 false，穩定後逐一開啟）：
`CODER_TEMPLATE_V2`（啟用 coder-templates/ registry + 4 個新 template：count / exists_check / search / soft-delete 子模組）、`CODER_AST_SANITIZE`（啟用 ts-morph AST 替代 next15-async-params / search-params-suspense / missing-hooks 三類 regex）、`DETERMINISTIC_FIX_V1`（fixFailingAction 對 missing_column / wrong_status / field_naming 三類 rootCause 先跑零 LLM 機械修復，失敗才 fallback LLM）、`SPEC_CONSISTENCY_LLM_CHECK`（Feature Alignment Gate Check 7 的 Haiku fallback，覆蓋 regex 抓不到的中英文 null-intent 變體）

**Image Library（相關假圖）功能開關**（預設 true，緊急回退設 false 降級 picsum）：
`ENABLE_UNSPLASH_LIBRARY`、`UNSPLASH_CACHE_TTL_SECONDS`（預設 7 天）、`UNSPLASH_API_TIMEOUT_MS`（預設 5000）

> `UPLOAD_BASE_URL` 必填（例如 `https://api.tellcraft.com/uploads/tellcraft`），未設定時 `/api/upload/image` 會回傳 `UPLOAD_BASE_URL_MISSING`。
>
> `UNSPLASH_ACCESS_KEY` 強烈建議 production 設定（[註冊](https://unsplash.com/developers)）。未設或 API 失敗會自動降級回 picsum random seed，但產出圖片將與網站主題無關。

### Image Library 預熱（選配，首次部署 / 新增 productType 建議執行）

根據 26 個 productType 預抓 Unsplash 圖片 URL 到 Redis cache（7 天 TTL）：

```bash
# 預熱全部 26 個 productType（約 300-500 requests，遠低於 demo key 5000/hr 限額）
cd tellcraft-backend && pnpm tsx src/scripts/warm-image-library.ts

# 只預熱指定 productType
cd tellcraft-backend && pnpm tsx src/scripts/warm-image-library.ts --type=restaurant

# 強制刷新已有 cache
cd tellcraft-backend && pnpm tsx src/scripts/warm-image-library.ts --force
```

預熱完成後，UIUX/Fast Build/Clone 生成的網站圖片會與 productType 語義相關（例：餐廳 → 美食/廚房、健身房 → 運動器材）。部署後的頁面 footer 會自動注入 ImageCredits 組件顯示 photographer 署名（Unsplash ToS 合規）。

## 系統架構

```
┌─────────────────┐         ┌─────────────────────────────────────┐
│  Vercel (前端)   │────────>│  VPS Backend                        │
│  Next.js 16     │  HTTP   │  ├─ Express API (Port 3100)         │
│  tellcraft.com  │  WS     │  ├─ BullMQ Worker + LangGraph（編排）│
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
④ Coder Skill Stage A（✅ 已完成 — Per-SubOp 生成 + Code Template 模板化 + V2 擴充）
  ├─ 讀取 BDD 產出（actionsYml + schemaSql + entityMapping + features_content）
  ├─ 生成 lib/db.ts（Neon 連接，零 LLM）
  ├─ Per-SubOp 生成：Feature 按 When 步驟拆分子操作 → 每個子操作精準 Handler 選擇
  │   ├─ 已知 pattern（10 V1：aggregate/create/update/delete/query_list/query_single/toggle/restore/export/cascade
  │   │                + 3 V2：count/exists_check/search；CODER_TEMPLATE_V2=true 啟用）→ coder-templates/ registry
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
  ├─ RED Phase Layer 1: 12 個靜態檢查（零 LLM ~2ms）— Feature×actionsYml + Feature×Schema DataTable 深度對齊 + WHEN call table VAR 語法誤用偵測
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
| `quality-gate` | UIUX/Fast Build/Clone 完成後自動觸發，5 類靜態檢查（A11y+對比度+效能+代碼品質+SVG ID）+ Design Tier 合規 + Rule-based/LLM 雙層自動修復 | Haiku | ✅ 完成 |
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
| `error-enrichment.ts` | 無 | fixFailingAction + red-phase + feature-alignment | **Harness 級修復提示注入**：依已分類的 rootCause（9 類 Coder + 5 類 RED Phase）查 `ROOT_CAUSE_HINTS` 表，把結構化修復方向塞進 LLM prompt，讓修復不只看原始 error 字串 |
| `skill-loader.ts` | 無 | buildActionSystemPrompt / buildSubOpSystemPrompt | **按需注入技能索引**：14 個 Coder handler SOP 抽到 `coder-handlers/*.md`（含 `email-sender` M7 新增），模組啟動時一次載入 cache，dev/prod 雙路徑 fallback（src/ vs dist/）。prompt 輸出 byte-identical 於舊硬編碼 const |
| `ui-evaluator.ts` | Sonnet Vision | UIUX/Fast Build/Clone QG 尾端 | **黑盒 Evaluator Agent**：Puppeteer 跑 ephemeral Next.js preview → screenshot + DOM outline（**看不到 tsx**）→ Sonnet Vision + rubric 判斷可用性（layout_broken/content_missing/interaction_dead/visual_regression）。Feature flag `ENABLE_UI_EVALUATOR` 預設 false |
| `preview-runner.ts` | 無 | coder-e2e-test + ui-evaluator | 共用 ephemeral Next.js dev server 編排（/tmp 專案 → npm install → spawn next dev → 等 ready → 交給 caller run callback → 清理），抽自 coder-e2e-test.ts |
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
| **品質** | Quality Gate 5 類靜態檢查（A11y per-element + 色彩對比度 + 效能動畫時長 + 代碼品質 + SVG ID 碰撞）、Design Tier 合規（functional 禁漸層/glow/spring）、Rule-based 確定性修復（5 規則）+ Haiku LLM fallback、RWD 響應式安全網 |
| **部署** | sanitize 8 類預檢（含 'use server' 保護 + 未知依賴警告 + root layout html/body 自動補全）、本地 build 驗證（3 輪 LLM 修復）、Vercel 部署、版本回滾 |
| **迭代** | 對話內迭代修改、撤銷上一步、部署歷史回滾、迭代歷史追蹤、重複抱怨偵測+策略升級、視覺診斷指引 |
| **預覽** | WebContainers 完整 Next.js 預覽（Server Actions + DB 連線）、HMR 增量更新、裝置切換、編輯模式、圖片上傳、Pre-boot + Pre-install 載入優化、生成期間禁止渲染（UIUX/Coder 生成時只顯示等待動畫）、路由衝突去重（strip route groups 防 parallel pages 錯誤） |
| **動畫** | BDD 需求藍圖面板（即時 Q&A 歷史視覺化）、3D 工廠流水線（Fast Build）、Remotion 驅動 |
| **認證** | Google/LINE OAuth、JWT 雙軌（localStorage + Cookie）、訪客→帳號合併、帳號綁定（雙登入）、auth 頁面 i18n（next-intl） |
| **儀表板** | 用戶統計、專案管理、版本歷史、管理員面板、LLM 用量追蹤（統一 PRICING + trackLlmUsage）、即時系統日誌監控（Socket.io tail -F）、Dashboard 元件 i18n（next-intl） |
| **可觀察性** | Sentry 前端錯誤追蹤（@sentry/nextjs，error boundary + replay + tunnel）、ChatMessageItem React.memo |
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
│   │   ├── ChatMessageList.tsx  # 消息列表 + 輸入框
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
│   │   ├── image-library-service.ts # 相關假圖白名單（Unsplash Search API + Redis cache 7d + picsum fallback）
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
│   │   ├── deployer-sanitize.test.ts # 部署預檢 8 層修復測試
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

### P4：進階能力路線圖 — 復刻中型 CMS 專案

**目標**：從「一句話 → 簡單 CRUD app」升級到能復刻中型 CMS 專案（基準：15 張表 / 37+ 路由 / Admin 後台 / 認證 / 圖片上傳）。

**里程碑依賴關係**：
```
M1 多頁生成 ──────┐
                   ├──→ M3 Admin Panel ──→ M4 檔案上傳 ──→ M6 整合驗證
M2 Auth Skill ────┘                                          ↑
                                                              │
M5 進階 UI ──────────────────────────────────────────────────┘
```

#### M1：多頁生成能力（✅ 已完成 2026-04-01，僅精細模式）

精細模式 Animation/RWD 階段支援多頁批次處理。**快速模式不受影響**。

- [x] 新增 `buildAdaptiveAnimRwdBatches()`：≤5 頁單批、>5 頁按 token 權重分批（balanced 每批 5 頁 / quality 4 頁），共用 Layout 組件強制放入第一批
- [x] `generateAnimations()` 多批次路徑：自動啟用 diff mode、順序累積合併、越界修改過濾、onCheckpoint 持久化
- [x] `generateRwd()` 同樣多批次路徑
- [x] `uiux-phases.ts` 四處呼叫端傳入 onCheckpoint callback
- [x] Structure 階段已有批次（`buildAdaptiveStructureBatches()`），無需修改
- [x] Coder 改寫已有並行（`runWithConcurrencyLimit(3)`），無需修改

| 檔案 | 改動 |
|------|------|
| `tellcraft-backend/src/services/uiux-generation.ts` | 新增 `buildAdaptiveAnimRwdBatches()` + `pageImportsComponent()`；Animation/RWD 加入多批次路徑 |
| `tellcraft-backend/src/workers/phase-handlers/uiux-phases.ts` | 4 處 generateAnimations/generateRwd 呼叫傳入 onCheckpoint |

#### M2：認證系統生成 — Auth Skill（✅ 已完成 2026-04-01）

BDD schema 偵測到 users 表 + password 欄位 → Coder 自動生成 NextAuth v5 認證系統。**零 LLM 純模板**。

- [x] `coder-auth-templates.ts`（獨立檔案）新增 `detectAuthInSchema()` + `generateAuthSystem()`（7 個檔案模板）+ `injectSessionProvider()`
- [x] `executeCoderPipeline()` step 2.5 注入 auth 生成 + 最後注入 SessionProvider 到 root layout（path 精確比對）
- [x] `neon-service.ts` DDL 後自動 seed admin 帳號（admin@admin.com / admin123，SSL 連線，動態判斷 role 欄位）
- [x] `deployer.ts` KNOWN_PACKAGES 新增 `next-auth@5.0.0-beta.30`；`AUTH_SECRET` 用 `injectVercelEnvVarIfNotExists`（只建立一次不覆蓋，避免迭代部署後強制登出）
- [x] `deployer.ts` `wrapInNextJs` 支援根目錄裸檔案（`auth.ts` 不再被誤放到 `components/`）
- [x] `webcontainer-utils.ts` KNOWN_PACKAGES 新增 `next-auth`；auth.ts 硬編碼 DB 連線 + .env.local 注入 AUTH_SECRET
- [x] 全域 `bcryptjs` 版本統一為 `^3.0.3`（deployer + webcontainer + coder-phases + specformula-runner）

生成產物（零 LLM，純模板）：
| 檔案 | 說明 |
|------|------|
| `auth.ts` | NextAuth v5 config（Credentials + JWT + raw SQL，不用 DrizzleAdapter） |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth handler（2 行） |
| `app/(auth)/admin/login/page.tsx` | 登入頁面（client component） |
| `app/admin/layout.tsx` | Admin layout（server-side auth check + role 檢查） |
| `lib/auth-check.ts` | `requireAdmin()` helper（server action 用） |
| `app/providers.tsx` | SessionProvider wrapper |
| `types/next-auth.d.ts` | TypeScript 型別擴展（role + id） |

#### M3：Admin Panel 自動生成（✅ 已完成 2026-04-01，依賴 M1+M2）

從 BDD Schema 零 LLM 模板生成完整 CRUD 後台。

- [x] M2+M3 模板從 `coder-generation.ts`（5187→4385 行）拆分為獨立檔案：`coder-auth-templates.ts`（274 行）+ `coder-admin-templates.ts`（554 行），re-export 保持 API 相容
- [x] `coder-admin-templates.ts` 新增 `parseColumnDefinitions()`（SQL → 結構化 ColumnInfo）+ `generateAdminPanel()` 主函數
- [x] 5 個共用組件模板：Sidebar（動態 nav）、AdminHeader（登出）、FormField（6 種 type）、DeleteButton（兩階段確認）、SubmitButton（loading）
- [x] 每 entity 生成 4 檔：列表頁（表格+刪除）、編輯頁（id=new→新增，form+FK select）、查詢函數、Server Actions（CRUD+revalidatePath）
- [x] SQL Type → 表單映射：VARCHAR→text、TEXT→textarea、INTEGER→number、BOOLEAN→checkbox、TIMESTAMPTZ→datetime、FK→select
- [x] Auth 保護：有 auth 時 actions 自動加 `requireAdmin()`，AdminHeader 顯示登出
- [x] Admin Dashboard 卡片網格（entity 列表導航）
- [x] `executeCoderPipeline()` step 2.7 注入 admin 生成

生成產物（以 11 個 entity 為例，共 50 個檔案）：
| 類型 | 路徑 | 數量 |
|------|------|------|
| 共用組件 | `components/admin/*.tsx` | 5 |
| Dashboard | `app/admin/page.tsx` | 1 |
| 列表頁 | `app/admin/[entity]/page.tsx` | ×11 |
| 編輯頁 | `app/admin/[entity]/[id]/page.tsx` | ×11 |
| 查詢函數 | `lib/admin-queries/[entity].ts` | ×11 |
| CRUD Actions | `lib/admin-actions/[entity].ts` | ×11 |

#### M4：檔案上傳 Pattern（✅ 已完成 2026-04-01，依賴 M3）

Schema 欄位名包含 image/photo/cover/avatar 等 → 自動生成圖片上傳功能。

- [x] 獨立檔案 `coder-upload-templates.ts`（143 行）：`detectImageColumnsInSchema()` + `generateUploadFiles()` + ImageUpload 組件 + Upload API 模板
- [x] `coder-admin-templates.ts` import `IMAGE_COLUMN_PATTERN`，`columnToFieldType` 偵測 image 欄位，`buildEditPage` 加 ImageUpload case
- [x] `executeCoderPipeline` step 2.8 獨立觸發 upload（不依賴 Admin Panel，任何有 image 欄位的專案都生成）
- [x] Upload API 雙模式：Vercel Blob（生產，需 `BLOB_READ_WRITE_TOKEN`）/ 本地 `/public/uploads/`（開發 + WebContainer）
- [x] `deployer.ts` + `webcontainer-utils.ts` KNOWN_PACKAGES 加 `@vercel/blob`

#### M5：進階 UI Pattern（✅ 已完成 2026-04-01，Prompt 改善）

純 prompt 改善，讓 LLM 生成前端頁面時主動使用輪播/分頁/相簿網格。不加新檔案。

- [x] `bdd-to-ui-spec.ts` UIDataDisplay type 擴展：+`carousel`（活動/推薦）+`gallery`（相簿/作品集）+`paginated_list`（大量資料列表）
- [x] Haiku 翻譯 prompt 加入判斷指引（何時用 carousel vs paginated_list vs gallery）
- [x] `formatUISpecForPrompt` 對新 type 加實作提示（useState pattern、grid layout、Modal lightbox）
- [x] `generateStructure` system prompt 加「進階資料呈現模式」段落：carousel/paginated_list/gallery 的完整 useState + JSX 範例 + 通用規則（>8 項考慮分頁）

#### M6：整合驗證測試（✅ 已完成 2026-04-02，依賴 M1-M5）

自動化測試驗證 M2-M4 模板生成邏輯（41 個測試案例）。

- [x] `coder-generators.test.ts`：Learn 專案風格 schema fixture（5 表：users+posts+categories+events+gallery_albums）
- [x] Auth（12 tests）: detectAuthInSchema + generateAuthSystem（role/no-role/bcrypt/neon） + injectSessionProvider
- [x] Admin（10 tests）: parseColumnDefinitions + generateAdminPanel（auth 過濾、FK→select、image→ImageUpload、requireAdmin、Dashboard）
- [x] Upload（7 tests）: detectImageColumnsInSchema + generateUploadFiles（雙模式、拖放預覽）
- [x] 整合（4 tests）：全觸發 31 檔、無 auth、無 image、路徑唯一性
- [x] 總計 877 測試全部通過（原 836 + 新增 41）

驗收標準：
| 項目 | 基準 | Tellcraft 生成 |
|------|------|---------------|
| DB 表 | 15 張 | ≥12 張 |
| 公開頁面 | 14 | ≥10 |
| Admin 頁面 | 23 | ≥15 |
| 認證 | NextAuth + admin | NextAuth + admin |
| 圖片上傳 | Vercel Blob | Vercel Blob |
| 進階 UI | 輪播/相簿/分頁 | 輪播/相簿/分頁 |
| 部署 | Vercel | Vercel 一鍵 |

合理取捨（不追求）：雙語內容（後續 i18n）、Drizzle ORM（用 raw SQL + Neon）、Seed data（Admin 面板輸入）

#### M7：Email Primitive + Magic-link Auth（✅ 已完成 2026-04-14，擴充 M2）

客戶 app 可從代碼發信 + 支援 passwordless（magic-link）登入。**零 LLM 純模板**，schema 驅動能力偵測。

**三個架構決策**：
- **Resend API Key**：客戶自備（存 `projects.resend_api_key`，Dashboard 設定頁輸入，Deployer 注入 Vercel env）
- **發信域名**：寬鬆（預設 `onboarding@resend.dev`，客戶要 production 自行驗證域名後改 `EMAIL_FROM`）
- **Auth 並存**：schema 驅動 — 有 `password_hash` → credentials，有 `email` → magic-link，兩者兼備 → tab UI（default magic-link）

**變更**：
- [x] `coder-email-templates.ts`（新檔案）：`generateEmailInfrastructure()` 產 `lib/email.ts`（Resend primitive + escapeHtml）、`generateMagicLinkSystem()` 產 5 個檔案（`lib/magic-link.ts` + 2 pages + 2 server actions）
- [x] `coder-auth-templates.ts` 重構：新增 `detectAuthCapabilities()` 回 `{ hasCredentials, hasMagicLink }`；`generateAuthSystem(schemaSql, caps?)` 接受能力旗標；`buildAuthConfig` 支援兩個 `Credentials` providers（`id: 'credentials'` + `id: 'magic-link'`）；login page 三變體 picker
- [x] `coder-handlers/email-sender.md` 新 handler（14 個）：教 Coder 呼叫 `sendEmail()`、HTML escape、graceful degrade；`skill-loader.ts` `CODER_HANDLER_IDS` 從 13 加到 14
- [x] `coder-generation.ts`：`buildActionSystemPrompt` 加 `/email|寄信|通知|notify|verify|confirm|mail|發信/i` 偵測注入 email-sender handler；Step 2.5 改用 caps 傳 `generateAuthSystem`；新增 Step 2.6 呼叫 `generateEmailInfrastructure` + `generateMagicLinkSystem`
- [x] `schema-derivation.ts`：偵測 `users.email` 欄位自動 append `magic_link_tokens` 表 DDL（與 `created_at`/UUID 化同層的零 LLM 推導），`DerivedSchema` 加 `hasMagicLink` 欄位
- [x] `deployer.ts` Step 3.5：單次查詢拿 `resend_api_key + email_from + custom_domain`；files 含 `lib/email.ts` → 注入 `RESEND_API_KEY + EMAIL_FROM`；files 含 `lib/magic-link.ts` → 注入 `APP_URL`（優先 custom domain，fallback `{projectName}.vercel.app`）；`KNOWN_PACKAGES` 加 `resend@^4.0.0`
- [x] `migrations/033_add_email_config.sql`：`projects` 表加 `resend_api_key TEXT + email_from TEXT`
- [x] `routes/project.ts`：新增 `GET /api/project/:id/email-config`（API key 只回後 4 碼 mask）+ `PATCH /api/project/:id/email-config`；`schemas/project.ts` 加 `emailConfigSchema`
- [x] 前端：Dashboard `app/[locale]/dashboard/projects/[id]/settings/email/page.tsx` 新增設定頁（輸入 key + EMAIL_FROM + 警示區塊）；`vps-api.ts` 加 `getProjectEmailConfig` / `updateProjectEmailConfig`；專案詳情頁新增「Email 設定」連結
- [x] 48 個新測試：`coder-email-templates.test.ts` 24 tests（caps 四組合、3 login 變體、5 magic-link 檔、auth.ts 條件 provider）+ `schema-derivation.test.ts` 新增 `magic_link_tokens` 自動附加 5 tests + `skill-loader.test.ts` 更新 handler 數 14

**生成產物（以 users+email+password 並存為例）**：
| 類型 | 檔案 | 數量 |
|------|------|------|
| Auth 系統（M2 + M7） | `auth.ts`、`app/api/auth/[...nextauth]/route.ts`、`app/(auth)/admin/login/page.tsx`（tab UI）、`app/admin/layout.tsx`、`lib/auth-check.ts`、`app/providers.tsx`、`types/next-auth.d.ts` | 7 |
| Email primitive | `lib/email.ts` | 1 |
| Magic-link 子系統 | `lib/magic-link.ts`、`app/(auth)/magic-link/{request,verify}/page.tsx`、`app/actions/auth/{request,verify}-magic-link.ts` | 5 |

**Runtime 行為**：
- `RESEND_API_KEY` 未設 → `sendEmail()` 回 `{ skipped: true }` 不 throw（非關鍵 email 不拖垮 action）
- Magic-link token：crypto 32 bytes hex，TTL 15 min，rate limit 60s（同 email 60 秒內只能申請一次，DB 查詢實作），`DELETE RETURNING` 原子消耗
- Magic-link verify 失敗（過期/不存在）→ NextAuth `signIn` return null → action 回 error，不拋到 500
- Magic-link 自動註冊：查無 email 則 INSERT users，若 `password_hash NOT NULL` 導致 INSERT 失敗 → 拒絕登入（passwordless signup 降級）

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

# 8. 啟動服務（雙進程：API + Worker）
cd tellcraft-backend
pm2 start ecosystem.config.js
pm2 save
# 驗證：pm2 status 應顯示 tellcraft-api + tellcraft-worker 兩個進程
```

### VPS 日常部署

```bash
# 方法 1：SSH 到 VPS 後執行
cd ~/tellcraft-repo && git pull origin main
cd tellcraft-backend && pnpm install && pnpm build
pm2 startOrReload ecosystem.config.js --wait-ready

# 方法 2：本地直接執行（deploy.sh）
ssh -i ~/Desktop/LightsailDefaultKey-ap-northeast-1.pem ubuntu@54.238.4.117 '~/deploy.sh'
```

**deploy.sh**：
```bash
#!/bin/bash
set -e
cd ~/tellcraft-repo && git pull origin main
cd tellcraft-backend && pnpm install && pnpm build
pm2 startOrReload ecosystem.config.js --wait-ready
curl -s http://localhost:3100/health
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
- `concurrency`: env `WORKER_CONCURRENCY`（預設 15）
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

### 近期更新（2026-03-13 ~ 2026-04-18）

- **BDD/Coder 三波修復 Wave 3（L6 + L7 + L8）**（04-18 晚）：用戶 VPS 連續暴露另兩個獨立 bug。**(L6 Wave 2) Entity mapping 格式 E**：`mapping.entity_to_table_mapping is not iterable` 阻塞 dry-run 啟動。SSH 撈 DB 真實 `entity_mapping_content` 證實是格式 E（頂層 key 叫 `entities:` 而非 `entity_to_table_mapping:`）—— 不是我先前猜的格式 D。`normalizeEntityMapping` 加格式 D（object 無 array dash）+ 格式 E（`entities:` 頂層）兩個分支；`EntityDdlReader.scanDirectory` 加 array assertion 給人類可讀錯誤取代 `is not iterable`。**(L7 Wave 3 致命) Per-SubOp 函數名拼進 Actor prefix**：log 顯示 `async function handleUid="$store.id"查看銷售報表(input: any) {` esbuild 直接炸，4 個 action 全失敗降級。根因雙層：`extractSubOperations` 的 summaryRegex 強制要求 Actor 有括號 `\(...\)`，但 LLM 寫 `When UID="$Store.id" 查看銷售報表`（無括號）→ summary 把 Actor 整段吃進去；`handleName = handle${toPascalCase(summary)}` 拼接前不 sanitize JS 識別符非法字符。三層修：(1) regex `\(?` `\)?` 容錯；(2) 新 `cleanSubOpSummary()` 後處理兜底 strip；(3) 新 `sanitizeForJsIdentifier()` + `buildHandleName()` 把任意 summary 過濾成合法 JS 識別符（保中文+字母數字），3 處 `handleName` 拼接全切換到 `buildHandleName`。**(L8) SEARCH/REPLACE diff 後 conflict marker 流入**：LLM 偶爾在 replace block 寫進 `<<<<<<<`/`=======`/`>>>>>>>` → 後續 syntax firewall 把組件替換為 stub（UI 變空殼）。新 `hasConflictMarker()` helper（行首 7 個連續字符檢測，避開 markdown 文字誤判），在 SEARCH/REPLACE 主流程 + 二次改寫流程的 esbuild 驗證前先攔截 → 直接回退原始版本不污染下游。新增 33 個單元測試（21 L7 含真實 esbuild round-trip 驗證 + 12 L8 含 6 vs 7 字符邊界 case）。1356 tests 全綠、typecheck 零錯誤。**核心洞察**：Wave 2/3 都是「LLM 輸出格式變體 + downstream 沒做防禦性檢查」，正規化層和 sanitize 函數是吸收 LLM 不可預測輸出的必要邊界。先前我把 Wave 2 診斷成格式 D（entity_to_table_mapping 是 object）—— 部分對但用戶 SSH 撈真實 data 證實是格式 E。**教訓**：debug 不能只靠推論，要 SSH 撈真實 input

- **BDD Dry-Run VAR 系統根治（L1 + L2 + L4 + L5）**（04-18）：用戶 16-entity 電商 schema（merchants/products/variants/orders/cart/favorites/refunds）跑 dry-run 後修 16 個 feature 卻只從 45→42 失敗步驟，幾乎沒改善。5 層根因拆解 + 4 層根治：**(L1) `$notnull` 在 entity_setup 誤插 bug**（純 code 不對稱 bug，非 LLM 問題）：`entity-validate.ts:291` 有 `$notnull` 分支處理（驗證非空），但 `entity-setup.ts:117-128` **沒有對稱分支** → 當字面字串 INSERT 到 UUID 欄位 → `invalid input syntax for type uuid: "$notnull"`。修復：entity-setup.ts 加 `$notnull` / `$null` 分支，比照 `&isNull` 邏輯跳過該欄位（不 INSERT，讓 DB default/NULL 生效）。**(L2) extractAndStoreVariables 補存去數字 PascalCase/lowercase + dot alias**：原存 4 個 alias（beautician1Id / Beautician1Id / beautician1.id / beauticianId），漏了「去數字原始 dot 格式」(Beautician.id / beautician.id)。補上後 6 個 alias 涵蓋 LLM 省略數字引用如 `$Beautician.id`、`$Merchant.userId`。成本 +5 行、零 LLM、對既有 alias 無回歸。**(L4) 級聯失敗抑制**（最大槓桿）：父 entity_setup 失敗後，子步驟仍執行 → FK 不存在衍生錯誤 → 失敗數膨脹。`feature-dry-run.ts` 新增 `unresolvedContextKeys: Set<string>` 每 feature 獨立追蹤，entity_setup 失敗時抽取該步 header 的 `>contextKey` 加入 set；`stepReferencesUnresolvedKey()` 每步執行前掃 DataTable，找 `$VariableName` 引用（精確 / normalize / entityField 組合三種匹配），命中 unresolved → `skippedSteps++` 不跑 SQL。衍生錯誤歸零，dry-run 報告真實反映獨立錯誤數。**(L5) Formulation prompt 強化**（源頭降低錯誤率）：`generateSingleFeature` 的 static system prompt 加兩塊：(a) **VAR 作用域規則**（每 Scenario 獨立 context，禁假設跨 Scenario 共享），(b) **常見致命錯誤自檢清單 5 條**（本 Feature 內有對應 `>` 宣告？/ 命名一致？/ 複合概念正確拆 entity/field（「商家的 userId」= `>Merchant1.userId` 不是 `>Merchant1User.id`）/ entity_setup 禁用驗證標記 / FK 先行）；`fixMultipleFeatures` 的修復 prompt 新增規則 14-17 同步這些規則。**L3 經驗算不做**：ScenarioContext Tier 3 normalize（去 . _ - 後 case-insensitive）已覆蓋 PascalCase 複合 entity 反向重組，例如宣告 `Merchant1.userId` 存 alias `merchant1UserId`，查 `$Merchant1User.id` 在 Tier 3 normalize 為 `merchant1userid` 與 alias normalize 一致 → 命中。無需新增邏輯。新增 12 個單元測試（9 個 L4 `stepReferencesUnresolvedKey` + 3 個 L2 去數字 alias）。1305 tests 全綠、typecheck 零錯誤。**核心洞察**：`$notnull` bug 是純 code 對稱性修 15 分鐘解決；L2 的 +5 行 alias 擴充用極低成本換 LLM 命名變體容忍度；級聯抑制讓衍生錯誤歸零；Formulation prompt 自檢清單從源頭降低錯誤率。**再聰明的 LLM 都改不好 BDD，因為 runtime 收不到宣告** — code fix 永遠優先於 prompt fix
- **預覽畫面零錯誤架構（Preview Gate + LKG + Health Beacon）**（04-16）：用戶質疑「世界第一模型為何不能 100% 自我修復」——糾正認知：LLM 永遠有 edge case 錯誤，但「客戶永遠看不到」是**架構題**不是 AI 能力題。三層互補防禦可達 ~99.99%：(1) **Preview Gate**（新檔 `services/preview-gate.ts` + migration 034）：`makeStreamingCallback` 在寫 Redis 前跑 esbuild 批次驗證（native binary、100 檔並行 < 500ms），壞代碼不推送，emit `preview_stale`。`PartialCodeCallback` type 擴為 `() => void | Promise<void>` 支援 async gate。**所有 sanitize pattern 失敗類型都會被攔**（未閉合 JSX / 缺 import / 語法錯誤等）——12 個新單元測試覆蓋。`syntax-validator.ts:25` 現有 `validateComponentSyntax` 直接復用，零新 LLM 依賴。(2) **Last Known Good (LKG)** `project_files` 加三欄 `validation_status / last_validated_at / last_validated_content`，`upsertProjectFiles` 接 `validationStatus` 參數：`passed` 同步寫 LKG，`failed` **永不覆蓋舊 LKG**。UIUX/Fast Build/Deploy 三個「最終態」點傳 `'passed'` 建立 LKG 快照。`conversation.ts` polling 路由在 `isGenerating && !streamingPreview` 時回 `lastValidatedFiles`。`getLastValidatedProjectFiles()` `COALESCE(last_validated_content, content)` 向後相容。(3) **前端 Freeze Overlay + Health Beacon**：`ChatSection` 加 `lastValidatedFiles` state，`lkgAsPreviewData` 轉成 `{pages, components, styles}` shape 注入 `stablePreviewData`（優先級：streaming > codePreview > LKG）。`isCodeGenerating` 早返回邏輯加 `!isLkgFallback` 守衛——有 LKG 時保留 iframe 顯示、蓋 `pointerEvents: none` 的 overlay（「AI 正在優化」），不擋互動。`EDIT_BRIDGE_SCRIPT` 每 2s postMessage `tc_health`，`WebContainerPreview` 5s 沒收到 beacon 觸發 `onFrozenStateChange(true)` → ChatPreviewPanel 顯示 `iframe_frozen` overlay（兜 HMR race / 白屏 / build 卡住）。1244→1256 tests，frontend + backend 兩端 typecheck 零錯誤。**誠實告知**：不保證 100%（WebContainer SDK 崩潰等屬「產品功能壞了」不同維度）、犧牲「串流邊生成邊看 UI 長出來」UX 換可靠性（生成中看上一版 + overlay）。VPS 部署後需跑 migration 034
- **Spec Inconsistency 根治（BDD Alignment Gate Check 7 強化）**（04-16）：用戶實際案例暴露 `validateSemanticConsistency` 漏掉「分類應可被設為未分類（null）」類 scenario — 18 輪修復後仍 107/108 因為 regex 不覆蓋「應可被設為」且 `extractNullExpectationFields` 只找英文欄位名，全中文 scenario 直接 bypass。三層補強：**(1) regex 擴充**：`NULL_INTENT_PATTERNS` 新增 4 條 pattern 覆蓋「應可被設為」「清除為未分類」「括號 (null) 強信號」「unset/clear/reset/取消關聯/脫勾/解除連結」（含中英文變體），新增 `hasExplicitNullIntent()` 寬鬆 boolean 偵測（null 關鍵詞 + 動作動詞雙條件降低 false positive）。**(2) Actual-driven DataTable 掃描**：`checkNameVsDataTable` 改兩段式 — Stage 1 精確欄位匹配（既有，加中文業務術語映射表「分類/類別/標籤/使用者/作者/專案/群組/組織/父/指派」→ 對應英文欄位候選）；Stage 2 fallback — 若 Stage 1 無匹配但 scenario 明顯有 null 意圖，**掃描整個 DataTable 找 FK/Id 類欄位**（`*Id` / `*_id` 結尾或含 parent/category/tag 等關鍵字），任一 expect 非 null 即標記為矛盾。**(3) LLM fallback**：`SPEC_CONSISTENCY_LLM_CHECK=true` 時對「有 null 意圖但規則無 issue 產生」的 scenario 追加一次 Haiku 呼叫（512 tokens 成本），`callStructured` 回 `{isContradictory, fieldName, explanation}`，補足自然語言變體的無限性，失敗降級不阻塞。**(4) blockMessage 強化**：加「A/B/C 三選一」決策指引（改 scenario 名稱 / 改 DataTable `&isNull` / 刪除 scenario）。**(5) analyzeSpecIssuesInFailures**：`nullInScenario` regex 替換為 `hasExplicitNullIntent` 統一判斷。新增 40 個單元測試（20 positive + 6 negative `hasExplicitNullIntent` 變體 + 4 actual-driven DataTable 掃描 + 3 analyzeSpecIssuesInFailures 用戶實際失敗格式）。1244 tests 全綠、typecheck 零錯誤。**核心洞察**：剩下 1/108 的失敗不是技術問題是**人類寫需求時的意圖模糊**，根治靠的是在進 Coder 之前就把這類矛盾卡下來推回人類做選擇，不是再加一輪修復

- **Determinism over Prompt Phase 1**（04-15）：正視「LLM 再強也是機率機器」的本質，把最高 ROI 的三條戰線從 prompt 依賴遷移到確定性路徑，全部預設 flag-off 穩定後逐一啟用。**(A) Template 庫擴充**：`coder-generation.ts` 原生 10 個 template（aggregate/export/cascade/create/update/delete/query_list/query_single/toggle/restore）抽離到 `src/services/coder-templates/` 獨立目錄 + registry（`TEMPLATE_REGISTRY`），`INLINE_SNAKE_TO_CAMEL` / `buildScopeClause` 抽到 `_shared.ts` 單一來源（必須是 string literal export，絕不可變 function 否則被 helper 提取器拔走 → `_c undefined`），新增 4 個 template（`count` 計數 / `exists_check` 唯一性 / `search` ILIKE 模糊搜尋 / `soft-delete` 從 delete 分離委派），擴充 `SubOperation.operationType` union 加 3 個 V2 類型，`inferOperationType` 在 `CODER_TEMPLATE_V2=true` 時優先匹配 V2 keywords，`tryTemplateGeneration` 對 V2 類型走 registry、V1 仍走原 switch（保留 production truth 確保 byte-identity）。**(B) AST 基礎設施**：引入 ts-morph（lazy import + worker 單例 Project，PM2 RSS +80-120MB），新增 `src/lib/ast/ts-project.ts`（`withTempSourceFile` helper，forget 防洩漏）+ `src/lib/ast/fixers.ts` 3 類 AST fixer：`ensureReactHooksImports` / `fixNext15AsyncParams`（先收集 fieldNames 再 replaceWithText 防 node forget）/ `splitPageForSuspense`。`deployer.ts` 新增 `sanitizeCodeForDeployAsync` async wrapper — `CODER_AST_SANITIZE=true` 時先跑 3 類 AST fix 再跑同步 regex pipeline 冪等補齊；呼叫點只改 deploy 主流程 + iteration-skill 2 處（preview 路徑 `sanitizeForPreview` 11 個呼叫端不動，維持 regex 快路徑）。失敗降級純同步絕不阻塞 pipeline。**(C) 零 LLM 機械修復**：`src/services/coder-deterministic-fixes/` dispatcher + 3 個 fixer：`tryFixMissingColumn`（snake_to_camel / camel_to_snake / soft_delete_clause / Levenshtein ≤ 2 fuzzy match）、`tryFixWrongStatus`（inline object / any cast / inject missing 三路徑，從中英文 error 提取 expected status）、`tryFixFieldNaming`（從 feature Then DataTable 抓期望欄位 → spread row 注入 `_c()` / SELECT * for missing 兩策略）。每次修復過 esbuild 語法驗證，失敗不 commit；成功/失敗都 fire-and-forget telemetry（`deterministic_fix:*` / `deterministic_fix_miss:*` 前綴與舊 rootCause 區隔，不斷層基線）。接入 `fixFailingAction` 的 rootCause 分流，`DETERMINISTIC_FIX_V1=true` 時三類優先走零 LLM，失敗 fallback LLM 帶 harnessHint。**測試**：新增 1 個測試檔 3 類（30+ 測試 cases：coder-templates-extended 覆蓋 4 個新 template + registry + `_c` 不被 function 提取、deterministic-fixes 覆蓋三類修復 + 中英文 error 解析、ast-fixers 覆蓋 3 類 AST fixer before/after）。總計 1204 測試全綠、typecheck 零錯誤。**預期成效**：template 命中率 ~55%→≥75%、deterministic_fix 佔修復總數 ≥30%、週均 LLM fix token -35%。**核心思維**：承認 Sonnet 4.6 / BDD 詳細 / LangGraph / Harness Engineering 加起來降低的是 MTTR 不是缺陷率；真正的槓桿是把「LLM 生成」換成「template + AST + code rule」。配套 migration 和 Phase 2（auth 拆 5 sub-template + `rewriteComponentForServerActions` AST 改寫 80% case + repairMissingComponents stub 庫）待 Phase 1 驗證穩定後再啟動

- **Skill Telemetry 閉環漏洞修補**（04-15）：從一次意外發現 `register-prompt-change.ts` 根本跑不動（ES module hoisting 讓 `db/client` top-level `getEnv()` 在 `validateEnv()` 之前觸發），引出更深問題：「每次加 code rule 必須註冊」的 CLAUDE.md 規範從沒人遵守過（`prompt_changes.id` 從 1 開始是鐵證）。兩層防線修復：(1) **pre-commit hook Check 8**：偵測 `git diff --cached` 是否新增 `SANITIZE_PATTERN_MAP` entry，WARN 印出 `register-prompt-change.ts` 指令範本；(2) **週報頂部警示區塊**：新增 `findUnregisteredSanitizePatterns()`（純函數，注入 activeChanges 避免查 DB）+ `formatUnregisteredPatterns()` — 列出 `SANITIZE_PATTERN_MAP` 存在但 `prompt_changes` 無對應 row 的 pattern。修 register 腳本用 dynamic import 繞過 hoisting。5 個新測試（1159→1164）。**核心教訓**：文檔寫了規範但沒機制自動偵測違反，規範就等於死文字。下次訂「必須 X」之前先問「沒做會怎樣被發現」
- **Deployer Fix 4.5 — next/font `axes` 清理**（04-15）：LLM 經常把 `axes: [...]` 加到非 variable font（Playfair Display / Lora / Merriweather / Instrument Serif / Libre Baskerville / Cormorant Garamond / DM Serif Display / Cabin / Crimson Pro / Cormorant / Gentium Book Plus）→ Next.js build 報 "Axes can only be defined for variable fonts"。`sanitizeCodeForDeploy` 新增 Fix 4.5：regex 偵測黑名單字體 + 移除 `axes` 屬性（處理三種逗號位置），`skill-telemetry` 新增 `font-axes-removal` pattern。9 個新單元測試（47→56 deployer-sanitize）全綠。Direction A 優先，零 LLM 修復，不回灌 prompt 避免炸 cache。**部署後記得在 VPS 跑** `pnpm tsx src/scripts/register-prompt-change.ts --pattern font-axes-removal --skill uiux --action sanitize_rule --target src/services/deployer.ts` 納入週報效應追蹤
- **Email Primitive + Magic-link Auth（擴充 Coder Skill）**（04-14）：客戶 app 新增兩項能力 — (1) 從代碼發信（Resend SDK，客戶自備 `RESEND_API_KEY`），(2) passwordless magic-link 登入（取代/並存傳統密碼）。**零 LLM 純模板**，schema 驅動偵測。新檔：`coder-email-templates.ts` 產 `lib/email.ts` + 5 個 magic-link 檔；`coder-handlers/email-sender.md`（handler 14 個，+1）；`migrations/033_add_email_config.sql`（`projects.resend_api_key + email_from`）；`routes/project.ts` PATCH/GET `/email-config`；Dashboard 設定頁。改寫：`coder-auth-templates.ts` 新增 `detectAuthCapabilities()` 回 `{hasCredentials, hasMagicLink}`，`generateAuthSystem(schemaSql, caps?)` 接能力旗標，login 頁三變體（純 credentials / magic-link redirect / tab UI default magic-link），`auth.ts` 條件式兩個 Credentials providers（`id: 'credentials'` + `id: 'magic-link'`）。`schema-derivation.ts` 偵測 `users.email` 自動 append `magic_link_tokens` 表（零 LLM）。`deployer.ts` Step 3.5 一次查出 `resend_api_key + email_from + custom_domain`，依 files 內容注入 Vercel env；`KNOWN_PACKAGES` 加 `resend@^4.0.0`。Runtime graceful degrade：key 未設時 `sendEmail` 回 `{skipped: true}` 不 throw；magic-link TTL 15 min + 60s DB 查詢式 rate limit + `DELETE RETURNING` 原子消耗；auto-signup 若 `password_hash NOT NULL` 則降級拒絕。48 個新測試（1148→1196 total）全綠。**不做**：批量發信/broadcast、feedback 專屬流程、SPF/DKIM/DMARC 自動化、OAuth providers、Rate limit 用 Redis（這版用 DB 查詢）
- **Harness Engineering 三項升級**（04-14）：將 Anthropic/OpenAI Harness Engineering 實踐對應到 Tellcraft 的修復迴圈。(1) **PR3 — Harness 級錯誤反饋攔截**：新增 `services/error-enrichment.ts`，依已分類的 rootCause（`classifyFailureRootCause` 9 類 + `classifyRedPhaseFailure` 5 類）查 `ROOT_CAUSE_HINTS` 表，把結構化修復方向（「常見根因 + 修復方向」）注入 LLM 的 `fixFailingAction`（主 + Per-SubOp 雙路徑）、`red-phase-validator` unexpectedFailures、`feature-alignment-gate` fixMultipleFeatures 三個修復整合點。`var_resolution`/`auth_check`/`spec_inconsistency` 三類 `skipLlmFix=true` 短路不走 LLM。27 個單元測試覆蓋 14 類 rootCause。(2) **PR2 — 按需注入技能索引**：把 Coder Skill 的 13 個 handler SOP（AUTH/BATCH/CREATE/UPDATE/DELETE/QUERY_LIST/QUERY_SINGLE/AGGREGATE/CASCADE/COLUMN_ALIAS/TOGGLE/RESTORE/TRANSACTION）從 `coder-generation.ts` 硬編碼 ~250 行 const 抽到 `services/coder-handlers/*.md` + `index.yml` 目錄索引，新建 `lib/skill-loader.ts` 做模組啟動時一次 cache 載入。觸發邏輯仍在代碼（`rule.type` 組合判斷 YAML 表達不了），**prompt 輸出 byte-identical 於舊實作**（3 種典型組合都驗證過）。`pnpm build` postbuild 自動 copy .md 到 dist/，skill-loader 也有 src/ fallback 防呆。35 個 snapshot 測試保證不退化。(3) **PR1 — 黑盒 Evaluator Agent**：新增 `services/preview-runner.ts` 抽出 coder-e2e-test 的 ephemeral Next.js dev server 編排為共用模組，在 UIUX/Fast Build/Clone QG 尾端插入 `services/ui-evaluator.ts` — Puppeteer 跑 preview → screenshot + DOM outline（**明確過濾掉 tsx 原始碼，只給 tag/role/text/href**）→ Sonnet Vision 依 `ui-evaluator-rubric/base.md` rubric 做黑盒 QA（四類 issue: layout_broken/content_missing/interaction_dead/visual_regression）→ 發現 issue 映射為 QualityIssue 餵回 Generator 修復（UIUX 2 輪、Fast Build/Clone 1 輪）。Feature flag `ENABLE_UI_EVALUATOR` 預設 false（staging 先開），timeout 預算 45s，任何失敗降級 softFail 不阻塞 pipeline。**整體結果**：1115 測試全綠，typecheck 零錯誤。**核心思維轉變**：從「把 prompt 寫得更好」改為「為 LLM 設計更嚴格的防呆機制與獨立驗收軌道」
- **防雷清單 CI 守衛**（04-12）：Step 2 — 把 CLAUDE.md 60+ 條防雷清單轉化為自動化守衛。(1) **pre-commit hook**：`scripts/pre-commit-checks.sh`（6 條 grep 靜態檢查 + 1 條 telemetry .catch heuristic）+ husky + CI pipeline 整合；(2) **新增 48 個測試**（993→1041）：`coder-generation-rules.test.ts`（36 tests — classifyFailureRootCause 8+1 類覆蓋 + validateSlotColumns softDeleteColumn + _c snake_to_camel）、`uiux-generation-rules.test.ts`（5 tests — generateTailwindConfig 禁止 CSS var）、`semantic-gateway.test.ts` 擴充（7 tests — ITER_DESIGN_SIGNALS 錯誤修復詞 iteration 接受驗證）；(3) **CLAUDE.md 標注**：每條標記 `[CI]`/`[TEST]`/`[ARCH]`，區分 CI 守衛 vs 測試覆蓋 vs 需人工審查的架構約束
- **Skill Telemetry v3 — Failure Telemetry Expansion**（04-12）：從「哪些成功模式在重複」擴充成「哪類失敗在重複、分佈在哪個 phase、多少被恢復了」。(1) **Schema 擴充** `migrations/031`：`outcome`（success/failed/repaired/timeout/blocked）+ `root_cause_category` + `phase` + `error_type` + `recovered` 五欄位 + 三個 partial index，向後相容既有 row 全為 success；(2) **Dead code 復活**：`coder-generation.ts` 的 `classifyFailureRootCause()` 8 類零 LLM 分類器接入 recordTelemetry（最高 ROI，原本寫好沒用）；(3) **Deployer L1/L3/L4/L5 分層埋點**：L1 validateComponentReferences 修復率、L3 fixBuildErrors 重試、L4 verifyBuildLocally 各輪、L5 useSearchParams Suspense 觸發率；(4) **Feature Alignment Gate**：alignment_blocked/fixed 追蹤，6 項檢查結果 + LLM 修復成敗；(5) **RED Phase L1/L2/L2.5**：靜態 12 檢查 + Stub/Routing 驗證失敗分佈；(6) **Syntax Validator**：esbuild 失敗 + Haiku 修復成功率；(7) **Prefilter**：reject（injection/gibberish/offensive/spam）+ antiloop 冷卻追蹤；(8) **Orchestrator 中心化 catch**：`handlePhaseError` 用 `classifyPhaseError()` 8 類零 LLM 分類（timeout/network/rate_limit/llm_error/filesystem/db_error/redis_error/oom）；(9) **FlowState Recovery**：超時偵測→恢復成功率按 phase 追蹤；(10) **週報 v3**：新增 Failure Overview（outcome×skill 分佈）+ Top Root Causes + Recovery Success Rate 三個 section。**目的**：讓週報直接回答「top 3 failure pattern 是什麼」「哪層防禦從來沒救過人」「同一類 bug 換型態再來比例」——打地鼠的前提是看清地鼠
- **Skill Telemetry v2 — 真閉環**（04-11）：升級自我強化迴圈。(1) **Week-over-week delta**：`aggregateWeeklyReportWithDelta` 同時查當前+前一週，每個 pattern 顯示 `↑/↓ N%` 對照，不再只有絕對數字；(2) **Prompt Change 註冊表**：`migrations/030_add_prompt_changes.sql` + `registerPromptChange()` / `retirePromptChange()` / `measurePromptChangeEffects()`。每次改 prompt 或加 code rule 後用 `register-prompt-change.ts` CLI 註冊，自動查 baseline_count（近 7 天觸發數），下週報顯示 `注入前基線 vs 最新觸發 → reduction %`；(3) **汰換候選**：`currentWeeklyCount < 5 && weeksActive >= 4` 自動標記「畢業候選」，防 prompt 堆疊膨脹；(4) **Direction A 候選**：`findDirectionACandidates()` 零 LLM 檢測「高頻 + 已有 sanitize regex 能修但 QG 路徑沒覆蓋」的 pattern，建議轉 deterministic code rule 而非教 LLM。**核心原則不變**：禁止自動回灌 prompt，人工看週報→決策→註冊→量化效應→汰換
- **Skill Telemetry MVP**（04-08）：自我強化迴圈第一步。新增 `migrations/029_add_skill_telemetry.sql` + `services/skill-telemetry.ts` + `scripts/telemetry-weekly-report.ts`。在 3 個最高 ROI 修復點埋點：(1) Deployer L2 `sanitizeCodeForDeploy` caller 側用 `categorizeSanitizeFix()` 零 LLM regex 分類 15+ 種修復 label；(2) Quality Gate `autoFixCriticalIssuesRuleBased` 記錄每條 rule 命中（motion-import / tailwind-v4 / focus-visible / form-labels / no-h-screen），`autoFixCriticalIssues` LLM fallback 單獨記錄；(3) Iteration `executeIteration` 記錄用戶 feedback（截 500 字）+ scope + repeatCount。`recordTelemetry` 完全 fire-and-forget — DB 失敗吞錯不阻斷 pipeline，payload 超 4KB 自動截斷。週報 CLI 產出 markdown top patterns + action items + escalations，人工決定哪些高頻 pattern 要回灌對應 service 的 system prompt。**禁止自動回灌**（會炸 prompt cache 命中率）。MVP 覆蓋 deployer/quality_gate/iteration 三層，RED Phase / Feature Alignment Gate / L3 L4 / Variant selection 留待第二輪
- **Extended Thinking 修復路徑**（04-03）：`ENABLE_EXTENDED_THINKING=false`（預設關閉）+ `EXTENDED_THINKING_BUDGET=10000`，只用在 `fixFailingAction()`（Coder RED-GREEN cycle 修復）和 `fixMultipleFeatures()`（Feature Alignment Gate 修復）。`callClaude` + `callStructured` 支援 `thinking` 參數，maxTokens 自動加上 budget_tokens。purpose 加 `+thinking` 後綴用於 A/B 比較修復成功率
- **Prompt Caching 擴展**（04-03）：共用 `buildCacheableSystem()` helper（`lib/anthropic.ts`）+ `CacheableSystemPrompt` type。擴展到 4 個服務：formulation.ts（ISA SpecFormula 規則跨 5-20 個 feature 快取，省 ~84% system prompt input tokens）、coder-generation.ts（BASE_PROMPT 跨 action 快取 + rewrite prompt 全靜態快取）、web-clone-service.ts（CLONE_SYSTEM_PROMPT 跨 section 快取）。`callStructured()` 加入 cache metric tracking。raw fetch 加 `anthropic-beta: prompt-caching-2024-07-31` header。**待驗證：`ENABLE_DIFF_OUTPUT=true`（預設 false）** — Animation/RWD 階段改用 SEARCH/REPLACE diff 輸出，可省 60-70% output tokens（$15/MTok，主要成本），但會改變 LLM 的生成任務（完整檔案→差異片段），有匹配錯位/遺漏修改風險，解析失敗自動 fallback 到 full-file。需在 staging 跑真實案例驗證品質後再啟用
- **Structured Outputs 全面遷移**（04-03）：25+ 個 JSON 輸出 LLM 呼叫從 `safeParseJson()` 遷移到 `callStructured<T>()` + Zod schema（4 Phase + 補漏），消除所有 JSON 解析失敗
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

### 迭代 Skill + Coder 全鏈路正確性大修（2026-03-31）

**根本修復：`generateApiRoutes` 多方法路由 + `_stepSummary` 自動注入**：
- **根因**：舊版 API route 模板生成 `manageTodo(body)` 但 body 缺少 `_stepSummary` → action dispatch 找不到分支 → `throw Error('不支援的操作')` → 增刪改查全壞但 SpecFormula 測試 100%（因為測試繞過 API route 直接測 action）
- **修復**：`generateApiRoutes` 改為多方法路由，從 action 代碼提取 `_stepSummary` dispatch 值，按 HTTP method 自動注入（GET→查詢、POST→建立、PUT→編輯、DELETE→刪除）。前端只需用正確的 HTTP method，不需知道 `_stepSummary`
- **API route 靜態驗證**：生成後立即檢查每個 route 是否有 `_stepSummary` 注入
- **`fixFetchCallsWithStepSummary`**：LLM 改寫組件用了 `fetch('/api/...')` 時自動偵測並在 body 注入對應的 `_stepSummary`

**迭代 Skill 全棧化**：
- **`coderCompleted=true` → 永遠走 fullstack**：不再靠 keyword 猜測，LLM 永遠看到完整前後端代碼
- **fullstack maxTokens 16000→32768**：大專案不截斷
- **fullstack prompt 大幅強化**：教 fetch + `_stepSummary` 對應關係 + mock data→Server Action 改寫指引 + `===` dispatch 語法
- **誠實成功訊息**：「設計已更新！」→「已嘗試修改，請確認效果」

**迭代 Skill 防禦體系（前端+全棧雙路徑統一）**：
- **esbuild TSX 語法驗證**：`syntax-validator.ts` 共用模組，coder 改寫 + 迭代 refineCode + 全棧迭代三處共用
- **既有壞組件修復**：非修改檔案的語法錯誤先嘗試 esbuild + Haiku 修復，修不好才 stub
- **stub 偵測 + DB 原版還原**：`restoreStubComponents()` 偵測紅色 stub → 從 `project_files` 的 `skill_source='uiux'` 讀取原版，前端+全棧路徑都有
- **sanitize 在 DB 存入前**：前端+全棧路徑都在 `upsertProjectFiles` 前執行 `sanitizeCodeForDeploy`
- **Props Interface 保護**：`filterInterfaceBreakingChanges()` 撤回用戶沒提到的組件的 props/export 修改，前端+全棧路徑都有
- **反向依賴感知**：`findFilesDependingOn()` 收集 import 了目標組件的上游檔案一起送入 LLM 上下文
- **最小改動原則**：runtime error 只加 `?.` 防禦，嚴禁重構資料流/改 props 命名/移除 state 變數
- **功能問題診斷 prompt**：「沒反應」→ 查 fetch body `_stepSummary`、catch 吞錯誤、API 回傳格式、mock data 未替換
- **全棧路徑 5 層防禦補齊**：`stripLlmMetaLines`、截斷偵測改為終止、語法驗證、Props 保護、sanitize（與前端路徑完全一致）

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
- **`sanitizeFeatureContent()`**：零 LLM 自動修正 — `回應, with JSON:` → `回應, with table:`、`回應為, with JSON:` → `回應, with table:`、entity_validate header `>id` → `id`、entity 花括號剝除 `準備一個{顧客}` → `準備一個顧客`（規則 4；LLM 偶爾照抄 prompt 模板 `{entity}` 佔位符 → SpecFormula regex 字元類不含 `{}` → matchStepToInstruction 100% 失敗；單元測試 `sanitize-feature-content.test.ts` 覆蓋 6 個 case）
- **formulation prompt 強化**：明確禁止 entity_validate 使用 `>contextKey`；`>contextKey`/`<executionKey` 只用於 Given 準備和 Then 回應

### L14 英文化 P0 補漏 + 結構性補強（2026-04-19）

上承 L13（`e4d118bb`）BDD/Coder 產物英文化，L14 修補 L13 遺漏範圍並強化測試/重構：

**P0 致命 bug 修復 — REWRITE prompt 雙頭馬車**（`coder-generation.ts`）：
- L13 讓 Action 函數派發條件英文化（`op === 'Create Order'`），但 REWRITE prompt L2304-2347 大段中文規則 + `_stepSummary: '建立XXX'` 範例仍指示 LLM 用中文。結果：Coder 產英文 op，組件卻 dispatch 中文 `_stepSummary` → 100% 走到 `Unsupported operation`
- 修正：整段中文規則改英文；`_stepSummary` 範例全改 `'Create Order'`/`'Update Order'`/`'Delete Order'`/`'List Orders'`/`'Get Order'`；`L425` 動態 stepSummary 注入 block + `L69` type comment 的中文範例同步英文化
- `STANDARD_SUMMARIES` L3440 中文 fallback 改英文（`'List Items'` 等），讓 `generateSafeSummary()` 對英文 Action 有效 match；舊中文 Action 仍有 `correctBranch.keywords[0]` 動態 fallback 保底

**P1 結構性補強**：
- **`coder-handlers/*.md` 14 個 SOP 全英文化**（create / update / delete / query-list / query-single / toggle / restore / batch / auth / transaction / aggregate / cascade / column-alias / email-sender）：錯誤訊息 / 註釋 / 說明全英文；保留代碼結構不變。防雷清單 PR2 的 byte-identity 保證改為「以 `\n` 開頭、不以 `\n` 結尾」，內容本身已主動打破（英文化 trade-off），跑 skill-loader.test.ts 的 38 個 byte-identity + join 測試全綠
- **`semantic-consistency-validator.ts:537` LLM system prompt 英文化**：BDD→Coder spec 驗證層的 Haiku prompt 改英文，同時 recognize 中英文 null intent（向下相容舊對話）

**P2 品質改善**：
- **`LANGUAGE_POLICY_FEATURE_BLOCK` 常數提煉**（`formulation.ts:111`）：3 個 Feature content 生成 prompt（generateSingleFeature / fixMultipleFeatures / generateDraftBatch）統一引用，避免措辭差異造成 LLM 對中英邊界判斷不穩；L404 schemaSql / L563 identifyFeatures 屬不同 context 保留自己的簡版
- **`stepSummaryMatches()` word-boundary 比對**（`coder-generation.ts:3505`）：`includes()` 改 `\b` 邊界 regex 防 `'list'` 誤 match `'playlist'` / `'get'` 誤 match `'forget'`。CJK keyword 保持 `includes()`（中文無 word boundary）。新檔 `coder-step-summary-matches.test.ts` 14 個 case
- **7 個 KEYWORD list 英文變體擴充**：`DELETE+Cancel` / `LIST+Index,Collection` / `TOGGLE+Switch,Enable,Disable` / `RESTORE+Undelete`
- **`removeAuthChecks` export + 10 個單元測試**（`coder-remove-auth-checks.test.ts`）：覆蓋 Pattern 1-4 中英 auth throw 正常移除 + 業務 throw 不誤傷 + `forbidden` 邊界 trade-off 顯式記錄

**P3 文檔**：
- `bdd-spec/resources/templates/feature.template` 範例值改英文（`小明` → `John Doe` / `宮保雞丁` → `Kung Pao Chicken` / `準備一個使用者` → `準備一個User`），保留中文 DSL keyword 不變

**測試結果**：51 test files / 1390 tests 全綠（L13 基礎 1366 + P2.3 removeAuthChecks 10 + P2.2 stepSummaryMatches 14）；typecheck clean。

### LangGraph.js 狀態機遷移 + Fix Loop 根治 + SpecFormula 完善（2026-04-08 ~ 2026-04-12）

**LangGraph.js StateGraph 架構（Phase 1 骨架 + Phase 2 Subgraphs）**：
- **依賴安裝**：`@langchain/langgraph` + `@langchain/langgraph-checkpoint-postgres` + `@langchain/core`
- **Pointer State Pattern**：LangGraph state 只存路由 metadata（~1KB），大資料（generated code、FlowState 100+ 欄位）留在 Redis + PostgreSQL，避免 checkpoint 膨脹
- **State Schema**：`graph/state.ts`（Annotation.Root + last-write-wins reducer）— conversationId / phase / waitingForReply / skillIntent / message / error / coderStage / domainSource / testRound 等 16 個欄位
- **主 StateGraph**：`graph/main-graph.ts` — classify → phase_router → 7 skill subgraphs → complete，conditional edges 路由
- **Runtime Context**：`graph/context.ts` — singleton 注入 Redis + Socket.io，所有 node 共用
- **PostgresSaver Checkpointer**：`graph/checkpointer.ts` — 持久化 interrupt/resume 狀態到 PostgreSQL，`setup()` 自動建表（idempotent），支援 `Command.resume()` 恢復暫停的 graph
- **Orchestrator resume 邏輯**：`orchestrator.ts` 在 LangGraph 分支內檢查 `checkpointer.getTuple()` 是否有 pending interrupt，有則用 `Command({ resume: message })` 恢復，無則 fresh invoke
- **7 個 Skill Subgraph**（`graph/subgraphs/`）：每個 Skill 是獨立的 `StateGraph` 子圖
  - **Coder Subgraph**（fully decomposed）：validate → generate → test → finalize，fix loop 作為 `test → test` conditional edge（最多 3 輪），afterTest 判斷 `test_passed` / `test_retry` / `test_failed`
  - **BDD / UIUX / Domain / Deployer / Clone / Fast Build**：wrapper 模式（Phase 2A），Phase 2B 將拆分為多 node + `interrupt()` human-in-the-loop
- **3 個保留 Node**：classify（意圖分類 + 特殊 token）、phase-router（FlowState 同步）、complete（終止 node）
- **Feature Flag**：`USE_LANGGRAPH=true` 切換新舊路徑，預設 off。在 `orchestrator.ts` 的 BullMQ worker 內部，withConversationLock 內分支
- **Safety Layer（生產就緒）**：LangGraph 路徑在 graph 外部（orchestrator）執行 `prefilterMessage()`（注入/髒話/限速）+ `deductCredits()`（扣費）。`__new_project__` 同時清除 checkpoint + FlowState。classifyNode 接入真實 `classifyIntent()`（Haiku LLM 三層分類）+ `detectFastModeIntent()`（Fast 模式客服偵測）+ `checkBuildRelevance()`（建站相關性）+ content policy 檢查。complete node 處理 meta-intent 回覆（greeting/chitchat/onboarding）

### Spec 內部矛盾根治（7 層防禦）

解決 Coder fix loop 卡在矛盾 Feature 的問題（案例：「categoryId 應變為 null」但 DataTable 寫 UUID，LLM 8 輪修不好）。從 Discovery 到 User Escalation 的多層防禦：

- **層 1 Schema Prompt FK 指引**：`services/formulation.ts` 的 `generateSchemaSql` prompt 加入 FK Delete Behavior 決策表（CASCADE / SET NULL / NO ACTION），強制每個 FK 明確指定 ON DELETE
- **層 2 Schema Derivation Fallback**：`services/schema-derivation.ts` 加入 `inferDefaultOnDelete()`——LLM 忘寫 ON DELETE 時，nullable FK 自動推導為 SET NULL，NOT NULL FK 推導為 CASCADE（不再靜默用 NO ACTION）。內聯 REFERENCES 的 ON DELETE 子句會被保留到 ALTER TABLE，不再丟失
- **層 3 Semantic Consistency Validator**：新檔 `services/semantic-consistency-validator.ts`（~350 行）+ 7 個測試。3 類檢查：(A) Scenario 名稱 vs DataTable 期望值（「應變為 null」但 DataTable 寫 UUID → error）；(B) Scenario 期望 vs Schema FK 行為（期望 cascade null 但 Schema 沒 SET NULL → error）；(C) 同 Feature 跨 scenario 期望矛盾（warning）
- **層 4 Feature Alignment Gate 整合**：`feature-alignment-gate.ts` 加第 7 項檢查（semantic_consistency），matches LLM 修復 + blockMessage 升級優先顯示 semantic 矛盾
- **層 5 Fix Loop 跳過**：`coder-generation.ts` 的 `classifyFailureRootCause` 加 `spec_inconsistency` 類別（偵測 scenario 名說 null + expect 非 null + actual=null 的模式）。`fixFailingAction` 遇到此類別直接 return 原代碼，不浪費 tokens
- **層 6 用戶訊息升級**：`coder-phases.ts` 的 Coder testing 結果訊息呼叫 `analyzeSpecIssuesInFailures`。若偵測到 spec 矛盾，顯示具體矛盾點 + 修復建議 + quickReply「審查並修改 Feature」
- **層 7 Discovery 主動問**：`services/prd-discovery.ts` 的 A8 級聯效應檢查強化——當需求涉及多 entity 關聯時主動生成 Relationship Lifecycle 問題（「刪父時子如何處理？」4 選項），從源頭避免 Feature/Schema 矛盾
- **層 8 Feature ↔ actionsYml Summary 機械強制對齊**（2026-04-14）：解決 Coder testing「找不到 API 操作」9/9 全失敗 bug。Feature 與 actionsYml 是兩次獨立 LLM 生成，用詞漂移導致 SpecFormula findBySummary 失敗。根治：**機械對齊 features.name → actionsYml.summary**，不靠 LLM 自律。修 `alignFeatureSummaries` substring bug（單向容錯誤判）；新增 `alignActionsYmlSummariesToFeatures` 函數（actions-design.ts）在 YAML parse 後強制覆寫 summary；RED Phase 加 Check 4b + Alignment Gate 加 Check 6b 檢查每個 When 步驟 summary 在 actionsYml 存在；Fix loop 加 `api_summary_mismatch` rootCause + `shouldSkipLlmFix` skip；coder-phases 用戶訊息顯示具體找不到的 summaries + 建議回 BDD 修正；`findBySummary` 加 backward substring 容錯網（長度 ≥4 門檻避免誤匹配）+ warning log
- **層 9 Feature 粒度統一 1 Feature = 1 Operation**（2026-04-14）：解決 RED Phase 35 個 `when_summary_mismatch` error 的根因——formulation prompt 允許 CRUD 合併成單一 Feature，但 convertToOpenAPI 是 1:1 映射，導致 OpenAPI spec 少了子操作 operation。根治：**移除 formulation 的「CRUD 可合併」規則，強制 1 Feature = 1 Action = 1 HTTP Operation**（服務於現有 `findBySummary` 在 operation.summary 層級查找的設計）。禁止 `manage_` / `_management` / `_system` / `_module` 聚合詞。CRUD 必須拆成 4 個獨立 Feature（如 `add_transaction` / `list_transactions` / `update_transaction` / `delete_transaction`）。`identifyFeatures` 加 `warnOnAggregateFeatures` 後置偵測；RED Phase Check 4b 錯誤訊息升級，根因提示（「Feature 粒度過粗」+ 拆分建議）；新增 `feature-granularity.test.ts` 驗證。好處：所有既有對齊機制（alignFeatureSummaries / alignActionsYmlSummariesToFeatures / Check 6b）天然生效。
- **層 9 + 舊對話逃生出口** `__regenerate_features__` quickReply：第 9 層部署後，舊對話（用舊規則生成 CRUD 合併 Feature）進 Coder 會卡在 `when_summary_mismatch`。新增一鍵重生機制：`coder-phases.ts` 的 `regenerateFeaturesTask` 從既有 BDD session 重跑 formulation（保留 originalRequirements + resolvedItems + ES doc），清空 features/actionsYml/openApiSpec/isaConfig，呼叫 `generateDraftBatch`/`runFormulation` → 寫回 features → 觸發 `completeSpecPhase` 自動跑 actionsYml/isaConfig/DB provisioning/dry-run。Alignment Gate blocked 訊息和 Coder testing API mismatch 訊息都加 `__regenerate_features__` quickReply（primary）。`handleUiuxMixedPhaseRouting` 攔截 token（兼顧 LangGraph + 舊路徑）。**實測耗時 7-10 分鐘**（validation 3 輪 LLM 修復 + actionsYml + isaConfig + Neon + dry-run）。
- **層 9 + 長任務防卡死**（2026-04-15）：修復 `regenerateFeaturesTask` 靜默卡死 bug。用戶回報對話 stuck 在 `phase=formulation`，根因：(1) BullMQ `lockDuration=300s`（5 min）<< 實測耗時（7-10 min），worker 被 stall detection kill → FlowState 孤兒；(2) `completeSpecPhase` 無 timeout，LLM 卡住會讓整個 pipeline hang；(3) `validateAndFixFeatures` 3 輪硬跑，錯誤數不降也繼續浪費 2 分鐘；(4) 進度訊息只有「正在生成...」用戶無法判斷是否活著。修復：`orchestrator.ts` `lockDuration: 300_000 → 1_200_000`（20 min）；`regenerateFeaturesTask` 用 `Promise.race` 包 `completeSpecPhase` 加 15 min timeout；`feature-validation.ts` 加 early stop（round ≥ 1 且 errorCount >= prevErrorCount 提早退出）；`regenerateFeaturesTask` 加階段性進度訊息（步驟 1/4 Features 生成 → 步驟 2/4 驗證 + actionsYml + isaConfig，ETA 5-7 min）。
- **Draft Batch max_tokens 截斷修復**（2026-04-18）：1 Feature = 1 Operation 粒度下 Feature 數翻倍（CRUD 拆 4 個），`generateDraftBatch` 的 `maxTokens` floor 16384 不足，導致 structured output JSON 在 40765 字元被截斷（`Unterminated string`）。SDK `messages.parse()` 截斷時直接 throw（不走 `stop_reason` 檢查）。修復：maxTokens floor 從 16384 → 32768（自動觸發 streaming 路徑 > STREAMING_THRESHOLD 21000），per-feature 估算從 2000 → 3000 tokens。
- **Feature 花括號語法全修復 + Fix Loop 浪費根治**（2026-04-18）：Formulation prompt 用 `{entity}` 做範本佔位符（formulation.ts:767），LLM 照抄花括號 → 輸出 `準備一個{顧客}, with table:` → SpecFormula entity_setup regex `[\u4e00-\u9fffa-zA-Z0-9_]+` 不含 `{}` → 54 個 scenario 100% 失敗。Fix loop 把 `步驟無法匹配` 歸 `unknown` rootCause → 53 輪白燒 LLM。**三層修復**：(1) `sanitizeFeatureContent` 加 `準備一個{X}` → `準備一個X` 花括號剝除（同時處理 `應該存在一個{X}`）；(2) Prompt 5 處 + bdd-spec 2 處 `{entity}` 改為具體範例（`準備一個商品, with table:`），明確禁止花括號；(3) `classifyFailureRootCause` 新增 `step_parsing` rootCause（偵測 `步驟無法匹配`），加入 `shouldSkipLlmFix` 短路，徹底杜絕浪費 LLM 修 Feature 語法問題。
- **Phase 2B interrupt 實裝**：Domain / Clone / Fast Build 三個 subgraph 從 wrapper 升級為多 node + `interrupt()` human-in-the-loop
  - **Domain**（8 nodes, 3 interrupt, 2 loops）：entry → search → confirm（interrupt×2：確認/registrant 表單）→ register → complete。DNS path：dns_setup（interrupt）→ dns_verify → complete。retry_or_cancel interrupt + 換域名/DNS 未傳播 loop
  - **Clone**（3 nodes, 1 interrupt）：execute（完整 clone pipeline）→ failed interrupt（重試/取消 loop）
  - **Fast Build**（4 nodes, 2 interrupt）：execute（concept+pipeline）→ batch_decision interrupt（多頁繼續/完成）→ resume → batch loop。failed interrupt 重試
- **Phase 2C BDD + UIUX 完全拆分**：兩個最複雜的 skill 從 wrapper 升級為多 node + interrupt subgraph（0 業務邏輯改動，純 graph 編排）
  - **BDD**（11 nodes, 6 interrupt）：entry → es_init_wait → es_explore_wait（DFS loop）→ prd_clarify_wait（統一 prd/spec/batch clarify loop）→ prd_next_round → formulation → draft_review_wait → spec_discovery → complete_spec。Sidecar：spec_change_wait + spec_rollback_wait。auto_adopt 在 clarify node 內透明處理
  - **UIUX**（9 nodes, 5 interrupt）：entry → preference_wait（Path A/B）→ clarify_wait（4-step loop）→ brief_confirm_wait（adjust loop max 3）→ template_wait → variant_wait → code_pipeline（自動化）→ mixed_routing（iteration/deploy/rollback）→ complete

**Fix Loop 根治（96/114 → 目標 110+/114）**：
- **Fix prompt 注入 BDD Feature content**：`fixFailingAction` 的 user message 加入完整 Gherkin（截取 8KB），讓 LLM 修復時能看到 Background 資料準備 + Then 預期回應欄位。此前 LLM 只看到 error message，不知道測試期望什麼
- **Fix 後 `import { sql }` 安全網**：初始生成有安全網，但 fix 後的代碼沒有 → `sql is not defined` 持續。現在兩處（逐 Feature + 回歸）都在 fix 回寫前檢查 + 注入
- **Per-SubOp 模式加 imports + Feature context**：Per-SubOp 修復只傳單一函數體，LLM 看不到 import 區塊 → 加入 imports 區塊 + Feature content 到修復 prompt

**SpecFormula 完善（剩餘失敗分類修復）**：
- **NUMERIC 通用數值正規化**：`valuesEqual()` 加入 `parseFloat` 比較（`"800" == "800.00"` → true），解決 PostgreSQL NUMERIC 回傳 "800.00" vs DataTable "800" 的字串比較失敗
- **Cleanup TRUNCATE + DELETE fallback**：`cleanupTables()` 首選 `TRUNCATE RESTART IDENTITY CASCADE`，失敗時 fallback 逐表 `DELETE FROM`（反向順序避免 FK 衝突）
- **Junction table 複合 PK 警告**：`parseTablePrimaryKeys()` 偵測複合主鍵表 → `generateColumnListText()` 加 ⚠️ 警告 → `BASE_PROMPT` 加 junction table 指引 → `validateSqlColumns()` 偵測 `WHERE id =` 在無 id 的表
- **Feature 多 Feature 區塊截斷**：`sanitizeFeatureContent()` 偵測單一 content 含多個 `Feature:` 宣告 → 截斷保留第一個 + formulation prompt 加規則禁止

### SpecFormula Java Reference 移植 + Coder Pipeline 根治（2026-04-04 ~ 2026-04-05）

**Fix Loop 根治**：
- **temperature + thinking API 衝突修復**：`callClaude` / `callStructured` 在 thinking 啟用時不傳 temperature（Anthropic API 要求 thinking 時 temperature=1）。此前 fix loop 14 輪全部 API 400 crash，LLM 根本未被呼叫
- **Feature summary 自動對齊**：`alignFeatureSummaries()` 確保 When 步驟 summary 與 feature.name 100% 一致，消除 `找不到 API 操作` 錯誤（BDD Feature When 步驟寫「建立待辦」但 actionsYml summary 是「建立待辦事項」）
- **SQL 欄位靜態驗證**：`validateSqlColumns()` 用 DDL 驗證生成代碼的 SQL 欄位引用，自動移除不存在的 `deleted_at IS NULL` / `user_id` scope
- **Slot 欄位驗證**：`validateSlotColumns()` 在 template render 前驗證 `softDeleteColumn` / `scopeColumn` 是否存在於 DDL
- **Test server export 名稱修復**：`generateTestServerCode()` 從 handler 檔案實際內容讀取 export 函數名稱（不再用 action name 猜）
- **Entity mapping 多格式正規化**：`normalizeEntityMapping()` 支援三種 YAML 格式（標準 array / 擴充 object+zh+table / 平坦 key-value），修復 `entity_to_table_mapping is not iterable` crash

**Java SpecFormula Reference Implementation 移植**（來源：`specformula-dev-framework/specformula-java/`）：
- **PathTokenizer**（新建 `helper/path-tokenizer.ts`）：ADR-0019 bracket notation 逃脫語法（`["key.with.dot"]`），從 Java `PathTokenizer.java` 完整移植
- **getNestedValue / containsNestedKey 升級**：用 PathTokenizer 取代 `path.split('.')`，支援 top-level array（`[0].field`）、bracket escape、dot notation 混合路徑
- **EntitySetup JSON Path header reconstruction**（ADR-0022）：`rewriteJsonPathHeaders()` + `reconstructJson()` + `tokenizeSubPath()`，支援 `profile.address.city` 和 `items[0].productId` 巢狀結構自動重組為 JSON
- **EntityValidate JSON 巢狀欄位導航**：`navigateJson()` 支援 dot notation + bracket array indexing + PostgreSQL JSON/JSONB 字串自動解析
- **ApiCall B: prefix**（ADR-0018）：`parseColumnPrefix()` 支援 `B:` raw body 參數前綴
- **TypeConverter 空字串 → null**：對齊 Java TypeConverter 行為
- **PostgreSQL Cleanup Plan**：從 Java `PostgresDialect` 移植，逐表 DISABLE TRIGGER → TRUNCATE CASCADE → ENABLE TRIGGER

**全面容錯審計（26 個脆弱 throw → soft-fail）**：
- execution key 找不到 → 存 null（不 throw）
- 陣列索引超界 → return false
- 未知 constraint `&xxx` → return true（跳過）
- 時間/日期解析失敗 → fallback 到 now/today
- 數字轉換失敗 → return 0
- malformed JSON path → 跳過
- `&between` 參數不足 → return false
- `&isNull` 在 entity_setup → 跳過欄位（DB 用 DEFAULT）
- response_validate 缺 DataTable → warn + skip

### 地基建設（2026-01-31 ~ 2026-02-28，已整合到現行系統）

- **BDD Skill 完整流程**（02-24~25）：ES Phase 0 + Discovery/Clarify/Formulation + Actions Design + ISA Config + 變更管理
- **UIUX 生成管線**（02-05）：5 變體 + Design System + Structure→Animation→RWD 三階段
- **Fast Build**（02-09，02-25 升級）：一句話建站 + 產品類型/配色庫 + Tier 偵測 + App/Website 佈局
- **Quality Gate**（02-06，後續多次升級）：5 類靜態檢查 + Design Tier 合規 + Rule-based + Haiku LLM fallback
- **VPS 後端遷移**（02-03）：Vercel Serverless → Express + BullMQ + Socket.io
- **認證 + 儀表板 + 帳號綁定**（02-27）：Google/LINE OAuth + JWT 雙軌 + user_providers 雙綁 + 管理員面板 + LLM 用量
- **LINE 整合**（02-27）：Webhook/Handler/Translator/Full Push + LIFF + Flex Message 推播
- **BDD 需求藍圖面板**（02-27）：純 React Q&A 歷史面板
- **智能模板匹配 + 迭代 Skill**（02-15~16）：三層評分（零 LLM） + iteration-skill.ts + 撤銷/回滾
- **防禦體系**（02-08~28）：safeParseJson 四層、Classifier 9 層 + Content Policy、三層防刷（前端冷卻 + Redis Lua + Worker 鎖）
- **i18n Phase 1+2**（02-28）：883 keys / 29 namespaces，Server Action error code 機制
- **已被取代**：Sandpack 串流預覽（03-17 → WebContainers）、3D 鍛造場景（02-27 → BDD 藍圖面板）、2D 即時預覽（03-17 → WebContainers HMR）

</details>
