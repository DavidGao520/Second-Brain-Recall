/**
 * Test 1: 验证 iMessage SDK 能读到消息
 *
 * 前置条件:
 *   System Settings → Privacy & Security → Full Disk Access → 加上你的终端
 *
 * Run: npm run test:imessage
 */
import { IMessageSDK } from '@photon-ai/imessage-kit';

const sdk = new IMessageSDK({ debug: true });

console.log('🧪 Test: 读取 iMessage 消息\n');

try {
  // 1. 列出最近的聊天
  const chats = await sdk.listChats();
  console.log(`✅ 找到 ${chats.length} 个对话`);
  chats.slice(0, 5).forEach((chat: any, i: number) => {
    console.log(`   ${i + 1}. ${chat.displayName || chat.chatIdentifier || 'unknown'}`);
  });

  // 2. 读取最近消息
  console.log('');
  const result = await sdk.getMessages({ limit: 10 });
  const msgs = result.messages || [];
  console.log(`✅ 读到 ${msgs.length} 条最近消息`);
  msgs.slice(0, 5).forEach((msg: any) => {
    const preview = (msg.text || '[非文字]').slice(0, 60);
    console.log(`   [${msg.sender || '?'}] ${preview}`);
  });

  console.log('\n🎉 iMessage 读取正常！');
} catch (err: any) {
  console.error('❌ 失败:', err.message);
  if (err.message?.includes('permission') || err.message?.includes('access')) {
    console.error('   → 需要开 Full Disk Access');
  }
} finally {
  await sdk.close();
}
