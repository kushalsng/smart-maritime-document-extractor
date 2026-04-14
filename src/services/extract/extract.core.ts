import { getExtractionByHash } from '../../repositories/extraction.repository';
import { llmExecutor } from '../llmExecutor';
import { safeParse } from '../safeParse';

export const runExtractionCore = async ({
  base64,
  mimeType,
  hash,
  sessionId,
}: {
  base64: string;
  mimeType: string;
  hash: string;
  sessionId: string;
}) => {
  const existing = await getExtractionByHash(hash, sessionId);

  if (existing) {
    return {
      type: 'DEDUP',
      extraction: existing,
    };
  }

  const raw = await llmExecutor(base64, mimeType);

  const parsed = await safeParse(raw);

  return {
    type: 'NEW',
    raw,
    parsed,
  };
};