Feature: DataTableResponseValidate - VAR-System 整合
  DataTableResponseValidate 與 VAR-System 整合，支援從回應中擷取變數
  存入 ScenarioContext，以及使用 $variable 引用 ScenarioContext 中的變數。

  Scenario: >contextKey / <executionKey 從回應擷取變數至 ScenarioContext
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
      { "id": 1, "name": "Alice", "token": "abc-xyz-123" }
      """
    When response-validate 驗證 "Get user" (200), with Table:
      | id | >extractedName | >extractedToken |
      | 1  | <name          | <token          |
    Then response-validate 通過
    And response-validate ScenarioContext 應有變數 "extractedName" 為 "Alice"
    And response-validate ScenarioContext 應有變數 "extractedToken" 為 "abc-xyz-123"

  Scenario: $variable 引用 ScenarioContext 變數進行驗證
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
    And response-validate ScenarioContext 預設變數 "expectedName" 為 "Alice"
    And response-validate ScenarioContext 預設變數 "expectedEmail" 為 "alice@test.com"
    And response-validate 設定回應 "Get user" 狀態碼 200:
      """json
      { "id": 1, "name": "Alice", "email": "alice@test.com" }
      """
    When response-validate 驗證 "Get user" (200), with Table:
      | name          | email          |
      | $expectedName | $expectedEmail |
    Then response-validate 通過

  Scenario: $variable 引用不匹配應失敗
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
    And response-validate ScenarioContext 預設變數 "expectedName" 為 "Bob"
    And response-validate 設定回應 "Get user" 狀態碼 200:
      """json
      { "id": 1, "name": "Alice" }
      """
    When response-validate 驗證 "Get user" (200), with Table:
      | name          |
      | $expectedName |
    Then response-validate 失敗, 訊息包含 "值不匹配"

  Scenario: 混合場景 - 一般欄位 + 變數擷取 + $variable 引用
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
    And response-validate ScenarioContext 預設變數 "expectedStatus" 為 "completed"
    And response-validate 設定回應 "Get order" 狀態碼 200:
      """json
      { "id": 1, "status": "completed", "total": 500, "trackingCode": "TRK-001" }
      """
    When response-validate 驗證 "Get order" (200), with Table:
      | id | status           | total | >trackingCode    |
      | 1  | $expectedStatus  | 500   | <trackingCode    |
    Then response-validate 通過
    And response-validate ScenarioContext 應有變數 "trackingCode" 為 "TRK-001"

  Scenario: 多次擷取變數後使用 $variable 引用驗證
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/api/users",
            "summary": "Create user"
          },
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
    And response-validate 設定回應 "Create user" 狀態碼 201:
      """json
      { "id": 42, "name": "Alice" }
      """
    When response-validate 驗證 "Create user" (201), with Table:
      | >createdId | >createdName |
      | <id        | <name        |
    Then response-validate 通過
    And response-validate ScenarioContext 應有變數 "createdId" 為 "42"
    And response-validate ScenarioContext 應有變數 "createdName" 為 "Alice"
    And response-validate 設定回應 "Get user" 狀態碼 200:
      """json
      { "id": 42, "name": "Alice", "active": true }
      """
    When response-validate 驗證 "Get user" (200), with Table:
      | id          | name          |
      | $createdId  | $createdName  |
    Then response-validate 通過
