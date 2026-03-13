# SpecFormula Testcontainer

> [!WARNING]
> **開發狀態 (Status)**：本套件目前處於 **初步搭建階段 (Initial Scaffolding Phase)**。
> 本文件所列之職責與架構規劃主要作為 **設計藍圖 (Design Blueprint)** 使用，具體功能尚在積極實作中。
> **注意**：本文件之內容隨時可能依據開發需求進行調整，並不代表最終的實作結果。

SpecFormula 測試容器自動化工具 — 根據 `isa.yml` 管理基礎設施容器。

本套件透過 Testcontainers 技術為測試提供隔離且乾淨的執行環境，職責對標 Java 版的 `specformula-testcontainer`。

## 職責 (Responsibilities)

- **容器生命週期管理**：根據 `isa.yml` 中的定義，自動啟動、暫停與銷毀資料庫容器（如 PostgreSQL, MySQL, MSSQL）。
- **資料源自動配置**：動態建立資料庫連線並注入到測試情境中。
- **資料庫初始化**：在容器啟動後自動執行 DDL 腳本，確保測試開始前具備正確的 Schema 結構。

## 依賴管理說明

為了確保初期開發與使用的「開箱即用 (Out-of-the-box)」體驗，本套件目前預設依賴了 PostgreSQL、MySQL 與 MSSQL Server 的容器化驅動。這能讓使用者在不需額外配置的情況下，直接執行所有支援的資料庫自動化測試。

## 支援環境

目前已封裝並支援以下資料庫環境：

- **PostgreSQL**
- **MySQL**
- **MSSQL Server**

## 依賴

詳細依賴資訊請參見 [`pyproject.toml`](./pyproject.toml)。

> **提示**：開發相關依賴（dev dependencies）位於 `specformula-python/pyproject.toml` 中。
