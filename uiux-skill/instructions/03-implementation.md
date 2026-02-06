# Phase 3: Implementation

## 目標

根據 Phase 2 確定的 DesignSystem，分三階段漸進式生成 Next.js + Tailwind CSS 前端程式碼。每個階段生成後用戶可預覽、確認或重做。

---

## 輸入

- `DesignSystem`（來自 Phase 2 的最終設計系統）
- `DesignTier`（`'functional' | 'creative'`）
- 模板資訊（TemplateData，含 pageStructure）
- BDD 規格（如有）

---

## 三階段生成流程

```
Phase 2 完成
  ↓ state.phase = 'uiux_code_generation'
  ↓ state.uiuxCodePhase = 'structure'
  ↓
executeCodePhaseStructure()
  ↓ generateStructure(designSystem, pages, template, bddSpec, designTier)
  ↓ parseGeneratedFiles() 解析 LLM 輸出
  ↓ WebSocket 推送 code_preview + 等待用戶確認
  ↓
用戶：「繼續」→ executeCodePhaseAnimation()
用戶：「重新生成」→ 重做 Structure
  ↓
executeCodePhaseAnimation()
  ↓ generateAnimations(designSystem, existingCode, designTier)
  ↓ 在現有代碼基礎上添加動畫
  ↓ WebSocket 推送 code_preview + 等待用戶確認
  ↓
用戶：「繼續」→ executeCodePhaseRwd()
用戶：「重新生成」→ 重做 Animation
  ↓
executeCodePhaseRwd()
  ↓ generateRwd(designSystem, existingCode, designTier)
  ↓ 在現有代碼基礎上添加響應式設計
  ↓ state.phase = 'uiux_complete'
  ↓ 生成完成
```

---

## Stage 1: Structure（結構生成）

**函數**：`generateStructure(designSystem, pages, template, bddSpec?, designTier?)`

**輸入**：
- DesignSystem（CSS variables、Tailwind extend、色彩、字體、間距）
- 頁面清單（來自 template.pageStructure.pages）
- 模板資訊和 BDD 規格

**生成內容**：
- 靜態桌面版頁面結構
- 基礎組件
- 全域樣式（CSS variables + Tailwind config）
- Design tokens 應用

**Prompt 注入規則**：
- Professional UI Rules（SVG icon、cursor-pointer、對比度、佈局細節）
- 無障礙基本功（html lang、Skip Link、Heading 層級、aria-live）
- 根據 designTier 注入 `getStructureConstraints(tier)`
- Craft Foundations（`getCraftFoundations()`）

**輸出格式**（LLM 回傳）：
```
\`\`\`tsx:app/page.tsx
// 頁面代碼
\`\`\`

\`\`\`tsx:components/ui/Card.tsx
// 組件代碼
\`\`\`

\`\`\`css:styles/globals.css
// 全域樣式
\`\`\`
```

`parseGeneratedFiles()` 解析規則：
- `tsx:` 開頭 → 路徑含 `/page.tsx` 歸入 pages，否則歸入 components
- `css:` 開頭 → 歸入 styles

**用戶確認**：
- ✅ 繼續 → 進入 Stage 2
- 🔄 重新生成 → 重做 Structure

---

## Stage 2: Animation（動畫增強）

**函數**：`generateAnimations(designSystem, existingCode, designTier?)`

**輸入**：
- DesignSystem
- Stage 1 生成的完整代碼（pages + components + styles）

**生成內容**：
- 頁面入場動畫
- 按鈕 hover/tap 效果
- 卡片懸浮效果
- Loading 動畫
- 狀態轉換動畫

**Prompt 注入規則**：
- 根據 designTier 注入 `getAnimationConstraints(tier)`
  - functional：動畫克制，只用 fade + subtle scale
  - creative：允許 spring physics、stagger reveal、scroll-trigger
- 必須遵守 baseline-ui 動畫規則（只 transform/opacity、≤200ms 互動反饋）

**Fallback**：
- 動畫生成失敗時，保留 Stage 1 代碼不變（頁面和組件 fallback 到 existingCode）

**用戶確認**：
- ✅ 繼續 → 進入 Stage 3
- 🔄 重新生成 → 重做 Animation

---

## Stage 3: RWD（響應式設計）

**函數**：`generateRwd(designSystem, existingCode, designTier?)`

**輸入**：
- DesignSystem
- Stage 2 生成的完整代碼（含動畫）

**生成內容**：
- Mobile-first 響應式佈局
- 漢堡選單
- 觸控優化
- Breakpoint 適配

**Prompt 注入規則**：
- Pre-Delivery Checklist（排版/互動/對比度/佈局/效能/無障礙自檢）
- 根據 designTier 注入約束

