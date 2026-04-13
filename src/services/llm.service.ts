import { buildExtractionPrompt, buildRetryPrompt, safeParse } from '../util/prompt-builder';
import { createLLMProvider } from './llm/llm.factory';
import { timeout } from '../util/misc';

const getProvider = () => createLLMProvider();
const LLM_TIMEOUT_MS = 60_000;

const withTimeout = async <T>(operation: Promise<T>) =>
  Promise.race([operation, timeout(LLM_TIMEOUT_MS)]) as Promise<T>;

export const llmExecutor = async (
  base64: string,
  mimeType: string,
  fileName?: string
) => {
  const provider = getProvider();
  if (mimeType === 'text/plain') {
    return withTimeout(provider.generateText(base64));
  }

  const raw = await withTimeout(
    provider.extract(base64, mimeType, buildExtractionPrompt())
  );

  const parsed = await safeParse(raw);

  if (parsed?.detection?.confidence === 'LOW') {
    const retryRaw = await withTimeout(
      provider.extract(
        base64,
        mimeType,
        buildRetryPrompt(mimeType, fileName)
      )
    );

    return retryRaw;
  }

  return raw;
};

export const callLLM = llmExecutor;
