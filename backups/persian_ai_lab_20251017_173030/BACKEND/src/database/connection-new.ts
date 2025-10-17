import path from 'path';
import { logger } from '../middleware/logger';
import { DatabaseAdapter, QueryResult } from './adapters/base.adapter';
import { PostgresAdapter, PostgresConfig } from './adapters/postgres.adapter';
import { SQLiteAdapter, SQLiteConfig } from './adapters/sqlite.adapter';

let adapter: DatabaseAdapter | null = null;

export type DatabaseEngine = 'postgres' | 'sqlite';

export interface DatabaseConfig {
  engine?: DatabaseEngine;
  postgres?: PostgresConfig;
  sqlite?: SQLiteConfig;
}

/**
 * Initialize database connection with the specified engine
 */
export async function initDatabase(config?: DatabaseConfig): Promise<DatabaseAdapter> {
  try {
    const engine = config?.engine || (process.env.DB_ENGINE as DatabaseEngine) || 'postgres';

    logger.info({ msg: 'initializing_database', engine });

    switch (engine) {
      case 'postgres':
        adapter = new PostgresAdapter(config?.postgres || {});
        break;
      case 'sqlite':
        adapter = new SQLiteAdapter(config?.sqlite || {});
        break;
      default:
        throw new Error(`Unsupported database engine: ${engine}`);
    }

    await adapter.connect();

    // Run migrations
    const schemaPath = engine === 'sqlite' 
      ? path.join(__dirname, 'schema.sqlite.sql')
      : path.join(__dirname, 'schema.sql');
    
    await adapter.runMigrations(schemaPath);

    return adapter;
  } catch (error: any) {
    logger.error({
      msg: 'database_initialization_failed',
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Get database adapter
 */
export function getDatabase(): DatabaseAdapter {
  if (!adapter) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return adapter;
}

/**
 * Execute a query with automatic connection handling
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const db = getDatabase();
  return db.query<T>(text, params);
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (db: DatabaseAdapter) => Promise<T>
): Promise<T> {
  const db = getDatabase();

  try {
    await db.beginTransaction();
    const result = await callback(db);
    await db.commitTransaction();
    return result;
  } catch (error) {
    await db.rollbackTransaction();
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (adapter) {
    await adapter.disconnect();
    adapter = null;
  }
}

/**
 * Check if database is connected and healthy
 */
export async function healthCheck(): Promise<boolean> {
  try {
    if (!adapter) {
      return false;
    }
    return await adapter.healthCheck();
  } catch (error) {
    logger.error({ msg: 'health_check_failed', error });
    return false;
  }
}

/**
 * Get current database engine
 */
export function getDatabaseEngine(): DatabaseEngine | null {
  if (!adapter) {
    return null;
  }
  return adapter instanceof PostgresAdapter ? 'postgres' : 'sqlite';
}

// Export types
export type { QueryResult, DatabaseAdapter };