'use client'

/**
 * ChatInlinePreviewCard — 訊息內 inline 預覽卡片（取代右側 SplitLayout panel）
 *
 * 為何 inline：
 *   chrome 158+ 第三方 cookie block + vercel.live toolbar nested iframe 衝突 → iframe preview 結構性失敗
 *   改顯示成 chat message 內的 inline 卡片，點按鈕在新分頁開啟 vercel preview URL
 *   v0 / lovable.dev / bolt.new 等競品也是這個 pattern
 *
 * 元件不存 URL 在 message richContent — 從 usePreviewDeployment hook 拉最新狀態
 *   原因：preview URL 隨每次 phase 完成更新，把 URL 存進歷史 message 會 stale
 *   richContent 只放 { projectName, enqueuedAt } 作為「該訊息對應的預覽卡片」標記
 *
 * Props：簡化 — conversationId 即可，UI 狀態由 hook 提供
 */

import { useState } from 'react'
import { usePreviewDeployment, useRetryPreview } from '@/app/hooks/usePreviewDeployment'
import { useExtensionDetect, buildEditorUrl, EXTENSION_INSTALL_URL } from '@/app/hooks/useExtensionDetect'

export interface ChatInlinePreviewCardProps {
  conversationId: string | undefined
  projectName?: string
}

