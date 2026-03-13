@entity_validate
Feature: EntityValidate - DECIMAL 小數位數不一致比對
  測試當 Feature DataTable 的預期值（String）與 DB 實際值（BigDecimal）的小數位數不同時，
  EntityValidate 應以數值語義比較（BigDecimal.compareTo），而非字串比較。

  背景：JDBC 回傳 BigDecimal 的 scale 取決於 DB 欄位定義（如 DECIMAL(18,4) → scale=4），
  而 Feature DataTable 的預期值是使用者撰寫的字串（如 "1000000.00"），兩者 scale 可能不同。
  valuesEqual() 必須能正確處理 "1000000.00" == BigDecimal("1000000.0000") 的情境。

  Rule: DECIMAL scale 不一致 - 開戶與帳戶餘額

    @h2 @postgresql @mysql @mssql
    Scenario: 開立儲蓄帳戶 - 初始餘額 0 與 DECIMAL scale 不一致
      Given entity-validate primary 建立資料表 tb_SavingsAccount:
        | column          | type          | pk | notnull | default | auto | fk |
        | id              | BIGINT        | Y  |         |         |      |    |
        | account_holder  | VARCHAR       |    | Y       |         |      |    |
        | balance         | DECIMAL(10,2) |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table             |
        | 儲蓄帳戶 | tb_SavingsAccount |
      And entity-validate 準備一個 儲蓄帳戶:
        | id | accountHolder | balance |
        | 1  | 王小明        | 0.00    |
      When entity-validate 驗證 儲蓄帳戶 資料:
        | id | accountHolder | balance |
        | 1  | 王小明        | 0       |
      Then entity-validate 通過

    @h2 @postgresql @mysql @mssql
    Scenario: 定期存款 - 本金 2 位小數對比 DB 4 位小數
      Given entity-validate primary 建立資料表 tb_FixedDeposit:
        | column    | type          | pk | notnull | default | auto | fk |
        | id        | BIGINT        | Y  |         |         |      |    |
        | principal | DECIMAL(18,4) |    |         |         |      |    |
        | rate      | DECIMAL(8,4)  |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table           |
        | 定期存款 | tb_FixedDeposit |
      And entity-validate 準備一個 定期存款:
        | id | principal      | rate   |
        | 1  | 1000000.0000   | 3.2500 |
      When entity-validate 驗證 定期存款 資料:
        | id | principal   | rate |
        | 1  | 1000000.00  | 3.25 |
      Then entity-validate 通過

  Rule: DECIMAL scale 不一致 - 貸款審核與放款

    @h2 @postgresql @mysql @mssql
    Scenario: 房貸審核 - 多筆申請額度 scale 不一致
      Given entity-validate primary 建立資料表 tb_MortgageApplication:
        | column           | type          | pk | notnull | default | auto | fk |
        | id               | BIGINT        | Y  |         |         |      |    |
        | applicant        | VARCHAR       |    | Y       |         |      |    |
        | requested_amount | DECIMAL(18,4) |    |         |         |      |    |
        | approved_amount  | DECIMAL(18,4) |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table                  |
        | 房貸申請 | tb_MortgageApplication |
      And entity-validate 準備一個 房貸申請:
        | id | applicant | requestedAmount | approvedAmount |
        | 1  | 陳大華    | 5000000.0000    | 5000000.0000   |
        | 2  | 林美玲    | 3000000.0000    | 2500000.0000   |
        | 3  | 張志明    | 8000000.0000    | 7000000.0000   |
      When entity-validate 驗證 房貸申請 資料:
        | id | applicant | requestedAmount | approvedAmount |
        | 1  | 陳大華    | 5000000.00      | 5000000.00     |
        | 2  | 林美玲    | 3000000.00      | 2500000.00     |
        | 3  | 張志明    | 8000000.00      | 7000000.00     |
      Then entity-validate 通過

    @h2 @postgresql @mysql @mssql
    Scenario: 信用貸款放款 - 整數預期對比 DB 4 位小數
      Given entity-validate primary 建立資料表 tb_PersonalLoan:
        | column      | type          | pk | notnull | default | auto | fk |
        | id          | BIGINT        | Y  |         |         |      |    |
        | loan_amount | DECIMAL(18,4) |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table           |
        | 信用貸款 | tb_PersonalLoan |
      And entity-validate 準備一個 信用貸款:
        | id | loanAmount     |
        | 1  | 500000.0000    |
      When entity-validate 驗證 信用貸款 資料:
        | id | loanAmount |
        | 1  | 500000     |
      Then entity-validate 通過

  Rule: DECIMAL scale 不一致 - 外匯交易

    @h2 @postgresql @mysql @mssql
    Scenario: 外匯換匯 - 匯率高精度對比低精度預期
      Given entity-validate primary 建立資料表 tb_ForexTransaction:
        | column        | type          | pk | notnull | default | auto | fk |
        | id            | BIGINT        | Y  |         |         |      |    |
        | currency_pair | VARCHAR       |    | Y       |         |      |    |
        | exchange_rate | DECIMAL(12,6) |    |         |         |      |    |
        | amount        | DECIMAL(18,4) |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table                |
        | 外匯交易 | tb_ForexTransaction  |
      And entity-validate 準備一個 外匯交易:
        | id | currencyPair | exchangeRate | amount        |
        | 1  | USD/TWD      | 31.500000    | 1000000.0000  |
      When entity-validate 驗證 外匯交易 資料:
        | id | currencyPair | exchangeRate | amount     |
        | 1  | USD/TWD      | 31.50        | 1000000.00 |
      Then entity-validate 通過

  Rule: DECIMAL scale 不一致 - 基金申購與贖回

    @h2 @postgresql @mysql @mssql
    Scenario: 基金申購 - 淨值 4 位小數對比預期 2 位小數
      Given entity-validate primary 建立資料表 tb_FundOrder:
        | column    | type          | pk | notnull | default | auto | fk |
        | id        | BIGINT        | Y  |         |         |      |    |
        | fund_name | VARCHAR       |    | Y       |         |      |    |
        | nav       | DECIMAL(10,4) |    |         |         |      |    |
        | units     | DECIMAL(18,4) |    |         |         |      |    |
        | amount    | DECIMAL(18,4) |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table        |
        | 基金申購 | tb_FundOrder |
      And entity-validate 準備一個 基金申購:
        | id | fundName       | nav      | units       | amount       |
        | 1  | 全球股票型基金 | 25.3400  | 3944.7500   | 100000.0000  |
      When entity-validate 驗證 基金申購 資料:
        | id | fundName       | nav   | units   | amount    |
        | 1  | 全球股票型基金 | 25.34 | 3944.75 | 100000.00 |
      Then entity-validate 通過

  Rule: DECIMAL scale 不一致 - 保險費與理賠

    @h2 @postgresql @mysql @mssql
    Scenario: 保險理賠 - 負數調整金額 scale 不一致
      Given entity-validate primary 建立資料表 tb_InsuranceClaim:
        | column           | type          | pk | notnull | default | auto | fk |
        | id               | BIGINT        | Y  |         |         |      |    |
        | claim_amount     | DECIMAL(18,4) |    |         |         |      |    |
        | deductible       | DECIMAL(18,4) |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table              |
        | 保險理賠 | tb_InsuranceClaim  |
      And entity-validate 準備一個 保險理賠:
        | id | claimAmount   | deductible    |
        | 1  | 250000.0000   | -5000.0000    |
      When entity-validate 驗證 保險理賠 資料:
        | id | claimAmount | deductible |
        | 1  | 250000.00   | -5000.00   |
      Then entity-validate 通過

    @h2 @postgresql @mysql @mssql
    Scenario: 保費計算 - 零值與不同小數表示
      Given entity-validate primary 建立資料表 tb_InsurancePremium:
        | column    | type          | pk | notnull | default | auto | fk |
        | id        | BIGINT        | Y  |         |         |      |    |
        | premium   | DECIMAL(18,4) |    |         |         |      |    |
        | discount  | DECIMAL(18,4) |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table                |
        | 保費紀錄 | tb_InsurancePremium  |
      And entity-validate 準備一個 保費紀錄:
        | id | premium      | discount |
        | 1  | 36000.0000   | 0.0000   |
      When entity-validate 驗證 保費紀錄 資料:
        | id | premium  | discount |
        | 1  | 36000.00 | 0.00     |
      Then entity-validate 通過

  Rule: DECIMAL scale 不一致 - 整數類型與 String 比對

    @h2 @postgresql @mysql @mssql
    Scenario: 交易筆數統計 - INT 對比帶小數的預期值
      Given entity-validate primary 建立資料表 tb_TxnSummary:
        | column    | type   | pk | notnull | default | auto | fk |
        | id        | BIGINT | Y  |         |         |      |    |
        | txn_count | INT    |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table          |
        | 交易統計 | tb_TxnSummary  |
      And entity-validate 準備一個 交易統計:
        | id | txnCount |
        | 1  | 100      |
      When entity-validate 驗證 交易統計 資料:
        | id | txnCount |
        | 1  | 100.00   |
      Then entity-validate 通過

    @h2 @postgresql @mysql @mssql
    Scenario: 帳務流水號 - BIGINT 對比帶小數的預期值
      Given entity-validate primary 建立資料表 tb_LedgerEntry:
        | column   | type   | pk | notnull | default | auto | fk |
        | id       | BIGINT | Y  |         |         |      |    |
        | seq_no   | BIGINT |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table          |
        | 帳務分錄 | tb_LedgerEntry |
      And entity-validate 準備一個 帳務分錄:
        | id | seqNo   |
        | 1  | 9999999 |
      When entity-validate 驗證 帳務分錄 資料:
        | id | seqNo      |
        | 1  | 9999999.00 |
      Then entity-validate 通過

  Rule: DECIMAL scale 不一致 - 不含 PK 查詢

    @h2 @postgresql @mysql @mssql
    Scenario: 轉帳紀錄 - 不含 PK 全表掃描 scale 不一致
      Given entity-validate primary 建立資料表 tb_Transfer:
        | column       | type          | pk | notnull | default | auto | fk |
        | id           | BIGINT        | Y  |         |         | Y    |    |
        | reference_no | VARCHAR       |    | Y       |         |      |    |
        | amount       | DECIMAL(18,4) |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table       |
        | 轉帳紀錄 | tb_Transfer |
      And entity-validate 準備一個 轉帳紀錄:
        | referenceNo | amount       |
        | TRF-001     | 50000.0000   |
        | TRF-002     | 75000.0000   |
      When entity-validate 驗證 轉帳紀錄 資料:
        | referenceNo | amount   |
        | TRF-001     | 50000.00 |
        | TRF-002     | 75000.00 |
      Then entity-validate 通過

  Rule: DECIMAL scale 不一致 - 搭配 CAS 符號系統

    @h2 @postgresql @mysql @mssql
    Scenario: 風險評估 - 混合精確值與 CAS 範圍比較
      Given entity-validate primary 建立資料表 tb_RiskAssessment:
        | column        | type          | pk | notnull | default | auto | fk |
        | id            | BIGINT        | Y  |         |         |      |    |
        | exposure      | DECIMAL(18,4) |    |         |         |      |    |
        | risk_reserve  | DECIMAL(18,4) |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table              |
        | 風險評估 | tb_RiskAssessment  |
      And entity-validate 準備一個 風險評估:
        | id | exposure       | riskReserve    |
        | 1  | 500000.0000    | 50000.0000     |
        | 2  | 1000000.0000   | 120000.0000    |
      When entity-validate 驗證 風險評估 資料:
        | id | exposure    | riskReserve              |
        | 1  | 500000.00   | &ge(40000)               |
        | 2  | 1000000.00  | &between(100000, 150000) |
      Then entity-validate 通過

  Rule: DECIMAL scale 不一致 - 搭配 VAR 符號系統

    @h2 @postgresql @mysql @mssql
    Scenario: 信託開戶 - 使用變數引用的 DECIMAL 比對
      Given entity-validate primary 建立資料表 tb_TrustAccount:
        | column        | type          | pk | notnull | default | auto | fk |
        | id            | BIGINT        | Y  |         |         | Y    |    |
        | beneficiary   | VARCHAR       |    | Y       |         |      |    |
        | trust_amount  | DECIMAL(18,4) |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table           |
        | 信託帳戶 | tb_TrustAccount |
      And entity-validate 準備一個 信託帳戶:
        | >trustId | beneficiary | trustAmount  |
        | <id      | 李小龍      | 2000000.0000 |
      When entity-validate 驗證 信託帳戶 資料:
        | id       | beneficiary | trustAmount |
        | $trustId | 李小龍      | 2000000.00  |
      Then entity-validate 通過

  Rule: DECIMAL scale 不一致 - 反向驗證 scale > DB scale

    @h2 @postgresql @mysql @mssql
    Scenario: 手續費 - 預期 4 位小數但 DB 僅 2 位小數
      Given entity-validate primary 建立資料表 tb_ServiceFee:
        | column | type          | pk | notnull | default | auto | fk |
        | id     | BIGINT        | Y  |         |         |      |    |
        | fee    | DECIMAL(10,2) |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity | table          |
        | 手續費 | tb_ServiceFee  |
      And entity-validate 準備一個 手續費:
        | id | fee    |
        | 1  | 150.00 |
      When entity-validate 驗證 手續費 資料:
        | id | fee       |
        | 1  | 150.0000  |
      Then entity-validate 通過

  Rule: DECIMAL scale 不一致 - 驗證失敗案例

    @h2 @postgresql @mysql @mssql
    Scenario: 放款金額確實不同 - 應正確拋出例外
      Given entity-validate primary 建立資料表 tb_Disbursement:
        | column | type          | pk | notnull | default | auto | fk |
        | id     | BIGINT        | Y  |         |         |      |    |
        | amount | DECIMAL(18,4) |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table            |
        | 放款紀錄 | tb_Disbursement  |
      And entity-validate 準備一個 放款紀錄:
        | id | amount       |
        | 1  | 1000000.0000 |
      When entity-validate 驗證 放款紀錄 資料:
        | id | amount    |
        | 1  | 999999.99 |
      Then entity-validate 應拋出例外:
        | message |
        | expect: |

    @h2 @postgresql @mysql @mssql
    Scenario: 帳號代碼字串比對 - 非數值字串不應誤判為數值比較
      Given entity-validate primary 建立資料表 tb_AccountCode:
        | column       | type    | pk | notnull | default | auto | fk |
        | id           | BIGINT  | Y  |         |         |      |    |
        | account_code | VARCHAR |    |         |         |      |    |
      And entity-validate primary entity_to_table_mapping:
        | entity   | table          |
        | 帳號代碼 | tb_AccountCode |
      And entity-validate 準備一個 帳號代碼:
        | id | accountCode |
        | 1  | ACC-001     |
      When entity-validate 驗證 帳號代碼 資料:
        | id | accountCode |
        | 1  | ACC-002     |
      Then entity-validate 應拋出例外:
        | message |
        | expect: |
