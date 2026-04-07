/**
 * Code verification service for WebContainer preview.
 *
 * Layer 0: sanitizeCodeForDeploy() — 零 LLM regex 修復
 * Layer 3: fixPreviewError() — Haiku LLM 修復 build / runtime error
 */

import { sanitizeCodeForDeploy } from './deployer'
import type { GeneratedCode } from '../types/flow-state'
import type { GeneratedComponent } from './uiux-generation'
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

// ============================================================
// Layer 3: Build / Runtime error LLM 修復
// ============================================================

export type PreviewErrorType = 'build' | 'runtime'

export interface FixPreviewErrorInput {
  errorType: PreviewErrorType
  errorMessage: string
  errorStack?: string  // runtime 用
  errorPath?: string   // runtime 用（window.onerror 的 src）
  code: GeneratedCode
  tailwindConfig?: string
  trackingContext?: { userId?: string; conversationId?: string }
}

/**
 * Layer 3: 接收 WebContainer 的 build / runtime error，用 Haiku LLM 修復
 * 前端呼叫此函數（透過 API），不在 VPS 跑 build
 */
export async function fixPreviewError(input: FixPreviewErrorInput): Promise<{
  fixedCode: GeneratedCode
  fixes: string[]
} | null> {
  const { errorType, errorMessage, errorStack, errorPath, code, tailwindConfig, trackingContext } = input
  const client = getAnthropicClient()

  // Runtime error：優先只送相關檔案（省 token）
  let focusedCode = code
  let matched = false
  if (errorType === 'runtime') {
    const relevant = extractRelevantFiles(errorPath, errorStack, code)
    if (relevant.matched) {
      focusedCode = { pages: relevant.pages, components: relevant.components, styles: code.styles }
      matched = true
    }
  }

  // 組合代碼區塊
  const codeBlocks: string[] = []
  for (const page of focusedCode.pages) {
    codeBlocks.push(`\`\`\`tsx:${page.path}\n${page.content}\n\`\`\``)
  }
  for (const comp of focusedCode.components) {
    const ext = comp.path.endsWith('.ts') ? 'ts' : 'tsx'
    codeBlocks.push(`\`\`\`${ext}:${comp.path}\n${comp.content}\n\`\`\``)
  }
  if (focusedCode.styles && (errorType === 'build' || !matched)) {
    codeBlocks.push(`\`\`\`css:app/globals.css\n${focusedCode.styles}\n\`\`\``)
  }
  if (tailwindConfig && errorType === 'build') {
    codeBlocks.push(`\`\`\`ts:tailwind.config.ts\n${tailwindConfig}\n\`\`\``)
  }

  const prompt = errorType === 'build'
    ? buildErrorPrompt(errorMessage, codeBlocks)
    : runtimeErrorPrompt(errorMessage, errorStack, errorPath, codeBlocks)

  try {
    logger.info({
      errorType,
      matched,
      errorPreview: errorMessage.slice(0, 200),
      fileCount: focusedCode.pages.length + focusedCode.components.length,
      ...trackingContext,
    }, 'fixPreviewError: 開始 LLM 修復')

    const response = await client.messages.create({
      model: MODEL.HAIKU,
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') return null

    const fixedFiles = parseFixedFiles(content.text)
    if (fixedFiles.length === 0) {
      logger.warn({ errorType, ...trackingContext }, 'fixPreviewError: LLM 沒有回傳任何修復')
      return null
    }

    // 套用到**完整**代碼（不是 focusedCode）
    const fixedCode = applyFixes(code, fixedFiles)
    const fixes = fixedFiles.map(f => `修復: ${f.path}`)

    logger.info({ errorType, fixCount: fixes.length, ...trackingContext }, 'fixPreviewError: 修復完成')
    return { fixedCode, fixes }
  } catch (err) {
    logger.error({ err, errorType, ...trackingContext }, 'fixPreviewError: LLM 呼叫失敗')
    return null
  }
}

/**
 * 向後相容：舊 API 仍呼叫 fixPreviewBuildError
 */
export async function fixPreviewBuildError(input: {
  buildError: string
  code: GeneratedCode
  tailwindConfig?: string
  trackingContext?: { userId?: string; conversationId?: string }
}): Promise<{ fixedCode: GeneratedCode; fixes: string[] } | null> {
  return fixPreviewError({
    errorType: 'build',
    errorMessage: input.buildError,
    code: input.code,
    tailwindConfig: input.tailwindConfig,
    trackingContext: input.trackingContext,
  })
}

// ============================================================
// Prompts
// ============================================================

function buildErrorPrompt(errorMessage: string, codeBlocks: string[]): string {
  return `你是 Next.js build 錯誤修復專家。以下是一個 Next.js 14 App Router 專案的 build error：

## Build Error
\`\`\`
${errorMessage.slice(0, 2000)}
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
}

function runtimeErrorPrompt(
  errorMessage: string,
  errorStack: string | undefined,
  errorPath: string | undefined,
  codeBlocks: string[],
): string {
  return `你是 React/Next.js runtime 錯誤修復專家。以下是 WebContainer 預覽中執行時噴出的錯誤：

## Runtime Error
Message: ${errorMessage.slice(0, 800)}
${errorPath ? `Path:    ${errorPath}` : ''}
${errorStack ? `Stack:\n${errorStack.slice(0, 1200)}` : ''}

## 出錯的檔案
${codeBlocks.join('\n\n')}

## 修復原則（必須全部遵守）
1. **這是 runtime 錯誤，不是 build 錯誤** — 程式可以編譯但執行時崩潰
2. **絕大多數 TypeError 都來自存取 undefined 的屬性**。修復方式：
   - \`obj.prop\` → \`obj?.prop ?? fallback\`
   - \`arr[i].field\` → \`arr?.[i]?.field\`
   - \`items.map(...)\` → \`(items ?? []).map(...)\`
   - \`currentItem.image\` → \`currentItem?.image ?? '/placeholder.png'\`
3. **stateful "current item" 模式特別危險**：useState 初值是 \`null\` 或 \`undefined\` 時，第一次 render 一定會炸
   - \`const [x, setX] = useState()\` → 給合理初值或加守衛 \`if (!x) return null\`
4. ReferenceError → 加上缺失的 \`useRef\` / \`useState\` / import
5. 不要重寫無關的程式碼，只改造成錯誤的那一個或多個地方
6. **必須輸出修復後的完整檔案**（不是 diff），格式：\`\`\`tsx:path/to/file.tsx ... \`\`\`
7. 如果同一個檔案有多處類似的不安全存取，**全部一起修**，不要只修錯誤訊息提到的那一行
8. 保持原有功能不變，只防禦 undefined 存取

請修復以上錯誤。`
}

// ============================================================
// Helpers
// ============================================================

/**
 * 從 runtime error 的 path / stack 解析出相關檔案，只送該檔案給 LLM 省 token
 */
function extractRelevantFiles(
  errorPath: string | undefined,
  errorStack: string | undefined,
  code: GeneratedCode,
): { pages: GeneratedComponent[]; components: GeneratedComponent[]; matched: boolean } {
  // 從 errorPath 或 stack 中提取候選路徑
  const candidates = new Set<string>()

  if (errorPath) {
    // 例如 webpack-internal:///(app-pages-browser)/./app/page.tsx → app/page.tsx
    const cleaned = errorPath.replace(/^webpack-internal:\/\/\/\([^)]+\)\/\.\//, '').replace(/^\.\//, '')
    candidates.add(cleaned)
  }

  if (errorStack) {
    // 掃描 stack 中的檔案路徑
    const stackRegex = /(?:at\s+[^(]*\()?([^():\s]+\.tsx?)(?::\d+:\d+)?/g
    let m
    while ((m = stackRegex.exec(errorStack)) !== null) {
      const cleaned = m[1].replace(/^webpack-internal:\/\/\/\([^)]+\)\/\.\//, '').replace(/^\.\//, '')
      if (cleaned.includes('app/') || cleaned.includes('components/') || cleaned.includes('lib/')) {
        candidates.add(cleaned)
      }
    }
  }

  if (candidates.size === 0) {
    return { pages: [], components: [], matched: false }
  }

  const matchedPages: GeneratedComponent[] = []
  const matchedComponents: GeneratedComponent[] = []

  for (const candidate of candidates) {
    // 精確匹配或 basename 匹配
    const candBase = candidate.split('/').pop() || candidate
    for (const page of code.pages) {
      if (page.path === candidate || page.path.endsWith(candidate) || page.path.endsWith('/' + candBase)) {
        if (!matchedPages.find(p => p.path === page.path)) {
          matchedPages.push(page)
        }
      }
    }
    for (const comp of code.components) {
      if (comp.path === candidate || comp.path.endsWith(candidate) || comp.path.endsWith('/' + candBase)) {
        if (!matchedComponents.find(c => c.path === comp.path)) {
          matchedComponents.push(comp)
        }
      }
    }
  }

  const matched = matchedPages.length > 0 || matchedComponents.length > 0
  return { pages: matchedPages, components: matchedComponents, matched }
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
