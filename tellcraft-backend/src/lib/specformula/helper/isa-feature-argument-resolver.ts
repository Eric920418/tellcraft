import { ScenarioContext } from '../context/scenario-context';
import { tokenize } from './path-tokenizer';

interface Constraint {
  name: string;
  params: string | null;
}

export interface ColumnInfo {
  prefix: string; // 'P' | 'Q' | 'H' | ''
  name: string;
}

/**
 * ISA Feature Argument Resolver
 *
 * Three integrated systems:
 * 1. VAR-System: >contextKey (store), <executionKey (extract), $variable (reference)
 * 2. CAS (Constraint Assertion System): &constraint(params)
 * 3. TIME-System: @time(...), @date(...), @localtime(...)
 */
export class ISAFeatureArgumentResolver {
  private readonly contextSupplier: () => ScenarioContext;

  constructor(contextSupplier: () => ScenarioContext) {
    this.contextSupplier = contextSupplier;
  }

  private getContext(): ScenarioContext {
    return this.contextSupplier();
  }

  // ========== TIME-System ==========

  setNow(timeString: string): void {
    const dt = this.parseTimeExpression(timeString);
    this.getContext().putObject('now', dt);
  }

  getNow(): Date {
    const now = this.getContext().get('now');
    if (now instanceof Date) return now;
    return new Date();
  }

  // ========== VAR-System: Context Key Parsing ==========

