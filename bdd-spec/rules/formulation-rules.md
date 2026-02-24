# 規格表達規則（sdd.os ISA 格式 - Server Actions 版）

## 核心原則：無腦補或任意假設原則
**嚴格遵守原始規格文本內容，如果需求中沒有明確寫出的欄位、規則、條件或行為，就不要加入。不要擅自假設、推測或補充任何需求中不存在的內容。**

---

## sdd.os ISA Gherkin 說明（Server Actions 版）

本規範採用 **sdd.os ISA (Implementation-Specific Abstraction)** Gherkin 格式，針對 **Next.js Server Actions + Supabase** 技術棧設計：

| 特點 | 說明 |
|------|------|
| Action 呼叫格式 | `{summary}, call table:` |
| 成功回應格式 | `{summary}成功, with table:` |
| Entity 驗證格式 | `存在一個{entity}, with table:` |
| 操作失敗格式 | `操作失敗` |

**核心價值**：
- 直接對應 sdd.os 的 ISA 配置（`isa_codegen.yml`）
- 可透過 sdd.os 自動生成測試程式碼（呼叫 Server Actions）
- 與 Actions 規格（`spec/actions/actions.yml`）整合
- 使用 Supabase Client 進行 Entity 驗證

---

# 四類規則分類法

## 規則類型定義

每條 Rule 必須歸類為以下四類之一，不可省略分類：

| 類型 | 前綴 | 說明 | 典型驗證 | 適用 Feature 類型 |
|------|------|------|----------|-----------------|
| **前置（狀態）** | `前置（狀態）` | 執行前系統必須滿足的狀態約束 | 庫存 > 0、訂單狀態為「待付款」 | Command / Query |
| **前置（參數）** | `前置（參數）` | 輸入參數的約束 | 數量 > 0、email 格式正確、必要參數 | Command / Query |
| **後置（回應）** | `後置（回應）` | 回傳內容的預期 | 查詢結果包含哪些欄位、排序 | 主要用於 Query |
| **後置（狀態）** | `後置（狀態）` | 執行後系統狀態的變化 | 庫存減少、訂單狀態變更 | 主要用於 Command |

### 分類判定流程

```
規則描述
  ├─ 與「執行前的條件」有關？
  │    ├─ 與系統中既有資料的狀態有關？ → 前置（狀態）
  │    └─ 與用戶傳入的輸入參數有關？ → 前置（參數）
  └─ 與「執行後的結果」有關？
       ├─ 與 API 回傳的資料有關？ → 後置（回應）
       └─ 與資料庫中狀態的變化有關？ → 後置（狀態）
```

### 分類範例

| 規則 | 類型 | 理由 |
|------|------|------|
| 商品庫存必須大於 0 | 前置（狀態） | 系統中的既有庫存狀態 |
| 加入數量必須大於 0 | 前置（參數） | 用戶傳入的輸入值 |
| 必要參數必須提供 | 前置（參數） | 用戶傳入的輸入值 |
| 訂單狀態必須為「待付款」 | 前置（狀態） | 系統中的既有訂單狀態 |
| 查詢結果應包含訂單明細 | 後置（回應） | API 回傳的資料 |
| 購物車應新增一筆商品項目 | 後置（狀態） | 資料庫中的狀態變化 |
| 商品庫存應減少對應數量 | 後置（狀態） | 資料庫中的狀態變化 |

---

# Rule 命名與原子化

## 嚴格命名句型

每條 Rule 的名稱**必須**遵循以下句型：

```
Rule: <四類前綴> - <主詞> 必須/應 <單一條件>
```

| 組件 | 說明 | 範例 |
|------|------|------|
| **四類前綴** | `前置（狀態）`、`前置（參數）`、`後置（回應）`、`後置（狀態）` | `前置（參數）` |
| **主詞** | 一個明確的實體屬性或系統狀態 | 「商品庫存」「加入數量」「訂單總額」 |
| **動詞** | 前置用「必須」（約束），後置用「應」（預期結果） | 「必須」「應」 |
| **單一條件** | 一個可驗證的具體斷言 | 「大於 0」「等於單價乘以數量」 |

### 正確範例

```gherkin
Rule: 前置（狀態）- 商品庫存必須大於 0
Rule: 前置（參數）- 加入數量必須大於 0
Rule: 前置（參數）- 必要參數必須提供
Rule: 後置（狀態）- 購物車應新增一筆商品項目
Rule: 後置（狀態）- 商品庫存應減少對應數量
Rule: 後置（回應）- 查詢結果應包含訂單明細與品項
```

