import { SkillName, SKILL_REGISTRY, getSkillDescriptionsForClassifier } from './registry'
import { recordLlmUsage } from '../db/client'

// Haiku 定價 (每百萬 tokens)
const HAIKU_PRICING = { input: 0.8, output: 4 }

// ============================================================
// Intent Classification 結果類型
// ============================================================

// Meta intents：不進 Skill 流程，直接模板回覆
export type MetaIntent = 'onboarding' | 'chitchat' | 'abuse'

// 完整分類結果
export type ClassifierIntent = SkillName | MetaIntent | 'unknown' | 'clarification_needed'

export interface ClassificationResult {
  intent: ClassifierIntent
  confidence: number  // 0-1
  reasoning: string
  suggestedSkills?: SkillName[]
  suggestedProjectName?: string
  extractedEntities?: {
    projectType?: string
    features?: string[]
  }
}

/**
 * 判斷分類結果是否為 Skill（而非 meta-intent）
 */
export function isSkillIntent(intent: ClassifierIntent): intent is SkillName {
  return intent !== 'onboarding' && intent !== 'chitchat' && intent !== 'abuse' &&
         intent !== 'unknown' && intent !== 'clarification_needed'
}

// ============================================================
// Intent Classifier
// ============================================================

// LLM 追蹤上下文（用於記錄使用量）
export interface LlmTrackingContext {
  userId?: string
  conversationId?: string
}

/**
 * 使用 AI 判斷用戶意圖
 */
