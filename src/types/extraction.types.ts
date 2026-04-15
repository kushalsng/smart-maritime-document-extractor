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

  fields_json: Field[];

  validity_json: Validity;

  medical_data_json: MedicalData;

  flags_json: Flag[];

  is_expired: boolean;

  summary: string | null;
  raw_llm_response: string;

  processing_time_ms: number | null;

  status: string;
  prompt_version: string | null;

  created_at: Date;
}

export type Field = {
  key: string;
  label: string;
  value: string | null;
  importance: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OK" | "MISSING" | "INVALID";
}

export type Validity = {
  dateOfIssue: string | null;
  dateOfExpiry: string | null;
  isExpired: boolean;
  daysUntilExpiry: number | null;
  revalidationRequired: boolean | null;
}
export type MedicalData = {
  fitnessResult: string | null;
  drugTestResult: string | null;
  restrictions: string | null;
  specialNotes: string | null;
  expiryDate: string | null;
}

export type Flag = {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
}

export type JobStatus = "QUEUED" | "PROCESSING" | "COMPLETE" | "FAILED";

export interface Job {
  id: string;
  session_id: string | null;
  extraction_id: string | null;

  status: JobStatus;

  error_code: string | null;
  error_message: string | null;

  webhook_url: string | null;

  queued_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
}

export interface Validation {
  id: string;
  session_id: string;

  result_json: Record<string, ValidationResult>;

  created_at: Date;
}

export type Status = 'APPROVED' | 'CONDITIONAL' | 'REJECTED'

export interface ExtractJobData {
  jobId: string;
  session: Session;
  filePath: string;
  mimeType: string;
  fileName: string;
  fileHash: string;
  webhookUrl?: string;
}

export interface ExtractionResponse {
  id: string;
  sessionId: string;
  fileName: string;

  documentType: string | null;
  documentName: string | null;
  applicableRole: string | null;
  category: string | null;
  confidence: "LOW" | "MEDIUM" | "HIGH" | null;

  holderName: string | null;
  dateOfBirth: string | null;
  sirbNumber: string | null;
  passportNumber: string | null;

  fields: Field[];

  validity: Validity;

  compliance: Compliance;

  medicalData: MedicalData;

  flags: Flag[];

  isExpired: boolean;

  processingTimeMs: number;

  summary: string | null;

  createdAt: string;
}

export type Compliance = {
  issuingAuthority: string | null;
  regulationReference: string | null;
  imoModelCourse: string | null;
  recognizedAuthority: boolean | null;
  limitations: string | null;
};
export interface ValidationResult {
  holderProfile: HolderProfile;
  consistencyChecks: ConsistencyCheck[];
  missingDocuments: MissingDocument[];
  expiringDocuments: ExpiringDocument[];
  medicalFlags: Flag[];
  overallStatus: 'APPROVED' | 'CONDITIONAL' | 'REJECTED';
  overallScore: number;
  summary: string;
  recommendations: Recommendation[];
}
export type Recommendation = {
  action: 'REQUIRED' | 'URGENT' | 'RECOMMENDED';
  item: string;
}
export type ExpiringDocument = {
  documentType: string;
  expiryDate: string | null;
  daysRemaining: string | number | null;
}
export type MissingDocument = {
  documentType: string;
  reason: string;
  importance?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}
export type ConsistencyCheck = {
  field: string;
  status: 'CONSISTENT' | 'INCONSISTENT';
  details: string;
}
export type HolderProfile = {
  fullName: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  detectedRole: string | null;
}
