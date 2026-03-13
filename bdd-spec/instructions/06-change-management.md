# 需求變更協調器

---
description: |
  接收用戶的需求變更描述，分析影響範圍，協調跨產出物的連鎖更新。
  本 prompt 不重寫任何 spec 生成邏輯，所有實際的 spec 生成委託給現有的 instruction。
---

## 目標

接收用戶的需求變更（新增 / 修改 / 刪除），**先進行影響分析**，再協調所有規格產出物的連鎖更新，確保規格的一致性與完整性。

**核心原則**：
- **影響分析先行**：不可跳過影響分析直接修改規格
- **最小變更**：只更新受影響的項目，不觸碰未受影響的規格
- **一致性保證**：所有產出物之間保持一致

---

## 適用場景

| 觸發情境 | 範例 |
|----------|------|
| 用戶說「我想增加一個功能」 | 「我想增加一個退款功能」 |
| 用戶說「我想修改某個規則」 | 「訂單建立後應該要寄送通知信」 |
| 用戶說「我想移除某個功能」 | 「取消付款資訊功能，改為直接在訂單中處理」 |
| 用戶說「我想改變某個實體」 | 「商品要增加一個分類欄位」 |

---

## 執行流程

### 1. 讀取現有 Specs

讀取所有現有規格檔案，建立對現有系統的完整理解：

- `${ES_SPEC_PATH}`（若存在）
- `spec/features/*.feature`
- `spec/data/schema.sql`
- `spec/data/entity_to_table_mapping.yml`
- `spec/actions/actions.yml`（若存在）
- `isa.yml`（若存在）

### 2. 分類變更類型

根據用戶的變更描述，判定屬於以下哪種類型：

| 類型 | 說明 | 範例 |
|------|------|------|
| **新增** | 新的 Command / Read Model / Aggregate | 「我想增加一個退款功能」 |
| **修改** | 既有項目的 Rules / 參數 / 描述 / 屬性變動 | 「訂單建立後應該要寄送通知信」 |
| **刪除** | 移除既有項目 | 「取消付款資訊功能」 |

若變更描述同時涉及多種類型，分別列出。

### 3. 影響分析（Propose First）

**AI 先主動列出所有受影響的項目與預計變更，用戶確認後才執行。**

展示格式：

```
【變更影響分析】

變更類型：<新增 | 修改 | 刪除>
變更描述：<用戶原始描述的摘要>

受影響的項目：

  ES 層（${ES_SPEC_PATH}）：
  - <CommandName>: <預計變更說明>
  - <AggregateName>: <預計變更說明>

  行為層（Feature Files）：
  - <FeatureName>.feature: <預計變更說明>

  資料層（schema.sql + mapping）：
  - <TableName>: <預計變更說明>

  Actions 層（actions.yml）：
  - <ActionName>: <預計變更說明>

  ISA 配置（isa.yml）：
  - <影響說明>（若有新步驟類型）

不受影響的項目：（略）

以上影響分析是否正確？如有遺漏或不正確的地方請指出。(y/n)
```

### 4. 委託執行

用戶確認影響範圍後，依序更新各層級的 spec。更新順序：

```
ES 層 → 行為層 → 資料層 → Actions 層 → ISA 配置
```

#### 新增需求

1. **ES 層**（若 `${ES_SPEC_PATH}` 存在）：在 ES 中新增 Command / Read Model / Aggregate。遵循 `00-event-storming.md` 的格式與提案原則。
2. **行為層**：依照 `03-formulation.md` 的行為探索流程，對新增項目生成 Feature File。
   - 若 ES 項目為 clear → 使用草稿模式（直接生成）
   - 若含 `(待澄清)` → 進入澄清模式
   - Rule 必須使用四類分類法
3. **資料層**：依照 `03-formulation.md` 的實體推導流程，更新 `schema.sql` 和 `entity_to_table_mapping.yml`。
   - 新增的 Aggregate 映射為新 Table
   - 或補充既有 Table 的屬性
4. **Actions 層**：依照 `04-actions-design.md`，將新增的 Feature File 映射為 Action，更新 `actions.yml`。
5. **ISA 配置**：若新增了新的步驟類型，更新 `isa.yml`。

#### 修改需求

1. **ES 層**：修改 `${ES_SPEC_PATH}` 中受影響項目的 Rules / 參數 / Description / Aggregate 屬性。
2. **行為層**：重新生成受影響的 Feature File。未受影響的 Feature File 不變。
3. **資料層**：更新受影響的 Table / Column 定義。
4. **Actions 層**：更新受影響的 Action 定義。
5. **ISA 配置**：通常不需更新。

