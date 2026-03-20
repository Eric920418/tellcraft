import { describe, it, expect } from 'vitest'
import {
  hexDistance,
  postProcessExtraction,
  formatStructuredDataForPrompt,
  type ReferenceAnalysis,
  type ExtractedColors,
  type ExtractedTypography,
  type ExtractedLayout,
} from '../services/reference-analyzer'

// ── hexDistance ──

describe('hexDistance', () => {
  it('相同色返回 0', () => {
    expect(hexDistance('#ffffff', '#ffffff')).toBe(0)
    expect(hexDistance('#000000', '#000000')).toBe(0)
    expect(hexDistance('#6366f1', '#6366f1')).toBe(0)
  })

  it('黑白距離最大', () => {
    const d = hexDistance('#000000', '#ffffff')
    expect(d).toBeCloseTo(Math.sqrt(255 ** 2 * 3), 1)
  })

  it('相近色距離小', () => {
    // #6366f1 vs #6365f0
    const d = hexDistance('#6366f1', '#6365f0')
    expect(d).toBeLessThan(5)
  })

  it('互補色距離大', () => {
    // 紅 vs 青
    const d = hexDistance('#ff0000', '#00ffff')
    expect(d).toBeGreaterThan(400)
  })
})

// ── postProcessExtraction ──

describe('postProcessExtraction', () => {
  const basePalette: ExtractedColors = {
    backgrounds: ['#ffffff', '#f8fafc', '#1e293b'],
    texts: ['#0f172a', '#64748b'],
    accents: ['#6366f1'],
    borders: ['#e2e8f0'],
  }

  it('過濾高度 < 80px 的 section', () => {
    const result = postProcessExtraction({
      domStructure: [
        { index: 0, tag: 'header', childCount: 3, styles: {}, estimatedHeight: 60 },
        { index: 1, tag: 'section', childCount: 5, styles: {}, estimatedHeight: 400 },
        { index: 2, tag: 'div', childCount: 1, styles: {}, estimatedHeight: 20 },
      ],
      colorPalette: basePalette,
      typography: {},
      layoutInfo: { sectionCount: 3 },
    })
    expect(result.domStructure).toHaveLength(1)
    expect(result.domStructure[0].tag).toBe('section')
  })

  it('section 最多保留 15 個', () => {
    const sections = Array.from({ length: 20 }, (_, i) => ({
      index: i,
      tag: 'section',
      childCount: 2,
      styles: {},
      estimatedHeight: 200,
    }))
    const result = postProcessExtraction({
      domStructure: sections,
      colorPalette: basePalette,
      typography: {},
      layoutInfo: { sectionCount: 20 },
    })
    expect(result.domStructure).toHaveLength(15)
  })

  it('色板去重：相近色合併', () => {
    const result = postProcessExtraction({
      domStructure: [],
      colorPalette: {
        backgrounds: ['#ffffff', '#fefefe', '#000000'], // #ffffff 和 #fefefe 很接近
        texts: ['#0f172a'],
        accents: [],
        borders: [],
      },
      typography: {},
      layoutInfo: { sectionCount: 0 },
    })
    // #ffffff 和 #fefefe 距離很小（< 25），應被去重
    expect(result.colorPalette.backgrounds).toHaveLength(2)
    expect(result.colorPalette.backgrounds).toContain('#ffffff')
    expect(result.colorPalette.backgrounds).toContain('#000000')
  })

  it('字體名正規化：去掉多餘空格', () => {
    const result = postProcessExtraction({
      domStructure: [],
      colorPalette: basePalette,
      typography: {
        headingFont: '  Inter  ',
        bodyFont: 'Roboto ',
      },
      layoutInfo: { sectionCount: 0 },
    })
    expect(result.typography.headingFont).toBe('Inter')
    expect(result.typography.bodyFont).toBe('Roboto')
  })

  it('保留 gradient', () => {
    const result = postProcessExtraction({
      domStructure: [],
      colorPalette: {
        ...basePalette,
        gradients: ['linear-gradient(135deg, #6366f1, #8b5cf6)'],
      },
      typography: {},
      layoutInfo: { sectionCount: 0 },
    })
    expect(result.colorPalette.gradients).toHaveLength(1)
  })
})

// ── formatStructuredDataForPrompt ──

describe('formatStructuredDataForPrompt', () => {
  it('無結構化數據返回空字串', () => {
    const analysis: ReferenceAnalysis = {
      url: 'https://example.com',
      metadata: {},
      analysisSource: 'vision',
      visionAnalysis: 'some text',
    }
    expect(formatStructuredDataForPrompt(analysis)).toBe('')
  })

  it('完整數據輸出全部 4 個段落', () => {
    const analysis: ReferenceAnalysis = {
      url: 'https://stripe.com',
      metadata: { title: 'Stripe' },
      analysisSource: 'vision',
      visionAnalysis: 'some text',
      colorPalette: {
        backgrounds: ['#ffffff', '#0a2540'],
        texts: ['#425466'],
        accents: ['#635bff'],
        borders: ['#e6e6e6'],
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        fontSizeRange: { min: '14px', max: '64px' },
        googleFontsDetected: ['Inter'],
      },
      layoutInfo: {
        sectionCount: 8,
        navStyle: 'horizontal',
        heroPresent: true,
        footerPresent: true,
        containerMaxWidth: '1280px',
        dominantLayout: 'flex-column',
        spacingDensity: 'spacious',
      },
      domStructure: [
        { index: 0, tag: 'header', childCount: 5, styles: { display: 'flex' }, estimatedHeight: 80 },
        { index: 1, tag: 'section', landmark: 'hero', childCount: 3, styles: { display: 'flex', backgroundColor: '#0a2540' }, estimatedHeight: 600 },
      ],
    }

    const result = formatStructuredDataForPrompt(analysis)

    // 色板段落
    expect(result).toContain('### 參考網站精確色板')
    expect(result).toContain('#ffffff')
    expect(result).toContain('#635bff')

    // 字體段落
    expect(result).toContain('### 參考網站字體')
    expect(result).toContain('Inter')
    expect(result).toContain('14px ~ 64px')

    // 佈局段落
    expect(result).toContain('### 參考網站佈局骨架')
    expect(result).toContain('8 個 Section（含 Hero）')
    expect(result).toContain('spacious')

    // Section 流向
    expect(result).toContain('### Section 流向')
    expect(result).toContain('header(flex, h≈80px)')
    expect(result).toContain('section#hero(flex, h≈600px)')
  })

  it('部分數據只輸出有的段落', () => {
    const analysis: ReferenceAnalysis = {
      url: 'https://example.com',
      metadata: {},
      analysisSource: 'vision',
      colorPalette: {
        backgrounds: ['#ffffff'],
        texts: ['#000000'],
        accents: [],
        borders: [],
      },
    }

    const result = formatStructuredDataForPrompt(analysis)
    expect(result).toContain('### 參考網站精確色板')
    expect(result).not.toContain('### 參考網站字體')
    expect(result).not.toContain('### 參考網站佈局骨架')
  })

  it('layoutInfo.sectionCount 為 0 時不輸出佈局段落', () => {
    const analysis: ReferenceAnalysis = {
      url: 'https://example.com',
      metadata: {},
      analysisSource: 'vision',
      layoutInfo: { sectionCount: 0 },
    }
    expect(formatStructuredDataForPrompt(analysis)).toBe('')
  })
})
