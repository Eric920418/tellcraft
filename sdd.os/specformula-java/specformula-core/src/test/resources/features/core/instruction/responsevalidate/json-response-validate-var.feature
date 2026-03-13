Feature: JsonResponseValidate - VAR-System 整合
  JsonResponseValidate 與 VAR-System 整合，支援在預期 JSON 中
  使用 $variable 引用 ScenarioContext 變數，以及透過
  >contextKey / <executionKey 從回應擷取變數存入 ScenarioContext。

  Scenario: $variable 引用 ScenarioContext 變數驗證通過
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
    When response-validate 驗證 "Get user" (200), with Json:
      """json
      { "id": 1, "name": "$expectedName", "email": "$expectedEmail" }
      """
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
    When response-validate 驗證 "Get user" (200), with Json:
      """json
      { "id": 1, "name": "$expectedName" }
      """
    Then response-validate 失敗, 訊息包含 "值不匹配"

  Scenario: $variable 用於巢狀物件中驗證通過
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
    And response-validate ScenarioContext 預設變數 "expectedCity" 為 "Taipei"
    And response-validate ScenarioContext 預設變數 "expectedStatus" 為 "shipped"
    And response-validate 設定回應 "Get order" 狀態碼 200:
      """json
      {
        "id": 1,
        "status": "shipped",
        "shipping": {
          "city": "Taipei",
          "method": "express"
        }
      }
      """
    When response-validate 驗證 "Get order" (200), with Json:
      """json
      {
        "id": 1,
        "status": "$expectedStatus",
        "shipping": {
          "city": "$expectedCity",
          "method": "express"
        }
      }
      """
    Then response-validate 通過

  Scenario: 混合場景 - $variable + &isNotNull + 一般比對
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
    And response-validate ScenarioContext 預設變數 "expectedRole" 為 "admin"
    And response-validate 設定回應 "Get user" 狀態碼 200:
      """json
      { "id": 1, "name": "Alice", "role": "admin", "token": "secret-123" }
      """
    When response-validate 驗證 "Get user" (200), with Json:
      """json
      { "id": 1, "name": "Alice", "role": "$expectedRole", "token": "&isNotNull" }
      """
    Then response-validate 通過

  Scenario: 混合場景 - $variable + CAS 約束
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
    And response-validate ScenarioContext 預設變數 "expectedBuyer" 為 "Alice"
    And response-validate 設定回應 "Get order" 狀態碼 200:
      """json
      { "id": 1, "buyer": "Alice", "amount": 300, "status": "completed" }
      """
    When response-validate 驗證 "Get order" (200), with Json:
      """json
      {
        "id": 1,
        "buyer": "$expectedBuyer",
        "amount": "&gt(100)",
        "status": "&oneOf(pending,completed,cancelled)"
      }
      """
    Then response-validate 通過

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
    When response-validate 驗證 "Get user" (200), with Json:
      """json
      { "id": 1, ">extractedName": "<name", ">extractedToken": "<token" }
      """
    Then response-validate 通過
    And response-validate ScenarioContext 應有變數 "extractedName" 為 "Alice"
    And response-validate ScenarioContext 應有變數 "extractedToken" 為 "abc-xyz-123"

  Scenario: 巢狀物件中 >contextKey / <executionKey 擷取變數
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
      {
        "id": 1,
        "user": {
          "id": 42,
          "name": "Alice"
        }
      }
      """
    When response-validate 驗證 "Get user" (200), with Json:
      """json
      {
        "id": 1,
        "user": {
          ">user.id": "<id",
          ">user.name": "<name"
        }
      }
      """
    Then response-validate 通過
    And response-validate ScenarioContext 應有變數 "user.id" 為 "42"
    And response-validate ScenarioContext 應有變數 "user.name" 為 "Alice"

  Scenario: 混合場景 - 一般比對 + 變數擷取 + &isNotNull
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
      { "id": 1, "name": "Alice", "role": "admin", "token": "secret-123" }
      """
    When response-validate 驗證 "Get user" (200), with Json:
      """json
      {
        "id": 1,
        "name": "Alice",
        "role": "&isNotNull",
        ">extractedToken": "<token"
      }
      """
    Then response-validate 通過
    And response-validate ScenarioContext 應有變數 "extractedToken" 為 "secret-123"

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
    When response-validate 驗證 "Create user" (201), with Json:
      """json
      { ">createdId": "<id", ">createdName": "<name" }
      """
    Then response-validate 通過
    And response-validate ScenarioContext 應有變數 "createdId" 為 "42"
    And response-validate ScenarioContext 應有變數 "createdName" 為 "Alice"
