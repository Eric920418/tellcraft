/**
 * Preview Gate — 壞代碼永遠不離開後端
 *
 * 策略：代碼推給前端 WebContainer 預覽前，先跑 esbuild 語法驗證。
 * 任何檔案 fail 就整批拒絕 — 保留上一個 Last Known Good (LKG) 版本。
 *
 * 本 Gate 為預覽層的 fail-safe，與 deploy 階段的 L1-L4 防禦互補：
 * - L1-L4 在 deploy 前執行（~20-50s），太晚
 * - preview-gate 在每個 streaming chunk 推送前執行（<500ms）
 *
 * 零 LLM、純 esbuild 並行驗證。失敗時由呼叫端決定後續動作
 * （通常是觸發 fixBuildErrors 或保留 LKG）。
 */

import { validateComponentSyntax, getEsbuildErrors } from './syntax-validator'
import { recordTelemetry } from './skill-telemetry'
import type { GeneratedCode } from '../types/flow-state'
import { createLogger } from '../lib/logger'

const logger = createLogger('preview-gate')

export interface PreviewGateFailure {
  path: string
  errors: string[]
}

export interface PreviewGateResult {
  ok: boolean
  failed: PreviewGateFailure[]
  durationMs: number
  checkedFiles: number
}

/**
 * 批次驗證所有預覽代碼的 TSX/TS 語法。
 * 並行跑 esbuild，100 個檔案 < 500ms。
 */
export async function validatePreviewBatch(code: GeneratedCode): Promise<PreviewGateResult> {
  const startedAt = Date.now()
  const allFiles = [
    ...code.pages.map(p => ({ path: p.path, content: p.content })),
    ...code.components.map(c => ({ path: c.path, content: c.content })),
  ]

  const results = await Promise.all(
    allFiles.map(async f => {
      const ok = await validateComponentSyntax(f.content, f.path)
      if (ok) return null
      const errors = await getEsbuildErrors(f.content, f.path)
      return { path: f.path, errors }
    })
  )

  const failed = results.filter((r): r is PreviewGateFailure => r !== null)
  const durationMs = Date.now() - startedAt

  if (failed.length > 0) {
    logger.warn(
      { failedCount: failed.length, total: allFiles.length, paths: failed.map(f => f.path), durationMs },
      'preview-gate: 攔下壞代碼'
    )
  } else {
    logger.debug({ checkedFiles: allFiles.length, durationMs }, 'preview-gate: 通過')
  }

  // Fire-and-forget telemetry（不阻塞）
  recordTelemetry({
    skillName: 'uiux',
    eventType: 'preview_gate',
    patternKey: failed.length > 0 ? 'preview-gate-block' : 'preview-gate-pass',
    outcome: failed.length > 0 ? 'blocked' : 'success',
    payload: {
      checkedFiles: allFiles.length,
      failedCount: failed.length,
      durationMs,
      failedPaths: failed.map(f => f.path).slice(0, 10),
    },
  }).catch(() => {})

  return {
    ok: failed.length === 0,
    failed,
    durationMs,
    checkedFiles: allFiles.length,
  }
}
