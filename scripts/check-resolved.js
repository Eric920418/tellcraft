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

  const resolved = session.resolved_items || [];

  console.log('=== Resolved Questions (' + resolved.length + ') ===\n');

  // Group by keywords to find semantic duplicates
  const keywords = {};

  resolved.forEach((item, i) => {
    const q = item.whiteTextQuestion || item.question;
    console.log((i+1) + '. ' + q.substring(0, 80));
    console.log('   答: ' + (item.answer || '').substring(0, 50));
    console.log('');

    // Extract keywords
    const words = q.match(/[\u4e00-\u9fff]+/g) || [];
    words.forEach(w => {
      if (w.length >= 2) {
        if (!keywords[w]) keywords[w] = [];
        keywords[w].push(i + 1);
      }
    });
  });

  console.log('\n=== High-frequency keywords ===');
  Object.entries(keywords)
    .filter(e => e[1].length >= 3)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 15)
    .forEach(e => console.log(e[0] + ':', e[1].length + '次, 題號:', e[1].join(',')));
}

check().catch(console.error);
