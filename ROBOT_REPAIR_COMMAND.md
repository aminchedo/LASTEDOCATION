# 🤖 دستور تعمیر کامل پروژه - Persian AI Training Platform

## 📋 دستورالعمل اجرایی برای ربات کدنویس

---

# MISSION: COMPLETE PROJECT REPAIR & FUNCTIONALITY RESTORATION

You are a SENIOR FULL-STACK ENGINEER tasked with fixing and making 100% functional the Persian AI Training Platform. This is NOT a request for suggestions - this is a DIRECT ORDER to FIX EVERYTHING.

---

## ❌ ABSOLUTELY FORBIDDEN (قطعاً ممنوع):

- NO pseudo-code or placeholders (like "// implementation here")
- NO mock data or fake APIs  
- NO console.log debugging without removal
- NO TODO comments
- NO partial implementations
- NO "this should work" comments
- NO skipping any file or component
- NO exaggerated progress reports - ONLY REAL FIXES
- NO assumptions - verify everything works

---

## ✅ MANDATORY ACTIONS (اقدامات الزامی):

- FIX every broken file
- TEST every API endpoint
- VERIFY every UI component renders
- ENSURE all routing works
- MAKE all features functional
- REMOVE all errors and warnings
- WRITE production-ready code only
- PROVIDE exact file paths and line numbers
- SHOW actual before/after code

---

## 🚨 PRIORITY 1: TypeScript Errors (135 errors) - MUST FIX ALL

### Issue 1.1: Type Mismatches in Dataset/Training Types

**Files affected:**
```
client/src/shared/types/dataset.ts
client/src/shared/types/training.ts
client/src/hooks/useTraining.ts
client/src/hooks/useDatasets.ts
```

**EXACT PROBLEM:**
```typescript
// Current (BROKEN):
interface TrainingJob {
  status: string;  // ❌ Too generic
}

// MUST FIX TO:
interface TrainingJob {
  status: 'QUEUED' | 'STARTING' | 'LOADING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STOPPED';
  job_id: string;
  progress: number;
  epoch?: number;
  step?: number;
  total_steps?: number;
  loss?: number;
  message?: string;
  created_at?: string;
  updated_at?: string;
  pid?: number;
  params?: {
    dataset?: string;
    epochs?: number;
    batch_size?: number;
    lr?: number;
  };
}
```

**ACTION REQUIRED:**
1. Read `BACKEND/src/types/training.ts`
2. Copy EXACT type definitions to `client/src/shared/types/training.ts`
3. Update ALL 45 occurrences in frontend
4. Verify with `cd client && npm run lint`

---

### Issue 1.2: Hook Return Type Errors (32 errors)

**Files affected:**
```
client/src/hooks/useTraining.ts (lines 23, 45, 67)
client/src/hooks/useDownloads.ts (lines 19, 38)
client/src/hooks/useMetrics.ts (line 15)
```

**EXACT FIX REQUIRED:**
```typescript
// Current (BROKEN):
export function useTraining() {
  // ❌ Missing return type
  const [jobs, setJobs] = useState([]);
  return { jobs };
}

// MUST FIX TO:
interface UseTrainingReturn {
  jobs: TrainingJob[];
  loading: boolean;
  error: string | null;
  startTraining: (config: TrainingConfig) => Promise<void>;
  stopTraining: (jobId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useTraining(): UseTrainingReturn {
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ... implementation
  
  return { jobs, loading, error, startTraining, stopTraining, refetch };
}
```

**DO THIS FOR ALL HOOKS:**
- `useTraining.ts` → Add complete return type
- `useDownloads.ts` → Add complete return type
- `useMetrics.ts` → Add complete return type
- `useDatasets.ts` → Add complete return type
- `useModels.ts` → Add complete return type

---

### Issue 1.3: Component Props Type Errors (28 errors)

**Files affected:**
```
client/src/shared/components/ui/Input.tsx
client/src/components/settings/CustomApiSettings.tsx
client/src/components/training/TrainingForm.tsx
```

