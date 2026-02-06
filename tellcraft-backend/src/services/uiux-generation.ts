/**
 * UIUX 生成服務
 * 負責設計變體生成、合併、和最終程式碼生成
 */

// LLM 函數需要從後端獨立實現
import Anthropic from '@anthropic-ai/sdk'

// 模組級 Anthropic 單例（避免每次 callClaude 都 new）
let anthropicClient: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('缺少 CLAUDE_API_KEY 或 ANTHROPIC_API_KEY')
    }
    anthropicClient = new Anthropic({ apiKey })
  }
  return anthropicClient
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

// callClaude — 使用 streaming 避免長請求超時
async function callClaude(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options?: {
    maxTokens?: number
    temperature?: number
  },
  _trackingContext?: LlmTrackingContext
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const anthropic = getAnthropicClient()

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 0.2,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    })

    const finalMessage = await stream.finalMessage()

    const content = finalMessage.content[0]
    if (content.type === 'text') {
      return { success: true, content: content.text }
    }

    return { success: false, error: '無法取得回應內容' }
  } catch (err) {
    return { success: false, error: `呼叫 LLM 時發生錯誤: ${err}` }
  }
}

// ============================================================
// Design Tier（功能型 vs 創意型）
// ============================================================

export type DesignTier = 'functional' | 'creative'

// ============================================================
// 共用 Craft 原則（兩個 tier 都適用）
// ============================================================

/**
 * 共用的 Craft Foundations — 不分 tier，所有生成都必須遵守
 */
function getCraftFoundations(): string {
  return `## Craft Foundations（設計品質底線）

### Subtle Layering（微層次 — 最重要的品質指標）
- 表面之間的差異必須微妙但可辨識 — 學習 Vercel、Supabase、Linear 的做法
- 色階跳躍要輕柔：不是 gray-100 到 gray-300，而是 gray-50 到 gray-100
- 邊框要輕但不隱形 — 不看不見，找時能找到
- Squint test：模糊眼睛看介面，仍然能感知層級，但沒有東西跳出來刺眼

### 顏色意圖
- 灰色構建結構，彩色傳達意義（狀態、動作、強調、品牌）
- 沒有動機的彩色就是噪音
- 一個有意圖的 accent color 勝過五個隨意的顏色
- 每個顏色都能追溯到語義：foreground（文字層級）、background（表面層級）、border（分隔層級）、brand、semantic

### 間距系統
- 選定一個 base unit（4px 或 8px）嚴格用倍數
- 一致性比具體數字重要
- 隨意的間距值是「沒有設計系統」的最明顯信號
- padding 保持對稱，除非有明確的理由不對稱

### 深度策略（選一個，全局堅持）
- **Borders-only**：乾淨、技術感，適合密集工具
- **Subtle shadows**：柔和提升，適合親和的產品
- **Layered shadows**：高級感、立體感，適合需要存在感的卡片
- 禁止混合使用。不要同時用粗邊框和陰影

### 圓角
- 銳利 = 技術感，圓潤 = 親和感
- 選定一個 scale 全局一致使用
- 小元素不要用大圓角

### 排版層級
- 標題需要 weight 和 tight tracking
- 正文需要可讀性
- 數據需要 monospace 或 tabular-nums
- 建立清晰的層級：不只是大小，還有 weight、color、spacing

### 互動狀態完整性
- 每個互動元素必須有：default / hover / active / focus / disabled
- 數據必須有：loading / empty / error 狀態
- 缺少狀態 = 感覺壞了

### 禁止清單（通用）
- 刺眼的邊框 — 如果邊框是你第一眼看到的東西，它太強了
- 劇烈的表面跳躍 — elevation 變化要像耳語一般安靜
- 混合深度策略 — 不要同時 border + shadow
- 大面積 drop shadow — 陰影要微妙，不要搶注意力
- 小元素用大圓角
- 純白卡片放在有色背景上
- 粗裝飾性邊框
- 純裝飾用途的漸層和顏色 — 顏色必須有意義
- 原生 select/date input — 無法 style，必須自建組件`
}

// ============================================================
// Tier-specific 約束集
// ============================================================

