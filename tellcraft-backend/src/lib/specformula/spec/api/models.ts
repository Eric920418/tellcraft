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
  return spec.operations.find(op => op.summary === summary) ?? null;
}
