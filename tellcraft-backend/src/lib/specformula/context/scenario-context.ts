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
    // 精確匹配
    const exact = this.contextData.get(key);
    if (exact !== undefined) return exact;

    // Fallback: $transactionId → 查找所有 *.transactionId 或 *Id 結尾的 context key
    // BDD 的 >Transaction.id 存為 "Transaction.id"，但 $transactionId 查 "transactionId"
    for (const [storedKey, value] of this.contextData) {
      // Case 1: "Transaction.id" → key "transactionId" matches via entity prefix + field
      if (storedKey.includes('.')) {
        const [entity, field] = storedKey.split('.')
        // transactionId → Transaction + id（首字母大寫 entity + field）
        const combined = entity.charAt(0).toLowerCase() + entity.slice(1) + field.charAt(0).toUpperCase() + field.slice(1)
        if (combined === key) return value
        // 也匹配 field 直接相等的情况（如 key="id", storedKey="Transaction.id"）
        if (field === key) return value
      }
    }

    return null;
  }
}
