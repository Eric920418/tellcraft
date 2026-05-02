/**
 * 參考網站真實分析服務
 * URL 偵測 → metadata 抓取 → 截圖 → Claude Vision 分析
 * 三層降級：vision → metadata_only → text_only
 */

import * as cheerio from 'cheerio'
import { getAnthropicClient, MODEL, trackLlmUsage } from '../lib/anthropic'
import { getEnv } from '../lib/env'
import { createLogger } from '../lib/logger'
import { lookupBrandByDomain, inferBrandFromText } from './brand-domain-map'
import { loadDesignMdParsed } from './design-md-loader'

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
  analysisSource: 'vision' | 'uploaded_image' | 'metadata_only' | 'text_only' | 'vendored_designmd'
  error?: string
  domStructure?: DomSection[]
  colorPalette?: ExtractedColors
  typography?: ExtractedTypography
  layoutInfo?: ExtractedLayout
  /**
   * 結構化設計系統（DESIGN.md schema）。
   * 來源：(1) vendored awesome-design-md 短路，(2) callStructured Vision 路徑（B 階段，feature-flagged）。
   * 既有欄位（colorPalette/typography/layoutInfo）保留作 backward-compat — 5 個下游消費點漸進遷移。
   */
  designSystem?: import('../types/design-system-schema').DesignSystem
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

/** T5: 從一段文字抽出所有 URL（去重，保留順序）。 */
export function extractAllUrls(input: string): string[] {
  const matches = input.match(/https?:\/\/[^\s,，、;；()'"]+/gi) || []
  const seen = new Set<string>()
  const ordered: string[] = []
  for (const m of matches) {
    const url = m.replace(/[.,;:!?)]+$/, '')  // 剝末端標點
    if (!seen.has(url)) { seen.add(url); ordered.push(url) }
  }
  return ordered
}

/**
 * 判斷 IPv4 字串是否屬於私有 / 保留段。
 *
 * 不直接接受 hostname — 呼叫端需確認傳入的是 IPv4 字串（純數字 + 點）。
 * 涵蓋：
 *  - 0.0.0.0/8（unspecified）
 *  - 10.0.0.0/8、172.16.0.0/12、192.168.0.0/16（RFC1918 私有）
 *  - 127.0.0.0/8（loopback）
 *  - 169.254.0.0/16（link-local，含 AWS/GCP/Azure metadata 169.254.169.254）
 *  - 100.64.0.0/10（CGNAT）
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(n => parseInt(n, 10))
  if (parts.length !== 4 || parts.some(n => Number.isNaN(n) || n < 0 || n > 255)) return false
  const [a, b] = parts
  if (a === 0) return true
  if (a === 10) return true
  if (a === 127) return true
  if (a === 169 && b === 254) return true // link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
  return false
}

/**
 * 判斷 IPv6 字串是否屬於私有 / loopback / link-local / IPv4-mapped 私有段。
 */
function isPrivateIPv6(host: string): boolean {
  // 移除 [] 包裝
  const ip = host.replace(/^\[/, '').replace(/\]$/, '').toLowerCase()

  // ::1（loopback）、::（unspecified）
  if (ip === '::1' || ip === '::') return true

  // ::ffff:* — IPv4-mapped IPv6 一律拒絕。
  // Node URL parser 會把 ::ffff:127.0.0.1 規範化為 hex 形式 ::ffff:7f00:1，
  // 解析 hex 還原 IPv4 太繁瑣且容易漏；合法外網不會用 IPv4-mapped 形式存取，
  // 全擋是最安全做法。
  if (ip.startsWith('::ffff:')) return true

  // fc00::/7 (ULA Unique Local Address)：fc** 或 fd**
  if (/^fc[0-9a-f]{2}:/i.test(ip) || /^fd[0-9a-f]{2}:/i.test(ip)) return true

  // fe80::/10 (link-local)：fe8x / fe9x / feax / febx
  if (/^fe[89ab][0-9a-f]:/i.test(ip)) return true

  return false
}

export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return false

    // hostname 已被 URL parser 處理（含 IDN 規範化 + 小寫 + IPv6 帶 []）
    const host = parsed.hostname.toLowerCase()

    // 明確主機名稱黑名單
    if (host === 'localhost' || host === '0.0.0.0') return false
    if (host.endsWith('.local') || host.endsWith('.internal')) return false

    // IPv4 純數字 hostname
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
      if (isPrivateIPv4(host)) return false
      return true
    }

    // IPv6 hostname — URL parser 會給出帶 [] 或不帶 [] 的形式
    if (host.includes(':') || host.startsWith('[')) {
      if (isPrivateIPv6(host)) return false
      return true
    }

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
  // 優先消費結構化 DesignSystem（Phase B 重構後 vendored / vision 路徑都會填這個）
  // 其次降級到舊欄位（colorPalette/typography/layoutInfo）— 5 個下游消費點漸進遷移
  if (analysis.designSystem) {
    return formatDesignSystemForPrompt(analysis.designSystem)
  }
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

