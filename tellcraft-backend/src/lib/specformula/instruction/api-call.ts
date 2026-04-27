import type { ISAFeatureArgumentResolver } from '../helper/isa-feature-argument-resolver';
import { isSentinelValue } from '../helper/sentinel-values';
import type { ScenarioContext } from '../context/scenario-context';
import type { HttpClientAdapter } from '../http/http-client-adapter';
import { TestRequest } from '../http/test-request';
import { type ApiSpec, findBySummary } from '../spec/api/models';

const SEG = /([A-Za-z0-9_]+)(?:\[(\d+)])?/;

/**
 * API 呼叫指令。
 * 根據 DataTable 建構 HTTP 請求，執行後將回應存入 ScenarioContext。
 */
export class ApiCall {
  private readonly resolver: ISAFeatureArgumentResolver;
  private readonly contextSupplier: () => ScenarioContext;
  private readonly httpClient: HttpClientAdapter;
  private readonly apiSpec: ApiSpec;
  private readonly timeFormat: string;

  constructor(
    resolver: ISAFeatureArgumentResolver,
    contextSupplier: () => ScenarioContext,
    httpClient: HttpClientAdapter,
    apiSpec: ApiSpec,
    timeFormat?: string
  ) {
    this.resolver = resolver;
    this.contextSupplier = contextSupplier;
    this.httpClient = httpClient;
    this.apiSpec = apiSpec;
    this.timeFormat = timeFormat ?? 'iso';
  }

  async invokeWithActor(
    headers: string[],
    rows: Record<string, string>[],
    summary: string,
    tokenProvider?: () => Promise<string | null>
  ): Promise<void> {
    const token = tokenProvider ? await tokenProvider() : null;
    await this.invokeInternal(headers, rows, summary, token);
  }

  async invokeWithoutActor(
    headers: string[],
    rows: Record<string, string>[],
    summary: string
  ): Promise<void> {
    await this.invokeInternal(headers, rows, summary, null);
  }

  private async invokeInternal(
    headers: string[],
    rows: Record<string, string>[],
    summary: string,
    token: string | null
  ): Promise<void> {
    if (!summary || !summary.trim()) {
      throw new Error('[ApiCall] 缺少 API summary。');
    }

    const operation = findBySummary(this.apiSpec, summary);
    if (!operation) {
      throw new Error(
        `[ApiCall] 找不到 API 操作 '${summary}'。請確認 api-spec.yml 中定義了對應的 summary。`
      );
    }

    const urlTemplate = operation.path;
    const method = (operation.method ?? '').toUpperCase();
    if (!method) {
      throw new Error(`[ApiCall] API 操作 '${summary}' 缺少 method。`);
    }

    // Classify parameters by location
    const pathParamNames = new Set<string>();
    const queryParamNames = new Set<string>();
    const headerParamNames = new Set<string>();

    if (operation.parameters) {
      for (const param of operation.parameters) {
        if (!param.in) continue;
        switch (param.in) {
          case 'path': pathParamNames.add(param.name); break;
          case 'query': queryParamNames.add(param.name); break;
          case 'header': headerParamNames.add(param.name); break;
        }
      }
    }

    this.validateTimeFormat(this.timeFormat);

    if (!rows || rows.length === 0) {
      await this.executeEmptyDataTableRequest(urlTemplate, method, token);
      return;
    }

    const row = rows[0];
    const contextKeyMap = this.resolver.parseContextKeys(headers);

    const pathParams = new Map<string, string>();
    const queryParams = new Map<string, string>();
    const headerParams = new Map<string, string>();
    const bodyParams = new Map<string, string>();

    for (const header of headers) {
      const cleanHeader = header.trim();
      const value = row[header];
      if (value === undefined || value === null) continue;
      if (cleanHeader.startsWith('<') || cleanHeader.startsWith('>')) continue;
      // L29.B: 跳過 sentinel 驗證標記（$notnull / $null / & 約束等不該當 API param）
      if (isSentinelValue(value)) continue;

      const columnInfo = this.resolver.parseColumnPrefix(cleanHeader);
      const resolvedValue = this.resolver.resolveVariable(value);
      const actualValue = this.resolveValue(resolvedValue, this.timeFormat);

      // fail-closed：$variable 解析為 null 時立即報錯，避免靜默傳 null 導致誤導性的下游錯誤
      // 注意：只有 $letter 開頭才是 VAR 引用；$digit 開頭是 bcrypt hash（$2b$10$...）
      if (actualValue == null && value && /^\$[a-zA-Z]/.test(value.trim())) {
        throw new Error(
          `[ApiCall] VAR 解析失敗：參數 ${columnInfo.prefix ? `${columnInfo.prefix}:` : ''}${columnInfo.name} 的值 ${value} 無法解析。請確認 Background 或先前步驟已正確宣告此變數。`
        );
      }

      if (columnInfo.prefix) {
        switch (columnInfo.prefix) {
          case 'P': if (actualValue != null) pathParams.set(columnInfo.name, actualValue); break;
          case 'Q': if (actualValue != null) queryParams.set(columnInfo.name, actualValue); break;
          case 'H': if (actualValue != null) headerParams.set(columnInfo.name, actualValue); break;
        }
        continue;
      }

      const paramName = columnInfo.name;
      if (pathParamNames.has(paramName) && !pathParams.has(paramName) && actualValue != null) {
        pathParams.set(paramName, actualValue);
      }
      if (queryParamNames.has(paramName) && !queryParams.has(paramName) && actualValue != null) {
        queryParams.set(paramName, actualValue);
      }
      if (headerParamNames.has(paramName) && !headerParams.has(paramName) && actualValue != null) {
        headerParams.set(paramName, actualValue);
      }

      bodyParams.set(paramName, actualValue!);
    }

    // 路徑參數替換
    let url = urlTemplate;
    for (const [key, val] of pathParams) {
      url = url.replace(`{${key}}`, val);
    }

    // 建構請求
    const requestBuilder = TestRequest.builder(method, url);

    if (token) {
      requestBuilder.header('Authorization', `Bearer ${token}`);
    }

    for (const [k, v] of queryParams) {
      if (k && v) requestBuilder.queryParam(k, v);
    }

    for (const [k, v] of headerParams) {
      if (k && v) requestBuilder.header(k, v);
    }

    if (bodyParams.size > 0) {
      // GET/HEAD 不能帶 body，將 body params 轉為 query params
      if (method === 'GET' || method === 'HEAD') {
        for (const [key, val] of bodyParams) {
          if (val != null) requestBuilder.queryParam(key, val);
        }
      } else {
        const body: Record<string, unknown> = {};
        for (const [key, val] of bodyParams) {
          setJson(body, key, val);
        }
        requestBuilder.header('Content-Type', 'application/json');
        requestBuilder.body(JSON.stringify(body));
      }
    }

    // 執行請求
    const response = await this.httpClient.execute(requestBuilder.build());
    this.contextSupplier().setLastResponse(response);

    // VAR-System 變數擷取
    if (contextKeyMap.size > 0) {
      const responseBody = response.body;
      if (responseBody && responseBody.trim()) {
        try {
          const executionVariable = JSON.parse(responseBody);
          if (typeof executionVariable === 'object' && !Array.isArray(executionVariable)) {
            const dataRow = headers.map(h => row[h] ?? '');
            this.resolver.extractAndStoreVariables(dataRow, contextKeyMap, executionVariable);
          }
        } catch {
          // 回應非 JSON 物件，跳過變數擷取
        }
      }
    }
  }

