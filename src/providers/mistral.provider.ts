import { Mistral } from "@mistralai/mistralai";
import { LLMProvider } from "../services/llm/llm.interface";

export class MistralProvider implements LLMProvider {
  private client = new Mistral({
    apiKey: process.env.LLM_API_KEY!,
  });

  async extract(base64: string, mimeType: string, prompt: string) {
    const mergedPrompt = `
      ${prompt}

      NOTE:
      The document is provided as base64 below.

      Base64:
      ${base64} 
      `;
    const res = await this.client.chat.complete({
      model: process.env.LLM_MODEL || "pixtral-12b-2409",
      messages: [
        {
          role: "user",
          content: mergedPrompt,
        },
      ],
      responseFormat: {
        type: "text",
      },
    });

    return res?.choices?.[0]?.message?.content as string;
  }

  async generateText(prompt: string) {
    const res = await this.client.chat.complete({
      model: process.env.LLM_MODEL!,
      messages: [{ role: "user", content: prompt }],
    });

    return res?.choices?.[0]?.message?.content as string;
  }
}