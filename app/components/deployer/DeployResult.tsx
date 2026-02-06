'use client'

interface DeployResultProps {
  data: {
    success?: boolean
    deploymentUrl?: string
    error?: string
  }
}

export default function DeployResult({ data }: DeployResultProps) {
  if (data.success) {
    return (
      <div
        style={{
          marginTop: 12,
          padding: 16,
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 8,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#166534' }}>
          部署成功
        </div>
        {data.deploymentUrl && (
          <a
            href={data.deploymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              background: '#166534',
              color: '#fff',
              borderRadius: 6,
              textDecoration: 'none',
            }}
          >
            前往網站 →
          </a>
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        marginTop: 12,
        padding: 16,
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: 8,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#991b1b' }}>
        部署失敗
      </div>
      <div style={{ fontSize: 13, color: '#991b1b' }}>
        {data.error || '未知錯誤'}
      </div>
    </div>
  )
}
