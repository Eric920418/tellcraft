# SpecFormula Behave

> [!WARNING]
> **開發狀態 (Status)**：本套件目前處於 **初步搭建階段 (Initial Scaffolding Phase)**。
> 本文件所列之職責與架構規劃主要作為 **設計藍圖 (Design Blueprint)** 使用，具體功能尚在積極實作中。
> **注意**：本文件之內容隨時可能依據開發需求進行調整，並不代表最終的實作結果。

基於 behave 的 SpecFormula BDD 實作 - 橋接 Cucumber 語法與 SpecFormula 核心。

本套件對標 Java 版的 `specformula-cucumber`，負責將自然語言編寫的 Gherkin `.feature` 檔案，轉換為 SpecFormula 核心引擎可執行的指令。

## 職責 (Responsibilities)

- **步驟定義 (Step Definitions)**：將 SpecFormula 的標準指令（如 `現在時間為 "{time}"`、`準備一個{entity}`）對映至 behave 的 _step definition_。
- **生命週期橋接 (Lifecycle Bridging)**：
  - 透過 `before_scenario` 與 `after_scenario` 鉤子 (Hooks) 初始化與清理 SpecFormula 的核心 _context_。
  - 處理 _background_ 步驟的初始化。
- **參數解析 (Parameter Parsing)**：利用 `regex` 處理複雜的步驟參數擷取。

## 使用方式 (Usage)

使用者只需在 `environment.py` 中引入此套件的步驟，即可在 Feature Files 中使用 SpecFormula 的宣告式指令。

## 依賴

詳細依賴資訊請參見 [`pyproject.toml`](./pyproject.toml)。

> **提示**：開發相關依賴（dev dependencies）位於 `specformula-python/pyproject.toml` 中。
