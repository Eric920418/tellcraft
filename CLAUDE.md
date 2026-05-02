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

# Skill Telemetry 週報（人工回灌 prompt 用）
cd tellcraft-backend && pnpm tsx src/scripts/telemetry-weekly-report.ts              # 預設 7 天 markdown（含 delta + 效應追蹤）
cd tellcraft-backend && pnpm tsx src/scripts/telemetry-weekly-report.ts --days=1     # 1 天
cd tellcraft-backend && pnpm tsx src/scripts/telemetry-weekly-report.ts --json       # JSON 輸出

# Prompt Change 註冊（改了 prompt 或加了 code rule 後執行）
cd tellcraft-backend && pnpm tsx src/scripts/register-prompt-change.ts --pattern <key> --skill <name> --action <prompt_fewshot|sanitize_rule|qg_rule> --target <file>
cd tellcraft-backend && pnpm tsx src/scripts/register-prompt-change.ts --list        # 列出活躍的
cd tellcraft-backend && pnpm tsx src/scripts/register-prompt-change.ts --retire <id> # 汰換（畢業）

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
│  tellcraft.com  │  WS     │  ├─ BullMQ Worker + LangGraph（編排）│
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
| **Quality Gate** | `services/quality-gate.ts` | 5 類靜態檢查 + Design Tier 合規 + Rule-based 5 規則修復 + Haiku fallback。**P1 真實 WCAG luminance 對比度**：用 `wcag-contrast` 套件 + `tailwind-color-resolver.ts` 算 ratio，區分 normal 4.5:1 / large 3:1 閾值，per-file cap 3 個 ratio issue 避免 autofix prompt 爆量 |
| **CSS 一致性審計（P0+P4）** | `services/css-consistency-audit.ts` | 統計灰階/圓角/字級/shadow/spacing per-file + global 閾值（per-file ≥4-6 → warning，global ≥6-10 → critical），rule prefix `consistency-*`，category 仍是 code_quality（不擴 QualityCategory）。**P4 跨頁深化**：spacing tokens（p-/m-/gap-/space-x-y，含 arbitrary `[1.5rem]` negative lookahead 防 boundary 失敗）+ button variant fingerprint（{bg,text,padding,rounded,fontWeight} 五元組，跨頁去重，≥6 warning / ≥10 critical 含具體範例 className） |
| **Tailwind 色板解析** | `services/tailwind-color-resolver.ts` | `resolveColor(token)` → HEX，含 24 個 family × 11 階 + arbitrary `bg-[#xxx]` + 透明度後綴剝除；`extractBgAndText` + `isLargeText`；不支援 CSS variable / theme()，回 null 由呼叫端 skip |
| **設計品質報告（P3）** | `services/design-quality-report.ts` | 純函數彙整 QualityReport + ui-evaluator task_failed → 4 維度 0-100 評分（consistency/accessibility/taskExecution/codeQuality）+ overallScore 加權平均（accessibility 35%）+ fixPlan。Feature flag `ENABLE_DESIGN_QUALITY_REPORT` 預設 false |
| **Coder Generation** | `services/coder-generation.ts` | 後端代碼生成：parseActionsYml → generateActionFunction → generateServerActions → identifyMockDataComponents → rewriteComponentForServerActions |
| **Deployer** | `services/deployer.ts` | sanitize → build 驗證 → Vercel 部署 → 回滾（合併 uiux+coder skill_source） |
| **Iteration Skill** | `services/iteration-skill.ts` | 迭代修改 + 撤銷 + 版本回滾（從 orchestrator 抽出） |
| **Fast Build** | `services/fast-build-generation.ts` | 快速模式輔助：tier 偵測、產品推斷、默認 DesignSystem（零 LLM）、surface-1/2/3 色階 |
| **Design Techniques** | `services/design-techniques.ts` | 視覺技法庫（30 個 Layout/Surface/Typography/Interaction 技法），按 tier+productType 加權隨機注入 Structure prompt |
| **Composition Patterns** | `services/composition-patterns.ts` | 20 個 section-level 佈局組合模式（hero/content/data/shell）+ `selectCompositionPatterns()` page-type-aware 選擇 + prompt 注入 |
| **Reference Analyzer** | `services/reference-analyzer.ts` | URL→截圖+DOM/CSS 提取→Haiku Vision 分析，**5 層降級**：vendored_designmd（命中 71 個 brand 短路）→ vision → uploaded_image → metadata_only → text_only。`analyzeUploadedImage` 不走短路（圖片無法對映 brand）。命中 vendored 時（uiux-phases.ts:tryVendoredFastPath）跳過 Brief + Variant 直接進 generateStructure，UI 提示「使用 brand 風格」+ quickReply「我想看其他變體」(__force_variants__) 退路 |
| **Design System Freeze** | `services/design-system-freeze.ts` | Phase A: variant 選定後 freeze hook，計算穩定 hash（SHA256 前 16 字元）+ audit log。`convertVendoredToDesignSystem` 把 awesome-design-md schema lossy 轉成 uiux-generation DesignSystem（synthesize cssVariables / tailwindExtend / 取每色族第一 hex），給 vendored 短路用。FlowState `uiuxDesignSystem` / `uiuxDesignSystemHash` / `uiuxDesignSystemSource` 三欄位串接整條 pipeline |
| **axe-core 整合** | `services/ui-evaluator.ts`（`loadAxeSource` / `runAxeOnPage` / `axeViolationToIssue`）+ `package.json` `axe-core: ^4.11.4` | a11y 工業標準工具整合（Deque 90+ WCAG 規則），補強 Tellcraft 自實作 a11y check 涵蓋率。在 ui-evaluator desktop-light viewport 跑，違反 critical/serious 等級會 fail evaluator。env `ENABLE_AXE_CORE` 預設 true，fail-soft（載入或執行失敗跳過不阻塞）。runOnly tag wcag2a/wcag2aa/wcag21aa（不跑 best-practice 避免誤殺） |
| **可讀性檢查** | `services/ui-evaluator.ts`（`evaluateReadability` / `detectLanguage` / `runReadabilityCheckOnPage`）+ `package.json` `text-readability: ^1.1.1` | 英文 Flesch-Kincaid Grade Level（FKGL ≥ 14 critical / 11-14 warning），中文規則式（Hero >30 字 / CTA >12 字 warning）。在 ui-evaluator desktop-light viewport 跑，補完影片建議的「Readability」維度。env `ENABLE_READABILITY_CHECK` 預設 true |
| **Design Token Compliance** | `services/design-token-compliance.ts` | Phase D: critical 級設計合規檢查。`computeAllowedColorTokens` 用 `findClosestTailwindToken` + `expandColorFamily`（tailwind-color-resolver.ts 新增）展開 DesignSystem 允許色族 → `auditDesignTokenCompliance` 掃代碼色號違反者報 critical。整合進 `quality-gate.ts:runQualityGate` 第 4-5 個參數（designSystem + designTokenOverride）。**強制覆寫**：`state.uiuxDesignTokenOverride=true` 時所有違反降為 warning 不阻塞 — 用戶逃生口，避免被永久卡死。Rule prefix `design-token-*` 不擴 QualityCategory |
| **Design MD Loader / Parser** | `services/design-md-loader.ts` + `services/design-md-parser.ts` + `types/design-system-schema.ts` | 載入 vendored awesome-design-md submodule（71 brand DESIGN.md，~22KB/檔），deterministic regex 解析為 `DesignSystem` Zod schema。70/71 完整覆蓋（colors+typography+components 三維度全抽到），1 個 weak parse（cohere）colors+typography 仍正常。Build-time test 全覆蓋，submodule 沒拉到時 fail-soft |
| **Brand Domain Map** | `services/brand-domain-map.ts` | URL → brandKey（含子域 fallback、雙段 TLD 處理）；自然語言 → brandKey（word boundary 防 metadata 誤觸發 meta；多名稱出現 return null 防比較誤判）。新增品牌兩張表都要補 |
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
| **SpecFormula** | `lib/specformula/`（31 檔） | SDD 驗證引擎：Feature Files → HTTP API → DB 驗證。Coder Stage B 自動驗證 |
| **Job Failure** | `services/job-failure-handler.ts` | BullMQ 最終失敗持久化 + 用戶通知 |
| **Skill Telemetry** | `services/skill-telemetry.ts` + `scripts/telemetry-weekly-report.ts` | 自我強化迴圈 MVP：3 個埋點（deployer sanitize / QG rule-based / iteration refineCode）→ `skill_telemetry` 表 → 週報腳本。Fire-and-forget 寫入，絕不阻塞 pipeline。人工看週報決定哪些 pattern 回灌 prompt，禁止自動回灌 |

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
| **Landing 組件** | `app/components/landing/` | ~1978 | 16 個自包含 Landing Page 組件 |

