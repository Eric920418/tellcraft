/**
 * UIUX 生成服務
 * 負責設計變體生成、合併、和最終程式碼生成
 */

// LLM 函數需要從後端獨立實現
import type Anthropic from '@anthropic-ai/sdk'
import * as ts from 'typescript'
import { getAnthropicClient, MODEL, trackLlmUsage } from '../lib/anthropic'
import { getEnv } from '../lib/env'
import { formatUISpecForPrompt, UIRequirementsSpec } from './bdd-to-ui-spec'
import { safeParseJson } from '../utils/safe-parse-json'
import { selectTechniques, formatTechniquesForPrompt, formatTechniquesForPromptFast } from './design-techniques'
import { getMoodPromptBlock, getMoodAnimationHint, getMoodRwdHint, getMoodSummary, getMoodCodeFragment, getMoodCodeFragmentCompact, getMoodById } from './design-moods'
import { selectCompositionPatterns, formatPatternsForPrompt, listPatternsForVariants } from './composition-patterns'
import { formatStructuredDataForPrompt } from './reference-analyzer'
import { createLogger } from '../lib/logger'

const logger = createLogger('uiux-generation')

// ============================================================
// LLM 並發限流器（Semaphore）
// ============================================================

const LLM_MAX_CONCURRENT = getEnv().LLM_MAX_CONCURRENT
let llmActiveCount = 0
const llmWaitQueue: Array<() => void> = []

async function acquireLlmSlot(): Promise<void> {
  if (llmActiveCount < LLM_MAX_CONCURRENT) {
    llmActiveCount++
    return
  }
  return new Promise<void>((resolve) => {
    llmWaitQueue.push(() => {
      llmActiveCount++
      resolve()
    })
  })
}

function releaseLlmSlot(): void {
  llmActiveCount--
  if (llmWaitQueue.length > 0) {
    const next = llmWaitQueue.shift()!
    next()
  }
}

/** 取得 LLM 並發狀態（供監控用） */
export function getLlmConcurrencyStats() {
  return { active: llmActiveCount, queued: llmWaitQueue.length, max: LLM_MAX_CONCURRENT }
}

// GeneratedComponent 本地定義
export interface GeneratedComponent {
  path: string
  content: string
  description: string
}

// LLM 追蹤上下文
interface LlmTrackingContext {
  userId?: string
  conversationId?: string
  purpose?: string
}

function estimateContentChars(
  content: string | Anthropic.MessageCreateParams['messages'][number]['content']
): number {
  if (typeof content === 'string') return content.length
  return content.reduce((total, block) => {
    if (block.type === 'text') return total + block.text.length
    if (block.type === 'image') {
      const source = block.source
      if (source.type === 'url') return total + source.url.length
      if (source.type === 'base64') return total + source.data.length
    }
    return total
  }, 0)
}

// 判斷是否為可重試的暫時性錯誤
function isRetryableError(err: unknown): boolean {
  const msg = String(err)
  return msg.includes('overloaded_error') ||
    msg.includes('rate_limit_error') ||
    msg.includes('529') ||
    msg.includes('503') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ETIMEDOUT')
}

// 將 LLM 錯誤轉換為用戶可讀訊息
function humanizeError(err: unknown): string {
  const msg = String(err)
  if (msg.includes('overloaded_error') || msg.includes('529')) {
    return 'AI 伺服器目前繁忙，已自動重試但仍無法處理。請稍等 1-2 分鐘後再試。'
  }
  if (msg.includes('rate_limit_error') || msg.includes('429')) {
    return 'AI 請求過於頻繁，請稍等片刻再試。'
  }
  if (msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT') || msg.includes('503')) {
    return 'AI 伺服器連線中斷，請稍後重試。'
  }
  if (msg.includes('authentication') || msg.includes('401')) {
    return 'AI 服務認證失敗，請聯繫管理員。'
  }
  return 'AI 處理時發生錯誤，請稍後重試。如持續失敗，請嘗試其他描述方式。'
}

// ============================================================
// 動畫個性提示常數
// ============================================================

const ANIMATION_PERSONALITY_HINTS: Record<string, string> = {
  minimal:  'duration ≤150ms，只有必要狀態轉換，禁止裝飾性入場動畫',
  smooth:   'ease-out 300-400ms，opacity + translateY(8px)，重視 easing 質感',
  bouncy:   'spring physics（stiffness 300, damping 20），hover scale 1.03，有回彈感',
  dramatic: 'stagger reveal 500ms，translateY(-40px) 入場，bold、有份量感',
  playful:  '快速反饋 150ms + 多色過渡 + 略誇張的 tap/hover 反應',
}

function getAnimationPersonalityHint(p: string): string {
  return ANIMATION_PERSONALITY_HINTS[p] || ''
}

// callClaude — 使用 streaming 避免長請求超時，含自動重試
const RETRY_MAX = 3
const RETRY_BASE_DELAY_MS = 2000
const MAX_TOKEN_CONTINUATIONS = 3
const CONTINUE_FROM_LAST_TOKEN_PROMPT = [
  'Continue exactly from where you stopped.',
  'Do not repeat any previously generated text.',
  'Output only the continuation content.',
].join(' ')

/**
 * 剝離 continuation 起頭的 LLM 元文字（"I need to...", "Let me...", 等）
 * 當 LLM 決定重新生成而非繼續時，這些文字會污染 accumulated code
 */
function stripContinuationMetaText(segment: string): string {
  const META_PATTERNS = [
    /^I (need|will|should|am going|want|must)/i,
    /^I'(ll|m|ve) /i,
    /^Let me/i,
    /^Here (is|are|'s)/i,
    /^The previous/i,
    /^Since (the|my|this|output)/i,
    /previous output was cut off/i,
    /generate the complete/i,
    /provide all the files/i,
    /complete (animated|structure|rwd|styled|code) files/i,
    /output the complete (responsive|animated|structure|rwd|styled|code)/i,
    /start(ing)? (from|over|again)/i,
    /^(Note|Important|Please note):/i,
    /^(Continuing|Resuming|Picking up)/i,
    /^(Apologies|Sorry)/i,
    /^Now (I'll|let me|here)/i,
    /^(OK|Okay|Alright),? (here|let|I)/i,
  ]
  const lines = segment.split('\n')
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const trimmed = lines[i].trim()
    if (!trimmed) continue
    if (META_PATTERNS.some(p => p.test(trimmed))) continue
    // 找到第一個非元文字行（不管 i 是否為 0）
    return lines.slice(i).join('\n')
  }
  return segment
}

function extractTextContent(content: Anthropic.Message['content']): string {
  return content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .filter(Boolean)
    .join('\n')
    .trim()
}

/**
 * 將 system prompt 拆分為 static（cacheable）+ dynamic block。
 * ENABLE_PROMPT_CACHING=false 時回退為 plain string。
 */
function buildCacheableSystemBlocks(
  staticPart: string,
  dynamicPart: string,
): string | Array<Anthropic.Messages.TextBlockParam> {
  if (!getEnv().ENABLE_PROMPT_CACHING) {
    return staticPart + '\n\n' + dynamicPart
  }
  return [
    { type: 'text' as const, text: staticPart, cache_control: { type: 'ephemeral' as const } },
    { type: 'text' as const, text: dynamicPart },
  ]
}

/**
 * 將 user message 拆為可快取的代碼區塊 + 不快取的任務指令
 * 在 continuation call 時，代碼區塊可命中 cache（省 ~90% input token）
 */
function buildCacheableUserMessage(
  codeBlock: string,
  taskBlock: string,
): string | Array<Anthropic.Messages.TextBlockParam> {
  if (!getEnv().ENABLE_PROMPT_CACHING) {
    return codeBlock + '\n\n' + taskBlock
  }
  return [
    { type: 'text' as const, text: codeBlock, cache_control: { type: 'ephemeral' as const } },
    { type: 'text' as const, text: taskBlock },
  ]
}

export async function callClaude(
  systemPrompt: string | Array<Anthropic.Messages.TextBlockParam>,
  messages: Array<{ role: 'user' | 'assistant'; content: string | Anthropic.MessageCreateParams['messages'][number]['content'] }>,
  options?: {
    maxTokens?: number
    temperature?: number
    maxContinuations?: number
    promptLabel?: string
    contextSizeHint?: string
    heartbeatFn?: () => void  // 長時間 LLM 呼叫中定期刷新外部心跳（如 Redis flow activity）
  },
  trackingContext?: LlmTrackingContext,
  onTextDelta?: (accumulatedText: string) => void
): Promise<{ success: boolean; content?: string; error?: string }> {
  await acquireLlmSlot()
  try {
    const anthropic = getAnthropicClient()
    let lastError: unknown = null
    const baseMessages = messages.map(m => ({
      role: m.role,
      content: m.content,
    }))

    for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
      try {
        let accumulated = ''
        let continuationCount = 0
        let requestMessages = [...baseMessages]
        let lastContinuationSeed = ''
        const requestStartedAt = Date.now()
        const systemPromptChars = typeof systemPrompt === 'string'
          ? systemPrompt.length
          : systemPrompt.reduce((sum, block) => sum + (block.text?.length || 0), 0)
        const inputCharEstimate = systemPromptChars + requestMessages.reduce((sum, msg) => sum + estimateContentChars(msg.content), 0)

        while (true) {
          const stream = anthropic.messages.stream({
            model: MODEL.SONNET,
            max_tokens: options?.maxTokens || 4096,
            temperature: options?.temperature ?? 0.2,
            system: systemPrompt,
            messages: requestMessages,
          })

          let chunkCount = 0
          let currentSegment = ''
          let lastHeartbeatAt = 0
          stream.on('text', (text) => {
            currentSegment += text
            accumulated += text
            chunkCount++
            if (chunkCount % 50 === 1) {
              logger.info({ chunkCount, accumulatedLength: accumulated.length }, 'streaming chunk')
            }
            // 所有 LLM 呼叫（含 post-processing fix/repair）每 30 秒刷新外部心跳
            const now = Date.now()
            if (options?.heartbeatFn && now - lastHeartbeatAt >= 30_000) {
              lastHeartbeatAt = now
              options.heartbeatFn()
            }
            onTextDelta?.(accumulated)
          })

          const finalMessage = await stream.finalMessage()

          // 記錄 LLM 用量（含 prompt caching metrics）
          const usage = finalMessage.usage
          if (usage) {
            const usageAny = usage as unknown as Record<string, unknown>
            const cacheCreation = usageAny.cache_creation_input_tokens as number | undefined
            const cacheRead = usageAny.cache_read_input_tokens as number | undefined
            trackLlmUsage({
              model: MODEL.SONNET,
              inputTokens: usage.input_tokens || 0,
              outputTokens: usage.output_tokens || 0,
              purpose: trackingContext?.purpose || 'uiux_generation',
              userId: trackingContext?.userId,
              conversationId: trackingContext?.conversationId,
              cacheCreationTokens: cacheCreation || 0,
              cacheReadTokens: cacheRead || 0,
            })
            logger.info({
              purpose: trackingContext?.purpose,
              promptLabel: options?.promptLabel,
              contextSizeHint: options?.contextSizeHint,
              inputTokens: usage.input_tokens || 0,
              outputTokens: usage.output_tokens || 0,
              cacheCreationTokens: cacheCreation || 0,
              cacheReadTokens: cacheRead || 0,
              inputCharEstimate,
              durationMs: Date.now() - requestStartedAt,
            }, 'LLM 請求完成')
          }

          // streaming text 可能為空，回退使用 finalMessage 內容
          if (!currentSegment) {
            const fallbackText = extractTextContent(finalMessage.content)
            if (fallbackText) {
              currentSegment = fallbackText
              accumulated += fallbackText
              onTextDelta?.(accumulated)
            }
          }

          // 剝離 continuation 元文字（只在非首次回應時）
          if (continuationCount > 0 && currentSegment.length > 0) {
            const stripped = stripContinuationMetaText(currentSegment)
            if (stripped.length < currentSegment.length) {
              // 元文字被剝離 → 前段末尾可能有截斷行（如未結束的 string literal）
              const prevAccumulated = accumulated.slice(0, accumulated.length - currentSegment.length)
              let cleanPrev = prevAccumulated
              // 如果前段末尾不以換行結束，代表截斷發生在行內 → 移除該截斷行
              if (cleanPrev.length > 0 && !cleanPrev.endsWith('\n')) {
                const lastNewline = cleanPrev.lastIndexOf('\n')
                if (lastNewline >= 0) {
                  cleanPrev = cleanPrev.slice(0, lastNewline + 1)
                }
              }
              const removedChars = accumulated.length - (cleanPrev.length + stripped.length)
              logger.warn(
                { continuationCount, removedChars, truncatedLineRemoved: cleanPrev.length < prevAccumulated.length },
                'callClaude: 剝離 continuation meta-commentary + 截斷行'
              )
              accumulated = cleanPrev + stripped
              currentSegment = stripped
              onTextDelta?.(accumulated)
            }
          }

          const normalizedSegment = currentSegment.trim()
          if (normalizedSegment) {
            lastContinuationSeed = normalizedSegment
          }

          if (finalMessage.stop_reason !== 'max_tokens') {
            break
          }

          const effectiveMaxContinuations = options?.maxContinuations ?? MAX_TOKEN_CONTINUATIONS

          logger.warn({
            purpose: trackingContext?.purpose,
            outputTokens: finalMessage.usage?.output_tokens,
            continuationCount,
            maxContinuations: effectiveMaxContinuations,
          }, 'LLM 回應被 max_tokens 截斷')

          if (continuationCount >= effectiveMaxContinuations) {
            logger.warn({ purpose: trackingContext?.purpose, continuationCount }, '已達最大續寫次數，停止')
            break
          }

          continuationCount++
          // 只取最後 3000 chars 作為位置錨點：
          // - 讓 LLM 知道「當前在哪」
          // - 避免把 32768 token 全塞進 input（會讓下一次 context 爆炸且速度慢）
          // - baseMessages 保持原始 user prompt，LLM 仍能看到「要生成哪些檔案」的完整指令
          const continuationAnchor = accumulated.slice(-3000)
          requestMessages = [
            ...baseMessages,
            { role: 'assistant', content: continuationAnchor },
            { role: 'user', content: CONTINUE_FROM_LAST_TOKEN_PROMPT },
          ]

          logger.info({ purpose: trackingContext?.purpose, continuationCount }, '觸發自動續寫')
        }

        if (accumulated.trim()) {
          return { success: true, content: accumulated }
        }

        return { success: false, error: '無法取得回應內容' }
      } catch (err) {
        lastError = err
        if (attempt < RETRY_MAX && isRetryableError(err)) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1) // 2s, 4s, 8s
          logger.warn({ attempt, maxRetry: RETRY_MAX, delay, err: String(err).slice(0, 150) }, '暫時性錯誤，重試')
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        break
      }
    }

    return { success: false, error: humanizeError(lastError) }
  } finally {
    releaseLlmSlot()
  }
}

// ============================================================
// Design Tier（功能型 vs 創意型）
// ============================================================

export type DesignTier = 'functional' | 'creative'
export type GenerationProfile = 'balanced' | 'quality' | 'fast'

// ============================================================
// Mood-Design System 衝突檢測（防止白字疊白底）
// ============================================================

const DARK_MOOD_IDS = ['glassmorphic-dark', 'tech-dark']

function isLightColor(hex: string): boolean {
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (!m) return true
  const [r, g, b] = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
  return (r + g + b) / 3 > 200  // RGB 均值 > 200 判定為亮色
}

function buildMoodConflictWarning(moodId: string | undefined, ds: DesignSystem): string {
  if (!moodId || !DARK_MOOD_IDS.includes(moodId)) return ''
  const bg = ds.colorPalette?.background ?? ''
  if (!isLightColor(bg)) return ''
  return `
## ⚠️ CRITICAL: Mood-Background 衝突警告（必須優先遵守）
你選擇的設計情緒「${moodId}」需要深色底層，但 Design System background 是亮色（${bg}）。

強制規則：
- CSS 的 background 變數只是頁面底色，不代表每個 section 的背景色
- 每個 section 必須包裹在深色容器中（bg-slate-950、bg-zinc-950、bg-black）
- 毛玻璃效果（backdrop-blur）必須在深色容器內使用（底層必須是 bg-*-900 以上）
- text-white 只能在深色容器（bg-*-900 以上）內使用，絕不能在亮色底層上
- 正確範例：
  <section className="bg-slate-950 min-h-screen">
    <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-8">
      <p className="text-white">...</p>
    </div>
  </section>
`
}

// ============================================================
// 共用 Craft 原則（兩個 tier 都適用）
// ============================================================

/**
 * 共用的 Craft Foundations — 不分 tier，所有生成都必須遵守
 */
export function getCraftFoundations(): string {
  return `## Craft Foundations（設計品質底線）

### Subtle Layering（品質第一指標）
表面差異微妙但可辨識。
- Instead of: gray-100 跳到 gray-300 → Try: gray-50 到 gray-100 的輕柔過渡
- Instead of: 粗邊框 → Try: \`ring-1 ring-black/5\` 或 \`border border-gray-200/60\`
- Instead of: 大面積 drop-shadow → Try: \`shadow-sm\` + \`ring-1 ring-black/5\` 雙層微陰影
- Squint test: 模糊眼睛看，能感知層級但沒有東西刺眼
- 用 surface-1（底層）→ surface-2（卡片）→ surface-3（hover/active）建立表面層級

### 顏色意圖
- 灰色構建結構，彩色只在需要行動或注意時出現
- Instead of: 五個隨機 accent color → Try: 一個 accent + 語義色（success/error/warning）
- Instead of: 純白卡片放有色背景 → Try: 用 surface-1/surface-2 區分表面層級
- 每個顏色都能追溯到語義：foreground（文字）、background（底層）、surface-1/2/3（表面層級）、brand、semantic

### 深度策略（選一個貫徹全局）
| 策略 | 適合 | 實作 |
|------|------|------|
| Borders-only | 密集工具 | \`border border-gray-200\` |
| Subtle shadows | 親和產品 | \`shadow-sm\` + 微弱 border |
| Layered shadows | 高級感 | \`shadow-md shadow-black/5\` + \`ring-1 ring-black/5\` |
禁止混合。

### 排版層級
- 標題：font-bold + tracking-tight + 大字號
- 正文：font-normal + leading-relaxed + 適中字號
- 數據/標籤：tabular-nums 或 font-mono
- Instead of: 只靠字號區分 → Try: weight + color + spacing 三維度建立層級

### 間距系統
- 選定 base unit（4px 或 8px）嚴格用倍數
- 一致性比具體數字重要
- 隨意的間距值是「沒有設計系統」的最明顯信號

### 互動狀態完整性
每個互動元素必須有完整狀態。
Instead of: 只有 default + hover → Try: default / hover / active / focus-visible / disabled 全覆蓋
數據必須有：loading / empty / error 狀態

### 禁止
- 原生 select/date input — 無法 style，必須自建組件
- 純裝飾用途的漸層和顏色 — 顏色必須有意義
- 小元素用大圓角

### 對比度規則（Contrast — 必須遵守）
- 禁止白字配亮底：text-white 不能出現在 bg-white, bg-muted, bg-surface-1/2/3 上
- 毛玻璃（backdrop-blur）必須在深色容器內（bg-*-900 以上或 bg-black）才能用白字
- 若 Design System 的 background 是亮色，每個 section 可用深色容器包裹整個 section`
}

// ============================================================
// Tier-specific 約束集
// ============================================================

/**
 * 根據 tier 返回結構生成階段的約束文本
 */
export function getStructureConstraints(tier: DesignTier): string {
  const craft = getCraftFoundations()

  if (tier === 'creative') {
    return `${craft}

## 設計約束（Creative Tier — 創意型）

### 視覺表現力
- 漸層：線性漸層、radial gradient、mesh gradient 都 OK（禁止紫色多色 AI slop）
- 背景：可用噪點紋理（CSS SVG filter）、幾何圖案（dot grid）、微妙漸層
- Glass 效果：\`backdrop-blur-xl bg-white/70 border-white/20\`（適度、小面積）
- 多色：最多 3 個 accent color，必須和諧

### 佈局選單（至少用一個非標準佈局）
- **Bento Grid**：不等大小的網格，突出重要內容（CSS grid auto-fit + span）
- **Editorial Split**：左右不對稱分割（60/40 或 70/30），文圖交錯
- **Full-bleed Sections**：全寬段落 + 窄內容交替，建立視覺節奏
- **Overlapping Elements**：元素局部重疊增加視覺張力（negative margin / absolute）
- **Sticky Scroll**：固定左側 + 右側滾動切換

### 字體表現
- Display font 用於 hero/標題（clamp() 響應式）
- 鼓勵 serif + sans 搭配建立對比
- Instead of: 全站統一字號 → Try: 標題用 text-5xl tracking-tighter，正文用 text-base leading-relaxed
- 禁止只用 Inter/Roboto/Arial

### 仍然禁止
- 紫色多色漸層（AI slop）
- 卡通化、不專業的設計
- 過度使用 emoji
- 犧牲可讀性的裝飾`
  }

  // functional
  return `${craft}

## 設計約束（Functional Tier — 功能型）
保守、可預測的介面設計。每一個選擇都必須能解釋 why。

### 佈局選單（禁止千篇一律的 sidebar + card grid）
Instead of 等大小卡片矩陣，試試：
- **Command Center**：頂部命令列 + 左側 nav + 主區域（Linear 風格）
- **Data Table + Detail Panel**：左側列表/表格 + 右側詳情面板（Notion 風格）
- **Bento Dashboard**：不等大小的 metric 卡 + 主圖表（大小比例有變化）
- **Timeline View**：時間軸式的數據展示
- **Sidebar + Canvas**：左側工具列 + 中央畫布/編輯區

### 數據可視化多樣性
同一個 metric 有無限呈現方式：
| 常見（避免全用） | 替代方案 |
|-----------------|---------|
| icon + 大數字 + 小標籤 | sparkline + 趨勢箭頭 |
| 同大小 stat card | 大小混合 + hero metric 突出關鍵指標 |
| 圓餅圖 | progress ring / bar chart / tree map |
| 普通表格 | 帶 inline chart 的增強表格 |

### 顏色
- 一個 accent color 聚焦注意力
- 灰色構建結構（surface-1 → surface-2 微層次）
- Instead of: 彩色邊框區分 → Try: 左側色條（\`border-l-4\`）或微背景色
- 禁止漸層（除非用戶明確要求）
- 禁止 glow 效果

### 字體
- 可讀性優先
- 字體不是容器，字體就是設計 — 標題 weight、label 個性、段落質感定義產品感覺
- 禁止 Inter/Roboto/Arial 作為唯一字體（可以作為 fallback）

### 禁止
- 紫色多色漸層（AI slop）
- 過度裝飾 / 過度使用 emoji
- 多個 accent color — 稀釋焦點`
}

/**
 * 根據 tier 返回動畫生成階段的約束文本
 */
export function getAnimationConstraints(tier: DesignTier): string {
  const animationPatterns = `
### 推薦動畫 Pattern（motion/react 實作參考）

入場動畫：
\`\`\`tsx
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
\`\`\`

Stagger 列表：
\`\`\`tsx
{items.map((item, i) => (
  <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} />
))}
\`\`\`

Scroll reveal：
\`\`\`tsx
<motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: '-50px' }}>
\`\`\`

Card hover lift：
\`\`\`tsx
<motion.div whileHover={{ y: -2, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }} transition={{ duration: 0.2 }}>
\`\`\`
`

  if (tier === 'creative') {
    return `## 動畫風格（Creative Tier — 創意型）
允許更豐富的動畫表現，但必須遵守效能規則：

### 允許的動畫效果
- scroll-triggered 動畫（whileInView）
- stagger reveal（逐一入場，delay 遞增）
- spring physics（彈性動畫）
- hover surprise（hover 時出現額外元素/效果）
- 文字逐字/逐行入場
- 背景微動畫（緩慢漂浮、呼吸效果）
- 滑鼠跟隨的微互動

### 動畫原則
- 入場動畫可以到 500ms（但仍用 ease-out）
- 互動反饋仍然 ≤200ms
- 可以有連續的微動畫（但必須在可視範圍內才播放）
- 每個動畫都要有意義，不是為了動而動
${animationPatterns}
### 仍然必須遵守
- 只動畫 compositor props（transform/opacity）
- 尊重 prefers-reduced-motion
- 離屏暫停動畫
- 禁止大面積 blur 動畫
- 禁止混合多套動畫系統`
  }

  // functional
  return `## 動畫風格（Functional Tier — 功能型）
克制、有目的的動畫。快速的微互動（~150ms），平滑 easing。

### 動畫原則
- 只在有意義的地方加動畫（狀態轉換、載入、成功反饋）
- 入場動畫用 ease-out，不超過 300ms
- 互動反饋（hover/tap）~150ms，不超過 200ms
- 禁止 bouncy/spring 效果
- 避免 layout shift
- 避免過度動畫（保持克制）
${animationPatterns}
### 必須遵守
- 只動畫 compositor props（transform/opacity）
- 尊重 prefers-reduced-motion
- 離屏暫停動畫
- 禁止大面積 blur 動畫
- 禁止混合多套動畫系統`
}

/**
 * 根據 tier 返回變體生成的提示文本
 */
function getVariantPromptHint(tier: DesignTier): string {
  if (tier === 'creative') {
    return `## Design Tier: Creative（創意型）
這是一個需要視覺表現力的產品。設計變體應該更大膽：
- 可以使用漸層背景（但禁止紫色多色漸層）
- 可以使用多 accent color（協調的）
- 鼓勵獨特的字體搭配（serif + sans 對比）
- 佈局可以不對稱、有 overlap、Bento Grid
- Variant E (Expressive) 應該特別大膽

## Signature Element
每個變體必須有一個「Signature」— 一個只屬於這個產品的**具體視覺元素**。
好的 signatureElement 範例：
- 「打字機式的 hero 文字入場動畫」
- 「食材圖鑑式的圓角菜單卡片」
- 「分裂畫面的 before/after 對比區塊」
- 「電影分鏡式的作品時間軸」
壞的 signatureElement（太抽象）：「清晰的視覺層級」「現代設計」「乾淨的介面」`
  }

  return `## Design Tier: Functional（功能型）
這是一個功能導向的產品。設計變體應該保守專業：
- 禁止漸層、glow 效果
- 每個視圖限一個 accent color
- 動畫克制

## Anti-Default 原則
每個設計選擇都必須是有意識的，不能因為「常見」就使用。
- metric 不一定是 icon + 大數字 + 小標籤 — 試試 sparkline、progress ring、趨勢箭頭
- sidebar 不一定是唯一的導航方式 — 試試頂部 tab、breadcrumb、command palette
- card grid 不是唯一的佈局模式 — 試試 bento grid、split panel、timeline

## Signature Element
每個變體必須有一個「Signature」— 一個能讓這個介面與其他 dashboard 區分的**具體視覺元素**。
好的 signatureElement 範例：
- 「時鐘式的 24 小時活動熱力圖」
- 「地鐵路線圖式的流程追蹤」
- 「指揮中心式的數據總覽面板」
- 「太空任務控制台的狀態面板」
壞的 signatureElement（太抽象）：「清晰的視覺層級」「功能導向設計」「直覺的操作流程」`
}

/**
 * 根據 tier 獲取調整後的 VARIANT_AXES（主要調整 Variant E）
 */
function getVariantAxes(tier: DesignTier) {
  const axes = { ...VARIANT_AXES }
  if (tier === 'creative') {
    axes.E = {
      ...axes.E,
      prompt: `大膽的視覺表現：
- 漸層背景（mesh gradient / radial gradient）、噪點紋理、幾何圖案
- 獨特的字體搭配（display font + body font，serif/sans 對比）
- 不對稱佈局、overlap 元素、打破 grid
- Glass 效果（backdrop-blur + 半透明邊框）
- 超大標題（text-6xl+ tracking-tighter）+ 漸層文字
- 大膽但有品味的配色（禁止紫色多色 AI slop）`,
    }
  }
  return axes
}

// ============================================================
// 類型定義
// ============================================================

/**
 * Design System 類型
 * 定義完整的設計系統，包含顏色、排版、間距等
 */
export interface DesignSystem {
  cssVariables: string // :root { --color-primary: ...; }
  tailwindExtend: {
    colors?: Record<string, string>
    spacing?: Record<string, string>
    borderRadius?: Record<string, string>
    fontFamily?: Record<string, string[]>
  }
  typography: {
    fontFamily: string
    scale: Record<string, string> // text-xs, text-sm, text-base...
  }
  colorPalette: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
    border: string
    surface1?: string
    surface2?: string
    surface3?: string
    ring?: string
    destructive?: string
    success?: string
  }
  spacing: {
    unit: number // 4px
    scale: Record<string, string> // sm, md, lg...
  }
  borderRadius: {
    none: string
    sm: string
    md: string
    lg: string
    full: string
  }
  metadata?: {
    layoutPreference?: string   // 來自 layout 變體的佈局偏好
    interactionModel?: string   // 來自 interaction 變體的互動模式
  }
  shadows?: {
    strategy: 'borders-only' | 'subtle-shadows' | 'layered-shadows'
    values: {
      sm?: string
      md?: string
      lg?: string
      glow?: string
    }
  }
  gradients?: {
    primary?: string
    surface?: string
    accent?: string
  }
  depth?: {
    strategy: 'flat' | 'subtle' | 'elevated' | 'glassmorphic'
    cardStyle: string
  }
  animationPersonality?: 'minimal' | 'smooth' | 'bouncy' | 'dramatic' | 'playful'
  layoutArchetype?: 'bento' | 'editorial' | 'dashboard' | 'storytelling' | 'app-shell'
  mood?: string
}

/**
 * 設計變體
 * 5 個不同方向的設計變體
 */
export interface DesignVariant {
  id: 'A' | 'B' | 'C' | 'D' | 'E'
  name: string
  axis: 'hierarchy' | 'layout' | 'density' | 'interaction' | 'expressive'
  description: string
  designSystem: DesignSystem
  previewDescription: string // 用於描述預覽效果
  keyFeatures: string[] // 這個變體的關鍵特點
  signatureElement?: string // 此變體最獨特的視覺/結構元素
}

/**
 * 選中的 Variant 創意概念
 * 從 DesignVariant 中提取，傳遞給生成函數作為設計靈魂
 */
export interface VariantConcept {
  name: string
  description: string
  keyFeatures: string[]
  previewDescription: string
  signatureElement?: string
  sourceVariantIds: string[]
}

/**
 * 從選中的變體中提取創意概念
 * 單選：直接提取。多選：以第一個為主，附加其他 variant 的 keyFeatures
 */
export function extractVariantConcept(
  selectedIds: string[],
  allVariants: DesignVariant[]
): VariantConcept {
  const selected = selectedIds
    .map(id => allVariants.find(v => v.id === id))
    .filter((v): v is DesignVariant => !!v)

  if (selected.length === 0) {
    return {
      name: 'Default',
      description: '',
      keyFeatures: [],
      previewDescription: '',
      sourceVariantIds: selectedIds,
    }
  }

  const primary = selected[0]
  const mergedFeatures = [...primary.keyFeatures]

  // 多選時附加其他 variant 的 keyFeatures（去重）
  for (let i = 1; i < selected.length; i++) {
    for (const feature of selected[i].keyFeatures) {
      if (!mergedFeatures.includes(feature)) {
        mergedFeatures.push(feature)
      }
    }
  }

  return {
    name: primary.name,
    description: primary.description,
    keyFeatures: mergedFeatures,
    previewDescription: primary.previewDescription,
    signatureElement: primary.signatureElement,
    sourceVariantIds: selectedIds,
  }
}

/**
 * 模板數據（來自資料庫 templates 表）
 */
export interface TemplateData {
  id: string
  name: string
  slug: string
  category: string
  description: string
  designDefaults: {
    colorScheme?: string
    typography?: string
    spacing?: string
    borderRadius?: string
  }
  pageStructure: {
    pages?: string[]
    components?: string[]
  }
}

/**
 * 設計變體生成結果
 */
export interface DesignVariantsResult {
  success: boolean
  variants?: DesignVariant[]
  error?: string
}

/**
 * 程式碼生成結果
 */
export interface GenerationResult {
  success: boolean
  pages?: GeneratedComponent[]
  components?: GeneratedComponent[]
  styles?: string
  tailwindConfig?: string
  error?: string
}

/**
 * 全棧迭代結果（前端 + 後端 + 刪除）
 */
export interface FullStackGenerationResult {
  success: boolean
  pages?: GeneratedComponent[]
  components?: GeneratedComponent[]
  styles?: string
  backendFiles?: GeneratedComponent[]
  deletedPaths?: string[]
  error?: string
}

interface CodeBundle {
  pages: GeneratedComponent[]
  components: GeneratedComponent[]
  styles: string
}

export interface RefinePatchSet {
  modifiedPages: Map<string, string>
  modifiedComponents: Map<string, string>
  modifiedStyles: string
}

export interface SuspiciousRefineShrink {
  path: string
  originalLines: number
  newLines: number
}

