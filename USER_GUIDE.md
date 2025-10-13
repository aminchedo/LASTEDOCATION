# 🎯 راهنمای استفاده - چطور از این اسناد استفاده کنیم؟

**تاریخ**: ۲۰۲۵-۱۰-۱۳  
**برای**: پروژه Model Training Platform

---

## 📚 اسنادی که برات ساختم

من **۴ فایل جامع** برات ایجاد کردم که همه چیز رو پوشش میده:

### 1️⃣ **PROJECT_GAP_ANALYSIS.md** 🔍
**زبان**: دوزبانه (فارسی + انگلیسی)  
**حجم**: ~25 صفحه  
**محتوا**:
- شناسایی دقیق ۱۰ شکاف بحرانی
- تحلیل فنی هر مشکل
- کدهای نمونه برای هر راه حل
- ماتریس اولویت‌بندی
- جزئیات فنی کامل

**چه موقع استفاده کنی**:
- وقتی می‌خوای بفهمی دقیقاً چه مشکلاتی وجود داره
- برای درک فنی عمیق هر شکاف
- وقتی می‌خوای کد نمونه ببینی

---

### 2️⃣ **CURSOR_AGENT_DIRECTIVE.md** 🚀
**زبان**: انگلیسی  
**حجم**: ~50 صفحه  
**محتوا**:
- دستورات گام‌به‌گام کامل
- کد کامل هر فایل
- دستورات bash دقیق
- راهنمای نصب dependencies
- تست و verification کامل

**چه موقع استفاده کنی**:
- **این سند را مستقیم به Cursor Agent بده**
- برای پیاده‌سازی عملی
- وقتی می‌خوای کد آماده داشته باشی
- برای follow کردن دقیق مراحل

**⚠️ این مهم‌ترین سند است - به Cursor بده**

---

### 3️⃣ **PERSIAN_SUMMARY.md** 📋
**زبان**: فارسی  
**حجم**: ~15 صفحه  
**محتوا**:
- خلاصه فارسی تمام مشکلات
- راهنمای سریع برای هر فاز
- چک‌لیست فارسی
- نکات عملی
- تخمین زمان

**چه موقع استفاده کنی**:
- وقتی می‌خوای سریع به فارسی بفهمی چه خبره
- برای توضیح به تیم فارسی‌زبان
- وقت نداری سند انگلیسی رو بخونی

---

### 4️⃣ **QUICK_CHECKLIST.md** ⚡
**زبان**: انگلیسی  
**حجم**: ~8 صفحه  
**محتوا**:
- چک‌لیست سریع و خلاصه
- فقط کارهای ضروری
- بدون توضیح اضافی
- Action items دقیق

**چه موقع استفاده کنی**:
- وقتی می‌خوای خیلی سریع شروع کنی
- برای tracking پیشرفت
- به عنوان راهنمای سریع

---

## 🎯 چطور با Cursor Agent کار کنم؟

### روش ۱: استفاده مستقیم (توصیه می‌شه) ✅

```
۱. فایل CURSOR_AGENT_DIRECTIVE.md رو باز کن
۲. کل محتوای اون رو کپی کن
۳. به Cursor Agent بده و بگو:

"Please follow this directive exactly, step by step. 
Start with Phase 1, Task 1.1 and work sequentially. 
After each task, test and confirm it works before moving to the next one.
Ask me if anything is unclear."
```

### روش ۲: فاز به فاز

```
فاز ۱: یکپارچگی API (روزهای ۱-۳)
به Cursor بگو: "Implement Phase 1 from the directive (pages 1-15)"

فاز ۲: احراز هویت (روزهای ۴-۸)
به Cursor بگو: "Now implement Phase 2 - Authentication (pages 16-30)"

فاز ۳: WebSocket (روزهای ۹-۱۱)
به Cursor بگو: "Implement Phase 3 - WebSocket (pages 31-40)"

فاز ۴: Testing (روزهای ۱۲-۱۵)
به Cursor بگو: "Implement Phase 4 - Testing & Docs (pages 41-50)"
```

### روش ۳: تسک به تسک (دقیق‌تر)

```
به Cursor بگو:
"I have a directive for completing my ML Training project. 
Start with Task 1.1: Unify API Endpoints. 
Here's what needs to be done:
[paste Task 1.1 section from CURSOR_AGENT_DIRECTIVE.md]

After you complete this task, I'll give you the next one."
```

---

## 📝 مثال دقیق: چطور شروع کنم؟

