# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

Tellcraft 是一個 **AI 驅動的自動化開發平台**。用戶描述需求，AI 自動釐清細節、生成程式碼、部署上線。

核心流程：`描述需求 → AI 釐清 → 確認規格 → 自動生成 → 一鍵部署`

## 常用指令

```bash
# 前端開發（Vercel 上的 Next.js）
pnpm install              # 安裝依賴
pnpm dev                  # 啟動 Next.js（http://localhost:3000）
pnpm lint / typecheck     # ESLint / TS 型別檢查
pnpm test / test:ci       # Vitest（watch / CI 全跑前後端）

# VPS 後端開發（tellcraft-backend/）
cd tellcraft-backend
pnpm install && pnpm dev  # http://localhost:3100，tsx watch 熱更新
pnpm build                # tsc → dist/
pnpm typecheck / test / test:ci

# BDD 規格驗證（修改 Feature Files 後必須依序執行）
npx ts-node bdd-spec/scripts/lint-gherkin-format.ts spec/features/   # ISA Format Lint
npx ts-node bdd-spec/scripts/validate-feature.ts spec/features/      # 結構驗證
# 選項：--json, --strict, --fix

# Skill Telemetry 週報（人工回灌 prompt 用）
cd tellcraft-backend && pnpm tsx src/scripts/telemetry-weekly-report.ts              # 預設 7 天 markdown
cd tellcraft-backend && pnpm tsx src/scripts/telemetry-weekly-report.ts --days=1 --json

# Prompt Change 註冊（改了 prompt 或加了 code rule 後執行）
cd tellcraft-backend && pnpm tsx src/scripts/register-prompt-change.ts --pattern <key> --skill <name> --action <prompt_fewshot|sanitize_rule|qg_rule> --target <file>
cd tellcraft-backend && pnpm tsx src/scripts/register-prompt-change.ts --list / --retire <id>

# VPS 部署（SSH 後執行）
git pull && pnpm build && pm2 startOrReload ecosystem.config.js --wait-ready

# VPS 除錯
pm2 logs tellcraft-api --lines 100        # API 進程日誌
pm2 logs tellcraft-worker --lines 100     # Worker 進程日誌
pm2 status / describe tellcraft-backend
# 日誌檔案：/var/log/tellcraft/{out,error}.log
```

## 系統架構

### 雙端架構：Vercel 前端 + VPS 後端

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

**Tellcraft 平台自身**前端不直連資料庫：`Server Actions → app/lib/vps-api.ts → VPS Express API → PostgreSQL`

**Coder Skill 生成的客戶 app** 使用 Server Actions + Neon 直連，這是合法且推薦的現代架構，不受此限制。

**為什麼用 VPS**：Vercel Serverless 超時限制（10-60 秒）無法處理長時間 LLM 任務。

**注意事項**：
- 前端路徑別名 `@/*` 映射到 `./*`（tsconfig.json paths），後端無路徑別名
- 前後端 TypeScript 完全隔離（tsconfig exclude `tellcraft-backend/` 和 `prompts/`）
- 前端 package.json name 為 `ai-genesis`（歷史遺留），專案實際名稱是 `tellcraft`

### 核心模組

**後端（`tellcraft-backend/src/`）**

| 模組 | 路徑 | 職責 |
|------|------|------|
| Orchestrator | `workers/orchestrator.ts` | BullMQ Worker + handleProcessMessage + handleContinueFlow |
| Phase Router | `workers/phase-router.ts` | Phase 路由分派 + deployer_failed/complete 子路由 |
| Intent Helpers | `workers/intent-helpers.ts` | 意圖判斷 + 常數（PHASE_BACKTRACK_MAP 等） |
| BDD Phases | `workers/phase-handlers/bdd-phases.ts` | ES/Discovery/Clarify/Formulation/Spec |
| UIUX Phases | `workers/phase-handlers/uiux-phases.ts` | Discovery/Brief/Variant/CodePipeline |
| Deploy Phases | `workers/phase-handlers/deploy-phases.ts` | prepareDeployment + executeDeployment |
| Fast Build Phases | `workers/phase-handlers/fast-build-phases.ts` | 快速建站增量生成 |
| Clone Phases | `workers/phase-handlers/clone-phases.ts` | 三模式（URL/圖片/混合）→ inline QG → uiux_complete |
| Web Clone Service | `services/web-clone-service.ts` | DOM/CSS 提取、section 切割、Sonnet Vision 生成 |
| Coder Phases | `workers/phase-handlers/coder-phases.ts` | BDD → RED Phase → Coder Pipeline → GREEN 測試 |
| Feature Alignment Gate | `services/feature-alignment-gate.ts` | 阻斷式 6 項對齊檢查 + LLM 修復（2 輪） |
| Syntax Validator | `services/syntax-validator.ts` | esbuild TSX 驗證 + Haiku 修復 |
| RED Phase Validator | `services/red-phase-validator.ts` | L1 靜態（12 項）+ L2 StubHttp + L2.5 Routing |
| Domain Phases | `workers/phase-handlers/domain-phases.ts` | 域名全流程（搜尋/購買/註冊/DNS/完成/失敗） |
| Orchestrator Utils | `workers/orchestrator-utils.ts` | sendMessage/streamLlmMessage/saveFlowState 等 |
| FlowState 型別 | `types/flow-state.ts` | FlowState 介面 + 子型別（避免循環 import） |
| Classifier | `services/classifier.ts` | 三層防禦：Prefilter → Meta Intent → Skill 分類 |
| UIUX Generation | `services/uiux-generation.ts` | Brief/Variants/Structure/Animation/RWD/Refine |
| Quality Gate | `services/quality-gate.ts` | 5 類靜態檢查 + Design Tier 合規 + Rule-based + Haiku fallback |
| CSS 一致性審計 | `services/css-consistency-audit.ts` | 灰階/圓角/字級/shadow/spacing per-file + global 統計 + button variant fingerprint |
| Tailwind 色板解析 | `services/tailwind-color-resolver.ts` | `resolveColor(token)` → HEX，24 個 family × 11 階 + arbitrary value |
| 設計品質報告 | `services/design-quality-report.ts` | 4 維度 0-100 評分 + overallScore 加權平均（accessibility 35%）|
| Coder Generation | `services/coder-generation.ts` | parseActionsYml → generateActionFunction → generateServerActions → rewriteComponentForServerActions |
| Deployer | `services/deployer.ts` | sanitize → build 驗證 → Vercel 部署 → 回滾 |
| Iteration Skill | `services/iteration-skill.ts` | 迭代修改 + 撤銷 + 版本回滾 |
| Fast Build | `services/fast-build-generation.ts` | tier 偵測、產品推斷、默認 DesignSystem（零 LLM） |
| Design Techniques | `services/design-techniques.ts` | 30 個視覺技法，按 tier+productType 加權注入 |
| Composition Patterns | `services/composition-patterns.ts` | 20 個 section-level 佈局模式 + page-type-aware 選擇 |
| Reference Analyzer | `services/reference-analyzer.ts` | URL→截圖+DOM/Vision，5 層降級（vendored/vision/image/metadata/text）|
| Design System Freeze | `services/design-system-freeze.ts` | variant 選定後 hash + audit log + vendored→DesignSystem 轉型 |
| UI Evaluator | `services/ui-evaluator.ts` | 黑盒 QA：screenshot + DOM + axe-core a11y + readability + structure probe |
| Design Token Compliance | `services/design-token-compliance.ts` | DesignSystem 允許色族 → 掃代碼違反者報 critical |
| Design MD Loader/Parser | `services/design-md-{loader,parser}.ts` + `types/design-system-schema.ts` | 載入 vendored awesome-design-md submodule（71 brand）+ regex parse |
| Brand Domain Map | `services/brand-domain-map.ts` | URL/自然語言 → brandKey（含 word boundary 防誤觸發） |
| Template Matcher | `services/template-matcher.ts` | 三層評分智能匹配（關鍵詞 40 + Category 30 + UISpec 30，零 LLM） |
| Design Moods | `services/design-moods.ts` | 8 個設計情緒預設 + 規則推薦 + prompt 注入 |
| Semantic Gateway | `services/semantic-gateway.ts` | quickFilter 短路 + Sonnet 六元 verdict |
| Customer Service | `services/customer-service.ts` | detectFastModeIntent + FAQ 零 LLM 匹配 + answerWithSonnet |
| Prefilter | `services/prefilter.ts` | 全域輸入預過濾 + phase-aware 二次攔截 + Redis anti-loop |
| Domain Service | `services/domain-service.ts` | Porkbun + Cloudflare DNS + Vercel 綁定 + RDAP + rollback |
| Neon Service | `services/neon-service.ts` | 同步建立 PostgreSQL DB + 套用 Schema，< 10s |
| Schema Derivation | `services/schema-derivation.ts` | schemaSql → PostgreSQL DDL（零 LLM，ID→UUID/RLS/created_at） |
| FlowState Recovery | `services/flowstate-recovery.ts` | 每 2 分鐘掃描，逾時 phase 自動恢復 |
| Conversation Lock | `services/conversation-lock.ts` | Redis SET NX EX 互斥鎖（TTL 5min） |
| LINE/Telegram 整合 | `services/{line,telegram}-*.ts` | Notify 推播 + Bot Handler + Message Translator |
| Env / Anthropic / Structured Output | `lib/{env,anthropic,structured-output}.ts` | Zod 環境變數 + 統一 Client 單例 + `callStructured<T>()` |
| Validate / Schemas | `middleware/validate.ts` + `schemas/*.ts` | Zod 請求驗證 + API schema |
| SpecFormula | `lib/specformula/`（31 檔） | SDD 驗證引擎：Feature Files → HTTP API → DB 驗證 |
| Job Failure | `services/job-failure-handler.ts` | BullMQ 最終失敗持久化 + 用戶通知 |
| Skill Telemetry | `services/skill-telemetry.ts` + `scripts/telemetry-weekly-report.ts` | 4 成功 + 10 failure 埋點 → DB → 週報，**禁止自動回灌** |
| Error Enrichment | `services/error-enrichment.ts` | rootCause → harnessHint 注入 LLM prompt（fixFailingAction/RED Validator/Alignment Gate） |
| Preview Gate | `services/preview-gate.ts` | 寫 Redis 前 esbuild 批次驗證，壞代碼不推送 |

