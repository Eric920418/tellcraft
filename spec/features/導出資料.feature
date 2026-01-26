# Action: exportData
# Summary: 導出資料
Feature: 導出資料

  Background:
    Given 準備一個用戶, with table:
      | id                                   | email            | plan    | subscription_status |
      | 550e8400-e29b-41d4-a716-446655440000 | test@example.com | creator | suspended           |
    And 準備一個專案, with table:
      | id                                   | user_id                              | name     | status   |
      | 550e8400-e29b-41d4-a716-446655440001 | 550e8400-e29b-41d4-a716-446655440000 | 測試專案 | deployed |

  #------------------------------------------------------------
  Rule: 後置 - 導出格式為 SQL dump（決議 #13）
  #------------------------------------------------------------

    Example: 成功導出資料為 SQL dump
      When 導出資料, call table:
        | projectId                            |
        | 550e8400-e29b-41d4-a716-446655440001 |
      Then 導出資料成功, with table:
        | downloadUrl                              | format   |
        | https://r2.example.com/export-001.sql    | sql_dump |

  #------------------------------------------------------------
  Rule: 前置 - 僅專案擁有者可導出
  #------------------------------------------------------------

    Example: 非擁有者無法導出
      Given 準備一個用戶, with table:
        | id                                   | email             | plan |
        | 550e8400-e29b-41d4-a716-446655440010 | other@example.com | free |
      When 導出資料, call table:
        | projectId                            | requestUserId                        |
        | 550e8400-e29b-41d4-a716-446655440001 | 550e8400-e29b-41d4-a716-446655440010 |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 前置 - 暫停期內可導出資料
  #------------------------------------------------------------

    Example: suspended 狀態可導出
      When 導出資料, call table:
        | projectId                            |
        | 550e8400-e29b-41d4-a716-446655440001 |
      Then 導出資料成功, with table:
        | downloadUrl                           |
        | https://r2.example.com/export-002.sql |
