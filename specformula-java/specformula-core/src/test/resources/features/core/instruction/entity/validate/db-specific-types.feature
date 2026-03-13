@entity_validate
Feature: EntityValidate - 資料庫特定類型與精度
  測試各資料庫特有的資料類型以及不同精度的數值比較。

  # ==================== PostgreSQL 特定類型 ====================

  @postgresql
  Scenario: PostgreSQL - NUMERIC 高精度數值
    Given entity-validate primary 建立資料表 tb_FinancialData:
      | column        | type          | pk | notnull | default | auto | fk |
      | id            | BIGINT        | Y  |         |         |      |    |
      | amount        | NUMERIC(18,6) |    |         |         |      |    |
      | exchange_rate | NUMERIC(12,8) |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity   | table            |
      | 財務資料 | tb_FinancialData |
    And entity-validate 準備一個 財務資料:
      | id | amount           | exchangeRate   |
      | 1  | 123456.789012    | 31.12345678    |
    When entity-validate 驗證 財務資料 資料:
      | id | amount           | exchangeRate   |
      | 1  | 123456.789012    | 31.12345678    |
    Then entity-validate 通過

  @postgresql
  Scenario: PostgreSQL - SERIAL 自動遞增
    Given entity-validate primary 建立資料表 tb_Sequence:
      | column | type    | pk | notnull | default | auto | fk |
      | id     | SERIAL  | Y  |         |         |      |    |
      | name   | VARCHAR |    | Y       |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table       |
      | 序列   | tb_Sequence |
    And entity-validate 準備一個 序列:
      | name   |
      | 第一筆 |
      | 第二筆 |
    When entity-validate 驗證 序列 資料:
      | name   |
      | 第一筆 |
      | 第二筆 |
    Then entity-validate 通過

  @postgresql
  Scenario: PostgreSQL - UUID 類型
    Given entity-validate primary 建立資料表 tb_Session:
      | column     | type      | pk | notnull | default | auto | fk |
      | id         | BIGINT    | Y  |         |         |      |    |
      | session_id | UUID      |    |         |         |      |    |
      | user_name  | VARCHAR   |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table      |
      | 會話   | tb_Session |
    And entity-validate 準備一個 會話:
      | id | sessionId                            | userName |
      | 1  | 550e8400-e29b-41d4-a716-446655440000 | Alice    |
    When entity-validate 驗證 會話 資料:
      | id | sessionId                            | userName |
      | 1  | 550e8400-e29b-41d4-a716-446655440000 | Alice    |
    Then entity-validate 通過

  @postgresql
  Scenario: PostgreSQL - JSONB 類型
    Given entity-validate primary 建立資料表 tb_Config:
      | column  | type    | pk | notnull | default | auto | fk |
      | id      | BIGINT  | Y  |         |         |      |    |
      | name    | VARCHAR |    | Y       |         |      |    |
      | setting | JSONB   |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table     |
      | 設定   | tb_Config |
    And entity-validate 準備一個 設定:
      | id | name   | setting                    |
      | 1  | 系統   | {"theme":"dark","lang":"zh"} |
    When entity-validate 驗證 設定 資料:
      | id | name   |
      | 1  | 系統   |
    Then entity-validate 通過

  @postgresql
  Scenario: PostgreSQL - BYTEA 二進制類型
    Given entity-validate primary 建立資料表 tb_Binary:
      | column | type    | pk | notnull | default | auto | fk |
      | id     | BIGINT  | Y  |         |         |      |    |
      | name   | VARCHAR |    | Y       |         |      |    |
      | data   | BYTEA   |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity   | table     |
      | 二進制   | tb_Binary |
    And entity-validate 準備一個 二進制:
      | id | name   |
      | 1  | 測試檔 |
    When entity-validate 驗證 二進制 資料:
      | id | name   |
      | 1  | 測試檔 |
    Then entity-validate 通過

  # ==================== MySQL 特定類型 ====================

  @mysql
  Scenario: MySQL - TINYINT/SMALLINT/MEDIUMINT 類型
    Given entity-validate primary 建立資料表 tb_NumericTypes:
      | column     | type      | pk | notnull | default | auto | fk |
      | id         | BIGINT    | Y  |         |         |      |    |
      | tiny_val   | TINYINT   |    |         |         |      |    |
      | small_val  | SMALLINT  |    |         |         |      |    |
      | medium_val | MEDIUMINT |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity   | table           |
      | 數值類型 | tb_NumericTypes |
    And entity-validate 準備一個 數值類型:
      | id | tinyVal | smallVal | mediumVal |
      | 1  | 127     | 32767    | 8388607   |
    When entity-validate 驗證 數值類型 資料:
      | id | tinyVal | smallVal | mediumVal |
      | 1  | 127     | 32767    | 8388607   |
    Then entity-validate 通過

  @mysql
  Scenario: MySQL - UNSIGNED 無符號整數
    Given entity-validate primary 建立資料表 tb_UnsignedTypes:
      | column       | type             | pk | notnull | default | auto | fk |
      | id           | BIGINT           | Y  |         |         |      |    |
      | unsigned_int | INT UNSIGNED     |    |         |         |      |    |
      | unsigned_big | BIGINT UNSIGNED  |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity     | table            |
      | 無符號類型 | tb_UnsignedTypes |
    And entity-validate 準備一個 無符號類型:
      | id | unsignedInt | unsignedBig          |
      | 1  | 4294967295  | 18446744073709551615 |
    When entity-validate 驗證 無符號類型 資料:
      | id | unsignedInt | unsignedBig          |
      | 1  | 4294967295  | 18446744073709551615 |
    Then entity-validate 通過

  @mysql
  Scenario: MySQL - YEAR 類型
    Given entity-validate primary 建立資料表 tb_YearData:
      | column     | type    | pk | notnull | default | auto | fk |
      | id         | BIGINT  | Y  |         |         |      |    |
      | birth_year | YEAR    |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity   | table       |
      | 年份資料 | tb_YearData |
    And entity-validate 準備一個 年份資料:
      | id | birthYear |
      | 1  | 2026      |
    When entity-validate 驗證 年份資料 資料:
      | id | birthYear |
      | 1  | 2026      |
    Then entity-validate 通過

  @mysql
  Scenario: MySQL - TEXT 變體類型
    Given entity-validate primary 建立資料表 tb_TextTypes:
      | column      | type       | pk | notnull | default | auto | fk |
      | id          | BIGINT     | Y  |         |         |      |    |
      | tiny_text   | TINYTEXT   |    |         |         |      |    |
      | medium_text | MEDIUMTEXT |    |         |         |      |    |
      | long_text   | LONGTEXT   |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity   | table        |
      | 文字類型 | tb_TextTypes |
    And entity-validate 準備一個 文字類型:
      | id | tinyText | mediumText | longText             |
      | 1  | 短文     | 中等長度文章 | 這是一段很長的文章內容 |
    When entity-validate 驗證 文字類型 資料:
      | id | tinyText | mediumText | longText             |
      | 1  | 短文     | 中等長度文章 | 這是一段很長的文章內容 |
    Then entity-validate 通過

  @mysql
  Scenario: MySQL - DATETIME(6) 微秒精度
    Given entity-validate primary 建立資料表 tb_PreciseTime:
      | column      | type        | pk | notnull | default | auto | fk |
      | id          | BIGINT      | Y  |         |         |      |    |
      | precise_ts  | DATETIME(6) |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity   | table          |
      | 精確時間 | tb_PreciseTime |
    And entity-validate 準備一個 精確時間:
      | id | preciseTs                  |
      | 1  | 2026-01-15T10:30:45.123456 |
    When entity-validate 驗證 精確時間 資料:
      | id | preciseTs  |
      | 1  | &isNotNull |
    Then entity-validate 通過

  # ==================== MSSQL 特定類型 ====================

  @mssql
  Scenario: MSSQL - MONEY/SMALLMONEY 類型
    Given entity-validate primary 建立資料表 tb_MoneyData:
      | column      | type       | pk | notnull | default | auto | fk |
      | id          | BIGINT     | Y  |         |         |      |    |
      | price       | MONEY      |    |         |         |      |    |
      | small_price | SMALLMONEY |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity   | table        |
      | 貨幣資料 | tb_MoneyData |
    And entity-validate 準備一個 貨幣資料:
      | id | price       | smallPrice |
      | 1  | 922337.2036 | 214748.3647|
    When entity-validate 驗證 貨幣資料 資料:
      | id | price       | smallPrice |
      | 1  | 922337.2036 | 214748.3647|
    Then entity-validate 通過

  @mssql
  Scenario: MSSQL - UNIQUEIDENTIFIER 類型
    Given entity-validate primary 建立資料表 tb_GuidData:
      | column   | type             | pk | notnull | default | auto | fk |
      | id       | BIGINT           | Y  |         |         |      |    |
      | guid_val | UNIQUEIDENTIFIER |    |         |         |      |    |
      | name     | NVARCHAR(100)    |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity   | table       |
      | GUID資料 | tb_GuidData |
    And entity-validate 準備一個 GUID資料:
      | id | guidVal                              | name  |
      | 1  | 550E8400-E29B-41D4-A716-446655440000 | Alice |
    When entity-validate 驗證 GUID資料 資料:
      | id | name  |
      | 1  | Alice |
    Then entity-validate 通過

  @mssql
  Scenario: MSSQL - NVARCHAR/NCHAR Unicode 類型
    Given entity-validate primary 建立資料表 tb_UnicodeData:
      | column    | type           | pk | notnull | default | auto | fk |
      | id        | BIGINT         | Y  |         |         |      |    |
      | nvar_text | NVARCHAR(100)  |    |         |         |      |    |
      | nchar_val | NCHAR(10)      |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity     | table          |
      | Unicode資料| tb_UnicodeData |
    And entity-validate 準備一個 Unicode資料:
      | id | nvarText         | ncharVal |
      | 1  | 中文繁體測試🎉   | 固定長度   |
    When entity-validate 驗證 Unicode資料 資料:
      | id | nvarText         |
      | 1  | 中文繁體測試🎉   |
    Then entity-validate 通過

  @mssql
  Scenario: MSSQL - DATETIME2 高精度時間
    Given entity-validate primary 建立資料表 tb_DateTime2:
      | column    | type         | pk | notnull | default | auto | fk |
      | id        | BIGINT       | Y  |         |         |      |    |
      | dt2_val   | DATETIME2(7) |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity       | table        |
      | 高精度時間   | tb_DateTime2 |
    And entity-validate 準備一個 高精度時間:
      | id | dt2Val                     |
      | 1  | 2026-01-15T10:30:45.1234567|
    When entity-validate 驗證 高精度時間 資料:
      | id | dt2Val     |
      | 1  | &isNotNull |
    Then entity-validate 通過

  @mssql
  Scenario: MSSQL - DATETIMEOFFSET 時區時間
    Given entity-validate primary 建立資料表 tb_TzTime:
      | column   | type           | pk | notnull | default | auto | fk |
      | id       | BIGINT         | Y  |         |         |      |    |
      | tz_time  | DATETIMEOFFSET |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity   | table      |
      | 時區時間 | tb_TzTime  |
    And entity-validate 準備一個 時區時間:
      | id | tzTime                        |
      | 1  | 2026-01-15T10:30:45.000+08:00 |
    When entity-validate 驗證 時區時間 資料:
      | id | tzTime     |
      | 1  | &isNotNull |
    Then entity-validate 通過

  # ==================== H2 特定類型 ====================

  @h2
  Scenario: H2 - UUID 類型
    Given entity-validate primary 建立資料表 tb_H2Uuid:
      | column   | type    | pk | notnull | default | auto | fk |
      | id       | BIGINT  | Y  |         |         |      |    |
      | uuid_val | UUID    |    |         |         |      |    |
      | name     | VARCHAR |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity  | table     |
      | H2UUID  | tb_H2Uuid |
    And entity-validate 準備一個 H2UUID:
      | id | uuidVal                              | name  |
      | 1  | 550e8400-e29b-41d4-a716-446655440000 | Alice |
    When entity-validate 驗證 H2UUID 資料:
      | id | uuidVal                              | name  |
      | 1  | 550e8400-e29b-41d4-a716-446655440000 | Alice |
    Then entity-validate 通過

  @h2
  Scenario: H2 - 自動遞增主鍵
    Given entity-validate primary 建立資料表 tb_H2Identity:
      | column | type    | pk | notnull | default | auto | fk |
      | id     | BIGINT  | Y  |         |         | Y    |    |
      | name   | VARCHAR |    | Y       |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity     | table         |
      | H2Identity | tb_H2Identity |
    And entity-validate 準備一個 H2Identity:
      | name   |
      | 第一筆 |
      | 第二筆 |
    When entity-validate 驗證 H2Identity 資料:
      | name   |
      | 第一筆 |
      | 第二筆 |
    Then entity-validate 通過

  # ==================== 精度比較測試 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: 精度比較 - DECIMAL 不同精度
    Given entity-validate primary 建立資料表 tb_DecimalPrecision:
      | column   | type          | pk | notnull | default | auto | fk |
      | id       | BIGINT        | Y  |         |         |      |    |
      | low_prec | DECIMAL(10,2) |    |         |         |      |    |
      | high_prec| DECIMAL(18,6) |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity     | table              |
      | DECIMAL精度| tb_DecimalPrecision|
    And entity-validate 準備一個 DECIMAL精度:
      | id | lowPrec | highPrec       |
      | 1  | 1234.56 | 1234.567890    |
    When entity-validate 驗證 DECIMAL精度 資料:
      | id | lowPrec | highPrec       |
      | 1  | 1234.56 | 1234.567890    |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: 精度比較 - DECIMAL 使用 CAS 比較
    Given entity-validate primary 建立資料表 tb_DecimalCas:
      | column | type          | pk | notnull | default | auto | fk |
      | id     | BIGINT        | Y  |         |         |      |    |
      | amount | DECIMAL(10,2) |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity     | table         |
      | DECIMAL_CAS| tb_DecimalCas |
    And entity-validate 準備一個 DECIMAL_CAS:
      | id | amount  |
      | 1  | 1500.50 |
    When entity-validate 驗證 DECIMAL_CAS 資料:
      | id | amount                 |
      | 1  | &between(1500, 1501)   |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: 精度比較 - 浮點數精度
    Given entity-validate primary 建立資料表 tb_FloatPrecision:
      | column     | type   | pk | notnull | default | auto | fk |
      | id         | BIGINT | Y  |         |         |      |    |
      | float_val  | FLOAT  |    |         |         |      |    |
      | double_val | DOUBLE |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity   | table            |
      | 浮點精度 | tb_FloatPrecision|
    And entity-validate 準備一個 浮點精度:
      | id | floatVal | doubleVal        |
      | 1  | 3.14159  | 3.14159265358979 |
    When entity-validate 驗證 浮點精度 資料:
      | id | floatVal    | doubleVal          |
      | 1  | &gt(3.14)   | &gt(3.14159265)    |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: 精度比較 - 時間秒級精度
    Given entity-validate primary 建立資料表 tb_TimePrecision:
      | column      | type      | pk | notnull | default | auto | fk |
      | id          | BIGINT    | Y  |         |         |      |    |
      | created_at  | TIMESTAMP |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity   | table            |
      | 時間精度 | tb_TimePrecision |
    And entity-validate 準備一個 時間精度:
      | id | createdAt           |
      | 1  | 2026-01-15T10:30:45 |
    When entity-validate 驗證 時間精度 資料:
      | id | createdAt           |
      | 1  | 2026-01-15T10:30:45 |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: 精度比較 - 日期精度
    Given entity-validate primary 建立資料表 tb_DatePrecision:
      | column     | type   | pk | notnull | default | auto | fk |
      | id         | BIGINT | Y  |         |         |      |    |
      | event_date | DATE   |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity   | table            |
      | 日期精度 | tb_DatePrecision |
    And entity-validate 準備一個 日期精度:
      | id | eventDate  |
      | 1  | 2026-01-15 |
    When entity-validate 驗證 日期精度 資料:
      | id | eventDate  |
      | 1  | 2026-01-15 |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: 精度比較 - 整數邊界值
    Given entity-validate primary 建立資料表 tb_IntBoundary:
      | column    | type     | pk | notnull | default | auto | fk |
      | id        | BIGINT   | Y  |         |         |      |    |
      | int_val   | INT      |    |         |         |      |    |
      | bigint_val| BIGINT   |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity   | table          |
      | 整數邊界 | tb_IntBoundary |
    And entity-validate 準備一個 整數邊界:
      | id | intVal      | bigintVal            |
      | 1  | 2147483647  | 9223372036854775807  |
    When entity-validate 驗證 整數邊界 資料:
      | id | intVal      | bigintVal            |
      | 1  | 2147483647  | 9223372036854775807  |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: 精度比較 - 負數與零
    Given entity-validate primary 建立資料表 tb_NegativeZero:
      | column     | type          | pk | notnull | default | auto | fk |
      | id         | BIGINT        | Y  |         |         |      |    |
      | negative   | DECIMAL(10,2) |    |         |         |      |    |
      | zero_val   | DECIMAL(10,2) |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity   | table           |
      | 負數零值 | tb_NegativeZero |
    And entity-validate 準備一個 負數零值:
      | id | negative  | zeroVal |
      | 1  | -1234.56  | 0.00    |
    When entity-validate 驗證 負數零值 資料:
      | id | negative  | zeroVal |
      | 1  | -1234.56  | 0.00    |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: 精度比較 - CAS 數值範圍驗證
    Given entity-validate primary 建立資料表 tb_CasRange:
      | column | type          | pk | notnull | default | auto | fk |
      | id     | BIGINT        | Y  |         |         |      |    |
      | score  | DECIMAL(5,2)  |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity   | table       |
      | CAS範圍  | tb_CasRange |
    And entity-validate 準備一個 CAS範圍:
      | id | score |
      | 1  | 85.50 |
      | 2  | 92.00 |
      | 3  | 78.25 |
    When entity-validate 驗證 CAS範圍 資料:
      | id | score             |
      | 1  | &between(80, 90)  |
      | 2  | &ge(90)           |
      | 3  | &lt(80)           |
    Then entity-validate 通過
