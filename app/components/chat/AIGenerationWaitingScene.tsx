'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'framer-motion'
import { useTranslations } from 'next-intl'

import type { Message } from '@/app/types/chat'
import {
  type ModuleFinish,
  resolveGenerationVisualState,
  type ForgeAction,
  type ForgeZone,
  type GenerationPhase,
  type GenerationProgress,
  type InsightSlotId,
} from './generation-visual-state'

interface AIGenerationWaitingSceneProps {
  stage?: Message['stage'] | string
  progress?: GenerationProgress | null
  streamingPhase?: 'structure' | 'animation' | 'rwd' | null
  fastBuildPhase?: 'structure' | 'animation' | 'rwd' | 'quality_gate' | 'complete' | null
  streamingChunks?: number
}

interface ForgeModule {
  id: InsightSlotId
  kind: 'header' | 'hero-copy' | 'hero-media' | 'cta' | 'cards' | 'list' | 'feature' | 'footer'
  x: number
  y: number
  w: number
  h: number
  appearAt: number
  zone: ForgeZone
  hoverable: boolean
}

interface HoverCardPosition {
  x: number
  y: number
  width: number
  anchor: 'left' | 'right' | 'bottom'
}

const FORGE_MODULES: ForgeModule[] = [
  { id: 'nav', kind: 'header', x: 8, y: 10, w: 84, h: 8, appearAt: 0, zone: 'anvil', hoverable: true },
  { id: 'hero-title', kind: 'hero-copy', x: 8, y: 22, w: 40, h: 24, appearAt: 0, zone: 'anvil', hoverable: true },
  { id: 'hero-media', kind: 'hero-media', x: 52, y: 20, w: 40, h: 30, appearAt: 1, zone: 'anvil', hoverable: true },
  { id: 'cta', kind: 'cta', x: 8, y: 50, w: 22, h: 8, appearAt: 1, zone: 'assembly', hoverable: true },
  { id: 'cards', kind: 'cards', x: 8, y: 62, w: 84, h: 18, appearAt: 1, zone: 'assembly', hoverable: true },
  { id: 'text-list', kind: 'list', x: 8, y: 83, w: 30, h: 8, appearAt: 2, zone: 'refine', hoverable: false },
  { id: 'feature-grid', kind: 'feature', x: 44, y: 83, w: 48, h: 8, appearAt: 3, zone: 'refine', hoverable: false },
  { id: 'form-block', kind: 'footer', x: 8, y: 93, w: 84, h: 5, appearAt: 4, zone: 'finish', hoverable: true },
]

const PHASE_ACTIVE_MODULES: Record<GenerationPhase, InsightSlotId[]> = {
  reasoning: ['hero-title', 'nav'],
  structure: ['nav', 'hero-title', 'hero-media', 'cards'],
  animation: ['cta', 'cards', 'feature-grid'],
  rwd: ['cards', 'text-list', 'feature-grid', 'form-block'],
  quality: ['form-block', 'feature-grid', 'hero-title'],
}

const HOVERABLE_MODULES = new Set<InsightSlotId>(['nav', 'hero-title', 'hero-media', 'cards', 'cta', 'form-block'])

const INSIGHT_PREFIX_BY_SLOT: Record<InsightSlotId, 'aiInsightHero' | 'aiInsightCards' | 'aiInsightCta' | 'aiInsightForm' | 'aiInsightNav'> = {
  nav: 'aiInsightNav',
  'hero-title': 'aiInsightHero',
  'hero-media': 'aiInsightHero',
  cta: 'aiInsightCta',
  cards: 'aiInsightCards',
  'text-list': 'aiInsightCards',
  'feature-grid': 'aiInsightCards',
  'form-block': 'aiInsightForm',
}

const TASKS = [
  { titleKey: 'aiTaskSmelting', actionKey: 'aiActionReasoning', moduleKey: 'aiModuleSemanticMap' },
  { titleKey: 'aiTaskFraming', actionKey: 'aiActionAssembling', moduleKey: 'aiModuleHeaderHero' },
  { titleKey: 'aiTaskForging', actionKey: 'aiActionInjecting', moduleKey: 'aiModuleContentGrid' },
  { titleKey: 'aiTaskRefining', actionKey: 'aiActionResponsive', moduleKey: 'aiModuleResponsiveMatrix' },
  { titleKey: 'aiTaskPolishing', actionKey: 'aiActionPolishing', moduleKey: 'aiModuleInteractionLayer' },
  { titleKey: 'aiTaskCalibration', actionKey: 'aiActionCalibration', moduleKey: 'aiModuleQualityGuard' },
] as const

const PHASE_COLORS: Record<GenerationPhase, string> = {
  reasoning: '#f97316',
  structure: '#fb923c',
  animation: '#f59e0b',
  rwd: '#ea580c',
  quality: '#fbbf24',
}

const FORGE_ACTION_LABELS: Record<ForgeAction, string> = {
  heating: 'HEAT',
  shaping: 'FORM',
  striking: 'STRIKE',
  trimming: 'TRIM',
  polishing: 'POLISH',
}

const MODULE_BY_ID: Record<InsightSlotId, ForgeModule> = FORGE_MODULES.reduce((acc, module) => {
  acc[module.id] = module
  return acc
}, {} as Record<InsightSlotId, ForgeModule>)

const INTAKE_INGOTS = [
  { left: '4%', width: '15%', delay: 0 },
  { left: '24%', width: '14%', delay: 0.24 },
  { left: '43%', width: '11%', delay: 0.44 },
]

const GUIDE_MARKS = [
  { left: '10%', top: '18%', width: '16%' },
  { left: '72%', top: '20%', width: '12%' },
  { left: '12%', bottom: '19%', width: '12%' },
  { right: '12%', bottom: '19%', width: '15%' },
]

