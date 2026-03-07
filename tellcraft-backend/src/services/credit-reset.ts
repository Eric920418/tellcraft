// ============================================================
// Credit 月重置定時任務
// ============================================================
//
// 每小時掃描一次，重置超過 1 個月週期的用戶 Credit。
//
// 條件：subscription_period_start + 1 month <= NOW()
// 動作：credits_used_this_period = 0, subscription_period_start = NOW()
//
// 安全機制：
//   - 跳過 cancelled 狀態的用戶
//   - 每批最多 100 個
//   - 單個失敗不影響其他
// ============================================================

import { queryMany, query } from '../db/client'
import { createLogger } from '../lib/logger'

const logger = createLogger('credit-reset')

export async function resetExpiredCredits(): Promise<void> {
  const startTime = Date.now()

  try {
    // 找出需要重置的用戶
    const expiredUsers = await queryMany<{ id: string; email: string }>(
      `SELECT id, email FROM users
       WHERE subscription_status != 'cancelled'
         AND subscription_period_start + INTERVAL '1 month' <= NOW()
       LIMIT 100`
    )

    if (expiredUsers.length === 0) {
      return
    }

    logger.info({ count: expiredUsers.length }, '找到需要重置的用戶')

    let resetCount = 0

    for (const user of expiredUsers) {
      try {
        await query(
          `UPDATE users
           SET credits_used_this_period = 0,
               subscription_period_start = NOW()
           WHERE id = $1`,
          [user.id]
        )
        resetCount++
      } catch (err) {
        logger.error({ err, email: user.email }, '重置用戶失敗')
      }
    }

    const duration = Date.now() - startTime
    logger.info({ resetCount, total: expiredUsers.length, durationMs: duration }, '重置完成')
  } catch (err) {
    logger.error({ err }, '查詢失敗')
  }
}
