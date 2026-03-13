# Behave Steps 基礎建設說明

本目錄包含 BDD 測試的基礎建設，使用 Behave 框架和自動代碼生成工具。

## 核心文件

### environment.py

Behave 環境設定，提供 **Context Contract**（上下文契約）。

**Context 屬性**：

| 屬性 | 類型 | 說明 | 用途 |
|------|------|------|------|
| `context.client` | FastAPI TestClient | FastAPI 測試客戶端 | API 呼叫測試（使用 ASGI in-process 呼叫，無需啟動伺服器） |
| `context.db_session` | SQLAlchemy Session | SQLAlchemy 資料庫工作階段 | 資料庫驗證（in-memory SQLite，每個場景獨立隔離） |
| `context.last_response` | HTTP Response | 最後一次 API 回應 | 儲存最後一次 API 回應，供 Then 步驟驗證 |
| `context.table` | DataTable | Gherkin 表格資料 | 自動提供 Gherkin 表格資料（Behave 內建） |

**生命週期管理**：

- `before_scenario()` - 每個場景前初始化 client、db_session、last_response
- `after_scenario()` - 每個場景後清理資料庫，確保測試隔離

**資料庫隔離機制**：

- 每個 scenario 使用獨立的 SQLite in-memory 資料庫
- 使用 `StaticPool` 確保 FastAPI TestClient 的線程安全
- 場景結束後自動清理資源

### common_then.py

通用驗證步驟（手寫），提供可重用的 Then 步驟定義。

**步驟列表**：

1. `@then('操作失敗')` - 驗證 HTTP 錯誤（status >= 400）
2. `@then('回應, with table:')` - 使用 JSONPath 驗證響應欄位

**JSONPath 支援**：

`回應, with table:` 步驟支援使用 JSONPath 查詢嵌套結構：

```gherkin
Then 回應, with table:
  | gameId | playerRole | result.a |
  | G001   | P1         | 2        |
```

**自動型別轉換**：

支援的型別包括：
- 整數（`"123"` → `123`）
- 浮點數（`"3.14"` → `3.14`）
- 布林值（`"true"` / `"false"` → `True` / `False`）
- 特殊值（`"$notnull"` → 驗證非 NULL）

---

## 步驟定義檔案結構

### API 步驟（自動生成）

**位置**：`api/API_*.py`

**命名規則**：`API_<操作名稱>.py`（例如：`API_玩家加入遊戲.py`）

**裝飾器**：`@given` + `@when`（雙裝飾器支援 Background）

**函式名稱**：固定為 `invoke(context)`

**功能**：
1. 從 `context.table` 提取參數
2. 使用 `context.client.post/put/get` 呼叫 API
3. 將響應存入 `context.last_response`

**範例**：

```python
@given("玩家加入遊戲, call table:")
@when("玩家加入遊戲, call table:")
def invoke(context):
    rows = [dict(zip(row.headings, row.cells)) for row in context.table]
    row = rows[0]

    request_body = {}
    if "gameId" in row:
        request_body["gameId"] = row["gameId"]
    if "playerName" in row:
        request_body["playerName"] = row["playerName"]

    response = context.client.post("/games", json=request_body)
    context.last_response = response
```

### 實體驗證步驟（自動生成）

**位置**：`then/Then_存在一個<實體>_With_Table.py`

**命名規則**：`Then_存在一個<實體>_With_Table.py`（例如：`Then_存在一個遊戲_With_Table.py`）

**裝飾器**：`@then`

**函式名稱**：固定為 `validate(context)`

**功能**：
1. 使用 SQLAlchemy query 從資料庫查詢實體
2. 使用 `assert` 逐參數驗證欄位值
3. **自動 camelCase → snake_case 轉換**（`winnerId` → `winner_id`）

**範例**：

```python
@then("存在一個遊戲, with table:")
def validate(context):
    from app.main.models import Game

    rows = [dict(zip(context.table.headings, row.cells)) for row in context.table]

    for row in rows:
        entity = context.db_session.query(Game).filter_by(
            id=row["id"]
        ).first()

        assert entity is not None, f"Game with id={row['id']} should exist"

        if "status" in row:
            assert entity.status == row["status"]
        if "winnerId" in row:
            assert entity.winner_id == row["winnerId"]  # camelCase → snake_case
```

---

## 目錄結構

```
steps/
├── __init__.py              # 自動發現和導入所有子模組
├── environment.py           # Behave Context Contract
├── common_then.py           # 通用驗證步驟（手寫）
├── api/                     # API 呼叫步驟（自動生成）
│   ├── __init__.py
│   ├── API_玩家加入遊戲.py
│   ├── API_玩家設定秘密.py
│   └── API_玩家猜測數字.py
└── then/                    # 實體驗證步驟（自動生成）
    ├── __init__.py
    ├── Then_存在一個遊戲_With_Table.py
    └── Then_存在一個玩家_With_Table.py
```

---

## 自動生成的文件

以下文件由 `assembler_codegen.sh` 自動生成，**不應手動編輯**：

- `api/API_*.py` - API 呼叫步驟
- `then/Then_*_With_Table.py` - Entity 驗證步驟

這些文件已加入 `.gitignore`，每次執行 CodeGen 時會重新生成。

---

