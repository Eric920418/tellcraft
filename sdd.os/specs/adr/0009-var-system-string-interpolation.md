# VAR-System 支援字串插值語法 `${variableName}`

在變數引用系統中新增字串插值語法，允許在單一字串值中嵌入多個變數引用。

# Context

- 本 ADR 針對 PR #148：為 VAR-System 新增字串插值功能 `${variableName}`，解決需要在單一欄位值中組合多個變數引用的場景。

## Problem

- 現有的變數引用語法 `$variableName` 假設「整個欄位值 = 一個變數」，無法處理「欄位值中包含多個變數，或變數與靜態文字混合」的情境。

## Forces

1. **API 設計慣例**：許多 REST API 為了簡化批量查詢，會在 query parameter 中接受逗號分隔的多個 ID（例如 `?ids=1,2,3`），而非使用重複參數（`?id=1&id=2&id=3`）或 JSON body。
2. **ISA 規範動態值**：在測試 Spec 中，這些 ID 通常是前置步驟執行後產生的動態值，必須透過 Scenario Context 傳遞。
3. **現有語法限制**：`$var1,$var2,$var3` 會被 resolver 視為單一變數名稱 `var1,$var2,$var3`（包含逗號），而非三個獨立變數。
4. **型別需求差異**：有些場景需要保持變數原型別（`$var` → `Integer`），有些場景需要組合成字串（`${var1},${var2}` → `"1,2"`）。

# Solution

## 解法摘要

- 新增字串插值語法 `${variableName}`，允許在字串中嵌入多個變數引用，所有插值結果統一為字串型別。

## 解法設計

### 語法規則

| 語法 | 用途 | 回傳型別 | 範例輸入 | 範例輸出 |
|------|------|---------|---------|---------|
| `$var` | 整個值為單一變數 | 保持原型別 | `$userId` | `12345` (Integer) |
| `${var}` | 字串中嵌入變數 | String | `${userId}` | `"12345"` |
| `${a},${b}` | 多變數組合 | String | `${id1},${id2}` | `"101,102"` |

### 解析優先級

1. 若字串包含 `${`，優先使用字串插值系統
2. 若字串以 `$` 開頭但不含 `${`，使用原有單一變數引用

### 容錯處理

- **找不到變數**：保留原字串（`${missingVar}` → `${missingVar}`）
- **空變數名**：保留原字串（`${}` → `${}`）
- **未閉合大括號**：保留原字串（`${name` → `${name`）
- **引號包住**：視為字串字面值（`"${name}"` → `${name}`）

### 使用範例

```gherkin
# 場景：批量查詢多個用戶
Given 存在一個用戶 "UserA"
And 存在一個用戶 "UserB"
And 存在一個用戶 "UserC"

# ✅ 使用 ${var} 組合多個 ID
When 批量取得使用者資訊, call table:
  | Q:ids                                               |
  | ${Users.UserA.id},${Users.UserB.id},${Users.UserC.id} |
# → 解析為 "101,102,103"

# ✅ 混合靜態文字與變數
When 發送通知, call table:
  | message                        |
  | Hello ${name}, your ID is ${id} |
# → 解析為 "Hello 王大明, your ID is 12345"
```

# Resulting Context

## Pros

- 可以處理 API 設計中常見的「逗號分隔多值」query parameter 格式
- 語法直覺，與主流程式語言（JavaScript、Shell、Kotlin）的字串插值慣例一致
- 與現有 `$var` 語法並存，不破壞既有 spec

## Cons

- 使用 `${var}` 時型別一律轉為 String，若 API 參數需要 Integer 陣列則不適用（但 query parameter 本身就是字串，此場景不影響）
- 增加 Spec 撰寫者需理解的語法規則（何時用 `$var`、何時用 `${var}`）

# 其他可能解法

## 方案 A：新增陣列展開語法（如 `$@varArray`）

**描述**：定義一個特殊變數類型 `Array`，搭配展開語法 `$@ids` 自動用逗號連接。

**Pros**：
- 語意更明確（「這是一個要展開的陣列」）

**Cons**：
- 需要額外的陣列建立機制
- 學習曲線較高
- 與常見程式語言慣例差異大

## 方案 B：支援 repeated query parameter（`?id=1&id=2`）

**描述**：修改 codegen 讓同一參數可以出現多次。

**Pros**：
- 符合 HTTP 規範的陣列表示方式

**Cons**：
- 需要 API 設計端配合修改（無法解決現有 API 已採用逗號分隔的情況）
- 不解決「組合任意字串」的通用需求
