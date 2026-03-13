Feature: ISA Spec Reader - config 參數值錯誤應讀取失敗
  當 isa.yml 的 config 參數值不符合規範時，
  IsaSpecReader 應拋出例外。
  api.time_format 只能輸入 iso、timestamp、epoch、date_only、time_only。
  data.permission 只能輸入 isolated、shared。
  data.source[].name 不能重複。
  data.source[].db_type 只能輸入 h2、postgresql、mssql、mysql。

  Scenario: time_format 使用不支援的值
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
          time_format: unknown_format
        data:
          source:
            - name: default
              resource_path: specs/data
              project_path: path/to/data
      instructions: []
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析應拋出例外訊息為 "config.api.time_format must be one of [date_only, epoch, iso, time_only, timestamp] but got: unknown_format"

  Scenario: data.source 名稱重複
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
            - name: default
              resource_path: specs/other
              project_path: path/to/other
      instructions: []
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析應拋出例外訊息為 "config.data.source[].name must be unique, duplicate: default"

  Scenario: db_type 使用不支援的值
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
              db_type: oracle
      instructions: []
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析應拋出例外訊息為 "config.data.source['default'].db_type must be one of [h2, mssql, mysql, postgresql] but got: oracle"

  Scenario: permission 使用不支援的值
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          permission: readonly
          source:
            - name: default
              resource_path: specs/data
              project_path: path/to/data
      instructions: []
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析應拋出例外訊息為 "config.data.permission must be one of [isolated, shared] but got: readonly"
