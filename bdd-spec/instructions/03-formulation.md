# Formulation：從規格文本產出規格模型（sdd.os ISA 格式 - SpecFormula 標準）

## 目標
從原始規格文本（或 ES 規格）中萃取並結構化為規格模型，包含：
1. **資料模型 (Data Model)**：產出 SQL Schema 和 Entity 映射（供 Neon PostgreSQL 使用）
2. **功能模型 (Functional Model)**：以 **sdd.os ISA SpecFormula 標準** 描述功能規格

支援**三關注點分離**與**草稿批量生成**模式。

---

## 三關注點分離架構

本階段管理三個獨立關注點，各有其推理焦點與產出物：

| 關注點 | 推理焦點 | 產出物 |
|--------|---------|--------|
| **行為探索** | Feature Rules + Examples | `spec/features/*.feature` |
| **Actions 推導** | Server Actions 規格 | `spec/actions/actions.yml` |
| **實體推導** | Entity 屬性、型別、約束、關聯 | `spec/data/schema.sql` + `entity_to_table_mapping.yml` |

### 預設聚焦順序

```
行為探索 → 實體推導 → Actions 推導
```

先定義行為（Feature Files），再從中推導資料模型，最後產出 Actions 規格。
但當任何關注點出現缺漏時，可隨時切換焦點補充，完成後再返回原處繼續。

### 路由邏輯

掃描知識地圖，依預設順序找到第一個包含 `partial` 或 `missing` 項目的關注點：

1. 行為中有任何 Feature 的 Rules 為 `partial` 或 `missing` → 聚焦行為探索
2. 實體中有任何 Entity 為 `partial` 或 `missing` → 聚焦實體推導
3. Actions 中有任何 Action 為 `partial` 或 `missing` → 聚焦 Actions 推導
4. 全部 `clear` → 完成

### 知識地圖（內部推理用）

**知識地圖僅供內部推理使用，不輸出給用戶。**

```markdown
## Knowledge Map

### 行為
#### Feature: <功能名>
- 狀態: clear | partial | missing
- 前置（狀態）: clear | partial | missing
- 前置（參數）: clear | partial | missing
- 後置（回應）: clear | partial | missing
- 後置（狀態）: clear | partial | missing

### 實體
#### Entity: <實體名>
- 狀態: clear | partial | missing
- 屬性: clear | partial | missing
- 約束: clear | partial | missing
- 關聯: clear | partial | missing

### Actions
#### Action: <actionName>
- 狀態: clear | partial | missing
- Feature 關聯: clear | missing
- Input/Output: clear | partial | missing
```

---

## sdd.os ISA 格式說明（SpecFormula 標準）

本流程產出的規格採用 **sdd.os ISA SpecFormula 標準** 格式，針對 **Next.js API Routes + Neon PostgreSQL** 技術棧設計：

| 格式 | 說明 | 範例 |
|------|------|------|
| Action 呼叫 | `(No Actor\|UID="$var") {summary}, call table:` | `(No Actor) 建立訂單, call table:` |
| 成功回應 | `{summary}(STATUS)回應, with table:` | `建立訂單(201)回應, with table:` |
| 成功回應（JSON） | `{summary}(STATUS)回應為, with JSON:` | `查詢訂單(200)回應為, with JSON:` |
| 操作失敗 | `操作失敗` | 錯誤情境時使用 |
| Entity 存在驗證 | `應該存在一個<實體名>, with table:` | `應該存在一個訂單, with table:`（不加花括號 {}） |
| Entity 不存在驗證 | `應該不存在一個<實體名>, with table:` | `應該不存在一個訂單, with table:`（不加花括號 {}） |
| 資料準備 | `準備一個<實體名>, with table:` | `準備一個商品, with table:`（不加花括號 {}） |
| 時間控制 | `現在時間為 "{datetime}"` | `現在時間為 "2026-01-15T10:00:00Z"` |

### VAR 系統

SpecFormula 使用三種變數前綴取代硬編碼值：

