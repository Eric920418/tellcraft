# ISA「參數型前置條件」與 Linter「必填參數一致性」的矛盾，透過 @allow-missing-parameters 來通過 linter

- **狀態**：Accepted
- **日期**：2026-01-05
- **決策者**：Johnny Pan
- **範圍/模組**：SDD.OS / ISA Linter / API Call 契約一致性檢查
- **關聯組件**：
  - ISA Feature Files（`.isa.feature`）
  - ISA Linter（`api_call_linter.py` / `api_request_params_linter.py`）
  - OpenAPI Specification（API 契約定義）

---

## 背景與問題（Context）

ISA 可執行規格（`.isa.feature`）的測試敘事包含：

- **前置條件（Preconditions）**
  - **參數型前置條件**：刻意提供「錯誤/缺漏」的入參，期望 API 回傳失敗（例如 400 / 操作失敗）
  - **狀態型前置條件**：透過資料庫狀態/系統狀態刻意不滿足前置條件，期望 API 回傳失敗
- **後置條件（Postconditions）**：成功時的資料落地/回傳驗證

而 ISA Linter 的核心價值之一，是檢查 ISA feature 的 API Call 與 OpenAPI Spec 的**契約一致性**：

- 若某參數在 OpenAPI 中是 **mandatory（必填）**，且該 API Call 的 DataTable **缺少**此參數，linter 會報錯（這是合理且重要的檢查）

矛盾發生在「參數型前置條件」：我們會**刻意缺少必填參數**（例如 `startDate` / `endDate`）來驗證「不提供必填參數時應失敗」；但 linter 會直接判定 feature 不一致而失敗，導致這類例子在 ISA 中「無法被允許存在」。

---

## 問題陳述（Problem）

我們需要一個設計，讓 ISA 同時滿足：

- **契約一致性檢查要嚴格**：避免可執行規格與 API Spec 脫鉤（linter 的本質任務）
- **允許參數型前置條件的負向測試**：刻意缺漏/錯誤參數本來就是行為規格的一部分

否則會陷入兩難：

- 若維持嚴格一致性：ISA 無法表達「缺少必填參數會失敗」這種常見驗證
- 若放寬一致性：linter 會失去抓出真正規格錯誤/漏參數的能力

---

## 需求/約束（Forces）

- **F1：Linter 的訊噪比（Signal/Noise）要高**  
  一旦為了負向測試而全面放寬必填檢查，會讓「真正漏帶參數」也被默許。

- **F2：ISA 必須能描述負向案例（尤其是參數型前置條件）**  
  缺參數/錯參數是行為規格要涵蓋的核心場景，不應被迫移除。

- **F3：SSOT 清楚**  
  OpenAPI 是 HTTP 契約的 SSOT；ISA 是行為與規則的 SSOT。兩者需要可協作而非互斥。

- **F4：規則必須可被清楚理解與操作**  
  使用者需要知道：什麼情況下 linter 會報錯、如何在「合理負向測試」中表達意圖。

- **F5：工具要保持通用，不應耦合特定專案**  
  設計應以「一般 API / 一般參數」情境為主，不依賴特定命名或資料表。

---

## 目前觀察（Observations）

- **典型衝突場景**：某個 GET API 定義了必填的 query 參數（例如時間區間 `startDate`、`endDate`），ISA feature 中會撰寫「刻意不提供這些必填參數」的負向測試情境，期望 API 回傳 400 錯誤；但 linter 會因「DataTable 缺少必填參數」而報錯，阻止這類規格通過檢查。
- **前綴規則加劇問題**：由於 query/path 參數必須遵守前綴規則（`Q:`、`P:`），即使 API 沒有 requestBody 也無例外，這讓「缺參數情境」更容易被 linter 的必填檢查攔截。
- **當前無解法**：使用者只能選擇：(1) 移除負向測試（損失規格完整性），或 (2) 忽略 linter 錯誤（損失契約一致性保證）。


---

## 決策（Decision）

**採用方案 O1**：在 ISA 中引入「參數型前置條件」的明確標記，使用 Gherkin Tag `@allow-missing-parameters`。

### 設計原則

1. **標籤語意明確**：使用 `@allow-missing-parameters` 明確表達「此情境允許缺少必填參數」，這是參數契約負向測試的核心場景。標籤名稱直接說明了 linter 的行為：在此標記下，必填參數檢查會被放寬。

2. **Linter 規則可選擇性適用**：每個 linter 規則可以配置是否要跳過 `@allow-missing-parameters` 標記的情境。

3. **預設行為保守**：未標記的情境視為「正常路徑」，所有 linter 規則全部適用。

### 語法設計

#### Gherkin Tag 使用方式

