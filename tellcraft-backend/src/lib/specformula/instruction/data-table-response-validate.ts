import type { ISAFeatureArgumentResolver } from '../helper/isa-feature-argument-resolver';
import type { ScenarioContext } from '../context/scenario-context';
import { type ApiSpec, findBySummary } from '../spec/api/models';

/**
 * DataTable 格式的 API 回應驗證指令。
 * 驗證 HTTP 狀態碼和回應欄位（支援巢狀 JSON path）。
 */
export class DataTableResponseValidate {
  private readonly resolver: ISAFeatureArgumentResolver;
  private readonly contextSupplier: () => ScenarioContext;
  private readonly apiSpec: ApiSpec;

  constructor(
    resolver: ISAFeatureArgumentResolver,
    contextSupplier: () => ScenarioContext,
    apiSpec: ApiSpec
  ) {
    this.resolver = resolver;
    this.contextSupplier = contextSupplier;
    this.apiSpec = apiSpec;
  }

  validate(
    summary: string,
    statusCode: string,
    headers: string[] | null,
    rows: Record<string, string>[] | null
  ): void {
    const ctx = this.contextSupplier();
    const result = ctx.getLastResponse();

    if (!result) {
      throw new Error(
        '[ResponseValidate:DataTable] 沒有可驗證的 HTTP 回應。請確認已執行 API 呼叫。'
      );
    }

    // 驗證 HTTP 狀態碼
    if (statusCode) {
      const expectedStatus = parseInt(statusCode, 10);
      const actualStatus = result.status;
      if (expectedStatus !== actualStatus) {
        throw new Error(
          `[ResponseValidate:DataTable] HTTP 狀態碼不匹配。\n  API: ${summary}\n  預期: ${expectedStatus}\n  實際: ${actualStatus}\n  回應: ${result.body}`
        );
      }
    }

    // 若無 DataTable，僅驗證狀態碼
    if (!headers || !rows || rows.length === 0) return;

    // 檢查是否所有 header 都為空
    const allBlank = headers.every(h => !h || !h.trim());
    if (allBlank) return;

    // 解析回應 JSON
    const responseBody = result.body;
    if (!responseBody || !responseBody.trim()) {
      if (!this.hasResponseSchema(summary, statusCode)) return;
      throw new Error(
        `[ResponseValidate:DataTable] API spec 定義了 ${statusCode} 的 response schema，但實際回應內容為空。API: ${summary}`
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(responseBody);
    } catch {
      throw new Error(
        `[ResponseValidate:DataTable] 回應內容非合法 JSON 物件。\n  API: ${summary}\n  回應: ${responseBody}`
      );
    }

    // 解析 context key 映射
    const contextKeyMap = this.resolver.parseContextKeys(headers);

    // 過濾出實際驗證用的 header（排除 index 位置標記欄位）
    const validateHeaders = headers.filter(h => h.trim() !== 'index');

    if (Array.isArray(parsed) && rows.length > 1) {
      // ===== 多行 Array 回應驗證：每行對應 array 中的一個元素（按位置對齊）=====
      for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
        const row = rows[rowIdx];
        const elementMap: Record<string, unknown> = rowIdx < parsed.length
          ? (parsed[rowIdx] as Record<string, unknown>)
          : {};

        this.validateSingleRow(summary, validateHeaders, row, elementMap);

        // VAR-System 變數擷取（每行各自對應的 array 元素）
        if (contextKeyMap.size > 0) {
          const dataRow = headers.map(h => row[h] ?? '');
          this.resolver.extractAndStoreVariables(dataRow, contextKeyMap, elementMap);
        }
      }
    } else {
      // ===== 單行驗證（原有邏輯）=====
      const responseMap: Record<string, unknown> = Array.isArray(parsed)
        ? (parsed.length > 0 ? (parsed[0] as Record<string, unknown>) : {})
        : (parsed as Record<string, unknown>);

      const row = rows[0];
      this.validateSingleRow(summary, validateHeaders, row, responseMap);

      // VAR-System 變數擷取
      if (contextKeyMap.size > 0) {
        const dataRow = headers.map(h => row[h] ?? '');
        this.resolver.extractAndStoreVariables(dataRow, contextKeyMap, responseMap);
      }
    }
  }

