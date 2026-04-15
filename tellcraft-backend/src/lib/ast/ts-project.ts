// ============================================================
// ts-morph Project 單例（lazy import）
// 每個 worker 進程只建立一次 Project，所有 AST 操作共用
// 失敗降級：若 ts-morph 載入失敗，呼叫端應 fallback 到 regex 實作
// ============================================================

import { createLogger } from '../logger'

const logger = createLogger('ast-project')

type TsMorphNamespace = typeof import('ts-morph')
type ProjectInstance = InstanceType<TsMorphNamespace['Project']>

let tsMorphModule: TsMorphNamespace | null = null
let projectInstance: ProjectInstance | null = null
let loadPromise: Promise<{ ts: TsMorphNamespace; project: ProjectInstance } | null> | null = null

/**
 * 懶載入 ts-morph + 回傳（ts, project）。失敗回 null，呼叫端應 fallback。
 * 第一次呼叫會花 ~1-2s 載入 typescript compiler；後續呼叫是 O(1) cache hit。
 */
export async function getTsProject(): Promise<{ ts: TsMorphNamespace; project: ProjectInstance } | null> {
  if (tsMorphModule && projectInstance) {
    return { ts: tsMorphModule, project: projectInstance }
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        // Lazy import 避免 worker 啟動時把 ts-morph (~80-120MB RSS) 加載進來
        const tsMod = (await import('ts-morph')) as TsMorphNamespace
        const project = new tsMod.Project({
          useInMemoryFileSystem: true,
          compilerOptions: {
            target: tsMod.ScriptTarget.ES2022,
            module: tsMod.ModuleKind.ESNext,
            // JSX Preserve = 1（保留 JSX 不 transpile，避免 ts-morph getFullText 時破壞 JSX）
            jsx: 1 as const,
            allowJs: true,
            skipLibCheck: true,
            strict: false,
          },
          skipAddingFilesFromTsConfig: true,
        })
        tsMorphModule = tsMod
        projectInstance = project
        logger.info('ts-morph Project 單例已建立')
        return { ts: tsMod, project }
      } catch (err) {
        logger.error({ err }, 'ts-morph 載入失敗，呼叫端應 fallback 到 regex')
        return null
      }
    })()
  }

  return loadPromise
}

/**
 * 在 in-memory Project 中建立一個 SourceFile 並回傳；用完必須呼叫 `source.forget()` 或 `source.delete()`
 * 防止記憶體洩漏（Project 會持有每個 SourceFile 直到明確釋放）
 */
export async function withTempSourceFile<T>(
  filePath: string,
  code: string,
  fn: (ctx: {
    ts: TsMorphNamespace
    source: ReturnType<ProjectInstance['createSourceFile']>
  }) => T | Promise<T>,
): Promise<T | null> {
  const ctx = await getTsProject()
  if (!ctx) return null

  // 每次 overwrite，保證乾淨狀態
  const source = ctx.project.createSourceFile(filePath, code, { overwrite: true })
  try {
    return await fn({ ts: ctx.ts, source })
  } finally {
    // 釋放 in-memory source file，避免 Project 累積記憶體
    try {
      source.forget()
    } catch {
      // forget 失敗不影響主流程
    }
  }
}
