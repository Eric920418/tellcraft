# ISA Config：產出 sdd.os ISA 配置檔案（SpecFormula 標準）

---
description: 根據 sdd.os ISA Feature Files（SpecFormula 標準）和專案架構，產出 ISA 配置檔案（isa.yml），讓 sdd.os 可自動生成測試程式碼。
---

## 目標

從 `spec/features/` 資料夾中的 sdd.os ISA Feature Files 和專案設定，產出 `isa.yml` 配置檔案，使 sdd.os 工具可以：
1. 解析 Feature Files 中的步驟定義
2. 生成對應的測試程式碼（SpecFormula TS + API Routes + Neon PostgreSQL）
3. 執行自動化功能測試

**核心目標：建立 sdd.os SpecFormula 與 Next.js API Routes + Neon PostgreSQL 專案的整合配置。**

---

## 前置條件

本階段需要以下檔案已存在：
- `spec/data/schema.sql` - SQL DDL 定義
- `spec/data/entity_to_table_mapping.yml` - Entity 與表映射
- `spec/features/*.feature` - sdd.os ISA SpecFormula 標準格式
- `spec/actions/actions.yml` - Server Actions 規格

---

## 執行步驟

### 階段 1：分析 Feature Files 中的步驟類型

#### 1.1 識別所有步驟模式

掃描 `spec/features/` 中的所有 Feature Files，識別使用的步驟模式：

| 步驟模式 | 正規表示式 | 說明 |
|---------|-----------|------|
| Action 呼叫 | `^\((?:No Actor\|UID="[^"]+")\) (?P<summary>.+?), call table:$` | When 步驟，帶 Actor 前綴呼叫 Server Action |
| 成功回應驗證 | `^(?P<summary>.+?)\((?P<status>\d{3})\)回應,?\s*with table:$` | Then 步驟，驗證成功回應（DataTable） |
| 成功回應 JSON | `^(?P<summary>.+?)\((?P<status>\d{3})\)回應為,?\s*with JSON:$` | Then 步驟，驗證成功回應（JSON） |
| 操作失敗 | `^操作失敗$` | Then 步驟，驗證操作失敗 |
| Entity 存在驗證 | `^應該存在一個(?P<entity>[\u4e00-\u9fffa-zA-Z0-9_]+), with table:$` | Then 步驟，驗證 Entity 存在 |
| Entity 不存在驗證 | `^應該不存在一個(?P<entity>[\u4e00-\u9fffa-zA-Z0-9_]+), with table:$` | Then 步驟，驗證 Entity 不存在 |
| 資料準備 | `^準備一個(?P<entity>[\u4e00-\u9fffa-zA-Z0-9_]+), with table:$` | Given 步驟，準備測試資料 |
| 時間控制 | `^現在時間為 "(?P<datetime>[^"]+)"$` | Given 步驟，設定系統時間 |

#### 1.2 對應 Instruction 類型

根據專案技術棧（Next.js API Routes + Neon PostgreSQL），選擇適當的 instruction：

| 步驟模式 | instruction_type | 說明 |
|---------|-----------------|------|
| 資料準備 | `entity_setup` | 插入測試資料至 PostgreSQL |
| 時間控制 | `time_control` | Mock 系統時間 |
| Action 呼叫 | `api_call` | HTTP 呼叫 API Route |
| 成功回應驗證 | `response_validate` | 驗證回應 DataTable |
| 成功回應 JSON | `response_validate` (data_format: json) | 驗證回應 JSON |
| 操作失敗 | `skip` | 由 Action 呼叫步驟處理 |
| Entity 存在驗證 | `entity_validate` | 查詢資料庫驗證 Entity 存在 |
| Entity 不存在驗證 | `entity_non_existence_validate` | 驗證 Entity 不存在 |

---

### 階段 2：產出 isa.yml

#### 2.1 基本結構（SpecFormula 標準）

```yaml
config:
  api:
    resource_path: specs/api
    project_path: specs/api
    time_format: iso
  data:
    permission: isolated
    source:
      - name: default
        resource_path: specs/data
        project_path: specs/data
        db_type: postgresql

instructions:
  - name: <指令名稱>
    format: <正規表示式>
    instruction_type: <指令類型>
```

#### 2.2 完整配置範本（Next.js API Routes + Neon PostgreSQL）

