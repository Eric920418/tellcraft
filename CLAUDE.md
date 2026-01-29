# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

Tellcraft 是一個 **AI 驅動的自動化開發平台**。用戶描述需求，AI 自動釐清細節、生成程式碼、部署上線。

核心流程：`描述需求 → AI 釐清 → 確認規格 → 自動生成 → 一鍵部署`

## 常用指令

```bash
# 開發
pnpm install          # 安裝依賴
pnpm dev              # 啟動 Next.js（http://localhost:3000）
npx inngest-cli@latest dev  # 啟動 Inngest Dev Server（http://localhost:8288）

# 檢查
pnpm lint             # ESLint
pnpm typecheck        # TypeScript 型別檢查

# BDD 規格驗證（Formulation 後必須依序執行）
npx ts-node bdd-spec/scripts/lint-gherkin-format.ts spec/features/   # 第一步：ISA Format Lint
npx ts-node bdd-spec/scripts/validate-feature.ts spec/features/      # 第二步：結構驗證

# 驗證腳本選項
--json                # JSON 輸出
--strict              # 嚴格模式（警告也視為錯誤）
--fix                 # 自動修復（實驗性）
```

## 系統架構

### 整體架構：Inngest 是大腦，Modal 是手腳

```
用戶請求（tellcraft.com）
         ↓
┌─────────────────────────────────────────────────┐
│  Inngest（大腦）- 任務編排、狀態追蹤            │
│  ├─ Intent Classifier → 識別意圖               │
│  ├─ Skill Registry → 路由到對應 Skill          │
│  └─ Workflow Executor → 執行流程               │
└─────────────────────────────────────────────────┘
         ↓ 觸發
┌─────────────────────────────────────────────────┐
│  Modal（手腳）- 執行 sdd.os、TDD 迭代           │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│  Server Actions（14 個）- API 封裝              │
│  → Vercel · Supabase · Cloudflare · Porkbun    │
└─────────────────────────────────────────────────┘
```

### 核心模組

| 模組 | 路徑 | 職責 |
|------|------|------|
| **Orchestrator** | `app/inngest/functions/orchestrator.ts` | 主編排函數，處理用戶請求的完整流程 |
| **Classifier** | `app/inngest/classifier.ts` | AI 意圖分類（Anthropic API + 規則 fallback） |
| **Registry** | `app/inngest/registry.ts` | Skill 註冊表，定義觸發詞和元數據 |
| **Server Actions** | `app/actions/index.ts` | 22 個核心 Actions（含 Chat、Auth、部署整合）|

### Skill 系統

6 個已註冊 Skills，各有獨立觸發詞和執行邏輯：

| Skill | 用途 | 觸發詞 |
|-------|------|--------|
| `bdd-spec` | 需求釐清 + BDD 規格產出 | 需求、幫我做、幫我建 |
| `coder` | 程式碼生成（含自癒機制，最多 3 次重試） | 生成程式碼、實作 |
| `deployer` | 部署到 Vercel（Deployments API） | 部署、上線 |
| `domain-manager` | 網域管理入口 | 網域、domain |
| `domain-purchase` | Porkbun 購買網域 | 買網域、購買網域 |
| `domain-dns` | Cloudflare DNS + Vercel 綁定 | 設定 DNS、自有網域 |

### 執行流程

```
用戶輸入 → Intent Classification → 路由到 Skill
                ↓
        bdd-spec: 多輪對話（waitForEvent）→ 產出規格
        coder: generateCode（自癒 3 次）→ 專案狀態變 testing
        deployer: Vercel Deployments API → 詢問網域設定
```

### 認證系統

支援 Google 和 LINE OAuth 登入，使用 `@supabase/ssr` 實現 SSR 友善的 session 管理：

```
登入頁 → Google/LINE OAuth → Supabase Auth → Session Cookie → 受保護路由
```

| 檔案 | 職責 |
|------|------|
| `app/lib/supabase/client.ts` | Browser client（前端）|
| `app/lib/supabase/server.ts` | Server client（Server Actions）|
| `middleware.ts` | Session refresh + 路由保護 |
| `app/auth/callback/route.ts` | OAuth callback（PKCE）|

