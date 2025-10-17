import { DatabaseAdapter, QueryResult } from './base.adapter';
export interface PostgresConfig {
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
export declare class PostgresAdapter implements DatabaseAdapter {
    private config;
    private pool;
    private transactionClient;
    constructor(config: PostgresConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
    beginTransaction(): Promise<void>;
    commitTransaction(): Promise<void>;
    rollbackTransaction(): Promise<void>;
    healthCheck(): Promise<boolean>;
    runMigrations(schemaPath: string): Promise<void>;
}
//# sourceMappingURL=postgres.adapter.d.ts.map