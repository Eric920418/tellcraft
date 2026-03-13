@entity_non_existence_validate
Feature: EntityNonExistenceValidate - 符號系統整合
  測試 EntityNonExistenceValidate 與 VAR-System、TIME-System 的整合。
  包含變數引用、時間表達式等場景。

  # ==================== VAR-System 整合 ====================

  Rule: VAR-System - $variable 變數引用

    @h2 @postgresql @mysql @mssql
    Scenario: VAR - $variable 引用變數作為 PK 查詢條件
      Given entity-non-existence-validate primary 建立資料表 tb_Employee:
        | column     | type    | pk | notnull | default | auto | fk |
        | id         | BIGINT  | Y  |         |         |      |    |
        | manager_id | BIGINT  |    |         |         |      |    |
        | name       | VARCHAR |    | Y       |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity | table       |
        | 員工   | tb_Employee |
      And entity-non-existence-validate context 變數 "nonExistId" 為 999
      And entity-non-existence-validate 準備一個 員工:
        | id | managerId | name  |
        | 1  | 100       | Alice |
      When entity-non-existence-validate 驗證 員工 不存在:
        | id           |
        | $nonExistId  |
      Then entity-non-existence-validate 通過

    @h2 @postgresql @mysql @mssql
    Scenario: VAR - $variable 引用變數作為非 PK 查詢條件
      Given entity-non-existence-validate primary 建立資料表 tb_Employee:
        | column     | type    | pk | notnull | default | auto | fk |
        | id         | BIGINT  | Y  |         |         |      |    |
        | manager_id | BIGINT  |    |         |         |      |    |
        | name       | VARCHAR |    | Y       |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity | table       |
        | 員工   | tb_Employee |
      And entity-non-existence-validate context 變數 "managerId" 為 999
      And entity-non-existence-validate 準備一個 員工:
        | id | managerId | name  |
        | 1  | 100       | Alice |
      When entity-non-existence-validate 驗證 員工 不存在:
        | managerId  | name |
        | $managerId | Bob  |
      Then entity-non-existence-validate 通過

    @h2 @postgresql @mysql @mssql
    Scenario: VAR - $variable 引用變數驗證失敗（資料存在）
      Given entity-non-existence-validate primary 建立資料表 tb_Employee:
        | column     | type    | pk | notnull | default | auto | fk |
        | id         | BIGINT  | Y  |         |         |      |    |
        | manager_id | BIGINT  |    |         |         |      |    |
        | name       | VARCHAR |    | Y       |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity | table       |
        | 員工   | tb_Employee |
      And entity-non-existence-validate context 變數 "existId" 為 1
      And entity-non-existence-validate 準備一個 員工:
        | id | managerId | name  |
        | 1  | 100       | Alice |
      When entity-non-existence-validate 驗證 員工 不存在:
        | id        |
        | $existId  |
      Then entity-non-existence-validate 應拋出例外:
        | message          |
        | should not exist |

    @h2 @postgresql @mysql @mssql
    Scenario: VAR - 複合主鍵搭配 $variable
      Given entity-non-existence-validate primary 建立資料表 tb_OrderItem:
        | column     | type | pk | notnull | default | auto | fk |
        | order_id   | BIGINT | Y  |         |         |      |    |
        | product_id | BIGINT | Y  |         |         |      |    |
        | quantity   | INT    |    | Y       |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity   | table        |
        | 訂單明細 | tb_OrderItem |
      And entity-non-existence-validate context 變數 "orderId" 為 1
      And entity-non-existence-validate context 變數 "productId" 為 999
      And entity-non-existence-validate 準備一個 訂單明細:
        | orderId | productId | quantity |
        | 1       | 100       | 5        |
        | 1       | 200       | 3        |
      When entity-non-existence-validate 驗證 訂單明細 不存在:
        | orderId  | productId  |
        | $orderId | $productId |
      Then entity-non-existence-validate 通過

  # ==================== TIME-System 整合 ====================

  Rule: TIME-System - 時間表達式

    @h2 @postgresql @mysql @mssql
    Scenario: TIME - @time() 絕對時間查詢不存在
      Given entity-non-existence-validate primary 建立資料表 tb_Event:
        | column     | type      | pk | notnull | default | auto | fk |
        | id         | BIGINT    | Y  |         |         | Y    |    |
        | event_name | VARCHAR   |    | Y       |         |      |    |
        | event_time | TIMESTAMP |    |         |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity | table    |
        | 事件   | tb_Event |
      And entity-non-existence-validate 準備一個 事件:
        | eventName | eventTime                    |
        | 會議      | @time("2026-01-15T09:00:00") |
      When entity-non-existence-validate 驗證 事件 不存在:
        | eventName | eventTime                    |
        | 發表會    | @time("2026-01-15T09:00:00") |
      Then entity-non-existence-validate 通過

    @h2 @postgresql @mysql @mssql
    Scenario: TIME - @time(now) 相對時間查詢不存在
      Given entity-non-existence-validate 設定時間為 "2026-02-01T10:00:00"
      And entity-non-existence-validate primary 建立資料表 tb_Log:
        | column   | type      | pk | notnull | default | auto | fk |
        | id       | BIGINT    | Y  |         |         | Y    |    |
        | message  | VARCHAR   |    | Y       |         |      |    |
        | log_time | TIMESTAMP |    |         |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity | table  |
        | 日誌   | tb_Log |
      And entity-non-existence-validate 準備一個 日誌:
        | message | logTime       |
        | 登入    | @time(now-1d) |
      When entity-non-existence-validate 驗證 日誌 不存在:
        | message | logTime       |
        | 登出    | @time(now-1d) |
      Then entity-non-existence-validate 通過

    @h2 @postgresql @mysql @mssql
    Scenario: TIME - @date() 日期查詢不存在
      Given entity-non-existence-validate primary 建立資料表 tb_Holiday:
        | column       | type    | pk | notnull | default | auto | fk |
        | id           | BIGINT  | Y  |         |         | Y    |    |
        | holiday_name | VARCHAR |    | Y       |         |      |    |
        | holiday_date | DATE    |    |         |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity | table      |
        | 假日   | tb_Holiday |
      And entity-non-existence-validate 準備一個 假日:
        | holidayName | holidayDate         |
        | 元旦        | @date("2026-01-01") |
      When entity-non-existence-validate 驗證 假日 不存在:
        | holidayName | holidayDate         |
        | 國慶日      | @date("2026-10-10") |
      Then entity-non-existence-validate 通過

    @h2 @postgresql @mysql @mssql
    Scenario: TIME - 複合主鍵搭配時間查詢不存在
      Given entity-non-existence-validate 設定時間為 "2026-02-01T10:00:00"
      And entity-non-existence-validate primary 建立資料表 tb_Attendance:
        | column      | type      | pk | notnull | default | auto | fk |
        | employee_id | BIGINT    | Y  |         |         |      |    |
        | work_date   | DATE      | Y  |         |         |      |    |
        | check_in    | TIMESTAMP |    |         |         |      |    |
        | check_out   | TIMESTAMP |    |         |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity | table         |
        | 出勤   | tb_Attendance |
      And entity-non-existence-validate 準備一個 出勤:
        | employeeId | workDate            | checkIn                      | checkOut                     |
        | 1          | @date("2026-02-01") | @time("2026-02-01T09:00:00") | @time("2026-02-01T18:00:00") |
      When entity-non-existence-validate 驗證 出勤 不存在:
        | employeeId | workDate            |
        | 1          | @date("2026-02-02") |
        | 2          | @date("2026-02-01") |
      Then entity-non-existence-validate 通過

  # ==================== VAR + TIME 混合場景 ====================

  Rule: 混合場景 - VAR + TIME

    @h2 @postgresql @mysql @mssql
    Scenario: 混合 - VAR + TIME 跨 entity 驗證不存在
      Given entity-non-existence-validate 設定時間為 "2026-02-01T10:00:00"
      And entity-non-existence-validate primary 建立資料表 tb_Project:
        | column     | type      | pk | notnull | default | auto | fk |
        | id         | BIGINT    | Y  |         |         | Y    |    |
        | name       | VARCHAR   |    | Y       |         |      |    |
        | created_at | TIMESTAMP |    |         |         |      |    |
      And entity-non-existence-validate primary 建立資料表 tb_Task:
        | column     | type      | pk | notnull | default | auto | fk |
        | id         | BIGINT    | Y  |         |         | Y    |    |
        | project_id | BIGINT    |    |         |         |      |    |
        | name       | VARCHAR   |    | Y       |         |      |    |
        | due_date   | TIMESTAMP |    |         |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity | table      |
        | 專案   | tb_Project |
        | 任務   | tb_Task    |
      And entity-non-existence-validate 準備一個 專案:
        | >projectId | name   | createdAt  |
        | <id        | 新專案 | @time(now) |
      And entity-non-existence-validate 準備一個 任務:
        | projectId  | name   | dueDate       |
        | $projectId | 任務一 | @time(now+7d) |
      When entity-non-existence-validate 驗證 任務 不存在:
        | projectId  | name   |
        | $projectId | 任務二 |
      Then entity-non-existence-validate 通過

    @h2 @postgresql @mysql @mssql
    Scenario: 混合 - 多資料庫 + VAR + TIME 驗證不存在
      Given entity-non-existence-validate 設定時間為 "2026-02-01T10:00:00"
      And entity-non-existence-validate primary 建立資料表 tb_Customer:
        | column     | type      | pk | notnull | default | auto | fk |
        | id         | BIGINT    | Y  |         |         | Y    |    |
        | name       | VARCHAR   |    | Y       |         |      |    |
        | created_at | TIMESTAMP |    |         |         |      |    |
      And entity-non-existence-validate secondary 建立資料表 tb_CustomerLog:
        | column      | type      | pk | notnull | default | auto | fk |
        | id          | BIGINT    | Y  |         |         | Y    |    |
        | customer_id | BIGINT    |    | Y       |         |      |    |
        | action      | VARCHAR   |    |         |         |      |    |
        | log_time    | TIMESTAMP |    |         |         |      |    |
      And entity-non-existence-validate primary entity_to_table_mapping:
        | entity | table       |
        | 客戶   | tb_Customer |
      And entity-non-existence-validate secondary entity_to_table_mapping:
        | entity   | table          |
        | 客戶日誌 | tb_CustomerLog |
      And entity-non-existence-validate 準備一個 客戶:
        | >customerId | name  | createdAt  |
        | <id         | Alice | @time(now) |
      And entity-non-existence-validate 準備一個 客戶日誌:
        | customerId  | action | logTime    |
        | $customerId | login  | @time(now) |
      When entity-non-existence-validate 驗證 客戶 不存在:
        | name |
        | Bob  |
      Then entity-non-existence-validate 通過
      When entity-non-existence-validate 驗證 客戶日誌 不存在:
        | customerId  | action |
        | $customerId | logout |
      Then entity-non-existence-validate 通過