| 前綴 | 名稱 | 用途 | 範例 |
|------|------|------|------|
| `>` | Context Key | Given 中宣告上下文鍵 | `>TestUser.id` |
| `$` | Variable | 引用已宣告的值 | `$TestUser.id` |
| `<` | Execution Key | 捕捉執行結果 | `<userId` |

**規則**：
- `>ContextName.field` 在 Given 宣告時使用（DataTable header），對應值用 `<executionKey` 捕捉
- `$ContextName.field` 在 When/Then 引用之前宣告的值
- `$notnull` 表示「非空即可」，不檢查具體值

### Feature 註解（擴充）

```gherkin
# Action: actionFunctionName
# [POST] /api/action-path
# Summary: 功能名稱
```

**核心價值**：產出的 Gherkin 可直接透過 sdd.os SpecFormula 生成測試程式碼（呼叫 API Routes + Neon PostgreSQL 驗證）。

---

## 執行步驟

### 0. 初始化

1. 詢問用戶規格檔案的存放路徑（預設 `${SPECS_ROOT_DIR}`）。
2. 讀取現有規格檔案：
   - `spec/features/*.feature`
   - `spec/data/schema.sql`
   - `spec/data/entity_to_table_mapping.yml`
3. 根據現有檔案內容，建立初始知識地圖。
4. 判斷輸入來源：
   - **若 `${ES_SPEC_PATH}` 存在**：讀取其中的 Commands / Read Models / Aggregates
   - **若僅有 PRD / 需求文檔**：接收用戶的需求描述
5. **判斷是否進入草稿批量生成模式**（見下方）。

### 1. 草稿批量生成模式（Propose First, Ask Later）

**當 `${ES_SPEC_PATH}` 存在且 `${ENABLE_DRAFT_BATCH_MODE}` 為 true 時，AI 先根據 ES 內容一次性產出所有產出物的初版草稿，再針對不確定處進行澄清。**

#### 觸發條件

`${ES_SPEC_PATH}` 存在且其中有 clear 的 Commands / Read Models（即有無 `(待澄清)` 標記的項目）。

#### 草稿生成流程

依序產出三個關注點的草稿：

1. **行為探索**：對所有 clear 的 Commands / Read Models，直接生成完整的 Feature File 草稿（含四類規則、具體 datatable 測試資料）。含 `(待澄清)` 的項目暫時跳過。
   - ES 中的每條原子規則 → 對應一條 Gherkin Rule + Example
   - AI 自行推斷具體的 datatable 測試資料
   - Rule 命名遵循四類前綴嚴格句型

2. **實體推導**：從 ES Aggregates 直接映射為 Tables 初版。
   - 每個 Aggregate → 一個 Table
   - 標記不確定部分（型別、約束等）

3. **Actions 推導**：從 Feature Files 生成 actions.yml 草稿。

#### 草稿展示

一次展示所有產出物草稿，讓用戶總覽全貌：

```
根據 ${ES_SPEC_PATH} 產出以下初版草稿：

【Feature Files】（N 個 clear 項目已生成，M 個含待澄清項目暫緩）
- 建立訂單.feature ✓
- 建立付款資訊.feature ✓
- 處理付款結果.feature ✗（ES 中含待澄清）

【SQL Schema + Entity Mapping】
- schema.sql — K 個 Table（從 ES Aggregates 映射）
- entity_to_table_mapping.yml

【Actions Spec】
- actions.yml — N 個 Action

以上草稿有以下不確定處需要確認：
1. ...
2. ...

請審閱草稿，指出需要修改的地方。審閱完成後，我們將處理待澄清的項目。
```

#### 草稿審閱後

- 用戶指出的修正 → 視為 Sub-question（不計入提問額度），修正後重新確認。
- 草稿確認後，對含 `(待澄清)` 的 ES 項目及草稿中仍不確定的部分，進入現有的澄清循環。

### 2. 行為探索（關注點 A）

#### 功能識別

1. 判斷輸入來源：
   - **若來自 `${ES_SPEC_PATH}`**：直接採用 ES 中的 Commands 與 Read Models。不重新識別、不合併、不拆分。
   - **若來自需求文檔**：解析文檔，識別 Command 與 Query。
2. 將識別結果列表呈現給用戶確認。

#### DFS 澄清模式