### 錯誤範例

```gherkin
# ❌ 缺少四類前綴
Rule: 前置 - 商品庫存必須大於 0

# ❌ 違反原子化（兩個條件）
Rule: 前置（狀態）- 商品庫存必須大於 0 且商品狀態必須為上架中

# ❌ 混合前置與後置
Rule: 前置（參數）- 數量必須大於 0 且購物車應更新
```

## 原子化判定

句型本身即為原子化的檢驗標準：
- 陳述句中出現「且」「和」「並且」→ 包含多個條件，**拆分**為多條 Rule
- 陳述句中出現「或」→ 多選一條件難以分離，**保留**在同一條 Rule
- 混合前置與後置 → **必須拆分**
- 混合不同四類前綴 → **必須拆分**

## 必要參數規則（必備 + 允許合併）

每個 Feature **至少**必須有一條「前置（參數）」Rule 驗證必要參數，否則就要特別詢問用戶來澄清。此為不可跳過的最低要求。

所有「缺少必要參數」的檢查「可以考慮」合併為單一 Rule，使用 Scenario Outline 涵蓋各缺少情境：

```gherkin
  #------------------------------------------------------------
  Rule: 前置（參數）- 必要參數必須提供
  #------------------------------------------------------------

    Scenario Outline: 缺少 <缺少參數> 時操作失敗
      Given 準備一個用戶, with table:
        | userId | name  |
        | 1      | Alice |
      And 準備一個商品, with table:
        | productId | name | price | stock |
        | 1         | 蘋果 | 50    | 10    |
      When 將商品加入購物車, call table:
        | userId | productId | quantity |
        | 1      | <商品ID>  | <數量>   |
      Then 操作失敗

      Examples:
        | 缺少參數 | 商品ID | 數量 |
        | 商品 ID  |        | 1    |
        | 數量     | 1      |      |
```

此為原子化的常見例外：多個缺少參數的情境共享同一驗證模式（必要參數缺少 → 失敗），合併可減少冗餘。

其他具有**領域特定約束**的參數規則（如「數量必須大於 0」「數量不可超過庫存」）仍各自獨立為原子 Rule。

---

# 規格表達格式

## SQL Schema 格式（資料模型）

用於描述實體關係模型 (ERM)，產出至：
- `spec/data/schema.sql` - SQL DDL 定義
- `spec/data/entity_to_table_mapping.yml` - Entity 與表映射

基本結構：
- **Table**：代表實體
- **Column**：包含名稱、資料型別 (int, long, float, bool, string)
- **COMMENT**：對實體、屬性的定義說明
- **CHECK**：屬性值約束
- **Foreign Key**：實體間的關聯

## Gherkin Language 格式（功能模型 - sdd.os ISA Server Actions 版）

用於描述功能規格，採用三層式結構：Feature > Rule > Example。每個功能獨立一份文件於 `spec/features/<中文功能簡稱>.feature`。

### Feature（功能）
- 定義：對應一個 Server Action
- **必須在檔案開頭註解 Action 資訊**：
  ```gherkin
  # Action: actionFunctionName
  # Summary: 功能名稱
  Feature: 功能名稱
  ```

### Rule（規則）
- 每個功能涵蓋 1..* 條規則
- **必須標註四類之一**：
  ```gherkin
  #------------------------------------------------------------
  Rule: 前置（狀態）- 規則描述
  #------------------------------------------------------------
  ```
  ```gherkin
  #------------------------------------------------------------
  Rule: 前置（參數）- 規則描述
  #------------------------------------------------------------
  ```
  ```gherkin
  #------------------------------------------------------------
  Rule: 後置（回應）- 規則描述
  #------------------------------------------------------------
  ```
  ```gherkin
  #------------------------------------------------------------
  Rule: 後置（狀態）- 規則描述
  #------------------------------------------------------------
  ```

### Example（例子）- sdd.os ISA 格式
- 使用 Gherkin 語法 (Given-When-Then) 描述 API 操作
- **必須使用 sdd.os ISA 語法格式**

---

# Given 設定方式指引（Practice Choices）

Given 有兩種方式建立前置狀態，Command 與 Query 類型的 Feature 皆適用。

## 選擇 A：直接設定 Aggregate State

使用 `準備一個{entity}, with table:` 語法直接設定資料：

