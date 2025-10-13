# Deployment Guide

## Prerequisites

1. **Server Setup**
   - Ubuntu 22.04 LTS or higher
   - Docker and Docker Compose installed
   - PostgreSQL 14+
   - Minimum 4GB RAM, 20GB disk space

2. **Domain Configuration**
   - Domain pointed to server IP
   - SSL certificate (Let's Encrypt recommended)

3. **GitHub Configuration**
   - Repository secrets configured
   - GitHub Actions enabled

## Initial Deployment

### 1. Server Preparation

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Create application directory
sudo mkdir -p /opt/persian-tts
sudo chown $USER:$USER /opt/persian-tts
cd /opt/persian-tts

# Clone repository
git clone https://github.com/yourusername/persian-tts.git .
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env

# Set secure secrets
export JWT_SECRET=$(openssl rand -hex 32)
export SESSION_SECRET=$(openssl rand -hex 32)
echo "JWT_SECRET=$JWT_SECRET" >> .env
echo "SESSION_SECRET=$SESSION_SECRET" >> .env

# Set database password
export DB_PASSWORD=$(openssl rand -hex 16)
echo "DB_PASSWORD=$DB_PASSWORD" >> .env
```

### 3. Initialize Database

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Wait for database to be ready
sleep 10

# Database will auto-initialize from schema.sql
```

### 4. Deploy Application

```bash
# Build and start all services
docker-compose up -d

# Check health
curl http://localhost:3001/health

# Check logs
docker-compose logs -f backend
```

## CI/CD Deployment

### Automatic Deployment

Deployments are triggered automatically on:
- Push to `main` branch
- New version tags (`v*`)

### Manual Deployment

1. Go to Actions tab in GitHub
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Select environment (staging/production)
5. Click "Run workflow"

### Monitoring Deployment

```bash
# Watch logs
docker-compose logs -f backend

# Check container status
docker-compose ps

# View health status
curl http://your-domain.com/health/detailed
```

## Rollback Procedure

### Via GitHub Actions

1. Go to Actions tab
2. Select "Rollback Deployment" workflow
3. Enter:
   - Environment: production
   - Version: v1.0.0 (or commit hash)
4. Click "Run workflow"

### Manual Rollback

```bash
ssh user@server

cd /opt/persian-tts

# Checkout previous version
git checkout v1.0.0

# Restart services
docker-compose up -d

# Verify health
curl http://localhost:3001/health
```

## Zero-Downtime Deployment

The deployment workflow uses rolling updates:

1. Scale backend to 2 instances
2. Update one instance
3. Health check
4. Update second instance
5. Scale back to 1 instance

## Monitoring

### Health Checks

```bash
# Basic health
curl http://your-domain.com/health

# Detailed metrics
curl http://your-domain.com/health/detailed

# System metrics
curl http://your-domain.com/api/monitoring/system
```

### Logs

```bash
# Backend logs
docker-compose logs -f backend

# Database logs
docker-compose logs -f postgres

# Nginx logs
docker-compose logs -f client
```

### Sentry

If configured, errors are automatically sent to Sentry dashboard.

## Backup and Restore

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres persian_tts > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres persian_tts < backup.sql
```

### Models Backup

```bash
# Backup models directory
tar -czf models-backup.tar.gz /opt/persian-tts/models/

# Restore models
tar -xzf models-backup.tar.gz -C /opt/persian-tts/
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Check health
docker-compose ps

# Restart service
docker-compose restart backend
```

### Database Connection Error

```bash
# Verify database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec backend node -e "require('./dist/database/connection').query('SELECT 1')"
```

### High Memory Usage

```bash
# Check memory usage
docker stats

# Restart specific service
docker-compose restart backend

# Scale down if needed
docker-compose up -d --scale backend=1
```

## SSL/TLS Setup (Let's Encrypt)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl status certbot.timer
```

## Performance Optimization

### Database

```bash
# Create indexes
docker-compose exec postgres psql -U postgres persian_tts -c "CREATE INDEX idx_users_email ON users(email);"

# Analyze tables
docker-compose exec postgres psql -U postgres persian_tts -c "ANALYZE;"
```

### Nginx

Edit `client/nginx.conf` to add caching:

```nginx
# Browser cache
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Scaling

### Horizontal Scaling

```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Add load balancer (nginx)
# Configure upstream in nginx.conf
```

### Vertical Scaling

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```
