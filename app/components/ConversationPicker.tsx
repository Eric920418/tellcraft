'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface Conversation {
  id: string
  projectId: string
  projectName: string
  lastMessage?: string
  messageCount: number
  updatedAt: string
  createdAt: string
}

interface ConversationPickerProps {
  conversations: Conversation[]
  onSelectConversation: (conversationId: string) => void
  onStartNewConversation: () => void
  isLoading?: boolean
}

function formatRelativeTime(dateString: string, t: (key: string, values?: Record<string, string | number | Date>) => string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return t('timeJustNow')
  if (diffMins < 60) return t('timeMinutesAgo', { count: diffMins })
  if (diffHours < 24) return t('timeHoursAgo', { count: diffHours })
  if (diffDays < 7) return t('timeDaysAgo', { count: diffDays })
  return date.toLocaleDateString()
}

export default function ConversationPicker({
  conversations,
  onSelectConversation,
  onStartNewConversation,
  isLoading = false,
}: ConversationPickerProps) {
  const t = useTranslations('conversationPicker')
  const tc = useTranslations('common')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        color: 'var(--gray-500)',
      }}>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ fontSize: 14 }}
        >
          {tc('loading')}
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        maxWidth: 560,
        margin: '0 auto',
        padding: '40px 24px',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{
          fontSize: 24,
          fontWeight: 500,
          letterSpacing: '-0.02em',
          marginBottom: 12,
        }}>
          {t('welcomeBack')}
        </h2>
        <p style={{
          fontSize: 15,
          color: 'var(--gray-500)',
          lineHeight: 1.6,
        }}>
          {t('welcomeBackSubtitle')}
        </p>
      </div>

      {/* New Conversation Button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onStartNewConversation}
        style={{
          width: '100%',
          padding: '20px 24px',
          marginBottom: 24,
          background: 'var(--black)',
          color: 'var(--white)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          fontSize: 15,
          fontWeight: 500,
        }}
      >
        <span style={{ fontSize: 20 }}>+</span>
        {t('newConversation')}
      </motion.button>

      {/* Divider */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
      }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
        <span style={{ fontSize: 12, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {t('orContinuePrevious')}
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
      </div>

      {/* Conversation List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence>
          {conversations.map((conv, index) => (
            <motion.button
              key={conv.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onMouseEnter={() => setHoveredId(conv.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectConversation(conv.id)}
              style={{
                width: '100%',
                padding: '16px 20px',
                background: hoveredId === conv.id ? 'var(--gray-50)' : 'var(--white)',
                border: '1px solid',
                borderColor: hoveredId === conv.id ? 'var(--black)' : 'var(--border-color)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 8,
              }}>
                <span style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--black)',
                }}>
                  {conv.projectName}
                </span>
                <span style={{
                  fontSize: 12,
                  color: 'var(--gray-400)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {formatRelativeTime(conv.updatedAt, t)}
                </span>
              </div>

              {conv.lastMessage && (
                <p style={{
                  fontSize: 13,
                  color: 'var(--gray-500)',
                  lineHeight: 1.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: 8,
                }}>
                  {conv.lastMessage}
                </p>
              )}

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <span style={{
                  fontSize: 11,
                  color: 'var(--gray-400)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <span style={{ opacity: 0.7 }}>💬</span>
                  {t('messagesCount', { count: conv.messageCount })}
                </span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {conversations.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--gray-500)',
        }}>
          <p style={{ fontSize: 14 }}>{t('noHistory')}</p>
        </div>
      )}
    </motion.div>
  )
}
