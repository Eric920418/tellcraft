Feature: VAR-System (Variable System) 單元測試
  ISAFeatureArgumentResolver 的 VAR-System 子系統負責變數的解析、儲存與引用。
  支援 >contextKey（Context Key）、<executionKey（Execution Key）、$variableName（變數引用）
  及 ${VAR} 字串插值語法。

  Background:
    Given 初始化 ScenarioContext 和 ISAFeatureArgumentResolver

  Rule: 解析 >contextKey（Context Key）

    Scenario: 應該正確解析單個 >contextKey
      When var 解析 context keys:
        | >agentId | name | email |
      Then var context key map 為:
        """
        {"0": "agentId"}
        """

    Scenario: 應該正確解析多個 >contextKey
      When var 解析 context keys:
        | >agentId | name | >token | email | >createdAt |
      Then var context key map 為:
        """
        {"0": "agentId", "2": "token", "4": "createdAt"}
        """

    Scenario: 應該處理沒有 >contextKey 的 header
      When var 解析 context keys:
        | name | email | age |
      Then var context key map 為:
        """
        {}
        """

    Scenario: 應該處理空的 header
      When var 解析空 headers 的 context keys
      Then var context key map 為:
        """
        {}
        """

    Scenario: 應該忽略 null 值的 header
      When var 解析 context keys（含 null）:
        | >agentId | null | name |
      Then var context key map 為:
        """
        {"0": "agentId"}
        """

    Scenario: 應該拒絕使用保留變數名稱 'now' 作為 context key
      When var 解析 context keys:
        | >now | name | email |
      Then 應該拋出 IllegalArgumentException
      And 錯誤訊息包含 "now" 和 "保留"

    Scenario: 應該拒絕使用保留變數名稱 'now' - 混合其他有效 context key
      When var 解析 context keys:
        | >agentId | >now | name |
      Then 應該拋出 IllegalArgumentException

  Rule: 從 Execution Variable 提取並儲存變數

    Scenario: 應該從 Map 類型的 execution variable 提取單個值
      Given var execution variable:
        """
        {"id": 12345}
        """
      When var 提取並儲存變數:
        | >agentId | name   | email           |
        | <id      | 王大明 | wang@example.tw |
      Then scenarioContext 的 "agentId" 應該等於整數 12345

    Scenario: 應該從 Map 類型的 execution variable 提取多個值
      Given var execution variable:
        """
        {"id": 12345, "jwt": "eyJhbGc...", "createdAt": "2025-01-01T10:00:00"}
        """
      When var 提取並儲存變數:
        | >agentId | >token | name   | >timestamp |
        | <id      | <jwt   | 王大明 | <createdAt |
      Then scenarioContext 的 "agentId" 應該等於整數 12345
      And scenarioContext 的 "token" 應該等於 "eyJhbGc..."
      And scenarioContext 的 "timestamp" 應該等於 "2025-01-01T10:00:00"

    Scenario: 應該拋出異常 - 不存在的 execution key
      Given var execution variable:
        """
        {"id": 12345}
        """
      When var 提取並儲存變數:
        | >agentId        | name   |
        | <nonExistentKey | 王大明 |
      Then 應該拋出 IllegalStateException
      And 錯誤訊息包含 "nonExistentKey" 和 "找不到"

    Scenario: 應該拋出異常 - null 的 execution variable 但有 contextKey 需要提取
      Given var execution variable:
        """
        null
        """
      When var 提取並儲存變數:
        | >agentId | name   |
        | <id      | 王大明 |
      Then 應該拋出 IllegalStateException
      And 錯誤訊息包含 "executionVariable" 和 "null"

    Scenario: 應該支援 nested path 從 Map 提取值
      Given var execution variable:
        """
        {"orderResponse": {"orderId": "ORD-001", "totalAmount": 1500}}
        """
      When var 提取並儲存變數:
        | >orderId                 | status  |
        | <orderResponse.orderId   | PENDING |
      Then scenarioContext 的 "orderId" 應該等於 "ORD-001"

    Scenario: 應該支援多層 nested path 從 Map 提取值
      Given var execution variable:
        """
        {"product": {"details": {"id": "PROD-123"}, "category": {"name": "電子產品"}}}
        """
      When var 提取並儲存變數:
        | >productId          | >categoryName          |
        | <product.details.id | <product.category.name |
      Then scenarioContext 的 "productId" 應該等於 "PROD-123"
      And scenarioContext 的 "categoryName" 應該等於 "電子產品"

    Scenario: 應該拋出異常 - nested path 不存在
      Given var execution variable:
        """
        {"orderResponse": {"orderId": "ORD-001"}}
        """
      When var 提取並儲存變數:
        | >shippingId                       | status  |
        | <orderResponse.nonExistentField   | SHIPPED |
      Then 應該拋出 IllegalStateException
      And 錯誤訊息包含 "nonExistentField" 和 "找不到"

    Scenario: 應該拋出異常 - nested path 中間層級不是 Map
      Given var execution variable:
        """
        {"data": "not a map"}
        """
      When var 提取並儲存變數:
        | >value                | status |
        | <data.someField.value | OK     |
      Then 應該拋出 IllegalStateException
      And 錯誤訊息包含 "data.someField.value" 和 "找不到"

    Scenario: 應該支援單層 path（向後兼容）
      Given var execution variable:
        """
        {"id": 12345}
        """
      When var 提取並儲存變數:
        | >userId | name   |
        | <id     | 王大明 |
      Then scenarioContext 的 "userId" 應該等於整數 12345

    Scenario: 應該支援 array path 從 List 提取第一個元素
      Given var execution variable:
        """
        {"orders": [{"orderId": "ORD-001"}, {"orderId": "ORD-002"}]}
        """
      When var 提取並儲存變數:
        | >orderId            | status  |
        | <orders[0].orderId  | PENDING |
      Then scenarioContext 的 "orderId" 應該等於 "ORD-001"

    Scenario: 應該支援 array path 從 List 提取第二個元素
      Given var execution variable:
        """
        {"orders": [{"orderId": "ORD-001"}, {"orderId": "ORD-002"}]}
        """
      When var 提取並儲存變數:
        | >orderId            | status  |
        | <orders[1].orderId  | PENDING |
      Then scenarioContext 的 "orderId" 應該等於 "ORD-002"

    Scenario: 應該支援簡單 array path（無後續屬性）
      Given var execution variable:
        """
        {"items": ["apple", "banana", "cherry"]}
        """
      When var 提取並儲存變數:
        | >firstItem | status |
        | <items[0]  | OK     |
      Then scenarioContext 的 "firstItem" 應該等於 "apple"

    Scenario: 應該支援多層 nested 加 array path
      Given var execution variable:
        """
        {"data": {"categories": [{"products": [{"name": "A"}, {"name": "B"}]}]}}
        """
      When var 提取並儲存變數:
        | >productName                        | status |
        | <data.categories[0].products[1].name | OK     |
      Then scenarioContext 的 "productName" 應該等於 "B"

    Scenario: 應該拋出異常 - array index 超出範圍
      Given var execution variable:
        """
        {"orders": [{"orderId": "ORD-001"}]}
        """
      When var 提取並儲存變數:
        | >orderId             | status  |
        | <orders[99].orderId  | PENDING |
      Then 應該拋出 IllegalStateException
      And 錯誤訊息包含 "orders[99]" 和 "超出範圍"

    Scenario: 應該拋出異常 - array path 目標不是 List
      Given var execution variable:
        """
        {"data": "not an array"}
        """
      When var 提取並儲存變數:
        | >value   | status |
        | <data[0] | OK     |
      Then 應該拋出 IllegalStateException
      And 錯誤訊息包含 "data" 和 "不是 List"

  Rule: 解析 $variableName（變數引用）

    Scenario: 應該正確解析 $variableName 引用
      Given 設定變數 "agentId" 為整數 12345
      When 解析變數引用 "$agentId"
      Then 結果應該等於整數 12345

    Scenario: 應該處理不存在的變數引用
      When 解析變數引用 "$nonExistentVar"
      Then 結果應該等於字串 "$nonExistentVar"

    Scenario: 應該保留非變數引用的字串
      When 解析變數引用 "王大明"
      Then 結果應該等於字串 "王大明"

    Scenario: 應該處理帶雙引號的變數引用（不解析）
      Given 設定變數 "agentId" 為整數 12345
      When 解析變數引用 "\"$agentId\""
      Then 結果應該等於字串 "$agentId"

    Scenario: 應該處理帶單引號的變數引用（不解析）
      Given 設定變數 "agentId" 為整數 12345
      When 解析變數引用 "'$agentId'"
      Then 結果應該等於字串 "$agentId"

    Scenario: 應該處理 null 值
      When 解析變數引用 null
      Then 結果應該為 null

    Scenario: 應該處理空字串
      When 解析變數引用 ""
      Then 結果應該等於字串 ""

    Scenario: ADR-0006: $now - 沒有設定 mock 時應該使用 getNow
      When 解析變數引用 "$now"
      Then 結果應該是 ZonedDateTime 類型

    Scenario: ADR-0006: $now - 設定 mock now 時使用 mock 時間
      Given 設定當前時間為 "2025-11-04T08:00:00+08:00"
      When 解析變數引用 "$now"
      Then 結果應該是 ZonedDateTime 類型
      And 年為 2025，月為 11，日為 4
      And 時為 8

    Scenario: 應該處理普通字串 'now'（不應該被解析為時間）
      When 解析變數引用 "now"
      Then 結果應該等於字串 "now"

    Scenario: ADR-0006: $now - 如果 scenarioContext 有 now 變數則使用該值
      Given 設定變數 "now" 為字串 "1996-08-07T08:00:00+08:00"
      When 解析變數引用 "$now"
      Then 結果應該等於字串 "1996-08-07T08:00:00+08:00"

    Scenario: 應該移除字串字面值的雙引號
      When 解析變數引用 "\"王大明\""
      Then 結果應該等於字串 "王大明"

    Scenario: 應該移除字串字面值的單引號
      When 解析變數引用 "'李小華'"
      Then 結果應該等於字串 "李小華"

  Rule: 字串插值 ${VAR} 語法

    Scenario: 基本單變數插值
      Given 設定變數 "name" 為字串 "王大明"
      When 解析變數引用 "這是一個 ${name}。"
      Then 結果應該等於字串 "這是一個 王大明。"

    Scenario: 只有變數無其他文字
      Given 設定變數 "name" 為字串 "王大明"
      When 解析變數引用 "${name}"
      Then 結果應該等於字串 "王大明"

    Scenario: 多變數插值
      Given 設定變數 "firstName" 為字串 "王"
      And 設定變數 "lastName" 為字串 "大明"
      When 解析變數引用 "${firstName},${lastName}"
      Then 結果應該等於字串 "王,大明"

    Scenario: 多個變數混合文字
      Given 設定變數 "id" 為整數 12345
      And 設定變數 "name" 為字串 "王大明"
      And 設定變數 "email" 為字串 "wang@example.tw"
      When 解析變數引用 "User ${id}: ${name} (${email})"
      Then 結果應該等於字串 "User 12345: 王大明 (wang@example.tw)"

    Scenario: 純文字無變數
      When 解析變數引用 "沒有變數"
      Then 結果應該等於字串 "沒有變數"

    Scenario: 連續兩個變數無分隔
      Given 設定變數 "name" 為字串 "王大明"
      When 解析變數引用 "${name}${name}"
      Then 結果應該等於字串 "王大明王大明"

    Scenario: 空的大括號應保持原樣
      When 解析變數引用 "${}"
      Then 結果應該等於字串 "${}"

    Scenario: 未閉合的大括號應保持原樣
      Given 設定變數 "name" 為字串 "王大明"
      When 解析變數引用 "未閉合的 ${name"
      Then 結果應該等於字串 "未閉合的 ${name"

    Scenario: 不存在的變數保持原樣
      When 解析變數引用 "${notFound}"
      Then 結果應該等於字串 "${notFound}"

    Scenario: 混合存在與不存在的變數
      Given 設定變數 "name" 為字串 "王大明"
      When 解析變數引用 "Found: ${name}, NotFound: ${notExist}"
      Then 結果應該等於字串 "Found: 王大明, NotFound: ${notExist}"

    Scenario: 嵌套路徑變數
      Given 設定變數 "Users.UserA.id" 為字串 "101"
      When 解析變數引用 "${Users.UserA.id}"
      Then 結果應該等於字串 "101"

    Scenario: 多個嵌套路徑變數
      Given 設定變數 "Users.UserA.id" 為字串 "101"
      And 設定變數 "Users.UserB.id" 為字串 "102"
      When 解析變數引用 "IDs: ${Users.UserA.id},${Users.UserB.id}"
      Then 結果應該等於字串 "IDs: 101,102"

    Scenario: 變數值為空字串
      Given 設定變數 "emptyStr" 為字串 ""
      When 解析變數引用 "Value: ${emptyStr}"
      Then 結果應該等於字串 "Value: "

    Scenario: 數值變數
      Given 設定變數 "id" 為整數 12345
      When 解析變數引用 "ID: ${id}"
      Then 結果應該等於字串 "ID: 12345"

    Scenario: 字串插值應該與舊式 $VAR 語法並存
      Given 設定變數 "name" 為字串 "王大明"
      When 解析變數引用 "Old: $name, New: ${name}"
      Then 結果應該等於字串 "Old: $name, New: 王大明"

    Scenario: 字串插值不應影響引號內的字串
      Given 設定變數 "name" 為字串 "王大明"
      When 解析變數引用 "\"${name}\""
      Then 結果應該等於字串 "${name}"

    Scenario: 批量查詢用戶 ID 的實際使用場景
      Given 設定變數 "Users.UserA.id" 為字串 "1001"
      And 設定變數 "Users.UserB.id" 為字串 "1002"
      And 設定變數 "Users.UserC.id" 為字串 "1003"
      When 解析變數引用 "${Users.UserA.id},${Users.UserB.id},${Users.UserC.id}"
      Then 結果應該等於字串 "1001,1002,1003"

  Rule: 變數生命週期：完整流程測試

    Scenario: 完整流程 - 註冊特務並引用生成的 ID
      Given var execution variable:
        """
        {"id": 10001}
        """
      When var 提取並儲存變數:
        | >agentId | name   | email           |
        | <id      | 王大明 | wang@example.tw |
      Then scenarioContext 的 "agentId" 應該等於整數 10001
      When 解析變數引用 "$agentId"
      Then 結果應該等於整數 10001

    Scenario: 完整流程 - 用戶登入並引用 JWT Token
      Given var execution variable:
        """
        {"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
        """
      When var 提取並儲存變數:
        | >myToken | email            | password    |
        | <token   | user@example.tw  | password123 |
      When 解析變數引用 "$myToken"
      Then 結果應該等於字串 "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

    Scenario: 完整流程 - 創建訂單並引用多個生成的值
      Given var execution variable:
        """
        {"id": 20001, "createdAt": "2025-01-15T14:30:00"}
        """
      When var 提取並儲存變數:
        | >orderId | >orderTime | userId | amount |
        | <id      | <createdAt | 1001   | 500    |
      When 解析變數引用 "$orderId"
      Then 結果應該等於整數 20001
      When 解析變數引用 "$orderTime"
      Then 結果應該等於字串 "2025-01-15T14:30:00"

    Scenario: 完整流程 - 多步驟變數傳遞
      # Step 1: 創建部門，獲得 deptId
      Given var execution variable:
        """
        {"id": 5001}
        """
      When var 提取並儲存變數:
        | >deptId | name   | budget  |
        | <id     | 技術部 | 1000000 |
      Then scenarioContext 的 "deptId" 應該等於整數 5001
      # Step 2: 引用 $deptId
      When 解析變數引用 "$deptId"
      Then 結果應該等於整數 5001

  Rule: >contextKey 與 <executionKey 必須成對

    Scenario: 應該拋出異常 - >contextKey 存在但 data row 沒有對應的 <executionKey
      Given var execution variable:
        """
        {"id": 99999}
        """
      When var 提取並儲存變數:
        | >agentId | name   | email           |
        | 12345    | 王大明 | wang@example.tw |
      Then 應該拋出 IllegalArgumentException

    Scenario: 應該拋出異常 - data row 有 <executionKey 但 header 沒有對應的 >contextKey
      Given var execution variable:
        """
        {"id": 12345}
        """
      When var 提取並儲存變數:
        | agentId | name   | email           |
        | <id     | 王大明 | wang@example.tw |
      Then 應該拋出 IllegalArgumentException

    Scenario: 應該正確處理成對的 >contextKey 與 <executionKey
      Given var execution variable:
        """
        {"id": 12345, "jwt": "eyJhbGc..."}
        """
      When var 提取並儲存變數:
        | >agentId | name   | >token |
        | <id      | 王大明 | <jwt   |
      Then scenarioContext 的 "agentId" 應該等於整數 12345
      And scenarioContext 的 "token" 應該等於 "eyJhbGc..."

    Scenario: 應該拋出異常 - 部分欄位不成對
      Given var execution variable:
        """
        {"id": 12345}
        """
      When var 提取並儲存變數:
        | >agentId | name   | >token    | email           |
        | <id      | 王大明 | someValue | wang@example.tw |
      Then 應該拋出 IllegalArgumentException

    Scenario: 應該拋出異常 - 錯位（>contextKey 與 <executionKey 不在同一欄位）
      Given var execution variable:
        """
        {"id": 99999}
        """
      When var 提取並儲存變數:
        | >agentId | >token | email           |
        | 12345    | <id    | wang@example.tw |
      Then 應該拋出 IllegalArgumentException

    Scenario: 應該允許 - 沒有任何 >contextKey 和 <executionKey
      Given var execution variable:
        """
        {}
        """
      When var 提取並儲存變數:
        | agentId | name   | email           |
        | 12345   | 王大明 | wang@example.tw |
      Then 不應該拋出異常

  Rule: 邊界條件與錯誤處理

    Scenario: 應該處理 data row 長度不匹配 header
      Given var execution variable:
        """
        {"id": 12345, "jwt": "token123"}
        """
      When var 提取並儲存變數:
        | >agentId | >token | name | email |
        | <id      | <jwt   |      |       |
      Then 不應該拋出異常
      And scenarioContext 的 "agentId" 應該等於整數 12345
      And scenarioContext 的 "token" 應該等於 "token123"

    Scenario: 應該拋出異常 - > 符號後沒有名稱（空 key）
      When var 解析 context keys:
        | > | name |
      Then 應該拋出 IllegalArgumentException

    Scenario: 應該拋出異常 - < 符號後沒有名稱（空 key）
      Given var execution variable:
        """
        {}
        """
      When var 提取並儲存變數:
        | >agentId | name   |
        | <        | 王大明 |
      Then 應該拋出 IllegalArgumentException

    Scenario: 應該處理 execution variable 中的 null 值
      Given var execution variable:
        """
        {"id": null}
        """
      When var 提取並儲存變數:
        | >agentId | name   |
        | <id      | 王大明 |
      Then scenarioContext 的 "agentId" 應該為 null

