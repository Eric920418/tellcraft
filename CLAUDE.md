# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

Tellcraft 是 **AI 驅動的自動化開發平台**：用戶描述需求 → AI 釐清 → 確認規格 → 自動生成 → 一鍵部署。

## 常用指令

```bash
# 前端（Next.js on Vercel）
pnpm install / dev / lint / typecheck / test / test:ci

# VPS 後端（tellcraft-backend/）
cd tellcraft-backend && pnpm install && pnpm dev   # http://localhost:3100
pnpm build / typecheck / test / test:ci

# BDD 規格驗證（改 Feature Files 後必跑，--json/--strict/--fix 可選）
npx ts-node bdd-spec/scripts/lint-gherkin-format.ts spec/features/
npx ts-node bdd-spec/scripts/validate-feature.ts spec/features/

# Telemetry 報告 / Prompt Change 註冊（治理用）
cd tellcraft-backend && pnpm tsx src/scripts/telemetry-weekly-report.ts [--days=N --json]
cd tellcraft-backend && pnpm tsx src/scripts/telemetry-phase3-report.ts  [--days=N --json]
cd tellcraft-backend && pnpm tsx src/scripts/register-prompt-change.ts --pattern <k> --skill <n> --action <prompt_fewshot|sanitize_rule|qg_rule> --target <file>

# VPS 部署 + 除錯
git pull && pnpm build && pm2 startOrReload ecosystem.config.js --wait-ready
pm2 logs tellcraft-api / tellcraft-worker --lines 100
# 日誌：/var/log/tellcraft/{out,error}.log
```

## 系統架構

### 雙端架構

```
Vercel (Next.js 16, sin1, maxDuration 60)
  └── HTTP/WS ──→ VPS: Express :3100 + BullMQ Worker + LangGraph + Socket.io + PostgreSQL + Redis
```

- **Tellcraft 平台自身**：前端不直連 DB，走 `Server Actions → app/lib/vps-api.ts → VPS API → PostgreSQL`
- **Coder 生成的客戶 app**：合法 Server Actions + Neon 直連（不受平台限制）
- **為什麼 VPS**：Serverless 超時無法跑長時 LLM 任務
- 前端路徑別名 `@/*`、後端無；TS 完全隔離；前端 package.json name 是 `ai-genesis`（歷史遺留）

### 後端核心模組（`tellcraft-backend/src/`）

| 模組 | 路徑 | 職責 |
|------|------|------|
| Orchestrator | `workers/orchestrator.ts` | BullMQ Worker + handleProcessMessage + handleContinueFlow |
| Phase Router | `workers/phase-router.ts` | Phase 路由 + deployer 子路由 |
| Intent Helpers | `workers/intent-helpers.ts` | 意圖判斷 + PHASE_BACKTRACK_MAP |
| Phase Handlers | `workers/phase-handlers/*.ts` | bdd / uiux / deploy / fast-build / clone / coder / domain |
| Orchestrator Utils | `workers/orchestrator-utils.ts` | sendMessage / streamLlmMessage / saveFlowState |
| FlowState | `types/flow-state.ts` | 型別 + 子型別（避免循環 import） |
| UIUX Generation | `services/uiux-generation.ts` | Brief / Variants / Structure / Animation / RWD / Refine |
| Quality Gate | `services/quality-gate.ts` | 5 類靜態 + Tier 合規 + Rule-based + Haiku fallback |
| 設計品質報告 | `services/design-quality-report.ts` + `css-consistency-audit.ts` + `ui-evaluator.ts` + `design-token-compliance.ts` | 4 維度評分 + DS 合規 + 黑盒 QA |
| Coder | `services/coder-generation.ts` + `coder-handlers/*.md` | parseActionsYml → action → server action → 改寫組件 |
| Feature Alignment Gate | `services/feature-alignment-gate.ts` | 阻斷式對齊檢查（16 項）+ LLM 修復 |
| Pre-Coder Spec Validation | `services/pre-coder-spec-validation.ts` | RED Phase Stub + 自動修 BDD |
| RED Phase Validator | `services/red-phase-validator.ts` | L1 靜態 + L2 StubHttp + L2.5 Routing |
| Feature Validation | `services/feature-validation.ts` + `feature-dry-run.ts` | Then-DB validate + 真實 DB dry-run |
| Deployer | `services/deployer.ts` | sanitize → build 驗證 → Vercel + 回滾 |
| Iteration Skill | `services/iteration-skill.ts` | 迭代 + 撤銷 + 版本回滾 |
| Fast Build | `services/fast-build-generation.ts` | tier 偵測 + 默認 DS + 增量生成 |
| Design Pipeline | `design-techniques.ts` / `composition-patterns.ts` / `design-moods.ts` / `design-system-freeze.ts` / `design-system-renderer.ts` / `design-system-sync.ts` | 30 技法 + 20 patterns + 8 mood + freeze/render/sync |
| Reference Analyzer | `services/reference-analyzer.ts` + `design-md-{loader,parser}.ts` + `brand-domain-map.ts` | URL 截圖+DOM/Vision，5 層降級（vendored designmd 71 brand 短路）|
| Template Matcher | `services/template-matcher.ts` | 三層評分（關鍵詞 40 + Category 30 + UISpec 30，零 LLM） |
| Web Clone | `services/web-clone-service.ts` | DOM/CSS 提取、section 切割、Sonnet Vision |
| Semantic Gateway | `services/semantic-gateway.ts` | quickFilter 短路 + Sonnet 六元 verdict |
| Customer Service | `services/customer-service.ts` | FAQ + Sonnet 回答 |
| Prefilter | `services/prefilter.ts` | 全域預過濾 + phase-aware + Redis anti-loop |
| Domain | `services/domain-service.ts` | Porkbun + Cloudflare DNS + Vercel 綁定 + RDAP |
| Neon | `services/neon-service.ts` + `schema-derivation.ts` | 同步建 DB <10s + DDL 衍生（零 LLM） |
| FlowState Recovery | `services/flowstate-recovery.ts` | 每 2 分鐘掃逾時 phase 自動恢復 |
| Conversation Lock | `services/conversation-lock.ts` | Redis SET NX EX（TTL 5min） |
| Skill Telemetry | `services/skill-telemetry.ts` + 週報 | 4 成功 + 10 failure 埋點，**禁止自動回灌** |
| Error Enrichment | `services/error-enrichment.ts` | rootCause → harnessHint 注入 LLM prompt |
| Preview Gate | `services/preview-gate.ts` | 寫 Redis 前 esbuild 驗證 |
| SpecFormula | `lib/specformula/` | SDD 驗證引擎：Feature → HTTP → DB |
| Lib | `lib/{env,anthropic,structured-output,conversation-budget,cache,skill-loader}.ts` | Zod env + Client 單例 + callStructured + budget cap + cache |
| LINE/Telegram | `services/{line,telegram}-*.ts` | Bot Webhook + 推播 |

### 前端核心檔案（`app/`）

