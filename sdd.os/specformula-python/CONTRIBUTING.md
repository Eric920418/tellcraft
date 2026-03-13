# 貢獻指南

本文件說明如何參與 SpecFormula Python 開發。

## 專案結構

本專案為 Python Monorepo，使用 [uv workspace](https://docs.astral.sh/uv/concepts/workspaces/) 管理。所有套件位於 `packages/` 目錄下。

```
specformula-python/
├── packages/
│   └── specformula-core/      # 核心框架套件
├── pyproject.toml            # Workspace 根目錄設定
└── ruff.toml                 # 程式碼檢查設定
```

## 套件命名空間

**重要：** 所有套件必須使用 `specformula` 命名空間，以避免與外部套件發生匯入衝突。

### 建立新套件

新增套件（如 `packages/specformula-http/`）時，請遵循以下步驟：

1. 在 `packages/` 下建立套件目錄
2. 建立命名空間套件結構：

```
packages/specformula-http/
└── src/
    └── specformula/           # 命名空間套件（空 __init__.py）
        └── http/              # 實際套件程式碼
            ├── __init__.py
            └── py.typed       # 標記此套件帶有型別
```

3. 在根目錄的 `pyproject.toml` 中設定：

```toml

[tool.uv.sources]
specformula-http = { workspace = true } # 新增套件

[project]
dependencies = [
    "specformula-core",
    "specformula-http",  # 新增套件
]
```

4. 建立套件層級的 `pyproject.toml`：

```toml
[project]
name = "specformula-http"
version = "0.1.0.a1"
description = "Description of the package"
readme = "README.md"
requires-python = ">=3.10"
dependencies = []

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/specformula"]

```

## 開發環境設定

### 使用 uv

請參考 [uv 安裝說明](https://docs.astral.sh/uv/getting-started/installation/)。

```bash
# 安裝依賴
cd specformula-python
uv sync --group dev
```

### 使用 pip（pip 25.1+）

```bash
# 建立虛擬環境
cd specformula-python
python -m venv .venv

# 啟用虛擬環境
# Linux/macOS
source .venv/bin/activate
# Windows
.venv\Scripts\activate

# 安裝專案及開發依賴（需 pip 25.1+）
pip install -r .\requirements.txt -e . --group dev
```

## 程式碼規範

本專案遵循以下 Python Enhancement Proposal (PEP) 標準：

| PEP                                          | 說明               |
| -------------------------------------------- | ------------------ |
| [PEP 420](https://peps.python.org/pep-0420/) | 隱式命名空間套件   |
| [PEP 561](https://peps.python.org/pep-0561/) | 分發帶有型別的套件 |

- **程式碼檢查與格式化：** 本專案使用 [Ruff](https://docs.astral.sh/ruff/)。提交前請執行：

  ```bash
  # 使用 uv（推薦）
  uv run --group dev ruff check .
  uv run --group dev ruff format .

  # 使用 pip
  ruff check .
  ruff format .
  ```

- **文件註解：** 所有公開 API 必須使用**英文**撰寫 docstring。
- **型別提示：** 函式簽章必須包含 Python 型別提示。
- **術語精確性：** 若涉及 Python 專業術語之使用，請確保符合 [Python 官方術語表 (Glossary)](https://docs.python.org/zh-tw/3/glossary.html) 之定義（例如：引數 Argument、參數 Parameter、對映 Mapping、屬性 Attribute 等）。

## 測試

```bash
# 使用 uv 執行所有測試（推薦）
uv run --group dev pytest

# 使用 pip 執行測試
pytest
```
