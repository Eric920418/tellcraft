/**
 * 共用 TSX/TS 語法驗證 + LLM 修復模組
 *
 * 提供 esbuild 級 TSX 語法驗證和 LLM 輔助修復。
 * 被 coder-generation.ts（組件改寫）和 uiux-generation.ts（迭代 refineCode）共用。
 */

import { createLogger } from '../lib/logger'
import { getAnthropicHeaders, MODEL, trackLlmUsage } from '../lib/anthropic'
import { recordTelemetry } from './skill-telemetry'

const logger = createLogger('syntax-validator')

const RETRY_MAX = 3
const RETRY_BASE_DELAY_MS = 2000

function isRetryableStatus(status: number): boolean {
  // L26.A: 加 500/502/504 — Cloudflare transient errors
  return status === 429 || status === 529 || status === 503
    || status === 500 || status === 502 || status === 504
}

/**
 * esbuild TSX 語法驗證 — 判斷代碼是否能被 esbuild 解析。
 * 比 TypeScript transpileModule 更嚴格（能捕捉更多 JSX 結構性問題）。
 */
export async function validateComponentSyntax(code: string, filePath: string): Promise<boolean> {
  // 跳過非 TS/TSX 檔案
  if (filePath.endsWith('.css') || filePath.endsWith('.json') || filePath.endsWith('.html')) return true
  try {
    const esbuild = await import('esbuild')
    const isTsx = filePath.endsWith('.tsx') || filePath.endsWith('.jsx')
      || code.includes('</') || code.includes('/>')  || /<[A-Z]/.test(code)
    await esbuild.transform(code, { loader: isTsx ? 'tsx' : 'ts', jsx: 'preserve' })
    return true
  } catch (err) {
    logger.warn({ path: filePath, error: err instanceof Error ? err.message : String(err) }, 'esbuild TSX 語法驗證失敗')
    return false
  }
}

/**
 * 取得 esbuild 的具體錯誤訊息（用於回傳給 LLM 修復）
 */
export async function getEsbuildErrors(code: string, filePath: string): Promise<string[]> {
  if (filePath.endsWith('.css') || filePath.endsWith('.json') || filePath.endsWith('.html')) return []
  try {
    const esbuild = await import('esbuild')
    const isTsx = filePath.endsWith('.tsx') || filePath.endsWith('.jsx')
      || code.includes('</') || code.includes('/>')  || /<[A-Z]/.test(code)
    await esbuild.transform(code, { loader: isTsx ? 'tsx' : 'ts', jsx: 'preserve' })
    return []
  } catch (err: any) {
    const errors: string[] = []
    if (err.errors && Array.isArray(err.errors)) {
      for (const e of err.errors) {
        errors.push(`Line ${e.location?.line || '?'}: ${e.text}`)
      }
    } else {
      errors.push(err instanceof Error ? err.message : String(err))
    }
    return errors
  }
}

/**
 * 驗證 + 嘗試 LLM 修復壞掉的組件。
 * 用 Haiku 修（成本低，~$0.002/次）。
 *
 * 流程：esbuild 驗證 → 通過就返回 → 失敗則 LLM 修復 → 再驗證 → 返回結果
 */
