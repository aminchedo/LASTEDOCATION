# 🗄️ Database Migration Guide

This guide helps you migrate from file-based storage to a proper database (PostgreSQL or MongoDB).

---

## 📋 Overview

Currently, the ML Training Platform uses:
- **User Storage**: File-based (`data/users.json`)
- **Dataset Metadata**: File-based (`data/datasets/metadata.json`)
- **Job Status**: File-based (`artifacts/jobs/*.json`)

For production, you should migrate to:
- **PostgreSQL** (recommended for relational data)
- **MongoDB** (alternative for document-based approach)

---

## 🎯 Option 1: PostgreSQL (Recommended)

### Step 1: Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download from: https://www.postgresql.org/download/windows/

---

### Step 2: Create Database

```bash
# Login as postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE ml_training_platform;

# Create user
CREATE USER ml_admin WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ml_training_platform TO ml_admin;

# Exit
\q
```

---

### Step 3: Install Node.js Dependencies

```bash
cd BACKEND
npm install pg sequelize
npm install --save-dev @types/pg
```

---

### Step 4: Create Database Schema

Create `BACKEND/src/database/schema.sql`:

```sql
-- Users table
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- Datasets table
CREATE TABLE datasets (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  path TEXT NOT NULL,
  size BIGINT NOT NULL,
  type VARCHAR(50) NOT NULL,
  uploaded_by VARCHAR(255) REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_datasets_uploaded_by ON datasets(uploaded_by);
CREATE INDEX idx_datasets_uploaded_at ON datasets(uploaded_at);

-- Training jobs table
CREATE TABLE training_jobs (
  id VARCHAR(255) PRIMARY KEY,
  job_id VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255) REFERENCES users(id),
  dataset_id VARCHAR(255) REFERENCES datasets(id),
  status VARCHAR(50) NOT NULL,
  progress DECIMAL(5,2) DEFAULT 0,
  epoch INTEGER,
  step INTEGER,
  total_steps INTEGER,
  loss DECIMAL(10,6),
  message TEXT,
  params JSONB,
  pid INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL
);

CREATE INDEX idx_jobs_user_id ON training_jobs(user_id);
CREATE INDEX idx_jobs_status ON training_jobs(status);
CREATE INDEX idx_jobs_created_at ON training_jobs(created_at);

-- Audit log table
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_created_at ON audit_log(created_at);
```

Apply schema:
```bash
psql -U ml_admin -d ml_training_platform -f BACKEND/src/database/schema.sql
```

---

### Step 5: Create Database Connection Module

Create `BACKEND/src/database/connection.ts`:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
};

export const getClient = async () => {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const originalRelease = client.release.bind(client);

  // Monkey patch the query method to keep track of the last query executed
  client.query = (...args: any[]) => {
    console.log('Query:', args[0]);
    return originalQuery(...args);
  };

  // Monkey patch the release method to return the connection to the pool
  client.release = () => {
    originalRelease();
    console.log('Client released');
  };

  return client;
};

export default { query, getClient, pool };
```

---

### Step 6: Migrate User Model to PostgreSQL

Replace `BACKEND/src/models/User.ts`:

```typescript
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { query } from '../database/connection';

const SALT_ROUNDS = 10;

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export type UserWithoutPassword = Omit<User, 'password'>;

class UserModel {
  private stripPassword(user: User): UserWithoutPassword {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async create(
    email: string,
    password: string,
    name: string,
    role: 'user' | 'admin' = 'user'
  ): Promise<UserWithoutPassword> {
    // Check if user exists
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new Error('User already exists');
    }

    // Validate
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user
    const id = randomBytes(16).toString('hex');
    const result = await query(
      `INSERT INTO users (id, email, name, password, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, email, name, role, created_at, updated_at`,
      [id, email.toLowerCase().trim(), name.trim(), hashedPassword, role]
    );

    console.log(`[UserModel] User created: ${email}`);
    return result.rows[0];
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    return result.rows[0] || null;
  }

  async findById(id: string): Promise<UserWithoutPassword | null> {
    const result = await query(
      'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error('[UserModel] Password verification error:', error);
      return false;
    }
  }

  async update(
    id: string,
    updates: Partial<Omit<User, 'id' | 'password'>>
  ): Promise<UserWithoutPassword | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }

    if (updates.email) {
      fields.push(`email = $${paramIndex++}`);
      values.push(updates.email.toLowerCase().trim());
    }

    if (updates.role) {
      fields.push(`role = $${paramIndex++}`);
      values.push(updates.role);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, email, name, role, created_at, updated_at`,
      values
    );

    console.log(`[UserModel] User updated: ${id}`);
    return result.rows[0] || null;
  }

  async updatePassword(id: string, newPassword: string): Promise<boolean> {
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const result = await query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, id]
    );

    console.log(`[UserModel] Password updated for user: ${id}`);
    return (result.rowCount || 0) > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    console.log(`[UserModel] User deleted: ${id}`);
    return (result.rowCount || 0) > 0;
  }

  async list(): Promise<UserWithoutPassword[]> {
    const result = await query(
      'SELECT id, email, name, role, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  }

  async count(): Promise<number> {
    const result = await query('SELECT COUNT(*) as count FROM users');
    return parseInt(result.rows[0].count);
  }
}

export const userModel = new UserModel();
```

---

### Step 7: Update Environment Variables

Add to `BACKEND/.env`:
```env
DATABASE_URL=postgresql://ml_admin:your_secure_password@localhost:5432/ml_training_platform
```

---

### Step 8: Migrate Existing Data

Create `BACKEND/scripts/migrate-to-postgres.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { query } from '../src/database/connection';
import bcrypt from 'bcrypt';

async function migrateUsers() {
  const usersFile = path.join(process.cwd(), 'data', 'users.json');
  
  if (!fs.existsSync(usersFile)) {
    console.log('No users.json file found, skipping user migration');
    return;
  }

  const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));

  for (const user of users) {
    try {
      await query(
        `INSERT INTO users (id, email, name, password, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          user.id,
          user.email,
          user.name,
          user.password, // Already hashed
          user.role,
          user.createdAt,
          user.updatedAt
        ]
      );
      console.log(`✓ Migrated user: ${user.email}`);
    } catch (error) {
      console.error(`✗ Failed to migrate user ${user.email}:`, error);
    }
  }
}