```gherkin
Feature: 查詢 API 參數驗證

  Rule: 必填參數驗證規則

    # 正常路徑（後置條件）- 所有 linter 規則都適用
    Example: 提供完整參數應該成功
      When 查詢資料, call table:
        | Q:startDate | Q:endDate  | Q:pageNo | Q:pageSize |
        | 2024-01-01  | 2024-01-31 | 1        | 10         |
      Then 操作應該成功
      And 回傳資料筆數應該 <= 10

    # 參數型前置條件 - 必填參數檢查會被跳過
    @allow-missing-parameters
    Example: 缺少必填參數 startDate 應該失敗
      When 查詢資料, call table:
        | Q:endDate  | Q:pageNo | Q:pageSize |
        | 2024-01-31 | 1        | 10         |
      Then 操作應該失敗，錯誤碼為 "MISSING_REQUIRED_PARAMETER"
      And 錯誤訊息應該包含 "startDate"

    # 參數型前置條件 - 型別/格式錯誤（也可能導致參數被視為缺失）
    @allow-missing-parameters
    Example: startDate 格式錯誤應該失敗
      When 查詢資料, call table:
        | Q:startDate | Q:endDate  | Q:pageNo | Q:pageSize |
        | invalid-date| 2024-01-31 | 1        | 10         |
      Then 操作應該失敗，錯誤碼為 "INVALID_DATE_FORMAT"

    # 狀態型前置條件 - 所有 linter 規則都適用（不加標籤）
    Example: 查詢區間超過 6 個月應該失敗
      When 查詢資料, call table:
        | Q:startDate | Q:endDate  | Q:pageNo | Q:pageSize |
        | 2024-01-01  | 2024-08-01 | 1        | 10         |
      Then 操作應該失敗，錯誤碼為 "DATE_RANGE_TOO_LARGE"
```

#### Linter 配置方式（isa_codegen.yml）

```yaml
instructions:
  - name: API call
    format: "^\\((?:No Actor|UID=\"\\$?(?P<userId>[\\w.]+)\")\\) (?P<summary>.+?), call table:$"
    linters:
      # 必填參數檢查 - 跳過 @allow-missing-parameters
      - python_plugin_path: .../api_call_linter.py
        config:
          spec_dir: spec/api
          # 新增配置：排除特定標籤
          exclude_tags:
            - allow-missing-parameters
      
      # 參數前綴檢查 - 所有情境都適用（包括 @allow-missing-parameters）
      - python_plugin_path: .../api_request_params_linter.py
        config:
          api_specs_path: spec/api/api-spec.yml
          # 不配置 exclude_tags，表示所有情境都要檢查
      
      # 回應欄位檢查 - 所有情境都適用
      - python_plugin_path: .../api_response_fields_linter.py
        config:
          spec_dir: spec/api
```

### Linter 行為矩陣

| Linter 規則                  | 正常情境 | @allow-missing-parameters | 說明                                      |
|------------------------------|----------|---------------------------|-------------------------------------------|
| **必填參數檢查**             | ✅       | ⏭️ 跳過                   | 允許缺漏必填參數以測試 API 錯誤處理      |
| **參數前綴規則**             | ✅       | ✅                        | 即使是錯誤參數，語法規範仍須遵守          |
| **參數名稱存在性檢查**       | ✅       | ✅                        | 確保參數名稱在 API Spec 中有定義          |
| **API Summary 存在性檢查**   | ✅       | ✅                        | API 本身必須存在                          |
| **回應欄位驗證**             | ✅       | ✅                        | Then 步驟的驗證不受影響                   |
| **資料庫欄位驗證**           | ✅       | ✅                        | DDL 一致性檢查不受影響                    |

### `@allow-missing-parameters` 的適用範圍

`@allow-missing-parameters` 標記應該用於：

1. ✅ **缺少必填參數**：刻意不提供 API 定義的 required 參數
2. ✅ **參數型別錯誤**：提供的值不符合 schema 定義（例如字串傳給數字欄位），在某些實作中會被視為「參數無效等同缺失」
3. ✅ **參數格式錯誤**：提供的值不符合 format 定義（例如 `date` 格式錯誤），在某些實作中會被視為「參數無效等同缺失」
4. ✅ **參數值超出範圍**：提供的值超出 `minimum`/`maximum`/`minLength`/`maxLength` 等限制（如果後端驗證邏輯會將其視為「無效等同缺失」）
5. ✅ **參數枚舉值錯誤**：提供的值不在 `enum` 定義中（如果後端驗證邏輯會將其視為「無效等同缺失」）

> **核心判斷原則**：如果測試的目標是「驗證 API 會拒絕缺少/無效的必填參數」，就使用此標籤。

`@allow-missing-parameters` **不應該**用於：

1. ❌ **業務規則驗證失敗**：例如「查詢區間超過 6 個月」（這是業務邏輯，參數本身是完整且正確的）
2. ❌ **權限/認證失敗**：例如「無權查詢其他用戶資料」（這是授權問題，參數本身是完整且正確的）
3. ❌ **資料狀態不符**：例如「客戶已有授信不可重複申請」（這是狀態型前置條件，參數本身是完整且正確的）
4. ❌ **資料不存在**：例如「查詢不存在的客戶 ID」（這是資料完整性問題，參數本身是完整且正確的）

