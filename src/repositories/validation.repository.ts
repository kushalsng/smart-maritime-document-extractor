import { pool } from '../config/db';
import { v4 as uuidv4 } from 'uuid';
import { Validation, ValidationResult } from '../types/extraction.types';

export const saveValidation = async (
  sessionId: string,
  result: ValidationResult,
  raw: string
) => {
  const id = uuidv4();

  const validation = await pool.query(
    `
    INSERT INTO validations (id, session_id, result_json, raw_llm_response)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
    
  `,
    [id, sessionId, result, raw]
  );

  return validation.rows[0];
};

export const getLatestValidation = async (
  sessionId: string
): Promise<Validation | null> => {
  const result = await pool.query(
    `
    SELECT *
    FROM validations
    WHERE session_id = $1
    ORDER BY created_at DESC
    LIMIT 1
  `,
    [sessionId]
  );

  return result.rows[0] || null;
};