import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function triggerModal() {
  const sessionId = 'e012be51-a35a-45f2-9865-19bec8aeff89'

  const { data: session } = await supabase
    .from('bdd_sessions')
    .select('original_requirements, resolved_items, project_context, conversation_id')
    .eq('id', sessionId)
    .single()

  if (!session) {
    console.log('Session not found')
    return
  }

  const modalUrl = 'https://re-52481--tellcraft-formulation-generate-spec.modal.run'
  const callbackUrl = 'https://tellcraft.com/api/modal/callback'

  console.log('Calling Modal...')
  console.log('Session ID:', sessionId)
  console.log('Conversation ID:', session.conversation_id)

  const response = await fetch(modalUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requirements: session.original_requirements,
      resolved_items: session.resolved_items || [],
      project_context: session.project_context,
      session_id: sessionId,
      conversation_id: session.conversation_id,
      callback_url: callbackUrl,
    }),
  })

  const result = await response.json()
  console.log('Modal response:', JSON.stringify(result, null, 2))
}

triggerModal().catch(console.error)
