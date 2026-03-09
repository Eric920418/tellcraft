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
  { id: 'nav', kind: 'header', x: 10, y: 15, w: 78, h: 8, appearAt: 0, zone: 'anvil', hoverable: true },
  { id: 'hero-title', kind: 'hero-copy', x: 12, y: 28, w: 34, h: 23, appearAt: 0, zone: 'anvil', hoverable: true },
  { id: 'hero-media', kind: 'hero-media', x: 50, y: 26, w: 30, h: 28, appearAt: 1, zone: 'anvil', hoverable: true },
  { id: 'cta', kind: 'cta', x: 14, y: 54, w: 20, h: 8, appearAt: 1, zone: 'assembly', hoverable: true },
  { id: 'cards', kind: 'cards', x: 12, y: 63, w: 68, h: 18, appearAt: 1, zone: 'assembly', hoverable: true },
  { id: 'text-list', kind: 'list', x: 14, y: 84, w: 26, h: 9, appearAt: 2, zone: 'refine', hoverable: false },
  { id: 'feature-grid', kind: 'feature', x: 45, y: 84, w: 35, h: 9, appearAt: 3, zone: 'refine', hoverable: false },
  { id: 'form-block', kind: 'footer', x: 12, y: 94, w: 68, h: 5, appearAt: 4, zone: 'finish', hoverable: true },
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
  { left: '6%', width: '18%', delay: 0 },
  { left: '30%', width: '16%', delay: 0.22 },
  { left: '51%', width: '12%', delay: 0.4 },
]

const CLAMP_POSITIONS: Array<{ left?: string; right?: string; top?: string; bottom?: string; rotate?: string }> = [
  { left: '7%', top: '14%', rotate: '-8deg' },
  { right: '8%', top: '18%', rotate: '12deg' },
  { left: '10%', bottom: '14%', rotate: '6deg' },
  { right: '11%', bottom: '12%', rotate: '-10deg' },
]

const BENCH_BRACES = [
  { left: '6%', top: '24%', bottom: '24%' },
  { right: '6%', top: '24%', bottom: '24%' },
]

const GUIDE_MARKS = [
  { left: '16%', top: '23%', width: '12%' },
  { left: '66%', top: '23%', width: '10%' },
  { left: '18%', bottom: '21%', width: '9%' },
  { right: '18%', bottom: '21%', width: '11%' },
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
    return `${Math.max(module.w - 10, 28)}%`
  }
  return `${module.w}%`
}

