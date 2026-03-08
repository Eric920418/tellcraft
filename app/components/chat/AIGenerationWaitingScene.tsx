'use client'

import { useMemo, useRef, type MouseEvent } from 'react'
import { motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { useTranslations } from 'next-intl'

import type { Message } from '@/app/types/chat'
import {
  resolveGenerationVisualState,
  type GenerationProgress,
} from './generation-visual-state'

interface AIGenerationWaitingSceneProps {
  stage?: Message['stage'] | string
  progress?: GenerationProgress | null
  streamingPhase?: 'structure' | 'animation' | 'rwd' | null
  fastBuildPhase?: 'structure' | 'animation' | 'rwd' | 'quality_gate' | 'complete' | null
  streamingChunks?: number
}

const NODES = [
  { x: 12, y: 30 },
  { x: 26, y: 18 },
  { x: 42, y: 24 },
  { x: 58, y: 15 },
  { x: 74, y: 22 },
  { x: 88, y: 34 },
  { x: 20, y: 52 },
  { x: 36, y: 44 },
  { x: 52, y: 50 },
  { x: 70, y: 48 },
  { x: 84, y: 56 },
  { x: 30, y: 72 },
  { x: 50, y: 78 },
  { x: 74, y: 74 },
] as const

const LINKS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
  [0, 6], [1, 7], [2, 7], [2, 8], [3, 8], [4, 9], [5, 10],
  [6, 7], [7, 8], [8, 9], [9, 10],
  [6, 11], [7, 11], [8, 12], [9, 13], [10, 13],
  [11, 12], [12, 13],
] as const

const TASK_KEYS = [
  'aiTaskReasoning',
  'aiTaskStructure',
  'aiTaskAnimation',
  'aiTaskRwd',
  'aiTaskQuality',
] as const

const PHASE_COLORS = {
  reasoning: '#0ea5e9',
  structure: '#3b82f6',
  animation: '#8b5cf6',
  rwd: '#14b8a6',
  quality: '#f59e0b',
} as const

