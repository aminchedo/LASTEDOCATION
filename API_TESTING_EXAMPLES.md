# 🧪 API Testing Examples

This guide provides curl commands and examples for testing all API endpoints.

---

## 🔧 Setup

### Set Base URL
```bash
export API_BASE="http://localhost:3001"
# Or for production
# export API_BASE="https://api.yourdomain.com"
```

### Get Authentication Token
First, login to get a token:
```bash
TOKEN=$(curl -s -X POST "$API_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | jq -r '.token')

echo "Token: $TOKEN"
```

---

## 🔐 Authentication Endpoints

### 1. Register New User
```bash
curl -X POST "$API_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "name": "New User"
  }' | jq
```

**Expected Response (200)**:
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "abc123",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "user"
  }
}
```

---

### 2. Login
```bash
curl -X POST "$API_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }' | jq
```

**Expected Response (200)**:
```json
{
  "ok": true,
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

---

### 3. Get Current User (Protected)
```bash
curl -X GET "$API_BASE/api/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected Response (200)**:
```json
{
  "ok": true,
  "user": {
    "id": "123",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

---

### 4. Verify Token
```bash
curl -X POST "$API_BASE/api/auth/verify" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$TOKEN\"}" | jq
```

---

### 5. Logout
```bash
curl -X POST "$API_BASE/api/auth/logout" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 📊 Dataset Endpoints

### 1. List All Datasets
```bash
curl -X GET "$API_BASE/api/datasets" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected Response (200)**:
```json
{
  "ok": true,
  "datasets": [
    {
      "id": "1234567890",
      "name": "test-dataset.jsonl",
      "filename": "test-dataset.jsonl",
      "path": "/path/to/dataset",
      "size": 1024,
      "type": "jsonl",
      "uploaded_at": "2025-10-13T00:00:00.000Z"
    }
  ]
}
```

---

### 2. Upload Dataset
```bash
curl -X POST "$API_BASE/api/datasets/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test_data/sample_dataset.csv" \
  -F "name=My Test Dataset" | jq
```

**Expected Response (200)**:
```json
{
  "ok": true,
  "dataset": {
    "id": "1234567890",
    "name": "My Test Dataset",
    "filename": "1234567890-sample_dataset.csv",
    "path": "/path/to/file",
    "size": 2048,
    "type": "csv",
    "uploaded_at": "2025-10-13T04:00:00.000Z"
  }
}
```

---

### 3. Get Dataset by ID
```bash
DATASET_ID="1234567890"
curl -X GET "$API_BASE/api/datasets/$DATASET_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

### 4. Delete Dataset
```bash
DATASET_ID="1234567890"
curl -X DELETE "$API_BASE/api/datasets/$DATASET_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected Response (200)**:
```json
{
  "ok": true,
  "message": "Dataset deleted successfully"
}
```

---

### 5. Preview Dataset
```bash
DATASET_ID="test-dataset"
curl -X GET "$API_BASE/api/datasets/preview/$DATASET_ID?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

### 6. Validate Dataset
```bash
DATASET_ID="test-dataset"
curl -X GET "$API_BASE/api/datasets/validate/$DATASET_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 🚂 Training Job Endpoints

### 1. Create Training Job
```bash
curl -X POST "$API_BASE/api/training" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset": "data/datasets/test-dataset.jsonl",
    "epochs": 5,
    "batch_size": 32,
    "lr": 0.001
  }' | jq
```

**Expected Response (200)**:
```json
{
  "ok": true,
  "job_id": "job_1234567890_abc123",
  "pid": 12345,
  "status": "QUEUED",
  "message": "Training job started"
}
```

---

### 2. Get Job Status
```bash
JOB_ID="job_1234567890_abc123"
curl -X GET "$API_BASE/api/training/status?job_id=$JOB_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected Response (200)**:
```json
{
  "ok": true,
  "status": {
    "job_id": "job_1234567890_abc123",
    "status": "RUNNING",
    "progress": 35.5,
    "epoch": 2,
    "step": 150,
    "total_steps": 500,
    "loss": 0.234567,
    "message": "Training epoch 2/5",
    "created_at": "2025-10-13T04:00:00.000Z",
    "updated_at": "2025-10-13T04:05:00.000Z"
  }
}
```

---

### 3. List All Jobs
```bash
curl -X GET "$API_BASE/api/training/jobs" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected Response (200)**:
```json
{
  "ok": true,
  "jobs": [
    {
      "job_id": "job_1234567890_abc123",
      "status": "COMPLETED",
      "progress": 100,
      "created_at": "2025-10-13T04:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 4. Stop Training Job
```bash
JOB_ID="job_1234567890_abc123"
curl -X POST "$API_BASE/api/training/$JOB_ID/stop" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Expected Response (200)**:
```json
{
  "ok": true,
  "job_id": "job_1234567890_abc123",
  "status": "STOPPED",
  "message": "Training job stopped"
}
```

---

### 5. Download Trained Model
```bash
JOB_ID="job_1234567890_abc123"
curl -X GET "$API_BASE/api/training/$JOB_ID/download" \
  -H "Authorization: Bearer $TOKEN" \
  -o "model_${JOB_ID}.pt"

# Check download
ls -lh "model_${JOB_ID}.pt"
```

---

## 🔌 WebSocket Testing

### Using wscat
```bash
# Install wscat if not installed
npm install -g wscat

# Connect to WebSocket
wscat -c "ws://localhost:3001" \
  -H "Authorization: Bearer $TOKEN"

# After connection, subscribe to a job
> {"type": "subscribe_job", "jobId": "job_1234567890_abc123"}

# You should receive updates like:
< {"type": "job_update", "status": {...}}
```

### Using JavaScript (Browser Console)
```javascript
const token = 'YOUR_TOKEN_HERE';
const socket = io('http://localhost:3001', {
  auth: { token }
});

socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('subscribe_job', 'job_1234567890_abc123');
});

socket.on('job_update', (status) => {
  console.log('Job update:', status);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

---

## 📚 API Documentation

### Access Swagger UI
```bash
# In browser
open "$API_BASE/api-docs"

# Or get JSON spec
curl -X GET "$API_BASE/api-docs.json" | jq > api-spec.json
```

---

## 🏥 Health Check Endpoints

### Backend Health
```bash
curl -X GET "$API_BASE/health" | jq
```

**Expected Response (200)**:
```json
{
  "ok": true,
  "timestamp": "2025-10-13T04:00:00.000Z",
  "service": "persian-chat-backend"
}
```

---

### API Health
```bash
curl -X GET "$API_BASE/api/health" | jq
```

**Expected Response (200)**:
```json
{
  "ok": true,
  "services": {
    "auth": true,
    "chat": true,
    "training": true,
    "download": true,
    "monitoring": true,
    "sources": true,
    "stt": true,
    "tts": true,
    "search": true,
    "notifications": true
  },
  "timestamp": "2025-10-13T04:00:00.000Z"
}
```

---

## 🔐 Error Response Examples

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Access token required",
  "message": "لطفاً توکن دسترسی را ارسال کنید"
}
```

### 400 Bad Request
```json
{
  "ok": false,
  "error": "Email, password, and name are required"
}
```

### 404 Not Found
```json
{
  "ok": false,
  "error": "Job not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal Server Error",
  "code": "INTERNAL_ERROR",
  "timestamp": "2025-10-13T04:00:00.000Z"
}
```

---

## 🧪 Complete Test Script

Save this as `test-api.sh`:

```bash
#!/bin/bash

API_BASE="http://localhost:3001"

echo "=== Testing ML Training Platform API ==="
echo ""

# 1. Login
echo "1. Testing login..."
RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

TOKEN=$(echo $RESPONSE | jq -r '.token')

if [ "$TOKEN" != "null" ]; then
  echo "✓ Login successful"
else
  echo "✗ Login failed"
  exit 1
fi

# 2. Get current user
echo "2. Testing /api/auth/me..."
ME_RESPONSE=$(curl -s -X GET "$API_BASE/api/auth/me" \
  -H "Authorization: Bearer $TOKEN")

EMAIL=$(echo $ME_RESPONSE | jq -r '.user.email')
if [ "$EMAIL" == "admin@example.com" ]; then
  echo "✓ Get current user successful"
else
  echo "✗ Get current user failed"
fi

# 3. List datasets
echo "3. Testing dataset listing..."
DATASETS_RESPONSE=$(curl -s -X GET "$API_BASE/api/datasets" \
  -H "Authorization: Bearer $TOKEN")

DATASETS_OK=$(echo $DATASETS_RESPONSE | jq -r '.ok')
if [ "$DATASETS_OK" == "true" ]; then
  echo "✓ Dataset listing successful"
else
  echo "✗ Dataset listing failed"
fi

# 4. List training jobs
echo "4. Testing job listing..."
JOBS_RESPONSE=$(curl -s -X GET "$API_BASE/api/training/jobs" \
  -H "Authorization: Bearer $TOKEN")

JOBS_OK=$(echo $JOBS_RESPONSE | jq -r '.ok')
if [ "$JOBS_OK" == "true" ]; then
  echo "✓ Job listing successful"
else
  echo "✗ Job listing failed"
fi

# 5. Health check
echo "5. Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -X GET "$API_BASE/health")

HEALTH_OK=$(echo $HEALTH_RESPONSE | jq -r '.ok')
if [ "$HEALTH_OK" == "true" ]; then
  echo "✓ Health check successful"
else
  echo "✗ Health check failed"
fi

echo ""
echo "=== All API tests completed ==="
```

Run with:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 📊 Rate Limiting

The API may implement rate limiting. If you hit rate limits:

```json
{
  "error": "Too many requests, please try again later."
}
```

Wait 60 seconds and try again.

---

## 🔧 Troubleshooting

### Token Expired
If you get 401 errors, refresh your token:
```bash
# Get new token
TOKEN=$(curl -s -X POST "$API_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | jq -r '.token')
```

### Connection Refused
Check if backend is running:
```bash
curl -X GET "$API_BASE/health"
# If this fails, start the backend:
# cd BACKEND && npm run dev
```

### CORS Errors
If testing from browser, ensure CORS_ORIGIN includes your origin in `.env`.

---

**Last Updated**: 2025-10-13  
**API Version**: 1.0
