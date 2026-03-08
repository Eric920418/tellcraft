'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { Message } from '@/app/types/chat'

export function useChatScroll(messages: Message[]) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const isProgrammaticScrollRef = useRef(false)
  const lastScrollTopRef = useRef(0)

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
    lastScrollTopRef.current = container.scrollTop
    setTimeout(() => {
      isProgrammaticScrollRef.current = false
    }, 50)
  }, [])

  // Scroll to bottom on message changes
  useEffect(() => {
    const scrollIfNearBottom = () => {
      if (isNearBottomRef.current) scrollToBottom()
    }

    if (isNearBottomRef.current) {
      scrollIfNearBottom()
      const t1 = setTimeout(scrollIfNearBottom, 100)
      const t2 = setTimeout(scrollIfNearBottom, 350)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [messages.length, scrollToBottom])

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
    observer.observe(container, { childList: true, subtree: true })
    return () => { observer.disconnect(); cancelAnimationFrame(rafId) }
  }, [messages.length])

  const handleChatScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return
    const container = chatScrollRef.current
    if (!container) return

    const currentTop = container.scrollTop
    const previousTop = lastScrollTopRef.current
    lastScrollTopRef.current = currentTop

    // Any manual upward scroll means user wants to read history; stop auto-follow immediately.
    if (currentTop < previousTop - 2) {
      isNearBottomRef.current = false
      return
    }

    const threshold = 72
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
