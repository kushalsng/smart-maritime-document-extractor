import { pool } from '../config/db';
import { v4 as uuidv4 } from 'uuid';
import { Extraction } from '../types/extraction.types';

export interface CreateExtractionInput {
  sessionId: string;
  fileName: string;
  fileHash: string;
  rawResponse: string;
  status?: string;
}

export const createExtraction = async (data: CreateExtractionInput): Promise<Extraction | null> => {
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
): Promise<Extraction | null> => {
  const query = `
    SELECT * FROM extractions
    WHERE file_hash = $1 AND session_id = $2
    LIMIT 1;
  `;

  const result = await pool.query(query, [fileHash, sessionId]);
  return result.rows[0];
};

export const getExtractionsBySession = async (sessionId: string): Promise<Extraction[] | null> => {
  const res = await pool.query(
    `SELECT * FROM extractions WHERE session_id = $1 ORDER BY created_at DESC`,
    [sessionId]
  );

  return res.rows;
};

export const getExtractionById = async (
  id: string
): Promise<Extraction | null> => {
  const result = await pool.query(
    `SELECT * FROM extractions WHERE id = $1 LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
};