**MUST FIX:**
```typescript
// Current (BROKEN):
export function Input(props) {  // ❌ No type
  return <input {...props} />;
}

// MUST FIX TO:
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export function Input({ label, error, helpText, ...props }: InputProps) {
  return (
    <div>
      {label && <label>{label}</label>}
      <input {...props} />
      {error && <span className="text-red-500">{error}</span>}
      {helpText && <span className="text-gray-500">{helpText}</span>}
    </div>
  );
}
```

---

### Issue 1.4: Enum/Union Type Errors (18 errors)

**Files affected:**
```
client/src/types/sources.ts
client/src/types/job.ts
```

**FIX:**
```typescript
// Replace ALL string enums with union types that match backend

// WRONG:
enum DataSourceKind {
  MODEL = 'model',
  DATASET = 'dataset'
}

// CORRECT:
export type DataSourceKind = 'model' | 'dataset';

// WRONG:
enum JobStatus {
  QUEUED = 'queued',
  RUNNING = 'running'
}

// CORRECT:
export type JobStatus = 'QUEUED' | 'STARTING' | 'LOADING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STOPPED';
```

---

### Issue 1.5: API/Authorization Type Errors (12 errors)

**File:** `client/src/services/api.ts`

**FIX:**
```typescript
// Current (BROKEN):
private getHeaders(): HeadersInit {  // ❌ Browser type
  const headers: HeadersInit = {};
  return headers;
}

// MUST FIX TO:
private getHeaders(): Record<string, string> {  // ✅ Platform agnostic
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}
```

---

## 🚨 PRIORITY 2: Backend Issues

### Issue 2.1: Dataset Path Resolution (CRITICAL)

**File:** `BACKEND/src/services/train.ts`
**Line:** ~145

**PROBLEM:** Training fails because dataset path is incorrect

**CURRENT (BROKEN):**
```typescript
const datasetPath = params.dataset || 'test_data/sample.csv';
// ❌ Relative path fails in production
```

**MUST FIX TO:**
```typescript
import path from 'path';

const resolveDatasetPath = (datasetParam?: string): string => {
  if (!datasetParam) {
    // Default dataset
    return path.resolve(process.cwd(), 'BACKEND/data/datasets/test-dataset.jsonl');
  }
  
  // If absolute path, use as-is
  if (path.isAbsolute(datasetParam)) {
    return datasetParam;
  }
  
  // If relative, resolve from cwd
  return path.resolve(process.cwd(), datasetParam);
};

const datasetPath = resolveDatasetPath(params.dataset);

// Verify file exists
if (!fs.existsSync(datasetPath)) {
  throw new Error(`Dataset not found: ${datasetPath}`);
}
```

---

### Issue 2.2: WebSocket Authentication

**File:** `BACKEND/src/services/websocket.service.ts`
**Lines:** 32-48

**PROBLEM:** Token verification fails silently

**ADD ERROR HANDLING:**
```typescript
io.use((socket: Socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    console.error('[WebSocket] No token provided for connection:', socket.id);
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as any;
    (socket as AuthSocket).user = {
      userId: user.userId,
      role: user.role,
      username: user.username
    };
    console.log('[WebSocket] User authenticated:', user.username);
    next();
  } catch (err) {
    console.error('[WebSocket] Token verification failed:', err);
    next(new Error('Authentication error: Invalid token'));
  }
});
```

---

### Issue 2.3: Download Manager Process Tracking

**File:** `BACKEND/src/services/downloads.ts`
**Line:** ~67

**PROBLEM:** Zombie processes when download cancelled

**FIX:**
```typescript
cancelDownload(jobId: string): void {
  const job = this.activeJobs[jobId];
  
  if (!job) {
    console.warn(`[Downloads] Job ${jobId} not found in active jobs`);
    return;
  }
  
  if (job.process) {
    console.log(`[Downloads] Cancelling job ${jobId}, PID: ${job.process.pid}`);
    
    // Kill the process
    job.process.kill('SIGTERM');
    
    // Remove all listeners to prevent memory leaks
    job.process.removeAllListeners();
    
    // Clean up from active jobs
    delete this.activeJobs[jobId];
    
    // Update job status
    this.updateJobStatus(jobId, {
      status: 'cancelled',
      message: 'Download cancelled by user',
      cancelled_at: new Date().toISOString()
    });
    
    console.log(`[Downloads] Job ${jobId} cancelled successfully`);
  }
}
```

