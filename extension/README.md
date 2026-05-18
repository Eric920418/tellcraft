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
| 2 | scaffold MV3 + esbuild | ✅ done (b8a63c62) |
| 3 | backend auth + verify-preview endpoints | ✅ done (2b56a168) |
| 4 | auth + bridge injection 端對端 console log | ✅ done (0d88e5e3) |
| 5 | PropertyEditor mount Shadow DOM | ✅ done (c8857a17) |
| 6 | extension-apply-skill + regex unique match + redeploy | ✅ done (ddb88725) |
| 7 | ChatInlinePreviewCard 加「開啟編輯器」按鈕 + 偵測 | ✅ done (d5d17c11) |
| 8 | telemetry + packaging script | 🟡 此 commit |

## 端到端驗證 SOP（commit 1-7 全 ship 後）

### 前提
- VPS deploy 完成（GitHub Actions 跑完 main）
- 你在 tellcraft.com 已登入

### 步驟

1. **裝 extension**：
   ```bash
   cd extension && pnpm install && pnpm build
   # chrome://extensions → 開發者模式 → 載入未封裝 → 選 extension/dist
   ```

2. **訪問 tellcraft.com**：
   - F12 console 應看：`[Tellcraft Detector] ✓ user token synced to extension (authenticated)`
   - background service worker DevTools (chrome://extensions → Tellcraft → Service Worker) 應看：`[Tellcraft BG] user token synced: ✓ stored`

3. **進你的對話**（如 `?conversation=adf8b619-...`）：
   - 等預覽就緒 → ChatInlinePreviewCard 顯示 **兩個按鈕**：「✏️ 開啟編輯器」+「在新分頁開啟預覽 ↗」（這證明 extension 偵測 work）
   - 沒裝 extension 時只有「在新分頁開啟預覽」+ 底部「安裝 Tellcraft Editor」連結

4. **點「✏️ 開啟編輯器」**：
   - 新分頁開 vercel preview URL + `#tc=convId.nonce`
   - F12 console 應依序看：
     ```
     [Tellcraft Bridge-Injector] MAIN world script loaded
     [Tellcraft Bootstrap] L1 hash detected
     [Tellcraft Bootstrap] ✓ L2 scoped token issued
     [Tellcraft Bootstrap] ✓ L3 host verified
     [Tellcraft Bootstrap] ✓ __TC_EXTENSION_READY__ flag set
     [Tellcraft Bridge-Injector] ✓ EDIT_BRIDGE_SCRIPT injected, length: 11184
     [Tellcraft Overlay] ✓ mounted in Shadow DOM
     ```

5. **點頁面任何 unique 文字元素**（如 hero h1）：
   - 浮層彈出 MiniPropertyEditor — 顯示元素 `<tag> id` + 3 個欄位（文字內容 / 文字顏色 / 背景顏色）

6. **改文字**：
   - 即時看頁面文字變更（樂觀 local preview）
   - 800ms 後浮層顯示「儲存中…」→ 成功變「變更會自動儲存」
   - 後端 telemetry `extension_update_applied` patternKey=`text-unique`
   - 30-60s 後 chat 卡片收到 socket.io `preview:ready` 更新到新 vercel URL（修改持久化）

### 失敗 case

- **「儲存失敗：text-not-unique」**：該字串在源碼出現 >1 次（commit 8+ Babel AST 補）→ 改用 chat iteration
- **「儲存失敗：請先在 tellcraft.com 登入」**：tellcraft.com tab 沒登入或 token 過期 → 重新登入後 detector sync
- **編輯器沒彈出**：F12 看是哪層 fail（L1/L2/L3），參考 console 訊息

## Chrome Web Store 上架（commit 8）

```bash
pnpm build
pnpm package  # 產 tellcraft-extension-v0.1.0.zip
# 上傳到 https://chrome.google.com/webstore/devconsole
```

上架前 checklist:
- [ ] icons/ 真實 PNG 16/32/48/128（commit 2 暫拿掉，臨上架補）
- [ ] manifest.json action.default_icon + icons 區塊重啟用
- [ ] Privacy policy URL（Chrome 強制要求）
- [ ] Store listing screenshot 5 張
