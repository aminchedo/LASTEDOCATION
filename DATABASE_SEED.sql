-- Database Seed Data for Persian TTS/AI Platform
-- This file provides sample data for testing and development

-- Note: Run this after the schema has been created
-- psql $DATABASE_URL < DATABASE_SEED.sql

-- Insert test user (password is 'password' hashed with bcrypt)
INSERT INTO users (id, email, username, password_hash, role, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'admin', 
   '$2a$10$rBV2kYhY5cM8vDYCKqJbO.w3qQMYqS4YpYn2YfF8J5YBqU0JtGj4e', 'admin', NOW()),
  ('00000000-0000-0000-0000-000000000002', 'test@example.com', 'testuser', 
   '$2a$10$rBV2kYhY5cM8vDYCKqJbO.w3qQMYqS4YpYn2YfF8J5YBqU0JtGj4e', 'user', NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert sample models from HuggingFace
INSERT INTO models (id, name, type, repo_id, size_mb, status, metadata, created_at)
VALUES 
  ('10000000-0000-0000-0000-000000000001', 'Persian TTS Male VITS', 'tts', 
   'Kamtera/persian-tts-male-vits', 150, 'available',
   '{"author": "Kamtera", "downloads": 1234, "tags": ["persian", "tts", "vits"]}', NOW()),
  
  ('10000000-0000-0000-0000-000000000002', 'Persian STT Whisper', 'stt', 
   'openai/whisper-large-v3', 2900, 'available',
   '{"author": "OpenAI", "downloads": 50000, "tags": ["persian", "stt", "whisper"]}', NOW()),
  
  ('10000000-0000-0000-0000-000000000003', 'Persian LLM', 'llm', 
   'HooshvareLab/bert-fa-base-uncased', 435, 'available',
   '{"author": "HooshvareLab", "downloads": 5000, "tags": ["persian", "bert", "llm"]}', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample user settings
INSERT INTO user_settings (id, user_id, huggingface_token, auto_download, max_concurrent_downloads, updated_at)
VALUES 
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 
   NULL, false, 2, NOW()),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 
   NULL, false, 2, NOW())
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample dataset
INSERT INTO datasets (id, user_id, name, type, file_path, size_mb, record_count, metadata, created_at)
VALUES 
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'Persian Common Voice Sample', 'audio', 'data/datasets/persian_cv_sample.csv', 
   25.5, 1000, '{"language": "fa", "duration_hours": 5.5}', NOW()),
  
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   'Persian Text Corpus', 'text', 'data/datasets/persian_text.txt', 
   10.2, 50000, '{"language": "fa", "domain": "general"}', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample training job (completed)
INSERT INTO training_jobs (id, user_id, model_id, status, progress, config, metrics, started_at, completed_at, created_at)
VALUES 
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001', 'completed', 100,
   '{"modelType": "simple", "epochs": 10, "batchSize": 32, "learningRate": 0.001, "validationSplit": 0.2}'::jsonb,
   '{"epoch": 10, "step": 100, "loss": 0.234, "accuracy": 0.89, "valLoss": 0.245, "valAccuracy": 0.88}'::jsonb,
   NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- Insert sample training job (running)
INSERT INTO training_jobs (id, user_id, model_id, status, progress, config, metrics, started_at, created_at)
VALUES 
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000002', 'running', 45,
   '{"modelType": "lstm", "epochs": 20, "batchSize": 16, "learningRate": 0.0005, "validationSplit": 0.2}'::jsonb,
   '{"epoch": 9, "step": 450, "loss": 0.456, "accuracy": 0.76, "valLoss": 0.478}'::jsonb,
   NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;

-- Insert sample checkpoints for the completed job
INSERT INTO checkpoints (id, training_job_id, epoch, step, loss, accuracy, file_path, metadata, created_at)
VALUES 
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
   5, 50, 0.345, 0.82, 'models/checkpoints/job_40000000-0000-0000-0000-000000000001/epoch_5',
   '{"valLoss": 0.356, "valAccuracy": 0.81}'::jsonb, NOW() - INTERVAL '90 minutes'),
  
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001',
   10, 100, 0.234, 0.89, 'models/checkpoints/job_40000000-0000-0000-0000-000000000001/epoch_10',
   '{"valLoss": 0.245, "valAccuracy": 0.88}'::jsonb, NOW() - INTERVAL '60 minutes')
ON CONFLICT (id) DO NOTHING;

-- Insert sample download queue (completed download)
INSERT INTO download_queue (id, model_id, user_id, status, progress, bytes_downloaded, bytes_total, current_file, started_at, completed_at, created_at)
VALUES 
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001', 'completed', 100, 157286400, 157286400, 
   'model.safetensors', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 30 minutes', NOW() - INTERVAL '3 hours')
ON CONFLICT (id) DO NOTHING;

-- Insert sample download queue (in progress)
INSERT INTO download_queue (id, model_id, user_id, status, progress, bytes_downloaded, bytes_total, current_file, started_at, created_at)
VALUES 
  ('60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001', 'downloading', 67, 1940000000, 2900000000, 
   'pytorch_model.bin', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes')
ON CONFLICT (id) DO NOTHING;

-- Update model statuses based on downloads
UPDATE models 
SET status = 'installed', 
    file_path = 'models/Kamtera_persian-tts-male-vits',
    download_progress = 100
WHERE id = '10000000-0000-0000-0000-000000000001';

UPDATE models 
SET status = 'downloading', 
    download_progress = 67
WHERE id = '10000000-0000-0000-0000-000000000002';

-- Display summary
SELECT 
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM models) as models_count,
  (SELECT COUNT(*) FROM training_jobs) as training_jobs_count,
  (SELECT COUNT(*) FROM datasets) as datasets_count,
  (SELECT COUNT(*) FROM download_queue) as downloads_count,
  (SELECT COUNT(*) FROM checkpoints) as checkpoints_count;

-- Display test credentials
SELECT 
  '===== TEST CREDENTIALS =====' as info
UNION ALL
SELECT 'Email: admin@example.com'
UNION ALL
SELECT 'Password: password'
UNION ALL
SELECT ''
UNION ALL
SELECT 'Email: test@example.com'
UNION ALL
SELECT 'Password: password'
UNION ALL
SELECT '==========================';

-- Display sample data summary
SELECT 
  '===== SAMPLE DATA SUMMARY =====' as info
UNION ALL
SELECT CONCAT('Users: ', COUNT(*)) FROM users
UNION ALL
SELECT CONCAT('Models: ', COUNT(*)) FROM models
UNION ALL
SELECT CONCAT('  - Available: ', COUNT(*)) FROM models WHERE status = 'available'
UNION ALL
SELECT CONCAT('  - Downloading: ', COUNT(*)) FROM models WHERE status = 'downloading'
UNION ALL
SELECT CONCAT('  - Installed: ', COUNT(*)) FROM models WHERE status = 'installed'
UNION ALL
SELECT CONCAT('Training Jobs: ', COUNT(*)) FROM training_jobs
UNION ALL
SELECT CONCAT('  - Running: ', COUNT(*)) FROM training_jobs WHERE status = 'running'
UNION ALL
SELECT CONCAT('  - Completed: ', COUNT(*)) FROM training_jobs WHERE status = 'completed'
UNION ALL
SELECT CONCAT('Datasets: ', COUNT(*)) FROM datasets
UNION ALL
SELECT CONCAT('Downloads: ', COUNT(*)) FROM download_queue
UNION ALL
SELECT CONCAT('Checkpoints: ', COUNT(*)) FROM checkpoints
UNION ALL
SELECT '================================';

COMMIT;