#### 刪除需求

1. **ES 層**：從 `${ES_SPEC_PATH}` 中移除被刪除的 Command / Read Model。若 Aggregate 不再被任何 Command / Read Model 引用，一併移除。
2. **行為層**：刪除對應的 Feature File。
3. **資料層**：從 `schema.sql` 中移除不再被引用的 Table，或移除不再需要的 Column。更新 `entity_to_table_mapping.yml`。
4. **Actions 層**：從 `actions.yml` 中移除對應的 Action。
5. **ISA 配置**：通常不需更新。

**刪除操作需特別注意級聯影響：** 刪除一個 Command 可能連帶影響其他 Command 的 Predecessors、共用的 Aggregate 屬性等。AI 必須在影響分析階段完整列出所有級聯影響。

### 5. 一致性驗證

所有更新完成後，驗證各 spec 之間的一致性：

- [ ] `${ES_SPEC_PATH}` 中的每個 Command / Read Model 都有對應的 Feature File
- [ ] 每個 Feature File 都有對應的 Action（在 actions.yml 中）
- [ ] `schema.sql` 中的每個 Table 都有對應的 entity mapping
- [ ] Feature File 中的 datatable 欄位與 `schema.sql` 的 Table 欄位一致
- [ ] Feature File 中的 Entity 名稱與 `entity_to_table_mapping.yml` 一致
- [ ] Action 的 summary 與 Feature 名稱一致
- [ ] Action 的 rules 與 Feature File 中的 Rules 一致
- [ ] 所有 Rule 都使用四類分類法
- [ ] 所有 Rule 命名遵循嚴格句型

若發現不一致，列出並提請用戶確認修正方向。

---

## 澄清循環

若變更過程中需要澄清不確定的部分，遵循以下循環：

1. 問 **一題**選擇題，但允許其他說明 (Others)。
   - 優先使用多選題格式。
   - 問題必須具體、可回答，避免開放式問題。
   - 一個問題只澄清一件事。
2. 用戶回答，可以補充文字說明 (Others)。
3. 更新對應的規格檔案（僅更新與該回答相關的部分）。
4. 展示更新內容。
5. 詢問：「這樣的更新是否符合預期？(y/n)」
6. `y` → 進入下一題。`n` → 詢問如何調整，修正後重新確認。

### 提問上限

每回合最多 **${MAX_QUESTIONS_PER_ROUND} 題**（跨所有層級合計）。

### Question 與 Sub-question 的區分

**Question（計入上限）**：切換至新的受影響項目時遞增。

**Sub-question（不計入上限）**：仍在解決同一項目的所有互動，包含確認提示、追問釐清、用戶回答 `n` 後的修正循環。

---

## 最小變更原則

**只更新受影響的項目，不觸碰未受影響的 spec。** 不因為變更了某個 Command 而重寫整個 `actions.yml` 或所有 Feature Files。保持變更的精確性與可追溯性。

---

## 核心約束

- **不重寫現有 instruction 的邏輯。** Feature File 格式、SQL Schema 規範、Actions 設計原則等皆由各自的 instruction 定義，本流程僅負責調度。
- **影響分析必須在執行前獲得用戶確認。** 不可跳過確認直接修改 spec。
- **嚴格遵守用戶的變更描述，不擅自擴大變更範圍。**
- **四類規則分類法**：新增或修改的 Rule 必須使用四類分類法。
- **嚴格命名句型**：新增或修改的 Rule 命名必須遵循嚴格句型。

---

## 完成條件

當所有受影響的 spec 皆已更新且通過一致性驗證：

```
需求變更已完成：

【變更摘要】
- <變更類型>：<變更描述>

【已更新的檔案】
- ${ES_SPEC_PATH}（若適用）
- spec/features/<affected>.feature
- spec/data/schema.sql
- spec/data/entity_to_table_mapping.yml
- spec/actions/actions.yml（若適用）

所有 spec 一致性驗證通過。
可隨時提出新的變更或進入下一階段。
```

---

## 與其他 Instruction 的關係

| 層級 | 委託對象 | 產出 |
|------|---------|------|
| ES 層 | `00-event-storming.md` 格式規範 | 更新的 ES spec |
| 行為層 | `03-formulation.md` 行為探索流程 | `spec/features/*.feature` |
| 資料層 | `03-formulation.md` 實體推導流程 | `spec/data/schema.sql` + mapping |
| Actions 層 | `04-actions-design.md` | `spec/actions/actions.yml` |
| ISA 配置 | `05-isa-config.md` | `isa.yml` |
| 格式規範 | `formulation-rules.md` | 四類規則、命名句型、ISA 格式 |

