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
pnpm install && pnpm dev  # 啟動開發伺服器（http://localhost:3100）
pnpm build                # TypeScript 編譯
pnpm typecheck            # 型別檢查

# BDD 規格驗證（修改 Feature Files 後必須依序執行）
npx ts-node bdd-spec/scripts/lint-gherkin-format.ts spec/features/   # ISA Format Lint
npx ts-node bdd-spec/scripts/validate-feature.ts spec/features/      # 結構驗證
# 選項：--json, --strict, --fix

# VPS 部署（SSH 到 VPS 後執行）
~/deploy.sh               # 自動 git pull + build + pm2 restart
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

**為什麼用 VPS**：Vercel Serverless 超時限制（10-60 秒）無法處理長時間 LLM 任務。

### 核心模組

| 模組 | 路徑 | 職責 |
|------|------|------|
| **Orchestrator** | `tellcraft-backend/src/workers/orchestrator.ts` | BullMQ Worker，處理用戶請求 |
| **Classifier** | `tellcraft-backend/src/services/classifier.ts` | AI 意圖分類，決定使用哪個 Skill |
| **Registry** | `tellcraft-backend/src/services/registry.ts` | Skill 註冊表 |
| **Server Actions** | `app/actions/index.ts` | 30+ 前端 Actions |
| **VPS API Client** | `app/lib/vps-api.ts` | 前端呼叫 VPS 的 HTTP 客戶端 |
| **WebSocket Hook** | `app/hooks/useVpsWebSocket.ts` | 即時訊息推送 |

### Skill 系統

| Skill | 用途 |
|-------|------|
| `bdd-spec` | 需求釐清 + BDD 規格產出（5 階段：Discovery → Clarify → Formulation → Actions Design → ISA Config）|
| `uiux` | 前端介面設計（3 階段：Design Discovery → Design Lab → Implementation）|
| `quality-gate` | 自動品質檢查（UIUX Implementation 完成後自動觸發，檢查 A11y/Performance/Code Quality，critical 問題自動 LLM 修復） |
| `deployer` | 將 UIUX 生成的代碼包裝成 Next.js 部署到 Vercel（UIUX 完成後用戶說「部署」觸發）|
| `domain-manager` | 網域管理入口 |

#### UIUX Skill 架構細節

**Design Discovery 雙軌流程**：
- Path A（有想法）：4 步問卷 feeling → reference → color → layout
- Path B（沒想法）：模板選擇器

**Design Brief 確認**（Discovery → Design Lab 之間）：AI 設計顧問總結設計方向、推薦 Design Tier，用戶可確認或調整（最多 3 輪）。

**Design Tier（功能型 vs 創意型）**：
- `DesignTier = 'functional' | 'creative'`
- functional：dashboard/SaaS/後台，禁漸層/glow/多色，動畫克制
- creative：landing page/品牌官網，允許漸層、多色、獨特字體、大膽佈局

**Implementation 三階段生成**：`generateStructure()` → `generateAnimations()` → `generateRwd()`（每階段可確認或重做，Stage 2/3 有 fallback）

**串流實時預覽**：三個生成函數都支援 `onPartialCode` callback，LLM 串流期間每完成一個 code block 就透過 Socket.io `preview_update` 事件推送給前端。前端用 `convertToPreviewHtmlSafe()` 容錯轉換 + `injectStreamingAnimation()` fade-in，用戶能看到網頁漸進式構建。Throttle 雙條件：新區塊 + >= 1500ms。

**關鍵函數**（`tellcraft-backend/src/services/uiux-generation.ts`）：
- `generateDesignBrief()` - Domain Exploration + Signature Element
- `generateDesignVariants()` - 5 變體 + Anti-Default 哲學
- `generateStructure()` - 靜態桌面版 + Professional UI Rules（支援 streaming）
- `generateAnimations()` - 動畫增強（支援 streaming）
- `generateRwd()` - 響應式 + Pre-Delivery Checklist（支援 streaming）
- `parseCompletedFileBlocks()` - 串流解析已閉合 code block（for streaming preview）
- `buildStreamingHandler()` - Throttled streaming callback builder
- `synthesizeVariants()` - 變體合併（layout/interaction metadata）
- `getCraftFoundations()` - 共用品質底線
- `getStructureConstraints(tier)` / `getAnimationConstraints(tier)` / `getVariantPromptHint(tier)` - Tier 約束集

#### Quality Gate（UIUX 完成後自動觸發）

**流程**：RWD 完成 → 靜態品質檢查 → 有 critical 問題則 LLM 自動修復（最多 3 輪）→ 品質報告 → 完成

**關鍵函數**（`tellcraft-backend/src/services/quality-gate.ts`）：
- `runQualityGate(code, designTier)` - 執行 3 類靜態檢查，返回 QualityReport
- `autoFixCriticalIssues(code, issues)` - 用 Haiku 修復 critical issues
- `checkAccessibility()` - focus-visible、aria-label、form labels、img alt、heading hierarchy
- `checkPerformance()` - 只動畫 transform/opacity、reduced-motion、no transition-all
- `checkCodeQuality()` - motion/react import、Tailwind v4 syntax、next/font、no h-screen

