'use client'

// ============================================================
// BDD 需求藍圖面板
// 即時展示 BDD 釐清的結構化 Q&A 歷史記錄
// 按分類整理，帶入場動畫的需求文件視覺化
// ============================================================

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getBddSession } from '../actions'

// ── Types ──

interface ClarifyItemData {
  id: string
  question: string
  whiteTextQuestion?: string
  category: string
  answer?: string
  status: string
  answeredAt?: string
}

interface BddAnimationPanelProps {
  progress: number
  totalQuestions: number
  round: number
  maxRounds?: number
  isWorking?: boolean
  isComplete?: boolean
  conversationId?: string
}

// ── 色彩方案 ──

const COLORS = {
  bg: '#0D1117',
  card: '#161B22',
  border: '#30363D',
  categoryTitle: '#58A6FF',
  questionText: '#8B949E',
  answerText: '#E6EDF3',
  progressGreen: '#238636',
  progressGreenEnd: '#2EA043',
  highlight: '#FFA657',
  roundLabel: '#F0883E',
  aiWorking: '#BC8CFF',
  headerText: '#E6EDF3',
  subText: '#484F58',
  completeBorder: '#2EA043',
} as const

// ── 分類標籤映射 ──

const CATEGORY_LABELS: Record<string, string> = {
  data: '資料模型',
  feature: '功能需求',
  terminology: '術語定義',
  architecture: '技術架構',
  design: '設計偏好',
  business: '業務邏輯',
  integration: '外部整合',
  security: '安全需求',
  performance: '效能需求',
}

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category
}

// ── 自訂 Hook：取得 BDD Session 資料 ──

function useBddSessionData(conversationId: string | undefined, progress: number) {
  const [items, setItems] = useState<ClarifyItemData[]>([])
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)
  const prevItemCountRef = useRef(0)

  const fetchData = useCallback(async () => {
    if (!conversationId || fetchingRef.current) return
    fetchingRef.current = true

    try {
      const result = await getBddSession({ conversationId })
      if (result.success && result.data) {
        const session = result.data as {
          resolvedItems?: ClarifyItemData[]
          stagingItems?: ClarifyItemData[]
        }
        const resolved = session.resolvedItems || []
        const staging = session.stagingItems || []
        const allItems = [...resolved, ...staging]
        setItems(allItems)
        setError(null)
      }
    } catch (err) {
      console.error('[BddPanel] Failed to fetch BDD session:', err)
      setError('無法載入需求資料')
    } finally {
      fetchingRef.current = false
    }
  }, [conversationId])

  // progress 變化時 refetch
  useEffect(() => {
    fetchData()
  }, [fetchData, progress])

  // 偵測新增條目
  const hasNewItems = items.length > prevItemCountRef.current
  useEffect(() => {
    prevItemCountRef.current = items.length
  }, [items.length])

  return { items, error, hasNewItems }
}

// ── 分類分組 ──

function groupByCategory(items: ClarifyItemData[]): Map<string, ClarifyItemData[]> {
  const groups = new Map<string, ClarifyItemData[]>()
  for (const item of items) {
    const cat = item.category || 'other'
    if (!groups.has(cat)) {
      groups.set(cat, [])
    }
    groups.get(cat)!.push(item)
  }
  return groups
}

// ── QAEntry 元件 ──

function QAEntry({ item, isLatest }: { item: ClarifyItemData; isLatest: boolean }) {
  const question = item.whiteTextQuestion || item.question

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        padding: '8px 12px',
        borderLeft: `2px solid ${isLatest ? COLORS.highlight : 'transparent'}`,
        marginBottom: 4,
        transition: 'border-color 1s ease-out',
      }}
    >
      <div style={{
        fontSize: 12,
        color: COLORS.questionText,
        lineHeight: 1.5,
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
      }}>
        Q: {question}
      </div>
      {item.answer && (
        <div style={{
          fontSize: 13,
          color: COLORS.answerText,
          lineHeight: 1.5,
          marginTop: 2,
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
        }}>
          → {item.answer}
        </div>
      )}
    </motion.div>
  )
}

// ── CategorySection 元件 ──

