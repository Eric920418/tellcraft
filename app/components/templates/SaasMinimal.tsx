'use client'

interface TemplateProps {
  containerWidth: number
}

export default function SaasMinimal({ containerWidth }: TemplateProps) {
  const isDesktop = containerWidth >= 1024
  const isTablet = containerWidth >= 768
  const isMobile = containerWidth < 768

  const colors = {
    white: '#ffffff',
    slate50: '#f8fafc',
    slate100: '#f1f5f9',
    slate200: '#e2e8f0',
    slate500: '#64748b',
    slate600: '#475569',
    slate900: '#0f172a',
    emerald600: '#059669',
  }

  return (
    <div style={{ minHeight: '100%', background: colors.white, color: colors.slate900, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', minHeight: '100%' }}>
        {/* Sidebar */}
        {isTablet && (
          <aside style={{
            width: 256,
            borderRight: `1px solid ${colors.slate200}`,
            padding: 24,
          }}>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 20, fontWeight: 600 }}>Dashboard</h1>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: '總覽', active: true },
                { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: '分析', active: false },
                { icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', label: '用戶', active: false },
                { icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', label: '設定', active: false },
              ].map((item, i) => (
                <a
                  key={i}
                  href="#"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: item.active ? colors.slate100 : 'transparent',
                    color: item.active ? colors.slate900 : colors.slate600,
                    fontWeight: item.active ? 500 : 400,
                    textDecoration: 'none',
                  }}
                >
                  <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}/>
                  </svg>
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main style={{ flex: 1, padding: isDesktop ? 32 : 24 }}>
          {/* Header */}
          <header style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 32,
          }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 600 }}>歡迎回來</h2>
              <p style={{ color: colors.slate500 }}>這是您的業務概覽</p>
            </div>
            <button style={{
              padding: '8px 16px',
              background: colors.slate900,
              color: colors.white,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
            }}>
              新增項目
            </button>
          </header>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : isTablet ? 'repeat(2, 1fr)' : '1fr',
            gap: 16,
            marginBottom: 32,
          }}>
            {[
              { label: '總收入', value: '$45,231', change: '+20.1% 較上月', positive: true },
              { label: '訂閱數', value: '2,350', change: '+180 本月新增', positive: true },
              { label: '活躍用戶', value: '12,234', change: '+573 本週', positive: true },
              { label: '轉換率', value: '3.2%', change: '穩定', positive: false },
            ].map((stat, i) => (
              <div key={i} style={{
                padding: 24,
                border: `1px solid ${colors.slate200}`,
                borderRadius: 12,
              }}>
                <p style={{ fontSize: 14, color: colors.slate500, marginBottom: 4 }}>{stat.label}</p>
                <p style={{ fontSize: 24, fontWeight: 600 }}>{stat.value}</p>
                <p style={{
                  fontSize: 14,
                  color: stat.positive ? colors.emerald600 : colors.slate500,
                  marginTop: 8,
                }}>{stat.change}</p>
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? '2fr 1fr' : '1fr',
            gap: 24,
          }}>
            {/* Chart Area */}
            <div style={{
              padding: 24,
              border: `1px solid ${colors.slate200}`,
              borderRadius: 12,
            }}>
              <h3 style={{ fontWeight: 600, marginBottom: 16 }}>收入趨勢</h3>
              <div style={{
                height: 256,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 8,
              }}>
                {[40, 65, 45, 80, 55, 70, 90].map((height, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${height}%`,
                      background: i === 6 ? colors.slate900 : colors.slate100,
                      borderRadius: '4px 4px 0 0',
                    }}
                  />
                ))}
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 16,
                fontSize: 14,
                color: colors.slate500,
              }}>
                {['一月', '二月', '三月', '四月', '五月', '六月', '七月'].map((month, i) => (
                  <span key={i}>{month}</span>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{
              padding: 24,
              border: `1px solid ${colors.slate200}`,
              borderRadius: 12,
            }}>
              <h3 style={{ fontWeight: 600, marginBottom: 16 }}>最近活動</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { name: '王小明', action: '升級方案', time: '2 分鐘前' },
                  { name: '李小華', action: '完成註冊', time: '5 分鐘前' },
                  { name: '張大偉', action: '購買進階版', time: '12 分鐘前' },
                  { name: '陳小美', action: '提交反饋', time: '25 分鐘前' },
                ].map((activity, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      background: colors.slate100,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 500,
                    }}>
                      {activity.name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {activity.name}{activity.action}
                      </p>
                      <p style={{ fontSize: 12, color: colors.slate500 }}>{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