---

## 🚨 PRIORITY 3: Frontend Routing Issues

### Issue 3.1: Lazy Loading Errors

**File:** `client/src/App.tsx`
**Lines:** 96-106

**PROBLEM:** Some lazy imports fail because components don't have default exports

**VERIFY ALL IMPORTS:**
```typescript
// In App.tsx:
const HomePage = lazy(() => import('@/pages/HomePage'));
const ChatPage = lazy(() => import('@/pages/NewPersianChatPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ModelsHubPage = lazy(() => import('@/pages/ModelsHubPage'));
const PlaygroundHubPage = lazy(() => import('@/pages/PlaygroundHubPage'));
const TrainingHubPage = lazy(() => import('@/pages/TrainingHubPage'));
```

**CHECK EACH FILE - If component has:**
```typescript
// WRONG (will fail lazy loading):
export function HomePage() { }

// CORRECT (will work):
export default function HomePage() { }

// OR keep named export and add:
export { HomePage as default };
```

**FIX ALL OF THESE FILES:**
1. `client/src/pages/HomePage.tsx` → Add default export
2. `client/src/pages/NewPersianChatPage.tsx` → Verify default export
3. `client/src/pages/NotificationsPage.tsx` → Add default export
4. `client/src/pages/SettingsPage.tsx` → Verify default export
5. `client/src/pages/LoginPage.tsx` → Verify default export
6. `client/src/pages/Dashboard.tsx` → Verify default export
7. `client/src/pages/ModelsHubPage.tsx` → Verify default export
8. `client/src/pages/PlaygroundHubPage.tsx` → Verify default export
9. `client/src/pages/TrainingHubPage.tsx` → Verify default export

---

### Issue 3.2: Route Protection

**File:** `client/src/components/AuthGuard.tsx`

**VERIFY AND FIX:**
```typescript
import { Navigate } from 'react-router-dom';
import { AuthService } from '@/services/auth.service';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const token = AuthService.getToken();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };
  
  if (isTokenExpired(token)) {
    AuthService.clearTokens();
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}
```

---

### Issue 3.3: Navigation Links Verification

**Files to check:**
```
client/src/layouts/RootLayout.tsx
client/src/pages/HomePage.tsx
client/src/components/dashboard/*
```

**VERIFY:** Each `<Link to="/path">` matches a route in `App.tsx`

**Check these routes exist:**
- `/` → HomePage ✅
- `/chat` → ChatPage ✅
- `/models` → ModelsHubPage ✅
- `/playground` → PlaygroundHubPage ✅
- `/training` → TrainingHubPage ✅
- `/dashboard` → Dashboard ✅
- `/notifications` → NotificationsPage ✅
- `/settings` → SettingsPage ✅
- `/login` → LoginPage ✅

**If any link goes to a non-existent route, FIX IT.**

---

## 🚨 PRIORITY 4: API Integration Issues

### Issue 4.1: API Base URL Configuration

**File:** `client/.env`

**CREATE THIS FILE:**
```bash
VITE_API_BASE_URL=http://localhost:3001
```

**File:** `client/src/services/api.ts`

**VERIFY:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    console.log('[API] Initialized with base URL:', this.baseURL);
  }
  
  // ... rest of code
}

