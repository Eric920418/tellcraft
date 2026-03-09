'use client'

import { useEffect, useRef, useState } from 'react'
import type { Message } from '@/app/types/chat'

const COMPLETION_ALERT_KEY = 'tellcraft_completion_alert_enabled'
const TOAST_DURATION_MS = 4000

interface ActiveTurn {
  conversationId: string
  userMessageId: string
  assistantCountAtStart: number
  latestAssistantIdAtStart: string | null
}

interface CompletionToast {
  id: number
  message: string
  waitingForVisibility: boolean
}

type BrowserWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext
}

function getLatestUserMessageId(messages: Message[]): string | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === 'user') return messages[i].id
  }
  return null
}

function getMeaningfulAssistantMessages(messages: Message[]): Message[] {
  return messages.filter(message => message.role === 'assistant' && !message.progress)
}

function getLatestMeaningfulAssistantId(messages: Message[]): string | null {
  const assistantMessages = getMeaningfulAssistantMessages(messages)
  return assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1].id : null
}

export function useCompletionAlert({
  conversationId,
  isTyping,
  messages,
  toastMessage,
}: {
  conversationId: string | undefined
  isTyping: boolean
  messages: Message[]
  toastMessage: string
}) {
  const [isEnabled, setIsEnabled] = useState(true)
  const [toast, setToast] = useState<CompletionToast | null>(null)

  const activeTurnRef = useRef<ActiveTurn | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasLoadedPreferenceRef = useRef(false)
  const currentConversationIdRef = useRef<string | undefined>(conversationId)
  const isHiddenRef = useRef(false)
  const lastArmedUserMessageIdRef = useRef<string | null>(null)
  const toastRef = useRef<CompletionToast | null>(null)
  toastRef.current = toast

  useEffect(() => {
    if (typeof document === 'undefined') return

    const handleVisibilityChange = () => {
      isHiddenRef.current = document.hidden
      if (!document.hidden && toastRef.current?.waitingForVisibility) {
        setToast(prev => prev ? { ...prev, waitingForVisibility: false } : prev)
      }
    }

    isHiddenRef.current = document.hidden
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = window.localStorage.getItem(COMPLETION_ALERT_KEY)
    setIsEnabled(stored !== 'false')
    hasLoadedPreferenceRef.current = true
  }, [])

  useEffect(() => {
    if (!hasLoadedPreferenceRef.current || typeof window === 'undefined') return
    window.localStorage.setItem(COMPLETION_ALERT_KEY, String(isEnabled))
  }, [isEnabled])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const warmUpAudio = () => {
      try {
        const browserWindow = window as BrowserWindow
        const AudioContextCtor = browserWindow.AudioContext || browserWindow.webkitAudioContext
        if (!AudioContextCtor) return
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContextCtor()
        }
        if (audioContextRef.current.state === 'suspended') {
          void audioContextRef.current.resume()
        }
      } catch {
        // Ignore browser audio initialization failures and fall back to toast only.
      }
    }

    window.addEventListener('pointerdown', warmUpAudio, { passive: true })
    window.addEventListener('keydown', warmUpAudio)
    window.addEventListener('touchstart', warmUpAudio, { passive: true })

    return () => {
      window.removeEventListener('pointerdown', warmUpAudio)
      window.removeEventListener('keydown', warmUpAudio)
      window.removeEventListener('touchstart', warmUpAudio)
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    if (toast.waitingForVisibility) return

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => {
      setToast(null)
    }, TOAST_DURATION_MS)

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
        toastTimerRef.current = null
      }
    }
  }, [toast])

  useEffect(() => {
    if (currentConversationIdRef.current !== conversationId) {
      currentConversationIdRef.current = conversationId
      activeTurnRef.current = null
      lastArmedUserMessageIdRef.current = null
      setToast(null)
    }
  }, [conversationId])

  useEffect(() => {
    if (!conversationId) {
      activeTurnRef.current = null
      lastArmedUserMessageIdRef.current = null
      return
    }

    const latestUserMessageId = getLatestUserMessageId(messages)

    if (isTyping && latestUserMessageId) {
      const existingTurn = activeTurnRef.current
      if (
        latestUserMessageId !== lastArmedUserMessageIdRef.current &&
        (!existingTurn || existingTurn.userMessageId !== latestUserMessageId)
      ) {
        activeTurnRef.current = {
          conversationId,
          userMessageId: latestUserMessageId,
          assistantCountAtStart: getMeaningfulAssistantMessages(messages).length,
          latestAssistantIdAtStart: getLatestMeaningfulAssistantId(messages),
        }
        lastArmedUserMessageIdRef.current = latestUserMessageId
      }
      return
    }

    if (isTyping || !activeTurnRef.current || activeTurnRef.current.conversationId !== conversationId) {
      return
    }

    const assistantMessages = getMeaningfulAssistantMessages(messages)
    const latestAssistantId = assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1].id : null
    const hasNewAssistantMessage =
      assistantMessages.length > activeTurnRef.current.assistantCountAtStart ||
      latestAssistantId !== activeTurnRef.current.latestAssistantIdAtStart

    activeTurnRef.current = null

    if (!hasNewAssistantMessage || !isEnabled || !isHiddenRef.current) {
      return
    }

    const playCompletionTone = async () => {
      if (typeof window === 'undefined') return

      try {
        const browserWindow = window as BrowserWindow
        const AudioContextCtor = browserWindow.AudioContext || browserWindow.webkitAudioContext
        if (!AudioContextCtor) return

        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContextCtor()
        }

        const audioContext = audioContextRef.current
        if (audioContext.state === 'suspended') {
          await audioContext.resume()
        }

        const startAt = audioContext.currentTime
        const endAt = startAt + 0.34
        const masterGain = audioContext.createGain()
        masterGain.connect(audioContext.destination)
        masterGain.gain.setValueAtTime(0.0001, startAt)
        masterGain.gain.exponentialRampToValueAtTime(0.08, startAt + 0.02)
        masterGain.gain.exponentialRampToValueAtTime(0.0001, endAt)

        const firstOscillator = audioContext.createOscillator()
        firstOscillator.type = 'triangle'
        firstOscillator.frequency.setValueAtTime(880, startAt)
        firstOscillator.frequency.exponentialRampToValueAtTime(1174.66, endAt)
        firstOscillator.connect(masterGain)

        const secondOscillator = audioContext.createOscillator()
        secondOscillator.type = 'sine'
        secondOscillator.frequency.setValueAtTime(659.25, startAt + 0.03)
        secondOscillator.frequency.exponentialRampToValueAtTime(880, endAt)
        secondOscillator.connect(masterGain)

        firstOscillator.start(startAt)
        secondOscillator.start(startAt + 0.03)
        firstOscillator.stop(endAt)
        secondOscillator.stop(endAt)

        window.setTimeout(() => {
          masterGain.disconnect()
        }, 450)
      } catch {
        // Ignore audio failures and keep the visual reminder.
      }
    }

    void playCompletionTone()
    setToast({
      id: Date.now(),
      message: toastMessage,
      waitingForVisibility: isHiddenRef.current,
    })
  }, [conversationId, isEnabled, isTyping, messages, toastMessage])

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
  }, [])

  return {
    isEnabled,
    setIsEnabled,
    toast,
    dismissToast: () => setToast(null),
  }
}
