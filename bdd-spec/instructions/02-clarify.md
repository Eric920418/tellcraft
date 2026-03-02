---
description: |
  根據 .clarify/ 資料夾中的釐清項目，與使用者進行互動式釐清，並將答案即時更新回
  對應的規格模型檔案（spec/data/ 或 spec/features/）。採用 sdd.os ISA Gherkin 格式。
  支援「提案優先」模式：AI 先根據上下文提案答案，用戶確認或糾正。
---

目標：依據 Discovery 階段產出的釐清項目，透過互動式問答流程逐一釐清，並將釐清結果即時整合回規格檔案中。

**注意**：本流程產出的 Gherkin 採用 **sdd.os ISA** 格式，詳見 [`formulation-rules.md`](../rules/formulation-rules.md)。

# 執行步驟

## 0. 初始化載入

1. **讀取釐清策略**：載入 `.clarify/overview.md`，取得：
   - 釐清項目總數與分佈
   - 建議的釐清順序（由核心至延伸，DFS 聚焦）
   - 優先級分佈與依賴關係

2. **載入釐清項目**：依照 `overview.md` 建議的順序，讀取所有釐清項目檔案（`.clarify/data/*.md` 和 `.clarify/features/*.md`）

3. **載入現有規格**：將以下規格檔案載入記憶體：
   - `spec/data/schema.sql`
   - `spec/data/entity_to_table_mapping.yml`
   - `spec/features/*.feature`
   - 保持原始格式與結構，供後續增量更新使用
   - **建立術語對照表**：提取所有繁體中文術語（實體名稱、屬性 COMMENT、Feature 名稱、步驟用詞），供翻譯時參照

4. **載入 ES 規格**（若存在）：讀取 `${ES_SPEC_PATH}`，作為「提案優先」模式的上下文基礎。

## 1. 建立釐清佇列

根據 `overview.md` 的建議順序，建立優先化的釐清佇列：

### 排序原則

1. **核心優先**：優先處理 High 優先級項目
2. **DFS 聚焦**：同一 Feature / Entity 的釐清項目連續處理，避免跳躍
3. **由核心至延伸**：先處理核心實體與功能，再處理邊界條件與細節
4. **平衡分佈**：在資料模型與功能模型間交替進行，避免連續處理同類問題
5. **依賴關係**：若項目 B 依賴項目 A 的釐清結果，確保 A 先於 B

### 佇列管理

- 初始佇列包含所有釐清項目
- 每個項目標記狀態：Pending（待處理）/ In-Progress（處理中）/ Resolved（已解決）/ Skipped（已跳過）
- 使用者可選擇跳過低優先級項目
- 提前終止時，未處理項目標記為 Deferred

## 2. 逐題提問循環（互動式）

### 2.0 提案優先模式（Propose First, Ask Later）

**核心改進**：對於有足夠上下文的釐清項目，AI 不直接提問，而是**先提案答案**讓用戶確認。

#### 提案判定規則

在提出每個釐清項目前，先評估是否適合使用提案模式：

| 條件 | 模式 | 說明 |
|------|------|------|
| ES 中有明確的 Rule 對應 | **提案模式** | 根據 ES 內容直接提案 |
| 上下文可合理推斷答案 | **提案模式** | AI 提案 + 理由，用戶確認 |
| 完全無法推斷 | **提問模式** | 使用傳統多選題提問 |

#### 提案格式

```
---
[釐清進度：第 X / 總 Y 題] [優先級：High/Medium/Low] [模式：提案]

# 提案

根據 <上下文來源>，我建議以下答案：

**問題**：<白話翻譯版問題>
**建議答案**：<AI 的提案答案>
**理由**：<為什麼這樣建議>

## 定位

<ERM：哪個實體的哪個屬性？或是哪個關係？>
<Feature：哪個功能的哪條規則？或是哪個 Example？>

## 規格預覽

<若接受此提案，規格將如何更新的預覽>

請選擇：
- **接受 (Y)** — 採用此建議並更新規格
- **修改** — 大致同意但需調整（請說明）
- **拒絕** — 不同意，請提供您的答案
---
```

#### 提案規則

