import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider } from '../services/llm/llm.interface';

export class GeminiProvider implements LLMProvider {
  private model;

  constructor() {
    const genAI = new GoogleGenerativeAI(process.env.LLM_API_KEY!);

    this.model = genAI.getGenerativeModel({
      model: process.env.LLM_MODEL || 'gemini-2.0-flash',
    });
  }

  async extract(base64: string, mimeType: string, prompt: string) {
    const result = await this.model.generateContent([
      {
        inlineData: {
          data: base64,
          mimeType,
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    return response.text();
  }

  async generateText(prompt: string) {
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }
}