export const api = new ApiClient(API_BASE_URL);
```

---

### Issue 4.2: CORS Configuration

**File:** `BACKEND/src/server.ts`
**Line:** ~32

**CURRENT:**
```typescript
app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));
```

**MUST BE:**
```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:3001'
];

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));
```

---

### Issue 4.3: Error Response Handling

**File:** `client/src/services/api.ts`

**FIX:**
```typescript
private async handleResponse<T>(response: Response): Promise<T> {
  // Handle 401 Unauthorized
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    let errorMessage = response.statusText;
    
    if (isJson) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorData.details || errorMessage;
      } catch {
        // If JSON parsing fails, use statusText
      }
    }
    
    console.error('[API] Request failed:', {
      status: response.status,
      statusText: response.statusText,
      message: errorMessage
    });
    
    throw new Error(errorMessage);
  }

  if (isJson) {
    const data = await response.json();
    // Handle both direct data and wrapped responses
    return data.data !== undefined ? data.data : data;
  }

  return {} as T;
}
```

---

## 🚨 PRIORITY 5: Database Issues

### Issue 5.1: Connection Pooling

**File:** `BACKEND/src/database/connection.ts`

**VERIFY AND FIX:**
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                      // Maximum pool size
  idleTimeoutMillis: 30000,     // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Timeout after 2s
});

// Test connection on startup
pool.on('connect', () => {
  console.log('[Database] New client connected to pool');
});

pool.on('error', (err) => {
  console.error('[Database] Unexpected error on idle client', err);
  process.exit(-1);
});

// Test query
export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('[Database] Connection test successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('[Database] Connection test failed:', error);
    return false;
  }
}

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('[Database] Query executed', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('[Database] Query error', { text, error });
    throw error;
  }
}

export default pool;
```

---

### Issue 5.2: Database Schema Initialization

**CREATE FILE:** `BACKEND/scripts/init-database.sh`

```bash
#!/bin/bash

# Database initialization script

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set"
  echo "Please set it in .env file or export it:"
  echo "export DATABASE_URL=postgresql://user:pass@localhost:5432/persian_tts"
  exit 1
fi

echo "🗄️  Initializing database..."

# Check if database exists
psql $DATABASE_URL -c "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ Cannot connect to database"
  echo "Make sure PostgreSQL is running and DATABASE_URL is correct"
  exit 1
fi

# Check if tables exist
TABLE_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")

if [ "$TABLE_COUNT" -eq 0 ]; then
  echo "📊 No tables found. Running schema.sql..."
  psql $DATABASE_URL < src/database/schema.sql
  
  if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully"
  else
    echo "❌ Failed to create database schema"
    exit 1
  fi
else
  echo "✅ Database already initialized ($TABLE_COUNT tables found)"
fi

# Verify all 7 tables exist
REQUIRED_TABLES=("users" "models" "training_jobs" "datasets" "download_queue" "user_settings" "checkpoints")

for table in "${REQUIRED_TABLES[@]}"; do
  EXISTS=$(psql $DATABASE_URL -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='$table');")
  if [[ $EXISTS == *"t"* ]]; then
    echo "✅ Table '$table' exists"
  else
    echo "❌ Table '$table' is missing"
    exit 1
  fi
done

echo "🎉 Database initialization complete!"
```

**Make it executable:**
```bash
chmod +x BACKEND/scripts/init-database.sh
```

---

### Issue 5.3: Query Error Handling

**File:** `BACKEND/src/models/User.ts`

