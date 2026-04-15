import {
  buildExtractionPrompt,
  buildRetryPrompt,
  safeParseRawPrompt,
} from "../util/prompt-builder";
import { timeout } from "../util/misc";
import { getLLMProvider } from "../providers/llm.provider.instance";
import { MimeType } from "../types/extraction.types";

const LLM_TIMEOUT_MS = 30_000;

const withTimeout = async <T>(operation: Promise<T>) =>
  Promise.race([operation, timeout(LLM_TIMEOUT_MS)]) as Promise<T>;

export const llmExecutor = async (
  prompt: string,
  mimeType: MimeType,
  fileName?: string
) => {
  const provider = getLLMProvider();
  if (mimeType === 'text/plain') {
    return withTimeout(provider.generateText(prompt));
  }

  const raw = await withTimeout(
    provider.extract(prompt, mimeType, buildExtractionPrompt())
  );

  const parsed = await safeParseRawPrompt(raw);

  if (parsed?.detection?.confidence === 'LOW') {
    const retryRaw = await withTimeout(
      provider.extract(
        prompt,
        mimeType,
        buildRetryPrompt(raw, mimeType, fileName)
      )
    );

    return retryRaw;
  }

  return raw;
};
