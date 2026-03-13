# Quick Start

## 環境需求

- Java 21（推薦 [Temurin](https://adoptium.net/)）
- Maven 3.6+
- Docker（用於 Testcontainers 自動起資料庫）

## 1. Clone & Build

```bash
git clone <repo-url>
cd specformula-java
mvn clean install -DskipTests
```

## 2. 跑測試

```bash
# 預設用 H2（不需要 Docker）
mvn clean test

# 用 PostgreSQL（需要 Docker）
mvn test -pl specformula-core -Ppostgresql

# 用 MySQL
mvn test -pl specformula-core -Pmysql

# 用 MSSQL
mvn test -pl specformula-core -Pmssql
```

## 3. 在你的專案中使用 SpecFormula

在 `pom.xml` 加入依賴：

```xml
<dependency>
    <groupId>ai.specformula</groupId>
    <artifactId>specformula-cucumber</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>ai.specformula</groupId>
    <artifactId>specformula-testcontainer</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <scope>test</scope>
</dependency>
```

## 4. 設定 isa.yml

在 `src/test/resources/isa.yml` 建立配置檔：

```yaml
config:
  api:
    resource_path: specs/api
    project_path: src/test/resources/specs/api
    time_format: iso
  data:
    reuse: true
    source:
      - name: default
        resource_path: specs/data
        project_path: src/test/resources/specs/data
        db_type: h2

instructions:
  - name: Time control
    format: ^現在時間為 "([^"]+)"$
    instruction_type: time_control
  - name: Data preparation
    format: ^準備一個(?P<entity>[\u4e00-\u9fffa-zA-Z0-9_]+), with table:$
    instruction_type: entity_setup
  - name: API call
    format: ^\((?:No Actor|UID="(?P<userId>\$[\w.]+)")\) (?P<summary>.+?), call table:$
    instruction_type: api_call
  - name: Response validate
    format: ^(?P<summary>.+?)\((?P<status_code>\d+)\)回應,\s*with table:$
    instruction_type: response_validate
    data_format: data_table
  - name: Entity validate
    format: ^驗證(?P<entity>[\u4e00-\u9fffa-zA-Z0-9_]+), with table:$
    instruction_type: entity_validate
  - name: Entity non-existence validate
    format: ^驗證不存在(?P<entity>[\u4e00-\u9fffa-zA-Z0-9_]+), with table:$
    instruction_type: entity_non_existence_validate
```

## 5. 寫你的第一個 Feature

```gherkin
Feature: 新增待辦事項

  Background:
    Given 現在時間為 "2026-01-27T10:00:00"
    Given 準備一個使用者, with table:
      | >Alice.id | name  | email             |
      | <userId   | Alice | alice@example.com |

  Rule: 使用者可以新增待辦事項

    Example: 成功新增
      When (UID="$Alice.id") 新增待辦事項, call table:
        | title  | description      |
        | 買牛奶  | 去全聯買兩瓶鮮奶   |
      Then 新增待辦事項(201)回應, with table:
        | >todo1.id | userId    | title  |
        | <todoId   | $Alice.id | 買牛奶  |
```

關鍵語法：
- `>變數名.欄位` — 從回應擷取值存入變數
- `$變數名` — 引用先前存入的變數
- `<欄位` — 宣告輸出欄位（比對用）
- `(UID="$var")` — 指定 API 呼叫的 Actor

## 更多資源

- [Java 參考實作](specformula-java/README.md) — 完整的四模組架構說明
- [ISA 規格白皮書](specs/README.md) — Symbols、Instructions 完整定義
- [Benchmark 範例](benchmark/) — Todo List、HR System 等實戰範例
