# Getting Started with Monitoring & CI/CD

Welcome! This guide will help you get started with the newly implemented monitoring, logging, and CI/CD features of the Persian TTS Platform.

## 🎯 What's New

Your platform now includes:

✅ **Structured Logging** - Winston with daily rotation  
✅ **Error Tracking** - Sentry integration  
✅ **Performance Monitoring** - Operation tracking  
✅ **System Monitoring** - CPU, memory, uptime  
✅ **API Analytics** - Request/response tracking  
✅ **Health Checks** - Comprehensive health endpoints  
✅ **CI/CD Pipeline** - Automated testing and deployment  
✅ **Docker Support** - Containerized deployment  

## 🚀 Quick Start Options

### Option 1: Run Verification Script

The fastest way to verify everything is working:

```bash
cd /workspace
bash scripts/verify-monitoring.sh
```

This will check:
- ✓ All monitoring files are present
- ✓ All dependencies are installed
- ✓ TypeScript compiles without errors
- ✓ Test files are in place
- ✓ GitHub workflows configured
- ✓ Docker files present
- ✓ Documentation complete

### Option 2: Start Development Server

```bash
# Simple start
bash scripts/start-dev.sh

# Or manually
cd BACKEND
npm run dev
```

### Option 3: Start with Docker

```bash
docker-compose up -d
```

## 📊 Explore Monitoring

Once your server is running, explore these endpoints:

### 1. Basic Health Check

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-13T...",
    "checks": {
      "database": { "status": "pass", "responseTime": 15 },
      "filesystem": { "status": "pass", "responseTime": 5 },
      "memory": { "status": "pass" },
      "disk": { "status": "pass" }
    }
  }
}
```

### 2. Detailed Health with Metrics

```bash
curl http://localhost:3001/health/detailed
```

Includes:
- All health checks
- System metrics (CPU, memory)
- Performance stats
- API analytics

### 3. System Metrics

```bash
curl http://localhost:3001/api/monitoring/system
```

Response:
```json
{
  "success": true,
  "data": {
    "cpu": { "usage": 45.2, "cores": 4 },
    "memory": {
      "total": 8589934592,
      "free": 4294967296,
      "used": 4294967296,
      "usagePercent": 50
    },
    "uptime": 86400,
    "timestamp": "2025-10-13T..."
  }
}
```

### 4. Performance Metrics

```bash
curl http://localhost:3001/api/monitoring/performance
```

Shows operation duration statistics.

### 5. API Analytics

```bash
curl http://localhost:3001/api/monitoring/analytics
```

Shows:
- Total requests
- Success/failure rates
- Average response times
- Top endpoints
- Error rates

## 🔍 View Logs

### Console Logs (Development)

Logs appear in your console with colors:

```
2025-10-13 12:00:00 [info]: Server started on port 3001
2025-10-13 12:00:01 [http]: GET /health 200 15ms - user:anonymous
2025-10-13 12:00:02 [debug]: Database query executed
2025-10-13 12:00:03 [warn]: Slow query detected (1250ms)
2025-10-13 12:00:04 [error]: Request error
```

### File Logs (Production)

In production, logs are written to files with daily rotation:

```bash
# View error logs
tail -f BACKEND/logs/error-$(date +%Y-%m-%d).log

# View all logs
tail -f BACKEND/logs/combined-$(date +%Y-%m-%d).log

# View HTTP logs
tail -f BACKEND/logs/http-$(date +%Y-%m-%d).log
```

## 🧪 Run Tests

### Backend Tests

```bash
cd BACKEND

# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Test Coverage

Coverage reports are generated in `BACKEND/coverage/`:

```bash
# View coverage report
open BACKEND/coverage/lcov-report/index.html
```

## 🔄 CI/CD Pipeline

### Workflows

Your repository now has 4 automated workflows:

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Runs on every push/PR
   - Tests backend and frontend
   - Security scanning
   - Build verification

2. **Docker Build** (`.github/workflows/docker-build.yml`)
   - Builds Docker images
   - Pushes to GitHub Container Registry
   - Triggered on push to main or tags

3. **Deployment** (`.github/workflows/deploy.yml`)
   - Deploys to staging/production
   - Zero-downtime rolling updates
   - Triggered by version tags or manually

4. **Rollback** (`.github/workflows/rollback.yml`)
   - Quickly rollback to previous version
   - Manual trigger only

### Trigger a Deployment

```bash
# Tag a new version
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# GitHub Actions will automatically:
# 1. Run tests
# 2. Build Docker images
# 3. Deploy to production
# 4. Run health checks
```

