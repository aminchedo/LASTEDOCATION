# Deployment Guide

## Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services:
- ML Service: http://localhost:8000
- Backend: http://localhost:3001
- Frontend: http://localhost:3000

## Manual Deployment

### ML Service

```bash
cd ml_service
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

### Backend

```bash
cd BACKEND
npm install
npm run build
npm start
```

Environment:
```bash
ML_SERVICE_BASE_URL=http://localhost:8000
PORT=3001
```

### Frontend

```bash
cd client
npm install
npm run build
npm run preview
```

Environment:
```bash
VITE_API_BASE_URL=http://localhost:3001
```

## Testing

### Quick Test
```bash
# Test ML service
curl http://localhost:8000/health

# Test backend proxy
curl http://localhost:3001/api/models/list

# Test training
curl -X POST http://localhost:3001/api/models/train \
  -F "file=@test_data.csv"
```

### Full Test Suite
```bash
./test_ml_api.sh
```

## Production Considerations

### ML Service
- [ ] Use Gunicorn with multiple workers
- [ ] Add model monitoring
- [ ] Implement model rotation
- [ ] Set up logging aggregation
- [ ] Add authentication

### Backend
- [ ] Enable rate limiting (already has express-rate-limit)
- [ ] Add request logging
- [ ] Set up HTTPS
- [ ] Configure CORS properly
- [ ] Add API versioning

### Frontend
- [ ] Build optimized production bundle
- [ ] Configure CDN for static assets
- [ ] Add error tracking (Sentry)
- [ ] Implement analytics
- [ ] Add loading states

### Database
- [ ] Regular SQLite backups
- [ ] Or migrate to PostgreSQL for scale
- [ ] Add connection pooling
- [ ] Implement query optimization

### Infrastructure
- [ ] Use Docker Swarm or Kubernetes
- [ ] Set up load balancer
- [ ] Configure health checks
- [ ] Add monitoring (Prometheus/Grafana)
- [ ] Set up CI/CD pipeline

## Scaling

Current setup handles:
- 3 concurrent training jobs (configurable in app.py)
- 50MB max file size
- Single model server

For scale:
- Use Redis for job queue
- Deploy multiple ML service replicas
- Use S3 for model storage
- Add model caching
- Implement batch prediction endpoint
