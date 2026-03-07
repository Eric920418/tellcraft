'use client'

import { useState, useRef, useEffect, useCallback, useMemo, useDeferredValue } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth, getAuthToken } from '@/app/hooks/useAuth'
import {
  replyToConversation as vpsReplyToConversation,
  sendMessage as vpsSendMessage,
} from '@/app/lib/vps-api'
import { smoothEasing, mapBackendStageToFrontend, STAGES } from '@/app/lib/chat-utils'
import { normalizeLegacyUploadUrl } from '@/app/lib/upload-url'
import { COMMAND_KEYS } from '@/app/types/chat'
import type { Message } from '@/app/types/chat'
import type { StreamingPreview } from '@/app/hooks/useVpsWebSocket'
import type { Template } from '@/app/lib/templates'
import type { DeviceType } from '@/app/components/uiux/DeviceSwitcher'

import { useChatScroll } from '@/app/hooks/useChatScroll'
import { useCodePreviewEditor } from '@/app/hooks/useCodePreviewEditor'
import { useLoginPrompt } from '@/app/hooks/useLoginPrompt'
import { useChatSession } from '@/app/hooks/useChatSession'
import { useChatPolling } from '@/app/hooks/useChatPolling'

import { ProcessStep } from '@/app/components/landing'
import { AnimatedThemeToggler } from '@/app/components/AnimatedThemeToggler'
import LocaleSwitcher from '@/app/components/LocaleSwitcher'
import GlowButton from '@/app/components/GlowButton'
import SplitLayout from '@/app/components/uiux/SplitLayout'
import SpecGenerationView from '@/app/components/SpecGenerationView'
import LoginPrompt from '@/app/components/LoginPrompt'
import { getTemplateById } from '@/app/actions/templates'

import ChatMessageList from './ChatMessageList'
import ChatPreviewPanel from './ChatPreviewPanel'
import MobilePreviewModal from './MobilePreviewModal'

