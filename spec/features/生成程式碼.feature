# Action: generateCode
# Summary: 生成程式碼
Feature: 生成程式碼

  Background:
    Given 準備一個用戶, with table:
      | id                                   | email            | plan |
      | 550e8400-e29b-41d4-a716-446655440000 | test@example.com | pro  |
    And 準備一個專案, with table:
      | id                                   | user_id                              | name     | status |
      | 550e8400-e29b-41d4-a716-446655440001 | 550e8400-e29b-41d4-a716-446655440000 | 測試專案 | draft  |
    And 準備一個對話, with table:
      | id                                   | project_id                           | spec_complete |
      | 550e8400-e29b-41d4-a716-446655440010 | 550e8400-e29b-41d4-a716-446655440001 | true          |

  #------------------------------------------------------------
  Rule: 前置 - 必須有對話且 BDD Spec 已完成（決議：連續 2 輪無新問題）
  #------------------------------------------------------------

    Example: 沒有對話記錄時無法生成
      Given 準備一個專案, with table:
        | id                                   | user_id                              | name       | status |
        | 550e8400-e29b-41d4-a716-446655440050 | 550e8400-e29b-41d4-a716-446655440000 | 空白專案   | draft  |
      When 生成程式碼, call table:
        | projectId                            |
        | 550e8400-e29b-41d4-a716-446655440050 |
      Then 操作失敗

    Example: 釐清未完成時無法生成
      Given 準備一個對話, with table:
        | id                                   | project_id                           | spec_complete |
        | 550e8400-e29b-41d4-a716-446655440051 | 550e8400-e29b-41d4-a716-446655440001 | false         |
      When 生成程式碼, call table:
        | projectId                            |
        | 550e8400-e29b-41d4-a716-446655440001 |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 後置 - 生成成功後專案狀態變為 testing
  #------------------------------------------------------------

    Example: 成功生成程式碼
      When 生成程式碼, call table:
        | projectId                            |
        | 550e8400-e29b-41d4-a716-446655440001 |
      Then 生成程式碼成功, with table:
        | generationId                         | status  |
        | 550e8400-e29b-41d4-a716-446655440002 | success |
      And 存在一個專案, with table:
        | id                                   | status  |
        | 550e8400-e29b-41d4-a716-446655440001 | testing |
      And 存在一個生成記錄, with table:
        | id                                   | project_id                           | status  | attempt_count |
        | 550e8400-e29b-41d4-a716-446655440002 | 550e8400-e29b-41d4-a716-446655440001 | success | 1             |

  #------------------------------------------------------------
  Rule: 後置 - 自癒機制最多嘗試 3 次（決議 #4）
  #------------------------------------------------------------

    Example: 第一次失敗後自動重試
      Given 準備一個生成記錄, with table:
        | id                                   | project_id                           | status | attempt_count |
        | 550e8400-e29b-41d4-a716-446655440003 | 550e8400-e29b-41d4-a716-446655440001 | failed | 1             |
      When 生成程式碼, call table:
        | projectId                            |
        | 550e8400-e29b-41d4-a716-446655440001 |
      Then 生成程式碼成功, with table:
        | generationId                         | status  |
        | 550e8400-e29b-41d4-a716-446655440003 | success |
      And 存在一個生成記錄, with table:
        | id                                   | attempt_count |
        | 550e8400-e29b-41d4-a716-446655440003 | 2             |

  #------------------------------------------------------------
  Rule: 後置 - 3 次失敗後標記為 failed 並通知用戶（決議 #4）
  #------------------------------------------------------------

    Example: 連續 3 次失敗後停止並通知
      Given 準備一個生成記錄, with table:
        | id                                   | project_id                           | status | attempt_count |
        | 550e8400-e29b-41d4-a716-446655440004 | 550e8400-e29b-41d4-a716-446655440001 | failed | 3             |
      When 生成程式碼, call table:
        | projectId                            |
        | 550e8400-e29b-41d4-a716-446655440001 |
      Then 操作失敗
      And 存在一個專案, with table:
        | id                                   | status |
        | 550e8400-e29b-41d4-a716-446655440001 | failed |
