'use client'

interface TemplateProps {
  containerWidth: number
}

export default function SaasPro({ containerWidth }: TemplateProps) {
  const isDesktop = containerWidth >= 1024
  const isTablet = containerWidth >= 768
  const isMobile = containerWidth < 768

  return (
    <div className="bg-slate-50 text-slate-900 antialiased min-h-full">
      <div className="min-h-dvh flex">
        {/* Sidebar */}
        {isDesktop && (
          <aside className="w-72 bg-slate-900 text-white p-6 flex flex-col">
            <div className="mb-8">
              <h1 className="text-xl font-bold text-balance">Enterprise</h1>
              <p className="text-slate-400 text-sm">企業管理平台</p>
            </div>

            <nav className="flex-1 space-y-1">
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 text-white font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                </svg>
                儀表板
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/5 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                數據分析
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/5 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                團隊管理
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/5 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                文件管理
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/5 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                財務報表
              </a>
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-sm font-medium">管</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">管理員</p>
                  <p className="text-xs text-slate-400 truncate">admin@company.com</p>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                type="search"
                placeholder="搜尋..."
                className={`${isMobile ? 'w-40' : 'w-64'} px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent`}
              />
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" aria-label="通知">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                升級方案
              </button>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 p-6 overflow-auto">
            {/* Page Title */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-balance">儀表板</h2>
              <p className="text-slate-500 text-pretty">業務績效一覽</p>
            </div>

            {/* Stats Row */}
            <div className={`grid gap-4 mb-6 ${
              isDesktop ? 'grid-cols-4' : isTablet ? 'grid-cols-2' : 'grid-cols-1'
            }`}>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500">月營收</span>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">+12%</span>
                </div>
                <p className="text-3xl font-bold tabular-nums">$128,430</p>
                <p className="text-sm text-slate-500 mt-1">較上月 +$13,847</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500">活躍客戶</span>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">+8%</span>
                </div>
                <p className="text-3xl font-bold tabular-nums">2,847</p>
                <p className="text-sm text-slate-500 mt-1">較上月 +218 位</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500">客戶留存率</span>
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded">穩定</span>
                </div>
                <p className="text-3xl font-bold tabular-nums">94.2%</p>
                <p className="text-sm text-slate-500 mt-1">行業平均 87%</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500">待處理工單</span>
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">注意</span>
                </div>
                <p className="text-3xl font-bold tabular-nums">23</p>
                <p className="text-sm text-slate-500 mt-1">平均響應 2.4 小時</p>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className={`grid gap-6 ${isDesktop ? 'grid-cols-3' : 'grid-cols-1'}`}>
              {/* Chart */}
              <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 ${isDesktop ? 'col-span-2' : ''}`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-balance">營收趨勢</h3>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-lg">月</button>
                    <button className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">季</button>
                    <button className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">年</button>
                  </div>
                </div>
                <div className="h-64 flex items-end gap-3">
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-slate-200 rounded-t" style={{ height: '45%' }}></div>
                    <span className="text-xs text-slate-500">1月</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-slate-200 rounded-t" style={{ height: '62%' }}></div>
                    <span className="text-xs text-slate-500">2月</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-slate-200 rounded-t" style={{ height: '55%' }}></div>
                    <span className="text-xs text-slate-500">3月</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-slate-200 rounded-t" style={{ height: '78%' }}></div>
                    <span className="text-xs text-slate-500">4月</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-slate-200 rounded-t" style={{ height: '68%' }}></div>
                    <span className="text-xs text-slate-500">5月</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-slate-900 rounded-t" style={{ height: '85%' }}></div>
                    <span className="text-xs text-slate-500">6月</span>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-semibold mb-4 text-balance">最近訂單</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <p className="font-medium">#ORD-7829</p>
                      <p className="text-sm text-slate-500">企業方案</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium tabular-nums">$4,500</p>
                      <p className="text-sm text-emerald-600">已完成</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <p className="font-medium">#ORD-7828</p>
                      <p className="text-sm text-slate-500">專業方案</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium tabular-nums">$1,200</p>
                      <p className="text-sm text-amber-600">處理中</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <p className="font-medium">#ORD-7827</p>
                      <p className="text-sm text-slate-500">團隊方案</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium tabular-nums">$890</p>
                      <p className="text-sm text-emerald-600">已完成</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">#ORD-7826</p>
                      <p className="text-sm text-slate-500">基礎方案</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium tabular-nums">$290</p>
                      <p className="text-sm text-emerald-600">已完成</p>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
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