### LangGraph 編排層（`graph/`，Feature Flag）

BullMQ 的 `handleProcessMessage` + `handleContinueFlow` 是現行生產編排。`graph/` 目錄是基於 `@langchain/langgraph` StateGraph 的並行實作，由 `USE_LANGGRAPH=true` 環境變數啟用（預設 off）。

```
classify → phase_router → skill subgraph（bdd/uiux/fast/coder/deployer/domain/clone）→ END
```

**Pointer State Pattern**：State 只存路由 metadata（~1KB），大資料留在 Redis + PostgreSQL（`getFlowState()`）。`graph/context.ts` 用 singleton 注入 Redis + Socket.io，`graph/checkpointer.ts` 用 PostgresSaver 持久化（`032_langgraph_checkpoints.sql`）。

**注意**：開啟後 LangGraph 接管整個訊息處理（取代 `handleProcessMessage`/`handleContinueFlow`），但 skill subgraph 內部仍呼叫現有 phase handler 函數。新增/修改 phase handler 時需同步更新 `graph/nodes/phase-router.ts` 的路由邏輯。

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
| `telegram-bot.ts` | `/api/telegram/webhook` | Telegram Webhook |
| `domain.ts` | `/api/domain` | 域名 CRUD + DNS + pricing |

前端 Proxy：`app/api/vps/[...path]/route.ts` 將 `/api/vps/*` 轉發到 VPS 後端。

### Locale 路由

前端使用 `app/[locale]/` 多語系路由（zh/en）。`app/hooks/useLocalePath.ts` 處理帶 locale prefix 的路徑跳轉，`app/components/LocaleSwitcher.tsx` 切換語言。LIFF（LINE 內嵌）頁面在 `app/[locale]/liff/page.tsx`。

### 認證系統

