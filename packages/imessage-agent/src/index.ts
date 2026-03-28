import 'dotenv/config';
import { IMessageSDK } from '@photon-ai/imessage-kit';
import { processRecall } from './ai-stub.js';

// ─── Config ──────────────────────────────────────────────
const TRIGGER = process.env.RECALL_TRIGGER || 'recall';
const MAX_MESSAGES = parseInt(process.env.MAX_MESSAGES || '100');

// ─── Init ────────────────────────────────────────────────
const sdk = new IMessageSDK({ debug: true });

console.log('🧠 Recall Agent starting...');
console.log(`   Trigger: "${TRIGGER}"`);
console.log(`   Max messages: ${MAX_MESSAGES}\n`);

// ─── Core Handler ────────────────────────────────────────
async function handleMessage(message: any, isGroup: boolean) {
  const text = (message.text || '').toLowerCase().trim();
  if (!text.includes(TRIGGER)) return;

  const sender = message.sender || 'unknown';
  const chatType = isGroup ? 'Group' : 'DM';
  console.log(`\n📩 [${chatType}] Recall triggered by ${sender}`);

  try {
    // 1. ACK — let user know we're working
    await sdk.send(sender, '🧠 Recalling... give me a sec');

    // 2. Read chat history
    const history = await sdk.getMessages({ limit: MAX_MESSAGES });
    const messages = (history.messages || [])
      .filter((m: any) => m.text && m.text.length > 0)
      .map((m: any) => ({
        sender: m.sender || 'Unknown',
        text: m.text,
        date: m.date,
      }));

    console.log(`   📊 ${messages.length} messages fetched`);

    if (messages.length === 0) {
      await sdk.send(sender, 'No recent messages found to summarize.');
      return;
    }

    // 3. Determine mode
    const isQuick = text.includes('quick') || text.includes('tldr');

    // 4. Process through AI (teammate fills in ai-stub.ts → ai.ts)
    const response = await processRecall(messages, sender, isQuick);

    // 5. Send result back
    await sdk.send(sender, response);
    console.log('   ✅ Done');
  } catch (error) {
    console.error('   ❌ Error:', error);
    await sdk.send(sender, '😅 Something went wrong. Try again?');
  }
}

// ─── Watch ───────────────────────────────────────────────
await sdk.startWatching({
  onDirectMessage: (msg: any) => handleMessage(msg, false),
  onGroupMessage: (msg: any) => handleMessage(msg, true),
});

console.log('🟢 Recall is live!');
console.log('   "recall"       → full summary + action items + memory');
console.log('   "recall quick"  → TLDR only');
console.log('   Ctrl+C to stop\n');

process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down...');
  await sdk.close();
  process.exit(0);
});
