/**
 * Audit Open-Design Assets — Phase 1 差集偵測 + 篩選 + curated 輸出
 *
 * 用法：
 *   pnpm tsx src/scripts/audit-open-design-assets.ts          # 寫入 _curated/
 *   pnpm tsx src/scripts/audit-open-design-assets.ts --dry-run # 不寫
 *   pnpm tsx src/scripts/audit-open-design-assets.ts --verbose # 顯示每檔 reason
 *
 * 邏輯（零 LLM）：差集 vs awesome-design-md → parseDesignMd → 結構完整度篩選
 * → 寫 _curated/<style>.json（含 license + sha256 + meta）
 */
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { listAvailableBrands } from '../services/design-md-loader'
import { parseDesignMd } from '../services/design-md-parser'
import type { DesignSystem } from '../types/design-system-schema'

const MIN_FILE_SIZE = 1024
const MAX_FILE_SIZE = 50 * 1024
const MIN_TYPOGRAPHY_ROLES = 3
const MAX_CURATED_COUNT = 20
const KNOWN_MIT_UPSTREAMS = ['bergside']

function parseArgs() {
  return {
    dryRun: process.argv.includes('--dry-run'),
    verbose: process.argv.includes('--verbose'),
  }
}

function resolveOpenDesignRoot(): string | null {
  const candidates = [
    path.join(__dirname, '..', '..', 'external', 'open-design'),
    path.join(__dirname, '..', '..', '..', 'external', 'open-design'),
  ]
  for (const c of candidates) if (fs.existsSync(c)) return c
  return null
}

function resolveDesignSystemsDir(root: string): string | null {
  const candidates = [
    path.join(root, 'design-systems'),
    path.join(root, 'skills', 'design'),
  ]
  for (const c of candidates) if (fs.existsSync(c)) return c
  return null
}

interface ScannedFile {
  styleKey: string
  fullPath: string
  upstreamPath: string
  size: number
}

function scanDesignSystems(dir: string, root: string): ScannedFile[] {
  const out: ScannedFile[] = []
  for (const entry of fs.readdirSync(dir)) {
    if (entry.startsWith('.') || entry.startsWith('_')) continue
    const full = path.join(dir, entry)
    let stat: fs.Stats
    try { stat = fs.statSync(full) } catch { continue }
    if (stat.isDirectory()) {
      const md = path.join(full, 'DESIGN.md')
      if (fs.existsSync(md)) {
        const mst = fs.statSync(md)
        out.push({ styleKey: entry, fullPath: md, upstreamPath: path.relative(root, md), size: mst.size })
      }
    } else if (stat.isFile() && entry.endsWith('.md') && !entry.startsWith('README')) {
      out.push({
        styleKey: entry.replace(/\.md$/i, ''),
        fullPath: full,
        upstreamPath: path.relative(root, full),
        size: stat.size,
      })
    }
  }
  return out
}

interface FilterResult { pass: boolean; reason?: string; designSystem?: DesignSystem }

function evaluateFile(file: ScannedFile): FilterResult {
  if (file.size < MIN_FILE_SIZE) return { pass: false, reason: `size_too_small (${file.size}B)` }
  if (file.size > MAX_FILE_SIZE) return { pass: false, reason: `size_too_large (${file.size}B)` }

  let content: string
  let ds: DesignSystem
  try {
    content = fs.readFileSync(file.fullPath, 'utf-8')
  } catch (err) {
    return { pass: false, reason: `read_error: ${(err as Error).message}` }
  }
  try {
    ds = parseDesignMd(content, { brandKey: file.styleKey, source: 'vendored_designmd' })
  } catch (err) {
    return { pass: false, reason: `parse_error: ${(err as Error).message}` }
  }

  const palette = ds.colorPalette
  const hasPrimary =
    (palette?.primary && palette.primary.length > 0) ||
    (palette?.brand && palette.brand.length > 0)
  if (!hasPrimary) return { pass: false, reason: 'missing_primary_or_brand_color' }

  const hierarchy = ds.typography?.hierarchy ?? []
  if (hierarchy.length < MIN_TYPOGRAPHY_ROLES) {
    return { pass: false, reason: `typography_hierarchy_too_few (${hierarchy.length} roles)` }
  }

  return { pass: true, designSystem: ds }
}

function inferLicense(file: ScannedFile): 'apache-2.0' | 'mit' {
  const haystack = (file.upstreamPath + ' ' + file.styleKey).toLowerCase()
  for (const u of KNOWN_MIT_UPSTREAMS) if (haystack.includes(u)) return 'mit'
  return 'apache-2.0'
}

