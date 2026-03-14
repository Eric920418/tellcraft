import type { HttpClientAdapter } from './http-client-adapter';
import type { TestRequest } from './test-request';
import { TestResponse } from './test-response';

/**
 * URL-based HTTP adapter using native fetch.
 * Sends real HTTP requests to a running server (e.g. Mini Express test server).
 */
export class UrlHttpAdapter implements HttpClientAdapter {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async execute(request: TestRequest): Promise<TestResponse> {
    // Build URL with query params
    let url = this.baseUrl + request.url;
    if (request.queryParams.size > 0) {
      const params = new URLSearchParams();
      for (const [key, value] of request.queryParams) {
        params.append(key, value);
      }
      url += (url.includes('?') ? '&' : '?') + params.toString();
    }

    // Build headers
    const headers: Record<string, string> = {};
    for (const [name, values] of request.headers) {
      headers[name] = values.join(', ');
    }

    // Execute fetch
    const res = await fetch(url, {
      method: request.method,
      headers,
      body: request.body ?? undefined,
    });

    // Convert response headers
    const responseHeaders = new Map<string, string[]>();
    res.headers.forEach((value, key) => {
      responseHeaders.set(key, [value]);
    });

    const body = await res.text();

    return new TestResponse(res.status, body, responseHeaders);
  }
}