**前端（`app/`）— 大檔案優先閱讀**

| 模組 | 路徑 | 行數 | 職責 |
|------|------|------|------|
| 主頁面 | `app/[locale]/page.tsx` | ~360 | HomeContent 編排（Hero + Chat + Landing + Auth） |
| 對話容器 | `app/components/chat/ChatSection.tsx` | ~994 | 對話組合容器（5 hooks + handleSend） |
| 消息列表 | `app/components/chat/ChatMessageList.tsx` | ~771 | 消息渲染 + 輸入框 + richContent 分派 |
| 預覽面板 | `app/components/chat/ChatPreviewPanel.tsx` | ~651 | 右側預覽（BDD/FastBuild/CodePreview/Template） |
| 共用型別 | `app/types/chat.ts` | ~67 | Message/SessionInfo/ConversationItem/COMMAND_KEYS |
| 聊天 Hooks | `app/hooks/useChat*.ts` + `useLoginPrompt.ts` | ~1063 | 滾動/編輯器/輪詢/會話/登入提示 |
| LLM 工具 | `app/lib/llm.ts` | ~2200 | LLM 呼叫封裝、prompt 工具 |
| VPS API Client | `app/lib/vps-api.ts` | ~1900 | 前端呼叫 VPS 的 HTTP 客戶端 |
| Server Actions | `app/actions/index.ts` | ~1800 | 對話/訊息/專案 Server Actions 入口 |
| WebContainer 預覽 | `app/lib/webcontainer-utils.ts` + `WebContainerPreview.tsx` | | WebContainers 跑 Next.js dev server，preloader pre-boot |
| Remotion 動畫 | `app/components/remotion/` + `building-scene/` | | Fast Build 工廠 + BDD 蓋房子 3D 動畫 |
| Landing 組件 | `app/components/landing/` | ~1978 | 16 個自包含 Landing 組件 |

### LangGraph 編排層（`graph/`，Feature Flag）

BullMQ 的 `handleProcessMessage` + `handleContinueFlow` 是現行生產編排。`graph/` 是基於 `@langchain/langgraph` StateGraph 的並行實作，由 `USE_LANGGRAPH=true` 啟用（預設 off）。

```
classify → phase_router → skill subgraph（bdd/uiux/fast/coder/deployer/domain/clone）→ END
```

**Pointer State Pattern**：State 只存路由 metadata（~1KB），大資料留 Redis + PostgreSQL。`graph/context.ts` 注入 Redis + Socket.io，`graph/checkpointer.ts` 用 PostgresSaver 持久化（`032_langgraph_checkpoints.sql`）。

開啟後 LangGraph 接管整個訊息處理，但 skill subgraph 內部仍呼叫現有 phase handler。新增/修改 phase handler 必須同步 `graph/nodes/phase-router.ts`。

### Skill 系統

| Skill | 用途 |
|-------|------|
| `bdd-spec` | 需求釐清 + BDD 規格產出（Discovery → Clarify → Formulation → Actions Design → ISA Config）|
| `uiux` | 前端介面設計（Design Discovery → Design Lab → Implementation）|
| `quality-gate` | UIUX/Fast Build/Clone 完成後**自動觸發**，5 類靜態檢查 + Design Tier 合規 + Rule-based/LLM 雙層修復（UIUX 3 輪 / Fast+Clone 2 輪）|
| `coder` | 後端代碼生成：actionsYml → lib/actions + app/actions + 改寫 UIUX 組件（需 BDD + Neon DB）|
| `deployer` | UIUX+Coder → Next.js → Vercel（用戶說「部署」觸發） |
| `iteration` | 迭代修改 + 撤銷 + 版本回滾（complete 階段自動路由） |
| `fast-build` | 一句話 → 跳過 BDD/Discovery → inferInteractionHint → 增量生成 → 靜態 QG → Preview |
| `domain-manager` / `domain-purchase` / `domain-dns` | 域名管理/購買/自有綁定（付費限定，配額 creator:1/pro:2-3/business:3-5） |
| `db-provision` | BDD 完成後自動建 Neon DB + 套用 Schema（同步 < 10s）（付費限定）|
| `clone` | 三模式（URL/圖片/混合）→ inline QG → `uiux_complete`，`clone_failed` 統一錯誤處理+重試 |

