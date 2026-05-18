/**
 * Preview Deploy Worker — BullMQ queue 'preview-deploy'
 *
 * 處理 quickPreviewDeploy job：phase handler 完成時 enqueue → 此 worker 跑 Vercel preview deploy
 * → 透過 Socket.io Redis Emitter 推 preview:{progress,ready,failed}:{conversationId} 給前端
 *
 * 設計：
 *   - concurrency 4（避免炸 Vercel rate limit）
 *   - 進度 emit: 5/30/95/100% (粗粒度，2-3 分鐘 deploy 過程不要太細)
 *   - 失敗時 attach lkgUrl（上次 ready preview 或 production URL）
 *   - 不阻塞主流程：呼叫端 fire-and-forget enqueue
 *
 * Producer 端 rate limit + debounce 邏輯在 enqueuePreviewDeploy() 內（lib/enqueue-preview-deploy.ts）
 */

import { Queue, Worker, type Job } from 'bullmq'
import type Redis from 'ioredis'
import type { Emitter } from '@socket.io/redis-emitter'
import { createLogger } from '../lib/logger'
import { getEnv } from '../lib/env'
import * as db from '../db/client'
import { quickPreviewDeploy, findLkgPreviewUrl } from '../services/preview-deployer'
import { runPreviewAutoFix } from '../services/preview-auto-fix'
import type { GeneratedCode, IoEmitter } from '../types/flow-state'
import { sendMessage } from './orchestrator-utils'

const logger = createLogger('preview-deploy-worker')

// ============================================================
// Job payload
// ============================================================

export interface PreviewDeployJobData {
  conversationId: string
  projectId: string
  projectName: string
  /** code 從 FlowState.uiuxGeneratedCode 或 project_files 取，由 enqueue 端組好放 job 內 */
  code: GeneratedCode
  tailwindConfig?: string
  neonConnectionString?: string
}

// ============================================================
// Singletons
// ============================================================

let queueInstance: Queue<PreviewDeployJobData> | null = null
let workerInstance: Worker<PreviewDeployJobData> | null = null

