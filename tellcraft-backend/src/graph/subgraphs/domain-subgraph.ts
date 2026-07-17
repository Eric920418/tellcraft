/**
 * Domain Skill Subgraph — 域名購買/綁定/管理
 *
 * Graph 結構：
 *   START → entry → afterEntry?
 *     ├─ end → END
 *     ├─ purchase → search → confirm ──interrupt── → afterConfirm?
 *     │                                 ├─ cancel → END
 *     │                                 ├─ change → search（loop）
 *     │                                 └─ confirmed → register → afterRegister?
 *     │                                                             ├─ complete → END
 *     │                                                             └─ failed → retry_or_cancel ──interrupt
 *     └─ own → dns_setup ──interrupt──→ dns_verify → afterVerify?
 *                                                      ├─ complete → END
 *                                                      ├─ dns_retry → dns_setup（loop）
 *                                                      └─ failed → retry_or_cancel
 */
import { StateGraph, START, END, interrupt } from '@langchain/langgraph'
import { TellcraftState, type TellcraftStateType } from '../state'
import { getRedis, getIo } from '../context'
import { sendMessage, saveFlowState, getFlowState, deleteFlowState, touchFlowActivity } from '../../workers/orchestrator-utils'
import {
  checkDomainAvailability, checkDomainQuota, createDomainRecord,
  executePurchaseWorkflow, executeOwnDomainWorkflow, verifyDnsPropagation,
  updateDomainRecord, listUserDomains,
} from '../../services/domain-service'
import { extractDomain } from '../../workers/phase-handlers/domain-phases'
import { resolveEffectivePlan } from '../../config/plans'
import * as db from '../../db/client'
import { createLogger } from '../../lib/logger'
import type { FlowState } from '../../types/flow-state'

const logger = createLogger('domain-subgraph')

// ============================================================
// Node 1: entry — 檢查前置條件 + 分派
// ============================================================

