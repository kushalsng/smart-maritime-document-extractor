import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider } from '../services/llm/llm.interface';
import { TextBlock } from '@anthropic-ai/sdk/resources.js';

type MimeType  ="image/jpeg" | "image/png" | "image/gif" | "image/webp"

export class AnthropicProvider implements LLMProvider {
  private client = new Anthropic({
    apiKey: process.env.LLM_API_KEY,
  });

  async extract(base64: string, mimeType: MimeType, prompt: string) {
    const res = await this.client.messages.create({
      model: process.env.LLM_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    return (res.content[0] as TextBlock).text;
  }

  async generateText(prompt: string) {
    const res = await this.client.messages.create({
      model: process.env.LLM_MODEL!,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    return (res.content[0] as TextBlock).text;
  }
}