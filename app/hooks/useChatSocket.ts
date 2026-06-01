'use client'

import { useEffect, useRef } from 'react'
import { io as ioClient, type Socket } from 'socket.io-client'
import type { Message } from '@/app/types/chat'

interface BackendMessagePayload {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  stage?: Message['stage']
  progress?: Message['progress']
  layoutHint?: Message['layoutHint']
  richContent?: Message['richContent']
  quickReplies?: Message['quickReplies']
}

interface StreamChunkPayload {
  messageId: string
  accumulated: string
}

interface StreamStartPayload {
  messageId: string
  stage?: Message['stage']
}

/**
 * 透過 socket.io 訂閱 backend 推送的 message 事件，補齊 polling 的 3-15s 延遲。
 *
 * 治本：以前完全靠 useChatPolling，backoff 升到 15s 後送訊息卡很久。
 * 現在 socket 即時推送（< 100ms），polling 降為網路斷線時的補齊機制。
 *
 * 訂閱：
 * - 'message' — 任何 sendMessage 都會 emit，含 streaming 結束最終訊息（orchestrator-utils.ts:302）
 * - 'message_stream_start' — LLM 串流開始（建立 partial 訊息）
 * - 'message_stream_chunk' — LLM token 累積（更新 partial content）
 *
 * Dedup：以 message.id 為主，跟現存 messages 比對；同 id 替換、不同 id 追加。
 * 進度訊息（progress）由 polling 自己 dedup（content+step）— socket 不重複處理避免雙頭操作。
 */
export function useChatSocket(
  conversationId: string | undefined,
  onMessagesUpdate: (updater: (prev: Message[]) => Message[]) => void,
) {
  const onMessagesUpdateRef = useRef(onMessagesUpdate)
  onMessagesUpdateRef.current = onMessagesUpdate

  // 串流中暫存（用 ref 避免 re-render；messageId → accumulated text）
  const streamBufferRef = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    if (!conversationId) return

    const wsUrl = process.env.NEXT_PUBLIC_VPS_WS_URL || '/'
    const socket: Socket = ioClient(wsUrl, {
      transports: ['websocket', 'polling'],
      query: { conversationId },
    })

    socket.on('connect', () => {
      socket.emit('join', `conversation:${conversationId}`)
    })

    const upsertMessage = (raw: BackendMessagePayload) => {
      const formatted: Message = {
        id: raw.id,
        role: raw.role,
        content: raw.content,
        timestamp: new Date(raw.timestamp),
        stage: raw.stage,
        progress: raw.progress,
        layoutHint: raw.layoutHint,
        richContent: raw.richContent,
        quickReplies: raw.quickReplies,
      }

      onMessagesUpdateRef.current(prev => {
        // 進度訊息交給 polling dedup（避免兩處邏輯漂移）
        if (formatted.progress) return prev

        // pending user message 對齊（content 對得上的話替換掉 pending 那條）
        if (formatted.role === 'user') {
          const pendingIdx = prev.findIndex(m =>
            m.role === 'user' && m.pending && m.content === formatted.content
          )
          if (pendingIdx !== -1) {
            const next = [...prev]
            next[pendingIdx] = formatted
            return next
          }
        }

        // 已存在同 id → 替換（streaming end 取代 partial）
        const existingIdx = prev.findIndex(m => m.id === formatted.id)
        if (existingIdx !== -1) {
          const existing = prev[existingIdx]
          // 內容相同且無 richContent / quickReplies 變化 → 不更新（避免重渲染）
          if (
            existing.content === formatted.content &&
            existing.stage === formatted.stage &&
            existing.richContent?.type === formatted.richContent?.type &&
            (existing.quickReplies?.length ?? 0) === (formatted.quickReplies?.length ?? 0)
          ) {
            return prev
          }
          const next = [...prev]
          next[existingIdx] = formatted
          return next
        }

        return [...prev, formatted]
      })
    }

    socket.on('message', (payload: BackendMessagePayload) => {
      // streaming end 也會 emit 這個事件 — 清掉 buffer
      streamBufferRef.current.delete(payload.id)
      upsertMessage(payload)
    })

    socket.on('message_stream_start', (payload: StreamStartPayload) => {
      streamBufferRef.current.set(payload.messageId, '')
      // 預建 partial assistant 訊息氣泡，內容空著等 chunk 填
      onMessagesUpdateRef.current(prev => {
        if (prev.some(m => m.id === payload.messageId)) return prev
        return [
          ...prev,
          {
            id: payload.messageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            stage: payload.stage,
          },
        ]
      })
    })

    socket.on('message_stream_chunk', (payload: StreamChunkPayload) => {
      streamBufferRef.current.set(payload.messageId, payload.accumulated)
      onMessagesUpdateRef.current(prev => {
        const idx = prev.findIndex(m => m.id === payload.messageId)
        if (idx === -1) {
          // chunk 先於 start 抵達（理論罕見）— 建一條
          return [
            ...prev,
            {
              id: payload.messageId,
              role: 'assistant',
              content: payload.accumulated,
              timestamp: new Date(),
            },
          ]
        }
        if (prev[idx].content === payload.accumulated) return prev
        const next = [...prev]
        next[idx] = { ...next[idx], content: payload.accumulated }
        return next
      })
    })

    return () => {
      socket.disconnect()
      streamBufferRef.current.clear()
    }
  }, [conversationId])
}