/**
 * 偵測用戶是否有刪除/移除功能的意圖
 * 有刪除意圖時，代碼大幅縮減是合理的（不是截斷）
 */
function hasRemovalIntent(userFeedback: string): boolean {
  return /拿掉|移除|刪除|取消|去掉|不要|不需要|砍掉|remove|delete|drop|get rid of/i.test(userFeedback)
}

export function findSuspiciousRefineShrinks(
  baseCode: CodeBundle,
  patches: RefinePatchSet,
  threshold = 0.4,
  userFeedback?: string,
): SuspiciousRefineShrink[] {
  const issues: SuspiciousRefineShrink[] = []
  const allOriginal = [...baseCode.pages, ...baseCode.components]
  const removalIntent = userFeedback ? hasRemovalIntent(userFeedback) : false

  for (const [path, newContent] of [
    ...patches.modifiedPages.entries(),
    ...patches.modifiedComponents.entries(),
  ]) {
    const original = allOriginal.find(file => file.path === path)
    if (!original) continue

    const originalLines = original.content.split('\n').length
    const newLines = newContent.split('\n').length

    // 用戶有刪除意圖時，只要新代碼 >= 3 行（至少有 export default）就放行
    if (removalIntent && newLines >= 3) continue

    if (originalLines > 30 && newLines < originalLines * (1 - threshold)) {
      issues.push({ path, originalLines, newLines })
    }
  }

  return issues
}

// LlmTrackingContext 已在上方定義

// ============================================================
// 設計變體軸定義
// ============================================================

const VARIANT_AXES = {
  A: {
    id: 'A' as const,
    name: 'Hierarchy Focus',
    axis: 'hierarchy' as const,
    description: '強調視覺層級，清晰的信息架構',
    prompt: `視覺層級和信息架構。選擇一種信息組織策略：
- **Hero-Driven**：一個壓倒性的主視覺元素 + 漸進式次要信息
- **Card Hierarchy**：大小不等的卡片，大卡片 = 重要信息
- **Typography-Led**：用字體大小/粗細/顏色建立 5 級信息層級
靈感：Linear 的清晰層級、Stripe 的信息密度控制`,
  },
  B: {
    id: 'B' as const,
    name: 'Layout Model',
    axis: 'layout' as const,
    description: '探索根本不同的空間組織方式',
    prompt: `根本不同的空間組織。你必須使用以下之一（不是 sidebar + card grid）：
- **Bento Grid**：CSS grid 不等比例，內容決定尺寸
- **Split Panel**：左右不對稱（40/60 或 30/70），各有功能
- **Timeline/Flow**：時間或步驟驅動的佈局
- **Canvas + Toolbar**：中央工作區 + 邊欄工具
- **Stacked Sections**：全寬段落堆疊，每段有獨立視覺語言
靈感：Notion 的 block 式、Arc 的 sidebar、Figma 的 canvas`,
  },
  C: {
    id: 'C' as const,
    name: 'Density',
    axis: 'density' as const,
    description: '密度變化：Compact vs Spacious',
    prompt: `信息密度極端化。選一個方向：
- **Ultra-Compact**：Bloomberg Terminal 風格，最大信息密度，小字號 + 緊湊間距
- **Balanced**：間距節奏感（8px 基準 → 小元素 4px、區塊 24-32px）
- **Spacious Editorial**：大量留白，每個元素都有呼吸空間
密度不只是間距 — 還包括字體大小、行高、元素數量`,
  },
  D: {
    id: 'D' as const,
    name: 'Interaction',
    axis: 'interaction' as const,
    description: '探索獨特的互動模式和操作流程',
    prompt: `獨特的互動模式。至少實作一個非標準互動：
- **Inline Expand**：點擊行展開詳情（不彈 Modal）
- **Command Palette**：Cmd+K 快速搜尋/跳轉
- **Contextual Toolbar**：選中/hover 時出現的操作條
- **Drag Reorder**：拖拽排序列表/卡片
- **Quick Actions**：hover 時出現操作按鈕（Slack hover actions 風格）
靈感：VS Code 的 command palette、Slack 的 hover actions`,
  },
  E: {
    id: 'E' as const,
    name: 'Expressive',
    axis: 'expressive' as const,
    description: '表現力：有意義的動畫和品牌特色',
    prompt: `表現力和品牌特色。具體方向：
- 有意義的微動畫（狀態轉換、載入、成功反饋）
- 品牌色彩的創意運用（漸層文字、色塊背景交替）
- 獨特的視覺元素（幾何裝飾、背景紋理、微噪點）
- 字體搭配要有個性（serif + sans 對比、display font 大標題）
- 但保持專業品味，不要過度設計`,
  },
}

// ============================================================
// 核心函數
// ============================================================

/**
 * 生成 5 個設計變體
 * 一次 LLM 調用生成所有變體的 Design System
 */
export async function generateDesignVariants(
  template: TemplateData,
  bddSpec: string,
  productType: string,
  designTier?: DesignTier,
  trackingContext?: LlmTrackingContext,
  originalRequirements?: string,
  referenceAnalysis?: import('./reference-analyzer').ReferenceAnalysis,
  moodId?: string
): Promise<DesignVariantsResult> {
  const tier = designTier || 'functional'
  const axes = getVariantAxes(tier)

  const structuredRef = referenceAnalysis ? formatStructuredDataForPrompt(referenceAnalysis) : ''
  const referenceSection = referenceAnalysis?.visionAnalysis
    ? `\n\n## 參考網站設計分析（真實數據 — 指導風格方向）
URL: ${referenceAnalysis.url}
${referenceAnalysis.metadata?.title ? `網站: ${referenceAnalysis.metadata.title}` : ''}

${referenceAnalysis.visionAnalysis}

${structuredRef}

設計變體應參考但不照搬這些設計特徵。提取其設計精神，結合產品需求做差異化。${structuredRef ? '\n至少 2-3 個變體的主色應接近參考色板。' : ''}`
    : ''

  const systemPrompt = `你是一位資深的 UI/UX 設計師和前端架構師。你的任務是為一個產品生成 5 個不同方向的設計變體。

## 產品類型
${productType}

## 用戶的原始願景（最高優先 — 定義設計方向）
以下是用戶親自撰寫的需求描述。這代表產品的核心想像和美學目標。
BDD 規格列出了技術功能，但設計變體應服務於用戶的原始願景。
如果用戶 80% 的描述在講前端展覽動畫體驗，5 個變體都應圍繞前端體驗來差異化，
不要圍繞後台管理介面的佈局差異。

${originalRequirements || '（無原始描述）'}${referenceSection}

## 模板基礎
- 名稱：${template.name}
- 類別：${template.category}
- 設計默認值：${JSON.stringify(template.designDefaults, null, 2)}

## BDD 規格（功能清單 — 不代表設計優先級）
功能數量不等於設計重要性。設計優先級以上方「用戶原始願景」為準。
${bddSpec || '（無規格）'}

${getVariantPromptHint(tier)}
${moodId ? `\n## Design Mood（視覺風格指引 — 最高優先）\n${getMoodPromptBlock(moodId)}\n` : ''}
${listPatternsForVariants(tier)}

## 5 個設計軸
${Object.values(axes).map(v => `- **${v.id}. ${v.name}**：${v.description}\n  ${v.prompt}`).join('\n\n')}

## 輸出格式
請以 JSON 格式輸出 5 個設計變體：

\`\`\`json
{
  "variants": [
    {
      "id": "A",
      "name": "Hierarchy Focus",
      "axis": "hierarchy",
      "description": "簡短描述這個變體的設計方向",
      "previewDescription": "描述預覽效果（2-3 句話）",
      "keyFeatures": ["特點1", "特點2", "特點3"],
      "signatureElement": "此變體最獨特的視覺/結構元素（必須具體到可直接實作，例如「花園隱喻的支出樹狀圖」）",
      "designSystem": {
        "cssVariables": ":root { --color-primary: #...; --color-secondary: #...; }",
        "tailwindExtend": {
          "colors": { "primary": "#...", "secondary": "#..." },
          "spacing": {},
          "borderRadius": {},
          "fontFamily": {}
        },
        "typography": {
          "fontFamily": "DM Sans, system-ui, sans-serif",
          "scale": { "xs": "0.75rem", "sm": "0.875rem", "base": "1rem", "lg": "1.125rem", "xl": "1.25rem" }
        },
        "colorPalette": {
          "primary": "#...",
          "secondary": "#...",
          "accent": "#...",
          "background": "#...",
          "foreground": "#...",
          "muted": "#...",
          "border": "#...",
          "surface1": "#... (主背景)",
          "surface2": "#... (卡片)",
          "surface3": "#... (hover)"
        },
        "spacing": {
          "unit": 4,
          "scale": { "sm": "0.5rem", "md": "1rem", "lg": "1.5rem", "xl": "2rem" }
        },
        "borderRadius": {
          "none": "0",
          "sm": "0.25rem",
          "md": "0.5rem",
          "lg": "0.75rem",
          "full": "9999px"
        },
        "shadows": {
          "strategy": "subtle-shadows",
          "values": {
            "sm": "0 1px 3px rgba(0,0,0,0.06)",
            "md": "0 4px 6px rgba(0,0,0,0.07)",
            "lg": "0 10px 25px rgba(0,0,0,0.10)"
          }
        },
        "depth": {
          "strategy": "subtle",
          "cardStyle": "bg-white shadow-sm rounded-xl border border-border/50"
        },
        "animationPersonality": "smooth",
        "layoutArchetype": "bento"
      }
    }
    // ... 其他 4 個變體
  ]
}
\`\`\`

## Anti-Default 原則（重要）
你的訓練數據中見過數千個 dashboard 和介面。模式很強。你會不自覺地生成模板化的輸出。

**The Swap Test**：如果你把你選的字體換成 Inter，把佈局換成標準 sidebar + card grid，設計感沒有明顯不同 — 那你沒有做設計，你在填模板。每個選擇都必須能解釋 why。

**Infinite Expression**：同一個模式有無限種表達方式。
- metric 可以是 hero number / inline stat / sparkline / gauge / progress ring / comparison delta / trend badge
- 導航可以是 sidebar / tab bar / breadcrumb / command palette / contextual
- 卡片佈局有無限的比例、間距、強調方式
Linear 的卡片不像 Notion 的。Vercel 的 metric 不像 Stripe 的。同樣的概念，無限的表達。

## 強制差異化規則（Critical）
1. 5 個變體必須使用 **至少 3 種不同的佈局模型**（不允許全部用 sidebar + main content）
2. 每個變體的 signatureElement 必須是具體的視覺元素（例如「用等高線圖表示數據趨勢」），不是抽象概念（例如「清晰的視覺層級」）
3. 配色不能只改 hue — 至少 2 個變體要改變深度策略（borders-only vs shadows vs layered）
4. 字體搭配至少 3 種不同組合
5. surface-1/2/3 層級色差要微妙但可辨識（不是全部 #ffffff）

## 簽名元素範例（按產品類型）
- Dashboard：「時鐘式的 24 小時活動熱力圖」「地鐵路線圖式的流程追蹤」
- Landing Page：「打字機式的 hero 文字動畫」「分裂畫面的 before/after 對比」
- Restaurant：「食材圖鑑式的菜單卡片」「手繪風格的裝飾分隔線」
- Portfolio：「電影分鏡式的作品展示」「雜誌翻頁式的專案詳情」
- SaaS：「指揮中心式的數據總覽」「太空任務控制台的狀態面板」

## 設計原則
1. **顏色來自產品世界**：如果這個產品是一個實體空間，你會看到什麼顏色？
2. **字體是設計，不是容器**：字體的 weight、個性、質感定義產品的感覺
3. **間距要一致**：使用 4px 或 8px 為基礎單位
4. **Subtle Layering**：用 surface-1/2/3 建立微妙但可辨識的表面層級
${tier === 'creative' ? `5. **大膽設計**：Creative tier 允許漸層（有品味的）、多色、不對稱佈局
6. **獨特字體**：鼓勵使用 display font + body font 搭配` : `5. **避免 AI Slop**：禁止紫色漸層、glow 效果、過度裝飾`}

## 禁止
- 不要使用 Inter, Roboto, Arial 作為唯一字體（可以作為 fallback）
- 不要使用紫色漸層配白色背景
- 不要使用過度飽和的顏色
${tier === 'functional' ? '- 不要使用漸層（除非明確要求）\n- 不要使用 glow 效果' : '- 漸層 OK 但禁止紫色多色漸層\n- 輕微 glow OK 但禁止大面積 glow'}`

  const userMessage = `請根據上述信息，生成 5 個設計變體。確保每個變體都有獨特的設計方向和完整的 Design System。`

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 16384, temperature: tier === 'creative' ? 0.6 : 0.4 }, // creative 更高 temperature 鼓勵差異化
    { ...trackingContext, purpose: 'generate_design_variants' }
  )

  if (!response.success || !response.content) {
    return { success: false, error: response.error || '無法生成設計變體' }
  }

  try {
    // 安全解析 JSON
    const parsed = safeParseJson<{ variants?: unknown[] }>(response.content)
    if (!parsed) {
      return { success: false, error: '無法解析 LLM 回應' }
    }

    // 驗證變體結構
    if (!parsed.variants || !Array.isArray(parsed.variants) || parsed.variants.length !== 5) {
      return { success: false, error: '變體數量不正確，預期 5 個' }
    }

    return {
      success: true,
      variants: parsed.variants as DesignVariant[],
    }
  } catch (err) {
    return { success: false, error: `解析設計變體時發生錯誤: ${err}` }
  }
}

/**
 * 合併用戶選擇的變體
 * 可以選擇單個變體，或合併多個變體的特定面向
 */
export function synthesizeVariants(
  selectedVariantIds: string[],
  allVariants: DesignVariant[],
  moodId?: string
): DesignSystem {
  // 如果只選擇一個變體，直接返回其 Design System
  if (selectedVariantIds.length === 1) {
    const variant = allVariants.find(v => v.id === selectedVariantIds[0])
    if (variant) {
      const result = variant.designSystem
      if (moodId) result.mood = moodId
      return result
    }
  }

  // 多個變體合併：優先使用第一個選擇的作為基礎，然後合併其他
  const baseVariant = allVariants.find(v => v.id === selectedVariantIds[0])
  if (!baseVariant) {
    // fallback 到第一個變體
    const result = allVariants[0].designSystem
    if (moodId) result.mood = moodId
    return result
  }

  const result: DesignSystem = JSON.parse(JSON.stringify(baseVariant.designSystem))

  // 合併其他變體的特定面向
  for (let i = 1; i < selectedVariantIds.length; i++) {
    const variant = allVariants.find(v => v.id === selectedVariantIds[i])
    if (!variant) continue

    // 根據變體的 axis 決定合併哪些屬性
    switch (variant.axis) {
      case 'hierarchy':
        // 合併 typography
        result.typography = variant.designSystem.typography
        break
      case 'density':
        // 合併 spacing
        result.spacing = variant.designSystem.spacing
        break
      case 'expressive':
        // 合併 color palette 的 accent
        result.colorPalette.accent = variant.designSystem.colorPalette.accent
        // 合併 depth 和 shadows（expressive 軸的視覺深度）
        if (variant.designSystem.depth) result.depth = variant.designSystem.depth
        if (variant.designSystem.shadows) result.shadows = variant.designSystem.shadows
        break
      case 'layout':
        // 合併佈局偏好到 metadata
        if (!result.metadata) result.metadata = {}
        result.metadata.layoutPreference = variant.description
        // 合併 layoutArchetype
        if (variant.designSystem.layoutArchetype) result.layoutArchetype = variant.designSystem.layoutArchetype
        break
      case 'interaction':
        // 合併互動模式偏好到 metadata
        if (!result.metadata) result.metadata = {}
        result.metadata.interactionModel = variant.description
        break
    }
  }

  // 設置 moodId
  if (moodId) result.mood = moodId

  // 重新生成 CSS variables
  result.cssVariables = generateCssVariables(result)

  return result
}

/**
 * 從 Design System 生成 CSS Variables
 */
function generateCssVariables(ds: DesignSystem): string {
  return `:root {
  /* Colors */
  --color-primary: ${ds.colorPalette.primary};
  --color-secondary: ${ds.colorPalette.secondary};
  --color-accent: ${ds.colorPalette.accent};
  --color-background: ${ds.colorPalette.background};
  --color-foreground: ${ds.colorPalette.foreground};
  --color-muted: ${ds.colorPalette.muted};
  --color-border: ${ds.colorPalette.border};
  ${ds.colorPalette.destructive ? `--color-destructive: ${ds.colorPalette.destructive};` : ''}
  ${ds.colorPalette.success ? `--color-success: ${ds.colorPalette.success};` : ''}

  /* Typography */
  --font-family: ${ds.typography.fontFamily};
  ${Object.entries(ds.typography.scale).map(([k, v]) => `--font-size-${k}: ${v};`).join('\n  ')}

  /* Spacing */
  ${Object.entries(ds.spacing.scale).map(([k, v]) => `--spacing-${k}: ${v};`).join('\n  ')}

  /* Border Radius */
  --radius-none: ${ds.borderRadius.none};
  --radius-sm: ${ds.borderRadius.sm};
  --radius-md: ${ds.borderRadius.md};
  --radius-lg: ${ds.borderRadius.lg};
  --radius-full: ${ds.borderRadius.full};
}`
}

/**
 * 共用的 Design System Prompt 構建函數
 */
export function buildDesignSystemPrompt(designSystem: DesignSystem): string {
  return `## Design System（必須嚴格遵守）

### CSS Variables
\`\`\`css
${designSystem.cssVariables}
\`\`\`

### 顏色規範
- Primary: ${designSystem.colorPalette.primary}
- Secondary: ${designSystem.colorPalette.secondary}
- Accent: ${designSystem.colorPalette.accent}
- Background: ${designSystem.colorPalette.background}
- Foreground: ${designSystem.colorPalette.foreground}
- Muted: ${designSystem.colorPalette.muted}
- Border: ${designSystem.colorPalette.border}
${designSystem.colorPalette.surface1 ? `- Surface-1 (主背景): ${designSystem.colorPalette.surface1}
- Surface-2 (卡片): ${designSystem.colorPalette.surface2}
- Surface-3 (hover): ${designSystem.colorPalette.surface3}
- Ring (focus): ${designSystem.colorPalette.ring}

顏色使用指引：
- 背景分層：surface-1（底層）→ surface-2（卡片）→ surface-3（hover/active）
- 這三個層級的色差要微妙但可辨識（Subtle Layering 原則）` : ''}

### 字體規範
- 主要字體 (font-sans): ${designSystem.typography.fontFamily}
${designSystem.tailwindExtend.fontFamily?.display ? `- 標題字體 (font-display): ${(designSystem.tailwindExtend.fontFamily.display as string[])[0]}\n` : ''}\
${designSystem.tailwindExtend.fontFamily?.mono ? `- 等寬字體 (font-mono): ${(designSystem.tailwindExtend.fontFamily.mono as string[])[0]}\n` : ''}\
- 使用方式：正文用 font-sans${designSystem.tailwindExtend.fontFamily?.display ? '，標題/大字用 font-display' : ''}${designSystem.tailwindExtend.fontFamily?.mono ? '，程式碼用 font-mono' : ''}
- Scale: ${JSON.stringify(designSystem.typography.scale)}

### 間距規範
- Base Unit: ${designSystem.spacing.unit}px
- Scale: ${JSON.stringify(designSystem.spacing.scale)}

### 圓角規範
${JSON.stringify(designSystem.borderRadius, null, 2)}
${designSystem.shadows ? `
### 陰影策略（Shadow — 必須遵守）
${designSystem.shadows.strategy === 'borders-only'
  ? '- strategy: borders-only → 用 border 建立層次，禁止使用 shadow-*'
  : designSystem.shadows.strategy === 'subtle-shadows'
  ? '- strategy: subtle-shadows → 低調單層陰影，強調懸浮感'
  : '- strategy: layered-shadows → 多層次陰影，sm→lg 建立深度'}
${designSystem.shadows.values.sm ? `- shadow-sm: ${designSystem.shadows.values.sm}` : ''}
${designSystem.shadows.values.md ? `- shadow-md: ${designSystem.shadows.values.md}` : ''}
${designSystem.shadows.values.lg ? `- shadow-lg: ${designSystem.shadows.values.lg}` : ''}
${designSystem.shadows.values.glow ? `- glow: ${designSystem.shadows.values.glow}` : ''}` : ''}
${designSystem.depth ? `
### 卡片視覺深度（Depth — 統一標準）
- strategy: ${designSystem.depth.strategy}
- 統一卡片樣式：
\`\`\`
${designSystem.depth.cardStyle}
\`\`\`` : ''}
${designSystem.gradients ? `
### 漸層規範（Gradients）
${designSystem.gradients.primary ? `- primary gradient: ${designSystem.gradients.primary}` : ''}
${designSystem.gradients.surface ? `- surface gradient: ${designSystem.gradients.surface}` : ''}
${designSystem.gradients.accent ? `- accent gradient: ${designSystem.gradients.accent}` : ''}` : ''}
${designSystem.mood ? `
### 設計情緒基調
${getMoodSummary(designSystem.mood)}（完整風格指引已在生成指令中注入）` : ''}

## 技術棧
- Next.js App Router（14+ 相容，優先使用 Server Components，禁止使用 async params 或 React 19 專屬 API）
- Tailwind CSS v3（使用 CSS variables）
- TypeScript

## 輸出格式
每個檔案使用以下格式：

\`\`\`tsx:path/to/file.tsx
// 檔案內容
\`\`\`

⚠️ code fence 規則：每個 code block 的第一行必須直接是代碼（import、'use client'、const 等），禁止在代碼前加任何說明文字（如 "Here is the..."、"This component..."）。

## 顏色使用規則
- 只使用 Design System 定義的顏色
- 使用 Tailwind 自訂顏色 utility：bg-primary, text-foreground, border-border 等（已在 tailwind.config 中配置）
- 禁止使用 bg-[var(--color-primary)] 這種 arbitrary value 語法
- 禁止使用 Tailwind 默認顏色（bg-blue-500 等）
- 對比配對：亮底（background/surface-1/2/3）→ text-foreground（深色）；深底（slate-950/black）→ text-white（白色）
- 半透明白色卡片（bg-white/50 以上）→ 偏亮 → 用深色文字；bg-white/10 以下 → 依底層顏色決定文字色`
}

/**
 * 快速模式專用 Design System prompt — 去重精簡版
 * 差異：移除和 CSS Variables 重複的顏色列表、typography scale JSON、間距 scale
 * 保留：CSS Variables（唯一顏色源）、surface layering 語義指引、字體名、圓角、陰影策略、depth、漸層 primary、mood、輸出格式、顏色規則
 */
export function buildDesignSystemPromptFast(designSystem: DesignSystem): string {
  return `## Design System（必須嚴格遵守）

### CSS Variables（顏色唯一來源 — 對照 Tailwind utility 使用）
\`\`\`css
${designSystem.cssVariables}
\`\`\`
${designSystem.colorPalette.surface1 ? `
### 表面層級（Surface Layering）
- surface-1（底層）→ surface-2（卡片）→ surface-3（hover/active）
- 色差微妙但可辨識（Subtle Layering 原則）` : ''}

### 字體規範
- 主要字體 (font-sans): ${designSystem.typography.fontFamily}
${designSystem.tailwindExtend.fontFamily?.display ? `- 標題字體 (font-display): ${(designSystem.tailwindExtend.fontFamily.display as string[])[0]}\n` : ''}\
${designSystem.tailwindExtend.fontFamily?.mono ? `- 等寬字體 (font-mono): ${(designSystem.tailwindExtend.fontFamily.mono as string[])[0]}\n` : ''}\
- 使用方式：正文用 font-sans${designSystem.tailwindExtend.fontFamily?.display ? '，標題/大字用 font-display' : ''}${designSystem.tailwindExtend.fontFamily?.mono ? '，程式碼用 font-mono' : ''}

### 圓角規範
${JSON.stringify(designSystem.borderRadius, null, 2)}
${designSystem.shadows ? `
### 陰影策略
${designSystem.shadows.strategy === 'borders-only'
  ? '- borders-only → 用 border 建立層次，禁止 shadow-*'
  : designSystem.shadows.strategy === 'subtle-shadows'
  ? '- subtle-shadows → 低調單層陰影'
  : '- layered-shadows → 多層次 sm→lg'}
${designSystem.shadows.values.sm ? `- shadow-sm: ${designSystem.shadows.values.sm}` : ''}` : ''}
${designSystem.depth ? `
### 卡片深度
\`${designSystem.depth.cardStyle}\`` : ''}
${designSystem.gradients ? `
### 漸層
${designSystem.gradients.primary ? `- primary: ${designSystem.gradients.primary}` : ''}` : ''}
${designSystem.mood ? `
### 設計情緒
${getMoodSummary(designSystem.mood)}` : ''}

## 技術棧
- Next.js App Router（14+ 相容）+ Tailwind CSS v3 + TypeScript

## 輸出格式
每個檔案使用以下格式：

\`\`\`tsx:path/to/file.tsx
// 檔案內容
\`\`\`

⚠️ code fence 規則：每個 code block 的第一行必須直接是代碼（import、'use client'、const 等），禁止在代碼前加任何說明文字。

## 顏色使用規則
- 只使用 Design System 定義的顏色（bg-primary, text-foreground, border-border 等）
- 禁止 bg-[var(--color-primary)] arbitrary value 語法
- 禁止 Tailwind 默認顏色（bg-blue-500 等）
- 對比配對：亮底（background/surface-1/2/3）→ text-foreground；深底（slate-950/black）→ text-white
- 半透明白色卡片（bg-white/50 以上）→ 用深色文字；bg-white/10 以下 → 依底層顏色決定`
}

export function buildCompactDesignPrompt(
  designSystem: DesignSystem,
  options?: { includeTypography?: boolean; includeMood?: boolean }
): string {
  const lines = [
    '## Design System 摘要（迭代階段）',
    `- Colors: primary=${designSystem.colorPalette.primary}, accent=${designSystem.colorPalette.accent}, background=${designSystem.colorPalette.background}, foreground=${designSystem.colorPalette.foreground}, border=${designSystem.colorPalette.border}`,
    `- Surface layering: ${designSystem.colorPalette.surface1 || designSystem.colorPalette.background} -> ${designSystem.colorPalette.surface2 || designSystem.colorPalette.muted} -> ${designSystem.colorPalette.surface3 || designSystem.colorPalette.background}`,
    `- Radius: sm=${designSystem.borderRadius.sm}, md=${designSystem.borderRadius.md}, lg=${designSystem.borderRadius.lg}`,
    `- Spacing unit: ${designSystem.spacing.unit}px`,
  ]

  if (options?.includeTypography !== false) {
    lines.push(`- Typography: ${designSystem.typography.fontFamily}`)
  }
  if (designSystem.shadows?.strategy) {
    lines.push(`- Depth strategy: ${designSystem.shadows.strategy}`)
  }
  if (designSystem.animationPersonality) {
    lines.push(`- Animation personality: ${designSystem.animationPersonality}`)
  }
  if (options?.includeMood !== false && designSystem.mood) {
    lines.push(`- Mood: ${getMoodSummary(designSystem.mood)}`)
  }

  lines.push(
    '- 使用既有 Design System token；不要改色盤、字體家族、間距尺度。',
    '- 只輸出實際修改的檔案。'
  )

  return lines.join('\n')
}

function countResponsiveClassesInBundle(code: CodeBundle): number {
  const allContent = [...code.pages, ...code.components].map(c => c.content).join('\n')
  return (allContent.match(/\b(sm|md|lg|xl|2xl):/g) || []).length
}

function mergeCodeBundle(base: CodeBundle, patch: Partial<CodeBundle>): CodeBundle {
  const pageMap = new Map((patch.pages || []).map(page => [page.path, page]))
  const componentMap = new Map((patch.components || []).map(component => [component.path, component]))

  const pages = [
    ...base.pages.map(page => pageMap.get(page.path) ?? page),
    ...(patch.pages || []).filter(page => !base.pages.some(existing => existing.path === page.path)),
  ]
  const components = [
    ...base.components.map(component => componentMap.get(component.path) ?? component),
    ...(patch.components || []).filter(component => !base.components.some(existing => existing.path === component.path)),
  ]

  return {
    pages,
    components,
    styles: patch.styles || base.styles,
  }
}

// ============================================================
// Search/Replace diff 模式（ENABLE_DIFF_OUTPUT）
// ============================================================

interface SearchReplaceBlock {
  filePath: string
  searchContent: string
  replaceContent: string
  isCreate: boolean
}

interface ApplyResult {
  success: boolean
  updatedCode: CodeBundle
  failedBlocks: SearchReplaceBlock[]
  appliedCount: number
}

/**
 * 解析 LLM 輸出的 SEARCH/REPLACE blocks
 * 回傳 null 代表沒有找到任何 block（應 fallback 到 full-file 解析）
 */
export function parseSearchReplaceBlocks(content: string): SearchReplaceBlock[] | null {
  const BLOCK_REGEX = /<<<<<<< (?:SEARCH|CREATE):([^\n]+)\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> REPLACE/g
  const blocks: SearchReplaceBlock[] = []
  let match

  while ((match = BLOCK_REGEX.exec(content)) !== null) {
    const filePath = match[1].trim()
    const searchContent = match[2]
    const replaceContent = match[3]
    // SEARCH 為空（只有空白）= CREATE 模式
    const isCreate = searchContent.trim() === ''
    blocks.push({ filePath, searchContent, replaceContent, isCreate })
  }

  return blocks.length > 0 ? blocks : null
}

/**
 * 模糊搜尋：壓縮空白後匹配，容忍 LLM 微調縮排
 * 回傳原始字串中的 { start, end } 位置
 */
export function fuzzySearch(haystack: string, needle: string): { start: number; end: number } | null {
  if (!needle.trim()) return null

  const needleLines = needle.split('\n').filter(l => l.trim())
  if (needleLines.length === 0) return null

  const firstLine = needleLines[0].trim()
  const lastLine = needleLines[needleLines.length - 1].trim()

  // 在 haystack 中找 firstLine
  const haystackLines = haystack.split('\n')
  let startLineIdx = -1
  for (let i = 0; i < haystackLines.length; i++) {
    if (haystackLines[i].trim() === firstLine) {
      startLineIdx = i
      break
    }
  }
  if (startLineIdx === -1) return null

  // 從 startLineIdx 往下找 lastLine
  let endLineIdx = -1
  for (let i = startLineIdx + needleLines.length - 1; i < Math.min(startLineIdx + needleLines.length + 5, haystackLines.length); i++) {
    if (haystackLines[i].trim() === lastLine) {
      endLineIdx = i
      break
    }
  }
  if (endLineIdx === -1) return null

  // 驗證中間行數大致匹配（允許 ±2 行差異）
  const matchedLineCount = endLineIdx - startLineIdx + 1
  if (Math.abs(matchedLineCount - needleLines.length) > 2) return null

  // 計算原始字串中的 char offset
  let start = 0
  for (let i = 0; i < startLineIdx; i++) {
    start += haystackLines[i].length + 1 // +1 for \n
  }
  let end = start
  for (let i = startLineIdx; i <= endLineIdx; i++) {
    end += haystackLines[i].length + (i < endLineIdx ? 1 : 0)
  }

  return { start, end }
}

/**
 * 將 search/replace blocks 應用到 CodeBundle
 * 精確匹配 → fuzzy 匹配 → 標記失敗
 */
export function applySearchReplace(baseCode: CodeBundle, blocks: SearchReplaceBlock[]): ApplyResult {
  // 建立 path → content 映射
  const fileMap = new Map<string, string>()
  for (const p of baseCode.pages) fileMap.set(p.path, p.content)
  for (const c of baseCode.components) fileMap.set(c.path, c.content)
  if (baseCode.styles) fileMap.set('globals.css', baseCode.styles)

  const failedBlocks: SearchReplaceBlock[] = []
  let appliedCount = 0

  for (const block of blocks) {
    if (block.isCreate) {
      fileMap.set(block.filePath, block.replaceContent)
      appliedCount++
      continue
    }

    const currentContent = fileMap.get(block.filePath)
    if (!currentContent) {
      failedBlocks.push(block)
      continue
    }

    const searchNormalized = block.searchContent.trimEnd()

    // 1. 精確匹配
    const idx = currentContent.indexOf(searchNormalized)
    if (idx !== -1) {
      // 確認唯一性
      const secondIdx = currentContent.indexOf(searchNormalized, idx + searchNormalized.length)
      if (secondIdx !== -1) {
        // 多處匹配 → 標記失敗
        failedBlocks.push(block)
        continue
      }
      const before = currentContent.slice(0, idx)
      const after = currentContent.slice(idx + searchNormalized.length)
      fileMap.set(block.filePath, before + block.replaceContent.trimEnd() + after)
      appliedCount++
      continue
    }

    // 2. Fuzzy 匹配（壓縮空白）
    const fuzzyResult = fuzzySearch(currentContent, searchNormalized)
    if (fuzzyResult) {
      const before = currentContent.slice(0, fuzzyResult.start)
      const after = currentContent.slice(fuzzyResult.end)
      fileMap.set(block.filePath, before + block.replaceContent.trimEnd() + after)
      appliedCount++
      continue
    }

    // 3. 匹配失敗
    failedBlocks.push(block)
  }

  // 重建 CodeBundle
  const updatedPages = baseCode.pages.map(p => ({
    ...p,
    content: fileMap.get(p.path) ?? p.content,
  }))
  const updatedComponents = baseCode.components.map(c => ({
    ...c,
    content: fileMap.get(c.path) ?? c.content,
  }))

  // 處理 CREATE 的新檔案（不在 baseCode 中的）
  for (const block of blocks) {
    if (!block.isCreate) continue
    const path = block.filePath
    const alreadyInPages = updatedPages.some(p => p.path === path)
    const alreadyInComponents = updatedComponents.some(c => c.path === path)
    if (alreadyInPages || alreadyInComponents) continue

    const newFile: GeneratedComponent = {
      path,
      content: block.replaceContent,
      description: path.includes('/page.tsx') || path.includes('/page.ts')
        ? `頁面: ${path.split('/').slice(-2, -1)[0]}`
        : `組件: ${path.split('/').pop()?.replace(/\.tsx?$/, '') || path}`,
    }

    if (path.includes('/page.tsx') || path.includes('/page.ts')) {
      updatedPages.push(newFile)
    } else {
      updatedComponents.push(newFile)
    }
  }

  return {
    success: failedBlocks.length === 0,
    updatedCode: {
      pages: updatedPages,
      components: updatedComponents,
      styles: fileMap.get('globals.css') ?? baseCode.styles,
    },
    failedBlocks,
    appliedCount,
  }
}

