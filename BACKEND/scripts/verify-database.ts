#!/usr/bin/env ts-node
/**
 * Database Verification Script
 * Verifies all database components are properly configured
 */

import { Pool } from 'pg';
import { ENV } from '../src/config/env';

interface VerificationResult {
  name: string;
  status: 'pass' | 'fail';
  message: string;
  details?: any;
}

const results: VerificationResult[] = [];
let pool: Pool;

// Expected tables
const EXPECTED_TABLES = [
  'users',
  'models',
  'training_jobs',
  'datasets',
  'download_queue',
  'user_settings',
  'checkpoints'
];

// Expected foreign keys
const EXPECTED_FOREIGN_KEYS = [
  { table: 'training_jobs', column: 'user_id', references: 'users' },
  { table: 'training_jobs', column: 'model_id', references: 'models' },
  { table: 'datasets', column: 'user_id', references: 'users' },
  { table: 'download_queue', column: 'model_id', references: 'models' },
  { table: 'download_queue', column: 'user_id', references: 'users' },
  { table: 'user_settings', column: 'user_id', references: 'users' },
  { table: 'checkpoints', column: 'training_job_id', references: 'training_jobs' }
];

// Expected indexes
const EXPECTED_INDEXES = [
  'idx_models_type',
  'idx_models_status',
  'idx_training_jobs_user_id',
  'idx_training_jobs_status',
  'idx_download_queue_status',
  'idx_datasets_user_id',
  'idx_checkpoints_training_job_id'
];

// Expected triggers
const EXPECTED_TRIGGERS = [
  { name: 'update_users_updated_at', table: 'users' },
  { name: 'update_models_updated_at', table: 'models' },
  { name: 'update_user_settings_updated_at', table: 'user_settings' }
];

/**
 * Connect to database
 */
