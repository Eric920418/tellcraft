'use client'

import { useState, useRef, useEffect, useCallback, Suspense, useDeferredValue, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useLocalePath } from '@/app/hooks/useLocalePath'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import RotatingText from '@/app/components/RotatingText'
import GlareHover from '@/app/components/GlareHover'
import CardSwap, { Card } from '@/app/components/CardSwap'
// import GridDistortion from '@/app/components/GridDistortion'
import TextType from '@/app/components/TextType'
import { AnimatedThemeToggler } from '@/app/components/AnimatedThemeToggler'
import LocaleSwitcher from '@/app/components/LocaleSwitcher'
import GlowButton from '@/app/components/GlowButton'
// signOut moved to VPS auth flow
import {
  initializeSession as vpsInitializeSession,
  getConversationMessages as vpsGetConversationMessages,
  replyToConversation as vpsReplyToConversation,
  sendMessage as vpsSendMessage,
  uploadImage,
} from '@/app/lib/vps-api'
import { getAuthToken } from '@/app/hooks/useAuth'
import ConversationPicker from '@/app/components/ConversationPicker'
import LoginPrompt, { shouldShowLoginPrompt, dismissLoginPrompt } from '@/app/components/LoginPrompt'
import { useAuth } from '@/app/hooks/useAuth'
import ProjectReminder from '@/app/components/ProjectReminder'
import SplitLayout from '@/app/components/uiux/SplitLayout'
import SpecGenerationView from '@/app/components/SpecGenerationView'
import PreviewPanel, { type ElementInfo } from '@/app/components/uiux/PreviewPanel'
import PropertyEditor from '@/app/components/uiux/PropertyEditor'
import DeviceSwitcher, { type DeviceType, getDeviceWidth } from '@/app/components/uiux/DeviceSwitcher'
import TemplatePicker from '@/app/components/uiux/TemplatePicker'
import QuickReplies from '@/app/components/QuickReplies'
import type { StreamingPreview, FastBuildChunks } from '@/app/hooks/useVpsWebSocket'
import dynamic from 'next/dynamic'

const SandpackPreviewComponent = dynamic(
  () => import('@/app/components/uiux/SandpackPreview'),
  { ssr: false, loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}><p style={{ color: 'var(--gray-400)', fontSize: 14 }}>Loading preview...</p></div> }
)
const FastBuildPlayer = dynamic(
  () => import('@/app/components/FastBuildPlayer'),
  { ssr: false, loading: () => null }
)
import { BuildingPlayer } from '@/app/components/building-scene'
import { getTemplateById } from '@/app/actions/templates'
import type { Template } from '@/app/lib/templates'

// ============ Types ============
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  stage?: 'init' | 'init_progress' | 'discovery' | 'clarify' | 'prd_discovery_complete' | 'formulation_start' | 'formulation_progress' | 'formulation' | 'uiux' | 'uiux_template_picker' | 'generating' | 'deploying' | 'complete' | 'prefilter_rejected' | 'meta_response'
    | 'fast_generating' | 'fast_need_more_info'
    | 'es_init' | 'es_explore'
    | 'prd_discovery_analyzing' | 'prd_discovery_generating' | 'prd_discovery_deduping'
    | 'info' | 'error'
    | 'prd_discovery_continue' | 'clarify_question' | 'clarify_revert' | 'batch_confirm' | 'batch_confirmed'
    | 'formulation_complete' | 'spec_discovery_continue' | 'spec_discovery_complete' | 'spec_discovery_error'
    | 'spec_fix_start' | 'spec_fix_complete' | 'spec_fix_error'
    | 'spec_validating' | 'spec_actions_design' | 'spec_isa_config' | 'spec_complete'
    | 'spec_change_analyzing' | 'spec_change_confirm' | 'spec_rollback_select'
    | 'formulation_draft_review'
    | 'uiux_design_preference' | 'uiux_design_clarify' | 'uiux_design_clarify_complete'
    | 'uiux_design_brief_generating' | 'uiux_design_brief_confirm' | 'uiux_design_brief_adjusting'
    | 'uiux_prompt_template_selection' | 'uiux_prompt_variant_selection' | 'uiux_variants_generating' | 'uiux_variants_ready'
    | 'uiux_generation_complete' | 'uiux_pipeline_progress'
    | 'uiux_structure_generating' | 'uiux_structure_complete' | 'uiux_animation_generating' | 'uiux_animation_complete' | 'uiux_rwd_generating'
    | 'uiux_quality_gate_running' | 'uiux_quality_gate_fixing' | 'uiux_quality_gate_complete'
    | 'uiux_complete' | 'uiux_iterating' | 'uiux_iteration_complete'
    | 'deployer_checking' | 'deployer_deploying' | 'deployer_code_sync' | 'deployer_complete' | 'deployer_error' | 'deployer_cancelled' | 'deployer_rolling_back' | 'deployer_rollback_select'
  progress?: { current: number; total: number; step: string }
  // UIUX 模板系統擴展
  layoutHint?: 'default' | 'split' | 'full_preview'
  richContent?: {
    type: 'template_picker' | 'variant_picker' | 'design_preview' | 'code_preview' | 'quality_gate_report' | 'deploy_progress' | 'deploy_result' | 'deployment_history' | 'fast_build_progress' | 'building_progress'
    data: Record<string, unknown>
  }
  // Quick Reply 可點擊選項
  quickReplies?: { label: string; value: string; style?: 'primary' | 'secondary' | 'ghost' }[]
  // 樂觀更新標記：pending 表示尚未確認儲存到 DB
  pending?: boolean
}

