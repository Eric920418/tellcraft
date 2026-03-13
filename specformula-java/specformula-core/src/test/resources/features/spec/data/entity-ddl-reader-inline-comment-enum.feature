Feature: EntityDdlReader - 行內註解中的 enum 值不應被誤判為欄位名
  DDL 欄位定義後方的行內註解（-- ...）中可能包含逗號分隔的 enum 值，
  例如 `-- 狀態: TODO, IN_PROGRESS, DONE`。
  解析器應在 splitByTopLevelComma 階段正確跳過註解中的逗號，
  避免將 enum 值（如 TODO、IN_PROGRESS、DONE）誤判為欄位名。

  Rule: 行內註解含逗號分隔的 enum 值不影響欄位解析
    當欄位定義後方的行內註解包含逗號分隔的 enum 值時，
    splitByTopLevelComma 應跳過註解中的逗號，不產生多餘 segment。

    Scenario: 行內註解含 enum 值不產生多餘欄位（MSSQL）
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mssql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE tb_todos (
            todo_id INT IDENTITY(1,1) PRIMARY KEY,
            status VARCHAR(20) NOT NULL DEFAULT 'TODO',  -- 狀態: TODO, IN_PROGRESS, DONE
            title NVARCHAR(200) NOT NULL
        );
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 待辦事項: tb_todos
        """
      When spec.data 讀取 Entity DDL
      Then spec.data DatabaseSchema 的解析結果為:
        """json
        {
          "tables": [
            {
              "tableName": "tb_todos",
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
                  "name": "status",
                  "type": "VARCHAR(20)",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "TODO",
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "title",
                  "type": "NVARCHAR(200)",
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
              "pkColumns": ["todo_id"],
              "queryColumns": ["status", "title"]
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "待辦事項": "tb_todos" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "mssql"
        }
        """

    Scenario: 行內註解含 enum 值不產生多餘欄位（H2）
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "h2" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE tb_todos (
            todo_id INT AUTO_INCREMENT PRIMARY KEY,
            status VARCHAR(20) NOT NULL DEFAULT 'TODO',  -- 狀態: TODO, IN_PROGRESS, DONE
            title VARCHAR(200) NOT NULL
        );
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 待辦事項: tb_todos
        """
      When spec.data 讀取 Entity DDL
      Then spec.data DatabaseSchema 的解析結果為:
        """json
        {
          "tables": [
            {
              "tableName": "tb_todos",
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
                  "name": "status",
                  "type": "VARCHAR(20)",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "TODO",
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "title",
                  "type": "VARCHAR(200)",
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
              "pkColumns": ["todo_id"],
              "queryColumns": ["status", "title"]
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "待辦事項": "tb_todos" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "h2"
        }
        """

  Rule: 多個欄位均帶有含逗號的行內註解
    當多個欄位定義後方都有含逗號的行內註解時，
    解析器應正確處理所有欄位，不將任何註解內容誤判為欄位名。

    Scenario: 多個欄位帶 enum 行內註解（MSSQL）
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mssql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE tb_todos (
            todo_id INT IDENTITY(1,1) PRIMARY KEY,
            status VARCHAR(20) NOT NULL DEFAULT 'TODO',  -- 狀態: TODO, IN_PROGRESS, DONE, CANCELLED
            priority VARCHAR(10) DEFAULT 'MEDIUM',  -- 優先級: LOW, MEDIUM, HIGH, URGENT
            category VARCHAR(30)  -- 分類: WORK, PERSONAL, SHOPPING, HEALTH
        );
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 待辦事項: tb_todos
        """
      When spec.data 讀取 Entity DDL
      Then spec.data DatabaseSchema 的解析結果為:
        """json
        {
          "tables": [
            {
              "tableName": "tb_todos",
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
                  "name": "status",
                  "type": "VARCHAR(20)",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "TODO",
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "priority",
                  "type": "VARCHAR(10)",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "MEDIUM",
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "category",
                  "type": "VARCHAR(30)",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                }
              ],
              "pkColumns": ["todo_id"],
              "queryColumns": ["status", "priority", "category"]
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "待辦事項": "tb_todos" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "mssql"
        }
        """

  Rule: 行內註解含 enum 值搭配 CONSTRAINT PRIMARY KEY
    當行內註解含逗號分隔的 enum 值，且表定義中包含 CONSTRAINT PRIMARY KEY 時，
    解析器應同時正確處理註解跳過與主鍵約束解析。

    Scenario: 行內 enum 註解搭配 CONSTRAINT PRIMARY KEY（MSSQL）
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mssql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE tb_todos (
            todo_id INT IDENTITY(1,1),
            user_id INT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'TODO',  -- 狀態: TODO, IN_PROGRESS, DONE
            title NVARCHAR(200) NOT NULL,
            CONSTRAINT pk_todo PRIMARY KEY (todo_id, user_id)
        );
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 待辦事項: tb_todos
        """
      When spec.data 讀取 Entity DDL
      Then spec.data DatabaseSchema 的解析結果為:
        """json
        {
          "tables": [
            {
              "tableName": "tb_todos",
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
                  "name": "status",
                  "type": "VARCHAR(20)",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "TODO",
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "title",
                  "type": "NVARCHAR(200)",
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
              "pkColumns": ["todo_id", "user_id"],
              "queryColumns": ["status", "title"]
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "待辦事項": "tb_todos" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "mssql"
        }
        """

  Rule: 行內註解含 enum 值且 DEFAULT 使用單引號包裹
    確保 DEFAULT 'TODO' 中的單引號不會干擾註解中逗號的跳過邏輯。

    Scenario: DEFAULT 單引號值後接含 enum 的行內註解（MSSQL）
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mssql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE tb_todos (
            todo_id INT IDENTITY(1,1) PRIMARY KEY,
            status VARCHAR(20) NOT NULL DEFAULT 'TODO',  -- 狀態: TODO, IN_PROGRESS, DONE, CANCELLED
            priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',  -- 優先級: LOW, MEDIUM, HIGH, URGENT
            title NVARCHAR(200) NOT NULL,
            description NVARCHAR(2000)
        );
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 待辦事項: tb_todos
        """
      When spec.data 讀取 Entity DDL
      Then spec.data DatabaseSchema 的解析結果為:
        """json
        {
          "tables": [
            {
              "tableName": "tb_todos",
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
                  "name": "status",
                  "type": "VARCHAR(20)",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "TODO",
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "priority",
                  "type": "VARCHAR(10)",
                  "notNull": true,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "MEDIUM",
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                },
                {
                  "name": "title",
                  "type": "NVARCHAR(200)",
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
                  "type": "NVARCHAR(2000)",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": null,
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                }
              ],
              "pkColumns": ["todo_id"],
              "queryColumns": ["status", "priority", "title", "description"]
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "待辦事項": "tb_todos" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "mssql"
        }
        """
