# CI/CD Pipeline Documentation

## Overview

The Persian TTS platform uses GitHub Actions for continuous integration and deployment. The pipeline includes automated testing, building, security scanning, and deployment.

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Trigger:** Push or PR to `main` or `develop` branches

**Jobs:**
- **backend-tests**: Runs backend tests with PostgreSQL
- **frontend-tests**: Runs frontend tests and builds
- **security-scan**: Vulnerability scanning with Trivy
- **build**: Builds both backend and frontend

**Features:**
- Automated testing with coverage reports
- TypeScript type checking
- ESLint linting
- Security vulnerability scanning
- Artifact uploads for deployments

### 2. Docker Build (`docker-build.yml`)

**Trigger:** Push to `main`, tags `v*`, or PRs

**Jobs:**
- **build-backend**: Builds and pushes backend Docker image
- **build-client**: Builds and pushes client Docker image

**Features:**
- Multi-stage Docker builds
- GitHub Container Registry integration
- Build caching for faster builds
- Semantic versioning tags

### 3. Deployment (`deploy.yml`)

**Trigger:** Version tags or manual dispatch

**Jobs:**
- **deploy**: Deploys to staging or production

**Features:**
- SSH-based deployment
- Rolling updates (zero downtime)
- Automatic health checks
- Environment-specific configurations

### 4. Rollback (`rollback.yml`)

**Trigger:** Manual dispatch only

**Jobs:**
- **rollback**: Rolls back to a specific version

**Features:**
- Quick rollback to any previous version
- Health check verification
- Notification system

## Workflow Diagrams

### CI Pipeline Flow

```
Push/PR → Checkout → Install Deps → Lint → Type Check → Test → Build → Upload Artifacts
```

### Deployment Flow

```
Tag v* → Checkout → Build Docker → Push to Registry → SSH Deploy → Health Check → Success
```

## Environment Variables

### Required in GitHub Secrets

```bash
# Deployment
DEPLOY_SSH_KEY          # SSH private key
SERVER_HOST             # Server IP/hostname
SERVER_USER             # SSH username

# Application
DB_PASSWORD             # Database password
JWT_SECRET              # JWT signing secret
SESSION_SECRET          # Session secret

# Services
HF_TOKEN                # HuggingFace token
SENTRY_DSN              # Sentry DSN (optional)

# Notifications
SLACK_WEBHOOK           # Slack webhook (optional)
```

### Available in Workflows

```yaml
github.sha              # Commit SHA
github.ref_name         # Branch/tag name
github.event_name       # Event type
github.actor            # User who triggered
```

## Testing Strategy

### Backend Tests

```bash
# Unit tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# CI mode
npm run test:ci
```

**Coverage Requirements:**
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

### Frontend Tests

```bash
# Unit tests
npm test

# With UI
npm run test:ui

# Coverage
npm run test:coverage
```

## Build Process

### Backend Build

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
COPY --from=builder /app/dist ./dist
RUN npm ci --only=production
CMD ["node", "dist/src/server.js"]
```

### Frontend Build

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
RUN npm ci && npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

## Deployment Strategy

### Zero-Downtime Deployment

1. **Scale up**: Start new instance
2. **Health check**: Verify new instance
3. **Switch traffic**: Update load balancer
4. **Scale down**: Stop old instance

### Rolling Update Process

```bash
# Scale to 2 instances
docker-compose up -d --scale backend=2

# Wait for health check
sleep 10

# Scale back to 1 (keeps new instance)
docker-compose up -d --scale backend=1
```

## Monitoring Integration

### Health Checks

```bash
# Simple health check
GET /health

# Detailed with metrics
GET /health/detailed

# System metrics
GET /api/monitoring/system
```

### Performance Metrics

```bash
# Performance stats
GET /api/monitoring/performance

# API analytics
GET /api/monitoring/analytics
```

## Security Scanning

### Trivy Scanner

Scans for:
- Known vulnerabilities (CVEs)
- Misconfigured secrets
- IaC issues
- License compliance

### NPM Audit

```bash
# Backend
npm audit --audit-level=high

# Frontend
npm audit --audit-level=high
```

## Caching Strategy

### GitHub Actions Cache

```yaml
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### Docker Build Cache

```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

## Troubleshooting

### Build Failures

```bash
# Check workflow logs
gh run view <run-id>

# Re-run failed jobs
gh run rerun <run-id> --failed
```

### Deployment Failures

```bash
# SSH into server
ssh user@server

# Check container logs
docker-compose logs backend

# Check health
curl http://localhost:3001/health
```

### Test Failures

```bash
# Run tests locally
npm test

# With verbose output
npm run test:verbose

# Check coverage
npm run test:coverage
```

## Best Practices

### 1. Branch Protection

```yaml
# .github/settings.yml
branches:
  - name: main
    protection:
      required_status_checks:
        strict: true
        contexts:
          - backend-tests
          - frontend-tests
          - build
      required_pull_request_reviews:
        required_approving_review_count: 1
```

### 2. Semantic Versioning

```bash
# Major version (breaking changes)
git tag -a v2.0.0 -m "Major update"

# Minor version (new features)
git tag -a v1.1.0 -m "New feature"

# Patch version (bug fixes)
git tag -a v1.0.1 -m "Bug fix"
```

### 3. Environment Separation

```yaml
environments:
  - name: staging
    protection_rules: []
  - name: production
    protection_rules:
      - required_reviewers: 1
      - wait_timer: 5
```

### 4. Secrets Management

- Use GitHub Secrets for sensitive data
- Rotate secrets every 90 days
- Use environment-specific secrets
- Never log secrets in workflows

## Notifications

### Slack Integration

```yaml
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Deployment ${{ job.status }}"
      }
```

## Maintenance

### Regular Tasks

1. **Weekly**: Review failed workflows
2. **Monthly**: Update dependencies
3. **Quarterly**: Rotate secrets
4. **Annually**: Review and optimize pipelines

### Dependency Updates

```bash
# Check outdated packages
npm outdated

# Update dependencies
npm update

# Security updates
npm audit fix
```