## 使用流程

### 1. 編寫 Feature 文件

放在 `src/test/features/` 目錄下：

```gherkin
Feature: 玩家加入遊戲

  Scenario: 第一位玩家創建新遊戲
    When 玩家加入遊戲, call table:
      | gameId | playerName |
      | G001   | Alice      |
    Then 回應, with table:
      | gameId | playerRole |
      | G001   | P1         |
    And 存在一個遊戲, with table:
      | id   | status             |
      | G001   | Waiting for player |
```

### 2. 執行程式碼生成

```bash
bash assembler_codegen.sh
```

或者針對單一 Feature 檔案：

```bash
bash assembler_codegen.sh --feature src/test/features/玩家加入遊戲.feature
```

### 3. 手動實作 Given 步驟（如需要）

如果需要準備測試資料，可以手動建立 Given 步驟：

```python
# steps/given/fixtures.py
from behave import given

@given("玩家加入遊戲, call table:")
def setup_game(context):
    # 準備測試資料
    pass
```

### 4. 執行測試

```bash
PYTHONPATH=src:$PYTHONPATH behave src/test/features/
```

或執行單一 Feature：

```bash
PYTHONPATH=src:$PYTHONPATH behave src/test/features/玩家加入遊戲.feature
```

---

## ISA 配置（isa_codegen.yml）

當前支援 **4 種 instructions**：

### 1. API call

```yaml
format: ^(?P<summary>.+?), call table:$
step_type: API
```

匹配步驟：`When 玩家加入遊戲, call table:`

### 2. Entity validate

```yaml
format: ^存在一個(?P<entity>[\u4e00-\u9fffa-zA-Z]+), with table:$
step_type: Then
```

匹配步驟：`Then 存在一個遊戲, with table:`

### 3. Response validation

```yaml
format: ^回應, with table:$
step_type: Then
```

匹配步驟：`Then 回應, with table:`（使用 `common_then.py`）

### 4. Operation failure

```yaml
format: ^操作失敗$
step_type: Then
```

匹配步驟：`Then 操作失敗`（使用 `common_then.py`）

---

## ISA Linters

階段 1 已啟用 linters 進行規格驗證：

### API Call Linter

驗證 API 請求參數是否符合 `spec/api/api.yml` 中定義的 OpenAPI 規格。

### Entity Validate Linter

驗證實體欄位是否符合 `spec/data/schema.sql` 中定義的資料庫 schema。

包含兩個 linters：
- **entity_mapping_linter** - 驗證實體名稱映射
- **db_columns_linter** - 驗證欄位名稱和型別

### Response Validation Linter

驗證 API 回應欄位是否符合 `spec/api/api.yml` 中定義的 response schema。

---

## 技術細節

### camelCase ↔ snake_case 轉換

**Feature 檔案中**使用 camelCase：

```gherkin
Then 存在一個遊戲, with table:
  | id   | winnerId |
  | G001 | P1       |
```

**資料庫欄位**使用 snake_case：

```sql
CREATE TABLE games (
    id VARCHAR(5) PRIMARY KEY,
    winner_id VARCHAR(2)
);
```

**自動轉換**在生成的步驟定義中處理：

```python
if "winnerId" in row:
    assert entity.winner_id == row["winnerId"]  # camelCase → snake_case
```

### 嵌套欄位支援

API 步驟支援嵌套路徑（dot notation）和陣列索引：

```gherkin
When 玩家猜測數字, call table:
  | gameId | result.a | items[0].name |
  | G001   | 2        | Book          |
```

自動轉換為：

```python
request_body = {
    "gameId": "G001",
    "result": {"a": 2},
    "items": [{"name": "Book"}]
}
```

---

## 相關資源

- [README.md](../../../README.md) - 專案總覽
- [CODEGEN_GUIDE.md](../../../CODEGEN_GUIDE.md) - CodeGen 詳細使用指南
- [DIFFERENCE_ANALYSIS.md](../../../DIFFERENCE_ANALYSIS.md) - Python 與 Java 版本差異分析
- [MIGRATION_ROADMAP.md](../../../MIGRATION_ROADMAP.md) - 改進路線圖

---

## 常見問題

### Q: 為什麼我的步驟沒有被生成？

A: 檢查以下事項：
1. Feature 檔案中的步驟格式是否符合 `isa_codegen.yml` 中定義的 format
2. 執行 `bash assembler_codegen.sh --log-level INFO` 查看詳細日誌
3. 確認 `isa_codegen.yml` 中包含對應的 instruction

### Q: 如何新增自訂步驟？

A: 有兩種方式：
1. **手寫步驟**：在 `steps/` 下建立新檔案，使用 `@given/@when/@then` 裝飾器
2. **擴充 ISA**：在 `isa_codegen.yml` 中新增 instruction，並提供對應的 executor

### Q: 測試失敗時如何除錯？

A: 使用以下方法：
1. 檢查 `context.last_response` 的內容
2. 使用 `behave -v` 查看詳細輸出
3. 在步驟定義中加入 `print()` 或 `import pdb; pdb.set_trace()`
4. 檢查 `environment.py` 中的資料庫連接和初始化

---

**文件版本**：v1.0
**最後更新**：2025-12-13
**維護者**：SDD.OS Team