- **提案必須有明確依據**：不可憑空猜測，必須指出推斷的依據（ES 規格、上下文線索等）
- **接受視同 Resolved**：用戶接受提案 → 等同回答了問題，不計入提問額度
- **修改視同 Sub-question**：用戶修改提案 → 不計入提問額度
- **拒絕轉為提問**：用戶拒絕提案 → 退回傳統提問模式，計入提問額度

### 2.1 提問流程（傳統模式）

**一次只呈現一題**，格式如下：

```
---
[釐清進度：第 X / 總 Y 題] [優先級：High/Medium/Low] [模式：提問]

# 問題

<白話翻譯版問題>

## 定位

<ERM：哪個實體的哪個屬性？或是哪個關係？>
<Feature：哪個功能的哪條規則？或是哪個 Example？>

## 規則類型

<前置（狀態）| 前置（參數）| 後置（回應）| 後置（狀態）| 資料模型 | 術語>

## 選項

<呈現多選題表格>

| 選項 | 描述 |
|--------|-------------|
| A | <選項 A 白話描述> |
| B | <選項 B 白話描述> |
| C | <選項 C 白話描述> |
| D | <選項 D 白話描述>（如有）|
| E | <選項 E 白話描述>（如有）|
| Short | 提供其他簡短答案（<=5 字）|

---
```

- 對短答題（無明確離散選項），在選項表格後加註：`格式: 簡短回答 (<=5 字)`

#### 翻譯準則

在呈現問題與選項前，必須先執行白話翻譯，遵循以下準則：

1. **術語一致性檢查**：
   - 載入 `spec/data/schema.sql`、`spec/data/entity_to_table_mapping.yml` 和 `spec/features/*.feature` 中該實體/功能的相關區段
   - 提取已使用的繁體中文術語（如實體名稱、屬性的中文 COMMENT、Feature 名稱、步驟用詞）
   - 建立「技術詞彙 ↔ 規格中文術語」對照表

2. **問題白話化**：
   - 將英文欄位名稱（如 `price`、`quantity`）替換為規格中已使用的中文術語（如「價格」、「數量」）
   - 可在首次提及時用小括號備註英文名稱，如：「價格 (price)」
   - 將技術詞彙（如「屬性」「欄位」「關係」「約束」）轉換為領域語言（如「資訊」「項目」「關聯」「限制」）
   - 保持問題的完整語義，不簡化技術細節

3. **選項白話化**：
   - 將技術描述轉換為使用者情境語言
   - 移除程式語法符號（如 `>=`、`!=`），改用「大於等於」「不等於」
   - 保持選項間的清晰對比

4. **嚴格禁止**：
   - **禁止發明新術語**：若規格中未定義該概念的中文名稱，保留英文並加小括號備註
   - **禁止語義偏移**：白話化不可改變原始問題的技術含義
   - **禁止不一致用詞**：同一概念在不同釐清題中必須使用相同中文術語

5. **白話品質自檢清單**：
   - 問題和選項中不可出現：程式符號（>=, <=, !=, &&, ||）、型別名稱（INT, VARCHAR, DECIMAL）、SQL 語法（CHECK, NOT NULL, CONSTRAINT）、程式概念（API, CRUD, schema）
   - 替換規則：null → 空白/未填寫、>= 0 → 不可以是負數、NOT NULL → 必填、BOOLEAN → 是或否
   - 自檢方法：生成後想像你在跟一位沒有程式經驗的花店老闆對話，她會疑惑就需要重寫

6. **翻譯驗證**：
   - 翻譯後，對照規格檔案確認所有術語皆已在規格中使用過
   - 若發現規格中對同一概念有多種用詞（如「顧客」與「客戶」），優先使用 Feature 檔案中的用詞（因更貼近使用者語言）

### 技術上下文記錄

每個釐清項目回答後，用戶的答案應映射回技術決策並記錄在 `technicalContext` 中。

**示範**：
- 用戶回答「訂單總金額 = 所有品項的小計加起來」
  → `computations: [{ target: "total_amount", formula: "SUM(order_items.subtotal)", description: "訂單總金額等於所有品項小計加總" }]`
- 用戶回答「訂單取消後要自動恢復庫存」
  → `stateTransitions: [{ entity: "訂單", field: "status", from: "active", to: "cancelled", trigger: "cancel_order", description: "取消訂單" }]`
  → `constraints: [{ expression: "ON cancel_order: product.stock += order_item.quantity", description: "取消訂單時恢復庫存", scope: "cross_entity" }]`

