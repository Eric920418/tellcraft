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

# VPS 後端開發（tellcraft-backend/）
cd tellcraft-backend
pnpm install && pnpm dev  # 啟動開發伺服器（http://localhost:3100，tsx watch 熱更新）
pnpm build                # TypeScript 編譯（tsc → dist/）
pnpm typecheck            # 型別檢查

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

前端**不直連資料庫**：`Vercel Server Actions → app/lib/vps-api.ts → VPS Express API → PostgreSQL`

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
| **Orchestrator Utils** | `workers/orchestrator-utils.ts` | 共用基礎設施：sendMessage/saveFlowState/getFlowState 等 |
| **FlowState 型別** | `types/flow-state.ts` | FlowState 介面 + 子型別（避免循環 import） |
| **Classifier** | `services/classifier.ts` | 三層防禦：Prefilter → Meta Intent → Skill 分類 |
| **UIUX Generation** | `services/uiux-generation.ts` | 設計生成核心（Brief/Variants/Structure/Animation/RWD/Refine） |
| **Quality Gate** | `services/quality-gate.ts` | A11y/Performance/CodeQuality 靜態檢查 + LLM 自動修復 |
| **Deployer** | `services/deployer.ts` | sanitize → build 驗證 → Vercel 部署 → 回滾 |
| **Iteration Skill** | `services/iteration-skill.ts` | 迭代修改 + 撤銷 + 版本回滾（從 orchestrator 抽出） |
| **Fast Build** | `services/fast-build-generation.ts` | 快速模式輔助：tier 偵測、產品推斷、默認 DesignSystem（零 LLM）、surface-1/2/3 色階 |
| **Design Techniques** | `services/design-techniques.ts` | 視覺技法庫（30 個 Layout/Surface/Typography/Interaction 技法），按 tier+productType 加權隨機注入 Structure prompt |
| **Composition Patterns** | `services/composition-patterns.ts` | 20 個 section-level 佈局組合模式（hero/content/data/shell）+ `selectCompositionPatterns()` page-type-aware 選擇 + prompt 注入 |
| **Reference Analyzer** | `services/reference-analyzer.ts` | 參考網站真實分析：URL→截圖(puppeteer-core)→Haiku Vision→設計風格分析，三層降級 + `analyzeUploadedImage` 上傳圖片 Vision 分析 |
| **Template Matcher** | `services/template-matcher.ts` | 三層評分智能匹配（關鍵詞 40 + Category 30 + UISpec 30，零 LLM） |
| **Design Moods** | `services/design-moods.ts` | 8 個設計情緒預設 + `recommendMoods()` 規則推薦（feeling 50 + productType 30 + tier 過濾）+ prompt 注入 getter |
| **Semantic Gateway** | `services/semantic-gateway.ts` | 統一語義閘門：quickFilter 零 LLM 短路 + Sonnet 六元 verdict（bdd_clarify/design_clarify/iteration），取代 keyword array |
| **Customer Service** | `services/customer-service.ts` | 客服問答：detectFastModeIntent 意圖分類（greeting/question/chitchat/help）+ FAQ 零 LLM 匹配（9 主題）+ answerWithSonnet 開放問答 |
| **Prefilter** | `services/prefilter.ts` | 全域輸入預過濾：checkInputQuality 亂碼/髒話/垃圾 + phase-aware 二次攔截（getPhaseStrictness）+ Redis anti-loop |
| **FlowState Recovery** | `services/flowstate-recovery.ts` | 每 2 分鐘掃描 Redis flow:* key，逾時 phase 自動恢復（prd_discovery 5m / fast_generating 20m / uiux_iterating 5m / deployer_deploying 10m）|
| **Conversation Lock** | `services/conversation-lock.ts` | Redis SET NX EX 互斥鎖（TTL 5 分鐘），同一對話同時只允許一個 Worker job 執行 |
| **LINE Notify** | `services/line-notify.ts` | LINE 推播通知（stage 白名單過濾，fire-and-forget） |
| **LINE Bot Handler** | `services/line-bot-handler.ts` | LINE Bot 業務邏輯（Follow/Text/Postback 處理） |
| **LINE Message Translator** | `services/line-message-translator.ts` | sendMessage → LINE Messages 全量翻譯 |
| **LINE Full Push** | `services/line-full-push.ts` | LINE 來源對話的全量翻譯推送 |
| **Env** | `lib/env.ts` | Zod 環境變數驗證，啟動時快速失敗 |
| **Anthropic** | `lib/anthropic.ts` | 統一 Client 單例 + MODEL 常數（SONNET/HAIKU） |
| **Validate** | `middleware/validate.ts` | Zod 請求驗證中間件（validateBody/Query/Params） |
| **Schemas** | `schemas/*.ts` | API 路由 Zod schema 定義（conversation/session/operations/bdd/project） |
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
| **Sandpack 預覽** | `app/lib/sandpack-utils.ts` + `app/components/uiux/SandpackPreview.tsx` | | UIUX 預覽核心，Sandpack 真實 React 渲染 |
| **WebSocket Hook** | `app/hooks/useVpsWebSocket.ts` | | 即時訊息推送（型別定義） |
| **Fast Build 動畫** | `app/components/FastBuildPlayer.tsx` + `app/components/remotion/fast-build/` | | Remotion + @remotion/three 3D 工廠流水線動畫（Structure/Animation/RWD 三站）|
| **3D 蓋房子** | `app/components/building-scene/` + `app/components/remotion/building-scene/` | | Remotion + @remotion/three 低多邊形 3D 場景（BDD Q&A 視覺回饋）|
| **Landing 組件** | `app/components/landing/` | ~1978 | 15 個自包含 Landing Page 組件 |

