/**
 * 參考網站真實分析服務
 * URL 偵測 → metadata 抓取 → 截圖 → Claude Vision 分析
 * 三層降級：vision → metadata_only → text_only
 */

import Anthropic from '@anthropic-ai/sdk'
import * as cheerio from 'cheerio'
import { recordLlmUsage } from '../db/client'

export interface ReferenceAnalysis {
  url: string
  metadata: {
    title?: string
    description?: string
    ogImage?: string
    themeColor?: string
  }
  visionAnalysis?: string
  analysisSource: 'vision' | 'metadata_only' | 'text_only'
  error?: string
}

interface LlmTrackingContext {
  userId?: string
  conversationId?: string
  purpose?: string
}

// ── Anthropic client（獨立於 uiux-generation.ts）──

let anthropicClient: Anthropic | null = null

function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('缺少 ANTHROPIC_API_KEY')
    anthropicClient = new Anthropic({ apiKey })
  }
  return anthropicClient
}

// ── URL 偵測 + SSRF 防護 ──

function isUrl(input: string): boolean {
  return /^https?:\/\/\S+/i.test(input.trim())
}

function extractFirstUrl(input: string): string | null {
  const match = input.match(/https?:\/\/[^\s,，、;；]+/i)
  return match ? match[0] : null
}

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return false
    const host = parsed.hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return false
    if (host.startsWith('192.168.') || host.startsWith('10.')) return false
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false
    if (host.endsWith('.local') || host.endsWith('.internal')) return false
    if (host === '[::1]') return false
    return true
  } catch {
    return false
  }
}

// ── Metadata 抓取（cheerio）──

interface SiteMetadata {
  title?: string
  description?: string
  ogImage?: string
  themeColor?: string
}

async function fetchMetadata(url: string): Promise<SiteMetadata> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

    const html = await resp.text()
    const $ = cheerio.load(html)

    return {
      title: $('title').first().text().trim() ||
             $('meta[property="og:title"]').attr('content')?.trim(),
      description: $('meta[name="description"]').attr('content')?.trim() ||
                   $('meta[property="og:description"]').attr('content')?.trim(),
      ogImage: $('meta[property="og:image"]').attr('content')?.trim(),
      themeColor: $('meta[name="theme-color"]').attr('content')?.trim(),
    }
  } finally {
    clearTimeout(timeout)
  }
}

// ── 截圖（puppeteer-core）──

async function takeScreenshot(url: string): Promise<Buffer | null> {
  try {
    const puppeteer = await import('puppeteer-core')
    const browser = await puppeteer.default.launch({
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--single-process',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--no-first-run',
      ],
    })

    try {
      const page = await browser.newPage()
      await page.setViewport({ width: 1440, height: 900 })
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 12000 })
      // 等待動畫/lazy-load 穩定
      await new Promise(r => setTimeout(r, 1500))
      const buffer = await page.screenshot({
        type: 'jpeg',
        quality: 75,
        fullPage: false,
      })
      return Buffer.from(buffer)
    } finally {
      await browser.close()
    }
  } catch (err) {
    console.warn('[ReferenceAnalyzer] 截圖失敗:', String(err).slice(0, 200))
    return null
  }
}

// ── Claude Vision 分析 ──

async function analyzeWithVision(
  screenshot: Buffer,
  metadata: SiteMetadata,
  url: string,
  trackingContext?: LlmTrackingContext
): Promise<string | null> {
  try {
    const client = getClient()
    const base64 = screenshot.toString('base64')

    const systemPrompt = `你是一位專業的 UI/UX 設計分析師。分析這個網站截圖的視覺設計特徵。

## 網站資訊
- URL: ${url}
${metadata.title ? `- 標題: ${metadata.title}` : ''}
${metadata.description ? `- 描述: ${metadata.description}` : ''}
${metadata.themeColor ? `- 主題色: ${metadata.themeColor}` : ''}

## 分析要求
用繁體中文，以簡潔專業的語氣分析以下方面（每項 1-2 句話）：

1. **配色策略**：主色調、輔助色、配色風格（單色/雙色/多色/漸層）
2. **字體風格**：serif/sans-serif/mono、大小層次、字重使用
3. **佈局策略**：整體結構（grid/flex/bento/不對稱）、導航方式、內容組織
4. **留白程度**：tight/normal/spacious、呼吸感
5. **視覺風格**：minimal/bold/elegant/playful/corporate/editorial
6. **特殊元素**：動畫暗示、特殊形狀、圖片處理方式、互動模式
7. **設計氛圍**：1-2 個關鍵詞總結
8. **Design Tier 建議**：functional（功能導向、克制）或 creative（表現力強、大膽）

最後用 2-3 句話總結這個網站的設計精髓，說明哪些設計決策值得參考。`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64,
            },
          },
          {
            type: 'text',
            text: '請分析這個網站的視覺設計。',
          },
        ],
      }],
    })

    // 記錄 LLM 用量
    if (response.usage) {
      recordLlmUsage({
        model: 'claude-haiku-4-5-20251001',
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        costUsd: (response.usage.input_tokens * 0.8 + response.usage.output_tokens * 4) / 1_000_000,
        purpose: 'reference_vision_analysis',
        conversationId: trackingContext?.conversationId,
      }).catch(err => console.error('[ReferenceAnalyzer] 記錄用量失敗:', err))
    }

    const text = response.content[0]
    if (text.type === 'text') return text.text.trim()
    return null
  } catch (err) {
    console.warn('[ReferenceAnalyzer] Vision 分析失敗:', String(err).slice(0, 200))
    return null
  }
}

// ── 主函數 ──

export async function analyzeReference(
  input: string,
  trackingContext?: LlmTrackingContext
): Promise<ReferenceAnalysis> {
  const trimmed = input.trim()

  // 非 URL → 純文字模式（行為與原本相同）
  const url = extractFirstUrl(trimmed)
  if (!url || !isUrl(url)) {
    return {
      url: '',
      metadata: {},
      analysisSource: 'text_only',
    }
  }

  // SSRF 防護
  if (!isSafeUrl(url)) {
    return {
      url,
      metadata: {},
      analysisSource: 'text_only',
      error: '此網址無法分析（內部網路位址）',
    }
  }

  // 並行：metadata 抓取 + 截圖
  const [metadataResult, screenshotResult] = await Promise.allSettled([
    fetchMetadata(url),
    takeScreenshot(url),
  ])

  const metadata: SiteMetadata = metadataResult.status === 'fulfilled'
    ? metadataResult.value
    : {}

  const screenshot = screenshotResult.status === 'fulfilled'
    ? screenshotResult.value
    : null

  // 有截圖 → Vision 分析
  if (screenshot) {
    const visionAnalysis = await analyzeWithVision(screenshot, metadata, url, trackingContext)
    if (visionAnalysis) {
      return {
        url,
        metadata,
        visionAnalysis,
        analysisSource: 'vision',
      }
    }
  }

  // 截圖失敗或 Vision 失敗 → 降級 metadata
  if (metadata.title || metadata.description) {
    return {
      url,
      metadata,
      analysisSource: 'metadata_only',
      error: screenshot ? 'Vision 分析失敗，僅使用網站基本資訊' : '無法截圖，僅使用網站基本資訊',
    }
  }

  // 全失敗 → 純文字
  return {
    url,
    metadata: {},
    analysisSource: 'text_only',
    error: '無法存取此網站',
  }
}
