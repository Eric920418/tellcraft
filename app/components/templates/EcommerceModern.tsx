'use client'

interface TemplateProps {
  containerWidth: number
}

export default function EcommerceModern({ containerWidth }: TemplateProps) {
  const isDesktop = containerWidth >= 1024
  const isTablet = containerWidth >= 768
  const isMobile = containerWidth < 768

  return (
    <div className="bg-white text-slate-900 antialiased min-h-full">
      <div className="min-h-dvh">
        {/* Announcement Bar */}
        <div className="bg-slate-900 text-white text-center py-2 text-sm">
          限時優惠：全館滿 $2000 免運費 | 新會員首購 9 折
        </div>

        {/* Navigation */}
        <nav className="sticky top-0 bg-white border-b border-slate-200 z-30">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="#" className="text-2xl font-bold tracking-tight">MONO</a>

            {isDesktop && (
              <div className="flex items-center gap-8">
                <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">新品上市</a>
                <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">男裝</a>
                <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">女裝</a>
                <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">配件</a>
                <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">限定</a>
              </div>
            )}

            <div className="flex items-center gap-4">
              <button aria-label="搜尋" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </button>
              <button aria-label="帳戶" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </button>
              <button aria-label="購物車" className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-slate-900 text-white text-xs rounded-full flex items-center justify-center tabular-nums">3</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative">
          <div className="aspect-[21/9] bg-slate-100 flex items-center">
            <div className="max-w-7xl mx-auto px-6 w-full">
              <div className="max-w-lg">
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">2024 秋冬系列</span>
                <h1 className={`${isDesktop ? 'text-5xl' : 'text-4xl'} font-bold mt-4 mb-6 text-balance`}>
                  極簡美學<br/>重新定義
                </h1>
                <p className="text-lg text-slate-600 mb-8 text-pretty">
                  探索全新系列，以永恆的設計語言，打造屬於你的風格宣言。
                </p>
                <a href="#" className="inline-block px-8 py-4 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors">
                  探索系列
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className={`grid gap-6 ${isDesktop ? 'grid-cols-3' : isTablet ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <a href="#" className="group relative aspect-[4/5] bg-slate-100 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/30 transition-colors"></div>
                <div className="absolute inset-x-6 bottom-6">
                  <h3 className="text-white text-xl font-semibold">男裝系列</h3>
                  <p className="text-white/80 text-sm mt-1">探索全系列 →</p>
                </div>
              </a>
              <a href="#" className="group relative aspect-[4/5] bg-slate-100 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/30 transition-colors"></div>
                <div className="absolute inset-x-6 bottom-6">
                  <h3 className="text-white text-xl font-semibold">女裝系列</h3>
                  <p className="text-white/80 text-sm mt-1">探索全系列 →</p>
                </div>
              </a>
              <a href="#" className={`group relative aspect-[4/5] bg-slate-100 rounded-xl overflow-hidden ${isTablet && !isDesktop ? 'col-span-2' : ''}`}>
                <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/30 transition-colors"></div>
                <div className="absolute inset-x-6 bottom-6">
                  <h3 className="text-white text-xl font-semibold">配件系列</h3>
                  <p className="text-white/80 text-sm mt-1">探索全系列 →</p>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 px-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <h2 className={`${isDesktop ? 'text-3xl' : 'text-2xl'} font-bold text-balance`}>熱銷商品</h2>
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">
                查看全部 →
              </a>
            </div>

            <div className={`grid gap-6 ${isDesktop ? 'grid-cols-4' : 'grid-cols-2'}`}>
              {/* Product 1 */}
              <div className="group">
                <div className="aspect-[3/4] bg-slate-200 rounded-xl mb-4 overflow-hidden relative">
                  <span className="absolute top-3 left-3 px-2 py-1 bg-slate-900 text-white text-xs font-medium rounded">新品</span>
                </div>
                <h3 className="font-medium truncate">經典羊毛大衣</h3>
                <p className="text-slate-500 text-sm">深海藍</p>
                <p className="font-semibold mt-1 tabular-nums">$4,980</p>
              </div>

              {/* Product 2 */}
              <div className="group">
                <div className="aspect-[3/4] bg-slate-200 rounded-xl mb-4 overflow-hidden relative">
                  <span className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded">-30%</span>
                </div>
                <h3 className="font-medium truncate">純棉休閒襯衫</h3>
                <p className="text-slate-500 text-sm">米白色</p>
                <p className="mt-1">
                  <span className="font-semibold tabular-nums">$1,260</span>
                  <span className="text-slate-400 line-through text-sm ml-2 tabular-nums">$1,800</span>
                </p>
              </div>

              {/* Product 3 */}
              <div className="group">
                <div className="aspect-[3/4] bg-slate-200 rounded-xl mb-4 overflow-hidden"></div>
                <h3 className="font-medium truncate">針織高領毛衣</h3>
                <p className="text-slate-500 text-sm">炭灰色</p>
                <p className="font-semibold mt-1 tabular-nums">$2,480</p>
              </div>

              {/* Product 4 */}
              <div className="group">
                <div className="aspect-[3/4] bg-slate-200 rounded-xl mb-4 overflow-hidden"></div>
                <h3 className="font-medium truncate">經典皮革腰帶</h3>
                <p className="text-slate-500 text-sm">深棕色</p>
                <p className="font-semibold mt-1 tabular-nums">$1,680</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-6">
          <div className={`max-w-7xl mx-auto grid gap-8 ${isDesktop ? 'grid-cols-4' : isTablet ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                </svg>
              </div>
              <h3 className="font-semibold mb-2">免費配送</h3>
              <p className="text-sm text-slate-600">滿 $2000 免運</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </div>
              <h3 className="font-semibold mb-2">30 天退換</h3>
              <p className="text-sm text-slate-600">無條件退換貨</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <h3 className="font-semibold mb-2">安全付款</h3>
              <p className="text-sm text-slate-600">SSL 加密保護</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </div>
              <h3 className="font-semibold mb-2">專業客服</h3>
              <p className="text-sm text-slate-600">線上即時支援</p>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-16 px-6 bg-slate-900 text-white">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className={`${isDesktop ? 'text-3xl' : 'text-2xl'} font-bold mb-4 text-balance`}>訂閱電子報</h2>
            <p className="text-slate-300 mb-8 text-pretty">
              搶先獲得新品資訊、獨家優惠與風格靈感
            </p>
            <form className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4 max-w-md mx-auto`}>
              <input
                type="email"
                placeholder="輸入電子郵件"
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-white text-slate-900 font-medium rounded-lg hover:bg-slate-100 transition-colors"
              >
                訂閱
              </button>
            </form>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-slate-200">
          <div className={`max-w-7xl mx-auto grid gap-8 ${isDesktop ? 'grid-cols-4' : isTablet ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <h3 className="text-xl font-bold mb-4">MONO</h3>
              <p className="text-slate-600 text-sm text-pretty">
                極簡美學，永恆設計。
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">購物指南</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900 transition-colors">尺寸指南</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">配送資訊</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">退換貨政策</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">付款方式</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">關於我們</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900 transition-colors">品牌故事</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">永續發展</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">門市據點</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">加入我們</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">客戶服務</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900 transition-colors">常見問題</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">聯繫我們</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">訂單查詢</a></li>
              </ul>
            </div>
          </div>
          <div className={`max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-200 flex ${isMobile ? 'flex-col' : 'flex-row'} items-center justify-between gap-4`}>
            <p className="text-sm text-slate-500">© 2024 MONO. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="LINE">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
