import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Tellcraft - AI Website Builder'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { locale: string } }) {
  const { locale } = params
  const isZh = locale === 'zh'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: 'white',
              fontWeight: 700,
            }}
          >
            T
          </div>
          <span
            style={{
              fontSize: '48px',
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-1px',
            }}
          >
            Tellcraft
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '28px',
            color: '#a5b4fc',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.4,
          }}
        >
          {isZh
            ? 'AI 自動建站平台 — 用對話打造網站'
            : 'AI Website Builder — Build Sites Through Conversation'}
        </div>

        {/* Sub-tagline */}
        <div
          style={{
            fontSize: '20px',
            color: '#94a3b8',
            marginTop: '16px',
            textAlign: 'center',
            maxWidth: '700px',
          }}
        >
          {isZh
            ? '描述想法 → AI 釐清 → 生成程式碼 → 一鍵部署'
            : 'Describe → AI Clarifies → Generate Code → One-Click Deploy'}
        </div>

        {/* Bottom badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            gap: '24px',
            color: '#64748b',
            fontSize: '16px',
          }}
        >
          <span>tellcraft.com</span>
          <span>•</span>
          <span>{isZh ? '免費開始' : 'Start Free'}</span>
          <span>•</span>
          <span>{isZh ? '無需寫程式' : 'No Coding Required'}</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
