/**
 * /[locale]/privacy/extension — Tellcraft Editor Chrome Extension Privacy Policy
 *
 * Chrome Web Store 強制要求每個 extension 提供 privacy policy URL
 * 此頁面填到 store listing 的「Privacy practices → Single purpose policy URL」
 */

export const metadata = {
  title: 'Tellcraft Editor — Privacy Policy',
  description: 'Privacy policy for Tellcraft Editor Chrome Extension',
}

export default function ExtensionPrivacyPage() {
  return (
    <article style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px', fontFamily: '-apple-system, sans-serif', lineHeight: 1.7, color: '#0f172a' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Tellcraft Editor — Privacy Policy</h1>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 32 }}>Last updated: 2026-05-18</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>Single Purpose</h2>
      <p>
        Tellcraft Editor 是 Tellcraft（tellcraft.com）配套的 Chrome Extension，
        唯一用途為：在用戶於 Tellcraft 平台所生成的 Vercel preview 網頁上，
        提供 inline 編輯介面（修改文字內容、顏色），並把修改同步回 Tellcraft 後端。
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>Data Collection</h2>
      <p><strong>本 Extension 不直接收集任何 personally identifiable information (PII)。</strong></p>
      <p>運作所需的最小資料如下：</p>
      <ul>
        <li><strong>Authentication token</strong>：從 tellcraft.com 同源頁面 localStorage 讀取，用於向 Tellcraft 後端證明用戶身份。Token 僅存於 chrome.storage.local（本機）+ chrome.storage.session（瀏覽器 session 內 scoped JWT），絕不上傳第三方。</li>
        <li><strong>編輯內容</strong>：用戶在 Vercel preview 頁面修改的文字 / 顏色等，會傳送到 Tellcraft 後端（tellcraft.com）以更新該用戶自己的網站源碼。不用於任何其他用途。</li>
        <li><strong>Preview 頁面 host name</strong>：例如 cms-xxx.vercel.app，用於後端驗證該 preview 屬於該對話。</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>Data Storage</h2>
      <ul>
        <li><strong>chrome.storage.local</strong>: 儲存 Tellcraft user token (僅本機)</li>
        <li><strong>chrome.storage.session</strong>: 儲存短期 scoped JWT (1 小時自動過期)</li>
        <li>用戶從 chrome://extensions 移除 extension 時，所有本機資料自動清除</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>Third-Party Sharing</h2>
      <p><strong>無</strong>。本 Extension 只與 tellcraft.com 後端通訊，不傳送任何資料給第三方 / 廣告商 / 分析服務。</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>Permissions Used</h2>
      <ul>
        <li><strong>storage</strong>: 儲存 auth token + scoped JWT</li>
        <li><strong>cookies</strong>: 預留（commit 4 後改用 localStorage sync，未實際使用 chrome.cookies API）</li>
        <li><strong>host_permissions: *.vercel.app</strong>: content script 注入 Tellcraft preview 頁面</li>
        <li><strong>host_permissions: tellcraft.com</strong>: 同步 user token + 呼叫 Tellcraft API</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>Data Deletion</h2>
      <p>移除 extension 時 chrome 自動清除所有本機資料。如需刪除後端對話資料，請在 tellcraft.com 帳號設定刪除專案。</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>Contact</h2>
      <p>政策異動 / 隱私問題，請 email 至 <a href="mailto:privacy@tellcraft.com" style={{ color: '#0f172a' }}>privacy@tellcraft.com</a>。</p>

      <hr style={{ margin: '48px 0', border: 0, borderTop: '1px solid #e5e7eb' }} />
      <p style={{ fontSize: 12, color: '#94a3b8' }}>
        本頁面為 Chrome Web Store 上架要求之必備 Privacy Policy。Tellcraft 平台本身的隱私政策請參考主站。
      </p>
    </article>
  )
}
