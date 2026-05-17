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

import { usePreviewDeployment } from '@/app/hooks/usePreviewDeployment'

export interface ChatInlinePreviewCardProps {
  conversationId: string | undefined
  projectName?: string
}

export default function ChatInlinePreviewCard({ conversationId, projectName }: ChatInlinePreviewCardProps) {
  const preview = usePreviewDeployment(conversationId)

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

  // failed 狀態
  if (preview.status === 'failed') {
    return (
      <div style={{ ...cardStyle, borderColor: '#fecaca', background: 'linear-gradient(135deg, #fff5f5 0%, #ffeaea 100%)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', marginBottom: 6 }}>
          預覽部署失敗
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10, wordBreak: 'break-word' }}>
          {preview.error || 'Unknown error'}
        </div>
        {preview.lkgUrl && (
          <a href={preview.lkgUrl} target="_blank" rel="noopener noreferrer" style={secondaryLinkStyle}>
            ↗ 看上次成功版本
          </a>
        )}
      </div>
    )
  }

  // ready 狀態 — 主要 UI
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
      <a
        href={displayUrl!}
        target="_blank"
        rel="noopener noreferrer"
        style={primaryButtonStyle}
      >
        在新分頁開啟預覽
        <span style={{ fontSize: 14 }}>↗</span>
      </a>
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
