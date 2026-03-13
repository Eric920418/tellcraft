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
      responseMap = JSON.parse(responseBody);
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

      const actualValue = getNestedValue(responseMap, cleanHeader);

      const resolved = this.resolver.resolveAndValidate(
        expectedValue, actualValue, cleanHeader, summary
      );

      if (resolved !== null && resolved !== undefined) {
        const resolvedStr = String(resolved);
        const actualStr = actualValue != null ? String(actualValue) : '';
        if (resolvedStr !== actualStr && !(typeof actualValue === 'number' && numericEquals(resolvedStr, actualStr))) {
          throw new Error(
            `[ResponseValidate:DataTable] ${summary}.${cleanHeader} 值不匹配。\n  預期: ${resolvedStr}\n  實際: ${actualStr}`
          );
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