function buildCodeManifest(code: CodeBundle): string {
  const pageList = code.pages.map(page => `- page: ${page.path}`).join('\n')
  const componentList = code.components.map(component => `- component: ${component.path}`).join('\n')
  return [pageList, componentList].filter(Boolean).join('\n')
}

function selectAnimationTargets(code: CodeBundle, profile: GenerationProfile): CodeBundle {
  const selectedPages = code.pages.filter(page => {
    const content = page.content
    const shouldInclude =
      content.includes('data-animate') ||
      /<button|<form|onClick=|onSubmit=|hover:|dialog|Modal|AlertDialog/.test(content)
    return shouldInclude
  })

  if (profile === 'quality' && selectedPages.length === 0) {
    return code
  }

  const selectedComponents = code.components.filter(component => {
    const content = component.content
    return content.includes('data-animate') ||
      /<button|<form|onClick=|onSubmit=|hover:|dialog|Modal|AlertDialog/.test(content)
  })

  return {
    pages: selectedPages,
    components: selectedComponents,
    styles: code.styles,
  }
}

function selectRwdTargets(code: CodeBundle, profile: GenerationProfile): CodeBundle {
  const selectedPages = code.pages.filter(page =>
    /grid-|flex|table|header|nav|sidebar|form|overflow-x|w-\[|max-w-|px-|py-/.test(page.content)
  )
  const selectedComponents = code.components.filter(component =>
    /grid-|flex|table|header|nav|sidebar|form|overflow-x|w-\[|max-w-|px-|py-/.test(component.content)
  )

  if (profile === 'quality' && selectedPages.length === 0 && selectedComponents.length === 0) {
    return code
  }

  return {
    pages: selectedPages,
    components: selectedComponents,
    styles: code.styles,
  }
}

function shouldSkipAnimationStage(code: CodeBundle, profile: GenerationProfile): boolean {
  if (profile === 'quality') return false
  return ![...code.pages, ...code.components].some(file => file.content.includes('data-animate'))
}

function shouldSkipRwdStage(code: CodeBundle, profile: GenerationProfile): boolean {
  const responsiveCount = countResponsiveClassesInBundle(code)
  if (profile === 'quality') return responsiveCount >= 12
  return responsiveCount >= 8
}

function estimateStructureBatchWeight(
  page: string,
  contextChars: number,
  profile: GenerationProfile
): number {
  const normalizedPage = page.toLowerCase()
  let weight = Math.ceil(contextChars / 16)
  weight += Math.max(600, page.length * 60)
  if (/(home|首頁|dashboard|主頁)/i.test(normalizedPage)) weight += 500
  if (profile === 'quality') weight += 250
  if (profile === 'fast') weight -= 100
  return weight
}

export function buildAdaptiveStructureBatches(
  pages: string[],
  options?: {
    contextChars?: number
    profile?: GenerationProfile
    maxEstimatedTokens?: number
  }
): string[][] {
  if (pages.length <= 2) return [pages]

  const profile = options?.profile || 'balanced'
  const contextChars = options?.contextChars || 0
  const maxEstimatedTokens = options?.maxEstimatedTokens || (profile === 'quality' ? 14000 : profile === 'fast' ? 9000 : 11000)

  const batches: string[][] = []
  let currentBatch: string[] = []
  let currentWeight = 0

  for (const page of pages) {
    const pageWeight = estimateStructureBatchWeight(page, contextChars, profile)
    if (currentBatch.length > 0 && currentWeight + pageWeight > maxEstimatedTokens) {
      batches.push(currentBatch)
      currentBatch = [page]
      currentWeight = pageWeight
      continue
    }
    currentBatch.push(page)
    currentWeight += pageWeight
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch)
  }

  return batches
}

/**
 * Safety net: 如果代碼沒有 Tailwind 響應式前綴，自動注入基本 Mobile-first 模式
 * 只在代碼完全沒有 sm:/md:/lg: 時觸發（避免干擾已有 RWD 的代碼）
 */
export function ensureResponsiveClasses(
  pages: GeneratedComponent[],
  components: GeneratedComponent[]
): { pages: GeneratedComponent[]; components: GeneratedComponent[] } {
  const allContent = [...pages, ...components].map(c => c.content).join('\n')
  const responsiveCount = (allContent.match(/\b(sm|md|lg|xl):/g) || []).length
  if (responsiveCount >= 3) return { pages, components }

  logger.info('No responsive classes detected, injecting basic responsive patterns')

  const transform = (content: string): string => {
    // Grid columns — mobile-first: 1 col → md breakpoint
    content = content.replace(/(?<!:)\bgrid-cols-(\d+)\b/g, (_match, n) => {
      const num = parseInt(n)
      if (num <= 1) return _match
      if (num <= 3) return `grid-cols-1 md:grid-cols-${n}`
      return `grid-cols-1 sm:grid-cols-2 md:grid-cols-${n}`
    })

    // Text sizes (combined single-pass to avoid double-replacement)
    content = content.replace(/(?<!:)\btext-(2xl|3xl|4xl|5xl)\b/g, (_match, size) => {
      const map: Record<string, string> = {
        '2xl': 'text-lg md:text-2xl',
        '3xl': 'text-xl md:text-3xl',
        '4xl': 'text-2xl md:text-4xl',
        '5xl': 'text-3xl md:text-5xl',
      }
      return map[size] || _match
    })

    // Gap
    content = content.replace(/(?<!:)\bgap-(6|8)\b/g, (_match, n) => {
      const map: Record<string, string> = { '6': 'gap-3 md:gap-6', '8': 'gap-4 md:gap-8' }
      return map[n] || _match
    })

    // Horizontal padding
    content = content.replace(/(?<!:)\bpx-(6|8)\b/g, (_match, n) => {
      const map: Record<string, string> = { '6': 'px-4 md:px-6', '8': 'px-4 md:px-8' }
      return map[n] || _match
    })

    // Vertical padding
    content = content.replace(/(?<!:)\bpy-(8|10|12)\b/g, (_match, n) => {
      const map: Record<string, string> = { '8': 'py-4 md:py-8', '10': 'py-6 md:py-10', '12': 'py-6 md:py-12' }
      return map[n] || _match
    })

    return content
  }

  return {
    pages: pages.map(p => ({ ...p, content: transform(p.content) })),
    components: components.map(c => ({ ...c, content: transform(c.content) })),
  }
}

// ============================================================
// 組件引用驗證 + LLM 自修復（Layer 1 防禦）
// ============================================================

interface MissingReference {
  file: string
  importPath: string
  resolvedPath: string
}

/**
 * 驗證所有 pages/components 的 import 引用是否有對應檔案
 * 純函數，零 LLM 成本
 */
function validateComponentReferences(
  pages: GeneratedComponent[],
  components: GeneratedComponent[]
): MissingReference[] {
  // 構建已知路徑集合
  const knownPaths = new Set<string>()
  for (const f of [...pages, ...components]) {
    knownPaths.add(f.path)
    knownPaths.add(f.path.replace(/\.(tsx?|jsx?)$/, ''))
    // index 解析
    const dir = f.path.replace(/\/[^/]+$/, '')
    if (f.path.endsWith('/index.tsx') || f.path.endsWith('/index.ts')) {
      knownPaths.add(dir)
    }
  }

  const missing: MissingReference[] = []
  const seenResolved = new Set<string>()
  const importRegex = /from\s+['"](@\/[^'"]+|\.\.?\/[^'"]+)['"]/g

  for (const file of [...pages, ...components]) {
    importRegex.lastIndex = 0
    let m
    while ((m = importRegex.exec(file.content)) !== null) {
      const importPath = m[1]
      let resolved: string

      if (importPath.startsWith('@/')) {
        resolved = importPath.slice(2)
      } else {
        const fileDir = file.path.replace(/\/[^/]+$/, '') || '.'
        resolved = importPath.startsWith('./')
          ? fileDir + '/' + importPath.slice(2)
          : fileDir + '/' + importPath
      }

      const candidates = [
        resolved, resolved + '.tsx', resolved + '.ts', resolved + '.jsx', resolved + '.js',
        resolved + '/index.tsx', resolved + '/index.ts',
      ]

      if (!candidates.some(c => knownPaths.has(c)) && !seenResolved.has(resolved)) {
        seenResolved.add(resolved)
        missing.push({ file: file.path, importPath, resolvedPath: resolved })
      }
    }
  }

  return missing
}

/**
 * 用 LLM 修復缺失的組件引用
 * 收集引用上下文，讓 LLM 生成缺失的組件
 */
async function repairMissingComponents(
  missingRefs: MissingReference[],
  pages: GeneratedComponent[],
  components: GeneratedComponent[],
  trackingContext?: LlmTrackingContext,
  heartbeatFn?: () => void,
): Promise<GeneratedComponent[]> {
  if (missingRefs.length === 0) return []

  // 收集引用上下文（哪個檔案引用、import 語句、使用處）
  const allFiles = [...pages, ...components]
  const contextLines: string[] = []

  for (const ref of missingRefs) {
    contextLines.push(`\n### 缺失模組: ${ref.importPath}（需要生成: ${ref.resolvedPath}）`)
    contextLines.push(`被引用於: ${ref.file}`)

    // 找到引用此 import 的檔案，提取相關的使用行
    for (const f of allFiles) {
      if (!f.content.includes(ref.importPath)) continue

      // 提取 import 語句
      const importLine = f.content.split('\n').find(l => l.includes(ref.importPath))
      if (importLine) contextLines.push(`import 語句: ${importLine.trim()}`)

      // 提取使用處（JSX 或函式調用）— 取前後 2 行作為上下文
      const lines = f.content.split('\n')
      // 從 importPath 推斷被引用的名稱
      const nameMatch = importLine?.match(/import\s+(?:(\w+)|.*?\{([^}]+)\})/)
      const names = nameMatch
        ? (nameMatch[1] ? [nameMatch[1]] : (nameMatch[2] || '').split(',').map(s => s.split(/\s+as\s+/).pop()?.trim()).filter(Boolean))
        : []

      for (const name of names) {
        if (!name) continue
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(name) && !lines[i].includes('import')) {
            const start = Math.max(0, i - 1)
            const end = Math.min(lines.length, i + 2)
            contextLines.push(`使用處 (${f.path}:${i + 1}):`)
            contextLines.push(lines.slice(start, end).map(l => `  ${l}`).join('\n'))
            break // 每個名稱只取第一個使用處
          }
        }
      }
    }
  }

  const prompt = `你是 Next.js 組件生成專家。以下代碼引用了一些不存在的內部模組，請生成這些缺失的組件/工具。

## 缺失的模組和引用上下文
${contextLines.join('\n')}

## 規則
1. 根據 import 語句的名稱和使用方式推斷組件的功能和介面
2. export 方式必須與 import 語句一致（named export 或 default export）
3. 使用 'use client' 如果組件包含 hooks 或事件處理
4. 動畫庫用 motion/react（不是 framer-motion）
5. 路徑別名用 @/
6. 組件要有合理的 UI 實作，不要只是空殼
7. 使用 Tailwind CSS 樣式

## 輸出格式
每個檔案用 code block 格式，路徑對應缺失的 resolvedPath：
\`\`\`tsx:path/to/component.tsx
// 內容
\`\`\`
或
\`\`\`ts:path/to/util.ts
// 內容
\`\`\`

⚠️ code fence 規則：每個 code block 的第一行必須直接是代碼，禁止在代碼前加任何說明文字。

請生成所有缺失的檔案。`

  const response = await callClaude(
    '你是 Next.js 組件生成專家，專門修復缺失的組件引用。',
    [{ role: 'user', content: prompt }],
    { maxTokens: 8192, temperature: 0.1, maxContinuations: 0, heartbeatFn }, // 禁止自動續寫：修復少量缺失組件不應需要 >8192 tokens
    { ...trackingContext, purpose: 'repair_missing_components' }
  )

  if (!response.success || !response.content) {
    logger.warn({ error: response.error }, 'repairMissingComponents LLM 呼叫失敗')
    return []
  }

  // 解析生成的檔案
  const result: GeneratedComponent[] = []
  const fileRegex = /`{3,}(?:tsx|ts|jsx|js):([^\n]+)\n([\s\S]*?)`{3,}/g
  let match
  while ((match = fileRegex.exec(response.content)) !== null) {
    const filePath = match[1].trim()
    const fileContent = match[2].trim()
    result.push({
      path: filePath,
      content: fileContent,
      description: `Auto-repaired missing component: ${filePath}`,
    })
  }

  return result
}

/**
 * 取得 TSX/TS 檔案的語法錯誤清單（使用 TypeScript 內建 parser，零 LLM）
 */

/**
 * 偵測 `const x = dict[key]` 模式（bracket lookup 可能回傳 undefined），
 * 將後續 `x.prop` 轉成 `x?.prop`，防止 "Cannot read properties of undefined" 崩潰
 */
export function repairBracketLookupAccess(
  file: GeneratedComponent
): { content: string; repaired: boolean } {
  if (!/\.(tsx?|jsx?)$/.test(file.path)) return { content: file.content, repaired: false }

  // 找出可能為 undefined 的變數（兩種來源）
  type VarInfo = { name: string; source: 'bracket' | 'optchain' }
  const potentiallyUndefined: VarInfo[] = []
  const lines = file.content.split('\n')
  for (const line of lines) {
    // 模式 1：bracket lookup → const config = CONFIGS[type]（跳過已有 ?? 的行）
    if (!line.includes('??') && !line.includes('||')) {
      const m1 = line.match(/^\s*(?:const|let)\s+(\w+)\s*=\s*\w+\[[^\]]+\]\s*(?:\/\/.*)?$/)
      if (m1) potentiallyUndefined.push({ name: m1[1], source: 'bracket' })
    }
    // 模式 2：optional chain 賦值 → const colors = config?.colors 或已加 ?? [] 的版本
    // 不跳過有 ?? 的行（需要檢查是否有 guard）
    const m2 = line.match(/^\s*(?:const|let)\s+(\w+)\s*=\s*\S+\?\.\w+/)
    if (m2) potentiallyUndefined.push({ name: m2[1], source: 'optchain' })
  }
  if (potentiallyUndefined.length === 0) return { content: file.content, repaired: false }

  let fixed = file.content
  const repairedVars: string[] = []

  for (const { name: varName, source } of potentiallyUndefined) {
    let changed = false

    // optional chain 賦值：加 ?? [] fallback + early return guard
    if (source === 'optchain') {
      const fixedLines = fixed.split('\n')
      for (let li = 0; li < fixedLines.length; li++) {
        // 匹配兩種情況：還沒加 ?? [] 的，和已有 ?? [] 但缺 guard 的
        const lineMatch = fixedLines[li].match(new RegExp(`^(\\s*)(?:const|let)\\s+${varName}\\s*=\\s*\\S+\\?\\.\\w+(.*)$`))
        if (!lineMatch) continue

        const indent = lineMatch[1]
        const tail = lineMatch[2].trim()

        // 1. 還沒有 ?? fallback → 加上
        if (!tail.includes('??')) {
          fixedLines[li] = fixedLines[li].trimEnd() + ' ?? []'
        }

        // 2. 下一行不是 guard → 插入
        const nextLine = fixedLines[li + 1]?.trim() ?? ''
        if (!nextLine.startsWith(`if (!${varName}`)) {
          fixedLines.splice(li + 1, 0, `${indent}if (!${varName}.length) return`)
          changed = true
        } else if (!tail.includes('??')) {
          changed = true // 只加了 ?? []
        }
        break
      }
      fixed = fixedLines.join('\n')
    }

    // 修復 1：varName.prop（未加 ?.）→ varName?.prop
    const dotRegex = new RegExp(`(?<![?])\\b${varName}\\.(?![?])`, 'g')
    const afterDot = fixed.replace(dotRegex, `${varName}?.`)
    if (afterDot !== fixed) { fixed = afterDot; changed = true }

    // 修復 2：varName[expr]（未加 ?.）→ varName?.[expr]（排除宣告 varName 自己的那行）
    const bracketRegex = new RegExp(`(?<!\\?)\\b${varName}\\[(?!\\s*$)`, 'g')
    const afterBracket = fixed.replace(bracketRegex, (match, offset) => {
      const lineStart = fixed.lastIndexOf('\n', offset) + 1
      const lineText = fixed.slice(lineStart, offset + match.length)
      const declPattern = new RegExp(`(?:const|let)\\s+${varName}\\s*=`)
      if (declPattern.test(lineText)) return match
      return `${varName}?.[`
    })
    if (afterBracket !== fixed) { fixed = afterBracket; changed = true }

    if (changed) repairedVars.push(varName)
  }

  if (repairedVars.length === 0) return { content: file.content, repaired: false }
  logger.warn({ path: file.path, vars: repairedVars }, 'repairBracketLookupAccess: 補 optional chaining')
  return { content: fixed, repaired: true }
}

// React-only hooks，不應出現在 motion/react import 中
const REACT_ONLY_HOOKS_SET = new Set([
  'useState', 'useEffect', 'useRef', 'useCallback', 'useMemo',
  'useContext', 'useReducer', 'useLayoutEffect', 'useId',
  'useImperativeHandle', 'useDeferredValue', 'useTransition',
])

/**
 * 修復 React hooks 被誤從 motion/react import 的問題
 * 修復 `(0 , _react.useState) is not a function` 錯誤
 *
 * 原因：LLM 生成代碼時看到 `motion/react` 就把 useState 也一起放進去
 * import { useState } from 'motion/react'  ← 錯誤，motion/react 不導出 React hooks
 * → 把 React hooks 移到正確的 `react` import
 */
