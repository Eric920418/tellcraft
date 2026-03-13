Feature: 新增待辦事項

  Background:
    Given 現在時間為 "2026-01-27T10:00:00"
    Given 準備一個使用者, with table:
      | >Alice.id | name  | email             | passwordHash | status |
      | <userId   | Alice | alice@example.com | password123   | ACTIVE |

  Rule: 成功新增待辦事項

    Example: 新增一筆有標題和描述的待辦事項
      When (No Actor) 使用者登入, call table:
        | >AliceToken | email             | password    |
        | <token      | alice@example.com | password123 |
      When (UID="$Alice.id") 新增待辦事項, call table:
        | title  | description    |
        | 買牛奶 | 去全聯買兩瓶鮮奶 |
      Then 新增待辦事項(201)回應, with table:
        | >todo1.id | userId    | title  | description    | completed | createdAt  | updatedAt  |
        | <todoId   | $Alice.id | 買牛奶 | 去全聯買兩瓶鮮奶 | false     | &sameTime("2026-01-27T10:00:00") | &sameTime("2026-01-27T10:00:00") |
      And 應該存在一個待辦事項, with table:
        | todoId    | userId    | title  | description    | completed | createdAt  | updatedAt  |
        | $todo1.id | $Alice.id | 買牛奶 | 去全聯買兩瓶鮮奶 | false     | &sameTime("2026-01-27T10:00:00") | &sameTime("2026-01-27T10:00:00") |

    Example: 新增一筆只有標題的待辦事項
      When (No Actor) 使用者登入, call table:
        | >AliceToken | email             | password    |
        | <token      | alice@example.com | password123 |
      When (UID="$Alice.id") 新增待辦事項, call table:
        | title    |
        | 寫報告   |
      Then 新增待辦事項(201)回應, with table:
        | >todo1.id | userId    | title  | completed | createdAt  | updatedAt  |
        | <todoId   | $Alice.id | 寫報告 | false     | &sameTime("2026-01-27T10:00:00") | &sameTime("2026-01-27T10:00:00") |

  Rule: 新增失敗 - 缺少必填欄位

    Example: 缺少標題
      When (No Actor) 使用者登入, call table:
        | >AliceToken | email             | password    |
        | <token      | alice@example.com | password123 |
      When (UID="$Alice.id") 新增待辦事項, call table:
        | description |
        | 沒有標題    |
      Then 新增待辦事項(400)回應為, with JSON:
        """
        { "error": "&isStr" }
        """
