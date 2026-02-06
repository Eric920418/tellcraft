'use client'

interface DeployProgressProps {
  data: {
    percent?: number
    step?: string
  }
}

export default function DeployProgress({ data }: DeployProgressProps) {
  const percent = data.percent || 0
  const step = data.step || '準備中...'

  return (
    <div
      style={{
        marginTop: 12,
        padding: 16,
        background: 'var(--gray-50)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
        正在部署
      </div>

      {/* 進度條 */}
      <div
        style={{
          height: 6,
          background: 'var(--gray-200)',
          borderRadius: 3,
          overflow: 'hidden',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            background: 'var(--black)',
            borderRadius: 3,
            transition: 'width 0.5s ease',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: 'var(--gray-500)' }}>{step}</span>
        <span style={{ color: 'var(--gray-500)' }}>{percent}%</span>
      </div>
    </div>
  )
}
