// ============================================================
// Domain Phase Handlers
// 域名購買/綁定/管理的 Orchestrator 整合
// ============================================================

import type Redis from 'ioredis'
import type { FlowState, PhaseContext, IoEmitter } from '../../types/flow-state'
import type { SkillName } from '../../services/registry'
import { sendMessage, saveFlowState, deleteFlowState, getFlowState } from '../orchestrator-utils'
import {
  checkDomainAvailability,
  checkDomainQuota,
  createDomainRecord,
  executePurchaseWorkflow,
  executeOwnDomainWorkflow,
  verifyDnsPropagation,
  updateDomainRecord,
  getDomainRecord,
  listUserDomains,
} from '../../services/domain-service'
import type { RegistrantInfo } from '../../schemas/domain'
import { createLogger } from '../../lib/logger'
import * as db from '../../db/client'

const logger = createLogger('domain-phases')

// 域名提取正則（從用戶訊息中提取域名）
const DOMAIN_REGEX = /([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}/g

export function extractDomain(message: string): string | null {
  const matches = message.match(DOMAIN_REGEX)
  if (!matches) return null
  // 過濾常見非域名 URL
  return matches.find(m => !m.startsWith('http') && !m.includes('tellcraft') && !m.includes('vercel')) || matches[0] || null
}

interface DomainSkillInput {
  taskId: string
  projectId: string
  conversationId: string
  userId: string
  message: string
  skillName: SkillName
  redis: Redis
  io: IoEmitter
  locale?: 'zh' | 'en'
}

// ============================================================
// 入口：executeDomainSkill
// ============================================================

export async function executeDomainSkill(input: DomainSkillInput): Promise<void> {
  const { conversationId, projectId, userId, message, skillName, redis, io, locale } = input
  const isChinese = locale !== 'en'

  // 檢查是否有已部署的 Vercel project
  const project = await db.queryOne<{ vercel_url: string | null; vercel_project_id: string | null }>(
    'SELECT vercel_url, vercel_project_id FROM projects WHERE id = $1',
    [projectId]
  )

  if (!project?.vercel_project_id) {
    await sendMessage(conversationId, io, {
      content: isChinese
        ? '請先部署您的網站，才能綁定自訂域名。部署完成後再回來設定域名。'
        : 'Please deploy your website first before binding a custom domain. Come back after deployment.',
      stage: 'info',
      quickReplies: [
        { label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' as const },
      ],
    })
    return
  }

  // 取得用戶方案
  const userRow = await db.queryOne<{ plan: string }>('SELECT plan FROM users WHERE id = $1', [userId])
  const userPlan = userRow?.plan || 'free'

  // 免費用戶直接擋
  if (userPlan === 'free') {
    await sendMessage(conversationId, io, {
      content: isChinese
        ? '自訂域名功能僅限付費會員使用。\n\n升級方案後即可綁定域名：\n- **Creator** — 1 個域名\n- **Pro** — 2 個域名\n- **Business** — 3 個域名'
        : 'Custom domain is available for paid plans only.\n\nUpgrade to bind domains:\n- **Creator** — 1 domain\n- **Pro** — 2 domains\n- **Business** — 3 domains',
      stage: 'info',
    })
    return
  }

  // 檢查域名配額（domain-manager 列表不受限，只有新增操作受限）
  if (skillName !== 'domain-manager') {
    const quota = await checkDomainQuota(userId, userPlan)
    if (!quota.allowed) {
      await sendMessage(conversationId, io, {
        content: isChinese
          ? `您已達到域名數量上限（${quota.current}/${quota.limit}）。\n\n${userPlan === 'business' ? '如需更多域名，請聯繫支援。' : '升級方案可獲得更多域名額度：\n- **Creator** — 1 個域名\n- **Pro** — 2 個域名\n- **Business** — 3 個域名'}`
          : `You've reached your domain limit (${quota.current}/${quota.limit}).\n\n${userPlan === 'business' ? 'Contact support for more domains.' : 'Upgrade for more domains:\n- **Creator** — 1 domain\n- **Pro** — 2 domains\n- **Business** — 3 domains'}`,
        stage: 'info',
      })
      return
    }
  }

  const vercelProjectId = project.vercel_project_id

  // 根據 skillName 分流
  switch (skillName) {
    case 'domain-purchase': {
      const domain = extractDomain(message)
      if (domain) {
        await startDomainSearch(conversationId, projectId, userId, domain, vercelProjectId, redis, io, locale)
      } else {
        await sendMessage(conversationId, io, {
          content: isChinese
            ? '請告訴我您想購買的域名，例如：「買 mysite.com」'
            : 'Please tell me the domain you want to purchase, e.g., "buy mysite.com"',
          stage: 'info',
        })
        // 設定 FlowState 等待用戶輸入域名
        const state: FlowState = {
          phase: 'domain_confirm_purchase',
          currentRound: 0,
          questionIndex: 0,
          batchCount: 0,
          waitingForReply: true,
          totalQuestionsAsked: 0,
          taskId: input.taskId,
          projectId,
          userId,
          locale,
          domainSource: 'purchased',
          domainVercelProjectId: vercelProjectId,
        }
        await saveFlowState(redis, conversationId, state)
      }
      break
    }

    case 'domain-dns': {
      const domain = extractDomain(message)
      if (domain) {
        await startOwnDomainSetup(conversationId, projectId, userId, domain, vercelProjectId, redis, io, locale, input.taskId)
      } else {
        await sendMessage(conversationId, io, {
          content: isChinese
            ? '請告訴我您要綁定的域名，例如：「綁定 mysite.com」'
            : 'Please tell me the domain to bind, e.g., "bind mysite.com"',
          stage: 'info',
        })
        const state: FlowState = {
          phase: 'domain_own_setup',
          currentRound: 0,
          questionIndex: 0,
          batchCount: 0,
          waitingForReply: true,
          totalQuestionsAsked: 0,
          taskId: input.taskId,
          projectId,
          userId,
          locale,
          domainSource: 'own',
          domainVercelProjectId: vercelProjectId,
        }
        await saveFlowState(redis, conversationId, state)
      }
      break
    }

    case 'domain-manager':
    default: {
      // 列出已有域名或引導
      const domains = await listUserDomains(userId)
      if (domains.length > 0) {
        const domainList = domains.map(d =>
          `- **${d.domain}** — ${d.status}${d.status === 'active' ? ' ✓' : ''}`
        ).join('\n')

        await sendMessage(conversationId, io, {
          content: isChinese
            ? `您的域名：\n${domainList}\n\n您可以購買新域名或綁定已有域名。`
            : `Your domains:\n${domainList}\n\nYou can purchase a new domain or bind an existing one.`,
          stage: 'info',
          quickReplies: [
            { label: isChinese ? '購買新域名' : 'Buy Domain', value: isChinese ? '購買域名' : 'buy a domain', style: 'primary' as const },
            { label: isChinese ? '綁定已有域名' : 'Bind Own Domain', value: isChinese ? '綁定自己的域名' : 'bind my own domain', style: 'secondary' as const },
          ],
        })
      } else {
        await sendMessage(conversationId, io, {
          content: isChinese
            ? '您還沒有綁定任何域名。您可以：\n- **購買新域名** — 直接在平台上購買並自動設定\n- **綁定已有域名** — 使用您自己的域名'
            : 'You don\'t have any domains yet. You can:\n- **Buy a new domain** — purchase and auto-configure\n- **Bind an existing domain** — use your own domain',
          stage: 'info',
          quickReplies: [
            { label: isChinese ? '購買新域名' : 'Buy Domain', value: isChinese ? '購買域名' : 'buy a domain', style: 'primary' as const },
            { label: isChinese ? '綁定已有域名' : 'Bind Own Domain', value: isChinese ? '綁定自己的域名' : 'bind my own domain', style: 'secondary' as const },
          ],
        })
      }
      break
    }
  }
}

// ============================================================
// 域名搜尋
// ============================================================

async function startDomainSearch(
  conversationId: string,
  projectId: string,
  userId: string,
  domain: string,
  vercelProjectId: string,
  redis: Redis,
  io: IoEmitter,
  locale?: 'zh' | 'en'
): Promise<void> {
  const isChinese = locale !== 'en'

  await sendMessage(conversationId, io, {
    content: isChinese ? `正在查詢 **${domain}** 的可用性...` : `Checking availability of **${domain}**...`,
    stage: 'domain_searching' as string,
  })

  try {
    const result = await checkDomainAvailability(domain)

    if (result.available) {
      // 建立 domain record
      const domainId = await createDomainRecord({ projectId, userId, domain, source: 'purchased', vercelProjectId })

      const state: FlowState = {
        phase: 'domain_confirm_purchase',
        currentRound: 0,
        questionIndex: 0,
        batchCount: 0,
        waitingForReply: true,
        totalQuestionsAsked: 0,
        projectId,
        userId,
        locale,
        domainId,
        domainName: domain,
        domainSource: 'purchased',
        domainPrice: result.price || undefined,
        domainVercelProjectId: vercelProjectId,
      }
      await saveFlowState(redis, conversationId, state)

      await sendMessage(conversationId, io, {
        content: isChinese
          ? `**${domain}** 可以註冊！${result.price ? `\n\n價格：**${result.price}/年**` : ''}\n\n⚠️ 域名一旦購買**無法退款**，請確認後再繼續。\n\n確認購買嗎？`
          : `**${domain}** is available!${result.price ? `\n\nPrice: **${result.price}/year**` : ''}\n\n⚠️ Domain purchases are **non-refundable**. Please confirm before proceeding.\n\nProceed with purchase?`,
        stage: 'domain_confirm_purchase',
        richContent: {
          type: 'domain_search_result',
          data: { domain, available: true, price: result.price, source: result.source } as Record<string, unknown>,
        },
        quickReplies: [
          { label: isChinese ? '確認購買' : 'Buy', value: isChinese ? '確認購買' : 'confirm purchase', style: 'primary' as const },
          { label: isChinese ? '換一個域名' : 'Try Another', value: isChinese ? '換一個域名' : 'try another domain', style: 'secondary' as const },
          { label: isChinese ? '取消' : 'Cancel', value: '__cancel_domain__', style: 'ghost' as const },
        ],
      })
    } else {
      await sendMessage(conversationId, io, {
        content: isChinese
          ? `**${domain}** 已被註冊，無法購買。\n\n請試試其他域名，或選擇綁定您自己的域名。`
          : `**${domain}** is already registered.\n\nTry a different domain, or bind your own domain.`,
        stage: 'info',
        richContent: {
          type: 'domain_search_result',
          data: { domain, available: false } as Record<string, unknown>,
        },
        quickReplies: [
          { label: isChinese ? '綁定已有域名' : 'Bind Own Domain', value: isChinese ? '綁定自己的域名' : 'bind my own domain', style: 'secondary' as const },
          { label: isChinese ? '取消' : 'Cancel', value: '__cancel_domain__', style: 'ghost' as const },
        ],
      })
    }
  } catch (err) {
    logger.error({ domain, err: String(err) }, '域名查詢失敗')
    await sendMessage(conversationId, io, {
      content: isChinese
        ? `查詢 ${domain} 時發生錯誤，請稍後再試。`
        : `Error checking ${domain}. Please try again later.`,
      stage: 'error',
    })
  }
}

// ============================================================
// 自有域名設定入口
// ============================================================

async function startOwnDomainSetup(
  conversationId: string,
  projectId: string,
  userId: string,
  domain: string,
  vercelProjectId: string,
  redis: Redis,
  io: IoEmitter,
  locale?: 'zh' | 'en',
  taskId?: string
): Promise<void> {
  const domainId = await createDomainRecord({ projectId, userId, domain, source: 'own', vercelProjectId })

  const state: FlowState = {
    phase: 'domain_own_setup',
    currentRound: 0,
    questionIndex: 0,
    batchCount: 0,
    waitingForReply: false,
    totalQuestionsAsked: 0,
    taskId,
    projectId,
    userId,
    locale,
    domainId,
    domainName: domain,
    domainSource: 'own',
    domainVercelProjectId: vercelProjectId,
  }
  await saveFlowState(redis, conversationId, state)

  await executeOwnDomainWorkflow({
    domainId, domain, vercelProjectId, conversationId, redis, io, locale,
  })
}

// ============================================================
// Phase Handlers（由 phase-router 呼叫）
// ============================================================

export async function handleDomainConfirmPurchase(ctx: PhaseContext): Promise<void> {
  const { conversationId, message, state, redis, io } = ctx
  const isChinese = state.locale !== 'en'
  const trimmed = message.trim()

  // 取消
  if (trimmed === '__cancel_domain__' || /^(取消|不要|不買|算了|cancel)$/i.test(trimmed)) {
    await deleteFlowState(redis, conversationId)
    await sendMessage(conversationId, io, {
      content: isChinese ? '已取消域名操作。' : 'Domain operation cancelled.',
      stage: 'info',
    })
    return
  }

  // 換域名 → 提取新域名重新搜尋
  if (/換|另一個|try another|其他|different/i.test(trimmed)) {
    const newDomain = extractDomain(trimmed)
    if (newDomain) {
      await startDomainSearch(
        conversationId, state.projectId!, state.userId!,
        newDomain, state.domainVercelProjectId!,
        redis, io, state.locale
      )
    } else {
      await sendMessage(conversationId, io, {
        content: isChinese
          ? '請告訴我您想查詢的域名，例如：「查 mysite.com」'
          : 'Please tell me the domain to check, e.g., "check mysite.com"',
        stage: 'info',
      })
    }
    return
  }

  // 確認購買 → 需要 registrant 資訊
  if (/確認|購買|買|buy|confirm|proceed|yes|是|好/i.test(trimmed)) {
    if (!state.domainName || !state.domainId) {
      // 沒有域名資訊 → 可能是直接進入 phase 但沒有域名
      const domain = extractDomain(trimmed)
      if (domain) {
        await startDomainSearch(
          conversationId, state.projectId!, state.userId!,
          domain, state.domainVercelProjectId!,
          redis, io, state.locale
        )
      } else {
        await sendMessage(conversationId, io, {
          content: isChinese ? '請告訴我您想購買的域名。' : 'Please tell me the domain you want to purchase.',
          stage: 'info',
        })
      }
      return
    }

    // 顯示 registrant 表單
    state.waitingForReply = true
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: isChinese
        ? `購買 **${state.domainName}** 需要填寫註冊人資訊。請在下方表單填寫後提交。`
        : `Purchasing **${state.domainName}** requires registrant information. Please fill in the form below.`,
      stage: 'domain_confirm_purchase',
      richContent: {
        type: 'domain_registrant_form',
        data: { domain: state.domainName, price: state.domainPrice } as Record<string, unknown>,
      },
    })
    return
  }

  // 嘗試解析 registrant JSON（前端表單提交）
  if (trimmed.startsWith('{') && trimmed.includes('firstName')) {
    try {
      const registrant = JSON.parse(trimmed) as RegistrantInfo
      if (!registrant.firstName || !registrant.lastName || !registrant.email) {
        throw new Error('缺少必填欄位')
      }

      // 開始購買流程
      state.phase = 'domain_registering'
      state.waitingForReply = false
      state.domainRegistrationStartedAt = Date.now()
      state.domainRegistrant = registrant
      await saveFlowState(redis, conversationId, state)

      await sendMessage(conversationId, io, {
        content: isChinese
          ? `正在購買 **${state.domainName}**，請稍候...`
          : `Purchasing **${state.domainName}**, please wait...`,
        stage: 'domain_registering',
        richContent: {
          type: 'domain_progress',
          data: { domain: state.domainName, step: 'register', status: 'running' } as Record<string, unknown>,
        },
      })

      await executePurchaseWorkflow({
        domainId: state.domainId!,
        domain: state.domainName!,
        registrant,
        vercelProjectId: state.domainVercelProjectId!,
        conversationId,
        projectId: state.projectId!,
        userId: state.userId!,
        redis,
        io,
        locale: state.locale,
      })
    } catch (err) {
      await sendMessage(conversationId, io, {
        content: isChinese
          ? `註冊人資訊格式有誤：${err instanceof Error ? err.message : '請重新填寫'}`
          : `Invalid registrant info: ${err instanceof Error ? err.message : 'Please try again'}`,
        stage: 'error',
      })
    }
    return
  }

  // 其他情況 → 可能是用戶輸入了新域名
  const domain = extractDomain(trimmed)
  if (domain) {
    await startDomainSearch(
      conversationId, state.projectId!, state.userId!,
      domain, state.domainVercelProjectId!,
      redis, io, state.locale
    )
  } else {
    await sendMessage(conversationId, io, {
      content: isChinese
        ? '請輸入要查詢的域名（如 mysite.com），或選擇上方選項。'
        : 'Enter a domain to check (e.g. mysite.com), or use the options above.',
      stage: 'info',
    })
  }
}

