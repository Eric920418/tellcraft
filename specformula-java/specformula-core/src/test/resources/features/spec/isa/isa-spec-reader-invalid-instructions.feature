Feature: ISA Spec Reader - instructions 配置錯誤應讀取失敗
  當 isa.yml 的 instructions 配置不正確時，
  IsaSpecReader 應拋出例外。

  Rule: instruction_type 必須是已知的類型

    Scenario: 不存在的 instruction_type
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
          - name: Unknown instruction
            format: ^unknown$
            instruction_type: unknown_type
        """
      When spec.isa 讀取 isa.yml
      Then spec.isa 解析應拋出例外訊息為 "Unknown instruction_type: unknown_type in instruction: Unknown instruction"

  Rule: entity_setup 驗證

    Scenario: 缺少 entity 命名群組
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
          - name: Bad entity setup
            format: ^prepare$
            instruction_type: entity_setup
        """
      When spec.isa 讀取 isa.yml
      Then spec.isa 解析應拋出例外訊息為 "instruction_type 'entity_setup' requires (?P<entity>...) in format, but instruction 'Bad entity setup' is missing it"

  Rule: entity_validate 驗證

    Scenario: 缺少 entity 命名群組
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
          - name: Bad entity validate
            format: ^validate$
            instruction_type: entity_validate
        """
      When spec.isa 讀取 isa.yml
      Then spec.isa 解析應拋出例外訊息為 "instruction_type 'entity_validate' requires (?P<entity>...) in format, but instruction 'Bad entity validate' is missing it"

  Rule: entity_non_existence_validate 驗證

    Scenario: 缺少 entity 命名群組
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
          - name: Bad entity non-existence validate
            format: ^not exist$
            instruction_type: entity_non_existence_validate
        """
      When spec.isa 讀取 isa.yml
      Then spec.isa 解析應拋出例外訊息為 "instruction_type 'entity_non_existence_validate' requires (?P<entity>...) in format, but instruction 'Bad entity non-existence validate' is missing it"

  Rule: api_call 驗證

    Scenario: 缺少 summary 命名群組
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
          - name: Bad api call
            format: ^call api$
            instruction_type: api_call
        """
      When spec.isa 讀取 isa.yml
      Then spec.isa 解析應拋出例外訊息為 "instruction_type 'api_call' requires (?P<summary>...) in format, but instruction 'Bad api call' is missing it"

  Rule: response_validate 驗證

    Scenario: 缺少 summary 命名群組
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
          - name: Bad response validate
            format: ^validate response$
            instruction_type: response_validate
            data_format: data_table
        """
      When spec.isa 讀取 isa.yml
      Then spec.isa 解析應拋出例外訊息為 "instruction_type 'response_validate' requires (?P<summary>...) in format, but instruction 'Bad response validate' is missing it"

    Scenario: 缺少 status_code 命名群組
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
          - name: Bad response validate
            format: ^(?P<summary>.+?)回應$
            instruction_type: response_validate
            data_format: data_table
        """
      When spec.isa 讀取 isa.yml
      Then spec.isa 解析應拋出例外訊息為 "instruction_type 'response_validate' requires (?P<status_code>...) in format, but instruction 'Bad response validate' is missing it"

    Scenario: data_format 缺失
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
          - name: Bad response validate
            format: ^(?P<summary>.+?)\((?P<status_code>\d{3})\)回應$
            instruction_type: response_validate
        """
      When spec.isa 讀取 isa.yml
      Then spec.isa 解析應拋出例外訊息為 "instruction_type 'response_validate' requires data_format to be one of [data_table, json] but instruction 'Bad response validate' has: null"

    Scenario: data_format 使用不支援的值
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
          - name: Bad response validate
            format: ^(?P<summary>.+?)\((?P<status_code>\d{3})\)回應$
            instruction_type: response_validate
            data_format: xml
        """
      When spec.isa 讀取 isa.yml
      Then spec.isa 解析應拋出例外訊息為 "instruction_type 'response_validate' requires data_format to be one of [data_table, json] but instruction 'Bad response validate' has: xml"

  Rule: custom 驗證

    Scenario: custom 指令 data_format 使用不支援的值
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
          - name: Custom step with bad format
            format: ^my custom step$
            instruction_type: custom
            data_format: xml
        """
      When spec.isa 讀取 isa.yml
      Then spec.isa 解析應拋出例外訊息為 "instruction_type 'custom' requires data_format to be one of [data_table, json] but instruction 'Custom step with bad format' has: xml"
