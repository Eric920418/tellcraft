'use client'

import { useState, useRef, useEffect, useCallback, Suspense, useDeferredValue } from 'react'
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
// signOut moved to VPS auth flow
import {
  initializeSession as vpsInitializeSession,
  getConversationMessages as vpsGetConversationMessages,
  replyToConversation as vpsReplyToConversation,
  sendMessage as vpsSendMessage,
} from './lib/vps-api'
import { getAuthToken } from './hooks/useAuth'
import ConversationPicker from './components/ConversationPicker'
import LoginPrompt, { shouldShowLoginPrompt, dismissLoginPrompt } from './components/LoginPrompt'
import { useAuth } from './hooks/useAuth'
import ProjectReminder from './components/ProjectReminder'
import SplitLayout from './components/uiux/SplitLayout'
import SpecGenerationView from './components/SpecGenerationView'
import PreviewPanel from './components/uiux/PreviewPanel'
import DeviceSwitcher, { type DeviceType, getDeviceWidth } from './components/uiux/DeviceSwitcher'
import TemplatePicker from './components/uiux/TemplatePicker'
import { convertToPreviewHtml } from './lib/tsx-to-preview'
import { getTemplateById } from './actions/templates'
import type { Template } from './lib/templates'

// ============ Types ============
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  stage?: 'init' | 'init_progress' | 'discovery' | 'clarify' | 'prd_discovery_complete' | 'formulation_start' | 'formulation_progress' | 'formulation' | 'uiux' | 'uiux_template_picker' | 'generating' | 'deploying' | 'complete'
  progress?: { current: number; total: number; step: string }
  // UIUX 模板系統擴展
  layoutHint?: 'default' | 'split' | 'full_preview'
  richContent?: {
    type: 'template_picker' | 'design_preview' | 'code_preview' | 'quality_gate_report'
    data: Record<string, unknown>
  }
  // 樂觀更新標記：pending 表示尚未確認儲存到 DB
  pending?: boolean
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

