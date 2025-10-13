# Production Deployment Checklist

Use this checklist to ensure your Persian TTS platform is ready for production deployment.

## Pre-Deployment Checklist

### 1. Environment Configuration ✓

- [ ] Copy `.env.example` to `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Generate secure secrets:
  ```bash
  openssl rand -hex 32  # JWT_SECRET
  openssl rand -hex 32  # SESSION_SECRET
  openssl rand -hex 16  # DB_PASSWORD
  ```
- [ ] Configure database connection:
  - [ ] `DATABASE_URL` or individual DB credentials
  - [ ] Database is accessible from server
  - [ ] Database has been initialized with schema
- [ ] Set HuggingFace token (`HF_TOKEN`)
- [ ] Configure CORS origins for production domain
- [ ] Set Sentry DSN (optional but recommended)

### 2. Server Setup ✓

- [ ] Server meets minimum requirements:
  - [ ] Ubuntu 22.04 LTS or higher
  - [ ] 4GB RAM minimum
  - [ ] 20GB disk space minimum
  - [ ] Docker and Docker Compose installed
- [ ] Domain configuration:
  - [ ] Domain points to server IP
  - [ ] SSL certificate obtained (Let's Encrypt recommended)
  - [ ] Firewall configured (ports 80, 443, 22)
- [ ] SSH access configured:
  - [ ] SSH key generated for deployment
  - [ ] SSH key added to server
  - [ ] SSH access tested

### 3. GitHub Configuration ✓

- [ ] Repository secrets configured:
  - [ ] `DEPLOY_SSH_KEY` - SSH private key for deployment
  - [ ] `SERVER_HOST` - Server IP or domain
  - [ ] `SERVER_USER` - SSH username
  - [ ] `DB_PASSWORD` - Database password
  - [ ] `JWT_SECRET` - JWT signing secret
  - [ ] `SESSION_SECRET` - Session secret
  - [ ] `HF_TOKEN` - HuggingFace API token
  - [ ] `SENTRY_DSN` - Sentry DSN (optional)
  - [ ] `SLACK_WEBHOOK` - Slack webhook (optional)
- [ ] GitHub Actions enabled
- [ ] Branch protection rules set for `main`
- [ ] Environment protection rules configured

### 4. Code Quality ✓

- [ ] All TypeScript compilation errors fixed:
  ```bash
  cd BACKEND && npm run lint
  ```
- [ ] All tests passing:
  ```bash
  cd BACKEND && npm test
  ```
- [ ] Code coverage meets threshold (70%)
- [ ] Security vulnerabilities addressed:
  ```bash
  npm audit fix
  ```

### 5. Database Setup ✓

- [ ] PostgreSQL 14+ installed and running
- [ ] Database created
- [ ] Schema initialized:
  ```bash
  psql -U postgres -d persian_tts -f BACKEND/src/database/schema.sql
  ```
- [ ] Database backups configured
- [ ] Database credentials secured
- [ ] Connection pooling configured

### 6. Monitoring Setup ✓

- [ ] Sentry account created (if using)
- [ ] Sentry DSN configured
- [ ] Log directory permissions set:
  ```bash
  mkdir -p /opt/persian-tts/logs
  chmod 755 /opt/persian-tts/logs
  ```
- [ ] Health check endpoints tested:
  ```bash
  curl http://localhost:3001/health
  curl http://localhost:3001/health/detailed
  ```
- [ ] Monitoring endpoints tested:
  ```bash
  curl http://localhost:3001/api/monitoring/system
  curl http://localhost:3001/api/monitoring/performance
  curl http://localhost:3001/api/monitoring/analytics
  ```

### 7. Docker Configuration ✓

- [ ] Docker images build successfully:
  ```bash
  docker-compose build
  ```
- [ ] Docker volumes configured for persistence:
  - [ ] PostgreSQL data: `/var/lib/postgresql/data`
  - [ ] Model files: `/opt/persian-tts/models`
  - [ ] Log files: `/opt/persian-tts/logs`
- [ ] Health checks working:
  ```bash
  docker-compose ps
  ```
- [ ] Resource limits set (if needed)

### 8. Security ✓

- [ ] All secrets stored securely (not in code)
- [ ] HTTPS enabled (SSL certificate)
- [ ] Firewall configured (only necessary ports open)
- [ ] Database not exposed to internet
- [ ] Security headers configured in Nginx
- [ ] Rate limiting configured
- [ ] Input validation in place
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled

### 9. Performance ✓

- [ ] Database indexes created
- [ ] Nginx caching configured
- [ ] Gzip compression enabled
- [ ] Static assets optimized
- [ ] Connection pooling configured
- [ ] Resource limits appropriate

### 10. Backup & Recovery ✓

- [ ] Database backup strategy defined
- [ ] Automated backups configured
- [ ] Backup restoration tested
- [ ] Model files backed up
- [ ] Rollback procedure documented and tested

## Deployment Steps

### Step 1: Initial Server Setup

```bash
# SSH into server
ssh user@your-server.com