async function migrateDatasets() {
  const metadataFile = path.join(process.cwd(), 'data', 'datasets', 'metadata.json');
  
  if (!fs.existsSync(metadataFile)) {
    console.log('No datasets metadata found, skipping');
    return;
  }

  const datasets = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));

  for (const dataset of datasets) {
    try {
      await query(
        `INSERT INTO datasets (id, name, filename, path, size, type, uploaded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          dataset.id,
          dataset.name,
          dataset.filename,
          dataset.path,
          dataset.size,
          dataset.type,
          dataset.uploaded_at
        ]
      );
      console.log(`✓ Migrated dataset: ${dataset.name}`);
    } catch (error) {
      console.error(`✗ Failed to migrate dataset ${dataset.name}:`, error);
    }
  }
}

async function migrateJobs() {
  const jobsDir = path.join(process.cwd(), 'artifacts', 'jobs');
  
  if (!fs.existsSync(jobsDir)) {
    console.log('No jobs directory found, skipping');
    return;
  }

  const files = fs.readdirSync(jobsDir);

  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    try {
      const jobPath = path.join(jobsDir, file);
      const job = JSON.parse(fs.readFileSync(jobPath, 'utf-8'));

      await query(
        `INSERT INTO training_jobs (
          id, job_id, status, progress, epoch, step, total_steps, loss,
          message, params, pid, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (job_id) DO NOTHING`,
        [
          job.job_id,
          job.job_id,
          job.status,
          job.progress || 0,
          job.epoch,
          job.step,
          job.total_steps,
          job.loss,
          job.message,
          JSON.stringify(job.params || {}),
          job.pid,
          job.created_at || new Date().toISOString(),
          job.updated_at || new Date().toISOString()
        ]
      );
      console.log(`✓ Migrated job: ${job.job_id}`);
    } catch (error) {
      console.error(`✗ Failed to migrate job ${file}:`, error);
    }
  }
}

async function main() {
  console.log('=== Starting migration to PostgreSQL ===\n');

  console.log('1. Migrating users...');
  await migrateUsers();

  console.log('\n2. Migrating datasets...');
  await migrateDatasets();

  console.log('\n3. Migrating training jobs...');
  await migrateJobs();

  console.log('\n=== Migration complete ===');
  process.exit(0);
}

main().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
```

Run migration:
```bash
cd BACKEND
npx ts-node scripts/migrate-to-postgres.ts
```

---

## 🎯 Option 2: MongoDB (Alternative)

### Step 1: Install MongoDB

**Ubuntu/Debian:**
```bash
sudo apt install mongodb
sudo systemctl start mongodb
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

---

### Step 2: Install Dependencies

```bash
cd BACKEND
npm install mongoose
npm install --save-dev @types/mongoose
```

---

### Step 3: Create Mongoose Models

Create `BACKEND/src/models/User.mongoose.ts`:

```typescript
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  next();
});

// Method to verify password
userSchema.methods.verifyPassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export const UserMongoose = mongoose.model('User', userSchema);
```

---

### Step 4: Connect to MongoDB

Create `BACKEND/src/database/mongodb.ts`:

```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ml_training_platform';

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  }
}

mongoose.connection.on('error', (error) => {
  console.error('MongoDB error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});
```

---

## 🧪 Testing Database Connection

Create `BACKEND/scripts/test-db.ts`:

```typescript
import { query } from '../src/database/connection'; // For PostgreSQL
// OR
// import { connectDB } from '../src/database/mongodb'; // For MongoDB

async function testConnection() {
  try {
    // PostgreSQL
    const result = await query('SELECT NOW()');
    console.log('✓ Database connected:', result.rows[0]);

    // OR MongoDB
    // await connectDB();
    // console.log('✓ MongoDB connected');

    process.exit(0);
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
```

Run:
```bash
cd BACKEND
npx ts-node scripts/test-db.ts
```

---

## 📝 Checklist

### Pre-Migration
- [ ] Backup all JSON files
- [ ] Database server installed and running
- [ ] Database created
- [ ] User credentials configured
- [ ] Dependencies installed

### Migration
- [ ] Schema applied
- [ ] Connection module created
- [ ] Models updated to use database
- [ ] Migration script created
- [ ] Migration script tested
- [ ] All data migrated successfully

### Post-Migration
- [ ] Test user registration
- [ ] Test user login
- [ ] Test dataset operations
- [ ] Test training job operations
- [ ] Test data persistence
- [ ] Update documentation
- [ ] Remove old JSON files (backup first!)

### Cleanup
- [ ] Backup JSON files to safe location
- [ ] Test application thoroughly
- [ ] Monitor database performance
- [ ] Set up database backups

---

## 🔧 Troubleshooting

### Connection Errors
```bash
# PostgreSQL: Check if service is running
sudo systemctl status postgresql

# MongoDB: Check if service is running
sudo systemctl status mongodb
```

### Permission Errors
```bash
# PostgreSQL: Grant permissions
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE ml_training_platform TO ml_admin;
```

### Migration Fails
- Check database logs
- Verify schema is correct
- Ensure data format matches
- Check for unique constraint violations

---

**Last Updated**: 2025-10-13  
**Version**: 1.0