#### 翻譯範例

**原始問題**（來自釐清項目檔案）：
> `Product` 實體的 `price` 屬性是否允許 `null` 值？

**翻譯後問題**：
> 商品的價格 (price) 是否可以空白（未設定）？

**原始選項**：
- A: 允許 `null`，表示價格待定
- B: 不允許，必須 `>= 0`

**翻譯後選項**：
- A: 可以空白，表示價格尚未確定
- B: 不可空白，必須是大於等於 0 的數字

### 2.2 回答處理

使用者回答後：

1. **驗證回答**：
   - 提案模式：檢查是否為 Y/修改/拒絕
   - 提問模式：檢查回答是否對應某選項（A/B/C/D/E）
   - 若為 Short，確認符合不超過 5~10 字的限制（沒這麼嚴格）
   - 若含糊或不明確，立即要求釐清（仍計入同一題，不前進到下一題）

2. **記錄答案**：
   - 將答案暫存於工作記憶
   - 標記該釐清項目為 Resolved

3. **立即整合**（見步驟 3）

4. **更新進度**：
   - 將該釐清項目從 Pending 改為 Resolved
   - 移至佇列的下一題

### 2.3 終止條件

在下列情況停止繼續提問：

- 所有釐清項目都已處理完畢
- 使用者明確表示終止（如「done」「stop」「no more」「proceed」）
- 剩餘項目僅為 Low 優先級且使用者選擇跳過

**切勿提前透露後續題目**，保持一次一題的節奏。

### 2.4 互動原則

- **提案優先**：有足夠上下文時，先提案再確認，減少用戶認知負擔
- **單一焦點**：每次只聚焦一個釐清項目，避免混淆
- **DFS 聚焦**：連續處理同一 Feature / Entity 的釐清項目
- **快速驗證**：若回答含糊，立即要求釐清，不要臆測
- **進度透明**：每題都顯示進度（第 X / 總 Y 題）
- **優先級可見**：每題都顯示優先級，讓使用者了解重要性
- **規則類型可見**：每題都顯示所屬的規則類型（四類之一）

## 3. 立即整合（增量更新）

**每次**答案被接受後，立即執行增量更新：

### 3.0 遵循規格表達規則

**所有**規格檔案的更新都必須依照 [`formulation-rules.md`](../rules/formulation-rules.md) 中的規範執行，包括：
- **核心原則**：無腦補或任意假設原則
- **資料模型萃取規則**：實體、屬性、關係的萃取與標註方式
- **功能模型萃取規則**：Feature、Rule、Example 的萃取與描述方式
- **四類規則分類**：正確分類為前置（狀態）/ 前置（參數）/ 後置（回應）/ 後置（狀態）
- **輸出格式規範**：SQL Schema 與 Gherkin Language 的格式要求

將釐清結果轉換為規格內容時，必須確保符合上述規則的所有要求。

### 3.1 更新策略

根據釐清項目的定位，決定更新目標：

- **資料模型釐清** → 更新 `spec/data/schema.sql` 和 `spec/data/entity_to_table_mapping.yml`（依照 `formulation-rules.md` 的 SQL Schema 格式規範）
  - 更新實體屬性定義（型別、COMMENT、CHECK 約束）
  - 新增或修改外鍵關係定義
  - 更新跨屬性不變條件
  - 新增狀態轉換規則

- **功能模型釐清** → 更新 `spec/features/<功能名>.feature`（依照 `formulation-rules.md` 的 **sdd.os ISA Gherkin (Server Actions 版)** 格式規範）
  - 新增或修改 Rule（必須標註四類之一：前置（狀態）/ 前置（參數）/ 後置（回應）/ 後置（狀態））
  - 新增或修改 Example（**sdd.os ISA 格式 - Server Actions 版**）：
    - When 步驟使用 `{summary}, call table:` 格式
    - Then 步驟使用 `{summary}成功, with table:` 或 `操作失敗`
    - Entity 驗證使用 `存在一個{entity}, with table:`
  - 更新前置/後置條件
  - 補充錯誤處理情境（使用 `操作失敗`）

- **術語衝突釐清** → 全文正規化
  - 統一所有規格檔案中的術語
  - 必要時保留「（先前稱為 'X'）」註記（僅一次）

### 3.2 更新原則

