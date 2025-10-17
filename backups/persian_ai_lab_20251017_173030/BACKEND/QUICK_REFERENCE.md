# 🚀 Quick Reference - Download Fix

## 📁 Files Modified

| File | Lines | Status | Changes |
|------|-------|--------|---------|
| `modelCatalog.ts` | 259 | ✅ | Added direct download URLs to all 8 models |
| `downloads.ts` | 377 | ✅ | Complete rewrite with HTTP download support |
| `simple-proxy.ts` | 302 | ✅ | Added HuggingFace CDN domains |
| `sources.ts` | 659 | ✅ | Added 7 new catalog endpoints |

## 🔥 New API Endpoints

### Get All Models
```bash
GET /api/sources/catalog
```

### Download Model from Catalog
```bash
POST /api/sources/catalog/download
{
  "modelId": "HooshvareLab/bert-fa-base-uncased"
}
```

### Check Download Status
```bash
GET /api/sources/jobs/:jobId
```

### Get Models by Type
```bash
GET /api/sources/catalog/type/tts      # TTS models
GET /api/sources/catalog/type/model    # Chat/LLM models
GET /api/sources/catalog/type/dataset  # Datasets
```

### Search Models
```bash
GET /api/sources/catalog/search?q=persian
```

## ⚡ Quick Test

```bash
# 1. Get catalog
curl http://localhost:3000/api/sources/catalog | jq

# 2. Download a small dataset (~10MB)
curl -X POST http://localhost:3000/api/sources/catalog/download \
  -H "Content-Type: application/json" \
  -d '{"modelId": "persiannlp/parsinlu_reading_comprehension"}' | jq

# 3. Check status (replace JOB_ID)
curl http://localhost:3000/api/sources/jobs/JOB_ID | jq

# 4. List all jobs
curl http://localhost:3000/api/sources/jobs | jq
```

## 🎯 What Was Fixed

### ❌ Before
- No direct download URLs
- Could only use git clone (slow, no progress)
- Proxy blocked CDN domains
- No progress tracking

### ✅ After
- Direct HTTP downloads from HuggingFace
- Fast downloads with progress tracking
- Proxy supports all CDN domains
- Real-time progress monitoring
- Automatic fallback to git clone

## 📊 Available Models

| Type | Count | Total Size |
|------|-------|------------|
| TTS | 2 | ~100 MB |
| Models | 2 | ~740 MB |
| Datasets | 4 | ~2.2 GB |
| **Total** | **8** | **~3 GB** |

## 🔐 Allowed CDN Domains

- `huggingface.co`
- `cdn-lfs.huggingface.co` ⭐ NEW
- `cdn-lfs-us-1.huggingface.co` ⭐ NEW
- `cdn.huggingface.co` ⭐ NEW
- `github.com`
- `raw.githubusercontent.com`
- `objects.githubusercontent.com`
- `storage.googleapis.com`
- `kaggle.com` ⭐ NEW

## 💡 Key Features

1. **Smart Download**: Tries direct HTTP first, falls back to git clone
2. **Progress Tracking**: Real-time progress per file and overall
3. **Error Recovery**: Handles redirects, timeouts, and failures gracefully
4. **Multiple Files**: Downloads all model files (main, config, vocab, etc.)
5. **Job Management**: Track, monitor, and cancel downloads

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Host not allowed" | CDN domains added to proxy whitelist |
| No progress shown | Using direct download now with progress |
| Download fails | Auto-fallback to git clone |
| Slow downloads | Using HTTP instead of git (much faster) |

## 📝 Example Response

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

## ✨ Ready to Use!

All fixes are complete and ready for testing. Start the backend and try downloading any of the 8 available models! 🎉