### Skill 系統

| Skill | 用途 |
|-------|------|
| `bdd-spec` | 需求釐清 + BDD 規格產出（5 階段：Discovery → Clarify → Formulation → Actions Design → ISA Config）|
| `uiux` | 前端介面設計（3 階段：Design Discovery → Design Lab → Implementation）|
| `quality-gate` | UIUX RWD 完成後**自動觸發**，critical 問題 LLM 自動修復（最多 3 輪）|
| `deployer` | UIUX 代碼 → Next.js → Vercel 部署（用戶說「部署」觸發） |
| `iteration` | 迭代修改 + 撤銷上一步 + 版本回滾（`uiux_complete`/`deployer_complete` 自動路由） |
| `fast-build` | 快速建站：一句話 → 跳過 BDD/Discovery → inferInteractionHint → 增量生成（首頁先預覽 → 用戶確認 → 剩餘頁面）→ 靜態 QG → Preview |

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
| `deployer_deploying` / `deployer_failed` / `deployer_complete` | 部署流程（用戶說「部署」直接執行，無二次確認） |
| `deployer_rollback_select` | 等待用戶選擇回滾版本 |

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
  → generateFastConcept（1 次 Haiku，概念 + suggestedTier 修正，suggestedPages 2-4 頁，注入參考分析）
  → mergePages（上限 4 頁）→ 單批生成 S+A+R+QG（referenceAnalysis 注入 generateStructure）→ 完成
  → phase='uiux_complete'（複用所有迭代/部署/回滾邏輯）
  ≤4 頁不暫停（大多數場景單批完成）
```

- **效能優化**：DEFAULT_PAGES 所有類型上限 3-4 頁，mergePages 上限 4，pickFirstBatchPages ≤4 頁一批完成（消除暫停確認）。Structure prompt 快速模式跳過 techniques/patterns/moodCode + 使用精簡版 craft/constraints/baseRules（systemPrompt ~7000→~4000 字）
- **增量交互式生成**（>4 頁時才觸發，目前預設不會觸發）：`executeFastBuildSkill` 設定 `fastBuildAllPages` → `runFastBuildPipeline` 跑第 1 批 → 有剩餘頁面時暫停 → 用戶按「繼續生成」跑第 2 批 → `mergeGeneratedCode` 合併 → 完成
- **FlowState 增量欄位**：`fastBuildStage`（generating/awaiting_continue/complete）、`fastBuildAllPages`、`fastBuildCompletedPages`、`fastBuildCurrentBatchIndex`
- **`mergeGeneratedCode()`**：按 path 去重合併（新批次覆蓋同路徑），styles 保留首批
- **`buildExistingComponentSummary()`**：構建已有組件路徑列表注入 `productContext.existingComponentSummary` → `generateStructure` 的 `buildUserMsg` 告訴 LLM 不要重新生成
- **Haiku 概念生成**：`generateFastConcept()` 生成 `FastConcept`（name/vibe/signatureElement/keyFeatures/suggestedTier），轉換為 `VariantConcept` 注入三階段 prompt
- **Tier 智能修正**：Haiku suggestedTier 與規則不一致時覆蓋 tier + 重建 designSystem
- **Design Tier**：`functional`（dashboard/SaaS，禁漸層/glow）vs `creative`（landing page，允許大膽設計）
- **串流預覽**：生成時 Socket.io `preview_update` 即時推送，前端 Sandpack 增量更新（`useSandpack().sandpack.updateFile()`）
- **Variant 概念**：`VariantConcept` 注入所有生成 prompt，確保創意方向一致
- **失敗重試**：`__retry_fast_build__` quickReply，handleContinueFlow 攔截用 `fastModeOriginalMessage` 重新生成
- **手機預覽**：< 768px 顯示全屏 SandpackPreview Modal（含裝置切換/部署/修改按鈕）
- **進度預估**：每階段推送 `estimatedSecondsRemaining`（240→120→60），前端顯示 `~X min`

### Deployer Pipeline（五層防禦）

```
Layer 1: generateStructure 後 validateComponentReferences → repairMissingComponents（LLM 修復）
Layer 2: sanitizeCodeForDeploy（7 類自動修復 + broken import 自動生成 stub 組件）
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

