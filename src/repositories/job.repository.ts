import { pool } from '../config/db';
import { v4 as uuidv4 } from 'uuid';

export const createJob = async (sessionId: string) => {
  const id = uuidv4();

  const result = await pool.query(
    `
    INSERT INTO jobs (id, session_id, status)
    VALUES ($1, $2, 'QUEUED')
    RETURNING *;
  `,
    [id, sessionId]
  );

  return result.rows[0];
};

export const updateJobStatus = async (
  jobId: string,
  status: string,
  extra?: { extractionId?: string; error?: string }
) => {
  const query = `
    UPDATE jobs
    SET status = $1,
        extraction_id = COALESCE($2, extraction_id),
        error_message = COALESCE($3, error_message),
        started_at = CASE WHEN $1 = 'PROCESSING' THEN NOW() ELSE started_at END,
        completed_at = CASE WHEN $1 IN ('COMPLETE', 'FAILED') THEN NOW() ELSE completed_at END
    WHERE id = $4;
  `;

  await pool.query(query, [
    status,
    extra?.extractionId || null,
    extra?.error || null,
    jobId,
  ]);
};

export const getJob = async (jobId: string) => {
  const result = await pool.query(
    `SELECT * FROM jobs WHERE id = $1`,
    [jobId]
  );
  return result.rows[0];
};