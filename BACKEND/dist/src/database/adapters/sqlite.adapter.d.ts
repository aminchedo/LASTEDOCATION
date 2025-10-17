import { DatabaseAdapter, QueryResult } from './base.adapter';
export interface SQLiteConfig {
    filename?: string;
    mode?: number;
}
export declare class SQLiteAdapter implements DatabaseAdapter {
    private config;
    private db;
    private inTransaction;
    constructor(config?: SQLiteConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
    beginTransaction(): Promise<void>;
    commitTransaction(): Promise<void>;
    rollbackTransaction(): Promise<void>;
    healthCheck(): Promise<boolean>;
    runMigrations(schemaPath: string): Promise<void>;
    private convertPostgreSQLToSQLite;
    private convertPostgreSQLSchemaToSQLite;
}
//# sourceMappingURL=sqlite.adapter.d.ts.map