async function entryNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const { projectId, conversationId, userId, message } = state
  const isChinese = state.locale !== 'en'

  // ── waitingForReply + fresh invoke → 直接處理用戶回覆 ──
  // Entry node 只在 fresh invoke 時執行。若 checkpoint 遺失或跨 subgraph 轉場，
  // 需直接處理用戶回覆而非重走前置條件。
  const existingFlow = await getFlowState(redis, conversationId)
  if (existingFlow?.waitingForReply && message) {
    const p = existingFlow.phase
    if (p === 'domain_confirm_purchase') {
      // 購買確認回覆（確認/取消/換域名）
      const reply = message.trim()
      if (/取消|cancel|不要|不買|算了/i.test(reply) || reply === '__cancel_domain__') {
        await deleteFlowState(redis, conversationId)
        await sendMessage(conversationId, io, { content: isChinese ? '已取消域名操作。' : 'Cancelled.', stage: 'info' })
        return { domainSource: 'cancelled' }
      }
      if (/換|另一個|try another|different|其他/i.test(reply)) {
        const newDomain = extractDomain(reply)
        if (newDomain) {
          existingFlow.domainName = newDomain
          existingFlow.domainPrice = undefined
          existingFlow.domainId = undefined
          await saveFlowState(redis, conversationId, existingFlow)
        }
        return { domainSource: 'purchase' }  // → search 重新查詢
      }
      // 確認購買 → 根據現有進度直接跳到正確步驟
      if (existingFlow.domainRegistrant) {
        return { domainSource: 'confirmed' }  // 已有 registrant → 直接 register
      }
      if (existingFlow.domainId) {
        return { domainSource: 'need_registrant' }  // 已有 domainId → registrant 表單
      }
      return { domainSource: 'purchase' }  // 無 domainId → search 查詢
    }
    if (p === 'domain_own_setup') {
      // DNS 確認回覆
      const reply = message.trim()
      if (/取消|cancel/i.test(reply) || reply === '__cancel_domain__') {
        await deleteFlowState(redis, conversationId)
        return { domainSource: 'cancelled' }
      }
      // 用戶確認「設定好了」→ 驗證 DNS
      existingFlow.phase = 'domain_dns_verifying'
      existingFlow.waitingForReply = false
      await saveFlowState(redis, conversationId, existingFlow)
      return { domainSource: 'own' }  // → dns_input → dns_confirm → dns_verify
    }
    if (p === 'domain_failed') {
      // 失敗後重試/取消
      const reply = message.trim()
      if (/取消|cancel|放棄/i.test(reply) || reply === '__cancel_domain__') {
        await deleteFlowState(redis, conversationId)
        await sendMessage(conversationId, io, { content: isChinese ? '已取消。' : 'Cancelled.', stage: 'info' })
        return { domainSource: 'cancelled' }
      }
      // 重試
      if (existingFlow.domainSource === 'own') {
        return { domainSource: 'own' }
      }
      return { domainSource: 'purchase' }
    }
  }

  // 檢查 Vercel project
  const project = await db.queryOne<{ vercel_url: string | null; vercel_project_id: string | null }>(
    'SELECT vercel_url, vercel_project_id FROM projects WHERE id = $1', [projectId]
  )
  if (!project?.vercel_project_id) {
    await sendMessage(conversationId, io, {
      content: isChinese ? '請先部署您的網站，才能綁定自訂域名。' : 'Please deploy first.',
      stage: 'info',
      quickReplies: [{ label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' as const }],
    })
    return { domainSource: 'no_deploy' }
  }

  // 檢查用戶方案
  const userRow = await db.queryOne<{ plan: string; is_admin: boolean }>('SELECT plan, is_admin FROM users WHERE id = $1', [userId])
  const userPlan = userRow ? resolveEffectivePlan(userRow) : 'free'
  if (userPlan === 'free') {
    await sendMessage(conversationId, io, {
      content: isChinese
        ? '自訂域名功能僅限付費會員使用。\n\n- **Creator** — 1 個域名\n- **Pro** — 2 個域名\n- **Business** — 3 個域名'
        : 'Custom domain is available for paid plans only.',
      stage: 'info',
    })
    return { domainSource: 'no_quota' }
  }

  // 配額檢查
  const quota = await checkDomainQuota(userId, userPlan)
  if (!quota.allowed) {
    await sendMessage(conversationId, io, {
      content: isChinese ? `您已達到域名數量上限（${quota.current}/${quota.limit}）。` : `Domain limit reached (${quota.current}/${quota.limit}).`,
      stage: 'info',
    })
    return { domainSource: 'no_quota' }
  }

  // 判斷意圖：購買 vs 綁定 vs 管理
  const trimmed = message.trim().toLowerCase()
  const vercelProjectId = project.vercel_project_id

  // 初始化 FlowState
  let flowState = await getFlowState(redis, conversationId)
  if (!flowState) {
    flowState = {
      phase: 'domain_confirm_purchase', currentRound: 0, questionIndex: 0,
      batchCount: 0, waitingForReply: false, totalQuestionsAsked: 0,
      projectId, userId, locale: state.locale,
      domainVercelProjectId: vercelProjectId,
    } as FlowState
  }
  flowState.domainVercelProjectId = vercelProjectId

  if (/綁定|bind|自己的|own/i.test(trimmed)) {
    const domain = extractDomain(message)
    if (domain) {
      flowState.domainName = domain
      flowState.domainSource = 'own'
      const domainId = await createDomainRecord({ projectId, userId, domain, source: 'own', vercelProjectId })
      flowState.domainId = domainId
      await saveFlowState(redis, conversationId, flowState)
    }
    return { domainSource: 'own' }
  }

  if (/買|購買|purchase|buy/i.test(trimmed)) {
    const domain = extractDomain(message)
    if (domain) {
      flowState.domainName = domain
      flowState.domainSource = 'purchased'
      await saveFlowState(redis, conversationId, flowState)
    }
    return { domainSource: 'purchase' }
  }

  // 管理模式：列出域名
  const domains = await listUserDomains(userId)
  if (domains.length > 0) {
    const list = domains.map(d => `- **${d.domain}** — ${d.status}${d.status === 'active' ? ' ✓' : ''}`).join('\n')
    await sendMessage(conversationId, io, {
      content: isChinese ? `您的域名：\n${list}\n\n您可以購買新域名或綁定已有域名。` : `Your domains:\n${list}`,
      stage: 'info',
      quickReplies: [
        { label: isChinese ? '購買新域名' : 'Buy Domain', value: '購買域名', style: 'primary' as const },
        { label: isChinese ? '綁定已有域名' : 'Bind Own', value: '綁定自己的域名', style: 'secondary' as const },
      ],
    })
  } else {
    await sendMessage(conversationId, io, {
      content: isChinese ? '您還沒有綁定任何域名。' : 'No domains yet.',
      stage: 'info',
      quickReplies: [
        { label: isChinese ? '購買新域名' : 'Buy Domain', value: '購買域名', style: 'primary' as const },
        { label: isChinese ? '綁定已有域名' : 'Bind Own', value: '綁定自己的域名', style: 'secondary' as const },
      ],
    })
  }
  return { domainSource: 'manager' }
}

// ============================================================
// Node 2: search — 域名可用性查詢
// ============================================================

async function searchNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const { conversationId, projectId, userId } = state
  const isChinese = state.locale !== 'en'

  let flowState = await getFlowState(redis, conversationId)
  if (!flowState) return { domainSource: 'cancelled' }

  let domain = flowState.domainName
  if (!domain) {
    // 沒有域名 → 要求用戶輸入
    await sendMessage(conversationId, io, {
      content: isChinese ? '請告訴我您想購買的域名，例如：「買 mysite.com」' : 'Tell me the domain, e.g., "buy mysite.com"',
      stage: 'info',
    })
    flowState.phase = 'domain_confirm_purchase'
    flowState.waitingForReply = true
    await saveFlowState(redis, conversationId, flowState)

    // interrupt 等用戶輸入域名
    const domainInput: string = interrupt({ type: 'domain_input' })
    domain = extractDomain(domainInput) ?? undefined
    if (!domain) return { domainSource: 'cancelled' }
    flowState.domainName = domain
  }

  await sendMessage(conversationId, io, {
    content: isChinese ? `正在查詢 **${domain}** 的可用性...` : `Checking availability of **${domain}**...`,
    stage: 'domain_searching' as string,
  })

  try {
    const result = await checkDomainAvailability(domain)
    if (result.available) {
      const domainId = await createDomainRecord({ projectId, userId, domain, source: 'purchased', vercelProjectId: flowState.domainVercelProjectId! })
      flowState.domainId = domainId
      flowState.domainPrice = result.price || undefined
      await saveFlowState(redis, conversationId, flowState)
      return { domainSource: 'purchase' }  // → confirm node
    } else {
      await sendMessage(conversationId, io, {
        content: isChinese ? `**${domain}** 已被註冊，無法購買。` : `**${domain}** is already registered.`,
        stage: 'info',
        quickReplies: [
          { label: isChinese ? '綁定已有域名' : 'Bind Own', value: '綁定自己的域名', style: 'secondary' as const },
          { label: isChinese ? '取消' : 'Cancel', value: '__cancel_domain__', style: 'ghost' as const },
        ],
      })
      return { domainSource: 'cancelled' }
    }
  } catch (err) {
    logger.error({ domain, err: String(err) }, '域名查詢失敗')
    await sendMessage(conversationId, io, {
      content: isChinese ? `查詢 ${domain} 時發生錯誤，請稍後再試。` : `Error checking ${domain}.`,
      stage: 'error',
    })
    return { domainSource: 'cancelled' }
  }
}

