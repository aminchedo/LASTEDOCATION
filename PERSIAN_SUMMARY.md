# 📋 خلاصه فارسی: کمبودها و راه حل‌ها

**تاریخ**: ۲۰۲۵-۱۰-۱۳  
**وضعیت**: نیاز به تکمیل دارد

---

## 🎯 مشکل اصلی

پروژه شما دو سیستم جداگانه دارد که به هم متصل نیستند:
1. **Frontend** - رابط کاربری (React + TypeScript)
2. **Backend** - سیستم آموزش مدل (Node.js + PyTorch)

---

## 🚨 ۱۰ کمبود بحرانی

### ۱. یکپارچگی Frontend-Backend ❌
**مشکل**: Frontend و Backend با API های مختلف کار می‌کنند
- Frontend: `/api/experiments`
- Backend: `/api/training`

**راه حل**: 
- همه را به `/api/training` تغییر بدهید
- فایل `experiments.service.ts` را به `training.service.ts` تغییر نام دهید

---

### ۲. سیستم احراز هویت ❌
**مشکل**: هیچ سیستم Login/Register وجود ندارد

**راه حل**:
- پیاده‌سازی JWT authentication
- صفحات Login و Register
- محافظت از تمام APIها

**فایل‌های مورد نیاز**:
```
BACKEND/src/
├── middleware/auth.ts      # JWT middleware
├── models/User.ts          # User model
└── routes/auth.ts          # Login/Register endpoints

client/src/
├── contexts/AuthContext.tsx    # Auth state management
├── services/auth.service.ts    # Auth API calls
├── pages/LoginPage.tsx         # Login UI
└── pages/RegisterPage.tsx      # Register UI
```

---

### ۳. WebSocket برای Real-time ❌
**مشکل**: پیشرفت training به صورت real-time نمایش داده نمی‌شود

**راه حل**:
- پیاده‌سازی Socket.io در Backend
- استفاده از WebSocket در Frontend
- نمایش پیشرفت لحظه‌ای

**مراحل**:
1. نصب `socket.io` در Backend
2. نصب `socket.io-client` در Frontend
3. اتصال WebSocket با JWT token
4. Subscribe کردن به job updates

---

### ۴. مدیریت Dataset ناقص ⚠️
**مشکل**: کاربر نمی‌تواند dataset آپلود کند و استفاده کند

**راه حل**:
- API برای آپلود فایل
- لیست datasets در UI
- انتخاب dataset در فرم training

---

### ۵. تست Integration ❌
**مشکل**: تست‌های end-to-end وجود ندارد

**راه حل**:
- نوشتن integration tests
- تست کامل از Login تا Training
- CI/CD pipeline

---

### ۶. Database بجای File ⚠️
**مشکل**: اطلاعات در فایل ذخیره می‌شود

**راه حل** (اختیاری):
- Migration به PostgreSQL
- بهبود performance و scalability

---

### ۷. Monitoring و Logging ❌
**مشکل**: هیچ سیستم monitoring وجود ندارد

**راه حل** (اختیاری):
- Prometheus + Grafana
- Centralized logging
- Error tracking (Sentry)

---

### ۸. Configuration Management ضعیف ⚠️
**مشکل**: تنظیمات production/development مجزا نیست

**راه حل**:
- Environment variables مناسب
- Secret management
- Docker configuration

---

### ۹. Model Management ❌
**مشکل**: مدیریت نسخه‌های مختلف model وجود ندارد

**راه حل** (اختیاری):
- Model versioning
- Model registry
- Comparison tools

---

### ۱۰. API Documentation ❌
**مشکل**: مستندات API ناقص است

**راه حل**:
- Swagger/OpenAPI
- Interactive API docs
- SDK generation

---

## 📊 اولویت‌بندی

### 🔴 فوری (هفته ۱)
1. **یکپارچگی API** - ۲-۳ روز
2. **احراز هویت** - ۳-۴ روز
3. **Dataset Management** - ۱-۲ روز

### 🟡 مهم (هفته ۲)
4. **WebSocket** - ۲-۳ روز
5. **Testing** - ۳-۴ روز

### 🟢 خوب است (هفته ۳+)
6. Database Migration
7. Monitoring System
8. API Documentation

---

## 🎯 مراحل پیاده‌سازی

### فاز ۱: یکپارچگی (Week 1)

**مرحله ۱**: وحدت API Endpoints
```bash
# Backend
mv trainJobsAPI.ts training.ts
# در server.ts
app.use('/api/training', trainingRoutes);

# Frontend
mv experiments.service.ts training.service.ts
# همه endpoint ها را به /api/training تغییر بده
```

**مرحله ۲**: آپلود Dataset
```bash
# Backend
# ایجاد /api/datasets/upload endpoint
# استفاده از multer برای file upload

# Frontend
# کامپوننت DatasetUpload
# انتخاب dataset در TrainingForm
```

---

### فاز ۲: احراز هویت (Week 1-2)

**Backend**:
```bash
npm install jsonwebtoken bcrypt
```

فایل‌های جدید:
- `middleware/auth.ts` - JWT middleware
- `models/User.ts` - User model
- `routes/auth.ts` - Login/Register

**Frontend**:
```bash
npm install jwt-decode
```

فایل‌های جدید:
- `contexts/AuthContext.tsx`
- `services/auth.service.ts`
- `pages/LoginPage.tsx`
- `pages/RegisterPage.tsx`

---

### فاز ۳: WebSocket (Week 2)

**Backend**:
```bash
npm install socket.io
```

