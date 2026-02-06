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
| **MUST** focus ring 用 `focus-visible` | 不要用 `focus`（避免滑鼠點擊出 ring） |
| **MUST** Modal/Drawer 加 `overscroll-behavior: contain` | 防止背景滾動穿透 |
| **SHOULD** 互動元素加 `touch-action: manipulation` | 消除移動端 300ms 延遲 |

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
| **MUST** 尊重 `prefers-reduced-motion` | 無障礙 |
| **NEVER** 自訂 easing curves | 除非明確要求 |
| **SHOULD** 避免動畫大圖或全屏 | 效能 |
| **NEVER** 使用 `transition-all` | 必須列出具體屬性（transition-colors、transition-opacity、transition-transform） |

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
| **MUST** Flex 子元素加 `min-w-0` | 否則 truncate/line-clamp 不生效 |
| **MUST** `<img>` 有 explicit width/height | 防止 CLS（或用 next/image fill） |

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
| **NEVER** 使用漸層 | 除非明確要求或 creative tier |
| **NEVER** 使用紫色或多色漸層 | AI slop 特徵（任何 tier 都禁止） |
| **NEVER** 使用 glow 效果作為主要 affordance | 過度設計 |
| **SHOULD** 使用 Tailwind 預設陰影 | 除非明確要求 |
| **MUST** empty state 有一個明確的下一步 action | UX |
| **SHOULD** 每個視圖限制一個 accent color | 聚焦（creative tier 可放寬到 3 個） |
| **SHOULD** 優先使用現有 theme/color tokens | 一致性 |

---

## Craft Foundations（設計品質底線）

| 規則 | 說明 |
|------|------|
| **MUST** Subtle Layering | 表面差異微妙但可辨識，邊框輕但不隱形 |
| **MUST** 選定一種深度策略全局堅持 | borders-only / subtle shadows / layered shadows，不混合 |
| **MUST** 顏色有語義來源 | foreground、background、border、brand、semantic，不用隨意 hex |
| **MUST** 每個互動元素有完整狀態 | default/hover/active/focus/disabled |
| **MUST** 數據有完整狀態 | loading/empty/error |
| **SHOULD** 間距嚴格用 base unit 倍數 | 隨意間距是「沒有系統」的最明顯信號 |
| **SHOULD** padding 對稱 | 除非有明確理由不對稱 |
| **NEVER** 劇烈的表面色階跳躍 | gray-50 → gray-100 而不是 gray-100 → gray-300 |
| **NEVER** 原生 select / date input | 無法 style，必須自建組件 |

---

## 禁止清單（AI Slop 特徵）

以下模式會被自動標記：

- ❌ Inter, Roboto, Arial 作為唯一字體選擇
- ❌ 紫色漸層 on 白色背景
- ❌ Glow effects 作為主要視覺元素
- ❌ 過度使用 emoji 作為 icon
- ❌ 無目的的動畫
- ❌ 千篇一律的 card grid 佈局（sidebar + 同大小卡片矩陣）
- ❌ Space Grotesk 每次都用
- ❌ 刺眼的邊框（如果邊框是第一眼看到的東西，太強了）
- ❌ 劇烈 drop shadow（陰影要微妙，不要搶注意力）
- ❌ 小元素上大圓角
- ❌ 純白卡片放在有色背景上（對比太硬）
- ❌ 粗裝飾性邊框
- ❌ 多個 accent color 稀釋焦點（functional tier）
- ❌ icon-left + 大數字 + 小標籤 每個 metric 都一樣

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
