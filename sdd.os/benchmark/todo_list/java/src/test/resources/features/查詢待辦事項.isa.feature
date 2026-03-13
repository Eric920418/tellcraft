Feature: 查詢待辦事項

  Background:
    Given 準備一個使用者, with table:
      | >Alice.id | name  | email             | passwordHash | status |
      | <userId   | Alice | alice@example.com | password123   | ACTIVE |

  Rule: 查詢自己的待辦事項列表

    Example: 查詢有資料的待辦事項列表
      When (No Actor) 使用者登入, call table:
        | >AliceToken | email             | password    |
        | <token      | alice@example.com | password123 |
      When (UID="$Alice.id") 新增待辦事項, call table:
        | title  | description    |
        | 買牛奶 | 去全聯買兩瓶鮮奶 |
      When (UID="$Alice.id") 新增待辦事項, call table:
        | title  |
        | 寫報告 |
      When (UID="$Alice.id") 查詢待辦事項列表, call table:
        |  |
      Then 查詢待辦事項列表(200)回應為, with JSON:
        """
        [
          { "title": "買牛奶", "description": "去全聯買兩瓶鮮奶", "completed": false },
          { "title": "寫報告", "completed": false }
        ]
        """

    Example: 沒有待辦事項時回傳空列表
      When (No Actor) 使用者登入, call table:
        | >AliceToken | email             | password    |
        | <token      | alice@example.com | password123 |
      When (UID="$Alice.id") 查詢待辦事項列表, call table:
        |  |
      Then 查詢待辦事項列表(200)回應為, with JSON:
        """
        []
        """
