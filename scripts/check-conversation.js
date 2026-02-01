const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const conversationId = 'a3c6f705-e3e2-4d29-ba32-f0e292cb1d45';

  // Check BDD session
  const { data: session } = await supabase
    .from('bdd_sessions')
    .select('*')
    .eq('conversation_id', conversationId)
    .single();

  if (!session) {
    console.log('Session not found');
    return;
  }

  console.log('=== BDD Session Status ===');
  console.log('Phase:', session.current_phase);
  console.log('Round:', session.current_round);
  console.log('');
  console.log('=== Item Counts ===');
  console.log('Pending (clarifyItems):', session.clarify_items?.length || 0);
  console.log('Staging:', session.staging_items?.length || 0);
  console.log('Resolved:', session.resolved_items?.length || 0);
  console.log('');

  // Show pending items
  if (session.clarify_items?.length > 0) {
    console.log('=== Pending Questions ===');
    session.clarify_items.forEach((item, i) => {
      console.log(`${i + 1}. [${item.status}] ${(item.whiteTextQuestion || item.question).substring(0, 80)}`);
    });
  }

  // Check tasks
  const { data: conversation } = await supabase
    .from('conversations')
    .select('project_id')
    .eq('id', conversationId)
    .single();

  if (conversation) {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, status, skill, created_at, updated_at')
      .eq('project_id', conversation.project_id)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('');
    console.log('=== Recent Tasks ===');
    tasks?.forEach(t => {
      console.log(`- ${t.id.substring(0, 8)}... | ${t.status} | ${t.skill} | updated: ${t.updated_at}`);
    });
  }

  // Check last few messages
  const { data: conv } = await supabase
    .from('conversations')
    .select('messages')
    .eq('id', conversationId)
    .single();

  if (conv?.messages) {
    console.log('');
    console.log('=== Last 5 Messages ===');
    const lastMessages = conv.messages.slice(-5);
    lastMessages.forEach((m, i) => {
      console.log(`${i + 1}. [${m.role}] ${m.content.substring(0, 100)}...`);
    });
  }
}

check().catch(console.error);
