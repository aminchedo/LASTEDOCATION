# Backend API Testing Guide

## Fixed Issues Summary

### ✅ 1. Environment Configuration
- Added `HUGGINGFACE_TOKEN` validation and parsing
- Enhanced CORS origin parsing (comma-separated list)
- Added JWT_SECRET validation for production
- Environment validation runs on startup

### ✅ 2. HuggingFace Downloads
- **Authentication**: Now uses Bearer token in Authorization header
- **Retry Logic**: Exponential backoff for failed downloads (max 3 retries)
- **Rate Limiting**: Handles 429, 503 errors with automatic retry
- **Progress Tracking**: Real-time updates every 1-2 seconds
- **Error Handling**: Proper error messages returned to frontend
- **Timeout**: Increased to 60s for large files

### ✅ 3. Filesystem Model Scanner
- New service: `modelScanner.ts`
- Recursively scans `models/` and `datasets/` directories
- Detects model files (.bin, .pth, .safetensors, config.json)
- Returns actual file sizes and download timestamps
- Matches catalog entries when possible

### ✅ 4. Sources API Endpoints
- `/api/sources/installed` - Now scans filesystem instead of memory
- Returns real data with file counts, sizes, completion status
- Proper error handling with stack traces in development

### ✅ 5. Enhanced CORS
- Dynamic origin validation
- Allows all localhost ports in development
- Supports credentials, all HTTP methods
- Proper headers: Authorization, Content-Type, X-Request-ID

---

## Testing the Fixes

### Prerequisites

1. **Environment Setup**
```bash
cd BACKEND
cat .env  # Verify HUGGINGFACE_TOKEN is set
```

Expected `.env` content:
```
NODE_ENV=development
PORT=3001
HUGGINGFACE_TOKEN=hf_your_actual_token_here
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://localhost:5174
JWT_SECRET=dev-secret-change-in-production
```

2. **Install Dependencies**
```bash
npm install
```

3. **Build TypeScript**
```bash
npm run build
```

4. **Start Server**
```bash
npm run dev
# or
npm run start
```

---

## API Endpoint Tests

### Test 1: Health Check
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "ok": true,
  "timestamp": "2025-10-13T...",
  "service": "persian-chat-backend"
}
```

### Test 2: Get Model Catalog
```bash
curl http://localhost:3001/api/sources/catalog
```

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "id": "Kamtera/persian-tts-male-vits",
      "name": "Persian TTS Male (VITS)",
      "type": "tts",
      ...
    }
  ],
  "total": 6
}
```

### Test 3: Check Installed Models (Before Download)
```bash
curl http://localhost:3001/api/sources/installed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response (empty if nothing downloaded yet):
```json
{
  "success": true,
  "data": {
    "models": [],
    "datasets": [],
    "all": []
  },
  "meta": {
    "totalModels": 0,
    "totalDatasets": 0,
    "scannedAt": "2025-10-13T..."
  }
}
```

### Test 4: Start Model Download
```bash
curl -X POST http://localhost:3001/api/sources/download \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "modelId": "Kamtera/persian-tts-male-vits"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "jobId": "dl_1728849123456_abc123",
    "modelId": "Kamtera/persian-tts-male-vits",
    "modelName": "Persian TTS Male (VITS)",
    "destination": "models/tts/male",
    "message": "Download started successfully"
  }
}
```

### Test 5: Check Download Progress
```bash
# Replace JOB_ID with actual jobId from Test 4
curl http://localhost:3001/api/sources/download/JOB_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response (downloading):
```json
{
  "success": true,
  "data": {
    "id": "dl_1728849123456_abc123",
    "kind": "tts",
    "repoId": "Kamtera/persian-tts-male-vits",
    "status": "downloading",
    "progress": 45,
    "bytesDownloaded": 23068672,
    "bytesTotal": 52428800,
    "currentFile": "model.pth",
    "completedFiles": ["config.json"],
    "startedAt": "2025-10-13T..."
  }
}
```

Expected response (completed):
```json
{
  "success": true,
  "data": {
    "id": "dl_1728849123456_abc123",
    "status": "completed",
    "progress": 100,
    "completedFiles": ["model.pth", "config.json", "vocab.txt"],
    "finishedAt": "2025-10-13T..."
  }
}
```

### Test 6: Verify Downloaded Files
```bash
# Check if files actually exist
ls -lh models/tts/male/
```

Expected output:
```
total 50M
-rw-r--r-- 1 user user  48M Oct 13 10:30 model.pth
-rw-r--r-- 1 user user 1.2K Oct 13 10:29 config.json
-rw-r--r-- 1 user user  12K Oct 13 10:30 vocab.txt
```

