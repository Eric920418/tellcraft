'use client'

import { useMemo, useRef, useState, type MouseEvent } from 'react'
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'framer-motion'
import { useTranslations } from 'next-intl'

import type { Message } from '@/app/types/chat'
import {
  resolveGenerationVisualState,
  type GenerationPhase,
  type GenerationProgress,
} from './generation-visual-state'

interface AIGenerationWaitingSceneProps {
  stage?: Message['stage'] | string
  progress?: GenerationProgress | null
  streamingPhase?: 'structure' | 'animation' | 'rwd' | null
  fastBuildPhase?: 'structure' | 'animation' | 'rwd' | 'quality_gate' | 'complete' | null
  streamingChunks?: number
}

interface StageSlot {
  id: 'nav' | 'hero-title' | 'hero-media' | 'cta' | 'cards' | 'text-list' | 'feature-grid' | 'form-block'
  kind: 'bar' | 'text' | 'media' | 'button' | 'cards' | 'list' | 'form'
  x: number
  y: number
  w: number
  h: number
  appearAt: number
}

const STAGE_SLOTS: StageSlot[] = [
  { id: 'nav', kind: 'bar', x: 4, y: 8, w: 92, h: 8, appearAt: 0 },
  { id: 'hero-title', kind: 'text', x: 8, y: 22, w: 44, h: 22, appearAt: 0 },
  { id: 'hero-media', kind: 'media', x: 56, y: 22, w: 36, h: 28, appearAt: 1 },
  { id: 'cta', kind: 'button', x: 8, y: 47, w: 22, h: 8, appearAt: 1 },
  { id: 'cards', kind: 'cards', x: 8, y: 60, w: 84, h: 19, appearAt: 1 },
  { id: 'text-list', kind: 'list', x: 8, y: 82, w: 36, h: 10, appearAt: 2 },
  { id: 'feature-grid', kind: 'cards', x: 48, y: 82, w: 44, h: 10, appearAt: 3 },
  { id: 'form-block', kind: 'form', x: 8, y: 93, w: 84, h: 5, appearAt: 4 },
]

const PHASE_ACTIVE_SLOTS: Record<GenerationPhase, StageSlot['id'][]> = {
  reasoning: ['hero-title', 'nav'],
  structure: ['nav', 'hero-title', 'hero-media', 'cards'],
  animation: ['cta', 'cards', 'feature-grid'],
  rwd: ['cards', 'text-list', 'feature-grid', 'form-block'],
  quality: ['form-block', 'feature-grid', 'hero-title'],
}

const TASKS = [
  {
    titleKey: 'aiTaskReasoning',
    actionKey: 'aiActionReasoning',
    moduleKey: 'aiModuleSemanticMap',
  },
  {
    titleKey: 'aiTaskStructure',
    actionKey: 'aiActionAssembling',
    moduleKey: 'aiModuleHeaderHero',
  },
  {
    titleKey: 'aiTaskAnimation',
    actionKey: 'aiActionInjecting',
    moduleKey: 'aiModuleInteractionLayer',
  },
  {
    titleKey: 'aiTaskRwd',
    actionKey: 'aiActionResponsive',
    moduleKey: 'aiModuleResponsiveMatrix',
  },
  {
    titleKey: 'aiTaskQuality',
    actionKey: 'aiActionPolishing',
    moduleKey: 'aiModuleQualityGuard',
  },
] as const

const PHASE_COLORS: Record<GenerationPhase, string> = {
  reasoning: '#7dd3fc',
  structure: '#60a5fa',
  animation: '#a78bfa',
  rwd: '#2dd4bf',
  quality: '#f59e0b',
}

const SLOT_BY_ID: Record<StageSlot['id'], StageSlot> = STAGE_SLOTS.reduce((acc, slot) => {
  acc[slot.id] = slot
  return acc
}, {} as Record<StageSlot['id'], StageSlot>)

