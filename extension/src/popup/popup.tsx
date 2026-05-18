/**
 * popup/popup.tsx — Extension toolbar popup
 *
 * MVP：顯示 auth 狀態 + 引導用戶在 tellcraft.com chat 內開啟編輯器
 */

import { createRoot } from 'react-dom/client'

function Popup() {
  return (
    <div>
      <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#0f172a' }}>
        Tellcraft Editor
      </h2>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
        在 Vercel preview 頁面 inline 編輯 Tellcraft 生成的網站。
      </p>
      <div style={{ padding: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
          如何使用？
        </div>
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
          <li>在 <a href="https://tellcraft.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0f172a' }}>tellcraft.com</a> 完成設計生成</li>
          <li>chat 內預覽卡片點「✏️ 開啟編輯器」</li>
          <li>新分頁打開 Vercel preview，編輯器自動啟動</li>
        </ol>
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
        v0.1.0 · Tellcraft
      </div>
    </div>
  )
}

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(<Popup />)
}