export function repairMotionReactHookImports(
  file: GeneratedComponent
): { content: string; repaired: boolean } {
  if (!/\.(tsx?|jsx?)$/.test(file.path)) return { content: file.content, repaired: false }

  // 找到所有 motion/react import 行（可能有多行）
  const motionImportRegex = /^import\s+\{([^}]+)\}\s*from\s+['"]motion\/react['"]\s*;?\s*$/gm
  let fixed = file.content
  const migratedHooks: string[] = []

  // 收集需要從 motion/react 移走的 React hooks
  for (const match of [...fixed.matchAll(motionImportRegex)]) {
    const names = match[1].split(',').map(s => s.trim()).filter(Boolean)
    const reactHooks = names.filter(n => REACT_ONLY_HOOKS_SET.has(n))
    if (reactHooks.length === 0) continue

    migratedHooks.push(...reactHooks)
    const remaining = names.filter(n => !REACT_ONLY_HOOKS_SET.has(n))

    if (remaining.length > 0) {
      fixed = fixed.replace(match[0], `import { ${remaining.join(', ')} } from 'motion/react'`)
    } else {
      // 整行都是 React hooks，直接刪掉這行
      fixed = fixed.replace(match[0] + '\n', '').replace(match[0], '')
    }
  }

  if (migratedHooks.length === 0) return { content: file.content, repaired: false }

  // 把 hooks 加進 react import（或新增一行）
  const reactImportRegex = /^(import\s+(?:React\s*,?\s*)?(?:\{([^}]*)\})?\s*from\s+['"]react['"]\s*;?)$/m
  const reactMatch = fixed.match(reactImportRegex)

  if (reactMatch) {
    const existing = reactMatch[2]
      ? reactMatch[2].split(',').map(s => s.trim()).filter(Boolean)
      : []
    const merged = [...new Set([...existing, ...migratedHooks])].sort()
    const hasDefault = /import\s+React\s*,/.test(reactMatch[0]) || /import\s+React\s+from/.test(reactMatch[0])
    const newImport = hasDefault
      ? `import React, { ${merged.join(', ')} } from 'react'`
      : `import { ${merged.join(', ')} } from 'react'`
    fixed = fixed.replace(reactMatch[0], newImport)
  } else {
    const useClientMatch = fixed.match(/^['"]use client['"]\s*\n/)
    const insertAfter = useClientMatch ? useClientMatch[0].length : 0
    const newImport = `import { ${[...new Set(migratedHooks)].sort().join(', ')} } from 'react'\n`
    fixed = fixed.slice(0, insertAfter) + newImport + fixed.slice(insertAfter)
  }

  logger.warn({ path: file.path, hooks: migratedHooks }, 'repairMotionReactHookImports: 修正 motion/react 誤導入 React hooks')
  return { content: fixed, repaired: true }
}

/**
 * 偵測並修復 null/undefined 值被數字索引存取的問題
 * 修復 `Cannot read properties of null (reading '0')` 錯誤
 *
 * 處理兩種模式：
 * 1. .match(...)[n]   → .match(...)?.[n]   （match 無匹配回傳 null）
 * 2. varName[n]（varName 來自 bracket lookup）→ varName?.[n]
 */
export function repairNullIndexAccess(
  file: GeneratedComponent
): { content: string; repaired: boolean } {
  if (!/\.(tsx?|jsx?)$/.test(file.path)) return { content: file.content, repaired: false }

  let fixed = file.content
  const repairs: string[] = []

  // 模式 1：.match(...)[n] 或 .exec(...)[n] → ?.[ n ]
  // 排除已有 ?. 的情況
  const matchIndexRegex = /\.(match|exec)\(([^)]*)\)\[(\d+)\]/g
  const fixedMatch = fixed.replace(matchIndexRegex, (full, method, args, idx) => {
    repairs.push(`${method}()[${idx}]`)
    return `.${method}(${args})?.[${idx}]`
  })
  if (fixedMatch !== fixed) fixed = fixedMatch

  // 模式 2：來自 bracket lookup 的變數用數字索引（排除宣告行本身）
  const potentiallyNull = new Set<string>()
  for (const line of fixed.split('\n')) {
    const m = line.match(/^\s*(?:const|let)\s+(\w+)\s*=\s*\w+\[[^\]]+\]\s*(?:\/\/.*)?$/)
    if (m && !line.includes('??')) potentiallyNull.add(m[1])
  }

  for (const varName of potentiallyNull) {
    // varName[digit]（未加 ?.）→ varName?.[digit]
    // lookbehind 排除 ?.[ 已修復的情況，lookahead 排除賦值左側
    const regex = new RegExp(`(?<!\\?)\\b${varName}\\[(\\d+)\\](?!\\s*=)`, 'g')
    const next = fixed.replace(regex, (_, idx) => {
      repairs.push(`${varName}[${idx}]`)
      return `${varName}?.[${idx}]`
    })
    if (next !== fixed) fixed = next
  }

  if (repairs.length === 0) return { content: file.content, repaired: false }
  logger.warn({ path: file.path, repairs }, 'repairNullIndexAccess: 補 null index optional chaining')
  return { content: fixed, repaired: true }
}

/**
 * 修復可選鏈左側賦值（n?.x += value → SWC/TS 編譯錯誤）
 * LLM 常在 canvas 動畫、物理模擬等代碼中產生此模式
 * 例：n?.x += n?.vx → n.x += n.vx（forEach callback 中 n 必定非 null）
 */
export function repairOptionalChainAssignment(
  file: GeneratedComponent
): { content: string; repaired: boolean } {
  if (!/\.(tsx?|jsx?)$/.test(file.path)) return { content: file.content, repaired: false }

  // 匹配左側可選鏈賦值：identifier?.prop <assign-op> value
  // 包含 +=, -=, *=, /=, %=, = (但排除 == 和 ===)
  const pattern = /(\b\w+)\?\.([\w]+)\s*([+\-*/%]?=)(?!=)/g
  let fixed = file.content
  let count = 0

  fixed = fixed.replace(pattern, (match, obj, prop, op) => {
    count++
    return `${obj}.${prop} ${op}`
  })

  if (count === 0) return { content: file.content, repaired: false }
  logger.warn({ path: file.path, count }, 'repairOptionalChainAssignment: 修復可選鏈左側賦值')
  return { content: fixed, repaired: true }
}

const REACT_HOOKS = [
  'useState', 'useEffect', 'useRef', 'useCallback', 'useMemo',
  'useContext', 'useReducer', 'useLayoutEffect', 'useId',
  'useImperativeHandle', 'useDeferredValue', 'useTransition',
] as const

/**
 * 偵測並自動修復 TSX 中缺少的 React hooks import
 * 根本性修復 `(0 , _react.useState) is not a function` 錯誤
 */
export function repairMissingReactImports(
  file: GeneratedComponent
): { content: string; repaired: boolean } {
  if (!/\.(tsx?|jsx?)$/.test(file.path)) return { content: file.content, repaired: false }

  const content = file.content

  // 排除 import 行後，偵測實際使用的 hooks
  const contentWithoutImports = content.replace(/^import\s+.+from\s+['"].+['"]\s*;?\s*$/gm, '')
  const usedHooks = REACT_HOOKS.filter(h => new RegExp(`\\b${h}\\s*[(<]`).test(contentWithoutImports))
  if (usedHooks.length === 0) return { content, repaired: false }

  // 找現有的 react import 行
  const reactImportRegex = /^(import\s+(?:React\s*,?\s*)?(?:\{([^}]*)\})?\s*from\s+['"]react['"];?)$/m
  const match = content.match(reactImportRegex)

  const alreadyImported = match?.[2]
    ? match[2].split(',').map(s => s.trim()).filter(Boolean)
    : []
  const missing = usedHooks.filter(h => !alreadyImported.includes(h))
  if (missing.length === 0) return { content, repaired: false }

  let fixed: string
  if (match) {
    const allNamed = [...new Set([...alreadyImported, ...missing])].sort()
    const hasDefault = /import\s+React\s*,/.test(match[0]) || /import\s+React\s+from/.test(match[0])
    const newImport = hasDefault
      ? `import React, { ${allNamed.join(', ')} } from 'react'`
      : `import { ${allNamed.join(', ')} } from 'react'`
    fixed = content.replace(match[0], newImport)
  } else {
    const useClientMatch = content.match(/^['"]use client['"]\s*\n/)
    const insertAfter = useClientMatch ? useClientMatch[0].length : 0
    const newImport = `import { ${missing.join(', ')} } from 'react'\n`
    fixed = content.slice(0, insertAfter) + newImport + content.slice(insertAfter)
  }

  logger.warn({ path: file.path, missing }, 'repairMissingReactImports: 補缺失 React hooks import')
  return { content: fixed, repaired: true }
}

/**
 * 偵測並自動修復 TSX 中未宣告的 useRef 變數（語意層錯誤，ts.transpileModule 抓不到）
 * 規則：如果 xyzRef.current 被使用，但 component body 內找不到對應的 useRef 宣告，
 * 自動在第一個 return/useEffect/useCallback/canvas 相關行前插入宣告。
 */
export function repairUndeclaredRefs(file: GeneratedComponent): { content: string; repaired: boolean } {
  const content = file.content
  // React hook 函數名不是 ref 變數，必須排除（useRef 是函數呼叫，不是變數引用）
  const REACT_HOOK_NAMES = new Set(['useRef', 'useImperativeHandle', 'createRef', 'forwardRef'])
  // 找出所有 xyzRef 用法：.current、ref={xyzRef}、xyzRef.anyProp、作為參數傳遞
  const usedRefs = new Set<string>()
  // Pattern 1: xyzRef.current / xyzRef.x / xyzRef.anyProp
  for (const m of content.matchAll(/\b(\w+Ref)\.\w+/g)) {
    if (!REACT_HOOK_NAMES.has(m[1])) usedRefs.add(m[1])
  }
  // Pattern 2: ref={xyzRef} / ref = {xyzRef}
  for (const m of content.matchAll(/ref\s*=\s*\{?\s*(\w+Ref)\b/g)) {
    if (!REACT_HOOK_NAMES.has(m[1])) usedRefs.add(m[1])
  }
  if (usedRefs.size === 0) return { content, repaired: false }

  // 找出已宣告的 useRef（const xyzRef = useRef...）
  const declaredRefs = new Set<string>()
  for (const m of content.matchAll(/\bconst\s+(\w+Ref)\s*=/g)) {
    declaredRefs.add(m[1])
  }

  const missing = [...usedRefs].filter(r => !declaredRefs.has(r))
  if (missing.length === 0) return { content, repaired: false }

  // 推斷合理的初始值：mouseRef → {x,y}；nodesRef/itemsRef → []；其餘 → null
  const inferInitial = (name: string): string => {
    if (/mouse/i.test(name)) return 'useRef<{ x: number; y: number }>({ x: 0, y: 0 })'
    if (/nodes|items|list|data/i.test(name)) return 'useRef<unknown[]>([])'
    if (/canvas|ctx|container|wrapper/i.test(name)) return 'useRef<HTMLElement | null>(null)'
    return 'useRef(null)'
  }

  const declarations = missing.map(r => `  const ${r} = ${inferInitial(r)}`).join('\n')

  // 插入位置：第一個 useEffect/useCallback/canvas 相關行前，或 return 語句前
  const insertPattern = /^(\s*(?:useEffect|useCallback|useRef|const\s+\w+\s*=\s*useRef|return\s*[(<]))/m
  const insertIdx = content.search(insertPattern)
  let fixed: string
  if (insertIdx >= 0) {
    fixed = content.slice(0, insertIdx) + declarations + '\n' + content.slice(insertIdx)
  } else {
    // fallback：在函式最後一個 hook 宣告後
    fixed = content + '\n' + declarations
  }

  logger.warn({ path: file.path, missing }, 'repairUndeclaredRefs: 自動補宣告缺失的 useRef')
  return { content: fixed, repaired: true }
}

/**
 * 偵測並修復「變數名 shadow React hook」的致命錯誤
 * 例：const useRef = useRef(null) → TDZ 導致 Cannot access 'useRef' before initialization
 * 多個 shadow 時用計數器產生唯一名稱（ref1, ref2, ...）
 */
export function repairHookShadowing(file: GeneratedComponent): { content: string; repaired: boolean } {
  const HOOK_BASE_NAMES: Record<string, string> = {
    useRef: 'ref', useState: 'state', useEffect: 'effect',
    useCallback: 'cb', useMemo: 'memo', useContext: 'ctx',
    useReducer: 'reducer', useLayoutEffect: 'layoutEffect',
    useId: 'id', useTransition: 'transition',
  }
  let content = file.content
  let repaired = false

  for (const [hook, baseName] of Object.entries(HOOK_BASE_NAMES)) {
    const testPattern = new RegExp(`(?:const|let)\\s+${hook}\\s*=\\s*${hook}\\s*(?:<[^>]*>)?\\s*\\(`)
    if (!testPattern.test(content)) continue

    // 收集檔案中已存在的變數名，避免命名衝突
    const existingNames = new Set<string>()
    for (const m of content.matchAll(/(?:const|let|var)\s+(\w+)\s*=/g)) {
      existingNames.add(m[1])
    }

    let counter = 0
    content = content.replace(
      new RegExp(`((?:const|let)\\s+)${hook}(\\s*=\\s*${hook}\\s*(?:<[^>]*>)?\\s*\\()`, 'g'),
      (_match, prefix, rest) => {
        counter++
        // 產生不衝突的唯一名稱
        let name: string
        do {
          name = counter === 1 ? `${baseName}${counter}` : `${baseName}${counter}`
          counter++
        } while (existingNames.has(name))
        counter-- // 回退多加的 1
        existingNames.add(name)
        return `${prefix}${name}${rest}`
      }
    )

    if (counter > 0) {
      logger.warn({ path: file.path, hook, count: counter }, 'repairHookShadowing: 修復 hook 名稱 shadow')
      repaired = true
    }
  }

  return { content, repaired }
}

export function getSyntaxErrors(filename: string, content: string): string[] {
  if (content.length < 50) return []
  // 只檢查 TS/TSX 檔案，CSS/JSON 等非 TS 檔案跳過
  if (/\.(css|json|md|html|svg)$/i.test(filename)) return []
  const tsxName = filename.endsWith('.tsx') || filename.endsWith('.ts') ? filename : filename + '.tsx'
  const result = ts.transpileModule(content, {
    compilerOptions: {
      jsx: ts.JsxEmit.Preserve,
      target: ts.ScriptTarget.Latest,
    },
    fileName: tsxName,
    reportDiagnostics: true,
  })
  const errors: string[] = []
  if (result.diagnostics?.length) {
    errors.push(...result.diagnostics.map(d => {
      const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n')
      if (d.file && d.start !== undefined) {
        const pos = d.file.getLineAndCharacterOfPosition(d.start)
        return `Line ${pos.line + 1}:${pos.character + 1} — ${msg}`
      }
      return msg
    }))
  }

  // 補充 heuristic：捕捉 transpileModule 漏掉的截斷/結構問題
  if (tsxName.endsWith('.tsx') && errors.length === 0) {
    const openBraces = (content.match(/\{/g) || []).length
    const closeBraces = (content.match(/\}/g) || []).length
    if (Math.abs(openBraces - closeBraces) > 2) {
      errors.push(`Unbalanced braces: ${openBraces} open vs ${closeBraces} close`)
    }
    const hasExport = /export\s+(default|function|const|class)\b/.test(content)
    if (!hasExport && content.length > 100) {
      errors.push('Missing export statement in component file')
    }
  }

  return errors
}

/**
 * 語法錯誤自動修復（parseGeneratedFiles 後立即執行，最多 1 次 LLM 修復）
 */
/**
 * 偵測檔案是否為 LLM 截斷型破損（非一般語法錯誤）
 * 截斷特徵：錯誤在前 5 行 OR 末行不以合法結尾符號收尾
 */
function isTruncatedFile(content: string, errors: string[]): boolean {
  // 錯誤在前 5 行（截斷在開頭 → generation 從未正確展開）
  const earlyError = errors.some(e => {
    const m = e.match(/Line (\d+)/)
    if (!m) return false
    return parseInt(m[1], 10) <= 5
  })
  if (earlyError) return true
  // 末行不以合法語句結尾 → 截斷在尾部
  const nonEmptyLines = content.split('\n').filter(l => l.trim())
  if (nonEmptyLines.length === 0) return false
  const lastLine = nonEmptyLines[nonEmptyLines.length - 1].trim()
  return !/[}\);'">\]`]$/.test(lastLine)
}

async function checkAndFixSyntaxErrors(
  files: GeneratedComponent[],
  trackingContext?: LlmTrackingContext,
  heartbeatFn?: () => void,
  pagePathsToPreserve?: Set<string>,
): Promise<GeneratedComponent[]> {
  // 最優先：修復 hook 名稱 shadow（const useRef = useRef(null) → TDZ 致命錯誤）
  const withHookFixed = files.map(f => {
    const { content, repaired } = repairHookShadowing(f)
    return repaired ? { ...f, content } : f
  })
  // 先修復 motion/react 誤導入 React hooks（必須在 repairMissingReactImports 之前）
  const withMotionFixed = withHookFixed.map(f => {
    const { content, repaired } = repairMotionReactHookImports(f)
    return repaired ? { ...f, content } : f
  })
  // 補宣告缺失的 useRef
  const withRefsRepaired = withMotionFixed.map(f => {
    const { content, repaired } = repairUndeclaredRefs(f)
    return repaired ? { ...f, content } : f
  })
  // 再修復缺失的 React hooks import（根本性修復 _react.useState is not a function）
  const withImportsRepaired = withRefsRepaired.map(f => {
    const { content, repaired } = repairMissingReactImports(f)
    return repaired ? { ...f, content } : f
  })
  // 修復 bracket lookup 可能回傳 undefined（Cannot read properties of undefined）
  const withLookupRepaired = withImportsRepaired.map(f => {
    const { content, repaired } = repairBracketLookupAccess(f)
    return repaired ? { ...f, content } : f
  })
  // 修復 null 值被數字索引存取（Cannot read properties of null (reading '0')）
  const withNullIndexRepaired = withLookupRepaired.map(f => {
    const { content, repaired } = repairNullIndexAccess(f)
    return repaired ? { ...f, content } : f
  })
  // 修復可選鏈左側賦值（n?.x += value → SWC/TS 編譯錯誤）
  const withOptionalChainFixed = withNullIndexRepaired.map(f => {
    const { content, repaired } = repairOptionalChainAssignment(f)
    return repaired ? { ...f, content } : f
  })

  const broken: Array<{ file: GeneratedComponent; errors: string[]; truncated: boolean }> = []
  for (const file of withOptionalChainFixed) {
    const errors = getSyntaxErrors(file.path, file.content)
    if (errors.length > 0) broken.push({ file, errors, truncated: isTruncatedFile(file.content, errors) })
  }
  if (broken.length === 0) return withOptionalChainFixed

  logger.warn(
    { count: broken.length, paths: broken.map(b => b.file.path), truncated: broken.filter(b => b.truncated).map(b => b.file.path) },
    'TSX 語法錯誤，呼叫 LLM 修復'
  )

  // 收集非破損檔案的前 20 行作為 import context（供截斷型修復使用）
  const healthyImportContext = withOptionalChainFixed
    .filter(f => !broken.some(b => b.file.path === f.path))
    .map(f => {
      const head = f.content.split('\n').slice(0, 20).join('\n')
      return `// ${f.path}\n${head}`
    })
    .join('\n\n')

  // 分類：截斷型用 regenerate prompt；一般型用 fix-only prompt
  const truncatedBroken = broken.filter(b => b.truncated)
  const normalBroken = broken.filter(b => !b.truncated)

  const result = new Map<string, string>()

  // ---- 一般語法修復 ----
  if (normalBroken.length > 0) {
    const errorSummary = normalBroken
      .map(({ file, errors }) => `=== ${file.path} ===\n${errors.slice(0, 3).join('\n')}`)
      .join('\n\n')
    const brokenCode = normalBroken
      .map(({ file }) => `\`\`\`tsx:${file.path}\n${file.content}\n\`\`\``)
      .join('\n\n')

    const systemPrompt = [
      'You are a TypeScript/TSX syntax expert.',
      'Fix ONLY the syntax errors (missing brackets, parentheses, braces, quotes, etc.).',
      'Do NOT change logic, imports, or component behavior.',
      'Output each fixed file in the format:',
      '```tsx:PATH',
      '...full fixed code...',
      '```',
    ].join('\n')

    const response = await callClaude(
      systemPrompt,
      [{ role: 'user', content: `Fix these syntax errors:\n\n${errorSummary}\n\nFiles:\n\n${brokenCode}` }],
      { maxTokens: 32768, temperature: 0, heartbeatFn },
      { ...trackingContext, purpose: 'fix_syntax_errors' }
    )
    if (response.success && response.content) {
      const fixRegex = /```tsx:([^\n]+)\n([\s\S]*?)\n```/g
      let m: RegExpExecArray | null
      while ((m = fixRegex.exec(response.content)) !== null) {
        result.set(m[1].trim(), m[2].trim())
      }
    } else {
      logger.warn('一般語法修復 LLM 失敗')
    }
  }

  // ---- 截斷型修復（regenerate prompt + import context）----
  if (truncatedBroken.length > 0) {
    const brokenCode = truncatedBroken
      .map(({ file }) => `\`\`\`tsx:${file.path}\n${file.content}\n\`\`\``)
      .join('\n\n')

    const contextSection = healthyImportContext
      ? `\n\nContext from other files (first 20 lines each):\n${healthyImportContext}`
      : ''

    const systemPrompt = [
      'You are a TypeScript/TSX expert.',
      'The following files are TRUNCATED — generation was cut off mid-file.',
      'Please REGENERATE each complete file from scratch based on:',
      '1. The partial code provided (for intent and structure clues)',
      '2. Import context from sibling files',
      'Do NOT just fix syntax — write the COMPLETE working file.',
      'Output each regenerated file in the format:',
      '```tsx:PATH',
      '...full code...',
      '```',
    ].join('\n')

    const response = await callClaude(
      systemPrompt,
      [{ role: 'user', content: `Truncated files to regenerate:\n\n${brokenCode}${contextSection}` }],
      { maxTokens: 32768, temperature: 0, heartbeatFn },
      { ...trackingContext, purpose: 'fix_truncated_file' }
    )
    if (response.success && response.content) {
      const fixRegex = /```tsx:([^\n]+)\n([\s\S]*?)\n```/g
      let m: RegExpExecArray | null
      while ((m = fixRegex.exec(response.content)) !== null) {
        result.set(m[1].trim(), m[2].trim())
      }
    } else {
      logger.warn('截斷型修復 LLM 失敗')
    }
  }

  if (result.size === 0) {
    logger.warn('語法修復：LLM 輸出格式無法解析或全部失敗')
    return files
  }

  const brokenPaths = new Set(broken.map(b => b.file.path))

  return withOptionalChainFixed
    .map(file => {
      if (!brokenPaths.has(file.path)) return file

      const fixed = result.get(file.path)
      if (fixed) {
        const remaining = getSyntaxErrors(file.path, fixed)
        if (remaining.length === 0) {
          logger.info({ path: file.path }, 'TSX 語法修復成功')
          return { ...file, content: fixed }
        }
        logger.warn({ path: file.path, errors: remaining }, '修復後仍有語法錯誤')
      }

      // page 檔案不能移除（repairMissingComponents 不處理 page）
      if (pagePathsToPreserve?.has(file.path)) {
        logger.warn({ path: file.path }, '頁面檔案語法修復失敗，保留原始代碼')
        return file
      }

      // 修復失敗 → 移除，交給 repairMissingComponents 重新生成
      logger.warn({ path: file.path }, '語法修復失敗，移除破損檔案（將由 repairMissingComponents 重新生成）')
      return null
    })
    .filter((f): f is GeneratedComponent => f !== null)
}

/**
 * 從已解析的程式碼中移除 LLM 元文字行（continuation 污染的最終防線）
 * 這些行永遠不會是合法的 TSX/TS/CSS，可安全移除
 */
function stripLlmMetaLines(code: string): string {
  const LLM_META_LINE = [
    /^Here (is|are|'s) the (complete|full|updated|modified|remaining|rest)/i,
    /^I (need|will|should|am going|want|must) (to )?(generate|provide|create|output|continue|start|write|give)/i,
    /^I'(ll|m|ve) (output|provide|generate|continue|write|give|now)/i,
    /^Let me (provide|generate|continue|create|output|write|give|start)/i,
    /^The previous (output|code|generation|response)/i,
    /^(Continuing|Resuming|Picking up) (from|where|the|with)/i,
    /^(Apologies|Sorry),? (the|my|for|I)/i,
    /^Now (I'll|let me|here|continuing)/i,
    /^(OK|Okay|Alright),? (here|let|I)/i,
    /^Since (the|my|this) (previous|output|code|response)/i,
    /^(Note|Important|Please note):/i,
    /output the complete (responsive|animated|structure|rwd|styled|code)/i,
  ]
  // 行內污染：meta 文字出現在 JSX expression / template literal 中段
  // 例如 key={`${I'll output the complete...`} 或 key={I'll output...}
  const INLINE_META = /[`{$]\s*(I'(ll|m|ve) |I (need|will|should)|Let me |Here (is|are)|I'll output)/i
  const lines = code.split('\n')
  let removedCount = 0
  const cleaned = lines.filter(line => {
    const trimmed = line.trim()
    if (!trimmed) return true
    // 整行是純元文字
    if (LLM_META_LINE.some(p => p.test(trimmed))) { removedCount++; return false }
    // 行內嵌入元文字（在 JSX expression 或 template literal 後）
    if (INLINE_META.test(line)) { removedCount++; return false }
    return true
  })
  if (removedCount > 5) {
    logger.warn(
      { removedLines: removedCount },
      'stripLlmMetaLines: 從生成代碼中移除大量 LLM 元文字'
    )
  } else if (removedCount > 0) {
    logger.debug(
      { removedLines: removedCount },
      'stripLlmMetaLines: 移除 LLM 元文字'
    )
  }
  return cleaned.join('\n')
}

/**
 * 解析 LLM 輸出的檔案
 */
export function parseGeneratedFiles(content: string, designSystem: DesignSystem): {
  pages: GeneratedComponent[]
  components: GeneratedComponent[]
  styles: string
} {
  const tsxRegex = /`{3,}tsx:([^\n]+)\n([\s\S]*?)\n`{3,}/g
  const tsRegex = /`{3,}ts:([^\n]+)\n([\s\S]*?)\n`{3,}/g
  const cssRegex = /`{3,}css:([^\n]+)\n([\s\S]*?)\n`{3,}/g

  // 用 Map 去重：相同路徑保留最後一個（LLM 截斷後重新生成的完整版覆蓋截斷版）
  const pagesMap = new Map<string, GeneratedComponent>()
  const componentsMap = new Map<string, GeneratedComponent>()
  let styles = ''

  // 解析 .tsx 檔案
  let match
  while ((match = tsxRegex.exec(content)) !== null) {
    const path = match[1].trim()
    const fileContent = stripLlmMetaLines(match[2].trim())

    if (path.includes('/page.tsx') || path.includes('/page.ts')) {
      pagesMap.set(path, {
        path,
        content: fileContent,
        description: `頁面: ${path.split('/').slice(-2, -1)[0]}`,
      })
    } else {
      componentsMap.set(path, {
        path,
        content: fileContent,
        description: `組件: ${path.split('/').pop()?.replace('.tsx', '')}`,
      })
    }
  }

  // 解析 .ts 檔案（utility、types、configs）
  while ((match = tsRegex.exec(content)) !== null) {
    const path = match[1].trim()
    const fileContent = stripLlmMetaLines(match[2].trim())

    if (path.includes('/page.ts')) {
      pagesMap.set(path, {
        path,
        content: fileContent,
        description: `頁面: ${path.split('/').slice(-2, -1)[0]}`,
      })
    } else {
      componentsMap.set(path, {
        path,
        content: fileContent,
        description: `工具: ${path.split('/').pop()?.replace('.ts', '')}`,
      })
    }
  }

  const pages = [...pagesMap.values()]
  const components = [...componentsMap.values()]

  while ((match = cssRegex.exec(content)) !== null) {
    const path = match[1].trim()
    const fileContent = match[2].trim()

    if (path.includes('globals.css') || path.includes('global.css')) {
      styles = fileContent
    }
  }

  // 如果沒有解析到 styles，嘗試其他格式
  if (!styles) {
    const cssMatch = content.match(/`{3,}css\n([\s\S]*?)`{3,}/)
    if (cssMatch) {
      styles = cssMatch[1].trim()
    }
  }

  // 如果還是沒有，生成一個基礎的 globals.css
  if (!styles) {
    styles = `@import "tailwindcss";

${designSystem.cssVariables}

body {
  font-family: var(--font-family);
  background-color: var(--color-background);
  color: var(--color-foreground);
}`
  }

  return { pages, components, styles }
}

/**
 * 解析串流中已閉合的 code block（用於實時預覽）
 * 只匹配有 ``` 結尾的完整 code block，未完成的不計入
 */
function parseCompletedFileBlocks(accumulatedText: string): {
  pages: GeneratedComponent[]
  components: GeneratedComponent[]
  styles: string
  completedBlockCount: number
} {
  const tsxRegex = /`{3,}tsx:([^\n]+)\n([\s\S]*?)\n`{3,}/g
  const tsRegex = /`{3,}ts:([^\n]+)\n([\s\S]*?)\n`{3,}/g
  const cssRegex = /`{3,}css:([^\n]+)\n([\s\S]*?)\n`{3,}/g

  const pages: GeneratedComponent[] = []
  const components: GeneratedComponent[] = []
  let styles = ''
  let completedBlockCount = 0

  let match
  while ((match = tsxRegex.exec(accumulatedText)) !== null) {
    completedBlockCount++
    const path = match[1].trim()
    const fileContent = stripLlmMetaLines(match[2].trim())

    if (path.includes('/page.tsx') || path.includes('/page.ts')) {
      pages.push({ path, content: fileContent, description: `頁面: ${path.split('/').slice(-2, -1)[0]}` })
    } else {
      components.push({ path, content: fileContent, description: `組件: ${path.split('/').pop()?.replace('.tsx', '')}` })
    }
  }

  while ((match = tsRegex.exec(accumulatedText)) !== null) {
    completedBlockCount++
    const path = match[1].trim()
    const fileContent = stripLlmMetaLines(match[2].trim())

    if (path.includes('/page.ts')) {
      pages.push({ path, content: fileContent, description: `頁面: ${path.split('/').slice(-2, -1)[0]}` })
    } else {
      components.push({ path, content: fileContent, description: `工具: ${path.split('/').pop()?.replace('.ts', '')}` })
    }
  }

  while ((match = cssRegex.exec(accumulatedText)) !== null) {
    completedBlockCount++
    const path = match[1].trim()
    const fileContent = match[2].trim()

    if (path.includes('globals.css') || path.includes('global.css')) {
      styles = fileContent
    }
  }

  // 嘗試無路徑的 css block
  if (!styles) {
    const cssMatch = accumulatedText.match(/```css\n([\s\S]*?)```/)
    if (cssMatch) {
      completedBlockCount++
      styles = cssMatch[1].trim()
    }
  }

  return { pages, components, styles, completedBlockCount }
}

// ============================================================
// 三階段程式碼生成
// ============================================================

// Streaming partial code callback type
export type PartialCodeCallback = (partial: {
  pages: GeneratedComponent[]
  components: GeneratedComponent[]
  styles: string
}) => void

/**
 * 建構 throttled text delta handler（雙條件：新區塊 + 時間間隔）
 */
export function buildStreamingHandler(
  onPartialCode: PartialCodeCallback | undefined
): ((accumulated: string) => void) | undefined {
  if (!onPartialCode) return undefined

  let lastBlockCount = 0
  let lastEmitTime = Date.now()
  let lastEmitLength = 0

  return (accumulated: string) => {
    const parsed = parseCompletedFileBlocks(accumulated)
    const now = Date.now()
    const hasNewBlocks = parsed.completedBlockCount > lastBlockCount
    const elapsedMs = now - lastEmitTime
    const charsSinceLastEmit = accumulated.length - lastEmitLength
    const shouldEmitHeartbeat = elapsedMs >= 2500 && charsSinceLastEmit >= 600

    if (!hasNewBlocks && !shouldEmitHeartbeat) {
      return
    }

    if (hasNewBlocks) {
      logger.info({
        blocks: parsed.completedBlockCount,
        pages: parsed.pages.length,
        components: parsed.components.length,
        timeSinceLastEmit: elapsedMs,
      }, '新區塊完成')
    } else {
      logger.info({
        accumulatedLength: accumulated.length,
        charsSinceLastEmit,
        timeSinceLastEmit: elapsedMs,
      }, 'streaming heartbeat')
    }

    if (elapsedMs < 1500) {
      return
    }

    lastBlockCount = parsed.completedBlockCount
    lastEmitTime = now
    lastEmitLength = accumulated.length
    logger.info({
      pages: parsed.pages.length,
      components: parsed.components.length,
      heartbeat: !hasNewBlocks,
    }, 'EMIT preview_update')
    onPartialCode({ pages: parsed.pages, components: parsed.components, styles: parsed.styles })
  }
}

/**
 * Diff 模式串流處理：解析已完成的 search/replace blocks，apply 到 baseCode 後 emit
 * 前端不需改動 — emit 的仍是完整 CodeBundle
 */
export function buildDiffStreamingHandler(
  baseCode: CodeBundle,
  onPartialCode: PartialCodeCallback | undefined,
): ((accumulated: string) => void) | undefined {
  if (!onPartialCode) return undefined

  let lastAppliedCount = 0
  let lastEmitTime = Date.now()

  return (accumulated: string) => {
    const now = Date.now()
    if (now - lastEmitTime < 2000) return

    const blocks = parseSearchReplaceBlocks(accumulated)
    if (!blocks || blocks.length <= lastAppliedCount) return

    const result = applySearchReplace(baseCode, blocks)
    lastAppliedCount = blocks.length
    lastEmitTime = now

    onPartialCode({
      pages: result.updatedCode.pages,
      components: result.updatedCode.components,
      styles: result.updatedCode.styles,
    })
  }
}

// ============================================================
// Prompt 架構輔助函數（Phase 5-D）
// ============================================================

function getTierCreativePhilosophy(tier: DesignTier): string {
  if (tier === 'creative') {
    return `## 創作使命（Creative Mission）
你是一位有強烈審美主張的設計師，不是照規格施工的工程師。
**第一原則：讓用戶第一眼就想截圖**。用 Design System 的色彩大膽組合，打破常規佈局預期，讓 signatureElement 真正成為視覺錨點。
每個設計決策問自己：這會讓人停下來多看一眼嗎？`
  } else {
    return `## 設計使命（Design Mission）
你是一位追求清晰與效率的 UI 工程師。
**第一原則：用戶一秒就知道下一步做什麼**。資訊密度適中，層次清晰，每個元素存在都有理由。
每個設計決策問自己：這讓任務更容易完成嗎？`
  }
}

function getBaseRules(): string {
  const currentYear = new Date().getFullYear()
  return `## 當前年份
現在是 ${currentYear} 年。所有生成的內容中出現的年份（copyright footer、文章日期、活動日期、「Est. XXXX」等）都必須使用 ${currentYear}，禁止使用 2024 或其他過去的年份。

## 組件規則
- 有鍵盤/focus 行為的組件使用 Radix 或 React Aria
- 破壞性操作用 AlertDialog 確認
- loading state 用 skeleton

## React Hooks 宣告規則（Critical — 必須遵守）
- **React hooks 只能從 'react' import**：\`import { useState, useEffect, useRef, useCallback, useMemo } from 'react'\`
- **禁止從 'motion/react' import React hooks**：motion/react 只 import 動畫相關 API（motion, AnimatePresence, useAnimation 等）
- 所有使用的 ref 必須在 component body 頂層宣告：用了 \`mouseRef.current\` → 必須有 \`const mouseRef = useRef(...)\`
- 所有使用的 state 必須宣告：用了 \`setCount\` → 必須有 \`const [count, setCount] = useState(...)\`
- Canvas / requestAnimationFrame 動畫若追蹤 mouse → 必須宣告 \`const mouseRef = useRef({ x: 0, y: 0 })\` + mousemove handler
- useEffect / useCallback 的依賴陣列必須完整：所有 callback 內用到的外部變數都要列出
- 禁止在 event handler 或 animation frame 內直接讀未宣告的變數

## 資料防禦規則（Critical — 必須遵守）
- 所有陣列 .map()/.forEach() 迭代前必須做 null guard：\`(items ?? []).map(...)\`
- 迭代回呼中的變數存取必須用 optional chaining：\`item?.property\`
- 條件渲染陣列項目時用 \`{items?.length > 0 && items.map(...)}\`
- 物件屬性存取若來源可能 undefined，必須用 \`?.\` 或提供 fallback：\`item?.name ?? ''\`
- style 中引用的值必須防禦：\`style={{ background: item?.color ?? '#ccc' }}\`
- 禁止假設 mock 資料陣列永遠非空 — 空陣列和 undefined 都必須安全處理

## 無障礙規則（必須遵守）
### Accessible Names（Critical）
- 每個互動控件都必須有 accessible name
- icon-only buttons 必須有 aria-label 或 aria-labelledby
- 每個 input/select/textarea 都必須有 label
- 連結文字要有意義（禁止「點擊這裡」）
- 裝飾性 icon 必須 aria-hidden

### Keyboard Access（Critical）
- 禁止用 div/span 當按鈕（除非完整實作 keyboard support）
- 所有互動元素必須可 Tab 到達
- focus 狀態必須對鍵盤用戶可見
- 禁止 tabindex > 0
- dialog/overlay 必須支援 Escape 關閉

### Semantics（High）
- 優先用 native HTML（button, a, input）而非 role hack
- 不跳過 heading level（h1→h2→h3）
- 列表用 ul/ol + li
- 表格的表頭用 th
- layout.tsx 的 <html> 必須有 lang 屬性（如 lang="zh-TW" 或 lang="en"）
- 頁面第一個元素必須是 Skip Link：<a href="#main" className="sr-only focus:not-sr-only ...">跳到主要內容</a>，main 內容區加 id="main"

### Forms（High）
- 錯誤訊息用 aria-describedby 關聯到欄位
- 必填欄位要標示 required
- 無效欄位設 aria-invalid
- helper text 用 aria-describedby 關聯

### Focus & Dialogs（Critical）
- modal 必須 trap focus
- 關閉 dialog 時 restore focus 到 trigger
- dialog 開啟時設 initial focus

### Dynamic Content（High）
- 動態狀態訊息（toast、表單提交結果、載入完成）必須用 aria-live="polite" 或 role="status"
- 錯誤訊息用 role="alert"

## Metadata 規則（Next.js）
- 每個 page.tsx 必須 export metadata（title + description）
- root layout.tsx 必須設 default metadata 作為 fallback
- 使用 Next.js Metadata API（export const metadata 或 generateMetadata）
- title 格式統一，例如「頁面名稱 | 產品名稱」
- 不要在 layout 和 page 重複定義相同的 metadata
- 不需要處理 OG/canonical/structured data（部署時再加）

## Font Loading 規則
- 必須使用 next/font 載入字體（Google Fonts 或 local）
- 在 layout.tsx import，透過 className 或 CSS variable 全局應用
- 禁止使用 <link> 標籤或 @import 載入 Google Fonts（會阻塞渲染）
- 範例：
\`\`\`tsx
import { DM_Sans } from 'next/font/google'
const font = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })
<html className={font.variable}>
\`\`\`

## Professional UI 規則（常被忽略但影響品質的細節）

### Icon 與視覺元素
- 禁止用 emoji 作為 UI icon — 必須使用 SVG icon（Heroicons 或 Lucide）
- icon 統一尺寸：固定 viewBox（24x24），使用 w-5 h-5 或 w-6 h-6
- 品牌 logo 用 SVG，不要猜路徑

### 互動與游標
- 所有可點擊元素必須有 cursor-pointer（按鈕、卡片、連結）
- 本階段不加 transition/animation — 動畫階段會處理。但結構要正確標記互動元素
- Focus ring 用 focus-visible: 不要用 focus:（避免滑鼠點擊也出 ring）
- Modal、Drawer、Sheet 必須加 overscroll-behavior: contain（防止背景滾動穿透）

### 對比度與可見性
- Light mode 正文用 slate-900（#0F172A），不要用 slate-400
- Muted 文字最淺用 slate-600（#475569）
- Glass/透明元素在 light mode 用 bg-white/80 以上，不要用 bg-white/10
- border 在 light mode 用 gray-200，不要用 white/10（會隱形）

### 佈局細節
- Floating navbar 要留邊距（top-4 left-4 right-4），不要 top-0 left-0 right-0
- 有 fixed navbar 時，main content 要加 padding-top 避免被遮擋
- container max-width 全局統一（max-w-6xl 或 max-w-7xl），不要混用
- Flex 子元素要加 min-w-0 — 否則 truncate/line-clamp 在 flex 容器裡不生效
- <img> 必須有 explicit width + height 屬性防止 CLS
- 圖片佔位一律用 picsum seed URL：<img src="https://picsum.photos/seed/{英文關鍵字}/{寬}/{高}" width={寬} height={高} alt="描述" className="object-cover" />
- 禁止用 /placeholder.png、/image.jpg 等本地路徑
- seed 關鍵字用語義英文詞（hero、team-alice、product-shoes），同類型內容用同一 seed 保持一致
- 常用尺寸：hero 1280×720、卡片 800×450、頭像 200×200、縮圖 400×300`
}

// ============================================================
// Fast Mode 精簡版 Prompt 函數（只影響 fast build，完整模式不受影響）
// ============================================================

function getCraftFoundationsFast(): string {
  return `## Craft Foundations（設計品質底線）

### Subtle Layering
- 用 surface-1（底層）→ surface-2（卡片）→ surface-3（hover/active）建立表面層級
- 陰影用 \`shadow-sm\` + \`ring-1 ring-black/5\`，禁止大面積 drop-shadow

### Contrast（必須遵守）
- 禁止白字配亮底：text-white 不能出現在 bg-white, bg-muted, bg-surface-1/2/3 上
- 毛玻璃（backdrop-blur）必須在深色容器內（bg-*-900 以上）才能用白字
- 灰色構建結構，彩色只在需要行動或注意時出現

### 排版層級
- 標題：font-bold + tracking-tight，正文：leading-relaxed，標籤：tabular-nums
- weight + color + spacing 三維度建立層級

### 間距系統
- 選定 base unit（8px）嚴格用倍數，一致性比具體數字重要`
}

function getStructureConstraintsFast(tier: DesignTier): string {
  const craft = getCraftFoundationsFast()

  if (tier === 'creative') {
    return `${craft}

## 設計約束（Creative Tier — 創意型）
- 漸層：線性漸層、radial gradient OK（禁止紫色多色 AI slop）
- Glass 效果：\`backdrop-blur-xl bg-white/70 border-white/20\`（適度、小面積）
- Display font 用於 hero/標題（clamp() 響應式），鼓勵 serif + sans 搭配
- 禁止 Inter/Roboto/Arial 作為唯一字體
- 禁止卡通化、不專業的設計`
  }

  return `${craft}

## 設計約束（Functional Tier — 功能型）
- 一個 accent color 聚焦注意力，灰色構建結構
- 禁止漸層（除非用戶明確要求）、禁止 glow 效果
- 字體可讀性優先，禁止 Inter/Roboto/Arial 作為唯一字體
- 禁止紫色多色漸層（AI slop）、過度裝飾`
}

function getBaseRulesFast(): string {
  const currentYear = new Date().getFullYear()
  return `## 當前年份
現在是 ${currentYear} 年。所有年份（copyright、日期等）必須使用 ${currentYear}。

## React Hooks 宣告規則（Critical）
- **React hooks（useState/useEffect/useRef/useCallback/useMemo）只能從 'react' import，禁止從 'motion/react' import**
- 所有使用的 ref 必須在 component body 頂層宣告
- 所有使用的 state 必須宣告
- useEffect / useCallback 的依賴陣列必須完整

## 資料防禦規則（Critical）
- 所有陣列 .map()/.forEach() 前必須做 null guard：\`(items ?? []).map(...)\`
- 物件屬性存取用 \`?.\` 或提供 fallback

## Font Loading 規則
- 必須使用 next/font 載入字體（禁止 <link> / @import Google Fonts）
- 在 layout.tsx import，透過 className 或 CSS variable 全局應用

## 自給自足規則（Critical）
- 每個 import 的內部模組都必須在輸出中生成
- 第三方套件（react, next, motion/react, @heroicons/react 等）可自由 import
- 禁止用 emoji 作為 UI icon — 必須使用 SVG icon（Heroicons 或 Lucide）

## 無障礙規則（Critical）
- 每個互動控件必須有 accessible name（aria-label 或 label）
- icon-only buttons 必須有 aria-label
- 禁止用 div/span 當按鈕（用 button/a）
- 不跳過 heading level（h1→h2→h3）
- dialog/overlay 必須支援 Escape 關閉

## 組件規則
- 破壞性操作用 AlertDialog 確認
- loading state 用 skeleton

## 佈局防坑（常見 build/視覺 bug）
- 有 fixed navbar 時 main content 加 padding-top
- Flex 子元素加 min-w-0（否則 truncate 不生效）
- 圖片用 picsum seed：<img src="https://picsum.photos/seed/{關鍵字}/{寬}/{高}" width={寬} height={高} alt="..." className="object-cover" />（禁止本地路徑，必須有 width+height 防 CLS）
- 所有可點擊元素 cursor-pointer`
}

function getDataAnimateSpec(): string {
  return `### 可用的 data-animate 值（只標記關鍵元素，不要每個 div 都加）
- \`data-animate="fade-up"\` — 向上淡入（卡片、段落內容）
- \`data-animate="stagger-children"\` — 子元素依序入場（列表/網格容器）
- \`data-animate="hero-entrance"\` — 英雄標題戲劇性入場
- \`data-animate="reveal-on-scroll"\` — 滾動觸發顯示（feature sections）
- \`data-animate="count-up"\` — 數字計數動畫（統計數字）
- \`data-animate="slide-in-left"\` / \`"slide-in-right"\` — 側滑入
- \`data-animate="hover-lift"\` — 懸停上浮（卡片 hover 效果）
- \`data-animate="parallax"\` — 視差（背景、裝飾元素）`
}

/**
 * 階段 1：生成結構與互動（Structure + Interaction）
 * 生成桌面版本，包含 HTML 結構、基礎 CSS、組件骨架、完整互動邏輯
 * 不包含動畫和響應式設計
 */
export async function generateStructure(
  designSystem: DesignSystem,
  pages: string[],
  template: TemplateData,
  bddSpec?: string,
  designTier?: DesignTier,
  productContext?: {
    originalRequirements?: string
    designIdeas?: Array<{ step: string; answer: string }>
    designBrief?: DesignBrief
    uiSpec?: UIRequirementsSpec
    variantConcept?: VariantConcept
    interactionHint?: string
    templateStyleHint?: string
    layoutGuardPrompt?: string
    layoutMode?: 'app' | 'website'
    templateOverrides?: Record<string, Record<string, string>>
    referenceAnalysis?: import('./reference-analyzer').ReferenceAnalysis
    moodId?: string
    existingComponentSummary?: string  // 已有組件路徑列表（增量生成用）
    incrementalFirstBatch?: boolean    // 增量首批：只生成指定頁面 + Layout/Header/Footer
    generationProfile?: GenerationProfile
  },
  trackingContext?: LlmTrackingContext,
  onPartialCode?: PartialCodeCallback,
  heartbeatFn?: () => void,  // 長時間 post-processing 期間刷新 Redis 活動心跳
  onCheckpoint?: (partial: { pages: GeneratedComponent[]; components: GeneratedComponent[]; styles: string }) => Promise<void>,
): Promise<GenerationResult> {
  const tier = designTier || 'functional'
  const generationProfile = productContext?.generationProfile || 'balanced'
  const isFastMode = generationProfile === 'fast'

  // 快速模式：精簡版 techniques（name+codeHint）+ 精選 1 pattern（含 skeleton）
  // 完整模式：完整 techniques + patterns（含 Tailwind 骨架）
  let techniquesSection = ''
  let patternsSection = ''
  if (!isFastMode) {
    const techniques = selectTechniques(tier, template.category, 3)
    techniquesSection = formatTechniquesForPrompt(techniques)

    const patterns = selectCompositionPatterns(
      tier, template.category, pages, productContext?.moodId,
      undefined,  // count: default 2
      designSystem.layoutArchetype  // layoutArchetypeHint
    )
    patternsSection = formatPatternsForPrompt(patterns)
  } else {
    // 快速模式：2 個精簡技法（name + code hint，~100 tokens）
    const fastTechniques = selectTechniques(tier, template.category, 2)
    techniquesSection = formatTechniquesForPromptFast(fastTechniques)

    // 快速模式：精選 1 個 pattern + skeleton 第一行（~80 tokens）
    const fastPatterns = selectCompositionPatterns(
      tier, template.category, pages, productContext?.moodId,
      1,  // count: 1 個精選
      designSystem.layoutArchetype
    )
    if (fastPatterns.length > 0) {
      const p = fastPatterns[0]
      const skeleton = p.tailwindHint?.split('\n')[0] || ''
      patternsSection = `## 佈局參考模式\n- **${p.name}**：${p.description}\n  skeleton: \`${skeleton}\``
    }
  }

  const moodSystemSection = productContext?.moodId
    ? `\n## Design Mood（視覺風格指引 — 定義美學方向）\n${getMoodPromptBlock(productContext.moodId)}\n`
    : ''

  const moodConflictWarning = buildMoodConflictWarning(productContext?.moodId, designSystem)

  // 快速模式使用精簡版約束函數（省 ~1500 字）
  const constraintsBlock = isFastMode ? getStructureConstraintsFast(tier) : getStructureConstraints(tier)
  const baseRulesBlock = isFastMode ? getBaseRulesFast() : getBaseRules()

  // ── Prompt Caching：拆分 static（跨 flow 可重用）+ dynamic（每次不同） ──
  const interactionRules = isFastMode && productContext?.layoutMode === 'website'
? `## 互動完整性規則（Website 模式）
- CTA 按鈕需 hover 狀態 + cursor-pointer
- 表單提交需 success toast 或提示（用 useState 控制）
- Navigation 當前頁面連結需 active 標記
- Modal/Sheet 需背景 overlay + Escape 關閉
- FAQ 手風琴用 useState 控制展開/收合
- 圖片輪播用 useState + 左右箭頭控制`
: `## 互動完整性規則（Critical — 按鈕必須有功能）
每個 UI 操作都必須有完整的互動實作，不能只是靜態佔位：

### create 類操作（新增/建立/記錄）
- 必須有觸發按鈕 → 打開 Modal/Dialog（用 useState 控制開關）
- Modal 內必須有完整表單（所有欄位、驗證、提交按鈕）
- 提交後：加入列表/表格 + 關閉 Modal + 清空表單
- 使用 Radix Dialog 或原生 dialog 實作

### delete 類操作（刪除/移除）
- 必須有觸發按鈕 → 打開 AlertDialog 確認
- 確認後：從列表移除該項目
- 使用 Radix AlertDialog 實作

### update 類操作（修改/編輯）
- 點擊編輯按鈕 → 打開預填資料的 Modal
- 修改後提交 → 更新列表中的對應項目

### filter 類操作（搜尋/篩選）
- 搜尋框/篩選器用 useState 控制
- 輸入時即時過濾列表（用 useMemo 或 filter）

### view 類操作（查看/瀏覽）
- 點擊展開詳情面板、或導航到詳情頁

### 資料管理模式
- 使用 useState 管理列表資料（初始值為有意義的模擬數據）
- CRUD 操作直接操作 state（前端 demo，不需要 API）
- 例如：\`const [items, setItems] = useState(initialData)\``

  // Static block：只取決於 tier + isFastMode（4 種組合），跨 flow 高度可重用
  const structureStaticPrompt = `${getTierCreativePhilosophy(tier)}

## 本階段任務：結構與互動生成（Structure + Interaction）
這是第一階段，需要生成：
1. 完整的 HTML 結構
2. 基礎 CSS 樣式（顏色、字體、間距、圓角）
3. 可交互的組件（含 state 管理和事件處理）

## 本階段禁止
- 不要使用 motion/react API（import from 'motion/react' 禁止）
- 不要使用 CSS transition/animation class（動畫在下一階段添加）
- 不要添加響應式設計（md:, lg:, @media）（RWD 在第三階段）
- 假設寬度為 1280px 桌面版

## 動畫意圖標記（data-animate）—— 取代「禁止動畫」
對需要動畫的關鍵元素加 data-animate 屬性，Animation 階段會實作這些意圖。

${getDataAnimateSpec()}

## 'use client' 使用規則
- 需要 useState/useEffect/useRef/事件處理的組件**必須**加 'use client'
- 純展示組件（無 state、無事件處理）**不要**加 'use client'
- layout.tsx 和純 metadata 的 page.tsx **不要**加 'use client'

${baseRulesBlock}`

  // Dynamic block：每次不同（mood、patterns、constraints、techniques、designSystem、interaction rules）
  const structureDynamicPrompt = `${moodSystemSection}
${moodConflictWarning}
${patternsSection}

${constraintsBlock}

${techniquesSection}

${isFastMode ? buildDesignSystemPromptFast(designSystem) : buildDesignSystemPrompt(designSystem)}

${interactionRules}`

  const systemPrompt = buildCacheableSystemBlocks(structureStaticPrompt, structureDynamicPrompt)

  // 構建產品上下文
  const productDesc = productContext?.originalRequirements || ''
  const designIdeas = productContext?.designIdeas || []
  const brief = productContext?.designBrief
  const variantConcept = productContext?.variantConcept
  const uiSpec = productContext?.uiSpec

  const productSection = productDesc
    ? `## 用戶的原始願景（最高優先 — 頁面結構和代碼篇幅必須正比於此描述的比重）
以下是用戶親自撰寫的需求描述。如果用戶用 12 段描述前端動畫、只用 1 句提後台管理，
那麼生成的代碼應 90% 是前端體驗，10% 是後台管理。
**代碼投入必須正比於用戶描述篇幅**。

${productDesc}
`
    : ''

  // 創意概念 section — 放在最頂部，最高優先級
  const conceptSection = variantConcept
    ? `## 設計創意概念（最高優先 — 整個設計的靈魂）
「${variantConcept.name}」— ${variantConcept.description}
核心特點：${variantConcept.keyFeatures.join('、')}
預覽效果：${variantConcept.previewDescription}
${variantConcept.signatureElement ? `Signature Element：${variantConcept.signatureElement}` : ''}

**重要**：這個創意概念定義了整個設計的視覺語言和體驗方向。
所有頁面結構、視覺元素、互動模式都必須服務於這個概念。
不要生成一個「普通的」UI 然後貼上概念的標籤 — 概念必須滲透到每個設計決策中。
`
    : ''

  const designSection = designIdeas.length > 0
    ? `## 用戶設計偏好\n${designIdeas.map(i => `- ${i.step}：${i.answer}`).join('\n')}\n`
    : ''

  // 參考網站真實分析
  const refAnalysis = productContext?.referenceAnalysis
  const structuredRefData = refAnalysis ? formatStructuredDataForPrompt(refAnalysis) : ''
  const referenceSection = refAnalysis?.visionAnalysis
    ? `## 參考網站設計分析（真實數據 — 指導風格方向）
URL: ${refAnalysis.url}
${refAnalysis.metadata?.title ? `網站: ${refAnalysis.metadata.title}` : ''}

${refAnalysis.visionAnalysis}

參考這些設計特徵但不照搬。提取設計精神，融入本產品的獨特定位。

${structuredRefData}
${structuredRefData ? `**精確色彩對齊**：上方精確色板來自 DOM 實際 computed styles，配色方案應以此為基準。
**字體對齊**：如果偵測到 Google Fonts，優先使用相同字體。` : ''}
`
    : (structuredRefData ? `## 參考網站結構化數據（DOM 提取）\n${structuredRefData}\n` : '')

  const briefSection = brief
    ? `## 設計方向（AI 設計顧問確認）
- 風格：${brief.styleSummary}
- 色彩方向：${brief.colorDirection}
- 佈局建議：${brief.layoutSuggestion}
${brief.signature ? `- Signature Element：${brief.signature}` : ''}
`
    : ''

  // UI 需求規格（BDD 翻譯後）優先於原始 BDD spec
  let requirementsSection = ''
  if (uiSpec) {
    requirementsSection = formatUISpecForPrompt(uiSpec)
  } else if (bddSpec) {
    // 翻譯失敗降級：仍然注入通用互動指引
    requirementsSection = `## BDD 規格（核心依據）
以下是產品的 BDD Feature Files，描述了所有功能和業務規則。
**你必須從這些 Feature 推導出前端需要哪些頁面、哪些 UI 元素、哪些操作流程。**

${bddSpec}

## 互動實作指引（Critical — 翻譯降級模式）
雖然 BDD 沒有被結構化翻譯，你仍必須實作完整互動：
- 每個「新增/建立」Action → Modal 表單 + useState + 列表更新
- 每個「刪除/移除」Action → 確認對話框 + 列表移除
- 每個「修改/更新」Action → 預填表單 Modal + 更新
- 每個「查詢/篩選」Action → 搜尋框 + useMemo 過濾
- 每個「查看」Action → 詳情面板或展開
- 每個「啟用/停用」Action → useState boolean + 開關切換
- 每個「批量」操作 → 多選勾選框 + 批量操作按鈕
- 所有列表必須有模擬數據（不是空的）`
  }

  // Fast Build 互動提示（無 BDD/uiSpec 時的補充指引）
  const interactionHint = productContext?.interactionHint
  const interactionSection = interactionHint && !uiSpec
    ? `## 互動功能提示（根據產品類型推斷）\n${interactionHint}\n`
    : ''

  // 模板風格參考（Fast Build 自動匹配）
  const templateStyleHint = productContext?.templateStyleHint
  const templateStyleSection = templateStyleHint
    ? `## 設計風格參考（來自高匹配模板）
${templateStyleHint}
注意：這只是參考方向，你應結合用戶需求做出獨特設計，不要複製模板。
`
    : ''

  const layoutGuardPrompt = productContext?.layoutGuardPrompt
  const layoutGuardSection = layoutGuardPrompt
    ? `${layoutGuardPrompt}\n`
    : ''

  // 用戶模板編輯覆蓋（PreviewPanel 中的自訂修改）
  const overrides = productContext?.templateOverrides
  let overridesSection = ''
  if (overrides && Object.keys(overrides).length > 0) {
    const textChanges: string[] = []
    const colorChanges: string[] = []
    const fontChanges: string[] = []
    const spacingChanges: string[] = []

    for (const [elementId, changes] of Object.entries(overrides)) {
      // elementId 格式: "h1-0", "p-2", "button-1" → 轉為自然語言
      const match = elementId.match(/^([a-z]+\d?)-(\d+)$/)
      const tagName = match ? match[1].toUpperCase() : elementId
      const index = match ? parseInt(match[2]) + 1 : 0
      const desc = index > 0 ? `第 ${index} 個 ${tagName} 元素` : `${tagName} 元素`

      for (const [prop, value] of Object.entries(changes)) {
        if (prop === 'text') {
          textChanges.push(`- ${desc}的文字改為：「${value}」`)
        } else if (prop === 'color' || prop === 'backgroundColor') {
          const propLabel = prop === 'color' ? '文字顏色' : '背景顏色'
          colorChanges.push(`- ${desc}的${propLabel}改為 ${value}`)
        } else if (prop === 'fontSize' || prop === 'fontWeight') {
          const propLabel = prop === 'fontSize' ? '字體大小' : '字重'
          fontChanges.push(`- ${desc}的${propLabel}改為 ${value}`)
        } else {
          spacingChanges.push(`- ${desc}的 ${prop} 改為 ${value}`)
        }
      }
    }

    const sections: string[] = []
    if (textChanges.length) sections.push(`### 文字客製化\n${textChanges.join('\n')}`)
    if (colorChanges.length) sections.push(`### 色彩客製化\n${colorChanges.join('\n')}`)
    if (fontChanges.length) sections.push(`### 字體客製化\n${fontChanges.join('\n')}`)
    if (spacingChanges.length) sections.push(`### 間距/樣式客製化\n${spacingChanges.join('\n')}`)

    overridesSection = `## 用戶自訂修改（必須遵守 — 用戶在模板預覽中明確指定的修改）
以下修改是用戶在模板編輯模式中親自調整的，代碼生成時必須完整保留這些自訂內容。

${sections.join('\n\n')}

**注意**：這些修改是用戶的明確意圖，優先級高於模板預設值和 Design System。
`
  }

  // mood code：完整模式用完整代碼片段，快速模式用精簡版（3 行核心 className）
  const moodCodeSection = productContext?.moodId
    ? (isFastMode
      ? (getMoodCodeFragmentCompact(productContext.moodId)
        ? `## 風格錨點（核心 className 示範）
\`\`\`
${getMoodCodeFragmentCompact(productContext.moodId)}
\`\`\``
        : '')
      : (getMoodCodeFragment(productContext.moodId)
        ? `## 風格錨點（Style Reference — 目標視覺風格代碼示範）
以下片段展示了 ${getMoodById(productContext.moodId)?.name || productContext.moodId} 風格的視覺表現。
你的輸出應體現相同的設計語言（為本產品量身定製，不要複製結構）：

\`\`\`tsx
${getMoodCodeFragment(productContext.moodId)}
\`\`\`
`
        : ''))
    : ''

  // ── buildUserMsg：userMessage 工廠，供單次和分批生成共用 ──
  // targetPages：此次要生成的頁面（可能是全部或一個批次）
  // existingComponentPaths：已在前批生成的共用組件路徑（pass 2+ 傳入）
  const buildUserMsg = (targetPages: string[], existingComponentPaths: string[] = []) => {
    const isLaterBatch = existingComponentPaths.length > 0
    const existingNote = isLaterBatch ? `
## ⚠️ 已存在的共用組件（禁止重新生成）
以下組件已在前一批次生成，可直接 import，**不要輸出這些檔案**：
${existingComponentPaths.map(p => `- ${p}`).join('\n')}

本批次只需生成：${targetPages.join(', ')} 這幾個頁面及其專屬組件。
globals.css 已存在，**不要輸出**。
` : ''

    return `請根據以下資訊生成桌面版前端代碼，包含完整互動功能。

${conceptSection}
${productSection}
${designSection}
${referenceSection}
${briefSection}
${moodCodeSection}${overridesSection}
${templateStyleSection}
${layoutGuardSection}
${requirementsSection}
${interactionSection}
## 頁面規劃策略
${productContext?.incrementalFirstBatch
? `**嚴格限制：本批次只生成以下頁面**：${targetPages.join(', ')}
- ⚠️ 禁止生成上述列表以外的頁面（其他頁面會在後續批次生成）
- 必須生成 Layout 組件（Header + Footer），Header 導航連結預留所有頁面
- 必須生成 globals.css
- 頁面中使用有意義的模擬數據（和產品領域相關）
- 共用組件盡量抽取，後續批次可直接 import 複用`
: `以下頁面列表${isLaterBatch ? '（本批次）' : '僅作為起始建議'}：${targetPages.join(', ')}`}

${productContext?.incrementalFirstBatch
? '' // 增量首批已有明確限制，不需要額外策略段
: isFastMode && productContext?.layoutMode !== 'app'
? `**單頁深度模式（快速建站）**：
- ⚠️ 只生成 1 個頁面（首頁），禁止自行增加其他頁面
- ⚠️ 組件檔案總數上限 12 個（含 page.tsx + NavBar + Footer + 各 Section 組件）
- 簡單的 Section（如 CTA、合作夥伴 Logo 牆）直接寫在 page.tsx 內，不需拆成獨立組件
- 只有超過 80 行或需要複用的 Section 才拆成獨立組件檔案
- 生成 5-8 個完整 Section（Hero → 核心特色 → 功能展示 → 使用流程/步驟 → 數據/成就 → 客戶評價 → CTA → Footer 資訊）
- 每個 Section 內容豐富，使用真實模擬數據（和產品領域相關）
- Section 之間有視覺節奏變化（交替背景色、不同佈局模式）
- Header 導航連結用 anchor link 指向頁面內各 Section（#features, #pricing 等）
- 不要只做 3 個 Section 就結束 — 內容要完整到讓用戶覺得這是一個正式上線的網站`
: isFastMode && productContext?.layoutMode === 'app'
? `**單頁深度模式（快速建站 — 工具型）**：
- ⚠️ 只生成 1 個頁面（主功能頁），禁止自行增加其他頁面
- 主頁面直接呈現核心功能界面，包含完整的互動元素
- 不要生成形象官網的 Hero/CTA/Testimonials
- 頁面中使用有意義的模擬數據（和工具功能相關）`
: productContext?.layoutMode === 'app'
? `**工具型/應用型產品 — 頁面以功能為導向：**
- 工具型產品通常只有 1-3 個功能頁面，不需要行銷頁面（Hero/CTA/Testimonials）
- 主頁面直接呈現核心功能界面，佔滿螢幕
- 不要生成形象官網的 Header/Footer/Hero Section
- 頁面中使用有意義的模擬數據（和工具功能相關）`
: isLaterBatch
? `**只生成本批次頁面，不要生成 Header/Footer/Layout（已存在）**
- 每個頁面完整 Section + 互動功能
- 頁面中使用有意義的模擬數據（和產品領域相關）`
: `**你應該根據需求規格自行判斷最終的頁面結構：**
- 歸納出需要哪些頁面，每個頁面承載什麼功能
- 可以增加、移除、合併、重新命名頁面 — 只要能完整覆蓋功能需求
- Header/Footer 的導航連結要對應你最終決定的頁面結構
- 頁面中使用有意義的模擬數據（和產品領域相關，不要用 Lorem ipsum）`}
${variantConcept ? (isFastMode ? `- 整個頁面必須體現「${variantConcept.name}」的創意概念` : `- 每個頁面都必須體現「${variantConcept.name}」的創意概念，不是只有首頁`) : ''}
${pages.length >= 5 && !isLaterBatch && !productContext?.incrementalFirstBatch ? `
**多頁面策略（${pages.length} 個頁面）**：
- 主要頁面（首頁、核心功能頁）：完整 Section + 豐富互動
- 次要頁面（關於、聯繫、FAQ）：精簡 1-2 個 Section
- 共用組件盡量抽取（ProductCard、ContactForm 等）多頁面複用
- Layout 組件統一管理 Header/Footer 導航` : ''}
${existingNote}
## 模板資訊（設計風格參考）
- 名稱：${template.name}
- 類別：${template.category}
- 描述：${template.description}

## 需要生成的內容
${isLaterBatch
? `1. 本批次每個頁面的 page.tsx（完整互動結構）
2. 這些頁面的專屬 UI 組件（共用 Layout/Header/Footer 已存在，不需輸出）`
: productContext?.layoutMode === 'app'
? `1. 功能頁面的 page.tsx（完整互動功能，佔滿螢幕）
2. App Shell Layout（如需側邊欄導航；單頁工具只需基本 layout，無 Header/Footer/Hero）
3. 功能所需的 UI 組件
4. globals.css（包含 CSS variables）`
: `1. 每個頁面的 page.tsx（完整互動結構，根據需求規格決定具體內容）
2. 共用的 Layout 組件（Header, Footer — 導航項對應實際頁面）
3. 頁面所需的 UI 組件（根據功能需求決定，不要為了生成而生成）
4. globals.css（包含 CSS variables）`}

## ⚠️ 自給自足規則（Critical — 違反會導致 build 失敗）
**每個 import 語句引用的檔案，你都必須在輸出中生成對應檔案。** 禁止引用不存在的內部模組。

- ❌ 禁止：寫了 import { FadeIn } from '@/components/animations/FadeIn' 但沒有輸出 FadeIn 檔案
- ✅ 正確：要嘛生成對應的組件檔案，要嘛不使用這個 import
- 如果你想拆分組件到多個檔案，**每個被引用的檔案都必須在輸出中**
- 簡單功能直接寫在同一個檔案裡，不要過度拆分到不存在的檔案
- 第三方套件（react, next, motion/react, @heroicons/react 等）可以自由 import
- 自檢：掃描你所有輸出的 import 語句，確認每個 @/ 或 ./ 開頭的路徑都有對應的輸出檔案

請確保所有組件使用一致的 Design System。互動功能必須完整可用（Modal 能開關、表單能提交、列表能增刪）。動畫和響應式會在後續階段添加。`
  }

  const baseTemperature = designTier === 'creative' ? (productContext?.moodId ? 0.5 : 0.4) : 0.3
  const singlePassLlmOpts = { maxTokens: 32768, temperature: baseTemperature, maxContinuations: MAX_TOKEN_CONTINUATIONS, promptLabel: 'uiux-structure-single', contextSizeHint: generationProfile }
  const multiPassLlmOpts = {
    maxTokens: 32768,
    temperature: baseTemperature,
    maxContinuations: generationProfile === 'quality' ? 4 : generationProfile === 'fast' ? 1 : 2,
    promptLabel: 'uiux-structure-batch',
    contextSizeHint: generationProfile,
  }

  let allRawPages: GeneratedComponent[] = []
  let allRawComponents: GeneratedComponent[] = []
  let styles: string | undefined

  // 增量生成：外部已有組件路徑（Fast Build 第 2 批傳入）
  const externalExistingPaths = productContext?.existingComponentSummary
    ? productContext.existingComponentSummary.split('\n').map(l => l.trim()).filter(Boolean)
    : []

  const contextChars =
    systemPrompt.length +
    (productDesc?.length || 0) +
    (bddSpec?.length || 0) +
    JSON.stringify(productContext?.uiSpec || {}).length
  const batches = buildAdaptiveStructureBatches(pages, {
    contextChars,
    profile: generationProfile,
  })

  if (batches.length > 1) {
    logger.info({ totalPages: pages.length, batchCount: batches.length, generationProfile }, 'generateStructure multi-pass 模式')

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx]
      const isFirstBatch = batchIdx === 0
      const existingPaths = isFirstBatch
        ? externalExistingPaths
        : [...externalExistingPaths, ...allRawComponents.map(c => c.path)]

      logger.info({ batchIdx: batchIdx + 1, totalBatches: batches.length, pages: batch }, 'generateStructure 批次開始')

      // 所有 batch 都傳 streaming handler，確保心跳持續存活（非首 batch 合併已累積結果）
      const batchStreamingHandler = onPartialCode
        ? buildStreamingHandler(
            isFirstBatch
              ? onPartialCode
              : (partial) => onPartialCode({
                  pages: [...allRawPages, ...partial.pages],
                  components: [...allRawComponents, ...partial.components],
                  styles: styles || partial.styles,
                })
          )
        : undefined

      const batchResponse = await callClaude(
        systemPrompt,
        [{ role: 'user', content: buildUserMsg(batch, existingPaths) }],
        multiPassLlmOpts,
        { ...trackingContext, purpose: `generate_structure_b${batchIdx + 1}` },
        batchStreamingHandler,
      )

      if (!batchResponse.success || !batchResponse.content) {
        if (isFirstBatch) return { success: false, error: batchResponse.error || '無法生成結構代碼' }
        logger.warn({ batchIdx, batch, error: batchResponse.error }, 'Multi-pass 批次失敗，跳過')
        continue
      }

      const { pages: bPages, components: bComps, styles: bStyles } = parseGeneratedFiles(batchResponse.content, designSystem)
      if (isFirstBatch) styles = bStyles

      for (const p of bPages) {
        if (!allRawPages.find(x => x.path === p.path)) allRawPages.push(p)
      }
      for (const c of bComps) {
        if (!allRawComponents.find(x => x.path === c.path)) allRawComponents.push(c)
      }

      // 批次完成後刷新心跳 + 更新預覽（覆蓋批次間隙無 streaming 的空窗期）
      if (onPartialCode) {
        onPartialCode({ pages: allRawPages, components: allRawComponents, styles: styles || '' })
      }

      logger.info({ batchIdx: batchIdx + 1, pages: bPages.length, components: bComps.length }, 'generateStructure 批次完成')

      // Checkpoint：批次完成後持久化中途結果，防止進程崩潰時遺失
      if (onCheckpoint && allRawPages.length > 0) {
        await onCheckpoint({ pages: allRawPages, components: allRawComponents, styles: styles || '' })
          .catch(err => logger.warn({ err }, 'Structure batch checkpoint failed'))
      }
    }
  } else {
    // 單次生成
    const response = await callClaude(
      systemPrompt,
      [{ role: 'user', content: buildUserMsg(pages, externalExistingPaths) }],
      singlePassLlmOpts,
      { ...trackingContext, purpose: 'generate_structure' },
      buildStreamingHandler(onPartialCode),
    )

    if (!response.success || !response.content) {
      return { success: false, error: response.error || '無法生成結構代碼' }
    }

    const { pages: rawPages, components: rawComponents, styles: singleStyles } = parseGeneratedFiles(response.content, designSystem)
    allRawPages = rawPages
    allRawComponents = rawComponents
    styles = singleStyles
  }

  // ── Layer 0 防禦：TSX 語法檢查 + LLM 自動修復 ──
  const rawPagePaths = new Set(allRawPages.map(p => p.path))
  const syntaxFixed = await checkAndFixSyntaxErrors([...allRawPages, ...allRawComponents], trackingContext, heartbeatFn, rawPagePaths)
  const generatedPages = syntaxFixed.filter(f => rawPagePaths.has(f.path))
  const generatedComponents = syntaxFixed.filter(f => !rawPagePaths.has(f.path))

  // post-processing 心跳：streaming 結束後仍需刷新 Redis 活動標記，避免被 flowstate-recovery 誤判超時
  if (onPartialCode) {
    onPartialCode({ pages: generatedPages, components: generatedComponents, styles: styles || '' })
  }

  // Checkpoint：語法修復完成後持久化，防止後續 reference repair 期間崩潰遺失
  if (onCheckpoint) {
    await onCheckpoint({ pages: generatedPages, components: generatedComponents, styles: styles || '' })
      .catch(err => logger.warn({ err }, 'Post-syntax-fix checkpoint failed'))
  }

  // ── Layer 1 防禦：驗證組件引用完整性 + LLM 自修復 ──
  const finalPages = generatedPages
  let finalComponents = generatedComponents

  const missingRefs = validateComponentReferences(generatedPages, generatedComponents)
  if (missingRefs.length > 0) {
    logger.info({ count: missingRefs.length, refs: missingRefs.map(r => `${r.file} → ${r.importPath}`) }, 'generateStructure 發現缺失引用')

    // LLM 修復（最多 1 次）
    const repairedComponents = await repairMissingComponents(
      missingRefs, generatedPages, generatedComponents, trackingContext, heartbeatFn
    )

    // 修復後刷新心跳
    if (onPartialCode) {
      onPartialCode({ pages: generatedPages, components: [...generatedComponents, ...repairedComponents], styles: styles || '' })
    }

    if (repairedComponents.length > 0) {
      logger.info({ count: repairedComponents.length, paths: repairedComponents.map(c => c.path) }, '已修復缺失組件')
      finalComponents = [...generatedComponents, ...repairedComponents]

      // Checkpoint：修復完成後持久化最終結果
      if (onCheckpoint) {
        await onCheckpoint({ pages: finalPages, components: finalComponents, styles: styles || '' })
          .catch(err => logger.warn({ err }, 'Post-repair checkpoint failed'))
      }

      // 二次校驗（只 log，不再 LLM）
      const remainingMissing = validateComponentReferences(finalPages, finalComponents)
      if (remainingMissing.length > 0) {
        logger.warn({ count: remainingMissing.length, refs: remainingMissing.map(r => `${r.file} → ${r.importPath}`) }, '修復後仍有缺失引用')
      }
    } else {
      logger.warn('LLM 修復失敗，交給下游 deployer 處理')
    }
  }

  return {
    success: true,
    pages: finalPages,
    components: finalComponents,
    styles,
  }
}

/**
 * 階段 2：添加動畫（Animations）
 * 在現有代碼基礎上添加動畫效果
 */
export async function generateAnimations(
  designSystem: DesignSystem,
  existingCode: CodeBundle,
  designTier?: DesignTier,
  trackingContext?: LlmTrackingContext,
  onPartialCode?: PartialCodeCallback,
  variantConcept?: VariantConcept,
  uiSpecSummary?: string,
  moodId?: string,
  incrementalOptions?: { maxTokens?: number; maxContinuations?: number },
  generationProfile: GenerationProfile = 'balanced',
): Promise<GenerationResult> {
  const tier = designTier || 'functional'
  if (shouldSkipAnimationStage(existingCode, generationProfile)) {
    logger.info({ purpose: trackingContext?.purpose, generationProfile }, '動畫階段跳過：未偵測到 data-animate 意圖')
    return { success: true, pages: existingCode.pages, components: existingCode.components, styles: existingCode.styles }
  }

  const targetCode = selectAnimationTargets(existingCode, generationProfile)
  const promptCode = targetCode.pages.length > 0 || targetCode.components.length > 0 ? targetCode : existingCode

  // ── Prompt Caching：拆分 static + dynamic ──
  const animStaticPrompt = `你是一位專業的前端動畫專家。在現有代碼基礎上添加適當的動畫效果。

## 本階段任務：動畫增強（Animations）
這是第二階段，需要：
1. 添加頁面進入動畫（fade in, slide in）
2. 添加互動反饋動畫（hover, press）
3. 添加狀態轉換動畫（loading, success, error）
4. 添加微動畫（subtle motion）

## 使用 motion/react
必須使用 motion/react（原 framer-motion）：
\`\`\`tsx
'use client'
import { motion } from 'motion/react'

// 入場動畫
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>

// 互動動畫
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
\`\`\`

${getAnimationConstraints(tier)}

## 效能規則（Critical）
### 禁止模式
- 禁止在同一 frame 內交錯讀寫 layout（不要 getBoundingClientRect 後立即 setState）
- 禁止連續動畫 layout 屬性（width, height, top, left, margin, padding）
- 禁止無停止條件的 requestAnimationFrame 迴圈
- 禁止混合多套動畫系統（統一用 motion/react，不要混 CSS animation / GSAP / rAF）

### 正確做法
- 需要 layout-like 動畫（展開/收合）時，用 FLIP 模式：先測量、再用 transform 動畫
- will-change 只在動畫啟動時臨時加，動畫結束後移除，不要全域設定
- 離屏元素必須暫停動畫（用 IntersectionObserver 或 motion/react 的 whileInView）
- paint 屬性（color, background）的動畫只允許在小型獨立元素上

### Blur 與 Filter
- blur 動畫 ≤8px，只用於短暫一次性效果
- 禁止大面積或連續 blur 動畫
- 優先用 opacity + translate 取代 blur

## Transition 規則
- hover 狀態用 color/opacity transition，不要用 scale transform（會 shift layout）
- transition 統一用 transition-colors duration-200
- 禁止 transition-all — 必須列出具體屬性（transition-colors、transition-opacity、transition-transform）

## 禁止
- 不要修改現有的結構和樣式
- 不要修改現有的互動邏輯（Modal 開關、表單 state、事件處理、useState）
- 不要移除任何 'use client' 聲明
- 不要添加響應式設計
- 不要使用 CSS animation（使用 motion/react）

## data-animate 意圖實作（優先執行）
結構代碼中帶 data-animate 屬性的元素代表動畫意圖，你必須實作它們：
1. 找到所有 data-animate 元素
2. 用 motion/react 實作對應動畫（見對應表）
3. **移除 data-animate 屬性**（它只是意圖標記，不留在生產代碼中）

對應實作：
- "fade-up" → initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
- "stagger-children" → variants={container} + variants={item} staggerChildren: 0.1
- "hero-entrance" → initial={{ opacity:0, y:-30, scale:0.95 }} + transition={{ duration:0.6, ease:'easeOut' }}
- "reveal-on-scroll" → useInView hook + whileInView="visible" viewport={{ once:true, margin:'-100px' }}
- "count-up" → useMotionValue + useSpring(val, { stiffness:100, damping:20 }) + useTransform
- "slide-in-left/right" → initial={{ opacity:0, x:±50 }} animate={{ opacity:1, x:0 }}
- "hover-lift" → whileHover={{ y:-4 }} transition={{ type:'spring', stiffness:300 }}
- "parallax" → useScroll + useTransform(scrollY, [0,500], [0,-100])`

  const animDynamicPrompt = buildCompactDesignPrompt(designSystem, { includeMood: true })

  const systemPrompt = buildCacheableSystemBlocks(animStaticPrompt, animDynamicPrompt)

  const existingCodeStr = [
    ...promptCode.pages.map(p => `\`\`\`tsx:${p.path}\n${p.content}\n\`\`\``),
    ...promptCode.components.map(c => `\`\`\`tsx:${c.path}\n${c.content}\n\`\`\``),
    `\`\`\`css:globals.css\n${promptCode.styles}\n\`\`\``,
  ].join('\n\n')

  const conceptReminder = variantConcept
    ? `\n## 設計概念提醒\n動畫風格必須服務於「${variantConcept.name}」的設計概念。${variantConcept.signatureElement ? `Signature Element「${variantConcept.signatureElement}」的動畫尤其重要。` : ''}\n`
    : ''

  const uiSpecHint = uiSpecSummary
    ? `\n## 互動上下文（供動畫決策參考）\n${uiSpecSummary}\n注意：Modal 開關、表單提交、列表增刪 等互動都需要對應的動畫（enter/exit/success）。\n`
    : ''

  const moodAnimSection = moodId
    ? `\n## Mood 動畫風格\n${getMoodAnimationHint(moodId)}\n`
    : designSystem.animationPersonality
    ? `\n## 動畫個性（補充指引）\n${getAnimationPersonalityHint(designSystem.animationPersonality)}\n`
    : ''

  const isDiffMode = getEnv().ENABLE_DIFF_OUTPUT

  const outputFormatInstructions = isDiffMode
    ? `## 輸出格式（SEARCH/REPLACE）
使用精確的 SEARCH/REPLACE block 輸出每一處修改：

<<<<<<< SEARCH:path/to/file.tsx
要修改的原始代碼片段（必須與現有代碼精確匹配，包含縮排）
=======
修改後的代碼片段
>>>>>>> REPLACE

規則：
1. SEARCH 部分必須精確匹配現有代碼（包含空白和縮排），確保唯一定位
2. 每個 block 修改一處位置，同一檔案多處修改用多個 block
3. SEARCH 包含 3-5 行上下文確保唯一匹配
4. 新增 import 時，SEARCH 匹配原始 import 區段
5. 新建檔案用 CREATE 格式（SEARCH 留空）：
<<<<<<< CREATE:path/to/new-file.tsx
=======
新檔案完整內容
>>>>>>> REPLACE
6. CSS 修改用 <<<<<<< SEARCH:globals.css
7. 不要輸出任何 code fence 格式，只用 SEARCH/REPLACE block`
    : `⚠️ code fence 規則：每個 code block 的第一行必須直接是代碼，禁止在代碼前加任何說明文字。

請輸出完整的修改後代碼，保持相同的檔案路徑格式。`

  // Plan D: 拆分 user message 為 cached code block + task block
  const codeBlock = `## 專案檔案清單（未列出內容的檔案視為只讀）
${buildCodeManifest(existingCode)}

## 現有代碼
${existingCodeStr}`

  const taskBlock = `請在以上代碼基礎上添加動畫效果：
${conceptReminder}${moodAnimSection}${uiSpecHint}
## 需要添加的動畫
1. 頁面/區塊入場動畫（stagger effect）
2. 按鈕 hover/tap 動畫
3. 卡片 hover 提升效果
4. Loading skeleton 動畫
5. 表單輸入 focus 動畫

⚠️ 自給自足規則：如果你新增了 import 引用內部模組（@/ 或 ./），你必須同時輸出該檔案。禁止引用不存在的內部模組。
${outputFormatInstructions}`

  const userContent = buildCacheableUserMessage(codeBlock, taskBlock)

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userContent }],
    {
      maxTokens: incrementalOptions?.maxTokens || 32768,
      temperature: tier === 'creative' ? 0.35 : 0.2,
      maxContinuations: incrementalOptions?.maxContinuations ?? 2,
      promptLabel: 'uiux-animation',
      contextSizeHint: generationProfile,
    },
    { ...trackingContext, purpose: 'generate_animations' },
    isDiffMode ? buildDiffStreamingHandler(existingCode, onPartialCode) : buildStreamingHandler(onPartialCode)
  )

  if (!response.success || !response.content) {
    return { success: false, error: response.error || '無法生成動畫代碼' }
  }

  // ── 解析回應：diff 模式或 full-file 模式 ──
  let mergedResult: CodeBundle

  if (isDiffMode) {
    const srBlocks = parseSearchReplaceBlocks(response.content)
    if (srBlocks && srBlocks.length > 0) {
      const applyResult = applySearchReplace(existingCode, srBlocks)
      if (applyResult.failedBlocks.length > 0) {
        logger.warn({
          applied: applyResult.appliedCount,
          failed: applyResult.failedBlocks.length,
          failedPaths: applyResult.failedBlocks.map(b => b.filePath),
        }, 'Animation diff 部分失敗')
      }
      if (applyResult.appliedCount > 0) {
        mergedResult = applyResult.updatedCode
      } else {
        // 全部失敗 → fallback full-file
        logger.warn('Animation diff 全部失敗，fallback full-file 解析')
        const parsed = parseGeneratedFiles(response.content, designSystem)
        mergedResult = mergeCodeBundle(existingCode, parsed)
      }
    } else {
      // 沒有 diff blocks → LLM 可能無視指令，fallback full-file
      logger.info('Animation 未偵測到 diff blocks，fallback full-file 解析')
      const parsed = parseGeneratedFiles(response.content, designSystem)
      mergedResult = mergeCodeBundle(existingCode, parsed)
    }
  } else {
    const { pages: rawAnimPages, components: rawAnimComps, styles } = parseGeneratedFiles(response.content, designSystem)
    const finalStyles = styles || existingCode.styles
    mergedResult = mergeCodeBundle(existingCode, { pages: rawAnimPages, components: rawAnimComps, styles: finalStyles })
  }

  // ── Layer 0 防禦：TSX 語法檢查 + LLM 自動修復 ──
  const allFiles = [...mergedResult.pages, ...mergedResult.components]
  const syntaxFixed = await checkAndFixSyntaxErrors(allFiles, trackingContext)
  const pagePathSet = new Set(mergedResult.pages.map(p => p.path))
  const pages = syntaxFixed.filter(f => pagePathSet.has(f.path))
  const components = syntaxFixed.filter(f => !pagePathSet.has(f.path))

  return {
    success: true,
    pages,
    components,
    styles: mergedResult.styles,
  }
}

/**
 * 階段 3：添加響應式設計（RWD）
 * 在現有代碼基礎上添加響應式設計
 */
export async function generateRwd(
  designSystem: DesignSystem,
  existingCode: CodeBundle,
  designTier?: DesignTier,
  trackingContext?: LlmTrackingContext,
  onPartialCode?: PartialCodeCallback,
  variantConcept?: VariantConcept,
  uiSpecSummary?: string,
  layoutMode?: 'app' | 'website',
  moodId?: string,
  incrementalOptions?: { maxTokens?: number; maxContinuations?: number },
  generationProfile: GenerationProfile = 'balanced',
): Promise<GenerationResult> {
  const tier = designTier || 'functional'
  if (shouldSkipRwdStage(existingCode, generationProfile)) {
    logger.info({ purpose: trackingContext?.purpose, generationProfile }, 'RWD 階段跳過：既有響應式 class 已足夠')
    return { success: true, pages: existingCode.pages, components: existingCode.components, styles: existingCode.styles }
  }

  const targetCode = selectRwdTargets(existingCode, generationProfile)
  const promptCode = targetCode.pages.length > 0 || targetCode.components.length > 0 ? targetCode : existingCode

  const rwdTierHint = tier === 'creative'
    ? `## Design Tier: Creative（創意型 RWD）
- 移動端可以保留表現力（漸層背景、獨特字體仍然適用）
- 斷點切換可以有設計巧思（不只是堆疊，可以重新編排佈局）
- 移動端 hero section 可以有不同的視覺表現
- 仍然必須遵守觸控目標 44px 和可讀性規則`
    : `## Design Tier: Functional（功能型 RWD）
- 移動端注重資訊效率和操作便利
- 斷點切換以堆疊和簡化為主
- 保持乾淨、功能優先的移動端體驗`

  // ── Prompt Caching：拆分 static + dynamic ──
  const rwdStaticPrompt = `你是一位專業的響應式設計專家。在現有代碼基礎上添加完整的響應式設計。

## 本階段任務：響應式設計（RWD）
這是第三階段，需要：
1. 添加移動端佈局（< 768px）
2. 添加平板佈局（768px - 1024px）
3. ${layoutMode === 'app' ? '側邊欄移動端折疊（底部導航或抽屜）' : '添加移動端導航（漢堡選單）'}
4. 添加觸控優化

## Tailwind 響應式斷點
\`\`\`
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
\`\`\`

## 響應式設計規則
- Mobile-first：從小螢幕開始設計
- 使用 Tailwind 響應式前綴：md:, lg:, xl:
- 移動端觸控目標至少 44px × 44px
- 移動端字體可讀性（最小 16px）
- 圖片使用 responsive srcset

${layoutMode === 'app'
? `## 應用型移動端導航
- 如有側邊欄：移動端折疊為底部導航欄或抽屜式導航
- 單頁工具不需要額外導航組件
- 功能面板在移動端改為垂直堆疊`
: `## 移動端導航
- 提供漢堡選單（使用 Radix Dialog 或 Sheet）
- 選單打開時鎖定背景滾動
- 支援鍵盤導航和 ESC 關閉`}

## 禁止
- 不要移除現有的動畫效果
- 不要修改現有的互動邏輯（Modal 開關、表單 state、事件處理、useState）
- 不要移除任何 'use client' 聲明
- 不要改變現有的桌面版佈局
- 不要使用 display: none 隱藏重要內容（用 sr-only）
- 不要破壞無障礙功能

## Pre-Delivery Checklist（輸出前自我確認）
- [ ] 移動端最小字體 16px（避免 iOS 自動放大）
- [ ] 觸控目標至少 44×44px，touch-action: manipulation
- [ ] Flex 子元素有 min-w-0（truncate 才能生效）
- [ ] 固定元素尊重 safe-area-inset
- [ ] 圖片有 explicit width/height 或 aspect-ratio 防 CLS
- [ ] 可點擊元素有 focus-visible ring
- [ ] 表單 inputmode 正確（email/tel/numeric）
- [ ] Modal/Drawer 有 overscroll-behavior: contain
- [ ] 尊重 prefers-reduced-motion，禁止 transition-all
- [ ] ${layoutMode === 'app' ? '移動端功能完整可用' : '移動端漢堡選單可用且可關閉'}`

  const rwdDynamicPrompt = `${buildCompactDesignPrompt(designSystem, { includeMood: true })}

${rwdTierHint}`

  const systemPrompt = buildCacheableSystemBlocks(rwdStaticPrompt, rwdDynamicPrompt)

  const existingCodeStr = [
    ...promptCode.pages.map(p => `\`\`\`tsx:${p.path}\n${p.content}\n\`\`\``),
    ...promptCode.components.map(c => `\`\`\`tsx:${c.path}\n${c.content}\n\`\`\``),
    `\`\`\`css:globals.css\n${promptCode.styles}\n\`\`\``,
  ].join('\n\n')

  const rwdConceptReminder = variantConcept
    ? `\n## 設計概念提醒\n移動端適配時保持「${variantConcept.name}」的設計概念完整性，不要在小螢幕上退化為通用佈局。\n`
    : ''

  const rwdUiSpecHint = uiSpecSummary
    ? `\n## 互動上下文（供響應式決策參考）\n${uiSpecSummary}\n注意：表格在移動端需要橫向滾動或卡片化；表單需要全寬；多步驟流程需要移動端友好的步驟指示器。\n`
    : ''

  const moodRwdSection = moodId
    ? `\n## Mood RWD 指引\n${getMoodRwdHint(moodId)}\n`
    : ''

  const isDiffMode = getEnv().ENABLE_DIFF_OUTPUT

  const rwdOutputFormatInstructions = isDiffMode
    ? `## 輸出格式（SEARCH/REPLACE）
使用精確的 SEARCH/REPLACE block 輸出每一處修改：

<<<<<<< SEARCH:path/to/file.tsx
要修改的原始代碼片段（必須與現有代碼精確匹配，包含縮排）
=======
修改後的代碼片段
>>>>>>> REPLACE

規則：
1. SEARCH 部分必須精確匹配現有代碼（包含空白和縮排），確保唯一定位
2. 每個 block 修改一處位置，同一檔案多處修改用多個 block
3. SEARCH 包含 3-5 行上下文確保唯一匹配
4. 新增 import 時，SEARCH 匹配原始 import 區段
5. 新建檔案用 CREATE 格式（SEARCH 留空）
6. CSS 修改用 <<<<<<< SEARCH:globals.css
7. 不要輸出任何 code fence 格式，只用 SEARCH/REPLACE block`
    : `⚠️ 選擇性輸出（重要效率規則）：
只輸出你實際添加了響應式 class 的檔案。沒有修改的檔案完全省略（不輸出 code block）。
若你新增了 import 引用內部模組（@/ 或 ./），你必須同時輸出該檔案。
⚠️ code fence 規則：每個 code block 的第一行必須直接是代碼，禁止在代碼前加任何說明文字。
保持相同的檔案路徑格式。`

  // Plan D: 拆分 user message 為 cached code block + task block
  const rwdCodeBlock = `## 專案檔案清單（未列出內容的檔案視為只讀）
${buildCodeManifest(existingCode)}

## 現有代碼
${existingCodeStr}`

  const rwdTaskBlock = `請在以上代碼基礎上添加響應式設計：
${rwdConceptReminder}${moodRwdSection}${rwdUiSpecHint}
## 需要添加的響應式功能
1. ${layoutMode === 'app' ? '功能面板響應式堆疊（側邊欄折疊或底部導航）' : 'Header 移動端漢堡選單'}
2. 網格佈局響應式調整（4列→2列→1列）
3. 側邊欄折疊或變成底部導航
4. 表單輸入移動端優化
5. 卡片堆疊佈局
6. 字體和間距響應式調整

${rwdOutputFormatInstructions}`

  const rwdUserContent = buildCacheableUserMessage(rwdCodeBlock, rwdTaskBlock)

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: rwdUserContent }],
    {
      maxTokens: incrementalOptions?.maxTokens || 32768,
      temperature: 0.2,
      maxContinuations: incrementalOptions?.maxContinuations
        ?? (generationProfile === 'fast' ? 1 : 2),
      promptLabel: 'uiux-rwd',
      contextSizeHint: generationProfile,
    },
    { ...trackingContext, purpose: 'generate_rwd' },
    isDiffMode ? buildDiffStreamingHandler(existingCode, onPartialCode) : buildStreamingHandler(onPartialCode)
  )

  if (!response.success || !response.content) {
    return { success: false, error: response.error || '無法生成響應式代碼' }
  }

  // ── 解析回應：diff 模式或 full-file 模式 ──
  let mergedResult: CodeBundle

  if (isDiffMode) {
    const srBlocks = parseSearchReplaceBlocks(response.content)
    if (srBlocks && srBlocks.length > 0) {
      const applyResult = applySearchReplace(existingCode, srBlocks)
      if (applyResult.failedBlocks.length > 0) {
        logger.warn({
          applied: applyResult.appliedCount,
          failed: applyResult.failedBlocks.length,
          failedPaths: applyResult.failedBlocks.map(b => b.filePath),
        }, 'RWD diff 部分失敗')
      }
      if (applyResult.appliedCount > 0) {
        mergedResult = applyResult.updatedCode
      } else {
        logger.warn('RWD diff 全部失敗，fallback full-file 解析')
        const parsed = parseGeneratedFiles(response.content, designSystem)
        mergedResult = mergeCodeBundle(existingCode, parsed)
      }
    } else {
      logger.info('RWD 未偵測到 diff blocks，fallback full-file 解析')
      const parsed = parseGeneratedFiles(response.content, designSystem)
      mergedResult = mergeCodeBundle(existingCode, parsed)
    }
  } else {
    const { pages: rawRwdPages, components: rawRwdComps, styles: parsedStyles } = parseGeneratedFiles(response.content, designSystem)
    const finalStyles = parsedStyles || existingCode.styles

    // Per-file merge
    const rwdPageMap = new Map(rawRwdPages.map(p => [p.path, p]))
    const rwdCompMap = new Map(rawRwdComps.map(c => [c.path, c]))
    mergedResult = {
      pages: [
        ...existingCode.pages.map(p => rwdPageMap.get(p.path) ?? p),
        ...rawRwdPages.filter(p => !existingCode.pages.find(e => e.path === p.path)),
      ],
      components: [
        ...existingCode.components.map(c => rwdCompMap.get(c.path) ?? c),
        ...rawRwdComps.filter(c => !existingCode.components.find(e => e.path === c.path)),
      ],
      styles: finalStyles,
    }
  }

  // ── Layer 0 防禦：TSX 語法檢查 + LLM 自動修復 ──
  const allRwdFiles = [...mergedResult.pages, ...mergedResult.components]
  const rwdSyntaxFixed = await checkAndFixSyntaxErrors(allRwdFiles, trackingContext)
  const rwdPagePathSet = new Set(mergedResult.pages.map(p => p.path))
  const finalPages = rwdSyntaxFixed.filter(f => rwdPagePathSet.has(f.path))
  const finalComps = rwdSyntaxFixed.filter(f => !rwdPagePathSet.has(f.path))

  // Safety net: 如果 LLM 沒有產出響應式 class，自動注入基本響應式模式
  const responsiveCode = ensureResponsiveClasses(finalPages, finalComps)

  return {
    success: true,
    pages: responsiveCode.pages,
    components: responsiveCode.components,
    styles: mergedResult.styles,
  }
}

/**
 * 合併版 Animation + RWD（Fast Build 專用）
 * 將 3 次 Sonnet 降為 2 次，節省 ~$0.05-0.09/次 + 30-60 秒延遲。
 * 由 env FAST_BUILD_MERGED_ANIM_RWD 控制，預設 OFF。
 */
export async function generateAnimationsAndRwd(
  designSystem: DesignSystem,
  existingCode: CodeBundle,
  designTier?: DesignTier,
  trackingContext?: LlmTrackingContext,
  onPartialCode?: PartialCodeCallback,
  variantConcept?: VariantConcept,
  uiSpecSummary?: string,
  layoutMode?: 'app' | 'website',
  moodId?: string,
  incrementalOptions?: { maxTokens?: number; maxContinuations?: number },
  generationProfile: GenerationProfile = 'fast',
): Promise<GenerationResult> {
  const tier = designTier || 'functional'

  // 如果兩個階段都該跳過，直接返回
  const skipAnim = shouldSkipAnimationStage(existingCode, generationProfile)
  const skipRwd = shouldSkipRwdStage(existingCode, generationProfile)
  if (skipAnim && skipRwd) {
    logger.info({ purpose: trackingContext?.purpose }, 'Animation+RWD 合併階段跳過：無需動畫且響應式已足夠')
    return { success: true, pages: existingCode.pages, components: existingCode.components, styles: existingCode.styles }
  }

  // 聯集 target：需要動畫或 RWD 的檔案
  const animTargets = selectAnimationTargets(existingCode, generationProfile)
  const rwdTargets = selectRwdTargets(existingCode, generationProfile)
  const allTargetPaths = new Set([
    ...animTargets.pages.map(p => p.path),
    ...animTargets.components.map(c => c.path),
    ...rwdTargets.pages.map(p => p.path),
    ...rwdTargets.components.map(c => c.path),
  ])
  const promptCode: CodeBundle = {
    pages: existingCode.pages.filter(p => allTargetPaths.has(p.path)),
    components: existingCode.components.filter(c => allTargetPaths.has(c.path)),
    styles: existingCode.styles,
  }
  // 如果 target 為空，用完整代碼
  if (promptCode.pages.length === 0 && promptCode.components.length === 0) {
    promptCode.pages = existingCode.pages
    promptCode.components = existingCode.components
  }

  // ── 動態構建任務描述 ──
  const taskDescription = skipAnim
    ? '本次只需添加響應式設計（動畫已足夠）。'
    : skipRwd
    ? '本次只需添加動畫效果（響應式已足夠）。'
    : '本次需同時完成動畫增強和響應式適配。'

  // ── Static prompt（跨 flow cacheable）──
  const mergedStaticPrompt = `你是一位專業的前端工程師。在現有代碼基礎上完成動畫增強與響應式適配。

${taskDescription}

${!skipAnim ? `## 任務 A：動畫增強（Animations）
1. 添加頁面進入動畫（fade in, slide in）
2. 添加互動反饋動畫（hover, press）
3. 添加狀態轉換動畫（loading, success, error）
4. 添加微動畫（subtle motion）

### 使用 motion/react
必須使用 motion/react（原 framer-motion）：
\`\`\`tsx
'use client'
import { motion } from 'motion/react'

// 入場動畫
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>

// 互動動畫
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
\`\`\`

${getAnimationConstraints(tier)}

### 動畫效能規則（Critical）
- 禁止在同一 frame 內交錯讀寫 layout
- 禁止連續動畫 layout 屬性（width, height, top, left, margin, padding）
- 禁止混合多套動畫系統（統一用 motion/react）
- blur 動畫 ≤8px，只用於短暫效果
- hover 用 color/opacity transition，禁止 transition-all
- 離屏元素用 whileInView 暫停

### data-animate 意圖實作（優先執行）
結構代碼中帶 data-animate 屬性的元素代表動畫意圖，你必須實作它們：
1. 找到所有 data-animate 元素
2. 用 motion/react 實作對應動畫
3. **移除 data-animate 屬性**

對應實作：
- "fade-up" → initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
- "stagger-children" → variants + staggerChildren: 0.1
- "hero-entrance" → initial={{ opacity:0, y:-30, scale:0.95 }}
- "reveal-on-scroll" → whileInView="visible" viewport={{ once:true }}
- "count-up" → useMotionValue + useSpring + useTransform
- "slide-in-left/right" → initial={{ opacity:0, x:±50 }}
- "hover-lift" → whileHover={{ y:-4 }}
- "parallax" → useScroll + useTransform
` : ''}

${!skipRwd ? `## 任務 B：響應式適配（RWD）
1. 添加移動端佈局（< 768px）
2. 添加平板佈局（768px - 1024px）
3. ${layoutMode === 'app' ? '側邊欄移動端折疊（底部導航或抽屜）' : '添加移動端導航（漢堡選單）'}
4. 添加觸控優化

### Tailwind 響應式斷點
sm: 640px / md: 768px / lg: 1024px / xl: 1280px

### 響應式設計規則
- Mobile-first：從小螢幕開始
- 使用 Tailwind 前綴：md:, lg:, xl:
- 觸控目標至少 44px × 44px
- 移動端字體最小 16px

${layoutMode === 'app'
? `### 應用型移動端導航
- 側邊欄移動端折疊為底部導航或抽屜`
: `### 移動端導航
- 提供漢堡選單（Radix Dialog 或 Sheet）
- 選單打開時鎖定背景滾動`}

### Pre-Delivery Checklist
- 觸控目標 44×44px, touch-action: manipulation
- Flex 子元素 min-w-0
- 固定元素 safe-area-inset
- 圖片 aspect-ratio 防 CLS
- focus-visible ring
- 表單 inputmode 正確
- prefers-reduced-motion
` : ''}

## 禁止
- 不要修改現有的結構和樣式邏輯
- 不要修改現有的互動邏輯（Modal 開關、表單 state、事件處理、useState）
- 不要移除任何 'use client' 聲明
- 不要使用 CSS animation（使用 motion/react）
- 不要使用 display: none 隱藏重要內容

## 重要
- 移動端動畫可以簡化（reduce motion for small screens）`

  // ── Dynamic prompt（每次不同）──
  const mergedDynamicPrompt = buildCompactDesignPrompt(designSystem, { includeMood: true })

  const systemPrompt = buildCacheableSystemBlocks(mergedStaticPrompt, mergedDynamicPrompt)

  const existingCodeStr = [
    ...promptCode.pages.map(p => `\`\`\`tsx:${p.path}\n${p.content}\n\`\`\``),
    ...promptCode.components.map(c => `\`\`\`tsx:${c.path}\n${c.content}\n\`\`\``),
    `\`\`\`css:globals.css\n${promptCode.styles}\n\`\`\``,
  ].join('\n\n')

  const conceptReminder = variantConcept
    ? `\n## 設計概念提醒\n動畫和響應式風格必須服務於「${variantConcept.name}」的設計概念。${variantConcept.signatureElement ? `Signature Element「${variantConcept.signatureElement}」尤其重要。` : ''}\n`
    : ''

  const uiSpecHint = uiSpecSummary
    ? `\n## 互動上下文\n${uiSpecSummary}\n`
    : ''

  const moodSection = moodId
    ? `\n## Mood 指引\n動畫：${getMoodAnimationHint(moodId)}\nRWD：${getMoodRwdHint(moodId)}\n`
    : ''

  const isDiffMode = getEnv().ENABLE_DIFF_OUTPUT

  const mergedOutputInstructions = isDiffMode
    ? `## 輸出格式（SEARCH/REPLACE）
使用精確的 SEARCH/REPLACE block 輸出每一處修改：

<<<<<<< SEARCH:path/to/file.tsx
要修改的原始代碼片段（必須與現有代碼精確匹配，包含縮排）
=======
修改後的代碼片段
>>>>>>> REPLACE

規則：
1. SEARCH 部分必須精確匹配現有代碼（包含空白和縮排），確保唯一定位
2. 每個 block 修改一處位置，同一檔案多處修改用多個 block
3. SEARCH 包含 3-5 行上下文確保唯一匹配
4. 新增 import 時，SEARCH 匹配原始 import 區段
5. 新建檔案用 CREATE 格式（SEARCH 留空）
6. CSS 修改用 <<<<<<< SEARCH:globals.css
7. 不要輸出任何 code fence 格式，只用 SEARCH/REPLACE block`
    : `⚠️ 選擇性輸出（重要效率規則）：
只輸出你實際修改的檔案。沒有修改的檔案完全省略。
若你新增了 import 引用內部模組（@/ 或 ./），你必須同時輸出該檔案。
⚠️ code fence 規則：每個 code block 的第一行必須直接是代碼，禁止在代碼前加任何說明文字。
保持相同的檔案路徑格式。`

  // Plan D: 拆分 user message
  const mergedCodeBlock = `## 專案檔案清單（未列出內容的檔案視為只讀）
${buildCodeManifest(existingCode)}

## 現有代碼
${existingCodeStr}`

  const mergedTaskBlock = `請在以上代碼基礎上同時添加動畫效果和響應式設計：
${conceptReminder}${moodSection}${uiSpecHint}
${mergedOutputInstructions}`

  const mergedUserContent = buildCacheableUserMessage(mergedCodeBlock, mergedTaskBlock)

  // Temperature：取兩階段中較高的（creative animation 0.35 > rwd 0.2）
  const temperature = tier === 'creative' ? 0.35 : 0.2

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: mergedUserContent }],
    {
      maxTokens: incrementalOptions?.maxTokens || 32768,
      temperature,
      maxContinuations: incrementalOptions?.maxContinuations ?? 1,
      promptLabel: 'uiux-animation-rwd-merged',
      contextSizeHint: generationProfile,
    },
    { ...trackingContext, purpose: 'generate_animation_rwd_merged' },
    isDiffMode ? buildDiffStreamingHandler(existingCode, onPartialCode) : buildStreamingHandler(onPartialCode)
  )

  if (!response.success || !response.content) {
    return { success: false, error: response.error || '無法生成動畫+響應式代碼' }
  }

  // ── 解析回應：diff 模式或 full-file 模式 ──
  let mergedResult: CodeBundle

  if (isDiffMode) {
    const srBlocks = parseSearchReplaceBlocks(response.content)
    if (srBlocks && srBlocks.length > 0) {
      const applyResult = applySearchReplace(existingCode, srBlocks)
      if (applyResult.failedBlocks.length > 0) {
        logger.warn({
          applied: applyResult.appliedCount,
          failed: applyResult.failedBlocks.length,
          failedPaths: applyResult.failedBlocks.map(b => b.filePath),
        }, 'Merged anim+rwd diff 部分失敗')
      }
      if (applyResult.appliedCount > 0) {
        mergedResult = applyResult.updatedCode
      } else {
        logger.warn('Merged anim+rwd diff 全部失敗，fallback full-file 解析')
        const parsed = parseGeneratedFiles(response.content, designSystem)
        mergedResult = mergeCodeBundle(existingCode, parsed)
      }
    } else {
      logger.info('Merged anim+rwd 未偵測到 diff blocks，fallback full-file 解析')
      const parsed = parseGeneratedFiles(response.content, designSystem)
      mergedResult = mergeCodeBundle(existingCode, parsed)
    }
  } else {
    const { pages: rawPages, components: rawComps, styles: parsedStyles } = parseGeneratedFiles(response.content, designSystem)
    const finalStyles = parsedStyles || existingCode.styles

    const pageMap = new Map(rawPages.map(p => [p.path, p]))
    const compMap = new Map(rawComps.map(c => [c.path, c]))
    mergedResult = {
      pages: [
        ...existingCode.pages.map(p => pageMap.get(p.path) ?? p),
        ...rawPages.filter(p => !existingCode.pages.find(e => e.path === p.path)),
      ],
      components: [
        ...existingCode.components.map(c => compMap.get(c.path) ?? c),
        ...rawComps.filter(c => !existingCode.components.find(e => e.path === c.path)),
      ],
      styles: finalStyles,
    }
  }

  // TSX 語法檢查 + LLM 自動修復
  const allMergedFiles = [...mergedResult.pages, ...mergedResult.components]
  const syntaxFixed = await checkAndFixSyntaxErrors(allMergedFiles, trackingContext)
  const mergedPagePathSet = new Set(mergedResult.pages.map(p => p.path))
  const finalPages = syntaxFixed.filter(f => mergedPagePathSet.has(f.path))
  const finalComps = syntaxFixed.filter(f => !mergedPagePathSet.has(f.path))

  // Safety net: RWD fallback
  const responsiveCode = ensureResponsiveClasses(finalPages, finalComps)

  return {
    success: true,
    pages: responsiveCode.pages,
    components: responsiveCode.components,
    styles: mergedResult.styles,
  }
}

