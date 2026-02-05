'use client'

interface TemplateProps {
  containerWidth: number
}

export default function EcommerceModern({ containerWidth }: TemplateProps) {
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
    red500: '#ef4444',
  }

  return (
    <div style={{ minHeight: '100%', background: colors.white, color: colors.slate900, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Announcement Bar */}
      <div style={{ background: colors.slate900, color: colors.white, textAlign: 'center', padding: '8px 0', fontSize: 14 }}>
        限時優惠：全館滿 $2000 免運費 | 新會員首購 9 折
      </div>

      {/* Navigation */}
      <nav style={{
        position: 'sticky',
        top: 0,
        background: colors.white,
        borderBottom: `1px solid ${colors.slate200}`,
        zIndex: 30,
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <a href="#" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', textDecoration: 'none', color: 'inherit' }}>MONO</a>

          {isDesktop && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              {['新品上市', '男裝', '女裝', '配件', '限定'].map((item, i) => (
                <a key={i} href="#" style={{ color: colors.slate600, textDecoration: 'none' }}>{item}</a>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button aria-label="搜尋" style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
              <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </button>
            <button aria-label="帳戶" style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
              <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </button>
            <button aria-label="購物車" style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
              <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              <span style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 18,
                height: 18,
                background: colors.slate900,
                color: colors.white,
                fontSize: 11,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>3</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ position: 'relative' }}>
        <div style={{
          aspectRatio: '21/9',
          background: colors.slate100,
          display: 'flex',
          alignItems: 'center',
        }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', width: '100%' }}>
            <div style={{ maxWidth: 512 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: colors.slate500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>2024 秋冬系列</span>
              <h1 style={{ fontSize: isDesktop ? 48 : 36, fontWeight: 700, marginTop: 16, marginBottom: 24, lineHeight: 1.2 }}>
                極簡美學<br/>重新定義
              </h1>
              <p style={{ fontSize: 18, color: colors.slate600, marginBottom: 32, lineHeight: 1.6 }}>
                探索全新系列，以永恆的設計語言，打造屬於你的風格宣言。
              </p>
              <a href="#" style={{
                display: 'inline-block',
                padding: '16px 32px',
                background: colors.slate900,
                color: colors.white,
                fontWeight: 500,
                borderRadius: 8,
                textDecoration: 'none',
              }}>
                探索系列
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : isTablet ? 'repeat(2, 1fr)' : '1fr',
            gap: 24,
          }}>
            {['男裝系列', '女裝系列', '配件系列'].map((category, i) => (
              <a key={i} href="#" style={{
                position: 'relative',
                aspectRatio: '4/5',
                background: colors.slate100,
                borderRadius: 12,
                overflow: 'hidden',
                textDecoration: 'none',
                gridColumn: isTablet && !isDesktop && i === 2 ? 'span 2' : undefined,
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(15,23,42,0.2)',
                }}></div>
                <div style={{
                  position: 'absolute',
                  left: 24,
                  right: 24,
                  bottom: 24,
                }}>
                  <h3 style={{ color: colors.white, fontSize: 20, fontWeight: 600 }}>{category}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 }}>探索全系列 →</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ padding: '64px 24px', background: colors.slate50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
            <h2 style={{ fontSize: isDesktop ? 30 : 24, fontWeight: 700 }}>熱銷商品</h2>
            <a href="#" style={{ color: colors.slate600, textDecoration: 'none' }}>查看全部 →</a>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
            gap: 24,
          }}>
            {[
              { name: '經典羊毛大衣', color: '深海藍', price: '$4,980', badge: '新品', badgeColor: colors.slate900 },
              { name: '純棉休閒襯衫', color: '米白色', price: '$1,260', oldPrice: '$1,800', badge: '-30%', badgeColor: colors.red500 },
              { name: '針織高領毛衣', color: '炭灰色', price: '$2,480', badge: null, badgeColor: null },
              { name: '經典皮革腰帶', color: '深棕色', price: '$1,680', badge: null, badgeColor: null },
            ].map((product, i) => (
              <div key={i}>
                <div style={{
                  aspectRatio: '3/4',
                  background: colors.slate200,
                  borderRadius: 12,
                  marginBottom: 16,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  {product.badge && (
                    <span style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      padding: '4px 8px',
                      background: product.badgeColor,
                      color: colors.white,
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 4,
                    }}>{product.badge}</span>
                  )}
                </div>
                <h3 style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</h3>
                <p style={{ color: colors.slate500, fontSize: 14 }}>{product.color}</p>
                <p style={{ marginTop: 4 }}>
                  <span style={{ fontWeight: 600 }}>{product.price}</span>
                  {product.oldPrice && (
                    <span style={{ color: colors.slate400, textDecoration: 'line-through', fontSize: 14, marginLeft: 8 }}>{product.oldPrice}</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '64px 24px' }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : isTablet ? 'repeat(2, 1fr)' : '1fr',
          gap: 32,
        }}>
          {[
            { icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4', title: '免費配送', desc: '滿 $2000 免運' },
            { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', title: '30 天退換', desc: '無條件退換貨' },
            { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: '安全付款', desc: 'SSL 加密保護' },
            { icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z', title: '專業客服', desc: '線上即時支援' },
          ].map((feature, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                width: 48,
                height: 48,
                background: colors.slate100,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <svg style={{ width: 24, height: 24, color: colors.slate700 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feature.icon}/>
                </svg>
              </div>
              <h3 style={{ fontWeight: 600, marginBottom: 8 }}>{feature.title}</h3>
              <p style={{ fontSize: 14, color: colors.slate600 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section style={{ padding: '64px 24px', background: colors.slate900, color: colors.white }}>
        <div style={{ maxWidth: 672, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: isDesktop ? 30 : 24, fontWeight: 700, marginBottom: 16 }}>訂閱電子報</h2>
          <p style={{ color: colors.slate300, marginBottom: 32 }}>
            搶先獲得新品資訊、獨家優惠與風格靈感
          </p>
          <form style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 16,
            maxWidth: 448,
            margin: '0 auto',
          }}>
            <input
              type="email"
              placeholder="輸入電子郵件"
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                color: colors.white,
                fontSize: 16,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                background: colors.white,
                color: colors.slate900,
                fontWeight: 500,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              訂閱
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '48px 24px', borderTop: `1px solid ${colors.slate200}` }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : isTablet ? 'repeat(2, 1fr)' : '1fr',
          gap: 32,
        }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>MONO</h3>
            <p style={{ color: colors.slate600, fontSize: 14 }}>極簡美學，永恆設計。</p>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 16 }}>購物指南</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['尺寸指南', '配送資訊', '退換貨政策', '付款方式'].map((item, i) => (
                <li key={i} style={{ marginBottom: 8 }}>
                  <a href="#" style={{ color: colors.slate600, fontSize: 14, textDecoration: 'none' }}>{item}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 16 }}>關於我們</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['品牌故事', '永續發展', '門市據點', '加入我們'].map((item, i) => (
                <li key={i} style={{ marginBottom: 8 }}>
                  <a href="#" style={{ color: colors.slate600, fontSize: 14, textDecoration: 'none' }}>{item}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 16 }}>客戶服務</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['常見問題', '聯繫我們', '訂單查詢'].map((item, i) => (
                <li key={i} style={{ marginBottom: 8 }}>
                  <a href="#" style={{ color: colors.slate600, fontSize: 14, textDecoration: 'none' }}>{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div style={{
          maxWidth: 1280,
          margin: '48px auto 0',
          paddingTop: 32,
          borderTop: `1px solid ${colors.slate200}`,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}>
          <p style={{ fontSize: 14, color: colors.slate500 }}>© 2024 MONO. All rights reserved.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {['Instagram', 'Facebook', 'LINE'].map((social, i) => (
              <a key={i} href="#" style={{ color: colors.slate400, textDecoration: 'none', fontSize: 14 }} aria-label={social}>
                {social}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