function extractAtmosphereKeywords(ds: DesignSystem): string[] {
  const kws = new Set<string>()
  const atmo = ds.visualTheme?.atmosphere ?? ''
  const chars = ds.visualTheme?.keyCharacteristics ?? []
  const text = `${atmo} ${chars.join(' ')}`.toLowerCase()
  const TOKEN_RE = /[a-z]{4,12}|[一-龥]{2,4}/g
  let m: RegExpExecArray | null
  while ((m = TOKEN_RE.exec(text)) !== null) {
    kws.add(m[0])
    if (kws.size >= 12) break
  }
  return Array.from(kws)
}

async function main() {
  const args = parseArgs()
  const root = resolveOpenDesignRoot()
  if (!root) {
    console.error('external/open-design 未找到（先跑 git submodule add + update --init）')
    process.exit(1)
  }
  const dsDir = resolveDesignSystemsDir(root)
  if (!dsDir) {
    console.error(`找不到 design-systems/ 目錄於 ${root}`)
    process.exit(1)
  }

  const scanned = scanDesignSystems(dsDir, root)
  console.log(`掃描 ${scanned.length} 個 DESIGN.md 於 ${path.relative(process.cwd(), dsDir)}`)

  const existing = new Set(listAvailableBrands().map(k => k.toLowerCase()))
  const diff = scanned.filter(f => !existing.has(f.styleKey.toLowerCase()))
  console.log(`與 awesome-design-md ${existing.size} 個既有 brand 差集後剩 ${diff.length} 個`)

  const reasons: Record<string, number> = {}
  const passed: Array<{ file: ScannedFile; ds: DesignSystem }> = []
  for (const file of diff) {
    const result = evaluateFile(file)
    if (result.pass && result.designSystem) {
      passed.push({ file, ds: result.designSystem })
      if (args.verbose) console.log(`  PASS ${file.styleKey} (${(file.size / 1024).toFixed(1)}KB)`)
    } else {
      const reason = result.reason ?? 'unknown'
      reasons[reason] = (reasons[reason] ?? 0) + 1
      if (args.verbose) console.log(`  DROP ${file.styleKey} — ${reason}`)
    }
  }

  console.log(`\n通過篩選 ${passed.length} 個`)
  if (Object.keys(reasons).length) {
    console.log(`淘汰 ${diff.length - passed.length} 個，原因分布：`)
    for (const [reason, count] of Object.entries(reasons).sort((a, b) => b[1] - a[1])) {
      console.log(`   - ${reason}: ${count}`)
    }
  }

  const final = passed.slice(0, MAX_CURATED_COUNT)
  if (passed.length > MAX_CURATED_COUNT) {
    console.log(`passed (${passed.length}) > MAX_CURATED_COUNT (${MAX_CURATED_COUNT})，只取前 ${MAX_CURATED_COUNT}`)
  }

  if (args.dryRun) {
    console.log(`\n--dry-run 模式，不寫 _curated/`)
    return
  }

  const curatedDir = path.join(root, '_curated')
  if (!fs.existsSync(curatedDir)) fs.mkdirSync(curatedDir, { recursive: true })

  let writeCount = 0
  for (const { file, ds } of final) {
    const content = fs.readFileSync(file.fullPath, 'utf-8')
    const sha256 = crypto.createHash('sha256').update(content).digest('hex')
    const license = inferLicense(file)
    const entry = {
      styleKey: file.styleKey,
      meta: {
        source: 'open-design' as const,
        license,
        upstreamPath: file.upstreamPath,
        sha256OfMd: sha256,
        parsedAt: new Date().toISOString(),
      },
      atmosphereKeywords: extractAtmosphereKeywords(ds),
      productTypeAffinity: [] as string[],
      designSystem: ds,
    }
    const outPath = path.join(curatedDir, `${file.styleKey}.json`)
    fs.writeFileSync(outPath, JSON.stringify(entry, null, 2) + '\n')
    writeCount++
  }

  console.log(`\n寫入 ${writeCount} 個 _curated/*.json（${path.relative(process.cwd(), curatedDir)}）`)
  const licenseDist = final.reduce((acc, { file }) => {
    const lic = inferLicense(file)
    acc[lic] = (acc[lic] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  console.log(`License 分布：${Object.entries(licenseDist).map(([k, v]) => `${k}: ${v}`).join(', ')}`)
  console.log(`\n下一步：手動編輯 _curated/*.json 補 productTypeAffinity（loader 用於 Layer 2.5 加權匹配）`)
}

main().catch(err => {
  console.error('audit 失敗：', err)
  process.exit(1)
})
