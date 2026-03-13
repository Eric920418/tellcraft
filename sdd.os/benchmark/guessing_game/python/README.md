> [!CAUTION]
> **DEPRECATED**: 本文件中「CodeGen」相關章節引用了已移除的 sdd.os Python codegen 框架（PR #180）。
> `pip install`、`docs/spec-rules/` 等路徑已不存在。本文件保留作為歷史參考。

# Python 1A2B 猜數字遊戲測試基準

本專案展示如何「AI x BDD：規格驅動全自動開發術」的工作流程：

1. **Test CodeGen**：從 Gherkin 規格自動生成精準的 Behave 測試步驟（**無 AI 參與**，確保測試案例準確性）
2. **AI 實作**：透過 `sdd.sh` 讓 Claude SDK 基於測試案例自動實作 FastAPI 業務邏輯

---

## 📋 專案結構

```
benchmark/guessing_game/python/
├── spec/                                # 📐 規格定義（SSOT - Single Source of Truth）
│   ├── api/api.yml                      # OpenAPI 規格（定義 API 端點）
│   ├── data/                            # 資料結構規格
│   │   ├── schema.sql                   # SQL DDL schema（3 個資料表）
│   │   └── entity_to_table_mapping.yml  # 實體到資料表的映射
│   ├── entities/                        # 實體規格（定義資料模型）
│   │   ├── 玩家.yml
│   │   ├── 遊戲.yml
│   │   └── 猜測結果.yml
│   └── dev/tech-stack.md                # 技術堆疊說明
│
├── src/test/features/                   # 🧪 Behave 測試（測試規格）
│   ├── environment.py                   # Behave 環境設定（Context Contract）
│   ├── *.feature                        # Gherkin 功能規格（3 個檔案）
│   └── steps/                           # Behave 步驟定義
│       ├── common_then.py               # 通用驗證步驟（手寫，JSONPath 驗證）
│       ├── api/                         # ⚙️ API 呼叫步驟（CodeGen 生成 3 個檔案）
│       └── then/                        # ⚙️ 實體驗證步驟（CodeGen 生成 2 個檔案）
│
├── prompts/                             # 🤖 Claude SDK 提示工程
│   ├── assembly/                        # 測試步驟實作指引
│   └── dev/                             # TDD 開發流程指引
│
├── isa_codegen.yml                      # CodeGen 配置（ISA - Instruction Set Architecture）
├── isa_genai.yml                        # GenAI 配置（用於 AI 輔助開發）
├── assembler_codegen.sh                 # 🔧 CodeGen 執行腳本（無 AI）
├── sdd.sh                               # 🚀 SDD 工作流程腳本（啟動 Claude SDK）
├── behave.ini                           # Behave 框架配置
├── test_isa_resolver.py                 # 🧪 ISA Resolver 單元測試（pytest）
├── Makefile                             # 🛠️ 測試快捷命令（test, test-var, test-cas, test-time）
└── README.md                            # 本檔案

註：src/app/ 目錄（業務邏輯）由 Claude SDK 在執行 sdd.sh 時動態生成
```

---

## 🚀 SDD 工作流程

### 步驟 1：CodeGen - 生成精準測試案例（無 AI）

從 Gherkin 規格自動生成 Behave 測試步驟，**確保測試案例的準確性**。

```bash
# 1. 建立並啟動虛擬環境
cd /path/to/sdd.os
python3 -m venv .venv
source .venv/bin/activate

# 2. 安裝相依套件
pip install -e ".[dev,benchmark-python]"

# 3. 執行 CodeGen
cd benchmark/guessing_game/python
bash assembler_codegen.sh

# 可選：啟用並行執行模式（加速 CodeGen）
bash assembler_codegen.sh --enable-parallel
```

**命令行選項**：
- `--feature <path>` - 指定單一 Feature 檔案或目錄（預設：`src/test/features`）
- `--log-level <level>` - 設定日誌等級（預設：`INFO`）
- `--enable-parallel` - 啟用並行執行模式（使用 asyncio 並行處理 instructions）

**生成結果**：
- `src/test/features/steps/api/` - 3 個 API 呼叫步驟（支援 VAR/CAS/TIME）
- `src/test/features/steps/then/` - 2 個實體驗證步驟（支援 $variable 引用）

**生成的步驟檔案範例**：
- `API_No_Actor_玩家加入遊戲.py` - 包含 ISAFeatureArgumentResolver 整合
- `Then_存在一個玩家_With_Table.py` - 支援變數引用

> 📘 **詳細說明**：[CODEGEN_GUIDE.md](CODEGEN_GUIDE.md) - ISA 配置、executor 運作原理

### 步驟 2：SDD - AI 自動實作業務邏輯

基於生成的測試案例，讓 Claude SDK 自動實作 FastAPI 業務邏輯。