目前**無自動化測試框架**（前端 `test` script 是佔位符）。品質保障依賴：
- BDD 規格驗證腳本（lint-gherkin-format + validate-feature）
- TypeScript 型別檢查（`pnpm typecheck`）
- ESLint（`pnpm lint`）
- Quality Gate 靜態檢查（A11y/Performance/CodeQuality）

## BDD 規格格式（sdd.os ISA）

| 步驟類型 | 格式 |
|----------|------|
| Action 呼叫 | `{summary}, call table:` |
| 成功回應 | `{summary}成功, with table:` |
| 操作失敗 | `操作失敗` |
| Entity 驗證 | `存在一個{entity}, with table:` |

驗證錯誤代碼：E001 缺 Action 註解、E002 缺 Summary、E003 缺 Feature、E004 Summary 不一致、E005 Rule 缺標註、E006 When 格式錯、E008 沒 Example

## 防雷清單（不看必踩）

- **新增 phase 必須四處同步**：`handleContinueFlow` 路由（含超時偵測）+ `FlowState` 型別 + `flowstate-recovery.ts` RECOVERABLE_PHASES + 前端 `richContent.type` union
- **動畫庫是 `motion/react`**，不是 `framer-motion`
- **字體只能用 `next/font`**，禁止 `<link>` / `@import` Google Fonts
- **Tailwind v4**：用 `@import "tailwindcss"`，不是 v3 的 `@tailwind`
- **Tailwind config 禁止 CSS 變數引用**：`generateTailwindConfig()` 必須用硬編碼值（`'9999px'` 非 `'var(--radius-full)'`），否則部署後 CSS 變數可能遺失導致樣式失效
- **`app/components/templates/` 已廢棄**，PreviewPanel 用 Sandpack 渲染
- **deployer_complete 路由順序**：先檢查「部署」→ 再檢查「回滾」→ `isGreetingOrChitchat` 問候攔截 → `semanticGateway({ phase: 'iteration' })` 預驗證 → 最後才是迭代修改
- **complete/failed 問候攔截**：`uiux_complete`/`deployer_complete`/`deployer_failed` 三處 `semanticGateway` 前插入 `isGreetingOrChitchat()` 零 LLM 攔截，回覆友善上下文引導 + quickReplies。`__new_project__` 在 `handleContinueFlow` 入口處理（清 FlowState + LINE 映射）
- **迭代輸入三層防禦**：`prefilterMessage()`（全域）→ `isGreetingOrChitchat()`（問候攔截）→ `semanticGateway({ phase: 'iteration' })`（Sonnet 語義審核，quickFilter 零 LLM 短路 ~80%）→ `refineCode [NO_CHANGE]`（LLM 兜底）。`isDesignFeedback()` 僅用於 fast mode 入口
- **`checkBuildRelevance` fail-closed**：API 錯誤/空回應/JSON 解析/catch 全部降級拒絕（不是放行），保留無 API key 時的 fail-open
- **輸入品質閘門（Universal Input Quality Gate）**：`prefilterMessage()` 內 `checkInputQuality()` 全域攔截亂碼/髒話/垃圾 + `handleContinueFlow` phase-aware 二次攔截（`getPhaseStrictness()` 映射 strict/normal/lenient/skip）+ `analyzeAnswerRelevance` 前置檢查。Redis anti-loop `quality_reject:{conversationId}` 連續 3 次強制放行防卡死
- **參考網站分析（`reference-analyzer.ts`）**：puppeteer-core 需要系統 Chromium（`/usr/bin/chromium-browser`），VPS 須 `apt install chromium-browser`。截圖 JPEG 75 quality、15s timeout、buffer 不存 FlowState（只存文字分析結果）。SSRF 防護禁 localhost/內網 IP
- **上傳圖片參考分析**：`analyzeUploadedImage` 不存 Buffer 到 FlowState（只存文字分析結果）。`completeDesignClarify` 並行分析圖片+URL，兩者都有則合併 visionAnalysis（`## 上傳參考圖片分析` + `## 參考網站分析`）。`analysisSource: 'uploaded_image'` 需在消息分支中覆蓋。imageUrls 管道：`handleProcessMessage` → `handleContinueFlow` → `routePhase` → `handleDesignClarifyReply` / `executeFastBuildSkill`
- **Mood 與 tier 互補不衝突**：mood 描述視覺方向（「做什麼」），tier 描述技術限制（「不做什麼」）。`recommendMoods` 的 tier 過濾防止不相容組合。Mood prompt 優先級：`variantConcept` > `mood` > `tier constraints`
- **Patterns 與 techniques 互補**：techniques 是 element-level（怎麼 style 一張卡片），patterns 是 section-level（hero/content/data/shell 怎麼組合）。prompt 中分開注入、分別標題。patterns 不教動畫（tailwindHint 不含 transition/animate）
- **文檔與實作同步**：改後端流程 → 同步更新 `uiux-skill/instructions/` + 此文件
- **`handleCodePhaseRedo` 需要快照**：`uiuxStructureCode`/`uiuxAnimationCode`，否則 redo 在已修改代碼上重做
- **`verifyBuildLocally` 的修復結果必須同步回 DB**：否則預覽和部署代碼分岔
- **部署五層防禦**：L1 generateStructure 後驗證引用 → L2 sanitizeCodeForDeploy stub 生成 → L3 fixBuildErrors API 重試 → L4 build 循環 3+1 次 → L5 useSearchParams Suspense 拆分
- **Anthropic 模型 ID**：一律用 `claude-sonnet-4-6`（不加日期後綴），`claude-sonnet-4-6-20250514` 不存在會 404。全 codebase 用 `semantic-gateway.ts` 定義的常數而非手打
- **Anthropic SDK v0.72+**：大 `max_tokens` 必須用 `messages.stream()` + `await stream.finalMessage()`
- **Skill 函數提前 return 必須保存 FlowState**：否則 `handleContinueFlow` 找不到 state → 用戶對話永久卡死
- **Formulation phase 必須設 `formulationStartedAt`**：否則中斷後無法觸發超時恢復。`formulation` phase + `waitingForReply=false` 代表正在生成中，handleContinueFlow 會攔截用戶輸入 + 15 分鐘超時偵測
- **Formulation checkpoint 每 3 個 feature 保存一次**：中斷恢復時跳過已完成的 feature，成功後必須清理所有 `formulation*` 暫存欄位
- **DB 連線池**：`max: 15`（非 50）+ `keepAlive: true`，防止 PostgreSQL 斷開空閒連線。可用 `DB_POOL_MAX` 環境變數覆蓋
- **Feature 驗證腳本用 `tsx` 不是 `ts-node`**：`feature-validation.ts` 的 `runScript()` 用 `npx tsx`。腳本解析失敗時視為通過（不觸發無效 LLM 修復循環），stderr/exitCode 會完整記錄供除錯