/**
 * 基於最終 Design System 一次性生成所有代碼（舊版，保留相容性）
 * @deprecated 建議使用三階段生成：generateStructure → generateAnimations → generateRwd
 */
export async function generateAllCode(
  designSystem: DesignSystem,
  pages: string[],
  template: TemplateData,
  bddSpec?: string,
  designTier?: DesignTier,
  trackingContext?: LlmTrackingContext
): Promise<GenerationResult> {
  // 使用三階段生成
  logger.info('generateAllCode: 使用三階段生成流程')

  // 階段 1：結構
  const structureResult = await generateStructure(designSystem, pages, template, bddSpec, designTier, undefined, trackingContext)
  if (!structureResult.success) {
    return structureResult
  }

  // 階段 2：動畫（失敗時 fallback 到階段 1 產出）
  const animationResult = await generateAnimations(
    designSystem,
    {
      pages: structureResult.pages || [],
      components: structureResult.components || [],
      styles: structureResult.styles || '',
    },
    designTier,
    trackingContext
  )
  const stage2Output = animationResult.success ? animationResult : structureResult
  if (!animationResult.success) {
    logger.warn({ error: animationResult.error }, 'generateAllCode: 動畫生成失敗，使用結構產出繼續')
  }

  // 階段 3：RWD（失敗時 fallback 到階段 2 產出）
  const rwdResult = await generateRwd(
    designSystem,
    {
      pages: stage2Output.pages || [],
      components: stage2Output.components || [],
      styles: stage2Output.styles || '',
    },
    designTier,
    trackingContext
  )
  if (!rwdResult.success) {
    logger.warn({ error: rwdResult.error }, 'generateAllCode: RWD 生成失敗，使用前一階段產出')
    return stage2Output
  }

  return rwdResult
}

