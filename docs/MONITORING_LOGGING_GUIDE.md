# Monitoring & Logging Guide

## Overview

The Persian TTS platform includes comprehensive monitoring and logging capabilities for production readiness.

## Components

### 1. Structured Logging (Winston)

**Features:**
- Colorized console output in development
- Daily rotating file logs in production
- Configurable log levels
- Metadata support for context

**Usage:**

```typescript
import { log } from './config/logger';

// Log levels
log.error('Error message', { userId: '123', error: err });
log.warn('Warning message', { context: 'data' });
log.info('Info message', { action: 'user_login' });
log.http('HTTP request', { method: 'GET', url: '/api/test' });
log.debug('Debug message', { data: 'debug info' });
```

**Log Files (Production):**
- `logs/error-YYYY-MM-DD.log` - Error logs (30 days retention)
- `logs/combined-YYYY-MM-DD.log` - All logs (14 days retention)
- `logs/http-YYYY-MM-DD.log` - HTTP requests (7 days retention)

### 2. Error Tracking (Sentry)

**Features:**
- Automatic error capture
- Stack trace collection
- User context tracking
- Performance monitoring
- Release tracking

**Configuration:**

```typescript
import { initSentry, captureError } from './config/sentry';

// Initialize (production only)
initSentry();

// Manual error capture
try {
  // code
} catch (error) {
  captureError(error, { 
    context: 'additional info' 
  });
}
```

**Environment Variables:**
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 3. Performance Monitoring

**Features:**
- Operation duration tracking
- Slow operation detection
- Statistical analysis
- Memory-efficient metric storage

**Usage:**

```typescript
import { performanceMonitor } from './monitoring/performance';

// Track operation
const result = await performanceMonitor.trackOperation(
  'hf:search',
  async () => {
    // Your async operation
    return await searchModels(query);
  },
  { query }
);

// Get statistics
const stats = performanceMonitor.getStats('hf:search');
console.log(stats);
// {
//   count: 10,
//   avgDuration: 250,
//   minDuration: 100,
//   maxDuration: 500
// }
```

### 4. System Monitoring

**Features:**
- CPU usage tracking
- Memory usage monitoring
- Automatic warnings for high usage
- Uptime tracking

**Usage:**

```typescript
import { systemMonitor } from './monitoring/system';

// Start monitoring (every minute)
systemMonitor.start(60000);

// Get current metrics
const metrics = systemMonitor.getMetrics();
console.log(metrics);
// {
//   cpu: { usage: 45.2, cores: 4 },
//   memory: { 
//     total: 8589934592,
//     free: 4294967296,
//     used: 4294967296,
//     usagePercent: 50
//   },
//   uptime: 86400
// }

// Stop monitoring
systemMonitor.stop();
```

### 5. API Analytics

**Features:**
- Request/response tracking
- Success rate calculation
- Average duration tracking
- Top endpoints analysis
- Error rate monitoring

**Usage:**

```typescript
import { analyticsTracker } from './monitoring/analytics';

// Tracking is automatic via middleware

// Get statistics
const stats = analyticsTracker.getEndpointStats();
console.log(stats);
// {
//   total: 1000,
//   successful: 950,
//   failed: 50,
//   successRate: 95,
//   avgDuration: 150,
//   endpoints: [
//     { endpoint: 'GET /api/chat', count: 500 },
//     { endpoint: 'POST /api/tts', count: 300 }
//   ]
// }

// Get error rate (last 5 minutes)
const errorRate = analyticsTracker.getErrorRate(5);
console.log(errorRate);
// {
//   total: 100,
//   errors: 5,
//   errorRate: 5,
//   timeWindow: '5 minutes'
// }
```

### 6. Health Checks

**Features:**
- Database connectivity check
- Filesystem access check
- Memory usage check
- Disk space check
- Comprehensive metrics

**Endpoints:**

```bash
# Basic health check
GET /health

Response:
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-13T12:00:00.000Z",
    "checks": {
      "database": { "status": "pass", "responseTime": 15 },
      "filesystem": { "status": "pass", "responseTime": 5 },
      "memory": { "status": "pass" },
      "disk": { "status": "pass" }
    }
  }
}

# Detailed health check with metrics
GET /health/detailed

Response includes:
- All health checks
- System metrics (CPU, memory, uptime)
- Performance metrics
- API analytics
```

## Monitoring Endpoints

### System Metrics

