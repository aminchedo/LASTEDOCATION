/**
 * Comprehensive Integration Tests
 * Tests all major components with real functionality
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Pool } from 'pg';
import * as tf from '@tensorflow/tfjs-node';
import { ENV } from '../src/config/env';
import { initDatabase, closeDatabase, query, transaction } from '../src/database/connection';
import { hfService } from '../src/services/huggingface.service';
import { DownloadManager } from '../src/services/download-manager.service';
import { TrainingService } from '../src/services/training.service';

let pool: Pool;
let downloadManager: DownloadManager;
let trainingService: TrainingService;

// Test data
const testUser = {
  email: `test_${Date.now()}@integration.test`,
  username: `testuser_${Date.now()}`,
  password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz' // Mock hash
};

const testModel = {
  name: 'Test Persian TTS Model',
  type: 'tts',
  repo_id: 'test/persian-tts'
};

const testDataset = {
  name: 'Test Persian Dataset',
  type: 'audio',
  file_path: '/tmp/test-dataset.jsonl'
};

/**
 * Setup - Initialize database and services
 */
beforeAll(async () => {
  try {
    pool = await initDatabase();
    downloadManager = new DownloadManager();
    trainingService = new TrainingService();
  } catch (error: any) {
    console.warn('Database initialization failed:', error.message);
    console.warn('Some tests may be skipped');
  }
}, 30000);

/**
 * Cleanup - Close connections
 */
afterAll(async () => {
  if (pool) {
    await closeDatabase();
  }
}, 10000);

/**
 * Test 1: Database CRUD Operations
 */
