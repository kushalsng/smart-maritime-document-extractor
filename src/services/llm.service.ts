import { safeParse } from '../util/prompt-builder';
import { createLLMProvider } from './llm/llm.factory';

const getProvider = () => createLLMProvider();

export const callLLM = async (
  base64: string,
  mimeType: string,
  fileName?: string
) => {
  const provider = getProvider();
  const raw = await withTimeout(() =>
    provider.extract(base64, mimeType, buildPrompt())
  );

  const parsed = await safeParse(raw);

  if (parsed?.detection?.confidence === 'LOW') {
    const retryRaw = await provider.extract(
      base64,
      mimeType,
      buildRetryPrompt(fileName, mimeType)
    );

    return safeParse(retryRaw);
  }

  return parsed;
};