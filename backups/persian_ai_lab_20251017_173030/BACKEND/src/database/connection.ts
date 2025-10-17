import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';
import { logger } from '../middleware/logger';
import { 
  initDatabase as initDatabaseNew, 
  getDatabase as getDatabaseNew,
  query as queryNew,
  transaction as transactionNew,
  closeDatabase as closeDatabaseNew,
  healthCheck as healthCheckNew,
  DatabaseAdapter
} from './connection-new';

let pool: Pool | null = null;
let useNewConnection = false;

export interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

/**
 * Initialize PostgreSQL database connection
 */
export async function initDatabase(config?: DatabaseConfig): Promise<Pool> {
  // Check if we should use the new connection system
  if (process.env.USE_NEW_DB === 'true' || process.env.DB_ENGINE) {
    useNewConnection = true;
    await initDatabaseNew({
      engine: (process.env.DB_ENGINE as 'postgres' | 'sqlite') || 'postgres',
      postgres: config
    });
    // Return a fake pool for compatibility
    return {} as Pool;
  }
  try {
    // Use provided config or environment variables
    const dbConfig: DatabaseConfig = config || {
      connectionString: process.env.DATABASE_URL,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'persian_tts',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    // Create connection pool
    pool = new Pool(dbConfig);

    // Test connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();

    logger.info({
      msg: 'database_connected',
      timestamp: result.rows[0].now,
      database: dbConfig.database || 'from_connection_string'
    });

    // Run schema migrations
    await runMigrations(pool);

    return pool;
  } catch (error: any) {
    logger.error({
      msg: 'database_connection_failed',
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Run database migrations
 */
async function runMigrations(pool: Pool): Promise<void> {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      logger.warn({ msg: 'schema_file_not_found', path: schemaPath });
      return;
    }

    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(schema);

    logger.info({ msg: 'database_schema_initialized' });
  } catch (error: any) {
    logger.error({
      msg: 'migration_failed',
      error: error.message
    });
    throw error;
  }
}

/**
 * Get database connection pool
 */
export function getDatabase(): Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return pool;
}

/**
 * Execute a query with automatic connection handling
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  if (useNewConnection) {
    const result = await queryNew<T>(text, params);
    // Convert to pg QueryResult format
    return {
      rows: result.rows,
      rowCount: result.rowCount,
      command: result.command,
      oid: 0,
      fields: []
    };
  }
  const db = getDatabase();
  
  try {
    const start = Date.now();
    const result = await db.query<T>(text, params);
    const duration = Date.now() - start;

    logger.debug({
      msg: 'query_executed',
      query: text.substring(0, 100),
      duration,
      rows: result.rowCount
    });

    return result;
  } catch (error: any) {
    logger.error({
      msg: 'query_failed',
      query: text.substring(0, 100),
      error: error.message,
      params
    });
    throw error;
  }
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const db = getDatabase();
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (useNewConnection) {
    await closeDatabaseNew();
    return;
  }
  if (pool) {
    await pool.end();
    pool = null;
    logger.info({ msg: 'database_connection_closed' });
  }
}

/**
 * Check if database is connected and healthy
 */
export async function healthCheck(): Promise<boolean> {
  if (useNewConnection) {
    return await healthCheckNew();
  }
  try {
    if (!pool) {
      return false;
    }

    const result = await pool.query('SELECT 1 as health');
    return result.rows[0].health === 1;
  } catch (error) {
    logger.error({ msg: 'health_check_failed', error });
    return false;
  }
}

// Export types
export type { QueryResult, PoolClient };
