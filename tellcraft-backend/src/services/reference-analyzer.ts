/**
 * 參考網站真實分析服務
 * URL 偵測 → metadata 抓取 → 截圖 → Claude Vision 分析
 * 三層降級：vision → metadata_only → text_only
 */

import * as cheerio from 'cheerio'
import { getAnthropicClient, MODEL, trackLlmUsage } from '../lib/anthropic'
import { getEnv } from '../lib/env'
import { createLogger } from '../lib/logger'

const logger = createLogger('reference-analyzer')

// ── DOM/CSS 結構化提取型別 ──

interface SectionComputedStyles {
  backgroundColor?: string
  color?: string
  fontFamily?: string
  fontSize?: string
  fontWeight?: string
  padding?: string
  gap?: string
  display?: string
  flexDirection?: string
  gridTemplateColumns?: string
  borderRadius?: string
  maxWidth?: string
  textAlign?: string
}

interface DomSectionChild {
  tag: string
  role?: string
  textPreview?: string
  styles?: SectionComputedStyles
}

interface DomSection {
  index: number
  tag: string
  role?: string
  landmark?: string
  textPreview?: string
  childCount: number
  styles: SectionComputedStyles
  children?: DomSectionChild[]
  estimatedHeight?: number
}

export interface ExtractedColors {
  backgrounds: string[]
  texts: string[]
  accents: string[]
  borders: string[]
  gradients?: string[]
}

export interface ExtractedTypography {
  headingFont?: string
  bodyFont?: string
  monoFont?: string
  fontSizeRange?: { min: string; max: string }
  googleFontsDetected?: string[]
}

export interface ExtractedLayout {
  sectionCount: number
  navStyle?: 'horizontal' | 'sidebar' | 'hamburger' | 'none'
  heroPresent?: boolean
  footerPresent?: boolean
  containerMaxWidth?: string
  dominantLayout?: 'grid' | 'flex-column' | 'flex-row' | 'mixed'
  spacingDensity?: 'tight' | 'normal' | 'spacious'
}

export interface ReferenceAnalysis {
  url: string
  metadata: {
    title?: string
    description?: string
    ogImage?: string
    themeColor?: string
  }
  visionAnalysis?: string
  analysisSource: 'vision' | 'uploaded_image' | 'metadata_only' | 'text_only'
  error?: string
  domStructure?: DomSection[]
  colorPalette?: ExtractedColors
  typography?: ExtractedTypography
  layoutInfo?: ExtractedLayout
}

interface LlmTrackingContext {
  userId?: string
  conversationId?: string
  purpose?: string
}

// ── URL 偵測 + SSRF 防護 ──

export function isUrl(input: string): boolean {
  return /^https?:\/\/\S+/i.test(input.trim())
}

export function extractFirstUrl(input: string): string | null {
  const match = input.match(/https?:\/\/[^\s,，、;；]+/i)
  return match ? match[0] : null
}

