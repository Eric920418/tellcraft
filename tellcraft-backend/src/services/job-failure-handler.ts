/**
 * BullMQ 最終失敗處理
 * 持久化到 DB + 通知用戶 + FATAL log
 */

import { Job } from 'bullmq'
import { Server as SocketIOServer } from 'socket.io'
import { query } from '../db/client'
import { sendMessage } from '../workers/orchestrator-utils'
import { createLogger } from '../lib/logger'

const logger = createLogger('job-failure')

/**
 * 只在 job 用完所有重試後觸發
 */
export async function handleJobFinalFailure(
  job: Job | undefined,
  err: Error,
  io: SocketIOServer
): Promise<void> {
  if (!job) return

  const maxAttempts = job.opts.attempts || 3
  if (job.attemptsMade < maxAttempts) return

  const conversationId = job.data?.conversationId as string | undefined
  const userId = job.data?.userId as string | undefined
  const errorMessage = err?.message || 'Unknown error'

  // 1. FATAL log（觸發 PM2/CloudWatch 告警）
  logger.fatal({
    jobId: job.id,
    jobName: job.name,
    conversationId,
    userId,
    attempts: job.attemptsMade,
    error: errorMessage,
  }, 'Job exhausted all retries')

  // 2. 持久化到 DB
  try {
    await query(
      `INSERT INTO job_failures (job_id, job_name, conversation_id, user_id, error, job_data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        job.id || null,
        job.name,
        conversationId || null,
        userId || null,
        errorMessage,
        JSON.stringify(job.data || {}),
      ]
    )
  } catch (dbErr) {
    logger.error({ err: dbErr }, 'Failed to persist job failure to DB')
  }

  // 3. 通知用戶
  if (conversationId) {
    try {
      await sendMessage(conversationId, io, {
        content: '抱歉，處理過程遇到問題。請稍後再試，或點擊下方按鈕重新開始。',
        stage: 'error',
        quickReplies: [
          { label: '🔄 重試', value: '__retry__', style: 'primary' },
          { label: '🆕 開始新專案', value: '__new_project__', style: 'ghost' },
        ],
      })
    } catch (notifyErr) {
      logger.error({ err: notifyErr }, 'Failed to notify user about job failure')
    }
  }
}
