import { describe, expect, it } from 'vitest'

import { resolveGenerationVisualState } from './generation-visual-state'

describe('resolveGenerationVisualState', () => {
  it('maps fast build phase to animation with proper scene action', () => {
    const result = resolveGenerationVisualState({
      stage: 'fast_generating',
      fastBuildPhase: 'animation',
      progress: { current: 2, total: 3, step: 'animation' },
      streamingChunks: 12,
    })

    expect(result.phase).toBe('animation')
    expect(result.phaseNumber).toBe(3)
    expect(result.sceneActionKey).toBe('aiActionInjecting')
    expect(result.activeModuleKey).toBe('aiModuleInteractionLayer')
  })

  it('maps uiux quality gate stage to quality phase and quality module', () => {
    const result = resolveGenerationVisualState({
      stage: 'uiux_quality_gate_fixing',
      progress: { current: 3, total: 3, step: 'quality' },
    })

    expect(result.phase).toBe('quality')
    expect(result.phaseLabelKey).toBe('phaseQuality')
    expect(result.statusLabelKey).toBe('aiStatusQuality')
    expect(result.activeModuleKey).toBe('aiModuleQualityGuard')
    expect(result.stabilityScore).toBeGreaterThan(80)
  })

  it('uses streaming phase when stage is missing and returns build metrics', () => {
    const result = resolveGenerationVisualState({
      streamingPhase: 'rwd',
      streamingChunks: 30,
    })

    expect(result.phase).toBe('rwd')
    expect(result.taskIndex).toBe(3)
    expect(result.assembledModules).toBeGreaterThan(10)
    expect(result.styleInjectionCount).toBeGreaterThan(40)
  })
})