  private validateSingleRow(
    summary: string,
    headers: string[],
    row: Record<string, string>,
    responseMap: Record<string, unknown>
  ): void {
    for (const header of headers) {
      const cleanHeader = header.trim();
      if (cleanHeader.startsWith('>') || cleanHeader.startsWith('<')) continue;

      const expectedValue = row[header];
      if (!expectedValue) continue;
      const trimExpected = expectedValue.trim();
      if (trimExpected === '<non-empty>' || trimExpected === '<notempty>') {
        const av = getNestedValue(responseMap, cleanHeader);
        if (av === null || av === undefined || av === '') {
          throw new Error(
            `[ResponseValidate:DataTable] ${summary}.${cleanHeader} 應為非空值，但實際為空`
          );
        }
        continue;
      }
      if (trimExpected.startsWith('<')) continue;

      let actualValue = getNestedValue(responseMap, cleanHeader);

      if (actualValue === null || actualValue === undefined) {
        if (cleanHeader.startsWith('$') && cleanHeader.includes('.')) {
          const fieldPart = cleanHeader.split('.').pop()!;
          actualValue = getNestedValue(responseMap, fieldPart);
        }
      }

      const resolved = this.resolver.resolveAndValidate(
        expectedValue, actualValue, cleanHeader, summary
      );

      if (resolved !== null && resolved !== undefined) {
        const resolvedStr = String(resolved);
        const actualStr = (actualValue != null && typeof actualValue === 'object')
          ? JSON.stringify(actualValue)
          : (actualValue != null ? String(actualValue) : '');

        if ((resolvedStr === 'null' || resolvedStr === '') && (actualStr === '' || actualStr === 'null' || actualValue === null || actualValue === undefined)) {
          // pass
        } else if (resolvedStr !== actualStr) {
          if (isIdField(cleanHeader) && isUuidLike(resolvedStr) && isUuidLike(actualStr)) {
            // skip — both valid UUIDs
          } else if (!jsonSemanticallyEqual(resolvedStr, actualStr) &&
              !(typeof actualValue === 'number' && numericEquals(resolvedStr, actualStr))) {
            const httpContext = (actualStr === '' || actualValue === null || actualValue === undefined)
              ? (() => {
                  const resp = this.contextSupplier().getLastResponse();
                  return resp ? `\n  HTTP: ${resp.status} ${(resp.body || '').substring(0, 200)}` : '';
                })()
              : '';
            throw new Error(
              `[ResponseValidate:DataTable] ${summary}.${cleanHeader} 值不匹配。\n  預期: ${resolvedStr}\n  實際: ${actualStr}${httpContext}`
            );
          }
        }
      }
    }
  }

  private hasResponseSchema(summary: string, statusCode: string): boolean {
    if (!this.apiSpec || !summary || !statusCode) return false;
    const operation = findBySummary(this.apiSpec, summary);
    if (!operation?.responses) return false;
    const apiResponse = operation.responses[statusCode];
    return !!(apiResponse?.schema);
  }
}

/**
 * 數值語義比較（JSON RFC 8259）。
 */
function numericEquals(a: string, b: string): boolean {
  try {
    return parseFloat(a) === parseFloat(b);
  } catch {
    return false;
  }
}

/**
 * JSON 語義比較：預期的欄位必須全部匹配，但 actual 可以有多餘欄位。
 * 支援巢狀物件和陣列。
 */
function jsonSemanticallyEqual(expectedStr: string, actualStr: string): boolean {
  try {
    const expected = JSON.parse(expectedStr);
    const actual = JSON.parse(actualStr);
    return jsonSubsetMatch(expected, actual);
  } catch {
    return false;
  }
}

function jsonSubsetMatch(expected: unknown, actual: unknown): boolean {
  if (expected === null || expected === undefined) {
    return actual === null || actual === undefined || actual === '';
  }
  if (typeof expected !== typeof actual) {
    // 數值型態容錯：'2' vs 2
    if (String(expected) === String(actual)) return true;
    return false;
  }
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false;
    if (expected.length !== actual.length) return false;
    // Order-independent matching：先嘗試位置匹配，失敗則嘗試任意順序匹配
    const positionalMatch = expected.every((item, i) => jsonSubsetMatch(item, actual[i]));
    if (positionalMatch) return true;
    // 任意順序：每個 expected item 必須匹配某個未使用的 actual item
    const used = new Set<number>();
    return expected.every(exp => {
      for (let i = 0; i < actual.length; i++) {
        if (used.has(i)) continue;
        if (jsonSubsetMatch(exp, actual[i])) {
          used.add(i);
          return true;
        }
      }
      return false;
    });
  }
  if (typeof expected === 'object' && expected !== null) {
    if (typeof actual !== 'object' || actual === null || Array.isArray(actual)) return false;
    const exp = expected as Record<string, unknown>;
    const act = actual as Record<string, unknown>;
    // 預期的每個欄位都必須在 actual 中匹配（actual 可以有多餘欄位）
    for (const key of Object.keys(exp)) {
      // UUID ID 容錯：嵌套 JSON 中的 ID 欄位用 gen_random_uuid()，允許不同 UUID
      if (isIdField(key) &&
          typeof exp[key] === 'string' && isUuidLike(exp[key] as string) &&
          typeof act[key] === 'string' && isUuidLike(act[key] as string)) {
        continue;
      }
      if (!jsonSubsetMatch(exp[key], act[key])) return false;
    }
    return true;
  }
  return String(expected) === String(actual);
}

/**
 * 從巢狀結構中依路徑取值。
 * 支援 dot-notation（data.user.id）、array index（users[0].name）。
 */
function getNestedValue(map: Record<string, unknown>, path: string): unknown {
  if (!map || !path) return null;

  const segments = path.split('.');
  let current: unknown = map;

  for (const segment of segments) {
    if (current === null || current === undefined) return null;

    const bracketStart = segment.indexOf('[');
    if (bracketStart >= 0) {
      const fieldName = segment.substring(0, bracketStart);
      const bracketEnd = segment.indexOf(']', bracketStart);
      if (bracketEnd < 0) return null;
      const index = parseInt(segment.substring(bracketStart + 1, bracketEnd), 10);

      if (fieldName && typeof current === 'object' && !Array.isArray(current)) {
        current = (current as Record<string, unknown>)[fieldName];
      }
      if (!Array.isArray(current)) return null;
      if (index < 0 || index >= current.length) return null;
      current = current[index];
    } else if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return null;
    }
  }

  return current;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 欄位名稱是否為 ID 類型（episodeId, comment_id, id 等） */
function isIdField(name: string): boolean {
  return /(?:^id$|Id$|_id$)/i.test(name);
}

/** 字串是否為合法 UUID 格式 */
function isUuidLike(value: string): boolean {
  return UUID_RE.test(value.trim());
}