// ============ Process Step ============
function ProcessStep({
  step,
  title,
  active,
  completed,
  isLast = false
}: {
  step: number
  title: string
  active: boolean
  completed: boolean
  isLast?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 步驟容器 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        position: 'relative',
        padding: '6px 0',
      }}>
        {/* 方形指示器 */}
        <div style={{
          width: 20,
          height: 20,
          position: 'relative',
          flexShrink: 0,
        }}>
          {/* 背景填充 */}
          <motion.div
            initial={false}
            animate={{
              backgroundColor: completed ? 'var(--black)' : 'transparent',
            }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              inset: 0,
            }}
          />

          {/* 角落邊框 - 左上 */}
          <motion.span
            initial={false}
            animate={{
              width: active || isHovered ? '60%' : '40%',
              borderColor: completed || active ? 'var(--black)' : 'var(--gray-300)',
            }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '40%',
              borderLeft: '1px solid',
              borderTop: '1px solid',
            }}
          />

          {/* 角落邊框 - 右上 */}
          <motion.span
            initial={false}
            animate={{
              height: active || isHovered ? '60%' : '40%',
              borderColor: completed || active ? 'var(--black)' : 'var(--gray-300)',
            }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '40%',
              borderRight: '1px solid',
              borderTop: '1px solid',
            }}
          />

          {/* 角落邊框 - 左下 */}
          <motion.span
            initial={false}
            animate={{
              height: active || isHovered ? '60%' : '40%',
              borderColor: completed || active ? 'var(--black)' : 'var(--gray-300)',
            }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '40%',
              borderLeft: '1px solid',
              borderBottom: '1px solid',
            }}
          />

          {/* 角落邊框 - 右下 */}
          <motion.span
            initial={false}
            animate={{
              width: active || isHovered ? '60%' : '40%',
              borderColor: completed || active ? 'var(--black)' : 'var(--gray-300)',
            }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              height: '40%',
              borderRight: '1px solid',
              borderBottom: '1px solid',
            }}
          />

          {/* 內容 */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AnimatePresence mode="wait">
              {completed ? (
                <motion.svg
                  key="check"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--white)"
                  strokeWidth="3"
                  strokeLinecap="square"
                >
                  <polyline points="20 6 9 17 4 12" />
                </motion.svg>
              ) : (
                <motion.span
                  key="number"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    fontFamily: 'var(--font-mono)',
                    color: active ? 'var(--black)' : 'var(--gray-400)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {step}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 標題 */}
        <motion.span
          initial={false}
          animate={{
            color: completed || active ? 'var(--black)' : 'var(--gray-400)',
          }}
          transition={{ duration: 0.2 }}
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </motion.span>
      </div>

      {/* 連接線 */}
      {!isLast && (
        <div style={{
          width: 24,
          height: 1,
          marginLeft: 10,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* 背景線（虛線效果） */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(90deg, var(--gray-200) 0, var(--gray-200) 3px, transparent 3px, transparent 6px)',
          }} />
          {/* 進度線 */}
          <motion.div
            initial={false}
            animate={{
              scaleX: completed ? 1 : 0,
              transformOrigin: 'left',
            }}
            transition={{ duration: 0.4, delay: completed ? 0.1 : 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--black)',
            }}
          />
        </div>
      )}
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
  // 延遲更新按鈕狀態，優化 INP
  const deferredInput = useDeferredValue(input)
  const [isTyping, setIsTyping] = useState(false)
  const [typingStage, setTypingStage] = useState<'none' | 'dots' | 'message'>('none')
  const [currentStage, setCurrentStage] = useState<Message['stage']>('discovery')
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)  // 初始為 true 避免閃爍
  const [error, setError] = useState<string | null>(null)
  const [lastTimestamp, setLastTimestamp] = useState<string | null>(null)

  // VPS JWT Auth Hook
  const auth = useAuth()
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)  // 用於輪詢優化
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)  // 追蹤用戶是否在底部附近
  const isProgrammaticScrollRef = useRef(false)  // 程式控制滾動時暫時禁用檢測
  const hasInitialized = useRef(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isComposingRef = useRef(false)  // 追蹤 IME 輸入法狀態
  const codePreviewContainerRef = useRef<HTMLDivElement>(null)
  const [codePreviewContainerWidth, setCodePreviewContainerWidth] = useState(0)

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

  // 自動調整輸入框高度（使用 rAF 避免阻塞輸入）
  const adjustTextareaHeight = useCallback(() => {
    requestAnimationFrame(() => {
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
    })
  }, [])

  // 對話選擇器相關狀態
  const [showConversationPicker, setShowConversationPicker] = useState(false)
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [isLoadingConversations, _setIsLoadingConversations] = useState(false)

  // 登入提示相關狀態
  const [loginPromptConfig, setLoginPromptConfig] = useState<{
    show: boolean
    variant: 'subtle' | 'emphasized'
    message: string
    subMessage?: string
    promptId: string
  } | null>(null)

  // UIUX 分屏佈局相關狀態
  const [layoutMode, setLayoutMode] = useState<'default' | 'split'>('default')
  const [isLayoutTransitioning, setIsLayoutTransitioning] = useState(false)
  const layoutModeRef = useRef(layoutMode)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [codePreviewDevice, setCodePreviewDevice] = useState<DeviceType>('desktop')

  // Code Preview 容器尺寸追蹤（用於 iframe 縮放）
  useEffect(() => {
    const el = codePreviewContainerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      setCodePreviewContainerWidth(el.clientWidth - 48) // 扣除 padding
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // 監聽訊息的 layoutHint 或 UIUX 相關 stage，切換佈局模式
  useEffect(() => {
    let targetMode: 'default' | 'split' = 'default'

    // 方法 1: 根據 layoutHint
    const lastHintMessage = [...messages].reverse().find(m => m.layoutHint)
    if (lastHintMessage?.layoutHint) {
      targetMode = lastHintMessage.layoutHint === 'split' ? 'split' : 'default'
    } else {
      // 方法 2: 根據 UIUX 相關的 stage（處理直接跳轉或頁面刷新的情況）
      const hasUiuxMessage = messages.some(m =>
        m.stage?.startsWith('uiux') ||
        m.richContent?.type === 'template_picker'
      )
      if (hasUiuxMessage) {
        targetMode = 'split'
      }
    }

    // 如果模式要改變，加入過渡動畫
    if (targetMode !== layoutModeRef.current) {
      setIsLayoutTransitioning(true)
      // 先等舊介面淡出，再切換模式
      const transitionTimer = setTimeout(() => {
        layoutModeRef.current = targetMode
        setLayoutMode(targetMode)
        // 等新介面淡入後結束過渡
        setTimeout(() => {
          setIsLayoutTransitioning(false)
        }, 400)
      }, 300)
      return () => clearTimeout(transitionTimer)
    }

  }, [messages])

  // 載入選中的模板詳情
  useEffect(() => {
    if (!selectedTemplateId) {
      setSelectedTemplate(null)
      return
    }

    const loadTemplate = async () => {
      const result = await getTemplateById(selectedTemplateId)
      if (result.success && result.data) {
        setSelectedTemplate(result.data)
      }
    }
    loadTemplate()
  }, [selectedTemplateId])

  // 處理模板選擇
  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId)
  }, [])

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
      const token = getAuthToken()

      // 使用 VPS API 初始化會話
      const result = await vpsInitializeSession({
        anonymousId,
        conversationId: resumeConversationId || undefined,
        createNew: !!initialMessage && !resumeConversationId,
        token: token || undefined
      })

      if (!result.success || !result.data) {
        setError(result.error || '初始化失敗')
        setIsInitializing(false)
        return
      }

      const session: SessionInfo = {
        userId: result.data.userId,
        projectId: result.data.projectId,
        conversationId: result.data.conversationId,
        isAuthenticated: !!token,
        hasHistory: result.data.messages.length > 0
      }
      const hasHistory = result.data.messages.length > 0

      setSessionInfo(session)

      // 如果是恢復對話，加載歷史消息
      if (resumeConversationId) {
        const historyResult = await vpsGetConversationMessages({
          conversationId: session.conversationId,
          token: token || undefined
        })

        if (historyResult.success && historyResult.data) {
          const historyMessages: Message[] = historyResult.data.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp),
            stage: m.stage as Message['stage'],
            progress: m.progress as Message['progress'],
            layoutHint: (m as unknown as Record<string, unknown>).layoutHint as Message['layoutHint'],
            richContent: (m as unknown as Record<string, unknown>).richContent as Message['richContent']
          }))
          setMessages(historyMessages)

          // 重要：恢復 currentTaskId，否則後續發消息會走錯誤的流程
          if (historyResult.data.currentTaskId) {
            setSessionInfo(prev => prev ? {
              ...prev,
              currentTaskId: historyResult.data!.currentTaskId
            } : prev)
          }

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
        // 樂觀更新：先顯示用戶消息（標記為 pending）
        const userMsg: Message = {
          id: crypto.randomUUID(),
          role: 'user',
          content: initialMessage,
          timestamp: new Date(),
          pending: true  // 標記為待確認
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

        // 發送消息到 VPS（觸發 Orchestrator）
        const sendResult = await vpsSendMessage({
          conversationId: session.conversationId,
          message: initialMessage,
          projectId: session.projectId,
          token: token || undefined
        })

        if (!sendResult.success) {
          setError(sendResult.error || '發送消息失敗')
        } else if (sendResult.data?.messageId) {
          // 更新樂觀訊息的 ID 為實際的 DB ID，避免重複顯示
          setMessages(prev => prev.map(m =>
            m.id === userMsg.id ? { ...m, id: sendResult.data!.messageId } : m
          ))
        }
        return // 已經設置 isInitializing = false，直接返回
      } else if (hasHistory) {
        // 沒有初始消息但有歷史對話 → 自動恢復最近對話
        const historyResult = await vpsGetConversationMessages({
          conversationId: session.conversationId,
          token: token || undefined
        })

        if (historyResult.success && historyResult.data) {
          const historyMessages: Message[] = historyResult.data.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp),
            stage: m.stage as Message['stage'],
            progress: m.progress as Message['progress']
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

      const token = getAuthToken()
      const result = await vpsGetConversationMessages({
        conversationId: sessionInfo.conversationId,
        lastUpdatedAt: currentUpdatedAt || undefined,  // 傳入上次的 updated_at
        token: token || undefined
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const formattedMessages: Message[] = newMessages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp),
            stage: m.stage as Message['stage'],
            progress: m.progress as Message['progress'],
            // UIUX 模板系統欄位
            layoutHint: m.layoutHint as Message['layoutHint'],
            richContent: m.richContent as Message['richContent'],
          }))

          // 找出最新的 AI 消息 stage（在 setMessages 外部計算，確保狀態更新正確）
          const latestAiMessageWithStage = [...formattedMessages]
            .reverse()
            .find(m => m.role === 'assistant' && m.stage)

          // 更新 stage（在 setMessages 外部調用，避免 React 批處理問題）
          if (latestAiMessageWithStage?.stage) {
            setCurrentStage(latestAiMessageWithStage.stage)
          }

          // 更新消息列表（合併現有消息和新消息）
          // 使用 ID 去重，並對相同內容的進度訊息進行合併（更新進度值）
          setMessages(prev => {
            // 如果收到真正的 AI 回覆，移除預告消息
            const hasRealAiMessage = formattedMessages.some(m => m.role === 'assistant')
            const filteredPrev = hasRealAiMessage
              ? prev.filter(m => m.id !== 'preview-analyzing')
              : prev

            // 使用 ID 去重
            const existingIds = new Set(filteredPrev.map(m => m.id))
            const uniqueNewMessages = formattedMessages.filter(m => !existingIds.has(m.id))

            if (uniqueNewMessages.length > 0) {
              // 如果有新的 AI 消息（非進度訊息），停止 typing
              // 進度訊息（init_progress, formulation_start, formulation_progress）不應該停止打字指示器
              const hasNonProgressAiMessage = uniqueNewMessages.some(m =>
                m.role === 'assistant' &&
                !['init_progress', 'formulation_start', 'formulation_progress'].includes(m.stage || '')
              )
              if (hasNonProgressAiMessage) {
                setIsTyping(false)
              }

              // 合併訊息：
              // 1. 用 DB 訊息替換 pending 的樂觀訊息（相同內容）
              // 2. AI 進度訊息只保留最新的

              // 先處理 pending 訊息的替換
              const updatedPrev = [...filteredPrev]
              const newMessagesToAdd: Message[] = []

              for (const newMsg of uniqueNewMessages) {
                if (newMsg.role === 'user') {
                  // 找是否有 pending 的用戶訊息有相同內容
                  const pendingIndex = updatedPrev.findIndex(m =>
                    m.role === 'user' && m.pending && m.content === newMsg.content
                  )
                  if (pendingIndex !== -1) {
                    // 用 DB 訊息替換 pending 訊息
                    updatedPrev[pendingIndex] = newMsg
                  } else {
                    // 沒有對應的 pending 訊息，加入新訊息
                    newMessagesToAdd.push(newMsg)
                  }
                } else {
                  newMessagesToAdd.push(newMsg)
                }
              }

              // 合併剩餘的新訊息
              const combined = [...updatedPrev, ...newMessagesToAdd]
              const progressMap = new Map<string, { index: number; msg: Message }>()
              const result: Message[] = []

              for (const msg of combined) {
                // 用戶訊息直接保留
                if (msg.role === 'user') {
                  result.push(msg)
                  continue
                }

                // AI 進度訊息：相同內容只保留最新的進度值
                if (msg.progress) {
                  const key = msg.content
                  const existing = progressMap.get(key)
                  if (existing) {
                    result[existing.index] = msg
                    progressMap.set(key, { index: existing.index, msg })
                  } else {
                    progressMap.set(key, { index: result.length, msg })
                    result.push(msg)
                  }
                  continue
                }

                // 其他 AI 訊息：直接加入
                result.push(msg)
              }

              return result
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

        // 對話已完成，停止輪詢並自動進入 UIUX 模式
        if (result.data.isComplete) {
          isPolling = false
          // 3 秒後自動進入 UIUX 模式
          setTimeout(() => {
            setCurrentStage('uiux')
          }, 3000)
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

  // 滾動到底部（只在用戶處於底部附近時才自動滾動）
  useEffect(() => {
    if (isNearBottomRef.current) {
      isProgrammaticScrollRef.current = true
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      // 滾動動畫完成後重置 flag
      setTimeout(() => {
        isProgrammaticScrollRef.current = false
      }, 500)
    }
  }, [messages, typingStage])

  // 處理滾動事件，判斷用戶是否在底部附近
  const handleChatScroll = useCallback(() => {
    // 程式控制滾動時不更新狀態
    if (isProgrammaticScrollRef.current) return

    const container = chatScrollRef.current
    if (!container) return

    // 檢查是否在底部附近（距離底部 100px 以內）
    const threshold = 100
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    isNearBottomRef.current = distanceFromBottom < threshold
  }, [])

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
      setIsInitializing(true)  // 重置為 true，下次進入時直接顯示初始化中
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
    const token = getAuthToken()
    const result = await vpsGetConversationMessages({ conversationId, token: token || undefined })
    if (result.success && result.data) {
      const formattedMessages: Message[] = result.data.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
        stage: m.stage as Message['stage'],
            progress: m.progress as Message['progress']
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

  // 進入儀表板（先同步 cookie 再跳轉）
  const handleDashboard = async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      window.location.href = '/auth/login?next=/dashboard'
      return
    }

    try {
      const res = await fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (res.ok) {
        window.location.href = '/dashboard'
      } else {
        localStorage.removeItem('auth_token')
        window.location.href = '/auth/login?next=/dashboard'
      }
    } catch {
      window.location.href = '/dashboard'
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
    // 直接清空 DOM 值（修復中文輸入法問題）
    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.style.height = 'auto'
    }

    // 樂觀更新（標記為 pending）
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      pending: true  // 標記為待確認，輪詢時會被 DB 訊息替換
    }
    // 用戶發送訊息後強制滾動到底部
    isNearBottomRef.current = true
    isProgrammaticScrollRef.current = true

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    // 延遲滾動，確保 DOM 已更新
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      // 滾動動畫完成後重置 flag
      setTimeout(() => {
        isProgrammaticScrollRef.current = false
      }, 500)
    }, 50)

    // 判斷是首次消息還是多輪對話回覆
    const token = getAuthToken()
    if (sessionInfo.currentTaskId) {
      // 多輪對話回覆
      const result = await vpsReplyToConversation({
        conversationId: sessionInfo.conversationId,
        projectId: sessionInfo.projectId,
        taskId: sessionInfo.currentTaskId,
        message: content,
        token: token || undefined
      })

      if (!result.success) {
        setError(result.error || '發送失敗')
        setIsTyping(false)
      } else if (result.data?.messageId) {
        // 更新樂觀訊息的 ID 為實際的 DB ID，避免重複顯示
        setMessages(prev => prev.map(m =>
          m.id === userMessage.id ? { ...m, id: result.data!.messageId } : m
        ))
      }
    } else {
      // 首次消息
      const result = await vpsSendMessage({
        conversationId: sessionInfo.conversationId,
        message: content,
        projectId: sessionInfo.projectId,
        token: token || undefined
      })

      if (!result.success) {
        setError(result.error || '發送失敗')
        setIsTyping(false)
      } else if (result.data?.messageId) {
        // 更新樂觀訊息的 ID 為實際的 DB ID，避免重複顯示
        setMessages(prev => prev.map(m =>
          m.id === userMessage.id ? { ...m, id: result.data!.messageId } : m
        ))
      }
    }
  }

  // 發送指定內容的訊息（用於按鈕觸發）
  const handleSendMessage = async (content: string) => {
    if (!sessionInfo || !content.trim() || isTyping) return

    // 樂觀更新
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      pending: true
    }
    isNearBottomRef.current = true
    isProgrammaticScrollRef.current = true

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => {
        isProgrammaticScrollRef.current = false
      }, 500)
    }, 50)

    const token = getAuthToken()
    if (sessionInfo.currentTaskId) {
      const result = await vpsReplyToConversation({
        conversationId: sessionInfo.conversationId,
        projectId: sessionInfo.projectId,
        taskId: sessionInfo.currentTaskId,
        message: content.trim(),
        token: token || undefined,
      })
      if (!result.success) {
        setError(result.error || '發送失敗')
        setIsTyping(false)
      }
    } else {
      const result = await vpsSendMessage({
        conversationId: sessionInfo.conversationId,
        message: content.trim(),
        projectId: sessionInfo.projectId,
        token: token || undefined,
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

    // 初始階段（需求探索）
    if (backendStage === 'init' || backendStage === 'init_progress') return 'discovery'

    // PRD Discovery 和釐清階段（細節釐清）
    if (backendStage.includes('prd_discovery') ||
        backendStage === 'clarify_question' ||
        backendStage === 'batch_confirm' ||
        backendStage === 'clarify_summary') return 'clarify'

    // Formulation 和 Spec 階段（規格確認）
    // 注意：formulation_progress 和 spec_clarify_complete 都應該在這裡
    if (backendStage.includes('formulation') ||
        backendStage.includes('spec_') ||
        backendStage.includes('feature') ||
        backendStage.includes('schema') ||
        backendStage.includes('actions') ||
        backendStage.includes('isa')) return 'formulation'

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

  // 提取聊天面板的內容渲染函數（用於 SplitLayout）
  const renderChatContent = () => (
    <>
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
        <div
          ref={chatScrollRef}
          onScroll={handleChatScroll}
          style={{ flex: 1, overflow: 'auto', padding: layoutMode === 'split' ? '16px 0' : '32px 0' }}
        >
          <div style={{ maxWidth: layoutMode === 'split' ? '100%' : 680, margin: '0 auto', padding: layoutMode === 'split' ? '0 16px' : '0 24px' }}>
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

            {/* 計算是否顯示進度條 */}
            {(() => {
              // 找出最後一條訊息的階段
              const lastMessage = messages[messages.length - 1]
              const lastMessageStage = lastMessage?.stage || ''

              // 只有當最後一條訊息是進度訊息時才顯示進度條
              const isShowingProgress = ['init_progress', 'formulation_start', 'formulation_progress'].includes(lastMessageStage)

              // 分屏模式下只顯示 UIUX 相關的消息（隱藏之前的釐清歷史）
              const uiuxStartIndex = messages.findIndex(m =>
                m.stage?.startsWith('uiux') || m.richContent?.type === 'template_picker'
              )
              const displayMessages = layoutMode === 'split' && uiuxStartIndex !== -1
                ? messages.slice(uiuxStartIndex)  // 只顯示 UIUX 開始之後的消息
                : messages

              return displayMessages.map((message, index) => {
                const isRecentMessage = index >= displayMessages.length - 3
                const animationDelay = isRecentMessage ? (index - (displayMessages.length - 3)) * 0.05 : 0
                // 只在最後一條訊息上顯示進度條（且該訊息是進度訊息）
                const showProgressBar = isShowingProgress && index === displayMessages.length - 1

                return (
                <motion.div
                  key={message.id}
                  initial={isRecentMessage ? { opacity: 0, y: 15 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: animationDelay }}
                  style={{
                    marginBottom: layoutMode === 'split' ? 16 : 28,
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
                        padding: layoutMode === 'split' ? '12px 16px' : '18px 22px',
                        background: message.role === 'user' ? 'var(--black)' : 'var(--gray-50)',
                        color: message.role === 'user' ? 'var(--white)' : 'var(--black)',
                        border: '1px solid',
                        borderColor: message.role === 'user' ? 'var(--black)' : 'var(--border-color)',
                        maxWidth: layoutMode === 'split' ? '95%' : '85%',
                        fontSize: layoutMode === 'split' ? 14 : 15,
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

                      {/* 處理中的進度條 */}
                      {showProgressBar && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 }}
                          style={{
                            marginTop: 16,
                            maxWidth: layoutMode === 'split' ? '95%' : '85%',
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 16px',
                            background: 'var(--white)',
                            border: '1px solid var(--border-color)',
                          }}>
                            {/* 旋轉圖示 */}
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                              style={{
                                width: 18,
                                height: 18,
                                flexShrink: 0,
                              }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                              </svg>
                            </motion.div>
                            {/* 進度條 */}
                            <div style={{ flex: 1 }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 6,
                              }}>
                                <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                                  {message.progress?.step || (message.stage === 'init_progress' ? '正在分析需求...' : '正在產出規格文件...')}
                                </span>
                                {message.progress && (
                                  <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                                    {message.progress.current}/{message.progress.total}
                                  </span>
                                )}
                              </div>
                              <div style={{
                                height: 3,
                                background: 'var(--gray-100)',
                                overflow: 'hidden',
                                position: 'relative',
                              }}>
                                {message.progress ? (
                                  // 真實進度條
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(message.progress.current / message.progress.total) * 100}%` }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                    style={{
                                      height: '100%',
                                      background: 'var(--black)',
                                    }}
                                  />
                                ) : (
                                  // 無限進度條（沒有進度信息時）
                                  <motion.div
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{
                                      position: 'absolute',
                                      width: '50%',
                                      height: '100%',
                                      background: 'linear-gradient(90deg, transparent, var(--black), transparent)',
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* UIUX 模板選擇器 */}
                      {message.richContent?.type === 'template_picker' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          style={{ marginTop: 16, width: '100%' }}
                        >
                          <TemplatePicker
                            onPreview={handleTemplateSelect}
                            selectedId={selectedTemplateId || undefined}
                            columns={layoutMode === 'split' ? 1 : 2}
                            showCategories={false}
                          />
                        </motion.div>
                      )}
                    </>
                  )}
                </motion.div>
                )
              })
            })()}

            {/* 當有進度條顯示時，不顯示 typing indicator（避免重複） */}
            {typingStage !== 'none' && !['init_progress', 'formulation_start', 'formulation_progress'].includes(messages[messages.length - 1]?.stage || '') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                style={{ marginBottom: layoutMode === 'split' ? 16 : 28 }}
              >
                <div style={{
                  fontSize: 11,
                  color: 'var(--gray-400)',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>泰爾</div>
                <div style={{
                  padding: layoutMode === 'split' ? '12px 16px' : '18px 22px',
                  background: 'var(--gray-50)',
                  border: '1px solid var(--border-color)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  {[0, 1, 2].map(i => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      style={{
                        width: 6,
                        height: 6,
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

      {/* 輸入區域 */}
      {!showConversationPicker && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{ borderTop: '1px solid var(--border-color)', padding: layoutMode === 'split' ? '12px 16px' : '20px 24px', background: 'var(--white)' }}
        >
          <div style={{ maxWidth: layoutMode === 'split' ? '100%' : 680, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: layoutMode === 'split' ? 8 : 12, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  adjustTextareaHeight()
                }}
                onCompositionStart={() => {
                  isComposingRef.current = true
                }}
                onCompositionEnd={() => {
                  isComposingRef.current = false
                }}
                onKeyDown={(e) => {
                  if (isComposingRef.current) return
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (input.trim() && !isTyping && !isInitializing && sessionInfo) {
                      handleSend()
                    }
                  }
                }}
                placeholder={layoutMode === 'split' ? '輸入訊息...' : '輸入訊息...（Shift+Enter 換行）'}
                rows={1}
                disabled={isInitializing || !sessionInfo}
                style={{
                  flex: 1,
                  resize: 'none',
                  padding: layoutMode === 'split' ? '10px 14px' : '14px 18px',
                  fontSize: layoutMode === 'split' ? 14 : 15,
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  transition: 'border-color 0.2s ease, height 0.15s ease',
                  opacity: isInitializing || !sessionInfo ? 0.5 : 1,
                  minHeight: layoutMode === 'split' ? 40 : 48,
                  maxHeight: layoutMode === 'split' ? 120 : 200,
                  overflowY: 'hidden',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--black)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSend}
                disabled={!deferredInput.trim() || isTyping || isInitializing || !sessionInfo}
                style={{
                  padding: layoutMode === 'split' ? '0 20px' : '0 28px',
                  height: layoutMode === 'split' ? 40 : 48,
                  fontSize: layoutMode === 'split' ? 13 : 14,
                  fontWeight: 500,
                  border: '1px solid var(--black)',
                  background: !deferredInput.trim() || isTyping || isInitializing || !sessionInfo ? 'var(--gray-100)' : 'var(--black)',
                  color: !deferredInput.trim() || isTyping || isInitializing || !sessionInfo ? 'var(--gray-400)' : 'var(--white)',
                  cursor: !deferredInput.trim() || isTyping || isInitializing || !sessionInfo ? 'not-allowed' : 'pointer',
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
    </>
  )

  // 預覽面板渲染函數（用於 SplitLayout）
  const renderPreviewPanel = () => {
    // 檢查是否有 code_preview 訊息（Implementation 階段生成的程式碼）
    const codePreviewMessage = [...messages].reverse().find(m => m.richContent?.type === 'code_preview')
    const codePreviewData = codePreviewMessage?.richContent?.data

    if (codePreviewData) {
      const pagesData = (codePreviewData.pages || []) as { path: string; content: string; description: string }[]
      const componentsData = (codePreviewData.components || []) as { path: string; content: string; description: string }[]
      const stylesData = (codePreviewData.styles || '') as string
      const tailwindConfigData = (codePreviewData.tailwindConfig || '') as string
      // 響應式渲染：iframe 寬度 = 容器實際寬度（或裝置限制寬度），RWD 自然觸發
      const containerW = codePreviewContainerWidth > 0 ? codePreviewContainerWidth : 800
      const maxDeviceWidth = getDeviceWidth(codePreviewDevice)
      const iframeWidth = codePreviewDevice === 'desktop' ? containerW : Math.min(maxDeviceWidth, containerW)

      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* 工具列：設備切換器 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--white)',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--black)' }}>設計預覽</span>
            <DeviceSwitcher activeDevice={codePreviewDevice} onDeviceChange={setCodePreviewDevice} />
            <span style={{ fontSize: 11, color: 'var(--gray-400)', fontFamily: 'var(--font-mono)', width: 50, textAlign: 'right' }}>
              {iframeWidth}px
            </span>
          </div>
          {/* 預覽區域 */}
          <div
            ref={codePreviewContainerRef}
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              padding: codePreviewDevice === 'desktop' ? 0 : 24,
              overflow: 'auto',
              background: 'var(--gray-50)',
            }}
          >
            <div
              style={{
                width: codePreviewDevice === 'desktop' ? '100%' : iframeWidth,
                height: '100%',
                borderRadius: codePreviewDevice === 'desktop' ? 0 : 8,
                boxShadow: codePreviewDevice === 'desktop' ? 'none' : '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
                background: '#fff',
                overflow: 'hidden',
              }}
            >
              <iframe
                srcDoc={convertToPreviewHtml(pagesData, componentsData, stylesData, tailwindConfigData)}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  display: 'block',
                }}
                sandbox="allow-scripts"
                title="設計預覽"
              />
            </div>
          </div>
        </div>
      )
    }

    return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PreviewPanel
        templateSlug={selectedTemplate?.slug}
        previewImageUrl={selectedTemplate?.previewImageUrl}
        templateName={selectedTemplate?.name}
        isLoading={!selectedTemplate && !!selectedTemplateId}
        projectId={sessionInfo?.projectId}
      />
      {/* 底部操作按鈕 */}
      {selectedTemplate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: 16,
            borderTop: '1px solid var(--border-color)',
            background: 'var(--white)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {selectedTemplate.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
              {selectedTemplate.description?.substring(0, 50)}...
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSendMessage(`我選擇「${selectedTemplate.name}」這個模板`)}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              background: 'var(--black)',
              color: 'var(--white)',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            使用此模板
          </motion.button>
        </motion.div>
      )}
    </div>
    )
  }

  // 檢查是否在 formulation 階段（顯示全屏等待畫面）
  const lastMessage = messages[messages.length - 1]
  const isFormulationStage = lastMessage?.stage === 'formulation_progress' || lastMessage?.stage === 'formulation_start'

  // Formulation 階段：顯示全屏 SpecGenerationView
  if (isFormulationStage && isActive) {
    // 直接使用 progress.current 作為階段 (0-4)
    const progress = lastMessage?.progress
    const currentStage = Math.min(4, progress?.current || 0)

    return (
      <SpecGenerationView
        currentStage={currentStage}
        onComplete={() => {
          // 完成後會自動切換到下一個階段
        }}
      />
    )
  }

  // 分屏佈局模式
  if (layoutMode === 'split' && isActive) {
    return (
      <motion.div
        key="split-layout"
        initial={{ opacity: 0 }}
        animate={{ opacity: isLayoutTransitioning ? 0.5 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
        }}
      >
        <SplitLayout
          chatPanel={
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Split Layout Header */}
              <div
                style={{
                  height: 56,
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  gap: 12,
                }}
              >
                <button
                  onClick={onBack}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    color: 'var(--gray-600)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px 0',
                  }}
                >
                  <span>←</span>
                  返回
                </button>
                <div style={{ width: 1, height: 20, background: 'var(--border-color)' }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>UIUX 設計</span>
              </div>
              {renderChatContent()}
            </div>
          }
          previewPanel={renderPreviewPanel()}
        />
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      {isActive && (
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
            className="chat-header"
            style={{
              height: 64,
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px',
              background: 'var(--white)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* 左側：返回 + Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
              <button
                onClick={onBack}
                className="back-button"
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
                <span className="back-arrow" style={{ fontSize: 18 }}>←</span>
                <span className="back-text">返回</span>
              </button>
              <div className="header-divider" style={{ width: 1, height: 24, background: 'var(--border-color)' }} />
              <span className="header-logo" style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em' }}>
                Tellcraft
              </span>
            </div>

            {/* 中間：步驟指示器（絕對定位居中）- 手機版隱藏 */}
            <div className="steps-indicator" style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 0,
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

            {/* 手機版進度膠囊 - 精緻設計 */}
            <div className="mobile-progress-capsule">
              {/* 進度環 */}
              <div className="progress-ring-container">
                <svg className="progress-ring" width="24" height="24" viewBox="0 0 24 24">
                  <circle
                    className="progress-ring-bg"
                    cx="12"
                    cy="12"
                    r="9"
                  />
                  <circle
                    className="progress-ring-fill"
                    cx="12"
                    cy="12"
                    r="9"
                    strokeDasharray={`${2 * Math.PI * 9}`}
                    strokeDashoffset={`${2 * Math.PI * 9 * (1 - (currentStageIndex + 1) / stages.length)}`}
                  />
                </svg>
                <span className="progress-step-number">{currentStageIndex + 1}</span>
              </div>
              {/* 當前階段名稱 */}
              <span className="progress-stage-label">
                {stages[currentStageIndex]?.title || '準備中'}
              </span>
            </div>

            {/* 右側：主題切換 + 用戶資訊 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              {/* 主題切換 */}
              <AnimatedThemeToggler />
              {/* 用戶資訊 - 優先使用 VPS auth 狀態 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {(auth.isAuthenticated || sessionInfo?.isAuthenticated) ? (
                  <>
                    {(auth.user?.avatarUrl || sessionInfo?.user?.avatarUrl) && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={auth.user?.avatarUrl || sessionInfo?.user?.avatarUrl}
                        alt=""
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          border: '1px solid var(--border-color)',
                        }}
                      />
                    )}
                    <span className="user-name" style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                      {auth.user?.name || sessionInfo?.user?.name || auth.user?.email?.split('@')[0] || sessionInfo?.user?.email?.split('@')[0] || '用戶'}
                    </span>
                    <GlowButton onClick={handleDashboard} variant="outline" size="sm">
                      儀表板
                    </GlowButton>
                  </>
                ) : (
                  <GlowButton onClick={handleLogin} variant="outline" size="sm">
                    登入
                  </GlowButton>
                )}
              </div>
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

          {/* 使用提取的渲染函數顯示對話內容 */}
          {renderChatContent()}

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
    <section ref={ref} className="comparison-section" style={{ padding: '80px 24px', background: 'var(--white)' }}>
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
          className="comparison-table"
          style={{ border: '1px solid var(--border-color)', overflow: 'hidden' }}
        >
          <div className="comparison-header" style={{
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
              className="comparison-row"
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
    <section ref={ref} className="showcase-section" style={{ padding: '80px 24px', background: 'var(--white)', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="showcase-grid" style={{
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
            className="showcase-text"
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
            <div className="showcase-stats" style={{
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
            className="showcase-cards"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 450,
              position: 'relative',
            }}
          >
            <CardSwap
              width="min(360px, calc(100vw - 80px))"
              height="min(280px, 65vw)"
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
  const [anonymousId, setAnonymousId] = useState<string | undefined>(undefined)

  // VPS JWT Auth Hook
  const auth = useAuth()

  // 頁面載入時強制滾動到頂部（禁用瀏覽器滾動恢復）
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    window.scrollTo(0, 0)
  }, [])

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

  // 對話模式時禁用首頁滾動
  useEffect(() => {
    if (isChatActive) {
      // 記住當前滾動位置
      const scrollY = window.scrollY
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
    } else {
      // 恢復滾動
      const scrollY = document.body.style.top
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      // 恢復滾動位置
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
    }
  }, [isChatActive])

  // 登出處理
  const handleSignOut = () => {
    auth.logout()
    window.location.reload()
  }

  // 進入儀表板（先同步 cookie 再跳轉）
  const handleDashboard = async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      window.location.href = '/auth/login?next=/dashboard'
      return
    }

    try {
      const res = await fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (res.ok) {
        window.location.href = '/dashboard'
      } else {
        // Token 無效，清除並重新登入
        localStorage.removeItem('auth_token')
        window.location.href = '/auth/login?next=/dashboard'
      }
    } catch {
      // 網路錯誤，直接嘗試跳轉（讓 middleware 處理）
      window.location.href = '/dashboard'
    }
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
            className="landing-auth-area"
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
        {auth.isLoading ? (
          <div style={{ width: 80, height: 36 }} />
        ) : auth.isAuthenticated && auth.user ? (
          // 已登入 - 顯示用戶資訊
          <div className="landing-user-info" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {auth.user.avatarUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={auth.user.avatarUrl}
                alt=""
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '1px solid var(--border-color)',
                }}
              />
            )}
            <span className="landing-user-name" style={{ fontSize: 14, color: 'var(--gray-600)' }}>
              {auth.user.name || auth.user.email?.split('@')[0] || '用戶'}
            </span>
            <GlowButton onClick={handleDashboard} variant="outline" size="sm">
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
