import { describe, it, expect } from 'vitest'
import { TypeConverter } from '../../lib/specformula/helper/type-converter'

describe('TypeConverter', () => {
  describe('convertToColumnType', () => {
    it('returns null for null input', () => {
      expect(TypeConverter.convertToColumnType(null, 'TEXT')).toBeNull()
    })

    it('returns value when columnType is null', () => {
      expect(TypeConverter.convertToColumnType('hello', null)).toBe('hello')
    })

    // UUID
    it('passes UUID string through', () => {
      expect(TypeConverter.convertToColumnType('550e8400-e29b-41d4-a716-446655440000', 'UUID'))
        .toBe('550e8400-e29b-41d4-a716-446655440000')
    })

    // Boolean
    it('converts "true" to boolean', () => {
      expect(TypeConverter.convertToColumnType('true', 'BOOLEAN')).toBe(true)
    })

    it('converts "false" to boolean', () => {
      expect(TypeConverter.convertToColumnType('false', 'BOOLEAN')).toBe(false)
    })

    it('converts "1" to true for BOOL', () => {
      expect(TypeConverter.convertToColumnType('1', 'BOOL')).toBe(true)
    })

    it('converts "0" to false for BOOL', () => {
      expect(TypeConverter.convertToColumnType('0', 'BOOL')).toBe(false)
    })

    it('passes actual boolean through', () => {
      expect(TypeConverter.convertToColumnType(true, 'BOOLEAN')).toBe(true)
    })

    // Integer
    it('converts string to integer for INT', () => {
      expect(TypeConverter.convertToColumnType('42', 'INT')).toBe(42)
    })

    it('converts string to integer for INTEGER', () => {
      expect(TypeConverter.convertToColumnType('100', 'INTEGER')).toBe(100)
    })

    it('converts string to integer for SERIAL', () => {
      expect(TypeConverter.convertToColumnType('1', 'SERIAL')).toBe(1)
    })

    it('truncates decimal for integer type', () => {
      expect(TypeConverter.convertToColumnType(3.7, 'INT')).toBe(3)
    })

    it('returns original value for non-numeric string on INT', () => {
      expect(TypeConverter.convertToColumnType('abc', 'INT')).toBe('abc')
    })

    // BIGINT
    it('converts string to number for BIGINT', () => {
      expect(TypeConverter.convertToColumnType('999999', 'BIGINT')).toBe(999999)
    })

    // Decimal
    it('converts string to float for DECIMAL', () => {
      expect(TypeConverter.convertToColumnType('3.14', 'DECIMAL(10,2)')).toBeCloseTo(3.14)
    })

    it('converts string to float for NUMERIC', () => {
      expect(TypeConverter.convertToColumnType('2.718', 'NUMERIC')).toBeCloseTo(2.718)
    })

    it('converts string to float for DOUBLE PRECISION', () => {
      expect(TypeConverter.convertToColumnType('1.23e10', 'DOUBLE PRECISION')).toBe(1.23e10)
    })

    // JSON/JSONB
    it('passes valid JSON string through for JSONB', () => {
      expect(TypeConverter.convertToColumnType('{"key":"value"}', 'JSONB')).toBe('{"key":"value"}')
    })

    it('wraps non-JSON string as JSON for JSONB', () => {
      expect(TypeConverter.convertToColumnType('hello', 'JSONB')).toBe('"hello"')
    })

    it('stringifies object for JSON', () => {
      expect(TypeConverter.convertToColumnType({ a: 1 }, 'JSON')).toBe('{"a":1}')
    })

    it('passes JSON array string through', () => {
      expect(TypeConverter.convertToColumnType('[1,2,3]', 'JSONB')).toBe('[1,2,3]')
    })

    // Timestamp
    it('passes ISO string through for TIMESTAMPTZ', () => {
      expect(TypeConverter.convertToColumnType('2025-01-15T08:00:00Z', 'TIMESTAMPTZ'))
        .toBe('2025-01-15T08:00:00Z')
    })

    it('passes Date through for TIMESTAMP', () => {
      const date = new Date('2025-01-15T08:00:00Z')
      expect(TypeConverter.convertToColumnType(date, 'TIMESTAMP')).toBe(date)
    })

    // Text
    it('converts to string for TEXT', () => {
      expect(TypeConverter.convertToColumnType(42, 'TEXT')).toBe('42')
    })

    it('converts to string for VARCHAR', () => {
      expect(TypeConverter.convertToColumnType(true, 'VARCHAR(255)')).toBe('true')
    })
  })

  describe('toQueryParam', () => {
    it('returns null for null', () => {
      expect(TypeConverter.toQueryParam(null)).toBeNull()
    })

    it('converts Date to ISO string', () => {
      const date = new Date('2025-01-15T08:00:00Z')
      expect(TypeConverter.toQueryParam(date)).toBe('2025-01-15T08:00:00.000Z')
    })

    it('passes string through', () => {
      expect(TypeConverter.toQueryParam('hello')).toBe('hello')
    })

    it('passes number through', () => {
      expect(TypeConverter.toQueryParam(42)).toBe(42)
    })
  })
})
