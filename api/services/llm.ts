import OpenAI from 'openai';

const openai = new OpenAI();

export async function summarizeContent(content: string): Promise<string | null> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes text. Provide a concise summary of the following content:',
        },
        {
          role: 'user',
          content,
        },
      ],
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error summarizing content:', error);
    return null;
  }
}
