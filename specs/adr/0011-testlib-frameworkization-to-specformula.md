# TestLib 框架化：從 isa-test-library 遷移至 SpecFormula

# Context

- 本 ADR 針對 ISA 測試基礎設施的架構升級：將原本的 `isa-test-library`（元件庫）重新設計為 `SpecFormula`（測試框架），透過 Cucumber Backend SPI 自動註冊 ISA instruction 對應的 StepDefinition，不再需要透過 codegen 產出 StepDefinition 程式碼。使用者仍可根據專案需求自訂額外的 StepDefinition。

## Problem

- `isa-test-library` 定位為「Helper 元件庫」，使用者專案需在 `isa_codegen.yml` 中配置複雜的 `executor` plugin（包含 `plugin_python_path`、`linter`、`subpackage` 等），再透過 codegen 流程產生 StepDefinition glue code 呼叫 Helper。這導致：
  1. 使用者需理解並配置 executor / linter plugin，配置門檻高（參考 `isa_codegen.yml` 的 `components.executors` 與 `components.linters`）
  2. codegen 產出的 stepdef 散落在各專案中，ISA instruction 的 regex pattern 無法集中管理
  3. 測試庫強制依賴 Spring Data JPA 與 Spring Web，即使底層邏輯不需要

## Forces

1. **減少重複 Glue Code**：ISA instruction 對應的 StepDefinition 由框架根據 `isa.yml` 自動註冊，使用者不需為 ISA 標準指令手寫 stepdef；但仍可自訂額外的 StepDefinition 以處理專案特有邏輯
2. **最小化外部依賴**：框架核心不應強制引入 `spring-boot-starter-data-jpa` 或 `spring-boot-starter-web`，以降低使用門檻與依賴衝突風險
3. **資料庫存取通用性**：Entity 驗證需支援多種資料庫（H2、PostgreSQL、MSSQL、MySQL），不能綁定特定 ORM 框架
4. **與 Spring 生態整合**：多數使用者專案仍為 Spring Boot 應用，框架需提供無縫整合路徑（DataSource、MockMvc、Authenticator 自動注入）
5. **Testcontainer 自動化**：測試環境的資料庫容器應由框架自動管理，使用者不需手動配置 Docker 容器

# Solution

## 解法摘要

- 新建 `specformula` 多模組專案，包含四個模組：`specformula-core`（核心邏輯）、`specformula-spring`（Spring 整合橋接）、`specformula-cucumber`（Cucumber Backend SPI 實作）、`specformula-testcontainer`（Testcontainers 自動配置）。框架在啟動時讀取 `isa.yml` 並自動註冊對應的 StepDefinition。資料庫存取從 JPA 改為純 JDBC，Spring 整合與 Testcontainer 管理獨立為選配模組。

## 解法設計

### 1. 模組結構

```
specformula/
├── specformula-core            # 核心邏輯（無 Spring / Cucumber 框架依賴）
│   ├── instruction/            # 各 instruction_type 對應的執行邏輯
│   │   ├── TimeControl         # 時間控制
│   │   ├── EntitySetup         # 資料準備（INSERT）
│   │   ├── EntityValidate      # 資料驗證（SELECT 比對）
│   │   ├── EntityNonExistenceValidate  # 資料不存在驗證
│   │   ├── ApiCall             # API 呼叫（MockMvc）
│   │   ├── DataTableResponseValidate   # 回應驗證（DataTable 格式）
│   │   └── JsonResponseValidate        # 回應驗證（JSON 格式）
│   ├── spec/                   # isa.yml / OpenAPI / DDL 讀取器
│   │   ├── IsaSpecReader       # 解析 isa.yml 配置
│   │   ├── ApiSpecReader       # 解析 OpenAPI 規格
│   │   └── EntityDdlReader     # 解析 schema.sql DDL
│   ├── dialect/                # DatabaseDialect（H2, PostgreSQL, MySQL, MSSQL）
│   ├── helper/                 # ISAFeatureArgumentResolver, NamingConverter, TypeConverter
│   └── context/                # ScenarioContext（ThreadLocal per-scenario 狀態管理）
│
├── specformula-spring          # Spring Boot 橋接層（選配）
│   ├── SpecFormulaBridge       # 中央協調器（管理 DataSource、MockMvc、Authenticator、MockTime）
│   ├── SpecFormulaSpringConfiguration  # Spring Auto-Configuration
│   ├── TrackingDataSource      # 追蹤 INSERT 操作，最佳化資料清理
│   ├── Authenticator           # 認證介面（由使用者專案實作）
│   └── MockTime                # 時間模擬介面
│
├── specformula-cucumber        # Cucumber Backend SPI 實作
│   ├── SpecFormulaBackendProviderService  # ServiceLoader 入口
│   ├── SpecFormulaBackend      # loadGlue() 讀取 isa.yml → 建立 StepDefinition
│   ├── StepDefinitionFactory   # 依 instruction_type 建立對應的 StepDefinition
│   ├── *StepDefinition         # 各 instruction_type 的 StepDefinition 子類
│   └── PerformanceMetrics      # 測試執行效能量測
│
└── specformula-testcontainer   # Testcontainers 自動配置（選配）
    ├── TestcontainerFactory    # 建立 PostgreSQL / MySQL / MSSQL / H2 容器與 DataSource
    ├── SpecFormulaTestcontainerAutoConfiguration  # Spring Auto-Configuration
    └── TestcontainerDataSourceRegistrar           # 依 isa.yml 動態註冊 DataSource Bean
```

