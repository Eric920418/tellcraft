import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const conversationId = '21fa87ee-a349-4cbb-ac36-4c94dc76e44e'
  
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log('=== CONVERSATION ===')
  console.log(JSON.stringify(data, null, 2))
}

main()
