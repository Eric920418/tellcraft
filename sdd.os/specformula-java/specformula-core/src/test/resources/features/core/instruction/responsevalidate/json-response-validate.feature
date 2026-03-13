Feature: JsonResponseValidate - 基本驗證
  JsonResponseValidate 使用 DocString JSON 進行 API 回應的遞迴結構比對，
  支援 HTTP 狀態碼檢查、巢狀物件/陣列比對、&isNotNull 驗證及 Schema 驗證。

  Scenario: 基本 JSON 物件比對通過
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
      { "id": 1, "name": "Alice", "email": "alice@test.com" }
      """
    When response-validate 驗證 "Get user" (200), with Json:
      """json
      { "id": 1, "name": "Alice", "email": "alice@test.com" }
      """
    Then response-validate 通過

  Scenario: 巢狀物件比對通過
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
        "profile": {
          "name": "Alice",
          "address": {
            "city": "Taipei",
            "zip": "100"
          }
        }
      }
      """
    When response-validate 驗證 "Get user" (200), with Json:
      """json
      {
        "id": 1,
        "profile": {
          "name": "Alice",
          "address": {
            "city": "Taipei",
            "zip": "100"
          }
        }
      }
      """
    Then response-validate 通過

  Scenario: 陣列比對通過
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/items",
            "summary": "List items"
          }
        ]
      }
      """
    And response-validate 設定回應 "List items" 狀態碼 200:
      """json
      {
        "items": [
          { "name": "A", "price": 10 },
          { "name": "B", "price": 20 }
        ]
      }
      """
    When response-validate 驗證 "List items" (200), with Json:
      """json
      {
        "items": [
          { "name": "A", "price": 10 },
          { "name": "B", "price": 20 }
        ]
      }
      """
    Then response-validate 通過

  Scenario: &isNotNull 驗證通過
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
      { "id": 1, "name": "Alice", "token": "abc-xyz" }
      """
    When response-validate 驗證 "Get user" (200), with Json:
      """json
      { "id": 1, "name": "Alice", "token": "&isNotNull" }
      """
    Then response-validate 通過

  Scenario: 數值和布林直接比對通過
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/settings",
            "summary": "Get settings"
          }
        ]
      }
      """
    And response-validate 設定回應 "Get settings" 狀態碼 200:
      """json
      { "maxRetries": 3, "timeout": 30.5, "enabled": true, "label": null }
      """
    When response-validate 驗證 "Get settings" (200), with Json:
      """json
      { "maxRetries": 3, "timeout": 30.5, "enabled": true, "label": null }
      """
    Then response-validate 通過

  Scenario: Schema 驗證通過 - 回應符合 api-spec 定義
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
            ],
            "responses": {
              "200": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "id": { "type": "integer" },
                    "name": { "type": "string" },
                    "email": { "type": "string" }
                  },
                  "required": ["id", "name"]
                }
              }
            }
          }
        ]
      }
      """
    And response-validate 設定回應 "Get user" 狀態碼 200:
      """json
      { "id": 1, "name": "Alice", "email": "alice@test.com" }
      """
    When response-validate 驗證 "Get user" (200), with Json:
      """json
      { "id": 1, "name": "Alice" }
      """
    Then response-validate 通過

  Scenario: HTTP 狀態碼不匹配應失敗
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
    And response-validate 設定回應 "Get user" 狀態碼 500:
      """json
      { "error": "internal error" }
      """
    When response-validate 驗證 "Get user" (200), with Json:
      """json
      { "id": 1 }
      """
    Then response-validate 失敗, 訊息包含 "HTTP 狀態碼不匹配"

  Scenario: 欄位值不匹配應失敗
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
      { "id": 1, "name": "Bob" }
      """
    When response-validate 驗證 "Get user" (200), with Json:
      """json
      { "id": 1, "name": "Alice" }
      """
    Then response-validate 失敗, 訊息包含 "值不匹配"

  Scenario: 缺少欄位應失敗
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
      { "id": 1 }
      """
    When response-validate 驗證 "Get user" (200), with Json:
      """json
      { "id": 1, "name": "Alice" }
      """
    Then response-validate 失敗, 訊息包含 "缺少欄位"

  Scenario: 陣列長度不匹配應失敗
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/items",
            "summary": "List items"
          }
        ]
      }
      """
    And response-validate 設定回應 "List items" 狀態碼 200:
      """json
      { "items": [{ "name": "A" }] }
      """
    When response-validate 驗證 "List items" (200), with Json:
      """json
      { "items": [{ "name": "A" }, { "name": "B" }] }
      """
    Then response-validate 失敗, 訊息包含 "陣列長度不匹配"

  Scenario: &isNotNull 對 null 值應失敗
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
      { "id": 1, "name": null }
      """
    When response-validate 驗證 "Get user" (200), with Json:
      """json
      { "id": 1, "name": "&isNotNull" }
      """
    Then response-validate 失敗, 訊息包含 "&isNotNull"

  Scenario: Schema 型別不符應失敗
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
            ],
            "responses": {
              "200": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "id": { "type": "integer" },
                    "name": { "type": "string" }
                  }
                }
              }
            }
          }
        ]
      }
      """
    And response-validate 設定回應 "Get user" 狀態碼 200:
      """json
      { "id": "not-a-number", "name": "Alice" }
      """
    When response-validate 驗證 "Get user" (200), with Json:
      """json
      { "id": "not-a-number", "name": "Alice" }
      """
    Then response-validate 失敗, 訊息包含 "型別不符"