### Test 7: Check Installed Models (After Download)
```bash
curl http://localhost:3001/api/sources/installed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "Kamtera/persian-tts-male-vits",
        "name": "Persian TTS Male (VITS)",
        "type": "tts",
        "size": "48.23 MB",
        "sizeBytes": 50593792,
        "downloadedAt": "2025-10-13T...",
        "path": "models/tts/male",
        "files": ["model.pth", "config.json", "vocab.txt"],
        "hasConfig": true,
        "hasModel": true,
        "isComplete": true
      }
    ],
    "datasets": [],
    "all": [...]
  }
}
```

---

## Error Handling Tests

### Test 8: Invalid Model ID
```bash
curl -X POST http://localhost:3001/api/sources/download \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "modelId": "invalid/model-id"
  }'
```

Expected response:
```json
{
  "success": false,
  "error": "Model not found in catalog",
  "modelId": "invalid/model-id"
}
```

### Test 9: Missing Token (if token removed)
If HUGGINGFACE_TOKEN is missing from .env, server should log warning on startup:
```
⚠️  HUGGINGFACE_TOKEN not set - HuggingFace downloads may be rate-limited or fail
```

### Test 10: CORS Test
```bash
# Test from different origin
curl http://localhost:3001/api/sources/catalog \
  -H "Origin: http://localhost:5173" \
  -v
```

Should see in headers:
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
```

---

## Monitoring Download Progress

### Watch Server Logs
```bash
# In the terminal where server is running, you should see:
[INFO] Starting download dl_xxx Kamtera/persian-tts-male-vits
[INFO] Using HuggingFace token for download
[INFO] Downloading file model.pth
[INFO] Download progress: 10% downloaded: 5.00 MB total: 50.00 MB
[INFO] Download progress: 20% downloaded: 10.00 MB total: 50.00 MB
...
[INFO] File downloaded model.pth
[INFO] Download completed dl_xxx
```

### Check Download Job Logs
```bash
cat logs/downloads/dl_*.json
```

---

## Expected Behavior

### ✅ Success Indicators

1. **Environment validated on startup** - No errors about missing variables
2. **HuggingFace token used** - Logs show "Using HuggingFace token"
3. **Files download completely** - `ls` shows actual files with correct sizes
4. **Progress updates in real-time** - Status endpoint shows increasing progress
5. **Installed endpoint returns data** - Shows models after download completes
6. **CORS headers present** - Frontend can make requests without errors
7. **Errors are descriptive** - Real error messages, not generic "failed"

### ❌ Failure Indicators

1. **401 Unauthorized from HuggingFace** - Token is invalid
2. **429 Too Many Requests** - Should retry automatically
3. **Empty installed array** - Filesystem scanner not working
4. **CORS errors in browser** - CORS config issue
5. **Generic error messages** - Error handling not working

---

## Troubleshooting

### Issue: Downloads fail with 401
**Solution**: Verify token in .env file starts with `hf_`

### Issue: Files don't appear in /installed endpoint
**Solution**: Check that files are in `models/` or `datasets/` directory

### Issue: CORS errors
**Solution**: Verify frontend origin is in CORS_ORIGIN env var

### Issue: Download stalls at 0%
**Solution**: Check network connectivity, verify HuggingFace URL is accessible

---

## Next Steps

After confirming these tests pass:

1. Test dataset downloads
2. Test larger models
3. Test concurrent downloads
4. Test download cancellation
5. Add download resume capability (future enhancement)

---

## Development Notes

### File Structure
```
BACKEND/
├── src/
│   ├── config/
│   │   ├── env.ts           ✅ Enhanced with validation
│   │   └── modelCatalog.ts  ✅ Contains download URLs
│   ├── services/
│   │   ├── downloads.ts     ✅ Fixed with HF auth & retry
│   │   └── modelScanner.ts  ✅ New filesystem scanner
│   └── routes/
│       └── sources.ts       ✅ Updated /installed endpoint
├── models/                  📁 Downloaded models go here
├── datasets/                📁 Downloaded datasets go here
├── logs/                    📁 Download logs
└── .env                     ✅ Contains HUGGINGFACE_TOKEN
```

### Key Changes Made

1. **Environment Config** (`config/env.ts`):
   - Added HUGGINGFACE_TOKEN with validation
   - Parse CORS_ORIGIN as comma-separated list
   - Validate on startup, fail fast if critical vars missing

2. **Download Service** (`services/downloads.ts`):
   - Added Authorization header with Bearer token
   - Implemented retry with exponential backoff
   - Enhanced progress tracking and logging
   - Better error messages

3. **Model Scanner** (`services/modelScanner.ts`):
   - New service to scan filesystem
   - Detects models by file patterns
   - Calculates directory sizes
   - Returns metadata from config files

4. **Sources Routes** (`routes/sources.ts`):
   - `/installed` now scans filesystem
   - Returns real data, not empty arrays
   - Proper error handling

5. **CORS** (`server.ts`):
   - Dynamic origin validation
   - Support all localhost in development
   - All necessary headers allowed
