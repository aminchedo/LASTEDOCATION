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
exports.getDatabaseEngine = getDatabaseEngine;
const path_1 = __importDefault(require("path"));
const logger_1 = require("../middleware/logger");
const postgres_adapter_1 = require("./adapters/postgres.adapter");
const sqlite_adapter_1 = require("./adapters/sqlite.adapter");
let adapter = null;
/**
 * Initialize database connection with the specified engine
 */
async function initDatabase(config) {
    try {
        const engine = config?.engine || process.env.DB_ENGINE || 'postgres';
        logger_1.logger.info({ msg: 'initializing_database', engine });
        switch (engine) {
            case 'postgres':
                adapter = new postgres_adapter_1.PostgresAdapter(config?.postgres || {});
                break;
            case 'sqlite':
                adapter = new sqlite_adapter_1.SQLiteAdapter(config?.sqlite || {});
                break;
            default:
                throw new Error(`Unsupported database engine: ${engine}`);
        }
        await adapter.connect();
        // Run migrations
        const schemaPath = engine === 'sqlite'
            ? path_1.default.join(__dirname, 'schema.sqlite.sql')
            : path_1.default.join(__dirname, 'schema.sql');
        await adapter.runMigrations(schemaPath);
        return adapter;
    }
    catch (error) {
        logger_1.logger.error({
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
function getDatabase() {
    if (!adapter) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return adapter;
}
/**
 * Execute a query with automatic connection handling
 */
async function query(text, params) {
    const db = getDatabase();
    return db.query(text, params);
}
/**
 * Execute a transaction
 */
async function transaction(callback) {
    const db = getDatabase();
    try {
        await db.beginTransaction();
        const result = await callback(db);
        await db.commitTransaction();
        return result;
    }
    catch (error) {
        await db.rollbackTransaction();
        throw error;
    }
}
/**
 * Close database connection
 */
async function closeDatabase() {
    if (adapter) {
        await adapter.disconnect();
        adapter = null;
    }
}
/**
 * Check if database is connected and healthy
 */
async function healthCheck() {
    try {
        if (!adapter) {
            return false;
        }
        return await adapter.healthCheck();
    }
    catch (error) {
        logger_1.logger.error({ msg: 'health_check_failed', error });
        return false;
    }
}
/**
 * Get current database engine
 */
function getDatabaseEngine() {
    if (!adapter) {
        return null;
    }
    return adapter instanceof postgres_adapter_1.PostgresAdapter ? 'postgres' : 'sqlite';
}
//# sourceMappingURL=connection-new.js.map