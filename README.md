# Tellcraft

> **用對話打造你的軟體產品** | [tellcraft.com](https://tellcraft.com)

Tellcraft 是一個 AI 驅動的自動化開發平台。用戶只需描述需求，AI 會自動釐清細節、生成程式碼、部署上線。

## 核心理念

```
描述需求 → AI 釐清 → 確認規格 → 自動生成 → 一鍵部署
```

## 當前開發進度

- **狀態**：✅ Phase 1-5 + Server Actions + Inngest Orchestrator 完成
- **釐清項目**：28 項全部解決
- **Server Actions**：14/14 已實作並通過測試
- **詳情**：[`.clarify/overview.md`](.clarify/overview.md)

## 技術棧

| 服務 | 用途 | 狀態 |
|------|------|------|
| Next.js 15 | Server Actions | ✅ |
| React 19 | UI 框架 | ✅ |
| Framer Motion | 動畫效果 | ✅ |
| next-themes | 深色/淺色模式 | ✅ |
| Inngest | 事件驅動任務編排 | ✅ |
| Supabase | 資料庫 (PostgreSQL) | ✅ |
| Vercel | 網站部署 | ✅ |
| Cloudflare | DNS 託管 | ✅ |
| Porkbun | 網域購買 | ⏳ Mock |

## 首頁設計

極簡風格的互動式首頁，兩種使用路徑：

### 路徑 A：直接輸入
```
Hero 輸入框 → 輸入需求 → 平滑過渡至聊天模式 → 對話開發流程
```

### 路徑 B：了解產品
```
Hero → 往下滾動 → 產品介紹（SEO 友好）→ Testimonials → CTA
```

### 動態效果（reactbits 風格）
- `AnimatedThemeToggler` - 左上角深色/淺色模式切換器（支援 system 預設）
- `TextType` - 主視覺標題打字機效果
- `SplitText` (GSAP) - 文字逐字淡入 + 模糊消散
- `RotatingText` - 使用場景標題輪播動畫
- `GlareHover` - 卡片 hover 光澤掃過效果
- `CardSwap` (GSAP) - 3D 卡片堆疊輪播動畫
- `BlurRevealText` - 滾動觸發的模糊揭示動畫
- `AnimatedCounter` - 數字滾動計數器
- `ScrollIndicator` - 呼吸式向下滾動提示
- FAQ 手風琴展開動畫

### SEO 內容區塊
| 區塊 | SEO 價值 | 內容 |
|------|----------|------|
| Use Cases | 長尾關鍵字 | 4 種使用場景（新創/電商/接案/中小企業）|
| How It Works | 流程說明 | 5 步驟完整開發流程 |
| Stats | 信任指標 | 4 項關鍵數據 |
| Comparison | 比較表格 | 傳統開發 vs Tellcraft 6 項對比 |
| FAQ | Google 精選摘要 | 8 個常見問題（手風琴式）|
| Testimonials | 社會證明 | 3 則用戶評價輪播 |
| Footer | 網站結構 | 完整導航連結 |
- 訊息氣泡進場動畫、打字指示器脈衝動畫

## 規格產出

| 產出 | 路徑 |
|------|------|
| SQL Schema | `spec/data/schema.sql` |
| Entity Mapping | `spec/data/entity_to_table_mapping.yml` |
| Feature Files (14) | `spec/features/*.feature` |
| Actions 定義 | `spec/actions/actions.yml` |
| ISA 配置 | `isa_codegen.yml` |

### Feature Files 清單

#### 核心功能（8 個）

| Feature | Server Action | 關聯決議 |
|---------|---------------|----------|
| 建立專案 | createProject | - |
| 發送訊息 | sendMessage | #7 對話計費 |
| 生成程式碼 | generateCode | #4 自癒機制 |
| 部署專案 | deployProject | #5 備用 Org |
| 迭代修改 | updateProject | #1 狀態轉換, #6 破壞性變更 |
| 取消訂閱 | cancelSubscription | #8 暫停期, #14 暫停頁 |
| 導出資料 | exportData | #13 SQL dump |
| 移轉資源 | transferResources | #12 自助移轉 |

#### Orchestrator 功能（6 個）

| Feature | Server Action | 關聯決議 |
|---------|---------------|----------|
| 建立任務 | createTask | #22 Task 屬於 Project |
| 確認計劃 | confirmTaskPlan | #24 超時處理 |
| 取消任務 | cancelTask | #23 保留已完成步驟, #28 通知 |
| 重試任務 | retryTask | #23 從失敗點重試 |
| 註冊技能 | registerSkill | #26 skill_executions 總表 |
| 配置Webhook | configureWebhook | #28 Webhook + 內建通知 |

### Orchestrator 架構決議

| # | 決議 | 選項 |
|---|------|------|
| 22 | Task 與 Project 關係 | Task 屬於 Project |
| 23 | 執行失敗回滾策略 | 不回滾，保留已完成步驟 |
| 24 | 人工審核超時處理 | 超時提醒 + 延長等待 + 自動取消 |
| 25 | 並行執行支援 | 不支援，依序執行 |
| 26 | skill_executions 與現有表 | 總表 + 細節表 1:1 關聯 |
| 27 | 任務優先級 | plan + task_type 混合 |
| 28 | 外部通知機制 | Webhook + 內建通知 |

**待完成**：完整測試覆蓋、Porkbun API 串接

## 架構

```
┌─────────────────────────────────────────────────────────────┐
│                    Inngest Orchestrator                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Intent    │→ │   Skill     │→ │  Workflow   │         │
│  │ Classifier  │  │  Registry   │  │  Executor   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Server Actions（14 個）                    │
│  createProject · sendMessage · generateCode · deployProject │
│  updateProject · cancelSubscription · exportData · ...      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                        外部 API                              │
│       Vercel · Supabase · Cloudflare · Porkbun              │
└─────────────────────────────────────────────────────────────┘
```

## 執行流程

```
用戶：「幫我建一個訂單管理系統」
  ↓
Intent Classification → bdd-spec Skill
  ↓
多輪對話釐清需求（最長 24 小時）
  ↓
規格確認 → coder Skill（自癒機制，最多 3 次）
  ↓
部署到 Vercel + Supabase
```

## 快速開始

```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev

# 另開終端，啟動 Inngest Dev Server
npx inngest-cli@latest dev
```

- 應用：http://localhost:3000
- Inngest Dashboard：http://localhost:8288
- 測試頁面：http://localhost:3000/test

## 環境變數

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-xxx
SUPABASE_URL=...
VERCEL_TOKEN=...
CLOUDFLARE_API_TOKEN=...
```

## 專案結構

```
app/
├── actions/           # Server Actions（API 封裝）
├── inngest/           # Orchestrator（任務編排）
├── lib/               # 共用工具
└── test/              # 測試頁面

spec/
├── data/              # Schema + Entity Mapping
├── features/          # BDD Feature Files (14)
└── actions/           # Actions 定義

prompts/               # BDD Skill（Claude Code 用）
```

## 相關文件

- [釐清狀態](.clarify/overview.md)
- [BDD Skill](prompts/skill.md)
- [格式規範](prompts/rules/formulation-rules.md)
