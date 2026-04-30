/**
 * Image Library 端到端冒煙驗證
 *
 * 用途：跑完整生產路徑（Haiku 生 query → Unsplash search → 6 類組裝），
 * 但繞過 worker / phase handler / FlowState，5 秒看到結果。
 *
 * 用法：
 *   pnpm tsx src/scripts/verify-image-library.ts
 *   pnpm tsx src/scripts/verify-image-library.ts --type=restaurant --desc="Italian trattoria pasta pizza"
 *
 * 通過判準：
 *   - source: unsplash（不是 picsum_fallback）
 *   - hero[0].alt 含專案語意詞（italian / pasta / trattoria 等）
 *   - 各類 count > 0
 */

import 'dotenv/config'
import { validateEnv } from '../lib/env'

validateEnv()

;(async () => {
  const Redis = (await import('ioredis')).default
  const { setCacheRedisClient } = await import('../lib/cache')
  const { fetchImageLibrary, buildPicsumFallbackLibrary } = await import('../services/image-library-service')

  const args = process.argv.slice(2)
  let productType = 'restaurant'
  let primaryDescription = 'Italian trattoria specializing in handmade pasta, wood-fired pizza, warm dim lighting'
  for (const arg of args) {
    if (arg.startsWith('--type=')) productType = arg.split('=')[1]
    else if (arg.startsWith('--desc=')) primaryDescription = arg.split('=')[1]
  }

  const env = (await import('../lib/env')).getEnv()
  console.log('=== 環境檢查 ===')
  console.log('UNSPLASH_ACCESS_KEY:', env.UNSPLASH_ACCESS_KEY ? `set (${env.UNSPLASH_ACCESS_KEY.slice(0, 6)}...)` : '❌ NOT SET')
  console.log('ENABLE_UNSPLASH_LIBRARY:', env.ENABLE_UNSPLASH_LIBRARY)
  console.log('ENABLE_SMART_IMAGE_QUERIES:', env.ENABLE_SMART_IMAGE_QUERIES)
  console.log('ANTHROPIC_API_KEY:', env.ANTHROPIC_API_KEY ? 'set' : '❌ NOT SET')
  console.log('')

  if (!env.UNSPLASH_ACCESS_KEY) {
    console.log('❌ 缺 UNSPLASH_ACCESS_KEY，整個 image library 會走 picsum fallback。')
    console.log('   → 去 https://unsplash.com/developers 註冊免費 demo key，加到 .env')
    process.exit(1)
  }

  const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 })
  setCacheRedisClient(redis)

  console.log('=== 測試輸入 ===')
  console.log('productType:', productType)
  console.log('primaryDescription:', primaryDescription)
  console.log('')

  try {
    console.log('=== 跑 fetchImageLibrary（含 Haiku 生 query → Unsplash search）...')
    const t0 = Date.now()
    const lib = await fetchImageLibrary(productType, {
      forceRefresh: true,
      cacheKey: `verify-${Date.now()}`,
      queryContext: {
        productType,
        primaryDescription,
      },
    })
    const dt = Date.now() - t0

    console.log(`✅ 完成（${dt}ms）`)
    console.log('')
    console.log('=== 結果 ===')
    console.log('source:', lib.source)
    console.log('counts:',
      `hero=${lib.hero.length}`,
      `product=${lib.product.length}`,
      `team=${lib.team.length}`,
      `bg=${lib.background.length}`,
      `lifestyle=${lib.lifestyle.length}`,
      `detail=${lib.detail.length}`,
    )
    console.log('')

    console.log('=== 樣本 alt（看是否與描述語意相關）===')
    for (const cat of ['hero', 'product', 'lifestyle'] as const) {
      const arr = lib[cat]
      console.log(`[${cat}]`)
      arr.slice(0, 3).forEach((a, i) => {
        console.log(`  ${i + 1}. ${a.alt}`)
        console.log(`     ${a.url.slice(0, 100)}...`)
      })
    }
    console.log('')

    if (lib.source === 'picsum_fallback') {
      console.log('⚠️  source=picsum_fallback — Unsplash 路徑失敗（看上方 warn log 找原因）')
      process.exit(2)
    }

    console.log('✅ 完成。如果 alt 文字與你的 primaryDescription 語意相關，整條 pipeline 已通。')
    console.log('   下一步：跑一次真實 Fast Build / UIUX 流程，看生成的 page.tsx <img src> 是否為 images.unsplash.com。')
  } catch (err) {
    console.error('❌ fetchImageLibrary throw：', (err as Error).message)
    console.error((err as Error).stack)
    process.exit(1)
  } finally {
    await redis.quit()
  }
})().catch((err) => {
  console.error('腳本異常:', err)
  process.exit(1)
})
