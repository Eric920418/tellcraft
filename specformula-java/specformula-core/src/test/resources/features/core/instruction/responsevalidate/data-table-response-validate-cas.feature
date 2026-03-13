Feature: DataTableResponseValidate - CAS 整合
  DataTableResponseValidate 與 CAS (Constraint Assertion System) 整合，
  支援在 DataTable 欄位中使用約束斷言驗證回應值。

  Scenario: &eq 數值相等驗證通過
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/orders/{id}",
            "summary": "Get order",
            "parameters": [
              { "name": "id", "in": "path" }
            ]
          }
        ]
      }
      """
    And response-validate 設定回應 "Get order" 狀態碼 200:
      """json
      { "id": 1, "amount": 100, "status": "completed" }
      """
    When response-validate 驗證 "Get order" (200), with Table:
      | amount    | status    |
      | &eq(100)  | completed |
    Then response-validate 通過

  Scenario: &gt / &lt 數值比較驗證通過
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/orders/{id}",
            "summary": "Get order",
            "parameters": [
              { "name": "id", "in": "path" }
            ]
          }
        ]
      }
      """
    And response-validate 設定回應 "Get order" 狀態碼 200:
      """json
      { "id": 1, "amount": 100, "quantity": 5 }
      """
    When response-validate 驗證 "Get order" (200), with Table:
      | amount  | quantity |
      | &gt(50) | &lt(10)  |
    Then response-validate 通過

  Scenario: &ge / &le 大於等於、小於等於驗證通過
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/orders/{id}",
            "summary": "Get order",
            "parameters": [
              { "name": "id", "in": "path" }
            ]
          }
        ]
      }
      """
    And response-validate 設定回應 "Get order" 狀態碼 200:
      """json
      { "id": 1, "amount": 100, "quantity": 5 }
      """
    When response-validate 驗證 "Get order" (200), with Table:
      | amount   | quantity |
      | &ge(100) | &le(5)   |
    Then response-validate 通過

  Scenario: &between 範圍驗證通過
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/products/{id}",
            "summary": "Get product",
            "parameters": [
              { "name": "id", "in": "path" }
            ]
          }
        ]
      }
      """
    And response-validate 設定回應 "Get product" 狀態碼 200:
      """json
      { "id": 1, "price": 59.99, "stock": 25 }
      """
    When response-validate 驗證 "Get product" (200), with Table:
      | price           | stock          |
      | &between(50,70) | &between(1,50) |
    Then response-validate 通過

  Scenario: &contains 字串包含驗證通過
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/users/{id}",
            "summary": "Get user",
            "parameters": [
              { "name": "id", "in": "path" }
            ]
          }
        ]
      }
      """
    And response-validate 設定回應 "Get user" 狀態碼 200:
      """json
      { "id": 1, "name": "Alice Smith", "email": "alice@example.com" }
      """
    When response-validate 驗證 "Get user" (200), with Table:
      | name             | email               |
      | &contains(Alice) | &contains(@example) |
    Then response-validate 通過

  Scenario: &matches 正則表達式驗證通過
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/users/{id}",
            "summary": "Get user",
            "parameters": [
              { "name": "id", "in": "path" }
            ]
          }
        ]
      }
      """
    And response-validate 設定回應 "Get user" 狀態碼 200:
      """json
      { "id": 1, "email": "alice@example.com", "phone": "0912-345-678" }
      """
    When response-validate 驗證 "Get user" (200), with Table:
      | email                          | phone                        |
      | &matches(^[\\w.]+@[\\w.]+$)    | &matches(^\\d{4}-\\d{3}-\\d{3}$) |
    Then response-validate 通過

  Scenario: 多重約束組合驗證通過
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/orders/{id}",
            "summary": "Get order",
            "parameters": [
              { "name": "id", "in": "path" }
            ]
          }
        ]
      }
      """
    And response-validate 設定回應 "Get order" 狀態碼 200:
      """json
      { "id": 1, "amount": 150 }
      """
    When response-validate 驗證 "Get order" (200), with Table:
      | amount                   |
      | &isNum &gt(100) &le(200) |
    Then response-validate 通過

  Scenario: &oneOf 列舉驗證通過
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/orders/{id}",
            "summary": "Get order",
            "parameters": [
              { "name": "id", "in": "path" }
            ]
          }
        ]
      }
      """
    And response-validate 設定回應 "Get order" 狀態碼 200:
      """json
      { "id": 1, "status": "completed" }
      """
    When response-validate 驗證 "Get order" (200), with Table:
      | status                              |
      | &oneOf(pending,completed,cancelled) |
    Then response-validate 通過

  Scenario: 約束驗證失敗應報錯
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/orders/{id}",
            "summary": "Get order",
            "parameters": [
              { "name": "id", "in": "path" }
            ]
          }
        ]
      }
      """
    And response-validate 設定回應 "Get order" 狀態碼 200:
      """json
      { "id": 1, "amount": 50 }
      """
    When response-validate 驗證 "Get order" (200), with Table:
      | amount   |
      | &gt(100) |
    Then response-validate 失敗, 訊息包含 "amount"
