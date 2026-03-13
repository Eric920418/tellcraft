# SpecFormula

Cucumber Backend SPI 實作框架，透過 `isa.yml` 定義的 ISA instruction 自動註冊 Cucumber StepDefinition。

## 模組架構

```
specformula
├── specformula-core          # 核心邏輯：spec readers、instructions、helpers
├── specformula-spring        # Spring 橋接：Bridge、auth/time 介面、自動配置
├── specformula-cucumber      # Cucumber Backend SPI 實作
└── specformula-testcontainer # Testcontainers 自動建立 DataSource
```

### specformula-core

純核心邏輯，不依賴 Cucumber Backend SPI。

```
specformula-core
├── spec/
│   ├── SpecReaderConfig.java            # spec 路徑設定
│   ├── isa/   IsaSpecReader + model     # 讀取 isa.yml
│   ├── api/   ApiSpecReader + model     # 讀取 OpenAPI spec
│   └── data/  EntityDdlReader + model   # 讀取 Data DDL
├── instruction/                         # 指令實作（EntitySetup、ApiCall、ResponseSchemaValidator 等）
├── context/                             # ScenarioContext
├── helper/                              # ISAFeatureArgumentResolver、TypeConverter、NamingConverter
├── http/                                # HttpClientAdapter、TestRequest、TestResponse
└── dialect/                             # 資料庫方言（H2、PostgreSQL、MySQL、MSSQL）
```

### specformula-spring

Spring 橋接層，提供 Bridge、認證/時間介面與 Spring 自動配置。

```
specformula-spring
├── SpecFormulaBridge.java             # Instance-based bridge（DataSource、MockMvc、Authenticator）
├── SpecFormulaSpringConfiguration.java # Spring @Configuration 自動配置
├── TrackingDataSource.java            # 包裝 DataSource 追蹤 SQL 操作
├── auth/
│   ├── Authenticator.java             # 認證介面（受測專案實作）
│   └── DefaultAuthenticator.java      # 預設實作（拋出錯誤提示）
├── http/
│   ├── MockMvcHttpClientAdapter.java          # MockMvc HTTP client adapter
│   └── TestRestTemplateHttpClientAdapter.java # TestRestTemplate HTTP client adapter
└── time/
    └── MockTime.java                  # 時間抽象介面（受測專案注入）
```

### specformula-cucumber

Cucumber Backend SPI 實作，橋接 Cucumber 與 core 邏輯。

```
specformula-cucumber
├── backend/
│   ├── SpecFormulaBackend.java                  # Cucumber Backend SPI 實作
│   ├── SpecFormulaBackendProviderService.java   # ServiceLoader entry point
│   ├── SpecFormulaSnippet.java                  # Cucumber Snippet 介面實作
│   ├── SpecFormulaStepDefinition.java           # Cucumber StepDefinition 介面實作
│   └── stepdefinition/
│       ├── AbstractIsaStepDefinition.java       # StepDefinition 基類
│       ├── StepDefinitionFactory.java           # 依 instruction_type 產生對應子類
│       ├── ApiCallStepDefinition.java           # api_call
│       ├── TimeControlStepDefinition.java       # time_control
│       ├── EntitySetupStepDefinition.java       # entity_setup
│       ├── EntityValidateStepDefinition.java    # entity_validate
│       ├── EntityNonExistenceValidateStepDefinition.java  # entity_non_existence_validate
│       ├── DataTableResponseValidateStepDefinition.java   # response_validate (data_table)
│       └── JsonResponseValidateStepDefinition.java        # response_validate (json)
└── listener/
    ├── PerformanceMetrics.java                  # 效能指標資料模型
    └── PerformanceMetricsListener.java          # Cucumber 效能監聽器
```

### specformula-testcontainer

Testcontainers 整合，依 `isa.yml` 的 `db_type` 自動建立對應的 DataSource。

