import { describe, it, expect, beforeEach } from 'vitest'
import { ISAFeatureArgumentResolver } from '../../lib/specformula/helper/isa-feature-argument-resolver'
import { ScenarioContext } from '../../lib/specformula/context/scenario-context'

describe('ISAFeatureArgumentResolver', () => {
  let ctx: ScenarioContext
  let resolver: ISAFeatureArgumentResolver

  beforeEach(() => {
    ctx = new ScenarioContext()
    resolver = new ISAFeatureArgumentResolver(() => ctx)
  })

  // ========== TIME-System ==========

  describe('TIME-System', () => {
    describe('setNow / getNow', () => {
      it('returns system time when not set', () => {
        const now = resolver.getNow()
        expect(Math.abs(now.getTime() - Date.now())).toBeLessThan(1000)
      })

      it('sets and gets fixed time', () => {
        resolver.setNow('2025-11-04T08:00:00')
        const now = resolver.getNow()
        expect(now.getFullYear()).toBe(2025)
        expect(now.getMonth()).toBe(10) // 0-indexed
        expect(now.getDate()).toBe(4)
      })
    })

    describe('parseTimeExpression', () => {
      it('parses "now"', () => {
        resolver.setNow('2025-06-01T12:00:00')
        const result = resolver.parseTimeExpression('"now"')
        expect(result.toISOString()).toContain('2025-06-01')
      })

      it('parses ISO 8601 datetime', () => {
        const result = resolver.parseTimeExpression('"2025-11-04T08:00:00"')
        expect(result.getFullYear()).toBe(2025)
      })

      it('parses date-only string', () => {
        const result = resolver.parseTimeExpression('"2025-12-25"')
        expect(result.getFullYear()).toBe(2025)
        expect(result.getMonth()).toBe(11)
        expect(result.getDate()).toBe(25)
      })

      it('parses relative time: now-1d', () => {
        resolver.setNow('2025-06-15T12:00:00')
        const result = resolver.parseTimeExpression('now-1d')
        expect(result.getDate()).toBe(14)
      })

      it('parses relative time: now+2h', () => {
        resolver.setNow('2025-06-15T12:00:00')
        const result = resolver.parseTimeExpression('now+2h')
        expect(result.getHours()).toBe(14)
      })

      it('parses relative time: now-30m', () => {
        resolver.setNow('2025-06-15T12:00:00')
        const result = resolver.parseTimeExpression('now-30m')
        expect(result.getMinutes()).toBe(30)
      })

      it('parses relative time: now+1M (month)', () => {
        resolver.setNow('2025-06-15T12:00:00')
        const result = resolver.parseTimeExpression('now+1M')
        expect(result.getMonth()).toBe(6) // July
      })

      it('parses compound relative time: now-1d+2h', () => {
        resolver.setNow('2025-06-15T12:00:00')
        const result = resolver.parseTimeExpression('now-1d+2h')
        expect(result.getDate()).toBe(14)
        expect(result.getHours()).toBe(14)
      })

      it('throws on invalid time expression', () => {
        expect(() => resolver.parseTimeExpression('"not-a-date"')).toThrow('無法解析時間表達式')
      })
    })
  })

  // ========== VAR-System ==========

  describe('VAR-System', () => {
    describe('parseContextKeys', () => {
      it('extracts context keys from headers with > prefix', () => {
        const headers = ['>User.id', 'name', '>Project.id']
        const map = resolver.parseContextKeys(headers)
        expect(map.size).toBe(2)
        expect(map.get(0)).toBe('User.id')
        expect(map.get(2)).toBe('Project.id')
      })

      it('returns empty map for headers without > prefix', () => {
        const map = resolver.parseContextKeys(['id', 'name', 'email'])
        expect(map.size).toBe(0)
      })

      it('throws on empty context key name (bare >)', () => {
        expect(() => resolver.parseContextKeys(['>', 'name'])).toThrow('沒有提供變數名稱')
      })

      it('throws on reserved name "now"', () => {
        expect(() => resolver.parseContextKeys(['>now'])).toThrow('保留變數名稱')
      })
    })

    describe('extractAndStoreVariables', () => {
      it('extracts value from execution result and stores in context', () => {
        const contextKeyMap = new Map([[0, 'User.id']])
        const executionResult = { id: 'abc-123', name: 'Test User' }
        resolver.extractAndStoreVariables(['<id'], contextKeyMap, executionResult)
        expect(ctx.get('User.id')).toBe('abc-123')
      })

      it('extracts nested value from execution result', () => {
        const contextKeyMap = new Map([[0, 'User.profileAge']])
        const executionResult = { profile: { age: 25 } }
        resolver.extractAndStoreVariables(['<profile.age'], contextKeyMap, executionResult)
        expect(ctx.get('User.profileAge')).toBe(25)
      })

      it('throws when executionVariable is null but contextKeys exist', () => {
        const contextKeyMap = new Map([[0, 'User.id']])
        expect(() => resolver.extractAndStoreVariables(['<id'], contextKeyMap, null))
          .toThrow('executionVariable 為 null')
      })

      it('does nothing when no contextKeys and null executionVariable', () => {
        expect(() => resolver.extractAndStoreVariables([], new Map(), null)).not.toThrow()
      })

      it('throws when data row has no < prefix for contextKey', () => {
        const contextKeyMap = new Map([[0, 'User.id']])
        expect(() => resolver.extractAndStoreVariables(['plain-value'], contextKeyMap, { id: '1' }))
          .toThrow('不是 <executionKey 格式')
      })

      it('throws when < exists without corresponding > in header', () => {
        const contextKeyMap = new Map<number, string>() // no context keys
        expect(() => resolver.extractAndStoreVariables(['<id'], contextKeyMap, { id: '1' }))
          .toThrow('header 對應位置沒有定義 >contextKey')
      })

      it('throws when executionKey not found in result', () => {
        const contextKeyMap = new Map([[0, 'User.id']])
        const executionResult = { name: 'Test' } // no 'id' key
        expect(() => resolver.extractAndStoreVariables(['<id'], contextKeyMap, executionResult))
          .toThrow("找不到 execution key 'id'")
      })
    })

    describe('resolveVariable', () => {
      it('resolves $variable from context', () => {
        ctx.putObject('User.id', 'abc-123')
        expect(resolver.resolveVariable('$User.id')).toBe('abc-123')
      })

      it('resolves $now to current time', () => {
        resolver.setNow('2025-06-15T12:00:00')
        const result = resolver.resolveVariable('$now')
        expect(result).toBeInstanceOf(Date)
      })

      it('returns null for unresolved $variable (fail-closed)', () => {
        expect(resolver.resolveVariable('$NonExistent.id')).toBeNull()
      })

      it('resolves @time() expression', () => {
        const result = resolver.resolveVariable('@time("2025-01-01T00:00:00")')
        expect(result).toBeInstanceOf(Date)
        expect((result as Date).getFullYear()).toBe(2025)
      })

      it('resolves @date() expression', () => {
        const result = resolver.resolveVariable('@date("2025-12-16")')
        expect(result).toBe('2025-12-16')
      })

      it('resolves @localtime() expression', () => {
        const result = resolver.resolveVariable('@localtime("09:00:00")')
        expect(result).toBe('09:00:00')
      })

      it('resolves @localTime() (camelCase variant)', () => {
        const result = resolver.resolveVariable('@localTime("14:30:00")')
        expect(result).toBe('14:30:00')
      })

      it('strips quotes from quoted string', () => {
        expect(resolver.resolveVariable('"hello"')).toBe('hello')
        expect(resolver.resolveVariable("'world'")).toBe('world')
      })

      it('resolves plain string without prefix', () => {
        expect(resolver.resolveVariable('plain-text')).toBe('plain-text')
      })

      it('resolves string interpolation ${var}', () => {
        ctx.putObject('User.name', 'Alice')
        const result = resolver.resolveVariable('Hello ${User.name}!')
        expect(result).toBe('Hello Alice!')
      })

      it('preserves unresolved ${var} in interpolation', () => {
        const result = resolver.resolveVariable('Hello ${Unknown}!')
        expect(result).toBe('Hello ${Unknown}!')
      })

      it('resolves comma-separated variables', () => {
        ctx.putObject('A.id', '1')
        ctx.putObject('B.id', '2')
        const result = resolver.resolveVariable('$A.id,$B.id')
        expect(result).toBe('1,2')
      })

      it('returns empty/null as-is', () => {
        expect(resolver.resolveVariable('')).toBe('')
      })
    })
  })

  // ========== CAS: Constraint Assertion System ==========

  describe('CAS', () => {
    describe('evaluateConstraints', () => {
      // Numeric comparisons
      it('&eq passes on equal values', () => {
        expect(() => resolver.evaluateConstraints('&eq(5)', 5, 'field', 'entity')).not.toThrow()
      })

      it('&eq fails on unequal values', () => {
        expect(() => resolver.evaluateConstraints('&eq(5)', 3, 'field', 'entity')).toThrow('驗證失敗')
      })

      it('&ne passes on unequal values', () => {
        expect(() => resolver.evaluateConstraints('&ne(5)', 3, 'field', 'entity')).not.toThrow()
      })

      it('&ne fails on equal values', () => {
        expect(() => resolver.evaluateConstraints('&ne(5)', 5, 'field', 'entity')).toThrow('驗證失敗')
      })

      it('&gt passes when actual > expected', () => {
        expect(() => resolver.evaluateConstraints('&gt(5)', 10, 'f', 'e')).not.toThrow()
      })

      it('&gt fails when actual <= expected', () => {
        expect(() => resolver.evaluateConstraints('&gt(5)', 5, 'f', 'e')).toThrow('驗證失敗')
      })

      it('&lt passes when actual < expected', () => {
        expect(() => resolver.evaluateConstraints('&lt(10)', 5, 'f', 'e')).not.toThrow()
      })

      it('&ge passes when actual >= expected', () => {
        expect(() => resolver.evaluateConstraints('&ge(5)', 5, 'f', 'e')).not.toThrow()
      })

      it('&le passes when actual <= expected', () => {
        expect(() => resolver.evaluateConstraints('&le(10)', 10, 'f', 'e')).not.toThrow()
      })

      // Type checks
      it('&isNum passes for numbers', () => {
        expect(() => resolver.evaluateConstraints('&isNum', 42, 'f', 'e')).not.toThrow()
      })

      it('&isNum fails for strings', () => {
        expect(() => resolver.evaluateConstraints('&isNum', 'hello', 'f', 'e')).toThrow('驗證失敗')
      })

      it('&isStr passes for strings', () => {
        expect(() => resolver.evaluateConstraints('&isStr', 'hello', 'f', 'e')).not.toThrow()
      })

      it('&isBool passes for booleans', () => {
        expect(() => resolver.evaluateConstraints('&isBool', true, 'f', 'e')).not.toThrow()
      })

      it('&isNull passes for null', () => {
        expect(() => resolver.evaluateConstraints('&isNull', null, 'f', 'e')).not.toThrow()
      })

      it('&isNotNull passes for non-null', () => {
        expect(() => resolver.evaluateConstraints('&isNotNull', 'value', 'f', 'e')).not.toThrow()
      })

      it('&isNotNull fails for null', () => {
        expect(() => resolver.evaluateConstraints('&isNotNull', null, 'f', 'e')).toThrow('驗證失敗')
      })

      // String operations
      it('&contains passes on substring match', () => {
        expect(() => resolver.evaluateConstraints('&contains(hello)', 'say hello world', 'f', 'e')).not.toThrow()
      })

      it('&contains fails on no match', () => {
        expect(() => resolver.evaluateConstraints('&contains(xyz)', 'hello', 'f', 'e')).toThrow('驗證失敗')
      })

      it('&startsWith passes', () => {
        expect(() => resolver.evaluateConstraints('&startsWith(hello)', 'hello world', 'f', 'e')).not.toThrow()
      })

      it('&endsWith passes', () => {
        expect(() => resolver.evaluateConstraints('&endsWith(world)', 'hello world', 'f', 'e')).not.toThrow()
      })

      it('&matches passes with regex', () => {
        expect(() => resolver.evaluateConstraints('&matches(^[a-z]+$)', 'hello', 'f', 'e')).not.toThrow()
      })

      it('&matches fails with non-matching regex', () => {
        expect(() => resolver.evaluateConstraints('&matches(^[0-9]+$)', 'hello', 'f', 'e')).toThrow('驗證失敗')
      })

      it('&length passes within range', () => {
        expect(() => resolver.evaluateConstraints('&length(3,10)', 'hello', 'f', 'e')).not.toThrow()
      })

      it('&length fails outside range', () => {
        expect(() => resolver.evaluateConstraints('&length(10,20)', 'hi', 'f', 'e')).toThrow('驗證失敗')
      })

      // Collection operations
      it('&size passes for correct array size', () => {
        expect(() => resolver.evaluateConstraints('&size(3)', [1, 2, 3], 'f', 'e')).not.toThrow()
      })

      it('&size works with JSON string array', () => {
        expect(() => resolver.evaluateConstraints('&size(2)', '[1,2]', 'f', 'e')).not.toThrow()
      })

      it('&isEmpty passes for empty array', () => {
        expect(() => resolver.evaluateConstraints('&isEmpty', [], 'f', 'e')).not.toThrow()
      })

      it('&isNotEmpty passes for non-empty array', () => {
        expect(() => resolver.evaluateConstraints('&isNotEmpty', [1], 'f', 'e')).not.toThrow()
      })

      it('&hasItem passes when item found in string array', () => {
        expect(() => resolver.evaluateConstraints('&hasItem(b)', ['a', 'b', 'c'], 'f', 'e')).not.toThrow()
      })

      it('&hasItem passes for JSON string array', () => {
        expect(() => resolver.evaluateConstraints('&hasItem(b)', '["a","b","c"]', 'f', 'e')).not.toThrow()
      })

      it('&hasNoItem passes when item not found', () => {
        expect(() => resolver.evaluateConstraints('&hasNoItem(z)', ['a', 'b', 'c'], 'f', 'e')).not.toThrow()
      })

      // Existence & Field checks
      it('&exists passes for non-null', () => {
        expect(() => resolver.evaluateConstraints('&exists', 42, 'f', 'e')).not.toThrow()
      })

      it('&notExists passes for null', () => {
        expect(() => resolver.evaluateConstraints('&notExists', null, 'f', 'e')).not.toThrow()
      })

      it('&hasField passes when field exists', () => {
        expect(() => resolver.evaluateConstraints('&hasField(name)', { name: 'Alice' }, 'f', 'e')).not.toThrow()
      })

      it('&noField passes when field missing', () => {
        expect(() => resolver.evaluateConstraints('&noField(age)', { name: 'Alice' }, 'f', 'e')).not.toThrow()
      })

      // Range
      it('&between passes for value in range', () => {
        expect(() => resolver.evaluateConstraints('&between(1,10)', 5, 'f', 'e')).not.toThrow()
      })

      it('&between passes at boundaries', () => {
        expect(() => resolver.evaluateConstraints('&between(1,10)', 1, 'f', 'e')).not.toThrow()
        expect(() => resolver.evaluateConstraints('&between(1,10)', 10, 'f', 'e')).not.toThrow()
      })

      it('&between fails outside range', () => {
        expect(() => resolver.evaluateConstraints('&between(1,10)', 11, 'f', 'e')).toThrow('驗證失敗')
      })

      it('&oneOf passes for matching value', () => {
        expect(() => resolver.evaluateConstraints('&oneOf(active,inactive,pending)', 'active', 'f', 'e')).not.toThrow()
      })

      it('&oneOf fails for non-matching value', () => {
        expect(() => resolver.evaluateConstraints('&oneOf(active,inactive)', 'deleted', 'f', 'e')).toThrow('驗證失敗')
      })

      // Multiple constraints
      it('evaluates multiple constraints (AND logic)', () => {
        expect(() => resolver.evaluateConstraints('&gt(0) &lt(100)', 50, 'f', 'e')).not.toThrow()
      })

      it('fails if any constraint fails', () => {
        expect(() => resolver.evaluateConstraints('&gt(0) &lt(100)', 200, 'f', 'e')).toThrow('驗證失敗')
      })

      // Unknown constraint
      it('throws on unknown constraint', () => {
        expect(() => resolver.evaluateConstraints('&unknownThing', 5, 'f', 'e')).toThrow('未知的約束條件')
      })

      // Empty constraint string
      it('returns true for empty constraint string', () => {
        expect(resolver.evaluateConstraints('', 5)).toBe(true)
      })
    })

    describe('Time constraints', () => {
      it('&before passes when actual is before expected', () => {
        expect(() => resolver.evaluateConstraints(
          '&before(2025-12-31T23:59:59)',
          new Date('2025-01-01T00:00:00'),
          'f', 'e'
        )).not.toThrow()
      })

      it('&after passes when actual is after expected', () => {
        expect(() => resolver.evaluateConstraints(
          '&after(2025-01-01T00:00:00)',
          new Date('2025-12-31T23:59:59'),
          'f', 'e'
        )).not.toThrow()
      })

      it('&sameDay passes for same date', () => {
        expect(() => resolver.evaluateConstraints(
          '&sameDay(2025-06-15)',
          new Date('2025-06-15T14:30:00'),
          'f', 'e'
        )).not.toThrow()
      })

      it('&sameDay fails for different date', () => {
        expect(() => resolver.evaluateConstraints(
          '&sameDay(2025-06-15)',
          new Date('2025-06-16T12:00:00Z'),
          'f', 'e'
        )).toThrow('驗證失敗')
      })
    })
  })

  // ========== Value comparison ==========

  describe('valuesEqual', () => {
    it('null == null', () => {
      expect(resolver.valuesEqual(null, null)).toBe(true)
    })

    it('null != non-null', () => {
      expect(resolver.valuesEqual(null, 'value')).toBe(false)
    })

    it('non-null != null', () => {
      expect(resolver.valuesEqual('value', null)).toBe(false)
    })

    it('string == string', () => {
      expect(resolver.valuesEqual('hello', 'hello')).toBe(true)
    })

    it('string != string', () => {
      expect(resolver.valuesEqual('hello', 'world')).toBe(false)
    })

    it('number == number (same type)', () => {
      expect(resolver.valuesEqual(42, 42)).toBe(true)
    })

    it('string number == number (cross-type)', () => {
      expect(resolver.valuesEqual('42', 42)).toBe(true)
    })

    it('Date == Date (same time)', () => {
      const d1 = new Date('2025-01-01T00:00:00Z')
      const d2 = new Date('2025-01-01T00:00:00Z')
      expect(resolver.valuesEqual(d1, d2)).toBe(true)
    })

    it('Date == Date (within 1 second)', () => {
      const d1 = new Date('2025-01-01T00:00:00.000Z')
      const d2 = new Date('2025-01-01T00:00:00.500Z')
      expect(resolver.valuesEqual(d1, d2)).toBe(true)
    })

    it('string ISO date == Date', () => {
      expect(resolver.valuesEqual('2025-01-01T00:00:00Z', new Date('2025-01-01T00:00:00Z'))).toBe(true)
    })

    it('boolean vs "0"/"1"', () => {
      expect(resolver.valuesEqual('1', true)).toBe(true)
      expect(resolver.valuesEqual('0', false)).toBe(true)
    })

    it('resolves $variable in expected', () => {
      ctx.putObject('TestUser.id', 'abc-123')
      expect(resolver.valuesEqual('$TestUser.id', 'abc-123')).toBe(true)
    })
  })

  // ========== resolveAndValidate ==========

  describe('resolveAndValidate', () => {
    it('validates $notnull passes for non-null', () => {
      expect(resolver.resolveAndValidate('$notnull', 'value', 'field', 'entity')).toBeNull()
    })

    it('validates $notnull fails for null', () => {
      expect(() => resolver.resolveAndValidate('$notnull', null, 'field', 'entity'))
        .toThrow('應該不為空')
    })

    it('evaluates CAS constraint', () => {
      expect(resolver.resolveAndValidate('&gt(5)', 10, 'count', 'entity')).toBeNull()
    })

    it('returns resolved value for plain comparison', () => {
      const result = resolver.resolveAndValidate('hello', 'world', 'name', 'entity')
      expect(result).toBe('hello')
    })

    it('resolves $variable for comparison', () => {
      ctx.putObject('Expected.name', 'Alice')
      const result = resolver.resolveAndValidate('$Expected.name', 'Alice', 'name', 'entity')
      expect(result).toBe('Alice')
    })
  })

  // ========== Column prefix parsing ==========

  describe('parseColumnPrefix', () => {
    it('parses P: prefix (path parameter)', () => {
      const info = resolver.parseColumnPrefix('P:userId')
      expect(info.prefix).toBe('P')
      expect(info.name).toBe('userId')
    })

    it('parses Q: prefix (query parameter)', () => {
      const info = resolver.parseColumnPrefix('Q:page')
      expect(info.prefix).toBe('Q')
      expect(info.name).toBe('page')
    })

    it('parses H: prefix (header)', () => {
      const info = resolver.parseColumnPrefix('H:Authorization')
      expect(info.prefix).toBe('H')
      expect(info.name).toBe('Authorization')
    })

    it('returns empty prefix for plain column', () => {
      const info = resolver.parseColumnPrefix('content')
      expect(info.prefix).toBe('')
      expect(info.name).toBe('content')
    })

    it('handles empty string', () => {
      const info = resolver.parseColumnPrefix('')
      expect(info.prefix).toBe('')
      expect(info.name).toBe('')
    })

    it('ignores unknown prefix', () => {
      const info = resolver.parseColumnPrefix('X:unknown')
      expect(info.prefix).toBe('')
      expect(info.name).toBe('X:unknown')
    })
  })
})
