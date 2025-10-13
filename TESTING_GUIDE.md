# Testing Guide for UI Consolidation & HuggingFace Integration

## Prerequisites

Before testing, ensure dependencies are installed:

```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../BACKEND
npm install
```

## Quick Start Testing

### 1. Start the Services

**Terminal 1 - Backend:**
```bash
cd BACKEND
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

The application should now be running at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### 2. Test Navigation Consolidation

#### Test Models Hub (`/models`)
1. Navigate to http://localhost:5173/models
2. Verify you see 3 tabs:
   - ✅ "مدل‌های نصب شده" (Installed Models)
   - ✅ "کاتالوگ و دانلود" (Download Catalog)
   - ✅ "منابع خارجی" (External Sources)
3. Click each tab and verify:
   - Tab content loads without errors
   - All features work (search, filter, actions)
   - No console errors appear

#### Test Playground Hub (`/playground`)
1. Navigate to http://localhost:5173/playground
2. Verify you see 2 tabs:
   - ✅ "پلی‌گراند TTS" (TTS Playground)
   - ✅ "نظارت مدل" (Model Monitoring)
3. Test TTS functionality in first tab
4. Check monitoring charts in second tab

#### Test Training Hub (`/training`)
1. Navigate to http://localhost:5173/training
2. Verify you see 2 tabs:
   - ✅ "آموزش مدل" (Training)
   - ✅ "عملکرد و معیارها" (Performance Metrics)
3. Test training controls
4. Verify metrics display correctly

### 3. Test HuggingFace Integration

#### Test Token Management

1. Navigate to Settings: http://localhost:5173/settings
2. Scroll to "HuggingFace Integration" section
3. Test token input:
   ```
   - Enter invalid token (e.g., "test123")
   - Click "اعتبارسنجی" (Validate)
   - Should show error: "توکن نامعتبر است"
   ```
4. Test valid token:
   ```
   - Get a real HuggingFace token from https://huggingface.co/settings/tokens
   - Enter token (starts with "hf_")
   - Click "اعتبارسنجی" (Validate)
   - Should show success with your username
   ```
5. Test token visibility:
   - Click eye icon to show/hide token
   - Verify masking works correctly

#### Test Custom Models

1. In Settings, scroll to "مدل‌های سفارشی" (Custom Models)
2. Click "افزودن مدل" (Add Model)
3. Fill in the form:
   ```
   Name: Test Persian TTS
   Repository ID: username/model-name
   Type: TTS
   URL: https://huggingface.co/username/model-name
   Description: Test model for validation
   ```
4. Click "اعتبارسنجی URL" to validate the URL
5. Click "افزودن" to add the model
6. Verify model appears in the list
7. Click X button to delete the model

#### Test Settings Persistence

1. Add HuggingFace token
2. Configure auto-download settings
3. Add a custom model
4. Click "ذخیره تغییرات" (Save Changes)
5. Refresh the page (F5)
6. Verify all settings are preserved

### 4. Test Token Integration in Downloads

#### Manual Testing

1. Ensure you have a valid HF token saved in Settings
2. Go to Models Hub → Catalog tab
3. Select a model to download
4. Open Browser DevTools (F12)
5. Go to Network tab
6. Click download button
7. Find the POST request to `/api/sources/download`
8. Check request payload - should include `token` field

#### API Testing with curl

Test the backend directly:

```bash
# Test token validation
curl -X PUT http://localhost:3001/api/settings/huggingface/validate \
  -H "Content-Type: application/json" \
  -d '{"token":"hf_YOUR_REAL_TOKEN_HERE"}'

# Expected response:
# {"success":true,"valid":true,"username":"your-username","type":"user"}

# Test settings save
curl -X POST http://localhost:3001/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "huggingfaceToken":"hf_YOUR_TOKEN",
    "huggingfaceAutoDownload":true,
    "huggingfaceMaxConcurrent":2,
    "customModels":[]
  }'

# Expected response:
# {"success":true,"data":{...}}

# Test download with token
curl -X POST http://localhost:3001/api/sources/download \
  -H "Content-Type: application/json" \
  -d '{
    "modelId":"Kamtera/persian-tts-male-vits",
    "token":"hf_YOUR_TOKEN"
  }'

