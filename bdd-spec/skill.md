# AI x BDD 規格驅動開發 Skill

## Metadata

```yaml
name: bdd-spec-formulation
version: 1.0.0
description: |
  專注於需求釐清與規格撰寫：
  1. 從自然語言需求文檔識別歧義與遺漏（Discovery）
  2. 與用戶迭代式釐清問題（Clarify）
  3. 產出完整的 BDD 規格：ERM + sdd.os ISA Feature Files

  採用 sdd.os ISA Gherkin 格式，產出的 Feature Files 可直接與 sdd.os 工具整合。

  ⚠️ 本 Skill 不負責應用程式開發，僅專注於規格產出。

author: AI x BDD Team
output_format:
  - sdd.os ISA Gherkin (Server Actions 版)
  - SQL Schema
  - Entity Mapping YAML
  - Actions Spec YAML
  - ISA Config YAML
```

---

## Trigger Conditions（觸發條件）

當用戶意圖符合以下任一情境時，主大腦應路由至此 Skill：

| Intent Pattern | 範例 |
|----------------|------|
| 需求轉規格 | 「幫我把這份需求文檔轉成 BDD 規格」 |
| Feature 撰寫 | 「幫我寫這個功能的 Gherkin Feature」 |
| 規格釐清 | 「這份規格有什麼歧義需要釐清？」 |
| 發現問題 | 「檢查這份需求有沒有遺漏或矛盾」 |
| BDD 建模 | 「用 BDD 方式整理這個功能的業務規則」 |

**不適用於**：
- 「幫我開發這個應用」→ 應轉交開發類 Skill
- 「幫我部署」→ 應轉交 DevOps 類 Skill

---

## Scope（邊界定義）

### 解決的問題
- 從自然語言需求萃取結構化規格（ERM、Gherkin Feature）
- 識別規格歧義與遺漏，產生釐清項目
- 與用戶迭代式釐清，直到規格完整
- 產出符合 sdd.os ISA 格式的 Feature Files（Server Actions 版）
- 產出 SQL Schema（schema.sql）和 Entity Mapping（entity_to_table_mapping.yml）
- 設計 Server Actions 規格（actions.yml）
- 產出 sdd.os ISA 配置檔案（isa_codegen.yml）

### 不解決的問題
- ❌ 應用程式開發（前端、後端、Server Actions 實作）
- ❌ 資料庫部署與初始化
- ❌ Docker 容器化與部署
- ❌ 測試程式碼撰寫（由 sdd.os 工具負責）
- ❌ UI/UX 設計

---