/**
 * 從 Template 和 BDD Session 構建 DesignBrief
 */
export function buildDesignBrief(
  template: TemplateData,
  productType: string,
  userPreferences?: {
    colorPreference?: string
    darkMode?: boolean
    brandColor?: string
  }
): {
  scope: 'full'
  productType: string
  style: {
    direction: string
    references: string[]
    adjectives: string[]
  }
  color: {
    preference: string
    brandColor?: string
    darkMode: boolean
  }
  persona: {
    primary: string
    context: string
  }
} {
  // 從模板推斷風格方向
  const styleDirection = inferStyleDirection(template.category)

  return {
    scope: 'full' as const,
    productType,
    style: {
      direction: styleDirection.direction,
      references: styleDirection.references,
      adjectives: styleDirection.adjectives,
    },
    color: {
      preference: userPreferences?.colorPreference || template.designDefaults?.colorScheme || 'neutral',
      brandColor: userPreferences?.brandColor,
      darkMode: userPreferences?.darkMode ?? false,
    },
    persona: {
      primary: inferPrimaryPersona(template.category),
      context: `使用 ${template.name} 模板`,
    },
  }
}

/**
 * 根據模板類別推斷風格方向
 */
function inferStyleDirection(category: string): {
  direction: string
  references: string[]
  adjectives: string[]
} {
  const styleMap: Record<string, { direction: string; references: string[]; adjectives: string[] }> = {
    'saas': {
      direction: 'Modern SaaS',
      references: ['Linear', 'Notion', 'Vercel'],
      adjectives: ['clean', 'minimal', 'professional'],
    },
    'ecommerce': {
      direction: 'E-commerce',
      references: ['Shopify', 'Stripe'],
      adjectives: ['trustworthy', 'conversion-focused', 'clean'],
    },
    'portfolio': {
      direction: 'Creative Portfolio',
      references: ['Awwwards', 'Dribbble'],
      adjectives: ['creative', 'expressive', 'unique'],
    },
    'dashboard': {
      direction: 'Data Dashboard',
      references: ['Grafana', 'Datadog'],
      adjectives: ['dense', 'informative', 'functional'],
    },
    'landing': {
      direction: 'Landing Page',
      references: ['Webflow templates', 'Framer templates'],
      adjectives: ['engaging', 'conversion-focused', 'storytelling'],
    },
  }

  return styleMap[category.toLowerCase()] || {
    direction: 'Modern Web',
    references: ['Apple', 'Stripe'],
    adjectives: ['clean', 'modern', 'professional'],
  }
}

