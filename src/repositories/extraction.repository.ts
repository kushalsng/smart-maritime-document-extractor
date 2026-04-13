import { pool } from "../config/db";
import { v4 as uuidv4 } from "uuid";
import { Extraction } from "../types/extraction.types";

export interface CreateExtractionInput {
  session_id: string;
  file_name: string;
  file_hash: string;
  raw_llm_response: string;
  status?: string;

  document_type?: string | null;
  applicable_role?: string | null;
  holder_name?: string | null;
  date_of_birth?: string | null;
  sirb_number?: string | null;
  passport_number?: string | null;

  confidence?: string | null;

  fields_json?: Record<string, any>[]; // can refine later
  validity_json?: Record<string, any>;
  medical_data_json?: Record<string, any>;
  flags_json?: Record<string, any>[];

  is_expired?: boolean;
  summary?: string;

  processing_time_ms?: number;
}

export const createExtraction = async (data: CreateExtractionInput) => {
  const id = uuidv4();

  const query = `
  INSERT INTO extractions (
    id,
    session_id,
    file_name,
    file_hash,
    raw_llm_response,
    status,
    document_type,
    applicable_role,
    holder_name,

    date_of_birth,
    sirb_number,
    passport_number,

    confidence,
    fields_json,
    validity_json,
    medical_data_json,
    flags_json,
    is_expired,
    summary,
    processing_time_ms
  )
  VALUES (
    $1,$2,$3,$4,$5,$6,
    $7,$8,$9,
    $10,$11,$12,
    $13,$14,$15,$16,
    $17,$18,$19,$20
  )
  RETURNING *;
`;

  const values = [
    id,
    data.session_id,
    data.file_name,
    data.file_hash,
    data.raw_llm_response,
    data.status || "COMPLETE",

    data.document_type ?? null,
    data.applicable_role ?? null,
    data.holder_name ?? null,

    data.date_of_birth ?? null,
    data.sirb_number ?? null,
    data.passport_number ?? null,

    data.confidence ?? null,

    JSON.stringify(data.fields_json) ?? {},
    data.validity_json ?? {},
    data.medical_data_json ?? {},
    JSON.stringify(data.flags_json) ?? {},

    data.is_expired ?? false,
    data.summary ?? null,
    data.processing_time_ms ?? null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const findExtractionByHashAndSession = async (
  fileHash: string,
  sessionId: string,
): Promise<Extraction | null> => {
  const query = `
    SELECT * FROM extractions
    WHERE file_hash = $1 AND session_id = $2
    LIMIT 1;
  `;

  const result = await pool.query(query, [fileHash, sessionId]);
  return result.rows[0];
};

export const getExtractionsBySession = async (
  sessionId: string,
): Promise<Extraction[]> => {
  const res = await pool.query(
    `SELECT * FROM extractions WHERE session_id = $1 ORDER BY created_at DESC`,
    [sessionId],
  );

  return res.rows || [];
};

export const getExtractionById = async (
  id: string,
): Promise<Extraction | null> => {
  const result = await pool.query(
    `SELECT * FROM extractions WHERE id = $1 LIMIT 1`,
    [id],
  );

  return result.rows[0] || null;
};
