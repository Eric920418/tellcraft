'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useLocalePath } from '@/app/hooks/useLocalePath'
import { shouldShowLoginPrompt, dismissLoginPrompt } from '@/app/components/LoginPrompt'
import type { Message, SessionInfo, ConversationItem } from '@/app/types/chat'

interface LoginPromptConfig {
  show: boolean
  variant: 'subtle' | 'emphasized'
  message: string
  subMessage?: string
  promptId: string
}

export function useLoginPrompt(
  sessionInfo: SessionInfo | null,
  messages: Message[],
  currentStage: Message['stage'],
  guestBuildCompleted: boolean,
) {
  const tLogin = useTranslations('login')
  const localePath = useLocalePath()
  const [loginPromptConfig, setLoginPromptConfig] = useState<LoginPromptConfig | null>(null)
  const [showConversationPicker, setShowConversationPicker] = useState(false)
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [isLoadingConversations, _setIsLoadingConversations] = useState(false)

  // Login prompt trigger logic
  useEffect(() => {
    if (!sessionInfo || sessionInfo.isAuthenticated) return

    if (messages.length <= 1) {
      const promptId = 'guest_chat_entry'
      if (shouldShowLoginPrompt(promptId)) {
        setLoginPromptConfig({
          show: true,
          variant: 'subtle',
          message: tLogin('guestChatEntry'),
          promptId
        })
      }
      return
    }

    if (guestBuildCompleted) {
      setLoginPromptConfig({
        show: true,
        variant: 'emphasized',
        message: tLogin('guestCompleteTitle'),
        subMessage: tLogin('guestCompleteMessage'),
        promptId: 'guest_build_complete'
      })
      return
    }

    const userMessageCount = messages.filter(m => m.role === 'user').length
    if (userMessageCount === 3) {
      const promptId = 'after_3_rounds'
      if (shouldShowLoginPrompt(promptId)) {
        setLoginPromptConfig({
          show: true,
          variant: 'subtle',
          message: tLogin('subtleAfterRounds'),
          promptId
        })
      }
    }

    const hasFastGenerating = messages.some(m => m.stage === 'fast_generating')
    if (hasFastGenerating) {
      const promptId = 'fast_generating_login'
      if (shouldShowLoginPrompt(promptId)) {
        setLoginPromptConfig({
          show: true,
          variant: 'subtle',
          message: tLogin('guestFastGenerating'),
          promptId
        })
      }
    }

    if (currentStage === 'generating') {
      const promptId = 'generating_code'
      if (shouldShowLoginPrompt(promptId)) {
        setLoginPromptConfig({
          show: true,
          variant: 'subtle',
          message: tLogin('subtleGenerating'),
          promptId
        })
      }
    }

    if (currentStage === 'complete') {
      const promptId = 'deploy_success'
      if (shouldShowLoginPrompt(promptId)) {
        setLoginPromptConfig({
          show: true,
          variant: 'emphasized',
          message: tLogin('emphasizedTitle'),
          subMessage: tLogin('emphasizedSubMessage'),
          promptId
        })
      }
    }
  }, [messages.length, currentStage, sessionInfo, guestBuildCompleted, tLogin])

  const handleLogin = useCallback(() => {
    const anonymousId = localStorage.getItem('tellcraft_anonymous_id')
    if (anonymousId) {
      window.location.href = localePath(`/auth/login?anonymousId=${encodeURIComponent(anonymousId)}`)
    } else {
      window.location.href = localePath('/auth/login')
    }
  }, [localePath])

  const handleDashboard = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      window.location.href = localePath('/auth/login?next=/dashboard')
      return
    }

    try {
      const res = await fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (res.ok) {
        window.location.href = localePath('/dashboard')
      } else {
        localStorage.removeItem('auth_token')
        window.location.href = localePath('/auth/login?next=/dashboard')
      }
    } catch {
      window.location.href = localePath('/dashboard')
    }
  }, [localePath])

  const handleDismissLoginPrompt = useCallback(() => {
    if (loginPromptConfig) {
      dismissLoginPrompt(loginPromptConfig.promptId)
      setLoginPromptConfig(null)
    }
  }, [loginPromptConfig])

  const resetLoginPrompt = useCallback(() => {
    setLoginPromptConfig(null)
    setShowConversationPicker(false)
    setConversations([])
  }, [])

  return {
    loginPromptConfig,
    setLoginPromptConfig,
    showConversationPicker,
    setShowConversationPicker,
    conversations,
    setConversations,
    isLoadingConversations,
    handleLogin,
    handleDashboard,
    handleDismissLoginPrompt,
    resetLoginPrompt,
  }
}
