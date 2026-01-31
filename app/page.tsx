'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import RotatingText from './components/RotatingText'
import GlareHover from './components/GlareHover'
import CardSwap, { Card } from './components/CardSwap'
// import GridDistortion from './components/GridDistortion'
import TextType from './components/TextType'
import { AnimatedThemeToggler } from './components/AnimatedThemeToggler'
import GlowButton from './components/GlowButton'
import {
  initializeSession,
  initializeSessionFromAuth,
  sendMessageAndTrigger,
  replyToConversation,
  getConversationMessages,
  getUserConversations,
  getCurrentUser,
  signOut
} from './actions'
import ConversationPicker from './components/ConversationPicker'
import LoginPrompt, { shouldShowLoginPrompt, dismissLoginPrompt } from './components/LoginPrompt'
import ProjectReminder from './components/ProjectReminder'

// ============ Types ============
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  stage?: 'discovery' | 'clarify' | 'formulation' | 'generating' | 'deploying' | 'complete'
}

// ============ Animated Text Components ============
function BlurRevealText({
  text,
  delay = 0,
}: {
  text: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
      animate={isInView ? { opacity: 1, filter: 'blur(0px)', y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ display: 'inline-block' }}
    >
      {text}
    </motion.span>
  )
}

// ============ Counter Animation ============
function AnimatedCounter({ target, duration = 2, suffix = '' }: { target: number; duration?: number; suffix?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const end = target
    const incrementTime = (duration * 1000) / end
    const timer = setInterval(() => {
      start += 1
      setCount(start)
      if (start >= end) clearInterval(timer)
    }, incrementTime)
    return () => clearInterval(timer)
  }, [isInView, target, duration])

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  )
}

// ============ Scroll Indicator ============
function ScrollIndicator({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'absolute',
            bottom: 48,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            zIndex: 10,
          }}
        >
          <span style={{
            fontSize: 12,
            color: 'var(--gray-400)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}>
            往下探索
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 1,
              height: 32,
              background: 'linear-gradient(to bottom, var(--gray-400), transparent)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============ Feature Card ============
function FeatureCard({
  number,
  title,
  description,
  delay = 0
}: {
  number: string
  title: string
  description: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        padding: '40px 0',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div style={{ display: 'flex', gap: 40 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'var(--gray-400)',
        }}>
          {number}
        </span>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: 20,
            fontWeight: 500,
            marginBottom: 12,
            letterSpacing: '-0.02em',
          }}>
            {title}
          </h3>
          <p style={{
            fontSize: 15,
            color: 'var(--gray-500)',
            lineHeight: 1.7,
            maxWidth: 480,
          }}>
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ============ Process Step ============
function ProcessStep({
  step,
  title,
  active,
  completed
}: {
  step: number
  title: string
  active: boolean
  completed: boolean
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      opacity: active || completed ? 1 : 0.4,
      transition: 'opacity 0.3s ease',
    }}>
      <div style={{
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontFamily: 'var(--font-mono)',
        border: '1px solid',
        borderColor: active ? 'var(--black)' : 'var(--border-color)',
        background: completed ? 'var(--black)' : 'transparent',
        color: completed ? 'var(--white)' : 'var(--black)',
        transition: 'all 0.3s ease',
      }}>
        {completed ? '✓' : step}
      </div>
      <span style={{
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        color: active ? 'var(--black)' : 'var(--gray-500)',
      }}>
        {title}
      </span>
    </div>
  )
}

// ============ FAQ Item ============
function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
  index,
  delay = 0
}: {
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void
  index: number
  delay?: number
}) {
  const itemRef = useRef(null)
  const isInView = useInView(itemRef, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={itemRef}
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      style={{
        display: 'grid',
        gridTemplateColumns: '80px 1fr',
        gap: 0,
        borderBottom: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Large Number */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 28,
        borderRight: '1px solid var(--border-color)',
        position: 'relative',
      }}>
        <motion.span
          animate={{
            color: isOpen ? 'var(--black)' : 'var(--gray-300)',
            scale: isOpen ? 1.1 : 1,
          }}
          transition={{ duration: 0.3 }}
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 32,
            fontWeight: 300,
            letterSpacing: '-0.05em',
            lineHeight: 1,
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </motion.span>
        {/* Animated line indicator */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: isOpen ? 1 : 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 2,
            background: 'var(--black)',
            transformOrigin: 'top',
          }}
        />
      </div>

      {/* Content */}
      <div>
        <motion.button
          onClick={onClick}
          whileHover={{ x: 4 }}
          transition={{ duration: 0.2 }}
          style={{
            width: '100%',
            padding: '24px 24px 24px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{
            fontSize: 17,
            fontWeight: 500,
            lineHeight: 1.4,
            flex: 1,
            color: 'var(--black)',
          }}>
            {question}
          </span>
          <motion.div
            animate={{
              rotate: isOpen ? 180 : 0,
            }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              style={{ color: isOpen ? 'var(--black)' : 'var(--gray-400)' }}
            >
              <path
                d="M2 5L7 10L12 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.3, delay: 0.1 }
              }}
              style={{ overflow: 'hidden' }}
            >
              <motion.div
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                exit={{ y: -10 }}
                transition={{ duration: 0.3 }}
                style={{
                  padding: '0 24px 28px 24px',
                }}
              >
                {/* Decorative line */}
                <div style={{
                  width: 40,
                  height: 1,
                  background: 'var(--gray-200)',
                  marginBottom: 16,
                }} />
                <p style={{
                  fontSize: 15,
                  color: 'var(--gray-500)',
                  lineHeight: 1.8,
                  maxWidth: '90%',
                }}>
                  {answer}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ============ Hero Section ============
// 自訂緩動函數 - 更絲滑的 Apple 風格過渡
const smoothEasing: [number, number, number, number] = [0.32, 0.72, 0, 1]

