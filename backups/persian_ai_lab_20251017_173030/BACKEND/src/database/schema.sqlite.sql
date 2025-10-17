-- SQLite schema for Persian TTS/AI Platform
-- This schema provides full persistence for all platform features

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Models table
CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'tts', 'stt', 'llm', 'embedding', 'classification'
  repo_id TEXT,
  size_mb INTEGER,
  status TEXT DEFAULT 'available', -- 'available', 'downloading', 'installed'
  download_progress INTEGER DEFAULT 0,
  file_path TEXT,
  metadata TEXT, -- JSON stored as TEXT
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Training jobs table
CREATE TABLE IF NOT EXISTS training_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  model_id TEXT REFERENCES models(id),
  status TEXT DEFAULT 'queued', -- 'queued', 'running', 'completed', 'failed', 'cancelled'
  progress INTEGER DEFAULT 0,
  config TEXT NOT NULL, -- JSON stored as TEXT
  metrics TEXT, -- JSON stored as TEXT
  error_message TEXT,
  started_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Datasets table
CREATE TABLE IF NOT EXISTS datasets (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'audio', 'text', 'csv'
  file_path TEXT NOT NULL,
  size_mb REAL,
  record_count INTEGER,
  metadata TEXT, -- JSON stored as TEXT
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Download queue table
CREATE TABLE IF NOT EXISTS download_queue (
  id TEXT PRIMARY KEY,
  model_id TEXT REFERENCES models(id),
  user_id TEXT REFERENCES users(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'downloading', 'completed', 'failed'
  progress INTEGER DEFAULT 0,
  bytes_downloaded INTEGER DEFAULT 0,
  bytes_total INTEGER,
  current_file TEXT,
  error_message TEXT,
  started_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) UNIQUE,
  huggingface_token TEXT,
  huggingface_api_url TEXT DEFAULT 'https://huggingface.co',
  auto_download INTEGER DEFAULT 0, -- Boolean as INTEGER
  max_concurrent_downloads INTEGER DEFAULT 2,
  settings_json TEXT, -- JSON stored as TEXT
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Checkpoints table (for training)
CREATE TABLE IF NOT EXISTS checkpoints (
  id TEXT PRIMARY KEY,
  training_job_id TEXT REFERENCES training_jobs(id),
  epoch INTEGER NOT NULL,
  step INTEGER NOT NULL,
  loss REAL,
  accuracy REAL,
  file_path TEXT,
  metadata TEXT, -- JSON stored as TEXT
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_models_type ON models(type);
CREATE INDEX IF NOT EXISTS idx_models_status ON models(status);
CREATE INDEX IF NOT EXISTS idx_training_jobs_user_id ON training_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_training_jobs_status ON training_jobs(status);
CREATE INDEX IF NOT EXISTS idx_download_queue_status ON download_queue(status);
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_training_job_id ON checkpoints(training_job_id);

-- Create triggers for updated_at columns
-- SQLite doesn't support stored procedures, so we use triggers directly

CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_models_updated_at 
AFTER UPDATE ON models
BEGIN
  UPDATE models SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_user_settings_updated_at 
AFTER UPDATE ON user_settings
BEGIN
  UPDATE user_settings SET updated_at = datetime('now') WHERE id = NEW.id;
END;