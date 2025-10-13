# Persian TTS/AI Platform

[![CI Pipeline](https://github.com/yourusername/persian-tts/workflows/CI%20Pipeline/badge.svg)](https://github.com/yourusername/persian-tts/actions)
[![Docker Build](https://github.com/yourusername/persian-tts/workflows/Docker%20Build/badge.svg)](https://github.com/yourusername/persian-tts/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Production-ready Persian Text-to-Speech and AI platform with comprehensive monitoring, logging, and CI/CD pipeline.

## Features

### Core Features
- 🎤 **Text-to-Speech**: Persian TTS with multiple voice models
- 🎧 **Speech-to-Text**: Persian STT for voice input
- 💬 **Chat Interface**: AI-powered Persian chat
- 🔍 **Search**: Semantic search capabilities
- 🎯 **Model Training**: Train custom TTS models
- 📊 **Experiments**: A/B testing for models

### Production Features
- 📝 **Structured Logging**: Winston with daily rotation
- 📊 **Performance Monitoring**: Real-time metrics
- 🔍 **Error Tracking**: Sentry integration
- 🏥 **Health Checks**: Comprehensive system monitoring
- 📈 **API Analytics**: Request/response tracking
- 🔄 **CI/CD Pipeline**: Automated testing and deployment
- 🐳 **Docker Support**: Containerized deployment
- 🔒 **Security Scanning**: Automated vulnerability checks

## Quick Start

### Development

```bash
# Clone repository
git clone https://github.com/yourusername/persian-tts.git
cd persian-tts

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Install dependencies
cd BACKEND && npm install
cd ../client && npm install

# Start development servers
npm run dev
```

**Access:**
- Backend: http://localhost:3001
- Frontend: http://localhost:5173
- API Docs: http://localhost:3001/api-docs
- Health Check: http://localhost:3001/health

### Production (Docker)

```bash
# Configure environment
cp .env.example .env
# Set production values in .env

# Start services
docker-compose up -d

# Check health
curl http://localhost:3001/health
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Backend   │────▶│  PostgreSQL │
│   (React)   │     │  (Express)  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ├────▶ HuggingFace API
                           ├────▶ Sentry (Errors)
                           └────▶ Winston (Logs)
```

## Documentation

- 📖 [Deployment Guide](docs/DEPLOYMENT.md)
- 🔧 [CI/CD Pipeline](docs/CI_CD.md)
- 📊 [Monitoring & Logging](docs/MONITORING_LOGGING_GUIDE.md)
- 🔐 [GitHub Secrets Setup](docs/GITHUB_SECRETS.md)
- 🚀 [API Documentation](http://localhost:3001/api-docs)

## Technology Stack

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 14
- **Logging**: Winston
- **Error Tracking**: Sentry
- **Testing**: Jest

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Testing**: Vitest

### DevOps
- **CI/CD**: GitHub Actions
- **Containers**: Docker
- **Orchestration**: Docker Compose
- **Registry**: GitHub Container Registry

## API Endpoints

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with metrics
- `GET /api/monitoring/system` - System metrics
- `GET /api/monitoring/performance` - Performance stats
- `GET /api/monitoring/analytics` - API analytics

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Verify token

### TTS/STT
- `POST /api/tts` - Text-to-speech
- `POST /api/stt` - Speech-to-text

### Chat
- `POST /api/chat` - Send chat message
- `GET /api/chat/history` - Chat history

### Models & Training
- `GET /api/models/detected` - List models
- `POST /api/training/start` - Start training
- `GET /api/training/status` - Training status

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature
```

### 2. Make Changes

```bash
# Backend changes
cd BACKEND
npm run dev

# Frontend changes
cd client
npm run dev
```

### 3. Run Tests

```bash
# Backend tests
cd BACKEND
npm test

# Frontend tests
cd client
npm test
```

### 4. Lint & Type Check

```bash
# Backend
cd BACKEND
npm run lint

# Frontend
cd client
npm run lint
```

### 5. Create Pull Request

CI pipeline will automatically:
- Run tests
- Type check
- Lint code
- Build project
- Security scan

### 6. Deploy

```bash
# Tag release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Automatic deployment triggers
```

## Monitoring

### Health Check

```bash
curl http://localhost:3001/health
```

### System Metrics

```bash
curl http://localhost:3001/api/monitoring/system
```

### Logs

```bash
# Development (console)
npm run dev

# Production (files)
tail -f logs/combined-*.log
tail -f logs/error-*.log
```

### Sentry Dashboard

Visit your Sentry dashboard for error tracking and performance monitoring.

## Environment Variables

### Required

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your_jwt_secret
DB_PASSWORD=your_db_password
```

### Optional

```bash
SENTRY_DSN=https://...@sentry.io/...
HF_TOKEN=hf_...
CORS_ORIGIN=http://localhost:3000
```

## Testing

### Backend Tests

```bash
cd BACKEND

# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Frontend Tests

```bash
cd client

# Run all tests
npm test

# UI mode
npm run test:ui

# Coverage
npm run test:coverage
```

## Deployment

### Manual Deployment

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Automated Deployment

Push to `main` or create a version tag:

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

GitHub Actions will automatically:
1. Run tests
2. Build Docker images
3. Push to registry
4. Deploy to server
5. Run health checks

## Rollback

### Via GitHub Actions

1. Go to Actions → Rollback Deployment
2. Select environment
3. Enter version to rollback to
4. Run workflow

### Manual Rollback

```bash
ssh user@server
cd /opt/persian-tts
git checkout v1.0.0
docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- 📧 Email: support@example.com
- 💬 Slack: [Join our Slack](https://slack.example.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/persian-tts/issues)

## Acknowledgments

- HuggingFace for TTS/STT models
- React team for the amazing framework
- All contributors to this project
