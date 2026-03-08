export type GenerationPhase = 'reasoning' | 'structure' | 'animation' | 'rwd' | 'quality'
export type InsightSlotId = 'nav' | 'hero-title' | 'hero-media' | 'cta' | 'cards' | 'text-list' | 'feature-grid' | 'form-block'

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
  sceneActionKey: 'aiActionReasoning' | 'aiActionAssembling' | 'aiActionInjecting' | 'aiActionResponsive' | 'aiActionPolishing'
  activeModuleKey: 'aiModuleSemanticMap' | 'aiModuleHeaderHero' | 'aiModuleContentGrid' | 'aiModuleInteractionLayer' | 'aiModuleResponsiveMatrix' | 'aiModuleQualityGuard'
  taskIndex: number
  assembledModules: number
  totalModules: number
  stabilityScore: number
  styleInjectionCount: number
  interactionComponents: number
  activeInsightSlotId: InsightSlotId
  decisionConfidence: number
}

const PHASES: GenerationPhase[] = ['reasoning', 'structure', 'animation', 'rwd', 'quality']

const BASELINE_PROGRESS: Record<GenerationPhase, number> = {
  reasoning: 12,
  structure: 34,
  animation: 58,
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
  const phaseIndex = PHASES.indexOf(phase)
  const totalPhases = PHASES.length
  const progress = input.progress

  let percent = BASELINE_PROGRESS[phase]
  if (progress && progress.total > 0) {
    if (progress.total <= totalPhases) {
      const segment = clamp(progress.current / progress.total, 0, 1)
      percent = ((phaseIndex + segment) / totalPhases) * 100
    } else {
      percent = clamp((progress.current / progress.total) * 100, 0, 100)
    }
  }

  const chunkBoost = Math.min(input.streamingChunks || 0, 40) * 0.15
  return clamp(percent + chunkBoost, 5, 99)
}

export function resolveGenerationVisualState(input: GenerationVisualInput): GenerationVisualState {
  const phase = mapPhaseFromInputs(input)
  const phaseIndex = PHASES.indexOf(phase)
  const phaseNumber = phaseIndex + 1
  const progressPercent = getProgressPercent(input, phase)
  const streamingChunks = input.streamingChunks || 0

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

  const actionKeyMap: Record<GenerationPhase, GenerationVisualState['sceneActionKey']> = {
    reasoning: 'aiActionReasoning',
    structure: 'aiActionAssembling',
    animation: 'aiActionInjecting',
    rwd: 'aiActionResponsive',
    quality: 'aiActionPolishing',
  }

  const moduleKeyMap: Record<GenerationPhase, GenerationVisualState['activeModuleKey']> = {
    reasoning: 'aiModuleSemanticMap',
    structure: 'aiModuleHeaderHero',
    animation: 'aiModuleInteractionLayer',
    rwd: 'aiModuleResponsiveMatrix',
    quality: 'aiModuleQualityGuard',
  }

  const insightSlotMap: Record<GenerationPhase, InsightSlotId> = {
    reasoning: 'hero-title',
    structure: 'hero-media',
    animation: 'cta',
    rwd: 'cards',
    quality: 'form-block',
  }

  const totalModules = 24
  const assembledModules = clamp(Math.round((progressPercent / 100) * totalModules) + phaseNumber, 2, totalModules)
  const stabilityScore = clamp(Math.round(progressPercent * 0.88 + (phase === 'quality' ? 8 : 0)), 12, 99)
  const styleInjectionCount = clamp(8 + phaseNumber * 10 + Math.round(progressPercent * 1.1) + Math.round(streamingChunks / 2), 8, 220)
  const interactionComponents = clamp(
    phase === 'reasoning' ? 0 : phase === 'structure' ? 2 : 4 + Math.round((progressPercent - 35) / 8),
    0,
    24,
  )
  const decisionConfidence = clamp(Math.round(42 + progressPercent * 0.58 + (phase === 'quality' ? 5 : 0)), 45, 99)

  return {
    phase,
    phaseNumber,
    totalPhases: PHASES.length,
    progressPercent,
    phaseLabelKey: phaseLabelKeyMap[phase],
    statusLabelKey: statusLabelKeyMap[phase],
    sceneActionKey: actionKeyMap[phase],
    activeModuleKey: moduleKeyMap[phase],
    taskIndex: phaseIndex,
    assembledModules,
    totalModules,
    stabilityScore,
    styleInjectionCount,
    interactionComponents,
    activeInsightSlotId: insightSlotMap[phase],
    decisionConfidence,
  }
}
