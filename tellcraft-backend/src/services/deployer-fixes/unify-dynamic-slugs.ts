// ============================================================
// Unify Dynamic Slugs — 解 Next.js 同 parent path 不同 slug 名 build error
//
// **問題**：LLM 生成 Next.js app 時偶爾在同層級用不一致的 dynamic slug：
//   app/admin/products/[id]/page.tsx           ← slug=id
//   app/admin/products/[productId]/edit/...    ← slug=productId
//
// Next.js 編譯硬限制：「You cannot use different slug names for the same dynamic
// path ('id' !== 'productId')」。L3 fixBuildErrors LLM 修不下來（沒有全域視角）。
//
// **修法**：deterministic 0 LLM 偵測 (parentPath, position) groups 內 slug 衝突 →
// rename 統一成最常見 slug（tie 時優先 `id`），content 內用 destructure aliasing
// 保下游 code 零變動。
//
// **保零 collateral 設計**：destructure aliasing `const { id: productId } = await params`
// 讓 type 跟 destructure 第一層拿 Next.js 規定的新 slug 名，但下游 code 內所有
// `productId` 引用（業務 interface / class field / SQL column 都保留）完全不動。
// ============================================================

export interface FileWithPath {
  path: string
  content: string
}

export interface SlugConflict {
  parentPath: string         // dynamic segment 之前的 segments join，e.g. "app/admin/products"
  position: number           // segment 在 path 中的 index（0-based）
  originalSlugs: string[]    // 該位置出現過的所有不同 slug 名
  chosenSlug: string         // 統一後的 winner
}

export interface SlugUnificationResult {
  files: FileWithPath[]        // 含 path + content 已 rename 的完整 list（順序同 input）
  conflicts: SlugConflict[]    // 偵測到的衝突（給 telemetry / log，conflicts=[] 表示無變動）
}

/**
 * 嚴格匹配 standard dynamic segment：`[xxx]`
 * - 非 catch-all `[...slug]`
 * - 非 optional `[[id]]`
 * - 非 optional catch-all `[[...slug]]`
 */
const STANDARD_DYNAMIC_RE = /^\[([a-zA-Z_][a-zA-Z0-9_]*)\]$/

/**
 * 從 path 抽出所有 standard dynamic segments 跟位置
 * 例：app/admin/products/[productId]/reviews/[reviewId]/page.tsx
 *   → [{ position: 3, slug: 'productId' }, { position: 5, slug: 'reviewId' }]
 */
function extractDynamicSegments(filePath: string): Array<{ position: number; slug: string }> {
  const segments = filePath.split('/')
  const out: Array<{ position: number; slug: string }> = []
  for (let i = 0; i < segments.length; i++) {
    const m = segments[i].match(STANDARD_DYNAMIC_RE)
    if (m) out.push({ position: i, slug: m[1] })
  }
  return out
}

/**
 * 從 path 拿到指定 position 之前的 parent path（segments join）
 */
function getParentPath(filePath: string, position: number): string {
  return filePath.split('/').slice(0, position).join('/')
}

/**
 * 從候選 slug 挑 winner：
 *   1. count 出現次數最多
 *   2. tie 時若有 'id' 優先
 *   3. 否則字母序第一
 */
function pickWinnerSlug(slugCounts: Map<string, number>): string {
  const entries = Array.from(slugCounts.entries())
  entries.sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]                 // count desc
    if (a[0] === 'id') return -1                          // 'id' first
    if (b[0] === 'id') return 1
    return a[0].localeCompare(b[0])                       // alphabetical
  })
  return entries[0][0]
}

/**
 * 在 file content 內把 `oldSlug` 改成 `newSlug`（destructure aliasing 策略）
 *
 * 4 種 pattern（保零 collateral，只動 Next.js param 上下文）：
 *   1. Type signature Promise: `params: Promise<{ productId: string }>` → `params: Promise<{ id: string }>`
 *   2. Type signature plain:   `params: { productId: string }` → `params: { id: string }`
 *   3. await params destructure: `const { productId } = await params` → `const { id: productId } = await params`
 *   4. sync params destructure:  `const { productId } = params` → `const { id: productId } = params`
 *   5. useParams<T>:             `useParams<{ productId: string }>()` → `useParams<{ id: string }>()`
 *
 * 不動其他 oldSlug 引用（business interface field、SQL column、class member 都保留）
 */