### Orchestrator Phase 狀態機

所有 phase 必須在 `handleContinueFlow` 中有對應路由：

| Phase | 說明 |
|-------|------|
| `spec_clarify` / `spec_completed` | BDD 需求釐清 / 完成 |
| `uiux_design_preference` | Discovery Path A 問卷（feeling → reference → color → layout） |
| `uiux_design_clarify` | Discovery 補充釐清 |
| `uiux_design_brief_confirm` | Design Brief AI 顧問確認（推薦 Design Tier） |
| `uiux_template_selection` | Discovery Path B 模板選擇 |
| `uiux_variant_selection` / `uiux_generating_variants` | Design Lab 變體選擇 / 生成中 |
| `uiux_code_generation` | Implementation 確認/重做（Structure → Animation → RWD） |
| `uiux_quality_gate` | Quality Gate 執行中 |
| `uiux_complete` / `uiux_iterating` | UIUX 完成 / 迭代修改中 |
| `fast_generating` | 快速模式生成中（`fastBuildStage=awaiting_continue` 時暫停等用戶確認） |
| `coder_generating` | Coder 生成後端代碼中（攔截輸入，15min 超時恢復到 uiux_complete） |
| `deployer_deploying` / `failed` / `complete` | 部署流程（無二次確認） |
| `deployer_rollback_select` | 等用戶選擇回滾版本 |
| `domain_searching` / `confirm_purchase` / `registering` / `own_setup` / `dns_verifying` / `complete` / `failed` | 域名各階段 |
| `clone_analyzing` / `generating` / `failed` | Clone 分析中（5min 超時）/ 生成中（20min 超時）/ 失敗（支援貼新 URL 或圖片重試） |

### UIUX Pipeline 概覽

```
BDD 完成 → matchTemplates()（零 LLM，三層評分）
  ├─ 有匹配 → "討論式設計 / 使用模板(N個推薦)"
  └─ 無匹配 → "開始設計"
Discovery（Path A 問卷 / Path B 模板）
  → completeDesignClarify：並行分析上傳圖片 + URL → 合併 visionAnalysis → 快取 FlowState
  → Design Brief 確認（AI 顧問 + Design Tier 推薦，最多 3 輪）
  → BDD→UI 翻譯（Haiku，快取 uiuxUISpec）
  → 5 變體生成 + 用戶選擇 → extractVariantConcept()
  → Implementation: generateStructure(+Interaction) → generateAnimations() → generateRwd()
  → Quality Gate 自動觸發
  → 迭代修改（refineCode）↔ 部署（deployer）↔ 回滾
```

### Fast Build Pipeline（快速模式）

```
用戶描述（mode=fast，可附參考圖片）→ 跳過 Classifier
  → checkBuildRelevance（vague 攔截 + quickReplies 引導）
  → detectDesignTier → inferProductType → buildDefaultDesignSystem → inferInteractionHint
  → analyzeUploadedImage（Haiku Vision，降級跳過）
  → generateFastConcept（1 次 Haiku，suggestedPages 限 1 頁）
  → 單批生成 S+A(+R)+QG（FAST_BUILD_MERGED_ANIM_RWD=true 時 A+R 合併）
  → phase='uiux_complete'（複用迭代/部署/回滾）
  單頁深度模式：5-8 個 Section + anchor link
```

- **Design Tier**：`functional`（dashboard/SaaS，禁漸層/glow）vs `creative`（landing，允許大膽）
- **串流預覽**：Socket.io `preview_update` → WebContainer `fs.writeFile()` → HMR
- **失敗重試**：`__retry_fast_build__` quickReply

### Deployer Pipeline（五層防禦）

```
L1: validateComponentReferences → repairMissingComponents（LLM 修復缺失引用）
L2: sanitizeCodeForDeploy（8 類自動修復 + broken import → stub 組件 + ?? 與 ||/&& 混用加括號）
L3: fixBuildErrors（API 指數退避重試 3 次）
L4: verifyBuildLocally（3 次 LLM 修復 + 1 次驗證 build，共 4 次 build）
L5: useSearchParams Suspense boundary 自動拆分
  → Vercel 部署 → 部署後可迭代或回滾（Vercel Promote API）
```

### 後端 API 路由（`tellcraft-backend/src/routes/`）

| 路由檔案 | 掛載路徑 | 說明 |
|----------|----------|------|
| `conversation.ts` | `/api/conversations` | 發訊息/回覆/歷史 |
| `project.ts` | `/api/projects` | CRUD + files/versions/iterate |
| `session.ts` | `/api/session` | initialize + conversations |
| `bdd.ts` | `/api/bdd` | CRUD + answer/confirm/revert/skip |
| `templates.ts` | `/api/templates` | 列表/詳情/預覽/管理 |
| `operations.ts` | `/api/operations` | 生成/部署/任務/訂閱（最大路由） |
| `dashboard.ts` | `/api/dashboard` | 統計 + Admin |
| `auth.ts` | `/api/auth` | Google/LINE OAuth |
| `health.ts` / `user.ts` / `upload.ts` | `/api/{health,user,upload}` | 健康/用戶/圖片上傳（5MB） |
| `line-bot.ts` / `telegram-bot.ts` | `/api/{line,telegram}/webhook` | Bot Webhook（LINE raw body 在 express.json 前）|
| `domain.ts` | `/api/domain` | CRUD + DNS + pricing |

前端 Proxy：`app/api/vps/[...path]/route.ts` 將 `/api/vps/*` 轉發到 VPS。

### Locale / 認證 / 代碼存儲

- 前端使用 `app/[locale]/`（zh/en），`app/hooks/useLocalePath.ts` + `LocaleSwitcher.tsx`，LIFF 在 `app/[locale]/liff/page.tsx`
- 認證：`登入頁 → Vercel Proxy → VPS OAuth → JWT → localStorage（hook）+ Cookie（middleware）`
- `project_files` 表：`(project_id, skill_source, file_path)` 唯一索引，UPSERT；`skill_source`: uiux/code/merge；Deployer 優先讀此表，fallback `bdd_sessions`

### 資料庫 Migration

`tellcraft-backend/migrations/` 共 36+ 個（`001` ~ `036`），檔名自說明。

**自動套用**：每次 push 到 `main` 觸發 `.github/workflows/deploy-vps.yml`，VPS 部署步驟會跑 `bash scripts/migrate.sh`：
- 用 `_migrations` 表追蹤已套用檔名（idempotent，不會重做）
- 每個檔案包在 transaction（`-1`），失敗 rollback + 終止後續

