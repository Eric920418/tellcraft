/**
 * 統一的 JSON path tokenizer，支援 ADR-0019 bracket notation 逃脫語法。
 * 從 Java reference implementation 完整移植。
 *
 * - `["key.name"]` → 擷取 `key.name` 作為完整 token
 * - `items[0]` → 保留為單一 segment（陣列索引）
 * - 其餘以 `.` 分隔
 */

/**
 * 將路徑字串拆解為 token 列表。
 */
export function tokenize(path: string): string[] {
  if (!path) return []

  const tokens: string[] = []
  let current = ''
  let i = 0
  const len = path.length

  while (i < len) {
    // 偵測 bracket notation 逃脫: ["..."]
    if (i + 1 < len && path[i] === '[' && path[i + 1] === '"') {
      // 先 flush 目前累積的 token
      if (current) {
        tokens.push(current)
        current = ''
      }
      // 找到對應的 "]
      const closeIdx = path.indexOf('"]', i + 2)
      if (closeIdx < 0) {
        // 未關閉 → 當作一般字元處理（容錯）
        current += path[i]
        i++
        continue
      }
      tokens.push(path.substring(i + 2, closeIdx))
      i = closeIdx + 2
      // 跳過後接的 . 分隔符
      if (i < len && path[i] === '.') {
        i++
      }
    } else if (path[i] === '.') {
      // 一般的 . 分隔符
      if (current) {
        tokens.push(current)
        current = ''
      }
      i++
    } else {
      current += path[i]
      i++
    }
  }

  if (current) {
    tokens.push(current)
  }

  return tokens
}

/**
 * 若 key 包含 `.`，以 bracket notation `["..."]` 包裹逃脫。
 */
export function escapeKey(key: string): string {
  if (key.includes('.') && !key.includes('[')) {
    return `["${key}"]`
  }
  return key
}