```yaml
# isa.yml - sdd.os ISA 配置檔案（SpecFormula 標準）
# 專案技術棧：Next.js API Routes + Neon PostgreSQL

config:
  api:
    resource_path: specs/api
    project_path: specs/api
    time_format: iso
  data:
    permission: isolated
    source:
      - name: default
        resource_path: specs/data
        project_path: specs/data
        db_type: postgresql

instructions:
  # ============================================
  # Given 步驟 - 資料準備
  # ============================================

  - name: Entity setup
    format: ^準備一個(?P<entity>[\u4e00-\u9fffa-zA-Z0-9_]+), with table:$
    instruction_type: entity_setup

  - name: Time control
    format: ^現在時間為 "(?P<datetime>[^"]+)"$
    instruction_type: time_control

  # ============================================
  # When 步驟 - API 呼叫
  # ============================================

  - name: Action call
    format: ^\((?:No Actor|UID="(?P<actor>[^"]+)")\) (?P<summary>.+?), call table:$
    instruction_type: api_call

  # ============================================
  # Then 步驟 - 回應驗證
  # ============================================

  - name: Response validation
    format: ^(?P<summary>.+?)\((?P<status>\d{3})\)回應,?\s*with table:$
    instruction_type: response_validate
    data_format: data_table

  - name: Response validation JSON
    format: ^(?P<summary>.+?)\((?P<status>\d{3})\)回應為,?\s*with JSON:$
    instruction_type: response_validate
    data_format: json

  - name: Operation failure
    format: ^操作失敗$
    instruction_type: skip

  # ============================================
  # Then 步驟 - Entity 驗證
  # ============================================

  - name: Entity validate
    format: ^應該存在一個(?P<entity>[\u4e00-\u9fffa-zA-Z0-9_]+), with table:$
    instruction_type: entity_validate

  - name: Entity non-existence
    format: ^應該不存在一個(?P<entity>[\u4e00-\u9fffa-zA-Z0-9_]+), with table:$
    instruction_type: entity_non_existence_validate
```

#### 2.3 配置項說明

| 欄位 | 說明 | 範例 |
|------|------|------|
| `config.api` | API 配置（resource/project path、time format） | `time_format: iso` |
| `config.data` | 資料庫配置（隔離策略、來源） | `db_type: postgresql` |
| `name` | 指令名稱，描述此步驟的用途 | `Action call` |
| `format` | 正規表示式，用於匹配步驟文字 | `^\((?:No Actor\|UID="...")\) ...` |
| `instruction_type` | 指令類型 | `api_call` |
| `data_format` | 資料格式（可選） | `data_table`, `json` |

---

### 階段 3：驗證配置

#### 3.1 步驟覆蓋檢查

確保 Feature Files 中的所有步驟都有對應的配置：

```
檢查清單：
[ ] 每個 When 步驟都匹配 Action call 格式（含 Actor 前綴）
[ ] 每個成功 Then 步驟都匹配 Response validation 格式（含 status code）
[ ] 每個失敗 Then 步驟都匹配 Operation failure 格式
[ ] 每個 Entity 存在驗證步驟都匹配 Entity validate 格式
[ ] 每個 Entity 不存在驗證步驟都匹配 Entity non-existence 格式
[ ] 每個資料準備步驟都匹配 Entity setup 格式
[ ] 每個時間控制步驟都匹配 Time control 格式
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
├── isa.yml                          # 本階段產出（SpecFormula 標準）
└── src/
    └── tests/
        └── features/                # sdd.os 生成的測試程式碼目錄
```

---

## 行為規則

### 設計階段規則
1. **完整覆蓋**：確保所有步驟模式都有對應的配置
2. **正規表示式精準**：format 必須精確匹配 sdd.os ISA SpecFormula 標準格式
3. **Entity 一致**：Entity 名稱必須與 `entity_to_table_mapping.yml` 一致

### 禁止事項
1. 不要遺漏任何步驟類型的配置
2. 不要使用不存在的 instruction_type
3. 不要在 format 中使用無效的正規表示式

---

## 與其他 Prompt 的關係

- **前置階段**：
  1. `formulation.md` - 已產出 `spec/data/` 和 `spec/features/`
  2. `actions-design.md` - 已產出 `spec/actions/actions.yml`
- **本階段角色**：ISA 配置階段，產出 sdd.os SpecFormula 標準的配置檔案
- **後續階段**：`automation-ts.md` - 使用 sdd.os 生成測試程式碼，開發 Next.js Server Actions 應用

**工作流程**：
```
formulation.md → actions-design.md → isa-config.md → automation-ts.md
     ↓                 ↓                  ↓               ↓
spec/data/        spec/actions/       isa.yml         可部署應用
spec/features/     actions.yml                        + 測試程式碼
(SpecFormula)
```

---

## 完成標準

任務完成必須滿足以下所有條件：

**配置產出：**
- [ ] `isa.yml` 檔案已建立
- [ ] YAML 語法正確無誤
- [ ] 包含 `config` section（api + data + actions）
- [ ] 所有步驟模式都有對應的 instruction

**步驟覆蓋：**
- [ ] Entity setup（Given）配置完成
- [ ] Time control（Given）配置完成
- [ ] Action call（When，含 Actor 前綴）配置完成
- [ ] Response validation（Then，含 status code）配置完成
- [ ] Response validation JSON（Then）配置完成
- [ ] Operation failure（Then）配置完成
- [ ] Entity validate（Then，「應該存在」）配置完成
- [ ] Entity non-existence（Then，「應該不存在」）配置完成

**整合驗證：**
- [ ] Entity 名稱與 `entity_to_table_mapping.yml` 一致
- [ ] Action summary 與 `spec/actions/actions.yml` 一致