**Fallback**：
- RWD 生成失敗時，保留 Stage 2 代碼不變

**完成後**：
- `state.uiuxCodePhase = 'complete'`
- `state.phase = 'uiux_complete'`
- 最終代碼保存到 BDD Session

---

## 技術約束

### Stack

| 技術 | 用法 |
|------|------|
| Next.js App Router | Server Components 優先，互動時才用 `'use client'` |
| Tailwind CSS | Utility-first，使用 DesignSystem 的 CSS variables |
| `motion/react` | JavaScript 動畫（**不是** framer-motion） |
| `tw-animate-css` | 入場和微互動動畫 |
| `cn` utility | clsx + tailwind-merge |
| Base UI / Radix / React Aria | 無障礙 primitives（不混用） |

### 代碼檔案格式

LLM 必須使用 ```` ```tsx:路徑 ```` 和 ```` ```css:路徑 ```` 格式輸出代碼：

```
\`\`\`tsx:app/page.tsx
export default function HomePage() { ... }
\`\`\`

\`\`\`tsx:app/layout.tsx
export default function RootLayout({ children }) { ... }
\`\`\`

\`\`\`css:styles/globals.css
@import "tailwindcss";
/* ... */
\`\`\`
```

### Responsive Breakpoints

Mobile-first：
- `sm:` 640px+
- `md:` 768px+
- `lg:` 1024px+
- `xl:` 1280px+
- `2xl:` 1536px+

---

## Design Tier 影響

| 行為 | Functional | Creative |
|------|-----------|----------|
| Structure 約束 | 禁止漸層/glow/多色 | 允許漸層（禁紫色多色）、多色點綴 |
| Animation 約束 | 克制，只 fade + subtle scale | 豐富：spring、stagger、scroll-trigger |
| 佈局 | 標準 grid/flex | 不對稱、overlap、grid-breaking OK |
| 字體 | 標準（禁 Inter/Roboto/Arial） | 獨特有個性的字體搭配 |
| RWD | 標準響應式 | 可以有表現力的 breakpoint 變化 |

---

## 降級策略

| 異常 | 處理 |
|------|------|
| Stage 1 失敗 | 顯示錯誤，流程終止 |
| Stage 2 失敗 | 顯示錯誤，用戶可重試或跳到 Stage 3 |
| Stage 3 失敗 | 顯示錯誤，用戶可重試，代碼保留 Stage 2 狀態 |
| `parseGeneratedFiles()` 解析不到檔案 | Fallback 到上一階段代碼 |

---

## 狀態更新

| 步驟 | FlowState.phase | uiuxCodePhase |
|------|----------------|---------------|
| 開始 Structure | `uiux_code_generation` | `structure` |
| Structure 完成 | `uiux_code_generation` | `structure`（waitingForReply） |
| 開始 Animation | `uiux_code_generation` | `animation` |
| Animation 完成 | `uiux_code_generation` | `animation`（waitingForReply） |
| 開始 RWD | `uiux_code_generation` | `rwd` |
| RWD 完成 | `uiux_complete` | `complete` |

FlowState 相關欄位：
- `uiuxCodePhase`：`'structure' | 'animation' | 'rwd' | 'complete'`
- `uiuxGeneratedCode`：`{ pages, components, styles }` 每階段累積
- `uiuxDesignSystem`：Phase 2 的最終設計系統
- `uiuxDesignTier`：影響生成約束

---

## WebSocket 訊息格式

每階段完成後推送：

```typescript
await sendMessage(conversationId, io, {
  content: '**階段 N/3 完成：...**\n\n...\n\n✅ **繼續** - ...\n🔄 **重新生成** - ...',
  stage: 'uiux_structure_complete' | 'uiux_animation_complete' | 'uiux_rwd_complete',
  progress: { current: N, total: 3, step: '...' },
  layoutHint: 'split',
  richContent: {
    type: 'code_preview',
    data: {
      pages,           // GeneratedComponent[]
      components,      // GeneratedComponent[]
      styles,          // string
      tailwindConfig,  // 從 DesignSystem 生成
      currentPhase,    // 'structure' | 'animation' | 'rwd'
    },
  },
})
```

用戶回覆解析（`handleContinueFlow`）：
- `繼續` / `下一步` / `好` / `可以` / `Y` → `handleCodePhaseConfirm()`
- `重新生成` / `重做` → `handleCodePhaseRedo()`

---

## 輸出

最終產出保存到 BDD Session：

```typescript
{
  generatedPages: GeneratedComponent[]     // { path: string, content: string }[]
  generatedComponents: GeneratedComponent[] // { path: string, content: string }[]
  generatedStyles: string                   // 全域 CSS
}
```
