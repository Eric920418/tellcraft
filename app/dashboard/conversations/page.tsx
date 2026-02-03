'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { DataTable, type Column } from '../../components/dashboard'
import { getUserConversations } from '../../actions'
import { getCurrentUserAction } from '../../actions'

interface Conversation {
  id: string
  projectId: string
  projectName: string
  lastMessage?: string
  messageCount: number
  updatedAt: string
  createdAt: string
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      // 先獲取當前用戶
      const userResult = await getCurrentUserAction()
      if (!userResult.success || !userResult.data) {
        setError('未登入')
        setIsLoading(false)
        return
      }

      const result = await getUserConversations({
        userId: userResult.data.userId,
        limit: 50,
      })

      if (result.success && result.data) {
        setConversations(result.data.conversations)
      } else {
        setError(result.error || '載入失敗')
      }
      setIsLoading(false)
    }

    fetchData()
  }, [])

  const columns: Column<Conversation>[] = [
    {
      key: 'projectName',
      header: '專案',
      width: '200px',
      render: (conv: Conversation) => (
        <span style={{ fontWeight: 500 }}>{conv.projectName}</span>
      ),
    },
    {
      key: 'lastMessage',
      header: '最後訊息',
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
      header: '訊息數',
      width: '80px',
      render: (conv: Conversation) => (
        <span style={{ fontFamily: 'var(--font-mono)' }}>{conv.messageCount}</span>
      ),
    },
    {
      key: 'updatedAt',
      header: '更新時間',
      width: '140px',
      render: (conv: Conversation) => (
        <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
          {formatRelativeTime(conv.updatedAt)}
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
          我的對話
        </h1>
        <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
          查看所有與 AI 的對話記錄
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
          emptyMessage="還沒有對話記錄"
          onRowClick={(conv) => {
            // 跳轉到首頁並帶上對話 ID，讓首頁載入該對話
            window.location.href = `/?conversation=${conv.id}`
          }}
        />
      </motion.div>
    </div>
  )
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '剛剛'
  if (diffMins < 60) return `${diffMins} 分鐘前`
  if (diffHours < 24) return `${diffHours} 小時前`
  if (diffDays < 7) return `${diffDays} 天前`
  return date.toLocaleDateString('zh-TW')
}