export function isSafeUrl(url: string): boolean {
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

export async function takeScreenshot(url: string): Promise<Buffer | null> {
  try {
    const puppeteer = await import('puppeteer-core')
    const browser = await puppeteer.default.launch({
      executablePath: getEnv().CHROMIUM_PATH || '/usr/bin/chromium-browser',
      headless: true,
      args: PUPPETEER_ARGS,
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
    logger.warn({ error: String(err).slice(0, 200) }, '截圖失敗')
    return null
  }
}

/**
 * 渲染 HTML 字串並截圖（用於 seed 模板縮圖生成）
 * 使用 page.setContent() 取代 page.goto()，不需要外部 URL
 */
export async function screenshotHtmlContent(html: string): Promise<Buffer | null> {
  try {
    const puppeteer = await import('puppeteer-core')
    const browser = await puppeteer.default.launch({
      executablePath: getEnv().CHROMIUM_PATH || '/usr/bin/chromium-browser',
      headless: true,
      args: PUPPETEER_ARGS,
    })

    try {
      const page = await browser.newPage()
      await page.setViewport({ width: 1440, height: 900 })
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 25000 })
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
    logger.warn({ error: String(err).slice(0, 200) }, 'HTML 內容截圖失敗')
    return null
  }
}

// ── DOM/CSS 結構化提取 ──

export const PUPPETEER_ARGS = [
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--single-process',
  '--disable-extensions',
  '--disable-background-networking',
  '--disable-default-apps',
  '--no-first-run',
]

interface PageExtractionResult {
  screenshot: Buffer | null
  domStructure: DomSection[]
  colorPalette: ExtractedColors
  typography: ExtractedTypography
  layoutInfo: ExtractedLayout
}

const EMPTY_EXTRACTION = {
  domStructure: [] as DomSection[],
  colorPalette: { backgrounds: [], texts: [], accents: [], borders: [] } as ExtractedColors,
  typography: {} as ExtractedTypography,
  layoutInfo: { sectionCount: 0 } as ExtractedLayout,
}

/**
 * RGB 歐幾里得距離，用於色板去重
 */
export function hexDistance(a: string, b: string): number {
  const parse = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ]
  const [r1, g1, b1] = parse(a)
  const [r2, g2, b2] = parse(b)
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

function dedupeColors(colors: string[], minDistance = 30): string[] {
  const result: string[] = []
  for (const c of colors) {
    if (!c.startsWith('#') || c.length !== 7) continue
    if (result.every(existing => hexDistance(existing, c) >= minDistance)) {
      result.push(c)
    }
  }
  return result
}

/**
 * 後處理：截斷、去重、正規化
 */
export function postProcessExtraction(raw: {
  domStructure: DomSection[]
  colorPalette: ExtractedColors
  typography: ExtractedTypography
  layoutInfo: ExtractedLayout
}): { domStructure: DomSection[]; colorPalette: ExtractedColors; typography: ExtractedTypography; layoutInfo: ExtractedLayout } {
  const meaningful = raw.domStructure
    .filter(s => s.estimatedHeight && s.estimatedHeight > 80)
    .slice(0, 15)

  const colorPalette: ExtractedColors = {
    backgrounds: dedupeColors(raw.colorPalette.backgrounds, 25),
    texts: dedupeColors(raw.colorPalette.texts, 40),
    accents: dedupeColors(raw.colorPalette.accents, 30),
    borders: dedupeColors(raw.colorPalette.borders, 30),
    gradients: raw.colorPalette.gradients,
  }

  const typography = { ...raw.typography }
  if (typography.headingFont) typography.headingFont = typography.headingFont.trim()
  if (typography.bodyFont) typography.bodyFont = typography.bodyFont.trim()
  if (typography.monoFont) typography.monoFont = typography.monoFont.trim()

  return { domStructure: meaningful, colorPalette, typography, layoutInfo: raw.layoutInfo }
}

/**
 * 瀏覽器上下文提取腳本（字串形式，避免 TypeScript 檢查 DOM API）
 * page.evaluate() 接受字串或函數，字串形式不受 Node.js tsconfig lib 限制
 */
const BROWSER_EXTRACTION_SCRIPT = `(function() {
  function rgbToHex(rgb) {
    var match = rgb.match(/\\d+/g);
    if (!match || match.length < 3) return rgb;
    var r = parseInt(match[0]), g = parseInt(match[1]), b = parseInt(match[2]);
    return '#' + [r, g, b].map(function(v) { return v.toString(16).padStart(2, '0'); }).join('');
  }

  function getStyles(el) {
    var cs = window.getComputedStyle(el);
    var result = {};
    var bg = cs.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') result.backgroundColor = rgbToHex(bg);
    result.color = rgbToHex(cs.color);
    result.fontFamily = cs.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
    result.fontSize = cs.fontSize;
    result.fontWeight = cs.fontWeight;
    if (cs.padding !== '0px') result.padding = cs.padding;
    if (cs.gap !== 'normal' && cs.gap !== '0px') result.gap = cs.gap;
    result.display = cs.display;
    if (cs.display === 'flex') result.flexDirection = cs.flexDirection;
    if (cs.display === 'grid') result.gridTemplateColumns = cs.gridTemplateColumns;
    if (cs.borderRadius !== '0px') result.borderRadius = cs.borderRadius;
    if (cs.maxWidth !== 'none') result.maxWidth = cs.maxWidth;
    if (cs.textAlign !== 'start') result.textAlign = cs.textAlign;
    return result;
  }

  // 1. Section 識別
  var selectorList = 'body > *, body > * > section, main > *, main > section, [role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], header, footer, nav';
  var seen = new Set();
  var sectionEls = [];
  document.querySelectorAll(selectorList).forEach(function(el) {
    if (seen.has(el)) return;
    var rect = el.getBoundingClientRect();
    if (rect.height > 50 && rect.width > 200) {
      seen.add(el);
      sectionEls.push(el);
    }
  });
  var sections = sectionEls.slice(0, 20);

  // 2. Section 結構 + 樣式
  var coreChildTags = ['H1', 'H2', 'H3', 'BUTTON', 'A', 'P'];
  var domStructure = sections.map(function(el, index) {
    var rect = el.getBoundingClientRect();
    var children = Array.from(el.children).slice(0, 5).map(function(child) {
      var entry = { tag: child.tagName.toLowerCase() };
      var role = child.getAttribute('role');
      if (role) entry.role = role;
      var text = (child.textContent || '').trim().slice(0, 50);
      if (text) entry.textPreview = text;
      if (coreChildTags.indexOf(child.tagName) !== -1) {
        entry.styles = getStyles(child);
      }
      return entry;
    });
    return {
      index: index,
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute('role') || undefined,
      landmark: el.getAttribute('aria-label') || el.id || undefined,
      textPreview: (el.textContent || '').trim().slice(0, 80) || undefined,
      childCount: el.children.length,
      styles: getStyles(el),
      children: children.length > 0 ? children : undefined,
      estimatedHeight: Math.round(rect.height)
    };
  });

  // 3. 色板提取
  var bgMap = {}, textMap = {}, accentMap = {}, borderMap = {};
  var allEls = document.querySelectorAll('*');
  var sampleSize = Math.min(allEls.length, 500);
  var step = Math.max(1, Math.floor(allEls.length / sampleSize));
  for (var i = 0; i < allEls.length; i += step) {
    var el = allEls[i];
    var cs = window.getComputedStyle(el);
    var bg = cs.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      var hex = rgbToHex(bg);
      bgMap[hex] = (bgMap[hex] || 0) + 1;
    }
    var textColor = cs.color;
    if (textColor) {
      var thex = rgbToHex(textColor);
      textMap[thex] = (textMap[thex] || 0) + 1;
    }
    if (cs.borderWidth !== '0px' && cs.borderColor !== 'rgb(0, 0, 0)') {
      var bhex = rgbToHex(cs.borderColor);
      borderMap[bhex] = (borderMap[bhex] || 0) + 1;
    }
    if (el.tagName === 'BUTTON' || el.tagName === 'A') {
      var abg = bg && bg !== 'rgba(0, 0, 0, 0)' ? rgbToHex(bg) : null;
      if (abg && abg !== '#ffffff' && abg !== '#000000') {
        accentMap[abg] = (accentMap[abg] || 0) + 1;
      }
    }
  }

  // Gradient 偵測
  var gradients = [];
  document.querySelectorAll('*').forEach(function(el) {
    if (gradients.length >= 2) return;
    var bgImg = window.getComputedStyle(el).backgroundImage;
    if (bgImg && bgImg.indexOf('gradient') !== -1) {
      gradients.push(bgImg.slice(0, 150));
    }
  });

  function sortByFreq(map, limit) {
    return Object.entries(map).sort(function(a, b) { return b[1] - a[1]; }).slice(0, limit).map(function(e) { return e[0]; });
  }
  var colorPalette = {
    backgrounds: sortByFreq(bgMap, 6),
    texts: sortByFreq(textMap, 4),
    accents: sortByFreq(accentMap, 3),
    borders: sortByFreq(borderMap, 3),
    gradients: gradients.length > 0 ? gradients : undefined
  };

  // 4. 字體提取
  var headingFreq = {}, bodyFreq = {}, monoFreq = {};
  document.querySelectorAll('h1,h2,h3,h4').forEach(function(el) {
    var font = window.getComputedStyle(el).fontFamily.split(',')[0].replace(/['"]/g, '').trim();
    headingFreq[font] = (headingFreq[font] || 0) + 1;
  });
  document.querySelectorAll('p,li,span,td').forEach(function(el) {
    var font = window.getComputedStyle(el).fontFamily.split(',')[0].replace(/['"]/g, '').trim();
    bodyFreq[font] = (bodyFreq[font] || 0) + 1;
  });
  document.querySelectorAll('code,pre,kbd').forEach(function(el) {
    var font = window.getComputedStyle(el).fontFamily.split(',')[0].replace(/['"]/g, '').trim();
    monoFreq[font] = (monoFreq[font] || 0) + 1;
  });

  var googleFonts = [];
  document.querySelectorAll('link[href*="fonts.googleapis.com"]').forEach(function(link) {
    var href = link.getAttribute('href') || '';
    var families = href.match(/family=([^&:]+)/g);
    if (families) {
      families.forEach(function(m) {
        var name = m.replace('family=', '').replace(/\\+/g, ' ');
        if (googleFonts.indexOf(name) === -1) googleFonts.push(name);
      });
    }
  });

  var fontSizes = [];
  document.querySelectorAll('h1,h2,h3,p,span').forEach(function(el) {
    var size = parseFloat(window.getComputedStyle(el).fontSize);
    if (size > 0) fontSizes.push(size);
  });
  fontSizes.sort(function(a, b) { return a - b; });

  function topFont(map) {
    var sorted = Object.entries(map).sort(function(a, b) { return b[1] - a[1]; });
    return sorted.length > 0 ? sorted[0][0] : undefined;
  }
  var typography = {
    headingFont: topFont(headingFreq),
    bodyFont: topFont(bodyFreq),
    monoFont: topFont(monoFreq),
    fontSizeRange: fontSizes.length > 0 ? { min: fontSizes[0] + 'px', max: fontSizes[fontSizes.length - 1] + 'px' } : undefined,
    googleFontsDetected: googleFonts.length > 0 ? googleFonts : undefined
  };

  // 5. 佈局提取
  var navEl = document.querySelector('nav, [role="navigation"]');
  var navStyle;
  if (navEl) {
    var navCs = window.getComputedStyle(navEl);
    if (navCs.display === 'flex' && navCs.flexDirection === 'row') navStyle = 'horizontal';
    else if (navCs.position === 'fixed' && parseFloat(navCs.width) > 200) navStyle = 'sidebar';
    else navStyle = 'horizontal';
  }
  var heroEl = document.querySelector('[class*="hero" i], [id*="hero" i], section:first-of-type');
  var heroPresent = heroEl ? heroEl.getBoundingClientRect().height > 400 : false;
  var mainContainer = document.querySelector('main, [role="main"], [class*="container" i]');
  var containerMaxWidth = mainContainer ? window.getComputedStyle(mainContainer).maxWidth : undefined;

  var paddings = sections.map(function(el) { return parseFloat(window.getComputedStyle(el).paddingTop) || 0; });
  var avgPadding = paddings.length > 0 ? paddings.reduce(function(a, b) { return a + b; }, 0) / paddings.length : 24;

  var displays = sections.map(function(el) { return window.getComputedStyle(el).display; });
  var gridCount = displays.filter(function(d) { return d === 'grid'; }).length;
  var flexCount = displays.filter(function(d) { return d === 'flex'; }).length;
  var dominantLayout = gridCount > flexCount ? 'grid' : (flexCount > 2 ? 'flex-column' : 'mixed');

  var layoutInfo = {
    sectionCount: sections.length,
    navStyle: navStyle,
    heroPresent: heroPresent,
    footerPresent: !!document.querySelector('footer, [role="contentinfo"]'),
    containerMaxWidth: containerMaxWidth !== 'none' ? containerMaxWidth : undefined,
    dominantLayout: dominantLayout,
    spacingDensity: avgPadding < 16 ? 'tight' : (avgPadding > 48 ? 'spacious' : 'normal')
  };

  return { domStructure: domStructure, colorPalette: colorPalette, typography: typography, layoutInfo: layoutInfo };
})()`

/**
 * 在 Puppeteer page 中提取 DOM 結構 + CSS computed styles + 色板 + 字體 + 佈局
 * 同一個 browser session 中先截圖再提取
 */
async function extractPageData(url: string): Promise<PageExtractionResult> {
  try {
    const puppeteer = await import('puppeteer-core')
    const browser = await puppeteer.default.launch({
      executablePath: getEnv().CHROMIUM_PATH || '/usr/bin/chromium-browser',
      headless: true,
      args: PUPPETEER_ARGS,
    })

    try {
      const page = await browser.newPage()
      await page.setViewport({ width: 1440, height: 900 })
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 12000 })
      await new Promise(r => setTimeout(r, 1500))

      // 1. 截圖
      let screenshot: Buffer | null = null
      try {
        const raw = await page.screenshot({ type: 'jpeg', quality: 75, fullPage: false })
        screenshot = Buffer.from(raw)
      } catch (err) {
        logger.warn({ error: String(err).slice(0, 200) }, '截圖失敗')
      }

      // 2. DOM/CSS 提取（獨立 try-catch，不影響截圖）
      let extracted = EMPTY_EXTRACTION
      try {
        const rawData = await Promise.race([
          page.evaluate(BROWSER_EXTRACTION_SCRIPT),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('extraction timeout')), 5000)),
        ])
        extracted = postProcessExtraction(rawData as { domStructure: DomSection[]; colorPalette: ExtractedColors; typography: ExtractedTypography; layoutInfo: ExtractedLayout })
      } catch (err) {
        logger.warn({ error: String(err).slice(0, 200) }, 'DOM/CSS 提取失敗，降級為純截圖')
      }

      return { screenshot, ...extracted }
    } finally {
      await browser.close()
    }
  } catch (err) {
    logger.warn({ error: String(err).slice(0, 200) }, 'Browser launch 失敗')
    return { screenshot: null, ...EMPTY_EXTRACTION }
  }
}

