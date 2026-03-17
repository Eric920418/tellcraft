'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { Message } from '@/app/types/chat'

const WS_URL = process.env.NEXT_PUBLIC_VPS_WS_URL || 'http://54.238.4.117:8080'

// ============================================================
// 串流消息 Hook — 監聽 LLM 即時文字串流
// ============================================================

export interface StreamingMessage {
  messageId: string
  content: string
  stage?: string
}

interface UseMessageStreamingOptions {
  conversationId: string | undefined
  onStreamStart?: () => void
  onStreamComplete?: (message: Message) => void
}

interface UseMessageStreamingReturn {
  streamingMessage: StreamingMessage | null
  isStreaming: boolean
}

export function useMessageStreaming(
  options: UseMessageStreamingOptions
): UseMessageStreamingReturn {
  const { conversationId, onStreamStart, onStreamComplete } = options
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const callbacksRef = useRef({ onStreamStart, onStreamComplete })
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 保持 callbacks 最新（避免 effect 依賴）
  callbacksRef.current = { onStreamStart, onStreamComplete }

  useEffect(() => {
    if (!conversationId) return

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    const anonymousId = typeof window !== 'undefined' ? localStorage.getItem('anonymous_id') : null

    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: {
        token: token || undefined,
        anonymousId: !token ? (anonymousId || undefined) : undefined,
      },
    })

    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('subscribe', conversationId)
    })

    // 串流開始
    socket.on('message_stream_start', (data: { messageId: string; stage?: string }) => {
      setStreamingMessage({
        messageId: data.messageId,
        content: '',
        stage: data.stage,
      })
      callbacksRef.current.onStreamStart?.()

      // 超時保護：20 秒無更新則結束串流
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setStreamingMessage(null)
      }, 20_000)
    })

    // 串流 chunk（accumulated = 完整累積文字）
    socket.on('message_stream_chunk', (data: { messageId: string; accumulated: string }) => {
      setStreamingMessage(prev => {
        if (!prev || prev.messageId !== data.messageId) return prev
        return { ...prev, content: data.accumulated }
      })

      // 重置超時
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setStreamingMessage(null)
      }, 20_000)
    })

    // 串流結束
    socket.on('message_stream_end', (data: {
      id: string
      role: string
      content: string
      timestamp: string
      stage?: string
      quickReplies?: { label: string; value: string; style?: string }[]
    }) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setStreamingMessage(null)

      // 轉換為 Message 並通知父層
      const message: Message = {
        id: data.id,
        role: data.role as 'assistant',
        content: data.content,
        timestamp: new Date(data.timestamp),
        stage: data.stage as Message['stage'],
        quickReplies: data.quickReplies?.map(qr => ({
          label: qr.label,
          value: qr.value,
          style: (qr.style as 'primary' | 'secondary' | 'ghost') || undefined,
        })),
      }
      callbacksRef.current.onStreamComplete?.(message)
    })

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (socket.connected) {
        socket.emit('unsubscribe', conversationId)
      }
      socket.disconnect()
      socketRef.current = null
    }
  }, [conversationId])

  return {
    streamingMessage,
    isStreaming: streamingMessage !== null,
  }
}