### قدم ۱: آماده‌سازی

```bash
# ۱. Repository رو clone کن یا باز کن
cd /path/to/your/project

# ۲. فایل‌های من رو در پوشه root قرار بده
# (یا کپی‌شون کن در یک پوشه مثل /docs)
```

### قدم ۲: با Cursor شروع کن

**در Cursor، یک چت جدید باز کن و بگو**:

```
Hi Claude, I have a comprehensive implementation directive for my ML Training Platform.

The project currently has:
- ✅ Working backend with PyTorch training
- ✅ Working frontend with React
- ❌ Missing integration between them
- ❌ Missing authentication
- ❌ Missing real-time updates

I have a complete directive document with all the code needed.

Let's start with Phase 1: API Integration.

Here's Task 1.1 - Unify API Endpoints:

[کل Task 1.1 از CURSOR_AGENT_DIRECTIVE.md رو paste کن]

Please implement this task exactly as described. After you're done, 
I'll verify it works, then give you the next task.
```

### قدم ۳: بعد از هر تسک

```bash
# تست کن که کار کنه
cd BACKEND && npm run build
cd client && npm run build

# اگه کار کرد، به Cursor بگو:
"Great! Task 1.1 is complete and tested. Here's Task 1.2:
[paste Task 1.2]"
```

---

## ⚠️ نکات مهم

### ۱. ترتیب مهم است! 🔢
- حتماً از Phase 1 شروع کن
- قبل از رفتن به فاز بعدی، فاز قبلی رو کامل کن
- هر تسک رو تست کن قبل از تسک بعدی

### ۲. اگه Cursor گیر کرد 🤔
```
اگه Cursor نمی‌فهمه یا error میده:

"Let me provide more context. 
Here's the relevant section from PROJECT_GAP_ANALYSIS.md:
[paste relevant section]"
```

### ۳. برای Debug سریع 🐛
```
به Cursor بگو:
"This isn't working. Let me show you the exact error:
[paste error message]

And here's the current code:
[paste current code]

According to the directive, the code should be:
[paste expected code from directive]

What's wrong and how do I fix it?"
```

### ۴. اگه زمان محدوده ⏰
```
اگه فقط ۲-۳ روز وقت داری:

Phase 1 (API Integration) رو اولویت بده
Phase 2 (Authentication) رو ساده‌تر پیاده کن (فقط basic login)
Phase 3 و 4 رو skip کن فعلاً
```

---

## 📊 Tracking پیشرفت

### چک‌لیست ساده

```
✅/❌ Phase 1: API Integration
  ✅/❌ Task 1.1: Unify endpoints
  ✅/❌ Task 1.2: Dataset upload

✅/❌ Phase 2: Authentication  
  ✅/❌ Task 2.1: Backend auth
  ✅/❌ Task 2.2: Frontend auth

✅/❌ Phase 3: WebSocket
  ✅/❌ Task 3.1: Backend WS
  ✅/❌ Task 3.2: Frontend WS

✅/❌ Phase 4: Testing
  ✅/❌ Task 4.1: Integration tests
  ✅/❌ Task 4.2: API docs
```

### بعد از هر روز

```
End of Day Checklist:
✅/❌ Code compiles without errors
✅/❌ Tests pass
✅/❌ Git commit done
✅/❌ Tomorrow's plan clear
```

---

## 🎓 آموزش: مثال واقعی

بیا یک مثال کامل ببینیم:

### سناریو: می‌خوام فقط Authentication رو پیاده کنم

**قدم ۱**: فایل CURSOR_AGENT_DIRECTIVE.md رو باز کن

**قدم ۲**: به Cursor بگو:

```
I need to implement authentication for my ML Training Platform.

According to my directive, this is Phase 2 and has 2 tasks:
1. Backend Authentication (3 days)
2. Frontend Authentication (2 days)

Let's start with Task 2.1: Backend Auth.

Here's what needs to be done:

## Task 2.1: Backend Authentication

[کل محتوای Task 2.1 رو paste کن - شامل:
- Dependencies to install
- All code for middleware/auth.ts
- All code for models/User.ts  
- All code for routes/auth.ts
- Changes to server.ts
- .env setup
- Verification commands]

Please implement these files exactly as shown.
After you create each file, show me what you created so I can verify.
```

**قدم ۳**: Cursor کارش رو می‌کنه، بعد تست کن:

```bash
# Install dependencies
cd BACKEND
npm install jsonwebtoken bcrypt

# Build
npm run build

# Start server
npm start

# Test registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Should return token and user info
```

