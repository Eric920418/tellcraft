import { inngest } from '../client'
import { classifyIntent } from '../classifier'
import { getSkillMetadata, SkillName } from '../registry'
import { supabase } from '../../lib/supabase'
import { generateCode, deployProjectFromDb } from '../../actions'
import { discoverAmbiguities, processAnswer, generateSpecSummary } from '../../lib/llm'

// ============================================================
// 主要 Orchestrator Function
// ============================================================

/**
 * 處理用戶請求的主要編排函數
 *
 * 流程：
 * 1. 接收用戶請求
 * 2. Intent Classification（判斷意圖）
 * 3. 路由到對應 Skill
 * 4. 執行 Skill（可能包含多輪對話）
 * 5. 根據結果決定下一步（生成程式碼、部署等）
 */
export const handleUserRequest = inngest.createFunction(
  {
    id: 'handle-user-request',
    name: '處理用戶請求',
    retries: 3,
  },
  { event: 'user/request' },
  async ({ event, step }) => {
    const { projectId, conversationId, userId, message } = event.data

    // ============================================================
    // Step 1: 更新任務狀態為處理中
    // ============================================================
    const taskId = await step.run('create-task-record', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          user_id: userId,
          goal: message,
          status: 'planning',
        })
        .select('id')
        .single()

      if (error) throw new Error(`建立任務失敗: ${error.message}`)
      return data.id
    })

    // ============================================================
    // Step 2: Intent Classification
    // ============================================================
    const classification = await step.run('classify-intent', async () => {
      // 取得對話歷史
      const { data: conversation } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single()

      const history = (conversation?.messages || []) as Array<{
        role: 'user' | 'assistant'
        content: string
      }>

      return classifyIntent(message, history)
    })

    // ============================================================
    // Step 3: 處理無法分類的情況 → 預設進入 BDD Spec
    // ============================================================
    // 設計原則：新用戶/新對話一定是描述需求，應該直接進入 bdd-spec
    // 只有當專案已有規格，用戶才可能要「生成程式碼」或「部署」
    let effectiveIntent = classification.intent

    if (classification.intent === 'clarification_needed' || classification.intent === 'unknown') {
      // 預設當作 bdd-spec 處理
      effectiveIntent = 'bdd-spec'
      console.log('[Orchestrator] 無法確定意圖，預設進入 bdd-spec')
    }

    // ============================================================
    // Step 4: 路由到對應 Skill
    // ============================================================
    const skillName = effectiveIntent as SkillName
    const skillMetadata = getSkillMetadata(skillName)

    if (!skillMetadata) {
      throw new Error(`未知的 Skill: ${skillName}`)
    }

    await step.run('update-task-skill', async () => {
      await supabase
        .from('tasks')
        .update({
          status: 'executing',
          plan: {
            skill: skillName,
            classification,
          },
        })
        .eq('id', taskId)
    })

    // ============================================================
    // Step 5: 執行 Skill
    // ============================================================
    let skillResult: unknown

    switch (skillName) {
      case 'bdd-spec':
        skillResult = await executeBddSpecSkill({
          step,
          taskId,
          projectId,
          conversationId,
          userId,
          message,
          extractedEntities: classification.extractedEntities,
        })
        break

      case 'coder':
        skillResult = await executeCoderSkill({
          step,
          taskId,
          projectId,
        })
        break

      case 'deployer':
        skillResult = await executeDeployerSkill({
          step,
          taskId,
          projectId,
          conversationId,
        })
        break

      case 'domain-manager':
        skillResult = await executeDomainManagerSkill({
          step,
          taskId,
          projectId,
          conversationId,
        })
        break

      case 'domain-purchase':
        skillResult = await executeDomainPurchaseSkill({
          step,
          taskId,
          projectId,
          conversationId,
        })
        break

      case 'domain-dns':
        skillResult = await executeDomainDnsSkill({
          step,
          taskId,
          projectId,
          conversationId,
        })
        break

      default:
        throw new Error(`未實作的 Skill: ${skillName}`)
    }

    // ============================================================
    // Step 6: 完成任務
    // ============================================================
    await step.run('complete-task', async () => {
      await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)
    })

    return {
      status: 'completed',
      taskId,
      skill: skillName,
      result: skillResult,
    }
  }
)

// ============================================================
// BDD Spec Skill 執行
// ============================================================