# Create application directory
sudo mkdir -p /opt/persian-tts
sudo chown $USER:$USER /opt/persian-tts
cd /opt/persian-tts

# Clone repository
git clone https://github.com/yourusername/persian-tts.git .

# Create environment file
cp .env.example .env
nano .env  # Edit with production values
```

### Step 2: Database Initialization

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Wait for database to be ready
sleep 10

# Initialize schema (automatically done via docker-compose)
# Or manually:
# docker-compose exec postgres psql -U postgres -d persian_tts -f /docker-entrypoint-initdb.d/schema.sql
```

### Step 3: Deploy Application

```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 4: Verify Deployment

```bash
# Health check
curl http://localhost:3001/health

# Detailed health
curl http://localhost:3001/health/detailed

# System metrics
curl http://localhost:3001/api/monitoring/system

# Check logs
docker-compose logs backend | tail -50
```

### Step 5: Configure Monitoring

```bash
# Set up log rotation (if not using Winston rotation)
sudo nano /etc/logrotate.d/persian-tts

# Configure alerting (Sentry)
# - Set up alert rules in Sentry dashboard
# - Configure notification channels

# Set up uptime monitoring (optional)
# - Configure external uptime monitoring service
# - Set up alerts for downtime
```

### Step 6: SSL/TLS Setup

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Post-Deployment Checklist

### Immediate Verification (0-1 hours)

- [ ] Application is accessible via domain
- [ ] HTTPS is working correctly
- [ ] Health endpoints return 200 OK
- [ ] Database connections working
- [ ] Logs are being written
- [ ] Error tracking is active (Sentry)
- [ ] No critical errors in logs

### Short-term Monitoring (1-24 hours)

- [ ] Monitor error rates
- [ ] Check response times
- [ ] Verify database performance
- [ ] Monitor memory usage
- [ ] Monitor CPU usage
- [ ] Check disk space
- [ ] Verify log rotation

### Long-term Monitoring (1-7 days)

- [ ] Review error patterns
- [ ] Analyze performance trends
- [ ] Check backup completion
- [ ] Monitor disk usage growth
- [ ] Review security logs
- [ ] Test rollback procedure
- [ ] Verify auto-scaling (if configured)

## Rollback Procedure

If deployment fails or issues are discovered:

### Via GitHub Actions

1. Go to GitHub Actions
2. Select "Rollback Deployment" workflow
3. Enter environment and version to rollback to
4. Run workflow

### Manual Rollback

```bash
ssh user@your-server.com
cd /opt/persian-tts

# Checkout previous version
git checkout v1.0.0  # or specific commit

# Restart services
docker-compose down
docker-compose up -d

# Verify
curl http://localhost:3001/health
```

## Monitoring Dashboards

### Required Monitoring

- [ ] Application logs (Winston)
- [ ] Error tracking (Sentry)
- [ ] Health checks (built-in endpoints)
- [ ] System metrics (built-in API)

### Optional but Recommended

- [ ] Grafana dashboards
- [ ] Prometheus metrics
- [ ] APM tool (New Relic, DataDog)
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Log aggregation (ELK stack, Loki)

## Performance Benchmarks

After deployment, verify these performance targets:

- [ ] Health check response time: < 100ms
- [ ] API response time (p95): < 500ms
- [ ] Database query time (p95): < 100ms
- [ ] Error rate: < 1%
- [ ] Uptime: > 99.9%
- [ ] Memory usage: < 70%
- [ ] CPU usage: < 70%

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Check environment
docker-compose exec backend env

# Verify database connection
docker-compose exec backend node -e "require('./dist/database/connection').query('SELECT 1')"
```

### High Memory Usage

```bash
# Check memory usage
docker stats

# Restart backend
docker-compose restart backend

# Scale down if needed
docker-compose up -d --scale backend=1
```

### Database Connection Issues

```bash
# Check database status
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U postgres -d persian_tts -c "SELECT 1"
```

## Emergency Contacts

Document your emergency contact information:

- [ ] Infrastructure team: _____________
- [ ] Database admin: _____________
- [ ] Security team: _____________
- [ ] On-call engineer: _____________

## Sign-off

- [ ] Development team lead approval
- [ ] QA team approval
- [ ] Security team approval
- [ ] Operations team approval
- [ ] Product owner approval

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Version**: _____________  
**Environment**: _____________

---

## Quick Reference Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend

# Restart service
docker-compose restart backend

# Check health
curl http://localhost:3001/health

# Run backup
docker-compose exec postgres pg_dump -U postgres persian_tts > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres persian_tts < backup.sql

# Scale backend
docker-compose up -d --scale backend=2

# Update application
git pull origin main
docker-compose up -d --build
```