export default function ChatSection({
  isActive,
  initialMessage,
  resumeConversationId,
  onBack,
  buildMode
}: {
  isActive: boolean
  initialMessage: string
  resumeConversationId?: string | null
  onBack: () => void
  buildMode?: 'fast' | 'fine'
}) {
  const tChat = useTranslations('chat')
  const tStage = useTranslations('stage')
  const tCodePreview = useTranslations('codePreview')
  const tUiux = useTranslations('uiux')
  const tLogin = useTranslations('login')
  const tCommand = useTranslations('command')
  const locale = useLocale()
  const auth = useAuth()

  const getCommandLabel = useCallback((content: string) => {
    const key = COMMAND_KEYS[content.trim()]
    return key ? tCommand(key) : content.trim()
  }, [tCommand])

  // ── Core state ──
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const deferredInput = useDeferredValue(input)
  const [isTyping, setIsTyping] = useState(false)
  const [sendCooldown, setSendCooldown] = useState(false)
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [typingStage, setTypingStage] = useState<'none' | 'dots' | 'message'>('none')
  const [currentStage, setCurrentStage] = useState<Message['stage']>('discovery')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isComposingRef = useRef(false)

  // ── Layout state ──
  const [layoutMode, setLayoutMode] = useState<'default' | 'split'>('default')
  const [isLayoutTransitioning, setIsLayoutTransitioning] = useState(false)
  const layoutModeRef = useRef(layoutMode)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [codePreviewDevice, setCodePreviewDevice] = useState<DeviceType>('desktop')

  // ── Streaming / Preview state ──
  const [streamingPreview, setStreamingPreview] = useState<StreamingPreview | null>(null)
  const [codePreviewData, setCodePreviewData] = useState<Record<string, unknown> | null>(null)
  const [fastBuildChunks, setFastBuildChunks] = useState(0)

  // ── Mobile Preview ──
  const [showMobilePreview, setShowMobilePreview] = useState(false)

  // ── Attached images ──
  const [attachedImages, setAttachedImages] = useState<{ file: File; previewUrl: string }[]>([])
  const chatImageInputRef = useRef<HTMLInputElement>(null)
  const [pendingCodePreviewSaveAt, setPendingCodePreviewSaveAt] = useState<number | null>(null)

  // ── Typing indicator ──
  const typingSafetyRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (isTyping) {
      setTypingStage('dots')
      typingTimerRef.current = setTimeout(() => {
        setTypingStage('message')
      }, 10000)
      typingSafetyRef.current = setTimeout(() => {
        console.warn('[Chat] isTyping safety timeout triggered')
        setIsTyping(false)
      }, 90000)
    } else {
      if (typingTimerRef.current) { clearTimeout(typingTimerRef.current); typingTimerRef.current = null }
      if (typingSafetyRef.current) { clearTimeout(typingSafetyRef.current); typingSafetyRef.current = null }
      setTypingStage('none')
    }
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      if (typingSafetyRef.current) clearTimeout(typingSafetyRef.current)
    }
  }, [isTyping])

  // ── Auto resize textarea ──
  const adjustTextareaHeight = useCallback(() => {
    requestAnimationFrame(() => {
      const textarea = inputRef.current
      if (!textarea) return
      textarea.style.height = 'auto'
      const maxHeight = 200
      const newHeight = Math.min(textarea.scrollHeight, maxHeight)
      textarea.style.height = `${newHeight}px`
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
    })
  }, [])

  // ── Hooks ──
  const sessionCallbacks = useMemo(() => ({
    onMessagesSet: (msgs: Message[]) => setMessages(msgs),
    onMessagesUpdate: (updater: (prev: Message[]) => Message[]) => setMessages(updater),
    onIsTyping: (v: boolean) => setIsTyping(v),
    onCurrentStage: (s: Message['stage']) => setCurrentStage(s),
    onCodePreviewData: (data: Record<string, unknown> | null) => setCodePreviewData(data),
    onLastTimestamp: (ts: string) => pollingRef.current?.setLastTimestamp(ts),
    onGuestBuildCompleted: (_v: boolean) => { /* handled by session hook */ },
    onQuotaReadOnly: (_v: boolean) => { /* handled by session hook */ },
    onLoginPromptConfig: (config: { show: boolean; variant: 'subtle' | 'emphasized'; message: string; subMessage?: string; promptId: string }) => {
      loginPromptHook.setLoginPromptConfig(config)
    },
    onError: (_err: string | null) => { /* handled by session hook */ },
  }), [])

  const session = useChatSession(
    isActive,
    initialMessage,
    resumeConversationId,
    buildMode,
    sessionCallbacks,
  )

  // Re-create editor with actual conversationId
  const editorHook = useCodePreviewEditor(session.sessionInfo?.conversationId)

  const loginPromptHook = useLoginPrompt(
    session.sessionInfo,
    messages,
    currentStage,
    session.guestBuildCompleted,
  )

  const scroll = useChatScroll(messages, typingStage)

  const pollingRef = useRef<{ setLastTimestamp: (ts: string) => void }>({ setLastTimestamp: () => {} })

  const pollingCallbacks = useMemo(() => ({
    onMessagesUpdate: (updater: (prev: Message[]) => Message[]) => setMessages(updater),
    onIsTyping: (v: boolean) => setIsTyping(v),
    onCurrentStage: (s: Message['stage']) => setCurrentStage(s),
    onStreamingPreview: (sp: StreamingPreview | null) => {
      if (sp === null) {
        setStreamingPreview(null)
        return
      }
      setStreamingPreview(prev => {
        if (!prev) return sp
        if (
          prev.phase === sp.phase &&
          prev.pages.length === sp.pages.length &&
          prev.components.length === sp.components.length &&
          prev.styles.length === sp.styles.length &&
          prev.pages.every((p, i) => p.path === sp.pages[i]?.path && p.content.length === sp.pages[i]?.content.length) &&
          prev.components.every((c, i) => c.path === sp.components[i]?.path && c.content.length === sp.components[i]?.content.length)
        ) {
          return prev
        }
        return sp
      })
    },
    onFastBuildChunks: (n: number) => setFastBuildChunks(prev => prev !== n ? n : prev),
    onCodePreviewData: (data: Record<string, unknown> | null) => setCodePreviewData(data),
    onLayoutModeChange: (mode: 'split') => {
      if (layoutModeRef.current !== mode) {
        setLayoutMode(mode)
        layoutModeRef.current = mode
      }
    },
    onSessionTaskIdUpdate: (taskId: string) => {
      session.setSessionInfo(prev => prev ? { ...prev, currentTaskId: taskId } : null)
    },
  }), [])

  const polling = useChatPolling(
    session.sessionInfo?.conversationId,
    getCommandLabel,
    pollingCallbacks,
  )
  pollingRef.current = polling

  // ── Guest build detection ──
  useEffect(() => {
    session.checkGuestBuildCompleted(messages)
  }, [messages, session])

  // ── Layout mode tracking ──
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    let targetMode: 'default' | 'split' = 'default'

    if (!isMobile) {
      const lastHintMessage = [...messages].reverse().find(m => m.layoutHint)
      if (lastHintMessage?.layoutHint) {
        targetMode = lastHintMessage.layoutHint === 'split' ? 'split' : 'default'
      } else {
        const hasUiuxMessage = messages.some(m =>
          m.stage?.startsWith('uiux') || m.richContent?.type === 'template_picker'
        )
        if (hasUiuxMessage) targetMode = 'split'

        const hasClarifyMessage = messages.some(m =>
          m.stage === 'clarify_question' || m.stage === 'prd_discovery_complete' || m.stage === 'prd_discovery_continue'
        )
        if (hasClarifyMessage && !hasUiuxMessage) targetMode = 'split'
      }
    }

    if (targetMode !== layoutModeRef.current) {
      setIsLayoutTransitioning(true)
      const transitionTimer = setTimeout(() => {
        layoutModeRef.current = targetMode
        setLayoutMode(targetMode)
        setTimeout(() => setIsLayoutTransitioning(false), 400)
      }, 300)
      return () => clearTimeout(transitionTimer)
    }
  }, [messages])

  // ── Template loading ──
  useEffect(() => {
    if (!selectedTemplateId) { setSelectedTemplate(null); return }
    const loadTemplate = async () => {
      const result = await getTemplateById(selectedTemplateId)
      if (result.success && result.data) setSelectedTemplate(result.data)
    }
    loadTemplate()
  }, [selectedTemplateId])

  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId)
  }, [])

  // ── Reset on deactivate ──
  useEffect(() => {
    if (!isActive) {
      setMessages([])
      setInput('')
      setCurrentStage('discovery')
      setCodePreviewData(null)
      setStreamingPreview(null)
      setFastBuildChunks(0)
      setLayoutMode('default')
      layoutModeRef.current = 'default'
      setSelectedTemplateId(null)
      setSelectedTemplate(null)
      setShowMobilePreview(false)
      setAttachedImages([])
      loginPromptHook.resetLoginPrompt()
      editorHook.resetEditor()
      polling.resetPolling()
      scroll.chatScrollRef.current = null
    }
  }, [isActive])

  // ── Cooldown ──
  const startSendCooldown = useCallback((ms = 2000) => {
    setSendCooldown(true)
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
    cooldownTimerRef.current = setTimeout(() => setSendCooldown(false), ms)
  }, [])

  useEffect(() => () => {
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
  }, [])

  const isGuestLocked = session.guestBuildCompleted && !session.sessionInfo?.isAuthenticated
  const isReadOnlyMode = isGuestLocked || session.quotaReadOnly

  // ── Image attachment ──
  const handleAttachImage = useCallback((files: FileList | null) => {
    if (!files) return
    const MAX_ATTACHED = 3
    const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const MAX_SIZE = 5 * 1024 * 1024

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!ACCEPTED_TYPES.includes(file.type)) continue
      if (file.size > MAX_SIZE) continue
      setAttachedImages(prev => {
        if (prev.length >= MAX_ATTACHED) return prev
        return [...prev, { file, previewUrl: URL.createObjectURL(file) }]
      })
    }
  }, [])

  const handleRemoveAttachedImage = useCallback((index: number) => {
    setAttachedImages(prev => {
      const removed = prev[index]
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  // ── Send message (button trigger) ──
  const handleSendMessage = useCallback(async (
    content: string,
    options?: { imageUrls?: string[] }
  ) => {
    if (!session.sessionInfo || !content.trim() || isTyping || sendCooldown) return false

    if (session.quotaReadOnly) {
      session.setError(tChat('quotaReadonlyHint'))
      return false
    }

    if (isGuestLocked) {
      loginPromptHook.setLoginPromptConfig({
        show: true,
        variant: 'emphasized',
        message: tLogin('guestLimitTitle'),
        subMessage: tLogin('guestLimitMessage'),
        promptId: 'guest_limit'
      })
      return false
    }

    startSendCooldown()

    const displayContent = getCommandLabel(content)
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: displayContent,
      timestamp: new Date(),
      pending: true
    }
    scroll.isNearBottomRef.current = true
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)
    requestAnimationFrame(() => scroll.scrollToBottom())

    const token = getAuthToken()
    let result
    if (session.sessionInfo.currentTaskId) {
      result = await vpsReplyToConversation({
        conversationId: session.sessionInfo.conversationId,
        projectId: session.sessionInfo.projectId,
        userId: session.sessionInfo.userId,
        taskId: session.sessionInfo.currentTaskId,
        message: content.trim(),
        locale,
        token: token || undefined,
        imageUrls: options?.imageUrls,
      })
    } else {
      result = await vpsSendMessage({
        conversationId: session.sessionInfo.conversationId,
        message: content.trim(),
        projectId: session.sessionInfo.projectId,
        userId: session.sessionInfo.userId,
        locale,
        token: token || undefined,
        imageUrls: options?.imageUrls,
      })
    }

    if (!result.success) {
      setMessages(prev => prev.filter(m => m.id !== userMessage.id))
      setIsTyping(false)

      const err = result.error || ''
      if (err.includes('GUEST_FINE_LOCKED') || err.includes('GUEST_LIMIT_REACHED')) {
        localStorage.setItem('tellcraft_guest_fast_used', 'true')
        session.setGuestBuildCompleted(true)
        loginPromptHook.setLoginPromptConfig({
          show: true,
          variant: 'emphasized',
          message: tLogin('guestLimitTitle'),
          subMessage: tLogin('guestLimitMessage'),
          promptId: 'guest_limit'
        })
        return false
      }
      if (err.includes('CREDIT_LIMIT_REACHED')) {
        session.setQuotaReadOnly(true)
        session.setError(tChat('quotaReadonlyHint'))
        return false
      }

      session.setError(err || tChat('sendFailed'))
      return false
    }
    return true
  }, [session, isTyping, sendCooldown, isGuestLocked, startSendCooldown, getCommandLabel, scroll, locale, tChat, tLogin, loginPromptHook])

  // ── Send from input (Enter key) ──
  const handleSend = useCallback(async () => {
    if (!session.sessionInfo || !input.trim() || isTyping || sendCooldown) return

    if (session.quotaReadOnly) {
      session.setError(tChat('quotaReadonlyHint'))
      return
    }

    if (isGuestLocked) {
      loginPromptHook.setLoginPromptConfig({
        show: true,
        variant: 'emphasized',
        message: tLogin('guestLimitTitle'),
        subMessage: tLogin('guestLimitMessage'),
        promptId: 'guest_limit'
      })
      return
    }

    startSendCooldown()

    const pendingImages = [...attachedImages]
    if (pendingImages.length > 0) setAttachedImages([])

    let content = input.trim()
    setInput('')
    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.style.height = 'auto'
    }

    // Edit mode: append selected elements context
    if (editorHook.codePreviewEditMode && editorHook.codePreviewSelectedElements.length > 0) {
      const elementLines = editorHook.codePreviewSelectedElements.map((el, idx) => {
        const tag = el.tagName.toLowerCase()
        const textSnippet = el.text ? `「${el.text.substring(0, 30)}」` : ''
        const styleHints: string[] = []
        if (el.styles.fontSize) styleHints.push(`font-size: ${el.styles.fontSize}`)
        if (el.styles.color) styleHints.push(`color: ${el.styles.color}`)
        if (el.styles.padding) styleHints.push(`padding: ${el.styles.padding}`)
        if (el.styles.backgroundColor && el.styles.backgroundColor !== 'rgba(0, 0, 0, 0)') styleHints.push(`background: ${el.styles.backgroundColor}`)
        const styleStr = styleHints.length > 0 ? `（${styleHints.join(', ')}）` : ''
        return `${idx + 1}. <${tag}>: ${textSnippet}${styleStr}`
      }).join('\n')

      content = `[${tCodePreview('selectionContext')}]\n${elementLines}\n\n[${tChat('userInstruction')}]\n${content}`

      editorHook.setCodePreviewSelectedElements([])
      const iframe = editorHook.getPreviewIframe()
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'tc_clearSelection' }, '*')
      }
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      pending: true
    }
    scroll.isNearBottomRef.current = true
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)
    requestAnimationFrame(() => scroll.scrollToBottom())

    // Upload images
    let imageUrls: string[] | undefined
    if (pendingImages.length > 0) {
      const token = getAuthToken()
      if (token) {
        const { uploadImage } = await import('@/app/lib/vps-api')
        const urls: string[] = []
        for (const img of pendingImages) {
          try {
            const uploadResult = await uploadImage({ file: img.file, token })
            if (uploadResult.success && uploadResult.data?.url) {
              urls.push(normalizeLegacyUploadUrl(uploadResult.data.url))
            }
          } catch { /* ignore */ } finally {
            URL.revokeObjectURL(img.previewUrl)
          }
        }
        if (urls.length > 0) imageUrls = urls
      } else {
        for (const img of pendingImages) URL.revokeObjectURL(img.previewUrl)
      }
    }

    const token = getAuthToken()
    let result
    if (session.sessionInfo.currentTaskId) {
      result = await vpsReplyToConversation({
        conversationId: session.sessionInfo.conversationId,
        projectId: session.sessionInfo.projectId,
        userId: session.sessionInfo.userId,
        taskId: session.sessionInfo.currentTaskId,
        message: content,
        locale,
        token: token || undefined,
        imageUrls,
      })
    } else {
      result = await vpsSendMessage({
        conversationId: session.sessionInfo.conversationId,
        message: content,
        projectId: session.sessionInfo.projectId,
        userId: session.sessionInfo.userId,
        locale,
        token: token || undefined,
        imageUrls,
      })
    }

    if (!result.success) {
      setMessages(prev => prev.filter(m => m.id !== userMessage.id))
      setIsTyping(false)

      const err = result.error || ''
      if (err.includes('GUEST_FINE_LOCKED') || err.includes('GUEST_LIMIT_REACHED')) {
        localStorage.setItem('tellcraft_guest_fast_used', 'true')
        session.setGuestBuildCompleted(true)
        loginPromptHook.setLoginPromptConfig({
          show: true,
          variant: 'emphasized',
          message: tLogin('guestLimitTitle'),
          subMessage: tLogin('guestLimitMessage'),
          promptId: 'guest_limit'
        })
        return
      }
      if (err.includes('CREDIT_LIMIT_REACHED')) {
        session.setQuotaReadOnly(true)
        session.setError(tChat('quotaReadonlyHint'))
        return
      }
      session.setError(err || tChat('sendFailed'))
    } else if (result.data?.messageId) {
      setMessages(prev => prev.map(m =>
        m.id === userMessage.id ? { ...m, id: result.data!.messageId } : m
      ))
    }
  }, [session, input, isTyping, sendCooldown, isGuestLocked, attachedImages, startSendCooldown, editorHook, scroll, locale, tChat, tCodePreview, tLogin, loginPromptHook])

  // ── Code preview save ──
  const extractImageUrlsFromOverrides = useCallback((overrides: Record<string, Record<string, string>>): string[] => {
    const urls = new Set<string>()

    for (const changes of Object.values(overrides)) {
      const rawImgSrc = (changes.imgSrc || '').trim()
      if (/^https?:\/\//i.test(rawImgSrc)) {
        urls.add(normalizeLegacyUploadUrl(rawImgSrc))
      }

      const bg = (changes.backgroundImage || '').trim()
      if (!bg || bg === 'none') continue
      const bgMatch = bg.match(/url\(["']?(.*?)["']?\)/i)
      const bgUrl = (bgMatch ? bgMatch[1] : bg).trim()
      if (/^https?:\/\//i.test(bgUrl)) {
        urls.add(normalizeLegacyUploadUrl(bgUrl))
      }
    }

    return Array.from(urls)
  }, [])

  const getCurrentPreviewRoute = useCallback((): string => {
    const normalize = (raw: string): string => {
      const value = raw.trim()
      if (!value) return '/'
      let route = value
      if (route.startsWith('#')) route = route.slice(1)
      const queryPos = route.indexOf('?')
      if (queryPos >= 0) route = route.slice(0, queryPos)
      if (!route.startsWith('/')) route = `/${route}`
      route = route.replace(/\/+$/, '')
      return route || '/'
    }

    try {
      const iframe = editorHook.getPreviewIframe()
      const loc = iframe?.contentWindow?.location
      if (!loc) return '/'
      if (loc.hash && loc.hash.startsWith('#/')) {
        return normalize(loc.hash)
      }
      if (loc.pathname && loc.pathname !== 'about:blank') {
        return normalize(loc.pathname)
      }
    } catch {
      // Cross-origin 或 iframe 尚未就緒時，回退到首頁路由
    }

    return '/'
  }, [editorHook])

  const clearCodePreviewDraft = useCallback(() => {
    editorHook.setCodePreviewOverrides({})
    editorHook.setCodePreviewAnnotations({})
    editorHook.setCodePreviewHistoryIndex(0)
    editorHook.setCodePreviewSelectedElements([])
    const iframe = editorHook.getPreviewIframe()
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'tc_clearSelection' }, '*')
    }
  }, [editorHook])

  const handleCodePreviewSave = useCallback(async () => {
    if (!session.sessionInfo || Object.keys(editorHook.codePreviewOverrides).length === 0 || pendingCodePreviewSaveAt) return
    const lines: string[] = [tCodePreview('saveMessage'), '', tCodePreview('saveNote1'), tCodePreview('saveNote2'), tCodePreview('saveNote3'), '']
    const lockedImageUrls = extractImageUrlsFromOverrides(editorHook.codePreviewOverrides)
    const previewRoute = getCurrentPreviewRoute()

    lines.push('## 當前預覽路由（必須優先套用於此頁）')
    lines.push(`- ${previewRoute}`)
    lines.push('')

    for (const [elemId, changes] of Object.entries(editorHook.codePreviewOverrides)) {
      lines.push(`### ${elemId}`)
      for (const [prop, val] of Object.entries(changes)) {
        const normalizedVal = normalizeLegacyUploadUrl(String(val))
        if (prop === 'text') {
          lines.push(`- ${tCodePreview('textChanged', { value: normalizedVal })}`)
        } else if (prop === 'imgSrc') {
          lines.push(`- ${tCodePreview('imgSrcChanged', { value: normalizedVal })}`)
          if (/^https?:\/\//i.test(normalizedVal)) {
            lines.push(`- 鎖定圖片 URL（不可替換/不可刪除）: ${normalizedVal}`)
          }
        } else if (prop === 'imgAlt') {
          lines.push(`- ${tCodePreview('imgAltChanged', { value: normalizedVal })}`)
        } else if (prop === 'backgroundImage') {
          const urlMatch = normalizedVal.match(/url\(["']?(.*?)["']?\)/)
          const pureUrl = normalizeLegacyUploadUrl(urlMatch ? urlMatch[1] : normalizedVal)
          if (normalizedVal === 'none' || !pureUrl) {
            lines.push(`- 移除背景圖片`)
          } else {
            lines.push(`- 設定背景圖片: style={{ backgroundImage: "url(${pureUrl})", backgroundSize: "${editorHook.codePreviewOverrides[elemId]?.backgroundSize || 'cover'}", backgroundPosition: "${editorHook.codePreviewOverrides[elemId]?.backgroundPosition || 'center'}", backgroundRepeat: "${editorHook.codePreviewOverrides[elemId]?.backgroundRepeat || 'no-repeat'}" }}`)
            lines.push(`- 鎖定背景圖 URL（不可替換/不可刪除）: ${pureUrl}`)
          }
        } else if (prop === 'backgroundSize' || prop === 'backgroundPosition' || prop === 'backgroundRepeat') {
          continue
        } else {
          const label = tUiux((`label${prop.charAt(0).toUpperCase() + prop.slice(1)}`) as never) || prop
          lines.push(`- ${tCodePreview('styleChanged', { label, prop, value: normalizedVal })}`)
        }
      }
      const ann = editorHook.codePreviewAnnotations[elemId]
      if (ann) lines.push(`- ${tCodePreview('annotationPrefix')}: ${ann}`)
      lines.push('')
    }

    if (lockedImageUrls.length > 0) {
      lines.push('## 圖片資產鎖定（最高優先）')
      lines.push('以下圖片 URL 必須原樣保留，不可替換、不可刪除、不可改成 placeholder/unsplash/base64/local path：')
      for (const url of lockedImageUrls) {
        lines.push(`- ${url}`)
      }
      lines.push('')
    }

    const content = lines.join('\n')
    const startedAt = Date.now()
    setPendingCodePreviewSaveAt(startedAt)
    editorHook.setCodePreviewSelectedElements([])
    const iframe = editorHook.getPreviewIframe()
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'tc_clearSelection' }, '*')
    }

    const sent = await handleSendMessage(content, { imageUrls: lockedImageUrls })
    if (!sent) {
      setPendingCodePreviewSaveAt(null)
    }
  }, [session.sessionInfo, editorHook, tCodePreview, tUiux, handleSendMessage, extractImageUrlsFromOverrides, getCurrentPreviewRoute, pendingCodePreviewSaveAt])

  useEffect(() => {
    if (!pendingCodePreviewSaveAt) return

    const completionMessage = [...messages].reverse().find((m) => {
      const ts = new Date(m.timestamp).getTime()
      if (Number.isNaN(ts) || ts < pendingCodePreviewSaveAt) return false
      return m.stage === 'uiux_iteration_complete' || m.stage === 'error' || m.stage === 'info'
    })

    if (!completionMessage) return

    if (completionMessage.stage === 'uiux_iteration_complete') {
      clearCodePreviewDraft()
    }

    setPendingCodePreviewSaveAt(null)
  }, [messages, pendingCodePreviewSaveAt, clearCodePreviewDraft])

  // ── Handle new conversation ──
  const handleStartNewConversation = useCallback(() => {
    loginPromptHook.setShowConversationPicker(false)
  }, [loginPromptHook])

  // ── Stage computation ──
  const stages = useMemo(() => STAGES.map(s => ({ ...s, title: tStage(s.key as 'discovery' | 'clarify' | 'formulation' | 'generating' | 'complete') })), [tStage])
  const mappedStage = mapBackendStageToFrontend(currentStage)
  const currentStageIndex = stages.findIndex(s => s.key === mappedStage)

  // ── Stable preview data ──
  const stablePreviewData = useMemo(() => {
    const activeData = streamingPreview || codePreviewData
    if (!activeData) return null
    return {
      pages: (activeData.pages || []) as { path: string; content: string; description: string }[],
      components: (activeData.components || []) as { path: string; content: string; description: string }[],
      styles: (activeData.styles || '') as string,
      tailwindConfig: (activeData.tailwindConfig || '') as string,
      isStreaming: !!streamingPreview,
      phase: ((streamingPreview as StreamingPreview | null)?.phase || 'structure') as 'structure' | 'animation' | 'rwd',
    }
  }, [streamingPreview, codePreviewData])

  // ── View mode ──
  const lastMessage = messages[messages.length - 1]
  const isFormulationStage = lastMessage?.stage === 'formulation_progress' || lastMessage?.stage === 'formulation_start'

  const isBddSplitMode = messages.some(m =>
    m.stage === 'clarify_question' || m.stage === 'prd_discovery_continue' || m.stage === 'prd_discovery_complete'
  ) && !messages.some(m => m.stage?.startsWith('uiux') || m.richContent?.type === 'code_preview')
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
  const bddChatWidth = isBddSplitMode ? Math.round(screenWidth * 0.8) : 420
  const bddMinChatWidth = isBddSplitMode ? Math.round(screenWidth * 0.7) : 320
  const bddMaxChatWidth = isBddSplitMode ? Math.round(screenWidth * 0.9) : 600

  const isFormulationView = isFormulationStage && isActive
  const isSplitView = !isFormulationView && layoutMode === 'split' && isActive
  const isDefaultView = !isFormulationView && !isSplitView

  const formulationProgress = lastMessage?.progress
  const formulationCurrentStage = Math.min(4, formulationProgress?.current || 0)

  return (
    <>
    {/* Mobile Preview Modal */}
    <MobilePreviewModal
      show={showMobilePreview}
      stablePreviewData={stablePreviewData}
      onClose={() => setShowMobilePreview(false)}
      onDeploy={() => {
        setShowMobilePreview(false)
        handleSendMessage(locale === 'en' ? 'deploy' : '部署')
      }}
    />

    <AnimatePresence>
      {/* Formulation View */}
      {isFormulationView && (
        <motion.div
          key="formulation-view"
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5, ease: smoothEasing }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
        >
          <SpecGenerationView
            currentStage={formulationCurrentStage}
            onComplete={() => {}}
          />
        </motion.div>
      )}

      {/* Split Layout */}
      {isSplitView && (
        <motion.div
          key="split-layout"
          initial={{ opacity: 0 }}
          animate={{ opacity: isLayoutTransitioning ? 0.5 : 1 }}
          exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
          transition={{ duration: 0.5, ease: smoothEasing }}
          style={{ position: 'fixed', inset: 0, zIndex: 100 }}
        >
          <SplitLayout
            defaultChatWidth={bddChatWidth}
            minChatWidth={bddMinChatWidth}
            maxChatWidth={bddMaxChatWidth}
            chatPanel={
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{
                  height: 56,
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  gap: 12,
                }}>
                  <button
                    onClick={onBack}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 13, color: 'var(--gray-600)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0',
                    }}
                  >
                    <span>←</span>
                    {tChat('headerBackButton')}
                  </button>
                  <div style={{ width: 1, height: 20, background: 'var(--border-color)' }} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{isBddSplitMode ? tChat('bddSplitTitle') : tChat('uiuxSplitTitle')}</span>
                </div>
                <ChatMessageList
                  messages={messages}
                  layoutMode={layoutMode}
                  showConversationPicker={loginPromptHook.showConversationPicker}
                  conversations={loginPromptHook.conversations}
                  isLoadingConversations={loginPromptHook.isLoadingConversations}
                  error={session.error}
                  isInitializing={session.isInitializing}
                  chatScrollStickyRef={scroll.chatScrollStickyRef}
                  handleChatScroll={scroll.handleChatScroll}
                  messagesEndRef={scroll.messagesEndRef}
                  isTyping={isTyping}
                  sendCooldown={sendCooldown}
                  typingStage={typingStage}
                  sessionInfo={session.sessionInfo}
                  isReadOnlyMode={isReadOnlyMode}
                  codePreviewEditMode={editorHook.codePreviewEditMode}
                  codePreviewSelectedElements={editorHook.codePreviewSelectedElements}
                  attachedImages={attachedImages}
                  chatImageInputRef={chatImageInputRef}
                  input={input}
                  setInput={setInput}
                  deferredInput={deferredInput}
                  adjustTextareaHeight={adjustTextareaHeight}
                  isComposingRef={isComposingRef}
                  inputRef={inputRef}
                  handleSend={handleSend}
                  handleSendMessage={handleSendMessage}
                  onBack={onBack}
                  handleTemplateSelect={handleTemplateSelect}
                  selectedTemplateId={selectedTemplateId}
                  handleRemoveSelectedElement={editorHook.handleRemoveSelectedElement}
                  handleClearSelection={editorHook.handleClearSelection}
                  handleAttachImage={handleAttachImage}
                  handleRemoveAttachedImage={handleRemoveAttachedImage}
                  getCommandLabel={getCommandLabel}
                  handleSelectConversation={session.handleSelectConversation}
                  handleStartNewConversation={handleStartNewConversation}
                  onShowMobilePreview={() => setShowMobilePreview(true)}
                  isGuestLocked={isGuestLocked}
                  quotaReadOnly={session.quotaReadOnly}
                />
              </div>
            }
            previewPanel={
              <ChatPreviewPanel
                messages={messages}
                sessionInfo={session.sessionInfo}
                streamingPreview={streamingPreview}
                fastBuildChunks={fastBuildChunks}
                stablePreviewData={stablePreviewData}
                codePreviewEditMode={editorHook.codePreviewEditMode}
                setCodePreviewEditMode={editorHook.setCodePreviewEditMode}
                codePreviewSelectedElements={editorHook.codePreviewSelectedElements}
                setCodePreviewSelectedElements={editorHook.setCodePreviewSelectedElements}
                codePreviewSelectedElement={editorHook.codePreviewSelectedElement}
                setCodePreviewSelectedElement={editorHook.setCodePreviewSelectedElement}
                codePreviewOverrides={editorHook.codePreviewOverrides}
                codePreviewAnnotations={editorHook.codePreviewAnnotations}
                codePreviewPendingUpdate={editorHook.codePreviewPendingUpdate}
                codePreviewPendingReset={editorHook.codePreviewPendingReset}
                codePreviewPendingOverrides={editorHook.codePreviewPendingOverrides}
                codePreviewCanUndo={editorHook.codePreviewCanUndo}
                codePreviewCanRedo={editorHook.codePreviewCanRedo}
                codePreviewDevice={codePreviewDevice}
                setCodePreviewDevice={setCodePreviewDevice}
                handleCodePreviewSelectionChanged={editorHook.handleCodePreviewSelectionChanged}
                handleCodePreviewElementSelected={editorHook.handleCodePreviewElementSelected}
                handleCodePreviewElementUpdate={editorHook.handleCodePreviewElementUpdate}
                handleCodePreviewResetElement={editorHook.handleCodePreviewResetElement}
                handleCodePreviewUndo={editorHook.handleCodePreviewUndo}
                handleCodePreviewRedo={editorHook.handleCodePreviewRedo}
                handleCodePreviewUploadImage={editorHook.handleCodePreviewUploadImage}
                handleCodePreviewAnnotationChange={editorHook.handleCodePreviewAnnotationChange}
                handleCodePreviewElementResized={editorHook.handleCodePreviewElementResized}
                handleClearSelection={editorHook.handleClearSelection}
                getPreviewIframe={editorHook.getPreviewIframe}
                handleCodePreviewSave={handleCodePreviewSave}
                handleSendMessage={handleSendMessage}
                selectedTemplateId={selectedTemplateId}
                selectedTemplate={selectedTemplate}
              />
            }
          />
        </motion.div>
      )}

      {/* Default Layout */}
      {isDefaultView && isActive && (
        <motion.div
          key="default-layout"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{
            opacity: isLayoutTransitioning ? 0 : 1,
            scale: isLayoutTransitioning ? 0.98 : 1,
            filter: isLayoutTransitioning ? 'blur(4px)' : 'blur(0px)'
          }}
          exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
          transition={{
            duration: 0.4,
            ease: smoothEasing,
            scale: { duration: 0.5, ease: smoothEasing }
          }}
          style={{
            position: 'fixed', inset: 0,
            background: 'var(--white)',
            display: 'flex', flexDirection: 'column',
            zIndex: 100,
            willChange: 'transform, opacity',
          }}
        >
          <motion.header
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: smoothEasing }}
            className="chat-header"
            style={{
              height: 64,
              borderBottom: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 24px',
              background: 'var(--white)',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Left: Back + Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
              <button
                onClick={onBack}
                className="back-button"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 14, color: 'var(--gray-500)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0',
                }}
              >
                <span className="back-arrow" style={{ fontSize: 18 }}>←</span>
                <span className="back-text">{tChat('backButton')}</span>
              </button>
              <div className="header-divider" style={{ width: 1, height: 24, background: 'var(--border-color)' }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Tellcraft" width={24} height={24} style={{ borderRadius: 4 }} />
              <span className="header-logo" style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em' }}>
                Tellcraft
              </span>
            </div>

            {/* Center: Steps indicator */}
            <div className="steps-indicator" style={{
              position: 'absolute', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 0,
            }}>
              {stages.map((stage, i) => (
                <ProcessStep
                  key={stage.key}
                  step={i + 1}
                  title={stage.title}
                  active={mappedStage === stage.key}
                  completed={i < currentStageIndex}
                  isLast={i === stages.length - 1}
                />
              ))}
            </div>

            {/* Mobile progress capsule */}
            <div className="mobile-progress-capsule" style={session.sessionInfo?.isAuthenticated === false ? { display: 'none' } : undefined}>
              <div className="progress-ring-container">
                <svg className="progress-ring" width="24" height="24" viewBox="0 0 24 24">
                  <circle className="progress-ring-bg" cx="12" cy="12" r="9" />
                  <circle
                    className="progress-ring-fill"
                    cx="12" cy="12" r="9"
                    strokeDasharray={`${2 * Math.PI * 9}`}
                    strokeDashoffset={`${2 * Math.PI * 9 * (1 - (currentStageIndex + 1) / stages.length)}`}
                  />
                </svg>
                <span className="progress-step-number">{currentStageIndex + 1}</span>
              </div>
              <span className="progress-stage-label">
                {stages[currentStageIndex]?.title || tChat('preparing')}
              </span>
            </div>

            {/* Right: Theme + User */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              <span className="header-theme-toggle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AnimatedThemeToggler /><LocaleSwitcher /></span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {(auth.isAuthenticated || session.sessionInfo?.isAuthenticated) ? (
                  <>
                    {(auth.user?.avatarUrl || session.sessionInfo?.user?.avatarUrl) && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        className="header-avatar"
                        src={auth.user?.avatarUrl || session.sessionInfo?.user?.avatarUrl}
                        alt=""
                        style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border-color)' }}
                      />
                    )}
                    <span className="user-name" style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                      {auth.user?.name || session.sessionInfo?.user?.name || auth.user?.email?.split('@')[0] || session.sessionInfo?.user?.email?.split('@')[0] || tChat('defaultUserName')}
                    </span>
                    <span className="header-dashboard-btn">
                      <GlowButton onClick={loginPromptHook.handleDashboard} variant="outline" size="sm">
                        {tChat('dashboardButton')}
                      </GlowButton>
                    </span>
                  </>
                ) : (
                  <GlowButton onClick={loginPromptHook.handleLogin} variant="outline" size="sm">
                    {tChat('loginButton')}
                  </GlowButton>
                )}
              </div>
            </div>
          </motion.header>

          {/* Subtle login prompt */}
          {loginPromptHook.loginPromptConfig?.show && loginPromptHook.loginPromptConfig.variant === 'subtle' && (
            <LoginPrompt
              variant="subtle"
              message={loginPromptHook.loginPromptConfig.message}
              onLogin={loginPromptHook.handleLogin}
              onDismiss={loginPromptHook.handleDismissLoginPrompt}
              autoHideAfter={15000}
            />
          )}

          {/* Chat content */}
          <ChatMessageList
            messages={messages}
            layoutMode={layoutMode}
            showConversationPicker={loginPromptHook.showConversationPicker}
            conversations={loginPromptHook.conversations}
            isLoadingConversations={loginPromptHook.isLoadingConversations}
            error={session.error}
            isInitializing={session.isInitializing}
            chatScrollStickyRef={scroll.chatScrollStickyRef}
            handleChatScroll={scroll.handleChatScroll}
            messagesEndRef={scroll.messagesEndRef}
            isTyping={isTyping}
            sendCooldown={sendCooldown}
            typingStage={typingStage}
            sessionInfo={session.sessionInfo}
            isReadOnlyMode={isReadOnlyMode}
            codePreviewEditMode={editorHook.codePreviewEditMode}
            codePreviewSelectedElements={editorHook.codePreviewSelectedElements}
            attachedImages={attachedImages}
            chatImageInputRef={chatImageInputRef}
            input={input}
            setInput={setInput}
            deferredInput={deferredInput}
            adjustTextareaHeight={adjustTextareaHeight}
            isComposingRef={isComposingRef}
            inputRef={inputRef}
            handleSend={handleSend}
            handleSendMessage={handleSendMessage}
            onBack={onBack}
            handleTemplateSelect={handleTemplateSelect}
            selectedTemplateId={selectedTemplateId}
            handleRemoveSelectedElement={editorHook.handleRemoveSelectedElement}
            handleClearSelection={editorHook.handleClearSelection}
            handleAttachImage={handleAttachImage}
            handleRemoveAttachedImage={handleRemoveAttachedImage}
            getCommandLabel={getCommandLabel}
            handleSelectConversation={session.handleSelectConversation}
            handleStartNewConversation={handleStartNewConversation}
            onShowMobilePreview={() => setShowMobilePreview(true)}
            isGuestLocked={isGuestLocked}
            quotaReadOnly={session.quotaReadOnly}
          />

          {/* Emphasized login prompt (Modal) */}
          {loginPromptHook.loginPromptConfig?.show && loginPromptHook.loginPromptConfig.variant === 'emphasized' && (
            <LoginPrompt
              variant="emphasized"
              message={loginPromptHook.loginPromptConfig.message}
              subMessage={loginPromptHook.loginPromptConfig.subMessage}
              onLogin={loginPromptHook.handleLogin}
              onDismiss={loginPromptHook.handleDismissLoginPrompt}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}
