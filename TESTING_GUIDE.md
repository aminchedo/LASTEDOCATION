# 🧪 Testing Guide - ML Training Platform

This guide helps you test all features of the ML Training Platform systematically.

---

## 📋 Pre-Testing Checklist

Before testing, ensure:
- [ ] Backend is running (`cd BACKEND && npm run dev`)
- [ ] Frontend is running (`cd client && npm run dev`)
- [ ] Browser is open to `http://localhost:3000` (or `5173`)

---

## 🔐 Phase 1: Authentication Testing

### Test 1.1: Default Admin Login
**Expected**: Should login successfully

1. Navigate to login page
2. Enter credentials:
   - Email: `admin@example.com`
   - Password: `admin123`
3. Click "Sign In"
4. **Expected**: Redirect to home/dashboard
5. **Verify**: User menu shows "Admin User"

**Status**: [ ] Pass [ ] Fail

---

### Test 1.2: New User Registration
**Expected**: Should create account and auto-login

1. Click "Register" or navigate to `/register`
2. Enter details:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `test123`
3. Click "Create Account"
4. **Expected**: Redirect to home/dashboard
5. **Verify**: User menu shows "Test User"

**Status**: [ ] Pass [ ] Fail

---

### Test 1.3: Logout
**Expected**: Should logout and redirect to login

1. Click user menu
2. Click "Logout"
3. **Expected**: Redirect to `/login`
4. **Verify**: Cannot access protected pages

**Status**: [ ] Pass [ ] Fail

---

### Test 1.4: Protected Route Guard
**Expected**: Should redirect unauthenticated users to login

1. Logout if logged in
2. Try to access `/training` directly
3. **Expected**: Redirect to `/login`

**Status**: [ ] Pass [ ] Fail

---

### Test 1.5: Invalid Login
**Expected**: Should show error message

1. Try to login with:
   - Email: `wrong@example.com`
   - Password: `wrongpass`
2. **Expected**: Error message displayed
3. **Verify**: Still on login page

**Status**: [ ] Pass [ ] Fail

---

## 📊 Phase 2: Dataset Management Testing

### Test 2.1: List Datasets
**Expected**: Should show existing datasets

1. Login if not already
2. Navigate to datasets page
3. **Expected**: See list of datasets
4. **Verify**: `test-dataset.jsonl` appears in list

**Status**: [ ] Pass [ ] Fail

---

### Test 2.2: Upload CSV Dataset
**Expected**: Should upload successfully

1. Navigate to dataset upload
2. Click "Choose File"
3. Select a `.csv` file
4. Enter name: `Test CSV Dataset`
5. Click "Upload"
6. **Expected**: Success message
7. **Verify**: New dataset appears in list

**Status**: [ ] Pass [ ] Fail

---

### Test 2.3: Upload JSONL Dataset
**Expected**: Should upload successfully

1. Create a test `.jsonl` file with content:
   ```jsonl
   {"question": "What is AI?", "answer": "Artificial Intelligence"}
   {"question": "What is ML?", "answer": "Machine Learning"}
   ```
2. Upload this file
3. **Expected**: Success message
4. **Verify**: Dataset appears in list

**Status**: [ ] Pass [ ] Fail

---

### Test 2.4: Invalid File Type
**Expected**: Should reject invalid files

1. Try to upload a `.txt` or `.pdf` file
2. **Expected**: Error message about invalid file type

**Status**: [ ] Pass [ ] Fail

---

### Test 2.5: Delete Dataset
**Expected**: Should delete successfully

1. Find a test dataset
2. Click delete button
3. Confirm deletion
4. **Expected**: Dataset removed from list

**Status**: [ ] Pass [ ] Fail

---

## 🚂 Phase 3: Training Job Testing

### Test 3.1: Create Training Job
**Expected**: Should create job successfully

1. Navigate to training page
2. Fill in training parameters:
   - Dataset: Select from dropdown
   - Epochs: `3`
   - Batch Size: `16`
   - Learning Rate: `0.01`
3. Click "Start Training"
4. **Expected**: Job created, redirected to monitor
5. **Verify**: Job ID displayed

**Status**: [ ] Pass [ ] Fail

---

### Test 3.2: View Job Status
**Expected**: Should show current status

1. After creating job, stay on monitor page
2. **Expected**: See status (QUEUED/STARTING/RUNNING)
3. **Verify**: Progress bar updates
4. **Verify**: Status badge shows current state

**Status**: [ ] Pass [ ] Fail

---

### Test 3.3: Real-time Progress Updates
**Expected**: Should see live updates via WebSocket

1. Watch the training monitor
2. **Expected**: Progress updates automatically
3. **Verify**: Connection status shows "Live" (green dot)
4. **Verify**: Progress percentage increases
5. **Verify**: Epoch/step counters update

**Status**: [ ] Pass [ ] Fail

---

### Test 3.4: Stop Training Job
**Expected**: Should stop running job

1. While job is running (status: RUNNING)
2. Click "Stop Training"
3. **Expected**: Job status changes to STOPPED
4. **Verify**: Stop button becomes disabled

**Status**: [ ] Pass [ ] Fail

---

### Test 3.5: List All Jobs
**Expected**: Should show job history

1. Navigate to jobs list
2. **Expected**: See all created jobs
3. **Verify**: Shows job IDs, status, timestamps

