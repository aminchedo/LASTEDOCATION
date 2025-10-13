# 🎯 CURSOR AGENT - QUICK ACTION CHECKLIST

**Objective**: Make ML Training Platform FULLY FUNCTIONAL  
**Timeline**: 12-18 days  
**Priority Order**: Follow exactly as listed

---

## 📋 PHASE 1: API INTEGRATION (Days 1-3)

### Task 1.1: Unify API Endpoints ⏱️ 1 day
- [ ] Rename `BACKEND/src/routes/trainJobsAPI.ts` → `training.ts`
- [ ] Change route prefix from `/api/train` to `/api/training`
- [ ] Rename `client/src/services/experiments.service.ts` → `training.service.ts`
- [ ] Update all API calls to use `/api/training/*`
- [ ] Update `server.ts` to mount at `/api/training`
- [ ] Test: `curl -X POST http://localhost:3001/api/training -d '{"epochs":2}'`

### Task 1.2: Dataset Upload System ⏱️ 2 days
- [ ] Add multer to `BACKEND/package.json`
- [ ] Create `BACKEND/src/routes/datasets.ts` with upload endpoint
- [ ] Create `client/src/components/datasets/DatasetUpload.tsx`
- [ ] Update `TrainingForm.tsx` to select datasets
- [ ] Mount datasets router in `server.ts`: `app.use('/api/datasets', datasetsRouter)`
- [ ] Test: Upload CSV → Select in form → Start training

---

## 📋 PHASE 2: AUTHENTICATION (Days 4-8)

### Task 2.1: Backend Auth ⏱️ 3 days
- [ ] `npm install jsonwebtoken bcrypt` in BACKEND
- [ ] Create `BACKEND/src/middleware/auth.ts` (JWT middleware)
- [ ] Create `BACKEND/src/models/User.ts` (file-based user storage)
- [ ] Create `BACKEND/src/routes/auth.ts` (register, login, /me endpoints)
- [ ] Protect all routes: Add `authenticateToken` middleware
- [ ] Update `server.ts`: Add `app.use('/api/auth', authRouter)` BEFORE other routes
- [ ] Create `BACKEND/.env` with `JWT_SECRET=your-secret-key`
- [ ] Test: Register → Login → Get token → Call protected endpoint

### Task 2.2: Frontend Auth ⏱️ 2 days
- [ ] `npm install jwt-decode` in client
- [ ] Create `client/src/contexts/AuthContext.tsx`
- [ ] Create `client/src/services/auth.service.ts`
- [ ] Create `client/src/pages/LoginPage.tsx`
- [ ] Create `client/src/pages/RegisterPage.tsx`
- [ ] Create `client/src/components/ProtectedRoute.tsx`
- [ ] Wrap App in `<AuthProvider>`
- [ ] Add routes in App.tsx: `/login`, `/register`
- [ ] Add axios interceptor to attach JWT token
- [ ] Test: Full login flow in browser

---

## 📋 PHASE 3: WEBSOCKET REAL-TIME (Days 9-11)

### Task 3.1: Backend WebSocket ⏱️ 1.5 days
- [ ] `npm install socket.io` in BACKEND
- [ ] Create `BACKEND/src/services/websocket.service.ts`
- [ ] Update `BACKEND/src/server.ts`:
  - Import `http` and create `http.createServer(app)`
  - Call `setupWebSocket(server)`
  - Change `app.listen` to `server.listen`
- [ ] Add `POST /api/training/internal/status-update` endpoint
- [ ] Update `scripts/train_minimal_job.py` to POST status updates
- [ ] Test: Connect with socket.io-client in browser console

### Task 3.2: Frontend WebSocket ⏱️ 1.5 days
- [ ] `npm install socket.io-client` in client
- [ ] Create `client/src/hooks/useJobWebSocket.ts`
- [ ] Create `client/src/components/training/TrainingMonitor.tsx`
- [ ] Update `TrainingPage.tsx` to use `TrainingMonitor`
- [ ] Test: Start job → See real-time updates

---

## 📋 PHASE 4: TESTING & DOCS (Days 12-15)

### Task 4.1: Integration Tests ⏱️ 2 days
- [ ] Setup testing infrastructure (Jest, MSW)
- [ ] Write `training-flow.test.tsx` (login → upload → train → monitor)
- [ ] Write `auth-flow.test.tsx`
- [ ] Run: `npm test` - all tests pass

### Task 4.2: API Documentation ⏱️ 1 day
- [ ] `npm install swagger-jsdoc swagger-ui-express` in BACKEND
- [ ] Create `BACKEND/src/swagger.ts`
- [ ] Add JSDoc comments to all routes
- [ ] Mount in server: `app.use('/api-docs', swaggerUi.serve)`
- [ ] Test: Visit http://localhost:3001/api-docs

