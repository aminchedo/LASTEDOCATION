# QUICK SETUP GUIDE - Model Training Project

This guide will help you get the Model Training Project up and running in **under 10 minutes**.

---

## 🚀 Quick Start

### Option 1: Docker (Recommended for Production)

```bash
# 1. Clone the repository
git clone <repository-url>
cd <project-directory>

# 2. Create environment file
cp .env.example .env

# 3. Edit .env and set JWT_SECRET
nano .env  # or your preferred editor
# Set: JWT_SECRET=your-super-secret-key-here

# 4. Build and start with Docker Compose
docker-compose up -d

# 5. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

**That's it!** The application is now running.

---

### Option 2: Manual Setup (Development)

#### Prerequisites
- Node.js 20+
- Python 3.10+
- npm or yarn

#### Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd BACKEND
npm install
cd ..

# Install frontend dependencies
cd client
npm install
cd ..

# Install Python dependencies (optional, for real training)
pip3 install -r requirements.txt
```

#### Step 2: Configure Environment

```bash
# Backend
cp BACKEND/.env.example BACKEND/.env
nano BACKEND/.env  # Edit and set JWT_SECRET

# Frontend
cp client/.env.example client/.env
# Default values should work for development
```

#### Step 3: Start Development Servers

```bash
# Option A: Start both servers at once
npm run dev

# Option B: Start separately
# Terminal 1 - Backend
cd BACKEND
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

#### Step 4: Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

---

## 📋 First Steps After Setup

### 1. Login/Register

- Navigate to http://localhost:3000
- Click "Register" to create a new account
- Login with your credentials

### 2. Upload a Dataset

- Go to **Datasets** page
- Click **Upload Dataset**
- Select a `.jsonl` file with the format:
  ```json
  {"question": "سلام", "answer": "سلام! چطور می‌تونم کمکتون کنم؟"}
  {"question": "نام تو چیست؟", "answer": "من یک دستیار هوشمند فارسی زبان هستم."}
  ```
- Click **Upload**

### 3. Start Training

- Go to **Training** page
- Configure training parameters:
  - **Model**: Select base model (default: HooshvareLab/bert-fa-base-uncased)
  - **Dataset**: Select uploaded dataset
  - **Epochs**: Number of training iterations (start with 1 for testing)
  - **Batch Size**: 4 (CPU) or 16 (GPU)
  - **Learning Rate**: 5e-5 (default)
- Click **Start Training**

### 4. Monitor Training

- Training progress appears in real-time
- View metrics: Loss, Accuracy, Learning Rate
- Check logs in the **Logs** tab
- Create checkpoints manually or automatically

---

## 🔧 Configuration

### Environment Variables

#### Backend (`BACKEND/.env`)

```env
NODE_ENV=development
PORT=3001

# Security (REQUIRED)
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Logging
LOG_LEVEL=info
LOG_DIR=logs
```

#### Frontend (`client/.env`)

```env
VITE_API_BASE_URL=http://localhost:3001
```

---

## 🐍 Python Dependencies (for Real Training)

### Required for Real ML Training

```bash
pip3 install torch transformers datasets accelerate sentencepiece tokenizers
```

### Optional for Voice Processing

```bash
# Speech-to-Text (Whisper)
pip3 install openai-whisper

# Text-to-Speech
pip3 install TTS
```

---

## 🐳 Docker Commands

### Basic Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# View running containers
docker ps

# Execute command in backend container
docker exec -it model-training-backend sh
```

### Troubleshooting

```bash
# Remove all containers and volumes (reset)
docker-compose down -v

# Clean up Docker
docker system prune -a

# Check container health
docker inspect model-training-backend | grep Health
```

---

## 🧪 Testing the Setup

### 1. Health Check

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

### 2. Test Training (Simulation Mode)

```bash
cd BACKEND
npm run dev

# In another terminal
curl -X POST http://localhost:3001/api/train/start \
  -H "Content-Type: application/json" \
  -d '{
    "modelName": "test-model",
    "epochs": 1,
    "batchSize": 4,
    "learningRate": 0.001
  }'
```

### 3. Test Dataset Upload

```bash
# Create a test dataset
echo '{"question":"سلام","answer":"سلام! خوش آمدید"}' > test_dataset.jsonl

# Upload
curl -X POST http://localhost:3001/api/datasets/upload \
  -F "dataset=@test_dataset.jsonl"
```

---

## 📊 System Requirements

### Minimum (CPU Training)

- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 20 GB
- **OS**: Linux, macOS, Windows (WSL2)

### Recommended (GPU Training)

- **CPU**: 8+ cores
- **RAM**: 16 GB
- **GPU**: NVIDIA with 8+ GB VRAM
- **Storage**: 50 GB SSD
- **OS**: Linux (Ubuntu 20.04+)

### For Production

- **CPU**: 16+ cores
- **RAM**: 32 GB
- **GPU**: NVIDIA with 16+ GB VRAM
- **Storage**: 100 GB SSD
- **Network**: 1 Gbps

---

## 🐛 Common Issues & Solutions

### Issue: "Port already in use"

**Solution**: Change ports in environment files or stop conflicting services

```bash
# Check what's using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Issue: "Module not found"

**Solution**: Reinstall dependencies

```bash
# Backend
cd BACKEND && rm -rf node_modules && npm install

# Frontend
cd client && rm -rf node_modules && npm install
```

### Issue: "PyTorch not found"

**Solution**: Training falls back to simulation mode. Install PyTorch:

```bash
pip3 install torch transformers datasets accelerate
```

### Issue: "Permission denied"

**Solution**: Make scripts executable

```bash
chmod +x scripts/*.py
chmod +x scripts/*.sh
```

### Issue: "Database locked"

**Solution**: SQLite is locked. Restart backend or delete lock file

```bash
rm BACKEND/data/*.db-shm
rm BACKEND/data/*.db-wal
```

---

## 📚 Additional Resources

- **Full Technical Report**: `/workspace/MODEL_TRAINING_PROJECT_ANALYSIS_REPORT.md`
- **API Documentation**: `/workspace/BACKEND/API_ENDPOINTS.md`
- **Implementation Status**: `/workspace/docs/PHASE7_IMPLEMENTATION_STATUS.md`
- **Backend README**: `/workspace/BACKEND/README.md`

---

## 🎯 Next Steps

1. ✅ Complete setup
2. ✅ Test with simulation training
3. 📥 Install PyTorch for real training
4. 📊 Upload your first dataset
5. 🚀 Start real model training
6. 🎨 Customize the UI themes
7. 🔧 Configure Google Drive backup (optional)
8. 📈 Set up monitoring and alerts (optional)

---

## 💡 Tips

- Start with **1 epoch** for testing
- Use **CPU mode** first, then GPU
- **Checkpoints** are saved every 100 steps
- **Logs** are in `BACKEND/logs/`
- **Models** are saved in `models/`
- Press **Ctrl+C** to stop dev servers

---

## 📞 Support

If you encounter issues:

1. Check the **logs**: `docker-compose logs -f` or `BACKEND/logs/`
2. Verify **environment variables** are set
3. Ensure **ports are not blocked** by firewall
4. Check **Python dependencies** are installed
5. Review the **technical report** for known issues

---

**Happy Training! 🚀**
