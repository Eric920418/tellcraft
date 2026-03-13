import type { Express } from 'express';
import type { HttpClientAdapter } from './http-client-adapter';
import type { TestRequest } from './test-request';
import { TestResponse } from './test-response';

/**
 * supertest-based HTTP client adapter.
 * Executes in-process HTTP requests against an Express app (no real server needed).
 */
export class SupertestAdapter implements HttpClientAdapter {
  private readonly app: Express;

  constructor(app: Express) {
    this.app = app;
  }

  async execute(request: TestRequest): Promise<TestResponse> {
    // Dynamic import to avoid requiring supertest as a hard dependency
    const { default: supertest } = await import('supertest');

    const agent = supertest(this.app);
    const method = request.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';

    // Build URL with query params
    let url = request.url;
    if (request.queryParams.size > 0) {
      const params = new URLSearchParams();
      for (const [key, value] of request.queryParams) {
        params.append(key, value);
      }
      url += (url.includes('?') ? '&' : '?') + params.toString();
    }

    let req = agent[method](url);

    // Set headers
    for (const [name, values] of request.headers) {
      for (const value of values) {
        req = req.set(name, value);
      }
    }

    // Set body
    if (request.body) {
      req = req.send(request.body);
    }

    const res = await req;

    // Convert headers
    const headers = new Map<string, string[]>();
    for (const [key, value] of Object.entries(res.headers)) {
      if (typeof value === 'string') {
        headers.set(key, [value]);
      } else if (Array.isArray(value)) {
        headers.set(key, value as string[]);
      }
    }

    const body = typeof res.body === 'string'
      ? res.body
      : (res.text || JSON.stringify(res.body));

    return new TestResponse(res.status, body, headers);
  }
}
