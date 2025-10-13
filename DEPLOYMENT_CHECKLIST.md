# 🚢 PRODUCTION DEPLOYMENT CHECKLIST

## Pre-Deployment Verification

### ✅ Code Quality
- [ ] TypeScript compiles with no errors: `cd client && npm run lint`
- [ ] Build completes successfully: `cd client && npm run build`
- [ ] No console errors in development
- [ ] All features tested manually
- [ ] Responsive design verified (mobile, tablet, desktop)

### ✅ Backend Requirements
- [ ] All 4 API endpoints are working:
  - [ ] `GET /health/detailed`
  - [ ] `GET /api/monitoring/system`
  - [ ] `GET /api/monitoring/analytics`
  - [ ] `GET /api/monitoring/performance`
- [ ] CORS configured for production domain
- [ ] Environment variables set correctly
- [ ] Database connection works
- [ ] API rate limiting configured
- [ ] Error logging enabled

### ✅ Frontend Configuration
- [ ] Update API_BASE URL in `useMonitoring.ts`:
  ```typescript
  // Change from:
  const API_BASE = 'http://localhost:3001';
  
  // To:
  const API_BASE = process.env.VITE_API_BASE_URL || 'https://your-api.com';
  ```
- [ ] Create `.env.production` file:
  ```env
  VITE_API_BASE_URL=https://your-production-api.com
  ```
- [ ] Build optimized bundle: `npm run build`
- [ ] Test production build: `npm run preview`

### ✅ Performance
- [ ] Bundle size acceptable (< 500KB gzipped)
- [ ] Images optimized
- [ ] Code splitting working
- [ ] Lazy loading enabled
- [ ] No memory leaks

### ✅ Security
- [ ] No API keys in frontend code
- [ ] HTTPS enabled
- [ ] CSP headers configured
- [ ] XSS protection enabled
- [ ] Dependencies updated (no critical vulnerabilities)

### ✅ Monitoring & Analytics
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Performance monitoring enabled
- [ ] Analytics tracking added (optional)
- [ ] Logging configured

---

## Deployment Steps

### Option 1: Vercel (Recommended for Frontend)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy Frontend**
   ```bash
   cd client
   vercel
   ```

3. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add: `VITE_API_BASE_URL=https://your-backend.com`

4. **Deploy Production**
   ```bash
   vercel --prod
   ```

### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm i -g netlify-cli
   ```

2. **Build**
   ```bash
   cd client
   npm run build
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod --dir=dist
   ```

4. **Configure Environment Variables**
   - Netlify Dashboard → Site settings → Environment variables
   - Add: `VITE_API_BASE_URL`

### Option 3: Self-Hosted (Nginx)

1. **Build Frontend**
   ```bash
   cd client
   npm run build
   # Output in client/dist/
   ```

2. **Copy to Server**
   ```bash
   scp -r dist/* user@server:/var/www/dashboard/
   ```

3. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name dashboard.yourdomain.com;
       root /var/www/dashboard;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Enable HTTPS**
   ```bash
   sudo certbot --nginx -d dashboard.yourdomain.com
   ```

### Option 4: Docker

1. **Create Dockerfile**
   ```dockerfile
   # client/Dockerfile
   FROM node:18-alpine as build
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

2. **Build & Run**
   ```bash
   docker build -t dashboard-frontend .
   docker run -p 3000:80 dashboard-frontend
   ```

---

## Post-Deployment Verification

### ✅ Functional Testing
- [ ] Navigate to production URL
- [ ] Dashboard loads without errors
- [ ] All metrics display data
- [ ] Charts render correctly
- [ ] Auto-refresh works (10s interval)
- [ ] Manual refresh works
- [ ] Health checks update
- [ ] API analytics show data
- [ ] Performance table displays

### ✅ Performance Testing
- [ ] PageSpeed Insights score > 90
- [ ] Time to Interactive < 3s
- [ ] First Contentful Paint < 1.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] No console errors
- [ ] No network errors

### ✅ Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### ✅ Responsive Testing
- [ ] Mobile (375px)
- [ ] Tablet (768px)
- [ ] Desktop (1920px)
- [ ] 4K (2560px)

### ✅ API Monitoring
- [ ] Set up uptime monitoring (UptimeRobot, etc.)
- [ ] Configure alerts for downtime
- [ ] Monitor API response times
- [ ] Track error rates

---

## Environment Variables

### Frontend (.env.production)
```env
# API Configuration
VITE_API_BASE_URL=https://api.yourdomain.com

# Optional: Analytics
VITE_GA_ID=UA-XXXXXXXXX-X

# Optional: Error Tracking
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Backend (.env.production)
```env
# Server
PORT=3001
NODE_ENV=production

# Database
MONGODB_URI=mongodb://your-production-db

# CORS
CORS_ORIGIN=https://dashboard.yourdomain.com

# API Keys (if needed)
API_SECRET_KEY=your-secret-key
```

---

## Monitoring Setup

### 1. Error Tracking (Sentry)

**Install**
```bash
npm install @sentry/react
```

**Configure** (client/src/main.tsx)
```typescript
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [new Sentry.BrowserTracing()],
    tracesSampleRate: 1.0,
  });
}
```

### 2. Performance Monitoring

**Web Vitals**
```bash
npm install web-vitals
```

**Configure** (client/src/main.tsx)
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

if (import.meta.env.PROD) {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
}
```

### 3. Uptime Monitoring

Services to consider:
- **UptimeRobot** (Free tier available)
- **Pingdom**
- **StatusCake**
- **Better Uptime**

Configure to monitor:
- Frontend URL: `https://dashboard.yourdomain.com`
- Backend health: `https://api.yourdomain.com/health/detailed`
- Check interval: Every 5 minutes
- Alert via: Email, SMS, Slack

---

## Rollback Plan

If deployment fails:

1. **Keep Previous Version**
   ```bash
   # Tag before deploying
   git tag -a v1.0.0 -m "Pre-deployment backup"
   git push origin v1.0.0
   ```

2. **Quick Rollback (Vercel)**
   ```bash
   vercel rollback
   ```

3. **Quick Rollback (Netlify)**
   - Netlify Dashboard → Deploys → Previous deploy → Publish

4. **Manual Rollback**
   ```bash
   git revert HEAD
   git push origin main
   # Trigger new deployment
   ```

---

## Troubleshooting Common Issues

### Issue: CORS Errors
**Solution**: Update backend CORS configuration
```javascript
app.use(cors({
  origin: 'https://dashboard.yourdomain.com',
  credentials: true
}));
```

### Issue: API_BASE not found
**Solution**: Check environment variables are set correctly
```bash
# Vercel
vercel env ls

# Netlify
netlify env:list
```

### Issue: Build fails
**Solution**: Clear cache and rebuild
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Charts not rendering
**Solution**: Check recharts is in dependencies, not devDependencies
```json
{
  "dependencies": {
    "recharts": "^2.x.x"
  }
}
```

---

## Support Contacts

- **Developer**: [Your contact]
- **DevOps**: [DevOps contact]
- **On-call**: [On-call schedule]

---

## Success Criteria

Deployment is successful when:
- ✅ All functional tests pass
- ✅ No console errors
- ✅ PageSpeed score > 90
- ✅ All API endpoints responding
- ✅ Auto-refresh working
- ✅ Charts rendering correctly
- ✅ Mobile responsive
- ✅ Monitoring configured
- ✅ Rollback plan tested

---

**Last Updated**: 2025-10-13
**Version**: 1.0.0