```bash
cd benchmark/guessing_game/python
./sdd.sh
```

**SDD 工作流程**：
1. Claude SDK 讀取 Behave feature files 與測試步驟
2. 自動實作 FastAPI endpoints、SQLAlchemy models、業務邏輯
3. 執行 `behave` 測試驗證實作
4. 根據測試報告自動修正，直到所有測試通過

**優勢**：
- ✅ 測試先行，確保實作符合規格
- ✅ AI 受測試約束，減少幻覺與錯誤
- ✅ 自動化迭代，無需人工介入

---

## 🔧 測試基礎設施

### Behave Context（`environment.py` 提供）

Behave 的 `context` 物件在測試場景中自動傳遞，包含以下屬性：

| Context 屬性 | 說明 | 用途 |
|-------------|------|------|
| `context.client` | FastAPI TestClient | API 呼叫測試（使用 ASGI in-process 呼叫，無需啟動伺服器） |
| `context.db_session` | SQLAlchemy Session | 資料庫驗證（in-memory SQLite，每個場景獨立隔離） |
| `context.last_response` | HTTP Response | 儲存最後一次 API 回應，供 Then 步驟驗證 |
| `context.table` | DataTable | 自動提供 Gherkin 表格資料（Behave 內建） |

**生命週期管理**：
- `before_scenario()` - 每個場景前初始化 client、db_session、last_response
- `after_scenario()` - 每個場景後清理資料庫，確保測試隔離

### 步驟定義檔案結構

生成的測試步驟定義遵循 **Screaming Architecture** 原則：

- **API 步驟**：`API_No_Actor_<操作名稱>.py`（包含 actor 前綴），函式名稱固定為 `invoke`
- **實體驗證步驟**：`Then_存在一個<實體>_With_Table.py`，函式名稱固定為 `validate`

所有 API 步驟定義均支援 **`@given` + `@when` 雙裝飾器**，確保 Behave 正確識別 Background 與主要步驟。

**VAR/CAS/TIME 整合**：
- 所有生成的步驟自動導入 `ISAFeatureArgumentResolver`
- 支援變數捕獲（`>contextKey`）、提取（`<executionKey`）、引用（`$variable`）
- 支援約束驗證（`&constraint(...)`）
- 支援時間表達式（`@time(...)`, `@localTime(...)`）

---

## 🎯 ISA-Gherkin 進階功能

本專案實作了 **ISA-Gherkin** 的三大系統，提升 BDD 測試的表達力：

### 三大系統簡介

| 系統 | 符號 | 用途 | 範例 |
|------|------|------|------|
| **[VAR-System](../../../docs/spec-rules/isa-level-gherkin/gherkin-variable-system%20(VAR-System).md)** | `>`, `<`, `$` | 變數捕獲與引用 | `>savedGameId`, `<id`, `$savedGameId` |
| **[CAS-System](../../../docs/spec-rules/isa-level-gherkin/gherkin-constraint-assertion-system%20(CAS-System).md)** | `&` | 約束斷言驗證 | `&gt(0)`, `&oneOf(P1,P2)` |
| **[TIME-System](../../../docs/spec-rules/isa-level-gherkin/gherkin-time-system%20(TIME-System).md)** | `@time()`, `@localTime()` | 時間表達式轉換 | `@time(now-1d)`, `@localTime(09:00)` |

> 📘 **完整規範**：點擊系統名稱查看詳細語法說明與使用範例

### 使用範例

```gherkin
Feature: 玩家設定秘密

  Background:
    # VAR-System: 捕獲動態生成的 playerId
    Given (No Actor) 玩家加入遊戲, call table:
      | >alicePlayerId | gameId | playerName |
      | <playerId      | G100   | Alice      |
    And (No Actor) 玩家加入遊戲, call table:
      | >bobPlayerId | gameId | playerName |
      | <playerId    | G100   | Bob        |

  Example: 玩家秘密首次設定成功保存
    When (No Actor) 玩家設定秘密, call table:
      | gameId | playerRole | secret |
      | G100   | P1         | 4825   |
    Then 回應, with table:
      | gameId | yourSecret | yourOpponentSecret |
      | G100   | 4825       | NOT_READY          |
    # VAR-System: 使用變數引用驗證資料庫
    And 存在一個玩家, with table:
      | id             | role | name  | secret |
      | $alicePlayerId | P1   | Alice | 4825   |
```

**說明**：
- `>alicePlayerId` + `<playerId` - 從 API 回應提取 playerId 並存為變數
- `$alicePlayerId` - 引用變數用於資料庫查詢
- `(No Actor)` - Actor 前綴，支援多使用者場景（本 Benchmark 使用 No Actor）

### 實作架構

