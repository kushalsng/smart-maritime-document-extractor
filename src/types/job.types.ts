export type JobStatus =
  'QUEUED'
  | 'PROCESSING'
  | 'COMPLETE'
  | 'FAILED';

export interface ExtractJobData {
  jobId: string;
  sessionId: string;
  fileBase64: string;
  mimeType: string;
  fileName: string;
  fileHash: string;
}