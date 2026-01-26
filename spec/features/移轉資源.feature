# Action: transferResources
# Summary: 移轉資源
Feature: 移轉資源

  Background:
    Given 準備一個用戶, with table:
      | id                                   | email            | plan    | subscription_status |
      | 550e8400-e29b-41d4-a716-446655440000 | test@example.com | creator | active              |
    And 準備一個專案, with table:
      | id                                   | user_id                              | name     | status   | is_transferred |
      | 550e8400-e29b-41d4-a716-446655440001 | 550e8400-e29b-41d4-a716-446655440000 | 測試專案 | deployed | false          |

  #------------------------------------------------------------
  Rule: 後置 - 自助移轉：用戶輸入 API Key 後自動執行（決議 #12）
  #------------------------------------------------------------

    Example: 成功移轉資源到用戶帳號
      When 移轉資源, call table:
        | projectId                            | supabaseApiKey    | vercelToken       |
        | 550e8400-e29b-41d4-a716-446655440001 | sb_key_user_12345 | vercel_token_6789 |
      Then 移轉資源成功, with table:
        | projectId                            | transferred |
        | 550e8400-e29b-41d4-a716-446655440001 | true        |
      And 存在一個專案, with table:
        | id                                   | is_transferred |
        | 550e8400-e29b-41d4-a716-446655440001 | true           |

  #------------------------------------------------------------
  Rule: 前置 - 訂閱狀態必須為 active
  #------------------------------------------------------------

    Example: 暫停中的用戶無法移轉
      Given 準備一個用戶, with table:
        | id                                   | email              | plan    | subscription_status |
        | 550e8400-e29b-41d4-a716-446655440010 | suspended@example.com | creator | suspended           |
      And 準備一個專案, with table:
        | id                                   | user_id                              | name   | status   |
        | 550e8400-e29b-41d4-a716-446655440011 | 550e8400-e29b-41d4-a716-446655440010 | 專案2  | deployed |
      When 移轉資源, call table:
        | projectId                            | supabaseApiKey | vercelToken |
        | 550e8400-e29b-41d4-a716-446655440011 | sb_key_123     | vercel_456  |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 前置 - 已移轉的專案不可再次移轉
  #------------------------------------------------------------

    Example: 已移轉專案無法重複移轉
      Given 準備一個專案, with table:
        | id                                   | user_id                              | name     | is_transferred |
        | 550e8400-e29b-41d4-a716-446655440020 | 550e8400-e29b-41d4-a716-446655440000 | 已移轉案 | true           |
      When 移轉資源, call table:
        | projectId                            | supabaseApiKey | vercelToken |
        | 550e8400-e29b-41d4-a716-446655440020 | new_key        | new_token   |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 前置 - API Key 必須有效
  #------------------------------------------------------------

    Example: 無效的 API Key 被拒絕
      When 移轉資源, call table:
        | projectId                            | supabaseApiKey | vercelToken   |
        | 550e8400-e29b-41d4-a716-446655440001 | invalid_key    | invalid_token |
      Then 操作失敗