**FIX ALL DATABASE QUERIES:**
```typescript
import { query } from '../database/connection';
import bcrypt from 'bcrypt';

export class UserModel {
  async findById(id: string): Promise<User | null> {
    try {
      const result = await query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('[UserModel] Error finding user by ID:', error);
      throw new Error('Database error: Could not find user');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('[UserModel] Error finding user by email:', error);
      throw new Error('Database error: Could not find user');
    }
  }

  async create(email: string, password: string, name: string): Promise<User> {
    try {
      // Check if user exists
      const existing = await this.findByEmail(email);
      if (existing) {
        throw new Error('User already exists');
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      // Insert user
      const result = await query(
        `INSERT INTO users (email, username, password_hash, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, username, role, created_at`,
        [email, name, password_hash, 'user']
      );

      return result.rows[0];
    } catch (error) {
      console.error('[UserModel] Error creating user:', error);
      throw error;
    }
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, user.password_hash);
    } catch (error) {
      console.error('[UserModel] Error verifying password:', error);
      return false;
    }
  }
}

export const userModel = new UserModel();
```

---

## 🚨 PRIORITY 6: Missing Features Implementation

### Issue 6.1: Training Status Updates

**File:** `BACKEND/scripts/train_minimal.ts`

**ENSURE IT DOES BOTH:**
1. Writes status to file
2. Calls internal webhook

**FIX:**
```typescript
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

async function updateStatus(jobId: string, status: any) {
  // 1. Write to file
  const statusPath = path.join(process.cwd(), 'artifacts', 'jobs', `${jobId}.json`);
  const statusData = {
    job_id: jobId,
    ...status,
    updated_at: new Date().toISOString()
  };
  
  fs.writeFileSync(statusPath, JSON.stringify(statusData, null, 2));
  console.log(`[Training] Status written to file: ${statusPath}`);
  
  // 2. Call internal webhook
  try {
    await fetch('http://localhost:3001/api/training/internal/status-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, status: statusData })
    });
    console.log(`[Training] Status webhook called for job: ${jobId}`);
  } catch (error) {
    console.error(`[Training] Webhook call failed:`, error);
    // Don't throw - file write succeeded
  }
}

// Use this in training loop:
for (let epoch = 0; epoch < epochs; epoch++) {
  for (let step = 0; step < stepsPerEpoch; step++) {
    const loss = calculateLoss(epoch, step);
    const progress = ((epoch * stepsPerEpoch + step) / totalSteps) * 100;
    
    await updateStatus(jobId, {
      status: 'RUNNING',
      progress: Math.round(progress),
      epoch: epoch + 1,
      step: step + 1,
      total_steps: totalSteps,
      loss: loss
    });
    
    // Simulate training time
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

// On completion:
await updateStatus(jobId, {
  status: 'COMPLETED',
  progress: 100,
  message: 'Training completed successfully'
});
```

---

### Issue 6.2: Download Progress Parsing

**File:** `BACKEND/src/services/downloads.ts`

**FIX REGEX:**
```typescript
parseProgress(stdout: string): number {
  // huggingface-cli download outputs different formats:
  // "Downloading: 50%"
  // "50.5%"
  // "Progress: 50%"
  
  // Try multiple patterns
  const patterns = [
    /(\d+(?:\.\d+)?)\s*%/,           // "50%" or "50.5%"
    /Progress:\s*(\d+(?:\.\d+)?)/,   // "Progress: 50"
    /Downloading.*?(\d+(?:\.\d+)?)/, // "Downloading: 50"
  ];
  
  for (const pattern of patterns) {
    const match = stdout.match(pattern);
    if (match) {
      const progress = parseFloat(match[1]);
      return Math.min(100, Math.max(0, progress)); // Clamp 0-100
    }
  }
  
  return 0;
}

// Also parse speed and ETA:
parseDownloadInfo(stdout: string): { progress: number; speed?: string; eta?: string } {
  const progress = this.parseProgress(stdout);
  
  // Speed: "5.2 MB/s" or "1.5 GB/s"
  const speedMatch = stdout.match(/(\d+(?:\.\d+)?)\s*(MB|GB)\/s/i);
  const speed = speedMatch ? `${speedMatch[1]} ${speedMatch[2]}/s` : undefined;
  
  // ETA: "ETA: 00:05:30" or "5m 30s remaining"
  const etaMatch = stdout.match(/ETA:\s*(\d{2}:\d{2}:\d{2})|(\d+)m\s*(\d+)s/i);
  const eta = etaMatch ? (etaMatch[1] || `${etaMatch[2]}m ${etaMatch[3]}s`) : undefined;
  
  return { progress, speed, eta };
}
```

---

### Issue 6.3: Notification System

**File:** `BACKEND/src/services/notifications.ts`

**ENSURE IT CREATES NOTIFICATIONS ON EVENTS:**
```typescript
import { v4 as uuidv4 } from 'uuid';

interface Notification {
  id: string;
  userId: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

class NotificationService {
  private notifications: Notification[] = [];

  async create(data: {
    userId: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    actionUrl?: string;
  }): Promise<Notification> {
    const notification: Notification = {
      id: uuidv4(),
      ...data,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    this.notifications.push(notification);
    console.log(`[Notifications] Created: ${notification.title}`);
    
    // TODO: Emit via WebSocket
    // emitToUser(data.userId, 'notification', notification);
    
    return notification;
  }

  // Helper methods:
  async onTrainingComplete(userId: string, jobId: string) {
    return this.create({
      userId,
      type: 'success',
      title: 'آموزش تکمیل شد',
      message: `وظیفه آموزش ${jobId} با موفقیت به پایان رسید`,
      actionUrl: `/training/jobs/${jobId}`
    });
  }

  async onDownloadComplete(userId: string, modelName: string) {
    return this.create({
      userId,
      type: 'success',
      title: 'دانلود تکمیل شد',
      message: `مدل ${modelName} با موفقیت دانلود شد`,
      actionUrl: '/models'
    });
  }

  async onTrainingError(userId: string, jobId: string, error: string) {
    return this.create({
      userId,
      type: 'error',
      title: 'خطا در آموزش',
      message: `وظیفه ${jobId} با خطا مواجه شد: ${error}`,
      actionUrl: `/training/jobs/${jobId}`
    });
  }
}

export const notificationService = new NotificationService();

// USE IN TRAINING SERVICE:
// On complete:
await notificationService.onTrainingComplete(userId, jobId);

// On error:
await notificationService.onTrainingError(userId, jobId, errorMessage);

// ON DOWNLOAD SERVICE:
// On complete:
await notificationService.onDownloadComplete(userId, modelName);
```

---

## 🚨 PRIORITY 7: UI/UX Issues

### Issue 7.1: Loading States

**Check ALL pages have proper loading:**

**Pattern to use everywhere:**
```typescript
import { Skeleton, CardSkeleton } from '@/shared/components/ui/Skeleton';

function MyPage() {
  const { data, loading, error } = useSomeData();
  
  if (loading) {
    return (
      <div className="space-y-4">
        <CardSkeleton count={3} />
      </div>
    );
  }
  
  if (error) {
    return <ErrorState error={error} />;
  }
  
  return <div>{/* actual content */}</div>;
}
```

**FIX THESE FILES:**
1. `client/src/pages/HomePage.tsx` → Add loading skeleton
2. `client/src/pages/TrainingPage.tsx` → Add loading skeleton
3. `client/src/pages/ModelHubPage.tsx` → Add loading skeleton
4. `client/src/pages/DatasetsPage.tsx` → Add loading skeleton
5. `client/src/pages/MetricsDashboard.tsx` → Add loading skeleton

---

### Issue 7.2: Error States

**Pattern for all pages:**
```typescript
import { EmptyState } from '@/shared/components/ui/EmptyState';

if (error) {
  return (
    <EmptyState
      icon="alertCircle"
      title="خطا در بارگذاری"
      description={error}
      action={{
        label: "تلاش مجدد",
        onClick: () => refetch()
      }}
    />
  );
}
```

**ADD TO ALL PAGES THAT FETCH DATA**

---

### Issue 7.3: Empty States

**Pattern for empty lists:**
```typescript
if (items.length === 0) {
  return (
    <EmptyState
      icon="inbox"
      title="هیچ موردی یافت نشد"
      description="هنوز هیچ مدلی نصب نشده است"
      action={{
        label: "دانلود مدل",
        onClick: () => navigate('/models/catalog')
      }}
    />
  );
}
```

**ADD TO:**
- Training jobs list (no jobs)
- Models list (no models)
- Datasets list (no datasets)
- Notifications list (no notifications)
- Downloads list (no downloads)

---

## 🚨 PRIORITY 8: Build & Deploy Issues

### Issue 8.1: Environment Variables

**CREATE: `BACKEND/.env`**
```bash
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/persian_tts
JWT_SECRET=your-super-secret-jwt-key-change-in-production-please-use-a-long-random-string-min-32-chars
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

**CREATE: `client/.env`**
```bash
VITE_API_BASE_URL=http://localhost:3001
```

**CREATE: `.env.example` files for both**

---

### Issue 8.2: Update Deprecated Packages

**Run these commands:**
```bash
# Backend
cd BACKEND
npm uninstall multer@1.4.5-lts.2
npm install multer@latest
npm uninstall inflight glob@7
npm audit fix --force
npm update

# Frontend
cd ../client
npm audit fix --force
npm update
```

**Verify no vulnerabilities:**
```bash
npm audit
```

---

### Issue 8.3: Build Scripts Verification

**Root `package.json` must have:**
```json
{
  "name": "llm-monitoring-app",
  "version": "2.0.0",
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd BACKEND && npm run dev",
    "dev:frontend": "cd client && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "cd BACKEND && npm run build",
    "build:frontend": "cd client && npm run build",
    "test": "cd BACKEND && npm test",
    "lint": "npm run lint:backend && npm run lint:frontend",
    "lint:backend": "cd BACKEND && npm run lint",
    "lint:frontend": "cd client && npm run lint"
  }
}
```

**TEST:**
```bash
npm run build  # MUST succeed with 0 errors
```

---

## 📝 EXECUTION PROTOCOL

### STEP 1: ANALYSIS & VERIFICATION (Required)

**Run these commands and report EXACT results:**

```bash
# Backend TypeScript check
cd BACKEND
npm run lint