對含 `(待澄清)` 的功能或 raw idea 輸入，按以下固定順序澄清其規則：

1. **前置（狀態）** — 操作前系統必須滿足什麼狀態？
2. **前置（參數）** — 輸入參數有什麼約束？
3. **後置（回應）** — 操作回傳什麼內容？（主要用於 Query）
4. **後置（狀態）** — 操作成功後系統狀態如何變化？（主要用於 Command）

每條規則依照澄清循環進行：提問 → 更新 → 確認 → 下一題。
一個功能的所有規則皆為 clear 後，進入下一個功能。

### 3. 實體推導（關注點 B）

從已完成的 Feature Files 和 ES Aggregates 推導資料模型：

1. **掃描所有 Feature File**，蒐集 datatable 中的所有實體與屬性。
2. **與 ES Aggregates 合併**（若存在），交叉比對屬性。
3. **識別列舉型別**（Feature File 中出現的有限值集合 → CHECK 約束或 ENUM）。
4. **推導約束**（前置條件規則 → CHECK constraint）。
5. **推導關聯**（實體共現方式 → Foreign Key）。
6. **僅澄清仍不明確的部分**。

### 4. 輸出規格檔案

依照 [`formulation-rules.md`](../rules/formulation-rules.md) 中的「輸出格式規範」執行：

**資料模型輸出**：
- `spec/data/schema.sql` - SQL DDL 定義
- `spec/data/entity_to_table_mapping.yml` - Entity 與表映射

**功能模型輸出**：
- `spec/features/*.feature` - sdd.os ISA Gherkin 格式（四類規則）

---

## sdd.os ISA Feature File 格式範本（SpecFormula 標準，四類規則）

```gherkin
# Action: actionFunctionName
# [POST] /api/action-path
# Summary: 功能名稱
Feature: 功能名稱

  Background:
    Given 準備一個使用者, with table:
      | >User1.id | email            | name |
      | <user1Id  | user@example.com | 小明 |
    And 準備一個商品, with table:
      | >Product1.id | name     | price |
      | <product1Id  | 宮保雞丁 | 120   |

  # ========== 前置條件 ==========

  #------------------------------------------------------------
  Rule: 前置（狀態）- 規則描述
  #------------------------------------------------------------

    Example: 例子名稱
      When (UID="$Entity1.id") {功能名稱}, call table:
        | param1       | param2 |
        | $Entity2.id  | value2 |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 前置（參數）- 規則描述
  #------------------------------------------------------------

    Example: 例子名稱
      When (No Actor) {功能名稱}, call table:
        | param1 | param2 |
        | value1 | value2 |
      Then 操作失敗

  # ========== 後置條件 ==========

  #------------------------------------------------------------
  Rule: 後置（狀態）- 規則描述
  #------------------------------------------------------------

    Example: 例子名稱
      When (UID="$Entity1.id") {功能名稱}, call table:
        | param1       | param2 |
        | $Entity2.id  | value2 |
      Then {功能名稱}(201)回應, with table:
        | >result.field1 | field2 |
        | <resultField1  | value2 |
      And 應該存在一個{entity}, with table:
        | entityId     | column2 |
        | $Entity1.id  | value2  |
```

### 完整範例

見 [`../resources/examples/example-feature.feature`](../resources/examples/example-feature.feature)

---

## 核心原則

**詳見 [`formulation-rules.md`](../rules/formulation-rules.md)**，關鍵原則包括：

### 通用原則
- **無腦補或任意假設原則**：嚴格遵守原始規格文本
- **原子化規則**：每個 Rule 只驗證一件事
- **四類規則分類**：每個 Rule 必須標註四類之一
- **嚴格命名句型**：`<四類前綴> - <主詞> 必須/應 <單一條件>`
- **Given 設定方式選擇**：簡單 Invariant 用選擇 A，複雜用選擇 B

### sdd.os ISA 特有原則（SpecFormula 標準）
- **Action 綁定**：Feature 必須標註對應的 Server Action 函數名稱
- **summary 一致**：Feature 名稱必須與 actions.yml summary 一致
- **格式統一**：使用 sdd.os ISA 的固定語法格式（SpecFormula 標準）

