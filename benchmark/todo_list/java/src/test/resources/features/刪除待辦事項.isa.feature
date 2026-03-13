Feature: 刪除待辦事項

  Background:
    Given 準備一個使用者, with table:
      | >Alice.id | name  | email             | passwordHash | status |
      | <userId   | Alice | alice@example.com | password123   | ACTIVE |

  Rule: 成功刪除待辦事項

    Example: 刪除一筆待辦事項
      When (No Actor) 使用者登入, call table:
        | >AliceToken | email             | password    |
        | <token      | alice@example.com | password123 |
      When (UID="$Alice.id") 新增待辦事項, call table:
        | >todo1.id | title  |
        | <todoId   | 買牛奶 |
      When (UID="$Alice.id") 刪除待辦事項, call table:
        | P:todoId  |
        | $todo1.id |
      Then 刪除待辦事項(200)回應, with table:
        | message  |
        | 刪除成功 |
      And 應該不存在一個待辦事項, with table:
        | todoId    |
        | $todo1.id |

  Rule: 刪除失敗

    Example: 刪除不存在的待辦事項
      When (No Actor) 使用者登入, call table:
        | >AliceToken | email             | password    |
        | <token      | alice@example.com | password123 |
      When (UID="$Alice.id") 刪除待辦事項, call table:
        | P:todoId |
        | 99999    |
      Then 刪除待辦事項(404)回應, with table:
        | error          |
        | 待辦事項不存在 |