export async function handleDomainOwnSetup(ctx: PhaseContext): Promise<void> {
  const { conversationId, message, state, redis, io } = ctx
  const isChinese = state.locale !== 'en'
  const trimmed = message.trim()

  // 取消
  if (trimmed === '__cancel_domain__' || /^(取消|cancel)$/i.test(trimmed)) {
    await deleteFlowState(redis, conversationId)
    await sendMessage(conversationId, io, {
      content: isChinese ? '已取消域名綁定。' : 'Domain binding cancelled.',
      stage: 'info',
    })
    return
  }

  // 如果還沒有域名（等待用戶輸入）
  if (!state.domainName) {
    const domain = extractDomain(trimmed)
    if (domain) {
      await startOwnDomainSetup(
        conversationId, state.projectId!, state.userId!,
        domain, state.domainVercelProjectId!,
        redis, io, state.locale, state.taskId
      )
    } else {
      await sendMessage(conversationId, io, {
        content: isChinese
          ? '請輸入您要綁定的域名，例如 mysite.com'
          : 'Please enter the domain to bind, e.g. mysite.com',
        stage: 'info',
      })
    }
    return
  }

  // 用戶確認已設定 DNS → 驗證
  if (/設定好|done|完成|確認|ok|yes|好了/i.test(trimmed)) {
    state.phase = 'domain_dns_verifying'
    state.waitingForReply = false
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: isChinese
        ? '正在驗證 DNS 設定，這可能需要幾分鐘...'
        : 'Verifying DNS configuration, this may take a few minutes...',
      stage: 'domain_dns_verifying',
    })

    const verified = await verifyDnsPropagation(state.domainName, 3, 30000)

    if (verified) {
      if (state.domainId) {
        await updateDomainRecord(state.domainId, {
          status: 'active',
          vercel_domain_verified: true,
          completed_steps: ['vercel_bound', 'dns_verified'],
        })
      }

      state.phase = 'domain_complete'
      state.waitingForReply = true
      state.domainCompletedSteps = ['vercel_bound', 'dns_verified']
      await saveFlowState(redis, conversationId, state)

      await sendMessage(conversationId, io, {
        content: isChinese
          ? `✅ DNS 驗證通過！**${state.domainName}** 已成功綁定到您的網站。\n\n您的網站現在可以通過 https://${state.domainName} 訪問。`
          : `✅ DNS verified! **${state.domainName}** is now bound to your site.\n\nYour site is accessible at https://${state.domainName}.`,
        stage: 'domain_complete',
        richContent: {
          type: 'domain_complete_result',
          data: { domain: state.domainName, verified: true } as Record<string, unknown>,
        },
        quickReplies: [
          { label: isChinese ? '開始新專案' : 'New Project', value: '__new_project__', style: 'ghost' as const },
        ],
      })
    } else {
      state.phase = 'domain_own_setup'
      state.waitingForReply = true
      await saveFlowState(redis, conversationId, state)

      await sendMessage(conversationId, io, {
        content: isChinese
          ? `DNS 尚未傳播完成。這是正常的，DNS 傳播可能需要 24-48 小時。\n\n請確認您已正確設定以下記錄：\n- A @ → 76.76.21.21\n- CNAME www → cname.vercel-dns.com\n\n設定正確後，等待傳播完成即可。要再驗證一次嗎？`
          : `DNS hasn't propagated yet. This is normal — it can take 24-48 hours.\n\nPlease verify you've set:\n- A @ → 76.76.21.21\n- CNAME www → cname.vercel-dns.com\n\nWant to verify again?`,
        stage: 'domain_own_setup',
        quickReplies: [
          { label: isChinese ? '再驗證一次' : 'Verify Again', value: isChinese ? '設定好了' : 'done', style: 'primary' as const },
          { label: isChinese ? '稍後再說' : 'Later', value: '__cancel_domain__', style: 'ghost' as const },
        ],
      })
    }
    return
  }

  // 其他情況
  await sendMessage(conversationId, io, {
    content: isChinese
      ? '請在您的域名管理後台設定 DNS 記錄後，告訴我「設定好了」。'
      : 'After setting DNS records in your domain registrar, tell me "done".',
    stage: 'info',
    quickReplies: [
      { label: isChinese ? '設定好了' : 'Done', value: isChinese ? '設定好了' : 'done', style: 'primary' as const },
      { label: isChinese ? '取消' : 'Cancel', value: '__cancel_domain__', style: 'ghost' as const },
    ],
  })
}

