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

# 檢查
pnpm lint                 # ESLint
pnpm typecheck            # TypeScript 型別檢查

# BDD 規格驗證（Formulation 後必須依序執行）
npx ts-node bdd-spec/scripts/lint-gherkin-format.ts spec/features/   # 第一步：ISA Format Lint
npx ts-node bdd-spec/scripts/validate-feature.ts spec/features/      # 第二步：結構驗證
# 驗證腳本選項：--json, --strict, --fix

# VPS 後端部署（tellcraft-backend/）
ssh -i ~/Desktop/LightsailDefaultKey-ap-northeast-1.pem ubuntu@54.238.4.117 '~/deploy.sh'
```

## 系統架構

### 雙端架構：Vercel 前端 + VPS 後端

```
┌─────────────────┐         ┌─────────────────────────────────────┐
│  Vercel (前端)   │────────>│  VPS (54.238.4.117:8080)           │
│  tellcraft.com  │  HTTP   │  ├─ Express API (Port 3100)         │
│  Next.js 16     │  WS     │  ├─ BullMQ Worker（任務編排）        │
└─────────────────┘         │  ├─ Socket.io（即時通訊）            │
                            │  ├─ PostgreSQL（資料庫）             │
                            │  └─ Redis（隊列 + 狀態）             │
                            └─────────────────────────────────────┘
```

**為什麼遷移到 VPS**：Vercel Serverless 超時限制（10-60 秒）無法處理長時間 LLM 任務。

### 核心模組

| 模組 | 路徑 | 職責 |
|------|------|------|
| **VPS Orchestrator** | `tellcraft-backend/src/workers/orchestrator.ts` | BullMQ Worker，處理用戶請求 |
| **Classifier** | `tellcraft-backend/src/services/classifier.ts` | AI 意圖分類 |
| **Registry** | `tellcraft-backend/src/services/registry.ts` | Skill 註冊表 |
| **Server Actions** | `app/actions/index.ts` | 30+ 前端 Actions |
| **VPS API Client** | `app/lib/vps-api.ts` | 前端呼叫 VPS 的 HTTP 客戶端 |
| **WebSocket Hook** | `app/hooks/useVpsWebSocket.ts` | 即時訊息推送 |

### Skill 系統

| Skill | 用途 | 觸發詞 |
|-------|------|--------|
| `bdd-spec` | 需求釐清 + BDD 規格產出 | 需求、幫我做、幫我建 |
| `coder` | 程式碼生成（自癒 3 次） | 生成程式碼、實作 |
| `deployer` | Vercel 部署 | 部署、上線 |
| `domain-manager` | 網域管理入口 | 網域、domain |
| `domain-purchase` | Porkbun 購買網域 | 買網域 |
| `domain-dns` | Cloudflare DNS + Vercel 綁定 | 設定 DNS |

### 認證系統（VPS 自建 JWT）

```
登入頁 → Vercel Proxy → VPS OAuth → JWT Token → localStorage + Cookie
```

| 檔案 | 職責 |
|------|------|
| `app/hooks/useAuth.ts` | Client-side JWT auth hook |
| `app/api/auth/google/` | Google OAuth Vercel proxy |
| `app/api/auth/line/` | LINE OAuth Vercel proxy |
| `tellcraft-backend/src/routes/auth.ts` | VPS OAuth 處理 |

**雙軌儲存**：localStorage 供前端 hook 使用，Cookie 供 middleware/Server Components 使用。

## 專案結構

```
app/                       # Next.js 前端（Vercel）
├── actions/               # Server Actions（30+）
├── hooks/useAuth.ts       # JWT 認證 hook
├── hooks/useVpsWebSocket.ts # WebSocket hook
├── lib/vps-api.ts         # VPS API 客戶端
├── lib/supabase/          # Supabase clients
├── components/            # UI 元件（reactbits 風格動效）
├── dashboard/             # 用戶/管理員儀表板
└── auth/                  # OAuth 登入

tellcraft-backend/         # Express 後端（VPS）
├── src/
│   ├── index.ts           # Express + Socket.io + BullMQ
│   ├── routes/            # API 路由
│   ├── workers/           # BullMQ Workers
│   └── services/          # 業務邏輯（classifier, registry）
├── nginx/tellcraft.conf   # Nginx 配置
└── ecosystem.config.js    # PM2 配置

spec/                      # BDD 規格產出
├── data/schema.sql
├── features/*.feature     # 14 個 Feature Files
└── actions/actions.yml

bdd-spec/                  # BDD Skill 定義
├── instructions/          # 5 階段執行指南
├── rules/                 # 格式規範
└── scripts/               # 驗證腳本
```

## BDD 規格格式（sdd.os ISA）

| 步驟類型 | 格式 |
|----------|------|
| Action 呼叫 | `{summary}, call table:` |
| 成功回應 | `{summary}成功, with table:` |
| 操作失敗 | `操作失敗` |
| Entity 驗證 | `存在一個{entity}, with table:` |

**驗證錯誤代碼**：E001（缺 Action 註解）、E002（缺 Summary）、E003（缺 Feature）、E004（Summary 不一致）、E005（Rule 缺標註）、E006（When 格式錯）、E008（沒 Example）

## 核心原則

1. **無腦補原則**：嚴格遵守規格，不擅自假設
2. **summary 一致**：Action summary 必須與 Feature 名稱一致
3. **自我修復**：驗證失敗時進入修正迴圈（最多 3 次）

## 環境變數

```bash
# Vercel 前端
VPS_API_URL=http://54.238.4.117:8080
NEXT_PUBLIC_VPS_API_URL=http://54.238.4.117:8080
NEXT_PUBLIC_VPS_WS_URL=http://54.238.4.117:8080
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# VPS 後端（tellcraft-backend/.env）
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
LINE_CHANNEL_ID=xxx
LINE_CHANNEL_SECRET=xxx
JWT_SECRET=xxx
ANTHROPIC_API_KEY=xxx
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
```