function getZoneTint(zone: ForgeZone, accent: string): string {
  if (zone === 'intake') return `${accent}26`
  if (zone === 'anvil') return `${accent}22`
  if (zone === 'assembly') return `${accent}1c`
  if (zone === 'refine') return `${accent}16`
  return `${accent}12`
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
      grooveColor: 'rgba(201, 176, 152, 0.08)',
      warmInset: 'rgba(251, 191, 36, 0.04)',
      surfaceTone: 'rgba(90, 78, 70, 0.12)',
      highlightTone: 'rgba(255, 255, 255, 0.02)',
      plateBackground: 'linear-gradient(180deg, rgba(70, 60, 54, 0.16) 0%, rgba(36, 31, 28, 0.8) 18%, rgba(18, 16, 15, 0.94) 100%)',
      opacity: 0.42,
    }
  }

  if (finish === 'heated') {
    return {
      grooveColor: `${accentColor}5a`,
      warmInset: `${accentColor}4a`,
      surfaceTone: `${accentColor}18`,
      highlightTone: 'rgba(255, 237, 213, 0.08)',
      plateBackground: 'linear-gradient(180deg, rgba(121, 95, 77, 0.26) 0%, rgba(66, 52, 45, 0.84) 16%, rgba(25, 21, 19, 1) 100%)',
      opacity: 0.96,
    }
  }

  if (finish === 'shaped') {
    return {
      grooveColor: 'rgba(243, 220, 197, 0.18)',
      warmInset: `${accentColor}24`,
      surfaceTone: 'rgba(248, 231, 214, 0.06)',
      highlightTone: 'rgba(255, 255, 255, 0.05)',
      plateBackground: 'linear-gradient(180deg, rgba(106, 87, 77, 0.2) 0%, rgba(54, 44, 39, 0.94) 14%, rgba(23, 20, 18, 1) 100%)',
      opacity: 0.86,
    }
  }

  if (finish === 'trimmed') {
    return {
      grooveColor: 'rgba(247, 229, 210, 0.24)',
      warmInset: `${accentColor}18`,
      surfaceTone: 'rgba(248, 231, 214, 0.08)',
      highlightTone: 'rgba(255, 255, 255, 0.07)',
      plateBackground: 'linear-gradient(180deg, rgba(115, 94, 81, 0.18) 0%, rgba(58, 48, 42, 0.96) 12%, rgba(22, 19, 17, 1) 100%)',
      opacity: 0.92,
    }
  }

  return {
    grooveColor: 'rgba(252, 241, 229, 0.34)',
    warmInset: 'rgba(255, 244, 232, 0.1)',
    surfaceTone: 'rgba(248, 231, 214, 0.1)',
    highlightTone: 'rgba(255, 255, 255, 0.1)',
    plateBackground: 'linear-gradient(180deg, rgba(124, 104, 89, 0.16) 0%, rgba(60, 50, 43, 0.98) 10%, rgba(21, 18, 16, 1) 100%)',
    opacity: 0.96,
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
          <div style={{ display: 'flex', gap: 6, width: '45%' }}>
            <span style={{ width: '48%', height: 6, borderRadius: 999, background: grooveColor, opacity: isRaw ? 0.55 : 1 }} />
            <span style={{ width: '24%', height: 6, borderRadius: 999, background: 'rgba(244, 228, 213, 0.14)' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, width: '28%', justifyContent: 'flex-end' }}>
            <span style={{ width: '24%', height: 5, borderRadius: 999, background: isPolished ? 'rgba(255, 244, 232, 0.24)' : 'rgba(244, 228, 213, 0.12)' }} />
            <span style={{ width: '18%', height: 5, borderRadius: 999, background: grooveColor, opacity: isRaw ? 0.5 : 1 }} />
          </div>
        </div>
        <div style={{ height: 2, width: '100%', borderRadius: 999, background: `linear-gradient(90deg, transparent 0%, ${warmInset} 20%, transparent 100%)` }} />
      </>
    )
  }

  if (module.kind === 'hero-copy') {
    return (
      <>
        <div style={{ height: 28, width: isRaw ? '64%' : '76%', borderRadius: 8, background: `linear-gradient(180deg, ${warmInset} 0%, rgba(56, 45, 40, 0.9) 100%)`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px ${grooveColor}` }} />
        <div style={{ display: 'grid', gap: 7 }}>
          <span style={{ height: 7, width: isRaw ? '74%' : '90%', borderRadius: 999, background: grooveColor }} />
          <span style={{ height: 7, width: isRaw ? '68%' : '84%', borderRadius: 999, background: isRaw ? 'rgba(244, 228, 213, 0.08)' : 'rgba(244, 228, 213, 0.16)' }} />
          <span style={{ height: 7, width: isRaw ? '48%' : '68%', borderRadius: 999, background: isRaw ? 'rgba(244, 228, 213, 0.06)' : 'rgba(244, 228, 213, 0.12)' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          <span style={{ width: isRaw ? 42 : 54, height: 12, borderRadius: 999, background: grooveColor, boxShadow: isRaw ? 'none' : `0 0 18px ${warmInset}` }} />
          <span style={{ width: 38, height: 12, borderRadius: 999, background: isPolished ? 'rgba(255, 244, 232, 0.2)' : 'rgba(244, 228, 213, 0.12)' }} />
        </div>
      </>
    )
  }

  if (module.kind === 'hero-media') {
    return (
      <>
        <div style={{ position: 'absolute', inset: 10, borderRadius: 12, background: `linear-gradient(135deg, ${warmInset} 0%, rgba(31, 27, 25, 0.84) 42%, rgba(18, 16, 14, 0.96) 100%)`, boxShadow: `inset 0 0 0 1px ${grooveColor}, inset 0 14px 24px rgba(255,255,255,0.04)` }} />
        <div style={{ position: 'absolute', left: isRaw ? '16%' : '20%', right: isRaw ? '16%' : '20%', top: isRaw ? '18%' : '22%', bottom: isRaw ? '18%' : '22%', borderRadius: 10, border: `1px solid ${grooveColor}`, opacity: 0.9 }} />
        {isRaw && (
          <>
            <div style={{ position: 'absolute', left: '20%', top: '26%', width: '62%', height: 1, background: 'rgba(244, 228, 213, 0.08)', transform: 'rotate(18deg)' }} />
            <div style={{ position: 'absolute', left: '20%', top: '58%', width: '62%', height: 1, background: 'rgba(244, 228, 213, 0.08)', transform: 'rotate(-18deg)' }} />
          </>
        )}
        <div style={{ position: 'absolute', left: '16%', bottom: '18%', width: isPolished ? '54%' : '48%', height: 8, borderRadius: 999, background: isPolished ? 'rgba(255, 244, 232, 0.2)' : 'rgba(244, 228, 213, 0.14)' }} />
      </>
    )
  }

  if (module.kind === 'cta') {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ width: finish === 'raw' ? '42%' : finish === 'polished' ? '60%' : '54%', height: 8, borderRadius: 999, background: grooveColor }} />
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: finish === 'raw' ? 'rgba(244, 228, 213, 0.08)' : 'rgba(244, 228, 213, 0.12)', boxShadow: finish === 'raw' ? 'none' : `0 0 14px ${warmInset}` }} />
        </div>
        <div style={{ height: 3, width: finish === 'raw' ? '18%' : '30%', borderRadius: 999, background: finish === 'polished' ? 'rgba(255, 244, 232, 0.22)' : 'rgba(244, 228, 213, 0.16)' }} />
      </>
    )
  }

  if (module.kind === 'cards') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, width: '100%', height: '100%' }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} style={{ position: 'relative', borderRadius: 12, background: 'linear-gradient(180deg, rgba(73, 60, 53, 0.75) 0%, rgba(28, 24, 22, 0.96) 100%)', boxShadow: `inset 0 0 0 1px ${grooveColor}, inset 0 16px 22px rgba(255,255,255,0.04)`, transform: `translateY(${finish === 'raw' ? '0px' : index % 2 === 0 ? '0px' : '4px'})`, opacity: finish === 'raw' ? 0.68 : 1 }}>
            <div style={{ position: 'absolute', left: 14, right: 14, top: -4, height: 7, borderRadius: 999, background: finish === 'raw' ? 'linear-gradient(180deg, rgba(164, 145, 129, 0.12) 0%, rgba(55, 45, 39, 0.9) 100%)' : 'linear-gradient(180deg, rgba(214, 186, 160, 0.24) 0%, rgba(82, 66, 56, 0.96) 100%)' }} />
            <div style={{ position: 'absolute', left: 12, right: 12, top: 12, height: finish === 'raw' ? 14 : 22, borderRadius: 8, background: `linear-gradient(180deg, ${warmInset} 0%, rgba(52, 42, 38, 0.8) 100%)` }} />
            <div style={{ position: 'absolute', left: 12, right: 22, top: 44, display: 'grid', gap: 7 }}>
              <span style={{ height: 6, borderRadius: 999, background: grooveColor, width: finish === 'raw' ? '74%' : '100%' }} />
              <span style={{ height: 6, width: finish === 'raw' ? '62%' : '88%', borderRadius: 999, background: finish === 'raw' ? 'rgba(244, 228, 213, 0.08)' : 'rgba(244, 228, 213, 0.14)' }} />
              <span style={{ height: 6, width: finish === 'raw' ? '44%' : '72%', borderRadius: 999, background: finish === 'raw' ? 'rgba(244, 228, 213, 0.06)' : 'rgba(244, 228, 213, 0.1)' }} />
            </div>
            <div style={{ position: 'absolute', left: 12, bottom: 12, width: finish === 'raw' ? 30 : 42, height: 10, borderRadius: 999, background: finish === 'polished' ? 'rgba(255, 244, 232, 0.18)' : `${accentColor}54` }} />
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
            <span style={{ flex: 1, height: 5, borderRadius: 999, background: 'rgba(244, 228, 213, 0.14)' }} />
          </div>
        ))}
      </div>
    )
  }

  if (module.kind === 'feature') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, width: '100%' }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} style={{ borderRadius: 8, height: 18, background: 'linear-gradient(180deg, rgba(61, 49, 44, 0.74) 0%, rgba(28, 24, 22, 0.94) 100%)', boxShadow: `inset 0 0 0 1px ${grooveColor}`, opacity: isRaw ? 0.56 : 1 }} />
        ))}
      </div>
    )
  }

  return (
    <>
      <div style={{ height: 4, width: '26%', borderRadius: 999, background: grooveColor }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, width: '100%' }}>
        <div style={{ height: 10, borderRadius: 6, background: 'rgba(244, 228, 213, 0.1)', boxShadow: `inset 0 0 0 1px ${grooveColor}` }} />
        <div style={{ height: 10, borderRadius: 6, background: 'rgba(244, 228, 213, 0.1)', boxShadow: `inset 0 0 0 1px ${grooveColor}` }} />
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
  const stageGlow = useMotionTemplate`radial-gradient(300px 220px at ${cursorX}px ${cursorY}px, rgba(249, 115, 22, 0.16), transparent 72%)`

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
  const activeModule = MODULE_BY_ID[phaseFocusSlotId]
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
        background: 'radial-gradient(circle at top, rgba(88,48,26,0.32) 0%, rgba(16,13,11,0.98) 42%), linear-gradient(180deg, #0f0c0a 0%, #120f0d 52%, #171311 100%)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(175deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 10px), repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 80px)',
          opacity: 0.14,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% -10%, rgba(251,146,60,0.18) 0%, transparent 35%), radial-gradient(circle at 50% 110%, rgba(120,53,15,0.18) 0%, transparent 28%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, padding: '14px 18px 10px 18px', borderBottom: '1px solid rgba(184, 140, 102, 0.18)' }}>
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
            <div style={{ borderRadius: 999, border: `1px solid ${phaseColor}88`, background: `${phaseColor}20`, color: '#f7e8da', padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.05em' }}>
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
            border: '1px solid rgba(189, 147, 111, 0.16)',
            background: 'linear-gradient(180deg, rgba(20,17,15,0.98) 0%, rgba(13,11,10,1) 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02), inset 0 -18px 40px rgba(0,0,0,0.4), 0 22px 54px rgba(0,0,0,0.32)',
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
              left: '4%',
              right: '4%',
              top: '7%',
              bottom: '8%',
              borderRadius: 40,
              background: 'linear-gradient(180deg, rgba(53,46,41,0.98) 0%, rgba(30,26,23,1) 16%, rgba(19,17,15,1) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -24px 32px rgba(0,0,0,0.46), 0 18px 36px rgba(0,0,0,0.26)',
              clipPath: 'polygon(2.8% 0, 97.2% 0, 100% 10%, 100% 90%, 97.2% 100%, 2.8% 100%, 0 90%, 0 10%)',
            }}
          />

          {BENCH_BRACES.map((brace, index) => (
            <div
              key={index}
              aria-hidden="true"
              style={{
                position: 'absolute',
                width: 22,
                borderRadius: 14,
                background: 'linear-gradient(180deg, rgba(87,76,67,0.96) 0%, rgba(36,30,27,0.98) 100%)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04), inset 6px 0 10px rgba(255,255,255,0.03), 0 10px 18px rgba(0,0,0,0.22)',
                ...brace,
              }}
            />
          ))}

          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '8%',
              right: '8%',
              top: '14%',
              bottom: '14%',
              borderRadius: 30,
              background: 'linear-gradient(180deg, rgba(77,66,58,0.96) 0%, rgba(34,29,26,0.98) 22%, rgba(20,18,16,1) 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(201,167,135,0.14), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -20px 30px rgba(0,0,0,0.48), 0 12px 28px rgba(0,0,0,0.28)',
              clipPath: 'polygon(2.4% 0, 97.6% 0, 100% 8%, 100% 92%, 97.6% 100%, 2.4% 100%, 0 92%, 0 8%)',
            }}
          />

          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '10.5%',
              right: '10.5%',
              top: '17.5%',
              bottom: '17.5%',
              borderRadius: 22,
              background: 'linear-gradient(180deg, rgba(24,20,18,1) 0%, rgba(14,12,11,1) 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04), inset 0 18px 24px rgba(255,255,255,0.03), inset 0 -18px 24px rgba(0,0,0,0.36)',
            }}
          />

          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '12%',
              right: '12%',
              top: '11%',
              height: '8%',
              borderRadius: 18,
              background: 'linear-gradient(180deg, rgba(34,28,24,0.96) 0%, rgba(18,15,13,0.98) 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)',
            }}
          >
            {INTAKE_INGOTS.map((ingot) => (
              <motion.div
                key={ingot.left}
                initial={reduceMotion ? false : { x: 0, opacity: 0.4 }}
                animate={reduceMotion ? { opacity: 0.75 } : { x: ['0%', '28%'], opacity: [0.45, 0.95, 0.5] }}
                transition={{ duration: 2.8, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut', delay: ingot.delay }}
                style={{
                  position: 'absolute',
                  left: ingot.left,
                  top: '24%',
                  width: ingot.width,
                  height: '52%',
                  borderRadius: 999,
                  background: `linear-gradient(90deg, rgba(79, 64, 53, 0.95) 0%, ${phaseColor}88 52%, rgba(255, 218, 170, 0.5) 100%)`,
                  boxShadow: `0 0 20px ${phaseColor}22, inset 0 1px 0 rgba(255,255,255,0.14)`,
                }}
              />
            ))}
            <div style={{ position: 'absolute', left: '3%', top: '28%', fontSize: 10, color: 'rgba(241, 208, 176, 0.65)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>{stepText}</div>
          </div>

          {GUIDE_MARKS.map((mark, index) => (
            <div
              key={index}
              aria-hidden="true"
              style={{
                position: 'absolute',
                height: 1,
                borderRadius: 999,
                background: 'linear-gradient(90deg, transparent 0%, rgba(227, 190, 153, 0.5) 50%, transparent 100%)',
                opacity: 0.55,
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
              bottom: '10%',
              height: '8%',
              borderRadius: 16,
              background: 'linear-gradient(180deg, rgba(22,19,17,0.98) 0%, rgba(18,15,13,1) 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)',
            }}
          >
            <motion.div
              initial={reduceMotion ? false : { x: '-40%', opacity: 0.35 }}
              animate={reduceMotion ? { opacity: 0.7 } : { x: ['-32%', '76%'], opacity: [0.3, 0.68, 0.34] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                top: '28%',
                width: '24%',
                height: '42%',
                borderRadius: 999,
                background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(251,191,36,0.28) 45%, rgba(255,255,255,0) 100%)',
              }}
            />
          </div>

          {CLAMP_POSITIONS.map((clampStyle, index) => (
            <div
              key={index}
              aria-hidden="true"
              style={{
                position: 'absolute',
                width: 52,
                height: 18,
                borderRadius: 999,
                background: 'linear-gradient(180deg, rgba(89,76,67,0.96) 0%, rgba(42,36,32,0.98) 100%)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05), 0 8px 16px rgba(0,0,0,0.24)',
                transform: `rotate(${clampStyle.rotate || '0deg'})`,
                ...clampStyle,
              }}
            />
          ))}

          {!reduceMotion && activeModule && (
            <motion.div
              aria-hidden="true"
              initial={{ x: '-18%', opacity: 0.35 }}
              animate={{ x: ['-10%', '102%'], opacity: [0.24, 0.7, 0.2] }}
              transition={{ duration: visual.phase === 'quality' ? 3.4 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                left: `${activeModule.x}%`,
                top: `${activeModule.y}%`,
                width: getModuleWidth(activeModule, visual.phase),
                height: `${activeModule.h}%`,
                background: `linear-gradient(90deg, transparent 0%, ${phaseColor}00 12%, ${phaseColor}66 50%, ${phaseColor}00 88%, transparent 100%)`,
                filter: 'blur(8px)',
                pointerEvents: 'none',
              }}
            />
          )}

          <div style={{ position: 'absolute', left: '13%', right: '13%', top: '21%', bottom: '20%' }}>
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
                border: `1px solid ${isActive || isFocus ? `${phaseColor}7a` : finishState === 'polished' ? 'rgba(244, 228, 213, 0.18)' : finishState === 'raw' ? 'rgba(164, 145, 129, 0.08)' : 'rgba(209, 184, 160, 0.16)'}`,
                boxShadow: isFocus
                  ? `0 16px 26px rgba(0,0,0,0.28), 0 0 0 1px ${phaseColor}30 inset, inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -10px 18px rgba(0,0,0,0.3), 0 0 24px ${phaseColor}24`
                  : isActive
                    ? `0 14px 22px rgba(0,0,0,0.24), inset 0 0 0 1px ${phaseColor}28, inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -12px 18px rgba(0,0,0,0.34), 0 0 ${24 + visual.forgeTemperature * 0.18}px ${phaseColor}18`
                    : isRaw
                      ? '0 8px 12px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(255,255,255,0.02), inset 0 -8px 14px rgba(0,0,0,0.24)'
                      : '0 12px 18px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.03), inset 0 -12px 18px rgba(0,0,0,0.32)',
                opacity: finishTokens.opacity,
              }

              return (
                <motion.div
                  key={`${module.id}-${visual.phase}`}
                  onMouseEnter={() => canHover && onSlotEnter(module.id)}
                  onMouseLeave={() => canHover && onSlotLeave()}
                  onClick={() => canHover && onSlotClick(module.id)}
                  initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.96, rotateX: 4 }}
                  animate={{
                    opacity: moduleStyle.opacity,
                    y: isVisible ? (isRaw ? 4 : 0) : 14,
                    scale: isFocus ? 1.012 : isActive ? 1.004 : isRaw ? 0.986 : 1,
                    x: visual.phase === 'rwd' && (module.id === 'cards' || module.id === 'feature-grid') ? -8 : 0,
                    boxShadow: moduleStyle.boxShadow,
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: reduceMotion ? 0 : index * 0.04 }}
                  style={moduleStyle}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: -5,
                      width: 22,
                      height: 8,
                      borderRadius: 999,
                      background: finishState === 'raw'
                        ? 'linear-gradient(180deg, rgba(164, 145, 129, 0.14) 0%, rgba(56, 46, 40, 0.9) 100%)'
                        : 'linear-gradient(180deg, rgba(214, 186, 160, 0.22) 0%, rgba(79, 63, 55, 0.96) 100%)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.18)',
                      pointerEvents: 'none',
                    }}
                  />
                  {module.kind !== 'cta' && (
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        right: 14,
                        top: -5,
                        width: 22,
                        height: 8,
                        borderRadius: 999,
                        background: finishState === 'raw'
                          ? 'linear-gradient(180deg, rgba(164, 145, 129, 0.1) 0%, rgba(56, 46, 40, 0.86) 100%)'
                          : 'linear-gradient(180deg, rgba(214, 186, 160, 0.18) 0%, rgba(79, 63, 55, 0.92) 100%)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.18)',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: module.kind === 'cta' ? 999 : 16,
                      background: `linear-gradient(180deg, ${finishTokens.highlightTone} 0%, transparent 18%, transparent 68%, rgba(0,0,0,0.22) 100%), radial-gradient(circle at top left, ${finishState === 'raw' ? 'rgba(255,255,255,0.02)' : getZoneTint(module.zone, phaseColor)} 0%, transparent 48%)`,
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 2,
                      borderRadius: module.kind === 'cta' ? 999 : 14,
                      border: `1px solid ${isActive ? `${phaseColor}40` : finishState === 'polished' ? 'rgba(255,255,255,0.08)' : finishState === 'raw' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)'}`,
                      clipPath: module.kind === 'cta' ? 'none' : 'polygon(1.4% 0, 98.6% 0, 100% 8%, 100% 92%, 98.6% 100%, 1.4% 100%, 0 92%, 0 8%)',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      insetInline: 10,
                      top: 0,
                      height: 3,
                      borderRadius: 999,
                      background: `linear-gradient(90deg, transparent 0%, ${finishTokens.highlightTone} 18%, ${isActive ? `${phaseColor}88` : finishState === 'polished' ? 'rgba(255,255,255,0.18)' : finishState === 'raw' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)'} 50%, transparent 100%)`,
                      pointerEvents: 'none',
                    }}
                  />
                  {renderModuleBody(module, phaseColor, finishState)}

                  {!reduceMotion && isActive && (
                    <>
                      <motion.div
                        aria-hidden="true"
                        initial={{ x: '-42%', opacity: 0.3 }}
                        animate={{ x: ['-18%', '115%'], opacity: [0.25, 0.85, 0.2] }}
                        transition={{ duration: visual.forgeAction === 'polishing' ? 3 : 1.9, repeat: Infinity, ease: 'easeInOut', delay: index * 0.08 }}
                        style={{
                          position: 'absolute',
                          top: '-12%',
                          bottom: '-10%',
                          width: '22%',
                          background: `linear-gradient(90deg, transparent 0%, ${phaseColor}${visual.forgeAction === 'polishing' ? '40' : '5c'} 50%, transparent 100%)`,
                          filter: 'blur(9px)',
                          pointerEvents: 'none',
                        }}
                      />
                      {visual.forgeAction !== 'polishing' && (
                        <motion.div
                          aria-hidden="true"
                          initial={{ scale: 0.4, opacity: 0.18 }}
                          animate={{ scale: [0.55, 1.8], opacity: [0.24, 0] }}
                          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut', delay: 0.24 + index * 0.09 }}
                          style={{
                            position: 'absolute',
                            left: '16%',
                            top: '18%',
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: `radial-gradient(circle, rgba(255,232,205,0.88) 0%, ${phaseColor}66 38%, transparent 72%)`,
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                      {Array.from({ length: visual.forgeAction === 'striking' ? 4 : 2 }).map((_, sparkIndex) => (
                        <motion.span
                          key={sparkIndex}
                          aria-hidden="true"
                          initial={{ x: 0, y: 0, opacity: 0 }}
                          animate={{ x: [0, 7 - sparkIndex * 2], y: [0, -18 - sparkIndex * 7], opacity: [0, 0.7, 0] }}
                          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut', delay: index * 0.08 + sparkIndex * 0.16 }}
                          style={{
                            position: 'absolute',
                            right: `${12 + sparkIndex * 10}%`,
                            top: `${18 + sparkIndex * 6}%`,
                            width: 3,
                            height: 3,
                            borderRadius: '50%',
                            background: sparkIndex % 2 === 0 ? '#ffd7a3' : phaseColor,
                            boxShadow: `0 0 8px ${phaseColor}`,
                            pointerEvents: 'none',
                          }}
                        />
                      ))}
                    </>
                  )}

                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: module.kind === 'cta' ? 999 : 16,
                      boxShadow: isFocus ? `0 0 0 1px ${phaseColor}55 inset` : 'none',
                      background: isFocus ? `radial-gradient(circle at 30% 20%, ${isRaw ? `${phaseColor}10` : `${phaseColor}20`} 0%, transparent 42%)` : 'transparent',
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
                      opacity: finishState === 'raw' ? 0.22 : 0.5 + heatStrength * 0.2,
                      background: `linear-gradient(90deg, transparent 0%, ${isActive ? `${phaseColor}72` : finishState === 'polished' ? 'rgba(255, 244, 232, 0.18)' : finishState === 'raw' ? 'rgba(214, 188, 161, 0.08)' : 'rgba(214, 188, 161, 0.16)'} 50%, transparent 100%)`,
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
                  left: `${focusedModule.x - 1.2}%`,
                  top: `${focusedModule.y - 1.4}%`,
                  width: `calc(${getModuleWidth(focusedModule, visual.phase)} + 2.4%)`,
                  height: `${focusedModule.h + 2.8}%`,
                  opacity: 1,
                }}
                transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute',
                  borderRadius: focusedModule.kind === 'cta' ? 999 : 18,
                  border: `1px solid ${phaseColor}52`,
                  boxShadow: `0 0 0 1px ${phaseColor}18 inset, 0 0 28px ${phaseColor}18`,
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
                border: `1px solid ${phaseColor}66`,
                background: 'linear-gradient(180deg, rgba(42,33,27,0.92) 0%, rgba(20,16,14,0.98) 100%)',
                boxShadow: `0 16px 36px rgba(0,0,0,0.34), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 0 24px ${phaseColor}18`,
                backdropFilter: 'blur(14px)',
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
                      background: 'rgba(28,23,20,0.96)',
                      borderLeft: `1px solid ${phaseColor}66`,
                      borderTop: `1px solid ${phaseColor}66`,
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
