// One-shot rescue: conversation 288e6f0e-b2d3-4267-81ab-8becceb70667
// Context: regenerateFeaturesTask completed Steps 1-6 (features regenerated)
// but completeSpecPhase hung before generating actions_yml/isa_config.
// This script re-runs completeSpecPhase to finish the pipeline.
//
// Usage (on VPS):
//   cd /home/ubuntu/tellcraft-repo/tellcraft-backend
//   export PATH=/home/ubuntu/.nvm/versions/node/v22.22.2/bin:$PATH
//   node scripts/rescue-288e6f0e.mjs

import IORedis from 'ioredis'
import { Emitter } from '@socket.io/redis-emitter'
import { validateEnv } from '../dist/lib/env.js'

validateEnv()

const { completeSpecPhase } = await import('../dist/workers/phase-handlers/bdd-phases.js')
const { getFlowState, saveFlowState } = await import('../dist/workers/orchestrator-utils.js')

const CONVERSATION_ID = '288e6f0e-b2d3-4267-81ab-8becceb70667'
const REDIS_URL = process.env.REDIS_URL || 'redis://:tellcraft_redis_password@localhost:6379'

async function main() {
  const generalRedis = new IORedis(REDIS_URL, { maxRetriesPerRequest: 3 })
  const emitterRedis = new IORedis(REDIS_URL)
  const emitter = new Emitter(emitterRedis)

  const state = await getFlowState(generalRedis, CONVERSATION_ID)
  if (!state) {
    console.error('FlowState not found')
    process.exit(1)
  }
  console.log('BEFORE:', JSON.stringify({
    phase: state.phase,
    waitingForReply: state.waitingForReply,
    sessionId: state.sessionId,
    formulationStartedAt: state.formulationStartedAt,
  }))

  // Normalize state: treat this as end-of-formulation entering completeSpecPhase
  state.formulationStartedAt = undefined
  state.waitingForReply = false
  await saveFlowState(generalRedis, CONVERSATION_ID, state)

  console.log('Calling completeSpecPhase...')
  try {
    await completeSpecPhase(CONVERSATION_ID, state, generalRedis, emitter)
    console.log('completeSpecPhase returned successfully')
  } catch (err) {
    console.error('completeSpecPhase threw:', err)
    process.exit(2)
  }

  const after = await getFlowState(generalRedis, CONVERSATION_ID)
  console.log('AFTER:', JSON.stringify({
    phase: after?.phase,
    waitingForReply: after?.waitingForReply,
  }))

  await generalRedis.quit()
  await emitterRedis.quit()
  console.log('DONE')
  process.exit(0)
}

main().catch((err) => {
  console.error('Unhandled:', err)
  process.exit(99)
})
