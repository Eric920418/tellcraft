import { describe, expect, it } from 'vitest'
import { normalizeLegacyUploadUrl, normalizeUploadBaseUrl } from './upload-url'

describe('upload-url', () => {
  it('normalizes target base by trimming trailing slashes', () => {
    expect(normalizeUploadBaseUrl('https://assets.example.com/uploads/tellcraft///'))
      .toBe('https://assets.example.com/uploads/tellcraft')
  })

  it('rewrites legacy api.tellcraft.com URL to configured base', () => {
    expect(
      normalizeLegacyUploadUrl(
        'https://api.tellcraft.com/uploads/tellcraft/2026-03/a.png',
        'https://assets.example.com/uploads/tellcraft'
      )
    ).toBe('https://assets.example.com/uploads/tellcraft/2026-03/a.png')
  })

  it('rewrites legacy URL inside css url(...) content', () => {
    expect(
      normalizeLegacyUploadUrl(
        'url("https://api.tellcraft.com/uploads/tellcraft/2026-03/a.png")',
        'https://assets.example.com/uploads/tellcraft/'
      )
    ).toBe('url("https://assets.example.com/uploads/tellcraft/2026-03/a.png")')
  })

  it('keeps third-party URL untouched', () => {
    const source = 'https://images.unsplash.com/photo-123'
    expect(normalizeLegacyUploadUrl(source, 'https://assets.example.com/uploads/tellcraft')).toBe(source)
  })
})