## Input Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "project_path": {
      "type": "string",
      "description": "專案根目錄路徑，用於定位 spec/ 和 .clarify/ 目錄"
    },
    "requirements": {
      "type": "object",
      "description": "需求來源（至少提供一項）",
      "properties": {
        "text": {
          "type": "string",
          "description": "自然語言需求描述"
        },
        "file_path": {
          "type": "string",
          "description": "需求文檔路徑"
        },
        "url": {
          "type": "string",
          "format": "uri",
          "description": "需求文檔 URL"
        }
      },
      "anyOf": [
        { "required": ["text"] },
        { "required": ["file_path"] },
        { "required": ["url"] }
      ]
    },
    "focus_files": {
      "type": "array",
      "items": { "type": "string" },
      "description": "需重點分析的規格文件列表（可選，預設分析所有）"
    },
    "existing_spec": {
      "type": "object",
      "description": "已存在的規格（用於釐清或擴充）",
      "properties": {
        "schema_sql": {
          "type": "string",
          "description": "spec/data/schema.sql 路徑"
        },
        "features_dir": {
          "type": "string",
          "description": "spec/features/ 目錄路徑"
        },
        "actions_yml": {
          "type": "string",
          "description": "spec/actions/actions.yml 路徑"
        }
      }
    },
    "mode": {
      "type": "string",
      "enum": ["full", "discovery", "formulation", "actions-design"],
      "default": "full",
      "description": "執行模式：full=完整流程, discovery=僅發現歧義, formulation=僅規格表達, actions-design=僅Actions設計"
    },
    "project_context": {
      "type": "string",
      "description": "專案背景資訊，如「電商後台」、「訂單管理系統」"
    }
  },
  "required": ["project_path", "requirements"]
}
```

---

## Output Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "clarification_needed", "validation_failed"],
      "description": "執行結果狀態"
    },
    "artifacts": {
      "type": "object",
      "description": "產出的檔案",
      "properties": {
        "schema_sql": {
          "type": "string",
          "description": "spec/data/schema.sql 路徑"
        },
        "entity_mapping": {
          "type": "string",
          "description": "spec/data/entity_to_table_mapping.yml 路徑"
        },
        "features": {
          "type": "array",
          "items": { "type": "string" },
          "description": "spec/features/*.feature 檔案路徑列表"
        },
        "actions_yml": {
          "type": "string",
          "description": "spec/actions/actions.yml 路徑（可選）"
        },
        "clarify_overview": {
          "type": "string",
          "description": ".clarify/overview.md 路徑"
        }
      },
      "required": ["schema_sql", "entity_mapping", "features", "clarify_overview"]
    },
    "clarification_summary": {
      "type": "object",
      "description": "釐清過程摘要",
      "properties": {
        "total_rounds": {
          "type": "integer",
          "description": "總迭代輪數"
        },
        "total_discovered": {
          "type": "integer",
          "description": "發現的問題總數"
        },
        "resolved": {
          "type": "integer",
          "description": "已解決的問題數"
        },
        "open": {
          "type": "integer",
          "description": "未解決的問題數（應為 0）"
        }
      },
      "required": ["total_rounds", "total_discovered", "resolved", "open"]
    },
    "validation_result": {
      "type": "object",
      "description": "驗證腳本執行結果",
      "properties": {
        "passed": {
          "type": "boolean",
          "description": "是否通過驗證"
        },
        "errors": {
          "type": "array",
          "items": { "type": "string" },
          "description": "錯誤列表"
        },
        "warnings": {
          "type": "array",
          "items": { "type": "string" },
          "description": "警告列表"
        }
      },
      "required": ["passed", "errors", "warnings"]
    },
    "next_action_suggestion": {
      "type": "string",
      "description": "給 Orchestrator 的下一步建議"
    }
  },
  "required": ["status", "artifacts", "clarification_summary", "validation_result"]
}
```

---

## Workflow Overview（流程概覽）