| 模組 | 路徑 | 行數 | 職責 |
|------|------|------|------|
| 主頁面 | `[locale]/page.tsx` | ~360 | Hero + Chat + Landing + Auth |
| 對話容器 | `components/chat/ChatSection.tsx` | ~994 | 5 hooks + handleSend |
| 消息列表 | `components/chat/ChatMessageList.tsx` | ~771 | 渲染 + 輸入 + richContent 分派 |
| 預覽面板 | `components/chat/ChatPreviewPanel.tsx` | ~651 | BDD/FastBuild/CodePreview/Template |
| 共用型別 | `types/chat.ts` | ~67 | Message/SessionInfo/COMMAND_KEYS |
| Chat Hooks | `hooks/useChat*.ts` + `useLoginPrompt.ts` | ~1063 | 滾動/編輯器/輪詢/會話/登入 |
| LLM 工具 | `lib/llm.ts` | ~2200 | LLM 呼叫封裝 |
| VPS API Client | `lib/vps-api.ts` | ~1900 | HTTP client |
| Server Actions | `actions/index.ts` | ~1800 | 對話/訊息/專案入口 |
| WebContainer | `lib/webcontainer-utils.ts` + `WebContainerPreview.tsx` | | Next.js dev server in browser, preload |
| Remotion | `components/remotion/` + `building-scene/` | | Fast Build 工廠 + BDD 蓋房子 3D |
| Landing | `components/landing/` | ~1978 | 16 個自包含組件 |

### LangGraph 編排（Feature Flag `USE_LANGGRAPH`，**code 預設 false / prod env 真實值 true** — bb0d1081 事件確認）

`graph/`：`classify → phase_router → skill subgraph → END`，Pointer State Pattern（State ~1KB，大資料留 Redis+PG）。`graph/checkpointer.ts` 用 PostgresSaver（migration 032）。新增/修改 phase handler 必須同步 `graph/nodes/phase-router.ts`。

🚨 **修 Coder/BDD/RED Phase 相關邏輯時必須雙路徑同步改**：
- BullMQ 路徑：`workers/phase-handlers/coder-phases.ts`（`executeCoderSkill` / `executeRealignBdd` / `executeCoderTesting`）
- LangGraph 路徑：`graph/subgraphs/coder-subgraph.ts`（`bddNode` / `codeGenNode` / `testNode`）
- **改前必跑：`grep -rn "<關鍵函數名>" tellcraft-backend/src/{workers,graph,services} 2>/dev/null`** 確認所有觸發點
- **改後必驗：log 模組名 `module:"coder-phases"` vs `module:"coder-subgraph"` 兩種都會出現**，缺一就是漏改
- R5.1 事件：v1/v2/v3 三輪只改 BullMQ 路徑，用戶 prod 走 LangGraph 完全沒套用，浪費三輪部署
- 治本：deterministic-fix / OpenAPI sync / 認證 check 等核心邏輯**應抽 helper** 兩邊 import 共用，從 source 層保證不漏接

### Skill 系統

| Skill | 用途 |
|-------|------|
| `bdd-spec` | 需求釐清 + BDD 規格（Discovery → Clarify → Formulation → Actions → ISA Config）|
| `uiux` | Design Discovery → Design Lab → Implementation |
| `quality-gate` | UIUX/Fast/Clone 完成後**自動觸發**，5 類靜態 + Tier 合規 + 雙層修復（UIUX 3 輪 / Fast+Clone 2 輪）|
| `coder` | actionsYml → lib/actions + app/actions + 改寫組件（需 BDD + Neon）|
| `deployer` | UIUX+Coder → Next.js → Vercel |
| `iteration` | 迭代 + 撤銷 + 回滾（complete 自動路由）|
| `fast-build` | 跳過 BDD/Discovery → 增量生成 → 靜態 QG |
| `domain-*` | 管理/購買/自有綁定（付費限定，配額 creator:1/pro:2-3/business:3-5）|
| `db-provision` | BDD 完成後自動建 Neon DB + Schema（同步 <10s）|
| `clone` | URL/圖片/混合 → inline QG → `uiux_complete` |

### Orchestrator Phase 狀態機

所有 phase 必須在 `handleContinueFlow` 有路由：

| Phase Group | Phase |
|-------|------|
| BDD | `spec_clarify` / `spec_completed` |
| UIUX Discovery | `uiux_design_preference` / `uiux_design_clarify` / `uiux_design_brief_confirm` / `uiux_template_selection` |
| UIUX Generate | `uiux_variant_selection` / `uiux_generating_variants` / `uiux_code_generation` / `uiux_quality_gate` |
| UIUX 完成 | `uiux_complete` / `uiux_iterating` |
| Fast | `fast_generating`（`awaiting_continue` 暫停）|
| Coder | `coder_generating`（攔截輸入，15min 超時恢復 uiux_complete）|
| Deployer | `deployer_deploying` / `failed` / `complete` / `rollback_select` |
| Domain | `domain_{searching,confirm_purchase,registering,own_setup,dns_verifying,complete,failed}` |
| Clone | `clone_{analyzing(5min),generating(20min),failed}` |

### Pipeline 概覽

**UIUX**：BDD → matchTemplates（零 LLM 三層評分）→ Discovery (Path A 問卷 / Path B 模板) → completeDesignClarify (並行圖片+URL Vision) → Brief 確認（顧問 + Tier 推薦，3 輪）→ BDD→UI 翻譯（Haiku 快取）→ 5 變體 + extractVariantConcept → Structure(+Interaction) → Animation → RWD → QG → 迭代 ↔ 部署 ↔ 回滾

**Fast Build**：用戶描述（mode=fast）→ checkBuildRelevance → detectTier → inferProductType → buildDefaultDS → inferInteractionHint → analyzeUploadedImage (Haiku Vision) → generateFastConcept (1 次 Haiku, 1 頁) → 單批 S+A(+R)+QG (`FAST_BUILD_MERGED_ANIM_RWD=true`) → uiux_complete。Tier: `functional`(SaaS, 禁漸層/glow) vs `creative`(landing)。失敗重試 `__retry_fast_build__`。

**Deployer 五層防禦**：L1 validateComponentReferences → L2 sanitizeCodeForDeploy (8 類自動修復) → L3 fixBuildErrors（指數退避 3 次）→ L4 verifyBuildLocally（3 次 LLM 修復 + 1 次驗證）→ L5 useSearchParams Suspense 自動拆分 → Vercel 部署 → 回滾 (Promote API)

### 後端 API 路由（`tellcraft-backend/src/routes/`）

| 路由 | 路徑 |
|------|------|
| conversation | `/api/conversations` |
| project | `/api/projects` CRUD + files/versions/iterate |
| session / bdd / templates / dashboard / auth / health / user / upload(5MB) | `/api/*` |
| operations | `/api/operations`（最大路由：生成/部署/任務/訂閱）|
| line-bot / telegram-bot | `/api/{line,telegram}/webhook`（LINE raw body 必須在 express.json 前）|
| domain | `/api/domain` CRUD + DNS + pricing |

前端 Proxy：`app/api/vps/[...path]/route.ts` → VPS。

### Locale / 認證 / 代碼存儲

