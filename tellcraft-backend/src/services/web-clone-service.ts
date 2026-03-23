/**
 * Web Clone 核心服務
 * 增強版 DOM 提取 → section 切割 → 逐 section Sonnet Vision 生成 → 代碼合併
 */

import { getAnthropicClient, MODEL, trackLlmUsage } from '../lib/anthropic'
import { getEnv } from '../lib/env'
import { createLogger } from '../lib/logger'
import { PUPPETEER_ARGS, type ExtractedColors, type ExtractedTypography, type ExtractedLayout } from './reference-analyzer'
import { postProcessExtraction } from './reference-analyzer'
import type { CloneSectionMeta } from '../types/flow-state'

const logger = createLogger('web-clone-service')

// ── 型別定義 ──

export interface CloneSection {
  index: number
  type: 'header' | 'footer' | 'content'
  tag: string
  componentName: string
  boundingRect: { x: number; y: number; width: number; height: number }
  outerHtml: string
  computedStyles: Record<string, string>
  images: { src: string; alt?: string }[]
  icons: string[]
  textContent: string
  screenshot: Buffer
}

export interface CloneDesignSystem {
  colors: ExtractedColors
  typography: ExtractedTypography
  layout: ExtractedLayout
}

export interface CloneAnalysis {
  sections: CloneSection[]
  designSystem: CloneDesignSystem
  fullPageScreenshot: Buffer
  url: string
  title?: string
}

interface LlmTrackingContext {
  userId?: string
  conversationId?: string
}

// ── 增強版 DOM 提取腳本（瀏覽器上下文，字串形式）──

