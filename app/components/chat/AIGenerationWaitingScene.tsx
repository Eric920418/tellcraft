'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'framer-motion'
import { useTranslations } from 'next-intl'

import type { Message } from '@/app/types/chat'
import {
  type ForgeAction,
  type ForgeZone,
  type GenerationPhase,
  type GenerationProgress,
  type InsightSlotId,
  type ModuleFinish,
  type WorkflowContext,
  resolveGenerationVisualState,
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
  { id: 'nav', kind: 'header', x: 14, y: 11, w: 54, h: 9, appearAt: 0, zone: 'anvil', hoverable: true },
  { id: 'hero-title', kind: 'hero-copy', x: 15, y: 27, w: 31, h: 27, appearAt: 0, zone: 'anvil', hoverable: true },
  { id: 'hero-media', kind: 'hero-media', x: 51, y: 22, w: 29, h: 30, appearAt: 1, zone: 'anvil', hoverable: true },
  { id: 'cta', kind: 'cta', x: 36, y: 62, w: 15, h: 10, appearAt: 1, zone: 'assembly', hoverable: true },
  { id: 'cards', kind: 'cards', x: 52, y: 59, w: 31, h: 22, appearAt: 1, zone: 'assembly', hoverable: true },
  { id: 'text-list', kind: 'list', x: 14, y: 63, w: 20, h: 12, appearAt: 2, zone: 'refine', hoverable: false },
  { id: 'feature-grid', kind: 'feature', x: 16, y: 80, w: 29, h: 10, appearAt: 3, zone: 'refine', hoverable: false },
  { id: 'form-block', kind: 'footer', x: 52, y: 86, w: 28, h: 8, appearAt: 4, zone: 'finish', hoverable: true },
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

// ── 三套情境任務 ──
interface TaskDef {
  titleKey: string
  actionKey: string
  moduleKey: string
}

const UIUX_TASKS: TaskDef[] = [
  { titleKey: 'aiTaskSmelting', actionKey: 'aiActionReasoning', moduleKey: 'aiModuleSemanticMap' },
  { titleKey: 'aiTaskFraming', actionKey: 'aiActionAssembling', moduleKey: 'aiModuleHeaderHero' },
  { titleKey: 'aiTaskForging', actionKey: 'aiActionInjecting', moduleKey: 'aiModuleContentGrid' },
  { titleKey: 'aiTaskRefining', actionKey: 'aiActionResponsive', moduleKey: 'aiModuleResponsiveMatrix' },
  { titleKey: 'aiTaskPolishing', actionKey: 'aiActionPolishing', moduleKey: 'aiModuleInteractionLayer' },
  { titleKey: 'aiTaskCalibration', actionKey: 'aiActionCalibration', moduleKey: 'aiModuleQualityGuard' },
]

const FAST_TASKS: TaskDef[] = [
  { titleKey: 'aiTaskFastInfer', actionKey: 'aiActionFastInfer', moduleKey: 'aiModuleFastInfer' },
  { titleKey: 'aiTaskFastGenerate', actionKey: 'aiActionFastGenerate', moduleKey: 'aiModuleFastGenerate' },
  { titleKey: 'aiTaskFastAnimate', actionKey: 'aiActionFastAnimate', moduleKey: 'aiModuleFastAnimate' },
  { titleKey: 'aiTaskFastCheck', actionKey: 'aiActionFastCheck', moduleKey: 'aiModuleFastCheck' },
]

const CODER_TASKS: TaskDef[] = [
  { titleKey: 'aiTaskCoderAnalyze', actionKey: 'aiActionCoderAnalyze', moduleKey: 'aiModuleCoderAnalyze' },
  { titleKey: 'aiTaskCoderGenerate', actionKey: 'aiActionCoderGenerate', moduleKey: 'aiModuleCoderGenerate' },
  { titleKey: 'aiTaskCoderWire', actionKey: 'aiActionCoderWire', moduleKey: 'aiModuleCoderWire' },
  { titleKey: 'aiTaskCoderTest', actionKey: 'aiActionCoderTest', moduleKey: 'aiModuleCoderTest' },
  { titleKey: 'aiTaskCoderVerify', actionKey: 'aiActionCoderVerify', moduleKey: 'aiModuleCoderVerify' },
]

const TASKS_BY_CONTEXT: Record<WorkflowContext, TaskDef[]> = {
  uiux: UIUX_TASKS,
  fast: FAST_TASKS,
  coder: CODER_TASKS,
}

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

const WORKTABLE_GUIDES = [
  { left: '12%', top: '26%', width: '14%', rotate: '-8deg' },
  { left: '68%', top: '22%', width: '10%', rotate: '11deg' },
  { left: '18%', top: '79%', width: '12%', rotate: '-6deg' },
  { left: '62%', top: '84%', width: '14%', rotate: '7deg' },
]

const PHASE_INDEX: Record<GenerationPhase, number> = {
  reasoning: 0,
  structure: 1,
  animation: 2,
  rwd: 3,
  quality: 4,
}

const MODULE_ROTATION: Record<ForgeModule['kind'], number> = {
  header: -1.6,
  'hero-copy': -2.4,
  'hero-media': 2.8,
  cta: -3.2,
  cards: 2.4,
  list: -1.8,
  feature: 1.4,
  footer: -1.2,
}

// ── 鐵鎚敲打週期（秒）──
const HAMMER_CYCLE: Record<ForgeAction, number> = {
  heating: 2.0,      // 慢節奏預熱敲
  shaping: 1.4,
  striking: 0.8,     // 最快
  trimming: 1.2,
  polishing: 1.8,    // 輕節奏收尾敲
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function getModuleWidth(module: ForgeModule, phase: GenerationPhase): string {
  if (phase === 'rwd' && module.id === 'cards') return `${Math.max(module.w - 4, 24)}%`
  if (phase === 'rwd' && module.id === 'feature-grid') return `${Math.max(module.w - 5, 22)}%`
  return `${module.w}%`
}

function getZoneTint(zone: ForgeZone, accent: string): string {
  if (zone === 'intake') return `${accent}12`
  if (zone === 'anvil') return `${accent}14`
  if (zone === 'assembly') return `${accent}12`
  if (zone === 'refine') return `${accent}0f`
  return `${accent}0b`
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
  if (phase === 'reasoning') return module.id === 'nav' ? 'heated' : 'raw'
  if (distance <= 0) return 'shaped'
  if (distance === 1) return phase === 'quality' ? 'polished' : 'trimmed'
  return phase === 'quality' ? 'polished' : 'trimmed'
}

function getFinishTokens(finish: ModuleFinish, accentColor: string) {
  if (finish === 'raw') {
    return {
      grooveColor: 'rgba(196, 177, 159, 0.08)',
      warmInset: 'rgba(249, 115, 22, 0.05)',
      highlightTone: 'rgba(255,255,255,0.02)',
      plateBackground: 'linear-gradient(180deg, rgba(60, 54, 49, 0.2) 0%, rgba(25, 22, 20, 0.9) 18%, rgba(16, 14, 13, 0.98) 100%)',
      borderColor: 'rgba(168, 149, 134, 0.08)',
      opacity: 0.48,
      edgeGlow: 'rgba(249, 115, 22, 0.08)',
    }
  }

  if (finish === 'heated') {
    return {
      grooveColor: `${accentColor}54`,
      warmInset: `${accentColor}44`,
      highlightTone: 'rgba(255,236,214,0.08)',
      plateBackground: 'linear-gradient(180deg, rgba(112, 85, 66, 0.28) 0%, rgba(49, 40, 35, 0.92) 16%, rgba(20, 18, 16, 1) 100%)',
      borderColor: `${accentColor}4a`,
      opacity: 0.98,
      edgeGlow: `${accentColor}42`,
    }
  }

  if (finish === 'shaped') {
    return {
      grooveColor: 'rgba(242, 220, 198, 0.17)',
      warmInset: `${accentColor}1d`,
      highlightTone: 'rgba(255,255,255,0.05)',
      plateBackground: 'linear-gradient(180deg, rgba(93, 77, 67, 0.22) 0%, rgba(41, 35, 31, 0.95) 14%, rgba(18, 16, 15, 1) 100%)',
      borderColor: 'rgba(215, 191, 170, 0.14)',
      opacity: 0.9,
      edgeGlow: `${accentColor}26`,
    }
  }

  if (finish === 'trimmed') {
    return {
      grooveColor: 'rgba(246, 229, 212, 0.24)',
      warmInset: `${accentColor}14`,
      highlightTone: 'rgba(255,255,255,0.07)',
      plateBackground: 'linear-gradient(180deg, rgba(104, 87, 76, 0.18) 0%, rgba(45, 39, 35, 0.96) 12%, rgba(17, 15, 14, 1) 100%)',
      borderColor: 'rgba(230, 208, 188, 0.18)',
      opacity: 0.95,
      edgeGlow: `${accentColor}18`,
    }
  }

  return {
    grooveColor: 'rgba(252, 242, 231, 0.34)',
    warmInset: 'rgba(255,244,232,0.07)',
    highlightTone: 'rgba(255,255,255,0.1)',
    plateBackground: 'linear-gradient(180deg, rgba(111, 95, 82, 0.16) 0%, rgba(49, 42, 37, 0.98) 12%, rgba(17, 15, 13, 1) 100%)',
    borderColor: 'rgba(244, 229, 214, 0.22)',
    opacity: 0.98,
    edgeGlow: 'rgba(255,244,232,0.08)',
  }
}

function renderModuleBody(module: ForgeModule, accentColor: string, finish: ModuleFinish) {
  const { grooveColor, warmInset } = getFinishTokens(finish, accentColor)
  const isRaw = finish === 'raw'
  const isPolished = finish === 'polished'

  if (module.kind === 'header') {
    return (
      <>
        <div style={{ position: 'absolute', left: 12, top: 10, width: 18, height: 3, borderRadius: 999, background: `linear-gradient(90deg, transparent 0%, ${warmInset} 50%, transparent 100%)` }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, width: '52%' }}>
            <span style={{ width: '36%', height: 5, borderRadius: 999, background: grooveColor }} />
            <span style={{ width: '28%', height: 5, borderRadius: 999, background: 'rgba(244,228,213,0.12)' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, width: '24%', justifyContent: 'flex-end' }}>
            <span style={{ width: '26%', height: 5, borderRadius: 999, background: isPolished ? 'rgba(255,244,232,0.26)' : grooveColor }} />
            <span style={{ width: '18%', height: 5, borderRadius: 999, background: 'rgba(244,228,213,0.1)' }} />
          </div>
        </div>
      </>
    )
  }

  if (module.kind === 'hero-copy') {
    return (
      <>
        <div style={{ display: 'grid', gap: 10, height: '100%' }}>
          <div style={{ height: isRaw ? 20 : 30, width: isRaw ? '64%' : '82%', borderRadius: 10, background: `linear-gradient(180deg, ${warmInset} 0%, rgba(59,48,42,0.88) 100%)`, boxShadow: `inset 0 0 0 1px ${grooveColor}` }} />
          <div style={{ display: 'grid', gap: 8, width: '84%' }}>
            <span style={{ height: 8, width: isRaw ? '74%' : '100%', borderRadius: 999, background: grooveColor }} />
            <span style={{ height: 8, width: isRaw ? '58%' : '88%', borderRadius: 999, background: 'rgba(244,228,213,0.14)' }} />
            <span style={{ height: 8, width: isRaw ? '44%' : '72%', borderRadius: 999, background: 'rgba(244,228,213,0.1)' }} />
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ width: isRaw ? 40 : 60, height: 12, borderRadius: 999, background: grooveColor, boxShadow: isRaw ? 'none' : `0 0 10px ${warmInset}` }} />
            <span style={{ width: 44, height: 12, borderRadius: 999, background: isPolished ? 'rgba(255,244,232,0.18)' : 'rgba(244,228,213,0.08)' }} />
          </div>
        </div>
        {isRaw && <div style={{ position: 'absolute', right: 16, top: 20, width: 32, height: 1, background: 'rgba(244,228,213,0.14)', transform: 'rotate(-18deg)' }} />}
      </>
    )
  }

  if (module.kind === 'hero-media') {
    return (
      <>
        <div style={{ position: 'absolute', inset: 12, borderRadius: 16, background: `linear-gradient(145deg, ${warmInset} 0%, rgba(26,23,21,0.84) 40%, rgba(14,12,11,0.98) 100%)`, boxShadow: `inset 0 0 0 1px ${grooveColor}` }} />
        <div style={{ position: 'absolute', left: '18%', right: '18%', top: '20%', bottom: '22%', borderRadius: 12, border: `1px solid ${grooveColor}` }} />
        <div style={{ position: 'absolute', left: '24%', bottom: '16%', width: isPolished ? '52%' : '44%', height: 8, borderRadius: 999, background: isPolished ? 'rgba(255,244,232,0.22)' : grooveColor }} />
        {isRaw && (
          <>
            <div style={{ position: 'absolute', left: '24%', top: '30%', width: '52%', height: 1, background: 'rgba(244,228,213,0.1)', transform: 'rotate(11deg)' }} />
            <div style={{ position: 'absolute', left: '24%', top: '58%', width: '50%', height: 1, background: 'rgba(244,228,213,0.08)', transform: 'rotate(-9deg)' }} />
          </>
        )}
      </>
    )
  }

  if (module.kind === 'cards') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, width: '100%', height: '100%' }}>
        {Array.from({ length: 3 }).map((_, index) => {
          const offset = index === 1 ? 4 : index === 2 ? -3 : 0
          return (
            <div
              key={index}
              style={{
                position: 'relative',
                borderRadius: 14,
                background: 'linear-gradient(180deg, rgba(63,53,47,0.78) 0%, rgba(24,21,19,0.98) 100%)',
                boxShadow: `inset 0 0 0 1px ${grooveColor}`,
                transform: `translateY(${offset}px) rotate(${index === 0 ? '-2deg' : index === 2 ? '2deg' : '0deg'})`,
                opacity: isRaw ? 0.68 : 1,
              }}
            >
              <div style={{ position: 'absolute', left: 10, right: 10, top: 10, height: 18, borderRadius: 8, background: `linear-gradient(180deg, ${warmInset} 0%, rgba(52,42,37,0.86) 100%)` }} />
              <div style={{ position: 'absolute', left: 10, right: 14, top: 36, display: 'grid', gap: 6 }}>
                <span style={{ height: 5, width: '86%', borderRadius: 999, background: grooveColor }} />
                <span style={{ height: 5, width: '72%', borderRadius: 999, background: 'rgba(244,228,213,0.12)' }} />
                <span style={{ height: 5, width: '56%', borderRadius: 999, background: 'rgba(244,228,213,0.08)' }} />
              </div>
              <div style={{ position: 'absolute', left: 10, bottom: 10, width: index === 1 ? 28 : 36, height: 10, borderRadius: 999, background: isPolished ? 'rgba(255,244,232,0.18)' : `${accentColor}56` }} />
            </div>
          )
        })}
      </div>
    )
  }

  if (module.kind === 'cta') {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ width: isRaw ? '44%' : isPolished ? '66%' : '58%', height: 8, borderRadius: 999, background: grooveColor }} />
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: isPolished ? 'rgba(255,244,232,0.22)' : `${accentColor}42` }} />
        </div>
        <div style={{ position: 'absolute', right: 10, top: 7, width: 28, height: 2, borderRadius: 999, background: `linear-gradient(90deg, transparent 0%, ${warmInset} 50%, transparent 100%)` }} />
      </>
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
          <div key={index} style={{ borderRadius: 8, height: 18, background: 'linear-gradient(180deg, rgba(61,49,44,0.72) 0%, rgba(27,24,21,0.94) 100%)', boxShadow: `inset 0 0 0 1px ${grooveColor}`, opacity: isRaw ? 0.58 : 1 }} />
        ))}
      </div>
    )
  }

  return (
    <>
      <div style={{ height: 4, width: '30%', borderRadius: 999, background: grooveColor }} />
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
    x = clamp(left + moduleWidth * 0.18, 8, stageWidth - width - 8)
    y = top + moduleHeight + gap
    anchor = 'bottom'
  }

  if (y + height > stageHeight - 8) y = stageHeight - height - 8
  if (y < 8) {
    y = top + moduleHeight + gap
    if (y + height > stageHeight - 8) y = Math.max(8, stageHeight - height - 8)
  }

  return { x, y, width, anchor }
}

