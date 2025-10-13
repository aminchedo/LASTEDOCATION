# Developer Guide - Persian TTS/AI Platform

Complete guide for developers working on the Persian TTS/AI Platform.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Adding New Features](#adding-new-features)
- [Database Migrations](#database-migrations)
- [API Development](#api-development)
- [Testing Guidelines](#testing-guidelines)
- [Code Style](#code-style)
- [Common Tasks](#common-tasks)

## 🎯 Project Overview

The Persian TTS/AI Platform is a full-stack TypeScript application for training and deploying Persian language models (TTS, STT, LLM).

**Tech Stack:**
- **Backend:** Node.js, TypeScript, Express, PostgreSQL
- **Frontend:** React, TypeScript, Vite, TailwindCSS
- **ML:** TensorFlow.js, HuggingFace Transformers
- **Infrastructure:** Docker, PostgreSQL, Redis (optional)

## 🏗️ Architecture

```
┌─────────────────┐
│   React Client  │  (Port 5173)
│   (Vite + TS)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Express API    │  (Port 3001)
│  (TypeScript)   │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼
┌────────┐ ┌────┐ ┌──────────┐ ┌────────┐
│PostGres│ │TF.js│ │HuggingFace│ │WebSocket│
└────────┘ └────┘ └──────────┘ └────────┘
```

### Key Components

1. **Database Layer** (`src/database/`)
   - PostgreSQL connection pooling
   - Schema management
   - Query utilities

2. **API Layer** (`src/routes/`)
   - RESTful endpoints
   - Authentication middleware
   - Request validation

3. **Services Layer** (`src/services/`)
   - Business logic
   - External API integrations
   - Background job processing

4. **Training Layer** (`src/training/`)
   - TensorFlow.js model training
   - Dataset management
   - Checkpoint handling

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Quick Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd persian-tts-platform

# 2. Run automated setup
./setup.sh

# 3. Start development servers
./start.sh
```

### Manual Setup

```bash
# 1. Install backend dependencies
cd BACKEND
npm install

# 2. Install client dependencies
cd ../client
npm install

# 3. Setup environment
cp BACKEND/.env.example BACKEND/.env
# Edit BACKEND/.env with your configuration

# 4. Initialize database
createdb persian_tts
psql persian_tts -f BACKEND/src/database/schema.sql

# 5. Build projects
cd BACKEND && npm run build
cd ../client && npm run build

# 6. Start development
cd BACKEND && npm run dev  # Terminal 1
cd client && npm run dev    # Terminal 2
```

## 📁 Project Structure

```
persian-tts-platform/
├── BACKEND/                    # Backend API server
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   │   ├── env.ts         # Environment variables
│   │   │   └── modelCatalog.ts # Model configurations
│   │   ├── database/          # Database layer
│   │   │   ├── connection.ts  # DB connection pool
│   │   │   └── schema.sql     # Database schema
│   │   ├── middleware/        # Express middleware
│   │   │   ├── auth.ts        # Authentication
│   │   │   ├── logger.ts      # Request logging
│   │   │   └── validate.ts    # Input validation
│   │   ├── routes/            # API routes
│   │   │   ├── auth.ts        # Authentication endpoints
│   │   │   ├── training.ts    # Training management
│   │   │   ├── models.ts      # Model management
│   │   │   └── ...
│   │   ├── services/          # Business logic
│   │   │   ├── huggingface.service.ts
│   │   │   ├── training.service.ts
│   │   │   ├── download-manager.service.ts
│   │   │   └── ...
│   │   ├── training/          # Training logic
│   │   │   ├── trainer.ts     # Main trainer
│   │   │   └── ...
│   │   ├── types/             # TypeScript types
│   │   └── server.ts          # Entry point
│   ├── scripts/               # Utility scripts
│   │   ├── verify-database.ts
│   │   ├── verify-api.ts
│   │   └── ...
│   ├── tests/                 # Test files
│   │   ├── integration.test.ts
│   │   └── ...
│   ├── package.json
│   └── tsconfig.json
│
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API client services
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utility functions
│   │   └── App.tsx            # Root component
│   ├── public/                # Static assets
│   ├── package.json
│   └── vite.config.ts
│
├── setup.sh                   # Automated setup
├── start.sh                   # Start servers
├── stop.sh                    # Stop servers
└── docker-compose.production.yml
```

## 🔄 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/my-new-feature
```

### 2. Make Changes

Edit files in `BACKEND/src/` or `client/src/`

### 3. Test Your Changes

```bash
# Run tests
cd BACKEND
npm test

# Run type checking
npm run verify:ts

# Run linter
npm run lint
```

### 4. Verify Everything Works

```bash
# Run all verification scripts
npm run verify:all

# Test API endpoints
npm run verify:api
```

### 5. Commit Changes

```bash
git add .
git commit -m "feat: add new feature description"
```

### 6. Push and Create PR

```bash
git push origin feature/my-new-feature
```

## ➕ Adding New Features

### Adding a New API Endpoint

1. **Create Route File** (`BACKEND/src/routes/my-feature.ts`)

```typescript
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    // Your logic here
    res.json({
      success: true,
      data: { message: 'Feature works!' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
```

2. **Register Route** (`BACKEND/src/server.ts`)

```typescript
import myFeatureRouter from './routes/my-feature';

app.use('/api/my-feature', myFeatureRouter);
```

3. **Add Tests** (`BACKEND/tests/my-feature.test.ts`)

```typescript
import request from 'supertest';
import app from '../src/server';

describe('My Feature API', () => {
  it('should return success', async () => {
    const response = await request(app)
      .get('/api/my-feature')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

### Adding a New Database Table

1. **Update Schema** (`BACKEND/src/database/schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_my_table_name ON my_table(name);
```

2. **Run Migration**

```bash
psql $DATABASE_URL -f BACKEND/src/database/schema.sql
```

3. **Create TypeScript Interface** (`BACKEND/src/types/`)

```typescript
export interface MyTable {
  id: string;
  name: string;
  data: Record<string, any>;
  created_at: Date;
}
```

### Adding a New Service

1. **Create Service File** (`BACKEND/src/services/my-service.service.ts`)

```typescript
import { query } from '../database/connection';
import { logger } from '../middleware/logger';

export class MyService {
  async doSomething(param: string): Promise<any> {
    try {
      const result = await query(
        'SELECT * FROM my_table WHERE name = $1',
        [param]
      );
      
      return result.rows;
    } catch (error: any) {
      logger.error({
        msg: 'my_service_error',
        error: error.message
      });
      throw error;
    }
  }
}

export const myService = new MyService();
```

2. **Use in Routes**

```typescript
import { myService } from '../services/my-service.service';

router.get('/:name', async (req, res) => {
  const result = await myService.doSomething(req.params.name);
  res.json({ success: true, data: result });
});
```

## 🗄️ Database Migrations

### Creating a Migration

1. Create migration file:
```bash
touch BACKEND/src/database/migrations/001_add_my_feature.sql
```

2. Write migration:
```sql
-- Up migration
ALTER TABLE models ADD COLUMN new_field VARCHAR(255);

-- Down migration (optional, in separate file)
-- ALTER TABLE models DROP COLUMN new_field;
```

3. Apply migration:
```bash
psql $DATABASE_URL -f BACKEND/src/database/migrations/001_add_my_feature.sql
```

### Best Practices

- Always make migrations reversible
- Test migrations on a copy of production data
- Use transactions for complex migrations
- Add indexes in separate migration if they take long
- Document breaking changes

## 🔌 API Development

### Standard Response Format

```typescript
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}

// Paginated
{
  "success": true,
  "data": [ ... ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

### Authentication

Protected routes require JWT token:

```typescript
import { authenticateToken } from '../middleware/auth';

router.get('/protected', authenticateToken, (req, res) => {
  // req.user contains authenticated user
  const userId = req.user.id;
});
```

### Input Validation

```typescript
import { body, validationResult } from 'express-validator';

router.post('/create',
  [
    body('name').isString().notEmpty(),
    body('email').isEmail(),
    body('age').isInt({ min: 0, max: 120 })
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // Process request
  }
);
```

## 🧪 Testing Guidelines

### Unit Tests

```typescript
describe('MyService', () => {
  it('should do something', () => {
    const result = myService.doSomething('test');
    expect(result).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('API Integration', () => {
  it('should complete workflow', async () => {
    // Create resource
    const createRes = await request(app)
      .post('/api/resource')
      .send({ name: 'test' });
    
    expect(createRes.status).toBe(201);
    
    // Get resource
    const getRes = await request(app)
      .get(`/api/resource/${createRes.body.data.id}`);
    
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.name).toBe('test');
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Specific file
npm test -- my-feature.test.ts
```

## 📐 Code Style

### TypeScript

```typescript
// Use interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// Use type for unions
type Status = 'pending' | 'active' | 'completed';

// Always specify return types
async function getUser(id: string): Promise<User> {
  // ...
}

// Use destructuring
const { id, name } = user;

// Use optional chaining
const city = user?.address?.city;

// Use nullish coalescing
const port = process.env.PORT ?? 3001;
```

### Naming Conventions

- **Files:** kebab-case (`my-service.ts`)
- **Classes:** PascalCase (`MyService`)
- **Functions:** camelCase (`getUserById`)
- **Constants:** UPPER_SNAKE_CASE (`API_VERSION`)
- **Interfaces:** PascalCase (`UserData`)
- **Types:** PascalCase (`Status`)

### Error Handling

```typescript
try {
  const result = await riskyOperation();
  return result;
} catch (error: any) {
  logger.error({
    msg: 'operation_failed',
    error: error.message,
    stack: error.stack
  });
  
  throw new Error(`Operation failed: ${error.message}`);
}
```

## 🔧 Common Tasks

### Add a New Model Type

1. Update `modelCatalog.ts`:
```typescript
export const MODEL_CATALOG = {
  // ...
  'my-new-type': {
    name: 'My New Model Type',
    category: 'custom'
  }
};
```

2. Update database enum (if using enums)
3. Add handling in training service
4. Update UI components

### Add Environment Variable

1. Add to `BACKEND/.env`:
```
NEW_VAR=value
```

2. Add to `BACKEND/src/config/env.ts`:
```typescript
export const ENV = {
  // ...
  NEW_VAR: process.env.NEW_VAR || 'default',
};
```

3. Use in code:
```typescript
import { ENV } from './config/env';

const value = ENV.NEW_VAR;
```

### Debug a Failing Test

```bash
# Run with verbose output
npm test -- --verbose

# Run single test file
npm test -- my-feature.test.ts

# Run with debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Profile Performance

```typescript
// Add timing
const start = Date.now();
await slowOperation();
logger.info({
  msg: 'operation_timing',
  duration: Date.now() - start
});
```

### Access Database Directly

```bash
# Connect to database
psql $DATABASE_URL

# Or with parameters
psql -h localhost -p 5432 -U postgres -d persian_tts
```

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [TensorFlow.js](https://www.tensorflow.org/js)

## 🤝 Contributing

1. Follow the code style guide
2. Write tests for new features
3. Update documentation
4. Create meaningful commit messages
5. Request code review

## 📞 Support

- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Email:** [support email]

---

**Last Updated:** 2025-10-13