function CategorySection({
  category,
  items,
  isLatestCategory,
  lastItemId,
}: {
  category: string
  items: ClarifyItemData[]
  isLatestCategory: boolean
  lastItemId: string | null
}) {
  const [collapsed, setCollapsed] = useState(false)
  const answeredCount = items.filter(i => i.answer).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        marginBottom: 12,
        border: `1px solid ${isLatestCategory ? COLORS.categoryTitle + '40' : COLORS.border}`,
        borderRadius: 8,
        overflow: 'hidden',
        background: COLORS.card,
        boxShadow: isLatestCategory ? `0 0 12px ${COLORS.categoryTitle}15` : 'none',
        transition: 'border-color 1s ease-out, box-shadow 1s ease-out',
      }}
    >
      {/* 分類標題 */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          cursor: 'pointer',
          userSelect: 'none',
          borderBottom: collapsed ? 'none' : `1px solid ${COLORS.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            color: COLORS.subText,
            fontSize: 10,
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            display: 'inline-block',
          }}>
            ▼
          </span>
          <span style={{
            color: COLORS.categoryTitle,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
          }}>
            {getCategoryLabel(category)}
          </span>
        </div>
        <span style={{
          fontSize: 11,
          color: COLORS.subText,
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
        }}>
          {answeredCount} 題
        </span>
      </div>

      {/* Q&A 列表 */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '4px 0' }}>
              {items.map(item => (
                <QAEntry
                  key={item.id}
                  item={item}
                  isLatest={item.id === lastItemId}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main Component ──

export default function BddAnimationPanel({
  progress,
  totalQuestions,
  round,
  maxRounds = 6,
  isWorking,
  isComplete,
  conversationId,
}: BddAnimationPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { items, error } = useBddSessionData(conversationId, progress)

  // 分組
  const grouped = useMemo(() => groupByCategory(items), [items])
  const categoryKeys = useMemo(() => Array.from(grouped.keys()), [grouped])

  // 最新條目 ID + 最新分類
  const lastItemId = items.length > 0 ? items[items.length - 1].id : null
  const lastCategory = items.length > 0 ? (items[items.length - 1].category || 'other') : null

  // 進度
  const percent = totalQuestions > 0 ? Math.round((progress / totalQuestions) * 100) : 0

  // 自動捲動到底部
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [items.length])

  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: COLORS.bg,
      color: COLORS.headerText,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: `1px solid ${COLORS.border}`,
        flexShrink: 0,
      }}>
        {/* 標題行 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isComplete ? COLORS.completeBorder : COLORS.categoryTitle,
              display: 'inline-block',
              boxShadow: isComplete ? `0 0 6px ${COLORS.completeBorder}` : 'none',
            }} />
            <span style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 0.5,
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            }}>
              需求藍圖
            </span>
          </div>
          <span style={{
            fontSize: 12,
            color: COLORS.roundLabel,
            fontWeight: 600,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
          }}>
            R{round}/{maxRounds}
          </span>
        </div>

        {/* 進度條 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            flex: 1,
            height: 4,
            background: COLORS.border,
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percent, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                height: '100%',
                borderRadius: 2,
                background: isComplete
                  ? COLORS.completeBorder
                  : `linear-gradient(90deg, ${COLORS.progressGreen}, ${COLORS.progressGreenEnd})`,
                boxShadow: isComplete ? `0 0 8px ${COLORS.completeBorder}60` : 'none',
              }}
            />
          </div>
          <span style={{
            fontSize: 11,
            color: COLORS.subText,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            whiteSpace: 'nowrap',
          }}>
            {progress}/{totalQuestions}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 12px 4px',
          scrollbarWidth: 'thin',
          scrollbarColor: `${COLORS.border} transparent`,
        }}
      >
        {/* 錯誤提示 */}
        {error && (
          <div style={{
            padding: '8px 12px',
            marginBottom: 12,
            borderRadius: 6,
            background: '#3d1f1f',
            border: '1px solid #6e3630',
            fontSize: 12,
            color: '#f59e9e',
          }}>
            {error}
          </div>
        )}

        {/* 空狀態 */}
        {items.length === 0 && !error && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60%',
            gap: 12,
            color: COLORS.subText,
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: `2px dashed ${COLORS.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}>
              ◇
            </div>
            <span style={{
              fontSize: 13,
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            }}>
              等待需求釐清開始...
            </span>
          </div>
        )}

        {/* 分類區塊 */}
        <AnimatePresence>
          {categoryKeys.map(cat => (
            <CategorySection
              key={cat}
              category={cat}
              items={grouped.get(cat)!}
              isLatestCategory={cat === lastCategory}
              lastItemId={lastItemId}
            />
          ))}
        </AnimatePresence>

        {/* 滾動錨點 */}
        <div ref={bottomRef} />
      </div>

      {/* ── Footer 狀態指示器 ── */}
      <div style={{
        padding: '8px 16px',
        borderTop: `1px solid ${COLORS.border}`,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 32,
      }}>
        {isWorking && (
          <>
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: COLORS.aiWorking,
                display: 'inline-block',
                boxShadow: `0 0 6px ${COLORS.aiWorking}80`,
              }}
            />
            <span style={{
              fontSize: 12,
              color: COLORS.aiWorking,
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            }}>
              AI 正在分析中...
            </span>
          </>
        )}

        {isComplete && !isWorking && (
          <>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: COLORS.completeBorder,
              display: 'inline-block',
              boxShadow: `0 0 6px ${COLORS.completeBorder}80`,
            }} />
            <span style={{
              fontSize: 12,
              color: COLORS.completeBorder,
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            }}>
              需求釐清完成
            </span>
          </>
        )}

        {!isWorking && !isComplete && items.length > 0 && (
          <span style={{
            fontSize: 11,
            color: COLORS.subText,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
          }}>
            已收集 {items.filter(i => i.answer).length} 項需求
          </span>
        )}
      </div>

      {/* ── 完成慶祝效果 ── */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              border: `2px solid ${COLORS.completeBorder}`,
              borderRadius: 0,
              boxShadow: `inset 0 0 20px ${COLORS.completeBorder}15`,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
