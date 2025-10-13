# Quick Diagnostic Guide - Data Sources & API Issues

**Quick Reference for Common Problems**

---

## 🚀 Quick Start

### Run Automatic Diagnostic

```bash
./scripts/diagnose-api-issues.sh
```

This will automatically check:
- Backend connectivity
- CORS configuration
- API endpoints
- Environment variables
- Directory structure
- Model catalog access

---

## 🔍 Common Issues & Quick Fixes

### 1. **Cannot See Models in UI**

**Quick Check:**
```bash
# Test if backend is running
curl http://localhost:3001/health

# Test models endpoint (requires auth)
curl http://localhost:3001/api/models/detected
```

**Quick Fix:**
```bash
# 1. Start backend if not running
cd BACKEND
npm run dev

# 2. Check if you're logged in
# Open browser console:
localStorage.getItem('token')  # Should show a JWT token
```

---

### 2. **CORS Errors in Browser Console**

**Error Message:**
```
Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Quick Fix:**
```bash
# Edit BACKEND/.env
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Restart backend
cd BACKEND
npm run dev
```

---

### 3. **Cannot Download Models from Catalog**

**Quick Check:**
```bash
# Test catalog access
curl http://localhost:3001/api/sources/catalog

# Should return list of 8 models/datasets
```

**Quick Fix:**
```bash
# 1. Ensure directories exist
mkdir -p models datasets downloads logs/downloads

# 2. Test download manually
curl -X POST http://localhost:3001/api/sources/download \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"modelId": "Kamtera/persian-tts-male-vits"}'

# 3. Check download progress
curl http://localhost:3001/api/sources/downloads
```

---

### 4. **Empty Data Sources Page**

**Current Status:** Data sources page shows mock data initially

**Quick Fix:**
```bash
# Download real models from catalog
# 1. Go to /downloads or /models page
# 2. Click "Download" on a model from catalog
# 3. Wait for download to complete
# 4. Refresh /models page to see detected models
```

---

### 5. **401 Unauthorized Errors**

**Quick Fix:**
```bash
# 1. Login again at /login

# 2. Check if JWT_SECRET is set in backend
cat BACKEND/.env | grep JWT_SECRET

# If missing:
echo "JWT_SECRET=$(openssl rand -hex 32)" >> BACKEND/.env

# 3. Restart backend
cd BACKEND
npm run dev
```

---

## 📋 Environment Setup Checklist

```bash
# ✅ Backend Environment
cd BACKEND
cp .env.example .env
# Edit .env and set:
# - JWT_SECRET (required)
# - CORS_ORIGIN (optional, defaults to http://localhost:3000)

# ✅ Frontend Environment
cd client
cp .env.example .env
# Edit .env and set:
# - VITE_API_BASE_URL (optional, defaults to http://localhost:3001)

# ✅ Install Dependencies
npm install
cd BACKEND && npm install
cd ../client && npm install

# ✅ Start Services
npm run dev
```

---

## 🧪 Test API Endpoints

### Health Checks
```bash
# Backend health
curl http://localhost:3001/health

# API health (shows all services)
curl http://localhost:3001/api/health
```

### Get Models & Datasets
```bash
# Get full catalog (no auth required)
curl http://localhost:3001/api/sources/catalog

# Get only TTS models
curl http://localhost:3001/api/sources/catalog/type/tts

# Get only datasets
curl http://localhost:3001/api/sources/catalog/type/dataset

# Search catalog
curl "http://localhost:3001/api/sources/catalog/search?q=persian"
```

### Authentication
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Save the token from response, then use it:
TOKEN="your-jwt-token-here"

# Get detected models (requires auth)
curl http://localhost:3001/api/models/detected \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Understanding the Data Flow

### Models/Datasets Flow

```
1. User Action
   └─> Frontend UI (ModelsDatasetsPage, DataSourcesPage)
        └─> Service Layer (sourcesService, modelsService)
             └─> API Call (GET /api/sources/catalog, /api/models/detected)
                  └─> Backend Routes (/routes/sources.ts, /routes/models.ts)
                       └─> Services (downloads.ts, modelManager.ts)
                            └─> Data Storage (models/, datasets/, modelCatalog.ts)
```

### Download Flow

```
1. Click Download Button
   └─> sourcesService.startDownload(modelId)
        └─> POST /api/sources/download
             └─> Check modelCatalog for model info
                  └─> Start download job
                       ├─> Direct HTTPS download (if URLs available)
                       └─> Git clone (fallback)
                            └─> Save to models/ or datasets/
```

---

## 🔧 Directory Structure

```
workspace/
├── models/                  # Downloaded models stored here
│   ├── tts/
│   │   ├── male/
│   │   └── female/
│   └── bert_fa_base/
│
├── datasets/                # Downloaded datasets
│   ├── text/
│   └── speech/
│
├── downloads/               # Temporary download cache
│
├── data/
│   └── datasets/            # User-uploaded datasets
│       └── metadata.json
│
├── logs/
│   └── downloads/           # Download job logs
│       └── dl_*.json
│
└── BACKEND/
    └── src/
        ├── routes/
        │   ├── sources.ts   # /api/sources/*
        │   ├── models.ts    # /api/models/*
        │   └── datasets.ts  # /api/datasets/*
        │
        ├── services/
        │   ├── downloads.ts
        │   └── modelManager.ts
        │
        └── config/
            └── modelCatalog.ts  # Predefined models list
```

---

## 📖 Available Models in Catalog

### TTS Models (Text-to-Speech)
1. **Kamtera/persian-tts-male-vits** (~50 MB)
2. **Kamtera/persian-tts-female-vits** (~50 MB)

### Language Models
1. **HooshvareLab/bert-fa-base-uncased** (~440 MB)
2. **persiannlp/mt5-small-parsinlu-squad-reading-comprehension** (~300 MB)

### Datasets
1. **persiannlp/parsinlu_reading_comprehension** (~10 MB)
2. **hezarai/common-voice-13-fa** (~2 GB)
3. **HooshvareLab/pn_summary** (~50 MB)
4. **persiannlp/parsinlu_translation_fa_en** (~15 MB)

---

## 🎯 Next Steps

1. **Read Full Analysis:**
   - [ANALYSIS_ALT_FOIL_FOLDERS_AND_API_TROUBLESHOOTING.md](ANALYSIS_ALT_FOIL_FOLDERS_AND_API_TROUBLESHOOTING.md)

2. **Setup Guide:**
   - [QUICK_SETUP_GUIDE.md](QUICK_SETUP_GUIDE.md)

3. **API Documentation:**
   - [BACKEND/API_ENDPOINTS.md](BACKEND/API_ENDPOINTS.md) (if exists)
   - Or check [API_TESTING_EXAMPLES.md](API_TESTING_EXAMPLES.md)

4. **Run Diagnostic:**
   ```bash
   ./scripts/diagnose-api-issues.sh
   ```

---

## 💡 Pro Tips

### Fast Model Detection
```bash
# Instead of waiting for page load, test directly:
curl http://localhost:3001/api/models/detected \
  -H "Authorization: Bearer $(cat /tmp/token.txt)" | jq
```

### Monitor Downloads
```bash
# Watch download progress in real-time
watch -n 1 'curl -s http://localhost:3001/api/sources/downloads | jq'
```

### Check Logs
```bash
# Backend logs
tail -f BACKEND/logs/*.log

# Download logs
tail -f logs/downloads/*.json
```

### Clear Download Queue
```bash
# Remove all download jobs (be careful!)
rm -rf logs/downloads/*
# Restart backend to clear in-memory jobs
```

---

**Last Updated:** 2025-10-13