# Frontend TypeScript check
cd ../client
npm run lint

# Database check
psql $DATABASE_URL -c "\dt"

# API health check
curl http://localhost:3001/health

# Frontend build check
cd client
npm run build
```

**Report format:**
```
✅ Backend TypeScript: 0 errors
❌ Frontend TypeScript: 135 errors
   [List all errors here]
✅ Database: 7 tables found
❌ API: Connection refused (start server first)
✅ Frontend build: Success
```

---

### STEP 2-10: Fix Each Priority Systematically

**For EACH fix, report:**
```
## Fix #N: [Issue Title]

**File:** `exact/path/to/file.ts`
**Lines:** 23-45

**Problem:**
[What was broken]

**Before:**
```typescript
[Exact broken code]
```

**After:**
```typescript
[Exact fixed code]
```

**Verification:**
- [x] TypeScript compiles
- [x] Manual test passed
- [x] No console errors

**Result:** ✅ WORKING
```

---

### STEP 10: FINAL VERIFICATION

**Run ALL these:**
```bash
# Backend
cd BACKEND
npm run lint        # MUST: 0 errors
npm run build       # MUST: Success
npm test            # MUST: All pass

# Frontend
cd ../client
npm run lint        # MUST: 0 errors
npm run build       # MUST: Success

