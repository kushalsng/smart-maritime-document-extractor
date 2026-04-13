import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const connectDB = async () => {
  try {
    await pool.connect();
    console.log('PostgreSQL connected');
  } catch (err) {
    console.error('DB connection failed', err);
    process.exit(1);
  }
};