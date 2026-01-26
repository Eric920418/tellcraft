# Action: registerSkill
# Summary: 註冊技能
# Note: 此為系統管理功能，僅管理員可操作
Feature: 註冊技能

  Background:
    Given 準備一個用戶, with table:
      | id                                   | email            | plan     |
      | 550e8400-e29b-41d4-a716-446655440000 | admin@example.com | business |

  #------------------------------------------------------------
  Rule: 後置 - 成功註冊新技能
  #------------------------------------------------------------

    Example: 註冊新的 SEO 技能
      When 註冊技能, call table:
        | name | displayName | description          | minPlan | costLevel | timeoutMs |
        | seo  | SEO優化     | 網站SEO分析與優化建議 | pro     | medium    | 180000    |
      Then 註冊技能成功, with table:
        | skillId                              | name | status  |
        | 550e8400-e29b-41d4-a716-446655440100 | seo  | enabled |
      And 存在一個技能, with table:
        | id                                   | name | display_name | status  | min_plan |
        | 550e8400-e29b-41d4-a716-446655440100 | seo  | SEO優化      | enabled | pro      |

  #------------------------------------------------------------
  Rule: 前置 - 技能名稱不可重複
  #------------------------------------------------------------

    Example: 重複的技能名稱被拒絕
      Given 準備一個技能, with table:
        | id                                   | name     | display_name | status  |
        | 550e8400-e29b-41d4-a716-446655440101 | bdd-spec | 需求釐清     | enabled |
      When 註冊技能, call table:
        | name     | displayName | description |
        | bdd-spec | 新的釐清    | 重複名稱    |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 後置 - 自動生成描述的 embedding 向量
  #------------------------------------------------------------

    Example: 註冊時自動計算 embedding
      When 註冊技能, call table:
        | name  | displayName | description                |
        | uiux  | UI/UX設計   | 介面設計優化與使用者體驗改善 |
      Then 註冊技能成功, with table:
        | skillId                              | hasEmbedding |
        | 550e8400-e29b-41d4-a716-446655440102 | true         |
