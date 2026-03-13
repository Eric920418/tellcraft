Feature: EntityDdlReader - MSSQL DDL 支援
  EntityDdlReader 支援解析 MSSQL 語法的 DDL，
  包含 IDENTITY、NVARCHAR、DATETIME2、BIT 等 MSSQL 特有型別。

  Rule: 正常讀取
    目標目錄下存在 1 個 entity_to_table_mapping.yml 與 1~N 個 .sql

    Scenario: 讀取 MSSQL DDL 單一 table
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mssql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE users (
            user_id INT IDENTITY(1,1) PRIMARY KEY,
            name NVARCHAR(100) NOT NULL
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
                  "autoIncrement": true,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "name",
                  "type": "NVARCHAR(100)",
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
          "dbType": "mssql"
        }
        """

  Rule: entity_to_table_mapping 與 tableName 不匹配
    mapping 中引用的 table 不存在於 SQL 定義中時應拋出例外

    Scenario: mapping 引用不存在的 table
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mssql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE users (
            user_id INT IDENTITY(1,1) PRIMARY KEY,
            name NVARCHAR(100) NOT NULL
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
        { "name": "test", "db_type": "mssql" }
        """
      And spec.data 資料目錄下存在檔案 "01_users.sql":
        """
        CREATE TABLE users (
            user_id INT IDENTITY(1,1) PRIMARY KEY,
            name NVARCHAR(100) NOT NULL
        );
        """
      And spec.data 資料目錄下存在檔案 "02_users.sql":
        """
        CREATE TABLE users (
            user_id INT IDENTITY(1,1) PRIMARY KEY,
            email NVARCHAR(255) NOT NULL
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
    MSSQL 方言的 IDENTITY、NVARCHAR、DATETIME2、BIT、CHECK、composite PK 解析

    Scenario: 解析 MSSQL IDENTITY 欄位與 NVARCHAR 型別
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mssql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE users (
            user_id INT IDENTITY(1,1) PRIMARY KEY,
            name NVARCHAR(100) NOT NULL,
            email NVARCHAR(255) NOT NULL UNIQUE,
            status NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
            last_login_at DATETIME2,
            created_at DATETIME2 DEFAULT GETDATE()
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
                  "autoIncrement": true,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "name",
                  "type": "NVARCHAR(100)",
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
                  "type": "NVARCHAR(255)",
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
                  "name": "status",
                  "type": "NVARCHAR(20)",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "ACTIVE",
                  "foreignKey": null,
                  "checkConstraint": "status IN ('ACTIVE', 'INACTIVE')",
                  "comment": null
                },
                {
                  "name": "last_login_at",
                  "type": "DATETIME2",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "created_at",
                  "type": "DATETIME2",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "GETDATE()",
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                }
              ],
              "pkColumns": ["user_id"],
              "queryColumns": ["name", "email", "status"]
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "使用者": "users" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "mssql"
        }
        """

    Scenario: 解析 MSSQL composite primary key 與 BIT 型別
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mssql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE todos (
            todo_id INT IDENTITY(1,1),
            user_id INT NOT NULL,
            title NVARCHAR(255) NOT NULL,
            completed BIT DEFAULT 0,
            created_at DATETIME2 DEFAULT GETDATE(),
            PRIMARY KEY (todo_id, user_id)
        );
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 待辦事項: todos
        """
      When spec.data 讀取 Entity DDL
      Then spec.data DatabaseSchema 的解析結果為:
        """json
        {
          "tables": [
            {
              "tableName": "todos",
              "comment": null,
              "columns": [
                {
                  "name": "todo_id",
                  "type": "INT",
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
                  "primaryKey": true,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "title",
                  "type": "NVARCHAR(255)",
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
                  "type": "BIT",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "0",
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "created_at",
                  "type": "DATETIME2",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "GETDATE()",
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                }
              ],
              "pkColumns": ["todo_id", "user_id"],
              "queryColumns": ["title", "completed"]
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "待辦事項": "todos" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "mssql"
        }
        """

    Scenario: 解析 MSSQL table-level FOREIGN KEY
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mssql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE users (
            user_id INT IDENTITY(1,1) PRIMARY KEY,
            name NVARCHAR(100) NOT NULL,
            email NVARCHAR(255) NOT NULL UNIQUE,
            password_hash NVARCHAR(255) NOT NULL,
            status NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
            created_at DATETIME2 DEFAULT GETDATE(),
            updated_at DATETIME2 DEFAULT GETDATE()
        );

        CREATE TABLE todos (
            todo_id INT IDENTITY(1,1) PRIMARY KEY,
            user_id INT NOT NULL,
            title NVARCHAR(255) NOT NULL,
            description NVARCHAR(MAX),
            completed BIT DEFAULT 0,
            created_at DATETIME2 DEFAULT GETDATE(),
            updated_at DATETIME2 DEFAULT GETDATE(),
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
                  "autoIncrement": true,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "name",
                  "type": "NVARCHAR(100)",
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
                  "type": "NVARCHAR(255)",
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
                  "name": "password_hash",
                  "type": "NVARCHAR(255)",
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
                  "name": "status",
                  "type": "NVARCHAR(20)",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "ACTIVE",
                  "foreignKey": null,
                  "checkConstraint": "status IN ('ACTIVE', 'INACTIVE')",
                  "comment": null
                },
                {
                  "name": "created_at",
                  "type": "DATETIME2",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "GETDATE()",
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "updated_at",
                  "type": "DATETIME2",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "GETDATE()",
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                }
              ],
              "pkColumns": ["user_id"],
              "queryColumns": ["name", "email", "password_hash", "status"]
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
                  "type": "NVARCHAR(255)",
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
                  "name": "description",
                  "type": "NVARCHAR(MAX)",
                  "notNull": false,
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
                  "type": "BIT",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "0",
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "created_at",
                  "type": "DATETIME2",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "GETDATE()",
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "updated_at",
                  "type": "DATETIME2",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "GETDATE()",
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                }
              ],
              "pkColumns": ["todo_id"],
              "queryColumns": ["user_id", "title", "description", "completed"]
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "使用者": "users" },
              { "待辦事項": "todos" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "mssql"
        }
        """

    Scenario: 解析 MSSQL named CONSTRAINT FOREIGN KEY
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mssql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE orders (
            order_id INT IDENTITY(1,1) PRIMARY KEY,
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
          "dbType": "mssql"
        }
        """

    Scenario: 不合法的 SQL 缺少右括號應失敗
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mssql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE users (
            user_id INT IDENTITY(1,1) PRIMARY KEY,
            name NVARCHAR(100) NOT NULL
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 使用者: users
        """
      When spec.data 讀取 Entity DDL
      Then spec.data 解析應拋出例外訊息包含 "users"
