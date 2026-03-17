interface StatsCardProps {
  title: string
  value: number | string
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: string
  delay?: number
}

export default function StatsCard({
  title,
  value,
  subtitle,
  trend,
  icon,
}: StatsCardProps) {
  return (
    <div
      style={{
        padding: 24,
        background: 'var(--white)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: 'var(--gray-500)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </span>
        {icon && (
          <span style={{ fontSize: 18, opacity: 0.3 }}>{icon}</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span
          style={{
            fontSize: 32,
            fontWeight: 300,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '-0.02em',
          }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>

        {trend && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: trend.isPositive ? '#22C55E' : '#EF4444',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {subtitle && (
        <p
          style={{
            fontSize: 12,
            color: 'var(--gray-400)',
            marginTop: 8,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}

// 小型統計卡片（用於儀表板列表內）
export function MiniStatsCard({
  label,
  value,
}: {
  label: string
  value: number | string
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: 'var(--gray-400)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 20,
          fontWeight: 300,
          fontFamily: 'var(--font-mono)',
        }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </div>
  )
}
