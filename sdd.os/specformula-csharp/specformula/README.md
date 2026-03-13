# SpecFormula C#

C# 版 SpecFormula 框架參考指引。

## ADR 參考文件

- [ADR-0011: TestLib Frameworkization to SpecFormula](../../specs/adr/0011-testlib-frameworkization-to-specformula.md)
  — 四模組架構、JPA → JDBC 遷移、isa.yml 驅動 StepDefinition 自動註冊、DatabaseDialect 抽象
- [ADR-0012: Core HTTP Abstraction and Cross-Thread Context](../../specs/adr/0012-specformula-core-http-abstraction-and-cross-thread-context.md)
  — HttpClientAdapter 介面、TestRequest/TestResponse DTO、跨執行緒 ScenarioContext

## 測試 Feature File 路徑

Java 參考實作的 feature file 位於 `specformula-java/specformula-core/src/test/resources/features/`：

### Core — Helper / Resolver

| Feature | 路徑 |
|---|---|
| CAS 符號系統 | `features/core/helper/resolver/CAS.feature` |
| 時間系統 | `features/core/helper/resolver/TimeSystem.feature` |
| VAR 變數系統 | `features/core/helper/resolver/VAR.feature` |

### Core — Instruction

| Feature | 路徑 |
|---|---|
| API Call | `features/core/instruction/apicall/api-call.feature` |
| API Call + Time | `features/core/instruction/apicall/api-call-time.feature` |
| API Call + VAR | `features/core/instruction/apicall/api-call-var.feature` |
| Entity Setup（單/多資料源） | `features/core/instruction/entity/setup/` |
| Entity Validate | `features/core/instruction/entity/validate/` |
| Entity Non-Existence Validate | `features/core/instruction/entity/non-existence-validate/` |
| DataTable Response Validate | `features/core/instruction/responsevalidate/data-table-response-validate*.feature` |
| JSON Response Validate | `features/core/instruction/responsevalidate/json-response-validate*.feature` |
| Time Control | `features/core/instruction/timecontrol/time-control.feature` |

### Spec Reader

| Feature | 路徑 |
|---|---|
| isa.yml 讀取 | `features/spec/isa/isa-spec-reader*.feature` |
| OpenAPI 讀取 | `features/spec/api/api-spec-reader*.feature` |
| DDL 讀取 | `features/spec/data/entity-ddl-reader*.feature` |
| Table SQL 生成 | `features/spec/data/table-definition-select*.feature` |

## isa.yml 規格參考

- 範例檔：[`specformula-java/specformula-core/src/test/resources/isa.yml`](../../specformula-java/specformula-core/src/test/resources/isa.yml)
- API Spec 範例：[`specformula-java/specformula-core/src/test/resources/specs/api/`](../../specformula-java/specformula-core/src/test/resources/specs/api/)
- Data Schema 範例：[`specformula-java/specformula-core/src/test/resources/specs/data/`](../../specformula-java/specformula-core/src/test/resources/specs/data/)
- isa.yml 完整設定說明：見 [Java SpecFormula README](../../specformula-java/README.md) 的「isa.yml 設定」章節
