# 🚀 Quick Start Guide
# راهنمای شروع سریع

**پس از برطرف کردن شکاف‌ها** - سیستم کاملاً آماده است!

---

## 📋 پیش‌نیازها / Prerequisites

### نصب ابزارهای مورد نیاز:

1. **Node.js** (v18 یا بالاتر)
   ```bash
   node --version  # باید >= 18
   ```

2. **Python** (v3.8 یا بالاتر)
   ```bash
   python3 --version  # یا python --version
   ```

3. **PyTorch** (برای training واقعی)
   ```bash
   pip install torch numpy requests
   ```

4. **npm/yarn** (برای dependency management)
   ```bash
   npm --version
   ```

---

## 🔧 نصب و راه‌اندازی / Installation & Setup

### گام 1: Clone Repository
```bash
git clone <repository-url>
cd <project-directory>
```

### گام 2: نصب Dependencies

#### Backend:
```bash
cd BACKEND
npm install
```

#### Frontend:
```bash
cd ../client
npm install
```

### گام 3: تنظیم Environment Variables

فایل‌های `.env` از قبل ایجاد شده‌اند! فقط بررسی کنید:

```bash
# بررسی BACKEND/.env
cat BACKEND/.env

# بررسی client/.env
cat client/.env
```

اگر نیاز به تغییر دارید، فایل‌ها را ویرایش کنید.

---

## ▶️ اجرای سیستم / Running the System

### روش 1: اجرای دستی (توصیه می‌شود برای توسعه)

#### Terminal 1 - Backend:
```bash
cd BACKEND
npm run dev
```

خروجی مورد انتظار:
```
🚀 Persian Chat Backend API listening on port 3001
📡 Health check: http://localhost:3001/health
🔐 Auth endpoint: http://localhost:3001/api/auth/login
💬 Chat endpoint: http://localhost:3001/api/chat
🔌 WebSocket server ready
🎯 All routes registered successfully
```

#### Terminal 2 - Frontend:
```bash
cd client
npm run dev
```

خروجی مورد انتظار:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### روش 2: استفاده از اسکریپت‌های موجود (Windows)

```bash
# اجرای همزمان Backend + Frontend
run-dev.bat

# یا
run-servers.bat
```

---

## 🧪 تست سیستم / Testing the System

### تست 1: Health Check
```bash
curl http://localhost:3001/health
```

پاسخ مورد انتظار:
```json
{
  "ok": true,
  "timestamp": "...",
  "service": "persian-chat-backend"
}
```

### تست 2: اجرای تست یکپارچگی کامل
```bash
cd tests
./integration-test.sh
```

این اسکریپت تست می‌کند:
- ✅ Health check
- ✅ User registration
- ✅ User login
- ✅ Protected endpoints
- ✅ Training job creation
- ✅ Job status monitoring
- ✅ List jobs

---

## 🎯 استفاده از سیستم / Using the System

### 1. دسترسی به Frontend
مرورگر را باز کنید و به آدرس زیر بروید:
```
http://localhost:5173
```

### 2. ثبت‌نام کاربر جدید
1. روی "Register" کلیک کنید
2. ایمیل، رمز عبور و نام خود را وارد کنید
3. روی "Register" کلیک کنید

**نکته**: اولین کاربری که ثبت‌نام می‌کند، نقش Admin دارد.

### 3. ورود به سیستم
1. ایمیل و رمز عبور خود را وارد کنید
2. روی "Login" کلیک کنید
3. به داشبورد هدایت می‌شوید

### 4. آپلود Dataset
1. به صفحه "Datasets" بروید
2. روی "Upload Dataset" کلیک کنید
3. فایل `.csv`, `.json`, یا `.jsonl` خود را انتخاب کنید
4. روی "Upload" کلیک کنید

**فرمت مورد انتظار** (CSV):
```csv
x,y
1.0,2.0
2.0,4.0
3.0,6.0
```

### 5. ایجاد Training Job
1. به صفحه "Training" بروید
2. پارامترها را تنظیم کنید:
   - Dataset: انتخاب dataset آپلود شده
   - Epochs: 3-10
   - Batch Size: 16-32
   - Learning Rate: 0.001-0.01
3. روی "Start Training" کلیک کنید

### 6. مشاهده پیشرفت Real-time
- بعد از شروع training، پیشرفت به صورت real-time نمایش داده می‌شود
- WebSocket به صورت خودکار به job شما متصل می‌شود
- میزان پیشرفت، loss، epoch فعلی را مشاهده می‌کنید

### 7. دانلود مدل آموزش‌دیده
1. بعد از تکمیل training (status: COMPLETED)
2. روی "Download Model" کلیک کنید
3. فایل `.pt` (PyTorch checkpoint) دانلود می‌شود

---

## 📡 API Endpoints (برای توسعه‌دهندگان)

