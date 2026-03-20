'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from '@/i18n/navigation'
import { getTemplates } from '@/app/actions/templates'
import { INITIAL_TEMPLATES, toTemplateCardData, type TemplateCardData } from '@/app/lib/templates'

// CSS 放在組件外，避免每次 render 重新注入
const MARQUEE_STYLES = `
  @keyframes tc-scroll-left {
    0%   { transform: translateX(0) }
    100% { transform: translateX(-50%) }
  }
  @keyframes tc-scroll-right {
    0%   { transform: translateX(-50%) }
    100% { transform: translateX(0) }
  }
  .tc-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .tc-card:hover {
    transform: scale(1.03);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
`

// ── 前端即時 SVG 縮圖生成（無 DB 縮圖時使用）────────────────────────────────────

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
    default: // landing, event
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

// 靜態初始資料（同步，避免 SSR hydration mismatch）
const STATIC_CARDS = INITIAL_TEMPLATES.filter(t => t.isActive).map(toTemplateCardData)

// 模組層級 SVG 快取，避免每次 render 重算
const svgCache = new Map<string, string>()
function getCachedSvg(card: TemplateCardData): string {
  if (!svgCache.has(card.id)) svgCache.set(card.id, generateThumbnailSvg(card))
  return svgCache.get(card.id)!
}

function padToMin(arr: TemplateCardData[], min: number): TemplateCardData[] {
  if (arr.length === 0) return arr
  let out = [...arr]
  while (out.length < min) out = [...out, ...arr]
  return out
}

function splitRows(cards: TemplateCardData[]): [TemplateCardData[], TemplateCardData[]] {
  const padded = padToMin(cards, 8)
  const take = padded.slice(0, 16)
  const half = Math.ceil(take.length / 2)
  return [take.slice(0, half), take.slice(half)]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 初始（deterministic，SSR 安全）
const [INIT_ROW1, INIT_ROW2] = splitRows(STATIC_CARDS)

const CATEGORY_COLORS: Record<string, string> = {
  saas: '#6366f1', landing: '#0ea5e9', ecommerce: '#10b981',
  content: '#f59e0b', portfolio: '#ec4899', dashboard: '#8b5cf6',
  blog: '#14b8a6', event: '#f97316', tool: '#64748b',
}

function TemplateCard({ card }: { card: TemplateCardData }) {
  const router = useRouter()
  const [imgFailed, setImgFailed] = useState(false)
  const badgeColor = CATEGORY_COLORS[card.category] ?? '#64748b'
  const hasRealThumb = !!card.thumbnailUrl && !imgFailed
  // 無真實縮圖時，用快取的 SVG 縮圖（不重算）
  const thumbSrc = hasRealThumb ? card.thumbnailUrl : getCachedSvg(card)

  return (
    // 用 CSS :hover 代替 JS whileHover，消除每張卡片的 JS 事件監聽器
    <div
      className="tc-card"
      onClick={() => router.push(`/templates?id=${card.id}`)}
      style={{
        width: 420,
        flexShrink: 0,
        borderRadius: 12,
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        background: 'var(--bg-secondary)',
        cursor: 'pointer',
      }}
    >
      <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbSrc}
          alt={card.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
          onError={() => {
            if (hasRealThumb) setImgFailed(true)
          }}
        />
      </div>

      <div style={{
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <span style={{
          fontSize: 13, fontWeight: 500, color: 'var(--black)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {card.name}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 500, letterSpacing: '0.05em',
          textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999,
          background: `${badgeColor}18`, color: badgeColor, flexShrink: 0,
        }}>
          {card.category}
        </span>
      </div>
    </div>
  )
}

function MarqueeRow({ cards, direction, duration = 35 }: {
  cards: TemplateCardData[]
  direction: 'left' | 'right'
  duration?: number
}) {
  const [paused, setPaused] = useState(false)
  const animName = direction === 'left' ? 'tc-scroll-left' : 'tc-scroll-right'

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ overflow: 'hidden', width: '100%' }}
    >
      <div style={{
        display: 'flex', gap: 24, width: 'max-content',
        animation: `${animName} ${duration}s linear infinite`,
        animationPlayState: paused ? 'paused' : 'running',
        // 告訴瀏覽器此元素會使用 transform，提升為獨立 GPU 合成層
        willChange: 'transform',
      }}>
        {[...cards, ...cards].map((card, i) => (
          <TemplateCard key={`${card.id}-${i}`} card={card} />
        ))}
      </div>
    </div>
  )
}

export default function TemplatesShowcaseSection() {
  // 初始值用 deterministic 靜態資料（SSR 安全），useEffect 後換成 shuffled
  const [row1, setRow1] = useState<TemplateCardData[]>(INIT_ROW1)
  const [row2, setRow2] = useState<TemplateCardData[]>(INIT_ROW2)

  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })

  // Hydration 後：shuffle 靜態資料，再嘗試取得 API 資料
  useEffect(() => {
    const applyData = (cards: TemplateCardData[]) => {
      const [r1, r2] = splitRows(shuffle(cards))
      setRow1(r1)
      setRow2(r2)
    }

    // 先 shuffle 靜態資料讓每次 mount 不同
    applyData(STATIC_CARDS)

    // 嘗試從 API 更新（更多資料）
    getTemplates()
      .then(result => {
        if (result.success && result.data && result.data.length > 0) {
          applyData(result.data)
        }
      })
      .catch(() => {/* 靜態資料已 apply，忽略錯誤 */})
  }, [])

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: isInView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  })

  if (row1.length === 0) return null

  return (
    <section ref={sectionRef} style={{ padding: '80px 0', overflow: 'hidden' }}>
      <style>{MARQUEE_STYLES}</style>

      <div style={{ padding: '0 24px', textAlign: 'center', marginBottom: 48 }}>
        <motion.div {...fadeUp(0)} style={{
          fontSize: 11, color: 'var(--accent)',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          marginBottom: 16, fontFamily: 'var(--font-mono)',
        }}>
          Templates
        </motion.div>

        <motion.h2 {...fadeUp(0.15)} style={{
          fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 700,
          letterSpacing: '-0.02em', color: 'var(--black)', margin: 0,
        }}>
          從模板開始，快速落地
        </motion.h2>

        <motion.p {...fadeUp(0.25)} style={{
          fontSize: 15, color: 'var(--gray-400)',
          maxWidth: 480, margin: '12px auto 0', lineHeight: 1.6,
        }}>
          精選設計模板，一句話描述需求即可套用並完整客製化
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.35 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <MarqueeRow cards={row1} direction="left" duration={45} />
        <MarqueeRow cards={row2} direction="right" duration={55} />
      </motion.div>

      <motion.div {...fadeUp(0.5)} style={{ textAlign: 'center', marginTop: 40 }}>
        <Link
          href="/templates"
          style={{
            fontSize: 14, color: 'var(--gray-400)',
            textDecoration: 'none', borderBottom: '1px solid var(--border-color)',
            paddingBottom: 2, transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray-400)')}
        >
          瀏覽所有模板 →
        </Link>
      </motion.div>
    </section>
  )
}
