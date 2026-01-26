# Action: cancelSubscription
# Summary: 取消訂閱
Feature: 取消訂閱

  Background:
    Given 準備一個用戶, with table:
      | id                                   | email            | plan    | subscription_status |
      | 550e8400-e29b-41d4-a716-446655440000 | test@example.com | creator | active              |
    And 準備一個專案, with table:
      | id                                   | user_id                              | name     | status   |
      | 550e8400-e29b-41d4-a716-446655440001 | 550e8400-e29b-41d4-a716-446655440000 | 測試專案 | deployed |

  #------------------------------------------------------------
  Rule: 後置 - 取消後訂閱狀態變為 suspended（決議 #8）
  #------------------------------------------------------------

    Example: 取消訂閱後進入 30 天暫停期
      When 取消訂閱, call table:
        | userId                               |
        | 550e8400-e29b-41d4-a716-446655440000 |
      Then 取消訂閱成功, with table:
        | userId                               | status    |
        | 550e8400-e29b-41d4-a716-446655440000 | suspended |
      And 存在一個用戶, with table:
        | id                                   | subscription_status | cancelled_at             |
        | 550e8400-e29b-41d4-a716-446655440000 | suspended           | 2026-01-22T00:00:00.000Z |

  #------------------------------------------------------------
  Rule: 後置 - 網站完全停用，顯示暫停頁（決議 #14）
  #------------------------------------------------------------

    Example: 取消後網站顯示暫停頁
      When 取消訂閱, call table:
        | userId                               |
        | 550e8400-e29b-41d4-a716-446655440000 |
      Then 取消訂閱成功, with table:
        | userId                               |
        | 550e8400-e29b-41d4-a716-446655440000 |
      And 存在一個專案, with table:
        | id                                   | status   |
        | 550e8400-e29b-41d4-a716-446655440001 | deployed |

  #------------------------------------------------------------
  Rule: 後置 - 暫停期內可重新訂閱恢復
  #------------------------------------------------------------

    Example: 暫停期內重新訂閱
      Given 準備一個用戶, with table:
        | id                                   | email              | plan    | subscription_status | cancelled_at             |
        | 550e8400-e29b-41d4-a716-446655440010 | suspended@example.com | creator | suspended           | 2026-01-10T00:00:00.000Z |
      When 取消訂閱, call table:
        | userId                               | action   |
        | 550e8400-e29b-41d4-a716-446655440010 | resubscribe |
      Then 取消訂閱成功, with table:
        | userId                               | status |
        | 550e8400-e29b-41d4-a716-446655440010 | active |