- 前端 `app/[locale]/` (zh/en)，LIFF 在 `[locale]/liff/page.tsx`
- 認證：登入頁 → Vercel Proxy → VPS OAuth → JWT → localStorage + Cookie middleware
- `project_files` 表：`(project_id, skill_source, file_path)` 唯一索引 UPSERT，`skill_source`: uiux/code/merge。Deployer 優先讀此表 fallback `bdd_sessions`

### 資料庫 Migration（`tellcraft-backend/migrations/`，36+ 個）

**自動套用**：push `main` 觸發 `.github/workflows/deploy-vps.yml`，跑 `scripts/migrate.sh`，用 `_migrations` 表追蹤、transaction 包裹，失敗 rollback。

```bash
DATABASE_URL=... bash scripts/migrate.sh [--dry-run | --bootstrap-up-to=N | --bootstrap]
```

**禁止**：直接 `psql -f migrations/xxx.sql` 不更新 `_migrations` → 下次 deploy 重跑 `relation already exists`。緊急 hotfix 繞過必須 `INSERT INTO _migrations VALUES ('xxx.sql')` 補登。

### CI/CD + 基礎設施

- VPS：push `main` → GitHub Actions SSH → reset hard + frozen install + build + pm2 startOrReload（雙進程：tellcraft-api + tellcraft-worker）
- 前端：push `main` → Vercel 自動部署
- `vercel.json`: sin1 / maxDuration 60
- `ecosystem.config.js`: PM2 單實例 / `max_memory_restart: 4G` / 優雅關閉 10s
- `nginx/tellcraft.conf`: 80→3100 / `client_max_body_size 6m` / WS `proxy_read_timeout 86400s`

### 測試

後端 Vitest（33+ 檔案於 `tellcraft-backend/src/__tests__/`）。前端目前無測試。其他保障：BDD 驗證腳本 + typecheck/lint + QG。

```bash
cd tellcraft-backend && pnpm test -- src/__tests__/intent-helpers.test.ts
cd tellcraft-backend && pnpm test -- --grep "hasDeployIntent"
```

## BDD 規格格式（sdd.os ISA SpecFormula）

| 步驟類型 | 格式 |
|----------|------|
| 資料準備 | `準備一個{entity}, with table:` |
| 時間控制 | `現在時間為 "{datetime}"` |
| Action 呼叫 | `(No Actor\|UID="$var") {summary}, call table:` |
| 成功回應 | `{summary}(STATUS)回應, with table:` / `with JSON:` |
| 操作失敗 | `操作失敗` |
| Entity 驗證 | `應該存在/不存在一個{entity}, with table:` |

VAR 系統：`>Ctx.field`（宣告）/ `$Ctx.field`（引用）/ `<executionKey`（捕獲）/ `$notnull`（非空驗證）

Feature 註解：`# Action: actionName` + `# [METHOD] /path` + `# Summary: xxx`

錯誤代碼：E001 缺 Action / E002 缺 Summary / E003 缺 Feature / E004 Summary 不一致 / E005 Rule 缺標註 / E006 When 格式錯 / E008 沒 Example

## 防雷清單

> **標記**：`[CI]`=有 pre-commit/CI 守、`[TEST]`=有單測、`[ARCH]`=無法自動化的架構約束、未標記=尚未轉化

### 已自動化覆蓋（一行原則，違反就會被擋）

- `[CI]` 一律用 `claude-sonnet-4-6`（不加日期），用 `semantic-gateway.ts` 常數
- `[CI]` 字體只能用 `next/font`，禁 `<link>`/`@import` Google Fonts
- `[CI]` Tailwind v4：`@import "tailwindcss"`（非 v3 `@tailwind`）
- `[CI]` Skill Telemetry 必須 fire-and-forget（接 `.catch(() => {})`）
- `[TEST]` Tailwind config 禁 CSS 變數引用（用硬編碼值，避免 var 遺失樣式失效）
- `[TEST]` next/font `axes:` 只能用於 variable font（黑名單在 `sanitizeCodeForDeploy` Fix 4.5）
- `[TEST]` Coder Handler `.md` 內容必須以 `\n` 開頭（匹配舊 const 模板），byte-identity 測試守
- `[TEST]` 動畫庫是 `framer-motion` v12+（import from 'framer-motion'）

### 流程編排與 phase 狀態

- **新增 phase 必須五處同步**：`handleContinueFlow` 路由（含超時）+ `FlowState` 型別 + `flowstate-recovery.ts` RECOVERABLE_PHASES + 前端 `richContent.type` union + `graph/nodes/phase-router.ts`
- 🚨 **改 Coder/RED Phase/BDD 邏輯必須雙路徑同步**：BullMQ (`workers/phase-handlers/coder-phases.ts`) + LangGraph (`graph/subgraphs/coder-subgraph.ts`)。**prod 開啟 USE_LANGGRAPH=true（與 code default false 脫節）**。改前 `grep -rn "<key fn>" src/{workers,graph,services}` 確認所有觸發點；改後 worker log 看 `module:"coder-phases"` 和 `module:"coder-subgraph"` 兩種都出現才完整。R5.1 v1-v3 漏接 LangGraph 浪費三輪部署。**新邏輯應抽 helper 兩邊 import 共用**
- **生成中 phase 孤兒偵測三層**：(1) conv-lock 不存在+60s→恢復 (2) lock 存在但 startedAt>5min+無心跳→過期恢復 (3) 20min 超時
- **handleProcessMessage→handleContinueFlow 必須帶 `skipPrefilterAndCredit: true`**，否則 prefilter + credit 雙重執行（雙重扣款）。BullMQ `continue-flow` job 直接呼叫不帶
- **Skill 函數提前 return 必須保存 FlowState**，否則用戶對話永久卡死
- **Formulation phase**：必須設 `formulationStartedAt`（超時恢復依賴）；checkpoint 每 3 feature 保存；成功後清理 `formulation*` 暫存
- `[ARCH]` **deployer_complete 路由順序**：部署 → 回滾 → 域名 → 問候攔截 → semanticGateway → 迭代
- **complete/failed 問候攔截**：三處 `semanticGateway` 前插 `isGreetingOrChitchat()` 零 LLM；`__new_project__` 在 `handleContinueFlow` 入口處理

### 輸入過濾與意圖

- `[TEST]` **迭代輸入四層防禦**：prefilter → detectFastModeIntent → semanticGateway iteration → refineCode [NO_CHANGE]。**ITER_DESIGN_SIGNALS 必須含錯誤修復詞**（修復/error/bug）否則貼錯誤訊息被 quickFilter 拒絕
- **`checkBuildRelevance` fail-closed**：API 錯誤/空回應/catch 全拒絕；無 API key fail-open
- **輸入品質閘門**：全域 `checkInputQuality()` + phase-aware `getPhaseStrictness()` 二次攔截。Redis anti-loop 連續 3 次強制放行防卡死

### LLM 與 cache

