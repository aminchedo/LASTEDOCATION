# 🔧 Download Issues - Complete Fix Summary

## 📋 Problems Identified

### Problem 1: Model Catalog Missing Direct URLs
**Issue**: `modelCatalog.ts` only had HuggingFace page URLs, not direct file download links.
**Status**: ✅ **FIXED**

### Problem 2: Download Service Incomplete
**Issue**: Download service couldn't extract and download direct file links.
**Status**: ✅ **FIXED**

### Problem 3: Proxy Domain Restrictions
**Issue**: Proxy blocked HuggingFace CDN domains (cdn-lfs.huggingface.co, etc.).
**Status**: ✅ **FIXED**

---

## ✅ Solutions Implemented

### 1. Enhanced Model Catalog (`modelCatalog.ts`)

**Changes:**
- Added `downloadUrls` interface with main, config, vocab, and additional file URLs
- Added direct download URLs to all 8 models/datasets in catalog
- Added helper functions: `getAllDownloadUrls()` and `getFilenameFromUrl()`

**Example:**
```typescript
{
  id: 'HooshvareLab/bert-fa-base-uncased',
  downloadUrls: {
    main: 'https://huggingface.co/.../pytorch_model.bin',
    config: 'https://huggingface.co/.../config.json',
    vocab: 'https://huggingface.co/.../vocab.txt',
    additional: ['tokenizer_config.json', 'special_tokens_map.json']
  }
}
```

### 2. Enhanced Download Service (`downloads.ts`)

**Changes:**
- Added `downloadFile()` function for single file downloads with progress tracking
- Added `downloadModelDirect()` for catalog-based downloads
- Kept `downloadWithGit()` as fallback method
- Smart selection: tries direct download first, falls back to git clone

**Features:**
- Progress tracking per file
- Overall progress calculation
- Redirect handling
- Error recovery
- Timeout handling (30s)

### 3. Enhanced Proxy (`simple-proxy.ts`)

**Changes:**
- Expanded `ALLOWED_HOSTS` to include:
  - `cdn-lfs.huggingface.co` (HuggingFace LFS CDN)
  - `cdn-lfs-us-1.huggingface.co` (US CDN)
  - `cdn.huggingface.co` (Main CDN)
  - `kaggle.com` and `www.kaggle.com` (Kaggle datasets)
- Added subdomain matching (*.huggingface.co)
- Added `followRedirects()` function (max 5 redirects)
- Enhanced error messages with detailed info
- Added health check endpoint

### 4. Enhanced Sources API (`sources.ts`)

**New Endpoints:**

#### Get Catalog
```http
GET /api/sources/catalog
```
Returns all models from catalog.

#### Get Model by ID
```http
GET /api/sources/catalog/:modelId
```
Example: `/api/sources/catalog/HooshvareLab%2Fbert-fa-base-uncased`

#### Get Models by Type
```http
GET /api/sources/catalog/type/:type
```
Types: `model`, `tts`, `dataset`

#### Search Catalog
```http
GET /api/sources/catalog/search?q=persian
```

#### Download from Catalog
```http
POST /api/sources/catalog/download
Content-Type: application/json

{
  "modelId": "HooshvareLab/bert-fa-base-uncased",
  "destination": "models/bert_fa_base" // optional
}
```

#### Get All Jobs
```http
GET /api/sources/jobs
```

#### Get Job Status
```http
GET /api/sources/jobs/:jobId
```

#### Cancel Job
```http
DELETE /api/sources/jobs/:jobId
```

---

## 🧪 Testing Guide

### Test 1: Get Catalog
```bash
curl http://localhost:3000/api/sources/catalog
```

**Expected:** List of 8 models with download URLs.

### Test 2: Get Model by Type
```bash
# Get TTS models
curl http://localhost:3000/api/sources/catalog/type/tts

# Get Datasets
curl http://localhost:3000/api/sources/catalog/type/dataset
```

### Test 3: Search Catalog
```bash
curl "http://localhost:3000/api/sources/catalog/search?q=persian"
curl "http://localhost:3000/api/sources/catalog/search?q=bert"
```

### Test 4: Download Model (MAIN TEST)
```bash
curl -X POST http://localhost:3000/api/sources/catalog/download \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "persiannlp/parsinlu_reading_comprehension"
  }'
```

**Expected Response:**
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

### Test 5: Check Download Progress
```bash
# Replace with actual jobId from Test 4
curl http://localhost:3000/api/sources/jobs/dl_1728670123456_abc123
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "dl_1728670123456_abc123",
    "kind": "dataset",
    "repoId": "persiannlp/parsinlu_reading_comprehension",
    "status": "downloading",
    "progress": 45,
    "currentFile": "train.json",
    "completedFiles": [],
    "bytesDownloaded": 4500000,
    "bytesTotal": 10000000
  }
}
```

### Test 6: Get All Jobs
```bash
curl http://localhost:3000/api/sources/jobs
```

### Test 7: Test Proxy (Direct)
```bash
# Test HuggingFace CDN
curl "http://localhost:3000/api/v1/sources/resolve?url=https%3A%2F%2Fhuggingface.co%2FHooshvareLab%2Fbert-fa-base-uncased%2Fresolve%2Fmain%2Fconfig.json"

# Test proxy download
curl "http://localhost:3000/api/v1/sources/proxy?url=https%3A%2F%2Fhuggingface.co%2FHooshvareLab%2Fbert-fa-base-uncased%2Fresolve%2Fmain%2Fconfig.json" \
  -o config.json
```

### Test 8: Test Proxy Health
```bash
curl http://localhost:3000/api/v1/health
```

