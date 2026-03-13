# ADR (Architecture Decision Records)

1. 有些功能的優化涉及到架構上的重構，此時 SDD.os 的維護者會請你撰寫一份架構決策紀錄 ADR (Architecture Decision Records)。

2. 此目錄用來存放架構決策記錄（ADR）。

3. 你的 ADR 文件必須被放進實際執行這項程式改動的 commit 中，或者至少在同個 PR 中（才能一起被 squash & merge)。

# 標準

- **命名建議**：`NNNN-<kebab-case-title>.md`（例如：`0001-use-foo-for-bar.md`）
- **建立方式**：複製 `0000-adr-template.md` 後修改內容與編號