- **Anthropic SDK v0.72+** 大 `max_tokens` 必須 `messages.stream()` + `await stream.finalMessage()`
- `[ARCH]` **Prompt Caching**：`buildCacheableSystem()` 拆 static+dynamic block。per-request 內容絕不能放進 static block（否則 cache hit 歸零）
- `[ARCH]` **Structured Outputs**：JSON 用 `callStructured<T>()` + Zod，代碼/Gherkin/YAML/自然語言不能用。`messages.parse()` 與 prefilling **不相容**。改 schema 使 cache 失效。Zod v4 `z.record()` 必須兩參數
- **Extended Thinking**：`ENABLE_EXTENDED_THINKING=false` 預設關，只用在 `fixFailingAction()` / `fixMultipleFeatures()`。response 解析用 `.find(b => b.type === 'text')` 跳過 thinking blocks
- **`ENABLE_DIFF_OUTPUT`**：Animation/RWD/Merged 用 SEARCH/REPLACE block（省 60-70% output token），解析失敗 fallback full-file，多處匹配拒絕替換。不影響 `generateStructure`
- **`streamLlmMessage` vs `sendMessage`**：LLM 對話文字用 streaming；模板/進度/richContent 用 sendMessage

### 自我強化迴圈

- **禁止自動回灌 prompt**：週報產出後人工決定，手改 service system prompt，避免炸 cache 命中率
- **閉環兩層**：(1) pre-commit hook 偵測 `SANITIZE_PATTERN_MAP` 新 entry → WARN 印註冊指令 (2) 週報頂部 `findUnregisteredSanitizePatterns()` 列出未註冊。**Direction A 優先**：能寫 regex/code rule 的不回灌 prompt
- `[TEST]` **Harness 修復提示注入**：三處修復路徑共用 `enrichError(error, rootCause)` 注入 `harnessHint`。`var_resolution`/`auth_check`/`spec_inconsistency` 三類 `skipLlmFix=true`。新增 `FailureRootCause` 必須同步加 `ROOT_CAUSE_HINTS`

### UIUX 生成與品質閘門

- `[ARCH]` **UI Evaluator 黑盒 QA**：Evaluator **絕不能看到 .tsx 代碼**，只看 screenshot + DOM outline。`page.evaluate` 必須用 string callback（tsconfig 不含 DOM types）。失敗降級不阻塞
- `[ARCH]` **設計品質四維度**（consistency/accessibility/taskExecution/codeQuality）：CSS 一致性 per-file+global、WCAG luminance（`wcag-contrast` + Tailwind 色板表，per-file cap 3 個 ratio issue，首版不追溯 parent inherited bg）、`overallScore` 加權 accessibility 35%。`ENABLE_DESIGN_QUALITY_REPORT` 預設 false advisory only。**禁止自動回灌**，只能餵 refineCode
- `[TEST]` **可讀性**：英文 FKGL（≥14 critical / 11-14 warning / <50 chars skip），中文規則（Hero >30 / CTA >12 warning）。`text-readability` ES default export → `require('text-readability').default`，fail-soft
- `[TEST]` **axe-core**：desktop-light viewport，`runOnly: wcag2a/wcag2aa/wcag21aa`（不跑 best-practice 避免誤殺）。critical/serious→critical，其他→warning，category 統一 `visual_regression`，description 加 `[a11y/<rule-id>]`。fail-soft
- `[ARCH]` **DesignSystem 整條 pipeline 統一消費（Phase A-H，`USE_FROZEN_DESIGN_SYSTEM_PIPELINE` master kill switch，預設 true）**：
  - **freeze**（variant 選定後）：`design-system-freeze.ts` 算 hash + audit log + vendored→DS 轉型；snapshot 寫 `state.uiuxDesignSystemHash/Source`；migration 036 加 `generations.design_system_snapshot/hash`
  - **consume**：`refineCode`/`generateAnimations`/`generateRwd`/`generateAnimationsAndRwd` 全用 `pickDesignSystemPrompt()` → `buildDesignSystemPrompt` 完整版（dynamic block，cache 不失效）。`buildCompactDesignPrompt` 是 baseline rollback
  - **vendored fast path**：`tryVendoredFastPath` 跳過 Brief+Variant，`__force_variants__` 退回；獨立 flag `VENDORED_FAST_PATH`，預設 false（避免 lossy 轉型）
  - **token compliance**（`design-token-compliance.ts`）：DS 允許色族 → 掃代碼違反者；`runQualityGate` 整合，hard critical 阻塞部署 + `state.uiuxDesignTokenOverride=true` 用戶逃生口降 warning。`DESIGN_TOKEN_SEVERITY=warning` 預設，違反率 <10% 後切 critical
  - **iteration sync (Phase G, `SYNC_DESIGN_SYSTEM_AFTER_ITERATION`)**：迭代「主色改紅」後 refineCode 改了代碼但 `state.uiuxDesignSystem` 不會自動同步，雙軌：(A) `extractColorTokens` + `resolveColor` 掃實際代碼 (B) Sonnet `callStructured<DesignSystemPatchSchema>` 反推 patch merge。整合 `iteration-skill.ts` sanitize 後 / snapshot 前。`DesignSystemSource` enum 加 `iteration_modified`。fail-soft
  - **DESIGN.md export (Phase H, `ENABLE_DESIGN_MD_EXPORT`)**：`generatedCodeToFileRows` 寫 `tailwind.config.ts` 之後渲染 `state.uiuxDesignSystem` 成 awesome-design-md markdown → root `DESIGN.md`（fileType='doc'），跨工具可攜（Cursor/Figma MCP）。fail-soft。**注意 `download-bundler.ts:assembleFromProjectFiles` 必須有 `file_type === 'doc'` 分支**（02f15a26 修補），否則白名單分類靜默丟棄不會出現在下載 zip
  - **DESIGN.md import (Phase I, `ENABLE_DESIGN_MD_IMPORT`)**：`POST /api/project/:id/import-design` 反向 IO — 用戶下載 zip 後改 DESIGN.md 上傳回來。`services/design-md-importer.ts:parseTellcraftDesignMd` 解析（必填 primary/background/foreground，缺則 400 + 詳細錯誤行；可選欄位用 defaults + warnings）→ patch `state.uiuxDesignSystem` + `freezeDesignSystem(source='imported_design_md')` → 設 phase='uiux_code_generation' → enqueue 'continue-flow' job 帶 sentinel `__import_design_md__` → worker 走 phase-router 觸發 big-bang regen 整站。Body 上限 200KB。**Round-trip 一致性是核心驗收**（測試覆蓋）。`DesignSystemSource` enum 加 `imported_design_md`。**設置注入**：`index.ts:setProjectOrchestratorQueue` + `setProjectRedisClient`（跟 conversation routes 共享同個 queue + redis）