**CodeGen 模板整合**：
- **API Call 模板**：自動生成的步驟完全支援 VAR/CAS/TIME 系統
- **Entity Validate 模板**：支援 `$variable` 引用進行資料庫查詢
- **生成的步驟檔案**：自動導入並使用 ISAFeatureArgumentResolver

核心實作位於 [src/test/features/steps/helpers/isa_resolver.py](src/test/features/steps/helpers/isa_resolver.py)，包含：

- **ISAFeatureArgumentResolver** 類別 - 整合三大系統的解析器（420 行）
- **與 Behave 整合** - CodeGen 模板自動整合到所有生成的步驟
- **完整單元測試** - [test_isa_resolver.py](test_isa_resolver.py) 提供 31 個測試（100% pass）

**驗證狀態**：
- ✅ VAR-System：端到端驗證通過（Feature → CodeGen → 運行時）
- ✅ CAS-System：單元測試 100% 覆蓋（9 tests）
- ✅ TIME-System：單元測試 100% 覆蓋（7 tests）

### 執行測試

ISA Resolver 包含 31 個單元測試，驗證 VAR/CAS/TIME 三大系統的功能。

**為何 `test_isa_resolver.py` 獨立放置？**

- **`src/test/`** - 用於 Behave BDD 測試（功能測試），驗證 FastAPI 應用的整體行為
- **`test_isa_resolver.py`** - pytest 單元測試，專門測試 `isa_resolver.py` 這個 BDD 輔助模組本身

這是測試層次的分離：單元測試（測試工具）vs. 功能測試（測試應用）。

**快速執行**：

```bash
# 執行所有測試
cd benchmark/guessing_game/python
PYTHONPATH=src pytest test_isa_resolver.py -v

# 或使用 Makefile
make test-verbose

# 執行特定測試類別
PYTHONPATH=src pytest test_isa_resolver.py::TestVARSystem -v
PYTHONPATH=src pytest test_isa_resolver.py::TestCASSystem -v
PYTHONPATH=src pytest test_isa_resolver.py::TestTIMESystem -v

# 或使用 Makefile shortcuts
make test-var
make test-cas
make test-time
```

**測試覆蓋**：
- VAR-System: 5 tests（變數捕獲、儲存、引用）
- CAS-System: 9 tests（數值約束、變數參數、時間參數）
- TIME-System: 7 tests（now、相對時間、ISO 格式）
- Integration: 10 tests（複雜工作流程、& 字元處理）

### 已知限制

API 步驟生成的限制（繼承自 Java 版本）：

1. **參數位置符號限制**：
   - 支援：`P:id`（path）、`Q:page`（query）、`H:token`（header）
   - 不支援：`B:name`（body prefix）- body 參數不需要前綴

2. **陣列與巢狀物件**：
   - ✅ 支援：`items[0].name`、`result.a`
   - ⚠️ 限制：需要 OpenAPI schema 定義才能正確生成

**注意**：包含 `&` 字元的正常字串（如 "R&D Labs"）現已正確處理，不會被誤判為 CAS 約束。只有以 `&` 開頭且後接字母的字串（如 `&gt(10)`）才會被視為約束表達式。

---

## 📝 相關文件

### 專案文件
- **[CODEGEN_GUIDE.md](CODEGEN_GUIDE.md)** - CodeGen 詳細使用指南（環境設置、執行、驗證、問題排除）
- **[VAR_CAS_TIME_SYSTEMS.md](VAR_CAS_TIME_SYSTEMS.md)** - VAR/CAS/TIME 三大系統完整說明與範例

### 規格文件
- **[spec/api/api.yml](spec/api/api.yml)** - OpenAPI 規格（定義 API 端點）
- **[spec/data/schema.sql](spec/data/schema.sql)** - SQL DDL schema
- **[spec/entities/](spec/entities/)** - 實體規格（定義資料模型）

### ISA-Gherkin 規範
- **[VAR-System](../../../docs/spec-rules/isa-level-gherkin/gherkin-variable-system%20(VAR-System).md)** - 變數管理系統
- **[CAS-System](../../../docs/spec-rules/isa-level-gherkin/gherkin-constraint-assertion-system%20(CAS-System).md)** - 約束斷言系統
- **[TIME-System](../../../docs/spec-rules/isa-level-gherkin/gherkin-time-system%20(TIME-System).md)** - 時間轉換系統

---

## 📚 技術堆疊

### 核心框架
- **FastAPI** - 高效能 Web 框架
- **Behave ~= 1.3.3** - BDD 測試框架（原生支援 Scenario Outline + datatable）
- **SQLAlchemy ~= 2.0.23** - Python ORM

### 測試工具
- **python-jsonpath ~= 2.0.1** - JSONPath 回應驗證
- **httpx** - HTTP 客戶端（TestClient 使用）

### 程式碼生成
- **Jinja2** - 樣板引擎
- **gherkin-official** - Gherkin 解析器
- **PyYAML** - YAML 組態解析