فایل‌های جدید:
- `services/websocket.service.ts`
- تغییر در `server.ts` برای http.createServer

**Frontend**:
```bash
npm install socket.io-client
```

فایل‌های جدید:
- `hooks/useJobWebSocket.ts`
- `components/training/TrainingMonitor.tsx`

---

## ✅ Acceptance Criteria

پروژه زمانی **کامل** است که:

### عملکردی
- [ ] کاربر می‌تواند ثبت‌نام و login کند
- [ ] کاربر می‌تواند dataset آپلود کند
- [ ] کاربر می‌تواند training job ایجاد کند
- [ ] پیشرفت training به صورت real-time نمایش داده شود
- [ ] کاربر می‌تواند job را stop کند
- [ ] کاربر می‌تواند model را download کند

### فنی
- [ ] TypeScript بدون error کامپایل شود
- [ ] تمام تست‌ها pass شوند
- [ ] تمام routes محافظت شده باشند
- [ ] WebSocket اتصال دوباره برقرار کند
- [ ] Error handling در همه جا وجود داشته باشد

---

## 🚀 دستورات اجرا

```bash
# ۱. نصب dependencies
cd BACKEND && npm install
cd ../client && npm install

# ۲. Build backend
cd BACKEND && npm run build

# ۳. تنظیم environment
cp .env.example .env
# ویرایش .env

# ۴. اجرای backend
PORT=3001 node dist/src/server.js

# ۵. Build frontend
cd client && npm run build

# ۶. اجرای frontend
npx serve -s dist -p 5173
```

---

## 📞 راهنمای سریع

### برای Backend Developer

**فایل‌های اصلی که باید کار کنید**:
```
BACKEND/src/
├── middleware/auth.ts          # ایجاد کنید
├── models/User.ts              # ایجاد کنید
├── routes/
│   ├── auth.ts                 # ایجاد کنید
│   ├── training.ts             # تغییر نام از trainJobsAPI.ts
│   └── datasets.ts             # تکمیل کنید
├── services/
│   └── websocket.service.ts    # ایجاد کنید
└── server.ts                   # تغییرات اساسی
```

### برای Frontend Developer

**فایل‌های اصلی که باید کار کنید**:
```
client/src/
├── contexts/
│   └── AuthContext.tsx         # ایجاد کنید
├── services/
│   ├── auth.service.ts         # ایجاد کنید
│   ├── training.service.ts     # تغییر نام از experiments.service.ts
│   └── datasets.service.ts     # تکمیل کنید
├── hooks/
│   └── useJobWebSocket.ts      # ایجاد کنید
├── pages/
│   ├── LoginPage.tsx           # ایجاد کنید
│   ├── RegisterPage.tsx        # ایجاد کنید
│   └── TrainingPage.tsx        # تغییرات اساسی
└── components/
    └── training/
        ├── TrainingForm.tsx    # تکمیل کنید
        └── TrainingMonitor.tsx # ایجاد کنید
```

---

## 💡 نکات مهم

### برای Cursor Agent

وقتی این دستور را به Cursor Agent می‌دهید:

1. **یک فاز در هر زمان**: 
   - اول فاز ۱ را کامل کنید
   - بعد فاز ۲، و الی آخر

2. **بعد از هر تغییر تست کنید**:
   - `npm run build` بدون error
   - API endpoints کار کنند
   - UI بدون crash باز شود

3. **Git commit های منظم**:
   - بعد از هر task
   - با message های واضح

4. **Documentation به‌روز**:
   - هر تغییری را مستند کنید
   - مثال‌های استفاده اضافه کنید

---

## 🎯 تخمین زمان کلی

| فاز | زمان تقریبی |
|-----|-------------|
| فاز ۱: یکپارچگی | ۵-۷ روز |
| فاز ۲: احراز هویت | ۳-۵ روز |
| فاز ۳: WebSocket | ۲-۳ روز |
| فاز ۴: Testing | ۲-۳ روز |
| **جمع کل** | **۱۲-۱۸ روز کاری** |

---

## 📁 فایل‌های مرجع

دو فایل اصلی را به Cursor Agent بدهید:

1. **`CURSOR_AGENT_DIRECTIVE.md`** (انگلیسی، جزئیات کامل)
   - دستورات گام‌به‌گام
   - کدهای کامل
   - مثال‌های واقعی

2. **`PROJECT_GAP_ANALYSIS.md`** (دوزبانه، تحلیل)
   - شناسایی شکاف‌ها
   - کدهای نمونه
   - راه حل‌های فنی

---

## ✅ چک‌لیست نهایی

قبل از deploy، این موارد را چک کنید:

### Backend
- [ ] TypeScript بدون error کامپایل می‌شود
- [ ] تمام endpoints با Postman/curl تست شده‌اند
- [ ] JWT authentication کار می‌کند
- [ ] WebSocket اتصال برقرار می‌کند
- [ ] فایل‌ها در دایرکتوری صحیح ذخیره می‌شوند

### Frontend
- [ ] Build بدون error
- [ ] Login/Register کار می‌کند
- [ ] Dataset upload موفق است
- [ ] Training job ایجاد می‌شود
- [ ] پیشرفت real-time نمایش داده می‌شود
- [ ] Download model کار می‌کند

### Integration
- [ ] کل flow از login تا download model کار می‌کند
- [ ] Error handling درست است
- [ ] Loading states نمایش داده می‌شوند
- [ ] WebSocket reconnect می‌کند

---

## 🎉 پایان

با اجرای این دستورات، پروژه شما **کاملاً فانکشنال** خواهد شد!

موفق باشید! 🚀
