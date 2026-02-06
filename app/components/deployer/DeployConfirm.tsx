'use client'

interface DeployConfirmProps {
  data: {
    projectName?: string
    fileCount?: number
    estimatedUrl?: string
  }
  onSendMessage: (content: string) => void
}

export default function DeployConfirm({ data, onSendMessage }: DeployConfirmProps) {
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
        部署確認
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: 'var(--gray-500)' }}>專案名稱</span>
          <span style={{ fontWeight: 500 }}>{data.projectName || '-'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: 'var(--gray-500)' }}>檔案數量</span>
          <span style={{ fontWeight: 500 }}>{data.fileCount || 0} 個</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: 'var(--gray-500)' }}>預計網址</span>
          <span style={{ fontWeight: 500, color: 'var(--gray-700)' }}>{data.estimatedUrl || '-'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onSendMessage('確認部署')}
          style={{
            flex: 1,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 500,
            background: 'var(--black)',
            color: 'var(--white)',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          確認部署
        </button>
        <button
          onClick={() => onSendMessage('取消')}
          style={{
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 500,
            background: 'var(--white)',
            color: 'var(--gray-600)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          取消
        </button>
      </div>
    </div>
  )
}
