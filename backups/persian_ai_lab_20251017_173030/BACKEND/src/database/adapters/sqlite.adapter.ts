import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { logger } from '../../middleware/logger';
import { DatabaseAdapter, QueryResult } from './base.adapter';

export interface SQLiteConfig {
  filename?: string;
  mode?: number;
}

export class SQLiteAdapter implements DatabaseAdapter {
  private db: sqlite3.Database | null = null;
  private inTransaction = false;

  constructor(private config: SQLiteConfig = {}) {}

  async connect(): Promise<void> {
    try {
      const filename = this.config.filename || process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'persian_tts.db');
      const mode = this.config.mode || sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;

      // Ensure directory exists
      const dir = path.dirname(filename);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.db = new sqlite3.Database(filename, mode, (err) => {
        if (err) {
          logger.error({
            msg: 'sqlite_connection_failed',
            error: err.message,
            filename
          });
          throw err;
        }
      });

      // Enable foreign keys
      await this.query('PRAGMA foreign_keys = ON');

      logger.info({
        msg: 'sqlite_connected',
        database: filename
      });
    } catch (error: any) {
      logger.error({
        msg: 'sqlite_connection_failed',
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      await new Promise<void>((resolve, reject) => {
        this.db!.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      this.db = null;
      logger.info({ msg: 'sqlite_connection_closed' });
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }

    // Convert PostgreSQL placeholders ($1, $2, etc.) to SQLite placeholders (?, ?, etc.)
    let sqliteQuery = text;
    if (params && params.length > 0) {
      sqliteQuery = text.replace(/\$(\d+)/g, '?');
    }

    // Handle PostgreSQL-specific syntax
    sqliteQuery = this.convertPostgreSQLToSQLite(sqliteQuery);

    try {
      const start = Date.now();
      
      if (sqliteQuery.trim().toUpperCase().startsWith('SELECT') || 
          sqliteQuery.trim().toUpperCase().startsWith('WITH')) {
        // For SELECT queries
        const rows = await new Promise<T[]>((resolve, reject) => {
          this.db!.all(sqliteQuery, params || [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows as T[]);
          });
        });

        const duration = Date.now() - start;
        logger.debug({
          msg: 'sqlite_query_executed',
          query: sqliteQuery.substring(0, 100),
          duration,
          rows: rows.length
        });

        return {
          rows,
          rowCount: rows.length,
          command: 'SELECT'
        };
      } else {
        // For INSERT, UPDATE, DELETE queries
        const result = await new Promise<{ lastID: number; changes: number }>((resolve, reject) => {
          this.db!.run(sqliteQuery, params || [], function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
          });
        });

        const duration = Date.now() - start;
        logger.debug({
          msg: 'sqlite_query_executed',
          query: sqliteQuery.substring(0, 100),
          duration,
          changes: result.changes
        });

        return {
          rows: [],
          rowCount: result.changes,
          command: sqliteQuery.trim().split(' ')[0].toUpperCase()
        };
      }
    } catch (error: any) {
      logger.error({
        msg: 'sqlite_query_failed',
        query: sqliteQuery.substring(0, 100),
        error: error.message,
        params
      });
      throw error;
    }
  }

  async beginTransaction(): Promise<void> {
    if (this.inTransaction) {
      throw new Error('Transaction already in progress.');
    }
    await this.query('BEGIN TRANSACTION');
    this.inTransaction = true;
  }

  async commitTransaction(): Promise<void> {
    if (!this.inTransaction) {
      throw new Error('No active transaction.');
    }
    await this.query('COMMIT');
    this.inTransaction = false;
  }

  async rollbackTransaction(): Promise<void> {
    if (!this.inTransaction) {
      throw new Error('No active transaction.');
    }
    await this.query('ROLLBACK');
    this.inTransaction = false;
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.db) {
        return false;
      }
      const result = await this.query('SELECT 1 as health');
      return result.rows[0].health === 1;
    } catch (error) {
      logger.error({ msg: 'sqlite_health_check_failed', error });
      return false;
    }
  }

  async runMigrations(schemaPath: string): Promise<void> {
    try {
      if (!fs.existsSync(schemaPath)) {
        // Try SQLite-specific schema if exists
        const sqliteSchemaPath = schemaPath.replace('.sql', '.sqlite.sql');
        if (fs.existsSync(sqliteSchemaPath)) {
          schemaPath = sqliteSchemaPath;
        } else {
          logger.warn({ msg: 'schema_file_not_found', path: schemaPath });
          return;
        }
      }

      let schema = fs.readFileSync(schemaPath, 'utf-8');
      
      // Convert PostgreSQL schema to SQLite
      schema = this.convertPostgreSQLSchemaToSQLite(schema);

      // Split by semicolons and execute each statement
      const statements = schema.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          await this.query(statement);
        }
      }

      logger.info({ msg: 'sqlite_schema_initialized' });
    } catch (error: any) {
      logger.error({
        msg: 'sqlite_migration_failed',
        error: error.message
      });
      throw error;
    }
  }

  private convertPostgreSQLToSQLite(query: string): string {
    // Convert NOW() to datetime('now')
    query = query.replace(/NOW\(\)/gi, "datetime('now')");
    
    // Convert SERIAL to INTEGER PRIMARY KEY AUTOINCREMENT
    query = query.replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
    
    // Convert BOOLEAN to INTEGER (0/1)
    query = query.replace(/BOOLEAN/gi, 'INTEGER');
    
    // Convert UUID to TEXT
    query = query.replace(/UUID/gi, 'TEXT');
    
    // Remove ON CONFLICT DO NOTHING (SQLite doesn't support this syntax)
    query = query.replace(/ON CONFLICT.*?DO NOTHING/gi, '');
    
    // Convert JSONB to TEXT
    query = query.replace(/JSONB/gi, 'TEXT');

    return query;
  }

  private convertPostgreSQLSchemaToSQLite(schema: string): string {
    // Apply general conversions
    schema = this.convertPostgreSQLToSQLite(schema);
    
    // Remove PostgreSQL-specific features
    schema = schema.replace(/CREATE EXTENSION.*?;/gi, '');
    schema = schema.replace(/CREATE TYPE.*?;/gi, '');
    schema = schema.replace(/DROP TYPE.*?;/gi, '');
    
    // Convert TIMESTAMP to DATETIME
    schema = schema.replace(/TIMESTAMP/gi, 'DATETIME');
    
    // Convert TEXT[] to TEXT
    schema = schema.replace(/TEXT\[\]/gi, 'TEXT');
    
    // Remove DEFAULT gen_random_uuid()
    schema = schema.replace(/DEFAULT gen_random_uuid\(\)/gi, '');
    
    // Convert VARCHAR to TEXT
    schema = schema.replace(/VARCHAR\(\d+\)/gi, 'TEXT');

    return schema;
  }
}