**Status**: [ ] Pass [ ] Fail

---

### Test 3.6: Download Completed Model
**Expected**: Should download .pt file

1. Wait for a job to complete (status: COMPLETED)
   - Or check existing completed jobs
2. Click "Download Model"
3. **Expected**: File downloads to browser
4. **Verify**: Filename is `job_*.pt`

**Status**: [ ] Pass [ ] Fail

---

## 🔌 Phase 4: WebSocket Connection Testing

### Test 4.1: WebSocket Auto-Connect
**Expected**: Should connect automatically

1. Navigate to training monitor with job ID
2. Check connection status indicator
3. **Expected**: Shows "Live" with green dot
4. **Verify**: Console shows "Connected" message

**Status**: [ ] Pass [ ] Fail

---

### Test 4.2: WebSocket Reconnection
**Expected**: Should reconnect if disconnected

1. Open browser dev tools (Network tab)
2. Find WebSocket connection
3. Temporarily disable network (DevTools offline mode)
4. **Expected**: Status shows "Reconnecting..."
5. Re-enable network
6. **Expected**: Reconnects and shows "Live"

**Status**: [ ] Pass [ ] Fail

---

### Test 4.3: Multiple Job Subscriptions
**Expected**: Should handle multiple subscriptions

1. Open training monitor in Tab 1
2. Open same job monitor in Tab 2
3. **Expected**: Both tabs receive updates
4. **Verify**: Progress synced across tabs

**Status**: [ ] Pass [ ] Fail

---

## 🔒 Phase 5: Security Testing

### Test 5.1: Token Expiration
**Expected**: Should handle expired tokens

1. Login
2. Wait for token to expire (or manually expire in localStorage)
3. Try to access protected endpoint
4. **Expected**: Redirect to login

**Status**: [ ] Pass [ ] Fail

---

### Test 5.2: API Authentication
**Expected**: Should block unauthorized requests

1. Logout
2. Use curl or Postman to access `/api/training/jobs`
3. **Expected**: 401 Unauthorized error

```bash
curl http://localhost:3001/api/training/jobs
```

**Status**: [ ] Pass [ ] Fail

---

### Test 5.3: WebSocket Authentication
**Expected**: Should require auth token for WebSocket

1. Try to connect to WebSocket without token
2. **Expected**: Connection rejected

**Status**: [ ] Pass [ ] Fail

---

## 📚 Phase 6: API Documentation Testing

### Test 6.1: Swagger UI Access
**Expected**: Should display API docs

1. Navigate to `http://localhost:3001/api-docs`
2. **Expected**: Swagger UI loads
3. **Verify**: See all endpoints listed

**Status**: [ ] Pass [ ] Fail

---

### Test 6.2: API Endpoint Testing via Swagger
**Expected**: Should be able to test endpoints

1. Open Swagger UI
2. Click "Authorize"
3. Enter Bearer token from localStorage
4. Try `/api/auth/me` endpoint
5. **Expected**: Returns user info

**Status**: [ ] Pass [ ] Fail

---

## 🐛 Phase 7: Error Handling Testing

### Test 7.1: Network Error Handling
**Expected**: Should show error messages

1. Stop backend server
2. Try to login
3. **Expected**: Error message displayed
4. Restart backend
5. **Verify**: Can login again

**Status**: [ ] Pass [ ] Fail

---

### Test 7.2: Validation Error Handling
**Expected**: Should validate inputs

1. Try to register with:
   - Email: `invalidemail`
   - Password: `123` (too short)
2. **Expected**: Validation errors shown

**Status**: [ ] Pass [ ] Fail

---

### Test 7.3: 404 Handling
**Expected**: Should show 404 page

1. Navigate to `/nonexistent-page`
2. **Expected**: 404 page displayed
3. **Verify**: Can navigate back

**Status**: [ ] Pass [ ] Fail

---

## 📊 Test Summary

Fill this out after completing all tests:

| Phase | Tests Passed | Tests Failed | Pass Rate |
|-------|--------------|--------------|-----------|
| Authentication | ___ / 5 | ___ | ___% |
| Dataset Management | ___ / 5 | ___ | ___% |
| Training Jobs | ___ / 6 | ___ | ___% |
| WebSocket | ___ / 3 | ___ | ___% |
| Security | ___ / 3 | ___ | ___% |
| API Documentation | ___ / 2 | ___ | ___% |
| Error Handling | ___ / 3 | ___ | ___% |
| **TOTAL** | **___ / 27** | **___** | **___%** |

---

## 🚨 Issues Found

Document any issues found during testing:

### Issue 1
- **Test**: _____________________
- **Expected**: _____________________
- **Actual**: _____________________
- **Severity**: [ ] Critical [ ] High [ ] Medium [ ] Low

### Issue 2
- **Test**: _____________________
- **Expected**: _____________________
- **Actual**: _____________________
- **Severity**: [ ] Critical [ ] High [ ] Medium [ ] Low

---

## ✅ Sign-off

- **Tested by**: _____________________
- **Date**: _____________________
- **Overall Status**: [ ] Pass [ ] Fail [ ] Pass with issues
- **Ready for deployment**: [ ] Yes [ ] No

---

## 📝 Notes

Additional observations or comments:

_____________________
_____________________
_____________________

---

**Testing completed**: ___________
**Total time**: _____ minutes
