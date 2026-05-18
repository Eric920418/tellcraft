# Chrome Web Store 上架文案

填寫到 https://chrome.google.com/webstore/devconsole 的「Store listing」表單。

---

## Item details

### Name (45 char max)
```
Tellcraft Editor
```

### Summary (132 char max) — 重要！搜尋結果直接顯示這行
```
Tellcraft 配套編輯器：點擊 Vercel preview 頁面任何元素直接改文字、顏色，修改即時同步回網站源碼
```

### Description (16000 char max)
```
Tellcraft Editor 讓你在 Tellcraft（tellcraft.com）生成的網站預覽頁面上「點擊任何元素直接編輯」，
不需要打開代碼編輯器、不需要重新 chat 描述修改需求。

═══ 功能 ═══

✏️ 點擊文字 → 改文字內容
🎨 點擊元素 → 改文字顏色 / 背景顏色
⚡ 即時 local preview，修改後 800ms 自動儲存到 Tellcraft 後端
🚀 修改觸發 Vercel 重新部署，新 URL 自動同步回 chat

═══ 怎麼用 ═══

1. 在 tellcraft.com 完成設計生成
2. Chat 預覽卡片點「✏️ 開啟編輯器」按鈕
3. 新分頁開啟 vercel preview，編輯器自動啟動
4. 點擊任何文字 / 按鈕 → 浮層彈出 → 開始編輯

═══ 安全 ═══

🔒 只在你的 Tellcraft preview 頁面運作（驗證 host 屬於該對話）
🔒 短期 scoped token (1 小時自動過期) 綁定特定對話，洩漏 blast radius 最小
🔒 不收集任何個人資料，不傳送任何資料給第三方
🔒 Privacy policy: https://tellcraft.com/zh/privacy/extension

═══ 需要先有 Tellcraft 帳號 ═══

本 Extension 只能配 Tellcraft 平台使用。請先到 tellcraft.com 註冊並生成至少一個網站。

═══ 開發者 ═══

Tellcraft Team
網站：https://tellcraft.com
問題回報：support@tellcraft.com
```

### Category
```
Developer Tools
```

### Language
```
繁體中文 (主) + English (副)
```

---

## Privacy practices

### Single purpose
```
提供 Tellcraft 用戶在 Vercel preview 頁面上 inline 編輯介面，把修改同步回 Tellcraft 後端
```

### Permission justifications

**storage**:
```
儲存 Tellcraft user token 與短期 scoped JWT，僅存本機 chrome.storage 不傳第三方
```

**cookies**:
```
預留 chrome.cookies API（commit 4 改用 localStorage sync 後實際未使用，下版本移除）
```

**host_permissions: https://*.vercel.app/***:
```
Inject content script 到 Tellcraft 生成的 Vercel preview 頁面，提供 inline 編輯介面
```

**host_permissions: https://tellcraft.com/***:
```
讀取 Tellcraft user token + 呼叫 Tellcraft API（auth exchange / verify preview / apply update）
```

### Privacy policy URL
```
https://tellcraft.com/zh/privacy/extension
```

### Data usage compliance
- [x] I do not sell or transfer user data to third parties
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

---

## Screenshots (5 張，1280x800 或 640x400)

待截：
1. tellcraft.com chat 內 ChatInlinePreviewCard 顯示「✏️ 開啟編輯器」按鈕
2. Vercel preview 頁面 + MiniPropertyEditor 浮層彈出（編輯中）
3. 編輯文字「之前 → 之後」對比
4. 編輯顏色 color picker UI
5. 編輯後新 preview URL 自動 sync chat 卡片

---

## Promo tile (440x280, optional 但建議)

設計：
- 黑底（#0f172a）+ 白色 "Tellcraft Editor"
- 右側 mockup 顯示 chrome iframe + 編輯浮層
- 標語「Click. Edit. Ship.」

---

## 上架步驟

1. 註冊 Chrome Web Store Developer 帳號（$5 一次性）
   https://chrome.google.com/webstore/devconsole/register

2. 點 "New item" → 上傳 `tellcraft-extension-v0.1.0.zip`（用 `pnpm package` 產）

3. 填上面文案各欄位

4. 上傳 5 張 screenshots + privacy policy URL

5. 提交審核 — 通常 1-3 天

6. 通過後拿到正式 ID（類似 `abcdefghijklmnopqrstuvwxyz`）
   - 更新 `app/hooks/useExtensionDetect.ts` 的 `EXTENSION_INSTALL_URL`
   - 把 PLACEHOLDER 換成 `https://chrome.google.com/webstore/detail/tellcraft-editor/<ID>`

7. tellcraft.com 重新部署 → 用戶 chat 內「安裝 Tellcraft Editor」連結指向真實 Chrome Store
