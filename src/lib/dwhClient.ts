import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DWH_DATABASE_URL, // Add this to your .env file with your DWH DB connection string
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function queryDWH(sql: string) {
  const client = await pool.connect();
  try {
    const res = await client.query(sql);
    return res.rows;
  } finally {
    client.release();
  }
}
