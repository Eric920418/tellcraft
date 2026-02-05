'use client'

interface TemplateProps {
  containerWidth: number
}

export default function LandingStartup({ containerWidth }: TemplateProps) {
  const isDesktop = containerWidth >= 1024
  const isTablet = containerWidth >= 768

  // 顏色
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
    emerald400: '#34d399',
    emerald500: '#10b981',
  }

  return (
    <div style={{ minHeight: '100%', background: colors.white, color: colors.slate900, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${colors.slate200}`,
        zIndex: 30,
      }}>
        <div style={{
          maxWidth: 1152,
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <a href="#" style={{ fontSize: 20, fontWeight: 700, textDecoration: 'none', color: 'inherit' }}>LaunchPad</a>
          {isTablet && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <a href="#features" style={{ color: colors.slate600, textDecoration: 'none' }}>功能</a>
              <a href="#pricing" style={{ color: colors.slate600, textDecoration: 'none' }}>價格</a>
              <a href="#about" style={{ color: colors.slate600, textDecoration: 'none' }}>關於</a>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="#" style={{ color: colors.slate600, textDecoration: 'none' }}>登入</a>
            <a href="#" style={{
              padding: '8px 16px',
              background: colors.slate900,
              color: colors.white,
              borderRadius: 8,
              textDecoration: 'none',
            }}>免費試用</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ paddingTop: 128, paddingBottom: 80, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ maxWidth: 896, margin: '0 auto', textAlign: 'center' }}>
          <span style={{
            display: 'inline-block',
            padding: '6px 16px',
            background: colors.slate100,
            color: colors.slate700,
            fontSize: 14,
            fontWeight: 500,
            borderRadius: 9999,
            marginBottom: 24,
          }}>
            全新 2.0 版本已上線
          </span>
          <h1 style={{
            fontSize: isDesktop ? 60 : 36,
            fontWeight: 700,
            marginBottom: 24,
            lineHeight: 1.1,
          }}>
            打造你的下一個{isTablet && <br />}偉大產品
          </h1>
          <p style={{
            fontSize: 20,
            color: colors.slate600,
            marginBottom: 40,
            maxWidth: 672,
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.6,
          }}>
            一站式產品開發平台，從想法到上線只需幾分鐘。無需程式碼，無限可能。
          </p>
          <div style={{
            display: 'flex',
            flexDirection: isTablet ? 'row' : 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}>
            <a href="#" style={{
              width: isTablet ? 'auto' : '100%',
              padding: '16px 32px',
              background: colors.slate900,
              color: colors.white,
              fontSize: 18,
              fontWeight: 500,
              borderRadius: 12,
              textDecoration: 'none',
              textAlign: 'center',
            }}>
              立即開始 — 免費
            </a>
            <a href="#" style={{
              width: isTablet ? 'auto' : '100%',
              padding: '16px 32px',
              border: `1px solid ${colors.slate300}`,
              fontSize: 18,
              fontWeight: 500,
              borderRadius: 12,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: 'inherit',
              background: colors.white,
            }}>
              <svg style={{ width: 20, height: 20 }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              觀看演示
            </a>
          </div>
          <p style={{ marginTop: 24, fontSize: 14, color: colors.slate500 }}>已有超過 10,000+ 團隊信任使用</p>
        </div>
      </section>

      {/* Logo Cloud */}
      <section style={{
        padding: '48px 24px',
        borderTop: `1px solid ${colors.slate200}`,
        borderBottom: `1px solid ${colors.slate200}`,
        background: colors.slate50,
      }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 14, color: colors.slate500, marginBottom: 32 }}>獲得業界領先企業的信任</p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            columnGap: isDesktop ? 48 : 32,
            rowGap: 24,
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: colors.slate300 }}>Acme Inc</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: colors.slate300 }}>Globex</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: colors.slate300 }}>Soylent</div>
            {isTablet && <div style={{ fontSize: 24, fontWeight: 700, color: colors.slate300 }}>Initech</div>}
            {isDesktop && <div style={{ fontSize: 24, fontWeight: 700, color: colors.slate300 }}>Umbrella</div>}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: isDesktop ? 36 : 30, fontWeight: 700, marginBottom: 16 }}>專為效率而生</h2>
            <p style={{ fontSize: 18, color: colors.slate600, maxWidth: 672, margin: '0 auto', lineHeight: 1.6 }}>
              我們的平台提供了你需要的一切工具，幫助你快速驗證想法並推向市場
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : isTablet ? 'repeat(2, 1fr)' : '1fr',
            gap: 32,
          }}>
            {/* Feature 1 */}
            <div style={{ padding: 32, border: `1px solid ${colors.slate200}`, borderRadius: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                background: colors.slate100,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}>
                <svg style={{ width: 24, height: 24, color: colors.slate700 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>極速部署</h3>
              <p style={{ color: colors.slate600, lineHeight: 1.6 }}>
                一鍵部署到全球 CDN，自動 SSL 憑證，99.99% 可用性保證。
              </p>
            </div>

            {/* Feature 2 */}
            <div style={{ padding: 32, border: `1px solid ${colors.slate200}`, borderRadius: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                background: colors.slate100,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}>
                <svg style={{ width: 24, height: 24, color: colors.slate700 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                </svg>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>可視化編輯器</h3>
              <p style={{ color: colors.slate600, lineHeight: 1.6 }}>
                拖放式介面設計，即時預覽，無需任何程式碼知識。
              </p>
            </div>

            {/* Feature 3 */}
            <div style={{
              padding: 32,
              border: `1px solid ${colors.slate200}`,
              borderRadius: 16,
              gridColumn: isTablet && !isDesktop ? 'span 2' : undefined,
            }}>
              <div style={{
                width: 48,
                height: 48,
                background: colors.slate100,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}>
                <svg style={{ width: 24, height: 24, color: colors.slate700 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>數據分析</h3>
              <p style={{ color: colors.slate600, lineHeight: 1.6 }}>
                內建分析儀表板，追蹤訪客行為，優化轉換率。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '80px 24px', background: colors.slate50 }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: isDesktop ? 36 : 30, fontWeight: 700, marginBottom: 16 }}>簡單透明的價格</h2>
            <p style={{ fontSize: 18, color: colors.slate600 }}>無隱藏費用，隨時取消</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : isTablet ? 'repeat(2, 1fr)' : '1fr',
            gap: 32,
            maxWidth: 1024,
            margin: '0 auto',
          }}>
            {/* Starter */}
            <div style={{ background: colors.white, padding: 32, borderRadius: 16, border: `1px solid ${colors.slate200}` }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>入門版</h3>
              <p style={{ color: colors.slate500, fontSize: 14, marginBottom: 24 }}>適合個人專案</p>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 36, fontWeight: 700 }}>$0</span>
                <span style={{ color: colors.slate500 }}>/月</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 32 }}>
                {['3 個專案', '基礎分析', '社群支援'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, marginBottom: 12 }}>
                    <svg style={{ width: 20, height: 20, color: colors.emerald500, flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <button style={{
                width: '100%',
                padding: 12,
                border: `1px solid ${colors.slate300}`,
                borderRadius: 12,
                fontWeight: 500,
                background: colors.white,
                cursor: 'pointer',
              }}>
                免費開始
              </button>
            </div>

            {/* Pro */}
            <div style={{
              background: colors.slate900,
              color: colors.white,
              padding: 32,
              borderRadius: 16,
              position: 'relative',
            }}>
              <span style={{
                position: 'absolute',
                top: -12,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '4px 12px',
                background: colors.emerald500,
                color: colors.white,
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 9999,
              }}>
                最受歡迎
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>專業版</h3>
              <p style={{ color: colors.slate400, fontSize: 14, marginBottom: 24 }}>適合成長中的團隊</p>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 36, fontWeight: 700 }}>$29</span>
                <span style={{ color: colors.slate400 }}>/月</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 32 }}>
                {['無限專案', '進階分析', '優先支援', '自訂網域'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, marginBottom: 12 }}>
                    <svg style={{ width: 20, height: 20, color: colors.emerald400, flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <button style={{
                width: '100%',
                padding: 12,
                background: colors.white,
                color: colors.slate900,
                borderRadius: 12,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
              }}>
                開始試用
              </button>
            </div>

            {/* Enterprise */}
            <div style={{
              background: colors.white,
              padding: 32,
              borderRadius: 16,
              border: `1px solid ${colors.slate200}`,
              gridColumn: isTablet && !isDesktop ? 'span 2' : undefined,
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>企業版</h3>
              <p style={{ color: colors.slate500, fontSize: 14, marginBottom: 24 }}>適合大型組織</p>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 36, fontWeight: 700 }}>自訂</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 32 }}>
                {['專屬支援', 'SLA 保證', '客製化整合'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, marginBottom: 12 }}>
                    <svg style={{ width: 20, height: 20, color: colors.emerald500, flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <button style={{
                width: '100%',
                padding: 12,
                border: `1px solid ${colors.slate300}`,
                borderRadius: 12,
                fontWeight: 500,
                background: colors.white,
                cursor: 'pointer',
              }}>
                聯繫銷售
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 896, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: isDesktop ? 36 : 30, fontWeight: 700, marginBottom: 24 }}>
            準備好開始了嗎？
          </h2>
          <p style={{ fontSize: 18, color: colors.slate600, marginBottom: 40, lineHeight: 1.6 }}>
            加入超過 10,000 位創作者的行列，今天就開始打造你的產品
          </p>
          <a href="#" style={{
            display: 'inline-block',
            padding: '16px 32px',
            background: colors.slate900,
            color: colors.white,
            fontSize: 18,
            fontWeight: 500,
            borderRadius: 12,
            textDecoration: 'none',
          }}>
            免費開始使用
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '48px 24px', borderTop: `1px solid ${colors.slate200}` }}>
        <div style={{
          maxWidth: 1152,
          margin: '0 auto',
          display: 'flex',
          flexDirection: isTablet ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>LaunchPad</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, fontSize: 14, color: colors.slate500 }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>隱私政策</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>服務條款</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>聯繫我們</a>
          </div>
          <p style={{ fontSize: 14, color: colors.slate500 }}>© 2024 LaunchPad. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
