# 🚀 Deployment Guide - HF Downloads Feature

## Production Deployment Checklist

---

## 📋 Pre-Deployment

### 1. Environment Variables

Create production `.env` files:

**BACKEND/.env**
```bash
NODE_ENV=production
PORT=3001
HF_TOKEN_BASE64=<your_base64_encoded_production_token>
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
JWT_SECRET=<strong_random_string_min_32_chars>
LOG_LEVEL=info
```

**How to generate secure values:**
```bash
# HF Token (Base64)
echo -n "hf_your_production_token" | base64

# JWT Secret (random 64 chars)
openssl rand -hex 32

# Or use
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔨 Build Process

### Backend Build
```bash
cd BACKEND
npm install --production
npm run build

# Verify build
ls -la dist/
node dist/src/server.js
```

### Frontend Build
```bash
cd client
npm install
npm run build

# Verify build
ls -la dist/
# Should see index.html, assets/
```

---

## 🐳 Docker Deployment (Recommended)

### 1. Backend Dockerfile

Create `BACKEND/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/src/server.js"]
```

### 2. Frontend Dockerfile

Create `client/Dockerfile`:
```dockerfile
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3. Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  backend:
    build: ./BACKEND
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - HF_TOKEN_BASE64=${HF_TOKEN_BASE64}
      - CORS_ORIGIN=https://yourdomain.com
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Deploy:**
```bash
docker-compose up -d
docker-compose logs -f
```

---

## ☁️ Cloud Deployment

### AWS (EC2 + ALB)

**1. Launch EC2 Instance**
- Ubuntu 22.04 LTS
- t3.medium (2 vCPU, 4 GB RAM)
- Security Group: Allow 80, 443, 3001

**2. Install Dependencies**
```bash
# Connect via SSH
ssh -i key.pem ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt-get install -y nginx
```

**3. Deploy Code**
```bash
# Clone repo
git clone https://github.com/your-repo.git
cd your-repo

# Backend
cd BACKEND
npm install --production
npm run build
pm2 start dist/src/server.js --name "hf-backend"

# Frontend
cd ../client
npm install
npm run build
sudo cp -r dist/* /var/www/html/
```

**4. Configure Nginx**

`/etc/nginx/sites-available/default`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**5. SSL with Let's Encrypt**
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**6. Auto-restart on reboot**
```bash
pm2 startup
pm2 save
```

---

### Vercel (Frontend Only)

**1. Install Vercel CLI**
```bash
npm i -g vercel
```

**2. Deploy**
```bash
cd client
vercel --prod
```

**3. Configure Environment**
- Add backend URL in Vercel dashboard
- Update API endpoint in `vite.config.ts`

---

### Railway (Full Stack)

**1. Create Railway Account**

**2. Deploy via CLI**
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

**3. Add Variables**
```bash
railway variables set HF_TOKEN_BASE64=<token>
railway variables set CORS_ORIGIN=https://your-app.railway.app
```

---

## 🔐 Security Hardening

### 1. Rate Limiting (Nginx)
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/hf {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://localhost:3001;
}
```

### 2. Firewall (UFW)
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 3. Fail2Ban
```bash
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. Environment Secrets

**Never commit:**
- `.env` files
- `HF_TOKEN_BASE64`
- `JWT_SECRET`

**Use secrets management:**
- AWS Secrets Manager
- HashiCorp Vault
- Kubernetes Secrets

---

## 📊 Monitoring

### 1. PM2 Monitoring
```bash
pm2 monit
pm2 logs
```

### 2. Health Checks
```bash
# Backend
curl http://localhost:3001/health

# Frontend
curl http://localhost/
```

### 3. Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 7
```

### 4. Uptime Monitoring
- UptimeRobot (free)
- Pingdom
- StatusCake

---

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Build Backend
        run: |
          cd BACKEND
          npm ci
          npm run build
      
      - name: Build Frontend
        run: |
          cd client
          npm ci
          npm run build
      
      - name: Deploy to Server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          source: "."
          target: "/var/www/app"
      
      - name: Restart Services
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/app
            pm2 restart hf-backend
            sudo cp -r client/dist/* /var/www/html/
```

---

## 🧪 Post-Deployment Testing

### 1. Smoke Tests
```bash
# Health check
curl https://yourdomain.com/api/health

# HF Search
curl https://yourdomain.com/api/hf/search?kind=models&limit=1

# Frontend
curl https://yourdomain.com/hf-downloads
```

### 2. Load Testing
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test API
ab -n 1000 -c 10 https://yourdomain.com/api/hf/search?kind=models
```

### 3. Security Scan
```bash
# Install OWASP ZAP
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://yourdomain.com
```

---

## 📈 Performance Optimization

### 1. CDN (Cloudflare)
- Point DNS to Cloudflare
- Enable Auto Minify
- Enable Brotli compression
- Set Cache rules

### 2. Redis Caching
```typescript
// Add to BACKEND/src/routes/hf.ts
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

router.get('/search', async (req, res) => {
  const cacheKey = `hf:${kind}:${q}:${page}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  // ... fetch from HF ...
  
  await redis.setex(cacheKey, 300, JSON.stringify(data));
});
```

### 3. Gzip Compression (Nginx)
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript;
```

---

## 🔧 Maintenance

### Backup Strategy
```bash
# Database (if using)
pg_dump dbname > backup.sql

# Environment files
tar -czf env-backup.tar.gz BACKEND/.env

# Upload to S3
aws s3 cp backup.sql s3://your-bucket/backups/
```

### Update Process
```bash
# 1. Backup current version
cp -r /var/www/app /var/www/app-backup

# 2. Pull updates
cd /var/www/app
git pull origin main

# 3. Install dependencies
cd BACKEND && npm install
cd ../client && npm install

# 4. Build
cd BACKEND && npm run build
cd ../client && npm run build

# 5. Restart
pm2 restart hf-backend
sudo cp -r client/dist/* /var/www/html/

# 6. Verify
curl http://localhost:3001/health
```

---

## 🆘 Rollback Procedure

```bash
# Stop current version
pm2 stop hf-backend

# Restore backup
rm -rf /var/www/app
mv /var/www/app-backup /var/www/app

# Restart
cd /var/www/app/BACKEND
pm2 start dist/src/server.js --name "hf-backend"

# Restore frontend
sudo cp -r /var/www/app/client/dist/* /var/www/html/
```

---

## 📞 Support Contacts

**Emergency Issues:**
1. Check logs: `pm2 logs hf-backend`
2. Check health: `curl http://localhost:3001/health`
3. Restart service: `pm2 restart hf-backend`
4. Check Nginx: `sudo nginx -t && sudo systemctl reload nginx`

**Monitoring Endpoints:**
- Backend Health: `https://yourdomain.com/api/health`
- Frontend: `https://yourdomain.com/`
- Metrics: `https://yourdomain.com/api/monitoring/metrics`

---

## ✅ Deployment Complete!

Your HF Downloads feature is now live in production! 🎉

**Verify:**
- ✅ Backend health check returns 200
- ✅ Frontend loads without errors
- ✅ `/hf-downloads` route accessible
- ✅ All 4 tabs functional
- ✅ Search and pagination work
- ✅ SSL certificate valid
- ✅ Monitoring enabled

**Next Steps:**
1. Set up monitoring alerts
2. Configure backups
3. Test disaster recovery
4. Document runbooks
5. Train support team
