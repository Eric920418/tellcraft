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
git pull && pnpm build && pm2 restart tellcraft-backend

# VPS 除錯（SSH）
pm2 logs tellcraft-backend --lines 100   # 查看即時日誌
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
| **Orchestrator** | `workers/orchestrator.ts`（~480 行） | BullMQ Worker setup + handleProcessMessage + slim handleContinueFlow |
| **Phase Router** | `workers/phase-router.ts`（~380 行） | Phase 路由分派 + deployer_failed/complete 子路由 + handlePhaseError |
| **Intent Helpers** | `workers/intent-helpers.ts`（~286 行） | 意圖判斷 helper（hasDeployIntent 等）+ 常數（PHASE_BACKTRACK_MAP 等） |
| **BDD Phases** | `workers/phase-handlers/bdd-phases.ts`（~3000 行） | BDD 全流程：ES/Discovery/Clarify/Formulation/Spec |
| **UIUX Phases** | `workers/phase-handlers/uiux-phases.ts`（~2420 行） | UIUX 全流程：Discovery/Brief/Variant/CodePipeline/Mixed routing |
| **Deploy Phases** | `workers/phase-handlers/deploy-phases.ts`（~240 行） | 部署執行：prepareDeployment + executeDeployment |
| **Fast Build Phases** | `workers/phase-handlers/fast-build-phases.ts`（~480 行） | 快速建站：增量交互式生成（executeFastBuildSkill + runFastBuildPipeline + mergeGeneratedCode） |
| **Clone Phases** | `workers/phase-handlers/clone-phases.ts`（~380 行） | 網站復刻三模式：hybridCloneFlow（URL+可選圖片參考）/ imageOnlyCloneFlow（純截圖→逐圖生成 page）→ inline QG → uiux_complete。統一 transitionToFailed → clone_failed phase |
| **Web Clone Service** | `services/web-clone-service.ts` | Clone 核心：增強版 DOM/CSS 提取（CLONE_EXTRACTION_SCRIPT）、section 切割、逐 section Sonnet Vision 生成（generateSectionCode+referenceHint）、代碼合併（assembleSections）+ 圖片模式：analyzeCloneImages（Haiku Vision 分析）、generatePageFromImage（Sonnet Vision 整頁生成）、assembleImagePages（多頁組裝）、mergeImageDesignSystems |
| **Coder Phases** | `workers/phase-handlers/coder-phases.ts`（~490 行） | Coder Skill：讀 BDD 產出 → RED Phase（靜態 + Stub 全場景）→ executeCoderPipeline → 保存 project_files(coder) → 合併代碼 + executeCoderTesting（GREEN Phase 紅綠燈） |
| **Feature Alignment Gate** | `services/feature-alignment-gate.ts`（~500 行） | 阻斷式 Feature 品質閘門：6 項深度對齊檢查（Summary 唯一性/Column Coverage/FK Reference/Response Field 命名/VAR-System/Summary↔actionsYml）+ LLM 自動修復（2 輪），修不好阻塞 pipeline |
| **Syntax Validator** | `services/syntax-validator.ts`（~180 行） | 共用 esbuild TSX 語法驗證 + Haiku LLM 修復。被 coder-generation（組件改寫）和 uiux-generation（迭代 refineCode）共用 |
| **RED Phase Validator** | `services/red-phase-validator.ts`（~1050 行） | SDD RED Phase 三層驗證：Layer 1 靜態規格檢查（11 個零 LLM 檢查，~2ms，含 Schema DataTable 深度對齊）+ Layer 2 StubHttpAdapter 全場景驗證（~1-2s）+ Layer 2.5 RoutingStubAdapter 路由匹配驗證（in-process Express，~1-2s）|
| **StubHttpAdapter** | `lib/specformula/http/stub-adapter.ts`（~20 行） | RED Phase Layer 2 用的 HTTP stub，所有路由回 501 |
| **RoutingStubAdapter** | `lib/specformula/http/routing-stub-adapter.ts`（~65 行） | RED Phase Layer 2.5 用的路由感知 stub，in-process Express 真實路由匹配（匹配→501，不匹配→404），透過 SupertestAdapter 做 in-process HTTP 測試 |
| **Domain Phases** | `workers/phase-handlers/domain-phases.ts` | 域名全流程：搜尋/確認購買/註冊/自有域名設定/DNS 驗證/完成/失敗 |
| **Orchestrator Utils** | `workers/orchestrator-utils.ts` | 共用基礎設施：sendMessage/streamLlmMessage/saveFlowState/getFlowState 等 |
| **FlowState 型別** | `types/flow-state.ts` | FlowState 介面 + 子型別（避免循環 import） |
| **Classifier** | `services/classifier.ts` | 三層防禦：Prefilter → Meta Intent → Skill 分類 |
| **UIUX Generation** | `services/uiux-generation.ts` | 設計生成核心（Brief/Variants/Structure/Animation/RWD/Refine） |
| **Quality Gate** | `services/quality-gate.ts` | A11y/Performance/CodeQuality 靜態檢查 + LLM 自動修復 |
| **Coder Generation** | `services/coder-generation.ts`（~800 行） | 後端代碼生成核心：parseActionsYml → generateActionFunction(LLM，Handler 化 prompt + BDD Feature 全文注入 + execution key 注入 + stepSummary 注入) → generateServerActions(零LLM) → identifyMockDataComponents(Haiku LLM batch 識別 + regex fallback) → rewriteComponentForServerActions(LLM，截斷偵測回退，maxTokens 64000) → validateActionResponses(零LLM post-generation 修復) |
| **Deployer** | `services/deployer.ts` | sanitize → build 驗證 → Vercel 部署 → 回滾（合併 uiux+coder skill_source） |
| **Iteration Skill** | `services/iteration-skill.ts` | 迭代修改 + 撤銷 + 版本回滾（從 orchestrator 抽出） |
| **Fast Build** | `services/fast-build-generation.ts` | 快速模式輔助：tier 偵測、產品推斷、默認 DesignSystem（零 LLM）、surface-1/2/3 色階 |
| **Design Techniques** | `services/design-techniques.ts` | 視覺技法庫（30 個 Layout/Surface/Typography/Interaction 技法），按 tier+productType 加權隨機注入 Structure prompt |
| **Composition Patterns** | `services/composition-patterns.ts` | 20 個 section-level 佈局組合模式（hero/content/data/shell）+ `selectCompositionPatterns()` page-type-aware 選擇 + prompt 注入 |
| **Reference Analyzer** | `services/reference-analyzer.ts` | 參考網站真實分析：URL→截圖+DOM/CSS結構化提取(puppeteer-core)→Haiku Vision（注入精確色板/字體/佈局數據）→設計風格分析，四層降級（vision+structured → vision → structured_only → metadata_only → text_only）+ `analyzeUploadedImage` 上傳圖片 Vision 分析 + `formatStructuredDataForPrompt()` 結構化數據注入生成 prompt |
| **Template Matcher** | `services/template-matcher.ts` | 三層評分智能匹配（關鍵詞 40 + Category 30 + UISpec 30，零 LLM） |
| **Design Moods** | `services/design-moods.ts` | 8 個設計情緒預設 + `recommendMoods()` 規則推薦（feeling 50 + productType 30 + tier 過濾）+ prompt 注入 getter |
| **Semantic Gateway** | `services/semantic-gateway.ts` | 統一語義閘門：quickFilter 零 LLM 短路 + Sonnet 六元 verdict（bdd_clarify/design_clarify/iteration），取代 keyword array |
| **Customer Service** | `services/customer-service.ts` | 客服問答：detectFastModeIntent 意圖分類（greeting/question/chitchat/help/platform_issue）+ FAQ 零 LLM 匹配（9 主題）+ answerWithSonnet 開放問答 |
| **Prefilter** | `services/prefilter.ts` | 全域輸入預過濾：checkInputQuality 亂碼/髒話/垃圾 + phase-aware 二次攔截（getPhaseStrictness）+ Redis anti-loop |
| **Domain Service** | `services/domain-service.ts` | 域名 API 封裝（Porkbun 註冊 + Cloudflare DNS + Vercel 綁定 + RDAP 查詢）+ 購買/自有域名工作流 + 反向補償 rollback |
| **Neon Service** | `services/neon-service.ts` | Neon API 客戶端：同步建立 Neon PostgreSQL DB + 套用 BDD Schema，< 10s |
| **Schema Derivation** | `services/schema-derivation.ts` | BDD schemaSql → Neon PostgreSQL DDL（零 LLM，規則式轉換：ID→UUID、COMMENT 語法、RLS、created_at） |
| **FlowState Recovery** | `services/flowstate-recovery.ts` | 每 2 分鐘掃描 Redis flow:* key，逾時 phase 自動恢復（prd_discovery 5m / fast_generating 20m / uiux_iterating 5m / coder_generating 15m / deployer_deploying 10m / domain_searching 3m / domain_registering 10m / domain_dns_verifying 5m）|
| **Conversation Lock** | `services/conversation-lock.ts` | Redis SET NX EX 互斥鎖（TTL 5 分鐘），同一對話同時只允許一個 Worker job 執行 |
| **LINE Notify** | `services/line-notify.ts` | LINE 推播通知（stage 白名單過濾，fire-and-forget） |
| **LINE Bot Handler** | `services/line-bot-handler.ts` | LINE Bot 業務邏輯（Follow/Text/Postback 處理） |
| **LINE Message Translator** | `services/line-message-translator.ts` | sendMessage → LINE Messages 全量翻譯 |
| **LINE Full Push** | `services/line-full-push.ts` | LINE 來源對話的全量翻譯推送 |
| **Env** | `lib/env.ts` | Zod 環境變數驗證，啟動時快速失敗 |
| **Anthropic** | `lib/anthropic.ts` | 統一 Client 單例 + MODEL 常數（SONNET/HAIKU） |
| **Validate** | `middleware/validate.ts` | Zod 請求驗證中間件（validateBody/Query/Params） |
| **Schemas** | `schemas/*.ts` | API 路由 Zod schema 定義（conversation/session/operations/bdd/project/domain） |
| **Telegram Notify** | `services/telegram-notify.ts` | Telegram 里程碑推播通知（stage 白名單，非 Bot 對話才推） |
| **Telegram Bot Handler** | `services/telegram-bot-handler.ts` | Telegram Bot 業務邏輯（/start/文字/Callback Query） |
| **Telegram Full Push** | `services/telegram-full-push.ts` | Telegram Bot 全量翻譯推送 |
| **SpecFormula** | `lib/specformula/`（27 檔 ~3800 行） | SDD 核心驗證引擎（TS 移植自 Java）：讀 Feature Files → 打 HTTP API → 查 DB 驗證狀態。Coder Stage B 用此自動驗證生成的 API Routes |
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
| **WebContainer 預覽** | `app/lib/webcontainer-utils.ts` + `app/components/uiux/WebContainerPreview.tsx` + `app/hooks/useWebContainer.ts` + `app/hooks/useWebContainerPreloader.ts` | | 預覽核心，WebContainers 跑完整 Node.js + Next.js dev server（支援 Server Actions + DB）。`useWebContainerPreloader` 在生成期間 pre-boot + pre-install BASE_DEPS，`writeFilesToContainer` 逐檔寫入避免 mount() 清除 node_modules |
| **Fast Build 動畫** | `app/components/FastBuildPlayer.tsx` + `app/components/remotion/fast-build/` | | Remotion + @remotion/three 3D 工廠流水線動畫（Structure/Animation/RWD 三站）|
| **3D 蓋房子** | `app/components/building-scene/` + `app/components/remotion/building-scene/` | | Remotion + @remotion/three 低多邊形 3D 場景（BDD Q&A 視覺回饋）|
| **Landing 組件** | `app/components/landing/` | ~1978 | 15 個自包含 Landing Page 組件 |