export async function handleDomainDnsVerifying(ctx: PhaseContext): Promise<void> {
  const { conversationId, state, io } = ctx
  const isChinese = state.locale !== 'en'

  await sendMessage(conversationId, io, {
    content: isChinese
      ? '正在驗證 DNS 設定中，請稍候...'
      : 'DNS verification in progress, please wait...',
    stage: 'info',
  })
}

export async function handleDomainComplete(ctx: PhaseContext): Promise<void> {
  const { conversationId, message, state, redis, io } = ctx
  const isChinese = state.locale !== 'en'
  const trimmed = message.trim()

  if (trimmed === '__new_project__') {
    await deleteFlowState(redis, conversationId)
    await sendMessage(conversationId, io, {
      content: isChinese ? '好的！請描述您想做的新產品。' : 'Sure! Describe the new product you\'d like to build.',
      stage: 'info',
    })
    return
  }

  await sendMessage(conversationId, io, {
    content: isChinese
      ? '域名已綁定完成。您可以開始新專案或管理現有域名。'
      : 'Domain binding is complete. You can start a new project or manage your domains.',
    stage: 'info',
    quickReplies: [
      { label: isChinese ? '開始新專案' : 'New Project', value: '__new_project__', style: 'ghost' as const },
    ],
  })
}

