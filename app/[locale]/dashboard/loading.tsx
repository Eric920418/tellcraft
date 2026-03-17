export default function DashboardLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ height: 28, width: 120, background: 'var(--gray-100)', borderRadius: 4, marginBottom: 8, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 14, width: 200, background: 'var(--gray-100)', borderRadius: 4, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
      </div>

      {/* Stats grid skeleton */}
      <div
        className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 20,
          marginBottom: 32,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: 24,
              background: 'var(--white)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ height: 13, width: 80, background: 'var(--gray-100)', borderRadius: 4, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 18, width: 18, background: 'var(--gray-100)', borderRadius: 4, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
            </div>
            <div style={{ height: 32, width: 64, background: 'var(--gray-100)', borderRadius: 4, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
          </div>
        ))}
      </div>

      {/* Message usage skeleton */}
      <div
        style={{
          padding: 24,
          background: 'var(--white)',
          border: '1px solid var(--border-color)',
          marginBottom: 32,
        }}
      >
        <div style={{ height: 16, width: 100, background: 'var(--gray-100)', borderRadius: 4, marginBottom: 16, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 8, width: '100%', background: 'var(--gray-100)', borderRadius: 4, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
      </div>

      {/* Recent projects skeleton */}
      <div
        style={{
          padding: 24,
          background: 'var(--white)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ height: 16, width: 100, background: 'var(--gray-100)', borderRadius: 4, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 13, width: 60, background: 'var(--gray-100)', borderRadius: 4, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 0',
              borderBottom: i < 4 ? '1px solid var(--border-color)' : 'none',
            }}
          >
            <div>
              <div style={{ height: 14, width: 140 + i * 20, background: 'var(--gray-100)', borderRadius: 4, marginBottom: 6, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 12, width: 80, background: 'var(--gray-100)', borderRadius: 4, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ height: 22, width: 60, background: 'var(--gray-100)', borderRadius: 4, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 40, width: 40, background: 'var(--gray-100)', borderRadius: 10, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
