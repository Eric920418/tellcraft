// ============================================================
// Feature Dry-Run 級聯失敗抑制測試（L4 根治）
// 測試 stepReferencesUnresolvedKey：父步驟失敗後，子步驟引用未就緒 contextKey → skip
// ============================================================

import { describe, it, expect } from 'vitest'
import { stepReferencesUnresolvedKey } from '../services/feature-dry-run'
import type { ParsedStep } from '../services/specformula-runner'

function step(text: string, headers: string[], rows: Record<string, string>[]): ParsedStep {
  return { text, dataTable: { headers, rows }, source: '', sourceLine: 0 } as unknown as ParsedStep
}

describe('stepReferencesUnresolvedKey（L4 級聯失敗抑制）', () => {
  it('unresolved 為空 → 不 skip 任何步驟', () => {
    const s = step('準備一個Merchant, with table:', ['>Merchant1.id'], [{ '>Merchant1.id': '<id' }])
    expect(stepReferencesUnresolvedKey(s, new Set())).toBeNull()
  })

  it('step 無 dataTable → 不 skip', () => {
    const s = { text: '現在時間為 "2026-01-01"', dataTable: undefined } as unknown as ParsedStep
    expect(stepReferencesUnresolvedKey(s, new Set(['Merchant1.id']))).toBeNull()
  })

  it('精確匹配：$Merchant1.id 引用未就緒的 Merchant1.id → skip', () => {
    const s = step(
      '準備一個Product, with table:',
      ['>Product1.id', 'merchantId'],
      [{ '>Product1.id': '<id', merchantId: '$Merchant1.id' }],
    )
    expect(stepReferencesUnresolvedKey(s, new Set(['Merchant1.id']))).toBe('Merchant1.id')
  })

  it('normalize 匹配：$merchant1Id（去 dot）引用未就緒的 Merchant1.id → skip', () => {
    const s = step(
      '準備一個Product, with table:',
      ['>Product1.id', 'merchantId'],
      [{ '>Product1.id': '<id', merchantId: '$merchant1Id' }],
    )
    expect(stepReferencesUnresolvedKey(s, new Set(['Merchant1.id']))).toBe('Merchant1.id')
  })

  it('entityField 組合匹配：$merchantUserId 引用未就緒的 Merchant.userId → skip', () => {
    const s = step(
      '準備一個Product, with table:',
      ['merchantUserId'],
      [{ merchantUserId: '$merchantUserId' }],
    )
    expect(stepReferencesUnresolvedKey(s, new Set(['Merchant.userId']))).toBe('Merchant.userId')
  })

  it('引用已就緒的變數 → 不 skip', () => {
    const s = step(
      '準備一個Product, with table:',
      ['merchantId'],
      [{ merchantId: '$Consumer1.id' }],
    )
    // unresolved 不含 Consumer1.id → 不應 skip
    expect(stepReferencesUnresolvedKey(s, new Set(['Merchant1.id']))).toBeNull()
  })

  it('header 裡的 $var 也能偵測（雖然 header 通常不含 $，邊界 case 保險）', () => {
    const s = step(
      '應該存在一個Product, with table:',
      ['id'],
      [{ id: '$Merchant1.id' }],
    )
    expect(stepReferencesUnresolvedKey(s, new Set(['Merchant1.id']))).toBe('Merchant1.id')
  })

  it('$數字 開頭（bcrypt hash）不應誤判為 var 引用', () => {
    const s = step(
      '準備一個User, with table:',
      ['passwordHash'],
      [{ passwordHash: '$2b$10$abcdef' }],
    )
    // bcrypt 以 $2b 開頭，regex 要求 $[a-zA-Z] 才算 var，不應命中
    expect(stepReferencesUnresolvedKey(s, new Set(['2b']))).toBeNull()
  })

  it('多個未就緒，回傳第一個命中的', () => {
    const s = step(
      '準備一個Product, with table:',
      ['merchantId', 'categoryId'],
      [{ merchantId: '$Merchant1.id', categoryId: '$Category1.id' }],
    )
    const result = stepReferencesUnresolvedKey(s, new Set(['Merchant1.id', 'Category1.id']))
    expect(result).not.toBeNull()
    expect(['Merchant1.id', 'Category1.id']).toContain(result)
  })

  it('PascalCase 複合 entity：$Merchant1User.id 引用未就緒的 Merchant1User.id（原始宣告）→ skip', () => {
    const s = step(
      '準備一個Product, with table:',
      ['merchantUserId'],
      [{ merchantUserId: '$Merchant1User.id' }],
    )
    expect(stepReferencesUnresolvedKey(s, new Set(['Merchant1User.id']))).toBe('Merchant1User.id')
  })
})
