/**
 * Preview Deployer — Lean 版 Vercel deploy 替換 WebContainer in-browser preview
 *
 * 與 deployer.ts:executeDeployment() 的差別：
 *   - 跳過 verifyBuildLocally（5-40% phase）— 不做本地 npm install + next build
 *   - 跳過 fixBuildErrors LLM 修復 loop — 壞了直接顯示錯誤
 *   - 跳過所有 DB 副作用：不寫 deployments / project_files / code_snapshot / projects.vercel_url
 *   - 只寫 preview_deployments 表（per-conversation 最新 10 條）
 *   - Vercel API target='preview'（vs deployer.ts target='production'）→ 拿 immutable URL 不影響 production alias
 *   - 用同一個 Vercel project（同 projectName slug），不 namespace 成 preview-* 避免炸 project 配額
 *
 * Code hash dedup：SHA-256 canonical JSON(pages|components|styles|tailwindConfig)
 *   → 同 conversationId 上次 ready 記錄同 hash → 短路回傳 cached URL，不發 Vercel call
 *
 * Reuse from deployer.ts：sanitizeCodeForDeployAsync / wrapInNextJs / toVercelSlug /
 *   createVercelProject / deployFilesToVercel(target='preview') / waitForDeploymentReady /
 *   injectVercelEnvVars
 *
 * 觸發點：phase handlers 完成時 enqueue（uiux/iteration/coder/fast-build/clone complete）
 * Gate: getEnv().ENABLE_VERCEL_PREVIEW
 */

import * as crypto from 'crypto'
import { createLogger } from '../lib/logger'
import { getEnv } from '../lib/env'
import * as db from '../db/client'
import type { GeneratedCode } from '../types/flow-state'
import {
  sanitizeCodeForDeployAsync,
  wrapInNextJs,
  toVercelSlug,
  createVercelProject,
  deployFilesToVercel,
  waitForDeploymentReady,
  injectVercelEnvVars,
  type SiteMetadata,
} from './deployer'

const logger = createLogger('preview-deployer')

// ============================================================
// Types
// ============================================================

export interface QuickPreviewDeployInput {
  conversationId: string
  projectId: string
  code: GeneratedCode
  tailwindConfig?: string
  siteMetadata?: SiteMetadata
  projectName: string
  /** 既有 Neon DB 連線字串（用既有 project_files / projects 表查得），用於 env injection */
  neonConnectionString?: string
}

export interface QuickPreviewDeployResult {
  status: 'ready' | 'failed' | 'cached'
  url: string | null
  deploymentId: string | null
  codeHash: string
  cached?: boolean
  error?: string
}

interface PreviewDeploymentRow {
  id: string
  conversation_id: string
  project_id: string
  vercel_deployment_id: string
  url: string
  status: 'building' | 'ready' | 'failed'
  code_hash: string
  error_message: string | null
  created_at: string
}

// ============================================================
// Code Hash Dedup
// ============================================================

/**
 * Canonical JSON hash — 同 code 永遠產生同 hash（防 key 順序影響）
 * 涵蓋 pages / components / styles / tailwindConfig，足以 dedup「實質上相同的 code」
 */
export function computeCodeHash(input: {
  pages: GeneratedCode['pages']
  components: GeneratedCode['components']
  styles: string
  tailwindConfig?: string
}): string {
  const canonical = {
    pages: input.pages.map(p => ({ path: p.path, content: p.content })).sort((a, b) => a.path.localeCompare(b.path)),
    components: input.components.map(c => ({ path: c.path, content: c.content })).sort((a, b) => a.path.localeCompare(b.path)),
    styles: input.styles,
    tailwindConfig: input.tailwindConfig ?? '',
  }
  return crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex')
}

// ============================================================
// DB helpers
// ============================================================

async function findCachedPreview(
  conversationId: string,
  codeHash: string,
): Promise<PreviewDeploymentRow | null> {
  const row = await db.queryOne<PreviewDeploymentRow>(
    `SELECT * FROM preview_deployments
     WHERE conversation_id = $1 AND code_hash = $2 AND status = 'ready'
     ORDER BY created_at DESC LIMIT 1`,
    [conversationId, codeHash],
  )
  return row
}

