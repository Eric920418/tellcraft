// ============================================================
// tryFixWrongStatus
// 處理「HTTP 狀態碼不匹配」類錯誤。
// 策略：
//   1. 從 error 提取 expected status（預期 201 / expected 200）
//   2. 掃描 code 中的 `return { __status: N, ... }` 與無 __status 的 return
//   3. 根據 handle function 名（Create/Register → 201；其他 → 200）或 error 的 expected 覆寫
// ============================================================

import type { DeterministicFixContext, DeterministicFixResult } from './index'

export function tryFixWrongStatus(code: string, ctx: DeterministicFixContext): DeterministicFixResult | null {
  const expectedStatus = extractExpectedStatus(ctx.error)
  if (!expectedStatus) return null

  let fixed = code
  let mutated = false
  const strategies: string[] = []

  // Case A: return 物件有 __status 但值錯誤 → 覆寫
  const statusInObjectRegex = /return\s*\{\s*__status\s*:\s*(\d{3})\b/g
  const newCodeA = fixed.replace(statusInObjectRegex, (match, current: string) => {
    if (current !== String(expectedStatus)) {
      mutated = true
      return match.replace(/__status\s*:\s*\d{3}/, `__status: ${expectedStatus}`)
    }
    return match
  })
  if (newCodeA !== fixed) {
    fixed = newCodeA
    strategies.push(`inline_object_status_overwrite=${expectedStatus}`)
  }

  // Case B: `(result as any).__status = N` 類覆寫
  const anyCastRegex = /;?\s*\(\s*(\w+)\s+as\s+any\)\s*\.\s*__status\s*=\s*(\d{3})/g
  const newCodeB = fixed.replace(anyCastRegex, (match, _var, current: string) => {
    if (current !== String(expectedStatus)) {
      mutated = true
      return match.replace(/__status\s*=\s*\d{3}/, `__status = ${expectedStatus}`)
    }
    return match
  })
  if (newCodeB !== fixed) {
    fixed = newCodeB
    strategies.push(`any_cast_status_overwrite=${expectedStatus}`)
  }

  // Case C: 完全沒 __status → 在第一個 return 物件內插入（保守策略，選擇 expectedStatus）
  if (!/\b__status\b/.test(fixed)) {
    const bareReturnRegex = /return\s*\{([^{}]*)\}/m
    const match = fixed.match(bareReturnRegex)
    if (match) {
      const body = match[1].trim()
      const newReturn = body.length === 0
        ? `return { __status: ${expectedStatus} }`
        : `return { __status: ${expectedStatus}, ${body} }`
      fixed = fixed.replace(match[0], newReturn)
      mutated = true
      strategies.push(`inject_missing_status=${expectedStatus}`)
    }
  }

  if (!mutated) return null

  return { fixedCode: fixed, strategy: strategies.join('+') }
}

function extractExpectedStatus(error: string): number | null {
  // 中文：「預期 201」「預期 401」「HTTP 狀態碼 預期 201，實際 200」
  const m1 = error.match(/預期[:\s]*(\d{3})/)
  if (m1) return Number(m1[1])

  // 英文：expected 201 / expect 401
  const m2 = error.match(/expect(?:ed)?[:\s]+(\d{3})/i)
  if (m2) return Number(m2[1])

  // 中文：「狀態碼 201」
  const m3 = error.match(/狀態碼\s*[:：]?\s*(\d{3})/)
  if (m3) return Number(m3[1])

  // status code mismatch — 單一數字在 error
  const m4 = error.match(/\bstatus[^0-9]*(\d{3})/i)
  if (m4) return Number(m4[1])

  return null
}
