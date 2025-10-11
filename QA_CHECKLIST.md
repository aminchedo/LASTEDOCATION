# QA Checklist - Download Proxy Implementation

## ✅ Implementation Complete

### 1. Proxy Server (`backend/src/download-proxy.ts`)
- [x] Secure proxy endpoint `/api/v1/sources/proxy`
- [x] URL resolver endpoint `/api/v1/sources/resolve`
- [x] Allowed hosts whitelist (HuggingFace, GitHub, Google, etc.)
- [x] Proper CORS headers
- [x] Content-Disposition header preservation
- [x] Redirect following (up to 5 levels)

### 2. Frontend Utils (`client/src/shared/utils/download.ts`)
- [x] `buildProxyUrl()` helper function
- [x] `buildResolveUrl()` helper function
- [x] `resolveDatasetUrl()` async function
- [x] TypeScript interfaces for resolve results

### 3. Download Center Updates (`client/src/pages/DownloadCenterPage.tsx`)
- [x] Import proxy utilities
- [x] Replace direct `fetch(dataset.downloadUrl)` with `fetch(buildProxyUrl(dataset.downloadUrl))`
- [x] Update `directOpen()` to use proxy URLs
- [x] Add `broken` status to Dataset interface
- [x] Add `resolveResult` field to Dataset interface
- [x] URL validation on component mount
- [x] Broken link UI with orange warning
- [x] "Check Again" button for broken links
- [x] Fixed TypeScript errors

### 4. Training Polling Fix (`client/src/hooks/useTraining.ts`)
- [x] Stop polling when no active training session
- [x] Handle 404/409 responses gracefully
- [x] Set status to 'idle' when no active session

### 5. Server Integration (`backend/src/server.ts`)
- [x] Import download proxy router
- [x] Mount at `/api/v1` path
- [x] Add proxy start script to package.json

## 🧪 Testing Checklist

### Manual Testing Steps

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Test proxy endpoints directly:**
   ```bash
   cd backend
   node test-proxy.js
   ```

3. **Test in browser:**
   - [ ] Open DownloadCenterPage
   - [ ] Click "Download" on Common Voice dataset
   - [ ] Verify download starts immediately (no 401 error)
   - [ ] Check Network tab - should see requests to `/api/v1/sources/proxy?...`
   - [ ] Verify filename is preserved correctly

4. **Test broken links:**
   - [ ] Persian G2P dataset should show "Broken link" status
   - [ ] "Check Again" button should retry URL resolution
   - [ ] "View Source" button should open GitHub page

5. **Test training polling:**
   - [ ] Open browser console
   - [ ] Verify no repeated "Failed to fetch training status" errors
   - [ ] Polling should stop when no active training session

### Expected Results

- ✅ **Common Voice download:** No 401 errors, immediate download start
- ✅ **Persian G2P:** Shows "Broken link" status with orange warning
- ✅ **ManaTTS:** Downloads successfully through proxy
- ✅ **Training logs:** No spam when no active session
- ✅ **Filenames:** Preserved correctly (no extension loss)

### Direct URLs to Test

1. **Common Voice 19 (Persian) - train split**
   ```
   https://huggingface.co/datasets/mozilla-foundation/common_voice_19_0/resolve/main/transcript/fa/train/train.tar.gz
   ```

2. **Common Voice 19 (Persian) - validation split**
   ```
   https://huggingface.co/datasets/mozilla-foundation/common_voice_19_0/resolve/main/transcript/fa/validation/validation.tar.gz
   ```

3. **Persian G2P (JSON) - Currently 404**
   ```
   https://raw.githubusercontent.com/PasyanAI/Persian-G2P-Datasets/main/persian_g2p_dataset.json
   ```

4. **ManaTTS audio files**
   ```
   https://huggingface.co/datasets/MahtaFetrat/ManaTTS/resolve/main/audio_files.tar.gz
   ```

5. **ManaTTS model (ZIP)**
   ```
   https://github.com/MahtaFetrat/ManaTTS-Persian-Tacotron2-Model/archive/refs/heads/main.zip
   ```

6. **Google Speech Commands v0.02**
   ```
   http://download.tensorflow.org/data/speech_commands_v0.02.tar.gz
   ```

## 🚀 Quick Start

1. **Start backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start frontend:**
   ```bash
   cd client
   npm run dev
   ```

3. **Test immediately:**
   - Go to Download Center page
   - Click download on any dataset
   - Should work instantly without CORS/401 errors

## 🔧 Troubleshooting

- **If proxy doesn't work:** Check that backend is running on port 3001
- **If 404 on proxy:** Verify the URL is in the ALLOWED_HOSTS list
- **If download fails:** Check browser console for error messages
- **If training polling continues:** Check that SSE connection is working

## 📝 Notes

- Proxy server handles redirects automatically
- Filenames are extracted from Content-Disposition headers
- Broken links are detected and marked with orange warning
- Training polling stops when no active session (no more spam logs)
- All downloads go through secure proxy (no CORS issues)
