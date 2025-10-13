"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
exports.getDatabase = getDatabase;
exports.query = query;
exports.transaction = transaction;
exports.closeDatabase = closeDatabase;
exports.healthCheck = healthCheck;
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../middleware/logger");
let pool = null;
/**
 * Initialize PostgreSQL database connection
 */
async function initDatabase(config) {
    try {
        // Use provided config or environment variables
        const dbConfig = config || {
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
        pool = new pg_1.Pool(dbConfig);
        // Test connection
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        logger_1.logger.info({
            msg: 'database_connected',
            timestamp: result.rows[0].now,
            database: dbConfig.database || 'from_connection_string'
        });
        // Run schema migrations
        await runMigrations(pool);
        return pool;
    }
    catch (error) {
        logger_1.logger.error({
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
async function runMigrations(pool) {
    try {
        const schemaPath = path_1.default.join(__dirname, 'schema.sql');
        if (!fs_1.default.existsSync(schemaPath)) {
            logger_1.logger.warn({ msg: 'schema_file_not_found', path: schemaPath });
            return;
        }
        const schema = fs_1.default.readFileSync(schemaPath, 'utf-8');
        await pool.query(schema);
        logger_1.logger.info({ msg: 'database_schema_initialized' });
    }
    catch (error) {
        logger_1.logger.error({
            msg: 'migration_failed',
            error: error.message
        });
        throw error;
    }
}
/**
 * Get database connection pool
 */
function getDatabase() {
    if (!pool) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return pool;
}
/**
 * Execute a query with automatic connection handling
 */
async function query(text, params) {
    const db = getDatabase();
    try {
        const start = Date.now();
        const result = await db.query(text, params);
        const duration = Date.now() - start;
        logger_1.logger.debug({
            msg: 'query_executed',
            query: text.substring(0, 100),
            duration,
            rows: result.rowCount
        });
        return result;
    }
    catch (error) {
        logger_1.logger.error({
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
async function transaction(callback) {
    const db = getDatabase();
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
/**
 * Close database connection
 */
async function closeDatabase() {
    if (pool) {
        await pool.end();
        pool = null;
        logger_1.logger.info({ msg: 'database_connection_closed' });
    }
}
/**
 * Check if database is connected and healthy
 */
async function healthCheck() {
    try {
        if (!pool) {
            return false;
        }
        const result = await pool.query('SELECT 1 as health');
        return result.rows[0].health === 1;
    }
    catch (error) {
        logger_1.logger.error({ msg: 'health_check_failed', error });
        return false;
    }
}
//# sourceMappingURL=connection.js.map