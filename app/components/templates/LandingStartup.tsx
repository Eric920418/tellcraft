'use client'

interface TemplateProps {
  containerWidth: number
}

export default function LandingStartup({ containerWidth }: TemplateProps) {
  const isDesktop = containerWidth >= 1024
  const isTablet = containerWidth >= 768
  const isMobile = containerWidth < 768

  return (
    <div className="bg-white text-slate-900 antialiased" style={{ minHeight: '100%' }}>
      <div>
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 z-30">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="#" className="text-xl font-bold">LaunchPad</a>
            {isTablet && (
              <div className="flex items-center gap-8">
                <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">功能</a>
                <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">價格</a>
                <a href="#about" className="text-slate-600 hover:text-slate-900 transition-colors">關於</a>
              </div>
            )}
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">登入</a>
              <a href="#" className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">免費試用</a>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-full mb-6">
              全新 2.0 版本已上線
            </span>
            <h1 className={`${isDesktop ? 'text-6xl' : 'text-4xl'} font-bold mb-6 text-balance`}>
              打造你的下一個{isTablet && <br />}偉大產品
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto text-pretty">
              一站式產品開發平台，從想法到上線只需幾分鐘。無需程式碼，無限可能。
            </p>
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-center justify-center gap-4`}>
              <a href="#" className={`${isMobile ? 'w-full' : 'w-auto'} px-8 py-4 bg-slate-900 text-white text-lg font-medium rounded-xl hover:bg-slate-800 transition-colors`}>
                立即開始 — 免費
              </a>
              <a href="#" className={`${isMobile ? 'w-full' : 'w-auto'} px-8 py-4 border border-slate-300 text-lg font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                觀看演示
              </a>
            </div>
            <p className="mt-6 text-sm text-slate-500">已有超過 10,000+ 團隊信任使用</p>
          </div>
        </section>

        {/* Logo Cloud */}
        <section className="py-12 px-6 border-y border-slate-200 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <p className="text-center text-sm text-slate-500 mb-8">獲得業界領先企業的信任</p>
            <div className={`flex flex-wrap items-center justify-center ${isDesktop ? 'gap-x-12' : 'gap-x-8'} gap-y-6`}>
              <div className="text-2xl font-bold text-slate-300">Acme Inc</div>
              <div className="text-2xl font-bold text-slate-300">Globex</div>
              <div className="text-2xl font-bold text-slate-300">Soylent</div>
              {isTablet && <div className="text-2xl font-bold text-slate-300">Initech</div>}
              {isDesktop && <div className="text-2xl font-bold text-slate-300">Umbrella</div>}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className={`${isDesktop ? 'text-4xl' : 'text-3xl'} font-bold mb-4 text-balance`}>專為效率而生</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto text-pretty">
                我們的平台提供了你需要的一切工具，幫助你快速驗證想法並推向市場
              </p>
            </div>

            <div className={`grid gap-8 ${isDesktop ? 'grid-cols-3' : isTablet ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div className="p-8 border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-balance">極速部署</h3>
                <p className="text-slate-600 text-pretty">
                  一鍵部署到全球 CDN，自動 SSL 憑證，99.99% 可用性保證。
                </p>
              </div>

              <div className="p-8 border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-balance">可視化編輯器</h3>
                <p className="text-slate-600 text-pretty">
                  拖放式介面設計，即時預覽，無需任何程式碼知識。
                </p>
              </div>

              <div className={`p-8 border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors ${isTablet && !isDesktop ? 'col-span-2' : ''}`}>
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-balance">數據分析</h3>
                <p className="text-slate-600 text-pretty">
                  內建分析儀表板，追蹤訪客行為，優化轉換率。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-6 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className={`${isDesktop ? 'text-4xl' : 'text-3xl'} font-bold mb-4 text-balance`}>簡單透明的價格</h2>
              <p className="text-lg text-slate-600 text-pretty">無隱藏費用，隨時取消</p>
            </div>

            <div className={`grid gap-8 max-w-5xl mx-auto ${isDesktop ? 'grid-cols-3' : isTablet ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {/* Starter */}
              <div className="bg-white p-8 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-semibold mb-2">入門版</h3>
                <p className="text-slate-500 text-sm mb-6">適合個人專案</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold tabular-nums">$0</span>
                  <span className="text-slate-500">/月</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    3 個專案
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    基礎分析
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    社群支援
                  </li>
                </ul>
                <button className="w-full py-3 border border-slate-300 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                  免費開始
                </button>
              </div>

              {/* Pro */}
              <div className="bg-slate-900 text-white p-8 rounded-2xl relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
                  最受歡迎
                </span>
                <h3 className="text-lg font-semibold mb-2">專業版</h3>
                <p className="text-slate-400 text-sm mb-6">適合成長中的團隊</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold tabular-nums">$29</span>
                  <span className="text-slate-400">/月</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    無限專案
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    進階分析
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    優先支援
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    自訂網域
                  </li>
                </ul>
                <button className="w-full py-3 bg-white text-slate-900 rounded-xl font-medium hover:bg-slate-100 transition-colors">
                  開始試用
                </button>
              </div>

              {/* Enterprise */}
              <div className={`bg-white p-8 rounded-2xl border border-slate-200 ${isTablet && !isDesktop ? 'col-span-2' : ''}`}>
                <h3 className="text-lg font-semibold mb-2">企業版</h3>
                <p className="text-slate-500 text-sm mb-6">適合大型組織</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">自訂</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    專屬支援
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    SLA 保證
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    客製化整合
                  </li>
                </ul>
                <button className="w-full py-3 border border-slate-300 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                  聯繫銷售
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className={`${isDesktop ? 'text-4xl' : 'text-3xl'} font-bold mb-6 text-balance`}>
              準備好開始了嗎？
            </h2>
            <p className="text-lg text-slate-600 mb-10 text-pretty">
              加入超過 10,000 位創作者的行列，今天就開始打造你的產品
            </p>
            <a href="#" className="inline-block px-8 py-4 bg-slate-900 text-white text-lg font-medium rounded-xl hover:bg-slate-800 transition-colors">
              免費開始使用
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-slate-200">
          <div className={`max-w-6xl mx-auto flex ${isMobile ? 'flex-col' : 'flex-row'} items-center justify-between gap-6`}>
            <div className="text-xl font-bold">LaunchPad</div>
            <div className="flex items-center gap-8 text-sm text-slate-500">
              <a href="#" className="hover:text-slate-900 transition-colors">隱私政策</a>
              <a href="#" className="hover:text-slate-900 transition-colors">服務條款</a>
              <a href="#" className="hover:text-slate-900 transition-colors">聯繫我們</a>
            </div>
            <p className="text-sm text-slate-500">© 2024 LaunchPad. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