---

## 關注點切換

若處理某關注點時發現另一個關注點存在缺漏：

1. 在知識地圖中將該項目標記回 `partial`。
2. 切換焦點至該關注點，僅處理被標記的項目。
3. 補充完成後，返回原關注點繼續。

範例：實體推導時發現某 Feature 缺少 Rule → 切換至行為探索補充 → 返回實體推導。

---

## 增量更新

當用戶帶入新需求擴充已完成的系統：

1. 讀取現有規格檔案，將已有項目標記為 `clear`。
2. 解析新需求，識別新增的 Command、Query、Entity。
3. 新項目加入知識地圖，標記為 `missing`。
4. 僅對新增與受影響的項目執行探索流程。
5. 更新結果合併回現有規格檔案。

---

## 輸出檔案結構

```
spec/
├── data/
│   ├── schema.sql                    # SQL DDL 定義（供 Neon PostgreSQL 使用）
│   └── entity_to_table_mapping.yml   # Entity 與表映射
├── features/
│   ├── 建立訂單.feature              # sdd.os ISA Gherkin (四類規則)
│   ├── 查詢訂單.feature
│   └── ...
└── actions/
    └── actions.yml                   # Server Actions 規格（actions-design.md 產出）
```

---

## 與其他 Prompt 的關係

- **前置階段**：
  - `00-event-storming.md`（可選）已產出 `${ES_SPEC_PATH}`
  - `01-discovery.md` 和 `02-clarify.md` 已完成規格釐清
- **本階段角色**：規格表達階段，產出 sdd.os ISA 格式的規格模型（SpecFormula 標準）
- **後續階段**：
  1. `04-actions-design.md` - 從 Feature Files 產出 Server Actions 規格
  2. `05-isa-config.md` - 產出 sdd.os 的 ISA 配置檔案（API Routes + Neon PostgreSQL）

**工作流程**：
```
00-event-storming.md → 01-discovery.md → 02-clarify.md → 03-formulation.md
                                                              ↓
                                                    04-actions-design.md
                                                              ↓
                                                    05-isa-config.md
```

---

## 完成檢查清單

### 資料模型
- [ ] `spec/data/schema.sql` 已產出，包含所有實體的 DDL
- [ ] `spec/data/entity_to_table_mapping.yml` 已產出
- [ ] 每個屬性都有 COMMENT 說明
- [ ] 限制條件已用 CHECK constraint 表達

### 功能模型（sdd.os ISA SpecFormula 標準，四類規則）
- [ ] 每個 Feature 檔案開頭有 `# Action: functionName` 註解
- [ ] 每個 Feature 檔案開頭有 `# [METHOD] /path` 註解
- [ ] 每個 Feature 檔案開頭有 `# Summary:` 註解
- [ ] 每個 Rule 都標註四類之一（前置（狀態）/前置（參數）/後置（回應）/後置（狀態））
- [ ] 每個 Rule 命名遵循嚴格句型
- [ ] 至少有一條前置（參數）Rule
- [ ] 每個 When 使用 `(No Actor|UID="$var") {summary}, call table:` 格式
- [ ] 成功 Then 使用 `{summary}(STATUS)回應, with table:` 格式
- [ ] 失敗 Then 使用 `操作失敗`
- [ ] Entity 驗證使用 `應該存在一個{entity}, with table:` 格式
- [ ] Entity 名稱與 `entity_to_table_mapping.yml` 一致
- [ ] Given 設定方式選擇合理
- [ ] DataTable 使用 VAR 系統（`>contextKey` / `$variable` / `<executionKey`）取代硬編碼 UUID

### 知識地圖
- [ ] 所有行為項目為 clear
- [ ] 所有實體項目為 clear
- [ ] 所有 Actions 項目為 clear（若已進入 Actions 設計）

### 完成條件
當知識地圖所有項目皆為 `clear`：

```
所有規格已完成：
- spec/features/*.feature（X 個 Feature，Y 條 Rule）
- spec/data/schema.sql（Z 個 Table）
- spec/data/entity_to_table_mapping.yml

可進入 Actions 設計階段（04-actions-design.md）。
```