export async function handleDomainFailed(ctx: PhaseContext): Promise<void> {
  const { conversationId, message, state, redis, io } = ctx
  const isChinese = state.locale !== 'en'
  const trimmed = message.trim()

  // 重試
  if (trimmed === '__retry_domain__' || /重試|retry/i.test(trimmed)) {
    if (state.domainName && state.domainSource === 'purchased' && state.domainRegistrant) {
      state.phase = 'domain_registering'
      state.waitingForReply = false
      state.domainRegistrationStartedAt = Date.now()
      await saveFlowState(redis, conversationId, state)

      await executePurchaseWorkflow({
        domainId: state.domainId!,
        domain: state.domainName,
        registrant: state.domainRegistrant,
        vercelProjectId: state.domainVercelProjectId!,
        conversationId,
        projectId: state.projectId!,
        userId: state.userId!,
        redis,
        io,
        locale: state.locale,
      })
    } else if (state.domainName && state.domainSource === 'own') {
      await executeOwnDomainWorkflow({
        domainId: state.domainId!,
        domain: state.domainName,
        vercelProjectId: state.domainVercelProjectId!,
        conversationId,
        redis,
        io,
        locale: state.locale,
      })
    } else {
      await sendMessage(conversationId, io, {
        content: isChinese ? '缺少必要資訊，請重新開始域名設定流程。' : 'Missing info. Please restart the domain setup.',
        stage: 'error',
      })
      await deleteFlowState(redis, conversationId)
    }
    return
  }

  // 放棄
  if (trimmed === '__cancel_domain__' || /放棄|取消|cancel/i.test(trimmed)) {
    await deleteFlowState(redis, conversationId)
    await sendMessage(conversationId, io, {
      content: isChinese ? '已取消域名操作。' : 'Domain operation cancelled.',
      stage: 'info',
    })
    return
  }

  await sendMessage(conversationId, io, {
    content: isChinese
      ? '域名設定失敗。您可以重試或取消。'
      : 'Domain setup failed. You can retry or cancel.',
    stage: 'info',
    quickReplies: [
      { label: isChinese ? '重試' : 'Retry', value: '__retry_domain__', style: 'primary' as const },
      { label: isChinese ? '取消' : 'Cancel', value: '__cancel_domain__', style: 'ghost' as const },
    ],
  })
}
