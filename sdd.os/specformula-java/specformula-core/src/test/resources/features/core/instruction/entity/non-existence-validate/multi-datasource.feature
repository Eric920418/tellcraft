@entity_non_existence_validate
Feature: EntityNonExistenceValidate - 多資料庫不存在驗證

  Rule: 多資料庫場景

    @h2 @postgresql @mysql @mssql
    Scenario: 多資料庫 - 跨資料庫驗證不存在
      Given entity-non-existence-validate primary 建立資料表 tb_User:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         |      |    |
        | name   | VARCHAR |    | Y       |         |      |    |
      And entity-non-existence-validate secondary 建立資料表 tb_Profile:
        | column  | type    | pk | notnull | default | auto | fk |
        | user_id | BIGINT  | Y  |         |         |      |    |
        | bio     | VARCHAR |    |         |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity | table   |
        | 用戶   | tb_User |
      And entity-non-existence-validate secondary entity_to_table_mapping:
        | entity   | table      |
        | 個人檔案 | tb_Profile |
      And entity-non-existence-validate 準備一個 用戶:
        | id | name  |
        | 1  | Alice |
        | 2  | Bob   |
      When entity-non-existence-validate 驗證 個人檔案 不存在:
        | userId |
        | 1      |
        | 2      |
      Then entity-non-existence-validate 通過

    @h2 @postgresql @mysql @mssql
    Scenario: 多資料庫 - 兩個資料庫都有資料，驗證第三個不存在
      Given entity-non-existence-validate primary 建立資料表 tb_User:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         |      |    |
        | name   | VARCHAR |    | Y       |         |      |    |
      And entity-non-existence-validate secondary 建立資料表 tb_Profile:
        | column  | type    | pk | notnull | default | auto | fk |
        | user_id | BIGINT  | Y  |         |         |      |    |
        | bio     | VARCHAR |    |         |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity | table   |
        | 用戶   | tb_User |
      And entity-non-existence-validate secondary entity_to_table_mapping:
        | entity   | table      |
        | 個人檔案 | tb_Profile |
      And entity-non-existence-validate 準備一個 用戶:
        | id | name  |
        | 1  | Alice |
      And entity-non-existence-validate 準備一個 個人檔案:
        | userId | bio       |
        | 1      | Alice Bio |
      When entity-non-existence-validate 驗證 用戶 不存在:
        | id | name |
        | 2  | Bob  |
      Then entity-non-existence-validate 通過
      When entity-non-existence-validate 驗證 個人檔案 不存在:
        | userId | bio     |
        | 2      | Bob Bio |
      Then entity-non-existence-validate 通過

  Rule: 多資料庫複合主鍵

    @h2 @postgresql @mysql @mssql
    Scenario: 多資料庫 - 複合主鍵跨庫驗證不存在
      Given entity-non-existence-validate primary 建立資料表 tb_Order:
        | column   | type    | pk | notnull | default | auto | fk |
        | id       | BIGINT  | Y  |         |         |      |    |
        | order_no | VARCHAR |    | Y       |         |      |    |
      And entity-non-existence-validate secondary 建立資料表 tb_OrderShipment:
        | column      | type      | pk | notnull | default | auto | fk |
        | order_id    | BIGINT    | Y  |         |         |      |    |
        | shipment_no | VARCHAR   | Y  |         |         |      |    |
        | shipped_at  | TIMESTAMP |    |         |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity | table    |
        | 訂單   | tb_Order |
      And entity-non-existence-validate secondary entity_to_table_mapping:
        | entity   | table            |
        | 訂單出貨 | tb_OrderShipment |
      And entity-non-existence-validate 準備一個 訂單:
        | id | orderNo |
        | 1  | ORD-001 |
      And entity-non-existence-validate 準備一個 訂單出貨:
        | orderId | shipmentNo | shippedAt           |
        | 1       | SHIP-001   | 2026-01-15T10:00:00 |
      When entity-non-existence-validate 驗證 訂單 不存在:
        | id | orderNo |
        | 2  | ORD-002 |
      Then entity-non-existence-validate 通過
      When entity-non-existence-validate 驗證 訂單出貨 不存在:
        | orderId | shipmentNo |
        | 1       | SHIP-002   |
        | 2       | SHIP-001   |
      Then entity-non-existence-validate 通過
