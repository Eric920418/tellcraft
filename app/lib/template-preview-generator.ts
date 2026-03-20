/**
 * Template Preview Generator
 * 從模板 metadata（name/description/category/tags）生成 React 代碼字串
 * 無 LLM、零 token、純確定性生成
 */

// ── 顏色提取 ──────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  橘: '#f97316',
  橙: '#f97316',
  紫: '#8b5cf6',
  藍: '#3b82f6',
  紅: '#ef4444',
  綠: '#10b981',
  翠: '#10b981',
  金: '#f59e0b',
  黃: '#eab308',
  霓虹: '#a3e635',
  螢光: '#a3e635',
  粉: '#ec4899',
  青: '#06b6d4',
  棕: '#a16207',
  玫: '#f43f5e',
  薄荷: '#34d399',
  天空: '#38bdf8',
  珊瑚: '#fb7185',
  靛: '#6366f1',
}

const DARK_KEYWORDS = ['暗', '深色', '黑', '夜', '電影感', '深', '極暗', '炭', '墨', '暗黑', '炫黑', '復古']

interface TemplateColors {
  primary: string
  accent: string
  isDark: boolean
}

function extractColors(tags: string[], description: string): TemplateColors {
  const allText = [...tags, description].join(' ')
  const found: string[] = []
  for (const [kw, color] of Object.entries(COLOR_MAP)) {
    if (allText.includes(kw)) found.push(color)
  }
  const primary = found[0] ?? '#3b82f6'
  let accent = found[1] ?? '#8b5cf6'
  if (found.length === 1) {
    const map: Record<string, string> = {
      '#f97316': '#8b5cf6',
      '#8b5cf6': '#06b6d4',
      '#3b82f6': '#f59e0b',
      '#10b981': '#3b82f6',
      '#ef4444': '#f59e0b',
      '#f59e0b': '#ef4444',
      '#ec4899': '#8b5cf6',
      '#06b6d4': '#f97316',
      '#a3e635': '#8b5cf6',
    }
    accent = map[primary] ?? '#8b5cf6'
  }
  if (found.length === 0) {
    // no color keyword — assign by category default handled in generator
  }
  const isDark = DARK_KEYWORDS.some(kw => allText.includes(kw))
  return { primary, accent, isDark }
}

function rgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

// ── 代碼生成：各 category ──────────────────────────────────────────────────────

function genLanding(name: string, c: TemplateColors): string {
  const { primary, accent, isDark } = c
  const bg = isDark ? '#09090b' : '#ffffff'
  const navBg = primary
  const text = isDark ? '#f1f5f9' : '#0f172a'
  const subtext = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#18181b' : '#f8fafc'
  const border = isDark ? '#27272a' : '#e2e8f0'
  const shortName = name.slice(0, 12)

  return `'use client'

export default function Page() {
  const features = [
    { icon: '⚡', title: '極速啟動', desc: '一鍵部署，分鐘內上線，無需繁瑣配置' },
    { icon: '🎨', title: '自由設計', desc: '完整客製化能力，讓品牌個性盡情展現' },
    { icon: '🔒', title: '安全可靠', desc: '企業級安全架構，資料加密全程保護' },
  ]
  return (
    <div style={{ minHeight: '100vh', background: '${bg}', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '${text}' }}>
      <nav style={{ background: '${navBg}', padding: '0 48px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: 'white', letterSpacing: '-0.02em' }}>${shortName}</div>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {['功能', '定價', '關於'].map(item => (
            <span key={item} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, cursor: 'pointer' }}>{item}</span>
          ))}
          <button style={{ background: 'white', color: '${navBg}', border: 'none', padding: '8px 20px', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>開始使用</button>
        </div>
      </nav>
      <section style={{ padding: '80px 48px 60px', maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: '${rgba(accent, 0.12)}', color: '${accent}', padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, marginBottom: 24, gap: 6 }}>
            <span>✦</span> 全新發布
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 20px' }}>${name}</h1>
          <p style={{ fontSize: 18, color: '${subtext}', lineHeight: 1.7, margin: '0 0 36px' }}>專為現代團隊打造的智能解決方案，提升工作效率，讓創意無限延伸。</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={{ background: '${primary}', color: 'white', border: 'none', padding: '14px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>免費開始</button>
            <button style={{ background: 'transparent', color: '${text}', border: '1.5px solid ${border}', padding: '14px 28px', borderRadius: 8, fontSize: 15, cursor: 'pointer' }}>觀看 Demo →</button>
          </div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, ${rgba(primary, 0.1)}, ${rgba(accent, 0.1)})', borderRadius: 20, padding: 28, border: '1px solid ${border}' }}>
          <div style={{ background: '${isDark ? '#18181b' : 'white'}', borderRadius: 12, padding: 24, boxShadow: '0 8px 32px ${rgba(primary, 0.12)}' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              {['${primary}', '${accent}', '#10b981'].map((col, i) => (
                <div key={i} style={{ flex: 1, height: 60, borderRadius: 8, background: col, opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18 }}>
                  {['84K', '61%', '+28'][i]}
                </div>
              ))}
            </div>
            {[85, 60, 92, 48].map((w, i) => (
              <div key={i} style={{ height: 8, background: '${border}', borderRadius: 4, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ width: w + '%', height: '100%', background: '${primary}', opacity: 0.4 + i * 0.15 }} />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section style={{ padding: '0 48px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {features.map(f => (
            <div key={f.title} style={{ padding: 28, background: '${cardBg}', borderRadius: 12, border: '1px solid ${border}' }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{f.title}</div>
              <div style={{ color: '${subtext}', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}`
}

