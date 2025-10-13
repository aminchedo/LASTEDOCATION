# DEPLOYMENT GUIDE - Model Training Project

Complete guide for deploying the Model Training Project to production environments.

---

## 🎯 Deployment Options

1. **Docker Compose** (Recommended) - Easiest, works everywhere
2. **Kubernetes** - For large-scale, high-availability deployments
3. **Traditional VPS** - Manual setup on virtual private server
4. **Cloud Platforms** - AWS, GCP, Azure with managed services

---

## 🐳 Option 1: Docker Compose Deployment (Recommended)

### Prerequisites

- Docker 24.0+
- Docker Compose 2.20+
- 20+ GB free disk space
- Open ports: 3000, 3001

### Step-by-Step Deployment

#### 1. Prepare the Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

#### 2. Clone and Configure

```bash
# Clone repository
git clone <repository-url>
cd <project-directory>

# Create production environment file
cp .env.example .env
nano .env
```

**Important: Set these in `.env`:**

```env
NODE_ENV=production
JWT_SECRET=<generate-with-openssl-rand-base64-32>
CORS_ORIGIN=https://yourdomain.com
```

#### 3. Build and Deploy

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Verify services are running
docker-compose ps

# Check logs
docker-compose logs -f
```

#### 4. Configure Nginx Reverse Proxy (Optional)

If you want to use a custom domain with SSL:

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/model-training
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 600s;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/model-training /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 5. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## ☸️ Option 2: Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (GKE, EKS, AKS, or self-hosted)
- kubectl installed and configured
- Helm 3+ (optional but recommended)

### 1. Create Kubernetes Manifests

**Namespace:**

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: model-training
```

**ConfigMap:**

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: model-training
data:
  NODE_ENV: "production"
  PORT: "3001"
  LOG_LEVEL: "info"
```

**Secret:**

```yaml
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: model-training
type: Opaque
stringData:
  JWT_SECRET: "your-jwt-secret-here"
```

**Backend Deployment:**

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: model-training
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry/model-training-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: JWT_SECRET
        envFrom:
        - configMapRef:
            name: app-config
        volumeMounts:
        - name: models
          mountPath: /app/models
        - name: data
          mountPath: /app/data
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
      volumes:
      - name: models
        persistentVolumeClaim:
          claimName: models-pvc
      - name: data
        persistentVolumeClaim:
          claimName: data-pvc
```

**Service:**

```yaml
# k8s/backend-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: model-training
spec:
  selector:
    app: backend
  ports:
  - protocol: TCP
    port: 3001
    targetPort: 3001
  type: ClusterIP
```

**Ingress:**

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: model-training
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - yourdomain.com
    secretName: app-tls
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 3001
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

### 2. Deploy to Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods -n model-training
kubectl get services -n model-training
kubectl get ingress -n model-training

# View logs
kubectl logs -f deployment/backend -n model-training
```

---

## 🖥️ Option 3: Traditional VPS Deployment

### Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- 4+ GB RAM
- 20+ GB disk space
- Root or sudo access

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python
sudo apt install -y python3 python3-pip python3-venv

# Install build tools
sudo apt install -y build-essential

# Install Nginx
sudo apt install -y nginx

# Install PM2 for process management
sudo npm install -g pm2
```

### 2. Deploy Application

```bash
# Clone repository
cd /var/www
sudo git clone <repository-url> model-training
cd model-training

# Set ownership
sudo chown -R $USER:$USER /var/www/model-training

# Install dependencies
npm install
cd BACKEND && npm install && npm run build && cd ..
cd client && npm install && npm run build && cd ..

# Install Python dependencies
pip3 install -r requirements.txt
```

### 3. Configure PM2

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: '/var/www/model-training/BACKEND',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/backend-error.log',
      out_file: '/var/log/pm2/backend-out.log'
    }
  ]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Setup PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

### 4. Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/model-training
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/model-training/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 600s;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/model-training /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## ☁️ Option 4: Cloud Platform Deployment

### AWS Deployment

**Using AWS Elastic Beanstalk:**

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p docker model-training-app

# Create environment
eb create production

# Deploy
eb deploy
```

### Google Cloud Platform

**Using Google Cloud Run:**

```bash
# Build and push image
gcloud builds submit --tag gcr.io/PROJECT_ID/model-training

# Deploy
gcloud run deploy model-training \
  --image gcr.io/PROJECT_ID/model-training \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Azure

**Using Azure Container Instances:**

```bash
# Create resource group
az group create --name ModelTrainingRG --location eastus

# Deploy container
az container create \
  --resource-group ModelTrainingRG \
  --name model-training \
  --image your-registry/model-training:latest \
  --dns-name-label model-training \
  --ports 3000 3001
```

---

## 🔒 Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (UFW or iptables)
- [ ] Disable root SSH login
- [ ] Setup fail2ban
- [ ] Enable rate limiting
- [ ] Setup log monitoring
- [ ] Regular security updates
- [ ] Backup strategy implemented
- [ ] Environment variables secured

---

## 📊 Monitoring & Maintenance

### Setup Monitoring

```bash
# Install monitoring tools
docker run -d --name=grafana -p 3002:3000 grafana/grafana
docker run -d --name=prometheus -p 9090:9090 prom/prometheus
```

### Backup Strategy

```bash
# Create backup script
cat > backup.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Backup models
tar -czf \$BACKUP_DIR/models_\$DATE.tar.gz models/

# Backup data
tar -czf \$BACKUP_DIR/data_\$DATE.tar.gz data/

# Backup database
tar -czf \$BACKUP_DIR/db_\$DATE.tar.gz BACKEND/data/*.db

# Delete old backups (keep last 7 days)
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: \$DATE"
EOF

chmod +x backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /path/to/backup.sh") | crontab -
```

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild Docker images
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Or with PM2
pm2 stop all
git pull origin main
cd BACKEND && npm run build && cd ..
cd client && npm run build && cd ..
pm2 restart all
```

---

## 🐛 Troubleshooting

### Check Service Status

```bash
# Docker
docker-compose ps
docker-compose logs -f

# PM2
pm2 status
pm2 logs

# Nginx
sudo systemctl status nginx
sudo nginx -t

# Disk space
df -h

# Memory usage
free -h
```

### Common Issues

**Issue: Out of memory**

```bash
# Increase swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

**Issue: Port already in use**

```bash
# Find and kill process
sudo lsof -i :3001
sudo kill -9 <PID>
```

---

## 📞 Support

For deployment issues, check:

1. Application logs
2. Nginx/Apache error logs
3. System logs (`/var/log/`)
4. Docker logs (`docker-compose logs`)

---

**Deployment Complete! 🎉**
