// ============================================================
// AST Fixers — ts-morph 版 sanitize 替代
// 替代 deployer.ts 中最脆弱的 3 類 regex：
//   1. ensureReactHooksImports   — 替代修復 2.5（missing React hooks import）
//   2. fixNext15AsyncParams      — 替代修復 6（Next.js 15 async params）
//   3. wrapUseSearchParamsInSuspense — 替代修復 7（useSearchParams Suspense）
//
// 每個 fixer 皆為純函數：(code, filePath) → { content, repaired } 或 null
// 失敗（AST 解析錯誤、ts-morph 載入失敗）回傳 null，呼叫端 fallback regex
// ============================================================

import { withTempSourceFile } from './ts-project'
import { createLogger } from '../logger'

const logger = createLogger('ast-fixers')

const REACT_HOOKS = [
  'useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 'useContext', 'useReducer',
  'useLayoutEffect', 'useImperativeHandle', 'useId', 'useTransition', 'useDeferredValue',
  'useSyncExternalStore', 'useInsertionEffect', 'useActionState', 'useOptimistic', 'useFormStatus',
] as const

// ============================================================
// Fixer 1: ensureReactHooksImports
// ============================================================

export interface FixResult {
  content: string
  repaired: boolean
  detail?: string
}

/**
 * 補齊缺失的 React hooks import
 * - 掃描 code 中使用的 hook identifiers
 * - 比對 `import { ... } from 'react'` 是否已引入
 * - 缺失的 hook 加入 named import（若無 react import 則新建）
 */
export async function ensureReactHooksImports(code: string, filePath: string): Promise<FixResult | null> {
  return (await withTempSourceFile(filePath, code, ({ source }) => {
    const usedHooks = new Set<string>()
    source.forEachDescendant(node => {
      // 只看 CallExpression 的 expression 是否為 Identifier
      if (node.getKindName() !== 'CallExpression') return
      const call = node.asKind(node.getKind())
      if (!call) return
      // CallExpression.getExpression() 可能是 Identifier
      const expr = (call as any).getExpression?.()
      if (expr && expr.getKindName && expr.getKindName() === 'Identifier') {
        const name = expr.getText()
        if ((REACT_HOOKS as readonly string[]).includes(name)) usedHooks.add(name)
      }
    })

    if (usedHooks.size === 0) return { content: code, repaired: false }

    // 找現有的 react import
    const reactImport = source.getImportDeclaration(d => {
      const ms = d.getModuleSpecifierValue()
      return ms === 'react' || ms === 'React'
    })

    const alreadyImported = new Set<string>()
    if (reactImport) {
      for (const ni of reactImport.getNamedImports()) {
        alreadyImported.add(ni.getName())
      }
    }

    const missing = [...usedHooks].filter(h => !alreadyImported.has(h))
    if (missing.length === 0) return { content: code, repaired: false }

    if (reactImport) {
      reactImport.addNamedImports(missing.map(name => ({ name })))
    } else {
      source.insertImportDeclaration(0, {
        namedImports: missing.map(name => ({ name })),
        moduleSpecifier: 'react',
      })
    }

    return {
      content: source.getFullText(),
      repaired: true,
      detail: `補 React hooks: ${missing.join(', ')}`,
    }
  })) ?? handleAstFailure('ensureReactHooksImports', filePath)
}

// ============================================================
// Fixer 2: fixNext15AsyncParams
// ============================================================

/**
 * Next.js 15 把 page/layout 的 params/searchParams 改為 Promise 類型
 * 掃描 default export function：
 * - 若參數含 `params: { ... }`（非 Promise），改為 `Promise<{ ... }>`
 * - 若參數含 `searchParams: { ... }`（非 Promise），改為 `Promise<{ ... }>`
 * - 若 function 非 async，加上 async
 * - 在 function body 開頭插入 `const { ... } = await params`
 */
