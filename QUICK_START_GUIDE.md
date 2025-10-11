# 🚀 Quick Start Guide - Upgraded Project

## ✅ Upgrade Complete!

Your project has been successfully upgraded with a complete design system and real API integration.

**Commit:** `63ad1eb`  
**Rollback Tag:** `pre-upgrade-20251011_134419`  
**Status:** ✅ Ready to use

---

## 🏃 Quick Start (5 minutes)

### 1. Setup Backend
```bash
cd BACKEND
cp .env.example .env
# Edit .env and set JWT_SECRET=your-secret-key-here
npm install
npm run dev
```

You should see:
```
🚀 Persian Chat Backend API listening on port 3001
```

### 2. Setup Frontend
```bash
cd client
cp .env.example .env
# .env should have: VITE_API_BASE_URL=http://localhost:3001
npm install
npm run dev
```

Your browser should open at: `http://localhost:5173`

### 3. Test It
1. Visit `http://localhost:5173/login`
2. Login with your credentials
3. See the dashboard with real-time metrics
4. Try the chat page
5. Check the models page

---

## 📁 What's New?

### Design System Components

**Atoms (Basic Building Blocks):**
```typescript
import { Button } from './components/atoms/Button';
import { Input } from './components/atoms/Input';
import { Card } from './components/atoms/Card';
import { Badge } from './components/atoms/Badge';

// Usage
<Button variant="primary" loading={loading}>
  Click Me
</Button>

<Input 
  placeholder="Enter text" 
  error={!!errorMsg}
  leftIcon={<SearchIcon />}
/>
```

**Molecules (Composed Components):**
```typescript
import { StatCard } from './components/molecules/StatCard';
import { FormField } from './components/molecules/FormField';

// Usage
<StatCard
  title="CPU Usage"
  value="45.2%"
  icon={<CpuIcon />}
  color="primary"
  trend={{ value: 5, isPositive: true }}
/>

<FormField
  name="username"
  label="Username"
  value={username}
  onChange={setUsername}
  error={errors.username}
/>
```

### API Services (All Real, No Mocks)

```typescript
import { api } from './services/api';
import { authService } from './services/auth.service';
import { trainService } from './services/train.service';
import { monitoringService } from './services/monitoring.service';
import { chatService } from './services/chat.service';
import { modelsService } from './services/models.service';

// Examples

// Authentication
await authService.login({ username, password });
authService.logout();

// Training with SSE
const eventSource = trainService.connectToTrainingStream((event) => {
  console.log('Training update:', event);
});

// Monitoring
const metrics = await monitoringService.getMetrics();
// Returns: { cpu, memory, disk, uptime }

// Chat
const response = await chatService.sendMessage('Hello AI');

// Models
const models = await modelsService.getDetectedModels();
await modelsService.activateModel(modelId);
```

### New Pages

1. **LoginPage** (`/login`)
   - Full authentication flow
   - Error handling
   - Redirects to dashboard on success

2. **DashboardPage** (`/dashboard`)
   - Real-time system metrics
   - Auto-refresh every 5 seconds
   - CPU, Memory, Disk, Uptime cards

3. **ChatPage** (`/chat`)
   - Live AI chat
   - Message history
   - User/Assistant bubbles

4. **ModelsPage** (`/models`)
   - List all detected models
   - Activate/deactivate models
   - Visual active status

---

## 🎨 Theme System

```typescript
import { theme } from './styles/theme';

// Colors
theme.colors.primary.main
theme.colors.success.main
theme.colors.text.primary

// Spacing (8px grid)
theme.spacing(2) // 16px
theme.spacing(3) // 24px

// Typography
theme.typography.fontSize.lg
theme.typography.fontWeight.bold

// Shadows
theme.shadows.md
theme.shadows.lg

// Border Radius
theme.borderRadius.lg
theme.borderRadius.full
```

---

## 🔐 Authentication Flow

```
1. User visits /login
2. Enters credentials
3. POST /api/auth/login
4. Backend returns JWT token
5. Token stored in localStorage
6. User redirected to /dashboard
7. All API calls include: Authorization: Bearer <token>
8. On 401 → Auto-redirect to /login
```