// ============================================================
// Node 3a: confirm_price — 顯示價格，等確認（單一 interrupt）
// ============================================================

async function confirmPriceNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const { conversationId } = state
  const isChinese = state.locale !== 'en'

  const flowState = await getFlowState(redis, conversationId)
  if (!flowState) return { domainSource: 'cancelled' }
  const domain = flowState.domainName
  const price = flowState.domainPrice

  await sendMessage(conversationId, io, {
    content: isChinese
      ? `**${domain}** 可以註冊！${price ? `\n\n價格：**${price}/年**` : ''}\n\n⚠️ 域名一旦購買**無法退款**，請確認後再繼續。\n\n確認購買嗎？`
      : `**${domain}** is available!${price ? `\n\nPrice: **${price}/year**` : ''}\n\n⚠️ **Non-refundable**. Proceed?`,
    stage: 'domain_confirm_purchase',
    richContent: { type: 'domain_search_result', data: { domain, available: true, price } as Record<string, unknown> },
    quickReplies: [
      { label: isChinese ? '確認購買' : 'Buy', value: '確認購買', style: 'primary' as const },
      { label: isChinese ? '換一個域名' : 'Try Another', value: '換一個域名', style: 'secondary' as const },
      { label: isChinese ? '取消' : 'Cancel', value: '__cancel_domain__', style: 'ghost' as const },
    ],
  })

  flowState.phase = 'domain_confirm_purchase'
  flowState.waitingForReply = true
  await saveFlowState(redis, conversationId, flowState)

  // ── 單一 interrupt：等用戶確認/取消/換域名 ──
  const reply: string = interrupt({ type: 'domain_confirm', domain, price })

  if (/取消|cancel|不要|不買|算了/i.test(reply) || reply === '__cancel_domain__') {
    await deleteFlowState(redis, conversationId)
    await sendMessage(conversationId, io, { content: isChinese ? '已取消域名操作。' : 'Cancelled.', stage: 'info' })
    return { domainSource: 'cancelled' }
  }

  if (/換|另一個|try another|different|其他/i.test(reply)) {
    const newDomain = extractDomain(reply)
    if (newDomain) {
      flowState.domainName = newDomain
      flowState.domainPrice = undefined
      flowState.domainId = undefined
      await saveFlowState(redis, conversationId, flowState)
    }
    return { domainSource: 'change' }  // → 回到 search
  }

  // 確認購買 → 進入 registrant 表單 node
  return { domainSource: 'need_registrant' }
}

