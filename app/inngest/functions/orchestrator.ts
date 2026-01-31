import { inngest } from '../client'
import { classifyIntent } from '../classifier'
import { getSkillMetadata, SkillName } from '../registry'
import { supabase } from '../../lib/supabase'
import { generateCode, deployProjectFromDb, createBddSession, getBddSession, updateBddSession, addClarifyItems, answerClarifyItem, confirmBatch, revertAnswer } from '../../actions'
import {
  runPrdDiscovery,
  generateSchemaSql,
  generateFeatureFiles,
  runSpecDiscovery,
  generateActionsYml,
  generateIsaConfig,
  fixMultipleFeatures,
  validateMultipleFeatures,
  generateClarifySummary,
  type ClarifyItem,
  type ValidationError,
  type ValidationWarning
} from '../../lib/llm'

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
    // Step 1.5: 立即發送確認消息（優化感知延遲）
    // ============================================================
    await step.run('send-immediate-response', async () => {
      const immediateMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '收到！讓我先了解一下你的需求，稍後會有幾個問題想確認。',
        timestamp: new Date().toISOString(),
        stage: 'init',
      }

      const { data: conv } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .single()

      await supabase
        .from('conversations')
        .update({
          messages: [...(conv?.messages || []), immediateMessage],
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
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
// BDD Spec Skill 執行 - 完整 5 階段流程
// ============================================================
//
// Phase 1: PRD Discovery + Clarify
//   - 使用 A1-A6, B1-B5, C1-C2, D1-D2 檢查清單掃描需求
//   - 迭代釐清直到連續 2 輪無新問題
//
// Phase 2: Formulation
//   - 產出 schema.sql + feature files
//   - 執行驗證腳本（自癒機制）
//
// Phase 3: Spec Discovery + Clarify
//   - 對 Feature Files 再次 Discovery
//   - 迭代釐清
//
// Phase 4: Actions Design
//   - 產出 actions.yml
//
// Phase 5: ISA Config
//   - 產出 isa_codegen.yml
//
// ============================================================

// Feature 類型定義
interface FeatureFile {
  name: string
  actionName?: string
  content: string
}

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

// 輔助函數：發送消息到對話
async function sendMessage(conversationId: string, content: string, stage?: string) {
  const message = {
    id: crypto.randomUUID(),
    role: 'assistant',
    content,
    timestamp: new Date().toISOString(),
    stage,
  }

  const { data: conv } = await supabase
    .from('conversations')
    .select('messages')
    .eq('id', conversationId)
    .single()

  await supabase
    .from('conversations')
    .update({
      messages: [...(conv?.messages || []), message],
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
}

// 輔助函數：格式化釐清問題（簡潔版：只顯示問題和選項）
function formatClarifyQuestion(item: ClarifyItem, _index: number, _total: number): string {
  let text = item.whiteTextQuestion || item.question

  if (item.options && item.options.length > 0) {
    text += '\n\n'
    text += item.options.map((opt, j) =>
      `${String.fromCharCode(65 + j)}. ${opt.description || opt.label}`
    ).join('\n')
  }

  return text
}

async function executeBddSpecSkill(input: BddSpecSkillInput) {
  const { step, taskId, projectId, conversationId, userId: _userId, message } = input

  // ============================================================
  // 初始化：取得專案背景 & 創建 BDD Session
  // ============================================================

  const projectContext = await step.run('get-project-context', async () => {
    const { data: project } = await supabase
      .from('projects')
      .select('name, description')
      .eq('id', projectId)
      .single()

    return project?.description || project?.name || undefined
  })

  const sessionId = await step.run('create-bdd-session', async () => {
    const result = await createBddSession({
      projectId,
      conversationId,
      taskId,
      originalRequirements: message,
      projectContext: projectContext || undefined,
    })

    if (!result.success || !result.data) {
      throw new Error(result.error || '創建 BDD Session 失敗')
    }

    return result.data.sessionId
  })

  // 注意：前端已有即時回應（send-immediate-response），這裡不再發送歡迎消息
  // 避免重複訊息，直接進入 PRD Discovery

  // ============================================================
  // Phase 1: PRD Discovery + Clarify
  // ============================================================

  // Phase 1.1: PRD Discovery
  const prdDiscoveryResult = await step.run('prd-discovery', async () => {
    console.log('[BDD Phase 1] 開始 PRD Discovery')

    const result = await runPrdDiscovery(
      message,
      projectContext || undefined,
      undefined,
      { conversationId, purpose: 'prd_discovery' }
    )

    if (!result.success) {
      throw new Error(result.error || 'PRD Discovery 失敗')
    }

    console.log('[BDD Phase 1] 發現問題數量:', result.items?.length || 0)

    // 儲存到 BDD Session
    if (result.items && result.items.length > 0) {
      await addClarifyItems({ sessionId, items: result.items })
    }

    return {
      itemCount: result.items?.length || 0,
      coverageSummary: result.coverageSummary,
    }
  })

  // 更新階段
  await step.run('update-phase-prd-clarify', async () => {
    await updateBddSession({
      sessionId,
      updates: { currentPhase: 'prd_clarify' },
    })

    if (prdDiscoveryResult.itemCount === 0) {
      await sendMessage(
        conversationId,
        `需求很清楚，正在產出規格...`,
        'prd_discovery_complete'
      )
    }
    // 如果有問題要釐清，不發送額外消息，直接進入問答
  })

  // Phase 1.2: PRD Clarify Loop
  let consecutiveEmptyRounds = 0
  let questionIndex = 0
  let batchCount = 0
  let loopIteration = 0 // 確保 step name 唯一的計數器
  const BATCH_SIZE = 5

  while (consecutiveEmptyRounds < 2) {
    loopIteration++
    // 取得當前 session 狀態
    const sessionData = await step.run(`get-session-${loopIteration}`, async () => {
      const result = await getBddSession({ sessionId })
      return result.data
    })

    if (!sessionData) break

    const pendingItems = sessionData.clarifyItems.filter(
      (item: ClarifyItem) => item.status === 'pending'
    )

    // 如果沒有待處理問題，進行再次 Discovery
    if (pendingItems.length === 0) {
      const moreDiscovery = await step.run(`re-discovery-${sessionData.currentRound}`, async () => {
        const existingItems = [
          ...sessionData.clarifyItems,
          ...sessionData.stagingItems,
          ...sessionData.resolvedItems,
        ]

        const result = await runPrdDiscovery(
          message,
          projectContext || undefined,
          existingItems,
          { conversationId, purpose: 're_discovery' }
        )

        if (!result.success || !result.items?.length) {
          return { newItems: [] }
        }

        // 添加新問題
        await addClarifyItems({ sessionId, items: result.items })

        return { newItems: result.items }
      })

      if (moreDiscovery.newItems.length === 0) {
        consecutiveEmptyRounds++
        await step.run(`update-empty-round-${consecutiveEmptyRounds}`, async () => {
          await updateBddSession({
            sessionId,
            updates: {
              consecutiveEmptyRounds,
              currentRound: sessionData.currentRound + 1,
            },
          })
        })
        continue
      } else {
        consecutiveEmptyRounds = 0
        continue
      }
    }

    // 重置連續空輪數
    consecutiveEmptyRounds = 0

    // 取得當前問題（按優先級排序）
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    pendingItems.sort((a: ClarifyItem, b: ClarifyItem) =>
      priorityOrder[a.priority] - priorityOrder[b.priority]
    )
    const currentItem = pendingItems[0]
    const totalPending = sessionData.totalDiscovered - sessionData.totalResolved

    // 發送問題
    await step.run(`send-question-${loopIteration}`, async () => {
      const questionText = formatClarifyQuestion(currentItem, questionIndex, totalPending)
      await sendMessage(conversationId, questionText, 'clarify_question')
    })

    // 等待用戶回覆
    const reply = await step.waitForEvent(`wait-reply-${loopIteration}`, {
      event: 'user/reply',
      timeout: '24h',
      match: 'data.conversationId',
    })

    if (!reply) {
      return { status: 'timeout', phase: 'prd_clarify', questionIndex }
    }

    const userMessage = reply.data.message.trim()

    // 處理特殊指令
    if (userMessage === '跳過' || userMessage.toLowerCase() === 'skip') {
      await step.run(`skip-question-${loopIteration}`, async () => {
        // 更新項目狀態為 skipped
        const session = await getBddSession({ sessionId })
        if (session.data) {
          const clarifyItems = session.data.clarifyItems.map((item: ClarifyItem) =>
            item.id === currentItem.id ? { ...item, status: 'skipped' as const } : item
          )
          const resolvedItems = [...session.data.resolvedItems, { ...currentItem, status: 'skipped' as const }]
          await updateBddSession({
            sessionId,
            updates: {
              clarifyItems: clarifyItems.filter((item: ClarifyItem) => item.id !== currentItem.id),
              resolvedItems,
            },
          })
        }
      })
      questionIndex++
      continue
    }

    if (userMessage === '完成釐清' || userMessage.toLowerCase() === 'done') {
      // 確認所有 staging 項目
      await step.run('confirm-all-staging', async () => {
        await confirmBatch({ sessionId })
      })
      break
    }

    // 記錄答案
    await step.run(`record-answer-${loopIteration}`, async () => {
      await answerClarifyItem({
        sessionId,
        itemId: currentItem.id,
        answer: userMessage,
      })
    })

    questionIndex++
    batchCount++

    // 每 5 題批量確認
    if (batchCount >= BATCH_SIZE) {
      const stagingSession = await step.run(`get-staging-${loopIteration}`, async () => {
        const result = await getBddSession({ sessionId })
        return result.data
      })

      if (stagingSession && stagingSession.stagingItems.length > 0) {
        // 發送確認檢查點
        await step.run(`send-batch-confirm-${loopIteration}`, async () => {
          let confirmText = `---\n📋 **釐清確認檢查點**\n\n以下 ${stagingSession.stagingItems.length} 題已回答完成，請確認是否正確：\n\n`
          confirmText += `| # | 問題摘要 | 您的回答 |\n|---|----------|----------|\n`
          stagingSession.stagingItems.forEach((item: ClarifyItem, i: number) => {
            const question = (item.whiteTextQuestion || item.question).slice(0, 30) + '...'
            const answer = (item.answer || '').slice(0, 20) + '...'
            confirmText += `| ${i + 1} | ${question} | ${answer} |\n`
          })
          confirmText += `\n請選擇：\n`
          confirmText += `- **確認全部 (Y)** - 確認以上答案並繼續\n`
          confirmText += `- **修改第 N 題** - 例如輸入「修改 3」重新回答\n`
          confirmText += `---`

          await sendMessage(conversationId, confirmText, 'batch_confirm')
        })

        // 等待確認
        const confirmReply = await step.waitForEvent(`wait-batch-confirm-${loopIteration}`, {
          event: 'user/reply',
          timeout: '24h',
          match: 'data.conversationId',
        })

        if (confirmReply) {
          const confirmMessage = confirmReply.data.message.trim().toLowerCase()

          if (confirmMessage === 'y' || confirmMessage === '確認' || confirmMessage === '確認全部') {
            await step.run(`confirm-batch-${loopIteration}`, async () => {
              await confirmBatch({ sessionId })
            })
          } else if (confirmMessage.startsWith('修改')) {
            // 解析「修改 N」指令
            const modifyMatch = confirmMessage.match(/修改\s*(\d+)/)
            if (modifyMatch) {
              const itemIndex = parseInt(modifyMatch[1], 10) - 1 // 轉換為 0-based index
              if (itemIndex >= 0 && itemIndex < stagingSession.stagingItems.length) {
                const itemToRevert = stagingSession.stagingItems[itemIndex]
                await step.run(`revert-answer-${loopIteration}`, async () => {
                  await revertAnswer({ sessionId, itemId: itemToRevert.id })
                  await sendMessage(
                    conversationId,
                    `已將第 ${itemIndex + 1} 題移回待回答。稍後會重新詢問這個問題。`,
                    'revert_confirm'
                  )
                })
                // 不 confirmBatch，讓循環繼續處理被反悔的項目
              } else {
                // 索引超出範圍
                await step.run(`revert-invalid-index-${loopIteration}`, async () => {
                  await sendMessage(
                    conversationId,
                    `無效的題號 ${itemIndex + 1}，有效範圍是 1-${stagingSession.stagingItems.length}。已確認所有答案。`,
                    'revert_invalid'
                  )
                  await confirmBatch({ sessionId })
                })
              }
            } else {
              // 無法解析修改指令
              await step.run(`confirm-batch-fallback-${loopIteration}`, async () => {
                await sendMessage(
                  conversationId,
                  `無法解析修改指令，請使用「修改 N」格式（如「修改 3」）。已確認所有答案。`,
                  'revert_parse_error'
                )
                await confirmBatch({ sessionId })
              })
            }
          }
        }
      }

      batchCount = 0
    }
  }

  // 確認剩餘的 staging 項目
  await step.run('confirm-remaining-staging', async () => {
    await confirmBatch({ sessionId })
  })

  // ============================================================
  // Phase 2: Formulation - 產出規格
  // ============================================================

  // 生成釐清摘要
  await step.run('generate-clarify-summary', async () => {
    const session = await getBddSession({ sessionId })
    if (!session.data) return

    const summaryResult = await generateClarifySummary(
      message,
      session.data.resolvedItems,
      { conversationId, purpose: 'clarify_summary' }
    )

    if (summaryResult.success && summaryResult.summary) {
      await sendMessage(conversationId, summaryResult.summary, 'clarify_summary')
    }
  })

  await step.run('update-phase-formulation', async () => {
    await updateBddSession({
      sessionId,
      updates: { currentPhase: 'formulation' },
    })
    await sendMessage(
      conversationId,
      `正在產出規格文件...`,
      'formulation_start'
    )
  })

  // 產出 Schema
  const schemaResult = await step.run('generate-schema', async () => {
    const session = await getBddSession({ sessionId })
    if (!session.data) throw new Error('Session 不存在')

    const result = await generateSchemaSql(
      message,
      session.data.resolvedItems,
      projectContext || undefined,
      { conversationId, purpose: 'generate_schema' }
    )

    if (!result.success) {
      throw new Error(result.error || '產出 Schema 失敗')
    }

    await updateBddSession({
      sessionId,
      updates: {
        schemaSqlContent: result.schemaSql,
        entityMappingContent: result.entityMapping,
      },
    })

    return {
      schemaSql: result.schemaSql,
      entityMapping: result.entityMapping,
    }
  })

  // 產出 Feature Files
  const featuresResult = await step.run('generate-features', async () => {
    const session = await getBddSession({ sessionId })
    if (!session.data) throw new Error('Session 不存在')

    const result = await generateFeatureFiles(
      message,
      session.data.resolvedItems,
      schemaResult.schemaSql || '',
      schemaResult.entityMapping || '',
      projectContext || undefined,
      { conversationId, purpose: 'generate_features' }
    )

    if (!result.success) {
      throw new Error(result.error || '產出 Feature Files 失敗')
    }

    await updateBddSession({
      sessionId,
      updates: {
        featuresContent: result.features,
      },
    })

    return { features: result.features }
  })

  // 驗證 Feature Files（使用真實驗證函數）
  let validationResult = await step.run('validate-features', async () => {
    const features = (featuresResult.features || []).map((f: FeatureFile) => ({
      name: f.name,
      content: f.content,
    }))

    const validation = validateMultipleFeatures(features)

    // 轉換為簡化格式存儲
    const errors = validation.allErrors.map(e =>
      `[${e.code}]${e.line ? ` 行 ${e.line}` : ''} ${e.message}${e.suggestion ? ` (建議: ${e.suggestion})` : ''}`
    )
    const warnings = validation.allWarnings.map(w =>
      `[${w.code}]${w.line ? ` 行 ${w.line}` : ''} ${w.message}`
    )

    await updateBddSession({
      sessionId,
      updates: {
        validationResult: {
          passed: validation.passed,
          errors,
          warnings,
        },
      },
    })

    return {
      passed: validation.passed,
      errors,
      warnings,
      totalErrors: validation.totalErrors,
      totalWarnings: validation.totalWarnings,
      detailedResults: validation.results,
    }
  })

  // 如果驗證失敗，嘗試修復（最多 3 次）
  if (!validationResult.passed) {
    let fixAttempt = 0
    const maxFixAttempts = 3

    while (fixAttempt < maxFixAttempts && !validationResult.passed) {
      fixAttempt++

      // 發送修復進度訊息
      await step.run(`send-fix-progress-${fixAttempt}`, async () => {
        await sendMessage(
          conversationId,
          `驗證發現 ${validationResult.errors.length} 個格式問題，正在自動修復 (嘗試 ${fixAttempt}/${maxFixAttempts})...`,
          'fix_attempt'
        )
      })

      // 批量修復所有有錯誤的 Features（一次 LLM 調用，節省 Token）
      const fixedFeatures = await step.run(`fix-features-${fixAttempt}`, async () => {
        const session = await getBddSession({ sessionId })
        if (!session.data?.featuresContent) return []

        // 收集需要修復的 Features 和它們的錯誤
        const featuresToFix: Array<{ name: string; content: string; errors: string[] }> = []
        const featuresNoError: FeatureFile[] = []

        for (const feature of session.data.featuresContent) {
          const featureErrors = validationResult.errors.filter((e: string) =>
            e.includes(feature.name)
          )

          if (featureErrors.length > 0) {
            featuresToFix.push({
              name: feature.name,
              content: feature.content,
              errors: featureErrors,
            })
          } else {
            featuresNoError.push(feature)
          }
        }

        // 如果沒有需要修復的，直接返回
        if (featuresToFix.length === 0) {
          return session.data.featuresContent
        }

        // 一次 LLM 調用批量修復所有 Features
        const fixResult = await fixMultipleFeatures(
          featuresToFix,
          { conversationId, purpose: 'fix_features_batch' }
        )

        // 合併結果
        let results: FeatureFile[]
        if (fixResult.success && fixResult.fixedFeatures) {
          // 用修復後的內容替換原來的
          const fixedMap = new Map(
            fixResult.fixedFeatures.map(f => [f.name, f.content])
          )
          results = session.data.featuresContent.map((f: FeatureFile) => {
            const fixedContent = fixedMap.get(f.name)
            return fixedContent ? { ...f, content: fixedContent } : f
          })
        } else {
          // 修復失敗，保留原來的
          results = session.data.featuresContent
        }

        // 更新 session
        await updateBddSession({
          sessionId,
          updates: { featuresContent: results },
        })

        return results
      })

      // 真正重新驗證
      validationResult = await step.run(`revalidate-features-${fixAttempt}`, async () => {
        const features = (fixedFeatures || []).map((f: FeatureFile) => ({
          name: f.name,
          content: f.content,
        }))

        const validation = validateMultipleFeatures(features)

        const errors = validation.allErrors.map((e: ValidationError) =>
          `[${e.code}]${e.line ? ` 行 ${e.line}` : ''} ${e.message}${e.suggestion ? ` (建議: ${e.suggestion})` : ''}`
        )
        const warnings = validation.allWarnings.map((w: ValidationWarning) =>
          `[${w.code}]${w.line ? ` 行 ${w.line}` : ''} ${w.message}`
        )

        await updateBddSession({
          sessionId,
          updates: {
            validationResult: {
              passed: validation.passed,
              errors,
              warnings,
            },
          },
        })

        return {
          passed: validation.passed,
          errors,
          warnings,
          totalErrors: validation.totalErrors,
          totalWarnings: validation.totalWarnings,
          detailedResults: validation.results,
        }
      })

      // 如果還是失敗且已達最大嘗試次數，發送警告
      if (!validationResult.passed && fixAttempt >= maxFixAttempts) {
        await step.run('send-fix-failed-warning', async () => {
          await sendMessage(
            conversationId,
            `⚠️ 自動修復未能解決所有問題 (嘗試 ${fixAttempt} 次)。\n` +
            `剩餘問題：\n${validationResult.errors.slice(0, 5).map((e: string) => `- ${e}`).join('\n')}` +
            (validationResult.errors.length > 5 ? `\n... 還有 ${validationResult.errors.length - 5} 個問題` : '') +
            `\n\n將繼續進行，但可能需要人工檢查規格。`,
            'fix_warning'
          )
        })
      }
    }
  }

  // ============================================================
  // Phase 3: Spec Discovery + Clarify（完整實現）
  // ============================================================

  await step.run('update-phase-spec-discovery', async () => {
    await updateBddSession({
      sessionId,
      updates: { currentPhase: 'spec_discovery' },
    })
  })

  // Spec Discovery
  const specDiscoveryResult = await step.run('spec-discovery', async () => {
    const session = await getBddSession({ sessionId })
    if (!session.data?.featuresContent) {
      return { items: [] }
    }

    const features = session.data.featuresContent.map((f: FeatureFile) => ({
      name: f.name,
      content: f.content,
    }))

    const result = await runSpecDiscovery(
      features,
      session.data.schemaSqlContent || '',
      session.data.resolvedItems,
      { conversationId, purpose: 'spec_discovery' }
    )

    if (!result.success || !result.items?.length) {
      return { items: [] }
    }

    // 為 Spec Discovery 的項目添加來源標記
    const itemsWithSource = result.items.map(item => ({
      ...item,
      checklistItem: 'spec_discovery', // 標記來源
    }))

    return { items: itemsWithSource }
  })

  // 如果有新問題，進入 Spec Clarify 完整循環
  if (specDiscoveryResult.items.length > 0) {
    // 更新階段並添加釐清項目
    await step.run('update-phase-spec-clarify', async () => {
      await addClarifyItems({ sessionId, items: specDiscoveryResult.items })
      await updateBddSession({
        sessionId,
        updates: { currentPhase: 'spec_clarify' },
      })
      await sendMessage(
        conversationId,
        `規格產出完成，還有 **${specDiscoveryResult.items.length}** 個細節想確認。`,
        'spec_discovery_complete'
      )
    })

    // Spec Clarify 循環 (複用 PRD Clarify 的邏輯)
    let specConsecutiveEmptyRounds = 0
    let specQuestionIndex = 0
    let specBatchCount = 0
    let specLoopIteration = 0 // 確保 step name 唯一的計數器

    while (specConsecutiveEmptyRounds < 2) {
      specLoopIteration++
      // 取得當前 session 狀態
      const specSessionData = await step.run(`get-spec-session-${specLoopIteration}`, async () => {
        const result = await getBddSession({ sessionId })
        return result.data
      })

      if (!specSessionData) break

      const specPendingItems = specSessionData.clarifyItems.filter(
        (item: ClarifyItem) => item.status === 'pending'
      )

      // 如果沒有待處理問題，進行再次 Discovery
      if (specPendingItems.length === 0) {
        const moreSpecDiscovery = await step.run(`spec-re-discovery-${specSessionData.currentRound}`, async () => {
          const session = await getBddSession({ sessionId })
          if (!session.data?.featuresContent) return { newItems: [] }

          const features = session.data.featuresContent.map((f: FeatureFile) => ({
            name: f.name,
            content: f.content,
          }))

          const existingItems = [
            ...specSessionData.clarifyItems,
            ...specSessionData.stagingItems,
            ...specSessionData.resolvedItems,
          ]

          const result = await runSpecDiscovery(
            features,
            session.data.schemaSqlContent || '',
            existingItems,
            { conversationId, purpose: 'spec_re_discovery' }
          )

          if (!result.success || !result.items?.length) {
            return { newItems: [] }
          }

          // 添加新問題
          await addClarifyItems({ sessionId, items: result.items })

          return { newItems: result.items }
        })

        if (moreSpecDiscovery.newItems.length === 0) {
          specConsecutiveEmptyRounds++
          await step.run(`update-spec-empty-round-${specConsecutiveEmptyRounds}`, async () => {
            await updateBddSession({
              sessionId,
              updates: {
                consecutiveEmptyRounds: specConsecutiveEmptyRounds,
                currentRound: specSessionData.currentRound + 1,
              },
            })
          })
          continue
        } else {
          specConsecutiveEmptyRounds = 0
          continue
        }
      }

      // 重置連續空輪數
      specConsecutiveEmptyRounds = 0

      // 取得當前問題（按優先級排序）
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      specPendingItems.sort((a: ClarifyItem, b: ClarifyItem) =>
        priorityOrder[a.priority] - priorityOrder[b.priority]
      )
      const currentSpecItem = specPendingItems[0]
      const totalSpecPending = specSessionData.totalDiscovered - specSessionData.totalResolved

      // 發送問題
      await step.run(`send-spec-question-${specLoopIteration}`, async () => {
        const questionText = formatClarifyQuestion(currentSpecItem, specQuestionIndex, totalSpecPending)
        await sendMessage(conversationId, questionText, 'spec_clarify_question')
      })

      // 等待用戶回覆
      const specReply = await step.waitForEvent(`wait-spec-reply-${specLoopIteration}`, {
        event: 'user/reply',
        timeout: '24h',
        match: 'data.conversationId',
      })

      if (!specReply) {
        return { status: 'timeout', phase: 'spec_clarify', questionIndex: specQuestionIndex }
      }

      const specUserMessage = specReply.data.message.trim()

      // 處理特殊指令
      if (specUserMessage === '跳過' || specUserMessage.toLowerCase() === 'skip') {
        await step.run(`skip-spec-question-${specLoopIteration}`, async () => {
          const session = await getBddSession({ sessionId })
          if (session.data) {
            const clarifyItems = session.data.clarifyItems.map((item: ClarifyItem) =>
              item.id === currentSpecItem.id ? { ...item, status: 'skipped' as const } : item
            )
            const resolvedItems = [...session.data.resolvedItems, { ...currentSpecItem, status: 'skipped' as const }]
            await updateBddSession({
              sessionId,
              updates: {
                clarifyItems: clarifyItems.filter((item: ClarifyItem) => item.id !== currentSpecItem.id),
                resolvedItems,
              },
            })
          }
        })
        specQuestionIndex++
        continue
      }

      if (specUserMessage === '完成釐清' || specUserMessage.toLowerCase() === 'done') {
        await step.run('confirm-spec-all-staging', async () => {
          await confirmBatch({ sessionId })
        })
        break
      }

      // 記錄答案
      await step.run(`record-spec-answer-${specLoopIteration}`, async () => {
        await answerClarifyItem({
          sessionId,
          itemId: currentSpecItem.id,
          answer: specUserMessage,
        })
      })

      specQuestionIndex++
      specBatchCount++

      // 每 5 題批量確認
      if (specBatchCount >= BATCH_SIZE) {
        const specStagingSession = await step.run(`get-spec-staging-${specLoopIteration}`, async () => {
          const result = await getBddSession({ sessionId })
          return result.data
        })

        if (specStagingSession && specStagingSession.stagingItems.length > 0) {
          // 發送確認檢查點
          await step.run(`send-spec-batch-confirm-${specLoopIteration}`, async () => {
            let confirmText = `---\n📋 **規格釐清確認檢查點**\n\n以下 ${specStagingSession.stagingItems.length} 題已回答完成，請確認是否正確：\n\n`
            confirmText += `| # | 問題摘要 | 您的回答 |\n|---|----------|----------|\n`
            specStagingSession.stagingItems.forEach((item: ClarifyItem, i: number) => {
              const question = (item.whiteTextQuestion || item.question).slice(0, 30) + '...'
              const answer = (item.answer || '').slice(0, 20) + '...'
              confirmText += `| ${i + 1} | ${question} | ${answer} |\n`
            })
            confirmText += `\n請選擇：\n`
            confirmText += `- **確認全部 (Y)** - 確認以上答案並繼續\n`
            confirmText += `- **修改第 N 題** - 例如輸入「修改 3」重新回答\n`
            confirmText += `---`

            await sendMessage(conversationId, confirmText, 'spec_batch_confirm')
          })

          // 等待確認
          const specConfirmReply = await step.waitForEvent(`wait-spec-batch-confirm-${specLoopIteration}`, {
            event: 'user/reply',
            timeout: '24h',
            match: 'data.conversationId',
          })

          if (specConfirmReply) {
            const confirmMessage = specConfirmReply.data.message.trim().toLowerCase()

            if (confirmMessage === 'y' || confirmMessage === '確認' || confirmMessage === '確認全部') {
              await step.run(`confirm-spec-batch-${specLoopIteration}`, async () => {
                await confirmBatch({ sessionId })
              })
            } else if (confirmMessage.startsWith('修改')) {
              // 調用反悔機制
              const modifyMatch = confirmMessage.match(/修改\s*(\d+)/)
              if (modifyMatch) {
                const itemIndex = parseInt(modifyMatch[1], 10) - 1 // 轉換為 0-based index
                if (itemIndex >= 0 && itemIndex < specStagingSession.stagingItems.length) {
                  const itemToRevert = specStagingSession.stagingItems[itemIndex]
                  await step.run(`revert-spec-answer-${specLoopIteration}`, async () => {
                    await revertAnswer({ sessionId, itemId: itemToRevert.id })
                    await sendMessage(
                      conversationId,
                      `已將第 ${itemIndex + 1} 題移回待回答。`,
                      'revert_confirm'
                    )
                  })
                } else {
                  // 索引超出範圍
                  await step.run(`revert-spec-invalid-index-${specLoopIteration}`, async () => {
                    await sendMessage(
                      conversationId,
                      `無效的題號 ${itemIndex + 1}，有效範圍是 1-${specStagingSession.stagingItems.length}。已確認所有答案。`,
                      'revert_invalid'
                    )
                    await confirmBatch({ sessionId })
                  })
                }
              } else {
                // 無法解析，先確認
                await step.run(`confirm-spec-batch-fallback-${specLoopIteration}`, async () => {
                  await sendMessage(
                    conversationId,
                    `無法解析修改指令，請使用「修改 N」格式（如「修改 3」）。已確認所有答案。`,
                    'revert_parse_error'
                  )
                  await confirmBatch({ sessionId })
                })
              }
            }
          }
        }

        specBatchCount = 0
      }
    }

    // 確認剩餘的 staging 項目
    await step.run('confirm-spec-remaining-staging', async () => {
      await confirmBatch({ sessionId })
    })

    // 發送 Spec Clarify 完成訊息
    await step.run('send-spec-clarify-complete', async () => {
      await sendMessage(
        conversationId,
        `規格釐清完成！正在進入 Actions 設計階段...`,
        'spec_clarify_complete'
      )
    })
  } else {
    // 沒有需要釐清的問題
    await step.run('send-spec-no-clarify-needed', async () => {
      await sendMessage(
        conversationId,
        `規格檢查通過，沒有需要額外釐清的問題。正在進入 Actions 設計階段...`,
        'spec_discovery_pass'
      )
    })
  }

  // ============================================================
  // Phase 4: Actions Design
  // ============================================================

  await step.run('update-phase-actions-design', async () => {
    await updateBddSession({
      sessionId,
      updates: { currentPhase: 'actions_design' },
    })
    await sendMessage(
      conversationId,
      `正在設計 Server Actions...`,
      'actions_design_start'
    )
  })

  await step.run('generate-actions-yml', async () => {
    const session = await getBddSession({ sessionId })
    if (!session.data?.featuresContent) {
      throw new Error('缺少 Feature Files')
    }

    const features = session.data.featuresContent.map((f: FeatureFile) => ({
      name: f.name,
      actionName: f.actionName || f.name.replace(/\s+/g, ''),
      content: f.content,
    }))

    const result = await generateActionsYml(
      features,
      session.data.schemaSqlContent || '',
      { conversationId, purpose: 'generate_actions' }
    )

    if (!result.success) {
      throw new Error(result.error || '產出 actions.yml 失敗')
    }

    await updateBddSession({
      sessionId,
      updates: { actionsYmlContent: result.actionsYml },
    })

    return { actionsYml: result.actionsYml }
  })

  // ============================================================
  // Phase 5: ISA Config
  // ============================================================

  await step.run('update-phase-isa-config', async () => {
    await updateBddSession({
      sessionId,
      updates: { currentPhase: 'isa_config' },
    })
    await sendMessage(
      conversationId,
      `正在產出 sdd.os ISA 配置...`,
      'isa_config_start'
    )
  })

  await step.run('generate-isa-config', async () => {
    const session = await getBddSession({ sessionId })
    if (!session.data?.featuresContent) {
      throw new Error('缺少 Feature Files')
    }

    const features = session.data.featuresContent.map((f: FeatureFile) => ({
      name: f.name,
      actionName: f.actionName || f.name.replace(/\s+/g, ''),
      content: f.content,
    }))

    const result = await generateIsaConfig(
      features,
      session.data.entityMappingContent || '',
      session.data.actionsYmlContent || '',
      { conversationId, purpose: 'generate_isa_config' }
    )

    if (!result.success) {
      throw new Error(result.error || '產出 ISA Config 失敗')
    }

    await updateBddSession({
      sessionId,
      updates: { isaConfigContent: result.isaConfig },
    })

    return { isaConfig: result.isaConfig }
  })

  // ============================================================
  // 完成
  // ============================================================

  await step.run('complete-bdd-spec', async () => {
    await updateBddSession({
      sessionId,
      updates: { currentPhase: 'completed' },
    })

    // 標記對話的 spec 完成
    const session = await getBddSession({ sessionId })

    await supabase
      .from('conversations')
      .update({
        spec_complete: true,
        spec_summary: {
          schemaSql: session.data?.schemaSqlContent,
          entityMapping: session.data?.entityMappingContent,
          features: session.data?.featuresContent?.map(f => f.name),
          actionsYml: session.data?.actionsYmlContent,
          isaConfig: session.data?.isaConfigContent,
        },
      })
      .eq('id', conversationId)

    // 發送完成訊息
    const featureNames = session.data?.featuresContent?.map(f => f.name).join(', ') || '無'

    await sendMessage(
      conversationId,
      `🎉 **規格產出完成！**\n\n` +
      `**產出內容**：\n` +
      `- Schema SQL：已產出\n` +
      `- Entity Mapping：已產出\n` +
      `- Feature Files：${featureNames}\n` +
      `- Actions Spec：已產出\n` +
      `- ISA Config：已產出\n\n` +
      `**驗證結果**：${session.data?.validationResult?.passed ? '✅ 通過' : '⚠️ 有警告'}\n\n` +
      `---\n\n` +
      `請確認以上規格是否正確？\n` +
      `- 如果沒問題，我會開始生成程式碼\n` +
      `- 如果有需要調整的地方，請直接告訴我`,
      'completed'
    )
  })

  return {
    status: 'success',
    sessionId,
    phase: 'completed',
    artifacts: {
      schemaSql: 'spec/data/schema.sql',
      entityMapping: 'spec/data/entity_to_table_mapping.yml',
      features: featuresResult.features?.map((f: FeatureFile) => `spec/features/${f.name}.feature`) || [],
      actionsYml: 'spec/actions/actions.yml',
      isaConfig: 'isa_codegen.yml',
    },
  }
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
