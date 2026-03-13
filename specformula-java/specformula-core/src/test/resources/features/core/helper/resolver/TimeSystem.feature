Feature: TIME-System 時間轉換系統單元測試
  ISAFeatureArgumentResolver 的 TIME-System 子系統負責時間表達式的解析與轉換。
  支援 @time()（ZonedDateTime）、@date()（LocalDate）、@localtime()（LocalTime）三種時間格式，
  以及 setNow/getNow 時間控制機制（ADR-0006）。

  Background:
    Given 初始化 ScenarioContext 和 ISAFeatureArgumentResolver

  Rule: @time() - ZonedDateTime 轉換測試

    Scenario: @time() - ISO 8601 完整日期時間
      When 解析時間表達式 "@time(\"2025-11-04T08:00:00\")"
      Then 結果應該是 ZonedDateTime 類型
      And 年為 2025，月為 11，日為 4
      And 時為 8，分為 0，秒為 0

    Scenario: @time() - ISO 8601 帶時區偏移
      When 解析時間表達式 "@time(\"2025-12-24T02:36:54-12:00\")"
      Then 結果應該是 ZonedDateTime 類型
      And 年為 2025，月為 12，日為 24
      And 時為 2，分為 36，秒為 54
      And 時區偏移為 "-12:00"

    Scenario: @time() - ISO 8601 UTC 時區 (Z)
      When 解析時間表達式 "@time(\"2025-11-04T08:00:00Z\")"
      Then 結果應該是 ZonedDateTime 類型
      And 年為 2025，月為 11，日為 4
      And 時為 8，分為 0，秒為 0
      And 時區為 "Z"

    Scenario: @time() - 只有日期（自動補 00:00:00）
      When 解析時間表達式 "@time(\"2025-11-04\")"
      Then 結果應該是 ZonedDateTime 類型
      And 年為 2025，月為 11，日為 4
      And 時為 0，分為 0，秒為 0

    Scenario: @time() - now（當前時間）
      When 解析時間表達式 "@time(\"now\")"
      Then 結果應該是 ZonedDateTime 類型
      And 結果應該接近系統當前時間

    Scenario: @time() - 相對時間表達式（now-1d）
      When 解析時間表達式 "@time(\"now-1d\")"
      Then 結果應該是 ZonedDateTime 類型
      And 結果應該約為 1 天前（允許 1 小時誤差）

    Scenario: @time() - 相對時間表達式（now-1s）- 減 1 秒
      When 解析時間表達式 "@time(\"now-1s\")"
      Then 結果應該是 ZonedDateTime 類型
      And 結果應該約為 1 秒前（允許 2 秒誤差）

    Scenario: @time() - 相對時間表達式（now-1m）- 減 1 分鐘
      When 解析時間表達式 "@time(\"now-1m\")"
      Then 結果應該是 ZonedDateTime 類型
      And 結果應該約為 1 分鐘前（允許 2 秒誤差）

    Scenario: @time() - 相對時間表達式（now-1h）- 減 1 小時
      When 解析時間表達式 "@time(\"now-1h\")"
      Then 結果應該是 ZonedDateTime 類型
      And 結果應該約為 1 小時前（允許 2 秒誤差）

    Scenario: @time() - 相對時間表達式（now-1M）- 減 1 個月
      When 解析時間表達式 "@time(\"now-1M\")"
      Then 結果應該是 ZonedDateTime 類型
      And 結果應該約為 1 個月前（允許 2 秒誤差）

    Scenario: @time() - 相對時間表達式（now+1s）- 加 1 秒
      When 解析時間表達式 "@time(\"now+1s\")"
      Then 結果應該是 ZonedDateTime 類型
      And 結果應該約為 1 秒後（允許 2 秒誤差）

    Scenario: @time() - 相對時間表達式（now+1m）- 加 1 分鐘
      When 解析時間表達式 "@time(\"now+1m\")"
      Then 結果應該是 ZonedDateTime 類型
      And 結果應該約為 1 分鐘後（允許 2 秒誤差）

    Scenario: @time() - 相對時間表達式（now+1h）- 加 1 小時
      When 解析時間表達式 "@time(\"now+1h\")"
      Then 結果應該是 ZonedDateTime 類型
      And 結果應該約為 1 小時後（允許 2 秒誤差）

    Scenario: @time() - 相對時間表達式（now+1M）- 加 1 個月
      When 解析時間表達式 "@time(\"now+1M\")"
      Then 結果應該是 ZonedDateTime 類型
      And 結果應該約為 1 個月後（允許 2 秒誤差）

    Scenario: @time() - 組合相對時間表達式（now-1M-1d-1h-1m-1s）
      When 解析時間表達式 "@time(\"now-1M-1d-1h-1m-1s\")"
      Then 結果應該是 ZonedDateTime 類型
      And 結果應該約為 1 個月 1 天 1 小時 1 分鐘 1 秒前（允許 2 秒誤差）

    Scenario: @time() - 錯誤格式應該拋例外
      When 解析時間表達式 "@time(\"invalid-date\")"
      Then 應該拋出例外

    Scenario: @time() - 不帶引號的參數
      When 解析時間表達式 "@time(2025-11-04T08:00:00)"
      Then 結果應該是 ZonedDateTime 類型

  Rule: ADR-0006 setNow() 和 getNow()

    Scenario: ADR-0006: setNow() - 使用 ISO 8601 格式設定當前時間
      When 設定當前時間為 "2025-11-04T08:00:00"
      Then scenarioContext 的 "now" 應該是 ZonedDateTime 類型
      And 年為 2025，月為 11，日為 4
      And 時為 8，分為 0，秒為 0

    Scenario: ADR-0006: setNow() - 使用帶時區的 ISO 8601 格式
      When 設定當前時間為 "2025-12-24T02:36:54+08:00"
      Then scenarioContext 的 "now" 應該是 ZonedDateTime 類型
      And 年為 2025，月為 12，日為 24
      And 時為 2，分為 36，秒為 54

    Scenario: ADR-0006: setNow() - 使用帶 Z 的 UTC 時區格式
      When 設定當前時間為 "2025-11-04T08:00:00Z"
      Then scenarioContext 的 "now" 應該是 ZonedDateTime 類型
      And 時區為 "Z"

    Scenario: ADR-0006: setNow() - 使用只有日期的格式
      When 設定當前時間為 "2025-11-04"
      Then scenarioContext 的 "now" 應該是 ZonedDateTime 類型
      And 年為 2025，月為 11，日為 4
      And 時為 0，分為 0，秒為 0

    Scenario: ADR-0006: getNow() - 取得設定的當前時間
      When 設定當前時間為 "2025-11-04T08:00:00"
      Then getNow() 應該返回 ZonedDateTime
      And 年為 2025，月為 11，日為 4
      And 時為 8，分為 0，秒為 0

    Scenario: ADR-0006: getNow() - 沒有設定時返回系統當前時間
      Then getNow() 應該返回系統當前時間

    Scenario: ADR-0006: @time("now") - 使用 setNow 設定後應該返回設定的時間
      Given 設定當前時間為 "2025-11-04T08:00:00"
      When 解析時間表達式 "@time(\"now\")"
      Then 結果應該是 ZonedDateTime 類型
      And 年為 2025，月為 11，日為 4
      And 時為 8，分為 0，秒為 0

    Scenario: ADR-0006: @time("now-1d") - 使用 setNow 設定後應該基於設定的時間計算
      Given 設定當前時間為 "2025-11-04T08:00:00"
      When 解析時間表達式 "@time(\"now-1d\")"
      Then 結果應該是 ZonedDateTime 類型
      And 年為 2025，月為 11，日為 3
      And 時為 8，分為 0，秒為 0

    Scenario: ADR-0006: setNow() - 錯誤格式應該拋例外
      When 設定當前時間為 "invalid-date"
      Then 應該拋出例外

  Rule: @date() - LocalDate 轉換測試

    Scenario: @date() - 斜線分隔格式 (2025/12/16)
      When 解析時間表達式 "@date(\"2025/12/16\")"
      Then 結果應該是 LocalDate 類型
      And 年為 2025，月為 12，日為 16

    Scenario: @date() - ISO 8601 格式 (2025-12-16)
      When 解析時間表達式 "@date(\"2025-12-16\")"
      Then 結果應該是 LocalDate 類型
      And 年為 2025，月為 12，日為 16

    Scenario: @date() - 錯誤格式應該拋例外
      When 解析時間表達式 "@date(\"invalid-date\")"
      Then 應該拋出例外

    Scenario: ADR-0006: @date("now") - 沒有 setNow 時返回系統當前日期
      When 解析時間表達式 "@date(\"now\")"
      Then 結果應該是 LocalDate 類型
      And 結果應該等於系統當前日期

    Scenario: ADR-0006: @date("now") - 使用 setNow 設定後應該返回設定的日期
      Given 設定當前時間為 "2025-11-04T08:00:00"
      When 解析時間表達式 "@date(\"now\")"
      Then 結果應該是 LocalDate 類型
      And 年為 2025，月為 11，日為 4

  Rule: @localtime() - LocalTime 轉換測試

    Scenario: @localtime() - 標準時間格式 (21:00)
      When 解析時間表達式 "@localtime(\"21:00\")"
      Then 結果應該是 LocalTime 類型
      And 時為 21，分為 0

    Scenario: @localtime() - 帶秒數格式 (21:00:30)
      When 解析時間表達式 "@localtime(\"21:00:30\")"
      Then 結果應該是 LocalTime 類型
      And 時為 21，分為 0，秒為 30

    Scenario: @localtime() - 錯誤格式應該拋例外
      When 解析時間表達式 "@localtime(\"invalid-time\")"
      Then 應該拋出例外

    Scenario: ADR-0006: @localtime("now") - 沒有 setNow 時返回系統當前時間
      When 解析時間表達式 "@localtime(\"now\")"
      Then 結果應該是 LocalTime 類型
      And 結果應該接近系統當前 LocalTime

    Scenario: ADR-0006: @localtime("now") - 使用 setNow 設定後應該返回設定的時間
      Given 設定當前時間為 "2025-11-04T08:30:45"
      When 解析時間表達式 "@localtime(\"now\")"
      Then 結果應該是 LocalTime 類型
      And 時為 8，分為 30，秒為 45

  Rule: VAR-System 整合測試 - 根據 ADR-0004 不支援

    Scenario: ADR-0004: 不支援 >contextKey 與 @time() 混合使用
      When 解析時間表達式 "@time(\"2025-11-04T08:00:00\")"
      Then 結果應該是 ZonedDateTime 類型
      And TIME-System 只負責轉換，不會自動存入 context 變數

    Scenario: ADR-0004: TIME-System 只應用於 API 參數轉換，不應用於變數賦值
      When 解析時間表達式 "@time(\"2025-11-04T08:00:00\")"
      Then 結果應該是 ZonedDateTime 類型
      And 年為 2025，月為 11，日為 4
      And 時為 8

    Scenario: ADR-0004: 正確用法 - 變數應該從 context 中已存在的值引用
      Given 設定變數 "orderTime" 為 ZonedDateTime "2025-11-04T08:00:00+08:00[Asia/Taipei]"
      When 解析變數引用 "$orderTime"
      Then 結果應該是 ZonedDateTime 類型
      And 結果應該等於設定的 ZonedDateTime