- `[TEST]` **awesome-design-md 短路**：`external/awesome-design-md/` git submodule（71 brand），啟動 eager load + parse cache。`analyzeReference` 入口先 `lookupBrandByDomain` + `inferBrandFromText`，命中返回 `vendored_designmd`（省 5-8s + 10K tokens）。**新增品牌三處改**：submodule 拉新 + `pnpm build` copy + `DOMAIN_TO_BRAND` + `TEXT_ALIAS_TO_BRAND`（多 alias 命中 return null 防誤觸發）。**VPS 部署 checklist**：`git pull --recurse-submodules` + `git submodule update --init`。Submodule 沒拉到 fail-soft 降級
- `[ARCH]` **Mood/tier/techniques/patterns 互補**：mood=視覺方向、tier=技術限制、techniques=element-level、patterns=section-level。Mood 優先級：`variantConcept` > `mood` > `tier`。patterns 不含動畫
- `[ARCH]` **參考網站分析**：puppeteer-core 需系統 Chromium（VPS `apt install chromium-browser`）。SSRF 防護禁 localhost/內網 IP。DOM 失敗不影響截圖（獨立 try-catch）。注入點統一 `formatStructuredDataForPrompt()`
- **上傳圖片參考**：`analyzeUploadedImage` 只存文字結果不存 Buffer；`completeDesignClarify` 並行圖片+URL 合併；imageUrls 管道：`handleProcessMessage → handleContinueFlow → routePhase → handler`

### 預覽與部署

- **預覽零錯誤三層防禦**：(1) **Preview Gate** 寫 Redis 前 esbuild 驗證，壞代碼不推送，emit `preview_stale` (2) **LKG**（migration 034 加 `validation_status/last_validated_*`）passed 同步寫，failed 保留舊 LKG 不被覆蓋；前端 polling `isGenerating && !streamingPreview` 拿 LKG + overlay (3) **Health Beacon** Edit Bridge 每 2s postMessage `tc_health`，5s 沒收到觸發 `iframe_frozen` overlay
- **`generateStructure` 的 `onCheckpoint` callback**：multi-pass 批次完成、syntax fix 後、reference repair 後三處觸發，呼叫端必須傳入 checkpoint callback 防進程崩潰遺失
- **`handleCodePhaseRedo` 需要快照** `uiuxStructureCode/uiuxAnimationCode`，否則 redo 在已修改代碼上重做
- **`verifyBuildLocally` 修復結果必須同步回 DB**，否則預覽和部署代碼分岔
- **WebContainer**：preload 後禁止 `mount()`（清除 node_modules），用 `writeFilesToContainer()` 逐檔寫入；`restart()` 例外。生成期間 early return `AIGenerationWaitingScene`，只有 fast build streaming 即時渲染。`handleUiuxCodeGenerating` 用 `stage: 'uiux_pipeline_progress'`（非 `'info'`）。增量寫入經 `deduplicateRouteConflicts → stripRouteGroups → sanitizeFileContent → injectEditBridge`
- **Layout 禁 opacity:0**：SplitLayout/split-layout 外層不能用 `initial={{ opacity: 0 }}`（多層疊加→黑屏）。useEffect 依賴不含 `fastBuildChunks`。split→default 回退需檢查 code_preview 歷史
- **`app/components/templates/` 已廢棄**，PreviewPanel 用 WebContainers

### Coder / SpecFormula / RED Phase

