import { pool } from '../config/db';

export const testQuery = async () => {
  const res = await pool.query('SELECT NOW()');
  console.log(res.rows);
};