import { DatabaseAdapter, QueryResult } from './adapters/base.adapter';
import { PostgresConfig } from './adapters/postgres.adapter';
import { SQLiteConfig } from './adapters/sqlite.adapter';
export type DatabaseEngine = 'postgres' | 'sqlite';
export interface DatabaseConfig {
    engine?: DatabaseEngine;
    postgres?: PostgresConfig;
    sqlite?: SQLiteConfig;
}
/**
 * Initialize database connection with the specified engine
 */
export declare function initDatabase(config?: DatabaseConfig): Promise<DatabaseAdapter>;
/**
 * Get database adapter
 */
export declare function getDatabase(): DatabaseAdapter;
/**
 * Execute a query with automatic connection handling
 */
export declare function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
/**
 * Execute a transaction
 */
export declare function transaction<T>(callback: (db: DatabaseAdapter) => Promise<T>): Promise<T>;
/**
 * Close database connection
 */
export declare function closeDatabase(): Promise<void>;
/**
 * Check if database is connected and healthy
 */
export declare function healthCheck(): Promise<boolean>;
/**
 * Get current database engine
 */
export declare function getDatabaseEngine(): DatabaseEngine | null;
export type { QueryResult, DatabaseAdapter };
//# sourceMappingURL=connection-new.d.ts.map