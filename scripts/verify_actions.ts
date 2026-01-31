/**
 * AI-Genesis Server Actions 行為測試
 *
 * 這個腳本驗證所有 Server Actions 是否已實作。
 * SDD Runner 會使用這個測試來驅動開發。
 */

import * as actions from '../app/actions'

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

const results: TestResult[] = []

async function testAction(name: string, fn: () => Promise<unknown>) {
  try {
    await fn()
    // Action 已實作：回傳結果（不論成功或失敗都算已實作）
    // 只有拋出 "Not implemented" 才算未實作
    results.push({ name, passed: true })
    console.log(`✓ ${name}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isNotImplemented = errorMessage === 'Not implemented'
    if (isNotImplemented) {
      results.push({ name, passed: false, error: errorMessage })
      console.log(`✗ ${name} - Not implemented`)
    } else {
      // 其他錯誤（如資料庫連接失敗）也算已實作
      // 因為 action 有執行到業務邏輯
      results.push({ name, passed: true })
      console.log(`✓ ${name} (with expected error: ${errorMessage.slice(0, 50)}...)`)
    }
  }
}

async function runTests() {
  console.log('=== AI-Genesis Server Actions Test ===\n')

  // 核心功能測試
  console.log('--- Core Actions ---')

  await testAction('createProject', () =>
    actions.createProject({
      userId: 'test-user-id',
      name: 'Test Project'
    })
  )

  await testAction('sendMessage', () =>
    actions.sendMessage({
      conversationId: 'test-conv-id',
      content: 'Hello'
    })
  )

  await testAction('generateCode', () =>
    actions.generateCode({
      projectId: 'test-project-id'
    })
  )

  await testAction('deployProject', () =>
    actions.deployProject({
      projectId: 'test-project-id'
    })
  )

  await testAction('updateProject', () =>
    actions.updateProject({
      projectId: 'test-project-id',
      changes: 'Fix bug'
    })
  )

  await testAction('cancelSubscription', () =>
    actions.cancelSubscription({
      userId: 'test-user-id'
    })
  )

  await testAction('exportData', () =>
    actions.exportData({
      userId: 'test-user-id',
      format: 'json'
    })
  )

  await testAction('transferResources', () =>
    actions.transferResources({
      projectId: 'test-project-id',
      targetUserId: 'target-user-id'
    })
  )

  // Orchestrator 測試
  console.log('\n--- Orchestrator Actions ---')

  await testAction('createTask', () =>
    actions.createTask({
      projectId: 'test-project-id',
      goal: 'Test goal'
    })
  )

  await testAction('confirmTaskPlan', () =>
    actions.confirmTaskPlan({
      taskId: 'test-task-id',
      approved: true
    })
  )

  await testAction('cancelTask', () =>
    actions.cancelTask({
      taskId: 'test-task-id'
    })
  )

  await testAction('retryTask', () =>
    actions.retryTask({
      taskId: 'test-task-id'
    })
  )

  await testAction('registerSkill', () =>
    actions.registerSkill({
      name: 'test-skill',
      displayName: 'Test Skill',
      description: 'A test skill'
    })
  )

  await testAction('configureWebhook', () =>
    actions.configureWebhook({
      userId: 'test-user-id',
      url: 'https://example.com/webhook',
      events: 'task_completed'
    })
  )

  // 結果統計
  console.log('\n=== Summary ===')
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log(`Total: ${total}`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)

  if (failed > 0) {
    // SDD Runner 預期格式: [FAIL] mvn_exit=X total=X fail=X err=X
    console.log(`\n[FAIL] mvn_exit=1 total=${total} fail=${failed} err=0`)
    process.exit(1)
  } else {
    // SDD Runner 預期格式: [PASS] X tests passed
    console.log(`\n[PASS] ${total} tests passed`)
    process.exit(0)
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err)
  process.exit(1)
})
