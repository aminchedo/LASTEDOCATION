# 🚀 Deployment Checklist - ML Training Platform

Use this checklist to ensure proper deployment to each environment.

---

## 📋 Pre-Deployment Checklist (All Environments)

### Code Quality
- [ ] All TypeScript compilation errors fixed
- [ ] ESLint warnings reviewed and addressed
- [ ] No console.log statements in production code
- [ ] All TODO comments reviewed
- [ ] Code reviewed by team member

### Testing
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing completed (see TESTING_GUIDE.md)
- [ ] Performance testing done
- [ ] Security testing completed

### Documentation
- [ ] README.md updated
- [ ] API documentation (Swagger) up to date
- [ ] Deployment documentation reviewed
- [ ] Known issues documented

---

## 🔧 Development Environment

### Setup
- [ ] `.env` files created from `.env.example`
- [ ] Dependencies installed (`npm install`)
- [ ] Database initialized (if applicable)
- [ ] Models directory created

### Configuration
- [ ] `NODE_ENV=development`
- [ ] Debug logging enabled
- [ ] CORS allows localhost origins
- [ ] JWT_SECRET is set (even for dev)

### Verification
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can login with default admin
- [ ] Can create and monitor training jobs
- [ ] WebSocket connection works

**Ready for Development**: [ ] Yes [ ] No

---

## 🧪 Staging Environment

### Infrastructure
- [ ] Server/VM provisioned
- [ ] Node.js installed (v18+)
- [ ] npm/yarn installed
- [ ] PM2 or process manager installed
- [ ] Nginx/reverse proxy configured
- [ ] SSL certificate installed

### Database
- [ ] PostgreSQL/MongoDB installed
- [ ] Database created
- [ ] User model migrated from file storage to DB
- [ ] Migrations run successfully
- [ ] Database backups configured

### Environment Configuration
- [ ] `BACKEND/.env` created with staging values
  - [ ] `NODE_ENV=staging`
  - [ ] `PORT=3001`
  - [ ] `JWT_SECRET` (unique, 64+ chars)
  - [ ] `DATABASE_URL` configured
  - [ ] `CORS_ORIGIN` set to staging frontend URL
  - [ ] `LOG_LEVEL=info`
- [ ] `client/.env` created
  - [ ] `VITE_API_BASE_URL` points to staging backend
  - [ ] `VITE_ENVIRONMENT=staging`

### Build & Deploy
- [ ] Backend: `npm run build` succeeds
- [ ] Frontend: `npm run build` succeeds
- [ ] Static files deployed
- [ ] Process manager (PM2) configured
- [ ] Auto-restart on failure enabled

### Security
- [ ] Default admin password changed
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS properly restricted
- [ ] Environment variables secured
- [ ] Firewall configured
- [ ] SSH keys only (no password auth)

### Monitoring
- [ ] Logging configured
- [ ] Log rotation setup
- [ ] Error tracking (Sentry/similar) configured
- [ ] Uptime monitoring enabled
- [ ] Alerts configured

### Testing on Staging
- [ ] All Phase 1-7 tests from TESTING_GUIDE.md pass
- [ ] SSL certificate valid
- [ ] WebSocket works over WSS
- [ ] File uploads work
- [ ] Model downloads work
- [ ] Email notifications work (if implemented)

**Ready for Staging**: [ ] Yes [ ] No

---

## 🌐 Production Environment

### Pre-Production Requirements
- [ ] All staging tests passing
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Backup strategy documented and tested
- [ ] Rollback plan documented
- [ ] Incident response plan ready

### Infrastructure (Production)
- [ ] Production server(s) provisioned
- [ ] Load balancer configured (if applicable)
- [ ] CDN configured for static assets
- [ ] Database cluster/replication setup
- [ ] Backup system automated
- [ ] Disaster recovery plan tested

### Environment Configuration (Production)
- [ ] `BACKEND/.env` with production values
  - [ ] `NODE_ENV=production`
  - [ ] `JWT_SECRET` (new, unique, 64+ chars)
  - [ ] `DATABASE_URL` (production database)
  - [ ] `CORS_ORIGIN` (production frontend only)
  - [ ] `LOG_LEVEL=warn` or `error`
  - [ ] API keys for third-party services
- [ ] `client/.env.production`
  - [ ] `VITE_API_BASE_URL` (production backend)
  - [ ] `VITE_ENVIRONMENT=production`
  - [ ] Analytics enabled (if applicable)

### Security (Production)
- [ ] All default credentials changed
- [ ] Database credentials rotated
- [ ] JWT secrets unique to production
- [ ] All secrets stored in vault/secrets manager
- [ ] Security headers enforced (HSTS, CSP, etc.)
- [ ] SQL injection protection verified
- [ ] XSS protection verified
- [ ] CSRF protection enabled
- [ ] Rate limiting aggressive
- [ ] DDoS protection enabled
- [ ] Regular security scans scheduled
- [ ] Dependency vulnerability scans automated

