"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLiteAdapter = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../../middleware/logger");
class SQLiteAdapter {
    constructor(config = {}) {
        this.config = config;
        this.db = null;
        this.inTransaction = false;
    }
    async connect() {
        try {
            const filename = this.config.filename || process.env.SQLITE_DB_PATH || path_1.default.join(process.cwd(), 'data', 'persian_tts.db');
            const mode = this.config.mode || sqlite3_1.default.OPEN_READWRITE | sqlite3_1.default.OPEN_CREATE;
            // Ensure directory exists
            const dir = path_1.default.dirname(filename);
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
            }
            this.db = new sqlite3_1.default.Database(filename, mode, (err) => {
                if (err) {
                    logger_1.logger.error({
                        msg: 'sqlite_connection_failed',
                        error: err.message,
                        filename
                    });
                    throw err;
                }
            });
            // Enable foreign keys
            await this.query('PRAGMA foreign_keys = ON');
            logger_1.logger.info({
                msg: 'sqlite_connected',
                database: filename
            });
        }
        catch (error) {
            logger_1.logger.error({
                msg: 'sqlite_connection_failed',
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
    async disconnect() {
        if (this.db) {
            await new Promise((resolve, reject) => {
                this.db.close((err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
            this.db = null;
            logger_1.logger.info({ msg: 'sqlite_connection_closed' });
        }
    }
    async query(text, params) {
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
                const rows = await new Promise((resolve, reject) => {
                    this.db.all(sqliteQuery, params || [], (err, rows) => {
                        if (err)
                            reject(err);
                        else
                            resolve(rows);
                    });
                });
                const duration = Date.now() - start;
                logger_1.logger.debug({
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
            }
            else {
                // For INSERT, UPDATE, DELETE queries
                const result = await new Promise((resolve, reject) => {
                    this.db.run(sqliteQuery, params || [], function (err) {
                        if (err)
                            reject(err);
                        else
                            resolve({ lastID: this.lastID, changes: this.changes });
                    });
                });
                const duration = Date.now() - start;
                logger_1.logger.debug({
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
        }
        catch (error) {
            logger_1.logger.error({
                msg: 'sqlite_query_failed',
                query: sqliteQuery.substring(0, 100),
                error: error.message,
                params
            });
            throw error;
        }
    }
    async beginTransaction() {
        if (this.inTransaction) {
            throw new Error('Transaction already in progress.');
        }
        await this.query('BEGIN TRANSACTION');
        this.inTransaction = true;
    }
    async commitTransaction() {
        if (!this.inTransaction) {
            throw new Error('No active transaction.');
        }
        await this.query('COMMIT');
        this.inTransaction = false;
    }
    async rollbackTransaction() {
        if (!this.inTransaction) {
            throw new Error('No active transaction.');
        }
        await this.query('ROLLBACK');
        this.inTransaction = false;
    }
    async healthCheck() {
        try {
            if (!this.db) {
                return false;
            }
            const result = await this.query('SELECT 1 as health');
            return result.rows[0].health === 1;
        }
        catch (error) {
            logger_1.logger.error({ msg: 'sqlite_health_check_failed', error });
            return false;
        }
    }
    async runMigrations(schemaPath) {
        try {
            if (!fs_1.default.existsSync(schemaPath)) {
                // Try SQLite-specific schema if exists
                const sqliteSchemaPath = schemaPath.replace('.sql', '.sqlite.sql');
                if (fs_1.default.existsSync(sqliteSchemaPath)) {
                    schemaPath = sqliteSchemaPath;
                }
                else {
                    logger_1.logger.warn({ msg: 'schema_file_not_found', path: schemaPath });
                    return;
                }
            }
            let schema = fs_1.default.readFileSync(schemaPath, 'utf-8');
            // Convert PostgreSQL schema to SQLite
            schema = this.convertPostgreSQLSchemaToSQLite(schema);
            // Split by semicolons and execute each statement
            const statements = schema.split(';').filter(stmt => stmt.trim());
            for (const statement of statements) {
                if (statement.trim()) {
                    await this.query(statement);
                }
            }
            logger_1.logger.info({ msg: 'sqlite_schema_initialized' });
        }
        catch (error) {
            logger_1.logger.error({
                msg: 'sqlite_migration_failed',
                error: error.message
            });
            throw error;
        }
    }
    convertPostgreSQLToSQLite(query) {
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
    convertPostgreSQLSchemaToSQLite(schema) {
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
exports.SQLiteAdapter = SQLiteAdapter;
//# sourceMappingURL=sqlite.adapter.js.map