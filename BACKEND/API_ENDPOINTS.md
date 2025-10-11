# 🚀 API Endpoints - Model Catalog & Downloads

## 📚 Catalog Endpoints

### Get All Models
```http
GET /api/sources/catalog
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "total": 8
}
```

---

### Get Model by ID
```http
GET /api/sources/catalog/:id
```

**Example:**
```bash
curl http://localhost:3000/api/sources/catalog/HooshvareLab%2Fbert-fa-base-uncased
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "HooshvareLab/bert-fa-base-uncased",
    "name": "Persian BERT Base",
    "type": "model",
    "size": "~440 MB",
    "downloadUrls": {
      "main": "https://huggingface.co/.../pytorch_model.bin",
      "config": "https://huggingface.co/.../config.json",
      "vocab": "https://huggingface.co/.../vocab.txt"
    }
  }
}
```

---

### Get Models by Type
```http
GET /api/sources/catalog/type/:type
```

**Types:** `model`, `tts`, `dataset`

**Examples:**
```bash
# Get TTS models
curl http://localhost:3000/api/sources/catalog/type/tts

# Get datasets
curl http://localhost:3000/api/sources/catalog/type/dataset

# Get chat/LLM models
curl http://localhost:3000/api/sources/catalog/type/model
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "total": 2,
  "type": "tts"
}
```

---

### Search Catalog
```http
GET /api/sources/catalog/search?q={query}
```

**Examples:**
```bash
# Search for Persian models
curl "http://localhost:3000/api/sources/catalog/search?q=persian"

# Search for BERT models
curl "http://localhost:3000/api/sources/catalog/search?q=bert"

# Search for TTS
curl "http://localhost:3000/api/sources/catalog/search?q=tts"
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "total": 3,
  "query": "persian"
}
```

---

## 📥 Download Endpoints

### Start Download
```http
POST /api/sources/download
Content-Type: application/json
```

**Body:**
```json
{
  "modelId": "persiannlp/parsinlu_reading_comprehension",
  "destination": "datasets/text/parsinlu_rc"  // optional
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/sources/download \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "persiannlp/parsinlu_reading_comprehension"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "dl_1728670123456_abc123",
    "modelId": "persiannlp/parsinlu_reading_comprehension",
    "modelName": "ParsiNLU Reading Comprehension",
    "destination": "datasets/text/parsinlu_rc",
    "message": "Download started successfully"
  }
}
```

---

### Get All Downloads
```http
GET /api/sources/downloads
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "dl_1728670123456_abc123",
      "kind": "dataset",
      "repoId": "persiannlp/parsinlu_reading_comprehension",
      "status": "downloading",
      "progress": 45,
      "currentFile": "train.json",
      "completedFiles": []
    }
  ],
  "total": 1
}
```

---

### Get Download Status
```http
GET /api/sources/download/:jobId
```

**Example:**
```bash
curl http://localhost:3000/api/sources/download/dl_1728670123456_abc123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "dl_1728670123456_abc123",
    "kind": "dataset",
    "repoId": "persiannlp/parsinlu_reading_comprehension",
    "repoType": "dataset",
    "dest": "datasets/text/parsinlu_rc",
    "status": "downloading",
    "progress": 67,
    "bytesDownloaded": 6700000,
    "bytesTotal": 10000000,
    "currentFile": "test.json",
    "completedFiles": ["train.json"],
    "startedAt": "2025-10-11T10:15:23.456Z"
  }
}
```

**Status Values:**
- `pending` - Job created, not started yet
- `downloading` - Download in progress
- `completed` - Download finished successfully
- `error` - Download failed

---

