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

function genLandingHtml(name: string, c: TemplateColors): string {
  const { primary, accent, isDark } = c
  const bg = isDark ? '#09090b' : '#ffffff'
  const text = isDark ? '#f1f5f9' : '#0f172a'
  const subtext = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#18181b' : '#f8fafc'
  const border = isDark ? '#27272a' : '#e2e8f0'
  const shortName = name.slice(0, 12)

  const navLinks = ['功能', '定價', '關於'].map(item =>
    `<span style="color: rgba(255,255,255,0.85); font-size: 14px">${item}</span>`
  ).join('')

  const metricCols = [primary, accent, '#10b981'].map((col, i) =>
    `<div style="flex: 1; height: 60px; border-radius: 8px; background: ${col}; opacity: 0.8; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px">${['84K', '61%', '+28'][i]}</div>`
  ).join('')

  const bars = [85, 60, 92, 48].map((w, i) =>
    `<div style="height: 8px; background: ${border}; border-radius: 4px; margin-bottom: 10px; overflow: hidden"><div style="width: ${w}%; height: 100%; background: ${primary}; opacity: ${(0.4 + i * 0.15).toFixed(2)}"></div></div>`
  ).join('')

  const featureCards = [
    { icon: '⚡', title: '極速啟動', desc: '一鍵部署，分鐘內上線，無需繁瑣配置' },
    { icon: '🎨', title: '自由設計', desc: '完整客製化能力，讓品牌個性盡情展現' },
    { icon: '🔒', title: '安全可靠', desc: '企業級安全架構，資料加密全程保護' },
  ].map(f =>
    `<div style="padding: 28px; background: ${cardBg}; border-radius: 12px; border: 1px solid ${border}"><div style="font-size: 32px; margin-bottom: 14px">${f.icon}</div><div style="font-weight: 600; font-size: 16px; margin-bottom: 8px">${f.title}</div><div style="color: ${subtext}; font-size: 14px; line-height: 1.6">${f.desc}</div></div>`
  ).join('')

  return `
<div style="min-height: 100vh; background: ${bg}; color: ${text}">
  <nav style="background: ${primary}; padding: 0 48px; height: 64px; display: flex; align-items: center; justify-content: space-between">
    <div style="font-weight: 700; font-size: 20px; color: white; letter-spacing: -0.02em">${shortName}</div>
    <div style="display: flex; gap: 28px; align-items: center">
      ${navLinks}
      <button style="background: white; color: ${primary}; border: none; padding: 8px 20px; border-radius: 999px; font-size: 14px; font-weight: 600">開始使用</button>
    </div>
  </nav>
  <section style="padding: 80px 48px 60px; max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center">
    <div>
      <div style="display: inline-flex; align-items: center; background: ${rgba(accent, 0.12)}; color: ${accent}; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-bottom: 24px; gap: 6px">✦ 全新發布</div>
      <h1 style="font-size: 52px; font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; margin: 0 0 20px">${name}</h1>
      <p style="font-size: 18px; color: ${subtext}; line-height: 1.7; margin: 0 0 36px">專為現代團隊打造的智能解決方案，提升工作效率，讓創意無限延伸。</p>
      <div style="display: flex; gap: 12px">
        <button style="background: ${primary}; color: white; border: none; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: 600">免費開始</button>
        <button style="background: transparent; color: ${text}; border: 1.5px solid ${border}; padding: 14px 28px; border-radius: 8px; font-size: 15px">觀看 Demo →</button>
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

function genSaasHtml(name: string, c: TemplateColors): string {
  const { primary, accent, isDark } = c
  const bg = isDark ? '#0d0d14' : '#f1f5f9'
  const sidebarBg = isDark ? '#0a0a12' : '#1e293b'
  const contentBg = isDark ? '#13131f' : '#ffffff'
  const text = isDark ? '#e2e8f0' : '#1e293b'
  const subtext = isDark ? '#8b949e' : '#64748b'
  const border = isDark ? '#1e2030' : '#e2e8f0'
  const shortName = name.slice(0, 12)

  const metrics = [
    { label: '總用戶', value: '12,847', trend: '+12%', up: true },
    { label: '月收入', value: '$48.2K', trend: '+8.3%', up: true },
    { label: '轉換率', value: '3.24%', trend: '+0.8%', up: true },
    { label: '流失率', value: '2.1%', trend: '-0.3%', up: false },
  ]
  const navItems = ['概覽', '分析', '用戶', '報告', '設置']
  const navIcons = ['📊', '📈', '👥', '📋', '⚙️']
  const bars = [40, 65, 45, 80, 55, 90, 75, 85, 60, 95, 70, 88]

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
          <div style="font-size: 14px; font-weight: 600; color: ${text}">趨勢分析</div>
          <div style="display: flex; gap: 8px">${timeBtns}</div>
        </div>
        <div style="display: flex; align-items: flex-end; gap: 6px; height: 100px">${barCols}</div>
      </div>
    </div>
  </div>
</div>`
}

