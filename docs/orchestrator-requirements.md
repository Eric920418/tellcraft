# AI-Genesis Orchestrator 需求

## 背景

AI-Genesis 平台有多個 AI 能力（Skills），需要一個中控系統來統一管理。

### 現有 Skills
1. **BDD Spec Skill** - 需求釐清，產出規格
2. **Code Generation Skill** - 根據規格生成程式碼
3. **Deployment Skill** - 部署到 Vercel + Supabase
4. **Iteration Skill** - 迭代修改已部署專案

### 未來 Skills
5. **SEO Skill** - SEO 優化建議與實作
6. **UI/UX Skill** - 介面設計優化

---

## 核心功能

### 1. Skill Registry（技能登錄中心）

**目的**：所有 Skills 的集中管理與描述

**每個 Skill 需記錄**：
- name：技能名稱
- description：技能描述
- input_schema：輸入參數 JSON Schema
- output_schema：輸出格式 JSON Schema
- auth_scope：需要的權限範圍
- cost_hint：預估成本等級（low/medium/high）
- timeout_ms：超時時間
- version：版本號
- status：enabled/disabled

**操作**：
- 註冊新 Skill
- 更新 Skill
- 停用 Skill
- 查詢可用 Skills

---

### 2. Task Planning（任務規劃）

**目的**：將用戶目標拆解成多步驟執行計劃

**流程**：
1. 用戶輸入目標（自然語言）
2. LLM 分析目標，選擇需要的 Skills
3. 產生執行計劃（有序步驟清單）
4. 用戶確認或修改計劃
5. 開始執行

**執行計劃結構**：
```yaml
task_id: uuid
user_id: uuid
goal: "用戶原始描述"
plan:
  - step: 1
    skill: bdd-spec
    input: { ... }
    depends_on: []
  - step: 2
    skill: code-generation
    input: { ... }
    depends_on: [1]
  - step: 3
    skill: deployment
    input: { ... }
    depends_on: [2]
status: planning | executing | completed | failed
```

---

### 3. Skill Router（技能選擇器）

**目的**：根據用戶需求自動選擇合適的 Skill

**機制**：
1. 將用戶需求做 embedding
2. 與 Skill Registry 中的 skill descriptions 做相似度比對
3. 取 Top-K 候選
4. 用 LLM 做最終決策並填入參數

---

### 4. Execution Engine（執行引擎）

**目的**：按計劃執行 Skills，處理依賴、重試、失敗

**功能**：
- 依照 depends_on 順序執行
- 單步驟失敗時自動重試（最多 3 次）
- 支援暫停/繼續
- 支援取消
- 支援人工審核點（某些步驟需用戶確認才繼續）

**每步驟執行紀錄**：
- step_id
- skill_name
- input
- output
- status: pending | running | success | failed | cancelled
- started_at
- completed_at
- retry_count
- error_message

---

### 5. State & Memory（狀態管理）

**目的**：保存任務狀態與上下文

**需保存**：
- 任務整體狀態
- 每步驟執行結果
- 步驟間傳遞的資料
- 對話摘要（避免 token 爆炸）

---

### 6. Observability（可觀測性）

**目的**：監控、追蹤、成本計算

**需記錄**：
- 每次 LLM 呼叫的 input/output（可遮罩敏感資訊）
- 每個 Skill 執行的 latency
- 每個 Skill 的成功率
- 每個任務的總成本（token 費用）
- 支援 replay（重跑某次任務）

**報表**：
- 用戶層級：每月使用量、成本
- 系統層級：各 Skill 成功率、平均延遲

---

### 7. Governance（治理）

**目的**：權限、成本、風險控制

**權限控制**：
- 某些 Skills 需特定 plan 才能使用（如 SEO Skill 需 Pro 以上）
- 某些操作需用戶明確授權（如部署、刪除）

**成本控制**：
- 每個任務有 token 上限
- 用戶有每月 token 配額
- 超過配額時拒絕執行

**風險控制**：
- Skill allowlist（只能呼叫已註冊的 Skills）
- Input validation（參數驗證）
- Hard timeout（強制超時）
- Dry-run mode（模擬執行，不真的執行）

---

## 用戶操作流程

### 流程 1：建立新專案（完整流程）

```
用戶：「我想做一個寵物美容預約網站」
       ↓
Orchestrator Planning：
  Step 1: BDD Spec Skill（需求釐清）
  Step 2: Code Generation Skill（生成程式碼）
  Step 3: Deployment Skill（部署）
       ↓
用戶確認計劃
       ↓
Execution Engine 依序執行
       ↓
完成，回傳部署 URL
```

### 流程 2：迭代修改

```
用戶：「我要新增到府服務選項」
       ↓
Orchestrator Planning：
  Step 1: Iteration Skill（分析變更影響）
  Step 2: Code Generation Skill（重新生成）
  Step 3: Deployment Skill（重新部署）
       ↓
執行
```

### 流程 3：單一技能呼叫

```
用戶：「幫我優化 SEO」
       ↓
Orchestrator 直接呼叫 SEO Skill
       ↓
回傳優化建議與執行結果
```

---

## 與現有架構的整合

### 資料庫新增

需要新增以下表：
- `skills` - Skill 登錄
- `tasks` - 任務
- `task_steps` - 任務步驟
- `skill_executions` - Skill 執行紀錄
- `llm_calls` - LLM 呼叫紀錄

### API 新增

- POST /api/tasks - 建立任務
- GET /api/tasks/:id - 查詢任務狀態
- POST /api/tasks/:id/confirm - 確認執行計劃
- POST /api/tasks/:id/cancel - 取消任務
- GET /api/skills - 查詢可用 Skills
- POST /api/skills/:name/execute - 直接執行單一 Skill

---

## 技術選型建議

- **Queue**：BullMQ + Redis（任務排程）
- **State Machine**：自建或 XState（任務狀態管理）
- **Embedding**：pgvector（Skill 檢索）
- **LLM**：Claude API（規劃與決策）
