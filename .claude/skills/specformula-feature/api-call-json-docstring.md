
# ApiCall JSON DocString（尚未支援）

> **注意：目前尚未支援 JSON DocString，以下為預定規格。**

符號系統的表達式（`$` 變數、`&` CAS 約束、`@` 時間符號）**不可放在 JSON 字串引號 `""` 內**：

```gherkin
# ✅ 正確
"""json
{ "userId": $userId, "id": &isNum }
"""

# ❌ 錯誤：符號被引號包裹，視為純字串
"""json
{ "userId": "$userId", "id": "&isNum" }
"""
```

## P / Q / H 前綴在 JSON DocString 中的用法

在 JSON DocString 中使用 `P`、`Q`、`H` 前綴時，將前綴寫在 key 的引號前：

```gherkin
"""json
{
  P"id": "1234",
  Q"page": 1,
  H"X-Trace-Id": "abc"
}
"""
```
