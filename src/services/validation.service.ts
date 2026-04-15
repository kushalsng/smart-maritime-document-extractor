import { Extraction, ValidationResult } from "../types/extraction.types";
import { buildValidationPrompt, safeParse } from "../util/prompt-builder";
import { llmExecutor } from "./llm.service";

export const runValidationLLM = async (
  documents: Extraction[],
): Promise<{result: ValidationResult, raw: string}> => {
  const prompt = buildValidationPrompt(documents);

  const raw = await llmExecutor(prompt, "text/plain"); // adapt for your LLM

  const parsed = await safeParse(raw);

  return { result: parsed, raw };
};