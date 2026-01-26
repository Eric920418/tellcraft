# Action: sendMessage
# Summary: 發送訊息
# Note: 對話次數於訂閱週期重置（與訂閱開始日期對齊，Free 用戶以註冊日期為週期起點）
Feature: 發送訊息

  Background:
    Given 準備一個用戶, with table:
      | id                                   | email            | plan | message_count_this_period | period_start_date |
      | 550e8400-e29b-41d4-a716-446655440000 | test@example.com | free | 0                         | 2026-01-15        |
    And 準備一個專案, with table:
      | id                                   | user_id                              | name     | status |
      | 550e8400-e29b-41d4-a716-446655440001 | 550e8400-e29b-41d4-a716-446655440000 | 測試專案 | draft  |
    And 準備一個對話, with table:
      | id                                   | project_id                           | messages |
      | 550e8400-e29b-41d4-a716-446655440002 | 550e8400-e29b-41d4-a716-446655440001 | []       |

  #------------------------------------------------------------
  Rule: 後置 - 每則用戶訊息消耗 1 次對話配額（決議 #7）
  #------------------------------------------------------------

    Example: 發送訊息後對話次數 +1
      When 發送訊息, call table:
        | conversationId                       | content                      |
        | 550e8400-e29b-41d4-a716-446655440002 | 我想做一個寵物美容預約網站   |
      Then 發送訊息成功, with table:
        | messageId                            |
        | 550e8400-e29b-41d4-a716-446655440003 |
      And 存在一個用戶, with table:
        | id                                   | message_count_this_period |
        | 550e8400-e29b-41d4-a716-446655440000 | 1                        |

  #------------------------------------------------------------
  Rule: 前置 - 對話次數不可超過方案上限
  #------------------------------------------------------------

    Example: 免費方案超過 50 次無法發送
      Given 準備一個用戶, with table:
        | id                                   | email             | plan | message_count_this_period |
        | 550e8400-e29b-41d4-a716-446655440010 | limit@example.com | free | 50                       |
      And 準備一個專案, with table:
        | id                                   | user_id                              | name     | status |
        | 550e8400-e29b-41d4-a716-446655440011 | 550e8400-e29b-41d4-a716-446655440010 | 測試專案 | draft  |
      And 準備一個對話, with table:
        | id                                   | project_id                           | messages |
        | 550e8400-e29b-41d4-a716-446655440012 | 550e8400-e29b-41d4-a716-446655440011 | []       |
      When 發送訊息, call table:
        | conversationId                       | content    |
        | 550e8400-e29b-41d4-a716-446655440012 | 再發一則   |
      Then 操作失敗
