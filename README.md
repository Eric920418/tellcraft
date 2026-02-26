# Tellcraft

> **用對話打造你的軟體產品** | [tellcraft.com](https://tellcraft.com)

Tellcraft 是一個 AI 驅動的自動化開發平台。用戶只需描述需求，AI 會自動釐清細節、生成程式碼、部署上線。

```
描述需求 → AI 釐清 → 確認規格 → 自動生成 → 一鍵部署
```

## 技術棧

| 層級 | 技術 | 說明 |
|------|------|------|
| **前端** | Next.js 16 + React 19 | Vercel 部署，Turbopack |
| **後端** | Express + BullMQ + Socket.io | VPS 部署，PM2 管理 |
| **資料庫** | PostgreSQL（VPS 本地） | 低延遲，自主控制 |
| **佇列/狀態** | Redis | BullMQ 任務佇列 + 串流狀態 |
| **LLM** | Claude Sonnet / Haiku | Anthropic SDK |
| **動畫** | motion/react + Remotion + Three.js | 3D 場景 + 串流動畫 |
| **樣式** | Tailwind CSS v4 | `@import "tailwindcss"` 語法 |
| **預覽** | Sandpack（@codesandbox） | 瀏覽器內真實 React 渲染 |
| **部署** | Vercel API | 代碼 → Next.js → Vercel 自動部署 |
| **CI/CD** | GitHub Actions | push main → VPS 自動部署 |

## 快速開始

```bash
# 前端（Vercel 上的 Next.js）
pnpm install
pnpm dev                  # http://localhost:3000

# 後端（VPS Express）
cd tellcraft-backend
pnpm install && pnpm dev  # http://localhost:3100

# 型別檢查
pnpm typecheck            # 前端
cd tellcraft-backend && pnpm typecheck  # 後端

# BDD 規格驗證
npx ts-node bdd-spec/scripts/lint-gherkin-format.ts spec/features/
npx ts-node bdd-spec/scripts/validate-feature.ts spec/features/
```

### 環境變數

**前端**（`.env.local`）：
`VPS_API_URL` `NEXT_PUBLIC_VPS_API_URL` `NEXT_PUBLIC_VPS_WS_URL` `NEXT_PUBLIC_SUPABASE_URL` `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**後端**（`tellcraft-backend/.env`）：
`DATABASE_URL` `REDIS_URL` `JWT_SECRET` `ANTHROPIC_API_KEY` `GOOGLE_CLIENT_ID` `GOOGLE_CLIENT_SECRET` `LINE_CHANNEL_ID` `LINE_CHANNEL_SECRET` `UPLOAD_DIR` `UPLOAD_BASE_URL`

## 系統架構

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

- 前端**不直連資料庫**：`Server Actions → vps-api.ts → VPS Express → PostgreSQL`
- **為什麼用 VPS**：Vercel Serverless 超時 10-60s，無法處理長時間 LLM 任務
- 前端路徑別名 `@/*` 映射到 `./*`，後端無路徑別名
- 前後端 TypeScript 完全隔離（tsconfig 互相 exclude）

> 詳細架構文檔見 [CLAUDE.md](./CLAUDE.md)（核心模組、Phase 狀態機、Pipeline 流程、API 路由、防雷清單）

## Skill 系統

| Skill | 用途 | LLM |
|-------|------|-----|
| `bdd-spec` | 需求釐清 + BDD 規格產出（Event Storming → Discovery → Formulation → Actions → ISA） | Sonnet |
| `uiux` | 前端介面設計（Design Discovery → Design Lab → Implementation） | Sonnet |
| `fast-build` | 一句話快速建站，跳過 BDD/Discovery，60-90 秒出結果 | Sonnet ×3 |
| `quality-gate` | UIUX RWD 完成後自動觸發，靜態檢查 + LLM 自動修復 | Haiku |
| `deployer` | 代碼 → sanitize → 本地 build 驗證 → Vercel 部署 → 回滾 | Haiku（修復） |
| `iteration` | 迭代修改 + 撤銷上一步 + 版本回滾 | Sonnet |

### 兩種模式

**精細模式（Fine）**：BDD 完成 → 模板匹配 → Discovery → Brief 確認 → 5 變體 → Structure → Animation → RWD → QG

**快速模式（Fast）**：一句話描述 → 規則式推斷（tier/產品類型/配色/佈局） → Structure → Animation → RWD → 靜態 QG

## 已完成功能

| 分類 | 功能 |
|------|------|
| **BDD 規格** | 5 階段釐清、Event Storming、提案模式、草稿批量、變更管理、規格回滾、Scenario Outline、OpenAPI 產出 |
| **UIUX 設計** | 雙軌 Discovery、Design Tier、5 變體、三階段生成、串流即時預覽、BDD→UI 翻譯、Variant 概念注入 |
| **快速建站** | 26 種產品類型、22 套產業配色、App/Website 佈局模式、模板風格整合、智能模板匹配 |
| **品質** | Quality Gate 靜態檢查、LLM 自動修復、RWD 響應式安全網、Tailwind v4→v3 轉換 |
| **部署** | sanitize 6 類預檢、本地 build 驗證（3 輪 LLM 修復）、Vercel 部署、版本回滾 |
| **迭代** | 對話內迭代修改、撤銷上一步、部署歷史回滾、迭代歷史追蹤 |
| **預覽** | Sandpack 真實 React 渲染、串流增量更新、裝置切換、編輯模式、圖片上傳 |
| **動畫** | 3D 軟體鍛造場景（BDD Q&A）、3D 工廠流水線（Fast Build）、Remotion 驅動 |
| **認證** | Google/LINE OAuth、JWT 雙軌（localStorage + Cookie）、訪客→帳號合併 |
| **儀表板** | 用戶統計、專案管理、版本歷史、管理員面板、LLM 用量追蹤 |
| **防護** | 三層防刷（前端冷卻 + API 限速 + Worker 鎖）、Classifier 三層防禦、LLM 自動重試 |
| **UX** | 對話回退、錯誤恢復、自動恢復對話、專案自動命名、Markdown 渲染 |

## 專案結構

```
app/
├── page.tsx              # 主頁面（對話 UI + 狀態管理，~4000 行）
├── actions/              # Server Actions
│   ├── index.ts          # 核心 Actions（對話/訊息/專案/BDD）
│   └── admin.ts          # 管理員 Actions
├── lib/
│   ├── vps-api.ts        # VPS HTTP 客戶端（~1900 行）
│   ├── llm.ts            # LLM 封裝（~2200 行）
│   └── sandpack-utils.ts # Sandpack 預覽工具
├── hooks/
│   ├── useAuth.ts        # JWT 認證
│   └── useVpsWebSocket.ts # WebSocket
├── components/
│   ├── uiux/             # UIUX 元件（SandpackPreview/PreviewPanel/TemplatePicker/PropertyEditor）
│   ├── dashboard/        # 儀表板元件
│   ├── remotion/         # Remotion 動畫（fast-build/ + building-scene/）
│   ├── building-scene/   # 3D 場景（BuildingPlayer + AppMeshes + GhostMesh）
│   └── FastBuildPlayer.tsx # 3D 工廠 Player
├── dashboard/            # 儀表板頁面（/dashboard, /dashboard/admin）
├── auth/                 # 認證（login/callback/post-login）
└── api/
    ├── vps/[...path]/    # VPS Proxy（轉發到後端）
    └── auth/             # OAuth 路由

tellcraft-backend/
├── src/
│   ├── index.ts          # Express + Socket.io + BullMQ 入口
│   ├── workers/
│   │   ├── orchestrator.ts       # 核心流程引擎（~3900 行）
│   │   └── orchestrator-utils.ts # 共用函數（sendMessage/FlowState 等）
│   ├── types/
│   │   └── flow-state.ts         # FlowState 介面（避免循環 import）
│   ├── services/
│   │   ├── uiux-generation.ts    # 設計生成核心
│   │   ├── quality-gate.ts       # 品質檢查 + 自動修復
│   │   ├── deployer.ts           # 部署流程
│   │   ├── iteration-skill.ts    # 迭代 + 撤銷 + 回滾
│   │   ├── fast-build-generation.ts # 快速模式（規則式，零 LLM）
│   │   ├── template-matcher.ts   # 智能模板匹配（零 LLM）
│   │   ├── classifier.ts         # 三層分類防禦
│   │   ├── bdd-to-ui-spec.ts     # BDD→UI 翻譯
│   │   ├── event-storming.ts     # Event Storming
│   │   ├── change-management.ts  # 需求變更管理
│   │   └── conversation-lock.ts  # 對話互斥鎖
│   ├── routes/                   # API 路由（conversation/project/session/bdd/templates/operations/auth/health/upload）
│   ├── db/client.ts              # PostgreSQL 客戶端
│   └── middleware/auth.ts        # JWT 認證中間件
├── migrations/           # DB 遷移（001-008）
└── ecosystem.config.js   # PM2 配置

bdd-spec/                 # BDD Skill 定義（instructions/ + rules/ + scripts/）
uiux-skill/               # UIUX Skill 定義（instructions/ + rules/）
spec/                     # BDD 規格產出（features/ + data/ + actions/）
```

## 部署

### CI/CD

- **前端**：push `main` → Vercel 自動偵測 Next.js 並部署
- **後端**：push `main` → GitHub Actions SSH 到 VPS → `pnpm install` → `pnpm build` → `pm2 restart`

### VPS 手動部署

```bash
# SSH 到 VPS 後
cd ~/tellcraft-repo && git pull origin main
cd tellcraft-backend && pnpm install && pnpm build
pm2 restart tellcraft-backend

# 除錯
pm2 logs tellcraft-backend --lines 100
pm2 status
```

### DB Migration

```bash
# 在 VPS 上執行
psql "$DATABASE_URL" -f tellcraft-backend/migrations/xxx.sql
```

---

<details>
<summary><h2>開發更新紀錄（點擊展開）</h2></summary>

### SandpackPreview 編輯模式（2026-02-26）

想法模式和快速模式生成的 SandpackPreview 現在也支援即時編輯（文字/顏色/間距/圖片），與模板模式 PreviewPanel 一致。

**核心機制**：
- 編輯橋接腳本（`SANDPACK_EDIT_BRIDGE`）作為 Sandpack 檔案（`/lib/edit-bridge.js`）注入
- `MutationObserver` + `setTimeout(300ms)` 延遲標記，observer 只監聽 `childList`（避免 attribute 死循環）
- `window.__tcEditBridgeInitialized` 防重複初始化
- `postMessage` 雙向通訊（`tc_setEditMode`/`tc_elementSelected`/`tc_applyUpdate`/`tc_resetElement`/`tc_applyOverrides`）

**前端**：
- `SandpackPreview.tsx`：新增 `editMode`/`onElementSelected`/`pendingUpdate`/`pendingReset`/`pendingOverrides` props，用 `setInterval(500ms)` + `querySelector('iframe')` 取得 Sandpack 管理的 iframe ref
- `page.tsx`：code_preview 工具列新增編輯模式按鈕 + Undo/Redo，右側 `PropertyEditor` sidebar（280px），鍵盤快捷鍵 `⌘Z`/`⌘⇧Z`
- 串流期間自動禁用編輯模式，切換對話時重置所有編輯狀態

**限制**：DOM overrides 為臨時性質（ephemeral），HMR/源碼更新後丟失

### 模板編輯圖片上傳（2026-02-26）

編輯模式選中圖片元素可直接上傳圖片，取代手動貼 URL。

- 後端 `routes/upload.ts`：multer → `/var/www/uploads/tellcraft/{YYYY-MM}/{uuid}.{ext}`，5MB 限制
- 前端 `PropertyEditor.tsx`：`ImageUrlInput` 子元件（URL + 上傳 + 拖放 + 進度條 + 縮圖預覽）
- Vercel Proxy：POST `multipart/form-data` 透傳
- Nginx：`client_max_body_size 6m` + `/uploads/tellcraft/` 靜態代理

### 模板編輯模式修復與增強（2026-02-26）

1. `template_overrides` 注入代碼生成：用戶在 PreviewPanel 編輯的修改正確傳入 `generateStructure()` prompt
2. 擴展可編輯元素類型：container（section/header/footer/nav/main/article）+ image
3. Undo/Redo 系統 + 元素路徑 Breadcrumb + 單元素重置

### BDD 3D 動畫重設計（2026-02-26）

BDD Q&A 場景從「低多邊形城堡」重設計為「軟體介面鍛造」主題：
- 6 輪建構：浮動平台 → 導航列+側邊欄 → 卡片+按鈕 → 數據管道 → 色彩填入 → 功能圖標+慶祝粒子
- `GhostMesh`（opacity + emissive + clearcoat）、`SceneBackground`（深色科技風）、`RoundedBox` 圓角幾何

### 防刷訊息：三層防護（2026-02-26）

1. 前端 2 秒冷卻
2. 後端 Redis Lua 限速（5 秒窗口 1 條/對話）
3. Worker 對話鎖（Redis `SET NX EX`，TTL 300s）

### 動畫大升級：城堡 + 工廠（2026-02-25）

- BDD Q&A：低多邊形城堡（65+ mesh），6 輪建造，藍圖→實體過渡
- Fast Build：3D 工廠流水線（~39 mesh），3 工位（Structure→Animation→RWD），streamingChunks 微進度

### Fast Build 品質升級（2026-02-25）

13 項修復：displayFont 動態輸出、產品類型中文標籤、模板風格過濾、產業配色 6 套、Creative 溫度調升、QG 2 輪修復等。

### Fast Build 佈局模式：App vs Website（2026-02-25）

`LayoutMode = 'app' | 'website'`：dashboard/tool → app（無 Header/Footer/Hero），其餘 → website。

### Fast Build 全面升級（2026-02-25）

產品類型 10→25、detectDesignTier 加權匹配、22 套產業配色、模板風格整合、QG 輕量 LLM 修復。

### BDD Skill 方法論升級（2026-02-25）

Scenario Outline、DataTable 命名慣例、Rule 四類子類型、跨產出物一致性驗證 8 項、OpenAPI 3.0 並行輸出。

### BDD→UIUX 翻譯品質升級（2026-02-25）

Action Types 擴展 6 種、UIRequirementsSpec 新增 userFlows/stateHints、翻譯失敗智能降級、Animation/RWD 互動上下文注入。

### BDD Skill P1-P3 補完（2026-02-25）

提案優先模式、單題反悔、連續空輪終止、ISA constraints 動態化、變更歷史追蹤、Rollback 支持。

### BDD Skill 差距補完（2026-02-24）

ES 一致性檢查、Formulation Rules 強化、Draft Batch Mode、Clarify 批次整合、Change Management。

### Phase 0 Event Storming（2026-02-24）

複雜業務需求自動 DFS 探索，產出 Commands/ReadModels/Actors/Aggregates/Rules 知識地圖。

### BDD Phase 4/5 後端補完（2026-02-24）

Actions Design（Sonnet LLM）+ ISA Config（100% 規則式）+ Feature Files 驗證整合。

### 對話回退 + 錯誤恢復（2026-02-24）

`PHASE_BACKTRACK_MAP` 4 條回退路徑、`handleGoBack()` 通用回退、5 個 phase handler 錯誤恢復。

### Fast Build 藍圖進度 + BDD Q&A 3D 動畫（2026-02-24）

Remotion 改造（取代 motion/react + GSAP），3D 工廠流水線 + 低多邊形城堡。

### 迭代 Skill 拆分 + 撤銷（2026-02-16）

`iteration-skill.ts` 獨立、orchestrator 瘦身 -549 行、撤銷功能、迭代歷史。

### 智能模板匹配（2026-02-15）

三層評分引擎（關鍵詞 40 + Category 30 + UISpec 30），零 LLM。template_category 4→8。

### Fast Mode 快速建站（2026-02-09）

一句話 → 跳過 BDD/Discovery → 3 階段自動生成 → 60-90 秒預覽。

### BDD→UI 翻譯 + Variant 創意概念（2026-02-08）

`bdd-to-ui-spec.ts` 翻譯 + `VariantConcept` 概念注入全流程。

### 串流實時預覽（2026-02-08）

LLM 串流逐步解析 code block → Redis → HTTP 輪詢 → Sandpack 增量更新。

### Quality Gate 品質檢查（2026-02-06）

A11y/Performance/Code Quality 靜態檢查 + Haiku 自動修復（最多 3 輪）。

### Code Preview 即時渲染（2026-02-06）

Sandpack 取代 1105 行 regex 轉換器。支援 streaming 增量更新、裝置切換。

### Classifier 三層防禦（2026-02-08）

Prefilter（零 LLM）→ Meta Intent（Haiku）→ Skill Intent。

### Design Tier（2026-02-06）

functional（dashboard/SaaS）vs creative（landing page），約束集切換。

### UIUX 生成重構（2026-02-05）

5 變體 + Design System + 三階段生成（Structure → Animation → RWD）。

### 模板預覽重新設計（2026-02-06）

5 個模板 HTML 重寫，每個有獨立色彩系統、Signature element、入場動畫。

### VPS 後端遷移（2026-02-03）

Vercel Serverless → VPS Express + BullMQ + Socket.io + PostgreSQL + Redis。

### 認證系統

Google/LINE OAuth、JWT 雙軌（localStorage + Cookie）、訪客帳號合併。

### 儀表板系統

用戶/管理員儀表板、專案管理、版本歷史、LLM 用量追蹤。

### 早期功能（2026-01-31）

多輪 PRD Discovery、Feature Files 分批生成、語意去重、Token 優化、首頁設計、訪客體驗。

</details>
