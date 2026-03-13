@spec.data
Feature: TableDefinition SELECT SQL 產生 (PK 查詢)

  Scenario: 單一 PK 的 SELECT SQL
    Given spec.data TableDefinition 為 "users" 包含欄位:
      | name     | type         | primaryKey | autoIncrement |
      | id       | BIGINT       | true       | true          |
      | username | VARCHAR(100) | false      | false         |
      | email    | VARCHAR(255) | false      | false         |
    Then spec.data selectSql 應為:
      """
      SELECT id, username, email FROM users WHERE id=?
      """
    And spec.data selectWhereColumnIndex 大小應為 1
    And spec.data selectWhereColumnIndex 應包含 "id"

  Scenario: 複合 PK 的 SELECT SQL
    Given spec.data TableDefinition 為 "order_items" 包含欄位:
      | name       | type          | primaryKey | autoIncrement |
      | order_id   | BIGINT        | true       | false         |
      | product_id | BIGINT        | true       | false         |
      | quantity   | INT           | false      | false         |
      | price      | DECIMAL(10,2) | false      | false         |
    Then spec.data selectSql 應為:
      """
      SELECT order_id, product_id, quantity, price FROM order_items WHERE order_id=? AND product_id=?
      """
    And spec.data selectWhereColumnIndex 大小應為 2
    And spec.data selectWhereColumnIndex 應包含 "order_id"
    And spec.data selectWhereColumnIndex 應包含 "product_id"

  Scenario: 無 PK 的 SELECT SQL
    Given spec.data TableDefinition 為 "counters" 包含欄位:
      | name  | type   | primaryKey | autoIncrement |
      | value | BIGINT | false      | false         |
    Then spec.data selectSql 應為:
      """
      SELECT value FROM counters
      """
    And spec.data selectWhereColumnIndex 大小應為 0

  Scenario: 新增欄位後 SELECT SQL 更新
    Given spec.data TableDefinition 為 "logs" 包含欄位:
      | name    | type         | primaryKey | autoIncrement |
      | id      | BIGINT       | true       | true          |
      | message | VARCHAR(500) | false      | false         |
    When spec.data 新增欄位 "level" 類型 "VARCHAR(20)"
    Then spec.data selectSql 應包含 "level"
    And spec.data selectSql 應為:
      """
      SELECT id, message, level FROM logs WHERE id=?
      """