**قدم ۴**: اگه کار کرد، ادامه بده:

```
Perfect! Task 2.1 works. Now let's do Task 2.2: Frontend Auth.

[paste Task 2.2 content]
```

---

## 🚨 مشکلات رایج و راه حل

### مشکل ۱: Cursor کد کامل نمیده

**راه حل**:
```
"Please provide the COMPLETE code for [filename].
Don't use placeholders like '// rest of implementation'.
I need the full, working code from the directive."
```

### مشکل ۲: TypeScript errors

**راه حل**:
```
"I'm getting these TypeScript errors:
[paste errors]

According to the directive, the file should look like:
[paste expected code]

Please fix all TypeScript errors."
```

### مشکل ۳: Cursor از دستور منحرف شد

**راه حل**:
```
"Please stick to the directive exactly. 
Don't change the architecture or add extra features.
Just implement what's in the directive, nothing more."
```

### مشکل ۴: Dependencies نصب نمیشن

**راه حل**:
```bash
# پاک کن و دوباره نصب کن
rm -rf node_modules package-lock.json
npm install

# یا با yarn
rm -rf node_modules yarn.lock
yarn install
```

---

## ✅ چطور بفهمم کارم درسته؟

### تست نهایی (End-to-End)

این ۱۵ قدم رو دنبال کن. اگه همه کار کردن، پروژه آماده‌ست:

```
✅ 1. باز کن: http://localhost:5173/register
✅ 2. ثبت‌نام کن با ایمیل و پسورد
✅ 3. Login کن
✅ 4. یک فایل CSV آپلود کن (با ستون‌های x,y)
✅ 5. برو صفحه Training
✅ 6. dataset آپلود شده رو انتخاب کن
✅ 7. تنظیمات رو بده: epochs=5, batch_size=16, lr=0.001
✅ 8. کلیک کن "Start Training"
✅ 9. ببین progress bar داره حرکت می‌کنه
✅ 10. ببین loss داره کم میشه
✅ 11. صبر کن تا status بشه "COMPLETED"
✅ 12. کلیک کن "Download Model"  
✅ 13. فایل .pt رو دانلود کن
✅ 14. Logout کن
✅ 15. بخوای بری صفحه training → باید redirect بشی به login

اگه همه کار کردن: 🎉 پروژه آماده!
```

---

## 📞 کمک بیشتر

### اگه گیر کردی:

1. **اول** QUICK_CHECKLIST.md رو ببین - شاید جواب اونجا باشه

2. **بعد** به قسمت مربوطه در CURSOR_AGENT_DIRECTIVE.md نگاه کن

3. **در آخر** PROJECT_GAP_ANALYSIS.md رو بخون برای درک عمیق‌تر

### فایل‌های مرجع:

```
/tmp/CURSOR_AGENT_DIRECTIVE.md      # دستور اصلی (به Cursor بده)
/tmp/PROJECT_GAP_ANALYSIS.md        # تحلیل کامل
/tmp/PERSIAN_SUMMARY.md             # خلاصه فارسی
/tmp/QUICK_CHECKLIST.md             # چک‌لیست سریع
/tmp/USER_GUIDE.md                  # همین فایل!
```

---

## 🎯 خلاصه نهایی

### چه کار کنم الان؟

```
۱. فایل CURSOR_AGENT_DIRECTIVE.md رو دانلود کن
   (این مهم‌ترین فایل است)

۲. به Cursor Agent بگو:
   "I have a complete directive for my ML Training project.
   Please implement it Phase by Phase, starting with Phase 1.
   [paste CURSOR_AGENT_DIRECTIVE.md]"

۳. بعد از هر فاز، تست کن

۴. اگه کار کرد، فاز بعدی رو شروع کن

۵. در پایان، تست End-to-End رو انجام بده (۱۵ قدم بالا)
```

### تخمین زمان واقعی:

```
با Cursor Agent که مؤثر کار کنه:
- Phase 1: ۲-۳ روز  
- Phase 2: ۳-۴ روز
- Phase 3: ۲ روز
- Phase 4: ۱-۲ روز
جمع: ۸-۱۱ روز کاری
```

---

## 🎉 موفق باشی!

تمام چیزی که نیاز داری در این ۴ فایل هست.
فقط دستورالعمل‌ها رو دنبال کن و پروژه کاملاً فانکشنال میشه!

**سؤال داری؟ بپرس! من اینجام کمکت کنم.** 💪