### Skill 系統

| Skill | 用途 |
|-------|------|
| `bdd-spec` | 需求釐清 + BDD 規格產出（5 階段：Discovery → Clarify → Formulation → Actions Design → ISA Config）|
| `uiux` | 前端介面設計（3 階段：Design Discovery → Design Lab → Implementation）|
| `quality-gate` | UIUX RWD 完成後**自動觸發**，critical 問題 LLM 自動修復（最多 3 輪）|
| `coder` | 後端代碼生成（Stage A）：BDD actionsYml → lib/actions/*.ts(LLM) + app/actions/*.ts(零LLM) + 改寫 UIUX 組件 mock→Server Action（`uiux_complete` 時「接上資料庫」quickReply 觸發，需有 BDD + Neon DB）|
| `deployer` | UIUX+Coder 代碼 → Next.js → Vercel 部署（用戶說「部署」觸發） |
| `iteration` | 迭代修改 + 撤銷上一步 + 版本回滾（`uiux_complete`/`deployer_complete` 自動路由） |
| `fast-build` | 快速建站：一句話 → 跳過 BDD/Discovery → inferInteractionHint → 增量生成（首頁先預覽 → 用戶確認 → 剩餘頁面）→ 靜態 QG → Preview |
| `domain-manager` | 域名管理：列出已有域名 / 引導購買或綁定（付費會員限定） |
| `domain-purchase` | 域名購買：RDAP 查詢可用性 → 確認 → Porkbun 註冊 → Cloudflare DNS → Vercel 綁定（付費會員限定，配額 creator:1/pro:2/business:3） |
| `domain-dns` | 自有域名綁定：顯示 DNS 設定說明 → 用戶確認 → 驗證 DNS 傳播 → 完成（付費會員限定，共用域名配額） |
| `db-provision` | BDD 完成後自動建 Neon DB + 套用 Schema（同步 < 10s，無 Redis）（付費會員限定，creator:1/pro:3/business:5） |
| `clone` | 網站復刻（三種模式）：**URL 模式**（Puppeteer DOM/CSS 提取→逐 section Sonnet Vision 生成）/ **圖片模式**（最多 5 張截圖→Haiku 分析→逐圖 Sonnet Vision 生成完整 page）/ **混合模式**（URL+圖片參考注入）→ inline QG → `uiux_complete`（複用迭代/部署/回滾）。`clone_failed` phase 統一錯誤處理+重試。`web-clone-service.ts` + `clone-phases.ts` |

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

- **單頁深度模式**：inferPages/mergePages/suggestedPages 三層限制只返回 1 頁。Structure prompt 指引 5-8 個完整 Section + anchor link 導航。expandBriefPrompt 引導豐富內容規劃。token 全部集中在首頁品質上
- **效能優化**：Structure prompt 快速模式使用精簡版 techniques（2 個 name+codeHint）+ 精簡版 mood code（3 行 className）+ 精選 1 個 pattern + 精簡版 craft/constraints/baseRules。Prompt caching（`ENABLE_PROMPT_CACHING`）將 system prompt 拆分 static/dynamic block，跨 flow 重用 static 部分省 90% input token。`FAST_BUILD_MERGED_ANIM_RWD` 合併 Animation+RWD 為單次 Sonnet 呼叫（3→2 次）
- **增量交互式生成**（>4 頁時才觸發，目前預設不會觸發）：`executeFastBuildSkill` 設定 `fastBuildAllPages` → `runFastBuildPipeline` 跑第 1 批 → 有剩餘頁面時暫停 → 用戶按「繼續生成」跑第 2 批 → `mergeGeneratedCode` 合併 → 完成
- **FlowState 增量欄位**：`fastBuildStage`（generating/awaiting_continue/complete）、`fastBuildAllPages`、`fastBuildCompletedPages`、`fastBuildCurrentBatchIndex`
- **`mergeGeneratedCode()`**：按 path 去重合併（新批次覆蓋同路徑），styles 保留首批
- **`buildExistingComponentSummary()`**：構建已有組件路徑列表注入 `productContext.existingComponentSummary` → `generateStructure` 的 `buildUserMsg` 告訴 LLM 不要重新生成
- **Haiku 概念生成**：`generateFastConcept()` 生成 `FastConcept`（name/vibe/signatureElement/keyFeatures/suggestedTier），轉換為 `VariantConcept` 注入三階段 prompt
- **Tier 智能修正**：Haiku suggestedTier 與規則不一致時覆蓋 tier + 重建 designSystem
- **Design Tier**：`functional`（dashboard/SaaS，禁漸層/glow）vs `creative`（landing page，允許大膽設計）
- **串流預覽**：生成時 Socket.io `preview_update` 即時推送，前端 WebContainer `fs.writeFile()` → Next.js HMR 自動刷新
- **Variant 概念**：`VariantConcept` 注入所有生成 prompt，確保創意方向一致
- **失敗重試**：`__retry_fast_build__` quickReply，handleContinueFlow 攔截用 `fastModeOriginalMessage` 重新生成
- **手機預覽**：< 768px 顯示全屏 WebContainerPreview Modal（含裝置切換/部署/修改按鈕）。`onCodePreviewData` callback 在手機版收到 code_preview 時自動 `setShowMobilePreview(true)`，不需用戶手動點按鈕
- **進度預估**：每階段推送 `estimatedSecondsRemaining`（240→120→60），前端顯示 `~X min`

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

| 路由檔案 | 掛載路徑 | 核心端點 |
|----------|----------|----------|
| `conversation.ts` | `/api/conversations` | `POST /:id/message`（發訊息）、`POST /:id/reply`（回覆）、`GET /:id/messages` |
| `project.ts` | `/api/projects` | CRUD + `GET /:id/files`（代碼檔案）+ `GET /:id/versions` + `POST /:id/iterate` |
| `session.ts` | `/api/session` | `POST /initialize`（建立對話）、`GET /conversations`（歷史列表） |
| `bdd.ts` | `/api/bdd` | BDD session CRUD + `/answer` + `/confirm` + `/revert` + `/skip` |
| `templates.ts` | `/api/templates` | 模板列表/詳情/預覽/管理 |
| `operations.ts` | `/api/operations` | 生成/部署/任務/訂閱 等複合操作（最大的路由檔案） |
| `dashboard.ts` | `/api/dashboard` | 用戶統計 + Admin 管理（users/projects/logs） |
| `auth.ts` | `/api/auth` | Google/LINE OAuth + `/me` + `/refresh` + `/logout` |
| `health.ts` | `/api/health` | 健康檢查 + Redis/DB 狀態 + `/cleanup-tmp` |
| `user.ts` | `/api/user` | `GET /me`（用戶資訊）、帳號合併 |
| `upload.ts` | `/api/upload` | multer 圖片上傳（5MB 上限，JPEG/PNG），存 `UPLOAD_DIR`，回傳公開 URL |
| `line-bot.ts` | `/api/line/webhook` | LINE Bot Webhook（簽名驗證 + 事件分發），raw body 在 express.json 之前 |
| `domain.ts` | `/api/domain` | 域名 CRUD：`POST /check`（可用性）、`GET /list`、`GET /:id`、`GET /:id/dns`、`POST /:id/dns`、`DELETE /:id/dns/:recordId`、`DELETE /:id`、`GET /pricing` |

前端 Proxy：`app/api/vps/[...path]/route.ts` 將 `/api/vps/*` 轉發到 VPS 後端。

### Locale 路由

前端使用 `app/[locale]/` 多語系路由（zh/en）。`app/hooks/useLocalePath.ts` 處理帶 locale prefix 的路徑跳轉，`app/components/LocaleSwitcher.tsx` 切換語言。LIFF（LINE 內嵌）頁面在 `app/[locale]/liff/page.tsx`。

### 認證系統

`登入頁 → Vercel Proxy → VPS OAuth → JWT Token → localStorage（前端 hook）+ Cookie（middleware）`

### 代碼存儲：project_files 表

`(project_id, skill_source, file_path)` 唯一索引，UPSERT。`skill_source`: uiux/code/merge。Deployer 優先讀此表，fallback `bdd_sessions`。

### 資料庫 Migration（`tellcraft-backend/migrations/`）

| 檔案 | 內容 |
|------|------|
| `001_initial_schema.sql` | 基礎表結構（users/projects/conversations/messages 等） |
| `002_add_auth_columns.sql` | 認證欄位 |
| `003_add_template_overrides.sql` | 模板覆蓋設定 |
| `004_add_project_files.sql` | project_files 代碼存儲表 |
| `005_expand_templates.sql` | 模板分類擴展 + industry/use_cases/component_types + GIN 索引 |
| `006_add_es_document.sql` | Event Storming document 欄位 |
| `007_add_change_history.sql` | 變更歷史 |
| `008_add_openapi_spec.sql` | OpenAPI spec |
| `009_drop_audit_logs.sql` | 移除 audit_logs 表 |
| `010_add_user_providers.sql` | 帳號綁定（多 OAuth provider） |
| `011_add_line_active_conversations.sql` | LINE Bot 活躍對話映射表 |
| `012_add_language_preference.sql` | 用戶語言偏好（`preferred_language`） |
| `013_add_project_pin.sql` | 專案釘選 |
| `014_add_credits_system.sql` | 點數系統 |
| `015_add_job_failures.sql` | BullMQ 最終失敗持久化 |
| `016_add_performance_indexes.sql` | 效能索引（CONCURRENTLY） |
| `017_add_telegram_active_conversations.sql` | Telegram 活躍對話映射表 |
| `018_add_template_submission.sql` | 模板提交 |
| `019_add_template_approved_at.sql` | 模板審核時間 |
| `020_add_tool_template_category.sql` | 工具模板分類 |
| `021_add_uiux_columns.sql` | UIUX 相關欄位 |
| `022_add_domain_records.sql` | 域名記錄表（domain_records：狀態追蹤 + Porkbun/Cloudflare/Vercel 欄位 + completed_steps rollback） |
| `023_add_supabase_service_key.sql` | Supabase provisioning 支援（`supabase_service_role_key` 欄位 + quota 查詢索引） |
| `024_add_neon_columns.sql` | Neon provisioning 支援（`neon_project_id`/`neon_connection_string`/`neon_host` 欄位 + quota 查詢索引） |

新增 migration 後在 VPS 執行：`psql "$DATABASE_URL" -f tellcraft-backend/migrations/xxx.sql`

### Skill 定義目錄

| 目錄 | 說明 |
|------|------|
| `bdd-spec/` | BDD Skill 定義：`skill.md`（metadata/觸發）、`instructions/`（00-06 各 phase 指引）、`scripts/`（lint/validate）、`resources/`（範例/模板） |
| `uiux-skill/` | UIUX Skill 定義：設計階段指引 |
| `quality-gate-skill/` | Quality Gate Skill 定義 |
| `spec/` | BDD 產出：`features/`（.feature 檔案）、`actions/`（actions.yml）、`data/` |

### CI/CD

- **VPS 後端自動部署**：push 到 `main` 分支 → GitHub Actions SSH 到 VPS → `git reset --hard origin/main` → `pnpm install --frozen-lockfile` → `pnpm build` → `pm2 restart tellcraft-backend`（`.github/workflows/deploy-vps.yml`）
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
- Quality Gate 靜態檢查（A11y/Performance/CodeQuality）

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

- **handleProcessMessage 轉發到 handleContinueFlow 時必須帶 `skipPrefilterAndCredit: true`**：否則 prefilter + credit deduction 會執行兩次（雙重扣款）。只有 BullMQ `continue-flow` job 直接呼叫 `handleContinueFlow` 時才不帶此旗標
- **`handleFastGenerating`/`handleUiuxCodeGenerating` 的孤兒偵測有三層**：(1) conv-lock 不存在 + 60s → 立即恢復；(2) conv-lock 存在但 startedAt > 5min + 無心跳 → 過期 lock 恢復（防 stalled job re-processing 自己持有 lock 的假象）；(3) 20min 完整超時。新增生成中 phase handler 時必須考慮這三層
- **`generateStructure` 的 `onCheckpoint` callback**：在 multi-pass 批次完成、syntax fix 後、reference repair 後三處觸發。呼叫端必須傳入 checkpoint callback 將中途代碼存入 FlowState，防止進程崩潰遺失串流中代碼
- **新增 phase 必須四處同步**：`handleContinueFlow` 路由（含超時偵測）+ `FlowState` 型別 + `flowstate-recovery.ts` RECOVERABLE_PHASES + 前端 `richContent.type` union
- **Layout 切換禁止 opacity:0 入場動畫**：SplitLayout 左右兩側和 split-layout 外層不能用 `initial={{ opacity: 0 }}`，否則多層 opacity 疊加導致黑屏。Layout useEffect 依賴不能包含 `fastBuildChunks`（polling 每次 code_preview 都歸零再恢復，導致 layout 抖動）。一旦進入 split 模式，需檢查 `code_preview` 歷史消息才允許回退到 default
- **動畫庫是 `motion/react`**，不是 `framer-motion`
- **字體只能用 `next/font`**，禁止 `<link>` / `@import` Google Fonts
- **Tailwind v4**：用 `@import "tailwindcss"`，不是 v3 的 `@tailwind`
- **Tailwind config 禁止 CSS 變數引用**：`generateTailwindConfig()` 必須用硬編碼值（`'9999px'` 非 `'var(--radius-full)'`），否則部署後 CSS 變數可能遺失導致樣式失效
- **`app/components/templates/` 已廢棄**，PreviewPanel 用 WebContainers 渲染
- **deployer_complete 路由順序**：先檢查「部署」→ 再檢查「回滾」→ 再檢查「域名」(`hasDomainIntent`) → `isGreetingOrChitchat` 問候攔截 → `semanticGateway({ phase: 'iteration' })` 預驗證 → 最後才是迭代修改
- **complete/failed 問候攔截**：`uiux_complete`/`deployer_complete`/`deployer_failed` 三處 `semanticGateway` 前插入 `isGreetingOrChitchat()` 零 LLM 攔截，回覆友善上下文引導 + quickReplies。`__new_project__` 在 `handleContinueFlow` 入口處理（清 FlowState + LINE 映射）
- **迭代輸入四層防禦**：`prefilterMessage()`（全域）→ `detectFastModeIntent()`（問候/閒聊/平台問題攔截，`platform_issue` 回覆操作指引而非跑 refineCode）→ `semanticGateway({ phase: 'iteration' })`（Sonnet 語義審核，quickFilter 零 LLM 短路 ~80%）→ `refineCode [NO_CHANGE]`（LLM 兜底）。`isDesignFeedback()` 僅用於 fast mode 入口。**ITER_DESIGN_SIGNALS 必須包含錯誤修復詞**：'修復'/'錯誤'/'error'/'bug' 等，否則用戶貼錯誤訊息會被 quickFilter 拒絕
- **`checkBuildRelevance` fail-closed**：API 錯誤/空回應/JSON 解析/catch 全部降級拒絕（不是放行），保留無 API key 時的 fail-open
- **輸入品質閘門（Universal Input Quality Gate）**：`prefilterMessage()` 內 `checkInputQuality()` 全域攔截亂碼/髒話/垃圾 + `handleContinueFlow` phase-aware 二次攔截（`getPhaseStrictness()` 映射 strict/normal/lenient/skip）+ `analyzeAnswerRelevance` 前置檢查。Redis anti-loop `quality_reject:{conversationId}` 連續 3 次強制放行防卡死
- **參考網站分析（`reference-analyzer.ts`）**：puppeteer-core 需要系統 Chromium（`/usr/bin/chromium-browser`），VPS 須 `apt install chromium-browser`。同一 Puppeteer session 中先截圖再 `page.evaluate(BROWSER_EXTRACTION_SCRIPT)` 提取 DOM 結構/CSS computed styles/色板/字體/佈局骨架（5 秒超時保護）。結構化數據 JSON ~5KB 存入 FlowState。`analyzeWithVisionEnhanced` 將結構化數據注入 Haiku Vision prompt 做精確分析。四個注入點用 `formatStructuredDataForPrompt()` 統一格式化。DOM 提取失敗不影響截圖（獨立 try-catch），降級為純 Vision 分析。色板取樣最多 500 元素（步進取樣）。SSRF 防護禁 localhost/內網 IP
- **上傳圖片參考分析**：`analyzeUploadedImage` 不存 Buffer 到 FlowState（只存文字分析結果）。`completeDesignClarify` 並行分析圖片+URL，兩者都有則合併 visionAnalysis（`## 上傳參考圖片分析` + `## 參考網站分析`）。`analysisSource: 'uploaded_image'` 需在消息分支中覆蓋。imageUrls 管道：`handleProcessMessage` → `handleContinueFlow` → `routePhase` → `handleDesignClarifyReply` / `executeFastBuildSkill`
- **Mood 與 tier 互補不衝突**：mood 描述視覺方向（「做什麼」），tier 描述技術限制（「不做什麼」）。`recommendMoods` 的 tier 過濾防止不相容組合。Mood prompt 優先級：`variantConcept` > `mood` > `tier constraints`
- **Patterns 與 techniques 互補**：techniques 是 element-level（怎麼 style 一張卡片），patterns 是 section-level（hero/content/data/shell 怎麼組合）。prompt 中分開注入、分別標題。patterns 不教動畫（tailwindHint 不含 transition/animate）
- **文檔與實作同步**：改後端流程 → 同步更新 `uiux-skill/instructions/` + 此文件
- **`handleCodePhaseRedo` 需要快照**：`uiuxStructureCode`/`uiuxAnimationCode`，否則 redo 在已修改代碼上重做
- **`verifyBuildLocally` 的修復結果必須同步回 DB**：否則預覽和部署代碼分岔
- **部署五層防禦**：L1 generateStructure 後驗證引用 → L2 sanitizeCodeForDeploy stub 生成 + `??` 與 `||/&&` 混用自動加括號 → L3 fixBuildErrors API 重試 → L4 build 循環 3+1 次 → L5 useSearchParams Suspense 拆分
- **Anthropic 模型 ID**：一律用 `claude-sonnet-4-6`（不加日期後綴），`claude-sonnet-4-6-20250514` 不存在會 404。全 codebase 用 `semantic-gateway.ts` 定義的常數而非手打
- **Anthropic SDK v0.72+**：大 `max_tokens` 必須用 `messages.stream()` + `await stream.finalMessage()`
- **Skill 函數提前 return 必須保存 FlowState**：否則 `handleContinueFlow` 找不到 state → 用戶對話永久卡死
- **Formulation phase 必須設 `formulationStartedAt`**：否則中斷後無法觸發超時恢復。`formulation` phase + `waitingForReply=false` 代表正在生成中，handleContinueFlow 會攔截用戶輸入 + 15 分鐘超時偵測
- **Formulation checkpoint 每 3 個 feature 保存一次**：中斷恢復時跳過已完成的 feature，成功後必須清理所有 `formulation*` 暫存欄位
- **DB 連線池**：`max: 15`（非 50）+ `keepAlive: true`，防止 PostgreSQL 斷開空閒連線。可用 `DB_POOL_MAX` 環境變數覆蓋
- **Feature 驗證腳本用 `tsx` 不是 `ts-node`**：`feature-validation.ts` 的 `runScript()` 用 `npx tsx`。腳本解析失敗時視為通過（不觸發無效 LLM 修復循環），stderr/exitCode 會完整記錄供除錯
- **Feature Dry-Run（SDD RED phase Layer 2）**：`feature-dry-run.ts` 在 BDD spec_completed 之前、Neon provisioning 之後，用真實 Neon DB 執行 Feature 的 entity_setup 步驟。驗證 entity/column/VAR 格式對真實 DB 是否正確。失敗觸發 LLM 修復（最多 2 輪）。跳過 api_call/response_validate（Coder 還沒生成後端）。復用 specformula-runner 的容錯修正層（fixDataTableBySchema/fillMissingNotNullColumns/ensureFkReferencesExist）
- **Feature Alignment Gate（阻斷式閘門）**：`feature-alignment-gate.ts` 在 RED Phase 之後、`executeCoderPipeline()` 之前執行。6 項深度對齊檢查（Summary 唯一性/Entity Column Coverage/FK Reference 完整性/Response Field 命名/VAR-System 對齊/Summary↔actionsYml 匹配）+ LLM 自動修復（呼叫 `fixMultipleFeatures()`，最多 2 輪）。修不好則**阻塞 pipeline**（回退到 `uiux_complete`，不像 RED Phase 的 advisory 模式）。修復後的 Features 自動更新 DB `bdd_sessions.features_content`
- **RED Phase 三層驗證（SDD RED phase）**：`red-phase-validator.ts` 在 Coder 代碼生成前執行三層驗證。**Layer 1 靜態檢查**（~2ms）：11 個零 LLM 檢查（Action 存在性/HTTP Method/Path/Summary 一致性/Response 欄位/Status Code/Entity/Step 可解析性/**DataTable Column Coverage/NOT NULL Completeness/FK Reference Validity**）。Checks 9-11 從 Feature 的 entity_setup DataTable 提取 headers，與 Schema DDL 做深度交叉驗證（欄位是否存在、NOT NULL 是否都提供、FK 引用表是否存在）。**Layer 2 Stub 全場景**（~1-2s）：用 `StubHttpAdapter`（回 501）+ 真實 Neon DB 跑完整 SpecFormula 場景。區分「預期 RED」和「非預期失敗」。**Layer 2.5 Routing 驗證**（~1-2s）：用 `RoutingStubAdapter`（in-process Express，匹配路由→501，不匹配→404）+ 真實 Neon DB，驗證 Feature summary 能正確匹配 API 路由。Layer 2/2.5 需要 `open_api_spec_content` + `isa_config_content` + `neon_connection_string`，缺少任一則降級跳過。三層都不阻塞 Pipeline
- **Stage B Phase 2 多輪回歸修復**：`runRedGreenCycle` 的 Phase 2（全量回歸）最多 2 輪迴圈（`maxRegressionRounds`）。scenario-level 智能跳過：`featureName::scenarioName` 集合與上輪完全相同則停止。Phase 2 crash 不重試
- **`_stepSummary` dispatch 用 `===` 精確匹配**：`composeActionFunction` 生成 `op === 'xxx'` 而非 `op.includes('xxx')`，徹底消除子字串碰撞。所有 prompt（BASE_PROMPT、FIX_SYSTEM_PROMPT、前端改寫 prompt）同步更新。`parseActionBranches` 和 `validateAndFixActionCalls` 向後相容兩種格式
- **Slot extraction 重試**：`extractSlots()` 第一次 JSON parse/Zod 驗證失敗後，注入錯誤訊息 + 上次輸出做第二次嘗試。大幅減少 template → free-form LLM fallback（非確定性代碼降級）
- **Schema-aware `deleted_at`**：template 的 `softDeleteColumn` 從 `.default('deleted_at')` 改為 `.optional()`。extraction prompt 指示只有 Schema 有此欄位才填。template 條件生成 `AND deleted_at IS NULL`，Schema 沒有此欄位不生成
- **錯誤根因分類器**：`classifyFailureRootCause()` 零 LLM 正則分類 8 類根因（dispatch/column/status/field/sql/auth/var/fk）。`var_resolution` 跳過代碼修復（Feature 問題）；`auth_check` 直接 `removeAuthChecks()` 不走 LLM
- **雙層完成驗證（Dual-Layer Completion Gate）**：Coder Testing 完成後，根據 `coderTestPassed` 區分 quickReplies：測試全通過 → `部署`(primary)；測試有失敗 → `重試測試`(primary) + `帶風險部署`(secondary)。`__deploy_with_risk__` 觸發二次確認（風險摘要 + 確認/取消），確認後 `deployedWithFailingTests=true` 寫入 FlowState 再走正常部署。`__cancel_risky_deploy__` 取消後回到重試/部署選項。FlowState 新增 `coderTestFailedScenarios`（失敗場景數）+ `deployedWithFailingTests`（帶風險部署標記）
- **Neon provisioning 是同步的（< 10s）**：任何失敗都不阻塞 UIUX 或部署流程。Deployer 直接 SELECT `neon_connection_string` FROM projects 注入 DATABASE_URL，無需 Redis polling
- **`streamLlmMessage` vs `sendMessage`**：LLM 生成的對話文字用 `streamLlmMessage`（後端 SDK streaming + Socket.io 事件，為未來 WSS 準備），模板文字/進度/richContent 用 `sendMessage`。`streamLlmMessage` 失敗時自動降級為 `sendMessage`。前端透過 polling 拿到完整訊息後在 `ChatMessageItem` 內做打字機動畫（`isTypewriterTarget` prop + `onTypewriterComplete` callback）
- **`identifyMockDataComponents` 用 Haiku LLM 識別**：一次 batch call 發送所有組件摘要 + availableActions 列表，Haiku 回傳需改寫的組件 indices。失敗自動降級到 regex fallback。Haiku 能區分「業務假資料」vs「UI 結構靜態配置」，regex 做不到。System prompt 明確列出不需改寫的類型（nav items、footer、feature lists）
- **Coder action response field 必須對齊 BDD execution key**：`generateActionFunction` 從 Feature 文件提取 `<executionKey`（如 `<newUserId`）+ stepSummary + **完整 Feature 內容**注入 prompt。不對齊會導致 SpecFormula VAR-System 連鎖失敗。Features 從 `bdd_sessions.features_content` 讀取
- **Per-SubOp 生成 + Code Template 模板化**：`generateActionFunction` 先用 `extractSubOperations()` 按 When 步驟拆子操作，每個子操作用 `inferOperationType()` 推斷類型 → 已知 pattern 走 `tryTemplateGeneration()`（LLM 提取 JSON 槽位 → Zod 驗證 → 模板渲染確定性代碼），未知 pattern 走 free-form LLM（精準 Handler 選擇）。7 個模板：aggregate/export/cascade/create/update/delete/query_list。`INLINE_SNAKE_TO_CAMEL`（`_c`）內嵌每個模板，不可被 composition helper 提取器拔走。`buildScopeClause()` 自動處理有/無 scope。`ID_PATTERN` Unicode-aware 正則支援中文函數名。`CODER_PER_SUBOP=false` 一鍵關閉
- **fixFailingAction 根因錯誤**：`executeScenario` 只記錄第一個失敗步驟的 error（根因），不被後續連鎖失敗覆蓋。`runRedGreenCycle` 從 steps 提取根因 error + chain errors 傳給 fixFailingAction，prompt 標註 Root Cause
- **ScenarioContext VAR 解析支援數字後綴**：`ScenarioContext.get("listId")` 需匹配 stored key `"List1.id"`。fallback 邏輯去除 entity 末尾數字（`List1` → `List`）再做 camelCase 組合。否則 `$listId` 不解析 → 字串 `"$listId"` 傳入 PostgreSQL → `invalid input syntax for type uuid`
- **Code Template Zod schema 必須寬鬆**：`scopeColumn`/`scopeParam` 用 `.optional()`（很多 app 沒有明確 scope 欄位），`entityIdParam` 用 `.default('id')`。否則 LLM 回 null → Zod 拒絕 → template 全掛 → fallback 到 free-form LLM
- **Template inline snakeToCamel 不可用獨立 function**：用 `INLINE_SNAKE_TO_CAMEL`（`_c` 常數）嵌入每個模板。獨立 `function snakeToCamel()` 會被 `composeActionFunction` 的 helper 提取器拔出，如果提取失敗則 runtime `snakeToCamel is not defined`
- **preExtractTestPasswords 引號剝除**：DataTable raw 值帶引號（`"user@example.com"`），entity_setup 的 resolveVariable 剝除引號，但 testPasswordMap 的 key 也必須剝除才能匹配。否則 bcrypt hash 的密碼帶引號 → login 的 bcrypt.compare 不帶引號 → 不匹配
- **Coder E2E 測試必須包含 backendFiles**：`runCoderE2ETests` 的 code 必須含 `result.backendFiles`（`lib/actions/*`、`app/actions/*`、`lib/db.ts`），否則改寫後的組件 import Server Action 會全部 Module not found → 500
- **`rewriteComponentForServerActions` maxTokens 上限 32768**：大組件（>1000 行）需要足夠 token。改寫後偵測 JSX 標籤平衡，截斷時回退原始組件
- **Prompt caching system prompt 順序重要**：`buildCacheableSystemBlocks` 將 static 部分（tier philosophy + task definition + base rules）放在第一個 block 並加 `cache_control: { type: 'ephemeral' }`，dynamic 部分（mood、designSystem、constraints）放在第二個 block。`buildCacheableUserMessage` 將 user message 的代碼區塊加 `cache_control`，使 continuation call 能 cache hit。修改 system prompt 時不要把 per-request 內容放進 static block，否則 cache hit 率歸零
- **`ENABLE_DIFF_OUTPUT` diff 輸出模式**：Animation/RWD/Merged 階段用 SEARCH/REPLACE block 格式輸出修改（省 60-70% output token）。`parseSearchReplaceBlocks()` 解析 → `applySearchReplace()` 應用到 baseCode → `fuzzySearch()` 容忍縮排差異。解析失敗時自動 fallback 到 `parseGeneratedFiles()` full-file 模式。串流預覽用 `buildDiffStreamingHandler()` 在每個完整 block 閉合時 apply 到 baseCode 副本再 emit。SEARCH 多處匹配會拒絕替換（安全起見）。注意 diff 模式不影響 `generateStructure`（從零生成不需要 diff）
- **`FAST_BUILD_MERGED_ANIM_RWD` 只影響首批生成**：`isLaterBatch`（增量批次）仍用分離的 Animation + RWD，因為增量批次有特殊的 `buildIncrementalCode` 處理邏輯
- **WebContainer preload 後禁止 `container.mount()`**：preloader 預裝 BASE_DEPS 到 node_modules，之後 `useWebContainer` hook 用 `writeFilesToContainer()` 逐檔寫入（不用 `mount()`）。`mount()` 會清除整個 fs 包括 node_modules。`restart()` 例外（用戶觸發的重啟允許 mount + 全量重裝）。`preloadPromise` 是 module-level，hook 自動偵測不需 prop drilling
- **生成期間禁止渲染 WebContainer**：`ChatPreviewPanel` 在 UIUX pipeline（`uiux_pipeline_progress`/`uiux_structure_generating`/...）和 Coder（`coder_generating`/`coder_testing`）生成期間直接 early return `AIGenerationWaitingScene`，不掛載 `WebContainerPreviewComponent`。只有 fast build 模式的 streaming preview 才即時渲染。`handleUiuxCodeGenerating` 回覆用 `stage: 'uiux_pipeline_progress'`（不是 `'info'`），避免 overlay 偵測失效
- **WebContainer 路由衝突去重**：`buildWebContainerFiles()` 對 pages 和 apiRoutes 做 `deduplicateRouteConflicts()`，strip route groups `(groupName)/` 後按真實路由路徑去重（後者覆蓋前者），防止 Next.js "two parallel pages that resolve to the same path" 編譯錯誤
- **WebContainer 增量寫入必須統一處理**：`WebContainerPreview.tsx` 的 full write 和 incremental write 必須都經過 `deduplicateRouteConflicts` + `stripRouteGroups` + `sanitizeFileContent` + `injectEditBridge`。`prevProcessedRef` 存的是處理後的 `Record<string, string>`（path→content），diff 基於處理後的內容。漏掉任何一步會導致：(1) route group 路徑不匹配 → 寫到錯路徑 → HMR 不觸發，(2) 未 sanitize → framer-motion/缺 use client → build error → 預覽卡在舊版

## 核心原則

1. **無腦補原則**：嚴格遵守規格，不擅自假設
2. **summary 一致**：Action summary 必須與 Feature 名稱一致
3. **自我修復**：驗證失敗時進入修正迴圈（最多 3 次）
4. **Tellcraft 平台不直連資料庫**：Tellcraft 平台自身前端透過 VPS API 操作資料。Coder Skill 生成的客戶 app 用 Server Actions + Neon 直連，禁止 `accept-data-loss`

## 環境變數

前端（`.env.local`）：`VPS_API_URL`, `NEXT_PUBLIC_VPS_API_URL`, `NEXT_PUBLIC_VPS_WS_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_LIFF_ID`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`

後端（`tellcraft-backend/.env`）：所有環境變數定義在 `lib/env.ts` 的 Zod schema 中，分三層（REQUIRED/OPTIONAL+預設/功能開關）。啟動時 `validateEnv()` 驗證，缺必要變數會立即 crash。關鍵 OPTIONAL 變數：`NEON_API_KEY`（Neon API Bearer Token，自動建立客戶 DB）、`NEON_DEFAULT_REGION`（預設 aws-ap-southeast-1，注意 aws-ap-northeast-1 已從 Neon 移除）。Token 優化開關：`ENABLE_PROMPT_CACHING`（預設 true，Anthropic prompt caching 降 input token 成本）、`FAST_BUILD_MERGED_ANIM_RWD`（預設 true，合併 Animation+RWD 為單次 Sonnet 呼叫；品質異常時設 false 回退分離模式）、`ENABLE_DIFF_OUTPUT`（預設 false，Animation/RWD 用 SEARCH/REPLACE diff 輸出省 60-70% output token；開啟後 LLM 只輸出修改的代碼片段而非完整檔案，解析失敗時自動 fallback 到 full-file 模式）。

