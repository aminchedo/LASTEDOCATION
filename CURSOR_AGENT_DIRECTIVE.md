# 🎯 CURSOR AGENT IMPLEMENTATION DIRECTIVE
# دستور پیاده‌سازی برای Cursor Agent

**Priority**: 🔴 CRITICAL  
**Objective**: Make the Model Training Project FULLY FUNCTIONAL  
**Timeline**: 12-18 days  

---

## 📋 MISSION OVERVIEW

You are tasked with completing a partially-implemented ML Training Platform that currently has:
- ✅ Working Backend training system with PyTorch
- ✅ Working Frontend UI with RTL/Persian support  
- ❌ **MISSING: Integration between Frontend and Backend**
- ❌ **MISSING: Authentication system**
- ❌ **MISSING: Real-time WebSocket updates**
- ❌ **MISSING: Complete dataset management flow**

Your mission is to **fill ALL gaps** and make the system **end-to-end functional**.

---

## 🎯 PHASE 1: CRITICAL INTEGRATION (Week 1)
**Priority: 🔴 Must complete first**

### Task 1.1: Unify API Endpoints

**Problem**: Frontend and Backend use different API paths.
- Frontend: calls `/api/experiments` (in `experiments.service.ts`)
- Backend: implements `/api/train` (in `trainJobsAPI.ts`)

**Solution**:

1. **Decision**: Use `/api/training` as the unified path (professional naming)

2. **Backend Changes**:
```typescript
// File: BACKEND/src/routes/training.ts (rename from trainJobsAPI.ts)
import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Change all routes to use /training prefix
router.post('/', async (req, res) => {  // POST /api/training
  // Create training job
  // Implementation already exists, just move it
});

router.get('/status', async (req, res) => {  // GET /api/training/status
  // Get job status
});

router.post('/:jobId/stop', async (req, res) => {  // POST /api/training/:jobId/stop
  // Stop job
});

router.get('/jobs', async (req, res) => {  // GET /api/training/jobs
  // List all jobs
});

router.get('/:jobId/download', async (req, res) => {  // GET /api/training/:jobId/download
  // Download trained model
  const { jobId } = req.params;
  const modelPath = path.join(__dirname, '../../../models', `${jobId}.pt`);
  
  if (!fs.existsSync(modelPath)) {
    return res.status(404).json({ error: 'Model not found' });
  }
  
  res.download(modelPath);
});

export default router;
```

3. **Update server.ts**:
```typescript
// File: BACKEND/src/server.ts
import trainingRoutes from './routes/training';  // renamed from trainJobsAPI

// Mount at /api/training
app.use('/api/training', trainingRoutes);
```

4. **Frontend Changes**:
```typescript
// File: client/src/services/training.service.ts (rename from experiments.service.ts)
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface TrainingJobParams {
  datasetId?: string;
  datasetPath?: string;
  epochs: number;
  batchSize: number;
  learningRate: number;
  modelType?: string;
}

export interface JobStatus {
  job_id: string;
  status: 'QUEUED' | 'STARTING' | 'LOADING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STOPPED';
  progress: number;
  epoch?: number;
  step?: number;
  total_steps?: number;
  loss?: number;
  message?: string;
  created_at?: string;
  updated_at?: string;
}

export const trainingService = {
  async createJob(params: TrainingJobParams): Promise<{ ok: boolean; job_id: string; status: string }> {
    try {
      const response = await axios.post(`${API_BASE}/api/training`, {
        epochs: params.epochs,
        batch_size: params.batchSize,
        lr: params.learningRate,
        dataset: params.datasetPath || 'test_data/sample_dataset.csv'
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create training job');
    }
  },

  async getJobStatus(jobId: string): Promise<{ ok: boolean; status: JobStatus }> {
    try {
      const response = await axios.get(`${API_BASE}/api/training/status`, {
        params: { job_id: jobId }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get job status');
    }
  },

  async stopJob(jobId: string): Promise<{ ok: boolean }> {
    try {
      const response = await axios.post(`${API_BASE}/api/training/${jobId}/stop`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to stop job');
    }
  },

  async listJobs(): Promise<{ ok: boolean; jobs: JobStatus[] }> {
    try {
      const response = await axios.get(`${API_BASE}/api/training/jobs`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to list jobs');
    }
  },

  async downloadModel(jobId: string): Promise<Blob> {
    try {
      const response = await axios.get(`${API_BASE}/api/training/${jobId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to download model');
    }
  }
};
```

5. **Update all components that use the service**:
```typescript
// File: client/src/pages/TrainingPage.tsx (or wherever training UI is)
import { trainingService } from '../services/training.service';

