# API Examples

## ML Service (Port 8000)

### Health Check
```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "ok",
  "time": "2025-10-12T17:57:22.123456"
}
```

### Train Model
```bash
curl -X POST http://localhost:8000/train \
  -F "file=@training_data.csv"
```

Response:
```json
{
  "job_id": "job-abc123",
  "status": "queued"
}
```

### Check Training Status
```bash
curl http://localhost:8000/train/status/job-abc123
```

Response (in progress):
```json
{
  "job_id": "job-abc123",
  "status": "running",
  "progress": 60,
  "created_at": "2025-10-12T17:57:22.123456",
  "updated_at": "2025-10-12T17:57:24.123456"
}
```

Response (completed):
```json
{
  "job_id": "job-abc123",
  "status": "completed",
  "progress": 100,
  "metrics": {
    "rmse_lat": 0.001234,
    "rmse_lon": 0.001456,
    "rmse_combined": 0.001345,
    "mae_lat": 0.000987,
    "r2_lat": 0.9876
  },
  "model_path": "/app/models/model_20251012_175722.pkl",
  "rows_trained": 1000,
  "feature_columns": ["hour", "day_of_week", "month", "feature_speed", "feature_bearing"],
  "created_at": "2025-10-12T17:57:22.123456",
  "updated_at": "2025-10-12T17:57:30.123456"
}
```

### Predict Location
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "timestamp": "2025-10-12T12:00:00Z",
      "feature_speed": 1.2,
      "feature_bearing": 270
    }
  }'
```

Response:
```json
{
  "predicted_latitude": 59.914494,
  "predicted_longitude": 10.753176,
  "model_path": "/app/models/model_20251012_175722.pkl",
  "timestamp": "2025-10-12T17:58:00.123456"
}
```

### Predict with Specific Model
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "timestamp": "2025-10-12T12:00:00Z",
      "feature_speed": 1.2,
      "feature_bearing": 270
    },
    "model_path": "/app/models/model_20251012_175722.pkl"
  }'
```

### List Models
```bash
curl http://localhost:8000/models/list
```

Response:
```json
[
  {
    "model_path": "/app/models/model_20251012_175722.pkl",
    "timestamp": "20251012_175722",
    "feature_columns": ["hour", "day_of_week", "month", "feature_speed", "feature_bearing"]
  },
  {
    "model_path": "/app/models/model_20251012_173045.pkl",
    "timestamp": "20251012_173045",
    "feature_columns": ["hour", "day_of_week", "month", "feature_speed"]
  }
]
```

## Backend Proxy (Port 3001)

All ML endpoints are proxied through `/api/models/*`:

### Train Model
```bash
curl -X POST http://localhost:3001/api/models/train \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@training_data.csv"
```

### Check Status
```bash
curl http://localhost:3001/api/models/status/job-abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Predict
```bash
curl -X POST http://localhost:3001/api/models/predict \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "timestamp": "2025-10-12T12:00:00Z",
      "feature_speed": 1.2,
      "feature_bearing": 270
    }
  }'
```

### List Models
```bash
curl http://localhost:3001/api/models/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## JavaScript/TypeScript Examples

### Train Model
```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3001/api/models/train', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { job_id } = await response.json();
```

### Poll Status
```typescript
const pollStatus = async (jobId: string) => {
  const interval = setInterval(async () => {
    const response = await fetch(`http://localhost:3001/api/models/status/${jobId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const status = await response.json();
    
    console.log(`Progress: ${status.progress}%`);
    
    if (status.status === 'completed' || status.status === 'failed') {
      clearInterval(interval);
      console.log('Training finished:', status);
    }
  }, 2000);
};
```

### Predict
```typescript
const response = await fetch('http://localhost:3001/api/models/predict', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    features: {
      timestamp: new Date().toISOString(),
      feature_speed: 1.2,
      feature_bearing: 270
    }
  })
});

const { predicted_latitude, predicted_longitude } = await response.json();
```

## Python Examples

### Train Model
```python
import requests

with open('training_data.csv', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/train',
        files={'file': f}
    )
    
job_id = response.json()['job_id']
```

### Check Status
```python
import requests
import time

job_id = 'job-abc123'

while True:
    response = requests.get(f'http://localhost:8000/train/status/{job_id}')
    status = response.json()
    
    print(f"Progress: {status['progress']}%")
    
    if status['status'] in ['completed', 'failed']:
        print('Training finished:', status)
        break
    
    time.sleep(2)
```

### Predict
```python
import requests

response = requests.post(
    'http://localhost:8000/predict',
    json={
        'features': {
            'timestamp': '2025-10-12T12:00:00Z',
            'feature_speed': 1.2,
            'feature_bearing': 270
        }
    }
)

result = response.json()
print(f"Predicted: {result['predicted_latitude']}, {result['predicted_longitude']}")
```
