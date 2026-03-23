import type { Message } from '@/app/types/chat'

// Apple-style smooth easing
export const smoothEasing: [number, number, number, number] = [0.32, 0.72, 0, 1]

// 厚重感 easing：快起強減速，模擬重物落定（fallback 用，主要用 spring）
export const heavyEasing: [number, number, number, number] = [0.22, 1, 0.36, 1]

// Landing 厚重動畫預設
export const HEAVY = {
  // Spring 物理：重物落地 + 微幅回彈
  spring: { type: 'spring' as const, damping: 22, stiffness: 90, mass: 1.2 },
  // 標題用：更重、更慢
  springHeader: { type: 'spring' as const, damping: 18, stiffness: 70, mass: 1.5 },
  // 副元素：稍輕
  springSecondary: { type: 'spring' as const, damping: 24, stiffness: 120, mass: 1.0 },
  // 位移（重物移動距離短）
  y: 20,
  x: 30,
  stagger: 0.15,
  viewMargin: '-80px' as const,
  // Scroll parallax 偏移量
  parallaxY: [40, -10] as [number, number],
} as const

export const STAGES = [
  { key: 'discovery' },
  { key: 'clarify' },
  { key: 'formulation' },
  { key: 'generating' },
  { key: 'complete' },
]

export function mapBackendStageToFrontend(backendStage: string | undefined): string {
  if (!backendStage) return 'discovery'

  if (backendStage === 'init' || backendStage === 'init_progress') return 'discovery'

  if (backendStage.includes('prd_discovery') ||
      backendStage === 'clarify_question' ||
      backendStage === 'batch_confirm' ||
      backendStage === 'clarify_summary') return 'clarify'

  if (backendStage.includes('formulation') ||
      backendStage.includes('spec_') ||
      backendStage.includes('feature') ||
      backendStage.includes('schema') ||
      backendStage.includes('actions') ||
      backendStage.includes('isa')) return 'formulation'

  if (backendStage === 'generating' ||
      backendStage.includes('code') ||
      backendStage.includes('build') ||
      backendStage.includes('uiux_pipeline') ||
      backendStage.includes('uiux_structure') ||
      backendStage.includes('uiux_animation') ||
      backendStage.includes('uiux_rwd') ||
      backendStage.includes('uiux_quality_gate') ||
      backendStage.includes('uiux_iterating')) return 'generating'

  if (backendStage === 'completed' ||
      backendStage === 'complete' ||
      backendStage === 'uiux_complete' ||
      backendStage.includes('deploy')) return 'complete'

  if (backendStage === 'prefilter_rejected' || backendStage === 'meta_response') return 'discovery'

  return 'clarify'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatBackendMessage(m: any): Message {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: new Date(m.timestamp),
    stage: m.stage as Message['stage'],
    progress: m.progress as Message['progress'],
    layoutHint: (m as unknown as Record<string, unknown>).layoutHint as Message['layoutHint'],
    richContent: (m as unknown as Record<string, unknown>).richContent as Message['richContent'],
    quickReplies: (m as unknown as Record<string, unknown>).quickReplies as Message['quickReplies'],
  }
}
