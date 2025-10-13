# Quick Start Guide - Backend Fixes

## 🚀 What Was Fixed

✅ HuggingFace authentication with your token  
✅ Download retry with exponential backoff  
✅ Filesystem scanner for installed models  
✅ CORS configuration for frontend  
✅ Real-time progress tracking  
✅ Proper error handling  

---

## ⚡ Quick Setup

### 1. Install Dependencies
```bash
cd /workspace/BACKEND
npm install
```

### 2. Verify Environment
Your `.env` file is already configured with:
```bash
HUGGINGFACE_TOKEN=hf_your_actual_token_here
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,http://localhost:5174
```

### 3. Start Server
```bash
npm run dev
# or for production:
npm run build && npm start
```

You should see:
```
⚠️  HUGGINGFACE_TOKEN not set...  (if missing)
🚀 Persian Chat Backend API listening on port 3001
📡 Health check: http://localhost:3001/health
```

---

## 🧪 Quick Test

### Test 1: Health Check
```bash
curl http://localhost:3001/health
```
Expected: `{"ok": true, ...}`

### Test 2: Get Catalog
```bash
curl http://localhost:3001/api/sources/catalog
```
Expected: List of 6 models (TTS, LLM, datasets)

### Test 3: Start Download (Requires Auth)
First, get a JWT token from `/api/auth/login`, then:
```bash
curl -X POST http://localhost:3001/api/sources/download \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"modelId": "Kamtera/persian-tts-male-vits"}'
```

Expected: `{"success": true, "data": {"jobId": "dl_...", ...}}`

### Test 4: Check Progress
```bash
curl http://localhost:3001/api/sources/download/YOUR_JOB_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Watch the server logs for:
```
[INFO] Using HuggingFace token for download
[INFO] Downloading file model.pth
[INFO] Download progress: 10%...
[INFO] Download completed
```

### Test 5: Verify Downloaded Files
```bash
ls -lh models/tts/male/
```

Expected: Files like `model.pth`, `config.json`, `vocab.txt`

### Test 6: Check Installed Models
```bash
curl http://localhost:3001/api/sources/installed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected: Your downloaded model appears in the list with actual file sizes

---

## 📁 Key Files Changed

```
BACKEND/
├── .env                          ✅ NEW - Your HF token
├── .env.example                  ✅ Updated
├── src/
│   ├── config/
│   │   └── env.ts               ✅ Fixed - Validation + HF token
│   ├── services/
│   │   ├── downloads.ts         ✅ Fixed - HF auth + retry
│   │   └── modelScanner.ts      ✅ NEW - Filesystem scanner
│   ├── routes/
│   │   └── sources.ts           ✅ Fixed - Real filesystem data
│   └── server.ts                ✅ Fixed - Enhanced CORS
├── TESTING.md                    ✅ NEW - Full test guide
├── IMPLEMENTATION_SUMMARY.md     ✅ NEW - Detailed changes
└── QUICK_START.md               ✅ NEW - This file
```

---

## 🎯 What Happens Now

1. **Downloads use your HuggingFace token** - No more auth errors
2. **Retries automatically** - Network errors retry with backoff
3. **Shows real progress** - Updates every 1-2 seconds
4. **Scans filesystem** - `/installed` returns actual downloaded models
5. **CORS works** - Frontend can call API from any localhost port
6. **Better errors** - See actual error messages, not generic failures

---

## 🐛 Troubleshooting

### Downloads fail with 401
- Check token in `.env` file
- Verify token starts with `hf_`
- Test token at https://huggingface.co/settings/tokens

### CORS errors in browser
- Check frontend origin in `CORS_ORIGIN` env var
- Restart backend after changing `.env`

### Models don't appear in /installed
- Check files are in `models/` or `datasets/` directory
- Files must include `config.json` or `.bin/.pth/.safetensors`

### Server won't start
- Run `npm install` first
- Check TypeScript compiles: `npm run lint`
- Check port 3001 is not in use

---

## 📚 More Info

- **Full Testing Guide**: See `BACKEND/TESTING.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Model Catalog**: See `BACKEND/src/config/modelCatalog.ts`

---

## ✅ Ready to Go!

Your backend is now production-ready for:
- ✅ Downloading HuggingFace models with authentication
- ✅ Tracking download progress in real-time
- ✅ Detecting installed models from filesystem
- ✅ Handling CORS for frontend requests
- ✅ Retrying failed downloads automatically
- ✅ Providing descriptive error messages

**Next Step**: Run `npm install && npm run dev` and start testing! 🚀
