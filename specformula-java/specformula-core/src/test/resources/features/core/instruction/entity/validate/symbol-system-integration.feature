@entity_validate
Feature: EntityValidate - 符號系統整合
  測試 EntityValidate 與 VAR-System、CAS-System、TIME-System 的整合。
  包含變數引用、特殊比對符號、時間表達式等場景。

  # ==================== VAR-System 整合 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: VAR - $variable 引用變數作為資料
    Given entity-validate primary 建立資料表 tb_Employee:
      | column     | type    | pk | notnull | default | auto | fk |
      | id         | BIGINT  | Y  |         |         |      |    |
      | manager_id | BIGINT  |    |         |         |      |    |
      | name       | VARCHAR |    | Y       |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table       |
      | 員工   | tb_Employee |
    And entity-validate context 變數 "managerId" 為 999
    And entity-validate 準備一個 員工:
      | id | managerId  | name  |
      | 1  | $managerId | Alice |
    When entity-validate 驗證 員工 資料:
      | id | managerId  | name  |
      | 1  | $managerId | Alice |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: VAR - >contextKey <executionKey 擷取自動生成 ID
    Given entity-validate primary 建立資料表 tb_Category:
      | column | type    | pk | notnull | default | auto | fk |
      | id     | BIGINT  | Y  |         |         | Y    |    |
      | name   | VARCHAR |    | Y       |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table       |
      | 分類   | tb_Category |
    And entity-validate 準備一個 分類:
      | >categoryId | name     |
      | <id         | 電子產品 |
    When entity-validate 驗證 分類 資料:
      | name     |
      | 電子產品 |
    Then entity-validate 通過
    And entity-validate context 應有變數:
      | categoryId |
      | &gt(0)     |

  @h2 @postgresql @mysql @mssql
  Scenario: VAR - 複合主鍵搭配變數擷取
    Given entity-validate primary 建立資料表 tb_Order:
      | column   | type    | pk | notnull | default | auto | fk |
      | id       | BIGINT  | Y  |         |         | Y    |    |
      | order_no | VARCHAR |    | Y       |         |      |    |
    And entity-validate primary 建立資料表 tb_OrderItem:
      | column     | type          | pk | notnull | default | auto | fk          |
      | order_id   | BIGINT        | Y  |         |         |      | tb_Order.id |
      | product_id | BIGINT        | Y  |         |         |      |             |
      | quantity   | INT           |    |         |         |      |             |
    And entity-validate primary entity_to_table_mapping:
      | entity   | table        |
      | 訂單     | tb_Order     |
      | 訂單明細 | tb_OrderItem |
    And entity-validate 準備一個 訂單:
      | >orderId | orderNo |
      | <id      | ORD-001 |
    And entity-validate 準備一個 訂單明細:
      | orderId  | productId | quantity |
      | $orderId | 101       | 2        |
      | $orderId | 102       | 1        |
    When entity-validate 驗證 訂單 資料:
      | orderNo |
      | ORD-001 |
    Then entity-validate 通過
    When entity-validate 驗證 訂單明細 資料:
      | orderId  | productId | quantity |
      | $orderId | 101       | 2        |
      | $orderId | 102       | 1        |
    Then entity-validate 通過

  # ==================== CAS-System 整合 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: CAS - &isNull 驗證空值
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
      | id | name  | email   |
      | 1  | Alice | &isNull |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: CAS - &isNotNull 驗證非空
    Given entity-validate primary 建立資料表 tb_Employee:
      | column     | type      | pk | notnull | default | auto | fk |
      | id         | BIGINT    | Y  |         |         |      |    |
      | name       | VARCHAR   |    | Y       |         |      |    |
      | created_at | TIMESTAMP |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table       |
      | 員工   | tb_Employee |
    And entity-validate 準備一個 員工:
      | id | name  | createdAt           |
      | 1  | Alice | 2026-01-15T09:00:00 |
    When entity-validate 驗證 員工 資料:
      | id | name  | createdAt |
      | 1  | Alice | &isNotNull  |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: CAS - &gt &gte &lt &lte 數值比較
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
      | 1  | 手機 | 15000 | 50       |
    When entity-validate 驗證 商品 資料:
      | id | name | price      | quantity |
      | 1  | 手機 | &gt(10000) | &ge(50) |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: CAS - 複合主鍵搭配 CAS 驗證
    Given entity-validate primary 建立資料表 tb_OrderItem:
      | column     | type          | pk | notnull | default | auto | fk |
      | order_id   | BIGINT        | Y  |         |         |      |    |
      | product_id | BIGINT        | Y  |         |         |      |    |
      | quantity   | INT           |    |         |         |      |    |
      | unit_price | DECIMAL(10,2) |    |         |         |      |    |
      | discount   | DECIMAL(10,2) |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity   | table        |
      | 訂單明細 | tb_OrderItem |
    And entity-validate 準備一個 訂單明細:
      | orderId | productId | quantity | unitPrice | discount |
      | 1       | 101       | 2        | 150.00    |          |
      | 1       | 102       | 1        | 300.00    | 30.00    |
    When entity-validate 驗證 訂單明細 資料:
      | orderId | productId | quantity | unitPrice | discount |
      | 1       | 101       | &gt(0)   | &ge(100) | &isNull  |
      | 1       | 102       | &ge(1)  | &gt(200)  | &isNotNull |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: CAS - &contains 字串包含
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
      | id | name  | email              |
      | 1  | Alice | &contains(example) |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: CAS - &startsWith &endsWith 字串比對
    Given entity-validate primary 建立資料表 tb_Order:
      | column   | type    | pk | notnull | default | auto | fk |
      | id       | BIGINT  | Y  |         |         |      |    |
      | order_no | VARCHAR |    | Y       |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table    |
      | 訂單   | tb_Order |
    And entity-validate 準備一個 訂單:
      | id | orderNo      |
      | 1  | ORD-2026-001 |
    When entity-validate 驗證 訂單 資料:
      | id | orderNo           |
      | 1  | &startsWith(ORD-) |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: CAS - &matches 正則表達式
    Given entity-validate primary 建立資料表 tb_Order:
      | column   | type    | pk | notnull | default | auto | fk |
      | id       | BIGINT  | Y  |         |         |      |    |
      | order_no | VARCHAR |    | Y       |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table    |
      | 訂單   | tb_Order |
    And entity-validate 準備一個 訂單:
      | id | orderNo      |
      | 1  | ORD-2026-001 |
    When entity-validate 驗證 訂單 資料:
      | id | orderNo                     |
      | 1  | &matches(ORD-\\d{4}-\\d{3}) |
    Then entity-validate 通過

  # ==================== TIME-System 整合 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: TIME - @time() 絕對時間驗證
    Given entity-validate primary 建立資料表 tb_Event:
      | column     | type      | pk | notnull | default | auto | fk |
      | id         | BIGINT    | Y  |         |         |      |    |
      | event_name | VARCHAR   |    | Y       |         |      |    |
      | event_time | TIMESTAMP |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table    |
      | 事件   | tb_Event |
    And entity-validate 準備一個 事件:
      | id | eventName | eventTime                    |
      | 1  | 會議      | @time("2026-01-15T09:00:00") |
    When entity-validate 驗證 事件 資料:
      | id | eventName | eventTime                    |
      | 1  | 會議      | @time("2026-01-15T09:00:00") |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: TIME - @time(now) 相對時間驗證
    Given entity-validate 設定時間為 "2026-02-01T10:00:00"
    And entity-validate primary 建立資料表 tb_Log:
      | column   | type      | pk | notnull | default | auto | fk |
      | id       | BIGINT    | Y  |         |         |      |    |
      | log_time | TIMESTAMP |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table  |
      | 日誌   | tb_Log |
    And entity-validate 準備一個 日誌:
      | id | logTime       |
      | 1  | @time(now-1d) |
    When entity-validate 驗證 日誌 資料:
      | id | logTime       |
      | 1  | @time(now-1d) |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: TIME - @date() 日期驗證
    Given entity-validate primary 建立資料表 tb_Holiday:
      | column       | type    | pk | notnull | default | auto | fk |
      | id           | BIGINT  | Y  |         |         |      |    |
      | holiday_name | VARCHAR |    | Y       |         |      |    |
      | holiday_date | DATE    |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table      |
      | 假日   | tb_Holiday |
    And entity-validate 準備一個 假日:
      | id | holidayName | holidayDate         |
      | 1  | 元旦        | @date("2026-01-01") |
    When entity-validate 驗證 假日 資料:
      | id | holidayName | holidayDate         |
      | 1  | 元旦        | @date("2026-01-01") |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: TIME - 複合主鍵搭配時間驗證
    Given entity-validate 設定時間為 "2026-02-01T10:00:00"
    And entity-validate primary 建立資料表 tb_Attendance:
      | column      | type      | pk | notnull | default | auto | fk |
      | employee_id | BIGINT    | Y  |         |         |      |    |
      | work_date   | DATE      | Y  |         |         |      |    |
      | check_in    | TIMESTAMP |    |         |         |      |    |
      | check_out   | TIMESTAMP |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table         |
      | 出勤   | tb_Attendance |
    And entity-validate 準備一個 出勤:
      | employeeId | workDate            | checkIn                      | checkOut                     |
      | 1          | @date("2026-02-01") | @time("2026-02-01T09:00:00") | @time("2026-02-01T18:00:00") |
      | 1          | @date("2026-02-02") | @time("2026-02-02T08:55:00") | @time("2026-02-02T18:05:00") |
    When entity-validate 驗證 出勤 資料:
      | employeeId | workDate            | checkIn  | checkOut |
      | 1          | @date("2026-02-01") | &isNotNull | &isNotNull |
      | 1          | @date("2026-02-02") | &isNotNull | &isNotNull |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: TIME - @localTime() 時間驗證（字串比對）
    Given entity-validate primary 建立資料表 tb_Schedule:
      | column     | type    | pk | notnull | default | auto | fk |
      | id         | BIGINT  | Y  |         |         |      |    |
      | name       | VARCHAR |    | Y       |         |      |    |
      | start_time | TIME    |    |         |         |      |    |
      | end_time   | TIME    |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table       |
      | 排程   | tb_Schedule |
    And entity-validate 準備一個 排程:
      | id | name | startTime              | endTime                |
      | 1  | 晨會 | @localTime("09:00:00") | @localTime("10:30:00") |
    When entity-validate 驗證 排程 資料:
      | id | name | startTime | endTime  |
      | 1  | 晨會 | 09:00:00  | 10:30:00 |
    Then entity-validate 通過

  # ==================== VAR + CAS + TIME 混合場景 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: 混合 - VAR + TIME 跨 entity 驗證
    Given entity-validate 設定時間為 "2026-02-01T10:00:00"
    And entity-validate primary 建立資料表 tb_Project:
      | column     | type      | pk | notnull | default | auto | fk |
      | id         | BIGINT    | Y  |         |         | Y    |    |
      | name       | VARCHAR   |    | Y       |         |      |    |
      | created_at | TIMESTAMP |    |         |         |      |    |
    And entity-validate primary 建立資料表 tb_Task:
      | column     | type      | pk | notnull | default | auto | fk            |
      | id         | BIGINT    | Y  |         |         | Y    |               |
      | project_id | BIGINT    |    |         |         |      | tb_Project.id |
      | name       | VARCHAR   |    | Y       |         |      |               |
      | due_date   | TIMESTAMP |    |         |         |      |               |
    And entity-validate primary entity_to_table_mapping:
      | entity | table      |
      | 專案   | tb_Project |
      | 任務   | tb_Task    |
    And entity-validate 準備一個 專案:
      | >projectId | name   | createdAt  |
      | <id        | 新專案 | @time(now) |
    And entity-validate 準備一個 任務:
      | projectId  | name   | dueDate       |
      | $projectId | 任務一 | @time(now+7d) |
      | $projectId | 任務二 | @time(now+14d)|
    When entity-validate 驗證 專案 資料:
      | name   | createdAt                    |
      | 新專案 | @time("2026-02-01T10:00:00") |
    Then entity-validate 通過
    When entity-validate 驗證 任務 資料:
      | projectId  | name   | dueDate                      |
      | $projectId | 任務一 | @time("2026-02-08T10:00:00") |
      | $projectId | 任務二 | @time("2026-02-15T10:00:00") |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: 混合 - VAR + CAS 擷取並驗證（全 CAS 約束應拋出例外）
    Given entity-validate primary 建立資料表 tb_Order:
      | column     | type          | pk | notnull | default | auto | fk |
      | id         | BIGINT        | Y  |         |         | Y    |    |
      | order_no   | VARCHAR       |    | Y       |         |      |    |
      | amount     | DECIMAL(10,2) |    |         |         |      |    |
      | status     | VARCHAR       |    |         |         |      |    |
      | created_at | TIMESTAMP     |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table    |
      | 訂單   | tb_Order |
    And entity-validate 準備一個 訂單:
      | >orderId | orderNo | amount  | status  | createdAt           |
      | <id      | ORD-001 | 1500.00 | pending | 2026-01-15T09:00:00 |
    When entity-validate 驗證 訂單 資料:
      | orderNo           | amount    | status   | createdAt  |
      | &startsWith(ORD-) | &gt(1000) | &isNotNull | &isNotNull |
    Then entity-validate 應拋出例外:
      | message      |
      | 缺少查詢條件 |

  @h2 @postgresql @mysql @mssql
  Scenario: 混合 - 複合主鍵 + VAR + CAS + TIME 完整整合（全 CAS 約束應拋出例外）
    Given entity-validate 設定時間為 "2026-02-01T10:00:00"
    And entity-validate primary 建立資料表 tb_Order:
      | column     | type          | pk | notnull | default | auto | fk |
      | id         | BIGINT        | Y  |         |         | Y    |    |
      | order_no   | VARCHAR       |    | Y       |         |      |    |
      | created_at | TIMESTAMP     |    |         |         |      |    |
    And entity-validate primary 建立資料表 tb_OrderItem:
      | column     | type          | pk | notnull | default | auto | fk          |
      | order_id   | BIGINT        | Y  |         |         |      | tb_Order.id |
      | product_id | BIGINT        | Y  |         |         |      |             |
      | quantity   | INT           |    |         |         |      |             |
      | unit_price | DECIMAL(10,2) |    |         |         |      |             |
    And entity-validate primary entity_to_table_mapping:
      | entity   | table        |
      | 訂單     | tb_Order     |
      | 訂單明細 | tb_OrderItem |
    And entity-validate 準備一個 訂單:
      | >orderId | orderNo | createdAt  |
      | <id      | ORD-001 | @time(now) |
    And entity-validate 準備一個 訂單明細:
      | orderId  | productId | quantity | unitPrice |
      | $orderId | 101       | 2        | 150.00    |
      | $orderId | 102       | 1        | 300.00    |
    When entity-validate 驗證 訂單 資料:
      | orderNo           | createdAt  |
      | &startsWith(ORD-) | &isNotNull |
    Then entity-validate 應拋出例外:
      | message      |
      | 缺少查詢條件 |

  @h2 @postgresql @mysql @mssql
  Scenario: 混合 - 多資料庫 + VAR + CAS + TIME
    Given entity-validate 設定時間為 "2026-02-01T10:00:00"
    And entity-validate primary 建立資料表 tb_Customer:
      | column     | type      | pk | notnull | default | auto | fk |
      | id         | BIGINT    | Y  |         |         | Y    |    |
      | name       | VARCHAR   |    | Y       |         |      |    |
      | email      | VARCHAR   |    |         |         |      |    |
      | created_at | TIMESTAMP |    |         |         |      |    |
    And entity-validate secondary 建立資料表 tb_CustomerLog:
      | column      | type      | pk | notnull | default | auto | fk |
      | id          | BIGINT    | Y  |         |         | Y    |    |
      | customer_id | BIGINT    |    | Y       |         |      |    |
      | action      | VARCHAR   |    |         |         |      |    |
      | log_time    | TIMESTAMP |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table       |
      | 客戶   | tb_Customer |
    And entity-validate secondary entity_to_table_mapping:
      | entity   | table          |
      | 客戶日誌 | tb_CustomerLog |
    And entity-validate 準備一個 客戶:
      | >customerId | name  | email             | createdAt  |
      | <id         | Alice | alice@example.com | @time(now) |
    And entity-validate 準備一個 客戶日誌:
      | customerId  | action | logTime       |
      | $customerId | login  | @time(now)    |
      | $customerId | logout | @time(now+8h) |
    When entity-validate 驗證 客戶 資料:
      | name  | email              | createdAt |
      | Alice | &contains(example) | &isNotNull  |
    Then entity-validate 通過
    When entity-validate 驗證 客戶日誌 資料:
      | customerId  | action | logTime  |
      | $customerId | login  | &isNotNull |
      | $customerId | logout | &isNotNull |
    Then entity-validate 通過
