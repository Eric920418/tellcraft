'use client'

/**
 * VercelPreviewIframe — Vercel preview URL iframe（替換 WebContainer in-browser preview）
 *
 * 簡化版：iframe + status overlay + 失敗 retry。Device frame / PropertyEditor 等高級 UI
 * 沿用 WebContainer 模式（flag-off 時用）— 待 Vercel preview 穩定後再 port。
 *
 * Props 跟 WebContainerPreview 簡化版對齊（只接 vercel state，不接 code / files）：
 *   - previewUrl: 由 usePreviewDeployment hook 拿到的 vercel deploy URL
 *   - previewStatus / progressStep / etaSeconds：UI 進度顯示
 *   - lkgUrl / error：失敗 fallback
 *
 * Edit bridge 跨 origin：iframe 內 edit-bridge.js 已用 postMessage(*, '*') wildcard，
 * 主視窗 listener 用 VERCEL_PREVIEW_ORIGIN_REGEX 白名單驗 e.origin（見 usePreviewDeployment.ts）
 */

import { useEffect, useRef } from 'react'
import type { PreviewStatus } from '@/app/hooks/usePreviewDeployment'

export interface VercelPreviewIframeProps {
  previewUrl: string | null
  previewStatus: PreviewStatus
  progressPercent: number
  progressStep: string
  etaSeconds: number
  error: string | null
  lkgUrl: string | null
  onRetry?: () => void
}

export default function VercelPreviewIframe({
  previewUrl,
  previewStatus,
  progressPercent,
  progressStep,
  etaSeconds,
  error,
  lkgUrl,
  onRetry,
}: VercelPreviewIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // 顯示優先級：ready url > lkg url > placeholder
  const displayUrl = previewStatus === 'ready' && previewUrl
    ? previewUrl
    : lkgUrl
    ? lkgUrl
    : null

  // 當 displayUrl 改變強制 iframe reload（防 Vercel CDN cache）
  useEffect(() => {
    if (!iframeRef.current || !displayUrl) return
    // 用 query buster 確保拉最新版
    const bustUrl = `${displayUrl}${displayUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`
    iframeRef.current.src = bustUrl
  }, [displayUrl])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#fff' }}>
      {displayUrl && (
        <iframe
          ref={iframeRef}
          title="Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
        />
      )}

      {/* Building overlay */}
      {previewStatus === 'building' && (
        <div style={overlayStyle}>
          <div style={contentBoxStyle}>
            <div style={{ width: 48, height: 48, border: '3px solid #e5e7eb', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'tcSpin 1s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              正在生成 Vercel 預覽
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
              {progressStep || '部署中...'}（約 {etaSeconds}s）
            </div>
            <div style={progressBarOuterStyle}>
              <div style={{ ...progressBarInnerStyle, width: `${progressPercent}%` }} />
            </div>
            {lkgUrl && (
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 16 }}>
                正顯示上次成功版本，新版完成後自動更新
              </div>
            )}
          </div>
        </div>
      )}

      {/* Failed overlay */}
      {previewStatus === 'failed' && (
        <div style={{ ...overlayStyle, background: 'rgba(255, 240, 240, 0.95)' }}>
          <div style={contentBoxStyle}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#991b1b', marginBottom: 8 }}>
              預覽部署失敗
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16, wordBreak: 'break-word' }}>
              {error || 'Unknown error'}
            </div>
            {lkgUrl && (
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                ↑ 顯示上次成功的版本
              </div>
            )}
            {onRetry && (
              <button
                onClick={onRetry}
                style={{
                  padding: '8px 16px',
                  background: '#0f172a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                重新部署
              </button>
            )}
          </div>
        </div>
      )}

      {/* Idle (no preview yet) */}
      {previewStatus === 'idle' && !displayUrl && (
        <div style={{ ...overlayStyle, background: '#fafafa' }}>
          <div style={contentBoxStyle}>
            <div style={{ fontSize: 14, color: '#94a3b8' }}>
              等待設計生成完成後自動部署預覽
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes tcSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(255, 255, 255, 0.92)',
  backdropFilter: 'blur(2px)',
  WebkitBackdropFilter: 'blur(2px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
}

const contentBoxStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 32,
  maxWidth: 360,
}

const progressBarOuterStyle: React.CSSProperties = {
  width: '100%',
  height: 6,
  background: '#e5e7eb',
  borderRadius: 999,
  overflow: 'hidden',
}

const progressBarInnerStyle: React.CSSProperties = {
  height: '100%',
  background: '#0f172a',
  transition: 'width 0.3s ease',
}
