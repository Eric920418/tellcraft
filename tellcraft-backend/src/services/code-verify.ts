/**
 * Code verification service for WebContainer preview.
 *
 * Layer 0: sanitizeCodeForDeploy() — 11 種零 LLM regex 修復
 * Layer 3: fixPreviewBuildError() — Haiku LLM 修復 WebContainer build error
 */

import { sanitizeCodeForDeploy } from './deployer'
import type { GeneratedCode } from '../types/flow-state'
import { getAnthropicClient, MODEL } from '../lib/anthropic'
import { createLogger } from '../lib/logger'

const logger = createLogger('code-verify')

/**
 * Layer 0: 在 code_preview 發送前執行 sanitizeCodeForDeploy
 * 零 LLM、零 I/O，純 regex 修復
 */
export function sanitizeForPreview(code: GeneratedCode): {
  code: GeneratedCode
  fixes: string[]
} {
  const result = sanitizeCodeForDeploy(code)
  if (result.fixes.length > 0) {
    logger.info({ fixes: result.fixes }, 'sanitizeForPreview: 修復了代碼')
  }
  return { code: result.code, fixes: result.fixes }
}

/**
 * Layer 3: 接收 WebContainer 的 build error，用 Haiku LLM 修復
 * 前端呼叫此函數（透過 API），不在 VPS 跑 build
 */
export async function fixPreviewBuildError(input: {
  buildError: string
  code: GeneratedCode
  tailwindConfig?: string
  trackingContext?: { userId?: string; conversationId?: string }
}): Promise<{
  fixedCode: GeneratedCode
  fixes: string[]
} | null> {
  const { buildError, code, tailwindConfig, trackingContext } = input
  const client = getAnthropicClient()

  // 組合所有代碼供 LLM 修復
  const codeBlocks: string[] = []
  for (const page of code.pages) {
    codeBlocks.push(`\`\`\`tsx:${page.path}\n${page.content}\n\`\`\``)
  }
  for (const comp of code.components) {
    const ext = comp.path.endsWith('.ts') ? 'ts' : 'tsx'
    codeBlocks.push(`\`\`\`${ext}:${comp.path}\n${comp.content}\n\`\`\``)
  }
  if (code.styles) {
    codeBlocks.push(`\`\`\`css:app/globals.css\n${code.styles}\n\`\`\``)
  }
  if (tailwindConfig) {
    codeBlocks.push(`\`\`\`ts:tailwind.config.ts\n${tailwindConfig}\n\`\`\``)
  }

  const prompt = `你是 Next.js build 錯誤修復專家。以下是一個 Next.js 14 App Router 專案的 build error：

## Build Error
\`\`\`
${buildError.slice(0, 2000)}
\`\`\`

## 專案代碼
${codeBlocks.join('\n\n')}

## 規則
1. 只修復 build error 中提到的問題
2. 輸出修改後的完整檔案（不要只輸出 diff）
3. 格式：每個修改的檔案用 \`\`\`tsx:path/to/file.tsx 包裹
4. 如果需要新增依賴，在最後用 \`\`\`json:NEW_DEPS 包裹：{"package": "version"}
5. 'use client' 檔案不能 export metadata
6. 不能有兩個 page 解析到同一路由（route groups 衝突）
7. 所有 .map()/.filter() 前加 ?. 防禦（防止 undefined）
8. ?? 和 || 混用必須加括號
9. Tailwind 用 v3 語法（@tailwind base/components/utilities）
10. 保持原有功能不變，只修 build error

請修復以上錯誤。`

  try {
    logger.info({ errorPreview: buildError.slice(0, 200), ...trackingContext }, 'fixPreviewBuildError: 開始 LLM 修復')

    const response = await client.messages.create({
      model: MODEL.HAIKU,
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') return null

    // 解析 LLM 回傳的修復代碼
    const fixedFiles = parseFixedFiles(content.text)
    if (fixedFiles.length === 0) {
      logger.warn('fixPreviewBuildError: LLM 沒有回傳任何修復')
      return null
    }

    // 合併修復到原始代碼
    const fixedCode = applyFixes(code, fixedFiles)
    const fixes = fixedFiles.map(f => `修復: ${f.path}`)

    logger.info({ fixCount: fixes.length, ...trackingContext }, 'fixPreviewBuildError: 修復完成')
    return { fixedCode, fixes }
  } catch (err) {
    logger.error({ err, ...trackingContext }, 'fixPreviewBuildError: LLM 呼叫失敗')
    return null
  }
}

/** 解析 LLM 回傳的代碼塊 */
function parseFixedFiles(text: string): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = []
  const regex = /```(?:tsx?|jsx?|css|json):([^\n]+)\n([\s\S]*?)```/g
  let match
  while ((match = regex.exec(text)) !== null) {
    const path = match[1].trim()
    const content = match[2].trim()
    if (path === 'NEW_DEPS') continue // 跳過依賴定義
    files.push({ path, content })
  }
  return files
}

/** 將修復的檔案合併回原始代碼 */
function applyFixes(original: GeneratedCode, fixedFiles: { path: string; content: string }[]): GeneratedCode {
  const fixMap = new Map(fixedFiles.map(f => [f.path, f.content]))

  const pages = original.pages.map(p => ({
    ...p,
    content: fixMap.get(p.path) ?? p.content,
  }))

  const components = original.components.map(c => ({
    ...c,
    content: fixMap.get(c.path) ?? c.content,
  }))

  const fixedStyles = fixMap.get('app/globals.css')

  return { pages, components, styles: fixedStyles || original.styles }
}