interface BddSpecSkillInput {
  step: Parameters<Parameters<typeof inngest.createFunction>[2]>[0]['step']
  taskId: string
  projectId: string
  conversationId: string
  userId: string
  message: string
  extractedEntities?: {
    projectType?: string
    features?: string[]
  }
}

// BDD 釐清問題類型
interface ClarifyQuestion {
  id: string
  question: string
  category: 'data' | 'feature' | 'terminology'
  priority: 'high' | 'medium' | 'low'
  options?: Array<{ label: string; description: string }>
}

async function executeBddSpecSkill(input: BddSpecSkillInput) {
  const { step, taskId, projectId, conversationId, message, extractedEntities } = input

  // 取得專案背景資訊
  const projectContext = await step.run('get-project-context', async () => {
    const { data: project } = await supabase
      .from('projects')
      .select('name, description')
      .eq('id', projectId)
      .single()

    return project?.description || project?.name || undefined
  })

  // 追蹤已問過的問題和回答
  const questionsAndAnswers: Array<{ question: string; answer: string }> = []
  const askedQuestions: string[] = []
  let questionCounter = 0
  let specComplete = false
  const maxQuestions = 20  // 最多問 20 題

  // 第一輪：發現問題
  const initialDiscovery = await step.run('bdd-initial-discovery', async () => {
    console.log('[BDD Discovery] 開始分析需求:', message)
    console.log('[BDD Discovery] 專案背景:', projectContext)

    const result = await discoverAmbiguities(
      message,
      projectContext || undefined,
      undefined
    )

    console.log('[BDD Discovery] LLM 返回結果:', JSON.stringify(result, null, 2))

    if (!result.success) {
      console.error('[BDD Discovery] LLM 呼叫失敗:', result.error)
      return { questions: [], error: result.error }
    }

    console.log('[BDD Discovery] 發現問題數量:', result.questions?.length || 0)
    return { questions: result.questions || [] }
  })

  // 如果 LLM 錯誤，顯示錯誤訊息
  if (initialDiscovery.error) {
    await step.run('show-error', async () => {
      const errorMsg = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `[系統錯誤] ${initialDiscovery.error}\n\n請聯繫管理員或稍後再試。`,
        timestamp: new Date().toISOString(),
      }
      const { data: conv } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single()
      await supabase
        .from('conversations')
        .update({ messages: [...(conv?.messages || []), errorMsg] })
        .eq('id', conversationId)
    })
    specComplete = true
  }

  // 待問問題清單
  let pendingQuestions: ClarifyQuestion[] = initialDiscovery.questions || []

  // 一題一題問
  while (!specComplete && pendingQuestions.length > 0 && questionCounter < maxQuestions) {
    const currentQuestion = pendingQuestions.shift()!
    questionCounter++

    // 格式化問題
    const formatQuestion = (q: ClarifyQuestion) => {
      let text = q.question
      if (q.options && q.options.length > 0) {
        text += '\n\n' + q.options.map((opt, j) =>
          `${String.fromCharCode(65 + j)}. ${opt.description || opt.label}`
        ).join('\n')
      }
      return text
    }

    // 發送問題
    await step.run(`send-question-${questionCounter}`, async () => {
      const questionMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: formatQuestion(currentQuestion),
        timestamp: new Date().toISOString(),
      }

      const { data: conv } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single()

      await supabase
        .from('conversations')
        .update({
          messages: [...(conv?.messages || []), questionMessage],
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)

      askedQuestions.push(currentQuestion.question)
    })

    // 等待用戶回覆
    const reply = await step.waitForEvent(`wait-for-reply-${questionCounter}`, {
      event: 'user/reply',
      timeout: '24h',
      match: 'data.conversationId',
    })

    if (!reply) {
      return { status: 'timeout', questionsAsked: questionCounter }
    }

    // 檢查是否確認規格
    if (reply.data.specConfirmed || reply.data.message.includes('確認規格')) {
      specComplete = true
      break
    }

    // 記錄問答
    questionsAndAnswers.push({
      question: currentQuestion.question,
      answer: reply.data.message,
    })

    // 如果問題問完了，檢查是否需要更多問題
    if (pendingQuestions.length === 0 && !specComplete) {
      const moreQuestions = await step.run(`discover-more-${questionCounter}`, async () => {
        const result = await discoverAmbiguities(
          message,
          projectContext || undefined,
          askedQuestions
        )

        if (!result.success || !result.questions?.length) {
          return { questions: [] }
        }

        return { questions: result.questions }
      })

      pendingQuestions = moreQuestions.questions || []

      // 如果沒有更多問題，結束釐清
      if (pendingQuestions.length === 0) {
        specComplete = true
      }
    }
  }

  // 產出規格摘要
  const specResult = await step.run('generate-spec', async () => {
    // 使用 LLM 生成規格摘要
    const summaryResult = await generateSpecSummary(
      message,
      questionsAndAnswers,
      projectContext || undefined
    )

    let specSummaryText = ''

    if (summaryResult.success && summaryResult.summary) {
      const { entities, features, decisions } = summaryResult.summary

      specSummaryText = `
## 資料模型
${entities.map(e => `- **${e.name}**：${e.description}\n  屬性：${e.attributes.join(', ')}`).join('\n')}

## 功能規格
${features.map(f => `- **${f.name}**：${f.description}\n  規則：${f.rules.join('; ')}`).join('\n')}

## 決策記錄
${decisions.map(d => `- Q: ${d.question}\n  A: ${d.answer}\n  影響: ${d.impact}`).join('\n')}`
    }

    // 標記對話的 spec 完成
    await supabase
      .from('conversations')
      .update({
        spec_complete: true,
        spec_summary: summaryResult.success ? summaryResult.summary : null,
      })
      .eq('id', conversationId)

    // 發送完成訊息
    const completeMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `好的，我已經了解您的需求了！
${specSummaryText}

接下來您可以：
1. 輸入「生成程式碼」來產生應用程式
2. 輸入「修改規格」來調整需求`,
      timestamp: new Date().toISOString(),
    }

    const { data: conv } = await supabase
      .from('conversations')
      .select('messages')
      .eq('id', conversationId)
      .single()

    await supabase
      .from('conversations')
      .update({
        messages: [...(conv?.messages || []), completeMessage],
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)

    return {
      status: 'success',
      questionsAnswered: questionsAndAnswers.length,
      summary: summaryResult.success ? summaryResult.summary : null,
      artifacts: {
        schemaSql: 'spec/data/schema.sql',
        features: ['spec/features/*.feature'],
      },
    }
  })

  return specResult
}

