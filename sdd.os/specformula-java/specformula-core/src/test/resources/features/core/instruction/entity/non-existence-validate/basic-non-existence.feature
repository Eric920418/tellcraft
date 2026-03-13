@entity_non_existence_validate
Feature: EntityNonExistenceValidate - 基本不存在驗證

  Rule: 基本功能 - 單一主鍵

    @h2 @postgresql @mysql @mssql
    Scenario: 基本驗證 - 單一主鍵資料不存在
      Given entity-non-existence-validate primary 建立資料表 tb_User:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         |      |    |
        | name   | VARCHAR |    | Y       |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity | table   |
        | 用戶   | tb_User |
      And entity-non-existence-validate 準備一個 用戶:
        | id | name  |
        | 1  | Alice |
        | 2  | Bob   |
      When entity-non-existence-validate 驗證 用戶 不存在:
        | id | name    |
        | 3  | Charlie |
        | 4  | David   |
      Then entity-non-existence-validate 通過

    @h2 @postgresql @mysql @mssql
    Scenario: 基本驗證 - 多筆資料都不存在
      Given entity-non-existence-validate primary 建立資料表 tb_Customer:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         | Y    |    |
        | email  | VARCHAR |    | Y       |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity | table       |
        | 客戶   | tb_Customer |
      And entity-non-existence-validate 準備一個 客戶:
        | email             |
        | alice@example.com |
        | bob@example.com   |
      When entity-non-existence-validate 驗證 客戶 不存在:
        | email               |
        | charlie@example.com |
        | david@example.com   |
        | eve@example.com     |
      Then entity-non-existence-validate 通過

  Rule: 基本功能 - 非主鍵欄位

    @h2 @postgresql @mysql @mssql
    Scenario: 基本驗證 - 使用非主鍵欄位查詢不存在
      Given entity-non-existence-validate primary 建立資料表 tb_Product:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         | Y    |    |
        | name   | VARCHAR |    | Y       |         |      |    |
        | price  | DECIMAL |    |         |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity | table      |
        | 商品   | tb_Product |
      And entity-non-existence-validate 準備一個 商品:
        | name   | price  |
        | Laptop | 999.00 |
        | Mouse  | 29.99  |
      When entity-non-existence-validate 驗證 商品 不存在:
        | name     | price  |
        | Keyboard | 89.99  |
        | Monitor  | 299.00 |
      Then entity-non-existence-validate 通過

  Rule: 基本功能 - 複合主鍵

    @h2 @postgresql @mysql @mssql
    Scenario: 複合主鍵 - 驗證資料不存在
      Given entity-non-existence-validate primary 建立資料表 tb_OrderItem:
        | column     | type    | pk | notnull | default | auto | fk |
        | order_id   | BIGINT  | Y  |         |         |      |    |
        | product_id | BIGINT  | Y  |         |         |      |    |
        | quantity   | INT     |    | Y       |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity   | table        |
        | 訂單明細 | tb_OrderItem |
      And entity-non-existence-validate 準備一個 訂單明細:
        | orderId | productId | quantity |
        | 1       | 100       | 5        |
        | 1       | 200       | 3        |
        | 2       | 100       | 2        |
      When entity-non-existence-validate 驗證 訂單明細 不存在:
        | orderId | productId | quantity |
        | 1       | 300       | 1        |
        | 3       | 100       | 5        |
      Then entity-non-existence-validate 通過

  Rule: 驗證失敗 - 資料存在時應拋出錯誤

    @h2 @postgresql @mysql @mssql
    Scenario: 驗證失敗 - 資料存在時應拋出錯誤（主鍵查詢）
      Given entity-non-existence-validate primary 建立資料表 tb_User:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         |      |    |
        | name   | VARCHAR |    | Y       |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity | table   |
        | 用戶   | tb_User |
      And entity-non-existence-validate 準備一個 用戶:
        | id | name  |
        | 1  | Alice |
        | 2  | Bob   |
      When entity-non-existence-validate 驗證 用戶 不存在:
        | id |
        | 1  |
      Then entity-non-existence-validate 應拋出例外:
        | message          |
        | should not exist |

    @h2 @postgresql @mysql @mssql
    Scenario: 驗證失敗 - 非主鍵欄位查詢到已存在記錄
      Given entity-non-existence-validate primary 建立資料表 tb_Product:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         | Y    |    |
        | name   | VARCHAR |    | Y       |         |      |    |
        | price  | DECIMAL |    |         |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity | table      |
        | 商品   | tb_Product |
      And entity-non-existence-validate 準備一個 商品:
        | name   | price  |
        | Laptop | 999.00 |
      When entity-non-existence-validate 驗證 商品 不存在:
        | name   | price  |
        | Laptop | 999.00 |
      Then entity-non-existence-validate 應拋出例外:
        | message          |
        | should not exist |

    @h2 @postgresql @mysql @mssql
    Scenario: 驗證失敗 - 複合主鍵資料存在
      Given entity-non-existence-validate primary 建立資料表 tb_OrderItem:
        | column     | type    | pk | notnull | default | auto | fk |
        | order_id   | BIGINT  | Y  |         |         |      |    |
        | product_id | BIGINT  | Y  |         |         |      |    |
        | quantity   | INT     |    | Y       |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity   | table        |
        | 訂單明細 | tb_OrderItem |
      And entity-non-existence-validate 準備一個 訂單明細:
        | orderId | productId | quantity |
        | 1       | 100       | 5        |
      When entity-non-existence-validate 驗證 訂單明細 不存在:
        | orderId | productId |
        | 1       | 100       |
      Then entity-non-existence-validate 應拋出例外:
        | message          |
        | should not exist |

  Rule: 錯誤處理 - 缺少查詢條件

    @h2 @postgresql @mysql @mssql
    Scenario: 驗證失敗 - 缺少查詢條件
      Given entity-non-existence-validate primary 建立資料表 tb_Product:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         | Y    |    |
        | name   | VARCHAR |    | Y       |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity | table      |
        | 商品   | tb_Product |
      When entity-non-existence-validate 驗證 商品 不存在:
        | id |
        |    |
      Then entity-non-existence-validate 應拋出例外:
        | message      |
        | 缺少查詢條件 |
