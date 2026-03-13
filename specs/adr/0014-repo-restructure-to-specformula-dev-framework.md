# 研究方向轉變：從 codegen 自動生成測試程式碼到 ISA 指令測試框架

# Context

- 本 ADR 記錄專案研究方向的根本轉變，以及伴隨而來的 Repository 重組：從 `sdd.os`（以 codegen 自動生成測試程式碼為目標）轉變為 `specformula-dev-framework`（以 ISA 指令測試框架為核心）。

## Problem

- `sdd.os` 原本的研究方向是「codegen 自動生成測試程式碼」——透過 Python 主框架（assembler、executor、linter、CLI），將可執行規格自動翻譯成各語言的測試程式碼（StepDefinition glue code）。然而在研究與實作過程中，我們發現了更好的方向：
  1. **codegen 不易更新**：框架更版時，需要求使用者刪除先前生成的 StepDefinition 再重新生成，更新成本高且容易出錯
  2. **生成的程式碼是多餘的中間層**：ISA instruction 的語義是固定的（entity_setup 就是 INSERT、entity_validate 就是 SELECT 比對），不需要為每個專案重複生成做同樣事情的 StepDefinition
  3. **框架化更直接**：與其用 codegen 生成程式碼再編譯執行，不如讓框架直接根據 `isa.yml` 宣告自動註冊 StepDefinition，由框架本身執行 ISA 指令——零生成、零中間層
  4. **SpecFormula 的成功驗證**：Java 參考實作（specformula-java）已完整實現四層模組架構（core / spring / cucumber / testcontainer），驗證了「指令測試框架」路線的可行性

## Forces

1. **研究方向已明確**：SpecFormula 指令測試框架是新的核心方向，sdd.os 的 Python codegen 框架不再是主力研究對象，兩者不應繼續混在同一 repo
2. **多語言擴展**：指令測試框架需要在 Java、C#、Python、TypeScript 各語言中實作，需要獨立的 repo 結構支撐平行開發
3. **Benchmark 與規格的歸屬**：benchmark 專案和 ISA 規格白皮書與指令測試框架密切相關，應隨框架遷移
4. **ADR 延續性**：過往的架構決策紀錄（特別是 ADR-0011 框架化、ADR-0012 HTTP 抽象）記錄了從 codegen 走向框架化的演進脈絡，需保留

# Solution

## 解法摘要

- 放棄「codegen 自動生成測試程式碼」的研究方向，全面轉向「ISA 指令測試框架」。在 repo 層面，從 `sdd.os` 建立 `specformula-dev-framework`，移除 Python codegen 框架（`src/`、`tests/`），以 SpecFormula 各語言實作為 repo 核心，搭配 benchmark、ISA 規格白皮書與 ADR。

## 解法設計

### 方向轉變對照

| 面向 | 舊方向（sdd.os） | 新方向（specformula-dev-framework） |
|------|-----------------|-------------------------------------|
| 核心理念 | codegen 自動生成測試程式碼 | 框架根據 `isa.yml` 宣告直接執行 ISA 指令 |
| 執行流程 | 規格 → codegen → StepDefinition 原始碼 → 編譯 → 執行 | 規格 → `isa.yml` → 框架自動註冊 StepDefinition → 直接執行 |
| 主框架 | Python（assembler, executor, linter） | 各語言的 SpecFormula 框架（Java 為參考實作） |
| 中間產物 | 生成的 StepDefinition glue code | 無（零生成） |

### 新 Repo 目錄結構

```
specformula-dev-framework/
├── .github/                      # CI/CD workflows
├── benchmark/                    # 多語言 Benchmark 專案
├── specformula-java/             # Java 參考實作（Reference Implementation）
├── specformula-csharp/           # C# 實作（Planned）
├── specformula-python/           # Python 實作（Planned）
├── specformula-ts/               # TypeScript 實作（Planned）
├── specformula-lsp-plugin/       # LSP Plugin（Planned）
├── specs/                        # SpecFormula 規格中心
│   ├── adr/                      # 架構決策紀錄
│   └── isa/                      # ISA 規格白皮書
│       ├── instructions/         # ApiCall, EntitySetup, EntityValidate, ...
│       └── symbols/              # VAR, CAS, TIME
└── docs/                         # 其他文件（保留）
```

### 移除的項目

| 項目 | 原因 |
|---|---|
| `src/`（Python SDD 框架） | 屬於舊方向的 codegen 框架，不再是研究重心 |
| `tests/`（Python 測試） | 同上 |
| `pyproject.toml`、`setup.cfg` | Python 專案配置，不再適用 |
| `test_library/java/isa-test-library/` | 已被 specformula-java 框架化取代（見 ADR-0011） |

# Resulting Context

## Pros

- 研究方向明確聚焦於「ISA 指令測試框架」，repo 結構反映這一定位
- 不再依賴 codegen 生成的中間程式碼，測試執行的穩定性和可預測性大幅提升
- 各語言實作在獨立 repo 中平行開發，降低跨團隊的認知負擔
- ISA 規格白皮書與 ADR 集中管理於 `specs/`，作為所有語言實作的共用規範基礎

## Cons

- 舊方向的 Python codegen 框架在此 repo 中不再維護，若未來需要回顧需回到 sdd.os 的歷史 commit