---

## ✅ FINAL VERIFICATION CHECKLIST

### Must Work Before Deploy:
- [ ] User can register from UI
- [ ] User can login from UI and see token
- [ ] Protected routes redirect to login if not authenticated
- [ ] User can upload CSV/JSONL dataset
- [ ] Uploaded datasets appear in dropdown
- [ ] User can create training job with selected dataset
- [ ] Job appears in list with status
- [ ] Progress bar updates in real-time (WebSocket)
- [ ] User can stop running job
- [ ] User can download completed model (.pt file)
- [ ] Logout clears token and redirects to login
- [ ] `npm run build` succeeds in both client and BACKEND
- [ ] No console errors in browser (check DevTools)
- [ ] API docs visible at /api-docs

### Technical Checks:
- [ ] Backend: `npm run build` → exit code 0
- [ ] Frontend: `npm run build` → no errors
- [ ] All environment variables in `.env` files
- [ ] JWT_SECRET is not default value
- [ ] No secrets in frontend code
- [ ] All API errors return proper JSON responses
- [ ] Loading states show during async operations

---

## 🚨 CRITICAL RULES

1. **Complete one task at a time**
   - Don't start Task 2 until Task 1 is done and tested

2. **Test after every change**
   - Run backend: `npm start`
   - Run frontend: `npm run dev`
   - Test in browser or with curl

3. **Commit frequently**
   ```bash
   git add .
   git commit -m "feat: implement task X.Y - description"
   ```

4. **Follow exact file paths**
   - Don't create files in wrong directories
   - Match paths exactly as shown

5. **Use provided code snippets**
   - Copy full implementations from CURSOR_AGENT_DIRECTIVE.md
   - Don't write from scratch - adapt provided code

6. **Never skip authentication**
   - All `/api/*` routes MUST use `authenticateToken` middleware
   - Except: `/api/auth/*` and `/api/training/internal/*`

---

## 📦 DEPENDENCIES TO INSTALL

### Backend:
```bash
cd BACKEND
npm install jsonwebtoken bcrypt socket.io multer
npm install --save-dev @types/jsonwebtoken @types/bcrypt @types/socket.io @types/multer
npm install swagger-jsdoc swagger-ui-express
npm install --save-dev @types/swagger-jsdoc @types/swagger-ui-express
```

### Frontend:
```bash
cd client
npm install socket.io-client jwt-decode
npm install --save-dev @types/jwt-decode
```

---

## 🗂️ NEW FILES TO CREATE

### Backend (9 files):
```
BACKEND/
├── .env                              # JWT secret
├── src/
│   ├── middleware/
│   │   └── auth.ts                   # JWT middleware
│   ├── models/
│   │   └── User.ts                   # User model
│   ├── routes/
│   │   ├── auth.ts                   # Auth endpoints
│   │   ├── training.ts               # Rename from trainJobsAPI.ts
│   │   └── datasets.ts               # Enhanced with upload
│   ├── services/
│   │   └── websocket.service.ts      # WebSocket setup
│   └── swagger.ts                    # API docs
└── data/
    └── users.json                    # User storage (auto-created)
```

### Frontend (11 files):
```
client/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── training.service.ts       # Rename from experiments.service.ts
│   │   └── datasets.service.ts       # Enhanced
│   ├── hooks/
│   │   └── useJobWebSocket.ts
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── TrainingPage.tsx          # Updated
│   ├── components/
│   │   ├── ProtectedRoute.tsx
│   │   ├── datasets/
│   │   │   └── DatasetUpload.tsx
│   │   └── training/
│   │       ├── TrainingForm.tsx      # Updated
│   │       └── TrainingMonitor.tsx
│   └── __tests__/
│       └── integration/
│           └── training-flow.test.tsx
```

---

## 🎯 SUCCESS CRITERIA

Project is COMPLETE when you can do this end-to-end:

1. Open http://localhost:5173/register
2. Create account
3. Login with credentials
4. Upload a CSV file with columns: x,y
5. Go to Training page
6. Select uploaded dataset
7. Set epochs=5, batch_size=16, lr=0.001
8. Click "Start Training"
9. See real-time progress bar moving
10. See loss decreasing
11. Wait for "COMPLETED" status
12. Click "Download Model"
13. Receive .pt file
14. Logout
15. Try to access training page → redirected to login

**If all 15 steps work: PROJECT IS DONE! ✅**

---

## 📞 HELP & REFERENCE

Full code in: `/tmp/CURSOR_AGENT_DIRECTIVE.md`
Gap analysis: `/tmp/PROJECT_GAP_ANALYSIS.md`
Persian guide: `/tmp/PERSIAN_SUMMARY.md`

**Start with Phase 1, Task 1.1 and work sequentially!**

Good luck! 🚀
