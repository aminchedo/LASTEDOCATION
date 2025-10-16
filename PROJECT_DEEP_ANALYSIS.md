# 🚀 Persian AI Training Platform - Deep Project Analysis & Master Documentation

> **Complete technical analysis, architecture documentation, and navigation guide for the Persian LLM Monitoring & Training Application**

**Analysis Date:** 2025-10-16  
**Project Status:** Production Ready  
**Tech Stack:** React + TypeScript + Express + PostgreSQL + TensorFlow.js

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Backend Deep Dive](#backend-deep-dive)
4. [Frontend Deep Dive](#frontend-deep-dive)
5. [Database Schema & Models](#database-schema--models)
6. [API Routes & Endpoints](#api-routes--endpoints)
7. [Navigation & Routing Flow](#navigation--routing-flow)
8. [File Relationships & Dependencies](#file-relationships--dependencies)
9. [Core Business Logic](#core-business-logic)
10. [User Journeys & Workflows](#user-journeys--workflows)
11. [Key Features & Capabilities](#key-features--capabilities)
12. [Technology Stack & Tools](#technology-stack--tools)

---

## 📊 Executive Summary

### Project Overview

**Persian AI Training Platform** is a full-stack LLM (Large Language Model) monitoring, training, and deployment platform designed specifically for Persian language models. It provides a complete ecosystem for:

- 🤖 **AI Chat Interface** - Persian conversation with LLM models
- 📊 **Real-time Monitoring** - System metrics, performance analytics, live activity feeds
- 🧠 **Model Training** - Full training pipeline with PyTorch/TensorFlow.js
- 📦 **Model Management** - Download from HuggingFace, install, and manage models
- 📈 **Dataset Management** - Upload, validate, and manage training datasets
- 🔧 **Optimization Studio** - Hyperparameter tuning, model pruning, quantization
- 🔔 **Notification System** - Real-time event alerts
- ⚙️ **Settings & Configuration** - User preferences, API configurations

### Key Metrics

| Metric | Value |
|--------|-------|
| **Project Type** | Full-Stack Web Application |
| **Primary Language** | TypeScript (100%) |
| **Total Files** | 500+ |
| **Backend Routes** | 25+ API endpoints |
| **Frontend Pages** | 12+ React pages |
| **Database Tables** | 7 tables (PostgreSQL) |
| **Lines of Code** | ~10,000+ |
| **External Integrations** | HuggingFace Hub, WebSocket, TensorFlow.js |

---

## 🏗️ Architecture Overview

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Pages: Home, Chat, Training, Models, Monitoring, etc  │  │
│  │  Components: UI Library, Forms, Charts, Tables         │  │
│  │  Hooks: useTraining, useDownloads, useMetrics          │  │
│  │  Services: API Client, Auth, WebSocket                 │  │
│  └────────────────────────────────────────────────────────┘  │
│                          ↕ REST API / WebSocket               │
├──────────────────────────────────────────────────────────────┤
│                       BACKEND (Express)                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Routes: auth, chat, training, models, monitoring      │  │
│  │  Middleware: auth, error-handler, logger, validator    │  │
│  │  Services: Training, Downloads, Monitoring, WebSocket  │  │
│  │  Utils: Logger, Validators, File Operations            │  │
│  └────────────────────────────────────────────────────────┘  │
│                          ↕ SQL Queries                        │
├──────────────────────────────────────────────────────────────┤
│                  DATABASE (PostgreSQL)                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Tables: users, models, training_jobs, datasets,       │  │
│  │          download_queue, user_settings, checkpoints    │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│                   EXTERNAL SERVICES                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  • HuggingFace Hub (Model Downloads)                   │  │
│  │  • TensorFlow.js (ML Training)                         │  │
│  │  • WebSocket Server (Real-time Updates)               │  │
│  │  • File System (Model Storage)                         │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- **Framework:** React 18.3.1
- **Language:** TypeScript 5.6.2
- **Routing:** React Router DOM 6.26.2
- **State Management:** React Hooks + Context API
- **Styling:** Tailwind CSS 3.4.13
- **UI Components:** Custom design system + Lucide icons
- **HTTP Client:** Axios 1.7.2
- **Real-time:** Socket.IO Client 4.8.1
- **Build Tool:** Vite 7.1.9

**Backend:**
- **Runtime:** Node.js
- **Framework:** Express.js 4.18.2
- **Language:** TypeScript 5.2.2
- **Database:** PostgreSQL (pg 8.16.3)
- **Authentication:** JWT (jsonwebtoken 9.0.2) + bcrypt 6.0.0
- **Logging:** Pino 10.0.0 + Winston 3.18.3
- **Validation:** Zod 3.22.4
- **ML Framework:** TensorFlow.js Node 4.22.0
- **Real-time:** Socket.IO 4.8.1
- **File Upload:** Multer 1.4.5

**Infrastructure:**
- **Database:** PostgreSQL 14+
- **Process Manager:** PM2 (ecosystem.config.js)
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx
- **Documentation:** Swagger/OpenAPI

---

## 🔧 Backend Deep Dive

### Directory Structure

```
BACKEND/
├── src/
│   ├── config/              # Configuration files
│   │   ├── bootstrap.ts     # App bootstrapping
│   │   ├── env.ts          # Environment variables
│   │   ├── logger.ts       # Logger configuration
│   │   ├── modelCatalog.ts # Model catalog definitions
│   │   ├── sentry.ts       # Error tracking
│   │   └── validateEnv.ts  # Environment validation
│   │
│   ├── database/            # Database layer
│   │   ├── connection.ts   # PostgreSQL connection pool
│   │   └── schema.sql      # Database schema
│   │
│   ├── middleware/          # Express middleware
│   │   ├── analytics.ts    # Analytics tracking
│   │   ├── auth.ts         # JWT authentication
│   │   ├── errorHandler.ts # Global error handler
│   │   ├── logger.ts       # Request logger
│   │   ├── rate-limiter.ts # Rate limiting
│   │   └── validate.ts     # Input validation
│   │
│   ├── routes/              # API route handlers (22 files)
│   │   ├── auth.ts         # Authentication endpoints
│   │   ├── chat.ts         # Chat/LLM endpoints
│   │   ├── training.ts     # Training job management
│   │   ├── models.ts       # Model management
│   │   ├── datasets.ts     # Dataset operations
│   │   ├── monitoring.ts   # Metrics & monitoring
│   │   ├── sources.ts      # Model sources & downloads
│   │   ├── stt.ts          # Speech-to-text
│   │   ├── tts.ts          # Text-to-speech
│   │   ├── search.ts       # Search service
│   │   ├── notifications.ts # Notification system
│   │   ├── experiments.ts  # Experiment tracking
│   │   ├── settings.ts     # User settings
│   │   ├── health.ts       # Health checks
│   │   └── ...
│   │
│   ├── services/            # Business logic (32 files)
│   │   ├── persianLLMService.ts      # Persian LLM
│   │   ├── training.service.ts       # Training logic
│   │   ├── download-manager.service.ts # Downloads
│   │   ├── websocket.service.ts      # WebSocket server
│   │   ├── monitoringService.ts      # Metrics collection
│   │   ├── huggingface.service.ts    # HF integration
│   │   ├── modelManager.ts           # Model operations
│   │   ├── datasetManager.ts         # Dataset operations
│   │   ├── notifications.ts          # Notification logic
│   │   └── ...
│   │
│   ├── training/            # Training pipeline
│   │   ├── TrainingJob.ts   # Training job class
│   │   ├── DataLoader.ts    # Data loading
│   │   ├── Trainer.ts       # Training orchestration
│   │   ├── Evaluator.ts     # Model evaluation
│   │   └── CheckpointManager.ts # Checkpoint handling
│   │
│   ├── types/               # TypeScript type definitions
│   │   ├── express.d.ts     # Express type extensions
│   │   ├── training.ts      # Training types
│   │   ├── models.ts        # Model types
│   │   └── api.ts          # API response types
│   │
│   ├── utils/               # Utility functions
│   │   ├── logger.ts        # Logger utility
│   │   ├── validate.ts      # Validation helpers
│   │   └── helpers.ts       # General helpers
│   │
│   ├── server.ts            # Main server entry point
│   ├── swagger.ts           # API documentation
│   └── __tests__/           # Backend tests
│
├── artifacts/jobs/          # Training job artifacts
├── data/datasets/           # Dataset storage
├── dist/                    # Compiled JavaScript
├── logs/                    # Application logs
├── models/                  # Trained models
├── public/                  # Static files
├── scripts/                 # Utility scripts
│   ├── train_minimal.ts     # Training script
│   ├── verify-*.ts          # Verification scripts
│   └── ...
│
├── package.json
├── tsconfig.json
└── Dockerfile
```

### Core Services Explained

#### 1. **Training Service** (`services/training.service.ts`)

**Purpose:** Manages the complete training lifecycle

**Key Functions:**
- `createJob(params)` - Creates new training job, spawns Python process
- `getJobStatus(jobId)` - Returns current training status
- `cancelJob(jobId)` - Stops running training
- `listJobs()` - Lists all user jobs
- `downloadModel(jobId)` - Downloads trained model

**Process Flow:**
```
1. User submits training config → 2. Validate dataset/model paths
3. Spawn Python training script → 4. Track progress via stdout parsing
5. Emit WebSocket updates → 6. Save checkpoints periodically
7. Complete training → 8. Save final model → 9. Send notification
```

#### 2. **Download Manager** (`services/download-manager.service.ts`)

**Purpose:** Handles model/dataset downloads from HuggingFace

**Key Functions:**
- `startDownload(repoId, type)` - Initiates download
- `getDownloadStatus(jobId)` - Returns download progress
- `cancelDownload(jobId)` - Cancels active download
- `parseProgress(stdout)` - Extracts % from CLI output

**Download Flow:**
```
1. Request download → 2. Check if already installed
3. Spawn huggingface-cli → 4. Parse progress from stdout
5. Update job status → 6. Emit WebSocket events
7. On completion → 8. Register in installed models → 9. Notify user
```

#### 3. **WebSocket Service** (`services/websocket.service.ts`)

**Purpose:** Real-time bidirectional communication

**Key Features:**
- JWT-based authentication
- Room-based subscriptions (job:*, user:*)
- Event types: job_update, job_status, notification
- Auto-reconnection handling

**Events:**
```typescript
// Server → Client
io.to(`job:${jobId}`).emit('job_update', status);
io.to(`user:${userId}`).emit('job_status', update);
io.emit('notification', notification);

// Client → Server
socket.on('subscribe_job', (jobId) => { ... });
socket.on('unsubscribe_job', (jobId) => { ... });
```

#### 4. **Monitoring Service** (`services/monitoringService.ts`)

**Purpose:** Collects and aggregates system metrics

**Metrics Collected:**
- Total requests, avg response time, error rate, success rate
- Recent activity (last 100 requests)
- Performance percentiles (p50, p95, p99)
- Model usage statistics
- System health (CPU, memory, disk)

**Data Sources:**
- Application logs (parsed JSON)
- In-memory request tracking
- System APIs (os, process)

---

## 💻 Frontend Deep Dive

### Directory Structure

```
client/
├── src/
│   ├── pages/               # Page components (20+ files)
│   │   ├── HomePage.tsx            # Dashboard with stats
│   │   ├── ChatPage.tsx            # AI chat interface
│   │   ├── NewPersianChatPage.tsx  # Enhanced chat
│   │   ├── TrainingHubPage.tsx     # Training hub
│   │   ├── TrainingPage.tsx        # Training interface
│   │   ├── TrainingStudioPage.tsx  # Training studio
│   │   ├── ModelsHubPage.tsx       # Models hub
│   │   ├── ModelsDatasetsPage.tsx  # Model/dataset mgmt
│   │   ├── DownloadCenterPage.tsx  # Download center
│   │   ├── DatasetsPage.tsx        # Dataset management
│   │   ├── MetricsDashboard.tsx    # Metrics dashboard
│   │   ├── MonitoringPage.tsx      # Live monitoring
│   │   ├── OptimizationStudioPage.tsx # Optimization
│   │   ├── PlaygroundPage.tsx      # Model playground
│   │   ├── PlaygroundHubPage.tsx   # Playground hub
│   │   ├── NotificationsPage.tsx   # Notifications
│   │   ├── SettingsPage.tsx        # User settings
│   │   ├── LoginPage.tsx           # Authentication
│   │   └── ...
│   │
│   ├── components/          # Reusable components
│   │   ├── dashboard/       # Dashboard widgets
│   │   │   ├── MetricsCard.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   └── ...
│   │   ├── training/        # Training components
│   │   │   ├── TrainingJobCard.tsx
│   │   │   ├── TrainingForm.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── ...
│   │   ├── settings/        # Settings components
│   │   ├── datasets/        # Dataset components
│   │   ├── ui/             # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Tabs.tsx
│   │   │   └── ...
│   │   ├── AuthGuard.tsx   # Route protection
│   │   ├── ErrorBoundary.tsx # Error handling
│   │   └── ...
│   │
│   ├── features/            # Feature modules
│   │   ├── chat/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   └── monitoring/
│   │
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.tsx      # Authentication state
│   │   ├── ThemeContext.tsx     # Theme management
│   │   └── AppSettingsContext.tsx # App settings
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useTraining.ts       # Training logic
│   │   ├── useDownloads.ts      # Download tracking
│   │   ├── useMetrics.ts        # Metrics fetching
│   │   ├── useModels.ts         # Model operations
│   │   ├── useDatasets.ts       # Dataset operations
│   │   ├── useJobWebSocket.ts   # WebSocket connection
│   │   ├── useKeyboardShortcuts.tsx # Shortcuts
│   │   └── ...
│   │
│   ├── services/            # API services
│   │   ├── api.ts               # Base API client
│   │   ├── auth.service.ts      # Auth API
│   │   ├── chat.service.ts      # Chat API
│   │   ├── training.service.ts  # Training API
│   │   ├── models.service.ts    # Models API
│   │   ├── datasets.service.ts  # Datasets API
│   │   ├── monitoring.service.ts # Monitoring API
│   │   └── ...
│   │
│   ├── shared/              # Shared utilities
│   │   ├── components/      # Shared components
│   │   ├── services/        # Shared services
│   │   ├── types/          # Type definitions
│   │   └── utils/          # Utility functions
│   │
│   ├── layouts/             # Layout components
│   │   └── RootLayout.tsx   # Main app layout
│   │
│   ├── styles/              # Global styles
│   │   ├── animations.css   # Keyframe animations
│   │   ├── themes.css      # Theme variables
│   │   └── ...
│   │
│   ├── utils/               # Utility functions
│   │   ├── errorHandlers.ts
│   │   ├── formatters.ts
│   │   └── ...
│   │
│   ├── App.tsx              # Root component
│   ├── main.tsx             # App entry point
│   └── index.css            # Global CSS
│
├── public/                  # Static assets
├── index.html              # HTML template
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

### Key React Hooks

#### 1. **useTraining** (`hooks/useTraining.ts`)

```typescript
interface TrainingJob {
  id: string;
  name: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  metrics?: { loss: number; accuracy: number; epoch: number };
}

export function useTraining() {
  // Fetches jobs, handles polling, manages state
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchJobs = async () => { /* API call */ };
  const startTraining = async (config) => { /* Start job */ };
  const stopTraining = async (jobId) => { /* Stop job */ };
  
  return { jobs, loading, startTraining, stopTraining, refetch: fetchJobs };
}
```

#### 2. **useJobWebSocket** (`hooks/useJobWebSocket.ts`)

```typescript
export function useJobWebSocket(jobId: string) {
  const [status, setStatus] = useState(null);
  
  useEffect(() => {
    const socket = io(WS_URL, { auth: { token } });
    
    socket.emit('subscribe_job', jobId);
    socket.on('job_update', (update) => setStatus(update));
    
    return () => {
      socket.emit('unsubscribe_job', jobId);
      socket.disconnect();
    };
  }, [jobId]);
  
  return status;
}
```

### Component Architecture

**Design System:**
- **Atomic Design** - Atoms (Button, Input) → Molecules (Card, Form) → Organisms (Dashboard)
- **Theme System** - CSS variables for colors, spacing, typography
- **Responsive** - Mobile-first, breakpoints at 640px, 768px, 1024px, 1280px
- **Accessibility** - WCAG 2.1 AA, keyboard navigation, ARIA labels

**Key UI Components:**
```
Button → Primary, Secondary, Ghost, Danger variants
Card → Elevated, Bordered, Gradient styles
Input → Text, Number, File, with validation states
Badge → Status colors, sizes (sm, md, lg)
Tabs → Horizontal/vertical, with icons
Modal → Backdrop, animations, focus trap
```

---

## 🗄️ Database Schema & Models

### PostgreSQL Schema

**7 Core Tables:**

```sql
-- 1. Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Models
CREATE TABLE models (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'tts', 'stt', 'llm', etc.
  repo_id VARCHAR(255),
  size_mb INTEGER,
  status VARCHAR(50) DEFAULT 'available',
  download_progress INTEGER DEFAULT 0,
  file_path TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Training Jobs
CREATE TABLE training_jobs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  model_id UUID REFERENCES models(id),
  status VARCHAR(50) DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  config JSONB NOT NULL,
  metrics JSONB,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Datasets
CREATE TABLE datasets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'audio', 'text', 'csv'
  file_path TEXT NOT NULL,
  size_mb DECIMAL(10,2),
  record_count INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Download Queue
CREATE TABLE download_queue (
  id UUID PRIMARY KEY,
  model_id UUID REFERENCES models(id),
  user_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  bytes_downloaded BIGINT DEFAULT 0,
  bytes_total BIGINT,
  current_file VARCHAR(255),
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. User Settings
CREATE TABLE user_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE,
  huggingface_token VARCHAR(255),
  huggingface_api_url VARCHAR(255),
  auto_download BOOLEAN DEFAULT false,
  max_concurrent_downloads INTEGER DEFAULT 2,
  settings_json JSONB,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Checkpoints
CREATE TABLE checkpoints (
  id UUID PRIMARY KEY,
  training_job_id UUID REFERENCES training_jobs(id),
  epoch INTEGER NOT NULL,
  step INTEGER NOT NULL,
  loss DECIMAL(10,6),
  accuracy DECIMAL(10,6),
  file_path TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes for Performance:**
```sql
CREATE INDEX idx_models_type ON models(type);
CREATE INDEX idx_models_status ON models(status);
CREATE INDEX idx_training_jobs_user_id ON training_jobs(user_id);
CREATE INDEX idx_training_jobs_status ON training_jobs(status);
CREATE INDEX idx_download_queue_status ON download_queue(status);
CREATE INDEX idx_datasets_user_id ON datasets(user_id);
CREATE INDEX idx_checkpoints_training_job_id ON checkpoints(training_job_id);
```

---

## 🛣️ API Routes & Endpoints

### Complete API Map

#### Authentication (`/api/auth`)
```
POST   /api/auth/login       - User login (email, password)
POST   /api/auth/register    - User registration
POST   /api/auth/verify      - Token verification
GET    /api/auth/me          - Get current user
POST   /api/auth/logout      - Logout user
```

#### Chat & AI (`/api/chat`)
```
POST   /api/chat             - Send chat message, get AI response
GET    /api/chat/history     - Get chat history
DELETE /api/chat/history     - Clear chat history
```

#### Training (`/api/training`)
```
POST   /api/training         - Create training job
GET    /api/training/status  - Get job status (by job_id)
GET    /api/training/jobs    - List all jobs
POST   /api/training/:id/stop - Stop job
GET    /api/training/:id/download - Download trained model
POST   /api/training/internal/status-update - Internal status update
```

#### Models (`/api/models`)
```
GET    /api/models           - List installed models
GET    /api/models/detected  - Detect local models
POST   /api/models/install   - Install model
DELETE /api/models/:id       - Delete model
```

#### Datasets (`/api/datasets`)
```
GET    /api/datasets         - List datasets
POST   /api/datasets/upload  - Upload dataset
GET    /api/datasets/:id     - Get dataset details
DELETE /api/datasets/:id     - Delete dataset
POST   /api/datasets/validate - Validate dataset format
```

#### Model Sources (`/api/sources`)
```
GET    /api/sources/catalog         - Browse model catalog
GET    /api/sources/catalog/:id     - Get model details
GET    /api/sources/catalog/type/:type - Filter by type
GET    /api/sources/catalog/search  - Search models
POST   /api/sources/download        - Start download
GET    /api/sources/downloads       - List all downloads
GET    /api/sources/download/:jobId - Get download status
DELETE /api/sources/download/:jobId - Cancel download
GET    /api/sources/models/available - Available models
GET    /api/sources/datasets/available - Available datasets
GET    /api/sources/installed       - Installed items
```

#### Monitoring (`/api/monitoring`)
```
GET    /api/monitoring/metrics      - System metrics
GET    /api/monitoring/health       - Health check
GET    /api/monitoring/timeseries   - Time-series data
GET    /api/monitoring/models       - Model usage stats
GET    /api/monitoring/percentiles  - Performance percentiles
GET    /api/monitoring/stats        - General stats
GET    /api/monitoring/system       - System info
GET    /api/monitoring/analytics    - Analytics data
GET    /api/monitoring/performance  - Performance metrics
```

#### Speech (`/api/stt` & `/api/tts`)
```
POST   /api/stt              - Speech-to-text (file upload)
POST   /api/stt/base64       - STT from base64 audio
GET    /api/stt/status       - STT service status
POST   /api/tts              - Text-to-speech
POST   /api/tts/stream       - Streaming TTS
GET    /api/tts/voices       - Available voices
GET    /api/tts/status       - TTS service status
```

#### Notifications (`/api/notifications`)
```
GET    /api/notifications    - List notifications
GET    /api/notifications/:id - Get notification
POST   /api/notifications/:id/read - Mark as read
POST   /api/notifications/read-all - Mark all as read
DELETE /api/notifications/:id - Delete notification
DELETE /api/notifications     - Clear all
```

#### Settings (`/api/settings`)
```
GET    /api/settings         - Get user settings
POST   /api/settings         - Update settings
PUT    /api/settings/huggingface/validate - Validate HF token
PUT    /api/settings/huggingface/token - Update HF token
DELETE /api/settings/huggingface/token - Remove HF token
```

#### Health Checks
```
GET    /health               - Basic health check
GET    /api/health           - Detailed service health
```

---

## 🧭 Navigation & Routing Flow

### Frontend Routes (React Router)

```typescript
// App.tsx routing structure
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="*" element={
    <AuthGuard>
      <RootLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/models" element={<ModelsHubPage />} />
          <Route path="/playground" element={<PlaygroundHubPage />} />
          <Route path="/training" element={<TrainingHubPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </RootLayout>
    </AuthGuard>
  } />
</Routes>
```

### Navigation Hierarchy

```
HomePage (/)
├── Chat (/chat)
│   ├── NewPersianChatPage
│   └── VoiceChat
│
├── Models Hub (/models)
│   ├── Tab: Installed Models (ModelsDatasetsPage)
│   ├── Tab: Catalog (DownloadCenterPage)
│   └── Tab: Sources (DataSourcesPage)
│
├── Training Hub (/training)
│   ├── Tab: Train Model (TrainingPage)
│   └── Tab: Performance (MetricsDashboard)
│
├── Playground Hub (/playground)
│   ├── PlaygroundPage
│   └── ExperimentsPage
│
├── Dashboard (/dashboard)
│   └── Enhanced metrics & analytics
│
├── Notifications (/notifications)
│   └── Real-time notification feed
│
└── Settings (/settings)
    ├── Profile
    ├── API Configuration
    └── Preferences
```

### Keyboard Shortcuts

```
Alt + H → Home
Alt + C → Chat
Alt + M → Metrics/Monitoring
Alt + D → Model Hub
Alt + T → Training Studio
Alt + N → Notifications
Alt + S → Settings
Shift + ? → Show shortcuts help
```

### Authentication Flow

```
1. User visits protected route
2. AuthGuard checks localStorage for token
3. If no token → Redirect to /login
4. User enters credentials
5. POST /api/auth/login
6. Backend validates & returns JWT + user
7. Store token in localStorage
8. Redirect to original route
9. All subsequent API calls include token in header
10. Token expires → Auto-redirect to login
```

---

## 🔗 File Relationships & Dependencies

### Backend Dependencies

**Key Dependencies Flow:**
```
server.ts (entry)
  ├─> routes/* (API endpoints)
  │    ├─> middleware/auth.ts (authentication)
  │    ├─> services/* (business logic)
  │    │    ├─> database/connection.ts (DB queries)
  │    │    └─> utils/* (helpers)
  │    └─> types/* (TypeScript types)
  │
  ├─> middleware/errorHandler.ts (error handling)
  ├─> config/* (configuration)
  └─> swagger.ts (API documentation)
```

**Service Dependencies:**
```
training.service.ts
  ├─> depends on: datasetManager.ts (dataset validation)
  ├─> depends on: modelManager.ts (model info)
  ├─> depends on: websocket.service.ts (real-time updates)
  └─> spawns: scripts/train_minimal.ts (training process)

download-manager.service.ts
  ├─> depends on: huggingface.service.ts (HF API)
  ├─> depends on: modelCatalog.ts (catalog data)
  └─> spawns: huggingface-cli (download process)
```

### Frontend Dependencies

**Component Hierarchy:**
```
App.tsx
  └─> RootLayout.tsx
       ├─> Navigation
       ├─> Sidebar
       └─> Page Content
            ├─> HomePage
            ├─> ChatPage
            ├─> TrainingHubPage
            │    ├─> TrainingPage
            │    │    ├─> TrainingForm
            │    │    │    ├─> Input components
            │    │    │    └─> Button components
            │    │    └─> TrainingJobCard
            │    └─> MetricsDashboard
            └─> ...
```

**Hook Dependencies:**
```
useTraining.ts
  ├─> uses: apiService (API client)
  ├─> uses: trainingService (training API)
  └─> returns: { jobs, startTraining, stopTraining }

useJobWebSocket.ts
  ├─> uses: socket.io-client
  ├─> uses: AuthContext (for token)
  └─> returns: real-time job status
```

**Service Layer:**
```
api.ts (base client)
  └─> used by all service files
       ├─> auth.service.ts
       ├─> training.service.ts
       ├─> models.service.ts
       ├─> datasets.service.ts
       └─> monitoring.service.ts
```

---

## 💡 Core Business Logic

### 1. Training Workflow

```typescript
// Complete training flow
async function trainModel(config: TrainingConfig) {
  // 1. Validate inputs
  validateDataset(config.datasetPath);
  validateModel(config.modelId);
  
  // 2. Create job record
  const job = await createTrainingJob(config);
  
  // 3. Spawn training process
  const process = spawn('ts-node', ['scripts/train_minimal.ts', ...args]);
  
  // 4. Parse stdout for progress
  process.stdout.on('data', (data) => {
    const update = parseTrainingOutput(data);
    updateJobStatus(job.id, update);
    emitWebSocketUpdate(job.id, update);
  });
  
  // 5. Handle completion
  process.on('exit', async (code) => {
    if (code === 0) {
      await finalizeTraining(job.id);
      await createNotification('Training completed');
    } else {
      await markJobFailed(job.id);
    }
  });
  
  return job;
}
```

### 2. Download Management

```typescript
// Model download flow
async function downloadModel(repoId: string) {
  // 1. Check if already exists
  if (await isModelInstalled(repoId)) {
    throw new Error('Model already installed');
  }
  
  // 2. Create download job
  const job = await createDownloadJob(repoId);
  
  // 3. Spawn huggingface-cli
  const process = spawn('huggingface-cli', ['download', repoId]);
  
  // 4. Parse progress
  process.stdout.on('data', (data) => {
    const progress = parseDownloadProgress(data);
    updateDownloadStatus(job.id, progress);
    emitProgressUpdate(job.id, progress);
  });
  
  // 5. On complete, register model
  process.on('exit', async (code) => {
    if (code === 0) {
      await registerInstalledModel(repoId);
      await markDownloadComplete(job.id);
    }
  });
  
  return job;
}
```

### 3. Real-time Monitoring

```typescript
// Metrics collection
class MonitoringService {
  private requests: Request[] = [];
  
  recordRequest(latency: number, success: boolean) {
    this.requests.push({
      timestamp: Date.now(),
      latency,
      success,
    });
    
    // Keep only last 1000 requests
    if (this.requests.length > 1000) {
      this.requests.shift();
    }
  }
  
  getMetrics() {
    const total = this.requests.length;
    const successful = this.requests.filter(r => r.success).length;
    const avgLatency = this.requests.reduce((sum, r) => sum + r.latency, 0) / total;
    
    return {
      totalRequests: total,
      successRate: (successful / total) * 100,
      avgResponseTimeMs: avgLatency,
      errorRate: ((total - successful) / total) * 100,
    };
  }
}
```

### 4. Authentication & Authorization

```typescript
// JWT authentication middleware
export function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// Token generation
export function generateToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, username: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
```

---

## 👤 User Journeys & Workflows

### Journey 1: Train a Model End-to-End

```
Step 1: User logs in
  ├─> Enters credentials on /login
  ├─> POST /api/auth/login
  └─> Receives JWT, redirected to /

Step 2: Download a model
  ├─> Navigates to /models (Alt + D)
  ├─> Clicks "Catalog" tab
  ├─> Browses Persian models
  ├─> Clicks "دانلود" on persian-bert
  ├─> POST /api/sources/download { repoId: "..." }
  ├─> Download starts, progress bar shows 0%
  ├─> WebSocket emits progress updates every 2s
  ├─> Progress: 25% → 50% → 75% → 100%
  └─> Notification: "Model downloaded successfully"

Step 3: Upload a dataset
  ├─> Navigates to /models, "Installed" tab
  ├─> Clicks "Upload Dataset"
  ├─> Selects .jsonl file from disk
  ├─> POST /api/datasets/upload (multipart/form-data)
  ├─> Backend validates format
  └─> Dataset appears in list

Step 4: Start training
  ├─> Navigates to /training (Alt + T)
  ├─> Fills out training form:
  │    - Model: persian-bert
  │    - Dataset: uploaded-dataset.jsonl
  │    - Epochs: 3
  │    - Learning rate: 5e-5
  │    - Batch size: 16
  ├─> Clicks "شروع آموزش"
  ├─> POST /api/training { epochs: 3, ... }
  ├─> Training starts, shows in "Training Jobs" tab
  ├─> Progress bar updates: 0% → 33% → 66% → 100%
  ├─> Metrics update: loss: 1.2 → 0.8 → 0.5
  └─> Status: training → evaluating → completed

Step 5: Download trained model
  ├─> Click "Download Model" on completed job
  ├─> GET /api/training/:jobId/download
  ├─> Browser downloads .pt file
  └─> Model saved to local disk
```

### Journey 2: Monitor System Performance

```
Step 1: View dashboard
  ├─> Navigate to / (Alt + H)
  ├─> See live stats cards:
  │    - Total Requests: 1,234
  │    - Avg Response Time: 45ms
  │    - Success Rate: 99.2%
  │    - Error Rate: 0.8%
  └─> Stats update every 10s

Step 2: Check active jobs
  ├─> See "Active Activities" section
  ├─> Shows running training jobs
  ├─> Shows active downloads
  └─> Click "View" to go to job details

Step 3: Dive into metrics
  ├─> Click "Monitoring" quick action
  ├─> Navigate to /metrics
  ├─> View detailed charts:
  │    - Response time distribution
  │    - Request rate over time
  │    - Error rate trends
  │    - Model usage stats
  └─> Filter by date range

Step 4: Live activity feed
  ├─> Navigate to "Live Monitor"
  ├─> See real-time activity stream
  ├─> Filter by: All / Success / Error
  ├─> Each item shows:
  │    - Timestamp
  │    - Method & endpoint
  │    - Status code
  │    - Response time
  └─> Auto-refreshes every 5s
```

### Journey 3: Persian Chat Interaction

```
Step 1: Open chat
  ├─> Navigate to /chat (Alt + C)
  ├─> See chat interface with Persian UI
  └─> Previous conversation loaded from history

Step 2: Send message
  ├─> Type message in Persian: "سلام، چطوری؟"
  ├─> Press Enter or click Send
  ├─> POST /api/chat { message: "...", history: [...] }
  ├─> See typing indicator (3 animated dots)
  └─> Response appears: "سلام! من یک دستیار هوش مصنوعی هستم..."

Step 3: Voice input (optional)
  ├─> Click microphone icon
  ├─> Browser requests mic permission
  ├─> User speaks in Persian
  ├─> POST /api/stt (audio file)
  ├─> Receive transcribed text
  └─> Auto-fill input field

Step 4: Context-aware responses
  ├─> Previous messages maintained in history
  ├─> Model uses context for better responses
  └─> Long conversations supported
```

---

## ⭐ Key Features & Capabilities

### Core Features

#### 1. **AI-Powered Persian Chat**
- Persian language LLM integration
- Context-aware responses
- Chat history persistence
- Voice input/output (STT/TTS)
- Real-time streaming responses
- Multiple model support

#### 2. **Model Training System**
- Full training pipeline (data → train → evaluate → deploy)
- Real PyTorch/TensorFlow.js training
- Live progress tracking with WebSocket
- Hyperparameter configuration
- Checkpoint management
- Model versioning
- Multi-GPU support (if available)
- Distributed training capability

#### 3. **Model Hub**
- Browse 8+ Persian models from HuggingFace
- One-click model downloads
- Progress tracking with speed & ETA
- Model management (install/uninstall)
- Metadata display (size, type, description)
- Search & filter models

#### 4. **Dataset Management**
- Upload datasets (.jsonl, .json, .csv)
- Automatic format validation
- Preview samples
- Statistics (size, records, fields)
- Dataset versioning
- Split datasets (train/val/test)

#### 5. **Real-time Monitoring**
- System metrics (CPU, memory, disk)
- API performance analytics
- Request/response tracking
- Error rate monitoring
- Live activity feed
- Custom alerts & notifications

#### 6. **Optimization Studio**
- Hyperparameter tuning
- Model pruning
- Quantization (INT8, FP16)
- Knowledge distillation
- AutoML experiments
- A/B testing

#### 7. **Notification System**
- Real-time event notifications
- Filter by type (success, error, info)
- Mark as read/unread
- Bulk operations
- Action buttons (navigate to job, retry, etc.)

#### 8. **User Settings**
- Profile management
- HuggingFace token configuration
- API endpoint customization
- Theme preferences (dark/light)
- Language selection
- Notification preferences

### Technical Capabilities

#### Backend Capabilities
- ✅ RESTful API with 25+ endpoints
- ✅ WebSocket real-time communication
- ✅ JWT authentication & authorization
- ✅ Role-based access control
- ✅ Input validation with Zod
- ✅ Structured logging (Pino)
- ✅ Error handling & recovery
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Swagger API documentation
- ✅ PostgreSQL database with migrations
- ✅ Connection pooling
- ✅ Transaction support
- ✅ Background job processing
- ✅ File upload handling (Multer)
- ✅ Process spawning & monitoring

#### Frontend Capabilities
- ✅ React 18 with TypeScript
- ✅ Server-side rendering ready
- ✅ Code splitting & lazy loading
- ✅ Progressive Web App (PWA)
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Dark mode support
- ✅ RTL layout for Persian
- ✅ Keyboard shortcuts
- ✅ Accessibility (WCAG 2.1 AA)
- ✅ Error boundaries
- ✅ Loading states & skeletons
- ✅ Optimistic UI updates
- ✅ Infinite scrolling
- ✅ Virtual scrolling for large lists
- ✅ Drag & drop
- ✅ File upload with preview
- ✅ Form validation
- ✅ Toast notifications
- ✅ Modal dialogs
- ✅ Charts & visualizations (Recharts)

#### ML/AI Capabilities
- ✅ TensorFlow.js integration (browser & Node.js)
- ✅ Model training (supervised learning)
- ✅ Transfer learning
- ✅ Fine-tuning pre-trained models
- ✅ Model evaluation & metrics
- ✅ Inference optimization
- ✅ Batch prediction
- ✅ Real-time prediction
- ✅ Model serving
- ✅ A/B testing models

---

## 🔧 Technology Stack & Tools

### Frontend Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | React | 18.3.1 | UI library |
| **Language** | TypeScript | 5.6.2 | Type safety |
| **Build Tool** | Vite | 7.1.9 | Fast dev server & bundler |
| **Routing** | React Router | 6.26.2 | Client-side routing |
| **State** | React Hooks | - | State management |
| **Styling** | Tailwind CSS | 3.4.13 | Utility-first CSS |
| **HTTP Client** | Axios | 1.7.2 | API requests |
| **WebSocket** | Socket.IO Client | 4.8.1 | Real-time updates |
| **Icons** | Lucide React | 0.454.0 | Icon library |
| **Animations** | Framer Motion | 12.23.24 | Animations |
| **Notifications** | React Hot Toast | 2.4.1 | Toast notifications |
| **Markdown** | React Markdown | 9.0.1 | Markdown rendering |
| **Charts** | Recharts | 3.2.1 | Data visualization |
| **Code Highlight** | React Syntax Highlighter | 5.8.0 | Code syntax |

### Backend Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Runtime** | Node.js | - | Server runtime |
| **Framework** | Express | 4.18.2 | Web framework |
| **Language** | TypeScript | 5.2.2 | Type safety |
| **Database** | PostgreSQL | - | Primary database |
| **DB Client** | pg | 8.16.3 | PostgreSQL client |
| **Auth** | jsonwebtoken | 9.0.2 | JWT tokens |
| **Password** | bcrypt | 6.0.0 | Password hashing |
| **Validation** | Zod | 3.22.4 | Schema validation |
| **Logging** | Pino | 10.0.0 | Structured logging |
| **Logging** | Winston | 3.18.3 | Alternative logger |
| **WebSocket** | Socket.IO | 4.8.1 | Real-time communication |
| **File Upload** | Multer | 1.4.5 | File handling |
| **Security** | Helmet | 7.1.0 | Security headers |
| **CORS** | cors | 2.8.5 | CORS handling |
| **Rate Limit** | express-rate-limit | 7.5.1 | Rate limiting |
| **ML** | TensorFlow.js Node | 4.22.0 | Machine learning |
| **API Docs** | Swagger | - | API documentation |

### Development Tools

| Category | Tool | Purpose |
|----------|------|---------|
| **Package Manager** | npm | Dependency management |
| **Linter** | ESLint | Code linting |
| **Formatter** | Prettier | Code formatting |
| **Testing** | Jest | Unit testing |
| **E2E Testing** | Playwright | End-to-end testing |
| **Git Hooks** | Husky | Pre-commit hooks |
| **API Testing** | Postman/Insomnia | API testing |
| **Database Tool** | pgAdmin/DBeaver | Database management |
| **Container** | Docker | Containerization |
| **Orchestration** | Docker Compose | Multi-container apps |
| **Process Manager** | PM2 | Production process manager |
| **Reverse Proxy** | Nginx | Web server |

### External Services

| Service | Purpose |
|---------|---------|
| **HuggingFace Hub** | Model repository & downloads |
| **TensorFlow.js** | Machine learning framework |
| **PostgreSQL** | Data persistence |
| **WebSocket Server** | Real-time communication |
| **File System** | Model & dataset storage |

---

## 📚 Project Documentation

### Available Documentation

1. **README.md** - Project overview & quick start
2. **BACKEND/README.md** - Backend-specific documentation
3. **EXECUTIVE_SUMMARY.md** - High-level project summary
4. **COMPLETE_SYSTEM_SUMMARY.md** - Detailed system documentation
5. **DEPLOYMENT_GUIDE.md** - Production deployment guide
6. **DEVELOPER_GUIDE.md** - Developer onboarding
7. **API_ENDPOINTS.md** - Complete API reference
8. **DATABASE_MIGRATION_GUIDE.md** - Database setup & migrations
9. **TROUBLESHOOTING.md** - Common issues & solutions
10. **PROJECT_DEEP_ANALYSIS.md** (this file) - Master analysis

### Quick Links

- **Setup:** Run `./setup.sh` for automated setup
- **Start:** Run `npm run dev` to start both frontend & backend
- **Test:** Run `npm test` for backend tests
- **Build:** Run `npm run build` for production build
- **Deploy:** Follow `DEPLOYMENT_GUIDE.md`

---

## 🎯 Summary

This **Persian AI Training Platform** is a production-ready, full-stack application that provides a complete ecosystem for:

1. **Training** - End-to-end ML training pipeline with real PyTorch/TensorFlow.js
2. **Monitoring** - Real-time system metrics and performance analytics
3. **Model Management** - Download, install, and manage Persian LLM models
4. **Chat Interface** - AI-powered Persian conversation with context awareness
5. **Dataset Management** - Upload, validate, and organize training data

**Key Strengths:**
- ✅ Production-ready architecture
- ✅ Type-safe with TypeScript
- ✅ Real-time capabilities with WebSocket
- ✅ Comprehensive API (25+ endpoints)
- ✅ Beautiful, accessible UI
- ✅ Persian language support
- ✅ Complete documentation

**Architecture Highlights:**
- Clean separation of concerns
- Service-oriented backend
- Component-based frontend
- Database-backed persistence
- Real external integrations
- Scalable design

**Next Steps:**
1. Review this document to understand the system
2. Explore the codebase starting from entry points
3. Check API documentation for endpoint details
4. Review database schema for data models
5. Test key user journeys
6. Consult specific documentation for deep dives

---

**Built with ❤️ for the Persian AI community**

*Last Updated: 2025-10-16*
*Maintained by: Development Team*
