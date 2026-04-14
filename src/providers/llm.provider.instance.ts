import { createLLMProvider } from "../services/llm/llm.factory";

let instance: ReturnType<typeof createLLMProvider> | null = null;

export const getLLMProvider = () => {
  if (!instance) {
    instance = createLLMProvider();
  }
  return instance;
};