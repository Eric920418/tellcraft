Feature: 登入驗證

  Background:
    Given 準備一個特務, with table:
      | >Alice.id | name  | email             | password    | status |
      | <agentId  | Alice | alice@company.com | password123 | ACTIVE |
    And 準備一個特務, with table:
      | >Bob.id  | name | email           | password  | status |
      | <agentId | Bob  | bob@company.com | secret456 | ACTIVE |
    And 準備一個特務, with table:
      | >Carol.id | name  | email             | password | status   |
      | <agentId  | Carol | carol@company.com | test789  | INACTIVE |

  Rule: 成功登入

    Example: 使用正確的 email 和密碼登入
      When (No Actor) 特務登入, call table:
        | >AliceToken | email             | password    |
        | <token      | alice@company.com | password123 |
      Then 特務登入(200)回應, with table:
        | token       | agentId   | name  | email             | message  |
        | &isNotNull | $Alice.id | Alice | alice@company.com | 登入成功 |
      And 應該存在一個特務, with table:
        | agent_id   | last_login_at |
        | $Alice.id | &isNotNull    |

    Example: 登入成功後可使用 Cookie 訪問需要認證的 API
      When (No Actor) 特務登入, call table:
        | >AliceToken | email             | password    |
        | <token      | alice@company.com | password123 |
      When (UID="$Alice.id") 打卡, call table:
        | agentId   | punchType | punchTime                    |
        | $Alice.id | IN        | @time("2025-11-07T09:00:00") |
      Then 打卡(200)回應, with table:
        | >recordId | agentId   | punchType | punchTime                          |
        | <recordId | $Alice.id | IN        | &sameTime(2025-11-07T09:00:00) |
      And 應該存在一個打卡記錄, with table:
        | record_id  | agent_id   | punch_type | punch_time                         | punch_date              |
        | $recordId | $Alice.id | IN        | &sameTime(2025-11-07T09:00:00) | &sameDay(2025-11-07) |

  Rule: 登入失敗 - 帳號或密碼錯誤

    Example: 使用錯誤的密碼登入
      When (No Actor) 特務登入, call table:
        | email             | password      |
        | alice@company.com | wrongpassword |
      Then 操作失敗
      And 特務登入(401)回應, with table:
        | error          |
        | 帳號或密碼錯誤 |
      And 應該存在一個特務, with table:
        | agent_id   | last_login_at |
        | $Alice.id | &isNull     |

    Example: 使用不存在的 email 登入
      When (No Actor) 特務登入, call table:
        | email                | password    |
        | notexist@company.com | password123 |
      Then 操作失敗
      And 特務登入(401)回應, with table:
        | error          |
        | 帳號或密碼錯誤 |

  Rule: 登入失敗 - 已停用帳號

    Example: 使用已停用帳號登入
      When (No Actor) 特務登入, call table:
        | email             | password |
        | carol@company.com | test789  |
      Then 操作失敗
      And 特務登入(401)回應, with table:
        | error          |
        | 帳號或密碼錯誤 |

  Rule: 輸入驗證

    Example: email 格式錯誤
      When (No Actor) 特務登入, call table:
        | email                | password    |
        | invalid-email-format | password123 |
      Then 操作失敗
      And 特務登入(400)回應, with table:
        | error          |
        | email 格式錯誤 |

    Example: 缺少必填欄位 - email
      When (No Actor) 特務登入, call table:
        | password    |
        | password123 |
      Then 操作失敗
      And 特務登入(400)回應, with table:
        | error            |
        | email 為必填欄位 |

    Example: 缺少必填欄位 - password
      When (No Actor) 特務登入, call table:
        | email             |
        | alice@company.com |
      Then 操作失敗
      And 特務登入(400)回應, with table:
        | error               |
        | password 為必填欄位 |
