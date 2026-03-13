# Executor 全面套用 Test Helper Pattern 來大幅增加 Executor 生成之 Test 的可測試性 （Test Helper Pattern）

將指令生成器所產生的 E2E 測試程式碼中的核心流程萃取至 Test Helper，以大幅提升生成器與生成測試程式碼的可測試性，並顯著降低生成器的開發與維護負擔。

# Context

- 本 ADR 針對 PR #60：在 Java `validator` executor 產生的 Entity validation stepdef 中，新增「無主鍵多屬性查詢驗證」能力，並首次導入 `EntityTableAssertHelper`（test helper pattern），以提升自動化生成測試程式碼的可測試性與維護性。

## Problem

- Executor 產生的 stepdef 測試程式碼內容長、重複、且混雜查詢/型別轉換/驗證細節，導致：
  - 大量 .out 測試 output 檔難以人工審閱，品質問題不易被及早發現（例如 [https://github.com/SDD-TW/sdd.os/tree/5ef56c4731ce6adba575fca129a6baf9ed6a8e87/tests/features/executors/java/backend/validator/codegen/candidates/springjpa_pojo](https://github.com/SDD-TW/sdd.os/tree/5ef56c4731ce6adba575fca129a6baf9ed6a8e87/tests/features/executors/java/backend/validator/codegen/candidates/springjpa_pojo)有 15 組生成結果）。
  - 生成器本身的核心邏輯難以以單元測試「高覆蓋率」驗證正確性；一旦生成邏輯錯誤，會連帶讓以生成測試驅動的應用程式專案產出不穩定，影響穩定釋出。

## Forces

1. 自動化生成的端對端（E2E）測試每個 step 會帶有大量情境參數（例如 Table/欄位/API Endpoint），且不同情境會生成不同測試程式碼，導致生成器的可測試性先天偏低。
2. 測試資料往往由 AI 批次生成；若 output 品質不好：
  - 很難立刻觀察出哪裡錯。
  - 需要花非常多心力才能確認 output 的正確性與一致性。
3. 需要讓「每一種指令的核心驗證邏輯」能被高標準 QA（單元測試）把關，盡量逼近 100% 正確。
4. 必須維持並集中支援既有語法能力（VAR-System `$var`、CAS `&constraint`、TIME-System `@time/@localTime`）與型別差異（例如 `Long` vs `Integer`、時間精度）。

# Solution

## 解法摘要

- 採用 **Test Helper Pattern**：將自動化生成測試的「核心流程」與「情境參數」分離。
  - **Test Helper**：封裝該類型指令的核心邏輯（查詢/驗證/API 呼叫），放置於 `test_library/`，供所有相同類型的 stepdef 共用。
  - **生成的 stepdef**：薄薄一層，主要職責是「組裝 Spec + 呼叫 Helper」。

- 此 pattern 可套用於其他指令類型（API call、File operation、Message queue 等），每個指令都有對應的 Test Helper。

## 解法設計

### Pattern 通用架構

Test Helper Pattern 的核心概念：將自動化生成測試的「核心流程」與「情境參數」分離。

**分離原則**：
1. **Test Helper（核心流程）**：封裝該類型指令的查詢/驗證/API 呼叫邏輯，供所有相同類型的 stepdef 共用。
   - 放置於 `test_library/java`（或其他語言對應位置）
   - 高度可測試（單元測試覆蓋率 >= 95%）
   - 函數簽章穩定、參數通泛
2. **生成的 stepdef**：薄薄一層，主要職責是「呼叫 helper、傳遞完整測試參數」。

**適用指令類型**：
- Entity validation（本 PR 實作）
- Entity setup
- API call/response validation
- File operation
- 任何「核心邏輯可抽離、情境參數可標準化」的指令

**開發流程**：
1. 識別指令類型的核心流程（例如：查詢 entity、呼叫 API、驗證欄位）
2. 實作 Test Helper（封裝核心流程，依 Spec 執行）
3. 撰寫 Test Helper 單元測試（高覆蓋率）
4. 更新 executor：產生「呼叫 Helper、傳遞參數」的大幅簡化版 stepdef

---

### 舉例說明：Entity Validation 的 Test Helper Pattern 實踐

以下以本 PR 實作的 Entity validation 為例，示範如何套用此 pattern。


#### Helper：`EntityTableSpec<T, ID>` 和 `EntityTableAssertHelper` - 核心查詢與驗證流程

描述 entity 與查詢/驗證規則：

```java
// 將生成之測試的主要變動參數封裝至此資料結構中
public record EntityTableSpec<T, ID>(
    String entityName,              // 實體名稱（用於錯誤訊息）
    Class<T> entityClass,           // Entity class
    String pkColumn,                // 主鍵欄位名稱
    Function<Object, ID> idParser,  // 主鍵值解析器（支援 Integer/Long/String）
    Set<String> probeFields,        // 無 PK 時用於 QBE 查詢的欄位（排除時間/enum）
    List<String> exactMatchOrder,   // 多筆結果時依序精準比對的欄位（例如 date）
    Set<String> blankMeansNullFields // 空字串視為 null 的欄位
) {}
```

```java
@Component
public class EntityTableAssertHelper {
    // Test Helper 重複使用 Resolver 來處理符號系統
    private final ISAFeatureArgumentResolver resolver;
    
    public <T, ID> void assertExists(
        DataTable dataTable, 
        JpaRepository<T, ID> repository, 
        EntityTableSpec<T, ID> spec
    ) throws Exception {
        // 核心測試流程（略）
    }
}
```

#### Executor 與 Template 更新

Executor 負責解析 schema 並產生要傳入的 Test Helper 參數，template 改成薄薄一層組裝程式碼。

##### 生成前（PR #60 之前）：大段 inline 程式碼

```java
@Then("應該存在一個Agent_With_Table")
public void validate(DataTable dataTable) throws Exception {
    for (Map<String, String> row : rows) {
        String id = row.get("id");
        
        // 型別轉換
        Object resolvedid = resolver.resolveVariable(id);
        Long idLong = (resolvedid instanceof Number)
            ? ((Number) resolvedid).longValue()
            : Long.parseLong(resolvedid.toString());
        
        // 查詢
        Agent actual = repository.findById(idLong)
            .orElseThrow(() -> new AssertionError(...));
        
        // 逐欄位驗證（每個 entity 重複 50+ 行）
        if (row.containsKey("name")) {
            String expected = row.get("name");
            Object resolved = resolver.resolveVariable(expected);
            assertEquals(resolved, actual.getName());
        }
        if (row.containsKey("email")) { ... }
        if (row.containsKey("hireDate")) { ... }
        // ... 更多欄位
    }
}
```

##### 生成後（PR #60）：宣告式 + helper

```java
@Then("應該存在一個Agent_With_Table")
public void validate(DataTable dataTable) throws Exception {
    EntityTableSpec<Agent, Long> spec = new EntityTableSpec<>(
        "Agent",
        Agent.class,
        "id",
        v -> (v instanceof Number n) ? n.longValue() : Long.parseLong(v.toString()),
        Set.of("name", "email"),           // probeFields（無 PK 查詢用）
        List.of("hireDate"),               // exactMatchOrder
        Set.of("phoneNumber", "address")   // blankMeansNullFields
    );
    
    tableAssert.assertExists(dataTable, repository, spec);
}
```

**差異**：
- 行數從 ~80 行降到 ~15 行
- 核心邏輯移到 helper（可單元測試）
- 生成器只需輸出 spec 參數（由 SQL schema 自動計算）

#### Helper 單元測試策略

`test_library/java` 內的單元測試直接驗證 helper/resolver 的核心行為：

```java
@Test
@DisplayName("應該使用單一 probeField 進行 QBE 查詢")
void shouldQueryByExampleWithSingleProbeField() throws Exception {
    EntityTableSpec<Employee, Long> spec = new EntityTableSpec<>(
        "員工", Employee.class, "id",
        obj -> Long.parseLong(obj.toString()),
        Set.of("email"), List.of(), Set.of()
    );
    
    Employee employee = new Employee(1001L, "王大明", "wang@unique.com", 30, "IT");
    when(mockRepository.findAll(any(Example.class))).thenReturn(List.of(employee));
    
    DataTable dataTable = createDataTable(List.of(
        List.of("email", "name", "age"),
        List.of("wang@unique.com", "王大明", "30")
    ));
    
    helper.assertExists(dataTable, mockRepository, spec);
    
    verify(mockRepository, never()).findById(any());
    Employee probe = captureSingleProbe(mockRepository);
    assertEquals("wang@unique.com", probe.getEmail());
}
```

讓 executor 的信心來源從「大量 output fixtures」轉移到「可測試的 helper」。

# Resulting Context

## Pros

- 生成的 stepdef 測試程式碼大幅精簡：主要差異集中在 `EntityTableSpec` 的參數，fixture 的審閱與維護成本下降。
- 核心邏輯集中在 helper，能用單元測試高覆蓋率把關，顯著提升自動化測試生成的可信度與釋出穩定度。
- 開發流程可改為「先寫/維護 helper 與單元測試」，executor 更接近組裝與模板輸出，降低變更風險。

## Cons

- helper 成為高複雜度核心元件，必須嚴格維持單元測試覆蓋率與 review 品質；否則風險會集中在單一元件。
- helper 的使用函數簽章需要長期穩定；參數設計若缺乏通泛性，容易演變成只為了消除 stepdef 行數而添加的特例。

# 延伸討論

以下議題值得團隊在實踐與推廣此 pattern 時思考：

## 1. 跨語言實作一致性

- **問題**：專案支援多語言（Java/TypeScript/Python/Go），每個語言的 Test Helper 實作是否需要保持一致的設計風格？
- **考量點**：
  - Helper API 命名與參數順序（例如 `assertExists(dataTable, repository, spec)` vs `assert_exists(spec, repository, data_table)`）
  - 型別系統差異（Java 有泛型 `EntityTableSpec<T, ID>`，TypeScript/Python 可能用不同方式表達）
  - 是否需要「跨語言 Test Helper 設計指南」？

## 2. Helper API 版本管理與演進

- **問題**：Helper 簽章變更時，如何處理既有生成測試的相容性？
- **考量點**：
  - 是否需要版本化（`EntityTableAssertHelperV2`）或 deprecation 機制？
  - Breaking change 如何通知使用方（應用程式專案）？
  - 是否允許 executor 同時支援多版本 helper（舊專案用舊版，新專案用新版）？

## 3. 複雜度控制與參數爆炸

- **問題**：隨著支援情境增加，helper 參數是否會持續膨脹？
- **考量點**：
  - 何時該拆分 helper（例如 `EntityTableAssertHelper` 拆成 `PKQueryHelper` + `QBEQueryHelper`）？
  - 如何避免「為了一個特例新增一個參數」的惡性循環？
  - Builder pattern 或 fluent API 是否更適合複雜 helper？