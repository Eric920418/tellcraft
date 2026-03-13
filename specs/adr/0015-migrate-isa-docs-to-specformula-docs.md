# ISA 規格白皮書遷移至 specformula-docs 統一維護

# Context

- 本 ADR 記錄將 ISA 規格白皮書從 `specs/isa/` 遷移至 `specformula-docs` submodule 統一維護的決策。

## Problem

- ISA 規格白皮書原本維護在 `specs/isa/` 目錄中（純 Markdown 檔案），同時 `specformula-docs`（基於 Next.js + Fumadocs 的文件網站）也已涵蓋完整的 ISA 文件（instructions、symbols、config），形成兩份來源重複維護的狀態。當規格更新時，需要同時修改兩處，容易造成內容不一致。

## Forces

1. **單一事實來源（Single Source of Truth）**：同一份規格文件不應在兩處維護，否則隨著迭代必然出現版本分歧
2. **文件網站已具備完整內容**：`specformula-docs` 已包含所有 ISA instructions（ApiCall、EntitySetup、EntityValidate、EntityNonExistenceValidate、ResponseValidate、TimeControl）、symbols（VAR、CAS、TIME）和 config 文件，且支援中英雙語
3. **可讀性與可存取性**：文件網站提供結構化導覽、搜尋功能和更好的閱讀體驗，優於 repo 內的純 Markdown 文件

# Solution

## 解法摘要

- 移除 `specs/isa/` 目錄，以 `specformula-docs` submodule 作為 ISA 規格白皮書的唯一維護來源。更新 repo 內的 README 引用，統一指向 `specformula-docs`。

## 解法設計

### 變更內容

| 項目 | 操作 | 說明 |
|------|------|------|
| `specs/isa/` | 刪除 | 移除整個目錄（SpecReaderConfig.md、instructions/、symbols/） |
| `specformula-docs/` | 新增 submodule | 指向 `https://github.com/SpecFormula/specformula-docs` |
| `specs/README.md` | 修改 | 移除 ISA 文件索引，改為指向 specformula-docs |
| `README.md` | 修改 | 更新目錄結構表與 ISA 段落，指向 specformula-docs |

### 遷移對照

| 原路徑 (`specs/isa/`) | 新路徑 (`specformula-docs/content/docs/`) |
|---|---|
| `SpecReaderConfig.md` | `gherkin/isa/backend/config.mdx` |
| `instructions/ApiCall.md` | `gherkin/isa/backend/instructions/api-call.mdx` |
| `instructions/EntitySetup.md` | `gherkin/isa/backend/instructions/entity-setup.mdx` |
| `instructions/EntityValidate.md` | `gherkin/isa/backend/instructions/entity-validate.mdx` |
| `instructions/EntityNonExistenceValidate.md` | `gherkin/isa/backend/instructions/entity-non-existence-validate.mdx` |
| `instructions/ResponseValidate.md` | `gherkin/isa/backend/instructions/response-validate.mdx` |
| `instructions/TimeControl.md` | `gherkin/isa/backend/instructions/time-control.mdx` |
| `symbols/VAR.md` | `gherkin/isa/backend/symbols/var.mdx` |
| `symbols/CAS.md` | `gherkin/isa/backend/symbols/cas.mdx` |
| `symbols/TIME.md` | `gherkin/isa/backend/symbols/time.mdx` |

# Resulting Context

## Pros

- ISA 規格白皮書回歸單一事實來源，消除重複維護的風險
- 文件更新只需在 `specformula-docs` 一處進行，降低維護成本
- 使用者可透過文件網站獲得更好的閱讀與搜尋體驗

## Cons

- 開發者查閱 ISA 規格時需進入 `specformula-docs` submodule 或文件網站，而非直接在 `specs/` 目錄下瀏覽
- submodule 需要額外的 `git submodule update` 操作來同步最新文件