  private async executeEmptyDataTableRequest(
    urlTemplate: string,
    method: string,
    token: string | null
  ): Promise<void> {
    const requestBuilder = TestRequest.builder(method, urlTemplate);
    if (token) {
      requestBuilder.header('Authorization', `Bearer ${token}`);
    }
    const response = await this.httpClient.execute(requestBuilder.build());
    this.contextSupplier().setLastResponse(response);
  }

  // ==================== 值格式化 ====================

  private resolveValue(resolvedValue: unknown, timeFormat: string): string | null {
    if (resolvedValue === null || resolvedValue === undefined) return null;

    if (resolvedValue instanceof Date) {
      return this.formatDate(resolvedValue, timeFormat);
    }

    return String(resolvedValue);
  }

  private formatDate(date: Date, timeFormat: string): string {
    const upper = (timeFormat ?? 'iso').toUpperCase();
    switch (upper) {
      case 'ISO': return date.toISOString();
      case 'TIMESTAMP': return String(date.getTime());
      case 'EPOCH': return String(Math.floor(date.getTime() / 1000));
      case 'DATE_ONLY': return date.toISOString().split('T')[0];
      case 'TIME_ONLY': return date.toISOString().split('T')[1].substring(0, 8);
      default: return date.toISOString();
    }
  }

  private validateTimeFormat(timeFormat: string): void {
    if (!timeFormat) return;
    const upper = timeFormat.toUpperCase();
    const valid = new Set(['ISO', 'TIMESTAMP', 'EPOCH', 'DATE_ONLY', 'TIME_ONLY']);
    if (!valid.has(upper)) {
      throw new Error(
        `不支援的時間格式: ${timeFormat}。支援的格式: ISO, TIMESTAMP, EPOCH, DATE_ONLY, TIME_ONLY`
      );
    }
  }
}

// ==================== JSON 建構 ====================

function setJson(root: Record<string, unknown>, path: string, value: string | null): void {
  if (!path) return;
  const parts = path.split('.');
  let curr = root;

  for (let i = 0; i < parts.length; i++) {
    const match = SEG.exec(parts[i]);
    if (!match) return; // malformed path segment → 跳過（不 throw）
    const name = match[1];
    const idxStr = match[2];
    const last = i === parts.length - 1;

    if (idxStr === undefined) {
      if (last) {
        curr[name] = toJsonValue(value);
      } else {
        if (!curr[name] || typeof curr[name] !== 'object' || Array.isArray(curr[name])) {
          curr[name] = {};
        }
        curr = curr[name] as Record<string, unknown>;
      }
    } else {
      if (!Array.isArray(curr[name])) {
        curr[name] = [];
      }
      const arr = curr[name] as unknown[];
      const idx = parseInt(idxStr, 10);
      while (arr.length <= idx) arr.push(null);

      if (last) {
        arr[idx] = toJsonValue(value);
      } else {
        if (!arr[idx] || typeof arr[idx] !== 'object' || Array.isArray(arr[idx])) {
          arr[idx] = {};
        }
        curr = arr[idx] as Record<string, unknown>;
      }
    }
  }
}

function toJsonValue(v: string | null): unknown {
  if (v === null || v === undefined) return null;
  const s = v.trim();

  // Try parsing JSON arrays/objects
  if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
    try {
      return JSON.parse(s);
    } catch {
      // fall through to string
    }
  }

  // Try parsing as number
  if (/^-?\d+(\.\d+)?$/.test(s)) {
    const n = parseFloat(s);
    if (!isNaN(n)) return n;
  }

  // Boolean
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null') return null;

  return v;
}
