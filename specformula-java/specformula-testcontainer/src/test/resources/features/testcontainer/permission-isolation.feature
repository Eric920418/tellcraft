@slow
Feature: Testcontainer 權限隔離驗證
  當 permission 設為 isolated 時，每個 DataSource 應使用專屬使用者，無法存取其他資料庫。
  當 permission 設為 shared 時，所有 DataSource 使用相同帳號，可互相存取。
  支援驗證 postgresql、mysql、mssql、h2 四種資料庫類型。

  # ==================== PostgreSQL ====================

  Scenario: PostgreSQL isolated 模式 - 無法跨庫存取
    Given 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          permission: isolated
          source:
            - name: order_db
              resource_path: specs/data/order
              project_path: path/to/order
              db_type: postgresql
            - name: user_db
              resource_path: specs/data/user
              project_path: path/to/user
              db_type: postgresql
      instructions: []
      """
    And 啟動 Testcontainer 並建立所有 DataSource
    And 在 "order_db" 執行 SQL:
      """sql
      CREATE TABLE orders (id INT PRIMARY KEY, name VARCHAR(100));
      INSERT INTO orders VALUES (1, 'Order A');
      """
    And 在 "user_db" 執行 SQL:
      """sql
      CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));
      INSERT INTO users VALUES (1, 'User A');
      """
    When 使用 "order_db" 的連線查詢 "SELECT * FROM orders"
    Then 應該成功存取
    # PostgreSQL 不支援跨資料庫 SQL 查詢，改用連線驗證方式
    When 使用 "order_db" 的憑證連線到 "user_db"
    Then 應該拋出權限不足的錯誤

  Scenario: PostgreSQL shared 模式 - 可以跨庫存取
    Given 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          permission: shared
          source:
            - name: order_db
              resource_path: specs/data/order
              project_path: path/to/order
              db_type: postgresql
            - name: user_db
              resource_path: specs/data/user
              project_path: path/to/user
              db_type: postgresql
      instructions: []
      """
    And 啟動 Testcontainer 並建立所有 DataSource
    And 在 "order_db" 執行 SQL:
      """sql
      CREATE TABLE orders (id INT PRIMARY KEY, name VARCHAR(100));
      INSERT INTO orders VALUES (1, 'Order A');
      """
    And 在 "user_db" 執行 SQL:
      """sql
      CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));
      INSERT INTO users VALUES (1, 'User A');
      """
    When 使用 "order_db" 的連線查詢 "SELECT * FROM orders"
    Then 應該成功存取
    # PostgreSQL 不支援跨資料庫 SQL 查詢，改用連線驗證方式
    When 使用 "order_db" 的憑證連線到 "user_db"
    Then 應該成功存取

  # ==================== MySQL ====================

  Scenario: MySQL isolated 模式 - 無法跨庫存取
    Given 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          permission: isolated
          source:
            - name: order_db
              resource_path: specs/data/order
              project_path: path/to/order
              db_type: mysql
            - name: user_db
              resource_path: specs/data/user
              project_path: path/to/user
              db_type: mysql
      instructions: []
      """
    And 啟動 Testcontainer 並建立所有 DataSource
    And 在 "order_db" 執行 SQL:
      """sql
      CREATE TABLE orders (id INT PRIMARY KEY, name VARCHAR(100));
      INSERT INTO orders VALUES (1, 'Order A');
      """
    And 在 "user_db" 執行 SQL:
      """sql
      CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));
      INSERT INTO users VALUES (1, 'User A');
      """
    When 使用 "order_db" 的連線查詢 "SELECT * FROM orders"
    Then 應該成功存取
    When 使用 "order_db" 的連線查詢 "SELECT * FROM user_db.users"
    Then 應該拋出權限不足的錯誤

  Scenario: MySQL shared 模式 - 可以跨庫存取
    Given 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          permission: shared
          source:
            - name: order_db
              resource_path: specs/data/order
              project_path: path/to/order
              db_type: mysql
            - name: user_db
              resource_path: specs/data/user
              project_path: path/to/user
              db_type: mysql
      instructions: []
      """
    And 啟動 Testcontainer 並建立所有 DataSource
    And 在 "order_db" 執行 SQL:
      """sql
      CREATE TABLE orders (id INT PRIMARY KEY, name VARCHAR(100));
      INSERT INTO orders VALUES (1, 'Order A');
      """
    And 在 "user_db" 執行 SQL:
      """sql
      CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));
      INSERT INTO users VALUES (1, 'User A');
      """
    When 使用 "order_db" 的連線查詢 "SELECT * FROM orders"
    Then 應該成功存取
    When 使用 "order_db" 的連線查詢 "SELECT * FROM user_db.users"
    Then 應該成功存取

  # ==================== MSSQL ====================

  Scenario: MSSQL isolated 模式 - 無法跨庫存取
    Given 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          permission: isolated
          source:
            - name: order_db
              resource_path: specs/data/order
              project_path: path/to/order
              db_type: mssql
            - name: user_db
              resource_path: specs/data/user
              project_path: path/to/user
              db_type: mssql
      instructions: []
      """
    And 啟動 Testcontainer 並建立所有 DataSource
    And 在 "order_db" 執行 SQL:
      """sql
      CREATE TABLE orders (id INT PRIMARY KEY, name VARCHAR(100));
      INSERT INTO orders VALUES (1, 'Order A');
      """
    And 在 "user_db" 執行 SQL:
      """sql
      CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));
      INSERT INTO users VALUES (1, 'User A');
      """
    When 使用 "order_db" 的連線查詢 "SELECT * FROM orders"
    Then 應該成功存取
    When 使用 "order_db" 的連線查詢 "SELECT * FROM user_db.dbo.users"
    Then 應該拋出權限不足的錯誤

  Scenario: MSSQL shared 模式 - 可以跨庫存取
    Given 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          permission: shared
          source:
            - name: order_db
              resource_path: specs/data/order
              project_path: path/to/order
              db_type: mssql
            - name: user_db
              resource_path: specs/data/user
              project_path: path/to/user
              db_type: mssql
      instructions: []
      """
    And 啟動 Testcontainer 並建立所有 DataSource
    And 在 "order_db" 執行 SQL:
      """sql
      CREATE TABLE orders (id INT PRIMARY KEY, name VARCHAR(100));
      INSERT INTO orders VALUES (1, 'Order A');
      """
    And 在 "user_db" 執行 SQL:
      """sql
      CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));
      INSERT INTO users VALUES (1, 'User A');
      """
    When 使用 "order_db" 的連線查詢 "SELECT * FROM orders"
    Then 應該成功存取
    When 使用 "order_db" 的連線查詢 "SELECT * FROM user_db.dbo.users"
    Then 應該成功存取

  # ==================== H2 (in-memory, 無跨庫概念) ====================

  Scenario: H2 模式 - 各 DataSource 獨立（天生隔離）
    Given 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          permission: isolated
          source:
            - name: order_db
              resource_path: specs/data/order
              project_path: path/to/order
              db_type: h2
            - name: user_db
              resource_path: specs/data/user
              project_path: path/to/user
              db_type: h2
      instructions: []
      """
    And 啟動 H2 DataSource
    And 在 "order_db" 執行 SQL:
      """sql
      CREATE TABLE orders (id INT PRIMARY KEY, name VARCHAR(100));
      INSERT INTO orders VALUES (1, 'Order A');
      """
    And 在 "user_db" 執行 SQL:
      """sql
      CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));
      INSERT INTO users VALUES (1, 'User A');
      """
    When 使用 "order_db" 的連線查詢 "SELECT * FROM orders"
    Then 應該成功存取
    When 使用 "order_db" 的連線查詢 "SELECT * FROM users"
    Then 應該拋出資料表不存在的錯誤
