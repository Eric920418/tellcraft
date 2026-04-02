# Quality Gate Skill

## Metadata

```yaml
name: quality-gate
version: 2.0.0
description: |
  獨立品質檢查 Skill，自動在 UIUX/Fast Build/Clone Skill 完成後觸發。

  檢查類別：
  1. Accessibility (A11y) - WCAG 2.2 AA 無障礙標準 + 色彩對比度
  2. Performance - 效能優化檢查
  3. Code Quality - 代碼品質 + Design Tier 合規

  發現 critical 問題時自動修復（Rule-based → LLM fallback，最多 3 輪）。

author: Tellcraft Team
output_format:
  - Quality Report (JSON)
```

---

## Trigger Conditions（觸發條件）

**自動觸發**（不需用戶指令）：
- UIUX Skill Phase 3 Implementation 完成後（3 輪 autofix）
- Fast Build Skill 生成完成後（2 輪 autofix）
- Clone Skill 生成完成後（2 輪 autofix）

---

## Scope（邊界定義）

### 解決的問題
- 檢查程式碼的無障礙性（WCAG 2.2 AA）
- 檢查色彩對比度（亮底白字 + Dark Mood 深色容器）
- 檢查效能相關問題（動畫屬性、時長、reduced-motion）
- 檢查代碼品質（動畫庫、Tailwind 版本、字體載入、SVG ID 衝突、h-screen）
- 檢查 Design Tier 合規（Functional tier 禁漸層/glow/spring）
- 自動修復 critical 問題（Rule-based 確定性修復 + LLM fallback）

### 不解決的問題
- ❌ SEO 檢查（未來獨立 Skill）
- ❌ 程式碼生成（由 uiux/coder Skill 負責）
- ❌ 部署（由 deployer Skill 負責）

---

## Input Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "code": {
      "type": "object",
      "description": "GeneratedCode（pages + components + styles）"
    },
    "designTier": {
      "type": "string",
      "enum": ["functional", "creative"],
      "description": "設計層級，影響 code_quality 檢查規則"
    },
    "moodId": {
      "type": "string",
      "description": "設計情緒 ID，影響色彩對比度檢查"
    }
  },
  "required": ["code"]
}
```

---

## Output Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "passed": {
      "type": "boolean",
      "description": "是否通過品質檢查（無 critical 問題）"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "summary": {
      "type": "object",
      "properties": {
        "total": { "type": "integer" },
        "critical": { "type": "integer" },
        "warning": { "type": "integer" },
        "info": { "type": "integer" },
        "autoFixed": { "type": "integer" }
      }
    },
    "categories": {
      "type": "object",
      "properties": {
        "a11y": {
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
        "code_quality": {
          "type": "object",
          "properties": {
            "passed": { "type": "boolean" },
            "issues": { "type": "array" }
          }
        }
      }
    }
  },
  "required": ["passed", "timestamp", "summary", "categories"]
}
```

---

## Workflow Overview（流程概覽）

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Step 1: 靜態分析                                  │
│                                                                     │
│    並行執行五類檢查：                                                │
│    ├─ Accessibility Checker（aria-label、form-labels、heading）     │
│    ├─ Color Contrast Checker（亮底白字、Dark Mood 容器）            │
│    ├─ Performance Checker（動畫屬性、時長、reduced-motion）         │
│    ├─ Code Quality Checker（imports、語法、h-screen、tier 合規）    │
│    └─ SVG ID Uniqueness Checker（硬編碼 ID 衝突）                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Step 2: 自動修復迴圈（最多 2-3 輪）               │
│                                                                     │
│    ├─ Rule-based 確定性修復（零 LLM，~0ms）                        │
│    │   motion-import / tailwind-v4 / focus-visible /                │
│    │   form-labels / no-h-screen                                    │
│    ├─ 重新檢查，仍有 critical → LLM 修復（Haiku）                  │
│    └─ 重新檢查，直到通過或達上限                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Step 3: 輸出報告                                  │
│                                                                     │
│    ├─ passed = true（無 critical）→ 進入預覽/部署                   │
│    └─ passed = false → 通知用戶仍有問題                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Instructions Index（執行指南索引）

| 階段 | Instruction 文件 | 說明 |
|------|-----------------|------|
| 1. 品質檢查 | `instructions/01-quality-check.md` | 完整檢查規則和實作 |

---

## 檢查規則概覽

### Accessibility (A11y)

| 嚴重度 | 規則 | 說明 | 自動修復 |
|--------|------|------|----------|
| Critical | color-contrast | 亮色背景上白色文字 | LLM |
| Critical | dark-mood-contrast | Dark mood 缺深色容器 | LLM |
| Critical | focus-visible | 互動元素缺 focus 狀態（per-element） | Rule-based |
| Critical | aria-label | icon-only button 缺標籤 | LLM |
| Critical | form-labels | Input 缺 label 關聯 | Rule-based |
| Warning | alt-text | 圖片缺 alt | — |
| Warning | heading-hierarchy | 標題跳級 | — |

### Performance

| 嚴重度 | 規則 | 說明 | 自動修復 |
|--------|------|------|----------|
| Critical | animation-properties | 動畫了 layout 屬性 | LLM |
| Warning | no-transition-all | 使用了 transition-all | — |
| Warning | reduced-motion | 缺 prefers-reduced-motion | — |
| Warning | animation-duration | 動畫時長 > 500ms（Tailwind/motion） | — |

### Code Quality

| 嚴重度 | 規則 | 說明 | 自動修復 |
|--------|------|------|----------|
| Critical | motion-import | framer-motion → motion/react | Rule-based |
| Critical | tailwind-v4 | @tailwind → @import "tailwindcss" | Rule-based |
| Critical | next-font | Google Fonts link/import | LLM |
| Critical | svg-id-uniqueness | SVG 硬編碼 ID 衝突 | LLM |
| Critical | no-h-screen | h-screen → h-dvh | Rule-based |
| Warning | no-emoji-icons | Emoji 作 icon | — |
| Warning | functional-no-gradient | Functional tier 使用漸層 | — |
| Warning | functional-no-glow | Functional tier 使用 glow | — |
| Warning | functional-no-spring | Functional tier 使用 spring/bounce | — |
| Info | cursor-pointer | Button 缺 cursor-pointer | — |

---

## 與其他 Skill 的關係

```
UIUX / Fast Build / Clone Skill
         │
         ▼
   Quality Gate ◄─── 本 Skill（自動觸發）
         │
         │ Rule-based + LLM 自動修復
         │
         ▼
   passed = true → 預覽 / 部署 / 迭代
```
