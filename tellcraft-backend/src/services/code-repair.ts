import { createLogger } from '../lib/logger'
import * as db from '../db/client'
import { repairUndeclaredRefs, repairMissingReactImports, repairBracketLookupAccess } from './uiux-generation'
import type { Redis } from 'ioredis'

const logger = createLogger('code-repair')
const REPAIR_DONE_KEY = 'code-repair:v2' // 版本號：新增 fixer 時遞增

/**
 * 修復單一 project 的所有 project_files
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
    const f = { path: file.file_path, content: file.content, description: '' }
    let current = f.content
    let changed = false

    const r1 = repairUndeclaredRefs({ ...f, content: current })
    if (r1.repaired) { current = r1.content; changed = true }

    const r2 = repairMissingReactImports({ ...f, content: current })
    if (r2.repaired) { current = r2.content; changed = true }

    const r3 = repairBracketLookupAccess({ ...f, content: current })
    if (r3.repaired) { current = r3.content; changed = true }

    if (changed) {
      await db.query(
        `UPDATE project_files SET content = $1, updated_at = NOW() WHERE id = $2`,
        [current, file.id]
      )
      repairedCount++
    }
  }
  return repairedCount
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
