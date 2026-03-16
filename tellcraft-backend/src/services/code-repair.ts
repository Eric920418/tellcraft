import { createLogger } from '../lib/logger'
import * as db from '../db/client'
import { repairUndeclaredRefs, repairMissingReactImports, repairBracketLookupAccess, repairNullIndexAccess, repairMotionReactHookImports, repairHookShadowing, getSyntaxErrors } from './uiux-generation'
import type { Redis } from 'ioredis'

const logger = createLogger('code-repair')
const REPAIR_DONE_KEY = 'code-repair:v9' // v9：新增 syntax firewall

/**
 * 從原始 content 掃描 export 簽名，生成安全 stub 組件
 * .tsx → 紅色虛線框 React 組件；.ts → 空值 export 保持 import 不斷裂
 */
function buildStubComponent(filePath: string, originalContent: string): string {
  const baseName = filePath.split('/').pop() || 'Component'
  const componentName = baseName.replace(/\.\w+$/, '').replace(/[^a-zA-Z0-9]/g, '')
  const isPage = /page\.tsx$/i.test(filePath)
  const isTsx = /\.tsx$/i.test(filePath)

  if (isTsx) {
    const stubBody = `export default function ${componentName || 'ErrorStub'}() {
  return (
    <div style={{
      border: '2px dashed #ef4444',
      borderRadius: '8px',
      padding: '24px',
      margin: '16px',
      backgroundColor: '#fef2f2',
      color: '#991b1b',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center' as const,
    }}>
      <p style={{ fontWeight: 600, marginBottom: '8px' }}>此組件有語法錯誤</p>
      <p style={{ fontSize: '14px', color: '#b91c1c' }}>需要重新生成：${baseName}</p>
    </div>
  )
}`
    // 掃描原始 named export，生成空值替代
    const namedExports: string[] = []
    const exportConstRegex = /export\s+(?:const|let|var)\s+([a-zA-Z_$][\w$]*)/g
    let match: RegExpExecArray | null
    while ((match = exportConstRegex.exec(originalContent)) !== null) {
      if (match[1] !== componentName && match[1] !== 'default') {
        namedExports.push(`export const ${match[1]} = null`)
      }
    }
    const exportFnRegex = /export\s+function\s+([a-zA-Z_$][\w$]*)/g
    while ((match = exportFnRegex.exec(originalContent)) !== null) {
      if (match[1] !== componentName && match[1] !== 'default') {
        namedExports.push(`export function ${match[1]}() { return null }`)
      }
    }

    const parts = ["import React from 'react'", '', stubBody]
    if (namedExports.length > 0) parts.push('', ...namedExports)
    return parts.join('\n')
  }

  // .ts（非 tsx）— 掃描所有 export 簽名，用空值替代
  const lines: string[] = []
  const seenNames = new Set<string>()

  const constRe = /export\s+(?:const|let|var)\s+([a-zA-Z_$][\w$]*)/g
  let m: RegExpExecArray | null
  while ((m = constRe.exec(originalContent)) !== null) {
    if (!seenNames.has(m[1])) { seenNames.add(m[1]); lines.push(`export const ${m[1]} = null`) }
  }
  const fnRe = /export\s+function\s+([a-zA-Z_$][\w$]*)/g
  while ((m = fnRe.exec(originalContent)) !== null) {
    if (!seenNames.has(m[1])) { seenNames.add(m[1]); lines.push(`export function ${m[1]}() { return null }`) }
  }
  const typeRe = /export\s+(?:type|interface)\s+([a-zA-Z_$][\w$]*)/g
  while ((m = typeRe.exec(originalContent)) !== null) {
    if (!seenNames.has(m[1])) { seenNames.add(m[1]); lines.push(`export type ${m[1]} = Record<string, unknown>`) }
  }
  if (/export\s+default/.test(originalContent)) {
    lines.push('export default null')
  }
  if (isPage && !lines.some(l => l.includes('export default'))) {
    lines.push('export default null')
  }
  return lines.length > 0 ? lines.join('\n') : 'export {}'
}

/**
 * 對單一檔案物件套用所有 fixer（純記憶體，不寫 DB）
 * 回傳修復後的 content 與是否有改動
 */