function genSaas(name: string, c: TemplateColors): string {
  const { primary, accent, isDark } = c
  const bg = isDark ? '#0d0d14' : '#f1f5f9'
  const sidebarBg = isDark ? '#0a0a12' : '#1e293b'
  const contentBg = isDark ? '#13131f' : '#ffffff'
  const text = isDark ? '#e2e8f0' : '#1e293b'
  const subtext = isDark ? '#8b949e' : '#64748b'
  const border = isDark ? '#1e2030' : '#e2e8f0'
  const shortName = name.slice(0, 12)

  return `'use client'

export default function Page() {
  const metrics = [
    { label: '總用戶', value: '12,847', trend: '+12%', up: true },
    { label: '月收入', value: '$48.2K', trend: '+8.3%', up: true },
    { label: '轉換率', value: '3.24%', trend: '+0.8%', up: true },
    { label: '流失率', value: '2.1%', trend: '-0.3%', up: false },
  ]
  const navItems = ['概覽', '分析', '用戶', '報告', '設置']
  const bars = [40, 65, 45, 80, 55, 90, 75, 85, 60, 95, 70, 88]
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '${bg}', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ background: '${contentBg}', borderBottom: '1px solid ${border}', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: '${primary}' }}>${shortName}</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '${primary}', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 13 }}>A</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 220, background: '${sidebarBg}', borderRight: '1px solid ${isDark ? '#1e2030' : 'rgba(0,0,0,0.1)'}', padding: '16px 0', flexShrink: 0 }}>
          {navItems.map((item, i) => (
            <div key={item} style={{ padding: '10px 18px', color: i === 0 ? '${primary}' : 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: i === 0 ? '${rgba(primary, 0.12)}' : 'transparent', borderLeft: i === 0 ? '2px solid ${primary}' : '2px solid transparent' }}>
              <span>{['📊','📈','👥','📋','⚙️'][i]}</span> {item}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, padding: 24, overflow: 'auto', background: '${bg}' }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '${text}', margin: '0 0 20px' }}>${name}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            {metrics.map(m => (
              <div key={m.label} style={{ background: '${contentBg}', border: '1px solid ${border}', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11, color: '${subtext}', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '${text}', marginBottom: 4 }}>{m.value}</div>
                <div style={{ fontSize: 12, color: m.up ? '#10b981' : '#ef4444', fontWeight: 500 }}>{m.trend}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '${contentBg}', border: '1px solid ${border}', borderRadius: 10, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '${text}' }}>趨勢分析</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['7D','1M','3M','1Y'].map((t, i) => (
                  <span key={t} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, background: i === 1 ? '${primary}' : '${border}', color: i === 1 ? 'white' : '${subtext}', cursor: 'pointer' }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
              {bars.map((h, i) => (
                <div key={i} style={{ flex: 1, background: i === 11 ? '${primary}' : '${rgba(primary, 0.3)}', borderRadius: '3px 3px 0 0', height: h + '%' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}`
}

