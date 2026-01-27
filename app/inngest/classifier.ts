import { SkillName, SKILL_REGISTRY, getSkillDescriptionsForClassifier } from './registry'

// ============================================================
// Intent Classification 結果類型
// ============================================================

export interface ClassificationResult {
  intent: SkillName | 'unknown' | 'clarification_needed'
  confidence: number  // 0-1
  reasoning: string
  suggestedSkills?: SkillName[]  // 若 unknown，建議可能的 Skills
  extractedEntities?: {
    projectType?: string  // 例如「訂單管理系統」
    features?: string[]   // 提取的功能需求
  }
}

// ============================================================
// Intent Classifier
// ============================================================

/**
 * 使用 AI 判斷用戶意圖
 *
 * @param message 用戶輸入的訊息
 * @param conversationHistory 對話歷史（可選，用於上下文理解）
 * @returns 分類結果
 */
export async function classifyIntent(
  message: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<ClassificationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    console.warn('[Classifier] ANTHROPIC_API_KEY 未設定，使用規則式分類')
    return ruleBasedClassification(message)
  }

  try {
    const skillDescriptions = getSkillDescriptionsForClassifier()

    const systemPrompt = `你是一個意圖分類器，負責判斷用戶的需求應該交給哪個 Skill 處理。

## 可用的 Skills:
${skillDescriptions}

## 分類規則:
1. 如果用戶描述的是「想要建立什麼系統/功能」，通常是 bdd-spec
2. 如果用戶明確說「生成程式碼」或「實作」，而且已經有規格，是 coder
3. 如果用戶說「部署」或「上線」，是 deployer
4. 如果用戶說「網域」、「domain」、「自訂網址」（一般性），是 domain-manager
5. 如果用戶明確說「買網域」、「購買網域」、「註冊網域」，是 domain-purchase
6. 如果用戶說「設定 DNS」、「綁定 DNS」、「自有網域」、「已有網域」，是 domain-dns
7. 如果無法確定，返回 clarification_needed

## 輸出格式（JSON）:
{
  "intent": "bdd-spec" | "coder" | "deployer" | "domain-manager" | "domain-purchase" | "domain-dns" | "unknown" | "clarification_needed",
  "confidence": 0.0-1.0,
  "reasoning": "判斷理由",
  "extractedEntities": {
    "projectType": "提取的專案類型（如有）",
    "features": ["提取的功能需求"]
  }
}`

    const messages = [
      ...(conversationHistory || []),
      { role: 'user' as const, content: message }
    ]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',  // 使用較快的模型做分類
        max_tokens: 500,
        system: systemPrompt,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Classifier] API 錯誤:', errorText)
      return ruleBasedClassification(message)
    }

    const data = await response.json()
    const content = data.content?.[0]?.text

    if (!content) {
      return ruleBasedClassification(message)
    }

    // 解析 JSON 回應
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return ruleBasedClassification(message)
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      intent: parsed.intent || 'unknown',
      confidence: parsed.confidence || 0.5,
      reasoning: parsed.reasoning || '',
      extractedEntities: parsed.extractedEntities,
    }
  } catch (error) {
    console.error('[Classifier] 分類失敗:', error)
    return ruleBasedClassification(message)
  }
}

// ============================================================
// 規則式分類（Fallback）
// ============================================================

function ruleBasedClassification(message: string): ClassificationResult {
  const lowerMessage = message.toLowerCase()

  // 購買網域（優先檢查，更具體）
  if (
    lowerMessage.includes('買網域') ||
    lowerMessage.includes('購買網域') ||
    lowerMessage.includes('註冊網域') ||
    lowerMessage.includes('buy domain') ||
    lowerMessage.includes('register domain')
  ) {
    return {
      intent: 'domain-purchase',
      confidence: 0.9,
      reasoning: '訊息包含購買網域相關關鍵詞',
    }
  }

  // 設定 DNS（優先檢查，更具體）
  if (
    lowerMessage.includes('設定 dns') ||
    lowerMessage.includes('dns 設定') ||
    lowerMessage.includes('綁定 dns') ||
    lowerMessage.includes('自有網域') ||
    lowerMessage.includes('已有網域') ||
    lowerMessage.includes('cloudflare') ||
    lowerMessage.includes('nameserver')
  ) {
    return {
      intent: 'domain-dns',
      confidence: 0.9,
      reasoning: '訊息包含 DNS 設定相關關鍵詞',
    }
  }

  // 網域管理（一般性）
  if (
    lowerMessage.includes('網域') ||
    lowerMessage.includes('domain') ||
    lowerMessage.includes('自訂網址') ||
    lowerMessage.includes('綁定網域') ||
    lowerMessage.includes('設定網域')
  ) {
    return {
      intent: 'domain-manager',
      confidence: 0.8,
      reasoning: '訊息包含網域管理相關關鍵詞',
    }
  }

  // 部署相關
  if (
    lowerMessage.includes('部署') ||
    lowerMessage.includes('deploy') ||
    lowerMessage.includes('上線') ||
    lowerMessage.includes('發布')
  ) {
    return {
      intent: 'deployer',
      confidence: 0.8,
      reasoning: '訊息包含部署相關關鍵詞',
    }
  }

  // 程式碼生成相關
  if (
    lowerMessage.includes('生成程式碼') ||
    lowerMessage.includes('寫程式') ||
    lowerMessage.includes('實作') ||
    lowerMessage.includes('implement')
  ) {
    return {
      intent: 'coder',
      confidence: 0.7,
      reasoning: '訊息包含程式碼生成相關關鍵詞',
    }
  }

  // BDD 規格相關（最廣泛的匹配）
  const bddPatterns = SKILL_REGISTRY['bdd-spec'].triggerPatterns
  const matchedPatterns = bddPatterns.filter(p => lowerMessage.includes(p.toLowerCase()))

  if (matchedPatterns.length > 0) {
    return {
      intent: 'bdd-spec',
      confidence: Math.min(0.5 + matchedPatterns.length * 0.1, 0.9),
      reasoning: `訊息匹配 BDD 規格關鍵詞: ${matchedPatterns.join(', ')}`,
      extractedEntities: extractEntitiesFromMessage(message),
    }
  }

  // 無法確定
  return {
    intent: 'clarification_needed',
    confidence: 0.3,
    reasoning: '無法從訊息中確定意圖',
    suggestedSkills: ['bdd-spec', 'coder', 'deployer'],
  }
}

// ============================================================
// 實體提取（簡易版）
// ============================================================

function extractEntitiesFromMessage(message: string): ClassificationResult['extractedEntities'] {
  const entities: ClassificationResult['extractedEntities'] = {}

  // 嘗試提取專案類型
  const projectTypePatterns = [
    /(?:建立|做|開發|建構)(?:一個)?(.+?)(?:系統|平台|應用|網站|App)/,
    /(.+?)(?:管理系統|管理平台)/,
  ]

  for (const pattern of projectTypePatterns) {
    const match = message.match(pattern)
    if (match) {
      entities.projectType = match[1]?.trim() || match[0]
      break
    }
  }

  // 提取功能關鍵詞
  const featureKeywords = ['訂單', '商品', '用戶', '會員', '庫存', '報表', '支付', '購物車', '登入', '註冊']
  const matchedFeatures = featureKeywords.filter(kw => message.includes(kw))
  if (matchedFeatures.length > 0) {
    entities.features = matchedFeatures
  }

  return Object.keys(entities).length > 0 ? entities : undefined
}
