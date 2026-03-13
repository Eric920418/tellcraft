# SpecFormula Specs

此目錄存放 SpecFormula 的架構決策紀錄。

## 目錄結構

```
specs/
└── adr/                    # 架構決策紀錄 (ADR)
```

## ADR（架構決策紀錄）

架構決策紀錄位於 [adr/](adr/)，記錄 SpecFormula 的重要架構決策。

| ADR | 主題 |
|---|---|
| [ADR-0015](adr/0015-migrate-isa-docs-to-specformula-docs.md) | ISA 規格白皮書遷移至 specformula-docs 統一維護 |
| [ADR-0014](adr/0014-repo-restructure-to-specformula-dev-framework.md) | 研究方向轉變：從 codegen 自動生成測試程式碼到 ISA 指令測試框架 |
| [ADR-0013](adr/0013-feature-argument-resolver-interface-and-custom-instruction-type.md) | FeatureArgumentResolver 介面與自訂 Instruction Type |
| [ADR-0012](adr/0012-specformula-core-http-abstraction-and-cross-thread-context.md) | Core HTTP Abstraction and Cross-Thread Context |
| [ADR-0011](adr/0011-testlib-frameworkization-to-specformula.md) | TestLib 框架化：從 isa-test-library 遷移至 SpecFormula |
| [ADR-0010](adr/0010-unified-cli-with-modular-dispatching.md) | 中央調度器與模組契約制 |
| [ADR-0009](adr/0009-var-system-string-interpolation.md) | VAR-System 支援字串插值語法 |
| [ADR-0008](adr/0008-response-validation-step-requires-api-summary-and-status-code.md) | API 回應驗證步驟需明確指定 API Summary 與 Status Code |
| [ADR-0007](adr/0007-single-root-package-structure.md) | 單一根套件結構 |
| [ADR-0006](adr/0006-time-system-now-is-mockable-contextual-time.md) | Time-System `now` 改為可被 Mock 的情境現在時間 |
| [ADR-0005](adr/0005-time-system-outputs-java-time-types.md) | Time-System @time() 生成改為 ZonedDateTime |
| [ADR-0004](adr/0004-var-system-does-not-support-time-system-variable-setting.md) | 不支持在 VAR-System 中直接使用 TIME-System 設定變數值 |
| [ADR-0003](adr/0003-isa-allow-missing-parameters-tag.md) | @allow-missing-parameters 標籤支援參數型前置條件 |
| [ADR-0002](adr/0002-extract-testable-components-to-test-library.md) | 獨立出 Test Library Module |
| [ADR-0001](adr/0001-entity-validation-test-helper-pattern.md) | Executor 全面套用 Test Helper Pattern |
