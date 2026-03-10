'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  vercelUrl: string | null
  customDomain: string | null
  conversationCount: number
  latestConversationId: string | null
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface Props {
  project: Project
  messages: Message[] | null
  isLoading: boolean
  anchorRect: DOMRect
  onMouseEnter: () => void
  onMouseLeave: () => void
}

function SkeletonLine({ width = '100%' }: { width?: string }) {
  return (
    <motion.div
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.4, repeat: Infinity }}
      style={{
        height: 12,
        background: 'var(--gray-100)',
        borderRadius: 2,
        width,
      }}
    />
  )
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'var(--gray-300)',
    generating: '#F59E0B',
    testing: '#3B82F6',
    deployed: '#22C55E',
    failed: '#EF4444',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: colors[status] ?? 'var(--gray-300)',
        flexShrink: 0,
      }}
    />
  )
}

const CARD_WIDTH = 320
const CARD_OFFSET = 16

export default function ProjectHoverCard({
  project,
  messages,
  isLoading,
  anchorRect,
  onMouseEnter,
  onMouseLeave,
}: Props) {
  const [pos, setPos] = useState({ left: 0, top: 0 })

  useEffect(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight

    const rightLeft = anchorRect.right + CARD_OFFSET
    const leftLeft = anchorRect.left - CARD_WIDTH - CARD_OFFSET

    let left: number
    if (rightLeft + CARD_WIDTH <= vw - 8) {
      left = rightLeft
    } else if (leftLeft >= 8) {
      left = leftLeft
    } else {
      // 兩側都放不下（全寬表格），釘在 viewport 右側邊緣
      left = vw - CARD_WIDTH - 8
    }

    const estimatedHeight = 300
    let top = anchorRect.top
    if (top + estimatedHeight > vh - 8) {
      top = vh - estimatedHeight - 8
    }
    if (top < 8) top = 8

    setPos({ left, top })
  }, [anchorRect])

  const url = project.customDomain || project.vercelUrl
  const displayMessages = messages
    ? messages.filter((m) => m.role !== ('system' as string)).slice(-4)
    : []

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.15 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        width: CARD_WIDTH,
        background: 'var(--white)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        zIndex: 9999,
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <StatusDot status={project.status} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--black)',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {project.name}
          </span>
        </div>

        {project.description && (
          <p
            style={{
              fontSize: 12,
              color: 'var(--gray-500)',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              margin: 0,
            }}
          >
            {project.description}
          </p>
        )}

        {url && (
          <a
            href={url.startsWith('http') ? url : `https://${url}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 8,
              fontSize: 11,
              color: 'var(--gray-400)',
              textDecoration: 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <span>🌐</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {url.replace('https://', '')}
            </span>
          </a>
        )}
      </div>

      {/* Messages */}
      <div style={{ padding: '12px 16px' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--gray-400)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 10,
          }}
        >
          最近對話
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SkeletonLine width="85%" />
            <SkeletonLine width="70%" />
            <SkeletonLine width="90%" />
          </div>
        ) : displayMessages.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--gray-300)', margin: 0 }}>尚無對話記錄</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: msg.role === 'user' ? 'var(--black)' : 'var(--gray-400)',
                    whiteSpace: 'nowrap',
                    marginTop: 2,
                  }}
                >
                  {msg.role === 'user' ? '你' : 'AI'}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: msg.role === 'user' ? 'var(--gray-700)' : 'var(--gray-500)',
                    lineHeight: 1.5,
                    textAlign: msg.role === 'user' ? 'right' : 'left',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2,
                  }}
                >
                  {msg.content.length > 80 ? msg.content.slice(0, 80) + '...' : msg.content}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