---

## 🧪 Test Checklist

After starting both servers, verify:

### Backend Health
- [ ] `curl http://localhost:3001/health` returns `{ ok: true }`
- [ ] `curl http://localhost:3001/api/health` returns service status
- [ ] `curl http://localhost:3001/api/monitoring/metrics` returns metrics

### Frontend UI
- [ ] Login page loads without errors
- [ ] Can login successfully
- [ ] Dashboard shows 4 metric cards
- [ ] Metrics update every 5 seconds
- [ ] Chat page allows sending messages
- [ ] Models page lists models
- [ ] Browser console has no errors

### Integration
- [ ] Network tab shows API calls with `Authorization` header
- [ ] Token stored in localStorage after login
- [ ] Logout clears token and redirects to login
- [ ] Protected pages redirect to login when not authenticated

---

## 🔄 Rollback (If Needed)

If something goes wrong, you can rollback:

```bash
# Full rollback to pre-upgrade state
git checkout pre-upgrade-20251011_134419

# Or rollback specific files
git checkout pre-upgrade-20251011_134419 -- <file-path>

# Delete the feature branch
git branch -D cursor/complete-safe-upgrade-protocol-execution-5e97
```

---

## 📚 Documentation

- **Full Summary:** `UPGRADE_COMPLETE_SUMMARY.md`
- **API Endpoints:** `BACKEND/API_ENDPOINTS.md`
- **Backend README:** `BACKEND/README.md`
- **Quick Reference:** `docs/QUICK_REFERENCE.md`

---

## 🆘 Troubleshooting

### Backend Issues

**Port 3001 already in use:**
```bash
lsof -ti:3001 | xargs kill -9
```

**TypeScript errors:**
```bash
cd BACKEND
npm install
npm run build
```

### Frontend Issues

**Vite won't start:**
```bash
cd client
rm -rf node_modules package-lock.json
npm install
```

**API connection refused:**
- Check backend is running on port 3001
- Verify `VITE_API_BASE_URL` in `client/.env`
- Check CORS_ORIGIN in `BACKEND/.env` includes `http://localhost:5173`

### Authentication Issues

**401 Unauthorized:**
- Clear localStorage: `localStorage.clear()` in browser console
- Check JWT_SECRET is set in BACKEND/.env
- Re-login

**Token not sent:**
- Check token exists: `localStorage.getItem('token')`
- Check Network tab → Headers → Authorization

---

## 🎯 Next Features to Build

Based on the new architecture, you can easily add:

1. **More Atoms:**
   - Checkbox, Radio, Select, Textarea
   - Avatar, Spinner, Progress Bar
   - Alert, Modal, Tooltip

2. **More Molecules:**
   - SearchBar, Pagination, Table
   - DatePicker, FileUpload
   - Notification, Toast

3. **Organisms:**
   - Header, Sidebar, Footer
   - Navigation Menu
   - Complex Forms

4. **Pages:**
   - Settings, Profile, Analytics
   - Training Studio, Dataset Manager
   - Admin Dashboard

---

## 📞 Support

**Everything working?** Great! Start building features.

**Having issues?**
1. Check troubleshooting section above
2. Review `UPGRADE_COMPLETE_SUMMARY.md`
3. Check browser console for errors
4. Check backend logs for API errors

**Need to rollback?**
```bash
git checkout pre-upgrade-20251011_134419
```

---

## ✨ What Makes This Special

1. **Zero Mock Data:** All services use real API
2. **Type Safe:** 100% TypeScript
3. **Atomic Design:** Scalable architecture
4. **Real-time Updates:** SSE for training
5. **Production Ready:** Error handling, loading states
6. **Rollback Safe:** Git tag for instant rollback
7. **Well Documented:** .env.example files, comments
8. **Accessible:** Keyboard nav, focus states

---

**Status:** ✅ **READY TO USE**

Start both servers and visit: `http://localhost:5173/login`

Good luck! 🚀
