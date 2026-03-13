# SpecFormula Core HTTP 抽象層與跨線程 ScenarioContext

# Context

- 本 ADR 針對 SpecFormula 框架的三項重構：(1) `specformula-core` 的 HTTP 抽象層，解耦 `ApiCall` 對 Spring 的直接依賴；(2) `specformula-spring` 的 HTTP client 自動偵測與多模式支援；(3) RestTemplate 測試模式下 `ScenarioContext` 跨線程存取的設計。

## Problem

- `ApiCall`（API 呼叫指令）直接依賴 Spring 的 `MockMvc`，`ScenarioContext` 內部持有 Spring `MvcResult`，導致 `specformula-core` 無法獨立於 Spring 使用，違反模組分層原則（core 不應依賴 spring）
- `SpecFormulaBridge` 直接持有 `MockMvc` 欄位，僅支援 MockMvc 單一測試模式，無法擴展至 RestTemplate 或其他 HTTP client

## Forces

1. **模組分層**：`specformula-core` 為純邏輯層，不應依賴 Spring Framework；HTTP 執行細節應由上層模組（`specformula-spring`）提供
2. **多測試模式**：需同時支援 MockMvc（in-process，無網路開銷）與 TestRestTemplate（real server，完整 HTTP 語意）兩種測試模式
3. **擴展性**：新增 HTTP client 支援時不應修改核心邏輯，應透過介面擴展

# Solution

## 解法摘要

- 在 `specformula-core` 定義 `HttpClientAdapter` 介面與 `TestRequest` / `TestResponse` DTO，將 HTTP 執行細節從核心邏輯中抽離。`ApiCall`、`ScenarioContext`、`ResponseValidate` 系列皆改為依賴 core 內部型別，不再持有 Spring `MvcResult`。`specformula-spring` 提供 `MockMvcHttpClientAdapter` 與 `TestRestTemplateHttpClientAdapter` 兩種實作，由 `SpecFormulaSpringConfiguration` 自動偵測並注入。

## 解法設計

### 1. HTTP 抽象層（Dependency Inversion）

```
specformula-core                          specformula-spring
┌──────────────────────────┐              ┌──────────────────────────────────┐
│  HttpClientAdapter       │◄─implements──│  MockMvcHttpClientAdapter        │
│  (interface)             │              │  TestRestTemplateHttpClientAdapter│
│                          │              └──────────────────────────────────┘
│  TestRequest  (DTO)      │
│  TestResponse (DTO)      │
│                          │
│  ApiCall                 │
│    └─ uses HttpClientAdapter
└──────────────────────────┘
```

- **`HttpClientAdapter`**：單一方法 `TestResponse execute(TestRequest request)`
- **`TestRequest`**：不可變 DTO，使用 Builder pattern，包含 method、url、headers、queryParams、body
- **`TestResponse`**：不可變 DTO，包含 status、body、headers
- **`ApiCall`**：建構子注入 `HttpClientAdapter`，不再直接依賴任何 Spring 類別

同時將所有原本依賴 Spring `MvcResult` 的元件改為使用 `TestResponse`：

| 元件 | 重構前 | 重構後 |
|------|--------|--------|
| `ScenarioContext` | 持有 `MvcResult`（Spring 型別） | 持有 `TestResponse`（core 型別） |
| `ApiCall` | 直接呼叫 `MockMvc.perform()` | 透過 `HttpClientAdapter.execute()` |
| `ResponseValidate` 系列 | 從 `MvcResult` 取得 status/body | 從 `TestResponse` 取得 status/body |

`specformula-core` 的 `pom.xml` 中，Spring 相關依賴從 `provided` scope 降為 `test` scope，確保 core 模組的 production classpath 不包含任何 Spring 類別。

### 2. Spring Adapter 實作

`SpecFormulaBridge` 從直接持有 `MockMvc` 改為持有 `HttpClientAdapter` 介面，由 `specformula-spring` 提供兩種實作：

| Adapter | 適用場景 | 底層機制 |
|---------|---------|---------|
| `MockMvcHttpClientAdapter` | `webEnvironment = MOCK` / `NONE` | 包裝 Spring `MockMvc`，in-process 執行 |
| `TestRestTemplateHttpClientAdapter` | `webEnvironment = RANDOM_PORT` | 包裝 Spring `TestRestTemplate`，使用 Apache HttpClient |

**RestTemplate 模式的兩個實作考量：**