// ============================================================
// Node 3b: confirm_registrant — registrant 表單（單一 interrupt）
// ============================================================

async function confirmRegistrantNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const { conversationId } = state
  const isChinese = state.locale !== 'en'

  const flowState = await getFlowState(redis, conversationId)
  if (!flowState) return { domainSource: 'cancelled' }
  const domain = flowState.domainName

  await sendMessage(conversationId, io, {
    content: isChinese
      ? `購買 **${domain}** 需要填寫註冊人資訊。請在下方表單填寫後提交。`
      : `Purchasing **${domain}** requires registrant info. Fill the form below.`,
    stage: 'domain_confirm_purchase',
    richContent: { type: 'domain_registrant_form', data: { domain } as Record<string, unknown> },
  })

  // ── 單一 interrupt：等 registrant JSON 提交 ──
  const reply: string = interrupt({ type: 'domain_registrant_form' })

  if (reply === '__cancel_domain__' || /取消|cancel/i.test(reply)) {
    await deleteFlowState(redis, conversationId)
    return { domainSource: 'cancelled' }
  }

  // 嘗試解析 registrant JSON
  if (reply.trim().startsWith('{') && reply.includes('firstName')) {
    try {
      const registrant = JSON.parse(reply)
      if (!registrant.firstName || !registrant.lastName || !registrant.email) {
        await sendMessage(conversationId, io, {
          content: isChinese ? '請填寫必要欄位（firstName, lastName, email）。' : 'Required: firstName, lastName, email.',
          stage: 'info',
        })
        return { domainSource: 'need_registrant' }  // → 回到自己
      }
      flowState.domainRegistrant = registrant
      flowState.phase = 'domain_registering'
      flowState.waitingForReply = false
      flowState.domainRegistrationStartedAt = Date.now()
      await saveFlowState(redis, conversationId, flowState)
      return { domainSource: 'confirmed' }  // → register node
    } catch {
      await sendMessage(conversationId, io, { content: isChinese ? 'JSON 格式有誤，請重新填寫。' : 'Invalid JSON.', stage: 'info' })
      return { domainSource: 'need_registrant' }  // → 回到自己
    }
  }

  // 非 JSON → 可能是域名（換域名）
  const possibleDomain = extractDomain(reply)
  if (possibleDomain) {
    flowState.domainName = possibleDomain
    await saveFlowState(redis, conversationId, flowState)
    return { domainSource: 'change' }
  }

  return { domainSource: 'cancelled' }
}

// ============================================================
// Node 4: register — 自動執行購買流程
// ============================================================

