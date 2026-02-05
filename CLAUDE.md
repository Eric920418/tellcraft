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
| `bdd-spec` | 需求釐清 + BDD 規格產出（5 階段：PRD Discovery → Clarify → Formulation → Spec Discovery → Actions Design）|
| `uiux` | 前端介面設計（4 階段：Design Discovery → Design Lab → Implementation → Quality Gate）|
| `deployer` | Vercel 部署 |
| `domain-manager` | 網域管理入口 |

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

## 專案結構

```
app/                       # Next.js 前端（Vercel）
├── actions/               # Server Actions（index.ts, admin.ts, storage.ts）
├── hooks/                 # useAuth.ts, useVpsWebSocket.ts
├── lib/                   # vps-api.ts, llm.ts, supabase/
├── components/            # UI 元件（reactbits 風格動效）
├── dashboard/             # 用戶/管理員儀表板
└── auth/                  # OAuth 登入

tellcraft-backend/         # Express 後端（VPS）
├── src/
│   ├── index.ts           # Express + Socket.io + BullMQ 入口
│   ├── routes/            # auth.ts, conversation.ts, project.ts, health.ts
│   ├── workers/           # orchestrator.ts
│   └── services/          # classifier.ts, registry.ts, bdd-session.ts
└── ecosystem.config.js    # PM2 配置

spec/                      # BDD 規格產出
├── data/schema.sql
├── features/*.feature     # Feature Files
└── actions/actions.yml

bdd-spec/                  # BDD Skill 定義
├── instructions/          # 5 階段執行指南
├── rules/                 # 格式規範
└── scripts/               # 驗證腳本（lint-gherkin-format.ts, validate-feature.ts）

uiux-skill/                # UIUX Skill 定義
├── instructions/          # 4 階段執行指南
└── rules/baseline-ui.md   # UI 技術約束
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
