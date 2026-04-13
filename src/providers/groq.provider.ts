import Groq from 'groq-sdk';
import { LLMProvider } from '../services/llm/llm.interface';

export class GroqProvider implements LLMProvider {
  private client = new Groq({
    apiKey: process.env.LLM_API_KEY,
  });

  async extract(base64: string, mimeType: string, prompt: string) {
    const combinedPrompt = `
      ${prompt}

      NOTE:
      The document is provided as base64 below.

      Base64:
      ${base64} 
      `;
    const res = await this.client.chat.completions.create({
      model: process.env.LLM_MODEL || 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'user',
          content: combinedPrompt,
        },
      ],
    });

    return res.choices[0].message.content || '';
  }

  async generateText(prompt: string) {
    const res = await this.client.chat.completions.create({
      model: process.env.LLM_MODEL!,
      messages: [{ role: 'user', content: prompt }],
    });

    return res.choices[0].message.content || '';
  }
}