```bash
GET /api/monitoring/system

Response:
{
  "success": true,
  "data": {
    "cpu": { "usage": 45.2, "cores": 4 },
    "memory": {
      "total": 8589934592,
      "free": 4294967296,
      "used": 4294967296,
      "usagePercent": 50
    },
    "uptime": 86400,
    "timestamp": "2025-10-13T12:00:00.000Z"
  }
}
```

### Performance Metrics

```bash
GET /api/monitoring/performance

Response:
{
  "success": true,
  "data": [
    {
      "operation": "hf:search",
      "count": 100,
      "avgDuration": 250,
      "minDuration": 100,
      "maxDuration": 500
    }
  ]
}
```

### API Analytics

```bash
GET /api/monitoring/analytics

Response:
{
  "success": true,
  "data": {
    "total": 1000,
    "successful": 950,
    "failed": 50,
    "successRate": 95,
    "avgDuration": 150,
    "endpoints": [...],
    "errorRate": {
      "total": 100,
      "errors": 5,
      "errorRate": 5,
      "timeWindow": "5 minutes"
    }
  }
}
```

## Integration

### Server Setup

```typescript
import { initSentry } from './config/sentry';
import { httpLogger, requestTimer } from './middleware/request-logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { trackAnalytics } from './middleware/analytics';
import { systemMonitor } from './monitoring/system';
import healthRouter from './routes/health';
import monitoringRouter from './routes/monitoring';

// Initialize Sentry
initSentry();

// Start system monitoring
systemMonitor.start(60000);

// Middleware
app.use(requestTimer);
app.use(httpLogger);
app.use(trackAnalytics);

// Routes
app.use('/health', healthRouter);
app.use('/api/monitoring', monitoringRouter);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  systemMonitor.stop();
  // cleanup...
});
```

## Best Practices

### 1. Log Levels

Use appropriate log levels:
- `error`: Errors that need immediate attention
- `warn`: Warning conditions (high resource usage, slow queries)
- `info`: General informational messages
- `http`: HTTP requests
- `debug`: Detailed debugging information (development only)

### 2. Structured Logging

Always include context:

```typescript
// Good
log.info('User login successful', { 
  userId: user.id, 
  email: user.email 
});

// Bad
log.info('User logged in');
```

### 3. Error Handling

Use the custom error class:

```typescript
import { AppError } from './middleware/error-handler';

// Operational error (expected)
if (!user) {
  throw new AppError(404, 'User not found', true);
}

// Programming error (unexpected)
if (!config.apiKey) {
  throw new Error('API key not configured');
}
```

### 4. Performance Tracking

Track important operations:

```typescript
// Track database operations
const users = await performanceMonitor.trackOperation(
  'db:users:list',
  () => query('SELECT * FROM users')
);

// Track API calls
const models = await performanceMonitor.trackOperation(
  'hf:models:search',
  () => searchModels(query),
  { query }
);
```

### 5. Monitoring Alerts

Set up alerts for:
- Error rate > 5%
- Response time > 3s
- Memory usage > 90%
- CPU usage > 90%
- Database query time > 1s

## Dashboards

### Recommended Setup

1. **Sentry Dashboard**: Error tracking and monitoring
2. **Grafana**: Custom metrics visualization
3. **Prometheus**: Metrics collection
4. **ELK Stack**: Log aggregation and analysis

### Custom Metrics Endpoint

Create a Prometheus-compatible endpoint:

```typescript
app.get('/metrics', (req, res) => {
  const metrics = systemMonitor.getMetrics();
  const stats = analyticsTracker.getEndpointStats();
  
  res.set('Content-Type', 'text/plain');
  res.send(`
    # HELP memory_usage Memory usage percentage
    memory_usage ${metrics.memory.usagePercent}
    
    # HELP cpu_usage CPU usage percentage
    cpu_usage ${metrics.cpu.usage}
    
    # HELP api_requests_total Total API requests
    api_requests_total ${stats.total}
    
    # HELP api_errors_total Total API errors
    api_errors_total ${stats.failed}
  `);
});
```

## Troubleshooting

### High Memory Usage

```bash
# Check metrics
curl http://localhost:3001/api/monitoring/system

# Check logs
tail -f logs/combined-*.log | grep "memory"

# Restart if needed
docker-compose restart backend
```

### Slow Queries

```bash
# Check logs for slow queries
tail -f logs/combined-*.log | grep "slow_query"

# Analyze performance
curl http://localhost:3001/api/monitoring/performance
```

### Error Spikes

```bash
# Check error rate
curl http://localhost:3001/api/monitoring/analytics

# View recent errors
tail -f logs/error-*.log

# Check Sentry dashboard
open https://sentry.io/your-project
```
