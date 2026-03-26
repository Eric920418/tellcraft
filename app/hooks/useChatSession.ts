'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getAuthToken } from '@/app/hooks/useAuth'
import {
  initializeSession as vpsInitializeSession,
  getConversationMessages as vpsGetConversationMessages,
  sendMessage as vpsSendMessage,
  uploadImage,
} from '@/app/lib/vps-api'
import { normalizeLegacyUploadUrl } from '@/app/lib/upload-url'
import { formatBackendMessage } from '@/app/lib/chat-utils'
import type { Message, SessionInfo } from '@/app/types/chat'

export function useChatSession(
  isActive: boolean,
  initialMessage: string,
  resumeConversationId: string | null | undefined,
  buildMode: 'fast' | 'fine' | 'clone' | undefined,
  callbacks: {
    onMessagesSet: (msgs: Message[]) => void
    onMessagesUpdate: (updater: (prev: Message[]) => Message[]) => void
    onIsTyping: (v: boolean) => void
    onCurrentStage: (s: Message['stage']) => void
    onCodePreviewData: (data: Record<string, unknown> | null) => void
    onLastTimestamp: (ts: string) => void
    onGuestBuildCompleted: (v: boolean) => void
    onQuotaReadOnly: (v: boolean) => void
    onLoginPromptConfig: (config: {
      show: boolean
      variant: 'subtle' | 'emphasized'
      message: string
      subMessage?: string
      promptId: string
    }) => void
    onError: (err: string | null) => void
  },
  initialImages?: File[],
) {
  const tChat = useTranslations('chat')
  const tLogin = useTranslations('login')
  const locale = useLocale()
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guestBuildCompleted, setGuestBuildCompleted] = useState(false)
  const [quotaReadOnly, setQuotaReadOnly] = useState(false)
  const hasInitialized = useRef(false)

  const getAnonymousId = useCallback(async () => {
    let anonymousId = localStorage.getItem('tellcraft_anonymous_id')

    if (!anonymousId) {
      try {
        const response = await fetch('/api/session')
        const data = await response.json()
        if (data.anonymousId) {
          anonymousId = data.anonymousId as string
          localStorage.setItem('tellcraft_anonymous_id', anonymousId)
        }
      } catch {
        // ignore
      }
    }

    if (!anonymousId) {
      anonymousId = crypto.randomUUID()
      localStorage.setItem('tellcraft_anonymous_id', anonymousId)
    }

    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anonymousId })
      })
    } catch {
      // ignore
    }

    return anonymousId
  }, [])

  // Initialize session
  useEffect(() => {
    if (!isActive || hasInitialized.current) return
    hasInitialized.current = true

    const init = async () => {
      setIsInitializing(true)
      setError(null)
      callbacks.onError(null)

      const anonymousId = await getAnonymousId()
      const token = getAuthToken()

      const result = await vpsInitializeSession({
        anonymousId,
        conversationId: resumeConversationId || undefined,
        createNew: !!initialMessage && !resumeConversationId,
        token: token || undefined
      })

      if (!result.success || !result.data) {
        const errMsg = result.error || tChat('initError')
        setError(errMsg)
        callbacks.onError(errMsg)
        setIsInitializing(false)
        return
      }

      const initReadOnly = !!result.data.readOnly && result.data.lockReason === 'credit_limit'
      setQuotaReadOnly(initReadOnly)
      callbacks.onQuotaReadOnly(initReadOnly)

      const session: SessionInfo = {
        userId: result.data.userId,
        projectId: result.data.projectId,
        conversationId: result.data.conversationId,
        isAuthenticated: !!token,
        hasHistory: result.data.messages.length > 0,
        readOnly: initReadOnly,
      }
      const hasHistory = result.data.messages.length > 0

      setSessionInfo(session)

      // Resume conversation
      if (resumeConversationId) {
        const historyResult = await vpsGetConversationMessages({
          conversationId: session.conversationId,
          token: token || undefined
        })

        if (historyResult.success && historyResult.data) {
          const historyMessages: Message[] = historyResult.data.messages.map(formatBackendMessage)
          callbacks.onMessagesSet(historyMessages)

          const cpMsg = [...historyMessages].reverse().find(m => m.richContent?.type === 'code_preview')
          callbacks.onCodePreviewData(cpMsg?.richContent?.data ?? null)

          if (historyResult.data.currentTaskId) {
            setSessionInfo(prev => prev ? {
              ...prev,
              currentTaskId: historyResult.data!.currentTaskId
            } : prev)
          }

          const lastAiMessage = historyMessages.filter(m => m.role === 'assistant').pop()
          if (lastAiMessage?.stage) {
            callbacks.onCurrentStage(lastAiMessage.stage)
          }

          if (historyMessages.length > 0) {
            const lastMsg = historyMessages[historyMessages.length - 1]
            callbacks.onLastTimestamp(lastMsg.timestamp.toISOString())
          }
        }
        setIsInitializing(false)
        return
      }

      // Send initial message
      if (initialMessage && !initReadOnly) {
        const userMsg: Message = {
          id: crypto.randomUUID(),
          role: 'user',
          content: initialMessage,
          timestamp: new Date(),
          pending: true
        }

        const previewMsg: Message = {
          id: 'preview-analyzing',
          role: 'assistant',
          content: buildMode === 'clone'
            ? tChat('clonePreview')
            : buildMode === 'fast'
            ? tChat('fastBuildPreview')
            : tChat('analyzePreview'),
          timestamp: new Date(),
          stage: buildMode === 'clone' ? 'clone_analyzing' : buildMode === 'fast' ? 'fast_generating' : 'clarify',
          pending: true
        }

        callbacks.onMessagesSet([userMsg, previewMsg])
        setIsInitializing(false)
        callbacks.onIsTyping(true)
        callbacks.onCurrentStage('clarify')

        // Upload initial images (clone mode)
        let imageUrls: string[] | undefined
        if (initialImages && initialImages.length > 0 && token) {
          const urls: string[] = []
          for (const file of initialImages) {
            try {
              const uploadResult = await uploadImage({ file, token })
              if (uploadResult.success && uploadResult.data?.url) {
                urls.push(normalizeLegacyUploadUrl(uploadResult.data.url))
              }
            } catch { /* skip failed uploads */ }
          }
          if (urls.length > 0) imageUrls = urls
        }

        const sendResult = await vpsSendMessage({
          conversationId: session.conversationId,
          message: initialMessage,
          projectId: session.projectId,
          userId: session.userId,
          mode: buildMode,
          locale,
          token: token || undefined,
          imageUrls,
        })

        if (!sendResult.success) {
          const initErr = sendResult.error || ''
          if (initErr.includes('GUEST_FINE_LOCKED') || initErr.includes('GUEST_LIMIT_REACHED')) {
            localStorage.setItem('tellcraft_guest_fast_used', 'true')
            setGuestBuildCompleted(true)
            callbacks.onGuestBuildCompleted(true)
            callbacks.onLoginPromptConfig({
              show: true,
              variant: 'emphasized',
              message: tLogin('guestLimitTitle'),
              subMessage: tLogin('guestLimitMessage'),
              promptId: 'guest_limit'
            })
          } else if (initErr.includes('CREDIT_LIMIT_REACHED')) {
            setQuotaReadOnly(true)
            callbacks.onQuotaReadOnly(true)
            const errMsg = tChat('quotaReadonlyHint')
            setError(errMsg)
            callbacks.onError(errMsg)
          } else {
            const errMsg = initErr || tChat('sendError')
            setError(errMsg)
            callbacks.onError(errMsg)
          }
        } else if (sendResult.data?.messageId) {
          callbacks.onMessagesUpdate(prev => prev.map(m =>
            m.id === userMsg.id ? { ...m, id: sendResult.data!.messageId } : m
          ))
        }
        return
      } else if (hasHistory) {
        const historyResult = await vpsGetConversationMessages({
          conversationId: session.conversationId,
          token: token || undefined
        })

        if (historyResult.success && historyResult.data) {
          const historyMessages: Message[] = historyResult.data.messages.map(formatBackendMessage)
          callbacks.onMessagesSet(historyMessages)

          const cpMsg = [...historyMessages].reverse().find(m => m.richContent?.type === 'code_preview')
          callbacks.onCodePreviewData(cpMsg?.richContent?.data ?? null)

          const lastAiMessage = historyMessages.filter(m => m.role === 'assistant').pop()
          if (lastAiMessage?.stage) {
            callbacks.onCurrentStage(lastAiMessage.stage)
          }

          if (historyMessages.length > 0) {
            const lastMsg = historyMessages[historyMessages.length - 1]
            callbacks.onLastTimestamp(lastMsg.timestamp.toISOString())
          }
        }
      }

      setIsInitializing(false)
    }

    init()

  }, [isActive, initialMessage, resumeConversationId, getAnonymousId])

  // Detect guest build completed
  useEffect(() => {
    if (!sessionInfo || sessionInfo.isAuthenticated) return
    // We check messages via the callback pattern - this is called from ChatSection
  }, [sessionInfo])

  // Reset on deactivate
  useEffect(() => {
    if (!isActive) {
      hasInitialized.current = false
      setSessionInfo(null)
      setError(null)
      setQuotaReadOnly(false)
      setGuestBuildCompleted(false)
      setIsInitializing(true)
    }
  }, [isActive])

  const handleSelectConversation = useCallback(async (conversationId: string) => {
    if (!sessionInfo) return

    setIsInitializing(true)

    const token = getAuthToken()
    const result = await vpsGetConversationMessages({ conversationId, token: token || undefined })
    if (result.success && result.data) {
      const formattedMessages: Message[] = result.data.messages.map(formatBackendMessage)
      callbacks.onMessagesSet(formattedMessages)

      const cpMsg = [...formattedMessages].reverse().find(m => m.richContent?.type === 'code_preview')
      callbacks.onCodePreviewData(cpMsg?.richContent?.data ?? null)

      setSessionInfo({
        ...sessionInfo,
        conversationId,
        currentTaskId: result.data.currentTaskId
      })

      if (formattedMessages.length > 0) {
        const lastMsg = formattedMessages[formattedMessages.length - 1]
        callbacks.onLastTimestamp(lastMsg.timestamp.toISOString())
      }
    }

    setIsInitializing(false)

  }, [sessionInfo])

  const checkGuestBuildCompleted = useCallback((messages: Message[]) => {
    if (!sessionInfo || sessionInfo.isAuthenticated) return
    const hasCompleted = messages.some(m =>
      m.stage === 'uiux_complete' || m.stage === 'uiux_iteration_complete'
    )
    if (hasCompleted && !guestBuildCompleted) {
      localStorage.setItem('tellcraft_guest_fast_used', 'true')
      setGuestBuildCompleted(true)
      callbacks.onGuestBuildCompleted(true)
    }

  }, [sessionInfo, guestBuildCompleted])

  return {
    sessionInfo,
    setSessionInfo,
    isInitializing,
    error,
    setError,
    guestBuildCompleted,
    setGuestBuildCompleted,
    quotaReadOnly,
    setQuotaReadOnly,
    handleSelectConversation,
    checkGuestBuildCompleted,
  }
}
