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

  // Fallback: 部分匹配（Feature 子操作名 ↔ 合併 Action summary）
  // 例如：summary="使用者登入" → 匹配 op.summary="使用者註冊與登入"（包含關係）
  const partial = spec.operations.find(op =>
    op.summary && (op.summary.includes(summary) || summary.includes(op.summary))
  );
  if (partial) return partial;

  // Fallback: operationId 匹配（action name → kebab-case API route）
  const normalizedSummary = summary.toLowerCase().replace(/\s+/g, '');
  return spec.operations.find(op =>
    op.operationId && op.operationId.toLowerCase().replace(/[_-]/g, '') === normalizedSummary
  ) ?? null;
}