// ── 鍛造場景 SVG 元素 ──

function AnvilSvg({ color: _color }: { color: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 120 60" fill="none" style={{ display: 'block' }}>
      {/* 砧體 — T 型 */}
      <path
        d="M20 20 L100 20 L105 28 L95 28 L95 50 L80 54 L40 54 L25 50 L25 28 L15 28 Z"
        fill="url(#anvilGrad)"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.5"
      />
      {/* 砧角（右側突出） */}
      <path
        d="M100 20 L118 16 L116 24 L105 28 Z"
        fill="url(#anvilHornGrad)"
        stroke="rgba(255,255,255,0.04)"
        strokeWidth="0.5"
      />
      {/* 頂面高光 */}
      <rect x="28" y="20" width="64" height="2" rx="1" fill="rgba(255,255,255,0.08)" />
      <defs>
        <linearGradient id="anvilGrad" x1="60" y1="16" x2="60" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="rgba(100,90,82,0.9)" />
          <stop offset="0.3" stopColor="rgba(58,52,48,0.95)" />
          <stop offset="1" stopColor="rgba(28,24,22,1)" />
        </linearGradient>
        <linearGradient id="anvilHornGrad" x1="100" y1="16" x2="118" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="rgba(80,72,66,0.9)" />
          <stop offset="1" stopColor="rgba(50,44,40,0.95)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function HammerSvg() {
  // 把手在上（y=0 起點，手握處），錘頭在下（y=54，打擊面）
  // transformOrigin: 'top center' → 從手握處旋轉，錘頭往下擺動
  return (
    <svg width="100%" height="100%" viewBox="0 0 40 80" fill="none" style={{ display: 'block' }}>
      {/* 把手（上方，手握處在最上端） */}
      <rect x="17" y="0" width="6" height="56" rx="3" fill="url(#handleGrad)" />
      {/* 錘頭（下方，打擊面朝下） */}
      <rect x="4" y="54" width="32" height="22" rx="4" fill="url(#headGrad)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      {/* 錘面（底部打擊面） */}
      <rect x="6" y="72" width="28" height="4" rx="1" fill="rgba(90,82,76,0.9)" />
      {/* 錘頭頂部高光 */}
      <rect x="8" y="56" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.1)" />
      <defs>
        <linearGradient id="handleGrad" x1="20" y1="0" x2="20" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="rgba(70,45,28,0.9)" />
          <stop offset="1" stopColor="rgba(120,80,50,0.95)" />
        </linearGradient>
        <linearGradient id="headGrad" x1="20" y1="52" x2="20" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="rgba(110,100,92,0.95)" />
          <stop offset="0.5" stopColor="rgba(72,66,60,0.98)" />
          <stop offset="1" stopColor="rgba(44,40,36,1)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function FurnaceSvg({ glowIntensity }: { glowIntensity: number }) {
  const glowOpacity = 0.3 + glowIntensity * 0.7
  return (
    <svg width="100%" height="100%" viewBox="0 0 56 64" fill="none" style={{ display: 'block' }}>
      {/* 爐體 */}
      <rect x="4" y="12" width="48" height="44" rx="4" fill="url(#furnaceGrad)" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      {/* 煙囪 */}
      <rect x="20" y="0" width="16" height="16" rx="2" fill="rgba(62,48,38,0.9)" />
      {/* 爐口 */}
      <rect x="12" y="22" width="32" height="20" rx="3" fill="rgba(8,6,5,0.95)" />
      {/* 爐內火光 */}
      <ellipse cx="28" cy="32" rx="12" ry="8" fill={`rgba(255,140,40,${glowOpacity})`} />
      <ellipse cx="28" cy="34" rx="8" ry="5" fill={`rgba(255,200,80,${glowOpacity * 0.6})`} />
      {/* 爐口頂部反光 */}
      <rect x="14" y="22" width="28" height="2" rx="1" fill={`rgba(255,160,60,${glowOpacity * 0.3})`} />
      <defs>
        <linearGradient id="furnaceGrad" x1="28" y1="10" x2="28" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="rgba(82,52,36,0.92)" />
          <stop offset="0.6" stopColor="rgba(54,38,28,0.96)" />
          <stop offset="1" stopColor="rgba(30,22,18,1)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ── 火花粒子 ──
function ForgeSparkBurst({ accentColor, active }: { accentColor: string; active: boolean }) {
  if (!active) return null
  const sparks = useMemo(() => Array.from({ length: 7 }).map((_, i) => ({
    angle: -30 + (i * 30) + (Math.random() * 16 - 8),
    speed: 0.6 + Math.random() * 0.5,
    size: 3 + Math.random() * 3,
    delay: Math.random() * 0.12,
    color: i % 3 === 0 ? '#ffd6a1' : i % 3 === 1 ? accentColor : '#ffeccc',
  })), [accentColor])

  return (
    <>
      {sparks.map((spark, i) => {
        const radians = (spark.angle * Math.PI) / 180
        const dx = Math.cos(radians) * spark.speed * 60
        const dy = Math.sin(radians) * spark.speed * 60
        return (
          <motion.span
            key={i}
            aria-hidden="true"
            initial={{ x: 0, y: 0, opacity: 0, scale: 1 }}
            animate={{
              x: [0, dx * 0.5, dx],
              y: [0, dy - 20, dy + 10],
              opacity: [0, 0.9, 0],
              scale: [1, 0.8, 0.3],
            }}
            transition={{
              duration: 0.7 + spark.speed * 0.3,
              repeat: Infinity,
              ease: 'easeOut',
              delay: spark.delay,
              repeatDelay: 0.3,
            }}
            style={{
              position: 'absolute',
              left: '50%',
              top: '30%',
              width: spark.size,
              height: spark.size,
              borderRadius: '50%',
              background: spark.color,
              boxShadow: `0 0 8px ${spark.color}, 0 0 16px ${accentColor}60`,
              pointerEvents: 'none',
              zIndex: 8,
            }}
          />
        )
      })}
    </>
  )
}

// ── 煙氣粒子 ──
function FurnaceSmoke({ intensity }: { intensity: number }) {
  if (intensity < 0.2) return null
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          aria-hidden="true"
          initial={{ y: 0, opacity: 0, x: 0 }}
          animate={{
            y: [0, -18, -38],
            opacity: [0, intensity * 0.2, 0],
            x: [0, (i - 1) * 4, (i - 1) * 6],
          }}
          transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, ease: 'easeOut', delay: i * 0.6 }}
          style={{
            position: 'absolute',
            left: `${44 + i * 4}%`,
            top: '-6%',
            width: 8 + i * 2,
            height: 8 + i * 2,
            borderRadius: '50%',
            background: 'rgba(180,160,140,0.12)',
            filter: 'blur(3px)',
            pointerEvents: 'none',
          }}
        />
      ))}
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
  const hoverOpenTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hoverCloseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSwitchAtRef = useRef(0)

  const [supportsHover, setSupportsHover] = useState(true)
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })
  const [hoveredSlotId, setHoveredSlotId] = useState<InsightSlotId | null>(null)
  const [activeHoverCardSlotId, setActiveHoverCardSlotId] = useState<InsightSlotId | null>(null)

  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)
  const stageGlow = useMotionTemplate`radial-gradient(220px 160px at ${cursorX}px ${cursorY}px, rgba(249,115,22,0.05), transparent 78%)`

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

  // ── 情境任務卡片 ──
  const contextTasks = TASKS_BY_CONTEXT[visual.workflowContext]
  const systemLabelKey = visual.workflowContext === 'fast' ? 'aiSystemLabelFast' : visual.workflowContext === 'coder' ? 'aiSystemLabelCoder' : 'aiSystemLabel'
  const waitingTitleKey = visual.workflowContext === 'fast' ? 'aiWaitingTitleFast' : visual.workflowContext === 'coder' ? 'aiWaitingTitleCoder' : 'aiWaitingTitle'

  // 鐵鎚是否敲打中
  const hammerActive = HAMMER_CYCLE[visual.forgeAction] > 0
  const hammerDuration = HAMMER_CYCLE[visual.forgeAction] || 1.2
  const furnaceGlowIntensity = visual.forgeAction === 'heating' ? 0.9 : visual.forgeAction === 'polishing' ? 0.2 : 0.5

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

  // ── Coder 情境指標 ──
  const coderMetrics = visual.workflowContext === 'coder' ? [
    { key: 'aiMetricActions', value: `${clamp(Math.round(visual.progressPercent * 0.08), 0, 8)}` },
    { key: 'aiMetricScenarios', value: `${clamp(Math.round(visual.progressPercent * 0.15), 0, 15)}` },
    { key: 'aiMetricServerActions', value: `${clamp(Math.round(visual.progressPercent * 0.06), 0, 6)}` },
    { key: 'aiMetricPassRate', value: `${clamp(Math.round(visual.progressPercent * 0.92), 0, 99)}%` },
  ] : null

  const defaultMetrics = [
    { key: 'aiMetricModules', value: `${visual.assembledModules}/${visual.totalModules}` },
    { key: 'aiMetricStability', value: `${visual.stabilityScore}%` },
    { key: 'aiMetricStyles', value: `${visual.styleInjectionCount}` },
    { key: 'aiMetricInteractions', value: `${visual.interactionComponents}` },
  ]

  const metrics = coderMetrics || defaultMetrics

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 0%, rgba(110,54,18,0.18) 0%, rgba(18,14,12,0.98) 34%), linear-gradient(180deg, #100d0b 0%, #120f0d 50%, #171311 100%)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(168deg, rgba(255,255,255,0.009) 0 1px, transparent 1px 20px)',
          opacity: 0.04,
          pointerEvents: 'none',
        }}
      />

      {/* ── 頂部標題（分情境） ── */}
      <div style={{ position: 'relative', zIndex: 2, padding: '14px 18px 10px 18px', borderBottom: '1px solid rgba(184, 140, 102, 0.14)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(242, 196, 151, 0.88)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              {tAny(systemLabelKey)}
            </p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: 18, fontWeight: 600, color: '#f6efe6' }}>
              {tAny(waitingTitleKey)}
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

      {/* ── 主內容：工作台 + 任務卡 ── */}
      <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, flex: 1, minHeight: 0, padding: '12px 16px 10px 16px' }}>
        <div
          ref={stageRef}
          onMouseMove={onStageMouseMove}
          onMouseLeave={onSlotLeave}
          style={{
            position: 'relative',
            minHeight: 380,
            overflow: 'hidden',
            borderRadius: 28,
            background: 'linear-gradient(180deg, rgba(18,16,15,0.74) 0%, rgba(10,9,8,0.92) 100%)',
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

          {/* ── 三層梯形工作台 ── */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '5%',
              right: '5%',
              top: '13%',
              bottom: '12%',
              clipPath: 'polygon(6% 0%, 94% 0%, 100% 100%, 0% 100%)',
              background: 'linear-gradient(180deg, rgba(30,25,22,0.96) 0%, rgba(17,15,14,1) 100%)',
              boxShadow: '0 28px 50px rgba(0,0,0,0.26)',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '8%',
              right: '8%',
              top: '17%',
              bottom: '16%',
              clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)',
              background: 'linear-gradient(180deg, rgba(40,35,31,0.98) 0%, rgba(20,18,16,1) 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(202,169,136,0.08), inset 0 18px 24px rgba(255,255,255,0.02), inset 0 -24px 28px rgba(0,0,0,0.24)',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '10.5%',
              right: '10.5%',
              top: '21%',
              bottom: '20%',
              clipPath: 'polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)',
              background: 'linear-gradient(180deg, rgba(19,17,15,0.96) 0%, rgba(13,12,11,1) 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02)',
            }}
          />

          {/* ── 熔爐（左側） ── */}
          <div style={{ position: 'absolute', left: '3%', top: '18%', width: '10%', zIndex: 6 }}>
            <motion.div
              animate={reduceMotion ? {} : { filter: [`brightness(${0.9 + furnaceGlowIntensity * 0.2})`, `brightness(${1 + furnaceGlowIntensity * 0.3})`, `brightness(${0.9 + furnaceGlowIntensity * 0.2})`] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <FurnaceSvg glowIntensity={furnaceGlowIntensity} />
            </motion.div>
            <FurnaceSmoke intensity={furnaceGlowIntensity} />
            {/* 熔爐地面光暈 */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '-20%',
                right: '-20%',
                bottom: '-8%',
                height: '30%',
                background: `radial-gradient(ellipse, rgba(255,140,40,${furnaceGlowIntensity * 0.12}) 0%, transparent 70%)`,
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* ── 鐵砧（底部中央） ── */}
          <div style={{ position: 'absolute', left: '50%', bottom: '10%', width: '22%', transform: 'translateX(-50%)', zIndex: 6 }}>
            <AnvilSvg color={phaseColor} />
            {/* 砧面反光隨溫度變化 */}
            <motion.div
              aria-hidden="true"
              animate={reduceMotion ? {} : { opacity: [0.04, 0.08 + furnaceGlowIntensity * 0.06, 0.04] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                left: '20%',
                right: '12%',
                top: '30%',
                height: '6%',
                background: `linear-gradient(90deg, transparent, ${phaseColor}40, transparent)`,
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* ── 鐵鎚（鐵砧上方，從手握處擺動，錘頭向下砸） ── */}
          <div style={{ position: 'absolute', left: '50%', bottom: '26%', width: '10%', transform: 'translateX(-50%)', zIndex: 7 }}>
            <motion.div
              animate={
                reduceMotion
                  ? {}
                  : {
                      // 0° = 垂直懸掛（錘頭正下方）
                      // 負角 = 舉起（錘頭往左上擺）
                      // 正角 = 過擺（擊中後微過）
                      rotate: ['-35deg', '-42deg', '3deg', '0deg', '-35deg'],
                    }
              }
              transition={{
                duration: hammerDuration,
                repeat: Infinity,
                ease: 'linear',
                times: [0, 0.3, 0.55, 0.62, 1],
              }}
              style={{ transformOrigin: 'top center' }}
            >
              <HammerSvg />
            </motion.div>
          </div>

          {/* ── 敲擊衝擊波紋 ── */}
          {!reduceMotion && hammerActive && (
            <motion.div
              aria-hidden="true"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 2.5], opacity: [0.4, 0] }}
              transition={{ duration: hammerDuration * 0.5, repeat: Infinity, ease: 'easeOut', delay: hammerDuration * 0.52 }}
              style={{
                position: 'absolute',
                left: '50%',
                bottom: '16%',
                width: 50,
                height: 20,
                marginLeft: -25,
                borderRadius: '50%',
                border: `1px solid ${phaseColor}60`,
                background: `radial-gradient(ellipse, ${phaseColor}20, transparent 70%)`,
                pointerEvents: 'none',
                zIndex: 7,
              }}
            />
          )}

          {/* ── 火花爆發（從鐵砧打擊面位置） ── */}
          {!reduceMotion && (
            <div style={{ position: 'absolute', left: '50%', bottom: '16%', width: 0, height: 0, zIndex: 8 }}>
              <ForgeSparkBurst accentColor={phaseColor} active={hammerActive} />
            </div>
          )}

          {/* 工作台裝飾線 */}
          {WORKTABLE_GUIDES.map((guide, index) => (
            <div
              key={index}
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: guide.left,
                top: guide.top,
                width: guide.width,
                height: 1,
                transform: `rotate(${guide.rotate})`,
                background: 'linear-gradient(90deg, transparent 0%, rgba(232,199,166,0.26) 52%, transparent 100%)',
                opacity: 0.45,
              }}
            />
          ))}

          {/* heating 掃描線（弱化版，熔爐已表達加熱） */}
          <motion.div
            aria-hidden="true"
            initial={false}
            animate={reduceMotion ? { opacity: 0.3 } : { opacity: [0.1, 0.22, 0.1], x: ['-2%', '3%', '-2%'] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              left: '26%',
              top: '28%',
              width: '28%',
              height: 3,
              borderRadius: 999,
              background: `linear-gradient(90deg, transparent 0%, ${phaseColor}80 50%, transparent 100%)`,
              boxShadow: `0 0 8px ${phaseColor}14`,
              opacity: visual.forgeAction === 'heating' ? 1 : 0.12,
            }}
          />

          {/* ── Module Plates ── */}
          <div style={{ position: 'absolute', left: '12%', right: '12%', top: '23%', bottom: '22%' }}>
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
              const baseRotate = MODULE_ROTATION[module.kind]
              const rotation = visual.phase === 'rwd' && module.id === 'cards' ? baseRotate - 1.6 : baseRotate

              const moduleStyle: CSSProperties = {
                position: 'absolute',
                left: `${module.x}%`,
                top: `${module.y}%`,
                width,
                height: `${module.h}%`,
                borderRadius: module.kind === 'cta' ? 999 : 18,
                padding: module.kind === 'cta' ? '12px 16px' : module.kind === 'footer' ? '10px 12px' : '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: module.kind === 'cta' ? 'center' : 'flex-start',
                gap: 8,
                overflow: 'hidden',
                cursor: canHover ? (supportsHover ? 'default' : 'pointer') : 'default',
                background: finishTokens.plateBackground,
                border: `1px solid ${isActive || isFocus ? `${phaseColor}6e` : finishTokens.borderColor}`,
                boxShadow: isFocus
                  ? `0 18px 28px rgba(0,0,0,0.28), inset 0 0 0 1px ${phaseColor}22, 0 0 0 1px ${finishTokens.edgeGlow}`
                  : isActive
                    ? `0 14px 22px rgba(0,0,0,0.22), inset 0 0 0 1px ${phaseColor}18`
                    : isRaw
                      ? '0 10px 14px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(255,255,255,0.02)'
                      : '0 12px 18px rgba(0,0,0,0.16), inset 0 0 0 1px rgba(255,255,255,0.03)',
                opacity: isVisible ? finishTokens.opacity : 0.24,
                transform: `rotate(${rotation}deg)`,
                transformOrigin: '50% 50%',
              }

              return (
                <motion.div
                  key={`${module.id}-${visual.phase}`}
                  onMouseEnter={() => canHover && onSlotEnter(module.id)}
                  onMouseLeave={() => canHover && onSlotLeave()}
                  onClick={() => canHover && onSlotClick(module.id)}
                  initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.96 }}
                  animate={{
                    opacity: moduleStyle.opacity,
                    y: isVisible ? (isRaw ? 6 : 0) : 16,
                    x: visual.phase === 'rwd' && (module.id === 'cards' || module.id === 'feature-grid') ? -10 : 0,
                    rotate: isFocus ? rotation - 0.8 : isActive ? rotation - 0.4 : rotation,
                    scale: isFocus ? 1.02 : isActive ? 1.008 : isRaw ? 0.988 : 1,
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
                      borderRadius: module.kind === 'cta' ? 999 : 18,
                      background: `linear-gradient(180deg, ${finishTokens.highlightTone} 0%, transparent 16%, transparent 74%, rgba(0,0,0,0.18) 100%), radial-gradient(circle at top left, ${getZoneTint(module.zone, phaseColor)} 0%, transparent 42%)`,
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 2,
                      borderRadius: module.kind === 'cta' ? 999 : 16,
                      border: `1px solid ${isPolished ? 'rgba(255,255,255,0.08)' : isRaw ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)'}`,
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      insetInline: 12,
                      top: 0,
                      height: 2,
                      borderRadius: 999,
                      background: `linear-gradient(90deg, transparent 0%, ${isPolished ? 'rgba(255,244,232,0.16)' : finishTokens.highlightTone} 28%, ${isActive ? `${phaseColor}56` : 'rgba(255,255,255,0.06)'} 50%, transparent 100%)`,
                      pointerEvents: 'none',
                    }}
                  />
                  {renderModuleBody(module, phaseColor, finishState)}

                  {/* ── 被鐵鎚敲打的模組震動效果 ── */}
                  {!reduceMotion && isActive && hammerActive && (
                    <motion.div
                      aria-hidden="true"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.5, 0] }}
                      transition={{ duration: hammerDuration * 0.3, repeat: Infinity, ease: 'easeOut', delay: hammerDuration * 0.5 }}
                      style={{
                        position: 'absolute',
                        inset: -1,
                        borderRadius: module.kind === 'cta' ? 999 : 18,
                        border: `1px solid ${phaseColor}80`,
                        boxShadow: `0 0 12px ${phaseColor}30`,
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  {/* polishing 光澤掃過 */}
                  {!reduceMotion && isActive && visual.forgeAction === 'polishing' && (
                    <motion.div
                      aria-hidden="true"
                      initial={{ x: '-18%', opacity: 0.08 }}
                      animate={{ x: ['-8%', '84%'], opacity: [0.08, 0.48, 0.12] }}
                      transition={{ duration: 2.3, repeat: Infinity, ease: 'easeInOut', delay: index * 0.06 }}
                      style={{
                        position: 'absolute',
                        top: '9%',
                        width: '18%',
                        height: 2,
                        borderRadius: 999,
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,244,232,0.72) 50%, transparent 100%)',
                        boxShadow: '0 0 8px rgba(255,244,232,0.12)',
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  {/* heating 微弱掃描 */}
                  {!reduceMotion && isActive && visual.forgeAction === 'heating' && (
                    <motion.div
                      aria-hidden="true"
                      initial={{ x: '-20%', opacity: 0.08 }}
                      animate={{ x: ['-12%', '76%'], opacity: [0.08, 0.18, 0.08] }}
                      transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut', delay: index * 0.08 }}
                      style={{
                        position: 'absolute',
                        top: '13%',
                        width: '10%',
                        height: 3,
                        borderRadius: 999,
                        background: `linear-gradient(90deg, transparent 0%, ${phaseColor}7a 50%, transparent 100%)`,
                        boxShadow: `0 0 6px ${phaseColor}20`,
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: module.kind === 'cta' ? 999 : 18,
                      boxShadow: isFocus ? `0 0 0 1px ${phaseColor}42 inset` : 'none',
                      background: isFocus ? `radial-gradient(circle at 30% 20%, ${isRaw ? `${phaseColor}0d` : `${phaseColor}14`} 0%, transparent 40%)` : 'transparent',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      insetInline: 10,
                      bottom: 6,
                      height: 1,
                      opacity: isRaw ? 0.16 : 0.34 + heatStrength * 0.14,
                      background: `linear-gradient(90deg, transparent 0%, ${isActive ? `${phaseColor}54` : isPolished ? 'rgba(255,244,232,0.14)' : 'rgba(214,188,161,0.12)'} 50%, transparent 100%)`,
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
                  left: `${focusedModule.x - 1.3}%`,
                  top: `${focusedModule.y - 1.8}%`,
                  width: `calc(${getModuleWidth(focusedModule, visual.phase)} + 2.6%)`,
                  height: `${focusedModule.h + 3.2}%`,
                  opacity: 1,
                }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute',
                  borderRadius: focusedModule.kind === 'cta' ? 999 : 20,
                  border: `1px solid ${phaseColor}34`,
                  boxShadow: `0 0 0 1px ${phaseColor}10 inset, 0 0 16px ${phaseColor}0c`,
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Hover card */}
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
                border: `1px solid ${phaseColor}52`,
                background: 'linear-gradient(180deg, rgba(38,30,26,0.94) 0%, rgba(17,14,13,0.98) 100%)',
                boxShadow: '0 12px 26px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(255,255,255,0.03)',
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
                      background: 'rgba(24,20,18,0.98)',
                      borderLeft: `1px solid ${phaseColor}52`,
                      borderTop: `1px solid ${phaseColor}52`,
                      transform:
                        hoverCardPosition.anchor === 'left'
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
                        color: 'rgba(239,224,208,0.92)',
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

          {/* 工作台底部厚度 */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '14%',
              right: '14%',
              bottom: '13%',
              height: '5%',
              clipPath: 'polygon(3% 0%, 97% 0%, 100% 100%, 0% 100%)',
              background: 'linear-gradient(180deg, rgba(18,16,15,0.92) 0%, rgba(13,11,10,1) 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02)',
            }}
          >
            <motion.div
              initial={reduceMotion ? false : { x: '-36%', opacity: 0.14 }}
              animate={reduceMotion ? { opacity: 0.34 } : { x: ['-28%', '82%'], opacity: [0.12, 0.3, 0.12] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                top: '26%',
                width: '16%',
                height: '44%',
                borderRadius: 999,
                background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,235,208,0.14) 50%, rgba(255,255,255,0) 100%)',
              }}
            />
          </div>
        </div>

        {/* ── 右側任務卡片（分情境） ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0, overflow: 'auto', paddingRight: 4 }}>
          {contextTasks.map((task, index) => {
            const totalTasks = contextTasks.length
            const virtualTaskIndex = visual.phase === 'quality' && visual.progressPercent > 95 ? totalTasks - 1 : Math.min(visual.taskIndex, totalTasks - 1)
            const status = index < virtualTaskIndex ? 'done' : index === virtualTaskIndex ? 'active' : 'pending'
            const statusColor = status === 'done' ? '#f6c35f' : status === 'active' ? phaseColor : 'rgba(177, 153, 132, 0.72)'
            const doneLabel = visual.workflowContext === 'coder' ? tAny('aiStateCoderCompleted') : tAny('aiStateCompleted')
            const activeLabel = visual.workflowContext === 'coder' ? tAny('aiStateCoderActive') : tAny('aiStateActive')
            const pendingLabel = visual.workflowContext === 'coder' ? tAny('aiStateCoderPending') : tAny('aiStatePending')
            const statusLabel = status === 'done' ? doneLabel : status === 'active' ? activeLabel : pendingLabel

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
                    ? 'linear-gradient(180deg, rgba(83, 58, 41, 0.52) 0%, rgba(28, 22, 18, 0.92) 100%)'
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

      {/* ── 底部指標（分情境） ── */}
      <div style={{ position: 'relative', zIndex: 2, padding: '0 16px 14px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
          {metrics.map((metric) => (
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
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '16%',
          right: '16%',
          bottom: 6,
          height: 32,
          background: 'radial-gradient(circle at center, rgba(0,0,0,0.26) 0%, rgba(0,0,0,0) 72%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
