/**
 * extension-apply-skill.ts — R11 commit 6 核心
 *
 * Chrome Extension 編輯器 commit → backend deterministic 修改 chain
 *
 * **不走 LLM**（vs iteration-skill 是 30-60s LLM 重型）
 * 直接 string regex match + 替換 → 寫 FlowState → triggerPreviewDeploy
 *
 * MVP（commit 6）支援操作：
 *   - text: textContent 替換（用 originalText 找 unique match）
 *   - style: inline style attribute 加在 className 內（color/backgroundColor）
 *
 * 失敗 fallback：
 *   - 找不到 unique match → return { ok: false, reason: 'text-not-unique' }
 *   - frontend 顯示「請改用 chat iteration」引導
 *
 * 將來增強（commit 8+）：
 *   - 換 Babel AST walk by domPath (tagName + nth-child chain)
 *   - 支援更多 ops（fontSize/spacing/border/shadow/opacity）
 *   - 攔截 conditional/loop/fragment edge case
 */

import { z } from 'zod'
import * as db from '../db/client'
import { getFlowState, saveFlowState } from '../workers/orchestrator-utils'
import { createLogger } from '../lib/logger'
import { recordTelemetry } from './skill-telemetry'
import type Redis from 'ioredis'
import type { IoEmitter } from '../types/flow-state'

const logger = createLogger('extension-apply-skill')

// ──────────────────────────────────────────────────────────
// Whitelist of safe ops（跟 MiniPropertyEditor 一致）
// ──────────────────────────────────────────────────────────

const SAFE_STYLE_KEYS = new Set([
  'color',
  'backgroundColor',
  'background-color',
  // commit 8+ 增加：fontSize, padding, margin, border, boxShadow, opacity ...
])

const updateSchema = z.object({
  kind: z.enum(['text', 'style']),
  key: z.string().optional(),
  value: z.string().min(0).max(1000),
})

export const applyUpdateInputSchema = z.object({
  conversationId: z.string().uuid(),
  elementId: z.string().min(1),
  originalText: z.string().optional(),  // MVP regex match 用
  domPath: z.string().optional(),  // commit 8+ AST patch 用
  updates: z.array(updateSchema).min(1).max(10),
})

export type ApplyUpdateInput = z.infer<typeof applyUpdateInputSchema>

// ──────────────────────────────────────────────────────────
// Main entry
// ──────────────────────────────────────────────────────────

export interface ApplyUpdateResult {
  ok: boolean
  reason?: 'text-not-unique' | 'no-code' | 'invalid-op' | 'flowstate-missing' | 'unknown'
  modifiedFiles?: number
  redeployTriggered?: boolean
  message?: string
}

export async function applyExtensionUpdate(
  input: ApplyUpdateInput,
  redis: Redis,
  io: IoEmitter | undefined,
): Promise<ApplyUpdateResult> {
  const state = await getFlowState(redis, input.conversationId)
  if (!state) {
    recordApplyFailed(input.conversationId, 'flowstate-missing')
    return { ok: false, reason: 'flowstate-missing', message: 'FlowState 不存在（對話可能過期）' }
  }

  const code = state.uiuxGeneratedCode
  if (!code || code.pages.length === 0) {
    recordApplyFailed(input.conversationId, 'no-code')
    return { ok: false, reason: 'no-code', message: '無 uiuxGeneratedCode 可改' }
  }

  // 驗證 op whitelist
  for (const u of input.updates) {
    if (u.kind === 'style' && (!u.key || !SAFE_STYLE_KEYS.has(u.key))) {
      recordApplyFailed(input.conversationId, 'invalid-op')
      return { ok: false, reason: 'invalid-op', message: `style key ${u.key} not whitelisted` }
    }
  }

  // ── Phase A: text replacement ──
  let modifiedFiles = 0
  const textUpdates = input.updates.filter(u => u.kind === 'text')
  if (textUpdates.length > 0 && input.originalText) {
    const result = applyTextReplace(code, input.originalText, textUpdates[0].value)
    if (result.uniqueMatch) {
      code.pages = result.pages
      code.components = result.components
      modifiedFiles += result.fileCount
    } else if (textUpdates[0].value.trim() !== input.originalText.trim()) {
      // 用戶確實要改 text 但找不到 unique match → fail
      recordApplyFailed(input.conversationId, 'text-not-unique')
      return {
        ok: false,
        reason: 'text-not-unique',
        message: `原文「${input.originalText.slice(0, 30)}」在源碼出現 ${result.fileCount} 次，無法 unique 替換`,
      }
    }
  }

  // ── Phase B: style apply（MVP: 寫 inline style attribute）──
  // 註：JSX style attribute 是 object，不是 string，所以這需要 Babel AST。
  // commit 6 MVP 簡化：只記 telemetry，實際 style 改不寫進源碼（用戶 local preview 已生效）
  // commit 8+ 補 AST patch 才能真寫進 className/style prop
  const styleUpdates = input.updates.filter(u => u.kind === 'style')
  if (styleUpdates.length > 0) {
    logger.info({
      conversationId: input.conversationId,
      elementId: input.elementId,
      styleCount: styleUpdates.length,
    }, 'style updates 待 AST patch 接通（commit 8+），目前僅 local preview')
  }

  // 沒任何實際修改 → 返回但標 redeploy=false
  if (modifiedFiles === 0) {
    return {
      ok: true,
      modifiedFiles: 0,
      redeployTriggered: false,
      message: 'No persistent change (style-only MVP, awaiting AST patch in commit 8+)',
    }
  }

  // ── Phase C: 寫 FlowState + triggerPreviewDeploy ──
  state.uiuxGeneratedCode = code
  await saveFlowState(redis, input.conversationId, state)

  // 觸發 preview 重 deploy（reuse R10 6 層自動修復管線）
  const tailwindConfig = ''  // MVP 不重 generate，用 sanitize 階段的版本
  let redeployTriggered = false
  try {
    const { triggerPreviewDeploy } = await import('../workers/preview-deploy-worker')
    if (state.projectId) {
      await triggerPreviewDeploy(input.conversationId, state.projectId, code, tailwindConfig, redis, io)
      redeployTriggered = true
    }
  } catch (err) {
    logger.warn({ err }, 'triggerPreviewDeploy 失敗 fail-soft')
  }

  logger.info({
    conversationId: input.conversationId,
    elementId: input.elementId,
    modifiedFiles,
    redeployTriggered,
  }, '✓ extension apply-update 完成')

  // R11 commit 8 telemetry：apply 成功
  void recordTelemetry({
    skillName: 'uiux',
    eventType: 'extension_update_applied',
    patternKey: modifiedFiles > 0 ? 'text-unique' : 'style-only',
    severity: 'info',
    outcome: 'success',
    userId: null,
    conversationId: input.conversationId,
    payload: { modifiedFiles, redeployTriggered, opCount: input.updates.length },
  }).catch(() => {})

  return {
    ok: true,
    modifiedFiles,
    redeployTriggered,
  }
}

