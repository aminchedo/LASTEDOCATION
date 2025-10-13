# Training API Usage Guide

Quick reference for using the newly implemented training system.

---

## 🚀 Quick Start

### 1. Start the Backend Server

```bash
cd /workspace/BACKEND
npm run build
PORT=3001 node dist/src/server.js
```

**Or use PM2 for production**:
```bash
cd /workspace/BACKEND
pm2 start dist/src/server.js --name "training-api" -- --port 3001
```

---

## 📋 Basic Operations

### Check Server Health

```bash
curl http://127.0.0.1:3001/health
```

**Expected Response**:
```json
{
  "ok": true,
  "timestamp": "2025-10-13T...",
  "service": "persian-chat-backend"
}
```

---

### Create a Training Job

**Simple (use defaults)**:
```bash
curl -X POST http://127.0.0.1:3001/api/train \
  -H "Content-Type: application/json" \
  -d '{"epochs":3,"batch_size":16,"lr":0.01}'
```

**With Custom Dataset**:
```bash
curl -X POST http://127.0.0.1:3001/api/train \
  -H "Content-Type: application/json" \
  -d '{
    "epochs": 5,
    "batch_size": 32,
    "lr": 0.001,
    "dataset": "test_data/sample_dataset.csv"
  }'
```

**Response**:
```json
{
  "ok": true,
  "job_id": "job_1697299200000_a1b2c3d4",
  "pid": 12345,
  "status": "QUEUED",
  "message": "Training job started"
}
```

---

### Check Job Status

```bash
curl "http://127.0.0.1:3001/api/train/status?job_id=job_1697299200000_a1b2c3d4"
```

**Response (Running)**:
```json
{
  "ok": true,
  "status": {
    "job_id": "job_1697299200000_a1b2c3d4",
    "status": "RUNNING",
    "progress": 45.5,
    "epoch": 2,
    "step": 23,
    "total_steps": 50,
    "loss": 0.234567,
    "message": "Training epoch 2/5",
    "created_at": 1697299200.0
  }
}
```

**Response (Completed)**:
```json
{
  "ok": true,
  "status": {
    "job_id": "job_1697299200000_a1b2c3d4",
    "status": "COMPLETED",
    "progress": 100.0,
    "epoch": 5,
    "loss": 0.012345,
    "message": "Training completed successfully",
    "checkpoint": "models/job_1697299200000_a1b2c3d4.pt",
    "finished_at": 1697299400.0
  }
}
```

---

### List All Jobs

```bash
curl http://127.0.0.1:3001/api/train/jobs
```

**Response**:
```json
{
  "ok": true,
  "jobs": [
    {
      "job_id": "job_1697299200000_a1b2c3d4",
      "status": "COMPLETED",
      "progress": 100.0,
      ...
    },
    {
      "job_id": "job_1697299300000_e5f6g7h8",
      "status": "RUNNING",
      "progress": 67.3,
      ...
    }
  ],
  "count": 2
}
```

---

### Stop a Running Job

```bash
curl -X POST http://127.0.0.1:3001/api/train/stop \
  -H "Content-Type: application/json" \
  -d '{"job_id": "job_1697299200000_a1b2c3d4"}'
```

**Response**:
```json
{
  "ok": true,
  "job_id": "job_1697299200000_a1b2c3d4",
  "status": "STOPPED",
  "message": "Training job stopped"
}
```

---

## 🛠️ Helper Scripts

### Quick Train (Interactive)

```bash
# Use defaults (3 epochs, batch 16, lr 0.01)
./scripts/quick_train.sh

# Custom parameters
./scripts/quick_train.sh 5 32 0.001

# With dataset
./scripts/quick_train.sh 3 16 0.01 test_data/sample_dataset.csv
```

### End-to-End Test

```bash
./scripts/test_training_api.sh
```

This will:
1. Check server health
2. Create a training job
3. Monitor progress
4. Verify artifacts
5. Check model checkpoint
6. List all jobs

---

## 📂 File Locations

### Job Status Files
Location: `artifacts/jobs/<job_id>.json`

Each job creates a JSON file with its current status:
```json
{
  "job_id": "job_1697299200000_a1b2c3d4",
  "status": "RUNNING",
  "progress": 45.5,
  "epoch": 2,
  "step": 23,
  "total_steps": 50,
  "loss": 0.234567,
  "message": "Training epoch 2/5",
  "created_at": 1697299200.0
}
```