### 階段流程圖（雙循環架構）

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Phase 1: 需求釐清（針對 PRD）                      │
│                                                                     │
│    PRD ──▶ Discovery ──▶ Clarify ──▶ (循環直到連續 2 輪無新問題)     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Phase 2: 規格產出（初版）                          │
│                                                                     │
│    Formulation ──▶ spec/data/schema.sql                             │
│                 ──▶ spec/features/*.feature（初版）                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Phase 3: 規格精煉（針對 Feature Files）            │
│              ⚠️ 這是確保規格足夠詳細的關鍵階段                        │
│                                                                     │
│    spec/features/ ──▶ Discovery ──▶ Clarify ──▶ 修正 Feature        │
│          ▲                                           │              │
│          │         還有問題？                         │              │
│          └───────────────────────────────────────────┘              │
│                              │                                      │
│                              │ 連續 2 輪無新問題                     │
│                              ▼                                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Phase 4: Actions 設計                             │
│                                                                     │
│    Feature Files ──▶ 分析 Action/Rules ──▶ spec/actions/actions.yml │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Phase 5: ISA 配置                                 │
│                                                                     │
│    所有規格 ──▶ 產出 isa_codegen.yml ──▶ 可供 sdd.os 使用            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │   規格完成！     │
                          │   可交付開發     │
                          └─────────────────┘
```

### ⚠️ 關鍵原則：雙循環迭代

**錯誤做法**（只對 PRD 做 Discovery）：
```
PRD → Discovery → Clarify → Formulation → 完成 ❌
```

**正確做法**（完整 5 階段流程）：
```
PRD → Discovery → Clarify → Formulation（初版 spec）
                                ↓
                    spec → Discovery → Clarify → 修正 spec
                                ↓
                    （循環直到 spec 夠詳細）
                                ↓
                    Actions Design → actions.yml
                                ↓
                    ISA Config → isa_codegen.yml ✅
```

### 迭代釐清機制詳解

#### Phase 1: 需求釐清（針對 PRD）

| 輪次 | Discovery 特徵 | Clarify 特徵 |
|------|---------------|-------------|
| 第 1 輪 | 找出表面明顯的歧義 | 釐清基礎定義與術語 |
| 第 2 輪 | 根據釐清結果發現更深層問題 | 釐清邏輯關係與邊界條件 |
| 第 3+ 輪 | 發現跨功能的矛盾或遺漏 | 確認整體一致性 |

#### Phase 3: 規格精煉（針對 Feature Files）

| 檢查項目 | 說明 |
|----------|------|
| 規則完整性 | 每個功能的前置/後置條件是否都有 Rule？ |
| Example 覆蓋度 | 每條 Rule 是否有足夠的 Example 覆蓋邊界？ |
| 邊界條件 | 數值邊界、狀態邊界、組合邊界是否涵蓋？ |
| 錯誤處理 | 異常情況是否都有對應的 Rule + Example？ |

**迭代終止條件**（兩個 Phase 都適用）：
- `.clarify/overview.md` 中 Open 項目數為 0
- **連續兩輪 Discovery 未發現新問題**（硬性條件）

**每輪產出追蹤**：
```yaml
# .clarify/overview.md 範例
round: 3
statistics:
  total_discovered: 15
  resolved: 12
  open: 3
  deferred: 0

history:
  - round: 1
    discovered: 5
    resolved: 5
  - round: 2
    discovered: 7
    resolved: 7
  - round: 3
    discovered: 3
    resolved: 0  # 待本輪釐清
```

---

## State Persistence Strategy（狀態保存策略）

Agent 本質上是無狀態的（Stateless），但迭代式釐清需要跨輪次保持上下文。本 Skill 採用**檔案系統作為狀態存儲**：

### 狀態檔案結構

```
.clarify/
├── overview.md           # 📌 主狀態檔 - 每輪必讀必更新
├── current-round.md      # 當前輪次的釐清項目（工作區）
└── resolved/             # 已解決項目歸檔
    ├── round-1.md
    ├── round-2.md
    └── ...
```

### 每輪迭代的狀態操作

| 時機 | 操作 | 說明 |
|------|------|------|
| 輪次開始 | **讀取** `.clarify/overview.md` | 恢復上下文，了解已解決/待解決項目 |
| 發現新問題 | **追加** 到 `current-round.md` | 記錄本輪發現的問題 |
| 用戶回覆 | **更新** `current-round.md` 狀態 | 標記為 Resolved |
| 輪次結束 | **歸檔** + **更新** `overview.md` | 移動到 `resolved/`，更新統計 |

### Context 恢復機制

**⚠️ 強制規則**：每輪對話開始時，必須執行以下步驟：

```markdown
1. 讀取 `.clarify/overview.md`
2. 提取關鍵摘要（不超過 500 字）：
   - 當前輪次
   - Open 項目數量與清單
   - 最近一輪的釐清結果
3. 將摘要作為本輪對話的 Context 基礎
```

### overview.md 格式

詳見 [`instructions/02-clarify.md`](instructions/02-clarify.md) 的「狀態追蹤」章節。

---

## Instructions Index（執行指南索引）

主大腦在決定執行此 Skill 後，根據執行階段動態加載對應的 Instructions：

| 階段 | Instruction 文件 | 加載時機 | 必要性 |
|------|-----------------|----------|--------|
| 1. 發現 | `instructions/01-discovery.md` | 開始分析需求時 | 必要 |
| 2. 釐清 | `instructions/02-clarify.md` | 發現歧義需釐清時 | 必要 |
| 3. 規格表達 | `instructions/03-formulation.md` | 產出規格時 | 必要 |
| 4. Actions 設計 | `instructions/04-actions-design.md` | 設計 Server Actions 時 | 必要 |
| 5. ISA 配置 | `instructions/05-isa-config.md` | 產出 sdd.os 配置時 | 必要 |

**輔助規則文件**：
- `rules/formulation-rules.md` - sdd.os ISA Gherkin 格式規範（在 Formulation 階段加載）

**階段說明**：
- **階段 1-3**：需求釐清與規格產出
- **階段 4-5**：規格轉換為開發規格（actions.yml + isa_codegen.yml）

---

## Scripts Index（腳本索引）

確定性邏輯由腳本執行，模型負責規劃與調用：

| 腳本 | 用途 | 調用時機 | 強制性 |
|------|------|----------|--------|
| `scripts/lint-gherkin-format.ts` | 確保步驟 100% 符合 ISA Regex | Formulation 完成後（第一步） | **必要** |
| `scripts/validate-feature.ts` | 驗證 Gherkin 語法與結構完整性 | lint 通過後（第二步） | **必要** |

### 腳本調用規範

**⚠️ 強制執行規則**：在 Formulation 階段完成後，**必須依序**執行兩個腳本：

```bash
# 第一步：ISA Format Lint（確保 Regex 相容）
npx ts-node scripts/lint-gherkin-format.ts spec/features/

# 第二步：結構驗證（確保完整性）
npx ts-node scripts/validate-feature.ts spec/features/
```

### 自我修復迴圈

若腳本回傳 `exit code 1`，Skill 進入修復迴圈：解析 JSON 錯誤 → 修正 Feature Files → 重新執行（最多 3 次）。

驗證結果必須寫入 Output Schema 的 `validation_result` 欄位。

---

## Resources Index（資源索引）

模板和範例按需加載，不預先載入上下文：

| 資源 | 用途 | 加載時機 |
|------|------|----------|
| `resources/templates/feature.template` | Feature File 模板 | 撰寫 Feature 時 |
| `resources/templates/actions.template.yml` | actions.yml 模板 | Actions 設計時 |
| `resources/templates/isa-config.template.yml` | isa_codegen.yml 模板 | ISA 配置時 |
| `resources/examples/` | 完整範例參考 | 需要參考時 |

---

## Error Handling（異常處理）

| 異常情境 | 處理方式 |
|----------|----------|
| 需求文檔不完整 | 進入 Discovery 階段，產出釐清項目，**反問用戶**，不可猜測 |
| 規格存在矛盾 | 標記衝突點，列出選項，請用戶決定 |
| 技術限制 | 明確說明限制，提供替代方案 |
| Feature 無法對應 Action | 檢查 summary 一致性，若不一致則修正 |

---

## Quality Gates（品質閘門）

每個階段完成後，必須通過對應的品質檢查。**硬性閘門由腳本強制執行，軟性閘門由模型自檢**。

### Phase 1: 迭代式釐清（軟性閘門）

| 檢查項目 | 驗證方式 |
|----------|----------|
| 所有 Open 項目都已處理 | 讀取 `.clarify/overview.md` 確認 `open: 0` |
| 統計數字已更新 | 確認 `statistics` 區塊完整 |
| 釐清項目已歸檔 | 確認 `.clarify/resolved/` 有對應檔案 |

### Formulation 階段（硬性閘門）

**⚠️ 以下檢查由 `scripts/validate-feature.ts` 強制執行**：

| 檢查項目 | 腳本驗證 |
|----------|----------|
| 所有 Feature 有 `# Action:` 註解 | ✅ 自動檢查 |
| 所有 Feature 有 `# Summary:` 註解 | ✅ 自動檢查 |
| Summary 與 Feature 名稱一致 | ✅ 自動檢查 |
| 所有 Rule 標註 `前置` 或 `後置` | ✅ 自動檢查 |
| When 步驟格式正確 | ✅ 自動檢查 |
| Then 步驟格式正確 | ✅ 自動檢查 |
| 至少有一個 Example | ✅ 自動檢查 |

**閘門執行流程**：
```
Formulation 完成
       │
       ▼
執行 validate-feature.ts
       │
       ├── exit 0 ──▶ 通過，進入下一階段
       │
       └── exit 1 ──▶ 進入修正模式
                            │
                            ▼
                      修正錯誤後重新驗證
```

### Actions Design 階段（軟性閘門）

| 檢查項目 | 驗證方式 |
|----------|----------|
| 每個 Feature 有對應 Action | 模型自檢 |
| Action summary 與 Feature 名稱一致 | 模型自檢 |
| rules 欄位完整 | 模型自檢 |
| Types 與 schema.sql 一致 | 模型自檢 |

### ISA Config 階段（軟性閘門）

| 檢查項目 | 驗證方式 |
|----------|----------|
| 所有步驟模式都有對應配置 | 模型自檢 |
| Entity 名稱與 mapping 一致 | 模型自檢 |
| Action summary 與 actions.yml 一致 | 模型自檢 |
| Executor 路徑正確 | 模型自檢 |

---

## Progressive Disclosure Strategy（漸進式披露策略）

```
Level 0 (Always Loaded)
└── skill.md (本文件) - 元數據、觸發條件、Schema

Level 1 (On Skill Activation)
└── 當前執行階段的 instruction 文件

Level 2 (On Step Execution)
└── 該步驟需要的 rules 或 resources

Level 3 (On Demand)
└── 完整範例、除錯資訊
```

這種分層策略確保上下文窗口不會被不必要的內容填滿。
