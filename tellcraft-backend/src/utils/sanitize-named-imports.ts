/**
 * Named Import 驗證與修復
 * 偵測 import { X } from './file' 中 X 是否真的存在於目標檔案的 exports 中
 * 不存在的 named import 會被移除，JSX 中的引用替換為 fallback
 */

import { createLogger } from '../lib/logger'

const logger = createLogger('sanitize-named-imports')

interface FileEntry {
  path: string
  content: string
}

/**
 * 從檔案內容提取所有 export 的名稱（named + default）
 */
export function extractAllExports(content: string): Set<string> {
  const exports = new Set<string>()

  // export function Foo / export async function Foo
  for (const m of content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)) {
    exports.add(m[1])
  }

  // export const/let/var foo
  for (const m of content.matchAll(/export\s+(?:const|let|var)\s+(\w+)/g)) {
    exports.add(m[1])
  }

  // export class Foo / export interface Foo / export type Foo / export enum Foo
  for (const m of content.matchAll(/export\s+(?:class|interface|type|enum)\s+(\w+)/g)) {
    exports.add(m[1])
  }

  // export default function Foo → both 'default' and 'Foo'
  for (const m of content.matchAll(/export\s+default\s+(?:function|class)\s+(\w+)/g)) {
    exports.add(m[1])
    exports.add('default')
  }

  // export default without name
  if (/export\s+default\s+/.test(content)) {
    exports.add('default')
  }

  // export { Foo, Bar } or export { Foo as Bar }
  for (const m of content.matchAll(/export\s*\{([^}]+)\}/g)) {
    // Skip re-exports: export { X } from '...'
    const afterBrace = content.slice((m.index || 0) + m[0].length, (m.index || 0) + m[0].length + 20)
    if (/^\s*from\s/.test(afterBrace)) continue

    for (const name of m[1].split(',')) {
      const trimmed = name.trim()
      if (!trimmed) continue
      // export { Foo as Bar } → export name is 'Bar'
      const asMatch = trimmed.match(/\w+\s+as\s+(\w+)/)
      exports.add(asMatch ? asMatch[1] : trimmed)
    }
  }

  return exports
}

/**
 * 解析 import path 到正規化的檔案路徑
 */
function resolveImportPath(importPath: string, fromFile: string, allPaths: Set<string>): string | null {
  let resolved: string

  if (importPath.startsWith('@/')) {
    resolved = importPath.slice(2) // @/components/Icons → components/Icons
  } else if (importPath.startsWith('./') || importPath.startsWith('../')) {
    // 相對路徑
    const fromDir = fromFile.replace(/\/[^/]+$/, '')
    const parts = [...fromDir.split('/'), ...importPath.split('/')]
    const normalized: string[] = []
    for (const p of parts) {
      if (p === '.' || p === '') continue
      if (p === '..') { normalized.pop(); continue }
      normalized.push(p)
    }
    resolved = normalized.join('/')
  } else {
    return null // node_modules 等外部套件，不檢查
  }

  // 嘗試匹配各種副檔名
  const candidates = [
    resolved,
    resolved + '.tsx', resolved + '.ts', resolved + '.jsx', resolved + '.js',
    resolved + '/index.tsx', resolved + '/index.ts',
  ]

  for (const c of candidates) {
    if (allPaths.has(c)) return c
  }

  return null // 檔案不存在（交給檔案級驗證處理）
}

/**
 * 從 import 語句中移除特定 named import
 * import { A, BadName, B } from '...' → import { A, B } from '...'
 * 如果移除後 {} 為空，移除整行 import
 */
function removeNamedImport(content: string, name: string): string {
  // Match import { ... } from '...' containing the name
  return content.replace(
    new RegExp(`(import\\s*\\{)([^}]*)(\\}\\s*from\\s*['"][^'"]+['"])`, 'g'),
    (full, prefix, names, suffix) => {
      const nameList = names.split(',').map((n: string) => n.trim()).filter(Boolean)
      const filtered = nameList.filter((n: string) => {
        const realName = n.split(/\s+as\s+/)[0].trim()
        return realName !== name
      })
      if (filtered.length === 0) return '' // 移除整行
      return `${prefix} ${filtered.join(', ')} ${suffix}`
    }
  )
}

/**
 * 替換 JSX 中的 undefined 組件引用
 * <RadioIcon /> → <span />
 * <RadioIcon className="..."> → <span className="...">
 */
function replaceComponentUsage(content: string, name: string): string {
  // Self-closing: <Name ... />
  content = content.replace(
    new RegExp(`<${name}(\\s[^>]*)?\\s*/>`, 'g'),
    '<span$1 />'
  )
  // Opening + closing: <Name ...>...</Name>
  content = content.replace(
    new RegExp(`<${name}(\\s[^>]*)?>`, 'g'),
    '<span$1>'
  )
  content = content.replace(
    new RegExp(`</${name}>`, 'g'),
    '</span>'
  )
  // 非 JSX 用途：作為函數呼叫 Name(...) → (() => null)(...)
  // 這種情況比較少，暫不處理
  return content
}

/**
 * 驗證並修復所有檔案中的 named import
 * 回傳修復後的檔案陣列 + 修復日誌
 */
export function sanitizeNamedImports(
  files: FileEntry[],
): { sanitized: FileEntry[]; fixes: Array<{ file: string; removed: string; from: string }> } {
  // Step 1: Build export map
  const pathSet = new Set(files.map(f => f.path))
  const exportMap = new Map<string, Set<string>>()
  for (const file of files) {
    exportMap.set(file.path, extractAllExports(file.content))
  }

  const fixes: Array<{ file: string; removed: string; from: string }> = []

  // Step 2: Validate each file's named imports
  const sanitized = files.map(file => {
    let content = file.content
    const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g
    const toRemove: Array<{ name: string; importPath: string }> = []

    let match
    while ((match = importRegex.exec(content)) !== null) {
      const names = match[1].split(',').map(s => s.trim()).filter(Boolean)
      const importPath = match[2]

      const resolvedPath = resolveImportPath(importPath, file.path, pathSet)
      if (!resolvedPath) continue // 檔案不存在或外部套件，跳過

      const targetExports = exportMap.get(resolvedPath)
      if (!targetExports) continue

      for (const nameEntry of names) {
        const realName = nameEntry.split(/\s+as\s+/)[0].trim()
        if (!targetExports.has(realName)) {
          toRemove.push({ name: realName, importPath })
        }
      }
    }

    if (toRemove.length === 0) return file

    // Step 3: Remove broken named imports + replace usage
    for (const { name, importPath } of toRemove) {
      content = removeNamedImport(content, name)
      // 只替換 PascalCase 的組件名（避免誤殺小寫工具函數）
      if (/^[A-Z]/.test(name)) {
        content = replaceComponentUsage(content, name)
      }
      fixes.push({ file: file.path, removed: name, from: importPath })
    }

    return { ...file, content }
  })

  if (fixes.length > 0) {
    logger.info({ count: fixes.length, fixes }, 'Named import 修復完成')
  }

  return { sanitized, fixes }
}
