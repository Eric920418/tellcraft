# Action: confirmTaskPlan
# Summary: 確認計劃
Feature: 確認計劃

  Background:
    Given 準備一個用戶, with table:
      | id                                   | email            | plan |
      | 550e8400-e29b-41d4-a716-446655440000 | test@example.com | pro  |
    And 準備一個任務, with table:
      | id                                   | user_id                              | status           | goal           |
      | 550e8400-e29b-41d4-a716-446655440200 | 550e8400-e29b-41d4-a716-446655440000 | pending_approval | 優化 SEO 效能  |

  #------------------------------------------------------------
  Rule: 前置 - 任務狀態必須為 pending_approval
  #------------------------------------------------------------

    Example: 成功確認執行計劃
      When 確認計劃, call table:
        | taskId                               | approved |
        | 550e8400-e29b-41d4-a716-446655440200 | true     |
      Then 確認計劃成功, with table:
        | taskId                               | status    |
        | 550e8400-e29b-41d4-a716-446655440200 | executing |
      And 存在一個任務, with table:
        | id                                   | status    |
        | 550e8400-e29b-41d4-a716-446655440200 | executing |

    Example: 已在執行中的任務無法再確認
      Given 準備一個任務, with table:
        | id                                   | user_id                              | status    |
        | 550e8400-e29b-41d4-a716-446655440201 | 550e8400-e29b-41d4-a716-446655440000 | executing |
      When 確認計劃, call table:
        | taskId                               | approved |
        | 550e8400-e29b-41d4-a716-446655440201 | true     |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 後置 - 拒絕計劃時任務取消
  #------------------------------------------------------------

    Example: 用戶拒絕計劃
      When 確認計劃, call table:
        | taskId                               | approved |
        | 550e8400-e29b-41d4-a716-446655440200 | false    |
      Then 確認計劃成功, with table:
        | taskId                               | status    |
        | 550e8400-e29b-41d4-a716-446655440200 | cancelled |

  #------------------------------------------------------------
  Rule: 前置 - 僅任務擁有者可確認
  #------------------------------------------------------------

    Example: 非擁有者無法確認
      Given 準備一個用戶, with table:
        | id                                   | email             | plan |
        | 550e8400-e29b-41d4-a716-446655440010 | other@example.com | pro  |
      When 確認計劃, call table:
        | taskId                               | approved | requestUserId                        |
        | 550e8400-e29b-41d4-a716-446655440200 | true     | 550e8400-e29b-41d4-a716-446655440010 |
      Then 操作失敗
