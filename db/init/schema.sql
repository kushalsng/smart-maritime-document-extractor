
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE extractions (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id),

  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL,

  document_type TEXT,
  applicable_role TEXT,
  confidence TEXT,

  holder_name TEXT,
  date_of_birth TEXT,
  sirb_number TEXT,
  passport_number TEXT,

  fields_json JSONB,
  validity_json JSONB,
  medical_data_json JSONB,
  flags_json JSONB,

  is_expired BOOLEAN DEFAULT false,

  summary TEXT,
  raw_llm_response TEXT,

  processing_time_ms INTEGER,

  status TEXT DEFAULT 'COMPLETE',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  extraction_id UUID REFERENCES extractions(id),

  status TEXT DEFAULT 'QUEUED',
  error_code TEXT,
  error_message TEXT,

  queued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  webhook_url TEXT
);


CREATE TABLE validations (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id),
  result_json JSONB NOT NULL,
  raw_llm_response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_extractions_session ON extractions(session_id);
CREATE INDEX idx_extractions_hash ON extractions(file_hash);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_session ON jobs(session_id);
