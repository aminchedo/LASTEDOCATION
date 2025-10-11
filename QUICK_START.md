# 🚀 Quick Start - HF Downloads Feature

## Prerequisites
- Node.js 18+ installed
- Hugging Face account with API token

---

## ⚡ 30-Second Setup

### 1. Install Dependencies
```bash
# Backend
cd BACKEND && npm install

# Frontend (in new terminal)
cd client && npm install
```

### 2. Configure HF Token
```bash
# Encode your token
echo -n "hf_your_token_here" | base64

# Create .env file
cd BACKEND
echo "HF_TOKEN_BASE64=<paste_base64_here>" > .env
```

### 3. Start Services
```bash
# Terminal 1: Backend
cd BACKEND
npm run dev

# Terminal 2: Frontend
cd client
npm run dev
```

### 4. Access Dashboard
Open browser: **http://localhost:3000/hf-downloads**

---

## 🎯 Quick Test

1. Click "مدل‌ها" tab → Should load 10 models
2. Search "bert" → Should show BERT models
3. Click "صفحه بعد" → Should load next page
4. Click "دانلود مستقیم" → Should download file
5. Press Tab key → Should navigate through UI
6. Switch to "متریک‌ها" tab → Should show dashboard

---

## ✅ Verification Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] `/hf-downloads` route accessible
- [ ] All 4 tabs visible
- [ ] Search returns results
- [ ] No errors in browser console
- [ ] No HF token visible in Network tab

---

## 🔧 Common Issues

**Backend won't start:**
```bash
cd BACKEND && npm install && npm run dev
```

**Frontend build error:**
```bash
cd client && npm install && npm run dev
```

**Token not working:**
```bash
# Verify encoding
echo -n "hf_your_token" | base64
# Copy output to BACKEND/.env
```

**CORS error:**
```bash
# Add to BACKEND/.env
CORS_ORIGIN=http://localhost:3000
```

---

## 📁 Files Added

**Backend:**
- `BACKEND/src/utils/hf-token.ts`
- `BACKEND/src/routes/hf.ts`

**Frontend:**
- `client/src/services/hf.ts`
- `client/src/components/ui/Tabs.tsx`
- `client/src/components/hf/HFSearchBar.tsx`
- `client/src/components/hf/HFCard.tsx`
- `client/src/components/hf/HFGrid.tsx`
- `client/src/pages/HFDownloadsPage.tsx`

**Modified:**
- `BACKEND/src/server.ts`
- `BACKEND/.env.example`
- `client/src/App.tsx`

---

## 🎉 Success!

If you see the downloads page with 4 tabs and can search/paginate, you're done! 🚀

**Next:** See `HF_DOWNLOADS_IMPLEMENTATION_SUMMARY.md` for full documentation.
