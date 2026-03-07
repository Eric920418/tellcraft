'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { Message } from '@/app/types/chat'

export function useChatScroll(messages: Message[], typingStage: string) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const isProgrammaticScrollRef = useRef(false)

  // Sticky callback ref: AnimatePresence layout transitions unmount exit elements
  // setting ref to null, causing scrollToBottom to fail. This callback only updates
  // on mount, ignoring unmount nulls.
  const chatScrollStickyRef = useCallback((el: HTMLDivElement | null) => {
    if (el) chatScrollRef.current = el
  }, [])

  const scrollToBottom = useCallback(() => {
    const container = chatScrollRef.current
    if (!container) return
    isProgrammaticScrollRef.current = true
    container.scrollTop = container.scrollHeight
    setTimeout(() => {
      isProgrammaticScrollRef.current = false
    }, 50)
  }, [])

  // Scroll to bottom on message changes
  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom()
      const t1 = setTimeout(() => scrollToBottom(), 100)
      const t2 = setTimeout(() => scrollToBottom(), 350)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [messages, typingStage, scrollToBottom])

  // MutationObserver for auto-scroll on content height changes
  useEffect(() => {
    const container = chatScrollRef.current
    if (!container) return
    let rafId: number
    const observer = new MutationObserver(() => {
      if (isNearBottomRef.current) {
        cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(() => {
          const dist = container.scrollHeight - container.scrollTop - container.clientHeight
          if (dist > 1) {
            isProgrammaticScrollRef.current = true
            container.scrollTop = container.scrollHeight
            setTimeout(() => { isProgrammaticScrollRef.current = false }, 50)
          }
        })
      }
    })
    observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] })
    return () => { observer.disconnect(); cancelAnimationFrame(rafId) }
  }, [messages])

  const handleChatScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return
    const container = chatScrollRef.current
    if (!container) return
    const threshold = 150
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    isNearBottomRef.current = distanceFromBottom < threshold
  }, [])

  return {
    messagesEndRef,
    chatScrollStickyRef,
    chatScrollRef,
    handleChatScroll,
    scrollToBottom,
    isNearBottomRef,
  }
}
