/**
 * Seed Template Code Generator
 * 為 100 個 seed 模板生成真實的 React 多檔案代碼
 * 純 TS，零 LLM，根據 category + tags 決定版型
 */

export interface SeedTemplateFile {
  filePath: string
  fileType: string    // 'page' | 'component' | 'style' | 'config'
  skillSource: string // 固定 'uiux'
  content: string
}

interface TemplateInput {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
}

// ============================================================
// 類型偵測
// ============================================================

type TemplateType =
  | 'saas_dashboard'
  | 'saas_landing'
  | 'ecommerce_store'
  | 'ecommerce_product'
  | 'blog_magazine'
  | 'blog_minimal'
  | 'portfolio_creative'
  | 'portfolio_developer'
  | 'landing_startup'
  | 'landing_agency'
  | 'event_conference'
  | 'event_wedding'
  | 'restaurant_menu'
  | 'real_estate'
  | 'education_course'
  | 'healthcare'
  | 'finance_fintech'
  | 'travel_tourism'
  | 'nonprofit_charity'
  | 'tool_directory'

function detectType(input: TemplateInput): TemplateType {
  const text = `${input.name} ${input.description} ${input.tags.join(' ')} ${input.category}`.toLowerCase()

  if (input.category === 'saas') {
    if (/dashboard|analytics|admin|管理/.test(text)) return 'saas_dashboard'
    return 'saas_landing'
  }
  if (input.category === 'ecommerce') {
    if (/product|商品|detail/.test(text)) return 'ecommerce_product'
    return 'ecommerce_store'
  }
  if (input.category === 'blog') {
    if (/magazine|雜誌|news/.test(text)) return 'blog_magazine'
    return 'blog_minimal'
  }
  if (input.category === 'portfolio') {
    if (/developer|工程師|code/.test(text)) return 'portfolio_developer'
    return 'portfolio_creative'
  }
  if (input.category === 'event') {
    if (/wedding|婚禮/.test(text)) return 'event_wedding'
    return 'event_conference'
  }
  if (/restaurant|café|food|餐廳|咖啡|美食/.test(text)) return 'restaurant_menu'
  if (/real estate|property|房地產|房屋/.test(text)) return 'real_estate'
  if (/course|education|學習|課程/.test(text)) return 'education_course'
  if (/health|medical|醫療|健康/.test(text)) return 'healthcare'
  if (/finance|fintech|投資|金融/.test(text)) return 'finance_fintech'
  if (/travel|tourism|旅遊|旅行/.test(text)) return 'travel_tourism'
  if (/nonprofit|charity|公益|捐款/.test(text)) return 'nonprofit_charity'
  if (/directory|tool|工具|目錄/.test(text)) return 'tool_directory'
  if (/agency|設計公司|創意/.test(text)) return 'landing_agency'

  // fallback by category
  if (input.category === 'landing') return 'landing_startup'
  return 'landing_startup'
}

// ============================================================
// 共用基礎樣式
// ============================================================

function getBaseStyles(): string {
  return `@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #0f172a;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: var(--background);
  color: var(--foreground);
  line-height: 1.6;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
}
`
}

function getTailwindConfig(primaryColor: string): string {
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '${primaryColor}',
      },
    },
  },
  plugins: [],
}
`
}

// ============================================================
// 各類型代碼生成器
// ============================================================

const generators: Record<TemplateType, (input: TemplateInput) => SeedTemplateFile[]> = {

  // ------ SaaS Dashboard ------
  saas_dashboard: (input) => [
    {
      filePath: 'app/page.tsx',
      fileType: 'page',
      skillSource: 'uiux',
      content: `'use client'
import Sidebar from './components/Sidebar'
import StatCard from './components/StatCard'
import Chart from './components/Chart'

export default function Dashboard() {
  const stats = [
    { label: 'Total Users', value: '24,521', change: '+12%', up: true },
    { label: 'Revenue', value: '$89,420', change: '+8.1%', up: true },
    { label: 'Active Projects', value: '142', change: '-3%', up: false },
    { label: 'Conversion', value: '3.24%', change: '+0.5%', up: true },
  ]
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <Sidebar appName="${input.name}" />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Overview</h1>
          <p className="text-gray-400 text-sm mt-1">Welcome back! Here's what's happening.</p>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map(s => <StatCard key={s.label} {...s} />)}
        </div>
        <Chart />
      </main>
    </div>
  )
}
`,
    },
    {
      filePath: 'app/components/Sidebar.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `'use client'