### Performance
- [ ] Database indexes optimized
- [ ] Query performance tested
- [ ] Response times < 200ms (95th percentile)
- [ ] WebSocket latency < 100ms
- [ ] File upload size limits set
- [ ] API pagination implemented
- [ ] Caching strategy implemented
- [ ] Static assets optimized
- [ ] Images optimized
- [ ] Bundle size optimized

### Monitoring & Observability
- [ ] Application monitoring (APM) configured
- [ ] Log aggregation setup (ELK/CloudWatch/etc.)
- [ ] Metrics collection enabled
- [ ] Dashboards created
- [ ] Alerts configured for:
  - [ ] Server downtime
  - [ ] High error rates
  - [ ] High response times
  - [ ] High CPU/memory usage
  - [ ] Database connection issues
  - [ ] Disk space issues
- [ ] On-call rotation setup
- [ ] Incident response playbook ready

### Compliance & Legal
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] GDPR compliance reviewed (if applicable)
- [ ] Data retention policy implemented
- [ ] User data export capability
- [ ] User data deletion capability

### Build & Deploy (Production)
- [ ] CI/CD pipeline configured
- [ ] Automated tests in pipeline
- [ ] Build artifacts versioned
- [ ] Blue-green or canary deployment setup
- [ ] Health checks configured
- [ ] Graceful shutdown implemented
- [ ] Zero-downtime deployment verified

### Backup & Recovery
- [ ] Automated database backups (daily)
- [ ] Backup retention policy (30+ days)
- [ ] Backup restoration tested
- [ ] File storage backups configured
- [ ] Configuration backups
- [ ] Recovery Time Objective (RTO) defined
- [ ] Recovery Point Objective (RPO) defined

### Testing on Production
- [ ] Smoke tests pass
- [ ] Critical user paths verified
- [ ] Performance acceptable under load
- [ ] Monitoring shows no anomalies
- [ ] Error rates < 0.1%

### Documentation
- [ ] Runbook created
- [ ] Architecture diagram updated
- [ ] API documentation published
- [ ] User documentation available
- [ ] Admin documentation complete
- [ ] Troubleshooting guide available

### Post-Deployment
- [ ] Monitor for 24 hours
- [ ] Check error logs
- [ ] Verify backup ran successfully
- [ ] Update status page
- [ ] Notify team of successful deployment
- [ ] Update changelog/release notes

**Ready for Production**: [ ] Yes [ ] No

---

## 🔄 Deployment Commands

### Build Commands
```bash
# Backend
cd BACKEND
npm install --production
npm run build

# Frontend
cd client
npm install
npm run build
```

### Start Commands (Production)
```bash
# With PM2
pm2 start BACKEND/dist/src/server.js --name ml-training-backend
pm2 save
pm2 startup

# Nginx config for frontend
# Copy client/dist to /var/www/ml-training
# Configure nginx to serve static files
```

### Health Check
```bash
# Backend health
curl https://api.yourdomain.com/health

# Frontend
curl https://app.yourdomain.com
```

---

## 🚨 Rollback Plan

If deployment fails:

1. **Stop new deployment**
   ```bash
   pm2 stop ml-training-backend
   ```

2. **Rollback to previous version**
   ```bash
   git checkout <previous-commit>
   npm install
   npm run build
   pm2 restart ml-training-backend
   ```

3. **Verify rollback**
   - Check health endpoint
   - Test critical paths
   - Check error logs

4. **Restore database if needed**
   ```bash
   # Restore from backup
   pg_restore -d production_db backup_file.dump
   ```

5. **Notify team**

---

## 📊 Deployment Sign-off

### Development
- **Deployed by**: _____________________
- **Date**: _____________________
- **Version**: _____________________
- **Status**: [ ] Success [ ] Failed [ ] Rolled back

### Staging
- **Deployed by**: _____________________
- **Date**: _____________________
- **Version**: _____________________
- **Tested by**: _____________________
- **Status**: [ ] Success [ ] Failed [ ] Rolled back
- **Sign-off**: _____________________

### Production
- **Deployed by**: _____________________
- **Date**: _____________________
- **Version**: _____________________
- **Tested by**: _____________________
- **Approved by**: _____________________
- **Status**: [ ] Success [ ] Failed [ ] Rolled back
- **Rollback tested**: [ ] Yes [ ] No
- **Monitoring confirmed**: [ ] Yes [ ] No

---

## 📝 Notes

Deployment notes, issues encountered, or special instructions:

_____________________
_____________________
_____________________

---

**Last Updated**: 2025-10-13  
**Version**: 1.0
