// ============================================================
// L17.P0.3: issueFingerprint — fix loop 的 issue 指紋比對
// 目的：擋 LLM「改名症狀修復」—— fix 前後 error count 一樣但其實解了 A、新增了 B
// ============================================================

import { describe, it, expect } from 'vitest'
import { issueFingerprint } from '../services/feature-alignment-gate'

function issue(featureName: string, checkName: string, description: string) {
  return { featureName, checkName, severity: 'error' as const, description }
}

describe('issueFingerprint', () => {
  it('相同 feature / check / line / varName → 相同指紋', () => {
    const a = issue('Create Order', 'var_system_alignment', 'VAR 引用 "$Store.id" (line 42) 完全未宣告')
    const b = issue('Create Order', 'var_system_alignment', 'VAR 引用 "$Store.id" (line 42) 完全未宣告 — 其他 hint 文字')
    expect(issueFingerprint(a)).toBe(issueFingerprint(b))
  })

  it('不同 varName → 不同指紋（偵測 LLM 改名）', () => {
    const before = issue('Create Order', 'var_system_alignment', 'VAR 引用 "$Store.id" (line 42) 完全未宣告')
    const after = issue('Create Order', 'var_system_alignment', 'VAR 引用 "$storeId" (line 42) 完全未宣告')
    expect(issueFingerprint(before)).not.toBe(issueFingerprint(after))
  })

  it('不同 line → 不同指紋', () => {
    const l1 = issue('Create Order', 'var_system_alignment', 'VAR 引用 "$Store.id" (line 10) 完全未宣告')
    const l2 = issue('Create Order', 'var_system_alignment', 'VAR 引用 "$Store.id" (line 42) 完全未宣告')
    expect(issueFingerprint(l1)).not.toBe(issueFingerprint(l2))
  })

  it('不同 feature → 不同指紋', () => {
    const f1 = issue('Create Order', 'var_system_alignment', 'VAR 引用 "$Store.id" (line 42) 完全未宣告')
    const f2 = issue('Cancel Order', 'var_system_alignment', 'VAR 引用 "$Store.id" (line 42) 完全未宣告')
    expect(issueFingerprint(f1)).not.toBe(issueFingerprint(f2))
  })

  it('不同 check → 不同指紋', () => {
    const c1 = issue('X', 'var_system_alignment', 'line 10 related to $Store.id')
    const c2 = issue('X', 'summary_action_match', 'line 10 related to $Store.id')
    expect(issueFingerprint(c1)).not.toBe(issueFingerprint(c2))
  })

  it('description 無 line / 無 $var → fallback 到 `?`（寬鬆比對，避免誤報）', () => {
    const noDetails = issue('X', 'some_check', 'generic error without line or var')
    const fp = issueFingerprint(noDetails)
    expect(fp).toContain('?|?')
  })

  it('Set-based 比對：before=[$A,$B]、after=[$B,$C] → 解了 $A、新增 $C', () => {
    const before = [
      issueFingerprint(issue('F', 'var', '$A.id (line 1) 完全未宣告')),
      issueFingerprint(issue('F', 'var', '$B.id (line 2) 完全未宣告')),
    ]
    const after = [
      issueFingerprint(issue('F', 'var', '$B.id (line 2) 完全未宣告')),
      issueFingerprint(issue('F', 'var', '$C.id (line 3) 完全未宣告')),
    ]
    const beforeSet = new Set(before)
    const afterSet = new Set(after)
    const resolved = [...beforeSet].filter(k => !afterSet.has(k))
    const introduced = [...afterSet].filter(k => !beforeSet.has(k))
    expect(resolved).toHaveLength(1)
    expect(introduced).toHaveLength(1)
  })

  it('LLM 改名症狀修復偵測：before=[$Store.id]、after=[$storeId] → resolvedCount=1, newCount=1（數值看起來一樣，指紋抓包）', () => {
    const before = [issue('F', 'var_system_alignment', '$Store.id (line 5) 完全未宣告')].map(issueFingerprint)
    const after = [issue('F', 'var_system_alignment', '$storeId (line 5) 完全未宣告')].map(issueFingerprint)
    // 純 count：before=1, after=1 → 看起來無進展但無倒退
    expect(before.length).toBe(after.length)
    // 指紋：其實完全不同
    const beforeSet = new Set(before)
    const afterSet = new Set(after)
    const resolved = [...beforeSet].filter(k => !afterSet.has(k))
    const introduced = [...afterSet].filter(k => !beforeSet.has(k))
    // fix loop 會偵測到 resolvedCount=1 但 newCount=1 → 提前 block
    expect(resolved).toHaveLength(1)
    expect(introduced).toHaveLength(1)
  })
})
