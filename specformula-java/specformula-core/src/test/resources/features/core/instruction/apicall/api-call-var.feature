Feature: ApiCall - VAR-System 整合
  ApiCall 與 VAR-System 整合，支援變數解析用於請求參數，
  以及從回應中擷取變數存入 ScenarioContext。

  Scenario: 回應變數擷取至 ScenarioContext (>contextKey + <executionKey)
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
      { "id": "123", "token": "abc", "name": "Alice" }
      """
    When api-call "Echo test" WithoutActor:
      | P:id | agentId | >extractedToken | >extractedName |
      | 101  | A001    | <token          | <name          |
    Then api-call 請求的 body 包含 "agentId" 為 "A001"
    And api-call ScenarioContext 變數 "extractedToken" 為 "abc"
    And api-call ScenarioContext 變數 "extractedName" 為 "Alice"

  Scenario: $variable 解析用於 path/query/body 參數
    Given api-call ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/api/games/{gameId}/players/{playerId}",
            "summary": "Update player",
            "parameters": [
              { "name": "gameId", "in": "path" },
              { "name": "playerId", "in": "path" },
              { "name": "notify", "in": "query" }
            ]
          }
        ]
      }
      """
    And api-call "Update player" 回應 200:
      """json
      {}
      """
    And api-call ScenarioContext 設定變數 "gameId" 為 "G001"
    And api-call ScenarioContext 設定變數 "playerId" 為 "P123"
    When api-call "Update player" WithActor token "admin-token":
      | gameId  | playerId  | notify | name    |
      | $gameId | $playerId | true   | NewName |
    Then api-call 請求的 path 包含 "G001"
    And api-call 請求的 path 包含 "P123"
    And api-call 請求的 query 參數 "notify" 為 "true"
    And api-call 請求的 body 包含 "gameId" 為 "G001"
    And api-call 請求的 body 包含 "playerId" 為 "P123"
    And api-call 請求的 body 包含 "name" 為 "NewName"

  Scenario: 混合場景 - VAR + 明確前綴 + 變數擷取
    Given api-call ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/api/games/{gameId}/players/{playerId}",
            "summary": "Update player",
            "parameters": [
              { "name": "gameId", "in": "path" },
              { "name": "playerId", "in": "path" },
              { "name": "notify", "in": "query" }
            ]
          }
        ]
      }
      """
    And api-call "Update player" 回應 200:
      """json
      { "id": "result-999" }
      """
    And api-call ScenarioContext 設定變數 "storedGameId" 為 "G100"
    When api-call "Update player" WithActor token "complex-token":
      | P:gameId      | gameId | playerId | Q:notify | notify | name        | >resultId |
      | $storedGameId | G200   | P456     | false    | true   | MixedPlayer | <id       |
    Then api-call 請求的 path 包含 "G100"
    And api-call 請求的 path 包含 "P456"
    And api-call 請求的 query 參數 "notify" 為 "false"
    And api-call 請求的 body 包含 "gameId" 為 "G200"
    And api-call 請求的 body 包含 "playerId" 為 "P456"
    And api-call 請求的 body 包含 "notify" 為 "true"
    And api-call 請求的 body 包含 "name" 為 "MixedPlayer"
    And api-call ScenarioContext 變數 "resultId" 為 "result-999"

  Scenario: 回應存入 ScenarioContext.lastResponse
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
    When api-call "List items" WithoutActor:
      | |
    Then api-call ScenarioContext 的 lastResponse 不為 null
    And api-call 回應狀態碼為 200