- **遵循表達規則**：所有更新必須符合 [`formulation-rules.md`](../rules/formulation-rules.md) 的規範
- **取代而非累加**：若釐清使先前的含糊敘述失效，直接取代，不保留矛盾內容
- **保留格式**：維持原有的標題階層、區段順序、縮排風格
- **精煉可測試**：插入的釐清內容保持精煉且可驗證，避免敘事漂移
- **原子性覆寫**：每次整合後立即儲存規格檔，降低情境遺失風險
- **句型一致**：Feature 檔案中的 Step 定義保持句型一致，避免語義相同但句型不同造成重複實作

### 3.3 整合步驟
每一步都必須扎實做到，不可跳步驟。
1. **定位目標區段**：根據釐清項目的「定位」欄位，找到需更新的實體/屬性/功能/規則
2. **套用釐清**：將答案轉換為對應的 SQL Schema 或 Gherkin 語法，**必須依照 [`formulation-rules.md`](../rules/formulation-rules.md) 的規範執行**
3. **驗證語法**：確保更新後的內容符合 SQL 或 Gherkin 格式
4. **檢查一致性**：確保無矛盾陳述、術語統一
5. **儲存規格檔**：原子性覆寫對應的規格檔
6. **更新釐清項目狀態**：歸檔已處理的釐清項目（見 3.6）

### 3.4 SQL Schema 更新範例

**原始釐清問題**（技術導向）：「MenuItem 的 price 是否允許負值？」

**翻譯後問題**（白話）：「菜品的價格 (price) 是否可以是負數？」

**使用者答案**：「A - 不可以，必須是大於等於 0 的數字」

**規格更新**：

更新前：
```sql
CREATE TABLE menu_items (
    id VARCHAR(10) PRIMARY KEY COMMENT '菜品唯一識別碼',
    price DECIMAL(10,2) NOT NULL COMMENT '菜品價格'
) COMMENT '菜品實體';
```

更新後：
```sql
CREATE TABLE menu_items (
    id VARCHAR(10) PRIMARY KEY COMMENT '菜品唯一識別碼',
    price DECIMAL(10,2) NOT NULL COMMENT '菜品價格，必須 >= 0',
    CONSTRAINT chk_price_positive CHECK (price >= 0)
) COMMENT '菜品實體';
```

### 3.5 Gherkin 更新範例（sdd.os ISA - Server Actions 版，四類規則）

Gherkin 格式詳見 [`../rules/formulation-rules.md`](../rules/formulation-rules.md)。

**釐清範例**：

| 問題 | 將菜品加入訂單時，數量填 0 該怎麼處理？ |
|------|---------------------------------------|
| 規則類型 | 前置（參數） |
| 答案 | B - 不允許加入，要顯示錯誤訊息 |
| 更新 | 新增 `Rule: 前置（參數）- 加入訂單時數量必須大於 0` 及對應 Example |

更新後新增的規則：
```gherkin
  #------------------------------------------------------------
  Rule: 前置（參數）- 加入訂單時數量必須大於 0
  #------------------------------------------------------------

    Example: 拒絕數量為 0 的菜品
      When 新增訂單品項, call table:
        | orderId | productId | quantity |
        | O001    | P001      | 0        |
      Then 操作失敗
```

### 3.6 釐清項目狀態更新

**每次**規格檔更新完成後，立即執行釐清項目歸檔，保持 `.clarify/` 資料夾的可維護性：

#### 步驟 1：在釐清項目檔案底部記錄回答

在移動釐清項目檔案之前，先在該檔案底部追加解決記錄：

```markdown
---
# 解決記錄

- **模式**：<提案 | 提問>
- **回答**：<使用者選擇的選項，如：A - 選項描述，或「接受提案」>
- **更新的規格檔**：<spec/data/schema.sql 或 spec/features/*.feature>
- **變更內容**：<簡述規格檔的變更內容>
```

範例：
```markdown
---
# 解決記錄

- **模式**：提案
- **回答**：接受提案 — 訂單必須屬於某個使用者（User 1:N Order）
- **更新的規格檔**：spec/data/schema.sql
- **變更內容**：在 Order 實體中新增 user_id 外鍵，建立 User 1:N Order 關係
```

#### 步驟 2：從 overview.md 移除該項目

