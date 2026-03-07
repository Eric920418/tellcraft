/**
 * 從 LLM 回應中安全提取 JSON
 * 四層防禦：code fence regex → 反引號清除 → 找首個 {/[ → 清理尾隨逗號/控制字符
 */
export function safeParseJson<T>(text: string): T | null {
  // 第一層：嘗試從 markdown code block 中提取 JSON（支援 3+ 反引號）
  const codeBlockMatch = text.match(/`{3,}(?:json)?\s*\n?([\s\S]*?)\n?`{3,}/)
  let jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim()

  // 第二層：如果還有殘留反引號，暴力清除
  if (jsonStr.startsWith('`')) {
    jsonStr = jsonStr.replace(/^[`\s]*(?:json)?\s*/, '').replace(/[`\s]*$/, '')
  }

  // 嘗試直接解析
  const result = tryParse<T>(jsonStr)
  if (result !== null) return result

  // 第三層：找第一個 { 或 [ 開始的位置（處理 LLM 加了前言文字的情況）
  const firstBrace = jsonStr.indexOf('{')
  const firstBracket = jsonStr.indexOf('[')
  const start = Math.min(
    firstBrace >= 0 ? firstBrace : Infinity,
    firstBracket >= 0 ? firstBracket : Infinity
  )
  if (start < Infinity) {
    const sliced = jsonStr.slice(start)
    const result2 = tryParse<T>(sliced)
    if (result2 !== null) return result2

    // 第四層：清理常見格式問題後重試
    const cleaned = sliced
      .replace(/,\s*([}\]])/g, '$1')       // 移除尾隨逗號 {a:1,} → {a:1}
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1f\x7f]/g, ' ')   // 移除控制字符
    return tryParse<T>(cleaned)
  }
  return null
}

function tryParse<T>(str: string): T | null {
  try {
    return JSON.parse(str) as T
  } catch {
    return null
  }
}
