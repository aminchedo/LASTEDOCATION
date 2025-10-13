# Quick Start Guide - Persian TTS Platform

Get up and running in 5 minutes with monitoring and logging enabled.

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm or yarn
- Git

## 🚀 Quick Start (Development)

### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/yourusername/persian-tts.git
cd persian-tts

# Setup environment
cp .env.example .env

# Install dependencies
cd BACKEND && npm install
cd ../client && npm install
cd ..
```

### 2. Configure Environment

Edit `.env` file:

```bash
# Minimal configuration for development
NODE_ENV=development
PORT=3001

# Database (use your local PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/persian_tts

# Secrets (use defaults for dev, generate for production)
JWT_SECRET=dev-secret-key
SESSION_SECRET=dev-session-secret

# Optional
HF_TOKEN=your_huggingface_token
```

### 3. Initialize Database

```bash
# Create database
createdb persian_tts

# Initialize schema
psql -d persian_tts -f BACKEND/src/database/schema.sql
```

### 4. Start Development Servers

**Option A: Using npm scripts (recommended)**

```bash
npm run dev
```

This starts both backend and frontend concurrently.

**Option B: Separate terminals**

Terminal 1 (Backend):
```bash
cd BACKEND
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

### 5. Verify Installation

Open another terminal and run:

```bash
# Use the health check script
./scripts/health-check.sh

# Or manually
curl http://localhost:3001/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-13T...",
    "checks": {
      "database": { "status": "pass" },
      "filesystem": { "status": "pass" },
      "memory": { "status": "pass" },
      "disk": { "status": "pass" }
    }
  }
}
```

## 🐳 Quick Start (Docker)

### 1. Clone and Configure

```bash
git clone https://github.com/yourusername/persian-tts.git
cd persian-tts

# Setup environment
cp .env.example .env
nano .env  # Edit as needed
```

### 2. Start with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Verify

```bash
# Health check
curl http://localhost:3001/health

# System metrics
curl http://localhost:3001/api/monitoring/system
```

## 📊 Monitoring Endpoints

Once running, you can access these monitoring endpoints:

| Endpoint | Description |
|----------|-------------|
| `http://localhost:3001/health` | Basic health check |
| `http://localhost:3001/health/detailed` | Detailed health with metrics |
| `http://localhost:3001/api/monitoring/system` | System metrics (CPU, memory) |
| `http://localhost:3001/api/monitoring/performance` | Performance stats |
| `http://localhost:3001/api/monitoring/analytics` | API usage analytics |

## 🧪 Run Tests

```bash
# Backend tests
cd BACKEND
npm test

# With coverage
npm run test:coverage

# Frontend tests
cd client
npm test
```

## 📝 View Logs

### Development (Console)

Logs appear in the console with colors:
- 🔴 Red: Errors
- 🟡 Yellow: Warnings
- 🟢 Green: Info
- 🟣 Magenta: HTTP requests
- 🔵 Blue: Debug

### Production (Files)

Logs are written to `BACKEND/logs/`:
- `error-YYYY-MM-DD.log` - Error logs
- `combined-YYYY-MM-DD.log` - All logs
- `http-YYYY-MM-DD.log` - HTTP requests

View logs:
```bash
# Tail error logs
tail -f BACKEND/logs/error-*.log

# Tail all logs
tail -f BACKEND/logs/combined-*.log
```

## 🔧 Common Tasks

### Add a New Route

1. Create route file in `BACKEND/src/routes/`
2. Add monitoring to the route:

```typescript
import { performanceMonitor } from '../monitoring/performance';
import { log } from '../config/logger';

router.get('/my-route', async (req, res) => {
  const result = await performanceMonitor.trackOperation(
    'my-operation',
    async () => {
      log.info('Processing request', { userId: req.user?.id });
      // Your logic here
      return data;
    }
  );
  
  res.json({ success: true, data: result });
});
```

### Add Custom Monitoring

```typescript
import { performanceMonitor } from '../monitoring/performance';
import { log } from '../config/logger';

// Track operation duration
const result = await performanceMonitor.trackOperation(
  'custom-operation',
  async () => {
    // Your operation
  }
);

// Log with metadata
log.info('Operation completed', {
  userId: user.id,
  duration: 123,
  result: 'success'
});
```

### Configure Sentry (Production)

1. Create a Sentry account at https://sentry.io
2. Create a new project
3. Copy the DSN
4. Add to `.env`:

```bash
SENTRY_DSN=https://your-key@sentry.io/project-id
NODE_ENV=production
```

5. Restart the backend

Errors will now be automatically sent to Sentry.

## 🚨 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or use a different port
PORT=3002 npm run dev
```

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -d persian_tts -c "SELECT 1"

# Reset database
dropdb persian_tts
createdb persian_tts
psql -d persian_tts -f BACKEND/src/database/schema.sql
```

### TypeScript Errors

```bash
# Check for errors
cd BACKEND
npm run lint

# Rebuild
npm run build
```

### Docker Issues

```bash
# Stop all containers
docker-compose down

# Remove volumes (⚠️ deletes data)
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Start fresh
docker-compose up -d
```

## 📚 Next Steps

1. **Read the Documentation**
   - [Deployment Guide](docs/DEPLOYMENT.md)
   - [CI/CD Documentation](docs/CI_CD.md)
   - [Monitoring Guide](docs/MONITORING_LOGGING_GUIDE.md)

2. **Configure for Production**
   - Follow the [Production Deployment Checklist](PRODUCTION_DEPLOYMENT_CHECKLIST.md)
   - Set up GitHub Actions
   - Configure Sentry

3. **Explore the API**
   - API Documentation: http://localhost:3001/api-docs
   - Test endpoints with Postman or curl

4. **Set Up CI/CD**
   - Configure GitHub Secrets
   - Test workflows locally
   - Deploy to staging

## 🆘 Getting Help

- **Documentation**: Check the `/docs` directory
- **Issues**: https://github.com/yourusername/persian-tts/issues
- **Health Check**: Run `./scripts/health-check.sh`
- **Verification**: Run `./scripts/verify-monitoring.sh`

## ✅ Verification Checklist

Use this to verify everything is working:

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Database connection successful
- [ ] Health check returns 200 OK
- [ ] Logs appear in console (development)
- [ ] Monitoring endpoints accessible
- [ ] Tests pass
- [ ] TypeScript compiles without errors

---

**Time to complete**: ~5 minutes  
**Difficulty**: Easy  
**Prerequisites**: Node.js, PostgreSQL

Enjoy building with the Persian TTS Platform! 🚀