簡單判斷原則：**如果提供的參數完全符合 OpenAPI Schema 定義（所有 required 參數都有、型別正確、格式正確），但 API 仍然會拒絕，就不該用 `@allow-missing-parameters`**。

---

## 實施步驟（Implementation Plan）

### Phase 1：Linter 引擎支援 Tag 過濾（SDD.OS 核心）

1. **修改 Feature Parser**（`sdd.os/src/sdd_os/isa_linters/parsers/feature_parser.py`）
   - 解析 Scenario/Example 的 tags
   - 將 tags 資訊傳遞給 step context

2. **修改 Linter Executor**（`sdd.os/src/sdd_os/isa_linters/core/linter_executor.py`）
   - 在執行 plugin 前檢查 `exclude_tags` 配置
   - 如果 scenario tags 包含任一 exclude_tag，跳過該 plugin

3. **BDD 測試**（`sdd.os/tests/isa_linters/features/core/tag_filtering.feature`）
   ```gherkin
   Feature: Linter Tag Filtering
   
     Rule: exclude_tags 配置應該生效
       
       Example: Linter 配置 exclude_tags: [allow-missing-parameters] 應該跳過對應情境
         Given 有一個 linter 配置：
           """yaml
           linters:
             - python_plugin_path: .../required_params_checker.py
               config:
                 exclude_tags: [allow-missing-parameters]
           """
         And 有一個 feature 包含 @allow-missing-parameters 且缺少必填參數
         When 執行 ISA Linter
         Then 不應該報「缺少必填參數」錯誤
       
       Example: 未配置 exclude_tags 的 linter 應該檢查所有情境
         Given 有一個 linter 未配置 exclude_tags
         And 有一個 feature 包含 @allow-missing-parameters 且使用錯誤前綴
         When 執行 ISA Linter
         Then 應該報「參數前綴錯誤」
   ```

### Phase 2：更新現有 Linter Plugin

1. **`api_call_linter.py`**：預設 `exclude_tags: [allow-missing-parameters]` (要做測試驅動開發)
2. **`api_request_params_linter.py`**：不配置 exclude_tags（所有情境都檢查）
3. **`api_response_fields_linter.py`**：不配置 exclude_tags

### Phase 3：文件與規範

1. **撰寫規範文件**（`prompts/isa-撰寫規則/allow-missing-parameters-標籤使用規範.md`）
   - 何時使用 `@allow-missing-parameters`
   - 何時不該使用
   - 範例 scenarios

2. **更新 RULES.md**（`sdd.os/src/sdd_os/isa_linters/plugins/extensions/api_call/RULES.md`）
   - 在 `required_parameters_validation` 規則中說明 `@allow-missing-parameters` 的影響

### Phase 4：專案實踐（客戶專案）

1. **標記現有 feature files**
   - 檢視所有 `.isa.feature`，為參數型前置條件加上 `@allow-missing-parameters`
   
2. **更新配置**
   - 在專案的 `isa_codegen.yml` 中為 `api_call_linter` 加入 `exclude_tags: [allow-missing-parameters]`

3. **驗證 Linter 結果**
   - 重新執行 linter，確認：
     - `@allow-missing-parameters` 情境不再報「缺少必填參數」錯誤
     - 仍然報告「參數前綴錯誤」、「參數名稱不存在」等其他錯誤

---

## 後果（Consequences）

### 正面影響

✅ **問題完全解決**：ISA 可以描述參數型前置條件，同時保持 linter 的契約一致性檢查  
✅ **語意清晰**：`@allow-missing-parameters` 明確表達測試意圖，名稱直接說明了允許的行為  
✅ **規則可配置**：不同 linter 可以選擇是否要跳過該標籤，彈性高  
✅ **向後兼容**：未標記的情境維持原有嚴格檢查，不影響現有規格  
✅ **可擴展**：未來可以引入其他標籤（例如 `@allow-invalid-state`、`@unauthorized` 等）

### 負面影響/風險

⚠️ **學習成本**：使用者需要理解何時該加 `@allow-missing-parameters`，何時不該加  
   → **緩解**：提供清晰的文件與範例

⚠️ **標記遺漏**：使用者可能忘記加標籤，導致 linter 報錯  
   → **緩解**：Linter 錯誤訊息中提示「如果這是刻意的缺少參數測試，請加上 `@allow-missing-parameters`」

⚠️ **標記濫用**：使用者可能為了讓 linter 通過而誤用標籤（把真正漏參數的情境標記為 `@allow-missing-parameters`）  
   → **緩解**：Code Review 時檢查標籤使用是否合理；規範文件中明確說明適用範圍

⚠️ **工具改造成本**：需要修改 SDD.OS 的 linter 引擎和既有 plugins  
   → **緩解**：改動範圍明確，影響可控

---

## 相關決策

- 本 ADR 與「參數前綴規則」互補：即使是 `@allow-missing-parameters` 情境，仍須遵守 `P:`/`Q:` 前綴規則
- 未來如需引入其他類型的負向測試標籤（例如 `@allow-invalid-state`），可參考本 ADR 的設計模式