**首次切換到 migrate.sh（VPS 上 001~034 已手動套用）**：
```bash
# 1. 把已套用的 001~034 標記為已套用（不執行 SQL）
DATABASE_URL=... bash scripts/migrate.sh --bootstrap-up-to=034
# 2. 自動跑 035 + 036 + 之後的（真實執行）
DATABASE_URL=... bash scripts/migrate.sh
```

**手動操作**：
```bash
DATABASE_URL=... bash scripts/migrate.sh --dry-run                  # 預覽待套用
DATABASE_URL=... bash scripts/migrate.sh --bootstrap-up-to=034      # 標記 ≤034 為已套用（不跑）
DATABASE_URL=... bash scripts/migrate.sh                            # 套用未執行的（之後 deploy 自動）
DATABASE_URL=... bash scripts/migrate.sh --bootstrap                # 標記全部為已套用（危險，僅當 DB 完全同步時用）
```

**禁止**：直接 `psql -f migrations/xxx.sql` 不更新 `_migrations` 表 → 下次 deploy migration 重跑造成 `relation already exists`。緊急 hotfix 時若繞過腳本，務必接著 `INSERT INTO _migrations VALUES ('xxx.sql')` 補登。

### Skill 定義目錄

| 目錄 | 說明 |
|------|------|
| `bdd-spec/` | `skill.md`（metadata/觸發）、`instructions/`（00-06 phase）、`scripts/`、`resources/` |
| `uiux-skill/` / `quality-gate-skill/` | 設計階段指引 / QG Skill 定義 |
| `spec/` | BDD 產出：`features/`、`actions/`、`data/` |

### CI/CD

- **VPS**：push `main` → GitHub Actions SSH → `git reset --hard origin/main` + `pnpm install --frozen-lockfile` + `pnpm build` + `pm2 startOrReload`（雙進程：`tellcraft-api` + `tellcraft-worker`，見 `.github/workflows/deploy-vps.yml`）
- **前端**：push `main` → Vercel 自動部署

### 基礎設施配置

- **`vercel.json`**：region `sin1`、`maxDuration: 60`
- **`ecosystem.config.js`**：PM2 單實例、`max_memory_restart: '4G'`、日誌 `/var/log/tellcraft/`、優雅關閉 10s
- **`tellcraft-backend/nginx/tellcraft.conf`**：Port 80 → 3100、`client_max_body_size 6m`、WebSocket `proxy_read_timeout 86400s`

### 測試

後端 **Vitest**，測試在 `tellcraft-backend/src/__tests__/`（33 個檔案，涵蓋核心服務 / 設計系統 / SpecFormula / Coder/RED Phase / 生成規則）。

```bash
cd tellcraft-backend && pnpm test -- src/__tests__/intent-helpers.test.ts
cd tellcraft-backend && pnpm test -- --grep "hasDeployIntent"
```

前端目前無測試。其他品質保障：BDD 規格驗證腳本、`pnpm typecheck` / `lint`、Quality Gate 靜態檢查 + Rule-based 5 規則 + Haiku LLM fallback。

## BDD 規格格式（sdd.os ISA SpecFormula 標準）

| 步驟類型 | 格式 |
|----------|------|
| 資料準備 | `準備一個{entity}, with table:` |
| 時間控制 | `現在時間為 "{datetime}"` |
| Action 呼叫 | `(No Actor\|UID="$var") {summary}, call table:` |
| 成功回應 | `{summary}(STATUS)回應, with table:` |
| 成功回應 JSON | `{summary}(STATUS)回應為, with JSON:` |
| 操作失敗 | `操作失敗` |
| Entity 驗證 | `應該存在一個{entity}, with table:` |
| Entity 不存在 | `應該不存在一個{entity}, with table:` |

VAR 系統：`>ContextName.field`（宣告）/ `$ContextName.field`（引用）/ `<executionKey`（捕獲）/ `$notnull`（非空驗證）

Feature 註解：`# Action: actionName` + `# [METHOD] /path` + `# Summary: xxx`

驗證錯誤代碼：E001 缺 Action 註解、E002 缺 Summary、E003 缺 Feature、E004 Summary 不一致、E005 Rule 缺標註、E006 When 格式錯、E008 沒 Example

## 防雷清單（不看必踩）

> **自動化覆蓋標記**：`[CI]` = pre-commit/CI 守衛、`[TEST]` = 單元測試覆蓋、`[ARCH]` = 無法自動化的架構約束。未標記 = 尚未轉化。

### 流程編排與 phase 狀態

- **新增 phase 必須五處同步**：`handleContinueFlow` 路由（含超時偵測）+ `FlowState` 型別 + `flowstate-recovery.ts` RECOVERABLE_PHASES + 前端 `richContent.type` union + `graph/nodes/phase-router.ts`（LangGraph 啟用時）
- **生成中 phase 孤兒偵測三層**：(1) conv-lock 不存在+60s→恢復 (2) lock 存在但 startedAt>5min+無心跳→過期恢復 (3) 20min 超時。新增生成中 phase 必須考慮三層
- **handleProcessMessage→handleContinueFlow 必須帶 `skipPrefilterAndCredit: true`**：否則 prefilter + credit deduction 執行兩次（雙重扣款）。只有 BullMQ `continue-flow` job 直接呼叫時才不帶
- **Skill 函數提前 return 必須保存 FlowState**：否則 `handleContinueFlow` 找不到 state → 用戶對話永久卡死
- **Formulation phase**：必須設 `formulationStartedAt`（超時恢復依賴）。checkpoint 每 3 feature 保存，成功後清理 `formulation*` 暫存欄位
- `[ARCH]` **deployer_complete 路由順序**：部署 → 回滾 → 域名 → 問候攔截 → semanticGateway → 迭代修改
- **complete/failed 問候攔截**：三處 `semanticGateway` 前插入 `isGreetingOrChitchat()` 零 LLM 攔截。`__new_project__` 在 `handleContinueFlow` 入口處理

### 輸入過濾與意圖判斷

- `[TEST]` **迭代輸入四層防禦**：prefilter → detectFastModeIntent（`platform_issue` 回操作指引）→ semanticGateway iteration → refineCode [NO_CHANGE]。**ITER_DESIGN_SIGNALS 必須含錯誤修復詞**（'修復'/'error'/'bug'），否則貼錯誤訊息被 quickFilter 拒絕
- **`checkBuildRelevance` fail-closed**：API 錯誤/空回應/catch 全拒絕；無 API key 時 fail-open
- **輸入品質閘門**：`checkInputQuality()` 全域攔截 + `getPhaseStrictness()` phase-aware 二次攔截。Redis anti-loop 連續 3 次強制放行防卡死

### LLM 與模型 ID