/**
 * 根據模板類別推斷主要用戶
 */
function inferPrimaryPersona(category: string): string {
  const personaMap: Record<string, string> = {
    'saas': '企業用戶 / 專業人士',
    'ecommerce': '一般消費者',
    'portfolio': '潛在客戶 / 招聘者',
    'dashboard': '數據分析師 / 管理者',
    'landing': '潛在客戶 / 訪客',
  }

  return personaMap[category.toLowerCase()] || '一般用戶'
}

/**
 * 生成 Tailwind 配置
 */
export function generateTailwindConfig(designSystem: DesignSystem): string {
  return `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './utils/**/*.{js,ts,jsx,tsx}',
    './types/**/*.{js,ts,jsx,tsx}',
    './context/**/*.{js,ts,jsx,tsx}',
    './stores/**/*.{js,ts,jsx,tsx}',
    './data/**/*.{js,ts,jsx,tsx}',
    './config/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '${designSystem.colorPalette.primary}',
        secondary: '${designSystem.colorPalette.secondary}',
        accent: '${designSystem.colorPalette.accent}',
        background: '${designSystem.colorPalette.background}',
        foreground: '${designSystem.colorPalette.foreground}',
        muted: '${designSystem.colorPalette.muted}',
        border: '${designSystem.colorPalette.border}',
        ${designSystem.colorPalette.destructive ? `destructive: '${designSystem.colorPalette.destructive}',` : ''}
        ${designSystem.colorPalette.success ? `success: '${designSystem.colorPalette.success}',` : ''}
      },
      fontFamily: {
        ${(designSystem.tailwindExtend.fontFamily && Object.keys(designSystem.tailwindExtend.fontFamily).length > 0)
          ? Object.entries(designSystem.tailwindExtend.fontFamily).map(
              ([key, fonts]) => `${key}: [${(fonts as string[]).map(f => `'${f.replace(/['"]/g, '')}'`).join(', ')}]`
            ).join(',\n        ')
          : `sans: ['${designSystem.typography.fontFamily.split(',')[0].trim().replace(/['"]/g, '')}', 'system-ui', 'sans-serif']`
        },
      },
      borderRadius: {
        none: '${designSystem.borderRadius.none}',
        sm: '${designSystem.borderRadius.sm}',
        md: '${designSystem.borderRadius.md}',
        lg: '${designSystem.borderRadius.lg}',
        full: '${designSystem.borderRadius.full}',
      },
      spacing: {
        ${Object.entries(designSystem.spacing.scale).map(([k, v]) => `'${k}': '${v}'`).join(',\n        ')}
      },
    },
  },
  plugins: [],
}

export default config`
}

// ============================================================
// Design Brief 確認（Discovery → Design Lab 之間的銜接環節）
// ============================================================

/**
 * Design Brief 結構
 */
export interface DesignBrief {
  styleSummary: string
  colorDirection: string
  layoutSuggestion: string
  referenceAnalysis: string
  professionalRecommendations: string[]
  sourceType: 'ideas' | 'template'
  recommendedTier: DesignTier      // AI 推薦的設計模式
  tierReason: string               // 推薦原因
  domainKeywords?: string[]        // Domain 探索關鍵概念
  signature?: string               // Signature element 描述
  recommendedMood?: string         // AI/規則推薦的 mood ID
}

/**
 * 生成 Design Brief
 * AI 設計顧問總結用戶的設計方向，給出專業建議
 */
export async function generateDesignBrief(
  template: TemplateData,
  bddSpec: string,
  productType: string,
  userIdeas: Array<{ step: string; answer: string }> | null,
  sourceType: 'ideas' | 'template',
  trackingContext?: LlmTrackingContext,
  referenceAnalysis?: import('./reference-analyzer').ReferenceAnalysis
): Promise<{
  success: boolean
  brief?: DesignBrief
  displayText?: string
  error?: string
}> {
  const ideasContext = sourceType === 'ideas' && userIdeas
    ? `## 用戶的設計想法
${userIdeas.map(i => `- **${i.step}**: ${i.answer}`).join('\n')}`
    : ''

  const templateContext = `## 模板資訊
- 名稱：${template.name}
- 類別：${template.category}
- 描述：${template.description}
- 設計默認值：${JSON.stringify(template.designDefaults, null, 2)}`

  // 參考網站真實分析（截圖 + Vision + 結構化數據）
  const structuredBriefRef = referenceAnalysis ? formatStructuredDataForPrompt(referenceAnalysis) : ''
  const referenceContext = referenceAnalysis?.visionAnalysis
    ? `## 參考網站真實分析（基於截圖的 AI 視覺分析 — 高優先）
URL: ${referenceAnalysis.url}
${referenceAnalysis.metadata?.title ? `網站標題: ${referenceAnalysis.metadata.title}` : ''}
${referenceAnalysis.metadata?.description ? `網站描述: ${referenceAnalysis.metadata.description}` : ''}

### 視覺設計分析
${referenceAnalysis.visionAnalysis}

${structuredBriefRef}

**重要**：以上分析基於真實截圖和 DOM 提取，你的 referenceAnalysis 輸出必須基於這些真實數據，不要編造或推測參考網站的設計特徵。`
    : referenceAnalysis?.analysisSource === 'metadata_only' && referenceAnalysis.metadata?.title
      ? `## 參考網站資訊（Metadata）
URL: ${referenceAnalysis.url}
標題: ${referenceAnalysis.metadata.title}
${referenceAnalysis.metadata?.description ? `描述: ${referenceAnalysis.metadata.description}` : ''}
${referenceAnalysis.metadata?.themeColor ? `主題色: ${referenceAnalysis.metadata.themeColor}` : ''}
${structuredBriefRef}`
      : ''

  const systemPrompt = `你是一位資深 UI/UX 設計顧問。你的任務是根據用戶提供的資訊，總結設計方向並給出專業建議。

## 產品類型
${productType}

## BDD 規格
${bddSpec || '（無規格）'}

${templateContext}

${ideasContext}

${referenceContext}

## 你的角色
${sourceType === 'ideas'
    ? '用戶已經表達了自己的設計想法，你需要：\n1. 理解並整理用戶的想法\n2. 從專業角度分析可行性\n3. 補充用戶可能沒想到的設計建議\n4. 給出 2-3 個可以提升設計品質的專業建議'
    : '用戶選擇了模板但沒有特別的設計想法，你需要更主動：\n1. 分析模板的設計特色和適用場景\n2. 根據產品類型建議可調整的方向\n3. 主動提出 2-3 個能讓設計更出色的建議\n4. 讓用戶知道哪些方面可以自訂'}

## Domain Exploration（在給建議前先做這個思考）
在你腦中（不需要輸出）完成這些探索：
1. **Domain 概念**：這個產品的世界有什麼概念、隱喻、詞彙？不是功能，是領域。
2. **Color World**：如果這個產品是一個實體空間，你走進去會看到什麼顏色？什麼材質？什麼光線？
3. **用戶場景**：使用者在什麼情境下打開這個產品？他們 5 分鐘前在做什麼？5 分鐘後要做什麼？
4. **Signature**：什麼視覺/結構/互動元素只屬於這個產品？如果拿掉產品名稱，看到這個元素就能猜到是什麼？

你的 styleSummary、colorDirection、layoutSuggestion 必須反映這些探索的結果，而不是泛泛的「乾淨現代」。

## Design Tier 推薦（重要）
你需要根據產品類型和用戶意圖推薦一個 Design Tier：

- **functional**（功能型）：保守、可預測、禁止漸層/glow/多色。適合 dashboard、SaaS 後台、電商管理、admin panel。
- **creative**（創意型）：允許漸層、多色、獨特字體、大膽佈局、豐富動畫。適合 landing page、品牌官網、作品集、行銷頁。

判斷邏輯：
- 模板類別為 landing / portfolio / marketing / brand → 推薦 creative
- 模板類別為 dashboard / saas / ecommerce / admin → 推薦 functional
- 模板類別為 general → 根據用戶回答的感覺（feeling）和產品類型綜合判斷

## 輸出格式
請以 JSON 格式輸出：

\`\`\`json
{
  "styleSummary": "風格定位總結（1-2 句話）",
  "colorDirection": "色彩方向建議（1-2 句話）",
  "layoutSuggestion": "佈局建議（1-2 句話）",
  "referenceAnalysis": "參考分析（基於真實網站分析結果——如有的話，或基於模板特色，2-3 句話）",
  "professionalRecommendations": [
    "專業建議 1",
    "專業建議 2",
    "專業建議 3"
  ],
  "recommendedTier": "functional 或 creative",
  "tierReason": "推薦原因（1 句話，說明為什麼推薦這個模式）",
  "domainKeywords": ["domain 探索中發現的 3-5 個關鍵概念詞"],
  "signature": "這個產品的 signature element 描述（1 句話）",
  "displayText": "用 markdown 格式撰寫的完整設計方向確認文本，包含所有上述內容和 tier 推薦，語氣像設計顧問與客戶溝通"
}
\`\`\`

## 技術約束
以下約束會根據 tier 自動切換，你只需要推薦 tier，不需要在建議中重複這些約束：
- **functional tier**：禁止漸層/glow/多色、動畫克制、標準佈局
- **creative tier**：允許漸層（禁止紫色多色）、多色點綴、豐富動畫、不對稱佈局
- **兩者共同**：必須使用無障礙組件、尊重 prefers-reduced-motion、禁止 AI slop（紫色漸層、Inter/Roboto 作唯一字體）

## 注意
- 建議要具體、可執行，不要泛泛而談
- 語氣專業但親切，像資深設計師與客戶討論
- 不要使用 emoji
- displayText 中用粗體標記重要內容，包含 tier 推薦的說明
- 如果推薦 creative tier，在 displayText 中說明這意味著設計會更有表現力
- 如果推薦 functional tier，在 displayText 中說明這意味著設計會更注重功能清晰度`

  const userMessage = sourceType === 'ideas'
    ? '請根據用戶的設計想法，整理設計方向並給出專業建議。'
    : `請分析「${template.name}」模板的特色，並為這個${productType}產品提出設計建議。`

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 4096, temperature: 0.3 },
    { ...trackingContext, purpose: 'generate_design_brief' }
  )

  if (!response.success || !response.content) {
    return { success: false, error: response.error || '無法生成設計方向摘要' }
  }

  try {
    // 安全解析 JSON（含尾隨逗號/控制字符清理）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = safeParseJson<any>(response.content)
    if (!parsed) {
      logger.error({ rawResponse: response.content.substring(0, 500) }, 'Design Brief JSON 提取失敗')
      return { success: false, error: '無法解析設計方向摘要' }
    }

    // 推斷 tier（LLM 回傳 + fallback）
    let recommendedTier: DesignTier = 'functional'
    if (parsed.recommendedTier === 'creative' || parsed.recommendedTier === 'functional') {
      recommendedTier = parsed.recommendedTier
    } else {
      // fallback：根據 template category 推斷
      const creativeCats = ['landing', 'portfolio', 'marketing', 'brand']
      recommendedTier = creativeCats.includes(template.category.toLowerCase()) ? 'creative' : 'functional'
    }

    const brief: DesignBrief = {
      styleSummary: parsed.styleSummary,
      colorDirection: parsed.colorDirection,
      layoutSuggestion: parsed.layoutSuggestion,
      referenceAnalysis: parsed.referenceAnalysis,
      professionalRecommendations: parsed.professionalRecommendations || [],
      sourceType,
      recommendedTier,
      tierReason: parsed.tierReason || '',
      domainKeywords: parsed.domainKeywords || [],
      signature: parsed.signature || '',
    }

    return {
      success: true,
      brief,
      displayText: parsed.displayText,
    }
  } catch (err) {
    return { success: false, error: `解析設計方向摘要時發生錯誤: ${err}` }
  }
}

/**
 * 根據用戶反饋調整 Design Brief
 */
export async function adjustDesignBrief(
  currentBrief: DesignBrief,
  adjustmentRequest: string,
  conversationHistory: Array<{ role: 'assistant' | 'user'; content: string }>,
  template: TemplateData,
  productType: string,
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  brief?: DesignBrief
  displayText?: string
  error?: string
}> {
  const systemPrompt = `你是一位資深 UI/UX 設計顧問。用戶對設計方向有調整意見，請根據反饋修改設計方向摘要。

## 產品類型
${productType}

## 模板資訊
- 名稱：${template.name}
- 類別：${template.category}

## 目前的設計方向
- 風格定位：${currentBrief.styleSummary}
- 色彩方向：${currentBrief.colorDirection}
- 佈局建議：${currentBrief.layoutSuggestion}
- 參考分析：${currentBrief.referenceAnalysis}
- 專業建議：${currentBrief.professionalRecommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
- 設計模式：${currentBrief.recommendedTier === 'creative' ? '創意型' : '功能型'}
${currentBrief.domainKeywords?.length ? `- Domain 關鍵概念：${currentBrief.domainKeywords.join('、')}` : ''}
${currentBrief.signature ? `- Signature Element：${currentBrief.signature}` : ''}

## 規則
1. 只修改用戶要求調整的部分，保留其他不變
2. 如果用戶的調整不太合理，溫和指出原因並給出替代方案
3. 保持專業但親切的語氣
4. 如果用戶想要更大膽/有創意/有表現力 → 切換到 creative tier
5. 如果用戶想要更簡單/保守/功能優先 → 切換到 functional tier
6. 如果用戶沒有提到模式切換，保持當前 tier 不變

## 技術約束
- **functional tier**：禁止漸層/glow/多色、動畫克制、標準佈局
- **creative tier**：允許漸層（禁止紫色多色）、多色點綴、豐富動畫、不對稱佈局
- 兩者共同：必須使用無障礙組件、尊重 prefers-reduced-motion、禁止 AI slop

## 輸出格式
\`\`\`json
{
  "styleSummary": "更新後的風格定位",
  "colorDirection": "更新後的色彩方向",
  "layoutSuggestion": "更新後的佈局建議",
  "referenceAnalysis": "更新後的參考分析",
  "professionalRecommendations": ["更新後的建議1", "建議2", "建議3"],
  "recommendedTier": "functional 或 creative（根據用戶調整意見決定）",
  "tierReason": "推薦原因",
  "domainKeywords": ["保留或更新的 domain 關鍵概念"],
  "signature": "保留或更新的 signature element 描述",
  "displayText": "更新後的完整 markdown 展示文本（包含 tier 說明）"
}
\`\`\``

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...conversationHistory,
    { role: 'user', content: `用戶的調整要求：${adjustmentRequest}\n\n請根據上述要求調整設計方向。` },
  ]

  const response = await callClaude(
    systemPrompt,
    messages,
    { maxTokens: 2048, temperature: 0.3 },
    { ...trackingContext, purpose: 'adjust_design_brief' }
  )

  if (!response.success || !response.content) {
    return { success: false, error: response.error || '無法調整設計方向' }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = safeParseJson<any>(response.content)
    if (!parsed) {
      return { success: false, error: '無法解析調整後的設計方向' }
    }

    // 解析 tier（保持當前 tier 如果 LLM 沒回傳）
    let recommendedTier = currentBrief.recommendedTier
    if (parsed.recommendedTier === 'creative' || parsed.recommendedTier === 'functional') {
      recommendedTier = parsed.recommendedTier
    }

    const brief: DesignBrief = {
      styleSummary: parsed.styleSummary || currentBrief.styleSummary,
      colorDirection: parsed.colorDirection || currentBrief.colorDirection,
      layoutSuggestion: parsed.layoutSuggestion || currentBrief.layoutSuggestion,
      referenceAnalysis: parsed.referenceAnalysis || currentBrief.referenceAnalysis,
      professionalRecommendations: parsed.professionalRecommendations || [],
      sourceType: currentBrief.sourceType,
      recommendedTier,
      tierReason: parsed.tierReason || currentBrief.tierReason,
      domainKeywords: parsed.domainKeywords || currentBrief.domainKeywords,
      signature: parsed.signature || currentBrief.signature,
    }

    return {
      success: true,
      brief,
      displayText: parsed.displayText,
    }
  } catch (err) {
    return { success: false, error: `解析調整後設計方向時發生錯誤: ${err}` }
  }
}

// ============================================================
// 對話內迭代：基於現有代碼 + 用戶反饋修改設計
// ============================================================

/**
 * 根據用戶反饋修改現有代碼
 * 只修改必要的檔案，保持其他部分不變
 */
