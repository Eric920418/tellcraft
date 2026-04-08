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

    // 大小寫不敏感的精確匹配（fast path）
    const keyLower = key.toLowerCase();
    for (const [storedKey, value] of this.contextData) {
      if (storedKey.toLowerCase() === keyLower) return value;
    }

    // 正規化匹配：移除所有點/底線/連字號 + 小寫
    // 例：beautician1Id ↔ Beautician1.id ↔ beautician1_id ↔ beautician_1_id
    const normalize = (s: string) => s.toLowerCase().replace(/[._\-]/g, '');
    const keyNorm = normalize(key);
    for (const [storedKey, value] of this.contextData) {
      if (normalize(storedKey) === keyNorm) return value;
    }

    // Fallback: $transactionId → 查找所有 *.transactionId 或 *Id 結尾的 context key
    // BDD 的 >Transaction.id 存為 "Transaction.id"，但 $transactionId 查 "transactionId"
    for (const [storedKey, value] of this.contextData) {
      // Case 1: "Transaction.id" → key "transactionId" matches via entity prefix + field
      if (storedKey.includes('.')) {
        const [entity, field] = storedKey.split('.')
        // transactionId → Transaction + id（首字母大寫 entity + field）
        const combined = entity.charAt(0).toLowerCase() + entity.slice(1) + field.charAt(0).toUpperCase() + field.slice(1)
        if (combined === key) return value

        // Case 2: "List1.id" → strip trailing digits → "list" + "Id" = "listId"
        // BDD 常用 List1/User2 等帶數字後綴的 entity，但 $listId 引用不帶數字
        const entityNoDigits = entity.replace(/\d+$/, '')
        if (entityNoDigits !== entity) {
          const combinedNoDigits = entityNoDigits.charAt(0).toLowerCase() + entityNoDigits.slice(1) + field.charAt(0).toUpperCase() + field.slice(1)
          if (combinedNoDigits === key) return value
        }

        // Case 2.5: "lists.id" → strip trailing 's' → "list" + "Id" = "listId"
        // BDD 常用表名（複數）作為 entity name，但 $variable 用單數
        const base = entityNoDigits.charAt(0).toLowerCase() + entityNoDigits.slice(1)
        if (base.endsWith('s') && base.length > 1) {
          const entitySingular = base.slice(0, -1)
          const combinedSingular = entitySingular + field.charAt(0).toUpperCase() + field.slice(1)
          if (combinedSingular === key) return value
        }

        // Case 3: field 直接相等（如 key="id", storedKey="Transaction.id"）
        if (field === key) return value
      }
    }

    // 反向 fallback：lookup 是 camelCase + 數字（如 beautician1Id），嘗試重組為 PascalCase.field
    // 例：beautician1Id → Beautician1.id（再做大小寫不敏感匹配）
    const camelDigitMatch = key.match(/^([a-z][a-zA-Z]*?)(\d+)([A-Z][a-zA-Z]*)$/);
    if (camelDigitMatch) {
      const [, entityLower, num, fieldCamel] = camelDigitMatch;
      const reconstructed = entityLower.charAt(0).toUpperCase() + entityLower.slice(1) + num + '.' + fieldCamel.toLowerCase();
      const reconstructedLower = reconstructed.toLowerCase();
      for (const [storedKey, value] of this.contextData) {
        if (storedKey === reconstructed || storedKey.toLowerCase() === reconstructedLower) return value;
      }
    }

    return null;
  }
}