// ── 格式化結構化數據為 prompt 段落 ──

/**
 * 將結構化提取數據格式化為可注入生成 prompt 的 markdown 段落
 * 無數據時返回空字串（降級不注入）
 */
export function formatStructuredDataForPrompt(analysis: ReferenceAnalysis): string {
  if (!analysis.colorPalette && !analysis.typography && !analysis.layoutInfo) return ''

  const sections: string[] = []

  if (analysis.colorPalette) {
    const cp = analysis.colorPalette
    const parts = [`### 參考網站精確色板（從 DOM computed styles 提取 — 可直接使用）`]
    if (cp.backgrounds.length) parts.push(`- 背景: ${cp.backgrounds.join(', ')}`)
    if (cp.texts.length) parts.push(`- 文字: ${cp.texts.join(', ')}`)
    if (cp.accents.length) parts.push(`- 強調/CTA: ${cp.accents.join(', ')}`)
    if (cp.borders.length) parts.push(`- 邊框: ${cp.borders.join(', ')}`)
    if (cp.gradients?.length) parts.push(`- 漸層: ${cp.gradients.join('; ')}`)
    if (parts.length > 1) sections.push(parts.join('\n'))
  }

  if (analysis.typography) {
    const tp = analysis.typography
    const parts = [`### 參考網站字體（精確提取）`]
    if (tp.headingFont) parts.push(`- 標題字體: ${tp.headingFont}`)
    if (tp.bodyFont) parts.push(`- 內文字體: ${tp.bodyFont}`)
    if (tp.monoFont) parts.push(`- 等寬字體: ${tp.monoFont}`)
    if (tp.fontSizeRange) parts.push(`- 字體大小範圍: ${tp.fontSizeRange.min} ~ ${tp.fontSizeRange.max}`)
    if (tp.googleFontsDetected?.length) parts.push(`- Google Fonts: ${tp.googleFontsDetected.join(', ')}`)
    if (parts.length > 1) sections.push(parts.join('\n'))
  }

  if (analysis.layoutInfo && analysis.layoutInfo.sectionCount > 0) {
    const li = analysis.layoutInfo
    const parts = [`### 參考網站佈局骨架`]
    parts.push(`- ${li.sectionCount} 個 Section${li.heroPresent ? '（含 Hero）' : ''}`)
    parts.push(`- 導航: ${li.navStyle || '未知'} | 留白: ${li.spacingDensity}`)
    parts.push(`- 主要佈局模式: ${li.dominantLayout}`)
    if (li.containerMaxWidth) parts.push(`- 容器最大寬度: ${li.containerMaxWidth}`)
    sections.push(parts.join('\n'))
  }

  if (analysis.domStructure?.length) {
    const sectionLabels = analysis.domStructure.slice(0, 8).map(s =>
      `${s.tag}${s.landmark ? `#${s.landmark}` : ''}(${s.styles.display || 'block'}, h≈${s.estimatedHeight}px)`
    ).join(' → ')
    sections.push(`### Section 流向\n${sectionLabels}`)
  }

  return sections.join('\n\n')
}