function HeroSection({
  onStartChat,
  inputValue,
  onInputChange,
  isChatActive
}: {
  onStartChat: () => void
  inputValue: string
  onInputChange: (value: string) => void
  isChatActive: boolean
}) {
  const [isFocused, setIsFocused] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleStartClick = () => {
    if (!inputValue.trim()) return
    setIsTransitioning(true)
    // 延遲調用以讓退場動畫開始
    setTimeout(() => {
      onStartChat()
    }, 150)
  }

  return (
    <motion.section
      initial={{ opacity: 1 }}
      animate={{
        opacity: isChatActive ? 0 : 1,
        scale: isChatActive ? 0.96 : 1,
        y: isChatActive ? -30 : 0,
        filter: isChatActive ? 'blur(8px)' : 'blur(0px)',
        pointerEvents: isChatActive ? 'none' : 'auto'
      }}
      transition={{
        duration: 0.5,
        ease: smoothEasing,
        opacity: { duration: 0.4, ease: smoothEasing },
        scale: { duration: 0.6, ease: smoothEasing },
        filter: { duration: 0.4 }
      }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        position: 'relative',
        willChange: 'transform, opacity, filter',
      }}
    >
      <motion.div
        animate={{
          opacity: isChatActive ? 0 : 1,
          scale: isChatActive ? 1.1 : 1,
        }}
        transition={{ duration: 0.6, ease: smoothEasing }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 30%, var(--gray-50) 0%, var(--white) 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 600,
        textAlign: 'center',
      }}>
        {/* 標題區塊 - 先退場 */}
        <motion.div
          animate={{
            opacity: isTransitioning || isChatActive ? 0 : 1,
            y: isTransitioning || isChatActive ? -40 : 0,
            scale: isTransitioning || isChatActive ? 0.95 : 1,
          }}
          transition={{
            duration: 0.4,
            ease: smoothEasing,
            delay: isTransitioning ? 0 : 0
          }}
          style={{ marginBottom: 48 }}
        >
          <h1 className="hero-title" style={{ textAlign: 'center' }}>
            <TextType
              texts={["告訴我你想做什麼"]}
              typingSpeed={75}
              pauseDuration={1500}
              showCursor
              cursorCharacter="_"
              deletingSpeed={50}
              cursorBlinkDuration={0.5}
            />
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: isTransitioning || isChatActive ? 0 : 1 }}
            transition={{ duration: 0.3, delay: isTransitioning ? 0 : 1.2 }}
            style={{
              fontSize: 15,
              color: 'var(--gray-500)',
              maxWidth: 400,
              margin: '16px auto 0',
              lineHeight: 1.7,
            }}
          >
            描述你的想法，AI 會幫你釐清需求、生成程式碼、部署上線
          </motion.p>
        </motion.div>

        {/* 輸入框區塊 - 稍後退場，有不同的動態 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{
            opacity: isTransitioning || isChatActive ? 0 : 1,
            y: isTransitioning || isChatActive ? 20 : 0,
            scale: isTransitioning || isChatActive ? 0.98 : 1,
          }}
          transition={{
            duration: 0.45,
            ease: smoothEasing,
            delay: isTransitioning ? 0.05 : 0.5
          }}
          style={{ position: 'relative' }}
        >
          <motion.div
            animate={{
              boxShadow: isFocused
                ? '0 0 0 1px var(--black), 0 8px 32px rgba(0,0,0,0.08)'
                : '0 0 0 1px var(--border-color), 0 2px 8px rgba(0,0,0,0.04)',
            }}
            transition={{ duration: 0.2 }}
            style={{ background: 'var(--white)', overflow: 'hidden' }}
          >
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="例如：一個線上訂餐系統..."
              rows={3}
              style={{
                width: '100%',
                padding: '24px',
                fontSize: 16,
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.6,
                background: 'transparent',
              }}
            />
            <div style={{
              padding: '12px 24px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--gray-50)',
            }}>
              <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                描述你的想法，點擊按鈕開始
              </span>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleStartClick}
                disabled={!inputValue.trim() || isTransitioning}
                style={{
                  padding: '8px 20px',
                  fontSize: 13,
                  fontWeight: 500,
                  background: inputValue.trim() ? 'var(--black)' : 'var(--gray-200)',
                  color: inputValue.trim() ? 'var(--white)' : 'var(--gray-400)',
                  border: 'none',
                  cursor: inputValue.trim() && !isTransitioning ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                }}
              >
                {isTransitioning ? '...' : '開始'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <ScrollIndicator visible={!isFocused && !inputValue && !isTransitioning} />
    </motion.section>
  )
}

// ============ Chat Section ============
interface SessionInfo {
  userId: string
  projectId: string
  conversationId: string
  currentTaskId?: string
  isAuthenticated?: boolean
  hasHistory?: boolean
  user?: {
    email?: string
    name?: string
    avatarUrl?: string
  }
}

interface ConversationItem {
  id: string
  projectId: string
  projectName: string
  lastMessage?: string
  messageCount: number
  updatedAt: string
  createdAt: string
}

function ChatSection({
  isActive,
  initialMessage,
  resumeConversationId,
  onBack
}: {
  isActive: boolean
  initialMessage: string
  resumeConversationId?: string | null
  onBack: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingStage, setTypingStage] = useState<'none' | 'dots' | 'message'>('none')
  const [currentStage, setCurrentStage] = useState<Message['stage']>('discovery')
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTimestamp, setLastTimestamp] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)  // 用於輪詢優化
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasInitialized = useRef(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 打字指示器：立即顯示 "..."，10 秒後顯示完整提示
  useEffect(() => {
    if (isTyping) {
      // 立即顯示 "..."
      setTypingStage('dots')
      // 10 秒後顯示完整提示
      typingTimerRef.current = setTimeout(() => {
        setTypingStage('message')
      }, 10000)
    } else {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current)
        typingTimerRef.current = null
      }
      setTypingStage('none')
    }
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current)
      }
    }
  }, [isTyping])

  // 自動調整輸入框高度
  const adjustTextareaHeight = useCallback(() => {
    const textarea = inputRef.current
    if (!textarea) return
    // 重置高度以獲得正確的 scrollHeight
    textarea.style.height = 'auto'
    // 限制最大高度為 200px（約 8 行）
    const maxHeight = 200
    const newHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = `${newHeight}px`
    // 如果超過最大高度，允許滾動
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [])

  // 對話選擇器相關狀態
  const [showConversationPicker, setShowConversationPicker] = useState(false)
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)

  // 登入提示相關狀態
  const [loginPromptConfig, setLoginPromptConfig] = useState<{
    show: boolean
    variant: 'subtle' | 'emphasized'
    message: string
    subMessage?: string
    promptId: string
  } | null>(null)

  // 獲取或創建 anonymousId
  const getAnonymousId = useCallback(async () => {
    // 先嘗試從 localStorage 獲取
    let anonymousId = localStorage.getItem('tellcraft_anonymous_id')

    if (!anonymousId) {
      // 嘗試從 Cookie 恢復
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
      // 創建新的
      anonymousId = crypto.randomUUID()
      localStorage.setItem('tellcraft_anonymous_id', anonymousId)
    }

    // 備份到 Cookie
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

  // 初始化會話
  useEffect(() => {
    if (!isActive || hasInitialized.current) return
    hasInitialized.current = true

    const init = async () => {
      setIsInitializing(true)
      setError(null)

      const anonymousId = await getAnonymousId()

      // 優先嘗試從認證 session 初始化
      const authResult = await initializeSessionFromAuth({
        anonymousId, // 傳遞 anonymousId 用於帳號合併
        conversationId: resumeConversationId || undefined, // 恢復指定對話
        createNew: !!initialMessage && !resumeConversationId // 有初始消息且不是恢復對話時創建新對話
      })

      let session: SessionInfo
      let hasHistory = false

      if (authResult.success && authResult.data) {
        // 已登入用戶
        session = {
          userId: authResult.data.userId,
          projectId: authResult.data.projectId,
          conversationId: authResult.data.conversationId,
          isAuthenticated: true,
          hasHistory: authResult.data.hasHistory,
          user: authResult.data.user
        }
        hasHistory = authResult.data.hasHistory
      } else {
        // 未登入，使用匿名模式
        const result = await initializeSession({
          anonymousId,
          conversationId: resumeConversationId || undefined, // 恢復指定對話
          createNew: !!initialMessage && !resumeConversationId // 有初始消息且不是恢復對話時創建新對話
        })

        if (!result.success || !result.data) {
          setError(result.error || '初始化失敗')
          setIsInitializing(false)
          return
        }

        session = {
          userId: result.data.userId,
          projectId: result.data.projectId,
          conversationId: result.data.conversationId,
          isAuthenticated: false,
          hasHistory: result.data.hasHistory
        }
        hasHistory = result.data.hasHistory
      }

      setSessionInfo(session)

      // 如果是恢復對話，加載歷史消息
      if (resumeConversationId) {
        const historyResult = await getConversationMessages({
          conversationId: session.conversationId
        })

        if (historyResult.success && historyResult.data) {
          const historyMessages: Message[] = historyResult.data.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp),
            stage: m.stage as Message['stage']
          }))
          setMessages(historyMessages)

          // 找到最後一條 AI 消息的 stage
          const lastAiMessage = historyMessages.filter(m => m.role === 'assistant').pop()
          if (lastAiMessage?.stage) {
            setCurrentStage(lastAiMessage.stage)
          }
        }
        setIsInitializing(false)
        return
      }

      // 如果有初始消息，發送它
      if (initialMessage) {
        // 樂觀更新：先顯示用戶消息
        const userMsg: Message = {
          id: crypto.randomUUID(),
          role: 'user',
          content: initialMessage,
          timestamp: new Date()
        }

        // 立即顯示預告消息，減少感知等待時間
        const previewMsg: Message = {
          id: 'preview-analyzing',
          role: 'assistant',
          content: '正在分析您的需求，請稍候...',
          timestamp: new Date(),
          stage: 'clarify'
        }

        setMessages([userMsg, previewMsg])
        setIsInitializing(false) // 消息顯示後立即隱藏初始化提示
        setIsTyping(true)
        setCurrentStage('clarify')

        // 發送消息並觸發 Inngest
        const sendResult = await sendMessageAndTrigger({
          conversationId: session.conversationId,
          content: initialMessage,
          userId: session.userId,
          projectId: session.projectId
        })

        if (!sendResult.success) {
          setError(sendResult.error || '發送消息失敗')
        }
        return // 已經設置 isInitializing = false，直接返回
      } else if (hasHistory) {
        // 沒有初始消息但有歷史對話 → 自動恢復最近對話
        const historyResult = await getConversationMessages({
          conversationId: session.conversationId
        })

        if (historyResult.success && historyResult.data) {
          const historyMessages: Message[] = historyResult.data.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp),
            stage: m.stage as Message['stage']
          }))
          setMessages(historyMessages)

          // 找到最後一條 AI 消息的 stage
          const lastAiMessage = historyMessages.filter(m => m.role === 'assistant').pop()
          if (lastAiMessage?.stage) {
            setCurrentStage(lastAiMessage.stage)
          }

          // 設定最後時間戳用於輪詢
          if (historyMessages.length > 0) {
            const lastMsg = historyMessages[historyMessages.length - 1]
            setLastTimestamp(lastMsg.timestamp.toISOString())
          }
        }
      }

      setIsInitializing(false)
    }

    init()
  }, [isActive, initialMessage, resumeConversationId, getAnonymousId])

  // 輪詢獲取新消息（智慧退避機制 + updated_at 優化）
  useEffect(() => {
    if (!sessionInfo) return

    let pollInterval = 3000 // 基本間隔 3 秒
    const MAX_INTERVAL = 15000 // 最大間隔 15 秒
    const MIN_INTERVAL = 3000 // 最小間隔 3 秒
    let timeoutId: NodeJS.Timeout | null = null
    let isPolling = true
    let currentUpdatedAt = lastUpdatedAt  // 本地追蹤，避免 closure 問題

    const poll = async () => {
      if (!isPolling) return

      const result = await getConversationMessages({
        conversationId: sessionInfo.conversationId,
        afterTimestamp: lastTimestamp || undefined,
        lastUpdatedAt: currentUpdatedAt || undefined  // 傳入上次的 updated_at
      })

      if (result.success && result.data) {
        // 更新 updatedAt 追蹤
        if (result.data.updatedAt) {
          currentUpdatedAt = result.data.updatedAt
          setLastUpdatedAt(result.data.updatedAt)
        }

        const newMessages = result.data.messages

        if (newMessages.length > 0) {
          // 有新消息，重置間隔
          pollInterval = MIN_INTERVAL

          // 轉換消息格式
          const formattedMessages: Message[] = newMessages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp),
            stage: m.stage as Message['stage']
          }))

          // 更新消息列表（合併現有消息和新消息）
          // 使用 content + role 去重，避免樂觀更新和後端 ID 不一致
          setMessages(prev => {
            // 如果收到真正的 AI 回覆，移除預告消息
            const hasRealAiMessage = formattedMessages.some(m => m.role === 'assistant')
            const filteredPrev = hasRealAiMessage
              ? prev.filter(m => m.id !== 'preview-analyzing')
              : prev

            const existingKeys = new Set(filteredPrev.map(m => `${m.role}:${m.content}`))
            const uniqueNewMessages = formattedMessages.filter(m => !existingKeys.has(`${m.role}:${m.content}`))
            if (uniqueNewMessages.length > 0) {
              // 找到最後一條 AI 消息，更新 stage
              const lastAiMessage = [...filteredPrev, ...uniqueNewMessages]
                .filter(m => m.role === 'assistant')
                .pop()
              if (lastAiMessage?.stage) {
                setCurrentStage(lastAiMessage.stage)
              }
              // 如果有新的 AI 消息，停止 typing
              if (uniqueNewMessages.some(m => m.role === 'assistant')) {
                setIsTyping(false)
              }
              return [...filteredPrev, ...uniqueNewMessages]
            }
            return filteredPrev
          })

          // 更新最後時間戳
          const latestTimestamp = newMessages[newMessages.length - 1]?.timestamp
          if (latestTimestamp) {
            setLastTimestamp(latestTimestamp)
          }
        } else {
          // 沒有新消息，逐漸增加間隔（指數退避）
          pollInterval = Math.min(pollInterval * 1.5, MAX_INTERVAL)
        }

        // 更新 taskId
        if (result.data.currentTaskId) {
          setSessionInfo(prev => prev ? {
            ...prev,
            currentTaskId: result.data!.currentTaskId
          } : null)
        }

        // 對話已完成，停止輪詢
        if (result.data.isComplete) {
          isPolling = false
          return
        }
      }

      // 安排下一次輪詢
      if (isPolling) {
        timeoutId = setTimeout(poll, pollInterval)
      }
    }

    // 立即執行一次
    poll()

    return () => {
      isPolling = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [sessionInfo?.conversationId, lastTimestamp, lastUpdatedAt])

  // 滾動到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 重置狀態當離開
  useEffect(() => {
    if (!isActive) {
      hasInitialized.current = false
      setMessages([])
      setSessionInfo(null)
      setLastTimestamp(null)
      setLastUpdatedAt(null)
      setCurrentStage('discovery')
      setError(null)
      setShowConversationPicker(false)
      setConversations([])
      setLoginPromptConfig(null)
    }
  }, [isActive])

  // 登入提示觸發邏輯
  useEffect(() => {
    if (!sessionInfo || sessionInfo.isAuthenticated) return

    // 對話 3 輪後顯示 subtle 提示
    const userMessageCount = messages.filter(m => m.role === 'user').length
    if (userMessageCount === 3) {
      const promptId = 'after_3_rounds'
      if (shouldShowLoginPrompt(promptId)) {
        setLoginPromptConfig({
          show: true,
          variant: 'subtle',
          message: '登入後可隨時恢復這個對話',
          promptId
        })
      }
    }

    // 生成程式碼時顯示 subtle 提示
    if (currentStage === 'generating') {
      const promptId = 'generating_code'
      if (shouldShowLoginPrompt(promptId)) {
        setLoginPromptConfig({
          show: true,
          variant: 'subtle',
          message: '登入後可在任何裝置查看生成進度',
          promptId
        })
      }
    }

    // 部署成功時顯示 emphasized 提示
    if (currentStage === 'complete') {
      const promptId = 'deploy_success'
      if (shouldShowLoginPrompt(promptId)) {
        setLoginPromptConfig({
          show: true,
          variant: 'emphasized',
          message: '你的網站已上線',
          subMessage: '登入以管理和更新你的網站，並在任何裝置訪問。',
          promptId
        })
      }
    }
  }, [messages.length, currentStage, sessionInfo])

  // 處理選擇歷史對話
  const handleSelectConversation = async (conversationId: string) => {
    if (!sessionInfo) return

    setShowConversationPicker(false)
    setIsInitializing(true)

    // 載入選中對話的消息
    const result = await getConversationMessages({ conversationId })
    if (result.success && result.data) {
      const formattedMessages: Message[] = result.data.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
        stage: m.stage as Message['stage']
      }))
      setMessages(formattedMessages)

      // 更新 session 中的 conversationId
      setSessionInfo({
        ...sessionInfo,
        conversationId,
        currentTaskId: result.data.currentTaskId
      })

      // 設定最後時間戳
      if (formattedMessages.length > 0) {
        const lastMsg = formattedMessages[formattedMessages.length - 1]
        setLastTimestamp(lastMsg.timestamp.toISOString())
      }
    }

    setIsInitializing(false)
  }

  // 處理開始新對話
  const handleStartNewConversation = () => {
    setShowConversationPicker(false)
    // 新對話已在 initializeSession 中創建，直接開始即可
  }

  // 處理登入
  const handleLogin = () => {
    // 將 anonymousId 傳到登入頁面
    const anonymousId = localStorage.getItem('tellcraft_anonymous_id')
    if (anonymousId) {
      window.location.href = `/auth/login?anonymousId=${encodeURIComponent(anonymousId)}`
    } else {
      window.location.href = '/auth/login'
    }
  }

  // 處理關閉登入提示
  const handleDismissLoginPrompt = () => {
    if (loginPromptConfig) {
      dismissLoginPrompt(loginPromptConfig.promptId)
      setLoginPromptConfig(null)
    }
  }

  const handleSend = async () => {
    if (!sessionInfo || !input.trim() || isTyping) return

    const content = input.trim()
    setInput('')
    // 重置輸入框高度
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    // 樂觀更新
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    // 判斷是首次消息還是多輪對話回覆
    if (sessionInfo.currentTaskId) {
      // 多輪對話回覆
      const result = await replyToConversation({
        conversationId: sessionInfo.conversationId,
        projectId: sessionInfo.projectId,
        taskId: sessionInfo.currentTaskId,
        content
      })

      if (!result.success) {
        setError(result.error || '發送失敗')
        setIsTyping(false)
      }
    } else {
      // 首次消息
      const result = await sendMessageAndTrigger({
        conversationId: sessionInfo.conversationId,
        content,
        userId: sessionInfo.userId,
        projectId: sessionInfo.projectId
      })

      if (!result.success) {
        setError(result.error || '發送失敗')
        setIsTyping(false)
      }
    }
  }

  const stages = [
    { key: 'discovery', title: '需求探索' },
    { key: 'clarify', title: '細節釐清' },
    { key: 'formulation', title: '規格確認' },
    { key: 'generating', title: '程式生成' },
    { key: 'complete', title: '已上線' },
  ]

  // 將後端 stage 值映射到前端顯示的 stage
  const mapBackendStageToFrontend = (backendStage: string | undefined): string => {
    if (!backendStage) return 'discovery'

    // 初始階段
    if (backendStage === 'init') return 'discovery'

    // PRD Discovery 和釐清階段
    if (backendStage.includes('prd_discovery') ||
        backendStage === 'clarify_question' ||
        backendStage === 'batch_confirm' ||
        backendStage === 'clarify_summary') return 'clarify'

    // Spec Discovery 和規格階段
    if (backendStage.includes('spec_') ||
        backendStage === 'formulation' ||
        backendStage.includes('feature') ||
        backendStage.includes('schema')) return 'formulation'

    // 程式生成階段
    if (backendStage === 'generating' ||
        backendStage.includes('code') ||
        backendStage.includes('build')) return 'generating'

    // 完成/部署階段
    if (backendStage === 'completed' ||
        backendStage === 'complete' ||
        backendStage.includes('deploy')) return 'complete'

    // 預設返回 clarify（大多數對話都在釐清階段）
    return 'clarify'
  }

  const mappedStage = mapBackendStageToFrontend(currentStage)
  const currentStageIndex = stages.findIndex(s => s.key === mappedStage)

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
          transition={{
            duration: 0.5,
            ease: smoothEasing,
            scale: { duration: 0.6, ease: smoothEasing }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--white)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            willChange: 'transform, opacity',
          }}
        >
          <motion.header
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: smoothEasing }}
            style={{
              height: 64,
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px',
              background: 'var(--white)',
              position: 'relative',
            }}
          >
            {/* 左側：返回 + Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <button
                onClick={onBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 14,
                  color: 'var(--gray-500)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 0',
                }}
              >
                <span style={{ fontSize: 18 }}>←</span>
                返回
              </button>
              <div style={{ width: 1, height: 24, background: 'var(--border-color)' }} />
              <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em' }}>
                Tellcraft
              </span>
            </div>

            {/* 中間：步驟指示器（絕對定位居中）*/}
            <div style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 24,
            }}>
              {stages.map((stage, i) => (
                <ProcessStep
                  key={stage.key}
                  step={i + 1}
                  title={stage.title}
                  active={mappedStage === stage.key}
                  completed={i < currentStageIndex}
                />
              ))}
            </div>

            {/* 右側：主題切換 + 用戶資訊 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* 主題切換 */}
              <AnimatedThemeToggler />
              {/* 用戶資訊 */}
              {sessionInfo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {sessionInfo.isAuthenticated ? (
                    <>
                      {sessionInfo.user?.avatarUrl && (
                        <img
                          src={sessionInfo.user.avatarUrl}
                          alt=""
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            border: '1px solid var(--border-color)',
                          }}
                        />
                      )}
                      <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                        {sessionInfo.user?.name || sessionInfo.user?.email?.split('@')[0] || '用戶'}
                      </span>
                      <GlowButton href="/dashboard" variant="outline" size="sm">
                        儀表板
                      </GlowButton>
                    </>
                  ) : (
                    <GlowButton onClick={handleLogin} variant="outline" size="sm">
                      登入
                    </GlowButton>
                  )}
                </div>
              )}
            </div>
          </motion.header>

          {/* Subtle 登入提示 */}
          {loginPromptConfig?.show && loginPromptConfig.variant === 'subtle' && (
            <LoginPrompt
              variant="subtle"
              message={loginPromptConfig.message}
              onLogin={handleLogin}
              onDismiss={handleDismissLoginPrompt}
              autoHideAfter={15000}
            />
          )}

          {/* 對話選擇器 */}
          {showConversationPicker && (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <ConversationPicker
                conversations={conversations}
                onSelectConversation={handleSelectConversation}
                onStartNewConversation={handleStartNewConversation}
                isLoading={isLoadingConversations}
              />
            </div>
          )}

          {/* 對話內容 */}
          {!showConversationPicker && (
          <div style={{ flex: 1, overflow: 'auto', padding: '32px 0' }}>
            <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>
              {/* 錯誤提示 */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '12px 16px',
                    background: '#FEE2E2',
                    border: '1px solid #FECACA',
                    color: '#DC2626',
                    fontSize: 14,
                    marginBottom: 20,
                  }}
                >
                  {error}
                </motion.div>
              )}

              {/* 初始化中 */}
              {isInitializing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 0',
                    color: 'var(--gray-500)',
                    fontSize: 14,
                  }}
                >
                  正在初始化...
                </motion.div>
              )}

              {messages.map((message, index) => {
                // 只對最後 3 條消息應用進場動畫，避免長列表時新消息延遲過久
                const isRecentMessage = index >= messages.length - 3
                const animationDelay = isRecentMessage ? (index - (messages.length - 3)) * 0.05 : 0

                return (
                <motion.div
                  key={message.id}
                  initial={isRecentMessage ? { opacity: 0, y: 15 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: animationDelay }}
                  style={{
                    marginBottom: 28,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: message.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  {message.role === 'system' ? (
                    <div style={{
                      fontSize: 13,
                      color: 'var(--gray-500)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 0'
                    }}>
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        style={{ width: 6, height: 6, background: 'var(--black)', display: 'inline-block' }}
                      />
                      {message.content}
                    </div>
                  ) : (
                    <>
                      <div style={{
                        fontSize: 11,
                        color: 'var(--gray-400)',
                        marginBottom: 8,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {message.role === 'user' ? '你' : '泰爾'}
                      </div>
                      <div style={{
                        padding: '18px 22px',
                        background: message.role === 'user' ? 'var(--black)' : 'var(--gray-50)',
                        color: message.role === 'user' ? 'var(--white)' : 'var(--black)',
                        border: '1px solid',
                        borderColor: message.role === 'user' ? 'var(--black)' : 'var(--border-color)',
                        maxWidth: '85%',
                        fontSize: 15,
                        lineHeight: 1.75,
                      }}>
                        {message.role === 'user' ? (
                          <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
                        ) : (
                          <div className="markdown-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
                )
              })}

              {typingStage !== 'none' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ marginBottom: 28 }}
                >
                  <div style={{
                    fontSize: 11,
                    color: 'var(--gray-400)',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>泰爾</div>
                  <div style={{
                    padding: '18px 22px',
                    background: 'var(--gray-50)',
                    border: '1px solid var(--border-color)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: typingStage === 'message' ? 10 : 4,
                  }}>
                    {typingStage === 'message' && (
                      <span style={{ fontSize: 14, color: 'var(--gray-500)' }}>問題正在釐清中，請稍等</span>
                    )}
                    {[0, 1, 2].map(i => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        style={{
                          width: typingStage === 'message' ? 5 : 6,
                          height: typingStage === 'message' ? 5 : 6,
                          borderRadius: '50%',
                          background: 'var(--gray-400)',
                          display: 'inline-block'
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          )}

          {/* 輸入區域 - 對話選擇器時隱藏 */}
          {!showConversationPicker && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{ borderTop: '1px solid var(--border-color)', padding: '20px 24px', background: 'var(--white)' }}
          >
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    adjustTextareaHeight()
                  }}
                  onKeyDown={(e) => {
                    // Enter 送出，Shift+Enter 換行
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (input.trim() && !isTyping && !isInitializing && sessionInfo) {
                        handleSend()
                      }
                    }
                  }}
                  placeholder="輸入訊息...（Shift+Enter 換行）"
                  rows={1}
                  disabled={isInitializing || !sessionInfo}
                  style={{
                    flex: 1,
                    resize: 'none',
                    padding: '14px 18px',
                    fontSize: 15,
                    border: '1px solid var(--border-color)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    transition: 'border-color 0.2s ease, height 0.15s ease',
                    opacity: isInitializing || !sessionInfo ? 0.5 : 1,
                    minHeight: 48,
                    maxHeight: 200,
                    overflowY: 'hidden',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--black)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping || isInitializing || !sessionInfo}
                  style={{
                    padding: '0 28px',
                    height: 48,
                    fontSize: 14,
                    fontWeight: 500,
                    border: '1px solid var(--black)',
                    background: !input.trim() || isTyping || isInitializing || !sessionInfo ? 'var(--gray-100)' : 'var(--black)',
                    color: !input.trim() || isTyping || isInitializing || !sessionInfo ? 'var(--gray-400)' : 'var(--white)',
                    cursor: !input.trim() || isTyping || isInitializing || !sessionInfo ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  送出
                </motion.button>
              </div>
            </div>
          </motion.div>
          )}

          {/* Emphasized 登入提示 (Modal) */}
          {loginPromptConfig?.show && loginPromptConfig.variant === 'emphasized' && (
            <LoginPrompt
              variant="emphasized"
              message={loginPromptConfig.message}
              subMessage={loginPromptConfig.subMessage}
              onLogin={handleLogin}
              onDismiss={handleDismissLoginPrompt}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============ Use Cases Section (SEO) ============
function UseCasesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const useCases = [
    {
      audience: '新創團隊',
      title: '快速驗證產品概念',
      description: '從構想到 MVP 上線，用對話完成整個開發流程。專注在商業驗證，而不是技術實作。',
      examples: ['SaaS 訂閱平台', '內部管理系統', '客戶服務入口']
    },
    {
      audience: '電商賣家',
      title: '打造專屬購物網站',
      description: '不再依賴平台抽成，建立自己的品牌官網。AI 幫你處理金流串接、庫存管理、訂單系統。',
      examples: ['品牌官網', '預購系統', '會員商城']
    },
    {
      audience: '接案工作者',
      title: '倍增專案產能',
      description: '把重複的開發工作交給 AI，專注在客戶溝通與設計。一個人也能接多個專案。',
      examples: ['客製化網站', '活動報名頁', '企業形象官網']
    },
    {
      audience: '中小企業',
      title: '數位轉型不求人',
      description: '不需要養工程團隊，用對話就能建置內部系統。降低 IT 成本，加速業務流程。',
      examples: ['進銷存系統', '人資管理', 'CRM 系統']
    }
  ]

  return (
    <section ref={ref} style={{ padding: '80px 24px', background: 'var(--gray-50)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 80 }}
        >
          <div style={{
            fontSize: 11,
            color: 'var(--gray-400)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 16,
          }}>
            Use Cases
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 400,
            letterSpacing: '-0.03em',
            lineHeight: 1.3,
            marginBottom: 16,
          }}>
            適合{' '}
            <RotatingText
              texts={['新創團隊', '電商賣家', '接案工作者', '中小企業']}
              rotationInterval={2500}
              staggerDuration={0.03}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              style={{
                color: 'var(--black)',
                fontWeight: 500,
                borderBottom: '2px solid var(--black)',
                paddingBottom: 2
              }}
            />
          </h2>
          <p style={{ fontSize: 16, color: 'var(--gray-500)', maxWidth: 500, margin: '0 auto' }}>
            無論你是誰，只要有想法，就能用對話把它實現
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 24,
        }}>
          {useCases.map((useCase, i) => (
            <motion.div
              key={useCase.audience}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              style={{ height: '100%' }}
            >
              <GlareHover
                height="100%"
                background="var(--white)"
                borderColor="var(--border-color)"
                glareColor="#000000"
                glareOpacity={0.08}
                glareAngle={-30}
                glareSize={200}
                transitionDuration={800}
              >
                <article style={{ padding: 32, height: '100%' }}>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--gray-400)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 12,
                  }}>
                    {useCase.audience}
                  </div>
                  <h3 style={{
                    fontSize: 18,
                    fontWeight: 500,
                    marginBottom: 12,
                    letterSpacing: '-0.02em',
                  }}>
                    {useCase.title}
                  </h3>
                  <p style={{
                    fontSize: 14,
                    color: 'var(--gray-500)',
                    lineHeight: 1.7,
                    marginBottom: 20,
                  }}>
                    {useCase.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {useCase.examples.map(example => (
                      <span
                        key={example}
                        style={{
                          fontSize: 12,
                          padding: '4px 10px',
                          background: 'var(--gray-50)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--gray-600)',
                        }}
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </article>
              </GlareHover>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============ How It Works Section (SEO) ============
function HowItWorksSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const steps = [
    {
      number: '01',
      title: '描述你的想法',
      description: '用自然語言告訴 AI 你想做什麼，就像跟朋友聊天一樣。',
    },
    {
      number: '02',
      title: 'AI 主動釐清',
      description: 'AI 發現模糊地帶，主動提問確保規格明確可執行。',
    },
    {
      number: '03',
      title: '確認規格',
      description: '完整的系統規格呈現給你確認，確保認知一致。',
    },
    {
      number: '04',
      title: '生成程式碼',
      description: '前端、後端、資料庫一次到位，自動測試確保品質。',
    },
    {
      number: '05',
      title: '部署上線',
      description: '自動部署到雲端，收到專屬網址，網站立即可用。',
    }
  ]

  return (
    <section ref={ref} style={{ background: 'var(--black)', overflow: 'hidden' }}>
      {/* Dramatic alternating blocks */}
      {steps.map((step, i) => {
        const isEven = i % 2 === 0
        return (
          <motion.div
            key={step.number}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: i * 0.15 }}
            style={{
              display: 'grid',
              gridTemplateColumns: isEven ? '1fr 1fr' : '1fr 1fr',
              minHeight: 200,
              background: isEven ? 'var(--black)' : 'var(--white)',
              color: isEven ? 'var(--white)' : 'var(--black)',
              position: 'relative',
            }}
          >
            {/* Number side */}
            <motion.div
              initial={{ x: isEven ? -100 : 100, opacity: 0 }}
              animate={isInView ? { x: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isEven ? 'flex-end' : 'flex-start',
                padding: '48px 40px',
                order: isEven ? 0 : 1,
                borderRight: isEven ? `1px solid var(--gray-600)` : 'none',
                borderLeft: !isEven ? `1px solid var(--gray-200)` : 'none',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(80px, 15vw, 140px)',
                fontWeight: 200,
                lineHeight: 0.85,
                letterSpacing: '-0.05em',
                opacity: 0.15,
              }}>
                {step.number}
              </span>
            </motion.div>

            {/* Content side */}
            <motion.div
              initial={{ x: isEven ? 100 : -100, opacity: 0 }}
              animate={isInView ? { x: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.3 + i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '48px 40px',
                order: isEven ? 1 : 0,
                maxWidth: 500,
                marginLeft: isEven ? 0 : 'auto',
                marginRight: isEven ? 'auto' : 0,
              }}
            >
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                opacity: 0.5,
                letterSpacing: '0.15em',
                marginBottom: 16,
              }}>
                STEP {step.number}
              </div>
              <h3 style={{
                fontSize: 'clamp(24px, 4vw, 32px)',
                fontWeight: 500,
                marginBottom: 16,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}>
                {step.title}
              </h3>
              <p style={{
                fontSize: 16,
                opacity: 0.7,
                lineHeight: 1.7,
              }}>
                {step.description}
              </p>
            </motion.div>

            {/* Connecting line */}
            {i < steps.length - 1 && (
              <motion.div
                initial={{ scaleY: 0 }}
                animate={isInView ? { scaleY: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.15 }}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 1,
                  height: 40,
                  background: isEven ? 'var(--gray-600)' : 'var(--gray-300)',
                  transformOrigin: 'top',
                  zIndex: 10,
                }}
              />
            )}
          </motion.div>
        )
      })}
    </section>
  )
}

// ============ Stats Section (SEO) ============
function StatsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const stats = [
    { value: 90, suffix: '%', label: '開發時間節省', description: '相比傳統開發流程' },
    { value: 24, suffix: '小時', label: '平均上線時間', description: '從想法到部署完成' },
    { value: 0, suffix: '行', label: '需要撰寫的程式碼', description: '全程對話完成開發' },
    { value: 100, suffix: '%', label: '程式碼擁有權', description: '可隨時匯出完整原始碼' },
  ]

  return (
    <section ref={ref} style={{ padding: '80px 24px', background: 'var(--black)', color: 'var(--white)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
          }}>
            讓數字說話
          </h2>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 48,
        }}>
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{
                fontSize: 'clamp(40px, 6vw, 56px)',
                fontWeight: 300,
                letterSpacing: '-0.03em',
                marginBottom: 8,
                fontFamily: 'var(--font-mono)',
              }}>
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div style={{
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 4,
              }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: 13,
                color: 'var(--gray-500)',
              }}>
                {stat.description}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============ Features Comparison Section (SEO) ============
function ComparisonSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const comparisons = [
    { feature: '需要程式基礎', traditional: '必須', tellcraft: '不需要' },
    { feature: '開發週期', traditional: '數週至數月', tellcraft: '數小時至數天' },
    { feature: '需求變更成本', traditional: '高（需重新開發）', tellcraft: '低（對話即可修改）' },
    { feature: '團隊規模', traditional: '需多人協作', tellcraft: '一人即可' },
    { feature: '維護成本', traditional: '持續投入人力', tellcraft: '低成本年費' },
    { feature: '程式碼擁有權', traditional: '視合約而定', tellcraft: '100% 擁有' },
  ]

  return (
    <section ref={ref} style={{ padding: '80px 24px', background: 'var(--white)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <div style={{
            fontSize: 11,
            color: 'var(--gray-400)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 16,
          }}>
            Comparison
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 400,
            letterSpacing: '-0.03em',
            marginBottom: 16,
          }}>
            傳統開發 vs Tellcraft
          </h2>
          <p style={{ fontSize: 16, color: 'var(--gray-500)' }}>
            為什麼越來越多人選擇 AI 驅動開發
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ border: '1px solid var(--border-color)', overflow: 'hidden' }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            background: 'var(--gray-50)',
            borderBottom: '1px solid var(--border-color)',
            padding: '16px 24px',
            fontSize: 12,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            <span>項目</span>
            <span style={{ textAlign: 'center' }}>傳統開發</span>
            <span style={{ textAlign: 'center', color: 'var(--black)' }}>Tellcraft</span>
          </div>
          {comparisons.map((row, i) => (
            <div
              key={row.feature}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr',
                padding: '20px 24px',
                borderBottom: i < comparisons.length - 1 ? '1px solid var(--border-color)' : 'none',
                fontSize: 14,
              }}
            >
              <span style={{ fontWeight: 500 }}>{row.feature}</span>
              <span style={{ textAlign: 'center', color: 'var(--gray-500)' }}>{row.traditional}</span>
              <span style={{ textAlign: 'center', fontWeight: 500 }}>{row.tellcraft}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ============ Showcase Section ============
function ShowcaseSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const showcases = [
    {
      title: '線上訂餐平台',
      category: '電商',
      description: '完整的餐廳訂餐系統，包含菜單管理、購物車、金流串接、訂單追蹤。',
      stats: '3 天完成',
      color: '#f5f5f5'
    },
    {
      title: 'SaaS 訂閱管理',
      category: 'B2B',
      description: '訂閱制軟體的用戶管理後台，支援方案切換、帳單管理、用量統計。',
      stats: '5 天完成',
      color: '#fafafa'
    },
    {
      title: '活動報名系統',
      category: '服務',
      description: '支援多場次、名額限制、候補機制、自動發送確認信。',
      stats: '2 天完成',
      color: '#f8f8f8'
    },
    {
      title: '會員制電商',
      category: '電商',
      description: '分級會員制度、點數累積、專屬優惠、推薦獎勵機制。',
      stats: '4 天完成',
      color: '#f5f5f5'
    }
  ]

  return (
    <section ref={ref} style={{ padding: '80px 24px', background: 'var(--white)', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 80,
          alignItems: 'center',
        }}>
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div style={{
              fontSize: 11,
              color: 'var(--gray-400)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 16,
            }}>
              Showcase
            </div>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 400,
              letterSpacing: '-0.03em',
              lineHeight: 1.3,
              marginBottom: 24,
            }}>
              <BlurRevealText text="用戶實際打造的" delay={0} />
              <br />
              <BlurRevealText text="各種應用" delay={0.15} />
            </h2>
            <p style={{
              fontSize: 16,
              color: 'var(--gray-500)',
              lineHeight: 1.7,
              marginBottom: 32,
              maxWidth: 400,
            }}>
              這些都是真實用戶透過對話完成的專案。
              從電商平台到 SaaS 系統，各種類型都能實現。
            </p>
            <div style={{
              display: 'flex',
              gap: 32,
              paddingTop: 24,
              borderTop: '1px solid var(--border-color)',
            }}>
              <div>
                <div style={{
                  fontSize: 32,
                  fontWeight: 300,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '-0.02em',
                }}>
                  <AnimatedCounter target={50} suffix="+" />
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>專案上線</div>
              </div>
              <div>
                <div style={{
                  fontSize: 32,
                  fontWeight: 300,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '-0.02em',
                }}>
                  <AnimatedCounter target={12} suffix="種" />
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>產業類型</div>
              </div>
            </div>
          </motion.div>

          {/* Right: Card Swap */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 450,
              position: 'relative',
            }}
          >
            <CardSwap
              width={360}
              height={280}
              cardDistance={45}
              verticalDistance={55}
              delay={2500}
              pauseOnHover={true}
              skewAmount={3}
              easing="linear"
            >
              {showcases.map((item, i) => (
                <Card key={i}>
                  <div style={{
                    padding: 28,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: item.color,
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 16,
                    }}>
                      <span style={{
                        fontSize: 11,
                        padding: '4px 8px',
                        background: 'var(--white)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--gray-500)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        {item.category}
                      </span>
                      <span style={{
                        fontSize: 12,
                        color: 'var(--gray-400)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {item.stats}
                      </span>
                    </div>
                    <h3 style={{
                      fontSize: 20,
                      fontWeight: 500,
                      marginBottom: 12,
                      letterSpacing: '-0.02em',
                    }}>
                      {item.title}
                    </h3>
                    <p style={{
                      fontSize: 14,
                      color: 'var(--gray-500)',
                      lineHeight: 1.6,
                      flex: 1,
                    }}>
                      {item.description}
                    </p>
                    <div style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: '1px solid var(--border-color)',
                      fontSize: 13,
                      color: 'var(--gray-400)',
                    }}>
                      Hover 暫停 · 點擊查看詳情
                    </div>
                  </div>
                </Card>
              ))}
            </CardSwap>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ============ FAQ Section (SEO Critical) ============
function FAQSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: 'Tellcraft 適合沒有程式基礎的人嗎？',
      answer: '完全適合。Tellcraft 的核心理念就是讓任何人都能用對話完成軟體開發。你只需要清楚描述你想要什麼功能，AI 會處理所有技術細節。整個過程就像跟朋友聊天一樣自然。'
    },
    {
      question: '生成的程式碼品質如何？可以自己修改嗎？',
      answer: 'Tellcraft 生成的程式碼遵循業界最佳實踐，使用 Next.js、React、TypeScript 等主流技術棧。你擁有 100% 的程式碼所有權，可以隨時匯出完整原始碼，自行修改或交給工程師維護。'
    },
    {
      question: '如果我的需求很複雜怎麼辦？',
      answer: 'AI 會透過多輪對話逐步釐清你的需求。即使是複雜的系統，也會被拆解成可執行的小規格。如果某個需求超出目前能力範圍，AI 會明確告知並建議替代方案。'
    },
    {
      question: '網站上線後，我可以修改嗎？',
      answer: '當然可以。你可以隨時回來用對話描述修改需求，AI 會理解現有系統架構並做出精準變更。小幅修改通常只需要幾句對話就能完成。'
    },
    {
      question: '資料安全嗎？你們會存取我的用戶資料嗎？',
      answer: '你的應用程式資料儲存在獨立的資料庫中，Tellcraft 不會存取或分析你的用戶資料。我們只處理開發過程中的對話內容，且所有通訊都經過加密。'
    },
    {
      question: '如果我想停用服務，我的網站會怎樣？',
      answer: '你可以隨時匯出完整的原始碼和資料庫，自行部署到其他平台。我們不會鎖定你的資料或程式碼。取消訂閱後，會有 30 天的緩衝期讓你完成遷移。'
    },
    {
      question: 'Tellcraft 跟其他無代碼工具有什麼不同？',
      answer: '傳統無代碼工具限制在預設的模板和功能中。Tellcraft 則是真正生成客製化程式碼，沒有功能天花板。你得到的是完整的應用程式，而不是受限於平台的半成品。'
    },
    {
      question: '支援哪些類型的網站或應用程式？',
      answer: '目前支援 Web 應用程式，包含：電商網站、SaaS 平台、管理後台、會員系統、預約系統等。暫不支援手機原生 App，但可以建置手機友善的網頁應用。'
    }
  ]

  return (
    <section
      ref={ref}
      style={{
        padding: '80px 24px',
        background: 'var(--white)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: 80,
        right: '10%',
        width: 200,
        height: 200,
        border: '1px solid var(--gray-100)',
        borderRadius: '50%',
        opacity: 0.5,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: 120,
        left: '5%',
        width: 100,
        height: 100,
        border: '1px solid var(--gray-100)',
        opacity: 0.5,
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header with asymmetric layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '80px 1fr',
          gap: 0,
          marginBottom: 64,
        }}>
          <div style={{
            borderRight: '1px solid var(--border-color)',
            paddingRight: 24,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                fontSize: 11,
                color: 'var(--gray-400)',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
              }}
            >
              FAQ
            </motion.span>
          </div>
          <div style={{ paddingLeft: 24 }}>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{
                fontSize: 'clamp(32px, 5vw, 48px)',
                fontWeight: 300,
                letterSpacing: '-0.03em',
                marginBottom: 16,
                lineHeight: 1.1,
              }}
            >
              常見問題
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                fontSize: 15,
                color: 'var(--gray-500)',
                maxWidth: 400,
              }}
            >
              還有疑問？直接在上方輸入框詢問 AI
            </motion.p>
          </div>
        </div>

        {/* FAQ Items */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
            borderRadius: 0,
          }}
        >
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              index={i}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === i}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              delay={i * 0.05}
            />
          ))}
        </motion.div>

        {/* Bottom accent */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={{
            height: 1,
            background: 'linear-gradient(90deg, var(--black) 0%, transparent 100%)',
            marginTop: 48,
            transformOrigin: 'left',
            maxWidth: 200,
          }}
        />
      </div>
    </section>
  )
}

