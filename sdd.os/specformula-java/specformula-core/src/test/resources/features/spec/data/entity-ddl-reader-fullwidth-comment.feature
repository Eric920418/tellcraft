Feature: EntityDdlReader - DDL 註釋含全角括號或中文不影響欄位解析
  DDL 註釋中可能包含全角括號（「（」「）」）或中文字元，
  解析器應正確移除這些註釋內容，不將其誤判為列名，
  避免生成含全角括號的 SQL 導致資料庫語法錯誤。

  Rule: 行內註釋含全角括號應被忽略
    當列定義的行尾註釋包含全角括號時，解析器應移除註釋後正常解析列定義。

    Scenario: 列定義後方行內註釋含全角括號（H2）
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "h2" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE tb_todos (
            todo_id INT AUTO_INCREMENT PRIMARY KEY,
            category VARCHAR(20) NOT NULL, -- 分類: 1-工作, 2-個人, 3-學習（含線上課程）
            title VARCHAR(200) NOT NULL,
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
                  "name": "category",
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
              "queryColumns": ["category", "title", "status"]
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

    Scenario: 列定義後方行內註釋含全角括號（MSSQL）
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mssql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE tb_todos (
            todo_id INT IDENTITY(1,1) PRIMARY KEY,
            category NVARCHAR(20) NOT NULL, -- 分類: 1-工作, 2-個人, 3-學習（含線上課程）
            title NVARCHAR(200) NOT NULL,
            status NVARCHAR(20) DEFAULT 'TODO'
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
                  "name": "category",
                  "type": "NVARCHAR(20)",
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
              "queryColumns": ["category", "title", "status"]
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

  Rule: 獨立註釋行含全角括號應被忽略
    當欄位間穿插的獨立註釋行包含全角括號或中文時，
    解析器應跳過這些行，不產生多餘欄位。

    Scenario: 獨立註釋行含全角括號不產生多餘欄位（H2）
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "h2" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE tb_todos (
            todo_id INT AUTO_INCREMENT PRIMARY KEY,
            -- 分類: 1-工作, 2-個人, 3-學習（含線上課程）
            category VARCHAR(20) NOT NULL,
            -- 基本資料欄位（以下為標題與狀態）
            title VARCHAR(200) NOT NULL,
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
                  "name": "category",
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
              "queryColumns": ["category", "title", "status"]
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

    Scenario: 多個獨立註釋行含各種中文與全角符號（MSSQL）
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mssql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE tb_todos (
            todo_id INT IDENTITY(1,1) PRIMARY KEY,
            -- ========== 基本資料（必填欄位）==========
            title NVARCHAR(200) NOT NULL,
            -- 分類說明：A-工作（含會議）, B-個人（含運動）
            category NVARCHAR(50) NOT NULL,
            -- 優先級（數字越大越優先）
            priority INT NOT NULL DEFAULT 0
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
                  "name": "category",
                  "type": "NVARCHAR(50)",
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
                  "name": "priority",
                  "type": "INT",
                  "notNull": true,
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
              "queryColumns": ["title", "category", "priority"]
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

  Rule: 註釋含全角括號搭配 CONSTRAINT PRIMARY KEY 仍可正確解析
    註釋中出現全角括號時，不應干擾後續 CONSTRAINT PRIMARY KEY 的解析。

    Scenario: 全角括號註釋與 CONSTRAINT PRIMARY KEY 共存（MSSQL）
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mssql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE tb_todos (
            todo_id INT IDENTITY(1,1),
            category NVARCHAR(20) NOT NULL, -- 分類: 1-工作, 2-個人, 3-學習（含線上課程）
            title NVARCHAR(200) NOT NULL,
            -- ========== 約束定義（主鍵）==========
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
                  "name": "category",
                  "type": "NVARCHAR(20)",
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
              "queryColumns": ["category", "title"]
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

  Rule: 註釋中逗號導致 segment 分割後仍正確解析
    當註釋包含逗號時，splitByTopLevelComma 會將註釋分割為多個 segment，
    解析器應正確識別並跳過這些非列定義的 segment。

    Scenario: 註釋逗號導致分割，殘餘片段含全角括號應被跳過（復現原始 Bug）
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "mssql" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE tb_todos (
            todo_id INT IDENTITY(1,1) PRIMARY KEY,
            -- 分類: 1-工作, 2-個人, 3-學習（含線上課程）
            category NVARCHAR(20) NOT NULL,
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
                  "name": "category",
                  "type": "NVARCHAR(20)",
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
              "queryColumns": ["category", "title"]
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

    Scenario: 多處逗號註釋導致多個殘餘 segment 均被跳過
      Given spec.data IsaDataSourceConfig 為:
        """json
        { "name": "test", "db_type": "h2" }
        """
      And spec.data 資料目錄下存在檔案 "schema.sql":
        """
        CREATE TABLE tb_todos (
            todo_id INT AUTO_INCREMENT PRIMARY KEY,
            -- 說明: A-待辦, B-進行中, C-暫停（等待回覆中）, D-已完成（不再修改）
            status VARCHAR(20) NOT NULL,
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