function genDashboardHtml(name: string, c: TemplateColors): string {
  const { primary, isDark } = c
  const bg = isDark ? '#0d0d14' : '#f1f5f9'
  const sidebarBg = isDark ? '#0a0a12' : '#1e293b'
  const contentBg = isDark ? '#13131f' : '#ffffff'
  const text = isDark ? '#e2e8f0' : '#1e293b'
  const subtext = isDark ? '#8b949e' : '#64748b'
  const border = isDark ? '#1e2030' : '#e2e8f0'
  const shortName = name.slice(0, 12)

  const orders = [
    { name: 'Wang Wei', amount: '$342', status: '已完成', color: '#DCFCE7', tc: '#16A34A' },
    { name: 'Li Ming', amount: '$187', status: '處理中', color: '#FEF3C7', tc: '#D97706' },
    { name: 'Chen Fang', amount: '$528', status: '待確認', color: '#DBEAFE', tc: '#2563EB' },
    { name: 'Zhang Hua', amount: '$95', status: '已完成', color: '#DCFCE7', tc: '#16A34A' },
    { name: 'Liu Yang', amount: '$412', status: '處理中', color: '#FEF3C7', tc: '#D97706' },
  ]

  const sidebarRows = ['儀表板', '訂單', '產品', '客戶', '財務'].map((item, i) =>
    `<div style="padding: 10px 16px; color: ${i === 0 ? primary : 'rgba(255,255,255,0.5)'}; font-size: 13px; background: ${i === 0 ? rgba(primary, 0.12) : 'transparent'}; border-left: 2px solid ${i === 0 ? primary : 'transparent'}">${item}</div>`
  ).join('')

  const statCards = [
    { label: '今日訂單', val: '284' },
    { label: '本月營收', val: '$32.5K' },
    { label: '待處理', val: '18' },
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
    <button style="padding: 7px 16px; background: ${primary}; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 500">+ 新增</button>
  </div>
  <div style="flex: 1; display: flex; overflow: hidden">
    <div style="width: 200px; background: ${sidebarBg}; padding: 16px 0; flex-shrink: 0">${sidebarRows}</div>
    <div style="flex: 1; padding: 24px; overflow: auto">
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px">${statCards}</div>
      <div style="background: ${contentBg}; border-radius: 8px; border: 1px solid ${border}; overflow: hidden">
        <div style="padding: 14px 18px; border-bottom: 1px solid ${border}; font-weight: 600; font-size: 14px; color: ${text}">最新訂單</div>
        ${orderRows}
      </div>
    </div>
  </div>
</div>`
}

function genEcommerceHtml(name: string, c: TemplateColors): string {
  const { primary, accent, isDark } = c
  const bg = isDark ? '#0a0a0f' : '#ffffff'
  const text = isDark ? '#f1f5f9' : '#111827'
  const subtext = isDark ? '#94a3b8' : '#6b7280'
  const border = isDark ? '#1e1e2e' : '#e5e7eb'
  const cardBg = isDark ? '#13131f' : '#f9fafb'
  const shortName = name.slice(0, 10)

  const products = [
    { name: '設計師外套', price: 'NT$3,280', badge: 'NEW', emoji: '🧥' },
    { name: '聯名托特包', price: 'NT$5,800', badge: 'HOT', emoji: '👜' },
    { name: '休閒長褲', price: 'NT$1,980', badge: '', emoji: '👖' },
    { name: '皮革腰帶', price: 'NT$880', badge: 'SALE', emoji: '👗' },
  ]

  const navLinks = ['新品', '女裝', '男裝', '配件', 'Sale'].map(item =>
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
    <div style="font-size: 11px; letter-spacing: 0.2em; margin-bottom: 12px; opacity: 0.85; text-transform: uppercase">2024 春夏新品</div>
    <h1 style="font-size: 48px; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 14px">${name}</h1>
    <p style="font-size: 16px; opacity: 0.85; margin: 0 0 28px">探索最新設計，引領潮流風尚</p>
    <button style="background: white; color: ${primary}; border: none; padding: 14px 32px; border-radius: 999px; font-size: 15px; font-weight: 700">立即選購</button>
  </div>
  <div style="padding: 44px 48px; max-width: 1200px; margin: 0 auto">
    <h2 style="font-size: 22px; font-weight: 700; margin: 0 0 24px; letter-spacing: -0.02em">熱銷商品</h2>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px">${productCards}</div>
  </div>
</div>`
}

function genPortfolioHtml(name: string, c: TemplateColors): string {
  const { primary, accent, isDark } = c
  const bg = isDark ? '#0a0a0a' : '#fafafa'
  const text = isDark ? '#f1f5f9' : '#0f172a'
  const subtext = isDark ? '#94a3b8' : '#64748b'
  const border = isDark ? '#1e1e2e' : '#e2e8f0'
  const shortName = name.slice(0, 16)
  const colors6 = [primary, accent, '#10b981', '#f59e0b', '#ec4899', '#06b6d4']

  const works = [
    { title: '品牌識別設計', cat: 'Branding' },
    { title: '電商平台', cat: 'Web' },
    { title: 'App UX', cat: 'Mobile' },
    { title: '年報設計', cat: 'Print' },
    { title: '產品攝影', cat: 'Photo' },
    { title: '動態影像', cat: 'Motion' },
  ]

  const navLinks = ['作品', '關於', '服務', '聯繫'].map(item =>
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
    <button style="padding: 8px 20px; background: ${primary}; color: white; border: none; border-radius: 6px; font-size: 13px">合作洽談</button>
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

function genBlogHtml(name: string, c: TemplateColors): string {
  const { primary, isDark } = c
  const bg = isDark ? '#0f0f0f' : '#ffffff'
  const text = isDark ? '#e2e8f0' : '#111827'
  const subtext = isDark ? '#94a3b8' : '#6b7280'
  const border = isDark ? '#1e1e2e' : '#e5e7eb'
  const shortName = name.slice(0, 12)

  const articles = [
    { title: '如何用設計思維解決複雜問題', date: '3月10日', tag: '設計', min: 5 },
    { title: '2024 年值得關注的視覺趨勢', date: '3月5日', tag: '趨勢', min: 7 },
    { title: '字型選擇對品牌傳達的重要性', date: '2月28日', tag: '排版', min: 4 },
  ]

  const navLinks = ['最新', '設計', '科技', '生活'].map(t =>
    `<span style="font-size: 14px; color: ${subtext}">${t}</span>`
  ).join('')

  const articleRows = articles.map((a, i) =>
    `<div style="padding-bottom: 28px; margin-bottom: 28px; border-bottom: ${i < 2 ? `1px solid ${border}` : 'none'}; display: flex; gap: 20px; align-items: flex-start"><div style="flex: 1"><span style="font-size: 11px; background: ${rgba(primary, 0.1)}; color: ${primary}; padding: 2px 8px; border-radius: 4px; font-weight: 600">${a.tag}</span><h3 style="font-size: 20px; font-weight: 600; margin: 8px 0; line-height: 1.3">${a.title}</h3><div style="font-size: 12px; color: ${subtext}">${a.date} · ${a.min} 分鐘閱讀</div></div><div style="width: 100px; height: 68px; border-radius: 8px; background: linear-gradient(135deg, ${rgba(primary, 0.25)}, ${rgba(primary, 0.1)}); flex-shrink: 0"></div></div>`
  ).join('')

  return `
<div style="min-height: 100vh; background: ${bg}; color: ${text}; font-family: Georgia, 'Times New Roman', serif">
  <nav style="padding: 0 48px; height: 60px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid ${border}; font-family: -apple-system, sans-serif">
    <div style="font-weight: 800; font-size: 20px; letter-spacing: -0.02em; color: ${primary}">${shortName}</div>
    <div style="display: flex; gap: 24px">${navLinks}</div>
    <button style="padding: 8px 18px; background: ${primary}; color: white; border: none; border-radius: 6px; font-size: 13px; font-family: -apple-system, sans-serif">訂閱</button>
  </nav>
  <div style="position: relative; height: 340px; background: linear-gradient(160deg, ${rgba(primary, 0.95)}, ${rgba(primary, 0.6)}); display: flex; align-items: flex-end; padding: 44px 48px">
    <div>
      <div style="font-size: 10px; font-family: -apple-system, sans-serif; letter-spacing: 0.12em; color: rgba(255,255,255,0.75); margin-bottom: 10px; text-transform: uppercase">精選文章</div>
      <h1 style="font-size: 36px; font-weight: 700; color: white; margin: 0 0 10px; line-height: 1.2; max-width: 680px">${name}：關於設計與創意的深度思考</h1>
      <div style="font-size: 13px; color: rgba(255,255,255,0.75); font-family: -apple-system, sans-serif">2024年3月15日 · 閱讀時間 8 分鐘</div>
    </div>
  </div>
  <div style="max-width: 800px; margin: 0 auto; padding: 36px 48px">${articleRows}</div>
</div>`
}

// ── 主 export ──────────────────────────────────────────────────────────────────

export function generateTemplateHtml(template: TemplateMeta): string {
  const colors = extractColors(template.tags, template.description)
  const name = template.name

  let bodyHtml: string
  switch (template.category) {
    case 'saas':      bodyHtml = genSaasHtml(name, colors);        break
    case 'tool':      bodyHtml = genSaasHtml(name, colors);        break
    case 'dashboard': bodyHtml = genDashboardHtml(name, colors);   break
    case 'ecommerce': bodyHtml = genEcommerceHtml(name, colors);   break
    case 'portfolio': bodyHtml = genPortfolioHtml(name, colors);   break
    case 'content':   bodyHtml = genPortfolioHtml(name, colors);   break
    case 'blog':      bodyHtml = genBlogHtml(name, colors);        break
    case 'event':     bodyHtml = genLandingHtml(name, colors);     break
    default:          bodyHtml = genLandingHtml(name, colors);     break
  }

  return buildHtmlPage(bodyHtml)
}