const CLONE_EXTRACTION_SCRIPT = `(function() {
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
    if (cs.margin !== '0px') result.margin = cs.margin;
    if (cs.gap !== 'normal' && cs.gap !== '0px') result.gap = cs.gap;
    result.display = cs.display;
    if (cs.display === 'flex') result.flexDirection = cs.flexDirection;
    if (cs.display === 'grid') result.gridTemplateColumns = cs.gridTemplateColumns;
    if (cs.borderRadius !== '0px') result.borderRadius = cs.borderRadius;
    if (cs.maxWidth !== 'none') result.maxWidth = cs.maxWidth;
    if (cs.textAlign !== 'start') result.textAlign = cs.textAlign;
    if (cs.boxShadow !== 'none') result.boxShadow = cs.boxShadow.slice(0, 100);
    if (cs.border !== '' && cs.borderWidth !== '0px') result.border = cs.border;
    if (cs.backgroundImage !== 'none') result.backgroundImage = cs.backgroundImage.slice(0, 200);
    if (cs.position !== 'static') result.position = cs.position;
    if (cs.overflow !== 'visible') result.overflow = cs.overflow;
    if (cs.lineHeight !== 'normal') result.lineHeight = cs.lineHeight;
    if (cs.letterSpacing !== 'normal') result.letterSpacing = cs.letterSpacing;
    if (cs.justifyContent !== 'normal') result.justifyContent = cs.justifyContent;
    if (cs.alignItems !== 'normal') result.alignItems = cs.alignItems;
    return result;
  }

  // Section 識別
  var selectorList = 'body > header, body > nav, body > main, body > footer, body > aside, body > section, body > article, body > div, main > section, main > article, main > div';
  var seen = new Set();
  var sectionEls = [];
  document.querySelectorAll(selectorList).forEach(function(el) {
    if (seen.has(el)) return;
    var rect = el.getBoundingClientRect();
    if (rect.height > 80 && rect.width > 200) {
      seen.add(el);
      sectionEls.push(el);
    }
  });
  var sections = sectionEls.slice(0, 15);

  // Section 結構
  var domSections = sections.map(function(el, index) {
    var rect = el.getBoundingClientRect();
    var tag = el.tagName.toLowerCase();

    // Type 標記
    var type = 'content';
    if (tag === 'header' || tag === 'nav' || (el.getAttribute('role') === 'banner') || (el.getAttribute('role') === 'navigation')) type = 'header';
    if (tag === 'footer' || el.getAttribute('role') === 'contentinfo') type = 'footer';

    // outerHTML 截斷
    var html = el.outerHTML || '';
    if (html.length > 8000) html = html.slice(0, 8000) + '<!-- truncated -->';

    // 圖片提取
    var images = [];
    el.querySelectorAll('img').forEach(function(img) {
      if (images.length >= 10) return;
      images.push({
        src: img.getAttribute('src') || '',
        alt: img.getAttribute('alt') || ''
      });
    });

    // Icon class 偵測
    var icons = [];
    el.querySelectorAll('[class*="lucide"], [class*="icon"], svg').forEach(function(icon) {
      if (icons.length >= 10) return;
      var cls = icon.getAttribute('class') || '';
      if (cls) icons.push(cls.slice(0, 80));
    });

    // 文字內容
    var textContent = (el.textContent || '').trim().slice(0, 500);

    return {
      index: index,
      type: type,
      tag: tag,
      boundingRect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
      outerHtml: html,
      computedStyles: getStyles(el),
      images: images,
      icons: icons,
      textContent: textContent,
      estimatedHeight: Math.round(rect.height)
    };
  });

  // 色板提取（複用 Route A 邏輯）
  var bgMap = {}, textMap = {}, accentMap = {}, borderMap = {};
  var allEls = document.querySelectorAll('*');
  var step = Math.max(1, Math.floor(allEls.length / 500));
  for (var i = 0; i < allEls.length; i += step) {
    var el = allEls[i]; var cs = window.getComputedStyle(el);
    var bg = cs.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') { var hex = rgbToHex(bg); bgMap[hex] = (bgMap[hex] || 0) + 1; }
    var tc = cs.color; if (tc) { var thex = rgbToHex(tc); textMap[thex] = (textMap[thex] || 0) + 1; }
    if (cs.borderWidth !== '0px' && cs.borderColor !== 'rgb(0, 0, 0)') { var bhex = rgbToHex(cs.borderColor); borderMap[bhex] = (borderMap[bhex] || 0) + 1; }
    if (el.tagName === 'BUTTON' || el.tagName === 'A') { var abg = bg && bg !== 'rgba(0, 0, 0, 0)' ? rgbToHex(bg) : null; if (abg && abg !== '#ffffff' && abg !== '#000000') accentMap[abg] = (accentMap[abg] || 0) + 1; }
  }
  function sortByFreq(map, limit) { return Object.entries(map).sort(function(a,b){return b[1]-a[1];}).slice(0,limit).map(function(e){return e[0];}); }
  var colorPalette = { backgrounds: sortByFreq(bgMap,6), texts: sortByFreq(textMap,4), accents: sortByFreq(accentMap,3), borders: sortByFreq(borderMap,3) };

  // 字體
  var headingFreq = {}, bodyFreq = {};
  document.querySelectorAll('h1,h2,h3,h4').forEach(function(el) { var f = window.getComputedStyle(el).fontFamily.split(',')[0].replace(/['"]/g,'').trim(); headingFreq[f] = (headingFreq[f]||0)+1; });
  document.querySelectorAll('p,li,span,td').forEach(function(el) { var f = window.getComputedStyle(el).fontFamily.split(',')[0].replace(/['"]/g,'').trim(); bodyFreq[f] = (bodyFreq[f]||0)+1; });
  var googleFonts = [];
  document.querySelectorAll('link[href*="fonts.googleapis.com"]').forEach(function(link) {
    var href = link.getAttribute('href') || '';
    var families = href.match(/family=([^&:]+)/g);
    if (families) families.forEach(function(m) { var name = m.replace('family=','').replace(/\\+/g,' '); if (googleFonts.indexOf(name)===-1) googleFonts.push(name); });
  });
  function topFont(map) { var s = Object.entries(map).sort(function(a,b){return b[1]-a[1];}); return s.length > 0 ? s[0][0] : undefined; }
  var typography = { headingFont: topFont(headingFreq), bodyFont: topFont(bodyFreq), googleFontsDetected: googleFonts.length > 0 ? googleFonts : undefined };

  // 佈局
  var navEl = document.querySelector('nav, [role="navigation"]');
  var navStyle; if (navEl) { var ncs = window.getComputedStyle(navEl); navStyle = ncs.display === 'flex' && ncs.flexDirection === 'row' ? 'horizontal' : 'horizontal'; }
  var heroEl = document.querySelector('[class*="hero" i], [id*="hero" i], section:first-of-type');
  var heroPresent = heroEl ? heroEl.getBoundingClientRect().height > 400 : false;
  var layoutInfo = {
    sectionCount: sections.length, navStyle: navStyle, heroPresent: heroPresent,
    footerPresent: !!document.querySelector('footer, [role="contentinfo"]'),
    dominantLayout: 'flex-column', spacingDensity: 'normal'
  };

  var title = document.title || '';

  return { sections: domSections, colorPalette: colorPalette, typography: typography, layoutInfo: layoutInfo, title: title };
})()`

// ── Section 切割後處理 ──

