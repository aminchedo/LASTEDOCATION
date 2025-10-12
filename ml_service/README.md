# ML Service

FastAPI service for location prediction using RandomForest.

## Features

- **SQLite job tracking** (no external database)
- **Async training** with background tasks
- **Model versioning** with timestamps
- **REST API** with CORS enabled

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app:app --host 0.0.0.0 --port 8000

# Test
python3 test_local.py
```

## API Endpoints

- `GET /health` - Health check
- `POST /train` - Upload CSV and train model
- `GET /train/status/{job_id}` - Get training status
- `POST /predict` - Predict location
- `GET /models/list` - List trained models

## CSV Format

Required columns:
- `latitude` (float, -90 to 90)
- `longitude` (float, -180 to 180)

Optional columns:
- `timestamp` (ISO 8601)
- `feature_*` (any numeric features)
- `user_id` (ignored)

Example:
```csv
timestamp,latitude,longitude,feature_speed,feature_bearing
2025-10-12T10:00:00Z,59.9139,10.7522,1.2,270
```

## Configuration

Environment variables:
- `ML_SERVICE_PORT` - Port (default: 8000)
- `RANDOM_SEED` - Random seed (default: 2025)
- `N_ESTIMATORS` - RF trees (default: 100)
- `TEST_SIZE` - Train/test split (default: 0.2)
- `N_JOBS` - Parallel jobs (default: -1)
- `MAX_UPLOAD_MB` - Max file size (default: 50)

## Files

- `config.py` - Settings
- `database.py` - SQLite operations
- `modeling.py` - ML training/prediction
- `app.py` - FastAPI endpoints
- `jobs.db` - SQLite database (auto-created)
- `models/` - Trained model files