// ============ Testimonial Section ============
function TestimonialSection() {
  const quotes = [
    {
      text: '以前要花幾週開發的功能，現在對話幾輪就完成了。省下的時間可以專注在業務拓展。',
      author: '林先生',
      role: '新創團隊創辦人',
      company: '食品電商'
    },
    {
      text: '終於不用再跟工程師解釋需求了，AI 比人更懂我在說什麼。修改也很快，幾句話就搞定。',
      author: '陳小姐',
      role: '品牌營運總監',
      company: '服飾品牌'
    },
    {
      text: '原本只是想做個簡單的網站，結果做出了完整的 SaaS 系統。現在每月有穩定的訂閱收入。',
      author: '王先生',
      role: '獨立開發者',
      company: '線上課程平台'
    }
  ]

  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % quotes.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [quotes.length])

  return (
    <section style={{ padding: '80px 24px', background: 'var(--black)', color: 'var(--white)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            fontSize: 11,
            color: 'var(--gray-500)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 48,
          }}
        >
          Testimonials
        </motion.div>

        <div style={{ minHeight: 240, position: 'relative' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <blockquote style={{
                fontSize: 'clamp(20px, 3vw, 28px)',
                fontWeight: 300,
                lineHeight: 1.6,
                marginBottom: 32,
                letterSpacing: '-0.02em',
              }}>
                「{quotes[current].text}」
              </blockquote>
              <div style={{ fontSize: 14, color: 'var(--gray-400)' }}>
                <span style={{ color: 'var(--white)', fontWeight: 500 }}>{quotes[current].author}</span>
                {' · '}
                {quotes[current].role}
                {' · '}
                {quotes[current].company}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48 }}>
          {quotes.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: 8,
                height: 8,
                background: i === current ? 'var(--white)' : 'var(--gray-600)',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// ============ CTA Section ============
function CTASection({ onStartChat }: { onStartChat: () => void }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} style={{ padding: '100px 24px', background: 'var(--white)', textAlign: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        style={{ maxWidth: 600, margin: '0 auto' }}
      >
        <h2 style={{
          fontSize: 'clamp(28px, 5vw, 40px)',
          fontWeight: 400,
          letterSpacing: '-0.03em',
          lineHeight: 1.3,
          marginBottom: 24,
        }}>
          準備好開始了嗎？
        </h2>
        <p style={{
          fontSize: 16,
          color: 'var(--gray-500)',
          lineHeight: 1.7,
          marginBottom: 40,
        }}>
          不需要信用卡，不需要技術背景。<br />
          現在就告訴 AI 你想做什麼。
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
            setTimeout(onStartChat, 500)
          }}
          style={{
            padding: '18px 48px',
            fontSize: 15,
            fontWeight: 500,
            background: 'var(--black)',
            color: 'var(--white)',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          開始對話
        </motion.button>
      </motion.div>
    </section>
  )
}

// ============ Footer (SEO) ============
function Footer() {
  return (
    <footer style={{ padding: '64px 24px 48px', borderTop: '1px solid var(--border-color)', background: 'var(--gray-50)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 48,
          marginBottom: 48,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>Tellcraft</div>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.6 }}>
              AI 驅動的自動化開發平台。<br />
              用對話打造你的軟體產品。
            </p>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)' }}>
              產品
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="#how-it-works" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>功能介紹</a>
              <a href="#use-cases" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>使用場景</a>
              <a href="#faq" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>常見問題</a>
            </nav>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)' }}>
              資源
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="#" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>使用文件</a>
              <a href="#" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>API 文件</a>
              <a href="#" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>部落格</a>
            </nav>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)' }}>
              關於
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="#" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>隱私權政策</a>
              <a href="#" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>服務條款</a>
              <a href="#" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>聯絡我們</a>
            </nav>
          </div>
        </div>

        <div style={{
          paddingTop: 32,
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>
            © 2026 Tellcraft. All rights reserved.
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
            Made with AI in Taiwan 
          </div>
        </div>
      </div>
    </footer>
  )
}

// ============ Main Component ============
function HomeContent() {
  const searchParams = useSearchParams()
  const [isChatActive, setIsChatActive] = useState(false)
  const [heroInput, setHeroInput] = useState('')
  const [initialMessage, setInitialMessage] = useState('')
  const [resumeConversationId, setResumeConversationId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{
    userId: string
    email?: string
    name?: string
    avatarUrl?: string
  } | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [anonymousId, setAnonymousId] = useState<string | undefined>(undefined)

  // 獲取 anonymousId（用於提醒組件）
  useEffect(() => {
    const id = localStorage.getItem('tellcraft_anonymous_id') || undefined
    setAnonymousId(id)
  }, [])

  // 檢查 URL 參數，如果有 conversation 則恢復對話
  useEffect(() => {
    const conversationId = searchParams.get('conversation')
    if (conversationId) {
      setResumeConversationId(conversationId)
      setIsChatActive(true)
    }
  }, [searchParams])

  // 載入當前用戶狀態
  useEffect(() => {
    const loadUser = async () => {
      const result = await getCurrentUser()
      if (result.success && result.data) {
        setCurrentUser(result.data)
      }
      setIsLoadingUser(false)
    }
    loadUser()
  }, [])

  // 登出處理
  const handleSignOut = async () => {
    await signOut()
    setCurrentUser(null)
    window.location.reload()
  }

  const handleStartChat = useCallback(() => {
    if (heroInput.trim()) {
      setInitialMessage(heroInput)
      setIsChatActive(true)
    }
  }, [heroInput])

  const handleBackToHome = useCallback(() => {
    setIsChatActive(false)
    setHeroInput('')
    setInitialMessage('')
    setResumeConversationId(null)
    // 清除 URL 參數
    window.history.replaceState({}, '', '/')
  }, [])

  const handleFocusInput = useCallback(() => {
    const input = document.querySelector('textarea')
    if (input) {
      input.focus()
    }
  }, [])

  // 處理提醒的繼續對話
  const handleContinueFromReminder = useCallback((conversationId: string) => {
    setResumeConversationId(conversationId)
    setIsChatActive(true)
  }, [])

  return (
    <main>
      {/* Project Reminder - 提醒用戶有未完成的專案 (隱藏於 Chat 模式) */}
      {!isChatActive && (
        <ProjectReminder
          anonymousId={anonymousId}
          onContinue={handleContinueFromReminder}
        />
      )}

      {/* Theme Toggler - Fixed Top Left (隱藏於 Chat 模式) */}
      <AnimatePresence mode="wait">
        {!isChatActive && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.35, ease: smoothEasing }}
            style={{
              position: 'fixed',
              top: 20,
              left: 20,
              zIndex: 1000,
            }}
          >
            <AnimatedThemeToggler />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Button - Fixed Top Right (隱藏於 Chat 模式) */}
      <AnimatePresence mode="wait">
        {!isChatActive && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.35, ease: smoothEasing }}
            style={{
              position: 'fixed',
              top: 20,
              right: 20,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
        {isLoadingUser ? (
          <div style={{ width: 80, height: 36 }} />
        ) : currentUser ? (
          // 已登入 - 顯示用戶資訊
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {currentUser.avatarUrl && (
              <img
                src={currentUser.avatarUrl}
                alt=""
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '1px solid var(--border-color)',
                }}
              />
            )}
            <span style={{ fontSize: 14, color: 'var(--gray-600)' }}>
              {currentUser.name || currentUser.email?.split('@')[0] || '用戶'}
            </span>
            <GlowButton href="/dashboard" variant="outline" size="sm">
              儀表板
            </GlowButton>
            <GlowButton onClick={handleSignOut} variant="outline" size="sm">
              登出
            </GlowButton>
          </div>
        ) : (
          // 未登入 - 顯示登入按鈕
          <GlowButton href="/auth/login" variant="outline" size="sm">
            登入
          </GlowButton>
        )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <HeroSection
        onStartChat={handleStartChat}
        inputValue={heroInput}
        onInputChange={setHeroInput}
        isChatActive={isChatActive}
      />

      {/* Chat Overlay */}
      <ChatSection
        isActive={isChatActive}
        initialMessage={initialMessage}
        resumeConversationId={resumeConversationId}
        onBack={handleBackToHome}
      />

      {/* SEO Content Sections */}
      <UseCasesSection />
      <HowItWorksSection />
      <StatsSection />
      <ComparisonSection />
      <ShowcaseSection />
      <FAQSection />
      <TestimonialSection />
      <CTASection onStartChat={handleFocusInput} />
      <Footer />
    </main>
  )
}

// 用 Suspense 包裹以支援 useSearchParams
export default function Home() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        載入中...
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