- 定位該釐清項目在 `.clarify/overview.md` 中的所有出現位置：
  - 「3. 建議釐清順序」中的項目條目
  - 「5. 覆蓋度摘要」中的引用（如適用）
- 完整移除該項目的條目（包括編號、描述、影響說明、依賴/組合標記）
- 不重新編號剩餘項目，保持原有編號以利追蹤
- 更新「1. 釐清項目統計」的計數（總計 -1，對應分類 -1）
- 儲存更新後的 `overview.md`

#### 步驟 3：歸檔釐清項目檔案

- 根據原始檔案路徑，決定目標歸檔路徑：
  - 原路徑：`.clarify/data/<檔案名>.md` → 目標：`.clarify/resolved/data/<檔案名>.md`
  - 原路徑：`.clarify/features/<檔案名>.md` → 目標：`.clarify/resolved/features/<檔案名>.md`
- 確保目標目錄存在（必要時建立 `.clarify/resolved/data/` 或 `.clarify/resolved/features/`）
- 移動檔案至目標路徑（檔案底部已包含步驟 1 加入的解決記錄）

#### 目的與效益

- **記錄決策歷程**：在釐清項目檔案底部記錄回答，保留完整的決策脈絡
- **保持 overview.md 簡潔**：避免隨時間累積已解決項目，便於快速查看剩餘待處理項目
- **保留歷程記錄**：歸檔至 `resolved/` 資料夾，長期維護時可回溯釐清決策
- **結構化管理**：維持 `data/` 與 `features/` 分層，便於後續查詢特定領域的歷史釐清

## 4. 驗證（於每次寫入後與最終完成時）

### 4.1 即時驗證（每次更新後）

- [ ] 更新的區段已移除原本的含糊佔位文字
- [ ] 不存在互相矛盾的陳述
- [ ] 格式有效：
  - `spec/data/schema.sql` 遵守 SQL DDL 語法，每個欄位都有 COMMENT
  - `spec/data/entity_to_table_mapping.yml` 與 schema.sql 一致
  - `spec/features/*.feature` 遵守 **sdd.os ISA Gherkin (Server Actions 版)** 語法：
    - 檔案開頭有 `# Action: functionName` 和 `# Summary:` 註解
    - 嚴格階層 Feature > Rule > Example
    - 每個 Rule 都標註四類之一（前置（狀態）/ 前置（參數）/ 後置（回應）/ 後置（狀態））
    - When 步驟使用 `{summary}, call table:` 格式
    - 成功 Then 使用 `{summary}成功, with table:` 格式
    - 失敗 Then 使用 `操作失敗`
    - Entity 驗證使用 `存在一個{entity}, with table:` 格式
- [ ] 術語一致性：更新後的內容使用標準術語，Entity 名稱與 `entity_to_table_mapping.yml` 一致
- [ ] 釐清項目狀態已更新：
  - 釐清項目檔案底部已追加解決記錄（包含模式、回答、更新的規格檔、變更內容）
  - 該項目已從 `.clarify/overview.md` 中移除
  - 釐清項目檔案已移動至 `.clarify/resolved/` 對應資料夾
  - `overview.md` 的統計數字已更新

### 4.2 最終驗證（釐清流程結束後）

- [ ] 每個 Resolved 的釐清項目都對應一次規格更新
- [ ] Feature 檔案中的 Step 句型一致（sdd.os ISA 格式 - Server Actions 版）
- [ ] 所有 SQL Schema 的欄位都有 COMMENT 說明
- [ ] 所有 Feature 的 Rule 都標註四類之一（前置（狀態）/ 前置（參數）/ 後置（回應）/ 後置（狀態））
- [ ] 所有 Feature 的 Rule 都至少有一個 Example（或標記 #TODO）
- [ ] 所有 Feature 都標註 `# Action: functionName` 和 `# Summary:`
- [ ] 所有 When 步驟都使用 `{summary}, call table:` 格式
- [ ] 所有成功 Then 使用 `{summary}成功, with table:`，失敗使用 `操作失敗`
- [ ] Entity 名稱與 `entity_to_table_mapping.yml` 一致
- [ ] 跨檔案的術語保持一致

## 5. 回報完成（在提問循環結束或提前終止後）

產出詳細的完成報告：

### 5.1 釐清統計

- 總釐清項目數：X 項
- 已釐清（Resolved）：Y 項
  - 透過提案模式解決：A 項
  - 透過提問模式解決：B 項
