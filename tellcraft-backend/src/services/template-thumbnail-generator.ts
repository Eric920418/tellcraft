/**
 * Template Thumbnail Generator（後端版）
 * 從模板 metadata 生成純 HTML（零 CDN 依賴），供 puppeteer 截圖
 * puppeteer waitUntil: 'networkidle0' 因無網路請求而瞬間完成
 */

// ── 顏色提取（與前端版相同）─────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  橘: '#f97316', 橙: '#f97316', 紫: '#8b5cf6', 藍: '#3b82f6',
  紅: '#ef4444', 綠: '#10b981', 翠: '#10b981', 金: '#f59e0b',
  黃: '#eab308', 霓虹: '#a3e635', 螢光: '#a3e635', 粉: '#ec4899',
  青: '#06b6d4', 棕: '#a16207', 玫: '#f43f5e', 薄荷: '#34d399',
  天空: '#38bdf8', 珊瑚: '#fb7185', 靛: '#6366f1',
}
const DARK_KEYWORDS = ['暗', '深色', '黑', '夜', '電影感', '深', '極暗', '炭', '墨', '暗黑', '炫黑', '復古']

interface TemplateColors {
  primary: string
  accent: string
  isDark: boolean
}

interface TemplateMeta {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
}

function extractColors(tags: string[], description: string): TemplateColors {
  const allText = [...tags, description].join(' ')
  const found: string[] = []
  for (const [kw, color] of Object.entries(COLOR_MAP)) {
    if (allText.includes(kw)) found.push(color)
  }
  let primary = found[0] ?? '#3b82f6'
  let accent = found[1] ?? '#8b5cf6'
  if (found.length === 1) {
    const map: Record<string, string> = {
      '#f97316': '#8b5cf6', '#8b5cf6': '#06b6d4', '#3b82f6': '#f59e0b',
      '#10b981': '#3b82f6', '#ef4444': '#f59e0b', '#f59e0b': '#ef4444',
      '#ec4899': '#8b5cf6', '#06b6d4': '#f97316', '#a3e635': '#8b5cf6',
    }
    accent = map[primary] ?? '#8b5cf6'
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

// ── 純 HTML 包裝（零 CDN 依賴）────────────────────────────────────────────────

function buildHtmlPage(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1440">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 1440px; height: 900px; overflow: hidden; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`
}

// ── HTML 生成函數 ─────────────────────────────────────────────────────────────

/** Deterministic pseudo-random value in [min, max] using seed + offset */
function sv(seed: number, offset: number, min: number, max: number): number {
  return min + (((seed >>> offset) ^ (seed * 0x9e3779b9 >>> (offset + 7))) % (max - min + 1) + (max - min + 1)) % (max - min + 1)
}

function genLandingHtml(name: string, c: TemplateColors, seed: number): string {
  const { primary, accent, isDark } = c
  const bg = isDark ? '#09090b' : '#ffffff'
  const text = isDark ? '#f1f5f9' : '#0f172a'
  const subtext = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#18181b' : '#f8fafc'
  const border = isDark ? '#27272a' : '#e2e8f0'
  const shortName = name.slice(0, 12)

  const navLinks = ['Features', 'Pricing', 'About'].map(item =>
    `<span style="color: rgba(255,255,255,0.85); font-size: 14px">${item}</span>`
  ).join('')

  const m1 = `${sv(seed, 0, 20, 120)}K`
  const m2 = `${sv(seed, 4, 40, 95)}%`
  const m3 = `+${sv(seed, 8, 10, 60)}`
  const metricCols = [primary, accent, '#10b981'].map((col, i) =>
    `<div style="flex: 1; height: 60px; border-radius: 8px; background: ${col}; opacity: 0.8; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px">${[m1, m2, m3][i]}</div>`
  ).join('')

  const barWidths = [0, 1, 2, 3].map(i => sv(seed, i * 5 + 16, 30, 95))
  const bars = barWidths.map((w, i) =>
    `<div style="height: 8px; background: ${border}; border-radius: 4px; margin-bottom: 10px; overflow: hidden"><div style="width: ${w}%; height: 100%; background: ${primary}; opacity: ${(0.4 + i * 0.15).toFixed(2)}"></div></div>`
  ).join('')

  const featureCards = [
    { icon: '⚡', title: 'Fast Deploy', desc: 'One-click deployment, live in minutes with zero configuration.' },
    { icon: '🎨', title: 'Custom Design', desc: 'Full customization power to express your brand identity.' },
    { icon: '🔒', title: 'Secure', desc: 'Enterprise-grade security architecture with end-to-end encryption.' },
  ].map(f =>
    `<div style="padding: 28px; background: ${cardBg}; border-radius: 12px; border: 1px solid ${border}"><div style="font-size: 32px; margin-bottom: 14px">${f.icon}</div><div style="font-weight: 600; font-size: 16px; margin-bottom: 8px">${f.title}</div><div style="color: ${subtext}; font-size: 14px; line-height: 1.6">${f.desc}</div></div>`
  ).join('')

  return `
<div style="min-height: 100vh; background: ${bg}; color: ${text}">
  <nav style="background: ${primary}; padding: 0 48px; height: 64px; display: flex; align-items: center; justify-content: space-between">
    <div style="font-weight: 700; font-size: 20px; color: white; letter-spacing: -0.02em">${shortName}</div>
    <div style="display: flex; gap: 28px; align-items: center">
      ${navLinks}
      <button style="background: white; color: ${primary}; border: none; padding: 8px 20px; border-radius: 999px; font-size: 14px; font-weight: 600">Get Started</button>
    </div>
  </nav>
  <section style="padding: 80px 48px 60px; max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center">
    <div>
      <div style="display: inline-flex; align-items: center; background: ${rgba(accent, 0.12)}; color: ${accent}; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-bottom: 24px; gap: 6px">✦ New Release</div>
      <h1 style="font-size: 52px; font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; margin: 0 0 20px">${name}</h1>
      <p style="font-size: 18px; color: ${subtext}; line-height: 1.7; margin: 0 0 36px">Built for modern teams to boost productivity and unleash creativity without limits.</p>
      <div style="display: flex; gap: 12px">
        <button style="background: ${primary}; color: white; border: none; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: 600">Start Free</button>
        <button style="background: transparent; color: ${text}; border: 1.5px solid ${border}; padding: 14px 28px; border-radius: 8px; font-size: 15px">Watch Demo →</button>
      </div>
    </div>
    <div style="background: linear-gradient(135deg, ${rgba(primary, 0.1)}, ${rgba(accent, 0.1)}); border-radius: 20px; padding: 28px; border: 1px solid ${border}">
      <div style="background: ${isDark ? '#18181b' : 'white'}; border-radius: 12px; padding: 24px; box-shadow: 0 8px 32px ${rgba(primary, 0.12)}">
        <div style="display: flex; gap: 10px; margin-bottom: 18px">${metricCols}</div>
        ${bars}
      </div>
    </div>
  </section>
  <section style="padding: 0 48px 80px; max-width: 1200px; margin: 0 auto">
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px">${featureCards}</div>
  </section>
</div>`
}

function genSaasHtml(name: string, c: TemplateColors, seed: number): string {
  const { primary, accent, isDark } = c
  const bg = isDark ? '#0d0d14' : '#f1f5f9'
  const sidebarBg = isDark ? '#0a0a12' : '#1e293b'
  const contentBg = isDark ? '#13131f' : '#ffffff'
  const text = isDark ? '#e2e8f0' : '#1e293b'
  const subtext = isDark ? '#8b949e' : '#64748b'
  const border = isDark ? '#1e2030' : '#e2e8f0'
  const shortName = name.slice(0, 12)

  const users = `${sv(seed, 0, 1, 99)},${String(sv(seed, 4, 100, 999))}`
  const mrr = `$${sv(seed, 8, 10, 200)}.${sv(seed, 12, 0, 9)}K`
  const conv = `${sv(seed, 16, 1, 9)}.${sv(seed, 20, 0, 9)}%`
  const churn = `${sv(seed, 24, 1, 5)}.${sv(seed, 28, 0, 9)}%`
  const metrics = [
    { label: 'Total Users', value: users, trend: `+${sv(seed, 1, 5, 25)}%`, up: true },
    { label: 'MRR', value: mrr, trend: `+${sv(seed, 3, 3, 18)}.${sv(seed,5,0,9)}%`, up: true },
    { label: 'Conv. Rate', value: conv, trend: `+${sv(seed, 7, 1, 9)}.${sv(seed,9,0,9)}%`, up: true },
    { label: 'Churn', value: churn, trend: `-${sv(seed, 11, 1, 9)}.${sv(seed,13,0,9)}%`, up: false },
  ]
  const navItems = ['Overview', 'Analytics', 'Users', 'Reports', 'Settings']
  const navIcons = ['📊', '📈', '👥', '📋', '⚙️']
  const bars = [0,1,2,3,4,5,6,7,8,9,10,11].map(i => sv(seed, i * 3 + 30, 20, 98))

  const sidebarRows = navItems.map((item, i) =>
    `<div style="padding: 10px 18px; color: ${i === 0 ? primary : 'rgba(255,255,255,0.5)'}; font-size: 13px; display: flex; align-items: center; gap: 10px; background: ${i === 0 ? rgba(primary, 0.12) : 'transparent'}; border-left: 2px solid ${i === 0 ? primary : 'transparent'}"><span>${navIcons[i]}</span> ${item}</div>`
  ).join('')

  const metricCards = metrics.map(m =>
    `<div style="background: ${contentBg}; border: 1px solid ${border}; border-radius: 10px; padding: 16px"><div style="font-size: 11px; color: ${subtext}; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em">${m.label}</div><div style="font-size: 22px; font-weight: 700; color: ${text}; margin-bottom: 4px">${m.value}</div><div style="font-size: 12px; color: ${m.up ? '#10b981' : '#ef4444'}; font-weight: 500">${m.trend}</div></div>`
  ).join('')

  const barCols = bars.map((h, i) =>
    `<div style="flex: 1; background: ${i === 11 ? primary : rgba(primary, 0.3)}; border-radius: 3px 3px 0 0; height: ${h}%"></div>`
  ).join('')

  const timeBtns = ['7D', '1M', '3M', '1Y'].map((t, i) =>
    `<span style="font-size: 11px; padding: 3px 10px; border-radius: 4px; background: ${i === 1 ? primary : border}; color: ${i === 1 ? 'white' : subtext}">${t}</span>`
  ).join('')

  return `
<div style="height: 100vh; display: flex; flex-direction: column; background: ${bg}">
  <div style="background: ${contentBg}; border-bottom: 1px solid ${border}; padding: 0 24px; height: 56px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0">
    <div style="font-weight: 700; font-size: 18px; color: ${primary}">${shortName}</div>
    <div style="display: flex; gap: 12px; align-items: center">
      <div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981"></div>
      <div style="width: 30px; height: 30px; border-radius: 50%; background: ${primary}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 13px">A</div>
    </div>
  </div>
  <div style="flex: 1; display: flex; overflow: hidden">
    <div style="width: 220px; background: ${sidebarBg}; border-right: 1px solid ${isDark ? '#1e2030' : 'rgba(0,0,0,0.1)'}; padding: 16px 0; flex-shrink: 0">
      ${sidebarRows}
    </div>
    <div style="flex: 1; padding: 24px; overflow: auto; background: ${bg}">
      <h2 style="font-size: 20px; font-weight: 600; color: ${text}; margin: 0 0 20px">${name}</h2>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px">${metricCards}</div>
      <div style="background: ${contentBg}; border: 1px solid ${border}; border-radius: 10px; padding: 20px">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
          <div style="font-size: 14px; font-weight: 600; color: ${text}">Trend Analysis</div>
          <div style="display: flex; gap: 8px">${timeBtns}</div>
        </div>
        <div style="display: flex; align-items: flex-end; gap: 6px; height: 100px">${barCols}</div>
      </div>
    </div>
  </div>
</div>`
}

function genDashboardHtml(name: string, c: TemplateColors, seed: number): string {
  const { primary, isDark } = c
  const bg = isDark ? '#0d0d14' : '#f1f5f9'
  const sidebarBg = isDark ? '#0a0a12' : '#1e293b'
  const contentBg = isDark ? '#13131f' : '#ffffff'
  const text = isDark ? '#e2e8f0' : '#1e293b'
  const subtext = isDark ? '#8b949e' : '#64748b'
  const border = isDark ? '#1e2030' : '#e2e8f0'
  const shortName = name.slice(0, 12)

  const orders = [
    { name: 'Wang Wei', amount: '$342', status: 'Done', color: '#DCFCE7', tc: '#16A34A' },
    { name: 'Li Ming', amount: '$187', status: 'Processing', color: '#FEF3C7', tc: '#D97706' },
    { name: 'Chen Fang', amount: '$528', status: 'Pending', color: '#DBEAFE', tc: '#2563EB' },
    { name: 'Zhang Hua', amount: '$95', status: 'Done', color: '#DCFCE7', tc: '#16A34A' },
    { name: 'Liu Yang', amount: '$412', status: 'Processing', color: '#FEF3C7', tc: '#D97706' },
  ]

  const sidebarRows = ['Dashboard', 'Orders', 'Products', 'Customers', 'Finance'].map((item, i) =>
    `<div style="padding: 10px 16px; color: ${i === 0 ? primary : 'rgba(255,255,255,0.5)'}; font-size: 13px; background: ${i === 0 ? rgba(primary, 0.12) : 'transparent'}; border-left: 2px solid ${i === 0 ? primary : 'transparent'}">${item}</div>`
  ).join('')

  const statCards = [
    { label: 'Today Orders', val: String(sv(seed, 0, 50, 600)) },
    { label: 'Monthly Rev.', val: `$${sv(seed, 4, 8, 150)}.${sv(seed, 8, 0, 9)}K` },
    { label: 'Pending', val: String(sv(seed, 12, 3, 45)) },
  ].map(card =>
    `<div style="background: ${contentBg}; border-radius: 8px; padding: 18px; border: 1px solid ${border}"><div style="font-size: 11px; color: ${subtext}; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em">${card.label}</div><div style="font-size: 28px; font-weight: 700; color: ${text}">${card.val}</div></div>`
  ).join('')

  const orderRows = orders.map((o, i) =>
    `<div style="padding: 12px 18px; border-bottom: ${i < 4 ? `1px solid ${border}` : 'none'}; display: flex; justify-content: space-between; align-items: center"><div style="display: flex; align-items: center; gap: 10px"><div style="width: 30px; height: 30px; border-radius: 50%; background: ${primary}; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: 600; opacity: ${(0.7 + i * 0.06).toFixed(2)}">${o.name[0]}</div><span style="font-size: 13px; color: ${text}">${o.name}</span></div><div style="display: flex; gap: 16px; align-items: center"><span style="font-size: 13px; color: ${subtext}; font-family: monospace">${o.amount}</span><span style="padding: 2px 8px; border-radius: 4px; font-size: 11px; background: ${o.color}; color: ${o.tc}; font-weight: 500">${o.status}</span></div></div>`
  ).join('')

  return `
<div style="height: 100vh; display: flex; flex-direction: column; background: ${bg}">
  <div style="background: ${contentBg}; border-bottom: 1px solid ${border}; padding: 0 24px; height: 56px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0">
    <div style="font-weight: 700; font-size: 18px; color: ${primary}">${shortName}</div>
    <button style="padding: 7px 16px; background: ${primary}; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 500">+ New</button>
  </div>
  <div style="flex: 1; display: flex; overflow: hidden">
    <div style="width: 200px; background: ${sidebarBg}; padding: 16px 0; flex-shrink: 0">${sidebarRows}</div>
    <div style="flex: 1; padding: 24px; overflow: auto">
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px">${statCards}</div>
      <div style="background: ${contentBg}; border-radius: 8px; border: 1px solid ${border}; overflow: hidden">
        <div style="padding: 14px 18px; border-bottom: 1px solid ${border}; font-weight: 600; font-size: 14px; color: ${text}">Recent Orders</div>
        ${orderRows}
      </div>
    </div>
  </div>
</div>`
}

function genEcommerceHtml(name: string, c: TemplateColors, seed: number): string {
  const { primary, accent, isDark } = c
  const bg = isDark ? '#0a0a0f' : '#ffffff'
  const text = isDark ? '#f1f5f9' : '#111827'
  const subtext = isDark ? '#94a3b8' : '#6b7280'
  const border = isDark ? '#1e1e2e' : '#e5e7eb'
  const cardBg = isDark ? '#13131f' : '#f9fafb'
  const shortName = name.slice(0, 10)

  const products = [
    { name: 'Designer Jacket', price: '$328', badge: 'NEW', emoji: '🧥' },
    { name: 'Tote Bag', price: '$580', badge: 'HOT', emoji: '👜' },
    { name: 'Casual Pants', price: '$198', badge: '', emoji: '👖' },
    { name: 'Leather Belt', price: '$88', badge: 'SALE', emoji: '👗' },
  ]

  const navLinks = ['New', 'Women', 'Men', 'Accessories', 'Sale'].map(item =>
    `<span style="font-size: 14px; color: ${subtext}">${item}</span>`
  ).join('')

  const productCards = products.map(p =>
    `<div style="border-radius: 12px; overflow: hidden; background: ${cardBg}; border: 1px solid ${border}"><div style="height: 176px; background: linear-gradient(135deg, ${rgba(primary, 0.18)}, ${rgba(accent, 0.18)}); position: relative; display: flex; align-items: center; justify-content: center; font-size: 52px">${p.emoji}${p.badge ? `<div style="position: absolute; top: 10px; right: 10px; background: ${primary}; color: white; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px">${p.badge}</div>` : ''}</div><div style="padding: 14px"><div style="font-size: 14px; font-weight: 500; margin-bottom: 6px">${p.name}</div><div style="font-size: 16px; font-weight: 700; color: ${primary}">${p.price}</div></div></div>`
  ).join('')

  return `
<div style="min-height: 100vh; background: ${bg}; color: ${text}">
  <nav style="background: ${isDark ? '#111118' : 'white'}; border-bottom: 1px solid ${border}; padding: 0 48px; height: 64px; display: flex; align-items: center; justify-content: space-between">
    <div style="font-weight: 800; font-size: 22px; color: ${primary}; letter-spacing: -0.02em">${shortName}</div>
    <div style="display: flex; gap: 28px">${navLinks}</div>
    <div style="display: flex; gap: 18px; font-size: 20px"><span>🔍</span><span>🛒</span><span>👤</span></div>
  </nav>
  <div style="background: linear-gradient(135deg, ${primary}, ${accent}); padding: 60px 48px; text-align: center; color: white">
    <div style="font-size: 11px; letter-spacing: 0.2em; margin-bottom: 12px; opacity: 0.85; text-transform: uppercase">2026 Spring / Summer</div>
    <h1 style="font-size: 48px; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 14px">${name}</h1>
    <p style="font-size: 16px; opacity: 0.85; margin: 0 0 28px">Explore the latest designs and lead the trend.</p>
    <button style="background: white; color: ${primary}; border: none; padding: 14px 32px; border-radius: 999px; font-size: 15px; font-weight: 700">Shop Now</button>
  </div>
  <div style="padding: 44px 48px; max-width: 1200px; margin: 0 auto">
    <h2 style="font-size: 22px; font-weight: 700; margin: 0 0 24px; letter-spacing: -0.02em">Best Sellers</h2>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px">${productCards}</div>
  </div>
</div>`
}

function genPortfolioHtml(name: string, c: TemplateColors, seed: number): string {
  const { primary, accent, isDark } = c
  const bg = isDark ? '#0a0a0a' : '#fafafa'
  const text = isDark ? '#f1f5f9' : '#0f172a'
  const subtext = isDark ? '#94a3b8' : '#64748b'
  const border = isDark ? '#1e1e2e' : '#e2e8f0'
  const shortName = name.slice(0, 16)
  const colors6 = [primary, accent, '#10b981', '#f59e0b', '#ec4899', '#06b6d4']

  const works = [
    { title: 'Brand Identity', cat: 'Branding' },
    { title: 'E-commerce', cat: 'Web' },
    { title: 'App UX', cat: 'Mobile' },
    { title: 'Annual Report', cat: 'Print' },
    { title: 'Photography', cat: 'Photo' },
    { title: 'Motion', cat: 'Motion' },
  ]

  const navLinks = ['Works', 'About', 'Services', 'Contact'].map(item =>
    `<span style="font-size: 14px; color: ${subtext}">${item}</span>`
  ).join('')

  const workCards = works.map((w, i) =>
    `<div style="border-radius: 12px; background: linear-gradient(135deg, ${colors6[i % 6]}30, ${colors6[i % 6]}60); border: 1px solid ${border}; display: flex; align-items: flex-end; padding: 18px; position: relative; overflow: hidden; height: 200px"><div style="position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; border-radius: 50%; background: ${colors6[i % 6]}; opacity: 0.3"></div><div><div style="font-size: 10px; letter-spacing: 0.12em; color: ${subtext}; margin-bottom: 4px; text-transform: uppercase">${w.cat}</div><div style="font-size: 15px; font-weight: 600; color: ${text}">${w.title}</div></div></div>`
  ).join('')

  return `
<div style="min-height: 100vh; background: ${bg}; color: ${text}; font-family: 'Helvetica Neue', Arial, sans-serif">
  <nav style="padding: 20px 48px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${border}">
    <div style="font-size: 18px; font-weight: 700; letter-spacing: -0.02em">${shortName}</div>
    <div style="display: flex; gap: 32px">${navLinks}</div>
    <button style="padding: 8px 20px; background: ${primary}; color: white; border: none; border-radius: 6px; font-size: 13px">Get in Touch</button>
  </nav>
  <div style="padding: 44px 48px; max-width: 1200px; margin: 0 auto">
    <div style="margin-bottom: 36px">
      <div style="font-size: 11px; letter-spacing: 0.15em; color: ${primary}; margin-bottom: 10px; text-transform: uppercase">Selected Works</div>
      <h1 style="font-size: 52px; font-weight: 800; letter-spacing: -0.04em; margin: 0; line-height: 1">${name}</h1>
    </div>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px">${workCards}</div>
  </div>
</div>`
}

function genBlogHtml(name: string, c: TemplateColors, seed: number): string {
  void seed // seed reserved for future variation
  const { primary, isDark } = c
  const bg = isDark ? '#0f0f0f' : '#ffffff'
  const text = isDark ? '#e2e8f0' : '#111827'
  const subtext = isDark ? '#94a3b8' : '#6b7280'
  const border = isDark ? '#1e1e2e' : '#e5e7eb'
  const shortName = name.slice(0, 12)

  const articles = [
    { title: 'How Design Thinking Solves Complex Problems', date: 'Mar 10', tag: 'Design', min: 5 },
    { title: 'Visual Trends Worth Watching in 2026', date: 'Mar 5', tag: 'Trends', min: 7 },
    { title: 'Why Typography Matters for Brand Communication', date: 'Feb 28', tag: 'Typography', min: 4 },
  ]

  const navLinks = ['Latest', 'Design', 'Tech', 'Life'].map(t =>
    `<span style="font-size: 14px; color: ${subtext}">${t}</span>`
  ).join('')

  const articleRows = articles.map((a, i) =>
    `<div style="padding-bottom: 28px; margin-bottom: 28px; border-bottom: ${i < 2 ? `1px solid ${border}` : 'none'}; display: flex; gap: 20px; align-items: flex-start"><div style="flex: 1"><span style="font-size: 11px; background: ${rgba(primary, 0.1)}; color: ${primary}; padding: 2px 8px; border-radius: 4px; font-weight: 600">${a.tag}</span><h3 style="font-size: 20px; font-weight: 600; margin: 8px 0; line-height: 1.3">${a.title}</h3><div style="font-size: 12px; color: ${subtext}">${a.date} · ${a.min} min read</div></div><div style="width: 100px; height: 68px; border-radius: 8px; background: linear-gradient(135deg, ${rgba(primary, 0.25)}, ${rgba(primary, 0.1)}); flex-shrink: 0"></div></div>`
  ).join('')

  return `
<div style="min-height: 100vh; background: ${bg}; color: ${text}; font-family: Georgia, 'Times New Roman', serif">
  <nav style="padding: 0 48px; height: 60px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid ${border}; font-family: -apple-system, sans-serif">
    <div style="font-weight: 800; font-size: 20px; letter-spacing: -0.02em; color: ${primary}">${shortName}</div>
    <div style="display: flex; gap: 24px">${navLinks}</div>
    <button style="padding: 8px 18px; background: ${primary}; color: white; border: none; border-radius: 6px; font-size: 13px; font-family: -apple-system, sans-serif">Subscribe</button>
  </nav>
  <div style="position: relative; height: 340px; background: linear-gradient(160deg, ${rgba(primary, 0.95)}, ${rgba(primary, 0.6)}); display: flex; align-items: flex-end; padding: 44px 48px">
    <div>
      <div style="font-size: 10px; font-family: -apple-system, sans-serif; letter-spacing: 0.12em; color: rgba(255,255,255,0.75); margin-bottom: 10px; text-transform: uppercase">FEATURED</div>
      <h1 style="font-size: 36px; font-weight: 700; color: white; margin: 0 0 10px; line-height: 1.2; max-width: 680px">${name}: Deep Thoughts on Design and Creativity</h1>
      <div style="font-size: 13px; color: rgba(255,255,255,0.75); font-family: -apple-system, sans-serif">March 15, 2026 · 8 min read</div>
    </div>
  </div>
  <div style="max-width: 800px; margin: 0 auto; padding: 36px 48px">${articleRows}</div>
</div>`
}

// ── 主 export ──────────────────────────────────────────────────────────────────

const CATEGORY_DISPLAY: Record<string, string> = {
  landing: 'Landing', event: 'Event', saas: 'SaaS',
  tool: 'Tool', dashboard: 'Dashboard', ecommerce: 'Shop',
  portfolio: 'Portfolio', content: 'Content', blog: 'Blog',
}

/**
 * Strip CJK characters, keep ASCII letters/digits/spaces.
 * "Email 行銷平台" → "Email"
 * "問卷達人 FormCraft" → "FormCraft"
 * "純中文名稱" → category fallback
 */
function safeDisplayName(name: string, category: string): string {
  const stripped = name
    .replace(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\u3400-\u4dbf\uf900-\ufaff]/g, '')
    .replace(/[^\x20-\x7E]/g, '')   // remove other non-ASCII
    .replace(/\s+/g, ' ')
    .trim()
  return stripped || (CATEGORY_DISPLAY[category] ?? 'Template')
}

/** Simple numeric hash from a string for deterministic variety */
function strHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0
  return h
}

export function generateTemplateHtml(template: TemplateMeta): string {
  const colors = extractColors(template.tags, template.description)
  const name = safeDisplayName(template.name, template.category)
  const seed = strHash(template.id)

  let bodyHtml: string
  switch (template.category) {
    case 'saas':      bodyHtml = genSaasHtml(name, colors, seed);        break
    case 'tool':      bodyHtml = genSaasHtml(name, colors, seed);        break
    case 'dashboard': bodyHtml = genDashboardHtml(name, colors, seed);   break
    case 'ecommerce': bodyHtml = genEcommerceHtml(name, colors, seed);   break
    case 'portfolio': bodyHtml = genPortfolioHtml(name, colors, seed);   break
    case 'content':   bodyHtml = genPortfolioHtml(name, colors, seed);   break
    case 'blog':      bodyHtml = genBlogHtml(name, colors, seed);        break
    case 'event':     bodyHtml = genLandingHtml(name, colors, seed);     break
    default:          bodyHtml = genLandingHtml(name, colors, seed);     break
  }

  return buildHtmlPage(bodyHtml)
}