async function registerNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const { conversationId } = state
  const isChinese = state.locale !== 'en'

  const flowState = await getFlowState(redis, conversationId)
  if (!flowState?.domainName || !flowState?.domainRegistrant || !flowState?.domainVercelProjectId) {
    return { domainSource: 'failed' }
  }

  await sendMessage(conversationId, io, {
    content: isChinese ? `正在購買 **${flowState.domainName}**，請稍候...` : `Purchasing **${flowState.domainName}**, please wait...`,
    stage: 'domain_registering' as string,
  })

  // 心跳（購買流程可能 30-120 秒）
  const heartbeat = setInterval(() => void touchFlowActivity(redis, conversationId), 15_000)

  try {
    await executePurchaseWorkflow({
      domainId: flowState.domainId!,
      domain: flowState.domainName,
      registrant: flowState.domainRegistrant,
      vercelProjectId: flowState.domainVercelProjectId!,
      projectId: state.projectId,
      userId: state.userId,
      conversationId, redis, io,
      locale: state.locale as 'zh' | 'en',
    })

    // executePurchaseWorkflow 內部已更新 FlowState（domain_complete 或 domain_failed）
    const updated = await getFlowState(redis, conversationId)
    return { domainSource: updated?.phase === 'domain_complete' ? 'complete' : 'failed' }
  } catch (err) {
    logger.error({ err }, 'Purchase workflow 異常')
    const fs = await getFlowState(redis, conversationId)
    if (fs) {
      fs.phase = 'domain_failed'
      fs.waitingForReply = true
      await saveFlowState(redis, conversationId, fs)
    }
    return { domainSource: 'failed' }
  } finally {
    clearInterval(heartbeat)
  }
}

// ============================================================
// Node 5a: dns_input — 如果沒有域名，要求用戶輸入（單一 interrupt）
// ============================================================

async function dnsInputNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const { conversationId } = state
  const isChinese = state.locale !== 'en'

  const flowState = await getFlowState(redis, conversationId)
  if (!flowState) return { domainSource: 'cancelled' }

  if (flowState.domainName) {
    // 已有域名 → 直接跳到 dns_confirm
    return { domainSource: 'has_domain' }
  }

  // 沒有域名 → 要求輸入
  await sendMessage(conversationId, io, {
    content: isChinese ? '請告訴我您要綁定的域名，例如：「綁定 mysite.com」' : 'Tell me the domain to bind.',
    stage: 'info',
  })
  flowState.phase = 'domain_own_setup'
  flowState.waitingForReply = true
  await saveFlowState(redis, conversationId, flowState)

  const input: string = interrupt({ type: 'domain_own_input' })
  const domain = extractDomain(input) ?? undefined
  if (!domain) return { domainSource: 'cancelled' }

  flowState.domainName = domain
  flowState.domainSource = 'own'
  const domainId = await createDomainRecord({
    projectId: state.projectId, userId: state.userId,
    domain, source: 'own', vercelProjectId: flowState.domainVercelProjectId!,
  })
  flowState.domainId = domainId
  await saveFlowState(redis, conversationId, flowState)
  return { domainSource: 'has_domain' }
}

// ============================================================
// Node 5b: dns_confirm — 顯示 DNS 指引 + 等確認（單一 interrupt）
// ============================================================

async function dnsConfirmNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const { conversationId } = state

  let flowState = await getFlowState(redis, conversationId)
  if (!flowState?.domainName || !flowState?.domainId) return { domainSource: 'cancelled' }

  // 呼叫 executeOwnDomainWorkflow（顯示 DNS 記錄 + 設定 waitingForReply）
  await executeOwnDomainWorkflow({
    domainId: flowState.domainId, domain: flowState.domainName,
    vercelProjectId: flowState.domainVercelProjectId!,
    conversationId, redis, io, locale: state.locale as 'zh' | 'en',
  })

  // ── 單一 interrupt：等用戶確認「設定好了」──
  const reply: string = interrupt({ type: 'dns_setup_confirm' })

  if (/取消|cancel/i.test(reply) || reply === '__cancel_domain__') {
    await deleteFlowState(redis, conversationId)
    return { domainSource: 'cancelled' }
  }

  // 用戶確認 → 進入 DNS 驗證
  flowState = await getFlowState(redis, conversationId) || flowState
  flowState.phase = 'domain_dns_verifying'
  flowState.waitingForReply = false
  await saveFlowState(redis, conversationId, flowState)
  return { domainSource: 'own_verify' }
}

// ============================================================
// Node 6: dns_verify — DNS 傳播驗證
// ============================================================

