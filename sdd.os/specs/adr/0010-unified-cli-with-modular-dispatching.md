# 中央調度器與模組契約制 (Central Dispatcher with Module Contract)

# Context

- 本 ADR 針對 `sdd.os` 專案的功能整合需求，提案建立統一的 CLI 進入點，並配合模組化架構優化 CLI 的擴充能力。

## Problem

- 專案目前存在多個碎片的 CLI 進入點（`isa-lint`, `sdd`, `gherkin_runner`），導致：
  - **維護困難**：基礎設施（如 Logo 顯示、日誌初始化、AI Provider 配置）重複實作。
  - **體驗不一**：使用者需記住多個不同指令，且介面風格不統一。
  - **邊界模糊**：缺乏統一的 CLI 指令註冊規範，導致 CLI 邏輯與業務邏輯邊界模糊。

## Forces

1. **單一進入點 (Single Entry Point)**：使用者只需記住 `sddos` 唯一指令。
2. **啟動效能 (Startup Performance)**：必須確保子指令眾多時，`--help` 的響應速度不受重型業務依賴或複雜的參數註冊邏輯（如插件掃描、路徑驗證）影響。
3. **框架彈性 (Framework Agnostic)**：目前使用 `argparse`，但規範應允許未來能以低成本遷移至 `Typer` 或 `Click`。
4. **AI 友善性 (AI-Friendly)**：指令實作物理拆分，避免出現 God File，方便 AI 精準定位修改。

# Solution

## 解法設計

採用「中央調度器 (Dispatcher)」配合「模組契約 (Module Contract)」的模式。本架構透過將**指令宣告 (Declaration)**與**參數註冊 (Registration)**物理分離，達成極速的預解析 (Pre-parsing) 與延遲註冊 (Lazy Registration)。本架構要求 CLI 相關定義（Models, Validators, UI）無論在核心層或業務模組層，皆應遵循對齊的 `cli_defs/` 目錄結構，以達成視覺與邏輯上的高度一致。

### 1. 物理結構規範

```text
src/sdd_os/
├── cli/                    # CLI 核心調度層 (強制的)
│   ├── __main__.py         # 支援 python -m sdd_os.cli 呼叫
│   ├── dispatcher.py       # 負責指令註冊、分發與生命週期管理
│   └── cli_defs/           # CLI 核心定義 (全域性質，強制)
│       ├── protocols.py    # 定義 SubCommand 的行為協定 (Protocol)
│       ├── models.py       # 定義 GlobalArgs 與 CommandContext (dataclass)
│       ├── ui.py           # 負責視覺呈現 (Logo, Colors) 與終端互動 (UI)
│       └── validators.py   # 通用的參數校驗器
│
├── <module_name>/          # 業務模組 (如 isa_linters, sdd)
│   ├── commands.py         # 實作協定的指令進入點 (實作註冊與執行)
│   └── cli_defs/           # 模組內部的 CLI 定義 (選配，參考核心 cli_defs 結構)
```

### 2. 模組重構與歸併 (Module Consolidation)

為了配合 CLI 的邏輯分組並優化內部的封裝結構，進行以下物理結構調整：

- **gherkin_spec 歸併**：將原有的 `src/sdd_os/gherkin_spec/` 遷移至 `src/sdd_os/assembly/gherkin/`。
- **語意對齊**：這確保了 `sddos assembly --gherkin` 的指令邏輯與物理套件 (package) 結構達成語意上的一致性，並強化了 `assembly` 作為功能聚合層的角色。

### 3. 行為協定 (protocols.py)

各業務模組的 `commands.py` 必須符合以下協定，以支援分階段解析：

- **`command_declare(subparsers, parent_parser, add_help=True) -> ArgumentParser`**:
  - **輕量宣告**：僅負責呼叫 `subparsers.add_parser()` 並回傳得到的解析器物件。
  - **效能關鍵**：此函式嚴禁執行任何耗時邏輯（如檔案掃描）。
  - **Help 穿透**：必須接受並轉發 `add_help` 參數給 `add_parser`，以支援預解析階段的 Help 穿透。
- **`command_register(subparsers, parent_parser, add_help=True) -> None`**:
  - **完整註冊**：負責定義該指令的所有詳細參數。
  - **實作規範**：內部應首先呼叫 `parser = self.command_declare(subparsers, parent_parser, add_help=add_help)` 取得解析器，再對其進行 `add_argument`。
- **`command_execute(ctx: CommandContext) -> int`**:
  - **執行邏輯**：負責執行業務邏輯。此函式內部應採用 Local Import 載入重型業務依賴。

### 4. 資料包裝 (models.py)

- **`GlobalArgs`**: 包含所有指令皆通用的最小參數集：
  - `log_level: LogLevel` (Enum: DEBUG, INFO, WARNING, ERROR)
  - `verbose: bool` (快捷開關，開啟時 log_level 強制設為 DEBUG)
  - **互斥政策**：`--log-level` 與 `--verbose` 為互斥關係，確保日誌配置的唯一性與直覺性。
- **`CommandContext`**:
  - `global_args: GlobalArgs` (強型別全域參數)
  - `args: Namespace` (原始參數，包含子指令專屬參數如 `workspace`)
  - `logger: logging.Logger` (預先配置好的日誌物件)

### 5. 解析與分發流程 (Two-Pass Dispatching with Global Merge)

為了在不犧牲 UX 的前提下達成極速啟動，且確保全域參數在任何位置皆有效，`Dispatcher` 執行以下流程：