### Manual Deployment

Go to GitHub Actions → Deploy to Production → Run workflow

## 🐳 Docker Commands

### Start Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d backend

# Scale backend
docker-compose up -d --scale backend=2
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Manage Services

```bash
# Stop services
docker-compose down

# Restart service
docker-compose restart backend

# Check status
docker-compose ps

# Execute command in container
docker-compose exec backend npm run lint
```

## 📈 Monitoring in Production

### Set Up Sentry

1. Create account at https://sentry.io
2. Create new project
3. Copy DSN
4. Add to `.env`:
   ```bash
   SENTRY_DSN=https://your-key@sentry.io/project-id
   NODE_ENV=production
   ```
5. Restart backend

Errors are now automatically sent to Sentry!

### Monitor Health

```bash
# Simple script
bash scripts/health-check.sh

# Or manually
curl https://your-domain.com/health/detailed
```

### Set Up Alerts

Configure alerts for:
- Error rate > 5%
- Response time > 3s
- Memory usage > 90%
- CPU usage > 90%

## 📚 Documentation

Comprehensive documentation is available:

| Document | Description |
|----------|-------------|
| [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md) | 5-minute quick start |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Complete deployment guide |
| [CI_CD.md](docs/CI_CD.md) | CI/CD pipeline docs |
| [MONITORING_LOGGING_GUIDE.md](docs/MONITORING_LOGGING_GUIDE.md) | Monitoring usage guide |
| [GITHUB_SECRETS.md](docs/GITHUB_SECRETS.md) | GitHub secrets setup |
| [PRODUCTION_DEPLOYMENT_CHECKLIST.md](PRODUCTION_DEPLOYMENT_CHECKLIST.md) | Deployment checklist |

## 🛠 Helpful Scripts

### Verify Monitoring Setup

```bash
bash scripts/verify-monitoring.sh
```

Checks all monitoring components are installed and configured.

### Health Check

```bash
bash scripts/health-check.sh
```

Tests all health and monitoring endpoints.

### Start Development

```bash
bash scripts/start-dev.sh
```

Interactive script to start development environment.

## 🎓 Learning Path

### Day 1: Familiarize with Monitoring

1. Start the backend
2. Visit http://localhost:3001/health/detailed
3. Make some API calls
4. Check the logs
5. Visit monitoring endpoints

### Day 2: Explore Logging

1. Review console logs
2. Trigger some errors
3. Check error logs
4. Review log rotation
5. Test structured logging

### Day 3: Performance Monitoring

1. Review performance metrics
2. Identify slow operations
3. Check analytics
4. Monitor system resources
5. Test alerts

### Day 4: CI/CD Pipeline

1. Review GitHub workflows
2. Create a test PR
3. Watch CI run
4. Merge and deploy
5. Test rollback

### Day 5: Production Deployment

1. Follow deployment checklist
2. Configure production environment
3. Set up GitHub secrets
4. Deploy to staging
5. Deploy to production

## 🚨 Common Issues

### Issue: TypeScript Errors

```bash
cd BACKEND
npm run lint
```

Fix any reported errors.

### Issue: Tests Failing

```bash
cd BACKEND
npm test -- --verbose
```

Review test output for specific failures.

### Issue: Health Check Fails

1. Check database connection
2. Verify environment variables
3. Review logs
4. Check port availability

### Issue: Docker Won't Start

```bash
# View logs
docker-compose logs backend

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

## ✅ Success Checklist

You're ready to go when:

- [ ] Backend starts without errors
- [ ] `/health` returns 200 OK
- [ ] Monitoring endpoints accessible
- [ ] Logs appear in console
- [ ] Tests pass
- [ ] TypeScript compiles
- [ ] Docker builds successfully
- [ ] CI workflow runs on PR
- [ ] Documentation reviewed

## 🎉 You're Ready!

You now have a production-ready platform with:
- ✅ Enterprise-grade monitoring
- ✅ Structured logging
- ✅ Error tracking
- ✅ Performance monitoring
- ✅ Automated CI/CD
- ✅ Zero-downtime deployment

Start exploring the monitoring features and deploy with confidence!

## 🆘 Need Help?

- Run verification: `bash scripts/verify-monitoring.sh`
- Check health: `bash scripts/health-check.sh`
- View docs: `ls docs/`
- Review logs: `tail -f BACKEND/logs/combined-*.log`

---

**Happy Monitoring! 🚀**
