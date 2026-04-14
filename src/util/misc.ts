export const timeout = (ms: number) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('LLM timeout')), ms)
  );

export const buildError = (
  status: number,
  code: string,
  message: string,
  extractionId?: string,
) => {
  const err: any = new Error(message);
  err.status = status;
  err.code = code;
  err.extractionId = extractionId;
  return err;
};


const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
export const isUUID = (input?: string) => uuidRegex.test(input || '')


export const isRetryable = (errorCode?: string | null): boolean => {
  if (!errorCode) return true;

  const nonRetryableErrors = new Set([
    "UNSUPPORTED_FORMAT",
    "FILE_TOO_LARGE",
    "SESSION_NOT_FOUND",
  ]);

  return !nonRetryableErrors.has(errorCode);
}

export const normalizeStatus = (status?: string): 'APPROVED' | 'CONDITIONAL' | 'REJECTED' => {
  const allowed = new Set(['APPROVED', 'CONDITIONAL', 'REJECTED']);

  if (status && allowed.has(status)) return status as any;

  return 'CONDITIONAL'; // safe fallback
};

export const normalizeScore = (score?: number): number => {
  if (typeof score !== 'number') return 0;

  if (score < 0) return 0;
  if (score > 100) return 100;

  return Math.round(score);
};

export const groupBy = (arr: any[], key: string) => {
  return arr.reduce((acc, item) => {
    const val = item[key] || 'UNKNOWN';
    acc[val] = acc[val] || [];
    acc[val].push(item);
    return acc;
  }, {});
};