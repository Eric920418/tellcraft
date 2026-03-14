# Actions Design：從 Feature Files 產出 Server Actions 規格

---
description: 分析 sdd.os ISA Feature Files 中的功能與規則，設計對應的 Next.js Server Actions，並以 YAML 格式輸出，確保 Action 與 Feature 有明確的可追溯關聯。
---

## 目標

從 `spec/features/` 資料夾中的 sdd.os ISA Feature Files 分析系統交互點，設計對應的 Server Actions 函數，並以 YAML 格式輸出至 `spec/actions/actions.yml`。

**核心目標：建立 Server Action 與 Feature File 之間的明確關聯，確保每個 Action 都可追溯到對應的業務規則。**

**注意**：本流程的輸入為 **sdd.os ISA Gherkin (SpecFormula 標準)** 格式的 Feature Files，詳見 [`formulation-rules.md`](../rules/formulation-rules.md)。

---

## 技術堆疊

本 prompt 專為 **Next.js API Routes + Neon PostgreSQL** 設計：
- Next.js 14+ App Router
- API Routes（HTTP endpoints）
- Neon serverless PostgreSQL（資料庫操作）
- TypeScript

---

## 執行步驟

### 階段 1：分析 Feature Files（sdd.os ISA 格式）

#### 1.1 載入所有 Feature Files

讀取 `spec/features/` 目錄下的所有 `.feature` 檔案，識別：
- 檔案開頭的 Action 註解（`# Action: functionName` 和 `# Summary:`）
- 每個 Feature 的名稱（對應 Action summary）
- 每個 Feature 涵蓋的所有 Rules（標註四類之一：前置（狀態）/前置（參數）/後置（回應）/後置（狀態））
- 每個 Rule 的 Examples（sdd.os ISA 格式的 Given-When-Then）

#### 1.2 從 Feature 註解識別 Action

sdd.os ISA SpecFormula 標準的 Feature File 已在開頭標註 Action 資訊：

```gherkin
# Action: createOrder
# [POST] /api/orders
# Summary: 建立訂單
Feature: 建立訂單
```

從這些註解直接提取：
- **Action Name**：`createOrder`（函數名稱，camelCase）
- **HTTP Endpoint**：`POST /api/orders`（HTTP method + path）
- **Summary**：Feature 名稱（如「建立訂單」）

**備註**：若 Feature File 缺少這些註解，依照以下對應推斷：

| Feature 名稱類型 | Action 命名模式 | 說明 |
|-----------------|----------------|------|
| 查詢/取得 X | getX / listX | 讀取操作 |
| 建立/新增 X | createX | 建立新資源 |
| 更新/修改 X | updateX | 更新現有資源 |
| 刪除/移除 X | deleteX | 刪除資源 |
| X（動作）| doX / performX | 執行特定操作 |

#### 1.3 建立 Feature-Action 對應表

建立內部對應表，記錄：
```
Feature 名稱 → Action 函數名稱
Rule 名稱 → 對應的業務邏輯驗證
When 步驟 → 對應的 Action 操作
```

---

### 階段 2：設計 Server Actions

#### 2.1 Action 識別

從 `spec/data/schema.sql` 和 `spec/data/entity_to_table_mapping.yml` 識別核心資源（實體），作為 Action 設計的基礎：
- 每個主要實體可能有多個相關 Action
- Action 名稱使用 camelCase
- 動詞 + 名詞組合（如 `createOrder`, `getOrderById`）

#### 2.2 Action 設計原則

**命名規範**：
- 使用 camelCase（如 `createOrder`, `updateOrderStatus`）
- 動詞開頭（create, get, update, delete, list）
- 名稱應反映功能意圖

**參數設計**：
- 使用 TypeScript 介面定義輸入參數
- 參數名使用 camelCase

**回傳值設計**：
- 成功時回傳結果物件
- 失敗時拋出錯誤或回傳錯誤物件

#### 2.3 Next.js Server Actions 檔案結構

