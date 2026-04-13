import { GeminiProvider } from '../../providers/gemini.provider';
import { OpenAIProvider } from '../../providers/openai.provider';
import { AnthropicProvider } from '../../providers/anthropic.provider';
import { GroqProvider } from '../../providers/groq.provider';
import { MistralProvider } from '../../providers/mistral.provider';
import { OllamaProvider } from '../../providers/ollama.provider';

export const createLLMProvider = () => {
  switch (process.env.LLM_PROVIDER) {
    case 'gemini':
      return new GeminiProvider();
    case 'openai':
      return new OpenAIProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'groq':
      return new GroqProvider();
    case 'mistral':
      return new MistralProvider();
    case 'ollama':
      return new OllamaProvider();
    default:
      throw new Error('Unsupported LLM provider');
  }
};