// INTERNAL_COMMAND_LABELS keys → command namespace keys
const COMMAND_KEYS: Record<string, string> = {
  '__go_back__': 'goBack',
  '__retry__': 'retry',
  '__accept_proposal__': 'accept',
  '__reject_proposal__': 'reject',
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
  const tHero = useTranslations('hero')
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
            {tHero('scrollIndicator')}
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
  isChatActive,
  buildMode,
  onBuildModeChange
}: {
  onStartChat: () => void
  inputValue: string
  onInputChange: (value: string) => void
  isChatActive: boolean
  buildMode: 'fast' | 'fine'
  onBuildModeChange: (mode: 'fast' | 'fine') => void
}) {
  const tHero = useTranslations('hero')
  const [isFocused, setIsFocused] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const trimmedInput = inputValue.trim()
  const isFastModeShortWarning = buildMode === 'fast' && trimmedInput.length > 0 && trimmedInput.length < 15
  const canSubmit = trimmedInput.length > 0 && !isTransitioning

  const handleStartClick = () => {
    if (!canSubmit) return
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
              texts={[tHero('title')]}
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
            {tHero('subtitle')}
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
              placeholder={buildMode === 'fast'
                ? tHero('placeholderFast')
                : tHero('placeholderFine')}
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
              padding: '10px 16px 10px 10px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              background: 'var(--gray-50)',
            }}>
              {/* Mode Toggle */}
              <div style={{
                display: 'flex',
                padding: '2px',
                background: 'var(--gray-200)',
                borderRadius: 6,
                flexShrink: 0,
              }}>
                <button
                  onClick={() => onBuildModeChange('fast')}
                  style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 500,
                    background: buildMode === 'fast' ? 'var(--black)' : 'transparent',
                    color: buildMode === 'fast' ? 'var(--white)' : 'var(--gray-500)',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tHero('modeFast')}
                </button>
                <button
                  onClick={() => onBuildModeChange('fine')}
                  style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 500,
                    background: buildMode === 'fine' ? 'var(--black)' : 'transparent',
                    color: buildMode === 'fine' ? 'var(--white)' : 'var(--gray-500)',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tHero('modeFine')}
                </button>
              </div>
              <span style={{ fontSize: 12, color: isFastModeShortWarning ? 'var(--amber-500, #f59e0b)' : 'var(--gray-400)', flex: 1, textAlign: 'center', transition: 'color 0.2s ease' }}>
                {isFastModeShortWarning
                  ? tHero('shortWarning')
                  : buildMode === 'fast' ? tHero('fastHint') : tHero('fineHint')}
              </span>
              <motion.button
                whileHover={{ scale: canSubmit ? 1.02 : 1 }}
                whileTap={{ scale: canSubmit ? 0.96 : 1 }}
                onClick={handleStartClick}
                disabled={!canSubmit}
                style={{
                  padding: '8px 20px',
                  fontSize: 13,
                  fontWeight: 500,
                  background: canSubmit ? 'var(--black)' : 'var(--gray-200)',
                  color: canSubmit ? 'var(--white)' : 'var(--gray-400)',
                  border: 'none',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                {isTransitioning ? '...' : tHero('startButton')}
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
  const tPreview = useTranslations('preview')
  const tStage = useTranslations('stage')
  const tCssLabel = useTranslations('cssLabel')
  const tCodePreview = useTranslations('codePreview')
  const tLogin = useTranslations('login')
  const tCommand = useTranslations('command')
  const localePath = useLocalePath()
  const getCommandLabel = useCallback((content: string) => {
    const key = COMMAND_KEYS[content.trim()]
    return key ? tCommand(key) : content.trim()
  }, [tCommand])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  // 延遲更新按鈕狀態，優化 INP
  const deferredInput = useDeferredValue(input)
  const [isTyping, setIsTyping] = useState(false)
  const [sendCooldown, setSendCooldown] = useState(false)
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null)
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
  const codePreviewContainerObserverRef = useRef<ResizeObserver | null>(null)
  const [codePreviewContainerWidth, setCodePreviewContainerWidth] = useState(0)
  const codePreviewContainerRef = useCallback((el: HTMLDivElement | null) => {
    // 斷開舊的 observer
    if (codePreviewContainerObserverRef.current) {
      codePreviewContainerObserverRef.current.disconnect()
      codePreviewContainerObserverRef.current = null
    }
    if (!el) return
    // 立即讀取一次寬度
    setCodePreviewContainerWidth(el.clientWidth - 48)
    // 綁定新的 observer
    const observer = new ResizeObserver(() => {
      setCodePreviewContainerWidth(el.clientWidth - 48)
    })
    observer.observe(el)
    codePreviewContainerObserverRef.current = observer
  }, [])

  // 打字指示器：立即顯示 "..."，10 秒後顯示完整提示
  // + 安全超時：90 秒後自動清除 isTyping，防止後端靜默丟棄消息導致 UI 卡死
  const typingSafetyRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (isTyping) {
      // 立即顯示 "..."
      setTypingStage('dots')
      // 10 秒後顯示完整提示
      typingTimerRef.current = setTimeout(() => {
        setTypingStage('message')
      }, 10000)
      // 安全超時：90 秒後自動恢復輸入（正常流程不會觸發此超時）
      typingSafetyRef.current = setTimeout(() => {
        console.warn('[Chat] isTyping 安全超時觸發，自動恢復輸入')
        setIsTyping(false)
      }, 90000)
    } else {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current)
        typingTimerRef.current = null
      }
      if (typingSafetyRef.current) {
        clearTimeout(typingSafetyRef.current)
        typingSafetyRef.current = null
      }
      setTypingStage('none')
    }
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current)
      }
      if (typingSafetyRef.current) {
        clearTimeout(typingSafetyRef.current)
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

  // Streaming preview（實時串流預覽，透過 HTTP 輪詢從 Redis 取得）
  const [streamingPreview, setStreamingPreview] = useState<StreamingPreview | null>(null)
  // Code preview 穩定數據（從 messages 提取，避免每次 render 重新搜索陣列）
  const [codePreviewData, setCodePreviewData] = useState<Record<string, unknown> | null>(null)
  // Fast Build chunk 計數（用於 FastBuildProgress 子進度更新）
  const [fastBuildChunks, setFastBuildChunks] = useState(0)

  // Code Preview 編輯模式狀態
  const [codePreviewEditMode, setCodePreviewEditMode] = useState(false)
  const [codePreviewSelectedElement, setCodePreviewSelectedElement] = useState<ElementInfo | null>(null)
  const [codePreviewOverrides, setCodePreviewOverrides] = useState<Record<string, Record<string, string>>>({})
  const [codePreviewAnnotations, setCodePreviewAnnotations] = useState<Record<string, string>>({})
  const [codePreviewOverrideHistory, setCodePreviewOverrideHistory] = useState<Record<string, Record<string, string>>[]>([{}])
  const [codePreviewHistoryIndex, setCodePreviewHistoryIndex] = useState(0)
  const codePreviewSeqRef = useRef(0) // 遞增計數器（取代 Date.now()，避免同毫秒批次更新不觸發 effect）
  const [codePreviewPendingUpdate, setCodePreviewPendingUpdate] = useState<{ elementId: string; changes: Record<string, string>; seq: number } | null>(null)
  const [codePreviewPendingReset, setCodePreviewPendingReset] = useState<{ elementId: string; seq: number } | null>(null)
  const [codePreviewPendingOverrides, setCodePreviewPendingOverrides] = useState<{ overrides: Record<string, Record<string, string>>; seq: number } | null>(null)

  // Code Preview 容器尺寸追蹤已改用 callback ref（codePreviewContainerRef）

  // ── Code Preview 編輯模式 handlers ──────────────────
  const handleCodePreviewElementUpdate = useCallback((elementId: string, changes: Record<string, string>) => {
    const newOverrides = {
      ...codePreviewOverrides,
      [elementId]: { ...codePreviewOverrides[elementId], ...changes }
    }
    setCodePreviewOverrides(newOverrides)

    // 推入 Undo/Redo 歷史（截斷 redo 分支）
    setCodePreviewOverrideHistory(prev => {
      const truncated = prev.slice(0, codePreviewHistoryIndex + 1)
      return [...truncated, JSON.parse(JSON.stringify(newOverrides))]
    })
    setCodePreviewHistoryIndex(prev => prev + 1)

    // 設置 pendingUpdate → SandpackPreview → postMessage
    setCodePreviewPendingUpdate({ elementId, changes, seq: ++codePreviewSeqRef.current })

    // 同步 selectedElement 狀態
    if (codePreviewSelectedElement && codePreviewSelectedElement.id === elementId) {
      setCodePreviewSelectedElement(prev => prev ? {
        ...prev,
        text: changes.text !== undefined ? changes.text : prev.text,
        styles: { ...prev.styles, ...changes }
      } : null)
    }
  }, [codePreviewOverrides, codePreviewHistoryIndex, codePreviewSelectedElement])

  const handleCodePreviewResetElement = useCallback((elementId: string) => {
    const newOverrides = { ...codePreviewOverrides }
    delete newOverrides[elementId]
    setCodePreviewOverrides(newOverrides)

    setCodePreviewOverrideHistory(prev => {
      const truncated = prev.slice(0, codePreviewHistoryIndex + 1)
      return [...truncated, JSON.parse(JSON.stringify(newOverrides))]
    })
    setCodePreviewHistoryIndex(prev => prev + 1)

    setCodePreviewPendingReset({ elementId, seq: ++codePreviewSeqRef.current })
    setCodePreviewSelectedElement(null)
  }, [codePreviewOverrides, codePreviewHistoryIndex])

  const codePreviewCanUndo = codePreviewHistoryIndex > 0
  const codePreviewCanRedo = codePreviewHistoryIndex < codePreviewOverrideHistory.length - 1

  const handleCodePreviewUndo = useCallback(() => {
    if (!codePreviewCanUndo) return
    const newIndex = codePreviewHistoryIndex - 1
    setCodePreviewHistoryIndex(newIndex)
    const overrides = codePreviewOverrideHistory[newIndex]
    setCodePreviewOverrides(overrides)
    // 全量覆蓋 iframe DOM（undo 需要重建整個狀態）
    setCodePreviewPendingOverrides({ overrides, seq: ++codePreviewSeqRef.current })
  }, [codePreviewCanUndo, codePreviewHistoryIndex, codePreviewOverrideHistory])

  const handleCodePreviewRedo = useCallback(() => {
    if (!codePreviewCanRedo) return
    const newIndex = codePreviewHistoryIndex + 1
    setCodePreviewHistoryIndex(newIndex)
    const overrides = codePreviewOverrideHistory[newIndex]
    setCodePreviewOverrides(overrides)
    setCodePreviewPendingOverrides({ overrides, seq: ++codePreviewSeqRef.current })
  }, [codePreviewCanRedo, codePreviewHistoryIndex, codePreviewOverrideHistory])

  // Code Preview 圖片上傳（複用 ChatSection 的 auth hook）
  const handleCodePreviewUploadImage = useCallback(async (file: File): Promise<string | null> => {
    if (!auth.token || !auth.isAuthenticated) return null
    const result = await uploadImage({ file, token: auth.token, onProgress: () => {} })
    if (result.success && result.data?.url) return result.data.url
    return null
  }, [auth.token, auth.isAuthenticated])

  // Code Preview 批註回調
  const handleCodePreviewAnnotationChange = useCallback((elementId: string, text: string) => {
    setCodePreviewAnnotations(prev => {
      if (!text) {
        const next = { ...prev }
        delete next[elementId]
        return next
      }
      return { ...prev, [elementId]: text }
    })
  }, [])

  // Code Preview 拖曳尺寸回調
  const handleCodePreviewElementResized = useCallback((elementId: string, changes: { width: string; height: string }) => {
    handleCodePreviewElementUpdate(elementId, changes)
  }, [handleCodePreviewElementUpdate])

  // Code Preview 編輯模式鍵盤快捷鍵
  useEffect(() => {
    if (!codePreviewEditMode) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          handleCodePreviewRedo()
        } else {
          handleCodePreviewUndo()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [codePreviewEditMode, handleCodePreviewUndo, handleCodePreviewRedo])

  // ── Code Preview Overrides 持久化（localStorage）──
  // 寫入：overrides 變化時存入 localStorage（sessionInfo 為 null 時跳過，避免清除已儲存的資料）
  useEffect(() => {
    if (!sessionInfo?.conversationId) return
    const key = `tc-edit-overrides-${sessionInfo.conversationId}`
    if (Object.keys(codePreviewOverrides).length > 0) {
      localStorage.setItem(key, JSON.stringify(codePreviewOverrides))
    } else {
      localStorage.removeItem(key)
    }
  }, [codePreviewOverrides, sessionInfo?.conversationId])

  // 讀取：conversationId 變化時（含頁面重整後初始化）從 localStorage 恢復
  useEffect(() => {
    if (!sessionInfo?.conversationId) return
    const key = `tc-edit-overrides-${sessionInfo.conversationId}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          setCodePreviewOverrides(parsed)
          setCodePreviewOverrideHistory([{}, parsed])
          setCodePreviewHistoryIndex(1)
        }
      } catch { /* 忽略損壞的資料 */ }
    }
  }, [sessionInfo?.conversationId]) // eslint-disable-line -- 只在 conversationId 變化時執行（不要加 overrides）

  // ── Code Preview Annotations 持久化（localStorage）──
  useEffect(() => {
    if (!sessionInfo?.conversationId) return
    const key = `tc-edit-annotations-${sessionInfo.conversationId}`
    if (Object.keys(codePreviewAnnotations).length > 0) {
      localStorage.setItem(key, JSON.stringify(codePreviewAnnotations))
    } else {
      localStorage.removeItem(key)
    }
  }, [codePreviewAnnotations, sessionInfo?.conversationId])

  useEffect(() => {
    if (!sessionInfo?.conversationId) return
    const key = `tc-edit-annotations-${sessionInfo.conversationId}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          setCodePreviewAnnotations(parsed)
        }
      } catch { /* 忽略損壞的資料 */ }
    }
  }, [sessionInfo?.conversationId])

  // 監聯訊息的 layoutHint 或 UIUX 相關 stage，切換佈局模式
  // 手機（<768px）不進 split mode，避免爆版
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

    let targetMode: 'default' | 'split' = 'default'

    // 手機上永遠保持 default（單欄），不顯示動畫/預覽面板
    if (!isMobile) {
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

        // 方法 3: BDD Q&A 釐清階段自動切 split mode（顯示 3D 蓋房子）
        const hasClarifyMessage = messages.some(m =>
          m.stage === 'clarify_question' ||
          m.stage === 'prd_discovery_complete' ||
          m.stage === 'prd_discovery_continue'
        )
        if (hasClarifyMessage && !hasUiuxMessage) {
          targetMode = 'split'
        }
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
        setError(result.error || tChat('initError'))
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
          content: buildMode === 'fast'
            ? tChat('fastBuildPreview')
            : tChat('analyzePreview'),
          timestamp: new Date(),
          stage: buildMode === 'fast' ? 'fast_generating' : 'clarify'
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
          userId: session.userId,
          mode: buildMode,
          token: token || undefined
        })

        if (!sendResult.success) {
          setError(sendResult.error || tChat('sendError'))
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
            progress: m.progress as Message['progress'],
            layoutHint: (m as unknown as Record<string, unknown>).layoutHint as Message['layoutHint'],
            richContent: (m as unknown as Record<string, unknown>).richContent as Message['richContent'],
            quickReplies: (m as unknown as Record<string, unknown>).quickReplies as Message['quickReplies'],
          }))
          setMessages(historyMessages)

          // 提取 code_preview 數據到穩定 state（避免 renderPreviewPanel 每次搜索 messages）
          const cpMsg = [...historyMessages].reverse().find(m => m.richContent?.type === 'code_preview')
          if (cpMsg?.richContent?.data) setCodePreviewData(cpMsg.richContent.data)

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

        // 處理 streaming preview（從 Redis 透過 HTTP 輪詢取得）
        if (result.data.streamingPreview) {
          const sp = result.data.streamingPreview as StreamingPreview
          // 用 functional update + 快速內容比較避免不必要的 re-render
          setStreamingPreview(prev => {
            if (!prev) return sp
            // 快速比較：phase + 檔案數 + 每個檔案的 path 和 content 長度
            if (
              prev.phase === sp.phase &&
              prev.pages.length === sp.pages.length &&
              prev.components.length === sp.components.length &&
              prev.styles.length === sp.styles.length &&
              prev.pages.every((p, i) => p.path === sp.pages[i]?.path && p.content.length === sp.pages[i]?.content.length) &&
              prev.components.every((c, i) => c.path === sp.components[i]?.path && c.content.length === sp.components[i]?.content.length)
            ) {
              return prev // 相同 reference → 不觸發 re-render
            }
            return sp
          })
          const newChunks = (sp.pages?.length || 0) + (sp.components?.length || 0)
          setFastBuildChunks(prev => prev !== newChunks ? newChunks : prev)
          // 串流期間加快輪詢
          pollInterval = 1500
          // 自動切換到 split 佈局（手機不切）
          if (layoutModeRef.current !== 'split' && window.innerWidth >= 768) {
            setLayoutMode('split')
          }
        }

        // 沒有變化時跳過消息處理，只維持輪詢
        if (result.data.hasChanges === false) {
          pollInterval = Math.min(pollInterval * 1.5, MAX_INTERVAL)
          if (isPolling) {
            timeoutId = setTimeout(poll, pollInterval)
          }
          return
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
            quickReplies: m.quickReplies,
          }))

          // 收到 code_preview 消息時清除 streaming preview（最終版已到達）
          const hasCodePreview = formattedMessages.some(m => m.richContent?.type === 'code_preview')
          if (hasCodePreview) {
            const cpMsg = formattedMessages.find(m => m.richContent?.type === 'code_preview')
            if (cpMsg?.richContent?.data) setCodePreviewData(cpMsg.richContent.data)
            setStreamingPreview(null)
            setFastBuildChunks(0)
          }

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
            // 只在確實有 preview-analyzing 時才過濾，避免產生不必要的新陣列引用
            const hasPreview = hasRealAiMessage && prev.some(m => m.id === 'preview-analyzing')
            const filteredPrev = hasPreview
              ? prev.filter(m => m.id !== 'preview-analyzing')
              : prev

            // 使用 ID 去重
            const existingIds = new Set(filteredPrev.map(m => m.id))
            const uniqueNewMessages = formattedMessages.filter(m => !existingIds.has(m.id))

            if (uniqueNewMessages.length > 0) {
              // 先處理 pending 訊息的替換
              const updatedPrev = [...filteredPrev]
              const newMessagesToAdd: Message[] = []

              for (const newMsg of uniqueNewMessages) {
                if (newMsg.role === 'user') {
                  // 找是否有 pending 的用戶訊息有相同內容
                  const dbLabel = getCommandLabel(newMsg.content)
                  const pendingIndex = updatedPrev.findIndex(m =>
                    m.role === 'user' && m.pending && (m.content === newMsg.content || m.content === dbLabel)
                  )
                  if (pendingIndex !== -1) {
                    updatedPrev[pendingIndex] = newMsg
                  } else {
                    newMessagesToAdd.push(newMsg)
                  }
                } else {
                  // 防止「殭屍」進度消息：被合併掉的舊進度消息每次輪詢都從後端回來
                  // 只加入比現有進度更高的消息
                  if (newMsg.progress) {
                    const existingProgress = updatedPrev.find(m => m.content === newMsg.content && m.progress)
                    if (existingProgress?.progress && newMsg.progress.current <= existingProgress.progress.current) {
                      continue // 舊進度，不加入
                    }
                  }
                  newMessagesToAdd.push(newMsg)
                }
              }

              // 如果過濾後沒有真正要加的新訊息，也沒有 pending 替換，走穩定路徑
              if (newMessagesToAdd.length === 0 && updatedPrev.every((m, i) => m === filteredPrev[i])) {
                return hasPreview ? filteredPrev : prev
              }

              // 如果有新的 AI 消息（非進度訊息），停止 typing
              const hasNonProgressAiMessage = newMessagesToAdd.some(m =>
                m.role === 'assistant' &&
                !['init_progress', 'formulation_start', 'formulation_progress'].includes(m.stage || '')
              )
              if (hasNonProgressAiMessage) {
                setIsTyping(false)
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

                // AI 進度訊息：相同內容只保留進度值最高的
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
                      // 相同或更低進度：跳過
                    }
                    continue
                  }
                  progressMap.set(key, { index: result.length, msg })
                  result.push(msg)
                  continue
                }

                // 其他 AI 訊息：直接加入
                result.push(msg)
              }

              // 最終防護：如果合併結果和 prev 完全相同，返回 prev 避免 re-render
              if (result.length === prev.length) {
                let changed = false
                for (let i = 0; i < result.length; i++) {
                  if (result[i] === prev[i]) continue
                  const a = result[i], b = prev[i]
                  if (a.id === b.id && a.content === b.content && a.role === b.role &&
                      a.stage === b.stage &&
                      a.progress?.current === b.progress?.current &&
                      a.progress?.total === b.progress?.total &&
                      a.progress?.step === b.progress?.step) {
                    result[i] = prev[i] // 內容相同，保留舊引用
                  } else {
                    changed = true
                  }
                }
                if (!changed) return prev
              }

              return result
            }
            // 沒有新消息：filteredPrev 等於 prev 時返回同一引用，不觸發 re-render
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

  // 直接滾動到底部（instant，不用 smooth，避免動畫期間目標過時）
  const scrollToBottom = useCallback(() => {
    const container = chatScrollRef.current
    if (!container) return
    isProgrammaticScrollRef.current = true
    container.scrollTop = container.scrollHeight
    // 延遲重置 flag，避免 scroll event 誤判
    setTimeout(() => {
      isProgrammaticScrollRef.current = false
    }, 50)
  }, [])

  // 消息變化時滾動到底部
  useEffect(() => {
    if (isNearBottomRef.current) {
      // 立即滾一次
      scrollToBottom()
      // 100ms 後再補滾一次（等 React 完成渲染 + markdown 解析）
      const t1 = setTimeout(() => scrollToBottom(), 100)
      // 350ms 後最後補滾（等 motion 動畫展開完成）
      const t2 = setTimeout(() => scrollToBottom(), 350)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [messages, typingStage, scrollToBottom])

  // 監聽聊天內容高度變化（motion 動畫、richContent 異步渲染）自動補滾
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
  }, [messages]) // messages 變化時重新掛載 observer，確保 container 存在

  // 處理滾動事件，判斷用戶是否在底部附近
  const handleChatScroll = useCallback(() => {
    // 程式控制滾動時不更新狀態
    if (isProgrammaticScrollRef.current) return

    const container = chatScrollRef.current
    if (!container) return

    // 閾值 150px（部署消息等大組件插入時距離會瞬間變大）
    const threshold = 150
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
      setCodePreviewData(null)
      // 重置編輯模式相關狀態
      setCodePreviewEditMode(false)
      setCodePreviewSelectedElement(null)
      setCodePreviewOverrides({})
      setCodePreviewOverrideHistory([{}])
      setCodePreviewHistoryIndex(0)
      setCodePreviewPendingUpdate(null)
      setCodePreviewPendingReset(null)
      setCodePreviewPendingOverrides(null)
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
          message: tLogin('subtleAfterRounds'),
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
          message: tLogin('subtleGenerating'),
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
          message: tLogin('emphasizedTitle'),
          subMessage: tLogin('emphasizedSubMessage'),
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
        progress: m.progress as Message['progress'],
        layoutHint: (m as unknown as Record<string, unknown>).layoutHint as Message['layoutHint'],
        richContent: (m as unknown as Record<string, unknown>).richContent as Message['richContent'],
        quickReplies: (m as unknown as Record<string, unknown>).quickReplies as Message['quickReplies'],
      }))
      setMessages(formattedMessages)

      // 提取 code_preview 數據到穩定 state
      const cpMsg = [...formattedMessages].reverse().find(m => m.richContent?.type === 'code_preview')
      setCodePreviewData(cpMsg?.richContent?.data ?? null)

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
      window.location.href = localePath(`/auth/login?anonymousId=${encodeURIComponent(anonymousId)}`)
    } else {
      window.location.href = localePath('/auth/login')
    }
  }

  // 進入儀表板（先同步 cookie 再跳轉）
  const handleDashboard = async () => {
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
  }

  // 處理關閉登入提示
  const handleDismissLoginPrompt = () => {
    if (loginPromptConfig) {
      dismissLoginPrompt(loginPromptConfig.promptId)
      setLoginPromptConfig(null)
    }
  }

  const startSendCooldown = useCallback((ms = 2000) => {
    setSendCooldown(true)
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
    cooldownTimerRef.current = setTimeout(() => setSendCooldown(false), ms)
  }, [])

  useEffect(() => () => {
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
  }, [])

  const handleSend = async () => {
    if (!sessionInfo || !input.trim() || isTyping || sendCooldown) return
    startSendCooldown()

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

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    // 延遲一幀讓 React 渲染完成後再滾動
    requestAnimationFrame(() => {
      scrollToBottom()
    })

    // 判斷是首次消息還是多輪對話回覆
    const token = getAuthToken()
    let result
    if (sessionInfo.currentTaskId) {
      result = await vpsReplyToConversation({
        conversationId: sessionInfo.conversationId,
        projectId: sessionInfo.projectId,
        userId: sessionInfo.userId,
        taskId: sessionInfo.currentTaskId,
        message: content,
        token: token || undefined
      })
    } else {
      result = await vpsSendMessage({
        conversationId: sessionInfo.conversationId,
        message: content,
        projectId: sessionInfo.projectId,
        userId: sessionInfo.userId,
        token: token || undefined
      })
    }

    if (!result.success) {
      // 發送失敗：移除樂觀消息，避免幽靈訊息
      setMessages(prev => prev.filter(m => m.id !== userMessage.id))
      setError(result.error || tChat('sendFailed'))
      setIsTyping(false)
    } else if (result.data?.messageId) {
      // 更新樂觀訊息的 ID 為實際的 DB ID，避免重複顯示
      setMessages(prev => prev.map(m =>
        m.id === userMessage.id ? { ...m, id: result.data!.messageId } : m
      ))
    }
  }

  // 發送指定內容的訊息（用於按鈕觸發）
  const handleSendMessage = async (content: string) => {
    if (!sessionInfo || !content.trim() || isTyping || sendCooldown) return
    startSendCooldown()

    // 樂觀更新
    const displayContent = getCommandLabel(content)
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: displayContent,
      timestamp: new Date(),
      pending: true
    }
    isNearBottomRef.current = true

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    requestAnimationFrame(() => {
      scrollToBottom()
    })

    const token = getAuthToken()
    let result
    if (sessionInfo.currentTaskId) {
      result = await vpsReplyToConversation({
        conversationId: sessionInfo.conversationId,
        projectId: sessionInfo.projectId,
        userId: sessionInfo.userId,
        taskId: sessionInfo.currentTaskId,
        message: content.trim(),
        token: token || undefined,
      })
    } else {
      result = await vpsSendMessage({
        conversationId: sessionInfo.conversationId,
        message: content.trim(),
        projectId: sessionInfo.projectId,
        userId: sessionInfo.userId,
        token: token || undefined,
      })
    }

    if (!result.success) {
      // 發送失敗：移除樂觀消息，避免幽靈訊息
      setMessages(prev => prev.filter(m => m.id !== userMessage.id))
      setError(result.error || tChat('sendFailed'))
      setIsTyping(false)
    }
  }

  // ── 「儲存修改」：將 DOM 覆蓋轉為迭代修改消息，寫回源碼 ──
  const handleCodePreviewSave = async () => {
    const hasOverrides = Object.keys(codePreviewOverrides).length > 0
    const hasAnnotations = Object.keys(codePreviewAnnotations).length > 0
    if ((!hasOverrides && !hasAnnotations) || !sessionInfo) return

    // 構建修改描述
    const lines: string[] = []
    const CSS_LABELS: Record<string, string> = {
      display: tCssLabel('display'),
      flexDirection: tCssLabel('flexDirection'),
      justifyContent: tCssLabel('justifyContent'),
      alignItems: tCssLabel('alignItems'),
      gap: tCssLabel('gap'),
      flexWrap: tCssLabel('flexWrap'),
      overflow: tCssLabel('overflow'),
      width: tCssLabel('width'),
      maxWidth: tCssLabel('maxWidth'),
      height: tCssLabel('height'),
      textDecoration: tCssLabel('textDecoration'),
      textTransform: tCssLabel('textTransform'),
      color: tCssLabel('color'),
      backgroundColor: tCssLabel('backgroundColor'),
      fontSize: tCssLabel('fontSize'),
      fontWeight: tCssLabel('fontWeight'),
      textAlign: tCssLabel('textAlign'),
      lineHeight: tCssLabel('lineHeight'),
      letterSpacing: tCssLabel('letterSpacing'),
      padding: tCssLabel('padding'),
      margin: tCssLabel('margin'),
      borderRadius: tCssLabel('borderRadius'),
      borderStyle: tCssLabel('borderStyle'),
      borderWidth: tCssLabel('borderWidth'),
      borderColor: tCssLabel('borderColor'),
      boxShadow: tCssLabel('boxShadow'),
      opacity: tCssLabel('opacity'),
      objectFit: tCssLabel('objectFit'),
    }

    // 解析 elementId 的共用函數
    const parseElementId = (elementId: string) => {
      let tag: string
      let index: number
      if (elementId.startsWith('container-')) {
        const parts = elementId.split('-')
        index = parseInt(parts[parts.length - 1]) + 1
        tag = parts.slice(1, -1).join('-')
      } else {
        const match = elementId.match(/^(.+)-(\d+)$/)
        tag = match ? match[1] : elementId
        index = match ? parseInt(match[2]) + 1 : 1
      }
      return { tag, index }
    }

    // 已處理的 elementId（避免重複）
    const processedElements = new Set<string>()

    Object.entries(codePreviewOverrides).forEach(([elementId, changes]) => {
      processedElements.add(elementId)
      const { tag, index } = parseElementId(elementId)
      const prefix = `#${index} <${tag}>`

      Object.entries(changes).forEach(([prop, value]) => {
        if (prop === 'text') {
          lines.push(`- ${prefix}: ${tCodePreview('textChanged', { value })}`)
        } else if (prop === 'imgSrc') {
          lines.push(`- ${prefix}: ${tCodePreview('imgSrcChanged', { value })}`)
        } else if (prop === 'imgAlt') {
          lines.push(`- ${prefix}: ${tCodePreview('imgAltChanged', { value })}`)
        } else {
          const label = CSS_LABELS[prop] || prop
          lines.push(`- ${prefix}: ${tCodePreview('styleChanged', { label, prop, value })}`)
        }
      })

      // 如果此元素也有批註，附加在屬性修改後面
      const annotation = codePreviewAnnotations[elementId]
      if (annotation) {
        lines.push(`- ${prefix}: ${tCodePreview('annotationPrefix')} ${annotation}`)
      }
    })

    // 處理只有批註、沒有 override 的元素
    Object.entries(codePreviewAnnotations).forEach(([elementId, text]) => {
      if (processedElements.has(elementId) || !text) return
      const { tag, index } = parseElementId(elementId)
      const prefix = `#${index} <${tag}>`
      lines.push(`- ${prefix}: ${tCodePreview('annotationPrefix')} ${text}`)
    })

    const message = [
      tCodePreview('saveMessage'),
      '',
      ...lines,
      '',
      tCodePreview('saveNote1'),
      tCodePreview('saveNote2'),
      tCodePreview('saveNote3'),
    ].join('\n')

    // 清除編輯狀態 + localStorage
    setCodePreviewEditMode(false)
    setCodePreviewSelectedElement(null)
    setCodePreviewOverrides({})
    setCodePreviewAnnotations({})
    setCodePreviewOverrideHistory([{}])
    setCodePreviewHistoryIndex(0)
    setCodePreviewPendingUpdate(null)
    setCodePreviewPendingReset(null)
    setCodePreviewPendingOverrides(null)
    localStorage.removeItem(`tc-edit-overrides-${sessionInfo.conversationId}`)
    localStorage.removeItem(`tc-edit-annotations-${sessionInfo.conversationId}`)

    // 發送迭代修改消息（走正常的 iteration 路由）
    await handleSendMessage(message)
  }

  const stages = [
    { key: 'discovery', title: tStage('discovery') },
    { key: 'clarify', title: tStage('clarify') },
    { key: 'formulation', title: tStage('formulation') },
    { key: 'generating', title: tStage('generating') },
    { key: 'complete', title: tStage('complete') },
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

    // 程式生成階段（含 UIUX pipeline）
    if (backendStage === 'generating' ||
        backendStage.includes('code') ||
        backendStage.includes('build') ||
        backendStage.includes('uiux_pipeline') ||
        backendStage.includes('uiux_structure') ||
        backendStage.includes('uiux_animation') ||
        backendStage.includes('uiux_rwd') ||
        backendStage.includes('uiux_quality_gate') ||
        backendStage.includes('uiux_iterating')) return 'generating'

    // 完成/部署階段
    if (backendStage === 'completed' ||
        backendStage === 'complete' ||
        backendStage === 'uiux_complete' ||
        backendStage.includes('deploy')) return 'complete'

    // Prefilter 攔截和 Meta 回覆不推進進度條
    if (backendStage === 'prefilter_rejected' || backendStage === 'meta_response') return 'discovery'

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
                {tChat('initializing')}
              </motion.div>
            )}

            {/* 計算是否顯示進度條 */}
            {(() => {
              // 找出最後一條訊息的階段
              const lastMessage = messages[messages.length - 1]
              const lastMessageStage = lastMessage?.stage || ''

              // 只有當最後一條訊息是進度訊息時才顯示進度條
              const isShowingProgress = ['init_progress', 'formulation_start', 'formulation_progress', 'fast_generating'].includes(lastMessageStage)

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
                      {getCommandLabel(message.content)}
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
                        {message.role === 'user' ? tChat('senderYou') : tChat('senderAssistant')}
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
                          <span style={{ whiteSpace: 'pre-wrap' }}>{getCommandLabel(message.content)}</span>
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
                                  {message.progress?.step || (message.stage === 'init_progress' ? tChat('analyzingProgress') : tChat('formulationProgress'))}
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
                                    key={`progress-bar-${message.id}`}
                                    initial={false}
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
                            recommendedIds={message.richContent?.data?.recommendedIds as string[] | undefined}
                            initialTemplates={message.richContent?.data?.templates as import('../lib/templates').TemplateCardData[] | undefined}
                            columns={layoutMode === 'split' ? 1 : 2}
                            showCategories={!message.richContent?.data?.filteredMode}
                          />
                        </motion.div>
                      )}

                      {/* Quick Replies */}
                      {message.role === 'assistant' &&
                       message.quickReplies &&
                       message.quickReplies.length > 0 &&
                       index === displayMessages.length - 1 &&
                       typingStage === 'none' && (
                        <QuickReplies replies={message.quickReplies} onSelect={handleSendMessage} />
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
                }}>{tChat('typingIndicatorName')}</div>
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
                    if (input.trim() && !isTyping && !sendCooldown && !isInitializing && sessionInfo) {
                      handleSend()
                    }
                  }
                }}
                placeholder={layoutMode === 'split' ? tChat('inputPlaceholderShort') : tChat('inputPlaceholder')}
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
              {(() => {
                const hasInput = !!deferredInput.trim()
                const hasConversation = messages.length > 0 && sessionInfo
                const isBusy = isTyping || sendCooldown || isInitializing || !sessionInfo

                // 沒打字 + 有對話 → 上一步按鈕
                if (!hasInput && hasConversation) {
                  const handleGoBack = () => {
                    if (isBusy) return
                    // 還沒有 taskId（初始階段）或只有一條用戶消息 → 回首頁
                    const userMsgCount = messages.filter(m => m.role === 'user').length
                    if (!sessionInfo?.currentTaskId || userMsgCount <= 1) {
                      onBack()
                    } else {
                      handleSendMessage('__go_back__')
                    }
                  }
                  return (
                    <motion.button
                      whileHover={isBusy ? {} : { scale: 1.02, backgroundColor: 'var(--gray-100)' }}
                      whileTap={isBusy ? {} : { scale: 0.98 }}
                      onClick={handleGoBack}
                      disabled={isBusy}
                      style={{
                        padding: layoutMode === 'split' ? '0 16px' : '0 20px',
                        height: layoutMode === 'split' ? 40 : 48,
                        fontSize: layoutMode === 'split' ? 13 : 14,
                        fontWeight: 500,
                        border: '1px solid var(--border-color)',
                        background: isBusy ? 'var(--gray-100)' : 'var(--white)',
                        color: isBusy ? 'var(--gray-300)' : 'var(--gray-600)',
                        cursor: isBusy ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                      }}
                    >
                      {tChat('goBackButton')}
                    </motion.button>
                  )
                }

                // 有打字 → 送出按鈕
                return (
                  <motion.button
                    whileHover={isBusy ? {} : { scale: 1.02 }}
                    whileTap={isBusy ? {} : { scale: 0.98 }}
                    onClick={handleSend}
                    disabled={!hasInput || isBusy}
                    style={{
                      padding: layoutMode === 'split' ? '0 20px' : '0 28px',
                      height: layoutMode === 'split' ? 40 : 48,
                      fontSize: layoutMode === 'split' ? 13 : 14,
                      fontWeight: 500,
                      border: '1px solid var(--black)',
                      background: !hasInput || isBusy ? 'var(--gray-100)' : 'var(--black)',
                      color: !hasInput || isBusy ? 'var(--gray-400)' : 'var(--white)',
                      cursor: !hasInput || isBusy ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    {tChat('sendButton')}
                  </motion.button>
                )
              })()}
            </div>
          </div>
        </motion.div>
      )}
    </>
  )

  // 穩定預覽數據（避免 renderPreviewPanel 每次 render 都建立新陣列 reference）
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

  // 預覽面板渲染函數（用於 SplitLayout）
  const renderPreviewPanel = () => {
    // ── BDD Q&A 蓋房子場景 ──
    // 用 messages.some() 判斷是否在 BDD 階段，避免用戶回答後 latestMsg 沒 stage 導致動畫消失
    const BDD_STAGES = new Set([
      'clarify_question', 'prd_discovery_continue', 'prd_discovery_complete',
      'prd_discovery_analyzing', 'prd_discovery_generating', 'prd_discovery_deduping',
      'batch_confirm', 'batch_confirmed',
    ])
    const hasBddStage = messages.some(m => m.stage && BDD_STAGES.has(m.stage))
    const latestMsg = messages[messages.length - 1]

    // 檢查是否已進入 UIUX 階段（不再顯示蓋房子）
    const hasUiuxStage = messages.some(m => m.stage?.startsWith('uiux') || m.richContent?.type === 'code_preview')

    if (hasBddStage && !hasUiuxStage) {
      // 提取建築進度
      const buildingMsg = [...messages].reverse().find(m => m.richContent?.type === 'building_progress')
      const buildingData = buildingMsg?.richContent?.data as { current?: number; total?: number; round?: number; maxRounds?: number } | undefined
      const bddProgress = buildingData?.current ?? 0
      const bddTotal = buildingData?.total ?? 30
      const bddRound = buildingData?.round ?? 1
      const latestAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.stage)
      const isLLMWorking = latestAssistantMsg?.stage === 'prd_discovery_analyzing'
        || latestAssistantMsg?.stage === 'prd_discovery_generating'
        || latestAssistantMsg?.stage === 'prd_discovery_deduping'
        || latestAssistantMsg?.stage === 'prd_discovery_continue'
      const isQAComplete = latestAssistantMsg?.stage === 'prd_discovery_complete'
        || latestAssistantMsg?.stage === 'formulation_start'

      return (
        <div style={{ height: '100%' }}>
          <BuildingPlayer
            progress={bddProgress}
            totalQuestions={bddTotal}
            round={bddRound}
            maxRounds={buildingData?.maxRounds ?? 6}
            isWorking={isLLMWorking}
            isComplete={isQAComplete}
            conversationId={sessionInfo?.conversationId}
          />
        </div>
      )
    }

    // ── Fast Build 藍圖進度 ──
    const isFastBuilding = latestMsg?.stage === 'fast_generating'
    const fastBuildMsg = [...messages].reverse().find(m => m.richContent?.type === 'fast_build_progress')

    if (isFastBuilding && !streamingPreview) {
      const fbData = fastBuildMsg?.richContent?.data as { phase?: string; progress?: { current: number; total: number; step: string } } | undefined
      const fbPhase = (fbData?.phase || 'structure') as 'structure' | 'animation' | 'rwd' | 'quality_gate' | 'complete'
      const fbProgress = fbData?.progress || { current: 1, total: 3, step: tPreview('phaseStructure') }

      return (
        <FastBuildPlayer
          phase={fbPhase}
          progress={fbProgress}
          streamingChunks={fastBuildChunks}
        />
      )
    }

    // 使用穩定的預覽數據（避免每次 render 都搜索 messages + 建立新陣列）
    if (stablePreviewData) {
      const { pages: pagesData, components: componentsData, styles: stylesData, tailwindConfig: tailwindConfigData, isStreaming } = stablePreviewData
      // 響應式渲染：容器寬度用於設備切換的外層限制
      const containerW = codePreviewContainerWidth > 0 ? codePreviewContainerWidth : 800
      const maxDeviceWidth = getDeviceWidth(codePreviewDevice)
      const previewWidth = codePreviewDevice === 'desktop' ? containerW : Math.min(maxDeviceWidth, containerW)

      // Streaming 但還沒有任何頁面檔案 → 顯示藍圖進度
      if (isStreaming && pagesData.length === 0) {
        const spPhase = stablePreviewData.phase
        const phaseMap: Record<string, number> = { structure: 1, animation: 2, rwd: 3 }
        return (
          <FastBuildPlayer
            phase={spPhase as 'structure' | 'animation' | 'rwd'}
            progress={{ current: phaseMap[spPhase] || 1, total: 3, step: spPhase === 'structure' ? tPreview('phaseStructure') : spPhase === 'animation' ? tPreview('phaseAnimation') : tPreview('phaseRwd') }}
            streamingChunks={fastBuildChunks}
          />
        )
      }

      const spPhase = stablePreviewData.phase
      const phaseLabel = isStreaming
        ? (spPhase === 'structure' ? tPreview('streamingStructure') : spPhase === 'animation' ? tPreview('streamingAnimation') : tPreview('streamingRwd'))
        : null

      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* 工具列 */}
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
            {/* 左側：標題 + 編輯按鈕 + Undo/Redo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isStreaming ? (
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--black)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--accent)', animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                  {phaseLabel}
                </span>
              ) : (
                <>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--black)' }}>{tPreview('title')}</span>
                  {/* 編輯模式切換按鈕 */}
                  <button
                    onClick={() => {
                      if (codePreviewEditMode) {
                        setCodePreviewEditMode(false)
                        setCodePreviewSelectedElement(null)
                      } else {
                        setCodePreviewEditMode(true)
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 6,
                      border: '1px solid var(--border-color)',
                      background: codePreviewEditMode ? 'var(--black)' : 'var(--white)',
                      color: codePreviewEditMode ? 'var(--white)' : 'var(--gray-600)',
                      fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title={codePreviewEditMode ? tPreview('exitEditTitle') : tPreview('enterEditTitle')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                    {tPreview('editButton')}
                  </button>
                  {/* Undo/Redo 按鈕（僅編輯模式時顯示） */}
                  {codePreviewEditMode && (
                    <>
                      <button
                        onClick={handleCodePreviewUndo}
                        disabled={!codePreviewCanUndo}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 28, height: 28, borderRadius: 6,
                          border: '1px solid var(--border-color)',
                          background: 'var(--white)', cursor: codePreviewCanUndo ? 'pointer' : 'default',
                          opacity: codePreviewCanUndo ? 1 : 0.35,
                          transition: 'opacity 0.15s',
                        }}
                        title={tPreview('undoTitle')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                        </svg>
                      </button>
                      <button
                        onClick={handleCodePreviewRedo}
                        disabled={!codePreviewCanRedo}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 28, height: 28, borderRadius: 6,
                          border: '1px solid var(--border-color)',
                          background: 'var(--white)', cursor: codePreviewCanRedo ? 'pointer' : 'default',
                          opacity: codePreviewCanRedo ? 1 : 0.35,
                          transition: 'opacity 0.15s',
                        }}
                        title={tPreview('redoTitle')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
                        </svg>
                      </button>
                      {/* 儲存修改按鈕 */}
                      <button
                        onClick={handleCodePreviewSave}
                        disabled={(Object.keys(codePreviewOverrides).length === 0 && Object.keys(codePreviewAnnotations).length === 0) || isTyping}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '4px 10px', borderRadius: 6,
                          border: '1px solid var(--border-color)',
                          background: (Object.keys(codePreviewOverrides).length > 0 || Object.keys(codePreviewAnnotations).length > 0) && !isTyping ? 'var(--accent)' : 'var(--white)',
                          color: (Object.keys(codePreviewOverrides).length > 0 || Object.keys(codePreviewAnnotations).length > 0) && !isTyping ? '#fff' : 'var(--gray-400)',
                          fontSize: 12, fontWeight: 500,
                          cursor: (Object.keys(codePreviewOverrides).length > 0 || Object.keys(codePreviewAnnotations).length > 0) && !isTyping ? 'pointer' : 'default',
                          opacity: (Object.keys(codePreviewOverrides).length > 0 || Object.keys(codePreviewAnnotations).length > 0) && !isTyping ? 1 : 0.5,
                          transition: 'all 0.15s ease',
                        }}
                        title={tPreview('saveTitle')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                          <polyline points="17 21 17 13 7 13 7 21" />
                          <polyline points="7 3 7 8 15 8" />
                        </svg>
                        {tPreview('saveButton')}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
            {/* 右側：DeviceSwitcher + 寬度 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {!isStreaming && <DeviceSwitcher activeDevice={codePreviewDevice} onDeviceChange={(d) => { setCodePreviewDevice(d); setCodePreviewSelectedElement(null) }} />}
              <span style={{ fontSize: 11, color: 'var(--gray-400)', fontFamily: 'var(--font-mono)', width: 50, textAlign: 'right' }}>
                {previewWidth}px
              </span>
            </div>
          </div>
          {/* 主內容區域：預覽 + PropertyEditor 側邊欄 */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
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
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: codePreviewDevice === 'desktop' ? '100%' : previewWidth,
                  height: '100%',
                  borderRadius: codePreviewDevice === 'desktop' ? 0 : 8,
                  boxShadow: codePreviewDevice === 'desktop' ? 'none' : '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
                  background: '#fff',
                  overflow: 'hidden',
                }}
              >
                <SandpackPreviewComponent
                  pages={pagesData}
                  components={componentsData}
                  styles={stylesData}
                  tailwindConfig={tailwindConfigData}
                  isStreaming={isStreaming}
                  editMode={codePreviewEditMode}
                  onElementSelected={setCodePreviewSelectedElement}
                  pendingUpdate={codePreviewPendingUpdate}
                  pendingReset={codePreviewPendingReset}
                  pendingOverrides={codePreviewPendingOverrides}
                  overrides={codePreviewOverrides}
                  annotations={codePreviewAnnotations}
                  onElementResized={handleCodePreviewElementResized}
                />
              </div>
              {/* 編輯模式提示浮層 */}
              {codePreviewEditMode && !codePreviewSelectedElement && !isStreaming && (
                <div style={{
                  position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                  padding: '8px 16px', borderRadius: 8,
                  background: 'rgba(0,0,0,0.75)', color: '#fff',
                  fontSize: 13, fontWeight: 500, pointerEvents: 'none',
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
                  </svg>
                  {tPreview('editHint')}
                </div>
              )}
            </div>
            {/* PropertyEditor 側邊欄 */}
            <AnimatePresence>
              {codePreviewEditMode && codePreviewSelectedElement && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 280, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  style={{
                    overflow: 'hidden',
                    borderLeft: '1px solid var(--border-color)',
                    background: 'var(--white)',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ width: 280, height: '100%', overflow: 'auto' }}>
                    <PropertyEditor
                      element={codePreviewSelectedElement}
                      onUpdate={handleCodePreviewElementUpdate}
                      onClose={() => setCodePreviewSelectedElement(null)}
                      onReset={handleCodePreviewResetElement}
                      onUploadImage={handleCodePreviewUploadImage}
                      annotation={codePreviewAnnotations[codePreviewSelectedElement.id] || ''}
                      onAnnotationChange={handleCodePreviewAnnotationChange}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {isStreaming && <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>}
        </div>
      )
    }

    // 偵測是否正在生成代碼（有 pipeline/generating stage 訊息）
    const generatingStages = ['uiux_pipeline_progress', 'uiux_structure_generating', 'uiux_animation_generating', 'uiux_rwd_generating', 'uiux_quality_gate_running', 'uiux_quality_gate_fixing']
    const lastMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.stage)
    const isGenerating = lastMsg && generatingStages.includes(lastMsg.stage || '')

    if (isGenerating) {
      // 從 progress 推斷當前階段
      const progress = lastMsg?.progress
      const step = progress?.step || tPreview('generating')
      const phaseNum = progress?.current || 0
      const totalPhases = progress?.total || 3

      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* 頂部 bar */}
          <div style={{
            display: 'flex', alignItems: 'center', padding: '12px 16px',
            borderBottom: '1px solid var(--border-color)', background: 'var(--white)', gap: 8,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--accent)', animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--black)' }}>
              {tPreview('titleWithStep', { step })}
            </span>
          </div>
          {/* 中央等待區 */}
          <div ref={codePreviewContainerRef} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', gap: 16,
          }}>
            {/* 進度條 */}
            <div style={{ width: 200, height: 4, borderRadius: 2, background: 'var(--gray-200)', overflow: 'hidden' }}>
              <div style={{
                width: `${(phaseNum / totalPhases) * 100}%`,
                height: '100%', borderRadius: 2,
                background: 'var(--accent)',
                transition: 'width 0.5s ease',
              }} />
            </div>
            <p style={{ color: 'var(--gray-500)', fontSize: 14, margin: 0 }}>
              {tPreview('phaseProgress', { phaseNum, totalPhases, step })}
            </p>
            <p style={{ color: 'var(--gray-400)', fontSize: 12, margin: 0 }}>
              {tPreview('waitingMessage')}
            </p>
          </div>
          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
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
            onClick={() => handleSendMessage(tPreview('selectTemplateMessage', { name: selectedTemplate.name }))}
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
            {tPreview('useTemplateButton')}
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
    // BDD 階段（有釐清但還沒進 UIUX）需要更寬的對話面板
    const isBddSplitMode = messages.some(m =>
      m.stage === 'clarify_question' || m.stage === 'prd_discovery_continue' || m.stage === 'prd_discovery_complete'
    ) && !messages.some(m => m.stage?.startsWith('uiux') || m.richContent?.type === 'code_preview')
    // BDD 模式：聊天佔 80%，需求藍圖動畫佔 20%
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
    const bddChatWidth = isBddSplitMode ? Math.round(screenWidth * 0.8) : 420
    const bddMinChatWidth = isBddSplitMode ? Math.round(screenWidth * 0.7) : 320
    const bddMaxChatWidth = isBddSplitMode ? Math.round(screenWidth * 0.9) : 600

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
          defaultChatWidth={bddChatWidth}
          minChatWidth={bddMinChatWidth}
          maxChatWidth={bddMaxChatWidth}
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
                  {tChat('headerBackButton')}
                </button>
                <div style={{ width: 1, height: 20, background: 'var(--border-color)' }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>{isBddSplitMode ? tChat('bddSplitTitle') : tChat('uiuxSplitTitle')}</span>
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
                <span className="back-text">{tChat('backButton')}</span>
              </button>
              <div className="header-divider" style={{ width: 1, height: 24, background: 'var(--border-color)' }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Tellcraft" width={24} height={24} style={{ borderRadius: 4 }} />
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
                {stages[currentStageIndex]?.title || tChat('preparing')}
              </span>
            </div>

            {/* 右側：主題切換 + 用戶資訊 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              {/* 主題切換 */}
              <span className="header-theme-toggle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AnimatedThemeToggler /><LocaleSwitcher /></span>
              {/* 用戶資訊 - 優先使用 VPS auth 狀態 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {(auth.isAuthenticated || sessionInfo?.isAuthenticated) ? (
                  <>
                    {(auth.user?.avatarUrl || sessionInfo?.user?.avatarUrl) && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        className="header-avatar"
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
                      {auth.user?.name || sessionInfo?.user?.name || auth.user?.email?.split('@')[0] || sessionInfo?.user?.email?.split('@')[0] || tChat('defaultUserName')}
                    </span>
                    <span className="header-dashboard-btn">
                      <GlowButton onClick={handleDashboard} variant="outline" size="sm">
                        {tChat('dashboardButton')}
                      </GlowButton>
                    </span>
                  </>
                ) : (
                  <GlowButton onClick={handleLogin} variant="outline" size="sm">
                    {tChat('loginButton')}
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
  const t = useTranslations('useCases')
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const useCases = [
    {
      audience: t('audience1'),
      title: t('title1'),
      description: t('desc1'),
      examples: [t('examples1_1'), t('examples1_2'), t('examples1_3')]
    },
    {
      audience: t('audience2'),
      title: t('title2'),
      description: t('desc2'),
      examples: [t('examples2_1'), t('examples2_2'), t('examples2_3')]
    },
    {
      audience: t('audience3'),
      title: t('title3'),
      description: t('desc3'),
      examples: [t('examples3_1'), t('examples3_2'), t('examples3_3')]
    },
    {
      audience: t('audience4'),
      title: t('title4'),
      description: t('desc4'),
      examples: [t('examples4_1'), t('examples4_2'), t('examples4_3')]
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
            {t('heading')}{' '}
            <RotatingText
              texts={[t('audience1'), t('audience2'), t('audience3'), t('audience4')]}
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
            {t('subtitle')}
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
  const t = useTranslations('howItWorks')
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const steps = [
    {
      number: '01',
      title: t('step1Title'),
      description: t('step1Desc'),
    },
    {
      number: '02',
      title: t('step2Title'),
      description: t('step2Desc'),
    },
    {
      number: '03',
      title: t('step3Title'),
      description: t('step3Desc'),
    },
    {
      number: '04',
      title: t('step4Title'),
      description: t('step4Desc'),
    },
    {
      number: '05',
      title: t('step5Title'),
      description: t('step5Desc'),
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
  const t = useTranslations('stats')
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const stats = [
    { value: 90, suffix: '%', label: t('label1'), description: t('desc1') },
    { value: 24, suffix: t('suffixHours'), label: t('label2'), description: t('desc2') },
    { value: 0, suffix: t('suffixLines'), label: t('label3'), description: t('desc3') },
    { value: 100, suffix: '%', label: t('label4'), description: t('desc4') },
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
            {t('heading')}
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
  const t = useTranslations('comparison')
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const comparisons = [
    { feature: t('feature1'), traditional: t('traditional1'), tellcraft: t('tellcraft1') },
    { feature: t('feature2'), traditional: t('traditional2'), tellcraft: t('tellcraft2') },
    { feature: t('feature3'), traditional: t('traditional3'), tellcraft: t('tellcraft3') },
    { feature: t('feature4'), traditional: t('traditional4'), tellcraft: t('tellcraft4') },
    { feature: t('feature5'), traditional: t('traditional5'), tellcraft: t('tellcraft5') },
    { feature: t('feature6'), traditional: t('traditional6'), tellcraft: t('tellcraft6') },
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
            {t('heading')}
          </h2>
          <p style={{ fontSize: 16, color: 'var(--gray-500)' }}>
            {t('subtitle')}
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
            <span>{t('columnFeature')}</span>
            <span style={{ textAlign: 'center' }}>{t('columnTraditional')}</span>
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
  const t = useTranslations('showcase')
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const showcases = [
    { title: t('item1Title'), category: t('item1Category'), description: t('item1Desc'), stats: t('item1Stats'), color: '#f5f5f5' },
    { title: t('item2Title'), category: t('item2Category'), description: t('item2Desc'), stats: t('item2Stats'), color: '#fafafa' },
    { title: t('item3Title'), category: t('item3Category'), description: t('item3Desc'), stats: t('item3Stats'), color: '#f8f8f8' },
    { title: t('item4Title'), category: t('item4Category'), description: t('item4Desc'), stats: t('item4Stats'), color: '#f5f5f5' },
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
              <BlurRevealText text={t('heading1')} delay={0} />
              <br />
              <BlurRevealText text={t('heading2')} delay={0.15} />
            </h2>
            <p style={{
              fontSize: 16,
              color: 'var(--gray-500)',
              lineHeight: 1.7,
              marginBottom: 32,
              maxWidth: 400,
            }}>
              {t('description')}
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
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{t('statsProjects')}</div>
              </div>
              <div>
                <div style={{
                  fontSize: 32,
                  fontWeight: 300,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '-0.02em',
                }}>
                  <AnimatedCounter target={12} suffix={t('suffixTypes')} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{t('statsIndustries')}</div>
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
                      {t('cardHint')}
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
  const t = useTranslations('faq')
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    { question: t('q1'), answer: t('a1') },
    { question: t('q2'), answer: t('a2') },
    { question: t('q3'), answer: t('a3') },
    { question: t('q4'), answer: t('a4') },
    { question: t('q5'), answer: t('a5') },
    { question: t('q6'), answer: t('a6') },
    { question: t('q7'), answer: t('a7') },
    { question: t('q8'), answer: t('a8') },
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
              {t('heading')}
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
              {t('subtitle')}
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
  const t = useTranslations('testimonial')
  const quotes = [
    { text: t('quote1'), author: t('author1'), role: t('role1'), company: t('company1') },
    { text: t('quote2'), author: t('author2'), role: t('role2'), company: t('company2') },
    { text: t('quote3'), author: t('author3'), role: t('role3'), company: t('company3') },
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
  const t = useTranslations('cta')
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
          {t('heading')}
        </h2>
        <p style={{
          fontSize: 16,
          color: 'var(--gray-500)',
          lineHeight: 1.7,
          marginBottom: 40,
        }}>
          {t('line1')}<br />
          {t('line2')}
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
          {t('button')}
        </motion.button>
      </motion.div>
    </section>
  )
}

// ============ Footer (SEO) ============
function Footer() {
  const t = useTranslations('footer')
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
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Tellcraft" width={24} height={24} style={{ borderRadius: 4 }} />
              <span>Tellcraft</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.6 }}>
              {t('description1')}<br />
              {t('description2')}
            </p>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)' }}>
              {t('navProduct')}
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="#how-it-works" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>{t('linkFeatures')}</a>
              <a href="#use-cases" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>{t('linkUseCases')}</a>
              <a href="#faq" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>{t('linkFaq')}</a>
            </nav>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)' }}>
              {t('navResources')}
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="#" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>{t('linkDocs')}</a>
              <a href="#" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>{t('linkApi')}</a>
              <a href="#" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>{t('linkBlog')}</a>
            </nav>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)' }}>
              {t('navAbout')}
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="#" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>{t('linkPrivacy')}</a>
              <a href="#" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>{t('linkTerms')}</a>
              <a href="#" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>{t('linkContact')}</a>
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
  const tChat = useTranslations('chat')
  const tAuth = useTranslations('auth')
  const tCommon = useTranslations('common')
  const localePath = useLocalePath()
  const searchParams = useSearchParams()
  const [isChatActive, setIsChatActive] = useState(false)
  const [heroInput, setHeroInput] = useState('')
  const [initialMessage, setInitialMessage] = useState('')
  const [resumeConversationId, setResumeConversationId] = useState<string | null>(null)
  const [anonymousId, setAnonymousId] = useState<string | undefined>(undefined)
  const [buildMode, setBuildMode] = useState<'fast' | 'fine'>('fast')

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
        // Token 無效，清除並重新登入
        localStorage.removeItem('auth_token')
        window.location.href = localePath('/auth/login?next=/dashboard')
      }
    } catch {
      // 網路錯誤，直接嘗試跳轉（讓 middleware 處理）
      window.location.href = localePath('/dashboard')
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
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AnimatedThemeToggler />
            <LocaleSwitcher />
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
              {auth.user.name || auth.user.email?.split('@')[0] || tChat('defaultUserName')}
            </span>
            <GlowButton onClick={handleDashboard} variant="outline" size="sm">
              {tAuth('dashboardButton')}
            </GlowButton>
            <GlowButton onClick={handleSignOut} variant="outline" size="sm">
              {tAuth('logoutButton')}
            </GlowButton>
          </div>
        ) : (
          // 未登入 - 顯示登入按鈕
          <GlowButton href="/auth/login" variant="outline" size="sm">
            {tAuth('loginButton')}
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
        buildMode={buildMode}
        onBuildModeChange={setBuildMode}
      />

      {/* Chat Overlay */}
      <ChatSection
        isActive={isChatActive}
        initialMessage={initialMessage}
        resumeConversationId={resumeConversationId}
        onBack={handleBackToHome}
        buildMode={buildMode}
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
        Loading...
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