```gherkin
Given 準備一個訂單, with table:
  | id        | status | totalAmount |
  | ORDER-123 | 已付款  | 1500        |
```

**適用時機**：Aggregate 的不變條件（Invariant）簡單、手動設值不易出錯。

## 選擇 B：透過 Commands 設定

使用 `{summary}, call table:` 語法透過 Server Action 建立資料：

```gherkin
Given 建立訂單, call table:
  | customerId | items                              |
  | C001       | [{"productId":"P001","quantity":1}] |
And 完成付款, call table:
  | orderId   | amount |
  | ORDER-123 | 1500   |
```

**適用時機**：Aggregate 有複雜的 Invariant（如「總金額 = Σ品項金額 + 運費 - 折扣」），手動設值容易違反約束。透過 Commands 讓系統自動計算與守護 Invariant。

## 選擇判定表

| 條件 | 建議 |
|------|------|
| Invariant 簡單（如 `0 ≤ progress ≤ 100`） | 選擇 A |
| Invariant 複雜（跨屬性計算、狀態流轉） | 選擇 B |
| 建立路徑需要 5 個以上 Commands | 選擇 A（避免過長的 Given） |
| 測試重點包含前置條件的正確性 | 選擇 B |

**推薦混合使用**：簡單的 Aggregate 用選擇 A，複雜的用選擇 B。

```gherkin
Given 準備一個商品, with table:                              # 選擇 A（簡單）
  | id       | name    | price | stock |
  | PROD-001 | MacBook | 45000 | 10    |
And 建立訂單, call table:                                    # 選擇 B（複雜）
  | customerId | items                                  |
  | C001       | [{"productId":"PROD-001","quantity":1}] |
```

---

# sdd.os ISA Gherkin 語法規範（Server Actions 版）

## Given 步驟（資料準備）

### 格式規範

```gherkin
# 格式：準備一個{Entity 中文名稱}, with table:
Given 準備一個商品, with table:
  | id   | name     | price | stock |
  | P001 | 宮保雞丁  | 120   | 50    |
```

## When 步驟（Action 呼叫）

### 格式規範

**Server Action 呼叫必須使用以下格式**：

```gherkin
# 格式：{Action Summary}, call table:
When {功能名稱}, call table:
  | param1 | param2 | param3 |
  | value1 | value2 | value3 |
```

**注意**：
- `{功能名稱}` 必須與 Feature 名稱一致（也對應 actions.yml 的 summary）
- DataTable 的欄位名稱對應 Server Action 的輸入參數
- Given 用於設定前置資料，When 用於執行測試操作

### 範例

```gherkin
# 建立訂單 → 對應 Server Action: createOrder
When 建立訂單, call table:
  | customerId | items                                                        |
  | C001       | [{"productId":"P001","quantity":2},{"productId":"P002","quantity":1}] |

# 查詢訂單 → 對應 Server Action: getOrder
When 查詢訂單, call table:
  | orderId |
  | O001    |
```

---

## Then 步驟（回應驗證）

### 格式規範

**成功回應驗證**：
```gherkin
# 格式：{Action Summary}成功, with table:
Then {功能名稱}成功, with table:
  | field1 | field2 | field3 |
  | value1 | value2 | value3 |
```

**操作失敗（錯誤情境）**：
```gherkin
Then 操作失敗
```

### 範例

```gherkin
# 成功建立
Then 建立訂單成功, with table:
  | orderId | totalAmount | status  |
  | O001    | 340         | pending |

# 操作失敗
Then 操作失敗
```

---

## Entity 驗證（資料庫狀態）

### 格式規範

```gherkin
# 格式：存在一個{Entity 中文名稱}, with table:
And 存在一個訂單, with table:
  | id   | customerId | totalAmount | status  |
  | O001 | C001       | 340         | pending |
```

**注意**：
- Entity 名稱必須與 `entity_to_table_mapping.yml` 中的定義一致
- 欄位名稱對應資料庫 schema（`spec/data/schema.sql`）中的欄位

---

## 完整 sdd.os ISA Feature 範例（Server Actions 版，四類規則）

