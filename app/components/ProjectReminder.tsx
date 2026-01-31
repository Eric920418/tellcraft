'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getProjectReminder } from '../actions'

// Apple 風格緩動
const smoothEasing: [number, number, number, number] = [0.32, 0.72, 0, 1]

interface ProjectReminderProps {
  anonymousId?: string
  onContinue?: (conversationId: string) => void
  onDismiss?: () => void
}

interface Reminder {
  type: 'in_progress' | 'completed' | 'failed'
  projectId: string
  projectName: string
  conversationId?: string
  message: string
  url?: string
  updatedAt: string
}

export default function ProjectReminder({ anonymousId, onContinue, onDismiss }: ProjectReminderProps) {
  const [reminder, setReminder] = useState<Reminder | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const dismissedKey = 'project_reminder_dismissed'
    const dismissed = sessionStorage.getItem(dismissedKey)
    if (dismissed) {
      setIsDismissed(true)
      return
    }

    const loadReminder = async () => {
      const result = await getProjectReminder({ anonymousId })
      if (result.success && result.data?.hasReminder && result.data.reminder) {
        setReminder(result.data.reminder)
        setTimeout(() => setIsVisible(true), 800)
      }
    }
    loadReminder()
  }, [anonymousId])

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsVisible(false)
    sessionStorage.setItem('project_reminder_dismissed', 'true')
    setTimeout(() => {
      setIsDismissed(true)
      onDismiss?.()
    }, 400)
  }

  const handleAction = () => {
    if (!reminder) return

    if (reminder.type === 'in_progress' && reminder.conversationId) {
      onContinue?.(reminder.conversationId)
    } else if (reminder.type === 'completed' && reminder.url) {
      window.open(reminder.url, '_blank')
    } else {
      window.location.href = `/dashboard/projects/${reminder.projectId}`
    }
  }

  if (isDismissed || !reminder) return null

  // 根據類型設定內容
  const content = {
    in_progress: {
      label: '進行中',
      action: '繼續',
      icon: (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ width: 16, height: 16 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </motion.div>
      )
    },
    completed: {
      label: '已上線',
      action: '查看',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20,6 9,17 4,12" />
        </svg>
      )
    },
    failed: {
      label: '需處理',
      action: '查看',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )
    }
  }

  const { label, action, icon } = content[reminder.type]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.5, ease: smoothEasing }}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1001,
          }}
        >
          <motion.div
            onClick={handleAction}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            animate={{
              scale: isHovered ? 1.02 : 1,
              boxShadow: isHovered
                ? '0 8px 32px rgba(0, 0, 0, 0.12)'
                : '0 4px 20px rgba(0, 0, 0, 0.08)',
            }}
            transition={{ duration: 0.2, ease: smoothEasing }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '14px 20px',
              background: 'var(--white)',
              border: '1px solid var(--border-color)',
              borderRadius: 16,
              cursor: 'pointer',
              minWidth: 320,
            }}
          >
            {/* 左側圖示 */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--gray-50)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gray-600)',
                flexShrink: 0,
              }}
            >
              {icon}
            </div>

            {/* 內容 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--black)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {reminder.projectName}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--gray-400)',
                    padding: '2px 6px',
                    background: 'var(--gray-50)',
                    borderRadius: 4,
                    flexShrink: 0,
                  }}
                >
                  {label}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--gray-500)',
                }}
              >
                點擊{action}你的專案
              </div>
            </div>

            {/* 右側箭頭 */}
            <motion.div
              animate={{ x: isHovered ? 3 : 0 }}
              transition={{ duration: 0.2, ease: smoothEasing }}
              style={{
                color: 'var(--gray-400)',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </motion.div>

            {/* 關閉按鈕 */}
            <motion.button
              onClick={handleDismiss}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'var(--white)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gray-400)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