/**
 * 把結構化 DesignSystem 格式化為 prompt 段落。
 *
 * 設計選擇：
 *   - 優先輸出 brand vendored 的整段 rawMarkdown（高保真，LLM cache 對齊）
 *   - Vision 來源無 rawMarkdown 時從結構化欄位 render
 *   - 截斷在 ~6000 字元以避免單一 reference 吃光 prompt budget（DESIGN.md 平均 22KB
 *     → ~5500 字元 effective payload，超出時保留 visualTheme + colorPalette + typography
 *     的 markdown 片段）
 */
function formatDesignSystemForPrompt(ds: import('../types/design-system-schema').DesignSystem): string {
  const MAX_LEN = 6000
  const sourceLabel = ds.metadata.source === 'vendored_designmd'
    ? `### 參考品牌設計系統（${ds.metadata.brandKey ?? 'unknown'}）— 高保真 vendored`
    : `### 參考設計系統（${ds.metadata.source}）`

  const md = ds.rawMarkdown
  if (md && md.length <= MAX_LEN) return `${sourceLabel}\n\n${md}`
  if (md) {
    // 找第一個 H2 (## ) 開頭，從該位置截到 MAX_LEN
    const cutoff = md.slice(0, MAX_LEN)
    const lastH2 = cutoff.lastIndexOf('\n## ')
    const safe = lastH2 > 0 ? md.slice(0, lastH2) : cutoff
    return `${sourceLabel}\n\n${safe}\n\n_(截斷以節省 prompt budget — 完整 ${md.length} 字元)_`
  }
  // No rawMarkdown — render from structured fields
  const lines: string[] = [sourceLabel]
  if (ds.visualTheme?.atmosphere) {
    lines.push('', '#### Visual Theme', ds.visualTheme.atmosphere)
  }
  if (ds.colorPalette) {
    lines.push('', '#### Color Palette')
    for (const [k, arr] of Object.entries(ds.colorPalette)) {
      if (!arr || !arr.length) continue
      lines.push(`- ${k}: ${arr.slice(0, 6).map(e => `${e.name} (${e.value})`).join(', ')}`)
    }
  }
  if (ds.typography) {
    lines.push('', '#### Typography')
    if (ds.typography.primaryFont) lines.push(`- Primary: ${ds.typography.primaryFont}`)
    if (ds.typography.monoFont) lines.push(`- Mono: ${ds.typography.monoFont}`)
    if (ds.typography.hierarchy?.length) {
      const sample = ds.typography.hierarchy.slice(0, 6)
        .map(r => `${r.role}${r.size ? ` ${r.size}` : ''}${r.weight ? ` w${r.weight}` : ''}`)
        .join(' / ')
      lines.push(`- Hierarchy: ${sample}`)
    }
  }
  if (ds.components) {
    const compNames: string[] = []
    for (const arr of Object.values(ds.components)) {
      if (arr) for (const s of arr.slice(0, 3)) compNames.push(s.name)
    }
    if (compNames.length) lines.push('', `#### Components (sample): ${compNames.slice(0, 8).join(', ')}`)
  }
  return lines.join('\n')
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

/**
 * Known-brand 短路（Phase A）：
 *   - URL 命中 awesome-design-md 收錄品牌 → 跳過 puppeteer + Vision，
 *     直接讀 vendored DESIGN.md 注入結構化 DesignSystem
 *   - 純文字命中（用戶說「像 Stripe」）→ 同上
 *   - 未命中 → 走原 puppeteer 路徑
 *
 * 收益：~5-8s puppeteer + ~10K vision tokens → < 200ms 純讀檔 + 零 LLM
 */
/**
 * 把 DesignSystem 摘要為短文字，填進 visionAnalysis 欄位。
 *
 * 為什麼要這個摘要？兩個下游消費點 (`generateVariants` / `generateDesignBrief`) 用
 * `referenceAnalysis?.visionAnalysis` 作 truthy check 包整段 reference prompt：
 *   const referenceSection = referenceAnalysis?.visionAnalysis ? `...` : ''
 * 短路若不填 visionAnalysis，整段 reference 注入都被吃掉。
 *
 * 內容互補不重疊：
 *   - visionAnalysis（這裡）：visualTheme atmosphere + key characteristics（~500 字）
 *   - structuredRef（formatStructuredDataForPrompt → formatDesignSystemForPrompt）：完整 DESIGN.md（~6KB 截斷）
 */
function summarizeDesignSystemAsVision(ds: import('../types/design-system-schema').DesignSystem): string {
  const lines: string[] = [`Vendored DESIGN.md（${ds.metadata.brandKey ?? 'unknown'}）摘要：`]
  if (ds.visualTheme?.atmosphere) {
    const atm = ds.visualTheme.atmosphere
    lines.push('', atm.length > 600 ? atm.slice(0, 600) + '...' : atm)
  }
  if (ds.visualTheme?.keyCharacteristics?.length) {
    lines.push('', '關鍵特徵：')
    for (const c of ds.visualTheme.keyCharacteristics.slice(0, 6)) {
      lines.push(`- ${c}`)
    }
  }
  if (ds.typography?.primaryFont) {
    lines.push('', `主字體：${ds.typography.primaryFont}`)
  }
  // 主色 1-3 個（讓下游 LLM 一眼看到）
  const primaries = ds.colorPalette?.primary?.slice(0, 3) ?? []
  if (primaries.length) {
    lines.push(`主色：${primaries.map(c => `${c.name} (${c.value})`).join(' / ')}`)
  }
  return lines.join('\n')
}

function tryShortCircuitToVendoredBrand(input: string, url: string | null): ReferenceAnalysis | null {
  const brandKey = (url && lookupBrandByDomain(url)) || inferBrandFromText(input)
  if (!brandKey) return null

  const designSystem = loadDesignMdParsed(brandKey)
  if (!designSystem) return null

  const dsWithUrl = {
    ...designSystem,
    metadata: { ...designSystem.metadata, url: url ?? undefined },
  }

  return {
    url: url ?? '',
    metadata: {
      title: `${brandKey} (vendored DESIGN.md)`,
      description: designSystem.visualTheme?.atmosphere?.slice(0, 200),
    },
    // 同時填 visionAnalysis（摘要）+ designSystem（完整結構）
    // - visionAnalysis 確保下游既有 truthy-check 通過
    // - designSystem 提供結構化 + formatStructuredDataForPrompt 完整 markdown
    visionAnalysis: summarizeDesignSystemAsVision(dsWithUrl),
    analysisSource: 'vendored_designmd',
    designSystem: dsWithUrl,
  }
}

export async function analyzeReference(
  input: string,
  trackingContext?: LlmTrackingContext
): Promise<ReferenceAnalysis> {
  const trimmed = input.trim()

  // 非 URL → 純文字模式（行為與原本相同，但先試品牌名匹配）
  const url = extractFirstUrl(trimmed)
  if (!url || !isUrl(url)) {
    const brandShortCircuit = tryShortCircuitToVendoredBrand(trimmed, null)
    if (brandShortCircuit) {
      logger.info({ brandKey: brandShortCircuit.designSystem?.metadata.brandKey }, 'reference 短路：純文字命中 vendored brand')
      return brandShortCircuit
    }
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

  // URL 命中 vendored brand → 短路
  const brandShortCircuit = tryShortCircuitToVendoredBrand(trimmed, url)
  if (brandShortCircuit) {
    logger.info({ brandKey: brandShortCircuit.designSystem?.metadata.brandKey, url }, 'reference 短路：URL 命中 vendored brand')
    return brandShortCircuit
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

// ============================================================
// T5: 多來源融合
// ============================================================

const MAX_URLS = 3
const MAX_IMAGES = 3

export interface MergedReferenceAnalysis extends ReferenceAnalysis {
  sources: ReferenceAnalysis[]   // 各來源原始分析
  commonTraits?: string          // ≥ 2 來源出現的共通特徵（Haiku 萃取）
  divergentTraits?: string       // 各來源獨有特徵
}

/**
 * 並行分析多個 URL + 多張上傳圖片，合併為一份 ReferenceAnalysis。
 *
 * 策略：
 *  - URL 上限 3 / 圖片上限 3（成本控管）
 *  - Promise.allSettled 失敗自動降級
 *  - ≥ 2 個來源有 visionAnalysis → 拼接 + Haiku 萃取 commonTraits / divergentTraits
 *  - < 2 個來源 → 直接回第一個有效結果（行為與單源相同）
 *  - 所有來源都失敗 → 回 null
 */
export async function analyzeMultipleReferences(
  inputs: { urls?: string[]; imageUrls?: string[] },
  trackingContext?: LlmTrackingContext,
): Promise<MergedReferenceAnalysis | null> {
  const urls = (inputs.urls ?? []).slice(0, MAX_URLS)
  const images = (inputs.imageUrls ?? []).slice(0, MAX_IMAGES)
  if (urls.length === 0 && images.length === 0) return null

  const tasks: Promise<ReferenceAnalysis>[] = [
    ...urls.map(u => analyzeReference(u, trackingContext)),
    ...images.map(i => analyzeUploadedImage(i, trackingContext)),
  ]
  const settled = await Promise.allSettled(tasks)
  const sources: ReferenceAnalysis[] = settled
    .filter((s): s is PromiseFulfilledResult<ReferenceAnalysis> => s.status === 'fulfilled')
    .map(s => s.value)

  if (sources.length === 0) return null

  // 收集所有 vision 分析非空的來源
  const visionSources = sources.filter(s => s.visionAnalysis && s.visionAnalysis.trim().length > 0)
  if (visionSources.length === 0) {
    // 沒有 vision，直接回第一個來源
    return { ...sources[0], sources }
  }

  // 拼接所有 visionAnalysis
  const combinedVision = visionSources
    .map((s, i) => {
      const label = s.metadata?.title || s.url || `來源 ${i + 1}`
      return `## 來源 ${i + 1}: ${label}\n${s.visionAnalysis}`
    })
    .join('\n\n')

  // 多來源 → 跑 Haiku 萃取共通 / 差異特徵
  let commonTraits: string | undefined
  let divergentTraits: string | undefined
  if (visionSources.length >= 2) {
    const traits = await extractMergedTraits(visionSources, trackingContext)
    commonTraits = traits?.common
    divergentTraits = traits?.divergent
  }

  // 把 commonTraits / divergentTraits 也注入 visionAnalysis 開頭（讓下游 prompt 自動帶到）
  let prefixedVision = combinedVision
  if (commonTraits || divergentTraits) {
    const traitParts: string[] = []
    if (commonTraits) traitParts.push(`### 共通特徵（必須體現）\n${commonTraits}`)
    if (divergentTraits) traitParts.push(`### 差異特徵（變體差異化素材）\n${divergentTraits}`)
    prefixedVision = `## 多來源融合（${visionSources.length} 個來源）\n\n${traitParts.join('\n\n')}\n\n${combinedVision}`
  }

  // 主結果以第一個來源為基底
  const base = sources[0]
  return {
    ...base,
    visionAnalysis: prefixedVision,
    sources,
    commonTraits,
    divergentTraits,
  }
}

interface MergedTraits { common: string; divergent: string }

async function extractMergedTraits(
  visionSources: ReferenceAnalysis[],
  trackingContext?: LlmTrackingContext,
): Promise<MergedTraits | null> {
  try {
    const { z } = await import('zod')
    const { callStructured } = await import('../lib/structured-output')
    const { MODEL } = await import('../lib/anthropic')

    const Schema = z.object({
      commonTraits: z.string(),
      divergentTraits: z.string(),
    })

    const sourceText = visionSources
      .map((s, i) => `### 來源 ${i + 1} (${s.metadata?.title || s.url})\n${s.visionAnalysis?.slice(0, 1500) || ''}`)
      .join('\n\n')

    const result = await callStructured({
      schema: Schema,
      model: MODEL.HAIKU,
      system: `你是設計分析師。用戶提供了 ${visionSources.length} 個參考來源的視覺分析。
你的任務：找出 (1) 共通特徵：≥ 2 來源都有的設計傾向（必須體現於最終設計）；
(2) 差異特徵：每個來源獨有的元素（供變體差異化使用）。

格式要求：
- commonTraits: 1-3 句話，列出共通設計語言（色彩傾向、字體風格、佈局類型）
- divergentTraits: 每來源 1 行，說明該來源獨有的元素

注意：不要編造內容，只基於上方提供的真實分析。`,
      messages: [{ role: 'user', content: sourceText }],
      maxTokens: 800,
      temperature: 0.2,
      purpose: 'merge_reference_traits',
      trackingContext,
    })

    if (!result.success) return null
    return { common: result.data.commonTraits, divergent: result.data.divergentTraits }
  } catch (err) {
    logger.warn({ err: String(err).slice(0, 200) }, 'extractMergedTraits 失敗（fail-open）')
    return null
  }
}

/**
 * 把 MergedReferenceAnalysis 格式化為 prompt 段落（取代既有單源格式）。
 */
export function formatMergedReferenceForPrompt(merged: MergedReferenceAnalysis): string {
  const parts: string[] = []
  if (merged.commonTraits) {
    parts.push(`### 共通特徵（≥ 2 來源都有 — 最終設計必須體現）\n${merged.commonTraits}`)
  }
  if (merged.divergentTraits) {
    parts.push(`### 差異特徵（變體差異化素材）\n${merged.divergentTraits}`)
  }
  if (merged.visionAnalysis) {
    parts.push(`### 各來源原始分析\n${merged.visionAnalysis}`)
  }
  if (parts.length === 0) return ''
  return `## 參考來源融合分析（共 ${merged.sources.length} 個來源）\n\n${parts.join('\n\n')}`
}
