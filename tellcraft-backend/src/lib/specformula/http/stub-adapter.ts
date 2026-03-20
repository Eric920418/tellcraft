import type { HttpClientAdapter } from './http-client-adapter';
import type { TestRequest } from './test-request';
import { TestResponse } from './test-response';

/**
 * Stub HTTP adapter for RED Phase validation.
 * Returns a fixed response for all requests — no real server needed.
 */
export class StubHttpAdapter implements HttpClientAdapter {
  private readonly statusCode: number;
  private readonly body: string;

  constructor(statusCode = 501, body = '{"error":"Not Implemented"}') {
    this.statusCode = statusCode;
    this.body = body;
  }

  async execute(_request: TestRequest): Promise<TestResponse> {
    return new TestResponse(this.statusCode, this.body, new Map());
  }
}
