from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import pandas as pd
import uuid
import logging
from pathlib import Path

from config import settings
from database import create_job, update_job, get_job
from modeling import train_model, save_model, load_model, extract_time_features

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

active_jobs = 0

class PredictionRequest(BaseModel):
    features: dict
    model_path: str = None

@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}

@app.post("/train")
async def train(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    global active_jobs
    
    if active_jobs >= 3:
        raise HTTPException(429, "Too many concurrent jobs")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(400, "Must be CSV")
    
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(413, "File too large")
    
    job_id = f"job-{uuid.uuid4()}"
    temp_file = settings.BASE_DIR / f'{job_id}.csv'
    temp_file.write_bytes(content)
    
    create_job(job_id)
    background_tasks.add_task(run_training, job_id, temp_file)
    
    return {"job_id": job_id, "status": "queued"}

async def run_training(job_id: str, csv_path: Path):
    global active_jobs
    active_jobs += 1
    
    try:
        update_job(job_id, status='running', progress=20)
        
        df = pd.read_csv(csv_path)
        update_job(job_id, status='running', progress=40)
        
        artifacts, metrics = train_model(df)
        update_job(job_id, status='running', progress=80)
        
        model_path = save_model(artifacts, job_id)
        
        update_job(
            job_id,
            status='completed',
            progress=100,
            metrics=metrics,
            model_path=model_path,
            rows_trained=len(df),
            feature_columns=artifacts['feature_cols']
        )
        
        csv_path.unlink()
        
    except Exception as e:
        logger.error(f"Training failed: {e}")
        update_job(job_id, status='failed', error=str(e))
    
    finally:
        active_jobs -= 1

@app.get("/train/status/{job_id}")
def status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job

@app.post("/predict")
def predict(req: PredictionRequest):
    if req.model_path:
        model_path = req.model_path
    else:
        models = list(settings.MODELS_DIR.glob("model_*.pkl"))
        if not models:
            raise HTTPException(404, "No models found")
        model_path = max(models, key=lambda p: p.stat().st_ctime)
    
    artifacts = load_model(model_path)
    
    df = pd.DataFrame([req.features])
    df = extract_time_features(df)
    
    for col in artifacts['feature_cols']:
        if col not in df.columns:
            df[col] = 0
    
    X = df[artifacts['feature_cols']]
    X_imputed = artifacts['imputer'].transform(X)
    X_scaled = artifacts['scaler'].transform(X_imputed)
    
    pred = artifacts['model'].predict(X_scaled)[0]
    
    return {
        'predicted_latitude': float(pred[0]),
        'predicted_longitude': float(pred[1]),
        'model_path': str(model_path),
        'timestamp': datetime.utcnow().isoformat()
    }

@app.get("/models/list")
def list_models():
    models = []
    for pkl_file in settings.MODELS_DIR.glob("model_*.pkl"):
        try:
            artifacts = load_model(pkl_file)
            models.append({
                'model_path': str(pkl_file),
                'timestamp': pkl_file.stem.replace('model_', ''),
                'feature_columns': artifacts.get('feature_cols', [])
            })
        except:
            pass
    
    models.sort(key=lambda x: x['timestamp'], reverse=True)
    return models
