/**
 * Image Library 預熱 CLI（Legacy — 僅預熱 productType-scoped 靜態字典路徑）
 *
 * ⚠️ 注意：
 *   自 ENABLE_SMART_IMAGE_QUERIES 上線後，生產環境所有 image library fetch 都使用
 *   conversationId-scoped cache key（image-lib:v2:<conversationId>:<locale>）+ Haiku
 *   生專案級 query。這個腳本預熱的 productType-scoped key（image-lib:v2:<productType>:en）
 *   **不會被生產流量命中**。
 *
 *   保留此腳本的目的：
 *   1. 作為 Haiku API 全掛時的手動冷啟動工具（若將來加入 productType 兜底 fetch 路徑）
 *   2. 冒煙測試 Unsplash API key + 靜態字典是否正常
 *
 *   日常維運不再需要定期執行。
 *
 * 用法：
 *   pnpm tsx src/scripts/warm-image-library.ts [--type=<productType>] [--force]
 *
 * rate limit：Unsplash demo key 5000/hr；26 × 6 × 2-3 query ≈ 312-468 requests，遠低於限額。
 */

import 'dotenv/config'
import { validateEnv, getEnv } from '../lib/env'

validateEnv()

// 必須在 validateEnv 之後 dynamic import（lib 會讀 env）
;(async () => {
  const Redis = (await import('ioredis')).default
  const { setCacheRedisClient } = await import('../lib/cache')
  const { fetchImageLibrary, __internals } = await import('../services/image-library-service')

  const env = getEnv()

  if (!env.UNSPLASH_ACCESS_KEY) {
    console.error('❌ UNSPLASH_ACCESS_KEY 未設定。在 .env 加上：')
    console.error('   UNSPLASH_ACCESS_KEY=your_access_key_here')
    console.error('   （註冊：https://unsplash.com/developers）')
    process.exit(1)
  }

  const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 })
  setCacheRedisClient(redis)

  const args = process.argv.slice(2)
  let filterType: string | null = null
  let force = false
  for (const arg of args) {
    if (arg.startsWith('--type=')) filterType = arg.split('=')[1]
    else if (arg === '--force') force = true
    else if (arg === '--help' || arg === '-h') {
      console.log('用法：pnpm tsx src/scripts/warm-image-library.ts [--type=<productType>] [--force]')
      process.exit(0)
    }
  }

  const allTypes = Object.keys(__internals.PRODUCTTYPE_TO_UNSPLASH_QUERIES)
  const targetTypes = filterType
    ? allTypes.filter((t) => t === filterType)
    : allTypes

  if (targetTypes.length === 0) {
    console.error(`❌ 未知的 productType: ${filterType}`)
    console.error(`   可用: ${allTypes.join(', ')}`)
    process.exit(1)
  }

  console.log(`🔥 開始預熱 ${targetTypes.length} 個 productType${force ? '（force 刷新）' : ''}...`)
  const t0 = Date.now()
  let success = 0
  let failed = 0

  for (const productType of targetTypes) {
    const tStart = Date.now()
    try {
      const lib = await fetchImageLibrary(productType, { forceRefresh: force })
      const counts = `hero=${lib.hero.length} product=${lib.product.length} team=${lib.team.length} bg=${lib.background.length} lifestyle=${lib.lifestyle.length} detail=${lib.detail.length}`
      console.log(`✅ ${productType.padEnd(14)} (${Date.now() - tStart}ms) ${counts}`)
      success++
    } catch (err) {
      console.error(`❌ ${productType.padEnd(14)} 失敗: ${(err as Error).message}`)
      failed++
    }
    // 輕量 throttle，避免 1 秒打太多 request
    await new Promise((r) => setTimeout(r, 200))
  }

  console.log('')
  console.log(`完成：成功 ${success}, 失敗 ${failed}，耗時 ${((Date.now() - t0) / 1000).toFixed(1)}s`)

  await redis.quit()
  process.exit(failed > 0 ? 1 : 0)
})().catch((err) => {
  console.error('❌ 預熱腳本異常:', err)
  process.exit(1)
})
