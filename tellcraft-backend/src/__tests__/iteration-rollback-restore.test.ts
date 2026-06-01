import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { snapshotToGeneratedCode, type SnapshotFile } from '../services/iteration-skill'

// ============================================================
// snapshotToGeneratedCode 純函數測試
// 涵蓋 Bug 1: rollback 還原 code_snapshot 的解析邏輯
// ============================================================

describe('snapshotToGeneratedCode', () => {
  it('uiux page → pages 陣列', () => {
    const snapshot: SnapshotFile[] = [
      { filePath: 'app/page.tsx', content: 'export default () => null', skillSource: 'uiux', fileType: 'page' },
    ]
    const result = snapshotToGeneratedCode(snapshot)
    expect(result.pages).toHaveLength(1)
    expect(result.pages[0]).toEqual({ path: 'app/page.tsx', content: 'export default () => null', description: '' })
    expect(result.components).toHaveLength(0)
    expect(result.styles).toBe('')
  })

  it('uiux component → components 陣列', () => {
    const snapshot: SnapshotFile[] = [
      { filePath: 'components/Hero.tsx', content: '<div/>', skillSource: 'uiux', fileType: 'component' },
    ]
    const result = snapshotToGeneratedCode(snapshot)
    expect(result.components).toHaveLength(1)
    expect(result.components[0].path).toBe('components/Hero.tsx')
    expect(result.pages).toHaveLength(0)
  })

  it('uiux style → styles 字串', () => {
    const snapshot: SnapshotFile[] = [
      { filePath: 'app/globals.css', content: 'body{}', skillSource: 'uiux', fileType: 'style' },
    ]
    const result = snapshotToGeneratedCode(snapshot)
    expect(result.styles).toBe('body{}')
  })

  it('merge skillSource 也算進 uiuxGeneratedCode（Coder 改寫過的組件）', () => {
    const snapshot: SnapshotFile[] = [
      { filePath: 'components/Form.tsx', content: '<form/>', skillSource: 'merge', fileType: 'component' },
    ]
    const result = snapshotToGeneratedCode(snapshot)
    expect(result.components).toHaveLength(1)
    expect(result.components[0].path).toBe('components/Form.tsx')
  })

  it('coder skillSource 不進 uiuxGeneratedCode（後端代碼）', () => {
    const snapshot: SnapshotFile[] = [
      { filePath: 'app/actions/createUser.ts', content: 'export async function', skillSource: 'coder', fileType: 'service' },
      { filePath: 'app/api/login/route.ts', content: 'export async function POST', skillSource: 'coder', fileType: 'api_route' },
    ]
    const result = snapshotToGeneratedCode(snapshot)
    expect(result.pages).toHaveLength(0)
    expect(result.components).toHaveLength(0)
    expect(result.styles).toBe('')
  })

  it('混合 snapshot（uiux + coder + merge）— 只取 uiux/merge', () => {
    const snapshot: SnapshotFile[] = [
      { filePath: 'app/page.tsx', content: 'page', skillSource: 'uiux', fileType: 'page' },
      { filePath: 'components/Hero.tsx', content: 'hero', skillSource: 'uiux', fileType: 'component' },
      { filePath: 'components/Form.tsx', content: 'form', skillSource: 'merge', fileType: 'component' },
      { filePath: 'app/globals.css', content: 'css', skillSource: 'uiux', fileType: 'style' },
      { filePath: 'app/actions/x.ts', content: 'action', skillSource: 'coder', fileType: 'service' },
    ]
    const result = snapshotToGeneratedCode(snapshot)
    expect(result.pages).toHaveLength(1)
    expect(result.components).toHaveLength(2)
    expect(result.components.map(c => c.path).sort()).toEqual(['components/Form.tsx', 'components/Hero.tsx'])
    expect(result.styles).toBe('css')
  })

  it('空 snapshot 不爆炸', () => {
    const result = snapshotToGeneratedCode([])
    expect(result).toEqual({ pages: [], components: [], styles: '' })
  })

  it('未知 fileType 靜默跳過（不破壞還原）', () => {
    const snapshot: SnapshotFile[] = [
      { filePath: 'app/page.tsx', content: 'p', skillSource: 'uiux', fileType: 'page' },
      { filePath: 'README.md', content: '# Doc', skillSource: 'uiux', fileType: 'doc' },
      { filePath: 'DESIGN.md', content: '# DS', skillSource: 'uiux', fileType: 'unknown_type' },
    ]
    const result = snapshotToGeneratedCode(snapshot)
    expect(result.pages).toHaveLength(1)
    expect(result.components).toHaveLength(0)
    expect(result.styles).toBe('')
  })
})