const PHASE_INDEX: Record<GenerationPhase, number> = {
  reasoning: 0,
  structure: 1,
  animation: 2,
  rwd: 3,
  quality: 4,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function getModuleWidth(module: ForgeModule, phase: GenerationPhase): string {
  if (phase === 'rwd' && (module.id === 'cards' || module.id === 'feature-grid')) {
    return `${Math.max(module.w - 10, 30)}%`
  }
  return `${module.w}%`
}

function getZoneTint(zone: ForgeZone, accent: string): string {
  if (zone === 'intake') return `${accent}18`
  if (zone === 'anvil') return `${accent}16`
  if (zone === 'assembly') return `${accent}14`
  if (zone === 'refine') return `${accent}10`
  return `${accent}0c`
}

function resolveModuleFinishState(
  module: ForgeModule,
  phase: GenerationPhase,
  moduleFinish: ModuleFinish,
  isVisible: boolean,
  isActive: boolean,
): ModuleFinish {
  if (!isVisible) return 'raw'
  if (isActive) return moduleFinish

  const distance = PHASE_INDEX[phase] - module.appearAt
  if (phase === 'reasoning') return 'heated'
  if (distance <= 0) return 'shaped'
  if (distance === 1) return phase === 'quality' ? 'polished' : 'trimmed'
  return phase === 'quality' ? 'polished' : 'trimmed'
}

function getFinishTokens(finish: ModuleFinish, accentColor: string) {
  if (finish === 'raw') {
    return {
      grooveColor: 'rgba(197, 174, 153, 0.08)',
      warmInset: 'rgba(251, 191, 36, 0.03)',
      highlightTone: 'rgba(255,255,255,0.02)',
      plateBackground: 'linear-gradient(180deg, rgba(67, 58, 53, 0.16) 0%, rgba(29, 25, 22, 0.84) 20%, rgba(18, 16, 15, 0.96) 100%)',
      borderColor: 'rgba(165, 145, 130, 0.08)',
      opacity: 0.46,
    }
  }

  if (finish === 'heated') {
    return {
      grooveColor: `${accentColor}5e`,
      warmInset: `${accentColor}44`,
      highlightTone: 'rgba(255, 236, 214, 0.08)',
      plateBackground: 'linear-gradient(180deg, rgba(124, 97, 78, 0.24) 0%, rgba(60, 48, 42, 0.9) 16%, rgba(24, 21, 19, 1) 100%)',
      borderColor: `${accentColor}50`,
      opacity: 0.98,
    }
  }

  if (finish === 'shaped') {
    return {
      grooveColor: 'rgba(243, 220, 198, 0.18)',
      warmInset: `${accentColor}20`,
      highlightTone: 'rgba(255,255,255,0.05)',
      plateBackground: 'linear-gradient(180deg, rgba(104, 85, 75, 0.18) 0%, rgba(46, 39, 35, 0.94) 16%, rgba(22, 19, 17, 1) 100%)',
      borderColor: 'rgba(210, 186, 162, 0.14)',
      opacity: 0.88,
    }
  }

  if (finish === 'trimmed') {
    return {
      grooveColor: 'rgba(246, 229, 211, 0.24)',
      warmInset: `${accentColor}16`,
      highlightTone: 'rgba(255,255,255,0.07)',
      plateBackground: 'linear-gradient(180deg, rgba(112, 92, 80, 0.16) 0%, rgba(50, 43, 38, 0.96) 14%, rgba(21, 18, 16, 1) 100%)',
      borderColor: 'rgba(228, 208, 188, 0.18)',
      opacity: 0.94,
    }
  }

  return {
    grooveColor: 'rgba(252, 242, 231, 0.34)',
    warmInset: 'rgba(255, 244, 232, 0.08)',
    highlightTone: 'rgba(255,255,255,0.1)',
    plateBackground: 'linear-gradient(180deg, rgba(120, 102, 88, 0.14) 0%, rgba(53, 46, 41, 0.98) 12%, rgba(19, 17, 15, 1) 100%)',
    borderColor: 'rgba(244, 229, 214, 0.22)',
    opacity: 0.98,
  }
}

function renderModuleBody(module: ForgeModule, accentColor: string, finish: ModuleFinish) {
  const { grooveColor, warmInset } = getFinishTokens(finish, accentColor)
  const isRaw = finish === 'raw'
  const isPolished = finish === 'polished'

  if (module.kind === 'header') {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, width: '48%' }}>
            <span style={{ width: '42%', height: 5, borderRadius: 999, background: grooveColor, opacity: isRaw ? 0.5 : 1 }} />
            <span style={{ width: '26%', height: 5, borderRadius: 999, background: isRaw ? 'rgba(244,228,213,0.08)' : 'rgba(244,228,213,0.14)' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, width: '24%', justifyContent: 'flex-end' }}>
            <span style={{ width: '24%', height: 5, borderRadius: 999, background: isPolished ? 'rgba(255,244,232,0.24)' : 'rgba(244,228,213,0.12)' }} />
            <span style={{ width: '18%', height: 5, borderRadius: 999, background: grooveColor }} />
          </div>
        </div>
        <div style={{ height: 2, width: '100%', borderRadius: 999, background: `linear-gradient(90deg, transparent 0%, ${warmInset} 26%, transparent 100%)` }} />
      </>
    )
  }

  if (module.kind === 'hero-copy') {
    return (
      <>
        <div style={{ height: isRaw ? 20 : 28, width: isRaw ? '62%' : '78%', borderRadius: 8, background: `linear-gradient(180deg, ${warmInset} 0%, rgba(57, 47, 41, 0.9) 100%)`, boxShadow: `inset 0 0 0 1px ${grooveColor}` }} />
        <div style={{ display: 'grid', gap: 7 }}>
          <span style={{ height: 7, width: isRaw ? '70%' : '92%', borderRadius: 999, background: grooveColor }} />
          <span style={{ height: 7, width: isRaw ? '58%' : '84%', borderRadius: 999, background: isRaw ? 'rgba(244,228,213,0.08)' : 'rgba(244,228,213,0.15)' }} />
          <span style={{ height: 7, width: isRaw ? '44%' : '68%', borderRadius: 999, background: isRaw ? 'rgba(244,228,213,0.06)' : 'rgba(244,228,213,0.11)' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          <span style={{ width: isRaw ? 38 : 56, height: 12, borderRadius: 999, background: grooveColor, boxShadow: isRaw ? 'none' : `0 0 12px ${warmInset}` }} />
          <span style={{ width: 40, height: 12, borderRadius: 999, background: isPolished ? 'rgba(255,244,232,0.2)' : 'rgba(244,228,213,0.1)' }} />
        </div>
      </>
    )
  }

  if (module.kind === 'hero-media') {
    return (
      <>
        <div style={{ position: 'absolute', inset: 10, borderRadius: 12, background: `linear-gradient(135deg, ${warmInset} 0%, rgba(31, 27, 25, 0.86) 42%, rgba(16, 14, 13, 0.98) 100%)`, boxShadow: `inset 0 0 0 1px ${grooveColor}` }} />
        <div style={{ position: 'absolute', left: isRaw ? '14%' : '20%', right: isRaw ? '14%' : '20%', top: isRaw ? '18%' : '22%', bottom: isRaw ? '18%' : '22%', borderRadius: 10, border: `1px solid ${grooveColor}` }} />
        {isRaw && (
          <>
            <div style={{ position: 'absolute', left: '20%', top: '28%', width: '58%', height: 1, background: 'rgba(244,228,213,0.08)', transform: 'rotate(14deg)' }} />
            <div style={{ position: 'absolute', left: '20%', top: '58%', width: '58%', height: 1, background: 'rgba(244,228,213,0.08)', transform: 'rotate(-14deg)' }} />
          </>
        )}
        <div style={{ position: 'absolute', left: '16%', bottom: '18%', width: isPolished ? '54%' : '46%', height: 8, borderRadius: 999, background: isPolished ? 'rgba(255,244,232,0.2)' : 'rgba(244,228,213,0.12)' }} />
      </>
    )
  }

  if (module.kind === 'cta') {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ width: isRaw ? '42%' : isPolished ? '60%' : '54%', height: 8, borderRadius: 999, background: grooveColor }} />
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: isRaw ? 'rgba(244,228,213,0.08)' : 'rgba(244,228,213,0.12)', boxShadow: isRaw ? 'none' : `0 0 10px ${warmInset}` }} />
        </div>
        <div style={{ height: 3, width: isRaw ? '18%' : '30%', borderRadius: 999, background: isPolished ? 'rgba(255,244,232,0.22)' : 'rgba(244,228,213,0.16)' }} />
      </>
    )
  }

  if (module.kind === 'cards') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, width: '100%', height: '100%' }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} style={{ position: 'relative', borderRadius: 12, background: 'linear-gradient(180deg, rgba(64, 53, 47, 0.76) 0%, rgba(26, 23, 21, 0.96) 100%)', boxShadow: `inset 0 0 0 1px ${grooveColor}`, transform: `translateY(${isRaw ? '0px' : index % 2 === 0 ? '0px' : '5px'})`, opacity: isRaw ? 0.66 : 1 }}>
            <div style={{ position: 'absolute', left: 12, right: 12, top: 10, height: isRaw ? 14 : 22, borderRadius: 8, background: `linear-gradient(180deg, ${warmInset} 0%, rgba(50, 41, 37, 0.82) 100%)` }} />
            <div style={{ position: 'absolute', left: 12, right: 20, top: 40, display: 'grid', gap: 7 }}>
              <span style={{ height: 6, width: isRaw ? '72%' : '100%', borderRadius: 999, background: grooveColor }} />
              <span style={{ height: 6, width: isRaw ? '58%' : '88%', borderRadius: 999, background: isRaw ? 'rgba(244,228,213,0.08)' : 'rgba(244,228,213,0.14)' }} />
              <span style={{ height: 6, width: isRaw ? '42%' : '72%', borderRadius: 999, background: isRaw ? 'rgba(244,228,213,0.06)' : 'rgba(244,228,213,0.1)' }} />
            </div>
            <div style={{ position: 'absolute', left: 12, bottom: 12, width: isRaw ? 28 : 42, height: 10, borderRadius: 999, background: isPolished ? 'rgba(255,244,232,0.18)' : `${accentColor}54` }} />
          </div>
        ))}
      </div>
    )
  }

  if (module.kind === 'list') {
    return (
      <div style={{ display: 'grid', gap: 7 }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: grooveColor }} />
            <span style={{ flex: 1, height: 5, borderRadius: 999, background: 'rgba(244,228,213,0.14)' }} />
          </div>
        ))}
      </div>
    )
  }

  if (module.kind === 'feature') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, width: '100%' }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} style={{ borderRadius: 8, height: 18, background: 'linear-gradient(180deg, rgba(61, 49, 44, 0.72) 0%, rgba(27, 24, 21, 0.94) 100%)', boxShadow: `inset 0 0 0 1px ${grooveColor}`, opacity: isRaw ? 0.56 : 1 }} />
        ))}
      </div>
    )
  }

  return (
    <>
      <div style={{ height: 4, width: '26%', borderRadius: 999, background: grooveColor }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, width: '100%' }}>
        <div style={{ height: 10, borderRadius: 6, background: 'rgba(244,228,213,0.1)', boxShadow: `inset 0 0 0 1px ${grooveColor}` }} />
        <div style={{ height: 10, borderRadius: 6, background: 'rgba(244,228,213,0.1)', boxShadow: `inset 0 0 0 1px ${grooveColor}` }} />
        <div style={{ width: 48, height: 10, borderRadius: 999, background: `${accentColor}52` }} />
      </div>
    </>
  )
}