// ============================================================
// Coder Skill 執行（含自癒機制）
// ============================================================

interface CoderSkillInput {
  step: Parameters<Parameters<typeof inngest.createFunction>[2]>[0]['step']
  taskId: string
  projectId: string
}

async function executeCoderSkill(input: CoderSkillInput) {
  const { step, taskId, projectId } = input
  const maxRetries = 3
  let attempt = 0
  let success = false
  let lastError: string | undefined

  while (!success && attempt < maxRetries) {
    attempt++

    const result = await step.run(`codegen-attempt-${attempt}`, async () => {
      // 呼叫現有的 generateCode Server Action
      const genResult = await generateCode({ projectId })

      if (!genResult.success) {
        return { success: false, error: genResult.error }
      }

      return { success: true, generationId: genResult.data?.generationId }
    })

    if (result.success) {
      success = true
      return {
        status: 'success',
        attempts: attempt,
        generationId: result.generationId,
      }
    }

    lastError = result.error

    // 自癒：分析錯誤並嘗試修復
    if (attempt < maxRetries) {
      await step.run(`analyze-error-${attempt}`, async () => {
        // 記錄錯誤供下次嘗試參考
        await supabase
          .from('tasks')
          .update({
            plan: {
              lastError,
              attempt,
              status: 'retrying',
            },
          })
          .eq('id', taskId)
      })

      // 等待一小段時間再重試
      await step.sleep(`retry-delay-${attempt}`, '5s')
    }
  }

  // 所有重試都失敗
  return {
    status: 'failed',
    attempts: attempt,
    error: lastError,
  }
}

// ============================================================
// Deployer Skill 執行
// ============================================================

interface DeployerSkillInput {
  step: Parameters<Parameters<typeof inngest.createFunction>[2]>[0]['step']
  taskId: string
  projectId: string
  conversationId: string
}

