# 🤖 Bot Coder Verification & Implementation Prompt

## 🎯 Mission: Persian TTS/AI Platform Complete Implementation Verification

You are tasked with **thoroughly verifying and implementing** all features described in the Persian TTS/AI Platform README.md. This is a **production-ready application** with **ZERO mock data** - everything must be real, functional, and complete.

---

## 🔍 CRITICAL VERIFICATION REQUIREMENTS

### 1. **Database Implementation Verification**
```sql
-- Verify ALL 7 tables exist and are properly structured:
✅ users (UUID, email, username, password_hash, role, timestamps)
✅ models (UUID, name, type, repo_id, size_mb, status, file_path, metadata JSONB)
✅ training_jobs (UUID, user_id FK, model_id FK, status, progress, config JSONB, metrics JSONB)
✅ datasets (UUID, user_id FK, name, type, file_path, size_mb, record_count, metadata JSONB)
✅ download_queue (UUID, model_id FK, user_id FK, status, progress, bytes_downloaded, bytes_total)
✅ user_settings (UUID, user_id FK, huggingface_token, settings_json JSONB)
✅ checkpoints (UUID, training_job_id FK, epoch, step, loss, accuracy, file_path, metadata JSONB)

-- Verify ALL indexes exist:
✅ idx_models_type, idx_models_status, idx_training_jobs_user_id, idx_training_jobs_status
✅ idx_download_queue_status, idx_datasets_user_id, idx_checkpoints_training_job_id

-- Verify triggers for updated_at columns exist and function
```

### 2. **Real HuggingFace Integration Verification**
```typescript
// Verify these REAL API calls work:
✅ Search models: GET https://huggingface.co/api/models?search=persian
✅ Get model info: GET https://huggingface.co/api/models/{repo_id}
✅ Download files: GET https://huggingface.co/{repo_id}/resolve/main/{filename}
✅ Validate token: GET https://huggingface.co/api/whoami (with Authorization header)

// Verify ALL HuggingFace service methods are implemented:
✅ validateToken(token: string)
✅ searchModels(query: string, token?: string)
✅ getModelInfo(repoId: string, token?: string)
✅ downloadModel(repoId: string, destDir: string, token?: string, onProgress?: Function)
✅ listModelFiles(repoId: string, token?: string)
```

### 3. **Real TensorFlow.js Training Verification**
```typescript
// Verify REAL TensorFlow.js implementation:
✅ tf.sequential() model creation
✅ tf.layers.dense(), tf.layers.dropout() layer definitions
✅ model.compile() with real optimizers (adam, sgd, rmsprop)
✅ model.fit() with real training data
✅ model.save() to filesystem
✅ Progress callbacks during training
✅ Checkpoint saving to database

// Verify training service methods:
✅ createTrainingJob(userId, modelId, config)
✅ startTraining(jobId)
✅ pauseTraining(jobId)
✅ cancelTraining(jobId)
✅ getTrainingStatus(jobId)
✅ saveCheckpoint(jobId, epoch, metrics)
```

### 4. **Real WebSocket Implementation Verification**
```typescript
// Verify REAL Socket.IO events:
✅ 'download:progress' - Real download progress updates
✅ 'download:complete' - Download completion events
✅ 'download:error' - Download error handling
✅ 'training:progress' - Real training progress updates
✅ 'training:complete' - Training completion events
✅ 'training:error' - Training error handling

// Verify room-based targeting:
✅ socket.join(`user:${userId}`)
✅ io.to(`user:${userId}`).emit('event', data)
```

### 5. **API Endpoints Implementation Verification**
```bash
# Verify ALL 15+ endpoints are implemented and functional:

# HuggingFace Integration
✅ GET /api/sources/search?q=persian
✅ GET /api/sources/model/:repoId
✅ POST /api/sources/download
✅ GET /api/sources/download/:id
✅ DELETE /api/sources/download/:id
✅ GET /api/sources/installed
✅ POST /api/sources/validate-token

# Training Management
✅ POST /api/training
✅ GET /api/training/:id
✅ GET /api/training
✅ DELETE /api/training/:id

# User Settings
✅ GET /api/settings
✅ POST /api/settings
✅ PUT /api/settings/huggingface/validate
✅ PUT /api/settings/huggingface/token

# Health & System
✅ GET /api/health
✅ GET /api/system/status
```

### 6. **Security Implementation Verification**
```typescript
// Verify ALL security measures are implemented:
✅ JWT token generation and validation
✅ bcrypt password hashing (minimum 10 salt rounds)
✅ CORS configuration with specific origins
✅ Helmet.js security headers
✅ Rate limiting on API endpoints
✅ Input validation with Zod schemas
✅ SQL injection protection (parameterized queries only)
✅ Environment variable validation
✅ Error handling without information leakage
```

### 7. **File System Operations Verification**
```typescript
// Verify REAL file operations:
✅ Model downloads to models/ directory
✅ Dataset uploads to datasets/ directory
✅ Checkpoint saves to checkpoints/ directory
✅ Streaming file downloads for large files
✅ Progress tracking during file operations
✅ Proper file cleanup on errors
✅ Directory structure creation
```

### 8. **Frontend Integration Verification**
```typescript
// Verify React frontend implementation:
✅ TensorFlow.js browser inference
✅ Real-time WebSocket connection
✅ API service integration
✅ Persian UI components
✅ Responsive design
✅ Error handling and user feedback
✅ Progress indicators for long operations
```