- `[CI]` **Anthropic 模型 ID**：一律用 `claude-sonnet-4-6`（不加日期後綴），`claude-sonnet-4-6-20250514` 不存在會 404。全 codebase 用 `semantic-gateway.ts` 常數而非手打
- **Anthropic SDK v0.72+**：大 `max_tokens` 必須用 `messages.stream()` + `await stream.finalMessage()`
- `[ARCH]` **Prompt Caching**：`buildCacheableSystem()` 拆 system prompt 為 static+dynamic block。修改 system prompt 時不要把 per-request 內容放進 static block，否則 cache hit 率歸零
- `[ARCH]` **Structured Outputs**：JSON 輸出用 `callStructured<T>()` + Zod schema。只適用 JSON；代碼/Gherkin/YAML/自然語言不能用。`messages.parse()` 與 prefilling **不相容**。改 schema 會使 cache 失效。Zod v4 `z.record()` 必須傳兩個參數
- **Extended Thinking（修復路徑）**：`ENABLE_EXTENDED_THINKING=false` 預設關 + `EXTENDED_THINKING_BUDGET=10000`。只用在 `fixFailingAction()` 和 `fixMultipleFeatures()`。response 解析用 `.find(b => b.type === 'text')` 跳過 thinking blocks
- **`ENABLE_DIFF_OUTPUT`**：Animation/RWD/Merged 用 SEARCH/REPLACE block（省 60-70% output token）。解析失敗 fallback full-file。SEARCH 多處匹配拒絕替換。不影響 `generateStructure`（從零生成）
- **`streamLlmMessage` vs `sendMessage`**：LLM 對話文字用 `streamLlmMessage`（streaming），模板/進度/richContent 用 `sendMessage`

### 自我強化迴圈（Skill Telemetry）

- `[CI]` **Skill Telemetry 必須 fire-and-forget**：`recordTelemetry`/`recordTelemetryBatch` 一定要接 `.catch(() => {})`。DB 寫入失敗不能中斷 pipeline
- **禁止自動回灌 prompt**：週報產出後人工決定，手改 service system prompt，避免炸掉 cache 命中率
- **閉環規範（兩層檢查）**：每次改 prompt 或加 code rule 後必須執行 `register-prompt-change.ts` 註冊。(1) pre-commit hook 偵測 `SANITIZE_PATTERN_MAP` 新 entry → WARN 印註冊指令（不阻擋）(2) 週報頂部 `findUnregisteredSanitizePatterns()` 列出未註冊 pattern。Direction A 優先：能寫 regex/code rule 的不回灌 prompt
- `[TEST]` **Harness 修復提示注入（`error-enrichment.ts`）**：三處修復路徑共用 `enrichError(error, rootCause)` 注入 `harnessHint`。`var_resolution`/`auth_check`/`spec_inconsistency` 三類 `skipLlmFix=true`。新增 `FailureRootCause` 必須同步加 `ROOT_CAUSE_HINTS` 條目

### UIUX 生成與品質閘門

