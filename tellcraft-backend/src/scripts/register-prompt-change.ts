/**
 * Prompt Change 註冊 CLI
 *
 * 用法：
 *   # 註冊一次回灌動作（改了 prompt 或加了 sanitize/QG 規則後執行）
 *   pnpm tsx src/scripts/register-prompt-change.ts \
 *     --pattern motion-import \
 *     --skill deployer \
 *     --action sanitize_rule \
 *     --target services/deployer.ts \
 *     --commit abc1234 \
 *     --note "在 sanitizeCodeForDeploy 加了 framer-motion → motion/react 替換"
 *
 *   # 汰換一條（畢業 = 問題已解決或觸發數趨近 0）
 *   pnpm tsx src/scripts/register-prompt-change.ts --retire 3
 *
 *   # 列出所有活躍的 prompt changes
 *   pnpm tsx src/scripts/register-prompt-change.ts --list
 *
 *   # 列出所有（含已汰換）
 *   pnpm tsx src/scripts/register-prompt-change.ts --list-all
 */

// CLI 腳本必須：(1) 先載 .env 到 process.env；(2) 在 import db/client 前呼叫 validateEnv()
// 因為 db/client.ts 在 module top-level new Pool({ connectionString: getEnv().DATABASE_URL })
// ES module import 是 hoisted 的，只有 dynamic import 能延後到 validateEnv 之後
import 'dotenv/config'
import { validateEnv } from '../lib/env'
import type { PromptChangeActionType } from '../services/skill-telemetry'

validateEnv()

const VALID_ACTIONS = new Set<PromptChangeActionType>(['prompt_fewshot', 'sanitize_rule', 'qg_rule'])

function parseArgs() {
  const args = process.argv.slice(2)
  const parsed: Record<string, string> = {}
  let listMode: 'active' | 'all' | null = null
  let retireId: number | null = null

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--list') {
      listMode = 'active'
    } else if (arg === '--list-all') {
      listMode = 'all'
    } else if (arg.startsWith('--retire')) {
      if (arg.includes('=')) {
        retireId = Number(arg.split('=')[1])
      } else if (args[i + 1]) {
        retireId = Number(args[++i])
      }
    } else if (arg.startsWith('--')) {
      const key = arg.slice(2)
      if (arg.includes('=')) {
        const [k, ...v] = arg.slice(2).split('=')
        parsed[k] = v.join('=')
      } else if (args[i + 1] && !args[i + 1].startsWith('--')) {
        parsed[key] = args[++i]
      }
    }
  }

  return { parsed, listMode, retireId }
}

type PromptChangeRow = Awaited<ReturnType<typeof import('../services/skill-telemetry').getActivePromptChanges>>[number]

function formatTable(changes: PromptChangeRow[]) {
  if (changes.length === 0) {
    console.log('（無資料）')
    return
  }
  console.log(
    ['id', 'pattern_key', 'skill', 'action', 'target_file', 'baseline', 'injected', 'retired', 'note']
      .map(h => h.padEnd(h === 'target_file' ? 30 : h === 'note' ? 40 : 18))
      .join(' ')
  )
  console.log('-'.repeat(200))
  for (const c of changes) {
    console.log(
      [
        String(c.id).padEnd(18),
        c.pattern_key.padEnd(18),
        c.skill_name.padEnd(18),
        c.action_type.padEnd(18),
        c.target_file.padEnd(30),
        String(c.baseline_count).padEnd(18),
        (c.injected_at?.slice(0, 10) || '').padEnd(18),
        (c.retired_at?.slice(0, 10) || '—').padEnd(18),
        (c.description || '').slice(0, 40),
      ].join(' ')
    )
  }
}

async function main() {
  const { parsed, listMode, retireId } = parseArgs()

  // 動態 import — 必須在 validateEnv() 之後，避免 db/client top-level getEnv() 炸掉
  const {
    registerPromptChange,
    retirePromptChange,
    getActivePromptChanges,
    getAllPromptChanges,
  } = await import('../services/skill-telemetry')
  const { closePool } = await import('../db/client')

  try {
    // --list / --list-all
    if (listMode) {
      const changes = listMode === 'all'
        ? await getAllPromptChanges()
        : await getActivePromptChanges()
      console.log(`\n=== Prompt Changes (${listMode}) ===\n`)
      formatTable(changes)
      console.log(`\nTotal: ${changes.length}`)
      return
    }

    // --retire N
    if (retireId != null) {
      if (Number.isNaN(retireId) || retireId <= 0) {
        console.error('--retire 需要正整數 id')
        process.exit(1)
      }
      await retirePromptChange(retireId)
      console.log(`✓ 已汰換 prompt change id=${retireId}`)
      return
    }

    // 註冊模式
    const { pattern, skill, action, target, commit, note } = parsed
    if (!pattern || !skill || !action || !target) {
      console.error(`用法：
  pnpm tsx src/scripts/register-prompt-change.ts \\
    --pattern <pattern_key> \\
    --skill <deployer|quality_gate|iteration|uiux|coder> \\
    --action <prompt_fewshot|sanitize_rule|qg_rule> \\
    --target <target_file> \\
    [--commit <sha>] \\
    [--note "description"]

  pnpm tsx src/scripts/register-prompt-change.ts --list
  pnpm tsx src/scripts/register-prompt-change.ts --list-all
  pnpm tsx src/scripts/register-prompt-change.ts --retire <id>`)
      process.exit(1)
    }

    if (!VALID_ACTIONS.has(action as PromptChangeActionType)) {
      console.error(`無效的 action: "${action}"。可選: prompt_fewshot, sanitize_rule, qg_rule`)
      process.exit(1)
    }

    const result = await registerPromptChange({
      patternKey: pattern,
      skillName: skill,
      actionType: action as PromptChangeActionType,
      targetFile: target,
      description: note,
      commitHash: commit,
    })

    console.log(`\n✓ 已註冊 prompt change:`)
    console.log(`  id: ${result.id}`)
    console.log(`  pattern: ${result.pattern_key}`)
    console.log(`  skill: ${result.skill_name}`)
    console.log(`  action: ${result.action_type}`)
    console.log(`  target: ${result.target_file}`)
    console.log(`  baseline_count: ${result.baseline_count} (近 7 天觸發數)`)
    console.log(`  injected_at: ${result.injected_at}`)
    if (result.description) console.log(`  note: ${result.description}`)
    if (result.commit_hash) console.log(`  commit: ${result.commit_hash}`)
  } catch (err) {
    console.error('操作失敗：', err)
    process.exit(1)
  } finally {
    await closePool().catch(() => {})
  }
}

main()