- **Feature Alignment Gate**：RED Phase 後、Coder 前執行。**修不好阻塞 pipeline**（回退 `uiux_complete`），不像 RED Phase advisory。修復後更新 DB `bdd_sessions.features_content`
- `[TEST]` **Alignment Gate Check 12-16（L31.A-C）對齊類**：(12) `notnull_field_missing_from_setup`（Then `$notnull` 但 entity_setup 沒給該欄位 → LLM 修 code 修不好，是 spec 矛盾）(13) `then_concrete_value_missing` (14) `scenario_scope_setup_mismatch`（每 scenario 獨立檢查 Background+自身 Given，warning，`STRICT_SCENARIO_SCOPE_ALIGNMENT=true` 升 error）(15) `null_expectation_setup_conflict` (16) `entity_validation_field_missing`。系統自動欄位（id/createdAt/updatedAt）白名單，case-insensitive + camelCase↔snake_case 對齊
- `[TEST]` **Alignment Gate L31.D per-check repairDirection + 方向審計**：`CHECK_REPAIR_DIRECTION` map 注入「強制方向 + 禁止移除驗證」hint 到 LLM prompt（`autoFixFeatures` 內）防偷懶移除 `$notnull`。Post-fix 審計比對前後「強驗證」（notnull/literal/null）總數，降幅 >30% 判定 LLM 改錯方向，回退 `bestFeatures` + telemetry `llm_fix_wrong_direction`
- `[ARCH]` **L31.E BDD prompt self-consistency + nullable hint**：`formulation.ts` static block 加「Then-EntitySetup 一致性」rule（≤200 chars，cache miss 後穩定）。dynamic block 注入 `extractNullableColumnsHint(schemaSql, entityMapping)` 列出 nullable_no_default + nullable_with_default 欄位（+1-2K tokens/req）。**必須**跑 `register-prompt-change.ts` 註冊
- `[ARCH]` **Phase 3 多層攔截整體架構（L31.I-O 治本路徑）**：BDD spec 矛盾從「Coder 階段才發現」變「多層早期攔截 + 智慧分流」
  ```
  BDD complete
  → Layer 0 (Bug 6/7 formulation prompt)
  → Layer 1 (Alignment Gate heuristic + L31.I Cost Guardrail $3 上限)
  → Layer 2 (L31.L Phase 3c Dry-Run Then-DB Validation 0 LLM SQL 比對)
  → Layer 3 (L31.K Phase 3b Pre-Coder Stub Validation 真 DB + StubHttpAdapter)
  → Coder generate
  → Layer 4 (L31.J Phase 3a Coder 失敗智慧分流：BDD_SIDE_ROOT_CAUSES → fixFailingSpec / 其他 → fixFailingAction)
  → Layer 5 (SpecFormula 真實測試) → Deploy
  ```
  - **L31.I Cost Guardrail**：`MAX_LLM_CALLS_PER_GATE=20` / `MAX_COST_USD_PER_GATE=$3`，`fixMultipleFeatures` 回 `usage: FixUsage` 透傳累計，超過 break + 回退 `bestFeatures` + telemetry `cost_guardrail_breach`
  - **L31.J Phase 3a Spec-First Repair**：`BDD_SIDE_ROOT_CAUSES`(`var_resolution/spec_inconsistency/api_summary_mismatch/step_parsing/fk_constraint`)→`fixFailingSpec`，其他→`fixFailingAction`。`fixedBddFeatures: Map` persist 到 DB
  - **L31.K Phase 3b Pre-Coder Spec Validation**：Coder 前用 `runRedPhaseFullValidation` + `StubHttpAdapter(501)` 跑真 SpecFormula，failed 自動 `fixFailingSpec`（2 輪）。**取代既有 RED Phase advisory**（向下兼容 env false）
  - **L31.L Phase 3c Feature-Dry-Run Then-DB**：dry-run entity_setup INSERT 後 `validateThenAgainstDb()` 跑 `SELECT` 真實比對 `$notnull/$null`。0 LLM SQL。errors 加進 featureErrors → LLM 修復迴圈（2 輪）。SYSTEM_AUTO_FIELDS 白名單
  - **L31.M Per-Conversation Budget Cap**：3 個 fix path 入口 query `llm_usage` 累計 cost，>= `MAX_CONVERSATION_COST_USD`（預設 $20，最後安全網）abort + telemetry `conversation_budget_exceeded`。fail-open。**普通生成不擋**只擋失控源頭
  - **L31.O Fix Loop 收斂偵測（取代強制 cost cap，L31.N 已 revert）**：LLM 連兩輪修復產同錯誤指紋→自動 break。5 處：`actions-design.ts`/`pre-coder-spec-validation.ts`（新加）+ `feature-alignment-gate.ts`/`feature-validation.ts`/`specformula-runner.ts`（既有 L17.P0.3/L25/L26/L22.C2 fingerprint）。telemetry `fix_convergence_failed`
  - **R1 Deterministic Alignment Fix（取代 LLM 修 Check 12/14/15/16）**：`deterministic-feature-fix.ts` 加 4 個 helper（`autoFillNotnullSetupGap`/`autoRemoveNullConflictSetup`/`autoFillEntityValidateGap`/`autoFillScenarioScopeSetup`），整合到 `autoFixFeatures` L17.P2 deterministic 短路區後。Check 12/14/15/16 case 直接 mutate feature content，0 LLM call。**安全網**：R1 修完後跑結構檢查（DataTable cell count 一致 + entity_setup 不消失）— 失敗整批回退用 LLM。kill switch：`R1_DETERMINISTIC_ALIGNMENT_FIX=false`。Check 13 不做（Create/Update 場景多餘 + 風險高）。telemetry `alignment_fixed patternKey=deterministic_alignment_fix`
  - **R2 Cross-Loop Fix Attempt Cache（防 4 個 BDD fix loop 重複攻擊同 issue）**：`lib/fix-attempt-cache.ts` Redis prefix `bdd-fix-attempted:<convId>:<sha1_16>` TTL 1h。4 loop（`feature-validation`/`actions-design`/`alignment_gate`/`dry_run`）LLM call 前 `shouldSkipLlmFix(fingerprints)`，全 issue 已 ≥2 次嘗試→skip。LLM 後 `recordBatchAttempt` 寫 cache。**完全不接 Coder pipeline**（`fixFailingAction`/`fixFailingSpec`/`runPreCoderSpecValidation` 不接此 cache）。Redis 未注入 → fail-open。kill switch：`R2_FIX_ATTEMPT_CACHE=false`。telemetry `cross_loop_fix_skipped`
  - **R3-A Deterministic 擴大覆蓋（Check 4/8/10）**：`deterministic-feature-fix.ts` 加 3 個 helper（`autoFixResponseFieldNaming`/`autoRemoveEmptyDataRows`/`autoFixCheckConstraintViolation`），整合在 R1 block 後共用安全網。Check 4: Then header snake→camel；Check 10: 主動 scan 全空 row 刪除；Check 8: enum 替換成第一個合法值/range 邊界值。**只動 entity_setup 不動 When call table**（保留用戶測試意圖）。kill switch：`R3A_DETERMINISTIC_EXPANSION=false`（全關）/ `R3A_FIX_CHECK_CONSTRAINT=false`（只關 Check 8 — 中風險子開關）
  - **R3-B 上游 Schema Hint（FK + CHECK 約束）**：`schema-derivation.ts` 加 `extractFkRelationshipHint` 列每 entity 的 FK target、`extractCheckConstraintHint` 列每 column 的 enum/range 合法值。注入 `formulation.ts` dynamic block（不影響 cache）。預期：BDD 一次生對，從源頭減少 Check 8/Check 3 issue。kill switch：`R3B_PROMPT_HINTS=false`。**改完必跑** `pnpm tsx src/scripts/register-prompt-change.ts --pattern r3b_fk_relationship_hint --skill formulation --action prompt_fewshot --target services/schema-derivation.ts`（VPS deploy 後跑）
  - **R4 Check 5.5 cross_scenario_var_reference deterministic**：scenario X 引用 `$varName` 但只在 scenario Y 宣告 → `autoFillCrossScenarioVarReference` 複製 Y 的 entity_setup 步驟到 X 的 Given（**複製不移動** — 保留 Y 自身宣告避免破壞既有 scenario）。重新縮排 + Given/And 關鍵字依現況調整。dedup：同（scenario, var）只插入一次；同 source step 不重複插。kill switch：`R4_CROSS_SCENARIO_VAR_FIX=false`
  - **Fix A：actionsYml 強制讀 Feature `# [METHOD] /path` 註解（解 path/method_mismatch 雪崩）**：`deterministic-actions-fix.ts:autoFixActionsMethodPathFromFeatures` 改為 **authoritative override**（之前 conservative 只填 missing，導致 LLM 寫錯 method/path 時不修）。透過 coder-phases.ts `autoFixActionsAndFeatures` 在 Coder pipeline 入口呼叫 — **新對話 + retry 舊對話都自動受益**（舊 actionsYml 帶錯 method 也會在 retry 時被修正）
  - **Fix B：RED Phase validator `field_mismatch` 去 VAR capture false positive**：`red-phase-validator.ts:518` executionKey 比對 schema column 前先嘗試 VAR 序列化命名解構：`plan1Id`→`Id`→`id`、`faq2Title`→`Title`→`title`、`inquiry1CustomerName`→`CustomerName`→`customerName`。regex：`/^[a-z]+\d+([A-Z]\w*)$/` 抓尾段 PascalCase field 比對 schema。減少 ~70% false positive 雜訊
  - **Fix C：var_in_call_table deterministic 修補**：既有 `deterministic-actions-fix.ts:autoFixVarInCallTable` 偵測 WHEN call table headers 開頭 `>` / `<` 自動 strip。透過 `autoFixActionsAndFeatures` 在 Coder pipeline 入口呼叫，舊對話 retry 時自動修
  - **Fix D：formulation prompt 加 call table + path 一致性規則**：static block 加 (1) VAR Prefix 使用位置表（明確 call table headers 禁 `>` 前綴）+ ✅/❌ 範例；(2) Feature `# [METHOD] /path` 一致性：RESTful kebab-case `/api/admin/pricing-plans` 不要 snake_case `/api/admin_pricing_plans`，public vs admin 區分，含 `:id` 變數慣例。從源頭減少 path_mismatch + var_in_call_table 出現
  - **R5 method/path/var_in_call_table/empty_table_literal deterministic（HTTP method 對齊 + Gherkin parse 救援）**：`actions-design.ts` 新 `deriveActionMethod()` 取代二元 `isQueryAction`，識別前綴 `update_/edit_/modify_`→PUT、`delete_/remove_/destroy_`→DELETE、`patch_`→PATCH、`create_/add_/insert_/register_/submit_`→POST、auth 類→POST；其餘退回 `isQueryAction`。對應 `services/deterministic-actions-fix.ts` 四函數：`autoFixActionsMethodPathFromFeatures`（YAML parse → 把 Feature 註解 `# [METHOD] /path` **authoritative override** 寫入 actionsYml method:/path: — 衝突時覆蓋舊值，Feature 註解是 user-facing 真實意圖）、`autoFixVarInCallTable`（移除 WHEN call table header `>/< ` 前綴）、`autoFixEmptyTableLiteral`（偵測 `, with table:\n  []` Gherkin parse error pattern → 移除整個 `, with table:` 子句 + `[]` 行，step 變成 `Then X(200)回應` 只驗 status；LLM 用 `[]` 表達空陣列但 DataTable 必須 header row）、`autoFixActionsAndFeatures`（整合，串接 var_in_call_table → empty_table_literal 保留前一個修補結果）。整合兩入口：(1) `coder-phases.ts` 5.5 區段（executeRedPhase 後，**無條件跑** — empty `[]` 在 executeRedPhase 靜態檢查偵測不到，只有跑到 SpecFormula parse 才會炸）；(2) `executeRealignBdd` 開頭做 pre-pass（`__realign_bdd__` 不會跑 executeRedPhase）。**Feature 註解優先於 actionsYml**。`deriveActionMethod` 同時改 OpenAPI body 邏輯：DELETE/GET 不加 body，POST/PUT/PATCH 加
  - **R5.1 同步重生 OpenAPI spec（解 stale path 404 雪崩）**：deterministic fix 改 actionsYml method/path 後，**必須同時用 `convertToOpenAPI(fixedActionsYml)` 重生 `bdd_sessions.open_api_spec_content`** 並寫 DB — 否則 Coder 讀新 actionsYml 生 routes 在 `app/api/admin/pricing-plans/[id]/route.ts`，但 SpecFormula 從 stale OpenAPI 讀舊扁平路徑 `/api/update_pricing_plan` 發 request → 巢狀 route 沒人接 → Next.js 回 404 HTML → SpecFormula 把 HTML 當回應 parse 失敗 → 雪崩 75 個 scenario（bb0d1081 案例）。「之前能跑通」是因為兩邊都用 default 扁平 fallback `/api/${action.name}` 自然一致。`convertToOpenAPI` 失敗直接 throw 不 swallow
  - **R5.2 SpecFormula test server method-specific router（治本 9+ 個 Create 失敗）**：`specformula-runner.ts:2390` `generateTestServerCode` 原本用 `app.all('${apiPath}', ...)` 註冊每個 action handler。R5 後 RESTful 設計下 list+create / update+delete 共用 path，**Express 兩個 app.all 同 path 先註冊者勝出** — POST /api/admin/faqs 永遠被 listFaqs handler 攔截 → 拿 POST body 跑 SELECT → 回 `[]` → SpecFormula 9+ Create 全 fail。LLM fix loop 48 輪修不到（在 Server Action 層轉圈，但 createFaq 從沒被呼叫）。**修法**：`app.all` → `app.{get,post,put,patch,delete}` + 用 `deriveActionMethod` 統一推導 method。**新增 SpecFormula test server method router 一定用 method-specific 不要 `app.all`**
  - **Tier A 結構性盲區補完（plan 75-splendid-token.md 路線圖實作）**：
    - **A2** `coder-handlers/` 從 14 → 18：新增 `pagination.md`（LIMIT/OFFSET + 邊界 + items/total/page/pageSize/totalPages 標準結構）/ `search.md`（ILIKE parameterized + 200 char 上限 + 精確匹配優先）/ `auth-guard.md`（401/403/404 嚴格區分，404 不洩漏 resource 存在性）/ `soft-delete-aware.md`（所有 query 加 deleted_at IS NULL，schema 沒此欄位不加）。`buildActionSystemPrompt` 4 條 trigger 邏輯選擇性注入。`CODER_HANDLER_IDS` 同步擴 18，byte-identity test 通過。
    - **A3** mock data 識別改 Haiku ∪ regex **聯集**（不只 fallback）— Haiku 漏掉的 high-confidence pattern regex 補位。Coder 完成後加 telemetry `mock_data_residual` 量化殘留率（給週報追蹤）。
    - **A4** UIUX quality-gate `MAX_FIX_ATTEMPTS` 3 → 5 — 多 2 輪 LLM 修復救 10-20% 邊界 case。第 3 輪起 telemetry 標 `qg_high_retry_count` 警告，給未來 vendored designmd template fallback 觸發判斷用。
    - **Self-Learning Loop**: `skill-telemetry.ts` 新 `findStructuralFailureCandidates`（threshold 5/週，聚焦 red_validation_fail/alignment_blocked/coder_test_fail/coder_test_fix_give_up/fix_convergence_failed/qg_high_retry_count）+ `telemetry-weekly-report.ts` 加新章節「Structural Failure Candidates」。**SOP**：reviewer 每週看本表 → 寫 deterministic fix → register-prompt-change.ts 記 audit → 下週看 count 是否歸零。
    - **A1（M2M/Polymorphic FK/TimeLiteral deterministic）刻意 defer** — 不寫推測性 fix，等 Self-Learning Loop 顯示真實高頻 pattern 再針對性補。**寫推測 fix 風險是 false positive，傷比治多**
  - **Tier B2 — Unique Constraint Auto-Dedup**：`services/unique-constraint-dedup.ts` 解析 schema UNIQUE column（inline + table-level 單欄位），掃 features 的 entity_setup DataTable 同 scope（Background 或單一 scenario）內 group by entity → 重複 unique 值後出現的加 suffix（`email→name+s2@domain` / `name_s2`）。**跨 scenario 不 dedup**（每 scenario reset DB）。VAR / 純數字跳過。整合進 `autoFixActionsAndFeatures(actionsYml, features, schemaSql, entityMappingYaml)` 串接在 var_in_call_table → empty_table_literal 之後。雙路徑（BullMQ coder-phases / LangGraph coder-subgraph）caller 都傳 schema。新 EventType `unique_constraint_deduped`。Tier B1/B3 trigger-based defer — 等 `findStructuralFailureCandidates` 顯示 m2m/polymorphic/timezone 高頻才啟動
  - **觀察 SOP**：`pnpm tsx src/scripts/telemetry-phase3-report.ts --days=2` 看 — alignment cost <$1 / `cost_guardrail_breach` <5% / `spec_first_repair` 成功率 >60% = 治本良好
  - **Kill switches**：`PHASE_3A_SPEC_FIRST_REPAIR` / `PHASE_3B_PRE_CODER_VALIDATION` / `PHASE_3C_DRY_RUN_THEN_VALIDATION` / `ALIGNMENT_GATE_MAX_COST_USD` / `R1_DETERMINISTIC_ALIGNMENT_FIX` / `R2_FIX_ATTEMPT_CACHE` / `R3A_DETERMINISTIC_EXPANSION` / `R3A_FIX_CHECK_CONSTRAINT` / `R3B_PROMPT_HINTS` / `R4_CROSS_SCENARIO_VAR_FIX` 全獨立。Fix A/B/C/D 預設啟用無 flag — 因為已整合進既有 deterministic pipeline，rollback 需要 git revert
