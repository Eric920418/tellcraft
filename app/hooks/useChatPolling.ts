'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getAuthToken } from '@/app/hooks/useAuth'
import { getConversationMessages as vpsGetConversationMessages } from '@/app/lib/vps-api'
import type { Message } from '@/app/types/chat'
import type { StreamingPreview } from '@/app/hooks/useVpsWebSocket'

export function useChatPolling(
  conversationId: string | undefined,
  getCommandLabel: (content: string) => string,
  callbacks: {
    onMessagesUpdate: (updater: (prev: Message[]) => Message[]) => void
    onIsTyping: (v: boolean) => void
    onCurrentStage: (s: Message['stage']) => void
    onStreamingPreview: (sp: StreamingPreview | null) => void
    onFastBuildChunks: (n: number) => void
    onCodePreviewData: (data: Record<string, unknown> | null) => void
    onLayoutModeChange: (mode: 'split') => void
    onSessionTaskIdUpdate: (taskId: string | null) => void
    onTypewriterTarget: (id: string | null) => void
  }
) {
  const [lastTimestamp, setLastTimestamp] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const lastUpdatedAtRef = useRef(lastUpdatedAt)
  lastUpdatedAtRef.current = lastUpdatedAt

  const getCommandLabelRef = useRef(getCommandLabel)
  getCommandLabelRef.current = getCommandLabel

  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useEffect(() => {
    if (!conversationId) return

    let pollInterval = 3000
    const MAX_INTERVAL = 15000
    const MIN_INTERVAL = 3000
    let timeoutId: NodeJS.Timeout | null = null
    let isPolling = true
    let currentUpdatedAt = lastUpdatedAtRef.current

    const poll = async () => {
      if (!isPolling) return

      const token = getAuthToken()
      const result = await vpsGetConversationMessages({
        conversationId,
        lastUpdatedAt: currentUpdatedAt || undefined,
        token: token || undefined
      })

      if (result.success && result.data) {
        if (result.data.updatedAt) {
          currentUpdatedAt = result.data.updatedAt
          setLastUpdatedAt(result.data.updatedAt)
        }

        // Handle streaming preview
        if (result.data.streamingPreview) {
          const sp = result.data.streamingPreview as StreamingPreview
          callbacksRef.current.onStreamingPreview(sp)
          const newChunks = (sp.pages?.length || 0) + (sp.components?.length || 0)
          callbacksRef.current.onFastBuildChunks(newChunks)
          pollInterval = 1500
          if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            callbacksRef.current.onLayoutModeChange('split')
          }
        }

        if (result.data.hasChanges === false) {
          pollInterval = Math.min(pollInterval * 1.5, MAX_INTERVAL)
          if (isPolling) {
            timeoutId = setTimeout(poll, pollInterval)
          }
          return
        }

        const newMessages = result.data.messages

        if (newMessages.length > 0) {
          pollInterval = MIN_INTERVAL

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const formattedMessages: Message[] = newMessages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp),
            stage: m.stage as Message['stage'],
            progress: m.progress as Message['progress'],
            layoutHint: m.layoutHint as Message['layoutHint'],
            richContent: m.richContent as Message['richContent'],
            quickReplies: m.quickReplies,
          }))

          const hasCodePreview = formattedMessages.some(m => m.richContent?.type === 'code_preview')
          if (hasCodePreview) {
            const cpMsg = [...formattedMessages].reverse().find(m => m.richContent?.type === 'code_preview')
            if (cpMsg?.richContent?.data) callbacksRef.current.onCodePreviewData(cpMsg.richContent.data)
            callbacksRef.current.onStreamingPreview(null)
            callbacksRef.current.onFastBuildChunks(0)
          }

          const latestAiMessageWithStage = [...formattedMessages]
            .reverse()
            .find(m => m.role === 'assistant' && m.stage)

          if (latestAiMessageWithStage?.stage) {
            callbacksRef.current.onCurrentStage(latestAiMessageWithStage.stage)
          }

          callbacksRef.current.onMessagesUpdate(prev => {
            const hasRealAiMessage = formattedMessages.some(m => m.role === 'assistant')
            const hasPreview = hasRealAiMessage && prev.some(m => m.id === 'preview-analyzing')
            const filteredPrev = hasPreview
              ? prev.filter(m => m.id !== 'preview-analyzing')
              : prev

            const existingIds = new Set(filteredPrev.map(m => m.id))
            const uniqueNewMessages = formattedMessages.filter(m => !existingIds.has(m.id))

            if (uniqueNewMessages.length > 0) {
              const updatedPrev = [...filteredPrev]
              const newMessagesToAdd: Message[] = []

              for (const newMsg of uniqueNewMessages) {
                if (newMsg.role === 'user') {
                  const dbLabel = getCommandLabelRef.current(newMsg.content)
                  const pendingIndex = updatedPrev.findIndex(m =>
                    m.role === 'user' && m.pending && (m.content === newMsg.content || m.content === dbLabel)
                  )
                  if (pendingIndex !== -1) {
                    updatedPrev[pendingIndex] = newMsg
                  } else {
                    newMessagesToAdd.push(newMsg)
                  }
                } else {
                  if (newMsg.progress) {
                    const existingProgress = updatedPrev.find(m => m.content === newMsg.content && m.progress)
                    if (existingProgress?.progress && newMsg.progress.current <= existingProgress.progress.current) {
                      continue
                    }
                  }
                  newMessagesToAdd.push(newMsg)
                }
              }

              if (newMessagesToAdd.length === 0 && updatedPrev.every((m, i) => m === filteredPrev[i])) {
                return hasPreview ? filteredPrev : prev
              }

              const hasNonProgressAiMessage = newMessagesToAdd.some(m =>
                m.role === 'assistant' &&
                !['init_progress', 'formulation_start', 'formulation_progress'].includes(m.stage || '')
              )
              if (hasNonProgressAiMessage) {
                // 觸發打字機動畫（找最後一條新 assistant 訊息）
                const lastNewAssistant = [...newMessagesToAdd].reverse().find(m =>
                  m.role === 'assistant' &&
                  !['init_progress', 'formulation_start', 'formulation_progress'].includes(m.stage || '')
                )
                if (lastNewAssistant) {
                  callbacksRef.current.onTypewriterTarget(lastNewAssistant.id)
                }
                callbacksRef.current.onIsTyping(false)
              }

              const combined = [...updatedPrev, ...newMessagesToAdd]
              const progressMap = new Map<string, { index: number; msg: Message }>()
              const result: Message[] = []

              for (const msg of combined) {
                if (msg.role === 'user') {
                  result.push(msg)
                  continue
                }

                if (msg.progress) {
                  const key = msg.content
                  const existing = progressMap.get(key)
                  if (existing) {
                    const oldP = existing.msg.progress
                    const newP = msg.progress
                    if (oldP && newP) {
                      if (newP.current > oldP.current || newP.step !== oldP.step) {
                        result[existing.index] = msg
                        progressMap.set(key, { index: existing.index, msg })
                      }
                    }
                    continue
                  }
                  progressMap.set(key, { index: result.length, msg })
                  result.push(msg)
                  continue
                }

                result.push(msg)
              }

              if (result.length === prev.length) {
                let changed = false
                for (let i = 0; i < result.length; i++) {
                  if (result[i] === prev[i]) continue
                  const a = result[i], b = prev[i]
                  if (a.id === b.id && a.content === b.content && a.role === b.role &&
                      a.stage === b.stage &&
                      a.richContent?.type === b.richContent?.type &&
                      (a.quickReplies?.length ?? 0) === (b.quickReplies?.length ?? 0) &&
                      a.progress?.current === b.progress?.current &&
                      a.progress?.total === b.progress?.total &&
                      a.progress?.step === b.progress?.step) {
                    result[i] = prev[i]
                  } else {
                    changed = true
                  }
                }
                if (!changed) return prev
              }

              return result
            }
            return filteredPrev
          })

          const latestTimestamp = newMessages[newMessages.length - 1]?.timestamp
          if (latestTimestamp) {
            setLastTimestamp(latestTimestamp)
          }
        } else {
          pollInterval = Math.min(pollInterval * 1.5, MAX_INTERVAL)
        }

        // 同步 currentTaskId（設置或清除）
        callbacksRef.current.onSessionTaskIdUpdate(result.data.currentTaskId || null)

        if (result.data.isComplete) {
          isPolling = false
          setTimeout(() => {
            callbacksRef.current.onCurrentStage('uiux')
          }, 3000)
          return
        }
      }

      if (isPolling) {
        timeoutId = setTimeout(poll, pollInterval)
      }
    }

    poll()

    return () => {
      isPolling = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [conversationId, lastTimestamp])

  const resetPolling = useCallback(() => {
    setLastTimestamp(null)
    setLastUpdatedAt(null)
  }, [])

  return { lastTimestamp, setLastTimestamp, resetPolling }
}
