import sqlite3
import json
from datetime import datetime
from pathlib import Path
from config import settings

def init_db():
    conn = sqlite3.connect(settings.DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS jobs (
            job_id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            progress INTEGER DEFAULT 0,
            metrics TEXT,
            model_path TEXT,
            error TEXT,
            rows_trained INTEGER,
            feature_columns TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

def create_job(job_id: str):
    conn = sqlite3.connect(settings.DB_PATH)
    now = datetime.utcnow().isoformat()
    conn.execute(
        'INSERT INTO jobs (job_id, status, progress, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        (job_id, 'queued', 0, now, now)
    )
    conn.commit()
    conn.close()

def update_job(job_id: str, **kwargs):
    conn = sqlite3.connect(settings.DB_PATH)
    now = datetime.utcnow().isoformat()
    
    fields = []
    values = []
    for key, value in kwargs.items():
        if key in ['metrics', 'feature_columns'] and value is not None:
            value = json.dumps(value)
        fields.append(f'{key} = ?')
        values.append(value)
    
    fields.append('updated_at = ?')
    values.append(now)
    values.append(job_id)
    
    query = f"UPDATE jobs SET {', '.join(fields)} WHERE job_id = ?"
    conn.execute(query, values)
    conn.commit()
    conn.close()

def get_job(job_id: str):
    conn = sqlite3.connect(settings.DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.execute('SELECT * FROM jobs WHERE job_id = ?', (job_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    job = dict(row)
    for field in ['metrics', 'feature_columns']:
        if job[field]:
            job[field] = json.loads(job[field])
    return job

init_db()
