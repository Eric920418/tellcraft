Feature: EntityDdlReader - PostgreSQL DDL 支援
  EntityDdlReader 支援解析 PostgreSQL 語法的 DDL，
  包含 SERIAL、BIGSERIAL、TEXT、TIMESTAMPTZ 等 PostgreSQL 特有型別。

  Rule: 正常讀取
    目標目錄下存在 1 個 entity_to_table_mapping.yml 與 1~N 個 .sql

    Scenario: 讀取 PostgreSQL DDL 單一 table
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "postgresql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE users (
            user_id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL
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
                  "type": "SERIAL",
                  "notNull": false,
                  "primaryKey": true,
                  "autoIncrement": true,
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
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "使用者": "users" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "postgresql"
        }
        """

  Rule: entity_to_table_mapping 與 tableName 不匹配
    mapping 中引用的 table 不存在於 SQL 定義中時應拋出例外

    Scenario: mapping 引用不存在的 table
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "postgresql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE users (
            user_id SERIAL PRIMARY KEY,
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
        { "name": "test", "db_type": "postgresql" }
        """
      And spec.data 資料目錄下存在檔案 "01_users.sql":
        """
        CREATE TABLE users (
            user_id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL
        );
        """
      And spec.data 資料目錄下存在檔案 "02_users.sql":
        """
        CREATE TABLE users (
            user_id SERIAL PRIMARY KEY,
            email TEXT NOT NULL
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
    PostgreSQL 方言的 SERIAL、BIGSERIAL、TEXT、TIMESTAMPTZ、BOOLEAN、IF NOT EXISTS 解析

    Scenario: 解析 PostgreSQL SERIAL 自動遞增與 TEXT 型別
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "postgresql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE users (
            user_id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email TEXT NOT NULL UNIQUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
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
                  "type": "SERIAL",
                  "notNull": false,
                  "primaryKey": true,
                  "autoIncrement": true,
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
                  "type": "TEXT",
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
                  "type": "TIMESTAMPTZ",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "NOW()",
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
          "dbType": "postgresql"
        }
        """

    Scenario: 解析 PostgreSQL BIGSERIAL 與 IF NOT EXISTS
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "postgresql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE IF NOT EXISTS products (
            product_id BIGSERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            in_stock BOOLEAN DEFAULT true
        );
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 商品: products
        """
      When spec.data 讀取 Entity DDL
      Then spec.data DatabaseSchema 的解析結果為:
        """json
        {
          "tables": [
            {
              "tableName": "products",
              "comment": null,
              "columns": [
                {
                  "name": "product_id",
                  "type": "BIGSERIAL",
                  "notNull": false,
                  "primaryKey": true,
                  "autoIncrement": true,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "name",
                  "type": "VARCHAR(200)",
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
                  "name": "price",
                  "type": "DECIMAL(10,2)",
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
                  "name": "in_stock",
                  "type": "BOOLEAN",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "true",
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                }
              ],
              "pkColumns": ["product_id"],
              "queryColumns": ["name", "price", "in_stock"]
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "商品": "products" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "postgresql"
        }
        """

    Scenario: 解析 PostgreSQL table-level FOREIGN KEY
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "postgresql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE users (
            user_id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email TEXT NOT NULL UNIQUE
        );

        CREATE TABLE todos (
            todo_id SERIAL PRIMARY KEY,
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
                  "type": "SERIAL",
                  "notNull": false,
                  "primaryKey": true,
                  "autoIncrement": true,
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
                  "type": "TEXT",
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
                  "type": "SERIAL",
                  "notNull": false,
                  "primaryKey": true,
                  "autoIncrement": true,
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
          "dbType": "postgresql"
        }
        """

    Scenario: 解析 PostgreSQL named CONSTRAINT FOREIGN KEY
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "postgresql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE orders (
            order_id SERIAL PRIMARY KEY,
            user_id INT NOT NULL,
            total DECIMAL(10,2) NOT NULL,
            CONSTRAINT fk_orders_users FOREIGN KEY (user_id) REFERENCES users(user_id)
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
                  "type": "SERIAL",
                  "notNull": false,
                  "primaryKey": true,
                  "autoIncrement": true,
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
          "dbType": "postgresql"
        }
        """

    Scenario: 不合法的 SQL 缺少右括號應失敗
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "postgresql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE users (
            user_id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 使用者: users
        """
      When spec.data 讀取 Entity DDL
      Then spec.data 解析應拋出例外訊息包含 "users"