---

## 🚨 CRITICAL IMPLEMENTATION RULES

### **ZERO TOLERANCE POLICIES:**
1. **NO MOCK DATA** - Every API call, database query, and file operation must be real
2. **NO PLACEHOLDERS** - No "TODO", "FIXME", or placeholder implementations
3. **NO FAKE RESPONSES** - All data must come from real sources (DB, HF API, filesystem)
4. **NO SIMULATION** - Training, downloads, and processing must be actual operations
5. **ZERO TYPESCRIPT ERRORS** - All code must compile without errors
6. **COMPLETE FUNCTIONALITY** - Every feature mentioned in README must work

### **IMPLEMENTATION STANDARDS:**
- All database operations use connection pooling
- All API calls include proper error handling
- All file operations use streams for efficiency
- All user inputs are validated and sanitized
- All secrets are stored in environment variables
- All operations support cancellation where applicable

---

## 📋 VERIFICATION CHECKLIST

### Database & Schema ✅
- [ ] All 7 tables created with correct structure
- [ ] All foreign key relationships established
- [ ] All indexes created for performance
- [ ] All triggers for timestamps working
- [ ] Connection pooling configured (20 connections)
- [ ] Sample data can be inserted and retrieved

### HuggingFace Integration ✅
- [ ] Real API search returns actual models
- [ ] Model information retrieval works
- [ ] File downloads save to disk
- [ ] Progress tracking during downloads
- [ ] Token validation with HF API
- [ ] Error handling for API failures

### TensorFlow.js Training ✅
- [ ] Real neural networks can be created
- [ ] Training with actual gradient descent
- [ ] Progress callbacks during training
- [ ] Model saving to filesystem
- [ ] Checkpoint creation in database
- [ ] Memory management and cleanup

### WebSocket Real-time ✅
- [ ] Socket.IO server configured
- [ ] Real-time events broadcasting
- [ ] Room-based user targeting
- [ ] Progress updates during operations
- [ ] Error event handling
- [ ] Connection management

### API Endpoints ✅
- [ ] All 15+ endpoints implemented
- [ ] Proper HTTP status codes
- [ ] Request/response validation
- [ ] Error handling and logging
- [ ] Authentication middleware
- [ ] Rate limiting configured

### Security Implementation ✅
- [ ] JWT authentication working
- [ ] Password hashing with bcrypt
- [ ] CORS properly configured
- [ ] Input validation with Zod
- [ ] SQL injection protection
- [ ] Environment secrets secured

### File Operations ✅
- [ ] Real file downloads to disk
- [ ] Streaming for large files
- [ ] Progress tracking
- [ ] Directory management
- [ ] Cleanup on errors
- [ ] Proper permissions

### Frontend Integration ✅
- [ ] React components functional
- [ ] TensorFlow.js browser inference
- [ ] WebSocket real-time updates
- [ ] API service integration
- [ ] Persian language support
- [ ] Responsive UI design

---

## 🎯 SUCCESS CRITERIA

### **MUST PASS ALL THESE TESTS:**
```bash
# 1. TypeScript Compilation
npm run lint  # Backend: 0 errors
npm run lint  # Frontend: 0 errors

# 2. Database Verification
npm run verify:db  # All tables, indexes, triggers working

# 3. API Testing
npm run verify:api  # All endpoints responding correctly

# 4. Build Verification
npm run verify:build  # Both backend and frontend build successfully

# 5. Integration Testing
./verify.sh  # All system checks pass

# 6. Real Data Testing
./test-api.sh  # Real API calls return actual data
```

### **FUNCTIONAL REQUIREMENTS:**
1. **Setup works in 3 commands:** `./setup.sh`, `./start.sh`, browser access
2. **Real HF search** returns actual Persian models
3. **Real downloads** save files to disk with progress
4. **Real training** creates and trains neural networks
5. **Real database** persists all operations
6. **Real WebSocket** provides live updates
7. **Production ready** with security and error handling

---

## 🚀 IMPLEMENTATION PRIORITY ORDER

### Phase 1: Core Infrastructure ⚡
1. Database schema and connections
2. Basic API server with security
3. Environment configuration
4. TypeScript compilation

### Phase 2: HuggingFace Integration 🤗
1. Real API service implementation
2. Model search and information retrieval
3. File download with progress tracking
4. Token validation and management

### Phase 3: Machine Learning 🧠
1. TensorFlow.js training service
2. Real neural network creation
3. Training progress tracking
4. Checkpoint management

### Phase 4: Real-time Features ⚡
1. WebSocket server implementation
2. Real-time progress events
3. User-specific event targeting
4. Error handling and recovery

### Phase 5: Frontend Integration 🎨
1. React component implementation
2. API service integration
3. Real-time UI updates
4. Persian language support

### Phase 6: Production Readiness 🚀
1. Security hardening
2. Performance optimization
3. Error handling and logging
4. Documentation and testing

---

## 📝 DELIVERABLES REQUIRED

1. **Working Application** - All features functional as described
2. **Verification Report** - Proof that all requirements are met
3. **Test Results** - All verification scripts passing
4. **Documentation Updates** - Any changes or improvements documented
5. **Deployment Guide** - Updated setup and deployment instructions

---

**Remember: This is a PRODUCTION-READY application. Every feature must work exactly as described in the README with ZERO mock data or placeholders.**