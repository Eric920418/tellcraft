@entity_setup
Feature: EntitySetup - 單一 DataSource
  測試單一 DataSource 環境下的資料表建立與資料準備。
  包含單表和多表場景，以及各種 SQL 資料類型。

  # ==================== 單一資料表 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: 單表 - 基本欄位類型（BIGINT, VARCHAR）
    Given entity-setup primary 建立資料表 tb_Employee:
      | column | type    | pk | notnull | default | auto | fk |
      | id     | BIGINT  | Y  |         |         |      |    |
      | name   | VARCHAR |    | Y       |         |      |    |
      | email  | VARCHAR |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table       |
      | 員工   | tb_Employee |
    When entity-setup 準備一個 員工:
      | id | name  | email             |
      | 1  | Alice | alice@example.com |
    Then entity-setup tb_Employee 資料表應有資料:
      | id | name  | email             |
      | 1  | Alice | alice@example.com |

  @h2 @postgresql @mysql @mssql
  Scenario: 單表 - 數值類型（INT, DECIMAL, DOUBLE）
    Given entity-setup primary 建立資料表 tb_Product:
      | column   | type          | pk | notnull | default | auto | fk |
      | id       | BIGINT        | Y  |         |         |      |    |
      | quantity | INT           |    |         |         |      |    |
      | price    | DECIMAL(10,2) |    |         |         |      |    |
      | weight   | DOUBLE        |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table      |
      | 商品   | tb_Product |
    When entity-setup 準備一個 商品:
      | id | quantity | price  | weight |
      | 1  | 100      | 299.99 | 1.5    |
    Then entity-setup tb_Product 資料表應有資料:
      | id | quantity | price  | weight |
      | 1  | 100      | 299.99 | 1.5    |

  @h2 @postgresql @mysql @mssql
  Scenario: 單表 - 日期時間類型（DATE, TIMESTAMP）
    Given entity-setup primary 建立資料表 tb_Event:
      | column     | type      | pk | notnull | default | auto | fk |
      | id         | BIGINT    | Y  |         |         |      |    |
      | event_date | DATE      |    |         |         |      |    |
      | created_at | TIMESTAMP |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table    |
      | 事件   | tb_Event |
    When entity-setup 準備一個 事件:
      | id | eventDate  | createdAt           |
      | 1  | 2026-01-15 | 2026-01-15T10:30:00 |
    Then entity-setup tb_Event 資料表應有資料:
      | id | event_date | created_at          |
      | 1  | 2026-01-15 | 2026-01-15T10:30:00 |

  @h2 @postgresql @mysql
  Scenario: 單表 - 布林類型（BOOLEAN）
    Given entity-setup primary 建立資料表 tb_Setting:
      | column    | type    | pk | notnull | default | auto | fk |
      | id        | BIGINT  | Y  |         |         |      |    |
      | is_active | BOOLEAN |    |         |         |      |    |
      | is_admin  | BOOLEAN |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table      |
      | 設定   | tb_Setting |
    When entity-setup 準備一個 設定:
      | id | isActive | isAdmin |
      | 1  | true     | false   |
    Then entity-setup tb_Setting 資料表應有資料:
      | id | is_active | is_admin |
      | 1  | true      | false    |

  @mssql
  Scenario: 單表 - 布林類型（BIT for MSSQL）
    Given entity-setup primary 建立資料表 tb_Setting:
      | column    | type   | pk | notnull | default | auto | fk |
      | id        | BIGINT | Y  |         |         |      |    |
      | is_active | BIT    |    |         |         |      |    |
      | is_admin  | BIT    |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table      |
      | 設定   | tb_Setting |
    When entity-setup 準備一個 設定:
      | id | isActive | isAdmin |
      | 1  | 1        | 0       |
    Then entity-setup tb_Setting 資料表應有資料:
      | id | is_active | is_admin |
      | 1  | 1         | 0        |

  @h2 @postgresql @mysql @mssql
  Scenario: 單表 - 自動遞增主鍵
    Given entity-setup primary 建立資料表 tb_Category:
      | column | type    | pk | notnull | default | auto | fk |
      | id     | BIGINT  | Y  |         |         | Y    |    |
      | name   | VARCHAR |    | Y       |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table       |
      | 分類   | tb_Category |
    When entity-setup 準備一個 分類:
      | name     |
      | 電子產品 |
    Then entity-setup tb_Category 資料表應有資料:
      | name     |
      | 電子產品 |

  @h2 @postgresql @mysql
  Scenario: 單表 - 文字類型（TEXT）
    Given entity-setup primary 建立資料表 tb_Article:
      | column  | type    | pk | notnull | default | auto | fk |
      | id      | BIGINT  | Y  |         |         |      |    |
      | title   | VARCHAR |    | Y       |         |      |    |
      | content | TEXT    |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table      |
      | 文章   | tb_Article |
    When entity-setup 準備一個 文章:
      | id | title    | content                    |
      | 1  | 測試標題 | 這是一段很長的文章內容... |
    Then entity-setup tb_Article 資料表應有資料:
      | id | title    | content                    |
      | 1  | 測試標題 | 這是一段很長的文章內容... |

  @mssql
  Scenario: 單表 - 文字類型（NVARCHAR MAX for MSSQL）
    Given entity-setup primary 建立資料表 tb_Article:
      | column  | type          | pk | notnull | default | auto | fk |
      | id      | BIGINT        | Y  |         |         |      |    |
      | title   | NVARCHAR(255) |    | Y       |         |      |    |
      | content | NVARCHAR(MAX) |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table      |
      | 文章   | tb_Article |
    When entity-setup 準備一個 文章:
      | id | title    | content                    |
      | 1  | 測試標題 | 這是一段很長的文章內容... |
    Then entity-setup tb_Article 資料表應有資料:
      | id | title    | content                    |
      | 1  | 測試標題 | 這是一段很長的文章內容... |

  @h2 @postgresql @mysql @mssql
  Scenario: 單表 - DEFAULT 預設值
    Given entity-setup primary 建立資料表 tb_Config:
      | column | type    | pk | notnull | default     | auto | fk |
      | id     | BIGINT  | Y  |         |             |      |    |
      | name   | VARCHAR |    | Y       |             |      |    |
      | status | VARCHAR |    |         | 'active'    |      |    |
      | count  | INT     |    |         | 0           |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table     |
      | 設定檔 | tb_Config |
    When entity-setup 準備一個 設定檔:
      | id | name   |
      | 1  | 測試用 |
    Then entity-setup tb_Config 資料表應有資料:
      | id | name   | status | count |
      | 1  | 測試用 | active | 0     |

  # ==================== 多筆資料插入 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: 單表 - 多筆資料插入
    Given entity-setup primary 建立資料表 tb_Employee:
      | column | type    | pk | notnull | default | auto | fk |
      | id     | BIGINT  | Y  |         |         |      |    |
      | name   | VARCHAR |    | Y       |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table       |
      | 員工   | tb_Employee |
    When entity-setup 準備一個 員工:
      | id | name  |
      | 1  | Alice |
      | 2  | Bob   |
      | 3  | Carol |
    Then entity-setup tb_Employee 資料表應有資料:
      | id | name  |
      | 1  | Alice |
      | 2  | Bob   |
      | 3  | Carol |

  # ==================== 多資料表 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: 多表 - 無外鍵關聯
    Given entity-setup primary 建立資料表 tb_Department:
      | column | type    | pk | notnull | default | auto | fk |
      | id     | BIGINT  | Y  |         |         |      |    |
      | name   | VARCHAR |    | Y       |         |      |    |
    And entity-setup primary 建立資料表 tb_Location:
      | column  | type    | pk | notnull | default | auto | fk |
      | id      | BIGINT  | Y  |         |         |      |    |
      | address | VARCHAR |    | Y       |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table         |
      | 部門   | tb_Department |
      | 地點   | tb_Location   |
    When entity-setup 準備一個 部門:
      | id | name   |
      | 1  | 研發部 |
    And entity-setup 準備一個 地點:
      | id | address      |
      | 1  | 台北市信義區 |
    Then entity-setup tb_Department 資料表應有資料:
      | id | name   |
      | 1  | 研發部 |
    And entity-setup tb_Location 資料表應有資料:
      | id | address      |
      | 1  | 台北市信義區 |

  @h2 @postgresql @mysql @mssql
  Scenario: 多表 - 有外鍵關聯
    Given entity-setup primary 建立資料表 tb_Team:
      | column    | type    | pk | notnull | default | auto | fk |
      | id        | BIGINT  | Y  |         |         | Y    |    |
      | team_name | VARCHAR |    | Y       |         |      |    |
    And entity-setup primary 建立資料表 tb_Member:
      | column      | type    | pk | notnull | default | auto | fk         |
      | id          | BIGINT  | Y  |         |         | Y    |            |
      | team_id     | BIGINT  |    |         |         |      | tb_Team.id |
      | member_name | VARCHAR |    | Y       |         |      |            |
    And entity-setup primary entity_to_table_mapping:
      | entity | table     |
      | 團隊   | tb_Team   |
      | 成員   | tb_Member |
    When entity-setup 準備一個 團隊:
      | teamName |
      | A Team   |
    And entity-setup 準備一個 成員:
      | teamId | memberName |
      | 1      | John       |
    Then entity-setup tb_Team 資料表應有資料:
      | team_name |
      | A Team    |
    And entity-setup tb_Member 資料表應有資料:
      | team_id | member_name |
      | 1       | John        |

  @h2 @postgresql @mysql @mssql
  Scenario: 多表 - 複合資料類型組合
    Given entity-setup primary 建立資料表 tb_Order:
      | column       | type          | pk | notnull | default | auto | fk |
      | id           | BIGINT        | Y  |         |         | Y    |    |
      | order_no     | VARCHAR       |    | Y       |         |      |    |
      | total_amount | DECIMAL(12,2) |    |         |         |      |    |
      | order_date   | DATE          |    |         |         |      |    |
      | created_at   | TIMESTAMP     |    |         |         |      |    |
    And entity-setup primary 建立資料表 tb_OrderItem:
      | column       | type          | pk | notnull | default | auto | fk          |
      | id           | BIGINT        | Y  |         |         | Y    |             |
      | order_id     | BIGINT        |    |         |         |      | tb_Order.id |
      | product_name | VARCHAR       |    | Y       |         |      |             |
      | quantity     | INT           |    |         |         |      |             |
      | unit_price   | DECIMAL(10,2) |    |         |         |      |             |
    And entity-setup primary entity_to_table_mapping:
      | entity   | table        |
      | 訂單     | tb_Order     |
      | 訂單明細 | tb_OrderItem |
    When entity-setup 準備一個 訂單:
      | orderNo | totalAmount | orderDate  | createdAt           |
      | ORD-001 | 1500.00     | 2026-01-20 | 2026-01-20T09:00:00 |
    And entity-setup 準備一個 訂單明細:
      | orderId | productName | quantity | unitPrice |
      | 1       | 筆記型電腦  | 1        | 1200.00   |
      | 1       | 滑鼠        | 2        | 150.00    |
    Then entity-setup tb_Order 資料表應有資料:
      | order_no | total_amount | order_date |
      | ORD-001  | 1500.00      | 2026-01-20 |
    And entity-setup tb_OrderItem 資料表應有資料:
      | order_id | product_name | quantity | unit_price |
      | 1        | 筆記型電腦   | 1        | 1200.00    |
      | 1        | 滑鼠         | 2        | 150.00     |

  # ==================== 欄位名稱轉換 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: camelCase 欄位自動轉換為 snake_case
    Given entity-setup primary 建立資料表 tb_UserProfile:
      | column       | type      | pk | notnull | default | auto | fk |
      | id           | BIGINT    | Y  |         |         |      |    |
      | first_name   | VARCHAR   |    |         |         |      |    |
      | last_name    | VARCHAR   |    |         |         |      |    |
      | phone_number | VARCHAR   |    |         |         |      |    |
      | created_by   | BIGINT    |    |         |         |      |    |
      | updated_at   | TIMESTAMP |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity   | table          |
      | 用戶資料 | tb_UserProfile |
    When entity-setup 準備一個 用戶資料:
      | id | firstName | lastName | phoneNumber  | createdBy | updatedAt           |
      | 1  | John      | Doe      | 0912-345-678 | 999       | 2026-01-15T10:00:00 |
    Then entity-setup tb_UserProfile 資料表應有資料:
      | id | first_name | last_name | phone_number | created_by | updated_at          |
      | 1  | John       | Doe       | 0912-345-678 | 999        | 2026-01-15T10:00:00 |

  # ==================== 空值處理 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: 空字串欄位應跳過不插入
    Given entity-setup primary 建立資料表 tb_Contact:
      | column | type    | pk | notnull | default | auto | fk |
      | id     | BIGINT  | Y  |         |         |      |    |
      | name   | VARCHAR |    | Y       |         |      |    |
      | phone  | VARCHAR |    |         |         |      |    |
      | email  | VARCHAR |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table      |
      | 聯絡人 | tb_Contact |
    When entity-setup 準備一個 聯絡人:
      | id | name  | phone        | email |
      | 1  | Alice | 0912-345-678 |       |
    Then entity-setup tb_Contact 資料表應有資料:
      | id | name  | phone        | email   |
      | 1  | Alice | 0912-345-678 | &isNull |
