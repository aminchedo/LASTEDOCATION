import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
export interface DatabaseConfig {
    connectionString?: string;
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    ssl?: boolean | {
        rejectUnauthorized: boolean;
    };
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
}
/**
 * Initialize PostgreSQL database connection
 */
export declare function initDatabase(config?: DatabaseConfig): Promise<Pool>;
/**
 * Get database connection pool
 */
export declare function getDatabase(): Pool;
/**
 * Execute a query with automatic connection handling
 */
export declare function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
/**
 * Execute a transaction
 */
export declare function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
/**
 * Close database connection
 */
export declare function closeDatabase(): Promise<void>;
/**
 * Check if database is connected and healthy
 */
export declare function healthCheck(): Promise<boolean>;
export type { QueryResult, PoolClient };
//# sourceMappingURL=connection.d.ts.map