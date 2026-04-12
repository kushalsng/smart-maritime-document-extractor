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

  fields_json: any;
  validity_json: any;
  medical_data_json: any;
  flags_json: any[];

  is_expired: boolean;

  summary: string | null;
  raw_llm_response: string;

  processing_time_ms: number | null;
  status: string;

  created_at: string;
}