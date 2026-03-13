Feature: ApiCall - 基本請求
  ApiCall 根據 ApiSpec 定義和 DataTable 建構 HTTP 請求，
  透過 MockMvc 執行，並將回應存入 ScenarioContext。

  Scenario: Body + Path + Query + Header 參數組裝 (WithActor)
    Given api-call ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/test/{id}",
            "summary": "Echo test",
            "parameters": [
              { "name": "id", "in": "path" },
              { "name": "q", "in": "query" },
              { "name": "X-Mode", "in": "header" }
            ]
          }
        ]
      }
      """
    And api-call "Echo test" 回應 200:
      """json
      { "id": "123", "token": "abc" }
      """
    When api-call "Echo test" WithActor token "my-token":
      | P:id | Q:q    | H:X-Trace | H:X-Mode | name  |
      | 123  | search | trace-val | fast     | Alice |
    Then api-call 請求的 path 為 "/test/123"
    And api-call 請求的 header "Authorization" 為 "Bearer my-token"
    And api-call 請求的 header "X-Trace" 為 "trace-val"
    And api-call 請求的 header "X-Mode" 為 "fast"
    And api-call 請求的 query 參數 "q" 為 "search"
    And api-call 請求的 body 包含 "name" 為 "Alice"
    And api-call 回應狀態碼為 200

  Scenario: 只有 Path/Query/Header 時不送 Body
    Given api-call ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/test/{id}",
            "summary": "Echo test",
            "parameters": [
              { "name": "id", "in": "path" },
              { "name": "q", "in": "query" }
            ]
          }
        ]
      }
      """
    And api-call "Echo test" 回應 200:
      """json
      {}
      """
    When api-call "Echo test" WithActor token "token-777":
      | P:id | Q:q   | H:X-Trace |
      | 777  | hello | trace-777 |
    Then api-call 請求的 path 為 "/test/777"
    And api-call 請求的 header "Authorization" 為 "Bearer token-777"
    And api-call 請求的 query 參數 "q" 為 "hello"
    And api-call 請求的 header "X-Trace" 為 "trace-777"
    And api-call 請求不包含 body

  Scenario: WithoutActor 不加入 Authorization header
    Given api-call ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/test/{id}",
            "summary": "Echo test",
            "parameters": [
              { "name": "id", "in": "path" }
            ]
          }
        ]
      }
      """
    And api-call "Echo test" 回應 200:
      """json
      {}
      """
    When api-call "Echo test" WithoutActor:
      | P:id | name |
      | 9    | Bob  |
    Then api-call 請求的 path 為 "/test/9"
    And api-call 請求不包含 header "Authorization"
    And api-call 請求的 body 包含 "name" 為 "Bob"

  Scenario: 明確前綴覆寫同名參數
    Given api-call ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/api/games/{gameId}/players",
            "summary": "Create player",
            "parameters": [
              { "name": "gameId", "in": "path" },
              { "name": "notify", "in": "query" }
            ]
          }
        ]
      }
      """
    And api-call "Create player" 回應 200:
      """json
      {}
      """
    When api-call "Create player" WithActor token "token-123":
      | P:gameId | gameId | Q:notify | notify | name |
      | G999     | G001   | false    | true   | Bob  |
    Then api-call 請求的 path 包含 "G999"
    And api-call 請求的 query 參數 "notify" 為 "false"
    And api-call 請求的 body 包含 "gameId" 為 "G001"
    And api-call 請求的 body 包含 "notify" 為 "true"
    And api-call 請求的 body 包含 "name" 為 "Bob"

  Scenario: 同名參數自動填入 path/query 和 body
    Given api-call ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/api/games/{gameId}/players",
            "summary": "Create player",
            "parameters": [
              { "name": "gameId", "in": "path" },
              { "name": "notify", "in": "query" }
            ]
          }
        ]
      }
      """
    And api-call "Create player" 回應 200:
      """json
      {}
      """
    When api-call "Create player" WithActor token "token-456":
      | gameId | notify | name  | email          |
      | G001   | true   | Alice | alice@test.com |
    Then api-call 請求的 path 包含 "G001"
    And api-call 請求的 query 參數 "notify" 為 "true"
    And api-call 請求的 body 包含 "gameId" 為 "G001"
    And api-call 請求的 body 包含 "notify" 為 "true"
    And api-call 請求的 body 包含 "name" 為 "Alice"
    And api-call 請求的 body 包含 "email" 為 "alice@test.com"

  Scenario: 空 DataTable 處理
    Given api-call ApiSpec:
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
    And api-call "List items" 回應 200:
      """json
      { "items": [] }
      """
    When api-call "List items" WithActor token "token-123":
      | |
    Then api-call 請求不包含 body
    And api-call 請求的 header "Authorization" 為 "Bearer token-123"
    And api-call 回應狀態碼為 200

  Scenario: 巢狀 JSON path (a.b[0].c)
    Given api-call ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/api/items",
            "summary": "Create item"
          }
        ]
      }
      """
    And api-call "Create item" 回應 200:
      """json
      {}
      """
    When api-call "Create item" WithoutActor:
      | name   | a.b[0].c | a.b[1].c |
      | Item A | 1        | 2        |
    Then api-call 請求的 body 包含 "name" 為 "Item A"
    And api-call 請求的 body nested "a.b[0].c" 為 "1"
    And api-call 請求的 body nested "a.b[1].c" 為 "2"

  Scenario: JSON array 和 object 在 body 中
    Given api-call ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/api/products",
            "summary": "Create product"
          }
        ]
      }
      """
    And api-call "Create product" 回應 200:
      """json
      {}
      """
    When api-call "Create product" WithoutActor:
      | name      | tags                       | config                                          |
      | Product A | ["new", "featured", "sale"] | {"timeout": 30, "retries": 3, "enabled": true}  |
    Then api-call 請求的 body 包含 "name" 為 "Product A"
    And api-call 請求的 body "tags" 為 JSON array 長度 3
    And api-call 請求的 body "config" 為 JSON object

  Scenario: 找不到 summary 應拋出例外
    Given api-call ApiSpec:
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
    And api-call "List items" 回應 200:
      """json
      {}
      """
    When api-call "Unknown API" WithoutActor:
      | name |
      | test |
    Then api-call 應拋出例外訊息包含 "找不到 API 操作 'Unknown API'"
