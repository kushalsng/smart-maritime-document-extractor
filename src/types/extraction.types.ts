
export interface Session {
  id: string;
  created_at: Date;
}

export interface Extraction {
  id: string;
  session_id: string;

  file_name: string;
  file_hash: string;

  document_type: string | null;
  applicable_role: string | null;
  confidence: string | null;

  holder_name: string | null;
  date_of_birth: string | null;
  sirb_number: string | null;
  passport_number: string | null;

  fields_json: Record<string, any>[] | null;
  validity_json: Record<string, any> | null;
  medical_data_json: Record<string, any> | null;
  flags_json: Record<string, any>[] | null;

  is_expired: boolean;

  summary: string | null;
  raw_llm_response: string;

  processing_time_ms: number | null;

  status: string;

  created_at: Date;
}

export type JobStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETE'
  | 'FAILED';

export interface Job {
  id: string;
  session_id: string | null;
  extraction_id: string | null;

  status: JobStatus;

  error_code: string | null;
  error_message: string | null;

  queued_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
}

export interface Validation {
  id: string;
  session_id: string;

  result_json: Record<string, any>;

  created_at: Date;
}

export interface ExtractJobData {
  jobId: string;
  session: Session;
  filePath: string;
  mimeType: string;
  fileName: string;
  fileHash: string;
}