| Action 類型 | 檔案路徑 |
|------------|----------|
| 訂單相關 | `app/actions/orders.ts` |
| 商品相關 | `app/actions/products.ts` |
| 顧客相關 | `app/actions/customers.ts` |

---

### 階段 3：撰寫 actions.yml 規格

#### 3.1 基本結構

```yaml
# spec/actions/actions.yml
# Server Actions 規格定義

project:
  name: [專案名稱]
  description: 基於 BDD Feature Files 設計的 Server Actions
  version: 1.0.0
  framework: next.js
  database: postgresql

actions:
  - name: [actionFunctionName]
    summary: [Feature 名稱]
    ...
```

#### 3.2 Feature-Action 關聯規範（核心）

```yaml
actions:
  - name: createOrder
    summary: 建立訂單   # 必須與 Feature 名稱一致
    method: POST
    path: /api/orders
    description: |
      建立一筆新的訂單記錄。

      ## 關聯的業務規則
      此 Action 實作了以下 Feature Rules：
      - 訂單總額計算（後置條件）
      - 庫存檢查（前置條件）

    # === Feature 關聯（核心） ===
    featureFile: spec/features/建立訂單.feature
    rules:
      - rule: 後置（狀態）- 訂單總額應為所有品項小計加總
        type: 後置（狀態）
        step: "Then 建立訂單(201)回應, with table:"
      - rule: 前置（狀態）- 建立訂單前商品庫存必須充足
        type: 前置（狀態）
        step: "Then 操作失敗"

    # === 參數與回傳值 ===
    input:
      type: CreateOrderInput
      properties:
        customerId:
          type: string
          required: true
        items:
          type: array
          items:
            type: OrderItemInput
          minItems: 1

    output:
      success:
        type: Order
      error:
        type: ActionError
```

#### 3.3 rules 欄位格式規範（sdd.os ISA - SpecFormula 標準，四類規則）

每個 `rules` 項目必須包含：

| 欄位 | 說明 | 範例 |
|------|------|------|
| `rule` | Rule 的中文描述（與 Feature File 中的 Rule 名稱一致，含四類前綴標註） | `後置（狀態）- 訂單總額應為所有品項小計加總` |
| `type` | 規則類型（四類之一） | `前置（狀態）` / `前置（參數）` / `後置（回應）` / `後置（狀態）` |
| `step` | 對應的 sdd.os ISA step statement | `Then 建立訂單(201)回應, with table:` |

**step statement 格式要求（sdd.os ISA SpecFormula 標準）**：
- When 步驟使用 `(No Actor|UID="$var") {summary}, call table:` 格式
- 成功 Then 使用 `{summary}(STATUS)回應, with table:` 格式
- 失敗 Then 使用 `操作失敗`
- Entity 驗證使用 `應該存在一個{entity}, with table:` 格式
- DataTable 使用 VAR 系統（`>/$/<`）取代硬編碼 UUID
- DataTable 欄位名稱與 `spec/data/schema.sql` 中的欄位一致

#### 3.4 完整 Action 範例（sdd.os ISA SpecFormula 標準）

