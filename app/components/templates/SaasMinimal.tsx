'use client'

interface TemplateProps {
  containerWidth: number
}

export default function SaasMinimal({ containerWidth }: TemplateProps) {
  // 根據容器寬度決定響應式類
  const isDesktop = containerWidth >= 1024
  const isTablet = containerWidth >= 768
  const isMobile = containerWidth < 768

  return (
    <div className="bg-white text-slate-900 antialiased" style={{ minHeight: '100%' }}>
      <div className="flex" style={{ minHeight: '100%' }}>
        {/* Sidebar - 隱藏在手機上 */}
        {isTablet && (
          <aside className="w-64 border-r border-slate-200 p-6">
            <div className="mb-8">
              <h1 className="text-xl font-semibold text-balance">Dashboard</h1>
            </div>
            <nav className="space-y-1">
              <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-100 text-slate-900 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                總覽
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                分析
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
                用戶
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                設定
              </a>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {/* Header */}
          <header className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'} mb-8`}>
            <div>
              <h2 className="text-2xl font-semibold text-balance">歡迎回來</h2>
              <p className="text-slate-500 text-pretty">這是您的業務概覽</p>
            </div>
            <button className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
              新增項目
            </button>
          </header>

          {/* Stats Grid */}
          <div className={`grid gap-4 mb-8 ${
            isDesktop ? 'grid-cols-4' : isTablet ? 'grid-cols-2' : 'grid-cols-1'
          }`}>
            <div className="p-6 border border-slate-200 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">總收入</p>
              <p className="text-2xl font-semibold tabular-nums">$45,231</p>
              <p className="text-sm text-emerald-600 mt-2">+20.1% 較上月</p>
            </div>
            <div className="p-6 border border-slate-200 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">訂閱數</p>
              <p className="text-2xl font-semibold tabular-nums">2,350</p>
              <p className="text-sm text-emerald-600 mt-2">+180 本月新增</p>
            </div>
            <div className="p-6 border border-slate-200 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">活躍用戶</p>
              <p className="text-2xl font-semibold tabular-nums">12,234</p>
              <p className="text-sm text-emerald-600 mt-2">+573 本週</p>
            </div>
            <div className="p-6 border border-slate-200 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">轉換率</p>
              <p className="text-2xl font-semibold tabular-nums">3.2%</p>
              <p className="text-sm text-slate-500 mt-2">穩定</p>
            </div>
          </div>

          {/* Content Grid */}
          <div className={`grid gap-6 ${isDesktop ? 'grid-cols-3' : 'grid-cols-1'}`}>
            {/* Chart Area */}
            <div className={`p-6 border border-slate-200 rounded-xl ${isDesktop ? 'col-span-2' : ''}`}>
              <h3 className="font-semibold mb-4 text-balance">收入趨勢</h3>
              <div className="h-64 flex items-end gap-2">
                <div className="flex-1 bg-slate-100 rounded-t" style={{ height: '40%' }}></div>
                <div className="flex-1 bg-slate-100 rounded-t" style={{ height: '65%' }}></div>
                <div className="flex-1 bg-slate-100 rounded-t" style={{ height: '45%' }}></div>
                <div className="flex-1 bg-slate-100 rounded-t" style={{ height: '80%' }}></div>
                <div className="flex-1 bg-slate-100 rounded-t" style={{ height: '55%' }}></div>
                <div className="flex-1 bg-slate-100 rounded-t" style={{ height: '70%' }}></div>
                <div className="flex-1 bg-slate-900 rounded-t" style={{ height: '90%' }}></div>
              </div>
              <div className="flex justify-between mt-4 text-sm text-slate-500">
                <span>一月</span>
                <span>二月</span>
                <span>三月</span>
                <span>四月</span>
                <span>五月</span>
                <span>六月</span>
                <span>七月</span>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="p-6 border border-slate-200 rounded-xl">
              <h3 className="font-semibold mb-4 text-balance">最近活動</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium">王</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">王小明升級方案</p>
                    <p className="text-xs text-slate-500">2 分鐘前</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium">李</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">李小華完成註冊</p>
                    <p className="text-xs text-slate-500">5 分鐘前</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium">張</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">張大偉購買進階版</p>
                    <p className="text-xs text-slate-500">12 分鐘前</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium">陳</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">陳小美提交反饋</p>
                    <p className="text-xs text-slate-500">25 分鐘前</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
