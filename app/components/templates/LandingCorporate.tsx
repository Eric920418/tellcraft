'use client'

interface TemplateProps {
  containerWidth: number
}

export default function LandingCorporate({ containerWidth }: TemplateProps) {
  const isDesktop = containerWidth >= 1024
  const isTablet = containerWidth >= 768

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
  }

  return (
    <div style={{ minHeight: '100%', background: colors.white, color: colors.slate900, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Navigation */}
      <nav style={{ background: colors.white, borderBottom: `1px solid ${colors.slate200}` }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <a href="#" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', textDecoration: 'none', color: 'inherit' }}>Nexus Corp</a>
          {isDesktop && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <a href="#about" style={{ color: colors.slate600, textDecoration: 'none' }}>關於我們</a>
              <a href="#services" style={{ color: colors.slate600, textDecoration: 'none' }}>服務項目</a>
              <a href="#team" style={{ color: colors.slate600, textDecoration: 'none' }}>專業團隊</a>
              <a href="#contact" style={{ color: colors.slate600, textDecoration: 'none' }}>聯繫我們</a>
            </div>
          )}
          {isTablet && (
            <a href="#contact" style={{
              padding: '10px 20px',
              background: colors.slate900,
              color: colors.white,
              borderRadius: 8,
              textDecoration: 'none',
            }}>
              預約諮詢
            </a>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: '96px 24px', background: colors.slate50 }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: isDesktop ? 'grid' : 'block',
          gridTemplateColumns: isDesktop ? '1fr 1fr' : undefined,
          gap: 48,
          alignItems: 'center',
        }}>
          <div>
            <h1 style={{ fontSize: isDesktop ? 48 : 36, fontWeight: 700, marginBottom: 24, lineHeight: 1.2 }}>
              專業的企業解決方案<br/>值得信賴的合作夥伴
            </h1>
            <p style={{ fontSize: 18, color: colors.slate600, marginBottom: 32, lineHeight: 1.6 }}>
              超過 20 年的行業經驗，我們為全球 500+ 企業提供數位轉型、策略諮詢與技術服務。讓我們幫助您的企業邁向下一個高峰。
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <a href="#contact" style={{
                padding: '12px 24px',
                background: colors.slate900,
                color: colors.white,
                fontWeight: 500,
                borderRadius: 8,
                textDecoration: 'none',
              }}>
                免費諮詢
              </a>
              <a href="#services" style={{
                padding: '12px 24px',
                border: `1px solid ${colors.slate300}`,
                fontWeight: 500,
                borderRadius: 8,
                textDecoration: 'none',
                color: 'inherit',
              }}>
                了解更多
              </a>
            </div>
          </div>
          {isDesktop && (
            <div>
              <div style={{ aspectRatio: '4/3', background: colors.slate200, borderRadius: 16 }}></div>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '64px 24px', borderBottom: `1px solid ${colors.slate200}` }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
          gap: 32,
        }}>
          {[
            { value: '20+', label: '年行業經驗' },
            { value: '500+', label: '服務企業' },
            { value: '50+', label: '專業顧問' },
            { value: '98%', label: '客戶滿意度' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>{stat.value}</p>
              <p style={{ color: colors.slate600 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section id="services" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ maxWidth: 672, marginBottom: 64 }}>
            <h2 style={{ fontSize: isDesktop ? 36 : 30, fontWeight: 700, marginBottom: 16 }}>全方位服務項目</h2>
            <p style={{ fontSize: 18, color: colors.slate600, lineHeight: 1.6 }}>
              從策略規劃到執行落地，我們提供一站式的企業解決方案
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : isTablet ? 'repeat(2, 1fr)' : '1fr',
            gap: 32,
          }}>
            {[
              { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', title: '策略諮詢', desc: '深度市場分析，協助企業制定長期發展戰略與競爭優勢。' },
              { icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', title: '數位轉型', desc: '從流程優化到系統整合，全面提升企業數位化能力。' },
              { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', title: '組織發展', desc: '人才培育、組織設計、企業文化建設的專業顧問服務。' },
              { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: '財務規劃', desc: '資本結構優化、投資評估、風險管理的專業建議。' },
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: '資安合規', desc: 'ISO 認證輔導、資安稽核、法規遵循的完整服務。' },
              { icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: '國際拓展', desc: '海外市場進入策略、在地化營運、跨境合作支援。' },
            ].map((service, i) => (
              <div key={i} style={{ padding: 32, border: `1px solid ${colors.slate200}`, borderRadius: 12 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  background: colors.slate100,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                }}>
                  <svg style={{ width: 28, height: 28, color: colors.slate700 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={service.icon}/>
                  </svg>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>{service.title}</h3>
                <p style={{ color: colors.slate600, lineHeight: 1.6 }}>{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" style={{ padding: '96px 24px', background: colors.slate50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: isDesktop ? 36 : 30, fontWeight: 700, marginBottom: 16 }}>專業團隊</h2>
            <p style={{ fontSize: 18, color: colors.slate600 }}>資深顧問團隊，平均擁有 15 年以上產業經驗</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : isTablet ? 'repeat(2, 1fr)' : '1fr',
            gap: 32,
          }}>
            {[
              { name: '陳建華', role: '執行長 / 創辦人', desc: '前麥肯錫資深合夥人，專注企業策略 25 年' },
              { name: '林美玲', role: '技術長', desc: '前 Google 工程總監，數位轉型專家' },
              { name: '王志明', role: '財務長', desc: '前高盛亞太區副總裁，財務規劃專家' },
              { name: '張雅婷', role: '營運長', desc: '前台積電營運主管，流程優化專家' },
            ].map((member, i) => (
              <div key={i} style={{ background: colors.white, padding: 24, borderRadius: 12, border: `1px solid ${colors.slate200}` }}>
                <div style={{ aspectRatio: '1', background: colors.slate200, borderRadius: 8, marginBottom: 16 }}></div>
                <h3 style={{ fontWeight: 600, fontSize: 18 }}>{member.name}</h3>
                <p style={{ color: colors.slate500, fontSize: 14, marginBottom: 12 }}>{member.role}</p>
                <p style={{ color: colors.slate600, fontSize: 14, lineHeight: 1.6 }}>{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 768, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: isDesktop ? 36 : 30, fontWeight: 700, marginBottom: 16 }}>預約免費諮詢</h2>
            <p style={{ fontSize: 18, color: colors.slate600 }}>
              留下您的聯繫方式，我們的顧問將在 24 小時內與您聯繫
            </p>
          </div>

          <form style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isTablet ? '1fr 1fr' : '1fr',
              gap: 24,
            }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>姓名</label>
                <input
                  type="text"
                  placeholder="您的姓名"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${colors.slate300}`,
                    borderRadius: 8,
                    fontSize: 16,
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>公司名稱</label>
                <input
                  type="text"
                  placeholder="公司名稱"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${colors.slate300}`,
                    borderRadius: 8,
                    fontSize: 16,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isTablet ? '1fr 1fr' : '1fr',
              gap: 24,
            }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>電子郵件</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${colors.slate300}`,
                    borderRadius: 8,
                    fontSize: 16,
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>聯繫電話</label>
                <input
                  type="tel"
                  placeholder="0912-345-678"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${colors.slate300}`,
                    borderRadius: 8,
                    fontSize: 16,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>諮詢內容</label>
              <textarea
                rows={4}
                placeholder="請簡述您的需求..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${colors.slate300}`,
                  borderRadius: 8,
                  fontSize: 16,
                  outline: 'none',
                  resize: 'none',
                }}
              ></textarea>
            </div>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: 16,
                background: colors.slate900,
                color: colors.white,
                fontWeight: 500,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              提交諮詢
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '48px 24px', background: colors.slate900, color: colors.white }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : isTablet ? 'repeat(2, 1fr)' : '1fr',
          gap: 32,
        }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Nexus Corp</h3>
            <p style={{ color: colors.slate400, fontSize: 14, lineHeight: 1.6 }}>
              專業的企業解決方案，值得信賴的合作夥伴
            </p>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 16 }}>服務項目</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['策略諮詢', '數位轉型', '組織發展'].map((item, i) => (
                <li key={i} style={{ marginBottom: 8 }}>
                  <a href="#" style={{ color: colors.slate400, fontSize: 14, textDecoration: 'none' }}>{item}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 16 }}>關於我們</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['公司介紹', '專業團隊', '加入我們'].map((item, i) => (
                <li key={i} style={{ marginBottom: 8 }}>
                  <a href="#" style={{ color: colors.slate400, fontSize: 14, textDecoration: 'none' }}>{item}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 16 }}>聯繫方式</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: colors.slate400, fontSize: 14 }}>
              <li style={{ marginBottom: 8 }}>台北市信義區信義路五段7號</li>
              <li style={{ marginBottom: 8 }}>+886 2 8101 8888</li>
              <li>contact@nexuscorp.com</li>
            </ul>
          </div>
        </div>
        <div style={{
          maxWidth: 1280,
          margin: '48px auto 0',
          paddingTop: 32,
          borderTop: `1px solid ${colors.slate700}`,
          textAlign: 'center',
          fontSize: 14,
          color: colors.slate400,
        }}>
          © 2024 Nexus Corp. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
