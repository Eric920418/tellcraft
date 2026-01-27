# ISA Config：產出 sdd.os ISA 配置檔案（Server Actions 版）

---
description: 根據 sdd.os ISA Feature Files（Server Actions 版）和專案架構，產出 ISA 配置檔案（isa_codegen.yml），讓 sdd.os 可自動生成測試程式碼。
---

## 目標

從 `spec/features/` 資料夾中的 sdd.os ISA Feature Files 和專案設定，產出 `isa_codegen.yml` 配置檔案，使 sdd.os 工具可以：
1. 解析 Feature Files 中的步驟定義
2. 生成對應的測試程式碼（Cucumber.js + Server Actions + Supabase）
3. 執行自動化功能測試

**核心目標：建立 sdd.os 與 Next.js Server Actions + Supabase 專案的整合配置。**

---

## 前置條件

本階段需要以下檔案已存在：
- `spec/data/schema.sql` - SQL DDL 定義
- `spec/data/entity_to_table_mapping.yml` - Entity 與表映射
- `spec/features/*.feature` - sdd.os ISA Gherkin 格式（Server Actions 版）
- `spec/actions/actions.yml` - Server Actions 規格

---

## 執行步驟

### 階段 1：分析 Feature Files 中的步驟類型

#### 1.1 識別所有步驟模式

掃描 `spec/features/` 中的所有 Feature Files，識別使用的步驟模式：

| 步驟模式 | 正規表示式 | 說明 |
|---------|-----------|------|
| Action 呼叫 | `^(?P<summary>.+?), call table:$` | When 步驟，呼叫 Server Action |
| 成功回應驗證 | `^(?P<summary>.+?)成功,?\s*with table:$` | Then 步驟，驗證成功回應 |
| 操作失敗 | `^操作失敗$` | Then 步驟，驗證操作失敗 |
| Entity 驗證 | `^存在一個(?P<entity>[\u4e00-\u9fffa-zA-Z]+), with table:$` | Then 步驟，驗證資料庫狀態 |
| 資料準備 | `^準備一個(?P<entity>[\u4e00-\u9fffa-zA-Z]+), with table:$` | Given 步驟，準備測試資料 |

#### 1.2 對應 Executor 類型

根據專案技術棧（Next.js Server Actions + Supabase），選擇適當的 Executor：

| 步驟模式 | Executor 類型 | 說明 |
|---------|--------------|------|
| Action 呼叫 | `cucumberjs_server_action` | 直接呼叫 Server Action 函數 |
| 成功回應驗證 | `skip` + Linter | 由 Action 呼叫步驟處理，使用 Linter 驗證格式 |
| 操作失敗 | `skip` | 由 Action 呼叫步驟處理 |
| Entity 驗證 | `supabase_entity` | 使用 Supabase Client 查詢資料庫 |
| 資料準備 | `supabase_setup` | 使用 Supabase Client 插入測試資料 |

---

### 階段 2：產出 isa_codegen.yml

#### 2.1 基本結構

```yaml
instructions:
  - name: <指令名稱>
    format: <正規表示式>
    step_type: <Given/When/Then>（可選）
    executor:
      type: <plugin/skip>
      plugin_python_path: <Executor 路徑>（若 type=plugin）
    linters:（可選）
      - python_plugin_path: <Linter 路徑>
        config:
          <配置項>
    constraints:（可選）
      - <限制條件>
    subpackage: <子套件名稱>
    situation: <情境說明>
```

#### 2.2 完整配置範本（Next.js Server Actions + Supabase）

```yaml
# isa_codegen.yml - sdd.os ISA 配置檔案
# 專案技術棧：Next.js Server Actions + Supabase + PostgreSQL

instructions:
  # ============================================
  # Given 步驟 - 資料準備
  # ============================================

  - name: Entity setup
    format: ^準備一個(?P<entity>[\u4e00-\u9fffa-zA-Z]+), with table:$
    step_type: Given
    executor:
      type: plugin
      plugin_python_path: <sdd_os_path>/src/sdd_os/features/executors/typescript/backend/setup/codegen/candidates/supabase_setup/executor.py
    constraints:
      - <entity> must be a valid entity defined in entity_to_table_mapping.yml
      - All column headers in the DataTable must be valid schema fields
    subpackage: given
    situation: to prepare test data in the database before Server Action calls

  # ============================================
  # When 步驟 - Server Action 呼叫
  # ============================================

  - name: Action call
    format: ^(?P<summary>.+?), call table:$
    step_type: When
    executor:
      type: plugin
      plugin_python_path: <sdd_os_path>/src/sdd_os/features/executors/typescript/backend/action_call/codegen/candidates/cucumberjs_server_action/executor.py
    subpackage: action
    situation: to invoke the Server Action with the given parameters

  # ============================================
  # Then 步驟 - 回應驗證
  # ============================================

  - name: Action success validation
    format: ^(?P<summary>.+?)成功,?\s*with table:$
    step_type: Then
    executor:
      type: skip
    linters:
      - python_plugin_path: <sdd_os_path>/src/isa_linters/plugins/extensions/action_response_validation/action_response_validation_linter.py
        config:
          actions_spec_path: spec/actions
    subpackage: then
    situation: to validate the Server Action success response using table

  - name: Operation failure
    format: ^操作失敗$
    step_type: Then
    executor:
      type: skip
    subpackage: then
    situation: to validate that the Server Action returned an error

  # ============================================
  # Then 步驟 - Entity 驗證
  # ============================================

  - name: Entity validate
    format: ^存在一個(?P<entity>[\u4e00-\u9fffa-zA-Z]+), with table:$
    step_type: Then
    executor:
      type: plugin
      plugin_python_path: <sdd_os_path>/src/sdd_os/features/executors/typescript/backend/validator/codegen/candidates/supabase_entity/executor.py
    constraints:
      - <entity> must be a valid entity defined in entity_to_table_mapping.yml
      - the entity's properties defined in the DataTable must match the entity spec
      - All column headers in the DataTable must be valid schema structure paths
    subpackage: then
    situation: to validate the entity in the database with the given parameters
```

