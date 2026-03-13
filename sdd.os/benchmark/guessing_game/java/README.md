# 猜數字遊戲測試基準（Java）

本專案使用 [specformula-java](../../../specformula-java/) 框架，從 `isa.yml` + Gherkin `.feature` 自動產生 Cucumber 測試步驟定義，然後讓 AI 基於測試案例自動實作 Spring Boot 業務邏輯。

---

## 📋 專案結構

```
benchmark/guessing_game/java/
├── spec/                               # 📐 規格定義（SSOT）
│   ├── api/api.yml                     # OpenAPI 規格
│   └── data/
│       ├── entity_to_table_mapping.yml
│       └── schema.sql                  # 資料庫結構
│
├── src/test/resources/
│   ├── features/                       # 🧪 Cucumber 測試規格
│   │   ├── 玩家加入遊戲.feature
│   │   ├── 玩家設定秘密.feature
│   │   └── 玩家猜測數字.feature
│   ├── isa.yml                         # specformula 指令集配置
│   └── specs/                          # specformula 使用的 spec 副本
│       ├── api/api.yml
│       └── data/
│
├── src/test/java/.../stepdefs/         # Cucumber 步驟定義
│   ├── CustomSteps.java                # 自訂步驟（操作失敗/操作成功）
│   └── CucumberSpringConfiguration.java
│
├── src/main/java/.../                  # 業務邏輯（AI 生成）
│   ├── controller/GameController.java
│   ├── service/GameService.java
│   ├── entity/                         # JPA Entities
│   └── repository/                     # Spring Data JPA Repositories
│
└── pom.xml                             # Maven 依賴配置
```

---

## 🚀 快速啟動

### 前置準備：安裝 specformula-java 到本地 Maven

```bash
# 在 sdd.os 專案根目錄
cd specformula-java
mvn install -DskipTests
```

### 執行測試

```bash
cd benchmark/guessing_game/java
mvn clean test
```

3 個 feature 檔案、所有 scenario 應全數通過。

---

## 🔧 specformula 配置

`isa.yml` 定義 3 種 instruction type：

| Instruction Type | 用途 |
|---|---|
| `api_call` | API 呼叫（支援 UID actor） |
| `response_validate` | 回應驗證（DataTable 格式） |
| `entity_validate` | 資料庫 entity 驗證 |

僅 1 個 custom step 需手寫：

| 檔案 | 用途 |
|---|---|
| `CustomSteps.java` | `操作失敗`/`操作成功` 判斷 |