`登入頁 → Vercel Proxy → VPS OAuth → JWT Token → localStorage（前端 hook）+ Cookie（middleware）`

### 代碼存儲：project_files 表

`(project_id, skill_source, file_path)` 唯一索引，UPSERT。`skill_source`: uiux/code/merge。Deployer 優先讀此表，fallback `bdd_sessions`。

### 資料庫 Migration（`tellcraft-backend/migrations/`）

共 33 個 migration（`001_initial_schema` ~ `032_langgraph_checkpoints`），檔名自說明。新增 migration 後在 VPS 執行：`psql "$DATABASE_URL" -f tellcraft-backend/migrations/xxx.sql`

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

後端使用 **Vitest**，測試檔案在 `tellcraft-backend/src/__tests__/`（33 個測試檔）：
- 核心服務測試：`intent-helpers.test.ts`（107 條）、`semantic-gateway.test.ts`（56 條）、`deployer-sanitize.test.ts`（41 條）、`log-parser.test.ts`（33 條）
- 設計系統測試：`design-moods.test.ts`、`composition-patterns.test.ts`、`design-system-v2.test.ts`、`prompt-architecture.test.ts`、`uiux-optimization.test.ts`、`design-md-parser.test.ts`（71 brand 全覆蓋 + 邊角格式）、`brand-domain-map.test.ts`、`reference-analyzer-shortcut.test.ts`
- SpecFormula 測試：`specformula/naming-converter.test.ts`、`type-converter.test.ts`、`isa-spec-reader.test.ts`、`entity-ddl-reader.test.ts`、`data-models.test.ts`、`api-spec-reader.test.ts`、`isa-feature-argument-resolver.test.ts`、`scenario-context.test.ts`、`values-equal.test.ts`（9 檔）
- Coder/RED Phase 測試：`coder-generators.test.ts`、`coder-generation-rules.test.ts`、`red-phase-validator.test.ts`、`red-phase-schema-checks.test.ts`、`actions-design.test.ts`、`routing-stub-adapter.test.ts`、`parse-table-primary-keys.test.ts`
- 生成規則測試：`uiux-generation-rules.test.ts`
- 其他：`merge-pages.test.ts`、`search-replace.test.ts`、`reference-analyzer.test.ts`、`schema-derivation.test.ts`、`skill-telemetry.test.ts`、`skill-telemetry-failure.test.ts`、`smoke.test.ts`

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

> **自動化覆蓋標記**：`[CI]` = pre-commit hook 或 CI 靜態檢查守衛（`scripts/pre-commit-checks.sh`）、`[TEST]` = 單元測試覆蓋（見 `__tests__/`）、`[ARCH]` = 無法自動化的架構約束（需人工審查）。未標記 = 尚未轉化。

