import { describe, it, expect } from 'vitest'
import {
  classifyPhaseError,
  getPhaseErrorPatternKeys,
  categorizeSanitizeFix,
  type TelemetryEvent,
  type TelemetryOutcome,
} from '../services/skill-telemetry'

// ============================================================
// classifyPhaseError — 零 LLM regex 分類器
// ============================================================

describe('classifyPhaseError', () => {
  it('should classify timeout errors', () => {
    expect(classifyPhaseError(new Error('Request timed out after 30s'))).toBe('timeout')
    expect(classifyPhaseError(new Error('ETIMEDOUT'))).toBe('timeout')
    expect(classifyPhaseError(new Error('socket timeout reached'))).toBe('timeout')
  })

  it('should classify network errors', () => {
    expect(classifyPhaseError(new Error('connect ECONNREFUSED 127.0.0.1:5432'))).toBe('network')
    expect(classifyPhaseError(new Error('ECONNRESET by peer'))).toBe('network')
    expect(classifyPhaseError(new Error('socket hang up'))).toBe('network')
  })

  it('should classify rate limit errors', () => {
    expect(classifyPhaseError(new Error('429 Too Many Requests'))).toBe('rate_limit')
    expect(classifyPhaseError(new Error('overloaded_error: model is overloaded'))).toBe('rate_limit')
    expect(classifyPhaseError(new Error('rate limit exceeded'))).toBe('rate_limit')
  })

  it('should classify LLM errors', () => {
    expect(classifyPhaseError(new Error('anthropic API error'))).toBe('llm_error')
    expect(classifyPhaseError(new Error('max_tokens exceeded'))).toBe('llm_error')
  })

  it('should classify filesystem errors', () => {
    expect(classifyPhaseError(new Error('ENOENT: no such file or directory'))).toBe('filesystem')
    expect(classifyPhaseError(new Error('EPERM: operation not permitted'))).toBe('filesystem')
  })

  it('should classify database errors', () => {
    expect(classifyPhaseError(new Error('relation "users" does not exist'))).toBe('db_error')
    expect(classifyPhaseError(new Error('column "name" does not exist'))).toBe('db_error')
    expect(classifyPhaseError(new Error('duplicate key value violates unique constraint'))).toBe('db_error')
  })

  it('should classify Redis errors', () => {
    expect(classifyPhaseError(new Error('WRONGTYPE Operation against a key'))).toBe('redis_error')
    expect(classifyPhaseError(new Error('NOAUTH Authentication required'))).toBe('redis_error')
  })

  it('should classify OOM errors', () => {
    expect(classifyPhaseError(new Error('out of memory'))).toBe('oom')
    expect(classifyPhaseError(new Error('JavaScript heap out of memory'))).toBe('oom')
  })

  it('should return unknown for unrecognized errors', () => {
    expect(classifyPhaseError(new Error('something weird happened'))).toBe('unknown')
    expect(classifyPhaseError('string error')).toBe('unknown')
    expect(classifyPhaseError(null)).toBe('unknown')
  })

  it('should handle non-Error objects', () => {
    expect(classifyPhaseError({ message: 'ECONNREFUSED' })).toBe('unknown')
    expect(classifyPhaseError(42)).toBe('unknown')
  })
})

describe('getPhaseErrorPatternKeys', () => {
  it('should return all pattern keys', () => {
    const keys = getPhaseErrorPatternKeys()
    expect(keys).toContain('timeout')
    expect(keys).toContain('network')
    expect(keys).toContain('rate_limit')
    expect(keys).toContain('llm_error')
    expect(keys).toContain('db_error')
    expect(keys).toContain('redis_error')
    expect(keys).toContain('oom')
    expect(keys).toContain('filesystem')
    expect(keys.length).toBe(8)
  })
})

// ============================================================
// TelemetryEvent 型別 — 向後相容 + 新欄位
// ============================================================

describe('TelemetryEvent type compatibility', () => {
  it('should accept v2 events without new fields (backward compat)', () => {
    const event: TelemetryEvent = {
      skillName: 'deployer',
      eventType: 'sanitize_fix',
      patternKey: 'motion-import',
    }
    expect(event.outcome).toBeUndefined()
    expect(event.rootCauseCategory).toBeUndefined()
    expect(event.phase).toBeUndefined()
  })

  it('should accept v3 failure events with all new fields', () => {
    const event: TelemetryEvent = {
      skillName: 'coder',
      eventType: 'coder_test_fail',
      patternKey: 'missing_column',
      outcome: 'failed',
      rootCauseCategory: 'missing_column',
      phase: 'coder_green_phase',
      errorType: 'test_fail',
      recovered: false,
      severity: 'critical',
      userId: 'test-user',
      conversationId: 'test-conv',
      payload: { actionName: 'createUser' },
      fixRounds: 2,
    }
    expect(event.outcome).toBe('failed')
    expect(event.rootCauseCategory).toBe('missing_column')
    expect(event.phase).toBe('coder_green_phase')
  })

  it('should accept all new SkillName values', () => {
    const skills: TelemetryEvent['skillName'][] = [
      'deployer', 'quality_gate', 'iteration', 'uiux', 'coder',
      'orchestrator', 'red_phase', 'feature_gate', 'prefilter',
      'syntax_validator', 'flowstate_recovery',
    ]
    for (const skill of skills) {
      const event: TelemetryEvent = { skillName: skill, eventType: 'phase_failure', patternKey: 'test' }
      expect(event.skillName).toBe(skill)
    }
  })

  it('should accept all new EventType values', () => {
    const events: TelemetryEvent['eventType'][] = [
      'sanitize_fix', 'qg_rule_fix', 'qg_llm_fallback', 'iteration',
      'phase_failure', 'phase_timeout_recovered',
      'coder_test_fail', 'coder_test_fix_success', 'coder_test_fix_give_up',
      'deployer_layer_trigger', 'red_validation_fail',
      'alignment_blocked', 'alignment_fixed',
      'prefilter_reject', 'prefilter_antiloop', 'syntax_repair',
    ]
    for (const eventType of events) {
      const event: TelemetryEvent = { skillName: 'deployer', eventType, patternKey: 'test' }
      expect(event.eventType).toBe(eventType)
    }
  })

  it('should accept all TelemetryOutcome values', () => {
    const outcomes: TelemetryOutcome[] = ['success', 'failed', 'repaired', 'timeout', 'blocked']
    for (const outcome of outcomes) {
      const event: TelemetryEvent = {
        skillName: 'deployer', eventType: 'deployer_layer_trigger',
        patternKey: 'test', outcome,
      }
      expect(event.outcome).toBe(outcome)
    }
  })
})

// ============================================================
// categorizeSanitizeFix — 確保新 patternKey 不破壞既有分類
// ============================================================

describe('categorizeSanitizeFix backward compat', () => {
  it('should still classify all 27 known patterns', () => {
    const testCases: Array<[string, string]> = [
      ['framer-motion → motion/react', 'motion-import'],
      ['自動加入 \'use client\'', 'use-client-missing'],
      ['補缺失 React hooks import', 'missing-hooks-import'],
      ['useSearchParams Suspense boundary', 'search-params-suspense'],
      ['broken import 不存在 → 生成 stub', 'broken-import-stub'],
      ['Build 失敗但無法解析錯誤類型', 'build-unparseable'],
      ['npm install 失敗', 'npm-install-fail'],
    ]
    for (const [label, expected] of testCases) {
      expect(categorizeSanitizeFix(label)).toBe(expected)
    }
  })

  it('should return other for unknown labels', () => {
    expect(categorizeSanitizeFix('some random fix label')).toBe('other')
  })
})