function renameContentRefs(content: string, oldSlug: string, newSlug: string): string {
  if (oldSlug === newSlug) return content

  const oldEscaped = oldSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  let updated = content

  // Pattern 1+2+5: type signature `{ <oldSlug>: <type> }` 在 params: 或 useParams<...>() 上下文
  // 我們先處理 Promise<{ ... }> 跟 plain { ... }，再處理 useParams<{ ... }>
  // 嚴格 regex：只匹配 `params: Promise<{ X: ... }>` / `params: { X: ... }` / `useParams<{ X: ... }>`
  const typeSigPatterns = [
    // params: Promise<{ productId: string }>
    new RegExp(`(params\\s*:\\s*Promise<\\s*\\{\\s*)${oldEscaped}(\\s*:\\s*[^}]+\\})`, 'g'),
    // params: { productId: string }
    new RegExp(`(params\\s*:\\s*\\{\\s*)${oldEscaped}(\\s*:\\s*[^}]+\\})`, 'g'),
    // useParams<{ productId: string }>()
    new RegExp(`(useParams\\s*<\\s*\\{\\s*)${oldEscaped}(\\s*:\\s*[^}]+\\}\\s*>)`, 'g'),
  ]
  for (const re of typeSigPatterns) {
    updated = updated.replace(re, `$1${newSlug}$2`)
  }

  // Pattern 3+4: destructure `const { productId } = (await )?params` → `const { id: productId } = ...`
  // 嚴格匹配「params 後 destructure 第一層」，不動其他 destructure
  // 注意：destructure 內可能含多個 keys，e.g. `const { productId, foo } = await params`
  //       我們只在 oldSlug 是唯一 key 時改（避免破壞多 key 場景）
  const destructureAwaitRe = new RegExp(
    `(const\\s*\\{\\s*)${oldEscaped}(\\s*\\}\\s*=\\s*await\\s+params\\b)`,
    'g'
  )
  updated = updated.replace(destructureAwaitRe, `$1${newSlug}: ${oldSlug}$2`)

  const destructureSyncRe = new RegExp(
    `(const\\s*\\{\\s*)${oldEscaped}(\\s*\\}\\s*=\\s*params\\b)`,
    'g'
  )
  updated = updated.replace(destructureSyncRe, `$1${newSlug}: ${oldSlug}$2`)

  return updated
}

/**
 * 主入口：偵測同 (parent, position) 衝突 → rename path + content
 */
export function unifyDynamicSlugs(files: FileWithPath[]): SlugUnificationResult {
  // Step 1: 掃所有 file path 收集 dynamic segments
  // key = `<parentPath>|<position>` ; value = Map<slug, count>
  const groupedSlugs = new Map<string, Map<string, number>>()
  for (const f of files) {
    const segs = extractDynamicSegments(f.path)
    for (const { position, slug } of segs) {
      const parent = getParentPath(f.path, position)
      const key = `${parent}|${position}`
      if (!groupedSlugs.has(key)) groupedSlugs.set(key, new Map())
      const slugMap = groupedSlugs.get(key)!
      slugMap.set(slug, (slugMap.get(slug) ?? 0) + 1)
    }
  }

  // Step 2: 找 conflict group（≥2 slug 名）+ 挑 winner
  const conflicts: SlugConflict[] = []
  const renameMap = new Map<string, { from: string; to: string }>()  // key → rename rule
  for (const [key, slugMap] of groupedSlugs) {
    if (slugMap.size < 2) continue
    const winner = pickWinnerSlug(slugMap)
    const originalSlugs = Array.from(slugMap.keys())
    const [parent, posStr] = key.split('|')
    conflicts.push({
      parentPath: parent,
      position: parseInt(posStr, 10),
      originalSlugs,
      chosenSlug: winner,
    })
    renameMap.set(key, { from: '', to: winner })  // from 動態決定（每 file 自己 slug）
  }

  if (conflicts.length === 0) {
    return { files, conflicts: [] }  // noop：input 直接 return（不複製）
  }

  // Step 3: 對每個 file 套用 rename
  const updatedFiles: FileWithPath[] = files.map(f => {
    const segs = extractDynamicSegments(f.path)
    if (segs.length === 0) return f  // 無 dynamic segment，不動

    const pathSegments = f.path.split('/')
    let pathChanged = false
    let content = f.content

    for (const { position, slug } of segs) {
      const parent = getParentPath(f.path, position)
      const key = `${parent}|${position}`
      const renameRule = renameMap.get(key)
      if (!renameRule) continue                       // 該位置無衝突，跳過
      if (slug === renameRule.to) continue            // 已是 winner，無需 rename

      // Rename path segment
      pathSegments[position] = `[${renameRule.to}]`
      pathChanged = true

      // Rename content refs（destructure aliasing 策略）
      content = renameContentRefs(content, slug, renameRule.to)
    }

    if (!pathChanged) return f
    return { path: pathSegments.join('/'), content }
  })

  return { files: updatedFiles, conflicts }
}