#### Deployer Skill（UIUX 完成後用戶觸發）

**觸發方式**：用戶在 `uiux_complete` 階段說「部署」→ classifier 分類為 deployer 或 handleContinueFlow 直接匹配。

**流程**：prepareDeployment（前檢查 + sanitize）→ 用戶確認（顯示修復項）→ executeDeployment（verifyBuildLocally → createVercelProject → deployFiles → waitForReady → 更新 DB）

**部署前預檢（`sanitizeCodeForDeploy()`）**：
- `framer-motion` → `motion/react` import 修正
- 缺少 `'use client'` 自動補充（偵測 hooks/motion 使用）
- `motion.*` spread props TypeScript 類型衝突修復（注入 `safeMotionProps` helper）
- Google Fonts `<link>` / `@import` 移除（應用 next/font）
- 自動掃描第三方 import → 補充 `KNOWN_PACKAGES` 對應版本到 package.json
- 檔案間相對引用檢查（broken import warning）

**本地 Build 驗證（`verifyBuildLocally()`）**：
- 在 VPS 上建立 `/tmp/tellcraft-build-xxx/` 臨時 Next.js 專案
- 執行 `npm install` + `next build`（`NODE_OPTIONS=--max-old-space-size=1536`）
- Build 失敗 → `parseBuildErrors()` 解析（TS error / module not found / syntax）→ `fixBuildErrors()` 用 Haiku LLM 修復
- 最多 3 輪修復，全失敗降級 `ignoreBuildErrors` 部署
- npm install 失敗時自動解析並移除壞依賴重試
- `wrapInNextJs()` 已移除 `ignoreBuildErrors: true`，只在降級時由 `wrapInNextJsWithIgnoreErrors()` 恢復

**對話內迭代**（部署後持續修改）：
- `deployer_complete` 階段不再靜默吞訊息
- 用戶輸入修改建議 → `handleDesignIteration()` → `refineCode()` 修改代碼 → 預覽 → `uiux_complete`
- 用戶再說「部署」→ 重新部署，循環不限次
- `uiux_complete` 階段有代碼時，非部署訊息也路由到迭代

**部署回滾**：
- 用戶說「回滾」→ `handleDeployRollback()` → 顯示部署歷史 → `deployer_rollback_select`
- 用戶選版本 → `handleRollbackSelection()` → `rollbackToDeployment()` → Vercel Promote/Alias API

**關鍵函數**（`tellcraft-backend/src/services/deployer.ts`）：
- `sanitizeCodeForDeploy(code)` - 部署前預檢 + 自動修復（6 類問題）
- `verifyBuildLocally(code, projectName, tailwindConfig, ...)` - 本地 build 驗證 + LLM 自動修復迴圈（最多 3 輪）
- `parseBuildErrors(output)` - 解析 next build 輸出中的 TS/module/syntax 錯誤
- `fixBuildErrors(code, errors, buildOutput, deps)` - Haiku LLM 修復 build 錯誤
- `prepareDeployment(projectId, userId)` - 驗證專案、代碼、環境變數 + 呼叫 sanitize
- `executeDeployment(projectId, code, tailwindConfig, onProgress, options?)` - 執行部署（含 build 驗證）
- `wrapInNextJs(code, projectName, tailwindConfig, extraDeps?, injectedFiles?)` - UIUX 代碼 → 完整 Next.js 專案
- `wrapInNextJsWithIgnoreErrors(...)` - 降級用：恢復 ignoreBuildErrors: true
- `listProjectDeployments(projectId)` - 查詢部署歷史
- `rollbackToDeployment(projectName, deploymentId)` - Vercel 回滾

**關鍵函數**（`tellcraft-backend/src/services/uiux-generation.ts`）：
- `refineCode(currentCode, userFeedback, designContext)` - 基於用戶反饋修改現有代碼

**前端元件**（`app/components/deployer/`）：
- `DeployConfirm.tsx` - 部署確認卡片（顯示專案名、檔案數、預計 URL）
- `DeployProgress.tsx` - 部署進度條
- `DeployResult.tsx` - 部署結果（成功顯示 URL / 失敗顯示錯誤 + 迭代提示）
- `DeploymentHistory.tsx` - 部署歷史列表 + 回滾按鈕

### 認證系統

```
登入頁 → Vercel Proxy → VPS OAuth → JWT Token → localStorage + Cookie
```

- `app/hooks/useAuth.ts` - Client-side JWT auth hook
- `app/api/auth/google/`, `app/api/auth/line/` - OAuth Vercel proxy
- `tellcraft-backend/src/routes/auth.ts` - VPS OAuth 處理
- **雙軌儲存**：localStorage 供前端 hook 使用，Cookie 供 middleware/Server Components 使用

### 資料流：前端 → VPS

前端**不直連資料庫**，所有資料操作通過 VPS HTTP API：
```
Vercel Server Actions → app/lib/vps-api.ts → VPS Express API → PostgreSQL
```

