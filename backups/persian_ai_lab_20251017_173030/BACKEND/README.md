# Persian Chat Backend

A fully functional TypeScript/Express.js backend for Persian language AI applications.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
npm install
```

### Development Mode
```bash
# Start with hot reload
npm run dev

# Or use the batch file on Windows
start-dev.bat
```

### Production Mode
```bash
# Build TypeScript
npm run build

# Start production server
npm start

# Or use the batch file on Windows
start-server.bat
```

## 📡 API Endpoints

### Health Checks
- `GET /health` - Basic health check
- `GET /api/health` - Detailed service health

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Token verification
- `POST /api/auth/logout` - User logout

### Chat & AI
- `POST /api/chat` - Persian chat endpoint
- `POST /api/stt` - Speech-to-text
- `POST /api/tts` - Text-to-speech

### Model Management
- `GET /api/sources/catalog` - Browse model catalog
- `POST /api/sources/download` - Download models
- `GET /api/sources/downloads` - List downloads

### Training & Monitoring
- `POST /api/train/start` - Start model training
- `GET /api/train/status` - Training status
- `GET /api/monitoring/metrics` - System metrics

## 🔧 Configuration

Environment variables (optional):
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
CUSTOM_API_ENDPOINT=https://api.example.com
CUSTOM_API_KEY=your-api-key
```

## 🏗️ Architecture

### Core Components
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **JWT** - Authentication
- **Zod** - Input validation
- **Pino** - Structured logging

### Services
- **PersianLLMService** - Persian language processing
- **STTService** - Speech recognition
- **TTSService** - Text-to-speech
- **MonitoringService** - System metrics
- **DatabaseService** - JSON-based data storage

### Features
- ✅ Persian language support
- ✅ Real-time training monitoring
- ✅ Model download management
- ✅ Audio processing (STT/TTS)
- ✅ System monitoring
- ✅ Authentication & authorization
- ✅ Error handling & logging

## 🧪 Testing

Test all endpoints:
```bash
node test-endpoints.js
```

## 📁 Project Structure

```
src/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── routes/          # API route handlers
├── services/        # Business logic
├── training/        # Training system
├── types/           # TypeScript types
└── utils/           # Utility functions
```

## 🔒 Security

- JWT-based authentication
- Input validation with Zod
- CORS protection
- Rate limiting
- File upload restrictions

## 📊 Monitoring

- Real-time system metrics
- Request/response logging
- Error tracking
- Performance monitoring

## 🌐 Persian Language Support

- Persian text processing
- Persian datasets integration
- Persian TTS voices
- Persian STT models
- Persian chat responses

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3001
CMD ["npm", "start"]
```

## 📝 API Documentation

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-10-12T21:00:59.325Z",
    "version": "1.0.0"
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Change port in .env or use different port
   PORT=3002 npm start
   ```

2. **TypeScript compilation errors**
   ```bash
   # Clean and rebuild
   rm -rf dist/
   npm run build
   ```

3. **Missing dependencies**
   ```bash
   # Reinstall dependencies
   rm -rf node_modules/
   npm install
   ```

## 📞 Support

For issues and questions:
- Check the logs in `logs/` directory
- Review error messages in console
- Test individual endpoints

## 🎯 Status

✅ **Fully Functional** - All core features working
- TypeScript compilation: ✅
- Server startup: ✅
- API endpoints: ✅
- Authentication: ✅
- Persian language support: ✅
- Model management: ✅
- Training system: ✅
- Monitoring: ✅

The backend is ready for production use!