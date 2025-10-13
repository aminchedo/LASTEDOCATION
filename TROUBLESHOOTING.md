# Troubleshooting Guide - Persian TTS/AI Platform

Common issues and their solutions.

## 📋 Table of Contents

- [Database Issues](#database-issues)
- [API Errors](#api-errors)
- [HuggingFace Integration](#huggingface-integration)
- [Download Failures](#download-failures)
- [Training Crashes](#training-crashes)
- [TypeScript Errors](#typescript-errors)
- [Build Issues](#build-issues)
- [Docker Problems](#docker-problems)
- [Performance Issues](#performance-issues)
- [WebSocket Connection](#websocket-connection)

## 🗄️ Database Issues

### Database Connection Failed

**Symptom:** `Error: Connection refused` or `ECONNREFUSED`

**Solutions:**

1. **Check if PostgreSQL is running:**
```bash
# Linux
sudo systemctl status postgresql

# macOS
brew services list | grep postgresql

# Or check directly
psql -U postgres -c "SELECT 1"
```

2. **Verify connection string:**
```bash
# Check .env file
cat BACKEND/.env | grep DATABASE_URL

# Test connection manually
psql $DATABASE_URL -c "SELECT NOW()"
```

3. **Check PostgreSQL is listening:**
```bash
# Should show port 5432
sudo netstat -tlnp | grep 5432

# Or
sudo lsof -i :5432
```

4. **Verify credentials:**
```bash
# Try connecting with credentials
psql -h localhost -p 5432 -U postgres -d persian_tts
```

**Common fixes:**
- Start PostgreSQL: `sudo systemctl start postgresql`
- Reset password: `sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'newpassword';"`
- Check `pg_hba.conf` for authentication settings

### Table Does Not Exist

**Symptom:** `ERROR: relation "tablename" does not exist`

**Solutions:**

1. **Run schema migrations:**
```bash
psql $DATABASE_URL -f BACKEND/src/database/schema.sql
```

2. **Verify tables exist:**
```bash
psql $DATABASE_URL -c "\dt"
```

3. **Check database name:**
```bash
# Make sure you're in the correct database
psql $DATABASE_URL -c "SELECT current_database()"
```

### Foreign Key Constraint Violation

**Symptom:** `ERROR: insert or update on table violates foreign key constraint`

**Solutions:**

1. **Check referenced record exists:**
```sql
-- If error is about user_id foreign key
SELECT id FROM users WHERE id = 'your-user-id';
```

2. **Verify foreign key relationships:**
```bash
npm run verify:db
```

3. **Check cascade behavior:**
```sql
-- View foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

## 🔌 API Errors

### 401 Unauthorized

**Symptom:** API returns `401 Unauthorized`

**Solutions:**

1. **Check JWT token:**
```bash
# Decode token (online tool or jwt.io)
# Verify expiration and format
```

2. **Verify JWT_SECRET matches:**
```bash
cat BACKEND/.env | grep JWT_SECRET
```

3. **Check token in request:**
```bash
# Should have Authorization header
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/protected
```

4. **Re-authenticate:**
```bash
# Get new token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### 404 Not Found

**Symptom:** `Cannot GET /api/endpoint`

**Solutions:**

1. **Verify route registration:**
```typescript
// Check src/server.ts
app.use('/api/endpoint', endpointRouter);
```

2. **Check route exists:**
```bash
# List all routes (add this temp code)
app._router.stack.forEach(r => {
  if (r.route) console.log(r.route.path);
});
```

3. **Verify server is running:**
```bash
curl http://localhost:3001/health
```

### 500 Internal Server Error

**Symptom:** Generic server error

**Solutions:**

1. **Check server logs:**
```bash
tail -f BACKEND/logs/*.log
# Or
tail -f logs/backend.log
```

2. **Check for unhandled promises:**
```typescript
// Add to server.ts
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
```

3. **Enable debug logging:**
```bash
# In .env
LOG_LEVEL=debug
```

## 🤗 HuggingFace Integration

### HuggingFace API Errors

**Symptom:** `Failed to fetch from HuggingFace`

**Solutions:**

1. **Verify API connectivity:**
```bash
curl https://huggingface.co/api/models
```

2. **Check token validity:**
```bash
curl https://huggingface.co/api/whoami \
  -H "Authorization: Bearer YOUR_HF_TOKEN"
```

3. **Verify token in environment:**
```bash
cat BACKEND/.env | grep HF_TOKEN
```

4. **Test search:**
```bash
curl "https://huggingface.co/api/models?search=persian&limit=5"
```

### Rate Limiting

**Symptom:** `429 Too Many Requests`

**Solutions:**

1. **Add delays between requests:**
```typescript
await new Promise(resolve => setTimeout(resolve, 1000));
```

2. **Use HuggingFace Pro token** (higher rate limits)

3. **Implement caching:**
```typescript
// Cache search results
const cachedResults = await cache.get(searchQuery);
```

### Token Invalid

**Symptom:** `Invalid authentication token`

**Solutions:**

1. **Generate new token:**
   - Go to https://huggingface.co/settings/tokens
   - Create new token with appropriate permissions

2. **Update .env file:**
```bash
# BACKEND/.env
HF_TOKEN=hf_your_new_token_here
```

3. **Restart backend:**
```bash
./stop.sh
./start.sh
```

## ⬇️ Download Failures

### Download Stuck

**Symptom:** Download progress at 0% or not progressing

**Solutions:**

1. **Check network connectivity:**
```bash
ping huggingface.co
```

2. **Verify disk space:**
```bash
df -h
```

3. **Check download manager logs:**
```bash
tail -f BACKEND/logs/*.log | grep download
```

4. **Restart download:**
```sql
-- Mark as failed in database
UPDATE download_queue SET status = 'failed' WHERE id = 'download-id';

-- Retry
-- (Use API endpoint to restart)
```

### Out of Disk Space

**Symptom:** `ENOSPC: no space left on device`

**Solutions:**

1. **Check disk usage:**
```bash
df -h
du -sh BACKEND/models/*
```

2. **Clean up old models:**
```bash
# Remove unused models
rm -rf BACKEND/models/old-model-*
```

3. **Configure storage limits:**
```typescript
// In download manager
const MAX_STORAGE_GB = 50;
```

### Corrupted Download

**Symptom:** Download completes but model doesn't work

**Solutions:**

1. **Verify file integrity:**
```bash
# Check file sizes
ls -lh BACKEND/models/model-name/
```

2. **Re-download:**
```sql
DELETE FROM download_queue WHERE model_id = 'model-id';
-- Trigger new download from UI
```

3. **Check file permissions:**
```bash
ls -la BACKEND/models/
chmod -R 755 BACKEND/models/
```

## 🎓 Training Crashes

### Out of Memory

**Symptom:** `JavaScript heap out of memory`

**Solutions:**

1. **Increase Node memory:**
```bash
# In package.json
"scripts": {
  "dev": "node --max-old-space-size=4096 -r ts-node/register src/server.ts"
}
```

2. **Reduce batch size:**
```typescript
const config = {
  batchSize: 16, // Reduce from 32
  // ...
};
```

3. **Use gradient accumulation:**
```typescript
const config = {
  gradientAccumulation: 2,
  // ...
};
```

4. **Monitor memory:**
```bash
# While training is running
watch -n 1 "ps aux | grep node"
```

### TensorFlow.js Errors

**Symptom:** `Error: Cannot find module @tensorflow/tfjs-node`

**Solutions:**

1. **Reinstall TensorFlow.js:**
```bash
cd BACKEND
npm uninstall @tensorflow/tfjs-node
npm install @tensorflow/tfjs-node
```

2. **Clear node_modules:**
```bash
rm -rf node_modules package-lock.json
npm install
```

3. **Check platform compatibility:**
```bash
# TensorFlow.js Node requires native modules
node -p "process.platform"
```

### Training Stuck at 0%

**Symptom:** Training starts but doesn't progress

**Solutions:**

1. **Check training logs:**
```bash
tail -f BACKEND/logs/*.log | grep training
```

2. **Verify dataset:**
```bash
# Check dataset file exists and is valid JSON
cat BACKEND/data/datasets/dataset.jsonl | head -5
```

3. **Check for errors in service:**
```typescript
// Add logging in training service
logger.info({ msg: 'training_step', epoch, step, loss });
```

4. **Restart training:**
```sql
UPDATE training_jobs SET status = 'cancelled' WHERE id = 'job-id';
```

## 📝 TypeScript Errors

### Cannot Find Module

**Symptom:** `TS2307: Cannot find module './module'`

**Solutions:**

1. **Check import path:**
```typescript
// Relative imports must include extension
import { foo } from './module';  // ❌
import { foo } from './module.js';  // ✅ (after compilation)
```

2. **Verify tsconfig paths:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

3. **Reinstall dependencies:**
```bash
npm install
```

### Type Errors

**Symptom:** `Type 'X' is not assignable to type 'Y'`

**Solutions:**

1. **Check type definitions:**
```typescript
// Add proper types
interface User {
  id: string;
  name: string;
}

const user: User = { ... };
```

2. **Use type assertions (carefully):**
```typescript
const value = data as MyType;
```

3. **Update type definitions:**
```bash
npm install -D @types/node @types/express
```

## 🔨 Build Issues

### Build Failed

**Symptom:** `npm run build` fails

**Solutions:**

1. **Check TypeScript errors:**
```bash
npm run verify:ts
```

2. **Clear dist folder:**
```bash
rm -rf BACKEND/dist
npm run build
```

3. **Check for circular dependencies:**
```bash
npx madge --circular BACKEND/src
```

4. **Update dependencies:**
```bash
npm update
```

### Import Errors After Build

**Symptom:** `Cannot find module` at runtime

**Solutions:**

1. **Check compiled output:**
```bash
ls -R BACKEND/dist/src/
```

2. **Verify module resolution:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node"
  }
}
```

3. **Check paths in dist:**
```bash
# Ensure relative imports work
node -e "require('./dist/src/server.js')"
```

## 🐳 Docker Problems

### Container Won't Start

**Symptom:** `docker-compose up` fails

**Solutions:**

1. **Check logs:**
```bash
docker-compose logs backend
docker-compose logs db
```

2. **Verify environment variables:**
```bash
docker-compose config
```

3. **Rebuild containers:**
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

4. **Check port conflicts:**
```bash
# See what's using port 3001
lsof -i :3001
```

### Database Connection in Docker

**Symptom:** Backend can't connect to database in Docker

**Solutions:**

1. **Use service name:**
```bash
# In docker-compose, use 'db' not 'localhost'
DATABASE_URL=postgresql://postgres:password@db:5432/persian_tts
```

2. **Wait for database:**
```yaml
# docker-compose.yml
backend:
  depends_on:
    db:
      condition: service_healthy
```

3. **Check network:**
```bash
docker network ls
docker network inspect persian-tts-network
```

## 🚀 Performance Issues

### Slow API Responses

**Symptom:** API takes > 1 second to respond

**Solutions:**

1. **Add database indexes:**
```sql
CREATE INDEX idx_models_type ON models(type);
CREATE INDEX idx_training_jobs_user_id ON training_jobs(user_id);
```

2. **Enable connection pooling:**
```typescript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});
```

3. **Add caching:**
```typescript
// Use Redis or in-memory cache
const cache = new Map();
```

4. **Profile queries:**
```sql
EXPLAIN ANALYZE SELECT * FROM models WHERE type = 'tts';
```

### High Memory Usage

**Symptom:** Server using excessive memory

**Solutions:**

1. **Monitor memory:**
```bash
watch -n 1 "ps aux | grep node | head -5"
```

2. **Check for memory leaks:**
```typescript
// Add to server.ts
setInterval(() => {
  const mem = process.memoryUsage();
  logger.info({ msg: 'memory_usage', ...mem });
}, 60000);
```

3. **Dispose TensorFlow tensors:**
```typescript
import * as tf from '@tensorflow/tfjs-node';

const tensor = tf.tensor([1, 2, 3]);
// ... use tensor ...
tensor.dispose(); // ← Important!
```

## 🔌 WebSocket Connection

### WebSocket Won't Connect

**Symptom:** Client can't establish WebSocket connection

**Solutions:**

1. **Check WebSocket server:**
```bash
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost:3001/socket.io/
```

2. **Verify CORS:**
```typescript
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  }
});
```

3. **Check firewall:**
```bash
# Allow port 3001
sudo ufw allow 3001
```

### Connection Drops

**Symptom:** WebSocket disconnects frequently

**Solutions:**

1. **Add reconnection logic:**
```typescript
const socket = io('http://localhost:3001', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});
```

2. **Increase timeout:**
```typescript
const io = new Server(server, {
  pingTimeout: 60000,
  pingInterval: 25000
});
```

## 🔍 Diagnostic Commands

### Quick Health Check

```bash
# Check all services
curl http://localhost:3001/health

# Verify database
npm run verify:db

# Test API
npm run verify:api

# Check TypeScript
npm run verify:ts
```

### Full System Diagnostic

```bash
#!/bin/bash
echo "=== System Diagnostic ==="

echo "Node version:"
node -v

echo "PostgreSQL status:"
pg_isready

echo "Disk space:"
df -h | grep -E '/$|/home'

echo "Memory:"
free -h

echo "Active processes:"
ps aux | grep -E 'node|postgres' | head -10

echo "Listening ports:"
netstat -tlnp | grep -E '3001|5432|5173'

echo "Backend health:"
curl -s http://localhost:3001/health | jq .

echo "Database tables:"
psql $DATABASE_URL -c "\dt"
```

## 📞 Getting Help

If none of these solutions work:

1. **Check logs:**
   - `BACKEND/logs/*.log`
   - Browser console
   - Network tab

2. **Search issues:**
   - GitHub Issues
   - Stack Overflow

3. **Create detailed issue:**
   - Steps to reproduce
   - Error messages
   - System information
   - Logs

4. **Contact support:**
   - Email: [support@example.com]
   - Discord: [discord link]

---

**Last Updated:** 2025-10-13