export default function ChatInlinePreviewCard({ conversationId, projectName }: ChatInlinePreviewCardProps) {
  const preview = usePreviewDeployment(conversationId)
  const retry = useRetryPreview(conversationId)
  const extension = useExtensionDetect()  // R11 commit 7
  const [showBuildLog, setShowBuildLog] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    setIsRetrying(true)
    try { await retry() } finally { setIsRetrying(false) }
  }

  const displayUrl = preview.status === 'ready' && preview.url
    ? preview.url
    : preview.lkgUrl
    ? preview.lkgUrl
    : null

  let hostLabel = ''
  if (displayUrl) {
    try { hostLabel = new URL(displayUrl).hostname } catch { hostLabel = displayUrl }
  }

  // building 狀態
  if (preview.status === 'building' || (preview.status === 'idle' && !displayUrl)) {
    return (
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <div style={spinnerStyle} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
              {preview.status === 'building' ? '正在部署預覽' : '排隊中'}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              {projectName ? `${projectName} · ` : ''}{preview.progressStep || '部署中…'}{preview.etaSeconds > 0 ? ` · 約 ${preview.etaSeconds}s` : ''}
            </div>
          </div>
        </div>
        <div style={progressBarOuterStyle}>
          <div style={{ ...progressBarInnerStyle, width: `${Math.max(5, preview.progressPercent)}%` }} />
        </div>
        {preview.lkgUrl && (
          <a href={preview.lkgUrl} target="_blank" rel="noopener noreferrer" style={secondaryLinkStyle}>
            ↗ 先看上次成功版本
          </a>
        )}
      </div>
    )
  }

  // failed 狀態 — R10 治本 Layer 6 UX 升級
  // backend 已嘗試 6 層自動修復（L1-L5），這裡顯示給用戶代表「真的修不動」極端 case
  if (preview.status === 'failed') {
    const buildLogPreview = preview.errorDetails
      ? preview.errorDetails.split('\n').slice(0, 20).join('\n')
      : null
    return (
      <div style={{ ...cardStyle, borderColor: '#fecaca', background: 'linear-gradient(135deg, #fff5f5 0%, #ffeaea 100%)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', marginBottom: 6 }}>
          系統已嘗試多輪自動修復但仍有問題
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10, wordBreak: 'break-word' }}>
          {preview.error || '部署失敗'}
        </div>

        {/* 摺疊顯示 build log 前 20 行 — debug actionable */}
        {buildLogPreview && (
          <div style={{ marginBottom: 10 }}>
            <button
              onClick={() => setShowBuildLog(!showBuildLog)}
              style={{ fontSize: 11, color: '#0f172a', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            >
              {showBuildLog ? '▾ 隱藏錯誤訊息' : '▸ 顯示錯誤訊息（給開發者 debug）'}
            </button>
            {showBuildLog && (
              <pre style={{ fontSize: 10, color: '#7f1d1d', background: '#fef2f2', padding: 8, borderRadius: 4, marginTop: 6, maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {buildLogPreview}
              </pre>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            style={{
              ...primaryButtonStyle,
              padding: '6px 12px', fontSize: 11,
              background: isRetrying ? '#94a3b8' : '#0f172a',
              cursor: isRetrying ? 'wait' : 'pointer',
            }}
          >
            {isRetrying ? '部署中...' : '🔄 重新部署（完整修復模式）'}
          </button>
          {preview.lkgUrl && (
            <a href={preview.lkgUrl} target="_blank" rel="noopener noreferrer" style={{ ...secondaryLinkStyle, marginTop: 6 }}>
              ↗ 看上次成功版本
            </a>
          )}
        </div>
      </div>
    )
  }

  // ready 狀態 — 主要 UI
  // R11 commit 7: extension 偵測到 → 顯示「✏️ 開啟編輯器」+ 「↗ 新分頁開啟」 兩個按鈕
  //                沒偵測到 → 只顯示「↗ 在新分頁開啟」+ 「安裝編輯器」提示連結
  const editorUrl = conversationId && displayUrl ? buildEditorUrl(displayUrl, conversationId) : null
  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <div style={readyIconStyle}>✓</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
            預覽已就緒
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {hostLabel}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Extension 安裝：「✏️ 開啟編輯器」帶 hash sentinel 觸發 overlay 自動 mount */}
        {extension.installed && editorUrl && (
          <a href={editorUrl} target="_blank" rel="noopener noreferrer" style={primaryButtonStyle}>
            ✏️ 開啟編輯器
          </a>
        )}
        {/* 主按鈕（沒裝 extension 是主，裝了是次） */}
        <a
          href={displayUrl!}
          target="_blank"
          rel="noopener noreferrer"
          style={extension.installed ? secondaryButtonStyle : primaryButtonStyle}
        >
          在新分頁開啟預覽
          <span style={{ fontSize: 14 }}>↗</span>
        </a>
      </div>

      {/* 沒裝 extension：升級提示卡片，吸引用戶去裝（賣點 sell） */}
      {!extension.loading && !extension.installed && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
            border: '1px solid #ddd6fe',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>✨</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
              想點擊網頁元素直接編輯？
            </div>
            <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5, marginBottom: 8 }}>
              安裝 Tellcraft Editor Chrome 擴充功能，新分頁打開預覽可即時修改文字、顏色，自動同步回網站
            </div>
            <a
              href={EXTENSION_INSTALL_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 10px',
                background: '#0f172a',
                color: '#fff',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              加入 Chrome — 免費 ↗
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #fafafa 0%, #f1f5f9 100%)',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 14,
  maxWidth: 480,
  marginTop: 8,
}

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 10,
}

const readyIconStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  background: '#16a34a',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  fontWeight: 700,
  flexShrink: 0,
}

const spinnerStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  border: '2.5px solid #e5e7eb',
  borderTopColor: '#0f172a',
  borderRadius: '50%',
  animation: 'tcInlineSpin 1s linear infinite',
  flexShrink: 0,
}

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  background: '#0f172a',
  color: '#fff',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  textDecoration: 'none',
  width: 'fit-content',
}

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  background: '#fff',
  color: '#0f172a',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 500,
  textDecoration: 'none',
  width: 'fit-content',
}

const secondaryLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: 10,
  fontSize: 11,
  color: '#0f172a',
  textDecoration: 'underline',
}

const progressBarOuterStyle: React.CSSProperties = {
  width: '100%',
  height: 4,
  background: '#e5e7eb',
  borderRadius: 999,
  overflow: 'hidden',
}

const progressBarInnerStyle: React.CSSProperties = {
  height: '100%',
  background: '#0f172a',
  transition: 'width 0.3s ease',
}

// Spinner animation 注入（CSS-in-JS 一次性）
if (typeof window !== 'undefined' && !document.getElementById('tc-inline-spin-style')) {
  const style = document.createElement('style')
  style.id = 'tc-inline-spin-style'
  style.textContent = '@keyframes tcInlineSpin { to { transform: rotate(360deg); } }'
  document.head.appendChild(style)
}
