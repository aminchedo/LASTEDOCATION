# 🤖 Bot Coder Instructions: Persian TTS/AI Platform Implementation

## 🎯 Your Mission

You are a specialized **Implementation Bot Coder** tasked with verifying and completing the Persian TTS/AI Platform based on comprehensive analysis feedback. Your goal is to ensure **100% implementation** of all features described in the README.md with **ZERO mock data**.

---

## 📋 Pre-Implementation Analysis

Based on thorough analysis of the codebase, the following critical components have been identified:

### ✅ **Already Implemented (Verified)**
- Database schema with 7 tables and relationships
- TypeScript configuration for both backend and frontend
- Basic Express server structure
- React frontend with Vite build system
- Package.json dependencies for all required technologies
- Automated setup scripts (setup.sh, start.sh, stop.sh)

### ⚠️ **Requires Verification & Completion**
- Real HuggingFace API integration functionality
- Actual TensorFlow.js training implementation
- WebSocket real-time event system
- Complete API endpoint implementations
- Security middleware and authentication
- File system operations for model downloads
- Frontend-backend integration

---

## 🛠️ Implementation Methodology

### Step 1: **System Verification** (30 minutes)
```bash
# Run these commands to understand current state:
./verify.sh                    # Check overall system health
npm run verify:all            # Run all verification scripts
npm run lint                  # Check TypeScript compilation
npm test                      # Run existing tests
```

### Step 2: **Database Verification** (15 minutes)
```sql
-- Verify database structure:
\dt                           -- List all tables
\d+ users                     -- Check users table structure
\d+ models                    -- Check models table structure
\d+ training_jobs             -- Check training_jobs table structure
-- Repeat for all 7 tables
```

### Step 3: **Service Implementation Verification** (60 minutes)
Examine and complete these critical services:

#### HuggingFace Service (`BACKEND/src/services/huggingface.service.ts`)
```typescript
// Verify these methods work with REAL API calls:
- validateToken(token: string)
- searchModels(query: string, token?: string) 
- getModelInfo(repoId: string, token?: string)
- downloadModel(repoId: string, destDir: string, token?: string, onProgress?: Function)
- listModelFiles(repoId: string, token?: string)
```

#### Training Service (`BACKEND/src/services/training.service.ts`)
```typescript
// Verify REAL TensorFlow.js implementation:
- createTrainingJob(userId, modelId, config)
- startTraining(jobId)
- Real neural network creation with tf.sequential()
- Actual model.fit() training with progress callbacks
- Checkpoint saving to database and filesystem
```

#### WebSocket Service (`BACKEND/src/services/websocket-real.service.ts`)
```typescript
// Verify real-time events:
- 'download:progress', 'download:complete', 'download:error'
- 'training:progress', 'training:complete', 'training:error'
- Room-based user targeting: socket.join(`user:${userId}`)
```

### Step 4: **API Endpoint Verification** (45 minutes)
Verify ALL endpoints in these files:
- `BACKEND/src/routes/sources-new.ts` (HuggingFace endpoints)
- `BACKEND/src/routes/training-new.ts` (Training endpoints)  
- `BACKEND/src/routes/settings-new.ts` (Settings endpoints)

### Step 5: **Frontend Integration Verification** (30 minutes)
Check these frontend components:
- `client/src/services/inference.service.ts` (TensorFlow.js browser integration)
- API service integration with backend
- WebSocket connection for real-time updates
- Persian UI components and responsiveness

---

## 🔧 Implementation Priorities

### **CRITICAL (Must Fix First)**
1. **Real HuggingFace API Integration**
   - Actual HTTP calls to `https://huggingface.co/api`
   - Real file downloads with progress tracking
   - Token validation with HF servers

2. **Real TensorFlow.js Training**
   - Actual neural network creation and training
   - Real gradient descent optimization
   - Progress callbacks and checkpoint saving

3. **Database Operations**
   - Real PostgreSQL queries with connection pooling
   - Proper foreign key relationships
   - JSONB metadata storage and retrieval

### **HIGH PRIORITY**
4. **WebSocket Real-time Events**
   - Live progress updates during downloads/training
   - User-specific event targeting
   - Error handling and recovery

5. **Security Implementation**
   - JWT authentication middleware
   - bcrypt password hashing
   - Input validation and sanitization

6. **File System Operations**
   - Real file downloads to `models/` directory
   - Streaming for large files
   - Progress tracking and cleanup

### **MEDIUM PRIORITY**
7. **API Endpoint Completion**
   - All 15+ endpoints fully functional
   - Proper error handling and status codes
   - Request/response validation

8. **Frontend Integration**
   - Real API service calls
   - WebSocket connection management
   - Persian language UI components

---

## 🧪 Testing & Verification Protocol

### **Mandatory Tests (Must Pass)**
```bash
# 1. TypeScript Compilation (0 errors required)
cd BACKEND && npm run lint
cd client && npm run lint

# 2. Database Connectivity
npm run verify:db

# 3. API Functionality
npm run verify:api

# 4. Build Process
npm run verify:build

# 5. Integration Testing
./test-api.sh

# 6. System Health
./verify.sh
```

### **Functional Testing Requirements**
1. **HuggingFace Integration Test**
   ```bash
   curl "http://localhost:3001/api/sources/search?q=persian"
   # Should return REAL models from HuggingFace
   ```

2. **Database Persistence Test**
   ```sql
   INSERT INTO users (email, username, password_hash) VALUES ('test@test.com', 'test', 'hashed');
   SELECT * FROM users WHERE email = 'test@test.com';
   # Should persist and retrieve real data
   ```