async function dnsVerifyNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const { conversationId } = state
  const isChinese = state.locale !== 'en'

  const flowState = await getFlowState(redis, conversationId)
  if (!flowState?.domainName) return { domainSource: 'failed' }

  await sendMessage(conversationId, io, {
    content: isChinese ? '正在驗證 DNS 設定，可能需要幾分鐘...' : 'Verifying DNS, may take a few minutes...',
    stage: 'domain_dns_verifying',
  })

  const heartbeat = setInterval(() => void touchFlowActivity(redis, conversationId), 15_000)

  try {
    const verified = await verifyDnsPropagation(flowState.domainName, 3, 30_000)

    if (verified) {
      await updateDomainRecord(flowState.domainId!, { status: 'active', vercel_domain_verified: true })
      flowState.phase = 'domain_complete'
      flowState.waitingForReply = true
      flowState.domainCompletedSteps = [...(flowState.domainCompletedSteps || []), 'dns_verified']
      await saveFlowState(redis, conversationId, flowState)

      await sendMessage(conversationId, io, {
        content: isChinese
          ? `✅ DNS 驗證成功！**${flowState.domainName}** 已綁定到您的網站。\n\n訪問：https://${flowState.domainName}`
          : `✅ DNS verified! **${flowState.domainName}** is bound.\n\nVisit: https://${flowState.domainName}`,
        stage: 'domain_complete',
        quickReplies: [{ label: isChinese ? '開始新專案' : 'New Project', value: '__new_project__', style: 'ghost' as const }],
      })
      return { domainSource: 'verified' }
    } else {
      // DNS 未傳播 → 回到 dns_setup 重試
      flowState.phase = 'domain_own_setup'
      flowState.waitingForReply = true
      await saveFlowState(redis, conversationId, flowState)

      await sendMessage(conversationId, io, {
        content: isChinese
          ? `DNS 尚未傳播（正常，可能需要 24-48 小時）。\n\n請確認 DNS 記錄設定正確後再試。`
          : `DNS not propagated yet (normal, 24-48hrs). Verify records and try again.`,
        stage: 'domain_own_setup',
        quickReplies: [
          { label: isChinese ? '再驗證一次' : 'Verify Again', value: '設定好了', style: 'primary' as const },
          { label: isChinese ? '稍後再試' : 'Later', value: '__cancel_domain__', style: 'ghost' as const },
        ],
      })
      return { domainSource: 'dns_retry' }
    }
  } catch (err) {
    logger.error({ err }, 'DNS 驗證異常')
    return { domainSource: 'failed' }
  } finally {
    clearInterval(heartbeat)
  }
}

// ============================================================
// Node 7: complete — 發送完成訊息
// ============================================================

async function completeNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const updated = await getFlowState(redis, state.conversationId)
  return { phase: updated?.phase ?? 'domain_complete' }
}

// ============================================================
// Node 8: retry_or_cancel — 失敗後重試/取消（interrupt）
// ============================================================

async function retryOrCancelNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const { conversationId } = state
  const isChinese = state.locale !== 'en'

  const flowState = await getFlowState(redis, conversationId)
  if (!flowState) return { domainSource: 'cancelled' }

  await sendMessage(conversationId, io, {
    content: isChinese ? '域名操作失敗。您可以重試或取消。' : 'Domain operation failed. Retry or cancel?',
    stage: 'domain_failed',
    quickReplies: [
      { label: isChinese ? '重試' : 'Retry', value: '重試', style: 'primary' as const },
      { label: isChinese ? '取消' : 'Cancel', value: '__cancel_domain__', style: 'ghost' as const },
    ],
  })

  flowState.phase = 'domain_failed'
  flowState.waitingForReply = true
  await saveFlowState(redis, conversationId, flowState)

  // ── interrupt：等用戶選擇 ──
  const reply: string = interrupt({ type: 'domain_retry_or_cancel' })

  if (/取消|cancel|放棄/i.test(reply) || reply === '__cancel_domain__') {
    await deleteFlowState(redis, conversationId)
    await sendMessage(conversationId, io, { content: isChinese ? '已取消。' : 'Cancelled.', stage: 'info' })
    return { domainSource: 'cancelled' }
  }

  // 重試
  if (flowState.domainSource === 'own') {
    return { domainSource: 'retry_dns' }
  }
  return { domainSource: 'retry_purchase' }
}

// ============================================================
// Edge routing
// ============================================================

function afterEntry(state: TellcraftStateType): string {
  const ds = state.domainSource
  if (ds === 'no_deploy' || ds === 'no_quota' || ds === 'manager' || ds === 'cancelled') return 'end'
  if (ds === 'purchase') return 'search'
  if (ds === 'need_registrant') return 'confirm_registrant'  // fresh invoke 跳過 search
  if (ds === 'confirmed') return 'register'                  // fresh invoke 跳過 search+registrant
  if (ds === 'own') return 'dns_setup'
  return 'end'
}

