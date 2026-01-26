# Action: createProject
# Summary: 建立專案
Feature: 建立專案

  Background:
    Given 準備一個用戶, with table:
      | id                                   | email           | plan | subscription_status |
      | 550e8400-e29b-41d4-a716-446655440000 | test@example.com | free | active              |

  #------------------------------------------------------------
  Rule: 前置 - 用戶訂閱狀態必須為 active
  #------------------------------------------------------------

    Example: 訂閱中的用戶成功建立專案
      When 建立專案, call table:
        | userId                               | name       | description      |
        | 550e8400-e29b-41d4-a716-446655440000 | 我的網站   | 寵物美容預約系統 |
      Then 建立專案成功, with table:
        | projectId                            | status |
        | 550e8400-e29b-41d4-a716-446655440001 | draft  |
      And 存在一個專案, with table:
        | id                                   | user_id                              | name     | status |
        | 550e8400-e29b-41d4-a716-446655440001 | 550e8400-e29b-41d4-a716-446655440000 | 我的網站 | draft  |

    Example: 暫停中的用戶無法建立專案
      Given 準備一個用戶, with table:
        | id                                   | email                 | plan | subscription_status |
        | 550e8400-e29b-41d4-a716-446655440002 | suspended@example.com | free | suspended           |
      When 建立專案, call table:
        | userId                               | name     |
        | 550e8400-e29b-41d4-a716-446655440002 | 測試專案 |
      Then 操作失敗

    Example: 已取消的用戶無法建立專案（決議：cancelled 完全無法使用平台）
      Given 準備一個用戶, with table:
        | id                                   | email                 | plan | subscription_status |
        | 550e8400-e29b-41d4-a716-446655440003 | cancelled@example.com | free | cancelled           |
      When 建立專案, call table:
        | userId                               | name     |
        | 550e8400-e29b-41d4-a716-446655440003 | 測試專案 |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 前置 - 專案數量不可超過方案上限
  #------------------------------------------------------------

    Example: 免費方案最多 1 個專案
      Given 準備一個專案, with table:
        | id                                   | user_id                              | name       | status |
        | 550e8400-e29b-41d4-a716-446655440010 | 550e8400-e29b-41d4-a716-446655440000 | 現有專案   | draft  |
      When 建立專案, call table:
        | userId                               | name       |
        | 550e8400-e29b-41d4-a716-446655440000 | 第二個專案 |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 後置 - 專案名稱重複時自動加後綴（決議：自動處理衝突）
  #------------------------------------------------------------

    Example: 名稱重複時自動加後綴
      Given 準備一個專案, with table:
        | id                                   | user_id                              | name     | status |
        | 550e8400-e29b-41d4-a716-446655440020 | 550e8400-e29b-41d4-a716-446655440000 | 我的網站 | draft  |
      When 建立專案, call table:
        | userId                               | name     |
        | 550e8400-e29b-41d4-a716-446655440000 | 我的網站 |
      Then 建立專案成功, with table:
        | projectId                            | status |
        | 550e8400-e29b-41d4-a716-446655440021 | draft  |
      And 存在一個專案, with table:
        | id                                   | name         |
        | 550e8400-e29b-41d4-a716-446655440021 | 我的網站 (2) |

    Example: 多次重複時後綴遞增
      Given 準備一個專案, with table:
        | id                                   | user_id                              | name         | status |
        | 550e8400-e29b-41d4-a716-446655440022 | 550e8400-e29b-41d4-a716-446655440000 | 我的網站     | draft  |
      And 準備一個專案, with table:
        | id                                   | user_id                              | name         | status |
        | 550e8400-e29b-41d4-a716-446655440023 | 550e8400-e29b-41d4-a716-446655440000 | 我的網站 (2) | draft  |
      When 建立專案, call table:
        | userId                               | name     |
        | 550e8400-e29b-41d4-a716-446655440000 | 我的網站 |
      Then 建立專案成功, with table:
        | projectId                            | status |
        | 550e8400-e29b-41d4-a716-446655440024 | draft  |
      And 存在一個專案, with table:
        | id                                   | name         |
        | 550e8400-e29b-41d4-a716-446655440024 | 我的網站 (3) |