### Cancel Download
```http
DELETE /api/sources/download/:jobId
```

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/sources/download/dl_1728670123456_abc123
```

**Response:**
```json
{
  "success": true,
  "message": "Download cancelled",
  "jobId": "dl_1728670123456_abc123"
}
```

---

## 🔄 Legacy Endpoints (Backward Compatibility)

### Get Available Models
```http
GET /api/sources/models/available
```

Returns only models of type `model` (Chat/LLM).

---

### Get Available Datasets
```http
GET /api/sources/datasets/available
```

Returns only models of type `dataset`.

---

### Get Installed Sources
```http
GET /api/sources/installed
```

Returns list of installed model sources/repositories.

---

## 🧪 Complete Test Flow

### 1. Browse Catalog
```bash
# Get all models
curl http://localhost:3000/api/sources/catalog | jq

# Get TTS models only
curl http://localhost:3000/api/sources/catalog/type/tts | jq

# Search for Persian models
curl "http://localhost:3000/api/sources/catalog/search?q=persian" | jq
```

### 2. Start Download (Small Dataset ~10MB)
```bash
curl -X POST http://localhost:3000/api/sources/download \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "persiannlp/parsinlu_reading_comprehension"
  }' | jq
```

**Save the `jobId` from response!**

### 3. Monitor Progress
```bash
# Replace with your actual jobId
JOB_ID="dl_1728670123456_abc123"

# Check status (repeat this)
curl http://localhost:3000/api/sources/download/$JOB_ID | jq

# Watch progress in real-time
watch -n 2 "curl -s http://localhost:3000/api/sources/download/$JOB_ID | jq .data.progress"
```

### 4. List All Jobs
```bash
curl http://localhost:3000/api/sources/downloads | jq
```

### 5. Verify Downloaded Files
```bash
ls -lh datasets/text/parsinlu_rc/
```

**Expected files:**
- `train.json`
- `test.json`
- `dev.json`

---

## 📊 Available Models Quick Reference

| Model ID | Type | Size | Files |
|----------|------|------|-------|
| `Kamtera/persian-tts-male-vits` | tts | ~50 MB | 3 |
| `Kamtera/persian-tts-female-vits` | tts | ~50 MB | 3 |
| `HooshvareLab/bert-fa-base-uncased` | model | ~440 MB | 5 |
| `persiannlp/mt5-small-parsinlu-squad-reading-comprehension` | model | ~300 MB | 4 |
| `persiannlp/parsinlu_reading_comprehension` | dataset | ~10 MB | 3 |
| `hezarai/common-voice-13-fa` | dataset | ~2 GB | 3 |
| `HooshvareLab/pn_summary` | dataset | ~50 MB | 3 |
| `persiannlp/parsinlu_translation_fa_en` | dataset | ~15 MB | 2 |

---

## 🔧 Error Responses

### Model Not Found
```json
{
  "success": false,
  "error": "Model not found in catalog",
  "modelId": "invalid/model"
}
```

### Invalid Type
```json
{
  "success": false,
  "error": "Invalid type. Must be: model, tts, or dataset"
}
```

### Missing Parameter
```json
{
  "success": false,
  "error": "modelId is required"
}
```

### Job Not Found
```json
{
  "success": false,
  "error": "Download job not found",
  "jobId": "dl_invalid_123"
}
```

---

## 💡 Tips

1. **Start with small models**: Test with `persiannlp/parsinlu_reading_comprehension` (~10MB)
2. **Monitor progress**: Use the `/download/:jobId` endpoint to track progress
3. **Use default destinations**: Let the system use `defaultDest` from catalog
4. **Check logs**: Download logs are saved in `logs/downloads/`
5. **Parallel downloads**: You can start multiple downloads simultaneously

---

## 🎯 Production Considerations

1. **Rate Limiting**: Add rate limiting to prevent abuse
2. **Authentication**: Require auth tokens for download endpoints
3. **Disk Space**: Check available disk space before downloads
4. **Cleanup**: Implement automatic cleanup of failed downloads
5. **Notifications**: Use WebSocket for real-time progress updates
6. **Persistence**: Store job state in Redis/database for reliability

---

## ✨ Summary

- **9 main endpoints** for catalog and downloads
- **3 legacy endpoints** for backward compatibility
- **Direct HTTP downloads** with progress tracking
- **Automatic fallback** to git clone when needed
- **8 Persian models** ready to download

Ready to use! 🚀
