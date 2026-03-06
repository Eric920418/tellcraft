'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useRouter } from '@/i18n/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { getAdminLogs, type ParsedLogLine } from '@/app/lib/vps-api'
import { useAdminLogs } from '@/app/hooks/useAdminLogs'

// Tag 顏色映射
const TAG_COLORS: Record<string, string> = {
  '[Deployer]': '#3B82F6',
  '[Orchestrator]': '#8B5CF6',
  '[Socket]': '#10B981',
  '[Redis]': '#EF4444',
  '[DB]': '#F59E0B',
  '[Dashboard]': '#6366F1',
  '[LineBot]': '#06B6D4',
  '[LINE Bot]': '#06B6D4',
  '[Auth]': '#EC4899',
  '[Server]': '#14B8A6',
  '[Error]': '#DC2626',
  '[FlowState Recovery]': '#A855F7',
  '[StreamingPreview]': '#F97316',
  '[Admin Logs]': '#64748B',
  '[VPS API]': '#0EA5E9',
}

const LEVEL_STYLES: Record<string, { color: string; border: string; bg: string }> = {
  info: { color: '#D1D5DB', border: 'transparent', bg: 'transparent' },
  warn: { color: '#FBBF24', border: '#F59E0B', bg: 'rgba(245, 158, 11, 0.06)' },
  error: { color: '#F87171', border: '#DC2626', bg: 'rgba(220, 38, 38, 0.06)' },
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

export default function AdminLogsPage() {
  const router = useRouter()
  const t = useTranslations('dashboard.logs')
  const tc = useTranslations('common')

  const [initialLines, setInitialLines] = useState<ParsedLogLine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [source, setSource] = useState<'all' | 'out' | 'error'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)

  const { lines: streamLines, isConnected, isPaused, pause, resume, clear } = useAdminLogs({
    enabled: true,
    source,
  })

  // 合併初始載入 + 即時串流
  const allLines = useMemo(() => [...initialLines, ...streamLines], [initialLines, streamLines])

  // 搜尋過濾
  const filteredLines = useMemo(() => {
    if (!searchQuery) return allLines
    const q = searchQuery.toLowerCase()
    return allLines.filter(l =>
      l.message.toLowerCase().includes(q) ||
      (l.tag?.toLowerCase().includes(q) ?? false) ||
      l.timestamp.includes(q)
    )
  }, [allLines, searchQuery])

  // 自動捲動
  const logContainerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [filteredLines, autoScroll])

  // 初始載入
  useEffect(() => {
    async function loadInitial() {
      const token = getAuthToken()
      if (!token) {
        router.push('/auth/login')
        return
      }

      setIsLoading(true)
      const result = await getAdminLogs({ token, lines: 200, source })

      if (!result.success) {
        setIsLoading(false)
        return
      }

      setInitialLines(result.data?.lines || [])
      setIsLoading(false)
    }
    loadInitial()
  }, [source, router])

  // 偵測捲動位置
  const handleScroll = useCallback(() => {
    if (!logContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current
    const atBottom = scrollHeight - scrollTop - clientHeight < 50
    setAutoScroll(atBottom)
  }, [])

  // 切換 source 時重置
  const handleSourceChange = useCallback((s: 'all' | 'out' | 'error') => {
    setSource(s)
    setInitialLines([])
    clear()
  }, [clear])

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 8 }}>
              {t('title')}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {t('subtitle')}
              <span style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isConnected ? '#10B981' : '#EF4444',
                boxShadow: isConnected ? '0 0 6px rgba(16, 185, 129, 0.5)' : 'none',
              }} />
              <span style={{ fontSize: 12, color: isConnected ? '#10B981' : '#EF4444' }}>
                {isConnected ? t('connected') : t('disconnected')}
              </span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* 工具列 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}
      >
        {/* Source 切換 */}
        {(['all', 'out', 'error'] as const).map(s => (
          <button
            key={s}
            onClick={() => handleSourceChange(s)}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              cursor: 'pointer',
              borderRadius: 6,
              background: source === s ? 'var(--black)' : 'var(--white)',
              color: source === s ? 'var(--white)' : 'var(--gray-600)',
              border: '1px solid',
              borderColor: source === s ? 'var(--black)' : 'var(--border-color)',
              transition: 'all 0.15s ease',
            }}
          >
            {s === 'all' ? t('sourceAll') : s === 'out' ? t('sourceOut') : t('sourceError')}
          </button>
        ))}

        <div style={{ width: 1, height: 24, background: 'var(--border-color)', margin: '0 4px' }} />

        {/* 搜尋 */}
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          style={{
            padding: '6px 12px',
            fontSize: 13,
            width: 240,
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            background: 'var(--white)',
            outline: 'none',
            color: 'var(--black)',
          }}
        />

        <div style={{ flex: 1 }} />

        {/* 暫停/繼續 */}
        <button
          onClick={isPaused ? resume : pause}
          style={{
            padding: '6px 14px',
            fontSize: 13,
            cursor: 'pointer',
            borderRadius: 6,
            background: isPaused ? '#FEF3C7' : 'var(--white)',
            border: '1px solid',
            borderColor: isPaused ? '#F59E0B' : 'var(--border-color)',
            color: isPaused ? '#92400E' : 'var(--gray-600)',
            transition: 'all 0.15s ease',
          }}
        >
          {isPaused ? t('resume') : t('pause')}
        </button>

        {/* 清空 */}
        <button
          onClick={() => { setInitialLines([]); clear() }}
          style={{
            padding: '6px 14px',
            fontSize: 13,
            cursor: 'pointer',
            borderRadius: 6,
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
            color: 'var(--gray-600)',
            transition: 'all 0.15s ease',
          }}
        >
          {t('clear')}
        </button>

        <span style={{ fontSize: 12, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
          {filteredLines.length} {t('linesCount')}
        </span>
      </motion.div>

      {/* 日誌終端機 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div
          ref={logContainerRef}
          onScroll={handleScroll}
          style={{
            background: '#0D1117',
            border: '1px solid #30363D',
            borderRadius: 8,
            height: 'calc(100vh - 280px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", "Consolas", monospace',
            fontSize: 12.5,
            lineHeight: 1.8,
            padding: '8px 0',
          }}
        >
          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>{tc('loading')}</div>
          ) : filteredLines.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>{t('noLogs')}</div>
          ) : (
            filteredLines.map(line => (
              <LogLine key={line.id} line={line} searchQuery={searchQuery} />
            ))
          )}
        </div>

        {/* 暫停提示 */}
        {isPaused && (
          <div style={{
            marginTop: 8,
            padding: '6px 12px',
            background: '#FEF3C7',
            border: '1px solid #F59E0B',
            borderRadius: 6,
            fontSize: 12,
            color: '#92400E',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span>||</span>
            {t('pausedHint')}
          </div>
        )}

        {/* 回到底部按鈕 */}
        <AnimatePresence>
          {!autoScroll && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={() => {
                setAutoScroll(true)
                logContainerRef.current?.scrollTo({ top: logContainerRef.current.scrollHeight, behavior: 'smooth' })
              }}
              style={{
                position: 'fixed',
                bottom: 32,
                right: 32,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                background: 'var(--black)',
                color: 'var(--white)',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              {t('scrollToBottom')}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// 單行日誌元件
function LogLine({ line, searchQuery }: { line: ParsedLogLine; searchQuery: string }) {
  const tagColor = line.tag ? TAG_COLORS[line.tag] || '#8B949E' : null
  const style = LEVEL_STYLES[line.level]

  return (
    <div
      style={{
        padding: '1px 16px',
        display: 'flex',
        gap: 12,
        borderLeft: `3px solid ${style.border}`,
        background: style.bg,
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = style.bg }}
    >
      {/* 時間戳 */}
      {line.timestamp && (
        <span style={{ color: '#484F58', whiteSpace: 'nowrap', userSelect: 'all', flexShrink: 0 }}>
          {line.timestamp}
        </span>
      )}

      {/* Tag */}
      {line.tag && (
        <span style={{
          color: tagColor || '#8B949E',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          flexShrink: 0,
          minWidth: 100,
        }}>
          {line.tag}
        </span>
      )}

      {/* 訊息 */}
      <span style={{ color: style.color, wordBreak: 'break-all', flex: 1 }}>
        {searchQuery ? highlightText(line.message, searchQuery) : line.message}
      </span>
    </div>
  )
}

// 搜尋高亮
function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background: '#FBBF24', color: '#0D1117', padding: '0 2px', borderRadius: 2 }}>{part}</mark>
      : part
  )
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