function genDashboard(name: string, c: TemplateColors): string {
  const { primary, isDark } = c
  const bg = isDark ? '#0d0d14' : '#f1f5f9'
  const sidebarBg = isDark ? '#0a0a12' : '#1e293b'
  const contentBg = isDark ? '#13131f' : '#ffffff'
  const text = isDark ? '#e2e8f0' : '#1e293b'
  const subtext = isDark ? '#8b949e' : '#64748b'
  const border = isDark ? '#1e2030' : '#e2e8f0'
  const shortName = name.slice(0, 12)

  return `'use client'

export default function Page() {
  const orders = [
    { name: 'Wang Wei', amount: '$342', status: '已完成', color: '#DCFCE7', tc: '#16A34A' },
    { name: 'Li Ming', amount: '$187', status: '處理中', color: '#FEF3C7', tc: '#D97706' },
    { name: 'Chen Fang', amount: '$528', status: '待確認', color: '#DBEAFE', tc: '#2563EB' },
    { name: 'Zhang Hua', amount: '$95', status: '已完成', color: '#DCFCE7', tc: '#16A34A' },
    { name: 'Liu Yang', amount: '$412', status: '處理中', color: '#FEF3C7', tc: '#D97706' },
  ]
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '${bg}', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ background: '${contentBg}', borderBottom: '1px solid ${border}', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: '${primary}' }}>${shortName}</div>
        <button style={{ padding: '7px 16px', background: '${primary}', color: 'white', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>+ 新增</button>
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 200, background: '${sidebarBg}', padding: '16px 0', flexShrink: 0 }}>
          {['儀表板','訂單','產品','客戶','財務'].map((item, i) => (
            <div key={item} style={{ padding: '10px 16px', color: i === 0 ? '${primary}' : 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', background: i === 0 ? '${rgba(primary, 0.12)}' : 'transparent', borderLeft: i === 0 ? '2px solid ${primary}' : '2px solid transparent' }}>
              {item}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
            {[{ label: '今日訂單', val: '284' }, { label: '本月營收', val: '$32.5K' }, { label: '待處理', val: '18' }].map(card => (
              <div key={card.label} style={{ background: '${contentBg}', borderRadius: 8, padding: 18, border: '1px solid ${border}' }}>
                <div style={{ fontSize: 11, color: '${subtext}', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '${text}' }}>{card.val}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '${contentBg}', borderRadius: 8, border: '1px solid ${border}', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid ${border}', fontWeight: 600, fontSize: 14, color: '${text}' }}>最新訂單</div>
            {orders.map((o, i) => (
              <div key={i} style={{ padding: '12px 18px', borderBottom: i < 4 ? '1px solid ${border}' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: '${primary}', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 600, opacity: 0.7 + i * 0.06 }}>{o.name[0]}</div>
                  <span style={{ fontSize: 13, color: '${text}' }}>{o.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '${subtext}', fontFamily: 'monospace' }}>{o.amount}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, background: o.color, color: o.tc, fontWeight: 500 }}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}`
}

