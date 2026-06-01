'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getAuthToken } from '@/app/hooks/useAuth'
import { getConversationMessages as vpsGetConversationMessages } from '@/app/lib/vps-api'
import type { Message } from '@/app/types/chat'
import type { StreamingPreview } from '@/app/types/chat'

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
    onLastValidatedFiles?: (files: Array<{ file_path: string; content: string; skill_source: string; file_type: string }> | null) => void
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

  // 把 pollInterval 跟 poll fn 提升到 ref，讓 forcePoll() 可以從 hook 外重置 + 立即觸發
  // 修正 useEffect 內部閉包陷阱：原本 resetPolling() 無法重置 pollInterval（區域變數）
  const pollIntervalRef = useRef(3000)
  const pollFnRef = useRef<(() => void) | null>(null)
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!conversationId) return

    const MAX_INTERVAL = 15000
    const MIN_INTERVAL = 3000
    pollIntervalRef.current = MIN_INTERVAL
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
          pollIntervalRef.current = MIN_INTERVAL  // streaming preview 已存 Redis，3s 足夠
          if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            callbacksRef.current.onLayoutModeChange('split')
          }
        }

        // Last Known Good fallback（僅在後端判定需要時才傳，前端無條件接收）
        // 後端條件：isGenerating && !streamingPreview → 回 lastValidatedFiles
        if (callbacksRef.current.onLastValidatedFiles) {
          const lkg = (result.data as { lastValidatedFiles?: Array<{ file_path: string; content: string; skill_source: string; file_type: string }> | null }).lastValidatedFiles ?? null
          callbacksRef.current.onLastValidatedFiles(lkg)
        }

        if (result.data.hasChanges === false) {
          pollIntervalRef.current = Math.min(pollIntervalRef.current * 1.5, MAX_INTERVAL)
          if (isPolling) {
            pollTimeoutRef.current = setTimeout(poll, pollIntervalRef.current)
          }
          return
        }

        const newMessages = result.data.messages

        if (newMessages.length > 0) {
          pollIntervalRef.current = MIN_INTERVAL

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
            // 防雷 incident 2026-05-17：polling response cap 對超大 code_preview 會 strip data 為 _stripped marker
            // 直接 fire 給 ChatPreviewPanel 會讓 WebContainer mount 空 files → boot 卡死「啟動環境...」
            // 跳過 stripped data — useStrippedMessageHydration hook 會 lazy fetch full 後再 fire
            const isStripped = (cpMsg?.richContent?.data as { _stripped?: boolean } | undefined)?._stripped === true
            if (cpMsg?.richContent?.data && !isStripped) {
              callbacksRef.current.onCodePreviewData(cpMsg.richContent.data)
            }
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

              const PROGRESS_STAGES = [
                'init_progress', 'formulation_start', 'formulation_progress',
                'auto_adopt_progress',
              ]
              const hasNonProgressAiMessage = newMessagesToAdd.some(m =>
                m.role === 'assistant' &&
                !PROGRESS_STAGES.includes(m.stage || '')
              )
              if (hasNonProgressAiMessage) {
                // 觸發打字機動畫（找最後一條新 assistant 訊息）
                const lastNewAssistant = [...newMessagesToAdd].reverse().find(m =>
                  m.role === 'assistant' &&
                  !PROGRESS_STAGES.includes(m.stage || '')
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
          pollIntervalRef.current = Math.min(pollIntervalRef.current * 1.5, MAX_INTERVAL)
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
        pollTimeoutRef.current = setTimeout(poll, pollIntervalRef.current)
      }
    }

    pollFnRef.current = poll
    poll()

    return () => {
      isPolling = false
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
      pollFnRef.current = null
    }
  }, [conversationId, lastTimestamp])

  const resetPolling = useCallback(() => {
    setLastTimestamp(null)
    setLastUpdatedAt(null)
  }, [])

  // 強制立即 poll + 重置 interval 回 3s
  // 在 handleSendMessage 成功後呼叫，避免 backoff 升到 15s 後送訊息卡很久
  const forcePoll = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }
    pollIntervalRef.current = 3000
    pollFnRef.current?.()
  }, [])

  return { lastTimestamp, setLastTimestamp, resetPolling, forcePoll }
}
