Feature: EntityDdlReader - DDL PRIMARY KEY 前置行內註解不影響解析
  DDL 解析時會 strip 行內註解（-- ...）後再判斷 PRIMARY KEY 約束，
  避免「約束前有註解」導致主鍵漏辨、同步失敗，
  後續造成 VAR-System 變數（如 $SalesPerson.id）未解析的 NumberFormatException。

  Rule: 註解前綴的 CONSTRAINT PRIMARY KEY 仍可正確解析
    當 DDL 中 CONSTRAINT ... PRIMARY KEY (...) 前方有行內註解時，
    解析後 pkColumns 仍應正確填入。

    Scenario: CONSTRAINT PRIMARY KEY 前有單行註解（H2）
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "h2" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE tb_todos (
            todo_id INT AUTO_INCREMENT,
            title VARCHAR(200) NOT NULL,
            status VARCHAR(20) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            -- ========== 約束定義 ==========
            CONSTRAINT pk_todos PRIMARY KEY (todo_id)
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
                },
                {
                  "name": "status",
                  "type": "VARCHAR(20)",
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
              "pkColumns": ["todo_id"],
              "queryColumns": ["title", "status"]
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

    Scenario: CONSTRAINT PRIMARY KEY 前有單行註解（MSSQL IDENTITY）
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mssql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE tb_todos (
            todo_id INT IDENTITY(1,1),
            title NVARCHAR(200) NOT NULL,
            status NVARCHAR(20) NOT NULL,
            -- 主鍵約束
            CONSTRAINT pk_todos PRIMARY KEY (todo_id)
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
                  "name": "status",
                  "type": "NVARCHAR(20)",
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
              "queryColumns": ["title", "status"]
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

    Scenario: PRIMARY KEY 前有單行註解但無 CONSTRAINT 關鍵字（PostgreSQL）
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "postgresql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE tb_todos (
            todo_id SERIAL,
            title VARCHAR(200) NOT NULL,
            -- PK 定義
            PRIMARY KEY (todo_id)
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
              "queryColumns": ["title"]
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "待辦事項": "tb_todos" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "postgresql"
        }
        """

  Rule: 註解前綴的 composite PRIMARY KEY 仍可正確解析
    複合主鍵搭配行內註解時，所有主鍵欄位應被正確辨識。

    Scenario: composite CONSTRAINT PRIMARY KEY 前有裝飾性註解（MSSQL）
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mssql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE tb_todo_items (
            todo_id INT NOT NULL,
            item_id INT NOT NULL,
            content NVARCHAR(500) NOT NULL,
            -- ========== 約束定義 ==========
            CONSTRAINT pk_todo_items PRIMARY KEY (todo_id, item_id)
        );
        """
      And spec.data 資料目錄下存在檔案 "entity_to_table_mapping.yml":
        """
        entity_to_table_mapping:
          - 待辦子項目: tb_todo_items
        """
      When spec.data 讀取 Entity DDL
      Then spec.data DatabaseSchema 的解析結果為:
        """json
        {
          "tables": [
            {
              "tableName": "tb_todo_items",
              "comment": null,
              "columns": [
                {
                  "name": "todo_id",
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
                  "name": "item_id",
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
                  "name": "content",
                  "type": "NVARCHAR(500)",
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
              "pkColumns": ["todo_id", "item_id"],
              "queryColumns": ["content"]
            }
          ],
          "entityTableMapping": {
            "entity_to_table_mapping": [
              { "待辦子項目": "tb_todo_items" }
            ]
          },
          "dataSourceName": "test",
          "dbType": "mssql"
        }
        """

  Rule: 純註解 segment 應被忽略不產生欄位
    當某個 segment 去除註解後為空白時，不應產生多餘欄位或錯誤。

    Scenario: 欄位間穿插純註解行不影響解析結果
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "h2" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE tb_todos (
            todo_id INT AUTO_INCREMENT PRIMARY KEY,
            -- 基本資料
            title VARCHAR(200) NOT NULL,
            -- 狀態欄位
            status VARCHAR(20) DEFAULT 'TODO'
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
                },
                {
                  "name": "status",
                  "type": "VARCHAR(20)",
                  "notNull": false,
                  "primaryKey": false,
                  "autoIncrement": false,
                  "unique": false,
                  "defaultValue": "TODO",
                  "foreignKey": null,
                  "checkConstraint": null,
                  "comment": null
                }
              ],
              "pkColumns": ["todo_id"],
              "queryColumns": ["title", "status"]
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