function afterSearch(state: TellcraftStateType): string {
  if (state.domainSource === 'cancelled') return 'end'
  return 'confirm_price'
}

function afterConfirmPrice(state: TellcraftStateType): string {
  if (state.domainSource === 'cancelled') return 'end'
  if (state.domainSource === 'change') return 'search'  // loop
  if (state.domainSource === 'need_registrant') return 'confirm_registrant'
  return 'end'
}

function afterConfirmRegistrant(state: TellcraftStateType): string {
  if (state.domainSource === 'cancelled') return 'end'
  if (state.domainSource === 'change') return 'search'  // 換域名
  if (state.domainSource === 'need_registrant') return 'confirm_registrant'  // 表單重填 loop
  if (state.domainSource === 'confirmed') return 'register'
  return 'end'
}

function afterRegister(state: TellcraftStateType): string {
  if (state.domainSource === 'complete') return 'complete'
  return 'retry_or_cancel'
}

function afterDnsInput(state: TellcraftStateType): string {
  if (state.domainSource === 'cancelled') return 'end'
  if (state.domainSource === 'has_domain') return 'dns_confirm'
  return 'end'
}

function afterDnsConfirm(state: TellcraftStateType): string {
  if (state.domainSource === 'cancelled') return 'end'
  if (state.domainSource === 'own_verify') return 'dns_verify'
  return 'end'
}

function afterVerify(state: TellcraftStateType): string {
  if (state.domainSource === 'verified') return 'complete'
  if (state.domainSource === 'dns_retry') return 'dns_confirm'  // loop
  return 'retry_or_cancel'
}

function afterRetry(state: TellcraftStateType): string {
  if (state.domainSource === 'cancelled') return 'end'
  if (state.domainSource === 'retry_purchase') return 'register'
  if (state.domainSource === 'retry_dns') return 'dns_confirm'
  return 'end'
}

// ============================================================
// Build
// ============================================================

export function buildDomainSubgraph() {
  return new StateGraph(TellcraftState)
    .addNode('entry', entryNode)
    .addNode('search', searchNode)
    .addNode('confirm_price', confirmPriceNode)            // interrupt ×1
    .addNode('confirm_registrant', confirmRegistrantNode)  // interrupt ×1
    .addNode('register', registerNode)
    .addNode('dns_input', dnsInputNode)          // interrupt ×1（如果缺域名）
    .addNode('dns_confirm', dnsConfirmNode)      // interrupt ×1
    .addNode('dns_verify', dnsVerifyNode)
    .addNode('complete', completeNode)
    .addNode('retry_or_cancel', retryOrCancelNode)  // interrupt ×1

    .addEdge(START, 'entry')
    .addConditionalEdges('entry', afterEntry, {
      search: 'search',
      confirm_registrant: 'confirm_registrant',  // fresh invoke 跳過 search
      register: 'register',                      // fresh invoke 跳過 search+registrant
      dns_setup: 'dns_input',
      end: END,
    })
    .addConditionalEdges('search', afterSearch, {
      confirm_price: 'confirm_price',
      end: END,
    })
    .addConditionalEdges('confirm_price', afterConfirmPrice, {
      search: 'search',                      // 換域名 loop
      confirm_registrant: 'confirm_registrant',
      end: END,
    })
    .addConditionalEdges('confirm_registrant', afterConfirmRegistrant, {
      search: 'search',                      // 換域名
      confirm_registrant: 'confirm_registrant', // 表單重填 loop
      register: 'register',
      end: END,
    })
    .addConditionalEdges('register', afterRegister, {
      complete: 'complete',
      retry_or_cancel: 'retry_or_cancel',
    })
    .addConditionalEdges('dns_input', afterDnsInput, {
      dns_confirm: 'dns_confirm',
      end: END,
    })
    .addConditionalEdges('dns_confirm', afterDnsConfirm, {
      dns_verify: 'dns_verify',
      end: END,
    })
    .addConditionalEdges('dns_verify', afterVerify, {
      complete: 'complete',
      dns_confirm: 'dns_confirm',  // DNS 未傳播 loop（重新顯示指引）
      retry_or_cancel: 'retry_or_cancel',
    })
    .addConditionalEdges('retry_or_cancel', afterRetry, {
      register: 'register',     // 重試購買
      dns_confirm: 'dns_confirm', // 重試 DNS
      end: END,
    })
    .addEdge('complete', END)
    .compile()
}