### 2. 模組依賴關係

```
specformula-core                  （純邏輯，僅依賴 Cucumber DataTable + Jackson YAML）
       ↑
specformula-spring                （依賴 core，提供 Spring 整合橋接）
       ↑
specformula-cucumber              （依賴 spring → core，實作 Cucumber Backend SPI）

specformula-testcontainer         （依賴 core + spring，提供 Testcontainers 自動配置）
```

使用者專案引入 `specformula-cucumber`（自動含 core + spring），按需加入 `specformula-testcontainer`。

### 3. 運作機制

1. Cucumber 透過 Java `ServiceLoader` 載入 `SpecFormulaBackendProviderService`
2. `SpecFormulaBackend.loadGlue()` 讀取 `isa.yml`，解析每個 instruction 的 `format` 與 `instruction_type`
3. `StepDefinitionFactory` 依 `instruction_type` 建立對應的 StepDefinition 子類
4. Cucumber 以 regex matching 將 `.isa.feature` 中的 step 自動對應到已註冊的 StepDefinition
5. 每個 Scenario 開始時，`SpecFormulaBridge` 建立 `ScenarioContext`（ThreadLocal），結束時清理已變動的資料表

### 4. 支援的 Instruction Types

| instruction_type | 說明 | 必要 named group | data_format |
|------------------|------|------------------|-------------|
| `time_control` | 設定模擬時間 | `time` | - |
| `entity_setup` | 準備測試資料（INSERT） | `entity` | - |
| `entity_validate` | 驗證資料存在且欄位一致 | `entity` | - |
| `entity_non_existence_validate` | 驗證資料不存在 | `entity` | - |
| `api_call` | 發送 API 請求 | `summary` | - |
| `response_validate` | 驗證 API 回應（DataTable） | `summary`, `status_code` | `data_table` |
| `response_validate` | 驗證 API 回應（JSON） | `summary`, `status_code` | `json` |

### 5. JPA → JDBC 遷移

| 面向 | 舊版 (isa-test-library) | 新版 (specformula-core) |
|------|------------------------|------------------------|
| 資料庫查詢 | `JpaRepository` + `Example` API | 純 JDBC `java.sql.Connection` |
| 欄位映射 | JPA Entity 隱式映射 | `entity_to_table_mapping.yml` + `schema.sql` 顯式宣告 |
| Schema 來源 | JPA auto-ddl | 使用者提供 DDL，框架解析 `CREATE TABLE` 取得欄位定義 |
| 多資料庫 | 受限於 JPA Dialect | `DatabaseDialect` 介面，支援 H2/PostgreSQL/MSSQL/MySQL |
| 資料清理 | 全表清理 | `TrackingDataSource` 追蹤 INSERT 操作，僅清理 dirty tables |

### 6. 資料清理最佳化：TrackingDataSource

`TrackingDataSource` 包裝原始 `DataSource`，攔截 SQL 語句追蹤哪些資料表被 INSERT。每個 Scenario 結束時，`SpecFormulaBridge` 僅清理實際被變動的資料表（dirty tables），而非全部資料表，大幅降低清理開銷。清理流程依 `DatabaseDialect` 處理各資料庫差異（FK 約束停用/啟用、TRUNCATE 語法、auto-increment 重置）。

### 7. Testcontainer 自動配置

`specformula-testcontainer` 根據 `isa.yml` 中 `config.data.source` 的 `db_type` 自動建立對應的 Docker 容器與 `DataSource`：

- **支援的資料庫**：PostgreSQL 16、MySQL 8.0、MSSQL 2022、H2（in-memory）
- **Container Reuse**：設定 `reuse: true` 可跨測試執行重用容器，加速 CI/CD
- **Permission Isolation**：`permission: isolated` 模式下，每個 DataSource 建立獨立的資料庫使用者
- **HikariCP 連線池**：自動配置連線池避免頻繁建立連線

### 8. 使用者專案的變更

#### 依賴變更