function assignComponentNames(sections: Array<{ index: number; type: string; tag: string }>): void {
  const typeCounts: Record<string, number> = { header: 0, footer: 0, content: 0 }
  for (const s of sections) {
    const t = s.type as 'header' | 'footer' | 'content'
    const suffix = t.charAt(0).toUpperCase() + t.slice(1)
    ;(s as CloneSection).componentName = `Section${s.index}${suffix}`
    typeCounts[t]++
  }
}

function mergeTinySections(sections: CloneSection[]): CloneSection[] {
  if (sections.length <= 1) return sections
  const merged: CloneSection[] = []
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i]
    const prev = merged[merged.length - 1]
    // 相鄰 section 間距 < 16px 且同背景色 + height < 120px → 合併
    if (prev && s.type === 'content' && s.boundingRect.height < 120) {
      const gap = s.boundingRect.y - (prev.boundingRect.y + prev.boundingRect.height)
      if (gap < 16 && prev.computedStyles.backgroundColor === s.computedStyles.backgroundColor) {
        prev.outerHtml += '\n' + s.outerHtml
        prev.textContent += ' ' + s.textContent
        prev.boundingRect.height = (s.boundingRect.y + s.boundingRect.height) - prev.boundingRect.y
        prev.images.push(...s.images)
        continue
      }
    }
    merged.push(s)
  }
  return merged
}

// ── 主提取函數 ──

export async function extractPageForClone(url: string): Promise<CloneAnalysis> {
  const puppeteer = await import('puppeteer-core')
  const browser = await puppeteer.default.launch({
    executablePath: getEnv().CHROMIUM_PATH || '/usr/bin/chromium-browser',
    headless: true,
    args: PUPPETEER_ARGS,
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 })
    await new Promise(r => setTimeout(r, 2000))

    // 全頁截圖
    const fullPageRaw = await page.screenshot({ type: 'jpeg', quality: 70, fullPage: true })
    const fullPageScreenshot = Buffer.from(fullPageRaw)

    // DOM/CSS 提取 + section 識別
    const rawData = await Promise.race([
      page.evaluate(CLONE_EXTRACTION_SCRIPT),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('clone extraction timeout')), 8000)),
    ]) as {
      sections: Array<CloneSection & { estimatedHeight: number }>
      colorPalette: ExtractedColors
      typography: ExtractedTypography
      layoutInfo: ExtractedLayout
      title: string
    }

    // 後處理色板
    const processed = postProcessExtraction({
      domStructure: [],
      colorPalette: rawData.colorPalette,
      typography: rawData.typography,
      layoutInfo: rawData.layoutInfo,
    })

    // 指派組件名
    assignComponentNames(rawData.sections)

    // 合併微小 section
    let sections = mergeTinySections(rawData.sections as unknown as CloneSection[])

    // 逐 section 裁切截圖
    for (const section of sections) {
      try {
        const clipRaw = await page.screenshot({
          type: 'jpeg',
          quality: 75,
          clip: {
            x: Math.max(0, section.boundingRect.x),
            y: Math.max(0, section.boundingRect.y),
            width: Math.min(section.boundingRect.width, 1440),
            height: Math.min(section.boundingRect.height, 2000),
          },
        })
        section.screenshot = Buffer.from(clipRaw)
      } catch (err) {
        logger.warn({ error: String(err).slice(0, 200), section: section.index }, 'Section 截圖失敗')
        // 降級：使用全頁截圖的一部分（空 buffer）
        section.screenshot = Buffer.alloc(0)
      }
    }

    // 過濾無效截圖的 section
    sections = sections.filter(s => s.screenshot.length > 0)

    return {
      sections,
      designSystem: {
        colors: processed.colorPalette,
        typography: processed.typography,
        layout: processed.layoutInfo,
      },
      fullPageScreenshot,
      url,
      title: rawData.title || undefined,
    }
  } finally {
    await browser.close()
  }
}

// ── 逐 Section Sonnet Vision 生成 ──

const CLONE_SYSTEM_PROMPT = `你是前端工程師。根據截圖和 DOM 結構精確重建一個 React/Tailwind 組件。

## 技術規範
- React 18 + TypeScript
- Tailwind CSS v4（@import "tailwindcss" 語法）
- 動畫庫：motion/react（不是 framer-motion）
- 字體：不要 import，由 layout.tsx 統一設定
- 圖片：使用 placeholder（https://placehold.co/WIDTHxHEIGHT 或描述性 SVG placeholder）
- Icons：lucide-react

## 輸出格式
只輸出一個 React 組件檔案內容（含 import + export default）。
使用 Tailwind 類名精確復刻截圖的樣式。
保持原始文字內容完整。
不要新增互動邏輯（onClick handler 等留空）。
不要使用 CSS-in-JS 或 inline styles，全部用 Tailwind。`

