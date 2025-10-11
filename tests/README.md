# Proxy System Smoke Tests

This directory contains comprehensive tests to verify the proxy-only download system works correctly with real data.

## Prerequisites

- **Node.js 18+** (for native fetch support)
- **Proxy server running** on `http://localhost:3001`
- **jq** (optional, for JSON parsing in bash script)

## Test Files

### 1. `smoke-test.js` (Recommended - Cross-platform)
Node.js test that works on Windows, macOS, and Linux.

```bash
node tests/smoke-test.js
```

### 2. `smoke.sh` (Linux/macOS)
Bash script with colored output and jq integration.

```bash
chmod +x tests/smoke.sh
./tests/smoke.sh
```

### 3. `smoke.ps1` (Windows PowerShell)
PowerShell version for Windows users.

```powershell
.\tests\smoke.ps1
```

## What the Tests Check

### ✅ Health Endpoint
- `GET /api/v1/health` → `{ ok: true }`

### ✅ Resolve Endpoint
For each dataset URL:
- `GET /api/v1/sources/resolve?url=<ENCODED>` → `{ ok: true, status: 200/206, filename, sizeBytes }`
- Tests all 8 real dataset URLs from DownloadCenterPage.tsx

### ✅ Proxy Endpoint
For each dataset URL:
- `HEAD /api/v1/sources/proxy?url=<ENCODED>` → Status 200/206
- Verifies proxy can serve the files

## Expected Output

### 🟢 Success (All Green)
```
==> Health check
  OK http://localhost:3001/api/v1/health => {"ok":true}

--------------------------------------------------------------------------
IDX   | OK   | STATUS | SIZE(B)    | FILENAME / FINAL URL
--------------------------------------------------------------------------
1     | YES  | 200    | 4200000000 | train.tar.gz  https://huggingface.co/...
2     | YES  | 200    | 1800000000 | validation.tar.gz  https://huggingface.co/...
...
--------------------------------------------------------------------------
RESULT: all links resolved successfully. Proxy responds.
```

### 🔴 Failure (Red Items)
```
==> Health check
  FAIL http://localhost:3001/api/v1/health => Connection refused

RESULT: 8 link(s) failed resolve. Fix URLs or set HF_TOKEN for private/limited HF assets.
```

## Troubleshooting

### Node < 18 Error
```
This test requires Node.js 18+ with native fetch support
```
**Solution:** Update Node.js or install polyfill: `npm install node-fetch`

### Port 3001 Busy
```
Health test failed. Make sure the proxy server is running:
   cd backend && npm run dev:proxy
```
**Solution:** Start the proxy server or change port in `backend/proxy.ts`

### HuggingFace 401/403 Errors
```
1     | NO   | 401    | 0          | -  https://huggingface.co/...
```
**Solution:** Set HF_TOKEN environment variable:
```bash
export HF_TOKEN=hf_xxx
node tests/smoke-test.js
```

### 404 Errors
```
2     | NO   | 404    | 0          | -  https://github.com/...
```
**Solution:** URL is broken/outdated. Update the URL in `DownloadCenterPage.tsx` or add alternate URLs.

## Manual Frontend Test

After smoke tests pass:

1. **Start frontend:**
   ```bash
   cd client && npm run dev
   ```

2. **Open Download Center page**

3. **Click Download** on any dataset

4. **Check DevTools → Network:**
   - ✅ Should see requests to `/api/v1/sources/proxy?...`
   - ❌ Should NOT see direct cross-origin requests

5. **Verify download:**
   - Progress bar updates
   - Correct filename
   - File saves to Downloads folder

## Pass/Fail Criteria

### ✅ PASS
- Health endpoint returns `{ ok: true }`
- All URLs resolve with `ok: true` and status 200/206
- Proxy HEAD requests return 200/206
- Frontend downloads only through proxy (no direct cross-origin)
- Progress tracking works correctly
- Filenames are correct

### ❌ FAIL
- Health endpoint fails
- Any URL shows `OK: NO` in test results
- Frontend makes direct cross-origin requests
- Downloads don't work or show incorrect filenames

## Quick Start

1. **Start proxy server:**
   ```bash
   cd backend
   npm run dev:proxy
   ```

2. **Run smoke test:**
   ```bash
   node tests/smoke-test.js
   ```

3. **If all green, start frontend:**
   ```bash
   cd client
   npm run dev
   ```

4. **Test downloads in browser**

The system is ready when all tests pass! 🎉
