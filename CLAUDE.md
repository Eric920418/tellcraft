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
pnpm lint                 # ESLint
pnpm typecheck            # TypeScript 型別檢查
pnpm test                 # Vitest（watch mode）
pnpm test:ci              # 前端+後端 Vitest 全跑（CI 用）

# VPS 後端開發（tellcraft-backend/）
cd tellcraft-backend
pnpm install && pnpm dev  # 啟動開發伺服器（http://localhost:3100，tsx watch 熱更新）
pnpm build                # TypeScript 編譯（tsc → dist/）
pnpm typecheck            # 型別檢查
pnpm test                 # 後端 Vitest（watch mode）
pnpm test:ci              # 後端 Vitest（CI 用）

# BDD 規格驗證（修改 Feature Files 後必須依序執行）
npx ts-node bdd-spec/scripts/lint-gherkin-format.ts spec/features/   # ISA Format Lint
npx ts-node bdd-spec/scripts/validate-feature.ts spec/features/      # 結構驗證
# 選項：--json, --strict, --fix

# VPS 部署（SSH 到 VPS 後執行）
git pull && pnpm build && pm2 startOrReload ecosystem.config.js --wait-ready

# VPS 除錯（SSH）
pm2 logs tellcraft-api --lines 100       # API 進程日誌
pm2 logs tellcraft-worker --lines 100   # Worker 進程日誌
pm2 status                                # 進程狀態
pm2 describe tellcraft-backend            # 詳細資訊（記憶體/重啟次數）
# 日誌檔案：/var/log/tellcraft/out.log、/var/log/tellcraft/error.log
```

## 系統架構

### 雙端架構：Vercel 前端 + VPS 後端

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

**Tellcraft 平台自身**前端不直連資料庫：`Vercel Server Actions → app/lib/vps-api.ts → VPS Express API → PostgreSQL`

**Coder Skill 生成的客戶 app** 使用 Server Actions + Neon 直連（`Server Actions → lib/actions/*.ts → Neon PostgreSQL`），這是合法且推薦的現代架構，不受此限制。

**為什麼用 VPS**：Vercel Serverless 超時限制（10-60 秒）無法處理長時間 LLM 任務。

**注意事項**：
- 前端路徑別名 `@/*` 映射到 `./*`（tsconfig.json paths），後端無路徑別名
- 前後端 TypeScript 完全隔離（tsconfig exclude `tellcraft-backend/` 和 `prompts/`）
- 前端 package.json name 為 `ai-genesis`（歷史遺留），專案實際名稱是 `tellcraft`

### 核心模組

**後端（`tellcraft-backend/src/`）**

| 模組 | 路徑 | 職責 |
|------|------|------|
| **Orchestrator** | `workers/orchestrator.ts` | BullMQ Worker + handleProcessMessage + handleContinueFlow |
| **Phase Router** | `workers/phase-router.ts` | Phase 路由分派 + deployer_failed/complete 子路由 |
| **Intent Helpers** | `workers/intent-helpers.ts` | 意圖判斷 + 常數（PHASE_BACKTRACK_MAP 等） |
| **BDD Phases** | `workers/phase-handlers/bdd-phases.ts` | BDD 全流程：ES/Discovery/Clarify/Formulation/Spec |
| **UIUX Phases** | `workers/phase-handlers/uiux-phases.ts` | UIUX 全流程：Discovery/Brief/Variant/CodePipeline |
| **Deploy Phases** | `workers/phase-handlers/deploy-phases.ts` | prepareDeployment + executeDeployment |
| **Fast Build Phases** | `workers/phase-handlers/fast-build-phases.ts` | 快速建站增量生成 |
| **Clone Phases** | `workers/phase-handlers/clone-phases.ts` | 網站復刻三模式（URL/圖片/混合）→ inline QG → uiux_complete |
| **Web Clone Service** | `services/web-clone-service.ts` | Clone 核心：DOM/CSS 提取、section 切割、Sonnet Vision 生成、圖片模式多頁組裝 |
| **Coder Phases** | `workers/phase-handlers/coder-phases.ts` | BDD → RED Phase → Coder Pipeline → 合併代碼 + GREEN Phase 測試 |
| **Feature Alignment Gate** | `services/feature-alignment-gate.ts` | 阻斷式 6 項對齊檢查 + LLM 修復（2 輪），修不好阻塞 pipeline |
| **Syntax Validator** | `services/syntax-validator.ts` | 共用 esbuild TSX 驗證 + Haiku 修復（coder-generation + uiux refineCode） |
| **RED Phase Validator** | `services/red-phase-validator.ts` | 三層驗證：L1 靜態（12 項）+ L2 StubHttpAdapter + L2.5 RoutingStubAdapter |
| **Domain Phases** | `workers/phase-handlers/domain-phases.ts` | 域名全流程：搜尋/確認購買/註冊/自有域名設定/DNS 驗證/完成/失敗 |
| **Orchestrator Utils** | `workers/orchestrator-utils.ts` | 共用基礎設施：sendMessage/streamLlmMessage/saveFlowState/getFlowState 等 |
| **FlowState 型別** | `types/flow-state.ts` | FlowState 介面 + 子型別（避免循環 import） |
| **Classifier** | `services/classifier.ts` | 三層防禦：Prefilter → Meta Intent → Skill 分類 |
| **UIUX Generation** | `services/uiux-generation.ts` | 設計生成核心（Brief/Variants/Structure/Animation/RWD/Refine） |
| **Quality Gate** | `services/quality-gate.ts` | 5 類靜態檢查 + Design Tier 合規 + Rule-based 5 規則修復 + Haiku fallback |
| **Coder Generation** | `services/coder-generation.ts` | 後端代碼生成：parseActionsYml → generateActionFunction → generateServerActions → identifyMockDataComponents → rewriteComponentForServerActions |
| **Deployer** | `services/deployer.ts` | sanitize → build 驗證 → Vercel 部署 → 回滾（合併 uiux+coder skill_source） |
| **Iteration Skill** | `services/iteration-skill.ts` | 迭代修改 + 撤銷 + 版本回滾（從 orchestrator 抽出） |
| **Fast Build** | `services/fast-build-generation.ts` | 快速模式輔助：tier 偵測、產品推斷、默認 DesignSystem（零 LLM）、surface-1/2/3 色階 |
| **Design Techniques** | `services/design-techniques.ts` | 視覺技法庫（30 個 Layout/Surface/Typography/Interaction 技法），按 tier+productType 加權隨機注入 Structure prompt |
| **Composition Patterns** | `services/composition-patterns.ts` | 20 個 section-level 佈局組合模式（hero/content/data/shell）+ `selectCompositionPatterns()` page-type-aware 選擇 + prompt 注入 |
| **Reference Analyzer** | `services/reference-analyzer.ts` | URL→截圖+DOM/CSS 提取→Haiku Vision 分析，四層降級 + `analyzeUploadedImage` |
| **Template Matcher** | `services/template-matcher.ts` | 三層評分智能匹配（關鍵詞 40 + Category 30 + UISpec 30，零 LLM） |
| **Design Moods** | `services/design-moods.ts` | 8 個設計情緒預設 + `recommendMoods()` 規則推薦（feeling 50 + productType 30 + tier 過濾）+ prompt 注入 getter |
| **Semantic Gateway** | `services/semantic-gateway.ts` | 統一語義閘門：quickFilter 零 LLM 短路 + Sonnet 六元 verdict（bdd_clarify/design_clarify/iteration），取代 keyword array |
| **Customer Service** | `services/customer-service.ts` | 客服問答：detectFastModeIntent 意圖分類（greeting/question/chitchat/help/platform_issue）+ FAQ 零 LLM 匹配（9 主題）+ answerWithSonnet 開放問答 |
| **Prefilter** | `services/prefilter.ts` | 全域輸入預過濾：checkInputQuality 亂碼/髒話/垃圾 + phase-aware 二次攔截（getPhaseStrictness）+ Redis anti-loop |
| **Domain Service** | `services/domain-service.ts` | Porkbun 註冊 + Cloudflare DNS + Vercel 綁定 + RDAP 查詢 + rollback |
| **Neon Service** | `services/neon-service.ts` | 同步建立 Neon PostgreSQL DB + 套用 Schema，< 10s |
| **Schema Derivation** | `services/schema-derivation.ts` | schemaSql → PostgreSQL DDL（零 LLM，ID→UUID/RLS/created_at） |
| **FlowState Recovery** | `services/flowstate-recovery.ts` | 每 2 分鐘掃描，逾時 phase 自動恢復 |
| **Conversation Lock** | `services/conversation-lock.ts` | Redis SET NX EX 互斥鎖（TTL 5min） |
| **LINE 整合** | `services/line-*.ts`（4 檔） | Notify 推播 + Bot Handler + Message Translator + Full Push |
| **Env** | `lib/env.ts` | Zod 環境變數驗證，啟動時快速失敗 |
| **Anthropic** | `lib/anthropic.ts` | 統一 Client 單例 + MODEL 常數（SONNET/HAIKU） |
| **Structured Output** | `lib/structured-output.ts` | `callStructured<T>()` — JSON LLM 呼叫封裝 |
| **Validate** | `middleware/validate.ts` | Zod 請求驗證中間件（validateBody/Query/Params） |
| **Schemas** | `schemas/*.ts` | API 路由 Zod schema 定義（conversation/session/operations/bdd/project/domain） |
| **Telegram 整合** | `services/telegram-*.ts`（3 檔） | Notify 推播 + Bot Handler + Full Push |
| **SpecFormula** | `lib/specformula/`（27 檔） | SDD 驗證引擎：Feature Files → HTTP API → DB 驗證。Coder Stage B 自動驗證 |
| **Job Failure** | `services/job-failure-handler.ts` | BullMQ 最終失敗持久化 + 用戶通知 |

**前端（`app/`）— 大檔案優先閱讀**

| 模組 | 路徑 | 行數 | 職責 |
|------|------|------|------|
| **主頁面** | `app/[locale]/page.tsx` | ~360 | HomeContent 編排（Hero + Chat + Landing Sections + Auth） |
| **對話容器** | `app/components/chat/ChatSection.tsx` | ~994 | 對話組合容器（5 hooks + handleSend/handleSendMessage） |
| **消息列表** | `app/components/chat/ChatMessageList.tsx` | ~771 | 消息渲染 + 輸入框 + richContent 分派 |
| **預覽面板** | `app/components/chat/ChatPreviewPanel.tsx` | ~651 | 右側預覽（BDD/FastBuild/CodePreview/Template） |
| **共用型別** | `app/types/chat.ts` | ~67 | Message/SessionInfo/ConversationItem/COMMAND_KEYS |
| **聊天 Hooks** | `app/hooks/useChat*.ts` + `useLoginPrompt.ts` | ~1063 | 滾動/編輯器/輪詢/會話/登入提示 |
| **LLM 工具** | `app/lib/llm.ts` | ~2200 | LLM 呼叫封裝、prompt 工具 |
| **VPS API Client** | `app/lib/vps-api.ts` | ~1900 | 前端呼叫 VPS 的 HTTP 客戶端 |
| **Server Actions** | `app/actions/index.ts` | ~1800 | 對話/訊息/專案等 Server Actions 入口 |
| **WebContainer 預覽** | `app/lib/webcontainer-utils.ts` + `WebContainerPreview.tsx` + hooks | | WebContainers 跑 Next.js dev server，preloader pre-boot + pre-install |
| **Remotion 動畫** | `app/components/remotion/` + `FastBuildPlayer` + `building-scene/` | | 3D 動畫（Fast Build 工廠 + BDD 蓋房子）|
| **Landing 組件** | `app/components/landing/` | ~1978 | 15 個自包含 Landing Page 組件 |

### Skill 系統

| Skill | 用途 |
|-------|------|
| `bdd-spec` | 需求釐清 + BDD 規格產出（5 階段：Discovery → Clarify → Formulation → Actions Design → ISA Config）|
| `uiux` | 前端介面設計（3 階段：Design Discovery → Design Lab → Implementation）|
| `quality-gate` | UIUX/Fast Build/Clone 完成後**自動觸發**，5 類靜態檢查 + Design Tier 合規 + Rule-based/LLM 雙層自動修復（UIUX 3 輪 / Fast Build+Clone 2 輪）|
| `coder` | 後端代碼生成：actionsYml → lib/actions + app/actions + 改寫 UIUX 組件（需 BDD + Neon DB）|
| `deployer` | UIUX+Coder 代碼 → Next.js → Vercel 部署（用戶說「部署」觸發） |
| `iteration` | 迭代修改 + 撤銷上一步 + 版本回滾（`uiux_complete`/`deployer_complete` 自動路由） |
| `fast-build` | 快速建站：一句話 → 跳過 BDD/Discovery → inferInteractionHint → 增量生成（首頁先預覽 → 用戶確認 → 剩餘頁面）→ 靜態 QG → Preview |
| `domain-manager` | 域名管理：列出已有域名 / 引導購買或綁定（付費會員限定） |
| `domain-purchase` | 域名購買：RDAP 查詢可用性 → 確認 → Porkbun 註冊 → Cloudflare DNS → Vercel 綁定（付費會員限定，配額 creator:1/pro:2/business:3） |
| `domain-dns` | 自有域名綁定：顯示 DNS 設定說明 → 用戶確認 → 驗證 DNS 傳播 → 完成（付費會員限定，共用域名配額） |
| `db-provision` | BDD 完成後自動建 Neon DB + 套用 Schema（同步 < 10s，無 Redis）（付費會員限定，creator:1/pro:3/business:5） |
| `clone` | 網站復刻三模式（URL/圖片/混合）→ inline QG → `uiux_complete`。`clone_failed` 統一錯誤處理+重試 |

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
| `uiux_code_generation` | Implementation 確認/重做（Structure+Interaction → Animation → RWD） |
| `uiux_quality_gate` | Quality Gate 執行中 |
| `uiux_complete` / `uiux_iterating` | UIUX 完成（可迭代或部署）/ 迭代修改中 |
| `fast_generating` | 快速模式生成中（攔截用戶輸入；`fastBuildStage=awaiting_continue` 時暫停等用戶確認繼續/完成/迭代） |
| `coder_generating` | Coder Skill 生成後端代碼中（攔截用戶輸入，15min 超時恢復到 uiux_complete） |
| `deployer_deploying` / `deployer_failed` / `deployer_complete` | 部署流程（用戶說「部署」直接執行，無二次確認） |
| `deployer_rollback_select` | 等待用戶選擇回滾版本 |
| `domain_searching` | 域名查詢中（攔截用戶輸入） |
| `domain_confirm_purchase` | 顯示價格，等用戶確認購買 / 取消 / 填寫 registrant 表單 |
| `domain_registering` | 註冊 + DNS 自動設定中（攔截用戶輸入） |
| `domain_own_setup` | 顯示 DNS 說明，等用戶確認已設定 |
| `domain_dns_verifying` | 驗證 DNS 傳播中（攔截用戶輸入） |
| `domain_complete` | 域名綁定完成（quickReplies 引導管理） |
| `domain_failed` | 域名操作失敗 + 重試/放棄選項 |
| `clone_analyzing` | Clone Skill 分析中（截圖+DOM 提取+section 切割，攔截用戶輸入，5min 超時） |
| `clone_generating` | Clone Skill 逐 section/page 生成中（Sonnet Vision，攔截用戶輸入，20min 超時） |
| `clone_failed` | Clone 分析/生成失敗 + 重試(`__retry_clone__`)/新專案選項。支援貼新 URL 或上傳新圖片直接重試 |

### UIUX Pipeline 概覽

```
BDD 完成 → matchTemplates()（零 LLM，三層評分）
  ├─ 有匹配 → "討論式設計 / 使用模板(N個推薦)"
  └─ 無匹配 → "開始設計"（不顯示模板按鈕）
Discovery（Path A 問卷 / Path B 篩選後模板）
  → completeDesignClarify：並行分析上傳圖片 analyzeUploadedImage() + URL analyzeReference()，兩者都有則合併 visionAnalysis，快取 FlowState.uiuxReferenceAnalysis
  → Design Brief 確認（AI 顧問 + Design Tier 推薦 + 真實參考分析注入，最多 3 輪）
  → BDD→UI 翻譯（Haiku，快取在 FlowState.uiuxUISpec）
  → 5 變體生成（+ 參考分析注入）+ 用戶選擇 → extractVariantConcept()
  → Implementation: generateStructure(+Interaction) → generateAnimations() → generateRwd()
  → Quality Gate 自動觸發
  → 迭代修改（refineCode）↔ 部署（deployer）↔ 回滾
```

### Fast Build Pipeline（快速模式）

```
用戶描述（mode=fast，可附參考圖片）→ 跳過 Classifier
  → checkBuildRelevance（vague 攔截 + quickReplies 引導）
  → detectDesignTier（規則式）→ inferProductType → buildDefaultDesignSystem → inferInteractionHint
  → analyzeUploadedImage（如有圖片，Haiku Vision 分析，降級跳過）
  → generateFastConcept（1 次 Haiku，概念 + suggestedTier 修正，suggestedPages 限 1 頁，注入參考分析）
  → mergePages（上限 1 頁）→ 單批生成 S+A(+R)+QG（FAST_BUILD_MERGED_ANIM_RWD=true 時 A+R 合併為一次 Sonnet）→ 完成
  → phase='uiux_complete'（複用所有迭代/部署/回滾邏輯）
  單頁深度模式：只做首頁，5-8 個 Section 內容豐富
```

- **單頁深度模式**：三層限制只返回 1 頁，Structure prompt 指引 5-8 個 Section + anchor link
- **Design Tier**：`functional`（dashboard/SaaS，禁漸層/glow）vs `creative`（landing page，允許大膽設計）
- **串流預覽**：Socket.io `preview_update` 即時推送 → WebContainer `fs.writeFile()` → HMR 刷新
- **失敗重試**：`__retry_fast_build__` quickReply，用 `fastModeOriginalMessage` 重新生成
- **增量交互式生成**（>4 頁觸發，目前預設不觸發）：`mergeGeneratedCode()` 按 path 去重合併

### Deployer Pipeline（五層防禦）

```
Layer 1: generateStructure 後 validateComponentReferences → repairMissingComponents（LLM 修復）
Layer 2: sanitizeCodeForDeploy（8 類自動修復 + broken import 自動生成 stub 組件 + ?? 與 ||/&& 混用加括號）
Layer 3: fixBuildErrors（API 指數退避重試 3 次，覆蓋 overloaded/rate_limit）
Layer 4: verifyBuildLocally（3 次 LLM 修復 + 1 次驗證 build，共 4 次 build）
Layer 5: sanitizeCodeForDeploy 修復 7 — useSearchParams Suspense boundary 自動拆分
  → Vercel 部署
  → 部署後可迭代（refineCode → 重新部署）或回滾（Vercel Promote API）
```

### 後端 API 路由（`tellcraft-backend/src/routes/`）

| 路由檔案 | 掛載路徑 | 說明 |
|----------|----------|------|
| `conversation.ts` | `/api/conversations` | 發訊息/回覆/歷史 |
| `project.ts` | `/api/projects` | CRUD + files/versions/iterate |
| `session.ts` | `/api/session` | initialize + conversations |
| `bdd.ts` | `/api/bdd` | BDD CRUD + answer/confirm/revert/skip |
| `templates.ts` | `/api/templates` | 列表/詳情/預覽/管理 |
| `operations.ts` | `/api/operations` | 生成/部署/任務/訂閱（最大路由） |
| `dashboard.ts` | `/api/dashboard` | 統計 + Admin |
| `auth.ts` | `/api/auth` | Google/LINE OAuth |
| `health.ts` | `/api/health` | 健康檢查 |
| `user.ts` | `/api/user` | 用戶資訊/帳號合併 |
| `upload.ts` | `/api/upload` | 圖片上傳（5MB，JPEG/PNG） |
| `line-bot.ts` | `/api/line/webhook` | LINE Webhook（raw body 在 express.json 前） |
| `domain.ts` | `/api/domain` | 域名 CRUD + DNS + pricing |

前端 Proxy：`app/api/vps/[...path]/route.ts` 將 `/api/vps/*` 轉發到 VPS 後端。

### Locale 路由

前端使用 `app/[locale]/` 多語系路由（zh/en）。`app/hooks/useLocalePath.ts` 處理帶 locale prefix 的路徑跳轉，`app/components/LocaleSwitcher.tsx` 切換語言。LIFF（LINE 內嵌）頁面在 `app/[locale]/liff/page.tsx`。

### 認證系統

`登入頁 → Vercel Proxy → VPS OAuth → JWT Token → localStorage（前端 hook）+ Cookie（middleware）`

### 代碼存儲：project_files 表

`(project_id, skill_source, file_path)` 唯一索引，UPSERT。`skill_source`: uiux/code/merge。Deployer 優先讀此表，fallback `bdd_sessions`。

### 資料庫 Migration（`tellcraft-backend/migrations/`）

共 24 個 migration（`001_initial_schema` ~ `024_add_neon_columns`），檔名自說明。新增 migration 後在 VPS 執行：`psql "$DATABASE_URL" -f tellcraft-backend/migrations/xxx.sql`

### Skill 定義目錄

| 目錄 | 說明 |
|------|------|
| `bdd-spec/` | BDD Skill 定義：`skill.md`（metadata/觸發）、`instructions/`（00-06 各 phase 指引）、`scripts/`（lint/validate）、`resources/`（範例/模板） |
| `uiux-skill/` | UIUX Skill 定義：設計階段指引 |
| `quality-gate-skill/` | Quality Gate Skill 定義 |
| `spec/` | BDD 產出：`features/`（.feature 檔案）、`actions/`（actions.yml）、`data/` |

### CI/CD

- **VPS 後端自動部署**：push 到 `main` 分支 → GitHub Actions SSH 到 VPS → `git reset --hard origin/main` → `pnpm install --frozen-lockfile` → `pnpm build` → `pm2 startOrReload ecosystem.config.js`（雙進程：`tellcraft-api` + `tellcraft-worker`）（`.github/workflows/deploy-vps.yml`）
- **前端自動部署**：push 到 `main` → Vercel 自動偵測 Next.js 並部署

### 基礎設施配置

- **`vercel.json`**：region `sin1`（新加坡）、`maxDuration: 60`（所有 Server Actions）
- **`ecosystem.config.js`**：PM2 設定，單實例、`max_memory_restart: '4G'`、日誌寫 `/var/log/tellcraft/`、優雅關閉 10 秒
- **`tellcraft-backend/nginx/tellcraft.conf`**：Port 80 反向代理到 3100、`client_max_body_size 6m`（圖片上傳）、WebSocket `proxy_read_timeout 86400s`

### 測試

後端使用 **Vitest**，測試檔案在 `tellcraft-backend/src/__tests__/`（19 個檔案）：
- 核心服務測試：`intent-helpers.test.ts`（107 條）、`semantic-gateway.test.ts`（56 條）、`deployer-sanitize.test.ts`（41 條）、`log-parser.test.ts`（33 條）
- 設計系統測試：`design-moods.test.ts`、`composition-patterns.test.ts`、`design-system-v2.test.ts`、`prompt-architecture.test.ts`、`uiux-optimization.test.ts`
- SpecFormula 測試：`specformula/naming-converter.test.ts`、`type-converter.test.ts`、`isa-spec-reader.test.ts`、`entity-ddl-reader.test.ts` 等（8 檔）
- 快速模式測試：`merge-pages.test.ts`

```bash
# 跑單一測試檔案
cd tellcraft-backend && pnpm test -- src/__tests__/intent-helpers.test.ts
# 跑指定 pattern
cd tellcraft-backend && pnpm test -- --grep "hasDeployIntent"
```

前端目前無測試檔案。其他品質保障：
- BDD 規格驗證腳本（lint-gherkin-format + validate-feature）
- TypeScript 型別檢查（`pnpm typecheck`）
- ESLint（`pnpm lint`）
- Quality Gate 靜態檢查（A11y per-element/色彩對比度/Performance/CodeQuality/SVG ID/Design Tier 合規）+ Rule-based 5 規則 + Haiku LLM fallback

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

- **Structured Outputs（`lib/structured-output.ts`）**：JSON 輸出用 `callStructured<T>()` + Zod schema。只適用 JSON 輸出；代碼/Gherkin/YAML/自然語言不能用。`messages.parse()` 與 message prefilling **不相容**。改 schema 會使 prompt cache 失效。Zod v4 `z.record()` 必須傳兩個參數。`formulation.ts`/`coder-generation.ts` 保留 local `callClaude` wrapper 給非 JSON 輸出用
- **handleProcessMessage 轉發到 handleContinueFlow 時必須帶 `skipPrefilterAndCredit: true`**：否則 prefilter + credit deduction 會執行兩次（雙重扣款）。只有 BullMQ `continue-flow` job 直接呼叫 `handleContinueFlow` 時才不帶此旗標
- **生成中 phase 孤兒偵測三層**：(1) conv-lock 不存在+60s→恢復 (2) lock 存在但 startedAt>5min+無心跳→過期恢復 (3) 20min 超時。新增生成中 phase 必須考慮這三層
- **`generateStructure` 的 `onCheckpoint` callback**：在 multi-pass 批次完成、syntax fix 後、reference repair 後三處觸發。呼叫端必須傳入 checkpoint callback 將中途代碼存入 FlowState，防止進程崩潰遺失串流中代碼
- **新增 phase 必須四處同步**：`handleContinueFlow` 路由（含超時偵測）+ `FlowState` 型別 + `flowstate-recovery.ts` RECOVERABLE_PHASES + 前端 `richContent.type` union
- **Layout 禁止 opacity:0**：SplitLayout/split-layout 外層不能用 `initial={{ opacity: 0 }}`（多層疊加→黑屏）。useEffect 依賴不含 `fastBuildChunks`。split→default 回退需檢查 code_preview 歷史
- **動畫庫是 `framer-motion`**（v12+），import 用 `from 'framer-motion'`
- **字體只能用 `next/font`**，禁止 `<link>` / `@import` Google Fonts
- **Tailwind v4**：用 `@import "tailwindcss"`，不是 v3 的 `@tailwind`
- **Tailwind config 禁止 CSS 變數引用**：`generateTailwindConfig()` 必須用硬編碼值（`'9999px'` 非 `'var(--radius-full)'`），否則部署後 CSS 變數可能遺失導致樣式失效
- **`app/components/templates/` 已廢棄**，PreviewPanel 用 WebContainers 渲染
- **deployer_complete 路由順序**：部署 → 回滾 → 域名 → 問候攔截 → semanticGateway → 迭代修改
- **complete/failed 問候攔截**：三處 `semanticGateway` 前插入 `isGreetingOrChitchat()` 零 LLM 攔截。`__new_project__` 在 `handleContinueFlow` 入口處理
- **迭代輸入四層防禦**：prefilter → detectFastModeIntent（`platform_issue` 回覆操作指引）→ semanticGateway iteration → refineCode [NO_CHANGE]。**ITER_DESIGN_SIGNALS 必須含錯誤修復詞**（'修復'/'error'/'bug'），否則貼錯誤訊息被 quickFilter 拒絕
- **`checkBuildRelevance` fail-closed**：API 錯誤/空回應/catch 全部拒絕（非放行），無 API key 時 fail-open
- **輸入品質閘門**：`checkInputQuality()` 全域攔截 + `getPhaseStrictness()` phase-aware 二次攔截。Redis anti-loop 連續 3 次強制放行防卡死
- **參考網站分析**：puppeteer-core 需系統 Chromium（VPS `apt install chromium-browser`）。SSRF 防護禁 localhost/內網 IP。DOM 提取失敗不影響截圖（獨立 try-catch），降級純 Vision。四個注入點統一用 `formatStructuredDataForPrompt()`
- **上傳圖片參考**：`analyzeUploadedImage` 只存文字結果不存 Buffer。`completeDesignClarify` 並行分析圖片+URL，合併 visionAnalysis。imageUrls 管道：`handleProcessMessage` → `handleContinueFlow` → `routePhase` → phase handler
- **Mood/tier/techniques/patterns 互補**：mood=視覺方向，tier=技術限制，techniques=element-level，patterns=section-level。Mood 優先級：`variantConcept` > `mood` > `tier`。patterns 不含動畫
- **文檔與實作同步**：改後端流程 → 同步更新 `uiux-skill/instructions/` + 此文件
- **`handleCodePhaseRedo` 需要快照**：`uiuxStructureCode`/`uiuxAnimationCode`，否則 redo 在已修改代碼上重做
- **`verifyBuildLocally` 的修復結果必須同步回 DB**：否則預覽和部署代碼分岔
- **部署五層防禦**：L1 generateStructure 後驗證引用 → L2 sanitizeCodeForDeploy stub 生成 + `??` 與 `||/&&` 混用自動加括號 → L3 fixBuildErrors API 重試 → L4 build 循環 3+1 次 → L5 useSearchParams Suspense 拆分
- **Anthropic 模型 ID**：一律用 `claude-sonnet-4-6`（不加日期後綴），`claude-sonnet-4-6-20250514` 不存在會 404。全 codebase 用 `semantic-gateway.ts` 定義的常數而非手打
- **Anthropic SDK v0.72+**：大 `max_tokens` 必須用 `messages.stream()` + `await stream.finalMessage()`
- **Skill 函數提前 return 必須保存 FlowState**：否則 `handleContinueFlow` 找不到 state → 用戶對話永久卡死
- **Formulation phase**：必須設 `formulationStartedAt`（超時恢復依賴）。checkpoint 每 3 feature 保存，成功後清理所有 `formulation*` 暫存欄位
- **DB 連線池**：`max: 15`（非 50）+ `keepAlive: true`，防止 PostgreSQL 斷開空閒連線。可用 `DB_POOL_MAX` 環境變數覆蓋
- **Feature 驗證腳本用 `tsx` 不是 `ts-node`**：`feature-validation.ts` 的 `runScript()` 用 `npx tsx`。腳本解析失敗時視為通過（不觸發無效 LLM 修復循環），stderr/exitCode 會完整記錄供除錯
- **Feature Dry-Run**：spec_completed 前用真實 Neon DB 跑 entity_setup 驗證。失敗 LLM 修復（2 輪）。跳過 api_call/response_validate
- **Feature Alignment Gate**：RED Phase 後、Coder 前執行。修不好**阻塞 pipeline**（回退 `uiux_complete`），不像 RED Phase 的 advisory 模式。修復後自動更新 DB `bdd_sessions.features_content`
- **RED Phase 三層驗證**：L1 靜態（12 個零 LLM 檢查，含 Schema DataTable 深度對齊）、L2 Stub 全場景（StubHttpAdapter 回 501）、L2.5 Routing（RoutingStubAdapter in-process Express）。**Check 12**：偵測 WHEN call table headers 誤用 `>/<` 前綴（正確為 `id`/`$variable`）。L2/L2.5 需 `open_api_spec_content` + `isa_config_content` + `neon_connection_string`，缺則跳過。三層都不阻塞
- **SpecFormula JSONB 比較**：`valuesEqual()` 支援 JSON 深度比較（string ↔ JS array/object）。`resolveValue()` 支援 `<executionKey`
- **Stage B 回歸修復**：Phase 2 最多 2 輪，scenario-level 智能跳過（集合不變則停），crash 不重試
- **`_stepSummary` dispatch 用 `===`**：非 `op.includes()`，消除子字串碰撞。`parseActionBranches` 向後相容兩種格式
- **Slot extraction 重試**：失敗後注入錯誤訊息做第二次嘗試，減少 fallback 到 free-form LLM
- **Schema-aware `deleted_at`**：`softDeleteColumn` 為 `.optional()`，Schema 沒有此欄位不生成 `AND deleted_at IS NULL`
- **錯誤根因分類器**：`classifyFailureRootCause()` 零 LLM 8 類。`var_resolution` 跳過代碼修復；`auth_check` 直接 `removeAuthChecks()`
- **雙層完成驗證**：`coderTestPassed` 區分 quickReplies（全通過→部署，有失敗→重試+帶風險部署）。`__deploy_with_risk__` 需二次確認，`deployedWithFailingTests=true` 寫入 FlowState
- **Neon provisioning 同步（< 10s）**：失敗不阻塞。Deployer 直接 SELECT `neon_connection_string` 注入 DATABASE_URL
- **`streamLlmMessage` vs `sendMessage`**：LLM 對話文字用 `streamLlmMessage`（streaming），模板/進度/richContent 用 `sendMessage`。失敗自動降級
- **`identifyMockDataComponents`**：Haiku batch 識別需改寫組件，失敗降級 regex fallback
- **Coder action response field 必須對齊 BDD execution key**：`generateActionFunction` 注入 `<executionKey` + stepSummary + 完整 Feature。不對齊 → VAR-System 連鎖失敗
- **Per-SubOp 生成**：按 When 步驟拆子操作，已知 pattern 走 template（7 個模板），未知走 free-form LLM。**`INLINE_SNAKE_TO_CAMEL`（`_c`）必須內嵌模板**，獨立 function 會被 helper 提取器拔出 → runtime undefined。`CODER_PER_SUBOP=false` 一鍵關閉
- **Code Template Zod schema 必須寬鬆**：`scopeColumn`/`scopeParam` 用 `.optional()`，`entityIdParam` 用 `.default('id')`。否則 LLM 回 null → Zod 拒絕 → template 全掛
- **ScenarioContext VAR 數字後綴**：`get("listId")` 需匹配 `"List1.id"`，fallback 去除末尾數字再 camelCase。否則 `$listId` 不解析 → `invalid input syntax for type uuid`
- **preExtractTestPasswords 引號剝除**：testPasswordMap 的 key 必須剝除引號才能匹配 entity_setup 的 resolveVariable 結果
- **Coder E2E 必須含 backendFiles**：`runCoderE2ETests` 的 code 須含 `result.backendFiles`，否則 Module not found → 500
- **`rewriteComponentForServerActions` maxTokens 32768**：截斷偵測 JSX 平衡，不平衡回退原始組件
- **Prompt Caching**：`buildCacheableSystem()` 拆 system prompt 為 static+dynamic block。5 個服務已套用。**修改 system prompt 時不要把 per-request 內容放進 static block，否則 cache hit 率歸零**
- **Extended Thinking（修復路徑）**：`ENABLE_EXTENDED_THINKING=false`（預設關閉）+ `EXTENDED_THINKING_BUDGET=10000`。只用在 `fixFailingAction()`（coder RED-GREEN cycle）和 `fixMultipleFeatures()`（Feature Alignment Gate）。`callClaude` 和 `callStructured` 都支援 `thinking` 參數，maxTokens 自動加上 budget_tokens。response 解析用 `.find(b => b.type === 'text')` 跳過 thinking blocks（向後相容）。purpose 加 `+thinking` 後綴用於 A/B 比較
- **`ENABLE_DIFF_OUTPUT`**：Animation/RWD/Merged 用 SEARCH/REPLACE block（省 60-70% output token）。解析失敗 fallback full-file。SEARCH 多處匹配拒絕替換。不影響 `generateStructure`（從零生成）
- **`FAST_BUILD_MERGED_ANIM_RWD` 只影響首批**：增量批次仍用分離 Animation + RWD
- **WebContainer preload 後禁止 `mount()`**：用 `writeFilesToContainer()` 逐檔寫入，`mount()` 會清除 node_modules。`restart()` 例外
- **生成期間禁止渲染 WebContainer**：UIUX/Coder 生成期間 early return `AIGenerationWaitingScene`，只有 fast build streaming 即時渲染。`handleUiuxCodeGenerating` 回覆用 `stage: 'uiux_pipeline_progress'`（非 `'info'`）
- **WebContainer 路由衝突去重**：`deduplicateRouteConflicts()` strip route groups 後按真實路徑去重，防 Next.js parallel pages 錯誤
- **WebContainer 增量寫入統一處理**：full/incremental write 都須經 `deduplicateRouteConflicts` + `stripRouteGroups` + `sanitizeFileContent` + `injectEditBridge`，漏掉任一步導致 HMR 不觸發或 build error

## 核心原則

1. **無腦補原則**：嚴格遵守規格，不擅自假設
2. **summary 一致**：Action summary 必須與 Feature 名稱一致
3. **自我修復**：驗證失敗時進入修正迴圈（最多 3 次）
4. **Tellcraft 平台不直連資料庫**：Tellcraft 平台自身前端透過 VPS API 操作資料。Coder Skill 生成的客戶 app 用 Server Actions + Neon 直連，禁止 `accept-data-loss`

## 環境變數

前端（`.env.local`）：`VPS_API_URL`, `NEXT_PUBLIC_VPS_API_URL`, `NEXT_PUBLIC_VPS_WS_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_LIFF_ID`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`

後端（`tellcraft-backend/.env`）：定義在 `lib/env.ts` Zod schema，三層（REQUIRED/OPTIONAL/功能開關）。關鍵：`NEON_API_KEY`、`NEON_DEFAULT_REGION`（預設 aws-ap-southeast-1，注意 aws-ap-northeast-1 已從 Neon 移除）。開關：`ENABLE_PROMPT_CACHING`（預設 true）、`FAST_BUILD_MERGED_ANIM_RWD`（預設 true，品質異常設 false）、`ENABLE_DIFF_OUTPUT`（預設 false，省 60-70% output token）。

