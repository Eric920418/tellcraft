# SpecFormula Dev Framework

SpecFormula 各語言實作的開發框架 Monorepo。

SpecFormula 是一套基於 ISA（Instruction Specification Architecture）的測試框架，透過 `isa.yml` 宣告式配置自動註冊 StepDefinition，讓 BDD Feature File 直接驅動 API 呼叫、資料庫驗證、時間控制等測試流程。

## 目錄結構

| 資料夾 | 說明 | 狀態 |
|---|---|---|
| `specformula-java/` | Java 參考實作（Cucumber + Spring Boot） | **Reference Implementation** |
| `specformula-csharp/` | C# 實作 | WIP |
| `specformula-python/` | Python 實作 | Planned |
| `specformula-ts/` | TypeScript 實作 | Planned |
| `specformula-lsp-plugin/` | LSP Plugin（IDE 整合） | Planned |
| `benchmark/` | 多語言 Benchmark 專案 | Active |
| `specs/` | SpecFormula 架構決策紀錄（ADR） | Active |
| `specformula-docs/` | ISA 規格白皮書與文件網站（submodule） | Active |

## 快速開始

以 Java 參考實作為起點：

```bash
cd specformula-java
mvn clean test
```

詳見 [specformula-java/README.md](specformula-java/README.md)。

## ISA 規格白皮書

ISA 規格白皮書統一由 [specformula-docs](specformula-docs/) 維護，包含：

- **Symbols**：VAR（變數系統）、CAS（約束斷言系統）、TIME（時間系統）
- **Instructions**：ApiCall、EntitySetup、EntityValidate、EntityNonExistenceValidate、ResponseValidate、TimeControl

架構決策紀錄詳見 [specs/README.md](specs/README.md)。

## LICENSE