### 生成代碼存儲：project_files 表

各 Skill 生成的代碼獨立存儲在 `project_files` 表（一檔一行），支援多 Skill 來源：
- `skill_source`: `uiux` / `code`（未來）/ `merge`（未來合併用）
- `file_type`: `page` / `component` / `style` / `config`
- UPSERT on `(project_id, skill_source, file_path)`
- Orchestrator 每個生成階段（Structure/Animation/RWD+QG）自動寫入
- Deployer 優先從 `project_files` 讀取，舊專案 fallback 到 `bdd_sessions`
- API: `GET /api/project/:id/files?skill_source=uiux`

## 專案結構

```
app/                       # Next.js 前端（Vercel）
├── actions/               # Server Actions（index.ts, admin.ts, storage.ts）
├── hooks/                 # useAuth.ts, useVpsWebSocket.ts
├── lib/                   # vps-api.ts, llm.ts, supabase/
├── components/            # UI 元件（uiux/ 下有 VariantPicker, CodePreview, PreviewPanel 等）
├── dashboard/             # 用戶/管理員儀表板
└── auth/                  # OAuth 登入

tellcraft-backend/         # Express 後端（VPS）
├── src/
│   ├── index.ts           # Express + Socket.io + BullMQ 入口
│   ├── routes/            # auth, conversation, project, templates, dashboard, session 等
│   ├── workers/           # orchestrator.ts（BullMQ Worker，核心流程引擎）
│   └── services/          # classifier, registry, bdd-session, uiux-generation,
│                          # prd-discovery, formulation, spec-discovery
└── ecosystem.config.js    # PM2 配置

spec/                      # BDD 規格產出
├── data/schema.sql
├── features/*.feature     # Feature Files
└── actions/actions.yml

bdd-spec/                  # BDD Skill 定義
├── instructions/          # 5 階段執行指南（discovery → clarify → formulation → actions-design → isa-config）
├── rules/                 # formulation-rules.md
└── scripts/               # 驗證腳本（lint-gherkin-format.ts, validate-feature.ts）

uiux-skill/                # UIUX Skill 定義
├── instructions/          # 3 階段執行指南（design-discovery → design-lab → implementation）
└── rules/baseline-ui.md   # UI 技術約束 + Craft Foundations

quality-gate-skill/        # Quality Gate Skill 定義
├── skill.md               # Skill metadata + 流程概覽
└── instructions/          # 01-quality-check.md（檢查規則 + 修復策略）
```

## BDD 規格格式（sdd.os ISA）

| 步驟類型 | 格式 |
|----------|------|
| Action 呼叫 | `{summary}, call table:` |
| 成功回應 | `{summary}成功, with table:` |
| 操作失敗 | `操作失敗` |
| Entity 驗證 | `存在一個{entity}, with table:` |

**驗證錯誤代碼**：
- E001: 缺少 Action 註解
- E002: 缺少 Summary 註解
- E003: 缺少 Feature 宣告
- E004: Summary 與 Feature 名稱不一致
- E005: Rule 缺少前置/後置標註
- E006: When 步驟格式錯誤
- E008: 沒有 Example

## 重要注意事項

- **`app/components/templates/` 已廢棄**：React 模板組件不再使用，PreviewPanel 改用 iframe + 後端 HTML 渲染
- **動畫庫是 `motion/react`**，不是 `framer-motion`（import path 已遷移）
- **`uiux-generation.ts` 使用模組級 Anthropic 單例**
- **文檔與實作同步**：修改後端流程時必須同步更新 `uiux-skill/instructions/` 和此文件

## 核心原則

1. **無腦補原則**：嚴格遵守規格，不擅自假設
2. **summary 一致**：Action summary 必須與 Feature 名稱一致
3. **自我修復**：驗證失敗時進入修正迴圈（最多 3 次）
4. **不直連資料庫**：前端透過 VPS API 操作資料，禁止 `accept-data-loss`

## 關鍵 LLM 函數（app/lib/llm.ts）

| 函數 | 用途 |
|------|------|
| `runPrdDiscovery` | PRD Discovery（使用 A1-D2 檢查清單）|
| `filterDuplicateQuestions` | 語意去重（用 Haiku 判斷相似度）|
| `generateSchemaSql` | 產出 SQL Schema |
| `generateFeatureFiles` | 產出 Feature Files |
| `fixMultipleFeatures` | 批量修復 Feature 格式 |
| `validateFeatureContent` | 驗證 Feature 格式（本地 Regex，不調用 LLM）|

## 環境變數

前端（`.env.local`）：
- `VPS_API_URL`, `NEXT_PUBLIC_VPS_API_URL`, `NEXT_PUBLIC_VPS_WS_URL` - VPS 後端位址
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase

後端（`tellcraft-backend/.env`）：
- `DATABASE_URL`, `REDIS_URL` - 資料庫連線
- `JWT_SECRET` - JWT 簽名密鑰
- `ANTHROPIC_API_KEY` - Claude API
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth
- `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET` - LINE OAuth
