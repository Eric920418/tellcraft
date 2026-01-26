# Formulation：從規格文本產出規格模型（sdd.os ISA 格式 - Server Actions 版）

## 目標
從原始規格文本中萃取並結構化為規格模型，包含：
1. **資料模型 (Data Model)**：產出 SQL Schema 和 Entity 映射（供 Supabase 使用）
2. **功能模型 (Functional Model)**：以 **sdd.os ISA Gherkin (Server Actions 版)** 描述功能規格

---

## sdd.os ISA 格式說明（Server Actions 版）

本流程產出的規格採用 **sdd.os ISA** 格式，針對 **Next.js Server Actions + Supabase** 技術棧設計：

| 格式 | 說明 | 範例 |
|------|------|------|
| Action 呼叫 | `{summary}, call table:` | `建立訂單, call table:` |
| 成功回應 | `{summary}成功, with table:` | `建立訂單成功, with table:` |
| 操作失敗 | `操作失敗` | 錯誤情境時使用 |
| Entity 驗證 | `存在一個{entity}, with table:` | `存在一個訂單, with table:` |
| 資料準備 | `準備一個{entity}, with table:` | `準備一個商品, with table:` |

**核心價值**：產出的 Gherkin 可直接透過 sdd.os 生成測試程式碼（呼叫 Server Actions + Supabase 驗證）。

---

## 執行步驟

### 1. 從規格中萃取資料模型 (Data Model)
依照 [`formulation-rules.md`](./formulation-rules.md) 中的「資料模型萃取規則」執行：
- A. 識別「實體 (Entity)」
- B. 萃取實體的「屬性 (Attribute)」
- C. 標註「跨屬性不變條件」
- D. 識別實體之間的「關係 (Relationship)」

### 2. 從規格中萃取功能階層：Feature > Rule > Example（sdd.os ISA）
依照 [`formulation-rules.md`](./formulation-rules.md) 中的「功能模型萃取規則」執行：
- A. 萃取「功能 (Feature)」- 對應 API Endpoint
- B. 萃取功能的「規則 (Rule)」- 標註前置/後置條件
- C. 萃取規則的「例子 (Example)」- **sdd.os ISA 格式**

### 3. 輸出規格檔案
依照 [`formulation-rules.md`](./formulation-rules.md) 中的「輸出格式規範」執行：

**資料模型輸出**：
- `spec/data/schema.sql` - SQL DDL 定義
- `spec/data/entity_to_table_mapping.yml` - Entity 與表映射

**功能模型輸出**：
- `spec/features/*.feature` - sdd.os ISA Gherkin 格式

---

## sdd.os ISA Feature File 格式範本（Server Actions 版）

```gherkin
# Action: actionFunctionName
# Summary: 功能名稱
Feature: 功能名稱

  Background:
    Given 準備一個{entity}, with table:
      | column1 | column2 |
      | value1  | value2  |

  #------------------------------------------------------------
  Rule: 前置/後置 - 規則描述
  #------------------------------------------------------------

    Example: 例子名稱
      When {功能名稱}, call table:
        | param1 | param2 |
        | value1 | value2 |
      Then {功能名稱}成功, with table:
        | field1 | field2 |
        | value1 | value2 |
      And 存在一個{entity}, with table:
        | column1 | column2 |
        | value1  | value2  |
```

### 完整範例

見 [`../resources/examples/example-feature.feature`](../resources/examples/example-feature.feature)

---

## 核心原則

**詳見 [`formulation-rules.md`](./formulation-rules.md)**，關鍵原則包括：

### 通用原則
- **無腦補或任意假設原則**：嚴格遵守原始規格文本
- **原子化規則**：每個 Rule 只驗證一件事
- **前置/後置標註**：每個 Rule 必須標註

### sdd.os ISA 特有原則（Server Actions 版）
- **Action 綁定**：Feature 必須標註對應的 Server Action 函數名稱
- **summary 一致**：Feature 名稱必須與 actions.yml summary 一致
- **格式統一**：使用 sdd.os ISA 的固定語法格式（Server Actions 版）

---

## 輸出檔案結構

```
spec/
├── data/
│   ├── schema.sql                    # SQL DDL 定義（供 Supabase 使用）
│   └── entity_to_table_mapping.yml   # Entity 與表映射
├── features/
│   ├── 建立訂單.feature              # sdd.os ISA Gherkin (Server Actions 版)
│   ├── 查詢訂單.feature
│   └── ...
└── actions/
    └── actions.yml                   # Server Actions 規格（actions-design.md 產出）
```

---

## 與其他 Prompt 的關係

- **前置階段**：`discovery.md` 和 `clarify-and-translation.md` 已完成規格釐清
- **本階段角色**：規格表達階段，產出 sdd.os ISA 格式的規格模型（Server Actions 版）
- **後續階段**：
  1. `actions-design.md` - 從 Feature Files 產出 Server Actions 規格
  2. `isa-config.md` - 產出 sdd.os 的 ISA 配置檔案（Server Actions + Supabase）
  3. `automation-ts.md` - 依據規格開發 Next.js + Supabase 應用

**工作流程**：
```
discovery.md → formulation.md → actions-design.md → isa-config.md → automation-ts.md
     ↓              ↓                  ↓                ↓               ↓
  .clarify/    spec/data/        spec/actions/    isa_codegen.yml   可部署應用
              spec/features/      actions.yml                       + 測試程式碼
              (sdd.os ISA)
```

---

## 完成檢查清單

### 資料模型
- [ ] `spec/data/schema.sql` 已產出，包含所有實體的 DDL
- [ ] `spec/data/entity_to_table_mapping.yml` 已產出
- [ ] 每個屬性都有 COMMENT 說明
- [ ] 限制條件已用 CHECK constraint 表達

### 功能模型（sdd.os ISA - Server Actions 版）
- [ ] 每個 Feature 檔案開頭有 `# Action: functionName` 註解
- [ ] 每個 Feature 檔案開頭有 `# Summary:` 註解
- [ ] 每個 Rule 都標註 `前置` 或 `後置`
- [ ] 每個 When 使用 `{summary}, call table:` 格式
- [ ] 成功 Then 使用 `{summary}成功, with table:` 格式
- [ ] 失敗 Then 使用 `操作失敗`
- [ ] Entity 驗證使用 `存在一個{entity}, with table:` 格式
- [ ] Entity 名稱與 `entity_to_table_mapping.yml` 一致
