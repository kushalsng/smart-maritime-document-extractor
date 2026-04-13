import OpenAI from 'openai';
import { LLMProvider } from '../services/llm/llm.interface';

export class OpenAIProvider implements LLMProvider {
  private client = new OpenAI({
    apiKey: process.env.LLM_API_KEY,
  });

  async extract(base64: string, mimeType: string, prompt: string) {
    const res = await this.client.chat.completions.create({
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            },
          ],
        },
      ],
    });

    return res.choices[0].message.content || '';
  }

  async generateText(prompt: string) {
    const res = await this.client.chat.completions.create({
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    return res.choices[0].message.content || '';
  }
}