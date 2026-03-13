# Time-System @time() 生成改為ZonedDateTime

## Context

- 針對 Time-System（由 `ISAFeatureArgumentResolver` 解析的時間生成語句）進行回傳型別一致性調整。
- 現行 Time-System 支援以下語句：
    - `@time(...)`：回傳 `ZonedDateTime` 用於生成「完整時間點」參數
    - `@date()`：回傳 `LocalDate`
    - `@localtime()`：回傳 `LocalTime`
- 本次決策以既定測試為準，將 `@time("...")` 的解析行為定義為：**回傳 `ZonedDateTime`**，並支援多種輸入格式（完整 datetime、含 offset、UTC `Z`、僅日期、以及 `now`）。

## Problem

- 過去 `@time()` 回傳 `long`（epoch timestamp），與 `@date()` / `@localtime()` 的回傳型別在語意與型別設計上不一致，導致：
    - 呼叫端（steps / executor / request builder）需自行處理 timestamp 與 datetime 的轉換與時區補齊，產生重複邏輯與錯誤風險。
    - timestamp 本身缺乏時區資訊，無法直接表達「一個時間點在某個時區下的表示」，對測試資料可讀性與除錯不利。
    - Feature/DSL 使用者在撰寫測試時，必須記住 `@time()` 是整數而非時間物件，增加認知負擔。

## Forces

1. **一致性（Consistency）**：Time DSL 的回傳型別應遵循「語句回傳語意明確的時間型別」的設計方向，減少混用 primitive 與時間物件。
2. **可讀性（Readability）**：測試資料應盡可能以 ISO-8601 表達並保留時區/offset 語意，讓測試本身可讀且可追溯。
3. **正確性（Correctness）**：需正確支援 ISO-8601 的多變體（含 `Z`、offset、date-only），避免解析偏差造成 flaky tests。
4. **可維護性（Maintainability）**：解析邏輯應集中在 Resolver / Time-System，避免在 steps/executor 分散實作。
5. **可預期性（Determinism / Test Stability）**：`now` 這類動態時間必須有可測試的合理邊界，降低時間飄移導致的不穩定。
6. **相容性（Compatibility）**：既有依賴 epoch millis 的使用情境仍可能存在，需要提供集中化轉換路徑，避免各處自行轉換。

---

# Solution

## 解法摘要

- `@time("...")` 統一回傳 `ZonedDateTime`，作為「完整時間點」的標準輸出型別。
- `ISAFeatureArgumentResolver` 對 `@time()` 增強解析能力，明確支援以下輸入：
    1. ISO-8601 完整日期時間（無 offset）：`2025-11-04T08:00:00`
    2. ISO-8601 帶 offset：`2025-12-24T02:36:54-12:00`
    3. ISO-8601 UTC `Z`：`2025-11-04T08:00:00Z`
    4. 只有日期：`2025-11-04`（自動補 `00:00:00`）
    5. `now`：回傳解析當下的 `ZonedDateTime`
- 對於需要 epoch millis 的 downstream（例如 API payload 需要 timestamp），由 Resolver 或 Time utility 提供集中化轉換方法，避免 steps/executor 自行處理。

## 解法設計

### 1) `@time()` 的解析規格

`@time("...")` 的行為規格可明確定義為：

- **回傳型別**：一律為 `ZonedDateTime`
- **輸入與行為**
    - `@time("2025-11-04T08:00:00")`
        - 視為「沒有 offset 的 LocalDateTime」
        - 轉為 `ZonedDateTime`（需指定預設 ZoneId；若你們系統既定為 Asia/Taipei，則以該時區）
    - `@time("2025-12-24T02:36:54-12:00")`
        - 保留 offset（測試驗證 `zonedDateTime.getOffset().getId()` 為 `12:00`）
    - `@time("2025-11-04T08:00:00Z")`
        - 視為 UTC（測試驗證 `zonedDateTime.getZone().getId()` 為 `Z`）
    - `@time("2025-11-04")`
        - date-only，自動補 `00:00:00`
        - 轉為 `ZonedDateTime`（同樣需要預設 ZoneId）
    - `@time("now")`
        - 回傳呼叫當下時間點
        - 測試採用 before/after 範圍驗證（合理區間）

### 2) 預設時區（Default Zone）處理

- 對於未帶 offset 的輸入（`LocalDateTime` / `LocalDate`），需要一個預設時區才能轉為 `ZonedDateTime`。
- ADR 建議將預設時區做成 Time-System 的固定配置（例如 `Asia/Taipei`），並集中在一處常數或設定：
    - `private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Taipei");`
- 若未來需要不同時區測試，擴充方式可另開 ADR（例如支援 `@time("now","UTC")` 或 `@time("2025-...","Asia/Taipei")`），本 ADR 不強制要求立即實作。

### 3) 轉換責任集中化（避免回到 long 耦合）

- 原則：`@time()` 的輸出是 `ZonedDateTime`；若要 timestamp，應由 Resolver/utility 統一轉換：
    - `long toEpochMillis(ZonedDateTime zdt)`
    - `String format(ZonedDateTime zdt, DateTimeFormatter fmt)`
- 這能避免把「epoch millis」的需求反向污染到 DSL 的核心設計，確保 Time-System 輸出維持語意清晰。

### 4) 測試與行為一致性（與既定測試對齊）

- 目前測試已涵蓋：
    - ISO-8601 datetime
    - ISO-8601 datetime + offset
    - ISO-8601 UTC `Z`
    - date-only 補 00:00:00
    - now 的合理區間
- 因此本 ADR 將其視為 contract：未來任何重構不得破壞這些行為（除非另開 ADR 調整規格）。

---

# Resulting Context

## Pros

- **型別一致性提升**：`@time()` 與 `@date()` / `@localtime()` 的設計方向一致，皆回傳時間型別而非 primitive。
- **語意更清楚**：`ZonedDateTime` 同時承載時間點與時區/offset，避免 timestamp 的語意不足。
- **解析能力更完整**：支援 ISO-8601 多變體與 date-only、`now`，更符合測試資料撰寫需求。
- **降低重複轉換邏輯**：timestamp/格式化的需求集中到 Resolver/utility，steps/executor 更乾淨。
- **可測試性強**：已用單元測試固定行為契約，降低回歸風險。

## Cons

- **既有 long 依賴需遷移**：若有步驟或 executor 直接假設 `@time()` 是 `long`，需改用集中化轉換。
- **預設時區假設**：對無 offset 的輸入必須依賴 default zone；若不同環境/不同測試需要不同 zone，需另行擴充或設定機制。
- **`now` 的不確定性**：`now` 天然具備時間飄移，測試必須採區間驗證；若未來要更可控（例如 freeze time），需要額外能力（如 Clock 注入）。