# UI/UX 介面設計 Skill

## Metadata

```yaml
name: uiux
version: 2.0.0
description: |
  AI 驅動的前端介面開發（3 階段）：
  1. Design Discovery - 探索用戶偏好與設計方向
  2. Design Lab - 生成多個設計變體供用戶選擇
  3. Implementation - 產出 Next.js + Tailwind CSS 前端程式碼

  完成後自動觸發 quality-gate Skill 進行品質檢查。
  與 coder skill（後端 API）並行執行，確保前後端獨立開發不干涉。

author: Tellcraft Team
output_format:
  - Next.js Pages/Components (SSR 優先)
  - Tailwind CSS Styles
  - RWD 響應式設計
```

---

## Trigger Conditions（觸發條件）

當用戶意圖符合以下任一情境時，主大腦應路由至此 Skill：

| Intent Pattern | 範例 |
|----------------|------|
| 介面設計 | 「幫我設計這個系統的介面」 |
| 前端開發 | 「做出這個功能的前端頁面」 |
| UI/UX 改善 | 「這個頁面的使用者體驗需要改善」 |
| 視覺設計 | 「我想要一個漂亮的 landing page」 |
| Dashboard | 「幫我做一個管理後台」 |

**觸發詞**：
- 設計、介面、UI、UX、前端、頁面、畫面
- landing page、dashboard、後台、管理介面
- 美化、視覺、風格、配色、排版

**不適用於**：
- 「幫我寫 API」→ 應轉交 coder Skill
- 「幫我部署」→ 應轉交 deployer Skill
- 「幫我釐清需求」→ 應轉交 bdd-spec Skill

---

## Scope（邊界定義）

### 解決的問題
- 從 BDD 規格萃取前端需求
- 探索用戶的設計偏好（風格、配色、佈局）
- 生成多個設計變體供用戶比較選擇
- 產出 Next.js + Tailwind CSS 前端程式碼
- 確保 RWD 響應式設計（Mobile-first）

### 不解決的問題
- ❌ 品質檢查（由 quality-gate skill 負責）
- ❌ 問題修復（由 universal-fixer skill 負責）
- ❌ 後端 API 開發（由 coder skill 負責）
- ❌ 資料庫設計（由 bdd-spec skill 負責）
- ❌ 部署（由 deployer skill 負責）
- ❌ 網域設定（由 domain-* skills 負責）

---

## Input Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "project_id": {
      "type": "string",
      "description": "專案 ID"
    },
    "bdd_session_id": {
      "type": "string",
      "description": "BDD Session ID（用於取得規格）"
    },
    "scope": {
      "type": "string",
      "enum": ["component", "page", "full"],
      "default": "full",
      "description": "設計範圍：component=單一組件, page=單頁, full=完整專案"
    },
    "design_memory_path": {
      "type": "string",
      "description": "設計記憶檔案路徑（可選，用於延續設計決策）"
    }
  },
  "required": ["project_id"]
}
```

---

## Output Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "design_pending"],
      "description": "執行結果狀態"
    },
    "artifacts": {
      "type": "object",
      "properties": {
        "pages": {
          "type": "array",
          "items": { "type": "string" },
          "description": "產出的頁面檔案路徑"
        },
        "components": {
          "type": "array",
          "items": { "type": "string" },
          "description": "產出的組件檔案路徑"
        },
        "styles": {
          "type": "string",
          "description": "全域樣式檔案路徑"
        },
        "design_memory": {
          "type": "string",
          "description": "設計記憶檔案路徑"
        }
      }
    },
    "design_summary": {
      "type": "object",
      "properties": {
        "style": { "type": "string" },
        "color_palette": { "type": "object" },
        "typography": { "type": "object" },
        "selected_variant": { "type": "string" }
      }
    },
    "next_skill": {
      "type": "string",
      "const": "quality-gate",
      "description": "完成後自動觸發的下一個 Skill"
    }
  },
  "required": ["status", "artifacts"]
}
```

---

## Workflow Overview（流程概覽）

