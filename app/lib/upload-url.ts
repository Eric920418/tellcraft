const LEGACY_UPLOAD_BASE_URLS = [
  'https://api.tellcraft.com/uploads/tellcraft',
  'http://api.tellcraft.com/uploads/tellcraft',
  'http://54.238.4.117/uploads/tellcraft',
  'http://54.238.4.117:8080/uploads/tellcraft',
]

function trimTrailingSlashes(input: string): string {
  return input.replace(/\/+$/, '')
}

function trimLeadingSlashes(input: string): string {
  return input.replace(/^\/+/, '')
}

function splitPrefixAndSuffix(url: string, legacyBase: string): { prefix: string; suffix: string } {
  const idx = url.indexOf(legacyBase)
  if (idx < 0) return { prefix: '', suffix: '' }
  const prefix = url.slice(0, idx)
  const suffix = url.slice(idx + legacyBase.length)
  return { prefix, suffix }
}

export function normalizeUploadBaseUrl(baseUrl?: string | null): string {
  const raw = (baseUrl || process.env.NEXT_PUBLIC_UPLOAD_BASE_URL || '').trim()
  if (!raw) return ''
  return trimTrailingSlashes(raw)
}

export function normalizeLegacyUploadUrl(url: string, baseUrl?: string | null): string {
  const input = url.trim()
  if (!input) return input

  const targetBase = normalizeUploadBaseUrl(baseUrl)
  if (!targetBase) return input

  for (const legacyBase of LEGACY_UPLOAD_BASE_URLS) {
    if (!input.includes(legacyBase)) continue
    const { prefix, suffix } = splitPrefixAndSuffix(input, legacyBase)
    const normalizedSuffix = trimLeadingSlashes(suffix)
    return normalizedSuffix
      ? `${prefix}${targetBase}/${normalizedSuffix}`
      : `${prefix}${targetBase}`
  }

  return input
}

export { LEGACY_UPLOAD_BASE_URLS }