function getHoverCardPosition(module: ForgeModule | null, stageWidth: number, stageHeight: number): HoverCardPosition | null {
  if (!module || !stageWidth || !stageHeight) return null

  const width = 288
  const height = 122
  const gap = 14
  const left = (module.x / 100) * stageWidth
  const top = (module.y / 100) * stageHeight
  const moduleWidth = (module.w / 100) * stageWidth
  const moduleHeight = (module.h / 100) * stageHeight

  let x = left + moduleWidth + gap
  let y = top - 6
  let anchor: HoverCardPosition['anchor'] = 'left'

  if (x + width > stageWidth - 8) {
    x = left - width - gap
    anchor = 'right'
  }

  if (x < 8) {
    x = clamp(left + moduleWidth * 0.2, 8, stageWidth - width - 8)
    y = top + moduleHeight + gap
    anchor = 'bottom'
  }

  if (y + height > stageHeight - 8) {
    y = stageHeight - height - 8
  }

  if (y < 8) {
    y = top + moduleHeight + gap
    if (y + height > stageHeight - 8) {
      y = Math.max(8, stageHeight - height - 8)
    }
  }

  return { x, y, width, anchor }
}

export default function AIGenerationWaitingScene({
  stage,
  progress,
  streamingPhase,
  fastBuildPhase,
  streamingChunks = 0,
}: AIGenerationWaitingSceneProps) {
  const tPreview = useTranslations('preview')
  const reduceMotion = useReducedMotion()

  const stageRef = useRef<HTMLDivElement | null>(null)
  const hoverOpenTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hoverCloseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSwitchAtRef = useRef(0)

  const [supportsHover, setSupportsHover] = useState(true)
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })
  const [hoveredSlotId, setHoveredSlotId] = useState<InsightSlotId | null>(null)
  const [activeHoverCardSlotId, setActiveHoverCardSlotId] = useState<InsightSlotId | null>(null)

  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)
  const stageGlow = useMotionTemplate`radial-gradient(180px 120px at ${cursorX}px ${cursorY}px, rgba(249,115,22,0.06), transparent 78%)`

  const visual = useMemo(() => resolveGenerationVisualState({
    stage,
    progress,
    streamingPhase,
    fastBuildPhase,
    streamingChunks,
  }), [stage, progress, streamingPhase, fastBuildPhase, streamingChunks])

  const tAny = (key: string, values?: Record<string, string | number>) => tPreview(key as never, values as never)
  const phaseColor = PHASE_COLORS[visual.phase]
  const activeModuleIds = PHASE_ACTIVE_MODULES[visual.phase]
  const phaseFocusSlotId = visual.activeInsightSlotId
  const focusSlotId = hoveredSlotId || activeHoverCardSlotId || phaseFocusSlotId
  const focusedModule = MODULE_BY_ID[focusSlotId]
  const hoverCardModule = activeHoverCardSlotId ? MODULE_BY_ID[activeHoverCardSlotId] : null
  const hoverCardPosition = useMemo(
    () => getHoverCardPosition(hoverCardModule, stageSize.width, stageSize.height),
    [hoverCardModule, stageSize.height, stageSize.width],
  )
  const insightPrefix = activeHoverCardSlotId ? INSIGHT_PREFIX_BY_SLOT[activeHoverCardSlotId] : null
  const hoverCardLines = insightPrefix
    ? [
      `${tAny(`${insightPrefix}Block`)} · ${tAny(`${insightPrefix}Role`)}`,
      `${tAny('aiHoverLineOperation')}${tAny(`${insightPrefix}Operation`)}`,
      `${tAny('aiHoverLineReason')}${tAny(`${insightPrefix}Reason`)}`,
      `${tAny('aiHoverLineImpact')}${tAny(`${insightPrefix}Impact`)}`,
    ]
    : []

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setSupportsHover(mediaQuery.matches)
    update()

    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!stageRef.current) return

    const element = stageRef.current
    const update = () => setStageSize({ width: element.clientWidth, height: element.clientHeight })
    update()

    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    return () => {
      if (hoverOpenTimerRef.current) clearTimeout(hoverOpenTimerRef.current)
      if (hoverCloseTimerRef.current) clearTimeout(hoverCloseTimerRef.current)
    }
  }, [])

  const switchHoverCard = (slotId: InsightSlotId | null) => {
    const now = Date.now()
    if (slotId && now - lastSwitchAtRef.current < 180) return
    if (slotId) lastSwitchAtRef.current = now
    setActiveHoverCardSlotId(slotId)
  }

  const onStageMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    cursorX.set(event.clientX - rect.left)
    cursorY.set(event.clientY - rect.top)
  }

  const onSlotEnter = (slotId: InsightSlotId) => {
    if (!supportsHover) return

    setHoveredSlotId(slotId)
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current)
      hoverCloseTimerRef.current = null
    }
    if (hoverOpenTimerRef.current) clearTimeout(hoverOpenTimerRef.current)
    if (activeHoverCardSlotId && activeHoverCardSlotId !== slotId) setActiveHoverCardSlotId(null)

    hoverOpenTimerRef.current = setTimeout(() => switchHoverCard(slotId), 150)
  }

  const onSlotLeave = () => {
    if (!supportsHover) return

    setHoveredSlotId(null)
    if (hoverOpenTimerRef.current) {
      clearTimeout(hoverOpenTimerRef.current)
      hoverOpenTimerRef.current = null
    }
    hoverCloseTimerRef.current = setTimeout(() => switchHoverCard(null), 80)
  }

  const onSlotClick = (slotId: InsightSlotId) => {
    if (supportsHover) return
    setHoveredSlotId(slotId)
    if (activeHoverCardSlotId === slotId) {
      setActiveHoverCardSlotId(null)
      return
    }
    switchHoverCard(slotId)
  }

  const stepText = progress?.step || tAny(visual.sceneActionKey)

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'radial-gradient(circle at top, rgba(82,46,24,0.2) 0%, rgba(16,13,11,0.98) 42%), linear-gradient(180deg, #0f0c0a 0%, #120f0d 52%, #171311 100%)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(175deg, rgba(255,255,255,0.01) 0 1px, transparent 1px 16px)',
          opacity: 0.05,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, padding: '14px 18px 10px 18px', borderBottom: '1px solid rgba(184, 140, 102, 0.16)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(242, 196, 151, 0.88)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              {tAny('aiSystemLabel')}
            </p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: 18, fontWeight: 600, color: '#f6efe6' }}>
              {tAny('aiWaitingTitle')}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'rgba(231, 205, 180, 0.9)' }}>
              {tAny(visual.sceneActionKey)}
            </p>
          </div>

          <div style={{ display: 'grid', justifyItems: 'end', gap: 6 }}>
            <div style={{ borderRadius: 999, border: `1px solid ${phaseColor}88`, background: `${phaseColor}16`, color: '#f7e8da', padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.05em' }}>
              {tAny(visual.statusLabelKey)}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(226, 190, 156, 0.72)', fontFamily: 'var(--font-mono)' }}>
              {FORGE_ACTION_LABELS[visual.forgeAction]} / {visual.forgeTemperature}C
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, flex: 1, minHeight: 0, padding: '12px 16px 10px 16px' }}>
        <div
          ref={stageRef}
          onMouseMove={onStageMouseMove}
          onMouseLeave={onSlotLeave}
          style={{
            position: 'relative',
            minHeight: 380,
            overflow: 'hidden',
            borderRadius: 24,
            border: '1px solid rgba(189, 147, 111, 0.08)',
            background: 'linear-gradient(180deg, rgba(18,16,14,0.98) 0%, rgba(12,10,9,1) 100%)',
            boxShadow: '0 14px 30px rgba(0,0,0,0.18)',
          }}
        >
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              background: reduceMotion ? 'transparent' : stageGlow,
              pointerEvents: 'none',
            }}
          />

          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '7%',
              right: '7%',
              top: '12%',
              bottom: '12%',
              borderRadius: 22,
              background: 'linear-gradient(180deg, rgba(36,31,28,0.98) 0%, rgba(20,18,16,1) 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(205, 171, 136, 0.12), inset 0 12px 14px rgba(255,255,255,0.02), inset 0 -16px 20px rgba(0,0,0,0.24)',
            }}
          />

          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '8.5%',
              right: '8.5%',
              top: '13.5%',
              bottom: '13.5%',
              borderRadius: 20,
              background: 'linear-gradient(180deg, rgba(20,18,16,0.96) 0%, rgba(13,12,11,1) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
            }}
          />

          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '9.5%',
              right: '9.5%',
              top: '11%',
              height: '6.5%',
              borderRadius: 14,
              background: 'linear-gradient(180deg, rgba(28,24,22,0.98) 0%, rgba(17,14,13,1) 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.025)',
            }}
          >
            {INTAKE_INGOTS.map((ingot) => (
              <motion.div
                key={ingot.left}
                initial={reduceMotion ? false : { x: 0, opacity: 0.4 }}
                animate={reduceMotion ? { opacity: 0.7 } : { x: ['0%', '24%'], opacity: [0.4, 0.88, 0.44] }}
                transition={{ duration: 2.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut', delay: ingot.delay }}
                style={{
                  position: 'absolute',
                  left: ingot.left,
                  top: '24%',
                  width: ingot.width,
                  height: '52%',
                  borderRadius: 999,
                  background: `linear-gradient(90deg, rgba(79,64,53,0.9) 0%, ${phaseColor}82 52%, rgba(255,218,170,0.42) 100%)`,
                  boxShadow: `0 0 10px ${phaseColor}22`,
                }}
              />
            ))}
            <div style={{ position: 'absolute', left: '3%', top: '28%', fontSize: 10, color: 'rgba(241,208,176,0.6)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>{stepText}</div>
          </div>

          {GUIDE_MARKS.map((mark, index) => (
            <div
              key={index}
              aria-hidden="true"
              style={{
                position: 'absolute',
                height: 1,
                borderRadius: 999,
                background: 'linear-gradient(90deg, transparent 0%, rgba(227,190,153,0.34) 50%, transparent 100%)',
                opacity: 0.45,
                ...mark,
              }}
            />
          ))}

          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '12%',
              right: '12%',
              bottom: '11%',
              height: '4.5%',
              borderRadius: 12,
              background: 'linear-gradient(180deg, rgba(18,16,15,0.98) 0%, rgba(14,12,11,1) 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02)',
            }}
          >
            <motion.div
              initial={reduceMotion ? false : { x: '-40%', opacity: 0.18 }}
              animate={reduceMotion ? { opacity: 0.48 } : { x: ['-30%', '78%'], opacity: [0.12, 0.46, 0.12] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                top: '24%',
                width: '18%',
                height: '48%',
                borderRadius: 999,
                background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(251,191,36,0.16) 50%, rgba(255,255,255,0) 100%)',
              }}
            />
          </div>

          <div style={{ position: 'absolute', left: '9.5%', right: '9.5%', top: '19%', bottom: '15%' }}>
            {FORGE_MODULES.map((module, index) => {
              const isVisible = module.appearAt <= visual.taskIndex + 1
              const isActive = activeModuleIds.includes(module.id)
              const isFocus = focusSlotId === module.id
              const canHover = HOVERABLE_MODULES.has(module.id)
              const width = getModuleWidth(module, visual.phase)
              const heatStrength = visual.forgeTemperature / 100
              const finishState = resolveModuleFinishState(module, visual.phase, visual.moduleFinish, isVisible, isActive)
              const finishTokens = getFinishTokens(finishState, phaseColor)
              const isRaw = finishState === 'raw'
              const isPolished = finishState === 'polished'

              const moduleStyle: CSSProperties = {
                position: 'absolute',
                left: `${module.x}%`,
                top: `${module.y}%`,
                width,
                height: `${module.h}%`,
                borderRadius: module.kind === 'cta' ? 999 : 16,
                padding: module.kind === 'cta' ? '10px 14px' : module.kind === 'footer' ? '10px 12px' : '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: module.kind === 'cta' ? 'center' : 'flex-start',
                gap: 8,
                overflow: 'hidden',
                cursor: canHover ? (supportsHover ? 'default' : 'pointer') : 'default',
                background: finishTokens.plateBackground,
                border: `1px solid ${isActive || isFocus ? `${phaseColor}74` : finishTokens.borderColor}`,
                boxShadow: isFocus
                  ? `0 12px 22px rgba(0,0,0,0.2), inset 0 0 0 1px ${phaseColor}28, 0 0 16px ${phaseColor}14`
                  : isActive
                    ? `0 10px 18px rgba(0,0,0,0.18), inset 0 0 0 1px ${phaseColor}22`
                    : isRaw
                      ? '0 6px 10px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.02)'
                      : '0 10px 16px rgba(0,0,0,0.14), inset 0 0 0 1px rgba(255,255,255,0.03)',
                opacity: finishTokens.opacity,
              }

              return (
                <motion.div
                  key={`${module.id}-${visual.phase}`}
                  onMouseEnter={() => canHover && onSlotEnter(module.id)}
                  onMouseLeave={() => canHover && onSlotLeave()}
                  onClick={() => canHover && onSlotClick(module.id)}
                  initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.97 }}
                  animate={{
                    opacity: moduleStyle.opacity,
                    y: isVisible ? (isRaw ? 4 : 0) : 12,
                    scale: isFocus ? 1.012 : isActive ? 1.004 : isRaw ? 0.988 : 1,
                    x: visual.phase === 'rwd' && (module.id === 'cards' || module.id === 'feature-grid') ? -8 : 0,
                    boxShadow: moduleStyle.boxShadow,
                  }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay: reduceMotion ? 0 : index * 0.04 }}
                  style={moduleStyle}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: module.kind === 'cta' ? 999 : 16,
                      background: `linear-gradient(180deg, ${finishTokens.highlightTone} 0%, transparent 18%, transparent 72%, rgba(0,0,0,0.18) 100%), radial-gradient(circle at top left, ${isRaw ? 'rgba(255,255,255,0.015)' : getZoneTint(module.zone, phaseColor)} 0%, transparent 46%)`,
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 2,
                      borderRadius: module.kind === 'cta' ? 999 : 14,
                      border: `1px solid ${isActive ? `${phaseColor}34` : isPolished ? 'rgba(255,255,255,0.08)' : isRaw ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)'}`,
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      insetInline: 10,
                      top: 0,
                      height: 2,
                      borderRadius: 999,
                      background: `linear-gradient(90deg, transparent 0%, ${isPolished ? 'rgba(255,255,255,0.18)' : finishTokens.highlightTone} 28%, ${isActive ? `${phaseColor}6a` : 'rgba(255,255,255,0.08)'} 50%, transparent 100%)`,
                      pointerEvents: 'none',
                    }}
                  />
                  {renderModuleBody(module, phaseColor, finishState)}

                  {!reduceMotion && isActive && (
                    <>
                      {visual.forgeAction === 'heating' && (
                        <motion.div
                          aria-hidden="true"
                          initial={{ x: '-26%', opacity: 0.14 }}
                          animate={{ x: ['-18%', '74%'], opacity: [0.12, 0.34, 0.12] }}
                          transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut', delay: index * 0.08 }}
                          style={{
                            position: 'absolute',
                            top: '10%',
                            width: '18%',
                            height: 3,
                            borderRadius: 999,
                            background: `linear-gradient(90deg, transparent 0%, ${phaseColor}a8 50%, transparent 100%)`,
                            boxShadow: `0 0 6px ${phaseColor}32`,
                            pointerEvents: 'none',
                          }}
                        />
                      )}

                      {(visual.forgeAction === 'shaping' || visual.forgeAction === 'trimming') && (
                        <motion.div
                          aria-hidden="true"
                          initial={{ opacity: 0.06, y: -8 }}
                          animate={{ opacity: [0.06, 0.22, 0.06], y: [-8, 1, -8] }}
                          transition={{ duration: 1.35, repeat: Infinity, ease: 'easeInOut', delay: index * 0.06 }}
                          style={{
                            position: 'absolute',
                            left: '12%',
                            right: '12%',
                            top: '-10%',
                            height: '34%',
                            background: 'linear-gradient(180deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.12) 36%, transparent 100%)',
                            pointerEvents: 'none',
                          }}
                        />
                      )}

                      {(visual.forgeAction === 'polishing' || visual.forgeAction === 'heating') && (
                        <motion.div
                          aria-hidden="true"
                          initial={{ x: '-18%', opacity: 0.08 }}
                          animate={{ x: ['-10%', '82%'], opacity: visual.forgeAction === 'polishing' ? [0.08, 0.5, 0.12] : [0.08, 0.24, 0.08] }}
                          transition={{ duration: visual.forgeAction === 'polishing' ? 2.3 : 1.9, repeat: Infinity, ease: 'easeInOut', delay: index * 0.06 }}
                          style={{
                            position: 'absolute',
                            top: visual.forgeAction === 'polishing' ? '8%' : '12%',
                            width: visual.forgeAction === 'polishing' ? '16%' : '10%',
                            height: 2,
                            borderRadius: 999,
                            background: `linear-gradient(90deg, transparent 0%, ${visual.forgeAction === 'polishing' ? 'rgba(255,244,232,0.72)' : `${phaseColor}80`} 50%, transparent 100%)`,
                            boxShadow: visual.forgeAction === 'polishing' ? '0 0 8px rgba(255,244,232,0.12)' : `0 0 6px ${phaseColor}24`,
                            pointerEvents: 'none',
                          }}
                        />
                      )}

                      {(visual.forgeAction === 'striking' || visual.forgeAction === 'trimming') && (
                        <motion.div
                          aria-hidden="true"
                          initial={{ scale: 0.45, opacity: 0.16 }}
                          animate={{ scale: [0.55, 1.7], opacity: [0.24, 0] }}
                          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut', delay: 0.2 + index * 0.08 }}
                          style={{
                            position: 'absolute',
                            left: '14%',
                            top: '16%',
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: `radial-gradient(circle, rgba(255,234,205,0.88) 0%, ${phaseColor}64 38%, transparent 72%)`,
                            pointerEvents: 'none',
                          }}
                        />
                      )}

                      {Array.from({ length: visual.forgeAction === 'striking' ? 3 : visual.forgeAction === 'trimming' ? 2 : 0 }).map((_, sparkIndex) => (
                        <motion.span
                          key={sparkIndex}
                          aria-hidden="true"
                          initial={{ x: 0, y: 0, opacity: 0 }}
                          animate={{ x: [0, 6 - sparkIndex * 2], y: [0, -16 - sparkIndex * 6], opacity: [0, 0.66, 0] }}
                          transition={{ duration: 0.86, repeat: Infinity, ease: 'easeOut', delay: index * 0.08 + sparkIndex * 0.16 }}
                          style={{
                            position: 'absolute',
                            right: `${14 + sparkIndex * 10}%`,
                            top: `${18 + sparkIndex * 6}%`,
                            width: 3,
                            height: 3,
                            borderRadius: '50%',
                            background: sparkIndex % 2 === 0 ? '#ffd6a1' : phaseColor,
                            boxShadow: `0 0 6px ${phaseColor}`,
                            pointerEvents: 'none',
                          }}
                        />
                      ))}

                      {visual.forgeAction === 'trimming' && (
                        <motion.div
                          aria-hidden="true"
                          initial={{ opacity: 0.08, scaleX: 0.97 }}
                          animate={{ opacity: [0.08, 0.2, 0.08], scaleX: [0.97, 1, 0.97] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                          style={{
                            position: 'absolute',
                            inset: 6,
                            borderRadius: module.kind === 'cta' ? 999 : 12,
                            border: '1px solid rgba(255,244,232,0.12)',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                    </>
                  )}

                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: module.kind === 'cta' ? 999 : 16,
                      boxShadow: isFocus ? `0 0 0 1px ${phaseColor}48 inset` : 'none',
                      background: isFocus ? `radial-gradient(circle at 30% 20%, ${isRaw ? `${phaseColor}0d` : `${phaseColor}18`} 0%, transparent 42%)` : 'transparent',
                      pointerEvents: 'none',
                    }}
                  />

                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      insetInline: 8,
                      bottom: 6,
                      height: 1,
                      opacity: isRaw ? 0.18 : 0.44 + heatStrength * 0.14,
                      background: `linear-gradient(90deg, transparent 0%, ${isActive ? `${phaseColor}62` : isPolished ? 'rgba(255,244,232,0.16)' : isRaw ? 'rgba(214,188,161,0.06)' : 'rgba(214,188,161,0.14)'} 50%, transparent 100%)`,
                      pointerEvents: 'none',
                    }}
                  />
                </motion.div>
              )
            })}

            {focusedModule && (
              <motion.div
                aria-hidden="true"
                initial={false}
                animate={{
                  left: `${focusedModule.x - 1.1}%`,
                  top: `${focusedModule.y - 1.2}%`,
                  width: `calc(${getModuleWidth(focusedModule, visual.phase)} + 2.2%)`,
                  height: `${focusedModule.h + 2.4}%`,
                  opacity: 1,
                }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute',
                  borderRadius: focusedModule.kind === 'cta' ? 999 : 18,
                  border: `1px solid ${phaseColor}42`,
                  boxShadow: `0 0 0 1px ${phaseColor}14 inset, 0 0 18px ${phaseColor}10`,
                  pointerEvents: 'none',
                }}
              />
            )}

            <motion.div
              initial={false}
              animate={{ opacity: hoverCardPosition ? 1 : 0, scale: hoverCardPosition ? 1 : 0.96, y: hoverCardPosition ? 0 : 8 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'absolute',
                left: hoverCardPosition?.x ?? 0,
                top: hoverCardPosition?.y ?? 0,
                width: hoverCardPosition?.width ?? 288,
                borderRadius: 14,
                border: `1px solid ${phaseColor}5a`,
                background: 'linear-gradient(180deg, rgba(36,29,25,0.94) 0%, rgba(18,15,14,0.98) 100%)',
                boxShadow: `0 12px 26px rgba(0,0,0,0.26), 0 0 0 1px rgba(255,255,255,0.03) inset`,
                backdropFilter: 'blur(10px)',
                padding: '12px 14px',
                pointerEvents: 'none',
                zIndex: 12,
              }}
            >
              {hoverCardPosition && (
                <>
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      width: 12,
                      height: 12,
                      background: 'rgba(26,21,19,0.98)',
                      borderLeft: `1px solid ${phaseColor}5a`,
                      borderTop: `1px solid ${phaseColor}5a`,
                      transform: hoverCardPosition.anchor === 'left'
                        ? 'rotate(-45deg)'
                        : hoverCardPosition.anchor === 'right'
                          ? 'rotate(135deg)'
                          : 'rotate(45deg)',
                      left: hoverCardPosition.anchor === 'left' ? -7 : hoverCardPosition.anchor === 'right' ? 'auto' : 24,
                      right: hoverCardPosition.anchor === 'right' ? -7 : 'auto',
                      top: hoverCardPosition.anchor === 'bottom' ? -7 : 18,
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#f6efe6' }}>{tAny('aiHoverTitle')}</span>
                    <span style={{ fontSize: 10, color: phaseColor, fontFamily: 'var(--font-mono)' }}>{supportsHover ? tAny('aiHoverActive') : tAny('aiHoverTapHint')}</span>
                  </div>
                  {hoverCardLines.map((line, index) => (
                    <p
                      key={index}
                      style={{
                        margin: index === hoverCardLines.length - 1 ? 0 : '0 0 4px 0',
                        fontSize: 11,
                        lineHeight: 1.35,
                        color: 'rgba(239, 224, 208, 0.92)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {line}
                    </p>
                  ))}
                </>
              )}
            </motion.div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0, overflow: 'auto', paddingRight: 4 }}>
          {TASKS.map((task, index) => {
            const virtualTaskIndex = visual.phase === 'quality' && visual.progressPercent > 95 ? 5 : visual.taskIndex
            const status = index < virtualTaskIndex ? 'done' : index === virtualTaskIndex ? 'active' : 'pending'
            const statusColor = status === 'done' ? '#f6c35f' : status === 'active' ? phaseColor : 'rgba(177, 153, 132, 0.72)'
            const statusLabel = status === 'done'
              ? tAny('aiStateCompleted')
              : status === 'active'
                ? tAny('aiStateActive')
                : tAny('aiStatePending')

            return (
              <motion.div
                key={task.titleKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: index * 0.04 }}
                style={{
                  position: 'relative',
                  borderRadius: 16,
                  border: status === 'active' ? `1px solid ${phaseColor}72` : '1px solid rgba(194, 167, 142, 0.16)',
                  background: status === 'active'
                    ? `linear-gradient(180deg, rgba(83, 58, 41, 0.52) 0%, rgba(28, 22, 18, 0.92) 100%)`
                    : 'linear-gradient(180deg, rgba(37, 30, 26, 0.82) 0%, rgba(19, 16, 14, 0.92) 100%)',
                  boxShadow: status === 'active' ? `0 0 0 1px ${phaseColor}22 inset, 0 12px 20px rgba(0,0,0,0.18)` : '0 10px 18px rgba(0,0,0,0.14)',
                  padding: '12px 12px 12px 16px',
                  display: 'grid',
                  gap: 6,
                  overflow: 'hidden',
                }}
              >
                <div aria-hidden="true" style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 2, borderRadius: 999, background: status === 'active' ? phaseColor : status === 'done' ? '#f6c35f' : 'rgba(116, 96, 82, 0.45)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#f5efe7' }}>{tAny(task.titleKey)}</span>
                  <span style={{ fontSize: 11, color: statusColor, fontFamily: 'var(--font-mono)' }}>{statusLabel}</span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(238, 211, 183, 0.88)' }}>{tAny(task.actionKey)}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(224, 186, 147, 0.74)' }}>{tAny(task.moduleKey)}</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, padding: '0 16px 14px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
          {[
            { key: 'aiMetricModules', value: `${visual.assembledModules}/${visual.totalModules}` },
            { key: 'aiMetricStability', value: `${visual.stabilityScore}%` },
            { key: 'aiMetricStyles', value: `${visual.styleInjectionCount}` },
            { key: 'aiMetricInteractions', value: `${visual.interactionComponents}` },
          ].map((metric) => (
            <div key={metric.key} style={{ borderRadius: 14, border: '1px solid rgba(194, 167, 142, 0.16)', background: 'linear-gradient(180deg, rgba(33, 26, 23, 0.88) 0%, rgba(17, 14, 13, 0.94) 100%)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)', padding: '10px 12px' }}>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(227, 191, 156, 0.86)' }}>{tAny(metric.key)}</p>
              <p style={{ margin: '4px 0 0 0', fontSize: 15, fontFamily: 'var(--font-mono)', color: '#f5efe7' }}>{metric.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', right: 20, bottom: 20, fontSize: 10, color: 'rgba(184, 160, 137, 0.62)', fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}>
        {tAny('aiConfidenceLabel')}: {visual.decisionConfidence}%
      </div>
      <div style={{ position: 'absolute', left: 18, bottom: 18, fontSize: 10, color: 'rgba(184, 160, 137, 0.52)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', pointerEvents: 'none' }}>
        {visual.activeWorkbenchZone.toUpperCase()} FORGE BED
      </div>
    </div>
  )
}