```gherkin
# Action: createOrder
# Summary: 建立訂單
Feature: 建立訂單

  Background:
    Given 準備一個商品, with table:
      | id   | name     | price | stock |
      | P001 | 宮保雞丁  | 120   | 50    |
      | P002 | 麻婆豆腐  | 100   | 30    |
    And 準備一個顧客, with table:
      | id   | name | memberLevel |
      | C001 | 小明 | gold        |

  # ========== 前置條件 ==========

  #------------------------------------------------------------
  Rule: 前置（狀態）- 建立訂單前商品庫存必須充足
  #------------------------------------------------------------

    Example: 庫存充足時成功建立訂單
      When 建立訂單, call table:
        | customerId | items                              |
        | C001       | [{"productId":"P001","quantity":2}] |
      Then 建立訂單成功, with table:
        | orderId | totalAmount |
        | O002    | 240         |
      And 存在一個商品, with table:
        | id   | stock |
        | P001 | 48    |

    Example: 庫存不足時拒絕建立訂單
      Given 準備一個商品, with table:
        | id   | name   | price | stock |
        | P003 | 紅燒肉  | 150   | 3     |
      When 建立訂單, call table:
        | customerId | items                              |
        | C001       | [{"productId":"P003","quantity":10}] |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 前置（參數）- 訂單必須包含至少一個品項
  #------------------------------------------------------------

    Example: 空訂單被拒絕
      When 建立訂單, call table:
        | customerId | items |
        | C001       | []    |
      Then 操作失敗

  # ========== 後置條件 ==========

  #------------------------------------------------------------
  Rule: 後置（狀態）- 訂單總額應為所有品項小計加總
  #------------------------------------------------------------

    Example: 成功建立包含多品項的訂單
      When 建立訂單, call table:
        | customerId | items                                                        |
        | C001       | [{"productId":"P001","quantity":2},{"productId":"P002","quantity":1}] |
      Then 建立訂單成功, with table:
        | orderId | totalAmount | status  |
        | O001    | 340         | pending |
      And 存在一個訂單, with table:
        | id   | customerId | totalAmount | status  |
        | O001 | C001       | 340         | pending |

  #------------------------------------------------------------
  Rule: 後置（狀態）- 建立訂單後商品庫存應減少對應數量
  #------------------------------------------------------------

    Example: 庫存正確扣減
      When 建立訂單, call table:
        | customerId | items                              |
        | C001       | [{"productId":"P001","quantity":3}] |
      Then 建立訂單成功, with table:
        | orderId | totalAmount |
        | O003    | 360         |
      And 存在一個商品, with table:
        | id   | stock |
        | P001 | 47    |
```

**更多完整範例**：見 [`resources/examples/example-feature.feature`](../resources/examples/example-feature.feature)

---

# 資料模型萃取規則

## A. 識別「實體 (Entity)」
每個實體都是系統中需要持久化的資料物件。

- 只萃取規格中明確提到的實體
- 實體名稱使用規格中的術語
- 為每個實體定義中英文名稱（用於 `entity_to_table_mapping.yml`）
- **（ES 交叉檢查）** 若 `${ES_SPEC_PATH}` 存在，每個 Aggregate 直接對應一個 Entity

## B. 萃取實體的「屬性 (Attribute)」
- 每個屬性必須指定資料型別：**int, long, float, bool, string**
- 每個屬性必須有 **COMMENT** 說明
- 限制條件以 CHECK constraint 表達

## C. 標註「跨屬性不變條件」
- 在實體的 COMMENT 中條列跨屬性不變條件
- 例如：總額 = 單價 × 數量

## D. 識別實體之間的「關係 (Relationship)」
- 使用 Foreign Key 描述關聯
- 明確標示關聯類型（一對一、一對多、多對多）

---

# 功能模型萃取規則（sdd.os ISA，四類規則）

## A. 萃取「功能 (Feature)」
每個 Feature 對應一個 Server Action。

- Feature 名稱反映業務意圖（如「建立訂單」）
- **必須在檔案開頭標註 Action 資訊**
- Feature 名稱必須與 actions.yml 的 `summary` 一致

## B. 萃取功能的「規則 (Rule)」

### 規則分類（四類）
- **前置（狀態）**：執行前系統狀態約束，驗證失敗回傳 4xx 錯誤（403）
- **前置（參數）**：輸入參數約束，驗證失敗回傳 4xx 錯誤（400）
- **後置（回應）**：API 執行成功後的回傳內容（主要用於 Query）
- **後置（狀態）**：API 執行成功後的資料庫狀態變化（主要用於 Command）

### Rule 格式要求
```gherkin
#------------------------------------------------------------
Rule: 前置（狀態）/ 前置（參數）/ 後置（回應）/ 後置（狀態）- 規則描述
#------------------------------------------------------------
```

### Feature 內的 Rule 建議排列順序