# Full app
cd ..
npm run dev         # MUST: Both servers start

# Database
./BACKEND/scripts/init-database.sh  # MUST: 7 tables verified
```

**Test ALL user journeys:**
1. ✅ Login works
2. ✅ Download model shows progress
3. ✅ Start training shows live updates
4. ✅ View metrics shows real data
5. ✅ Notifications display correctly

---

## 🎯 SUCCESS CRITERIA

**The project is COMPLETE when ALL are TRUE:**

- [ ] TypeScript: **0 errors** (backend + frontend)
- [ ] Build: **Succeeds** without warnings
- [ ] All 25 API endpoints: **Return correct responses**
- [ ] All 12 routes: **Navigate correctly**
- [ ] All features: **Fully functional** (no placeholders)
- [ ] Database: **All 7 tables exist**
- [ ] WebSocket: **Real-time updates working**
- [ ] UI: **All components render**
- [ ] Forms: **Validation working**
- [ ] Auth: **Login/logout working**
- [ ] Training: **Can start and see progress**
- [ ] Downloads: **Can download with progress**
- [ ] Monitoring: **Shows real metrics**
- [ ] Notifications: **Displays events**

---

## ⚠️ CRITICAL RULES

1. **NO SHORTCUTS** - Every fix must be complete
2. **NO ASSUMPTIONS** - Verify everything
3. **NO PLACEHOLDERS** - Only production code
4. **NO EXAGGERATION** - Report only actual fixes
5. **SHOW YOUR WORK** - Provide paths, lines, code
6. **TEST EVERYTHING** - Verify each fix works
7. **BE SPECIFIC** - Exact details, not vague

---

## 🚀 START NOW

**BEGIN with STEP 1: ANALYSIS**

Run the verification commands and report results.

Then proceed through STEPS 2-10 systematically.

**DO NOT SKIP ANY STEP. DO NOT USE PLACEHOLDERS. MAKE IT WORK.**

**GO! 🔥**
