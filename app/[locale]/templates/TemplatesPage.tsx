'use client'

import { useEffect, useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { getTemplates, getTemplateFiles } from '@/app/actions/templates'
import {
  type TemplateCardData,
  type TemplateCategory,
  CATEGORY_LABELS,
  INITIAL_TEMPLATES,
  toTemplateCardData,
} from '@/app/lib/templates'
import { getBreadcrumbSchema } from '@/app/lib/structured-data'

// ── SVG 縮圖生成（複用 TemplatesShowcaseSection 邏輯）─────────────────────────

const THUMB_COLOR_MAP: Record<string, string> = {
  橘: '#f97316', 橙: '#f97316', 紫: '#8b5cf6', 藍: '#3b82f6',
  紅: '#ef4444', 綠: '#10b981', 翠: '#10b981', 金: '#f59e0b',
  黃: '#eab308', 霓虹: '#a3e635', 螢光: '#a3e635', 粉: '#ec4899',
  青: '#06b6d4', 棕: '#a16207', 玫: '#f43f5e', 薄荷: '#34d399',
  天空: '#38bdf8', 珊瑚: '#fb7185', 靛: '#6366f1',
}
const DARK_KW = ['暗', '深色', '黑', '夜', '電影感', '極暗', '炭', '墨', '暗黑', '炫黑', '復古']

function thumbColors(tags: string[], desc: string) {
  const text = [...tags, desc].join(' ')
  const found: string[] = []
  for (const [k, v] of Object.entries(THUMB_COLOR_MAP)) {
    if (text.includes(k)) found.push(v)
  }
  const primary = found[0] ?? '#3b82f6'
  const accent = found[1] ?? '#8b5cf6'
  const isDark = DARK_KW.some(k => text.includes(k))
  return { primary, accent, isDark }
}

function ha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

function generateThumbnailSvg(card: TemplateCardData): string {
  const { primary, accent, isDark } = thumbColors(card.tags, card.description)
  const bg = isDark ? '#0f0f1a' : '#f8fafc'
  const surface = isDark ? '#1a1a2e' : '#ffffff'
  const sidebarBg = isDark ? '#0d0d1a' : '#1e293b'
  const border = isDark ? '#2a2a3e' : '#e2e8f0'
  const textD = isDark ? '#e2e8f0' : '#1e293b'
  const textL = isDark ? '#475569' : '#94a3b8'

  let inner: string
  switch (card.category) {
    case 'saas':
    case 'tool':
    case 'dashboard':
      inner = `
        <rect width="260" height="146" fill="${bg}"/>
        <rect width="260" height="34" fill="${surface}" stroke="${border}" stroke-width="0.5"/>
        <rect x="10" y="11" width="28" height="12" rx="3" fill="${primary}" opacity="0.85"/>
        <rect x="220" y="9" width="28" height="16" rx="8" fill="${ha(primary, 0.15)}"/>
        <rect x="0" y="34" width="54" height="112" fill="${sidebarBg}"/>
        ${[0,1,2,3,4].map((_, i) => `<rect x="7" y="${42+i*18}" width="40" height="9" rx="3" fill="${i===0?primary:'#334155'}" opacity="${i===0?0.9:0.35}"/>`).join('')}
        ${[0,1].map((_, i) => `<rect x="${58+i*64}" y="42" width="58" height="32" rx="4" fill="${surface}" stroke="${border}" stroke-width="0.5"/><rect x="${62+i*64}" y="47" width="22" height="4" rx="2" fill="${textL}" opacity="0.5"/><rect x="${62+i*64}" y="54" width="36" height="9" rx="2" fill="${textD}" opacity="0.7"/><rect x="${62+i*64}" y="66" width="18" height="3" rx="1" fill="${primary}" opacity="0.7"/>`).join('')}
        <rect x="58" y="82" width="194" height="56" rx="4" fill="${surface}" stroke="${border}" stroke-width="0.5"/>
        ${[40,65,45,80,55,90,70,85,60,95].map((h, i) => `<rect x="${64+i*17}" y="${121-h*0.38}" width="11" height="${h*0.38}" rx="2" fill="${i===9?primary:ha(primary,0.3)}"/>`).join('')}
      `
      break
    case 'ecommerce':
      inner = `
        <rect width="260" height="146" fill="${bg}"/>
        <rect width="260" height="34" fill="${surface}" stroke="${border}" stroke-width="0.5"/>
        <rect x="10" y="11" width="34" height="12" rx="3" fill="${textD}" opacity="0.7"/>
        <rect x="200" y="9" width="50" height="16" rx="8" fill="${primary}"/>
        <rect width="260" height="40" y="34" fill="url(#eg)"/>
        <defs><linearGradient id="eg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${primary}"/><stop offset="1" stop-color="${accent}"/></linearGradient></defs>
        <rect x="80" y="43" width="100" height="8" rx="3" fill="white" opacity="0.85"/>
        <rect x="100" y="55" width="60" height="5" rx="2" fill="white" opacity="0.55"/>
        ${[0,1,2,3].map((_, i) => `<rect x="${6+i*63}" y="80" width="57" height="58" rx="6" fill="${surface}" stroke="${border}" stroke-width="0.5"/><rect x="${6+i*63}" y="80" width="57" height="30" rx="6" fill="${ha(primary, 0.18)}"/><rect x="${10+i*63}" y="116" width="34" height="5" rx="2" fill="${textD}" opacity="0.5"/><rect x="${10+i*63}" y="125" width="24" height="5" rx="2" fill="${primary}" opacity="0.8"/>`).join('')}
      `
      break
    case 'portfolio':
    case 'content': {
      const p6 = [primary, accent, '#10b981', '#f59e0b', '#ec4899', '#06b6d4']
      inner = `
        <rect width="260" height="146" fill="${bg}"/>
        <rect width="260" height="34" fill="${surface}" stroke="${border}" stroke-width="0.5"/>
        <rect x="10" y="12" width="60" height="10" rx="3" fill="${textD}" opacity="0.6"/>
        <rect x="200" y="10" width="50" height="14" rx="7" fill="${primary}"/>
        ${[0,1,2].map((col, i) => [0,1].map((_, j) => `<rect x="${6+col*84}" y="${40+j*51}" width="78" height="44" rx="6" fill="${p6[(i*2+j)%6]}" opacity="${isDark?0.55:0.7}"/>`).join('')).flat().join('')}
      `
      break
    }
    case 'blog':
      inner = `
        <rect width="260" height="146" fill="${bg}"/>
        <rect width="260" height="34" fill="${surface}" stroke="${border}" stroke-width="0.5"/>
        <rect x="10" y="11" width="34" height="12" rx="3" fill="${primary}" opacity="0.85"/>
        <rect x="200" y="9" width="50" height="16" rx="8" fill="${primary}"/>
        <rect width="260" height="44" y="34" fill="${ha(primary, 0.85)}"/>
        <rect x="10" y="43" width="130" height="10" rx="3" fill="white" opacity="0.9"/>
        <rect x="10" y="57" width="90" height="6" rx="2" fill="white" opacity="0.55"/>
        ${[0,1,2].map((_, i) => `<rect x="10" y="${86+i*19}" width="170" height="7" rx="3" fill="${textD}" opacity="0.5"/><rect x="10" y="${95+i*19}" width="80" height="4" rx="2" fill="${textL}" opacity="0.4"/><rect x="196" y="${84+i*19}" width="54" height="22" rx="4" fill="${ha(primary, 0.2)}"/>`).join('')}
      `
      break
    default:
      inner = `
        <rect width="260" height="146" fill="${bg}"/>
        <rect width="260" height="34" fill="${primary}"/>
        <rect x="10" y="11" width="36" height="12" rx="3" fill="white" opacity="0.9"/>
        <rect x="180" y="9" width="70" height="16" rx="8" fill="white" opacity="0.2"/>
        <rect x="10" y="46" width="10" height="10" rx="5" fill="${accent}" opacity="0.6"/>
        <rect x="26" y="49" width="44" height="5" rx="2" fill="${accent}" opacity="0.55"/>
        <rect x="10" y="62" width="108" height="14" rx="4" fill="${textD}" opacity="0.75"/>
        <rect x="10" y="80" width="90" height="5" rx="2" fill="${textL}" opacity="0.5"/>
        <rect x="10" y="88" width="70" height="5" rx="2" fill="${textL}" opacity="0.35"/>
        <rect x="10" y="104" width="62" height="20" rx="10" fill="${primary}"/>
        <rect x="80" y="104" width="62" height="20" rx="10" fill="transparent" stroke="${border}" stroke-width="1"/>
        <rect x="142" y="40" width="110" height="100" rx="8" fill="${ha(primary, 0.08)}" stroke="${border}" stroke-width="0.5"/>
        ${[0,1,2].map((_, i) => `<rect x="${148+i*32}" y="52" width="24" height="22" rx="4" fill="${[primary,accent,'#10b981'][i]}" opacity="0.75"/>`).join('')}
        ${[85,60,90,50].map((w, i) => `<rect x="148" y="${82+i*12}" width="${w*0.6}" height="5" rx="2" fill="${border}"/><rect x="148" y="${82+i*12}" width="${w*0.28}" height="5" rx="2" fill="${primary}" opacity="0.45"/>`).join('')}
      `
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="146" viewBox="0 0 260 146">${inner}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// ── 分類顏色 ──────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  saas: '#6366f1',
  landing: '#0ea5e9',
  ecommerce: '#10b981',
  content: '#f59e0b',
  portfolio: '#ec4899',
  dashboard: '#8b5cf6',
  blog: '#14b8a6',
  event: '#f97316',
  tool: '#64748b',
}

const CATEGORY_ORDER: TemplateCategory[] = [
  'landing', 'saas', 'ecommerce', 'blog', 'portfolio', 'event', 'dashboard', 'content', 'tool',
]

// ── Sandpack 動態載入（只給用戶提交模板用） ──────────────────────────────────────

const SandpackPreview = dynamic(
  () => import('@/app/components/uiux/SandpackPreview'),
  { ssr: false, loading: () => <SandpackSkeleton /> }
)

function SandpackSkeleton() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f' }}>
      <div style={{ textAlign: 'center', color: '#666' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #333', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ fontSize: 13 }}>載入預覽中…</div>
      </div>
    </div>
  )
}

interface SandpackData {
  pages: { path: string; content: string; description: string }[]
  components: { path: string; content: string; description: string }[]
  styles: string
  tailwindConfig?: string
}

// ── 靜態初始資料（SSR 安全） ───────────────────────────────────────────────────

const STATIC_CARDS = INITIAL_TEMPLATES.filter(t => t.isActive).map(toTemplateCardData)

// ── 主內容（需 Suspense 包裹） ─────────────────────────────────────────────────

function TemplatesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('templates')
  const [templates, setTemplates] = useState<TemplateCardData[]>(STATIC_CARDS)
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [iframeLoading, setIframeLoading] = useState(false)
  const [sandpackData, setSandpackData] = useState<SandpackData | null>(null)
  const [sandpackLoading, setSandpackLoading] = useState(false)
  const [sandpackError, setSandpackError] = useState<string | null>(null)

  // 載入模板資料
  useEffect(() => {
    getTemplates()
      .then(result => {
        if (result.success && result.data && result.data.length > 0) {
          setTemplates(result.data)
        }
      })
      .catch(() => {/* 靜態資料已 apply */})
  }, [])

  // 讀取 URL ?id= 參數，自動開啟對應 modal
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      setSelectedId(id)
    }
  }, [searchParams])

  // 當選中用戶提交模板時，載入 Sandpack 檔案
  useEffect(() => {
    if (!selectedId) {
      setSandpackData(null)
      setSandpackError(null)
      return
    }
    const card = templates.find(t => t.id === selectedId)
    if (!card?.sourceProjectId) return  // 預設模板不需要 Sandpack

    setSandpackLoading(true)
    setSandpackData(null)
    setSandpackError(null)

    getTemplateFiles(selectedId).then(result => {
      if (result.success && result.data) {
        const files = result.data.files
        setSandpackData({
          pages: files.filter(f => f.fileType === 'page').map(f => ({ path: f.filePath, content: f.content, description: '' })),
          components: files.filter(f => f.fileType === 'component').map(f => ({ path: f.filePath, content: f.content, description: '' })),
          styles: files.filter(f => f.fileType === 'style').map(f => f.content).join('\n'),
          tailwindConfig: files.find(f => f.fileType === 'config')?.content,
        })
      } else {
        setSandpackError(result.error || '載入失敗')
      }
      setSandpackLoading(false)
    }).catch(err => {
      setSandpackError(String(err))
      setSandpackLoading(false)
    })
  }, [selectedId, templates])

  // 關閉 modal
  const closeModal = () => {
    setSelectedId(null)
    setSandpackData(null)
    router.replace('/templates')
  }

  // 有資料的分類（按固定順序）
  const availableCategories = CATEGORY_ORDER.filter(cat =>
    templates.some(t => t.category === cat)
  )

  // 過濾顯示
  const filtered = activeCategory === 'all'
    ? templates
    : templates.filter(t => t.category === activeCategory)

  // 選中的模板資料
  const selectedTemplate = selectedId ? templates.find(t => t.id === selectedId) : null

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Tellcraft', url: 'https://tellcraft.com' },
    { name: t('pageTitle'), url: 'https://tellcraft.com/templates' },
  ])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #fff)', color: 'var(--black, #000)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* 返回鍵 */}
      <div style={{ padding: '20px 24px 0', maxWidth: 1200, margin: '0 auto' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--gray-400, #94a3b8)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--black, #000)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray-400, #94a3b8)')}
        >
          {t('backToHome')}
        </button>
      </div>

      {/* Nav 區塊 */}
      <div style={{
        padding: '32px 24px 40px',
        maxWidth: 1200,
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 11, color: 'var(--gray-400, #94a3b8)',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          marginBottom: 16, fontFamily: 'var(--font-mono, monospace)',
        }}>
          Templates
        </div>
        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700,
          letterSpacing: '-0.02em', margin: 0,
        }}>
          {t('pageTitle')}
        </h1>
        <p style={{
          fontSize: 16, color: 'var(--gray-400, #94a3b8)',
          maxWidth: 520, margin: '16px auto 0', lineHeight: 1.6,
        }}>
          {t('pageDescription')}
        </p>
      </div>

      {/* 分類 Tabs */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px 32px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
      }}>
        {/* All tab */}
        <button
          onClick={() => setActiveCategory('all')}
          style={{
            padding: '6px 16px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 500,
            border: '1px solid',
            cursor: 'pointer',
            transition: 'all 0.15s',
            borderColor: activeCategory === 'all' ? 'var(--black, #000)' : 'var(--border-color, #e2e8f0)',
            background: activeCategory === 'all' ? 'var(--black, #000)' : 'transparent',
            color: activeCategory === 'all' ? 'var(--bg-primary, #fff)' : 'var(--gray-400, #94a3b8)',
          }}
        >
          All
        </button>
        {availableCategories.map(cat => {
          const isActive = activeCategory === cat
          const color = CATEGORY_COLORS[cat] ?? '#64748b'
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 16px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 500,
                border: '1px solid',
                cursor: 'pointer',
                transition: 'all 0.15s',
                borderColor: isActive ? color : 'var(--border-color, #e2e8f0)',
                background: isActive ? `${color}18` : 'transparent',
                color: isActive ? color : 'var(--gray-400, #94a3b8)',
              }}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          )
        })}
      </div>

      {/* 模板 Grid */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px 80px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 24,
      }}>
        {filtered.map(card => (
          <TemplateCard
            key={card.id}
            card={card}
            onClick={() => {
              setIframeLoading(true)
              setSelectedId(card.id)
            }}
          />
        ))}
      </div>

      {/* 預覽 Modal */}
      <AnimatePresence>
        {selectedId && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeModal}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 50,
              }}
            />

            {/* Modal 內容 */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, x: '-50%', y: 'calc(-50% + 16px)' }}
              animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              exit={{ opacity: 0, scale: 0.96, x: '-50%', y: 'calc(-50% + 16px)' }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                position: 'fixed',
                top: '50%', left: '50%',
                width: 'min(96vw, 1280px)',
                height: 'min(92vh, 900px)',
                background: 'var(--bg-primary, #fff)',
                borderRadius: 16,
                overflow: 'hidden',
                zIndex: 51,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
              }}
            >
              {/* Modal 頂欄 */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <div>
                  {selectedTemplate && (
                    <>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{selectedTemplate.name}</span>
                      <span style={{
                        marginLeft: 8,
                        fontSize: 11, fontWeight: 500,
                        textTransform: 'uppercase',
                        padding: '2px 8px', borderRadius: 999,
                        background: `${CATEGORY_COLORS[selectedTemplate.category] ?? '#64748b'}18`,
                        color: CATEGORY_COLORS[selectedTemplate.category] ?? '#64748b',
                      }}>
                        {CATEGORY_LABELS[selectedTemplate.category] ?? selectedTemplate.category}
                      </span>
                      {selectedTemplate.deployedUrl && (
                        <span style={{
                          marginLeft: 6,
                          fontSize: 10, fontWeight: 600,
                          padding: '2px 8px', borderRadius: 999,
                          background: '#8b5cf6', color: '#fff',
                        }}>
                          社群
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button
                    onClick={() => router.push('/')}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      background: 'var(--black, #000)',
                      color: 'var(--bg-primary, #fff)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {t('startUsing')}
                  </button>
                  <button
                    onClick={closeModal}
                    style={{
                      width: 32, height: 32,
                      borderRadius: 8,
                      border: '1px solid var(--border-color, #e2e8f0)',
                      background: 'transparent',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                      color: 'var(--gray-400, #94a3b8)',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 預覽區域 */}
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {selectedTemplate?.sourceProjectId ? (
                  // 用戶提交模板 → Sandpack 渲染
                  sandpackLoading ? (
                    <SandpackSkeleton />
                  ) : sandpackError ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
                        <div style={{ fontSize: 14 }}>無法載入預覽</div>
                        <div style={{ fontSize: 12, marginTop: 4, color: '#cbd5e1' }}>{sandpackError}</div>
                      </div>
                    </div>
                  ) : sandpackData ? (
                    <SandpackPreview
                      pages={sandpackData.pages}
                      components={sandpackData.components}
                      styles={sandpackData.styles}
                      tailwindConfig={sandpackData.tailwindConfig}
                    />
                  ) : null
                ) : (
                  // 預設模板 → iframe 走 preview 路由
                  <>
                    {iframeLoading && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: '#f8fafc', zIndex: 1,
                      }}>
                        <div style={{
                          width: 32, height: 32,
                          border: '3px solid var(--border-color, #e2e8f0)',
                          borderTopColor: 'var(--black, #000)',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                      </div>
                    )}
                    <iframe
                      key={selectedId}
                      src={`/api/template-preview/${selectedId}`}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      onLoad={() => setIframeLoading(false)}
                    />
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── 模板卡片 ──────────────────────────────────────────────────────────────────

function TemplateCard({ card, onClick }: { card: TemplateCardData; onClick: () => void }) {
  const [imgFailed, setImgFailed] = useState(false)
  const badgeColor = CATEGORY_COLORS[card.category] ?? '#64748b'
  const hasRealThumb = !!card.thumbnailUrl && !imgFailed
  const thumbSrc = hasRealThumb ? card.thumbnailUrl : generateThumbnailSvg(card)
  const isUserSubmitted = !!card.deployedUrl

  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      style={{
        borderRadius: 12,
        border: `1px solid ${isUserSubmitted ? '#8b5cf640' : 'var(--border-color, #e2e8f0)'}`,
        overflow: 'hidden',
        background: 'var(--bg-secondary, #f8fafc)',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {/* 用戶提交標記 */}
      {isUserSubmitted && (
        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 1,
          fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
          textTransform: 'uppercase', padding: '2px 7px', borderRadius: 999,
          background: '#8b5cf6', color: '#fff',
        }}>
          社群
        </div>
      )}
      <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbSrc}
          alt={card.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
          onError={() => { if (hasRealThumb) setImgFailed(true) }}
        />
      </div>
      <div style={{
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--black, #000)', marginBottom: 4 }}>
            {card.name}
          </div>
          <div style={{
            fontSize: 12, color: 'var(--gray-400, #94a3b8)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: 200,
          }}>
            {card.description}
          </div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 500, letterSpacing: '0.05em',
          textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999,
          background: `${badgeColor}18`, color: badgeColor, flexShrink: 0,
        }}>
          {card.category}
        </span>
      </div>
    </motion.div>
  )
}

// ── 頁面入口（Suspense 包裹 useSearchParams） ──────────────────────────────────

export default function TemplatesPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 32, height: 32,
          border: '3px solid #e2e8f0',
          borderTopColor: '#000',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    }>
      <TemplatesContent />
    </Suspense>
  )
}
