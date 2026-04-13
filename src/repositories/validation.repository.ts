import { pool } from '../config/db';
import { v4 as uuidv4 } from 'uuid';

export const saveValidation = async (
  sessionId: string,
  result: any
) => {
  const id = uuidv4();

  const validation = await pool.query(
    `
    INSERT INTO validations (id, session_id, result_json)
    VALUES ($1, $2, $3)
    RETURNING *;
    
  `,
    [id, sessionId, result]
  );

  return validation.rows[0];
};