- `[CI]` **Skill Telemetry 必須 fire-and-forget**：`recordTelemetry` / `recordTelemetryBatch` 的呼叫端一定要接 `.catch(() => {})`。任何 DB 寫入失敗都不能中斷生成 pipeline。禁止在 try/catch 裡 await 後讓異常向上冒。**禁止自動回灌 prompt**：週報產出後人工決定，手改對應 service 的 system prompt，避免炸掉 prompt cache 命中率。migration 編號 `029_add_skill_telemetry.sql`（telemetry 表）+ `030_add_prompt_changes.sql`（回灌註冊表）。**閉環規範（兩層檢查）**：每次改 prompt 或加 code rule 後必須執行 `register-prompt-change.ts` 註冊，否則週報無法追蹤效應。(1) pre-commit hook 偵測 `SANITIZE_PATTERN_MAP` 新增 entry → WARN 印出註冊指令範本（不阻擋 commit）；(2) 週報頂部 `findUnregisteredSanitizePatterns()` 列出 `SANITIZE_PATTERN_MAP` 存在但 `prompt_changes` 無對應 row 的 pattern。Direction A 優先：能寫 regex/code rule 的 pattern 不回灌 prompt
- `[TEST]` **Harness 修復提示注入（`services/error-enrichment.ts`）**：三處修復路徑共用 `enrichError(error, rootCause)`，把已分類的 rootCause 查表得 `harnessHint` 注入 LLM prompt。整合點：`fixFailingAction` 主/Per-SubOp、`red-phase-validator` unexpectedFailures、`feature-alignment-gate` fixMultipleFeatures。`var_resolution`/`auth_check`/`spec_inconsistency` 三類 `skipLlmFix=true`，不走 LLM 修復。新增 `FailureRootCause` 必須同步加 `ROOT_CAUSE_HINTS` 條目，否則 hint 空字串 LLM 收不到方向指引
- `[TEST]` **Coder Handler 按需注入技能索引（PR2）**：13 個 handler SOP 在 `services/coder-handlers/*.md`，透過 `lib/skill-loader.ts` 載入。handler 內容必須以 `\n` 開頭（匹配舊 const 模板字面量首字元），修改後必須跑 `__tests__/skill-loader.test.ts` 的 byte-identity 測試。handler 搬檔後必須跑 snapshot 確認新舊產出相同，否則 prompt cache 命中率歸零。`pnpm build` postbuild 會 copy `.md` 到 `dist/`，skill-loader 也有 src/ fallback 防呆
- `[ARCH]` **UI Evaluator 黑盒 QA（PR1，`services/ui-evaluator.ts`）**：Evaluator 只看 screenshot + DOM outline，**絕不能看到原始 .tsx 代碼**。rubric 在 `services/ui-evaluator-rubric/base.md`，修改必須保留「禁止提到 class 名稱」核心約束。Feature flag `ENABLE_UI_EVALUATOR` 預設 false，staging 先開。整合點：UIUX QG（最多 2 輪 Evaluator + Generator 修復）、Fast Build/Clone QG（1 輪）。Evaluator 失敗必須降級（回傳 `passed: true`），不阻塞 pipeline。**P2 任務模擬擴展**：`deriveTasksFromBdd` Haiku 從 bddBrief 推導 ≤5 個 user-facing task（過濾純後端 action）+ `runTask` puppeteer 執行 find_text/click_text。**page.evaluate 必須用 string callback**，因為 tsconfig `lib: ["ES2022"]` 不含 DOM types，傳 function 會炸（document/HTMLElement undefined）。task results 透過 system prompt dynamic 區注入，不污染 cache
- `[ARCH]` **設計品質四維度（P0~P3，`services/css-consistency-audit.ts` + `tailwind-color-resolver.ts` + `design-quality-report.ts`）**：(P0) 統計 design tokens per-file/global，rule prefix `consistency-*` 不擴 QualityCategory。(P1) `wcag-contrast` + Tailwind 色板表算真實 luminance ratio，per-file cap 3 個 ratio issue 避免 autofix prompt 爆量；arbitrary value `bg-[#xxx]` 支援；CSS variable / theme() 回 null skip；首版**不做 parent inherited bg 追溯**，只看 sibling pair（issue message 標註可能誤報）。(P3) 純函數加權平均（accessibility 35%、consistency/taskExecution 25%、codeQuality 15%），feature flag `ENABLE_DESIGN_QUALITY_REPORT` 預設 false，advisory only 不阻塞，**禁止用報告自動回灌 prompt**（防雷第一條），只能餵 refineCode 改代碼
- `[ARCH]` **進階補強 P4~P6**：(P4) `css-consistency-audit.ts` 補 spacing tokens（spacing regex 結尾用 negative lookahead `(?![a-z0-9])` 而非 `\b`，因為 `]` 後沒有 word boundary）+ button variant fingerprint 跨頁比對。(P5) `ui-evaluator.ts` 在每 route navigate 後跑 `STRUCTURE_PROBE_SCRIPT` string callback 抓內部 `<a href>` + 高 z-index overlay + above-the-fold CTA，跑完 BFS 算 nav depth（首頁 hop=0，>2 報 warning，符合影片「第三層導覽」）+ overlap > 50% 報 critical。`computeNavDepths` / `deriveStructureIssues` 純函數可獨立測試。(P6) `tryParseRefineDiff` helper（`uiux-generation.ts`）+ `parseSearchReplaceBlocks` + `applySearchReplace` 重用，refineCode + autoFixCriticalIssues 走 hybrid 解析：**先試 SR block，全失敗 fallback 完整檔案**；prompt 用 `ENABLE_REFINE_DIFF_OUTPUT` flag（預設 false）切換輸出格式；既有 SR 多處匹配拒絕替換規則保留
- `[ARCH]` **Structured Outputs（`lib/structured-output.ts`）**：JSON 輸出用 `callStructured<T>()` + Zod schema。只適用 JSON 輸出；代碼/Gherkin/YAML/自然語言不能用。`messages.parse()` 與 message prefilling **不相容**。改 schema 會使 prompt cache 失效。Zod v4 `z.record()` 必須傳兩個參數。`formulation.ts`/`coder-generation.ts` 保留 local `callClaude` wrapper 給非 JSON 輸出用
- `[TEST]` **可讀性檢查（2026-05-02）**：補完影片建議的「Readability」維度。`services/ui-evaluator.ts` 內 `runReadabilityCheckOnPage` + `evaluateReadability`：(1) `READABILITY_PROBE_SCRIPT` page.evaluate 抓 `<h1>` / above-the-fold CTA / 第一個 visible `<p>`；(2) `detectLanguage` 用 CJK 字符佔比 > 30% 判斷中英；(3) **英文走 Flesch-Kincaid Grade Level**（`text-readability` 套件 1.1.1）：FKGL ≥ 14 → critical（PhD 難度，3 秒會離開），11-14 → warning（高中以上），< 50 字符 skip（FKGL 失真）；(4) **中文走規則式**（FKGL 不適用 CJK）：Hero > 30 字 / CTA > 12 字 → warning。**不抓抽象詞表**（「賦能」「卓越」等）— 容易誤殺，先看 telemetry 再決定。env `ENABLE_READABILITY_CHECK` 預設 true。**text-readability 套件用 ES default export**：必須 `require('text-readability').default` 取 instance，否則 method 全 undefined。fail-soft：套件失敗或 page.evaluate 失敗返回空陣列不阻塞 evaluator
- `[TEST]` **axe-core 整合 ui-evaluator（2026-05-02）**：a11y 工業標準工具（Deque Systems，覆蓋 90+ WCAG 規則）整合到 `services/ui-evaluator.ts`。**整合位置**：viewport loop 內，desktop-light 跑（避免重複），於 `STRUCTURE_PROBE_SCRIPT` 後執行。**機制**：(1) 啟動時 `loadAxeSource()` 從 `node_modules/axe-core/axe.min.js` 讀檔 cache；(2) 每次 page navigate 後 `page.evaluate(axeSource)` inject；(3) `page.evaluate` 跑 IIFE async 包的 `axe.run({ runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })`（**不跑 best-practice 規則**避免誤殺）；(4) violations 用 `axeViolationToIssue()` 轉成 `UiEvaluationIssue`：axe `critical/serious` → `severity: 'critical'`，axe `moderate/minor/null` → `severity: 'warning'`；category 統一 `'visual_regression'` **保持 enum 純淨**，description 加 `[a11y/<rule-id>]` 前綴讓下游區分。env `ENABLE_AXE_CORE` 預設 true（價值高 + fail-soft，axe 載入或執行失敗自動跳過不阻塞 evaluator）。**page.evaluate 必須用 string callback**（CLAUDE.md 既有防雷）。axe.run 結果只取 id/impact/description/nodes 前 3 個避免 100KB+ payload
- `[ARCH]` **Phase F 風險修正 flag（2026-05-02）**：DesignSystem pipeline 改造的三個保守 flag，**合併後第一週全部保守**：(1) `VENDORED_FAST_PATH=false`：vendored 命中仍走 5 變體（每個變體帶 vendored DESIGN.md 注入 prompt 作為強參考），不啟用 lossy fast path。原因：`convertVendoredToDesignSystem` borderRadius/shadows/animationPersonality 失真，stripe.com 命中後品質下降風險。(2) `DESIGN_TOKEN_SEVERITY=warning`：design-token 違反不阻塞部署，先收集 telemetry。觀察 1 週違反率 < 10% 後手動切 'critical'。(3) Phase C iteration hint 已移除「修改 cssVariables / tailwind.config」（refineCode 修改範圍外的指引），改為 LLM 真能做的「跨頁面 className 替換 + globals.css 變數同步」。**達標分批啟用**：先 `DESIGN_TOKEN_SEVERITY=critical` → 觀察 1 週 → 再 `VENDORED_FAST_PATH=true`。state.uiuxDesignTokenOverride 強制覆寫邏輯保留（critical 時用）
- `[TEST]` **DesignSystem 整條 pipeline 統一消費（Phase A-E，2026-05-02）**：(A) `services/design-system-freeze.ts` 在 variant 選定後算 hash + audit log，FlowState 加 `uiuxDesignSystemHash` / `uiuxDesignSystemSource` / `uiuxDesignTokenOverride` 三欄位。(B.1) `refineCode` 改吃完整 `buildDesignSystemPrompt` 取代 compact 版（修迭代漂移最大破口），prompt 拆 static/dynamic 套 `buildCacheableSystem`。**(B.2) `generateAnimations` / `generateRwd` / `generateAnimationsAndRwd` 三處的 `buildCompactDesignPrompt` 全部升級為 `buildDesignSystemPrompt` 完整版**，避免跨階段不一致（Structure 看完整 / Animation 看精簡 → LLM 在 Animation 寫超出色族，被 D critical 阻塞）— 三處都在 dynamic block，cache 不失效。(B.4) vendored 命中時 `tryVendoredFastPath` 在 `completeDesignClarify` 後跳過 Brief + Variant 直接進代碼生成；用戶可按 `__force_variants__` 退回；轉型 lossy（`convertVendoredToDesignSystem`），synthesize cssVariables。fast-build 也支援從 `referenceAnalysis.designSystem` 抽出主色（`colorPalette` 不存在時的 fallback）。(C) `iteration-intent.ts` 加 `tier: 'design-system-token' | 'code-override' | 'mixed'`，`iteration-skill.ts` 注入對應 LLM hint + telemetry（`tier:X:scope:Y` patternKey）— **保守版**：未做 big-bang regen，僅注入 hint。(D) `quality-gate.ts:runQualityGate(...,designSystem,designTokenOverride)` 整合 `design-token-compliance.ts`，hard critical 阻塞部署 + 強制覆寫降級為 warning。**配套**：B.2 + Animation/RWD 用完整 DS prompt 後，design-token 違反率才會穩定 < 10%（之前 compact 版會誤觸發）。(E) `migrations/036_add_design_system_snapshot.sql` 加 `generations.design_system_snapshot/hash` 欄位，`snapshotCodeToGeneration` 寫入；rollback 還原邏輯為 follow-up（deployment ↔ generation row 對應需更多探索）。**LLM 成本影響**：refineCode 從無 cache → 有 cache（淨節省 60-70% 同會話迭代成本）；Animation/RWD dynamic block 多 ~700 字（cache 不失效，input token 微增）；vendored 短路命中時省 puppeteer + Vision 約 10K tokens — 整體**成本下降**，不是上升
- `[TEST]` **awesome-design-md 短路（vendored brand fast path）**：`tellcraft-backend/external/awesome-design-md/` 是 git submodule（71 個 brand DESIGN.md，~22KB/檔，MIT），由 `services/design-md-loader.ts` 啟動時 eager 載入並 parse 為 `DesignSystem` schema，cache in-memory。`analyzeReference` 入口先試 `lookupBrandByDomain(url)` + `inferBrandFromText(input)` 命中時返回 `analysisSource: 'vendored_designmd'`，跳過 puppeteer + Vision（節省 5-8s + 10K tokens）。**新增品牌時必改三處**：(1) git submodule 拉新 + `pnpm build` 把新 DESIGN.md copy 進 dist；(2) `brand-domain-map.ts` `DOMAIN_TO_BRAND` 加 entry；(3) `TEXT_ALIAS_TO_BRAND` 加 entry（避免 "meta"/"together"/"x" 等常見英文詞誤觸發 — 多 alias 命中時 `inferBrandFromText` return null）。**部署 checklist**：VPS 上 `git pull --recurse-submodules` + `git submodule update --init`（已加進 deploy-vps.yml）。**Vercel 不需要這份資源** — `.vercelignore` 排除 `tellcraft-backend/external/`。Submodule 沒拉到時 `loadDesignMdParsed` return null → 短路降級回原 puppeteer 路徑（fail-soft）。**Phase B 重構**（callStructured Vision 路徑強制 DesignSystem schema 輸出）尚未實裝，`analysisSource: 'vision'` 仍走 free-form text，未來引入時用 `REFERENCE_ANALYZER_STRUCTURED` env flag 漸進 rollout
- **handleProcessMessage 轉發到 handleContinueFlow 時必須帶 `skipPrefilterAndCredit: true`**：否則 prefilter + credit deduction 會執行兩次（雙重扣款）。只有 BullMQ `continue-flow` job 直接呼叫 `handleContinueFlow` 時才不帶此旗標
- **生成中 phase 孤兒偵測三層**：(1) conv-lock 不存在+60s→恢復 (2) lock 存在但 startedAt>5min+無心跳→過期恢復 (3) 20min 超時。新增生成中 phase 必須考慮這三層
- **`generateStructure` 的 `onCheckpoint` callback**：在 multi-pass 批次完成、syntax fix 後、reference repair 後三處觸發。呼叫端必須傳入 checkpoint callback 將中途代碼存入 FlowState，防止進程崩潰遺失串流中代碼
- **新增 phase 必須五處同步**：`handleContinueFlow` 路由（含超時偵測）+ `FlowState` 型別 + `flowstate-recovery.ts` RECOVERABLE_PHASES + 前端 `richContent.type` union + `graph/nodes/phase-router.ts` 路由（LangGraph 啟用時）
- **Layout 禁止 opacity:0**：SplitLayout/split-layout 外層不能用 `initial={{ opacity: 0 }}`（多層疊加→黑屏）。useEffect 依賴不含 `fastBuildChunks`。split→default 回退需檢查 code_preview 歷史
- **動畫庫是 `framer-motion`**（v12+），import 用 `from 'framer-motion'`
- `[CI]` **字體只能用 `next/font`**，禁止 `<link>` / `@import` Google Fonts
- `[TEST]` **next/font `axes` 只能用於 variable font**：LLM 容易把 `axes: [...]` 加到 Playfair Display / Lora / Merriweather / Instrument Serif / Libre Baskerville / Cormorant Garamond / DM Serif Display / Cabin / Crimson Pro / Cormorant / Gentium Book Plus 等非 variable font 上 → build 報 "Axes can only be defined for variable fonts"。`sanitizeCodeForDeploy` Fix 4.5 以黑名單 regex 移除。新增誤傷字體時從 `NON_VARIABLE_FONTS` 陣列移除；發現新的非 variable font 受害時加入
- `[CI]` **Tailwind v4**：用 `@import "tailwindcss"`，不是 v3 的 `@tailwind`
- `[TEST]` **Tailwind config 禁止 CSS 變數引用**：`generateTailwindConfig()` 必須用硬編碼值（`'9999px'` 非 `'var(--radius-full)'`），否則部署後 CSS 變數可能遺失導致樣式失效
- **`app/components/templates/` 已廢棄**，PreviewPanel 用 WebContainers 渲染
- `[ARCH]` **deployer_complete 路由順序**：部署 → 回滾 → 域名 → 問候攔截 → semanticGateway → 迭代修改
- **complete/failed 問候攔截**：三處 `semanticGateway` 前插入 `isGreetingOrChitchat()` 零 LLM 攔截。`__new_project__` 在 `handleContinueFlow` 入口處理
- `[TEST]` **迭代輸入四層防禦**：prefilter → detectFastModeIntent（`platform_issue` 回覆操作指引）→ semanticGateway iteration → refineCode [NO_CHANGE]。**ITER_DESIGN_SIGNALS 必須含錯誤修復詞**（'修復'/'error'/'bug'），否則貼錯誤訊息被 quickFilter 拒絕
- **`checkBuildRelevance` fail-closed**：API 錯誤/空回應/catch 全部拒絕（非放行），無 API key 時 fail-open
- **輸入品質閘門**：`checkInputQuality()` 全域攔截 + `getPhaseStrictness()` phase-aware 二次攔截。Redis anti-loop 連續 3 次強制放行防卡死
- `[ARCH]` **參考網站分析**：puppeteer-core 需系統 Chromium（VPS `apt install chromium-browser`）。SSRF 防護禁 localhost/內網 IP。DOM 提取失敗不影響截圖（獨立 try-catch），降級純 Vision。四個注入點統一用 `formatStructuredDataForPrompt()`
- **上傳圖片參考**：`analyzeUploadedImage` 只存文字結果不存 Buffer。`completeDesignClarify` 並行分析圖片+URL，合併 visionAnalysis。imageUrls 管道：`handleProcessMessage` → `handleContinueFlow` → `routePhase` → phase handler
- `[ARCH]` **Mood/tier/techniques/patterns 互補**：mood=視覺方向，tier=技術限制，techniques=element-level，patterns=section-level。Mood 優先級：`variantConcept` > `mood` > `tier`。patterns 不含動畫
- `[ARCH]` **文檔與實作同步**：改後端流程 → 同步更新 `uiux-skill/instructions/` + 此文件
- **`handleCodePhaseRedo` 需要快照**：`uiuxStructureCode`/`uiuxAnimationCode`，否則 redo 在已修改代碼上重做
- **`verifyBuildLocally` 的修復結果必須同步回 DB**：否則預覽和部署代碼分岔
- `[TEST]` **部署五層防禦**：L1 generateStructure 後驗證引用 → L2 sanitizeCodeForDeploy stub 生成 + `??` 與 `||/&&` 混用自動加括號 + root layout html/body 自動補全 + 非 variable font 移除 axes → L3 fixBuildErrors API 重試 → L4 build 循環 3+1 次 → L5 useSearchParams Suspense 拆分
- `[TEST]` **預覽零錯誤三層防禦**：客戶預覽絕對看不到 build / runtime error 的架構保證。(1) **Preview Gate**（`services/preview-gate.ts`）：`makeStreamingCallback` 寫 Redis 前跑 esbuild 批次驗證，壞代碼不推送，emit `preview_stale`；(2) **Last Known Good (LKG)**（`project_files` 新三欄 validation_status/last_validated_at/last_validated_content via migration 034）：`upsertProjectFiles` 接 `validationStatus: 'passed' | 'failed' | 'unknown'`，passed 同步寫 last_validated_content，failed **保留舊 LKG 永不被覆蓋**；前端 polling 在 `isGenerating && !streamingPreview` 時拿 LKG 顯示上一版 + 「AI 正在優化」overlay；(3) **Health Beacon** Edit Bridge 每 2s postMessage `tc_health`，父層 5s 沒收到觸發 `iframe_frozen` overlay 兜住 HMR race / 白屏。三層互補可達 ~99.99%。**不保證 100%**（WebContainer 崩潰等極端 case 屬「產品功能壞了」，不同維度）。禁止自動回灌 prompt
- `[CI]` **Anthropic 模型 ID**：一律用 `claude-sonnet-4-6`（不加日期後綴），`claude-sonnet-4-6-20250514` 不存在會 404。全 codebase 用 `semantic-gateway.ts` 定義的常數而非手打
- **Anthropic SDK v0.72+**：大 `max_tokens` 必須用 `messages.stream()` + `await stream.finalMessage()`
- **Skill 函數提前 return 必須保存 FlowState**：否則 `handleContinueFlow` 找不到 state → 用戶對話永久卡死
- **Formulation phase**：必須設 `formulationStartedAt`（超時恢復依賴）。checkpoint 每 3 feature 保存，成功後清理所有 `formulation*` 暫存欄位
- **DB 連線池**：`max: 20`（預設）+ `keepAlive: true`，防止 PostgreSQL 斷開空閒連線。可用 `DB_POOL_MAX` 環境變數覆蓋
- **Feature 驗證腳本用 `tsx` 不是 `ts-node`**：`feature-validation.ts` 的 `runScript()` 用 `npx tsx`。腳本解析失敗時視為通過（不觸發無效 LLM 修復循環），stderr/exitCode 會完整記錄供除錯
- **Feature Dry-Run**：spec_completed 前用真實 Neon DB 跑 entity_setup 驗證。失敗 LLM 修復（2 輪）。跳過 api_call/response_validate
- **Feature Alignment Gate**：RED Phase 後、Coder 前執行。修不好**阻塞 pipeline**（回退 `uiux_complete`），不像 RED Phase 的 advisory 模式。修復後自動更新 DB `bdd_sessions.features_content`
- **RED Phase 三層驗證**：L1 靜態（12 個零 LLM 檢查，含 Schema DataTable 深度對齊）、L2 Stub 全場景（StubHttpAdapter 回 501）、L2.5 Routing（RoutingStubAdapter in-process Express）。**Check 12**：偵測 WHEN call table headers 誤用 `>/<` 前綴（正確為 `id`/`$variable`）。L2/L2.5 需 `open_api_spec_content` + `isa_config_content` + `neon_connection_string`，缺則跳過。三層都不阻塞
- `[TEST]` **SpecFormula JSONB 比較**：`valuesEqual()` 支援 JSON 深度比較（string ↔ JS array/object）。`resolveValue()` 支援 `<executionKey`
- **Stage B 回歸修復**：Phase 2 最多 2 輪，scenario-level 智能跳過（集合不變則停），crash 不重試
- **`_stepSummary` dispatch 用 `===`**：非 `op.includes()`，消除子字串碰撞。`parseActionBranches` 向後相容兩種格式
- **Slot extraction 重試**：失敗後注入錯誤訊息做第二次嘗試，減少 fallback 到 free-form LLM
- `[TEST]` **Schema-aware `deleted_at`**：`softDeleteColumn` 為 `.optional()`，Schema 沒有此欄位不生成 `AND deleted_at IS NULL`
- `[TEST]` **錯誤根因分類器**：`classifyFailureRootCause()` 零 LLM 8 類。`var_resolution` 跳過代碼修復；`auth_check` 直接 `removeAuthChecks()`
- **雙層完成驗證**：`coderTestPassed` 區分 quickReplies（全通過→部署，有失敗→重試+帶風險部署）。`__deploy_with_risk__` 需二次確認，`deployedWithFailingTests=true` 寫入 FlowState
- **Neon provisioning 同步（< 10s）**：失敗不阻塞。Deployer 直接 SELECT `neon_connection_string` 注入 DATABASE_URL
- **`streamLlmMessage` vs `sendMessage`**：LLM 對話文字用 `streamLlmMessage`（streaming），模板/進度/richContent 用 `sendMessage`。失敗自動降級
- **`identifyMockDataComponents`**：Haiku batch 識別需改寫組件，失敗降級 regex fallback
- **Coder action response field 必須對齊 BDD execution key**：`generateActionFunction` 注入 `<executionKey` + stepSummary + 完整 Feature。不對齊 → VAR-System 連鎖失敗
- **Per-SubOp 生成**：按 When 步驟拆子操作，已知 pattern 走 template（7 個模板），未知走 free-form LLM。**`INLINE_SNAKE_TO_CAMEL`（`_c`）必須內嵌模板**，獨立 function 會被 helper 提取器拔出 → runtime undefined。`CODER_PER_SUBOP=false` 一鍵關閉
- **Code Template Zod schema 必須寬鬆**：`scopeColumn`/`scopeParam` 用 `.optional()`，`entityIdParam` 用 `.default('id')`。否則 LLM 回 null → Zod 拒絕 → template 全掛
- `[TEST]` **ScenarioContext VAR 數字後綴**：`get("listId")` 需匹配 `"List1.id"`，fallback 去除末尾數字再 camelCase。否則 `$listId` 不解析 → `invalid input syntax for type uuid`
- **preExtractTestPasswords 引號剝除**：testPasswordMap 的 key 必須剝除引號才能匹配 entity_setup 的 resolveVariable 結果
- **Coder E2E 必須含 backendFiles**：`runCoderE2ETests` 的 code 須含 `result.backendFiles`，否則 Module not found → 500
- **`rewriteComponentForServerActions` maxTokens 32768**：截斷偵測 JSX 平衡，不平衡回退原始組件
- `[ARCH]` **Prompt Caching**：`buildCacheableSystem()` 拆 system prompt 為 static+dynamic block。5 個服務已套用。**修改 system prompt 時不要把 per-request 內容放進 static block，否則 cache hit 率歸零**
- `[ARCH]` **Neon schema 變更必須保留客戶資料（L21.CRIT-1）**：`provisionNeonDatabase` 預設 `allowDestructiveReprovision=false` — 偵測舊 project 含非空 user table 時**拒絕** drop，回 null + 顯示警告。原因：Coder Skill 生成的客戶 app 用 Neon DB 存**客戶真實資料**，改 schema 絕不能靜默刪除。若要覆寫（丟棄舊資料重建），呼叫端必須明確傳 `allowDestructiveReprovision: true`（future：配合前端 opt-in 按鈕）。`hasNonEmptyUserTables` 用 `SELECT EXISTS (SELECT 1 FROM t LIMIT 1)` 逐表掃，fail-open（查詢失敗視為無資料不誤擋）。呼叫點：`ensureNeonSchemaFresh` L20.C re-provision 繼承預設保守策略，除非呼叫端明確允許
- **Extended Thinking（修復路徑）**：`ENABLE_EXTENDED_THINKING=false`（預設關閉）+ `EXTENDED_THINKING_BUDGET=10000`。只用在 `fixFailingAction()`（coder RED-GREEN cycle）和 `fixMultipleFeatures()`（Feature Alignment Gate）。`callClaude` 和 `callStructured` 都支援 `thinking` 參數，maxTokens 自動加上 budget_tokens。response 解析用 `.find(b => b.type === 'text')` 跳過 thinking blocks（向後相容）。purpose 加 `+thinking` 後綴用於 A/B 比較
- **`ENABLE_DIFF_OUTPUT`**：Animation/RWD/Merged 用 SEARCH/REPLACE block（省 60-70% output token）。解析失敗 fallback full-file。SEARCH 多處匹配拒絕替換。不影響 `generateStructure`（從零生成）
- **`FAST_BUILD_MERGED_ANIM_RWD` 只影響首批**：增量批次仍用分離 Animation + RWD
- `[CI]` **WebContainer preload 後禁止 `mount()`**：用 `writeFilesToContainer()` 逐檔寫入，`mount()` 會清除 node_modules。`restart()` 例外
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

後端（`tellcraft-backend/.env`）：定義在 `lib/env.ts` Zod schema，三層（REQUIRED/OPTIONAL/功能開關）。關鍵：`NEON_API_KEY`、`NEON_DEFAULT_REGION`（預設 aws-ap-southeast-1，注意 aws-ap-northeast-1 已從 Neon 移除）。開關：`ENABLE_PROMPT_CACHING`（預設 true）、`FAST_BUILD_MERGED_ANIM_RWD`（預設 true，品質異常設 false）、`ENABLE_DIFF_OUTPUT`（預設 false，省 60-70% output token）、`USE_LANGGRAPH`（預設 false，啟用 LangGraph StateGraph 編排取代 BullMQ handleProcessMessage/handleContinueFlow）。

