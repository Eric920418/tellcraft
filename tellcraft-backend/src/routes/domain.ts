/**
 * Domain API 路由
 * 域名管理 REST API（查詢 / DNS CRUD / 解除綁定）
 */
import { Router } from 'express'
import { requireAuth, requirePlan } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { checkDomainSchema, createDnsRecordSchema } from '../schemas/domain'
import {
  checkDomainAvailability,
  checkDomainQuota,
  getDomainPricing,
  listUserDomains,
  getDomainRecord,
  listDnsRecords,
  createDnsRecord,
  deleteDnsRecord,
  removeDomainBinding,
} from '../services/domain-service'
import { getDomainLimit } from '../config/plans'
import { createLogger } from '../lib/logger'

const logger = createLogger('domain-routes')

const router: Router = Router()

// 所有路由前置認證 + 付費方案限制
router.use(requireAuth)
router.use(requirePlan('creator', 'pro', 'business'))

// ============================================================
// 域名查詢
// ============================================================

/**
 * POST /api/domain/check
 * 查詢域名可用性
 */
router.post('/check', validateBody(checkDomainSchema), async (req, res) => {
  try {
    const { domain } = req.body as { domain: string }
    const quota = await checkDomainQuota(req.user!.id, req.user!.plan)
    const result = await checkDomainAvailability(domain)
    res.json({ success: true, data: result, quota: { allowed: quota.allowed, current: quota.current, limit: quota.limit } })
  } catch (err) {
    logger.error({ err }, '域名查詢失敗')
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : '域名查詢失敗' })
  }
})

/**
 * GET /api/domain/pricing
 * 域名價格
 */
router.get('/pricing', async (_req, res) => {
  try {
    const result = await getDomainPricing()
    res.json({ success: true, data: result })
  } catch (err) {
    logger.error({ err }, '價格查詢失敗')
    res.status(500).json({ success: false, error: '價格查詢失敗' })
  }
})

// ============================================================
// 域名列表 + 詳情
// ============================================================

/**
 * GET /api/domain/list
 * 列出用戶所有域名
 */
router.get('/list', async (req, res) => {
  try {
    const userId = req.user!.id
    const plan = req.user!.plan
    const domains = await listUserDomains(userId)
    const limit = getDomainLimit(plan)
    res.json({ success: true, data: domains, quota: { current: domains.length, limit } })
  } catch (err) {
    logger.error({ err }, '域名列表查詢失敗')
    res.status(500).json({ success: false, error: '查詢失敗' })
  }
})

/**
 * GET /api/domain/:domainId
 * 域名詳情
 */
router.get('/:domainId', async (req, res) => {
  try {
    const record = await getDomainRecord(req.params.domainId)
    if (!record) {
      res.status(404).json({ success: false, error: '域名記錄不存在' })
      return
    }
    // 權限檢查
    const userId = req.user!.id
    if (record.user_id !== userId) {
      res.status(403).json({ success: false, error: '無權訪問此域名' })
      return
    }
    res.json({ success: true, data: record })
  } catch (err) {
    logger.error({ err }, '域名詳情查詢失敗')
    res.status(500).json({ success: false, error: '查詢失敗' })
  }
})

// ============================================================
// DNS 記錄 CRUD
// ============================================================

/**
 * GET /api/domain/:domainId/dns
 * 列出 DNS 記錄
 */
router.get('/:domainId/dns', async (req, res) => {
  try {
    const record = await getDomainRecord(req.params.domainId)
    if (!record) {
      res.status(404).json({ success: false, error: '域名記錄不存在' })
      return
    }
    const userId = req.user!.id
    if (record.user_id !== userId) {
      res.status(403).json({ success: false, error: '無權訪問' })
      return
    }
    if (!record.cloudflare_zone_id) {
      res.json({ success: true, data: [] })
      return
    }
    const records = await listDnsRecords(record.cloudflare_zone_id)
    res.json({ success: true, data: records })
  } catch (err) {
    logger.error({ err }, 'DNS 記錄查詢失敗')
    res.status(500).json({ success: false, error: 'DNS 查詢失敗' })
  }
})

/**
 * POST /api/domain/:domainId/dns
 * 新增 DNS 記錄
 */
router.post('/:domainId/dns', validateBody(createDnsRecordSchema), async (req, res) => {
  try {
    const record = await getDomainRecord(req.params.domainId)
    if (!record) {
      res.status(404).json({ success: false, error: '域名記錄不存在' })
      return
    }
    const userId = req.user!.id
    if (record.user_id !== userId) {
      res.status(403).json({ success: false, error: '無權操作' })
      return
    }
    if (!record.cloudflare_zone_id) {
      res.status(400).json({ success: false, error: '此域名沒有 Cloudflare Zone' })
      return
    }
    const dnsRecord = await createDnsRecord(record.cloudflare_zone_id, req.body)
    res.json({ success: true, data: dnsRecord })
  } catch (err) {
    logger.error({ err }, 'DNS 記錄建立失敗')
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'DNS 記錄建立失敗' })
  }
})

/**
 * DELETE /api/domain/:domainId/dns/:recordId
 * 刪除 DNS 記錄
 */
router.delete('/:domainId/dns/:recordId', async (req, res) => {
  try {
    const record = await getDomainRecord(req.params.domainId)
    if (!record) {
      res.status(404).json({ success: false, error: '域名記錄不存在' })
      return
    }
    const userId = req.user!.id
    if (record.user_id !== userId) {
      res.status(403).json({ success: false, error: '無權操作' })
      return
    }
    if (!record.cloudflare_zone_id) {
      res.status(400).json({ success: false, error: '此域名沒有 Cloudflare Zone' })
      return
    }
    await deleteDnsRecord(record.cloudflare_zone_id, req.params.recordId)
    res.json({ success: true })
  } catch (err) {
    logger.error({ err }, 'DNS 記錄刪除失敗')
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'DNS 記錄刪除失敗' })
  }
})

// ============================================================
// 解除域名綁定
// ============================================================

/**
 * DELETE /api/domain/:domainId
 * 解除域名綁定（清除 Vercel + Cloudflare）
 */
router.delete('/:domainId', async (req, res) => {
  try {
    const record = await getDomainRecord(req.params.domainId)
    if (!record) {
      res.status(404).json({ success: false, error: '域名記錄不存在' })
      return
    }
    const userId = req.user!.id
    if (record.user_id !== userId) {
      res.status(403).json({ success: false, error: '無權操作' })
      return
    }
    await removeDomainBinding(req.params.domainId)
    res.json({ success: true })
  } catch (err) {
    logger.error({ err }, '域名解除綁定失敗')
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : '解除綁定失敗' })
  }
})

export default router