## 核心原則

1. **無腦補原則**：嚴格遵守規格，不擅自假設
2. **summary 一致**：Action summary 必須與 Feature 名稱一致
3. **自我修復**：驗證失敗時進入修正迴圈（最多 3 次）
4. **不直連資料庫**：前端透過 VPS API 操作資料，禁止 `accept-data-loss`

## 環境變數

前端（`.env.local`）：`VPS_API_URL`, `NEXT_PUBLIC_VPS_API_URL`, `NEXT_PUBLIC_VPS_WS_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_LIFF_ID`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`

後端（`tellcraft-backend/.env`）：所有環境變數定義在 `lib/env.ts` 的 Zod schema 中，分三層（REQUIRED/OPTIONAL+預設/功能開關）。啟動時 `validateEnv()` 驗證，缺必要變數會立即 crash。

## Phase 3 已完成：效能與可觀察性

| 步驟 | 內容 | 說明 |
|------|------|------|
| **3-4** | LLM Usage 追蹤統一 | `PRICING` + `calculateLlmCost()` + `trackLlmUsage()` 集中在 `lib/anthropic.ts`，17 個 service 移除重複 PRICING |
| **3-2** | Sentry 前端錯誤追蹤 | `@sentry/nextjs`，`sentry.*.config.ts` + `instrumentation.ts` + error boundary + vps-api.ts 錯誤上報 |
| **3-1** | 消息列表虛擬化 | `ChatMessageItem`（React.memo）+ `@tanstack/react-virtual` 虛擬滾動，100+ 條消息 DOM < 30 個 |
