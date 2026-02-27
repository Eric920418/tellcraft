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
| **動畫** | motion/react + Remotion | 需求藍圖面板 + 串流動畫 |
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

| Skill | 用途 | LLM | 狀態 |
|-------|------|-----|------|
| `bdd-spec` | 需求釐清 + BDD 規格產出（ES → Discovery → Formulation → Actions → ISA） | Sonnet | 完成 |
| `uiux` | 前端介面設計（Design Discovery → Design Lab → Implementation） | Sonnet | 完成 |
| `fast-build` | 一句話快速建站，跳過 BDD/Discovery，60-90 秒出結果 | Sonnet ×3 | 完成 |
| `quality-gate` | UIUX RWD 完成後自動觸發，靜態檢查 + LLM 自動修復 | Haiku | 完成 |
| `deployer` | 代碼 → sanitize → 本地 build 驗證 → Vercel 部署 → 回滾 | Haiku（修復） | 完成 |
| `iteration` | 迭代修改 + 撤銷上一步 + 版本回滾 | Sonnet | 完成 |
| `coder` | 後端代碼生成 | — | **未實作**，Registry 有定義 |
| `domain-manager` | 網域管理 | — | **前端獨立**，`app/actions/domain.ts` 未接入 Orchestrator |
| `domain-purchase` | 網域購買（Porkbun） | — | **前端獨立**，`app/actions/porkbun.ts` |
| `domain-dns` | DNS 管理（Cloudflare） | — | **前端獨立**，`app/actions/cloudflare.ts` |

### 內部服務層

| Service | LLM | 調用者 | 職責 |
|---------|-----|--------|------|
| `classifier.ts` | Haiku | 每條新訊息 | 意圖分類（規則式 + LLM） |
| `prefilter.ts` | 無 | 每條訊息（最先） | 空訊息/長度/Injection/Rate Limit |
| `bdd-to-ui-spec.ts` | Haiku | UIUX Pipeline | BDD Feature Files → UIRequirementsSpec |
| `prd-discovery.ts` | Sonnet | bdd-spec | PRD 需求發掘（多輪） |
| `clarify-dedup.ts` | Haiku ×2 | bdd-spec | Decision Summary + 語意去重 |
| `spec-discovery.ts` | Sonnet | bdd-spec | 規格品質檢查（S1-S6） |
| `formulation.ts` | Sonnet ×5 | bdd-spec | Schema + Features + EntityMapping + Actions + ISA |
| `event-storming.ts` | Haiku | bdd-spec | Event Storming DFS 探索 |
| `fast-build-generation.ts` | 無 | fast-build | 規則式 tier/產品/DesignSystem（零 LLM） |
| `template-matcher.ts` | 無 | orchestrator | 三層評分匹配（零 LLM） |

### 兩種模式

**精細模式（Fine）**：BDD 完成 → 模板匹配 → Discovery → Brief 確認 → 5 變體 → Structure → Animation → RWD → QG

**快速模式（Fast）**：一句話描述 → 規則式推斷（tier/產品類型/配色/佈局） → Structure → Animation → RWD → 靜態 QG

## BDD Spec 流程

```
Phase 0: Event Storming（可選，複雜需求自動啟動）
    ↓ DFS 探索 → Commands/ReadModels/Actors/Aggregates/Rules

Phase 1: PRD Discovery + Clarify（多輪動態釐清）
    ↓ 檢查清單掃描：A1-A6（領域模型）、B1-B5（功能模型）、C1-C2（術語一致）、D1-D2（品質）
    ↓ 每輪最多 5 題，每 5 題批量確認（支援反悔），動態上限 3-10 輪 / 15-50 題
    ↓ 三層去重：L1 Bug Fix + L2 Decision Summary(Haiku) + L3 Post-gen Dedup(Haiku)

Phase 2: Formulation（需求驅動 + 智能分組）
    ↓ 同一實體 CRUD 合併為 1 個 Feature，狀態轉換/跨實體保持獨立
    ↓ 產出 schema.sql + entity_to_table_mapping.yml + feature files
    ↓ Checkpoint 每 3 個 feature 保存，中斷後可恢復（15 分鐘超時偵測）
    ↓ 驗證腳本（lint + validate）+ 自癒修復（最多 3 次）

Phase 3: Spec Discovery + Clarify
    ↓ S1-S6 品質審查（規則完整性/Example 覆蓋/邊界條件/格式/跨 Feature 一致/Schema 對應）
    ↓ 最多 2 輪 / 10 題，超額時按嚴重度截斷（不跳過）

Phase 4: Actions Design → actions.yml（Sonnet LLM）
Phase 5: ISA Config → isa_codegen.yml（100% 規則式，零 LLM）
Phase 6: Change Management（需求變更 → 影響分析 → 執行修改 → 一致性驗證）
```