### 階段流程圖（3 階段架構）

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Phase 1: Design Discovery                         │
│                                                                     │
│    BDD 規格 ──▶ 提取前端需求 ──▶ 多輪問答釐清設計偏好                 │
│                                                                     │
│    ├─ 風格偏好（minimal/playful/professional/...）                   │
│    ├─ 配色方向（暖色/冷色/品牌色）                                    │
│    ├─ 參考網站                                                       │
│    ├─ 目標用戶                                                       │
│    └─ 技術約束                                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Phase 2: Design Lab                               │
│                                                                     │
│    生成 5 個設計變體 ──▶ 用戶預覽選擇 ──▶ 迭代精煉                    │
│                                                                     │
│    ├─ Variant A: Information Hierarchy Focus                        │
│    ├─ Variant B: Layout Model Exploration                           │
│    ├─ Variant C: Density Variation                                  │
│    ├─ Variant D: Interaction Model                                  │
│    └─ Variant E: Expressive Direction                               │
│                                                                     │
│    支援：合併變體優點 → Variant F                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Phase 3: Implementation                           │
│                                                                     │
│    確定設計 ──▶ 產出 Next.js + Tailwind CSS 程式碼                   │
│                                                                     │
│    技術規範：                                                        │
│    ├─ SSR 優先（Server Components）                                 │
│    ├─ Tailwind CSS（utility-first）                                 │
│    ├─ RWD（Mobile-first breakpoints）                               │
│    ├─ motion/react（動畫）                                          │
│    └─ Base UI / Radix（無障礙組件）                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │  自動觸發 quality-gate    │
                    │  Skill 進行品質檢查       │
                    └───────────────────────────┘
```

---

## Instructions Index（執行指南索引）

| 階段 | Instruction 文件 | 加載時機 | 必要性 |
|------|-----------------|----------|--------|
| 1. 設計探索 | `instructions/01-design-discovery.md` | 開始探索設計時 | 必要 |
| 2. 設計實驗室 | `instructions/02-design-lab.md` | 生成設計變體時 | 必要 |
| 3. 程式碼實作 | `instructions/03-implementation.md` | 產出程式碼時 | 必要 |

**輔助規則文件**：
- `rules/baseline-ui.md` - UI 技術約束（效能、無障礙底線）
- `rules/design-principles.md` - 設計原則（typography、color、spacing）
- `rules/tailwind-patterns.md` - Tailwind CSS 最佳實踐

**後續 Skill**：
- 完成後自動觸發 `quality-gate` Skill 進行品質檢查

---

## Quality Gates（品質閘門）

### Phase 1: Design Discovery（軟性閘門）

| 檢查項目 | 驗證方式 |
|----------|----------|
| 設計偏好已確認 | 用戶明確選擇風格/配色方向 |
| 目標用戶已定義 | 知道誰是主要使用者 |
| 技術約束已記錄 | 知道 Dark mode 需求、RWD breakpoints |

### Phase 2: Design Lab（軟性閘門）

| 檢查項目 | 驗證方式 |
|----------|----------|
| 5 個變體已生成 | 每個變體探索不同設計軸 |
| 用戶已選擇/合併 | 有明確的設計方向 |

### Phase 3: Implementation（軟性閘門）

| 檢查項目 | 驗證方式 |
|----------|----------|
| 所有頁面已產出 | 檢查 pages 列表 |
| 組件已抽取 | 重複元素已組件化 |
| RWD 已實作 | 有 sm/md/lg breakpoints |

### 後續：Quality Gate Skill（硬性閘門）

Implementation 完成後，自動觸發獨立的 `quality-gate` Skill 進行品質檢查。

詳見：`quality-gate-skill/skill.md`

---

## Design Memory（設計記憶）

持久化設計決策，供未來使用：

```markdown
# Design Memory - [Project Name]

## Brand Tone
- **Style**: minimal, professional
- **Avoid**: playful, cartoon-like

## Color Palette
- **Primary**: #3B82F6
- **Secondary**: #10B981
- **Background**: #FAFAFA
- **Text**: #0F172A

## Typography
- **Heading**: Inter, font-bold
- **Body**: Inter, font-normal
- **Mono**: Fira Code

## Spacing Scale
- Base: 4px
- Density: comfortable

## Component Patterns
- **Buttons**: rounded-lg, shadow-sm
- **Cards**: border, rounded-xl
- **Forms**: inline validation
```

---

## Error Handling（異常處理）

| 異常情境 | 處理方式 |
|----------|----------|
| 無 BDD 規格 | 直接進入 Discovery，從用戶描述開始 |
| 用戶無法決定風格 | 提供更多參考範例，生成更多變體 |
| 設計變體都不滿意 | 收集詳細反饋，生成新一批變體 |
| 程式碼生成失敗 | 重試或提示用戶簡化需求 |

---

## Progressive Disclosure Strategy（漸進式披露策略）

```
Level 0 (Always Loaded)
└── skill.md (本文件) - 元數據、觸發條件、Schema

Level 1 (On Skill Activation)
└── 當前執行階段的 instruction 文件

Level 2 (On Step Execution)
└── 該步驟需要的 rules 文件

Level 3 (On Demand)
└── 完整範例、除錯資訊
```