const navItems = [
  { icon: '⊞', label: 'Dashboard', active: true },
  { icon: '◈', label: 'Analytics' },
  { icon: '◉', label: 'Projects' },
  { icon: '◎', label: 'Team' },
  { icon: '◇', label: 'Settings' },
]
export default function Sidebar({ appName }: { appName: string }) {
  return (
    <div className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <span className="text-white font-semibold text-lg">{appName}</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => (
          <button key={item.label} className={\`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors \${
            item.active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }\`}>
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">A</div>
          <div>
            <div className="text-sm text-white">Admin User</div>
            <div className="text-xs text-gray-500">admin@company.com</div>
          </div>
        </div>
      </div>
    </div>
  )
}
`,
    },
    {
      filePath: 'app/components/StatCard.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `export default function StatCard({ label, value, change, up }: {
  label: string; value: string; change: string; up: boolean
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">{label}</div>
      <div className="text-2xl font-bold text-white mb-2">{value}</div>
      <div className={\`text-xs font-medium \${up ? 'text-emerald-400' : 'text-red-400'}\`}>
        {up ? '↑' : '↓'} {change} vs last month
      </div>
    </div>
  )
}
`,
    },
    {
      filePath: 'app/components/Chart.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `'use client'
const data = [42, 68, 55, 80, 73, 92, 88, 76, 95, 82, 78, 90]
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const max = Math.max(...data)

export default function Chart() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-white font-medium mb-6">Revenue Overview</h3>
      <div className="flex items-end gap-2 h-40">
        {data.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-indigo-500 rounded-t opacity-80 hover:opacity-100 transition-opacity"
              style={{ height: \`\${(v / max) * 100}%\` }}
            />
            <span className="text-xs text-gray-600">{months[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
`,
    },
    {
      filePath: 'app/globals.css',
      fileType: 'style',
      skillSource: 'uiux',
      content: getBaseStyles(),
    },
    {
      filePath: 'tailwind.config.ts',
      fileType: 'config',
      skillSource: 'uiux',
      content: getTailwindConfig('#6366f1'),
    },
  ],

  // ------ SaaS Landing ------
  saas_landing: (input) => [
    {
      filePath: 'app/page.tsx',
      fileType: 'page',
      skillSource: 'uiux',
      content: `import Nav from './components/Nav'
import Hero from './components/Hero'
import Features from './components/Features'
import Pricing from './components/Pricing'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Nav appName="${input.name}" />
      <Hero name="${input.name}" description="${input.description}" />
      <Features />
      <Pricing />
    </div>
  )
}
`,
    },
    {
      filePath: 'app/components/Nav.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `export default function Nav({ appName }: { appName: string }) {
  return (
    <nav className="border-b border-gray-100 bg-white/90 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <span className="font-bold text-gray-900 text-lg">{appName}</span>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
          <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
          <button className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  )
}
`,
    },
    {
      filePath: 'app/components/Hero.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `export default function Hero({ name, description }: { name: string; description: string }) {
  return (
    <section className="py-24 px-6 text-center bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-sm px-3 py-1 rounded-full mb-6">
          <span>✦</span> Now in public beta
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">{name}</h1>
        <p className="text-xl text-gray-500 mb-10 leading-relaxed">{description}</p>
        <div className="flex items-center justify-center gap-4">
          <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            Start for free
          </button>
          <button className="text-gray-700 px-8 py-3 rounded-lg font-medium border border-gray-200 hover:border-gray-300 transition-colors">
            See demo →
          </button>
        </div>
      </div>
    </section>
  )
}
`,
    },
    {
      filePath: 'app/components/Features.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `const features = [
  { icon: '⚡', title: 'Lightning Fast', desc: 'Built for performance with sub-second response times.' },
  { icon: '🔒', title: 'Enterprise Security', desc: 'SOC 2 compliant with end-to-end encryption.' },
  { icon: '📊', title: 'Advanced Analytics', desc: 'Real-time insights with customizable dashboards.' },
  { icon: '🔌', title: '200+ Integrations', desc: 'Connect your favorite tools seamlessly.' },
  { icon: '🤖', title: 'AI-Powered', desc: 'Intelligent automation that learns your workflow.' },
  { icon: '🌍', title: 'Global CDN', desc: 'Deployed in 50+ regions for low latency.' },
]
export default function Features() {
  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Everything you need</h2>
        <p className="text-center text-gray-500 mb-12">Powerful features to help your team move faster.</p>
        <div className="grid grid-cols-3 gap-6">
          {features.map(f => (
            <div key={f.title} className="p-6 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
`,
    },
    {
      filePath: 'app/components/Pricing.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `const plans = [
  { name: 'Starter', price: '$0', desc: 'Perfect for side projects', features: ['5 projects', '2 team members', '5GB storage'], cta: 'Start free', highlight: false },
  { name: 'Pro', price: '$29', desc: 'For growing teams', features: ['Unlimited projects', '20 team members', '100GB storage', 'Priority support'], cta: 'Get Pro', highlight: true },
  { name: 'Enterprise', price: 'Custom', desc: 'For large organizations', features: ['Unlimited everything', 'SSO/SAML', 'SLA guarantee', 'Dedicated support'], cta: 'Contact us', highlight: false },
]
export default function Pricing() {
  return (
    <section id="pricing" className="py-20 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Simple, transparent pricing</h2>
        <div className="grid grid-cols-3 gap-6">
          {plans.map(p => (
            <div key={p.name} className={\`rounded-2xl p-6 \${p.highlight ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white border border-gray-200'}\`}>
              <div className={\`text-sm font-medium mb-1 \${p.highlight ? 'text-indigo-200' : 'text-gray-500'}\`}>{p.name}</div>
              <div className={\`text-3xl font-bold mb-1 \${p.highlight ? 'text-white' : 'text-gray-900'}\`}>{p.price}<span className="text-sm font-normal">/mo</span></div>
              <div className={\`text-sm mb-6 \${p.highlight ? 'text-indigo-200' : 'text-gray-500'}\`}>{p.desc}</div>
              <ul className="space-y-2 mb-6">
                {p.features.map(f => (
                  <li key={f} className={\`text-sm flex items-center gap-2 \${p.highlight ? 'text-indigo-100' : 'text-gray-600'}\`}>
                    <span>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button className={\`w-full py-2 rounded-lg text-sm font-medium transition-colors \${
                p.highlight ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }\`}>{p.cta}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
`,
    },
    {
      filePath: 'app/globals.css',
      fileType: 'style',
      skillSource: 'uiux',
      content: getBaseStyles(),
    },
    {
      filePath: 'tailwind.config.ts',
      fileType: 'config',
      skillSource: 'uiux',
      content: getTailwindConfig('#6366f1'),
    },
  ],

  // ------ E-commerce Store ------
  ecommerce_store: (input) => [
    {
      filePath: 'app/page.tsx',
      fileType: 'page',
      skillSource: 'uiux',
      content: `import ShopNav from './components/ShopNav'
import HeroBanner from './components/HeroBanner'
import ProductGrid from './components/ProductGrid'

export default function StorePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ShopNav storeName="${input.name}" />
      <HeroBanner />
      <ProductGrid />
    </div>
  )
}
`,
    },
    {
      filePath: 'app/components/ShopNav.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `export default function ShopNav({ storeName }: { storeName: string }) {
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="font-bold text-xl text-gray-900">{storeName}</span>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <a href="#" className="hover:text-gray-900">Women</a>
          <a href="#" className="hover:text-gray-900">Men</a>
          <a href="#" className="hover:text-gray-900">Sale</a>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-full">🔍</button>
          <button className="p-2 hover:bg-gray-100 rounded-full">♡</button>
          <button className="p-2 hover:bg-gray-100 rounded-full relative">
            🛒
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">2</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
`,
    },
    {
      filePath: 'app/components/HeroBanner.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `export default function HeroBanner() {
  return (
    <section className="bg-gradient-to-r from-rose-50 to-pink-50 py-16 px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div>
          <p className="text-rose-500 font-medium mb-2 text-sm uppercase tracking-widest">New Collection</p>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Summer<br />Essentials
          </h1>
          <p className="text-gray-500 mb-8 text-lg">Curated pieces for the modern wardrobe.</p>
          <button className="bg-gray-900 text-white px-8 py-3 rounded-full font-medium hover:bg-gray-700 transition-colors">
            Shop Now
          </button>
        </div>
        <div className="w-80 h-80 bg-rose-100 rounded-3xl flex items-center justify-center text-8xl">
          👗
        </div>
      </div>
    </section>
  )
}
`,
    },
    {
      filePath: 'app/components/ProductGrid.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `'use client'
import { useState } from 'react'

const products = [
  { id: 1, name: 'Linen Blazer', price: 189, badge: 'New', emoji: '🧥', color: 'bg-amber-50' },
  { id: 2, name: 'Silk Midi Skirt', price: 124, badge: 'Bestseller', emoji: '👘', color: 'bg-rose-50' },
  { id: 3, name: 'Cotton Tee', price: 45, badge: null, emoji: '👕', color: 'bg-blue-50' },
  { id: 4, name: 'Wide Leg Pants', price: 98, badge: 'Sale', emoji: '👖', color: 'bg-stone-50' },
  { id: 5, name: 'Knit Cardigan', price: 145, badge: null, emoji: '🧶', color: 'bg-purple-50' },
  { id: 6, name: 'Maxi Dress', price: 167, badge: 'New', emoji: '👗', color: 'bg-pink-50' },
]

export default function ProductGrid() {
  const [wishlist, setWishlist] = useState<number[]>([])
  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Products</h2>
      <div className="grid grid-cols-3 gap-6">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className={\`\${p.color} h-48 flex items-center justify-center text-6xl relative\`}>
              {p.badge && (
                <span className="absolute top-3 left-3 text-xs bg-gray-900 text-white px-2 py-1 rounded-full">{p.badge}</span>
              )}
              <button
                onClick={() => setWishlist(w => w.includes(p.id) ? w.filter(i => i !== p.id) : [...w, p.id])}
                className="absolute top-3 right-3 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm"
              >
                {wishlist.includes(p.id) ? '❤️' : '🤍'}
              </button>
              {p.emoji}
            </div>
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-1">{p.name}</h3>
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">\${p.price}</span>
                <button className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-full hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100">
                  Add to cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
`,
    },
    {
      filePath: 'app/globals.css',
      fileType: 'style',
      skillSource: 'uiux',
      content: getBaseStyles(),
    },
    {
      filePath: 'tailwind.config.ts',
      fileType: 'config',
      skillSource: 'uiux',
      content: getTailwindConfig('#f43f5e'),
    },
  ],

  // ------ E-commerce Product Detail ------
  ecommerce_product: (input) => [
    {
      filePath: 'app/page.tsx',
      fileType: 'page',
      skillSource: 'uiux',
      content: `'use client'
import { useState } from 'react'

export default function ProductPage() {
  const [selectedSize, setSelectedSize] = useState('M')
  const [qty, setQty] = useState(1)
  const sizes = ['XS', 'S', 'M', 'L', 'XL']
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b px-6 h-14 flex items-center">
        <span className="font-bold text-gray-900">${input.name}</span>
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 gap-12">
        <div className="bg-stone-100 rounded-3xl flex items-center justify-center h-[480px] text-9xl">
          👜
        </div>
        <div className="flex flex-col justify-center">
          <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">Premium Collection</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Luxury Leather Bag</h1>
          <div className="flex items-center gap-2 mb-6">
            <div className="flex gap-0.5">{'★★★★★'.split('').map((s, i) => <span key={i} className="text-amber-400">{s}</span>)}</div>
            <span className="text-sm text-gray-500">4.9 (128 reviews)</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-6">$248</div>
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-700 mb-2">Size: {selectedSize}</div>
            <div className="flex gap-2">
              {sizes.map(s => (
                <button key={s} onClick={() => setSelectedSize(s)} className={\`w-10 h-10 rounded-lg border text-sm font-medium transition-colors \${
                  selectedSize === s ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400'
                }\`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 border rounded-lg flex items-center justify-center hover:bg-gray-50">−</button>
            <span className="w-8 text-center font-medium">{qty}</span>
            <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 border rounded-lg flex items-center justify-center hover:bg-gray-50">+</button>
          </div>
          <button className="bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors mb-3">
            Add to Cart — ${ '{' }qty * 248{ '}' }
          </button>
          <button className="border border-gray-200 py-3 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            ♡ Save to Wishlist
          </button>
        </div>
      </div>
    </div>
  )
}
`,
    },
    {
      filePath: 'app/globals.css',
      fileType: 'style',
      skillSource: 'uiux',
      content: getBaseStyles(),
    },
    {
      filePath: 'tailwind.config.ts',
      fileType: 'config',
      skillSource: 'uiux',
      content: getTailwindConfig('#78716c'),
    },
  ],

  // ------ Blog Magazine ------
  blog_magazine: (input) => [
    {
      filePath: 'app/page.tsx',
      fileType: 'page',
      skillSource: 'uiux',
      content: `import MagazineHeader from './components/MagazineHeader'
import FeaturedArticle from './components/FeaturedArticle'
import ArticleGrid from './components/ArticleGrid'

export default function MagazinePage() {
  return (
    <div className="min-h-screen bg-white">
      <MagazineHeader title="${input.name}" />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <FeaturedArticle />
        <ArticleGrid />
      </main>
    </div>
  )
}
`,
    },
    {
      filePath: 'app/components/MagazineHeader.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `export default function MagazineHeader({ title }: { title: string }) {
  const categories = ['Culture', 'Tech', 'Design', 'Business', 'Lifestyle', 'Travel']
  return (
    <header className="border-b border-gray-900">
      <div className="max-w-6xl mx-auto px-6">
        <div className="py-8 text-center border-b border-gray-200">
          <h1 className="text-5xl font-black tracking-tight text-gray-900 font-serif">{title}</h1>
          <p className="text-xs text-gray-400 mt-1 tracking-widest uppercase">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <nav className="flex gap-6 py-3 overflow-x-auto">
          {categories.map(c => (
            <a key={c} href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap">{c}</a>
          ))}
        </nav>
      </div>
    </header>
  )
}
`,
    },
    {
      filePath: 'app/components/FeaturedArticle.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `export default function FeaturedArticle() {
  return (
    <article className="mb-12 pb-12 border-b grid grid-cols-5 gap-8 items-center">
      <div className="col-span-3">
        <span className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-3 block">Cover Story</span>
        <h2 className="text-4xl font-black text-gray-900 leading-tight mb-4 font-serif">
          The Future of Design: How AI is Reshaping Creative Industries
        </h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          As artificial intelligence becomes increasingly sophisticated, designers are finding new ways to collaborate with machines, creating work that neither could achieve alone.
        </p>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-sm">S</div>
          <div>
            <span className="text-sm font-medium text-gray-900">Sarah Chen</span>
            <span className="text-sm text-gray-400 mx-2">·</span>
            <span className="text-sm text-gray-400">12 min read</span>
          </div>
        </div>
      </div>
      <div className="col-span-2 bg-gradient-to-br from-rose-100 to-orange-100 rounded-2xl h-64 flex items-center justify-center text-6xl">
        🎨
      </div>
    </article>
  )
}
`,
    },
    {
      filePath: 'app/components/ArticleGrid.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `const articles = [
  { cat: 'Technology', title: 'Neural Networks and the Art of Perception', author: 'Mike Johnson', time: '8 min', emoji: '🧠', bg: 'bg-blue-50' },
  { cat: 'Business', title: 'The New Rules of Remote Leadership', author: 'Lisa Park', time: '6 min', emoji: '💼', bg: 'bg-amber-50' },
  { cat: 'Design', title: 'Brutalism Enters the Mainstream', author: 'Tom Rivera', time: '5 min', emoji: '🏛️', bg: 'bg-stone-100' },
  { cat: 'Travel', title: 'Hidden Gems of Southeast Asia', author: 'Anna Lee', time: '7 min', emoji: '🗺️', bg: 'bg-teal-50' },
  { cat: 'Lifestyle', title: 'Slow Living in a Fast World', author: 'Emma White', time: '4 min', emoji: '🌿', bg: 'bg-green-50' },
  { cat: 'Culture', title: 'The Renaissance of Vinyl Records', author: 'Jay Kim', time: '5 min', emoji: '🎵', bg: 'bg-purple-50' },
]
export default function ArticleGrid() {
  return (
    <div className="grid grid-cols-3 gap-8">
      {articles.map(a => (
        <article key={a.title} className="group cursor-pointer">
          <div className={\`\${a.bg} rounded-xl h-40 flex items-center justify-center text-5xl mb-4\`}>{a.emoji}</div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{a.cat}</span>
          <h3 className="text-lg font-bold text-gray-900 mt-1 mb-2 group-hover:underline leading-snug font-serif">{a.title}</h3>
          <div className="text-sm text-gray-400">{a.author} · {a.time} read</div>
        </article>
      ))}
    </div>
  )
}
`,
    },
    {
      filePath: 'app/globals.css',
      fileType: 'style',
      skillSource: 'uiux',
      content: getBaseStyles(),
    },
    {
      filePath: 'tailwind.config.ts',
      fileType: 'config',
      skillSource: 'uiux',
      content: getTailwindConfig('#e11d48'),
    },
  ],

  // ------ Blog Minimal ------
  blog_minimal: (input) => [
    {
      filePath: 'app/page.tsx',
      fileType: 'page',
      skillSource: 'uiux',
      content: `export default function BlogHome() {
  const posts = [
    { slug: 'first-post', title: 'Why I Started Writing Again', date: 'Mar 10, 2026', readTime: '5 min', tags: ['Personal', 'Writing'] },
    { slug: 'second-post', title: 'Everything I Learned Building in Public', date: 'Mar 5, 2026', readTime: '8 min', tags: ['Startup', 'Lessons'] },
    { slug: 'third-post', title: 'The Tools I Use Every Day', date: 'Feb 28, 2026', readTime: '4 min', tags: ['Productivity', 'Tools'] },
    { slug: 'fourth-post', title: 'On Saying No to Good Opportunities', date: 'Feb 20, 2026', readTime: '6 min', tags: ['Career', 'Focus'] },
  ]
  return (
    <div className="min-h-screen bg-white max-w-2xl mx-auto px-6 py-16">
      <header className="mb-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">${input.name}</h1>
        <p className="text-gray-500">${input.description}</p>
      </header>
      <div className="space-y-12">
        {posts.map(p => (
          <article key={p.slug} className="group">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <span>{p.date}</span>
              <span>·</span>
              <span>{p.readTime} read</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors cursor-pointer">
              {p.title}
            </h2>
            <div className="flex gap-2">
              {p.tags.map(t => (
                <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
`,
    },
    {
      filePath: 'app/globals.css',
      fileType: 'style',
      skillSource: 'uiux',
      content: getBaseStyles(),
    },
    {
      filePath: 'tailwind.config.ts',
      fileType: 'config',
      skillSource: 'uiux',
      content: getTailwindConfig('#4f46e5'),
    },
  ],

  // ------ Portfolio Creative ------
  portfolio_creative: (input) => [
    {
      filePath: 'app/page.tsx',
      fileType: 'page',
      skillSource: 'uiux',
      content: `import PortfolioNav from './components/PortfolioNav'
import HeroSection from './components/HeroSection'
import WorkGrid from './components/WorkGrid'
import Contact from './components/Contact'

export default function Portfolio() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <PortfolioNav name="${input.name}" />
      <HeroSection />
      <WorkGrid />
      <Contact />
    </div>
  )
}
`,
    },
    {
      filePath: 'app/components/PortfolioNav.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `export default function PortfolioNav({ name }: { name: string }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6">
      <span className="font-bold text-white">{name}</span>
      <div className="flex gap-6 text-sm text-gray-400">
        <a href="#work" className="hover:text-white transition-colors">Work</a>
        <a href="#about" className="hover:text-white transition-colors">About</a>
        <a href="#contact" className="hover:text-white transition-colors">Contact</a>
      </div>
    </nav>
  )
}
`,
    },
    {
      filePath: 'app/components/HeroSection.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `export default function HeroSection() {
  return (
    <section className="min-h-screen flex items-center px-8 pt-24 pb-12">
      <div>
        <p className="text-violet-400 font-mono text-sm mb-4">// Creative Director & Designer</p>
        <h1 className="text-7xl font-black leading-none mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
          Crafting<br />Digital<br />Experiences
        </h1>
        <p className="text-gray-400 text-lg max-w-md mb-8 leading-relaxed">
          I design and build products that people love. Specializing in brand identity, digital experiences, and creative direction.
        </p>
        <div className="flex items-center gap-4">
          <a href="#work" className="bg-white text-gray-900 px-6 py-3 rounded-full font-semibold text-sm hover:bg-gray-100 transition-colors">
            View Work
          </a>
          <a href="#contact" className="text-gray-400 text-sm hover:text-white transition-colors">
            Get in touch →
          </a>
        </div>
      </div>
    </section>
  )
}
`,
    },
    {
      filePath: 'app/components/WorkGrid.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `const projects = [
  { title: 'Rebrand Collective', cat: 'Brand Identity', year: '2025', color: 'from-violet-900 to-purple-800', emoji: '✦' },
  { title: 'Flow Digital', cat: 'Web Design', year: '2025', color: 'from-blue-900 to-indigo-800', emoji: '◈' },
  { title: 'Noma Editorial', cat: 'Art Direction', year: '2024', color: 'from-rose-900 to-pink-800', emoji: '◉' },
  { title: 'Solaris App', cat: 'UI/UX Design', year: '2024', color: 'from-amber-900 to-orange-800', emoji: '◇' },
]
export default function WorkGrid() {
  return (
    <section id="work" className="px-8 pb-20">
      <h2 className="text-xs font-mono text-gray-600 uppercase tracking-widest mb-8">Selected Work</h2>
      <div className="grid grid-cols-2 gap-4">
        {projects.map((p, i) => (
          <div key={p.title} className={\`bg-gradient-to-br \${p.color} rounded-2xl p-8 aspect-video flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-transform \${i === 0 ? 'col-span-2' : ''}\`}>
            <span className="text-4xl text-white/20">{p.emoji}</span>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1">{p.cat} · {p.year}</p>
              <h3 className="text-white text-xl font-bold">{p.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
`,
    },
    {
      filePath: 'app/components/Contact.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `export default function Contact() {
  return (
    <section id="contact" className="px-8 py-20 border-t border-gray-800">
      <div className="max-w-2xl">
        <h2 className="text-4xl font-bold text-white mb-4">Let's work together</h2>
        <p className="text-gray-400 mb-8">I'm currently available for freelance projects. Reach out and let's create something great.</p>
        <a href="mailto:hello@portfolio.com" className="inline-flex items-center gap-2 text-violet-400 text-lg hover:text-violet-300 transition-colors font-medium">
          hello@portfolio.com →
        </a>
      </div>
    </section>
  )
}
`,
    },
    {
      filePath: 'app/globals.css',
      fileType: 'style',
      skillSource: 'uiux',
      content: getBaseStyles(),
    },
    {
      filePath: 'tailwind.config.ts',
      fileType: 'config',
      skillSource: 'uiux',
      content: getTailwindConfig('#8b5cf6'),
    },
  ],

  // ------ Portfolio Developer ------
  portfolio_developer: (input) => [
    {
      filePath: 'app/page.tsx',
      fileType: 'page',
      skillSource: 'uiux',
      content: `export default function DevPortfolio() {
  const skills = ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'GraphQL']
  const projects = [
    { name: 'OpenMetrics', desc: 'Open-source monitoring dashboard', stars: 1204, lang: 'TypeScript', emoji: '📊' },
    { name: 'Quickform', desc: 'Headless form builder library', stars: 892, lang: 'React', emoji: '📝' },
    { name: 'Deploy CLI', desc: 'Zero-config deployment tool', stars: 567, lang: 'Node.js', emoji: '🚀' },
  ]
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-mono">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-16">
          <div className="text-green-400 text-sm mb-4">$ whoami</div>
          <h1 className="text-4xl font-bold text-white mb-2">${input.name}</h1>
          <p className="text-gray-400 text-lg mb-6">${input.description}</p>
          <div className="flex gap-3">
            <a href="#" className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg transition-colors">GitHub</a>
            <a href="#" className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg transition-colors">LinkedIn</a>
            <a href="mailto:dev@example.com" className="text-sm bg-green-900 hover:bg-green-800 text-green-300 px-4 py-2 rounded-lg transition-colors">Email</a>
          </div>
        </div>
        <div className="mb-16">
          <div className="text-green-400 text-sm mb-4">$ ls skills/</div>
          <div className="flex flex-wrap gap-2">
            {skills.map(s => (
              <span key={s} className="text-xs bg-gray-800 text-gray-300 border border-gray-700 px-3 py-1.5 rounded">{s}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-green-400 text-sm mb-4">$ cat projects.json</div>
          <div className="space-y-4">
            {projects.map(p => (
              <div key={p.name} className="border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{p.emoji}</span>
                    <span className="font-bold text-white">{p.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">⭐ {p.stars}</span>
                </div>
                <p className="text-sm text-gray-400 mb-3">{p.desc}</p>
                <span className="text-xs bg-blue-900/50 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">{p.lang}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
`,
    },
    {
      filePath: 'app/globals.css',
      fileType: 'style',
      skillSource: 'uiux',
      content: getBaseStyles(),
    },
    {
      filePath: 'tailwind.config.ts',
      fileType: 'config',
      skillSource: 'uiux',
      content: getTailwindConfig('#22c55e'),
    },
  ],

  // ------ Landing Startup ------
  landing_startup: (input) => [
    {
      filePath: 'app/page.tsx',
      fileType: 'page',
      skillSource: 'uiux',
      content: `import LandingNav from './components/LandingNav'
import LandingHero from './components/LandingHero'
import LandingFeatures from './components/LandingFeatures'
import LandingCTA from './components/LandingCTA'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingNav name="${input.name}" />
      <LandingHero name="${input.name}" desc="${input.description}" />
      <LandingFeatures />
      <LandingCTA />
    </div>
  )
}
`,
    },
    {
      filePath: 'app/components/LandingNav.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `export default function LandingNav({ name }: { name: string }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg" />
          <span className="font-bold text-gray-900">{name}</span>
        </div>
        <div className="flex items-center gap-8 text-sm text-gray-600">
          <a href="#" className="hover:text-gray-900">Product</a>
          <a href="#" className="hover:text-gray-900">Pricing</a>
          <a href="#" className="hover:text-gray-900">About</a>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-sm text-gray-600 hover:text-gray-900">Sign in</button>
          <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Get started →
          </button>
        </div>
      </div>
    </nav>
  )
}
`,
    },
    {
      filePath: 'app/components/LandingHero.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `export default function LandingHero({ name, desc }: { name: string; desc: string }) {
  return (
    <section className="pt-32 pb-20 px-6 text-center bg-gradient-to-b from-blue-50/50 to-white">
      <div className="max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
          Launching March 2026
        </div>
        <h1 className="text-6xl font-black text-gray-900 leading-tight mb-6 tracking-tight">{name}</h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">{desc}</p>
        <div className="flex items-center justify-center gap-4">
          <button className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
            Start free trial
          </button>
          <button className="text-gray-600 px-8 py-3.5 rounded-xl font-semibold border border-gray-200 hover:border-gray-300 transition-colors">
            Watch demo
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-4">No credit card required · Free 14-day trial</p>
      </div>
    </section>
  )
}
`,
    },
    {
      filePath: 'app/components/LandingFeatures.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `const feats = [
  { icon: '🚀', title: 'Ship 10x faster', desc: 'Go from idea to production in days, not months. Our platform handles the heavy lifting.' },
  { icon: '🔐', title: 'Security first', desc: 'Enterprise-grade security built in from day one. Sleep soundly knowing your data is safe.' },
  { icon: '📈', title: 'Scale effortlessly', desc: 'Handle millions of users without breaking a sweat. Infrastructure that grows with you.' },
]
export default function LandingFeatures() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-3 gap-8">
        {feats.map(f => (
          <div key={f.title} className="text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-5">{f.icon}</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
`,
    },
    {
      filePath: 'app/components/LandingCTA.tsx',
      fileType: 'component',
      skillSource: 'uiux',
      content: `export default function LandingCTA() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-16 text-center text-white">
        <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-blue-200 mb-8 text-lg">Join 10,000+ teams already using our platform.</p>
        <div className="flex items-center justify-center gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="px-5 py-3 rounded-xl text-gray-900 text-sm w-64 outline-none"
          />
          <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors">
            Get early access
          </button>
        </div>
      </div>
    </section>
  )
}
`,
    },
    {
      filePath: 'app/globals.css',
      fileType: 'style',
      skillSource: 'uiux',
      content: getBaseStyles(),
    },
    {
      filePath: 'tailwind.config.ts',
      fileType: 'config',
      skillSource: 'uiux',
      content: getTailwindConfig('#2563eb'),
    },
  ],

  // ------ Landing Agency ------
  landing_agency: (input) => [
    {
      filePath: 'app/page.tsx',
      fileType: 'page',
      skillSource: 'uiux',
      content: `export default function AgencyPage() {
  const services = [
    { title: 'Brand Strategy', desc: 'We craft identities that resonate and endure.', icon: '◈' },
    { title: 'Digital Design', desc: 'Pixel-perfect interfaces that convert and delight.', icon: '◉' },
    { title: 'Web Development', desc: 'Fast, accessible, beautiful — built to scale.', icon: '◇' },
    { title: 'Motion & Video', desc: 'Stories that move people, literally.', icon: '◎' },
  ]
  const clients = ['Airbnb', 'Stripe', 'Linear', 'Vercel', 'Figma', 'Notion']
  return (
    <div className="min-h-screen bg-white">
      <nav className="px-8 py-6 flex items-center justify-between">
        <span className="font-black text-gray-900 text-xl">${input.name}</span>
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <a href="#" className="hover:text-gray-900">Work</a>
          <a href="#" className="hover:text-gray-900">Services</a>
          <a href="#" className="hover:text-gray-900">About</a>
          <a href="#" className="bg-gray-900 text-white px-5 py-2 rounded-full hover:bg-gray-700 transition-colors">Contact</a>
        </div>
      </nav>
      <section className="px-8 py-24">
        <h1 className="text-8xl font-black text-gray-900 leading-none mb-6 max-w-4xl">
          We build<br /><span className="text-gray-300">brands that</span><br />matter.
        </h1>
        <p className="text-xl text-gray-500 max-w-xl mb-10">${input.description}</p>
        <div className="flex items-center gap-6">
          <a href="#work" className="bg-gray-900 text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-700 transition-colors">
            See our work
          </a>
          <a href="#services" className="text-gray-900 font-semibold flex items-center gap-2 hover:gap-3 transition-all">
            Services <span>→</span>
          </a>
        </div>
      </section>
      <section className="px-8 py-6 border-y border-gray-100 overflow-hidden">
        <div className="flex gap-16 items-center">
          <span className="text-xs text-gray-400 uppercase tracking-widest whitespace-nowrap">Trusted by</span>
          {clients.map(c => <span key={c} className="text-gray-300 font-bold text-lg whitespace-nowrap">{c}</span>)}
        </div>
      </section>
      <section id="services" className="px-8 py-20">
        <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-12">What we do</h2>
        <div className="grid grid-cols-2 gap-px bg-gray-100">
          {services.map(s => (
            <div key={s.title} className="bg-white p-10 hover:bg-gray-50 transition-colors">
              <span className="text-3xl text-gray-200 block mb-4">{s.icon}</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
`,
    },
    {
      filePath: 'app/globals.css',
      fileType: 'style',
      skillSource: 'uiux',
      content: getBaseStyles(),
    },
    {
      filePath: 'tailwind.config.ts',
      fileType: 'config',
      skillSource: 'uiux',
      content: getTailwindConfig('#111827'),
    },
  ],

  // ------ Event Conference ------
  event_conference: (input) => [
    {
      filePath: 'app/page.tsx',
      fileType: 'page',
      skillSource: 'uiux',
      content: `export default function ConferencePage() {
  const speakers = [
    { name: 'Sarah Chen', role: 'CTO @ OpenAI', topic: 'AI Safety', emoji: '👩‍💻' },
    { name: 'Marcus Lee', role: 'CEO @ Linear', topic: 'Product Design', emoji: '👨‍🎨' },
    { name: 'Priya Patel', role: 'Partner @ a16z', topic: 'Future of Investing', emoji: '👩‍💼' },
    { name: 'Tom Rivera', role: 'VP @ Stripe', topic: 'Fintech Evolution', emoji: '👨‍💻' },
  ]
  const schedule = [
    { time: '09:00', title: 'Registration & Breakfast', type: 'break' },
    { time: '10:00', title: 'Opening Keynote: The Next 10 Years', type: 'keynote' },
    { time: '11:30', title: 'Workshop: Building Scalable Systems', type: 'workshop' },
    { time: '13:00', title: 'Lunch & Networking', type: 'break' },
    { time: '14:30', title: 'Panel: AI in Enterprise', type: 'panel' },
    { time: '16:00', title: 'Closing & Awards', type: 'keynote' },
  ]
  const typeColor: Record<string, string> = {
    keynote: 'bg-violet-100 text-violet-700',
    workshop: 'bg-blue-100 text-blue-700',
    panel: 'bg-amber-100 text-amber-700',
    break: 'bg-gray-100 text-gray-500',
  }
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="relative overflow-hidden py-24 px-8 text-center bg-gradient-to-br from-violet-950 to-gray-950 border-b border-gray-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-violet-900/50 border border-violet-700 text-violet-300 text-xs px-4 py-1.5 rounded-full mb-6">
            📅 April 18–19, 2026 · San Francisco
          </div>
          <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-white to-violet-300 bg-clip-text text-transparent">
            ${input.name}
          </h1>
          <p className="text-gray-400 text-xl max-w-xl mx-auto mb-8">${input.description}</p>
          <button className="bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 rounded-xl font-semibold transition-colors">
            Get Your Ticket — $299
          </button>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold mb-8">Featured Speakers</h2>
        <div className="grid grid-cols-4 gap-4 mb-16">
          {speakers.map(s => (
            <div key={s.name} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center text-2xl mb-4">{s.emoji}</div>
              <div className="font-bold text-white mb-0.5">{s.name}</div>
              <div className="text-xs text-gray-500 mb-3">{s.role}</div>
              <div className="text-xs bg-violet-900/40 text-violet-300 px-2 py-1 rounded-md inline-block">{s.topic}</div>
            </div>
          ))}
        </div>
        <h2 className="text-2xl font-bold mb-6">Schedule</h2>
        <div className="space-y-2">
          {schedule.map(s => (
            <div key={s.time} className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-lg px-5 py-4">
              <span className="text-sm font-mono text-gray-500 w-16 shrink-0">{s.time}</span>
              <span className="flex-1 font-medium">{s.title}</span>
              <span className={\`text-xs px-2 py-0.5 rounded \${typeColor[s.type]}\`}>{s.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
`,
    },
    {
      filePath: 'app/globals.css',
      fileType: 'style',
      skillSource: 'uiux',
      content: getBaseStyles(),
    },
    {
      filePath: 'tailwind.config.ts',
      fileType: 'config',
      skillSource: 'uiux',
      content: getTailwindConfig('#7c3aed'),
    },
  ],

  // ------ Event Wedding ------
  event_wedding: (input) => [
    {
      filePath: 'app/page.tsx',
      fileType: 'page',
      skillSource: 'uiux',
      content: `export default function WeddingPage() {
  return (
    <div className="min-h-screen bg-stone-50 font-serif">
      <section className="text-center py-20 px-6">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-6">You are cordially invited</p>
        <h1 className="text-6xl font-light text-stone-800 mb-2">Emma & James</h1>
        <div className="w-20 h-px bg-stone-300 mx-auto my-6" />
        <p className="text-stone-500 text-lg mb-2">September 21, 2026</p>
        <p className="text-stone-400 text-sm">The Grand Estate · Napa Valley, California</p>
      </section>
      <section className="bg-white py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-stone-600 leading-relaxed text-lg">
            Together with their families, Emma Wilson and James Parker<br />
            request the honor of your presence at their marriage.
          </p>
        </div>
      </section>
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { title: 'Ceremony', time: '3:00 PM', place: 'Rose Garden', icon: '💍' },
            { title: 'Cocktails', time: '5:00 PM', place: 'Terrace', icon: '🥂' },
            { title: 'Reception', time: '7:00 PM', place: 'Grand Hall', icon: '✨' },
          ].map(e => (
            <div key={e.title} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl mb-3">{e.icon}</div>
              <h3 className="font-semibold text-stone-800 mb-1">{e.title}</h3>
              <p className="text-stone-500 text-sm">{e.time}</p>
              <p className="text-stone-400 text-xs">{e.place}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-stone-800 text-white py-16 px-6 text-center">
        <h2 className="text-2xl font-light mb-6">RSVP by August 1st</h2>
        <div className="flex items-center justify-center gap-3 max-w-sm mx-auto">
          <input type="email" placeholder="your@email.com" className="flex-1 px-4 py-2 rounded-lg bg-stone-700 border border-stone-600 text-sm text-white placeholder:text-stone-500 outline-none" />
          <button className="bg-stone-100 text-stone-900 px-5 py-2 rounded-lg text-sm font-medium hover:bg-white transition-colors">RSVP</button>
        </div>
      </section>
    </div>
  )
}
`,
    },
    {
      filePath: 'app/globals.css',
      fileType: 'style',
      skillSource: 'uiux',
      content: getBaseStyles(),
    },
    {
      filePath: 'tailwind.config.ts',
      fileType: 'config',
      skillSource: 'uiux',
      content: getTailwindConfig('#78716c'),
    },
  ],

  // ------ Restaurant Menu ------
  restaurant_menu: (input) => [
    {
      filePath: 'app/page.tsx',
      fileType: 'page',
      skillSource: 'uiux',
      content: `export default function RestaurantPage() {
  const menuItems = [
    { cat: 'Starters', items: [
      { name: 'Burrata & Heirloom Tomato', price: 18, desc: 'Stracciatella, basil oil, sea salt', emoji: '🧀' },
      { name: 'Tuna Tartare', price: 22, desc: 'Avocado, sesame, ponzu, wonton crisps', emoji: '🐟' },
    ]},
    { cat: 'Mains', items: [
      { name: 'Pan-Seared Duck Breast', price: 42, desc: 'Cherry reduction, celeriac purée, wild mushrooms', emoji: '🦆' },
      { name: 'Pasta al Tartufo', price: 38, desc: 'Fresh pappardelle, black truffle, parmesan', emoji: '🍝' },
      { name: 'Grilled Seabass', price: 45, desc: 'Saffron risotto, lobster bisque, micro herbs', emoji: '🐟' },
    ]},
    { cat: 'Desserts', items: [
      { name: 'Tarte Tatin', price: 14, desc: 'Caramelized apple, crème fraîche, vanilla', emoji: '🥧' },
      { name: 'Chocolate Fondant', price: 16, desc: 'Valrhona 70%, salted caramel, honeycomb', emoji: '🍫' },
    ]},
  ]
  return (
    <div className="min-h-screen bg-stone-900 text-white">
      <header className="text-center py-16 px-6 border-b border-stone-700">
        <p className="text-xs tracking-[0.4em] text-stone-500 uppercase mb-3">Est. 2019</p>
        <h1 className="text-5xl font-light text-stone-100 mb-2">${input.name}</h1>
        <p className="text-stone-400">${input.description}</p>
        <div className="flex items-center justify-center gap-6 mt-6 text-sm text-stone-500">
          <span>📍 123 Main Street, SF</span>
          <span>⏰ Tue–Sun 6pm–11pm</span>
          <span>📞 +1 415 555 0100</span>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-6 py-12">
        {menuItems.map(section => (
          <div key={section.cat} className="mb-12">
            <h2 className="text-xs uppercase tracking-widest text-amber-500 mb-6 pb-3 border-b border-stone-800">{section.cat}</h2>
            <div className="space-y-6">
              {section.items.map(item => (
                <div key={item.name} className="flex items-start gap-4">
                  <span className="text-3xl">{item.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="font-medium text-stone-100">{item.name}</h3>
                      <span className="text-amber-400 font-light">\${item.price}</span>
                    </div>
                    <p className="text-sm text-stone-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="mt-12 text-center">
          <button className="bg-amber-600 hover:bg-amber-500 text-white px-10 py-3 rounded-full font-medium transition-colors">
            Reserve a Table
          </button>
        </div>
      </div>
    </div>
  )
}
`,
    },
    {
      filePath: 'app/globals.css',
      fileType: 'style',
      skillSource: 'uiux',
      content: getBaseStyles(),
    },
    {
      filePath: 'tailwind.config.ts',
      fileType: 'config',
      skillSource: 'uiux',
      content: getTailwindConfig('#d97706'),
    },
  ],

  // ------ Real Estate ------
  real_estate: (input) => [
    {
      filePath: 'app/page.tsx',
      fileType: 'page',
      skillSource: 'uiux',
      content: `'use client'
import { useState } from 'react'

export default function RealEstatePage() {
  const [activeFilter, setActiveFilter] = useState('All')
  const filters = ['All', 'For Sale', 'For Rent', 'New Build']
  const listings = [
    { title: 'Modern Loft Downtown', type: 'For Sale', price: '$1.2M', beds: 2, baths: 2, sqft: 1200, emoji: '🏙️', tag: 'New Listing' },
    { title: 'Victorian Family Home', type: 'For Sale', price: '$2.8M', beds: 4, baths: 3, sqft: 2800, emoji: '🏡', tag: 'Open House' },
    { title: 'Beachfront Condo', type: 'For Rent', price: '$4,500/mo', beds: 1, baths: 1, sqft: 850, emoji: '🏖️', tag: null },
    { title: 'Penthouse Suite', type: 'For Sale', price: '$5.5M', beds: 3, baths: 3, sqft: 3200, emoji: '🌆', tag: 'Price Drop' },
    { title: 'Garden Townhouse', type: 'For Rent', price: '$3,200/mo', beds: 3, baths: 2, sqft: 1800, emoji: '🌿', tag: null },
    { title: 'Studio Near Transit', type: 'For Rent', price: '$1,800/mo', beds: 0, baths: 1, sqft: 520, emoji: '🚇', tag: null },
  ]
  const filtered = activeFilter === 'All' ? listings : listings.filter(l => l.type === activeFilter)
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 h-16 flex items-center justify-between">
        <span className="font-bold text-gray-900 text-lg">${input.name}</span>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <a href="#" className="hover:text-gray-900">Buy</a>
          <a href="#" className="hover:text-gray-900">Rent</a>
          <a href="#" className="hover:text-gray-900">Sell</a>
          <button className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">Contact Agent</button>
        </div>
      </nav>
      <section className="bg-gradient-to-r from-teal-900 to-teal-700 text-white py-20 px-6 text-center">
        <h1 className="text-4xl font-bold mb-4">Find Your Dream Home</h1>
        <p className="text-teal-200 mb-8">${input.description}</p>
        <div className="max-w-2xl mx-auto flex gap-3">
          <input placeholder="Search by city, neighborhood..." className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-teal-300 rounded-xl px-4 py-3 text-sm outline-none" />
          <button className="bg-white text-teal-800 px-6 py-3 rounded-xl font-medium hover:bg-teal-50 transition-colors">Search</button>
        </div>
      </section>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex gap-2 mb-8">
          {filters.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${activeFilter === f ? 'bg-teal-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300'}\`}>{f}</button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          {filtered.map(l => (
            <div key={l.title} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-teal-50 h-44 flex items-center justify-center text-5xl relative">
                {l.tag && <span className="absolute top-3 left-3 text-xs bg-teal-600 text-white px-2 py-1 rounded-full">{l.tag}</span>}
                {l.emoji}
              </div>
              <div className="p-4">
                <div className="text-xs text-teal-600 font-medium mb-1">{l.type}</div>
                <h3 className="font-bold text-gray-900 mb-1">{l.title}</h3>
                <div className="text-teal-700 font-bold mb-3">{l.price}</div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>🛏 {l.beds === 0 ? 'Studio' : \`\${l.beds} bed\`}</span>
                  <span>🚿 {l.baths} bath</span>
                  <span>📐 {l.sqft} sqft</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
`,
    },
    {
      filePath: 'app/globals.css',
      fileType: 'style',
      skillSource: 'uiux',
      content: getBaseStyles(),
    },
    {
      filePath: 'tailwind.config.ts',
      fileType: 'config',
      skillSource: 'uiux',
      content: getTailwindConfig('#0d9488'),
    },
  ],

  // ------ Education Course ------
  education_course: (input) => [
    {
      filePath: 'app/page.tsx',
      fileType: 'page',
      skillSource: 'uiux',
      content: `export default function CoursePage() {
  const modules = [
    { num: '01', title: 'Foundations', lessons: 6, duration: '2h 30m', done: true },
    { num: '02', title: 'Core Concepts', lessons: 8, duration: '3h 15m', done: true },
    { num: '03', title: 'Advanced Techniques', lessons: 10, duration: '4h 45m', done: false },
    { num: '04', title: 'Real-World Projects', lessons: 5, duration: '3h 00m', done: false },
    { num: '05', title: 'Certification', lessons: 3, duration: '1h 30m', done: false },
  ]
  const instructors = [
    { name: 'Dr. Maya Chen', title: 'ML Research Lead', emoji: '👩‍🔬' },
    { name: 'Prof. Alex Davis', title: 'Stanford CS Faculty', emoji: '👨‍🏫' },
  ]
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b px-6 h-14 flex items-center justify-between">
        <span className="font-bold text-gray-900">${input.name}</span>
        <button className="text-sm bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors">Enroll — $199</button>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded font-medium">Bestseller</span>
            <span className="text-xs text-gray-400">Updated March 2026</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">${input.name}</h1>
          <p className="text-gray-600 text-lg mb-6">${input.description}</p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span>⭐ 4.8 (2,341 reviews)</span>
            <span>👥 12,450 students</span>
            <span>🕐 15h total</span>
            <span>📜 Certificate included</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[['32', 'Lessons'], ['15h', 'Content'], ['∞', 'Access']].map(([v, l]) => (
            <div key={l} className="bg-orange-50 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">{v}</div>
              <div className="text-sm text-gray-600">{l}</div>
            </div>
          ))}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Course Curriculum</h2>
        <div className="space-y-2 mb-12">
          {modules.map(m => (
            <div key={m.num} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-orange-200 transition-colors">
              <span className={\`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold \${m.done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}\`}>
                {m.done ? '✓' : m.num}
              </span>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{m.title}</div>
                <div className="text-xs text-gray-400">{m.lessons} lessons · {m.duration}</div>
              </div>
            </div>
          ))}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Instructors</h2>
        <div className="grid grid-cols-2 gap-4">
          {instructors.map(i => (
            <div key={i.name} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">{i.emoji}</div>
              <div>
                <div className="font-medium text-gray-900">{i.name}</div>
                <div className="text-sm text-gray-500">{i.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
`,
    },
    {
      filePath: 'app/globals.css',
      fileType: 'style',
      skillSource: 'uiux',
      content: getBaseStyles(),
    },
    {
      filePath: 'tailwind.config.ts',
      fileType: 'config',
      skillSource: 'uiux',
      content: getTailwindConfig('#f97316'),
    },
  ],

  // ------ Healthcare ------
  healthcare: (input) => [
    {
      filePath: 'app/page.tsx',
      fileType: 'page',
      skillSource: 'uiux',
      content: `export default function HealthcarePage() {
  const services = [
    { icon: '🫀', title: 'Cardiology', desc: 'Comprehensive heart care by leading specialists.' },
    { icon: '🧠', title: 'Neurology', desc: 'Expert care for brain and nervous system conditions.' },
    { icon: '🦴', title: 'Orthopedics', desc: 'Joint replacements, sports medicine, and rehabilitation.' },
    { icon: '👁️', title: 'Ophthalmology', desc: 'Complete eye care including laser surgery.' },
    { icon: '🫁', title: 'Pulmonology', desc: 'Treatment for respiratory and lung conditions.' },
    { icon: '🩺', title: 'Preventive Care', desc: 'Annual check-ups and health screenings.' },
  ]
  const doctors = [
    { name: 'Dr. Sarah Mitchell', spec: 'Cardiologist', exp: '15 yrs', emoji: '👩‍⚕️', rating: 4.9 },
    { name: 'Dr. James Park', spec: 'Neurologist', exp: '12 yrs', emoji: '👨‍⚕️', rating: 4.8 },
    { name: 'Dr. Lisa Wang', spec: 'Orthopedist', exp: '10 yrs', emoji: '👩‍⚕️', rating: 4.9 },
  ]
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white shadow-sm px-6 h-16 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white text-sm">+</div>
          <span className="font-bold text-gray-900">${input.name}</span>
        </div>
        <div className="flex gap-6 text-sm text-gray-600">
          <a href="#services" className="hover:text-teal-600">Services</a>
          <a href="#doctors" className="hover:text-teal-600">Our Doctors</a>
          <a href="#" className="hover:text-teal-600">Patient Portal</a>
        </div>
        <button className="bg-teal-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors">
          Book Appointment
        </button>
      </nav>
      <section className="bg-gradient-to-br from-teal-50 to-cyan-50 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">${input.name}</h1>
          <p className="text-xl text-gray-500 mb-8">${input.description}</p>
          <div className="flex gap-4 justify-center">
            <button className="bg-teal-500 text-white px-8 py-3 rounded-xl font-medium hover:bg-teal-600 transition-colors">
              Schedule Now
            </button>
            <button className="border border-teal-200 text-teal-700 px-8 py-3 rounded-xl font-medium hover:bg-teal-50 transition-colors">
              Emergency: 911
            </button>
          </div>
          <div className="flex items-center justify-center gap-8 mt-8 text-sm text-gray-500">
            <span>✓ 50+ Specialists</span>
            <span>✓ 24/7 Emergency Care</span>
            <span>✓ Insurance Accepted</span>
          </div>
        </div>
      </section>
      <section id="services" className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Our Services</h2>
          <div className="grid grid-cols-3 gap-4">
            {services.map(s => (
              <div key={s.title} className="p-5 border border-gray-100 rounded-xl hover:border-teal-200 transition-colors">
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="doctors" className="bg-gray-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Meet Our Specialists</h2>
          <div className="grid grid-cols-3 gap-6">
            {doctors.map(d => (
              <div key={d.name} className="bg-white rounded-xl p-6 text-center shadow-sm">
                <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">{d.emoji}</div>
                <h3 className="font-bold text-gray-900 mb-0.5">{d.name}</h3>
                <p className="text-sm text-teal-600 mb-1">{d.spec}</p>
                <p className="text-xs text-gray-400 mb-3">{d.exp} experience</p>
                <div className="text-sm text-amber-500">⭐ {d.rating}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
`,
    },
    {
      filePath: 'app/globals.css',
      fileType: 'style',
      skillSource: 'uiux',
      content: getBaseStyles(),
    },
    {
      filePath: 'tailwind.config.ts',
      fileType: 'config',
      skillSource: 'uiux',
      content: getTailwindConfig('#14b8a6'),
    },
  ],

  // ------ Finance/Fintech ------
  finance_fintech: (input) => [
    {
      filePath: 'app/page.tsx',
      fileType: 'page',
      skillSource: 'uiux',
      content: `export default function FinancePage() {
  const stats = [
    { label: 'Assets Under Management', value: '$2.4B', change: '+18%' },
    { label: 'Active Users', value: '340K', change: '+24%' },
    { label: 'Avg. Portfolio Return', value: '12.4%', change: '+3.2%' },
  ]
  const features = [
    { icon: '📊', title: 'Smart Portfolio', desc: 'AI-driven allocation based on your goals and risk tolerance.' },
    { icon: '🔒', title: 'Bank-Level Security', desc: 'FDIC insured, 256-bit encryption, biometric auth.' },
    { icon: '💸', title: 'Zero Fees', desc: 'No management fees. No trading commissions. Ever.' },
    { icon: '📱', title: 'Real-Time Insights', desc: 'Live market data and instant notifications.' },
  ]
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg" />
          <span className="font-bold">${input.name}</span>
        </div>
        <div className="flex gap-6 text-sm text-gray-400">
          <a href="#" className="hover:text-white">Features</a>
          <a href="#" className="hover:text-white">Security</a>
          <a href="#" className="hover:text-white">Pricing</a>
        </div>
        <div className="flex gap-3">
          <button className="text-sm text-gray-400 hover:text-white">Log in</button>
          <button className="text-sm bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-400 transition-colors">Open Account</button>
        </div>
      </nav>
      <section className="pt-20 pb-16 px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-900/30 border border-emerald-800 text-emerald-400 text-xs px-3 py-1 rounded-full mb-8">
          🏆 Best Fintech App 2025
        </div>
        <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-white via-emerald-200 to-emerald-500 bg-clip-text text-transparent">
          Invest Smarter
        </h1>
        <p className="text-gray-400 text-xl max-w-xl mx-auto mb-10">${input.description}</p>
        <button className="bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg shadow-emerald-900/40">
          Start Investing Free
        </button>
      </section>
      <section className="py-12 border-y border-gray-800 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-emerald-400 text-sm mb-1">{s.change} YoY</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-6">
          {features.map(f => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
`,
    },
    {
      filePath: 'app/globals.css',
      fileType: 'style',
      skillSource: 'uiux',
      content: getBaseStyles(),
    },
    {
      filePath: 'tailwind.config.ts',
      fileType: 'config',
      skillSource: 'uiux',
      content: getTailwindConfig('#10b981'),
    },
  ],

  // ------ Travel Tourism ------
  travel_tourism: (input) => [
    {
      filePath: 'app/page.tsx',
      fileType: 'page',
      skillSource: 'uiux',
      content: `export default function TravelPage() {
  const destinations = [
    { name: 'Kyoto, Japan', desc: 'Ancient temples & cherry blossoms', price: 1299, nights: 7, emoji: '🗾', bg: 'from-pink-900 to-rose-800' },
    { name: 'Santorini, Greece', desc: 'White cliffs & azure infinity pools', price: 1599, nights: 8, emoji: '🏛️', bg: 'from-blue-900 to-indigo-800' },
    { name: 'Patagonia, Chile', desc: 'Raw wilderness & glacial lakes', price: 2199, nights: 10, emoji: '🏔️', bg: 'from-teal-900 to-emerald-800' },
    { name: 'Marrakech, Morocco', desc: 'Spice markets & riads', price: 899, nights: 6, emoji: '🕌', bg: 'from-orange-900 to-amber-800' },
  ]
  return (
    <div className="min-h-screen bg-white">
      <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6">
        <span className="text-white font-bold text-xl">${input.name}</span>
        <div className="flex items-center gap-6 text-sm text-white/80">
          <a href="#" className="hover:text-white">Destinations</a>
          <a href="#" className="hover:text-white">Experiences</a>
          <a href="#" className="hover:text-white">About</a>
          <button className="bg-white text-gray-900 px-5 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors">
            Plan a Trip
          </button>
        </div>
      </nav>
      <section className="h-[70vh] bg-gradient-to-br from-blue-900 via-teal-800 to-emerald-900 flex items-end px-8 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] opacity-5">🌍</div>
        <div className="relative">
          <p className="text-teal-300 text-sm uppercase tracking-widest mb-3">Curated for the discerning traveler</p>
          <h1 className="text-6xl font-black text-white leading-tight mb-4">
            Go Beyond<br />the Ordinary
          </h1>
          <p className="text-white/70 text-xl max-w-lg mb-8">${input.description}</p>
          <div className="flex gap-4">
            <button className="bg-white text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
              Explore Destinations
            </button>
          </div>
        </div>
      </section>
      <section className="py-16 px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Journeys</h2>
        <div className="grid grid-cols-2 gap-6">
          {destinations.map(d => (
            <div key={d.name} className={\`bg-gradient-to-br \${d.bg} rounded-3xl p-8 text-white cursor-pointer hover:scale-[1.01] transition-transform relative overflow-hidden\`}>
              <div className="absolute right-6 top-6 text-5xl opacity-40">{d.emoji}</div>
              <div className="relative">
                <div className="text-xs uppercase tracking-widest text-white/60 mb-2">{d.nights} nights</div>
                <h3 className="text-2xl font-bold mb-1">{d.name}</h3>
                <p className="text-white/70 text-sm mb-6">{d.desc}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold">\${d.price}</span>
                    <span className="text-white/50 text-sm"> / person</span>
                  </div>
                  <button className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-full transition-colors">
                    View →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
`,
    },
    {
      filePath: 'app/globals.css',
      fileType: 'style',
      skillSource: 'uiux',
      content: getBaseStyles(),
    },
    {
      filePath: 'tailwind.config.ts',
      fileType: 'config',
      skillSource: 'uiux',
      content: getTailwindConfig('#0891b2'),
    },
  ],

  // ------ Nonprofit Charity ------
  nonprofit_charity: (input) => [
    {
      filePath: 'app/page.tsx',
      fileType: 'page',
      skillSource: 'uiux',
      content: `'use client'
import { useState } from 'react'

export default function CharityPage() {
  const [donationAmount, setDonationAmount] = useState(50)
  const presets = [25, 50, 100, 250]
  const causes = [
    { title: 'Clean Water', raised: 82000, goal: 100000, emoji: '💧', percent: 82 },
    { title: 'Education Fund', raised: 45000, goal: 75000, emoji: '📚', percent: 60 },
    { title: 'Hunger Relief', raised: 93000, goal: 100000, emoji: '🌾', percent: 93 },
  ]
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-amber-100 px-6 h-16 flex items-center justify-between bg-amber-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌱</span>
          <span className="font-bold text-gray-900">${input.name}</span>
        </div>
        <div className="flex gap-6 text-sm text-gray-600">
          <a href="#causes" className="hover:text-amber-600">Our Causes</a>
          <a href="#impact" className="hover:text-amber-600">Impact</a>
          <a href="#donate" className="hover:text-amber-600">Donate</a>
        </div>
        <button className="bg-amber-500 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-amber-600 transition-colors">
          Donate Now
        </button>
      </nav>
      <section className="py-20 px-6 text-center bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-3xl mx-auto">
          <span className="text-5xl block mb-6">🌍</span>
          <h1 className="text-5xl font-black text-gray-900 mb-4">${input.name}</h1>
          <p className="text-xl text-gray-500 mb-8">${input.description}</p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <span>🏆 Top-rated nonprofit</span>
            <span>💯 95% funds to programs</span>
            <span>🌎 42 countries</span>
          </div>
        </div>
      </section>
      <section id="causes" className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Active Campaigns</h2>
          <div className="grid grid-cols-3 gap-6">
            {causes.map(c => (
              <div key={c.title} className="border border-gray-100 rounded-2xl p-6 hover:border-amber-200 transition-colors">
                <div className="text-3xl mb-3">{c.emoji}</div>
                <h3 className="font-bold text-gray-900 mb-3">{c.title}</h3>
                <div className="bg-gray-100 rounded-full h-2 mb-2">
                  <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: \`\${c.percent}%\` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>\${c.raised.toLocaleString()} raised</span>
                  <span>{c.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="donate" className="bg-amber-50 py-16 px-6">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Make a Difference</h2>
          <p className="text-gray-500 mb-8">Every dollar changes lives.</p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {presets.map(p => (
              <button key={p} onClick={() => setDonationAmount(p)} className={\`py-2 rounded-lg text-sm font-medium transition-colors \${donationAmount === p ? 'bg-amber-500 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-amber-300'}\`}>
                \${p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mb-6 bg-white border border-gray-200 rounded-xl px-4 py-3">
            <span className="text-gray-400 font-medium">$</span>
            <input
              type="number"
              value={donationAmount}
              onChange={e => setDonationAmount(Number(e.target.value))}
              className="flex-1 outline-none text-gray-900 font-semibold text-lg"
            />
          </div>
          <button className="w-full bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition-colors">
            Donate \${donationAmount}
          </button>
        </div>
      </section>
    </div>
  )
}
`,
    },
    {
      filePath: 'app/globals.css',
      fileType: 'style',
      skillSource: 'uiux',
      content: getBaseStyles(),
    },
    {
      filePath: 'tailwind.config.ts',
      fileType: 'config',
      skillSource: 'uiux',
      content: getTailwindConfig('#f59e0b'),
    },
  ],

  // ------ Tool Directory ------
  tool_directory: (input) => [
    {
      filePath: 'app/page.tsx',
      fileType: 'page',
      skillSource: 'uiux',
      content: `'use client'
import { useState } from 'react'

export default function DirectoryPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const categories = ['All', 'Design', 'Development', 'Productivity', 'AI', 'Analytics']
  const tools = [
    { name: 'Figma', cat: 'Design', desc: 'Collaborative interface design', pricing: 'Free', stars: 4.9, emoji: '🎨' },
    { name: 'Linear', cat: 'Development', desc: 'Issue tracking for modern teams', pricing: 'Freemium', stars: 4.8, emoji: '⚡' },
    { name: 'Notion', cat: 'Productivity', desc: 'All-in-one workspace', pricing: 'Free', stars: 4.7, emoji: '📝' },
    { name: 'Claude', cat: 'AI', desc: 'AI assistant by Anthropic', pricing: 'Freemium', stars: 4.9, emoji: '🤖' },
    { name: 'Vercel', cat: 'Development', desc: 'Deploy frontend in seconds', pricing: 'Free', stars: 4.8, emoji: '▲' },
    { name: 'Mixpanel', cat: 'Analytics', desc: 'Product analytics platform', pricing: 'Freemium', stars: 4.6, emoji: '📊' },
    { name: 'Loom', cat: 'Productivity', desc: 'Async video messaging', pricing: 'Free', stars: 4.7, emoji: '🎥' },
    { name: 'Midjourney', cat: 'AI', desc: 'AI image generation', pricing: 'Paid', stars: 4.8, emoji: '🖼️' },
    { name: 'Framer', cat: 'Design', desc: 'Website design & publish', pricing: 'Freemium', stars: 4.7, emoji: '✦' },
  ]
  const filtered = tools.filter(t => {
    const matchCat = activeCategory === 'All' || t.cat === activeCategory
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })
  const pricingColor: Record<string, string> = {
    Free: 'bg-green-100 text-green-700',
    Freemium: 'bg-blue-100 text-blue-700',
    Paid: 'bg-gray-100 text-gray-700',
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-gray-900">${input.name}</span>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tools..."
            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none w-64 focus:border-indigo-300"
          />
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            Submit Tool
          </button>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">${input.name}</h1>
          <p className="text-gray-500">${input.description}</p>
        </div>
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {categories.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)} className={\`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors \${activeCategory === c ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'}\`}>{c}</button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(t => (
            <div key={t.name} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-indigo-200 transition-colors cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">{t.emoji}</div>
                <span className={\`text-xs px-2 py-0.5 rounded-full font-medium \${pricingColor[t.pricing]}\`}>{t.pricing}</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">{t.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{t.desc}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="text-amber-500">⭐ {t.stars}</span>
                <span>{t.cat}</span>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            No tools found for "{search}"
          </div>
        )}
      </div>
    </div>
  )
}
`,
    },
    {
      filePath: 'app/globals.css',
      fileType: 'style',
      skillSource: 'uiux',
      content: getBaseStyles(),
    },
    {
      filePath: 'tailwind.config.ts',
      fileType: 'config',
      skillSource: 'uiux',
      content: getTailwindConfig('#4f46e5'),
    },
  ],
}

// ============================================================
// 主入口
// ============================================================

export function generateSeedTemplateFiles(template: TemplateInput): SeedTemplateFile[] {
  const type = detectType(template)
  const generator = generators[type]
  return generator(template)
}
