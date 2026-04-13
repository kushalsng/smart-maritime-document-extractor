import fetch from 'node-fetch';
import { LLMProvider } from '../services/llm/llm.interface';

export class OllamaProvider implements LLMProvider {
  async extract(base64: string, mimeType: string, prompt: string) {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'llava',
        prompt,
        images: [base64],
        stream: false,
      }),
    });

    const data: any = await res.json();
    return data.response;
  }

  async generateText(prompt: string) {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        model: process.env.LLM_MODEL,
        prompt,
        stream: false,
      }),
    });

    const data: any = await res.json();
    return data.response;
  }
}