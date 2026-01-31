# Baseline UI Rules

UI 品質底線 - 所有產出的程式碼必須符合這些約束。

---

## Stack

| 規則 | 說明 |
|------|------|
| **MUST** 使用 Tailwind CSS 預設值 | 除非有自訂值或明確要求 |
| **MUST** 使用 `motion/react` | JavaScript 動畫需要時 |
| **SHOULD** 使用 `tw-animate-css` | 入場和微互動動畫 |
| **MUST** 使用 `cn` utility | class 邏輯（clsx + tailwind-merge） |

---

## Components

| 規則 | 說明 |
|------|------|
| **MUST** 使用無障礙 primitives | 有鍵盤/focus 行為的組件（Base UI, Radix, React Aria） |
| **MUST** 優先使用專案現有組件 | 不重複造輪子 |
| **NEVER** 混合 primitive 系統 | 同一個互動表面只用一套 |
| **SHOULD** 優先用 Base UI | 新 primitives 若相容 |
| **MUST** icon-only buttons 有 aria-label | 無障礙 |
| **NEVER** 手寫鍵盤/focus 行為 | 除非明確要求 |

---

## Interaction

| 規則 | 說明 |
|------|------|
| **MUST** 破壞性操作用 AlertDialog | 確認刪除、不可逆操作 |
| **SHOULD** 用 skeleton 作為 loading state | 保持結構 |
| **NEVER** 使用 `h-screen` | 用 `h-dvh` |
| **MUST** 尊重 `safe-area-inset` | fixed 元素 |
| **MUST** 錯誤顯示在操作發生處 | 就近顯示 |
| **NEVER** 阻止 input/textarea paste | 使用者體驗 |

---

## Animation

| 規則 | 說明 |
|------|------|
| **NEVER** 無明確要求時加動畫 | 克制 |
| **MUST** 只動畫 compositor props | `transform`, `opacity` |
| **NEVER** 動畫 layout props | `width`, `height`, `top`, `left`, `margin`, `padding` |
| **SHOULD** 避免動畫 paint props | `background`, `color`（小元素除外） |
| **SHOULD** 入場用 `ease-out` | 自然 |
| **NEVER** 互動反饋超過 200ms | 即時感 |
| **MUST** 離屏時暫停循環動畫 | 效能 |
| **SHOULD** 尊重 `prefers-reduced-motion` | 無障礙 |
| **NEVER** 自訂 easing curves | 除非明確要求 |
| **SHOULD** 避免動畫大圖或全屏 | 效能 |

---

## Typography

| 規則 | 說明 |
|------|------|
| **MUST** 標題用 `text-balance` | 換行優化 |
| **MUST** 內文用 `text-pretty` | 換行優化 |
| **MUST** 數據用 `tabular-nums` | 對齊 |
| **SHOULD** 密集 UI 用 `truncate` 或 `line-clamp` | 控制溢出 |
| **NEVER** 修改 `letter-spacing` | 除非明確要求 |

---

## Layout

| 規則 | 說明 |
|------|------|
| **MUST** 使用固定 z-index scale | 不用任意 z-* |
| **SHOULD** 方形元素用 `size-*` | 取代 `w-* h-*` |

---

## Performance

| 規則 | 說明 |
|------|------|
| **NEVER** 動畫大 `blur()` 或 `backdrop-filter` 表面 | 效能 |
| **NEVER** 非 active animation 時用 `will-change` | 效能 |
| **NEVER** 用 `useEffect` 做可以用 render logic 的事 | React 模式 |

---

## Design

| 規則 | 說明 |
|------|------|
| **NEVER** 使用漸層 | 除非明確要求 |
| **NEVER** 使用紫色或多色漸層 | AI slop 特徵 |
| **NEVER** 使用 glow 效果作為主要 affordance | 過度設計 |
| **SHOULD** 使用 Tailwind 預設陰影 | 除非明確要求 |
| **MUST** empty state 有一個明確的下一步 action | UX |
| **SHOULD** 每個視圖限制一個 accent color | 聚焦 |
| **SHOULD** 優先使用現有 theme/color tokens | 一致性 |

---

## 禁止清單（AI Slop 特徵）

以下模式會被自動標記：

- ❌ Inter, Roboto, Arial 作為唯一字體選擇
- ❌ 紫色漸層 on 白色背景
- ❌ Glow effects 作為主要視覺元素
- ❌ 過度使用 emoji 作為 icon
- ❌ 無目的的動畫
- ❌ 千篇一律的 card grid 佈局
- ❌ Space Grotesk 每次都用

---

## Z-Index Scale

```css
:root {
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-fixed: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-popover: 60;
  --z-tooltip: 70;
}
```

使用方式：
```tsx
<div className="z-[var(--z-modal)]">
// 或定義 Tailwind extend
<div className="z-modal">
```