export function getPreviewDeployQueue(connection: Redis): Queue<PreviewDeployJobData> {
  if (queueInstance) return queueInstance
  queueInstance = new Queue<PreviewDeployJobData>('preview-deploy', {
    connection,
    defaultJobOptions: {
      attempts: 1,                 // 不重試 — 失敗顯示給 user 讓 explicit consent retry
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  })
  return queueInstance
}

// ============================================================
// Worker creation
// ============================================================

export function createPreviewDeployWorker(
  workerRedis: Redis,
  emitter: Emitter,
): Worker<PreviewDeployJobData> {
  if (workerInstance) return workerInstance

  workerInstance = new Worker<PreviewDeployJobData>(
    'preview-deploy',
    async (job: Job<PreviewDeployJobData>) => {
      const { conversationId, projectId, projectName, code, tailwindConfig, neonConnectionString } = job.data

      const emitProgress = (percent: number, step: string) => {
        emitter.to(`conversation:${conversationId}`).emit('preview:progress', {
          conversationId, percent, step,
        })
      }

      try {
        emitProgress(5, '準備預覽部署...')

        // 主邏輯：quickPreviewDeploy（內部含 hash dedup、Vercel deploy、polling）
        emitProgress(30, '上傳至 Vercel...')
        const input = {
          conversationId, projectId, code, tailwindConfig,
          projectName, neonConnectionString,
        }
        let result = await quickPreviewDeploy(input)

        if (result.status === 'cached') {
          logger.info({ conversationId, url: result.url }, 'preview cache hit')
          emitProgress(100, '使用快取版本')
          emitter.to(`conversation:${conversationId}`).emit('preview:ready', {
            conversationId,
            url: result.url,
            deploymentId: result.deploymentId,
            cached: true,
          })
          return { status: 'cached', url: result.url }
        }

        if (result.status === 'ready') {
          emitProgress(100, '部署完成')
          emitter.to(`conversation:${conversationId}`).emit('preview:ready', {
            conversationId,
            url: result.url,
            deploymentId: result.deploymentId,
            cached: false,
          })
          return { status: 'ready', url: result.url }
        }

        // R10 治本：status === 'failed' → 進入 6 層自動修復流程
        // L1-L2 已在 preview-deployer.ts 抓 buildLog 寫進 result.errorDetails
        // L3-L5 由 runPreviewAutoFix 處理（內含 N 輪 LLM 修 + L5 heavy fallback）
        result = await runPreviewAutoFix(input, result, emitProgress)

        // L3-L5 後若 ready → emit ready；仍 failed → emit failed + 真實 buildLog
        if (result.status === 'ready') {
          emitProgress(100, '自動修復後部署完成')
          emitter.to(`conversation:${conversationId}`).emit('preview:ready', {
            conversationId,
            url: result.url,
            deploymentId: result.deploymentId,
            cached: false,
            autoFixed: true,
          })
          return { status: 'ready', url: result.url, autoFixed: true }
        }

        // 極端 case：L3-L5 全失敗 → 走 L6 UX 顯示真實 buildLog + retry 按鈕
        const lkgUrl = await findLkgPreviewUrl(conversationId, projectId)
        emitter.to(`conversation:${conversationId}`).emit('preview:failed', {
          conversationId,
          error: result.error || 'Unknown deploy error',
          errorDetails: result.errorDetails || '',
          lkgUrl,
        })
        return { status: 'failed', error: result.error }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        logger.error({ err, conversationId }, 'preview-deploy job crashed')
        const lkgUrl = await findLkgPreviewUrl(conversationId, projectId).catch(() => null)
        emitter.to(`conversation:${conversationId}`).emit('preview:failed', {
          conversationId,
          error: errorMsg,
          lkgUrl,
        })
        throw err  // bullmq mark as failed
      }
    },
    {
      connection: workerRedis,
      concurrency: 4,  // 避免炸 Vercel rate limit
    },
  )

  workerInstance.on('error', (err) => {
    logger.error({ err }, 'preview-deploy worker error')
  })

  workerInstance.on('failed', (job, err) => {
    logger.warn({ jobId: job?.id, err: err.message }, 'preview-deploy job failed')
  })

  return workerInstance
}

// ============================================================
// Producer helper: enqueue with rate limit + debounce
// ============================================================

/**
 * Fire-and-forget enqueue preview deploy. 內含：
 *   - getEnv().ENABLE_VERCEL_PREVIEW gate
 *   - Per-conversation rate limit（PREVIEW_DEPLOY_RATE_LIMIT_PER_HOUR）
 *   - Per-conversation debounce（PREVIEW_DEPLOY_DEBOUNCE_MS）— BullMQ jobId dedup + delay
 *
 * 不 throw — 任何錯誤 log + return false
 */
export async function enqueuePreviewDeploy(
  generalRedis: Redis,
  queue: Queue<PreviewDeployJobData>,
  data: PreviewDeployJobData,
  options: { bypassRateLimit?: boolean; bypassDebounce?: boolean } = {},
): Promise<{ enqueued: boolean; reason?: string }> {
  if (!getEnv().ENABLE_VERCEL_PREVIEW) {
    return { enqueued: false, reason: 'flag_off' }
  }

  const { conversationId } = data

  // Rate limit：Redis token bucket（簡化版用 sliding window count）
  // bypassRateLimit: 用戶 explicit retry 時不擋
  if (!options.bypassRateLimit) {
    const rateLimitKey = `preview-deploy:ratelimit:${conversationId}`
    const limitPerHour = getEnv().PREVIEW_DEPLOY_RATE_LIMIT_PER_HOUR
    try {
      const count = await generalRedis.incr(rateLimitKey)
      if (count === 1) await generalRedis.expire(rateLimitKey, 3600)
      if (count > limitPerHour) {
        logger.warn({ conversationId, count, limit: limitPerHour }, 'preview deploy rate limited')
        return { enqueued: false, reason: 'rate_limited' }
      }
    } catch (err) {
      logger.warn({ err: (err as Error).message }, 'rate limit check failed, allowing')
    }
  }

  // Debounce: jobId dedup — 同 conversationId 在 debounce 窗內只一個 active job
  // bypassDebounce: 用戶 explicit retry 用唯一 jobId（含 timestamp + random）立即執行不延遲
  const debounceMs = getEnv().PREVIEW_DEPLOY_DEBOUNCE_MS
  let jobId: string
  let delay = debounceMs
  if (options.bypassDebounce) {
    jobId = `preview-deploy:${conversationId}:retry:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
    delay = 0  // 立即跑
  } else {
    const bucket = Math.floor(Date.now() / debounceMs)
    jobId = `preview-deploy:${conversationId}:${bucket}`
  }

  try {
    await queue.add('deploy', data, {
      jobId,
      delay,
    })
    return { enqueued: true }
  } catch (err) {
    logger.warn({ err: (err as Error).message, conversationId }, 'preview-deploy enqueue failed')
    return { enqueued: false, reason: 'enqueue_error' }
  }
}

// ============================================================
// Helper: 從 conversation/project 拿 code + neon connection 餵 job
// ============================================================

/**
 * 從 FlowState 或 project_files 收集當前 code，組裝 PreviewDeployJobData
 * Phase handler 完成時呼叫 → enqueue
 */
export async function buildPreviewDeployData(
  conversationId: string,
  projectId: string,
  code: GeneratedCode,
  tailwindConfig?: string,
): Promise<PreviewDeployJobData | null> {
  // 取 project name + neon connection string
  const project = await db.queryOne<{ name: string; neon_connection_string: string | null }>(
    'SELECT name, neon_connection_string FROM projects WHERE id = $1',
    [projectId],
  )
  if (!project) {
    logger.warn({ projectId, conversationId }, 'buildPreviewDeployData: project not found')
    return null
  }

  return {
    conversationId,
    projectId,
    projectName: project.name,
    code,
    tailwindConfig,
    neonConnectionString: project.neon_connection_string ?? undefined,
  }
}

/**
 * Phase handler 一行 call — 自動 gate + build data + enqueue。
 * Fire-and-forget；任何錯誤 log 不 throw（不阻塞主流程）。
 *
 * 使用：phase 完成 + saveFlowState 後呼叫：
 *   triggerPreviewDeploy(conversationId, projectId, code, tailwindConfig, redis).catch(() => {})
 */
export async function triggerPreviewDeploy(
  conversationId: string,
  projectId: string | undefined,
  code: GeneratedCode,
  tailwindConfig: string,
  generalRedis: Redis,
  io?: IoEmitter,
): Promise<void> {
  if (!getEnv().ENABLE_VERCEL_PREVIEW) return
  if (!projectId) return
  try {
    const queue = getPreviewDeployQueue(generalRedis)
    const data = await buildPreviewDeployData(conversationId, projectId, code, tailwindConfig)
    if (!data) return
    const result = await enqueuePreviewDeploy(generalRedis, queue, data)
    if (!result.enqueued) {
      logger.info({ conversationId, reason: result.reason }, 'preview deploy 未 enqueue')
      return
    }

    // Inline preview 卡片注入 chat — 用戶在對話內看到「正在部署預覽 → 預覽已就緒 + 新分頁開啟按鈕」
    // 卡片實際 URL 由前端 ChatInlinePreviewCard 從 usePreviewDeployment hook 拿，避免歷史 message stale URL
    if (io) {
      try {
        await sendMessage(conversationId, io, {
          content: '已啟動預覽部署',
          stage: 'preview_card',
          richContent: {
            type: 'vercel_preview_card',
            data: { projectName: data.projectName, enqueuedAt: new Date().toISOString() },
          },
        })
      } catch (err) {
        logger.warn({ err: (err as Error).message, conversationId }, '注入 vercel_preview_card chat 失敗（不阻塞）')
      }
    }
  } catch (err) {
    logger.warn({ err: (err as Error).message, conversationId }, 'triggerPreviewDeploy 異常（不阻塞主流程）')
  }
}
