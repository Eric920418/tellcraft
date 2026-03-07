'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { smoothEasing } from '@/app/lib/chat-utils'
import ScrollIndicator from './ScrollIndicator'
import TextType from '@/app/components/TextType'

function HeroSection({
  onStartChat,
  inputValue,
  onInputChange,
  isChatActive,
  buildMode,
  onBuildModeChange,
  isAuthenticated,
  onLoginRequired,
  recentProjects,
  onResumeProject,
}: {
  onStartChat: () => void
  inputValue: string
  onInputChange: (value: string) => void
  isChatActive: boolean
  buildMode: 'fast' | 'fine'
  onBuildModeChange: (mode: 'fast' | 'fine') => void
  isAuthenticated: boolean
  onLoginRequired: () => void
  recentProjects: Array<{ id: string; name: string; status: string; latestConversationId: string | null }>
  onResumeProject: (conversationId: string) => void
}) {
  const tHero = useTranslations('hero')
  const [isFocused, setIsFocused] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 返回首頁時重置過渡動畫狀態
  useEffect(() => {
    if (!isChatActive) {
      setIsTransitioning(false)
    }
  }, [isChatActive])

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
                  onClick={() => {
                    if (!isAuthenticated) {
                      onLoginRequired()
                      return
                    }
                    onBuildModeChange('fine')
                  }}
                  style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 500,
                    background: buildMode === 'fine' ? 'var(--black)' : 'transparent',
                    color: buildMode === 'fine' ? 'var(--white)' : 'var(--gray-500)',
                    border: 'none',
                    borderRadius: 4,
                    cursor: isAuthenticated ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    opacity: isAuthenticated ? 1 : 0.5,
                  }}
                >
                  {tHero('modeFine')}
                </button>
              </div>
              <span style={{ fontSize: 12, color: isFastModeShortWarning ? 'var(--amber-500, #f59e0b)' : 'var(--gray-400)', flex: 1, textAlign: 'center', transition: 'color 0.2s ease' }}>
                {!isAuthenticated
                  ? tHero('guestHint')
                  : isFastModeShortWarning
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

      {/* Recent Projects Pills */}
      {!isChatActive && !isTransitioning && recentProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            marginTop: 24,
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--gray-400)', letterSpacing: '0.03em' }}>
            {tHero('recentProjects')}
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {recentProjects.slice(0, 3).map((project) => (
              project.latestConversationId && (
                <motion.button
                  key={project.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onResumeProject(project.latestConversationId!)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    fontSize: 13,
                    fontWeight: 400,
                    background: 'var(--white)',
                    color: 'var(--gray-600)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 20,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: project.status === 'deployed' ? '#22C55E'
                      : project.status === 'failed' ? '#EF4444'
                      : project.status === 'generating' ? '#F59E0B'
                      : 'var(--gray-300)',
                    flexShrink: 0,
                  }} />
                  {project.name}
                </motion.button>
              )
            ))}
          </div>
        </motion.div>
      )}

      <ScrollIndicator visible={!isFocused && !inputValue && !isTransitioning} />
    </motion.section>
  )
}

export default HeroSection
