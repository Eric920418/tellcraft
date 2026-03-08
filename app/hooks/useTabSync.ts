'use client'

import { useState, useEffect } from 'react'

/**
 * BroadcastChannel：讓同一瀏覽器的其他 Tab 立即知道「有任務在跑」
 * 無需輪詢，<1ms 通知，僅同一 Origin 有效
 * 這只是 UX 優化層，後端才是真正的防護（user-active Redis 鎖）
 */
export function useTabSync(userId: string | undefined) {
  const [isOtherTabBusy, setIsOtherTabBusy] = useState(false)

  useEffect(() => {
    if (!userId || typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel('tellcraft-task-sync')
    channel.onmessage = (e: MessageEvent) => {
      if (e.data.userId !== userId) return
      if (e.data.type === 'task_started') setIsOtherTabBusy(true)
      if (e.data.type === 'task_completed') setIsOtherTabBusy(false)
    }
    return () => channel.close()
  }, [userId])

  const broadcastTaskStarted = (conversationId: string) => {
    if (!userId || typeof BroadcastChannel === 'undefined') return
    const ch = new BroadcastChannel('tellcraft-task-sync')
    ch.postMessage({ type: 'task_started', userId, conversationId })
    ch.close()
  }

  const broadcastTaskCompleted = (conversationId: string) => {
    if (!userId || typeof BroadcastChannel === 'undefined') return
    const ch = new BroadcastChannel('tellcraft-task-sync')
    ch.postMessage({ type: 'task_completed', userId, conversationId })
    ch.close()
  }

  return { isOtherTabBusy, broadcastTaskStarted, broadcastTaskCompleted }
}
