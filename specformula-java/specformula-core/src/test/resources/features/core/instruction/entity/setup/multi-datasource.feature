@entity_setup
Feature: EntitySetup - 多 DataSource
  測試多個 DataSource 環境下的資料表建立與資料準備。
  包含跨 DataSource 的資料隔離和各種 SQL 資料類型。

  # ==================== 多 DataSource 基本場景 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: 兩個 DataSource 各自建立資料表
    Given entity-setup primary 建立資料表 tb_PrimaryUser:
      | column | type    | pk | notnull | default | auto | fk |
      | id     | BIGINT  | Y  |         |         |      |    |
      | name   | VARCHAR |    | Y       |         |      |    |
    And entity-setup secondary 建立資料表 tb_SecondaryUser:
      | column | type    | pk | notnull | default | auto | fk |
      | id     | BIGINT  | Y  |         |         |      |    |
      | name   | VARCHAR |    | Y       |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity   | table            |
      | 主要用戶 | tb_PrimaryUser   |
    And entity-setup secondary entity_to_table_mapping:
      | entity   | table            |
      | 次要用戶 | tb_SecondaryUser |
    When entity-setup 準備一個 主要用戶:
      | id | name  |
      | 1  | Alice |
    And entity-setup 準備一個 次要用戶:
      | id | name |
      | 1  | Bob  |
    Then entity-setup tb_PrimaryUser 資料表應有資料:
      | id | name  |
      | 1  | Alice |
    And entity-setup tb_SecondaryUser 資料表應有資料:
      | id | name |
      | 1  | Bob  |

  # ==================== 多 DataSource 各種資料類型 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: primary DataSource - 數值類型測試
    Given entity-setup primary 建立資料表 tb_NumericTest:
      | column      | type          | pk | notnull | default | auto | fk |
      | id          | BIGINT        | Y  |         |         |      |    |
      | int_val     | INT           |    |         |         |      |    |
      | decimal_val | DECIMAL(15,4) |    |         |         |      |    |
      | double_val  | DOUBLE        |    |         |         |      |    |
      | float_val   | FLOAT         |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity   | table          |
      | 數值測試 | tb_NumericTest |
    When entity-setup 準備一個 數值測試:
      | id | intVal  | decimalVal | doubleVal | floatVal |
      | 1  | 1234567 | 12345.6789 | 3.14159   | 2.718    |
    Then entity-setup tb_NumericTest 資料表應有資料:
      | id | int_val | decimal_val | double_val | float_val |
      | 1  | 1234567 | 12345.6789  | 3.14159    | 2.718     |

  @h2 @postgresql @mysql @mssql
  Scenario: secondary DataSource - 日期時間類型測試
    Given entity-setup secondary 建立資料表 tb_DateTimeTest:
      | column        | type      | pk | notnull | default | auto | fk |
      | id            | BIGINT    | Y  |         |         |      |    |
      | date_val      | DATE      |    |         |         |      |    |
      | timestamp_val | TIMESTAMP |    |         |         |      |    |
      | time_val      | TIME      |    |         |         |      |    |
    And entity-setup secondary entity_to_table_mapping:
      | entity       | table           |
      | 日期時間測試 | tb_DateTimeTest |
    When entity-setup 準備一個 日期時間測試:
      | id | dateVal    | timestampVal        | timeVal  |
      | 1  | 2026-06-15 | 2026-06-15T14:30:00 | 14:30:00 |
    Then entity-setup tb_DateTimeTest 資料表應有資料:
      | id | date_val   | timestamp_val       | time_val |
      | 1  | 2026-06-15 | 2026-06-15T14:30:00 | 14:30:00 |

  # ==================== 跨 DataSource 多表關聯場景 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: 跨 DataSource 獨立資料表操作
    Given entity-setup primary 建立資料表 tb_Customer:
      | column        | type    | pk | notnull | default | auto | fk |
      | id            | BIGINT  | Y  |         |         | Y    |    |
      | customer_name | VARCHAR |    | Y       |         |      |    |
      | phone         | VARCHAR |    |         |         |      |    |
    And entity-setup primary 建立資料表 tb_CustomerOrder:
      | column       | type          | pk | notnull | default | auto | fk             |
      | id           | BIGINT        | Y  |         |         | Y    |                |
      | customer_id  | BIGINT        |    |         |         |      | tb_Customer.id |
      | order_amount | DECIMAL(10,2) |    |         |         |      |                |
    And entity-setup secondary 建立資料表 tb_Supplier:
      | column        | type    | pk | notnull | default | auto | fk |
      | id            | BIGINT  | Y  |         |         | Y    |    |
      | supplier_name | VARCHAR |    | Y       |         |      |    |
      | contact       | VARCHAR |    |         |         |      |    |
    And entity-setup secondary 建立資料表 tb_SupplierProduct:
      | column       | type    | pk | notnull | default | auto | fk             |
      | id           | BIGINT  | Y  |         |         | Y    |                |
      | supplier_id  | BIGINT  |    |         |         |      | tb_Supplier.id |
      | product_name | VARCHAR |    | Y       |         |      |                |
    And entity-setup primary entity_to_table_mapping:
      | entity   | table            |
      | 客戶     | tb_Customer      |
      | 客戶訂單 | tb_CustomerOrder |
    And entity-setup secondary entity_to_table_mapping:
      | entity     | table              |
      | 供應商     | tb_Supplier        |
      | 供應商產品 | tb_SupplierProduct |
    When entity-setup 準備一個 客戶:
      | customerName | phone        |
      | 王大明       | 0912-111-111 |
    And entity-setup 準備一個 客戶訂單:
      | customerId | orderAmount |
      | 1          | 5000.00     |
    And entity-setup 準備一個 供應商:
      | supplierName | contact      |
      | ABC 供應商   | 0912-222-222 |
    And entity-setup 準備一個 供應商產品:
      | supplierId | productName |
      | 1          | 零件 A      |
    Then entity-setup tb_Customer 資料表應有資料:
      | customer_name | phone        |
      | 王大明        | 0912-111-111 |
    And entity-setup tb_CustomerOrder 資料表應有資料:
      | customer_id | order_amount |
      | 1           | 5000.00      |
    And entity-setup tb_Supplier 資料表應有資料:
      | supplier_name | contact      |
      | ABC 供應商    | 0912-222-222 |
    And entity-setup tb_SupplierProduct 資料表應有資料:
      | supplier_id | product_name |
      | 1           | 零件 A       |

  # ==================== 複合主鍵場景 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: 複合主鍵資料表
    Given entity-setup primary 建立資料表 tb_OrderDetail:
      | column     | type          | pk | notnull | default | auto | fk |
      | order_id   | BIGINT        | Y  |         |         |      |    |
      | product_id | BIGINT        | Y  |         |         |      |    |
      | quantity   | INT           |    |         |         |      |    |
      | unit_price | DECIMAL(10,2) |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity   | table          |
      | 訂單明細 | tb_OrderDetail |
    When entity-setup 準備一個 訂單明細:
      | orderId | productId | quantity | unitPrice |
      | 1       | 100       | 5        | 199.99    |
      | 1       | 200       | 3        | 299.99    |
      | 2       | 100       | 2        | 199.99    |
    Then entity-setup tb_OrderDetail 資料表應有資料:
      | order_id | product_id | quantity | unit_price |
      | 1        | 100        | 5        | 199.99     |
      | 1        | 200        | 3        | 299.99     |
      | 2        | 100        | 2        | 199.99     |

  # ==================== 大量資料類型組合 ====================

  @h2 @postgresql @mysql
  Scenario: 完整資料類型組合測試
    Given entity-setup primary 建立資料表 tb_AllTypes:
      | column        | type          | pk | notnull | default | auto | fk |
      | id            | BIGINT        | Y  |         |         | Y    |    |
      | small_int_val | SMALLINT      |    |         |         |      |    |
      | int_val       | INT           |    |         |         |      |    |
      | big_int_val   | BIGINT        |    |         |         |      |    |
      | decimal_val   | DECIMAL(20,6) |    |         |         |      |    |
      | float_val     | FLOAT         |    |         |         |      |    |
      | double_val    | DOUBLE        |    |         |         |      |    |
      | varchar_val   | VARCHAR       |    |         |         |      |    |
      | text_val      | TEXT          |    |         |         |      |    |
      | boolean_val   | BOOLEAN       |    |         |         |      |    |
      | date_val      | DATE          |    |         |         |      |    |
      | time_val      | TIME          |    |         |         |      |    |
      | timestamp_val | TIMESTAMP     |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity       | table       |
      | 完整類型測試 | tb_AllTypes |
    When entity-setup 準備一個 完整類型測試:
      | smallIntVal | intVal | bigIntVal     | decimalVal    | floatVal | doubleVal   | varcharVal | textVal   | booleanVal | dateVal    | timeVal  | timestampVal        |
      | 32767       | 100000 | 9999999999999 | 123456.789012 | 3.14     | 3.141592653 | Hello      | Long text | true       | 2026-12-31 | 23:59:59 | 2026-12-31T23:59:59 |
    Then entity-setup tb_AllTypes 資料表應有資料:
      | small_int_val | int_val | big_int_val   | decimal_val   | float_val | double_val  | varchar_val | text_val  | boolean_val | date_val   | time_val | timestamp_val       |
      | 32767         | 100000  | 9999999999999 | 123456.789012 | 3.14      | 3.141592653 | Hello       | Long text | true        | 2026-12-31 | 23:59:59 | 2026-12-31T23:59:59 |

  @mssql
  Scenario: 完整資料類型組合測試（MSSQL）
    Given entity-setup primary 建立資料表 tb_AllTypes:
      | column        | type          | pk | notnull | default | auto | fk |
      | id            | BIGINT        | Y  |         |         | Y    |    |
      | tiny_int_val  | TINYINT       |    |         |         |      |    |
      | small_int_val | SMALLINT      |    |         |         |      |    |
      | int_val       | INT           |    |         |         |      |    |
      | big_int_val   | BIGINT        |    |         |         |      |    |
      | decimal_val   | DECIMAL(20,6) |    |         |         |      |    |
      | float_val     | FLOAT         |    |         |         |      |    |
      | double_val    | FLOAT         |    |         |         |      |    |
      | varchar_val   | NVARCHAR(255) |    |         |         |      |    |
      | text_val      | NVARCHAR(MAX) |    |         |         |      |    |
      | boolean_val   | BIT           |    |         |         |      |    |
      | date_val      | DATE          |    |         |         |      |    |
      | time_val      | TIME          |    |         |         |      |    |
      | timestamp_val | DATETIME2     |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity       | table       |
      | 完整類型測試 | tb_AllTypes |
    When entity-setup 準備一個 完整類型測試:
      | tinyIntVal | smallIntVal | intVal | bigIntVal     | decimalVal    | floatVal | doubleVal   | varcharVal | textVal   | booleanVal | dateVal    | timeVal  | timestampVal        |
      | 127        | 32767       | 100000 | 9999999999999 | 123456.789012 | 3.14     | 3.141592653 | Hello      | Long text | 1          | 2026-12-31 | 23:59:59 | 2026-12-31T23:59:59 |
    Then entity-setup tb_AllTypes 資料表應有資料:
      | tiny_int_val | small_int_val | int_val | big_int_val   | decimal_val   | float_val | double_val  | varchar_val | text_val  | boolean_val | date_val   | time_val | timestamp_val       |
      | 127          | 32767         | 100000  | 9999999999999 | 123456.789012 | 3.14      | 3.141592653 | Hello       | Long text | 1           | 2026-12-31 | 23:59:59 | 2026-12-31T23:59:59 |
