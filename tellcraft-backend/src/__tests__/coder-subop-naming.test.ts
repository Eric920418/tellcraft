// ============================================================
// L7：Per-SubOp 函數名生成 — 兼容 LLM 各種 Actor prefix 寫法 + sanitize JS 識別符
// ============================================================

import { describe, it, expect } from 'vitest'
import * as esbuild from 'esbuild'
import {
  cleanSubOpSummary,
  sanitizeForJsIdentifier,
  buildHandleName,
} from '../services/coder-generation'

describe('cleanSubOpSummary（strip Actor prefix）', () => {
  it('帶括號 UID → strip', () => {
    expect(cleanSubOpSummary('(UID="$Store.id") 查看銷售報表')).toBe('查看銷售報表')
  })

  it('無括號 UID（LLM 常見錯誤） → strip', () => {
    // 這是 VPS 實錘錯誤格式
    expect(cleanSubOpSummary('UID="$Store.id" 查看銷售報表')).toBe('查看銷售報表')
  })

  it('帶括號 No Actor → strip', () => {
    expect(cleanSubOpSummary('(No Actor) 建立訂單')).toBe('建立訂單')
  })

  it('無括號 No Actor → strip', () => {
    expect(cleanSubOpSummary('No Actor 建立訂單')).toBe('建立訂單')
  })

  it('純 summary 無 Actor → 原樣返回', () => {
    expect(cleanSubOpSummary('查看銷售報表')).toBe('查看銷售報表')
  })

  it('summary 中間有 UID 樣式（不在開頭）→ 不誤刪', () => {
    expect(cleanSubOpSummary('查看 UID="abc" 的銷售報表')).toBe('查看 UID="abc" 的銷售報表')
  })

  it('多重 strip 不破壞', () => {
    expect(cleanSubOpSummary('(UID="$Store.id")  建立訂單')).toBe('建立訂單')
  })
})

describe('sanitizeForJsIdentifier', () => {
  it('純中文 → 保留', () => {
    expect(sanitizeForJsIdentifier('查看銷售報表')).toBe('查看銷售報表')
  })

  it('VPS 實錘 case：UID="$store.id" 查看銷售報表 → 移除 = " $ . 但保留中文', () => {
    expect(sanitizeForJsIdentifier('UID="$store.id" 查看銷售報表')).toBe('UIDstoreid 查看銷售報表')
  })

  it('英文 + 數字 → 保留', () => {
    expect(sanitizeForJsIdentifier('createOrder123')).toBe('createOrder123')
  })

  it('特殊符號 → 全移除', () => {
    expect(sanitizeForJsIdentifier('foo!@#$%^&*()bar')).toBe('foobar')
  })

  it('空白保留（給 toPascalCase 切詞）', () => {
    expect(sanitizeForJsIdentifier('foo bar baz')).toBe('foo bar baz')
  })
})

describe('buildHandleName（端到端：summary → 合法 JS 函數名）', () => {
  // VPS 實錘的 4 個失敗 action：esbuild 應該全部 parse 過
  const realCases = [
    'UID="$Store.id" 查看銷售報表',
    'UID="$OtherStore.id" 查看銷售報表',
    'UID="$Store.id" 查看評價列表',
    'UID="$Store.id" 查看店家訂單列表',
    'UID="$OtherStore.id" 查看店家訂單列表',
    'No Actor 查看顧客評分',
    '(No Actor) 建立訂單',
    '查詢商品列表',
  ]

  for (const summary of realCases) {
    it(`"${summary}" → 合法 JS 函數名 + esbuild parse 過`, async () => {
      // 注意：buildHandleName 不會 strip Actor prefix（那是 cleanSubOpSummary 的職責）
      // 但 sanitize 後即使有殘留，也會變成合法 JS 識別符
      const cleaned = cleanSubOpSummary(summary)
      const handleName = buildHandleName(cleaned)
      // 必須以 handle 開頭
      expect(handleName).toMatch(/^handle/)
      // 必須是合法 JS 識別符（容許中文）
      expect(handleName).not.toMatch(/[="$.()&!@#%^*]/)
      // 用真實 esbuild parse 驗證可作為函數名
      const code = `async function ${handleName}(input: any) { return input }`
      await expect(esbuild.transform(code, { loader: 'ts' })).resolves.toBeTruthy()
    })
  }

  it('沒 strip 也能 sanitize：UID 殘留版本也是合法函數名', async () => {
    // 即使 cleanSubOpSummary 沒被叫到，buildHandleName 也應該 sanitize 出合法 JS
    const handleName = buildHandleName('UID="$store.id" 查看銷售報表')
    const code = `async function ${handleName}(input: any) { return input }`
    await expect(esbuild.transform(code, { loader: 'ts' })).resolves.toBeTruthy()
    // = " $ . 不應出現
    expect(handleName).not.toContain('=')
    expect(handleName).not.toContain('"')
    expect(handleName).not.toContain('$')
    expect(handleName).not.toContain('.')
  })
})
