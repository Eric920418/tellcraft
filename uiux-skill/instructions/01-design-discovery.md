# Phase 1: Design Discovery

## 目標

BDD 規格完成後，透過雙軌流程探索用戶的設計偏好，建立 Design Brief。

---

## 輸入

- BDD Session 產出的規格（如有）
- 用戶原始需求描述
- 專案背景資訊

---

## 執行步驟

### Step 1.1: 設計偏好決策點

BDD 階段結束後，系統詢問用戶：

```
接下來是 UI/UX 設計階段。

你對產品的外觀有什麼想法嗎？

**A.** 我有一些想法，想跟你討論
**B.** 沒有特別的想法，給我看看模板
```

**判斷邏輯**：
- 用戶回覆 `A` / 包含「有想法」「想討論」「我想要」→ 進入 **Path A**
- 用戶回覆 `B` / 包含「沒有」「看模板」「沒想法」→ 進入 **Path B**
- 其他回覆 → 視為有想法，將訊息作為第一個設計想法，進入 **Path A**

---

## Path A: 4 步設計釐清（有想法）

逐步收集用戶的設計偏好，共 4 個問題：

### Step A.1: Feeling（感覺）

```
很好！讓我來了解你的設計想法。

首先，請告訴我：

**你希望產品給用戶什麼樣的感覺？**

_例如：專業可靠、活潑有趣、簡約現代、溫暖親切..._
```

### Step A.2: Reference（參考）

```
你有沒有喜歡的網站或 App 可以參考？

_可以提供名稱或網址，例如：Notion、Stripe、Apple..._
```

### Step A.3: Color（配色）

```
你對顏色有什麼偏好嗎？

_例如：藍色系、暖色調、黑白灰、品牌色是 #FF5733..._
```

### Step A.4: Layout（佈局）

```
你偏好什麼樣的佈局風格？

_例如：簡潔留白、內容密集、卡片式、列表式..._
```

### Path A 完成後

4 步回答收集完畢後，使用推斷函數從用戶想法建立虛擬模板：

1. **`inferCategoryFromIdeas(ideas)`**：根據回答推斷產品類別
   - 包含「dashboard / 後台 / 管理」→ `dashboard`
   - 包含「電商 / 購物 / ecommerce」→ `ecommerce`
   - 包含「landing / 行銷 / 宣傳」→ `landing`
   - 包含「saas / 工具 / 平台」→ `saas`
   - 其他 → `general`

2. **`inferDesignDefaultsFromIdeas(ideas)`**：根據回答推斷設計默認值
   - 從 `color` 回答推斷 `colorScheme`（blue / green / red / dark / warm）
   - 從 `layout` 回答推斷 `spacing`（spacious / compact）

3. 組合成 `TemplateData` 物件，進入 **Design Brief 確認**

### Path A 失敗 Fallback

如果 4 步問答無法成功推斷（例如用戶回答過於模糊），自動切換到 Path B 的模板選擇流程。

---

## Path B: 模板選擇（沒想法）

直接從資料庫載入所有可用模板，以 `template_picker` 介面展示：

```typescript
// 發送模板選擇器
await sendMessage(conversationId, io, {
  content: '好的！請從下方選擇一個設計模板作為起點：',
  stage: 'uiux_template_picker',
  layoutHint: 'split',
  richContent: {
    type: 'template_picker',
    data: {
      templates,        // 所有模板（含 thumbnailUrl, previewImageUrl, tags 等）
      recommendedIds,   // 推薦模板 ID（isFeatured = true）
      selectedTemplateId: null,
    },
  },
})
```

用戶選擇模板後，進入 **Design Brief 確認**。

---

## Design Brief 確認（Path A / Path B 匯流）

兩條路徑都會進入 `startDesignBriefConfirm()`，AI 作為設計顧問總結用戶的設計方向：

### 流程

```
Path A → completeDesignClarify() ──┐
                                   ├→ startDesignBriefConfirm() → uiux_design_brief_confirm
Path B → handleTemplateSelection() ┘    ↓（用戶確認/調整，最多 3 輪）
                                   proceedToVariantGeneration() → uiux_variant_selection
```

### AI 設計顧問行為