3. **Training Service Test**
   ```bash
   curl -X POST http://localhost:3001/api/training \
     -H "Content-Type: application/json" \
     -d '{"modelType":"tts","epochs":5,"batchSize":32}'
   # Should create real training job with TensorFlow.js
   ```

4. **WebSocket Test**
   ```javascript
   const socket = io('http://localhost:3001');
   socket.on('training:progress', (data) => console.log(data));
   // Should receive real progress updates
   ```

---

## 📊 Implementation Checklist

### Database Layer ✅
- [ ] All 7 tables exist with correct schema
- [ ] Foreign key relationships working
- [ ] Indexes created for performance
- [ ] Connection pooling configured (20 connections)
- [ ] Triggers for auto-timestamps working
- [ ] Sample data insertion/retrieval works

### HuggingFace Integration ✅
- [ ] Real API search returns actual models
- [ ] Model information retrieval functional
- [ ] File downloads save to disk with progress
- [ ] Token validation with HF servers works
- [ ] Error handling for API failures implemented
- [ ] Rate limiting and retry logic in place

### TensorFlow.js Training ✅
- [ ] Real neural network creation works
- [ ] Training with actual data and gradient descent
- [ ] Progress callbacks during training functional
- [ ] Model saving to filesystem works
- [ ] Checkpoint creation in database works
- [ ] Memory management and cleanup implemented

### WebSocket Real-time ✅
- [ ] Socket.IO server properly configured
- [ ] Real-time events broadcasting works
- [ ] Room-based user targeting functional
- [ ] Progress updates during operations work
- [ ] Error event handling implemented
- [ ] Connection management and recovery works

### API Endpoints ✅
- [ ] All 15+ endpoints implemented and functional
- [ ] Proper HTTP status codes returned
- [ ] Request/response validation with Zod
- [ ] Error handling and logging implemented
- [ ] Authentication middleware working
- [ ] Rate limiting configured

### Security Implementation ✅
- [ ] JWT authentication fully functional
- [ ] bcrypt password hashing (min 10 rounds)
- [ ] CORS properly configured
- [ ] Helmet.js security headers active
- [ ] Input validation prevents injection
- [ ] Environment secrets properly secured

### File Operations ✅
- [ ] Real file downloads to disk work
- [ ] Streaming for large files implemented
- [ ] Progress tracking during downloads
- [ ] Directory management works
- [ ] Cleanup on errors implemented
- [ ] Proper file permissions set

### Frontend Integration ✅
- [ ] React components fully functional
- [ ] TensorFlow.js browser inference works
- [ ] WebSocket real-time updates functional
- [ ] API service integration complete
- [ ] Persian language support implemented
- [ ] Responsive UI design working

---

## 🚨 Critical Implementation Rules

### **ZERO TOLERANCE POLICIES**
1. **NO MOCK DATA** - Every response must come from real sources
2. **NO PLACEHOLDERS** - No "TODO" or "FIXME" comments allowed
3. **NO FAKE OPERATIONS** - All training, downloads, DB ops must be real
4. **ZERO TYPESCRIPT ERRORS** - Code must compile without errors
5. **COMPLETE FUNCTIONALITY** - Every README feature must work

### **Quality Standards**
- All database queries use parameterized statements
- All API calls include proper error handling
- All file operations use streams for efficiency
- All user inputs are validated and sanitized
- All operations support cancellation where applicable
- All secrets stored in environment variables only

---

## 📝 Deliverable Requirements

### **1. Working Application**
- Three-command setup works: `./setup.sh`, `./start.sh`, browser access
- All features functional as described in README
- Zero mock data or placeholders

### **2. Verification Report**
Create `IMPLEMENTATION_VERIFICATION_REPORT.md` with:
- Test results for all verification scripts
- Screenshots/logs proving real functionality
- Performance metrics and benchmarks
- Security audit results

### **3. Updated Documentation**
- Any changes made to implementation
- New environment variables or configuration
- Updated troubleshooting guide
- Performance optimization notes

### **4. Code Quality Report**
- TypeScript compilation results (must be 0 errors)
- Test coverage report
- Security scan results
- Performance profiling results

---

## 🎯 Success Metrics

### **Functional Success**
- [ ] `./setup.sh` completes without errors
- [ ] `./start.sh` launches both servers successfully  
- [ ] Frontend accessible at http://localhost:5173
- [ ] Backend API responds at http://localhost:3001
- [ ] Real HuggingFace search returns actual models
- [ ] Real model downloads save files to disk
- [ ] Real training creates and trains neural networks
- [ ] Database persists all operations correctly
- [ ] WebSocket provides live updates

### **Technical Success**
- [ ] 0 TypeScript compilation errors
- [ ] All verification scripts pass
- [ ] All tests pass with >90% coverage
- [ ] Security scan shows no critical vulnerabilities
- [ ] Performance benchmarks meet requirements
- [ ] Memory usage stays within acceptable limits

### **Production Readiness**
- [ ] Environment configuration complete
- [ ] Security measures fully implemented
- [ ] Error handling comprehensive
- [ ] Logging and monitoring active
- [ ] Documentation complete and accurate
- [ ] Deployment guide tested and verified

---

## 🚀 Getting Started

1. **Read the verification prompt** (`BOT_CODER_VERIFICATION_PROMPT.md`)
2. **Run initial system check** (`./verify.sh`)
3. **Examine current codebase** (focus on services and routes)
4. **Identify gaps** between README promises and actual implementation
5. **Implement missing functionality** following the priority order
6. **Test thoroughly** using provided verification scripts
7. **Document changes** and create verification report

**Remember: This is a production-ready application. Every feature must work exactly as described with ZERO compromises on quality or functionality.**