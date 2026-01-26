# Action: createTask
# Summary: 建立任務
Feature: 建立任務

  Background:
    Given 準備一個用戶, with table:
      | id                                   | email            | plan | subscription_status |
      | 550e8400-e29b-41d4-a716-446655440000 | test@example.com | pro  | active              |
    And 準備一個專案, with table:
      | id                                   | user_id                              | name     | status   |
      | 550e8400-e29b-41d4-a716-446655440001 | 550e8400-e29b-41d4-a716-446655440000 | 測試專案 | deployed |
    And 準備一個技能, with table:
      | id                                   | name            | display_name | status  | min_plan |
      | 550e8400-e29b-41d4-a716-446655440100 | bdd-spec        | 需求釐清     | enabled | free     |
      | 550e8400-e29b-41d4-a716-446655440101 | code-generation | 程式碼生成   | enabled | free     |

  #------------------------------------------------------------
  Rule: 前置 - 用戶訂閱狀態必須為 active
  #------------------------------------------------------------

    Example: 訂閱中的用戶成功建立任務
      When 建立任務, call table:
        | projectId                            | goal                       |
        | 550e8400-e29b-41d4-a716-446655440001 | 新增到府服務功能，價格加200元 |
      Then 建立任務成功, with table:
        | taskId                               | status   |
        | 550e8400-e29b-41d4-a716-446655440200 | planning |
      And 存在一個任務, with table:
        | id                                   | project_id                           | status   |
        | 550e8400-e29b-41d4-a716-446655440200 | 550e8400-e29b-41d4-a716-446655440001 | planning |

    Example: 暫停中的用戶無法建立任務
      Given 準備一個用戶, with table:
        | id                                   | email                 | plan | subscription_status |
        | 550e8400-e29b-41d4-a716-446655440002 | suspended@example.com | pro  | suspended           |
      When 建立任務, call table:
        | userId                               | goal         |
        | 550e8400-e29b-41d4-a716-446655440002 | 任何目標     |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 後置 - 系統自動規劃執行步驟（LLM Planning）
  #------------------------------------------------------------

    Example: 系統根據目標自動生成執行計劃
      When 建立任務, call table:
        | projectId                            | goal                   |
        | 550e8400-e29b-41d4-a716-446655440001 | 優化網站的 SEO 和效能   |
      Then 建立任務成功, with table:
        | taskId                               | status            | stepCount |
        | 550e8400-e29b-41d4-a716-446655440201 | pending_approval  | 2         |

  #------------------------------------------------------------
  Rule: 後置 - 計算任務優先級（決議 #27：plan + task_type 混合）
  #------------------------------------------------------------

    Example: Pro 用戶的任務優先級較高
      When 建立任務, call table:
        | projectId                            | goal         |
        | 550e8400-e29b-41d4-a716-446655440001 | 迭代修改功能 |
      Then 建立任務成功, with table:
        | taskId                               | calculatedPriority |
        | 550e8400-e29b-41d4-a716-446655440202 | 30                 |

  #------------------------------------------------------------
  Rule: 前置 - 任務屬於專案（決議 #22）
  #------------------------------------------------------------

    Example: 不存在的專案無法建立任務
      When 建立任務, call table:
        | projectId                            | goal     |
        | 550e8400-e29b-41d4-a716-446655440999 | 任何目標 |
      Then 操作失敗
