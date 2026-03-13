Feature: ApiCall - TimeSystem 整合
  ApiCall 支援 TIME-System 表達式，根據 timeFormat 設定
  將時間值轉換為不同格式後送入 HTTP 請求。

  Scenario: 預設 ISO 格式 (timeFormat 未指定)
    Given api-call ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/api/events",
            "summary": "Create event"
          }
        ]
      }
      """
    And api-call "Create event" 回應 200:
      """json
      {}
      """
    When api-call "Create event" WithoutActor:
      | eventTime                          | meetingDate         | startTime              |
      | @time("2025-12-25T14:30:00+08:00") | @date("2025-12-16") | @localtime("09:00:00") |
    Then api-call 請求的 body 包含 "eventTime" 為 "2025-12-25T14:30:00+08:00"
    And api-call 請求的 body 包含 "meetingDate" 為 "2025-12-16"
    And api-call 請求的 body 包含 "startTime" 為 "09:00:00"

  Scenario: 明確指定 ISO 格式
    Given api-call ApiSpec timeFormat "ISO":
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/api/events",
            "summary": "Create event"
          }
        ]
      }
      """
    And api-call "Create event" 回應 200:
      """json
      {}
      """
    When api-call "Create event" WithoutActor:
      | eventTime                          | meetingDate         | startTime              |
      | @time("2025-12-25T14:30:00+08:00") | @date("2025-12-16") | @localtime("09:00:00") |
    Then api-call 請求的 body 包含 "eventTime" 為 "2025-12-25T14:30:00+08:00"
    And api-call 請求的 body 包含 "meetingDate" 為 "2025-12-16"
    And api-call 請求的 body 包含 "startTime" 為 "09:00:00"

  Scenario: TIMESTAMP 格式 (Unix timestamp 毫秒)
    Given api-call ApiSpec timeFormat "TIMESTAMP":
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/api/events",
            "summary": "Create event"
          }
        ]
      }
      """
    And api-call "Create event" 回應 200:
      """json
      {}
      """
    When api-call "Create event" WithoutActor:
      | eventTime                          | meetingDate         |
      | @time("2025-12-25T14:30:00+08:00") | @date("2025-12-16") |
    Then api-call 請求的 body "eventTime" 符合數字格式
    And api-call 請求的 body "meetingDate" 符合數字格式

  Scenario: EPOCH 格式 (Unix timestamp 秒)
    Given api-call ApiSpec timeFormat "EPOCH":
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/api/events",
            "summary": "Create event"
          }
        ]
      }
      """
    And api-call "Create event" 回應 200:
      """json
      {}
      """
    When api-call "Create event" WithoutActor:
      | eventTime                          | meetingDate         |
      | @time("2025-12-25T14:30:00+08:00") | @date("2025-12-16") |
    Then api-call 請求的 body "eventTime" 符合數字格式
    And api-call 請求的 body "meetingDate" 符合數字格式

  Scenario: DATE_ONLY 格式
    Given api-call ApiSpec timeFormat "DATE_ONLY":
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/api/events",
            "summary": "Create event"
          }
        ]
      }
      """
    And api-call "Create event" 回應 200:
      """json
      {}
      """
    When api-call "Create event" WithoutActor:
      | eventTime                          | meetingDate         |
      | @time("2025-12-25T14:30:00+08:00") | @date("2025-12-16") |
    Then api-call 請求的 body 包含 "eventTime" 為 "2025-12-25"
    And api-call 請求的 body 包含 "meetingDate" 為 "2025-12-16"

  Scenario: TIME_ONLY 格式
    Given api-call ApiSpec timeFormat "TIME_ONLY":
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/api/events",
            "summary": "Create event"
          }
        ]
      }
      """
    And api-call "Create event" 回應 200:
      """json
      {}
      """
    When api-call "Create event" WithoutActor:
      | eventTime                          | startTime              |
      | @time("2025-12-25T14:30:00+08:00") | @localtime("09:00:00") |
    Then api-call 請求的 body 包含 "eventTime" 為 "14:30:00"
    And api-call 請求的 body 包含 "startTime" 為 "09:00:00"

  Scenario: 不支援的格式應拋出例外
    Given api-call ApiSpec timeFormat "INVALID_FORMAT":
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/api/events",
            "summary": "Create event"
          }
        ]
      }
      """
    And api-call "Create event" 回應 200:
      """json
      {}
      """
    When api-call "Create event" WithoutActor:
      | eventTime                          |
      | @time("2025-12-25T14:30:00+08:00") |
    Then api-call 應拋出例外訊息包含 "不支援的時間格式"

  Scenario: 非時間值不受 timeFormat 影響
    Given api-call ApiSpec timeFormat "TIMESTAMP":
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/api/events",
            "summary": "Create event"
          }
        ]
      }
      """
    And api-call "Create event" 回應 200:
      """json
      {}
      """
    When api-call "Create event" WithoutActor:
      | eventTime                          | title   | count | enabled |
      | @time("2025-12-25T14:30:00+08:00") | Meeting | 10    | true    |
    Then api-call 請求的 body "eventTime" 符合數字格式
    And api-call 請求的 body 包含 "title" 為 "Meeting"
    And api-call 請求的 body 包含 "count" 為 "10"
    And api-call 請求的 body 包含 "enabled" 為 "true"

  Scenario: 時間格式應用於 Query 和 Path 參數
    Given api-call ApiSpec timeFormat "DATE_ONLY":
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/api/events/{date}",
            "summary": "Create event",
            "parameters": [
              { "name": "date", "in": "path" },
              { "name": "from", "in": "query" }
            ]
          }
        ]
      }
      """
    And api-call "Create event" 回應 200:
      """json
      {}
      """
    When api-call "Create event" WithoutActor:
      | P:date                | Q:from                             |
      | @date("2025-12-25")   | @time("2025-12-01T00:00:00+08:00") |
    Then api-call 請求的 path 包含 "2025-12-25"
    And api-call 請求的 query 參數 "from" 為 "2025-12-01"
