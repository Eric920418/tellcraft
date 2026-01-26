# Action: cancelTask
# Summary: 取消任務
Feature: 取消任務

  Background:
    Given 準備一個用戶, with table:
      | id                                   | email            | plan |
      | 550e8400-e29b-41d4-a716-446655440000 | test@example.com | pro  |
    And 準備一個任務, with table:
      | id                                   | user_id                              | status    |
      | 550e8400-e29b-41d4-a716-446655440200 | 550e8400-e29b-41d4-a716-446655440000 | executing |
    And 準備一個任務步驟, with table:
      | id                                   | task_id                              | step_number | status  |
      | 550e8400-e29b-41d4-a716-446655440300 | 550e8400-e29b-41d4-a716-446655440200 | 1           | success |
      | 550e8400-e29b-41d4-a716-446655440301 | 550e8400-e29b-41d4-a716-446655440200 | 2           | running |

  #------------------------------------------------------------
  Rule: 後置 - 取消任務，保留已完成步驟（決議 #23）
  #------------------------------------------------------------

    Example: 成功取消執行中的任務
      When 取消任務, call table:
        | taskId                               |
        | 550e8400-e29b-41d4-a716-446655440200 |
      Then 取消任務成功, with table:
        | taskId                               | status    |
        | 550e8400-e29b-41d4-a716-446655440200 | cancelled |
      And 存在一個任務步驟, with table:
        | id                                   | status  |
        | 550e8400-e29b-41d4-a716-446655440300 | success |
      And 存在一個任務步驟, with table:
        | id                                   | status    |
        | 550e8400-e29b-41d4-a716-446655440301 | cancelled |

  #------------------------------------------------------------
  Rule: 前置 - 已完成或已取消的任務無法再取消
  #------------------------------------------------------------

    Example: 已完成的任務無法取消
      Given 準備一個任務, with table:
        | id                                   | user_id                              | status    |
        | 550e8400-e29b-41d4-a716-446655440202 | 550e8400-e29b-41d4-a716-446655440000 | completed |
      When 取消任務, call table:
        | taskId                               |
        | 550e8400-e29b-41d4-a716-446655440202 |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 後置 - 取消時發送通知（決議 #28）
  #------------------------------------------------------------

    Example: 取消任務後發送通知
      When 取消任務, call table:
        | taskId                               |
        | 550e8400-e29b-41d4-a716-446655440200 |
      Then 取消任務成功, with table:
        | taskId                               |
        | 550e8400-e29b-41d4-a716-446655440200 |
      And 存在一個通知, with table:
        | user_id                              | type           | task_id                              |
        | 550e8400-e29b-41d4-a716-446655440000 | task_cancelled | 550e8400-e29b-41d4-a716-446655440200 |
