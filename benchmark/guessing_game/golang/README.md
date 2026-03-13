> [!CAUTION]
> **DEPRECATED**: 本文件中「CodeGen」相關章節引用了已移除的 sdd.os Python codegen 框架（PR #180）。
> `pip install` 等指令已無法使用。本文件保留作為歷史參考。

# 1A2B 猜數字遊戲 - Golang Benchmark

這是 SDD.OS 的 Golang benchmark 範例，展示如何使用規格驅動開發（Spec-Driven Development）從 Gherkin 規格自動產生 BDD 測試程式碼，並使用 AI 輔助實作出，可通過 BDD 測試的 1A2B 猜數字遊戲 API 後端程式碼。

註：目前 executor type 僅使用 plugin 

## 專案概述

這個 benchmark 實作了經典的 1A2B 猜數字遊戲，**展示 SDD.OS 如何結合 Codegen (executor type 使用 plugin) 與 AI，從規格到可執行程式碼的全自動化開發流程**。

**技術堆疊**：
- **BDD 框架**：godog（Golang 版本的 Cucumber）
- **API 測試**：httpexpect
- **ORM**：GORM
- **測試程式碼生成**：SDD.OS Codegen 產生測試程式碼初版框架
- **業務邏輯生成**：AI（cluade_code, codex_cli, gemini_cli 等）

**開發流程**：
1. 撰寫 Gherkin 規格和 OpenAPI/Entity spec
2. SDD.OS Codegen 自動產生測試程式碼
3. AI 閱讀規格和測試，自動實作業務邏輯
4. 執行 BDD 測試驗證實作正確性

**AI Prompts**：
- `prompts/dev/do-implement.md`：給 AI provider 的實作指令，引導 AI 如何實作後端程式碼
- `prompts/dev/now-implement-system.md`：給 AI 的系統層級實作提示，協助 AI 理解整體架構與實作策略

這些 prompts 會被 `sdd.cli` 在執行階段載入，作為 AI 實作程式碼時的指引。

## 目錄結構

```
golang/
├── src/
│   └── tests/
│       ├── features/           # Gherkin 規格檔案
│       │   ├── 玩家加入遊戲.feature
│       │   ├── 玩家設定秘密.feature
│       │   └── 玩家猜測數字.feature
│       └── stepdefs/           # 測試步驟定義（codegen 產生）
│           ├── step_玩家加入遊戲.go
│           ├── step_玩家設定秘密.go
│           ├── step_玩家猜測數字.go
│           ├── step_存在一個玩家.go
│           ├── step_存在一個遊戲.go
│           ├── utils.go              # 共用工具函式
│           ├── scenario_context.go   # 情境上下文
│           └── godog_test.go        # 測試執行入口
├── spec/
│   ├── api/
│   │   └── api.yml             # OpenAPI 規格
│   └── entities/               # 實體規格
│       ├── 玩家.yml
│       └── 遊戲.yml
├── prompts/
│   └── dev/                    # AI 實作階段的 prompts (sdd.sh 參數)
│       ├── do-implement.md
│       └── now-implement-system.md
├── isa_codegen.yml             # Codegen 指令架構定義
├── assembler_codegen.sh        # Codegen 執行腳本
├── bdd_gotest.sh              # BDD 測試執行腳本
├── sdd.sh                     # 完整 SDD 流程腳本
└── README.md                  # 本文件
```

## 前置需求

### 必要工具

- **Python 3.10+**：執行 SDD.OS codegen
- **Go 1.21+**：編譯和執行 Golang 測試程式碼
- **Git**：版本控制

### Python 套件

```bash
# 在專案根目錄安裝 SDD.OS
pip install -e .
```

## 執行 benchmark 步驟

使用 `sdd.sh` 一鍵執行完整的 SDD 流程：

```bash
cd benchmark/guessing_game/golang
bash sdd.sh
```

這個腳本會依序執行：
1. **Codegen**：從 Gherkin 規格產生初版的測試程式碼
2. 顯示產生的檔案
3. 執行 `sdd.cli`，使用 AI 自動
  - 實作: 後端程式的程式碼
  - 實作: 補齊 BBD 測試程式碼
  - 執行測試: 驗證後端實作正確性