/**
 * 根據 tier 返回結構生成階段的約束文本
 */
function getStructureConstraints(tier: DesignTier): string {
  const craft = getCraftFoundations()

  if (tier === 'creative') {
    return `${craft}

## 設計約束（Creative Tier — 創意型）
允許更多視覺表現力，但保持專業品味：

### 顏色與視覺
- 漸層 OK（有品味的線性漸層，禁止紫色多色漸層 — 那仍是 AI slop）
- 背景可以有紋理、微妙漸層、幾何圖案
- 多 accent color OK（最多 3 個，必須協調）
- 適度使用 glow/光暈效果（輕微、小面積）

### 佈局
- 不對稱佈局、overlap 元素、grid-breaking OK
- 可以有全寬 hero section、大膽的留白
- 可以使用 sticky scroll、parallax-like 效果（用 transform 實現）

### 字體
- 鼓勵獨特的字體選擇（display font + body font 搭配）
- 禁止只用 Inter/Roboto/Arial
- 可以使用大號標題（clamp() 響應式）

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

### 顏色與視覺
- 禁止漸層（除非用戶明確要求）
- 禁止 glow 效果作為主要視覺手段
- 每個視圖限一個 accent color — 灰色構建結構，accent 只在需要行動或注意的地方出現
- 優先使用 Tailwind 預設陰影和色彩 tokens
- 表面差異要微妙 — 不要 gray-100 / gray-300 的劇烈跳躍

### 佈局
- 佈局必須從數據特性和用戶任務出發，不是套模板
- 同一種資料有無限呈現方式：metric 可以是 hero number / sparkline / progress ring / comparison delta / trend badge
- 問自己：用戶在這個畫面最常做什麼？佈局是否為那個動作服務？
- 導航不是腳手架，導航就是產品 — 它教用戶如何理解這個空間

### 字體
- 可讀性優先
- 字體不是容器，字體就是設計 — 標題的 weight、label 的個性、段落的質感定義了產品感覺
- 禁止 Inter/Roboto/Arial 作為唯一字體（可以作為 fallback）

### 禁止
- 紫色多色漸層（AI slop）
- 千篇一律的 card grid 佈局 — sidebar + 同大小卡片矩陣是 AI 生成的最明顯特徵
- 過度裝飾
- 過度使用 emoji
- 多個 accent color — 稀釋焦點`
}

/**
 * 根據 tier 返回動畫生成階段的約束文本
 */
function getAnimationConstraints(tier: DesignTier): string {
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
- 鼓勵獨特的字體搭配
- 佈局可以不對稱、有 overlap
- Variant E (Expressive) 應該特別大膽

## Signature Element
每個變體必須有一個「Signature」— 一個只屬於這個產品的視覺/結構/互動元素。
如果把產品名稱拿掉，看到這個元素就能猜到是什麼產品，那就是好的 Signature。`
  }

  return `## Design Tier: Functional（功能型）
這是一個功能導向的產品。設計變體應該保守專業：
- 禁止漸層、glow 效果
- 每個視圖限一個 accent color
- 動畫克制

## Anti-Default 原則
每個設計選擇都必須是有意識的，不能因為「常見」就使用。
- 同樣的資料有無限的呈現方式 — metric 不一定是 icon + 大數字 + 小標籤
- sidebar 不一定是唯一的導航方式
- card grid 不是唯一的佈局模式

## Signature Element
每個變體必須有一個「Signature」— 一個能讓這個介面與其他 dashboard 區分的元素。
可以是 token 命名（--ink 而不是 --gray-700）、獨特的 metric 展示方式、特殊的導航模式等。
不需要誇張，但必須有識別度。`
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
- 漸層背景、紋理、微妙的粒子或幾何效果
- 獨特的字體搭配（display font + body font）
- 不對稱佈局、overlap 元素、打破 grid
- 豐富的 hover 效果和入場動畫
- 大膽但有品味的配色方案
- 但保持專業品味，不要卡通化`,
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
    prompt: `專注於視覺層級和信息架構：
- 明確的標題層級（H1→H2→H3）
- 使用大小和粗細區分重要性
- 留白引導視線流動
- 主要操作突出，次要操作內斂`,
  },
  B: {
    id: 'B' as const,
    name: 'Layout Model',
    axis: 'layout' as const,
    description: '探索根本不同的空間組織方式',
    prompt: `探索根本不同的空間組織方式（不只是 Card/List/Table 三選一）：
- 思考數據的本質特性最適合什麼呈現方式
- 考慮非對稱佈局、分割面板、timeline、地圖式等非常規方案
- 不要從「常見佈局」出發，而是從「這些數據怎麼被理解」出發
- 佈局本身就是設計決策，不是預設模板的選擇`,
  },
  C: {
    id: 'C' as const,
    name: 'Density',
    axis: 'density' as const,
    description: '密度變化：Compact vs Spacious',
    prompt: `調整信息密度：
- Compact：更緊湊的間距，適合專業用戶
- Comfortable：平衡的間距，適合日常使用
- Spacious：更多留白，適合消費級產品
根據目標用戶選擇合適的密度`,
  },
  D: {
    id: 'D' as const,
    name: 'Interaction',
    axis: 'interaction' as const,
    description: '探索獨特的互動模式和操作流程',
    prompt: `探索能讓用戶「驚喜但合理」的互動模式：
- 思考這個產品的核心操作是什麼，用最少步驟完成
- 考慮非常規互動：gesture、long-press reveal、contextual toolbar、inline expansion
- 反饋機制要有個性（不只是 toast — 考慮 inline confirmation、progress storytelling）
- 通過 Swap Test 驗證：如果換個產品也用同樣互動，是否需要重新設計？`,
  },
  E: {
    id: 'E' as const,
    name: 'Expressive',
    axis: 'expressive' as const,
    description: '表現力：有意義的動畫和品牌特色',
    prompt: `增強表現力和品牌特色：
- 有意義的微動畫（狀態轉換、載入、成功反饋）
- 品牌色彩的創意運用
- 獨特的視覺元素
- 但避免過度設計`,
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
  trackingContext?: LlmTrackingContext
): Promise<DesignVariantsResult> {
  const tier = designTier || 'functional'
  const axes = getVariantAxes(tier)

  const systemPrompt = `你是一位資深的 UI/UX 設計師和前端架構師。你的任務是為一個產品生成 5 個不同方向的設計變體。

## 產品類型
${productType}

## 模板基礎
- 名稱：${template.name}
- 類別：${template.category}
- 設計默認值：${JSON.stringify(template.designDefaults, null, 2)}

## BDD 規格（功能需求）
${bddSpec || '（無規格）'}

${getVariantPromptHint(tier)}

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
          "border": "#..."
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
        }
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

## 設計原則
1. **每個變體必須有明確的差異**：不是細微調整，而是設計方向的根本不同
2. **顏色來自產品世界**：如果這個產品是一個實體空間，你會看到什麼顏色？顏色要有來源，不是隨意套用
3. **字體是設計，不是容器**：字體的 weight、個性、質感定義產品的感覺，而不只是裝文字
4. **間距要一致**：使用 4px 或 8px 為基礎單位
5. **避免 AI Slop**：不要紫色漸層、glow 效果、過度裝飾
6. **Subtle Layering**：表面之間的差異要微妙但可辨識，邊框輕但不隱形，陰影安靜但有層次
${tier === 'creative' ? `7. **大膽設計**：Creative tier 允許漸層（有品味的）、多色、不對稱佈局
8. **獨特字體**：鼓勵使用 display font + body font 搭配` : ''}

## 禁止
- 不要使用 Inter, Roboto, Arial 作為唯一字體（可以作為 fallback）
- 不要使用紫色漸層配白色背景
- 不要使用過度飽和的顏色
- 不要 5 個變體都用同樣的 sidebar 寬度和卡片排列 — 這是 AI 生成最明顯的特徵
${tier === 'functional' ? '- 不要使用漸層（除非明確要求）\n- 不要使用 glow 效果' : '- 漸層 OK 但禁止紫色多色漸層\n- 輕微 glow OK 但禁止大面積 glow'}`

  const userMessage = `請根據上述信息，生成 5 個設計變體。確保每個變體都有獨特的設計方向和完整的 Design System。`

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 16384, temperature: 0.4 }, // 稍低的 temperature 確保結構一致
    { ...trackingContext, purpose: 'generate_design_variants' }
  )

  if (!response.success || !response.content) {
    return { success: false, error: response.error || '無法生成設計變體' }
  }

  try {
    // 解析 JSON
    const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.content.match(/\{[\s\S]*"variants"[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: '無法解析 LLM 回應' }
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonStr)

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
  allVariants: DesignVariant[]
): DesignSystem {
  // 如果只選擇一個變體，直接返回其 Design System
  if (selectedVariantIds.length === 1) {
    const variant = allVariants.find(v => v.id === selectedVariantIds[0])
    if (variant) {
      return variant.designSystem
    }
  }

  // 多個變體合併：優先使用第一個選擇的作為基礎，然後合併其他
  const baseVariant = allVariants.find(v => v.id === selectedVariantIds[0])
  if (!baseVariant) {
    // fallback 到第一個變體
    return allVariants[0].designSystem
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
        break
      case 'layout':
        // 合併佈局偏好到 metadata
        if (!result.metadata) result.metadata = {}
        result.metadata.layoutPreference = variant.description
        break
      case 'interaction':
        // 合併互動模式偏好到 metadata
        if (!result.metadata) result.metadata = {}
        result.metadata.interactionModel = variant.description
        break
    }
  }

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
function buildDesignSystemPrompt(designSystem: DesignSystem): string {
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

### 字體規範
- Font Family: ${designSystem.typography.fontFamily}
- Scale: ${JSON.stringify(designSystem.typography.scale)}

### 間距規範
- Base Unit: ${designSystem.spacing.unit}px
- Scale: ${JSON.stringify(designSystem.spacing.scale)}

### 圓角規範
${JSON.stringify(designSystem.borderRadius, null, 2)}

## 技術棧
- Next.js 16 App Router（優先使用 Server Components）
- Tailwind CSS（使用 CSS variables）
- TypeScript

## 輸出格式
每個檔案使用以下格式：

\`\`\`tsx:path/to/file.tsx
// 檔案內容
\`\`\`

## 顏色使用規則
- 只使用 Design System 定義的顏色
- 使用 CSS variables：bg-[var(--color-primary)] 或自訂 Tailwind
- 禁止使用 Tailwind 默認顏色（bg-blue-500 等）`
}

/**
 * 解析 LLM 輸出的檔案
 */
function parseGeneratedFiles(content: string, designSystem: DesignSystem): {
  pages: GeneratedComponent[]
  components: GeneratedComponent[]
  styles: string
} {
  const tsxRegex = /```tsx:([^\n]+)\n([\s\S]*?)```/g
  const tsRegex = /```ts:([^\n]+)\n([\s\S]*?)```/g
  const cssRegex = /```css:([^\n]+)\n([\s\S]*?)```/g

  const pages: GeneratedComponent[] = []
  const components: GeneratedComponent[] = []
  let styles = ''

  // 解析 .tsx 檔案
  let match
  while ((match = tsxRegex.exec(content)) !== null) {
    const path = match[1].trim()
    const fileContent = match[2].trim()

    if (path.includes('/page.tsx') || path.includes('/page.ts')) {
      pages.push({
        path,
        content: fileContent,
        description: `頁面: ${path.split('/').slice(-2, -1)[0]}`,
      })
    } else {
      components.push({
        path,
        content: fileContent,
        description: `組件: ${path.split('/').pop()?.replace('.tsx', '')}`,
      })
    }
  }

  // 解析 .ts 檔案（utility、types、configs）
  while ((match = tsRegex.exec(content)) !== null) {
    const path = match[1].trim()
    const fileContent = match[2].trim()

    if (path.includes('/page.ts')) {
      pages.push({
        path,
        content: fileContent,
        description: `頁面: ${path.split('/').slice(-2, -1)[0]}`,
      })
    } else {
      components.push({
        path,
        content: fileContent,
        description: `工具: ${path.split('/').pop()?.replace('.ts', '')}`,
      })
    }
  }

  while ((match = cssRegex.exec(content)) !== null) {
    const path = match[1].trim()
    const fileContent = match[2].trim()

    if (path.includes('globals.css') || path.includes('global.css')) {
      styles = fileContent
    }
  }

  // 如果沒有解析到 styles，嘗試其他格式
  if (!styles) {
    const cssMatch = content.match(/```css\n([\s\S]*?)```/)
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

// ============================================================
// 三階段程式碼生成
// ============================================================

/**
 * 階段 1：生成結構（Structure）
 * 生成靜態的桌面版本，包含 HTML 結構、基礎 CSS、組件骨架
 * 不包含動畫和響應式設計
 */
export async function generateStructure(
  designSystem: DesignSystem,
  pages: string[],
  template: TemplateData,
  bddSpec?: string,
  designTier?: DesignTier,
  trackingContext?: LlmTrackingContext
): Promise<GenerationResult> {
  const tier = designTier || 'functional'

  const systemPrompt = `你是一位專業的前端開發者。根據提供的 Design System 生成靜態的桌面版前端代碼。

${buildDesignSystemPrompt(designSystem)}

## 本階段任務：結構生成（Structure）
這是第一階段，只需要生成：
1. 完整的 HTML 結構
2. 基礎 CSS 樣式（顏色、字體、間距、圓角）
3. 組件的靜態版本

## 本階段禁止
- 不要添加任何動畫效果（transition, animation, motion）
- 不要添加響應式設計（md:, lg:, @media）
- 不要使用 'use client' 除非絕對必要
- 假設寬度為 1280px 桌面版

${getStructureConstraints(tier)}

## 組件規則
- 有鍵盤/focus 行為的組件使用 Radix 或 React Aria
- 破壞性操作用 AlertDialog 確認
- loading state 用 skeleton

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
- <img> 必須有 explicit width + height 屬性（或用 next/image 的 fill）防止 CLS

`

  const userMessage = `請生成以下頁面和共用組件的靜態桌面版：

## 頁面列表
${pages.map(p => `- ${p}`).join('\n')}

## 模板資訊
- 名稱：${template.name}
- 類別：${template.category}
- 描述：${template.description}

${bddSpec ? `## BDD 規格\n${bddSpec}` : ''}

## 需要生成的內容
1. 每個頁面的 page.tsx（靜態結構）
2. 共用的 Layout 組件（Header, Footer）
3. 常用 UI 組件（Button, Card, Input）
4. globals.css（包含 CSS variables）

請確保所有組件使用一致的 Design System。這是第一階段，動畫和響應式會在後續階段添加。`

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 32768, temperature: 0.2 },
    { ...trackingContext, purpose: 'generate_structure' }
  )

  if (!response.success || !response.content) {
    return { success: false, error: response.error || '無法生成結構代碼' }
  }

  const { pages: generatedPages, components: generatedComponents, styles } = parseGeneratedFiles(response.content, designSystem)

  return {
    success: true,
    pages: generatedPages,
    components: generatedComponents,
    styles,
  }
}

/**
 * 階段 2：添加動畫（Animations）
 * 在現有代碼基礎上添加動畫效果
 */
export async function generateAnimations(
  designSystem: DesignSystem,
  existingCode: {
    pages: GeneratedComponent[]
    components: GeneratedComponent[]
    styles: string
  },
  designTier?: DesignTier,
  trackingContext?: LlmTrackingContext
): Promise<GenerationResult> {
  const tier = designTier || 'functional'

  const systemPrompt = `你是一位專業的前端動畫專家。在現有代碼基礎上添加適當的動畫效果。

${buildDesignSystemPrompt(designSystem)}

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
- 不要添加響應式設計
- 不要使用 CSS animation（使用 motion/react）`

  const existingCodeStr = [
    ...existingCode.pages.map(p => `\`\`\`tsx:${p.path}\n${p.content}\n\`\`\``),
    ...existingCode.components.map(c => `\`\`\`tsx:${c.path}\n${c.content}\n\`\`\``),
    `\`\`\`css:globals.css\n${existingCode.styles}\n\`\`\``,
  ].join('\n\n')

  const userMessage = `請在以下代碼基礎上添加動畫效果：

## 現有代碼
${existingCodeStr}

## 需要添加的動畫
1. 頁面/區塊入場動畫（stagger effect）
2. 按鈕 hover/tap 動畫
3. 卡片 hover 提升效果
4. Loading skeleton 動畫
5. 表單輸入 focus 動畫

請輸出完整的修改後代碼，保持相同的檔案路徑格式。`

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 32768, temperature: 0.2 },
    { ...trackingContext, purpose: 'generate_animations' }
  )

  if (!response.success || !response.content) {
    return { success: false, error: response.error || '無法生成動畫代碼' }
  }

  const { pages, components, styles } = parseGeneratedFiles(response.content, designSystem)

  // 如果沒有解析到新的 styles，保留原有的
  const finalStyles = styles || existingCode.styles

  return {
    success: true,
    pages: pages.length > 0 ? pages : existingCode.pages,
    components: components.length > 0 ? components : existingCode.components,
    styles: finalStyles,
  }
}

