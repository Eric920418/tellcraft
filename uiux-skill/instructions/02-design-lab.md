# Phase 2: Design Lab

## 目標

根據 Design Brief 生成 5 個有意義差異的設計變體（Design System JSON），讓用戶比較選擇或合併。

---

## 輸入

- Design Brief（來自 Phase 1，含 Design Tier）
- BDD 規格（如有）
- 模板資訊（TemplateData）
- `uiuxDesignTier`：`'functional' | 'creative'`

---

## 執行流程

### Step 2.1: 變體生成

`proceedToVariantGeneration()` 調用 `generateDesignVariants()`，一次 LLM 調用生成 5 個 Design System：

```
proceedToVariantGeneration()
  ↓ 注入 Design Brief 到 template.description
  ↓ 傳入 state.uiuxDesignTier
  ↓
generateDesignVariants(template, bddSpec, productType, designTier)
  ↓ 根據 tier 調整 VARIANT_AXES（getVariantAxes）
  ↓ 注入 Anti-Default 哲學、Signature Element
  ↓ temperature: 0.4
  ↓
返回 5 個 DesignVariant（各含完整 DesignSystem JSON）
```

### Step 2.2: 變體展示

通過 WebSocket 推送變體給前端，使用 `richContent` 顯示：

```typescript
await sendMessage(conversationId, io, {
  content: '設計變體已生成完成！\n\n{variantDescriptions}',
  stage: 'uiux_variants_ready',
  layoutHint: 'split',
  richContent: {
    type: 'variant_picker',
    data: {
      variants,          // 5 個 DesignVariant
      selectedIds: [],
      fromUserIdeas: sourceType === 'ideas',
    },
  },
})
```

每個變體包含：
- `id`：A-E
- `name`：變體名稱
- `axis`：設計軸
- `description`：設計方向描述
- `previewDescription`：預覽效果描述
- `keyFeatures`：關鍵特點列表
- `designSystem`：完整 Design System（colors、typography、spacing、borderRadius、CSS variables）

### Step 2.3: 用戶選擇或合併

用戶通過文字訊息選擇，`handleVariantSelection()` 解析：

| 格式 | 範例 | 說明 |
|------|------|------|
| 單選 | `選擇 A`、`選擇變體 A`、`A` | 直接使用 Variant A 的 Design System |
| 合併 | `合併 A+C`、`A 和 C` | 合併多個變體的特定面向 |

### Step 2.4: 變體合併（Synthesize）

`synthesizeVariants()` 根據每個變體的 `axis` 決定合併策略：

| Axis | 合併內容 |
|------|---------|
| `hierarchy` | typography |
| `density` | spacing |
| `expressive` | accent color |
| `layout` | 佈局偏好（存入 metadata.layoutPreference） |
| `interaction` | 互動模式（存入 metadata.interactionModel） |

單選時直接使用該變體的 Design System，多選時以第一個為基礎合併其他。

---

## 設計軸

5 個變體必須探索不同的設計軸，**不是微調差異**：

### Variant A: Information Hierarchy Focus
- 重新結構化內容層級
- 應用 Gestalt proximity — 相關項目靠近
- 每個視圖只有一個主要 action
- 使用 typography scale 創造清晰層次

### Variant B: Layout Model Exploration
- 探索根本不同的空間組織方式
- 不只是 card/list/table 三選一，而是思考數據特性最適合什麼呈現
- 考慮非對稱佈局、分割面板、timeline、地圖式等

### Variant C: Density Variation
- 調整信息密度（compact / comfortable / spacious）
- 展示權衡：更多可見數據 vs 更易掃描
- 根據目標用戶選擇合適的密度

### Variant D: Interaction Model
- 探索不同互動模式（modal / inline / panel / drawer）
- 應用反饋模式：immediate → progress → completion
- 實作所有需要的狀態（loading、error、empty、disabled）

### Variant E: Expressive Direction
- 推動品牌方向的視覺表現力
- Creative tier 時特別大膽（漸層、獨特字體、不對稱佈局）
- 每個變體必須有 Signature Element

---

## Anti-Default 原則

注入到 `generateDesignVariants()` 的 prompt 中：

- **The Swap Test**：如果把字體換成 Inter，佈局換成 sidebar + card grid，設計感沒有不同 — 那沒有做設計
- **Infinite Expression**：同一個模式有無限種表達方式
- **Signature Element**：每個變體必須有一個只屬於這個產品的視覺/結構/互動元素

---

## Design Tier 影響

| 行為 | Functional | Creative |
|------|-----------|----------|
| Variant E prompt | 標準表現力 | 大膽視覺（漸層、不對稱、獨特字體） |
| 約束提示 | 禁止漸層/glow/多色 | 允許漸層（禁紫色多色）、多色 |
| Signature 要求 | token 命名、展示方式、導航模式 | 視覺效果、互動體驗、空間組織 |

---

## 降級策略

| 異常 | 處理 |
|------|------|
| Path A（有想法）變體生成失敗 | 切換到 Path B 模板選擇 |
| Path B（模板）變體生成失敗 | 顯示錯誤，請用戶重試 |
| 變體數量不是 5 個 | 返回錯誤 |
| JSON 解析失敗 | 返回錯誤 |

---

## 輸出

確定設計方向後，產出最終 `DesignSystem`：

```typescript
{
  cssVariables: string        // :root { --color-primary: ...; }
  tailwindExtend: { ... }     // Tailwind theme extend
  typography: { ... }         // 字體和 scale
  colorPalette: { ... }       // 完整色彩定義
  spacing: { ... }            // 間距系統
  borderRadius: { ... }       // 圓角系統
  metadata?: {                // 合併時的額外資訊
    layoutPreference?: string
    interactionModel?: string
  }
}
```

---

## 狀態更新

| 步驟 | FlowState.phase |
|------|----------------|
| 開始生成 | `uiux_generating_variants` |
| 變體就緒 | `uiux_variant_selection` |
| 用戶選擇後 | `uiux_code_generation` |

FlowState 相關欄位：
- `uiuxVariants`：生成的 5 個 DesignVariant
- `uiuxDesignSystem`：最終合併的 DesignSystem
- `uiuxDesignTier`：影響生成約束

---

## 下一步

進入 Phase 3: Implementation，使用最終 DesignSystem 進行三階段代碼生成（Structure → Animation → RWD）。