export async function fixNext15AsyncParams(code: string, filePath: string): Promise<FixResult | null> {
  // 只處理 page.tsx / layout.tsx（與舊 regex 路徑一致）
  if (!/page\.(tsx|ts|jsx|js)$/.test(filePath) && !/layout\.(tsx|ts|jsx|js)$/.test(filePath)) {
    return { content: code, repaired: false }
  }

  return (await withTempSourceFile(filePath, code, ({ source }) => {
    let mutated = false
    const awaitStatements: string[] = []

    const fn = findDefaultExportFunction(source)
    if (!fn) return { content: code, repaired: false }

    const params = fn.getParameters()
    for (const param of params) {
      const typeNode = param.getTypeNode()
      if (!typeNode) continue

      // 參數型別可能是 TypeLiteral（{ params: ..., searchParams: ... }）或直接是 identifier
      const typeText = typeNode.getText()

      // 針對 TypeLiteral 型參數，遍歷 property signatures
      const members = (typeNode as any).getMembers?.()
      if (Array.isArray(members)) {
        for (const member of members) {
          if (!member || member.getKindName?.() !== 'PropertySignature') continue
          const name: string = member.getName?.()
          if (name !== 'params' && name !== 'searchParams') continue
          const propTypeNode = member.getTypeNode?.()
          if (!propTypeNode) continue
          const propTypeText = propTypeNode.getText()
          if (/^Promise</.test(propTypeText)) continue // 已是 Promise，跳過

          // 先收集欄位名（必須在 replaceWithText 前，否則 node 會 forget）
          const innerMembers = (propTypeNode as any).getMembers?.()
          const fieldNames: string[] = []
          if (Array.isArray(innerMembers)) {
            for (const im of innerMembers) {
              const n = im.getName?.()
              if (n) fieldNames.push(n)
            }
          }

          // 包裝為 Promise<...>（此後 propTypeNode 不可再用）
          propTypeNode.replaceWithText(`Promise<${propTypeText}>`)
          mutated = true

          if (fieldNames.length > 0) {
            awaitStatements.push(`const { ${fieldNames.join(', ')} } = await ${name}`)
          } else {
            awaitStatements.push(`const ${name}Resolved = await ${name}`)
          }
        }
      } else if (/params\s*:\s*\{/.test(typeText) || /searchParams\s*:\s*\{/.test(typeText)) {
        // 非 TypeLiteral 但含 params 模式 — 這條路徑 AST 較難處理，標記為 fallback
        logger.info({ filePath }, 'fixNext15AsyncParams: 參數型別非 TypeLiteral，交給 regex fallback')
        return { content: code, repaired: false }
      }
    }

    if (!mutated) return { content: code, repaired: false }

    // function 非 async → 加 async
    if (!fn.isAsync()) {
      fn.setIsAsync(true)
    }

    // 插入 await 解構（body 第一行）
    if (awaitStatements.length > 0) {
      const body = fn.getBody()
      if (body && body.getKindName() === 'Block') {
        const block = body as any
        // 已有相同 await 就不重複加（例如 LLM 已生成部分）
        const existingText: string = block.getText()
        const missing = awaitStatements.filter(stmt => !existingText.includes(stmt))
        if (missing.length > 0) {
          block.insertStatements(0, missing)
        }
      }
    }

    return {
      content: source.getFullText(),
      repaired: true,
      detail: 'Next.js 15 async params 已包裝為 Promise + await 解構',
    }
  })) ?? handleAstFailure('fixNext15AsyncParams', filePath)
}

// ============================================================
// Fixer 3: wrapUseSearchParamsInSuspense
// ============================================================

export interface SuspenseSplitResult {
  /** 新的 server component page 內容 */
  pageContent: string
  /** 新的 client component 檔案路徑 */
  clientComponentPath: string
  /** 新的 client component 檔案內容 */
  clientComponentContent: string
  /** 推導出的 client component 名稱 */
  clientComponentName: string
}

/**
 * useSearchParams 必須包在 Suspense boundary 內（Next.js 15 要求）
 * 對 page 檔案：將原內容抽出為 Client 組件，page 改為包裹 Suspense 的 Server Component
 * 回傳 null 代表無 useSearchParams 或解析失敗（呼叫端 fallback regex）
 */
export async function splitPageForSuspense(
  code: string,
  filePath: string,
): Promise<SuspenseSplitResult | null> {
  if (!/\buseSearchParams\s*\(/.test(code)) return null

  const result = await withTempSourceFile(filePath, code, ({ source }) => {
    const fn = findDefaultExportFunction(source)
    if (!fn) return null

    // 推導 client 組件名：path → baseName
    // 支援 app/page.tsx (根) / app/dashboard/page.tsx / page.tsx
    const normalizedPath = filePath.replace(/^app\//, '').replace(/page\.(tsx|ts|jsx|js)$/, '')
    const cleanedPath = normalizedPath.replace(/\/$/, '') // 去尾部 /
    const pathParts = cleanedPath ? cleanedPath.split('/').filter(Boolean) : []
    const baseName = pathParts.length > 0
      ? pathParts[pathParts.length - 1].replace(/^\w/, c => c.toUpperCase())
      : 'Home'
    const clientComponentName = `${baseName}Client`
    const clientComponentPath = filePath.replace(/page\.(tsx|ts|jsx|js)$/, `${clientComponentName}.tsx`)

    // 確保 default export 函數重命名為 clientComponentName
    const originalName = fn.getName() ?? 'Page'
    if (originalName !== clientComponentName) {
      try {
        fn.rename(clientComponentName)
      } catch {
        // rename 失敗 → fallback regex（避免破壞現有程式碼）
        return null
      }
    }

    // 確保 Client 組件有 'use client'
    let clientContent = source.getFullText()
    if (!/^['"]use client['"]/.test(clientContent.trimStart())) {
      clientContent = `'use client'\n\n${clientContent}`
    }

    const pageContent = `import { Suspense } from 'react'
import ${clientComponentName} from './${clientComponentName}'

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <${clientComponentName} />
    </Suspense>
  )
}
`

    return {
      pageContent,
      clientComponentPath,
      clientComponentContent: clientContent,
      clientComponentName,
    }
  })

  return result
}

// ============================================================
// 內部工具
// ============================================================

function findDefaultExportFunction(source: any) {
  // 先找 `export default function X() {}`
  for (const fn of source.getFunctions()) {
    if (fn.isDefaultExport && fn.isDefaultExport()) return fn
  }

  // 再找 `function X() {} export default X` 或 `export default function() {}`
  const defaultExportSym = source.getDefaultExportSymbol?.()
  if (defaultExportSym) {
    const decls = defaultExportSym.getDeclarations?.() || []
    for (const d of decls) {
      if (d.getKindName?.() === 'FunctionDeclaration') return d
      if (d.getKindName?.() === 'ExportAssignment') {
        const expr = d.getExpression?.()
        if (expr && expr.getKindName?.() === 'Identifier') {
          // `export default X` — 找 X 的宣告
          const def = expr.getDefinitions?.()?.[0]?.getDeclarationNode?.()
          if (def && def.getKindName?.() === 'FunctionDeclaration') return def
        }
      }
    }
  }

  return null
}

function handleAstFailure(fixerName: string, filePath: string): null {
  logger.warn({ fixerName, filePath }, 'AST fixer 載入或解析失敗，呼叫端應 fallback')
  return null
}