export function applyFixersToContent(filePath: string, content: string): { content: string; changed: boolean } {
  if (!/\.(tsx?|jsx?)$/.test(filePath)) return { content, changed: false }
  const f = { path: filePath, content, description: '' }
  let current = content

  const rHook = repairHookShadowing({ ...f, content: current })
  if (rHook.repaired) current = rHook.content

  const r0 = repairMotionReactHookImports({ ...f, content: current })
  if (r0.repaired) current = r0.content

  const r1 = repairUndeclaredRefs({ ...f, content: current })
  if (r1.repaired) current = r1.content

  const r2 = repairMissingReactImports({ ...f, content: current })
  if (r2.repaired) current = r2.content

  const r3 = repairBracketLookupAccess({ ...f, content: current })
  if (r3.repaired) current = r3.content

  const r4 = repairNullIndexAccess({ ...f, content: current })
  if (r4.repaired) current = r4.content

  // ── Syntax Firewall：最終驗證層 ──
  const syntaxErrors = getSyntaxErrors(filePath, current)
  if (syntaxErrors.length > 0) {
    logger.warn(
      { path: filePath, errors: syntaxErrors.slice(0, 5), errorCount: syntaxErrors.length },
      'syntax firewall: fixer 無法修復，替換為 stub'
    )
    const stub = buildStubComponent(filePath, content) // 用原始 content 分析 export 結構
    return { content: stub, changed: true }
  }

  return { content: current, changed: current !== content }
}

/**
 * 修復單一 project 的所有 project_files（寫回 DB）
 * 回傳修復的檔案數
 */
export async function repairProjectFiles(projectId: string): Promise<number> {
  const files = await db.queryMany<{ id: string; file_path: string; content: string; skill_source: string }>(
    `SELECT id, file_path, content, skill_source FROM project_files
     WHERE project_id = $1 AND file_path ~ '\\.(tsx?|jsx?)$'`,
    [projectId]
  )
  if (files.length === 0) return 0

  let repairedCount = 0
  for (const file of files) {
    const { content, changed } = applyFixersToContent(file.file_path, file.content)
    if (changed) {
      await db.query(
        `UPDATE project_files SET content = $1, updated_at = NOW() WHERE id = $2`,
        [content, file.id]
      )
      repairedCount++
    }
  }
  return repairedCount
}

type CodeFile = { path: string; content: string; description: string }

/**
 * 對 messages 陣列中所有 code_preview richContent 套用 fixer（純記憶體）
 * 回傳 { messages: 修復後的陣列, changed: 是否有任何改動 }
 */
export function repairCodePreviewInMessages(messages: unknown[]): { messages: unknown[]; changed: boolean } {
  let anyChanged = false

  const repaired = messages.map(msg => {
    const m = msg as Record<string, unknown>
    const rc = m.richContent as { type?: string; data?: Record<string, unknown> } | undefined
    if (rc?.type !== 'code_preview' || !rc.data) return msg

    const data = rc.data
    let dataChanged = false

    const repairFiles = (files: unknown): { files: CodeFile[]; changed: boolean } => {
      if (!Array.isArray(files)) return { files: [], changed: false }
      let fc = false
      const result = (files as CodeFile[]).map(f => {
        const { content, changed } = applyFixersToContent(f.path, f.content)
        if (changed) { fc = true; return { ...f, content } }
        return f
      })
      return { files: result, changed: fc }
    }

    const { files: pages, changed: pc } = repairFiles(data.pages)
    if (pc) dataChanged = true

    const { files: components, changed: cc } = repairFiles(data.components)
    if (cc) dataChanged = true

    if (!dataChanged) return msg
    anyChanged = true
    return { ...m, richContent: { ...rc, data: { ...data, pages, components } } }
  })

  return { messages: repaired, changed: anyChanged }
}

/**
 * 啟動時一次性修復所有 project_files
 * 用 Redis key 防止重複執行（版本號遞增時重跑）
 */
export async function runStartupCodeRepair(redis: Redis): Promise<void> {
  const alreadyDone = await redis.get(REPAIR_DONE_KEY)
  if (alreadyDone) {
    logger.info('startup code repair 已完成，跳過')
    return
  }

  logger.info('startup code repair 開始掃描...')
  const startAt = Date.now()

  const rows = await db.queryMany<{ project_id: string }>(
    `SELECT DISTINCT project_id FROM project_files WHERE file_path ~ '\\.(tsx?|jsx?)$'`
  )

  let totalFiles = 0
  let totalProjects = 0
  const batchSize = 50

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    for (const { project_id } of batch) {
      try {
        const fixed = await repairProjectFiles(project_id)
        if (fixed > 0) {
          totalFiles += fixed
          totalProjects++
        }
      } catch (err) {
        logger.warn({ err, projectId: project_id }, '單一 project 修復失敗，繼續下一個')
      }
    }
    // 每批之間短暫讓出 event loop
    await new Promise(r => setTimeout(r, 10))
  }

  const elapsed = Date.now() - startAt
  logger.info({ totalProjects, totalFiles, elapsed }, 'startup code repair 完成')

  // 標記完成，TTL 30 天（30 天後會重跑一次）
  await redis.set(REPAIR_DONE_KEY, '1', 'EX', 30 * 24 * 3600)
}