function renderSlotBody(slot: StageSlot, accentColor: string) {
  if (slot.kind === 'bar') {
    return (
      <>
        <div style={{ height: 3, width: '30%', borderRadius: 999, background: 'rgba(148,163,184,0.35)' }} />
        <div style={{ height: 3, width: '20%', borderRadius: 999, background: 'rgba(148,163,184,0.25)' }} />
        <div style={{ marginLeft: 'auto', height: 3, width: '18%', borderRadius: 999, background: `${accentColor}66` }} />
      </>
    )
  }

  if (slot.kind === 'text') {
    return (
      <>
        <div style={{ height: 4, width: '78%', borderRadius: 999, background: `${accentColor}66` }} />
        <div style={{ height: 3, width: '92%', borderRadius: 999, background: 'rgba(148,163,184,0.38)' }} />
        <div style={{ height: 3, width: '86%', borderRadius: 999, background: 'rgba(148,163,184,0.3)' }} />
        <div style={{ height: 3, width: '74%', borderRadius: 999, background: 'rgba(148,163,184,0.24)' }} />
      </>
    )
  }

  if (slot.kind === 'media') {
    return (
      <>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 8, background: `linear-gradient(135deg, ${accentColor}2b 0%, rgba(15,23,42,0.16) 100%)` }} />
        <div style={{ position: 'absolute', inset: '20% 26%', border: '1px dashed rgba(148,163,184,0.45)', borderRadius: 6 }} />
      </>
    )
  }

  if (slot.kind === 'button') {
    return (
      <>
        <div style={{ height: 4, width: '58%', borderRadius: 999, background: `${accentColor}88` }} />
        <div style={{ height: 2, width: '32%', borderRadius: 999, background: 'rgba(255,255,255,0.3)' }} />
      </>
    )
  }

  if (slot.kind === 'list') {
    return (
      <>
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: `${accentColor}88` }} />
            <span style={{ flex: 1, height: 2, borderRadius: 999, background: 'rgba(148,163,184,0.35)' }} />
          </div>
        ))}
      </>
    )
  }

  if (slot.kind === 'form') {
    return (
      <>
        <div style={{ height: 2, width: '32%', borderRadius: 999, background: 'rgba(148,163,184,0.4)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6 }}>
          <div style={{ height: 3, borderRadius: 4, background: 'rgba(148,163,184,0.24)' }} />
          <div style={{ height: 3, borderRadius: 4, background: 'rgba(148,163,184,0.24)' }} />
          <div style={{ width: 22, height: 3, borderRadius: 4, background: `${accentColor}88` }} />
        </div>
      </>
    )
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, width: '100%' }}>
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} style={{ height: 12, borderRadius: 6, border: '1px solid rgba(148,163,184,0.28)', background: 'rgba(15,23,42,0.12)' }} />
        ))}
      </div>
    </>
  )
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
  const [hoveredSlotId, setHoveredSlotId] = useState<StageSlot['id'] | null>(null)

  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)
  const stageGlow = useMotionTemplate`radial-gradient(220px 220px at ${cursorX}px ${cursorY}px, rgba(96,165,250,0.18), transparent 75%)`

  const visual = useMemo(() => resolveGenerationVisualState({
    stage,
    progress,
    streamingPhase,
    fastBuildPhase,
    streamingChunks,
  }), [stage, progress, streamingPhase, fastBuildPhase, streamingChunks])

  const tAny = (key: string, values?: Record<string, string | number>) => tPreview(key as never, values as never)
  const phaseColor = PHASE_COLORS[visual.phase]
  const stepText = progress?.step || tAny(visual.sceneActionKey)

  const activeSlotIds = PHASE_ACTIVE_SLOTS[visual.phase]
  const fallbackFocus = activeSlotIds[0]
  const focusSlot = SLOT_BY_ID[(hoveredSlotId && SLOT_BY_ID[hoveredSlotId]) ? hoveredSlotId : fallbackFocus]

  const onStageMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    cursorX.set(event.clientX - rect.left)
    cursorY.set(event.clientY - rect.top)
  }

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #060b16 0%, #070d1b 48%, #070e1d 100%)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          opacity: 0.35,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, padding: '14px 18px 10px 18px', borderBottom: '1px solid rgba(148,163,184,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(148,163,184,0.82)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              {tAny('aiSystemLabel')}
            </p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>
              {tAny('aiWaitingTitle')}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'rgba(148,163,184,0.92)' }}>
              {tAny(visual.sceneActionKey)}
            </p>
          </div>

          <div style={{
            borderRadius: 999,
            border: `1px solid ${phaseColor}99`,
            background: `${phaseColor}1f`,
            color: phaseColor,
            padding: '6px 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: '0.04em',
          }}>
            {tAny(visual.statusLabelKey)}
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14, flex: 1, minHeight: 0, padding: '12px 16px 10px 16px' }}>
        <div
          ref={stageRef}
          onMouseMove={onStageMouseMove}
          onMouseLeave={() => setHoveredSlotId(null)}
          style={{
            position: 'relative',
            borderRadius: 14,
            border: '1px solid rgba(148,163,184,0.28)',
            overflow: 'hidden',
            background: 'linear-gradient(180deg, rgba(10,18,34,0.95) 0%, rgba(7,13,26,0.95) 100%)',
            minHeight: 360,
          }}
        >
          {!reduceMotion && (
            <motion.div
              aria-hidden="true"
              initial={{ y: '-110%' }}
              animate={{ y: '120%' }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                insetInline: 0,
                height: '26%',
                background: `linear-gradient(180deg, transparent 0%, ${phaseColor}33 48%, transparent 100%)`,
                pointerEvents: 'none',
              }}
            />
          )}

          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              background: reduceMotion ? 'transparent' : stageGlow,
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'absolute', left: 12, right: 12, top: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', opacity: 0.75 }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', opacity: 0.75 }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', opacity: 0.75 }} />
            <span style={{ marginLeft: 6, fontSize: 11, color: 'rgba(148,163,184,0.75)', fontFamily: 'var(--font-mono)' }}>
              {tAny('phaseProgress', { phaseNum: visual.phaseNumber, totalPhases: visual.totalPhases, step: stepText })}
            </span>
          </div>

          <div style={{ position: 'absolute', left: '3%', right: '3%', top: 40, bottom: 12 }}>
            {STAGE_SLOTS.map((slot, idx) => {
              const isVisible = slot.appearAt <= visual.taskIndex + 1
              const isActive = activeSlotIds.includes(slot.id)
              const isFocus = (hoveredSlotId || fallbackFocus) === slot.id

              const responsiveWidth = visual.phase === 'rwd' && (slot.id === 'cards' || slot.id === 'feature-grid')
                ? `${Math.max(slot.w - 10, 28)}%`
                : `${slot.w}%`

              return (
                <motion.div
                  key={`${slot.id}-${visual.phase}`}
                  onMouseEnter={() => setHoveredSlotId(slot.id)}
                  initial={reduceMotion ? false : { opacity: 0, x: -18, y: 10, scale: 0.96 }}
                  animate={{
                    opacity: isVisible ? (isActive ? 1 : 0.72) : 0.2,
                    x: 0,
                    y: 0,
                    scale: isFocus ? 1.01 : 1,
                    width: responsiveWidth,
                    boxShadow: isFocus
                      ? `0 0 0 1px ${phaseColor}aa, 0 0 24px ${phaseColor}33`
                      : isActive
                        ? `0 0 0 1px ${phaseColor}88`
                        : '0 0 0 1px rgba(148,163,184,0.25)',
                  }}
                  transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1], delay: reduceMotion ? 0 : idx * 0.03 }}
                  style={{
                    position: 'absolute',
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    height: `${slot.h}%`,
                    borderRadius: slot.kind === 'button' ? 999 : 8,
                    border: '1px solid rgba(148,163,184,0.2)',
                    background: isActive
                      ? `linear-gradient(180deg, ${phaseColor}1f 0%, rgba(15,23,42,0.2) 100%)`
                      : 'linear-gradient(180deg, rgba(148,163,184,0.14) 0%, rgba(15,23,42,0.16) 100%)',
                    padding: slot.kind === 'button' ? '5px 10px' : '6px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: slot.kind === 'button' ? 'center' : 'flex-start',
                    gap: 5,
                    overflow: 'hidden',
                    cursor: 'default',
                  }}
                >
                  {renderSlotBody(slot, phaseColor)}

                  {!reduceMotion && isActive && slot.kind !== 'bar' && (
                    <motion.div
                      aria-hidden="true"
                      initial={{ x: '-130%' }}
                      animate={{ x: '130%' }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'linear', delay: idx * 0.12 }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: '32%',
                        background: `linear-gradient(90deg, transparent 0%, ${phaseColor}44 50%, transparent 100%)`,
                      }}
                    />
                  )}
                </motion.div>
              )
            })}

            {!reduceMotion && visual.phase === 'reasoning' && (
              <>
                {['Hero', 'CTA', 'Gallery', 'Booking', 'Brand Story'].map((chip, idx) => (
                  <motion.div
                    key={chip}
                    initial={{ x: -80 + idx * 8, y: 12 + idx * 18, opacity: 0 }}
                    animate={{ x: 6 + idx * 13, y: 16 + idx * 7, opacity: [0, 0.85, 0.85] }}
                    transition={{ duration: 0.9, delay: idx * 0.12, repeat: Infinity, repeatDelay: 1.6 }}
                    style={{
                      position: 'absolute',
                      padding: '4px 8px',
                      borderRadius: 999,
                      border: `1px solid ${phaseColor}66`,
                      background: `${phaseColor}1d`,
                      color: '#e2e8f0',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      pointerEvents: 'none',
                    }}
                  >
                    {chip}
                  </motion.div>
                ))}
              </>
            )}

            {focusSlot && (
              <motion.div
                aria-hidden="true"
                initial={false}
                animate={{
                  left: `${focusSlot.x}%`,
                  top: `${focusSlot.y}%`,
                  width: visual.phase === 'rwd' && (focusSlot.id === 'cards' || focusSlot.id === 'feature-grid')
                    ? `${Math.max(focusSlot.w - 10, 28)}%`
                    : `${focusSlot.w}%`,
                  height: `${focusSlot.h}%`,
                }}
                transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                style={{
                  position: 'absolute',
                  borderRadius: focusSlot.kind === 'button' ? 999 : 10,
                  border: `1px dashed ${phaseColor}aa`,
                  boxShadow: `0 0 0 1px ${phaseColor}33 inset`,
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          {TASKS.map((task, idx) => {
            const status = idx < visual.taskIndex ? 'done' : idx === visual.taskIndex ? 'active' : 'pending'
            const statusColor = status === 'done' ? '#22c55e' : status === 'active' ? phaseColor : 'rgba(148,163,184,0.75)'
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
                transition={{ duration: 0.28, delay: idx * 0.04 }}
                style={{
                  borderRadius: 10,
                  border: status === 'active' ? `1px solid ${phaseColor}99` : '1px solid rgba(148,163,184,0.25)',
                  background: status === 'active' ? `${phaseColor}1c` : 'rgba(15,23,42,0.45)',
                  padding: '10px 12px',
                  display: 'grid',
                  gap: 5,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{tAny(task.titleKey)}</span>
                  <span style={{ fontSize: 11, color: statusColor, fontFamily: 'var(--font-mono)' }}>{statusLabel}</span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(148,163,184,0.9)' }}>{tAny(task.actionKey)}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(148,163,184,0.72)' }}>{tAny(task.moduleKey)}</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, padding: '0 16px 14px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
          <div style={{ borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', background: 'rgba(15,23,42,0.42)', padding: '8px 10px' }}>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(148,163,184,0.8)' }}>{tAny('aiMetricModules')}</p>
            <p style={{ margin: '4px 0 0 0', fontSize: 15, fontFamily: 'var(--font-mono)', color: '#e2e8f0' }}>{visual.assembledModules}/{visual.totalModules}</p>
          </div>
          <div style={{ borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', background: 'rgba(15,23,42,0.42)', padding: '8px 10px' }}>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(148,163,184,0.8)' }}>{tAny('aiMetricStability')}</p>
            <p style={{ margin: '4px 0 0 0', fontSize: 15, fontFamily: 'var(--font-mono)', color: '#e2e8f0' }}>{visual.stabilityScore}%</p>
          </div>
          <div style={{ borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', background: 'rgba(15,23,42,0.42)', padding: '8px 10px' }}>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(148,163,184,0.8)' }}>{tAny('aiMetricStyles')}</p>
            <p style={{ margin: '4px 0 0 0', fontSize: 15, fontFamily: 'var(--font-mono)', color: '#e2e8f0' }}>{visual.styleInjectionCount}</p>
          </div>
          <div style={{ borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', background: 'rgba(15,23,42,0.42)', padding: '8px 10px' }}>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(148,163,184,0.8)' }}>{tAny('aiMetricInteractions')}</p>
            <p style={{ margin: '4px 0 0 0', fontSize: 15, fontFamily: 'var(--font-mono)', color: '#e2e8f0' }}>{visual.interactionComponents}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
