export interface ApiSpec {
  openapi?: string;
  info?: ApiInfo;
  operations: ApiOperation[];
}

export interface ApiInfo {
  title?: string;
  version?: string;
  description?: string;
}

export interface ApiOperation {
  method: string;
  path: string;
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  parameters?: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses?: Record<string, ApiResponse>;
}

export interface ApiParameter {
  name: string;
  in: string; // 'path' | 'query' | 'header'
  required?: boolean;
  description?: string;
  schema?: ApiSchema;
}

export interface ApiRequestBody {
  required?: boolean;
  schema?: ApiSchema;
}

export interface ApiResponse {
  statusCode?: string;
  description?: string;
  schema?: ApiSchema;
}

export interface ApiSchema {
  type?: string;
  format?: string;
  description?: string;
  required?: string[];
  properties?: Record<string, ApiSchema>;
  items?: ApiSchema;
  enumValues?: string[];
  example?: string;
}

// Helper: find operation by summary
export function findBySummary(spec: ApiSpec, summary: string): ApiOperation | null {
  // 精確匹配
  const exact = spec.operations.find(op => op.summary === summary);
  if (exact) return exact;

  // Fallback 1: 單向 forward 部分匹配（operation summary 包含傳入的 summary）
  // 例如：summary="使用者登入" → 匹配 op.summary="使用者註冊與登入"
  const partialForward = spec.operations.find(op =>
    op.summary && op.summary.includes(summary)
  );
  if (partialForward) return partialForward;

  // Fallback 2: 反向部分匹配（傳入的 summary 包含 operation summary）
  // 例如：summary="新增一筆收支記錄" → 匹配 op.summary="新增收支記錄"
  // 這層是容錯網：前幾層對齊機制應該都已對齊，此層作為最後保險。
  // 加長度門檻避免短 summary 誤匹配（op.summary 必須至少 4 字元，避免「登入」誤匹配「使用者登入」）
  const partialBackward = spec.operations.find(op =>
    op.summary && op.summary.length >= 4 && summary.includes(op.summary)
  );
  if (partialBackward) {
    // 記錄 warning：觸發反向匹配表示有對齊問題（前面的防禦層應該都修過了）
    // 用 console.warn 因為此檔在 lib/ 不方便 import logger
    console.warn(`[findBySummary] backward substring match: query="${summary}" matched op.summary="${partialBackward.summary}". Check upstream alignment (actionsYml ↔ features.name)`);
    return partialBackward;
  }

  // Fallback 3: operationId 匹配（action name → kebab-case API route）
  const normalizedSummary = summary.toLowerCase().replace(/\s+/g, '');
  return spec.operations.find(op =>
    op.operationId && op.operationId.toLowerCase().replace(/[_-]/g, '') === normalizedSummary
  ) ?? null;
}
