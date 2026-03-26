'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { smoothEasing } from '@/app/lib/chat-utils'
import ScrollIndicator from './ScrollIndicator'
import TextType from '@/app/components/TextType'

const VISIBLE_PRESET_COUNT = 4
const PRESET_ROTATE_INTERVAL_MS = 7000

type PresetDefinition = {
  key: string
  title: string
  summary: string
  prompt: string
}

type PresetCard = {
  id: number
  preset: PresetDefinition
}

const pickRandomPresets = (presets: PresetDefinition[], count: number) => {
  const shuffled = [...presets]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

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
  heroImages,
  onHeroImagesChange,
}: {
  onStartChat: () => void
  inputValue: string
  onInputChange: (value: string) => void
  isChatActive: boolean
  buildMode: 'fast' | 'fine' | 'clone'
  onBuildModeChange: (mode: 'fast' | 'fine' | 'clone') => void
  isAuthenticated: boolean
  onLoginRequired: () => void
  recentProjects: Array<{ id: string; name: string; status: string; latestConversationId: string | null }>
  onResumeProject: (conversationId: string) => void
  heroImages: File[]
  onHeroImagesChange: (files: File[]) => void
}) {
  const tHero = useTranslations('hero')
  const [isFocused, setIsFocused] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [presetCards, setPresetCards] = useState<PresetCard[]>([])
  const [activePresetKey, setActivePresetKey] = useState<string | null>(null)
  const [isPresetOpen, setIsPresetOpen] = useState(true)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const heroImageInputRef = useRef<HTMLInputElement>(null)
  const presetIdRef = useRef(0)
  const presetActiveTimeoutRef = useRef<number | null>(null)

  const presetNeuronTitle = tHero('presetNeuronTitle')
  const presetNeuronSummary = tHero('presetNeuronSummary')
  const presetNeuronPrompt = tHero('presetNeuronPrompt')
  const presetSpectrumTitle = tHero('presetSpectrumTitle')
  const presetSpectrumSummary = tHero('presetSpectrumSummary')
  const presetSpectrumPrompt = tHero('presetSpectrumPrompt')
  const presetResonanceTitle = tHero('presetResonanceTitle')
  const presetResonanceSummary = tHero('presetResonanceSummary')
  const presetResonancePrompt = tHero('presetResonancePrompt')
  const presetFiberTitle = tHero('presetFiberTitle')
  const presetFiberSummary = tHero('presetFiberSummary')
  const presetFiberPrompt = tHero('presetFiberPrompt')
  const heroTitle = tHero('title')
  const heroTitleTexts = useMemo(() => [heroTitle], [heroTitle])

  const presetDefinitions = useMemo(
    () => [
      {
        key: 'neuron',
        title: presetNeuronTitle,
        summary: presetNeuronSummary,
        prompt: presetNeuronPrompt,
      },
      {
        key: 'spectrum',
        title: presetSpectrumTitle,
        summary: presetSpectrumSummary,
        prompt: presetSpectrumPrompt,
      },
      {
        key: 'resonance',
        title: presetResonanceTitle,
        summary: presetResonanceSummary,
        prompt: presetResonancePrompt,
      },
      {
        key: 'fiber',
        title: presetFiberTitle,
        summary: presetFiberSummary,
        prompt: presetFiberPrompt,
      },
    ],
    [
      presetNeuronTitle,
      presetNeuronSummary,
      presetNeuronPrompt,
      presetSpectrumTitle,
      presetSpectrumSummary,
      presetSpectrumPrompt,
      presetResonanceTitle,
      presetResonanceSummary,
      presetResonancePrompt,
      presetFiberTitle,
      presetFiberSummary,
      presetFiberPrompt,
    ]
  )

  const buildPresetCards = useCallback((presets: PresetDefinition[]) => (
    pickRandomPresets(presets, VISIBLE_PRESET_COUNT).map((preset) => ({
      id: (presetIdRef.current += 1),
      preset,
    }))
  ), [])

  // 返回首頁時重置過渡動畫狀態
  useEffect(() => {
    if (!isChatActive) {
      setIsTransitioning(false)
    }
  }, [isChatActive])

  useEffect(() => {
    setPresetCards(buildPresetCards(presetDefinitions))
  }, [presetDefinitions, buildPresetCards])

  useEffect(() => {
    if (isChatActive || isTransitioning || presetDefinitions.length <= VISIBLE_PRESET_COUNT) {
      return
    }

    const interval = window.setInterval(() => {
      setPresetCards((previousCards) => {
        if (previousCards.length === 0) {
          return buildPresetCards(presetDefinitions)
        }

        const existingKeys = new Set(previousCards.map((card) => card.preset.key))
        const candidates = presetDefinitions.filter((preset) => !existingKeys.has(preset.key))
        if (candidates.length === 0) return previousCards

        const replaceIndex = Math.floor(Math.random() * previousCards.length)
        const replacement = candidates[Math.floor(Math.random() * candidates.length)]
        const nextCards = [...previousCards]
        nextCards[replaceIndex] = {
          id: (presetIdRef.current += 1),
          preset: replacement,
        }
        return nextCards
      })
    }, PRESET_ROTATE_INTERVAL_MS)

    return () => {
      window.clearInterval(interval)
    }
  }, [presetDefinitions, isChatActive, isTransitioning, buildPresetCards])

  useEffect(() => {
    return () => {
      if (presetActiveTimeoutRef.current !== null) {
        window.clearTimeout(presetActiveTimeoutRef.current)
      }
    }
  }, [])

  const trimmedInput = inputValue.trim()
  const isFastModeShortWarning = buildMode === 'fast' && trimmedInput.length > 0 && trimmedInput.length < 15
  const canSubmit = (trimmedInput.length > 0 || (buildMode === 'clone' && heroImages.length > 0)) && !isTransitioning

  const handlePresetApply = (preset: PresetDefinition) => {
    onInputChange(preset.prompt)
    inputRef.current?.focus()
    setActivePresetKey(preset.key)
    if (presetActiveTimeoutRef.current !== null) {
      window.clearTimeout(presetActiveTimeoutRef.current)
    }
    presetActiveTimeoutRef.current = window.setTimeout(() => {
      setActivePresetKey(null)
    }, 900)
  }

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
        overflowX: 'clip',
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
          zIndex: -1,
          background: 'radial-gradient(ellipse at 50% 30%, var(--gray-50) 0%, var(--white) 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="hero-content-grid"
        style={{
          width: '100%',
          maxWidth: 640,
        }}
      >
        {/* 標題區塊 - 先退場 */}
        <motion.div
          className="hero-title-block"
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
              texts={heroTitleTexts}
              typingSpeed={75}
              pauseDuration={1500}
              showCursor
              cursorCharacter="_"
              deletingSpeed={50}
              cursorBlinkDuration={0.5}
            />
          </h1>
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: isTransitioning || isChatActive ? 0 : 1 }}
            transition={{ duration: 0.3, delay: isTransitioning ? 0 : 1.2 }}
          >
            {tHero('subtitle')}
          </motion.p>
        </motion.div>

        <motion.aside
          className="hero-preset-panel"
          initial={{ opacity: 0, x: -260, y: '-50%' }}
          animate={{
            opacity: isTransitioning || isChatActive ? 0 : 1,
            x: isTransitioning || isChatActive ? -260 : isPresetOpen ? 0 : -260,
            y: '-50%',
          }}
          transition={{
            opacity: { duration: 0.4, delay: isTransitioning ? 0 : 0.65 },
            x: { duration: 0.22, ease: smoothEasing },
            y: { duration: 0 },
          }}
        >
          {/* 伸縮 toggle */}
          <button
            className="hero-preset-toggle"
            onClick={() => setIsPresetOpen((prev) => !prev)}
            aria-label={isPresetOpen ? 'Collapse presets' : 'Expand presets'}
          >
            <motion.span
              animate={{ rotate: isPresetOpen ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              style={{ display: 'inline-block', lineHeight: 1 }}
            >
              ›
            </motion.span>
          </button>
          <div className="hero-preset-header">
            <span>{tHero('presetTitle')}</span>
            <p>{tHero('presetSubtitle')}</p>
          </div>
          <div className="hero-preset-list" role="list" aria-label={tHero('presetTitle')}>
            <AnimatePresence initial={false} mode="popLayout">
              {presetCards.map((card, index) => (
                <motion.button
                  key={card.id}
                  layout
                  role="listitem"
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: smoothEasing }}
                  onClick={() => handlePresetApply(card.preset)}
                  className={`hero-preset-card ${activePresetKey === card.preset.key ? 'is-active' : ''}`}
                >
                  <span className="hero-preset-index">{`${index + 1}`.padStart(2, '0')}</span>
                  <span className="hero-preset-content">
                    <span className="hero-preset-card-title">{card.preset.title}</span>
                    <span className="hero-preset-card-summary">{card.preset.summary}</span>
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </motion.aside>

        {/* 輸入框區塊 - 稍後退場，有不同的動態 */}
        <motion.div
          className="hero-composer-block"
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
                ? '0 0 0 1px var(--accent), 0 8px 32px rgba(201,81,47,0.1)'
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
              placeholder={buildMode === 'clone'
                ? tHero('placeholderClone')
                : buildMode === 'fast'
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
            {/* Clone 模式：圖片上傳 + 預覽 */}
            {buildMode === 'clone' && (
              <>
                <input
                  ref={heroImageInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => {
                    const files = e.target.files
                    if (!files) return
                    const accepted = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
                    const newFiles = Array.from(files).filter(f => accepted.includes(f.type) && f.size <= 5 * 1024 * 1024)
                    onHeroImagesChange([...heroImages, ...newFiles].slice(0, 5))
                    e.target.value = ''
                  }}
                  style={{ display: 'none' }}
                />
                {heroImages.length > 0 && (
                  <div style={{
                    padding: '8px 16px',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    background: 'var(--gray-50)',
                  }}>
                    {heroImages.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} style={{ position: 'relative', width: 56, height: 56, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                        />
                        <button
                          onClick={() => onHeroImagesChange(heroImages.filter((_, i) => i !== idx))}
                          style={{
                            position: 'absolute', top: 2, right: 2,
                            width: 16, height: 16, borderRadius: '50%',
                            background: 'rgba(0,0,0,0.6)', color: '#fff',
                            border: 'none', cursor: 'pointer',
                            fontSize: 10, lineHeight: '16px', textAlign: 'center',
                            padding: 0,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <span style={{ fontSize: 11, color: 'var(--gray-400)', alignSelf: 'center' }}>
                      {heroImages.length}/5
                    </span>
                  </div>
                )}
              </>
            )}
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
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      onLoginRequired()
                      return
                    }
                    onBuildModeChange('clone')
                  }}
                  style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 500,
                    background: buildMode === 'clone' ? 'var(--black)' : 'transparent',
                    color: buildMode === 'clone' ? 'var(--white)' : 'var(--gray-500)',
                    border: 'none',
                    borderRadius: 4,
                    cursor: isAuthenticated ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    opacity: isAuthenticated ? 1 : 0.5,
                  }}
                >
                  Clone
                </button>
              </div>
              {buildMode === 'clone' && (
                <button
                  onClick={() => heroImageInputRef.current?.click()}
                  disabled={heroImages.length >= 5}
                  title={tHero('attachScreenshot')}
                  style={{
                    padding: 0, width: 32, height: 32,
                    background: 'none',
                    border: '1px solid var(--border-color)',
                    borderRadius: 6,
                    cursor: heroImages.length >= 5 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    opacity: heroImages.length >= 5 ? 0.4 : 0.7,
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                </button>
              )}
              <span style={{ fontSize: 12, color: isFastModeShortWarning ? 'var(--amber-500, #f59e0b)' : 'var(--gray-400)', flex: 1, textAlign: 'center', transition: 'color 0.2s ease' }}>
                {!isAuthenticated
                  ? tHero('guestHint')
                  : isFastModeShortWarning
                    ? tHero('shortWarning')
                    : buildMode === 'clone' ? tHero('cloneHint')
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
                  background: canSubmit ? 'var(--accent)' : 'var(--gray-200)',
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

      {/* Recent Projects - 只有 authenticated 時才預留空間，防止 projects 載入後 grid 位移 */}
      {isAuthenticated && (
        <div style={{ marginTop: 24, minHeight: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
          <AnimatePresence>
            {!isChatActive && !isTransitioning && recentProjects.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, delay: 0.8 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
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
          </AnimatePresence>
        </div>
      )}

      <ScrollIndicator visible={!isFocused && !inputValue && !isTransitioning} />
    </motion.section>
  )
}

export default HeroSection
