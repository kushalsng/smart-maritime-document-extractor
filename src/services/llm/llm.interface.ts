

export interface LLMProvider {
  extract(
    base64: string,
    mimeType: string,
    prompt: string
  ): Promise<string>;

  generateText(prompt: string): Promise<string>;
}