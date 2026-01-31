const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const conversationId = '516bff66-d430-4f1a-b8a7-3ba1e21616f5';

  const { data: session } = await supabase
    .from('bdd_sessions')
    .select('*')
    .eq('conversation_id', conversationId)
    .single();

  if (!session) {
    console.log('Session not found');
    return;
  }

  console.log('=== Session Status ===');
  console.log('Phase:', session.current_phase);
  console.log('Round:', session.current_round);
  console.log('Consecutive Empty:', session.consecutive_empty_rounds);
  console.log('');
  console.log('=== Item Counts ===');
  console.log('Pending:', session.clarify_items?.length || 0);
  console.log('Staging:', session.staging_items?.length || 0);
  console.log('Resolved:', session.resolved_items?.length || 0);
  console.log('Total:', (session.clarify_items?.length || 0) + (session.staging_items?.length || 0) + (session.resolved_items?.length || 0));
  console.log('');

  const allItems = [
    ...(session.clarify_items || []),
    ...(session.staging_items || []),
    ...(session.resolved_items || [])
  ];

  // Check duplicates by prefix
  const prefixCounts = {};
  allItems.forEach(item => {
    const q = (item.whiteTextQuestion || item.question || '').substring(0, 40);
    prefixCounts[q] = (prefixCounts[q] || 0) + 1;
  });

  console.log('=== Duplicates (same 40-char prefix) ===');
  Object.entries(prefixCounts)
    .filter(e => e[1] > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(e => console.log(e[1] + 'x:', e[0] + '...'));

  console.log('');
  console.log('=== Pending Questions (all) ===');
  (session.clarify_items || []).forEach((item, i) => {
    console.log((i+1) + '.', (item.whiteTextQuestion || item.question).substring(0, 100));
  });
}

check().catch(console.error);
