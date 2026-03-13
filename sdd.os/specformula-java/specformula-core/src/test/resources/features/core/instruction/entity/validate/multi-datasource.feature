@entity_validate
Feature: EntityValidate - 多資料庫
  測試多資料庫環境下的 Entity 資料驗證功能。
  包含跨資料庫建立、驗證及複合主鍵場景。

  # ==================== 多資料庫分別驗證 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: 多資料庫 - 分別建立與驗證
    Given entity-validate primary 建立資料表 tb_Order:
      | column   | type          | pk | notnull | default | auto | fk |
      | id       | BIGINT        | Y  |         |         |      |    |
      | order_no | VARCHAR       |    | Y       |         |      |    |
      | amount   | DECIMAL(10,2) |    |         |         |      |    |
    And entity-validate secondary 建立資料表 tb_Inventory:
      | column   | type    | pk | notnull | default | auto | fk |
      | id       | BIGINT  | Y  |         |         |      |    |
      | sku      | VARCHAR |    | Y       |         |      |    |
      | quantity | INT     |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table    |
      | 訂單   | tb_Order |
    And entity-validate secondary entity_to_table_mapping:
      | entity | table        |
      | 庫存   | tb_Inventory |
    And entity-validate 準備一個 訂單:
      | id | orderNo | amount  |
      | 1  | ORD-001 | 1500.00 |
    And entity-validate 準備一個 庫存:
      | id | sku     | quantity |
      | 1  | SKU-001 | 100      |
    When entity-validate 驗證 訂單 資料:
      | id | orderNo | amount  |
      | 1  | ORD-001 | 1500.00 |
    Then entity-validate 通過
    When entity-validate 驗證 庫存 資料:
      | id | sku     | quantity |
      | 1  | SKU-001 | 100      |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: 多資料庫 - 多筆資料分別驗證
    Given entity-validate primary 建立資料表 tb_User:
      | column | type    | pk | notnull | default | auto | fk |
      | id     | BIGINT  | Y  |         |         |      |    |
      | name   | VARCHAR |    | Y       |         |      |    |
    And entity-validate secondary 建立資料表 tb_Profile:
      | column  | type    | pk | notnull | default | auto | fk |
      | id      | BIGINT  | Y  |         |         |      |    |
      | user_id | BIGINT  |    | Y       |         |      |    |
      | bio     | VARCHAR |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table   |
      | 用戶   | tb_User |
    And entity-validate secondary entity_to_table_mapping:
      | entity   | table      |
      | 個人檔案 | tb_Profile |
    And entity-validate 準備一個 用戶:
      | id | name  |
      | 1  | Alice |
      | 2  | Bob   |
    And entity-validate 準備一個 個人檔案:
      | id | userId | bio       |
      | 1  | 1      | Alice Bio |
      | 2  | 2      | Bob Bio   |
    When entity-validate 驗證 用戶 資料:
      | id | name  |
      | 1  | Alice |
      | 2  | Bob   |
    Then entity-validate 通過
    When entity-validate 驗證 個人檔案 資料:
      | id | userId | bio       |
      | 1  | 1      | Alice Bio |
      | 2  | 2      | Bob Bio   |
    Then entity-validate 通過

  # ==================== 多資料庫複合主鍵 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: 多資料庫 - 複合主鍵跨庫驗證
    Given entity-validate primary 建立資料表 tb_Order:
      | column   | type    | pk | notnull | default | auto | fk |
      | id       | BIGINT  | Y  |         |         |      |    |
      | order_no | VARCHAR |    | Y       |         |      |    |
    And entity-validate secondary 建立資料表 tb_OrderShipment:
      | column      | type      | pk | notnull | default | auto | fk |
      | order_id    | BIGINT    | Y  |         |         |      |    |
      | shipment_no | VARCHAR   | Y  |         |         |      |    |
      | shipped_at  | TIMESTAMP |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table    |
      | 訂單   | tb_Order |
    And entity-validate secondary entity_to_table_mapping:
      | entity   | table            |
      | 訂單出貨 | tb_OrderShipment |
    And entity-validate 準備一個 訂單:
      | id | orderNo |
      | 1  | ORD-001 |
    And entity-validate 準備一個 訂單出貨:
      | orderId | shipmentNo | shippedAt           |
      | 1       | SHIP-001   | 2026-01-15T10:00:00 |
      | 1       | SHIP-002   | 2026-01-16T14:00:00 |
    When entity-validate 驗證 訂單 資料:
      | id | orderNo |
      | 1  | ORD-001 |
    Then entity-validate 通過
    When entity-validate 驗證 訂單出貨 資料:
      | orderId | shipmentNo | shippedAt           |
      | 1       | SHIP-001   | 2026-01-15T10:00:00 |
      | 1       | SHIP-002   | 2026-01-16T14:00:00 |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: 多資料庫 - 三欄位複合主鍵跨庫驗證
    Given entity-validate primary 建立資料表 tb_Warehouse:
      | column | type    | pk | notnull | default | auto | fk |
      | id     | BIGINT  | Y  |         |         |      |    |
      | name   | VARCHAR |    | Y       |         |      |    |
    And entity-validate secondary 建立資料表 tb_WarehouseStock:
      | column       | type    | pk | notnull | default | auto | fk |
      | warehouse_id | BIGINT  | Y  |         |         |      |    |
      | product_id   | BIGINT  | Y  |         |         |      |    |
      | batch_no     | VARCHAR | Y  |         |         |      |    |
      | quantity     | INT     |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table        |
      | 倉庫   | tb_Warehouse |
    And entity-validate secondary entity_to_table_mapping:
      | entity   | table             |
      | 倉庫庫存 | tb_WarehouseStock |
    And entity-validate 準備一個 倉庫:
      | id | name   |
      | 1  | 台北倉 |
      | 2  | 高雄倉 |
    And entity-validate 準備一個 倉庫庫存:
      | warehouseId | productId | batchNo  | quantity |
      | 1           | 101       | BATCH-01 | 100      |
      | 1           | 101       | BATCH-02 | 50       |
      | 2           | 101       | BATCH-01 | 200      |
    When entity-validate 驗證 倉庫 資料:
      | id | name   |
      | 1  | 台北倉 |
      | 2  | 高雄倉 |
    Then entity-validate 通過
    When entity-validate 驗證 倉庫庫存 資料:
      | warehouseId | productId | batchNo  | quantity |
      | 1           | 101       | BATCH-01 | 100      |
      | 1           | 101       | BATCH-02 | 50       |
      | 2           | 101       | BATCH-01 | 200      |
    Then entity-validate 通過
