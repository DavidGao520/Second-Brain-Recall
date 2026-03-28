import { parseExtraction, type ExtractionResult } from './extract.js';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID;
const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL ?? 'https://api.minimax.chat/v1';

const SYSTEM_PROMPT = `You are a knowledge extraction engine. When given any text (chat logs, links, notes, or descriptions), extract structured information and return ONLY valid JSON matching this exact schema:

{
  "summary": "Short 2-sentence summary of the content.",
  "category": "Food | Events | Sports | Ideas | Medical",
  "location": {
    "city": "city name or null",
    "specific_name": "venue/place name or null"
  },
  "action_items": [
    { "task": "action to take", "owner": "who should do it" }
  ],
  "source_context": "The key original text snippet or description."
}

Rules:
- category must be exactly one of: Food, Events, Sports, Ideas, Medical
- location fields are null if no location is mentioned
- action_items is [] if no actions are implied
- Return ONLY the JSON object, no markdown, no explanation`;

export async function extractContent(content: string): Promise<ExtractionResult | null> {
  if (!MINIMAX_API_KEY) {
    console.error('MINIMAX_API_KEY is not set');
    return null;
  }

  const url = MINIMAX_GROUP_ID
    ? `${MINIMAX_BASE_URL}/text/chatcompletion_v2?GroupId=${MINIMAX_GROUP_ID}`
    : `${MINIMAX_BASE_URL}/text/chatcompletion_v2`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MiniMax API error:', response.status, errorText);
      return null;
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const raw = JSON.parse(data.choices[0].message.content);
    return parseExtraction(raw);
  } catch (error) {
    console.error('Error calling MiniMax API:', error);
    return null;
  }
}
