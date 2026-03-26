import type { ISAFeatureArgumentResolver } from '../helper/isa-feature-argument-resolver';
import type { ScenarioContext } from '../context/scenario-context';
import { type ApiSpec, findBySummary } from '../spec/api/models';

/**
 * JSON 格式的 API 回應驗證指令。
 * 驗證 HTTP 狀態碼和 JSON 結構（使用 DocString 提供預期 JSON）。
 */
export class JsonResponseValidate {
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

  validate(summary: string, statusCode: string, docString: string | null): void {
    const ctx = this.contextSupplier();
    const result = ctx.getLastResponse();

    if (!result) {
      throw new Error(
        '[ResponseValidate:JSON] 沒有可驗證的 HTTP 回應。請確認已執行 API 呼叫。'
      );
    }

    // 驗證 HTTP 狀態碼
    if (statusCode) {
      const expectedStatus = parseInt(statusCode, 10);
      const actualStatus = result.status;
      if (expectedStatus !== actualStatus) {
        throw new Error(
          `[ResponseValidate:JSON] HTTP 狀態碼不匹配。\n  API: ${summary}\n  預期: ${expectedStatus}\n  實際: ${actualStatus}\n  回應: ${result.body}`
        );
      }
    }

    // 若無 DocString，僅驗證狀態碼
    if (!docString) return;

    // 解析回應 JSON
    const responseBody = result.body;
    if (!responseBody || !responseBody.trim()) {
      if (!this.hasResponseSchema(summary, statusCode)) return;
      throw new Error(
        `[ResponseValidate:JSON] API spec 定義了 ${statusCode} 的 response schema，但實際回應內容為空。API: ${summary}`
      );
    }

    let actualTree: unknown;
    let expectedTree: unknown;
    try {
      actualTree = JSON.parse(responseBody);
    } catch {
      throw new Error(
        `[ResponseValidate:JSON] 回應內容非合法 JSON。\n  API: ${summary}\n  回應: ${responseBody}`
      );
    }
    try {
      expectedTree = JSON.parse(docString);
    } catch {
      throw new Error(
        `[ResponseValidate:JSON] 預期 JSON 格式錯誤。\n  API: ${summary}\n  內容: ${docString}`
      );
    }

    // 遞迴比對 JSON 結構
    this.compareJsonNodes(expectedTree, actualTree, '$', summary);
  }

  private compareJsonNodes(
    expected: unknown,
    actual: unknown,
    path: string,
    summary: string
  ): void {
    // Object
    if (isPlainObject(expected)) {
      if (!isPlainObject(actual)) {
        throw new Error(
          `[ResponseValidate:JSON] ${summary} 型別不匹配。\n  路徑: ${path}\n  預期: Object\n  實際: ${typeof actual}`
        );
      }

      const expectedObj = expected as Record<string, unknown>;
      const actualObj = actual as Record<string, unknown>;

      for (const [fieldName, expectedChild] of Object.entries(expectedObj)) {
        // VAR-System: >contextKey / <executionKey 變數擷取
        if (fieldName.startsWith('>')) {
          const contextKey = fieldName.substring(1);
          if (typeof expectedChild === 'string' && expectedChild.startsWith('<')) {
            const executionKey = expectedChild.substring(1);
            const actualChild = actualObj[executionKey];
            if (actualChild !== null && actualChild !== undefined) {
              this.contextSupplier().put(contextKey, String(actualChild));
            }
          }
          continue;
        }

        const actualChild = actualObj[fieldName];

        if (actualChild === undefined) {
          if (typeof expectedChild === 'string' && expectedChild === '$notnull') {
            throw new Error(
              `[ResponseValidate:JSON] ${summary}.${fieldName} 應該存在且不為 null，但欄位不存在`
            );
          }
          throw new Error(
            `[ResponseValidate:JSON] ${summary} 缺少欄位 '${fieldName}'。\n  路徑: ${path}`
          );
        }

        this.compareJsonNodes(expectedChild, actualChild, `${path}.${fieldName}`, summary);
      }
    }
    // Array
    else if (Array.isArray(expected)) {
      if (!Array.isArray(actual)) {
        throw new Error(
          `[ResponseValidate:JSON] ${summary} 型別不匹配。\n  路徑: ${path}\n  預期: Array\n  實際: ${typeof actual}`
        );
      }

      if (expected.length !== (actual as unknown[]).length) {
        throw new Error(
          `[ResponseValidate:JSON] ${summary} 陣列長度不匹配。\n  路徑: ${path}\n  預期: ${expected.length}\n  實際: ${(actual as unknown[]).length}`
        );
      }

      for (let i = 0; i < expected.length; i++) {
        this.compareJsonNodes(expected[i], (actual as unknown[])[i], `${path}[${i}]`, summary);
      }
    }
    // String (with variable resolution)
    else if (typeof expected === 'string') {
      const actualObj = actual;
      const resolved = this.resolver.resolveAndValidate(
        expected, actualObj, extractFieldName(path), summary
      );

      if (resolved !== null && resolved !== undefined) {
        const resolvedStr = String(resolved);
        const actualStr = actualObj != null ? String(actualObj) : '';
        if (resolvedStr !== actualStr) {
          throw new Error(
            `[ResponseValidate:JSON] ${summary} 值不匹配。\n  路徑: ${path}\n  預期: ${resolvedStr}\n  實際: ${actualStr}`
          );
        }
      }
    }
    // Number, Boolean, Null direct comparison
    else {
      // 數值比較：容許 number vs string（API 常回 "500" 而 Feature JSON 用 500）
      if (typeof expected === 'number') {
        const actualNum = typeof actual === 'string' ? parseFloat(actual) : (typeof actual === 'number' ? actual : NaN);
        if (!isNaN(actualNum)) {
          if (expected === actualNum) return;
          if (Math.abs(expected - actualNum) < 1e-10) return;
        }
      }
      if (typeof actual === 'number' && typeof expected === 'string') {
        const expectedNum = parseFloat(expected);
        if (!isNaN(expectedNum)) {
          if (expectedNum === actual) return;
          if (Math.abs(expectedNum - actual) < 1e-10) return;
        }
      }

      if (expected !== actual) {
        throw new Error(
          `[ResponseValidate:JSON] ${summary} 值不匹配。\n  路徑: ${path}\n  預期: ${String(expected)}\n  實際: ${String(actual)}`
        );
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractFieldName(path: string): string {
  if (!path) return '';
  const lastDot = path.lastIndexOf('.');
  return lastDot >= 0 ? path.substring(lastDot + 1) : path;
}