1. **Lite Pass (預解析階段)**：
   - 建立一個 `Lite Parser` (`add_help=False`)。
   - 對註冊的所有指令僅呼叫 `command_declare(add_help=False)`。
   - 使用 `parse_known_args()` 識別使用者真正要執行的子指令名稱（`subcommand_name`）。
   - **目的**：快速定位指令，且 `-h` 參數不會在此階段被攔截。

2. **Full Pass (最終解析階段)**：
   - 根據第一階段識別出的指令名稱，建立 `Real Parser` (`add_help=True`)。
   - 對**當前活動指令**呼叫 `command_register()`，其餘指令維持 `command_declare()`。
   - 執行 `parse_args()`。

3. **Global Merge (強制合併階段)**：
   - 使用 `base_parser.parse_known_args()` 再次獨立解析 `argv` 以捕捉所有全域參數。
   - 將捕捉到的全域參數強制覆蓋回最終的 `Namespace`。
   - **目的**：解決 `argparse` 子解析器會用預設值覆蓋掉位於子指令前之全域參數的問題，達成真正的位置無關性（Position Independence）。

4. **分發執行**：封裝 `CommandContext` 並調用對應模組之 `command_execute`。

### 6. 整合目標範例 (Planned Command Structure)

預計遷移後的指令對應如下：

- **`sddos assembly --gherkin`**: 負責執行 Gherkin 規範組裝（原 `gherkin_runner` 功能）。
- **`sddos lint`**: 負責 ISA 規範檢查（原 `isa-lint` 功能）。
- **`sddos tdd`**: 負責執行全自動開發循環（原 `sdd` 功能）。

## Resulting Context

## Pros

- **高度解耦**：業務模組不需理會 CLI 的初始化細節（如日誌配置、Logo 顯示）。
- **極速回應**：延遲載入機制確保即使擁有數十個子指令，`--help` 仍能瞬間響應。
- **型別安全**：全域參數透過 dataclass 轉發，具備 IDE 提示與編譯期檢查能力。
- **偵錯透明化**：當日誌等級設為 `DEBUG` 時，調度器會自動輸出 `CommandContext` 的完整內容，大幅降低參數解析問題的排查難度。
- **遷移容易**：由於不硬性綁定 Class 繼承，未來轉向 `Typer` 或 `Click` 時僅需調整 `command_register` 的實作內容。

## Cons

- **缺乏編譯期強制性**：鴨子類型契約依賴開發者自律或靜態檢查工具。
- **樣板代碼**：每個模組需遵循特定的目錄結構與 `commands.py` 命名規範。

## 兼容性與過渡策略 (Compatibility)

為了在不破壞現有工作流（如 CI 腳本、Benchmark）的前提下測試新版 CLI，本架構支持將原有獨立指令與模組轉化為「代理進入點 (Proxy Entry Point)」。**請注意，這些代理路徑僅為過渡期方案，最終目標是將其完全移除，僅保留 `sddos` 作為唯一的官方進入點。**

1. **指令與模組代理對應**：
   - **Entry Point `isa-lint`**：代理至 `sddos lint`。
   - **模組 `sdd_os.sdd.cli`** (常用於 `python -m`)：保留原路徑，其內部邏輯代理至 `sddos tdd`。
   - **模組 `sdd_os.gherkin_spec.gherkin_runner`** (常用於 `python -m`)：保留原路徑，其內部邏輯代理至 `sddos assembly --gherkin`。

2. **自動導向實作**：上述進入點與模組將轉化為簡潔的代理層。其內部會透過修改 `sys.argv` (於第一個參數插入對應的子指令名稱) 後，調用中央 `dispatcher:entry_point`。

3. **優點**：確保現有的 `python -m` 呼叫方式與獨立指令皆能無縫運作，同時讓所有執行路徑實質上都經過新版 CLI 核心，達成完整的壓力測試與架構過渡。

## 驗證與可測性 (Verification and Testability)

為確保架構的穩定性與部署的正確性，本設計遵循以下測試原則：

### 1. 進入點與代理模組驗證

為確保所有呼叫路徑皆能正確導向，測試應涵蓋以下兩種模式：

- **指令進入點 (Console Scripts)**：使用 `importlib.metadata.entry_points` 驗證 `sddos` 指令是否正確指向 `sdd_os.cli.dispatcher:entry_point`。
- **相容性代理模組 (Module Proxies)**：針對 `python -m` 呼叫路徑，驗證其是否能正確加載並成功導向至中央調度器。
- **新架構實作校驗**：驗證各業務模組的 `commands.py` 是否正確註冊並符合 `SubCommand` 協定。
- **行為模擬**：利用 `runpy.run_module` 模擬 `-m` 執行行為，驗證這些代理模組是否能正確將參數傳遞至中央調度器，並達成預期的執行結果。

### 2. 指令邏輯的單元測試

由於 `command_execute` 接受 `CommandContext` 物件，測試時可透過模擬 (Mock) 該上下文對象，在不啟動真實 CLI 解析器的情況下，直接對業務進入點進行純邏輯測試。

### 3. 協定合規性自動掃描

可透過測試程式自動掃描各模組下的 `commands.py`，確保其皆正確實作 `SubCommand` 協定所要求的介面函式。

# 其他可能解法

### 1. 基類硬性繼承 (Hard Class Inheritance)

- **Pros**: 可以透過 `isinstance` 強制檢查。
- **Cons**: 會與 `argparse` 的 `set_defaults` 邏輯產生衝突，且未來遷移框架時類別層級結構會成為阻礙。

### 2. 動態反射註冊 (Dynamic Auto-discovery)

- **Pros**: 自動掃描資料夾，開發者無需手動註冊。
- **Cons**: 隱含邏輯過多，可能導致 AI 難以追蹤指令來源，且啟動時的掃描開銷較大。
