'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { DataTable, type Column } from '@/app/components/dashboard'
import { getUserConversations } from '@/app/lib/vps-api'
import { useLocalePath } from '@/app/hooks/useLocalePath'

// 從 localStorage 獲取 token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

interface Conversation {
  id: string
  projectId: string
  projectName: string
  lastMessage?: string
  messageCount: number
  updatedAt: string
  createdAt?: string
}

export default function ConversationsPage() {
  const router = useRouter()
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')
  const localePath = useLocalePath()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const token = getAuthToken()
      if (!token) {
        router.push('/auth/login?next=/dashboard/conversations')
        return
      }

      const result = await getUserConversations({ token })

      if (result.success && result.data) {
        setConversations(result.data.conversations)
      } else {
        setError(result.error || tc('loadFailed'))
      }
      setIsLoading(false)
    }

    fetchData()
  }, [router])

  const columns: Column<Conversation>[] = [
    {
      key: 'projectName',
      header: t('projectHeader'),
      width: '200px',
      render: (conv: Conversation) => (
        <span style={{ fontWeight: 500 }}>{conv.projectName}</span>
      ),
    },
    {
      key: 'lastMessage',
      header: t('lastMessage'),
      width: '2fr',
      render: (conv: Conversation) =>
        conv.lastMessage ? (
          <span style={{ color: 'var(--gray-500)' }}>
            {conv.lastMessage.slice(0, 80)}
            {conv.lastMessage.length > 80 ? '...' : ''}
          </span>
        ) : (
          <span style={{ color: 'var(--gray-300)' }}>-</span>
        ),
    },
    {
      key: 'messageCount',
      header: t('messageCountHeader'),
      width: '80px',
      render: (conv: Conversation) => (
        <span style={{ fontFamily: 'var(--font-mono)' }}>{conv.messageCount}</span>
      ),
    },
    {
      key: 'updatedAt',
      header: t('updatedAt'),
      width: '140px',
      render: (conv: Conversation) => (
        <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
          {formatRelativeTime(conv.updatedAt, t)}
        </span>
      ),
    },
  ]

  if (error) {
    return (
      <div
        style={{
          padding: '40px',
          background: '#FEE2E2',
          border: '1px solid #FECACA',
          color: '#DC2626',
        }}
      >
        {error}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 24 }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}
        >
          {t('myConversations')}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
          {t('conversationsSubtitle')}
        </p>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <DataTable
          columns={columns}
          data={conversations}
          keyField="id"
          isLoading={isLoading}
          emptyMessage={t('noConversationsYet')}
          onRowClick={(conv) => {
            // 跳轉到首頁並帶上對話 ID，讓首頁載入該對話
            window.location.href = localePath(`/?conversation=${conv.id}`)
          }}
        />
      </motion.div>
    </div>
  )
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