# Expected response:
# {"success":true,"data":{"jobId":"dl_...","modelId":"...","message":"Download started successfully"}}
```

### 5. Test Browser Console

Open Developer Tools (F12) and check:

#### No Errors
- ✅ No red errors in Console tab
- ✅ No 404 network requests
- ✅ All API calls return 200 or expected status

#### Expected Warnings (Acceptable)
- React development mode warnings (normal)
- Missing API responses (if backend not fully configured)

#### Critical Errors to Watch For
- ❌ "Cannot find module" errors
- ❌ "Unexpected token" syntax errors
- ❌ Blank pages with errors
- ❌ Infinite loading states

### 6. Test Responsive Design

Test on different screen sizes:

```bash
# Desktop (1920x1080)
- All tabs visible
- Sidebar expanded
- Full content display

# Tablet (768px)
- Tabs should wrap if needed
- Sidebar collapsible
- Content adapts

# Mobile (375px)
- Tabs horizontal scroll
- Mobile menu
- Touch-friendly buttons
```

## Automated Testing (Optional)

If you want to add automated tests:

### Unit Tests
```bash
cd client
npm run test
```

### E2E Tests (if configured)
```bash
cd client
npm run test:e2e
```

## Common Issues & Solutions

### Issue: "Module not found" errors

**Solution:**
```bash
cd client
rm -rf node_modules package-lock.json
npm install
```

### Issue: Tabs don't appear

**Check:**
1. Is the Tabs component imported correctly?
2. Are there console errors?
3. Does the page render at all?

**Solution:**
- Check browser console for specific error
- Verify file paths in imports

### Issue: Token validation fails

**Check:**
1. Is token format correct (starts with `hf_`)?
2. Is backend running?
3. Do you have internet connection?

**Debug:**
```bash
# Check if HuggingFace API is reachable
curl -H "Authorization: Bearer hf_YOUR_TOKEN" https://huggingface.co/api/whoami
```

### Issue: Settings don't persist

**Check:**
1. Is localStorage enabled in browser?
2. Are you in private/incognito mode?
3. Does the save button respond?

**Debug:**
```javascript
// Open browser console and run:
localStorage.getItem('app_settings')
// Should return JSON string with your settings
```

### Issue: Downloads don't use token

**Check:**
1. Is token saved in settings?
2. Check Network tab for request payload
3. Verify backend receives token

**Debug:**
```javascript
// In browser console:
const settings = JSON.parse(localStorage.getItem('app_settings'));
console.log('Token:', settings.huggingfaceToken);
```

## Performance Testing

### Load Time
- ✅ Initial page load: < 3 seconds
- ✅ Tab switching: < 500ms
- ✅ Settings save: < 1 second

### Memory Usage
```javascript
// In browser console:
console.log(performance.memory);
// Should not show excessive memory usage
```

## Security Checklist

- ✅ Tokens never logged in console
- ✅ Tokens masked in UI by default
- ✅ HTTPS used in production
- ✅ No sensitive data in URLs
- ✅ Tokens not exposed in error messages

## Success Criteria

Mark each as ✅ when verified:

### Navigation
- [ ] 5 main navigation items visible
- [ ] All old routes removed or redirect
- [ ] Navigation menu works on mobile

### Models Hub
- [ ] 3 tabs visible and functional
- [ ] All models list correctly
- [ ] Download functionality works
- [ ] External sources connect

### Playground Hub
- [ ] 2 tabs visible and functional
- [ ] TTS generates speech
- [ ] Monitoring shows metrics

### Training Hub
- [ ] 2 tabs visible and functional
- [ ] Training can be started
- [ ] Metrics display correctly

### Settings
- [ ] HuggingFace section visible
- [ ] Token validation works
- [ ] Custom models can be added
- [ ] Settings persist after refresh

### Token Integration
- [ ] Token saved in localStorage
- [ ] Token sent in download requests
- [ ] Token validated before use
- [ ] Downloads work with token

### No Regressions
- [ ] No console errors
- [ ] All existing features work
- [ ] No broken links
- [ ] No missing images/assets

## Reporting Issues

If you find issues, please report with:

1. **What you did:** Step-by-step actions
2. **What you expected:** Expected behavior
3. **What happened:** Actual behavior
4. **Browser:** Chrome/Firefox/Safari + version
5. **Console errors:** Copy from DevTools console
6. **Network errors:** Copy from DevTools network tab

## Next Steps After Testing

Once all tests pass:

1. ✅ Create git commit with changes
2. ✅ Update documentation
3. ✅ Deploy to staging environment
4. ✅ Perform smoke tests in staging
5. ✅ Deploy to production
6. ✅ Monitor for errors

## Support

For questions or issues:
- Check `IMPLEMENTATION_SUMMARY.md` for architecture details
- Review console errors for specific issues
- Test with simplified data first
- Verify all dependencies installed

---

**Happy Testing! 🎉**