function genEcommerce(name: string, c: TemplateColors): string {
  const { primary, accent, isDark } = c
  const bg = isDark ? '#0a0a0f' : '#ffffff'
  const text = isDark ? '#f1f5f9' : '#111827'
  const subtext = isDark ? '#94a3b8' : '#6b7280'
  const border = isDark ? '#1e1e2e' : '#e5e7eb'
  const cardBg = isDark ? '#13131f' : '#f9fafb'
  const shortName = name.slice(0, 10)

  return `'use client'

export default function Page() {
  const products = [
    { name: '設計師外套', price: 'NT$3,280', badge: 'NEW', emoji: '🧥' },
    { name: '聯名托特包', price: 'NT$5,800', badge: 'HOT', emoji: '👜' },
    { name: '休閒長褲', price: 'NT$1,980', badge: '', emoji: '👖' },
    { name: '皮革腰帶', price: 'NT$880', badge: 'SALE', emoji: '👗' },
  ]
  return (
    <div style={{ minHeight: '100vh', background: '${bg}', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '${text}' }}>
      <nav style={{ background: '${isDark ? '#111118' : 'white'}', borderBottom: '1px solid ${border}', padding: '0 48px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 22, color: '${primary}', letterSpacing: '-0.02em' }}>${shortName}</div>
        <div style={{ display: 'flex', gap: 28 }}>
          {['新品', '女裝', '男裝', '配件', 'Sale'].map(item => (
            <span key={item} style={{ fontSize: 14, color: '${subtext}', cursor: 'pointer' }}>{item}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 18, fontSize: 20 }}>
          <span style={{ cursor: 'pointer' }}>🔍</span>
          <span style={{ cursor: 'pointer' }}>🛒</span>
          <span style={{ cursor: 'pointer' }}>👤</span>
        </div>
      </nav>
      <div style={{ background: 'linear-gradient(135deg, ${primary}, ${accent})', padding: '60px 48px', textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', marginBottom: 12, opacity: 0.85, textTransform: 'uppercase' }}>2026 春夏新品</div>
        <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 14px' }}>${name}</h1>
        <p style={{ fontSize: 16, opacity: 0.85, margin: '0 0 28px' }}>探索最新設計，引領潮流風尚</p>
        <button style={{ background: 'white', color: '${primary}', border: 'none', padding: '14px 32px', borderRadius: 999, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>立即選購</button>
      </div>
      <div style={{ padding: '44px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 24px', letterSpacing: '-0.02em' }}>熱銷商品</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          {products.map((p, i) => (
            <div key={i} style={{ borderRadius: 12, overflow: 'hidden', background: '${cardBg}', border: '1px solid ${border}', cursor: 'pointer' }}>
              <div style={{ height: 176, background: 'linear-gradient(135deg, ${rgba(primary, 0.18)}, ${rgba(accent, 0.18)})', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>
                {p.emoji}
                {p.badge && (
                  <div style={{ position: 'absolute', top: 10, right: 10, background: '${primary}', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>{p.badge}</div>
                )}
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{p.name}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '${primary}' }}>{p.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}`
}

function genPortfolio(name: string, c: TemplateColors): string {
  const { primary, accent, isDark } = c
  const bg = isDark ? '#0a0a0a' : '#fafafa'
  const text = isDark ? '#f1f5f9' : '#0f172a'
  const subtext = isDark ? '#94a3b8' : '#64748b'
  const border = isDark ? '#1e1e2e' : '#e2e8f0'
  const shortName = name.slice(0, 16)
  const colors6 = [primary, accent, '#10b981', '#f59e0b', '#ec4899', '#06b6d4']

  return `'use client'

export default function Page() {
  const works = [
    { title: '品牌識別設計', cat: 'Branding' },
    { title: '電商平台', cat: 'Web' },
    { title: 'App UX', cat: 'Mobile' },
    { title: '年報設計', cat: 'Print' },
    { title: '產品攝影', cat: 'Photo' },
    { title: '動態影像', cat: 'Motion' },
  ]
  const palette = ['${colors6[0]}','${colors6[1]}','${colors6[2]}','${colors6[3]}','${colors6[4]}','${colors6[5]}']
  return (
    <div style={{ minHeight: '100vh', background: '${bg}', fontFamily: '"Helvetica Neue", Arial, sans-serif', color: '${text}' }}>
      <nav style={{ padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid ${border}' }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>${shortName}</div>
        <div style={{ display: 'flex', gap: 32 }}>
          {['作品','關於','服務','聯繫'].map(i => (
            <span key={i} style={{ fontSize: 14, color: '${subtext}', cursor: 'pointer' }}>{i}</span>
          ))}
        </div>
        <button style={{ padding: '8px 20px', background: '${primary}', color: 'white', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>合作洽談</button>
      </nav>
      <div style={{ padding: '44px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '${primary}', marginBottom: 10, textTransform: 'uppercase' }}>Selected Works</div>
          <h1 style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>${name}</h1>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, gridAutoRows: '200px' }}>
          {works.map((w, i) => (
            <div key={i} style={{ borderRadius: 12, background: 'linear-gradient(135deg, ' + palette[i % 6] + '30, ' + palette[i % 6] + '60)', border: '1px solid ${border}', cursor: 'pointer', display: 'flex', alignItems: 'flex-end', padding: 18, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', background: palette[i % 6], opacity: 0.3 }} />
              <div>
                <div style={{ fontSize: 10, letterSpacing: '0.12em', color: '${subtext}', marginBottom: 4, textTransform: 'uppercase' }}>{w.cat}</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{w.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}`
}

