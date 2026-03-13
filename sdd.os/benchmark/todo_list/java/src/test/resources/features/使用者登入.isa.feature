Feature: 登入驗證

  Background:
    Given 準備一個使用者, with table:
      | >Alice.id | name  | email             | passwordHash | status |
      | <userId   | Alice | alice@example.com | password123   | ACTIVE |
    And 準備一個使用者, with table:
      | >Bob.id  | name | email           | passwordHash | status   |
      | <userId  | Bob  | bob@example.com | secret456 | INACTIVE |

  Rule: 成功登入

    Example: 使用正確的 email 和密碼登入
      When (No Actor) 使用者登入, call table:
        | >AliceToken | email             | password    |
        | <token      | alice@example.com | password123 |
      Then 使用者登入(200)回應, with table:
        | token    | userId    | name  | email             | message  |
        | $notnull | $Alice.id | Alice | alice@example.com | 登入成功 |
      And 應該存在一個使用者, with table:
        | userId    | lastLoginAt |
        | $Alice.id | $notnull    |

  Rule: 登入失敗 - 帳號或密碼錯誤

    Example: 使用錯誤的密碼登入
      When (No Actor) 使用者登入, call table:
        | email             | password      |
        | alice@example.com | wrongpassword |
      Then 使用者登入(401)回應, with table:
        | error          |
        | 帳號或密碼錯誤 |

    Example: 使用不存在的 email 登入
      When (No Actor) 使用者登入, call table:
        | email                | password    |
        | notexist@example.com | password123 |
      Then 使用者登入(401)回應, with table:
        | error          |
        | 帳號或密碼錯誤 |

  Rule: 登入失敗 - 已停用帳號

    Example: 使用已停用帳號登入
      When (No Actor) 使用者登入, call table:
        | email           | password  |
        | bob@example.com | secret456 |
      Then 使用者登入(401)回應, with table:
        | error          |
        | 帳號或密碼錯誤 |
