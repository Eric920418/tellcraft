Feature: ApiSpec - findBySummary
  ApiSpec 提供 findBySummary 方法，
  透過 summary 快速查詢對應的 ApiOperation。

  Scenario: 透過 summary 找到對應的 operation
    Given 一個 ApiSpec 包含以下 operations:
      | method | path   | summary     |
      | get    | /hello | Say hello   |
      | post   | /users | Create user |
    When 使用 summary "Say hello" 搜尋
    Then 應找到 operation 的 method 為 "get" 且 path 為 "/hello"

  Scenario: 透過 summary 找不到 operation 時回傳 null
    Given 一個 ApiSpec 包含以下 operations:
      | method | path   | summary   |
      | get    | /hello | Say hello |
    When 使用 summary "Not exist" 搜尋
    Then 應找不到 operation

  Scenario: 多個 operation 中精確查詢
    Given 一個 ApiSpec 包含以下 operations:
      | method | path       | summary      |
      | get    | /users     | List users   |
      | post   | /users     | Create user  |
      | get    | /users/{id}| Get user     |
      | delete | /users/{id}| Delete user  |
    When 使用 summary "Get user" 搜尋
    Then 應找到 operation 的 method 為 "get" 且 path 為 "/users/{id}"
