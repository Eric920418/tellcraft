import type { TestResponse } from '../http/test-response';

export class ScenarioContext {
  private lastResponse: TestResponse | null = null;
  private readonly contextData: Map<string, unknown> = new Map();

  getLastResponse(): TestResponse | null {
    return this.lastResponse;
  }

  setLastResponse(response: TestResponse): void {
    this.lastResponse = response;
  }

  clear(): void {
    this.lastResponse = null;
  }

  reset(): void {
    this.lastResponse = null;
    this.contextData.clear();
  }

  put(key: string, value: string): void {
    this.contextData.set(key, value);
  }

  putObject(key: string, value: unknown): void {
    this.contextData.set(key, value);
  }

  get(key: string): unknown {
    return this.contextData.get(key) ?? null;
  }
}