// Change all calls:
// OLD: experimentsService.create(...)
// NEW: trainingService.createJob(...)
```

**Verification**:
```bash
# Test backend
curl -X POST http://localhost:3001/api/training \
  -H "Content-Type: application/json" \
  -d '{"epochs":2,"batch_size":16,"lr":0.01}'

# Should return: {"ok":true,"job_id":"job_xxx","status":"QUEUED"}
```

**Acceptance Criteria**:
- [ ] All API calls use `/api/training/*` paths
- [ ] Frontend successfully creates jobs
- [ ] Status polling works
- [ ] Job listing works
- [ ] Model download works

---

### Task 1.2: Implement Dataset Upload & Selection

**Problem**: User cannot upload datasets through UI and use them in training.

**Solution**:

1. **Backend Route**:
```typescript
// File: BACKEND/src/routes/datasets.ts (should already exist, enhance it)
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../data/datasets');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.jsonl', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV, JSON, and JSONL files are allowed'));
    }
  }
});

// Upload dataset
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const dataset = {
      id: Date.now().toString(),
      name: req.body.name || req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      type: path.extname(req.file.originalname).slice(1),
      uploaded_at: new Date().toISOString()
    };

    // Save metadata to a JSON file
    const metadataPath = path.join(__dirname, '../../../data/datasets/metadata.json');
    let datasets = [];
    if (fs.existsSync(metadataPath)) {
      datasets = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    }
    datasets.push(dataset);
    fs.writeFileSync(metadataPath, JSON.stringify(datasets, null, 2));

    res.json({ ok: true, dataset });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List all datasets
router.get('/', async (req, res) => {
  try {
    const metadataPath = path.join(__dirname, '../../../data/datasets/metadata.json');
    if (!fs.existsSync(metadataPath)) {
      return res.json({ ok: true, datasets: [] });
    }

    const datasets = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    res.json({ ok: true, datasets });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get dataset by ID
router.get('/:id', async (req, res) => {
  try {
    const metadataPath = path.join(__dirname, '../../../data/datasets/metadata.json');
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    const datasets = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    const dataset = datasets.find((d: any) => d.id === req.params.id);

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    res.json({ ok: true, dataset });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete dataset
router.delete('/:id', async (req, res) => {
  try {
    const metadataPath = path.join(__dirname, '../../../data/datasets/metadata.json');
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    let datasets = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    const dataset = datasets.find((d: any) => d.id === req.params.id);

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    // Delete file
    if (fs.existsSync(dataset.path)) {
      fs.unlinkSync(dataset.path);
    }

    // Remove from metadata
    datasets = datasets.filter((d: any) => d.id !== req.params.id);
    fs.writeFileSync(metadataPath, JSON.stringify(datasets, null, 2));

    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

2. **Update server.ts**:
```typescript
// File: BACKEND/src/server.ts
import datasetRoutes from './routes/datasets';

app.use('/api/datasets', datasetRoutes);
```

3. **Frontend Service**:
```typescript
// File: client/src/services/datasets.service.ts
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface Dataset {
  id: string;
  name: string;
  filename: string;
  path: string;
  size: number;
  type: string;
  uploaded_at: string;
}

export const datasetsService = {
  async upload(file: File, name?: string): Promise<Dataset> {
    const formData = new FormData();
    formData.append('file', file);
    if (name) {
      formData.append('name', name);
    }

    try {
      const response = await axios.post(`${API_BASE}/api/datasets/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.dataset;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to upload dataset');
    }
  },

  async list(): Promise<Dataset[]> {
    try {
      const response = await axios.get(`${API_BASE}/api/datasets`);
      return response.data.datasets;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to list datasets');
    }
  },

  async get(id: string): Promise<Dataset> {
    try {
      const response = await axios.get(`${API_BASE}/api/datasets/${id}`);
      return response.data.dataset;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get dataset');
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE}/api/datasets/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete dataset');
    }
  }
};
```

4. **Frontend UI Component**:
```typescript
// File: client/src/components/datasets/DatasetUpload.tsx
import React, { useState } from 'react';
import { datasetsService } from '../../services/datasets.service';

export const DatasetUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!name) {
        setName(e.target.files[0].name);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      await datasetsService.upload(file, name);
      // Success - reset form
      setFile(null);
      setName('');
      // Trigger refresh of dataset list
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="dataset-upload">
      <h3>Upload Dataset</h3>
      
      <input
        type="file"
        accept=".csv,.json,.jsonl"
        onChange={handleFileChange}
        disabled={uploading}
      />

      <input
        type="text"
        placeholder="Dataset name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={uploading}
      />

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>

      {error && <div className="error">{error}</div>}
    </div>
  );
};
```

5. **Update Training Form to use datasets**:
```typescript
// File: client/src/components/training/TrainingForm.tsx
import React, { useState, useEffect } from 'react';
import { trainingService } from '../../services/training.service';
import { datasetsService, Dataset } from '../../services/datasets.service';

export const TrainingForm: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [epochs, setEpochs] = useState(10);
  const [batchSize, setBatchSize] = useState(32);
  const [learningRate, setLearningRate] = useState(0.001);
  const [training, setTraining] = useState(false);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const data = await datasetsService.list();
      setDatasets(data);
    } catch (error) {
      console.error('Failed to load datasets:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTraining(true);

    try {
      const dataset = datasets.find(d => d.id === selectedDataset);
      const result = await trainingService.createJob({
        datasetPath: dataset?.path,
        epochs,
        batchSize,
        learningRate
      });

      console.log('Training job created:', result.job_id);
      // Redirect to job monitoring page or show success
    } catch (error: any) {
      console.error('Failed to create training job:', error);
      alert(error.message);
    } finally {
      setTraining(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Dataset:</label>
        <select
          value={selectedDataset}
          onChange={(e) => setSelectedDataset(e.target.value)}
          required
        >
          <option value="">Select a dataset</option>
          {datasets.map(dataset => (
            <option key={dataset.id} value={dataset.id}>
              {dataset.name} ({dataset.size} bytes)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Epochs:</label>
        <input
          type="number"
          value={epochs}
          onChange={(e) => setEpochs(parseInt(e.target.value))}
          min={1}
          max={1000}
        />
      </div>

      <div>
        <label>Batch Size:</label>
        <input
          type="number"
          value={batchSize}
          onChange={(e) => setBatchSize(parseInt(e.target.value))}
          min={1}
          max={512}
        />
      </div>

      <div>
        <label>Learning Rate:</label>
        <input
          type="number"
          step={0.0001}
          value={learningRate}
          onChange={(e) => setLearningRate(parseFloat(e.target.value))}
          min={0.00001}
          max={1}
        />
      </div>

      <button type="submit" disabled={training || !selectedDataset}>
        {training ? 'Starting Training...' : 'Start Training'}
      </button>
    </form>
  );
};
```

**Verification**:
```bash
# Test upload
curl -X POST http://localhost:3001/api/datasets/upload \
  -F "file=@test.csv" \
  -F "name=My Test Dataset"

# Test list
curl http://localhost:3001/api/datasets

# Test training with dataset
curl -X POST http://localhost:3001/api/training \
  -H "Content-Type: application/json" \
  -d '{"epochs":2,"batch_size":16,"lr":0.01,"dataset":"data/datasets/1234-test.csv"}'
```

**Acceptance Criteria**:
- [ ] User can upload CSV/JSON/JSONL files
- [ ] Uploaded datasets appear in list
- [ ] User can select dataset in training form
- [ ] Training job uses selected dataset
- [ ] File size validation works
- [ ] Error handling for invalid files

---

## 🎯 PHASE 2: AUTHENTICATION (Week 1-2)
**Priority: 🔴 Critical for production**

### Task 2.1: Backend Authentication System

1. **Install Dependencies**:
```bash
cd BACKEND
npm install jsonwebtoken bcrypt @types/jsonwebtoken @types/bcrypt
```

2. **Create Auth Middleware**:
```typescript
// File: BACKEND/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as any;
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const user = jwt.verify(token, JWT_SECRET) as any;
      req.user = user;
    } catch (err) {
      // Token invalid but don't block request
    }
  }
  next();
}
```

3. **Create User Model** (file-based for now):
```typescript
// File: BACKEND/src/models/User.ts
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

const USERS_FILE = path.join(__dirname, '../../data/users.json');

export interface User {
  id: string;
  email: string;
  password: string; // hashed
  name: string;
  role: 'user' | 'admin';
  created_at: string;
}

class UserModel {
  private loadUsers(): User[] {
    if (!fs.existsSync(USERS_FILE)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  }

  private saveUsers(users: User[]): void {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  }

  async create(email: string, password: string, name: string): Promise<User> {
    const users = this.loadUsers();

    // Check if user exists
    if (users.find(u => u.email === email)) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user: User = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      name,
      role: 'user',
      created_at: new Date().toISOString()
    };

    users.push(user);
    this.saveUsers(users);

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const users = this.loadUsers();
    return users.find(u => u.email === email) || null;
  }

  async findById(id: string): Promise<User | null> {
    const users = this.loadUsers();
    return users.find(u => u.id === id) || null;
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}

export const userModel = new UserModel();
```

4. **Create Auth Routes**:
```typescript
// File: BACKEND/src/routes/auth.ts
import express from 'express';
import jwt from 'jsonwebtoken';
import { userModel } from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production';

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const user = await userModel.create(email, password, name);

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await userModel.verifyPassword(user, password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await userModel.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

5. **Protect Routes**:
```typescript
// File: BACKEND/src/routes/training.ts (update existing)
import { authenticateToken, AuthRequest } from '../middleware/auth';

// Protect all training routes
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  // User ID available in req.user.id
  // Create training job
});

router.get('/status', authenticateToken, async (req: AuthRequest, res) => {
  // Get job status
});

// Apply to all routes
```

6. **Update server.ts**:
```typescript
// File: BACKEND/src/server.ts
import authRoutes from './routes/auth';

// Add auth routes BEFORE other routes
app.use('/api/auth', authRoutes);

// Other routes...
app.use('/api/training', trainingRoutes);
app.use('/api/datasets', datasetRoutes);
```

7. **Add .env file**:
```bash
# File: BACKEND/.env
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
```

**Verification**:
```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get current user (use token from login)
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Try protected route without token (should fail)
curl -X POST http://localhost:3001/api/training \
  -H "Content-Type: application/json" \
  -d '{"epochs":2}'

# Try with token (should work)
curl -X POST http://localhost:3001/api/training \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"epochs":2}'
```

**Acceptance Criteria**:
- [ ] Users can register with email/password
- [ ] Users can login and receive JWT token
- [ ] Token is validated on protected routes
- [ ] Invalid/missing token returns 401/403
- [ ] User info can be retrieved with valid token
- [ ] Passwords are hashed (never stored plain text)

---

### Task 2.2: Frontend Authentication

1. **Install Dependencies**:
```bash
cd client
npm install jwt-decode
npm install --save-dev @types/jwt-decode
```

2. **Create Auth Context**:
```typescript
// File: client/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, User } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedToken = authService.getToken();
    const storedUser = authService.getCurrentUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setToken(response.token);
    setUser(response.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await authService.register(email, password, name);
    setToken(response.token);
    setUser(response.user);
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

3. **Create Auth Service**:
```typescript
// File: client/src/services/auth.service.ts
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthResponse {
  ok: boolean;
  token: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, {
        email,
        password
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  },

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE}/api/auth/register`, {
        email,
        password,
        name
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getCurrentUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

// Axios interceptor to add token to all requests
axios.interceptors.request.use(config => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Axios interceptor to handle 401 errors (token expired)
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

4. **Create Login Page**:
```typescript
// File: client/src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Login</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="register-link">
          Don't have an account? <a href="/register">Register here</a>
        </div>
      </div>
    </div>
  );
};
```

5. **Create Register Page** (similar to Login):
```typescript
// File: client/src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(email, password, name);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h1>Register</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="login-link">
          Already have an account? <a href="/login">Login here</a>
        </div>
      </div>
    </div>
  );
};
```

6. **Create Protected Route Component**:
```typescript
// File: client/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

7. **Update App.tsx with routes**:
```typescript
// File: client/src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
// Import other pages...

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                {/* Your main app component */}
              </ProtectedRoute>
            }
          />
          <Route
            path="/training"
            element={
              <ProtectedRoute>
                {/* Training page */}
              </ProtectedRoute>
            }
          />
          {/* Other protected routes... */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

8. **Add Logout Button to Navbar**:
```typescript
// File: client/src/components/Navbar.tsx (or wherever your navbar is)
import { useAuth } from '../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">ML Training Platform</div>
      
      <div className="navbar-user">
        <span>Welcome, {user?.name}</span>
        <button onClick={logout}>Logout</button>
      </div>
    </nav>
  );
};
```

**Verification**:
- [ ] User can register from UI
- [ ] User can login from UI
- [ ] Token is stored in localStorage
- [ ] Token is sent with API requests
- [ ] Protected pages redirect to login if not authenticated
- [ ] User can logout and token is cleared
- [ ] 401 errors automatically logout user

---

## 🎯 PHASE 3: WEBSOCKET REAL-TIME UPDATES (Week 2)
**Priority: 🟡 Important for UX**

### Task 3.1: Backend WebSocket Setup

1. **Install Dependencies**:
```bash
cd BACKEND
npm install socket.io
npm install --save-dev @types/socket.io
```

2. **Create WebSocket Service**:
```typescript
// File: BACKEND/src/services/websocket.service.ts
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production';

let io: Server | null = null;

export function setupWebSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const user = jwt.verify(token, JWT_SECRET) as any;
      (socket as any).user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`User connected: ${user.email} (${socket.id})`);

    // Subscribe to job updates
    socket.on('subscribe_job', (jobId: string) => {
      socket.join(`job:${jobId}`);
      console.log(`User ${user.email} subscribed to job ${jobId}`);
    });

    // Unsubscribe from job updates
    socket.on('unsubscribe_job', (jobId: string) => {
      socket.leave(`job:${jobId}`);
      console.log(`User ${user.email} unsubscribed from job ${jobId}`);
    });

    // Subscribe to all user's jobs
    socket.on('subscribe_user_jobs', () => {
      socket.join(`user:${user.id}`);
      console.log(`User ${user.email} subscribed to their jobs`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.email}`);
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