```yaml
actions:
  - name: createOrder
    summary: 建立訂單   # 與 Feature 名稱一致
    method: POST
    path: /api/orders
    description: |
      建立一筆新的訂單，包含顧客資訊與訂購品項。
      系統會自動計算訂單總額並檢查庫存。

    featureFile: spec/features/建立訂單.feature
    rules:
      - rule: 後置（狀態）- 訂單總額應為所有品項小計加總
        type: 後置（狀態）
        step: "Then 建立訂單(201)回應, with table:"
      - rule: 前置（狀態）- 建立訂單前商品庫存必須充足
        type: 前置（狀態）
        step: "Then 操作失敗"
      - rule: 前置（參數）- 訂單必須包含至少一個品項
        type: 前置（參數）
        step: "Then 操作失敗"

    input:
      type: CreateOrderInput
      properties:
        customerId:
          type: string
          description: 顧客 ID
          required: true
        items:
          type: array
          description: 訂購品項列表
          items:
            type: object
            properties:
              productId:
                type: string
              quantity:
                type: integer
                minimum: 1
          minItems: 1
          required: true

    output:
      success:
        type: Order
        properties:
          orderId:
            type: string
          totalAmount:
            type: number
          status:
            type: string
            enum: [pending, confirmed, completed, cancelled]
      error:
        type: ActionError
        properties:
          message:
            type: string

  - name: getOrderById
    summary: 查詢訂單   # 與 Feature 名稱一致
    method: GET
    path: /api/orders/:id
    description: 根據訂單 ID 查詢訂單詳細資訊

    featureFile: spec/features/查詢訂單.feature
    rules:
      - rule: 後置（回應）- 查詢結果應包含訂單詳情
        type: 後置（回應）
        step: "Then 查詢訂單(200)回應, with table:"
      - rule: 前置（狀態）- 訂單必須存在
        type: 前置（狀態）
        step: "Then 操作失敗"

    input:
      type: GetOrderInput
      properties:
        orderId:
          type: string
          description: 訂單唯一識別碼
          required: true

    output:
      success:
        type: Order
      error:
        type: ActionError
```

#### 3.5 Types 定義（對應 SQL Schema）

從 `spec/data/schema.sql` 產生 TypeScript 類型定義。

**⚠️ SQL 與 TypeScript 類型兼容性檢查（強制）**

在定義 Types 時，必須確保 SQL 類型與 TypeScript 類型正確對應：

| SQL 類型 | TypeScript 類型 | 注意事項 |
|----------|-----------------|----------|
| `VARCHAR(n)` / `TEXT` | `string` | - |
| `INT` / `INTEGER` / `BIGINT` | `number` | JS 無區分 int/float |
| `DECIMAL(p,s)` / `NUMERIC` | `number` | 注意精度問題，金額建議用 string |
| `BOOLEAN` | `boolean` | - |
| `TIMESTAMP` / `TIMESTAMPTZ` | `string` (ISO 8601) | 使用 `format: date-time` 標註 |
| `DATE` | `string` (YYYY-MM-DD) | 使用 `format: date` 標註 |
| `JSON` / `JSONB` | `object` 或具體類型 | 需定義結構 |
| `UUID` | `string` | 使用 `format: uuid` 標註 |
| `ENUM` | `string` with `enum` | 列出所有可能值 |

**驗證檢查點**：
- [ ] 所有 `TIMESTAMP` 欄位對應 `type: string` + `format: date-time`
- [ ] 所有 `DECIMAL` 金額欄位評估是否需用 `string` 保持精度
- [ ] 所有 `ENUM` 類型列出完整的 enum 值
- [ ] 所有 `NOT NULL` 欄位加入 `required` 陣列

**範例**：

```yaml
types:
  # 對應 SQL Schema 中的 orders 表
  Order:
    description: 訂單實體（對應 spec/data/schema.sql 中的 orders 表）
    properties:
      id:
        type: string
        description: 訂單唯一識別碼
      customerId:
        type: string
        description: 顧客 ID
      totalAmount:
        type: number
        description: 訂單總額，必須 >= 0
      status:
        type: string
        enum: [pending, confirmed, completed, cancelled]
        description: 訂單狀態
      createdAt:
        type: string
        format: date-time
        description: 建立時間
    required:
      - id
      - customerId
      - totalAmount
      - status

  # 輸入物件
  CreateOrderInput:
    properties:
      customerId:
        type: string
      items:
        type: array
        items:
          $ref: '#/types/OrderItemInput'
        minItems: 1
    required:
      - customerId
      - items

  # 錯誤回應
  ActionError:
    properties:
      message:
        type: string
        description: 錯誤訊息
    required:
      - message
```

---

### 階段 4：驗證與輸出

#### 4.1 關聯完整性檢查

確保每個 Feature 的每條 Rule 都有對應的 Action：

```
檢查清單：
[ ] 每個 Feature File 至少對應一個 Action
[ ] 每條 Rule 都出現在至少一個 Action 的 rules 中
[ ] 每個 When 步驟都有對應的 Action 操作
[ ] 所有 featureFile 路徑正確指向實際的 .feature 檔案
```

