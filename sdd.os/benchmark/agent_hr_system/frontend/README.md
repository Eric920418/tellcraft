# 特務人資系統 - 前端專案

基於 Next.js、TypeScript、Tailwind CSS 和 Ant Design 建立的現代化人資管理系統。

## 特色

- 🎨 清新、專業帶點小文青的設計風格
- ⚡ Next.js 16 App Router
- 🎯 TypeScript 類型安全
- 💅 Tailwind CSS + Ant Design 組件庫
- 📱 響應式設計
- 🎭 Mock API 完整模擬後端

## 功能模組

### 1. 打卡系統 (`/`)
- 即時時鐘顯示
- 上班/下班打卡
- 今日工時統計
- 加班時數計算
- 打卡記錄時間軸

### 2. 請假管理 (`/leave`)
- 提交請假申請（全日假/時段假）
- 支援多種假別：特休、年假、病假
- 請假記錄查詢
- 狀態追蹤（待審核/已批准/已拒絕）

### 3. 打卡記錄查詢 (`/records`)
- 按日期查詢打卡記錄
- 工作時段統計
- 刪除未完成的打卡記錄
- 時間軸視覺化展示

### 4. 工時摘要 (`/summary`)
- 每日工時統計
- 工時完成度進度條
- 加班時數分析
- 視覺化圖表展示

## 技術棧

- **框架**: Next.js 16 (App Router)
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **UI 組件**: Ant Design
- **日期處理**: Day.js
- **狀態管理**: React Hooks

## 安裝與運行

### 安裝依賴

\`\`\`bash
npm install
\`\`\`

### 開發模式

\`\`\`bash
npm run dev
\`\`\`

訪問 [http://localhost:3000](http://localhost:3000) 查看應用。

### 建置生產版本

\`\`\`bash
npm run build
npm run start
\`\`\`

## 專案結構

\`\`\`
frontend/
├── src/
│   ├── app/                  # Next.js App Router 頁面
│   │   ├── page.tsx         # 打卡首頁
│   │   ├── leave/           # 請假管理
│   │   ├── records/         # 打卡記錄
│   │   ├── summary/         # 工時摘要
│   │   ├── layout.tsx       # 根佈局
│   │   └── globals.css      # 全域樣式
│   ├── components/          # 共用組件
│   │   └── Layout.tsx       # 主要佈局組件
│   └── services/            # API 服務
│       └── mockApi.ts       # Mock API
├── tailwind.config.ts       # Tailwind 配置
└── package.json
\`\`\`

## Mock API 功能

Mock API 完全模擬後端行為，包含：

- ✅ 打卡驗證（順序、時間、衝突檢測）
- ✅ 請假申請與衝突檢測
- ✅ 工時自動計算
- ✅ 加班時數統計
- ✅ 跨日打卡限制
- ✅ 打卡記錄刪除

## 設計主題

### 配色方案

- **主色調 (Primary)**: 天空藍系列 (#0ea5e9)
- **輔助色 (Sage)**: 鼠尾草綠系列 (#657665)
- **背景**: 漸層白色到淺藍 (#f6f7f6 → #e8f4f8)

### 設計理念

- 清新：淺色系配色，舒適的視覺體驗
- 專業：規範的佈局，清晰的資訊架構
- 文青：柔和的色調，優雅的字體搭配

## 業務規則

系統實現了完整的 ISA 規範：

1. **打卡規則**
   - 必須先 IN 才能 OUT
   - 不能連續兩次 IN 或 OUT
   - 不能使用未來時間
   - 不能跨日打卡
   - 禁止在請假時段打卡

2. **請假規則**
   - 支援全日假和時段假
   - 請假時段不能有打卡記錄
   - 自動衝突檢測

3. **工時計算**
   - 標準工時 8 小時
   - 超過 8 小時計入加班
   - 即時更新每日累計工時

## 後續開發

可以替換 Mock API 為真實的後端 API：

1. 在 `src/services/` 建立真實 API 服務
2. 使用 axios 或 fetch 連接後端
3. 更新組件中的 API 調用

## 授權

此專案為特務人資系統的前端實現範例。