  parseContextKeys(headers: string[]): Map<number, string> {
    const contextKeyMap = new Map<number, string>();
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (header && header.startsWith('>')) {
        const contextKey = header.substring(1);
        if (!contextKey) {
          throw new Error(
            `VAR-System 錯誤：header 欄位 ${i} 使用了 > 符號但沒有提供變數名稱。>contextKey 必須有名稱，例如 >agentId。`
          );
        }
        if (contextKey === 'now') {
          throw new Error("'now' 是保留變數名稱，不可作為 context key 使用");
        }
        contextKeyMap.set(i, contextKey);
      }
    }
    return contextKeyMap;
  }

  extractAndStoreVariables(
    row: string[],
    contextKeyMap: Map<number, string>,
    executionVariable: unknown
  ): void {
    if (executionVariable === null || executionVariable === undefined) {
      if (contextKeyMap.size > 0) {
        throw new Error('VAR-System 錯誤：executionVariable 為 null，但有 contextKey 需要提取。');
      }
      return;
    }

    // Validate: each >contextKey must have corresponding <executionKey
    for (const [columnIndex, contextKey] of contextKeyMap) {
      if (columnIndex < row.length) {
        const dataValue = row[columnIndex];
        if (!dataValue || !dataValue.startsWith('<')) {
          throw new Error(
            `VAR-System 錯誤：header 欄位 ${columnIndex} 定義了 >${contextKey}，但 data row 對應位置不是 <executionKey 格式（實際值：${dataValue}）。`
          );
        }
        const executionKeyName = dataValue.substring(1);
        if (!executionKeyName) {
          throw new Error(
            `VAR-System 錯誤：data row 欄位 ${columnIndex} 使用了 < 符號但沒有提供變數名稱。`
          );
        }
      }
    }

    // Validate: each <executionKey must have corresponding >contextKey
    for (let i = 0; i < row.length; i++) {
      const dataValue = row[i];
      if (dataValue && dataValue.startsWith('<')) {
        const executionKeyName = dataValue.substring(1);
        if (!executionKeyName) {
          throw new Error(
            `VAR-System 錯誤：data row 欄位 ${i} 使用了 < 符號但沒有提供變數名稱。`
          );
        }
        if (!contextKeyMap.has(i)) {
          throw new Error(
            `VAR-System 錯誤：data row 欄位 ${i} 使用了 <executionKey（<${executionKeyName}），但 header 對應位置沒有定義 >contextKey。`
          );
        }
      }
    }

    const executionMap = this.toMap(executionVariable);

    for (const [columnIndex, contextKey] of contextKeyMap) {
      if (columnIndex < row.length) {
        const executionKey = row[columnIndex];
        if (executionKey && executionKey.startsWith('<')) {
          const originalExecKeyName = executionKey.substring(1);
          let executionKeyName = originalExecKeyName;
          if (!this.containsNestedKey(executionMap, executionKeyName)) {
            // Fallback: LLM 常用 <userId / <testUserId 等，但 RETURNING * 的 column 是 id
            // 嘗試常見映射：xxxId → id, xxxUserId → user_id, xxx_id → id
            const fallbackKey = this.findFallbackKey(executionKeyName, executionMap);
            if (fallbackKey) {
              executionKeyName = fallbackKey;
            } else {
              // 找不到 execution key → 存 null（不 throw，讓後續步驟自然失敗並提供更明確的錯誤）
              executionKeyName = originalExecKeyName;
            }
          }
          const value = this.getNestedValue(executionMap, executionKeyName);
          this.getContext().putObject(contextKey, value);
          // 同時將值存在原始 executionKey 名稱下作為直接別名
          // 這樣 >lists.id + <listId 存了 "lists.id" → uuid 也存了 "listId" → uuid
          // $listId 可以透過精確匹配 "listId" 直接找到
          if (originalExecKeyName && originalExecKeyName !== contextKey) {
            this.getContext().putObject(originalExecKeyName, value);
          }
        }
      }
    }
  }

  // ========== Execution Key Fallback ==========

  /**
   * LLM 生成的 Feature 常用 <userId / <testUserId / <newUserId 等 execution key，
   * 但 RETURNING * 的 column name 是 id（DB column name）。
   * 嘗試常見映射找到正確的 key。
   */
  private findFallbackKey(executionKeyName: string, executionMap: Record<string, unknown>): string | null {
    // 直接找到 → 不需要 fallback
    if (this.containsNestedKey(executionMap, executionKeyName)) return executionKeyName;

    // dot notation: <User.id / <UnverifiedUser.id → 取最後一段 "id"
    if (executionKeyName.includes('.')) {
      const lastSegment = executionKeyName.split('.').pop()!;
      if (this.containsNestedKey(executionMap, lastSegment)) return lastSegment;
      // 也嘗試 camelCase → snake_case: lastSegment "userId" → "user_id"
      const lastSnake = lastSegment.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
      if (lastSnake !== lastSegment && this.containsNestedKey(executionMap, lastSnake)) return lastSnake;
    }

    // 常見模式：<userId, <newUserId, <testUserId, <createdUserId → 嘗試 "id"
    if (/(?:user)?id$/i.test(executionKeyName) && this.containsNestedKey(executionMap, 'id')) {
      return 'id';
    }

    // 通用模式：<xxxId → 嘗試去掉前綴取 "id"
    if (/Id$/.test(executionKeyName) && this.containsNestedKey(executionMap, 'id')) {
      return 'id';
    }

    // camelCase → snake_case：<userId → user_id
    const snakeCase = executionKeyName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    if (snakeCase !== executionKeyName && this.containsNestedKey(executionMap, snakeCase)) {
      return snakeCase;
    }

    // snake_case 中取最後的部分：<new_user_id → user_id → id
    const parts = snakeCase.split('_');
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1]; // "id"
      if (this.containsNestedKey(executionMap, lastPart)) return lastPart;
      const lastTwo = parts.slice(-2).join('_'); // "user_id"
      if (this.containsNestedKey(executionMap, lastTwo)) return lastTwo;
    }

    return null;
  }

  // ========== Nested path access ==========

  /**
   * 從任意根物件中取得巢狀路徑的值。
   * 支援 PathTokenizer（ADR-0019 bracket escape + 陣列索引 + dot notation）。
   * 從 Java reference implementation 忠實移植。
   */
  private getNestedValue(map: Record<string, unknown>, path: string): unknown {
    return this.getNestedValueFromObject(map, path);
  }

  getNestedValueFromObject(root: unknown, path: string): unknown {
    if (root === null || root === undefined || !path) return null;

    // Fast path: simple key without nesting
    if (typeof root === 'object' && !Array.isArray(root) && !path.includes('.') && !path.includes('[')) {
      return (root as Record<string, unknown>)[path] ?? null;
    }

    const keys = tokenize(path);
    let current: unknown = root;

    for (const key of keys) {
      if (current === null || current === undefined) return null;

      if (key.includes('[')) {
        const bracketStart = key.indexOf('[');
        const bracketEnd = key.indexOf(']');
        const baseKey = key.substring(0, bracketStart);
        const index = parseInt(key.substring(bracketStart + 1, bracketEnd), 10);

        // top-level array: baseKey 為空，current 已是 Array
        if (baseKey) {
          if (typeof current === 'object' && !Array.isArray(current)) {
            current = (current as Record<string, unknown>)[baseKey];
          } else {
            return null;
          }
        }

        if (Array.isArray(current)) {
          if (index >= 0 && index < current.length) {
            current = current[index];
          } else {
            return null;
          }
        } else {
          return null;
        }
      } else {
        if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
          current = (current as Record<string, unknown>)[key];
          if (current === undefined) return null;
        } else {
          return null;
        }
      }
    }

    return current ?? null;
  }

  /**
   * 檢查任意根物件中是否存在巢狀路徑。
   * 支援 PathTokenizer（ADR-0019 bracket escape + 陣列索引 + dot notation）。
   */
  containsNestedKey(map: Record<string, unknown>, path: string): boolean {
    return this.containsNestedKeyFromObject(map, path);
  }

  private containsNestedKeyFromObject(root: unknown, path: string): boolean {
    if (root === null || root === undefined || !path) return false;

    // Fast path
    if (typeof root === 'object' && !Array.isArray(root) && !path.includes('.') && !path.includes('[')) {
      return path in (root as Record<string, unknown>);
    }

    const keys = tokenize(path);
    let current: unknown = root;

    for (const key of keys) {
      if (current === null || current === undefined) return false;

      if (key.includes('[')) {
        const bracketStart = key.indexOf('[');
        const bracketEnd = key.indexOf(']');
        const baseKey = key.substring(0, bracketStart);
        const index = parseInt(key.substring(bracketStart + 1, bracketEnd), 10);

        if (baseKey) {
          if (typeof current === 'object' && !Array.isArray(current)) {
            if (!(baseKey in (current as Record<string, unknown>))) return false;
            current = (current as Record<string, unknown>)[baseKey];
          } else {
            return false;
          }
        }

        if (Array.isArray(current)) {
          if (index < 0 || index >= current.length) return false;
          current = current[index];
        } else {
          return false;
        }
      } else {
        if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
          if (!(key in (current as Record<string, unknown>))) return false;
          current = (current as Record<string, unknown>)[key];
        } else {
          return false;
        }
      }
    }
    return true;
  }

  private toMap(obj: unknown): Record<string, unknown> {
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      return obj as Record<string, unknown>;
    }
    return { value: obj };
  }

  // ========== VAR-System: Variable Resolution ==========

  resolveVariable(value: string): unknown {
    return this.resolveValue(value);
  }

  resolveAndValidate(
    expectedValue: string,
    actualValue: unknown,
    fieldName: string,
    entityName: string
  ): unknown {
    const resolved = this.resolveVariable(expectedValue);
    const resolvedStr = resolved != null ? String(resolved) : '';

    // CAS constraints
    if (resolvedStr.includes('&')) {
      this.evaluateConstraints(resolvedStr, actualValue, fieldName, entityName);
      return null;
    }

    // $notnull / <non-empty> special check
    if (resolvedStr === '$notnull' || resolvedStr === '<non-empty>' || resolvedStr === '<notempty>') {
      if (actualValue === null || actualValue === undefined || actualValue === '') {
        throw new Error(`${entityName}.${fieldName} 應該不為空，但實際值為 ${String(actualValue)}`);
      }
      return null;
    }

    // Number vs Date comparison
    if (typeof resolved === 'number' && actualValue instanceof Date) {
      const expectedDate = new Date(resolved);
      if (Math.abs(expectedDate.getTime() - actualValue.getTime()) > 1000) {
        throw new Error(
          `${entityName}.${fieldName} 時間不匹配。\n  預期: ${expectedDate.toISOString()} (timestamp: ${resolved})\n  實際: ${actualValue.toISOString()}`
        );
      }
      return null;
    }

    // Number vs Number
    if (typeof resolved === 'number' && typeof actualValue === 'number') {
      if (resolved !== actualValue) {
        throw new Error(
          `${entityName}.${fieldName} 數值不匹配。\n  預期: ${resolved}\n  實際: ${actualValue}`
        );
      }
      return null;
    }

    return resolved;
  }

  private resolveValue(value: string | null): unknown {
    if (value === null || value === undefined || value === '') return value;

    const trimmed = value.trim();

    // @time() expression
    if (trimmed.startsWith('@time(') && trimmed.endsWith(')')) {
      return this.parseTimeExpression(trimmed.substring(6, trimmed.length - 1));
    }

    // @date() expression
    if (trimmed.startsWith('@date(') && trimmed.endsWith(')')) {
      return this.parseDateExpression(trimmed.substring(6, trimmed.length - 1));
    }

    // @localtime() expression
    if ((trimmed.startsWith('@localtime(') || trimmed.startsWith('@localTime(')) && trimmed.endsWith(')')) {
      const start = trimmed.indexOf('(') + 1;
      return trimmed.substring(start, trimmed.length - 1).replace(/^"|"$/g, '');
    }

    // Quoted string - strip quotes
    let unquoted = trimmed;
    let isQuoted = false;
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      unquoted = trimmed.substring(1, trimmed.length - 1);
      isQuoted = true;
    }

    // <executionKey — 從 context 查找（LLM 常在 entity_validate 中用 <id> 代替 $id）
    if (!isQuoted && unquoted.startsWith('<')) {
      const keyName = unquoted.substring(1);
      if (keyName) {
        const resolved = this.getContext().get(keyName);
        if (resolved !== null && resolved !== undefined) return resolved;
      }
      return null; // fail-closed：未找到的 <key 返回 null，避免字面字串造成 SQL type error
    }

    // String interpolation: ${variable}
    if (!isQuoted && unquoted.includes('${')) {
      return this.interpolateString(unquoted);
    }

    // Comma-separated with $variables
    if (!isQuoted && unquoted.includes(',') && unquoted.includes('$')) {
      const parts = unquoted.split(',');
      return parts.map(part => {
        const resolvedPart = this.resolveSingleVariable(part.trim());
        return resolvedPart != null ? String(resolvedPart) : part.trim();
      }).join(',');
    }

    // Single $variable
    if (!isQuoted && unquoted.startsWith('$')) {
      return this.resolveSingleVariable(unquoted);
    }

    return unquoted;
  }

  private resolveSingleVariable(value: string): unknown {
    if (!value || !value.startsWith('$')) return value;
    const varName = value.substring(1);
    // 保留特殊值
    if (varName === 'notnull' || varName === 'Notnull') return value;
    const resolved = this.getContext().get(varName);
    if (resolved !== null && resolved !== undefined) return resolved;
    if (varName === 'now') return this.getNow();
    // fail-closed：未解析的 $variable 返回 null（不返回字面字串，避免 SQL type error）
    return null;
  }

  private interpolateString(str: string): string {
    if (!str || !str.includes('${')) return str;

    let result = '';
    let i = 0;
    while (i < str.length) {
      const startIndex = str.indexOf('${', i);
      if (startIndex === -1) {
        result += str.substring(i);
        break;
      }
      result += str.substring(i, startIndex);
      const endIndex = str.indexOf('}', startIndex + 2);
      if (endIndex === -1) {
        result += str.substring(startIndex);
        break;
      }
      const varName = str.substring(startIndex + 2, endIndex);
      if (!varName) {
        result += '${}';
      } else {
        const varValue = this.getContext().get(varName);
        result += varValue != null ? String(varValue) : `\${${varName}}`;
      }
      i = endIndex + 1;
    }
    return result;
  }

  // ========== TIME-System: Parsing ==========

  parseTimeExpression(expr: string): Date {
    const cleaned = expr.replace(/^"|"$/g, '').trim();
    // 支持空格分隔的日期時間（LLM 常見格式）：2025-06-15 12:00:00 → 2025-06-15T12:00:00
    const normalized = cleaned.replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/, '$1T$2');

    if (normalized === 'now') return this.getNow();
    if (normalized.startsWith('now')) return this.parseRelativeTime(normalized);

    try {
      if (normalized.includes('T')) {
        return new Date(normalized);
      }
      // Date only → start of day
      const d = new Date(normalized + 'T00:00:00');
      if (isNaN(d.getTime())) throw new Error();
      return d;
    } catch {
      return new Date(); // 無法解析 → fallback 到當前時間（不 throw）
    }
  }

  private parseDateExpression(expr: string): string {
    const cleaned = expr.replace(/^"|"$/g, '').trim().replace(/\//g, '-');
    if (cleaned === 'now') {
      return this.getNow().toISOString().split('T')[0];
    }
    // Return as ISO date string for pg
    const d = new Date(cleaned + 'T00:00:00');
    if (isNaN(d.getTime())) {
      return new Date().toISOString().split('T')[0]; // 無法解析 → fallback 到今天
    }
    return cleaned;
  }

  private parseRelativeTime(expr: string): Date {
    const now = this.getNow();
    if (expr === 'now') return now;

    const pattern = expr.substring(3); // strip 'now'
    const result = new Date(now);

    // Months: +1M, -2M
    const monthRegex = /([+-]?\d+)M/g;
    let m;
    while ((m = monthRegex.exec(pattern)) !== null) {
      result.setMonth(result.getMonth() + parseInt(m[1], 10));
    }

    // Days: +1d, -2d
    const dayRegex = /([+-]?\d+)d/g;
    while ((m = dayRegex.exec(pattern)) !== null) {
      result.setDate(result.getDate() + parseInt(m[1], 10));
    }

    // Hours: +1h, -2h
    const hourRegex = /([+-]?\d+)h/g;
    while ((m = hourRegex.exec(pattern)) !== null) {
      result.setHours(result.getHours() + parseInt(m[1], 10));
    }

    // Minutes: +1m, -2m (not followed by another letter that isn't M-related)
    const minuteRegex = /([+-]?\d+)m(?!M)/g;
    while ((m = minuteRegex.exec(pattern)) !== null) {
      result.setMinutes(result.getMinutes() + parseInt(m[1], 10));
    }

    // Seconds: +1s, -2s
    const secondRegex = /([+-]?\d+)s/g;
    while ((m = secondRegex.exec(pattern)) !== null) {
      result.setSeconds(result.getSeconds() + parseInt(m[1], 10));
    }

    return result;
  }

  // ========== CAS: Constraint Assertion System ==========

  evaluateConstraints(
    constraintString: string,
    actualValue: unknown,
    fieldName?: string | null,
    entityName?: string | null
  ): boolean {
    if (!constraintString || !constraintString.trim()) return true;

    const constraints = this.parseConstraints(constraintString);
    for (const constraint of constraints) {
      if (!this.evaluateConstraint(constraint, actualValue)) {
        const constraintDesc = constraint.params != null
          ? `&${constraint.name}(${constraint.params})`
          : `&${constraint.name}`;
        const jsonPath = entityName && fieldName ? `${entityName}.${fieldName}` : '未知欄位';
        throw new Error(
          `JSON Path '${jsonPath}' 的約束條件 '${constraintDesc}' 驗證失敗。\n  預期: ${constraintDesc}\n  實際: ${actualValue}`
        );
      }
    }
    return true;
  }

  private parseConstraints(constraintString: string): Constraint[] {
    const constraints: Constraint[] = [];
    let i = 0;
    while (i < constraintString.length) {
      const ampIndex = constraintString.indexOf('&', i);
      if (ampIndex === -1) break;

      let nameEnd = ampIndex + 1;
      while (nameEnd < constraintString.length &&
             /[\w]/.test(constraintString[nameEnd])) {
        nameEnd++;
      }

      const name = constraintString.substring(ampIndex + 1, nameEnd);
      let params: string | null = null;

      if (nameEnd < constraintString.length && constraintString[nameEnd] === '(') {
        const closeParen = this.findMatchingCloseParen(constraintString, nameEnd);
        if (closeParen !== -1) {
          params = constraintString.substring(nameEnd + 1, closeParen);
          i = closeParen + 1;
        } else {
          i = nameEnd + 1;
        }
      } else {
        i = nameEnd;
      }

      constraints.push({ name, params });

      while (i < constraintString.length && constraintString[i] === ' ') i++;
    }
    return constraints;
  }

  private findMatchingCloseParen(str: string, openParenIndex: number): number {
    if (openParenIndex >= str.length || str[openParenIndex] !== '(') return -1;
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = openParenIndex; i < str.length; i++) {
      const c = str[i];
      if ((c === '"' || c === "'") && (i === 0 || str[i - 1] !== '\\')) {
        if (!inString) {
          inString = true;
          stringChar = c;
        } else if (c === stringChar) {
          inString = false;
        }
      }
      if (!inString) {
        if (c === '(') depth++;
        else if (c === ')') {
          depth--;
          if (depth === 0) return i;
        }
      }
    }
    return -1;
  }

  private evaluateConstraint(constraint: Constraint, actualValue: unknown): boolean {
    const { name, params } = constraint;

    switch (name) {
      // Numeric comparisons
      case 'eq': return this.evaluateEq(actualValue, params);
      case 'ne': return !this.evaluateEq(actualValue, params);
      case 'gt': return this.toDouble(actualValue) > this.toDouble(this.resolveValue(params));
      case 'lt': return this.toDouble(actualValue) < this.toDouble(this.resolveValue(params));
      case 'ge': return this.toDouble(actualValue) >= this.toDouble(this.resolveValue(params));
      case 'le': return this.toDouble(actualValue) <= this.toDouble(this.resolveValue(params));

      // Type checks
      case 'isNum': return typeof actualValue === 'number';
      case 'isStr': return typeof actualValue === 'string';
      case 'isBool': return typeof actualValue === 'boolean';
      case 'isNull': case 'isUndef': return actualValue === null || actualValue === undefined;
      case 'isNotNull': case 'isDef': return actualValue !== null && actualValue !== undefined;

      // String operations
      case 'contains': return typeof actualValue === 'string' && actualValue.includes(this.resolveStr(params));
      case 'startsWith': return typeof actualValue === 'string' && actualValue.startsWith(this.resolveStr(params));
      case 'endsWith': return typeof actualValue === 'string' && actualValue.endsWith(this.resolveStr(params));
      case 'matches': {
        try { return typeof actualValue === 'string' && new RegExp(this.resolveStr(params)).test(actualValue); }
        catch { return false; } // invalid regex → treat as no match
      }
      case 'length': {
        if (typeof actualValue !== 'string') return false;
        const [min, max] = params!.split(',').map(s => parseInt(s.trim(), 10));
        return actualValue.length >= min && actualValue.length <= max;
      }

      // Collection operations
      case 'hasItem': return this.evaluateHasItem(actualValue, params);
      case 'hasNoItem': return !this.evaluateHasItem(actualValue, params);
      case 'size': return this.evaluateSize(actualValue, params);
      case 'isEmpty': return this.evaluateIsEmpty(actualValue);
      case 'isNotEmpty': return !this.evaluateIsEmpty(actualValue);

      // Existence
      case 'exists': return actualValue !== null && actualValue !== undefined;
      case 'notExists': return actualValue === null || actualValue === undefined;
      case 'hasField': return this.evaluateHasField(actualValue, params);
      case 'noField': return !this.evaluateHasField(actualValue, params);

      // Range
      case 'between': return this.evaluateBetween(actualValue, params);
      case 'notBetween': return !this.evaluateBetween(actualValue, params);
      case 'oneOf': return this.evaluateOneOf(actualValue, params);
      case 'noneOf': return !this.evaluateOneOf(actualValue, params);

      // Time constraints
      case 'before': return this.evaluateBefore(actualValue, params);
      case 'after': return this.evaluateAfter(actualValue, params);
      case 'sameDay': return this.evaluateSameDay(actualValue, params);
      case 'sameTime': return this.evaluateSameTime(actualValue, params);
      case 'withinDays': return this.evaluateWithinDays(actualValue, params);

      default:
        return true; // 未知約束條件 → 跳過（不阻塞驗證）
    }
  }

  // ========== CAS Evaluators ==========

  private evaluateEq(actual: unknown, params: string | null): boolean {
    const expected = this.resolveValue(params);
    return actual === expected || String(actual) === String(expected);
  }

  private evaluateHasItem(actual: unknown, params: string | null): boolean {
    if (actual === null || actual === undefined) return false;
    const item = this.resolveValue(params);
    if (Array.isArray(actual)) return actual.includes(item);
    if (typeof actual === 'string') {
      try {
        const arr = JSON.parse(actual);
        if (Array.isArray(arr)) return arr.includes(item);
      } catch { /* ignore */ }
    }
    return false;
  }

  private evaluateSize(actual: unknown, params: string | null): boolean {
    if (actual === null || actual === undefined) return false;
    const expectedSize = parseInt(this.resolveStr(params), 10);
    if (Array.isArray(actual)) return actual.length === expectedSize;
    if (typeof actual === 'string') {
      try {
        const arr = JSON.parse(actual);
        if (Array.isArray(arr)) return arr.length === expectedSize;
      } catch { /* ignore */ }
      return actual.length === expectedSize;
    }
    return false;
  }

  private evaluateIsEmpty(actual: unknown): boolean {
    if (actual === null || actual === undefined) return true;
    if (Array.isArray(actual)) return actual.length === 0;
    if (typeof actual === 'string') {
      try {
        const arr = JSON.parse(actual);
        if (Array.isArray(arr)) return arr.length === 0;
      } catch { /* ignore */ }
      return actual === '';
    }
    return false;
  }

  private evaluateHasField(actual: unknown, params: string | null): boolean {
    if (actual === null || actual === undefined || typeof actual !== 'object') return false;
    return this.resolveStr(params) in (actual as Record<string, unknown>);
  }

  private evaluateBetween(actual: unknown, params: string | null): boolean {
    const parts = params!.split(',');
    if (parts.length !== 2) return false; // 參數格式不正確 → 視為不匹配
    const val = this.toDouble(actual);
    const min = this.toDouble(this.resolveValue(parts[0].trim()));
    const max = this.toDouble(this.resolveValue(parts[1].trim()));
    return val >= min && val <= max;
  }

  private evaluateOneOf(actual: unknown, params: string | null): boolean {
    const parts = params!.split(',');
    for (const part of parts) {
      const expected = this.resolveValue(part.trim());
      if (actual === expected || String(actual) === String(expected)) return true;
    }
    return false;
  }

  private evaluateBefore(actual: unknown, params: string | null): boolean {
    const actualDt = this.toDate(actual);
    const expectedDt = this.toDate(this.resolveValue(params));
    return actualDt !== null && expectedDt !== null && actualDt < expectedDt;
  }

  private evaluateAfter(actual: unknown, params: string | null): boolean {
    const actualDt = this.toDate(actual);
    const expectedDt = this.toDate(this.resolveValue(params));
    return actualDt !== null && expectedDt !== null && actualDt > expectedDt;
  }

  private evaluateSameDay(actual: unknown, params: string | null): boolean {
    const actualDt = this.toDate(actual);
    if (!actualDt) return false;
    const expectedStr = this.resolveStr(params);
    let expectedDate: Date;
    if (expectedStr.toLowerCase() === 'today') {
      expectedDate = new Date();
    } else {
      expectedDate = new Date(expectedStr);
    }
    return actualDt.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0];
  }

  private evaluateSameTime(actual: unknown, params: string | null): boolean {
    const actualDt = this.toDate(actual);
    const expectedDt = this.toDate(this.resolveValue(params));
    if (!actualDt || !expectedDt) return false;
    return Math.abs(actualDt.getTime() - expectedDt.getTime()) < 1000;
  }

  private evaluateWithinDays(actual: unknown, params: string | null): boolean {
    const actualDt = this.toDate(actual);
    if (!actualDt) return false;
    const days = parseInt(this.resolveStr(params), 10);
    const diffMs = Math.abs(new Date().getTime() - actualDt.getTime());
    return diffMs <= days * 24 * 60 * 60 * 1000;
  }

  // ========== Value comparison ==========

  valuesEqual(expected: unknown, actual: unknown): boolean {
    if (expected === null || expected === undefined) return actual === null || actual === undefined;
    if (actual === null || actual === undefined) return false;

    const resolved = typeof expected === 'string' ? this.resolveValue(expected) : expected;
    if (resolved === null || resolved === undefined) return false;

    // Date comparison (to-second precision)
    if (resolved instanceof Date && actual instanceof Date) {
      return Math.abs(resolved.getTime() - actual.getTime()) < 1000;
    }

    // String vs Date
    if (typeof resolved === 'string' && actual instanceof Date) {
      const parsed = new Date(resolved);
      if (!isNaN(parsed.getTime())) {
        return Math.abs(parsed.getTime() - actual.getTime()) < 1000;
      }
    }

    // Boolean handling (PG returns boolean, DataTable may have "0"/"1")
    if (typeof actual === 'boolean') {
      const expectedStr = String(resolved);
      if (expectedStr === '0' || expectedStr === '1') {
        return actual === (expectedStr === '1');
      }
      return String(actual) === expectedStr;
    }

    // Cross-type: try string comparison
    if (typeof resolved !== typeof actual) {
      // Numeric semantic comparison
      const rNum = parseFloat(String(resolved));
      const aNum = parseFloat(String(actual));
      if (!isNaN(rNum) && !isNaN(aNum)) return rNum === aNum;
      return String(resolved) === String(actual);
    }

    return resolved === actual;
  }

  // ========== Column prefix parsing ==========

  parseColumnPrefix(columnHeader: string): ColumnInfo {
    if (!columnHeader) return { prefix: '', name: '' };
    const trimmed = columnHeader.trim();
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0 && colonIndex < trimmed.length - 1) {
      const prefix = trimmed.substring(0, colonIndex).toUpperCase();
      const name = trimmed.substring(colonIndex + 1);
      if (prefix === 'P' || prefix === 'Q' || prefix === 'H' || prefix === 'B') {
        return { prefix, name };
      }
    }
    return { prefix: '', name: trimmed };
  }

  // ========== Utility ==========

  private toDouble(value: unknown): number {
    if (typeof value === 'number') return value;
    if (value instanceof Date) return value.getTime();
    const n = parseFloat(String(value));
    if (isNaN(n)) return 0; // 無法轉換為數字 → 回傳 0（不 throw，讓比較結果自然失敗）
    return n;
  }

  private toDate(value: unknown): Date | null {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);
    if (typeof value === 'string') {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  }

  private resolveStr(value: string | null): string {
    const resolved = this.resolveValue(value);
    return resolved != null ? String(resolved) : '';
  }
}
