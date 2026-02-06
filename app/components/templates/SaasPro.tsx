'use client'

interface TemplateProps {
  containerWidth: number
}

export default function SaasPro({ containerWidth }: TemplateProps) {
  const isDesktop = containerWidth >= 1024
  const isTablet = containerWidth >= 768
  const isMobile = containerWidth < 768

  const colors = {
    white: '#ffffff',
    slate50: '#f8fafc',
    slate100: '#f1f5f9',
    slate200: '#e2e8f0',
    slate300: '#cbd5e1',
    slate400: '#94a3b8',
    slate500: '#64748b',
    slate600: '#475569',
    slate700: '#334155',
    slate900: '#0f172a',
    emerald100: '#d1fae5',
    emerald600: '#059669',
    emerald700: '#047857',
    amber100: '#fef3c7',
    amber600: '#d97706',
    amber700: '#b45309',
    red500: '#ef4444',
  }

  return (
    <div style={{ minHeight: '100%', background: colors.slate50, color: colors.slate900, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', minHeight: '100%' }}>
        {/* Sidebar */}
        {isDesktop && (
          <aside style={{
            width: 288,
            background: colors.slate900,
            color: colors.white,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ marginBottom: 32 }}>
              <h1 data-editable="sidebar-title" data-type="heading" style={{ fontSize: 20, fontWeight: 700 }}>Enterprise</h1>
              <p data-editable="sidebar-subtitle" data-type="paragraph" style={{ color: colors.slate400, fontSize: 14 }}>企業管理平台</p>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', label: '儀表板', active: true },
                { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: '數據分析', active: false },
                { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', label: '團隊管理', active: false },
                { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: '文件管理', active: false },
                { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: '財務報表', active: false },
              ].map((item, i) => (
                <a
                  key={i}
                  href="#"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: item.active ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: item.active ? colors.white : colors.slate300,
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

            <div style={{ paddingTop: 24, borderTop: `1px solid ${colors.slate700}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  background: colors.slate700,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 500,
                }}>管</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>管理員</p>
                  <p style={{ fontSize: 12, color: colors.slate400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>admin@company.com</p>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Top Bar */}
          <header style={{
            background: colors.white,
            borderBottom: `1px solid ${colors.slate200}`,
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <input
                type="search"
                placeholder="搜尋..."
                style={{
                  width: isMobile ? 160 : 256,
                  padding: '8px 16px',
                  border: `1px solid ${colors.slate200}`,
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button style={{
                position: 'relative',
                padding: 8,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: colors.slate600,
              }} aria-label="通知">
                <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                <span style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  background: colors.red500,
                  borderRadius: '50%',
                }}></span>
              </button>
              <button data-editable="header-cta" data-type="button" style={{
                padding: '8px 16px',
                background: colors.slate900,
                color: colors.white,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
              }}>
                升級方案
              </button>
            </div>
          </header>

          {/* Content */}
          <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
            {/* Page Title */}
            <div style={{ marginBottom: 24 }}>
              <h2 data-editable="page-title" data-type="heading" style={{ fontSize: 24, fontWeight: 700 }}>儀表板</h2>
              <p data-editable="page-subtitle" data-type="paragraph" style={{ color: colors.slate500 }}>業務績效一覽</p>
            </div>

            {/* Stats Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : isTablet ? 'repeat(2, 1fr)' : '1fr',
              gap: 16,
              marginBottom: 24,
            }}>
              {[
                { label: '月營收', value: '$128,430', change: '+12%', changeLabel: '較上月 +$13,847', positive: true },
                { label: '活躍客戶', value: '2,847', change: '+8%', changeLabel: '較上月 +218 位', positive: true },
                { label: '客戶留存率', value: '94.2%', change: '穩定', changeLabel: '行業平均 87%', positive: null },
                { label: '待處理工單', value: '23', change: '注意', changeLabel: '平均響應 2.4 小時', positive: false },
              ].map((stat, i) => (
                <div key={i} style={{
                  background: colors.white,
                  padding: 24,
                  borderRadius: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  border: `1px solid ${colors.slate200}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: colors.slate500 }}>{stat.label}</span>
                    <span style={{
                      padding: '4px 8px',
                      background: stat.positive === true ? colors.emerald100 : stat.positive === false ? colors.amber100 : colors.slate100,
                      color: stat.positive === true ? colors.emerald700 : stat.positive === false ? colors.amber700 : colors.slate700,
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 4,
                    }}>{stat.change}</span>
                  </div>
                  <p style={{ fontSize: 30, fontWeight: 700 }}>{stat.value}</p>
                  <p style={{ fontSize: 14, color: colors.slate500, marginTop: 4 }}>{stat.changeLabel}</p>
                </div>
              ))}
            </div>

            {/* Two Column Layout */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isDesktop ? '2fr 1fr' : '1fr',
              gap: 24,
            }}>
              {/* Chart */}
              <div style={{
                background: colors.white,
                padding: 24,
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                border: `1px solid ${colors.slate200}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h3 data-editable="chart-title" data-type="heading" style={{ fontWeight: 600 }}>營收趨勢</h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['月', '季', '年'].map((period, i) => (
                      <button key={i} style={{
                        padding: '6px 12px',
                        fontSize: 14,
                        background: i === 0 ? colors.slate900 : 'transparent',
                        color: i === 0 ? colors.white : colors.slate600,
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                      }}>{period}</button>
                    ))}
                  </div>
                </div>
                <div style={{ height: 256, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                  {[45, 62, 55, 78, 68, 85].map((height, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: '100%',
                        height: `${height}%`,
                        background: i === 5 ? colors.slate900 : colors.slate200,
                        borderRadius: '4px 4px 0 0',
                      }}></div>
                      <span style={{ fontSize: 12, color: colors.slate500 }}>{i + 1}月</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Orders */}
              <div style={{
                background: colors.white,
                padding: 24,
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                border: `1px solid ${colors.slate200}`,
              }}>
                <h3 data-editable="orders-title" data-type="heading" style={{ fontWeight: 600, marginBottom: 16 }}>最近訂單</h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[
                    { id: '#ORD-7829', plan: '企業方案', amount: '$4,500', status: '已完成', statusColor: colors.emerald600 },
                    { id: '#ORD-7828', plan: '專業方案', amount: '$1,200', status: '處理中', statusColor: colors.amber600 },
                    { id: '#ORD-7827', plan: '團隊方案', amount: '$890', status: '已完成', statusColor: colors.emerald600 },
                    { id: '#ORD-7826', plan: '基礎方案', amount: '$290', status: '已完成', statusColor: colors.emerald600 },
                  ].map((order, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 0',
                      borderBottom: i < 3 ? `1px solid ${colors.slate100}` : 'none',
                    }}>
                      <div>
                        <p style={{ fontWeight: 500 }}>{order.id}</p>
                        <p style={{ fontSize: 14, color: colors.slate500 }}>{order.plan}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 500 }}>{order.amount}</p>
                        <p style={{ fontSize: 14, color: order.statusColor }}>{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button data-editable="orders-cta" data-type="button" style={{
                  width: '100%',
                  marginTop: 16,
                  padding: 8,
                  fontSize: 14,
                  color: colors.slate600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}>
                  查看全部訂單 →
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
