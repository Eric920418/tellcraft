Feature: TimeControl - 設定測試情境時間
  TimeControl 透過 resolver.setNow() 設定當前時間，
  支援一般日期、ISO 時間格式、@time()/@date() 時間系統表達式。
  驗證使用 resolver.getNow() 取得設定後的時間。

  Scenario: 一般日期格式
    When time-control 設定時間為 "2025-12-25"
    Then time-control 現在時間的年月日為 2025-12-25
    And time-control 現在時間的時分秒為 "00:00:00"

  Scenario: ISO 格式（不含時區）
    When time-control 設定時間為 "2025-11-04T08:00:00"
    Then time-control 現在時間的年月日為 2025-11-04
    And time-control 現在時間的時分秒為 "08:00:00"

  Scenario: ISO 格式（含時區 +08:00）
    When time-control 設定時間為 "2025-12-25T14:30:00+08:00"
    Then time-control 現在時間的年月日為 2025-12-25
    And time-control 現在時間的時分秒為 "14:30:00"
    And time-control 現在時間的時區偏移為 "+08:00"

  Scenario: ISO 格式（UTC Z）
    When time-control 設定時間為 "2025-12-25T06:30:00Z"
    Then time-control 現在時間的年月日為 2025-12-25
    And time-control 現在時間的時分秒為 "06:30:00"
    And time-control 現在時間的時區偏移為 "Z"

  Scenario: @time() 包裝 ISO 格式
    When time-control 設定時間為 "@time(2025-12-25T14:30:00+08:00)"
    Then time-control 現在時間的年月日為 2025-12-25
    And time-control 現在時間的時分秒為 "14:30:00"
    And time-control 現在時間的時區偏移為 "+08:00"

  Scenario: @time() 包裝 ISO 格式（含引號與負時區）
    When time-control 設定時間為 "@time(\"2025-12-24T02:36:54-12:00\")"
    Then time-control 現在時間的年月日為 2025-12-24
    And time-control 現在時間的時分秒為 "02:36:54"
    And time-control 現在時間的時區偏移為 "-12:00"

  Scenario: @time() 包裝 ISO 格式（含引號與正時區）
    When time-control 設定時間為 "@time(\"2025-12-19T10:00:00+08:00\")"
    Then time-control 現在時間的年月日為 2025-12-19
    And time-control 現在時間的時分秒為 "10:00:00"
    And time-control 現在時間的時區偏移為 "+08:00"

  Scenario: @time(now) 凍結當前時間
    When time-control 設定時間為 "@time(now)"
    Then time-control 現在時間為 ZonedDateTime 類型

  Scenario: @time(now-1d) 基於已設定時間
    Given time-control 設定時間為 "2025-11-04T08:00:00"
    When time-control 設定時間為 "@time(now-1d)"
    Then time-control 現在時間的年月日為 2025-11-03
    And time-control 現在時間的時分秒為 "08:00:00"

  Scenario: @time(now+2h-30m)
    Given time-control 設定時間為 "2025-11-04T08:00:00"
    When time-control 設定時間為 "@time(now+2h-30m)"
    Then time-control 現在時間的年月日為 2025-11-04
    And time-control 現在時間的時分秒為 "09:30:00"

  Scenario: @time(now-1M) 月份
    Given time-control 設定時間為 "2025-11-04T08:00:00"
    When time-control 設定時間為 "@time(now-1M)"
    Then time-control 現在時間的年月日為 2025-10-04
    And time-control 現在時間的時分秒為 "08:00:00"

  Scenario: @time(now-1M-1d+3h) 複合相對時間
    Given time-control 設定時間為 "2025-11-04T08:00:00"
    When time-control 設定時間為 "@time(now-1M-1d+3h)"
    Then time-control 現在時間的年月日為 2025-10-03
    And time-control 現在時間的時分秒為 "11:00:00"

  Scenario: @date() 日期表達式
    When time-control 設定時間為 "@date(2025-12-16)"
    Then time-control 現在時間的年月日為 2025-12-16
    And time-control 現在時間的時分秒為 "00:00:00"

  Scenario: 空字串應拋出例外
    When time-control 設定時間為 ""
    Then time-control 設定時間應拋出例外訊息包含 "缺少時間參數"

  Scenario: 空白字串應拋出例外
    When time-control 設定時間為 "   "
    Then time-control 設定時間應拋出例外訊息包含 "缺少時間參數"
