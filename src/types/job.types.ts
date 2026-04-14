export type JobStatus =
  'QUEUED'
  | 'PROCESSING'
  | 'COMPLETE'
  | 'FAILED';

export interface ExtractJobData {
  jobId: string;
  sessionId: string;
  filePath: string;
  mimeType: string;
  fileName: string;
  fileHash: string;
}