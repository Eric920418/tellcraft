import { describe, it, expect } from 'vitest'
import { NamingConverter } from '../../lib/specformula/helper/naming-converter'

describe('NamingConverter', () => {
  describe('camelToSnake', () => {
    it('converts simple camelCase', () => {
      expect(NamingConverter.camelToSnake('messageCount')).toBe('message_count')
    })

    it('converts multi-word camelCase', () => {
      expect(NamingConverter.camelToSnake('messageCountThisPeriod')).toBe('message_count_this_period')
    })

    it('handles single word (no change)', () => {
      expect(NamingConverter.camelToSnake('name')).toBe('name')
    })

    it('handles already snake_case', () => {
      expect(NamingConverter.camelToSnake('user_id')).toBe('user_id')
    })

    it('handles empty string', () => {
      expect(NamingConverter.camelToSnake('')).toBe('')
    })

    it('handles consecutive uppercase (acronym)', () => {
      expect(NamingConverter.camelToSnake('userID')).toBe('user_id')
    })

    it('handles numbers adjacent to uppercase', () => {
      expect(NamingConverter.camelToSnake('field1Name')).toBe('field1_name')
    })
  })

  describe('snakeToCamel', () => {
    it('converts simple snake_case', () => {
      expect(NamingConverter.snakeToCamel('message_count')).toBe('messageCount')
    })

    it('converts multi-word snake_case', () => {
      expect(NamingConverter.snakeToCamel('message_count_this_period')).toBe('messageCountThisPeriod')
    })

    it('handles single word (no change)', () => {
      expect(NamingConverter.snakeToCamel('name')).toBe('name')
    })

    it('handles already camelCase', () => {
      expect(NamingConverter.snakeToCamel('userId')).toBe('userId')
    })

    it('handles empty string', () => {
      expect(NamingConverter.snakeToCamel('')).toBe('')
    })

    it('handles leading underscore', () => {
      expect(NamingConverter.snakeToCamel('_id')).toBe('Id')
    })
  })

  describe('getRowValue', () => {
    it('finds exact key match', () => {
      const row = { userId: '123', name: 'test' }
      expect(NamingConverter.getRowValue(row, 'userId')).toBe('123')
    })

    it('finds snake_case key via camelCase conversion', () => {
      const row = { userId: '123' }
      expect(NamingConverter.getRowValue(row, 'user_id')).toBe('123')
    })

    it('returns null for missing key', () => {
      const row = { name: 'test' }
      expect(NamingConverter.getRowValue(row, 'email')).toBeNull()
    })
  })

  describe('toCamelCaseKeys', () => {
    it('converts all keys to camelCase', () => {
      const input = { user_id: '123', first_name: 'Alice', age: 25 }
      expect(NamingConverter.toCamelCaseKeys(input)).toEqual({
        userId: '123',
        firstName: 'Alice',
        age: 25,
      })
    })

    it('handles empty object', () => {
      expect(NamingConverter.toCamelCaseKeys({})).toEqual({})
    })
  })
})