#### 4.2 YAML 規格驗證

- 確保 YAML 語法正確
- 確保所有 $ref 引用都有對應的定義
- 確保 summary 與 Feature 名稱一致

#### 4.3 輸出檔案

將完整的 Actions 規格輸出至：`spec/actions/actions.yml`

---

## 輸出格式要求

### 檔案結構

```
spec/
├── data/                           # 資料模型（已存在）
│   ├── schema.sql                  # SQL DDL 定義
│   └── entity_to_table_mapping.yml # Entity 與表映射
├── features/                       # sdd.os ISA Feature Files（已存在）
│   ├── 建立訂單.feature
│   ├── 查詢訂單.feature
│   └── ...
└── actions/                        # Actions 規格（本階段產出）
    └── actions.yml                 # Server Actions 規格
```

### actions.yml 必要區段

1. **project**: 專案資訊（名稱、framework、database）
2. **actions**: 所有 Action 定義（含 featureFile 和 rules）
3. **types**: 資料模型定義（對應 SQL Schema）

---

## 行為規則

### 設計階段規則
1. **嚴格對應 Feature**：每個 Action 必須有明確的 Feature 對應，不設計 Feature 中未提及的 Action
2. **summary 一致**：Action 的 `summary` 必須與 Feature 名稱一致（sdd.os ISA 的核心要求）
3. **保持可追溯性**：rules 必須完整記錄所有相關的業務規則（含四類前綴標註）
4. **術語一致**：Action 名稱、參數、類型名稱與 SQL Schema/Feature 術語保持一致

### 禁止事項
1. 不要設計 Feature Files 中未提及的 Action
2. 不要在 rules 中編造不存在的 Rule
3. 不要省略 featureFile 和 rules 欄位
4. 不要讓 Action summary 與 Feature 名稱不一致

---

## 與其他 Prompt 的關係

- **前置階段**：`formulation.md` 已產出 `spec/data/schema.sql`、`spec/data/entity_to_table_mapping.yml` 和 `spec/features/*.feature`（sdd.os ISA 格式 - SpecFormula 標準）
- **本階段角色**：Actions 設計階段，從 Feature Files 產出 Server Actions 規格
- **後續階段**：
  1. `isa-config.md` - 產出 sdd.os 的 ISA 配置檔案（`isa.yml`）
  2. `automation-ts.md` - 將參考 `spec/actions/actions.yml` 實作 Next.js Server Actions

**工作流程**：
```
formulation.md → actions-design.md → isa-config.md → automation-ts.md
     ↓                 ↓                  ↓               ↓
spec/data/        spec/actions/     isa.yml           可部署應用
spec/features/     actions.yml                        + 測試程式碼
(sdd.os ISA)
```

---

## 完成標準

任務完成必須滿足以下所有條件：

**規格產出：**
- [ ] `spec/actions/actions.yml` 檔案已建立
- [ ] YAML 語法正確無誤

**Feature 關聯（sdd.os ISA - SpecFormula 標準）：**
- [ ] 每個 Feature File 至少有一個對應的 Action
- [ ] 每個 Action 都有 `featureFile` 欄位
- [ ] 每個 Action 的 `summary` 與 Feature 名稱一致
- [ ] 每個 Action 都有 `rules` 欄位，列出所有相關 Rules（含四類前綴標註 + type 欄位）
- [ ] rules 中的 step 使用 sdd.os ISA 格式（SpecFormula 標準）
- [ ] rules 中的 type 欄位為四類之一（前置（狀態）/前置（參數）/後置（回應）/後置（狀態））

**Types 完整性：**
- [ ] 所有 SQL Schema 實體都有對應的 Type 定義
- [ ] Type 屬性與 SQL Schema 欄位一致
- [ ] 約束條件在 Type 中正確表達

**驗證通過：**
- [ ] 無孤立的 Feature（每個 Feature 都有對應 Action）
- [ ] 無孤立的 Action（每個 Action 都有對應 Feature）
- [ ] 所有 $ref 引用都正確
