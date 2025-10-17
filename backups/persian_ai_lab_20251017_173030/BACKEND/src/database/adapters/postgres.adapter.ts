import { Pool, PoolClient, QueryResultRow } from 'pg';
import fs from 'fs';
import { logger } from '../../middleware/logger';
import { DatabaseAdapter, QueryResult } from './base.adapter';

export interface PostgresConfig {
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

export class PostgresAdapter implements DatabaseAdapter {
  private pool: Pool | null = null;
  private transactionClient: PoolClient | null = null;

  constructor(private config: PostgresConfig) {}

  async connect(): Promise<void> {
    try {
      const dbConfig: PostgresConfig = {
        connectionString: this.config.connectionString || process.env.DATABASE_URL,
        host: this.config.host || process.env.DB_HOST || 'localhost',
        port: this.config.port || parseInt(process.env.DB_PORT || '5432'),
        database: this.config.database || process.env.DB_NAME || 'persian_tts',
        user: this.config.user || process.env.DB_USER || 'postgres',
        password: this.config.password || process.env.DB_PASSWORD || 'postgres',
        ssl: process.env.NODE_ENV === 'production' 
          ? { rejectUnauthorized: false } 
          : false,
        max: this.config.max || 20,
        idleTimeoutMillis: this.config.idleTimeoutMillis || 30000,
        connectionTimeoutMillis: this.config.connectionTimeoutMillis || 10000,
      };

      this.pool = new Pool(dbConfig);

      // Test connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();

      logger.info({
        msg: 'postgres_connected',
        timestamp: result.rows[0].now,
        database: dbConfig.database || 'from_connection_string'
      });
    } catch (error: any) {
      logger.error({
        msg: 'postgres_connection_failed',
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.info({ msg: 'postgres_connection_closed' });
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }

    const client = this.transactionClient || this.pool;

    try {
      const start = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - start;

      logger.debug({
        msg: 'postgres_query_executed',
        query: text.substring(0, 100),
        duration,
        rows: result.rowCount
      });

      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        command: result.command
      };
    } catch (error: any) {
      logger.error({
        msg: 'postgres_query_failed',
        query: text.substring(0, 100),
        error: error.message,
        params
      });
      throw error;
    }
  }

  async beginTransaction(): Promise<void> {
    if (!this.pool) {
      throw new Error('Database not connected.');
    }
    this.transactionClient = await this.pool.connect();
    await this.transactionClient.query('BEGIN');
  }

  async commitTransaction(): Promise<void> {
    if (!this.transactionClient) {
      throw new Error('No active transaction.');
    }
    await this.transactionClient.query('COMMIT');
    this.transactionClient.release();
    this.transactionClient = null;
  }

  async rollbackTransaction(): Promise<void> {
    if (!this.transactionClient) {
      throw new Error('No active transaction.');
    }
    await this.transactionClient.query('ROLLBACK');
    this.transactionClient.release();
    this.transactionClient = null;
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.pool) {
        return false;
      }
      const result = await this.pool.query('SELECT 1 as health');
      return result.rows[0].health === 1;
    } catch (error) {
      logger.error({ msg: 'postgres_health_check_failed', error });
      return false;
    }
  }

  async runMigrations(schemaPath: string): Promise<void> {
    try {
      if (!fs.existsSync(schemaPath)) {
        logger.warn({ msg: 'schema_file_not_found', path: schemaPath });
        return;
      }

      const schema = fs.readFileSync(schemaPath, 'utf-8');
      await this.query(schema);

      logger.info({ msg: 'postgres_schema_initialized' });
    } catch (error: any) {
      logger.error({
        msg: 'postgres_migration_failed',
        error: error.message
      });
      throw error;
    }
  }
}