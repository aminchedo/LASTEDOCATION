# 🚀 QUICK START GUIDE

## Get Running in 5 Minutes

### Prerequisites

- **Node.js 18+** ([download](https://nodejs.org/))
- **PostgreSQL 12+** ([download](https://www.postgresql.org/download/))
- **Git** (optional)

### One-Line Setup (Automated)

```bash
./setup.sh
```

This script will:
1. ✅ Check prerequisites
2. ✅ Set up PostgreSQL database
3. ✅ Create environment files
4. ✅ Install all dependencies
5. ✅ Build both backend and frontend
6. ✅ Initialize database schema

### Manual Setup (Step by Step)

#### 1. Create Database

```bash
# Create database
createdb persian_tts

# Or with custom user
createuser -P persian_user
createdb -O persian_user persian_tts
```

#### 2. Configure Backend

```bash
cd BACKEND
cp .env.example .env
```

Edit `.env`:
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/persian_tts
JWT_SECRET=your-secret-key-min-32-chars
HF_TOKEN=hf_your_token_optional
```

#### 3. Install & Build

```bash
# Backend
cd BACKEND
npm install
npm run build

# Frontend
cd ../client
npm install
npm run build
```

#### 4. Start Servers

**Terminal 1 - Backend:**
```bash
cd BACKEND
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### Verify Installation

```bash
# Run verification script
./verify.sh

# Or manually check:
curl http://localhost:3001/health
# Expected: {"success":true,"data":{"status":"healthy"}}
```

### Test API

```bash
# Run API tests
./test-api.sh

# Or manually test:
curl "http://localhost:3001/api/sources/search?q=persian"
```

### Open Application

```
Frontend: http://localhost:5173
Backend:  http://localhost:3001
Health:   http://localhost:3001/health
```

---

## 🎯 Quick Feature Tests

### 1. Search HuggingFace Models

```bash
curl "http://localhost:3001/api/sources/search?q=persian+tts"
```

### 2. Validate HuggingFace Token

```bash
curl -X POST http://localhost:3001/api/sources/validate-token \
  -H "Content-Type: application/json" \
  -d '{"token":"hf_YOUR_TOKEN"}'
```

### 3. Check Database

```bash
psql $DATABASE_URL -c "\dt"
# Should show 7 tables
```

### 4. WebSocket Test

Open browser console at `http://localhost:5173`:
```javascript
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('✅ Connected'));
```

---

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start if needed
sudo systemctl start postgresql

# Test connection
psql postgresql://postgres:password@localhost:5432/persian_tts
```

### Port Already in Use

```bash
# Find process on port 3001
lsof -i :3001

# Kill it
kill -9 <PID>

# Or use different port in .env
PORT=3002
```

### TypeScript Errors

```bash
# Check backend
cd BACKEND && npm run lint

# Check frontend
cd client && npm run lint
```

### Dependencies Missing

```bash
# Reinstall backend
cd BACKEND
rm -rf node_modules package-lock.json
npm install

# Reinstall frontend
cd client
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Next Steps

1. **Add HuggingFace Token** (optional but recommended)
   - Get token: https://huggingface.co/settings/tokens
   - Add to `BACKEND/.env`: `HF_TOKEN=hf_xxx`

2. **Explore Features**
   - Search Persian models
   - Download models
   - Start training jobs
   - Monitor progress in real-time

3. **Read Documentation**
   - `IMPLEMENTATION_REPORT.md` - Technical details
   - `DEPLOYMENT_GUIDE.md` - Production deployment
   - `COMPLETE_CHECKLIST.md` - Verification checklist

---

## 🎉 Success Indicators

✅ Backend starts without errors
✅ Frontend loads at http://localhost:5173
✅ Health check returns `{"status":"healthy"}`
✅ Database has 7 tables
✅ HuggingFace search returns results
✅ TypeScript compiles with 0 errors

---

## 📞 Support

- **Implementation Details:** See `IMPLEMENTATION_REPORT.md`
- **Deployment Guide:** See `DEPLOYMENT_GUIDE.md`
- **API Reference:** See `BACKEND/API_ENDPOINTS.md`
- **Troubleshooting:** See `DEPLOYMENT_GUIDE.md` (Troubleshooting section)

---

**Ready to go! 🚀**