- `[TEST]` **LangGraph `coderTestAttempts` 必須 round=0 重置（不累加）**：`coder-subgraph.ts` 內 `round === 0 ? result.attempts : (...) + result.attempts`。錯誤累加會跨 fresh invoke 累積（user retry 看到「104 輪」實際是歷史總和）。`coderTestRegressionRounds` 同理
- **RED Phase 三層驗證**：L1 靜態（12 項零 LLM）/ L2 Stub 全場景（StubHttp 501）/ L2.5 Routing（in-process Express）。L2/L2.5 需 `open_api_spec_content` + `isa_config_content` + `neon_connection_string`，缺則跳過。**L2 阻塞**（Pre-Coder Spec Validation `!passed` → 回退 `uiux_complete` + `coder_error` + 重新生成/重試按鈕；違反 CLAUDE.md「所有錯誤完整顯示前端」原則的 fail-silent catch 已全部移除：`coder-phases.ts` 原 RED Phase Stub catch swallow / Pre-Coder 不阻塞 warning / `executeCoderTesting` catch 降級為手動觸發 三處皆改阻塞或讓錯誤冒到外層 catch）
- **Feature 驗證腳本用 `tsx` 不是 `ts-node`**；腳本解析失敗視為通過（避免無效 LLM 修復循環）
- **Feature Dry-Run**：spec_completed 前用真 Neon DB 跑 entity_setup 驗證，失敗 LLM 修復 2 輪，跳過 api_call/response_validate
- **Stage B 回歸修復**：Phase 2 最多 2 輪，scenario-level 智能跳過（集合不變則停），crash 不重試
- `[TEST]` **SpecFormula JSONB 比較**：`valuesEqual()` JSON 深度比較；`resolveValue()` 支援 `<executionKey`
- **`_stepSummary` dispatch 用 `===`**（非 `op.includes()`），消除子字串碰撞
- **Slot extraction 重試**：失敗後注入錯誤訊息做第二次嘗試
- `[TEST]` **Schema-aware `deleted_at`**：`softDeleteColumn` `.optional()`，Schema 沒此欄位不生成 `AND deleted_at IS NULL`
- `[TEST]` **錯誤根因分類器**：`classifyFailureRootCause()` 零 LLM 8 類，`var_resolution` 跳過代碼修復；`auth_check` 直接 `removeAuthChecks()`
- **雙層完成驗證**：`coderTestPassed` 區分 quickReplies（全通過→部署 / 有失敗→重試+帶風險部署）。`__deploy_with_risk__` 二次確認，`deployedWithFailingTests=true` 寫 FlowState
- **Coder action response field 必須對齊 BDD execution key**：`generateActionFunction` 注入 `<executionKey` + stepSummary + 完整 Feature，否則 VAR-System 連鎖失敗
- **Per-SubOp 生成**：按 When 拆子操作，已知 pattern 走 template（7 個），未知 free-form。**`INLINE_SNAKE_TO_CAMEL`（`_c`）必須內嵌模板**，獨立 function 被 helper 提取器拔出 → runtime undefined。`CODER_PER_SUBOP=false` 一鍵關
- **Code Template Zod schema 必須寬鬆**：`scopeColumn/scopeParam` `.optional()`，`entityIdParam` `.default('id')`，否則 LLM 回 null Zod 拒絕 → template 全掛
- `[TEST]` **ScenarioContext VAR 數字後綴**：`get("listId")` 匹配 `"List1.id"`，fallback 去末尾數字再 camelCase
- **preExtractTestPasswords 引號剝除**：testPasswordMap key 必須剝引號才匹配 `resolveVariable` 結果
- **Coder E2E 必須含 backendFiles**：`runCoderE2ETests` 的 code 須含 `result.backendFiles`，否則 Module not found 500
- **`rewriteComponentForServerActions` maxTokens 32768**：截斷偵測 JSX 平衡，不平衡回退原始組件
- **`identifyMockDataComponents`**：Haiku batch 識別需改寫組件，失敗降級 regex fallback