function genBlog(name: string, c: TemplateColors): string {
  const { primary, isDark } = c
  const bg = isDark ? '#0f0f0f' : '#ffffff'
  const text = isDark ? '#e2e8f0' : '#111827'
  const subtext = isDark ? '#94a3b8' : '#6b7280'
  const border = isDark ? '#1e1e2e' : '#e5e7eb'
  const shortName = name.slice(0, 12)

  return `'use client'

export default function Page() {
  const articles = [
    { title: '如何用設計思維解決複雜問題', date: '3月10日', tag: '設計', min: 5 },
    { title: '2026 年值得關注的視覺趨勢', date: '3月5日', tag: '趨勢', min: 7 },
    { title: '字型選擇對品牌傳達的重要性', date: '2月28日', tag: '排版', min: 4 },
  ]
  return (
    <div style={{ minHeight: '100vh', background: '${bg}', fontFamily: 'Georgia, "Times New Roman", serif', color: '${text}' }}>
      <nav style={{ padding: '0 48px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid ${border}', fontFamily: '-apple-system, sans-serif' }}>
        <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', color: '${primary}' }}>${shortName}</div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['最新','設計','科技','生活'].map(t => (
            <span key={t} style={{ fontSize: 14, color: '${subtext}', cursor: 'pointer' }}>{t}</span>
          ))}
        </div>
        <button style={{ padding: '8px 18px', background: '${primary}', color: 'white', border: 'none', borderRadius: 6, fontSize: 13, fontFamily: '-apple-system, sans-serif', cursor: 'pointer' }}>訂閱</button>
      </nav>
      <div style={{ position: 'relative', height: 340, background: 'linear-gradient(160deg, ${rgba(primary, 0.95)}, ${rgba(primary, 0.6)})', display: 'flex', alignItems: 'flex-end', padding: '44px 48px' }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: '-apple-system, sans-serif', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.75)', marginBottom: 10, textTransform: 'uppercase' }}>精選文章</div>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: 'white', margin: '0 0 10px', lineHeight: 1.2, maxWidth: 680 }}>${name}：關於設計與創意的深度思考</h1>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: '-apple-system, sans-serif' }}>2026年3月15日 · 閱讀時間 8 分鐘</div>
        </div>
      </div>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '36px 48px' }}>
        {articles.map((a, i) => (
          <div key={i} style={{ paddingBottom: 28, marginBottom: 28, borderBottom: i < 2 ? '1px solid ${border}' : 'none', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, background: '${rgba(primary, 0.1)}', color: '${primary}', padding: '2px 8px', borderRadius: 4, fontFamily: '-apple-system, sans-serif', fontWeight: 600 }}>{a.tag}</span>
              <h3 style={{ fontSize: 20, fontWeight: 600, margin: '8px 0', lineHeight: 1.3, cursor: 'pointer' }}>{a.title}</h3>
              <div style={{ fontSize: 12, color: '${subtext}', fontFamily: '-apple-system, sans-serif' }}>{a.date} · {a.min} 分鐘閱讀</div>
            </div>
            <div style={{ width: 100, height: 68, borderRadius: 8, background: 'linear-gradient(135deg, ${rgba(primary, 0.25)}, ${rgba(primary, 0.1)})', flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  )
}`
}

// ── 主 export ──────────────────────────────────────────────────────────────────

export function generateTemplatePreviewCode(template: {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
}): {
  pages: Array<{ path: string; content: string; description: string }>
  components: never[]
  styles: string
} {
  const colors = extractColors(template.tags, template.description)
  const name = template.name

  let content: string
  switch (template.category) {
    case 'saas':      content = genSaas(name, colors);      break
    case 'tool':      content = genSaas(name, colors);      break
    case 'dashboard': content = genDashboard(name, colors); break
    case 'ecommerce': content = genEcommerce(name, colors); break
    case 'portfolio': content = genPortfolio(name, colors); break
    case 'content':   content = genPortfolio(name, colors); break
    case 'blog':      content = genBlog(name, colors);      break
    case 'event':     content = genLanding(name, colors);   break
    default:          content = genLanding(name, colors);   break
  }

  return {
    pages: [{ path: 'app/page.tsx', content, description: `${template.name} 預覽` }],
    components: [],
    styles: '',
  }
}
