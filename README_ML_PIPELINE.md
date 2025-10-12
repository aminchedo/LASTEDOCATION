# LASTEDOCATION ML Pipeline

Complete machine learning service integration for location prediction.

## 🎯 Features

- **ML Service**: FastAPI + RandomForest + SQLite
- **Backend Integration**: TypeScript proxy with retry logic
- **Frontend UI**: React pages for training and prediction
- **Docker**: Full-stack orchestration
- **CI/CD**: GitHub Actions workflow
- **Monitoring**: Health checks and metrics
- **Benchmarking**: Performance testing tools

## 📦 Components

### ML Service (Port 8000)
- RandomForest location prediction
- Async training with job tracking
- SQLite for persistence
- Model versioning
- REST API

### Backend (Port 3001)
- Express proxy at `/api/models/*`
- File upload handling
- Retry logic
- Authentication ready

### Frontend (Port 3000)
- Training page: `/ml-train`
- Prediction page: `/ml-predict`
- Real-time progress tracking
- Modern UI with TailwindCSS

## 🚀 Quick Start

### Development
\`\`\`bash
./start_dev.sh
\`\`\`

### Docker
\`\`\`bash
docker-compose up -d
\`\`\`

### Production
\`\`\`bash
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

## 🧪 Testing

### Unit Tests
\`\`\`bash
cd ml_service && python3 test_local.py
\`\`\`

### API Integration
\`\`\`bash
./test_ml_api.sh
\`\`\`

### Performance Benchmark
\`\`\`bash
python3 benchmark_ml.py
\`\`\`

### Health Monitor
\`\`\`bash
./monitor.sh
\`\`\`

## 📊 Sample Data

Generate test datasets:
\`\`\`bash
python3 generate_sample_data.py
\`\`\`

Files created:
- `sample_random_walk.csv` (500 rows)
- `sample_circular_path.csv` (200 rows)
- `sample_commute_pattern.csv` (300 rows)
- `sample_large_dataset.csv` (5000 rows)

## 📚 Documentation

- **[API Examples](API_EXAMPLES.md)** - API usage and examples
- **[Deployment](DEPLOY.md)** - Production deployment guide
- **[ML Service](ml_service/README.md)** - ML service documentation
- **[Production Checklist](PRODUCTION_CHECKLIST.md)** - Go-live checklist

## 🔧 Configuration

### ML Service
\`\`\`env
ML_SERVICE_PORT=8000
RANDOM_SEED=2025
N_ESTIMATORS=100
TEST_SIZE=0.2
N_JOBS=-1
MAX_UPLOAD_MB=50
\`\`\`

### Backend
\`\`\`env
ML_SERVICE_BASE_URL=http://ml_service:8000
PORT=3001
\`\`\`

### Frontend
\`\`\`env
VITE_API_BASE_URL=http://localhost:3001
\`\`\`

## 📈 Architecture

\`\`\`
Frontend (React)
    ↓
Backend (Express)
    ↓
ML Service (FastAPI)
    ↓
SQLite (jobs.db)
    ↓
Models (*.pkl)
\`\`\`

## 🔐 Security

- SQLite with parameterized queries ✓
- File size limits enforced ✓
- CORS configured ✓
- Helmet.js security headers ✓
- Authentication ready (add JWT)
- Rate limiting ready (configure limits)

## 🚦 Monitoring

Health endpoints:
- ML Service: `http://localhost:8000/health`
- Backend: `http://localhost:3001/api/health`
- Frontend: `http://localhost:3000`

Monitor script:
\`\`\`bash
./monitor.sh
\`\`\`

## 📊 Performance

Benchmarks (MacBook Pro M1):
- Training (1000 rows): ~2-3 seconds
- Prediction latency: <100ms (p95)
- Concurrent jobs: 3 (configurable)

## 🛠️ Development

### Project Structure
\`\`\`
ml_service/          # Python ML service
  ├── config.py      # Settings
  ├── database.py    # SQLite operations
  ├── modeling.py    # ML training/prediction
  ├── app.py         # FastAPI server
  └── test_local.py  # Local tests

BACKEND/
  ├── src/
  │   ├── services/mlProxy.ts  # ML client
  │   └── routes/models.ts     # API routes
  └── Dockerfile

client/
  ├── src/
  │   ├── api/ml.ts           # API client
  │   └── pages/
  │       ├── Train.tsx       # Training UI
  │       └── Predict.tsx     # Prediction UI
  └── Dockerfile

docker-compose.yml        # Development
docker-compose.prod.yml   # Production
\`\`\`

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests
4. Submit pull request

## 📞 Support

- GitHub Issues
- Documentation: See `/docs`
- API Examples: `API_EXAMPLES.md`