- 已跳過（Skipped）：Z 項
- 延後處理（Deferred）：W 項

### 5.2 更新規格檔路徑

列出所有更新過的規格檔案：
- `spec/data/schema.sql` - 更新 A, B, C 實體
- `spec/features/將菜品加入訂單.feature` - 新增 2 條規則與 3 個例子
- `spec/features/確認訂單.feature` - 更新 1 條規則與 2 個例子

### 5.3 觸及區段

列出所有觸及的實體、屬性、功能、規則名稱

### 5.4 覆蓋度摘要表

列出每個檢查分類（A1-A6, B1-B5, C1-C2, D1-D2, E1-E3）的最終狀態：

| 分類 | 狀態 | 說明 |
|------|------|------|
| A1. 實體完整性 | Resolved | 原為 Partial，已釐清 Customer 與 Order 關聯 |
| A2. 屬性定義 | Resolved | 原為 Missing，已補充 price 約束 |
| A3. 屬性值邊界條件 | Clear | 原已足夠 |
| B1. 功能識別 | Resolved | 原為 Partial，已釐清折扣套用時機 |
| B2. 規則完整性 | Deferred | 超出使用者終止點，剩餘 2 個 Low 優先級項目 |
| E1. ES ↔ Feature 對應 | Clear | 所有 ES 項目都有對應 Feature |
| ... | ... | ... |

狀態說明：
- **Resolved**：原為 Partial/Missing 且已釐清
- **Deferred**：因使用者終止或題額限制而延後
- **Clear**：原已足夠，無需釐清
- **Outstanding**：仍為 Partial/Missing 但影響較低

### 5.5 後續建議

- 若所有 High 優先級項目都已 Resolved，建議進入下一階段（規劃或實作）
- 若有 High 優先級項目為 Deferred，建議說明風險並建議再次執行 Discovery + Clarify
- 若有新發現的歧義（在釐清過程中浮現），建議再次執行 Discovery

## 6. 釐清項目檔案管理

### 狀態流轉：Staging Area 機制

本流程採用 **Staging Area（暫存區）** 機制，提升用戶的容錯率：

```
┌─────────────────────────────────────────────────────────────┐
│                    狀態流轉圖                                │
│                                                              │
│   Pending ──▶ Reviewing ──▶ Confirmed ──▶ Resolved          │
│     │            │              │                            │
│     │            │              ▼                            │
│     │            │        批量歸檔                            │
│     │            │                                           │
│     │            ▼                                           │
│     │       用戶反悔                                          │
│     │            │                                           │
│     └────────────┘                                           │
│         回到 Pending                                         │
└─────────────────────────────────────────────────────────────┘
```

### 狀態定義

| 狀態 | 說明 | 存儲位置 |
|------|------|----------|
| **Pending** | 待處理 | `.clarify/data/` 或 `.clarify/features/` |
| **Reviewing** | 已回答，待確認 | `.clarify/staging/` |
| **Confirmed** | 已確認，待批量歸檔 | `.clarify/staging/` |
| **Resolved** | 已歸檔 | `.clarify/resolved/` |

### 歸檔結構

```
.clarify/
├── overview.md          # 所有項目的狀態追蹤
├── data/                # 待處理的資料模型釐清項目
├── features/            # 待處理的功能模型釐清項目
├── staging/             # 暫存區（已回答但未確認）
│   ├── data/
│   └── features/
└── resolved/            # 已確認歸檔的釐清項目
    ├── data/
    └── features/
```

### 批量確認檢查點

**每 ${BATCH_CONFIRM_INTERVAL} 題**或**階段結束時**，詢問用戶確認：

```
---
📋 釐清確認檢查點

以下 5 題已回答完成，請確認是否正確：

| # | 問題摘要 | 模式 | 您的回答 |
|---|----------|------|----------|
| 1 | 商品價格是否可為負數？ | 提案 | 接受 — 不可以 |
| 2 | 訂單是否必須綁定用戶？ | 提案 | 接受 — 是 |
| 3 | 庫存不足時如何處理？ | 提問 | B - 拒絕下單 |
| 4 | 取消訂單後是否恢復庫存？ | 提問 | A - 是 |
| 5 | 會員等級如何影響折扣？ | 提問 | Short - 按等級打折 |

請選擇：
- **確認全部 (Y)** - 將以上答案確認並繼續下一批
- **修改第 N 題** - 例如輸入「修改 3」重新回答第 3 題
- **全部重來** - 清除以上所有回答，重新開始這 5 題
---
```