```
specformula-testcontainer
├── SpecFormulaTestcontainerAutoConfiguration.java  # Spring Auto-Configuration
├── TestcontainerDataSourceRegistrar.java           # 動態註冊 DataSource Bean
└── TestcontainerFactory.java                       # 依 db_type 建立 Testcontainer
```

### 模組依賴關係

```
specformula-core
      ↑
specformula-spring    (依賴 core + Spring + auth/time/http 介面)
      ↑
specformula-cucumber  (依賴 spring，傳遞取得 core)

specformula-testcontainer (依賴 core + spring)
```

## 安裝至專案

### 1. 建置並安裝至 local Maven repository

```bash
cd specformula-java
mvn clean install -DskipTests
```

### 2. 在目標專案的 pom.xml 加入依賴

```xml
<!-- SpecFormula（包含 Cucumber SPI + Spring 自動配置 + core） -->
<dependency>
    <groupId>ai.specformula</groupId>
    <artifactId>specformula-cucumber</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <scope>test</scope>
</dependency>

<!-- Testcontainers 自動建立 DataSource（選配） -->
<dependency>
    <groupId>ai.specformula</groupId>
    <artifactId>specformula-testcontainer</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <scope>test</scope>
</dependency>
```

### 3. 在 `src/test/resources/` 建立 `isa.yml`

