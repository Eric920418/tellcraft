/**
 * Project auto-naming utility
 *
 * 抽自 orchestrator.ts 以便 LangGraph node（classify.ts）也能呼叫。
 * 歷史 bug：USE_LANGGRAPH=true 時 classifyNode 丟棄 suggestedProjectName，
 * 所有專案永遠停在預設名「專案 YYYY/M/D」沒被改成用戶意圖的名字。
 */

import * as db from '../db/client'
import { createLogger } from '../lib/logger'

const logger = createLogger('project-naming')

interface PgUniqueError {
  code?: string
  constraint?: string
}

export function normalizeProjectName(raw: string, maxLength: number, fallback: string): string {
  const normalized = raw.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim().slice(0, maxLength)
  return normalized || fallback
}

export function isProjectNameUniqueViolation(err: unknown): boolean {
  const pgErr = err as PgUniqueError | undefined
  return pgErr?.code === '23505' && pgErr?.constraint === 'projects_user_id_name_key'
}

export async function buildUniqueProjectName(
  userId: string,
  projectId: string,
  baseName: string,
): Promise<string> {
  const existing = await db.query<{ name: string }>(
    'SELECT name FROM projects WHERE user_id = $1 AND name LIKE $2 AND id != $3',
    [userId, `${baseName}%`, projectId],
  )
  const existingSet = new Set(existing.rows.map(r => r.name))
  if (!existingSet.has(baseName)) {
    return baseName
  }

  let suffix = 2
  while (existingSet.has(`${baseName} (${suffix})`)) {
    suffix++
  }
  return `${baseName} (${suffix})`
}

export async function renameProjectSafely(params: {
  userId: string
  projectId: string
  desiredName: string
  maxLength: number
  fallbackName: string
}): Promise<string | null> {
  const { userId, projectId, desiredName, maxLength, fallbackName } = params
  const baseName = normalizeProjectName(desiredName, maxLength, fallbackName)
  const MAX_RETRIES = 5

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const candidate = await buildUniqueProjectName(userId, projectId, baseName)
    try {
      await db.query('UPDATE projects SET name = $1, updated_at = NOW() WHERE id = $2', [candidate, projectId])
      return candidate
    } catch (err) {
      if (isProjectNameUniqueViolation(err) && attempt < MAX_RETRIES) {
        logger.warn({ attempt, candidate }, '專案名稱衝突，重試自動命名')
        continue
      }
      throw err
    }
  }

  return null
}

/**
 * Helper：當專案名為預設「專案 YYYY/M/D」時自動改名為 desiredName。
 * 已存在用戶自訂名稱（不符合 ^專案\s 模式）→ 不動，避免覆蓋用戶手動命名。
 *
 * 兩個 dispatcher（舊 orchestrator handleProcessMessage / 新 LangGraph
 * classifyNode）都應該呼叫這個 helper，確保自動命名行為一致。
 */
export async function autoRenameIfDefault(params: {
  userId: string
  projectId: string
  desiredName: string
  maxLength: number
  fallbackName: string
}): Promise<{ renamed: boolean; oldName?: string; newName?: string }> {
  try {
    const project = await db.queryOne<{ name: string }>(
      'SELECT name FROM projects WHERE id = $1',
      [params.projectId],
    )
    if (!project) return { renamed: false }
    // 預設名格式：「專案 YYYY/M/D」或「LINE 專案 ...」「Telegram 專案 ...」
    if (!/^(?:LINE\s|Telegram\s)?專案\s/.test(project.name)) {
      return { renamed: false, oldName: project.name }
    }
    const finalName = await renameProjectSafely(params)
    if (finalName) {
      logger.info({ oldName: project.name, newName: finalName }, '自動命名專案')
      return { renamed: true, oldName: project.name, newName: finalName }
    }
    return { renamed: false, oldName: project.name }
  } catch (err) {
    logger.error({ err, projectId: params.projectId }, '自動命名失敗（不影響流程）')
    return { renamed: false }
  }
}
