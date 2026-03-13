# API 回應驗證步驟需明確指定 API Summary 與 Status Code

## Context

- 在 ISA-Gherkin 的測試步驟中，`Then 回應, with table:` 用於驗證 API 回應的 payload 內容。
- 現行寫法缺乏與 OpenAPI Spec 的明確關聯，導致 linter / plugin 無法自動定位對應的 API endpoint 與 response schema。

## Problem

- 現行 `Then 回應, with table:` 的寫法存在三大問題：
    1. **Operation 無法定位**：linter / plugin 不知道要驗證哪個 API
    2. **Response 分支不明確**：同一個 API summary 可能有多個 response schema（依 status code 分支），僅靠「回應」不足以定位正確 schema
    3. **API Spec 斷鏈**：feature file 的規格約束不足，容易出現「API spec 寫了但沒有被強制實作／驗證」的問題

### 現行寫法（問題範例）

```gherkin
When 特務註冊, call table:
  | name  | email           | password |
  | Alice | alice@test.com  | 123456   |

Then 回應, with table:
  | agentId | name  |
  | 1       | Alice |
```

**問題**：`Then 回應, with table:` 無法讓 linter 知道這是哪個 API 的回應，也無法得知應使用哪一個 status code 的 response schema。

## Forces

1. **可追溯性（Traceability）**：測試步驟需能唯一定位 OpenAPI spec 內的 operation 與 response variant
2. **可驗證性（Verifiability）**：linter / plugin 需能以 deterministic 方式進行 summary 存在性檢查、status code 存在性檢查、response body 與 schema 一致性驗證
3. **語意明確性（Semantic Clarity）**：讀者應能從 step text 直接看出驗證的是哪個 API 的哪種回應
4. **一致性（Consistency）**：Then 步驟應與 When 步驟的 API summary 對應機制一致

---

## Solution

### 解法摘要

- 將 `Then 回應, with table:` 改為 `Then {api_summary}({status_code})回應, with table:`
- 透過 regex named groups 擷取 `summary` 與 `status_code`，讓 linter / plugin 能精確定位 OpenAPI spec 中的 endpoint 與 response schema

### 解法設計

#### 1) 新語法格式

**Table 格式：**
```gherkin
Then 特務註冊(200)回應, with table:
  | agentId | name  |
  | 1       | Alice |
```

**JSON 格式：**
```gherkin
Then 特務註冊(200)回應為, with JSON:
"""
{
  "agentId": 1,
  "name": "Alice"
}
"""
```

#### 2) Regex Pattern

**Table 格式：**
```regex
^(?P<summary>.+?)\((?P<status_code>\d{3})\)回應,?\s*with table:$
```

**JSON 格式：**
```regex
^(?P<summary>.+?)\((?P<status_code>\d{3})\)回應為,?\s*with JSON:$
```

#### 3) Step Definition 實作

各語言的 step definition 需使用 regex 而非 Cucumber expression：

- **Cucumber expression** `{string}({int})` 需要在 feature file 中加引號
- **Regex** `^(.+)\((\d+)\)` 允許不加引號的語法

```java
// Java
@Then("^(.+)\\((\\d+)\\)回應, with table:$")
public void then_response_with_api_summary_and_status_code(String apiSummary, int expectedStatusCode, DataTable dataTable)
```

```typescript
// TypeScript
Then(/^(.+)\((\d+)\)回應, with table:$/, function (apiSummary: string, expectedStatusCode: string, dataTable) {
```

```python
# Python
@then('{api_summary}({expected_status_code:d})回應, with table:')
def response_matches_table_with_api_summary(context, api_summary: str, expected_status_code: int):
```

```csharp
// C#
[Then(@"(.+?)\((\d+)\)回應, with table:")]
public async Task ThenResponseWithApiSummaryAndStatusCode(string apiSummary, int expectedStatusCode, Table dataTable)
```

---

## Resulting Context

### Pros

- **可唯一定位**：透過 `api_summary` 與 `status_code` 能精確對應 OpenAPI spec 中的 endpoint 與 response schema
- **linter 可自動驗證**：
    - Summary 存在性檢查
    - Status code 存在性檢查
    - Response body 與 schema 的一致性驗證
- **語意明確**：讀者可直接從 step text 看出驗證的是哪個 API 的哪種回應
- **與 When 步驟對稱**：When 使用 `特務註冊, call table:`，Then 使用 `特務註冊(200)回應, with table:`

### Cons

- **Breaking Change**：需更新所有既有的 `Then 回應, with table:` 與 `Then 操作失敗` 步驟
- **學習成本**：使用者需了解新語法格式

---