詳見下方 [isa.yml 配置說明](#isayml-配置說明)。

### 4. 執行測試

```bash
# 執行所有 feature
mvn test

# 執行單一 feature file
mvn test -Dcucumber.features="src/test/resources/features/打卡記錄.isa.feature"
```

## isa.yml 配置說明

`isa.yml` 放置於 `src/test/resources/`（classpath root），是 SpecFormula 的核心配置檔，定義 API/Data spec 路徑與 Cucumber StepDefinition 的 regex pattern。

### 頂層結構

```yaml
config:
  api:
    resource_path: specs/api
    project_path: path/to/api/specs
    time_format: iso            # 選配，預設 iso
  data:
    permission: isolated        # 選配，預設 isolated
    source:
      - name: default
        resource_path: specs/data
        project_path: path/to/data/specs
        db_type: h2             # 選配，預設 h2

instructions:
  - name: ...
    format: ...
    instruction_type: ...
```

### config.api

API spec 路徑與時間格式設定。

| 欄位 | 必填 | 預設值 | 說明 |
|------|------|--------|------|
| `resource_path` | 是 | — | classpath 相對路徑（如 `specs/api`） |
| `project_path` | 是 | — | 專案根目錄相對路徑（如 `src/test/resources/specs/api`） |
| `time_format` | 否 | `iso` | 時間格式，可選值見下表 |

**time_format 可選值：**

| 值 | 說明 |
|----|------|
| `iso` | ISO 8601（如 `2025-12-16T10:30:00`） |
| `timestamp` | Unix timestamp（毫秒） |
| `epoch` | Unix epoch |
| `date_only` | 僅日期（如 `2025-12-16`） |
| `time_only` | 僅時間（如 `10:30:00`） |

### config.data

資料庫 spec 路徑與資料來源設定。

| 欄位 | 必填 | 預設值 | 說明 |
|------|------|--------|------|
| `permission` | 否 | `isolated` | 資料隔離模式：`isolated` 或 `shared` |
| `reuse` | 否 | `false` | Testcontainer 重用模式，詳見 [Testcontainer Reuse 模式](#testcontainer-reuse-模式) |
| `source` | 是 | — | 資料來源陣列（至少一筆） |

**source[] 欄位：**

| 欄位 | 必填 | 預設值 | 說明 |
|------|------|--------|------|
| `name` | 是 | — | 唯一識別名稱（如 `default`、`primary`） |
| `resource_path` | 是 | — | classpath 相對路徑（如 `specs/data`） |
| `project_path` | 是 | — | 專案根目錄相對路徑 |
| `db_type` | 否 | `h2` | 資料庫類型：`h2`、`postgresql`、`mysql`、`mssql` |

**多資料來源範例：**

```yaml
config:
  data:
    source:
      - name: primary
        resource_path: specs/data/primary
        project_path: src/test/resources/specs/data/primary
        db_type: mssql
      - name: secondary
        resource_path: specs/data/secondary
        project_path: src/test/resources/specs/data/secondary
        db_type: postgresql
```

### instructions

定義 Cucumber step 的 regex pattern 與對應的 instruction type。只需列出專案使用到的 instruction，不需要的可省略。

每個 instruction 包含以下欄位：

| 欄位 | 必填 | 說明 |
|------|------|------|
| `name` | 是 | 指令名稱（描述用途） |
| `format` | 是 | Java regex，使用 `(?P<name>...)` 命名群組 |
| `instruction_type` | 是 | 指令類型（見下方說明） |
| `data_format` | 條件 | 僅 `response_validate` 需要，值為 `data_table` 或 `json` |

### instruction_type 詳細說明

#### time_control — 設定模擬時間

`format` 必須包含 `(?P<time>...)` 命名群組。step 後不接 DataTable。

```yaml
- name: Time control
  format: ^現在的時間是 "(?P<time>[^"]+)"$
  instruction_type: time_control
```

#### entity_setup — 準備測試資料

`format` 必須包含 `(?P<entity>...)` 命名群組。step 後接 DataTable 定義欄位與值。

```yaml
- name: Data preparation
  format: ^準備一個(?P<entity>[\u4e00-\u9fffa-zA-Z0-9_]+), with table:$
  instruction_type: entity_setup
```

#### api_call — HTTP API 呼叫

`format` 必須包含 `(?P<summary>...)` 命名群組。可選 `(?P<userId>...)`。step 後接 DataTable 定義請求參數。

```yaml
- name: API call
  format: ^\((?:No Actor|UID="(?P<userId>\$[\w.]+)")\) (?P<summary>.+?), call table:$
  instruction_type: api_call
```

#### response_validate — 回應驗證

`format` 必須包含 `(?P<summary>...)` 和 `(?P<status_code>...)` 命名群組。**必須**指定 `data_format`。

```yaml
# DataTable 格式
- name: Response validation (table)
  format: ^(?P<summary>.+?)\((?P<status_code>\d{3})\)回應,?\s*with table:$
  instruction_type: response_validate
  data_format: data_table

# JSON 格式（step 後接 DocString）
- name: Response validation (JSON)
  format: ^(?P<summary>.+?)\((?P<status_code>\d{3})\)回應為,?\s*with JSON:$
  instruction_type: response_validate
  data_format: json
```

#### entity_validate — 驗證資料庫記錄存在

`format` 必須包含 `(?P<entity>...)` 命名群組。step 後接 DataTable 定義預期值。

```yaml
- name: Database validation
  format: ^應該存在一個(?P<entity>[\u4e00-\u9fffa-zA-Z0-9_]+), with table:$
  instruction_type: entity_validate
```

#### entity_non_existence_validate — 驗證資料庫記錄不存在

`format` 必須包含 `(?P<entity>...)` 命名群組。step 後接 DataTable 定義查詢條件。

```yaml
- name: Database non-existence validation
  format: ^應該不存在一個(?P<entity>[\u4e00-\u9fffa-zA-Z0-9_]+), with table:$
  instruction_type: entity_non_existence_validate
```

### format regex 說明

`format` 使用 Java regex 語法，透過 `(?P<name>pattern)` 定義命名群組（框架會自動轉換為標準 capturing groups）。

**各 instruction_type 必要的命名群組：**

| instruction_type | 必要群組 | 選配群組 |
|-----------------|----------|----------|
| `time_control` | `time` | — |
| `entity_setup` | `entity` | — |
| `api_call` | `summary` | `userId` |
| `response_validate` | `summary`、`status_code` | — |
| `entity_validate` | `entity` | — |
| `entity_non_existence_validate` | `entity` | — |

**常用 regex pattern：**

```regex
# 時間（引號包裹的字串）
"(?P<time>[^"]+)"

# 實體名稱（中文、英文、數字、底線）
(?P<entity>[\u4e00-\u9fffa-zA-Z0-9_]+)

# API summary（非貪婪匹配）
(?P<summary>.+?)

# HTTP status code（3 位數字）
(?P<status_code>\d{3})

# 使用者 ID（$ 開頭的變數參考）
(?P<userId>\$[\w.]+)
```

### 完整範例

```yaml
config:
  api:
    resource_path: specs/api
    project_path: src/test/resources/specs/api
  data:
    source:
      - name: default
        resource_path: specs/data
        project_path: src/test/resources/specs/data

instructions:
  - name: Time control
    format: ^現在的時間是 "(?P<time>[^"]+)"$
    instruction_type: time_control

  - name: Data preparation
    format: ^準備一個(?P<entity>[\u4e00-\u9fffa-zA-Z0-9_]+), with table:$
    instruction_type: entity_setup

  - name: API call
    format: ^\((?:No Actor|UID="(?P<userId>\$[\w.]+)")\) (?P<summary>.+?), call table:$
    instruction_type: api_call

  - name: Response validation (table)
    format: ^(?P<summary>.+?)\((?P<status_code>\d{3})\)回應,?\s*with table:$
    instruction_type: response_validate
    data_format: data_table

  - name: Response validation (JSON)
    format: ^(?P<summary>.+?)\((?P<status_code>\d{3})\)回應為,?\s*with JSON:$
    instruction_type: response_validate
    data_format: json

  - name: Database validation
    format: ^應該存在一個(?P<entity>[\u4e00-\u9fffa-zA-Z0-9_]+), with table:$
    instruction_type: entity_validate

  - name: Database non-existence validation
    format: ^應該不存在一個(?P<entity>[\u4e00-\u9fffa-zA-Z0-9_]+), with table:$
    instruction_type: entity_non_existence_validate
```

## Testcontainer Reuse 模式

在 `isa.yml` 中設定 `reuse: true`，可讓 Testcontainer 在測試結束後保留容器，下次測試直接重用，大幅縮短啟動時間。

### 啟用方式

```yaml
config:
  data:
    reuse: true
    source:
      - name: default
        resource_path: specs/data-mssql
        project_path: src/test/resources/specs/data-mssql
        db_type: mssql
```

### 前置條件

需要在 `~/.testcontainers.properties` 中啟用 reuse 支援：

```properties
testcontainers.reuse.enable=true
```

> 如果此檔案不存在或未包含此設定，Testcontainers 會忽略 `withReuse(true)` 的請求，每次仍建立新容器。

### 運作方式

| 設定 | 行為 |
|------|------|
| `reuse: false`（預設） | 每次測試建立新容器，測試結束後自動銷毀 |
| `reuse: true` | 首次測試建立容器並保留，後續測試直接連線至既有容器 |

啟用 reuse 後：
- **首次執行**：建立容器、執行 schema.sql、執行測試（較慢）
- **後續執行**：直接連線至既有容器、清理資料、執行測試（較快）
- 容器會持續運行直到手動停止（`docker stop`）或 Docker 重啟

### 管理 reuse 容器

```bash
# 查看運行中的 testcontainer
docker ps --filter "label=org.testcontainers=true"

# 停止所有 testcontainer
docker ps --filter "label=org.testcontainers=true" -q | xargs docker stop

# 停止並刪除所有 testcontainer
docker ps -a --filter "label=org.testcontainers=true" -q | xargs docker rm -f
```

## 測試執行指南

所有測試指令皆從 `specformula-java` 根目錄執行。

### 依資料庫類型執行測試（specformula-core）

specformula-core 支援多種資料庫，透過 Maven Profile 切換：

| Profile | 資料庫 | 說明 |
|---------|--------|------|
| `h2` | H2 | **預設**，in-memory 資料庫，啟動快速 |
| `postgresql` | PostgreSQL | Testcontainer，需要 Docker |
| `mysql` | MySQL | Testcontainer，需要 Docker |
| `mssql` | MS SQL Server | Testcontainer，需要 Docker |

```bash
# 使用 H2（預設）
mvn test -pl specformula-core

# 使用 PostgreSQL
mvn test -pl specformula-core -Ppostgresql

# 使用 MySQL
mvn test -pl specformula-core -Pmysql

# 使用 MS SQL Server
mvn test -pl specformula-core -Pmssql
```

### 依測試速度篩選（specformula-testcontainer）

specformula-testcontainer 支援依 Cucumber 標籤篩選測試：

| Profile | 篩選條件 | 說明 |
|---------|----------|------|
| （預設） | `not @slow` | 排除慢速測試，快速驗證 |
| `all-tests` | 無篩選 | 執行所有測試 |
| `slow` | `@slow` | 只執行慢速測試 |

```bash
# 快速測試（排除 @slow）
mvn test -pl specformula-testcontainer

# 執行所有測試
mvn test -pl specformula-testcontainer -Pall-tests

# 只執行慢速測試
mvn test -pl specformula-testcontainer -Pslow
```

### 自訂 Cucumber 標籤篩選

可透過系統屬性直接指定 Cucumber 標籤表達式：

```bash
# 只執行 @smoke 標籤
mvn test -pl specformula-core -Dcucumber.filter.tags="@smoke"

# 執行 @smoke 但排除 @slow
mvn test -pl specformula-core -Dcucumber.filter.tags="@smoke and not @slow"

# 執行 @api 或 @entity 標籤
mvn test -pl specformula-core -Dcucumber.filter.tags="@api or @entity"
```

### 組合使用

可同時指定資料庫 Profile 與測試篩選：

```bash
# 使用 PostgreSQL 執行所有測試
mvn test -pl specformula-core -Ppostgresql -Dcucumber.filter.tags=""

# 使用 MySQL 只執行 @entity 相關測試
mvn test -pl specformula-core -Pmysql -Dcucumber.filter.tags="@entity"
```

### 執行所有模組

```bash
# 建置所有模組（跳過測試）
mvn clean install -DskipTests

# 執行所有模組的測試
mvn test

# 使用 PostgreSQL 執行所有模組的測試
mvn test -Ppostgresql
```

## 支援的 instruction_type

| instruction_type | StepDefinition | 說明 |
|-----------------|----------------|------|
| `api_call` | ApiCallStepDefinition | HTTP API 呼叫 |
| `time_control` | TimeControlStepDefinition | 設定模擬時間 |
| `entity_setup` | EntitySetupStepDefinition | 準備測試資料 |
| `entity_validate` | EntityValidateStepDefinition | 驗證資料庫記錄存在 |
| `entity_non_existence_validate` | EntityNonExistenceValidateStepDefinition | 驗證資料庫記錄不存在 |
| `response_validate` (data_table) | DataTableResponseValidateStepDefinition | DataTable 格式回應驗證 |
| `response_validate` (json) | JsonResponseValidateStepDefinition | JSON 格式回應驗證 |
| `custom` | —（使用者自行實作） | 自定義指令 |

## 自定義 StepDefinition

當內建的 instruction_type 無法滿足需求時，可使用 `custom` instruction_type 搭配自行撰寫的 Cucumber StepDefinition 實現業務邏輯。

### 1. 在 isa.yml 定義 custom 指令

```yaml
instructions:
  # 不帶參數的 custom 指令
  - name: 清除快取
    format: ^清除所有快取$
    instruction_type: custom

  # 帶 DataTable 的 custom 指令
  - name: 批次匯入
    format: ^批次匯入(?P<type>[\u4e00-\u9fffa-zA-Z0-9_]+), with table:$
    instruction_type: custom
    data_format: data_table

  # 帶 JSON DocString 的 custom 指令
  - name: 發送事件
    format: ^發送(?P<event>.+?)事件, with JSON:$
    instruction_type: custom
    data_format: json
```

`custom` 指令的驗證規則：
- `format`：無特殊命名群組要求（不需要 `(?P<entity>...)` 或 `(?P<summary>...)`）
- `data_format`：可選；若指定則必須為 `data_table` 或 `json`

> **注意**：`custom` 指令在 `isa.yml` 中定義後，SpecFormula 不會自動產生 StepDefinition。使用者必須自行撰寫對應的 Cucumber StepDefinition，否則 Cucumber 執行時會報 `UndefinedStepException`。

### 2. 撰寫 Cucumber StepDefinition

透過 Spring `@Autowired` 注入 `FeatureArgumentResolver`，即可使用框架的 VAR-System、CAS、TIME-System 能力。

```java
import ai.specformula.core.helper.FeatureArgumentResolver;
import io.cucumber.datatable.DataTable;
import io.cucumber.java.zh_tw.Given;
import io.cucumber.java.zh_tw.When;
import io.cucumber.java.zh_tw.Then;
import org.springframework.beans.factory.annotation.Autowired;

public class CustomStepDefinitions {

    @Autowired
    private FeatureArgumentResolver resolver;

    @Given("清除所有快取")
    public void clearAllCache() {
        // 自定義邏輯
    }

    @When("批次匯入{string}, with table:")
    public void batchImport(String type, DataTable dataTable) {
        for (List<String> row : dataTable.asLists()) {
            // 使用 resolver 解析變數引用（如 $variableName、@time("now")）
            Object resolved = resolver.resolveVariable(row.get(0));
            // 自定義邏輯...
        }
    }

    @Then("發送{string}事件, with JSON:")
    public void sendEvent(String event, String jsonBody) {
        // 使用 resolver 解析 JSON 中的變數
        // 自定義邏輯...
    }
}
```

### 3. FeatureArgumentResolver API

`FeatureArgumentResolver` 介面提供以下能力：

| 方法 | 所屬系統 | 說明 |
|------|---------|------|
| `resolveVariable(value)` | VAR + TIME | 解析 `$var`、`${var}` 變數引用與 `@time()`、`@date()`、`@localtime()` 時間表達式 |
| `resolveAndValidate(expected, actual, field, entity)` | VAR + CAS | 解析期望值並驗證，支援 `&constraint()` 約束斷言 |
| `valuesEqual(expected, actual)` | VAR + TIME | 型別感知的值比對（自動處理 JDBC 型別、BigDecimal、時間精度） |
| `parseContextKeys(headers)` | VAR | 解析 DataTable header 中 `>contextKey` 欄位，建立變數儲存對應表 |
| `extractAndStoreVariables(row, keyMap, result)` | VAR | 從執行結果提取值並存入 ScenarioContext |

**常用情境範例：**

```java
// 解析變數引用
Object value = resolver.resolveVariable("$userId");        // → ScenarioContext 中的 userId
Object time  = resolver.resolveVariable("@time(\"now\")"); // → ZonedDateTime

// 驗證含約束斷言的期望值
resolver.resolveAndValidate("&gt(0)&lt(100)", actualValue, "age", "使用者");

// 型別感知的值比對
boolean eq = resolver.valuesEqual("$expectedAmount", actualBigDecimal);
```

## 運作原理

1. Cucumber 透過 Java `ServiceLoader` 載入 `SpecFormulaBackendProviderService`
2. `SpecFormulaBackend.loadGlue()` 讀取 `isa.yml`、API spec、Data DDL
3. `StepDefinitionFactory` 依每個 instruction 的 `instruction_type` 建立對應的 `AbstractIsaStepDefinition` 子類
4. 每個 StepDefinition 的 `getPattern()` 回傳 ISA format（已轉換 named groups 為 capturing groups）
5. Cucumber 以 regex matching 將 feature step 對應到 StepDefinition 並執行 `doExecute()`
