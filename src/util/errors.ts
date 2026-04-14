export class LLMTimeoutError extends Error {
  retryable = true;

  constructor() {
    super('LLM_TIMEOUT');
    this.name = 'LLMTimeoutError';
  }
}