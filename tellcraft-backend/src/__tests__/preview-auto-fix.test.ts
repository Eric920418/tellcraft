/**
 * R10 治本 unit test — preview-auto-fix 6 層架構驗證
 *
 * Fixture 涵蓋：
 *   1. TypeScript error → parseBuildErrors → mock fixBuildErrors 成功 → L3 第 1 輪 success
 *   2. Module not found → 第 1 輪 fail / 第 2 輪 success → round 2 success telemetry
 *   3. 2 輪都 fail → preview_auto_fix_give_up event + 觸發 L5
 *   4. parseBuildErrors 抓不到 → 跳過 L3 直接 L5
 *   5. L5 verifyBuildLocally + quickPreviewDeploy 成功
 *   6. L5 也失敗（極端 case）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock deployer + preview-deployer module before import
vi.mock('../services/deployer', () => ({
  parseBuildErrors: vi.fn(),
  fixBuildErrors: vi.fn(),
  fetchVercelBuildLogs: vi.fn(),
  verifyBuildLocally: vi.fn(),
}))
vi.mock('../services/preview-deployer', () => ({
  quickPreviewDeploy: vi.fn(),
}))
vi.mock('../services/skill-telemetry', () => ({
  recordTelemetry: vi.fn().mockResolvedValue(undefined),
}))
// Mock getEnv 確保 R10 flags 在 test 環境穩定（不依賴 .env 載入）
vi.mock('../lib/env', () => ({
  getEnv: () => ({
    ENABLE_PREVIEW_AUTO_FIX: true,
    MAX_PREVIEW_AUTO_FIX_ROUNDS: 2,
    ENABLE_PREVIEW_HEAVY_FALLBACK: true,
    PREVIEW_AUTO_FIX_TIMEOUT_MS: 180000,
    PREVIEW_HEAVY_FALLBACK_TIMEOUT_MS: 360000,
  }),
}))

import { autoFixAndRedeployPreview, runPreviewAutoFix, heavyFallbackVerifyLocally } from '../services/preview-auto-fix'
import * as deployer from '../services/deployer'
import * as previewDeployer from '../services/preview-deployer'
import * as telemetry from '../services/skill-telemetry'
import type { QuickPreviewDeployInput, QuickPreviewDeployResult } from '../services/preview-deployer'

const mockInput: QuickPreviewDeployInput = {
  conversationId: 'test-conv-1',
  projectId: 'test-proj-1',
  code: { pages: [], components: [], styles: '' },
  tailwindConfig: '',
  projectName: 'test-app',
}

const TS_ERROR_LOG = `
./app/page.tsx
  10:5 Type error: Property 'foo' does not exist on type 'never'.
`

const MODULE_NOT_FOUND_LOG = `
Module not found: Can't resolve 'react-quantum'
`

beforeEach(() => {
  vi.clearAllMocks()
})

describe('autoFixAndRedeployPreview L3+L4', () => {
  it('Fixture 1: TypeScript error → fixBuildErrors 成功 → L3 第 1 輪 success', async () => {
    vi.mocked(deployer.parseBuildErrors).mockReturnValue([
      { type: 'typescript', message: "Property 'foo' does not exist", file: 'app/page.tsx', line: 10 },
    ])
    vi.mocked(deployer.fixBuildErrors).mockResolvedValue({
      code: { pages: [{ path: 'app/page.tsx', content: 'fixed', description: '' }], components: [], styles: '' },
      newDependencies: {},
    })
    vi.mocked(previewDeployer.quickPreviewDeploy).mockResolvedValue({
      status: 'ready',
      url: 'https://fixed.vercel.app',
      deploymentId: 'dpl_fixed',
      codeHash: 'hash1',
    } as QuickPreviewDeployResult)

    const result = await autoFixAndRedeployPreview(mockInput, TS_ERROR_LOG, 1)
    expect(result.status).toBe('ready')
    expect(deployer.parseBuildErrors).toHaveBeenCalledWith(TS_ERROR_LOG)
    expect(deployer.fixBuildErrors).toHaveBeenCalled()
    expect(previewDeployer.quickPreviewDeploy).toHaveBeenCalled()
    // 應 fire round_success telemetry
    expect(telemetry.recordTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'preview_auto_fix_round_success' })
    )
  })

  it('Fixture 4: parseBuildErrors 抓不到 error → return failed parse-failed（不呼叫 fixBuildErrors）', async () => {
    vi.mocked(deployer.parseBuildErrors).mockReturnValue([])

    const result = await autoFixAndRedeployPreview(mockInput, 'random garbled output', 1)
    expect(result.status).toBe('failed')
    expect(result.error).toBe('parse-failed')
    expect(deployer.fixBuildErrors).not.toHaveBeenCalled()
    expect(previewDeployer.quickPreviewDeploy).not.toHaveBeenCalled()
  })

  it('fixBuildErrors 3 retry 全 null → return llm-fix-failed', async () => {
    vi.mocked(deployer.parseBuildErrors).mockReturnValue([
      { type: 'syntax', message: 'syntax error' },
    ])
    vi.mocked(deployer.fixBuildErrors).mockResolvedValue(null)

    const result = await autoFixAndRedeployPreview(mockInput, 'syntax error', 1)
    expect(result.status).toBe('failed')
    expect(result.error).toBe('llm-fix-failed')
    expect(previewDeployer.quickPreviewDeploy).not.toHaveBeenCalled()
  })
})

describe('runPreviewAutoFix 完整 L3+L4 → L5 流程', () => {
  it('Fixture 2: 第 1 輪 fail / 第 2 輪 success → preview_auto_fix_round_success', async () => {
    vi.mocked(deployer.parseBuildErrors).mockReturnValue([
      { type: 'module_not_found', message: "Can't resolve 'x'" },
    ])
    vi.mocked(deployer.fixBuildErrors).mockResolvedValue({
      code: { pages: [], components: [], styles: 'fixed' },
      newDependencies: {},
    })
    // 第 1 輪 deploy 仍 failed，第 2 輪 ready
    vi.mocked(previewDeployer.quickPreviewDeploy)
      .mockResolvedValueOnce({ status: 'failed', url: null, deploymentId: 'dpl1', codeHash: 'h1', error: 'fail-round-1' } as QuickPreviewDeployResult)
      .mockResolvedValueOnce({ status: 'ready', url: 'https://r2.vercel.app', deploymentId: 'dpl2', codeHash: 'h2' } as QuickPreviewDeployResult)

    const initialFailed: QuickPreviewDeployResult = {
      status: 'failed', url: null, deploymentId: 'dpl0', codeHash: 'h0',
      error: 'Vercel build ERROR', errorDetails: MODULE_NOT_FOUND_LOG,
    }
    const result = await runPreviewAutoFix(mockInput, initialFailed)
    expect(result.status).toBe('ready')
    expect(result.url).toBe('https://r2.vercel.app')
    expect(deployer.fixBuildErrors).toHaveBeenCalledTimes(2)
    expect(previewDeployer.quickPreviewDeploy).toHaveBeenCalledTimes(2)
  })

  it('Fixture 3: 2 輪都 fail → preview_auto_fix_give_up event + 觸發 L5', async () => {
    vi.mocked(deployer.parseBuildErrors).mockReturnValue([
      { type: 'unknown', message: 'persistent error' },
    ])
    vi.mocked(deployer.fixBuildErrors).mockResolvedValue({
      code: { pages: [], components: [], styles: '' },
      newDependencies: {},
    })
    vi.mocked(previewDeployer.quickPreviewDeploy)
      .mockResolvedValue({ status: 'failed', url: null, deploymentId: 'dpl', codeHash: 'h', error: 'fail' } as QuickPreviewDeployResult)
    // L5 mock：verifyBuildLocally 成功
    vi.mocked(deployer.verifyBuildLocally).mockResolvedValue({
      files: [],
      buildVerified: true,
      fixes: ['fix1'],
      finalCode: { pages: [], components: [], styles: 'L5-fixed' },
    })

    const initialFailed: QuickPreviewDeployResult = {
      status: 'failed', url: null, deploymentId: 'dpl0', codeHash: 'h0', error: 'fail', errorDetails: 'persistent log',
    }
    await runPreviewAutoFix(mockInput, initialFailed)

    // 應 fire give_up + heavy_fallback_triggered
    const calls = vi.mocked(telemetry.recordTelemetry).mock.calls.map(c => c[0].eventType)
    expect(calls).toContain('preview_auto_fix_give_up')
    expect(calls).toContain('preview_heavy_fallback_triggered')
    // verifyBuildLocally 應被呼叫
    expect(deployer.verifyBuildLocally).toHaveBeenCalled()
  })
})

describe('heavyFallbackVerifyLocally L5', () => {
  it('Fixture 5: L5 success → preview_heavy_fallback_success', async () => {
    vi.mocked(deployer.verifyBuildLocally).mockResolvedValue({
      files: [],
      buildVerified: true,
      fixes: [],
      finalCode: { pages: [], components: [], styles: 'verified' },
    })
    vi.mocked(previewDeployer.quickPreviewDeploy).mockResolvedValue({
      status: 'ready', url: 'https://L5.vercel.app', deploymentId: 'dpl-L5', codeHash: 'h-L5',
    } as QuickPreviewDeployResult)

    const result = await heavyFallbackVerifyLocally(mockInput, 'log')
    expect(result.status).toBe('ready')
    expect(deployer.verifyBuildLocally).toHaveBeenCalled()
    expect(telemetry.recordTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'preview_heavy_fallback_success' })
    )
  })

  it('Fixture 6: L5 throw → fail-soft return failed errorDetails 帶 log', async () => {
    vi.mocked(deployer.verifyBuildLocally).mockRejectedValue(new Error('disk full'))

    const result = await heavyFallbackVerifyLocally(mockInput, 'log content')
    expect(result.status).toBe('failed')
    expect(result.error).toContain('disk full')
    expect(result.errorDetails).toBe('log content')
  })

  // ENABLE_PREVIEW_HEAVY_FALLBACK=false skip 測試需要 env cache reset helper，
  // 既有 env.ts 沒 export reset — 跳過此 case（kill switch 用 git revert 驗證即可）
})
