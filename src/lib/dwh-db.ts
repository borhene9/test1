import { Pool } from 'pg';

// Define the PostgreSQL error type
interface PostgresError extends Error {
  code?: string;
  detail?: string;
  hint?: string;
  position?: string;
  where?: string;
}

// Create a new pool for the DWH database
const dwhPool = new Pool({
  connectionString: process.env.DWH_DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
});

// Test the database connection
async function testConnection() {
  const client = await dwhPool.connect();
  try {
    console.log('Testing database connection...');
    console.log('Connection string:', process.env.DWH_DATABASE_URL?.replace(/:[^:@]*@/, ':****@')); // Hide password
    await client.query('SELECT NOW()');
    console.log('Database connection test successful');
    return true;
  } catch (error) {
    const pgError = error as PostgresError;
    console.error('Database connection test failed:', {
      message: pgError.message,
      code: pgError.code,
      detail: pgError.detail,
      hint: pgError.hint,
      position: pgError.position,
      where: pgError.where,
      stack: pgError.stack
    });
    return false;
  } finally {
    client.release();
  }
}

// Helper function to execute queries
export async function queryDWH(text: string, params?: any[]) {
  const client = await dwhPool.connect();
  try {
    console.log('Executing query:', text); // Debug log
    console.log('Query parameters:', params); // Debug log
    
    // Test the connection before executing the query
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection test failed');
    }
    
    const result = await client.query(text, params);
    console.log('Query result rows:', result.rows.length); // Debug log
    return result.rows;
  } catch (error: any) {
    const pgError = error as PostgresError;
    console.error('Database query error:', {
      message: pgError.message,
      code: pgError.code,
      detail: pgError.detail,
      hint: pgError.hint,
      position: pgError.position,
      where: pgError.where,
      stack: pgError.stack,
      query: text,
      params: params
    });
    throw new Error(`Database query failed: ${pgError.message}`);
  } finally {
    client.release();
  }
}

// Test the connection on startup
testConnection().then(success => {
  if (!success) {
    console.error('Failed to establish initial database connection');
  }
});

dwhPool.on('connect', () => {
  console.log('Connected to DWH database');
});

dwhPool.on('error', (err: PostgresError) => {
  console.error('Unexpected error on idle client', {
    message: err.message,
    code: err.code,
    detail: err.detail,
    hint: err.hint,
    position: err.position,
    where: err.where,
    stack: err.stack
  });
  process.exit(-1);
});

// Close the pool when the application shuts down
process.on('SIGINT', async () => {
  try {
    await dwhPool.end();
    console.log('Database pool has ended');
    process.exit(0);
  } catch (error) {
    console.error('Error ending database pool:', error);
    process.exit(1);
  }
}); 