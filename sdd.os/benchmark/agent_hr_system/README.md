# 特務人資系統測試基準

本專案展示「AI x BDD：規格驅動全自動開發術」在企業級人資系統中的應用：

1. **後端 SDD 工作流程**：使用 [specformula-java](../../specformula-java/) 框架，從 `isa.yml` + Gherkin `.isa.feature` 自動產生 Cucumber 測試步驟定義（**無 AI 參與**），然後讓 Claude SDK 基於測試案例自動實作 Spring Boot 業務邏輯
2. **前端 Vibe Coding**：透過 Next.js 快速實現 UI，提供完整的人資系統操作介面，方便測試後端功能是否正確

---

## 📋 專案結構

```
benchmark/agent_hr_system/
├── docker-compose.yml                   # 🐳 Docker Compose 配置（一鍵啟動）
├── backend/                            # 🔧 後端（Spring Boot + MySQL）
│   ├── spec/                           # 📐 規格定義（SSOT - Single Source of Truth）
│   │   ├── api/api-spec.yml            # OpenAPI 規格（定義 API 端點）
│   │   ├── data/                       # 資料規格
│   │   │   ├── entity_to_table_mapping.yml
│   │   │   └── schema.sql              # 資料庫結構
│   │   └── PRD.md                      # 產品需求文件
│   │
│   ├── src/test/resources/
│   │   ├── features/                   # 🧪 Cucumber 測試（測試規格）
│   │   │   └── *.isa.feature           # Gherkin 功能規格（12 個檔案）
│   │   ├── isa.yml                     # specformula 指令集配置
│   │   └── specs/                      # specformula 使用的 spec 副本
│   │       ├── api/api-spec.yml        # OpenAPI 規格（回應 schema 驗證）
│   │       └── data/                   # schema.sql + entity mapping
│   │
│   ├── src/test/java/.../stepdefs/     # Cucumber 步驟定義
│   │   ├── CustomSteps.java            # 自訂步驟（操作失敗/操作成功）
│   │   ├── JwtAdapter.java             # JWT 認證（implements specformula Authenticator）
│   │   ├── TestableTimeService.java    # 時間控制（讀取 specformula bridge）
│   │   └── given/Given_A_特務.java      # 特務建立（含密碼 bcrypt 編碼）
│   │
│   ├── run_test.sh                     # 測試執行腳本
│   ├── pom.xml                         # Maven 依賴配置
│   └── Dockerfile                      # 後端容器配置
│
└── frontend/                           # 🎨 前端（Next.js + Tailwind CSS）
    ├── src/app/                        # Next.js App Router
    │   ├── login/                      # 登入頁面
    │   ├── records/                    # 打卡記錄頁面
    │   ├── summary/                    # 工時摘要頁面
    │   ├── leave/                      # 請假申請頁面
    │   ├── overtime/                   # 加班申請頁面
    │   ├── subordinate-leaves/         # 下屬請假管理頁面
    │   └── subordinate-overtimes/      # 下屬加班管理頁面
    ├── src/services/                   # API 服務層
    ├── package.json                    # Node.js 依賴配置
    └── Dockerfile                      # 前端容器配置

註：src/main/java/.../agentHR/ 目錄（業務邏輯）可由 Claude SDK 執行時動態生成
```

---

## 🚀 快速啟動（推薦）

### 一鍵啟動完整系統

使用 Docker Compose 啟動前端、後端、資料庫：

```bash
# 在專案根目錄執行
cd benchmark/agent_hr_system
docker-compose up
```

**系統啟動後**：
- **前端**: http://localhost:3000
- **後端 API**: http://localhost:8080
- **後端健康檢查**: http://localhost:8080/actuator/health
- **phpMyAdmin**: http://localhost:8081

### 啟用 API 文檔（Swagger UI）

Swagger UI 預設在生產環境關閉。若需使用，請以 dev 模式啟動：

```bash
# 停止現有容器
docker-compose down

# 以 dev 模式啟動
SPRING_PROFILE=dev docker-compose up --build
```

**啟動後可存取**：
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI 規格**: http://localhost:8080/api-spec.yml

### 測試帳號

所有帳號密碼都是 `password123`：

- **總監**: wang@example.com（可審核所有下屬請假/加班）
- **資深工程師**: lee@example.com（可審核部分下屬）
- **工程師**: zhang@example.com, chen@example.com
- **初級工程師**: lin@example.com, liu@example.com

### 停止服務

```bash
# 停止所有服務
docker-compose down

# 停止並清除所有數據（包括資料庫）
docker-compose down -v
```

---

## 🏗️ SDD 工作流程（後端）

後端採用規格驅動開發（SDD），透過 specformula-java 框架從 `isa.yml` 配置自動產生 Cucumber step definitions：

