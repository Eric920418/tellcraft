'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

// WebSocket URL
const WS_URL = process.env.NEXT_PUBLIC_VPS_WS_URL || 'http://54.238.4.117:8080'

// ============================================================
// 類型定義
// ============================================================

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  stage?: string
  progress?: { current: number; total: number; step: string }
}

interface UseVpsWebSocketOptions {
  conversationId: string
  onMessage?: (message: Message) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
}

interface UseVpsWebSocketReturn {
  isConnected: boolean
  messages: Message[]
  subscribe: () => void
  unsubscribe: () => void
}

// ============================================================
// WebSocket Hook
// ============================================================

export function useVpsWebSocket(options: UseVpsWebSocketOptions): UseVpsWebSocketReturn {
  const { conversationId, onMessage, onConnect, onDisconnect, onError } = options

  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])

  // 初始化 Socket 連接
  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[WebSocket] 已連接:', socket.id)
      setIsConnected(true)
      onConnect?.()

      // 自動訂閱對話
      if (conversationId) {
        socket.emit('subscribe', conversationId)
      }
    })

    socket.on('disconnect', (reason: string) => {
      console.log('[WebSocket] 已斷開:', reason)
      setIsConnected(false)
      onDisconnect?.()
    })

    socket.on('connect_error', (error: Error) => {
      console.error('[WebSocket] 連接錯誤:', error)
      onError?.(error)
    })

    socket.on('message', (message: Message) => {
      console.log('[WebSocket] 收到消息:', message)
      setMessages(prev => [...prev, message])
      onMessage?.(message)
    })

    return () => {
      if (socket.connected) {
        socket.emit('unsubscribe', conversationId)
      }
      socket.disconnect()
      socketRef.current = null
    }
  }, [conversationId, onConnect, onDisconnect, onError, onMessage])

  // 訂閱對話
  const subscribe = useCallback(() => {
    if (socketRef.current?.connected && conversationId) {
      socketRef.current.emit('subscribe', conversationId)
      console.log('[WebSocket] 訂閱對話:', conversationId)
    }
  }, [conversationId])

  // 取消訂閱
  const unsubscribe = useCallback(() => {
    if (socketRef.current?.connected && conversationId) {
      socketRef.current.emit('unsubscribe', conversationId)
      console.log('[WebSocket] 取消訂閱:', conversationId)
    }
  }, [conversationId])

  return {
    isConnected,
    messages,
    subscribe,
    unsubscribe,
  }
}

// ============================================================
// 單例 Socket 管理器（用於非 Hook 場景）
// ============================================================

let globalSocket: Socket | null = null

export function getGlobalSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
    })
  }
  return globalSocket
}

export function disconnectGlobalSocket(): void {
  if (globalSocket) {
    globalSocket.disconnect()
    globalSocket = null
  }
}