### 資料庫與基礎設施

- **DB 連線池**：`max: 20` + `keepAlive: true` 防 PG 斷開空閒，`DB_POOL_MAX` 覆蓋
- **Neon 同步 <10s**：失敗不阻塞。Deployer 直接 SELECT `neon_connection_string` 注入 DATABASE_URL
- `[ARCH]` **Neon schema 變更必須保留客戶資料（L21.CRIT-1）**：`provisionNeonDatabase` 預設 `allowDestructiveReprovision=false` — 偵測舊 project 含非空 user table 時**拒絕** drop，回 null+警告。Coder 生成的客戶 app 存**客戶真實資料**，改 schema 絕不能靜默刪除。覆寫需明確傳 true。`hasNonEmptyUserTables` 用 `SELECT EXISTS` 逐表掃，fail-open
- `[ARCH]` **文檔與實作同步**：改後端流程 → 同步更新 `uiux-skill/instructions/` + 此文件

## 核心原則

1. **無腦補**：嚴格遵守規格，不擅自假設
2. **summary 一致**：Action summary 必須與 Feature 名稱一致
3. **自我修復**：驗證失敗進入修正迴圈（最多 3 次）
4. **平台自身不直連 DB**：透過 VPS API；Coder 生成的客戶 app 用 Server Actions + Neon 直連。**禁止 `accept-data-loss`**

## 環境變數

前端（`.env.local`）：`VPS_API_URL`, `NEXT_PUBLIC_VPS_{API,WS}_URL`, `NEXT_PUBLIC_SUPABASE_{URL,ANON_KEY}`, `NEXT_PUBLIC_LIFF_ID`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_{ORG,PROJECT,AUTH_TOKEN}`

後端（`tellcraft-backend/.env`）：定義在 `lib/env.ts` Zod schema（三層 REQUIRED/OPTIONAL/功能開關）。關鍵：`NEON_API_KEY` / `NEON_DEFAULT_REGION`（預設 `aws-ap-southeast-1`，注意 `aws-ap-northeast-1` 已從 Neon 移除）。常用開關：`ENABLE_PROMPT_CACHING`(true) / `FAST_BUILD_MERGED_ANIM_RWD`(true) / `ENABLE_DIFF_OUTPUT`(false) / `USE_LANGGRAPH`(**code false 但 prod env true** — 改 Coder/BDD 邏輯必須雙路徑同步，見「防雷清單」) / `MAX_CONVERSATION_COST_USD`(**code default 20 但 prod env 100000** — 2026-05-13 用戶要求移除 cap，避免 fix loop 中斷；治理改靠人工監控週報) / `ALIGNMENT_GATE_MAX_COST_USD`(**prod 100000**) / `ENABLE_UI_EVALUATOR` / `ENABLE_AXE_CORE` / `ENABLE_READABILITY_CHECK` / `ENABLE_DESIGN_QUALITY_REPORT` / `VENDORED_FAST_PATH` / `DESIGN_TOKEN_SEVERITY`(warning) / `USE_FROZEN_DESIGN_SYSTEM_PIPELINE`(true) / `SYNC_DESIGN_SYSTEM_AFTER_ITERATION`(true) / `ENABLE_DESIGN_MD_EXPORT`(true) / `ENABLE_DESIGN_MD_IMPORT`(true) / `PHASE_3A_SPEC_FIRST_REPAIR` / `PHASE_3B_PRE_CODER_VALIDATION` / `PHASE_3C_DRY_RUN_THEN_VALIDATION` / `MAX_CONVERSATION_COST_USD`(20) / `ALIGNMENT_GATE_MAX_{LLM_CALLS,COST_USD}`