export async function validateAndFixComponent(
  code: string,
  filePath: string,
  trackingContext?: { userId?: string; conversationId?: string },
): Promise<{ content: string; fixed: boolean; hadError: boolean }> {
  // 先驗證
  const isValid = await validateComponentSyntax(code, filePath)
  if (isValid) {
    return { content: code, fixed: false, hadError: false }
  }

  // 取得具體錯誤
  const errors = await getEsbuildErrors(code, filePath)
  logger.info({ path: filePath, errorCount: errors.length }, '嘗試 LLM 修復語法錯誤')

  // LLM 修復（Haiku，成本低）
  const fixedCode = await llmFixSyntax(code, filePath, errors, trackingContext)
  if (!fixedCode) {
    recordTelemetry({
      skillName: 'syntax_validator', eventType: 'syntax_repair', patternKey: 'llm_fix_null',
      outcome: 'failed', phase: 'syntax_validator', errorType: 'syntax_error',
      userId: trackingContext?.userId, conversationId: trackingContext?.conversationId,
      payload: { filePath, errorCount: errors.length, firstError: errors[0]?.substring(0, 200) },
    }).catch(() => {})
    return { content: code, fixed: false, hadError: true }
  }

  // 驗證修復結果
  const isFixedValid = await validateComponentSyntax(fixedCode, filePath)
  if (isFixedValid) {
    logger.info({ path: filePath }, 'LLM 語法修復成功')
    recordTelemetry({
      skillName: 'syntax_validator', eventType: 'syntax_repair', patternKey: 'llm_fix_success',
      outcome: 'repaired', phase: 'syntax_validator',
      userId: trackingContext?.userId, conversationId: trackingContext?.conversationId,
      payload: { filePath, errorCount: errors.length },
    }).catch(() => {})
    return { content: fixedCode, fixed: true, hadError: true }
  }

  logger.warn({ path: filePath }, 'LLM 語法修復後仍有錯誤')
  recordTelemetry({
    skillName: 'syntax_validator', eventType: 'syntax_repair', patternKey: 'llm_fix_still_broken',
    outcome: 'failed', phase: 'syntax_validator', errorType: 'syntax_error',
    userId: trackingContext?.userId, conversationId: trackingContext?.conversationId,
    payload: { filePath, errorCount: errors.length },
  }).catch(() => {})
  return { content: code, fixed: false, hadError: true }
}

/**
 * 批量驗證 + 修復多個檔案
 */
export async function validateAndFixFiles(
  files: Array<{ path: string; content: string }>,
  trackingContext?: { userId?: string; conversationId?: string },
): Promise<Array<{ path: string; content: string; fixed: boolean; hadError: boolean }>> {
  const results: Array<{ path: string; content: string; fixed: boolean; hadError: boolean }> = []

  for (const file of files) {
    const result = await validateAndFixComponent(file.content, file.path, trackingContext)
    results.push({ path: file.path, ...result })
  }

  return results
}

// ============================================================
// 內部 LLM 修復函數
// ============================================================

async function llmFixSyntax(
  code: string,
  filePath: string,
  errors: string[],
  trackingContext?: { userId?: string; conversationId?: string },
): Promise<string | null> {
  const systemPrompt = `你是一個 TypeScript/React 語法修復專家。修復以下代碼的語法錯誤。
規則：
1. 只修語法錯誤，不改業務邏輯
2. 保留所有 import、export、函數名稱
3. 如果 JSX 標籤不平衡，補上缺失的閉合標籤
4. 如果字串/模板字面量未閉合，補上閉合符號
5. 只輸出修復後的完整代碼，不要解釋`

  const userMessage = `## 檔案：${filePath}

## 語法錯誤
${errors.map(e => `- ${e}`).join('\n')}

## 原始代碼
\`\`\`tsx
${code.substring(0, 30000)}
\`\`\`

請輸出修復後的完整代碼（用 \`\`\`tsx 包裹）：`

  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: getAnthropicHeaders(),
        body: JSON.stringify({
          model: MODEL.HAIKU,
          max_tokens: Math.min(Math.ceil(code.length / 2) + 4096, 32000),
          temperature: 0,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      })

      if (!response.ok) {
        if (attempt < RETRY_MAX && isRetryableStatus(response.status)) {
          await new Promise(resolve => setTimeout(resolve, RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)))
          continue
        }
        return null
      }

      const data = await response.json() as {
        content?: Array<{ type: string; text?: string }>
        usage?: { input_tokens?: number; output_tokens?: number }
      }

      if (data.usage?.input_tokens && data.usage?.output_tokens) {
        trackLlmUsage({
          model: MODEL.HAIKU,
          inputTokens: data.usage.input_tokens,
          outputTokens: data.usage.output_tokens,
          purpose: 'syntax_fix',
          userId: trackingContext?.userId,
          conversationId: trackingContext?.conversationId,
        })
      }

      const text = data.content?.[0]?.text || ''
      // 提取 code block
      const codeMatch = text.match(/```(?:tsx?|jsx?)\n([\s\S]*?)```/)
      if (codeMatch) return codeMatch[1].trim()
      // fallback: 整段文字當代碼
      if (text.includes('export') || text.includes('import')) return text.trim()
      return null
    } catch {
      if (attempt < RETRY_MAX) {
        await new Promise(resolve => setTimeout(resolve, RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)))
        continue
      }
      return null
    }
  }
  return null
}
