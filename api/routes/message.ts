import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { summarizeContent } from '../services/llm.js';
import { createNotionPage } from '../services/notion.js';

const router = Router();

router.post('/message', async (req, res) => {
  const { userId, type, content } = req.body;

  if (!userId || !type || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 1. Insert initial item
  const { data: insertData, error: insertError } = await supabase
    .from('knowledge_items')
    .insert({ user_id: userId, original_content_url: content, summary: 'Summarizing...' })
    .select()
    .single();

  if (insertError) {
    console.error('Error inserting item:', insertError);
    return res.status(500).json({ error: insertError.message });
  }

  // 2. Summarize content
  const summary = await summarizeContent(content);
  if (!summary) {
    // Update item to reflect summarization failure
    await supabase.from('knowledge_items').update({ summary: 'Failed to summarize.' }).eq('id', insertData.id);
    return res.status(500).json({ error: 'Failed to summarize content' });
  }

  // 3. Update item with summary
  let { data: summarizedData, error: summaryError } = await supabase
    .from('knowledge_items')
    .update({ summary })
    .eq('id', insertData.id)
    .select()
    .single();

  if (summaryError) {
    console.error('Error updating summary:', summaryError);
    return res.status(500).json({ error: summaryError.message });
  }

  // 4. Get user's Notion credentials
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('notion_token, notion_database_id')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    console.error('Error fetching user for Notion sync:', userError);
    return res.json({ status: 'success', message: 'Message summarized but Notion not configured', data: summarizedData });
  }

  // 5. Create Notion page if configured
  if (user.notion_token && user.notion_database_id) {
    const notionPageId = await createNotionPage(user.notion_token, user.notion_database_id, content, summary);

    if (notionPageId) {
      // 6. Update item with Notion page ID
      const { data: finalData, error: notionUpdateError } = await supabase
        .from('knowledge_items')
        .update({ notion_page_id: notionPageId })
        .eq('id', summarizedData.id)
        .select()
        .single();

      if (notionUpdateError) {
        console.error('Error updating with Notion ID:', notionUpdateError);
        // Continue to return success, as the core task is done
        return res.json({ status: 'success', message: 'Message summarized, but failed to link Notion page', data: summarizedData });
      } else {
        return res.json({ status: 'success', message: 'Message processed and saved to Notion', data: finalData });
      }
    }
  }

  res.json({ status: 'success', message: 'Message summarized, Notion not configured', data: summarizedData });
});

export default router;