export async function refineCode(
  currentCode: {
    pages: GeneratedComponent[]
    components: GeneratedComponent[]
    styles: string
  },
  userFeedback: string,
  designContext: {
    designSystem?: DesignSystem
    designTier?: DesignTier
    designBrief?: DesignBrief
    variantConcept?: VariantConcept
    moodId?: string
    generationProfile?: GenerationProfile
    iterationHistory?: Array<{ feedback: string; filesChanged: string[] }>
    temperatureOverride?: number
  },
  trackingContext?: LlmTrackingContext,
  imageUrls?: string[],
  onTextDelta?: (text: string) => void
): Promise<GenerationResult> {
  const buildCodeBlocks = (code: CodeBundle): string[] => {
    const blocks: string[] = []
    for (const page of code.pages) {
      blocks.push(`\`\`\`tsx:${page.path}\n${page.content}\n\`\`\``)
    }
    for (const comp of code.components) {
      blocks.push(`\`\`\`tsx:${comp.path}\n${comp.content}\n\`\`\``)
    }
    if (code.styles) {
      blocks.push(`\`\`\`css:globals.css\n${code.styles}\n\`\`\``)
    }
    return blocks
  }

  const parseModifiedCodeBlocks = (
    content: string,
    baseCode: CodeBundle
  ): RefinePatchSet => {
    const tsxRegex = /```tsx:([^\n]+)\n([\s\S]*?)\n```/g
    const cssRegex = /```css:([^\n]+)\n([\s\S]*?)\n```/g
    const modifiedPages = new Map<string, string>()
    const modifiedComponents = new Map<string, string>()
    let modifiedStyles = ''

    let match
    while ((match = tsxRegex.exec(content)) !== null) {
      const path = match[1].trim()
      const fileContent = stripLlmMetaLines(match[2].trim())

      if (baseCode.pages.some(p => p.path === path)) {
        modifiedPages.set(path, fileContent)
      } else if (baseCode.components.some(c => c.path === path)) {
        modifiedComponents.set(path, fileContent)
      } else if (path.includes('/page.tsx') || path.includes('/page.ts')) {
        modifiedPages.set(path, fileContent)
      } else {
        modifiedComponents.set(path, fileContent)
      }
    }

    while ((match = cssRegex.exec(content)) !== null) {
      modifiedStyles = stripLlmMetaLines(match[2].trim())
    }

    return { modifiedPages, modifiedComponents, modifiedStyles }
  }

  const mergeCodeBundle = (
    baseCode: CodeBundle,
    patches: RefinePatchSet
  ): CodeBundle => {
    const mergedPages = baseCode.pages.map(p => ({
      ...p,
      content: patches.modifiedPages.get(p.path) || p.content,
    }))
    for (const [path, content] of patches.modifiedPages) {
      if (!baseCode.pages.some(p => p.path === path)) {
        mergedPages.push({ path, content, description: `頁面: ${path}` })
      }
    }

    const mergedComponents = baseCode.components.map(c => ({
      ...c,
      content: patches.modifiedComponents.get(c.path) || c.content,
    }))
    for (const [path, content] of patches.modifiedComponents) {
      if (!baseCode.components.some(c => c.path === path)) {
        mergedComponents.push({ path, content, description: `組件: ${path}` })
      }
    }

    return {
      pages: mergedPages,
      components: mergedComponents,
      styles: patches.modifiedStyles || baseCode.styles,
    }
  }

  const hasAnyPatch = (patches: RefinePatchSet): boolean =>
    patches.modifiedPages.size > 0 || patches.modifiedComponents.size > 0 || !!patches.modifiedStyles

  const resolveImportPath = (fromPath: string, importPath: string): string | null => {
    if (importPath.startsWith('@/')) {
      return importPath.slice(2)
    }
    if (!importPath.startsWith('.')) return null

    const baseDir = fromPath.includes('/') ? fromPath.slice(0, fromPath.lastIndexOf('/')) : ''
    const segments = `${baseDir}/${importPath}`.split('/')
    const resolved: string[] = []
    for (const segment of segments) {
      if (!segment || segment === '.') continue
      if (segment === '..') {
        resolved.pop()
      } else {
        resolved.push(segment)
      }
    }
    return resolved.join('/')
  }

  const findImportedComponents = (filePath: string, content: string, code: CodeBundle): Set<string> => {
    const matches = [...content.matchAll(/from\s+['"](@\/[^'"]+|\.\.?\/[^'"]+)['"]/g)]
    const resolvedPaths = new Set<string>()
    for (const match of matches) {
      const resolved = resolveImportPath(filePath, match[1])
      if (!resolved) continue
      const candidates = [
        resolved,
        `${resolved}.tsx`,
        `${resolved}.ts`,
        `${resolved}/index.tsx`,
        `${resolved}/index.ts`,
      ]
      const found = code.components.find(component => candidates.includes(component.path))
      if (found) resolvedPaths.add(found.path)
    }
    return resolvedPaths
  }

  const pickRefineTargetBundle = (code: CodeBundle): CodeBundle => {
    const generationProfile = designContext.generationProfile || 'balanced'
    if (generationProfile === 'quality') {
      return code
    }

    const targetPagePaths = new Set<string>()
    const targetComponentPaths = new Set<string>()
    const normalizedFeedback = userFeedback.toLowerCase()

    if (targetPreviewRoute) {
      for (const page of code.pages) {
        if (pagePathToRoute(page.path) === targetPreviewRoute) {
          targetPagePaths.add(page.path)
          for (const importPath of findImportedComponents(page.path, page.content, code)) {
            targetComponentPaths.add(importPath)
          }
        }
      }
    }

    for (const page of code.pages) {
      const basename = page.path.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '').toLowerCase() || ''
      if (basename && normalizedFeedback.includes(basename)) {
        targetPagePaths.add(page.path)
      }
    }

    for (const component of code.components) {
      const basename = component.path.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '').toLowerCase() || ''
      if (basename && normalizedFeedback.includes(basename)) {
        targetComponentPaths.add(component.path)
      }
      if (/header|nav/.test(component.path.toLowerCase()) && /header|nav|navbar|menu/.test(normalizedFeedback)) {
        targetComponentPaths.add(component.path)
      }
      if (/footer/.test(component.path.toLowerCase()) && /footer/.test(normalizedFeedback)) {
        targetComponentPaths.add(component.path)
      }
      if (/hero/.test(component.path.toLowerCase()) && /hero|banner/.test(normalizedFeedback)) {
        targetComponentPaths.add(component.path)
      }
    }

    const targetPages = code.pages.filter(page => targetPagePaths.has(page.path))
    const targetComponents = code.components.filter(component => targetComponentPaths.has(component.path))

    const needsStyles = /color|font|spacing|background|theme|global|樣式|字體|顏色|間距|背景/.test(normalizedFeedback)
    if (targetPages.length === 0 && targetComponents.length === 0 && !needsStyles) {
      return code
    }

    return {
      pages: targetPages.length > 0 ? targetPages : code.pages.slice(0, 1),
      components: targetComponents,
      styles: needsStyles ? code.styles : '',
    }
  }

  const escapeRegExp = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const getUrlUsage = (content: string, url: string): {
    directRenderable: boolean
    rawUrl: boolean
    renderHint: boolean
  } => {
    const escaped = escapeRegExp(url)
    const srcPattern = new RegExp(`src\\s*=\\s*\\{?\\s*["'\`]${escaped}["'\`]`)
    const cssUrlPattern = new RegExp(`url\\(\\s*["'\`]?${escaped}["'\`]?\\s*\\)`)
    const directRenderable = srcPattern.test(content) || cssUrlPattern.test(content)
    const rawUrl = content.includes(url)
    const renderHint = /src\s*=|backgroundImage|url\(/.test(content)
    return { directRenderable, rawUrl, renderHint }
  }

  const findMissingLockedUrls = (code: CodeBundle, lockedUrls: string[]): string[] => {
    if (!lockedUrls.length) return []
    const allFiles = [...code.pages, ...code.components]
    const missing: string[] = []

    for (const url of lockedUrls) {
      let foundRenderableUsage = false
      const rawOnlyPaths: string[] = []

      for (const file of allFiles) {
        const usage = getUrlUsage(file.content, url)
        const validUsage = usage.directRenderable
        if (validUsage) {
          foundRenderableUsage = true
          break
        }
        if (usage.rawUrl) {
          rawOnlyPaths.push(file.path)
        }
      }

      if (!foundRenderableUsage) {
        missing.push(url)
      } else if (rawOnlyPaths.length > 0) {
        logger.warn(
          { url, rawOnlyPaths },
          'refineCode: URL 只以裸字串出現於部分檔案（可能非可渲染上下文）'
        )
      }
    }

    return missing
  }

  const normalizeRoute = (input: string): string => {
    let route = (input || '').trim()
    if (!route) return '/'
    if (route.startsWith('#')) route = route.slice(1)
    const queryPos = route.indexOf('?')
    if (queryPos >= 0) route = route.slice(0, queryPos)
    if (!route.startsWith('/')) route = `/${route}`
    route = route.replace(/\/+$/, '')
    return route || '/'
  }

  const pagePathToRoute = (pagePath: string): string | null => {
    const normalizedPath = pagePath.replace(/\\/g, '/')
    let appRelative = normalizedPath

    const appMarkerIdx = normalizedPath.lastIndexOf('/app/')
    if (appMarkerIdx >= 0) {
      appRelative = normalizedPath.slice(appMarkerIdx + '/app/'.length)
    } else if (normalizedPath.startsWith('app/')) {
      appRelative = normalizedPath.slice('app/'.length)
    } else {
      return null
    }

    if (appRelative === 'page.tsx' || appRelative === 'page.ts') return '/'
    if (!appRelative.endsWith('/page.tsx') && !appRelative.endsWith('/page.ts')) return null

    let route = appRelative.replace(/\/page\.tsx?$/, '')
    route = route.replace(/^\[locale\](\/|$)/, '')
    route = route.replace(/\/?\([^/]+\)/g, '')
    return normalizeRoute(route || '/')
  }

  const extractTargetPreviewRoute = (feedback: string): string | null => {
    const explicitMatch =
      feedback.match(/當前預覽路由（必須優先套用於此頁）[\s\S]{0,120}?-\s*(\/[^\s\n]+)/) ||
      feedback.match(/當前預覽路由[^\/\n]*?(\/[^\s\n]+)/)

    if (!explicitMatch?.[1]) return null
    return normalizeRoute(explicitMatch[1])
  }

  const findMissingLockedUrlsInRoute = (
    code: CodeBundle,
    lockedUrls: string[],
    targetRoute: string
  ): { missingUrls: string[]; targetPagePaths: string[] } => {
    if (!lockedUrls.length) return { missingUrls: [], targetPagePaths: [] }
    const targetPages = code.pages.filter(page => pagePathToRoute(page.path) === targetRoute)
    const targetPagePaths = targetPages.map(p => p.path)
    if (targetPages.length === 0) {
      return { missingUrls: [], targetPagePaths: [] }
    }

    // 目標頁 + components 都納入檢查（圖片可能在被目標頁引入的共用組件內）
    const candidateFiles = [...targetPages, ...code.components]
    const missingUrls = lockedUrls.filter(url =>
      !candidateFiles.some(file => getUrlUsage(file.content, url).directRenderable)
    )

    return { missingUrls, targetPagePaths }
  }

  const repairLockedUploadUrls = async (
    code: CodeBundle,
    missingUrls: string[],
    targetRoute?: string | null
  ): Promise<CodeBundle | null> => {
    if (!missingUrls.length) return code

    const repairSystemPrompt = `你是一位資深前端工程師。你會收到一份目前已可運作的 React/Next.js 代碼，以及「必須保留」的圖片 URL。

任務：
- 只做最小必要修改，確保每個 URL 都被實際用在畫面上（img src 或 CSS backgroundImage）
${targetRoute ? `- 圖片必須出現在目標路由「${targetRoute}」的頁面（可直接在該頁，或該頁引入的元件）` : ''}
- 不要刪除既有功能、互動、動畫、響應式邏輯
- 不要把 URL 改成其他網址、placeholder 或 data URI
- 若 URL 已被正確使用，不要重複新增

輸出格式：
只輸出被修改的檔案，使用：
\`\`\`tsx:path/to/file.tsx
...完整檔案內容...
\`\`\`
\`\`\`css:globals.css
...完整內容...
\`\`\``

    const repairUserMessage = `## 缺失的鎖定圖片 URL（必須補回）
${missingUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}
${targetRoute ? `\n## 目標路由（必須套用）\n${targetRoute}\n` : ''}

## 當前代碼
${buildCodeBlocks(code).join('\n\n')}

請輸出最小修改，補回缺失的圖片 URL。`

    const repairResponse = await callClaude(
      repairSystemPrompt,
      [{ role: 'user', content: repairUserMessage }],
      { maxTokens: 16384, temperature: 0 },
      { ...trackingContext, purpose: 'repair_locked_upload_urls' }
    )

    if (!repairResponse.success || !repairResponse.content) {
      logger.warn({ error: repairResponse.error }, 'repairLockedUploadUrls LLM 呼叫失敗')
      return null
    }

    const repairedPatches = parseModifiedCodeBlocks(repairResponse.content, code)
    if (!hasAnyPatch(repairedPatches)) {
      logger.warn('repairLockedUploadUrls 無有效代碼區塊輸出')
      return null
    }

    return mergeCodeBundle(code, repairedPatches)
  }

  const clonePatchSet = (patches: RefinePatchSet): RefinePatchSet => ({
    modifiedPages: new Map(patches.modifiedPages),
    modifiedComponents: new Map(patches.modifiedComponents),
    modifiedStyles: patches.modifiedStyles,
  })

  const recoverSuspiciousShrinkPatches = async (
    baseCode: CodeBundle,
    originalPatches: RefinePatchSet,
    shrinkIssues: SuspiciousRefineShrink[],
  ): Promise<RefinePatchSet | null> => {
    if (shrinkIssues.length === 0) return originalPatches

    const targetFiles = shrinkIssues
      .map(issue => [...baseCode.pages, ...baseCode.components].find(file => file.path === issue.path))
      .filter((file): file is GeneratedComponent => Boolean(file))

    if (targetFiles.length === 0) return null

    const retrySystemPrompt = `你是一位專門修復 LLM 截斷輸出的資深前端工程師。

任務：
- 你會收到原始完整檔案、用戶修改要求、以及上一次疑似截斷的草稿。
- 只修改指定檔案，輸出該檔案的「完整內容」，不能只輸出片段。
- 以原始檔案為基底做最小必要修改，保留所有既有功能、hook、事件、動畫、響應式與輔助函式。
- 除非用戶明確要求刪除整段功能，否則不要大幅縮減檔案內容。
- 若上一版草稿漏掉了後半段邏輯，你必須補回。

輸出格式：
\`\`\`tsx:path/to/file.tsx
// 完整檔案內容
\`\`\`
\`\`\`css:globals.css
/* 如需修改 */
\`\`\`

不要輸出解釋，不要輸出未修改檔案。`

    const retryFileBlocks = targetFiles.map(file => {
      const priorDraft =
        originalPatches.modifiedPages.get(file.path) ||
        originalPatches.modifiedComponents.get(file.path) ||
        ''

      return [
        `## 目標檔案\n${file.path}`,
        `### 原始完整內容（必須以此為基底保留既有邏輯）`,
        `\`\`\`tsx:${file.path}\n${file.content}\n\`\`\``,
        priorDraft
          ? `### 上一次疑似截斷的草稿（僅供參考，不可直接照抄）\n\`\`\`tsx:${file.path}\n${priorDraft}\n\`\`\``
          : '',
      ].filter(Boolean).join('\n\n')
    }).join('\n\n')

    const retryUserMessage = `## 用戶的修改要求
${userFeedback}
${lockedUploadUrls.length ? `\n## 鎖定圖片 URL（不可替換）\n${lockedUploadUrls.join('\n')}\n` : ''}
${targetPreviewRoute ? `\n## 目標路由\n${targetPreviewRoute}\n` : ''}

## 專案檔案清單
${buildCodeManifest(currentCode)}

${retryFileBlocks}

請只輸出上面列出的目標檔案完整內容，修復截斷問題並保留既有邏輯。`

    const retryResponse = await callClaude(
      retrySystemPrompt,
      [{ role: 'user', content: retryUserMessage }],
      {
        maxTokens: 32768,
        temperature: 0.1,
        maxContinuations: 2,
        promptLabel: 'refine-code-shrink-recovery',
        contextSizeHint: generationProfile,
      },
      { ...trackingContext, purpose: 'refine_code_shrink_recovery' }
    )

    if (!retryResponse.success || !retryResponse.content) {
      logger.warn({ error: retryResponse.error, paths: shrinkIssues.map(issue => issue.path) }, 'refineCode shrink recovery 失敗')
      return null
    }

    const retryPatches = parseModifiedCodeBlocks(retryResponse.content, baseCode)
    if (!hasAnyPatch(retryPatches)) {
      logger.warn({ paths: shrinkIssues.map(issue => issue.path) }, 'refineCode shrink recovery 無有效代碼區塊')
      return null
    }

    const mergedPatches = clonePatchSet(originalPatches)
    for (const issue of shrinkIssues) {
      const recoveredPage = retryPatches.modifiedPages.get(issue.path)
      if (recoveredPage) {
        mergedPatches.modifiedPages.set(issue.path, recoveredPage)
      }
      const recoveredComponent = retryPatches.modifiedComponents.get(issue.path)
      if (recoveredComponent) {
        mergedPatches.modifiedComponents.set(issue.path, recoveredComponent)
      }
    }
    if (retryPatches.modifiedStyles) {
      mergedPatches.modifiedStyles = retryPatches.modifiedStyles
    }

    return mergedPatches
  }

  const tier = designContext.designTier || 'functional'
  const generationProfile = designContext.generationProfile || 'balanced'
  const feedbackUrls = Array.from(
    new Set(
      (userFeedback.match(/https?:\/\/[^\s)"'`]+/g) || [])
        .map(u => u.trim())
        .filter(Boolean)
    )
  )
  const lockedUploadUrls = Array.from(
    new Set(
      [...(imageUrls || []), ...feedbackUrls]
        .filter(u => /\/uploads\/tellcraft\//.test(u))
    )
  )
  const targetPreviewRoute = extractTargetPreviewRoute(userFeedback)

  if (lockedUploadUrls.length > 0) {
    logger.info(
      {
        lockedUploadUrlsCount: lockedUploadUrls.length,
        imageUrlsCount: imageUrls?.length || 0,
        targetPreviewRoute: targetPreviewRoute || undefined,
      },
      'refineCode: 偵測到鎖定圖片 URL'
    )
  }

  const promptCodeBundle = pickRefineTargetBundle(currentCode)
  const codeBlocks = buildCodeBlocks(promptCodeBundle)

  // 計算大檔案行數，注入防截斷提示
  const largeFileWarnings = [...promptCodeBundle.pages, ...promptCodeBundle.components]
    .filter(f => f.content.split('\n').length > 300)
    .map(f => `- ${f.path}（${f.content.split('\n').length} 行）`)
    .join('\n')

  const designSystemSection = designContext.designSystem
    ? buildCompactDesignPrompt(designContext.designSystem, { includeMood: true })
    : ''

  const briefSection = designContext.designBrief
    ? `## 設計方向
- 風格：${designContext.designBrief.styleSummary}
- 色彩：${designContext.designBrief.colorDirection}
- 佈局：${designContext.designBrief.layoutSuggestion}
${designContext.designBrief.signature ? `- Signature：${designContext.designBrief.signature}` : ''}`
    : ''

  const refineConceptSection = designContext.variantConcept
    ? `## 設計概念（修改時不可丟失）
「${designContext.variantConcept.name}」— ${designContext.variantConcept.description}
${designContext.variantConcept.signatureElement ? `Signature Element：${designContext.variantConcept.signatureElement}` : ''}
修改代碼時必須保持這個創意概念的完整性。`
    : ''

  const iterationHistorySection = (() => {
    const history = designContext.iterationHistory
    if (!history || history.length === 0) return ''
    const recent = history.slice(-3)
    const lines = recent.map((entry, i) =>
      `${i + 1}. 反饋：「${entry.feedback.slice(0, 150)}」→ 修改了 ${entry.filesChanged.map(f => f.split('/').pop()).join(', ')}`
    )
    return `\n## 迭代歷史（最近 ${recent.length} 次，共 ${history.length} 次）\n以下是之前的修改請求。**如果用戶在重複抱怨同一問題，代表之前的修改沒有修復根因，你必須採取不同策略。**\n${lines.join('\n')}\n`
  })()

  const systemPrompt = `你是一位專業的前端設計師和開發者。用戶對已完成的設計有修改意見，請根據反饋修改代碼。

${designSystemSection}

${briefSection}

${refineConceptSection}
${designContext.moodId ? `\n## 設計風格（修改時不可丟失）\nMood: ${getMoodSummary(designContext.moodId)}\n` : ''}
${iterationHistorySection}
${getStructureConstraints(tier)}

## 重要：輸入驗證（最高優先）
在修改代碼之前，先判斷用戶的訊息是否為**明確的設計修改請求**。
如果用戶的訊息屬於以下情況，**不要修改任何代碼**，只輸出 [NO_CHANGE] 加上簡短原因：
- 無意義文字、亂碼、隨機字元（如「asdf」「哈哈哈」「test」「123」）
- 與設計修改完全無關的閒聊（如「你好」「今天天氣怎樣」「你是誰」）
- 過於模糊無法執行的指令（如「改好一點」「變漂亮」），此時請在原因中引導用戶給出具體需求
- 用戶要求修改或移除的功能/組件/區塊在現有代碼中不存在（如「移除購物車」但代碼中沒有購物車相關組件），此時請在原因中說明代碼中沒有該功能，並列出現有的主要頁面與組件供用戶參考

格式範例：
[NO_CHANGE] 您的訊息似乎與設計修改無關。請描述具體需要修改的內容，例如「把標題改成紅色」或「在首頁新增一個聯繫表單」。
[NO_CHANGE] 代碼中沒有「購物車」相關功能。目前的組件包括：HeroSection、FeatureGrid、PricingTable、ContactForm。如需修改，請指定現有組件。

## 修改規則（Critical）
1. **只修改用戶要求的部分**，不要改動不相關的檔案或代碼
2. 保持現有的功能、動畫效果、響應式設計完好
3. 保持現有的組件結構和檔案組織
4. 動畫庫用 motion/react（不是 framer-motion）
5. 字體載入用 next/font（禁止 <link> 或 @import Google Fonts）
6. 使用 Tailwind CSS classes
7. 保持無障礙功能（aria-label、focus-visible 等）
8. 保持現有的互動功能完好（Modal/Dialog 開關、表單 state、事件處理），不要移除 'use client'

## 視覺問題診斷（「看不到」「消失」「沒效果」類反饋必讀）
當用戶說某效果「看不到」「消失了」「沒有出現」時，不要只調顏色或透明度，依序排查：
1. **SVG ID 衝突**：組件被多次渲染時，<defs> 內的 gradient/clipPath/filter id 會碰撞 → 用 useId() 確保唯一
2. **z-index 遮擋**：效果被其他層蓋住？檢查 position 和 z-index
3. **overflow 裁切**：父層 overflow-hidden 裁掉了效果？
4. **opacity/visibility**：是否被設為 opacity-0 或 invisible？
5. **SSR 水合問題**：window/Math.random 等動態值在 SSR 為空 → 需 useEffect+useState
6. **條件渲染斷鏈**：觸發條件（hover/scroll/IntersectionObserver）是否正確連接？
${lockedUploadUrls.length ? `
## 圖片資產鎖定（最高優先）
以下圖片 URL 屬於用戶剛上傳的資產，修改時必須原樣保留：
${lockedUploadUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}

嚴格禁止：
- 將上述 URL 改成 placeholder（例如 unsplash、picsum、dummyimage、placehold）
- 刪除對上述 URL 的使用（除非用戶明確要求移除該圖片）
- 改成 data URI、相對路徑或其他網域
` : ''}
${targetPreviewRoute ? `
## 路由鎖定（最高優先）
本次修改的目標路由為：${targetPreviewRoute}
含鎖定圖片 URL 的修改必須保留在此路由對應頁面（或其引入組件），禁止改到其他頁面路由。
` : ''}

## 輸出格式
只輸出**被修改的檔案**，使用以下格式：

\`\`\`tsx:path/to/modified-file.tsx
// 完整的修改後代碼
\`\`\`

\`\`\`css:globals.css
/* 如果需要修改樣式 */
\`\`\`

未修改的檔案不需要輸出。
⚠️ code fence 規則：每個 code block 的第一行必須直接是代碼，禁止在代碼前加任何說明文字（如 "Here is..."、"This component..."）。
${largeFileWarnings ? `
⚠️ **大檔案防截斷（Critical）**：以下檔案行數較多，修改時必須輸出完整內容：
${largeFileWarnings}
- 禁止省略、壓縮、或用註釋替代未修改的代碼段（如 "// ... rest of the code"）
- 即使只改了幾行，也要輸出該檔案的完整內容（包含所有未修改的部分）
- 如果檔案超過 300 行，請特別注意不要在中途停止輸出` : ''}
${imageUrls?.length ? `
## 用戶附加的圖片（${imageUrls.length} 張）
用戶附加了參考圖片。請根據用戶的文字指示決定如何使用：
- 如果用戶要求「加入這張圖」「用這張圖當背景」等 → 直接在代碼中使用下方的圖片 URL（作為 img src 或 CSS backgroundImage）
- 如果用戶要求「照這個改」「參考這個設計」等 → 觀察圖片中的設計細節（佈局、配色、字體、間距等），據此修改代碼
- 圖片 URL（可直接在代碼中使用）：
${imageUrls.map((u, i) => `  ${i + 1}. ${u}`).join('\n')}` : ''}`

  const imageUrlsSection = imageUrls?.length
    ? `\n## 附加圖片 URL\n${imageUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}\n`
    : ''
  const lockedUrlsSection = lockedUploadUrls.length
    ? `\n## 鎖定圖片 URL（不可替換）\n${lockedUploadUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}\n`
    : ''
  const targetRouteSection = targetPreviewRoute
    ? `\n## 當前預覽路由（必須優先套用於此頁）\n${targetPreviewRoute}\n`
    : ''

  const userMessage = `## 用戶的修改要求
${userFeedback}
${imageUrlsSection}
${lockedUrlsSection}
${targetRouteSection}
## 專案檔案清單（未列出內容的檔案視為只讀）
${buildCodeManifest(currentCode)}

## 現有代碼
${codeBlocks.join('\n\n')}

請根據用戶要求修改代碼，只輸出被修改的檔案。`

  // 構建 user message content — 有圖片時用 content blocks
  let userContent: string | Anthropic.MessageCreateParams['messages'][number]['content'] = userMessage
  if (imageUrls?.length) {
    const contentBlocks: Anthropic.MessageCreateParams['messages'][number]['content'] = []
    for (const url of imageUrls) {
      contentBlocks.push({
        type: 'image' as const,
        source: { type: 'url' as const, url },
      })
    }
    contentBlocks.push({ type: 'text' as const, text: userMessage })
    userContent = contentBlocks
  }

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userContent }],
    {
      maxTokens: 32768,
      temperature: designContext.temperatureOverride ?? 0.2,
      promptLabel: 'refine-code',
      contextSizeHint: generationProfile,
    },
    { ...trackingContext, purpose: 'refine_code' },
    onTextDelta
  )

  if (!response.success || !response.content) {
    return { success: false, error: response.error || '無法修改代碼' }
  }

  // 檢測 [NO_CHANGE] 標記：LLM 判定用戶輸入非有效修改請求
  const noChangeMatch = response.content.match(/\[NO_CHANGE\]\s*(.*)/)
  if (noChangeMatch) {
    return { success: false, error: noChangeMatch[1].trim() || '無法理解修改需求，請提供具體的修改描述。' }
  }

  const initialPatches = parseModifiedCodeBlocks(response.content, currentCode)

  // 零改動檢測：LLM 沒回 [NO_CHANGE] 但也沒輸出任何代碼區塊
  if (!hasAnyPatch(initialPatches)) {
    return { success: false, error: '無法理解您的修改需求。請描述具體要修改的內容，例如「把標題文字改成藍色」或「在導航欄新增一個搜尋框」。' }
  }

  // ── 縮水偵測：大檔案先嘗試單檔修復，再決定是否取消 ──
  const SHRINK_THRESHOLD = 0.4
  let effectivePatches = initialPatches
  let shrinkIssues = findSuspiciousRefineShrinks(currentCode, effectivePatches, SHRINK_THRESHOLD, userFeedback)
  if (shrinkIssues.length > 0) {
    logger.warn(
      { shrinkIssues },
      'refineCode：偵測到疑似截斷的大幅縮水檔案，嘗試單檔修復'
    )

    const recoveredPatches = await recoverSuspiciousShrinkPatches(currentCode, effectivePatches, shrinkIssues)
    if (recoveredPatches) {
      effectivePatches = recoveredPatches
      shrinkIssues = findSuspiciousRefineShrinks(currentCode, effectivePatches, SHRINK_THRESHOLD, userFeedback)
    }
  }

  if (shrinkIssues.length > 0) {
    const issue = shrinkIssues[0]
    logger.error(
      issue,
      'refineCode：修改後代碼縮水超過 40%，且修復重試後仍疑似 LLM 截斷，取消本次迭代'
    )
    return {
      success: false,
      error: `修改後的 ${issue.path.split('/').pop()} 內容大幅縮減（${issue.originalLines} → ${issue.newLines} 行），疑似代碼截斷。已取消本次修改，請重新嘗試或描述更小範圍的修改。`,
    }
  }

  let mergedCode = mergeCodeBundle(currentCode, effectivePatches)

  // ── 語法驗證：只檢查被修改的檔案，失敗時直接 fail refineCode（不存快照）──
  const patchedPaths = new Set([
    ...effectivePatches.modifiedPages.keys(),
    ...effectivePatches.modifiedComponents.keys(),
  ])
  const modifiedForSyntaxCheck = [...mergedCode.pages, ...mergedCode.components].filter(f =>
    patchedPaths.has(f.path)
  )
  if (modifiedForSyntaxCheck.length > 0) {
    const syntaxChecked = await checkAndFixSyntaxErrors(modifiedForSyntaxCheck, trackingContext)
    const stillBroken = syntaxChecked.filter(f => getSyntaxErrors(f.path, f.content).length > 0)
    if (stillBroken.length > 0) {
      logger.error({ paths: stillBroken.map(f => f.path) }, 'refineCode：語法修復失敗，取消本次迭代')
      return {
        success: false,
        error: `代碼修改後出現語法錯誤（${stillBroken.map(f => f.path.split('/').pop()).join('、')}），已自動取消。請重新描述修改需求，或嘗試更小範圍的修改。`,
      }
    }
    const fixedMap = new Map(syntaxChecked.map(f => [f.path, f.content]))
    mergedCode = {
      pages: mergedCode.pages.map(p => ({ ...p, content: fixedMap.get(p.path) ?? p.content })),
      components: mergedCode.components.map(c => ({ ...c, content: fixedMap.get(c.path) ?? c.content })),
      styles: mergedCode.styles,
    }
  }

  // ── 非修改檔案的既有語法錯誤掃描：stub 替換，避免夾帶舊錯誤進 DB ──
  const unstubbed = [...mergedCode.pages, ...mergedCode.components].filter(
    f => !patchedPaths.has(f.path) && getSyntaxErrors(f.path, f.content).length > 0
  )
  if (unstubbed.length > 0) {
    logger.warn({ paths: unstubbed.map(f => f.path) }, 'refineCode：非修改檔案有既有語法錯誤，替換為 stub')
    const stubMap = new Map(unstubbed.map(f => {
      const name = (f.path.split('/').pop() || 'Component').replace(/\.\w+$/, '').replace(/[^a-zA-Z0-9]/g, '')
      const stub = `import React from 'react'\nexport default function ${name || 'ErrorStub'}() {\n  return (\n    <div style={{ border: '2px dashed #ef4444', borderRadius: '8px', padding: '24px', margin: '16px', backgroundColor: '#fef2f2', color: '#991b1b', fontFamily: 'system-ui, sans-serif', textAlign: 'center' as const }}>\n      <p style={{ fontWeight: 600, marginBottom: '8px' }}>此組件有語法錯誤</p>\n      <p style={{ fontSize: '14px', color: '#b91c1c' }}>需要重新生成：${f.path.split('/').pop()}</p>\n    </div>\n  )\n}`
      return [f.path, stub]
    }))
    mergedCode = {
      pages: mergedCode.pages.map(p => ({ ...p, content: stubMap.get(p.path) ?? p.content })),
      components: mergedCode.components.map(c => ({ ...c, content: stubMap.get(c.path) ?? c.content })),
      styles: mergedCode.styles,
    }
  }

  // 鎖定圖片 URL 最終驗證：若缺失，嘗試一次修復
  if (lockedUploadUrls.length > 0) {
    if (targetPreviewRoute) {
      const routeCheckBefore = findMissingLockedUrlsInRoute(mergedCode, lockedUploadUrls, targetPreviewRoute)
      if (routeCheckBefore.targetPagePaths.length === 0) {
        logger.warn(
          { targetPreviewRoute },
          'refineCode: 找不到目標路由對應頁面，略過路由鎖定驗證'
        )
      } else if (routeCheckBefore.missingUrls.length > 0) {
        logger.warn(
          {
            targetPreviewRoute,
            targetPagePaths: routeCheckBefore.targetPagePaths,
            missingUrls: routeCheckBefore.missingUrls,
          },
          'refineCode: 目標路由缺少鎖定圖片 URL，嘗試修復'
        )

        const repairedForRoute = await repairLockedUploadUrls(mergedCode, routeCheckBefore.missingUrls, targetPreviewRoute)
        if (repairedForRoute) {
          mergedCode = repairedForRoute
        }

        const routeCheckAfter = findMissingLockedUrlsInRoute(mergedCode, lockedUploadUrls, targetPreviewRoute)
        if (routeCheckAfter.targetPagePaths.length > 0 && routeCheckAfter.missingUrls.length > 0) {
          logger.warn(
            {
              targetPreviewRoute,
              targetPagePaths: routeCheckAfter.targetPagePaths,
              missingUrls: routeCheckAfter.missingUrls,
            },
            'refineCode: 目標路由修復後仍缺少鎖定圖片 URL'
          )
          return {
            success: false,
            error: `偵測到圖片被改到其他頁面（目標路由 ${targetPreviewRoute} 缺少鎖定圖片），為避免覆蓋您的設計，本次修改已取消。`,
          }
        }
      }
    }

    const missingBeforeRepair = findMissingLockedUrls(mergedCode, lockedUploadUrls)
    if (missingBeforeRepair.length > 0) {
      logger.warn(
        { missingCount: missingBeforeRepair.length, missingBeforeRepair },
        'refineCode: 偵測到鎖定圖片 URL 在合併結果中缺失，嘗試修復'
      )

      const repaired = await repairLockedUploadUrls(mergedCode, missingBeforeRepair, targetPreviewRoute)
      if (repaired) {
        mergedCode = repaired
      }

      const missingAfterRepair = findMissingLockedUrls(mergedCode, lockedUploadUrls)
      if (missingAfterRepair.length > 0) {
        logger.warn(
          { missingCount: missingAfterRepair.length, missingAfterRepair },
          'refineCode: 鎖定圖片 URL 修復後仍缺失'
        )
        return {
          success: false,
          error: '偵測到剛上傳的圖片在更新後遺失，為避免覆蓋您的設計，本次修改已取消。請再按一次儲存，或縮小修改範圍重試。',
        }
      }
    }
  }

  return {
    success: true,
    pages: mergedCode.pages,
    components: mergedCode.components,
    styles: mergedCode.styles,
  }
}

// ============================================================
// 全棧迭代修改（前端 + 後端 + 刪除）
// ============================================================

const BACKEND_PATH_PREFIXES = ['lib/', 'app/actions/', 'api/']

function isBackendPath(path: string): boolean {
  return BACKEND_PATH_PREFIXES.some(p => path.startsWith(p))
}

export async function refineFullStackCode(
  currentCode: {
    pages: GeneratedComponent[]
    components: GeneratedComponent[]
    styles: string
    backendFiles: GeneratedComponent[]
  },
  userFeedback: string,
  designContext: {
    designSystem?: DesignSystem
    designTier?: DesignTier
    designBrief?: DesignBrief
    variantConcept?: VariantConcept
    moodId?: string
    iterationHistory?: Array<{ feedback: string; filesChanged: string[] }>
    temperatureOverride?: number
  },
  trackingContext?: { userId?: string; conversationId?: string; purpose?: string },
  imageUrls?: string[],
  onTextDelta?: (text: string) => void
): Promise<FullStackGenerationResult> {
  const logger = createLogger('refine-fullstack')

  // ── 構建系統 prompt ──
  const systemPrompt = buildFullStackSystemPrompt(currentCode, userFeedback, designContext)

  // ── 構建用戶訊息 ──
  const allFiles = [
    ...currentCode.pages.map(p => `\`\`\`tsx:${p.path}\n${p.content}\n\`\`\``),
    ...currentCode.components.map(c => `\`\`\`tsx:${c.path}\n${c.content}\n\`\`\``),
    ...(currentCode.styles ? [`\`\`\`css:app/globals.css\n${currentCode.styles}\n\`\`\``] : []),
    ...currentCode.backendFiles.map(f => {
      const ext = f.path.endsWith('.ts') ? 'ts' : 'tsx'
      return `\`\`\`${ext}:${f.path}\n${f.content}\n\`\`\``
    }),
  ]

  const textContent = `## 用戶修改需求\n${userFeedback}\n\n## 當前項目代碼\n\n${allFiles.join('\n\n')}`

  // 構建用戶訊息（有圖片時用 content blocks，否則純文字）
  let userMessage: string | Anthropic.MessageCreateParams['messages'][number]['content']
  if (imageUrls?.length) {
    const blocks: Anthropic.ContentBlockParam[] = []
    for (const url of imageUrls) {
      blocks.push({
        type: 'image',
        source: { type: 'url', url },
      } as Anthropic.ImageBlockParam)
    }
    blocks.push({ type: 'text', text: `用戶上傳了參考圖片，請結合圖片內容理解修改需求。\n\n${textContent}` })
    userMessage = blocks
  } else {
    userMessage = textContent
  }

  // ── 呼叫 LLM ──
  const temperature = designContext.temperatureOverride ?? 0.3
  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 16000, temperature, promptLabel: 'refine-fullstack', maxContinuations: 2 },
    trackingContext,
    onTextDelta
  )

  if (!response.success || !response.content) {
    return { success: false, error: response.error || '全棧修改失敗，請稍後重試。' }
  }

  // ── 檢查 [NO_CHANGE] ──
  const noChangeMatch = response.content.match(/\[NO_CHANGE\]\s*(.*)/)
  if (noChangeMatch) {
    return { success: false, error: noChangeMatch[1].trim() || '無法理解您的修改需求，請更具體地描述。' }
  }

  // ── 解析 [DELETE:path] ──
  const deletedPaths: string[] = []
  const deleteRegex = /\[DELETE:([^\]]+)\]/g
  let delMatch: RegExpExecArray | null
  while ((delMatch = deleteRegex.exec(response.content)) !== null) {
    deletedPaths.push(delMatch[1].trim())
  }

  // ── 解析 code blocks ──
  const tsxRegex = /```(?:tsx|ts|typescript):([^\n]+)\n([\s\S]*?)\n```/g
  const cssRegex = /```css:([^\n]+)\n([\s\S]*?)\n```/g

  const modifiedFrontendPages = new Map<string, string>()
  const modifiedFrontendComponents = new Map<string, string>()
  const modifiedBackend = new Map<string, string>()
  let modifiedStyles = ''

  let match: RegExpExecArray | null
  while ((match = tsxRegex.exec(response.content)) !== null) {
    const path = match[1].trim()
    const content = match[2]

    if (isBackendPath(path)) {
      modifiedBackend.set(path, content)
    } else {
      // 分類前端：是否為已知 page
      const isPage = currentCode.pages.some(p => p.path === path) || path.includes('/page.')
      if (isPage) {
        modifiedFrontendPages.set(path, content)
      } else {
        modifiedFrontendComponents.set(path, content)
      }
    }
  }

  while ((match = cssRegex.exec(response.content)) !== null) {
    modifiedStyles = match[2]
  }

  // 無任何修改也無刪除 → 失敗
  if (modifiedFrontendPages.size === 0 && modifiedFrontendComponents.size === 0 &&
      modifiedBackend.size === 0 && !modifiedStyles && deletedPaths.length === 0) {
    return { success: false, error: '無法理解您的修改需求，請更具體地描述想要的變更。' }
  }

  // ── 合併前端代碼 ──
  const mergedPages = currentCode.pages
    .filter(p => !deletedPaths.includes(p.path))
    .map(p => modifiedFrontendPages.has(p.path)
      ? { ...p, content: modifiedFrontendPages.get(p.path)! }
      : p
    )
  // 新增的前端頁面
  for (const [path, content] of modifiedFrontendPages) {
    if (!mergedPages.some(p => p.path === path)) {
      mergedPages.push({ path, content, description: '' })
    }
  }

  const mergedComponents = currentCode.components
    .filter(c => !deletedPaths.includes(c.path))
    .map(c => modifiedFrontendComponents.has(c.path)
      ? { ...c, content: modifiedFrontendComponents.get(c.path)! }
      : c
    )
  for (const [path, content] of modifiedFrontendComponents) {
    if (!mergedComponents.some(c => c.path === path)) {
      mergedComponents.push({ path, content, description: '' })
    }
  }

  // ── 合併後端代碼 ──
  const mergedBackend = currentCode.backendFiles
    .filter(f => !deletedPaths.includes(f.path))
    .map(f => modifiedBackend.has(f.path)
      ? { ...f, content: modifiedBackend.get(f.path)! }
      : f
    )
  for (const [path, content] of modifiedBackend) {
    if (!mergedBackend.some(f => f.path === path)) {
      mergedBackend.push({ path, content, description: '' })
    }
  }

  // ── 簡易截斷偵測 ──
  for (const [path, newContent] of [...modifiedFrontendPages.entries(), ...modifiedBackend.entries()]) {
    const original = [...currentCode.pages, ...currentCode.components, ...currentCode.backendFiles].find(f => f.path === path)
    if (!original) continue
    const origLines = original.content.split('\n').length
    const newLines = newContent.split('\n').length
    if (origLines > 30 && newLines < origLines * 0.6) {
      logger.warn({ path, origLines, newLines }, '全棧迭代偵測到可疑截斷')
    }
  }

  logger.info({
    deletedPaths: deletedPaths.length,
    modifiedFrontend: modifiedFrontendPages.size + modifiedFrontendComponents.size,
    modifiedBackend: modifiedBackend.size,
    modifiedStyles: !!modifiedStyles,
  }, '全棧迭代完成')

  return {
    success: true,
    pages: mergedPages,
    components: mergedComponents,
    styles: modifiedStyles || currentCode.styles,
    backendFiles: mergedBackend,
    deletedPaths: deletedPaths.length > 0 ? deletedPaths : undefined,
  }
}

function buildFullStackSystemPrompt(
  currentCode: {
    pages: GeneratedComponent[]
    components: GeneratedComponent[]
    backendFiles: GeneratedComponent[]
  },
  userFeedback: string,
  designContext: {
    designSystem?: DesignSystem
    designTier?: DesignTier
    variantConcept?: VariantConcept
    iterationHistory?: Array<{ feedback: string; filesChanged: string[] }>
  }
): string {
  const fileList = [
    '### 前端頁面',
    ...currentCode.pages.map(p => `- ${p.path}`),
    '### 前端組件',
    ...currentCode.components.map(c => `- ${c.path}`),
    '### 後端檔案',
    ...currentCode.backendFiles.map(f => `- ${f.path}`),
  ].join('\n')

  const historySection = designContext.iterationHistory?.length
    ? `\n## 迭代歷史（最近 ${Math.min(designContext.iterationHistory.length, 3)} 次）\n` +
      designContext.iterationHistory.slice(-3).map((h, i) =>
        `${i + 1}. 用戶：「${h.feedback}」→ 修改：${h.filesChanged.join(', ')}`
      ).join('\n')
    : ''

  return `你是一位全棧開發者。用戶的項目使用 Next.js App Router + Server Actions + PostgreSQL（Neon）。
用戶對已完成的項目有修改意見，你需要同時修改前端和後端代碼。

## 項目檔案結構
${fileList}

## 項目架構
- 前端頁面：app/.../page.tsx（'use client'，使用 Tailwind CSS + motion/react 動畫）
- 前端組件：components/...（純 UI 組件）
- Server Actions：app/actions/*.ts（'use server'，調用 lib/actions/）
- 業務邏輯：lib/actions/*.ts（純函數，操作數據庫，通過 _stepSummary 分派子操作）
- API Routes：api/*/route.ts（與 Server Actions 平行，供 SpecFormula 測試用）
- 數據庫連接：lib/db.ts（禁止修改）

## Server Action 調用約定
前端調用格式：\`actionFn({ _stepSummary: '操作描述', ...data })\`
lib/actions 內部用 \`if (op.includes('...'))\` 分派子操作。修改時必須保持 _stepSummary 與 dispatch 一致。

## 修改規則
1. **只修改用戶要求的部分**，不要改動不相關的檔案
2. 前端保持 'use client' 指令、motion/react 動畫、next/font 字體、Tailwind CSS
3. 後端保持 _stepSummary dispatch 模式，保持參數化查詢（$1, $2...），禁止字串拼接 SQL
4. **禁止修改 lib/db.ts**
5. 移除功能時：前端頁面 + app/actions + lib/actions + api route 必須一起處理
6. 移除功能後：更新相關的導航連結、路由跳轉、條件判斷
7. 保持無障礙功能（aria-label 等）

## 輸入驗證（最高優先）
在修改代碼之前，先判斷用戶的訊息是否為**明確且可執行的修改請求**。
如果用戶的訊息屬於以下情況，**不要修改任何代碼**，只輸出 [NO_CHANGE] 加上簡短原因：
- 無意義文字、亂碼、隨機字元（如「asdf」「哈哈哈」「test」「123」）
- 與修改完全無關的閒聊（如「你好」「今天天氣怎樣」「你是誰」）
- 過於模糊無法執行的指令（如「改好一點」「變漂亮」），此時請在原因中引導用戶給出具體需求
- 用戶要求修改或移除的功能/組件/區塊在現有代碼中不存在（如「移除購物車」但代碼中沒有購物車相關組件），此時請在原因中說明代碼中沒有該功能，並列出現有的主要頁面與組件供用戶參考

格式範例：
[NO_CHANGE] 代碼中沒有「購物車」相關功能。目前的組件包括：HeroSection、FeatureGrid、PricingTable。如需修改，請指定現有組件。

## 刪除文件
用 [DELETE:path] 標記要刪除的文件（每行一個，放在代碼區塊之前）。
只有整個文件不再需要時才使用 DELETE。如果只是修改文件內容，直接輸出修改後的完整代碼。

## 輸出格式
先列出所有需要刪除的文件（如有），然後列出所有需要修改的文件：

[DELETE:path/to/removed-file.tsx]

\`\`\`tsx:path/to/modified-frontend.tsx
// 完整修改後的代碼（不是 diff）
\`\`\`

\`\`\`ts:lib/actions/modified-backend.ts
// 完整修改後的代碼
\`\`\`

重要：
- code fence 第一行必須直接是代碼，禁止 "Here is the code" 類說明文字
- 未修改的文件不要輸出
- 每個文件必須輸出完整內容（不是 diff 或片段）
${historySection}`
}