export async function generateSectionCode(
  section: CloneSection,
  designSystem: CloneDesignSystem,
  trackingContext?: LlmTrackingContext
): Promise<{ componentName: string; code: string } | null> {
  try {
    const client = getAnthropicClient()
    const base64 = section.screenshot.toString('base64')

    // 精簡 computed styles（只保留有值的）
    const stylesText = Object.entries(section.computedStyles)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n')

    const imagesText = section.images.length > 0
      ? section.images.map(img => `- src: ${img.src}${img.alt ? ` alt: ${img.alt}` : ''}`).join('\n')
      : '（無圖片）'

    const designSystemText = `## Design System（從原站提取）
- 背景色: ${designSystem.colors.backgrounds.join(', ')}
- 文字色: ${designSystem.colors.texts.join(', ')}
- 強調色: ${designSystem.colors.accents.join(', ')}
- 標題字體: ${designSystem.typography.headingFont || 'sans-serif'}
- 內文字體: ${designSystem.typography.bodyFont || 'sans-serif'}`

    const userMsg = `精確重建截圖中的這個 ${section.type} section。

${designSystemText}

## 原始 DOM 結構（截斷）
\`\`\`html
${section.outerHtml.slice(0, 6000)}
\`\`\`

## Computed Styles
${stylesText}

## 文字內容
${section.textContent.slice(0, 400)}

## 圖片資源
${imagesText}

## 要求
1. 使用 Tailwind 精確復刻顏色（使用 Design System 的 HEX 值，例如 bg-[#1e293b]）
2. 保持原始 flex/grid 佈局
3. 保持原始間距（padding/margin/gap）
4. 文字內容完整保留
5. 組件命名：${section.componentName}
6. export default function ${section.componentName}()`

    const response = await client.messages.create({
      model: MODEL.SONNET,
      max_tokens: 8192,
      system: CLONE_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
          },
          { type: 'text', text: userMsg },
        ],
      }],
    })

    if (response.usage) {
      trackLlmUsage({
        model: MODEL.SONNET,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        purpose: 'clone_section_generation',
        conversationId: trackingContext?.conversationId,
      })
    }

    const text = response.content[0]
    if (text.type !== 'text') return null

    // 提取代碼塊（如果 LLM 包了 ```tsx ... ```）
    let code = text.text.trim()
    const codeBlockMatch = code.match(/```(?:tsx?|jsx?|react)?\s*\n([\s\S]*?)```/)
    if (codeBlockMatch) code = codeBlockMatch[1].trim()

    return { componentName: section.componentName, code }
  } catch (err) {
    logger.warn({ error: String(err).slice(0, 200), section: section.index }, 'Section 代碼生成失敗')
    return null
  }
}

// ── 代碼合併 ──

export function assembleSections(
  sectionCodes: Array<{ componentName: string; code: string }>,
  designSystem: CloneDesignSystem,
  title?: string
): { pages: Array<{ path: string; code: string }>; components: Array<{ path: string; code: string }>; styles: string } {
  // 組件檔案
  const components = sectionCodes.map(s => ({
    path: `components/clone/${s.componentName}.tsx`,
    code: s.code,
  }))

  // page.tsx
  const imports = sectionCodes.map(s =>
    `import ${s.componentName} from '@/components/clone/${s.componentName}'`
  ).join('\n')

  const renders = sectionCodes.map(s => `        <${s.componentName} />`).join('\n')

  const pageCode = `${imports}

export default function Page() {
  return (
    <main className="min-h-screen">
${renders}
    </main>
  )
}`

  // globals.css
  const bg = designSystem.colors.backgrounds[0] || '#ffffff'
  const text = designSystem.colors.texts[0] || '#000000'
  const accent = designSystem.colors.accents[0] || '#6366f1'

  const styles = `@import "tailwindcss";

:root {
  --background: ${bg};
  --foreground: ${text};
  --accent: ${accent};
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-body, system-ui, sans-serif);
}
`

  // layout.tsx
  const layoutCode = `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '${(title || 'Cloned Site').replace(/'/g, "\\'")}',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`

  return {
    pages: [
      { path: 'app/page.tsx', code: pageCode },
      { path: 'app/layout.tsx', code: layoutCode },
    ],
    components,
    styles,
  }
}

// ── section meta 轉換（不含 Buffer，存 Redis）──

export function toSectionMetas(sections: CloneSection[]): CloneSectionMeta[] {
  return sections.map(s => ({
    index: s.index,
    type: s.type,
    tag: s.tag,
    componentName: s.componentName,
    estimatedHeight: s.boundingRect.height,
    status: 'pending' as const,
  }))
}
