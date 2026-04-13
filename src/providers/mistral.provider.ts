import { Mistral } from '@mistralai/mistralai';
import { LLMProvider } from '../services/llm/llm.interface';

export class MistralProvider implements LLMProvider {
  private client = new Mistral({
    apiKey: process.env.LLM_API_KEY!,
  });

  async extract(base64: string, mimeType: string, prompt: string) {
    const res = await this.client.chat.complete({
      model: process.env.LLM_MODEL || 'pixtral-12b-2409',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: `data:${mimeType};base64,${base64}`,
            },
          ],
        },
      ],
    });

    return res.choices[0].message.content as string;
  }

  async generateText(prompt: string) {
    const res = await this.client.chat.complete({
      model: process.env.LLM_MODEL!,
      messages: [{ role: 'user', content: prompt }],
    });

    return res.choices[0].message.content as string;
  }
}