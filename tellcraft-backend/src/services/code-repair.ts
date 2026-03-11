import { createLogger } from '../lib/logger'
import * as db from '../db/client'
import { repairUndeclaredRefs, repairMissingReactImports, repairBracketLookupAccess, repairNullIndexAccess, repairMotionReactHookImports } from './uiux-generation'
import type { Redis } from 'ioredis'

const logger = createLogger('code-repair')
const REPAIR_DONE_KEY = 'code-repair:v8' // 版本號：新增 fixer 時遞增

/**
 * 對單一檔案物件套用所有 fixer（純記憶體，不寫 DB）
 * 回傳修復後的 content 與是否有改動
 */
export function applyFixersToContent(filePath: string, content: string): { content: string; changed: boolean } {
  if (!/\.(tsx?|jsx?)$/.test(filePath)) return { content, changed: false }
  const f = { path: filePath, content, description: '' }
  let current = content

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