**bdd_sessions 核心欄位**：
```
current_phase    -- prd_discovery / prd_clarify / formulation / spec_discovery / spec_clarify / actions_design / isa_config / completed
current_round    -- 當前輪次
clarify_items    -- JSONB，待處理 [{ id, question, category, priority, status, mode, proposedAnswer }]
staging_items    -- JSONB，暫存區（待確認）
resolved_items   -- JSONB，已解決
schema_sql_content / entity_mapping_content / features_content / actions_yml_content / isa_config_content
es_document_content  -- Event Storming 知識地圖
change_history   -- JSONB，變更歷史追蹤
```

## 認證系統

### OAuth 流程（以 Google 為例）

```
1. 用戶點擊「Google 登入」
2. → Vercel /api/auth/google（proxy）
3. → VPS /auth/google（設定 callbackHost）
4. → Google OAuth 授權頁
5. → Vercel /api/auth/google/callback（接收 code）
6. → VPS /auth/google/exchange（用 code 換 JWT）
7. → Vercel /auth/callback（存 token）
8. → 首頁（useAuth hook 驗證）
```

**為什麼用 Vercel Proxy**：Google OAuth 不允許 IP callback URI + HTTPS→HTTP Mixed Content 被瀏覽器阻擋。

### JWT 雙軌機制

| 儲存位置 | 用途 | 讀取者 |
|----------|------|--------|
| `localStorage` (`auth_token`) | 客戶端認證 | `useAuth()` hook |
| `Cookie` (`auth_token`, httpOnly) | 伺服器端認證 | Middleware + Server Components |

- 登入時**同時**設置 localStorage 和 Cookie
- `/api/auth/me` 偵測 DB 與 JWT 的 admin 狀態差異 → 自動返回刷新的 token
- 訪客→登入帳號合併：`/auth/post-login` → `migrateAnonymousAccount` → 專案/對話遷移

### OAuth Console 設定

**Google Cloud Console**：APIs & Services → Credentials → OAuth 2.0 → Redirect URI：`https://tellcraft.com/api/auth/google/callback`

**LINE Developers Console**：Channel → LINE Login Settings → Callback URL：`https://tellcraft.com/api/auth/line/callback`

### 儀表板路由

```
/dashboard                          # 用戶首頁（統計/專案/對話）
/dashboard/projects                 # 我的專案
/dashboard/projects/[id]            # 專案詳情（對話歷史/部署記錄/版本）
/dashboard/conversations            # 我的對話
/dashboard/admin                    # 管理員總覽（需 is_admin）
/dashboard/admin/users              # 用戶管理
/dashboard/admin/users/[id]         # 用戶詳情
/dashboard/admin/usage              # LLM 用量統計
/dashboard/admin/conversations/[id] # 對話檢視器（唯讀）
```

權限：Middleware 攔截未登入 `/dashboard` + 非管理員 `/dashboard/admin`，Server Actions `requireAdmin()` 二次驗證。

## BullMQ 任務模式

| 功能 | 實現方式 |
|------|----------|
| 執行步驟 | 直接 `await fn()` |
| 等待用戶回覆 | 保存 FlowState 到 Redis → Job 結束 → 用戶回覆時建新 Job → `handleContinueFlow` 恢復 |
| 任務觸發 | `queue.add('process-message', { conversationId, message, ... })` |
| 自動重試 | `attempts: 3` 配置 |
| 對話互斥 | `conversation-lock.ts` Redis `SET NX EX`（TTL 300s），同一對話同時只有 1 個 Job |

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
| **動畫** | BDD 需求藍圖面板（即時 Q&A 歷史視覺化）、3D 工廠流水線（Fast Build）、Remotion 驅動 |
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
│   ├── building-scene/   # 3D 場景入口（dynamic import）
│   ├── BddAnimationPanel.tsx  # BDD 需求藍圖面板（文字歷史紀錄 + 分類 Q&A）
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

### VPS 首次設定

```bash
# 1. SSH 到 VPS
ssh -i ~/Desktop/LightsailDefaultKey-ap-northeast-1.pem ubuntu@54.238.4.117

# 2. Clone repo
git clone git@github.com:Eric920418/tellcraft.git ~/tellcraft-repo

# 3. 配置環境變數
cp ~/tellcraft-repo/tellcraft-backend/.env.example ~/tellcraft-repo/tellcraft-backend/.env
# 編輯 .env 填入 DATABASE_URL, REDIS_URL, JWT_SECRET, ANTHROPIC_API_KEY 等

# 4. 安裝依賴並 build
cd ~/tellcraft-repo/tellcraft-backend
pnpm install && pnpm build

# 5. 配置 Nginx
sudo cp nginx/tellcraft.conf /etc/nginx/sites-available/tellcraft
sudo ln -s /etc/nginx/sites-available/tellcraft /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 6. 上傳目錄（圖片上傳功能）
mkdir -p /var/www/uploads/tellcraft

# 7. 啟動服務
pm2 start ecosystem.config.js
pm2 save
```

