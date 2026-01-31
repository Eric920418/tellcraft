'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getProjectReminder } from '../actions'

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

  useEffect(() => {
    // 檢查是否已經被關閉過（使用 sessionStorage，關閉瀏覽器後重置）
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
        // 延遲顯示，讓頁面先載入完成
        setTimeout(() => setIsVisible(true), 500)
      }
    }
    loadReminder()
  }, [anonymousId])

  const handleDismiss = () => {
    setIsVisible(false)
    sessionStorage.setItem('project_reminder_dismissed', 'true')
    setTimeout(() => {
      setIsDismissed(true)
      onDismiss?.()
    }, 300)
  }

  const handleAction = () => {
    if (!reminder) return

    if (reminder.type === 'in_progress' && reminder.conversationId) {
      // 繼續對話
      onContinue?.(reminder.conversationId)
    } else if (reminder.type === 'completed' && reminder.url) {
      // 打開已上線的網站
      window.open(reminder.url, '_blank')
    } else {
      // 跳轉到專案詳情頁
      window.location.href = `/dashboard/projects/${reminder.projectId}`
    }
  }

  if (isDismissed || !reminder) return null

  // 根據類型設定顏色
  const colors = {
    in_progress: {
      bg: 'rgba(59, 130, 246, 0.08)',
      border: 'rgba(59, 130, 246, 0.2)',
      icon: '#3b82f6',
      text: '#1d4ed8'
    },
    completed: {
      bg: 'rgba(34, 197, 94, 0.08)',
      border: 'rgba(34, 197, 94, 0.2)',
      icon: '#22c55e',
      text: '#15803d'
    },
    failed: {
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.2)',
      icon: '#ef4444',
      text: '#b91c1c'
    }
  }

  const color = colors[reminder.type]

  // 圖示
  const icons = {
    in_progress: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color.icon} strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12,6 12,12 16,14" />
      </svg>
    ),
    completed: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color.icon} strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22,4 12,14.01 9,11.01" />
      </svg>
    ),
    failed: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color.icon} strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    )
  }

  // 按鈕文字
  const buttonText = {
    in_progress: '繼續',
    completed: '查看',
    failed: '重試'
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          style={{
            position: 'fixed',
            top: 72,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1001,
            maxWidth: 480,
            width: 'calc(100% - 32px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: color.bg,
              border: `1px solid ${color.border}`,
              borderRadius: 12,
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* 圖示 */}
            <div style={{ flexShrink: 0 }}>
              {icons[reminder.type]}
            </div>

            {/* 內容 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: color.text,
                  marginBottom: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {reminder.projectName}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--gray-600)',
                }}
              >
                {reminder.message}
              </div>
            </div>

            {/* 按鈕 */}
            <button
              onClick={handleAction}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                color: '#fff',
                background: color.icon,
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {buttonText[reminder.type]}
            </button>

            {/* 關閉按鈕 */}
            <button
              onClick={handleDismiss}
              style={{
                flexShrink: 0,
                padding: 4,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--gray-400)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gray-600)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--gray-400)')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
