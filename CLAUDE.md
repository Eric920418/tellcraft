# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

這是一個 **AI x BDD 規格驅動開發 Agent Skill**，專注於：
- 從自然語言需求識別歧義與遺漏
- 與用戶迭代式釐清問題
- 產出完整的 BDD 規格（ERM + sdd.os ISA Feature Files）

**不負責**：應用程式開發、測試程式碼撰寫、部署配置

## 常用指令

```bash
# ISA Format Lint（確保 Regex 相容）- Formulation 後第一步
npx ts-node prompts/scripts/lint-gherkin-format.ts spec/features/

# 結構驗證（確保完整性）- lint 通過後第二步
npx ts-node prompts/scripts/validate-feature.ts spec/features/

# JSON 輸出（供程式解析）
npx ts-node prompts/scripts/lint-gherkin-format.ts spec/features/ --json
npx ts-node prompts/scripts/validate-feature.ts spec/features/ --json

# 嚴格模式（警告也視為錯誤）
npx ts-node prompts/scripts/validate-feature.ts spec/features/ --strict

# 自動修復格式問題（實驗性）
npx ts-node prompts/scripts/lint-gherkin-format.ts spec/features/ --fix
```

## 架構結構

```
prompts/
├── skill.md                    # [L0] 元數據入口 - Skill 觸發條件與 Schema 定義
├── instructions/               # [L1] 執行指南
│   ├── 01-discovery.md         #      發現階段：識別規格歧義與遺漏
│   ├── 02-clarify.md           #      釐清階段：與用戶互動釐清問題
│   ├── 03-formulation.md       #      規格表達：產出 ERM + Feature Files
│   ├── 04-actions-design.md    #      (可選) Actions 設計
│   └── 05-isa-config.md        #      (可選) ISA 配置
├── rules/
│   └── formulation-rules.md    # sdd.os ISA Gherkin 格式規範
├── scripts/                    # Quality Gate 腳本
│   ├── lint-gherkin-format.ts  #      ISA Format Linter（確保 Regex 相容）
│   └── validate-feature.ts     #      結構驗證（確保完整性）
└── resources/                  # 模板與範例
    ├── templates/
    └── examples/
```

## 工作流程

### Phase 1: 迭代式釐清（2-5+ 輪）
Discovery → Clarify → (循環直到所有問題釐清)

**迭代終止條件**：
- `.clarify/overview.md` 中 Open 項目數為 0
- 連續兩輪 Discovery 未發現新問題
- 用戶明確表示「開始下一階段」

### Phase 2: 規格產出
產出：
- `spec/data/schema.sql` - SQL DDL 定義
- `spec/data/entity_to_table_mapping.yml` - Entity 中英文對應
- `spec/features/*.feature` - sdd.os ISA Gherkin 格式

## sdd.os ISA Gherkin 格式（Server Actions 版）

| 格式 | 說明 | 範例 |
|------|------|------|
| Action 呼叫 | `{summary}, call table:` | `建立訂單, call table:` |
| 成功回應 | `{summary}成功, with table:` | `建立訂單成功, with table:` |
| 操作失敗 | `操作失敗` | 錯誤情境時使用 |
| Entity 驗證 | `存在一個{entity}, with table:` | `存在一個訂單, with table:` |
| 資料準備 | `準備一個{entity}, with table:` | `準備一個商品, with table:` |

## 驗證錯誤代碼

| 代碼 | 說明 |
|------|------|
| E001 | 缺少 Action 註解 |
| E002 | 缺少 Summary 註解 |
| E003 | 缺少 Feature 宣告 |
| E004 | Summary 與 Feature 名稱不一致 |
| E005 | Rule 缺少前置/後置標註 |
| E006 | When 步驟格式錯誤（不符合 ISA Regex） |
| E008 | 沒有 Example |

## 核心原則

1. **無腦補原則**：嚴格遵守規格，不擅自假設或補充
2. **sdd.os ISA 格式**：Feature 與 Server Action 明確對應
3. **summary 一致**：Action summary 必須與 Feature 名稱一致
4. **前置/後置標註**：每個 Rule 都必須標註
5. **硬性閘門**：Quality Gate 由腳本強制執行
6. **自我修復**：腳本失敗時進入修正迴圈（最多 3 次）

## 狀態檔案結構

```
.clarify/
├── overview.md           # 主狀態檔 - 每輪必讀必更新
├── data/                 # 待處理的資料模型釐清項目
├── features/             # 待處理的功能模型釐清項目
├── staging/              # 暫存區（已回答但未確認）
└── resolved/             # 已確認歸檔的釐清項目
```