// ── Claude Vision 分析 ──

/**
 * 增強版 Vision 分析：注入結構化 DOM/CSS 提取數據讓 Haiku 做精確分析
 */
async function analyzeWithVisionEnhanced(
  screenshot: Buffer,
  metadata: SiteMetadata,
  url: string,
  structuredData: { domStructure: DomSection[]; colorPalette: ExtractedColors; typography: ExtractedTypography; layoutInfo: ExtractedLayout },
  trackingContext?: LlmTrackingContext
): Promise<string | null> {
  try {
    const client = getAnthropicClient()
    const base64 = screenshot.toString('base64')

    const structureSummary = structuredData.domStructure.slice(0, 10).map(s =>
      `- ${s.tag}${s.landmark ? `#${s.landmark}` : ''}${s.role ? `[${s.role}]` : ''}: h=${s.estimatedHeight}px, ${s.styles.display || 'block'}${s.styles.backgroundColor ? `, bg=${s.styles.backgroundColor}` : ''}`
    ).join('\n')

    const systemPrompt = `你是一位專業的 UI/UX 設計分析師。分析這個網站截圖的視覺設計特徵。

## 網站資訊
- URL: ${url}
${metadata.title ? `- 標題: ${metadata.title}` : ''}

## 已提取的精確數據（DOM + CSS computed styles — 這些是事實，不要猜測）

### 精確色板
- 背景色: ${structuredData.colorPalette.backgrounds.join(', ') || '未偵測'}
- 文字色: ${structuredData.colorPalette.texts.join(', ') || '未偵測'}
- 強調色: ${structuredData.colorPalette.accents.join(', ') || '未偵測'}
- 邊框色: ${structuredData.colorPalette.borders.join(', ') || '未偵測'}
${structuredData.colorPalette.gradients?.length ? `- 漸層: ${structuredData.colorPalette.gradients.join('; ')}` : ''}

### 字體
- 標題字體: ${structuredData.typography.headingFont || '未偵測'}
- 內文字體: ${structuredData.typography.bodyFont || '未偵測'}
- 字體大小範圍: ${structuredData.typography.fontSizeRange ? `${structuredData.typography.fontSizeRange.min} ~ ${structuredData.typography.fontSizeRange.max}` : '未偵測'}
${structuredData.typography.googleFontsDetected?.length ? `- Google Fonts: ${structuredData.typography.googleFontsDetected.join(', ')}` : ''}

### 佈局結構
- Section 數量: ${structuredData.layoutInfo.sectionCount}
- 導航: ${structuredData.layoutInfo.navStyle || '未偵測'}
- Hero 區塊: ${structuredData.layoutInfo.heroPresent ? '有' : '無'}
- 主要佈局: ${structuredData.layoutInfo.dominantLayout}
- 留白密度: ${structuredData.layoutInfo.spacingDensity}
- 容器寬度: ${structuredData.layoutInfo.containerMaxWidth || '未限制'}

### Section 骨架（前 10 個）
${structureSummary || '（無 section 資料）'}

## 分析要求
基於**截圖觀察 + 上述精確數據**，用繁體中文分析（每項 1-2 句）：

1. **配色策略**：基於上方精確 HEX 值，描述配色風格和策略
2. **字體風格**：基於上方字體數據，分析字體搭配策略
3. **佈局策略**：基於 Section 骨架，分析結構組織方式
4. **留白程度**：基於 spacing density 數據判斷
5. **視覺風格**：minimal/bold/elegant/playful/corporate/editorial
6. **特殊元素**：截圖中觀察到的動畫暗示、特殊形狀、互動模式
7. **設計氛圍**：1-2 個關鍵詞
8. **Design Tier 建議**：functional 或 creative

最後 2-3 句話總結設計精髓。`

    const response = await client.messages.create({
      model: MODEL.HAIKU,
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
            text: '基於截圖和精確數據分析此網站的視覺設計。',
          },
        ],
      }],
    })

    if (response.usage) {
      trackLlmUsage({
        model: MODEL.HAIKU,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        purpose: 'reference_vision_analysis_enhanced',
        conversationId: trackingContext?.conversationId,
      })
    }

    const text = response.content[0]
    if (text.type === 'text') return text.text.trim()
    return null
  } catch (err) {
    logger.warn({ error: String(err).slice(0, 200) }, '增強 Vision 分析失敗')
    return null
  }
}

