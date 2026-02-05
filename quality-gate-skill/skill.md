# Quality Gate Skill

## Metadata

```yaml
name: quality-gate
version: 1.0.0
description: |
  獨立品質檢查 Skill，自動在 UIUX/Coder Skill 完成後觸發。

  檢查類別：
  1. Accessibility (A11y) - WCAG 2.2 AA 無障礙標準
  2. Performance - 效能優化檢查
  3. SEO - 搜尋引擎優化

  輸出品質報告（JSON），供 universal-fixer Skill 讀取並修復。

author: Tellcraft Team
output_format:
  - Quality Report (JSON)
```

---

## Trigger Conditions（觸發條件）

**自動觸發**（不需用戶指令）：
- UIUX Skill Phase 3 Implementation 完成後
- Coder Skill 完成後（TODO）

**手動觸發**（未來可支援）：
- 「檢查品質」、「quality check」、「run quality gate」

---

## Scope（邊界定義）

### 解決的問題
- 檢查程式碼的無障礙性（WCAG 2.2 AA）
- 檢查效能相關問題（動畫、layout thrashing）
- 檢查 SEO 相關問題（metadata、semantic HTML）
- 生成結構化品質報告

### 不解決的問題
- ❌ 修復問題（由 universal-fixer Skill 負責）
- ❌ 程式碼生成（由 uiux/coder Skill 負責）
- ❌ 部署（由 deployer Skill 負責）

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
    "generation_id": {
      "type": "string",
      "description": "生成記錄 ID"
    },
    "files": {
      "type": "array",
      "items": { "type": "string" },
      "description": "要檢查的檔案路徑列表"
    },
    "source_skill": {
      "type": "string",
      "enum": ["uiux", "coder"],
      "description": "觸發來源 Skill"
    }
  },
  "required": ["project_id", "generation_id"]
}
```

---

## Output Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "project_id": {
      "type": "string"
    },
    "generation_id": {
      "type": "string"
    },
    "passed": {
      "type": "boolean",
      "description": "是否通過品質檢查（無 critical 問題）"
    },
    "summary": {
      "type": "object",
      "properties": {
        "total": { "type": "integer" },
        "critical": { "type": "integer" },
        "warning": { "type": "integer" },
        "info": { "type": "integer" }
      }
    },
    "categories": {
      "type": "object",
      "properties": {
        "accessibility": {
          "type": "object",
          "properties": {
            "passed": { "type": "boolean" },
            "issues": { "type": "array" }
          }
        },
        "performance": {
          "type": "object",
          "properties": {
            "passed": { "type": "boolean" },
            "issues": { "type": "array" }
          }
        },
        "seo": {
          "type": "object",
          "properties": {
            "passed": { "type": "boolean" },
            "issues": { "type": "array" }
          }
        }
      }
    },
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "category": { "type": "string", "enum": ["a11y", "performance", "seo"] },
          "severity": { "type": "string", "enum": ["critical", "warning", "info"] },
          "rule": { "type": "string" },
          "message": { "type": "string" },
          "file": { "type": "string" },
          "line": { "type": "integer" },
          "column": { "type": "integer" },
          "suggestion": { "type": "string" }
        }
      }
    }
  },
  "required": ["timestamp", "project_id", "generation_id", "passed", "summary", "issues"]
}
```

---

## Workflow Overview（流程概覽）

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Step 1: 接收檔案列表                              │
│                                                                     │
│    從 UIUX/Coder Skill 接收產出的檔案路徑                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Step 2: 執行檢查                                  │
│                                                                     │
│    並行執行三類檢查：                                                │
│    ├─ Accessibility Checker                                        │
│    ├─ Performance Checker                                          │
│    └─ SEO Checker                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Step 3: 生成報告                                  │
│                                                                     │
│    ├─ 匯總所有問題                                                  │
│    ├─ 按嚴重程度分類                                                │
│    ├─ 生成 JSON 報告                                                │
│    └─ 儲存到 DB / 發送給 universal-fixer                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │  觸發 Fixer     │
                          │  或通知用戶     │
                          └─────────────────┘
```

---

## Instructions Index（執行指南索引）

| 階段 | Instruction 文件 | 說明 |
|------|-----------------|------|
| 1. 品質檢查 | `instructions/01-quality-check.md` | 完整檢查規則和實作 |

---

## 檢查規則概覽

### Accessibility (A11y)

| 嚴重度 | 規則 | 說明 |
|--------|------|------|
| Critical | color-contrast | 文字對比度 ≥ 4.5:1 |
| Critical | focus-visible | 互動元素有可見 focus |
| Critical | aria-label | icon-only buttons 有標籤 |
| Critical | form-labels | 表單輸入有 label |
| Warning | keyboard-access | 可鍵盤操作 |
| Warning | alt-text | 圖片有 alt |
| Warning | heading-hierarchy | 標題不跳級 |

### Performance

| 嚴重度 | 規則 | 說明 |
|--------|------|------|
| Critical | animation-properties | 只動畫 transform/opacity |
| Warning | animation-duration | 微互動 ≤ 200ms |
| Warning | reduced-motion | 支援 prefers-reduced-motion |
| Info | will-change | 正確使用 will-change |

### SEO

| 嚴重度 | 規則 | 說明 |
|--------|------|------|
| Critical | page-title | 每頁有 title |
| Critical | meta-description | 有 description |
| Warning | open-graph | 有 OG tags |
| Warning | semantic-html | 使用語意化標籤 |
| Info | canonical | 有 canonical URL |

---

## 與其他 Skill 的關係

```
UIUX Skill (Phase 3 完成)
         │
         ▼
   Quality Gate ◄─── 本 Skill
         │
         │ 生成報告
         ▼
  Universal Fixer (TODO)
         │
         │ 修復後重新檢查
         ▼
   Quality Gate (再次)
         │
         │ 通過
         ▼
     Deployer
```

---

## 報告範例

```json
{
  "timestamp": "2026-02-05T12:00:00Z",
  "project_id": "proj_123",
  "generation_id": "gen_456",
  "passed": false,
  "summary": {
    "total": 8,
    "critical": 2,
    "warning": 4,
    "info": 2
  },
  "categories": {
    "accessibility": {
      "passed": false,
      "issues": [
        {
          "id": "a11y-001",
          "category": "a11y",
          "severity": "critical",
          "rule": "color-contrast",
          "message": "文字與背景對比度不足 (2.1:1 < 4.5:1)",
          "file": "components/Button.tsx",
          "line": 15,
          "column": 8,
          "suggestion": "將文字顏色從 #999 改為 #666 或更深"
        }
      ]
    },
    "performance": {
      "passed": true,
      "issues": []
    },
    "seo": {
      "passed": false,
      "issues": [
        {
          "id": "seo-001",
          "category": "seo",
          "severity": "critical",
          "rule": "page-title",
          "message": "頁面缺少 title",
          "file": "app/page.tsx",
          "line": 1,
          "suggestion": "在 metadata export 中加入 title"
        }
      ]
    }
  },
  "issues": [
    // 上面所有 issues 的扁平列表
  ]
}
```