// ============================================================
// SQL 結構回歸測試
// 涵蓋 Bug 1: deployer/rollback INSERT 必須帶 generation_id
// 防止未來重構時把 CTE / generation_id 漏掉
// ============================================================

describe('deployments INSERT 必須帶 generation_id（回歸守護）', () => {
  const repoRoot = path.resolve(__dirname, '../..')
  const deployerSrc = fs.readFileSync(path.join(repoRoot, 'src/services/deployer.ts'), 'utf-8')
  const iterationSrc = fs.readFileSync(path.join(repoRoot, 'src/services/iteration-skill.ts'), 'utf-8')

  it('deployer.ts 部署成功 INSERT 用 CTE 抓最新 generation_id', () => {
    // CTE 結構必須抓最新 generation 並寫入 deployments
    expect(deployerSrc).toContain('WITH latest_gen')
    expect(deployerSrc).toContain('FROM generations')
    expect(deployerSrc).toMatch(/INSERT INTO deployments[\s\S]*?generation_id/m)
    expect(deployerSrc).toMatch(/ORDER BY version_number DESC/)
  })

  it('listProjectDeployments 必須 SELECT 帶出 generation_id', () => {
    expect(deployerSrc).toMatch(/SELECT[^;]*?generation_id[^;]*?FROM deployments/m)
  })

  it('DeploymentRecord interface 必須包含 generation_id', () => {
    expect(deployerSrc).toMatch(/generation_id:\s*string\s*\|\s*null/)
  })

  it('executeRollbackSelection 寫的 deployment 帶 target.generation_id', () => {
    expect(iterationSrc).toMatch(/INSERT INTO deployments[\s\S]*?generation_id[\s\S]*?target\.generation_id/m)
  })

  it('executeRollbackSelection 在 Vercel promote 成功後呼叫 restoreCodeFromGeneration', () => {
    expect(iterationSrc).toContain('restoreCodeFromGeneration')
    expect(iterationSrc).toMatch(/if \(target\.generation_id\)/)
  })

  it('executeUndoIteration catch 還原 stateSnapshot 七個欄位', () => {
    // 確保 fail-safe 的 7 個 state 欄位都還原
    const undoSection = iterationSrc.slice(
      iterationSrc.indexOf('export async function executeUndoIteration'),
      iterationSrc.indexOf('export async function executeRollbackQuery')
    )
    expect(undoSection).toContain('stateSnapshot.uiuxGeneratedCode')
    expect(undoSection).toContain('stateSnapshot.uiuxPreIterationCode')
    expect(undoSection).toContain('stateSnapshot.iterationCount')
    expect(undoSection).toContain('stateSnapshot.iterationHistory')
    expect(undoSection).toContain('stateSnapshot.iterationFailedToImproveCount')
    expect(undoSection).toContain('stateSnapshot.phase')
    expect(undoSection).toContain('stateSnapshot.uiuxCodePhase')
  })

  it('executeUndoIteration 撤銷時清 iterationFailedToImproveCount 為 0', () => {
    const undoSection = iterationSrc.slice(
      iterationSrc.indexOf('export async function executeUndoIteration'),
      iterationSrc.indexOf('export async function executeRollbackQuery')
    )
    expect(undoSection).toMatch(/state\.iterationFailedToImproveCount\s*=\s*0/)
  })

  it('executeUndoIteration / executeRollbackSelection 都有 telemetry 埋點', () => {
    const undoSection = iterationSrc.slice(
      iterationSrc.indexOf('export async function executeUndoIteration'),
      iterationSrc.indexOf('export async function executeRollbackQuery')
    )
    const rollbackSection = iterationSrc.slice(
      iterationSrc.indexOf('export async function executeRollbackSelection')
    )
    expect(undoSection).toMatch(/recordTelemetry/)
    expect(undoSection).toMatch(/iteration_undone|undo_exception/)
    expect(rollbackSection).toMatch(/recordTelemetry/)
    expect(rollbackSection).toMatch(/rollback_/)
  })
})
