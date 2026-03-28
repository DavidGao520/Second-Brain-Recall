import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { extractContent } from '../services/llm.js';
import { createNotionPage } from '../services/notion.js';

const router = Router();

router.post('/message', async (req, res) => {
  const { userId, type, content, source_type = 'text' } = req.body;

  if (!userId || !type || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 1. Insert initial item with placeholder summary
  const { data: insertData, error: insertError } = await supabase
    .from('knowledge_items')
    .insert({
      user_id: userId,
      original_content_url: content,
      summary: 'Summarizing...',
      source_type,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error inserting item:', insertError);
    return res.status(500).json({ error: insertError.message });
  }

  // 2. Extract structured content via MiniMax
  const extraction = await extractContent(content);
  if (!extraction) {
    await supabase
      .from('knowledge_items')
      .update({ summary: 'Failed to extract content.' })
      .eq('id', insertData.id);
    return res.status(500).json({ error: 'Failed to extract content' });
  }

  // 3. Update item with all structured fields
  let { data: extractedData, error: extractError } = await supabase
    .from('knowledge_items')
    .update({
      summary: extraction.summary,
      category: extraction.category,
      location_city: extraction.location.city,
      location_name: extraction.location.specific_name,
      action_items: extraction.action_items,
      source_context: extraction.source_context,
    })
    .eq('id', insertData.id)
    .select()
    .single();

  if (extractError) {
    console.error('Error updating extraction:', extractError);
    return res.status(500).json({ error: extractError.message });
  }

  // 4. Get user's Notion credentials
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('notion_token, notion_database_id')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return res.json({ status: 'success', message: 'Message extracted, Notion not configured', data: extractedData });
  }

  // 5. Create Notion page if configured
  if (user.notion_token && user.notion_database_id) {
    const notionPageId = await createNotionPage(
      user.notion_token,
      user.notion_database_id,
      content,
      extraction.summary,
    );

    if (notionPageId) {
      const { data: finalData, error: notionUpdateError } = await supabase
        .from('knowledge_items')
        .update({ notion_page_id: notionPageId })
        .eq('id', extractedData.id)
        .select()
        .single();

      if (notionUpdateError) {
        return res.json({ status: 'success', message: 'Extracted, but failed to link Notion page', data: extractedData });
      }
      return res.json({ status: 'success', message: 'Extracted and saved to Notion', data: finalData });
    }
  }

  res.json({ status: 'success', message: 'Message extracted, Notion not configured', data: extractedData });
});

export default router;
