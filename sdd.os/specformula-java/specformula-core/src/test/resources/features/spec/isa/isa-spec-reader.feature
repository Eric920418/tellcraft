Feature: ISA Spec Reader - 正確讀取 isa.yml
  IsaSpecReader 負責解析 isa.yml，產出 IsaSpec 物件，
  包含 config 區塊與 instructions 清單。
  config 一定包含 api 與 data，instructions 設定參考實際 isa.yml。
  api: resource_path、project_path 必填，time_format 非必填預設 iso。
  data: permission 非必填預設 isolated（isolated | shared）。
  data.source[]: name、resource_path、project_path 必填，db_type 非必填預設 h2。

  Scenario: 解析單一指令
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          source:
            - name: default
              resource_path: specs/data
              project_path: path/to/data
              db_type: mssql
      instructions:
        - name: Time control
          format: ^現在的時間是 "(?P<time>)"$
          instruction_type: time_control
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析結果為:
      """json
      {
        "config": {
          "api": {
            "resource_path": "specs/api",
            "project_path": "path/to/api",
            "time_format": "iso"
          },
          "data": {
            "permission": "isolated",
            "reuse": false,
            "source": [
              {
                "name": "default",
                "resource_path": "specs/data",
                "project_path": "path/to/data",
                "db_type": "mssql"
              }
            ]
          }
        },
        "instructions": [
          {
            "name": "Time control",
            "format": "^現在的時間是 \"(?P<time>)\"$",
            "instruction_type": "time_control",
            "data_format": null
          }
        ]
      }
      """

  Scenario: 解析含 data_format 的指令
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          source:
            - name: default
              resource_path: specs/data
              project_path: path/to/data
              db_type: mssql
      instructions:
        - name: Response validation with API summary and status code
          format: ^(?P<summary>.+?)\((?P<status_code>\d{3})\)回應,?\s*with table:$
          instruction_type: response_validate
          data_format: data_table
        - name: Response validation with API summary and status code (JSON)
          format: ^(?P<summary>.+?)\((?P<status_code>\d{3})\)回應為,?\s*with JSON:$
          instruction_type: response_validate
          data_format: json
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析結果為:
      """json
      {
        "config": {
          "api": {
            "resource_path": "specs/api",
            "project_path": "path/to/api",
            "time_format": "iso"
          },
          "data": {
            "permission": "isolated",
            "reuse": false,
            "source": [
              {
                "name": "default",
                "resource_path": "specs/data",
                "project_path": "path/to/data",
                "db_type": "mssql"
              }
            ]
          }
        },
        "instructions": [
          {
            "name": "Response validation with API summary and status code",
            "format": "^(?P<summary>.+?)\\((?P<status_code>\\d{3})\\)回應,?\\s*with table:$",
            "instruction_type": "response_validate",
            "data_format": "data_table"
          },
          {
            "name": "Response validation with API summary and status code (JSON)",
            "format": "^(?P<summary>.+?)\\((?P<status_code>\\d{3})\\)回應為,?\\s*with JSON:$",
            "instruction_type": "response_validate",
            "data_format": "json"
          }
        ]
      }
      """

  Scenario: 解析完整 instructions
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          source:
            - name: default
              resource_path: specs/data
              project_path: path/to/data
              db_type: mssql
      instructions:
        - name: Time control
          format: ^現在的時間是 "(?P<time>)"$
          instruction_type: time_control
        - name: Data preparation
          format: ^準備一個(?P<entity>[\u4e00-\u9fffa-zA-Z0-9_]+), with table:$
          instruction_type: entity_setup
        - name: API call
          format: ^\((?:No Actor|UID="(?P<userId>\$[\w.]+)")\) (?P<summary>.+?), call table:$
          instruction_type: api_call
        - name: Response validation with API summary and status code
          format: ^(?P<summary>.+?)\((?P<status_code>\d{3})\)回應,?\s*with table:$
          instruction_type: response_validate
          data_format: data_table
        - name: Response validation with API summary and status code (JSON)
          format: ^(?P<summary>.+?)\((?P<status_code>\d{3})\)回應為,?\s*with JSON:$
          instruction_type: response_validate
          data_format: json
        - name: Database validation
          format: ^應該存在一個(?P<entity>[\u4e00-\u9fffa-zA-Z0-9_]+), with table:$
          instruction_type: entity_validate
        - name: Database non-existence validation
          format: ^應該不存在一個(?P<entity>[\u4e00-\u9fffa-zA-Z0-9_]+), with table:$
          instruction_type: entity_non_existence_validate
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析結果為:
      """json
      {
        "config": {
          "api": {
            "resource_path": "specs/api",
            "project_path": "path/to/api",
            "time_format": "iso"
          },
          "data": {
            "permission": "isolated",
            "reuse": false,
            "source": [
              {
                "name": "default",
                "resource_path": "specs/data",
                "project_path": "path/to/data",
                "db_type": "mssql"
              }
            ]
          }
        },
        "instructions": [
          {
            "name": "Time control",
            "format": "^現在的時間是 \"(?P<time>)\"$",
            "instruction_type": "time_control",
            "data_format": null
          },
          {
            "name": "Data preparation",
            "format": "^準備一個(?P<entity>[\\u4e00-\\u9fffa-zA-Z0-9_]+), with table:$",
            "instruction_type": "entity_setup",
            "data_format": null
          },
          {
            "name": "API call",
            "format": "^\\((?:No Actor|UID=\"(?P<userId>\\$[\\w.]+)\")\\) (?P<summary>.+?), call table:$",
            "instruction_type": "api_call",
            "data_format": null
          },
          {
            "name": "Response validation with API summary and status code",
            "format": "^(?P<summary>.+?)\\((?P<status_code>\\d{3})\\)回應,?\\s*with table:$",
            "instruction_type": "response_validate",
            "data_format": "data_table"
          },
          {
            "name": "Response validation with API summary and status code (JSON)",
            "format": "^(?P<summary>.+?)\\((?P<status_code>\\d{3})\\)回應為,?\\s*with JSON:$",
            "instruction_type": "response_validate",
            "data_format": "json"
          },
          {
            "name": "Database validation",
            "format": "^應該存在一個(?P<entity>[\\u4e00-\\u9fffa-zA-Z0-9_]+), with table:$",
            "instruction_type": "entity_validate",
            "data_format": null
          },
          {
            "name": "Database non-existence validation",
            "format": "^應該不存在一個(?P<entity>[\\u4e00-\\u9fffa-zA-Z0-9_]+), with table:$",
            "instruction_type": "entity_non_existence_validate",
            "data_format": null
          }
        ]
      }
      """

  Scenario: 解析 custom 指令含 data_format
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          source:
            - name: default
              resource_path: specs/data
              project_path: path/to/data
              db_type: mssql
      instructions:
        - name: Custom step with data table
          format: ^my custom step, with table:$
          instruction_type: custom
          data_format: data_table
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析結果為:
      """json
      {
        "config": {
          "api": {
            "resource_path": "specs/api",
            "project_path": "path/to/api",
            "time_format": "iso"
          },
          "data": {
            "permission": "isolated",
            "reuse": false,
            "source": [
              {
                "name": "default",
                "resource_path": "specs/data",
                "project_path": "path/to/data",
                "db_type": "mssql"
              }
            ]
          }
        },
        "instructions": [
          {
            "name": "Custom step with data table",
            "format": "^my custom step, with table:$",
            "instruction_type": "custom",
            "data_format": "data_table"
          }
        ]
      }
      """

  Scenario: 解析 custom 指令不帶 data_format
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          source:
            - name: default
              resource_path: specs/data
              project_path: path/to/data
              db_type: mssql
      instructions:
        - name: Custom step without data format
          format: ^my custom step$
          instruction_type: custom
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析結果為:
      """json
      {
        "config": {
          "api": {
            "resource_path": "specs/api",
            "project_path": "path/to/api",
            "time_format": "iso"
          },
          "data": {
            "permission": "isolated",
            "reuse": false,
            "source": [
              {
                "name": "default",
                "resource_path": "specs/data",
                "project_path": "path/to/data",
                "db_type": "mssql"
              }
            ]
          }
        },
        "instructions": [
          {
            "name": "Custom step without data format",
            "format": "^my custom step$",
            "instruction_type": "custom",
            "data_format": null
          }
        ]
      }
      """

  Scenario: 解析 config 含 time_format
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
          time_format: timestamp
        data:
          source:
            - name: default
              resource_path: specs/data
              project_path: path/to/data
              db_type: mssql
      instructions: []
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析結果為:
      """json
      {
        "config": {
          "api": {
            "resource_path": "specs/api",
            "project_path": "path/to/api",
            "time_format": "timestamp"
          },
          "data": {
            "permission": "isolated",
            "reuse": false,
            "source": [
              {
                "name": "default",
                "resource_path": "specs/data",
                "project_path": "path/to/data",
                "db_type": "mssql"
              }
            ]
          }
        },
        "instructions": []
      }
      """

  Scenario: 解析 config 含多個 Data source
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          source:
            - name: default
              resource_path: specs/data
              project_path: path/to/data
              db_type: mssql
            - name: analytics
              resource_path: specs/analytics-data
              project_path: path/to/analytics-data
              db_type: postgresql
      instructions: []
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析結果為:
      """json
      {
        "config": {
          "api": {
            "resource_path": "specs/api",
            "project_path": "path/to/api",
            "time_format": "iso"
          },
          "data": {
            "permission": "isolated",
            "reuse": false,
            "source": [
              {
                "name": "default",
                "resource_path": "specs/data",
                "project_path": "path/to/data",
                "db_type": "mssql"
              },
              {
                "name": "analytics",
                "resource_path": "specs/analytics-data",
                "project_path": "path/to/analytics-data",
                "db_type": "postgresql"
              }
            ]
          }
        },
        "instructions": []
      }
      """

  Scenario: db_type 未指定時預設為 h2
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          source:
            - name: default
              resource_path: specs/data
              project_path: path/to/data
      instructions: []
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析結果為:
      """json
      {
        "config": {
          "api": {
            "resource_path": "specs/api",
            "project_path": "path/to/api",
            "time_format": "iso"
          },
          "data": {
            "permission": "isolated",
            "reuse": false,
            "source": [
              {
                "name": "default",
                "resource_path": "specs/data",
                "project_path": "path/to/data",
                "db_type": "h2"
              }
            ]
          }
        },
        "instructions": []
      }
      """

  Scenario: permission 未指定時預設為 isolated
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          source:
            - name: default
              resource_path: specs/data
              project_path: path/to/data
              db_type: postgresql
      instructions: []
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析結果為:
      """json
      {
        "config": {
          "api": {
            "resource_path": "specs/api",
            "project_path": "path/to/api",
            "time_format": "iso"
          },
          "data": {
            "permission": "isolated",
            "reuse": false,
            "source": [
              {
                "name": "default",
                "resource_path": "specs/data",
                "project_path": "path/to/data",
                "db_type": "postgresql"
              }
            ]
          }
        },
        "instructions": []
      }
      """

  Scenario: permission 指定為 shared
    Given spec.isa 存在一個 isa.yml 檔:
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
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析結果為:
      """json
      {
        "config": {
          "api": {
            "resource_path": "specs/api",
            "project_path": "path/to/api",
            "time_format": "iso"
          },
          "data": {
            "permission": "shared",
            "reuse": false,
            "source": [
              {
                "name": "order_db",
                "resource_path": "specs/data/order",
                "project_path": "path/to/order",
                "db_type": "postgresql"
              },
              {
                "name": "user_db",
                "resource_path": "specs/data/user",
                "project_path": "path/to/user",
                "db_type": "postgresql"
              }
            ]
          }
        },
        "instructions": []
      }
      """

  Scenario: reuse 指定為 true
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          reuse: true
          source:
            - name: order_db
              resource_path: specs/data/order
              project_path: path/to/order
              db_type: postgresql
      instructions: []
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析結果為:
      """json
      {
        "config": {
          "api": {
            "resource_path": "specs/api",
            "project_path": "path/to/api",
            "time_format": "iso"
          },
          "data": {
            "permission": "isolated",
            "reuse": true,
            "source": [
              {
                "name": "order_db",
                "resource_path": "specs/data/order",
                "project_path": "path/to/order",
                "db_type": "postgresql"
              }
            ]
          }
        },
        "instructions": []
      }
      """

  Scenario: reuse 未指定時預設為 false
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          source:
            - name: default
              resource_path: specs/data
              project_path: path/to/data
              db_type: mssql
      instructions: []
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析結果為:
      """json
      {
        "config": {
          "api": {
            "resource_path": "specs/api",
            "project_path": "path/to/api",
            "time_format": "iso"
          },
          "data": {
            "permission": "isolated",
            "reuse": false,
            "source": [
              {
                "name": "default",
                "resource_path": "specs/data",
                "project_path": "path/to/data",
                "db_type": "mssql"
              }
            ]
          }
        },
        "instructions": []
      }
      """
