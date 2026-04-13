export const timeout = (ms: number) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('LLM timeout')), ms)
  );