### VPS 日常部署

```bash
# 方法 1：SSH 到 VPS 後執行
cd ~/tellcraft-repo && git pull origin main
cd tellcraft-backend && pnpm install && pnpm build
pm2 restart tellcraft-backend

# 方法 2：本地直接執行（deploy.sh）
ssh -i ~/Desktop/LightsailDefaultKey-ap-northeast-1.pem ubuntu@54.238.4.117 '~/deploy.sh'
```

**deploy.sh**：
```bash
#!/bin/bash
set -e
cd ~/tellcraft-repo && git pull origin main
cd tellcraft-backend && pnpm install && pnpm build
pm2 restart tellcraft-backend
curl -s http://localhost:8080/health
```

### 驗證

```bash
# 健康檢查
curl http://54.238.4.117:8080/health
# 預期: {"status":"ok","services":{"database":"connected","redis":"connected"}}

# 即時日誌
pm2 logs tellcraft-backend --lines 100
pm2 status
# 日誌檔案：/var/log/tellcraft/out.log、/var/log/tellcraft/error.log
```

### DB Migration

```bash
# 在 VPS 上執行
psql "$DATABASE_URL" -f tellcraft-backend/migrations/xxx.sql
```

---

<details>
<summary><h2>開發更新紀錄（點擊展開）</h2></summary>

### BDD 需求藍圖面板（2026-02-27）

BDD Q&A 動畫面板從 3D 鍛造車間場景改為**純 React 文字歷史紀錄面板**：

- **即時 Q&A 展示**：呼叫 `getBddSession` API 取得結構化資料，按分類（功能需求/資料模型/術語定義）自動分組
- **深色主題**：GitHub Dark 風格配色（#0D1117 背景 + monospace 字體），呈現「在建構規格」的意象
- **進度追蹤**：頂部進度條 + 輪次標籤（R{n}/{max}），底部 AI 工作狀態指示器
- **入場動畫**：分類區塊 slideDown + fadeIn，Q&A 條目 fadeIn + slideUp，最新條目橙色高亮
- **完成效果**：進度條滿格 + 綠色邊框光暈
- **可折疊分類**：點擊分類標題展開/收合，每個分類顯示已答題數
- **自動捲動**：新條目出現時自動捲動到底部
- **移除依賴**：不再使用 Remotion Player、Three.js、@react-three/postprocessing

### SandpackPreview 編輯模式（2026-02-26）

想法模式和快速模式生成的 SandpackPreview 現在也支援即時編輯（文字/顏色/間距/圖片），與模板模式 PreviewPanel 一致。

**核心機制**：
- 編輯橋接腳本（`SANDPACK_EDIT_BRIDGE`）作為 Sandpack 檔案（`/lib/edit-bridge.js`）注入
- `MutationObserver` + `setTimeout(300ms)` 延遲標記，observer 只監聽 `childList`（避免 attribute 死循環）
- `window.__tcEditBridgeInitialized` 防重複初始化
- `postMessage` 雙向通訊（`tc_setEditMode`/`tc_elementSelected`/`tc_applyUpdate`/`tc_resetElement`/`tc_applyOverrides`）

**前端**：
- `SandpackPreview.tsx`：新增 `editMode`/`onElementSelected`/`pendingUpdate`/`pendingReset`/`pendingOverrides`/`overrides` props，用 `setInterval(500ms)` + `querySelector('iframe')` 取得 Sandpack 管理的 iframe ref
- `page.tsx`：code_preview 工具列新增編輯模式按鈕 + Undo/Redo + 儲存按鈕，右側 `PropertyEditor` sidebar（280px），鍵盤快捷鍵 `⌘Z`/`⌘⇧Z`
- 串流期間自動禁用編輯模式，切換對話時重置所有編輯狀態

**持久化 + 儲存到源碼（2026-02-27）**：
- `storedOverrides`：bridge 內部持久化，React re-render 後 MutationObserver 自動 `fullRetag()`（clearAllTags → 重新標記 → reapplyStoredOverrides）
- `localStorage`：overrides 存入 `tc-edit-overrides-{conversationId}`，頁面重整後自動恢復
- `tc_iframeReady`：iframe 重建時自動重發 `tc_applyOverrides`，延遲 500ms 等 bridge tag 完元素
- 「儲存」按鈕：將 DOM overrides 轉為自然語言修改描述，發送為迭代修改消息（走現有 iteration 路由），LLM 修改源碼後永久保存

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

BDD Q&A 場景從「低多邊形城堡」重設計為「軟體介面鍛造」主題（已被 2026-02-27 "The Craft" 取代）。

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
