require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sendRecoveryMessage() {
  const conversationId = process.argv[2] || '04320109-7c31-4170-b016-90b4e1bb10d7';

  const { data: conv, error } = await supabase
    .from('conversations')
    .select('messages')
    .eq('id', conversationId)
    .single();

  if (error || !conv) {
    console.log('Conversation not found:', error?.message);
    return;
  }

  const message = {
    id: require('crypto').randomUUID(),
    role: 'assistant',
    content: '抱歉讓你久等了！系統剛完成更新。\n\n由於系統升級，請重新開始一個新對話來體驗完整的設計流程。你可以輸入一樣的需求，我會引導你選擇模板並預覽設計。',
    timestamp: new Date().toISOString(),
    stage: 'system_recovery'
  };

  const { error: updateError } = await supabase
    .from('conversations')
    .update({
      messages: [...conv.messages, message],
      spec_complete: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId);

  if (updateError) {
    console.log('Update error:', updateError.message);
  } else {
    console.log('Recovery message sent to conversation:', conversationId);
  }
}

sendRecoveryMessage();
