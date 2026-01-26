# Action: retryTask
# Summary: 重試任務
Feature: 重試任務

  Background:
    Given 準備一個用戶, with table:
      | id                                   | email            | plan |
      | 550e8400-e29b-41d4-a716-446655440000 | test@example.com | pro  |
    And 準備一個任務, with table:
      | id                                   | user_id                              | status | failed_step |
      | 550e8400-e29b-41d4-a716-446655440200 | 550e8400-e29b-41d4-a716-446655440000 | failed | 2           |
    And 準備一個任務步驟, with table:
      | id                                   | task_id                              | step_number | status  |
      | 550e8400-e29b-41d4-a716-446655440300 | 550e8400-e29b-41d4-a716-446655440200 | 1           | success |
      | 550e8400-e29b-41d4-a716-446655440301 | 550e8400-e29b-41d4-a716-446655440200 | 2           | failed  |

  #------------------------------------------------------------
  Rule: 後置 - 從失敗點重試，不重跑已完成步驟（決議 #23）
  #------------------------------------------------------------

    Example: 從失敗步驟開始重試
      When 重試任務, call table:
        | taskId                               |
        | 550e8400-e29b-41d4-a716-446655440200 |
      Then 重試任務成功, with table:
        | taskId                               | status    | currentStep |
        | 550e8400-e29b-41d4-a716-446655440200 | executing | 2           |
      And 存在一個任務步驟, with table:
        | id                                   | status  |
        | 550e8400-e29b-41d4-a716-446655440300 | success |
      And 存在一個任務步驟, with table:
        | id                                   | status  |
        | 550e8400-e29b-41d4-a716-446655440301 | running |

  #------------------------------------------------------------
  Rule: 前置 - 只有 failed 狀態的任務可重試
  #------------------------------------------------------------

    Example: 執行中的任務無法重試
      Given 準備一個任務, with table:
        | id                                   | user_id                              | status    |
        | 550e8400-e29b-41d4-a716-446655440201 | 550e8400-e29b-41d4-a716-446655440000 | executing |
      When 重試任務, call table:
        | taskId                               |
        | 550e8400-e29b-41d4-a716-446655440201 |
      Then 操作失敗

    Example: 已完成的任務無法重試
      Given 準備一個任務, with table:
        | id                                   | user_id                              | status    |
        | 550e8400-e29b-41d4-a716-446655440202 | 550e8400-e29b-41d4-a716-446655440000 | completed |
      When 重試任務, call table:
        | taskId                               |
        | 550e8400-e29b-41d4-a716-446655440202 |
      Then 操作失敗