async function insertPreviewDeployment(
  conversationId: string,
  projectId: string,
  vercelDeploymentId: string,
  url: string,
  status: 'building' | 'ready' | 'failed',
  codeHash: string,
  errorMessage?: string,
): Promise<void> {
  await db.query(
    `INSERT INTO preview_deployments (conversation_id, project_id, vercel_deployment_id, url, status, code_hash, error_message)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [conversationId, projectId, vercelDeploymentId, url, status, codeHash, errorMessage ?? null],
  )
}

/** Fallback URL：優先上次 preview ready，否則 projects.vercel_url（production alias） */
export async function findLkgPreviewUrl(
  conversationId: string,
  projectId: string,
): Promise<string | null> {
  const lastPreview = await db.queryOne<{ url: string }>(
    `SELECT url FROM preview_deployments
     WHERE conversation_id = $1 AND status = 'ready'
     ORDER BY created_at DESC LIMIT 1`,
    [conversationId],
  )
  if (lastPreview?.url) return lastPreview.url

  const project = await db.queryOne<{ vercel_url: string | null }>(
    `SELECT vercel_url FROM projects WHERE id = $1`,
    [projectId],
  )
  return project?.vercel_url ?? null
}

// ============================================================
// Main: quickPreviewDeploy
// ============================================================

export async function quickPreviewDeploy(
  input: QuickPreviewDeployInput,
): Promise<QuickPreviewDeployResult> {
  const startTime = Date.now()
  const projectSlug = toVercelSlug(input.projectName, input.projectId)
  const codeHash = computeCodeHash({
    pages: input.code.pages,
    components: input.code.components,
    styles: input.code.styles,
    tailwindConfig: input.tailwindConfig,
  })

  // ── 1. Code hash dedup — 短路 ──
  const cached = await findCachedPreview(input.conversationId, codeHash)
  if (cached) {
    logger.info({
      conversationId: input.conversationId,
      codeHash: codeHash.slice(0, 12),
      cachedDeploymentId: cached.vercel_deployment_id,
    }, 'preview deploy 命中 cache，短路')
    return {
      status: 'cached',
      url: cached.url,
      deploymentId: cached.vercel_deployment_id,
      codeHash,
      cached: true,
    }
  }

  // ── 2. Sanitize + wrapInNextJs（reuse deployer 既有邏輯）──
  const sanitized = await sanitizeCodeForDeployAsync(input.code)
  if (sanitized.fixes.length > 0) {
    logger.info({
      conversationId: input.conversationId,
      fixCount: sanitized.fixes.length,
    }, 'sanitize 修復了代碼')
  }

  const vercelFiles = wrapInNextJs(
    sanitized.code,
    projectSlug,
    input.tailwindConfig ?? '',
    {},  // extraDependencies — 用 sanitize 結果即可
    [],  // injectedFiles
  )

  // ── 3. 建 Vercel project（若不存在）──
  const vercelProject = await createVercelProject(projectSlug)
  if (!vercelProject) {
    logger.warn({ projectSlug }, 'createVercelProject 失敗（可能已存在），繼續嘗試 deploy')
  }

  // ── 4. 注入 env vars（DATABASE_URL = neon 連線字串）──
  if (input.neonConnectionString) {
    try {
      await injectVercelEnvVars(projectSlug, {
        DATABASE_URL: input.neonConnectionString,
      })
    } catch (err) {
      logger.warn({
        err: (err as Error).message,
        conversationId: input.conversationId,
      }, 'injectVercelEnvVars 失敗（preview 不阻塞，繼續 deploy 可能 server actions 拿不到 DB）')
    }
  }

  // ── 5. 部署到 Vercel（target='preview' — 拿 immutable URL 不影響 production alias）──
  const deployment = await deployFilesToVercel(projectSlug, vercelFiles, 'preview')
  if (!deployment) {
    const errorMsg = 'Vercel deployFilesToVercel 失敗'
    logger.error({ conversationId: input.conversationId, projectSlug }, errorMsg)
    return {
      status: 'failed',
      url: null,
      deploymentId: null,
      codeHash,
      error: errorMsg,
    }
  }

  // 寫初始 'building' 記錄（在 polling 前）
  await insertPreviewDeployment(
    input.conversationId,
    input.projectId,
    deployment.id,
    `https://${deployment.url}`,
    'building',
    codeHash,
  )

  // ── 6. Polling 等 READY/ERROR（max 4 分鐘）──
  const timeoutMs = getEnv().PREVIEW_DEPLOY_TIMEOUT_MS
  const ready = await waitForDeploymentReady(deployment.id, timeoutMs)

  if (!ready || ready.readyState === 'ERROR' || ready.readyState === 'CANCELED') {
    const errorMsg = ready
      ? `Vercel build ${ready.readyState}`
      : `Vercel polling timeout (${timeoutMs / 1000}s)`
    logger.warn({
      conversationId: input.conversationId,
      deploymentId: deployment.id,
      readyState: ready?.readyState,
    }, errorMsg)

    // 更新狀態為 failed
    await db.query(
      `UPDATE preview_deployments SET status = 'failed', error_message = $1
       WHERE vercel_deployment_id = $2`,
      [errorMsg, deployment.id],
    )

    return {
      status: 'failed',
      url: `https://${deployment.url}`,
      deploymentId: deployment.id,
      codeHash,
      error: errorMsg,
    }
  }

  // ── 7. 成功 — 更新狀態為 ready ──
  const finalUrl = `https://${ready.url}`
  await db.query(
    `UPDATE preview_deployments SET status = 'ready'
     WHERE vercel_deployment_id = $1`,
    [deployment.id],
  )

  logger.info({
    conversationId: input.conversationId,
    deploymentId: deployment.id,
    url: finalUrl,
    durationMs: Date.now() - startTime,
  }, 'quickPreviewDeploy 完成')

  return {
    status: 'ready',
    url: finalUrl,
    deploymentId: deployment.id,
    codeHash,
  }
}
