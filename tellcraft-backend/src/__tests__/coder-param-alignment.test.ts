// ============================================================
// L20.E: Coder Input Parameter Naming — BASE_PROMPT 段落 golden test
// 目的：若未來有人動到 BASE_PROMPT 的 "Input Parameter Naming" 段落（L19.P2）
// 測試會立刻爆 → 防退化。
// ============================================================

import { describe, it, expect } from 'vitest'
import { BASE_PROMPT } from '../services/coder-generation'

describe('BASE_PROMPT — Input Parameter Naming 段落（L19.P2）', () => {
  it('包含 "Input Parameter Naming (CRITICAL" 標題', () => {
    expect(BASE_PROMPT).toMatch(/Input Parameter Naming\s*\(CRITICAL/i)
  })

  it('明示 input.X 名必須匹配 Feature DataTable headers', () => {
    expect(BASE_PROMPT).toMatch(/input\.X.*match.*Feature.*DataTable.*headers.*EXACTLY/i)
  })

  it('含 sectionId vs id 反例', () => {
    // L19.P2 修 Portfolio Section 的 4 個 400 失敗 — 關鍵反例：
    //   Feature 傳 sectionId，但 Coder 生 input.id 導致 400
    expect(BASE_PROMPT).toContain('sectionId')
    expect(BASE_PROMPT).toContain("NOT")
    expect(BASE_PROMPT).toContain('input.id')
  })

  it('含 "Get Portfolio Section" 實例', () => {
    expect(BASE_PROMPT).toContain('Get Portfolio Section')
  })

  it('error message 引用實際 param 名（而非固定 "id is required"）', () => {
    expect(BASE_PROMPT).toMatch(/sectionId is required/i)
  })

  it('保留 L17 已加的 LANGUAGE POLICY 段落（不退化）', () => {
    expect(BASE_PROMPT).toMatch(/LANGUAGE POLICY/i)
    expect(BASE_PROMPT).toContain('ENGLISH')
  })

  it('保留 L17 已加的 Sub-operation Dispatch 段落（不退化）', () => {
    expect(BASE_PROMPT).toMatch(/Sub-operation Dispatch/i)
    expect(BASE_PROMPT).toContain('_stepSummary')
  })

  it('禁止回到中文範例（L14 強化）', () => {
    // L14 commit 已經把 BASE_PROMPT 內所有 Coder 範例改英文
    // 未來若有人新加範例誤用中文 summary，此 test 會抓到
    expect(BASE_PROMPT).not.toContain('建立待辦')
    expect(BASE_PROMPT).not.toContain('使用者註冊')
  })
})
