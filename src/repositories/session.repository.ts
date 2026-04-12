import { pool } from '../config/db';
import { v4 as uuidv4 } from 'uuid';

export const createSession = async () => {
  const id = uuidv4();

  await pool.query(
    `INSERT INTO sessions (id) VALUES ($1)`,
    [id]
  );

  return id;
};

export const getSession = async (sessionId: string) => {
  const res = await pool.query(
    `SELECT * FROM sessions WHERE id = $1`,
    [sessionId]
  );
  return res.rows[0];
};