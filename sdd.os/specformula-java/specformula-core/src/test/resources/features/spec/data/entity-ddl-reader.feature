Feature: EntityDdlReader - H2 DDL 讀取
  EntityDdlReader 負責讀取目錄下的 .sql 與 entity_to_table_mapping.yml，
  解析為 DatabaseSchema 物件。僅讀取單層目錄。

  Rule: 正常讀取
    目標目錄下存在 1 個 entity_to_table_mapping.yml 與 1~N 個 .sql

    Scenario: 讀取包含一個 table 的 H2 DDL
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "h2" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 使用者: users
        """
      When spec.data 讀取 Entity DDL
      Then spec.data DatabaseSchema 的解析結果為:
        """json
        {
          "tables": [
            {
              "tableName": "users",
              "comment": null,
              "columns": [
                {
                  "name": "user_id",
                  "type": "INT",
                  "notNull": false,
                  "primaryKey": true,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "name",
                  "type": "VARCHAR(100)",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "email",
                  "type": "VARCHAR(255)",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": true,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "created_at",
                  "type": "TIMESTAMP",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "CURRENT_TIMESTAMP",
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                }
              ],
              "pkColumns": ["user_id"],
              "queryColumns": ["name", "email"]
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "使用者": "users" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "h2"
        }
        """

    Scenario: 讀取多個 SQL 檔案中的多個 table
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "h2" }
        """
      And spec.data 資料目錄下存在檔案 "01_users.sql":
        """
        CREATE TABLE users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL
        );
        """
      And spec.data 資料目錄下存在檔案 "02_orders.sql":
        """
        CREATE TABLE orders (
            order_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            total DECIMAL(10,2) NOT NULL
        );
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 使用者: users
          - 訂單: orders
        """
      When spec.data 讀取 Entity DDL
      Then spec.data DatabaseSchema 的解析結果為:
        """json
        {
          "tables": [
            {
              "tableName": "users",
              "comment": null,
              "columns": [
                {
                  "name": "user_id",
                  "type": "INT",
                  "notNull": false,
                  "primaryKey": true,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "name",
                  "type": "VARCHAR(100)",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                }
              ],
              "pkColumns": ["user_id"],
              "queryColumns": ["name"]
            },
            {
              "tableName": "orders",
              "comment": null,
              "columns": [
                {
                  "name": "order_id",
                  "type": "INT",
                  "notNull": false,
                  "primaryKey": true,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "user_id",
                  "type": "INT",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "total",
                  "type": "DECIMAL(10,2)",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                }
              ],
              "pkColumns": ["order_id"],
              "queryColumns": ["user_id", "total"]
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "使用者": "users" },
              { "訂單": "orders" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "h2"
        }
        """

    Scenario: 一個 SQL 檔案包含多個 CREATE TABLE
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "h2" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL
        );

        CREATE TABLE roles (
            role_id INT AUTO_INCREMENT PRIMARY KEY,
            role_name VARCHAR(50) NOT NULL
        );
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 使用者: users
          - 角色: roles
        """
      When spec.data 讀取 Entity DDL
      Then spec.data DatabaseSchema 的解析結果為:
        """json
        {
          "tables": [
            {
              "tableName": "users",
              "comment": null,
              "columns": [
                {
                  "name": "user_id",
                  "type": "INT",
                  "notNull": false,
                  "primaryKey": true,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "name",
                  "type": "VARCHAR(100)",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                }
              ],
              "pkColumns": ["user_id"],
              "queryColumns": ["name"]
            },
            {
              "tableName": "roles",
              "comment": null,
              "columns": [
                {
                  "name": "role_id",
                  "type": "INT",
                  "notNull": false,
                  "primaryKey": true,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "role_name",
                  "type": "VARCHAR(50)",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                }
              ],
              "pkColumns": ["role_id"],
              "queryColumns": ["role_name"]
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "使用者": "users" },
              { "角色": "roles" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "h2"
        }
        """

  Rule: 缺少必要檔案
    目錄下缺少 entity_to_table_mapping.yml 或 .sql 檔案時應拋出例外

    Scenario: 目錄內沒有 entity_to_table_mapping.yml
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "h2" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL
        );
        """
      When spec.data 讀取 Entity DDL
      Then spec.data 解析應拋出例外訊息包含 "entity_to_table_mapping.yml"

    Scenario: 空目錄讀取應失敗
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "h2" }
        """
      And spec.data 資料目錄是空目錄
      When spec.data 讀取 Entity DDL
      Then spec.data 解析應拋出例外訊息包含 "entity_to_table_mapping.yml"

    Scenario: 目錄內沒有 .sql 檔案
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "h2" }
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 使用者: users
        """
      When spec.data 讀取 Entity DDL
      Then spec.data 解析應拋出例外訊息包含 ".sql"

  Rule: entity_to_table_mapping 與 tableName 不匹配
    mapping 中引用的 table 不存在於 SQL 定義中時應拋出例外

    Scenario: mapping 引用不存在的 table
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "h2" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL
        );
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 使用者: users
          - 訂單: orders
        """
      When spec.data 讀取 Entity DDL
      Then spec.data 解析應拋出例外訊息包含 "orders"

  Rule: 重複 TableName
    多個 CREATE TABLE 使用相同 tableName 時應拋出例外

    Scenario: 兩個 SQL 檔案包含相同 tableName
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "h2" }
        """
      And spec.data 資料目錄下存在檔案 "01_users.sql":
        """
        CREATE TABLE users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL
        );
        """
      And spec.data 資料目錄下存在檔案 "02_users.sql":
        """
        CREATE TABLE users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL
        );
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 使用者: users
        """
      When spec.data 讀取 Entity DDL
      Then spec.data 解析應拋出例外訊息包含 "Duplicate table name: users"

  Rule: SQL 方言解析
    H2 方言的 PK、composite PK、CHECK constraint 等解析

    Scenario: 解析含 composite primary key 的 table
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "h2" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE order_items (
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            PRIMARY KEY (order_id, product_id)
        );
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 訂單明細: order_items
        """
      When spec.data 讀取 Entity DDL
      Then spec.data DatabaseSchema 的解析結果為:
        """json
        {
          "tables": [
            {
              "tableName": "order_items",
              "comment": null,
              "columns": [
                {
                  "name": "order_id",
                  "type": "INT",
                  "notNull": true,
                  "primaryKey": true,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "product_id",
                  "type": "INT",
                  "notNull": true,
                  "primaryKey": true,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "quantity",
                  "type": "INT",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "1",
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                }
              ],
              "pkColumns": ["order_id", "product_id"],
              "queryColumns": ["quantity"]
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "訂單明細": "order_items" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "h2"
        }
        """

    Scenario: 解析含 CHECK constraint 的 column
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "h2" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE'))
        );
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 使用者: users
        """
      When spec.data 讀取 Entity DDL
      Then spec.data DatabaseSchema 的解析結果為:
        """json
        {
          "tables": [
            {
              "tableName": "users",
              "comment": null,
              "columns": [
                {
                  "name": "user_id",
                  "type": "INT",
                  "notNull": false,
                  "primaryKey": true,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "status",
                  "type": "VARCHAR(20)",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "ACTIVE",
                  "foreignKey": null,
                  "checkConstraint": "status IN ('ACTIVE', 'INACTIVE')",
                  "comment": null
                }
              ],
              "pkColumns": ["user_id"],
              "queryColumns": ["status"]
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "使用者": "users" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "h2"
        }
        """

    Scenario: 解析 H2 table-level FOREIGN KEY
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "h2" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE
        );

        CREATE TABLE todos (
            todo_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            completed BOOLEAN DEFAULT false,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        );
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 使用者: users
          - 待辦事項: todos
        """
      When spec.data 讀取 Entity DDL
      Then spec.data DatabaseSchema 的解析結果為:
        """json
        {
          "tables": [
            {
              "tableName": "users",
              "comment": null,
              "columns": [
                {
                  "name": "user_id",
                  "type": "INT",
                  "notNull": false,
                  "primaryKey": true,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "name",
                  "type": "VARCHAR(100)",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "email",
                  "type": "VARCHAR(255)",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": true,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                }
              ],
              "pkColumns": ["user_id"],
              "queryColumns": ["name", "email"]
            },
            {
              "tableName": "todos",
              "comment": null,
              "columns": [
                {
                  "name": "todo_id",
                  "type": "INT",
                  "notNull": false,
                  "primaryKey": true,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "user_id",
                  "type": "INT",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": "users.user_id",
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "title",
                  "type": "VARCHAR(255)",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "completed",
                  "type": "BOOLEAN",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "false",
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                }
              ],
              "pkColumns": ["todo_id"],
              "queryColumns": ["user_id", "title", "completed"]
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "使用者": "users" },
              { "待辦事項": "todos" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "h2"
        }
        """

    Scenario: 解析 H2 named CONSTRAINT FOREIGN KEY
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "h2" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE orders (
            order_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            total DECIMAL(10,2) NOT NULL,
            CONSTRAINT FK_orders_users FOREIGN KEY (user_id) REFERENCES users(user_id)
        );
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 訂單: orders
        """
      When spec.data 讀取 Entity DDL
      Then spec.data DatabaseSchema 的解析結果為:
        """json
        {
          "tables": [
            {
              "tableName": "orders",
              "comment": null,
              "columns": [
                {
                  "name": "order_id",
                  "type": "INT",
                  "notNull": false,
                  "primaryKey": true,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "user_id",
                  "type": "INT",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": "users.user_id",
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "total",
                  "type": "DECIMAL(10,2)",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                }
              ],
              "pkColumns": ["order_id"],
              "queryColumns": ["user_id", "total"]
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "訂單": "orders" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "h2"
        }
        """

    Scenario: 不合法的 SQL 缺少右括號應失敗
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "h2" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 使用者: users
        """
      When spec.data 讀取 Entity DDL
      Then spec.data 解析應拋出例外訊息包含 "users"
