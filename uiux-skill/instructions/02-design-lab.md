# Phase 2: Design Lab

## 目標

根據 Design Brief 生成 5 個有意義差異的設計變體，讓用戶比較選擇。

---

## 輸入

- Design Brief（來自 Phase 1）
- BDD 規格（如有）
- 專案現有的設計 tokens（從 tailwind.config 提取）

---

## 設計軸

每個變體必須探索不同的設計軸，**不是微調差異**：

### Variant A: Information Hierarchy Focus
- 重新結構化內容層級
- 應用 Gestalt proximity — 相關項目靠近
- 每個視圖只有一個主要 action
- 使用現有 typography scale 創造清晰層次

### Variant B: Layout Model Exploration
- 嘗試不同佈局方式（card vs list vs table vs split-pane）
- 考慮每個 breakpoint 的響應行為
- 使用專案現有的 grid/layout 系統

### Variant C: Density Variation
- 如果 brief 說 "comfortable"，試試更 compact 版本
- 如果 brief 說 "compact"，試試更 spacious 版本
- 展示權衡：更多可見數據 vs 更易掃描

### Variant D: Interaction Model
- 不同互動模式（modal vs inline vs panel vs drawer）
- 應用反饋模式：immediate → progress → completion
- 實作所有需要的狀態（loading、error、empty、disabled）

### Variant E: Expressive Direction
- 推動用戶在問答中描述的品牌方向
- 探索專案現有設計 tokens 的不同使用方式
- 應用有意義的 motion（hover、focus、transitions）

---

## 變體生成規範

### 視覺風格推論

**⚠️ 不使用預定義風格。從專案中提取視覺語言：**

1. **如果偵測到 Tailwind**，讀取 `tailwind.config.js`：
   ```javascript
   theme.colors      // 色彩
   theme.spacing     // 間距
   theme.borderRadius // 圓角
   theme.fontFamily  // 字體
   theme.boxShadow   // 陰影
   ```

2. **如果存在 CSS Variables**，讀取 `globals.css`：
   ```css
   :root {
     --color-*     /* 色彩 tokens */
     --spacing-*   /* 間距 tokens */
     --radius-*    /* 圓角 tokens */
   }
   ```

3. **掃描現有組件**了解模式：
   - 找 2-3 個現有 buttons → 記錄樣式模式
   - 找 2-3 個現有 cards → 記錄 padding、borders、shadows
   - 找現有 forms → 記錄 input 樣式、label 位置

### 程式碼品質規範

遵循 `rules/baseline-ui.md` 的技術約束：

- **Components**: 使用無障礙 primitives（Base UI / React Aria / Radix）
- **Animation**: 只動畫 `transform`/`opacity`、≤200ms、尊重 `prefers-reduced-motion`
- **Typography**: `text-balance` 標題、`text-pretty` 內文
- **Layout**: 固定 `z-index` scale
- **States**: 每個互動元素都需要 default/hover/focus/active/disabled 狀態

### 變體頁面結構

```tsx
// .claude-design/lab/page.tsx

import { FeedbackOverlay } from './FeedbackOverlay';
import { VariantA, VariantB, VariantC, VariantD, VariantE } from './variants';

export default function DesignLabPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header - Design Brief 摘要 */}
      <header className="p-6 border-b">
        <h1>Design Lab: [Target Name]</h1>
        <p>Style: {brief.style} | User: {brief.persona}</p>
      </header>

      {/* Variant Grid */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-6">
        <div data-variant="A">
          <h2>Variant A: Hierarchy Focus</h2>
          <VariantA />
        </div>
        <div data-variant="B">
          <h2>Variant B: Layout Model</h2>
          <VariantB />
        </div>
        <div data-variant="C">
          <h2>Variant C: Density</h2>
          <VariantC />
        </div>
        <div data-variant="D">
          <h2>Variant D: Interaction</h2>
          <VariantD />
        </div>
        <div data-variant="E">
          <h2>Variant E: Expressive</h2>
          <VariantE />
        </div>
      </main>

      {/* Feedback Overlay - CRITICAL */}
      <FeedbackOverlay targetName="ComponentName" />
    </div>
  );
}
```

---

## 用戶反饋收集

### 互動式反饋（主要方式）

Design Lab 包含 Figma 風格的反饋覆蓋層：

1. 點擊 "Add Feedback" 按鈕
2. 點擊任何元素添加評論
3. 填寫 "Overall Direction" 欄位
4. 點擊 "Submit All Feedback"
5. 複製文字貼到終端機

### 反饋格式

```markdown
## Design Lab Feedback

**Target:** ComponentName
**Comments:** 3

### Variant A
1. **Button** (`[data-testid='submit']`)
   "Make this more prominent"

### Variant B
1. **Card** (`.product-card`)
   "Love this layout"

### Overall Direction
Go with Variant B's structure. Apply Variant A's button styling.
```

---

## 變體合併（Synthesize）

如果用戶喜歡多個變體的不同部分：

1. 創建新的混合變體（Variant F）
2. 結合用戶指出的特定元素
3. 更新 Design Lab 顯示 Variant F + 1-2 個原始變體比較
4. 再次收集反饋

支援多輪合併，直到用戶滿意。

---

## 輸出

確定設計方向後，產出：

```json
{
  "selectedVariant": "F",
  "synthesizedFrom": ["B", "A"],
  "designDecisions": {
    "layout": "Variant B's card grid",
    "buttons": "Variant A's prominent CTAs",
    "colors": "Original brand palette",
    "spacing": "Comfortable density"
  }
}
```

---

## 清理

**⚠️ 重要**：流程結束時必須清理臨時檔案：

- 刪除 `.claude-design/` 目錄
- 刪除 `app/__design_lab/` 路由
- 刪除 `app/__design_preview/` 路由

---

## 下一步

進入 Phase 3: Implementation，根據確定的設計產出程式碼。