- `[ARCH]` **UI Evaluator 黑盒 QA**：Evaluator 只看 screenshot + DOM outline，**絕不能看到 .tsx 代碼**。rubric `services/ui-evaluator-rubric/base.md` 修改必保留「禁止提到 class 名稱」核心約束。`ENABLE_UI_EVALUATOR` 預設 false，staging 先開。Evaluator 失敗必須降級（`passed: true`）不阻塞。**page.evaluate 必須用 string callback**（tsconfig `lib: ["ES2022"]` 不含 DOM types）
- `[ARCH]` **設計品質四維度（consistency/accessibility/taskExecution/codeQuality）**：CSS 一致性審計統計 design tokens per-file/global，rule prefix `consistency-*` 不擴 QualityCategory；WCAG luminance 用 `wcag-contrast` + Tailwind 色板表算 ratio，per-file cap 3 個 ratio issue 避免 prompt 爆量；首版**不做 parent inherited bg 追溯**只看 sibling pair；overallScore 加權平均 accessibility 35%；feature flag `ENABLE_DESIGN_QUALITY_REPORT` 預設 false advisory only。**禁止用報告自動回灌 prompt**，只能餵 refineCode
- `[TEST]` **可讀性檢查**：英文走 Flesch-Kincaid Grade Level（FKGL ≥ 14 critical / 11-14 warning，< 50 字符 skip）；中文走規則式（Hero >30 字 / CTA >12 字 warning）。**text-readability 用 ES default export**：必須 `require('text-readability').default`，否則 method 全 undefined。fail-soft
- `[TEST]` **axe-core 整合**：在 desktop-light viewport 跑，`runOnly: wcag2a/wcag2aa/wcag21aa`（不跑 best-practice 避免誤殺）。axe `critical/serious` → severity `critical`，其他 → `warning`；category 統一 `'visual_regression'`（保持 enum 純淨），description 加 `[a11y/<rule-id>]` 前綴。`ENABLE_AXE_CORE` 預設 true，fail-soft
- `[TEST]` **DesignSystem 整條 pipeline 統一消費**：(A) variant 選定後 `design-system-freeze.ts` 算 hash + audit log。(B) `refineCode`/`generateAnimations`/`generateRwd`/`generateAnimationsAndRwd` 全用 `buildDesignSystemPrompt` 完整版（避免跨階段不一致），dynamic block 內，cache 不失效。vendored 命中時 `tryVendoredFastPath` 跳過 Brief+Variant，`__force_variants__` 退回。(C) `iteration-intent.ts` 加 `tier` + telemetry。(D) `runQualityGate` 整合 `design-token-compliance.ts`，hard critical 阻塞部署 + `state.uiuxDesignTokenOverride=true` 強制覆寫降級為 warning（用戶逃生口）。(E) `migrations/036` 加 `generations.design_system_snapshot/hash`
- `[ARCH]` **DesignSystem 保守 flag**：(1) `VENDORED_FAST_PATH=false`：vendored 命中仍走 5 變體（避免 lossy 轉型）(2) `DESIGN_TOKEN_SEVERITY=warning`：先收 telemetry，違反率 < 10% 後手動切 'critical' (3) iteration hint 移除「修改 cssVariables/tailwind.config」改為「跨頁面 className 替換 + globals.css 變數同步」
- `[TEST]` **Phase H — 部署時產出 DESIGN.md 交付文件（`ENABLE_DESIGN_MD_EXPORT`，預設 true）**：每次 `generatedCodeToFileRows`（orchestrator-utils.ts L427）寫 `tailwind.config.ts` 之後，順手把 `state.uiuxDesignSystem` 透過 `services/design-system-renderer.ts:renderTellcraftDesignSystemAsMarkdown` 渲染成 awesome-design-md 風格 markdown，寫進 project_files 的 root `DESIGN.md`（fileType='doc'）。用戶下載 zip / git clone / Vercel file tree 都看得見。**為什麼用 awesome-design-md 標準格式**：跨工具可攜（Claude Desktop / Cursor / Figma MCP / 其他 AI agent 都能讀）。**整合點是 generatedCodeToFileRows 中央寫入點**，全 8 處 `db.upsertProjectFiles(_, 'uiux', ...)` 一次同步生效。fail-soft：render 異常 skip 不阻塞 deploy。env false 時純跳過，不影響既有檔案
- `[TEST]` **Phase G — 迭代後 DesignSystem 同步（`SYNC_DESIGN_SYSTEM_AFTER_ITERATION`，預設 true）**：用戶 tier='design-system-token'/'mixed' 迭代「主色改紅」後，refineCode 改了代碼但 `state.uiuxDesignSystem` 物件不會自動同步 → design-token-compliance 用舊色族驗證新代碼會誤觸發 + DS snapshot 寫過期狀態。`services/design-system-sync.ts` 雙軌修補：(B) Sonnet `callStructured<DesignSystemPatchSchema>` 讓 LLM 從改後代碼反推 patch，merge 進 state；(A) `extractColorTokens`（design-token-compliance.ts export）+ `resolveColor` 掃實際代碼色號，LLM 漏報時用代碼覆寫（telemetry `phase_g_patch_drift`）。整合在 `iteration-skill.ts` 兩個分支（frontend L640 / fullstack L520）的 sanitize 後 / snapshot 前。**雙重 flag gate**：master `USE_FROZEN_DESIGN_SYSTEM_PIPELINE` + 細節 `SYNC_DESIGN_SYSTEM_AFTER_ITERATION`，後者讓你能單獨關閉 Phase G LLM 呼叫但保留其他 A-F 行為。**fail-soft**：sync 失敗（LLM error / parse fail）保留舊 DS 不阻塞。`DesignSystemSource` enum 加 `'iteration_modified'`。每次迭代多 ~0.6-1.1K tokens + 200-400ms（cache 命中後降 30%）
- `[ARCH]` **Phase A-E master kill switch（`USE_FROZEN_DESIGN_SYSTEM_PIPELINE`，預設 true）**：整體緊急 rollback 開關。設 `false` 時 9 個 gate 點全回 baseline 行為：(1) `pickDesignSystemPrompt()` 回 `buildCompactDesignPrompt`（refineCode + generateAnimations + generateRwd + generateAnimationsAndRwd 4 處共用 helper） (2) `freezeDesignSystem` hook 不算 hash / 不寫 `state.uiuxDesignSystemHash/Source`（uiux-phases.ts:1325） (3) `snapshotCodeToGeneration` 三處呼叫不傳 `designSystem/Hash` 欄位（iteration-skill.ts 三處 spread + condition） (4) iteration tier hint 不注入 enrichedFeedback（iteration-skill.ts:382，**telemetry 仍寫**供觀察）。**用法**：production 出問題（refineCode 卡頓 / cache 暴跌 / freeze throw）一行設 `USE_FROZEN_DESIGN_SYSTEM_PIPELINE=false` + pm2 reload，60 秒內回到 baseline，不需 git revert + redeploy（10-15 分鐘）。**注意 vendored fast path 跳變體流程不受此 flag 影響**（由 `VENDORED_FAST_PATH` 獨立控制）；migration 036 是 schema 改動 backward-compatible，不需要 flag gate
- `[TEST]` **awesome-design-md 短路**：`tellcraft-backend/external/awesome-design-md/` 是 git submodule（71 brand DESIGN.md），啟動時 eager 載入 + parse cache。`analyzeReference` 入口先試 `lookupBrandByDomain` + `inferBrandFromText` 命中返回 `analysisSource: 'vendored_designmd'`，跳過 puppeteer + Vision（省 5-8s + 10K tokens）。**新增品牌必改三處**：(1) git submodule 拉新 + `pnpm build` copy 進 dist (2) `brand-domain-map.ts` `DOMAIN_TO_BRAND` 加 entry (3) `TEXT_ALIAS_TO_BRAND` 加 entry（多 alias 命中時 return null 防誤觸發）。**部署 checklist**：VPS 上 `git pull --recurse-submodules` + `git submodule update --init`。Vercel 不需要（`.vercelignore` 排除）。Submodule 沒拉到時 fail-soft 降級回 puppeteer
- `[ARCH]` **Mood/tier/techniques/patterns 互補**：mood=視覺方向，tier=技術限制，techniques=element-level，patterns=section-level。Mood 優先級：`variantConcept` > `mood` > `tier`。patterns 不含動畫
- `[ARCH]` **參考網站分析**：puppeteer-core 需系統 Chromium（VPS `apt install chromium-browser`）。SSRF 防護禁 localhost/內網 IP。DOM 提取失敗不影響截圖（獨立 try-catch）。四個注入點統一用 `formatStructuredDataForPrompt()`
- **上傳圖片參考**：`analyzeUploadedImage` 只存文字結果不存 Buffer。`completeDesignClarify` 並行分析圖片+URL 合併。imageUrls 管道：`handleProcessMessage` → `handleContinueFlow` → `routePhase` → handler
- `[TEST]` **Coder Handler 按需注入**：13 個 handler SOP 在 `services/coder-handlers/*.md`，透過 `lib/skill-loader.ts` 載入。內容必須以 `\n` 開頭（匹配舊 const 模板字面量首字元），修改後跑 `__tests__/skill-loader.test.ts` byte-identity 測試。`pnpm build` postbuild copy `.md` 到 `dist/`，skill-loader 有 src/ fallback

### 預覽與部署

- `[TEST]` **部署五層防禦**：L1 generateStructure 後驗證引用 → L2 sanitize stub 生成 + `??` 與 `||/&&` 加括號 + root layout html/body 補全 + 非 variable font 移除 axes → L3 fixBuildErrors API 重試 → L4 build 循環 3+1 次 → L5 useSearchParams Suspense 拆分
- `[TEST]` **預覽零錯誤三層防禦**：(1) **Preview Gate**：寫 Redis 前 esbuild 驗證，壞代碼不推送，emit `preview_stale` (2) **Last Known Good (LKG)**（migration 034 加 `validation_status`/`last_validated_at`/`last_validated_content`）：passed 同步寫 LKG，failed 保留舊 LKG 永不被覆蓋；前端 polling `isGenerating && !streamingPreview` 時拿 LKG + overlay (3) **Health Beacon** Edit Bridge 每 2s postMessage `tc_health`，5s 沒收到觸發 `iframe_frozen` overlay。三層互補可達 ~99.99%
- **`generateStructure` 的 `onCheckpoint` callback**：multi-pass 批次完成、syntax fix 後、reference repair 後三處觸發。呼叫端必須傳入 checkpoint callback 將中途代碼存入 FlowState，防進程崩潰遺失
- **`handleCodePhaseRedo` 需要快照**：`uiuxStructureCode`/`uiuxAnimationCode`，否則 redo 在已修改代碼上重做
- **`verifyBuildLocally` 的修復結果必須同步回 DB**：否則預覽和部署代碼分岔
- **WebContainer**：preload 後禁止 `mount()`（清除 node_modules），用 `writeFilesToContainer()` 逐檔寫入；`restart()` 例外。生成期間 early return `AIGenerationWaitingScene`，只有 fast build streaming 即時渲染。`handleUiuxCodeGenerating` 用 `stage: 'uiux_pipeline_progress'`（非 `'info'`）。增量寫入統一經 `deduplicateRouteConflicts` + `stripRouteGroups` + `sanitizeFileContent` + `injectEditBridge`

### 樣式與依賴限制

