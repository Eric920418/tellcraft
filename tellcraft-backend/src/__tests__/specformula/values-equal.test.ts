/**
 * 測試 EntityValidate.valuesEqual 的數值正規化邏輯
 * 主要驗證：DataTable "800" vs pg NUMERIC 回傳 "800.00" 應該相等
 */
import { describe, it, expect } from 'vitest'
import { EntityValidate } from '../../lib/specformula/instruction/entity-validate'

describe('EntityValidate.valuesEqual', () => {
  // 用 reflection 取得 private method
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const valuesEqual = (EntityValidate.prototype as any).valuesEqual.bind({})

  describe('NUMERIC/DECIMAL 同類型字串比較', () => {
    it('"800" === "800.00"（pg NUMERIC string）', () => {
      expect(valuesEqual('800', '800.00')).toBe(true)
    })

    it('"800.00" === "800"（反向）', () => {
      expect(valuesEqual('800.00', '800')).toBe(true)
    })

    it('"100.50" === "100.5"', () => {
      expect(valuesEqual('100.50', '100.5')).toBe(true)
    })

    it('"800" !== "801"', () => {
      expect(valuesEqual('800', '801')).toBe(false)
    })

    it('"-50.00" === "-50"', () => {
      expect(valuesEqual('-50.00', '-50')).toBe(true)
    })

    it('"0.00" === "0"', () => {
      expect(valuesEqual('0.00', '0')).toBe(true)
    })
  })

  describe('Cross-type 數值比較（保留現有行為）', () => {
    it('800 (number) === "800.00" (string)', () => {
      expect(valuesEqual(800, '800.00')).toBe(true)
    })

    it('"800" (string) === 800 (number)', () => {
      expect(valuesEqual('800', 800)).toBe(true)
    })
  })

  describe('Number-to-number 比較', () => {
    it('800 === 800.0', () => {
      expect(valuesEqual(800, 800.0)).toBe(true)
    })

    it('800 !== 801', () => {
      expect(valuesEqual(800, 801)).toBe(false)
    })
  })

  describe('非數值字串不誤判', () => {
    it('"abc" !== "abcd"', () => {
      expect(valuesEqual('abc', 'abcd')).toBe(false)
    })

    it('"800abc" !== "800"（含字母不視為純數值）', () => {
      expect(valuesEqual('800abc', '800')).toBe(false)
    })

    it('"8.0.0"（版本號）!== "8"', () => {
      expect(valuesEqual('8.0.0', '8')).toBe(false)
    })
  })

  describe('null/undefined 處理（保留現有行為）', () => {
    it('null === null', () => {
      expect(valuesEqual(null, null)).toBe(true)
    })

    it('null !== "0"', () => {
      expect(valuesEqual(null, '0')).toBe(false)
    })

    it('undefined === null', () => {
      expect(valuesEqual(undefined, null)).toBe(true)
    })
  })
})
