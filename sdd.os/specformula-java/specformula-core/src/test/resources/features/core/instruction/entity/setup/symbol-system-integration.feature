@entity_setup
Feature: EntitySetup - 符號系統整合
  測試 EntitySetup 與 TIME-System、VAR-System 的整合。
  包含時間表達式、變數擷取與引用等場景。

  # ==================== TIME-System 整合 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: @time() - 絕對時間（ISO 格式）
    Given entity-setup primary 建立資料表 tb_Event:
      | column     | type      | pk | notnull | default | auto | fk |
      | id         | BIGINT    | Y  |         |         |      |    |
      | event_name | VARCHAR   |    | Y       |         |      |    |
      | event_time | TIMESTAMP |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table    |
      | 事件   | tb_Event |
    When entity-setup 準備一個 事件:
      | id | eventName | eventTime                    |
      | 1  | 會議      | @time("2026-01-15T09:00:00") |
    Then entity-setup tb_Event 資料表應有資料:
      | id | event_name | event_time          |
      | 1  | 會議       | 2026-01-15T09:00:00 |

  @h2 @postgresql @mysql @mssql
  Scenario: @time() - 絕對時間（含時區）
    Given entity-setup primary 建立資料表 tb_Schedule:
      | column        | type      | pk | notnull | default | auto | fk |
      | id            | BIGINT    | Y  |         |         |      |    |
      | schedule_name | VARCHAR   |    | Y       |         |      |    |
      | start_time    | TIMESTAMP |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table       |
      | 排程   | tb_Schedule |
    When entity-setup 準備一個 排程:
      | id | scheduleName | startTime                          |
      | 1  | 早會         | @time("2026-01-15T08:00:00+08:00") |
    Then entity-setup tb_Schedule 資料表應有資料:
      | id | schedule_name | start_time          |
      | 1  | 早會          | 2026-01-15T08:00:00 |

  @h2 @postgresql @mysql @mssql
  Scenario: @time() - 相對時間（now-1d）
    Given entity-setup 設定時間為 "2026-02-01T10:00:00"
    And entity-setup primary 建立資料表 tb_Log:
      | column   | type      | pk | notnull | default | auto | fk |
      | id       | BIGINT    | Y  |         |         |      |    |
      | log_time | TIMESTAMP |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table  |
      | 日誌   | tb_Log |
    When entity-setup 準備一個 日誌:
      | id | logTime       |
      | 1  | @time(now-1d) |
    Then entity-setup tb_Log 資料表應有資料:
      | id | log_time            |
      | 1  | 2026-01-31T10:00:00 |

  @h2 @postgresql @mysql @mssql
  Scenario: @time() - 複合相對時間（now+2h-30m）
    Given entity-setup 設定時間為 "2026-02-01T10:00:00"
    And entity-setup primary 建立資料表 tb_Reminder:
      | column      | type      | pk | notnull | default | auto | fk |
      | id          | BIGINT    | Y  |         |         |      |    |
      | remind_time | TIMESTAMP |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table       |
      | 提醒   | tb_Reminder |
    When entity-setup 準備一個 提醒:
      | id | remindTime        |
      | 1  | @time(now+2h-30m) |
    Then entity-setup tb_Reminder 資料表應有資料:
      | id | remind_time         |
      | 1  | 2026-02-01T11:30:00 |

  @h2 @postgresql @mysql @mssql
  Scenario: @date() - 日期表達式
    Given entity-setup primary 建立資料表 tb_Holiday:
      | column       | type    | pk | notnull | default | auto | fk |
      | id           | BIGINT  | Y  |         |         |      |    |
      | holiday_name | VARCHAR |    | Y       |         |      |    |
      | holiday_date | DATE    |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table      |
      | 假日   | tb_Holiday |
    When entity-setup 準備一個 假日:
      | id | holidayName | holidayDate         |
      | 1  | 元旦        | @date("2026-01-01") |
      | 2  | 春節        | @date("2026-02-17") |
    Then entity-setup tb_Holiday 資料表應有資料:
      | id | holiday_name | holiday_date |
      | 1  | 元旦         | 2026-01-01   |
      | 2  | 春節         | 2026-02-17   |

  @h2 @postgresql @mysql @mssql
  Scenario: @localtime() - 時間表達式
    Given entity-setup primary 建立資料表 tb_WorkHour:
      | column     | type   | pk | notnull | default | auto | fk |
      | id         | BIGINT | Y  |         |         |      |    |
      | start_time | TIME   |    |         |         |      |    |
      | end_time   | TIME   |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity   | table       |
      | 工作時段 | tb_WorkHour |
    When entity-setup 準備一個 工作時段:
      | id | startTime              | endTime                |
      | 1  | @localtime("09:00:00") | @localtime("18:00:00") |
    Then entity-setup tb_WorkHour 資料表應有資料:
      | id | start_time | end_time |
      | 1  | 09:00:00   | 18:00:00 |

  # ==================== VAR-System 整合 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: >contextKey 和 <executionKey - 擷取自動生成的 id
    Given entity-setup primary 建立資料表 tb_Category:
      | column | type    | pk | notnull | default | auto | fk |
      | id     | BIGINT  | Y  |         |         | Y    |    |
      | name   | VARCHAR |    | Y       |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table       |
      | 分類   | tb_Category |
    When entity-setup 準備一個 分類:
      | >categoryId | name     |
      | <id         | 電子產品 |
    Then entity-setup context 應有變數:
      | categoryId |
      | &gt(0)     |
    And entity-setup tb_Category 資料表應有資料:
      | name     |
      | 電子產品 |

  @h2 @postgresql @mysql @mssql
  Scenario: 巢狀 contextKey（含點號）
    Given entity-setup primary 建立資料表 tb_Product:
      | column | type    | pk | notnull | default | auto | fk |
      | id     | BIGINT  | Y  |         |         | Y    |    |
      | name   | VARCHAR |    | Y       |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table      |
      | 商品   | tb_Product |
    When entity-setup 準備一個 商品:
      | >Product.id | name |
      | <id         | 手機 |
    Then entity-setup context 應有變數:
      | Product.id |
      | &gt(0)     |

  @h2 @postgresql @mysql @mssql
  Scenario: $variable - 引用已存在的變數
    Given entity-setup primary 建立資料表 tb_Employee:
      | column     | type    | pk | notnull | default | auto | fk |
      | id         | BIGINT  | Y  |         |         |      |    |
      | manager_id | BIGINT  |    |         |         |      |    |
      | name       | VARCHAR |    | Y       |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table       |
      | 員工   | tb_Employee |
    And entity-setup context 變數 "managerId" 為 999
    When entity-setup 準備一個 員工:
      | id | managerId  | name  |
      | 1  | $managerId | Alice |
    Then entity-setup tb_Employee 資料表應有資料:
      | id | manager_id | name  |
      | 1  | 999        | Alice |

  @h2 @postgresql @mysql @mssql
  Scenario: 多個變數擷取
    Given entity-setup primary 建立資料表 tb_Order:
      | column       | type          | pk | notnull | default | auto | fk |
      | id           | BIGINT        | Y  |         |         | Y    |    |
      | order_no     | VARCHAR       |    | Y       |         |      |    |
      | total_amount | DECIMAL(10,2) |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table    |
      | 訂單   | tb_Order |
    When entity-setup 準備一個 訂單:
      | >orderId | >orderNumber | orderNo | totalAmount |
      | <id      | <orderNo     | ORD-001 | 1500.00     |
    Then entity-setup context 應有變數:
      | orderId | orderNumber |
      | &gt(0)  | ORD-001     |

  # ==================== VAR-System + TIME-System 整合 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: 完整整合 - 跨 entity 關聯 + VAR-System + TIME-System
    Given entity-setup 設定時間為 "2026-02-01T10:00:00"
    And entity-setup primary 建立資料表 tb_Project:
      | column       | type      | pk | notnull | default | auto | fk |
      | id           | BIGINT    | Y  |         |         | Y    |    |
      | project_name | VARCHAR   |    | Y       |         |      |    |
      | start_date   | DATE      |    |         |         |      |    |
      | created_at   | TIMESTAMP |    |         |         |      |    |
    And entity-setup primary 建立資料表 tb_Task:
      | column     | type      | pk | notnull | default | auto | fk            |
      | id         | BIGINT    | Y  |         |         | Y    |               |
      | project_id | BIGINT    |    |         |         |      | tb_Project.id |
      | task_name  | VARCHAR   |    | Y       |         |      |               |
      | due_date   | TIMESTAMP |    |         |         |      |               |
    And entity-setup primary entity_to_table_mapping:
      | entity | table      |
      | 專案   | tb_Project |
      | 任務   | tb_Task    |
    When entity-setup 準備一個 專案:
      | >projectId | projectName | startDate           | createdAt  |
      | <id        | 新專案      | @date("2026-02-01") | @time(now) |
    And entity-setup 準備一個 任務:
      | >taskId | projectId  | taskName | dueDate       |
      | <id     | $projectId | 任務一   | @time(now+7d) |
    Then entity-setup context 應有變數:
      | projectId | taskId |
      | &gt(0)    | &gt(0) |
    And entity-setup tb_Project 資料表應有資料:
      | project_name | start_date | created_at          |
      | 新專案       | 2026-02-01 | 2026-02-01T10:00:00 |
    And entity-setup tb_Task 資料表應有資料:
      | task_name | due_date            |
      | 任務一    | 2026-02-08T10:00:00 |

  @h2 @postgresql @mysql @mssql
  Scenario: 複雜變數鏈 - 多層關聯
    Given entity-setup primary 建立資料表 tb_Company:
      | column       | type    | pk | notnull | default | auto | fk |
      | id           | BIGINT  | Y  |         |         | Y    |    |
      | company_name | VARCHAR |    | Y       |         |      |    |
    And entity-setup primary 建立資料表 tb_Department:
      | column          | type    | pk | notnull | default | auto | fk            |
      | id              | BIGINT  | Y  |         |         | Y    |               |
      | company_id      | BIGINT  |    |         |         |      | tb_Company.id |
      | department_name | VARCHAR |    | Y       |         |      |               |
    And entity-setup primary 建立資料表 tb_Staff:
      | column        | type    | pk | notnull | default | auto | fk               |
      | id            | BIGINT  | Y  |         |         | Y    |                  |
      | department_id | BIGINT  |    |         |         |      | tb_Department.id |
      | staff_name    | VARCHAR |    | Y       |         |      |                  |
    And entity-setup primary entity_to_table_mapping:
      | entity | table         |
      | 公司   | tb_Company    |
      | 部門   | tb_Department |
      | 員工   | tb_Staff      |
    When entity-setup 準備一個 公司:
      | >companyId | companyName |
      | <id        | ABC 公司    |
    And entity-setup 準備一個 部門:
      | >departmentId | companyId  | departmentName |
      | <id           | $companyId | 研發部         |
    And entity-setup 準備一個 員工:
      | >staffId | departmentId  | staffName |
      | <id      | $departmentId | 王小明    |
    Then entity-setup context 應有變數:
      | companyId | departmentId | staffId |
      | &gt(0)    | &gt(0)       | &gt(0)  |
    And entity-setup tb_Company 資料表應有資料:
      | company_name |
      | ABC 公司     |
    And entity-setup tb_Department 資料表應有資料:
      | department_name |
      | 研發部          |
    And entity-setup tb_Staff 資料表應有資料:
      | staff_name |
      | 王小明     |

  # ==================== 錯誤處理 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: 缺少 entity 名稱應拋出例外
    Given entity-setup primary 建立資料表 tb_Test:
      | column | type   | pk | notnull | default | auto | fk |
      | id     | BIGINT | Y  |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table   |
      | 測試   | tb_Test |
    When entity-setup 準備一個 "":
      | id |
      | 1  |
    Then entity-setup 應拋出例外:
      | message          |
      | 缺少 entity 名稱 |

  @h2 @postgresql @mysql @mssql
  Scenario: 找不到 entity 應列出可用 entities
    Given entity-setup primary 建立資料表 tb_Known:
      | column | type   | pk | notnull | default | auto | fk |
      | id     | BIGINT | Y  |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity   | table    |
      | 已知實體 | tb_Known |
    When entity-setup 準備一個 未知實體:
      | id |
      | 1  |
    Then entity-setup 應拋出例外:
      | message       |
      | 找不到 entity |
      | 已知實體      |

  @h2 @postgresql @mysql @mssql
  Scenario: VAR-System >contextKey 沒有對應的 <executionKey
    Given entity-setup primary 建立資料表 tb_Test:
      | column | type    | pk | notnull | default | auto | fk |
      | id     | BIGINT  | Y  |         |         | Y    |    |
      | name   | VARCHAR |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table   |
      | 測試   | tb_Test |
    When entity-setup 準備一個 測試:
      | >savedId | name   |
      | wrongVal | 測試值 |
    Then entity-setup 應拋出例外:
      | message                 |
      | 不是 <executionKey 格式 |

  @h2 @mysql @postgresql @mssql
  Scenario: VAR-System <executionKey 沒有對應的 >contextKey
    # 當 data row 使用 <executionKey 但 header 沒有對應的 >contextKey 時
    # 會被當作一般值，在型別轉換時拋出錯誤
    Given entity-setup primary 建立資料表 tb_Test:
      | column | type    | pk | notnull | default | auto | fk |
      | id     | BIGINT  | Y  |         |         |      |    |
      | name   | VARCHAR |    |         |         |      |    |
    And entity-setup primary entity_to_table_mapping:
      | entity | table   |
      | 測試   | tb_Test |
    When entity-setup 準備一個 測試:
      | name   | id  |
      | 測試值 | <id |
    Then entity-setup 應拋出例外:
      | message                |
      | 無法將值 '<id' 轉換為類型 |