### 反悔機制

若用戶在確認檢查點選擇「修改第 N 題」：

1. 將該項目狀態從 `Reviewing` 退回 `Pending`
2. 從 `staging/` 移回 `data/` 或 `features/`
3. 撤銷對應的規格檔更新（回復到該題回答前的版本）
4. 重新提問該題

### overview.md 狀態追蹤

```yaml
# .clarify/overview.md
round: 2
statistics:
  total: 15
  pending: 5
  reviewing: 4    # 已回答但未確認
  confirmed: 3    # 已確認待歸檔
  resolved: 3     # 已歸檔

# 狀態明細
items:
  - id: C-001
    status: resolved
    mode: propose     # 提案模式解決
    resolved_at: round-1
  - id: C-002
    status: reviewing
    mode: ask          # 提問模式
    answered: "B - 不可以"
  - id: C-003
    status: pending
```

### 批量歸檔時機

執行批量歸檔的時機：
1. 用戶確認一批（${BATCH_CONFIRM_INTERVAL} 題）答案後
2. 釐清階段結束時（所有 reviewing 項目自動確認）
3. 用戶明確輸入「確認全部」

**歸檔操作**：
- 將 `staging/` 中的所有 `Confirmed` 項目移至 `resolved/`
- 更新 `overview.md` 統計數字
- 此操作不可逆（歸檔後無法反悔）

# 行為規則

- **提案優先**：有足夠上下文時，先提案再確認，大幅減少提問輪數
- **嚴格依序**：按照 `overview.md` 建議的順序提問，不跳題
- **DFS 聚焦**：同一 Feature / Entity 的釐清項目連續處理
- **單題單焦點**：一次只呈現一題，等待回答後再進入下一題
- **必先翻譯**：每題提問前，必須先執行白話翻譯，確保問題與選項符合翻譯準則
- **術語精準**：翻譯時必須使用規格檔案中已有的繁體中文術語，嚴禁發明新詞
- **術語對照**：每次翻譯前，從規格檔案中提取該領域的中文術語對照表
- **立即整合**：每個答案接受後立即更新規格檔，不延遲
- **Staging Area**：回答後項目進入 `staging/` 暫存區，標記為 `Reviewing`
- **批量確認**：每 ${BATCH_CONFIRM_INTERVAL} 題或階段結束時，詢問用戶確認，允許反悔修改
- **批量歸檔**：用戶確認後，才執行歸檔至 `.clarify/resolved/`
- **快速驗證**：若回答含糊，立即要求釐清，不臆測使用者意圖
- **尊重終止**：使用者隨時可終止，已處理的釐清項目標記為 Resolved，未處理的標記為 Deferred
- **保留格式**：更新規格檔時保持原有格式與結構，不重新排序無關區段
- **術語一致**：全文使用統一術語，必要時正規化先前的不一致用詞
- **句型統一**：Feature 檔案中的 Step 定義保持 sdd.os ISA 句型一致
- **四類規則分類**：Gherkin 中的 Rule 必須標註四類之一（前置（狀態）/ 前置（參數）/ 後置（回應）/ 後置（狀態））
- **sdd.os ISA 格式（Server Actions 版）**：Gherkin 必須採用 sdd.os ISA 格式：
  - When 使用 `{summary}, call table:`
  - Then 使用 `{summary}成功, with table:` 或 `操作失敗`
  - Entity 驗證使用 `存在一個{entity}, with table:`
- **避免重複**：若釐清使先前敘述失效，直接取代，不保留矛盾內容
- **可測試性**：所有插入的釐清內容都應精煉且可直接透過 sdd.os 生成測試程式碼

# 輸出格式要求

1. **互動提問** → 終端輸出或聊天介面
2. **規格更新** → `spec/data/schema.sql`、`spec/data/entity_to_table_mapping.yml` 和 `spec/features/*.feature`
3. **釐清項目歸檔**（自動）→ 即時更新 `.clarify/overview.md` 並移動項目至 `.clarify/resolved/`
4. **完成報告** → 終端輸出或回覆訊息