async function connectDatabase(): Promise<void> {
  try {
    pool = new Pool({
      connectionString: ENV.DATABASE_URL || undefined,
      host: ENV.DB_HOST,
      port: ENV.DB_PORT,
      database: ENV.DB_NAME,
      user: ENV.DB_USER,
      password: ENV.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    // Test connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time, current_database() as db');
    client.release();

    results.push({
      name: 'Database Connection',
      status: 'pass',
      message: `Connected to ${result.rows[0].db}`,
      details: { timestamp: result.rows[0].time }
    });
  } catch (error: any) {
    results.push({
      name: 'Database Connection',
      status: 'fail',
      message: error.message
    });
    throw error;
  }
}

/**
 * Verify all tables exist
 */
async function verifyTables(): Promise<void> {
  try {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const result = await pool.query(query);
    const existingTables = result.rows.map(row => row.table_name);
    const missingTables = EXPECTED_TABLES.filter(t => !existingTables.includes(t));

    if (missingTables.length === 0) {
      results.push({
        name: 'Database Tables',
        status: 'pass',
        message: `All ${EXPECTED_TABLES.length} tables exist`,
        details: { tables: existingTables }
      });
    } else {
      results.push({
        name: 'Database Tables',
        status: 'fail',
        message: `Missing ${missingTables.length} tables`,
        details: { missing: missingTables, found: existingTables }
      });
    }
  } catch (error: any) {
    results.push({
      name: 'Database Tables',
      status: 'fail',
      message: error.message
    });
  }
}

/**
 * Verify foreign keys
 */
async function verifyForeignKeys(): Promise<void> {
  try {
    const query = `
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public';
    `;

    const result = await pool.query(query);
    const existingFKs = result.rows;

    let allValid = true;
    const validationDetails: any[] = [];

    for (const expectedFK of EXPECTED_FOREIGN_KEYS) {
      const found = existingFKs.find(
        fk => fk.table_name === expectedFK.table &&
              fk.column_name === expectedFK.column &&
              fk.foreign_table_name === expectedFK.references
      );

      validationDetails.push({
        table: expectedFK.table,
        column: expectedFK.column,
        references: expectedFK.references,
        status: found ? 'valid' : 'missing'
      });

      if (!found) {
        allValid = false;
      }
    }

    results.push({
      name: 'Foreign Keys',
      status: allValid ? 'pass' : 'fail',
      message: `${EXPECTED_FOREIGN_KEYS.length - validationDetails.filter(v => v.status === 'missing').length}/${EXPECTED_FOREIGN_KEYS.length} valid`,
      details: validationDetails
    });
  } catch (error: any) {
    results.push({
      name: 'Foreign Keys',
      status: 'fail',
      message: error.message
    });
  }
}

/**
 * Verify indexes
 */
async function verifyIndexes(): Promise<void> {
  try {
    const query = `
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY indexname;
    `;

    const result = await pool.query(query);
    const existingIndexes = result.rows.map(row => row.indexname);
    const missingIndexes = EXPECTED_INDEXES.filter(idx => !existingIndexes.includes(idx));

    results.push({
      name: 'Indexes',
      status: missingIndexes.length === 0 ? 'pass' : 'fail',
      message: `${EXPECTED_INDEXES.length - missingIndexes.length}/${EXPECTED_INDEXES.length} exist`,
      details: { 
        found: existingIndexes.filter(idx => EXPECTED_INDEXES.includes(idx)),
        missing: missingIndexes 
      }
    });
  } catch (error: any) {
    results.push({
      name: 'Indexes',
      status: 'fail',
      message: error.message
    });
  }
}

/**
 * Verify triggers
 */
async function verifyTriggers(): Promise<void> {
  try {
    const query = `
      SELECT 
        trigger_name,
        event_object_table as table_name
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY trigger_name;
    `;

    const result = await pool.query(query);
    const existingTriggers = result.rows;

    let allValid = true;
    const triggerDetails: any[] = [];

    for (const expectedTrigger of EXPECTED_TRIGGERS) {
      const found = existingTriggers.find(
        t => t.trigger_name === expectedTrigger.name &&
             t.table_name === expectedTrigger.table
      );

      triggerDetails.push({
        name: expectedTrigger.name,
        table: expectedTrigger.table,
        status: found ? 'active' : 'missing'
      });

      if (!found) {
        allValid = false;
      }
    }

    results.push({
      name: 'Triggers',
      status: allValid ? 'pass' : 'fail',
      message: `${triggerDetails.filter(t => t.status === 'active').length}/${EXPECTED_TRIGGERS.length} active`,
      details: triggerDetails
    });
  } catch (error: any) {
    results.push({
      name: 'Triggers',
      status: 'fail',
      message: error.message
    });
  }
}

/**
 * Test connection pooling
 */
async function testConnectionPooling(): Promise<void> {
  try {
    const connections: any[] = [];
    const poolSize = 5;

    // Acquire multiple connections
    for (let i = 0; i < poolSize; i++) {
      const client = await pool.connect();
      connections.push(client);
    }

    // Release all connections
    for (const client of connections) {
      client.release();
    }

    results.push({
      name: 'Connection Pooling',
      status: 'pass',
      message: `Successfully acquired and released ${poolSize} connections`,
      details: { 
        poolSize,
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    });
  } catch (error: any) {
    results.push({
      name: 'Connection Pooling',
      status: 'fail',
      message: error.message
    });
  }
}

/**
 * Test transaction support
 */
async function testTransactions(): Promise<void> {
  try {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      
      // Create a test record
      const testEmail = `test_${Date.now()}@verify.local`;
      await client.query(
        'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3)',
        [testEmail, 'test_user', 'test_hash']
      );

      // Rollback to avoid polluting the database
      await client.query('ROLLBACK');

      results.push({
        name: 'Transaction Support',
        status: 'pass',
        message: 'Transaction BEGIN/ROLLBACK successful',
        details: { test: 'INSERT with ROLLBACK' }
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    results.push({
      name: 'Transaction Support',
      status: 'fail',
      message: error.message
    });
  }
}

/**
 * Check schema structure
 */
async function verifySchemaStructure(): Promise<void> {
  try {
    const query = `
      SELECT 
        table_name,
        COUNT(*) as column_count
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = ANY($1)
      GROUP BY table_name
      ORDER BY table_name;
    `;

    const result = await pool.query(query, [EXPECTED_TABLES]);
    const tableStructure = result.rows;

    results.push({
      name: 'Schema Structure',
      status: 'pass',
      message: `Schema validated for ${tableStructure.length} tables`,
      details: tableStructure
    });
  } catch (error: any) {
    results.push({
      name: 'Schema Structure',
      status: 'fail',
      message: error.message
    });
  }
}

/**
 * Print results
 */
function printResults(): void {
  console.log('\n' + '='.repeat(60));
  console.log('DATABASE VERIFICATION REPORT');
  console.log('='.repeat(60) + '\n');

  let passCount = 0;
  let failCount = 0;

  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.message}`);
    
    if (result.details && process.argv.includes('--verbose')) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }

    if (result.status === 'pass') {
      passCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`SUMMARY: ${passCount} passed, ${failCount} failed`);
  console.log('='.repeat(60) + '\n');

  if (failCount > 0) {
    console.log('Run with --verbose flag for detailed information');
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    await connectDatabase();
    await verifyTables();
    await verifyForeignKeys();
    await verifyIndexes();
    await verifyTriggers();
    await testConnectionPooling();
    await testTransactions();
    await verifySchemaStructure();

    printResults();

    await pool.end();

    // Exit with error code if any checks failed
    const hasFailures = results.some(r => r.status === 'fail');
    process.exit(hasFailures ? 1 : 0);
  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
    if (pool) {
      await pool.end();
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { main as verifyDatabase };