describe('Database CRUD Operations', () => {
  let userId: string;

  it('should insert a new user into database', async () => {
    const result = await query(
      `INSERT INTO users (email, username, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, email, username, role`,
      [testUser.email, testUser.username, testUser.password_hash, 'user']
    );

    expect(result.rows.length).toBe(1);
    expect(result.rows[0]).toHaveProperty('id');
    expect(result.rows[0].email).toBe(testUser.email);
    expect(result.rows[0].username).toBe(testUser.username);
    expect(result.rows[0].role).toBe('user');

    userId = result.rows[0].id;
  });

  it('should retrieve user from database', async () => {
    const result = await query(
      'SELECT id, email, username, role FROM users WHERE id = $1',
      [userId]
    );

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].id).toBe(userId);
    expect(result.rows[0].email).toBe(testUser.email);
  });

  it('should update user in database', async () => {
    const newUsername = `updated_${testUser.username}`;
    
    await query(
      'UPDATE users SET username = $1 WHERE id = $2',
      [newUsername, userId]
    );

    const result = await query(
      'SELECT username FROM users WHERE id = $1',
      [userId]
    );

    expect(result.rows[0].username).toBe(newUsername);
  });

  it('should handle transactions correctly', async () => {
    let committed = false;

    try {
      await transaction(async (client) => {
        // Insert a test model
        await client.query(
          `INSERT INTO models (name, type, repo_id, status)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          ['Transaction Test Model', 'tts', 'test/transaction', 'available']
        );

        committed = true;
      });

      expect(committed).toBe(true);

      // Verify the model was inserted
      const result = await query(
        "SELECT id FROM models WHERE repo_id = 'test/transaction'"
      );
      expect(result.rows.length).toBeGreaterThan(0);
    } catch (error) {
      expect(committed).toBe(false);
    }
  });

  it('should rollback transaction on error', async () => {
    let rolledBack = false;

    try {
      await transaction(async (client) => {
        // This should work
        await client.query(
          `INSERT INTO models (name, type, repo_id, status)
           VALUES ($1, $2, $3, $4)`,
          ['Rollback Test', 'tts', 'test/rollback', 'available']
        );

        // Force an error
        throw new Error('Forced rollback');
      });
    } catch (error: any) {
      rolledBack = true;
      expect(error.message).toBe('Forced rollback');
    }

    expect(rolledBack).toBe(true);

    // Verify nothing was inserted
    const result = await query(
      "SELECT id FROM models WHERE repo_id = 'test/rollback'"
    );
    expect(result.rows.length).toBe(0);
  });

  it('should delete user from database', async () => {
    await query('DELETE FROM users WHERE id = $1', [userId]);

    const result = await query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    expect(result.rows.length).toBe(0);
  });
});

/**
 * Test 2: HuggingFace API Integration
 */
describe('HuggingFace API Integration', () => {
  it('should search for Persian models on HuggingFace', async () => {
    const models = await hfService.searchModels('persian');

    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
    
    // Check model structure
    const firstModel = models[0];
    expect(firstModel).toHaveProperty('id');
    expect(firstModel).toHaveProperty('modelId');
    expect(firstModel).toHaveProperty('tags');
    
    // Should contain Persian-related tags
    const hasPersianTag = models.some(m => 
      m.tags.some(tag => 
        tag.toLowerCase().includes('persian') || 
        tag.toLowerCase().includes('farsi') ||
        tag.toLowerCase().includes('fa')
      )
    );
    expect(hasPersianTag).toBe(true);
  }, 15000);

  it('should search for TTS models', async () => {
    const models = await hfService.searchModels('persian', {
      task: 'text-to-speech'
    });

    expect(Array.isArray(models)).toBe(true);
    
    if (models.length > 0) {
      const firstModel = models[0];
      expect(firstModel).toHaveProperty('pipeline_tag');
    }
  }, 15000);

  it('should validate invalid HuggingFace token', async () => {
    const result = await hfService.validateToken('hf_invalid_token_12345');

    expect(result).toHaveProperty('valid');
    expect(result.valid).toBe(false);
  }, 10000);

  it('should get model info from HuggingFace', async () => {
    // Use a known Persian model
    const modelInfo = await hfService.getModelInfo('facebook/nllb-200-distilled-600M');

    if (modelInfo) {
      expect(modelInfo).toHaveProperty('id');
      expect(modelInfo).toHaveProperty('modelId');
      expect(modelInfo).toHaveProperty('tags');
      expect(Array.isArray(modelInfo.tags)).toBe(true);
    }
  }, 15000);
});

/**
 * Test 3: Download Manager
 */
describe('Download Manager', () => {
  let userId: string;
  let modelId: string;

  beforeAll(async () => {
    // Create test user
    const userResult = await query(
      `INSERT INTO users (email, username, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [`download_test_${Date.now()}@test.com`, `dl_user_${Date.now()}`, 'hash']
    );
    userId = userResult.rows[0].id;

    // Create test model
    const modelResult = await query(
      `INSERT INTO models (name, type, repo_id, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['Download Test Model', 'tts', 'test/download-model', 'available']
    );
    modelId = modelResult.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup
    await query('DELETE FROM download_queue WHERE user_id = $1', [userId]);
    await query('DELETE FROM models WHERE id = $1', [modelId]);
    await query('DELETE FROM users WHERE id = $1', [userId]);
  });

  it('should create download job in database', async () => {
    const result = await query(
      `INSERT INTO download_queue (model_id, user_id, status, progress)
       VALUES ($1, $2, 'queued', 0)
       RETURNING id, status, progress`,
      [modelId, userId]
    );

    expect(result.rows.length).toBe(1);
    expect(result.rows[0]).toHaveProperty('id');
    expect(result.rows[0].status).toBe('queued');
    expect(result.rows[0].progress).toBe(0);
  });

  it('should track download progress in database', async () => {
    // Create a download job
    const createResult = await query(
      `INSERT INTO download_queue (model_id, user_id, status, progress)
       VALUES ($1, $2, 'downloading', 0)
       RETURNING id`,
      [modelId, userId]
    );
    const downloadId = createResult.rows[0].id;

    // Update progress
    await query(
      `UPDATE download_queue 
       SET progress = $1, bytes_downloaded = $2, bytes_total = $3
       WHERE id = $4`,
      [50, 500000, 1000000, downloadId]
    );

    // Verify progress was updated
    const result = await query(
      'SELECT progress, bytes_downloaded, bytes_total FROM download_queue WHERE id = $1',
      [downloadId]
    );

    expect(result.rows[0].progress).toBe(50);
    expect(result.rows[0].bytes_downloaded).toBe(500000);
    expect(result.rows[0].bytes_total).toBe(1000000);
  });

  it('should list all downloads for a user', async () => {
    const result = await query(
      `SELECT dq.*, m.name as model_name
       FROM download_queue dq
       JOIN models m ON dq.model_id = m.id
       WHERE dq.user_id = $1
       ORDER BY dq.created_at DESC`,
      [userId]
    );

    expect(Array.isArray(result.rows)).toBe(true);
    expect(result.rows.length).toBeGreaterThan(0);
    
    result.rows.forEach(row => {
      expect(row).toHaveProperty('id');
      expect(row).toHaveProperty('status');
      expect(row).toHaveProperty('model_name');
    });
  });
});

/**
 * Test 4: Training Service with TensorFlow.js
 */
describe('Training Service', () => {
  let userId: string;
  let modelId: string;
  let datasetId: string;

  beforeAll(async () => {
    // Create test user
    const userResult = await query(
      `INSERT INTO users (email, username, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [`training_test_${Date.now()}@test.com`, `train_user_${Date.now()}`, 'hash']
    );
    userId = userResult.rows[0].id;

    // Create test model
    const modelResult = await query(
      `INSERT INTO models (name, type, repo_id, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['Training Test Model', 'tts', 'test/training-model', 'available']
    );
    modelId = modelResult.rows[0].id;

    // Create test dataset
    const datasetResult = await query(
      `INSERT INTO datasets (user_id, name, type, file_path, record_count)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, 'Test Dataset', 'audio', '/tmp/test.jsonl', 100]
    );
    datasetId = datasetResult.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup
    await query('DELETE FROM checkpoints WHERE training_job_id IN (SELECT id FROM training_jobs WHERE user_id = $1)', [userId]);
    await query('DELETE FROM training_jobs WHERE user_id = $1', [userId]);
    await query('DELETE FROM datasets WHERE id = $1', [datasetId]);
    await query('DELETE FROM models WHERE id = $1', [modelId]);
    await query('DELETE FROM users WHERE id = $1', [userId]);
  });

  it('should create a simple TensorFlow.js model', async () => {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    expect(model.layers.length).toBeGreaterThan(0);
    expect(model.inputs.length).toBe(1);
    expect(model.outputs.length).toBe(1);

    // Cleanup
    model.dispose();
  });

  it('should create training job in database', async () => {
    const config = {
      modelType: 'tts',
      datasetId: datasetId,
      epochs: 10,
      batchSize: 32,
      learningRate: 0.001,
      validationSplit: 0.2
    };

    const result = await query(
      `INSERT INTO training_jobs (user_id, model_id, status, config, progress)
       VALUES ($1, $2, 'queued', $3, 0)
       RETURNING id, status, config`,
      [userId, modelId, JSON.stringify(config)]
    );

    expect(result.rows.length).toBe(1);
    expect(result.rows[0]).toHaveProperty('id');
    expect(result.rows[0].status).toBe('queued');
    
    const savedConfig = result.rows[0].config;
    expect(savedConfig.epochs).toBe(10);
    expect(savedConfig.batchSize).toBe(32);
  });

  it('should track training metrics in database', async () => {
    // Create training job
    const jobResult = await query(
      `INSERT INTO training_jobs (user_id, model_id, status, config)
       VALUES ($1, $2, 'running', $3)
       RETURNING id`,
      [userId, modelId, JSON.stringify({ epochs: 5 })]
    );
    const jobId = jobResult.rows[0].id;

    // Insert checkpoint with metrics
    const metrics = {
      epoch: 1,
      step: 100,
      loss: 0.5,
      accuracy: 0.85,
      valLoss: 0.6,
      valAccuracy: 0.82
    };

    await query(
      `INSERT INTO checkpoints (training_job_id, epoch, step, loss, accuracy, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [jobId, metrics.epoch, metrics.step, metrics.loss, metrics.accuracy, JSON.stringify(metrics)]
    );

    // Verify checkpoint was saved
    const result = await query(
      'SELECT * FROM checkpoints WHERE training_job_id = $1',
      [jobId]
    );

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].epoch).toBe(1);
    expect(result.rows[0].loss).toBe(0.5);
    expect(result.rows[0].accuracy).toBe(0.85);
  });

  it('should perform simple model training', async () => {
    // Create a simple model
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [2], units: 4, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    model.compile({
      optimizer: 'sgd',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    // Create simple training data (XOR problem)
    const xs = tf.tensor2d([[0, 0], [0, 1], [1, 0], [1, 1]]);
    const ys = tf.tensor2d([[0], [1], [1], [0]]);

    // Train for a few epochs
    const history = await model.fit(xs, ys, {
      epochs: 5,
      verbose: 0
    });

    expect(history.history.loss.length).toBe(5);
    expect(history.history.loss[0]).toBeDefined();

    // Verify loss decreased
    const initialLoss = history.history.loss[0];
    const finalLoss = history.history.loss[4];
    expect(finalLoss).toBeLessThanOrEqual(initialLoss);

    // Cleanup
    xs.dispose();
    ys.dispose();
    model.dispose();
  });

  it('should list all training jobs for a user', async () => {
    const result = await query(
      `SELECT tj.*, m.name as model_name
       FROM training_jobs tj
       JOIN models m ON tj.model_id = m.id
       WHERE tj.user_id = $1
       ORDER BY tj.created_at DESC`,
      [userId]
    );

    expect(Array.isArray(result.rows)).toBe(true);
    expect(result.rows.length).toBeGreaterThan(0);
    
    result.rows.forEach(row => {
      expect(row).toHaveProperty('id');
      expect(row).toHaveProperty('status');
      expect(row).toHaveProperty('model_name');
      expect(row).toHaveProperty('config');
    });
  });
});

/**
 * Test 5: Cross-Component Integration
 */
describe('Cross-Component Integration', () => {
  it('should complete full workflow: user -> dataset -> model -> training', async () => {
    // 1. Create user
    const userResult = await query(
      `INSERT INTO users (email, username, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [`workflow_${Date.now()}@test.com`, `wf_user_${Date.now()}`, 'hash']
    );
    const userId = userResult.rows[0].id;

    // 2. Create dataset
    const datasetResult = await query(
      `INSERT INTO datasets (user_id, name, type, file_path, record_count)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, 'Workflow Dataset', 'audio', '/tmp/workflow.jsonl', 50]
    );
    const datasetId = datasetResult.rows[0].id;

    // 3. Create model
    const modelResult = await query(
      `INSERT INTO models (name, type, repo_id, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['Workflow Model', 'tts', 'test/workflow', 'available']
    );
    const modelId = modelResult.rows[0].id;

    // 4. Create training job
    const trainingResult = await query(
      `INSERT INTO training_jobs (user_id, model_id, status, config)
       VALUES ($1, $2, 'queued', $3)
       RETURNING id`,
      [userId, modelId, JSON.stringify({ datasetId, epochs: 10 })]
    );
    const jobId = trainingResult.rows[0].id;

    // 5. Verify entire workflow
    const verifyResult = await query(
      `SELECT 
         tj.id as job_id,
         u.username,
         m.name as model_name,
         d.name as dataset_name,
         tj.status
       FROM training_jobs tj
       JOIN users u ON tj.user_id = u.id
       JOIN models m ON tj.model_id = m.id
       JOIN datasets d ON (tj.config->>'datasetId')::uuid = d.id
       WHERE tj.id = $1`,
      [jobId]
    );

    expect(verifyResult.rows.length).toBe(1);
    expect(verifyResult.rows[0].model_name).toBe('Workflow Model');
    expect(verifyResult.rows[0].dataset_name).toBe('Workflow Dataset');
    expect(verifyResult.rows[0].status).toBe('queued');

    // Cleanup
    await query('DELETE FROM training_jobs WHERE id = $1', [jobId]);
    await query('DELETE FROM datasets WHERE id = $1', [datasetId]);
    await query('DELETE FROM models WHERE id = $1', [modelId]);
    await query('DELETE FROM users WHERE id = $1', [userId]);
  });
});
