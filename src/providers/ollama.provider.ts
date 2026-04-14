import fetch from 'node-fetch';
import { LLMProvider } from '../services/llm/llm.interface';

export class OllamaProvider implements LLMProvider {
  private baseUrl = 'http://localhost:11434';

  async extract(base64: string, mimeType: string, prompt: string) {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'llava',
        prompt,
        images: [base64],
        stream: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ollama error: ${text}`);
    }

    const data: any = await res.json();

    return data.response; // raw text (may include JSON + noise)
  }

  async generateText(prompt: string) {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'llava',
        prompt,
        stream: false,
      }),
    });

    const data: any = await res.json();
    return data.response;
  }
}