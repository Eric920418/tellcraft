Feature: ISA Spec Reader - 缺少 config 應讀取失敗
  當 isa.yml 缺少必要的 config 區塊時，
  IsaSpecReader 應拋出例外。
  config 必須同時包含 api 與 data，且 data.source 不可為空。
  api: resource_path、project_path 必填，time_format 非必填預設 iso。
  data.source[]: name、resource_path、project_path 必填，db_type 非必填預設 h2。

  Scenario: config 完全缺失
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      instructions:
        - name: Time control
          format: ^time$
          instruction_type: time_control
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析應拋出例外訊息為 "isa.yml must contain a 'config' section"

  Scenario: config 缺少 api 與 data
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config: {}
      instructions:
        - name: Time control
          format: ^time$
          instruction_type: time_control
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析應拋出例外訊息為 "config must contain 'api'"

  Scenario: config 缺少 api
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config:
        data:
          source:
            - name: default
              resource_path: specs/data
              project_path: path/to/data
              db_type: mssql
      instructions: []
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析應拋出例外訊息為 "config must contain 'api'"

  Scenario: config 缺少 data
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
      instructions: []
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析應拋出例外訊息為 "config must contain 'data'"

  Scenario: config.data.source 為空陣列
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          source: []
      instructions: []
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析應拋出例外訊息為 "config.data.source must not be empty"

  Scenario: config.api.resource_path 缺失
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          project_path: path/to/api
        data:
          source:
            - name: default
              resource_path: specs/data
              project_path: path/to/data
      instructions: []
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析應拋出例外訊息為 "config.api.resource_path is required"

  Scenario: config.api.project_path 缺失
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
        data:
          source:
            - name: default
              resource_path: specs/data
              project_path: path/to/data
      instructions: []
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析應拋出例外訊息為 "config.api.project_path is required"

  Scenario: config.data.source[].name 缺失
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          source:
            - resource_path: specs/data
              project_path: path/to/data
      instructions: []
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析應拋出例外訊息為 "config.data.source[].name is required"

  Scenario: config.data.source[].resource_path 缺失
    Given spec.isa 存在一個 isa.yml 檔:
      """yaml
      config:
        api:
          resource_path: specs/api
          project_path: path/to/api
        data:
          source:
            - name: default
              project_path: path/to/data
      instructions: []
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析應拋出例外訊息為 "config.data.source['default'].resource_path is required"

  Scenario: config.data.source[].project_path 缺失
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
      instructions: []
      """
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析應拋出例外訊息為 "config.data.source['default'].project_path is required"

  Scenario: isa.yml 檔案不存在
    Given spec.isa 使用不存在的路徑 "nonexistent/path"
    When spec.isa 讀取 isa.yml
    Then spec.isa 解析應拋出例外訊息為 "isa.yml not found at: nonexistent/path"
