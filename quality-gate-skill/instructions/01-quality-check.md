# Quality Gate 品質檢查

## 目標

對產出的前端程式碼進行自動化品質檢查，確保符合無障礙、效能、代碼品質標準。

---

## 檢查類別

### Priority 1: Accessibility（CRITICAL）

| 規則 | 檢查方式 | 自動修復 |
|------|----------|----------|
| Color Contrast | 亮色背景 + 白色文字偵測（5 行窗口） | LLM |
| Dark Mood Contrast | Dark mood 缺深色容器（glassmorphic-dark/tech-dark） | LLM |
| Focus States | 每個 `<button>` / `<a>` 元素獨立檢查 focus-visible | Rule-based：全域加 `focus-visible:ring-2` |
| ARIA Labels | icon-only button 缺 aria-label | LLM |
| Form Labels | input 缺 aria-label / id | Rule-based：用 placeholder 補 aria-label |
| Alt Text | img 缺 alt | — |
| Heading Hierarchy | 標題跳級（h1 → h3） | — |

### Priority 2: Performance（HIGH）

| 規則 | 檢查方式 | 自動修復 |
|------|----------|----------|
| Animation Properties | transition 動畫了 layout 屬性（width/height/margin 等） | LLM |
| No Transition All | 使用了 `transition-all` | — |
| Reduced Motion | 有動畫但缺 `prefers-reduced-motion` | — |
| Animation Duration | 三組 pattern：自定義 `duration-[800ms]` / 標準 `duration-700` / motion `duration: 0.8` | — |

### Priority 3: Code Quality（MEDIUM）

| 規則 | 檢查方式 | 自動修復 |
|------|----------|----------|
| Motion Import | `from 'framer-motion'` | Rule-based：替換為 `motion/react` |
| Tailwind V4 | CSS 中 `@tailwind` 語法 | Rule-based：替換為 `@import "tailwindcss"` |
| Next Font | `<link>` / `@import` 載入 Google Fonts | LLM |
| SVG ID Uniqueness | SVG defs 中硬編碼 ID（pages + components） | LLM |
| No H-Screen | `h-screen` / `min-h-screen`（mobile Safari 問題） | Rule-based：替換為 `h-dvh` / `min-h-dvh` |
| No Emoji Icons | Emoji 作 icon | — |
| Cursor Pointer | Button 缺 cursor-pointer（info） | — |

### Priority 4: Design Tier 合規（Functional only）

| 規則 | 檢查方式 | 自動修復 |
|------|----------|----------|
| No Gradient | `bg-gradient-to-*` / `from-*-NNN` / `via-*-NNN` | —（warning） |
| No Glow | `shadow-[0 0 ...]` / `drop-shadow-*` | —（warning） |
| No Spring | `spring` / `bounce` / `stiffness` / `damping`（跳過註釋） | —（warning） |

---

## 檢查流程

```
┌─────────────────────────────────────────────┐
│  Step 1: 靜態分析                            │
│  - 掃描所有 pages + components 的 .tsx 檔案  │
│  - 掃描 globals.css                          │
│  - 按 designTier / moodId 調整規則           │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Step 2: 問題分類                            │
│  - Critical（必須修復，進入 autofix 迴圈）   │
│  - Warning（報告但不自動修復）               │
│  - Info（參考資訊）                          │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Step 3: 自動修復迴圈                        │
│  - Rule-based 確定性修復（零 LLM，~0ms）    │
│  - 重新掃描，仍有 critical → LLM 修復       │
│  - 重新掃描，直到通過或達上限                │
│  - UIUX: 最多 3 輪                          │
│  - Fast Build / Clone: 最多 2 輪            │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Step 4: 輸出報告                            │
│  - passed = true → 進入預覽/部署             │
│  - passed = false → 通知用戶仍有問題         │
└─────────────────────────────────────────────┘
```

---

## Rule-Based 自動修復

以下 5 個規則有確定性修復（零 LLM，瞬間完成）：

### Fix: Motion Import
```typescript
// Before: from 'framer-motion'
// After:  from 'motion/react'
```

### Fix: Tailwind V4
```typescript
// Before: @tailwind base; @tailwind components; @tailwind utilities;
// After:  @import "tailwindcss"
```

### Fix: Focus Visible
```typescript
// Before: <button className="bg-blue-500">
// After:  <button className="bg-blue-500 focus-visible:ring-2 focus-visible:ring-offset-2">
```

### Fix: Form Labels
```typescript
// Before: <input placeholder="Email" />
// After:  <input placeholder="Email" aria-label="Email" />
```

### Fix: No H-Screen
```typescript
// Before: <div className="h-screen">  /  <div className="min-h-screen">
// After:  <div className="h-dvh">     /  <div className="min-h-dvh">
```

---

## LLM Fallback 修復

Rule-based 無法處理的 critical 問題（aria-label、color-contrast、dark-mood-contrast、animation-properties、next-font、svg-id-uniqueness）交由 Haiku LLM 修復。

LLM 修復後會跑一輪靜態 repair（`repairHookShadowing` + `repairUndeclaredRefs`），防止 Haiku 引入新問題。

---

## 已知限制

- **Template literal className**：`addClassToken` 只處理 `className="..."` 格式，不處理 `` className={`...`} `` 模板語法。LLM fallback 可處理。
- **focus-visible per-element 的 `>` 誤判**：如果 JSX tag 內有 `onClick={() => count > 0}` 這種表達式，`>` 可能被誤判為 tag 結束。實務中極少發生且不影響修復結果。
- **Animation duration Pattern 3**：`/duration:\s*([\d.]+)/` 可能匹配非動畫的 `duration` 屬性，但 severity 是 warning 不觸發 autofix。
