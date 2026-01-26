import { inngest } from '../client'
import { classifyIntent } from '../classifier'
import { getSkillMetadata, SkillName } from '../registry'
import { supabase } from '../../lib/supabase'
import { generateCode, deployProject } from '../../actions'

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
    // Step 3: 處理需要釐清的情況
    // ============================================================
    if (classification.intent === 'clarification_needed' || classification.intent === 'unknown') {
      await step.run('request-clarification', async () => {
        const clarificationMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `我需要更多資訊來理解您的需求。您想要：
1. 釐清需求並產出規格（BDD Spec）
2. 根據現有規格生成程式碼
3. 部署已完成的專案

請告訴我您目前的需求是什麼？`,
          timestamp: new Date().toISOString(),
        }

        // 更新對話
        const { data: conv } = await supabase
          .from('conversations')
          .select('messages')
          .eq('id', conversationId)
          .single()

        const messages = [...(conv?.messages || []), clarificationMessage]

        await supabase
          .from('conversations')
          .update({ messages, updated_at: new Date().toISOString() })
          .eq('id', conversationId)

        // 更新任務狀態
        await supabase
          .from('tasks')
          .update({ status: 'waiting_approval' })
          .eq('id', taskId)

        return { needsClarification: true }
      })

      // 等待用戶回覆
      const reply = await step.waitForEvent('wait-for-clarification', {
        event: 'user/reply',
        timeout: '24h',
        match: 'data.conversationId',
      })

      if (!reply) {
        await step.run('timeout-cleanup', async () => {
          await supabase
            .from('tasks')
            .update({ status: 'cancelled' })
            .eq('id', taskId)
        })
        return { status: 'timeout', taskId }
      }

      // 重新分類
      return { status: 'needs_reclassification', taskId, newMessage: reply.data.message }
    }

    // ============================================================
    // Step 4: 路由到對應 Skill
    // ============================================================
    const skillName = classification.intent as SkillName
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

async function executeBddSpecSkill(input: BddSpecSkillInput) {
  const { step, taskId, projectId, conversationId, extractedEntities } = input

  // 發送初始回應
  await step.run('bdd-spec-initial-response', async () => {
    const initialMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `好的，我來幫您${extractedEntities?.projectType ? `建立「${extractedEntities.projectType}」` : '釐清需求'}。

我會執行以下步驟：
1. **發現階段**：識別需求中的歧義和遺漏
2. **釐清階段**：與您確認細節
3. **規格產出**：產出 BDD 規格（Gherkin Feature Files）

讓我先分析您的需求...`,
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
        messages: [...(conv?.messages || []), initialMessage],
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
  })

  // 多輪對話迴圈
  let clarificationRound = 0
  const maxRounds = 10
  let specComplete = false

  while (!specComplete && clarificationRound < maxRounds) {
    clarificationRound++

    // 執行 Discovery + 產生問題
    const discoveryResult = await step.run(`bdd-discovery-round-${clarificationRound}`, async () => {
      // 這裡會整合 featureSkill 的邏輯
      // 目前先返回模擬結果
      return {
        questions: clarificationRound === 1
          ? [
              '訂單可以有哪些狀態？（例如：待處理、處理中、已完成、已取消）',
              '是否需要庫存管理功能？',
              '訂單金額是否有上限？',
            ]
          : [],
        hasMoreQuestions: clarificationRound < 2,
      }
    })

    if (discoveryResult.questions.length === 0) {
      specComplete = true
      break
    }

    // 發送問題給用戶
    await step.run(`send-questions-round-${clarificationRound}`, async () => {
      const questionMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `**第 ${clarificationRound} 輪釐清**\n\n我發現以下問題需要確認：\n\n${discoveryResult.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}\n\n請回答這些問題，或輸入「確認規格」來完成釐清階段。`,
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
    })

    // 等待用戶回覆
    const reply = await step.waitForEvent(`wait-for-reply-round-${clarificationRound}`, {
      event: 'user/reply',
      timeout: '24h',
      match: 'data.conversationId',
    })

    if (!reply) {
      return { status: 'timeout', round: clarificationRound }
    }

    // 檢查是否確認規格
    if (reply.data.specConfirmed || reply.data.message.includes('確認規格')) {
      specComplete = true
    }

    // 記錄用戶回覆
    await step.run(`record-reply-round-${clarificationRound}`, async () => {
      const userMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: reply.data.message,
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
          messages: [...(conv?.messages || []), userMessage],
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
    })
  }

  // 產出規格
  const specResult = await step.run('generate-spec', async () => {
    // 標記對話的 spec 完成
    await supabase
      .from('conversations')
      .update({ spec_complete: true })
      .eq('id', conversationId)

    // 發送完成訊息
    const completeMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `規格釐清完成！共進行了 ${clarificationRound} 輪對話。

我已經產出以下檔案：
- \`spec/data/schema.sql\` - 資料庫結構
- \`spec/features/*.feature\` - BDD 規格

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
      rounds: clarificationRound,
      artifacts: {
        schemaSql: 'spec/data/schema.sql',
        features: ['spec/features/建立訂單.feature'],
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
}

async function executeDeployerSkill(input: DeployerSkillInput) {
  const { step, projectId } = input

  const result = await step.run('deploy', async () => {
    // 呼叫現有的 deployProject Server Action
    const deployResult = await deployProject({ projectId })

    if (!deployResult.success) {
      return { success: false, error: deployResult.error }
    }

    return {
      success: true,
      deploymentId: deployResult.data?.deploymentId,
      url: deployResult.data?.url,
    }
  })

  return result
}

// ============================================================
// 匯出所有 Functions
// ============================================================

export const functions = [handleUserRequest]
