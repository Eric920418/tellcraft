# Time-System `now` 改為可被 Mock 的「情境現在時間」

## Context

- 在 BDD / Cucumber 的測試步驟中，部分情境需要「固定現在時間」以驗證時間敏感邏輯（例如：到期判斷、跨日、時區、排程、時間窗、SLA 等）。
- 目前 Time-System 的 `@time("now")`、`@date("now")`、`@localtime("now")` 多半依賴系統當下時間（例如 `ZonedDateTime.now()`），導致測試在不同時間點執行時行為不穩定，且難以重現。

## Problem

- 測試案例需要可控的「現在時間」，但現行 `now` 是即時取得系統時間，造成：
    - 測試結果隨執行時間變動，尤其在跨秒、跨分鐘、跨日、或 CI 併行時更明顯。
    - 無法輕易表達「在此 Scenario 中，現在時間是 X」的語意並影響所有 `now` 取值點。
    - `@time("now")`、`@date("now")`、`@localtime("now")` 若各自取系統時間，會在同一個 scenario 中出現微小時間差，造成不一致。

## Forces

1. **可重現性（Reproducibility）**：同一份測試在任何時間、任何環境執行應得到一致結果。
2. **一致性（Consistency）**：同一 Scenario 中所有 `now` 必須指向同一個時間基準，避免「這行 now」與「下一行 now」不同。
3. **可用性（Usability）**：測試步驟需要用直覺方式設定 now，且與既有 Time DSL 設計對齊（例如沿用 `@time(...)` 可解析的時間格式）。
4. **集中治理（Governance）**：避免在 Step/Executor 直接耦合 `ScenarioContext` 或自行 mock 時間，需集中於 Resolver/Time-System。
5. **擴充性（Extensibility）**：未來仍可能需要以不同格式設定 now（ISO-8601、date-only、含 offset、UTC Z、甚至相對時間），設計需可延伸。

---

## Solution

### 解法摘要

- 在 Time-System 中將 `now` 重新定義為「可被 Scenario 設定的 `mock 現在時間`」。
- 由 `ISAFeatureArgumentResolver` 提供 `setNow(String timeString)` 與 `getNow(): ZonedDateTime`，集中管理「情境現在時間」。
- `@time("now")`、`@date("now")`、`@localtime("now")` 統一改為從 `getNow()` 派生，而非直接呼叫系統時間。

### 解法設計

### 1) 新增 Resolver API（Scenario Scoped）

- 在 `ISAFeatureArgumentResolver` 新增：
    - `setNow(String timeString)`：設定 mock 現在時間，解析規格對齊 `@time("...")`
    - `getNow(): ZonedDateTime`：取得此 Scenario 的 now（若未設定，提供明確預設策略）

**設計要點**

- `setNow(String timeString)` 的 `timeString` 支援與 `@time("...")` 相同輸入（ISO-8601 datetime、含 offset、`Z`、date-only 補 00:00:00 等），以降低學習成本與避免另開一套 parser。
- `getNow()` 回傳 `ZonedDateTime`，作為「now 的單一來源」。

### 2) `now` 的解析替換規則（統一由 getNow 派生）

- 既有語句遇到 `"now"` 時，改為以下行為：
- `@time("now")`
    - 回傳 `resolver.getNow()`（ZonedDateTime）
- `@date("now")`
    - 回傳 `resolver.getNow().toLocalDate()`
- `@localtime("now")`
    - 回傳 `resolver.getNow().toLocalTime()`

此設計確保三者在同一 Scenario 中一致（同一基準時間衍生出 date / localtime）。

### 3) 未設定 now 時的預設策略（必須明確）

- 若 Scenario 未呼叫 `setNow(...)`，`getNow()` 的行為需明確且一致。
    - `now = ZonedDateTime.now(DEFAULT_ZONE)`然後存起來
    - 同一 Scenario 後續 `getNow()` 回傳同一值（避免微差）

### 4) 步驟層的用法（示例）

- ISA Step ：
    - `Given 現在的時間是 "2025-11-04T08:00:00"` → `resolver.setNow("2025-11-04T08:00:00")`
- 後續 Scenario 內所有 `@time("now")` / `@date("now")` / `@localtime("now")` 都會使用該時間。

---

## Resulting Context

### Pros

- **測試穩定且可重現**：now 不再依賴系統當下時間，避免 flaky tests。
- **Scenario 內一致性**：`@time("now")`、`@date("now")`、`@localtime("now")` 使用同一個 `getNow()` 基準衍生，避免微小時間差。
- **使用體驗對齊既有 ISA**：`setNow(String)` 解析規格對齊 `@time()`，降低學習成本。
- **集中治理**：now 的存取與轉換集中在 Resolver/Time-System，易於後續維護與擴充（例如統一時區策略、格式支援）。

### Cons

- **引入新的狀態管理責任**：Resolver 需維護 Scenario scoped 的 now 狀態，需確保生命週期正確（Scenario reset/清理）。
- **與實時間測試的界線**：少數測試若確實要測「真實現在時間」，需要額外標記或明確繞過（例如提供 `@time("realtime")` 或允許不快取的模式；此屬未來擴充議題）。

---

## 其他方案

### 方案：新增獨立語句 `@now` （不採用）

- 作法：提供 `@now()` 回傳 mock now（或系統 now），`@time("now")` 不動。
- 缺點：
    - 若需要「其他時間格式」或衍生型別（date / localtime）仍需額外語法或轉換規則，無法自然覆蓋 `@date("now")`、`@localtime("now")`。
    - ISA 語意分裂：now 的入口變多（`@now` vs `@time("now")`），增加使用者記憶與治理成本。
    - 無法直接對齊既有 `@time(...)` 的解析能力，擴充成本反而更高。