Feature: JsonResponseValidate - CAS 整合
  JsonResponseValidate 與 CAS (Constraint Assertion System) 整合，
  支援在預期 JSON 字串值中使用約束斷言驗證回應值。

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
    When response-validate 驗證 "Get order" (200), with Json:
      """json
      { "id": 1, "amount": "&eq(100)", "status": "completed" }
      """
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
    When response-validate 驗證 "Get order" (200), with Json:
      """json
      { "id": 1, "amount": "&gt(50)", "quantity": "&lt(10)" }
      """
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
    When response-validate 驗證 "Get product" (200), with Json:
      """json
      { "id": 1, "price": "&between(50,70)", "stock": "&between(1,50)" }
      """
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
    When response-validate 驗證 "Get user" (200), with Json:
      """json
      { "id": 1, "name": "&contains(Alice)", "email": "&contains(@example)" }
      """
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
    When response-validate 驗證 "Get order" (200), with Json:
      """json
      { "id": 1, "amount": "&isNum &gt(100) &le(200)" }
      """
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
    When response-validate 驗證 "Get order" (200), with Json:
      """json
      { "id": 1, "status": "&oneOf(pending,completed,cancelled)" }
      """
    Then response-validate 通過

  Scenario: 巢狀物件中使用約束驗證
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
      {
        "id": 1,
        "payment": {
          "amount": 200,
          "currency": "TWD",
          "paidAt": "2025-01-15T10:30:00"
        }
      }
      """
    When response-validate 驗證 "Get order" (200), with Json:
      """json
      {
        "id": 1,
        "payment": {
          "amount": "&gt(100)",
          "currency": "&oneOf(TWD,USD,JPY)",
          "paidAt": "&isNotNull"
        }
      }
      """
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
    When response-validate 驗證 "Get order" (200), with Json:
      """json
      { "id": 1, "amount": "&gt(100)" }
      """
    Then response-validate 失敗, 訊息包含 "amount"
