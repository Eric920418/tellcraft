# Action: updateProject
# Summary: 迭代修改
Feature: 迭代修改

  Background:
    Given 準備一個用戶, with table:
      | id                                   | email            | plan |
      | 550e8400-e29b-41d4-a716-446655440000 | test@example.com | pro  |
    And 準備一個專案, with table:
      | id                                   | user_id                              | name     | status   |
      | 550e8400-e29b-41d4-a716-446655440001 | 550e8400-e29b-41d4-a716-446655440000 | 測試專案 | deployed |

  #------------------------------------------------------------
  Rule: 前置 - 專案狀態必須為 deployed 或 failed
  #------------------------------------------------------------

    Example: 已部署專案進行迭代修改
      When 迭代修改, call table:
        | projectId                            | changes                        |
        | 550e8400-e29b-41d4-a716-446655440001 | 新增到府服務選項，價格加 200 元 |
      Then 迭代修改成功, with table:
        | projectId                            | status     |
        | 550e8400-e29b-41d4-a716-446655440001 | generating |
      And 存在一個專案, with table:
        | id                                   | status     |
        | 550e8400-e29b-41d4-a716-446655440001 | generating |

    Example: 失敗專案修改需求後重新嘗試（決議：failed 可透過迭代修改重試）
      Given 準備一個專案, with table:
        | id                                   | user_id                              | name       | status |
        | 550e8400-e29b-41d4-a716-446655440030 | 550e8400-e29b-41d4-a716-446655440000 | 失敗專案   | failed |
      When 迭代修改, call table:
        | projectId                            | changes              |
        | 550e8400-e29b-41d4-a716-446655440030 | 簡化功能，移除複雜邏輯 |
      Then 迭代修改成功, with table:
        | projectId                            | status     |
        | 550e8400-e29b-41d4-a716-446655440030 | generating |
      And 存在一個專案, with table:
        | id                                   | status     |
        | 550e8400-e29b-41d4-a716-446655440030 | generating |

    Example: draft 狀態無法迭代修改
      Given 準備一個專案, with table:
        | id                                   | user_id                              | name     | status |
        | 550e8400-e29b-41d4-a716-446655440031 | 550e8400-e29b-41d4-a716-446655440000 | 草稿專案 | draft  |
      When 迭代修改, call table:
        | projectId                            | changes    |
        | 550e8400-e29b-41d4-a716-446655440031 | 任何變更   |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 後置 - 破壞性變更前自動備份資料（決議 #6）
  #------------------------------------------------------------

    Example: 刪除欄位時先備份
      When 迭代修改, call table:
        | projectId                            | changes                  | isDestructive |
        | 550e8400-e29b-41d4-a716-446655440001 | 移除 pet_type 欄位       | true          |
      Then 迭代修改成功, with table:
        | projectId                            | backupCreated |
        | 550e8400-e29b-41d4-a716-446655440001 | true          |
      And 存在一個生成記錄, with table:
        | project_id                           | backup_sql_url            |
        | 550e8400-e29b-41d4-a716-446655440001 | https://r2.example.com/backup-001.sql |

  #------------------------------------------------------------
  Rule: 後置 - 嘗試自動轉換資料類型，失敗才警告（決議 #6）
  #------------------------------------------------------------

    Example: 類型轉換成功
      When 迭代修改, call table:
        | projectId                            | changes                      | isDestructive |
        | 550e8400-e29b-41d4-a716-446655440001 | 將 price 從 INT 改為 VARCHAR | true          |
      Then 迭代修改成功, with table:
        | projectId                            | dataConverted |
        | 550e8400-e29b-41d4-a716-446655440001 | true          |

    Example: 類型轉換失敗需用戶確認
      When 迭代修改, call table:
        | projectId                            | changes                        | isDestructive |
        | 550e8400-e29b-41d4-a716-446655440001 | 將 email 從 VARCHAR 改為 INT   | true          |
      Then 操作失敗