export function emitJobUpdate(jobId: string, status: any) {
  if (io) {
    io.to(`job:${jobId}`).emit('job_update', status);
  }
}

export function emitJobStatusToUser(userId: string, status: any) {
  if (io) {
    io.to(`user:${userId}`).emit('job_status', status);
  }
}
```

3. **Update server.ts**:
```typescript
// File: BACKEND/src/server.ts
import http from 'http';
import { setupWebSocket } from './services/websocket.service';

// Replace app.listen with:
const server = http.createServer(app);

// Setup WebSocket
const io = setupWebSocket(server);

// Make io available to routes
app.set('io', io);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});
```

4. **Update Training Script to Emit Updates**:
```python
# File: scripts/train_minimal_job.py
# Add WebSocket notification function

import requests
import json

def notify_status(job_id, status_data):
    """Notify backend of status update via HTTP (backend will emit via WebSocket)"""
    try:
        requests.post(
            'http://localhost:3001/api/training/internal/status-update',
            json={
                'job_id': job_id,
                'status': status_data
            },
            timeout=1
        )
    except:
        pass  # Fail silently if notification fails

# In training loop, after writing to file:
write_status(job_id, status_data)
notify_status(job_id, status_data)  # Add this line
```

5. **Add Internal Status Update Endpoint**:
```typescript
// File: BACKEND/src/routes/training.ts
import { emitJobUpdate } from '../services/websocket.service';

