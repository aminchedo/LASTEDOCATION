-- SQLite schema for single-model training system
-- This file is used to initialize the training database if it doesn't exist

CREATE TABLE IF NOT EXISTS training_runs (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL DEFAULT 'idle',              -- 'idle' | 'running' | 'paused' | 'stopped' | 'completed' | 'error'
  total_epochs INTEGER NOT NULL,
  current_epoch INTEGER NOT NULL DEFAULT 0,
  total_steps INTEGER NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 0,
  best_metric REAL,
  best_checkpoint_id TEXT,
  notes TEXT,
  config TEXT NOT NULL                              -- JSON string of training configuration
);

CREATE TABLE IF NOT EXISTS checkpoints (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  path TEXT NOT NULL,
  tag TEXT,                                         -- 'latest' | 'best' | 'manual'
  metric REAL,
  resume_token TEXT,                                -- JSON string of optimizer state
  FOREIGN KEY(run_id) REFERENCES training_runs(id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_training_runs_status ON training_runs(status);
CREATE INDEX IF NOT EXISTS idx_checkpoints_run_id ON checkpoints(run_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_tag ON checkpoints(tag);