### Model Checkpoints
Location: `models/<job_id>.pt`

PyTorch model state dict saved on completion:
```bash
ls -lh models/
# -rw-r--r-- 1 user user 2.1K Oct 13 01:45 job_1697299200000_a1b2c3d4.pt
```

---

## 🔄 Monitoring Job Progress

### Watch Command (Auto-refresh)

```bash
watch -n 2 "curl -s 'http://127.0.0.1:3001/api/train/status?job_id=JOB_ID'"
```

### Poll Script

```bash
#!/bin/bash
JOB_ID="job_1697299200000_a1b2c3d4"

while true; do
  STATUS=$(curl -s "http://127.0.0.1:3001/api/train/status?job_id=${JOB_ID}")
  echo "$(date): $STATUS" | grep -E 'status|progress|epoch|loss'
  
  if echo "$STATUS" | grep -q '"status":"COMPLETED"'; then
    echo "Training completed!"
    break
  fi
  
  sleep 2
done
```

---

## 🎯 Job Status Values

| Status | Description |
|--------|-------------|
| `QUEUED` | Job created, waiting to start |
| `STARTING` | Initializing training |
| `LOADING` | Loading dataset |
| `RUNNING` | Training in progress |
| `COMPLETED` | Training finished successfully |
| `STOPPED` | Stopped by user |
| `ERROR` | Training failed |

---

## 📊 Parameters Reference

### Training Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `epochs` | int | 3 | Number of training epochs |
| `batch_size` | int | 16 | Training batch size |
| `lr` | float | 0.01 | Learning rate |
| `dataset` | string | null | Path to dataset CSV/JSONL (optional) |

### Dataset Format

**CSV Format**:
```csv
x,y
0.1,0.25
0.2,0.45
0.3,0.65
```

**JSONL Format**:
```jsonl
{"x": 0.1, "y": 0.25}
{"x": 0.2, "y": 0.45}
{"x": 0.3, "y": 0.65}
```

If no dataset is provided, synthetic data is generated automatically.

---

## 🐛 Troubleshooting

### Server Not Responding

```bash
# Check if server is running
ps aux | grep node

# Check port
netstat -tulpn | grep 3001

# Check logs
tail -f BACKEND/logs/*.log
```

### Job Stuck in QUEUED

```bash
# Check if Python process started
ps aux | grep python

# Check job file
cat artifacts/jobs/<job_id>.json

# Try running Python script directly
python3 scripts/train_minimal_job.py --job_id test --epochs 1
```

### Model Not Saved

```bash
# Check if training completed
curl "http://127.0.0.1:3001/api/train/status?job_id=<job_id>"

# Check models directory
ls -la models/

# Check file permissions
ls -ld models/
```

---

## 🔧 Advanced Usage

### Custom Python Training

You can replace `scripts/train_minimal_job.py` with your own training script.

**Requirements**:
1. Accept `--job_id` parameter
2. Write status to `artifacts/jobs/<job_id>.json`
3. Save model to `models/<job_id>.pt`
4. Use this JSON format:

```python
import json
from pathlib import Path

def write_status(job_id, status_dict):
    out = Path("artifacts/jobs")
    out.mkdir(parents=True, exist_ok=True)
    path = out / f"{job_id}.json"
    with open(path, "w") as f:
        json.dump(status_dict, f, indent=2)

# Update status during training
write_status(job_id, {
    "job_id": job_id,
    "status": "RUNNING",
    "progress": 50.0,
    "epoch": 2,
    "loss": 0.123
})
```

---

## 📈 Production Deployment

### Using PM2

```bash
cd /workspace/BACKEND
npm run build

# Start with PM2
pm2 start dist/src/server.js --name "training-api" \
  --env production \
  -- --port 3001

# Save PM2 config
pm2 save
pm2 startup
```

### Using Docker

```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Check logs
docker-compose logs -f backend
```

---

## 🎉 Next Steps

1. ✅ Server is running
2. ✅ Training API is functional
3. ✅ Create your first job
4. ✅ Monitor progress
5. ✅ Verify model checkpoint

**You're ready to train models!**

For more details, see:
- `/workspace/IMPLEMENTATION_SUCCESS.md` - Full implementation details
- `/workspace/discovery/patch_apply/FINAL_RESULTS.txt` - Summary
- `/workspace/scripts/train_minimal_job.py` - Training script source
- `/workspace/BACKEND/src/routes/trainJobsAPI.ts` - API source