### 前置準備：安裝 specformula-java 到本地 Maven

```bash
# 在 sdd.os 專案根目錄
cd specformula-java
mvn install -DskipTests
```

### 執行測試

```bash
cd benchmark/agent_hr_system/backend
mvn clean test
```

12 個 feature 檔案、103 個 scenario 應全數通過。

### specformula 如何運作

1. `isa.yml` 定義 instruction type regex → specformula 在 Cucumber 啟動時自動產生對應的 step definitions
2. `specs/api/api-spec.yml` 提供回應 schema 驗證
3. `specs/data/schema.sql` + `entity_to_table_mapping.yml` 支援 entity_validate 自動查詢 DB 驗證
4. 只有 4 個 custom step 需要手寫（JWT 認證、時間控制、特務建立、操作結果判斷）

### SDD 開發流程

specformula 產生的測試步驟確保測試案例的準確性，然後 AI 基於這些測試案例自動實作業務邏輯：

1. AI 讀取 Cucumber feature files 與 specformula 產生的測試步驟
2. 自動實作 Spring Boot Controllers、JPA Entities、Services、Repositories
3. 執行 `mvn test` 驗證實作
4. 根據測試報告自動修正，直到所有測試通過

---

## 🎨 前端說明

前端採用 **Vibe Coding** 方式開發，並未使用規格驅動開發流程。

### 技術堆疊
- **Next.js 14** - React 框架（App Router）
- **Tailwind CSS** - UI 樣式
- **TypeScript** - 型別安全

### 主要功能
- 🔐 **登入認證** - JWT Token 管理（HttpOnly Cookie）
- ⏰ **打卡管理** - 上下班打卡、查詢記錄、刪除記錄
- 📊 **工時統計** - 當日工時摘要、加班時數
- 📝 **請假申請** - 提交請假、查詢記錄、狀態追蹤
- 👔 **主管功能** - 審核下屬請假/加班申請、查詢下屬記錄

### 前端定位

> 前端的目的是**方便測試人資系統後端功能是否正確**，提供完整的操作介面來驗證 API 端點、業務邏輯、資料流轉。前端程式碼並非規格驅動開發的產出，而是為了輔助後端開發與測試。

---

## 🔧 測試基礎設施（後端）

### specformula-java 框架

- **specformula-cucumber** - 從 isa.yml 自動產生 Cucumber step definitions（API call、response validate、entity validate）
- **specformula-testcontainer** - 自動建立 H2 測試資料庫、每場景 cleanup
- **Spring Boot Test** - Spring 整合測試
- **MockMvc** - API 呼叫測試（in-process，無需啟動伺服器）

### 自訂步驟（Custom Steps）

specformula 自動產生大部分步驟，僅 4 個需手寫：

| 檔案 | 用途 |
|---|---|
| `JwtAdapter.java` | JWT 認證，implements `ai.specformula.spring.auth.Authenticator` |
| `TestableTimeService.java` | 時間控制，從 specformula bridge 讀取 `currentTime` |
| `given/Given_A_特務.java` | 特務建立，含密碼 bcrypt 編碼邏輯 |
| `CustomSteps.java` | `操作失敗`/`操作成功` 判斷 |

### 測試執行

```bash
cd benchmark/agent_hr_system/backend
mvn clean test
```

---

## 📚 技術堆疊

### 後端核心框架
- **Spring Boot 3.2** - Web 框架
- **Spring Security** - 身份認證與授權
- **Spring Data JPA** - ORM 框架
- **JWT (JJWT 0.12)** - Token 管理
- **MySQL 8.0** - 生產資料庫
- **H2 Database** - 測試資料庫

### 測試工具
- **specformula-java** - ISA 指令集自動產生 Cucumber step definitions
- **Cucumber-JVM 7.15** - BDD 測試框架
- **JUnit 5** - 測試運行器
- **MockMvc** - API 測試

### 前端核心框架
- **Next.js 14** - React 框架
- **TypeScript** - 型別系統
- **Tailwind CSS** - UI 樣式
- **React Hook Form** - 表單管理

---

## 📝 相關文件

### 專案文件
- **[backend/spec/api/api-spec.yml](backend/spec/api/api-spec.yml)** - OpenAPI 規格（API 端點定義）
- **[backend/src/test/resources/isa.yml](backend/src/test/resources/isa.yml)** - specformula 指令集配置
- **[frontend/DOCKER_DEPLOYMENT.md](frontend/DOCKER_DEPLOYMENT.md)** - 前端 Docker 部署說明

### 測試規格
- **[backend/src/test/resources/features/](backend/src/test/resources/features/)** - Cucumber 測試規格（12 個 feature 檔案）
