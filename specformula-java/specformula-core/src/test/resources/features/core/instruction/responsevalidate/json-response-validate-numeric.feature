Feature: JsonResponseValidate - 數值智能比較
  JsonResponseValidate 在比對 JSON 數值欄位時，應使用數值語義比較而非字串比較。
  根據 JSON RFC 8259 標準，100000.0 與 100000.00 在數值上完全相同，測試應通過。

  Scenario: 尾隨零數量不同應通過 (信用卡帳單 1500.0 vs 1500.00)
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/credit-cards/{id}/bill",
            "summary": "查詢帳單",
            "parameters": [
              { "name": "id", "in": "path" }
            ]
          }
        ]
      }
      """
    And response-validate 設定回應 "查詢帳單" 狀態碼 200:
      """json
      { "totalDue": 1500.0 }
      """
    When response-validate 驗證 "查詢帳單" (200), with Json:
      """json
      { "totalDue": 1500.00 }
      """
    Then response-validate 通過

  Scenario: 不帶小數點 vs 帶小數點應通過 (轉帳金額 3000 vs 3000.0)
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/api/transfers",
            "summary": "銀行轉帳"
          }
        ]
      }
      """
    And response-validate 設定回應 "銀行轉帳" 狀態碼 200:
      """json
      { "amount": 3000.0 }
      """
    When response-validate 驗證 "銀行轉帳" (200), with Json:
      """json
      { "amount": 3000 }
      """
    Then response-validate 通過

  Scenario: 零值的不同表示法應通過 (帳戶餘額 0 vs 0.0 vs 0.00)
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/accounts/{id}",
            "summary": "查詢帳戶",
            "parameters": [
              { "name": "id", "in": "path" }
            ]
          }
        ]
      }
      """
    And response-validate 設定回應 "查詢帳戶" 狀態碼 200:
      """json
      { "balance": 0.0, "pendingAmount": 0.00, "overdraft": 0 }
      """
    When response-validate 驗證 "查詢帳戶" (200), with Json:
      """json
      { "balance": 0.00, "pendingAmount": 0.0, "overdraft": 0.0 }
      """
    Then response-validate 通過

  Scenario: 小數位數不同但數值相同應通過 (紅利點數折抵 3.5 vs 3.50)
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/credit-cards/{id}/rewards",
            "summary": "查詢紅利",
            "parameters": [
              { "name": "id", "in": "path" }
            ]
          }
        ]
      }
      """
    And response-validate 設定回應 "查詢紅利" 狀態碼 200:
      """json
      { "cashbackRate": 3.5 }
      """
    When response-validate 驗證 "查詢紅利" (200), with Json:
      """json
      { "cashbackRate": 3.50 }
      """
    Then response-validate 通過

  Scenario: 科學記號 vs 一般表示應通過 (大額消費 1.5E+4 vs 15000.0)
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/credit-cards/{id}/transactions/{txnId}",
            "summary": "查詢消費",
            "parameters": [
              { "name": "id", "in": "path" },
              { "name": "txnId", "in": "path" }
            ]
          }
        ]
      }
      """
    And response-validate 設定回應 "查詢消費" 狀態碼 200:
      """json
      { "amount": 1.5E+4 }
      """
    When response-validate 驗證 "查詢消費" (200), with Json:
      """json
      { "amount": 15000.0 }
      """
    Then response-validate 通過

  Scenario: 負數的不同表示法應通過 (退款金額 -250.0 vs -250.00)
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/credit-cards/{id}/transactions/{txnId}",
            "summary": "查詢消費",
            "parameters": [
              { "name": "id", "in": "path" },
              { "name": "txnId", "in": "path" }
            ]
          }
        ]
      }
      """
    And response-validate 設定回應 "查詢消費" 狀態碼 200:
      """json
      { "refundAmount": -250.0 }
      """
    When response-validate 驗證 "查詢消費" (200), with Json:
      """json
      { "refundAmount": -250.00 }
      """
    Then response-validate 通過

  Scenario: 多個欄位混合數值格式驗證應通過 (信用卡帳單明細)
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/credit-cards/{id}/bill",
            "summary": "查詢帳單",
            "parameters": [
              { "name": "id", "in": "path" }
            ]
          }
        ]
      }
      """
    And response-validate 設定回應 "查詢帳單" 狀態碼 200:
      """json
      {
        "totalDue": 12500.0,
        "minimumPayment": 1250.5,
        "interestCharge": 375,
        "lateFee": 300.00
      }
      """
    When response-validate 驗證 "查詢帳單" (200), with Json:
      """json
      {
        "totalDue": 12500.00,
        "minimumPayment": 1250.50,
        "interestCharge": 375.0,
        "lateFee": 300.000
      }
      """
    Then response-validate 通過

  Scenario: 巢狀物件中的數值比較應通過 (帳單.消費明細)
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/credit-cards/{id}/bill",
            "summary": "查詢帳單",
            "parameters": [
              { "name": "id", "in": "path" }
            ]
          }
        ]
      }
      """
    And response-validate 設定回應 "查詢帳單" 狀態碼 200:
      """json
      {
        "bill": {
          "totalDue": 12500.0,
          "cashbackDiscount": 125.5
        }
      }
      """
    When response-validate 驗證 "查詢帳單" (200), with Json:
      """json
      {
        "bill": {
          "totalDue": 12500.00,
          "cashbackDiscount": 125.50
        }
      }
      """
    Then response-validate 通過

  Scenario: 陣列中的數值比較應通過 (分期帳單明細)
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/credit-cards/{id}/installments",
            "summary": "查詢分期",
            "parameters": [
              { "name": "id", "in": "path" }
            ]
          }
        ]
      }
      """
    And response-validate 設定回應 "查詢分期" 狀態碼 200:
      """json
      {
        "installments": [
          { "period": 1, "principal": 4000.0, "fee": 50.5 },
          { "period": 2, "principal": 4000.0, "fee": 45.3 }
        ]
      }
      """
    When response-validate 驗證 "查詢分期" (200), with Json:
      """json
      {
        "installments": [
          { "period": 1, "principal": 4000.00, "fee": 50.50 },
          { "period": 2, "principal": 4000.00, "fee": 45.30 }
        ]
      }
      """
    Then response-validate 通過

  Scenario: 超大金額精度應保持 (BigDecimal 等級)
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/accounts/{id}",
            "summary": "查詢帳戶",
            "parameters": [
              { "name": "id", "in": "path" }
            ]
          }
        ]
      }
      """
    And response-validate 設定回應 "查詢帳戶" 狀態碼 200:
      """json
      { "balance": 999999999999.99 }
      """
    When response-validate 驗證 "查詢帳戶" (200), with Json:
      """json
      { "balance": 999999999999.990 }
      """
    Then response-validate 通過

  Scenario: 整數 vs 浮點數應通過 (JSON 不區分整數和浮點數)
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "post",
            "path": "/api/transfers",
            "summary": "銀行轉帳"
          }
        ]
      }
      """
    And response-validate 設定回應 "銀行轉帳" 狀態碼 200:
      """json
      { "amount": 50000 }
      """
    When response-validate 驗證 "銀行轉帳" (200), with Json:
      """json
      { "amount": 50000.0 }
      """
    Then response-validate 通過

  Scenario: 數值實際不同應失敗 (帳單金額 1500.00 vs 1500.01)
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/credit-cards/{id}/bill",
            "summary": "查詢帳單",
            "parameters": [
              { "name": "id", "in": "path" }
            ]
          }
        ]
      }
      """
    And response-validate 設定回應 "查詢帳單" 狀態碼 200:
      """json
      { "totalDue": 1500.01 }
      """
    When response-validate 驗證 "查詢帳單" (200), with Json:
      """json
      { "totalDue": 1500.00 }
      """
    Then response-validate 失敗, 訊息包含 "值不匹配"

  Scenario: JSON 字串數值 vs 數值型別應失敗
    Given response-validate 回應驗證 ApiSpec:
      """json
      {
        "operations": [
          {
            "method": "get",
            "path": "/api/credit-cards/{id}/bill",
            "summary": "查詢帳單",
            "parameters": [
              { "name": "id", "in": "path" }
            ]
          }
        ]
      }
      """
    And response-validate 設定回應 "查詢帳單" 狀態碼 200:
      """json
      { "totalDue": "1500.0" }
      """
    When response-validate 驗證 "查詢帳單" (200), with Json:
      """json
      { "totalDue": 1500.00 }
      """
    Then response-validate 失敗, 訊息包含 "值不匹配"