**Expected:**
```json
{
  "ok": true,
  "service": "download-proxy",
  "allowedHosts": [
    "huggingface.co",
    "cdn-lfs.huggingface.co",
    "cdn-lfs-us-1.huggingface.co",
    "cdn.huggingface.co",
    ...
  ]
}
```

---

## 📂 Files Modified

1. ✅ `/workspace/BACKEND/src/config/modelCatalog.ts`
   - Added `downloadUrls` interface
   - Added direct URLs to all models
   - Added helper functions

2. ✅ `/workspace/BACKEND/src/services/downloads.ts`
   - Added direct file download support
   - Added progress tracking
   - Added redirect handling
   - Kept git clone as fallback

3. ✅ `/workspace/BACKEND/src/simple-proxy.ts`
   - Added HuggingFace CDN domains
   - Added subdomain matching
   - Added redirect following
   - Enhanced error handling

4. ✅ `/workspace/BACKEND/src/routes/sources.ts`
   - Added catalog integration
   - Added 7 new endpoints
   - Integrated with downloads service

---

## 🎯 Key Features

### 1. Smart Download Strategy
- **Primary**: Direct HTTP download from catalog URLs (fast, progress tracking)
- **Fallback**: Git clone (if no direct URLs available)

### 2. Progress Tracking
- Per-file progress
- Overall progress calculation
- Bytes downloaded/total
- Current file being downloaded
- Completed files list

### 3. Error Handling
- HTTP error codes
- Redirect handling (max 5)
- Timeout handling (30s)
- Detailed error messages
- Automatic fallback to git clone

### 4. Proxy Security
- Whitelist-based domain filtering
- Subdomain matching
- Header sanitization
- CORS enabled

---

## 🚀 Quick Start

### Start Backend
```bash
cd BACKEND
npm run dev
```

### Test Download Flow
```bash
# 1. Get catalog
curl http://localhost:3000/api/sources/catalog

# 2. Start download
curl -X POST http://localhost:3000/api/sources/catalog/download \
  -H "Content-Type: application/json" \
  -d '{"modelId": "persiannlp/parsinlu_reading_comprehension"}'

# 3. Check progress (use jobId from step 2)
curl http://localhost:3000/api/sources/jobs/YOUR_JOB_ID

# 4. Check downloaded files
ls -lh datasets/text/parsinlu_rc/
```

---

## 📊 Supported Models

### TTS Models (2)
1. ✅ Kamtera/persian-tts-male-vits (~50 MB)
2. ✅ Kamtera/persian-tts-female-vits (~50 MB)

### Chat/LLM Models (2)
3. ✅ HooshvareLab/bert-fa-base-uncased (~440 MB)
4. ✅ persiannlp/mt5-small-parsinlu-squad-reading-comprehension (~300 MB)

### Datasets (4)
5. ✅ persiannlp/parsinlu_reading_comprehension (~10 MB)
6. ✅ hezarai/common-voice-13-fa (~2 GB)
7. ✅ HooshvareLab/pn_summary (~50 MB)
8. ✅ persiannlp/parsinlu_translation_fa_en (~15 MB)

---

## 🔍 Troubleshooting

### Issue: Download fails with "Host not allowed"
**Solution**: Check that CDN domains are in `ALLOWED_HOSTS` in `simple-proxy.ts`

### Issue: Download stuck at 0%
**Solution**: 
1. Check logs: `logs/downloads/dl_*.json`
2. Verify URLs are accessible
3. Check if direct URLs exist in catalog

### Issue: Git clone fallback used
**Solution**: This is normal for models without `downloadUrls`. To add direct URLs:
1. Find model on HuggingFace
2. Get direct `/resolve/main/` URLs
3. Add to catalog entry

### Issue: 404 on download
**Solution**: Verify model exists on HuggingFace and URLs are correct

---

## 📝 API Response Examples

### Successful Download Start
```json
{
  "success": true,
  "data": {
    "jobId": "dl_1728670123456_abc123",
    "modelId": "HooshvareLab/bert-fa-base-uncased",
    "modelName": "Persian BERT Base",
    "destination": "models/bert_fa_base",
    "message": "Download started successfully"
  }
}
```

### Download Progress
```json
{
  "success": true,
  "data": {
    "id": "dl_1728670123456_abc123",
    "kind": "model",
    "repoId": "HooshvareLab/bert-fa-base-uncased",
    "repoType": "model",
    "dest": "models/bert_fa_base",
    "status": "downloading",
    "progress": 67,
    "bytesDownloaded": 294912000,
    "bytesTotal": 440000000,
    "currentFile": "pytorch_model.bin",
    "completedFiles": ["config.json", "vocab.txt"],
    "startedAt": "2025-10-11T10:15:23.456Z"
  }
}
```

### Download Complete
```json
{
  "success": true,
  "data": {
    "id": "dl_1728670123456_abc123",
    "status": "completed",
    "progress": 100,
    "completedFiles": [
      "pytorch_model.bin",
      "config.json",
      "vocab.txt",
      "tokenizer_config.json",
      "special_tokens_map.json"
    ],
    "startedAt": "2025-10-11T10:15:23.456Z",
    "finishedAt": "2025-10-11T10:18:45.789Z"
  }
}
```

---

## ✨ Summary

All three download issues have been completely fixed:

1. ✅ **Model Catalog**: Now includes direct download URLs for all files
2. ✅ **Download Service**: Can download files directly with progress tracking
3. ✅ **Proxy**: Allows all HuggingFace CDN domains

The system now supports:
- Direct HTTP downloads (fast, with progress)
- Git clone fallback (for repos without direct URLs)
- Progress tracking and monitoring
- Error handling and recovery
- 8 Persian models/datasets ready to download

**Ready to test!** 🚀
