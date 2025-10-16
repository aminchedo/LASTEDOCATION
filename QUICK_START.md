# 🚀 Quick Start Guide - Persian AI Training Platform

## Prerequisites
- Node.js >= 16
- PostgreSQL >= 13
- npm or yarn

## 1. Install Dependencies

```bash
# Backend
cd BACKEND
npm install

# Frontend
cd ../client
npm install
```

## 2. Configure Environment

### Backend (.env already created at `BACKEND/.env`):
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/persian_tts
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### Frontend (.env already created at `client/.env`):
```env
VITE_API_BASE_URL=http://localhost:3001
```

## 3. Database Setup

```bash
# Create database
createdb persian_tts

# Run migrations (if schema exists)
psql persian_tts < BACKEND/src/database/schema.sql
```

## 4. Start Development Servers

### Terminal 1 - Backend:
```bash
cd BACKEND
npm run dev
# Server runs on http://localhost:3001
```

### Terminal 2 - Frontend:
```bash
cd client
npm run dev
# App runs on http://localhost:5173
```

## 5. Access the Application

Open your browser to: **http://localhost:5173**

Default credentials (if seeded):
- Username: `admin`
- Password: `admin123`

## Build for Production

```bash
# Backend
cd BACKEND
npm run build
npm start

# Frontend
cd client
npm run build
# Serve the dist/ folder with your preferred static server
```

## Verify Installation

```bash
# Check backend build
cd BACKEND && npm run build

# Check frontend build
cd ../client && npm run build

# Both should complete with ✅ SUCCESS
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Database Connection Error
1. Ensure PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL in `.env`
3. Verify database exists: `psql -l | grep persian_tts`

### Build Errors
1. Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
2. Clear cache: `npm cache clean --force`
3. Check Node version: `node -v` (should be >= 16)

## Features Available

✅ **Authentication**: Login/logout with JWT
✅ **Persian Chat**: AI-powered Persian conversation
✅ **Model Hub**: Download and manage AI models
✅ **Training**: Start and monitor training jobs
✅ **Dashboard**: System metrics and monitoring
✅ **Settings**: Customize app preferences

## Next Steps

1. Explore the dashboard at `/dashboard`
2. Download a model from `/models`
3. Start a training job at `/training`
4. Chat in Persian at `/chat`

**Happy Coding! 🎉**