async function executeDeployerSkill(input: DeployerSkillInput) {
  const { step, projectId, conversationId } = input

  const result = await step.run('deploy', async () => {
    // 呼叫整合真正 Vercel API 的部署函數
    const deployResult = await deployProjectFromDb({ projectId })

    if (!deployResult.success) {
      return { success: false, error: deployResult.error }
    }

    return {
      success: true,
      deploymentId: deployResult.data?.deploymentId,
      url: deployResult.data?.url,
      status: deployResult.data?.status,
    }
  })

  // 部署成功後，詢問是否設定自訂網域
  if (result.success && result.url) {
    await step.run('ask-domain-setup', async () => {
      const domainMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `部署完成！您的網站已上線：
**${result.url}**

是否要設定自訂網域？
1. **使用免費網域** - 繼續使用 ${result.url}（免費）
2. **購買網域** - 透過平台購買網域（如 myapp.com）
3. **使用自有網域** - 綁定您已有的網域

請輸入選項或直接告訴我您想要的網域名稱。`,
        timestamp: new Date().toISOString(),
      }

      const { data: conv } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single()

      await supabase
        .from('conversations')
        .update({
          messages: [...(conv?.messages || []), domainMessage],
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
    })
  }

  return result
}

// ============================================================
// Domain Manager Skill 執行
// ============================================================

interface DomainManagerSkillInput {
  step: Parameters<Parameters<typeof inngest.createFunction>[2]>[0]['step']
  taskId: string
  projectId: string
  conversationId: string
}

type DomainChoice = 'free' | 'purchase' | 'own'

async function executeDomainManagerSkill(input: DomainManagerSkillInput) {
  const { step, projectId, conversationId } = input

  // 取得專案資訊
  const projectInfo = await step.run('get-project-info', async () => {
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, vercel_url, custom_domain, domain_status')
      .eq('id', projectId)
      .single()

    return project
  })

  if (!projectInfo) {
    return { success: false, error: '專案不存在' }
  }

  // 如果已有自訂網域，顯示目前狀態
  if (projectInfo.custom_domain) {
    await step.run('show-current-domain', async () => {
      const statusMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `您的專案目前已設定自訂網域：
- **自訂網域**：${projectInfo.custom_domain}
- **狀態**：${projectInfo.domain_status || 'active'}
- **Vercel 網域**：${projectInfo.vercel_url}

如需修改，請告訴我您想要的操作。`,
        timestamp: new Date().toISOString(),
      }

      const { data: conv } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single()

      await supabase
        .from('conversations')
        .update({
          messages: [...(conv?.messages || []), statusMessage],
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
    })

    return { success: true, domain: projectInfo.custom_domain, status: 'already_configured' }
  }

  // 詢問用戶選擇
  await step.run('ask-domain-choice', async () => {
    const choiceMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `請選擇網域設定方式：

1. **使用免費網域** - 繼續使用 ${projectInfo.vercel_url}（免費，無需設定）
2. **購買網域** - 透過平台購買新網域（如 ${projectInfo.name?.toLowerCase().replace(/\s+/g, '')}.com）
3. **使用自有網域** - 綁定您已有的網域（需設定 DNS）

請輸入選項（1/2/3）或直接告訴我您想要的網域名稱。`,
      timestamp: new Date().toISOString(),
    }

    const { data: conv } = await supabase
      .from('conversations')
      .select('messages')
      .eq('id', conversationId)
      .single()

    await supabase
      .from('conversations')
      .update({
        messages: [...(conv?.messages || []), choiceMessage],
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
  })

  // 等待用戶回覆
  const reply = await step.waitForEvent('wait-for-domain-choice', {
    event: 'user/reply',
    timeout: '24h',
    match: 'data.conversationId',
  })

  if (!reply) {
    return { success: false, error: 'timeout' }
  }

  const userMessage = reply.data.message.trim()
  let choice: DomainChoice = 'free'
  let domainName: string | undefined

  // 解析用戶選擇
  if (userMessage === '1' || userMessage.includes('免費') || userMessage.includes('vercel')) {
    choice = 'free'
  } else if (userMessage === '2' || userMessage.includes('購買') || userMessage.includes('買')) {
    choice = 'purchase'
  } else if (userMessage === '3' || userMessage.includes('自有') || userMessage.includes('已有')) {
    choice = 'own'
  } else if (userMessage.includes('.')) {
    // 用戶直接輸入網域名稱
    domainName = userMessage.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
    choice = userMessage.includes('購買') ? 'purchase' : 'own'
  }

  // 記錄用戶回覆
  await step.run('record-domain-choice', async () => {
    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    }

    const { data: conv } = await supabase
      .from('conversations')
      .select('messages')
      .eq('id', conversationId)
      .single()

    await supabase
      .from('conversations')
      .update({
        messages: [...(conv?.messages || []), userMsg],
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
  })

  // 根據選擇執行對應流程
  switch (choice) {
    case 'free':
      return await handleFreeDomain(step, projectId, conversationId, projectInfo.vercel_url)

    case 'purchase':
      return await handlePurchaseDomain(step, projectId, conversationId, domainName)

    case 'own':
      return await handleOwnDomain(step, projectId, conversationId, domainName)

    default:
      return { success: false, error: '無效的選擇' }
  }
}

// 使用免費網域
async function handleFreeDomain(
  step: DomainManagerSkillInput['step'],
  projectId: string,
  conversationId: string,
  vercelUrl?: string
) {
  await step.run('confirm-free-domain', async () => {
    const confirmMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `好的，您的網站將繼續使用免費網域：
**${vercelUrl}**

您隨時可以輸入「設定網域」來升級到自訂網域。`,
      timestamp: new Date().toISOString(),
    }

    const { data: conv } = await supabase
      .from('conversations')
      .select('messages')
      .eq('id', conversationId)
      .single()

    await supabase
      .from('conversations')
      .update({
        messages: [...(conv?.messages || []), confirmMessage],
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
  })

  return { success: true, domain: vercelUrl, type: 'free' }
}

// 購買網域流程（僅註冊，不含 DNS 設定）
async function handlePurchaseDomain(
  step: DomainManagerSkillInput['step'],
  projectId: string,
  conversationId: string,
  suggestedDomain?: string
) {
  // 如果沒有指定網域，詢問用戶
  if (!suggestedDomain) {
    await step.run('ask-domain-name', async () => {
      const askMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `請輸入您想購買的網域名稱（如 myapp.com）：

常見的頂級域名價格：
- .com - $9.73/年
- .io - $33.73/年
- .dev - $12.18/年
- .app - $12.18/年

我會幫您查詢是否可用。`,
        timestamp: new Date().toISOString(),
      }

      const { data: conv } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single()

      await supabase
        .from('conversations')
        .update({
          messages: [...(conv?.messages || []), askMessage],
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
    })

    const domainReply = await step.waitForEvent('wait-for-domain-name', {
      event: 'user/reply',
      timeout: '24h',
      match: 'data.conversationId',
    })

    if (!domainReply) {
      return { success: false, error: 'timeout' }
    }

    suggestedDomain = domainReply.data.message.trim().toLowerCase()
  }

  // 查詢網域可用性
  const { searchDomain } = await import('../../actions/domain')

  const availability = await step.run('check-domain-availability', async () => {
    return await searchDomain(suggestedDomain!)
  })

  if (availability.status === 'unavailable') {
    await step.run('domain-unavailable', async () => {
      const unavailableMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `很抱歉，**${suggestedDomain}** 已被註冊。

請嘗試其他網域名稱，或考慮使用不同的頂級域名（如 .io, .dev, .app）。`,
        timestamp: new Date().toISOString(),
      }

      const { data: conv } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single()

      await supabase
        .from('conversations')
        .update({
          messages: [...(conv?.messages || []), unavailableMessage],
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
    })

    return { success: false, error: 'domain_unavailable', domain: suggestedDomain }
  }

  // 詢問 registrant 資訊
  await step.run('ask-registrant-info', async () => {
    const askMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `**${suggestedDomain}** 可以註冊！（${availability.message}）

請提供網域註冊資訊（用於 WHOIS 記錄），依序輸入，用換行分隔：

1. 姓名（英文，如 San Zhang）
2. Email
3. 電話（含國碼，如 +886912345678）
4. 地址（英文）
5. 城市（英文）
6. 州/省（英文）
7. 郵遞區號
8. 國家代碼（如 TW, US, JP）`,
      timestamp: new Date().toISOString(),
    }

    const { data: conv } = await supabase
      .from('conversations')
      .select('messages')
      .eq('id', conversationId)
      .single()

    await supabase
      .from('conversations')
      .update({
        messages: [...(conv?.messages || []), askMessage],
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
  })

  const registrantReply = await step.waitForEvent('wait-for-registrant-info', {
    event: 'user/reply',
    timeout: '24h',
    match: 'data.conversationId',
  })

  if (!registrantReply) {
    return { success: false, error: 'timeout' }
  }

  // 解析 registrant 資訊
  const lines = registrantReply.data.message.trim().split('\n').map((l: string) => l.trim()).filter((l: string) => l)

  if (lines.length < 8) {
    await step.run('invalid-registrant-info', async () => {
      const errorMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `資訊不完整，請確保提供所有 8 項資訊。您可以重新輸入「購買網域」再試一次。`,
        timestamp: new Date().toISOString(),
      }

      const { data: conv } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single()

      await supabase
        .from('conversations')
        .update({
          messages: [...(conv?.messages || []), errorMessage],
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
    })

    return { success: false, error: 'invalid_registrant_info' }
  }

  const nameParts = lines[0].split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || firstName

  const registrant = {
    firstName,
    lastName,
    email: lines[1],
    phone: lines[2],
    address: lines[3],
    city: lines[4],
    state: lines[5],
    postalCode: lines[6],
    country: lines[7].toUpperCase(),
  }

  // 執行網域註冊（僅 Porkbun）
  const { registerDomain } = await import('../../actions/porkbun')

  const registerResult = await step.run('register-domain', async () => {
    return await registerDomain(suggestedDomain!, 1, registrant)
  })

  if (!registerResult.success) {
    await step.run('register-failed', async () => {
      const errorMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `網域註冊失敗：${registerResult.error}

請稍後再試。`,
        timestamp: new Date().toISOString(),
      }

      const { data: conv } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single()

      await supabase
        .from('conversations')
        .update({
          messages: [...(conv?.messages || []), errorMessage],
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
    })

    return { success: false, error: registerResult.error, domain: suggestedDomain }
  }

  // 更新專案（僅記錄網域，DNS 尚未設定）
  await step.run('update-project-domain-pending', async () => {
    await supabase
      .from('projects')
      .update({
        custom_domain: suggestedDomain,
        domain_status: 'registered', // 已註冊，但 DNS 尚未設定
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
  })

  // 發送成功訊息，提示下一步
  await step.run('send-register-success', async () => {
    const successMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `網域註冊成功！

**網域**：${suggestedDomain}
**到期日**：${registerResult.expireDate}

---

**下一步**：輸入「設定 DNS」來完成 DNS 設定並綁定到您的專案。`,
      timestamp: new Date().toISOString(),
    }

    const { data: conv } = await supabase
      .from('conversations')
      .select('messages')
      .eq('id', conversationId)
      .single()

    await supabase
      .from('conversations')
      .update({
        messages: [...(conv?.messages || []), successMessage],
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
  })

  return {
    success: true,
    domain: suggestedDomain,
    type: 'purchase',
    status: 'registered',
    expireDate: registerResult.expireDate,
  }
}

// ============================================================
// Domain Purchase Skill（獨立入口）
// ============================================================

async function executeDomainPurchaseSkill(input: DomainManagerSkillInput) {
  const { step, projectId, conversationId } = input

  return await handlePurchaseDomain(step, projectId, conversationId)
}

// ============================================================
// Domain DNS Skill（設定 DNS + 綁定 Vercel）
// ============================================================

async function executeDomainDnsSkill(input: DomainManagerSkillInput) {
  const { step, projectId, conversationId } = input

  // 取得專案資訊
  const projectInfo = await step.run('get-project-for-dns', async () => {
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, custom_domain, domain_status, vercel_project_id, vercel_url')
      .eq('id', projectId)
      .single()

    return project
  })

  if (!projectInfo) {
    return { success: false, error: '專案不存在' }
  }

  let domain = projectInfo.custom_domain

  // 如果沒有已註冊的網域，詢問用戶
  if (!domain) {
    await step.run('ask-domain-for-dns', async () => {
      const askMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `請輸入您要設定 DNS 的網域名稱：

（如果您透過平台購買，請先執行「購買網域」）`,
        timestamp: new Date().toISOString(),
      }

      const { data: conv } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single()

      await supabase
        .from('conversations')
        .update({
          messages: [...(conv?.messages || []), askMessage],
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
    })

    const domainReply = await step.waitForEvent('wait-for-dns-domain', {
      event: 'user/reply',
      timeout: '24h',
      match: 'data.conversationId',
    })

    if (!domainReply) {
      return { success: false, error: 'timeout' }
    }

    domain = domainReply.data.message.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
  }

  await step.run('start-dns-setup', async () => {
    const startMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `正在設定 **${domain}** 的 DNS...

1. 建立 Cloudflare Zone
2. 設定 Nameserver
3. 建立 DNS 記錄
4. 綁定到 Vercel

請稍候...`,
      timestamp: new Date().toISOString(),
    }

    const { data: conv } = await supabase
      .from('conversations')
      .select('messages')
      .eq('id', conversationId)
      .single()

    await supabase
      .from('conversations')
      .update({
        messages: [...(conv?.messages || []), startMessage],
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
  })

  // Step 1: 建立 Cloudflare Zone
  const { createZone, setupVercelDns } = await import('../../actions/cloudflare')
  const { updateNameservers } = await import('../../actions/porkbun')

  const zoneResult = await step.run('create-cloudflare-zone', async () => {
    return await createZone(domain!)
  })

  if (!zoneResult.success) {
    await step.run('zone-failed', async () => {
      const errorMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `建立 DNS Zone 失敗：${zoneResult.error}

這可能是因為該網域已經在 Cloudflare 中存在。請稍後再試。`,
        timestamp: new Date().toISOString(),
      }

      const { data: conv } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single()

      await supabase
        .from('conversations')
        .update({
          messages: [...(conv?.messages || []), errorMessage],
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
    })

    return { success: false, error: zoneResult.error, step: 'create_zone' }
  }

  const zoneId = zoneResult.zone!.id
  const nameservers = zoneResult.nameservers!

  // Step 2: 更新 Nameserver（如果是透過平台購買的網域）
  if (projectInfo.domain_status === 'registered') {
    const nsResult = await step.run('update-nameservers', async () => {
      return await updateNameservers(domain!, nameservers)
    })

    if (!nsResult.success) {
      await step.run('ns-failed', async () => {
        const errorMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `更新 Nameserver 失敗：${nsResult.error}

Cloudflare Zone 已建立，請手動設定 Nameserver：
${nameservers.map((ns: string) => `- ${ns}`).join('\n')}`,
          timestamp: new Date().toISOString(),
        }

        const { data: conv } = await supabase
          .from('conversations')
          .select('messages')
          .eq('id', conversationId)
          .single()

        await supabase
          .from('conversations')
          .update({
            messages: [...(conv?.messages || []), errorMessage],
            updated_at: new Date().toISOString(),
          })
          .eq('id', conversationId)
      })

      // 繼續執行，不視為致命錯誤
    }
  }

  // Step 3: 設定 DNS 記錄
  const dnsResult = await step.run('setup-dns-records', async () => {
    return await setupVercelDns(zoneId, domain!, [
      { type: 'A', name: '@', value: '76.76.21.21' },
      { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' },
    ])
  })

  if (!dnsResult.success) {
    await step.run('dns-records-failed', async () => {
      const errorMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `設定 DNS 記錄失敗：${dnsResult.error}

請手動在 Cloudflare 設定以下記錄：
- A 記錄：@ → 76.76.21.21
- CNAME 記錄：www → cname.vercel-dns.com`,
        timestamp: new Date().toISOString(),
      }

      const { data: conv } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single()

      await supabase
        .from('conversations')
        .update({
          messages: [...(conv?.messages || []), errorMessage],
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
    })
  }

  // Step 4: 綁定網域到 Vercel
  let vercelBindSuccess = false

  if (projectInfo.vercel_project_id) {
    const token = process.env.VERCEL_ACCESS_TOKEN
    const teamId = process.env.VERCEL_TEAM_ID

    if (token) {
      const bindResult = await step.run('bind-to-vercel', async () => {
        try {
          const params = new URLSearchParams()
          if (teamId) params.append('teamId', teamId)

          const response = await fetch(
            `https://api.vercel.com/v10/projects/${projectInfo.vercel_project_id}/domains?${params}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ name: domain }),
            }
          )

          const data = await response.json() as { name?: string; error?: { message: string } }

          if (data.error) {
            return { success: false, error: data.error.message }
          }

          return { success: true }
        } catch (err) {
          return { success: false, error: String(err) }
        }
      })

      vercelBindSuccess = bindResult.success
    }
  }

  // 更新專案
  await step.run('update-project-dns-complete', async () => {
    await supabase
      .from('projects')
      .update({
        custom_domain: domain,
        domain_status: 'active',
        cloudflare_zone_id: zoneId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
  })

  // 發送完成訊息
  await step.run('send-dns-complete', async () => {
    const isOwnDomain = projectInfo.domain_status !== 'registered'
    const nsInstructions = isOwnDomain
      ? `\n\n**重要**：請在您的網域註冊商設定以下 Nameserver：\n${nameservers.map((ns: string) => `- ${ns}`).join('\n')}`
      : ''

    const completeMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `DNS 設定完成！

**網域**：${domain}
**Vercel 綁定**：${vercelBindSuccess ? '成功' : '請手動綁定'}
**Cloudflare Zone**：已建立${nsInstructions}

DNS 傳播可能需要幾分鐘到 48 小時。完成後您可以透過 **https://${domain}** 訪問網站。`,
      timestamp: new Date().toISOString(),
    }

    const { data: conv } = await supabase
      .from('conversations')
      .select('messages')
      .eq('id', conversationId)
      .single()

    await supabase
      .from('conversations')
      .update({
        messages: [...(conv?.messages || []), completeMessage],
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
  })

  return {
    success: true,
    domain,
    status: 'active',
    cloudflareZoneId: zoneId,
    nameservers,
    vercelBound: vercelBindSuccess,
  }
}

// 使用自有網域
async function handleOwnDomain(
  step: DomainManagerSkillInput['step'],
  projectId: string,
  conversationId: string,
  domain?: string
) {
  // 如果沒有指定網域，詢問用戶
  if (!domain) {
    await step.run('ask-own-domain', async () => {
      const askMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `請輸入您想綁定的網域名稱（如 myapp.com）：`,
        timestamp: new Date().toISOString(),
      }

      const { data: conv } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single()

      await supabase
        .from('conversations')
        .update({
          messages: [...(conv?.messages || []), askMessage],
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
    })

    const domainReply = await step.waitForEvent('wait-for-own-domain', {
      event: 'user/reply',
      timeout: '24h',
      match: 'data.conversationId',
    })

    if (!domainReply) {
      return { success: false, error: 'timeout' }
    }

    domain = domainReply.data.message.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
  }

  // 取得專案資訊
  const { data: project } = await supabase
    .from('projects')
    .select('vercel_project_id')
    .eq('id', projectId)
    .single()

  // 綁定網域到 Vercel（如果有 vercel_project_id）
  let vercelBindResult: { success: boolean; error?: string } = { success: false }

  if (project?.vercel_project_id) {
    const { deployWithOwnDomain } = await import('../../actions/domain')

    await step.run('bind-domain-to-vercel', async () => {
      const bindMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `正在將 **${domain}** 綁定到您的專案...`,
        timestamp: new Date().toISOString(),
      }

      const { data: conv } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single()

      await supabase
        .from('conversations')
        .update({
          messages: [...(conv?.messages || []), bindMessage],
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
    })

    // 呼叫 Vercel API 綁定網域
    const token = process.env.VERCEL_ACCESS_TOKEN
    const teamId = process.env.VERCEL_TEAM_ID

    if (token) {
      vercelBindResult = await step.run('vercel-add-domain', async () => {
        try {
          const params = new URLSearchParams()
          if (teamId) params.append('teamId', teamId)

          const response = await fetch(
            `https://api.vercel.com/v10/projects/${project.vercel_project_id}/domains?${params}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ name: domain }),
            }
          )

          const data = await response.json() as { name?: string; error?: { message: string } }

          if (data.error) {
            return { success: false, error: data.error.message }
          }

          return { success: true }
        } catch (err) {
          return { success: false, error: String(err) }
        }
      })
    }
  }

  // 更新專案的 custom_domain
  await step.run('update-project-domain', async () => {
    await supabase
      .from('projects')
      .update({
        custom_domain: domain,
        domain_status: 'pending_dns',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
  })

  // 提供 DNS 設定說明
  await step.run('provide-dns-instructions', async () => {
    const bindStatus = vercelBindResult.success
      ? '已成功將網域綁定到 Vercel。'
      : `Vercel 綁定狀態：${vercelBindResult.error || '待確認'}`

    const dnsMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `${bindStatus}

請在您的 DNS 管理介面設定以下記錄：

**A 記錄**
- 主機名稱：\`@\` (或留空)
- 指向：\`76.76.21.21\`

**CNAME 記錄**
- 主機名稱：\`www\`
- 指向：\`cname.vercel-dns.com\`

---

設定完成後，DNS 傳播通常需要 5 分鐘至 48 小時。

完成後您可以透過 **https://${domain}** 訪問網站。`,
      timestamp: new Date().toISOString(),
    }

    const { data: conv } = await supabase
      .from('conversations')
      .select('messages')
      .eq('id', conversationId)
      .single()

    await supabase
      .from('conversations')
      .update({
        messages: [...(conv?.messages || []), dnsMessage],
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
  })

  return {
    success: true,
    domain,
    type: 'own',
    status: 'pending_dns',
    vercelBound: vercelBindResult.success,
    dnsRecords: [
      { type: 'A', name: '@', value: '76.76.21.21' },
      { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' },
    ],
  }
}

// ============================================================
// 匯出所有 Functions
// ============================================================

export const functions = [handleUserRequest]