- **HttpURLConnection 401 retry**：Spring `TestRestTemplate` 預設使用 JDK `HttpURLConnection`，收到 401 時會自動觸發 auth retry，導致 `HttpRetryException` 與 response body 遺失。`TestRestTemplateHttpClientAdapter` 在建構時將 `RequestFactory` 替換為 `HttpComponentsClientHttpRequestFactory`（Apache HttpClient 5）避免此問題。
- **跨線程 ScenarioContext**：RestTemplate 模式下，HTTP 請求由 Tomcat worker thread 處理，無法存取 Cucumber test thread 的 `ThreadLocal<ScenarioContext>`。`SpecFormulaBridge` 新增 `volatile ScenarioContext sharedContext` 作為 fallback：

```
Cucumber test thread              Tomcat worker thread
─────────────────────             ────────────────────
newScenario()
  ├─ ThreadLocal.set(ctx)
  └─ sharedContext = ctx  ── volatile write ──→
        │
apiCall (HTTP request) ──────────────────────→ currentContext()
                                                 ├─ ThreadLocal.get() → null
                                                 └─ sharedContext    ← volatile read
                         ◄────────────────────── response
endScenario()
  ├─ ThreadLocal.remove()
  └─ sharedContext = null
```

Cucumber Scenario 循序執行，寫入與讀取不會並發；`volatile` 提供 happens-before 保證，test thread 對 `ScenarioContext`（含內部 `HashMap`）的所有寫入對 worker thread 可見。`ScenarioContext` 內部的 `HashMap` 不需改為 `ConcurrentHashMap`。

### 3. HTTP Client 自動偵測

`SpecFormulaSpringConfiguration` 在 Spring Context 啟動後自動偵測可用的 HTTP client，依優先順序注入 `SpecFormulaBridge`：

1. **使用者自訂 `HttpClientAdapter` Bean**（最高優先）— 若 Spring Context 中已存在此 Bean，直接使用
2. **MockMvc** — 若偵測到 `MockMvc` Bean（來自 `@AutoConfigureMockMvc`），包裝為 `MockMvcHttpClientAdapter`
3. **TestRestTemplate**（最低優先）— 透過 reflection 載入 `TestRestTemplateHttpClientAdapter`，避免無 `httpclient5` 時的 classpath 錯誤

若皆未偵測到，記錄警告，`ApiCall` 指令將不可用。

### 4. Benchmark Maven Profiles

Benchmark 專案新增 Maven profiles 切換測試模式：

| Profile | Test Runner | webEnvironment | HTTP Client |
|---------|-------------|----------------|-------------|
| `mockmvc`（預設） | `RunCucumberMockMvcTest` | `MOCK` | MockMvc |
| `resttemplate` | `RunCucumberRestTemplateTest` | `RANDOM_PORT` | TestRestTemplate |

透過 `mvn test -Presttemplate` 或 `mvn test -Pmockmvc` 切換。

# Resulting Context

## Pros

- `specformula-core` 完全不依賴 Spring Framework，可獨立使用或搭配其他框架
- `ApiCall` 單一實作同時支援 MockMvc 與 RestTemplate 模式，消除重複邏輯
- 新增 HTTP client 支援只需實作 `HttpClientAdapter`，不影響核心邏輯
- Apache HttpClient 正確處理 401 response，保留完整的 status code 與 response body
- `volatile sharedContext` 以最小開銷解決跨線程存取，不引入鎖或 concurrent 資料結構

## Cons

- RestTemplate 模式依賴 Apache HttpClient 5（`httpclient5`），使用者專案需額外引入此依賴
- `sharedContext` 設計假設 Cucumber Scenario 循序執行（單線程）；若未來 Cucumber 啟用 parallel execution，需重新評估此設計
- MockMvc 與 RestTemplate 的行為仍有細微差異（如 Filter chain 執行路徑），使用者需理解兩種模式的適用場景

# 其他可能解法

### 1. InheritableThreadLocal

使用 `InheritableThreadLocal` 取代 `ThreadLocal` + `volatile sharedContext`。

- **Pros**：子線程自動繼承父線程的值，不需額外 fallback 邏輯
- **Cons**：Tomcat worker thread 並非 Cucumber test thread 的子線程（來自 thread pool），`InheritableThreadLocal` 在此場景無效

### 2. ApiCall 內部分支判斷 HTTP client 類型

在 `ApiCall` 中保留 `if (mockMvc != null) ... else if (restTemplate != null) ...` 的分支邏輯。

- **Pros**：不需額外的介面與 adapter 類別
- **Cons**：`specformula-core` 仍需依賴 Spring；新增 HTTP client 需修改 `ApiCall`，違反 Open-Closed Principle