```
# ========== 前置條件 ==========
Rule: 前置（狀態）- ...
Rule: 前置（參數）- ...

# ========== 後置條件 ==========
Rule: 後置（回應）- ...（Query 類型）
Rule: 後置（狀態）- ...（Command 類型）
```

## C. 萃取規則的「例子 (Example)」- sdd.os ISA 格式（Server Actions 版）

### 必要元素
1. **Given**：資料準備（使用 `準備一個{entity}, with table:`）
2. **When**：Action 呼叫（使用 `{summary}, call table:`）
3. **Then**：回應驗證（使用 `{summary}成功, with table:` 或 `操作失敗`）
4. **And**（可選）：Entity 驗證（使用 `存在一個{entity}, with table:`）

### 資料驅動原則

每個 Step 必須指定具體、可驗證的資料，禁止模糊描述。

**錯誤示範：**
```gherkin
Given 系統中有一個用戶
When 用戶更新課程進度
Then 進度已更新
```

**正確示範：**
```gherkin
Given 準備一個用戶, with table:
  | id | name  | email          | level | exp |
  | 1  | Alice | alice@test.com | 1     | 0   |
When 更新課程進度, call table:
  | userId | lessonId | progress |
  | 1      | 1        | 80       |
Then 更新課程進度成功, with table:
  | lessonId | progress | status |
  | 1        | 80       | 進行中 |
```

---

# 輸出格式規範

## 資料模型輸出

### 1. SQL Schema（`spec/data/schema.sql`）
```sql
CREATE TABLE orders (
    id VARCHAR(10) PRIMARY KEY COMMENT '訂單唯一識別碼',
    customer_id VARCHAR(10) NOT NULL COMMENT '顧客 ID',
    total_amount DECIMAL(10,2) NOT NULL COMMENT '訂單總額，必須 >= 0',
    status VARCHAR(20) NOT NULL COMMENT '訂單狀態'
) COMMENT '訂單實體';

CREATE TABLE order_items (
    id BIGINT PRIMARY KEY COMMENT '訂單品項 ID',
    order_id VARCHAR(10) NOT NULL COMMENT '所屬訂單 ID',
    product_id VARCHAR(10) NOT NULL COMMENT '商品 ID',
    quantity INT NOT NULL COMMENT '數量，必須 > 0',
    subtotal DECIMAL(10,2) NOT NULL COMMENT '小計'
) COMMENT '訂單品項實體';
```

### 2. Entity 映射（`spec/data/entity_to_table_mapping.yml`）
```yaml
entity_to_table_mapping:
  - 訂單: orders
  - 訂單品項: order_items
  - 商品: products
  - 顧客: customers
```

## Gherkin 輸出（`spec/features/*.feature`）

**格式要求**：
- 檔案開頭必須有 Action 註解（`# Action:` 和 `# Summary:`）
- Rule 必須標註四類之一（前置（狀態）/ 前置（參數）/ 後置（回應）/ 後置（狀態））
- Rule 命名遵循嚴格句型：`<四類前綴> - <主詞> 必須/應 <單一條件>`
- When 使用 `{summary}, call table:` 格式
- Then 使用 `{summary}成功, with table:` 或 `操作失敗`
- Entity 驗證使用 `存在一個{entity}, with table:`

---

# sdd.os ISA Gherkin 檢查清單（Server Actions 版，四類規則）

在產出 Feature File 前，確認符合以下標準：

- [ ] 檔案開頭有 `# Action: functionName` 和 `# Summary:` 註解
- [ ] 每個 Rule 都標註四類之一（`前置（狀態）`/`前置（參數）`/`後置（回應）`/`後置（狀態）`）
- [ ] 每個 Rule 命名遵循句型：`<四類前綴> - <主詞> 必須/應 <單一條件>`
- [ ] 每個 Rule 只驗證一件事（原子化）
- [ ] 至少有一條 `前置（參數）` Rule（必要參數檢查）
- [ ] 每個 When 步驟使用 `{summary}, call table:` 格式
- [ ] 成功情境使用 `{summary}成功, with table:` 格式
- [ ] 失敗情境使用 `操作失敗`
- [ ] Entity 驗證使用 `存在一個{entity}, with table:` 格式
- [ ] Entity 名稱與 `entity_to_table_mapping.yml` 一致
- [ ] DataTable 欄位名稱與 Supabase schema 定義一致
- [ ] Given 設定方式選擇合理（簡單用 A、複雜用 B）
