/**
 * ======================================
 * 🔌 AI STUB — 队友负责替换这个文件
 * ======================================
 *
 * 接口已经定好:
 *   processRecall(messages, sender, isQuick) → string
 *
 * 队友需要:
 *   1. npm install openai
 *   2. .env 加 MINIMAX_API_KEY=xxx
 *   3. 把这个文件改成真正调 MiniMax API 的版本
 *
 * David 这边 iMessage pipeline 不用动
 */

export interface ChatMessage {
  sender: string;
  text: string;
  date?: string | Date;
}

/**
 * Process a recall request
 * @param messages - chat history from iMessage
 * @param sender - who triggered the recall
 * @param isQuick - true = TLDR only, false = full recall
 * @returns formatted response string to send back via iMessage
 */
export async function processRecall(
  messages: ChatMessage[],
  sender: string,
  isQuick: boolean
): Promise<string> {
  // ─── STUB: 返回假数据，验证 pipeline 通了 ───
  const msgCount = messages.length;
  const senders = [...new Set(messages.map((m) => m.sender))];
  const latest = messages.slice(-3);

  if (isQuick) {
    return [
      '🧠 Quick Recall (stub mode)',
      '',
      `📊 ${msgCount} messages from ${senders.length} people`,
      '',
      '最近 3 条:',
      ...latest.map((m) => `  ${m.sender}: ${m.text.slice(0, 40)}...`),
      '',
      '⚠️ This is stub data — waiting for MiniMax integration',
    ].join('\n');
  }

  return [
    '🧠 RECALL (stub mode)',
    '',
    `📋 Summary:`,
    `  ${msgCount} messages from: ${senders.join(', ')}`,
    '',
    '✅ Action Items:',
    '  → [stub] Connect MiniMax API for real summaries',
    '',
    '💭 Memory:',
    '  [stub] Will recall past mentions once AI is connected',
    '',
    '⚠️ Stub mode — AI integration pending',
  ].join('\n');
}
