# 🔄 راهنمای کامل Merge با Main Branch

## 📊 وضعیت فعلی

- **Branch فعلی:** `cursor/consolidate-backend-servers-and-fix-routing-c155`
- **وضعیت:** ✅ همه تغییرات commit و push شده
- **Remote:** ✅ Up to date with origin

---

## 🎯 روش پیشنهادی: GitHub Pull Request

این روش **امن‌تر** و **حرفه‌ای‌تر** است و امکان review و CI/CD checks را فراهم می‌کند.

### گام 1: ایجاد Pull Request

```bash
cd /workspace

# اگر GitHub CLI نصب است:
gh pr create \
  --title "Backend Consolidation: Fix 404 errors and consolidate servers" \
  --body-file BACKEND/BACKEND_FIX_SUMMARY.md \
  --base main \
  --head cursor/consolidate-backend-servers-and-fix-routing-c155
```

**یا از رابط وب GitHub:**
1. برو به: https://github.com/aminchedo/LASTEDOCATION
2. کلیک روی "Compare & pull request"
3. عنوان: `Backend Consolidation: Fix 404 errors and consolidate servers`
4. توضیحات را از `BACKEND_FIX_COMPLETE.md` کپی کن
5. کلیک "Create Pull Request"

### گام 2: بررسی و Merge

```bash
# مشاهده PR در مرورگر
gh pr view --web

# بعد از بررسی، merge با squash (پیشنهادی)
gh pr merge --squash --delete-branch

# یا merge معمولی
gh pr merge --merge --delete-branch
```

---

## ⚡ روش سریع: Direct Merge (فقط برای موارد اضطراری)

⚠️ **توجه:** این روش بدون review مستقیماً merge می‌کند!

### دستورات دستی:

```bash
cd /workspace

# 1. Fetch آخرین تغییرات
git fetch origin

# 2. Checkout به main
git checkout main

# 3. Pull آخرین تغییرات main
git pull origin main

# 4. Merge با branch فعلی
git merge cursor/consolidate-backend-servers-and-fix-routing-c155 \
  --no-ff \
  -m "Merge: Backend consolidation - Fix 404 errors and consolidate servers

- Remove 4 duplicate server files (proxy.ts, simple-server.js, etc)
- Add 4 missing routes: STT, TTS, Search, Notifications
- Improve error handling with 404 and global error handlers
- Standardize logger usage (Pino throughout)
- Fix package.json build paths
- Add .env.example for configuration

All tests passing. Backend now runs with single unified server on port 3001.

Routes added:
- POST /api/stt - Speech-to-Text
- POST /api/tts - Text-to-Speech  
- POST /api/search - Search service
- GET /api/notifications - Notifications

Closes #[issue-number]"

# 5. اگر conflict نبود، push کن
git push origin main

# 6. حذف branch (اختیاری)
git branch -d cursor/consolidate-backend-servers-and-fix-routing-c155
git push origin --delete cursor/consolidate-backend-servers-and-fix-routing-c155
```

### یا استفاده از اسکریپت:

```bash
# اجرای اسکریپت آماده
bash /tmp/direct_merge.sh
```

---

## 🔍 بررسی قبل از Merge

### چک کردن تفاوت‌ها با main:

```bash
# فقط نام فایل‌های تغییر یافته
git fetch origin main
git diff --name-only origin/main...HEAD

# مشاهده کامل تغییرات
git diff origin/main...HEAD

# آمار تغییرات
git diff --stat origin/main...HEAD
```

### چک کردن conflicts احتمالی:

```bash
git fetch origin main
git merge-base HEAD origin/main
git merge-tree $(git merge-base HEAD origin/main) origin/main HEAD
```

---

## ✅ Checklist قبل از Merge

- [x] همه تغییرات commit شده‌اند
- [x] TypeScript بدون خطا compile می‌شود (`npm run lint`)
- [x] Server با موفقیت اجرا می‌شود (`npm start`)
- [x] همه endpoints تست شده‌اند
- [x] مستندات کامل (`BACKEND_FIX_SUMMARY.md`)
- [x] .env.example ایجاد شده
- [x] فایل‌های اضافی پاک شده‌اند
- [ ] Conflicts با main بررسی شده (در صورت نیاز)
- [ ] CI/CD checks پاس شده (در صورت وجود)

---

## 🎯 خلاصه تغییرات برای Commit Message

```
Backend Consolidation: Fix 404 errors and consolidate servers

## Changes:
- Removed 4 duplicate server files causing port conflicts
- Added 4 missing routes (STT, TTS, Search, Notifications)
- Improved error handling (404 handler + global error handler)
- Standardized logger usage (Pino throughout)
- Fixed package.json build paths
- Added .env.example

## Files Changed:
Deleted:
  - BACKEND/proxy.ts
  - BACKEND/simple-server.js
  - BACKEND/src/proxy-server.ts
  - BACKEND/test-proxy.js

Modified:
  - BACKEND/src/server.ts (added 4 routes)
  - BACKEND/src/utils/logger.ts (enhanced)
  - BACKEND/package.json (fixed paths)

Added:
  - BACKEND/.env.example
  - BACKEND/BACKEND_FIX_SUMMARY.md
  - BACKEND_FIX_COMPLETE.md

## Testing:
✅ TypeScript compilation successful
✅ All endpoints tested and working
✅ Health checks passing for all services
✅ No 404 errors

## Routes Added:
- POST /api/stt - Speech-to-Text service
- POST /api/tts - Text-to-Speech service
- POST /api/search - Search service
- GET /api/notifications - Notifications (protected)

Backend now runs with single unified server on port 3001.
```

---

## 🆘 اگر مشکلی پیش آمد

### Conflict Resolution:

اگر conflict پیدا شد:

```bash
# 1. مشاهده فایل‌های conflict دار
git status

# 2. ویرایش فایل‌ها و حل conflict
# (markers <<<<<<< ======= >>>>>>> را پیدا کنید)

# 3. بعد از حل:
git add <conflicted-files>
git commit -m "Resolve merge conflicts"

# 4. ادامه merge
git push origin main
```

### لغو Merge (در صورت نیاز):

```bash
# اگر merge شروع شده ولی کامل نشده:
git merge --abort

# برگشت به وضعیت قبل:
git reset --hard HEAD^
```

---

## 📞 پشتیبانی

اگر سوالی دارید یا کمکی نیاز دارید:

1. مستندات کامل: `BACKEND/BACKEND_FIX_SUMMARY.md`
2. خلاصه تغییرات: `BACKEND_FIX_COMPLETE.md`
3. وضعیت git: `git status`
4. لیست تغییرات: `git diff --stat origin/main...HEAD`

---

## 🎉 بعد از Merge موفق

```bash
# 1. Checkout به main
git checkout main

# 2. Pull آخرین تغییرات
git pull origin main

# 3. تست Backend
cd BACKEND
npm install
npm run build
npm start

# 4. تست endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/health
curl http://localhost:3001/api/stt/health
```

---

**✨ موفق باشید! همه تغییرات Backend آماده merge هستند.**

Repository: https://github.com/aminchedo/LASTEDOCATION
Branch: cursor/consolidate-backend-servers-and-fix-routing-c155 → main
