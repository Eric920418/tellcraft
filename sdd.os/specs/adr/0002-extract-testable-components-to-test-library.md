# 獨立出 Test Library Module 讓應用專案可以直接飲用

# Context

在 AI x BDD 全自動化開發流程中，為了讓 AI 能夠基於 Cucumber 測試規格自動實作業務邏輯、讓 SDD.os 的 assembler 測試指令集標準能夠適用於一般專案。測試基礎設施需要提供一組標準化的「可測試元件」（Testable Components），用於在測試環境中模擬和控制系統行為（如時間、認證等）。

- 好比說， [`0001-entity-validation-test-helper-pattern.md`](https://www.notion.so/waterball/0001-entity-validation-test-helper-pattern.md) 所定義的 Test Helper Pattern 就是最重要的測試元件之一：把「生成測試程式碼的核心流程」抽到可重用的 helper（test helper / test library）中，讓生成出來的 stepdef 只保留組裝參數與呼叫 helper 的薄層結構。

## Problem

在 `benchmark/agent_hr_system` 專案的測試程式碼中，存在兩類可測試元件：

1. **Authenticator** - 用於測試環境中模擬使用者認證，根據 actor ID 取得認證 token
2. **TestableTimeService** - 用於測試環境中模擬和控制時間流動，讓 AI 可以基於 Gherkin 規格中的時間設定（如 `stepdefs/CommonThen` 中的 `Given 現在的時間是 "2025-01-01T08:00:00"`）來 mock 當前時間並且執行測試

這些元件原本散落在 Benchmark 專案中的 `.../src/test/java/.../stepdefs/` 目錄中，與專案特定的測試步驟定義混在一起，存在以下問題：

- **重複性問題**：每個 AI x BDD 專案都需要手動複製這些可測試元件
- **維護困難**：當可測試元件需要更新或修正時，所有專案都需要手動同步
- **缺乏標準化**：不同專案可能實作不同版本的可測試元件，導致行為不一致
- **責任不清**：可測試元件與專案特定的測試程式碼混在一起，架構層次不清楚

## Forces

1. **可重用性**：可測試元件應該能夠在不同的 AI x BDD 專案中重複使用
2. **標準化**：確保所有專案使用相同版本的可測試元件，行為一致
3. **低耦合**：可測試元件應該與專案特定的業務邏輯解耦
4. **清晰的架構層次**：明確區分「測試基礎設施」與「專案特定測試程式碼」
5. **靈活性**：專案可以根據需求選擇使用 Maven 依賴或直接複製檔案
6. **測試與被測試的邊界清楚**：這些共用可測試元件本身需要大量測試；若把測試元件與其測試程式碼都放在各個 benchmark 專案中，會造成「測試程式碼裡又有大量測試」的混雜與維護困難。將測試元件放在 test library 的 `src/`，而針對測試元件的測試放在 `test/`，能更明確區隔責任與結構。

# Solution

## 解法摘要

將可測試元件從 `benchmark/agent_hr_system/backend/src/test/` 提取到共用的 `test_library/java` 模組中，建立 `testables` 套件來集中管理這些元件。

## 解法設計

### 1. 建立 testables 套件結構

在 `test_library/java/src/main/java/tw/sdd/isa/testlib/` 下新增 `testables/` 套件，依據功能領域分類：

```
test_library/java/src/main/java/tw/sdd/isa/testlib/
├── context/
│   └── ScenarioContext.java           # 場景上下文管理
├── helper/
│   ├── EntityTableAssertHelper.java    # DataTable 實體驗證輔助類
│   ├── EntityTableSpec.java            # 實體映射規格定義
│   └── ISAFeatureArgumentResolver.java # ISA 特性參數解析器
└── testables/                          # 🆕 可測試元件套件
    ├── auth/                           # 認證相關
    │   └── Authenticator.java          # 認證介面
    └── time/                           # 時間相關
        ├── TimeService.java            # 時間服務介面
        └── TestableTimeService.java    # 可測試的時間服務實作

```

### 2. 明確訂定專案使用方式

專案可以選擇兩種方式使用可測試元件：

### 方式一：直接複製到專案內

1. 複製 `testables/` 套件到專案測試目錄
2. 修改套件名稱為專案套件
3. 更新 import 路徑

### 方式二：使用 Maven 依賴（推薦）

1. 安裝 test_library 到本地 Maven Repository
2. 在專案 `pom.xml` 中添加依賴
3. 在 `CucumberSpringConfiguration` 中添加 `@ComponentScan(basePackages = {"your.project.package", "tw.sdd.isa.testlib"})`
4. 直接使用，無需修改套件名稱

### 3. 專案實作範例

**專案需要實作 Authenticator 介面**（以 agent_hr_system 為例）：

```java
package org.waterballagent.agentHR.stepdefs;

import tw.sdd.isa.testlib.testables.auth.Authenticator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class JwtAdapter implements Authenticator {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AgentRepository agentRepository;

    @Override
    public String getToken(Object actorId) {
        Long agentId = Long.parseLong(actorId.toString());
        Agent agent = agentRepository.findById(agentId).orElseThrow();
        return jwtService.generateToken(agent.getEmail());
    }
}

```

**專案業務邏輯注入 TimeService**：

```java
package org.waterballagent.agentHR.service;

import tw.sdd.isa.testlib.testables.time.TimeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AttendanceService {

    @Autowired
    private TimeService timeService;  // 測試環境會注入 TestableTimeService

    public void clockIn(Long agentId) {
        LocalDateTime now = timeService.now();  // 可控制的時間
        // ... 業務邏輯
    }
}

```

# Resulting Context

## Pros

- **提高可重用性**：所有 AI x BDD 專案可共用標準化的可測試元件
- **簡化專案建立**：新專案可直接使用 test_library，無需重新實作基礎設施
- **集中維護**：可測試元件的更新和修正只需在 test_library 中進行，所有專案透過 Maven 依賴自動同步
- **標準化行為**：確保所有專案使用相同版本的可測試元件，測試行為一致
- **清晰的架構層次**：明確區分「測試基礎設施」(test_library) 與「專案特定測試程式碼」(stepdefs)
- **支援 AI 自動開發**：AI 可以基於標準化的可測試元件生成測試程式碼和業務邏輯

## Cons

- **額外依賴**：專案需要依賴 test_library 模組（使用 Maven 依賴方式）
- **版本同步問題**：若採用直接複製方式，未來仍需手動同步可測試元件的更新
- **學習成本**：開發者需要理解可測試元件的設計與使用方式
- **專案必須耦合 sdd.os test-library 的這些介面**：專案需要實作 `Authenticator` 等介面才能使用完整功能，如果專案本身有要實踐整潔的架構 (Clean Architecture)，則可能會有部分架構設計者會不希望要去耦合 sdd.os 的 test-library 套件在核心的測試程式碼中。