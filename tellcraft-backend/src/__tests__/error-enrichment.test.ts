/**
 * PR3 — error-enrichment.ts 規則測試
 *
 * 覆蓋：
 * - Coder Green Phase 8 類 FailureRootCause 全部有 hint（除 unknown）
 * - RED Phase 6 類 RedPhaseFailureType 全部有 hint（除 unknown）
 * - shouldSkipLlmFix 僅 var_resolution / auth_check 短路
 * - formatHintForPrompt / formatHintForRedPhase 格式正確
 */

import { describe, it, expect } from 'vitest'
import {
  enrichError,
  formatHintForPrompt,
  formatHintForRedPhase,
  type EnrichableRootCause,
} from '../services/error-enrichment'
import type { FailureRootCause } from '../services/coder-generation'
import type { RedPhaseFailureType } from '../services/red-phase-validator'

// ============================================================
// 覆蓋率：每個 rootCause 都必須有可用的 hint 或明確標記為無 hint
// ============================================================

describe('enrichError — Coder Green Phase 9 類', () => {
  const coderRootCauses: FailureRootCause[] = [
    'dispatch_mismatch',
    'missing_column',
    'wrong_status',
    'field_naming',
    'sql_error',
    'auth_check',
    'var_resolution',
    'fk_constraint',
    'spec_inconsistency',
  ]

  for (const rootCause of coderRootCauses) {
    it(`${rootCause} 必須有非空 harnessHint`, () => {
      const result = enrichError('test error', rootCause, { phase: 'coder_green' })
      expect(result.rootCause).toBe(rootCause)
      expect(result.harnessHint.length).toBeGreaterThan(20)
      expect(result.originalError).toBe('test error')
    })
  }

  it('unknown 的 harnessHint 為空字串', () => {
    const result = enrichError('some error', 'unknown', { phase: 'coder_green' })
    expect(result.harnessHint).toBe('')
  })
})

describe('enrichError — RED Phase 5 類（排除與 Coder 共用的 var_resolution）', () => {
  const redOnlyRootCauses: RedPhaseFailureType[] = [
    'entity_setup',
    'step_parsing',
    'api_spec_mismatch',
    'var_resolution',
    'routing_mismatch',
  ]

  for (const rootCause of redOnlyRootCauses) {
    it(`${rootCause} 必須有非空 harnessHint`, () => {
      const result = enrichError('test error', rootCause, { phase: 'red_phase' })
      expect(result.harnessHint.length).toBeGreaterThan(20)
    })
  }
})

// ============================================================
// skipLlmFix：只有 var_resolution / auth_check 兩類短路
// ============================================================

describe('enrichError.skipLlmFix', () => {
  it('var_resolution 應該 skipLlmFix=true', () => {
    expect(enrichError('', 'var_resolution').skipLlmFix).toBe(true)
  })

  it('auth_check 應該 skipLlmFix=true', () => {
    expect(enrichError('', 'auth_check').skipLlmFix).toBe(true)
  })

  it('spec_inconsistency 應該 skipLlmFix=true（Feature 矛盾，修代碼無效）', () => {
    expect(enrichError('', 'spec_inconsistency').skipLlmFix).toBe(true)
  })

  it('missing_column 應該 skipLlmFix=false（走 LLM 修復）', () => {
    expect(enrichError('', 'missing_column').skipLlmFix).toBe(false)
  })

  it('entity_setup 應該 skipLlmFix=false', () => {
    expect(enrichError('', 'entity_setup').skipLlmFix).toBe(false)
  })

  it('unknown 應該 skipLlmFix=false', () => {
    expect(enrichError('', 'unknown').skipLlmFix).toBe(false)
  })
})

// ============================================================
// formatHintForPrompt：產出 LLM prompt section
// ============================================================

describe('formatHintForPrompt', () => {
  it('有 hint 時產出包含 rootCause 與 hint 的 section', () => {
    const enriched = enrichError('column created_at does not exist', 'missing_column')
    const output = formatHintForPrompt(enriched)
    expect(output).toContain('## Harness 修復提示')
    expect(output).toContain('rootCause: missing_column')
    expect(output).toContain('deleted_at')
  })

  it('無 hint（unknown）時回傳空字串，避免污染 prompt', () => {
    const enriched = enrichError('some error', 'unknown')
    expect(formatHintForPrompt(enriched)).toBe('')
  })
})

// ============================================================
// formatHintForRedPhase：RED Phase unexpectedFailure.error 短字串
// ============================================================

describe('formatHintForRedPhase', () => {
  it('有 hint 時：hint summary + 截斷原文（不加 [rootCause] 前綴避免下游重複）', () => {
    const enriched = enrichError('entity_setup 失敗：NOT NULL 欄位 email 未提供', 'entity_setup')
    const output = formatHintForRedPhase(enriched)
    expect(output).not.toContain('[entity_setup]')  // 避免與下游 [f.failureType] 重複
    expect(output).toContain('原始錯誤:')
    expect(output).toContain('entity_setup 失敗')
  })

  it('無 hint（unknown）時直接回傳截斷原文', () => {
    const err = 'some unclassified error message'
    const enriched = enrichError(err, 'unknown')
    expect(formatHintForRedPhase(enriched)).toBe(err)
  })

  it('超長原文截斷到 maxOriginalLen', () => {
    const longErr = 'x'.repeat(500)
    const enriched = enrichError(longErr, 'unknown')
    expect(formatHintForRedPhase(enriched, 100).length).toBeLessThanOrEqual(100)
  })
})

// ============================================================
// Type-level：確保所有 EnrichableRootCause 都列在 ROOT_CAUSE_HINTS
// （透過 exhaustive switch，TS 編譯即可保證，此處做 runtime 防呆）
// ============================================================

describe('EnrichableRootCause 覆蓋完整性', () => {
  it('所有已知 rootCause 呼叫 enrichError 都不 throw', () => {
    const all: EnrichableRootCause[] = [
      'dispatch_mismatch', 'missing_column', 'wrong_status', 'field_naming',
      'sql_error', 'auth_check', 'var_resolution', 'fk_constraint',
      'spec_inconsistency', 'unknown',
      'entity_setup', 'step_parsing', 'api_spec_mismatch', 'routing_mismatch',
    ]
    for (const rc of all) {
      expect(() => enrichError('', rc)).not.toThrow()
    }
  })
})
