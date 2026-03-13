Feature: CAS (Constraint Assertion System) 單元測試
  ISAFeatureArgumentResolver 的 CAS 子系統負責對實際值進行約束斷言驗證。
  支援數值比較、類型檢查、字串操作、集合/陣列、存在性、範圍檢查、時間相關及多重約束組合。

  Background:
    Given 初始化 ScenarioContext 和 ISAFeatureArgumentResolver

  Rule: 數值比較斷言

    Scenario: &eq - 應該驗證相等
      When 實際值為整數 100
      Then 約束 "&eq(100)" 驗證通過

    Scenario: &eq - 應該在不相等時失敗
      When 實際值為整數 100
      Then 約束 "&eq(200)" 驗證失敗

    Scenario: &eq - 應該支援變數引用
      Given 設定變數 "expectedValue" 為整數 100
      When 實際值為整數 100
      Then 約束 "&eq($expectedValue)" 驗證通過

    Scenario: &ne - 應該驗證不相等
      When 實際值為整數 100
      Then 約束 "&ne(200)" 驗證通過

    Scenario: &ne - 應該支援變數引用
      Given 設定變數 "unexpectedValue" 為整數 200
      When 實際值為整數 100
      Then 約束 "&ne($unexpectedValue)" 驗證通過

    Scenario: &gt - 應該驗證大於
      When 實際值為整數 100
      Then 約束 "&gt(50)" 驗證通過
      And 約束 "&gt(150)" 驗證失敗

    Scenario: &gt - 應該支援變數引用
      Given 設定變數 "minValue" 為整數 50
      Given 設定變數 "tooHighValue" 為整數 150
      When 實際值為整數 100
      Then 約束 "&gt($minValue)" 驗證通過
      And 約束 "&gt($tooHighValue)" 驗證失敗

    Scenario: &lt - 應該驗證小於
      When 實際值為整數 100
      Then 約束 "&lt(150)" 驗證通過
      And 約束 "&lt(50)" 驗證失敗

    Scenario: &lt - 應該支援變數引用
      Given 設定變數 "maxValue" 為整數 150
      Given 設定變數 "tooLowValue" 為整數 50
      When 實際值為整數 100
      Then 約束 "&lt($maxValue)" 驗證通過
      And 約束 "&lt($tooLowValue)" 驗證失敗

    Scenario: &ge - 應該驗證大於等於
      When 實際值為整數 100
      Then 約束 "&ge(100)" 驗證通過
      And 約束 "&ge(50)" 驗證通過
      And 約束 "&ge(150)" 驗證失敗

    Scenario: &ge - 應該支援變數引用
      Given 設定變數 "minValue" 為整數 100
      When 實際值為整數 100
      Then 約束 "&ge($minValue)" 驗證通過

    Scenario: &le - 應該驗證小於等於
      When 實際值為整數 100
      Then 約束 "&le(100)" 驗證通過
      And 約束 "&le(150)" 驗證通過
      And 約束 "&le(50)" 驗證失敗

    Scenario: &le - 應該支援變數引用
      Given 設定變數 "maxValue" 為整數 100
      When 實際值為整數 100
      Then 約束 "&le($maxValue)" 驗證通過

    Scenario: 數值比較 - 應該支援浮點數
      When 實際值為浮點數 99.99
      Then 約束 "&gt(99)" 驗證通過
      And 約束 "&lt(100)" 驗證通過

  Rule: 類型檢查斷言

    Scenario: &isNum - 應該驗證數字類型
      When 實際值為整數 100
      Then 約束 "&isNum" 驗證通過

    Scenario: &isNum - 非數字類型應該失敗
      When 實際值為字串 "100"
      Then 約束 "&isNum" 驗證失敗

    Scenario: &isStr - 應該驗證字串類型
      When 實際值為字串 "王大明"
      Then 約束 "&isStr" 驗證通過

    Scenario: &isStr - 非字串類型應該失敗
      When 實際值為整數 100
      Then 約束 "&isStr" 驗證失敗

    Scenario: &isBool - 應該驗證布林類型
      When 實際值為布林 true
      Then 約束 "&isBool" 驗證通過

    Scenario: &isBool - 非布林類型應該失敗
      When 實際值為字串 "true"
      Then 約束 "&isBool" 驗證失敗

    Scenario: &isNull - 應該驗證 null 值
      When 實際值為 null
      Then 約束 "&isNull" 驗證通過

    Scenario: &isNull - 非 null 值應該失敗
      When 實際值為字串 "王大明"
      Then 約束 "&isNull" 驗證失敗

    Scenario: &isNotNull - 應該驗證非 null 值
      When 實際值為字串 "王大明"
      Then 約束 "&isNotNull" 驗證通過

    Scenario: &isNotNull - null 應該失敗
      When 實際值為 null
      Then 約束 "&isNotNull" 驗證失敗

    Scenario: &isDef - 應該驗證已定義的值
      When 實際值為字串 "王大明"
      Then 約束 "&isDef" 驗證通過

    Scenario: &isDef - null（未定義）應該失敗
      When 實際值為 null
      Then 約束 "&isDef" 驗證失敗

  Rule: 字串操作斷言

    Scenario: &contains - 應該驗證包含子字串
      When 實際值為字串 "王大明"
      Then 約束 "&contains(\"王\")" 驗證通過
      And 約束 "&contains(\"大明\")" 驗證通過
      And 約束 "&contains(\"李\")" 驗證失敗

    Scenario: &startsWith - 應該驗證字串開頭
      When 實際值為字串 "wang@example.com"
      Then 約束 "&startsWith(\"wang\")" 驗證通過
      And 約束 "&startsWith(\"li\")" 驗證失敗

    Scenario: &endsWith - 應該驗證字串結尾
      When 實際值為字串 "wang@example.com"
      Then 約束 "&endsWith(\".com\")" 驗證通過
      And 約束 "&endsWith(\"example.com\")" 驗證通過
      And 約束 "&endsWith(\".tw\")" 驗證失敗

    Scenario: &matches - 應該驗證正則表達式匹配
      When 實際值為字串 "2025-01-15"
      Then 約束 "&matches(\"\d{4}-\d{2}-\d{2}\")" 驗證通過
      And 約束 "&matches(\"\d{2}/\d{2}/\d{4}\")" 驗證失敗

    Scenario: &length - 應該驗證字串長度範圍
      When 實際值為字串 "王大明"
      Then 約束 "&length(2,10)" 驗證通過
      And 約束 "&length(3,3)" 驗證通過
      And 約束 "&length(5,10)" 驗證失敗

    Scenario: 字串操作 - 應該對非字串類型失敗
      When 實際值為整數 12345
      Then 約束 "&contains(\"123\")" 驗證失敗

  Rule: 集合/陣列斷言

    Scenario: &hasItem - 應該驗證集合包含元素
      When 實際值為字串列表 "admin,user,guest"
      Then 約束 "&hasItem(\"admin\")" 驗證通過
      And 約束 "&hasItem(\"superadmin\")" 驗證失敗

    Scenario: &hasNoItem - 應該驗證集合不包含元素
      When 實際值為字串列表 "admin,user,guest"
      Then 約束 "&hasNoItem(\"superadmin\")" 驗證通過
      And 約束 "&hasNoItem(\"admin\")" 驗證失敗

    Scenario: &size - 應該驗證字串列表大小
      When 實際值為字串列表 "admin,user,guest"
      Then 約束 "&size(3)" 驗證通過
      And 約束 "&size(5)" 驗證失敗

    Scenario: &size - 應該驗證整數列表大小
      When 實際值為整數列表 "101,102,103,104,105"
      Then 約束 "&size(5)" 驗證通過
      And 約束 "&size(3)" 驗證失敗

    Scenario: &size - 應該驗證浮點數列表大小
      When 實際值為浮點數列表 "99.99,149.50,299.00"
      Then 約束 "&size(3)" 驗證通過
      And 約束 "&size(1)" 驗證失敗

    Scenario: &size - 應該驗證布林列表大小
      When 實際值為布林列表 "true,false,true,true"
      Then 約束 "&size(4)" 驗證通過
      And 約束 "&size(2)" 驗證失敗

    Scenario: &size - 單一元素列表
      When 實際值為字串列表 "admin"
      Then 約束 "&size(1)" 驗證通過
      And 約束 "&size(0)" 驗證失敗

    Scenario: &size - 空列表應該為 0
      When 實際值為空列表
      Then 約束 "&size(0)" 驗證通過
      And 約束 "&size(1)" 驗證失敗

    Scenario: &size - 應該驗證 Map 列表（Object Array）大小
      When 實際值為 Map 列表:
        | name  | email              |
        | Alice | alice@example.com  |
        | Bob   | bob@example.com    |
      Then 約束 "&size(2)" 驗證通過
      And 約束 "&size(3)" 驗證失敗

    Scenario: &size - 單一元素 Map 列表
      When 實際值為 Map 列表:
        | id | name  |
        | 1  | Alice |
      Then 約束 "&size(1)" 驗證通過
      And 約束 "&size(0)" 驗證失敗

    Scenario: &size - 多欄位 Map 列表
      When 實際值為 Map 列表:
        | id | name  | role  | status   |
        | 1  | Alice | admin | active   |
        | 2  | Bob   | user  | active   |
        | 3  | Carol | guest | inactive |
      Then 約束 "&size(3)" 驗證通過
      And 約束 "&size(4)" 驗證失敗

    Scenario: &size - 應該驗證字串長度
      When 實際值為字串 "Alice"
      Then 約束 "&size(5)" 驗證通過
      And 約束 "&size(3)" 驗證失敗

    Scenario: &size - 對數值類型應該失敗
      When 實際值為整數 42
      Then 約束 "&size(42)" 驗證失敗

    Scenario: &size - 對 null 值應該失敗
      When 實際值為 null
      Then 約束 "&size(0)" 驗證失敗

    Scenario: &isEmpty - 應該驗證空集合
      When 實際值為空列表
      Then 約束 "&isEmpty" 驗證通過

    Scenario: &isEmpty - 非空集合應該失敗
      When 實際值為字串列表 "admin"
      Then 約束 "&isEmpty" 驗證失敗

    Scenario: &isNotEmpty - 應該驗證非空集合
      When 實際值為字串列表 "admin"
      Then 約束 "&isNotEmpty" 驗證通過

    Scenario: &isNotEmpty - 空集合應該失敗
      When 實際值為空列表
      Then 約束 "&isNotEmpty" 驗證失敗

  Rule: 存在性斷言

    Scenario: &exists - 應該驗證值存在
      When 實際值為字串 "王大明"
      Then 約束 "&exists" 驗證通過

    Scenario: &exists - null 應該失敗
      When 實際值為 null
      Then 約束 "&exists" 驗證失敗

    Scenario: &notExists - 應該驗證值不存在
      When 實際值為 null
      Then 約束 "&notExists" 驗證通過

    Scenario: &notExists - 非 null 值應該失敗
      When 實際值為字串 "王大明"
      Then 約束 "&notExists" 驗證失敗

    Scenario: &hasField - 應該驗證 Map 包含欄位
      When 實際值為 Map:
        | key   | value          |
        | name  | 王大明         |
        | email | wang@example.tw |
      Then 約束 "&hasField(\"name\")" 驗證通過
      And 約束 "&hasField(\"age\")" 驗證失敗

    Scenario: &noField - 應該驗證 Map 不包含欄位
      When 實際值為 Map:
        | key  | value  |
        | name | 王大明 |
      Then 約束 "&noField(\"age\")" 驗證通過
      And 約束 "&noField(\"name\")" 驗證失敗

  Rule: 範圍檢查斷言

    Scenario: &between - 應該驗證值在範圍內
      When 實際值為整數 25
      Then 約束 "&between(18,65)" 驗證通過
      And 約束 "&between(25,25)" 驗證通過
      And 約束 "&between(30,65)" 驗證失敗

    Scenario: &notBetween - 應該驗證值不在範圍內
      When 實際值為整數 17
      Then 約束 "&notBetween(18,65)" 驗證通過

    Scenario: &notBetween - 在範圍內應該失敗
      When 實際值為整數 25
      Then 約束 "&notBetween(18,65)" 驗證失敗

    Scenario: &oneOf - 應該驗證值為其中之一
      When 實際值為字串 "admin"
      Then 約束 "&oneOf(\"admin\",\"user\",\"guest\")" 驗證通過
      And 約束 "&oneOf(\"user\",\"guest\")" 驗證失敗

    Scenario: &noneOf - 應該驗證值不為其中之一
      When 實際值為字串 "active"
      Then 約束 "&noneOf(\"banned\",\"suspended\")" 驗證通過
      And 約束 "&noneOf(\"active\",\"inactive\")" 驗證失敗

    Scenario: 範圍檢查 - 應該支援變數引用
      Given 設定變數 "minAge" 為整數 18
      Given 設定變數 "maxAge" 為整數 65
      When 實際值為整數 25
      Then 約束 "&between($minAge,$maxAge)" 驗證通過

  Rule: 時間相關斷言

    Scenario: &before - 應該驗證 LocalDateTime 在指定時間之前
      When 實際值為 LocalDateTime "2025-01-01T10:00:00"
      Then 約束 "&before(\"2025-12-31T23:59:59\")" 驗證通過

    Scenario: &before - 未來時間應該失敗
      When 實際值為 LocalDateTime "2026-01-01T10:00:00"
      Then 約束 "&before(\"2025-12-31T23:59:59\")" 驗證失敗

    Scenario: &before - 應該支援 Number timestamp
      When 實際值為 LocalDateTime "2025-01-01T10:00:00" 的 timestamp
      Then 約束 "&before(\"2025-12-31T23:59:59\")" 驗證通過

    Scenario: &before - 字串實際值應該成功解析並驗證
      When 實際值為字串 "2025-01-01T10:00:00"
      Then 約束 "&before(\"2025-12-31T23:59:59\")" 驗證通過

    Scenario: &after - 應該驗證 LocalDateTime 在指定時間之後
      When 實際值為 LocalDateTime "2026-01-01T10:00:00"
      Then 約束 "&after(\"2025-01-01T00:00:00\")" 驗證通過

    Scenario: &after - 過去時間應該失敗
      When 實際值為 LocalDateTime "2024-01-01T10:00:00"
      Then 約束 "&after(\"2025-01-01T00:00:00\")" 驗證失敗

    Scenario: &after - 應該支援 Number timestamp
      When 實際值為 LocalDateTime "2026-01-01T10:00:00" 的 timestamp
      Then 約束 "&after(\"2025-01-01T00:00:00\")" 驗證通過

    Scenario: &after - 字串實際值應該成功解析並驗證
      When 實際值為字串 "2026-01-01T10:00:00"
      Then 約束 "&after(\"2025-01-01T00:00:00\")" 驗證通過

    Scenario: &sameDay - 應該驗證同一天（LocalDate）
      When 實際值為 LocalDate "2025-01-15"
      Then 約束 "&sameDay(\"2025-01-15\")" 驗證通過
      And 約束 "&sameDay(\"2025-01-16\")" 驗證失敗

    Scenario: &sameDay - 應該支援 Number timestamp
      When 實際值為 LocalDateTime "2025-01-15T10:30:00" 的 timestamp
      Then 約束 "&sameDay(\"2025-01-15\")" 驗證通過

    Scenario: &sameDay - 字串實際值應該成功解析並驗證
      When 實際值為字串 "2025-01-15"
      Then 約束 "&sameDay(\"2025-01-15\")" 驗證通過

    Scenario: &withinDays - 應該驗證在幾天內
      When 實際值為當前 LocalDateTime
      Then 約束 "&withinDays(0)" 驗證通過
      And 約束 "&withinDays(1)" 驗證通過

    Scenario: &withinDays - 超過天數範圍應該失敗
      When 實際值為 10 天前的 LocalDateTime
      Then 約束 "&withinDays(5)" 驗證失敗

    Scenario: &withinDays - 應該支援 Number timestamp
      When 實際值為當前 LocalDateTime 的 timestamp
      Then 約束 "&withinDays(0)" 驗證通過

    Scenario: &withinDays - 字串實際值應該成功解析並驗證
      When 實際值為當前 LocalDateTime 的字串
      Then 約束 "&withinDays(0)" 驗證通過

    Scenario: &sameTime - 應該驗證精準時間比對
      When 實際值為 LocalDateTime "2025-11-04T08:00:00"
      Then 約束 "&sameTime(\"2025-11-04T08:00:00\")" 驗證通過

    Scenario: &sameTime - 不同時間應該失敗
      When 實際值為 LocalDateTime "2025-11-04T08:00:01"
      Then 約束 "&sameTime(\"2025-11-04T08:00:00\")" 驗證失敗

    Scenario: &sameTime - 應該支援 Number timestamp
      When 實際值為 LocalDateTime "2025-11-04T08:00:00" 的 timestamp
      Then 約束 "&sameTime(\"2025-11-04T08:00:00\")" 驗證通過

    Scenario: &sameTime - 字串實際值應該成功解析並驗證
      When 實際值為字串 "2025-11-04T08:00:00"
      Then 約束 "&sameTime(\"2025-11-04T08:00:00\")" 驗證通過

    Scenario: &sameTime - 應該忽略毫秒差異
      When 實際值為 LocalDateTime "2025-11-04T08:00:00" 帶奈秒 500000000
      Then 約束 "&sameTime(\"2025-11-04T08:00:00\")" 驗證通過

    Scenario: &sameTime - 支援不帶秒格式 (HH:mm)
      When 實際值為 LocalDateTime "2025-11-04T08:00"
      Then 約束 "&sameTime(\"2025-11-04T08:00\")" 驗證通過

    Scenario: &sameTime - 支援 UTC Z 字串格式
      When 實際值為字串 "2025-01-15T10:30:00.000Z"
      Then 約束 "&sameTime(\"2025-01-15T10:30:00.000Z\")" 驗證通過

    Scenario: &timeRange - 應該驗證時間範圍
      When 實際值為 LocalDateTime "2025-11-04T10:30:00"
      Then 約束 "&timeRange(\"09:00\",\"17:00\")" 驗證通過

    Scenario: &timeRange - 工作時間外應該失敗
      When 實際值為 LocalDateTime "2025-11-04T18:00:00"
      Then 約束 "&timeRange(\"09:00\",\"17:00\")" 驗證失敗

    Scenario: &timeRange - 應該支援 Number timestamp
      When 實際值為 LocalDateTime "2025-11-04T10:30:00" 的 timestamp
      Then 約束 "&timeRange(\"09:00\",\"17:00\")" 驗證通過

    Scenario: &timeRange - 字串實際值應該成功解析並驗證
      When 實際值為字串 "2025-11-04T10:30:00"
      Then 約束 "&timeRange(\"09:00\",\"17:00\")" 驗證通過

    Scenario: &timeRange - 應該處理邊界情況
      When 實際值為 LocalDateTime "2025-11-04T09:00:00"
      Then 約束 "&timeRange(\"09:00\",\"17:00\")" 驗證通過
      When 實際值為 LocalDateTime "2025-11-04T17:00:00"
      Then 約束 "&timeRange(\"09:00\",\"17:00\")" 驗證通過
      When 實際值為 LocalDateTime "2025-11-04T08:59:59"
      Then 約束 "&timeRange(\"09:00\",\"17:00\")" 驗證失敗

  Rule: 不同時區比較

    Scenario: &sameTime - 不同時區的相同時刻應該視為相等
      When 實際值為 ZonedDateTime "2025-11-04T00:00:00Z"
      Then 約束 "&sameTime(\"2025-11-04T08:00:00+08:00\")" 驗證通過

    Scenario: &sameTime - ZonedDateTime 實際值應該正確轉換並比較
      When 實際值為 ZonedDateTime "2025-11-04T08:00:00+08:00[Asia/Taipei]"
      Then 約束 "&sameTime(\"2025-11-04T08:00:00+08:00\")" 驗證通過

    Scenario: &after - 不同時區的時間比較應該基於實際時刻
      When 實際值為 ZonedDateTime "2025-11-04T10:00:00+09:00[Asia/Tokyo]"
      Then 約束 "&after(\"2025-11-04T00:00:00Z\")" 驗證通過

    Scenario: &sameDay - ZonedDateTime 應該基於本地日期比較
      When 實際值為 ZonedDateTime "2025-01-15T14:30:00+08:00[Asia/Taipei]"
      Then 約束 "&sameDay(\"2025-01-15\")" 驗證通過

  Rule: ISO 8601 帶時區格式字串支援

    Scenario: &sameTime - 應該支援 ISO 8601 UTC 格式 (Z 結尾)
      When 實際值為 Instant "2025-12-18T10:00:00.000Z"
      Then 約束 "&sameTime(\"2025-12-18T10:00:00.000Z\")" 驗證通過

    Scenario: &sameTime - 應該支援 ISO 8601 帶時區偏移格式 (+08:00)
      When 實際值為 ZonedDateTime "2025-12-18T10:00:00+08:00[Asia/Taipei]"
      Then 約束 "&sameTime(\"2025-12-18T10:00:00+08:00\")" 驗證通過

    Scenario: &sameTime - ISO 8601 UTC 格式與 ZonedDateTime 比較應該基於相同時刻
      When 實際值為 ZonedDateTime "2025-12-18T18:00:00+08:00[Asia/Taipei]"
      Then 約束 "&sameTime(\"2025-12-18T10:00:00.000Z\")" 驗證通過

    Scenario: &sameTime - ISO 8601 帶毫秒的 UTC 格式應該正確解析
      When 實際值為 Instant "2025-12-18T10:00:00.123Z"
      Then 約束 "&sameTime(\"2025-12-18T10:00:00.000Z\")" 驗證通過

    Scenario: &before - 應該支援 ISO 8601 UTC 格式 (Z 結尾)
      When 實際值為 Instant "2025-12-18T08:00:00.000Z"
      Then 約束 "&before(\"2025-12-18T10:00:00.000Z\")" 驗證通過

    Scenario: &after - 應該支援 ISO 8601 UTC 格式 (Z 結尾)
      When 實際值為 Instant "2025-12-18T12:00:00.000Z"
      Then 約束 "&after(\"2025-12-18T10:00:00.000Z\")" 驗證通過

    Scenario: &before/&after - 跨時區比較應該基於實際時刻
      When 實際值為 Instant "2025-12-18T02:00:00.000Z"
      Then 約束 "&before(\"2025-12-18T11:00:00+08:00\")" 驗證通過
      And 約束 "&after(\"2025-12-18T09:00:00+08:00\")" 驗證通過

  Rule: Instant 型別支援

    Scenario: &sameTime - Instant 實際值應該正確轉換並比較
      When 實際值為 Instant "2025-11-04T00:00:00Z" 轉換為系統時區
      Then 約束應該驗證通過（與系統時區對應的 LocalDateTime）

    Scenario: &before - Instant 實際值應該正確進行時間比較
      When 實際值為 Instant "2025-01-01T00:00:00Z"
      Then 約束 "&before(\"2025-12-31T23:59:59\")" 驗證通過

    Scenario: &after - Instant 實際值應該正確進行時間比較
      When 實際值為 Instant "2026-01-01T00:00:00Z"
      Then 約束 "&after(\"2025-01-01T00:00:00\")" 驗證通過

    Scenario: &sameDay - Instant 實際值應該基於系統時區的日期比較
      When 實際值為 Instant "2025-01-15T00:00:00Z" 轉換為系統時區
      Then 約束應該通過 sameDay 驗證（與系統時區對應的日期）

    Scenario: &withinDays - Instant 實際值應該正確計算天數差異
      When 實際值為當前 Instant
      Then 約束 "&withinDays(0)" 驗證通過

    Scenario: &timeRange - Instant 實際值應該正確驗證時間範圍
      When 實際值為系統時區 "2025-11-04T10:30:00" 的 Instant
      Then 約束 "&timeRange(\"09:00\",\"17:00\")" 驗證通過

  Rule: java.sql.Date 型別支援（JDBC DATE 欄位）

    # Bug: convertToLocalDateTime() 處理了 java.sql.Timestamp 但遺漏 java.sql.Date
    # JDBC ResultSet.getObject() 讀取 DATE 欄位會回傳 java.sql.Date
    # 導致 convertToLocalDateTime() 返回 null → 所有時間相關斷言失敗

    Scenario: &sameDay - java.sql.Date 實際值應該正確轉換並驗證
      When 實際值為 java.sql.Date "2025-01-15"
      Then 約束 "&sameDay(\"2025-01-15\")" 驗證通過

    Scenario: &sameDay - java.sql.Date 不同天應該失敗
      When 實際值為 java.sql.Date "2025-01-15"
      Then 約束 "&sameDay(\"2025-01-16\")" 驗證失敗

    Scenario: &before - java.sql.Date 實際值應該正確進行時間比較
      When 實際值為 java.sql.Date "2025-01-01"
      Then 約束 "&before(\"2025-12-31T23:59:59\")" 驗證通過

    Scenario: &after - java.sql.Date 實際值應該正確進行時間比較
      When 實際值為 java.sql.Date "2026-01-01"
      Then 約束 "&after(\"2025-01-01T00:00:00\")" 驗證通過

    Scenario: &withinDays - java.sql.Date 實際值應該正確計算天數差異
      When 實際值為今天的 java.sql.Date
      Then 約束 "&withinDays(0)" 驗證通過

    Scenario: &sameDay - java.sql.Date 與 today 比較應該通過
      When 實際值為今天的 java.sql.Date
      Then 約束 "&sameDay(\"today\")" 驗證通過

    Scenario: &sameDay - java.sql.Date 應該支援變數引用
      Given 設定變數 "expectedDate" 為字串 "2025-01-15"
      When 實際值為 java.sql.Date "2025-01-15"
      Then 約束 "&sameDay($expectedDate)" 驗證通過

    Scenario: &before - java.sql.Date 晚於指定時間應該失敗
      When 實際值為 java.sql.Date "2026-12-31"
      Then 約束 "&before(\"2026-01-01T00:00:00\")" 驗證失敗

    Scenario: &after - java.sql.Date 早於指定時間應該失敗
      When 實際值為 java.sql.Date "2025-01-01"
      Then 約束 "&after(\"2025-06-15T00:00:00\")" 驗證失敗

    Scenario: &withinDays - java.sql.Date 超過天數範圍應該失敗
      When 實際值為 30 天前的 java.sql.Date
      Then 約束 "&withinDays(5)" 驗證失敗

    Scenario: &sameTime - java.sql.Date 應該轉換為當天 00:00:00 進行比較
      When 實際值為 java.sql.Date "2026-01-06"
      Then 約束 "&sameTime(\"2026-01-06T00:00:00\")" 驗證通過

    Scenario: &sameTime - java.sql.Date 與非零時間應該失敗
      When 實際值為 java.sql.Date "2026-01-06"
      Then 約束 "&sameTime(\"2026-01-06T10:30:00\")" 驗證失敗

    Scenario: &timeRange - java.sql.Date 的 00:00 在包含零點的範圍內應該通過
      When 實際值為 java.sql.Date "2026-01-06"
      Then 約束 "&timeRange(\"00:00\",\"08:00\")" 驗證通過

    Scenario: &timeRange - java.sql.Date 的 00:00 在工作時間範圍外應該失敗
      When 實際值為 java.sql.Date "2026-01-06"
      Then 約束 "&timeRange(\"09:00\",\"17:00\")" 驗證失敗

    Scenario: java.sql.Date 應該支援多重約束組合
      When 實際值為 java.sql.Date "2026-01-06"
      Then 約束 "&isNotNull &sameDay(\"2026-01-06\")" 驗證通過

    Scenario: java.sql.Date 多重約束中部分失敗應該整體失敗
      When 實際值為 java.sql.Date "2026-01-06"
      Then 約束 "&sameDay(\"2026-01-06\") &after(\"2026-06-01T00:00:00\")" 驗證失敗

  Rule: 多重約束組合

    Scenario: 應該支援多個約束條件組合（AND 邏輯）
      When 實際值為整數 100
      Then 約束 "&isNum &gt(0) &le(200)" 驗證通過
      And 約束 "&isNum &gt(0) &le(50)" 驗證失敗

    Scenario: 應該支援字串的多重約束
      When 實際值為字串 "wang@example.com"
      Then 約束 "&isStr &contains(\"@\") &endsWith(\".com\")" 驗證通過

    Scenario: 應該支援集合的多重約束
      When 實際值為字串列表 "admin,user,guest"
      Then 約束 "&isNotEmpty &size(3) &hasItem(\"admin\")" 驗證通過

    Scenario: 應該支援類型檢查與值約束的組合
      When 實際值為整數 50000
      Then 約束 "&isNum &gt(0) &between(30000,100000)" 驗證通過

    Scenario: 應該支援多重約束中的變數引用
      Given 設定變數 "minSalary" 為整數 30000
      Given 設定變數 "maxSalary" 為整數 100000
      When 實際值為整數 50000
      Then 約束 "&isNum &gt($minSalary) &lt($maxSalary)" 驗證通過
      And 約束 "&between($minSalary,$maxSalary)" 驗證通過

  Rule: 完整場景

    Scenario: 完整場景 - 訂單創建驗證
      When 實際值為整數 12345
      Then 約束 "&isNum &gt(0)" 驗證通過
      When 實際值為浮點數 299.99
      Then 約束 "&isNum &gt(0) &le(10000)" 驗證通過
      When 實際值為字串 "pending"
      Then 約束 "&isStr &oneOf(\"pending\",\"processing\",\"completed\")" 驗證通過
      When 實際值為當前 LocalDateTime
      Then 約束 "&exists &withinDays(0)" 驗證通過

    Scenario: 完整場景 - 用戶註冊驗證
      When 實際值為整數 10001
      Then 約束 "&isNum &gt(0)" 驗證通過
      When 實際值為字串 "王大明"
      Then 約束 "&isStr &length(2,50)" 驗證通過
      When 實際值為字串 "wang@example.tw"
      Then 約束 "&isStr &contains(\"@\")" 驗證通過
      When 實際值為字串 "user"
      Then 約束 "&isNotNull &oneOf(\"admin\",\"user\",\"guest\")" 驗證通過

    Scenario: 完整場景 - 打卡系統驗證
      When 實際值為今天 09:30:00 的 timestamp
      Then 約束 "&timeRange(\"09:00\",\"17:00\")" 驗證通過
      When 實際值為 LocalDateTime "2025-11-04T08:00:00" 帶奈秒 500000000
      Then 約束 "&sameTime(\"2025-11-04T08:00:00\")" 驗證通過

  Rule: JSON 陣列字串支援（extractActualValue fallback）

    # Bug: extractActualValue() 遇到 ArrayNode 時呼叫 node.toString() 得到 JSON 字串
    # 導致 &size 把 JSON 字串當成 String.length() 計算，結果錯誤
    # 例如：實際值 [{"userId":875,...},{"userId":876,...}] → &size(2) 應通過但失敗

    Scenario: &size - JSON 物件陣列字串應該正確計算元素數量
      When 實際值為 JSON 陣列字串 "[{\"userId\":875,\"employeeName\":\"員工B\"},{\"userId\":876,\"employeeName\":\"員工C\"}]"
      Then 約束 "&size(2)" 驗證通過
      And 約束 "&size(3)" 驗證失敗

    Scenario: &size - JSON 字串陣列應該正確計算元素數量
      When 實際值為 JSON 陣列字串 "[\"100001\",\"100002\",\"100003\",\"100004\",\"100005\"]"
      Then 約束 "&size(5)" 驗證通過
      And 約束 "&size(3)" 驗證失敗

    Scenario: &size - JSON 數值陣列應該正確計算元素數量
      When 實際值為 JSON 陣列字串 "[1,2,3]"
      Then 約束 "&size(3)" 驗證通過
      And 約束 "&size(1)" 驗證失敗

    Scenario: &size - JSON 空陣列字串應該為 0
      When 實際值為 JSON 陣列字串 "[]"
      Then 約束 "&size(0)" 驗證通過
      And 約束 "&size(1)" 驗證失敗

    Scenario: &size - JSON 單一元素陣列字串
      When 實際值為 JSON 陣列字串 "[{\"id\":1}]"
      Then 約束 "&size(1)" 驗證通過
      And 約束 "&size(0)" 驗證失敗

    Scenario: &isNotEmpty - JSON 非空陣列字串應該通過
      When 實際值為 JSON 陣列字串 "[\"a\",\"b\"]"
      Then 約束 "&isNotEmpty" 驗證通過

    Scenario: &isEmpty - JSON 空陣列字串應該通過
      When 實際值為 JSON 陣列字串 "[]"
      Then 約束 "&isEmpty" 驗證通過

    Scenario: &hasItem - JSON 字串陣列應該支援元素查找
      When 實際值為 JSON 陣列字串 "[\"admin\",\"user\",\"guest\"]"
      Then 約束 "&hasItem(\"admin\")" 驗證通過
      And 約束 "&hasItem(\"superadmin\")" 驗證失敗

    Scenario: &hasNoItem - JSON 字串陣列應該支援元素排除查找
      When 實際值為 JSON 陣列字串 "[\"咖啡\",\"蛋糕\",\"奶茶\"]"
      Then 約束 "&hasNoItem(\"冰淇淋\")" 驗證通過
      And 約束 "&hasNoItem(\"咖啡\")" 驗證失敗

    Scenario: JSON 物件陣列字串應該支援多重約束組合
      When 實際值為 JSON 陣列字串 "[{\"cardId\":1001,\"memberName\":\"王大明\"},{\"cardId\":1002,\"memberName\":\"李小華\"}]"
      Then 約束 "&isNotNull &isNotEmpty &size(2)" 驗證通過

    Scenario: &size - 完整場景：集點卡兌換紀錄驗證
      When 實際值為 JSON 陣列字串 "[{\"redeemId\":501,\"redeemDate\":\"2026-01-07\",\"item\":\"免費咖啡\"},{\"redeemId\":502,\"redeemDate\":\"2026-01-06\",\"item\":\"折價券\"},{\"redeemId\":503,\"redeemDate\":\"2026-01-05\",\"item\":\"免費蛋糕\"}]"
      Then 約束 "&size(3)" 驗證通過

    Scenario: &size - 完整場景：集點卡會員編號列表驗證
      When 實際值為 JSON 陣列字串 "[\"M10001\",\"M10002\",\"M10003\",\"M10004\",\"M10005\"]"
      Then 約束 "&size(5)" 驗證通過

  Rule: parseConstraints 約束條件解析

    Scenario: 應該正確解析簡單的約束條件
      When 解析約束條件字串 "&gt(0)"
      Then 約束條件數量為 1

    Scenario: 應該正確解析包含 TIME-System 表達式的約束條件
      When 解析約束條件字串 "&sameTime(\"@time(\\\"2024-01-15T10:30:00+08:00\\\")\")"
      Then 約束條件數量為 1
      And 約束條件參數應該包含 "@time("
      And 約束條件參數應該包含 "2024-01-15T10:30:00+08:00"

    Scenario: 應該正確解析多層嵌套括號的約束條件
      When 解析約束條件字串 "&customFunc(\"outer(inner(value))\")"
      Then 約束條件數量為 1

    Scenario: 應該正確解析多個約束條件
      When 解析約束條件字串 "&gt(0) &lt(100) &isNum"
      Then 約束條件數量為 3
