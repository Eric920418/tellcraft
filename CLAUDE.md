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
| **Orchestrator** | `workers/orchestrator.ts`（~3900 行） | BullMQ Worker，核心流程引擎，`FlowState.phase` 狀態機 |
| **Orchestrator Utils** | `workers/orchestrator-utils.ts` | 共用基礎設施：sendMessage/saveFlowState/getFlowState 等 |
| **FlowState 型別** | `types/flow-state.ts` | FlowState 介面 + 子型別（避免循環 import） |
| **Classifier** | `services/classifier.ts` | 三層防禦：Prefilter → Meta Intent → Skill 分類 |
| **UIUX Generation** | `services/uiux-generation.ts` | 設計生成核心（Brief/Variants/Structure/Animation/RWD/Refine） |
| **Quality Gate** | `services/quality-gate.ts` | A11y/Performance/CodeQuality 靜態檢查 + LLM 自動修復 |
| **Deployer** | `services/deployer.ts` | sanitize → build 驗證 → Vercel 部署 → 回滾 |
| **Iteration Skill** | `services/iteration-skill.ts` | 迭代修改 + 撤銷 + 版本回滾（從 orchestrator 抽出） |
| **Fast Build** | `services/fast-build-generation.ts` | 快速模式輔助：tier 偵測、產品推斷、默認 DesignSystem（零 LLM） |
| **Template Matcher** | `services/template-matcher.ts` | 三層評分智能匹配（關鍵詞 40 + Category 30 + UISpec 30，零 LLM） |
| **LINE Notify** | `services/line-notify.ts` | LINE 推播通知（stage 白名單過濾，fire-and-forget） |
| **LINE Bot Handler** | `services/line-bot-handler.ts` | LINE Bot 業務邏輯（Follow/Text/Postback 處理） |
| **LINE Message Translator** | `services/line-message-translator.ts` | sendMessage → LINE Messages 全量翻譯 |
| **LINE Full Push** | `services/line-full-push.ts` | LINE 來源對話的全量翻譯推送 |

**前端（`app/`）— 大檔案優先閱讀**

| 模組 | 路徑 | 行數 | 職責 |
|------|------|------|------|
| **主頁面** | `app/page.tsx` | ~4000 | 對話 UI 主體、所有 richContent 渲染、狀態管理 |
| **LLM 工具** | `app/lib/llm.ts` | ~2200 | LLM 呼叫封裝、prompt 工具 |
| **VPS API Client** | `app/lib/vps-api.ts` | ~1900 | 前端呼叫 VPS 的 HTTP 客戶端 |
| **Server Actions** | `app/actions/index.ts` | ~1800 | 對話/訊息/專案等 Server Actions 入口 |
| **Sandpack 預覽** | `app/lib/sandpack-utils.ts` + `app/components/uiux/SandpackPreview.tsx` | | UIUX 預覽核心，Sandpack 真實 React 渲染 |
| **WebSocket Hook** | `app/hooks/useVpsWebSocket.ts` | | 即時訊息推送（型別定義） |
| **Fast Build 進度** | `app/components/FastBuildProgress.tsx` | | 工程藍圖風三階段進度元件（motion/react） |
| **3D 蓋房子** | `app/components/building-scene/` | | Three.js 低多邊形 3D 場景 + GSAP timeline（BDD Q&A 視覺回饋） |

### Skill 系統

| Skill | 用途 |
|-------|------|
| `bdd-spec` | 需求釐清 + BDD 規格產出（5 階段：Discovery → Clarify → Formulation → Actions Design → ISA Config）|
| `uiux` | 前端介面設計（3 階段：Design Discovery → Design Lab → Implementation）|
| `quality-gate` | UIUX RWD 完成後**自動觸發**，critical 問題 LLM 自動修復（最多 3 輪）|
| `deployer` | UIUX 代碼 → Next.js → Vercel 部署（用戶說「部署」觸發） |
| `iteration` | 迭代修改 + 撤銷上一步 + 版本回滾（`uiux_complete`/`deployer_complete` 自動路由） |
| `fast-build` | 快速建站：一句話 → 跳過 BDD/Discovery → inferInteractionHint → Structure+Interaction → Animation → RWD → 靜態 QG → Preview |

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
| `fast_need_more_info` | 快速模式描述太短，等待用戶補充（補充後清除 FlowState 重新執行） |
| `fast_generating` | 快速模式生成中（攔截用戶輸入，完成後 → `uiux_complete`） |
| `deployer_deploying` / `deployer_failed` / `deployer_complete` | 部署流程（用戶說「部署」直接執行，無二次確認） |
| `deployer_rollback_select` | 等待用戶選擇回滾版本 |

### UIUX Pipeline 概覽

```
BDD 完成 → matchTemplates()（零 LLM，三層評分）
  ├─ 有匹配 → "討論式設計 / 使用模板(N個推薦)"
  └─ 無匹配 → "開始設計"（不顯示模板按鈕）
Discovery（Path A 問卷 / Path B 篩選後模板）
  → Design Brief 確認（AI 顧問 + Design Tier 推薦，最多 3 輪）
  → BDD→UI 翻譯（Haiku，快取在 FlowState.uiuxUISpec）
  → 5 變體生成 + 用戶選擇 → extractVariantConcept()
  → Implementation: generateStructure(+Interaction) → generateAnimations() → generateRwd()
  → Quality Gate 自動觸發
  → 迭代修改（refineCode）↔ 部署（deployer）↔ 回滾
```

