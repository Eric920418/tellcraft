/**
 * PR2 — skill-loader.ts 規則測試
 *
 * 覆蓋：
 * - 13 個 Coder handler 都能從 .md 載入
 * - getCoderHandler(id) 回傳的內容首行為 '\n'（與舊 const 的模板字面量頭部對齊）
 * - getCoderHandlersJoined(ids) 用 '\n' 連接，保持 insertion order
 * - 未知 id 會 throw
 */

import { describe, it, expect } from 'vitest'
import {
  getCoderHandler,
  getCoderHandlersJoined,
  CODER_HANDLER_IDS,
  type CoderHandlerId,
} from '../lib/skill-loader'

// ============================================================
// 所有已知 handler 都能載入
// ============================================================

describe('getCoderHandler — 全部 handler 可載入', () => {
  for (const id of CODER_HANDLER_IDS) {
    it(`${id} 載入後內容非空`, () => {
      const content = getCoderHandler(id)
      expect(typeof content).toBe('string')
      expect(content.length).toBeGreaterThan(0)
    })
  }

  it('18 個 handler 全部有註冊', () => {
    expect(CODER_HANDLER_IDS).toHaveLength(18)
  })

  it('email-sender handler 已註冊', () => {
    expect(CODER_HANDLER_IDS).toContain('email-sender' as CoderHandlerId)
    const content = getCoderHandler('email-sender')
    expect(content).toContain('sendEmail')
    expect(content).toContain('escapeHtml')
  })
})

// ============================================================
// Byte-identity: handler 內容必須以 '\n' 開頭
// 因為原 const 的模板字面量第一字就是 newline（backtick 後立即換行）
// 這保證舊 handlers.join('\n') 與新 getCoderHandlersJoined() 產出相同
// ============================================================

describe('handler 內容 byte-identity 保證', () => {
  for (const id of CODER_HANDLER_IDS) {
    it(`${id} 以 '\\n' 開頭（匹配原 const 首字元）`, () => {
      const content = getCoderHandler(id)
      expect(content[0]).toBe('\n')
    })
  }

  it(`auth handler 末尾不含 trailing newline（匹配原 const）`, () => {
    const content = getCoderHandler('auth')
    // 原 const 結束於 backtick 前的最後一字，不以 \n 結尾
    expect(content.endsWith('\n')).toBe(false)
  })
})

// ============================================================
// getCoderHandlersJoined：join 邏輯與舊 handlers.join('\n') 一致
// ============================================================

describe('getCoderHandlersJoined', () => {
  it('單一 handler 等同 getCoderHandler', () => {
    expect(getCoderHandlersJoined(['create'])).toBe(getCoderHandler('create'))
  })

  it('多 handler 用 \\n 連接，保持 insertion order', () => {
    const joined = getCoderHandlersJoined(['create', 'update', 'delete'])
    const manual = [
      getCoderHandler('create'),
      getCoderHandler('update'),
      getCoderHandler('delete'),
    ].join('\n')
    expect(joined).toBe(manual)
  })

  it('空陣列回傳空字串（與 [].join 一致）', () => {
    expect(getCoderHandlersJoined([])).toBe('')
  })

  it('order 影響輸出（非 set 去重）', () => {
    const ab = getCoderHandlersJoined(['create', 'update'])
    const ba = getCoderHandlersJoined(['update', 'create'])
    expect(ab).not.toBe(ba)
  })
})

// ============================================================
// 錯誤處理：未知 id throw
// ============================================================

describe('getCoderHandler 錯誤處理', () => {
  it('未知 id 會 throw', () => {
    expect(() => getCoderHandler('nonexistent' as CoderHandlerId)).toThrow()
  })
})

// ============================================================
// 代表性 action 場景：模擬 buildActionSystemPrompt 的輸出結構
// 這不是完整整合測試，只驗證 getCoderHandlersJoined 在真實使用場景下可運作
// ============================================================

describe('典型 action 場景', () => {
  it('CRUD action（hasStateRules + hasResponseRules + column-alias）', () => {
    const ids: CoderHandlerId[] = ['create', 'update', 'delete', 'query-list', 'query-single', 'column-alias']
    const joined = getCoderHandlersJoined(ids)
    // 必含每個 handler 的標題（L13 英文化後）
    expect(joined).toContain('## Create Handler')
    expect(joined).toContain('## Update Handler')
    expect(joined).toContain('## Delete Handler')
    expect(joined).toContain('## List Query Handler')
    expect(joined).toContain('## Single-Record Query Handler')
    expect(joined).toContain('## Column Aliasing')
  })

  it('auth action（只注入 auth handler）', () => {
    const joined = getCoderHandlersJoined(['auth'])
    expect(joined).toContain('## Auth Handler')
    expect(joined).toContain('bcrypt')
    expect(joined).toContain('jwt.sign')
  })
})