/**
 * 階段 3：添加響應式設計（RWD）
 * 在現有代碼基礎上添加響應式設計
 */
export async function generateRwd(
  designSystem: DesignSystem,
  existingCode: {
    pages: GeneratedComponent[]
    components: GeneratedComponent[]
    styles: string
  },
  designTier?: DesignTier,
  trackingContext?: LlmTrackingContext
): Promise<GenerationResult> {
  const tier = designTier || 'functional'

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

  const systemPrompt = `你是一位專業的響應式設計專家。在現有代碼基礎上添加完整的響應式設計。

${buildDesignSystemPrompt(designSystem)}

${rwdTierHint}

## 本階段任務：響應式設計（RWD）
這是第三階段，需要：
1. 添加移動端佈局（< 768px）
2. 添加平板佈局（768px - 1024px）
3. 添加移動端導航（漢堡選單）
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

## 移動端導航
- 提供漢堡選單（使用 Radix Dialog 或 Sheet）
- 選單打開時鎖定背景滾動
- 支援鍵盤導航和 ESC 關閉

## 禁止
- 不要移除現有的動畫效果
- 不要改變現有的桌面版佈局
- 不要使用 display: none 隱藏重要內容（用 sr-only）
- 不要破壞無障礙功能

## Pre-Delivery Checklist（RWD 完成前自我檢查）
在輸出最終代碼前，逐項確認：

### 排版與文字
- [ ] 標題用 text-balance，內文用 text-pretty
- [ ] 移動端最小字體 16px（避免 iOS 自動放大）
- [ ] 長文字有 truncate 或 line-clamp 保護

### 互動元素
- [ ] 所有可點擊元素有 cursor-pointer
- [ ] 觸控目標至少 44×44px（移動端）
- [ ] hover 效果不影響移動端（用 @media (hover: hover)）
- [ ] 每個互動元素有完整狀態：default/hover/active/focus/disabled
- [ ] focus ring 用 focus-visible 不是 focus
- [ ] touch-action: manipulation 已設定（消除 300ms 延遲）
- [ ] Modal/Drawer 有 overscroll-behavior: contain

### 對比度與可見性
- [ ] 正文文字對比度足夠（light: slate-900, dark: slate-100）
- [ ] placeholder 可見但不搶焦點（slate-400）
- [ ] disabled 狀態視覺明確但不消失（opacity-50 + cursor-not-allowed）

### 佈局完整性
- [ ] 固定元素尊重 safe-area-inset
- [ ] 移動端導航可用且可關閉（ESC + 點擊外部）
- [ ] 表單移動端 inputmode 正確（email/tel/numeric）
- [ ] 圖片有 explicit width/height 或 aspect-ratio 防止 CLS
- [ ] Flex 子元素有 min-w-0（truncate 才能生效）

### 效能
- [ ] 響應式圖片用 srcset 或 next/image
- [ ] 離屏動畫暫停
- [ ] 尊重 prefers-reduced-motion
- [ ] 沒有 transition-all（必須列出具體屬性）

### 無障礙
- [ ] <html lang="..."> 已設定
- [ ] Skip Link 存在且 focus 時可見
- [ ] Heading 層級連續（h1→h2→h3，無跳級）
- [ ] 動態訊息用 aria-live 或 role="status"/role="alert"`

  const existingCodeStr = [
    ...existingCode.pages.map(p => `\`\`\`tsx:${p.path}\n${p.content}\n\`\`\``),
    ...existingCode.components.map(c => `\`\`\`tsx:${c.path}\n${c.content}\n\`\`\``),
    `\`\`\`css:globals.css\n${existingCode.styles}\n\`\`\``,
  ].join('\n\n')

  const userMessage = `請在以下代碼基礎上添加響應式設計：

## 現有代碼
${existingCodeStr}

## 需要添加的響應式功能
1. Header 移動端漢堡選單
2. 網格佈局響應式調整（4列→2列→1列）
3. 側邊欄折疊或變成底部導航
4. 表單輸入移動端優化
5. 卡片堆疊佈局
6. 字體和間距響應式調整

請輸出完整的修改後代碼，保持相同的檔案路徑格式。`

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 32768, temperature: 0.2 },
    { ...trackingContext, purpose: 'generate_rwd' }
  )

  if (!response.success || !response.content) {
    return { success: false, error: response.error || '無法生成響應式代碼' }
  }

  const { pages, components, styles } = parseGeneratedFiles(response.content, designSystem)

  // 如果沒有解析到新的 styles，保留原有的
  const finalStyles = styles || existingCode.styles

  return {
    success: true,
    pages: pages.length > 0 ? pages : existingCode.pages,
    components: components.length > 0 ? components : existingCode.components,
    styles: finalStyles,
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
  console.log('[UIUX] generateAllCode: 使用三階段生成流程')

  // 階段 1：結構
  const structureResult = await generateStructure(designSystem, pages, template, bddSpec, designTier, trackingContext)
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
    console.warn('[UIUX] generateAllCode: 動畫生成失敗，使用結構產出繼續', animationResult.error)
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
    console.warn('[UIUX] generateAllCode: RWD 生成失敗，使用前一階段產出', rwdResult.error)
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
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        ${designSystem.colorPalette.destructive ? "destructive: 'var(--color-destructive)'," : ''}
        ${designSystem.colorPalette.success ? "success: 'var(--color-success)'," : ''}
      },
      fontFamily: {
        sans: ['${designSystem.typography.fontFamily.split(',')[0].trim()}', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        none: 'var(--radius-none)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
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
  trackingContext?: LlmTrackingContext
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

  const systemPrompt = `你是一位資深 UI/UX 設計顧問。你的任務是根據用戶提供的資訊，總結設計方向並給出專業建議。

## 產品類型
${productType}

## BDD 規格
${bddSpec || '（無規格）'}

${templateContext}

${ideasContext}

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
  "referenceAnalysis": "參考分析（基於用戶提到的參考或模板特色，1-2 句話）",
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
    { maxTokens: 2048, temperature: 0.3 },
    { ...trackingContext, purpose: 'generate_design_brief' }
  )

  if (!response.success || !response.content) {
    return { success: false, error: response.error || '無法生成設計方向摘要' }
  }

  try {
    const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.content.match(/\{[\s\S]*"styleSummary"[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: '無法解析設計方向摘要' }
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonStr)

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
    const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.content.match(/\{[\s\S]*"styleSummary"[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: '無法解析調整後的設計方向' }
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonStr)

    // 解析 tier（保持當前 tier 如果 LLM 沒回傳）
    let recommendedTier = currentBrief.recommendedTier
    if (parsed.recommendedTier === 'creative' || parsed.recommendedTier === 'functional') {
      recommendedTier = parsed.recommendedTier
    }

    const brief: DesignBrief = {
      styleSummary: parsed.styleSummary,
      colorDirection: parsed.colorDirection,
      layoutSuggestion: parsed.layoutSuggestion,
      referenceAnalysis: parsed.referenceAnalysis,
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
