import { query } from '../database/connection';

// Setup test database
beforeAll(async () => {
  try {
    // Create test tables if they don't exist
    await query(`
      CREATE TABLE IF NOT EXISTS test_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.warn('Test setup warning:', error);
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    await query('DROP TABLE IF EXISTS test_users CASCADE');
  } catch (error) {
    console.warn('Test cleanup warning:', error);
  }
});

// Clear data between tests
afterEach(async () => {
  try {
    await query('TRUNCATE test_users CASCADE');
  } catch (error) {
    console.warn('Test cleanup warning:', error);
  }
});
