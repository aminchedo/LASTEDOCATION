"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresAdapter = void 0;
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../../middleware/logger");
class PostgresAdapter {
    constructor(config) {
        this.config = config;
        this.pool = null;
        this.transactionClient = null;
    }
    async connect() {
        try {
            const dbConfig = {
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
            this.pool = new pg_1.Pool(dbConfig);
            // Test connection
            const client = await this.pool.connect();
            const result = await client.query('SELECT NOW()');
            client.release();
            logger_1.logger.info({
                msg: 'postgres_connected',
                timestamp: result.rows[0].now,
                database: dbConfig.database || 'from_connection_string'
            });
        }
        catch (error) {
            logger_1.logger.error({
                msg: 'postgres_connection_failed',
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            logger_1.logger.info({ msg: 'postgres_connection_closed' });
        }
    }
    async query(text, params) {
        if (!this.pool) {
            throw new Error('Database not connected. Call connect() first.');
        }
        const client = this.transactionClient || this.pool;
        try {
            const start = Date.now();
            const result = await client.query(text, params);
            const duration = Date.now() - start;
            logger_1.logger.debug({
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
        }
        catch (error) {
            logger_1.logger.error({
                msg: 'postgres_query_failed',
                query: text.substring(0, 100),
                error: error.message,
                params
            });
            throw error;
        }
    }
    async beginTransaction() {
        if (!this.pool) {
            throw new Error('Database not connected.');
        }
        this.transactionClient = await this.pool.connect();
        await this.transactionClient.query('BEGIN');
    }
    async commitTransaction() {
        if (!this.transactionClient) {
            throw new Error('No active transaction.');
        }
        await this.transactionClient.query('COMMIT');
        this.transactionClient.release();
        this.transactionClient = null;
    }
    async rollbackTransaction() {
        if (!this.transactionClient) {
            throw new Error('No active transaction.');
        }
        await this.transactionClient.query('ROLLBACK');
        this.transactionClient.release();
        this.transactionClient = null;
    }
    async healthCheck() {
        try {
            if (!this.pool) {
                return false;
            }
            const result = await this.pool.query('SELECT 1 as health');
            return result.rows[0].health === 1;
        }
        catch (error) {
            logger_1.logger.error({ msg: 'postgres_health_check_failed', error });
            return false;
        }
    }
    async runMigrations(schemaPath) {
        try {
            if (!fs_1.default.existsSync(schemaPath)) {
                logger_1.logger.warn({ msg: 'schema_file_not_found', path: schemaPath });
                return;
            }
            const schema = fs_1.default.readFileSync(schemaPath, 'utf-8');
            await this.query(schema);
            logger_1.logger.info({ msg: 'postgres_schema_initialized' });
        }
        catch (error) {
            logger_1.logger.error({
                msg: 'postgres_migration_failed',
                error: error.message
            });
            throw error;
        }
    }
}
exports.PostgresAdapter = PostgresAdapter;
//# sourceMappingURL=postgres.adapter.js.map