# Phase 1: Design Discovery

## 目標

從 BDD 規格或用戶描述中提取前端需求，並透過多輪問答釐清設計偏好。

---

## 輸入

- BDD Session 產出的規格（如有）
- 用戶原始需求描述
- 專案背景資訊

---

## 執行步驟

### Step 1.1: 自動偵測專案環境

在開始問答前，自動偵測：

```typescript
// 偵測項目
const detection = {
  // Package Manager
  packageManager: detectLockFile(), // pnpm-lock.yaml → pnpm

  // Framework
  framework: detectFramework(), // next.config.* → Next.js App Router

  // Styling System
  styling: detectStyling(), // tailwind.config.* → Tailwind CSS

  // Existing Components
  existingComponents: scanComponents(), // 找出現有組件模式

  // Design Memory
  designMemory: findDesignMemory(), // 檢查是否有設計記憶
}
```

### Step 1.2: 提取前端需求

從 BDD 規格中提取：

| 來源 | 提取項目 |
|------|---------|
| Feature Files | 功能列表、用戶流程 |
| Schema | Entity 對應的列表/表單/詳情頁 |
| Actions | 需要的互動（按鈕、表單提交） |

### Step 1.3: 設計問答

使用 `AskUserQuestion` 工具進行問答。

#### 問題 1: 範圍確認
- **Header**: "Scope"
- **Question**: "我們要設計的是單一組件、單頁還是完整專案？"
- **Options**:
  - "Component" - 單一可重用組件
  - "Page" - 完整頁面或畫面
  - "Full Project" - 整個專案的所有頁面

#### 問題 2: 產品類型
- **Header**: "Product Type"
- **Question**: "這是什麼類型的產品？"
- **Options**:
  - "SaaS Dashboard" - 管理後台、數據儀表板
  - "Landing Page" - 行銷頁面、產品介紹
  - "E-commerce" - 電商、購物
  - "Content/Blog" - 內容網站、部落格

#### 問題 3: 視覺風格
- **Header**: "Style"
- **Question**: "你偏好什麼視覺風格？"
- **Options**:
  - "Minimal" - 極簡、乾淨、大量留白
  - "Professional" - 專業、穩重、企業感
  - "Playful" - 活潑、友善、有趣
  - "Premium" - 高端、精緻、奢華

#### 問題 4: 參考網站
- **Header**: "Reference"
- **Question**: "有沒有喜歡的參考網站或產品？"
- **Options**:
  - "Stripe" - 乾淨、現代、值得信賴
  - "Linear" - 密集、鍵盤優先、開發者導向
  - "Notion" - 靈活、內容導向、有趣
  - "Apple" - 高端、寬敞、精緻

#### 問題 5: 配色傾向
- **Header**: "Color"
- **Question**: "配色偏好？"
- **Options**:
  - "Neutral" - 灰階為主，點綴色少
  - "Brand Color" - 以品牌色為主軸
  - "Vibrant" - 鮮豔、大膽
  - "Muted" - 柔和、低飽和

#### 問題 6: Dark Mode
- **Header**: "Dark Mode"
- **Question**: "需要支援深色模式嗎？"
- **Options**:
  - "Yes" - 必須支援
  - "No" - 只要淺色模式
  - "Nice to have" - 如果方便的話

#### 問題 7: 目標用戶
- **Header**: "User"
- **Question**: "主要使用者是誰？"
- **Options**:
  - "Developer" - 技術人員、鍵盤導向
  - "Business User" - 商務人員、效率導向
  - "End Consumer" - 一般消費者、各種技術程度
  - "Designer" - 設計師、視覺導向

#### 問題 8: 使用情境
- **Header**: "Context"
- **Question**: "主要使用情境？"
- **Options**:
  - "Desktop-first" - 主要在大螢幕使用
  - "Mobile-first" - 主要在手機使用
  - "Both equally" - 兩者都要重視

---

## 輸出

產出 Design Brief（JSON 格式）：

```json
{
  "scope": "full",
  "productType": "saas-dashboard",
  "style": {
    "direction": "minimal",
    "references": ["Stripe", "Linear"],
    "adjectives": ["clean", "professional", "trustworthy"]
  },
  "color": {
    "preference": "neutral",
    "brandColor": null,
    "darkMode": true
  },
  "persona": {
    "primary": "Developer",
    "context": "desktop-first"
  },
  "constraints": {
    "framework": "nextjs-app",
    "styling": "tailwind",
    "packageManager": "pnpm"
  },
  "detection": {
    "existingComponents": ["Button", "Card", "Input"],
    "designMemory": null
  }
}
```

---

## 狀態更新

完成 Discovery 後，更新 UIUX Session：

```typescript
await updateUiuxSession({
  sessionId,
  updates: {
    currentPhase: 'design_lab',
    designBrief: designBrief,
  },
})
```

---

## 下一步

進入 Phase 2: Design Lab，根據 Design Brief 生成設計變體。