- **動畫庫是 `framer-motion`**（v12+），import `from 'framer-motion'`
- `[CI]` **字體只能用 `next/font`**，禁止 `<link>` / `@import` Google Fonts
- `[TEST]` **next/font `axes` 只能用於 variable font**：LLM 容易把 `axes: [...]` 加到 Playfair Display / Lora / Merriweather / Instrument Serif 等非 variable font → build 報錯。`sanitizeCodeForDeploy` Fix 4.5 黑名單 regex 移除。新增誤傷字體從 `NON_VARIABLE_FONTS` 移除；新受害字體加入
- `[CI]` **Tailwind v4**：用 `@import "tailwindcss"`，不是 v3 的 `@tailwind`
- `[TEST]` **Tailwind config 禁止 CSS 變數引用**：`generateTailwindConfig()` 必須用硬編碼值（`'9999px'` 非 `'var(--radius-full)'`），否則部署後 CSS 變數遺失樣式失效
- **Layout 禁止 opacity:0**：SplitLayout/split-layout 外層不能用 `initial={{ opacity: 0 }}`（多層疊加→黑屏）。useEffect 依賴不含 `fastBuildChunks`。split→default 回退需檢查 code_preview 歷史
- **`app/components/templates/` 已廢棄**，PreviewPanel 用 WebContainers 渲染

### Coder / SpecFormula / RED Phase

- **Feature Alignment Gate**：RED Phase 後、Coder 前執行。修不好**阻塞 pipeline**（回退 `uiux_complete`），不像 RED Phase advisory 模式。修復後自動更新 DB `bdd_sessions.features_content`
- `[TEST]` **Alignment Gate Check 12（L31.A）notnull_field_missing_from_setup**：Then 表用 `$notnull` 期望某欄位 X，但該 Feature entity_setup DataTable 從未提供 X 值 → DB column 預設 null → response 也是 null → `response_validate` 永遠失敗 → **LLM 修 code 修不好**（這是 spec 資料矛盾，不是 code bug）。真實案例：`List Service Items.imageUrl` 期望 `$notnull` 但 entity_setup ServiceItem 只給 `[title, description, isActive]`，跑 104 attempts 都失敗。系統自動欄位（id/createdAt/updatedAt 等）白名單跳過。case-insensitive + camelCase ↔ snake_case 對齊
- `[TEST]` **Alignment Gate Check 13/14/15/16（L31.A-C）對齊變種**：(13) `then_concrete_value_missing_from_setup` 具體字面值期望但缺 entity_setup → error；(14) `scenario_scope_setup_mismatch` 每 scenario 獨立檢查（Background+自身 Given），預設 warning，env `STRICT_SCENARIO_SCOPE_ALIGNMENT=true` 升 error；(15) `null_expectation_setup_conflict` Then 期望 `$null` 但 entity_setup 給非空字面值 → error；(16) `entity_validation_field_missing_from_setup` 應該存在一個 X 期望欄位缺對應 entity_setup → error。Check 12/13/15 共用 helper `extractThenExpectations()`
- `[TEST]` **Alignment Gate Bug 5 (L31.D) per-check repairDirection + post-fix 方向審計**：`CHECK_REPAIR_DIRECTION` map 為 5 個對齊類 check 注入「強制方向 + 禁止移除驗證」hint 到 LLM prompt（`autoFixFeatures` 內），防止 LLM 偷懶選擇「移除 Then `$notnull`」而非「補 entity_setup 欄位」。Post-fix 審計比對前後 `extractThenExpectations` 的「強驗證」（notnull/literal/null）總數，若降幅 > 30% → 判定 LLM 改錯方向，回退這次修復用 `bestFeatures` 並 telemetry `llm_fix_wrong_direction`
- `[ARCH]` **Bug 6/7 (L31.E) BDD prompt self-consistency + nullable hint**：`formulation.ts` static block 加「Then-EntitySetup 一致性」rule（≤200 chars，第一次 cache miss 後續穩定）。dynamic block 注入 `extractNullableColumnsHint(schemaSql, entityMapping)` 列出每個 entity 的 nullable_no_default + nullable_with_default 欄位，token cost ~+1-2K/req。**必須**跑 `pnpm tsx src/scripts/register-prompt-change.ts --pattern formulation_then_setup_consistency --skill formulation --action prompt_fewshot --target services/formulation.ts` 與 `--pattern formulation_nullable_hint`
- `[TEST]` **Alignment Gate Cost Guardrail (L31.I)**：`MAX_LLM_CALLS_PER_GATE=20` / `MAX_COST_USD_PER_GATE=$3` 雙重上限。`fixMultipleFeatures` 回傳 `usage: FixUsage` → `autoFixFeatures` 透傳 → `runFeatureAlignmentGate` 每輪累計，超過任一就 break + 回退 `bestFeatures` + telemetry `cost_guardrail_breach`。原因：`MAX_FIX_ROUNDS=2` 但每 round 內 features/schema/entity_mapping 各跑一次 = 6 次大批修復，加上 extended thinking 容易累積到 $10+ 單次對話（c9cefcc6 案例 81 calls / $8.62）。env override：`ALIGNMENT_GATE_MAX_LLM_CALLS` / `ALIGNMENT_GATE_MAX_COST_USD`。helper `checkAlignmentCostBreach()` 純函數可單獨測試
- `[TEST]` **Phase 3a Spec-First Repair (L31.J)**：Coder 失敗時根據 `classifyFailureRootCause` 分流 — `BDD_SIDE_ROOT_CAUSES` (`var_resolution`/`spec_inconsistency`/`api_summary_mismatch`/`step_parsing`/`fk_constraint`) 走新 `fixFailingSpec(featureName, content, failedScenarios, schema, rootCause, ...)` 修 BDD spec（不修 code），其他 rootCause 走既有 `fixFailingAction` 修 code。`runRedGreenCycle` 兩處 fix loop（Phase 1 per-feature + Phase 2 regression）都加分流。修過的 BDD 透過 `result.fixedBddFeatures: Map<featureName, content>` 透傳給 caller（`coder-phases.ts` + `coder-subgraph.ts`）persist 到 `bdd_sessions.features_content`。kill switch：`PHASE_3A_SPEC_FIRST_REPAIR=false` 退回舊行為（永遠 fixFailingAction）。telemetry events：`spec_first_repair_attempt` / `spec_first_repair_success`
- `[TEST]` **Phase 3b Pre-Coder Spec Validation (L31.K)**：在 Coder generate 之前，用 RED Phase Stub（`runRedPhaseFullValidation` + `StubHttpAdapter(501)`）跑真實 SpecFormula，failed unexpected failures 自動呼叫 `fixFailingSpec` 修 BDD（重用 Phase 3a），最多 2 輪修復。新檔 `services/pre-coder-spec-validation.ts:runPreCoderSpecValidation()` wrap 既有 RED Phase + 自動修。`mapRedPhaseFailureToRootCause()` 把 RedPhaseFailureType (`entity_setup`/`api_spec_mismatch`/`routing_mismatch`/`var_resolution`/`step_parsing`) 對應到 FailureRootCause。BullMQ + LangGraph 兩條路徑**取代既有 RED Phase advisory**（保留向下兼容 — env 設 false 退回 advisory）。修過的 BDD 每輪 persist 到 `bdd_sessions.features_content`。kill switch：`PHASE_3B_PRE_CODER_VALIDATION=false`。**跟 alignment gate heuristic 的差異**：alignment gate 是 regex 後驗，Phase 3b 是 ground truth（真執行 entity_setup INSERT）— 抓得到 alignment gate 漏的真矛盾。telemetry：`spec_first_repair_success` (pre_coder_passed_after_fix) / `red_validation_fail` (pre_coder_blocked)
- `[TEST]` **LangGraph 路徑 `coderTestAttempts` 必須 round=0 重置（不累加）**：`coder-subgraph.ts:559` 內 `flowState.coderTestAttempts = round === 0 ? result.attempts : (...) + result.attempts`。**錯誤地累加會跨 LangGraph fresh invoke 累積**（user 按 retry 開新 invoke 時看到「104 輪」實際是「歷史總和」）。`coderTestRegressionRounds` 同理。新加 `coderTestFeatureCount` 給 finalizeNode 拆解「Feature 首測 + LLM 修復 + 回歸」用
- **RED Phase 三層驗證**：L1 靜態（12 項零 LLM，含 Schema DataTable 對齊、**Check 12** 偵測 WHEN call table headers 誤用 `>/<` 前綴）、L2 Stub 全場景（StubHttp 回 501）、L2.5 Routing（in-process Express）。L2/L2.5 需 `open_api_spec_content` + `isa_config_content` + `neon_connection_string`，缺則跳過。三層都不阻塞
- **Feature 驗證腳本用 `tsx` 不是 `ts-node`**：`feature-validation.ts` `runScript()` 用 `npx tsx`。腳本解析失敗視為通過（不觸發無效 LLM 修復循環）
- **Feature Dry-Run**：spec_completed 前用真實 Neon DB 跑 entity_setup 驗證。失敗 LLM 修復（2 輪）。跳過 api_call/response_validate
- `[TEST]` **SpecFormula JSONB 比較**：`valuesEqual()` 支援 JSON 深度比較。`resolveValue()` 支援 `<executionKey`
- **Stage B 回歸修復**：Phase 2 最多 2 輪，scenario-level 智能跳過（集合不變則停），crash 不重試
- **`_stepSummary` dispatch 用 `===`**：非 `op.includes()`，消除子字串碰撞
- **Slot extraction 重試**：失敗後注入錯誤訊息做第二次嘗試，減少 fallback
- `[TEST]` **Schema-aware `deleted_at`**：`softDeleteColumn` `.optional()`，Schema 沒此欄位不生成 `AND deleted_at IS NULL`
- `[TEST]` **錯誤根因分類器**：`classifyFailureRootCause()` 零 LLM 8 類。`var_resolution` 跳過代碼修復；`auth_check` 直接 `removeAuthChecks()`
- **雙層完成驗證**：`coderTestPassed` 區分 quickReplies（全通過→部署，有失敗→重試+帶風險部署）。`__deploy_with_risk__` 需二次確認，`deployedWithFailingTests=true` 寫入 FlowState
- **Coder action response field 必須對齊 BDD execution key**：`generateActionFunction` 注入 `<executionKey` + stepSummary + 完整 Feature。不對齊 → VAR-System 連鎖失敗
- **Per-SubOp 生成**：按 When 步驟拆子操作，已知 pattern 走 template（7 個），未知走 free-form。**`INLINE_SNAKE_TO_CAMEL`（`_c`）必須內嵌模板**，獨立 function 會被 helper 提取器拔出 → runtime undefined。`CODER_PER_SUBOP=false` 一鍵關閉
- **Code Template Zod schema 必須寬鬆**：`scopeColumn`/`scopeParam` `.optional()`，`entityIdParam` `.default('id')`。否則 LLM 回 null → Zod 拒絕 → template 全掛
- `[TEST]` **ScenarioContext VAR 數字後綴**：`get("listId")` 需匹配 `"List1.id"`，fallback 去除末尾數字再 camelCase。否則 `$listId` 不解析 → uuid 錯誤
- **preExtractTestPasswords 引號剝除**：testPasswordMap 的 key 必須剝除引號才能匹配 entity_setup `resolveVariable` 結果
- **Coder E2E 必須含 backendFiles**：`runCoderE2ETests` 的 code 須含 `result.backendFiles`，否則 Module not found → 500
- **`rewriteComponentForServerActions` maxTokens 32768**：截斷偵測 JSX 平衡，不平衡回退原始組件
- **`identifyMockDataComponents`**：Haiku batch 識別需改寫組件，失敗降級 regex fallback

