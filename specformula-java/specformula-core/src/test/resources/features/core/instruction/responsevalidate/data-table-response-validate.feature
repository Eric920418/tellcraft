Feature: DataTableResponseValidate - 基本驗證
  DataTableResponseValidate 使用 Cucumber DataTable 進行 API 回應的欄位層級驗證，
  支援 HTTP 狀態碼檢查、巢狀 JSON path、&isNotNull 驗證及 Schema 驗證。

  Scenario: 基本欄位驗證通過
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
    When response-validate 驗證 "Get user" (200), with Table:
      | id | name  | email          |
      | 1  | Alice | alice@test.com |
    Then response-validate 通過

  Scenario: 巢狀 JSON path 驗證 (dot-notation)
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
      { "data": { "user": { "id": 1, "name": "Alice" } } }
      """
    When response-validate 驗證 "Get user" (200), with Table:
      | data.user.id | data.user.name |
      | 1            | Alice          |
    Then response-validate 通過

  Scenario: Array index 驗證
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
      { "items": [{ "name": "A" }, { "name": "B" }] }
      """
    When response-validate 驗證 "List items" (200), with Table:
      | items[0].name | items[1].name |
      | A             | B             |
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
    When response-validate 驗證 "Get user" (200), with Table:
      | id | name  | token    |
      | 1  | Alice | &isNotNull |
    Then response-validate 通過

  Scenario: 空 DataTable 僅驗證狀態碼
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
      { "items": [] }
      """
    When response-validate 驗證 "List items" (200), with Table:
      | |
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
    When response-validate 驗證 "Get user" (200), with Table:
      | id | name  |
      | 1  | Alice |
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
    And response-validate 設定回應 "Get user" 狀態碼 404:
      """json
      { "error": "not found" }
      """
    When response-validate 驗證 "Get user" (200), with Table:
      | id |
      | 1  |
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
    When response-validate 驗證 "Get user" (200), with Table:
      | id | name  |
      | 1  | Alice |
    Then response-validate 失敗, 訊息包含 "值不匹配"

  Scenario: &isNotNull 欄位不存在應失敗
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
      { "id": 1, "name": "Alice" }
      """
    When response-validate 驗證 "Get user" (200), with Table:
      | id | token    |
      | 1  | &isNotNull |
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
    When response-validate 驗證 "Get user" (200), with Table:
      | id             | name  |
      | not-a-number   | Alice |
    Then response-validate 失敗, 訊息包含 "型別不符"
