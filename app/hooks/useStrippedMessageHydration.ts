'use client'

/**
 * useStrippedMessageHydration — 自動補回被 polling response cap strip 掉的 message richContent
 *
 * Backend incident 2026-05-17 fix：polling response 對單條 message > 150KB（含 code_preview 整套
 * pages/components/styles）會把 richContent.data 替換成 `{ _stripped: true, _reason, _originalSize }`
 * 避免前端 JSON.parse + render freeze。
 *
 * 此 hook：
 *   1. 偵測 messages 內任何 richContent.data._stripped === true
 *   2. 對每條 stripped message fire-and-forget 呼叫 lazy-fetch endpoint 拿完整 richContent
 *   3. 拿到後 callback onHydrate(msgId, fullRichContent) 讓 owner state 替換
 *   4. 用 ref 追蹤已 fetch 過的 msgId 避免 polling 觸發重複 fetch
 *
 * 設計：fire-and-forget — fetch 失敗不影響 chat 主流程，最差就是 preview 顯示「載入中」
 */

import { useEffect, useRef } from 'react'
import { getAuthToken } from '@/app/hooks/useAuth'
import { getMessageRichData } from '@/app/lib/vps-api'
import type { Message } from '@/app/types/chat'

interface StrippedMarker {
  _stripped?: boolean
  _reason?: string
  _originalSize?: number
}

function isStripped(rc: Message['richContent']): boolean {
  if (!rc || typeof rc !== 'object') return false
  const data = (rc as { data?: unknown }).data as StrippedMarker | undefined
  return !!data?._stripped
}

export function useStrippedMessageHydration(
  conversationId: string | undefined,
  messages: Message[],
  onHydrate: (msgId: string, richContent: Message['richContent']) => void,
) {
  // 追蹤 in-flight / 已成功的 msgId 避免重複 fetch
  const inFlightRef = useRef<Set<string>>(new Set())
  const hydratedRef = useRef<Set<string>>(new Set())
  const onHydrateRef = useRef(onHydrate)
  onHydrateRef.current = onHydrate

  // Conversation 換了就清 cache（不同對話的 msgId 不能共用）
  useEffect(() => {
    inFlightRef.current.clear()
    hydratedRef.current.clear()
  }, [conversationId])

  useEffect(() => {
    if (!conversationId) return

    const targets = messages.filter(m =>
      m.id
      && isStripped(m.richContent)
      && !inFlightRef.current.has(m.id)
      && !hydratedRef.current.has(m.id)
    )

    if (targets.length === 0) return

    const token = getAuthToken()

    for (const msg of targets) {
      const msgId = msg.id
      if (!msgId) continue
      inFlightRef.current.add(msgId)

      getMessageRichData({
        conversationId,
        messageId: msgId,
        token: token || undefined,
      })
        .then(result => {
          inFlightRef.current.delete(msgId)
          if (result.success && result.data?.richContent) {
            hydratedRef.current.add(msgId)
            onHydrateRef.current(msgId, result.data.richContent as Message['richContent'])
          }
          // 失敗不重試 — 留給 user 手動 reload 觸發 re-render，下次又會 fire-and-forget
        })
        .catch(() => {
          inFlightRef.current.delete(msgId)
          // 靜默失敗 — 不阻塞 chat
        })
    }
  }, [conversationId, messages])
}
