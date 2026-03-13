Feature: EntityDdlReader - MySQL DDL 支援
  EntityDdlReader 支援解析 MySQL 語法的 DDL，
  包含 AUTO_INCREMENT、COMMENT、ENGINE 等 MySQL 特有語法。

  Rule: 正常讀取
    目標目錄下存在 1 個 entity_to_table_mapping.yml 與 1~N 個 .sql

    Scenario: 讀取 MySQL DDL 單一 table
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mysql" }
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
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "使用者": "users" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "mysql"
        }
        """

  Rule: entity_to_table_mapping 與 tableName 不匹配
    mapping 中引用的 table 不存在於 SQL 定義中時應拋出例外

    Scenario: mapping 引用不存在的 table
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mysql" }
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
        { "name": "test", "db_type": "mysql" }
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
    MySQL 方言的 AUTO_INCREMENT、table COMMENT、column COMMENT 解析

    Scenario: 解析 MySQL AUTO_INCREMENT 與 table COMMENT
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mysql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL COMMENT '使用者名稱',
            email VARCHAR(255) NOT NULL UNIQUE COMMENT '電子郵件',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) COMMENT '使用者表';
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
              "comment": "使用者表",
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
                  "comment": "使用者名稱"
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
                  "comment": "電子郵件"
                },
                {
                  "name": "created_at",
                  "type": "DATETIME",
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
          "dbType": "mysql"
        }
        """

    Scenario: 解析 MySQL 多個 table 含 column COMMENT
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mysql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE categories (
            category_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL COMMENT '分類名稱'
        ) COMMENT '分類表';

        CREATE TABLE products (
            product_id INT AUTO_INCREMENT PRIMARY KEY,
            category_id INT NOT NULL COMMENT '所屬分類',
            name VARCHAR(200) NOT NULL COMMENT '商品名稱',
            price DECIMAL(10,2) NOT NULL COMMENT '價格'
        ) COMMENT '商品表';
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 分類: categories
          - 商品: products
        """
      When spec.data 讀取 Entity DDL
      Then spec.data DatabaseSchema 的解析結果為:
        """json
        {
          "tables": [
            {
              "tableName": "categories",
              "comment": "分類表",
              "columns": [
                {
                  "name": "category_id",
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
                  "type": "VARCHAR(50)",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": "分類名稱"
                }
              ],
              "pkColumns": ["category_id"],
              "queryColumns": ["name"]
            },
            {
              "tableName": "products",
              "comment": "商品表",
              "columns": [
                {
                  "name": "product_id",
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
                  "name": "category_id",
                  "type": "INT",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": "所屬分類"
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
                  "comment": "商品名稱"
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
                  "comment": "價格"
                }
              ],
              "pkColumns": ["product_id"],
              "queryColumns": ["category_id", "name", "price"]
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "分類": "categories" },
              { "商品": "products" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "mysql"
        }
        """

    Scenario: 解析 MySQL table-level FOREIGN KEY
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mysql" }
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
            completed TINYINT(1) DEFAULT 0,
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
                  "type": "TINYINT(1)",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "0",
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
          "dbType": "mysql"
        }
        """

    Scenario: 解析 MySQL named CONSTRAINT FOREIGN KEY
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mysql" }
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
          "dbType": "mysql"
        }
        """

    Scenario: 不合法的 SQL 缺少右括號應失敗
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mysql" }
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