### Fast Build Pipeline（快速模式）

```
用戶描述（mode=fast）→ 跳過 Classifier
  → detectDesignTier（規則式）→ inferProductType → buildDefaultDesignSystem → inferInteractionHint
  → generateStructure(+Interaction, streaming) → generateAnimations(streaming) → generateRwd(streaming)
  → runQualityGate（靜態檢查，不做 LLM 修復）
  → phase='uiux_complete'（複用所有迭代/部署/回滾邏輯）
  3 次 LLM | 0 次用戶交互 | 60-90 秒
```

- **Design Tier**：`functional`（dashboard/SaaS，禁漸層/glow）vs `creative`（landing page，允許大膽設計）
- **串流預覽**：生成時 Socket.io `preview_update` 即時推送，前端 Sandpack 增量更新（`useSandpack().sandpack.updateFile()`）
- **Variant 概念**：`VariantConcept` 注入所有生成 prompt，確保創意方向一致

### Deployer Pipeline

```
sanitizeCodeForDeploy（6 類自動修復）
  → verifyBuildLocally（VPS /tmp 建臨時 Next.js，build 失敗 LLM 修復最多 3 輪）
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
| `line-bot.ts` | `/api/line/webhook` | LINE Bot Webhook（簽名驗證 + 事件分發），raw body 在 express.json 之前 |

前端 Proxy：`app/api/vps/[...path]/route.ts` 將 `/api/vps/*` 轉發到 VPS 後端。

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
| `009_remove_audit_logs.sql` | 移除 audit_logs 表 |
| `010_add_user_providers.sql` | 帳號綁定（多 OAuth provider） |
| `011_add_line_active_conversations.sql` | LINE Bot 活躍對話映射表 |
| `add_uiux_columns.sql` | UIUX 相關欄位 |

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

- **新增 phase 必須三處同步**：`handleContinueFlow` 路由 + `FlowState` 型別 + 前端 `richContent.type` union
- **動畫庫是 `motion/react`**，不是 `framer-motion`
- **字體只能用 `next/font`**，禁止 `<link>` / `@import` Google Fonts
- **Tailwind v4**：用 `@import "tailwindcss"`，不是 v3 的 `@tailwind`
- **Tailwind config 禁止 CSS 變數引用**：`generateTailwindConfig()` 必須用硬編碼值（`'9999px'` 非 `'var(--radius-full)'`），否則部署後 CSS 變數可能遺失導致樣式失效
- **`app/components/templates/` 已廢棄**，PreviewPanel 用 Sandpack 渲染
- **deployer_complete 路由順序**：先檢查「部署」→ 再檢查「回滾」→ 最後才是迭代修改
- **文檔與實作同步**：改後端流程 → 同步更新 `uiux-skill/instructions/` + 此文件
- **`handleCodePhaseRedo` 需要快照**：`uiuxStructureCode`/`uiuxAnimationCode`，否則 redo 在已修改代碼上重做
- **`verifyBuildLocally` 的修復結果必須同步回 DB**：否則預覽和部署代碼分岔
- **Anthropic SDK v0.72+**：大 `max_tokens` 必須用 `messages.stream()` + `await stream.finalMessage()`
- **Skill 函數提前 return 必須保存 FlowState**：否則 `handleContinueFlow` 找不到 state → 用戶對話永久卡死
- **Formulation phase 必須設 `formulationStartedAt`**：否則中斷後無法觸發超時恢復。`formulation` phase + `waitingForReply=false` 代表正在生成中，handleContinueFlow 會攔截用戶輸入 + 15 分鐘超時偵測
- **Formulation checkpoint 每 3 個 feature 保存一次**：中斷恢復時跳過已完成的 feature，成功後必須清理所有 `formulation*` 暫存欄位

## 核心原則

1. **無腦補原則**：嚴格遵守規格，不擅自假設
2. **summary 一致**：Action summary 必須與 Feature 名稱一致
3. **自我修復**：驗證失敗時進入修正迴圈（最多 3 次）
4. **不直連資料庫**：前端透過 VPS API 操作資料，禁止 `accept-data-loss`

## 環境變數

前端（`.env.local`）：`VPS_API_URL`, `NEXT_PUBLIC_VPS_API_URL`, `NEXT_PUBLIC_VPS_WS_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_LIFF_ID`

後端（`tellcraft-backend/.env`）：`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `ANTHROPIC_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`, `LINE_BOT_CHANNEL_SECRET`, `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN`, `LIFF_ID`, `VERCEL_ACCESS_TOKEN`, `VERCEL_TEAM_ID`, `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `PORKBUN_API_KEY`, `PORKBUN_SECRET_KEY`, `UPLOAD_DIR`, `UPLOAD_BASE_URL`
