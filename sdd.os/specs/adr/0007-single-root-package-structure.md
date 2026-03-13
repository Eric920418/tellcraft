# 0007-single-root-package-structure

# Context

- 本 ADR 針對 sdd-os 專案在安裝至 Python 環境時的物理佈局做出規範。

## Problem

- 當使用 `pip install .` 安裝專案時，`src/` 下的所有資料夾會直接放置在 `site-packages/`。
- 這會導致以下問題：
    - 名稱空間污染 (Namespace Pollution)：通用的名稱（如 `features`）極易與其他第三方庫產生衝突。
    - 覆蓋風險：若其他套件也採取類似結構，安裝時會發生檔案覆蓋。
    - 管理困難：無法一眼看出哪些套件屬於 `sdd-os` 專案。

## Forces

1. 套件管理規範 (Standardization)：著名的 Python CLI 工具（如 `black`, `poetry`, `pip`）通常會將所有代碼包裝在與專案名稱相關的單一資料夾下。
2. 安裝隔離性 (Isolation)：專案程式碼應在 `site-packages` 中擁有獨立的命名空間。
3. 路徑一致性：CLI 進入點與業務邏輯的引用路徑應保持穩定且具備可預測性。
4. 環境相容性與名稱空間安全性 (Environment Compatibility & Namespace Safety)：`sdd-os` 定位為開發輔助工具，必須確保安裝至使用者環境時，其模組名稱（如 `features`, `parsers`）絕不會與使用者既有的第三方套件產生衝突，以維持系統的穩定性。
5. 建置工具鏈的維護成本 (Build Tooling Maintenance)：現代 Python 建置後端（如 Hatchling）依賴明確的目錄結構來自動化打包流程。
6. AI 代理的識別精準度 (AI Agent Precision)：在全自動化開發場景下，AI 必須能透過 `import` 語句唯一且不具歧義地識別專案內部模組。

# Solution

## 解法摘要

- 維持當前的 src-layout 並改成單一根套件 (Single Root Package)。
- 將所有模組移入 `src/sdd_os/` (名稱與 `pyproject.toml` 中的 `project.name` 保持一致，但將連字號 `-` 替換為底線 `_`)。

## 解法設計

### 1. 調整後的目錄結構

```
src/sdd_os/
├── __init__.py
├── ai_apis/             # 原 src/sdd_os/ai_apis/
├── ai_providers/        # 原 src/sdd_os/ai_providers/
├── assembly/            # 原 src/sdd_os/assembly/
├── features/            # 原 src/sdd_os/features/
├── gherkin_spec/        # 原 src/sdd_os/gherkin_spec/
├── isa_linters/         # 原 src/sdd_os/isa_linters/
├── parsers/             # 原 src/sdd_os/parsers/
└── sdd/                 # 原 src/sdd_os/sdd/
```

### 2. 引用路徑變更

- 所有內部引用必須從根套件開始（或使用相對引用）：
    - `from sdd_os.isa_linters import ...`
    - `from sdd_os.assembly import ...`

# Resulting Context

## Pros

- 避免衝突：在 `site-packages` 中佔用單一命名空間，大幅降低與其他套件衝突的風險。
- 結構專業：符合主流 Python 開源專案的標準佈局。
- 方便打包：建置工具（如 `hatch`, `setuptools`）能更精準地識別需要包含的檔案。

## Cons

- 大規模重構開銷：需要修改全專案（包含 `tests/`）的 `import` 語句和文件與Script內容。
- Git 歷史追蹤：大規模的檔案移動與內容變更可能使 Git 的歷史追蹤變得較不直觀。
- 引用路徑變長：開發者在撰寫絕對引用時需要輸入較長的完整路徑。

# 其他可能解法

## 1. 使用 Flat Layout (直接將套件放在根目錄)
- **Pros**: 結構簡單，少一層目錄。
- **Cons**: 容易將非套件檔案（如 `README.md`）誤裝入 `site-packages`，且測試時可能意外引用到開發環境中的程式碼而非已安裝的套件。

## 2. 保持現狀 (多個頂層套件)
- **Pros**: 不需要進行大規模重構。
- **Cons**: 存在嚴重的名稱空間衝突風險，不符合專業 Python 套件的發佈標準。