// Add internal endpoint (no auth required - called by Python script)
router.post('/internal/status-update', async (req, res) => {
  try {
    const { job_id, status } = req.body;
    
    // Emit to WebSocket clients
    emitJobUpdate(job_id, status);
    
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

**Verification**:
```bash
# Start server
cd BACKEND && npm start

# In browser console:
# Should see "WebSocket server ready"

# Test WebSocket connection (in browser console):
const socket = io('http://localhost:3001', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});
socket.on('connect', () => console.log('Connected!'));
socket.emit('subscribe_job', 'job_xxx');
socket.on('job_update', (data) => console.log('Update:', data));
```

---

### Task 3.2: Frontend WebSocket Integration

1. **Install Dependencies**:
```bash
cd client
npm install socket.io-client
```

2. **Create WebSocket Hook**:
```typescript
// File: client/src/hooks/useJobWebSocket.ts
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { authService } from '../services/auth.service';

export interface JobStatus {
  job_id: string;
  status: 'QUEUED' | 'STARTING' | 'LOADING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STOPPED';
  progress: number;
  epoch?: number;
  step?: number;
  total_steps?: number;
  loss?: number;
  message?: string;
}

export function useJobWebSocket(jobId: string | null) {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      setError('No authentication token');
      return;
    }

    // Create socket connection
    const socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001', {
      auth: { token }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
      setError(err.message);
      setConnected(false);
    });

    socket.on('job_update', (status: JobStatus) => {
      console.log('Job update received:', status);
      setJobStatus(status);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (socket && jobId) {
      // Subscribe to this job
      socket.emit('subscribe_job', jobId);
      
      return () => {
        // Unsubscribe when jobId changes or component unmounts
        socket.emit('unsubscribe_job', jobId);
      };
    }
  }, [jobId]);

  return { jobStatus, connected, error };
}
```

3. **Create Training Monitor Component**:
```typescript
// File: client/src/components/training/TrainingMonitor.tsx
import React, { useState, useEffect } from 'react';
import { useJobWebSocket } from '../../hooks/useJobWebSocket';
import { trainingService } from '../../services/training.service';

interface TrainingMonitorProps {
  jobId: string;
  onComplete?: () => void;
}

export const TrainingMonitor: React.FC<TrainingMonitorProps> = ({ jobId, onComplete }) => {
  const { jobStatus, connected } = useJobWebSocket(jobId);
  const [initialStatus, setInitialStatus] = useState<any>(null);

  // Fetch initial status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await trainingService.getJobStatus(jobId);
        setInitialStatus(response.status);
      } catch (error) {
        console.error('Failed to fetch initial status:', error);
      }
    };

    fetchStatus();
  }, [jobId]);

  // Use WebSocket status if available, otherwise use initial status
  const currentStatus = jobStatus || initialStatus;

  // Call onComplete when job finishes
  useEffect(() => {
    if (currentStatus?.status === 'COMPLETED' && onComplete) {
      onComplete();
    }
  }, [currentStatus?.status, onComplete]);

  if (!currentStatus) {
    return <div>Loading job status...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'green';
      case 'FAILED':
      case 'STOPPED':
        return 'red';
      case 'RUNNING':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <div className="training-monitor">
      <div className="status-header">
        <h3>Training Job: {jobId}</h3>
        <div className="connection-status">
          {connected ? (
            <span className="connected">● Live</span>
          ) : (
            <span className="disconnected">○ Polling</span>
          )}
        </div>
      </div>

      <div className="status-info">
        <div className="status-badge" style={{ backgroundColor: getStatusColor(currentStatus.status) }}>
          {currentStatus.status}
        </div>

        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${currentStatus.progress}%` }}
          />
          <span className="progress-text">{currentStatus.progress.toFixed(1)}%</span>
        </div>

        {currentStatus.epoch && (
          <div className="training-metrics">
            <div>Epoch: {currentStatus.epoch}</div>
            {currentStatus.step && currentStatus.total_steps && (
              <div>Step: {currentStatus.step} / {currentStatus.total_steps}</div>
            )}
            {currentStatus.loss && (
              <div>Loss: {currentStatus.loss.toFixed(6)}</div>
            )}
          </div>
        )}

        {currentStatus.message && (
          <div className="status-message">{currentStatus.message}</div>
        )}
      </div>

      {currentStatus.status === 'RUNNING' && (
        <button
          className="stop-button"
          onClick={async () => {
            try {
              await trainingService.stopJob(jobId);
            } catch (error) {
              console.error('Failed to stop job:', error);
            }
          }}
        >
          Stop Training
        </button>
      )}

      {currentStatus.status === 'COMPLETED' && (
        <button
          className="download-button"
          onClick={async () => {
            try {
              const blob = await trainingService.downloadModel(jobId);
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${jobId}.pt`;
              a.click();
            } catch (error) {
              console.error('Failed to download model:', error);
            }
          }}
        >
          Download Model
        </button>
      )}
    </div>
  );
};
```

4. **Use in Training Page**:
```typescript
// File: client/src/pages/TrainingPage.tsx
import React, { useState } from 'react';
import { TrainingForm } from '../components/training/TrainingForm';
import { TrainingMonitor } from '../components/training/TrainingMonitor';

export const TrainingPage: React.FC = () => {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  return (
    <div className="training-page">
      <h1>Model Training</h1>

      {!activeJobId ? (
        <TrainingForm
          onJobCreated={(jobId) => setActiveJobId(jobId)}
        />
      ) : (
        <TrainingMonitor
          jobId={activeJobId}
          onComplete={() => {
            alert('Training completed!');
            setActiveJobId(null);
          }}
        />
      )}
    </div>
  );
};
```

**Verification**:
- [ ] WebSocket connects when user logs in
- [ ] Real-time updates appear without polling
- [ ] Progress bar updates smoothly
- [ ] Loss values update in real-time
- [ ] Connection indicator shows live status
- [ ] Falls back to polling if WebSocket fails

---

## 🎯 PHASE 4: TESTING & DOCUMENTATION (Week 2-3)
**Priority: 🟡 Important for quality**

### Task 4.1: Integration Tests

Create comprehensive tests:

```typescript
// File: client/src/__tests__/integration/training-flow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Mock API server
const server = setupServer(
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(ctx.json({
      ok: true,
      token: 'fake-token',
      user: { id: '1', email: 'test@test.com', name: 'Test' }
    }));
  }),
  
  rest.post('/api/training', (req, res, ctx) => {
    return res(ctx.json({
      ok: true,
      job_id: 'job_123',
      status: 'QUEUED'
    }));
  }),
  
  rest.get('/api/training/status', (req, res, ctx) => {
    return res(ctx.json({
      ok: true,
      status: {
        job_id: 'job_123',
        status: 'RUNNING',
        progress: 50,
        loss: 0.5
      }
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Complete Training Flow', () => {
  it('should complete full training workflow', async () => {
    const user = userEvent.setup();
    
    // 1. Login
    render(<App />);
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    // 2. Navigate to training
    await waitFor(() => {
      expect(screen.getByText(/model training/i)).toBeInTheDocument();
    });
    
    // 3. Create training job
    await user.type(screen.getByLabelText(/epochs/i), '10');
    await user.click(screen.getByRole('button', { name: /start training/i }));
    
    // 4. Verify job creation
    await waitFor(() => {
      expect(screen.getByText(/job_123/i)).toBeInTheDocument();
    });
    
    // 5. Verify progress monitoring
    await waitFor(() => {
      expect(screen.getByText(/50%/i)).toBeInTheDocument();
    });
  });
});
```

### Task 4.2: API Documentation

Generate Swagger documentation:

```typescript
// File: BACKEND/src/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ML Training Platform API',
      version: '1.0.0',
      description: 'API documentation for ML Training Platform'
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts']
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  console.log('Swagger documentation available at /api-docs');
}
```

Add JSDoc comments to routes:

```typescript
/**
 * @swagger
 * /api/training:
 *   post:
 *     summary: Create a new training job
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - epochs
 *               - batch_size
 *               - lr
 *             properties:
 *               epochs:
 *                 type: integer
 *                 example: 10
 *               batch_size:
 *                 type: integer
 *                 example: 32
 *               lr:
 *                 type: number
 *                 format: float
 *                 example: 0.001
 *               dataset:
 *                 type: string
 *                 example: "data/datasets/my-dataset.csv"
 *     responses:
 *       200:
 *         description: Training job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 job_id:
 *                   type: string
 *                 status:
 *                   type: string
 */
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  // Implementation...
});
```

---

## 📝 IMPLEMENTATION CHECKLIST

### Phase 1: Critical Integration ✅
- [ ] **Task 1.1**: Unify API endpoints to `/api/training`
  - [ ] Rename backend route file
  - [ ] Update all endpoints
  - [ ] Update frontend service
  - [ ] Update all components
  - [ ] Test all API calls

- [ ] **Task 1.2**: Implement dataset upload & selection
  - [ ] Create backend upload endpoint
  - [ ] Create dataset listing endpoint
  - [ ] Create frontend upload component
  - [ ] Update training form with dataset selector
  - [ ] Test upload → select → train flow

### Phase 2: Authentication ✅
- [ ] **Task 2.1**: Backend authentication
  - [ ] Install dependencies
  - [ ] Create auth middleware
  - [ ] Create User model
  - [ ] Create auth routes (register/login/me)
  - [ ] Protect all routes with authentication
  - [ ] Add JWT secret to .env
  - [ ] Test all auth endpoints

- [ ] **Task 2.2**: Frontend authentication
  - [ ] Create AuthContext
  - [ ] Create auth service
  - [ ] Create Login page
  - [ ] Create Register page
  - [ ] Create ProtectedRoute component
  - [ ] Update App.tsx with routes
  - [ ] Add logout to navbar
  - [ ] Test complete auth flow

### Phase 3: WebSocket ✅
- [ ] **Task 3.1**: Backend WebSocket
  - [ ] Install socket.io
  - [ ] Create WebSocket service
  - [ ] Update server.ts
  - [ ] Update training script to emit updates
  - [ ] Add internal status endpoint
  - [ ] Test WebSocket connection

- [ ] **Task 3.2**: Frontend WebSocket
  - [ ] Install socket.io-client
  - [ ] Create useJobWebSocket hook
  - [ ] Create TrainingMonitor component
  - [ ] Update TrainingPage
  - [ ] Test real-time updates

### Phase 4: Testing & Documentation ✅
- [ ] **Task 4.1**: Integration tests
  - [ ] Setup testing infrastructure
  - [ ] Write auth flow tests
  - [ ] Write training flow tests
  - [ ] Write dataset upload tests
  - [ ] Run all tests

- [ ] **Task 4.2**: API documentation
  - [ ] Setup Swagger
  - [ ] Document all endpoints
  - [ ] Add example requests/responses
  - [ ] Generate documentation

---

## 🎯 FINAL VERIFICATION

Before considering the project complete, verify:

### Functional Requirements ✅
- [ ] User can register and login
- [ ] User can upload datasets
- [ ] User can see list of datasets
- [ ] User can create training job with selected dataset
- [ ] Training progress is visible in real-time
- [ ] User can stop training job
- [ ] User can see list of all jobs
- [ ] User can download trained models
- [ ] All routes are protected by authentication
- [ ] WebSocket reconnects automatically

### Technical Requirements ✅
- [ ] Zero TypeScript errors (`npm run build`)
- [ ] All tests pass
- [ ] API documentation accessible at `/api-docs`
- [ ] Environment variables properly configured
- [ ] Secrets not exposed in client
- [ ] Error handling in all paths
- [ ] Loading states everywhere
- [ ] Proper error messages to users

### Quality Requirements ✅
- [ ] Code is well-documented
- [ ] No console errors in production
- [ ] Performance is acceptable
- [ ] Security best practices followed
- [ ] Accessibility standards met

---

## 🚀 DEPLOYMENT COMMANDS

```bash
# 1. Install dependencies
cd BACKEND && npm install
cd ../client && npm install

# 2. Build backend
cd BACKEND
npm run build

# 3. Setup environment
cp .env.example .env
# Edit .env with production values

# 4. Build frontend
cd ../client
npm run build

# 5. Start backend
cd ../BACKEND
PORT=3001 NODE_ENV=production node dist/src/server.js

# 6. Serve frontend (with nginx or serve)
cd ../client
npx serve -s dist -p 5173
```

---

## 📞 SUCCESS CRITERIA

The implementation is **COMPLETE** when:

1. ✅ All tasks in checklist are done
2. ✅ All verification items pass
3. ✅ Integration tests pass
4. ✅ Documentation is complete
5. ✅ Application runs without errors
6. ✅ End-to-end user flow works perfectly

---

**GOOD LUCK! Follow this guide step by step and the project will be fully functional!** 🚀
