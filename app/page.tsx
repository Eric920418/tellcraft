'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion'
import SplitText from './components/SplitText'
import RotatingText from './components/RotatingText'
import GlareHover from './components/GlareHover'
import CardSwap, { Card } from './components/CardSwap'
// import GridDistortion from './components/GridDistortion'
import TextType from './components/TextType'
import { AnimatedThemeToggler } from './components/AnimatedThemeToggler'

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
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && inputValue.trim()) {
      e.preventDefault()
      onStartChat()
    }
  }

  return (
    <motion.section
      initial={{ opacity: 1 }}
      animate={{
        opacity: isChatActive ? 0 : 1,
        pointerEvents: isChatActive ? 'none' : 'auto'
      }}
      transition={{ duration: 0.4 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        position: 'relative',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 50% 30%, var(--gray-50) 0%, var(--white) 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 600,
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: 48 }}>
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
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
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
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
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
              onKeyDown={handleKeyDown}
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
                按 Enter 開始對話
              </span>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStartChat}
                disabled={!inputValue.trim()}
                style={{
                  padding: '8px 20px',
                  fontSize: 13,
                  fontWeight: 500,
                  background: inputValue.trim() ? 'var(--black)' : 'var(--gray-200)',
                  color: inputValue.trim() ? 'var(--white)' : 'var(--gray-400)',
                  border: 'none',
                  cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                }}
              >
                開始
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <ScrollIndicator visible={!isFocused && !inputValue} />
    </motion.section>
  )
}

// ============ Chat Section ============
function ChatSection({
  isActive,
  initialMessage,
  onBack
}: {
  isActive: boolean
  initialMessage: string
  onBack: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentStage, setCurrentStage] = useState<Message['stage']>('discovery')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isActive && initialMessage && messages.length === 0) {
      const userMsg: Message = {
        id: '1',
        role: 'user',
        content: initialMessage,
        timestamp: new Date()
      }
      setMessages([userMsg])
      setIsTyping(true)

      setTimeout(() => {
        const aiMsg: Message = {
          id: '2',
          role: 'assistant',
          content: `好的，我需要了解更多細節：

1. 主要功能有哪些？
2. 需要會員系統嗎？
3. 有沒有付款需求？`,
          timestamp: new Date(),
          stage: 'clarify'
        }
        setMessages(prev => [...prev, aiMsg])
        setCurrentStage('clarify')
        setIsTyping(false)
      }, 1200)
    }
  }, [isActive, initialMessage, messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      let response: Message

      if (currentStage === 'clarify') {
        response = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `了解。我整理出以下規格：

• 功能清單已確認
• 業務規則已定義
• 資料結構已設計

這樣對嗎？確認後我會開始生成程式碼。`,
          timestamp: new Date(),
          stage: 'formulation'
        }
        setCurrentStage('formulation')
      } else if (currentStage === 'formulation') {
        response = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `開始生成程式碼...`,
          timestamp: new Date(),
          stage: 'generating'
        }
        setCurrentStage('generating')

        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: (Date.now() + 2).toString(),
            role: 'system',
            content: '正在建立資料庫結構...',
            timestamp: new Date()
          }])
        }, 1500)

        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: (Date.now() + 3).toString(),
            role: 'system',
            content: '正在生成前端元件...',
            timestamp: new Date()
          }])
        }, 3000)

        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: (Date.now() + 4).toString(),
            role: 'assistant',
            content: `你的網站已上線！

網址：https://your-project.tellcraft.app

接下來你可以：
• 綁定自訂網域
• 進入後台設定
• 繼續新增功能`,
            timestamp: new Date(),
            stage: 'complete'
          }])
          setCurrentStage('complete')
        }, 5000)
      } else if (currentStage === 'complete') {
        response = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `好的，我來幫你修改。請描述你想要的變更。`,
          timestamp: new Date(),
          stage: 'clarify'
        }
        setCurrentStage('clarify')
      } else {
        response = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `收到，讓我處理一下。`,
          timestamp: new Date()
        }
      }

      if (currentStage !== 'formulation') {
        setMessages(prev => [...prev, response])
      }
      setIsTyping(false)
    }, 800)
  }

  const stages = [
    { key: 'discovery', title: '需求探索' },
    { key: 'clarify', title: '細節釐清' },
    { key: 'formulation', title: '規格確認' },
    { key: 'generating', title: '程式生成' },
    { key: 'complete', title: '已上線' },
  ]

  const currentStageIndex = stages.findIndex(s => s.key === currentStage)

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--white)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
          }}
        >
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{
              height: 64,
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px',
              background: 'var(--white)',
            }}
          >
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
            <div style={{ display: 'flex', gap: 24 }}>
              {stages.map((stage, i) => (
                <ProcessStep
                  key={stage.key}
                  step={i + 1}
                  title={stage.title}
                  active={currentStage === stage.key}
                  completed={i < currentStageIndex}
                />
              ))}
            </div>
          </motion.header>

          <div style={{ flex: 1, overflow: 'auto', padding: '32px 0' }}>
            <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
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
                        {message.role === 'user' ? '你' : 'AI'}
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
                        whiteSpace: 'pre-wrap'
                      }}>
                        {message.content}
                      </div>
                    </>
                  )}
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 28 }}>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--gray-400)',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>AI</div>
                  <div style={{
                    padding: '18px 22px',
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
                        style={{ width: 6, height: 6, background: 'var(--gray-400)', display: 'inline-block' }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{ borderTop: '1px solid var(--border-color)', padding: '20px 24px', background: 'var(--white)' }}
          >
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="輸入訊息..."
                  rows={1}
                  style={{
                    flex: 1,
                    resize: 'none',
                    padding: '14px 18px',
                    fontSize: 15,
                    border: '1px solid var(--border-color)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--black)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  style={{
                    padding: '14px 28px',
                    fontSize: 14,
                    fontWeight: 500,
                    border: '1px solid var(--black)',
                    background: !input.trim() || isTyping ? 'var(--gray-100)' : 'var(--black)',
                    color: !input.trim() || isTyping ? 'var(--gray-400)' : 'var(--white)',
                    cursor: !input.trim() || isTyping ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  送出
                </motion.button>
              </div>
            </div>
          </motion.div>
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
export default function Home() {
  const [isChatActive, setIsChatActive] = useState(false)
  const [heroInput, setHeroInput] = useState('')
  const [initialMessage, setInitialMessage] = useState('')

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
  }, [])

  const handleFocusInput = useCallback(() => {
    const input = document.querySelector('textarea')
    if (input) {
      input.focus()
    }
  }, [])

  return (
    <main>
      {/* Theme Toggler - Fixed Top Left */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          left: 20,
          zIndex: 1000,
        }}
      >
        <AnimatedThemeToggler />
      </div>

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