### Chat 串接 Inngest

前端輸入 → Inngest Orchestrator → AI 回覆 → 輪詢取得：

```
用戶輸入 → initializeSession（匿名）/ initializeSessionFromAuth（已登入）
    → sendMessageAndTrigger → triggerUserRequest
    → Inngest Orchestrator → bdd-spec skill
    → AI 回覆寫入 DB → 前端 getConversationMessages 輪詢
    → 用戶回覆 → replyToConversation → triggerUserReply → Inngest 恢復
```

## 專案結構

```
app/
├── actions/           # Server Actions（22 個）
│   ├── index.ts       # 主匯出：核心 + Chat + Auth Actions
│   ├── deploy.ts      # Vercel Deployments API 整合
│   ├── cloudflare.ts  # DNS 管理
│   ├── porkbun.ts     # 網域購買
│   └── domain.ts      # 網域工作流程整合
├── inngest/
│   ├── client.ts      # Inngest 客戶端
│   ├── classifier.ts  # 意圖分類器
│   ├── registry.ts    # Skill 註冊表
│   └── functions/
│       └── orchestrator.ts  # 主編排函數（1500+ 行）
├── lib/supabase/      # Supabase clients
│   ├── client.ts      # Browser client
│   └── server.ts      # Server client
├── auth/              # 認證相關
│   ├── login/         # 登入頁面
│   └── callback/      # OAuth callback
├── api/inngest/route.ts     # Inngest webhook endpoint
└── components/              # UI 動效元件（reactbits 風格）

middleware.ts          # Session refresh + 路由保護

spec/                  # BDD 規格產出
├── data/
│   ├── schema.sql
│   └── entity_to_table_mapping.yml
├── features/          # 14 個 Feature Files
└── actions/actions.yml

bdd-spec/              # BDD Skill 定義
├── skill.md           # Skill 元數據與 Schema
├── instructions/      # 5 階段執行指南
├── rules/             # 格式規範
└── scripts/           # 驗證腳本
```

## BDD 規格格式（sdd.os ISA）

| 步驟類型 | 格式 | 範例 |
|----------|------|------|
| Action 呼叫 | `{summary}, call table:` | `建立訂單, call table:` |
| 成功回應 | `{summary}成功, with table:` | `建立訂單成功, with table:` |
| 操作失敗 | `操作失敗` | - |
| Entity 驗證 | `存在一個{entity}, with table:` | `存在一個訂單, with table:` |

### 驗證錯誤代碼

| 代碼 | 說明 |
|------|------|
| E001 | 缺少 Action 註解 |
| E002 | 缺少 Summary 註解 |
| E003 | 缺少 Feature 宣告 |
| E004 | Summary 與 Feature 名稱不一致 |
| E005 | Rule 缺少前置/後置標註 |
| E006 | When 步驟格式錯誤 |
| E008 | 沒有 Example |

## 核心原則

1. **無腦補原則**：嚴格遵守規格，不擅自假設
2. **summary 一致**：Action summary 必須與 Feature 名稱一致
3. **前置/後置標註**：每個 Rule 都必須標註
4. **硬性閘門**：Quality Gate 由腳本強制執行
5. **自我修復**：腳本失敗時進入修正迴圈（最多 3 次）

## 狀態檔案

```
.clarify/
├── overview.md    # 主狀態檔 - 迭代統計
├── data/          # 資料模型釐清項目
├── features/      # 功能模型釐清項目
├── staging/       # 暫存區
└── resolved/      # 已歸檔項目
```

## 環境變數

```bash
# Inngest（Vercel Integration 自動注入）
INNGEST_EVENT_KEY=xxx
INNGEST_SIGNING_KEY=xxx

# Anthropic（Intent Classification）
ANTHROPIC_API_KEY=xxx

# Vercel Deployments API
VERCEL_ACCESS_TOKEN=xxx
VERCEL_TEAM_ID=xxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Cloudflare
CLOUDFLARE_API_TOKEN=xxx
CLOUDFLARE_ACCOUNT_ID=xxx

# Porkbun
PORKBUN_API_KEY=xxx
PORKBUN_SECRET_KEY=xxx
```
