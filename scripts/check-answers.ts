import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  const convId = '41737eee-1681-4f4a-8589-feb570c0c85b'

  const { data: session } = await supabase
    .from('bdd_sessions')
    .select('resolved_items, staging_items')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (session) {
    const allItems = [...(session.resolved_items || []), ...(session.staging_items || [])]
    console.log('已回答的問題:')
    allItems.forEach((item: any, i: number) => {
      const q = item.whiteTextQuestion || item.question
      console.log(`${i+1}. Q: ${q.substring(0,60)}...`)
      console.log(`   A: ${item.answer}`)
      console.log('')
    })
  }
}

check().catch(console.error)
