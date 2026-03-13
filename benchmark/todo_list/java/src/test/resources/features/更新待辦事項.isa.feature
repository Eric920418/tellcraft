Feature: 更新待辦事項

  Background:
    Given 現在時間為 "2026-01-27T10:00:00"
    Given 準備一個使用者, with table:
      | >Alice.id | name  | email             | passwordHash | status |
      | <userId   | Alice | alice@example.com | password123   | ACTIVE |

  Rule: 成功更新待辦事項

    Example: 更新待辦事項標題
      When (No Actor) 使用者登入, call table:
        | >AliceToken | email             | password    |
        | <token      | alice@example.com | password123 |
      When (UID="$Alice.id") 新增待辦事項, call table:
        | >todo1.id | title  |
        | <todoId   | 買牛奶 |
      When (UID="$Alice.id") 更新待辦事項, call table:
        | P:todoId  | title      |
        | $todo1.id | 買豆漿     |
      Then 更新待辦事項(200)回應, with table:
        | todoId    | title  | completed |
        | $todo1.id | 買豆漿 | false     |
      And 應該存在一個待辦事項, with table:
        | todoId    | title  | completed |
        | $todo1.id | 買豆漿 | false     |

    Example: 標記待辦事項為已完成
      When (No Actor) 使用者登入, call table:
        | >AliceToken | email             | password    |
        | <token      | alice@example.com | password123 |
      When (UID="$Alice.id") 新增待辦事項, call table:
        | >todo1.id | title  |
        | <todoId   | 買牛奶 |
      When (UID="$Alice.id") 更新待辦事項, call table:
        | P:todoId  | completed |
        | $todo1.id | true      |
      Then 更新待辦事項(200)回應, with table:
        | todoId    | title  | completed |
        | $todo1.id | 買牛奶 | true      |
      And 應該存在一個待辦事項, with table:
        | todoId    | title  | completed |
        | $todo1.id | 買牛奶 | true      |

  Rule: 更新失敗

    Example: 更新不存在的待辦事項
      When (No Actor) 使用者登入, call table:
        | >AliceToken | email             | password    |
        | <token      | alice@example.com | password123 |
      When (UID="$Alice.id") 更新待辦事項, call table:
        | P:todoId | title    |
        | 99999    | 不存在的 |
      Then 更新待辦事項(404)回應, with table:
        | error          |
        | 待辦事項不存在 |
