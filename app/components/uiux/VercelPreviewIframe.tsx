'use client'

/**
 * VercelPreviewIframe — Vercel preview URL「新分頁開啟」UI（不再用 iframe inline embed）
 *
 * 為何不用 iframe：
 *   chrome 158+ 預設 block 第三方 cookies + vercel.live preview toolbar nested iframe inject
 *   兩者組合在 cross-origin iframe context 下，Vercel preview URL 載入後會進 chrome-error://chromewebdata/
 *   即使 React key re-mount、移除 sandbox、移除 query buster 都救不了（結構性問題）
 *   v0 / lovable.dev / bolt.new 等競品也都用「新分頁開啟」做 fallback
 *
 * 改用「全螢幕 placeholder + 大按鈕」UX：
 *   - ready 狀態：顯示 URL + 「在新分頁開啟預覽」大按鈕（卡片設計）
 *   - building 狀態：spinner + 進度（沿用原 overlay）
 *   - failed 狀態：error + retry（沿用原 overlay）
 *   - idle 狀態：等待提示（沿用原 overlay）
 *
 * Props 不變（vs iframe 版），dispatch 切換無 breaking change
 */

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
  // 顯示優先級：ready url > lkg url > placeholder
  const displayUrl = previewStatus === 'ready' && previewUrl
    ? previewUrl
    : lkgUrl
    ? lkgUrl
    : null

  // displayUrl 主機名稱（顯示在卡片上方）
  let hostLabel = ''
  if (displayUrl) {
    try { hostLabel = new URL(displayUrl).hostname } catch { hostLabel = displayUrl }
  }

  return (
    <div style={containerStyle}>
      {/* Ready：全螢幕 placeholder + 開啟按鈕 */}
      {previewStatus === 'ready' && displayUrl && (
        <div style={readyCardStyle}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
            預覽已就緒
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>
            完整 production preview，點下方按鈕開啟新分頁查看
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 24, fontFamily: 'monospace', wordBreak: 'break-all', padding: '6px 12px', background: '#f1f5f9', borderRadius: 4, maxWidth: 480 }}>
            {hostLabel}
          </div>

          <a
            href={displayUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={primaryButtonStyle}
          >
            在新分頁開啟預覽
            <span style={{ fontSize: 16 }}>↗</span>
          </a>

          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 24, maxWidth: 420, lineHeight: 1.5 }}>
            為什麼不直接 inline 顯示？chrome 158+ 預設阻擋跨網域 cookie + Vercel 預覽工具列在巢狀 iframe 中衝突，導致 iframe 內預覽崩潰。新分頁開啟可避開所有限制
          </div>
        </div>
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
              <a
                href={lkgUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 16, fontSize: 12, color: '#0f172a', textDecoration: 'underline' }}
              >
                先看上次成功版本 ↗
              </a>
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
              <a
                href={lkgUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', marginBottom: 12, fontSize: 12, color: '#0f172a', textDecoration: 'underline' }}
              >
                看上次成功版本 ↗
              </a>
            )}
            {onRetry && (
              <div>
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
              </div>
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

const containerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  background: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const readyCardStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 40,
  maxWidth: 560,
  background: 'linear-gradient(135deg, #fafafa 0%, #f1f5f9 100%)',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '14px 28px',
  background: '#0f172a',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 15,
  fontWeight: 600,
  textDecoration: 'none',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
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
