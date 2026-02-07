'use client'

interface DeploymentItem {
  index: number
  id: string
  vercelDeploymentId: string
  url: string
  createdAt: string
  isCurrent: boolean
}

interface DeploymentHistoryProps {
  data: {
    deployments?: DeploymentItem[]
  }
  onSendMessage?: (msg: string) => void
}

export default function DeploymentHistory({ data, onSendMessage }: DeploymentHistoryProps) {
  const deployments = data.deployments || []

  if (deployments.length === 0) {
    return null
  }

  return (
    <div
      style={{
        marginTop: 12,
        padding: 16,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#1e293b' }}>
        部署歷史
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {deployments.map((d) => (
          <div
            key={d.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: d.isCurrent ? '#f0fdf4' : '#fff',
              border: `1px solid ${d.isCurrent ? '#bbf7d0' : '#e2e8f0'}`,
              borderRadius: 6,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>
                版本 {d.index}
                {d.isCurrent && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#166534', fontWeight: 600 }}>
                    目前版本
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                {new Date(d.createdAt).toLocaleString('zh-TW')}
              </div>
            </div>
            {!d.isCurrent && onSendMessage && (
              <button
                onClick={() => onSendMessage(String(d.index))}
                style={{
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  background: '#1e293b',
                  color: '#fff',
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                回滾到此版本
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
