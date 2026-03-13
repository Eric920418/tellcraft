@entity_validate
Feature: EntityValidate - 基本驗證
  測試 Entity 資料的基本驗證功能。
  包含含 PK 查詢、不含 PK 查詢、複合主鍵等場景。

  Rule: 含 PK 查詢 - 單一主鍵

    @h2 @postgresql @mysql @mssql
    Scenario: 含 PK 查詢 - 單一主鍵單筆資料
      Given entity-validate primary 建立資料表 tb_Employee:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         |      |    |
        | name   | VARCHAR |    | Y       |         |      |    |
        | email  | VARCHAR |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table       |
        | 員工   | tb_Employee |
      And entity-validate 準備一個 員工:
        | id | name  | email             |
        | 1  | Alice | alice@example.com |
      When entity-validate 驗證 員工 資料:
        | id | name  | email             |
        | 1  | Alice | alice@example.com |
      Then entity-validate 通過

    @h2 @postgresql @mysql @mssql
    Scenario: 含 PK 查詢 - 單一主鍵多筆資料
      Given entity-validate primary 建立資料表 tb_Employee:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         |      |    |
        | name   | VARCHAR |    | Y       |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table       |
        | 員工   | tb_Employee |
      And entity-validate 準備一個 員工:
        | id | name  |
        | 1  | Alice |
        | 2  | Bob   |
        | 3  | Carol |
      When entity-validate 驗證 員工 資料:
        | id | name  |
        | 1  | Alice |
        | 2  | Bob   |
        | 3  | Carol |
      Then entity-validate 通過

    @h2 @postgresql @mysql @mssql
    Scenario: 含 PK 查詢 - 單一主鍵部分欄位比對
      Given entity-validate primary 建立資料表 tb_Employee:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         |      |    |
        | name   | VARCHAR |    | Y       |         |      |    |
        | email  | VARCHAR |    |         |         |      |    |
        | phone  | VARCHAR |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table       |
        | 員工   | tb_Employee |
      And entity-validate 準備一個 員工:
        | id | name  | email             | phone        |
        | 1  | Alice | alice@example.com | 0912-345-678 |
      When entity-validate 驗證 員工 資料:
        | id | name  |
        | 1  | Alice |
      Then entity-validate 通過

  Rule: 含 PK 查詢 - 複合主鍵

    @h2 @postgresql @mysql @mssql
    Scenario: 含 PK 查詢 - 複合主鍵單筆資料
      Given entity-validate primary 建立資料表 tb_OrderItem:
        | column     | type          | pk | notnull | default | auto | fk |
        | order_id   | BIGINT        | Y  |         |         |      |    |
        | product_id | BIGINT        | Y  |         |         |      |    |
        | quantity   | INT           |    |         |         |      |    |
        | unit_price | DECIMAL(10,2) |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table        |
        | 訂單明細 | tb_OrderItem |
      And entity-validate 準備一個 訂單明細:
        | orderId | productId | quantity | unitPrice |
        | 1       | 101       | 2        | 150.00    |
      When entity-validate 驗證 訂單明細 資料:
        | orderId | productId | quantity | unitPrice |
        | 1       | 101       | 2        | 150.00    |
      Then entity-validate 通過

    @h2 @postgresql @mysql @mssql
    Scenario: 含 PK 查詢 - 複合主鍵多筆資料
      Given entity-validate primary 建立資料表 tb_OrderItem:
        | column     | type          | pk | notnull | default | auto | fk |
        | order_id   | BIGINT        | Y  |         |         |      |    |
        | product_id | BIGINT        | Y  |         |         |      |    |
        | quantity   | INT           |    |         |         |      |    |
        | unit_price | DECIMAL(10,2) |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table        |
        | 訂單明細 | tb_OrderItem |
      And entity-validate 準備一個 訂單明細:
        | orderId | productId | quantity | unitPrice |
        | 1       | 101       | 2        | 150.00    |
        | 1       | 102       | 1        | 300.00    |
        | 2       | 101       | 5        | 150.00    |
      When entity-validate 驗證 訂單明細 資料:
        | orderId | productId | quantity | unitPrice |
        | 1       | 101       | 2        | 150.00    |
        | 1       | 102       | 1        | 300.00    |
        | 2       | 101       | 5        | 150.00    |
      Then entity-validate 通過

    @h2 @postgresql @mysql @mssql
    Scenario: 含 PK 查詢 - 複合主鍵部分欄位比對
      Given entity-validate primary 建立資料表 tb_CourseEnrollment:
        | column      | type      | pk | notnull | default | auto | fk |
        | student_id  | BIGINT    | Y  |         |         |      |    |
        | course_id   | BIGINT    | Y  |         |         |      |    |
        | grade       | VARCHAR   |    |         |         |      |    |
        | enrolled_at | TIMESTAMP |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table               |
        | 選課   | tb_CourseEnrollment |
      And entity-validate 準備一個 選課:
        | studentId | courseId | grade | enrolledAt          |
        | 1         | 101      | A     | 2026-01-15T09:00:00 |
        | 1         | 102      | B+    | 2026-01-16T10:00:00 |
      When entity-validate 驗證 選課 資料:
        | studentId | courseId | grade |
        | 1         | 101      | A     |
        | 1         | 102      | B+    |
      Then entity-validate 通過

    @h2 @postgresql @mysql @mssql
    Scenario: 含 PK 查詢 - 三欄位複合主鍵
      Given entity-validate primary 建立資料表 tb_Inventory:
        | column       | type    | pk | notnull | default | auto | fk |
        | warehouse_id | BIGINT  | Y  |         |         |      |    |
        | product_id   | BIGINT  | Y  |         |         |      |    |
        | batch_no     | VARCHAR | Y  |         |         |      |    |
        | quantity     | INT     |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table        |
        | 庫存   | tb_Inventory |
      And entity-validate 準備一個 庫存:
        | warehouseId | productId | batchNo  | quantity |
        | 1           | 101       | BATCH-01 | 100      |
        | 1           | 101       | BATCH-02 | 50       |
        | 2           | 101       | BATCH-01 | 200      |
      When entity-validate 驗證 庫存 資料:
        | warehouseId | productId | batchNo  | quantity |
        | 1           | 101       | BATCH-01 | 100      |
        | 1           | 101       | BATCH-02 | 50       |
        | 2           | 101       | BATCH-01 | 200      |
      Then entity-validate 通過

  Rule: 不含 PK 查詢

    @h2 @postgresql @mysql @mssql
    Scenario: 不含 PK 查詢 - 驗證全部資料
      Given entity-validate primary 建立資料表 tb_Employee:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         | Y    |    |
        | name   | VARCHAR |    | Y       |         |      |    |
        | status | VARCHAR |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table       |
        | 員工   | tb_Employee |
      And entity-validate 準備一個 員工:
        | name  | status   |
        | Alice | active   |
        | Bob   | inactive |
        | Carol | active   |
      When entity-validate 驗證 員工 資料:
        | name  | status   |
        | Alice | active   |
        | Bob   | inactive |
        | Carol | active   |
      Then entity-validate 通過

    @h2 @postgresql @mysql @mssql
    Scenario: 不含 PK 查詢 - 複合主鍵表格驗證全部
      Given entity-validate primary 建立資料表 tb_OrderItem:
        | column     | type          | pk | notnull | default | auto | fk |
        | order_id   | BIGINT        | Y  |         |         |      |    |
        | product_id | BIGINT        | Y  |         |         |      |    |
        | quantity   | INT           |    |         |         |      |    |
        | unit_price | DECIMAL(10,2) |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table        |
        | 訂單明細 | tb_OrderItem |
      And entity-validate 準備一個 訂單明細:
        | orderId | productId | quantity | unitPrice |
        | 1       | 101       | 2        | 150.00    |
        | 1       | 102       | 1        | 300.00    |
        | 2       | 101       | 5        | 150.00    |
      When entity-validate 驗證 訂單明細 資料:
        | quantity | unitPrice |
        | 2        | 150.00    |
        | 1        | 300.00    |
        | 5        | 150.00    |
      Then entity-validate 通過

  Rule: 驗證失敗案例

    @h2 @postgresql @mysql @mssql
    Scenario: 驗證失敗 - 欄位值不匹配（字串）
      Given entity-validate primary 建立資料表 tb_Employee:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         |      |    |
        | name   | VARCHAR |    | Y       |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table       |
        | 員工   | tb_Employee |
      And entity-validate 準備一個 員工:
        | id | name  |
        | 1  | Alice |
      When entity-validate 驗證 員工 資料:
        | id | name |
        | 1  | Bob  |
      Then entity-validate 應拋出例外:
        | message |
        | expect: |

    @h2 @postgresql @mysql @mssql
    Scenario: 驗證失敗 - 欄位值不匹配（多欄位）
      Given entity-validate primary 建立資料表 tb_Employee:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         |      |    |
        | name   | VARCHAR |    | Y       |         |      |    |
        | email  | VARCHAR |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table       |
        | 員工   | tb_Employee |
      And entity-validate 準備一個 員工:
        | id | name  | email             |
        | 1  | Alice | alice@example.com |
      When entity-validate 驗證 員工 資料:
        | id | name | email           |
        | 1  | Bob  | bob@example.com |
      Then entity-validate 應拋出例外:
        | message |
        | expect: |

    @h2 @postgresql @mysql @mssql
    Scenario: 驗證失敗 - 欄位值不匹配（數值）
      Given entity-validate primary 建立資料表 tb_Product:
        | column   | type          | pk | notnull | default | auto | fk |
        | id       | BIGINT        | Y  |         |         |      |    |
        | name     | VARCHAR       |    | Y       |         |      |    |
        | price    | DECIMAL(10,2) |    |         |         |      |    |
        | quantity | INT           |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table      |
        | 商品   | tb_Product |
      And entity-validate 準備一個 商品:
        | id | name | price | quantity |
        | 1  | 手機 | 15000 | 100      |
      When entity-validate 驗證 商品 資料:
        | id | name | price | quantity |
        | 1  | 手機 | 20000 | 50       |
      Then entity-validate 應拋出例外:
        | message |
        | expect: |

    @h2 @postgresql @mysql @mssql
    Scenario: 驗證失敗 - 欄位值不匹配（日期時間）
      Given entity-validate primary 建立資料表 tb_Event:
        | column     | type      | pk | notnull | default | auto | fk |
        | id         | BIGINT    | Y  |         |         |      |    |
        | event_date | DATE      |    |         |         |      |    |
        | created_at | TIMESTAMP |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table    |
        | 事件   | tb_Event |
      And entity-validate 準備一個 事件:
        | id | eventDate  | createdAt           |
        | 1  | 2026-01-15 | 2026-01-15T10:00:00 |
      When entity-validate 驗證 事件 資料:
        | id | eventDate  | createdAt           |
        | 1  | 2026-01-20 | 2026-01-20T15:00:00 |
      Then entity-validate 應拋出例外:
        | message |
        | expect: |

    @h2 @postgresql @mysql @mssql
    Scenario: 驗證失敗 - 欄位值不匹配（預期 NULL 但實際有值）
      Given entity-validate primary 建立資料表 tb_Employee:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         |      |    |
        | name   | VARCHAR |    | Y       |         |      |    |
        | email  | VARCHAR |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table       |
        | 員工   | tb_Employee |
      And entity-validate 準備一個 員工:
        | id | name  | email             |
        | 1  | Alice | alice@example.com |
      When entity-validate 驗證 員工 資料:
        | id | name  | email   |
        | 1  | Alice | &isNull |
      Then entity-validate 應拋出例外:
        | message  |
        | 驗證失敗 |

    @h2 @postgresql @mysql @mssql
    Scenario: 驗證失敗 - 欄位值不匹配（預期有值但實際 NULL）
      Given entity-validate primary 建立資料表 tb_Employee:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         |      |    |
        | name   | VARCHAR |    | Y       |         |      |    |
        | email  | VARCHAR |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table       |
        | 員工   | tb_Employee |
      And entity-validate 準備一個 員工:
        | id | name  | email |
        | 1  | Alice |       |
      When entity-validate 驗證 員工 資料:
        | id | name  | email             |
        | 1  | Alice | alice@example.com |
      Then entity-validate 應拋出例外:
        | message |
        | expect: |

    @h2 @postgresql @mysql @mssql
    Scenario: 驗證失敗 - 複合主鍵存在但非 PK 欄位不匹配
      Given entity-validate primary 建立資料表 tb_OrderItem:
        | column     | type          | pk | notnull | default | auto | fk |
        | order_id   | BIGINT        | Y  |         |         |      |    |
        | product_id | BIGINT        | Y  |         |         |      |    |
        | quantity   | INT           |    |         |         |      |    |
        | unit_price | DECIMAL(10,2) |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table        |
        | 訂單明細 | tb_OrderItem |
      And entity-validate 準備一個 訂單明細:
        | orderId | productId | quantity | unitPrice |
        | 1       | 101       | 2        | 150.00    |
      When entity-validate 驗證 訂單明細 資料:
        | orderId | productId | quantity | unitPrice |
        | 1       | 101       | 10       | 200.00    |
      Then entity-validate 應拋出例外:
        | message |
        | expect: |

    @h2 @postgresql @mysql @mssql
    Scenario: 驗證失敗 - 多筆資料部分不匹配
      Given entity-validate primary 建立資料表 tb_Employee:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         |      |    |
        | name   | VARCHAR |    | Y       |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table       |
        | 員工   | tb_Employee |
      And entity-validate 準備一個 員工:
        | id | name  |
        | 1  | Alice |
        | 2  | Bob   |
        | 3  | Carol |
      When entity-validate 驗證 員工 資料:
        | id | name  |
        | 1  | Alice |
        | 2  | David |
        | 3  | Carol |
      Then entity-validate 應拋出例外:
        | message |
        | expect: |

    @h2 @postgresql @mysql @mssql
    Scenario: 驗證失敗 - 筆數不匹配（預期較多）
      Given entity-validate primary 建立資料表 tb_Employee:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         |      |    |
        | name   | VARCHAR |    | Y       |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table       |
        | 員工   | tb_Employee |
      And entity-validate 準備一個 員工:
        | id | name  |
        | 1  | Alice |
      When entity-validate 驗證 員工 資料:
        | id | name  |
        | 1  | Alice |
        | 2  | Bob   |
      Then entity-validate 應拋出例外:
        | message      |
        | should exist |

    @h2 @postgresql @mysql @mssql
    Scenario: 驗證失敗 - 筆數不匹配（預期較少）
      Given entity-validate primary 建立資料表 tb_Employee:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         |      |    |
        | name   | VARCHAR |    | Y       |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table       |
        | 員工   | tb_Employee |
      And entity-validate 準備一個 員工:
        | id | name  |
        | 1  | Alice |
        | 2  | Bob   |
        | 3  | Carol |
      When entity-validate 驗證 員工 資料:
        | id | name  |
        | 1  | Alice |
      Then entity-validate 通過

    @h2 @postgresql @mysql @mssql
    Scenario: 驗證失敗 - PK 不存在
      Given entity-validate primary 建立資料表 tb_Employee:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         |      |    |
        | name   | VARCHAR |    | Y       |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table       |
        | 員工   | tb_Employee |
      And entity-validate 準備一個 員工:
        | id | name  |
        | 1  | Alice |
      When entity-validate 驗證 員工 資料:
        | id  | name  |
        | 999 | Alice |
      Then entity-validate 應拋出例外:
        | message      |
        | should exist |

    @h2 @postgresql @mysql @mssql
    Scenario: 驗證失敗 - 複合主鍵部分不匹配
      Given entity-validate primary 建立資料表 tb_OrderItem:
        | column     | type   | pk | notnull | default | auto | fk |
        | order_id   | BIGINT | Y  |         |         |      |    |
        | product_id | BIGINT | Y  |         |         |      |    |
        | quantity   | INT    |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table        |
        | 訂單明細 | tb_OrderItem |
      And entity-validate 準備一個 訂單明細:
        | orderId | productId | quantity |
        | 1       | 101       | 2        |
      When entity-validate 驗證 訂單明細 資料:
        | orderId | productId | quantity |
        | 1       | 101       | 999      |
      Then entity-validate 應拋出例外:
        | message |
        | expect: |

    @h2 @postgresql @mysql @mssql
    Scenario: 驗證失敗 - 找不到 entity
      Given entity-validate primary 建立資料表 tb_Known:
        | column | type   | pk | notnull | default | auto | fk |
        | id     | BIGINT | Y  |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table    |
        | 已知實體 | tb_Known |
      When entity-validate 驗證 未知實體 資料:
        | id |
        | 1  |
      Then entity-validate 應拋出例外:
        | message       |
        | 找不到 entity |

    @h2 @postgresql @mysql @mssql
    Scenario: 驗證失敗 - 預期無資料但有資料
      Given entity-validate primary 建立資料表 tb_Employee:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         |      |    |
        | name   | VARCHAR |    | Y       |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table       |
        | 員工   | tb_Employee |
      And entity-validate 準備一個 員工:
        | id | name  |
        | 1  | Alice |
      When entity-validate 驗證 員工 資料:
        | id |
      Then entity-validate 應拋出例外:
        | message                      |
        | DataTable 必須至少有一列資料 |

  Rule: 資料類型驗證 - 數值類型

    @h2 @postgresql @mysql @mssql
    Scenario: 資料類型 - 數值類型（INT, DECIMAL, DOUBLE）
      Given entity-validate primary 建立資料表 tb_Product:
        | column   | type          | pk | notnull | default | auto | fk |
        | id       | BIGINT        | Y  |         |         |      |    |
        | quantity | INT           |    |         |         |      |    |
        | price    | DECIMAL(10,2) |    |         |         |      |    |
        | weight   | DOUBLE        |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table      |
        | 商品   | tb_Product |
      And entity-validate 準備一個 商品:
        | id | quantity | price  | weight |
        | 1  | 100      | 299.99 | 1.5    |
      When entity-validate 驗證 商品 資料:
        | id | quantity | price  | weight |
        | 1  | 100      | 299.99 | 1.5    |
      Then entity-validate 通過

  Rule: 資料類型驗證 - 日期時間類型

    @h2 @postgresql @mysql @mssql
    Scenario: 資料類型 - 日期時間類型（DATE, TIMESTAMP）
      Given entity-validate primary 建立資料表 tb_Event:
        | column     | type      | pk | notnull | default | auto | fk |
        | id         | BIGINT    | Y  |         |         |      |    |
        | event_date | DATE      |    |         |         |      |    |
        | created_at | TIMESTAMP |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table    |
        | 事件   | tb_Event |
      And entity-validate 準備一個 事件:
        | id | eventDate  | createdAt           |
        | 1  | 2026-01-15 | 2026-01-15T10:30:00 |
      When entity-validate 驗證 事件 資料:
        | id | eventDate  | createdAt           |
        | 1  | 2026-01-15 | 2026-01-15T10:30:00 |
      Then entity-validate 通過

  Rule: 資料類型驗證 - 布林類型

    @h2 @postgresql @mysql
    Scenario: 資料類型 - 布林類型（BOOLEAN）
      Given entity-validate primary 建立資料表 tb_Setting:
        | column    | type    | pk | notnull | default | auto | fk |
        | id        | BIGINT  | Y  |         |         |      |    |
        | is_active | BOOLEAN |    |         |         |      |    |
        | is_admin  | BOOLEAN |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table      |
        | 設定   | tb_Setting |
      And entity-validate 準備一個 設定:
        | id | isActive | isAdmin |
        | 1  | true     | false   |
      When entity-validate 驗證 設定 資料:
        | id | isActive | isAdmin |
        | 1  | true     | false   |
      Then entity-validate 通過

    @mssql
    Scenario: 資料類型 - 布林類型（BIT for MSSQL）
      Given entity-validate primary 建立資料表 tb_Setting:
        | column    | type   | pk | notnull | default | auto | fk |
        | id        | BIGINT | Y  |         |         |      |    |
        | is_active | BIT    |    |         |         |      |    |
        | is_admin  | BIT    |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table      |
        | 設定   | tb_Setting |
      And entity-validate 準備一個 設定:
        | id | isActive | isAdmin |
        | 1  | 1        | 0       |
      When entity-validate 驗證 設定 資料:
        | id | isActive | isAdmin |
        | 1  | 1        | 0       |
      Then entity-validate 通過

  Rule: 資料類型驗證 - 文字類型

    @h2 @postgresql @mysql
    Scenario: 資料類型 - 文字類型（TEXT）
      Given entity-validate primary 建立資料表 tb_Article:
        | column  | type    | pk | notnull | default | auto | fk |
        | id      | BIGINT  | Y  |         |         |      |    |
        | title   | VARCHAR |    | Y       |         |      |    |
        | content | TEXT    |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table      |
        | 文章   | tb_Article |
      And entity-validate 準備一個 文章:
        | id | title    | content                    |
        | 1  | 測試標題 | 這是一段很長的文章內容... |
      When entity-validate 驗證 文章 資料:
        | id | title    | content                    |
        | 1  | 測試標題 | 這是一段很長的文章內容... |
      Then entity-validate 通過

    @mssql
    Scenario: 資料類型 - 文字類型（NVARCHAR MAX for MSSQL）
      Given entity-validate primary 建立資料表 tb_Article:
        | column  | type          | pk | notnull | default | auto | fk |
        | id      | BIGINT        | Y  |         |         |      |    |
        | title   | NVARCHAR(255) |    | Y       |         |      |    |
        | content | NVARCHAR(MAX) |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table      |
        | 文章   | tb_Article |
      And entity-validate 準備一個 文章:
        | id | title    | content                    |
        | 1  | 測試標題 | 這是一段很長的文章內容... |
      When entity-validate 驗證 文章 資料:
        | id | title    | content                    |
        | 1  | 測試標題 | 這是一段很長的文章內容... |
      Then entity-validate 通過

  Rule: 資料類型驗證 - DEFAULT 預設值

    @h2 @postgresql @mysql @mssql
    Scenario: 資料類型 - DEFAULT 預設值
      Given entity-validate primary 建立資料表 tb_Config:
        | column | type    | pk | notnull | default  | auto | fk |
        | id     | BIGINT  | Y  |         |          |      |    |
        | name   | VARCHAR |    | Y       |          |      |    |
        | status | VARCHAR |    |         | 'active' |      |    |
        | count  | INT     |    |         | 0        |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table     |
        | 設定檔 | tb_Config |
      And entity-validate 準備一個 設定檔:
        | id | name   |
        | 1  | 測試用 |
      When entity-validate 驗證 設定檔 資料:
        | id | name   | status | count |
        | 1  | 測試用 | active | 0     |
      Then entity-validate 通過

  Rule: 資料類型驗證 - 空值處理

    @h2 @postgresql @mysql @mssql
    Scenario: 資料類型 - 空值欄位驗證
      Given entity-validate primary 建立資料表 tb_Contact:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         |      |    |
        | name   | VARCHAR |    | Y       |         |      |    |
        | phone  | VARCHAR |    |         |         |      |    |
        | email  | VARCHAR |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table      |
        | 聯絡人 | tb_Contact |
      And entity-validate 準備一個 聯絡人:
        | id | name  | phone        | email |
        | 1  | Alice | 0912-345-678 |       |
      When entity-validate 驗證 聯絡人 資料:
        | id | name  | phone        | email   |
        | 1  | Alice | 0912-345-678 | &isNull |
      Then entity-validate 通過

  Rule: 資料類型驗證 - 自動遞增主鍵

    @h2 @postgresql @mysql @mssql
    Scenario: 資料類型 - 自動遞增主鍵
      Given entity-validate primary 建立資料表 tb_Category:
        | column | type    | pk | notnull | default | auto | fk |
        | id     | BIGINT  | Y  |         |         | Y    |    |
        | name   | VARCHAR |    | Y       |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table       |
        | 分類   | tb_Category |
      And entity-validate 準備一個 分類:
        | name     |
        | 電子產品 |
      When entity-validate 驗證 分類 資料:
        | name     |
        | 電子產品 |
      Then entity-validate 通過

  Rule: 資料類型驗證 - 複合資料類型組合

    @h2 @postgresql @mysql @mssql
    Scenario: 資料類型 - 複合資料類型組合
      Given entity-validate primary 建立資料表 tb_Order:
        | column       | type          | pk | notnull | default | auto | fk |
        | id           | BIGINT        | Y  |         |         | Y    |    |
        | order_no     | VARCHAR       |    | Y       |         |      |    |
        | total_amount | DECIMAL(12,2) |    |         |         |      |    |
        | order_date   | DATE          |    |         |         |      |    |
        | created_at   | TIMESTAMP     |    |         |         |      |    |
      And entity-validate primary 建立資料表 tb_OrderItem:
        | column       | type          | pk | notnull | default | auto | fk          |
        | id           | BIGINT        | Y  |         |         | Y    |             |
        | order_id     | BIGINT        |    |         |         |      | tb_Order.id |
        | product_name | VARCHAR       |    | Y       |         |      |             |
        | quantity     | INT           |    |         |         |      |             |
        | unit_price   | DECIMAL(10,2) |    |         |         |      |             |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table        |
        | 訂單     | tb_Order     |
        | 訂單明細 | tb_OrderItem |
      And entity-validate 準備一個 訂單:
        | >orderId | orderNo | totalAmount | orderDate  | createdAt           |
        | <id      | ORD-001 | 1500.00     | 2026-01-20 | 2026-01-20T09:00:00 |
      And entity-validate 準備一個 訂單明細:
        | orderId  | productName | quantity | unitPrice |
        | $orderId | 筆記型電腦  | 1        | 1200.00   |
        | $orderId | 滑鼠        | 2        | 150.00    |
      When entity-validate 驗證 訂單 資料:
        | orderNo | totalAmount | orderDate  |
        | ORD-001 | 1500.00     | 2026-01-20 |
      Then entity-validate 通過
      When entity-validate 驗證 訂單明細 資料:
        | orderId  | productName | quantity | unitPrice |
        | $orderId | 筆記型電腦  | 1        | 1200.00   |
        | $orderId | 滑鼠        | 2        | 150.00    |
      Then entity-validate 通過