async function analyzeWithVision(
  screenshot: Buffer,
  metadata: SiteMetadata,
  url: string,
  trackingContext?: LlmTrackingContext
): Promise<string | null> {
  try {
    const client = getAnthropicClient()
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
      model: MODEL.HAIKU,
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
      trackLlmUsage({
        model: MODEL.HAIKU,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        purpose: 'reference_vision_analysis',
        conversationId: trackingContext?.conversationId,
      })
    }

    const text = response.content[0]
    if (text.type === 'text') return text.text.trim()
    return null
  } catch (err) {
    logger.warn({ error: String(err).slice(0, 200) }, 'Vision 分析失敗')
    return null
  }
}

// ── 上傳圖片 Vision 分析 ──

async function analyzeUploadedImageWithVision(
  imageBuffer: Buffer,
  mediaType: string,
  trackingContext?: LlmTrackingContext
): Promise<string | null> {
  try {
    const client = getAnthropicClient()
    const base64 = imageBuffer.toString('base64')

    const systemPrompt = `你是一位專業的 UI/UX 設計分析師。分析這張設計參考圖片的視覺設計特徵。

## 分析要求
用繁體中文，以簡潔專業的語氣分析以下方面（每項 1-2 句話）：

1. **配色策略**：提取精確 HEX 色值（主色、背景色、文字色至少各 1 個），配色風格（單色/雙色/多色/漸層）
2. **字體風格**：serif/sans-serif/mono、大小層次、字重使用
3. **佈局策略**：整體結構（grid/flex/bento/不對稱）、導航方式、內容組織
4. **留白程度**：tight/normal/spacious、呼吸感
5. **視覺風格**：minimal/bold/elegant/playful/corporate/editorial
6. **組件層級**：按鈕風格（圓角/方角/填充/描邊）、卡片樣式、表單風格、間距密度
7. **特殊元素**：動畫暗示、特殊形狀、圖片處理方式、互動模式
8. **設計氛圍**：1-2 個關鍵詞總結
9. **Design Tier 建議**：functional（功能導向、克制）或 creative（表現力強、大膽）

最後用 2-3 句話總結這張設計的精髓，說明哪些設計決策值得參考。`

    const response = await client.messages.create({
      model: MODEL.HAIKU,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: base64,
            },
          },
          {
            type: 'text',
            text: '請分析這張設計參考圖片的視覺設計。',
          },
        ],
      }],
    })

    if (response.usage) {
      trackLlmUsage({
        model: MODEL.HAIKU,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        purpose: 'uploaded_image_vision_analysis',
        conversationId: trackingContext?.conversationId,
      })
    }

    const text = response.content[0]
    if (text.type === 'text') return text.text.trim()
    return null
  } catch (err) {
    logger.warn({ error: String(err).slice(0, 200) }, '上傳圖片 Vision 分析失敗')
    return null
  }
}

