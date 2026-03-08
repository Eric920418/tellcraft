import { SKILL_REGISTRY, SkillName } from './registry'
import { createLogger } from '../lib/logger'
import { calculateLlmCost, getAnthropicHeaders, MODEL, trackLlmUsage } from '../lib/anthropic'
import { safeParseJson } from '../utils/safe-parse-json'

const logger = createLogger('planner')

export interface TaskStepPlan {
  skillName: SkillName
  input: any
  reason: string
}

export interface TaskPlan {
  goal: string
  steps: TaskStepPlan[]
  reasoning: string
}

/**
 * 任務規劃器 (LLM Planner)
 * 根據用戶目標，規劃出執行步驟與所需的 Skill 序列
 */
export async function planTask(
  goal: string,
  context?: {
    projectId?: string
    userId?: string
    conversationId?: string
    existingSpec?: boolean
  }
): Promise<TaskPlan> {
  logger.info({ goal, context }, '開始規劃任務')

  // 獲取所有可用技能的描述
  const skillDescriptions = Object.values(SKILL_REGISTRY)
    .map(skill => `
[${skill.name}]
名稱: ${skill.displayName}
描述: ${skill.description}
輸入需求: 必填 ${skill.inputSchema.required.join(', ')}, 選填 ${skill.inputSchema.optional.join(', ')}
`)
    .join('\n---\n')

  const systemPrompt = `你是一個高級 AI 開發規劃器。你的任務是根據用戶的目標，利用可用的 AI 技能 (Skills) 規劃出一套執行流程。

## 可用的 Skills:
${skillDescriptions}

## 規劃規則:
1. 盡量簡化流程，但要確保能達成目標。
2. 每個步驟必須指定一個明確的 Skill。
3. 輸出必須是合法的 JSON 格式。
4. 考慮依賴關係（例如：必須先有 [bdd-spec] 產出的規格，才能進行 [coder] 生成代碼）。
5. 預設流程參考：
   - 新建專案/功能：[bdd-spec] -> [uiux] -> [deployer]
   - 僅修改介面：[uiux] -> [deployer]
   - 品質檢查：[quality-gate]
   - 快速建站（用戶要求快速且目標簡單）：[fast-build]

## 輸出格式 (JSON):
{
  "goal": "用戶原始目標",
  "reasoning": "為什麼這樣規劃的理由",
  "steps": [
    {
      "skillName": "skill-name",
      "input": { "參數名": "參數值" },
      "reason": "為什麼執行這一步"
    }
  ]
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: getAnthropicHeaders(),
      body: JSON.stringify({
        model: MODEL.SONNET, // 規劃需要較強的邏輯，使用 Sonnet
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: `我的目標是：${goal}\n${context?.existingSpec ? '注意：目前已經有現成的 BDD 規格。' : ''}` }
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`)
    }

    const data = await response.json() as any
    const content = data.content?.[0]?.text

    // 記錄使用量
    if (data.usage) {
      trackLlmUsage({
        model: MODEL.SONNET,
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
        purpose: 'task_planning',
        userId: context?.userId,
        conversationId: context?.conversationId,
      })
    }

    const parsed = safeParseJson<TaskPlan>(content)
    if (!parsed || !parsed.steps) {
      throw new Error('無法解析規劃結果')
    }

    logger.info({ stepCount: parsed.steps.length }, '規劃完成')
    return parsed
  } catch (error) {
    logger.error({ err: error }, '任務規劃失敗')
    // Fallback: 基礎預設流程
    return {
      goal,
      reasoning: '規劃失敗，採用預設 BDD 流程',
      steps: [
        { skillName: 'bdd-spec', input: {}, reason: '初始化需求釐清' }
      ]
    }
  }
}
