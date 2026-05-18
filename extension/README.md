# Tellcraft Editor — Chrome Extension MV3

在 Vercel preview 頁面 inline 編輯 Tellcraft 生成的網站。配合 tellcraft.com chat 使用。

## 安裝（開發者模式 unpacked）

```bash
# 1. 安裝依賴
cd extension
pnpm install

# 2. Build dist
pnpm build

# 3. Chrome 載入未封裝
# - 開 chrome://extensions
# - 開啟右上「開發者模式」
# - 點「載入未封裝項目」
# - 選 extension/dist 目錄
```

成功會看到工具列出現 Tellcraft 圖示。

## 開發 watch 模式

```bash
pnpm build:watch
# 改 src/ 任何檔 → esbuild 自動 rebuild dist/
# 改 dist/ 後在 chrome://extensions 找 Tellcraft → 點「重新載入」icon
```

## 架構

| 檔案 | World | 職責 |
|------|-------|------|
| `src/background.ts` | service worker | Tellcraft API proxy + scoped JWT + telemetry |
| `src/content/bootstrap.ts` | ISOLATED | chrome.* APIs context，handshake + mount overlay（commit 4+5） |
| `src/content/bridge-injector.ts` | MAIN | page DOM context，inject EDIT_BRIDGE_SCRIPT 啟動 tc_* 協議 |
| `src/content/tellcraft-detector.ts` | ISOLATED on tellcraft.com | 回 tc_extension_pong 讓主站偵測 extension 安裝 |
| `src/popup/popup.tsx` | popup | toolbar 圖示點開的小視窗 |
| `src/shared/messages.ts` | — | 型別化 message 協議 + parseTcHash |
| `src/shared/api-client.ts` | bg only | Tellcraft backend HTTP wrapper |

## EDIT_BRIDGE_SCRIPT 單一 source of truth

`bridge-injector.ts` 透過 `__EDIT_BRIDGE_SCRIPT__` 內嵌字串常數，**build 時** 由 `build.mjs` 從 `app/lib/edit-bridge-script.ts` 抽取 IIFE — 跟 tellcraft frontend 的 WebContainerPreview 用同一份協議定義。

改 tc_* 協議只需動 `app/lib/edit-bridge-script.ts`，extension 重 build 即同步。

## Commit 進度

| Commit | 內容 | 狀態 |
|--------|------|------|
| 1 | refactor: 抽 EDIT_BRIDGE_SCRIPT | ✅ done (8703a7a3) |
| 2 | scaffold MV3 + esbuild | 🟡 此 commit |
| 3 | backend auth + verify-preview endpoints | ⬜ |
| 4 | auth + bridge injection 端對端 console log | ⬜ |
| 5 | PropertyEditor mount Shadow DOM | ⬜ |
| 6 | extension-apply-skill + AST patch + redeploy | ⬜ |
| 7 | ChatInlinePreviewCard 加「開啟編輯器」按鈕 | ⬜ |
| 8 | telemetry + Playwright E2E + Chrome Web Store | ⬜ |
