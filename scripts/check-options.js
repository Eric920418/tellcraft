const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const conversationId = 'ee019a80-b564-4b54-b56c-5c6c20420a3c';

  const { data: session } = await supabase
    .from('bdd_sessions')
    .select('*')
    .eq('conversation_id', conversationId)
    .single();

  if (!session) {
    console.log('Session not found');
    return;
  }

  console.log('=== Pending Questions with Options ===\n');

  const allItems = [
    ...(session.clarify_items || []),
    ...(session.staging_items || []),
  ];

  allItems.slice(0, 5).forEach((item, i) => {
    console.log(`${i + 1}. ${(item.whiteTextQuestion || item.question).substring(0, 60)}...`);
    console.log('   Options:', JSON.stringify(item.options, null, 2));
    console.log('');
  });
}

check().catch(console.error);