/**
 * 分析用戶上傳的參考圖片
 * fetch imageUrl → Buffer → Vision 分析
 * 降級：fetch 或 Vision 失敗 → text_only
 */
export async function analyzeUploadedImage(
  imageUrl: string,
  trackingContext?: LlmTrackingContext
): Promise<ReferenceAnalysis> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    let buffer: Buffer
    let mediaType: string
    try {
      const resp = await fetch(imageUrl, { signal: controller.signal })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const contentType = resp.headers.get('content-type') || 'image/jpeg'
      mediaType = contentType.split(';')[0].trim()
      // 驗證是圖片類型
      if (!mediaType.startsWith('image/')) {
        throw new Error(`不支援的內容類型: ${mediaType}`)
      }
      const arrayBuffer = await resp.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } finally {
      clearTimeout(timeout)
    }

    const visionAnalysis = await analyzeUploadedImageWithVision(buffer, mediaType, trackingContext)
    if (visionAnalysis) {
      return {
        url: imageUrl,
        metadata: {},
        visionAnalysis,
        analysisSource: 'uploaded_image',
      }
    }

    return {
      url: imageUrl,
      metadata: {},
      analysisSource: 'text_only',
      error: 'Vision 分析失敗',
    }
  } catch (err) {
    logger.warn({ error: String(err).slice(0, 200), imageUrl }, '上傳圖片分析失敗')
    return {
      url: imageUrl,
      metadata: {},
      analysisSource: 'text_only',
      error: `圖片分析失敗: ${err instanceof Error ? err.message : '未知錯誤'}`,
    }
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

  // 並行：metadata 抓取 + 截圖 + DOM/CSS 提取
  const [metadataResult, pageDataResult] = await Promise.allSettled([
    fetchMetadata(url),
    extractPageData(url),
  ])

  const metadata: SiteMetadata = metadataResult.status === 'fulfilled'
    ? metadataResult.value
    : {}

  const pageData = pageDataResult.status === 'fulfilled'
    ? pageDataResult.value
    : null

  const screenshot = pageData?.screenshot ?? null
  const domStructure = pageData?.domStructure ?? []
  const colorPalette = pageData?.colorPalette ?? EMPTY_EXTRACTION.colorPalette
  const typography = pageData?.typography ?? EMPTY_EXTRACTION.typography
  const layoutInfo = pageData?.layoutInfo ?? EMPTY_EXTRACTION.layoutInfo

  const hasStructuredData = domStructure.length > 0 || colorPalette.backgrounds.length > 0

  // 有截圖 → Vision 分析（優先使用增強版）
  if (screenshot) {
    const visionAnalysis = hasStructuredData
      ? await analyzeWithVisionEnhanced(screenshot, metadata, url, { domStructure, colorPalette, typography, layoutInfo }, trackingContext)
      : await analyzeWithVision(screenshot, metadata, url, trackingContext)

    if (visionAnalysis) {
      return {
        url,
        metadata,
        visionAnalysis,
        analysisSource: 'vision',
        domStructure: domStructure.length > 0 ? domStructure : undefined,
        colorPalette: colorPalette.backgrounds.length > 0 ? colorPalette : undefined,
        typography: Object.keys(typography).length > 0 ? typography as ExtractedTypography : undefined,
        layoutInfo: layoutInfo.sectionCount > 0 ? layoutInfo : undefined,
      }
    }
  }

  // 新增降級層：無截圖或 Vision 失敗，但有 DOM 結構化數據
  if (hasStructuredData) {
    return {
      url,
      metadata,
      analysisSource: 'metadata_only',
      domStructure: domStructure.length > 0 ? domStructure : undefined,
      colorPalette: colorPalette.backgrounds.length > 0 ? colorPalette : undefined,
      typography: Object.keys(typography).length > 0 ? typography as ExtractedTypography : undefined,
      layoutInfo: layoutInfo.sectionCount > 0 ? layoutInfo : undefined,
      error: screenshot ? 'Vision 分析失敗，使用 DOM 結構化提取' : '截圖失敗，使用 DOM 結構化提取',
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
