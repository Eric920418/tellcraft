# SpecFormula Bridge

> [!WARNING]
> **開發狀態 (Status)**：本套件目前處於 **初步搭建階段 (Initial Scaffolding Phase)**。
> 本文件所列之職責與架構規劃主要作為 **設計藍圖 (Design Blueprint)** 使用，具體功能尚在積極實作中。
> **注意**：本文件之內容隨時可能依據開發需求進行調整，並不代表最終的實作結果。

SpecFormula 的應用程式框架橋接層 - 整合 Web 框架、資料源與執行環境。

本套件對標 Java 版的 `specformula-spring`，是 SpecFormula 核心與使用者應用程式（Application Under Test）之間的橋樑，負責處理環境配置與自動化適配。

## 職責 (Responsibilities)

- **HTTP 客戶端適配 (HTTP Client Adapters)**：
  - 實作 `HttpClientAdapter`，支援與 FastAPI、Flask 或 Django 等框架的整合。
  - 處理 API 呼叫的攔截、Header 注入與回應擷取。
- **資料源追蹤 (Data Source Tracking)**：
  - 提供與 SQLAlchemy 等 ORM 整合的追蹤機制。
  - 支援 `entity_setup` 指令的自動資料寫入與 `entity_validate` 的資料庫驗證。
- **環境自動配置 (Auto-configuration)**：
  - 在測試啟動時自動探索並註冊所需的適配器與橋接器。
  - 管理測試執行期間的應用程式環境 _context_。

## 依賴

詳細依賴資訊請參見 [`pyproject.toml`](./pyproject.toml)。

> **提示**：開發相關依賴（dev dependencies）位於 `specformula-python/pyproject.toml` 中。