export default function AIGenerationWaitingScene({
  stage,
  progress,
  streamingPhase,
  fastBuildPhase,
  streamingChunks = 0,
}: AIGenerationWaitingSceneProps) {
  const tPreview = useTranslations('preview')
  const reduceMotion = useReducedMotion()

  const containerRef = useRef<HTMLDivElement | null>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const layerX = useTransform(mouseX, [-0.5, 0.5], [-14, 14])
  const layerY = useTransform(mouseY, [-0.5, 0.5], [-10, 10])

  const visual = useMemo(() => resolveGenerationVisualState({
    stage,
    progress,
    streamingPhase,
    fastBuildPhase,
    streamingChunks,
  }), [stage, progress, streamingPhase, fastBuildPhase, streamingChunks])

  const activeColor = PHASE_COLORS[visual.phase]
  const tAny = (key: string, values?: Record<string, string | number>) => tPreview(key as never, values as never)
  const safeText = (key: string) => tAny(key)
  const stepText = progress?.step || safeText(visual.phaseLabelKey)

  const flowCount = Math.max(16, Math.round(visual.progressPercent * 1.6))
  const nodeCount = Math.max(18, visual.activeNodeCount * 3)
  const moduleCount = 2 + visual.taskIndex

  const onMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (reduceMotion || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  const onMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'relative',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'radial-gradient(120% 120% at 8% 0%, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0) 45%), radial-gradient(95% 100% at 88% 100%, rgba(16,185,129,0.16) 0%, rgba(16,185,129,0) 44%), var(--gray-50)',
      }}
    >
      <motion.div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -24,
          backgroundImage: 'linear-gradient(rgba(148,163,184,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.16) 1px, transparent 1px)',
          backgroundSize: '36px 36px, 36px 36px',
          x: reduceMotion ? 0 : layerX,
          y: reduceMotion ? 0 : layerY,
          maskImage: 'radial-gradient(circle at center, black 36%, transparent 88%)',
        }}
      />

      {!reduceMotion && (
        <motion.div
          aria-hidden="true"
          initial={{ x: '-35%' }}
          animate={{ x: '130%' }}
          transition={{ duration: 3.8, ease: 'linear', repeat: Infinity }}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '35%',
            background: `linear-gradient(90deg, transparent 0%, ${activeColor}22 50%, transparent 100%)`,
            filter: 'blur(20px)',
          }}
        />
      )}

      <div style={{ position: 'relative', zIndex: 1, padding: '18px 20px 10px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--gray-500)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              {safeText('aiSystemLabel')}
            </p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
              {safeText('aiWaitingTitle')}
            </h3>
            <p style={{ margin: '6px 0 0 0', fontSize: 13, color: 'var(--gray-500)' }}>
              {safeText('aiWaitingSubtitle')}
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0.4 }}
            animate={reduceMotion ? { opacity: 0.9 } : { opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              borderRadius: 999,
              padding: '6px 12px',
              border: `1px solid ${activeColor}55`,
              background: `${activeColor}22`,
              color: activeColor,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
            }}
          >
            {safeText(visual.statusLabelKey)}
          </motion.div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '8px 20px', display: 'grid', gridTemplateColumns: '1fr 252px', gap: 16, flex: 1, minHeight: 0 }}>
        <motion.div
          style={{
            position: 'relative',
            borderRadius: 14,
            border: '1px solid rgba(148,163,184,0.3)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.08) 100%)',
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
            x: reduceMotion ? 0 : layerX,
            y: reduceMotion ? 0 : layerY,
          }}
        >
          <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
            {LINKS.map(([from, to], idx) => {
              const fromNode = NODES[from]
              const toNode = NODES[to]
              return (
                <motion.line
                  key={`${from}-${to}`}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={`${activeColor}99`}
                  strokeWidth={0.45}
                  strokeDasharray="1.2 2.3"
                  initial={{ opacity: 0.18 }}
                  animate={reduceMotion
                    ? { opacity: 0.25 }
                    : { opacity: [0.15, 0.75, 0.15], strokeDashoffset: [0, -9] }}
                  transition={{
                    duration: 2 + (idx % 5) * 0.34,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: (idx % 4) * 0.16,
                  }}
                />
              )
            })}
            {NODES.map((node, idx) => {
              const isActive = idx < visual.activeNodeCount
              return (
                <g key={`node-${idx}`}>
                  <motion.circle
                    cx={node.x}
                    cy={node.y}
                    r={isActive ? 1.4 : 0.9}
                    fill={isActive ? activeColor : 'rgba(148,163,184,0.5)'}
                    animate={reduceMotion
                      ? { opacity: isActive ? 0.92 : 0.45 }
                      : {
                          opacity: isActive ? [0.45, 1, 0.45] : [0.2, 0.35, 0.2],
                          r: isActive ? [1.1, 1.9, 1.1] : [0.8, 1, 0.8],
                        }}
                    transition={{
                      duration: 1.5 + (idx % 3) * 0.25,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: idx * 0.05,
                    }}
                  />
                </g>
              )
            })}
          </svg>

          <div style={{ position: 'absolute', left: 14, right: 14, bottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: 'var(--gray-600)' }}>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{safeText(visual.phaseLabelKey)}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gray-500)' }}>{visual.progressPercent.toFixed(0)}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: 'rgba(148,163,184,0.25)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${visual.progressPercent}%` }}
                transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
                style={{
                  height: '100%',
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${activeColor}88 0%, ${activeColor} 45%, #ffffff 130%)`,
                }}
              />
            </div>
            <p style={{ margin: '10px 0 0 0', color: 'var(--gray-500)', fontSize: 12 }}>
              {tAny('phaseProgress', {
                phaseNum: visual.phaseNumber,
                totalPhases: visual.totalPhases,
                step: stepText,
              })}
            </p>
          </div>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          {TASK_KEYS.map((taskKey, idx) => {
            const status = idx < visual.taskIndex ? 'done' : idx === visual.taskIndex ? 'active' : 'todo'
            return (
              <motion.div
                key={taskKey}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: idx * 0.04 }}
                style={{
                  borderRadius: 10,
                  padding: '10px 12px',
                  border: status === 'active' ? `1px solid ${activeColor}88` : '1px solid rgba(148,163,184,0.25)',
                  background: status === 'active' ? `${activeColor}18` : 'rgba(255,255,255,0.45)',
                  color: status === 'todo' ? 'var(--gray-500)' : 'var(--text-primary)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: status === 'active' ? 600 : 500 }}>
                    {safeText(taskKey)}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: status === 'done' ? '#10b981' : status === 'active' ? activeColor : 'var(--gray-400)' }}>
                    {status === 'done' ? 'DONE' : status === 'active' ? 'LIVE' : 'WAIT'}
                  </span>
                </div>
              </motion.div>
            )
          })}

          <div style={{ marginTop: 'auto', borderRadius: 10, border: '1px solid rgba(148,163,184,0.25)', padding: '10px 12px', background: 'rgba(255,255,255,0.45)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--gray-500)' }}>{safeText('aiTelemetryFlow')}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{flowCount}/s</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--gray-500)' }}>{safeText('aiTelemetryNode')}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{nodeCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--gray-500)' }}>{safeText('aiTelemetryModule')}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{moduleCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--gray-500)' }}>{safeText('aiTelemetryChunks')}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{streamingChunks}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