### Authentication:
- `POST /api/auth/register` - ثبت‌نام
- `POST /api/auth/login` - ورود
- `POST /api/auth/verify` - تأیید token
- `GET /api/auth/me` - اطلاعات کاربر فعلی

### Training:
- `POST /api/training` - ایجاد job
- `GET /api/training/status?job_id=X` - وضعیت job
- `POST /api/training/:jobId/stop` - توقف job
- `GET /api/training/jobs` - لیست jobs
- `GET /api/training/:jobId/download` - دانلود مدل

### Datasets:
- `GET /api/datasets` - لیست datasets
- `POST /api/datasets/upload` - آپلود dataset
- `GET /api/datasets/:id` - دریافت dataset
- `DELETE /api/datasets/:id` - حذف dataset

### Experiments:
- `GET /api/experiments` - لیست آزمایش‌ها
- `POST /api/experiments` - ایجاد آزمایش
- `POST /api/experiments/:id/start` - شروع
- `POST /api/experiments/:id/stop` - توقف

**مستندات کامل API**: http://localhost:3001/api-docs (Swagger)

---

## 🔐 احراز هویت در API Calls

همه endpoints محافظت شده نیاز به header زیر دارند:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

مثال:
```bash
curl -X GET http://localhost:3001/api/training/jobs \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🌐 WebSocket Connection

Frontend به صورت خودکار به WebSocket متصل می‌شود.

برای استفاده دستی:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

// Subscribe to job updates
socket.emit('subscribe_job', 'job_123456');

// Listen for updates
socket.on('job_update', (status) => {
  console.log('Job status:', status);
});
```

---

## 🐛 عیب‌یابی / Troubleshooting

### مشکل 1: Backend شروع نمی‌شود
```bash
# بررسی پورت در حال استفاده
lsof -i :3001  # Mac/Linux
netstat -ano | findstr :3001  # Windows

# Kill process اگر لازم است
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

### مشکل 2: Frontend به Backend متصل نمی‌شود
بررسی کنید `client/.env`:
```bash
VITE_API_BASE_URL=http://localhost:3001
```

### مشکل 3: Training job شروع نمی‌شود
بررسی کنید PyTorch نصب است:
```bash
python3 -c "import torch; print(torch.__version__)"
```

اگر نصب نیست:
```bash
pip install torch numpy requests
```

### مشکل 4: WebSocket متصل نمی‌شود
1. بررسی کنید Backend در حال اجرا است
2. بررسی کنید CORS settings صحیح است
3. بررسی کنید token معتبر است

### مشکل 5: "User Model not found" error
این مشکل برطرف شده است! اگر همچنان می‌بینید:
```bash
# بررسی فایل وجود دارد
ls -la BACKEND/src/models/User.ts

# اگر وجود ندارد، از git pull کنید
git pull origin main
```

---

## 📊 نظارت بر سیستم / Monitoring

### Logs مشاهده کنید:

Backend logs:
```bash
# در terminal که backend اجرا می‌شود
# Logs به صورت real-time نمایش داده می‌شود
```

Job status files:
```bash
# وضعیت jobs در فایل‌های JSON ذخیره می‌شود
ls -la artifacts/jobs/
cat artifacts/jobs/job_*.json
```

User database:
```bash
# کاربران در فایل JSON ذخیره می‌شوند
cat data/users.json
```

---

## 📚 منابع اضافی / Additional Resources

- 📖 [GAP_ANALYSIS_COMPLETION_REPORT.md](./GAP_ANALYSIS_COMPLETION_REPORT.md) - گزارش کامل شکاف‌ها
- 📖 [README.md](./README.md) - مستندات اصلی پروژه
- 📖 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - راهنمای deployment
- 🔗 Swagger API Docs: http://localhost:3001/api-docs

---

## ✅ Checklist راه‌اندازی

- [ ] Node.js نصب شده (v18+)
- [ ] Python نصب شده (v3.8+)
- [ ] PyTorch نصب شده
- [ ] Dependencies نصب شده (`npm install` در Backend و Frontend)
- [ ] `.env` files بررسی شده
- [ ] Backend در حال اجرا است (port 3001)
- [ ] Frontend در حال اجرا است (port 5173)
- [ ] Health check موفق است
- [ ] Integration test موفق است
- [ ] ثبت‌نام/ورود کار می‌کند
- [ ] Training job ایجاد می‌شود
- [ ] Real-time updates کار می‌کند

---

## 🎉 شروع کنید!

سیستم آماده است! می‌توانید:

1. **کاربر ثبت‌نام کنید** → `http://localhost:5173/register`
2. **Dataset آپلود کنید** → بخش Datasets
3. **Training Job ایجاد کنید** → بخش Training
4. **پیشرفت را مشاهده کنید** → Real-time WebSocket updates
5. **مدل را دانلود کنید** → بعد از اتمام training

**موفق باشید!** 🚀

---

**آخرین بروزرسانی / Last Updated**: 2025-10-13  
**نسخه / Version**: 1.0.0
