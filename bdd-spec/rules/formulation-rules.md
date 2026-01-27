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

# 規格表達格式

## DBML 格式（資料模型）→ 轉換為 SQL Schema

用於描述實體關係模型 (ERM)，最終需轉換為：
- `spec/data/schema.sql` - SQL DDL 定義
- `spec/data/entity_to_table_mapping.yml` - Entity 與表映射

基本結構：
- **Table**：代表實體
- **Column**：包含名稱、資料型別 (int, long, float, bool, string)
- **Note**：對實體、屬性的定義說明
- **Relationship**：實體間的關聯

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
- **必須標註前置/後置條件**：
  ```gherkin
  #------------------------------------------------------------
  Rule: 前置 - 規則描述
  #------------------------------------------------------------
  ```
  或
  ```gherkin
  #------------------------------------------------------------
  Rule: 後置 - 規則描述
  #------------------------------------------------------------
  ```

### Example（例子）- sdd.os ISA 格式
- 使用 Gherkin 語法 (Given-When-Then) 描述 API 操作
- **必須使用 sdd.os ISA 語法格式**

---

# sdd.os ISA Gherkin 語法規範（Server Actions 版）

## Given/When 步驟（Action 呼叫）

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

# 更新訂單狀態 → 對應 Server Action: updateOrderStatus
When 更新訂單狀態, call table:
  | orderId | status    |
  | O001    | confirmed |

# 刪除訂單 → 對應 Server Action: deleteOrder
When 刪除訂單, call table:
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

# 成功查詢
Then 查詢訂單成功, with table:
  | orderId | customerId | totalAmount | status  |
  | O001    | C001       | 340         | pending |

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

### 範例

```gherkin
# 驗證訂單
And 存在一個訂單, with table:
  | id   | customerId | totalAmount | status  |
  | O001 | C001       | 340         | pending |

# 驗證訂單品項
And 存在一個訂單品項, with table:
  | orderId | productId | quantity | subtotal |
  | O001    | P001      | 2        | 240      |

# 驗證商品庫存更新
And 存在一個商品, with table:
  | id   | name     | stock |
  | P001 | 宮保雞丁  | 48    |
```

---

## 完整 sdd.os ISA Feature 範例（Server Actions 版）

### 範例 1：建立訂單

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

  #------------------------------------------------------------
  Rule: 後置 - 訂單總額為所有品項小計加總
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
  Rule: 前置 - 建立訂單前必須檢查庫存
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
        | id   | name     | price | stock |
        | P003 | 紅燒肉   | 150   | 3     |
      When 建立訂單, call table:
        | customerId | items                              |
        | C001       | [{"productId":"P003","quantity":10}] |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 前置 - 訂單必須包含至少一個品項
  #------------------------------------------------------------

    Example: 空訂單被拒絕
      When 建立訂單, call table:
        | customerId | items |
        | C001       | []    |
      Then 操作失敗
```

**更多完整範例**：見 [`resources/examples/example-feature.feature`](../resources/examples/example-feature.feature)

---

# 資料模型萃取規則

## A. 識別「實體 (Entity)」
每個實體都是系統中需要持久化的資料物件。

- 只萃取規格中明確提到的實體
- 實體名稱使用規格中的術語
- 為每個實體定義中英文名稱（用於 `entity_to_table_mapping.yml`）

## B. 萃取實體的「屬性 (Attribute)」
- 每個屬性必須指定資料型別：**int, long, float, bool, string**
- 每個屬性必須有 **note** 說明
- 限制條件在 note 中明確標註

## C. 標註「跨屬性不變條件」
- 在實體的 Note 中條列跨屬性不變條件
- 例如：總額 = 單價 × 數量

## D. 識別實體之間的「關係 (Relationship)」
- 使用 DBML 的 ref 語法描述關聯
- 明確標示關聯類型（一對一、一對多、多對多）

---

# 功能模型萃取規則（sdd.os ISA）

## A. 萃取「功能 (Feature)」
每個 Feature 對應一個 Server Action。

- Feature 名稱反映業務意圖（如「建立訂單」）
- **必須在檔案開頭標註 Action 資訊**
- Feature 名稱必須與 actions.yml 的 `summary` 一致

## B. 萃取功能的「規則 (Rule)」

### 規則分類
- **前置條件 (Pre-condition)**：API 執行前的驗證，驗證失敗回傳 4xx 錯誤
- **後置條件 (Post-condition)**：API 執行成功後的狀態變更

### Rule 格式要求
```gherkin
#------------------------------------------------------------
Rule: 前置/後置 - 規則描述
#------------------------------------------------------------
```

## C. 萃取規則的「例子 (Example)」- sdd.os ISA 格式（Server Actions 版）

### 必要元素
1. **Given**：資料準備（使用 `準備一個{entity}, with table:`）
2. **When**：Action 呼叫（使用 `{summary}, call table:`）
3. **Then**：回應驗證（使用 `{summary}成功, with table:` 或 `操作失敗`）
4. **And**（可選）：Entity 驗證（使用 `存在一個{entity}, with table:`）

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
- Rule 必須標註前置/後置
- When 使用 `{summary}, call table:` 格式
- Then 使用 `{summary}成功, with table:` 或 `操作失敗`
- Entity 驗證使用 `存在一個{entity}, with table:`

---

# sdd.os ISA Gherkin 檢查清單（Server Actions 版）

在產出 Feature File 前，確認符合以下標準：

- [ ] 檔案開頭有 `# Action: functionName` 和 `# Summary:` 註解
- [ ] 每個 Rule 都標註 `前置` 或 `後置`
- [ ] 每個 When 步驟使用 `{summary}, call table:` 格式
- [ ] 成功情境使用 `{summary}成功, with table:` 格式
- [ ] 失敗情境使用 `操作失敗`
- [ ] Entity 驗證使用 `存在一個{entity}, with table:` 格式
- [ ] Entity 名稱與 `entity_to_table_mapping.yml` 一致
- [ ] DataTable 欄位名稱與 Supabase schema 定義一致