```xml
<!-- 移除 -->
<dependency>
    <groupId>tw.sdd</groupId>
    <artifactId>isa-test-library</artifactId>
</dependency>

<!-- 新增：核心框架（必要） -->
<dependency>
    <groupId>ai.specformula</groupId>
    <artifactId>specformula-cucumber</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <scope>test</scope>
</dependency>

<!-- 選配：Testcontainer 自動配置 -->
<dependency>
    <groupId>ai.specformula</groupId>
    <artifactId>specformula-testcontainer</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <scope>test</scope>
</dependency>
```

#### ISA StepDefinition 改為框架自動註冊

使用者專案中原本由 AI 產出或手寫的 ISA instruction StepDefinition glue code 可移除，改由 `isa.yml` 宣告驅動。使用者仍可保留或新增自訂的 StepDefinition 以處理專案特有的測試邏輯：

```yaml
# src/test/resources/isa.yml
config:
  api:
    resource_path: specs/api
    project_path: src/test/resources/specs/api
    time_format: iso                    # iso|timestamp|epoch|date_only|time_only
  data:
    permission: isolated                # isolated|shared
    reuse: false                        # 是否重用 Testcontainer
    source:
      - name: default
        resource_path: specs/data
        project_path: src/test/resources/specs/data
        db_type: h2                     # h2|postgresql|mysql|mssql

instructions:
  - name: Time control
    format: ^現在的時間是 "(?P<time>.+)"$
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

#### 新增 Spec 檔案

使用者需提供以下 spec 資源（置於 `src/test/resources/`）：

| 檔案 | 用途 |
|------|------|
| `isa.yml` | ISA instruction 定義與 config |
| `specs/api/api-spec.yml` | OpenAPI 規格（API 路徑、參數、回應 schema） |
| `specs/data/schema.sql` | 資料表 DDL（`CREATE TABLE` 語句） |
| `specs/data/entity_to_table_mapping.yml` | Entity 名稱 → Table 名稱映射 |

#### Spring 整合配置

使用者仍需保留 `CucumberSpringConfiguration`（用於啟動 Spring Boot Test Context），並提供 `Authenticator` Bean（如需認證）：

```java
@TestConfiguration
public class TestConfig {
    @Bean
    public Authenticator authenticator() {
        return actorId -> { /* 產生 token */ };
    }
}
```

`specformula-spring` 會透過 Spring Auto-Configuration 自動將 `DataSource`、`MockMvc`、`Authenticator`、`MockTime` 注入 `SpecFormulaBridge`，使用者無需手動接線。

### 9. CI 配置

CI 透過 Maven Profile 與 GitHub Actions matrix strategy 執行各資料庫環境的測試：

```yaml
# .github/workflows/ci.yml
java-test-library:
  name: Java Test Library (${{ matrix.profile }})
  strategy:
    matrix:
      profile: [h2, postgresql, mysql, mssql]
  steps:
    - uses: actions/setup-java@v4
      with:
        java-version: '21'
    - run: mvn clean test -B -P ${{ matrix.profile }}
      working-directory: test_library/java/specformula
```

| Profile | 資料庫 | Cucumber Tag Filter |
|---------|--------|---------------------|
| `h2` | H2 in-memory（預設） | `not (@postgresql or @mysql or @mssql) or @h2` |
| `postgresql` | PostgreSQL 16 | `@postgresql` |
| `mysql` | MySQL 8.0 | `@mysql` |
| `mssql` | MSSQL Server 2022 | `@mssql` |

### 10. 技術版本

| 技術 | 版本 |
|------|------|
| Java | 21 |
| Cucumber | 7.15.0 |
| JUnit Jupiter | 5.10.2 |
| Testcontainers | 1.19.3 |
| Jackson | 2.16.1 |
| HikariCP | 5.1.0 |
| PostgreSQL JDBC | 42.7.1 |
| MySQL Connector | 8.2.0 |
| MSSQL JDBC | 12.4.2.jre11 |
| H2 | 2.2.224 |

# Resulting Context

## Pros

- ISA 標準指令的 StepDefinition 由框架自動註冊，使用者不需為此手寫 glue code；同時保留自訂 StepDefinition 的彈性
- 四層模組架構（core → spring → cucumber / testcontainer）職責清晰，使用者按需引入
- 框架核心不依賴 Spring Data JPA，降低依賴衝突風險與學習門檻
- 支援多資料庫（H2/PostgreSQL/MSSQL/MySQL）透過 `DatabaseDialect` 抽象
- ISA instruction 的 regex pattern 集中管理於 `isa.yml`，便於版本控制與跨專案共用
- `TrackingDataSource` 僅清理 dirty tables，提升測試執行效能
- Testcontainer 自動配置與 container reuse 降低 CI 環境建置成本
- CI matrix strategy 確保各資料庫環境的測試覆蓋

## Cons

- 框架透過 SPI 機制載入，除錯時的 class loading 問題可能較不直覺
- 多模組結構增加了建置與發佈的複雜度
- Testcontainer 在 CI 環境首次執行需拉取 Docker image，耗時較長
