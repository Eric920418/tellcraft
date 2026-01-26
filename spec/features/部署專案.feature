# Action: deployProject
# Summary: 部署專案
Feature: 部署專案

  Background:
    Given 準備一個用戶, with table:
      | id                                   | email            | plan |
      | 550e8400-e29b-41d4-a716-446655440000 | test@example.com | pro  |
    And 準備一個專案, with table:
      | id                                   | user_id                              | name     | status  |
      | 550e8400-e29b-41d4-a716-446655440001 | 550e8400-e29b-41d4-a716-446655440000 | 測試專案 | testing |
    And 準備一個Supabase組織, with table:
      | id      | name   | project_count | max_projects | is_primary |
      | org-001 | 主帳號 | 50            | 100          | true       |
      | org-002 | 備用1  | 10            | 100          | false      |

  #------------------------------------------------------------
  Rule: 後置 - 部署成功後專案狀態變為 deployed
  #------------------------------------------------------------

    Example: 成功部署專案
      When 部署專案, call table:
        | projectId                            |
        | 550e8400-e29b-41d4-a716-446655440001 |
      Then 部署專案成功, with table:
        | deploymentId                         | url                          |
        | 550e8400-e29b-41d4-a716-446655440002 | https://test-project.vercel.app |
      And 存在一個專案, with table:
        | id                                   | status   | supabase_org_id |
        | 550e8400-e29b-41d4-a716-446655440001 | deployed | org-001         |

  #------------------------------------------------------------
  Rule: 後置 - 主 Org 配額用盡時自動切換備用 Org（決議 #5）
  #------------------------------------------------------------

    Example: 主帳號配額用盡時使用備用帳號
      Given 準備一個Supabase組織, with table:
        | id      | name   | project_count | max_projects | is_primary |
        | org-003 | 滿帳號 | 100           | 100          | true       |
        | org-004 | 備用2  | 20            | 100          | false      |
      When 部署專案, call table:
        | projectId                            |
        | 550e8400-e29b-41d4-a716-446655440001 |
      Then 部署專案成功, with table:
        | deploymentId                         |
        | 550e8400-e29b-41d4-a716-446655440003 |
      And 存在一個專案, with table:
        | id                                   | supabase_org_id |
        | 550e8400-e29b-41d4-a716-446655440001 | org-004         |

  #------------------------------------------------------------
  Rule: 前置 - 專案狀態必須為 testing
  #------------------------------------------------------------

    Example: draft 狀態無法部署
      Given 準備一個專案, with table:
        | id                                   | user_id                              | name     | status |
        | 550e8400-e29b-41d4-a716-446655440010 | 550e8400-e29b-41d4-a716-446655440000 | 草稿專案 | draft  |
      When 部署專案, call table:
        | projectId                            |
        | 550e8400-e29b-41d4-a716-446655440010 |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 後置 - 所有 Org 配額用盡時通知營運團隊（決議：手動處理）
  #------------------------------------------------------------

    Example: 所有 Org 都滿時標記為 pending 並通知
      Given 準備一個Supabase組織, with table:
        | id      | name   | project_count | max_projects | is_primary |
        | org-100 | 滿帳號 | 100           | 100          | true       |
      And 準備一個Supabase組織, with table:
        | id      | name   | project_count | max_projects | is_primary |
        | org-101 | 備用滿 | 100           | 100          | false      |
      When 部署專案, call table:
        | projectId                            |
        | 550e8400-e29b-41d4-a716-446655440001 |
      Then 部署專案成功, with table:
        | deploymentId                         | status  |
        | 550e8400-e29b-41d4-a716-446655440099 | pending |
      And 存在一個部署記錄, with table:
        | id                                   | status  | waiting_for_capacity |
        | 550e8400-e29b-41d4-a716-446655440099 | pending | true                 |