export async function classifyIntent(
  message: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  trackingContext?: LlmTrackingContext
): Promise<ClassificationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    console.warn('[Classifier] ANTHROPIC_API_KEY 未設定，使用規則式分類')
    return ruleBasedClassification(message)
  }

  try {
    const skillDescriptions = getSkillDescriptionsForClassifier()

    const systemPrompt = `你是一個意圖分類器，負責判斷用戶的需求應該交給哪個 Skill 處理，或判斷是否屬於非功能性對話。

## 可用的 Skills:
${skillDescriptions}

## 非功能性分類（Meta Intent）:
- **onboarding**：新手打招呼、自我介紹、問平台功能。例如：「嗨」、「你好」、「你能做什麼」、「這個平台怎麼用」
- **chitchat**：閒聊、與產品開發無關的對話。例如：「今天天氣好嗎」、「你是 AI 嗎」、「講個笑話」
- **abuse**：辱罵、無意義垃圾訊息、隨意亂打字。例如：「asdfghjkl」、純髒話、重複字元

## 分類規則（按優先順序）:
1. 如果訊息是打招呼、問候、問平台能做什麼 → onboarding
2. 如果訊息是閒聊、與建立產品無關 → chitchat
3. 如果訊息是辱罵、亂打字、無意義字串 → abuse
4. 如果用戶描述的是「想要建立什麼系統/功能」→ bdd-spec
5. 如果用戶明確說「生成程式碼」或「實作」，而且已經有規格 → coder
6. 如果用戶說「部署」或「上線」→ deployer
7. 如果用戶說「網域」、「domain」、「自訂網址」（一般性）→ domain-manager
8. 如果用戶明確說「買網域」、「購買網域」、「註冊網域」→ domain-purchase
9. 如果用戶說「設定 DNS」、「綁定 DNS」、「自有網域」、「已有網域」→ domain-dns
10. 如果無法確定 → clarification_needed

## 短消息判斷範例:
- 「嗨」→ onboarding
- 「哈囉你好」→ onboarding
- 「幫我做一個購物網站」→ bdd-spec
- 「今天天氣」→ chitchat
- 「aaa」→ abuse
- 「我想做餐廳官網」→ bdd-spec

## 專案命名規則:
根據用戶的描述，生成一個簡短的專案名稱（suggestedProjectName）。
- 用中文，最多 20 個字
- 只需要核心概念，例如「寵物電商平台」、「健身課程預約系統」、「個人作品集網站」
- 不要加「專案」二字
- 只有 intent 是建立專案相關（bdd-spec）時才需要填

## 輸出格式（JSON）:
{
  "intent": "bdd-spec" | "coder" | "deployer" | "domain-manager" | "domain-purchase" | "domain-dns" | "onboarding" | "chitchat" | "abuse" | "unknown" | "clarification_needed",
  "confidence": 0.0-1.0,
  "reasoning": "判斷理由",
  "suggestedProjectName": "簡短專案名稱（如有）",
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
        model: 'claude-haiku-4-5-20251001',
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

    const data = await response.json() as {
      content?: Array<{ text?: string }>
      usage?: { input_tokens?: number; output_tokens?: number }
    }
    const content = data.content?.[0]?.text

    // 記錄 LLM 使用量
    if (data.usage) {
      const inputTokens = data.usage.input_tokens || 0
      const outputTokens = data.usage.output_tokens || 0
      const cost = (inputTokens * HAIKU_PRICING.input + outputTokens * HAIKU_PRICING.output) / 1_000_000

      try {
        await recordLlmUsage({
          model: 'claude-haiku-4-5-20251001',
          inputTokens,
          outputTokens,
          costUsd: cost,
          purpose: 'intent_classification',
          userId: trackingContext?.userId,
          conversationId: trackingContext?.conversationId,
        })
        console.log(`[Classifier] 已記錄使用量: ${inputTokens} in / ${outputTokens} out, $${cost.toFixed(6)} (conversation: ${trackingContext?.conversationId || 'none'})`)
      } catch (err) {
        console.error('[Classifier] 記錄使用量失敗:', err)
      }
    }

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
      suggestedProjectName: parsed.suggestedProjectName || undefined,
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
  const trimmed = message.trim()

  // ── Meta Intent 偵測（最先檢查）──

  // Abuse：無意義字串（重複字元、純符號）
  if (
    /^(.)\1{3,}$/.test(trimmed) ||                    // 重複字元 ≥4，如 "aaaa"
    /^[!@#$%^&*()_+=\-~`{}[\]|;:'"<>,.?/\\]+$/.test(trimmed) // 純符號
  ) {
    return {
      intent: 'abuse',
      confidence: 0.85,
      reasoning: '無意義字串或垃圾訊息',
    }
  }

  // Onboarding：打招呼 / 問平台能力
  const onboardingPatterns = [
    /^(嗨|你好|哈囉|hello|hi|hey|yo|早安|午安|晚安)[\s!！。？?~]*$/i,
    /你(能|可以)(做|幹)什麼/,
    /(怎麼|如何)(用|使用|開始)/,
    /這(是|個)(什麼|啥)(平台|系統|工具|服務)/,
    /^(請問|問一下).{0,5}(怎麼用|有什麼功能|能做什麼|是什麼)/, // 限定後接問詢（避免攔截「請問可以做一個網站嗎」）
    /功能(介紹|有哪些)/,
  ]
  if (onboardingPatterns.some(p => p.test(trimmed))) {
    return {
      intent: 'onboarding',
      confidence: 0.9,
      reasoning: '新手打招呼或詢問平台功能',
    }
  }

  // Chitchat：閒聊
  const chitchatPatterns = [
    /天氣/,
    /你是(誰|AI|機器人|人)/,
    /(講|說)(個|一個)(笑話|故事)/,
    /今天.{0,5}(開心|心情|快樂)/,
    /聊天/,
    /無聊/,
  ]
  if (chitchatPatterns.some(p => p.test(trimmed))) {
    return {
      intent: 'chitchat',
      confidence: 0.85,
      reasoning: '閒聊，與產品開發無關',
    }
  }

  // ── Skill Intent 偵測 ──

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
    const entities = extractEntitiesFromMessage(message)
    return {
      intent: 'bdd-spec',
      confidence: Math.min(0.5 + matchedPatterns.length * 0.1, 0.9),
      reasoning: `訊息匹配 BDD 規格關鍵詞: ${matchedPatterns.join(', ')}`,
      suggestedProjectName: deriveProjectName(message, entities),
      extractedEntities: entities,
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
// 專案名稱推導（Rule-based fallback）
// ============================================================

function deriveProjectName(
  message: string,
  entities?: ClassificationResult['extractedEntities']
): string | undefined {
  // 優先用 extractedEntities 的 projectType
  if (entities?.projectType) {
    const name = entities.projectType.replace(/^(一個|一套|一組)/, '').trim()
    if (name.length >= 2 && name.length <= 20) return name
  }

  // 嘗試從訊息中提取「XX 系統/平台/網站/App」
  const patterns = [
    /(?:建立|做|開發|建構|打造|設計|想要)(?:一個|一套)?\s*(.{2,15}?)(?:系統|平台|應用|網站|App|app|頁面|官網)/,
    /(.{2,15}?)(?:管理系統|管理平台|預約系統|電商平台|購物網站)/,
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match?.[1]) {
      const extracted = match[1].trim()
      // 取完整匹配（含系統/平台等後綴）
      const full = match[0].replace(/^(?:建立|做|開發|建構|打造|設計|想要)(?:一個|一套)?\s*/, '').trim()
      if (full.length >= 2 && full.length <= 20) return full
      if (extracted.length >= 2 && extracted.length <= 20) return extracted
    }
  }

  return undefined
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
