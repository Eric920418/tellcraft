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
git pull && pnpm build && pm2 restart tellcraft-backend
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

### 核心模組

| 模組 | 路徑 | 職責 |
|------|------|------|
| **Orchestrator** | `tellcraft-backend/src/workers/orchestrator.ts` | BullMQ Worker，核心流程引擎，`FlowState.phase` 狀態機 |
| **Classifier** | `tellcraft-backend/src/services/classifier.ts` | 三層防禦：Prefilter → Meta Intent → Skill 分類 |
| **UIUX Generation** | `tellcraft-backend/src/services/uiux-generation.ts` | 設計生成核心（Brief/Variants/Structure/Animation/RWD/Refine） |
| **Quality Gate** | `tellcraft-backend/src/services/quality-gate.ts` | A11y/Performance/CodeQuality 靜態檢查 + LLM 自動修復 |
| **Deployer** | `tellcraft-backend/src/services/deployer.ts` | sanitize → build 驗證 → Vercel 部署 → 回滾 |
| **Fast Build** | `tellcraft-backend/src/services/fast-build-generation.ts` | 快速模式輔助：tier 偵測、產品推斷、默認 DesignSystem（零 LLM） |
| **Sandpack 預覽** | `app/lib/sandpack-utils.ts` + `app/components/uiux/SandpackPreview.tsx` | UIUX 預覽核心，Sandpack 真實 React 渲染（取代 regex TSX→HTML） |
| **VPS API Client** | `app/lib/vps-api.ts` | 前端呼叫 VPS 的 HTTP 客戶端 |
| **WebSocket Hook** | `app/hooks/useVpsWebSocket.ts` | 即時訊息推送（型別定義） |

### Skill 系統

| Skill | 用途 |
|-------|------|
| `bdd-spec` | 需求釐清 + BDD 規格產出（5 階段：Discovery → Clarify → Formulation → Actions Design → ISA Config）|
| `uiux` | 前端介面設計（3 階段：Design Discovery → Design Lab → Implementation）|
| `quality-gate` | UIUX RWD 完成後**自動觸發**，critical 問題 LLM 自動修復（最多 3 輪）|
| `deployer` | UIUX 代碼 → Next.js → Vercel 部署（用戶說「部署」觸發），支援迭代 + 回滾 |
| `fast-build` | 快速建站：一句話 → 跳過 BDD/Discovery → 直接 Structure → Animation → RWD → 靜態 QG → Preview |

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
| `uiux_complete` / `uiux_iterating` | UIUX 完成（可迭代或部署）/ 迭代修改中 |
| `fast_generating` | 快速模式生成中（攔截用戶輸入，完成後 → `uiux_complete`） |
| `deployer_confirm` / `deployer_deploying` / `deployer_failed` / `deployer_complete` | 部署流程 |
| `deployer_rollback_select` | 等待用戶選擇回滾版本 |

### UIUX Pipeline 概覽

```
Discovery（Path A 問卷 / Path B 模板）
  → Design Brief 確認（AI 顧問 + Design Tier 推薦，最多 3 輪）
  → BDD→UI 翻譯（Haiku，快取在 FlowState.uiuxUISpec）
  → 5 變體生成 + 用戶選擇 → extractVariantConcept()
  → Implementation: generateStructure() → generateAnimations() → generateRwd()
  → Quality Gate 自動觸發
  → 迭代修改（refineCode）↔ 部署（deployer）↔ 回滾
```

### Fast Build Pipeline（快速模式）

```
用戶描述（mode=fast）→ 跳過 Classifier
  → detectDesignTier（規則式）→ inferProductType → buildDefaultDesignSystem
  → generateStructure(streaming) → generateAnimations(streaming) → generateRwd(streaming)
  → runQualityGate（靜態檢查，不做 LLM 修復）
  → phase='uiux_complete'（複用所有迭代/部署/回滾邏輯）
  3 次 LLM | 0 次用戶交互 | 60-90 秒
```

- **FlowState 擴展**：`fastMode?: boolean`、`fastModeProductType?: string`
- **ProcessMessageData**：`mode?: 'fast' | 'fine'`，前端 HeroSection 切換
- **完成後完全複用**：`handleDesignIteration`、`executeDeployerSkill`、`handleDeployRollback`

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

### 認證系統

`登入頁 → Vercel Proxy → VPS OAuth → JWT Token → localStorage（前端 hook）+ Cookie（middleware）`

### 代碼存儲：project_files 表

`(project_id, skill_source, file_path)` 唯一索引，UPSERT。`skill_source`: uiux/code/merge。Deployer 優先讀此表，fallback `bdd_sessions`。

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
- **`app/components/templates/` 已廢棄**，PreviewPanel 用 iframe + 後端 HTML
- **deployer_complete 路由順序**：先檢查「部署」→ 再檢查「回滾」→ 最後才是迭代修改
- **文檔與實作同步**：改後端流程 → 同步更新 `uiux-skill/instructions/` + 此文件
- **`handleCodePhaseRedo` 需要快照**：`uiuxStructureCode`/`uiuxAnimationCode`，否則 redo 在已修改代碼上重做
- **`verifyBuildLocally` 的修復結果必須同步回 DB**：否則預覽和部署代碼分岔
- **Anthropic SDK v0.72+**：大 `max_tokens` 必須用 `messages.stream()` + `await stream.finalMessage()`

## 核心原則

1. **無腦補原則**：嚴格遵守規格，不擅自假設
2. **summary 一致**：Action summary 必須與 Feature 名稱一致
3. **自我修復**：驗證失敗時進入修正迴圈（最多 3 次）
4. **不直連資料庫**：前端透過 VPS API 操作資料，禁止 `accept-data-loss`

## 環境變數

前端（`.env.local`）：`VPS_API_URL`, `NEXT_PUBLIC_VPS_API_URL`, `NEXT_PUBLIC_VPS_WS_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

後端（`tellcraft-backend/.env`）：`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `ANTHROPIC_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`
