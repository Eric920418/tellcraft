# SpecFormula Core

> [!WARNING]
> **開發狀態 (Status)**：本套件目前處於 **初步搭建階段 (Initial Scaffolding Phase)**。
> 本文件所列之職責、組件與架構規劃主要作為 **設計藍圖 (Design Blueprint)** 使用，具體功能尚在積極實作中。
> **注意**：本文件之內容隨時可能依據開發需求進行調整，並不代表最終的實作結果。

SpecFormula 的核心框架 — 負責規格讀取、指令系統與執行引擎。

`specformula-core` 是整個框架的地基，負責定義 ISA (Instruction Specification Architecture) 的核心邏輯。它不依賴於任何特定的測試執行器或應用程式框架，確保了框架的跨平台一致性。

## 職責 (Responsibilities)

- **規格解析 (Spec Reading)**：解析 `isa.yml` 配置檔案，將其轉換為強型別的內部模型。
- **指令分發器 (Instruction Dispatcher)**：核心執行引擎，負責將解析後的指令分派給對應的執行器（Executor）。
- **變數與斷言系統 (VAR & CAS)**：
  - **VAR**：管理測試執行期間的變數生命週期，支援變數擷取與引用。
  - **CAS**：處理約束斷言系統，驗證資料與狀態是否符合規格。
- **抽象基底類別 (Abstract Base Classes)**：
  - 定義 `HttpClientAdapter`、`DatabaseTracker` 等核心介面，供擴充模組實作。
- **情境管理 (Context Management)**：提供 `ScenarioContext` 與 `TestContext` 以維持測試執行期間的狀態隔離。

## 核心組件 (Core Components)

- `ai.specformula.core.isa`: `isa.yml` 模型定義與解析器。
- `ai.specformula.core.variable`: 變數處理與符號解析。
- `ai.specformula.core.instruction`: `ApiCall`、`EntitySetup` 等指令的執行邏輯介面。

## 需求

- Python >= 3.10
- PyYAML, Pydantic, Regex
