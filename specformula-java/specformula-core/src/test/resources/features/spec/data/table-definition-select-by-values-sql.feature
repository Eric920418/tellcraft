@spec.data
Feature: TableDefinition SELECT SQL 產生 (非 PK 條件查詢)

  Scenario: 單一條件欄位的 SELECT SQL
    Given spec.data TableDefinition 為 "logs" 包含欄位:
      | name       | type         | primaryKey | autoIncrement |
      | id         | BIGINT       | true       | true          |
      | message    | VARCHAR(500) | false      | false         |
      | level      | VARCHAR(20)  | false      | false         |
      | created_at | TIMESTAMP    | false      | false         |
    When spec.data 設定查詢欄位為:
      | column |
      | level  |
    Then spec.data selectByValuesSql 應為:
      """
      SELECT id, message, level, created_at FROM logs WHERE (? IS NULL OR level=?)
      """
    And spec.data selectByValuesIndex 應包含:
      | column | indices |
      | level  | 1,2     |

  Scenario: 多條件欄位的 SELECT SQL
    Given spec.data TableDefinition 為 "logs" 包含欄位:
      | name       | type         | primaryKey | autoIncrement |
      | id         | BIGINT       | true       | true          |
      | message    | VARCHAR(500) | false      | false         |
      | level      | VARCHAR(20)  | false      | false         |
      | source     | VARCHAR(100) | false      | false         |
      | created_at | TIMESTAMP    | false      | false         |
    When spec.data 設定查詢欄位為:
      | column  |
      | level   |
      | source  |
    Then spec.data selectByValuesSql 應為:
      """
      SELECT id, message, level, source, created_at FROM logs WHERE (? IS NULL OR level=?) AND (? IS NULL OR source=?)
      """
    And spec.data selectByValuesIndex 應包含:
      | column | indices |
      | level  | 1,2     |
      | source | 3,4     |

  Scenario: 無查詢欄位的 SELECT SQL
    Given spec.data TableDefinition 為 "logs" 包含欄位:
      | name       | type         | primaryKey | autoIncrement |
      | id         | BIGINT       | true       | true          |
      | message    | VARCHAR(500) | false      | false         |
      | created_at | TIMESTAMP    | false      | false         |
    When spec.data 設定查詢欄位為:
      | column |
    Then spec.data selectByValuesSql 應為:
      """
      SELECT id, message, created_at FROM logs
      """

  Scenario: 三個條件欄位的索引驗證
    Given spec.data TableDefinition 為 "events" 包含欄位:
      | name       | type         | primaryKey | autoIncrement |
      | id         | BIGINT       | true       | true          |
      | event_type | VARCHAR(50)  | false      | false         |
      | user_id    | BIGINT       | false      | false         |
      | status     | VARCHAR(20)  | false      | false         |
      | created_at | TIMESTAMP    | false      | false         |
    When spec.data 設定查詢欄位為:
      | column     |
      | event_type |
      | user_id    |
      | status     |
    Then spec.data selectByValuesSql 應為:
      """
      SELECT id, event_type, user_id, status, created_at FROM events WHERE (? IS NULL OR event_type=?) AND (? IS NULL OR user_id=?) AND (? IS NULL OR status=?)
      """
    And spec.data selectByValuesIndex 應包含:
      | column     | indices |
      | event_type | 1,2     |
      | user_id    | 3,4     |
      | status     | 5,6     |