// R11 commit 8: 共用 fail telemetry helper
function recordApplyFailed(conversationId: string, reason: string) {
  void recordTelemetry({
    skillName: 'uiux',
    eventType: 'extension_apply_failed',
    patternKey: reason,
    severity: 'warning',
    outcome: 'failed',
    userId: null,
    conversationId,
    payload: { reason },
  }).catch(() => {})
}

// ──────────────────────────────────────────────────────────
// Phase A: text replacement (MVP regex unique match)
// ──────────────────────────────────────────────────────────

interface TextReplaceResult {
  uniqueMatch: boolean
  pages: typeof Code.prototype['pages']
  components: typeof Code.prototype['components']
  fileCount: number  // 總共找到幾個 file 含此 text
}

// Type alias placeholder
class Code {
  pages: Array<{ path: string; content: string; description: string }> = []
  components: Array<{ path: string; content: string; description: string }> = []
}

function applyTextReplace(
  code: { pages: Array<{ path: string; content: string; description: string }>; components: Array<{ path: string; content: string; description: string }>; styles: string },
  originalText: string,
  newText: string,
): TextReplaceResult {
  const trimmed = originalText.trim()
  if (!trimmed) {
    return { uniqueMatch: false, pages: code.pages, components: code.components, fileCount: 0 }
  }

  // 找出所有含 originalText 的 file
  const matched: { type: 'page' | 'component'; idx: number }[] = []
  for (let i = 0; i < code.pages.length; i++) {
    if (containsAsLiteralText(code.pages[i].content, trimmed)) matched.push({ type: 'page', idx: i })
  }
  for (let i = 0; i < code.components.length; i++) {
    if (containsAsLiteralText(code.components[i].content, trimmed)) matched.push({ type: 'component', idx: i })
  }

  // 必須 unique match — 多個 file 含 = 無法保證改對的那個
  if (matched.length !== 1) {
    return { uniqueMatch: false, pages: code.pages, components: code.components, fileCount: matched.length }
  }

  // 該 file 內也必須 unique 出現（避免同檔多處同字串）
  const target = matched[0].type === 'page' ? code.pages[matched[0].idx] : code.components[matched[0].idx]
  const occurrences = countLiteralOccurrences(target.content, trimmed)
  if (occurrences !== 1) {
    return { uniqueMatch: false, pages: code.pages, components: code.components, fileCount: occurrences }
  }

  // 替換
  const newContent = replaceLiteralText(target.content, trimmed, newText)
  const newPages = [...code.pages]
  const newComponents = [...code.components]
  if (matched[0].type === 'page') newPages[matched[0].idx] = { ...target, content: newContent }
  else newComponents[matched[0].idx] = { ...target, content: newContent }

  return { uniqueMatch: true, pages: newPages, components: newComponents, fileCount: 1 }
}

/**
 * 偵測 text 是否以「字面文字」(literal JSX text node) 出現在 content
 * 排除：被引號包圍的 string literal、註解、import path
 */
function containsAsLiteralText(content: string, text: string): boolean {
  // 簡化版：直接搜尋 — 太簡單但 MVP OK
  // 改進方向：parse JSX 後 walk JSXText nodes
  return content.includes(text)
}

function countLiteralOccurrences(content: string, text: string): number {
  let count = 0
  let pos = 0
  while ((pos = content.indexOf(text, pos)) !== -1) {
    count++
    pos += text.length
  }
  return count
}

function replaceLiteralText(content: string, original: string, replacement: string): string {
  // 簡單 first-occurrence replace（occurrence === 1 已驗證）
  return content.replace(original, replacement)
}
