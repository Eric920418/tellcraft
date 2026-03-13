# SpecFormula C#

> **Status: Planned — 此套件尚未準備好**

## 目前狀態

C# 版 SpecFormula 尚未完成四層模組架構（Core / Framework Integration / BDD Backend / Testcontainer）的移植。目前僅包含：

- **isa-test-library/**：舊版 ISA Test Library，提供基礎的 EntityTable 操作、API Call Helper 等功能，但尚未按照 SpecFormula 架構重構
- **specformula/**：架構參考指引文件

### 尚未完成的原因

1. SpecFormula 四層模組架構目前僅有 Java 參考實作完成
2. C# 需要實作對應的 BDD Backend SPI（例如 SpecFlow / Reqnroll 整合）
3. Database Dialect 抽象層需要移植（目前 Java 版支援 H2, PostgreSQL, MySQL, MSSQL）
4. HttpClientAdapter 介面需對應到 C# 的 HttpClient / TestServer 體系

### 開發路線

請參考 Java 參考實作 ([specformula-java/](../specformula-java/)) 作為移植基準，特別是：

- `specformula-core/`：核心邏輯（無框架依賴）
- `specformula-cucumber/`：Cucumber Backend SPI 實作
- `specformula-spring/`：Spring 整合層
- Feature File：`specformula-core/src/test/resources/features/`

## ADR 參考文件

- [ADR-0011: TestLib Frameworkization to SpecFormula](../specs/adr/0011-testlib-frameworkization-to-specformula.md)
  — 四模組架構、JPA → JDBC 遷移、isa.yml 驅動 StepDefinition 自動註冊、DatabaseDialect 抽象
- [ADR-0012: Core HTTP Abstraction and Cross-Thread Context](../specs/adr/0012-specformula-core-http-abstraction-and-cross-thread-context.md)
  — HttpClientAdapter 介面、TestRequest/TestResponse DTO、跨執行緒 ScenarioContext
