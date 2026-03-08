export type GenerationPhase = 'reasoning' | 'structure' | 'animation' | 'rwd' | 'quality'

export interface GenerationProgress {
  current: number
  total: number
  step: string
}

export interface GenerationVisualInput {
  stage?: string
  progress?: GenerationProgress | null
  streamingPhase?: 'structure' | 'animation' | 'rwd' | null
  fastBuildPhase?: 'structure' | 'animation' | 'rwd' | 'quality_gate' | 'complete' | null
  streamingChunks?: number
}

export interface GenerationVisualState {
  phase: GenerationPhase
  phaseNumber: number
  totalPhases: number
  progressPercent: number
  phaseLabelKey: 'phaseReasoning' | 'phaseStructure' | 'phaseAnimation' | 'phaseRwd' | 'phaseQuality'
  statusLabelKey: 'aiStatusReasoning' | 'aiStatusStructure' | 'aiStatusAnimation' | 'aiStatusRwd' | 'aiStatusQuality'
  taskIndex: number
  activeNodeCount: number
}

const PHASES: GenerationPhase[] = ['reasoning', 'structure', 'animation', 'rwd', 'quality']
const BASELINE_PROGRESS: Record<GenerationPhase, number> = {
  reasoning: 8,
  structure: 28,
  animation: 54,
  rwd: 78,
  quality: 92,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function mapPhaseFromInputs(input: GenerationVisualInput): GenerationPhase {
  if (input.fastBuildPhase === 'quality_gate') return 'quality'
  if (input.fastBuildPhase === 'rwd') return 'rwd'
  if (input.fastBuildPhase === 'animation') return 'animation'
  if (input.fastBuildPhase === 'structure') return 'structure'

  if (input.streamingPhase === 'rwd') return 'rwd'
  if (input.streamingPhase === 'animation') return 'animation'
  if (input.streamingPhase === 'structure') return 'structure'

  const stage = input.stage || ''
  if (stage.includes('quality_gate')) return 'quality'
  if (stage.includes('uiux_rwd')) return 'rwd'
  if (stage.includes('uiux_animation')) return 'animation'
  if (stage.includes('uiux_structure') || stage === 'fast_generating') return 'structure'
  if (stage.includes('pipeline') || stage.includes('generating') || stage.includes('build')) return 'reasoning'

  return 'reasoning'
}

function getProgressPercent(input: GenerationVisualInput, phase: GenerationPhase): number {
  const totalPhases = PHASES.length
  const phaseNumber = PHASES.indexOf(phase) + 1
  const progress = input.progress

  let percent = BASELINE_PROGRESS[phase]
  if (progress && progress.total > 0) {
    if (progress.total <= totalPhases) {
      const segment = clamp(progress.current / progress.total, 0, 1)
      percent = ((phaseNumber - 1 + segment) / totalPhases) * 100
    } else {
      percent = clamp((progress.current / progress.total) * 100, 0, 100)
    }
  }

  const chunkBoost = Math.min(input.streamingChunks || 0, 60) * 0.2
  return clamp(percent + chunkBoost, 3, 99)
}

export function resolveGenerationVisualState(input: GenerationVisualInput): GenerationVisualState {
  const phase = mapPhaseFromInputs(input)
  const phaseNumber = PHASES.indexOf(phase) + 1
  const progressPercent = getProgressPercent(input, phase)

  const phaseLabelKeyMap: Record<GenerationPhase, GenerationVisualState['phaseLabelKey']> = {
    reasoning: 'phaseReasoning',
    structure: 'phaseStructure',
    animation: 'phaseAnimation',
    rwd: 'phaseRwd',
    quality: 'phaseQuality',
  }

  const statusLabelKeyMap: Record<GenerationPhase, GenerationVisualState['statusLabelKey']> = {
    reasoning: 'aiStatusReasoning',
    structure: 'aiStatusStructure',
    animation: 'aiStatusAnimation',
    rwd: 'aiStatusRwd',
    quality: 'aiStatusQuality',
  }

  const activityByPhase: Record<GenerationPhase, number> = {
    reasoning: 5,
    structure: 7,
    animation: 9,
    rwd: 11,
    quality: 13,
  }

  return {
    phase,
    phaseNumber,
    totalPhases: PHASES.length,
    progressPercent,
    phaseLabelKey: phaseLabelKeyMap[phase],
    statusLabelKey: statusLabelKeyMap[phase],
    taskIndex: phaseNumber - 1,
    activeNodeCount: Math.min(14, activityByPhase[phase] + Math.round((input.streamingChunks || 0) / 8)),
  }
}
