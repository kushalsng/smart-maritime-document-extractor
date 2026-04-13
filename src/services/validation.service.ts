import { buildValidationPrompt, safeParse } from '../util/prompt-builder';
import { llmExecutor } from './llm.service';

export const runValidationLLM = async (documents: any[]) => {
  const prompt = buildValidationPrompt(documents);

  const raw = await llmExecutor(prompt, 'text/plain'); // adapt for your LLM

  const parsed = safeParse(raw);

  return parsed;
};