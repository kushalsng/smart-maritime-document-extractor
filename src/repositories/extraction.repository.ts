import { pool } from '../config/db';
import { v4 as uuidv4 } from 'uuid';

export interface CreateExtractionInput {
  sessionId: string;
  fileName: string;
  fileHash: string;
  rawResponse: string;
  status?: string;
}

export const createExtraction = async (data: CreateExtractionInput) => {
  const id = uuidv4();

  const query = `
    INSERT INTO extractions (
      id, session_id, file_name, file_hash,
      raw_llm_response, status
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const values = [
    id,
    data.sessionId,
    data.fileName,
    data.fileHash,
    data.rawResponse,
    data.status || 'COMPLETE',
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const findByHashAndSession = async (
  fileHash: string,
  sessionId: string
) => {
  const query = `
    SELECT * FROM extractions
    WHERE file_hash = $1 AND session_id = $2
    LIMIT 1;
  `;

  const result = await pool.query(query, [fileHash, sessionId]);
  return result.rows[0];
};