#### 2.3 配置項說明

| 欄位 | 說明 | 範例 |
|------|------|------|
| `name` | 指令名稱，描述此步驟的用途 | `Action call` |
| `format` | 正規表示式，用於匹配步驟文字 | `^(?P<summary>.+?), call table:$` |
| `step_type` | 步驟類型（Given/When/Then） | `When` |
| `executor.type` | Executor 類型（plugin/skip） | `plugin` |
| `executor.plugin_python_path` | Executor Python 模組路徑 | `<path>/executor.py` |
| `linters` | Linter 配置列表（可選） | 見範例 |
| `constraints` | 限制條件列表（可選） | 見範例 |
| `subpackage` | 生成程式碼的子套件目錄 | `action`, `then`, `given` |
| `situation` | 情境說明，描述此步驟的執行時機 | `to invoke the Server Action...` |

---

### 階段 3：驗證配置

#### 3.1 步驟覆蓋檢查

確保 Feature Files 中的所有步驟都有對應的配置：

```
檢查清單：
[ ] 每個 When 步驟都匹配 Action call 格式
[ ] 每個成功 Then 步驟都匹配 Action success validation 格式
[ ] 每個失敗 Then 步驟都匹配 Operation failure 格式
[ ] 每個 Entity 驗證步驟都匹配 Entity validate 格式
[ ] 每個資料準備步驟都匹配 Entity setup 格式
```

#### 3.2 Entity 對應檢查

確保所有 Entity 名稱都在 `entity_to_table_mapping.yml` 中定義：

```
檢查清單：
[ ] Feature Files 中的 Entity 名稱與 mapping 一致
[ ] DataTable 欄位名稱與 schema.sql 一致
```

#### 3.3 Action Summary 對應檢查

確保所有 Action summary 都在 `spec/actions/actions.yml` 中定義：

```
檢查清單：
[ ] Feature Files 中的 summary 與 actions.yml summary 一致
[ ] Action 函數名稱與 Feature 註解中的 Action name 一致
```

---

## 輸出格式要求

### 檔案結構

```
project/
├── spec/
│   ├── data/
│   │   ├── schema.sql
│   │   └── entity_to_table_mapping.yml
│   ├── features/
│   │   └── *.feature
│   └── actions/
│       └── actions.yml
├── isa_codegen.yml              # 本階段產出
└── src/
    └── tests/
        └── features/            # sdd.os 生成的測試程式碼目錄
```

### 路徑配置

根據 sdd.os 安裝位置，調整 `plugin_python_path`：

```yaml
# 若 sdd.os 在 /Users/eric/Desktop/sdd.os
executor:
  type: plugin
  plugin_python_path: /Users/eric/Desktop/sdd.os/src/sdd_os/features/executors/typescript/backend/action_call/codegen/candidates/cucumberjs_server_action/executor.py

# 若使用相對路徑（專案在 sdd.os/benchmark 下）
executor:
  type: plugin
  plugin_python_path: ../../../src/sdd_os/features/executors/typescript/backend/action_call/codegen/candidates/cucumberjs_server_action/executor.py
```

---

## 行為規則

### 設計階段規則
1. **完整覆蓋**：確保所有步驟模式都有對應的配置
2. **正規表示式精準**：format 必須精確匹配 sdd.os ISA 格式（Server Actions 版）
3. **路徑正確**：Executor 和 Linter 路徑必須指向有效的 Python 模組
4. **Entity 一致**：Entity 名稱必須與 `entity_to_table_mapping.yml` 一致

### 禁止事項
1. 不要遺漏任何步驟類型的配置
2. 不要使用不存在的 Executor 類型
3. 不要硬編碼絕對路徑（使用相對路徑或環境變數）
4. 不要在 format 中使用無效的正規表示式

---

## 與其他 Prompt 的關係

- **前置階段**：
  1. `formulation.md` - 已產出 `spec/data/` 和 `spec/features/`
  2. `actions-design.md` - 已產出 `spec/actions/actions.yml`
- **本階段角色**：ISA 配置階段，產出 sdd.os 的配置檔案
- **後續階段**：`automation-ts.md` - 使用 sdd.os 生成測試程式碼，開發 Next.js Server Actions 應用

**工作流程**：
```
formulation.md → actions-design.md → isa-config.md → automation-ts.md
     ↓                 ↓                  ↓               ↓
spec/data/        spec/actions/     isa_codegen.yml   可部署應用
spec/features/     actions.yml                        + 測試程式碼
(sdd.os ISA)
```

---

## 完成標準

任務完成必須滿足以下所有條件：

**配置產出：**
- [ ] `isa_codegen.yml` 檔案已建立
- [ ] YAML 語法正確無誤
- [ ] 所有步驟模式都有對應的 instruction

**步驟覆蓋：**
- [ ] Action 呼叫（When）配置完成
- [ ] 成功回應驗證（Then）配置完成
- [ ] 操作失敗（Then）配置完成
- [ ] Entity 驗證（Then）配置完成
- [ ] 資料準備（Given）配置完成

**路徑驗證：**
- [ ] 所有 `plugin_python_path` 指向有效檔案
- [ ] `actions_spec_path` 正確指向 `spec/actions`

**整合驗證：**
- [ ] Entity 名稱與 `entity_to_table_mapping.yml` 一致
- [ ] Action summary 與 `spec/actions/actions.yml` 一致