### 資料庫與基礎設施

- **DB 連線池**：`max: 20` + `keepAlive: true`，防 PostgreSQL 斷開空閒。`DB_POOL_MAX` 可覆蓋
- **Neon provisioning 同步（< 10s）**：失敗不阻塞。Deployer 直接 SELECT `neon_connection_string` 注入 DATABASE_URL
- `[ARCH]` **Neon schema 變更必須保留客戶資料（L21.CRIT-1）**：`provisionNeonDatabase` 預設 `allowDestructiveReprovision=false` — 偵測舊 project 含非空 user table 時**拒絕** drop，回 null + 警告。Coder 生成的客戶 app 用 Neon DB 存**客戶真實資料**，改 schema 絕不能靜默刪除。覆寫需明確傳 `allowDestructiveReprovision: true`。`hasNonEmptyUserTables` 用 `SELECT EXISTS` 逐表掃，fail-open
- `[ARCH]` **文檔與實作同步**：改後端流程 → 同步更新 `uiux-skill/instructions/` + 此文件

## 核心原則

1. **無腦補原則**：嚴格遵守規格，不擅自假設
2. **summary 一致**：Action summary 必須與 Feature 名稱一致
3. **自我修復**：驗證失敗時進入修正迴圈（最多 3 次）
4. **Tellcraft 平台不直連資料庫**：平台自身前端透過 VPS API；Coder 生成的客戶 app 用 Server Actions + Neon 直連，禁止 `accept-data-loss`

## 環境變數

前端（`.env.local`）：`VPS_API_URL`, `NEXT_PUBLIC_VPS_API_URL`, `NEXT_PUBLIC_VPS_WS_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_LIFF_ID`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`

後端（`tellcraft-backend/.env`）：定義在 `lib/env.ts` Zod schema，三層（REQUIRED/OPTIONAL/功能開關）。關鍵：`NEON_API_KEY`、`NEON_DEFAULT_REGION`（預設 `aws-ap-southeast-1`，注意 `aws-ap-northeast-1` 已從 Neon 移除）。開關：`ENABLE_PROMPT_CACHING`（預設 true）、`FAST_BUILD_MERGED_ANIM_RWD`（預設 true）、`ENABLE_DIFF_OUTPUT`（預設 false）、`USE_LANGGRAPH`（預設 false）、`ENABLE_UI_EVALUATOR` / `ENABLE_AXE_CORE` / `ENABLE_READABILITY_CHECK` / `ENABLE_DESIGN_QUALITY_REPORT` / `VENDORED_FAST_PATH` / `DESIGN_TOKEN_SEVERITY`（預設 `warning`）。
