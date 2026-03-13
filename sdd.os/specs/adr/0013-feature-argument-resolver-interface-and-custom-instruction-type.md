# FeatureArgumentResolver 介面提取與 custom instruction_type 支援

# Context

- 本 ADR 針對 SpecFormula 框架的兩項設計：(1) 從 `ISAFeatureArgumentResolver` 提取 `FeatureArgumentResolver` 公開介面，提供給外部自定義 StepDefinition 使用；(2) ISA 新增 `custom` instruction_type，讓使用者自訂指令格式。

## Problem

- `ISAFeatureArgumentResolver` 是 SpecFormula 內部實作類別，包含 VAR-System（變數系統）、CAS（約束斷言系統）、TIME-System（時間表達式系統）三套核心能力，但未提供公開介面供外部使用者引用
- 外部使用者撰寫自定義 StepDefinition 時，無法安全地使用變數解析、約束驗證等功能，只能直接依賴內部實作類別
- ISA 的 `instruction_type` 僅支援框架內建的六種類型（`time_control`、`entity_setup`、`api_call`、`response_validate`、`entity_validate`、`entity_non_existence_validate`），無法讓使用者自訂指令

## Forces

1. **介面穩定性**：公開介面一旦發佈，變更成本高；需精選方法，排除內部實作細節（如 `setNow`、`getNow`、`parseColumnPrefix`、`evaluateConstraints`）
2. **Spring IoC 整合**：外部使用者預期透過 `@Autowired` 注入工具類別，而非手動從 Bridge 取得
3. **ISA 擴展性**：使用者需要在 `isa.yml` 中定義自訂指令格式，搭配自定義 StepDefinition 實現業務邏輯
4. **data_format 彈性**：`custom` 指令可能需要 DataTable 或 JSON 參數，也可能完全不需要參數

# Solution

## 解法摘要

- 從 `ISAFeatureArgumentResolver` 提取 `FeatureArgumentResolver` 介面，僅暴露 5 個公開方法，涵蓋變數解析、約束驗證、值比對三類能力。內部呼叫端（`EntityValidate`、`JsonResponseValidate`）從 `evaluateConstraints` 統一改用介面方法 `resolveAndValidate`。`SpecFormulaSpringConfiguration` 註冊 `FeatureArgumentResolver` Bean，供外部 `@Autowired` 注入。ISA 新增 `custom` instruction_type，允許使用者自訂指令格式與可選的 `data_format`。

## 解法設計

### 1. FeatureArgumentResolver 介面

```
specformula-core
┌──────────────────────────────────────────┐
│  FeatureArgumentResolver (interface)     │
│    ├─ parseContextKeys()                 │  VAR-System: 變數儲存
│    ├─ extractAndStoreVariables()         │  VAR-System: 變數儲存
│    ├─ resolveVariable()                  │  VAR-System: 變數引用 + TIME-System
│    ├─ resolveAndValidate()               │  VAR-System + CAS: 解析 + 驗證
│    └─ valuesEqual()                      │  值比對（型別感知）
│                                          │
│  ISAFeatureArgumentResolver              │
│    └─ implements FeatureArgumentResolver  │
│    └─ 內部方法: setNow, getNow,          │
│       parseColumnPrefix, evaluateConstraints
└──────────────────────────────────────────┘
```

介面方法選擇原則：
- **納入**：外部 StepDefinition 會直接使用的能力（變數解析、約束驗證、值比對）
- **排除**：框架內部生命週期管理（`setNow`/`getNow`）、內部解析輔助（`parseColumnPrefix`）、已被 `resolveAndValidate` 取代的低層方法（`evaluateConstraints`）

### 2. evaluateConstraints → resolveAndValidate 重構

`evaluateConstraints` 是低層方法，僅處理 CAS 約束斷言。`resolveAndValidate` 整合了 VAR-System 變數解析與 CAS 約束斷言，是更完整的驗證入口。

| 呼叫端 | 重構前 | 重構後 |
|--------|--------|--------|
| `EntityValidate` | `evaluateConstraints(expected, actual, field, entity)` | `resolveAndValidate(expected, actual, field, entity)` |
| `JsonResponseValidate` | 手動 `$notnull` 檢查 + `resolveVariable` + `evaluateConstraints` + 字串比對 | `resolveAndValidate` 統一處理 |

同時移除 `resolveAndValidate` 中的 `$notnull` 支援（此為歷史遺留 bug，`$notnull` 不屬於任何子系統的語法）。

### 3. Spring IoC 註冊

`SpecFormulaSpringConfiguration` 新增 `@Bean` 方法：

```java
@Bean
public FeatureArgumentResolver featureArgumentResolver() {
    return SpecFormulaBridge.getInstance().getResolver();
}
```

外部使用者可直接 `@Autowired FeatureArgumentResolver resolver` 注入使用。

### 4. custom instruction_type

ISA `isa.yml` 新增 `custom` 指令類型，驗證規則：

| 屬性 | 規則 |
|------|------|
| `format` | 無特殊命名群組要求（不要求 `(?P<entity>...)` 或 `(?P<summary>...)`） |
| `data_format` | 可選；若指定則必須為 `data_table` 或 `json` |

```yaml
instructions:
  - name: 自定義步驟
    format: ^執行(?P<action>.+)$
    instruction_type: custom
    data_format: data_table   # 可選
```

# Resulting Context

## Pros

- 外部使用者透過 `FeatureArgumentResolver` 介面安全使用 VAR-System、CAS、TIME-System 三套能力，不依賴內部實作
- Spring 環境下可直接 `@Autowired` 注入，符合 Spring 使用慣例
- `resolveAndValidate` 統一驗證入口，消除 `JsonResponseValidate` 中的重複邏輯
- `custom` instruction_type 讓使用者在 ISA 框架內定義自訂指令，搭配自定義 StepDefinition 實現業務邏輯

## Cons

- `FeatureArgumentResolver` 介面一旦發佈，新增或修改方法需考慮向後相容
- `custom` 指令的 StepDefinition 完全由使用者實作，框架無法保證其正確性
- `evaluateConstraints` 仍保留在 `ISAFeatureArgumentResolver` 中（未刪除），但不再是公開介面的一部分；若外部使用者直接 cast 為實作類別仍可呼叫