- **Path A（有想法）**：分析用戶 4 步回答，整理設計方向，給出專業建議
- **Path B（沒想法）**：分析模板特色，主動建議可調整的方向（因為用戶沒想法，AI 更主動）
- **Design Tier 推薦**：根據產品類型自動推薦 functional 或 creative tier

### Design Tier（功能型 vs 創意型）

AI 設計顧問會在 Brief 中推薦 Design Tier，影響後續所有生成階段的約束集：

| Tier | 適用場景 | 約束特點 |
|------|----------|----------|
| **functional**（功能型） | dashboard、SaaS、電商管理、admin | 禁止漸層/glow/多色、動畫克制、標準佈局 |
| **creative**（創意型） | landing page、品牌官網、作品集、行銷頁 | 允許漸層、多色點綴、獨特字體、大膽佈局、豐富動畫 |

**推薦邏輯**：
- 模板類別為 `landing` / `portfolio` / `marketing` / `brand` → 推薦 creative
- 模板類別為 `dashboard` / `saas` / `ecommerce` / `admin` → 推薦 functional
- 模板類別為 `general` → 根據用戶回答的感覺和產品類型綜合判斷

**用戶可在調整時切換 tier**：
- 「我想要更有創意的設計」「更大膽」→ 切換到 creative
- 「簡單就好」「功能優先」→ 切換到 functional

### 展示內容

```
## 設計方向確認

**設計模式**：創意型（推薦）
_品牌官網適合更有表現力的設計，包含漸層背景、獨特字體、豐富的動畫效果_

**風格定位**：{styleSummary}
**色彩方向**：{colorDirection}
**佈局建議**：{layoutSuggestion}
**參考分析**：{referenceAnalysis}

**專業建議**：
- {recommendation1}
- {recommendation2}

---

如果沒有要調整的，我就開始生成設計方案了？
也可以告訴我想調整的部分，例如：「顏色想暖一點」、「佈局改卡片式」、「我想要更有創意的設計」
```

### 用戶回覆處理

- **確認**（好/可以/沒問題/確認/OK/Y/沒有/就這樣/開始/proceed）→ 進入變體生成
- **調整要求** → 呼叫 `adjustDesignBrief()` 修改後重新展示（最多 3 輪）
- **Tier 切換**：調整時 LLM 會根據用戶措辭自動切換 tier
- **第 3 輪到達** → 自動進入變體生成

### 降級策略

如果 Design Brief 生成失敗，跳過確認環節直接進入變體生成（tier 默認 functional）。

---

## 輸出

兩條路徑最終都產出一個 `TemplateData` 物件（經 Design Brief 增強），包含：

```typescript
{
  id: string           // 模板 ID 或 'custom'
  name: string         // 模板名稱或 'Custom Design'
  slug: string
  category: string     // 推斷或選擇的類別
  description: string  // 設計摘要（含 AI 設計顧問建議）
  designDefaults: {
    colorScheme?: string
    typography?: string
    spacing?: string
    borderRadius?: string
  }
  pageStructure: {
    pages?: string[]
    components?: string[]
  }
}
```

---

## 狀態更新

| 路徑 | 階段流程 |
|------|----------|
| Path A（4步完成） | `uiux_design_clarify` → `uiux_design_brief_confirm` → `uiux_variant_selection` |
| Path B（模板選定） | `uiux_template_selection` → `uiux_design_brief_confirm` → `uiux_variant_selection` |

FlowState 相關欄位：
- `uiuxDesignClarifyStep`: 1-4（Path A 進度追蹤）
- `uiuxDesignIdeas`: `Array<{ step: string; answer: string }>`（Path A 回答記錄）
- `uiuxTemplateId`: 選擇的模板 ID（Path B）
- `uiuxDesignBrief`: AI 生成的設計方向摘要
- `uiuxDesignBriefRound`: 確認輪數（1-3）
- `uiuxDesignBriefHistory`: 確認對話歷史
- `uiuxPreparedTemplate`: 準備好的模板資料
- `uiuxDesignTier`: `'functional' | 'creative'`（Design Tier，影響所有生成約束）

---

## 下一步

用戶確認 Design Brief 後，進入 Phase 2: Design Lab，根據增強後的 TemplateData 生成 5 個設計變體。
