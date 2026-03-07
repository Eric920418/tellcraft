import type { Message } from '@/app/types/chat'

// Apple-style smooth easing
export const smoothEasing: [number, number, number, number] = [0.32, 0.72, 0, 1]

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
