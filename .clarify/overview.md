# AI-Genesis BDD Spec 釐清總覽

**來源文件**：`/Users/eric/Downloads/AI-Genesis-PRD-v24.1.md`
**完成日期**：2026-01-22
**狀態**：✅ **完整 5 階段流程完成**

---

## 迭代歷程

### Phase 1: PRD 釐清
| 輪次 | 階段 | 結果 |
|------|------|------|
| 1 | Discovery | 發現 11 個問題 |
| 1 | Clarify | 解決 11 個問題 |
| 2 | Discovery | 發現 3 個新問題 |
| 2 | Clarify | 解決 3 個問題 |
| 3 | Discovery | 無新問題 |
| 4 | Discovery | 無新問題（終止） |

### Phase 2: Formulation
- 產出 schema.sql + entity_to_table_mapping.yml
- 產出 8 個 Feature Files
- Quality Gate 通過

### Phase 3: Spec 釐清
| 輪次 | 階段 | 結果 |
|------|------|------|
| 1 | Discovery | 發現 6 個問題 |
| 1 | Clarify | 解決 6 個問題 |
| 2 | Discovery | 無新問題 |
| 3 | Discovery | 發現 1 個問題 |
| 2 | Clarify | 解決 1 個問題 |
| 4 | Discovery | 無新問題 |
| 5 | Discovery | 無新問題（終止） |

### Phase 4: Actions Design
- 產出 `spec/actions/actions.yml`
- 8 個 Server Actions 定義
- 完整 Types 對應 schema.sql

### Phase 5: ISA Config
- 產出 `isa.yml`
- 5 個 instruction 定義
- 可供 sdd.os 工具使用

---

## 統計摘要

| 指標 | 數值 |
|------|------|
| PRD 決議 | 14 項 |
| Spec 決議 | 7 項 |
| **總決議數** | **21 項** |
| Feature Files | 8 個 |
| Server Actions | 8 個 |
| 資料表 | 6 張 |
| ISA Instructions | 5 個 |

---

## 產出檔案

### 資料模型
- `spec/data/schema.sql` - 6 張資料表 + RLS 政策
- `spec/data/entity_to_table_mapping.yml` - Entity 中英文對應

### Actions 規格
- `spec/actions/actions.yml` - 8 個 Server Actions 定義

### ISA 配置
- `isa.yml` - sdd.os 工具配置

### Feature Files
| Feature | Action | Rules | Examples |
|---------|--------|-------|----------|
| 建立專案 | createProject | 3 | 7 |
| 發送訊息 | sendMessage | 2 | 2 |
| 生成程式碼 | generateCode | 4 | 5 |
| 部署專案 | deployProject | 4 | 4 |
| 迭代修改 | updateProject | 4 | 6 |
| 取消訂閱 | cancelSubscription | 3 | 3 |
| 導出資料 | exportData | 3 | 3 |
| 移轉資源 | transferResources | 4 | 4 |

---

## 21 項決議完整清單

### PRD 決議 (1-14)

| # | 問題 | 決議 |
|---|------|------|
| 1 | Project 狀態轉換規則 | 線性 + 允許回退 + 允許重試 |
| 2 | 資源擁有權 | 平台帳號下，付費後可申請移轉 |
| 3 | 釐清終止條件 | 連續 2 輪無新問題 |
| 4 | 生成失敗處理 | 標記 failed + 通知用戶 + 人工介入 |
| 5 | 部署失敗處理 | 自動切換備用 Supabase Organization |
| 6 | 破壞性變更 | 自動備份 + 嘗試轉換，失敗才警告 |
| 7 | 對話次數計算 | 每次用戶發送訊息 = 1 次 |
| 8 | 取消訂閱處理 | 網站停用顯示暫停頁 + 30 天後刪除 |
| 9 | 版本保留策略 | 永久保留所有版本 |
| 10 | 規格修改方式 | 僅透過對話修改 |
| 11 | 內容審查 | 使用 Claude 內建安全機制 |
| 12 | 資源移轉流程 | 自助操作（用戶輸入 API Key） |
| 13 | 資料導出格式 | SQL dump |
| 14 | 只讀模式限制 | 網站完全停用，顯示「已暫停」頁 |

### Spec 決議 (15-21)

| # | 問題 | 決議 |
|---|------|------|
| 15 | cancelled 用戶權限 | 完全無法使用平台 |
| 16 | 專案名稱重複 | 自動加後綴「(N)」 |
| 17 | 生成前置條件 | 必須完成 BDD Spec 釐清 |
| 18 | failed 專案重試 | 系統自動重試最多 3 次 |
| 19 | 所有 Org 配額用盡 | 通知營運團隊手動處理 |
| 20 | 對話次數重置 | 與訂閱週期對齊 |
| 21 | failed 專案重新觸發 | 透過迭代修改 Action |

---

## 狀態轉換圖

```
draft → generating → testing → deployed
          ↑                       │
          │←──────────────────────┘ (迭代修改)
          ↑
failed ───┘ (迭代修改)
```

---

## 已解決項目檔案

```
.clarify/resolved/
├── data/
│   ├── Project_status狀態轉換規則為何.md
│   ├── Project_Supabase與Vercel資源的擁有權歸屬.md
│   └── Generation_generated_code_url的儲存策略.md
└── features/
    ├── 需求釐清_AI判斷充分釐清的標準為何.md
    ├── 程式碼生成_自癒機制的最大重試次數與升級策略.md
    ├── 部署_Supabase建立失敗的處理方式.md
    ├── 迭代修改_破壞性Schema變更的處理方式.md
    ├── 計費_AI對話次數的計算方式.md
    ├── 用戶取消訂閱_資源處理策略.md
    ├── 規格確認_用戶修改規格的方式為何.md
    ├── 安全審查_內容審查的具體規則.md
    ├── 資源移轉_移轉流程是自助還是人工.md
    ├── 資料導出_導出格式為何.md
    ├── 只讀模式_具體限制為何.md
    ├── 建立專案_cancelled狀態能否建立專案.md
    ├── 建立專案_專案名稱重複如何處理.md
    ├── 生成程式碼_前置條件是否需要對話.md
    ├── 生成程式碼_failed專案如何重試.md
    ├── 部署專案_所有Org都滿時如何處理.md
    ├── 發送訊息_月初重置對話次數規則.md
    └── 迭代修改_failed專案如何重新觸發.md
```
