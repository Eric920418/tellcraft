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

    let responseMap: Record<string, unknown>;
    try {
      const parsed = JSON.parse(responseBody);
      // 列表查詢 API 回傳 Array — 自動取第一個元素做欄位驗證
      // 空陣列 [] 的情況由下方欄位比對處理（actual 為 undefined）
      if (Array.isArray(parsed)) {
        responseMap = parsed.length > 0
          ? (parsed[0] as Record<string, unknown>)
          : {} as Record<string, unknown>;
      } else {
        responseMap = parsed;
      }
    } catch {
      throw new Error(
        `[ResponseValidate:DataTable] 回應內容非合法 JSON 物件。\n  API: ${summary}\n  回應: ${responseBody}`
      );
    }

    const row = rows[0];

    // 解析 context key 映射
    const contextKeyMap = this.resolver.parseContextKeys(headers);

    // 欄位層級驗證
    for (const header of headers) {
      const cleanHeader = header.trim();
      if (cleanHeader.startsWith('>') || cleanHeader.startsWith('<')) continue;

      const expectedValue = row[header];
      if (!expectedValue) continue;
      // <non-empty> / <notempty> — 非空斷言，只要 actual 非空即通過
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
      // VAR-System: < 前綴的 cell value 是 extraction key（如 <contextKey），
      // 不做值比較。提取由 extractAndStoreVariables 處理。
      if (trimExpected.startsWith('<')) continue;

      let actualValue = getNestedValue(responseMap, cleanHeader);

      // VAR 容錯：$Var.field 格式的 header（如 $Todo.id）在 response 中找不到時，
      // 用 field 部分（如 id）直接匹配。Feature 常用 $Var.field 引用 entity_setup 的欄位，
      // 但 response JSON 的 key 是純欄位名（id, isCompleted 等），不含 $Var 前綴。
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
        // 物件/陣列用 JSON.stringify 比較，避免 String([...]) 變成 [object Object]
        const actualStr = (actualValue != null && typeof actualValue === 'object')
          ? JSON.stringify(actualValue)
          : (actualValue != null ? String(actualValue) : '');

        // null 語義統一：Feature 的 "null" / "" 和 response 的 null/undefined 視為等價
        if ((resolvedStr === 'null' || resolvedStr === '') && (actualStr === '' || actualStr === 'null' || actualValue === null || actualValue === undefined)) {
          // pass — null 和空字串在 response 比對中等價
        } else if (resolvedStr !== actualStr) {
          // UUID ID 容錯：server 用 gen_random_uuid() 生成 ID，
          // 與 Feature 的確定性 UUID 不同。ID 欄位只要是合法 UUID 就算通過。
          if (isIdField(cleanHeader) && isUuidLike(resolvedStr) && isUuidLike(actualStr)) {
            // skip — both are valid UUIDs for an ID field
          } else if (!jsonSemanticallyEqual(resolvedStr, actualStr) &&
              !(typeof actualValue === 'number' && numericEquals(resolvedStr, actualStr))) {
            // 當 actual 為空時附帶 HTTP 回應上下文，幫助修復 LLM 判斷根因
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

    // VAR-System 變數擷取
    if (contextKeyMap.size > 0) {
      const dataRow = headers.map(h => row[h] ?? '');
      this.resolver.extractAndStoreVariables(dataRow, contextKeyMap, responseMap);
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
